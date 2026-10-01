/* 앱 소분류 상세 필터 — 직원모드/리더모드가 요청한 팝업과 조건 판정만 공유.
   목록 수집·권한·화면 상태는 각 화면에 유지한다. */
(function () {
  const KEYS = ["status", "expiry", "labels", "note"];
  const STATUS = { stock: "재고", assigned: "배정 중", lost: "분실", repair: "수리 중", disposed: "폐기", held: "보유 중" };
  const EXPIRY = { valid: "유효", soon: "만료 예정", over: "만료", none: "미설정" };
  // 대시보드와 같은 고정 데모 기준일. 실제 현재 날짜로 바꾸지 않는다.
  const TODAY = new Date("2026-09-04");
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const svg = paths => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const ICON = {
    all: svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
    status: svg('<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>'),
    expiry: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18M9 16h6"/>'),
    labels: svg('<path d="M3 3h8l10 10-8 8L3 11Z"/><circle cx="7.5" cy="7.5" r="1"/>'),
    note: svg('<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>'),
  };
  const FILTER_ICON = svg('<path d="M4 6h16M8 12h8M11 18h2"/>');
  const RESET_ICON = svg('<path d="M4 5v5h5"/><path d="M5.6 16.5A8 8 0 1 0 6 7.2L4 10"/>');
  function empty() { return { status: [], expiry: [], labels: [], note: [] }; }
  function count(filters) { return KEYS.reduce((n, key) => n + (filters[key] || []).length, 0); }
  function config(category, mode) {
    const type = category.type || "individual";
    const statuses = type === "quantity" ? (mode === "leader" ? ["stock", "held"] : ["held"])
      : mode === "leader" ? ["stock", "assigned", "lost", "repair", "disposed"] : ["assigned", "lost", "repair"];
    const groups = [{ key: "status", label: "상태", options: statuses.map(value => ({ value, label: STATUS[value] })) }];
    if (!(category.hiddenFields || []).includes("expiry")) {
      groups.push({ key: "expiry", label: "유효기한", options: Object.entries(EXPIRY).map(([value, label]) => ({ value, label })) });
    }
    groups.push({ key: "labels", label: "태그",
      options: [...(window.DATA.tags || [])].sort((a, b) => a.localeCompare(b, "ko")).map(value => ({ value, label: value })) });
    groups.push({ key: "note", label: "메모", options: [{ value: "has", label: "있음" }, { value: "none", label: "없음" }] });
    return groups;
  }
  function normalize(filters, groups) {
    const result = empty();
    groups.forEach(g => { result[g.key] = (filters[g.key] || []).filter(value => g.options.some(o => o.value === value)); });
    return result;
  }
  function expiryKey(date) {
    if (!date) return "none";
    const days = Math.ceil((new Date(date) - TODAY) / 86400000);
    return days < 0 ? "over" : days <= 7 ? "soon" : "valid";
  }
  // 대시보드와 동일: 축 간 AND, 상태/유효기한/메모 내 OR, 태그는 선택한 태그를 모두 포함.
  function matches(asset, filters) {
    return (!filters.status.length || filters.status.includes(asset.status))
      && (!filters.expiry.length || filters.expiry.includes(expiryKey(asset.expiry)))
      && (!filters.note.length || filters.note.includes(asset.note ? "has" : "none"))
      && filters.labels.every(label => (asset.labels || []).includes(label));
  }
  function buttonHtml(filters) {
    const n = count(filters);
    return `<button type="button" class="mapp-topbar-filter${n ? " active" : ""}" data-mapp-filter-open aria-label="필터${n ? " (적용됨)" : ""}">${FILTER_ICON}</button>`;
  }
  function compactLabel(group, values) {
    const labels = values.map(value => group.options.find(option => option.value === value))
      .filter(Boolean).map(option => option.label);
    if (!labels.length) return "전체";
    return labels.length === 1 ? labels[0] : `${labels[0]} + ${labels.length - 1}`;
  }
  function appliedHtml(filters, groups) {
    if (!count(filters)) return "";
    const chips = groups.filter(g => filters[g.key].length).map(g => {
      const label = compactLabel(g, filters[g.key]);
      return `<span class="mapp-filter-chip">${esc(label)}<button type="button" data-mapp-filter-remove="${g.key}" aria-label="${esc(g.label)} 필터 해제">×</button></span>`;
    });
    return `<div class="mapp-filter-applied"><button type="button" class="mapp-filter-clear" data-mapp-filter-clear aria-label="적용된 필터 전체 초기화">${RESET_ICON}</button>${chips.join("")}</div>`;
  }
  function wireApplied(root, filters, onChange) {
    root.querySelectorAll("[data-mapp-filter-remove]").forEach(b => b.onclick = () => {
      const next = Object.fromEntries(KEYS.map(k => [k, [...filters[k]]]));
      const key = b.dataset.mappFilterRemove;
      next[key] = [];
      onChange(next);
    });
    const clear = root.querySelector("[data-mapp-filter-clear]");
    if (clear) clear.onclick = () => onChange(empty());
  }
  function open({ category, mode, filters, onApply }) {
    const groups = config(category, mode);
    let draft = normalize(filters, groups);
    let selected = null;
    const screen = document.querySelector(".mapp-screen");
    if (!screen || document.querySelector(".mapp-asset-filter")) return;
    const focusBefore = document.activeElement;
    const overflowBefore = screen.style.overflowY;
    const inertBefore = screen.inert;
    screen.inert = true;
    screen.style.overflowY = "hidden";
    const popup = document.createElement("div");
    popup.className = "mapp-asset-filter";
    popup.setAttribute("role", "dialog");
    popup.setAttribute("aria-modal", "true");
    popup.setAttribute("aria-label", "필터");
    popup.innerHTML = `<div class="mapp-filter-header"><h2>필터</h2><button type="button" data-filter-reset aria-label="필터 초기화">${RESET_ICON}<span>초기화</span></button></div>
      <div class="mapp-filter-content"></div>
      <div class="mapp-filter-footer"><button type="button" data-filter-cancel>취소</button><button type="button" data-filter-confirm>확인</button></div>`;
    function align() {
      const r = screen.getBoundingClientRect();
      Object.assign(popup.style, { top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` });
    }
    function close() {
      popup.remove();
      screen.style.overflowY = overflowBefore;
      screen.inert = inertBefore;
      window.removeEventListener("resize", align);
      window.removeEventListener("scroll", align, true);
      document.removeEventListener("keydown", keydown);
      if (focusBefore && focusBefore.isConnected) focusBefore.focus();
    }
    function keydown(event) {
      if (event.key === "Escape") { event.preventDefault(); close(); }
      if (event.key !== "Tab") return;
      const focusable = [...popup.querySelectorAll("button, input")].filter(el => !el.disabled);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    function summary(g) {
      return compactLabel(g, draft[g.key]);
    }
    const content = popup.querySelector(".mapp-filter-content");
    function drawOptions() {
      const g = groups.find(x => x.key === selected);
      const options = g.options;
      const list = popup.querySelector("[data-filter-options]");
      list.innerHTML = options.map(o => `<label class="mapp-filter-option"><input type="checkbox" data-filter-value="${esc(o.value)}"${draft[g.key].includes(o.value) ? " checked" : ""}><span>${esc(o.label)}</span></label>`).join("")
        + (!options.length ? '<p class="mapp-filter-no-options">등록된 태그가 없습니다.</p>' : "");
      list.querySelectorAll("[data-filter-value]").forEach(input => input.onchange = () => {
        const value = input.dataset.filterValue;
        draft[g.key] = input.checked ? [...draft[g.key], value] : draft[g.key].filter(v => v !== value);
      });
    }
    function draw() {
      if (selected === null) {
        content.innerHTML = `<div class="mapp-filter-overview">${groups.map(g => `<button type="button" class="mapp-filter-category" data-filter-category="${g.key}">
          <span class="mapp-filter-category-icon${draft[g.key].length ? " has-value" : ""}">${ICON[g.key]}</span><span class="mapp-filter-category-text"><span>${g.label}</span><strong>${esc(summary(g))}</strong></span><span class="mapp-filter-chevron">›</span></button>`).join("")}</div>`;
        content.querySelectorAll("[data-filter-category]").forEach(b => b.onclick = () => { selected = b.dataset.filterCategory; draw(); });
        content.querySelector("[data-filter-category]").focus();
        return;
      }
      const g = groups.find(x => x.key === selected);
      content.innerHTML = `<nav class="mapp-filter-rail" aria-label="필터 카테고리"><button type="button" data-filter-overview aria-label="카테고리 목록">${ICON.all}</button>${groups.map(x => `<button type="button" class="${x.key === selected ? "active" : ""}" data-filter-nav="${x.key}" aria-label="${x.label}" aria-current="${x.key === selected ? "true" : "false"}">${ICON[x.key]}</button>`).join("")}</nav>
        <section class="mapp-filter-options-panel"><h3>${g.label}</h3><div data-filter-options></div></section>`;
      content.querySelector("[data-filter-overview]").onclick = () => { selected = null; draw(); };
      content.querySelectorAll("[data-filter-nav]").forEach(b => b.onclick = () => { selected = b.dataset.filterNav; draw(); });
      drawOptions();
      content.querySelector(`button[data-filter-nav="${selected}"]`).focus();
    }
    popup.querySelector("[data-filter-reset]").onclick = () => { draft = empty(); draw(); };
    popup.querySelector("[data-filter-cancel]").onclick = close;
    popup.querySelector("[data-filter-confirm]").onclick = () => { close(); onApply(normalize(draft, groups)); };
    document.body.appendChild(popup);
    align();
    window.addEventListener("resize", align);
    window.addEventListener("scroll", align, true);
    document.addEventListener("keydown", keydown);
    draw();
    popup.querySelector("[data-filter-reset]").focus();
  }
  window.MappAssetFilter = { empty, count, config, matches, buttonHtml, appliedHtml, wireApplied, open };
})();
