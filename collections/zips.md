# zips

- **database**: sampledb
- **건수**: 29,470
- **설명**: 미국 우편번호별 인구 및 위치 데이터

## 주요 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `_id` | ObjectId | 문서 고유 ID | ObjectId('5c8eccc1ca...') |
| `city` | String | 도시명 (대문자) | "ALPINE" |
| `zip` | String | 우편번호 (5자리) | "35014" |
| `state` | String | 주 코드 (2자리) | "AL" |
| `pop` | Number | 인구 수 | 3062 |
| `loc.x` | Number | 경도 절대값 | 86.208934 |
| `loc.y` | Number | 위도 | 33.331165 |

## 검색 예시

- 특정 주: `{ state: "CA" }`
- 특정 도시: `{ city: "NEW YORK" }`
- 인구 많은 순: sort `{ pop: -1 }`
- 인구 범위: `{ pop: { $gte: 50000 } }`
