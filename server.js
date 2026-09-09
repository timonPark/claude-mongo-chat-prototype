require('dotenv').config({ override: true });
const express = require('express');
const { spawn } = require('child_process');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3111;

const DB_HOST = process.env.DB_HOST;
const DB_PORT = process.env.DB_PORT || '27017';
const DB_DATABASE = process.env.DB_DATABASE;
const DB_USER_NAME = process.env.DB_USER_NAME;
const DB_USER_PASSWORD = process.env.DB_USER_PASSWORD;
const COLLECTION_MAPPING_FILE = process.env.COLLECTION_MAPPING_FILE || './collection-mapping.md';
const COLLECTION_INDEX_FILE = './index.md';
const COLLECTIONS_DIR = path.resolve(__dirname, 'collections');

if (!DB_HOST || !DB_DATABASE || !DB_USER_NAME || !DB_USER_PASSWORD) {
  console.error('필수 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
  process.exit(1);
}

const MONGO_URI = `mongodb://${DB_USER_NAME}:${DB_USER_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}?authSource=admin`;

// 컬렉션 인덱스 로드
let collectionIndex = '';
let collectionUpdatedAt = '';
try {
  collectionIndex = fs.readFileSync(path.resolve(COLLECTION_INDEX_FILE), 'utf-8');
  const match = collectionIndex.match(/최종 업데이트[：:]\s*(.+)/);
  if (match) collectionUpdatedAt = match[1].trim();
} catch (e) {
  console.warn(`컬렉션 인덱스 파일을 읽을 수 없습니다: ${COLLECTION_INDEX_FILE}`);
  try {
    collectionIndex = fs.readFileSync(path.resolve(COLLECTION_MAPPING_FILE), 'utf-8');
  } catch (e2) {
    console.warn(`컬렉션 매핑 파일도 읽을 수 없습니다: ${COLLECTION_MAPPING_FILE}`);
  }
}

function loadCollectionIndex() {
  try {
    const content = fs.readFileSync(path.resolve(COLLECTION_INDEX_FILE), 'utf-8');
    const match = content.match(/최종 업데이트[：:]\s*(.+)/);
    if (match) collectionUpdatedAt = match[1].trim();
    return content;
  } catch (e) {
    return collectionIndex;
  }
}

function buildCollectionSummary() {
  const lines = loadCollectionIndex().split('\n');
  const result = [];
  for (const line of lines) {
    const match = line.match(/\|\s*`([^`]+)`\s*\|\s*([^|]+)\|/);
    if (match) result.push(`${match[1].trim()} — ${match[2].trim()}`);
  }
  return result.join('\n');
}

function buildSystemPrompt(requestId) {
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

// MongoDB 클라이언트 (커넥션 풀)
const mongoClient = new MongoClient(MONGO_URI, { maxPoolSize: 5 });

const ts = () => new Date().toTimeString().slice(0, 8);

const DB_TIMEOUT_MS = 30_000;
const DB_TIMEOUT_MSG = 'DB 응답시간 초과 Max 30초';

function isTimeoutError(err) {
  return err.code === 50; // MongoDB MaxTimeMSExpired
}

function handleClaudeEvent(event, send) {
  switch (event.type) {
    case 'system':
      console.log(`${ts()} [준비]      Claude 세션 시작`);
      send('progress', '준비 중...');
      break;

    case 'assistant': {
      const contents = event.message?.content ?? [];
      for (const block of contents) {
        if (block.type === 'tool_use' && block.name === 'Bash') {
          const cmd = block.input?.command?.trim() ?? '';
          if (cmd.startsWith('cat')) {
            const file = cmd.split('/').pop();
            console.log(`${ts()} [필드 확인]  ${file} 스키마 읽는 중...`);
            send('progress', `필드 확인 — ${file} 스키마 읽는 중...`);
            send('log', `$ cat ${file}`);
          } else if (cmd.includes('/db-query')) {
            console.log(`${ts()} [조회 시작]  DB 쿼리 실행 중...`);
            console.log(`             $ ${cmd}`);
            send('progress', '조회 시작 — DB 쿼리 실행 중...');
            const dMatch = cmd.match(/-d\s+'([^']+)'/);
            if (dMatch) {
              try {
                const parsed = JSON.parse(dMatch[1]);
                send('log', JSON.stringify(parsed, null, 2));
              } catch (_) {
                send('log', dMatch[1]);
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
      const contents = Array.isArray(event.content) ? event.content : [];
      const text = contents.map(b => b.content ?? b.text ?? '').join('').trim();
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

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/meta', (req, res) => {
  res.json({ updatedAt: collectionUpdatedAt });
});

app.get('/meta/table-info', (req, res) => {
  res.json({ content: loadCollectionIndex() });
});

// {"$oid":"..."} → ObjectId 재귀 변환
const { ObjectId } = require('mongodb');
const OID_REGEX = /^[0-9a-fA-F]{24}$/;
function convertOid(obj) {
  if (Array.isArray(obj)) return obj.map(convertOid);
  if (obj !== null && typeof obj === 'object') {
    if ('$oid' in obj) return new ObjectId(obj.$oid);
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, convertOid(v)]));
  }
  // 24자리 hex 문자열은 ObjectId로 자동 변환
  if (typeof obj === 'string' && OID_REGEX.test(obj)) return new ObjectId(obj);
  return obj;
}

// Claude가 curl로 호출하는 쿼리 엔드포인트 (커넥션 풀 재사용)
app.post('/db-query', async (req, res) => {
  const { requestId, database, collection, filter = {}, projection = {}, sort, limit = 20 } = req.body;
  const targetDb = database || DB_DATABASE;
  if (requestId && collection) queryParamsStore.set(requestId, { database: targetDb, collection, filter: filter || {}, projection: projection || {}, sort });

  if (!collection) {
    return res.status(400).json({ error: 'collection 필드가 필요합니다.' });
  }

  // 민감 필드 강제 제외
  // inclusion projection(값이 1)과 exclusion projection(값이 0)을 혼용하면 MongoDB 오류 발생
  const isInclusion = Object.values(projection).some(v => v === 1 || v === true);
  if (isInclusion) {
    // inclusion: 민감 필드가 명시돼 있으면 제거 (어차피 목록에 없으면 반환 안 됨)
    delete projection.passHash;
    delete projection.password;
  } else {
    // exclusion 또는 빈 projection: 명시적으로 제외
    projection.passHash = 0;
    projection.password = 0;
  }

  try {
    const db = mongoClient.db(targetDb);
    let cursor = db.collection(collection)
      .find(convertOid(filter), { projection: convertOid(projection) })
      .maxTimeMS(DB_TIMEOUT_MS);
    if (sort) cursor = cursor.sort(sort);
    const docs = await cursor.limit(limit).toArray();
    if (docs.length === 0) {
      return res.json({ count: 0, data: [], message: '조회된 데이터가 없습니다. 추가 쿼리 없이 즉시 이 메시지를 사용자에게 전달하라.' });
    }
    res.json({ count: docs.length, data: docs });
  } catch (err) {
    if (isTimeoutError(err)) {
      console.warn(`${ts()} [타임아웃] ${DB_TIMEOUT_MSG} — ${collection}`);
      return res.status(504).json({ error: DB_TIMEOUT_MSG });
    }
    console.error(`[DB 오류] ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

const activeJobs = new Map();    // requestId → child process
const queryParamsStore = new Map(); // requestId → last db-query params (for Excel export)

// 전체 데이터 Excel 다운로드용 엔드포인트 (limit 없이 재조회)
app.post('/db-export', async (req, res) => {
  const { requestId } = req.body;
  const params = queryParamsStore.get(requestId);
  if (!params) return res.status(404).json({ error: '조회 파라미터를 찾을 수 없습니다. 먼저 검색을 실행해 주세요.' });

  const { database: exportDb, collection, filter, projection, sort } = params;
  const safeProjection = { ...projection };
  const isInclusionExport = Object.values(safeProjection).some(v => v === 1 || v === true);
  if (isInclusionExport) {
    delete safeProjection.passHash;
    delete safeProjection.password;
  } else {
    safeProjection.passHash = 0;
    safeProjection.password = 0;
  }

  try {
    const db = mongoClient.db(exportDb || DB_DATABASE);
    let cursor = db.collection(collection)
      .find(convertOid(filter), { projection: convertOid(safeProjection) })
      .maxTimeMS(DB_TIMEOUT_MS);
    if (sort) cursor = cursor.sort(sort);
    const docs = await cursor.toArray();
    console.log(`${ts()} [엑셀 내보내기] ${collection} ${docs.length}건`);
    res.json({ count: docs.length, data: docs, collection });
  } catch (err) {
    if (isTimeoutError(err)) {
      console.warn(`${ts()} [타임아웃] ${DB_TIMEOUT_MSG} — ${collection}`);
      return res.status(504).json({ error: DB_TIMEOUT_MSG });
    }
    console.error(`[DB 내보내기 오류] ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

app.post('/chat/cancel', (req, res) => {
  const { requestId } = req.body;
  const child = activeJobs.get(requestId);
  if (child) {
    child.kill();
    activeJobs.delete(requestId);
    console.log(`${ts()} [중지]      요청 취소: ${requestId}`);
    res.json({ ok: true });
  } else {
    res.json({ ok: false });
  }
});

app.post('/chat', (req, res) => {
  const { message, requestId } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: '메시지를 입력해 주세요.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = (type, msg) => {
    res.write(`data: ${JSON.stringify({ type, message: msg })}\n\n`);
  };

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`[요청] ${message.trim()}`);
  console.log(`${'─'.repeat(60)}`);

  const child = spawn('claude', [
    '-p', message.trim(),
    '--allowedTools', 'Bash',
    '--system-prompt', buildSystemPrompt(requestId || ''),
    '--output-format', 'stream-json',
    '--verbose',
    '--max-turns', '6',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });

  if (requestId) activeJobs.set(requestId, child);

  let lineBuffer = '';
  let finalResult = '';
  let stderr = '';

  child.stdout.on('data', (data) => {
    lineBuffer += data.toString();
    const lines = lineBuffer.split('\n');
    lineBuffer = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        handleClaudeEvent(event, send);
        if (event.type === 'result' && event.subtype === 'success') {
          finalResult = event.result;
        }
      } catch (_) {}
    }
  });

  child.stderr.on('data', (data) => { stderr += data.toString(); });

  child.on('close', (code, signal) => {
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

  child.on('error', (err) => {
    send('error', err.code === 'ENOENT' ? 'Claude CLI가 설치되어 있지 않습니다.' : err.message);
    res.write('data: [DONE]\n\n');
    res.end();
  });
});

const { execSync } = require('child_process');

function killPort(port) {
  try {
    const pids = execSync(`lsof -ti :${port}`).toString().trim();
    if (pids) {
      pids.split('\n').forEach(pid => {
        try { process.kill(Number(pid), 'SIGKILL'); } catch (_) {}
      });
      console.log(`포트 ${port} 점유 프로세스 종료 완료`);
    }
  } catch (_) {}
}

// 서버 시작 시 MongoDB 커넥션 연결
mongoClient.connect()
  .then(() => {
    console.log(`MongoDB 연결 완료: ${DB_HOST}:${DB_PORT}/${DB_DATABASE}`);
    const server = app.listen(PORT, () => {
      console.log(`서버 실행 중: http://localhost:${PORT}`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`포트 ${PORT} 사용 중 — 기존 프로세스 종료 후 재시작...`);
        killPort(PORT);
        setTimeout(() => {
          server.listen(PORT, () => {
            console.log(`서버 실행 중: http://localhost:${PORT}`);
          });
        }, 500);
      } else {
        console.error('서버 오류:', err.message);
        process.exit(1);
      }
    });
  })
  .catch((err) => {
    console.error('MongoDB 연결 실패:', err.message);
    process.exit(1);
  });

// 서버 종료 시 커넥션 해제
process.on('SIGINT', async () => {
  await mongoClient.close();
  console.log('MongoDB 커넥션 종료');
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await mongoClient.close();
  console.log('MongoDB 커넥션 종료');
  process.exit(0);
});
