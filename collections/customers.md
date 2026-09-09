# customers

- **database**: sampledb
- **건수**: 500
- **설명**: 금융 서비스 고객 정보

## 주요 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `_id` | ObjectId | 문서 고유 ID | ObjectId('5ca4bbcea2...') |
| `username` | String | 사용자명 | "fmiller" |
| `name` | String | 고객 이름 | "Elizabeth Ray" |
| `address` | String | 주소 | "9286 Bethany Glens\nVasqueztown, CO 22939" |
| `birthdate` | Date | 생년월일 | ISODate('1977-03-02T02:20:31Z') |
| `email` | String | 이메일 | "arroyocolton@gmail.com" |
| `active` | Boolean | 활성 여부 | true |
| `accounts` | Array<Number> | 보유 계좌 ID 목록 | [371138, 324287, 276528] |
| `tier_and_details` | Object | 등급 및 혜택 정보 | - |
| `tier_and_details.*.tier` | String | 고객 등급 | "Bronze", "Silver", "Gold" |
| `tier_and_details.*.benefits` | Array<String> | 등급 혜택 | ["sports tickets"] |
| `tier_and_details.*.active` | Boolean | 등급 활성 여부 | true |

## 검색 예시

- 활성 고객: `{ active: true }`
- 특정 등급: `{ "tier_and_details": { $elemMatch: { tier: "Gold" } } }`
- 이름으로 검색: `{ name: "Elizabeth Ray" }`
