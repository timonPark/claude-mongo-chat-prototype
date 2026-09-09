# Claude Mongo Chat — CLAUDE.md

## 프로젝트 개요
사용자 자연어 입력 → Claude Code CLI → 내부 HTTP 엔드포인트 → MongoDB 조회 결과를
HTML 채팅 UI로 출력하는 단일 페이지 웹 애플리케이션.

## 파일 구조
```
claude-mongo-chat/
├── server.js              # Express 서버 + Claude CLI spawn 로직
├── public/index.html      # 채팅 UI (단일 파일, 빌드 없음)
├── collections/           # 컬렉션별 필드 스키마 마크다운 (collections/<name>.md)
├── index.md               # 전체 컬렉션 목록 (UI 테이블 정보 모달 + 시스템 프롬프트에 사용)
├── collection-mapping.md  # 자연어 ↔ 컬렉션명 매핑 (시스템 프롬프트 원본)
├── docker/
│   └── docker-compose.yml # 로컬 MongoDB 컨테이너
├── data/
│   └── sampledata.archive # mongorestore용 샘플 데이터 아카이브
├── .env.example           # 환경변수 템플릿
└── .env                   # 실제 환경변수 (커밋 금지)
```

## 개발 명령어
```bash
npm install                                        # 최초 1회
docker compose -f docker/docker-compose.yml up -d  # 로컬 MongoDB 기동
node server.js                                     # 서버 실행 (http://localhost:3111)
```

## Claude CLI 호출 방식
`/chat` 엔드포인트에서 아래 형태로 Claude를 subprocess로 실행한다.
```javascript
spawn('claude', [
  '-p', message,
  '--allowedTools', 'Bash',
  '--system-prompt', systemPrompt,
  '--output-format', 'stream-json',
  '--verbose',
  '--max-turns', '6',
])
```
- `--output-format stream-json` : NDJSON 스트림으로 수신해 진행 단계를 실시간으로 클라이언트에 전달
- `--allowedTools Bash` : Bash(curl) 실행만 허용. 파일 편집 등 차단.
- `--max-turns 6` : 최대 6턴 내 쿼리 완료 강제

## 쿼리 실행 방식 (중요)
Claude는 mongosh를 직접 실행하지 않고, **서버 내부 HTTP 엔드포인트**에 curl로 요청한다.
```
Claude → curl POST /db-query → mongoClient(커넥션 풀) → MongoDB
```
이 방식의 이점:
- MongoDB 커넥션을 서버가 풀로 관리 (매 요청마다 새 연결 없음)
- `MONGO_URI`(비밀번호 포함)가 Claude subprocess에 노출되지 않음
- 민감 필드(`password`, `passHash`) 서버 측 강제 제외

## 시스템 프롬프트 구성
서버 기동 시 `index.md`(전체 컬렉션 목록)를 읽어 시스템 프롬프트에 삽입한다.
Claude가 쿼리 전 정확한 필드명을 확인할 때는 `cat collections/<컬렉션명>.md`로 개별 파일을 읽는다.

컬렉션 목록 변경 시: `index.md` 수정  
자연어 매핑 변경 시: `collection-mapping.md` 수정  
필드 상세 변경 시: `collections/<컬렉션명>.md` 수정

## API 엔드포인트
| 엔드포인트 | 설명 |
|-----------|------|
| `POST /chat` | Claude CLI spawn, SSE 스트림으로 응답 |
| `POST /chat/cancel` | 진행 중인 Claude 프로세스 중단 |
| `POST /db-query` | Claude가 curl로 호출하는 MongoDB 조회 (커넥션 풀 재사용) |
| `POST /db-export` | 엑셀 내보내기용 전체 조회 (limit 없음) |
| `GET /meta` | 컬렉션 인덱스 최종 업데이트 시각 |
| `GET /meta/table-info` | 컬렉션 목록 전체 마크다운 (UI 모달용) |

## /db-query 파라미터
```json
{
  "requestId": "...",
  "collection": "movies",
  "filter": { "year": { "$gte": 2000 } },
  "projection": { "title": 1, "year": 1 },
  "sort": { "year": -1 },
  "limit": 20
}
```
- `projection` inclusion(1)/exclusion(0) 혼용 불가 — 서버에서 타입 감지 후 분기 처리
- `_id` 값은 24자리 hex 문자열도 ObjectId로 자동 변환 (`convertOid` 함수)
- `/db-export` 응답에는 `collection` 필드 포함 → 클라이언트가 파일명에 사용

## 주요 제약
- 사용자 입력은 반드시 spawn 배열 인수로 전달 (exec 문자열 조합 금지 — shell injection 방지)
- `MONGO_URI`, 비밀번호는 서버 측에서만 사용, 클라이언트/Claude subprocess에 절대 노출 금지
- DB 쿼리 타임아웃: 30초 (`maxTimeMS`) 초과 시 MongoDB가 직접 중단

## 환경 변수 (.env)
| 변수명 | 설명 |
|--------|------|
| `PORT` | 서버 포트 (기본 3111) |
| `DB_HOST` | MongoDB 호스트 |
| `DB_PORT` | MongoDB 포트 (기본 27017) |
| `DB_DATABASE` | 접속할 데이터베이스명 |
| `DB_USER_NAME` | MongoDB 계정명 |
| `DB_USER_PASSWORD` | MongoDB 계정 비밀번호 |
| `COLLECTION_MAPPING_FILE` | 컬렉션 매핑 파일 경로 (기본 ./collection-mapping.md) |
