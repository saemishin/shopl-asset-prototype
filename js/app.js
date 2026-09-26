/* 앱 직원모드 — 화면 중앙에 폰 프레임으로 띄우는 목업. 메뉴 화면(관리 섹션 마지막에 자산 추가) + 자산 화면
   (내 자산·근무지 자산 탭 둘 다 구현). 근무지 카드의 "전체보기"(그 근무지 전체 목록)와 자산 상세는 다음
   라운드로 보류. 실 앱 화면(근무지 목록/보고서/게시판/근무지 상세 정보탭의 "더보기" 카드 패턴)을 참고해
   리스트 화면 공통 요소(검색·전체 카운트·카드 리스트·최대 N개+더보기)를 재현. */
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
    lost: ["분실", "lost"], disposed: ["폐기", "disposed"],
  };
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
  // 근무지 자산 — 이 구성원의 고정+담당 근무지 각각에 배정(개별형)·보유(수량형)된 자산을 모음.
  // 카드 정렬: 고정 근무지가 항상 최상단, 담당 근무지는 근무지명 가나다순(member-detail.js collectItems와
  // 동일한 자산 수집 로직을 근무지 기준으로 적용)
  function collectWorksiteGroups(name) {
    const { fixed, assigned } = myWorksites(name);
    const assignedSorted = [...assigned].sort((a, b) => a.localeCompare(b, "ko"));
    const worksites = [{ ws: fixed, label: "fixed" }, ...assignedSorted.map(ws => ({ ws, label: "assigned" }))];
    return worksites.map(({ ws, label }) => {
      const items = [];
      assets.forEach(a => {
        if (a.type === "individual") {
          (a.assignments || []).forEach(x => { if (x.worksite === ws) items.push({ qty: 1, asset: a }); });
        } else {
          (a.stocks || []).forEach(x => { if (x.worksite === ws) items.push({ qty: x.qty, asset: a }); });
        }
      });
      return { worksite: ws, label, items: sortItems(items) };
    });
  }

  const THUMB_EMPTY = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-4 4 3 4-4 5 4"/></svg>`;
  function cardThumb(a) {
    const photos = window.assetPhotos(a);
    if (photos.length) return `<span class="mapp-thumb" style="background:${photos[a._primary || 0].color}"></span>`;
    return `<span class="mapp-thumb empty">${THUMB_EMPTY}</span>`;
  }
  // 카드 구성 확정: 대표 이미지 / 품목명 / 고유관리번호(개별형) / 상태 뱃지(개별형) 또는 보유 수량(수량형) —
  // 분류 등 나머지 정보는 자산 상세(다음 라운드)에서 확인하는 것으로 스코프 아웃.
  // compact=true면 근무지 카드 안에 중첩되는 축약 행(테두리 없이 리스트 안에서 나열)
  function assetCardHtml(x, compact) {
    const a = x.asset;
    const cls = compact ? "mapp-card mapp-card-compact" : "mapp-card";
    if (a.type === "individual") {
      return `
        <div class="${cls}" data-asset-card>
          ${cardThumb(a)}
          <div class="mapp-card-body">
            <div class="mapp-card-title">${a.product}</div>
            <div class="mapp-card-sub">${a.assetNo || "—"}</div>
          </div>
          <span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>
        </div>`;
    }
    return `
      <div class="${cls}" data-asset-card>
        ${cardThumb(a)}
        <div class="mapp-card-body">
          <div class="mapp-card-title">${a.product}</div>
        </div>
        <span class="badge stock">${x.qty}개</span>
      </div>`;
  }

  // 상단 탭 UI — 실 서비스 패턴(선택된 탭은 라벨이 있는 넓은 필, 비선택 탭은 아이콘만 있는 작은 정사각형)
  function assetTabsHtml(active) {
    const mineActive = active === "mine";
    return `
      <div class="mapp-seg-tabs">
        <button type="button" class="mapp-seg-tab${mineActive ? " active" : " icon-only"}" data-mapp-asset-tab="mine" aria-label="내 자산">${mineActive ? "내 자산" : IC_PERSON}</button>
        <button type="button" class="mapp-seg-tab${!mineActive ? " active" : " icon-only"}" data-mapp-asset-tab="worksite" aria-label="근무지 자산">${!mineActive ? "근무지 자산" : IC_WORKSITE}</button>
      </div>`;
  }

  function myAssetsScreenHtml(items) {
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
          <div class="mapp-card-list" data-mapp-card-list>${items.map(x => assetCardHtml(x)).join("")}</div>
          <p class="mapp-empty" data-mapp-empty hidden>결과가 없습니다.</p>
        ` : `<p class="mapp-empty">배정·보유 중인 자산이 없습니다.</p>`}
      </div>`;
  }
  // 근무지 카드 안에 자산을 최대 5개까지만 보여주고, 초과하면 "전체보기"로 그 근무지의 전체 목록으로
  // 이동(다음 라운드에서 구현 — 지금은 안내만). 고정/담당 라벨은 참고 이미지대로 불릿(●)만, 아이콘 없음.
  // 카드마다 접기/펼치기 가능(기본 펼침) — 자산 목록+전체보기 버튼이 접히는 범위
  const WS_LABEL = { fixed: "● 고정 근무지", assigned: "● 담당 근무지" };
  const WS_CARD_MAX = 5;
  const CHEV_DOWN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>`;
  function worksiteCardHtml(group) {
    const shown = group.items.slice(0, WS_CARD_MAX);
    const rest = group.items.length - WS_CARD_MAX;
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
        <div class="mapp-ws-count">전체 <b>${group.items.length}</b></div>
        <div data-ws-collapsible>
          ${group.items.length ? `
            <div class="mapp-ws-assets">${shown.map(x => assetCardHtml(x, true)).join("")}</div>
            ${rest > 0 ? `<button type="button" class="mapp-ws-viewall" data-ws-viewall="${group.worksite}">전체보기</button>` : ""}
          ` : `<p class="mapp-ws-empty">배정·보유 중인 자산이 없습니다.</p>`}
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
    const items = sortItems(collectMyItems(ME));
    const worksiteGroups = collectWorksiteGroups(ME);

    function draw() {
      const showTabBar = state.screen === "menu";
      const screenHtml = state.screen === "menu"
        ? menuScreenHtml()
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
      if (back) back.onclick = () => { state.screen = "menu"; draw(); };
      const gotoAssets = root.querySelector('[data-mapp-goto="assets"]');
      if (gotoAssets) gotoAssets.onclick = () => { state.screen = "assets"; state.assetTab = "mine"; draw(); };
      root.querySelectorAll("[data-mapp-asset-tab]").forEach(b => b.onclick = () => {
        state.assetTab = b.dataset.mappAssetTab; draw();
      });
      root.querySelectorAll("[data-mapp-tab]").forEach(b => b.onclick = () => {
        if (b.dataset.mappTab === "menu") { state.screen = "menu"; draw(); }
      });

      // 검색 — category.js와 동일한 hidden 토글 패턴(input 재렌더 없음, 한글 IME 조합 깨짐 방지)
      const searchInput = root.querySelector("[data-mapp-search]");
      if (searchInput) {
        const cards = [...root.querySelectorAll("[data-asset-card]")];
        const emptyMsg = root.querySelector("[data-mapp-empty]");
        searchInput.addEventListener("input", () => {
          const q = searchInput.value.trim().toLowerCase();
          let anyVisible = false;
          cards.forEach(card => {
            const match = !q || card.textContent.toLowerCase().includes(q);
            card.hidden = !match;
            if (match) anyVisible = true;
          });
          if (emptyMsg) emptyMsg.hidden = anyVisible;
        });
      }
      // 근무지 자산 — 근무지명/코드/주소 검색(카드 단위 hidden 토글), "전체보기"는 다음 라운드 구현 예정이라 안내만
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
      root.querySelectorAll("[data-ws-viewall]").forEach(b => b.onclick = () => {
        toast(`"${b.dataset.wsViewall}" 전체 목록 — 다음 라운드에서 구현 예정`);
      });
      // 근무지 카드 접기/펼치기 — 기본 펼침, 자산 목록+전체보기 버튼이 접히는 범위
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
