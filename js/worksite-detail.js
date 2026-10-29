(function () {
  const {
      assets
    } = window.DATA,
    STATUS_LABEL = {
      stock: ["배정 가능", "stock"],
      assigned: ["배정 중", "assigned"],
      repair: ["수리/점검 중", "repair"],
      lost: ["분실", "lost"],
      disposed: ["폐기", "disposed"]
    },
    WS_CODE = {
      강남점: "GN-01",
      판교점: "PG-01",
      본사: "HQ-01"
    },
    WS_ADDRESS = {
      강남점: "서울특별시 강남구 테헤란로 129",
      판교점: "경기도 성남시 분당구 판교역로 235",
      본사: "서울특별시 중구 을지로 100"
    },
    AVATAR_WS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20V9.5L12 4l8 5.5V20"/><path d="M9.5 20v-5h5v5"/></svg>';
  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg, t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300", document.body.appendChild(t), setTimeout(() => t.remove(), 1800);
  }
  const WORK_GROUPS = ["개발팀", "디자인팀", "영업팀", "운영팀", "CS팀"],
    CATEGORY_ORDER = new Map(window.DATA.categories.map((c, i) => [c.sub, i]));
  function subOrder(sub) {
    return CATEGORY_ORDER.has(sub) ? CATEGORY_ORDER.get(sub) : 999;
  }
  function collectItems(name) {
    const items = [];
    return assets.forEach(a => {
      (a.assignments || []).forEach(x => {
        x.worksite === name && items.push({
          sub: a.sub,
          qty: 1,
          since: x.since,
          asset: a
        });
      });
    }), items;
  }
  function rowHtml(x, sub) {
    const a = x.asset;
    return `<a class="mdetail-asset-row" data-sub="${sub}" href="asset-detail.html?id=${a.id}" target="_blank" rel="noopener">
        <div><div>${a.product}</div><div class="acard-sub">${a.assetNo || "—"}</div></div>
        <span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>
      </a>`;
  }
  function assetSectionHtml(items) {
  window.__targetAssetItems=items;
  return '<section class="target-assets" aria-label="배정 자산"><div data-target-tools></div><div data-target-table></div><div data-target-pager></div></section>';
}
  function wireAssetSearch(c) {
  const host=c.querySelector('.target-assets');if(!host)return;
  const name=new URLSearchParams(location.search).get('name')||"강남점";
  window.TargetAssets.wire(host,window.__targetAssetItems||[],id=>'asset-detail.html?id='+id+'&targetType=worksite&targetValue='+encodeURIComponent(name));
}

  function render() {
    const name = new URLSearchParams(location.search).get("name") || Object.keys(WS_CODE)[0],
      items = collectItems(name), c = document.getElementById("content"),
      infoTabs = ["기본 정보", "추가 정보", "고급 정보", "자산"];
    c.classList.add("directory-detail");
    c.innerHTML = `
      <div class="detail-topbar"><a href="assets.html" class="backbtn" aria-label="뒤로">←</a></div>
      <div class="mdetail-head">
        <span class="mdetail-avatar ws">${AVATAR_WS_ICON}</span>
        <div><h1>${name}</h1><div class="mdetail-sub">${WS_CODE[name] || '<span class="muted">—</span>'} · ${WS_ADDRESS[name] || '<span class="muted">주소 없음</span>'}</div></div>
      </div>
      <nav class="mdetail-tabs" aria-label="근무지 상세 메뉴">
        <span class="mdetail-tab">근무</span><span class="mdetail-tab">업무</span>
        <span class="mdetail-tab active" aria-current="page">정보</span>
      </nav>
      <section class="mdetail-panel">
        <nav class="mdetail-info-tabs" aria-label="근무지 정보 항목">${infoTabs.map(label => `<span class="mdetail-info-tab${label === '자산' ? ' active' : ''}"${label === '자산' ? ' aria-current="page"' : ''}>${label}</span>`).join('')}</nav>
        <div class="mdetail-body">${assetSectionHtml(items)}</div>
      </section>`;
    wireAssetSearch(c);
  }
  window.WorksiteDetailScreen = {
    render
  };
})();
