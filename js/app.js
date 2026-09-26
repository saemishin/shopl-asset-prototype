/* 앱 직원모드 — 화면 중앙에 폰 프레임으로 띄우는 목업. 메뉴 화면(관리 섹션 마지막에 자산 추가) + 자산 화면
   (내 자산·근무지 자산 탭) + 근무지 카드 "전체보기"의 목적지 화면 + 카드 클릭 시 진입하는 자산 상세까지 구현.
   자산 상세는 배정/보유 변경 권한(assign_permission_type, category.js에 저장된 소분류별 값으로 실제 판정)이
   있는 자산에 한해 재배정·배정 추가·반납·분실 신고/회수·수리 접수/완료·폐기·보유 대상 추가/변경/해제·사진
   관리 액션을 제공(자산 관리 권한 소관인 필드 수정·소분류 이동 등은 스코프 밖). 실 앱 화면(근무지 목록/
   보고서/게시판/근무지 상세 정보탭의 "더보기" 카드 패턴)을 참고해 리스트 화면 공통 요소를 재현. */
(function () {
  const { assets } = window.DATA;
  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300";
    document.body.appendChild(t); setTimeout(() => t.remove(), 1800);
  }
  const STATUS_LABEL = {
    stock: ["재고", "stock"], assigned: ["배정 중", "assigned"], repair: ["수리 중", "repair"],
    lost: ["분실", "lost"], disposed: ["폐기", "disposed"], held: ["보유 중", "assigned"],
  };
  function todayStr() { return new Date().toISOString().slice(0, 10); }
  // assets.js/detail.js와 동일한 기준일(이 프로토타입 전역에서 "오늘"로 취급하는 고정 날짜) — 유효기한
  // 배지 판정을 대시보드와 동일하게 맞추기 위해 이 파일에도 중복 정의
  const TODAY = new Date("2026-09-04");
  // 자산 상세(앱) 정보 섹션 — detail.js의 expiryBadge/chips/memoHtml과 동일 로직(이 파일도 자기 완결적이라 중복 유지)
  function expiryBadge(d) {
    if (!d) return '<span class="muted">—</span>';
    const days = Math.ceil((new Date(d) - TODAY) / 86400000);
    const [t, c] = days < 0 ? ["만료", "exp-over"] : days <= 7 ? ["만료 예정", "exp-soon"] : ["유효", "exp-valid"];
    return `${window.fmtDate(d)} <span class="badge ${c}">${t}</span>`;
  }
  const chips = arr => (arr && arr.length) ? arr.map(l => `<span class="tag">${l}</span>`).join("") : '<span class="muted">—</span>';
  const memoHtml = note => note ? `<span>${note}</span>` : '<span class="muted">—</span>';
  // "나" 페르소나 — 구성원 상세와 동일하게 더미 중 한 명을 기본값으로(?me= 쿼리로 다른 사람도 테스트 가능)
  const ME = new URLSearchParams(location.search).get("me") || "김민수";
  // assets.js/detail.js의 WS_CODE/WS_ADDRESS와 동일 값(이 파일도 자기 완결적이라 중복 유지 — 이 프로토타입 전반의 컨벤션)
  const WS_CODE = { "강남점": "GN-01", "판교점": "PG-01", "본사": "HQ-01" };
  const WS_ADDRESS = {
    "강남점": "서울특별시 강남구 테헤란로 129",
    "판교점": "경기도 성남시 분당구 판교역로 235",
    "본사": "서울특별시 중구 을지로 100",
  };
  // 구성원마다 고정 근무지 1개 + 담당 근무지 여러 개(최대 100개, 프로토타입은 데모용으로 소수만) — 이 매핑
  // 자체가 구조설계안에 없던 새 더미 데이터라 이 파일에만 정의(자산관리 기능이 아니라 근무지 기능 소관이라
  // 실 서비스엔 이미 구성원마다 저장돼 있는 값을 여기선 데모용으로 시드)
  const MY_WORKSITES = {
    "김민수": { fixed: "본사", assigned: ["강남점", "판교점"] },
    "정우성": { fixed: "강남점", assigned: ["본사"] },
  };
  function myWorksites(name) {
    return MY_WORKSITES[name] || { fixed: "본사", assigned: [] };
  }
  // category.js의 MEMBERS와 동일 값(이 파일도 자기 완결적이라 중복 유지) — 배정/보유 변경 권한 판정의
  // "특정 그룹 및 직무/직급" 매칭에 씀. 직무/직급은 구성원별 데이터가 프로토타입에 없어 매칭 대상에서 제외.
  const MEMBER_TEAM = {
    "김민수": "개발팀", "이서연": "디자인팀", "박지훈": "영업팀", "정우성": "CS팀",
    "김철수": "운영팀", "최유진": "개발팀", "한소희": "디자인팀", "장민호": "국내영업",
    "오세훈": "운영팀", "배수지": "CS팀", "윤재현": "해외영업", "임하늘": "개발팀",
  };
  const EMPLOYEE_NAMES = Object.keys(MEMBER_TEAM);
  const WORKSITE_NAMES = Object.keys(WS_CODE);
  // 배정/보유 변경 권한 판정 — 이 자산의 소분류에 분류 관리 화면(category.js)에서 저장된 assign(권한 값)·
  // assignTarget(대상)을 찾아 ME 페르소나가 그 범위에 속하는지 실제로 계산. 프로토타입엔 관리자/리더
  // 여부를 나타내는 필드가 없어 "관리자만"·"모든 관리자 및 리더"는 항상 거부(김민수·정우성 둘 다 일반
  // 직원으로 취급) — 실제 서비스라면 이 두 값도 계정의 관리자/리더 여부로 판정됨.
  function hasAssignPermission(a) {
    const cat = window.DATA.categories.find(c => c.group === a.group && c.sub === a.sub);
    if (!cat) return false;
    switch (cat.assign) {
      case "회사의 모든 구성원": return true;
      case "특정 관리자/리더": return (cat.assignTarget && cat.assignTarget.members || []).includes(ME);
      case "특정 그룹 및 직무/직급": return (cat.assignTarget && cat.assignTarget.groups || []).includes(MEMBER_TEAM[ME]);
      default: return false; // 모든 관리자 및 리더 / 관리자만
    }
  }
  const IC_PERSON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5"/></svg>`;
  const IC_WORKSITE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20V9.5L12 4l8 5.5V20"/><path d="M9.5 20v-5h5v5"/></svg>`;

  // 이 구성원에게 배정(개별형)·보유(수량형)된 자산 — member-detail.js의 collectItems와 동일 로직
  function collectMyItems(name) {
    const items = [];
    assets.forEach(a => {
      if (a.type === "individual") {
        (a.assignments || []).forEach(x => { if (x.employee === name) items.push({ qty: 1, asset: a }); });
      } else {
        (a.stocks || []).forEach(x => { if (x.employee === name) items.push({ qty: x.qty, asset: a }); });
      }
    });
    return items;
  }
  // assets.js의 subOrder()와 동일 — 카드 목록도 대시보드와 같은 규칙(분류순→품목명순→동점 처리)으로 정렬,
  // 다만 모바일 카드 리스트는 소분류 구분 헤더 없이 평평한 목록이라 정렬만 적용하고 그룹 라벨은 안 보여줌
  const CATEGORY_ORDER = new Map(window.DATA.categories.map((c, i) => [c.sub, i]));
  function subOrder(sub) { return CATEGORY_ORDER.has(sub) ? CATEGORY_ORDER.get(sub) : 999; }
  function sortItems(items) {
    return [...items].sort((p, q) => {
      const bySub = subOrder(p.asset.sub) - subOrder(q.asset.sub);
      if (bySub) return bySub;
      const byProduct = p.asset.product.localeCompare(q.asset.product, "ko");
      if (byProduct) return byProduct;
      if (p.asset.type === "individual") return (p.asset.assetNo || "").localeCompare(q.asset.assetNo || "", "ko");
      return q.qty - p.qty;
    });
  }
  // 특정 근무지에 배정(개별형)·보유(수량형)된 자산 전체(정렬 적용) — 근무지 카드의 분류별 카운트 집계와
  // "전체보기"(분류별 자산 목록) 화면이 이 함수를 공유해 동일한 집합/정렬을 보장. sub를 주면 그 소분류로만 필터
  function itemsForWorksite(ws, sub) {
    const items = [];
    assets.forEach(a => {
      if (sub && a.sub !== sub) return;
      if (a.type === "individual") {
        (a.assignments || []).forEach(x => { if (x.worksite === ws) items.push({ qty: 1, asset: a }); });
      } else {
        (a.stocks || []).forEach(x => { if (x.worksite === ws) items.push({ qty: x.qty, asset: a }); });
      }
    });
    return sortItems(items);
  }
  // 소분류 단위 카운트(대분류 → 소분류 → 건수) — 근무지 카드 안에 자산 카드 대신 보여줄 분류 트리.
  // 소분류는 항상 유한하니(구성원 개인 소유와 달리 근무지는 자산이 무제한일 수 있음) 최대 개수 제한 없이 전부 노출
  function groupItemsByCategory(items) {
    const groupOrder = [];
    const groupMap = {};
    items.forEach(x => {
      const g = x.asset.group, s = x.asset.sub;
      if (!groupMap[g]) { groupMap[g] = { order: [], map: {} }; groupOrder.push(g); }
      const gm = groupMap[g];
      if (!gm.map[s]) { gm.map[s] = []; gm.order.push(s); }
      gm.map[s].push(x);
    });
    return groupOrder.map(g => ({ group: g, subs: groupMap[g].order.map(s => ({ sub: s, count: groupMap[g].map[s].length })) }));
  }
  // 근무지 자산 — 이 구성원의 고정+담당 근무지 각각에 배정(개별형)·보유(수량형)된 자산을 모음.
  // 카드 정렬: 고정 근무지가 항상 최상단, 담당 근무지는 근무지명 가나다순(member-detail.js collectItems와
  // 동일한 자산 수집 로직을 근무지 기준으로 적용)
  function collectWorksiteGroups(name) {
    const { fixed, assigned } = myWorksites(name);
    const assignedSorted = [...assigned].sort((a, b) => a.localeCompare(b, "ko"));
    const worksites = [{ ws: fixed, label: "fixed" }, ...assignedSorted.map(ws => ({ ws, label: "assigned" }))];
    return worksites.map(({ ws, label }) => ({ worksite: ws, label, items: itemsForWorksite(ws) }));
  }

  const THUMB_EMPTY = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-4 4 3 4-4 5 4"/></svg>`;
  function cardThumb(a) {
    const photos = window.assetPhotos(a);
    if (photos.length) return `<span class="mapp-thumb" style="background:${photos[a._primary || 0].color}"></span>`;
    return `<span class="mapp-thumb empty">${THUMB_EMPTY}</span>`;
  }
  // 카드 구성 확정: 대표 이미지 / 품목명 / 고유관리번호(개별형) / 상태 뱃지(개별형) 또는 보유 수량(수량형) —
  // 분류 등 나머지 정보는 자산 상세에서 확인하는 것으로 스코프 아웃.
  function assetCardHtml(x) {
    const a = x.asset;
    if (a.type === "individual") {
      return `
        <div class="mapp-card" data-asset-card data-asset-id="${a.id}">
          ${cardThumb(a)}
          <div class="mapp-card-body">
            <div class="mapp-card-title">${a.product}</div>
            <div class="mapp-card-sub">${a.assetNo || "—"}</div>
          </div>
          <span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>
        </div>`;
    }
    return `
      <div class="mapp-card" data-asset-card data-asset-id="${a.id}">
        ${cardThumb(a)}
        <div class="mapp-card-body">
          <div class="mapp-card-title">${a.product}</div>
        </div>
        <span class="badge stock">${x.qty}개</span>
      </div>`;
  }
  // 자산 상세(앱)에서 쓰는 공용 헬퍼 — target({type:"employee"|"worksite", value})이 가리키는 이 자산의
  // 구체적인 배정(개별형)/보유(수량형) 레코드를 찾음. 카드는 항상 target에 해당하는 레코드가 있어야만
  // 노출되므로(내 자산/근무지 자산 수집 로직 자체가 그렇게 필터링), 진입 시점엔 idx가 항상 >=0.
  function findRecord(a, target) {
    const list = a.type === "individual" ? (a.assignments || (a.assignments = [])) : (a.stocks || (a.stocks = []));
    const idx = list.findIndex(x => target.type === "employee" ? x.employee === target.value : x.worksite === target.value);
    return { list, idx };
  }
  function categoryPath(a) { return `${a.group} › ${a.sub}`; }
  // 재고⟷배정중/보유중⟷재고는 배정·보유 레코드 존재 여부로 자동 파생(구조설계안 3.3) — 분실 회수·수리
  // 완료 시 되돌아갈 상태, 보유 변경·해제 후 상태 재계산에 공용으로 씀
  function derivedActiveStatus(a) { return (a.assignments || []).length > 0 ? "assigned" : "stock"; }
  function derivedHeldStatus(a) { return (a.stocks || []).reduce((s, x) => s + x.qty, 0) > 0 ? "held" : "stock"; }

  // 상단 탭 UI — 실 서비스 패턴(선택된 탭은 라벨이 있는 넓은 필, 비선택 탭은 아이콘만 있는 작은 정사각형)
  function assetTabsHtml(active) {
    const mineActive = active === "mine";
    return `
      <div class="mapp-seg-tabs">
        <button type="button" class="mapp-seg-tab${mineActive ? " active" : " icon-only"}" data-mapp-asset-tab="mine" aria-label="내 자산">${mineActive ? "내 자산" : IC_PERSON}</button>
        <button type="button" class="mapp-seg-tab${!mineActive ? " active" : " icon-only"}" data-mapp-asset-tab="worksite" aria-label="근무지 자산">${!mineActive ? "근무지 자산" : IC_WORKSITE}</button>
      </div>`;
  }

  // 대분류 단위 섹션(접기/펼치기 가능) — 근무지 자산과 달리 개인 소유라 목록이 길지 않을 걸로 판단해
  // 소분류까지 더 쪼개진 카운트 목록이 아니라, 기존 카드 목록 그대로에 대분류 섹션 헤더만 얹음(2026-09-26)
  function groupItemsBySection(items) {
    const order = [];
    const map = {};
    items.forEach(x => {
      const g = x.asset.group;
      if (!map[g]) { map[g] = []; order.push(g); }
      map[g].push(x);
    });
    return order.map(group => ({ group, items: map[group] }));
  }
  function myAssetsScreenHtml(items) {
    const sections = groupItemsBySection(items);
    return `
      <div class="mapp-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        <span class="mapp-topbar-title">자산</span>
      </div>
      ${assetTabsHtml("mine")}
      <div class="mapp-body">
        <div class="mapp-search">
          <input type="text" data-mapp-search placeholder="품목명/고유관리번호">
        </div>
        <div class="mapp-count">전체 <b>${items.length}</b></div>
        ${items.length ? `
          <div data-mapp-card-list>${sections.map(sec => `
            <div class="mapp-cat-section" data-cat-section>
              <button type="button" class="mapp-cat-section-head" data-cat-collapse aria-expanded="true" aria-label="접기/펼치기">
                <span>${sec.group}</span>
                <span class="mapp-cat-section-count">${sec.items.length}</span>
                ${CHEV_DOWN}
              </button>
              <div class="mapp-card-list" data-cat-collapsible>${sec.items.map(x => assetCardHtml(x)).join("")}</div>
            </div>`).join("")}</div>
          <p class="mapp-empty" data-mapp-empty hidden>결과가 없습니다.</p>
        ` : `<p class="mapp-empty">배정·보유 중인 자산이 없습니다.</p>`}
      </div>`;
  }
  // 근무지 카드 — 자산 카드를 직접 나열하는 대신 대분류>소분류 목록 + 분류별 자산 개수만 보여줌(2026-09-26).
  // 근무지당 자산 수는 무제한일 수 있어 "최대 5개+전체보기" 상한이 필요했지만, 분류 자체는 회사가 만든
  // 만큼만 존재해 항상 유한하므로 그런 상한 장치가 필요 없어짐. 소분류를 누르면 그 근무지·그 소분류의
  // 자산 목록(worksiteDetailScreenHtml)으로 이동. 고정/담당 라벨은 참고 이미지대로 불릿(●)만, 아이콘 없음.
  // 카드마다 접기/펼치기 가능(기본 펼침) — 분류 목록이 접히는 범위
  const WS_LABEL = { fixed: "● 고정 근무지", assigned: "● 담당 근무지" };
  const CHEV_DOWN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>`;
  function worksiteCategoryTreeHtml(wsName, items) {
    const tree = groupItemsByCategory(items);
    return tree.map(g => `
      <div class="mapp-ws-cat-group">
        <div class="mapp-ws-cat-group-label">${g.group}</div>
        ${g.subs.map(s => `
          <button type="button" class="mapp-ws-cat-row" data-ws-cat-open data-ws="${wsName}" data-sub="${s.sub}">
            <span>${s.sub}</span>
            <span class="mapp-ws-cat-count">${s.count}<span class="mapp-menu-chev">›</span></span>
          </button>`).join("")}
      </div>`).join("");
  }
  function worksiteCardHtml(group) {
    return `
      <div class="mapp-ws-card" data-ws-card data-ws-name="${group.worksite}" data-ws-code="${WS_CODE[group.worksite] || ""}" data-ws-address="${WS_ADDRESS[group.worksite] || ""}">
        <div class="mapp-ws-head">
          <div class="mapp-ws-head-main">
            <div class="mapp-ws-label">${WS_LABEL[group.label]}</div>
            <div class="mapp-ws-name">${group.worksite}${WS_CODE[group.worksite] ? `(${WS_CODE[group.worksite]})` : ""}</div>
            <div class="mapp-ws-address">${WS_ADDRESS[group.worksite] || ""}</div>
          </div>
          <button type="button" class="mapp-ws-collapse" data-ws-collapse aria-expanded="true" aria-label="접기/펼치기">${CHEV_DOWN}</button>
        </div>
        <div data-ws-collapsible>
          <div class="mapp-ws-count">전체 <b>${group.items.length}</b></div>
          ${group.items.length
            ? `<div class="mapp-ws-cat-tree">${worksiteCategoryTreeHtml(group.worksite, group.items)}</div>`
            : `<p class="mapp-ws-empty">배정·보유 중인 자산이 없습니다.</p>`}
        </div>
      </div>`;
  }
  function worksiteAssetsScreenHtml(groups) {
    return `
      <div class="mapp-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        <span class="mapp-topbar-title">자산</span>
      </div>
      ${assetTabsHtml("worksite")}
      <div class="mapp-body">
        <div class="mapp-search">
          <input type="text" data-mapp-ws-search placeholder="근무지명/코드/주소">
        </div>
        <div class="mapp-count">전체 <b>${groups.length}</b></div>
        <div class="mapp-ws-list" data-mapp-ws-list>${groups.map(worksiteCardHtml).join("")}</div>
      </div>`;
  }
  // 근무지 카드에서 소분류를 누르면 이동하는 목적지 — 그 근무지의 그 소분류 자산 목록. 타이틀 텍스트 없이
  // 뒤로가기 버튼만(근무지명은 바로 아래 헤더에 표기), 근무지명/코드/주소를 각각 줄바꿔 표시하고 지금 보는
  // 소분류를 그 아래에 덧붙임, 그 아래는 내 자산 탭과 동일한 구성(검색+카운트+카드 리스트, 정렬도 동일)
  function worksiteDetailScreenHtml(ws, sub, items) {
    return `
      <div class="mapp-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
      </div>
      <div class="mapp-wsdetail-head">
        <div class="mapp-wsdetail-name">${ws}</div>
        <div class="mapp-wsdetail-code">${WS_CODE[ws] || ""}</div>
        <div class="mapp-wsdetail-address">${WS_ADDRESS[ws] || ""}</div>
        <div class="mapp-wsdetail-sub">${sub}</div>
      </div>
      <div class="mapp-body">
        <div class="mapp-search">
          <input type="text" data-mapp-search placeholder="품목명/고유관리번호">
        </div>
        <div class="mapp-count">전체 <b>${items.length}</b></div>
        ${items.length ? `
          <div class="mapp-card-list" data-mapp-card-list>${items.map(x => assetCardHtml(x)).join("")}</div>
          <p class="mapp-empty" data-mapp-empty hidden>결과가 없습니다.</p>
        ` : `<p class="mapp-empty">배정·보유 중인 자산이 없습니다.</p>`}
      </div>`;
  }

  // ===== 자산 상세(앱) =====
  // 배정/보유 변경 권한이 있는 소분류의 자산에 한해, 이 카드가 나타내는 구체적인 배정/보유 레코드(target)를
  // 대상으로 액션 수행. 자산 관리 권한(manage_permission_type) 소관인 필드 수정·소분류 이동 등은 스코프 밖
  // (구조설계안 4.1/4.3 — "직원모드"는 배정/보유 변경 권한(assign_permission_type) 대상을 위한 화면).
  function confirmModal(title, body, onOk, danger) {
    const cb = document.createElement("div");
    cb.className = "modal-back";
    cb.style.zIndex = 340;
    cb.innerHTML = `
      <div class="modal" style="width:360px">
        <div class="body" style="padding-top:20px">
          <p style="font-size:14px;font-weight:700;margin-bottom:6px">${title}</p>
          ${body ? `<p class="hint" style="margin-top:0">${body}</p>` : ""}
        </div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn ${danger ? "danger" : "primary"}" data-cok>확인</button>
        </div>
      </div>`;
    cb.addEventListener("click", e => { if (e.target === cb) cb.remove(); });
    cb.querySelector("[data-cclose]").onclick = () => cb.remove();
    cb.querySelector("[data-cok]").onclick = () => { cb.remove(); onOk(); };
    document.body.appendChild(cb);
  }
  function openStatusChangeConfirm(a, title, body, apply, onDone, danger) {
    confirmModal(title, body, () => { apply(); toast("상태가 변경되었습니다."); onDone(); }, danger);
  }
  // 대상(구성원/근무지) 선택 select — 배정 추가·재배정·보유 대상 추가가 공유. value는 "employee:이름"/
  // "worksite:이름" 형식(폼 하나에 라디오+피커를 따로 두는 대신 옵션그룹으로 단순화)
  function targetSelectHtml(empOptions, wsOptions, placeholder) {
    return `
      <select data-target-select style="width:100%;height:40px;border:1px solid var(--line-strong);border-radius:8px;padding:0 10px;background:#fff">
        <option value="">${placeholder}</option>
        ${empOptions.length ? `<optgroup label="구성원">${empOptions.map(n => `<option value="employee:${n}">${n}</option>`).join("")}</optgroup>` : ""}
        ${wsOptions.length ? `<optgroup label="근무지">${wsOptions.map(n => `<option value="worksite:${n}">${n}</option>`).join("")}</optgroup>` : ""}
      </select>`;
  }
  function openAssignAddModal(a, onDone) {
    const usedEmployees = (a.assignments || []).map(x => x.employee).filter(Boolean);
    const usedWorksites = (a.assignments || []).map(x => x.worksite).filter(Boolean);
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal" style="width:360px">
        <div class="body" style="padding-top:20px">
          <p style="font-size:14px;font-weight:700;margin-bottom:14px">배정 추가</p>
          ${targetSelectHtml(EMPLOYEE_NAMES.filter(n => !usedEmployees.includes(n)), WORKSITE_NAMES.filter(n => !usedWorksites.includes(n)), "배정 대상 선택")}
        </div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn primary" data-cok disabled>추가</button>
        </div>
      </div>`;
    document.body.appendChild(back);
    const sel = back.querySelector("[data-target-select]");
    const okBtn = back.querySelector("[data-cok]");
    sel.onchange = () => { okBtn.disabled = !sel.value; };
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-cclose]").onclick = () => back.remove();
    okBtn.onclick = () => {
      const [kind, name] = sel.value.split(":");
      back.remove();
      confirmModal("배정을 추가하시겠습니까?", "", () => {
        const record = kind === "employee" ? { employee: name, worksite: null, since: todayStr() } : { employee: null, worksite: name, since: todayStr() };
        (a.assignments || (a.assignments = [])).push(record);
        if (a.status === "stock") a.status = "assigned";
        toast("추가되었습니다.");
        onDone();
      });
    };
  }
  function openReassignModal(a, idx, onDone) {
    const old = a.assignments[idx];
    const usedEmployees = (a.assignments || []).map(x => x.employee).filter(Boolean);
    const usedWorksites = (a.assignments || []).map(x => x.worksite).filter(Boolean);
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal" style="width:360px">
        <div class="body" style="padding-top:20px">
          <p style="font-size:14px;font-weight:700;margin-bottom:6px">재배정</p>
          <p class="hint" style="margin-top:0;margin-bottom:12px">현재 대상(${old.employee || old.worksite})이 새 대상으로 교체됩니다.</p>
          ${targetSelectHtml(EMPLOYEE_NAMES.filter(n => !usedEmployees.includes(n)), WORKSITE_NAMES.filter(n => !usedWorksites.includes(n)), "새 대상 선택")}
        </div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn primary" data-cok disabled>재배정</button>
        </div>
      </div>`;
    document.body.appendChild(back);
    const sel = back.querySelector("[data-target-select]");
    const okBtn = back.querySelector("[data-cok]");
    sel.onchange = () => { okBtn.disabled = !sel.value; };
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-cclose]").onclick = () => back.remove();
    okBtn.onclick = () => {
      const [kind, name] = sel.value.split(":");
      back.remove();
      confirmModal("재배정하시겠습니까?", "", () => {
        a.assignments[idx] = kind === "employee" ? { employee: name, worksite: null, since: todayStr() } : { employee: null, worksite: name, since: todayStr() };
        toast("재배정되었습니다.");
        onDone();
      });
    };
  }
  function openReturnConfirm(a, idx, onDone) {
    confirmModal("반납하시겠습니까?", "반납하면 배정에서 제거됩니다.", () => {
      a.assignments.splice(idx, 1);
      a.status = derivedActiveStatus(a);
      toast("반납되었습니다.");
      onDone();
    });
  }
  function openHoldAddModal(a, onDone) {
    const usedEmployees = (a.stocks || []).map(x => x.employee).filter(Boolean);
    const usedWorksites = (a.stocks || []).map(x => x.worksite).filter(Boolean);
    const remaining = a.totalQty - (a.stocks || []).reduce((s, x) => s + x.qty, 0);
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal" style="width:360px">
        <div class="body" style="padding-top:20px">
          <p style="font-size:14px;font-weight:700;margin-bottom:14px">보유 대상 추가</p>
          ${targetSelectHtml(EMPLOYEE_NAMES.filter(n => !usedEmployees.includes(n)), WORKSITE_NAMES.filter(n => !usedWorksites.includes(n)), "보유 대상 선택")}
          <input type="number" data-qty-input min="1" max="${remaining}" placeholder="수량(잔여 ${remaining}개)" style="width:100%;height:40px;border:1px solid var(--line-strong);border-radius:8px;padding:0 10px;margin-top:8px">
        </div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn primary" data-cok disabled>추가</button>
        </div>
      </div>`;
    document.body.appendChild(back);
    const sel = back.querySelector("[data-target-select]");
    const qtyInput = back.querySelector("[data-qty-input]");
    const okBtn = back.querySelector("[data-cok]");
    function updateOk() {
      const qty = Number(qtyInput.value);
      okBtn.disabled = !(sel.value && qty >= 1 && qty <= remaining);
    }
    sel.onchange = updateOk;
    qtyInput.oninput = updateOk;
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-cclose]").onclick = () => back.remove();
    okBtn.onclick = () => {
      const [kind, name] = sel.value.split(":");
      const qty = Number(qtyInput.value);
      back.remove();
      confirmModal("보유 대상을 추가하시겠습니까?", "", () => {
        const record = kind === "employee" ? { employee: name, worksite: null, qty } : { employee: null, worksite: name, qty };
        (a.stocks || (a.stocks = [])).push(record);
        a.status = derivedHeldStatus(a);
        toast("추가되었습니다.");
        onDone();
      });
    };
  }
  function openQtyChangeModal(a, idx, onDone) {
    const rec = a.stocks[idx];
    const others = a.stocks.reduce((s, x, i) => i === idx ? s : s + x.qty, 0);
    const max = a.totalQty - others;
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal" style="width:340px">
        <div class="body" style="padding-top:20px">
          <p style="font-size:14px;font-weight:700;margin-bottom:14px">수량 변경</p>
          <input type="number" data-qty-input min="0" max="${max}" value="${rec.qty}" style="width:100%;height:40px;border:1px solid var(--line-strong);border-radius:8px;padding:0 10px">
          <p class="hint" style="margin-top:6px">잔여 수량 포함 최대 ${max}개까지 입력 가능</p>
        </div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn primary" data-cok>변경</button>
        </div>
      </div>`;
    document.body.appendChild(back);
    const qtyInput = back.querySelector("[data-qty-input]");
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-cclose]").onclick = () => back.remove();
    back.querySelector("[data-cok]").onclick = () => {
      const qty = Number(qtyInput.value);
      if (!(qty >= 0 && qty <= max)) return;
      back.remove();
      confirmModal("수량을 변경하시겠습니까?", "", () => {
        rec.qty = qty;
        a.status = derivedHeldStatus(a);
        toast("변경되었습니다.");
        onDone();
      });
    };
  }
  function openHoldReleaseConfirm(a, idx, onDone) {
    confirmModal("보유 대상에서 해제하시겠습니까?", "해제된 수량은 잔여 수량으로 돌아갑니다.", () => {
      a.stocks.splice(idx, 1);
      a.status = derivedHeldStatus(a);
      toast("해제되었습니다.");
      onDone();
    });
  }
  // 사진 관리 — asset-register.js의 사진 타일 UI·데이터 형태(window.assetPhotos, a._photos/a._primary)를
  // 그대로 재사용(같은 CSS 클래스 .areg-photo-*는 전역 css/app.css에 이미 정의돼 있어 추가 CSS 불필요)
  const PHOTO_COLORS = ["#5b8def", "#8f6ef0", "#eb7f8b", "#3fb37f", "#e0a63c", "#4dabf7", "#c2554e", "#3f9ba0", "#9a6bd6", "#5aa06a"];
  const CLOSE_ICON_SM = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
  function openPhotoManageModal(a, onDone) {
    const photos = window.assetPhotos(a).map(p => ({ ...p }));
    let primaryIdx = a._primary || 0;
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal" style="width:360px">
        <div class="body" style="padding-top:20px">
          <p style="font-size:14px;font-weight:700;margin-bottom:14px">사진 관리</p>
          <div class="areg-photo-row" data-photo-row></div>
        </div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn primary" data-cok>저장</button>
        </div>
      </div>`;
    document.body.appendChild(back);
    const row = back.querySelector("[data-photo-row]");
    function renderPhotos() {
      const tiles = photos.map((p, i) => `
        <button type="button" class="areg-photo-tile${i === primaryIdx ? " primary" : ""}" data-photo-i="${i}" style="background:${p.color}" aria-label="사진 ${i + 1}${i === primaryIdx ? " (대표)" : ""}">
          ${i === primaryIdx ? '<span class="areg-photo-star">★</span>' : ""}
          <span class="areg-photo-del" data-photo-del="${i}" aria-label="삭제">${CLOSE_ICON_SM}</span>
        </button>`).join("");
      const addTile = photos.length < 10 ? `<button type="button" class="areg-photo-add" data-photo-add aria-label="사진 추가">+</button>` : "";
      row.innerHTML = tiles + addTile;
      row.querySelectorAll("[data-photo-i]").forEach(b => b.onclick = e => {
        if (e.target.closest("[data-photo-del]")) return;
        primaryIdx = +b.dataset.photoI; renderPhotos();
      });
      row.querySelectorAll("[data-photo-del]").forEach(b => b.onclick = e => {
        e.stopPropagation();
        const i = +b.dataset.photoDel;
        photos.splice(i, 1);
        if (!photos.length) primaryIdx = 0; else if (primaryIdx >= photos.length) primaryIdx = photos.length - 1;
        renderPhotos();
      });
      const addBtn = row.querySelector("[data-photo-add]");
      if (addBtn) addBtn.onclick = () => {
        photos.push({ color: PHOTO_COLORS[photos.length % PHOTO_COLORS.length], at: `${todayStr()} 00:00`, by: ME });
        if (photos.length === 1) primaryIdx = 0;
        renderPhotos();
      };
    }
    renderPhotos();
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-cclose]").onclick = () => back.remove();
    back.querySelector("[data-cok]").onclick = () => {
      back.remove();
      a._photos = photos;
      a._primary = primaryIdx;
      toast("저장되었습니다.");
      onDone();
    };
  }
  function openMemoEditModal(a, onDone) {
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal" style="width:360px">
        <div class="body" style="padding-top:20px">
          <p style="font-size:14px;font-weight:700;margin-bottom:10px">메모 수정</p>
          <textarea data-memo-input maxlength="500" placeholder="메모를 입력하세요" style="width:100%;min-height:120px;border:1px solid var(--line-strong);border-radius:8px;padding:10px;font:inherit;resize:vertical">${a.note || ""}</textarea>
        </div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn primary" data-cok>저장</button>
        </div>
      </div>`;
    document.body.appendChild(back);
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-cclose]").onclick = () => back.remove();
    back.querySelector("[data-cok]").onclick = () => {
      a.note = back.querySelector("[data-memo-input]").value.trim();
      back.remove();
      toast("저장되었습니다.");
      onDone();
    };
  }
  // 자산 사진 뷰어 — 조회 전용(편집은 "사진 관리" 액션에서), 조회 권한만 있어도 볼 수 있어야 해서 배정/보유
  // 변경 권한과 무관하게 항상 열 수 있음. 대시보드 detail.js의 openViewer를 단순화(줌·정보패널·수정메뉴 없이
  // 넘기기+닫기만) — 폰 프레임에 맞는 전체화면 뷰어
  function openPhotoViewer(a) {
    const items = window.assetPhotos(a);
    if (!items.length) return;
    let cur = a._primary || 0;
    const back = document.createElement("div");
    back.className = "mapp-viewer-back";
    back.innerHTML = `
      <div class="mapp-viewer-bar">
        <span class="mapp-viewer-count"></span>
        <button type="button" class="mapp-viewer-close" data-vclose aria-label="닫기">✕</button>
      </div>
      <div class="mapp-viewer-stage">
        <button type="button" class="mapp-viewer-nav" data-vprev aria-label="이전">‹</button>
        <div class="mapp-viewer-img"></div>
        <button type="button" class="mapp-viewer-nav" data-vnext aria-label="다음">›</button>
      </div>`;
    document.body.appendChild(back);
    const img = back.querySelector(".mapp-viewer-img");
    const countEl = back.querySelector(".mapp-viewer-count");
    const prevBtn = back.querySelector("[data-vprev]");
    const nextBtn = back.querySelector("[data-vnext]");
    function draw() {
      img.style.background = items[cur].color;
      countEl.textContent = `${cur + 1} / ${items.length}`;
      prevBtn.hidden = nextBtn.hidden = items.length < 2;
    }
    prevBtn.onclick = () => { cur = (cur - 1 + items.length) % items.length; draw(); };
    nextBtn.onclick = () => { cur = (cur + 1) % items.length; draw(); };
    back.querySelector("[data-vclose]").onclick = () => back.remove();
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    draw();
  }
  // 상태 변경 액션(상태 뱃지 클릭 → 바텀시트) — 개별형 전용(수량형은 재고/보유중만 있고 배정·보유
  // 레코드 존재 여부로 자동 파생돼 수동 상태 변경 액션 자체가 없음, 구조설계안 3.3). 대시보드 detail.js의
  // STATUS_TRANSITIONS과 동일하게 현재 상태에서 갈 수 있는 전이만 노출
  const STATUS_TRANSITIONS = {
    stock: [["repair-start", "수리 접수"], ["lost-report", "분실 신고"], ["dispose", "폐기 처리"]],
    assigned: [["repair-start", "수리 접수"], ["lost-report", "분실 신고"], ["dispose", "폐기 처리"]],
    repair: [["repair-done", "수리 완료"], ["lost-report", "분실 신고"], ["dispose", "폐기 처리"]],
    lost: [["lost-recover", "분실 회수"], ["dispose", "폐기 처리"]],
    disposed: [],
  };
  function statusActions(a) {
    if (a.type !== "individual" || !hasAssignPermission(a)) return [];
    return STATUS_TRANSITIONS[a.status].map(([key, label]) => ({ key, label, danger: key === "dispose" }));
  }
  // 배정/보유 관리 액션(상단바 "더보기" → 바텀시트) — 상태 변경류를 제외한 나머지: 재배정·배정 추가·반납
  // (개별형), 수량 변경·보유 대상 추가/해제(수량형), 사진 관리·메모 수정(공통). 폐기되지 않았고 배정/보유
  // 변경 권한이 있는 자산에 한해서만 노출.
  // 메모는 원래 구조설계안 5.5상 "자산 정보 수정"(자산관리 권한 소관, 자산 수정 폼)으로 다른 필드들과 묶여
  // 있었는데, 이 화면(직원모드)에서는 예외적으로 배정/보유 변경 권한 소관으로 재분류(2026-09-26, 사용자
  // 확인) — 지급 이력처럼 배정·보유 흐름과 직접 엮이는 메모가 많아 자산 정보 수정(품목명·구매가 등)과는
  // 성격이 다르다고 판단. 나머지 필드(품목명·구매가격 등)는 여전히 자산관리 권한 소관으로 이 화면 스코프 밖
  function manageActions(a, target) {
    if (a.status === "disposed" || !hasAssignPermission(a)) return [];
    const acts = [];
    if (a.type === "individual") {
      const { idx } = findRecord(a, target);
      const activeCount = (a.assignments || []).length;
      if (idx >= 0) {
        acts.push({ key: "reassign", label: "재배정" });
        acts.push({ key: "return", label: "반납" });
      }
      if (activeCount < 5) acts.push({ key: "assign-add", label: "배정 추가" });
    } else {
      const { idx } = findRecord(a, target);
      const remaining = a.totalQty - (a.stocks || []).reduce((s, x) => s + x.qty, 0);
      if (idx >= 0) {
        acts.push({ key: "qty-change", label: "수량 변경" });
        acts.push({ key: "hold-release", label: "보유 해제", danger: true });
      }
      if (remaining > 0) acts.push({ key: "hold-add", label: "보유 대상 추가" });
    }
    acts.push({ key: "memo-edit", label: "메모 수정" });
    acts.push({ key: "photos", label: "사진 관리" });
    return acts;
  }
  // 바텀시트 — 상태 뱃지·상단바 "더보기"가 공유하는 실 앱 액션시트 패턴(하단에서 올라오는 목록 + 취소).
  // 대시보드는 이 자리에 앵커 드롭다운(statusDropdown/moreDropdown)을 쓰지만, 폰 프레임 목업이라
  // 모바일다운 바텀시트로 재해석
  function openActionSheet(items, onPick) {
    const back = document.createElement("div");
    back.className = "mapp-sheet-back";
    back.innerHTML = `
      <div class="mapp-sheet">
        ${items.map(x => `<button type="button" class="mapp-sheet-row${x.danger ? " danger" : ""}" data-sheet-key="${x.key}">${x.label}</button>`).join("")}
        <button type="button" class="mapp-sheet-cancel" data-sheet-cancel>취소</button>
      </div>`;
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-sheet-cancel]").onclick = () => back.remove();
    back.querySelectorAll("[data-sheet-key]").forEach(b => b.onclick = () => { back.remove(); onPick(b.dataset.sheetKey); });
    document.body.appendChild(back);
  }
  const MORE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>`;
  // 정보 섹션 — 대시보드 자산 상세 왼쪽 카드(dhead-id/dhead-sub/kv2)와 동일한 마크업·CSS 클래스를 그대로
  // 재사용(같은 css/app.css를 공유하는 프로토타입 전역 컨벤션). 배정/보유 현황(다른 배정 대상 전체 목록)은
  // 이 화면에 안 넣음 — 이 카드가 나타내는 건 "이 target의 레코드"라는 스코프를 유지(다른 대상까지 보여주면
  // 대시보드 상세의 배정/보유 현황 섹션을 통째로 옮겨와야 해서 범위가 커짐), 다만 수량형은 전체/보유/잔여
  // 요약 숫자만 뱃지 아래에 덧붙여 "몇 곳에 나뉘어 있는지"는 파악 가능하게 함. QR 라벨은 스코프 밖(필요해지면 추가)
  function assetDetailScreenHtml(a, target) {
    const isIndiv = a.type === "individual";
    const sActs = statusActions(a);
    const mActs = manageActions(a, target);
    const { idx: recIdx } = findRecord(a, target);
    const rec = recIdx >= 0 ? (isIndiv ? a.assignments[recIdx] : a.stocks[recIdx]) : null;
    // 수량형은 "내가(이 target이) 가진 수량"만 보여줌 — 다른 보유 대상들의 수량까지 합친 전체/잔여
    // 요약은 배정현황/보유현황(다른 대상 전체 목록)과 마찬가지로 스코프 밖으로 정리(2026-09-26)
    const statusBadge = isIndiv
      ? (sActs.length
          ? `<button type="button" class="badge ${STATUS_LABEL[a.status][1]} clickable" data-status-open>${STATUS_LABEL[a.status][0]} <span class="bchev">▾</span></button>`
          : `<span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>`)
      : `<span class="badge stock">${rec ? rec.qty : 0}개</span>`;
    const subMeta = `<div>${statusBadge}</div>${
      isIndiv && a.assetNo ? `<div style="margin-top:5px">고유관리번호 <b>${a.assetNo}</b></div>` : ""
    }`;
    const cat = window.DATA.categories.find(c => c.group === a.group && c.sub === a.sub) || {};
    const hiddenFields = cat.hiddenFields || [];
    const kv = [
      { k: "분류", v: `<div><span class="type-pill">${isIndiv ? "개별 자산" : "수량 자산"}</span></div><div style="margin-top:5px">${categoryPath(a)}</div>` },
      { k: "유효기한", field: "expiry", v: expiryBadge(a.expiry) },
      { k: "태그", v: chips(a.labels) },
      isIndiv ? { k: "S/N", field: "serial", v: a.serial || '<span class="muted">—</span>' } : null,
      isIndiv ? { k: "IMEI", field: "imei", v: a.imei || '<span class="muted">—</span>' } : null,
      { k: "제조연월일", field: "manufactured", v: a.manufactured ? window.fmtDate(a.manufactured) : '<span class="muted">—</span>' },
      { k: "구매일", field: "purchaseDate", v: a.purchaseDate ? window.fmtDate(a.purchaseDate) : "—" },
      { k: isIndiv ? "구매가격" : "구매가격 (품목 단가)", field: "purchasePrice", v: a.price ? window.formatPrice(a.price) : "—" },
      { k: "자산 등록일", v: window.fmtDate(a.createdAt) },
      { k: "메모", v: memoHtml(a.note) },
    ].filter(Boolean)
     .filter(row => !row.field || !hiddenFields.includes(row.field))
     .map(({ k, v }) => `<div><div class="k">${k}</div><div class="v">${v}</div></div>`).join("");
    // 대표 이미지 — 사진이 있으면 눌러서 뷰어로 볼 수 있게(조회는 권한과 무관하게 항상 가능), 없으면 그냥 표시만
    const photos = window.assetPhotos(a);
    const heroHtml = photos.length
      ? `<button type="button" class="dhead-thumb-btn" data-hero-viewer aria-label="사진 보기">${cardThumb(a)}</button>`
      : cardThumb(a);
    return `
      <div class="mapp-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        ${mActs.length ? `<button type="button" class="mapp-more" data-more-open aria-label="더보기">${MORE_ICON}</button>` : ""}
      </div>
      <div class="mapp-body">
        <div class="dhead-id">
          ${heroHtml}
          <div>
            <h1>${a.product}</h1>
            <div class="dhead-sub">${subMeta}</div>
          </div>
        </div>
        <div class="dsection">
          <div class="kv2">${kv}</div>
        </div>
      </div>`;
  }

  // 메뉴 화면 — 실 앱 스크린샷 그대로(관리 섹션 마지막에 "자산" 신규 추가, 화살표 없이 바로 이동)
  const MENU_ICON_ASSET = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="m21 16-5-5-9 8"/></svg>`;
  function menuScreenHtml() {
    return `
      <div class="mapp-menu-head">
        <span class="mapp-brand">shopl <b>샤플앤컴퍼니</b></span>
        <span class="mapp-gear">⚙</span>
      </div>
      <div class="mapp-body mapp-menu-body">
        <div class="mapp-menu-cap">비용</div>
        <div class="mapp-menu-row"><span class="mapp-menu-ic">🧾</span>비용 정산</div>
        <div class="mapp-menu-cap">관리</div>
        <div class="mapp-menu-row">
          <span class="mapp-menu-ic">👤</span>구성원<span class="mapp-menu-chev">⌄</span>
        </div>
        <div class="mapp-menu-row">
          <span class="mapp-menu-ic">📍</span>근무지<span class="mapp-menu-chev">⌄</span>
        </div>
        <div class="mapp-menu-row"><span class="mapp-menu-ic">👥</span>그룹</div>
        <div class="mapp-menu-row" data-mapp-goto="assets"><span class="mapp-menu-ic">${MENU_ICON_ASSET}</span>자산</div>
        <div class="mapp-menu-cap">설정 및 결제</div>
        <div class="mapp-menu-row">
          <span class="mapp-menu-ic">⚙</span>회사 설정<span class="mapp-menu-chev">⌄</span>
        </div>
        <div class="mapp-menu-row"><span class="mapp-menu-ic">🔌</span>요금제 및 기능</div>
        <div class="mapp-menu-divider"></div>
        <div class="mapp-menu-row muted"><span class="mapp-menu-ic">🎧</span>고객 센터</div>
      </div>`;
  }

  function tabBarHtml(active) {
    const items = [{ key: "home", ic: "⌂", label: "홈" }, { key: "work", ic: "☑", label: "업무" }, { key: "menu", ic: "☰", label: "메뉴" }];
    return `<div class="mapp-tabbar">${items.map(t =>
      `<button type="button" class="mapp-tab${t.key === active ? " active" : ""}" data-mapp-tab="${t.key}"><span class="mapp-tab-ic">${t.ic}</span>${t.label}</button>`
    ).join("")}</div>`;
  }

  function render() {
    const root = document.getElementById("app");
    const state = { screen: "menu", assetTab: "mine" };

    function draw() {
      // 배정/보유 변경 액션이 window.DATA.assets를 직접 mutate하므로, 목록은 렌더마다 새로 집계
      // (한 번만 계산해 두면 재배정·반납 등으로 바뀐 내용이 목록 화면에 반영되지 않음)
      const items = sortItems(collectMyItems(ME));
      const worksiteGroups = collectWorksiteGroups(ME);
      const showTabBar = state.screen === "menu";
      const screenHtml = state.screen === "menu" ? menuScreenHtml()
        : state.screen === "worksite-detail" ? worksiteDetailScreenHtml(state.wsDetail, state.wsDetailSub, itemsForWorksite(state.wsDetail, state.wsDetailSub))
        : state.screen === "asset-detail" ? assetDetailScreenHtml(assets.find(x => x.id === state.detailAssetId), state.detailTarget)
        : state.assetTab === "mine" ? myAssetsScreenHtml(items) : worksiteAssetsScreenHtml(worksiteGroups);

      root.innerHTML = `
        <div class="mapp-stage">
          <div class="mapp-phone">
            <div class="mapp-statusbar"><span>9:41</span><span class="mapp-statusbar-icons">•••</span></div>
            <div class="mapp-screen">${screenHtml}</div>
            ${showTabBar ? tabBarHtml("menu") : ""}
          </div>
        </div>`;

      const back = root.querySelector("[data-mapp-back]");
      if (back) back.onclick = () => {
        // 자산 상세는 진입 직전 화면(내 자산/근무지 자산/전체보기)으로, 전체보기는 근무지 자산 탭으로,
        // 그 외엔 메뉴로 복귀
        if (state.screen === "asset-detail" && state.detailFrom) { Object.assign(state, state.detailFrom); delete state.detailFrom; }
        else if (state.screen === "worksite-detail") { state.screen = "assets"; state.assetTab = "worksite"; }
        else { state.screen = "menu"; }
        draw();
      };
      // 자산 카드 클릭 → 자산 상세(앱) 이동. target(이 카드가 나타내는 구체적 배정/보유 레코드의 주체)은
      // 화면별로 다름: 내 자산 탭은 ME 본인, 근무지 자산(카드 안 축약 카드)·전체보기는 그 카드가 속한 근무지
      function openDetail(assetId, target) {
        state.detailFrom = { screen: state.screen, assetTab: state.assetTab, wsDetail: state.wsDetail };
        state.screen = "asset-detail";
        state.detailAssetId = assetId;
        state.detailTarget = target;
        draw();
      }
      if (state.screen === "assets" && state.assetTab === "mine") {
        root.querySelectorAll("[data-asset-card]").forEach(el => el.onclick = () => openDetail(el.dataset.assetId, { type: "employee", value: ME }));
      } else if (state.screen === "worksite-detail") {
        root.querySelectorAll("[data-asset-card]").forEach(el => el.onclick = () => openDetail(el.dataset.assetId, { type: "worksite", value: state.wsDetail }));
      } else if (state.screen === "asset-detail") {
        const a = assets.find(x => x.id === state.detailAssetId);
        const target = state.detailTarget;
        function afterMutate() {
          // 반납·재배정(다른 대상으로)·보유 해제·폐기처럼 이 target의 레코드가 더 이상 없어지면 목록으로 복귀
          if (findRecord(a, target).idx < 0) { Object.assign(state, state.detailFrom); delete state.detailFrom; }
          draw();
        }
        function dispatchAction(key) {
          const { idx } = findRecord(a, target);
          if (key === "assign-add") openAssignAddModal(a, afterMutate);
          else if (key === "reassign") openReassignModal(a, idx, afterMutate);
          else if (key === "return") openReturnConfirm(a, idx, afterMutate);
          else if (key === "lost-report") openStatusChangeConfirm(a, "분실 신고하시겠습니까?", "", () => { a.status = "lost"; }, afterMutate);
          else if (key === "lost-recover") openStatusChangeConfirm(a, "분실 회수하시겠습니까?", "", () => { a.status = derivedActiveStatus(a); }, afterMutate);
          else if (key === "repair-start") openStatusChangeConfirm(a, "수리 접수하시겠습니까?", "", () => { a.status = "repair"; }, afterMutate);
          else if (key === "repair-done") openStatusChangeConfirm(a, "수리 완료 처리하시겠습니까?", "", () => { a.status = derivedActiveStatus(a); }, afterMutate);
          else if (key === "dispose") openStatusChangeConfirm(a, "폐기 처리하시겠습니까?", "폐기 처리는 되돌릴 수 없으며, 활성 배정은 자동으로 종료됩니다.", () => { a.status = "disposed"; a.assignments = []; }, afterMutate, true);
          else if (key === "hold-add") openHoldAddModal(a, afterMutate);
          else if (key === "qty-change") openQtyChangeModal(a, idx, afterMutate);
          else if (key === "hold-release") openHoldReleaseConfirm(a, idx, afterMutate);
          else if (key === "memo-edit") openMemoEditModal(a, afterMutate);
          else if (key === "photos") openPhotoManageModal(a, afterMutate);
        }
        // 상태 뱃지 → 상태 변경 바텀시트, 상단바 "더보기" → 배정/보유 관리 바텀시트(대시보드의 뱃지
        // 드롭다운/···메뉴와 같은 진입점, 폰 프레임이라 바텀시트로 재해석)
        const statusOpen = root.querySelector("[data-status-open]");
        if (statusOpen) statusOpen.onclick = () => openActionSheet(statusActions(a), dispatchAction);
        const moreOpen = root.querySelector("[data-more-open]");
        if (moreOpen) moreOpen.onclick = () => openActionSheet(manageActions(a, target), dispatchAction);
        // 대표 이미지 클릭 → 사진 뷰어(조회 전용, 권한과 무관)
        const heroBtn = root.querySelector("[data-hero-viewer]");
        if (heroBtn) heroBtn.onclick = () => openPhotoViewer(a);
      }
      const gotoAssets = root.querySelector('[data-mapp-goto="assets"]');
      if (gotoAssets) gotoAssets.onclick = () => { state.screen = "assets"; state.assetTab = "mine"; draw(); };
      root.querySelectorAll("[data-mapp-asset-tab]").forEach(b => b.onclick = () => {
        state.assetTab = b.dataset.mappAssetTab; draw();
      });
      root.querySelectorAll("[data-mapp-tab]").forEach(b => b.onclick = () => {
        if (b.dataset.mappTab === "menu") { state.screen = "menu"; draw(); }
      });

      // 검색 — category.js와 동일한 hidden 토글 패턴(input 재렌더 없음, 한글 IME 조합 깨짐 방지).
      // 내 자산 탭은 대분류 섹션으로 묶여 있어서, 카드 hidden 토글에 더해 섹션 안에 보이는 카드가 하나도
      // 없으면 그 섹션(헤더 포함)도 같이 숨김(전체보기 등 섹션 없는 화면에선 sections가 빈 배열이라 no-op)
      const searchInput = root.querySelector("[data-mapp-search]");
      if (searchInput) {
        const cards = [...root.querySelectorAll("[data-asset-card]")];
        const sections = [...root.querySelectorAll("[data-cat-section]")];
        const emptyMsg = root.querySelector("[data-mapp-empty]");
        searchInput.addEventListener("input", () => {
          const q = searchInput.value.trim().toLowerCase();
          let anyVisible = false;
          cards.forEach(card => {
            const match = !q || card.textContent.toLowerCase().includes(q);
            card.hidden = !match;
            if (match) anyVisible = true;
          });
          sections.forEach(sec => {
            sec.hidden = ![...sec.querySelectorAll("[data-asset-card]")].some(c => !c.hidden);
          });
          if (emptyMsg) emptyMsg.hidden = anyVisible;
        });
      }
      // 근무지 자산 — 근무지명/코드/주소 검색(카드 단위 hidden 토글)
      const wsSearchInput = root.querySelector("[data-mapp-ws-search]");
      if (wsSearchInput) {
        const wsCards = [...root.querySelectorAll("[data-ws-card]")];
        wsSearchInput.addEventListener("input", () => {
          const q = wsSearchInput.value.trim().toLowerCase();
          wsCards.forEach(card => {
            const hay = `${card.dataset.wsName}${card.dataset.wsCode}${card.dataset.wsAddress}`.toLowerCase();
            card.hidden = !(!q || hay.includes(q));
          });
        });
      }
      // 근무지 카드의 소분류 행 클릭 → 그 근무지·그 소분류의 전체 자산 목록으로 이동
      root.querySelectorAll("[data-ws-cat-open]").forEach(b => b.onclick = () => {
        state.screen = "worksite-detail";
        state.wsDetail = b.dataset.ws;
        state.wsDetailSub = b.dataset.sub;
        draw();
      });
      // 내 자산 대분류 섹션 접기/펼치기 — 근무지 카드와 동일한 패턴(기본 펼침)
      root.querySelectorAll("[data-cat-collapse]").forEach(b => b.onclick = () => {
        const body = b.closest(".mapp-cat-section").querySelector("[data-cat-collapsible]");
        const expanded = b.getAttribute("aria-expanded") === "true";
        b.setAttribute("aria-expanded", String(!expanded));
        body.hidden = expanded;
        b.classList.toggle("collapsed", expanded);
      });
      // 근무지 카드 접기/펼치기 — 기본 펼침, 분류 목록이 접히는 범위
      root.querySelectorAll("[data-ws-collapse]").forEach(b => b.onclick = () => {
        const body = b.closest(".mapp-ws-card").querySelector("[data-ws-collapsible]");
        const expanded = b.getAttribute("aria-expanded") === "true";
        b.setAttribute("aria-expanded", String(!expanded));
        body.hidden = expanded;
        b.classList.toggle("collapsed", expanded);
      });
    }
    draw();
  }

  window.AppScreen = { render };
})();
