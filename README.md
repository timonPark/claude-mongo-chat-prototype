# Claude Mongo Chat

자연어로 MongoDB 데이터를 조회하는 챗봇 웹 애플리케이션입니다.
사용자가 한국어로 질문하면 Claude CLI가 적절한 쿼리를 생성해 결과를 채팅 UI로 반환합니다.

## 동작 원리

```
브라우저 → Express 서버 → Claude CLI (본인 구독 소비) → /db-query 엔드포인트 → MongoDB
```

각자 PC에 설치해서 **본인 Claude 구독**으로 독립적으로 사용합니다.

---

## 사전 요구사항

| 항목 | 버전 |
|------|------|
| Node.js | 22 이상 |
| Claude CLI | 최신 버전 |
| Claude 구독 | Pro 또는 Max (claude.ai) |
| Docker | MongoDB 로컬 실행 시 필요 |

---

## 설치 및 실행

### 1. Claude CLI 설치 및 로그인

```bash
npm install -g @anthropic-ai/claude-code
claude auth login
```

### 2. 프로젝트 클론 및 의존성 설치

```bash
git clone <repository-url>
cd claude-mongo-chat-prototype
npm install
```

### 3. MongoDB 기동 (로컬 Docker 사용 시)

```bash
# 컨테이너 시작
docker compose -f docker/docker-compose.yml up -d

# 샘플 데이터 복원 (최초 1회)
mongorestore \
  --host 127.0.0.1 --port 27017 \
  -u root -p <MONGO_ROOT_PASSWORD> \
  --authenticationDatabase admin \
  --archive=data/sampledata.archive
```

복원 후 `sampledb` 데이터베이스에 23개 컬렉션 / 425,367건이 로드됩니다.

### 4. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 DB 접속 정보를 입력합니다.

```env
PORT=3111

DB_HOST=your-mongodb-host
DB_PORT=27017
DB_DATABASE=your-database-name
DB_USER_NAME=your-username
DB_USER_PASSWORD=your-password

COLLECTION_MAPPING_FILE=./collection-mapping.md
```

### 5. 서버 실행

```bash
npm start
```

브라우저에서 `http://localhost:3111` 접속

---

## 주요 기능

- **자연어 조회** — 한국어로 질문하면 Claude가 MongoDB 쿼리를 생성해 결과 반환
- **진행 단계 표시** — 쿼리 실행 단계별 타임스탬프와 함께 실시간 표시
- **결과 복사** — 텍스트 응답을 클립보드로 즉시 복사
- **엑셀 다운로드** — 전체 조회 결과(건수 제한 없음)를 `<컬렉션명>_<날짜시간>.xlsx`로 다운로드
- **테이블 정보** — 사용 가능한 컬렉션 목록을 모달로 조회 및 검색
- **조회 중지** — 응답 대기 중 언제든 중단 가능
- **DB 타임아웃** — 쿼리 실행 30초 초과 시 자동 중단

---

## 파일 구조

```
claude-mongo-chat-prototype/
├── server.js              # Express 서버 + Claude CLI 연동
├── public/
│   └── index.html         # 채팅 UI (단일 페이지)
├── collections/           # 컬렉션별 필드 스키마 마크다운
├── index.md               # 컬렉션 전체 목록 (테이블 정보 모달에 표시)
├── collection-mapping.md  # 자연어 ↔ 컬렉션명 매핑 (시스템 프롬프트 원본)
├── docker/
│   └── docker-compose.yml # 로컬 MongoDB 컨테이너 설정
├── data/
│   └── sampledata.archive # 샘플 데이터 아카이브 (mongorestore용)
├── .env.example           # 환경변수 템플릿
└── .env                   # 실제 환경변수 (커밋 금지)
```

---

## 컬렉션 매핑 커스터마이징

| 파일 | 역할 |
|------|------|
| `index.md` | 전체 컬렉션 목록 — 시스템 프롬프트와 UI 모달에 사용 |
| `collection-mapping.md` | 자연어 키워드 ↔ 컬렉션명 매핑 상세 |
| `collections/<이름>.md` | 컬렉션별 필드 타입·설명·검색 예시 |

---

## 주의사항

- `.env` 파일은 DB 비밀번호가 포함되므로 **절대 공유하거나 커밋하지 마세요**
- Claude CLI는 로그인한 계정의 구독을 소비합니다 — 사용량에 주의하세요
- 민감 필드(`password`, `passHash`)는 조회 결과에서 자동으로 제외됩니다
- MongoDB에 직접 접속하지 않고 서버 내부 `/db-query` 엔드포인트를 통해 쿼리합니다 (비밀번호 노출 방지)
