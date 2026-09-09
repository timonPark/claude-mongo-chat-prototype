# planets

- **database**: sampledb
- **건수**: 8
- **설명**: 태양계 행성 정보

## 주요 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `_id` | ObjectId | 문서 고유 ID | ObjectId('621ff30d2a...') |
| `name` | String | 행성 이름 | "Mercury" |
| `orderFromSun` | Number | 태양으로부터 순서 | 1 |
| `hasRings` | Boolean | 고리 존재 여부 | false |
| `mainAtmosphere` | Array<String> | 주요 대기 성분 | ["O2", "N2"] |
| `surfaceTemperatureC.min` | Number | 최저 표면 온도(℃) | -173 |
| `surfaceTemperatureC.max` | Number | 최고 표면 온도(℃) | 427 |
| `surfaceTemperatureC.mean` | Number | 평균 표면 온도(℃) | 67 |

## 검색 예시

- 고리 있는 행성: `{ hasRings: true }`
- 태양 가까운 순: sort `{ orderFromSun: 1 }`
