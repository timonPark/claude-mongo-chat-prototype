# companies

- **database**: sampledb
- **건수**: 9,500
- **설명**: 기업/스타트업 정보 (Crunchbase 스타일)

## 주요 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `_id` | ObjectId | 문서 고유 ID | ObjectId('52cdef7c4b...') |
| `name` | String | 기업명 | "Wetpaint" |
| `category_code` | String | 산업 분류 | "web", "software", "mobile", "social", "games_video", "advertising" |
| `founded_year` | Number | 설립 연도 | 2005 |
| `founded_month` | Number | 설립 월 | 10 |
| `description` | String | 기업 설명 | "Technology Platform Company" |
| `number_of_employees` | Number | 직원 수 | 47 |
| `offices` | Array<Object> | 사무소 목록 | - |
| `offices.city` | String | 도시 | "Seattle" |
| `offices.state_code` | String | 주 코드 | "WA" |
| `offices.country_code` | String | 국가 코드 | "USA" |
| `offices.latitude` | Number | 위도 | 47.603 |
| `offices.longitude` | Number | 경도 | -122.333 |
| `total_money_raised` | String | 총 투자 유치액 | "$75M" |
| `acquisition` | Object | 인수 정보 | - |
| `acquisition.price_amount` | Number | 인수 가격 | 12500000 |
| `ipo.valuation_amount` | Number | IPO 가치 | - |

## 검색 예시

- 산업별: `{ category_code: "software" }`
- 설립 연도별: `{ founded_year: 2005 }`
- 직원 수 범위: `{ number_of_employees: { $gte: 100 } }`
- 특정 도시 사무소: `{ "offices.city": "San Francisco" }`
