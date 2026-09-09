# posts

- **database**: sampledb
- **건수**: 500
- **설명**: 블로그 게시물 (댓글 포함)

## 주요 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `_id` | ObjectId | 문서 고유 ID | ObjectId('50ab0f8bbc...') |
| `title` | String | 게시물 제목 | "Bill of Rights" |
| `author` | String | 작성자 | "machine" |
| `body` | String | 게시물 본문 | - |
| `tags` | Array<String> | 태그 목록 | ["watchmaker", "santa", "math"] |
| `date` | Date | 작성일시 | ISODate('2012-11-20T05:05:15Z') |
| `comments` | Array<Object> | 댓글 목록 | - |
| `comments.author` | String | 댓글 작성자 | "Santiago Dollins" |
| `comments.email` | String | 댓글 작성자 이메일 | - |
| `comments.body` | String | 댓글 본문 | - |
| `permalink` | String | 영구 링크 | - |

## 검색 예시

- 제목으로: `{ title: /rights/i }`
- 작성자별: `{ author: "machine" }`
- 태그로: `{ tags: "math" }`
