/* 현황 탭 — 자산 목록 (진입 화면) */
(function () {
  const TODAY = new Date("2026-09-04");
  const { assets } = window.DATA;

  const STATUS_LABEL = {
    stock: ["재고", "stock"], assigned: ["배정중", "assigned"], repair: ["수리중", "repair"],
    lost: ["분실", "lost"], disposed: ["폐기", "disposed"],
  };
  const STATUS_ORDER = ["stock", "assigned", "repair", "lost", "disposed"];
  const TYPE_LABEL = { individual: "개별형", quantity: "수량형" };
  const EXP_LABEL = { valid: "유효", soon: "임박", over: "지남", none: "미설정" };

  function expiryKey(d) {
    if (!d) return "none";
    const days = Math.ceil((new Date(d) - TODAY) / 86400000);
    return days < 0 ? "over" : days <= 7 ? "soon" : "valid";
  }
  function expiryCell(d) {
    if (!d) return '<span class="muted">—</span>';
    const k = expiryKey(d);
    return `${d} <span class="badge exp-${k}">${EXP_LABEL[k]}</span>`;
  }
  function holderText(a) {
    if (a.type === "individual") {
      if (!a.assignments || !a.assignments.length) return '<span class="muted">재고</span>';
      const names = a.assignments.map(x => [x.employee, x.worksite].filter(Boolean).join("·"));
      return names.length === 1 ? names[0] : `${names[0]} <span class="muted">외 ${names.length - 1}</span>`;
    }
    const total = (a.stocks || []).reduce((s, x) => s + x.qty, 0);
    return `${total}개 <span class="muted">/ ${(a.stocks || []).length}곳</span>`;
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
    filters: { category: [], type: [], status: [], expiry: [], labels: [], labelMode: "or" },
  };

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
    return f.category.length + f.type.length + f.status.length + f.expiry.length + f.labels.length;
  }

  /* ---------- views ---------- */
  function view_all(list) {
    const head = `<tr>
      <th>고유관리번호</th><th>제품명</th><th>분류</th><th>자산 유형</th><th>상태</th>
      <th>배정·보유 현황</th><th>기한</th><th>라벨</th></tr>`;
    const rows = list.map(a => {
      const st = a.type === "quantity"
        ? '<span class="muted">—</span>'
        : `<span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>`;
      return `<tr class="clickable" data-id="${a.id}">
        <td>${a.assetNo || '<span class="muted">—</span>'}</td>
        <td>${a.product}</td>
        <td>${a.group} <span class="muted">›</span> ${a.sub}</td>
        <td><span class="type-pill">${TYPE_LABEL[a.type]}</span></td>
        <td>${st}</td>
        <td>${holderText(a)}</td>
        <td>${expiryCell(a.expiry)}</td>
        <td>${labelsCell(a.labels)}</td>
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
    const rows = [...map.values()].map(g => {
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
    return { head, rows, count: map.size };
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
    const head = `<tr><th>${label}</th><th class="num">배정 자산 수(개별형)</th><th class="num">보유 수량(수량형)</th></tr>`;
    const rows = [...map.values()].map(r => `<tr>
      <td>${r.name}</td>
      <td class="num">${r.indiv || '<span class="muted">0</span>'}</td>
      <td class="num">${r.qty || '<span class="muted">0</span>'}</td>
    </tr>`).join("");
    return { head, rows, count: map.size };
  }

  function currentView() {
    const list = getFiltered();
    if (state.view === "all") return view_all(list);
    if (state.view === "product") return view_product(list);
    if (state.view === "employee") return view_axis(list, "employee");
    if (state.view === "worksite") return view_axis(list, "worksite");
  }

  /* ---------- render ---------- */
  function filterChips() {
    const f = state.filters;
    const chips = [];
    const push = (grp, label, clear) => chips.push(
      `<span class="fchip">${label}<button data-clear='${JSON.stringify(clear)}'>✕</button></span>`);
    if (f.category.length) push("category", `분류: ${f.category.map(c => c.split("/")[1]).join("·")}`, { k: "category" });
    if (f.type.length) push("type", `자산 유형: ${f.type.map(t => TYPE_LABEL[t]).join("·")}`, { k: "type" });
    if (f.status.length) push("status", `상태: ${f.status.map(s => STATUS_LABEL[s][0]).join("·")}`, { k: "status" });
    if (f.expiry.length) push("expiry", `기한: ${f.expiry.map(e => EXP_LABEL[e]).join("·")}`, { k: "expiry" });
    if (f.labels.length) push("labels", `라벨(${f.labelMode.toUpperCase()}): ${f.labels.join("·")}`, { k: "labels" });
    if (!chips.length) return "";
    return `<div class="filterbar">${chips.join("")}<button class="fclear" id="fclear-all">전체 해제</button></div>`;
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
      </div>

      <div class="searchrow">
        <input class="search${state.search ? ' expanded' : ''}" id="search-input"
          placeholder="${state.search ? '고유관리번호 / 제품명' : '검색'}" value="${state.search.replace(/"/g, '&quot;')}">
        <button class="filter-btn ${nAct ? 'set' : ''}" id="btn-filter">▤ 필터${nAct ? ` <b>${nAct}</b>` : ""}</button>
        <div class="right">
          <button class="btn sm" id="btn-qr-dl">▦ QR 다운로드</button>
          <button class="btn sm" data-stub="자산 목록 엑셀 다운로드">⬇ 다운로드</button>
        </div>
      </div>

      ${filterChips()}

      <div class="table-wrap">
        <table><thead>${v.head}</thead><tbody>${v.rows || `<tr><td colspan="8" style="text-align:center;color:var(--text-mut);padding:32px">조건에 맞는 자산이 없습니다</td></tr>`}</tbody></table>
      </div>

      <div class="pager">
        <button>«</button><button>‹</button>
        <button class="active">1</button><button>2</button><button>3</button>
        <button>›</button><button>»</button>
        <span class="pagesize"><select><option>100</option><option>50</option><option>20</option></select></span>
      </div>
    `;

    c.querySelectorAll(".subtabs button").forEach(b =>
      b.onclick = () => { state.view = b.dataset.view; render(); });
    c.querySelectorAll("tbody tr.clickable").forEach(tr =>
      tr.onclick = () => location.href = `asset-detail.html?id=${tr.dataset.id}`);
    c.querySelectorAll("[data-stub]").forEach(el =>
      el.onclick = () => toast(`"${el.dataset.stub}" — 이후 단계에서 정의`));

    const si = document.getElementById("search-input");
    si.onfocus = () => { state._sf = true; si.classList.add("expanded"); si.placeholder = "고유관리번호 / 제품명"; };
    si.onblur = () => { state._sf = false; if (!si.value) { si.classList.remove("expanded"); si.placeholder = "검색"; } };
    si.oninput = e => { state.search = e.target.value; state._caret = e.target.selectionStart; render(); };
    if (state._sf) {
      si.focus();
      const p = state._caret != null ? state._caret : si.value.length;
      try { si.setSelectionRange(p, p); } catch (e) {}
    }
    c.querySelectorAll("[data-clear]").forEach(b =>
      b.onclick = () => { state.filters[JSON.parse(b.dataset.clear).k] = []; render(); });
    const clearAll = document.getElementById("fclear-all");
    if (clearAll) clearAll.onclick = () => {
      state.filters = { category: [], type: [], status: [], expiry: [], labels: [], labelMode: "or" };
      render();
    };

    c.querySelectorAll(".stat.click").forEach(el => el.onclick = () => {
      const p = JSON.parse(el.dataset.filter);
      const base = { category: state.filters.category, type: [], status: [], expiry: [], labels: [], labelMode: state.filters.labelMode };
      state.filters = cardActive(p) ? base : { ...base, [p.k]: p.v };
      render();
    });

    document.getElementById("btn-filter").onclick = openFilterModal;
    document.getElementById("btn-add").onclick = openAddModal;
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
    const totalQty = qty.reduce((s, a) => s + (a.stocks || []).reduce((t, x) => t + x.qty, 0), 0);
    const zeroStocks = qty.reduce((s, a) => s + (a.stocks || []).filter(x => x.qty === 0).length, 0);
    const expOver = list.filter(a => a.expiry && expiryKey(a.expiry) === "over").length;
    const expSoon = list.filter(a => a.expiry && expiryKey(a.expiry) === "soon").length;
    const assignable = indiv.length - cnt("disposed");
    return {
      indivN: indiv.length, qtyN: qty.length, totalQty,
      stock: cnt("stock"), assigned: cnt("assigned"), repair: cnt("repair"),
      lost: cnt("lost"), disposed: cnt("disposed"),
      zeroStocks, expOver, expSoon,
      rate: assignable ? Math.round(cnt("assigned") / assignable * 100) : 0,
    };
  }
  function arrEq(a, b) { a = a || []; b = b || []; return a.length === b.length && a.every(x => b.includes(x)); }
  function cardActive(f) {
    const s = state.filters;
    return ["type", "status", "expiry", "labels"].every(d => d === f.k ? arrEq(s[d], f.v) : !(s[d] || []).length);
  }
  function statTile({ k, v, sub, cls = "", filter }) {
    const on = filter && cardActive(filter) ? " active" : "";
    const attr = filter ? ` class="stat click ${cls}${on}" data-filter='${JSON.stringify(filter)}'` : ` class="stat ${cls}"`;
    return `<div${attr}><div class="k">${k}</div><div class="v">${v}${sub ? ` <small>${sub}</small>` : ""}</div></div>`;
  }
  function statsHtml() {
    const s = computeStats();
    const row1 = [
      statTile({ k: "개별형", v: s.indivN, sub: "대", filter: { k: "type", v: ["individual"] } }),
      statTile({ k: "수량형", v: s.qtyN, sub: `품목 · 총 ${s.totalQty}개`, filter: { k: "type", v: ["quantity"] } }),
      statTile({ k: "배정중", v: s.assigned, filter: { k: "status", v: ["assigned"] } }),
      statTile({ k: "재고(미배정)", v: s.stock, filter: { k: "status", v: ["stock"] } }),
      statTile({ k: "배정률", v: s.rate + "%" }),
    ].join("");
    const row2 = [
      statTile({ k: "기한 지남", v: s.expOver, cls: "alert", filter: { k: "expiry", v: ["over"] } }),
      statTile({ k: "기한 임박", v: s.expSoon, cls: "warn", filter: { k: "expiry", v: ["soon"] } }),
      statTile({ k: "분실", v: s.lost, cls: "alert", filter: { k: "status", v: ["lost"] } }),
      statTile({ k: "수리중", v: s.repair, cls: "warn", filter: { k: "status", v: ["repair"] } }),
      statTile({ k: "소진 보유처", v: s.zeroStocks, cls: s.zeroStocks ? "warn" : "" }),
    ].join("");
    return `
      <div class="statwrap">
        <h5>자산 현황</h5><div class="statgrid">${row1}</div>
        <h5>조치 필요</h5><div class="statgrid">${row2}</div>
      </div>`;
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
      { k: "expiry", name: "기한" },
      { k: "labels", name: "라벨" },
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
        box.innerHTML = `<p class="hint" style="margin-bottom:6px">개별형 자산에만 적용</p>` +
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
      Object.assign(draft, { category: [], type: [], status: [], expiry: [], labels: [], labelMode: "or" });
      drawGroups(); drawOpts();
    };
    back.querySelector("#f-apply").onclick = () => {
      state.filters = draft;
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

  function openAddModal() {
    let type = "individual";
    const m = modal(`
      <div class="modal">
        <h3>자산 추가</h3>
        <div class="body">
          <div class="field">
            <label>자산 유형 <span class="req">*</span></label>
            <div class="seg" id="type-seg">
              <button class="active" data-t="individual">개별형</button>
              <button data-t="quantity">수량형</button>
            </div>
            <div class="hint">유형은 선택한 소분류에서 상속됩니다. (구조안 3.4)</div>
          </div>
          <div class="field"><label>소분류 <span class="req">*</span></label>
            <select><option>전자기기류 › 노트북</option><option>가구류 › 의자</option><option>소모품 › 유니폼</option></select></div>
          <div class="field"><label>제품명 <span class="req">*</span></label><input type="text" placeholder="예: 그램 16 (2024)"></div>
          <div class="field" id="f-assetno"><label>고유관리번호 <span class="req">*</span></label><input type="text" placeholder="예: IT-2026-0001"></div>
          <div class="field"><label>기한</label><input type="date"><div class="hint">소분류 필드 노출 설정이 on일 때만 표시 (기본 off)</div></div>
          <div class="field"><label>라벨</label><input type="text" placeholder="입력 후 Enter · 최대 5개 · 20자"></div>
        </div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" data-close id="save">저장</button>
        </div>
      </div>`);
    m.querySelector("#type-seg").onclick = e => {
      const b = e.target.closest("button"); if (!b) return;
      type = b.dataset.t;
      m.querySelectorAll("#type-seg button").forEach(x => x.classList.toggle("active", x === b));
      m.querySelector("#f-assetno").style.display = type === "quantity" ? "none" : "";
    };
    m.querySelector("#save").addEventListener("click", () => toast("저장되었습니다 (프로토타입 — 반영 없음)"));
  }

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
