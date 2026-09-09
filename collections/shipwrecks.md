# shipwrecks

- **database**: sampledb
- **건수**: 11,095
- **설명**: 전세계 난파선 위치 및 정보 (NOAA 데이터)

## 주요 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `_id` | ObjectId | 문서 고유 ID | ObjectId('578f6fa2df...') |
| `feature_type` | String | 난파선 유형 | "Wrecks - Visible", "Wrecks - Submerged, nondangerous", "Wrecks - Submerged, dangerous" |
| `chart` | String | 해도 정보 | "US,U1,graph,DNC H1409860" |
| `latdec` | Number | 위도 (십진수) | 9.3547792 |
| `londec` | Number | 경도 (십진수) | -79.9081268 |
| `coordinates` | Array<Number> | [경도, 위도] | [-79.9081268, 9.3547792] |
| `depth` | Number | 수심(피트) | 0 |
| `watlev` | String | 수위 상태 | "always dry", "always under water", "covers and uncovers" |
| `history` | String | 역사 정보 | - |
| `vesslterms` | String | 선박 관련 용어 | - |

## 검색 예시

- 가시 난파선: `{ feature_type: "Wrecks - Visible" }`
- 수심 범위: `{ depth: { $gt: 0, $lte: 100 } }`
