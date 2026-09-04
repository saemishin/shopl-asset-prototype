/* Shared app shell: left LNB + topbar. Only the 자산 menu is live. */
(function () {
  const NAV = [
    { items: [
      { ic: "⌂", label: "홈" },
      { ic: "🗺", label: "지도" },
    ]},
    { items: [
      { ic: "▦", label: "전시현황" },
      { ic: "🏷", label: "브랜드 및 제품" },
      { ic: "🛒", label: "Pre-order" },
    ]},
    { cap: "목표 및 평가", items: [
      { ic: "◎", label: "판매 목표" },
      { ic: "＄", label: "인센티브" },
    ]},
    { cap: "비용", items: [
      { ic: "▤", label: "비용 정산" },
    ]},
    { cap: "승인", items: [
      { ic: "☑", label: "승인" },
    ]},
    { cap: "관리", items: [
      { ic: "◍", label: "구성원" },
      { ic: "⚑", label: "근무지" },
      { ic: "◫", label: "그룹" },
      { ic: "□", label: "자산", href: "assets.html", key: "assets" },
    ]},
    { cap: "설정 및 결제", items: [
      { ic: "⚙", label: "회사 설정" },
      { ic: "⚙", label: "기능 설정" },
      { ic: "▢", label: "결제" },
    ]},
  ];

  function renderShell({ active = "assets", title = "자산" } = {}) {
    const nav = NAV.map(g => {
      const cap = g.cap ? `<div class="cap">${g.cap}</div>` : "";
      const items = g.items.map(it => {
        const live = !!it.href;
        const cls = ["nav-item", it.key === active ? "active" : "", live ? "" : "disabled"].join(" ").trim();
        const tag = live ? "a" : "span";
        const href = live ? ` href="${it.href}"` : "";
        return `<${tag} class="${cls}"${href}><span class="ic">${it.ic}</span>${it.label}</${tag}>`;
      }).join("");
      return `<div class="nav-group">${cap}${items}</div>`;
    }).join("");

    return `
    <aside class="sidebar">
      <div class="brand">
        <span class="logo">shpl</span>
        <span class="co">샤플앤컴퍼니</span>
        <span class="collapse">‹</span>
      </div>
      <nav class="nav">${nav}</nav>
    </aside>
    <div class="main">
      <header class="topbar">
        <span class="t-ic">☰</span>
        <span class="page-title">${title}</span>
        <span class="spacer"></span>
        <span class="t-ic">🔔</span>
        <span class="t-ic">📖</span>
        <span class="t-ic">⬇</span>
        <span class="lang">🌐 한국어</span>
        <span class="avatar">DS</span>
      </header>
      <div class="content" id="content"></div>
    </div>`;
  }

  window.Shell = {
    mount(opts) {
      document.getElementById("app").innerHTML = renderShell(opts);
      return document.getElementById("content");
    },
  };
})();
