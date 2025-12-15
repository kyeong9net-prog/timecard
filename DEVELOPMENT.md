# 개발자 가이드

외부강사 전자 서명 출근부 시스템의 개발 가이드입니다.

## 개발 환경 설정

### 필수 도구

- Node.js 18.0 이상
- npm 또는 yarn
- Git
- VS Code (권장)

### VS Code 확장 프로그램 (권장)

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features

### 초기 설정

```bash
# 저장소 클론
git clone <repository-url>
cd timecard

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 프로젝트 아키텍처

### 디렉토리 구조

```
timecard/
├── components/         # React 컴포넌트
│   ├── admin/         # 관리자 전용 컴포넌트
│   │   ├── ConfirmModal.tsx
│   │   ├── InstructorFormModal.tsx
│   │   ├── CourseFormModal.tsx
│   │   └── StorageUsageWidget.tsx
│   ├── AdminLayout.tsx
│   ├── CourseList.tsx
│   ├── Header.tsx
│   └── ...
├── contexts/          # React Context
│   └── AuthContext.tsx    # 인증 상태 관리
├── data/              # Mock 데이터
│   ├── index.ts
│   ├── mock-admins.ts
│   ├── mock-instructors.ts
│   └── mock-courses.ts
├── hooks/             # Custom Hooks
│   └── useAutoSync.ts     # 자동 동기화
├── lib/               # 유틸리티 함수
│   ├── storage-utils.ts          # 기본 저장소
│   ├── storage-error-handler.ts  # 에러 처리
│   ├── instructor-utils.ts       # 강사 관리
│   ├── course-utils.ts           # 강의 관리
│   ├── data-log-utils.ts         # 변경 이력
│   ├── time-utils.ts             # 시간 유틸리티
│   ├── sync-utils.ts             # 동기화
│   └── offline-storage-utils.ts  # 오프라인 저장
├── pages/             # Next.js 페이지
│   ├── _app.tsx       # App 컴포넌트
│   ├── index.tsx      # 메인 페이지
│   ├── sign/          # 강사 서명
│   ├── admin/         # 관리자
│   └── approver/      # 확인자
├── styles/            # 스타일
│   └── globals.css
├── types/             # TypeScript 타입
│   └── index.ts
└── public/            # 정적 파일
```

### 주요 타입 정의

#### Signature (서명)
```typescript
interface Signature {
  id: string
  instructorId: string
  courseId: string
  date: string                    // YYYY-MM-DD
  timestamp: string               // YYYY-MM-DDTHH:mm:ss
  imageData: string               // SVG 데이터
  status: 'normal' | 'activated' | 'invalidated'
  syncStatus?: 'synced' | 'pending' | 'failed'
}
```

#### Instructor (강사)
```typescript
interface Instructor {
  id: string
  name: string
  isActive: boolean
}
```

#### Course (강의)
```typescript
interface Course {
  id: string
  name: string
  code: string
  attendanceType: AttendanceType
  isActive: boolean
}

type AttendanceType = 'daily-multiple' | 'time-range' | 'class-period'
```

#### DataChangeLog (변경 이력)
```typescript
interface DataChangeLog {
  id: string
  timestamp: string
  adminId: string
  adminName: string
  actionType: DataChangeActionType
  targetType: DataTargetType
  targetId: string
  targetName: string
  beforeValue?: any
  afterValue?: any
  reason?: string
}
```

전체 타입 정의는 `types/index.ts`를 참고하세요.

## LocalStorage 구조

### 저장 키 목록

| 키 | 설명 | 타입 |
|---|---|---|
| `signatures` | 서명 데이터 | `Signature[]` |
| `offline-signatures` | 오프라인 서명 | `Signature[]` |
| `activated_dates` | 활성화된 날짜 | `ActivatedDate[]` |
| `admin_logs` | 관리자 행위 로그 | `AdminLog[]` |
| `approver_signatures` | 확인자 서명 | `ApproverSignature[]` |
| `month_locks` | 월 마감 정보 | `MonthLock[]` |
| `pdf_export_history` | PDF 출력 이력 | `PdfExportHistory[]` |
| `sync_conflicts` | 동기화 충돌 | `SyncConflict[]` |
| `instructors` | 강사 목록 | `Instructor[]` |
| `courses` | 강의 목록 | `Course[]` |
| `instructor-course-mappings` | 강사-강의 매핑 | `InstructorCourseMapping[]` |
| `data-change-logs` | 데이터 변경 이력 | `DataChangeLog[]` |

### 데이터 접근 패턴

```typescript
// 읽기
import { getAllSignatures } from '@/lib/storage-utils'
const signatures = getAllSignatures()

// 쓰기
import { saveSignature } from '@/lib/storage-utils'
saveSignature(newSignature)

// 안전한 쓰기 (에러 처리)
import { safeSetItem } from '@/lib/storage-error-handler'
const error = safeSetItem('key', JSON.stringify(data))
if (error) {
  alert(error.message)
}
```

## 코딩 컨벤션

### TypeScript

- **Strict 모드**: 모든 TypeScript strict 옵션 활성화
- **명시적 타입**: 함수 파라미터와 리턴 타입 명시
- **any 사용 최소화**: 가능한 구체적인 타입 사용

### React

- **함수형 컴포넌트**: 모든 컴포넌트는 함수형으로 작성
- **Hooks**: useState, useEffect, useMemo 등 적절히 사용
- **Props 타입**: 모든 props에 대해 interface 정의

```typescript
interface ComponentProps {
  title: string
  onSubmit: (value: string) => void
  isLoading?: boolean
}

export default function Component({ title, onSubmit, isLoading = false }: ComponentProps) {
  // ...
}
```

### 파일 명명 규칙

- **컴포넌트**: PascalCase (예: `SignatureCanvas.tsx`)
- **유틸리티**: kebab-case (예: `storage-utils.ts`)
- **페이지**: kebab-case 또는 동적 라우팅 (예: `[courseId].tsx`)

### 함수 명명 규칙

- **이벤트 핸들러**: `handle` 접두사 (예: `handleSubmit`)
- **Boolean 함수**: `is` 또는 `has` 접두사 (예: `isActive`, `hasPermission`)
- **유틸리티 함수**: 동사로 시작 (예: `formatTimestamp`, `getCurrentDate`)

## 주요 기능 구현 가이드

### 1. 새로운 서명 저장하기

```typescript
import { saveSignature } from '@/lib/storage-utils'
import { getCurrentTimestampKST } from '@/lib/time-utils'

const signature: Signature = {
  id: `sig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  instructorId: 'instructor-1',
  courseId: 'course-1',
  date: '2025-01-15',
  timestamp: getCurrentTimestampKST(),
  imageData: svgData,
  status: 'normal',
}

try {
  saveSignature(signature)
  alert('서명이 저장되었습니다.')
} catch (error) {
  alert('서명 저장 실패')
}
```

### 2. 강사 관리 (Phase 9)

```typescript
import { createInstructor, updateInstructor, deactivateInstructor } from '@/lib/instructor-utils'

// 강사 생성
const newInstructor = createInstructor(
  '홍길동',
  'admin-id',
  '관리자명'
)

// 강사 수정
updateInstructor(
  'instructor-1',
  '홍길동(수정)',
  'admin-id',
  '관리자명'
)

// 강사 비활성화
deactivateInstructor(
  'instructor-1',
  'admin-id',
  '관리자명'
)
```

### 3. 날짜 활성화 (Phase 4)

```typescript
import { saveActivatedDate } from '@/lib/storage-utils'

const activatedDate: ActivatedDate = {
  id: `act-${Date.now()}`,
  instructorId: 'instructor-1',
  courseId: 'course-1',
  date: '2025-01-10',
  reason: '서명 누락',
  activatedBy: 'admin-id',
  activatedAt: getCurrentTimestampKST(),
}

saveActivatedDate(activatedDate)
```

### 4. 오프라인 서명 처리

```typescript
import { saveOfflineSignature } from '@/lib/offline-storage-utils'
import { syncAllOfflineSignatures } from '@/lib/sync-utils'

// 오프라인 서명 저장
if (!navigator.onLine) {
  saveOfflineSignature(signature)
}

// 네트워크 복구 시 동기화
window.addEventListener('online', async () => {
  const result = await syncAllOfflineSignatures()
  console.log(`${result.success}건 동기화 성공`)
})
```

## 테스트

### 수동 테스트 체크리스트

#### 강사 기능
- [ ] 강사 선택 가능
- [ ] 강의 선택 가능
- [ ] 서명 입력 및 저장
- [ ] 중복 서명 차단
- [ ] 활성화된 날짜에 서명 가능

#### 관리자 기능
- [ ] 로그인/로그아웃
- [ ] 서명 현황 조회
- [ ] 날짜 활성화
- [ ] 서명 무효화
- [ ] 강사/강의 관리
- [ ] 변경 이력 조회

#### 오프라인 모드
- [ ] 오프라인 배너 표시
- [ ] 오프라인 서명 저장
- [ ] 동기화 자동 실행
- [ ] 충돌 처리

### 린트 및 타입 체크

```bash
# ESLint 실행
npm run lint

# TypeScript 타입 체크
npx tsc --noEmit

# 자동 수정
npm run lint -- --fix
```

## 성능 최적화

### React 최적화

```typescript
// useMemo로 계산 비용 절감
const filteredData = useMemo(() => {
  return data.filter(item => item.isActive)
}, [data])

// React.memo로 불필요한 리렌더링 방지
export default React.memo(Component)
```

### LocalStorage 최적화

- 필요한 데이터만 조회
- 대량 데이터는 페이지네이션 고려
- 오래된 로그는 주기적으로 삭제

## 배포

### 프로덕션 빌드

```bash
npm run build
npm start
```

### 정적 호스팅

Next.js를 정적 사이트로 export:

```bash
# next.config.js에 output: 'export' 추가
npm run build
# out/ 폴더를 호스팅 서비스에 업로드
```

## 트러블슈팅

### LocalStorage 용량 초과

**증상**: "저장 공간이 부족합니다" 에러

**해결**:
1. 관리자 대시보드에서 저장소 사용량 확인
2. 오래된 데이터 삭제
3. 브라우저 캐시 정리

### 서명이 저장되지 않음

**증상**: 서명 제출 시 저장 안 됨

**확인 사항**:
1. 브라우저 콘솔에서 에러 확인
2. LocalStorage 접근 권한 확인 (프라이빗 브라우징 해제)
3. 네트워크 상태 확인 (오프라인 모드 여부)

### 오프라인 동기화 실패

**증상**: 네트워크 복구 후에도 동기화 안 됨

**해결**:
1. 브라우저 콘솔에서 에러 확인
2. 충돌 로그 확인 (`/admin/sync-conflicts`)
3. 수동 재시도 또는 오프라인 데이터 수동 처리

## 기여 가이드

1. 새 기능 브랜치 생성
2. 코드 작성 및 테스트
3. Lint 및 TypeCheck 통과 확인
4. Pull Request 생성

## 참고 자료

- [Next.js 공식 문서](https://nextjs.org/docs)
- [React 공식 문서](https://react.dev)
- [TypeScript 공식 문서](https://www.typescriptlang.org/docs)
- [Tailwind CSS 공식 문서](https://tailwindcss.com/docs)
