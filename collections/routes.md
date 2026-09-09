# routes

- **database**: sampledb
- **건수**: 66,985
- **설명**: 전세계 항공 노선 정보

## 주요 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `_id` | ObjectId | 문서 고유 ID | ObjectId('56e9b39b73...') |
| `airline.id` | Number | 항공사 내부 ID | 410 |
| `airline.name` | String | 항공사명 | "Aerocondor" |
| `airline.alias` | String | 항공사 별칭 | "2B" |
| `airline.iata` | String | IATA 코드 | "ARD" |
| `src_airport` | String | 출발 공항 코드 (IATA 3자리) | "CEK" |
| `dst_airport` | String | 도착 공항 코드 (IATA 3자리) | "KZN" |
| `codeshare` | String | 코드셰어 여부 | "" 또는 "Y" |
| `stops` | Number | 경유 횟수 | 0 |
| `airplane` | String | 기종 | "CR2", "738", "320" |

## 검색 예시

- 특정 항공사: `{ "airline.name": /Korean/i }`
- 직항편: `{ stops: 0 }`
- 출발 공항: `{ src_airport: "ICN" }`
- 특정 노선: `{ src_airport: "ICN", dst_airport: "JFK" }`
