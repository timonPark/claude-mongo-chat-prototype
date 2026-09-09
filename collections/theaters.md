# theaters

- **database**: sampledb
- **건수**: 1,564
- **설명**: 미국 영화관 위치 정보

## 주요 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `_id` | ObjectId | 문서 고유 ID | ObjectId('59a47286cf...') |
| `theaterId` | Number | 영화관 고유 번호 | 1000 |
| `location.address.street1` | String | 도로명 주소 | "340 W Market" |
| `location.address.city` | String | 도시 | "Bloomington" |
| `location.address.state` | String | 주 (2자리) | "MN" |
| `location.address.zipcode` | String | 우편번호 | "55425" |
| `location.geo.type` | String | GeoJSON 타입 | "Point" |
| `location.geo.coordinates` | Array<Number> | [경도, 위도] | [-93.24565, 44.85466] |

## 검색 예시

- 특정 주 영화관: `{ "location.address.state": "CA" }`
- 특정 도시 영화관: `{ "location.address.city": "New York" }`
- 특정 ID: `{ theaterId: 1000 }`
