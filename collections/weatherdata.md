# weatherdata

- **database**: sampledb
- **건수**: 10,000
- **설명**: 전세계 기상 관측소 기상 측정 데이터

## 주요 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `_id` | ObjectId | 문서 고유 ID | ObjectId('5553a998e4...') |
| `st` | String | 관측소 ID | "x+47600-047900" |
| `ts` | Date | 측정 시각 | ISODate('1984-03-05T13:00:00Z') |
| `callLetters` | String | 관측소 호출 부호 | "VCSZ" |
| `position.type` | String | GeoJSON 타입 | "Point" |
| `position.coordinates` | Array<Number> | [경도, 위도] | [-47.9, 47.6] |
| `elevation` | Number | 고도(m) | 9999 |
| `airTemperature.value` | Number | 기온(℃) | -3.1 |
| `airTemperature.quality` | String | 품질 코드 | "1" (유효), "9" (미측정) |
| `dewPoint.value` | Number | 이슬점(℃) | 999.9 (미측정 시) |
| `pressure.value` | Number | 기압(hPa) | 1015.3 |
| `wind.direction.angle` | Number | 풍향(도) | 999 (미측정 시) |
| `wind.speed.rate` | Number | 풍속(m/s) | 999.9 (미측정 시) |
| `dataSource` | String | 데이터 출처 코드 | "4" |
| `type` | String | 기상 보고서 유형 | "FM-13" |

> **주의**: 값이 `999` 또는 `999.9`인 경우 미측정(결측) 값을 의미함

## 검색 예시

- 특정 관측소: `{ callLetters: "VCSZ" }`
- 기간별: `{ ts: { $gte: ISODate("1984-01-01"), $lte: ISODate("1984-12-31") } }`
- 기온 범위(유효값): `{ "airTemperature.quality": "1", "airTemperature.value": { $gte: -10, $lte: 40 } }`
