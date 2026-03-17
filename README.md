<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Netlify-Functions-00C7B7?style=flat-square&logo=netlify&logoColor=white" />
</p>

<h1 align="center">SkyKey 청약캘린더</h1>

<p align="center">
  <b>청약홈(applyhome.co.kr) 실시간 연동 청약 일정 캘린더</b><br/>
  매일 자동으로 최신 청약 데이터를 수집하여 한눈에 보여줍니다.
</p>

<p align="center">
  <a href="https://skykey-apply-home.netlify.app"><b>Live Demo</b></a>
</p>

---

## 주요 기능

### 달력 뷰
- 청약홈 API 연동으로 **실제 청약 일정** 표시
- 월별 탭 네비게이션 (연도 이동 지원)
- 공급유형별 색상 구분으로 한눈에 파악

### 필터링
| 공급유형 | 지역 |
|---------|------|
| 특별공급 / 1순위 / 2순위 | 서울 / 경기 / 인천 / 부산 |
| 무순위·잔여 / 오피스텔·도시형 | 대구 / 광주 / 대전 / 울산 / 세종 |
| 공공지원민간임대 | 강원 / 충북 / 충남 / 전북 / 전남 / 경북 / 경남 / 제주 |

### 상세 공고 팝업
- **입주자모집공고 주요정보** — 공급위치, 공급규모, 문의처
- **청약일정** — 모집공고일, 접수기간(특별/일반), 당첨자발표일, 계약일
- **공급대상** — 주택형별 면적, 일반/특별 세대수
- **공급금액 및 입주예정월** — 주택형별 최고가 기준 분양가
- **기타사항** — 시행사, 시공사, 전화번호
- **모집공고문 PDF 다운로드** — 청약홈 원본 공고문 바로 받기

### 자동 데이터 동기화
- 빌드 시 청약홈 API에서 **9개월분 데이터 자동 수집**
- Netlify Scheduled Function으로 **매일 KST 09:00** 자동 리빌드
- 새로운 공고가 올라오면 즉시 반영

---

## 기술 스택

```
Frontend     React 19 + Vite 8 + TailwindCSS 3
Backend      Netlify Functions (Serverless)
Data         청약홈 API (applyhome.co.kr) 실시간 프록시
Scheduling   Netlify Scheduled Functions (Cron)
Deploy       Netlify (자동 빌드/배포)
```

---

## 프로젝트 구조

```
apply-home/
├── src/
│   ├── App.jsx                    # 메인 앱 + 상태 관리
│   ├── api/
│   │   └── schedules.js           # API 호출 (정적 JSON → Netlify Function fallback)
│   └── components/
│       ├── Header.jsx             # 헤더 네비게이션
│       ├── MonthSelector.jsx      # 연도/월 선택 탭
│       ├── FilterBar.jsx          # 공급유형 + 지역 필터
│       ├── Calendar.jsx           # 달력 그리드
│       └── ScheduleModal.jsx      # 상세 공고 팝업
│
├── netlify/functions/
│   ├── schedules.js               # 청약홈 캘린더 API 프록시
│   ├── schedule-detail.js         # 청약홈 상세 공고 HTML 파싱 프록시
│   ├── sync-schedules.js          # 매일 데이터 동기화
│   └── rebuild-trigger.js         # 매일 빌드 트리거 (Cron)
│
├── scripts/
│   └── fetch-data.js              # 빌드 시 청약홈 데이터 수집 스크립트
│
├── public/data/                   # 빌드 시 수집된 정적 JSON 데이터
│   ├── 202601.json ~ 202609.json
│   └── index.json
│
└── netlify.toml                   # Netlify 빌드/배포 설정
```

---

## 데이터 흐름

```
┌─────────────┐     빌드 시      ┌──────────────┐     정적 JSON     ┌──────────┐
│  청약홈 API  │ ──────────────→ │ fetch-data.js │ ──────────────→ │ /data/   │
│ applyhome   │                  │  (9개월 수집)  │                  │ *.json   │
└─────────────┘                  └──────────────┘                  └────┬─────┘
       │                                                                │
       │  실시간 (Netlify Function)                                     │  우선 로드
       │                                                                ▼
       │         ┌───────────────────┐         ┌─────────────────────────────┐
       └────────→│ /api/schedules    │────────→│        프론트엔드 (React)     │
                 │ /api/schedule-    │         │  달력 뷰 + 필터 + 상세 팝업   │
                 │      detail       │         └─────────────────────────────┘
                 └───────────────────┘

┌───────────────────┐     매일 09:00 KST     ┌──────────────┐
│ rebuild-trigger.js │ ───────────────────→  │ Netlify 빌드  │ → 최신 데이터 반영
│  (Scheduled Fn)    │    Build Hook POST    │  자동 트리거   │
└───────────────────┘                        └──────────────┘
```

---

## 로컬 개발

```bash
# 의존성 설치
npm install

# 데이터 수집 (청약홈 API)
npm run fetch-data

# 개발 서버 실행
npm run dev

# 프로덕션 빌드 (데이터 수집 + 빌드)
npm run build
```

---

## 배포 설정

### Netlify 자동 빌드

| 항목 | 값 |
|------|-----|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Functions directory | `netlify/functions` |

### 매일 자동 갱신 설정

1. Netlify Dashboard → **Build hooks** → Add build hook (`daily-rebuild`)
2. **Environment variables** → `NETLIFY_BUILD_HOOK_URL` = 생성된 Hook URL
3. `rebuild-trigger.js`가 매일 UTC 00:00 (KST 09:00)에 빌드 자동 트리거

---

## 로드맵

- [x] 청약홈 API 실시간 연동
- [x] 달력 뷰 + 필터링
- [x] 상세 공고 팝업 (공고정보, 일정, 공급대상, 금액)
- [x] 모집공고문 PDF 다운로드
- [x] 매일 자동 데이터 동기화
- [ ] 회원가입 + 관심 조건 설정
- [ ] 조건 매칭 알림 (이메일 / 카카오톡)
- [ ] skykey.co.kr 통합
- [ ] 청약 자격 계산기
- [ ] 경쟁률 실시간 현황

---

## 라이선스

MIT

---

<p align="center">
  <sub>Powered by <a href="https://www.applyhome.co.kr">청약홈</a> Open Data</sub>
</p>
