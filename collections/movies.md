# movies

- **database**: sampledb
- **건수**: 21,349
- **설명**: 영화 정보 (제목, 장르, 감독, 출연진, IMDb 평점 등)

## 주요 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `_id` | ObjectId | 문서 고유 ID | ObjectId('573a1390f...') |
| `title` | String | 영화 제목 | "The Great Train Robbery" |
| `year` | Number | 개봉 연도 | 1903 |
| `genres` | Array<String> | 장르 목록 | ["Short", "Western"] |
| `directors` | Array<String> | 감독 목록 | ["Edwin S. Porter"] |
| `cast` | Array<String> | 출연 배우 목록 | ["A.C. Abadie", "George Barnes"] |
| `plot` | String | 줄거리 요약 | "A group of bandits..." |
| `fullplot` | String | 상세 줄거리 | - |
| `runtime` | Number | 상영 시간(분) | 11 |
| `rated` | String | 상영 등급 | "PG", "R", "TV-G" |
| `countries` | Array<String> | 제작 국가 | ["USA"] |
| `languages` | Array<String> | 언어 | ["English"] |
| `imdb.rating` | Number | IMDb 평점 (0~10) | 7.4 |
| `imdb.votes` | Number | IMDb 투표 수 | 9847 |
| `imdb.id` | Number | IMDb 고유 ID | 12345 |
| `tomatoes.viewer.rating` | Number | 로튼 토마토 관객 평점 | 3.7 |
| `awards.wins` | Number | 수상 횟수 | 2 |
| `awards.nominations` | Number | 노미네이트 횟수 | 5 |
| `released` | Date | 개봉일 | ISODate('1903-12-01') |
| `poster` | String | 포스터 이미지 URL | "https://..." |
| `num_mflix_comments` | Number | mflix 댓글 수 | 0 |

## 검색 예시

- 특정 장르 영화: `{ genres: "Action" }`
- 평점 8점 이상: `{ "imdb.rating": { $gte: 8 } }`
- 특정 감독: `{ directors: "Christopher Nolan" }`
- 특정 배우: `{ cast: "Tom Hanks" }`
- 연도 범위: `{ year: { $gte: 2000, $lte: 2010 } }`
