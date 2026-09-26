/* 앱 직원모드 — 화면 중앙에 폰 프레임으로 띄우는 목업. 이번 스코프: 메뉴 화면(관리 섹션 마지막에 자산 추가)
   + 자산 화면의 "내 자산" 탭만 실제 구현. "근무지 자산" 탭·자산 상세는 다음 라운드로 보류(탭은 눌리지만
   빈 상태). 실 앱 화면(근무지 목록/보고서/게시판) 스크린샷을 참고해 리스트 화면 공통 패턴(검색·전체 카운트·
   카드 리스트)을 재현. */
(function () {
  const { assets } = window.DATA;
  const STATUS_LABEL = {
    stock: ["재고", "stock"], assigned: ["배정 중", "assigned"], repair: ["수리 중", "repair"],
    lost: ["분실", "lost"], disposed: ["폐기", "disposed"],
  };
  // "나" 페르소나 — 구성원 상세와 동일하게 더미 중 한 명을 기본값으로(?me= 쿼리로 다른 사람도 테스트 가능)
  const ME = new URLSearchParams(location.search).get("me") || "김민수";

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

  const THUMB_EMPTY = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-4 4 3 4-4 5 4"/></svg>`;
  function cardThumb(a) {
    const photos = window.assetPhotos(a);
    if (photos.length) return `<span class="mapp-thumb" style="background:${photos[a._primary || 0].color}"></span>`;
    return `<span class="mapp-thumb empty">${THUMB_EMPTY}</span>`;
  }
  // 카드 구성 확정: 대표 이미지 / 품목명 / 고유관리번호(개별형) / 상태 뱃지(개별형) 또는 보유 수량(수량형) —
  // 분류 등 나머지 정보는 자산 상세(다음 라운드)에서 확인하는 것으로 스코프 아웃
  function assetCardHtml(x) {
    const a = x.asset;
    if (a.type === "individual") {
      return `
        <div class="mapp-card" data-asset-card>
          ${cardThumb(a)}
          <div class="mapp-card-body">
            <div class="mapp-card-title">${a.product}</div>
            <div class="mapp-card-sub">${a.assetNo || "—"}</div>
          </div>
          <span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>
        </div>`;
    }
    return `
      <div class="mapp-card" data-asset-card>
        ${cardThumb(a)}
        <div class="mapp-card-body">
          <div class="mapp-card-title">${a.product}</div>
        </div>
        <span class="badge stock">${x.qty}개</span>
      </div>`;
  }

  function myAssetsScreenHtml(items) {
    return `
      <div class="mapp-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        <span class="mapp-topbar-title">자산</span>
      </div>
      <div class="mapp-asset-tabs">
        <button type="button" class="mapp-asset-tab active" data-mapp-asset-tab="mine">내 자산</button>
        <button type="button" class="mapp-asset-tab" data-mapp-asset-tab="worksite">근무지 자산</button>
      </div>
      <div class="mapp-body">
        <div class="mapp-search">
          <input type="text" data-mapp-search placeholder="품목명/고유관리번호">
        </div>
        <div class="mapp-count">전체 <b>${items.length}</b></div>
        ${items.length ? `
          <div class="mapp-card-list" data-mapp-card-list>${items.map(assetCardHtml).join("")}</div>
          <p class="mapp-empty" data-mapp-empty hidden>결과가 없습니다.</p>
        ` : `<p class="mapp-empty">배정·보유 중인 자산이 없습니다.</p>`}
      </div>`;
  }
  function worksiteAssetsPlaceholderHtml() {
    return `
      <div class="mapp-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        <span class="mapp-topbar-title">자산</span>
      </div>
      <div class="mapp-asset-tabs">
        <button type="button" class="mapp-asset-tab" data-mapp-asset-tab="mine">내 자산</button>
        <button type="button" class="mapp-asset-tab active" data-mapp-asset-tab="worksite">근무지 자산</button>
      </div>
      <div class="mapp-body">
        <div class="mdetail-placeholder" style="margin-top:16px">이 탭은 다음 라운드에서 구현 예정</div>
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

    function draw() {
      const showTabBar = state.screen === "menu";
      const screenHtml = state.screen === "menu"
        ? menuScreenHtml()
        : state.assetTab === "mine" ? myAssetsScreenHtml(items) : worksiteAssetsPlaceholderHtml();

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
    }
    draw();
  }

  window.AppScreen = { render };
})();
