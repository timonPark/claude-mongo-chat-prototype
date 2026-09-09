# inspections

- **database**: sampledb
- **건수**: 80,047
- **설명**: 뉴욕시 비즈니스 위생/안전 점검 기록

## 주요 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `_id` | ObjectId | 문서 고유 ID | ObjectId('56d61033a3...') |
| `id` | String | 점검 고유 ID | "10021-2015-ENFO" |
| `certificate_number` | Number | 인증 번호 | 9278806 |
| `business_name` | String | 업체명 | "ATLIXCO DELI GROCERY INC." |
| `date` | String | 점검일 (문자열) | "Feb 20 2015" |
| `result` | String | 점검 결과 | "No Violation Issued", "Violation Issued", "Pass", "Fail", "Unable to Locate" |
| `sector` | String | 업종/분야 | "Cigarette Retail Dealer - 127" |
| `address.city` | String | 도시 | "RIDGEWOOD" |
| `address.zip` | Number | 우편번호 | 11385 |
| `address.street` | String | 도로명 | "MENAHAN ST" |
| `address.number` | Number | 건물 번호 | 1712 |

## 검색 예시

- 위반 발생: `{ result: "Violation Issued" }`
- 업체명 검색: `{ business_name: /DELI/i }`
- 도시별: `{ "address.city": "BROOKLYN" }`
