
## 1. 개요 (Overview)

본 문서는 AWS SAA-C03 시험 문제를 제공하는 웹 페이지의 구조를 정의하고,
데이터 추출 대상과 범위를 명확히 하기 위한 컨텍스트 문서이다.

대상 사이트:

* ExamTopics AWS SAA-C03

---

## 2. 대상 페이지 (Target Pages)

### 2.1 기본 접근 URL

* 문제 목록 페이지:

  ```
  https://www.examtopics.com/exams/amazon/aws-certified-solutions-architect-associate-saa-c03/view/
  ```

### 2.2 페이지 특징

* 여러 개의 문제 카드가 한 페이지에 나열됨
* 페이지네이션 구조 존재 (추가 페이지 탐색 필요)
* 각 페이지는 동일한 DOM 구조를 유지

---

## 3. 페이지 구성 (Page Structure)

### 3.1 문제 카드 단위

각 문제는 다음 요소로 구성됨:

```html id="p1"
.exam-question-card
```

* 하나의 카드 = 하나의 문제
* 페이지 내 반복 구조

---

### 3.2 문제 본문 영역

```html id="p2"
.card-body.question-body
```

#### 주요 요소

| 요소           | 설명     |
| ------------ | ------ |
| `.card-text` | 문제 텍스트 |

---

### 3.3 선택지 영역

```html id="p3"
.question-choices-container
```

#### 내부 구조

```html id="p4"
ul > li.multi-choice-item
```

* 각 `li` = 하나의 선택지

---

### 3.4 선택지 구성 요소

각 선택지는 다음 정보를 포함:

```html id="p5"
<span class="multi-choice-letter" data-choice-letter="A">A.</span>
선택지 텍스트
<span class="most-voted-answer-badge">Most Voted</span>
```

#### 속성 의미

| 요소                         | 의미                   |
| -------------------------- | -------------------- |
| `data-choice-letter`       | 선택지 식별자 (A, B, C, D) |
| 텍스트                        | 선택지 내용               |
| `.most-voted-answer-badge` | 사용자 투표 기반 유력 답       |
| `.correct-hidden` 클래스      | 숨겨진 정답 여부            |

---

## 4. 추출 대상 데이터 (Extraction Targets)

### 4.1 문제 단위 데이터

각 문제에서 다음 정보를 추출한다:

* 문제 텍스트

---

### 4.2 선택지 데이터

각 문제에 대해:

* 선택지 목록 (A, B, C, D, ...)
* 각 선택지별:

  * 식별자 (letter)
  * 내용 (text)
  * Most Voted 여부
  * correct-hidden 여부

---

### 4.3 데이터 구조 개념

```json id="p6"
{
  "question": "string",
  "choices": [
    {
      "letter": "A",
      "text": "string",
      "isMostVoted": true,
      "isHiddenCorrect": false
    }
  ]
}
```

---

## 5. 탐색 범위 (Scope of Navigation)

### 포함 범위

* 모든 문제 카드
* 모든 페이지 (페이지네이션 포함)

---

### 제외 범위

* 댓글 / 토론 영역
* 로그인 필요 데이터
* 사용자 프로필 관련 정보

---

## 6. 페이지 특성 및 제약 (Constraints)

### 6.1 정답 정보

* 정답은 기본적으로 명시적으로 공개되지 않음
* 다음 간접 정보 존재:

  * Most Voted 표시
  * 특정 클래스 (`correct-hidden`)

---

### 6.2 UI 상태 의존 요소

* 일부 요소는 CSS (`display: none`)로 숨겨져 있음
* DOM에는 존재하므로 추출 가능

---

### 6.3 동적 요소 가능성

* 페이지 로딩 시 일부 콘텐츠가 동적으로 렌더링될 수 있음
* 페이지네이션을 통해 추가 데이터 접근 필요

---

## 7. 데이터 의미 해석 (Semantic Notes)

* **Most Voted**

  * 실제 정답이 아닐 수 있음
  * 사용자 커뮤니티 기반 추정값

* **correct-hidden**

  * UI 상태에 따라 의미가 달라질 수 있음
  * 신뢰도 낮음

---

## 8. 요약 (Summary)

본 대상 페이지는 다음과 같은 구조를 가진다:

* 문제 카드 반복 구조
* 각 카드:

  * 문제 텍스트 1개
  * 선택지 N개
* 선택지는 메타데이터(투표, 숨김 정답)를 포함

추출의 핵심은 다음 3가지:

1. 문제 텍스트
2. 선택지 구조
3. 선택지별 메타 정보
