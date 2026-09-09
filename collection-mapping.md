# 컬렉션 자연어 매핑 정의서

> **database**: `sampledb` — MongoDB Atlas 공식 샘플 데이터셋 통합 / 23개 컬렉션 / 425,367건

---

## 영화 (mflix)

| 컬렉션명 | 자연어 키워드 | 주요 필드 | 설명 |
|---------|-------------|---------|------|
| `movies` | 영화, 무비, 작품, 감독, 장르, 배우 | `title`, `year`, `genres`, `directors`, `cast`, `imdb.rating`, `countries`, `runtime` | 영화 정보 (21,349건) |
| `comments` | 댓글, 리뷰, 코멘트, 영화평 | `name`, `email`, `movie_id`, `text`, `date` | 영화 댓글 (41,079건) |
| `users` | 사용자, 유저, 회원 | `name`, `email` | 사용자 계정 (185건) |
| `theaters` | 영화관, 극장, 상영관 | `theaterId`, `location.address.city`, `location.address.state` | 영화관 위치 (1,564건) |
| `embedded_movies` | 임베디드영화 | `title`, `year`, `genres`, `cast` | 임베디드 영화 데이터 (3,483건) |

---

## 금융 (analytics)

| 컬렉션명 | 자연어 키워드 | 주요 필드 | 설명 |
|---------|-------------|---------|------|
| `customers` | 고객, 금융고객 | `username`, `name`, `email`, `accounts`, `active` | 금융 고객 (500건) |
| `accounts` | 계좌, 금융계좌, 잔고 | `account_id`, `limit`, `products` | 금융 계좌 (1,746건) |
| `transactions` | 거래, 금융거래, 트랜잭션 | `account_id`, `transaction_count`, `transactions.amount`, `transactions.symbol` | 금융 거래 내역 (1,746건) |

---

## 숙박 (airbnb)

| 컬렉션명 | 자연어 키워드 | 주요 필드 | 설명 |
|---------|-------------|---------|------|
| `listingsAndReviews` | 에어비앤비, 숙소, 숙박, 숙박후기 | `name`, `property_type`, `room_type`, `price`, `address.country`, `bedrooms`, `review_scores` | 에어비앤비 숙소 및 리뷰 (5,555건) |

---

## 음식점 (restaurants)

| 컬렉션명 | 자연어 키워드 | 주요 필드 | 설명 |
|---------|-------------|---------|------|
| `restaurants` | 레스토랑, 음식점, 식당, 요리 | `name`, `cuisine`, `borough`, `address`, `grades` | 뉴욕 레스토랑 (25,359건) |
| `neighborhoods` | 지역, 동네, 뉴욕지역 | `name`, `geometry` | 뉴욕 지역구 (195건) |

---

## 판매 (supplies)

| 컬렉션명 | 자연어 키워드 | 주요 필드 | 설명 |
|---------|-------------|---------|------|
| `sales` | 판매, 매출, 구매, 쇼핑 | `saleDate`, `items.name`, `items.price`, `customer.email`, `storeLocation`, `purchaseMethod` | 판매 데이터 (5,000건) |

---

## 교육/훈련 (training)

| 컬렉션명 | 자연어 키워드 | 주요 필드 | 설명 |
|---------|-------------|---------|------|
| `grades` | 성적, 학점, 학생성적, 점수 | `student_id`, `class_id`, `scores.type`, `scores.score` | 학생 성적 (100,000건) |
| `companies` | 기업, 회사, 스타트업 | `name`, `category_code`, `founded_year`, `number_of_employees`, `offices` | 기업 정보 (9,500건) |
| `inspections` | 점검, 검사, 비즈니스검사 | `business_name`, `result`, `date`, `address.city`, `sector` | 비즈니스 점검 기록 (80,047건) |
| `trips` | 여행, 자전거여행, 트립 | `tripduration`, `start station name`, `end station name`, `usertype` | 자전거 여행 기록 (10,000건) |
| `routes` | 노선, 항공노선, 항공편 | `airline.name`, `src_airport`, `dst_airport`, `stops`, `airplane` | 항공 노선 (66,985건) |
| `zips` | 우편번호, 도시인구, 미국도시 | `city`, `state`, `pop`, `zip` | 미국 우편번호/인구 (29,470건) |
| `posts` | 게시물, 포스트, 블로그 | `author`, `title`, `body`, `tags`, `date` | 블로그 게시물 (500건) |

---

## 기타

| 컬렉션명 | 자연어 키워드 | 주요 필드 | 설명 |
|---------|-------------|---------|------|
| `shipwrecks` | 난파선, 침몰선, 해양사고 | `feature_type`, `latdec`, `londec`, `depth`, `watlev` | 전세계 난파선 위치 (11,095건) |
| `weatherdata` | 날씨, 기상, 온도, 기온 | `st`, `ts`, `airTemperature.value`, `wind.speed.rate`, `position` | 기상 측정 데이터 (10,000건) |
| `planets` | 행성, 태양계, 우주 | `name`, `orderFromSun`, `hasRings`, `surfaceTemperatureC` | 태양계 행성 정보 (8건) |
