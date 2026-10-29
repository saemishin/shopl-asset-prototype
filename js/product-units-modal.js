window.openProductUnitsModal = function (product, items) {
  const CLOSE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    STATUS_LABEL = {
      assigned: "배정 중",
      stock: "배정 가능",
      repair: "수리/점검 중",
      lost: "분실",
      disposed: "폐기"
    };
  function thumb(a) {
    const ph = window.assetPhotos(a);
    return ph.length ? `<span class="thumb" style="background:${ph[a._primary || 0].color}"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="m21 16-5-5-9 8"/></svg></span>` : '<span class="thumb empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-4 4 3 4-4 5 4"/></svg></span>';
  }
  const colsHtml = Object.keys(STATUS_LABEL).map(k => ({
      key: k,
      label: STATUS_LABEL[k],
      list: items.filter(a => a.status === k).sort((a, b) => (a.assetNo || "").localeCompare(b.assetNo || "", "ko"))
    })).map(g => `
    <div class="cat-unit-col">
      <p class="cat-unit-col-label">${g.label} <span class="muted">${g.list.length}</span></p>
      ${g.list.map(a => `
        <a class="cat-unit-no-row" href="asset-detail.html?id=${a.id}" target="_blank" rel="noopener">${a.assetNo || "—"}</a>`).join("")}
    </div>`).join(""),
    m = document.createElement("div");
  m.className = "modal-back", m.innerHTML = `
    <div class="modal units-modal help-modal">
      <div class="help-modal-head">
        <h3>자산 목록</h3>
        <button type="button" class="btn icon-only sm" data-close aria-label="닫기">${CLOSE_ICON}</button>
      </div>
      <div class="body">
        <div class="modal-info-box"><div class="prodcell">${thumb([...items].sort((a, b) => String(a.assetNo || "").localeCompare(String(b.assetNo || ""))).find(a => window.assetPhotos(a).length) || items[0])}<span class="pname cat-unit-product">${product}</span></div></div>
        <div class="cat-unit-list">${colsHtml}</div>
      </div>
    </div>`, document.body.appendChild(m), m.addEventListener("click", e => {
    e.target === m && m.remove();
  }), m.querySelector("[data-close]").onclick = () => m.remove();
};
