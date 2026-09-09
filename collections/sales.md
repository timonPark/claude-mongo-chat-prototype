# sales

- **database**: sampledb
- **건수**: 5,000
- **설명**: 사무용품 판매 데이터

## 주요 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `_id` | ObjectId | 문서 고유 ID | ObjectId('5bd761dcae...') |
| `saleDate` | Date | 판매일시 | ISODate('2015-03-23T21:06:49Z') |
| `storeLocation` | String | 판매 지점 | "Denver", "Seattle", "New York", "London", "Austin", "San Diego" |
| `purchaseMethod` | String | 구매 방법 | "Online", "In store", "Phone" |
| `couponUsed` | Boolean | 쿠폰 사용 여부 | true |
| `customer.gender` | String | 고객 성별 | "M", "F" |
| `customer.age` | Number | 고객 나이 | 42 |
| `customer.email` | String | 고객 이메일 | "cauho@witwuta.sv" |
| `customer.satisfaction` | Number | 만족도 (1~5) | 4 |
| `items` | Array<Object> | 구매 항목 목록 | - |
| `items.name` | String | 상품명 | "printer paper", "pens", "notepad", "binder", "backpack", "envelopes" |
| `items.tags` | Array<String> | 상품 태그 | ["office", "stationary"] |
| `items.price` | Decimal128 | 상품 가격 | 40.01 |
| `items.quantity` | Number | 구매 수량 | 2 |

## 검색 예시

- 지점별: `{ storeLocation: "Denver" }`
- 온라인 구매: `{ purchaseMethod: "Online" }`
- 쿠폰 사용: `{ couponUsed: true }`
- 특정 상품 포함: `{ "items.name": "pens" }`
- 기간별: `{ saleDate: { $gte: ISODate("2015-01-01"), $lte: ISODate("2015-12-31") } }`
