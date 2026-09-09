# accounts

- **database**: sampledb
- **건수**: 1,746
- **설명**: 금융 계좌 정보

## 주요 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `_id` | ObjectId | 문서 고유 ID | ObjectId('5ca4bbc7a2...') |
| `account_id` | Number | 계좌 고유 번호 | 371138 |
| `limit` | Number | 계좌 한도 (달러) | 9000 |
| `products` | Array<String> | 보유 금융 상품 목록 | ["Derivatives", "InvestmentStock"] |

**products 값 목록**: CurrencyService, InvestmentStock, Derivatives, Brokerage, Commodity

## 검색 예시

- 특정 계좌: `{ account_id: 371138 }`
- 특정 상품 보유: `{ products: "Derivatives" }`
- 한도 범위: `{ limit: { $gte: 9000 } }`
