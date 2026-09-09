# restaurants

- **database**: sampledb
- **건수**: 25,359
- **설명**: 뉴욕시 레스토랑 위생 검사 및 정보

## 주요 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `_id` | ObjectId | 문서 고유 ID | ObjectId('5eb3d668b3...') |
| `restaurant_id` | String | 레스토랑 고유 ID | "40356018" |
| `name` | String | 레스토랑 이름 | "Riviera Caterer" |
| `cuisine` | String | 음식 종류 | "American", "Chinese", "Italian", "Mexican" |
| `borough` | String | 뉴욕시 자치구 | "Brooklyn", "Manhattan", "Queens", "Bronx", "Staten Island" |
| `address.building` | String | 건물 번호 | "2780" |
| `address.street` | String | 도로명 | "Stillwell Avenue" |
| `address.zipcode` | String | 우편번호 | "11224" |
| `address.coord` | Array<Number> | [경도, 위도] | [-73.9824, 40.5795] |
| `grades` | Array<Object> | 위생 검사 이력 | - |
| `grades.date` | Date | 검사일 | ISODate('2014-06-10Z') |
| `grades.grade` | String | 위생 등급 | "A", "B", "C", "Z", "P" |
| `grades.score` | Number | 검사 점수 (낮을수록 좋음) | 5 |

## 검색 예시

- 음식 종류별: `{ cuisine: "Italian" }`
- 자치구별: `{ borough: "Manhattan" }`
- A 등급만: `{ "grades.grade": "A" }`
- 이름 검색: `{ name: /pizza/i }`
