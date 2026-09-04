# Shopl 자산관리 프로토타입

`자산관리_구조설계안.md` / `자산관리_UX설계안.md` 기반의 클릭 가능한 화면 프로토타입.
정적 HTML/CSS/JS, 빌드 없음. GitHub Pages로 서비스.

## 화면

| 파일 | 화면 | 상태 |
|---|---|---|
| `assets.html` | 현황 — 자산 목록 (진입 화면). 뷰 4종(전체/제품별/구성원별/근무지별), 툴바, 샘플 테이블 | 1차 |
| `asset-detail.html?id=` | 자산 상세 (개별형/수량형). 기본정보 / 배정·보유 현황 / 사진 / QR / 하위 액션 버튼 | 1차 |
| `category.html` | 분류 탭 | 스텁 |
| `settings.html` | 설정 탭 | 스텁 |
| `batch-register.html` | 일괄 자산 등록 | 스텁 |
| `batch-assign.html` | 일괄 배정·보유 변경 | 스텁 |

## 구조

- `js/shell.js` — 좌측 LNB + 상단바 공통 셸 (자산 메뉴만 활성)
- `js/data.js` — 샘플 데이터
- `js/assets.js` — 자산 목록 화면
- `js/detail.js` — 자산 상세 화면
- `css/app.css` — 전체 스타일

## 로컬 실행

```
python3 -m http.server 8080
# http://localhost:8080
```
