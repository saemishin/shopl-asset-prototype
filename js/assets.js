/* 현황 탭 — 자산 목록 (진입 화면) */
(function () {
  const TODAY = new Date("2026-09-04");
  const { assets } = window.DATA;

  const STATUS_LABEL = {
    stock: ["재고", "stock"], assigned: ["배정 중", "assigned"], repair: ["수리 중", "repair"],
    lost: ["분실", "lost"], disposed: ["폐기", "disposed"],
  };
  const STATUS_ORDER = ["stock", "assigned", "repair", "lost", "disposed"];
  const TYPE_LABEL = { individual: "개별 자산", quantity: "수량 자산" };
  const EXP_LABEL = { valid: "유효", soon: "만료 예정", over: "만료", none: "미설정" };
  const RESET_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 1 2.64 6.36"/><path d="M3 20v-6h6"/></svg>`;
  const SORT_ASC_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>`;
  const SORT_DESC_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>`;
  // 정렬 기준별 기본 방향: 날짜(등록일·유효기한)는 최신순(desc), 문자열(제품명·고유관리번호)은 가나다순(asc)
  const SORT_FIELDS = [
    { k: "assetNo", label: "고유 관리번호", defDir: "asc" },
    { k: "product", label: "제품명", defDir: "asc" },
    { k: "expiry", label: "유효기한", defDir: "desc" },
    { k: "createdAt", label: "자산 등록일", defDir: "desc" },
  ];

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
  function holderText(a) {
    if (a.type === "individual") {
      const as = a.assignments || [];
      if (!as.length) return '<span class="muted">재고</span>';
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
    // 수량 자산도 개별 자산과 동일한 패턴(보유처 이름, 총 개수 미표기)으로 통일
    const stocks = a.stocks || [];
    if (!stocks.length) return '<span class="muted">재고</span>';
    // 상세 페이지 보유 현황 카드와 동일하게 이름 가나다순
    const sorted = [...stocks].sort((p, q) => (p.employee || p.worksite).localeCompare(q.employee || q.worksite, "ko"));
    const targets = sorted.map(x => x.employee ? `${IC_EMP}${x.employee}` : `${IC_WS}${x.worksite}`);
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

  const state = {
    view: "all",
    search: "",
    page: 1,
    pageSize: 20,
    sort: { key: "createdAt", dir: "desc" },
    filters: { category: [], type: [], status: [], expiry: [], labels: [], note: [], labelMode: "or" },
  };
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
      if (key === "product" || key === "assetNo") return va.localeCompare(vb, "ko") * mul;
      return (va < vb ? -1 : va > vb ? 1 : 0) * mul;
    });
  }
  function emptyFilters() {
    return { category: [], type: [], status: [], expiry: [], labels: [], note: [], labelMode: "or" };
  }

  function getFiltered() {
    const f = state.filters;
    const q = state.search.trim().toLowerCase();
    return assets.filter(a => {
      if (f.category.length && !f.category.includes(`${a.group}/${a.sub}`)) return false;
      if (f.type.length && !f.type.includes(a.type)) return false;
      if (f.status.length) {
        if (a.type !== "individual") return false;
        if (!f.status.includes(a.status)) return false;
      }
      if (f.expiry.length && !f.expiry.includes(expiryKey(a.expiry))) return false;
      if (f.note.length && !f.note.includes(a.note ? "has" : "none")) return false;
      if (f.labels.length) {
        const has = f.labels.filter(l => (a.labels || []).includes(l));
        if (f.labelMode === "and" ? has.length !== f.labels.length : has.length === 0) return false;
      }
      if (q && !(`${a.product} ${a.assetNo || ""}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }
  function activeFilterCount() {
    const f = state.filters;
    return f.category.length + f.type.length + f.status.length + f.expiry.length + f.labels.length + f.note.length;
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
      <th>고유관리번호</th><th>제품명</th><th>분류</th>
      ${thFilter("자산 유형", "type")}${thFilter("상태", "status")}
      <th>배정·보유 현황</th>${thFilter("유효기한", "expiry")}<th>태그</th>${thFilter("메모", "note", "c")}<th>등록일</th></tr>`;
    const rows = pageSlice(sortList(list)).map(a => {
      const st = a.type === "quantity"
        ? '<span class="muted">—</span>'
        : `<span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>`;
      return `<tr class="clickable" data-id="${a.id}">
        <td>${a.assetNo || '<span class="muted">—</span>'}</td>
        <td>${prodCell(a)}</td>
        <td>${a.group} <span class="muted">›</span> ${a.sub}</td>
        <td><span class="type-pill">${TYPE_LABEL[a.type]}</span></td>
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

  function view_product(list) {
    const map = new Map();
    list.forEach(a => {
      const key = a.sub + "|" + a.product;
      if (!map.has(key)) map.set(key, { product: a.product, group: a.group, sub: a.sub, type: a.type, list: [] });
      map.get(key).list.push(a);
    });
    const head = `<tr><th>제품명</th><th>분류</th><th>자산 유형</th><th class="num">자산 수</th>
      <th>상태 분포</th><th class="num">총 수량</th></tr>`;
    const groups = [...map.values()];
    const rows = pageSlice(groups).map(g => {
      let dist = "—", totalQty = "—";
      if (g.type === "individual") {
        const c = {};
        g.list.forEach(a => c[a.status] = (c[a.status] || 0) + 1);
        dist = STATUS_ORDER.filter(k => c[k]).map(k => `${STATUS_LABEL[k][0]} ${c[k]}`).join(" · ");
      } else {
        totalQty = g.list.reduce((s, a) => s + (a.stocks || []).reduce((t, x) => t + x.qty, 0), 0);
      }
      return `<tr>
        <td>${g.product}</td>
        <td>${g.group} <span class="muted">›</span> ${g.sub}</td>
        <td><span class="type-pill">${TYPE_LABEL[g.type]}</span></td>
        <td class="num">${g.list.length}</td>
        <td>${dist}</td>
        <td class="num">${totalQty}</td>
      </tr>`;
    }).join("");
    return { head, rows, count: groups.length };
  }

  function view_axis(list, axis) {
    const map = new Map();
    const bump = (name, kind, n) => {
      if (!name) return;
      if (!map.has(name)) map.set(name, { name, indiv: 0, qty: 0 });
      map.get(name)[kind] += n;
    };
    list.forEach(a => {
      if (a.type === "individual") (a.assignments || []).forEach(x => bump(x[axis], "indiv", 1));
      else (a.stocks || []).forEach(x => bump(x[axis], "qty", x.qty));
    });
    const label = axis === "employee" ? "구성원" : "근무지";
    const head = `<tr><th>${label}</th><th class="num">배정 자산 수</th><th class="num">보유 수량</th></tr>`;
    const rowsArr = [...map.values()];
    const rows = pageSlice(rowsArr).map(r => `<tr>
      <td>${r.name}</td>
      <td class="num">${r.indiv || '<span class="muted">0</span>'}</td>
      <td class="num">${r.qty || '<span class="muted">0</span>'}</td>
    </tr>`).join("");
    return { head, rows, count: rowsArr.length };
  }

  function currentView() {
    const list = getFiltered();
    if (state.view === "all") return view_all(list);
    if (state.view === "product") return view_product(list);
    if (state.view === "employee") return view_axis(list, "employee");
    if (state.view === "worksite") return view_axis(list, "worksite");
  }

  /* ---------- render ---------- */
  function sortHtml() {
    if (state.view !== "all") return "";
    const cur = SORT_FIELDS.find(f => f.k === state.sort.key);
    return `
      <div class="sortbar">
        <button class="sort-key-btn" id="sort-key-btn">${cur.label}${CARET}</button>
        <button class="sort-dir" id="sort-dir" aria-label="정렬 방향(${state.sort.dir === "asc" ? "오름차순" : "내림차순"})">
          ${state.sort.dir === "asc" ? SORT_ASC_ICON : SORT_DESC_ICON}
        </button>
      </div>`;
  }
  function openSortKeyMenu(anchor) {
    document.querySelectorAll(".dropdown-menu").forEach(m => m.remove());
    const menu = document.createElement("div");
    menu.className = "dropdown-menu";
    menu.innerHTML = SORT_FIELDS.map(f => `<button data-k="${f.k}" class="${state.sort.key === f.k ? "active" : ""}">${f.label}</button>`).join("");
    const r = anchor.getBoundingClientRect();
    menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${r.left}px;min-width:${Math.max(r.width, 120)}px`;
    document.body.appendChild(menu);
    menu.querySelectorAll("button").forEach(b => b.onclick = () => {
      menu.remove();
      state.sort.key = b.dataset.k;
      state.sort.dir = SORT_FIELDS.find(f => f.k === b.dataset.k).defDir;
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
  function filterChips() {
    const f = state.filters;
    const chips = [];
    const push = (grp, label, clear) => chips.push(
      `<span class="fchip">${label}<button data-clear='${JSON.stringify(clear)}'>✕</button></span>`);
    if (f.category.length) push("category", `분류: ${f.category.map(c => c.split("/")[1]).join("·")}`, { k: "category" });
    if (f.type.length) push("type", f.type.map(t => TYPE_LABEL[t]).join("·"), { k: "type" });
    if (f.status.length) push("status", f.status.map(s => STATUS_LABEL[s][0]).join("·"), { k: "status" });
    if (f.expiry.length) push("expiry", f.expiry.map(e => EXP_LABEL[e]).join("·"), { k: "expiry" });
    if (f.note.length) push("note", f.note.map(v => v === "has" ? "있음" : "없음").join("·"), { k: "note" });
    if (f.labels.length) push("labels", `태그(${f.labelMode.toUpperCase()}): ${f.labels.join("·")}`, { k: "labels" });
    if (!chips.length) return "";
    return `<div class="filterbar"><button class="filter-reset" id="filter-reset" aria-label="필터 전체 해제">${RESET_ICON}</button>${chips.join("")}</div>`;
  }

  function tableInner(v) {
    const empty = `<tr><td colspan="10" style="text-align:center;color:var(--text-mut);padding:32px">조건에 맞는 자산이 없습니다</td></tr>`;
    return `<table class="tbl-${state.view}"><thead>${v.head}</thead><tbody>${v.rows || empty}</tbody></table>`;
  }
  function bindRows(scope) {
    scope.querySelectorAll("tbody tr.clickable").forEach(tr =>
      tr.onclick = () => location.href = `asset-detail.html?id=${tr.dataset.id}`);
  }

  function render() {
    const c = document.getElementById("content");
    const v = currentView();
    const nAct = activeFilterCount();
    c.innerHTML = `
      <div class="tabs">
        <a class="active">현황</a>
        <a href="category.html">분류</a>
        <a href="settings.html">설정</a>
      </div>

      <div class="subtabs">
        ${[["all","전체"],["product","제품별"],["employee","구성원별"],["worksite","근무지별"]]
          .map(([k,t]) => `<button data-view="${k}" class="${state.view===k?'active':''}">${t}</button>`).join("")}
        <div class="sub-actions">
          <button class="btn primary sm" id="btn-add">＋ 자산 추가 <span class="chev">▾</span></button>
          <button class="btn sm" id="btn-bulk">일괄 작업 <span class="chev">▾</span></button>
        </div>
      </div>

      ${statsHtml()}

      <div class="countrow">
        <span class="total">전체 <b>${v.count}</b></span>
        ${sortHtml()}
        <button class="filter-btn ${nAct ? 'set' : ''}" id="btn-filter">▤ 필터${nAct ? ` <b>${nAct}</b>` : ""}</button>
        <div class="right">
          <div class="searchbox${state.search ? ' has-term' : ''}">
            <input class="search${state.search ? ' expanded' : ''}" id="search-input"
              placeholder="${state.search ? '고유관리번호 / 제품명' : '검색'}" value="${state.search.replace(/"/g, '&quot;')}">
            <button class="search-clear" id="search-clear" type="button" aria-label="검색어 지우기">✕</button>
          </div>
          <button class="btn sm" id="btn-qr-dl">▦ QR 다운로드</button>
          <button class="btn sm" data-stub="자산 목록 엑셀 다운로드">⬇ 다운로드</button>
        </div>
      </div>

      ${filterChips()}

      <div class="table-wrap">${tableInner(v)}</div>

      ${pagerHtml(v.count)}
    `;

    c.querySelectorAll(".subtabs button").forEach(b =>
      b.onclick = () => { state.view = b.dataset.view; state.page = 1; render(); });
    bindRows(c);
    c.querySelectorAll("[data-stub]").forEach(el =>
      el.onclick = () => toast(`"${el.dataset.stub}" — 이후 단계에서 정의`));

    const si = document.getElementById("search-input");
    const sbox = si.closest(".searchbox");
    const commit = () => { state.search = si.value.trim(); state.page = 1; render(); };
    si.onfocus = () => { si.classList.add("expanded"); si.placeholder = "고유관리번호 / 제품명"; };
    si.onblur = () => { if (!si.value && !state.search) { si.classList.remove("expanded"); si.placeholder = "검색"; } };
    si.oninput = () => sbox.classList.toggle("has-term", !!si.value);   // ✕ 노출만, 검색 실행 X
    si.onkeydown = e => { if (e.key === "Enter") commit(); };
    document.getElementById("search-clear").onclick = () => { si.value = ""; state.search = ""; state.page = 1; render(); };
    c.querySelectorAll("[data-clear]").forEach(b =>
      b.onclick = () => { state.filters[JSON.parse(b.dataset.clear).k] = []; state.page = 1; render(); });

    c.querySelectorAll(".statcol.click").forEach(el => el.onclick = () => {
      const p = JSON.parse(el.dataset.filter);
      const isOn = arrEq(state.filters[p.k], p.v);
      const base = { ...emptyFilters(), category: state.filters.category, labelMode: state.filters.labelMode };
      state.filters = isOn ? base : { ...base, [p.k]: p.v };
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
    const sortDirBtn = document.getElementById("sort-dir");
    if (sortDirBtn) sortDirBtn.onclick = () => {
      state.sort.dir = state.sort.dir === "asc" ? "desc" : "asc";
      state.page = 1;
      render();
    };

    document.getElementById("btn-filter").onclick = openFilterModal;
    document.getElementById("btn-add").onclick = () => window.openAssetAddModal();
    document.getElementById("btn-qr-dl").onclick = openQrDownloadModal;
    document.getElementById("btn-bulk").onclick = e => dropdown(e.currentTarget, [
      { label: "일괄 자산 추가", fn: () => location.href = "batch-register.html" },
      { label: "일괄 배정·보유 변경", fn: () => location.href = "batch-assign.html" },
    ]);
  }

  /* ---------- stats (분류 필터까지만 반영) ---------- */
  function catScoped() {
    const cat = state.filters.category;
    return cat.length ? assets.filter(a => cat.includes(`${a.group}/${a.sub}`)) : assets;
  }
  function computeStats() {
    const list = catScoped();
    const indiv = list.filter(a => a.type === "individual");
    const qty = list.filter(a => a.type === "quantity");
    const cnt = k => indiv.filter(a => a.status === k).length;
    const expOver = list.filter(a => a.expiry && expiryKey(a.expiry) === "over").length;
    const expSoon = list.filter(a => a.expiry && expiryKey(a.expiry) === "soon").length;
    const assignable = indiv.length - cnt("disposed");
    return {
      indivN: indiv.length, qtyN: qty.length,
      stock: cnt("stock"), assigned: cnt("assigned"), repair: cnt("repair"),
      lost: cnt("lost"), disposed: cnt("disposed"), assignable,
      expOver, expSoon,
      rate: assignable ? Math.round(cnt("assigned") / assignable * 100) : 0,
    };
  }
  function arrEq(a, b) { a = a || []; b = b || []; return a.length === b.length && a.every(x => b.includes(x)); }
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
        statCol({ k: "개별 자산", v: s.indivN, sub: "개", filter: { k: "type", v: ["individual"] } }),
        statCol({ k: "수량 자산", v: s.qtyN, sub: "종류", filter: { k: "type", v: ["quantity"] } }),
      ])}
      ${statCard("유효기간", [
        statCol({ k: "만료 예정", v: s.expSoon, cls: "warn", filter: { k: "expiry", v: ["soon"] } }),
        statCol({ k: "만료", v: s.expOver, cls: "alert", filter: { k: "expiry", v: ["over"] } }),
      ])}
    </div>`;
    const row2 = `<div class="statrow2">
      ${statCard("개별 자산", [
        statCol({
          k: "배정 중", v: `${s.rate}%`, sub: `${s.assigned}/${s.assignable}`, filter: { k: "status", v: ["assigned"] },
          extra: `<div class="donut" style="--pct:${s.rate}"><div class="donut-hole"></div></div>`,
        }),
        statCol({ k: "재고", v: s.stock, filter: { k: "status", v: ["stock"] } }),
        statCol({ k: "분실", v: s.lost, cls: "alert", filter: { k: "status", v: ["lost"] } }),
        statCol({ k: "수리 중", v: s.repair, cls: "warn", filter: { k: "status", v: ["repair"] } }),
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

    const GROUPS = [
      { k: "category", name: "분류" },
      { k: "type", name: "자산 유형" },
      { k: "status", name: "상태" },
      { k: "expiry", name: "유효기한" },
      { k: "labels", name: "태그" },
    ];
    const summary = k => {
      if (k === "category") return draft.category.length ? draft.category.map(c => c.split("/")[1]).join(", ") : "전체";
      if (k === "type") return draft.type.length ? draft.type.map(t => TYPE_LABEL[t]).join(", ") : "전체";
      if (k === "status") return draft.status.length ? draft.status.map(s => STATUS_LABEL[s][0]).join(", ") : "전체";
      if (k === "expiry") return draft.expiry.length ? draft.expiry.map(e => EXP_LABEL[e]).join(", ") : "전체";
      if (k === "labels") return draft.labels.length ? `${draft.labels.join(", ")} · ${draft.labelMode.toUpperCase()}` : "전체";
    };

    const back = modal(`
      <div class="modal lg">
        <h3>필터</h3>
        <div class="fmodal">
          <div class="groups" id="f-groups"></div>
          <div class="opts" id="f-opts"></div>
        </div>
        <div class="foot">
          <span class="sum" id="f-sum"></span>
          <button class="btn" id="f-reset">초기화</button>
          <button class="btn" data-close>취소</button>
          <button class="btn primary" id="f-apply">적용</button>
        </div>
      </div>`);

    function drawGroups() {
      back.querySelector("#f-groups").innerHTML = GROUPS.map(g => {
        const active = draft[g.k] && draft[g.k].length;
        return `<button data-g="${g.k}" class="${g.k === group ? "active" : ""}">
          <span class="g-name">${active ? '<span class="dot"></span>' : ""}${g.name}</span>
          <span class="g-sum">${summary(g.k)}</span></button>`;
      }).join("");
      back.querySelectorAll("#f-groups button").forEach(b =>
        b.onclick = () => { group = b.dataset.g; drawGroups(); drawOpts(); });
    }

    function optRow(checked, label, val, cls = "") {
      return `<label class="opt ${cls}"><input type="checkbox" data-v="${val}" ${checked ? "checked" : ""}>${label}</label>`;
    }

    function drawOpts() {
      const box = back.querySelector("#f-opts");
      if (group === "category") {
        box.innerHTML = [...CAT_GROUPS.entries()].map(([g, subs]) => {
          const keys = subs.map(s => `${g}/${s}`);
          const all = keys.every(k => draft.category.includes(k));
          const parent = optRow(all, `<b>${g}</b>`, `grp:${g}`);
          const kids = subs.map(s => optRow(draft.category.includes(`${g}/${s}`), s, `${g}/${s}`, "child")).join("");
          return parent + kids;
        }).join("");
      } else if (group === "type") {
        box.innerHTML = Object.entries(TYPE_LABEL).map(([v, l]) => optRow(draft.type.includes(v), l, v)).join("");
      } else if (group === "status") {
        box.innerHTML = `<p class="hint" style="margin-bottom:6px">개별 자산에만 적용</p>` +
          STATUS_ORDER.map(v => optRow(draft.status.includes(v), STATUS_LABEL[v][0], v)).join("");
      } else if (group === "expiry") {
        box.innerHTML = Object.entries(EXP_LABEL).map(([v, l]) => optRow(draft.expiry.includes(v), l, v)).join("");
      } else if (group === "labels") {
        box.innerHTML = `
          <div class="field" style="margin-bottom:10px">
            <label>다중 선택 조건</label>
            <div class="seg" id="lbl-mode">
              <button data-m="or" class="${draft.labelMode === "or" ? "active" : ""}">OR (하나라도)</button>
              <button data-m="and" class="${draft.labelMode === "and" ? "active" : ""}">AND (모두)</button>
            </div>
          </div>` +
          ALL_LABELS.map(l => optRow(draft.labels.includes(l), l, l)).join("");
        box.querySelector("#lbl-mode").onclick = e => {
          const b = e.target.closest("button"); if (!b) return;
          draft.labelMode = b.dataset.m; drawOpts(); drawGroups();
        };
      }

      box.querySelectorAll('input[type=checkbox]').forEach(cb => cb.onchange = () => {
        const v = cb.dataset.v;
        if (group === "category") {
          if (v.startsWith("grp:")) {
            const g = v.slice(4);
            const keys = CAT_GROUPS.get(g).map(s => `${g}/${s}`);
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
        drawOpts(); drawGroups(); drawSum();
      });
      drawSum();
    }
    function drawSum() {
      const n = (draft[group] || []).length;
      back.querySelector("#f-sum").textContent = group === "labels" || group === "category"
        ? `선택됨 ${n}` : `선택됨 ${n}`;
    }

    back.querySelector("#f-reset").onclick = () => {
      Object.assign(draft, emptyFilters());
      drawGroups(); drawOpts();
    };
    back.querySelector("#f-apply").onclick = () => {
      state.filters = draft;
      state.page = 1;
      back.remove();
      render();
    };

    drawGroups();
    drawOpts();
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
    const list = getFiltered();
    const rows = list.map(a => `<label class="opt">
      <input type="checkbox" data-id="${a.id}">
      <span style="flex:1">${a.product} <span class="muted">${a.assetNo || a.id}</span></span>
      <span class="type-pill">${TYPE_LABEL[a.type]}</span></label>`).join("");
    const m = modal(`
      <div class="modal lg">
        <h3>QR 라벨 다운로드</h3>
        <div class="body" style="max-height:52vh;overflow:auto;padding-top:6px">
          <div class="hint" style="margin-bottom:6px">현재 목록 기준 ${list.length}건. QR 라벨을 내려받을 자산을 선택하세요.</div>
          <label class="opt" style="border-bottom:1px solid var(--line);font-weight:600">
            <input type="checkbox" id="qr-all"> 전체 선택</label>
          ${rows || '<p class="muted" style="padding:16px 0">대상 자산이 없습니다</p>'}
        </div>
        <div class="foot">
          <span class="sum" id="qr-sum">선택 0건</span>
          <button class="btn" data-close>취소</button>
          <button class="btn primary" id="qr-go" disabled>다운로드</button>
        </div>
      </div>`);
    const boxes = () => [...m.querySelectorAll('.body input[data-id]')];
    const upd = () => {
      const n = boxes().filter(b => b.checked).length;
      m.querySelector("#qr-sum").textContent = `선택 ${n}건`;
      m.querySelector("#qr-go").disabled = !n;
      const all = m.querySelector("#qr-all");
      all.checked = n > 0 && n === boxes().length;
    };
    m.querySelector("#qr-all").onchange = e => { boxes().forEach(b => b.checked = e.target.checked); upd(); };
    boxes().forEach(b => b.onchange = upd);
    m.querySelector("#qr-go").onclick = () => {
      toast(`QR 라벨 ${boxes().filter(b => b.checked).length}건 다운로드 (프로토타입)`);
      m.remove();
    };
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
