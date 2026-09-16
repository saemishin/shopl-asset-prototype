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
  const SORT_ASC_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18V6M5 6l-3 3M5 6l3 3"/><path d="M11 7h4M11 12h7M11 17h10"/></svg>`;
  const SORT_DESC_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 6v12M5 18l-3-3M5 18l3-3"/><path d="M11 7h10M11 12h7M11 17h4"/></svg>`;
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
    filters: { category: [], type: [], status: [], expiry: [], labels: [], note: [] },
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
    return { category: [], type: [], status: [], expiry: [], labels: [], note: [] };
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
        if (has.length !== f.labels.length) return false;
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
      <th>고유관리번호</th><th>제품명</th>
      ${thFilter("자산 유형", "type")}<th>분류</th>${thFilter("상태", "status")}
      <th>배정·보유 현황</th>${thFilter("유효기한", "expiry")}<th>태그</th>${thFilter("메모", "note", "c")}<th>등록일</th></tr>`;
    const rows = pageSlice(sortList(list)).map(a => {
      const st = a.type === "quantity"
        ? '<span class="muted">—</span>'
        : `<span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>`;
      return `<tr class="clickable" data-id="${a.id}">
        <td>${a.assetNo || '<span class="muted">—</span>'}</td>
        <td>${prodCell(a)}</td>
        <td><span class="type-pill">${TYPE_LABEL[a.type]}</span></td>
        <td>${a.group} <span class="muted">›</span> ${a.sub}</td>
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
    if (f.labels.length) push("labels", f.labels.join("·"), { k: "labels" });
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
      const base = { ...emptyFilters(), category: state.filters.category };
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
    c.querySelectorAll(".sort-dir-btn").forEach(b => b.onclick = () => {
      state.sort.dir = b.dataset.dir;
      state.page = 1;
      render();
    });

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
      ${statCard("개별 자산 요약", [
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
      if (k === "category") labels = draft.category.map(c => { const [g, s] = c.split("/"); return `${g} › ${s}`; });
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
        CAT_GROUPS.forEach((subs, g) => subs.forEach(s => {
          if (!q || g.toLowerCase().includes(q) || s.toLowerCase().includes(q)) out.push(`${g}/${s}`);
        }));
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
          const filtered = subs.filter(s => !q || g.toLowerCase().includes(q) || s.toLowerCase().includes(q));
          if (!filtered.length) return "";
          const keys = filtered.map(s => `${g}/${s}`);
          const all = keys.every(k => draft.category.includes(k));
          const parent = optRow(all, `<b>${g}</b>`, `grp:${g}`);
          const kids = filtered.map(s => optRow(draft.category.includes(`${g}/${s}`), s, `${g}/${s}`, "child")).join("");
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
