# grades

- **database**: sampledb
- **건수**: 100,000
- **설명**: 학생 성적 데이터 (시험, 퀴즈, 숙제 점수)

## 주요 필드

| 필드명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `_id` | ObjectId | 문서 고유 ID | ObjectId('56d5f7eb60...') |
| `student_id` | Number | 학생 고유 번호 | 0 |
| `class_id` | Number | 수업 고유 번호 | 339 |
| `scores` | Array<Object> | 점수 목록 | - |
| `scores.type` | String | 평가 유형 | "exam", "quiz", "homework" |
| `scores.score` | Number | 점수 (0~100) | 78.4 |

## 검색 예시

- 특정 학생: `{ student_id: 0 }`
- 특정 수업: `{ class_id: 339 }`
- 시험 점수만: `{ scores: { $elemMatch: { type: "exam", score: { $gte: 90 } } } }`
