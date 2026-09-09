# embedded_movies

- **database**: sampledb
- **건수**: 3,483
- **설명**: movies 컬렉션의 서브셋 — 임베디드 배열(출연진, 댓글 등)을 포함한 비정규화 데이터

## 주요 필드

movies 컬렉션과 동일한 스키마. 추가로 `comments` 배열이 문서에 임베디드됨.

| 필드명 | 타입 | 설명 |
|--------|------|------|
| `title` | String | 영화 제목 |
| `year` | Number | 개봉 연도 |
| `genres` | Array<String> | 장르 목록 |
| `directors` | Array<String> | 감독 목록 |
| `cast` | Array<String> | 출연진 목록 |
| `imdb.rating` | Number | IMDb 평점 |
| `comments` | Array<Object> | 임베디드 댓글 목록 |
| `comments.name` | String | 댓글 작성자 |
| `comments.text` | String | 댓글 본문 |
| `comments.date` | Date | 댓글 작성일 |
