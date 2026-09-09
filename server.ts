import 'dotenv/config';
import express, { Request, Response, Application } from 'express';
import { spawn, execSync, ChildProcess } from 'child_process';
import { MongoClient, ObjectId, Document, Filter, Sort, Db, FindCursor, WithId } from 'mongodb';
import type { Server } from 'http';
import fs from 'fs';
import path from 'path';

// ── 환경 변수 ──────────────────────────────────────────────────────────────────

const PORT: string = process.env.PORT ?? '3111';
const DB_HOST: string | undefined = process.env.DB_HOST;
const DB_PORT: string = process.env.DB_PORT ?? '27017';
const DB_DATABASE: string | undefined = process.env.DB_DATABASE;
const DB_USER_NAME: string | undefined = process.env.DB_USER_NAME;
const DB_USER_PASSWORD: string | undefined = process.env.DB_USER_PASSWORD;
const COLLECTION_MAPPING_FILE: string = process.env.COLLECTION_MAPPING_FILE ?? './collection-mapping.md';
const COLLECTION_INDEX_FILE: string = './index.md';
const COLLECTIONS_DIR: string = path.resolve(import.meta.dirname, 'collections');

if (!DB_HOST || !DB_DATABASE || !DB_USER_NAME || !DB_USER_PASSWORD) {
  console.error('필수 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
  process.exit(1);
}

const MONGO_URI: string = `mongodb://${DB_USER_NAME}:${DB_USER_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}?authSource=admin`;

// ── 타입 정의 ──────────────────────────────────────────────────────────────────

type Projection = Record<string, 0 | 1 | boolean>;

interface QueryParams {
  database: string;
  collection: string;
  filter: Document;
  projection: Projection;
  sort?: Sort;
}

interface DbQueryBody {
  requestId?: string;
  database?: string;
  collection?: string;
  filter?: Document;
  projection?: Projection;
  sort?: Sort;
  limit?: number;
}

interface DbExportBody {
  requestId: string;
}

interface ChatBody {
  message?: string;
  requestId?: string;
}

interface CancelBody {
  requestId: string;
}

type SseEventType = 'progress' | 'log' | 'result' | 'error' | 'cancelled';
type SendFn = (type: SseEventType, msg: string) => void;

// Claude stream-json 이벤트 타입
interface ClaudeToolUseBlock {
  type: 'tool_use';
  name: string;
  input?: { command?: string };
}

interface ClaudeSystemEvent {
  type: 'system';
}

interface ClaudeAssistantEvent {
  type: 'assistant';
  message?: { content?: ClaudeToolUseBlock[] };
}

interface ClaudeToolResultContent {
  content?: string;
  text?: string;
}

interface ClaudeToolResultEvent {
  type: 'tool_result';
  content?: ClaudeToolResultContent[];
}

interface ClaudeResultEvent {
  type: 'result';
  subtype: string;
  result?: string;
  cost_usd?: number;
}

type ClaudeEvent =
  | ClaudeSystemEvent
  | ClaudeAssistantEvent
  | ClaudeToolResultEvent
  | ClaudeResultEvent;

// ── 컬렉션 인덱스 로드 ─────────────────────────────────────────────────────────

let collectionIndex: string = '';
let collectionUpdatedAt: string = '';

try {
  collectionIndex = fs.readFileSync(path.resolve(COLLECTION_INDEX_FILE), 'utf-8');
  const match: RegExpMatchArray | null = collectionIndex.match(/최종 업데이트[：:]\s*(.+)/);
  if (match) collectionUpdatedAt = match[1].trim();
} catch {
  console.warn(`컬렉션 인덱스 파일을 읽을 수 없습니다: ${COLLECTION_INDEX_FILE}`);
  try {
    collectionIndex = fs.readFileSync(path.resolve(COLLECTION_MAPPING_FILE), 'utf-8');
  } catch {
    console.warn(`컬렉션 매핑 파일도 읽을 수 없습니다: ${COLLECTION_MAPPING_FILE}`);
  }
}

function loadCollectionIndex(): string {
  try {
    const content: string = fs.readFileSync(path.resolve(COLLECTION_INDEX_FILE), 'utf-8');
    const match: RegExpMatchArray | null = content.match(/최종 업데이트[：:]\s*(.+)/);
    if (match) collectionUpdatedAt = match[1].trim();
    return content;
  } catch {
    return collectionIndex;
  }
}

function buildCollectionSummary(): string {
  const lines: string[] = loadCollectionIndex().split('\n');
  const result: string[] = [];
  for (const line of lines) {
    const match: RegExpMatchArray | null = line.match(/\|\s*`([^`]+)`\s*\|\s*([^|]+)\|/);
    if (match) result.push(`${match[1].trim()} — ${match[2].trim()}`);
  }
  return result.join('\n');
}

function buildSystemPrompt(requestId: string): string {
  return `당신은 MongoDB 데이터 조회 어시스턴트입니다.

[사용 가능한 데이터베이스 및 컬렉션]
${buildCollectionSummary()}

[상세 필드 참조]
쿼리 전 정확한 필드명이 필요하면 아래 명령으로 컬렉션 스키마를 확인한다:
  cat "${COLLECTIONS_DIR}/<컬렉션명>.md"

[쿼리 실행 방법]
반드시 아래 curl 명령으로 쿼리한다 (서버 내부 커넥션 재사용):
curl -s -X POST http://localhost:${PORT}/db-query \\
  -H "Content-Type: application/json" \\
  -d '{"requestId":"${requestId}","collection":"<컬렉션명>","filter":{...},"projection":{...},"limit":20}'

- projection 에서 password, passHash 는 반드시 0으로 제외한다.

규칙:
1. 컬렉션 목록에서 적절한 데이터베이스와 컬렉션을 선택해 curl 로 바로 쿼리한다.
2. 쿼리 결과 count가 0이거나 data가 비어있으면 추가 쿼리 없이 즉시 "조회된 데이터가 없습니다"라고 응답한다.
3. 오류 발생 시 원인을 간단히 설명한다.
4. 한국어로 응답한다.`;
}

// ── MongoDB 클라이언트 ─────────────────────────────────────────────────────────

const mongoClient: MongoClient = new MongoClient(MONGO_URI, { maxPoolSize: 5 });

// ── 유틸 ──────────────────────────────────────────────────────────────────────

const ts: () => string = () => new Date().toTimeString().slice(0, 8);

const DB_TIMEOUT_MS: number = 30_000;
const DB_TIMEOUT_MSG: string = 'DB 응답시간 초과 Max 30초';

function isTimeoutError(err: unknown): boolean {
  return (err as { code?: number }).code === 50; // MongoDB MaxTimeMSExpired
}

const OID_REGEX: RegExp = /^[0-9a-fA-F]{24}$/;

function convertOid(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(convertOid);
  if (obj !== null && typeof obj === 'object') {
    if ('$oid' in obj) return new ObjectId((obj as { $oid: string }).$oid);
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, convertOid(v)])
    );
  }
  if (typeof obj === 'string' && OID_REGEX.test(obj)) return new ObjectId(obj);
  return obj;
}

function applyProjectionSecurity(projection: Projection): void {
  const isInclusion: boolean = Object.values(projection).some(v => v === 1 || v === true);
  if (isInclusion) {
    delete projection.passHash;
    delete projection.password;
  } else {
    projection.passHash = 0;
    projection.password = 0;
  }
}

// ── Claude 이벤트 핸들러 ──────────────────────────────────────────────────────

function handleClaudeEvent(event: ClaudeEvent, send: SendFn): void {
  switch (event.type) {
    case 'system':
      console.log(`${ts()} [준비]      Claude 세션 시작`);
      send('progress', '준비 중...');
      break;

    case 'assistant': {
      const contents: ClaudeToolUseBlock[] = event.message?.content ?? [];
      for (const block of contents) {
        if (block.type === 'tool_use' && block.name === 'Bash') {
          const cmd: string = block.input?.command?.trim() ?? '';
          if (cmd.startsWith('cat')) {
            const file: string | undefined = cmd.split('/').pop();
            console.log(`${ts()} [필드 확인]  ${file} 스키마 읽는 중...`);
            send('progress', `필드 확인 — ${file} 스키마 읽는 중...`);
            send('log', `$ cat ${file}`);
          } else if (cmd.includes('/db-query')) {
            console.log(`${ts()} [조회 시작]  DB 쿼리 실행 중...`);
            console.log(`             $ ${cmd}`);
            send('progress', '조회 시작 — DB 쿼리 실행 중...');
            // -d '...' (싱글쿼트) 또는 -d "..." (더블쿼트·이스케이프 포함) 모두 처리
            const singleMatch: RegExpMatchArray | null = cmd.match(/-d\s+'([^']+)'/);
            const doubleMatch: RegExpMatchArray | null = cmd.match(/-d\s+"((?:[^"\\]|\\.)*)"/);
            const rawData: string | undefined = singleMatch?.[1] ?? doubleMatch?.[1]?.replace(/\\"/g, '"');
            if (rawData) {
              try {
                const parsed: unknown = JSON.parse(rawData);
                const display: string = JSON.stringify(parsed, null, 2);
                send('log', display.length > 600 ? display.slice(0, 600) + '\n...(생략)' : display);
              } catch {
                // 변수 참조 등 JSON 파싱 불가 → 컬렉션명만 표시
                const collMatch: RegExpMatchArray | null = rawData.match(/["']collection["']\s*:\s*["']([^"']+)["']/);
                send('log', collMatch ? `collection: ${collMatch[1]}` : rawData.slice(0, 200));
              }
            } else {
              // Python 스크립트 등 -d 패턴 미검출 시 → cmd에서 컬렉션명 추출
              const fallbackMatch: RegExpMatchArray | null = cmd.match(/["']collection["']\s*:\s*["']([^"']+)["']/);
              if (fallbackMatch) {
                send('log', `collection: ${fallbackMatch[1]}`);
              }
            }
          } else {
            console.log(`${ts()} [실행]      $ ${cmd}`);
            send('progress', '실행 중...');
            send('log', `$ ${cmd}`);
          }
        }
      }
      break;
    }

    case 'tool_result': {
      const contents: ClaudeToolResultContent[] = Array.isArray(event.content) ? event.content : [];
      const text: string = contents.map(b => b.content ?? b.text ?? '').join('').trim();
      if (text) {
        console.log(`${ts()} [조회 완료]  결과 수신 (${text.length}자)`);
        console.log(`${ts()} [데이터 가공] 응답 정리 중...`);
        send('progress', `조회 완료 — 결과 수신 (${text.length}자)`);
        send('progress', '데이터 가공 중...');
      } else {
        console.log(`${ts()} [조회 완료]  결과 없음`);
        send('progress', '조회 완료 — 결과 없음');
      }
      break;
    }

    case 'result':
      if (event.subtype === 'success') {
        console.log(`${ts()} [응답 완료]  cost=$${event.cost_usd?.toFixed(4) ?? '?'}`);
      } else {
        console.log(`${ts()} [실패]      subtype=${event.subtype}`);
      }
      break;
  }
}

// ── Express 앱 ────────────────────────────────────────────────────────────────

const app: Application = express();
app.use(express.json());
app.use(express.static(path.join(import.meta.dirname, 'public')));

const activeJobs: Map<string, ChildProcess> = new Map();
const queryParamsStore: Map<string, QueryParams> = new Map();

// ── 엔드포인트 ────────────────────────────────────────────────────────────────

app.get('/meta', (_req: Request, res: Response) => {
  res.json({ updatedAt: collectionUpdatedAt });
});

app.get('/meta/table-info', (_req: Request, res: Response) => {
  res.json({ content: loadCollectionIndex() });
});

app.post('/db-query', async (req: Request<object, object, DbQueryBody>, res: Response) => {
  const {
    requestId,
    database,
    collection,
    filter = {},
    projection = {},
    sort,
    limit = 20,
  } = req.body;

  if (!collection) {
    return res.status(400).json({ error: 'collection 필드가 필요합니다.' });
  }

  const targetDb: string = database ?? DB_DATABASE!;
  if (requestId && collection) {
    queryParamsStore.set(requestId, {
      database: targetDb,
      collection,
      filter,
      projection,
      sort,
    });
  }

  applyProjectionSecurity(projection);

  try {
    const db: Db = mongoClient.db(targetDb);
    let cursor: FindCursor<WithId<Document>> = db
      .collection(collection)
      .find(convertOid(filter) as Filter<Document>, { projection: convertOid(projection) as Document })
      .maxTimeMS(DB_TIMEOUT_MS);
    if (sort) cursor = cursor.sort(sort);
    const docs: WithId<Document>[] = await cursor.limit(limit).toArray();
    if (docs.length === 0) {
      return res.json({
        count: 0,
        data: [],
        message: '조회된 데이터가 없습니다. 추가 쿼리 없이 즉시 이 메시지를 사용자에게 전달하라.',
      });
    }
    return res.json({ count: docs.length, data: docs });
  } catch (err) {
    if (isTimeoutError(err)) {
      console.warn(`${ts()} [타임아웃] ${DB_TIMEOUT_MSG} — ${collection}`);
      return res.status(504).json({ error: DB_TIMEOUT_MSG });
    }
    console.error(`[DB 오류] ${(err as Error).message}`);
    return res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/db-export', async (req: Request<object, object, DbExportBody>, res: Response) => {
  const { requestId } = req.body;
  const params: QueryParams | undefined = queryParamsStore.get(requestId);
  if (!params) {
    return res.status(404).json({ error: '조회 파라미터를 찾을 수 없습니다. 먼저 검색을 실행해 주세요.' });
  }

  const { database: exportDb, collection, filter, projection, sort } = params;
  const safeProjection: Projection = { ...projection };
  applyProjectionSecurity(safeProjection);

  try {
    const db: Db = mongoClient.db(exportDb ?? DB_DATABASE!);
    let cursor: FindCursor<WithId<Document>> = db
      .collection(collection)
      .find(convertOid(filter) as Filter<Document>, { projection: convertOid(safeProjection) as Document })
      .maxTimeMS(DB_TIMEOUT_MS);
    if (sort) cursor = cursor.sort(sort);
    const docs: WithId<Document>[] = await cursor.toArray();
    console.log(`${ts()} [엑셀 내보내기] ${collection} ${docs.length}건`);
    return res.json({ count: docs.length, data: docs, collection });
  } catch (err) {
    if (isTimeoutError(err)) {
      console.warn(`${ts()} [타임아웃] ${DB_TIMEOUT_MSG} — ${collection}`);
      return res.status(504).json({ error: DB_TIMEOUT_MSG });
    }
    console.error(`[DB 내보내기 오류] ${(err as Error).message}`);
    return res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/chat/cancel', (req: Request<object, object, CancelBody>, res: Response) => {
  const { requestId } = req.body;
  const child: ChildProcess | undefined = activeJobs.get(requestId);
  if (child) {
    child.kill();
    activeJobs.delete(requestId);
    console.log(`${ts()} [중지]      요청 취소: ${requestId}`);
    res.json({ ok: true });
  } else {
    res.json({ ok: false });
  }
});

app.post('/chat', (req: Request<object, object, ChatBody>, res: Response) => {
  const { message, requestId } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: '메시지를 입력해 주세요.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send: SendFn = (type: SseEventType, msg: string): void => {
    res.write(`data: ${JSON.stringify({ type, message: msg })}\n\n`);
  };

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`[요청] ${message.trim()}`);
  console.log(`${'─'.repeat(60)}`);

  const child: ChildProcess = spawn(
    'claude',
    [
      '-p', message.trim(),
      '--allowedTools', 'Bash',
      '--system-prompt', buildSystemPrompt(requestId ?? ''),
      '--output-format', 'stream-json',
      '--verbose',
      '--max-turns', '6',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  if (requestId) activeJobs.set(requestId, child);

  let lineBuffer: string = '';
  let finalResult: string = '';
  let stderr: string = '';

  child.stdout!.on('data', (data: Buffer) => {
    lineBuffer += data.toString();
    const lines: string[] = lineBuffer.split('\n');
    lineBuffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event: ClaudeEvent = JSON.parse(line) as ClaudeEvent;
        handleClaudeEvent(event, send);
        if (event.type === 'result' && event.subtype === 'success') {
          finalResult = event.result ?? '';
        }
      } catch { /* 파싱 불가 라인 무시 */ }
    }
  });

  child.stderr!.on('data', (data: Buffer) => { stderr += data.toString(); });

  child.on('close', (code: number | null, signal: NodeJS.Signals | null) => {
    if (requestId) activeJobs.delete(requestId);
    if (signal === 'SIGKILL' || signal === 'SIGTERM') {
      send('cancelled', '조회가 중지되었습니다.');
    } else if (code !== 0 && !finalResult) {
      console.error('[오류] Claude 프로세스 실패 (exit code:', code, ')');
      console.error(stderr);
      send('error', 'Claude 프로세스 실행 실패: ' + stderr.slice(0, 200));
    } else {
      send('result', finalResult.trim());
    }
    console.log(`${'─'.repeat(60)}\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  });

  child.on('error', (err: NodeJS.ErrnoException) => {
    send('error', err.code === 'ENOENT' ? 'Claude CLI가 설치되어 있지 않습니다.' : err.message);
    res.write('data: [DONE]\n\n');
    res.end();
  });
});

// ── 서버 시작 ─────────────────────────────────────────────────────────────────

function killPort(port: string): void {
  try {
    const pids: string = execSync(`lsof -ti :${port}`).toString().trim();
    if (pids) {
      pids.split('\n').forEach((pid: string) => {
        try { process.kill(Number(pid), 'SIGKILL'); } catch { /* 무시 */ }
      });
      console.log(`포트 ${port} 점유 프로세스 종료 완료`);
    }
  } catch { /* 점유 프로세스 없음 */ }
}

mongoClient
  .connect()
  .then((): void => {
    console.log(`MongoDB 연결 완료: ${DB_HOST}:${DB_PORT}/${DB_DATABASE}`);
    const server: Server = app.listen(Number(PORT), (): void => {
      console.log(`서버 실행 중: http://localhost:${PORT}`);
    });
    server.on('error', (err: NodeJS.ErrnoException): void => {
      if (err.code === 'EADDRINUSE') {
        console.log(`포트 ${PORT} 사용 중 — 기존 프로세스 종료 후 재시작...`);
        killPort(PORT);
        setTimeout((): void => {
          server.listen(Number(PORT), (): void => {
            console.log(`서버 실행 중: http://localhost:${PORT}`);
          });
        }, 500);
      } else {
        console.error('서버 오류:', err.message);
        process.exit(1);
      }
    });
  })
  .catch((err: Error): void => {
    console.error('MongoDB 연결 실패:', err.message);
    process.exit(1);
  });

process.on('SIGINT', async (): Promise<void> => {
  await mongoClient.close();
  console.log('MongoDB 커넥션 종료');
  process.exit(0);
});

process.on('SIGTERM', async (): Promise<void> => {
  await mongoClient.close();
  console.log('MongoDB 커넥션 종료');
  process.exit(0);
});
