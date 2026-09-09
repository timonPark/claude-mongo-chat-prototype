# comments

- **database**: sampledb
- **건수**: 41,079
- **설명**: 영화에 달린 사용자 댓글

## 주요 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `_id` | ObjectId | 문서 고유 ID | ObjectId('5a9427648b...') |
| `name` | String | 댓글 작성자 이름 | "Mercedes Tyler" |
| `email` | String | 작성자 이메일 | "mercedes_tyler@fakegmail.com" |
| `movie_id` | ObjectId | 연결된 영화의 `_id` | ObjectId('573a1390f...') |
| `text` | String | 댓글 본문 | "Eius veritatis vero..." |
| `date` | Date | 작성일시 | ISODate('2002-08-18T04:56:07Z') |

## 검색 예시

- 특정 영화 댓글: `{ movie_id: ObjectId("573a1390f29313caabcd4323") }`
- 특정 사용자 댓글: `{ email: "user@example.com" }`
- 기간별 댓글: `{ date: { $gte: ISODate("2020-01-01") } }`
