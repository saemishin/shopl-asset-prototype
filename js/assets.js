/* 현황 탭 — 자산 목록 (진입 화면) */
(function () {
  const TODAY = new Date("2026-09-04");
  const { assets } = window.DATA;

  // held(보유 중)는 수량형 전용 — 개별형의 배정중처럼 "활성 상태"라 배지 색은 assigned를 그대로 재사용(구조설계안
  // 3.4: status는 개별형·수량형 둘 다 필수, 값 범위만 다름 — 수량형은 stock·held 2종만)
  const STATUS_LABEL = {
    stock: ["재고", "stock"], assigned: ["배정 중", "assigned"], repair: ["수리 중", "repair"],
    lost: ["분실", "lost"], disposed: ["폐기", "disposed"], held: ["보유 중", "assigned"],
  };
  // 개별형 상태값들(기존 순서 유지) → 수량형(보유중) → 공통(재고). 재고가 맨 위였던 걸 맨 아래로 내림(사용자 피드백)
  const STATUS_ORDER = ["assigned", "repair", "lost", "disposed", "held", "stock"];
  const TYPE_LABEL = { individual: "개별 자산", quantity: "수량 자산" };
  const EXP_LABEL = { valid: "유효", soon: "만료 예정", over: "만료", none: "미설정" };
  // 근무지 코드는 구조설계안에 없는 필드 — 근무지가 "기존 재사용" 엔티티라 여기선 프로토타입 데모용 샘플값만 매핑(detail.js의 WS_CODE와 동일)
  const WS_CODE = { "강남점": "GN-01", "판교점": "PG-01", "본사": "HQ-01" };
  // 근무지별 엑셀 다운로드(아이데이션 중)용 주소 — 실 서비스 DB엔 근무지마다 이미 주소값이 있어서 프로토타입엔 더미로만 시드(detail.js의 WS_ADDRESS와 동일)
  const WS_ADDRESS = {
    "강남점": "서울특별시 강남구 테헤란로 129",
    "판교점": "경기도 성남시 분당구 판교역로 235",
    "본사": "서울특별시 중구 을지로 100",
  };
  // 구성원도 근무지와 동일하게 "기존 재사용" 엔티티라 프로토타입 데모용 샘플만 매핑 — 팀은 category.js의 MEMBERS와 동일 값으로 통일,
  // 사번·휴대폰번호는 검색 placeholder(아래)가 이미 약속해놓고 실제 필드가 없던 걸 이번에 시드.
  // grade(등급)·jobTitle(직무·직급, category.js의 JOB_TITLES 값 재사용)은 구성원별 엑셀 다운로드용 —
  // 실 서비스엔 구성원마다 저장돼있는 값, 프로토타입엔 더미로만 시드
  const MEMBER_INFO = {
    "김민수": { team: "개발팀", empNo: "2021001", phone: "010-2001-1234", grade: "Lv.3", jobTitle: "매니저" },
    "이서연": { team: "디자인팀", empNo: "2021015", phone: "010-3412-5678", grade: "Lv.2", jobTitle: "주임" },
    "박지훈": { team: "영업팀", empNo: "2020032", phone: "010-8823-9910", grade: "Lv.4", jobTitle: "팀장" },
    "정우성": { team: "CS팀", empNo: "2022041", phone: "010-5567-2231", grade: "Lv.1", jobTitle: "사원" },
    "김철수": { team: "운영팀", empNo: "2019008", phone: "010-9012-4456", grade: "Lv.5", jobTitle: "팀장" },
    "최유진": { team: "개발팀", empNo: "2023019", phone: "010-6634-8821", grade: "Lv.1", jobTitle: "사원" },
    "한소희": { team: "디자인팀", empNo: "2022055", phone: "010-4478-2093", grade: "Lv.2", jobTitle: "주임" },
    "오세훈": { team: "운영팀", empNo: "2018014", phone: "010-7712-3345", grade: "Lv.4", jobTitle: "매니저" },
  };
  const AVATAR_COLORS = ["#5b8def", "#8f6ef0", "#eb7f8b", "#3fb37f", "#e0a63c", "#4dabf7"];
  function avatarColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
  }
  // 배정 현황 카드(detail.js의 assignIdentity)와 동일한 프로필+이름+그룹 컴포넌트 재사용
  function memberIdentity(name) {
    const team = (MEMBER_INFO[name] || {}).team;
    return `<span class="acard-avatar" style="background:${avatarColor(name)}">${name[0]}</span>
      <div><div class="acard-name">${name}</div><div class="acard-sub">${team || '<span class="muted">—</span>'}</div></div>`;
  }
  // 구성원 필터 — 실제 대시보드의 공통 "직원 필터" 팝업 목업. 복잡한 실사용 필터 로직은 이 프로토타입 범위 밖이라
  // 버튼을 누르면 뜨는 모달 형태만 재현(적용해도 실제 목록엔 반영 안 됨). 그룹 트리는 category.js의 GROUP_TREE와 동일 구조 재사용
  const MEMBER_GROUP_TREE = [
    { name: "샤플앤컴퍼니", children: [
      { name: "개발팀" }, { name: "디자인팀" },
      { name: "영업팀", children: [{ name: "국내영업" }, { name: "해외영업" }] },
      { name: "운영팀" }, { name: "CS팀" },
    ] },
  ];
  const MEMBER_JOB_TITLES = ["직무/직급 없음", "팀장", "매니저", "주임", "사원"];
  const SEARCH_PLACEHOLDER = {
    all: "고유관리번호 / 품목명", product: "품목명", employee: "이름/사번/휴대폰번호", worksite: "근무지명/코드",
  };
  const RESET_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 1 2.64 6.36"/><path d="M3 20v-6h6"/></svg>`;
  const SORT_ASC_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18V6M5 6l-3 3M5 6l3 3"/><path d="M11 7h4M11 12h7M11 17h10"/></svg>`;
  const SORT_DESC_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 6v12M5 18l-3-3M5 18l3-3"/><path d="M11 7h10M11 12h7M11 17h4"/></svg>`;
  // 정렬 기준별 기본 방향: 날짜(등록일·유효기한)는 최신순(desc), 문자열(품목명·고유관리번호)은 가나다순(asc)
  const SORT_FIELDS = [
    { k: "updatedAt", label: "최근 변경일시", defDir: "desc" },
    { k: "assetNo", label: "고유 관리번호", defDir: "asc" },
    { k: "product", label: "품목명", defDir: "asc" },
    { k: "expiry", label: "유효기한", defDir: "desc" },
    { k: "createdAt", label: "자산 등록일", defDir: "desc" },
  ];
  // 품목별은 행이 자산(유닛)이 아니라 품목 단위라, 유닛에만 있는 값(고유관리번호·유효기한·등록일)은 정렬 기준에서 제외.
  // 최근 변경일시는 그 품목에 속한 유닛들의 값 중 최댓값으로 파생(전체 탭과 기본 방향은 동일하게 맞춤)
  const SORT_FIELDS_PRODUCT = [
    { k: "updatedAt", label: "최근 변경일시", defDir: "desc" },
    { k: "product", label: "품목명", defDir: "asc" },
  ];
  // 구성원별·근무지별은 자산이 아니라 사람/장소 단위 행이라 "최근 변경일시" 같은 자산 이벤트 파생값은 개념이
  // 헷갈릴 수 있어 제외 — 이미 컬럼으로 노출된 정체성 값(이름/사번, 근무지명/코드)만 정렬 기준으로 제공
  const SORT_FIELDS_MEMBER = [
    { k: "name", label: "이름", defDir: "asc" },
    { k: "empNo", label: "사번", defDir: "asc" },
  ];
  const SORT_FIELDS_WORKSITE = [
    { k: "name", label: "근무지명", defDir: "asc" },
    { k: "code", label: "근무지 코드", defDir: "asc" },
  ];
  function sortFieldsFor(view) {
    if (view === "product") return SORT_FIELDS_PRODUCT;
    if (view === "employee") return SORT_FIELDS_MEMBER;
    if (view === "worksite") return SORT_FIELDS_WORKSITE;
    return SORT_FIELDS;
  }

  function expiryKey(d) {
    if (!d) return "none";
    const days = Math.ceil((new Date(d) - TODAY) / 86400000);
    return days < 0 ? "over" : days <= 7 ? "soon" : "valid";
  }
  function expiryCell(d) {
    if (!d) return '<span class="muted">—</span>';
    const k = expiryKey(d);
    return `${window.fmtDate(d)} <span class="badge exp-${k}">${EXP_LABEL[k]}</span>`;
  }
  const IC_EMP = `<svg class="hi" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5"/></svg>`;
  const IC_WS = `<svg class="hi" viewBox="0 0 24 24"><path d="M4 20V9.5L12 4l8 5.5V20"/><path d="M9.5 20v-5h5v5"/></svg>`;
  // 소진 — 수량형 전용, 품목의 잔여 수량(total_qty - 배분합계)이 0인 상태(더 이상 나눠줄 여유가 없음)
  function isDepleted(a) {
    return a.type === "quantity" && a.totalQty - (a.stocks || []).reduce((s, x) => s + x.qty, 0) === 0;
  }
  // 미보유대상 — 소진과는 다른 개념. 보유 대상(AssetStock 레코드) 중 수량이 0인 것 — "이 품목을 다
  // 나눠줬다"가 아니라 "이 특정 대상은 지금 0개다"를 가리킴(재입고 필요 대상을 짚어주는 신호). 소진 여부와
  // 무관하게 그대로 집계(소진일 때 제외하는 건 배정·보유 현황 셀의 뱃지 중복 방지용이었는데 그 뱃지 자체를
  // 뺐으므로 통계·필터에선 더 이상 제외할 이유가 없음 — 레코드가 quantity=0이면 항상 카운트)
  function unheldHolders(a) {
    if (a.type !== "quantity") return [];
    return (a.stocks || []).filter(x => x.qty === 0);
  }
  function hasUnheldHolder(a) {
    return unheldHolders(a).length > 0;
  }
  function holderText(a) {
    if (a.type === "individual") {
      const as = a.assignments || [];
      // "상태" 컬럼에 이미 재고 뱃지가 있어서 여기선 중복 표기하지 않음
      if (!as.length) return '<span class="muted">—</span>';
      // 상세 페이지 배정 현황 카드와 동일하게 배정일 내림차순(최신이 첫번째)
      const sorted = [...as].sort((p, q) => p.since === q.since ? 0 : (p.since < q.since ? 1 : -1));
      // 배정 대상(구성원/근무지)을 레코드 순서대로 평탄화 — 복합 레코드는 구성원→근무지
      const targets = [];
      sorted.forEach(x => {
        if (x.employee) targets.push(`${IC_EMP}${x.employee}`);
        if (x.worksite) targets.push(`${IC_WS}${x.worksite}`);
      });
      if (sorted.length === 1) return targets.join(" ");              // 단일 배정(복합이면 둘 다 표시)
      return `${targets[0]} <span class="muted">+${targets.length - 1}</span>`;  // 공동 배정: 첫 대상 + N
    }
    // 수량 자산도 개별 자산과 동일한 패턴(보유처 이름, 총 개수 미표기)으로 통일 — "상태" 컬럼에
    // 이미 재고/보유중 뱃지가 있어서 여기선 중복 표기하지 않음(개별 자산과 동일 원칙)
    const stocks = a.stocks || [];
    if (!stocks.length) return '<span class="muted">—</span>';
    // 상세 페이지 보유 현황 카드와 동일하게 이름 가나다순
    const sorted = [...stocks].sort((p, q) => (p.employee || p.worksite).localeCompare(q.employee || q.worksite, "ko"));
    const targets = sorted.map(x => x.employee ? `${IC_EMP}${x.employee}` : `${IC_WS}${x.worksite}`);
    // 소진/미보유대상은 상태 컬럼과 무관한 별도 통계라 여기 셀엔 표시 안 함(전체 탭은 요약 화면이라
    // 자기완결성까진 필요 없음 — 통계 카드 툴팁 + 필터 칩으로 충분, 특정 보유 대상이 궁금하면 상세 페이지에서 확인)
    if (sorted.length === 1) return targets.join(" ");
    return `${targets[0]} <span class="muted">+${targets.length - 1}</span>`;
  }
  function thumb(a) {
    const ph = window.assetPhotos(a);            // 대표 사진 (상세와 공유)
    if (ph.length) {
      const c = ph[a._primary || 0].color;
      return `<span class="thumb" style="background:${c}"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="m21 16-5-5-9 8"/></svg></span>`;
    }
    return `<span class="thumb empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-4 4 3 4-4 5 4"/></svg></span>`;
  }
  function prodCell(a) {
    return `<div class="prodcell">${thumb(a)}<span class="pname">${a.product}</span></div>`;
  }
  function memoCell(a) {
    if (!a.note) return "";
    return `<span class="memo-flag" title="${String(a.note).replace(/"/g, '&quot;')}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M9 13h5M9 17h4"/></svg></span>`;
  }
  function labelsCell(labels) {
    if (!labels || !labels.length) return '<span class="muted">—</span>';
    const show = labels.slice(0, 2).map(l => `<span class="tag">${l}</span>`).join("");
    return show + (labels.length > 2 ? `<span class="muted">+${labels.length - 2}</span>` : "");
  }

  /* ---------- state & filtering ---------- */
  const ALL_LABELS = [...new Set(assets.flatMap(a => a.labels || []))].sort();
  const CAT_GROUPS = (() => {
    const m = new Map();
    window.DATA.categories.forEach(c => {
      if (!m.has(c.group)) m.set(c.group, []);
      m.get(c.group).push(c.sub);
    });
    return m;
  })();
  // 소분류명 → 분류 관리(구조설계안 sort_order)에 저장된 등장 순서. 구성원별·근무지별 "배정된 자산" 요약/모달의
  // 소분류 정렬 기준으로 사용 — 개수순이 아니라 분류 화면과 동일한 순서로 보여야 두 화면 간에 일관됨
  const CATEGORY_ORDER = new Map(window.DATA.categories.map((c, i) => [c.sub, i]));
  function subOrder(sub) { return CATEGORY_ORDER.has(sub) ? CATEGORY_ORDER.get(sub) : 999; }

  const state = {
    view: "all",
    search: "",
    page: 1,
    pageSize: 20,
    sort: { key: "updatedAt", dir: "desc" },
    filters: { category: [], type: [], status: [], expiry: [], labels: [], note: [], depleted: [], unheld: [] },
    // 품목별 탭 전용 — 개별 자산/수량 자산은 컬럼 구성·클릭 동작이 아예 달라서 한 테이블에 섞지 않고 토글로 구분
    productType: "individual",
  };
  // 품목별 행 클릭 시 필요한 품목 그룹(품목명+자산 목록)을 렌더링 시점의 키로 찾기 위한 조회용 — view_product()가 매번 다시 채움
  let productGroupsByKey = new Map();
  // 구성원별·근무지별 행 클릭 시 필요한 조회용 — 위와 동일한 패턴(view_employee()/view_worksite()가 매번 다시 채움)
  let memberRowsByName = new Map();
  let worksiteRowsByName = new Map();
  function sortList(list) {
    const { key, dir } = state.sort;
    const mul = dir === "asc" ? 1 : -1;
    const val = a => a[key] || "";
    return [...list].sort((a, b) => {
      const va = val(a), vb = val(b);
      // 값이 없는 항목은 정렬 방향과 무관하게 항상 맨 뒤로
      if (!va && !vb) return 0;
      if (!va) return 1;
      if (!vb) return -1;
      if (key === "product" || key === "assetNo" || key === "name" || key === "empNo" || key === "code") return va.localeCompare(vb, "ko") * mul;
      return (va < vb ? -1 : va > vb ? 1 : 0) * mul;
    });
  }
  function emptyFilters() {
    // depleted(소진)·unheld(미보유대상)는 상태값이 아니라 파생 조건이라 상태 필터 모달·헤더 필터엔
    // 없음 — 전체 탭 통계 "수량 자산 요약" 카드 클릭으로만 켜고 끔
    return { category: [], type: [], status: [], expiry: [], labels: [], note: [], depleted: [], unheld: [] };
  }

  function getFiltered() {
    const f = state.filters;
    const q = state.search.trim().toLowerCase();
    return assets.filter(a => {
      // 분류 필터 항목은 "대분류"(부모 체크 시 자체로도 들어감) 또는 "대분류/소분류"(leaf) 둘 다 올 수 있음
      if (f.category.length && !f.category.some(c => c === a.group || c === `${a.group}/${a.sub}`)) return false;
      if (f.type.length && !f.type.includes(a.type)) return false;
      // 수량형도 이제 실제 status(stock·held)를 가지므로 개별형 전용 가드는 제거 — 값 자체가
      // 타입별로 겹치지 않아(held는 수량형만, assigned/repair/lost/disposed는 개별형만) 자연히 분리됨
      if (f.status.length && !f.status.includes(a.status)) return false;
      if (f.expiry.length && !f.expiry.includes(expiryKey(a.expiry))) return false;
      if (f.depleted.length && !isDepleted(a)) return false;
      if (f.unheld.length && !hasUnheldHolder(a)) return false;
      if (f.note.length && !f.note.includes(a.note ? "has" : "none")) return false;
      if (f.labels.length) {
        const has = f.labels.filter(l => (a.labels || []).includes(l));
        if (has.length !== f.labels.length) return false;
      }
      // 검색 대상은 뷰마다 다름 — 전체는 고유관리번호+품목명, 품목별은 품목명만. 구성원별·근무지별은
      // 자산이 아니라 집계된 사람/근무지 이름(+코드)을 대상으로 하므로 여기가 아니라 view_axis()에서 걸러냄
      if (q && state.view === "all" && !(`${a.product} ${a.assetNo || ""}`.toLowerCase().includes(q))) return false;
      if (q && state.view === "product" && !a.product.toLowerCase().includes(q)) return false;
      return true;
    });
  }
  function activeFilterCount() {
    const f = state.filters;
    return f.category.length + f.type.length + f.status.length + f.expiry.length + f.labels.length + f.note.length + f.depleted.length + f.unheld.length;
  }
  function pageSlice(arr) {
    const totalPages = Math.max(1, Math.ceil(arr.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    if (state.page < 1) state.page = 1;
    const start = (state.page - 1) * state.pageSize;
    return arr.slice(start, start + state.pageSize);
  }

  /* ---------- header filters ---------- */
  const CARET = `<svg class="th-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;
  function thFilter(label, key, cls = "") {
    const on = (state.filters[key] || []).length ? " active" : "";
    return `<th class="th-filter${on} ${cls}" data-hf="${key}">${label}${CARET}</th>`;
  }
  function headerOptions(key) {
    if (key === "type") return Object.entries(TYPE_LABEL).map(([v, l]) => ({ v, l }));
    if (key === "status") return STATUS_ORDER.map(v => ({ v, l: STATUS_LABEL[v][0] }));
    if (key === "expiry") return Object.entries(EXP_LABEL).map(([v, l]) => ({ v, l }));
    if (key === "note") return [{ v: "has", l: "있음" }, { v: "none", l: "없음" }];
  }
  function openHeaderFilter(anchor, key) {
    document.querySelectorAll(".dropdown-menu").forEach(m => m.remove());
    const cur = (state.filters[key] || [])[0] || "";
    const opts = headerOptions(key);
    const menu = document.createElement("div");
    menu.className = "dropdown-menu";
    menu.innerHTML = opts.map(o => `<button data-v="${o.v}" class="${cur === o.v ? "active" : ""}">${o.l}</button>`).join("");
    const r = anchor.getBoundingClientRect();
    menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${r.left}px;min-width:${Math.max(r.width, 120)}px`;
    document.body.appendChild(menu);
    menu.querySelectorAll("button").forEach(b => b.onclick = () => {
      menu.remove();
      state.filters[key] = b.dataset.v ? [b.dataset.v] : [];
      state.page = 1;
      render();
    });
    setTimeout(() => {
      const close = e => { if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener("click", close); } };
      document.addEventListener("click", close);
    });
  }

  /* ---------- views ---------- */
  function view_all(list) {
    const head = `<tr>
      ${thFilter("자산 유형", "type")}<th>분류</th><th>품목명</th><th>고유관리번호</th>${thFilter("상태", "status")}
      <th>배정·보유 현황</th>${thFilter("유효기한", "expiry")}<th>태그</th>${thFilter("메모", "note", "c")}<th>등록일</th></tr>`;
    const rows = pageSlice(sortList(list)).map(a => {
      const st = `<span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>`;
      return `<tr class="clickable" data-id="${a.id}">
        <td><span class="type-pill">${TYPE_LABEL[a.type]}</span></td>
        <td>${a.group} <span class="muted">›</span> ${a.sub}</td>
        <td>${prodCell(a)}</td>
        <td>${a.assetNo || '<span class="muted">—</span>'}</td>
        <td>${st}</td>
        <td>${holderText(a)}</td>
        <td>${expiryCell(a.expiry)}</td>
        <td>${labelsCell(a.labels)}</td>
        <td class="c">${memoCell(a)}</td>
        <td>${window.fmtDate(a.createdAt)}</td>
      </tr>`;
    }).join("");
    return { head, rows, count: list.length };
  }

  function groupByProduct(list) {
    const map = new Map();
    list.forEach(a => {
      const key = a.sub + "|" + a.product;
      if (!map.has(key)) map.set(key, { product: a.product, group: a.group, sub: a.sub, type: a.type, list: [] });
      map.get(key).list.push(a);
    });
    const groups = [...map.values()];
    // 최근 수정일시 정렬용 — 이 품목에 속한 유닛들의 updatedAt 중 최댓값을 그룹 자체의 값으로 둠
    groups.forEach(g => { g.updatedAt = g.list.reduce((max, a) => (a.updatedAt > max ? a.updatedAt : max), ""); });
    return groups;
  }

  // 품목별 탭은 개별 자산/수량 자산 토글(state.productType)로 완전히 다른 테이블을 그림 — 컬럼 구성도, 행 클릭 동작(모달 vs 상세이동)도
  // 유형마다 달라서 한 테이블에 섞으면 어색했던 걸(수량형 행이 상태 컬럼 전부 "—") 분리해서 해결. 두 테이블 다 분류 화면의 품목 목록 표와
  // 동일한 컬럼 구성(+분류 컬럼만 추가 — 이 화면은 여러 소분류를 가로지르니 분류 표기가 필요)
  function view_product(list) {
    return state.productType === "quantity" ? view_product_quantity(list) : view_product_individual(list);
  }

  function view_product_individual(list) {
    const head = `<tr><th>품목명</th><th>분류</th><th class="num">자산 수</th>
      <th class="num">배정 중</th><th class="num">재고</th><th class="num">수리 중</th><th class="num">분실</th><th class="num">폐기</th></tr>`;
    const groups = groupByProduct(list.filter(a => a.type === "individual"));
    const sorted = sortList(groups);
    const paged = pageSlice(sorted);
    productGroupsByKey = new Map(paged.map(g => [`${g.sub}|${g.product}`, g]));
    const rows = paged.map(g => {
      const counts = { assigned: 0, stock: 0, repair: 0, lost: 0, disposed: 0 };
      g.list.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });
      return `<tr class="clickable" data-pkey="${g.sub}|${g.product}">
        <td><div class="prodcell">${thumb(g.list[0])}<span class="pname">${g.product}</span></div></td>
        <td>${g.group} <span class="muted">›</span> ${g.sub}</td>
        <td class="num">${g.list.length}</td>
        <td class="num">${counts.assigned}</td>
        <td class="num">${counts.stock}</td>
        <td class="num">${counts.repair}</td>
        <td class="num">${counts.lost}</td>
        <td class="num">${counts.disposed}</td>
      </tr>`;
    }).join("");
    return { head, rows, count: groups.length };
  }

  function view_product_quantity(list) {
    const head = `<tr><th>품목명</th><th>분류</th><th class="num">전체 수량</th><th class="num">보유 수량</th><th class="num">잔여 수량</th><th class="num">보유 대상</th><th>유효기한</th></tr>`;
    const groups = groupByProduct(list.filter(a => a.type === "quantity"));
    const sorted = sortList(groups);
    const paged = pageSlice(sorted);
    productGroupsByKey = new Map(paged.map(g => [`${g.sub}|${g.product}`, g]));
    const rows = paged.map(g => {
      // 수량형은 품목=자산이 1:1이라 그룹의 유일한 원소를 그대로 표시(분류 화면 stockRowHtml과 동일 계산)
      const a = g.list[0];
      const qty = (a.stocks || []).reduce((s, x) => s + x.qty, 0);
      const targets = (a.stocks || []).length;
      return `<tr class="clickable" data-pkey="${g.sub}|${g.product}">
        <td><div class="prodcell">${thumb(a)}<span class="pname">${g.product}</span></div></td>
        <td>${g.group} <span class="muted">›</span> ${g.sub}</td>
        <td class="num">${a.totalQty}</td>
        <td class="num">${qty}</td>
        <td class="num">${a.totalQty - qty}</td>
        <td class="num">${targets}</td>
        <td>${a.expiry ? window.fmtDate(a.expiry) : '<span class="muted">—</span>'}</td>
      </tr>`;
    }).join("");
    return { head, rows, count: groups.length };
  }

  // 배정된 자산 요약 셀 — 개별/수량 구분 없이 합친 총 개수 + 소분류별 개수 내림차순(많은 것부터), labelsCell()과
  // 동일한 "앞 2개 + 나머지 N" 오버플로 패턴
  // 소분류별 개수만 보여줌(총합 없음) — 개별형(유닛 1개=1)과 수량형(재고 수량)을 그냥 더하면 "옷 12벌+노트북 1대=13개"처럼
  // 단위가 다른 값이 섞여 의미 없는 숫자가 되므로, 애초에 동질적인 소분류 단위로만 집계
  // 소분류별 개수를 칩(박스) 하나에 "소분류명 개수"로 같이 담아 나열 — 5개 넘으면 나머지는 동일한 칩 형태의 "+N"으로 축약
  // (셀 너비가 넉넉해도 무한정 늘어나지 않도록 상한)
  function assetsSummaryCell(items) {
    if (!items.length) return '<span class="muted">—</span>';
    const bySub = new Map();
    items.forEach(x => bySub.set(x.sub, (bySub.get(x.sub) || 0) + x.qty));
    const sorted = [...bySub.entries()].sort((a, b) => subOrder(a[0]) - subOrder(b[0]));
    const shown = sorted.slice(0, 5).map(([sub, n]) => `<span class="chip">${sub} ${n}</span>`).join("");
    const rest = sorted.length > 5 ? `<span class="chip">+${sorted.length - 5}</span>` : "";
    return `<span class="chip-row">${shown}${rest}</span>`;
  }

  // 구성원별·근무지별 행 클릭 — 배정된 자산 전체 목록. 품목 모달(product-units-modal.js)과 시각 언어는
  // 같지만 그룹 기준이 다름: 거기는 상태(고정 5종)라 5열 그리드가 맞았고, 여기는 소분류(사람/장소마다
  // 1~8개로 가변적)라 세로 섹션 리스트가 더 자연스러움. 개별형은 고유관리번호+상태뱃지, 수량형은 품목명+수량.
  function openAssignedAssetsModal(headerHtml, items) {
    const CLOSE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
    const bySub = new Map();
    items.forEach(x => { if (!bySub.has(x.sub)) bySub.set(x.sub, []); bySub.get(x.sub).push(x); });
    // 요약 칩과 동일하게 분류 화면에 저장된 소분류 순서(subOrder)로 섹션을 배치해 컬럼-모달 간 일관성 유지
    const groups = [...bySub.entries()].sort((a, b) => subOrder(a[0]) - subOrder(b[0]));
    groups.forEach(([, list]) => list.sort((p, q) => {
      const pk = p.asset.type === "individual" ? (p.asset.assetNo || "") : p.asset.product;
      const qk = q.asset.type === "individual" ? (q.asset.assetNo || "") : q.asset.product;
      return pk.localeCompare(qk, "ko");
    }));

    function rowHtml(x) {
      const a = x.asset;
      if (a.type === "individual") {
        return `<a class="assign-row" href="asset-detail.html?id=${a.id}" target="_blank" rel="noopener">
          <span>${a.assetNo || "—"}</span>
          <span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>
        </a>`;
      }
      // 개별형의 상태 뱃지와 시각적으로 짝이 맞도록 뱃지 형태 유지, 다만 배정중/수리중/분실 등 상태색과
      // 혼동되지 않게 무채색(.badge.stock의 회색 톤)만 재사용 — 수량은 상태가 아니라 그냥 수치라서
      return `<a class="assign-row" href="asset-detail.html?id=${a.id}" target="_blank" rel="noopener">
        <span>${a.product}</span>
        <span class="badge stock">${x.qty}개</span>
      </a>`;
    }

    // 소분류만으론 어느 대분류인지 알 수 없어서(필터 모달의 분류 트리 미리보기와 동일한 이유) "대분류 › 소분류"로 표기.
    // 같은 소분류의 모든 항목은 항상 같은 대분류에 속하므로 list[0]의 값을 대표로 사용.
    // 섹션은 접고 펼 수 있게(기본은 전부 펼침) — category.js의 대분류 트리 접기/펼치기와 동일한 패턴
    const groupsHtml = groups.map(([sub, list]) => `
      <div class="assign-group">
        <button type="button" class="assign-group-label" data-sub="${sub}">
          <span class="assign-chevron">▾</span>${list[0].asset.group} <span class="muted">›</span> ${sub} <span class="muted">${list.length}</span>
        </button>
        <div class="assign-group-body">${list.map(rowHtml).join("")}</div>
      </div>`).join("");

    const back = modal(`
      <div class="modal help-modal">
        <div class="help-modal-head">
          <h3>배정된 자산</h3>
          <button type="button" class="btn icon-only sm" data-close aria-label="닫기">${CLOSE_ICON}</button>
        </div>
        <div class="body">
          <div class="modal-info-box">${headerHtml}</div>
          <div>${groupsHtml}</div>
        </div>
      </div>`);
    back.querySelectorAll(".assign-group-label").forEach(btn => btn.onclick = () => {
      const body = btn.nextElementSibling;
      const chevron = btn.querySelector(".assign-chevron");
      if (body.hasAttribute("hidden")) { body.removeAttribute("hidden"); chevron.textContent = "▾"; }
      else { body.setAttribute("hidden", ""); chevron.textContent = "▸"; }
    });
  }

  function view_employee(list) {
    const map = new Map();
    list.forEach(a => {
      if (a.type === "individual") {
        (a.assignments || []).forEach(x => {
          if (!x.employee) return;
          if (!map.has(x.employee)) map.set(x.employee, { name: x.employee, empNo: (MEMBER_INFO[x.employee] || {}).empNo || "", items: [] });
          map.get(x.employee).items.push({ sub: a.sub, qty: 1, asset: a });
        });
      } else {
        (a.stocks || []).forEach(x => {
          if (!x.employee) return;
          if (!map.has(x.employee)) map.set(x.employee, { name: x.employee, empNo: (MEMBER_INFO[x.employee] || {}).empNo || "", items: [] });
          map.get(x.employee).items.push({ sub: a.sub, qty: x.qty, asset: a });
        });
      }
    });
    const head = `<tr><th>이름</th><th>사번</th><th>휴대폰번호</th><th>배정된 자산</th></tr>`;
    const q = state.search.trim().toLowerCase();
    const rowsArr = [...map.values()].filter(r => {
      if (!q) return true;
      const info = MEMBER_INFO[r.name] || {};
      return r.name.toLowerCase().includes(q) || (info.empNo || "").toLowerCase().includes(q) || (info.phone || "").includes(q);
    });
    const sorted = sortList(rowsArr);
    const paged = pageSlice(sorted);
    memberRowsByName = new Map(paged.map(r => [r.name, r]));
    const rows = paged.map(r => {
      const info = MEMBER_INFO[r.name] || {};
      return `<tr class="clickable" data-mkey="${r.name}">
        <td><div class="acard-id">${memberIdentity(r.name)}</div></td>
        <td>${info.empNo || '<span class="muted">—</span>'}</td>
        <td>${info.phone || '<span class="muted">—</span>'}</td>
        <td>${assetsSummaryCell(r.items)}</td>
      </tr>`;
    }).join("");
    return { head, rows, count: rowsArr.length };
  }

  // 근무지별 — 구성원별과 동일한 구조(정체성 컬럼들 + "배정된 자산" 요약 컬럼)로 통일
  function view_worksite(list) {
    const map = new Map();
    list.forEach(a => {
      if (a.type === "individual") {
        (a.assignments || []).forEach(x => {
          if (!x.worksite) return;
          if (!map.has(x.worksite)) map.set(x.worksite, { name: x.worksite, code: WS_CODE[x.worksite] || "", items: [] });
          map.get(x.worksite).items.push({ sub: a.sub, qty: 1, asset: a });
        });
      } else {
        (a.stocks || []).forEach(x => {
          if (!x.worksite) return;
          if (!map.has(x.worksite)) map.set(x.worksite, { name: x.worksite, code: WS_CODE[x.worksite] || "", items: [] });
          map.get(x.worksite).items.push({ sub: a.sub, qty: x.qty, asset: a });
        });
      }
    });
    const head = `<tr><th>근무지명</th><th>근무지 코드</th><th>배정된 자산</th></tr>`;
    const q = state.search.trim().toLowerCase();
    const rowsArr = [...map.values()].filter(r => {
      if (!q) return true;
      return r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q);
    });
    const sorted = sortList(rowsArr);
    const paged = pageSlice(sorted);
    worksiteRowsByName = new Map(paged.map(r => [r.name, r]));
    const rows = paged.map(r => `<tr class="clickable" data-wkey="${r.name}">
      <td>${r.name}</td>
      <td>${r.code || '<span class="muted">—</span>'}</td>
      <td>${assetsSummaryCell(r.items)}</td>
    </tr>`).join("");
    return { head, rows, count: rowsArr.length };
  }

  function currentView() {
    const list = getFiltered();
    if (state.view === "all") return view_all(list);
    if (state.view === "product") return view_product(list);
    if (state.view === "employee") return view_employee(list);
    if (state.view === "worksite") return view_worksite(list);
  }

  /* ---------- render ---------- */
  function sortHtml() {
    if (!["all", "product", "employee", "worksite"].includes(state.view)) return "";
    const cur = sortFieldsFor(state.view).find(f => f.k === state.sort.key);
    return `
      <div class="sortbar">
        <button class="sort-key-btn" id="sort-key-btn">${cur.label}${CARET}</button>
        <div class="sort-dir-group">
          <button class="sort-dir-btn ${state.sort.dir === "asc" ? "active" : ""}" data-dir="asc" aria-label="오름차순">${SORT_ASC_ICON}</button>
          <button class="sort-dir-btn ${state.sort.dir === "desc" ? "active" : ""}" data-dir="desc" aria-label="내림차순">${SORT_DESC_ICON}</button>
        </div>
      </div>`;
  }
  function openSortKeyMenu(anchor) {
    document.querySelectorAll(".dropdown-menu").forEach(m => m.remove());
    const menu = document.createElement("div");
    menu.className = "dropdown-menu";
    menu.innerHTML = sortFieldsFor(state.view).map(f => `<button data-k="${f.k}" class="${state.sort.key === f.k ? "active" : ""}">${f.label}</button>`).join("");
    const r = anchor.getBoundingClientRect();
    menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${r.left}px;min-width:${Math.max(r.width, 120)}px`;
    document.body.appendChild(menu);
    menu.querySelectorAll("button").forEach(b => b.onclick = () => {
      menu.remove();
      state.sort.key = b.dataset.k;
      state.sort.dir = sortFieldsFor(state.view).find(f => f.k === b.dataset.k).defDir;
      state.page = 1;
      render();
    });
    setTimeout(() => {
      const close = e => { if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener("click", close); } };
      document.addEventListener("click", close);
    });
  }
  function pagerHtml(total) {
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    const p = state.page;
    const winStart = Math.max(1, Math.min(p - 2, totalPages - 4));
    const winEnd = Math.min(totalPages, Math.max(p + 2, winStart + 4));
    const pages = [];
    for (let i = Math.max(1, winStart); i <= winEnd; i++) pages.push(i);
    const btn = (label, target, disabled, cls = "") =>
      `<button data-page="${target}" ${disabled ? "disabled" : ""} class="${cls}">${label}</button>`;
    return `
      <div class="pager">
        ${btn("«", 1, p === 1)}
        ${btn("‹", p - 1, p === 1)}
        ${pages.map(n => btn(n, n, false, n === p ? "active" : "")).join("")}
        ${btn("›", p + 1, p === totalPages)}
        ${btn("»", totalPages, p === totalPages)}
        <span class="pagesize"><select id="page-size">
          ${[20, 50, 100].map(n => `<option value="${n}" ${state.pageSize === n ? "selected" : ""}>${n}</option>`).join("")}
        </select></span>
      </div>`;
  }
  // 칩은 "라벨: 값" 접두어 없이 값만 표시, 한 차원에서 여러 개 선택돼도 하나로 뭉치지 않고 값마다 별도 칩(각각 개별 해제)
  function filterChips() {
    const f = state.filters;
    const chips = [];
    const push = (k, label, v) => chips.push(
      `<span class="fchip">${label}<button data-clear='${JSON.stringify({ k, v })}'>✕</button></span>`);
    f.category.forEach(c => { const [g, s] = c.split("/"); push("category", s || g, c); });
    f.type.forEach(t => push("type", TYPE_LABEL[t], t));
    f.status.forEach(s => push("status", STATUS_LABEL[s][0], s));
    f.expiry.forEach(e => push("expiry", EXP_LABEL[e], e));
    f.depleted.forEach(() => push("depleted", "소진", "yes"));
    f.unheld.forEach(() => push("unheld", "미보유대상", "yes"));
    f.note.forEach(n => push("note", n === "has" ? "있음" : "없음", n));
    f.labels.forEach(l => push("labels", l, l));
    if (!chips.length) return "";
    return `<div class="filterbar"><button class="filter-reset" id="filter-reset" aria-label="필터 전체 해제">${RESET_ICON}</button>${chips.join("")}</div>`;
  }

  function tableInner(v) {
    // 필터·검색 조건 때문에 0건인 것과 애초에 등록된 자산 자체가 없는 것을 구분
    const filtering = activeFilterCount() > 0 || !!state.search.trim();
    const emptyMsg = filtering ? "결과가 없습니다." : "등록된 자산이 없습니다.";
    const colspan = state.view === "product" ? (state.productType === "quantity" ? 7 : 8)
      : state.view === "employee" ? 4 : state.view === "worksite" ? 3 : 10;
    const empty = `<tr><td colspan="${colspan}" style="text-align:center;color:var(--text-mut);padding:32px">${emptyMsg}</td></tr>`;
    const cls = state.view === "product" ? `tbl-product tbl-product-${state.productType}` : `tbl-${state.view}`;
    return `<table class="${cls}"><thead>${v.head}</thead><tbody>${v.rows || empty}</tbody></table>`;
  }
  function typeToggleHtml() {
    return `<div class="type-toggle">
      <button data-ptype="individual" class="${state.productType === "individual" ? "active" : ""}">개별 자산</button>
      <button data-ptype="quantity" class="${state.productType === "quantity" ? "active" : ""}">수량 자산</button>
    </div>`;
  }
  function bindRows(scope) {
    scope.querySelectorAll("tbody tr[data-id]").forEach(tr =>
      tr.onclick = () => location.href = `asset-detail.html?id=${tr.dataset.id}`);
  }

  function render() {
    // 다른 화면(자산 삭제 등)에서 이동해온 직후 띄울 토스트 — sessionStorage에 있으면 최초 1회만 소비
    const pendingToast = sessionStorage.getItem("pendingToast");
    if (pendingToast) { sessionStorage.removeItem("pendingToast"); toast(pendingToast); }
    const c = document.getElementById("content");
    const v = currentView();
    // 품목별은 필터 범위가 분류 하나뿐(자산 유형은 헤더 필터로 별도 제공)이라 뱃지 카운트도 그 하나만 봄
    const nAct = state.view === "product" ? state.filters.category.length : activeFilterCount();
    c.innerHTML = `
      <div class="tabs">
        <a class="active">현황</a>
        <a href="category.html">분류</a>
        <a href="settings.html">설정</a>
      </div>

      <div class="subtabs">
        ${[["all","전체"],["product","품목별"],["employee","구성원별"],["worksite","근무지별"]]
          .map(([k,t]) => `<button data-view="${k}" class="${state.view===k?'active':''}">${t}</button>`).join("")}
        ${state.view === "all" ? `
        <div class="sub-actions">
          <button class="btn primary sm" id="btn-add">＋ 자산 추가 <span class="chev">▾</span></button>
          <button class="btn sm" id="btn-bulk">일괄 작업 <span class="chev">▾</span></button>
        </div>` : ""}
      </div>

      ${state.view === "all" ? statsHtml() : ""}
      ${state.view === "product" ? typeToggleHtml() : ""}

      <div class="countrow">
        <span class="total">전체 <b>${v.count}</b></span>
        ${sortHtml()}
        <button class="filter-btn ${nAct ? 'set' : ''}" id="btn-filter">▤ ${state.view === "product" ? "분류" : state.view === "employee" ? "구성원" : state.view === "worksite" ? "근무지" : "필터"}${nAct ? ` <b>${nAct}</b>` : ""}</button>
        <div class="right">
          <div class="searchbox${state.search ? ' has-term' : ''}">
            <input class="search${state.search ? ' expanded' : ''}" id="search-input"
              placeholder="${state.search ? SEARCH_PLACEHOLDER[state.view] : '검색'}" value="${state.search.replace(/"/g, '&quot;')}">
            <button class="search-clear" id="search-clear" type="button" aria-label="검색어 지우기">✕</button>
          </div>
          ${state.view === "all" ? '<button class="btn sm" id="btn-qr-dl">▦ QR 다운로드</button>' : ""}
          <button class="btn sm" id="btn-list-dl">⬇ 다운로드</button>
        </div>
      </div>

      ${filterChips()}

      <div class="table-wrap">${tableInner(v)}</div>

      ${pagerHtml(v.count)}
    `;

    c.querySelectorAll(".subtabs button").forEach(b =>
      b.onclick = () => {
        state.view = b.dataset.view;
        state.page = 1;
        state.filters = emptyFilters();
        state.search = "";
        state.productType = "individual";
        // 이 뷰에서 안 쓰는 정렬 기준으로 넘어가는 경우(예: 전체>유효기한 정렬 중 품목별로 이동)를 대비해
        // 현재 정렬 기준이 새 뷰에 없으면 그 뷰의 기본 기준으로 리셋
        const fields = sortFieldsFor(state.view);
        if (!fields.some(f => f.k === state.sort.key)) state.sort = { key: fields[0].k, dir: fields[0].defDir };
        render();
      });
    bindRows(c);
    c.querySelectorAll("[data-ptype]").forEach(b => b.onclick = () => {
      state.productType = b.dataset.ptype;
      state.page = 1;
      render();
    });
    // 품목별 행 클릭 — 개별형은 분류 화면과 동일한 공용 자산 목록 모달, 수량형은 품목=자산이 1:1이라 중간 목록 없이 바로 상세로
    c.querySelectorAll("tbody tr[data-pkey]").forEach(tr => tr.onclick = () => {
      const g = productGroupsByKey.get(tr.dataset.pkey);
      if (!g) return;
      if (g.type === "individual") window.openProductUnitsModal(g.product, g.list);
      else location.href = `asset-detail.html?id=${g.list[0].id}`;
    });
    // 구성원별·근무지별 행 클릭 — 배정된 자산 전체 목록 모달. 헤더는 테이블의 정체성 컬럼과 동일한 정보를 보여줌
    // (구성원=프로필+이름+그룹, memberIdentity() 재사용 / 근무지=근무지명+코드)
    c.querySelectorAll("tbody tr[data-mkey]").forEach(tr => tr.onclick = () => {
      const r = memberRowsByName.get(tr.dataset.mkey);
      if (r) openAssignedAssetsModal(`<div class="acard-id">${memberIdentity(r.name)}</div>`, r.items);
    });
    c.querySelectorAll("tbody tr[data-wkey]").forEach(tr => tr.onclick = () => {
      const r = worksiteRowsByName.get(tr.dataset.wkey);
      const codeHtml = r.code || '<span class="muted">—</span>';
      if (r) openAssignedAssetsModal(`<div><div class="cat-unit-product">${r.name}</div><div class="acard-sub">${codeHtml}</div></div>`, r.items);
    });
    c.querySelectorAll("[data-stub]").forEach(el =>
      el.onclick = () => toast(`"${el.dataset.stub}" — 이후 단계에서 정의`));

    const si = document.getElementById("search-input");
    const sbox = si.closest(".searchbox");
    const commit = () => { state.search = si.value.trim(); state.page = 1; render(); };
    si.onfocus = () => { si.classList.add("expanded"); si.placeholder = SEARCH_PLACEHOLDER[state.view]; };
    si.onblur = () => { if (!si.value && !state.search) { si.classList.remove("expanded"); si.placeholder = "검색"; } };
    si.oninput = () => sbox.classList.toggle("has-term", !!si.value);   // ✕ 노출만, 검색 실행 X
    si.onkeydown = e => { if (e.key === "Enter") commit(); };
    document.getElementById("search-clear").onclick = () => { si.value = ""; state.search = ""; state.page = 1; render(); };
    c.querySelectorAll("[data-clear]").forEach(b =>
      b.onclick = () => {
        const { k, v } = JSON.parse(b.dataset.clear);
        state.filters[k] = state.filters[k].filter(x => x !== v);
        state.page = 1;
        render();
      });

    c.querySelectorAll(".statcol.click").forEach(el => el.onclick = () => {
      const p = JSON.parse(el.dataset.filter);   // {필드명: 값배열, ...} — 필드 여러 개 동시 지정 가능
      const keys = Object.keys(p);
      const isOn = keys.every(k => arrEq(state.filters[k], p[k]));
      const base = { ...emptyFilters(), category: state.filters.category };
      state.filters = isOn ? base : { ...base, ...p };
      state.page = 1;
      render();
    });

    const resetBtn = document.getElementById("filter-reset");
    if (resetBtn) resetBtn.onclick = () => {
      state.filters = emptyFilters();
      state.page = 1;
      render();
    };

    c.querySelectorAll(".th-filter").forEach(th =>
      th.onclick = () => openHeaderFilter(th, th.dataset.hf));

    c.querySelectorAll(".pager button[data-page]").forEach(b =>
      b.onclick = () => { state.page = +b.dataset.page; render(); });
    const pageSizeSel = document.getElementById("page-size");
    if (pageSizeSel) pageSizeSel.onchange = () => {
      state.pageSize = +pageSizeSel.value;
      state.page = 1;
      render();
    };

    const sortKeyBtn = document.getElementById("sort-key-btn");
    if (sortKeyBtn) sortKeyBtn.onclick = () => openSortKeyMenu(sortKeyBtn);
    c.querySelectorAll(".sort-dir-btn").forEach(b => b.onclick = () => {
      state.sort.dir = b.dataset.dir;
      state.page = 1;
      render();
    });

    document.getElementById("btn-filter").onclick =
      state.view === "product" ? openCategoryFilterModal :
      state.view === "employee" ? openMemberFilterModal :
      state.view === "worksite" ? openWorksiteFilterModal :
      openFilterModal;
    // QR 다운로드도 개별 유닛(고유관리번호) 단위 액션이라 전체 탭에서만 제공 — 자산 추가/일괄 작업과 동일한 이유
    if (state.view === "all") {
      document.getElementById("btn-qr-dl").onclick = openQrDownloadModal;
      document.getElementById("btn-add").onclick = () => window.openAssetAddModal();
      document.getElementById("btn-bulk").onclick = e => dropdown(e.currentTarget, [
        { label: "일괄 자산 추가", fn: () => location.href = "batch-register.html" },
        { label: "일괄 배정·보유 변경", fn: () => location.href = "batch-assign.html" },
      ]);
    }
    // 엑셀 다운로드 — 4개 뷰 전부 실제 동작(Asset_List_All/By_Item/By_Member/By_Location)
    document.getElementById("btn-list-dl").onclick = {
      all: downloadListAll, product: downloadListByItem, employee: downloadListByMember, worksite: downloadListByLocation,
    }[state.view];
  }

  // 배정·보유 현황을 엑셀용 순수 텍스트로 — holderText()와 동일한 정렬 기준(개별=배정일 최신순, 수량=이름 가나다순)
  function holderPlainText(a) {
    if (a.type === "individual") {
      const as = a.assignments || [];
      if (!as.length) return "";
      const sorted = [...as].sort((p, q) => p.since === q.since ? 0 : (p.since < q.since ? 1 : -1));
      return sorted.map(x => x.employee || x.worksite).join(", ");
    }
    const stocks = a.stocks || [];
    if (!stocks.length) return "";
    const sorted = [...stocks].sort((p, q) => (p.employee || p.worksite).localeCompare(q.employee || q.worksite, "ko"));
    return sorted.map(x => `${x.employee || x.worksite}(${x.qty}개)`).join(", ");
  }
  /* ---------- 엑셀 다운로드 공용 ---------- */
  function xlsxTs() {
    const d = new Date(), p2 = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`;
  }
  function xlsxNowLabel() {
    const d = new Date(), p2 = n => String(n).padStart(2, "0");
    const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
    return `${d.getFullYear()}.${p2(d.getMonth() + 1)}.${p2(d.getDate())}(${DAYS[d.getDay()]}) ${p2(d.getHours())}:${p2(d.getMinutes())}`;
  }
  // 상단 타이틀 영역(각 줄 A~C 병합) + 빈 줄 + 헤더 + 데이터로 구성된 시트.
  // 셀 배경색·굵기 등 서식은 지금 쓰는 SheetJS Community 빌드(xlsx.full.min.js)가 못 씀(Pro 전용 기능) — 구조·값만 반영
  function titledSheet(titleLines, headerRow, dataRows) {
    const aoa = [...titleLines.map(t => [t]), [], headerRow, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!merges"] = titleLines.map((_, i) => ({ s: { r: i, c: 0 }, e: { r: i, c: 2 } }));
    return ws;
  }

  // "전체" 다운로드 — 지금 적용된 필터·검색 전체 범위(페이지네이션 무관). 컬럼은 화면 순서 그대로 +
  // 상세 전용 필드(S/N·IMEI·제조연월일·구매일·구매가격)까지 포함 — 소분류 필드 노출 설정으로 꺼져 있어도
  // 엑셀엔 전부 넣고 값만 빈칸 처리(한 시트에 여러 소분류가 섞여서 컬럼 자체를 없앨 수 없음)
  function downloadListAll() {
    const list = getFiltered();
    const header = ["No.", "자산 유형", "분류", "품목명", "고유관리번호", "상태", "배정·보유 현황", "유효기한", "태그", "S/N", "IMEI", "제조연월일", "구매일", "구매가격", "메모", "자산 등록일", "최근변경일시"];
    const rows = list.map((a, i) => [
      i + 1,
      TYPE_LABEL[a.type],
      `${a.group} › ${a.sub}`,
      a.product,
      a.assetNo || "",
      STATUS_LABEL[a.status][0],
      holderPlainText(a),
      a.expiry ? `${window.fmtDate(a.expiry)} (${EXP_LABEL[expiryKey(a.expiry)]})` : "",
      (a.labels || []).join(", "),
      a.type === "individual" ? (a.serial || "") : "",
      a.type === "individual" ? (a.imei || "") : "",
      a.manufactured ? window.fmtDate(a.manufactured) : "",
      a.purchaseDate ? window.fmtDate(a.purchaseDate) : "",
      a.price != null ? `${a.price.toLocaleString()}원` : "",
      a.note || "",
      window.fmtDate(a.createdAt),
      a.updatedAt ? window.fmtDate(a.updatedAt) : "",
    ]);
    const ws = titledSheet(["자산 목록", `추출 시점 / ${xlsxNowLabel()}`], header, rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "자산 목록");
    XLSX.writeFile(wb, `Asset_List_All_${xlsxTs()}.xlsx`);
  }

  // "품목별" 다운로드 — 현재 토글된 자산 유형(개별/수량)만 대상. 1번 시트는 화면과 동일한 품목 요약,
  // 2번 시트는 그 품목들의 유닛/보유 대상 단위 상세(품목 모달에서 보던 정보를 엑셀에서도 확인 가능하게)
  function downloadListByItem() {
    const isIndiv = state.productType !== "quantity";
    const list = getFiltered().filter(a => a.type === (isIndiv ? "individual" : "quantity"));
    const groups = groupByProduct(list);

    let summaryHeader, summaryRows, detailHeader, detailRows = [];
    if (isIndiv) {
      summaryHeader = ["No.", "품목명", "분류", "자산 수", "배정 중", "재고", "수리 중", "분실", "폐기"];
      summaryRows = groups.map((g, i) => {
        const counts = { assigned: 0, stock: 0, repair: 0, lost: 0, disposed: 0 };
        g.list.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });
        return [i + 1, g.product, `${g.group} › ${g.sub}`, g.list.length, counts.assigned, counts.stock, counts.repair, counts.lost, counts.disposed];
      });
      detailHeader = ["No.", "품목명", "분류", "고유관리번호", "상태", "배정 대상", "유효기한"];
      groups.forEach(g => g.list.forEach(a => {
        detailRows.push([detailRows.length + 1, a.product, `${a.group} › ${a.sub}`, a.assetNo || "", STATUS_LABEL[a.status][0], holderPlainText(a), a.expiry ? window.fmtDate(a.expiry) : ""]);
      }));
    } else {
      summaryHeader = ["No.", "품목명", "분류", "전체 수량", "보유 수량", "잔여 수량", "보유 대상", "유효기한"];
      summaryRows = groups.map((g, i) => {
        const a = g.list[0];
        const qty = (a.stocks || []).reduce((s, x) => s + x.qty, 0);
        const targets = (a.stocks || []).length;
        return [i + 1, g.product, `${g.group} › ${g.sub}`, a.totalQty, qty, a.totalQty - qty, targets, a.expiry ? window.fmtDate(a.expiry) : ""];
      });
      detailHeader = ["No.", "품목명", "분류", "보유 대상", "보유 수량"];
      groups.forEach(g => {
        const a = g.list[0];
        (a.stocks || []).forEach(x => {
          detailRows.push([detailRows.length + 1, a.product, `${a.group} › ${a.sub}`, x.employee || x.worksite, `${x.qty}개`]);
        });
      });
    }

    const titleLines = ["품목별 자산 목록", `자산 유형 / ${isIndiv ? "개별 자산" : "수량 자산"}`, `추출 시점 / ${xlsxNowLabel()}`];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, titledSheet(titleLines, summaryHeader, summaryRows), "품목 목록");
    XLSX.utils.book_append_sheet(wb, titledSheet(titleLines, detailHeader, detailRows), "품목별 상세");
    XLSX.writeFile(wb, `Asset_List_By_Item_${xlsxTs()}.xlsx`);
  }

  // "구성원별" 다운로드 — 화면과 동일한 집계(이름·사번·휴대폰번호·그룹·직무직급·등급·배정된 자산), 검색어까지 반영.
  // 배정된 자산은 개수 상한이 없어(개별형 배정 인원수 제한 없음, 보유 대상도 무제한) 컬럼을 나누는 대신
  // 한 셀에 쉼표로 나열 + "배정 자산 수" 카운트 컬럼을 별도로 둠
  function downloadListByMember() {
    const list = getFiltered();
    const map = new Map();
    list.forEach(a => {
      if (a.type === "individual") {
        (a.assignments || []).forEach(x => {
          if (!x.employee) return;
          if (!map.has(x.employee)) map.set(x.employee, { name: x.employee, items: [] });
          map.get(x.employee).items.push({ qty: 1, asset: a });
        });
      } else {
        (a.stocks || []).forEach(x => {
          if (!x.employee) return;
          if (!map.has(x.employee)) map.set(x.employee, { name: x.employee, items: [] });
          map.get(x.employee).items.push({ qty: x.qty, asset: a });
        });
      }
    });
    const q = state.search.trim().toLowerCase();
    const rowsArr = [...map.values()].filter(r => {
      if (!q) return true;
      const info = MEMBER_INFO[r.name] || {};
      return r.name.toLowerCase().includes(q) || (info.empNo || "").toLowerCase().includes(q) || (info.phone || "").includes(q);
    });
    const header = ["No.", "이름", "사번", "휴대폰번호", "그룹", "직무·직급", "등급", "배정 자산 수", "배정된 자산"];
    const rows = rowsArr.map((r, i) => {
      const info = MEMBER_INFO[r.name] || {};
      const assetList = r.items.map(x => x.asset.type === "individual" ? `${x.asset.product}(${x.asset.assetNo || "—"})` : `${x.asset.product}(${x.qty}개)`).join(", ");
      return [i + 1, r.name, info.empNo || "", info.phone || "", info.team || "", info.jobTitle || "", info.grade || "", r.items.length, assetList];
    });
    const ws = titledSheet(["구성원별 자산 목록", `추출 시점 / ${xlsxNowLabel()}`], header, rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "구성원별 자산 목록");
    XLSX.writeFile(wb, `Asset_List_By_Member_${xlsxTs()}.xlsx`);
  }

  // "근무지별" 다운로드 — 화면과 동일한 집계(근무지명·코드·주소·배정된 자산), 검색어까지 반영. 배정된 자산
  // 나열 방식은 구성원별과 동일한 이유(상한 없음)로 한 셀 쉼표 나열 + 카운트 컬럼
  function downloadListByLocation() {
    const list = getFiltered();
    const map = new Map();
    list.forEach(a => {
      if (a.type === "individual") {
        (a.assignments || []).forEach(x => {
          if (!x.worksite) return;
          if (!map.has(x.worksite)) map.set(x.worksite, { name: x.worksite, items: [] });
          map.get(x.worksite).items.push({ qty: 1, asset: a });
        });
      } else {
        (a.stocks || []).forEach(x => {
          if (!x.worksite) return;
          if (!map.has(x.worksite)) map.set(x.worksite, { name: x.worksite, items: [] });
          map.get(x.worksite).items.push({ qty: x.qty, asset: a });
        });
      }
    });
    const q = state.search.trim().toLowerCase();
    const rowsArr = [...map.values()].filter(r => {
      if (!q) return true;
      return r.name.toLowerCase().includes(q) || (WS_CODE[r.name] || "").toLowerCase().includes(q);
    });
    const header = ["No.", "근무지명", "근무지 코드", "주소", "배정 자산 수", "배정된 자산"];
    const rows = rowsArr.map((r, i) => {
      const assetList = r.items.map(x => x.asset.type === "individual" ? `${x.asset.product}(${x.asset.assetNo || "—"})` : `${x.asset.product}(${x.qty}개)`).join(", ");
      return [i + 1, r.name, WS_CODE[r.name] || "", WS_ADDRESS[r.name] || "", r.items.length, assetList];
    });
    const ws = titledSheet(["근무지별 자산 목록", `추출 시점 / ${xlsxNowLabel()}`], header, rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "근무지별 자산 목록");
    XLSX.writeFile(wb, `Asset_List_By_Location_${xlsxTs()}.xlsx`);
  }

  /* ---------- stats (분류 필터까지만 반영) ---------- */
  function catScoped() {
    const cat = state.filters.category;
    return cat.length ? assets.filter(a => cat.some(c => c === a.group || c === `${a.group}/${a.sub}`)) : assets;
  }
  function computeStats() {
    const list = catScoped();
    const indiv = list.filter(a => a.type === "individual");
    const qty = list.filter(a => a.type === "quantity");
    const cnt = k => indiv.filter(a => a.status === k).length;
    const qtyCnt = k => qty.filter(a => a.status === k).length;
    const expOver = list.filter(a => a.expiry && expiryKey(a.expiry) === "over").length;
    const expSoon = list.filter(a => a.expiry && expiryKey(a.expiry) === "soon").length;
    const assignable = indiv.length - cnt("disposed");
    return {
      indivN: indiv.length, qtyN: qty.length,
      stock: cnt("stock"), assigned: cnt("assigned"), repair: cnt("repair"),
      lost: cnt("lost"), disposed: cnt("disposed"), assignable,
      expOver, expSoon,
      rate: assignable ? Math.round(cnt("assigned") / assignable * 100) : 0,
      // 수량형은 폐기 개념이 없어 제외 없이 전체 대비 비율(개별형 배정률과 동일 원리, 4.3 "보유 대상 없음" 참조)
      qtyHeld: qtyCnt("held"), qtyStock: qtyCnt("stock"),
      qtyRate: qty.length ? Math.round(qtyCnt("held") / qty.length * 100) : 0,
      qtyDepleted: qty.filter(isDepleted).length,
      // 미보유대상은 품목이 아니라 보유 대상(레코드) 단위 카운트 — 한 품목에 0개짜리 보유 대상이 여러 명이면
      // 그만큼 더해짐. 소진인 품목의 0개짜리 레코드도 그대로 포함(소진과 별개 집계)
      qtyUnheld: qty.reduce((s, a) => s + unheldHolders(a).length, 0),
    };
  }
  function arrEq(a, b) { a = a || []; b = b || []; return a.length === b.length && a.every(x => b.includes(x)); }
  // filter는 {필드명: 값배열, ...} 형태 — 여러 필드를 동시에 지정 가능(예: 재고처럼 개별·수량형이 값을
  // 공유하는 상태는 type도 같이 지정해야 그 카드가 대표하는 자산 유형으로만 정확히 필터링됨)
  // 라벨만으론 뜻이 안 잡히는 파생 지표(소진·미보유대상)에 붙이는 작은 도움말 아이콘 — 기존 "?" 도움말
  // 아이콘(help-icon)을 재사용하되, 전체 화면 모달 대신 짧은 호버 툴팁(data-tip)으로 가볍게 처리
  function statHelp(text) {
    return `<span class="help-icon stat-help" data-tip="${text}">?</span>`;
  }
  function statCol({ k, v, sub, cls = "", filter, extra = "" }) {
    const attr = filter ? ` class="statcol click ${cls}" data-filter='${JSON.stringify(filter)}'` : ` class="statcol ${cls}"`;
    return `<div${attr}>${extra}<div><div class="statcol-k">${k}</div><div class="statcol-v">${v}${sub ? ` <small>${sub}</small>` : ""}</div></div></div>`;
  }
  function statCard(title, cols) {
    return `<div class="statcard"><div class="statcard-title">${title}</div><div class="statcard-body">${cols.join("")}</div></div>`;
  }
  function statsHtml() {
    const s = computeStats();
    const row1 = `<div class="statrow2">
      ${statCard("자산 유형", [
        statCol({ k: "개별 자산", v: s.indivN, sub: "개", filter: { type: ["individual"] } }),
        statCol({ k: "수량 자산", v: s.qtyN, sub: "품목", filter: { type: ["quantity"] } }),
      ])}
      ${statCard("유효기간", [
        statCol({ k: "만료 예정", v: s.expSoon, cls: "warn", filter: { expiry: ["soon"] } }),
        statCol({ k: "만료", v: s.expOver, cls: "alert", filter: { expiry: ["over"] } }),
      ])}
    </div>`;
    const row2 = `<div class="statrow2">
      ${statCard("개별 자산 요약", [
        statCol({
          k: "배정 중", v: `${s.rate}%`, sub: `${s.assigned}/${s.assignable}`, filter: { status: ["assigned"] },
          extra: `<div class="donut" style="--pct:${s.rate}"><div class="donut-hole"></div></div>`,
        }),
        statCol({ k: "재고", v: s.stock, filter: { type: ["individual"], status: ["stock"] } }),
        statCol({ k: "분실", v: s.lost, cls: "alert", filter: { status: ["lost"] } }),
        statCol({ k: "수리 중", v: s.repair, cls: "warn", filter: { status: ["repair"] } }),
      ])}
      ${statCard("수량 자산 요약", [
        statCol({
          k: "보유 중", v: `${s.qtyRate}%`, sub: `${s.qtyHeld}/${s.qtyN}`, filter: { status: ["held"] },
          extra: `<div class="donut" style="--pct:${s.qtyRate}"><div class="donut-hole"></div></div>`,
        }),
        statCol({ k: "재고", v: s.qtyStock, filter: { type: ["quantity"], status: ["stock"] } }),
        statCol({
          k: `소진 ${statHelp("전체 수량을 모두 배분해 남은 잔여 수량이 없는 품목의 수입니다.")}`,
          v: s.qtyDepleted, cls: "warn", filter: { depleted: ["yes"] },
        }),
        statCol({
          k: `미보유대상 ${statHelp("보유 수량이 0개인 보유 대상의 수입니다.")}`,
          v: s.qtyUnheld, cls: "warn", filter: { unheld: ["yes"] },
        }),
      ])}
    </div>`;
    return `<div class="statwrap">${row1}${row2}</div>`;
  }

  function dropdown(anchor, items) {
    document.querySelectorAll(".dropdown-menu").forEach(m => m.remove());
    const menu = document.createElement("div");
    menu.className = "dropdown-menu";
    menu.innerHTML = items.map((it, i) => `<button data-i="${i}">${it.label}</button>`).join("");
    const r = anchor.getBoundingClientRect();
    menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${r.left}px;min-width:${Math.max(r.width, 160)}px`;
    document.body.appendChild(menu);
    menu.querySelectorAll("button").forEach(b => b.onclick = () => { menu.remove(); items[+b.dataset.i].fn(); });
    setTimeout(() => {
      const close = e => { if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener("click", close); } };
      document.addEventListener("click", close);
    });
  }

  /* ---------- filter modal ---------- */
  function openFilterModal() {
    const draft = JSON.parse(JSON.stringify(state.filters));
    let group = "category";
    let query = "";

    const GROUPS = [
      { k: "type", name: "자산 유형" },
      { k: "category", name: "분류" },
      { k: "status", name: "상태" },
      { k: "expiry", name: "유효기한" },
      { k: "labels", name: "태그" },
      { k: "note", name: "메모" },
    ];
    const SEARCHABLE = ["category", "labels"];
    // 첫번째로 선택된 옵션 라벨 + 나머지 개수(예: "노트북 +2") — 아무것도 선택 안 했으면 빈 문자열(전체라고 적지 않음)
    const summary = k => {
      let labels = [];
      // 소분류만 봐선 어느 대분류인지 알 수 없어서 "대분류 › 소분류"로 표시
      if (k === "category") labels = draft.category.map(c => { const [g, s] = c.split("/"); return s ? `${g} › ${s}` : g; });
      else if (k === "type") labels = draft.type.map(v => TYPE_LABEL[v]);
      else if (k === "status") labels = draft.status.map(v => STATUS_LABEL[v][0]);
      else if (k === "expiry") labels = draft.expiry.map(v => EXP_LABEL[v]);
      else if (k === "labels") labels = draft.labels;
      else if (k === "note") labels = draft.note.map(v => v === "has" ? "있음" : "없음");
      if (!labels.length) return "";
      const rest = labels.length > 1 ? ` +${labels.length - 1}` : "";
      return `${labels[0]}${rest}`;
    };
    // 그룹별 "전체 선택" 대상이 되는 leaf 값 목록(검색 중이면 검색에 걸리는 것만)
    function visibleValues() {
      const q = query.trim().toLowerCase();
      if (group === "category") {
        const out = [];
        CAT_GROUPS.forEach((subs, g) => {
          const groupMatches = !q || g.toLowerCase().includes(q);
          const filtered = subs.filter(s => groupMatches || s.toLowerCase().includes(q));
          if (!filtered.length) return;
          out.push(g);
          filtered.forEach(s => out.push(`${g}/${s}`));
        });
        return out;
      }
      if (group === "type") return Object.keys(TYPE_LABEL);
      if (group === "status") return STATUS_ORDER;
      if (group === "expiry") return Object.keys(EXP_LABEL);
      if (group === "note") return ["has", "none"];
      return ALL_LABELS.filter(l => !q || l.toLowerCase().includes(q));
    }

    const back = modal(`
      <div class="modal lg">
        <h3>필터</h3>
        <div class="fmodal">
          <div class="groups" id="f-groups"></div>
          <div class="opts" id="f-opts"></div>
        </div>
        <div class="foot">
          <span class="sum" id="f-sum"></span>
          <button class="btn" data-close>취소</button>
          <button class="btn primary" id="f-apply">적용</button>
        </div>
      </div>`);

    function drawGroups() {
      back.querySelector("#f-groups").innerHTML = GROUPS.map(g => {
        const active = draft[g.k] && draft[g.k].length;
        const s = summary(g.k);
        return `<button data-g="${g.k}" class="${g.k === group ? "active" : ""}">
          <span class="g-text">
            <span class="g-name">${g.name}</span>
            ${s ? `<span class="g-sum">${s}</span>` : ""}
          </span>
          ${active ? '<span class="dot"></span>' : ""}
        </button>`;
      }).join("");
      back.querySelectorAll("#f-groups button").forEach(b =>
        b.onclick = () => { group = b.dataset.g; query = ""; drawGroups(); drawOpts(); });
    }

    function optRow(checked, label, val, cls = "") {
      return `<label class="opt ${cls}"><input type="checkbox" data-v="${val}" ${checked ? "checked" : ""}>${label}</label>`;
    }

    // 검색 인풋은 그룹 전환시에만 새로 그리고, 타이핑 중엔 목록(#f-dynamic)만 갱신
    // — 매 키 입력마다 인풋 자체를 다시 그리면 한글 조합(자모 분리)이 깨짐
    function drawOpts() {
      const box = back.querySelector("#f-opts");
      const showSearch = SEARCHABLE.includes(group);
      box.innerHTML = `
        ${showSearch ? `<input type="text" class="picker-search" id="f-search" placeholder="검색" value="${query.replace(/"/g, "&quot;")}">` : ""}
        <div id="f-dynamic"></div>
      `;
      if (showSearch) {
        box.querySelector("#f-search").oninput = e => { query = e.target.value; renderDynamic(); };
      }
      renderDynamic();
    }

    function renderDynamic() {
      const dyn = back.querySelector("#f-dynamic");
      const q = query.trim().toLowerCase();
      let listHtml = "";
      if (group === "category") {
        listHtml = [...CAT_GROUPS.entries()].map(([g, subs]) => {
          // 검색어가 대분류명 자체에 걸리면 대분류 통째로, 소분류명에만 걸리면 대분류 헤더 없이 소분류만 나열
          const groupMatches = !q || g.toLowerCase().includes(q);
          const filtered = subs.filter(s => groupMatches || s.toLowerCase().includes(q));
          if (!filtered.length) return "";
          const keys = filtered.map(s => `${g}/${s}`);
          const all = keys.every(k => draft.category.includes(k));
          const parent = groupMatches ? optRow(all, `<b>${g}</b>`, `grp:${g}`) : "";
          const kids = filtered.map(s => optRow(draft.category.includes(`${g}/${s}`), s, `${g}/${s}`, groupMatches ? "child" : "")).join("");
          return parent + kids;
        }).join("");
        if (!listHtml) listHtml = `<p class="muted" style="padding:12px 2px">결과가 없습니다.</p>`;
      } else if (group === "type") {
        listHtml = Object.entries(TYPE_LABEL).map(([v, l]) => optRow(draft.type.includes(v), l, v)).join("");
      } else if (group === "status") {
        listHtml = STATUS_ORDER.map(v => optRow(draft.status.includes(v), STATUS_LABEL[v][0], v)).join("");
      } else if (group === "expiry") {
        listHtml = Object.entries(EXP_LABEL).map(([v, l]) => optRow(draft.expiry.includes(v), l, v)).join("");
      } else if (group === "labels") {
        const filtered = ALL_LABELS.filter(l => !q || l.toLowerCase().includes(q));
        listHtml = filtered.length ? filtered.map(l => optRow(draft.labels.includes(l), l, l)).join("")
          : `<p class="muted" style="padding:12px 2px">결과가 없습니다.</p>`;
      } else if (group === "note") {
        listHtml = [{ v: "has", l: "있음" }, { v: "none", l: "없음" }]
          .map(o => optRow(draft.note.includes(o.v), o.l, o.v)).join("");
      }

      const vis = visibleValues();
      const allChecked = vis.length > 0 && vis.every(v => (draft[group] || []).includes(v));
      dyn.innerHTML = `
        <div class="picker-toolbar">
          <label class="picker-check"><input type="checkbox" id="f-select-all" ${allChecked ? "checked" : ""}><span>전체</span></label>
          <span class="right"><button class="filter-reset" id="f-group-reset" aria-label="이 항목 초기화">${RESET_ICON}</button></span>
        </div>
        ${listHtml}
      `;

      dyn.querySelector("#f-select-all").onchange = e => {
        const vals = visibleValues();
        draft[group] = e.target.checked
          ? [...new Set([...draft[group], ...vals])]
          : draft[group].filter(v => !vals.includes(v));
        renderDynamic(); drawGroups(); drawSum();
      };
      dyn.querySelector("#f-group-reset").onclick = () => {
        draft[group] = [];
        renderDynamic(); drawGroups(); drawSum();
      };

      dyn.querySelectorAll('input[type=checkbox][data-v]').forEach(cb => cb.onchange = () => {
        const v = cb.dataset.v;
        if (group === "category") {
          if (v.startsWith("grp:")) {
            const g = v.slice(4);
            // 대분류를 체크하면 그 자체도 소분류들과 별개로 draft에 들어가서, 칩도 "대분류 + 소분류 N개"로 각각 따로 뜸(병합 안 함)
            const keys = [g, ...CAT_GROUPS.get(g).map(s => `${g}/${s}`)];
            draft.category = cb.checked
              ? [...new Set([...draft.category, ...keys])]
              : draft.category.filter(k => !keys.includes(k));
          } else {
            draft.category = cb.checked ? [...draft.category, v] : draft.category.filter(k => k !== v);
          }
        } else {
          const arr = draft[group];
          draft[group] = cb.checked ? [...arr, v] : arr.filter(x => x !== v);
        }
        renderDynamic(); drawGroups(); drawSum();
      });
      drawSum();
    }
    // 현재 그룹이 아니라 전체 그룹 누적 선택 개수(참고 이미지의 "선택됨 N"과 동일한 의미)
    function drawSum() {
      const n = GROUPS.reduce((sum, g) => sum + (draft[g.k] || []).length, 0);
      back.querySelector("#f-sum").textContent = `선택됨 ${n}`;
    }

    back.querySelector("#f-apply").onclick = () => {
      state.filters = draft;
      state.page = 1;
      back.remove();
      render();
    };

    drawGroups();
    drawOpts();
  }

  // 품목별 전용 필터 — 이 뷰는 분류 하나만 필터로 의미가 있어서(자산 유형은 헤더 필터로 커버),
  // 6개 그룹짜리 필터 모달 대신 분류 그룹 하나만 떼어낸 가벼운 팝업으로 제공
  function openCategoryFilterModal() {
    const draft = [...state.filters.category];
    let query = "";

    function optRow(checked, label, val, cls = "") {
      return `<label class="opt ${cls}"><input type="checkbox" data-v="${val}" ${checked ? "checked" : ""}>${label}</label>`;
    }
    function visibleValues() {
      const q = query.trim().toLowerCase();
      const out = [];
      CAT_GROUPS.forEach((subs, g) => {
        const groupMatches = !q || g.toLowerCase().includes(q);
        const filtered = subs.filter(s => groupMatches || s.toLowerCase().includes(q));
        if (!filtered.length) return;
        out.push(g);
        filtered.forEach(s => out.push(`${g}/${s}`));
      });
      return out;
    }

    const back = modal(`
      <div class="modal">
        <h3>분류</h3>
        <div class="body">
          <input type="text" class="picker-search" id="cf-search" placeholder="검색">
          <div id="cf-dynamic" style="margin-top:10px"></div>
        </div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" id="cf-apply">적용</button>
        </div>
      </div>`);

    function renderList() {
      let listHtml = [...CAT_GROUPS.entries()].map(([g, subs]) => {
        const q = query.trim().toLowerCase();
        const groupMatches = !q || g.toLowerCase().includes(q);
        const filtered = subs.filter(s => groupMatches || s.toLowerCase().includes(q));
        if (!filtered.length) return "";
        const keys = filtered.map(s => `${g}/${s}`);
        const all = keys.every(k => draft.includes(k));
        const parent = groupMatches ? optRow(all, `<b>${g}</b>`, `grp:${g}`) : "";
        const kids = filtered.map(s => optRow(draft.includes(`${g}/${s}`), s, `${g}/${s}`, groupMatches ? "child" : "")).join("");
        return parent + kids;
      }).join("");
      if (!listHtml) listHtml = `<p class="muted" style="padding:12px 2px">결과가 없습니다.</p>`;

      const vis = visibleValues();
      const allChecked = vis.length > 0 && vis.every(v => draft.includes(v));
      const dyn = back.querySelector("#cf-dynamic");
      dyn.innerHTML = `
        <div class="picker-toolbar">
          <label class="picker-check"><input type="checkbox" id="cf-select-all" ${allChecked ? "checked" : ""}><span>전체</span></label>
          <span class="right"><button class="filter-reset" id="cf-reset" aria-label="초기화">${RESET_ICON}</button></span>
        </div>
        ${listHtml}
      `;
      dyn.querySelector("#cf-select-all").onchange = e => {
        const vals = visibleValues();
        if (e.target.checked) vals.forEach(v => { if (!draft.includes(v)) draft.push(v); });
        else vals.forEach(v => { const i = draft.indexOf(v); if (i > -1) draft.splice(i, 1); });
        renderList();
      };
      dyn.querySelector("#cf-reset").onclick = () => { draft.length = 0; renderList(); };
      dyn.querySelectorAll("input[type=checkbox][data-v]").forEach(cb => cb.onchange = () => {
        const v = cb.dataset.v;
        if (v.startsWith("grp:")) {
          const g = v.slice(4);
          // 대분류를 체크하면 그 자체도 소분류들과 별개로 draft에 들어가서, 칩도 "대분류 + 소분류 N개"로 각각 따로 뜸(병합 안 함)
          const keys = [g, ...CAT_GROUPS.get(g).map(s => `${g}/${s}`)];
          if (cb.checked) keys.forEach(k => { if (!draft.includes(k)) draft.push(k); });
          else keys.forEach(k => { const i = draft.indexOf(k); if (i > -1) draft.splice(i, 1); });
        } else if (cb.checked) draft.push(v);
        else { const i = draft.indexOf(v); if (i > -1) draft.splice(i, 1); }
        renderList();
      });
    }
    renderList();

    back.querySelector("#cf-search").oninput = e => { query = e.target.value; renderList(); };
    back.querySelector("#cf-apply").onclick = () => {
      state.filters.category = draft;
      state.page = 1;
      back.remove();
      render();
    };
  }

  // 구성원별 전용 "직원 필터" — 대시보드 공용 컴포넌트 목업. 실제 조직도 연동·필터 반영 로직은 이 프로토타입 범위 밖이라
  // 버튼을 누르면 뜨는 모달의 형태(좌측 카테고리 + 우측 검색·트리)만 재현, 적용해도 실제 목록엔 반영되지 않음
  function openMemberFilterModal() {
    let cat = "그룹";

    function nodeRow(n, isChild) {
      const kids = n.children ? n.children.map(c => nodeRow(c, true)).join("") : "";
      return `<label class="opt ${isChild ? "child" : ""}"><input type="checkbox" checked>${n.name}</label>${kids}`;
    }
    function optsHtml() {
      if (cat === "그룹") return MEMBER_GROUP_TREE.map(n => nodeRow(n, false)).join("");
      return MEMBER_JOB_TITLES.map(j => `<label class="opt"><input type="checkbox" checked>${j}</label>`).join("");
    }

    const back = modal(`
      <div class="modal lg">
        <h3>직원 필터</h3>
        <div class="fmodal">
          <div class="groups" id="mf-groups">
            ${["그룹", "직무/직급"].map(g => `<button data-g="${g}" class="${g === cat ? "active" : ""}">
              <span class="g-text"><span class="g-name">${g}</span></span>
            </button>`).join("")}
          </div>
          <div class="opts">
            <input type="text" class="picker-search" placeholder="검색">
            <div class="picker-toolbar">
              <label class="picker-check"><input type="checkbox" checked><span>하위그룹도 한번에 체크</span></label>
              <span class="right"><button class="filter-reset" aria-label="초기화">${RESET_ICON}</button></span>
            </div>
            <div id="mf-opts-list">${optsHtml()}</div>
          </div>
        </div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" id="mf-apply">적용</button>
        </div>
      </div>`);

    back.querySelectorAll("#mf-groups button").forEach(b => b.onclick = () => {
      cat = b.dataset.g;
      back.querySelectorAll("#mf-groups button").forEach(x => x.classList.toggle("active", x === b));
      back.querySelector("#mf-opts-list").innerHTML = optsHtml();
    });
    back.querySelector("#mf-apply").onclick = () => {
      back.remove();
      toast(`"직원 필터" 적용 (프로토타입 — 실제 반영 없음)`);
    };
  }

  // 근무지별 전용 "근무지 필터" — 역시 공통 컴포넌트 목업(직원 필터와 동일 취급). 실제 화면엔 도/도시 외에도
  // 이 프로토타입과 무관한 필드가 많았지만, 우리 근무지 데이터로 실제 의미가 통하는 "도"(전국 17개 광역단위,
  // 실존하는 일반 행정구역명이라 특정 회사 데이터 아님)만 대표로 구현 — 적당한 수준의 목업, 실제 필터링 없음
  const WS_PROVINCES = [
    "도 미지정", "강원도", "경기도", "경상남도", "경상북도", "광주광역시", "대구광역시", "대전광역시",
    "부산광역시", "서울특별시", "세종특별자치시", "울산광역시", "인천광역시", "전라남도", "전라북도",
    "제주특별자치도", "충청남도", "충청북도",
  ];
  function openWorksiteFilterModal() {
    const back = modal(`
      <div class="modal lg">
        <h3>근무지 필터</h3>
        <div class="fmodal">
          <div class="groups" id="wf-groups">
            <button class="active"><span class="g-text"><span class="g-name">도</span></span></button>
          </div>
          <div class="opts">
            <input type="text" class="picker-search" placeholder="검색">
            <div class="picker-toolbar">
              <label class="picker-check"><input type="checkbox" checked><span>전체</span></label>
              <span class="right"><button class="filter-reset" aria-label="초기화">${RESET_ICON}</button></span>
            </div>
            <div>${WS_PROVINCES.map(p => `<label class="opt"><input type="checkbox" checked>${p}</label>`).join("")}</div>
          </div>
        </div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" id="wf-apply">적용</button>
        </div>
      </div>`);
    back.querySelector("#wf-apply").onclick = () => {
      back.remove();
      toast(`"근무지 필터" 적용 (프로토타입 — 실제 반영 없음)`);
    };
  }

  /* ---------- other modals ---------- */
  function modal(html) {
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = html;
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelectorAll("[data-close]").forEach(b => b.onclick = () => back.remove());
    document.body.appendChild(back);
    return back;
  }

  // 자산 추가 팝업은 js/asset-register.js의 window.openAssetAddModal()로 분류 화면과 공용

  function openQrDownloadModal() {
    // 별도 정렬 UI 없이 품목명 가나다순 고정 — 이름으로 훑어보기 가장 쉬운 기본 정렬
    const list = getFiltered().sort((a, b) => a.product.localeCompare(b.product, "ko"));
    const PAGE_SIZE = 20;
    let query = "";
    let page = 1;
    const sel = new Set();

    function filteredList() {
      const q = query.trim().toLowerCase();
      if (!q) return list;
      return list.filter(a => `${a.product} ${a.assetNo || ""}`.toLowerCase().includes(q));
    }

    const m = modal(`
      <div class="modal lg">
        <h3>QR 다운로드</h3>
        <div class="body" style="display:flex;flex-direction:column;max-height:56vh">
          <input type="text" class="picker-search" id="qr-search" placeholder="고유관리번호/품목명">
          <div class="picker-toolbar">
            <label class="picker-check"><input type="checkbox" id="qr-page-all"><span>현재 페이지 전체 선택</span></label>
          </div>
          <div id="qr-rows" style="flex:1;min-height:0;overflow-y:auto"></div>
          <div class="pager" id="qr-pager" style="padding-top:10px"></div>
        </div>
        <div class="foot" style="flex-direction:column;align-items:stretch;gap:8px">
          <span class="sum" id="qr-sum">선택됨 0</span>
          <div style="display:flex;justify-content:flex-end;gap:8px">
            <button class="btn" data-close>취소</button>
            <button class="btn primary" id="qr-go" disabled>다운로드</button>
          </div>
        </div>
      </div>`);
    m.querySelector("#qr-search").oninput = e => { query = e.target.value; page = 1; renderList(); };

    function renderList() {
      const fl = filteredList();
      const totalPages = Math.max(1, Math.ceil(fl.length / PAGE_SIZE));
      if (page > totalPages) page = totalPages;
      const pageItems = fl.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
      const rowsEl = m.querySelector("#qr-rows");
      rowsEl.innerHTML = pageItems.map(a => `<label class="picker-member-row">
        <input type="checkbox" data-id="${a.id}" ${sel.has(a.id) ? "checked" : ""}>
        <span class="picker-member-info" style="flex:1">
          <b>${a.product}</b><span>${a.assetNo || "—"}</span>
        </span>
        <span class="muted">${a.group} › ${a.sub}</span>
      </label>`).join("") || '<p class="muted" style="padding:16px 0">대상 자산이 없습니다.</p>';
      const pageAllChecked = pageItems.length > 0 && pageItems.every(a => sel.has(a.id));
      m.querySelector("#qr-page-all").checked = pageAllChecked;
      m.querySelector("#qr-page-all").onchange = e => {
        pageItems.forEach(a => e.target.checked ? sel.add(a.id) : sel.delete(a.id));
        renderList();
      };
      rowsEl.querySelectorAll("input[data-id]").forEach(cb => cb.onchange = () => {
        cb.checked ? sel.add(cb.dataset.id) : sel.delete(cb.dataset.id);
        renderList();
      });

      m.querySelector("#qr-pager").innerHTML = `
        <button data-qp="prev" ${page === 1 ? "disabled" : ""}>‹</button>
        <span style="padding:0 6px;font-size:12.5px;color:var(--text-sub)">${page} / ${totalPages}</span>
        <button data-qp="next" ${page === totalPages ? "disabled" : ""}>›</button>
      `;
      m.querySelectorAll("[data-qp]").forEach(b => b.onclick = () => {
        page += b.dataset.qp === "prev" ? -1 : 1;
        renderList();
      });

      m.querySelector("#qr-sum").textContent = `선택됨 ${sel.size}`;
      m.querySelector("#qr-go").disabled = sel.size === 0;
    }

    m.querySelector("#qr-go").onclick = () => {
      const items = list.filter(a => sel.has(a.id));
      const d = new Date(), p2 = n => String(n).padStart(2, "0");
      const ts = `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`;
      if (items.length === 1) {
        const a = items[0];
        // 구조설계안 5.4 사진 다운로드와 동일한 식별 라벨 규칙(개별=고유관리번호, 수량=품목명) + QR 접두어
        const label = a.type === "individual" ? (a.assetNo || a.id) : a.product;
        toast(`"QR_${label}_${ts}.png" 다운로드 (프로토타입 — 반영 없음)`);
      } else {
        toast(`"Asset_QR_${ts}.zip" (${items.length}건) 다운로드 (프로토타입 — 반영 없음)`);
      }
      m.remove();
    };

    renderList();
  }

  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:200;box-shadow:0 8px 24px rgba(0,0,0,.25)";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  }

  window.AssetsScreen = { render };
})();
