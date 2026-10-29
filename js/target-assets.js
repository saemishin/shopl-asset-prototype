// 구성원·근무지 상세 > 정보 탭의 자산 테이블(D-20261029-37).
// 현황 > 전체의 정렬·필터·검색·페이지 컴포넌트(마크업·클래스)를 그대로 재사용해 두 상세 화면이 같은 UI를 쓴다.
(function () {
  const TODAY = new Date("2026-09-04"),
    STATUS_LABEL = {
      stock: ["배정 가능", "stock"],
      assigned: ["배정 중", "assigned"],
      repair: ["수리/점검 중", "repair"],
      lost: ["분실", "lost"],
      disposed: ["폐기", "disposed"]
    },
    STATUS_ORDER = ["assigned", "repair", "lost", "disposed", "stock"],
    EXP_LABEL = { valid: "유효", soon: "만료 예정", over: "만료", none: "미설정" },
    SORT_FIELDS = [
      { k: "since", label: "배정일", defDir: "desc" },
      { k: "product", label: "품목명", defDir: "asc" },
      { k: "assetNo", label: "고유관리번호", defDir: "asc" },
      { k: "expiry", label: "유효기한", defDir: "desc" }
    ],
    CARET = '<svg class="th-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>',
    RESET_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 1 2.64 6.36"/><path d="M3 20v-6h6"/></svg>',
    SORT_ASC_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18V6M5 6l-3 3M5 6l3 3"/><path d="M11 7h4M11 12h7M11 17h10"/></svg>',
    SORT_DESC_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 6v12M5 18l-3-3M5 18l3-3"/><path d="M11 7h10M11 12h7M11 17h4"/></svg>',
    MEMO_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M9 13h5M9 17h4"/></svg>';

  const esc = v => String(v ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const expiryKey = d => {
    if (!d) return "none";
    const days = Math.ceil((new Date(d) - TODAY) / 864e5);
    return days < 0 ? "over" : days <= 7 ? "soon" : "valid";
  };
  const expiryOf = a => window.AssetExtra.visible(window.AssetExtra.category(a), "expiry") ? a.expiry : "";
  const thumb = a => {
    const ph = window.assetPhotos(a);
    return ph.length
      ? `<span class="thumb" style="background:${ph[a._primary || 0].color}"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="m21 16-5-5-9 8"/></svg></span>`
      : '<span class="thumb empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-4 4 3 4-4 5 4"/></svg></span>';
  };
  const expiryCell = d => d ? `${window.fmtDate(d)} <span class="badge exp-${expiryKey(d)}">${EXP_LABEL[expiryKey(d)]}</span>` : '<span class="muted">—</span>';
  const labelsCell = labels => labels && labels.length ? labels.map(l => `<span class="tag">${esc(l)}</span>`).join("") : '<span class="muted">—</span>';

  function wire(host, items, openUrl) {
    const state = { q: "", key: "since", dir: "desc", page: 1, size: 20, filters: { categories: [], statuses: [] } };
    const tools = host.querySelector("[data-target-tools]"), table = host.querySelector("[data-target-table]"), pager = host.querySelector("[data-target-pager]");
    const categoryValues = () => window.DATA.categories
      .filter(x => !window.AssetPermissionQa || !window.AssetPermissionQa.canViewCategory || window.AssetPermissionQa.canViewCategory(x))
      .map(x => `${x.group}/${x.sub}`);

    function result() {
      const f = state.filters;
      return items.filter(x => {
        const a = x.asset;
        return (!f.categories.length || f.categories.includes(`${a.group}/${a.sub}`)) &&
          (!f.statuses.length || f.statuses.includes(a.status)) &&
          (!state.q || `${a.product} ${a.assetNo || ""}`.toLowerCase().includes(state.q));
      }).sort((x, y) => {
        const val = it => state.key === "since" ? it.since : state.key === "expiry" ? expiryOf(it.asset) : it.asset[state.key];
        const a = val(x), b = val(y);
        if (!a && !b) return (y.since || "").localeCompare(x.since || "");
        if (!a) return 1;
        if (!b) return -1;
        return (state.dir === "asc" ? 1 : -1) * String(a).localeCompare(String(b), "ko") ||
          (y.since || "").localeCompare(x.since || "") || (x.asset.assetNo || "").localeCompare(y.asset.assetNo || "");
      });
    }
    const activeCount = () => state.filters.categories.length + state.filters.statuses.length;

    function drawTools(count) {
      const cur = SORT_FIELDS.find(f => f.k === state.key), n = activeCount();
      const chips = [
        ...state.filters.categories.map(v => ({ k: "categories", v, label: v.replace("/", " › ") })),
        ...state.filters.statuses.map(v => ({ k: "statuses", v, label: STATUS_LABEL[v][0] }))
      ];
      tools.innerHTML = `
        <div class="countrow">
          <span class="total">전체 <b>${count}</b></span>
          <div class="sortbar">
            <button class="sort-key-btn" data-sort-key>${cur.label}${CARET}</button>
            <div class="sort-dir-group">
              <button class="sort-dir-btn ${state.dir === "asc" ? "active" : ""}" data-dir="asc" aria-label="오름차순">${SORT_ASC_ICON}</button>
              <button class="sort-dir-btn ${state.dir === "desc" ? "active" : ""}" data-dir="desc" aria-label="내림차순">${SORT_DESC_ICON}</button>
            </div>
          </div>
          <button class="filter-btn ${n ? "set" : ""}" data-filter>▤ 필터${n ? ` <b>${n}</b>` : ""}</button>
          <div class="right">
            <div class="searchbox${state.q ? " has-term" : ""}">
              <input class="search${state.q ? " expanded" : ""}" data-search placeholder="${state.q ? "품목명, 고유관리번호" : "검색"}" value="${esc(state.q)}">
              <button class="search-clear" data-search-clear type="button" aria-label="검색어 지우기">✕</button>
            </div>
          </div>
        </div>
        ${chips.length ? `<div class="filterbar"><button class="filter-reset" data-filter-reset aria-label="필터 전체 해제">${RESET_ICON}</button>${chips.map(c => `<span class="fchip">${esc(c.label)}<button data-clear="${c.k}" data-value="${esc(c.v)}">✕</button></span>`).join("")}</div>` : ""}`;
      const search = tools.querySelector("[data-search]");
      search.oninput = e => { state.q = e.target.value.trim().toLowerCase(); state.page = 1; draw(true); };
      tools.querySelector("[data-search-clear]").onclick = () => { state.q = ""; state.page = 1; draw(); tools.querySelector("[data-search]").focus(); };
      tools.querySelector("[data-sort-key]").onclick = e => openSortMenu(e.currentTarget);
      tools.querySelectorAll(".sort-dir-btn").forEach(b => b.onclick = () => { state.dir = b.dataset.dir; state.page = 1; draw(); });
      tools.querySelector("[data-filter]").onclick = openFilter;
      const reset = tools.querySelector("[data-filter-reset]");
      reset && (reset.onclick = () => { state.filters = { categories: [], statuses: [] }; state.page = 1; draw(); });
      tools.querySelectorAll("[data-clear]").forEach(b => b.onclick = () => {
        state.filters[b.dataset.clear] = state.filters[b.dataset.clear].filter(v => v !== b.dataset.value);
        state.page = 1; draw();
      });
    }

    function drawPager(total) {
      if (!total) { pager.innerHTML = ""; return; }
      const totalPages = Math.max(1, Math.ceil(total / state.size)), p = state.page,
        winStart = Math.max(1, Math.min(p - 2, totalPages - 4)), winEnd = Math.min(totalPages, Math.max(p + 2, winStart + 4)), pages = [];
      for (let i = winStart; i <= winEnd; i++) pages.push(i);
      const btn = (label, target, disabled, cls = "") => `<button data-page="${target}" ${disabled ? "disabled" : ""} class="${cls}">${label}</button>`;
      pager.innerHTML = `<div class="pager">${btn("«", 1, p === 1)}${btn("‹", p - 1, p === 1)}${pages.map(n => btn(n, n, false, n === p ? "active" : "")).join("")}${btn("›", p + 1, p === totalPages)}${btn("»", totalPages, p === totalPages)}<span class="pagesize"><select data-size>${[20, 50, 100].map(n => `<option value="${n}" ${state.size === n ? "selected" : ""}>${n}</option>`).join("")}</select></span></div>`;
      pager.querySelectorAll("[data-page]").forEach(b => b.onclick = () => { state.page = +b.dataset.page; draw(); });
      pager.querySelector("[data-size]").onchange = e => { state.size = +e.target.value; state.page = 1; draw(); };
    }

    function draw(keepSearchFocus) {
      const list = result(), pages = Math.max(1, Math.ceil(list.length / state.size));
      state.page = Math.min(state.page, pages);
      const caret = keepSearchFocus ? tools.querySelector("[data-search]")?.selectionStart : null;
      drawTools(list.length);
      if (keepSearchFocus) { const s = tools.querySelector("[data-search]"); s.focus(); s.setSelectionRange(caret, caret); }
      const rows = list.slice((state.page - 1) * state.size, state.page * state.size).map(x => {
        const a = x.asset;
        return `<tr class="clickable" data-target-asset="${a.id}">
          <td>${esc(a.group)} <span class="muted">›</span> ${esc(a.sub)}</td>
          <td><div class="prodcell">${thumb(a)}<span class="pname">${esc(a.product)}</span></div></td>
          <td>${a.assetNo ? esc(a.assetNo) : '<span class="muted">—</span>'}</td>
          <td><span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span></td>
          <td>${x.since ? window.fmtDate(x.since) : '<span class="muted">—</span>'}</td>
          <td>${expiryCell(expiryOf(a))}</td>
          <td>${labelsCell(a.labels)}</td>
          <td class="c">${window.AssetMemo.has(a.note) ? `<button type="button" class="memo-flag memo-view-btn" data-note="${a.id}" aria-label="메모 보기">${MEMO_ICON}</button>` : '<span class="muted">—</span>'}</td>
        </tr>`;
      }).join("");
      const emptyMsg = items.length ? "결과가 없습니다." : "배정 중인 자산이 없습니다.";
      table.innerHTML = `<div class="table-wrap"><table class="target-asset-table"><thead><tr><th>분류</th><th>품목명</th><th>고유관리번호</th><th>상태</th><th>배정일</th><th>유효기한</th><th>태그</th><th class="c">메모</th></tr></thead><tbody>${rows || `<tr><td colspan="8" style="text-align:center;color:var(--text-mut);padding:32px">${emptyMsg}</td></tr>`}</tbody></table></div>`;
      table.querySelectorAll("[data-target-asset]").forEach(row => row.onclick = e => {
        // 메모 아이콘은 행 클릭과 분리해 조회 Modal만 연다(바깥 클릭·[X]로 닫음).
        const note = e.target.closest("[data-note]");
        if (note) {
          const a = items.find(x => x.asset.id === note.dataset.note).asset, view = document.createElement("div");
          view.className = "modal-back";
          view.innerHTML = `<div class="modal help-modal"><div class="help-modal-head"><h3>메모</h3><button class="btn" data-close aria-label="닫기">×</button></div><div class="body">${window.AssetMemo.render(a.note)}</div></div>`;
          document.body.appendChild(view);
          view.querySelector("[data-close]").onclick = () => view.remove();
          view.onclick = ev => { if (ev.target === view) view.remove(); };
          return;
        }
        window.open(openUrl(row.dataset.targetAsset), "_blank", "noopener");
      });
      drawPager(list.length);
    }

    function openSortMenu(anchor) {
      document.querySelectorAll(".dropdown-menu").forEach(m => m.remove());
      const menu = document.createElement("div");
      menu.className = "dropdown-menu";
      menu.innerHTML = SORT_FIELDS.map(f => `<button data-k="${f.k}" class="${state.key === f.k ? "active" : ""}">${f.label}</button>`).join("");
      const r = anchor.getBoundingClientRect();
      menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${r.left}px;min-width:${Math.max(r.width, 120)}px`;
      document.body.appendChild(menu);
      menu.querySelectorAll("button").forEach(b => b.onclick = () => {
        menu.remove();
        state.key = b.dataset.k;
        state.dir = SORT_FIELDS.find(f => f.k === b.dataset.k).defDir;
        state.page = 1;
        draw();
      });
      setTimeout(() => {
        const close = e => { if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener("click", close); } };
        document.addEventListener("click", close);
      });
    }

    // 현황 필터 Modal(왼쪽 항목·오른쪽 옵션)에서 분류·상태만 추려 제공한다(D-20261029-37).
    function openFilter() {
      const draft = { categories: [...state.filters.categories], statuses: [...state.filters.statuses] };
      const GROUPS = [{ k: "categories", name: "분류" }, { k: "statuses", name: "상태" }];
      let group = "categories", query = "";
      const back = document.createElement("div");
      back.className = "modal-back";
      back.innerHTML = `<div class="modal lg"><h3>필터</h3><div class="fmodal"><div class="groups" data-groups></div><div class="opts" data-opts></div></div><div class="foot"><span class="sum" data-sum></span><button class="btn" data-close>취소</button><button class="btn primary" data-apply>적용</button></div></div>`;
      document.body.appendChild(back);
      const catGroups = () => {
        const map = new Map();
        categoryValues().forEach(v => { const [g, s] = v.split("/"); map.has(g) || map.set(g, []); map.get(g).push(s); });
        return map;
      };
      const summary = k => {
        const labels = k === "categories" ? draft.categories.map(v => v.replace("/", " › ")) : draft.statuses.map(v => STATUS_LABEL[v][0]);
        return labels.length ? `${labels[0]}${labels.length > 1 ? ` +${labels.length - 1}` : ""}` : "";
      };
      const visible = () => {
        if (group === "statuses") return STATUS_ORDER;
        const q = query.trim().toLowerCase(), out = [];
        catGroups().forEach((subs, g) => {
          const gm = !q || g.toLowerCase().includes(q);
          subs.filter(s => gm || s.toLowerCase().includes(q)).forEach(s => out.push(`${g}/${s}`));
        });
        return out;
      };
      const optRow = (checked, label, val, cls = "") => `<label class="opt ${cls}"><input type="checkbox" data-v="${esc(val)}" ${checked ? "checked" : ""}>${label}</label>`;
      function drawGroups() {
        back.querySelector("[data-groups]").innerHTML = GROUPS.map(g => {
          const s = summary(g.k);
          return `<button data-g="${g.k}" class="${g.k === group ? "active" : ""}"><span class="g-text"><span class="g-name">${g.name}</span>${s ? `<span class="g-sum">${esc(s)}</span>` : ""}</span>${draft[g.k].length ? '<span class="dot"></span>' : ""}</button>`;
        }).join("");
        back.querySelectorAll("[data-g]").forEach(b => b.onclick = () => { group = b.dataset.g; query = ""; drawGroups(); drawOpts(); });
      }
      function drawSum() {
        const n = draft.categories.length + draft.statuses.length;
        back.querySelector("[data-sum]").textContent = `선택됨 ${n}`;
      }
      function drawOpts() {
        const box = back.querySelector("[data-opts]");
        box.innerHTML = `${group === "categories" ? `<input type="text" class="picker-search" data-q placeholder="검색" value="${esc(query)}">` : ""}<div data-dyn></div>`;
        const q = box.querySelector("[data-q]");
        q && (q.oninput = e => { query = e.target.value; renderDyn(); });
        renderDyn();
      }
      function renderDyn() {
        const dyn = back.querySelector("[data-dyn]"), q = query.trim().toLowerCase();
        let html = "";
        if (group === "categories") {
          catGroups().forEach((subs, g) => {
            const gm = !q || g.toLowerCase().includes(q), filtered = subs.filter(s => gm || s.toLowerCase().includes(q));
            if (!filtered.length) return;
            const all = filtered.every(s => draft.categories.includes(`${g}/${s}`));
            html += (gm ? optRow(all, `<b>${esc(g)}</b>`, `grp:${g}`) : "") + filtered.map(s => optRow(draft.categories.includes(`${g}/${s}`), esc(s), `${g}/${s}`, gm ? "child" : "")).join("");
          });
          html ||= `<p class="muted" style="padding:12px 2px">결과가 없습니다.</p>`;
        } else {
          html = STATUS_ORDER.map(v => optRow(draft.statuses.includes(v), STATUS_LABEL[v][0], v)).join("");
        }
        const vis = visible(), allChecked = vis.length > 0 && vis.every(v => draft[group].includes(v));
        dyn.innerHTML = `<div class="picker-toolbar"><label class="picker-check"><input type="checkbox" data-all ${allChecked ? "checked" : ""}><span>전체</span></label><span class="right"><button class="filter-reset" data-group-reset aria-label="이 항목 초기화">${RESET_ICON}</button></span></div>${html}`;
        dyn.querySelector("[data-all]").onchange = e => {
          const vals = visible();
          draft[group] = e.target.checked ? [...new Set([...draft[group], ...vals])] : draft[group].filter(v => !vals.includes(v));
          renderDyn(); drawGroups(); drawSum();
        };
        dyn.querySelector("[data-group-reset]").onclick = () => { draft[group] = []; renderDyn(); drawGroups(); drawSum(); };
        dyn.querySelectorAll("input[data-v]").forEach(cb => cb.onchange = () => {
          const v = cb.dataset.v;
          if (v.startsWith("grp:")) {
            const g = v.slice(4), keys = (catGroups().get(g) || []).map(s => `${g}/${s}`);
            draft.categories = cb.checked ? [...new Set([...draft.categories, ...keys])] : draft.categories.filter(k => !keys.includes(k));
          } else {
            draft[group] = cb.checked ? [...draft[group], v] : draft[group].filter(x => x !== v);
          }
          renderDyn(); drawGroups(); drawSum();
        });
      }
      back.querySelector("[data-close]").onclick = () => back.remove();
      back.querySelector("[data-apply]").onclick = () => { state.filters = draft; state.page = 1; back.remove(); draw(); };
      drawGroups(); drawOpts(); drawSum();
    }

    draw();
  }

  window.TargetAssets = { wire };
})();
