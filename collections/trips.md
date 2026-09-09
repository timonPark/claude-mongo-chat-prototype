# trips

- **database**: sampledb
- **건수**: 10,000
- **설명**: 뉴욕시 자전거 공유(Citi Bike) 이용 기록

## 주요 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `_id` | ObjectId | 문서 고유 ID | ObjectId('572bb8222b...') |
| `tripduration` | Number | 이용 시간(초) | 379 |
| `start station id` | Number | 출발 정류장 ID | 476 |
| `start station name` | String | 출발 정류장 이름 | "E 31 St & 3 Ave" |
| `end station id` | Number | 도착 정류장 ID | 498 |
| `end station name` | String | 도착 정류장 이름 | "Broadway & W 32 St" |
| `bikeid` | Number | 자전거 ID | 17827 |
| `usertype` | String | 이용자 유형 | "Subscriber", "Customer" |
| `birth year` | Number | 이용자 출생 연도 | 1969 |
| `start station location` | Object | 출발 위치 GeoJSON | {type:"Point", coordinates:[...]} |
| `end station location` | Object | 도착 위치 GeoJSON | {type:"Point", coordinates:[...]} |
| `start time` | Date | 출발 시각 | ISODate('2016-01-01T00:00:45Z') |
| `stop time` | Date | 도착 시각 | ISODate('2016-01-01T00:07:04Z') |

## 검색 예시

- 구독자만: `{ usertype: "Subscriber" }`
- 출발 정류장: `{ "start station name": /31 St/i }`
- 이용 시간 10분 이상: `{ tripduration: { $gte: 600 } }`
