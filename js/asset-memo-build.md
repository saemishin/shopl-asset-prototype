# 메모 에디터 번들

`asset-memo.source.js`는 대시보드의 Tiptap 3.29.2 설정을 정적 프로토타입에 적용하는 어댑터다. `asset-memo.js`는 의존성을 포함한 생성 파일이며 HTML에서 직접 로드한다. 페이지 실행에는 CDN이나 패키지 설치가 필요 없다.

빌드할 때 임시 폴더에 다음 패키지의 3.29.2 버전을 설치한다: `@tiptap/core`, `@tiptap/starter-kit`, `@tiptap/extension-highlight`, `@tiptap/extension-image`, `@tiptap/extension-list`, `@tiptap/extension-text-align`, `@tiptap/extensions`, `@tiptap/extension-link`, `@tiptap/pm`. 빌드 도구는 `esbuild@0.25.12`를 사용한다.

직접 의존성뿐 아니라 모든 `@tiptap/*` 전이 의존성도 3.29.2로 고정한다. pnpm을 쓰는 경우 `pnpm-workspace.yaml`의 `overrides`에 설치된 모든 Tiptap 패키지를 지정한다. 기본 범위 의존성만 설치하면 다른 버전이 섞일 수 있다.

소스를 임시 폴더로 복사하여 의존성을 해석한 뒤 아래 명령으로 번들을 생성한다.

```sh
esbuild asset-memo.source.js --bundle --format=iife --target=es2020 --minify --legal-comments=inline --outfile=/path/to/shopl-asset-prototype/js/asset-memo.js
```

기존 형식 없는 시드 메모는 HTML 특수문자를 이스케이프해 변환한다. `_noteFormat`은 프로토타입용 형식 표시이며 실제 서버 API 필드 계약이 아니다. 저장되는 본문 HTML과 읽기 전용 표시·빈 값 판정·본문 텍스트 변환은 동일 어댑터에서 처리한다. 실제 앱/서버의 동기화나 데이터 마이그레이션을 이 번들로 구현한 것은 아니다.

MIT 라이선스: Tiptap 및 ProseMirror. 번들 재생성 시 패키지 버전과 라이선스를 유지한다.

## 구현 명세

확정 정책은 `asset-memo.source.js` 상단 주석에 명시한다. 본문 500자, 공통 빈 값 판정, 폼 직접 편집과 상세 팝업, 내용·서식 변경 감지, 수정 중단 확인, 링크 및 붙여넣기 기준을 적용한다. UI 통합 파일은 `asset-register.js`, `detail.js`, `app.js`, `leader.js`이며 목록 판정은 `assets.js`, `mapp-asset-filter.js`에서 같은 어댑터를 사용한다.

근거: 현재 대시보드 웹 main `9c9ebeea7cf18b14fdbc3be0dcdbfb949382bf60`의 Tiptap 3.29.2 에디터와 사용자가 확정한 자산 메모 정책. 운영 서비스 배포 커밋과의 일치는 별도 확인 대상이다. 보고서 전용 접기 헤더·설명은 적용하지 않는다.
