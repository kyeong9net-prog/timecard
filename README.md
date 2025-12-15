# 외부강사 전자 서명 출근부 시스템

외부강사의 출근부를 전자 서명으로 관리하는 웹 기반 시스템입니다. 태블릿 환경에서 최적화되어 있으며, 관리자는 강사별/강의별 출석 현황을 조회하고 관리할 수 있습니다.

## 주요 기능

### 강사용 기능
- **전자 서명**: 태블릿에서 펜/터치로 서명 입력
- **당일 서명**: 오늘 날짜에 한해 서명 가능
- **중복 방지**: 같은 날짜에 중복 서명 차단
- **활성화된 과거 날짜 서명**: 관리자가 활성화한 날짜에 대해 보충 서명 가능
- **오프라인 모드**: 네트워크 단절 시에도 서명 가능, 복구 시 자동 동기화

### 관리자용 기능
- **서명 현황 조회**: 강사별/강의별/월별 서명 현황 확인
- **날짜 활성화**: 서명 누락 시 과거 날짜 활성화
- **서명 무효화**: 잘못된 서명 무효 처리
- **마스터 데이터 관리**: 강사/강의 등록, 수정, 비활성화
- **강사-강의 배정**: 강사에게 강의 배정 및 해제
- **변경 이력 조회**: 모든 데이터 변경 내역 추적
- **저장소 관리**: LocalStorage 사용량 모니터링

### 확인자용 기능
- **월별 출근부 확인**: 월말 출근부 검토
- **확인자 서명**: 전자 서명으로 확인
- **월 마감**: 검토 완료 후 해당 월 잠금

## 기술 스택

- **Frontend**: Next.js 14 (Pages Router), TypeScript, React
- **Styling**: Tailwind CSS
- **Storage**: LocalStorage (Mock 데이터)
- **Canvas**: HTML5 Canvas API (서명 입력)

## 시작하기

### 필수 요구사항

- Node.js 18.0 이상
- npm 또는 yarn

### 설치 및 실행

1. **저장소 클론**
```bash
git clone <repository-url>
cd timecard
```

2. **의존성 설치**
```bash
npm install
```

3. **개발 서버 실행**
```bash
npm run dev
```

4. **브라우저에서 접속**
```
http://localhost:3000
```

### 빌드

프로덕션 빌드:
```bash
npm run build
npm start
```

### 린트 및 타입 체크

```bash
npm run lint
npx tsc --noEmit
```

## 프로젝트 구조

```
timecard/
├── components/          # React 컴포넌트
│   ├── admin/          # 관리자용 컴포넌트
│   ├── CourseList.tsx  # 강의 목록
│   ├── Header.tsx      # 공통 헤더
│   └── ...
├── contexts/           # React Context (인증 등)
├── data/              # Mock 데이터
│   ├── mock-instructors.ts
│   ├── mock-courses.ts
│   └── ...
├── hooks/             # Custom React Hooks
├── lib/               # 유틸리티 함수
│   ├── storage-utils.ts      # LocalStorage 관리
│   ├── instructor-utils.ts   # 강사 관리
│   ├── course-utils.ts       # 강의 관리
│   ├── time-utils.ts         # 시간 유틸리티
│   └── ...
├── pages/             # Next.js 페이지
│   ├── index.tsx      # 메인 페이지
│   ├── sign/          # 강사 서명 페이지
│   ├── admin/         # 관리자 페이지
│   └── approver/      # 확인자 페이지
├── styles/            # 글로벌 스타일
├── types/             # TypeScript 타입 정의
└── public/            # 정적 파일
```

## Mock 데이터

현재 시스템은 데이터베이스 없이 LocalStorage를 사용합니다.

### 기본 관리자 계정
- **ID**: admin
- **Password**: admin123

### 기본 확인자 계정
- **ID**: approver
- **Password**: approver123

### 초기 강사 및 강의
프로젝트에는 3명의 샘플 강사와 5개의 샘플 강의가 포함되어 있습니다.
(`/data/mock-instructors.ts` 및 `/data/mock-courses.ts` 참고)

## 사용 흐름

### 강사 서명
1. 메인 페이지에서 "강사 입구" 클릭
2. 강사 선택
3. 강의 선택 (1개만 있으면 자동 선택)
4. 서명 입력
5. 제출

### 관리자 조회
1. "관리자 로그인" 클릭
2. 로그인 (admin/admin123)
3. 대시보드에서 서명 현황 조회
4. 필터링 및 상세 정보 확인

### 과거 날짜 활성화
1. 관리자 대시보드에서 "날짜 활성화" 클릭
2. 강사, 강의, 날짜, 사유 입력
3. 제출
4. 해당 강사가 활성화된 날짜에 서명 가능

## 주요 특징

### 태블릿 최적화
- 터치 친화적 UI (버튼 최소 44x44px)
- 가로 모드 지원
- 펜/터치 입력 최적화

### 오프라인 지원
- 네트워크 단절 시에도 서명 가능
- 최대 50건까지 오프라인 저장
- 네트워크 복구 시 자동 동기화

### 데이터 무결성
- 중복 서명 방지
- 마감된 월 수정 불가
- 모든 관리자 행위 로그 기록
- 데이터 삭제 대신 비활성화

### 저장소 관리
- 실시간 사용량 모니터링
- 80% 이상 사용 시 경고
- 용량 초과 시 명확한 에러 메시지

## 브라우저 호환성

- Chrome 90+
- Safari 14+
- Edge 90+
- iPad Safari 14+

## 제한사항

- **데이터베이스 없음**: 모든 데이터는 브라우저 LocalStorage에 저장됩니다.
- **LocalStorage 제한**: 브라우저당 약 5MB 제한
- **서버 없음**: 순수 프론트엔드 애플리케이션
- **실시간 동기화 없음**: 여러 기기 간 데이터 공유 불가

## 개발 가이드

더 자세한 개발 정보는 [DEVELOPMENT.md](./DEVELOPMENT.md)를 참고하세요.

## 사용자 매뉴얼

사용자 가이드는 [USER_MANUAL.md](./USER_MANUAL.md)를 참고하세요.

## 라이선스

MIT License

## 문의

프로젝트 관련 문의사항은 이슈를 등록해주세요.
