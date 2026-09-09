# Claude Mongo Chat — 프로젝트 명세서

## 1. 개요

사용자가 HTML 채팅 화면에 자연어로 질문을 입력하면,  
Claude Code CLI가 중간에서 의도를 파악하고 mongosh를 실행하여 MongoDB를 조회한 뒤,  
결과를 정리해서 채팅 화면에 출력하는 웹 애플리케이션.

---

## 2. 아키텍처

```
[브라우저 - HTML 채팅 UI]
         │ POST /chat { message }
         ▼
[Node.js Express 서버 - server.js]
         │ child_process.spawn('claude', ['-p', message, ...])
         ▼
[Claude Code CLI (claude -p)]
         │ Bash 도구로 mongosh 실행
         ▼
[MongoDB]
         │ 쿼리 결과 반환
         ▼
[Claude가 결과 정리 후 stdout 출력]
         │ 프로세스 종료 → Node.js가 stdout 수신
         ▼
[브라우저 - 채팅 말풍선으로 응답 출력]
```

---

## 3. 기술 스택

| 역할 | 기술 |
|------|------|
| 프론트엔드 | HTML5 / CSS3 / Vanilla JS (프레임워크 없음) |
| 백엔드 | Node.js + Express |
| AI 처리 | Claude Code CLI (`claude -p`) |
| DB 쿼리 | mongosh (Claude가 Bash 도구로 실행) |
| 통신 | REST (POST /chat), Server-Sent Events (스트리밍 선택적) |

---

## 4. 프로젝트 구조

```
claude-mongo-chat/
├── SPEC.md                  # 이 명세서
├── collection-mapping.md    # 자연어 ↔ 컬렉션명 매핑 정의서 (시스템 프롬프트 원본)
├── package.json
├── server.js                # Express 서버 + Claude CLI 실행 로직
└── public/
    └── index.html           # 채팅 UI (단일 파일)
```

---

## 5. 환경 변수 (`.env`)

`.env.example`을 복사하여 `.env`를 만들고 실제 값을 채운다.

```env
# 서버 포트
PORT=3111

# MongoDB 접속 정보 (server.js에서 MONGO_URI로 조합)
DB_HOST=your-mongodb-host
DB_PORT=27017
DB_DATABASE=your-database-name
DB_USER_NAME=your-username
DB_USER_PASSWORD=your-password

# 컬렉션 매핑 파일 경로 (시스템 프롬프트에 동적 삽입)
COLLECTION_MAPPING_FILE=./collection-mapping.md
```

> `server.js`에서 위 변수를 조합하여 연결 문자열을 생성한다.
> ```javascript
> const MONGO_URI = `mongodb://${DB_USER_NAME}:${DB_USER_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}?authSource=admin`;
> ```

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `PORT` | 선택 | 서버 포트. 기본값 `3111` |
| `DB_HOST` | **필수** | MongoDB 호스트 IP |
| `DB_PORT` | 선택 | MongoDB 포트. 기본값 `27017` |
| `DB_DATABASE` | **필수** | 접속할 데이터베이스명 |
| `DB_USER_NAME` | **필수** | MongoDB 계정명 |
| `DB_USER_PASSWORD` | **필수** | MongoDB 계정 비밀번호 |
| `COLLECTION_MAPPING_FILE` | 선택 | 컬렉션 매핑 파일 경로. 기본값 `./collection-mapping.md` |

> ⚠️ `.env`는 절대 커밋하지 않는다. `.gitignore`에 반드시 포함.

---

## 6. 백엔드 명세 (`server.js`)

### 6-1. Claude CLI 호출 방식

```bash
claude \
  -p "{사용자 메시지}" \
  --allowedTools "Bash" \
  --system-prompt "{시스템 프롬프트}" \
  --output-format text
```

| 플래그 | 역할 |
|--------|------|
| `-p` | 비대화형(print) 모드 — 결과만 stdout으로 출력 후 종료 |
| `--allowedTools Bash` | Claude가 mongosh(Bash) 실행 가능하도록 허용 |
| `--system-prompt` | MongoDB 연결 정보 + 응답 규칙 주입 |
| `--output-format text` | 순수 텍스트로 수신 (json 파싱 불필요) |

### 6-2. 시스템 프롬프트 내용

> 시스템 프롬프트의 컬렉션 매핑 원본은 **`collection-mapping.md`** 에 정의되어 있다.  
> `server.js` 기동 시 해당 파일을 읽어 시스템 프롬프트에 동적으로 포함시킨다.

```
당신은 MongoDB 데이터 조회 어시스턴트입니다.

사용자가 데이터를 요청하면 아래 mongosh 연결을 사용하여 조회합니다.
연결 문자열: mongodb://<DB_USER_NAME>:<DB_USER_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_DATABASE>?authSource=admin

[컬렉션 매핑]
(collection-mapping.md 내용을 서버 기동 시 여기에 삽입)

규칙:
1. mongosh 실행 시 --quiet 옵션을 반드시 사용한다.
2. 위 컬렉션 매핑을 참조하여 사용자의 자연어 질문에서 적절한 컬렉션을 선택한다.
3. 조회 결과를 사람이 읽기 좋은 표(또는 목록) 형식으로 정리하여 응답한다.
4. passHash, 비밀번호 등 민감 필드는 응답에서 제외한다.
5. 데이터가 없으면 "조회된 데이터가 없습니다"라고 응답한다.
6. 오류 발생 시 원인을 간단히 설명한다.
7. 한국어로 응답한다.
```

### 6-3. API 엔드포인트

#### `POST /chat`

**Request**
```json
{
  "message": "userId가 821085045214인 유저 정보 알려줘"
}
```

**Response (성공)**
```json
{
  "response": "조회된 사용자 정보입니다.\n\n이름: 박종훈\n이메일: ...\n..."
}
```

**Response (오류)**
```json
{
  "error": "Claude 프로세스 실행 실패"
}
```

### 6-4. 타임아웃 및 에러 처리

| 상황 | 처리 |
|------|------|
| Claude 응답 30초 초과 | 프로세스 kill 후 timeout 에러 반환 |
| MongoDB 연결 실패 | Claude가 오류 메시지 정리해서 반환 |
| 빈 메시지 입력 | 400 Bad Request |
| Claude CLI 미설치 | 500 + 안내 메시지 |

---

## 7. 프론트엔드 명세 (`public/index.html`)

### 7-1. 화면 구성

```
┌─────────────────────────────────────┐
│  🤖 Claude Mongo Chat               │  ← 헤더
├─────────────────────────────────────┤
│                                     │
│  [사용자] userId가 821085045214인    │  ← 사용자 말풍선 (오른쪽)
│           유저 정보 알려줘           │
│                                     │
│  [Claude] 조회된 사용자 정보입니다.  │  ← Claude 말풍선 (왼쪽)
│           이름: 박종훈               │
│           이메일: m05214@naver.com   │
│           ...                       │
│                                     │
│  [로딩 중...]                        │  ← 응답 대기 중 표시
│                                     │
├─────────────────────────────────────┤
│  [입력창____________] [전송]         │  ← 입력 영역 (하단 고정)
└─────────────────────────────────────┘
```

### 7-2. UI 동작 규칙

- 입력창에서 `Enter` 키로도 전송 가능
- 전송 후 입력창 초기화 및 전송 버튼 비활성화
- Claude 응답 대기 중 점 애니메이션(`...`) 로딩 표시
- 응답 수신 후 로딩 말풍선을 결과로 교체
- 새 메시지 추가 시 스크롤 자동으로 맨 아래로 이동
- 마크다운 줄바꿈(`\n`) → HTML `<br>` 변환하여 표시

### 7-3. 스타일 요구사항

- 배경: 다크 또는 라이트 (구현자 선택)
- 사용자 말풍선: 오른쪽 정렬, 파란 계열
- Claude 말풍선: 왼쪽 정렬, 회색 계열
- 입력창: 하단 고정 (`position: sticky`)
- 반응형: 모바일 너비(375px) 이상 지원

---

## 8. `package.json` 의존성

```json
{
  "name": "claude-mongo-chat",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.0",
    "dotenv": "^16.0.0"
  }
}
```

> mongosh는 별도 설치 필요 (시스템에 이미 설치되어 있어야 함)  
> claude CLI는 Claude Code로 이미 설치됨 (`~/.local/bin/claude`)

---

## 9. 실행 방법

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일에 MONGO_URI 비밀번호 입력

# 3. 서버 실행
node server.js

# 4. 브라우저에서 접속
open http://localhost:3111
```

---

## 10. 보안 고려사항

| 항목 | 조치 |
|------|------|
| MongoDB 비밀번호 | `.env`에만 보관, 코드에 하드코딩 금지 |
| 시스템 프롬프트 | 서버 측에서만 주입, 클라이언트에 노출 금지 |
| Claude 실행 | `--allowedTools Bash`만 허용 (파일 편집 등 차단) |
| 사용자 입력 | shell injection 방지 — 인수로 전달 시 배열 방식 사용 |
| CORS | 로컬 개발 시 `localhost`만 허용 |

### Shell Injection 방지 예시

```javascript
// ❌ 위험 — shell injection 가능
exec(`claude -p "${userInput}"`)

// ✅ 안전 — 배열로 전달 시 shell 해석 없음
spawn('claude', ['-p', userInput, '--allowedTools', 'Bash', ...])
```

---

## 11. 구현 순서

1. `package.json` 작성 및 `npm install`
2. `.env.example` 작성
3. `server.js` — Express 서버 + `/chat` 엔드포인트 + Claude spawn 로직
4. `public/index.html` — 채팅 UI
5. 로컬 테스트 (userId 조회 등)
6. 에러 케이스 검증 (빈 입력, 타임아웃, 없는 데이터)

---

## 12. 향후 확장 포인트 (선택)

- `--output-format stream-json` 으로 스트리밍 응답 지원 (SSE)
- 조회 이력 로컬 저장 (localStorage)
- 컬렉션 목록 자동 완성 힌트
- 쿼리 로그 서버 측 파일 저장

---

## 13. CLAUDE.md 작성 내용

> 이 프로젝트 루트에 `CLAUDE.md`를 생성하여 Claude Code가 작업 시 자동으로 읽도록 한다.

```markdown
# Claude Mongo Chat — CLAUDE.md

## 프로젝트 개요
사용자 자연어 입력 → Claude Code CLI → mongosh → MongoDB 조회 결과를
HTML 채팅 UI로 출력하는 단일 페이지 웹 애플리케이션.

## 파일 구조
- `server.js` — Express 서버. POST /chat 엔드포인트에서 claude CLI를 spawn한다.
- `public/index.html` — 채팅 UI. 별도 빌드 없이 정적 파일로 서빙된다.
- `collection-mapping.md` — 자연어 ↔ MongoDB 컬렉션명 매핑 정의. 시스템 프롬프트 원본.
- `.env` — 환경 변수 (MONGO_URI, PORT, COLLECTION_MAPPING_FILE). 커밋 금지.

## 개발 명령어
\`\`\`bash
npm install       # 최초 1회
node server.js    # 서버 실행 (http://localhost:3111)
\`\`\`

## Claude CLI 호출 방식
server.js에서 아래 형태로 Claude를 subprocess로 실행한다.
\`\`\`javascript
spawn('claude', ['-p', userMessage, '--allowedTools', 'Bash', '--system-prompt', systemPrompt])
\`\`\`
- `-p` : 비대화형 모드 (결과만 stdout 출력 후 종료)
- `--allowedTools Bash` : mongosh 실행만 허용. 파일 편집 등 차단.
- `--system-prompt` : MongoDB 연결 정보 + collection-mapping.md 내용 포함

## 시스템 프롬프트 구성
server.js 기동 시 `COLLECTION_MAPPING_FILE`(.env)을 읽어 시스템 프롬프트에 삽입한다.
컬렉션 매핑을 수정할 때는 `collection-mapping.md`만 편집하면 된다.

## 주요 제약
- 사용자 입력은 반드시 spawn 배열 인수로 전달 (exec 문자열 조합 금지 — shell injection 방지)
- MONGO_URI, 시스템 프롬프트 내 비밀번호는 서버 측에서만 사용, 클라이언트에 절대 노출 금지
- Claude 응답 타임아웃: 30초 초과 시 프로세스 kill

## 환경 변수 (.env)
| 변수명 | 설명 |
|--------|------|
| `PORT` | 서버 포트 (기본 3000) |
| `DB_HOST` | MongoDB 호스트 IP |
| `DB_PORT` | MongoDB 포트 (기본 27017) |
| `DB_DATABASE` | 접속할 데이터베이스명 |
| `DB_USER_NAME` | MongoDB 계정명 |
| `DB_USER_PASSWORD` | MongoDB 계정 비밀번호 |
| `COLLECTION_MAPPING_FILE` | 컬렉션 매핑 파일 경로 (기본 ./collection-mapping.md) |
```
