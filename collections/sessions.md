# sessions

- **database**: sampledb
- **건수**: 1
- **설명**: 사용자 세션 정보

## 주요 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `_id` | ObjectId | 문서 고유 ID | - |
| `user_id` | String | 사용자 이메일 (고유 인덱스) | "user@example.com" |
| `jwt` | String | JWT 토큰 | - |
