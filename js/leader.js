/* 앱 리더모드 — 러프 프로토타입(2026-09-30). 직원모드(app.js)와 달리 "내 자산"이 아니라 조회 권한 범위
   안의 회사 전체 자산을 보는 화면. 이번 라운드 스코프는 메뉴 화면 + 자산 화면(통계 칩 + 목록)만 —
   검색·자산 추가·자산 상세·필터 팝업은 전부 제외(러프 확인용). 이 파일도 다른 화면 파일들과 동일하게
   자기 완결적(상수 중복 정의)이라 app.js/assets.js와 겹치는 부분이 많음 */
(function () {
  const { assets } = window.DATA;
  const TODAY = new Date("2026-09-04");
  // app.js의 toast()와 동일(중복) — .mapp-screen 영역 기준으로 떠서 폰 목업 밖으로 안 나가게
  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    const screen = document.querySelector(".mapp-screen");
    const r = screen ? screen.getBoundingClientRect() : null;
    const pos = r ? `left:${r.left + r.width / 2}px;bottom:${window.innerHeight - r.bottom + 32}px;` : "left:50%;bottom:32px;";
    t.style.cssText = `position:fixed;${pos}transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300;max-width:280px;text-align:center`;
    document.body.appendChild(t); setTimeout(() => t.remove(), 1800);
  }

  // "나" 페르소나 — 리더 1명(김민수)을 고정. 앱 직원모드의 ?me= 같은 전환 기능은 이번 러프 스코프에 없음
  const ME = "김민수";
  // detail.js/app.js의 MEMBERS와 동일 값(이 파일도 자기 완결적이라 중복 유지) — 조회 권한 판정(팀 매칭)에만 씀
  const MEMBER_TEAM = {
    "김민수": "개발팀", "이서연": "디자인팀", "박지훈": "영업팀", "정우성": "CS팀", "김철수": "운영팀",
    "최유진": "개발팀", "한소희": "디자인팀", "장민호": "국내영업", "오세훈": "운영팀", "배수지": "CS팀",
    "윤재현": "해외영업", "임하늘": "개발팀",
  };
  // app.js의 hasViewPermission과 동일 로직(그대로 중복) — 리더모드 자산 화면은 "조회 권한을 가진 자산
  // 전체"가 화면의 정의 그 자체라, 이 판정 함수가 목록 수집의 핵심. 소분류 트리(허브 화면)는 자산이 아니라
  // 카테고리 자체를 걸러야 해서 판정 로직을 catViewPermission(cat)으로 분리하고 hasViewPermission(a)은 그걸 재사용
  function catViewPermission(cat) {
    if (!cat) return false;
    switch (cat.view) {
      case "회사의 모든 구성원": return true;
      case "특정 관리자/리더": return (cat.viewTarget && cat.viewTarget.members || []).includes(ME);
      case "특정 그룹 및 직무/직급": return (cat.viewTarget && cat.viewTarget.groups || []).includes(MEMBER_TEAM[ME]);
      default: return false; // 모든 관리자 및 리더 / 관리자만
    }
  }
  function hasViewPermission(a) {
    return catViewPermission(window.DATA.categories.find(c => c.group === a.group && c.sub === a.sub));
  }
  const STATUS_LABEL = {
    stock: ["재고", "stock"], assigned: ["배정 중", "assigned"], repair: ["수리 중", "repair"],
    lost: ["분실", "lost"], disposed: ["폐기", "disposed"], held: ["보유 중", "assigned"],
  };
  // assets.js의 isDepleted/hasUnheldHolder와 동일(중복) — 수량형 소분류 화면의 "소진"·"미보유대상" 필터에 씀
  function isDepleted(a) {
    return a.type === "quantity" && a.totalQty - (a.stocks || []).reduce((s, x) => s + x.qty, 0) === 0;
  }
  function hasUnheldHolder(a) {
    return a.type === "quantity" && (a.stocks || []).some(x => x.qty === 0);
  }
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
  // 대시보드 "전체" 탭과 동일하게 자산 1건당 한 행(특정 배정/보유 대상 기준이 아님) — 수량형의 qty는
  // 특정 보유자의 보유 수량이 아니라 그 자산의 총 수량(totalQty)
  function collectLeaderItems() {
    return assets.filter(a => hasViewPermission(a)).map(a => ({ asset: a, qty: a.type === "quantity" ? (a.totalQty || 0) : 1 }));
  }
  // 허브 화면용 — 대시보드 분류 관리 화면의 트리와 동일하게, 자산 보유 여부와 무관하게 조회 권한을 가진
  // 소분류를 전부 대분류별로 묶어서 보여줌(2026-09-30 — 유형 칩 제거하면서 "허브는 순수 카테고리 트리"로 단순화).
  // 대분류만 있고 소분류가 아직 없는 경우(window.DATA.emptyGroups, data.js "비품" 샘플)도 대시보드와 동일하게
  // 그 대분류는 노출하고 "소분류 없음"으로 표시(2026-09-30) — 소분류가 없어 권한 체크 대상 자체가 없으니 숨길 이유가 없음
  function categoryTree() {
    const order = [];
    const map = {};
    window.DATA.categories.forEach(c => {
      if (!catViewPermission(c)) return;
      if (!map[c.group]) { map[c.group] = []; order.push(c.group); }
      map[c.group].push(c.sub);
    });
    (window.DATA.emptyGroups || []).forEach(group => {
      if (!map[group]) { map[group] = []; order.push(group); }
    });
    return order.map(group => ({ group, subs: map[group] }));
  }
  function countForSub(sub) { return assets.filter(a => a.sub === sub && hasViewPermission(a)).length; }

  const THUMB_EMPTY = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-4 4 3 4-4 5 4"/></svg>`;
  function cardThumb(a) {
    const photos = window.assetPhotos(a);
    if (photos.length) return `<span class="mapp-thumb" style="background:${photos[a._primary || 0].color}"></span>`;
    return `<span class="mapp-thumb empty">${THUMB_EMPTY}</span>`;
  }
  // 이번 러프 스코프엔 자산 상세·사진 뷰어가 없어 썸네일은 클릭 동작 없이 그냥 보여주기만 함(app.js의
  // cardThumbBtn과 달리 버튼이 아님)
  function assetCardHtml(x) {
    const a = x.asset;
    if (a.type === "individual") {
      return `
        <div class="mapp-card">
          ${cardThumb(a)}
          <div class="mapp-card-body">
            <div class="mapp-card-title">${a.product}</div>
            <div class="mapp-card-sub">${a.assetNo || "—"}</div>
          </div>
          <span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>
        </div>`;
    }
    return `
      <div class="mapp-card">
        ${cardThumb(a)}
        <div class="mapp-card-body">
          <div class="mapp-card-title">${a.product}</div>
        </div>
        <span class="badge stock">${x.qty}개</span>
      </div>`;
  }

  const MENU_ICON_ASSET = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="m21 16-5-5-9 8"/></svg>`;
  const IC_FILTER = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h16M8 12h8M11 18h2"/></svg>`;
  const CHEV_DOWN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>`;

  // 메뉴 화면 — 실 앱 스크린샷 참고(직원모드와 달리 "비용" 섹션 없음, 맨 위에 "승인" 섹션 추가, 관리
  // 섹션 맨 하단에 직원모드와 동일하게 "자산" 추가). 하단 "Powered by shopl"도 참고 이미지 그대로 재현
  function menuScreenHtml() {
    return `
      <div class="mapp-menu-head">
        <span class="mapp-brand">shopl <b>샤플앤컴퍼니</b></span>
        <span class="mapp-gear">⚙</span>
      </div>
      <div class="mapp-body mapp-menu-body">
        <div class="mapp-menu-cap">승인</div>
        <div class="mapp-menu-row"><span class="mapp-menu-ic">📋</span>승인<span class="mapp-dot-badge"></span></div>
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
        <div class="mapp-menu-footer">Powered by <b>shopl</b></div>
      </div>`;
  }

  // 하단 탭바 — 직원모드는 "업무"지만 리더모드는 "승인"(빨간 점 뱃지 포함). 이번 스코프는 "메뉴"만 실제로
  // 동작하고 "홈"·"승인"은 자리만(클릭해도 아무 동작 없음)
  function tabBarHtml(active) {
    const items = [
      { key: "home", ic: "⌂", label: "홈" },
      { key: "approval", ic: "☑", label: "승인", dot: true },
      { key: "menu", ic: "☰", label: "메뉴" },
    ];
    return `<div class="mapp-tabbar">${items.map(t =>
      `<button type="button" class="mapp-tab${t.key === active ? " active" : ""}" data-mapp-tab="${t.key}">
        <span class="mapp-tab-ic">${t.ic}${t.dot ? '<span class="mapp-dot-badge"></span>' : ""}</span>${t.label}
      </button>`
    ).join("")}</div>`;
  }

  // 자산 화면(허브) — 대시보드 분류 관리 화면의 트리처럼 조회 권한 가진 대분류·소분류를 전부 보여주기만
  // 하고, 소분류를 눌러야 실제 목록(소분류 상세 화면)으로 드릴다운(2026-09-30 — 유형 칩까지 없애고 순수
  // 카테고리 탐색 화면으로 단순화. 카드가 보이는 곳은 소분류 상세 화면 하나뿐이라는 규칙은 그대로)
  function assetsScreenHtml() {
    const groups = categoryTree();
    return `
      <div class="mapp-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        <span class="mapp-topbar-title">자산</span>
      </div>
      <div class="mapp-body">
        ${groups.length ? groups.map(g => `
          <button type="button" class="mapp-menu-cap mapp-tree-group-head" data-tree-collapse aria-expanded="true" aria-label="접기/펼치기">
            <span>${g.group}</span>${CHEV_DOWN}
          </button>
          <div class="mapp-ws-cat-tree" data-tree-collapsible>${g.subs.length ? g.subs.map(sub => `
            <button type="button" class="mapp-ws-cat-row" data-sub-open data-sub="${sub}">
              <span>${sub}</span>
              <span class="mapp-ws-cat-count">${countForSub(sub)}<span class="mapp-menu-chev">›</span></span>
            </button>`).join("") : `<p class="mapp-ws-empty">소분류 없음</p>`}</div>`).join("")
          : `<p class="mapp-ws-empty">조회 가능한 자산이 없습니다.</p>`}
      </div>`;
  }
  // 소분류 상세 화면 — 카드가 실제로 보이는 유일한 화면. 소분류가 정해지면 자산 유형도 자동으로 정해지므로
  // (한 소분류는 개별형·수량형 중 하나만) 그 유형에 맞는 상태 칩을 바로 노출(개별형: 재고/분실/수리 중,
  // 수량형: 재고/소진/미보유대상). 상태 칩은 다시 눌러도 해제 안 되고, 적용된 필터 칩의 ✕로만 해제(대시보드
  // 필터바와 동일 규칙, 2026-09-30). 필터 아이콘은 이번 스코프에선 자리만(팝업 미구현)
  const INDIV_STATUS_CHIPS = [["stock", "재고"], ["lost", "분실"], ["repair", "수리 중"]];
  const QTY_STATUS_CHIPS = [["stock", "재고"], ["depleted", "소진"], ["unheld", "미보유대상"]];
  function statusLabel(key, chips) { return (chips.find(c => c[0] === key) || [])[1] || ""; }
  function matchesStatus(a, type, statusFilter) {
    if (!statusFilter) return true;
    if (type === "individual") return a.status === statusFilter;
    if (statusFilter === "stock") return a.status === "stock";
    if (statusFilter === "depleted") return isDepleted(a);
    if (statusFilter === "unheld") return hasUnheldHolder(a);
    return true;
  }
  function subDetailScreenHtml(sub, statusFilter) {
    const cat = window.DATA.categories.find(c => c.sub === sub) || {};
    const type = cat.type || "individual";
    const statusChips = type === "individual" ? INDIV_STATUS_CHIPS : QTY_STATUS_CHIPS;
    const items = sortItems(collectLeaderItems()).filter(x => x.asset.sub === sub && matchesStatus(x.asset, type, statusFilter));
    return `
      <div class="mapp-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        <span class="mapp-topbar-title">${cat.group || ""} <span class="mapp-cat-sep">›</span> ${sub}</span>
        <button type="button" class="mapp-topbar-filter" data-filter-placeholder aria-label="필터">${IC_FILTER}</button>
      </div>
      <div class="mapp-body">
        <div class="mapp-chip-row">${statusChips.map(([k, l]) =>
          `<button type="button" class="mapp-chip${k === statusFilter ? " active" : ""}" data-status-chip="${k}">${l}</button>`).join("")}</div>
        ${statusFilter ? `<div class="filterbar"><span class="fchip">${statusLabel(statusFilter, statusChips)}<button type="button" data-status-clear>✕</button></span></div>` : ""}
        <div class="mapp-count">전체 <b>${items.length}</b></div>
        ${items.length ? `<div class="mapp-card-list">${items.map(x => assetCardHtml(x)).join("")}</div>` : `<p class="mapp-ws-empty">조회 가능한 자산이 없습니다.</p>`}
      </div>`;
  }

  function render() {
    const root = document.getElementById("app");
    const state = { screen: "menu", sub: null, statusFilter: null };

    function draw() {
      const showTabBar = state.screen === "menu";
      const screenHtml = state.screen === "menu" ? menuScreenHtml()
        : state.screen === "sub-detail" ? subDetailScreenHtml(state.sub, state.statusFilter)
        : assetsScreenHtml();
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
        // 소분류 상세 → 자산 허브, 그 외엔 메뉴로 복귀
        if (state.screen === "sub-detail") { state.screen = "assets"; state.sub = null; state.statusFilter = null; }
        else { state.screen = "menu"; }
        draw();
      };
      const gotoAssets = root.querySelector('[data-mapp-goto="assets"]');
      if (gotoAssets) gotoAssets.onclick = () => { state.screen = "assets"; draw(); };
      root.querySelectorAll("[data-mapp-tab]").forEach(b => b.onclick = () => {
        // "홈"·"승인" 탭은 이번 러프 스코프 밖이라 동작 없음(메뉴만 실제 이동)
        if (b.dataset.mappTab === "menu") { state.screen = "menu"; draw(); }
      });
      // 소분류 행 탭 → 소분류 상세(드릴다운)로 진입, 상태 필터는 매번 깨끗하게 시작
      root.querySelectorAll("[data-sub-open]").forEach(b => b.onclick = () => {
        state.screen = "sub-detail";
        state.sub = b.dataset.sub;
        state.statusFilter = null;
        draw();
      });
      // 대분류 접기/펼치기 — 기본 펼침(app.js의 내 자산 대분류 섹션과 동일한 패턴), DOM만 직접 토글하고 재렌더 안 함
      root.querySelectorAll("[data-tree-collapse]").forEach(b => b.onclick = () => {
        const body = b.nextElementSibling;
        const expanded = b.getAttribute("aria-expanded") === "true";
        b.setAttribute("aria-expanded", String(!expanded));
        body.hidden = expanded;
        b.classList.toggle("collapsed", expanded);
      });
      // 상태 칩 — 다시 눌러도 해제 안 됨(대시보드 필터바 규칙과 동일), 해제는 적용된 필터 칩의 ✕로만
      root.querySelectorAll("[data-status-chip]").forEach(b => b.onclick = () => { state.statusFilter = b.dataset.statusChip; draw(); });
      const statusClear = root.querySelector("[data-status-clear]");
      if (statusClear) statusClear.onclick = () => { state.statusFilter = null; draw(); };
      // 필터 아이콘은 이번 스코프엔 자리만 — 팝업은 다음 라운드(직원모드 드릴다운 화면과 공용으로 검토)
      const filterBtn = root.querySelector("[data-filter-placeholder]");
      if (filterBtn) filterBtn.onclick = () => toast("필터 — 이후 단계에서 정의");
    }
    draw();
  }

  window.LeaderScreen = { render };
})();
