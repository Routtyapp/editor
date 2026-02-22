# 백엔드 API 스펙: 스크립트 라인 일괄 수정

> 작성일: 2026-02-22
> 작성자: 프론트엔드 팀
> 대상: 백엔드 개발자

---

## 1. 엔드포인트

```
PATCH /api/v1/documents/{document_id}/script_lines
Content-Type: application/json
Authorization: Bearer {token}
```

---

## 2. Request Body 스키마

```json
{
  "created": [
    {
      "temp_id": "string",        // 프론트가 발급한 임시 ID (예: "new_1708123456"). 백엔드는 무시
      "speaker_id": 3,            // number. 해당 document에 속한 speaker의 DB id
      "text": "안녕하세요.",       // string
      "start_time": "00:01:23",   // string | null. "MM:SS" 또는 null
      "order": 2                  // number. 현재 라인 배열에서의 인덱스 (0-based)
    }
  ],
  "updated": [
    {
      "id": 42,                   // number. DB에 존재하는 script_line의 id (필수)
      "speaker_id": 5,            // number? 변경된 경우에만 포함
      "text": "수정된 텍스트",     // string? 변경된 경우에만 포함
      "start_time": "00:02:10"    // string | null? 변경된 경우에만 포함
    }
  ],
  "deleted": [10, 15, 22],        // number[]. 삭제할 script_line id 배열
  "orders": [                     // 구조 변경(생성·삭제)이 있을 때만 채워짐. 기존 라인의 최종 순서
    { "id": 41, "order": 0 },
    { "id": 43, "order": 1 }
  ]
}
```

### 필드 설명

| 필드 | 타입 | 설명 |
|---|---|---|
| `created` | array | 새로 추가된 라인 목록. 없으면 빈 배열 `[]` |
| `updated` | array | 변경된 기존 라인 목록. 변경된 필드만 포함. 없으면 빈 배열 `[]` |
| `deleted` | number[] | 삭제할 라인 id 목록. 없으면 빈 배열 `[]` |
| `orders` | array | 구조 변경(생성·삭제) 시 기존 라인 전체의 최종 order. 순수 수정만 있을 경우 빈 배열 `[]` |

---

## 3. Response 형식

### 성공 (200 OK)

```json
{
  "data": {
    "created": [
      { "temp_id": "new_1708123456", "id": 99 }
    ]
  }
}
```

- `created[].temp_id`: 프론트가 보낸 임시 ID
- `created[].id`: 백엔드가 발급한 실제 DB id

> 프론트는 이 응답을 받아 `new_xxx` ID를 실제 DB id로 교체하여 스냅샷을 갱신합니다.

### 실패 (4xx / 5xx)

```json
{
  "error": {
    "code": "SPEAKER_NOT_FOUND",
    "message": "speaker_id 5 is not in document 12"
  }
}
```

---

## 4. 백엔드 처리 순서

트랜잭션 내에서 아래 순서로 처리하십시오.

```
1. document_id 소유권 검증 (요청 사용자가 해당 document에 접근 가능한지)
2. deleted 처리   — id 목록을 DELETE
3. created 처리   — INSERT, auto-increment id 발급. temp_id는 무시
4. updated 처리   — 제공된 필드만 UPDATE (partial update)
5. orders 처리    — orders가 비어있지 않으면 해당 id 목록의 order 컬럼 일괄 UPDATE
6. 트랜잭션 커밋
7. Response: created 항목의 temp_id ↔ 실제 id 매핑 반환
```

---

## 5. 검증 규칙

| 항목 | 규칙 |
|---|---|
| `document_id` | 요청 사용자 소유 document인지 확인 |
| `created[].speaker_id` | 해당 `document_id`에 속한 speaker인지 FK 검증 |
| `updated[].id` | 해당 `document_id`에 속한 script_line인지 확인 |
| `deleted[]` | 해당 `document_id`에 속한 script_line인지 확인 |
| `created[].temp_id` | 백엔드는 저장하지 않음. 응답 매핑에만 사용 |

---

## 6. 실제 payload 예시

### 6-1. 텍스트만 수정한 경우

```json
{
  "created": [],
  "updated": [
    { "id": 42, "text": "수정된 내용입니다." }
  ],
  "deleted": [],
  "orders": []
}
```

### 6-2. 화자만 변경한 경우

```json
{
  "created": [],
  "updated": [
    { "id": 42, "speaker_id": 3 }
  ],
  "deleted": [],
  "orders": []
}
```

### 6-3. 라인을 추가한 경우

기존 라인 [41, 42, 43] 사이에 새 라인을 42 뒤에 삽입:

```json
{
  "created": [
    {
      "temp_id": "new_1708123456",
      "speaker_id": 2,
      "text": "새로 추가된 라인입니다.",
      "start_time": null,
      "order": 2
    }
  ],
  "updated": [],
  "deleted": [],
  "orders": [
    { "id": 41, "order": 0 },
    { "id": 42, "order": 1 },
    { "id": 43, "order": 3 }
  ]
}
```

### 6-4. 라인을 삭제한 경우

기존 라인 [41, 42, 43]에서 42 삭제:

```json
{
  "created": [],
  "updated": [],
  "deleted": [42],
  "orders": [
    { "id": 41, "order": 0 },
    { "id": 43, "order": 1 }
  ]
}
```

### 6-5. 변경 없음

변경이 없으면 **프론트에서 API를 호출하지 않습니다.** 빈 body를 보내는 케이스는 없습니다.

---

## 7. temp_id 처리 방침

- `created` 배열의 각 항목에는 프론트가 생성한 임시 ID(`"new_1708123456"` 형식)가 포함됩니다.
- 백엔드는 이 값을 DB에 저장하지 않으며, INSERT 후 auto-increment로 발급된 실제 id를 사용합니다.
- 응답 시 `{ temp_id, id }` 매핑을 반환하여 프론트가 상태를 실제 id로 교체할 수 있도록 합니다.

---

## 8. 관련 프론트 코드

- `src/lib/api.ts` — `patchScriptLines()`, `patchDocumentStatus()` stub (TODO 주석 포함)
- `src/pages/EditorPage.tsx` — `buildDiff()`, `saveLines()`, `handleSaveProgress()`, `handleComplete()`
- `src/types/index.ts` — `ScriptLineDiff` 타입 정의

---

# 백엔드 API 스펙: 문서 상태 변경

---

## 1. 엔드포인트

```
PATCH /api/v1/documents/{document_id}
Content-Type: application/json
Authorization: Bearer {token}
```

---

## 2. Request Body 스키마

```json
{
  "status": "in_progress"   // "in_progress" | "completed"
}
```

| 필드 | 타입 | 값 | 설명 |
|---|---|---|---|
| `status` | string | `"in_progress"` | 사이드바 "진행상태 저장" 클릭 시 |
| `status` | string | `"completed"` | 사이드바 "작업 완료" 클릭 시 |

---

## 3. Response 형식

### 성공 (200 OK)

```json
{
  "data": {
    "id": 12,
    "status": "in_progress",
    "updated_at": "2026-02-22T10:00:00Z"
  }
}
```

### 실패 (4xx / 5xx)

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "document 12 not found"
  }
}
```

---

## 4. 백엔드 처리 순서

```
1. document_id 소유권 검증
2. status 필드 UPDATE
3. updated_at 갱신
4. 변경된 document 반환
```

---

## 5. 검증 규칙

| 항목 | 규칙 |
|---|---|
| `document_id` | 요청 사용자 소유 document인지 확인 |
| `status` | `"in_progress"` 또는 `"completed"` 중 하나여야 함 |

---

## 6. 호출 시점

두 버튼은 스크립트 라인 저장(`PATCH .../script_lines`) 완료 후 순차적으로 호출됩니다.

```
사용자 클릭
  └─ patchScriptLines()   → PATCH /api/v1/documents/{id}/script_lines
  └─ patchDocumentStatus() → PATCH /api/v1/documents/{id}
```

변경 없음(diff = null)이면 `patchScriptLines`는 호출되지 않고, `patchDocumentStatus`만 호출됩니다.
