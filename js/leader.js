/* 앱 리더모드 — 러프 프로토타입(2026-09-30). 직원모드(app.js)와 달리 "내 자산"이 아니라 조회 권한 범위
   안의 회사 전체 자산을 보는 화면. 이번 라운드 스코프는 메뉴 화면 + 자산 화면(통계 칩 + 목록)만 —
   검색·자산 추가·자산 상세·필터 팝업은 전부 제외(러프 확인용). 이 파일도 다른 화면 파일들과 동일하게
   자기 완결적(상수 중복 정의)이라 app.js/assets.js와 겹치는 부분이 많음 */
(function () {
  const { assets } = window.DATA;
  const TODAY = new Date("2026-09-04");

  // "나" 페르소나 — 리더 1명(김민수)을 고정. 앱 직원모드의 ?me= 같은 전환 기능은 이번 러프 스코프에 없음
  const ME = "김민수";
  // detail.js/app.js의 MEMBERS와 동일 값(이 파일도 자기 완결적이라 중복 유지) — 조회 권한 판정(팀 매칭)에만 씀
  const MEMBER_TEAM = {
    "김민수": "개발팀", "이서연": "디자인팀", "박지훈": "영업팀", "정우성": "CS팀", "김철수": "운영팀",
    "최유진": "개발팀", "한소희": "디자인팀", "장민호": "국내영업", "오세훈": "운영팀", "배수지": "CS팀",
    "윤재현": "해외영업", "임하늘": "개발팀",
  };
  // app.js의 hasViewPermission과 동일 로직(그대로 중복) — 리더모드 자산 화면은 "조회 권한을 가진 자산
  // 전체"가 화면의 정의 그 자체라, 이 판정 함수가 목록 수집의 핵심
  function hasViewPermission(a) {
    const cat = window.DATA.categories.find(c => c.group === a.group && c.sub === a.sub);
    if (!cat) return false;
    switch (cat.view) {
      case "회사의 모든 구성원": return true;
      case "특정 관리자/리더": return (cat.viewTarget && cat.viewTarget.members || []).includes(ME);
      case "특정 그룹 및 직무/직급": return (cat.viewTarget && cat.viewTarget.groups || []).includes(MEMBER_TEAM[ME]);
      default: return false; // 모든 관리자 및 리더 / 관리자만
    }
  }
  const STATUS_LABEL = {
    stock: ["재고", "stock"], assigned: ["배정 중", "assigned"], repair: ["수리 중", "repair"],
    lost: ["분실", "lost"], disposed: ["폐기", "disposed"], held: ["보유 중", "assigned"],
  };
  // assets.js의 expiryKey/EXP_LABEL과 동일(중복) — 통계 칩이 이 4개 상태 기준
  const EXP_LABEL = { valid: "유효", soon: "만료 예정", over: "만료", none: "미설정" };
  function expiryKey(d) {
    if (!d) return "none";
    const days = Math.ceil((new Date(d) - TODAY) / 86400000);
    return days < 0 ? "over" : days <= 7 ? "soon" : "valid";
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
  function groupItemsBySub(items) {
    const order = [];
    const map = {};
    items.forEach(x => {
      const s = x.asset.sub;
      if (!map[s]) { map[s] = []; order.push(s); }
      map[s].push(x);
    });
    return order.map(sub => ({ sub, group: map[sub][0].asset.group, items: map[sub] }));
  }
  // 대시보드 "전체" 탭과 동일하게 자산 1건당 한 행(특정 배정/보유 대상 기준이 아님) — 수량형의 qty는
  // 특정 보유자의 보유 수량이 아니라 그 자산의 총 수량(totalQty)
  function collectLeaderItems() {
    return assets.filter(a => hasViewPermission(a)).map(a => ({ asset: a, qty: a.type === "quantity" ? (a.totalQty || 0) : 1 }));
  }

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

  const CHEV_DOWN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>`;
  const MENU_ICON_ASSET = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="m21 16-5-5-9 8"/></svg>`;

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

  // 통계 칩 — "전체"는 그룹 뷰(소분류 섹션, 기본 접힘), 나머지 4개(유효/만료 예정/만료/미설정)는 그
  // 조건에 맞는 자산만 그룹 없이 flat하게 보여주고 위에 소분류별 분포 카드를 얹음
  function statChipsHtml(active) {
    const chips = [{ k: "all", l: "전체" }, { k: "valid", l: "유효" }, { k: "soon", l: "만료 예정" }, { k: "over", l: "만료" }, { k: "none", l: "미설정" }];
    return `<div class="mapp-chip-row">${chips.map(c =>
      `<button type="button" class="mapp-chip${c.k === active ? " active" : ""}" data-chip="${c.k}">${c.l}</button>`).join("")}</div>`;
  }
  function statDetailHtml(items, chip) {
    if (chip === "all") return "";
    const bySub = groupItemsBySub(items);
    const rows = bySub.map(sec => `<div class="mapp-stat-row"><span>${sec.group} <span class="mapp-cat-sep">›</span> ${sec.sub}</span><b>${sec.items.length}</b></div>`).join("");
    return `
      <div class="mapp-stat-card">
        <div class="mapp-stat-card-head">${EXP_LABEL[chip]} 자산 <b>${items.length}</b>건</div>
        ${items.length ? `<div class="mapp-stat-card-body">${rows}</div>` : `<p class="mapp-stat-empty">해당하는 자산이 없습니다.</p>`}
      </div>`;
  }
  function assetsScreenHtml(chip) {
    const allItems = sortItems(collectLeaderItems());
    const filtered = chip === "all" ? allItems : allItems.filter(x => expiryKey(x.asset.expiry) === chip);
    const sections = chip === "all" ? groupItemsBySub(allItems) : [];
    const listHtml = !filtered.length ? `<p class="mapp-ws-empty">조회 가능한 자산이 없습니다.</p>`
      : chip === "all"
        ? `<div data-mapp-card-list>${sections.map(sec => `
            <div class="mapp-cat-section" data-cat-section>
              <button type="button" class="mapp-cat-section-head collapsed" data-cat-collapse aria-expanded="false" aria-label="접기/펼치기">
                <span>${sec.group} <span class="mapp-cat-sep">›</span> ${sec.sub}</span>
                <span class="mapp-cat-section-count">${sec.items.length}</span>
                ${CHEV_DOWN}
              </button>
              <div class="mapp-card-list" data-cat-collapsible hidden>${sec.items.map(x => assetCardHtml(x)).join("")}</div>
            </div>`).join("")}</div>`
        : `<div class="mapp-card-list">${filtered.map(x => assetCardHtml(x)).join("")}</div>`;
    return `
      <div class="mapp-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        <span class="mapp-topbar-title">자산</span>
      </div>
      <div class="mapp-body">
        ${statChipsHtml(chip)}
        ${statDetailHtml(filtered, chip)}
        <div class="mapp-count">전체 <b>${filtered.length}</b></div>
        ${listHtml}
      </div>`;
  }

  function render() {
    const root = document.getElementById("app");
    const state = { screen: "menu", chip: "all" };

    function draw() {
      const showTabBar = state.screen === "menu";
      const screenHtml = state.screen === "menu" ? menuScreenHtml() : assetsScreenHtml(state.chip);
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
      if (gotoAssets) gotoAssets.onclick = () => { state.screen = "assets"; state.chip = "all"; draw(); };
      root.querySelectorAll("[data-mapp-tab]").forEach(b => b.onclick = () => {
        // "홈"·"승인" 탭은 이번 러프 스코프 밖이라 동작 없음(메뉴만 실제 이동)
        if (b.dataset.mappTab === "menu") { state.screen = "menu"; draw(); }
      });
      root.querySelectorAll("[data-chip]").forEach(b => b.onclick = () => { state.chip = b.dataset.chip; draw(); });
      root.querySelectorAll("[data-cat-collapse]").forEach(b => b.onclick = () => {
        const body = b.closest(".mapp-cat-section").querySelector("[data-cat-collapsible]");
        const expanded = b.getAttribute("aria-expanded") === "true";
        b.setAttribute("aria-expanded", String(!expanded));
        body.hidden = expanded;
        b.classList.toggle("collapsed", expanded);
      });
    }
    draw();
  }

  window.LeaderScreen = { render };
})();
