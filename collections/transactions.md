# transactions

- **database**: sampledb
- **건수**: 1,746
- **설명**: 금융 거래 내역 (버킷 패턴으로 저장)

## 주요 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `_id` | ObjectId | 문서 고유 ID | ObjectId('5ca4bbc1a2...') |
| `account_id` | Number | 계좌 고유 번호 | 443178 |
| `transaction_count` | Number | 버킷 내 거래 건수 | 66 |
| `bucket_start_date` | Date | 버킷 시작일 | ISODate('1969-02-04Z') |
| `bucket_end_date` | Date | 버킷 종료일 | ISODate('2017-01-03Z') |
| `transactions` | Array<Object> | 거래 목록 | - |
| `transactions.date` | Date | 거래일 | ISODate('2003-09-09Z') |
| `transactions.amount` | Number | 거래 수량 (주식 수) | 7514 |
| `transactions.transaction_code` | String | 거래 유형 | "buy" 또는 "sell" |
| `transactions.symbol` | String | 주식 티커 | "adbe", "msft", "nflx", "ibm", "sap", "team" |
| `transactions.price` | String | 주당 가격 (문자열) | "19.1072..." |
| `transactions.total` | String | 총 거래 금액 (문자열) | "143572.10..." |

## 검색 예시

- 특정 계좌 거래: `{ account_id: 443178 }`
- 거래 건수 많은 순: sort `{ transaction_count: -1 }`
