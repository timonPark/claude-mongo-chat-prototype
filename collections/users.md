# users

- **database**: sampledb
- **건수**: 185
- **설명**: mflix 서비스 사용자 계정

## 주요 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `_id` | ObjectId | 문서 고유 ID | ObjectId('59b99db4cf...') |
| `name` | String | 사용자 이름 | "Ned Stark" |
| `email` | String | 이메일 (고유 인덱스) | "sean_bean@gameofthron.es" |
| `password` | String | 해시된 비밀번호 (조회 제외) | - |

## 검색 예시

- 이름으로 검색: `{ name: "Ned Stark" }`
- 이메일로 검색: `{ email: "sean_bean@gameofthron.es" }`

> **주의**: `password` 필드는 projection에서 반드시 제외 (`password: 0`)
