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
  return '<section class="target-assets"><h3>자산</h3><div data-target-tools></div><div data-target-table></div><div data-target-pager></div></section>';
}
  function wireAssetSearch(c) {
  const host=c.querySelector('.target-assets');if(!host)return;
  const name=new URLSearchParams(location.search).get('name')||"강남점";
  window.TargetAssets.wire(host,window.__targetAssetItems||[],id=>'asset-detail.html?id='+id+'&targetType=worksite&targetValue='+encodeURIComponent(name));
}

  function render() {
    const name = new URLSearchParams(location.search).get("name") || Object.keys(WS_CODE)[0],
      items = collectItems(name),
      c = document.getElementById("content"),
      TABS = [{
        key: "shift",
        label: "근무"
      }, {
        key: "work",
        label: "업무"
      }, {
        key: "info",
        label: "정보"
      }],
      WORK_SUBTABS = [{
        key: "tam",
        label: "판매 목표"
      }, {
        key: "report",
        label: "보고서",
        dropdown: !0
      }, {
        key: "board",
        label: "게시판",
        dropdown: !0
      }],
      state = {
        tab: "info",
        subtab: "asset",
        openDropdown: null
      };
    function bodyHtml(){return state.tab==='info'?assetSectionHtml(items):'<div class="mdetail-placeholder">이 항목은 자산관리 기능 스코프 밖입니다.</div>';}
    function draw() {
      c.innerHTML = `
        <div class="detail-topbar"><a href="assets.html" class="backbtn" aria-label="뒤로">←</a></div>
        <div class="mdetail-head">
          <span class="mdetail-avatar ws">${AVATAR_WS_ICON}</span>
          <div>
            <h1>${name}</h1>
            <div class="mdetail-sub">${WS_CODE[name] || '<span class="muted">—</span>'} · ${WS_ADDRESS[name] || '<span class="muted">주소 없음</span>'}</div>
          </div>
        </div>
        <div class="mdetail-tabs">
          ${TABS.map(t => `<button class="mdetail-tab ${state.tab === t.key ? "active" : ""}" data-tab="${t.key}">${t.label}</button>`).join("")}
        </div>
        ${state.tab === "work" ? `<div class="mdetail-panel">
          <div class="mdetail-subtabs">
            ${WORK_SUBTABS.map(t => t.dropdown ? `<span class="mdetail-subtab-wrap">
                <button class="mdetail-subtab" data-dropdown="${t.key}">${t.label} <span class="bchev">▾</span></button>
                ${state.openDropdown === t.key ? `<div class="mdetail-group-dropdown">
                  ${WORK_GROUPS.map(g => `<button class="mdetail-group-item" data-group="${g}">${g}</button>`).join("")}
                </div>` : ""}
              </span>` : `<button class="mdetail-subtab ${state.subtab === t.key ? "active" : ""}" data-subtab="${t.key}">${t.label}</button>`).join("")}
          </div>
          <div class="mdetail-body">${bodyHtml()}</div>
        </div>` : `<div class="mdetail-body">${bodyHtml()}</div>`}`, c.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => {
        state.tab = b.dataset.tab, state.tab === "work" && !state.subtab && (state.subtab = "todo"), state.openDropdown = null, draw();
      }), c.querySelectorAll("[data-subtab]").forEach(b => b.onclick = () => {
        state.subtab = b.dataset.subtab, state.openDropdown = null, draw();
      }), c.querySelectorAll("[data-dropdown]").forEach(b => b.onclick = e => {
        e.stopPropagation(), state.openDropdown = state.openDropdown === b.dataset.dropdown ? null : b.dataset.dropdown, draw();
      }), c.querySelectorAll("[data-group]").forEach(b => b.onclick = e => {
        e.stopPropagation(), toast(`"${b.dataset.group}" 그룹 선택 — 실제 이동은 이 프로토타입 범위 밖입니다`), state.openDropdown = null, draw();
      }), wireAssetSearch(c);
    }
    document.addEventListener("click", () => {
      state.openDropdown && (state.openDropdown = null, draw());
    }), draw();
  }
  window.WorksiteDetailScreen = {
    render
  };
})();
