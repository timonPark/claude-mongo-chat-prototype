# neighborhoods

- **database**: sampledb
- **건수**: 195
- **설명**: 뉴욕시 지역구(neighborhood) 경계 GeoJSON 데이터

## 주요 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `_id` | ObjectId | 문서 고유 ID | ObjectId('55cb9c666c...') |
| `name` | String | 지역구 이름 | "Bedford" |
| `geometry.type` | String | GeoJSON 타입 | "Polygon" |
| `geometry.coordinates` | Array | 경계 좌표 배열 | - |

## 검색 예시

- 이름으로 검색: `{ name: "Brooklyn" }`
