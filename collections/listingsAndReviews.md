# listingsAndReviews

- **database**: sampledb
- **건수**: 5,555
- **설명**: 에어비앤비 숙소 정보 및 리뷰

## 주요 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `_id` | String | 숙소 고유 ID | "10006546" |
| `name` | String | 숙소 이름 | "Ribeira Charming Duplex" |
| `property_type` | String | 숙소 유형 | "House", "Apartment", "Condominium" |
| `room_type` | String | 방 유형 | "Entire home/apt", "Private room", "Shared room" |
| `bedrooms` | Number | 침실 수 | 3 |
| `beds` | Number | 침대 수 | 5 |
| `bathrooms` | Decimal128 | 욕실 수 | 1.0 |
| `price` | Decimal128 | 1박 가격 | 80.00 |
| `number_of_reviews` | Number | 리뷰 수 | 51 |
| `amenities` | Array<String> | 편의시설 목록 | ["TV", "Wifi", "Kitchen"] |
| `address.country` | String | 국가 | "Portugal", "Brazil", "USA" |
| `address.country_code` | String | 국가 코드 | "PT", "BR", "US" |
| `address.market` | String | 지역/도시 | "Porto", "Rio De Janeiro" |
| `address.street` | String | 도로명 주소 | - |
| `address.location.coordinates` | Array<Number> | [경도, 위도] | [-8.61308, 41.1413] |
| `review_scores.review_scores_rating` | Number | 종합 평점 (0~100) | 89 |
| `review_scores.review_scores_accuracy` | Number | 정확도 (0~10) | 9 |
| `review_scores.review_scores_cleanliness` | Number | 청결도 (0~10) | 9 |
| `review_scores.review_scores_location` | Number | 위치 (0~10) | 10 |
| `reviews` | Array<Object> | 리뷰 목록 | - |
| `reviews.reviewer_name` | String | 리뷰어 이름 | - |
| `reviews.comments` | String | 리뷰 내용 | - |
| `reviews.date` | Date | 리뷰 작성일 | - |
| `host.host_name` | String | 호스트 이름 | - |
| `host.host_is_superhost` | Boolean | 슈퍼호스트 여부 | false |

## 검색 예시

- 국가별: `{ "address.country": "Portugal" }`
- 가격 범위: `{ price: { $lte: Decimal128("100") } }`
- 평점 높은 순: sort `{ "review_scores.review_scores_rating": -1 }`
- 침실 수: `{ bedrooms: 2 }`
