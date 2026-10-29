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
    MEMBER_INFO = {
      김민수: {
        team: "개발팀",
        empNo: "2021001",
        phone: "010-2001-1234",
        grade: "Lv.3",
        jobTitle: "매니저"
      },
      이서연: {
        team: "디자인팀",
        empNo: "2021015",
        phone: "010-3412-5678",
        grade: "Lv.2",
        jobTitle: "주임"
      },
      박지훈: {
        team: "영업팀",
        empNo: "2020032",
        phone: "010-8823-9910",
        grade: "Lv.4",
        jobTitle: "팀장"
      },
      정우성: {
        team: "CS팀",
        empNo: "2022041",
        phone: "010-5567-2231",
        grade: "Lv.1",
        jobTitle: "사원"
      },
      김철수: {
        team: "운영팀",
        empNo: "2019008",
        phone: "010-9012-4456",
        grade: "Lv.5",
        jobTitle: "팀장"
      },
      최유진: {
        team: "개발팀",
        empNo: "2023019",
        phone: "010-6634-8821",
        grade: "Lv.1",
        jobTitle: "사원"
      },
      한소희: {
        team: "디자인팀",
        empNo: "2022055",
        phone: "010-4478-2093",
        grade: "Lv.2",
        jobTitle: "주임"
      },
      오세훈: {
        team: "운영팀",
        empNo: "2018014",
        phone: "010-7712-3345",
        grade: "Lv.4",
        jobTitle: "매니저"
      }
    },
    AVATAR_COLORS = ["#5b8def", "#8f6ef0", "#eb7f8b", "#3fb37f", "#e0a63c", "#4dabf7"];
  function avatarColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
  }
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
        x.employee === name && items.push({
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
  const name=new URLSearchParams(location.search).get('name')||"김민수";
  window.TargetAssets.wire(host,window.__targetAssetItems||[],id=>'asset-detail.html?id='+id+'&targetType=employee&targetValue='+encodeURIComponent(name));
}

  function render() {
    const name = new URLSearchParams(location.search).get("name") || Object.keys(MEMBER_INFO)[0],
      info = MEMBER_INFO[name] || {},
      items = collectItems(name),
      c = document.getElementById("content"),
      TABS = [{
        key: "info",
        label: "정보"
      }, {
        key: "attendance",
        label: "근태"
      }, {
        key: "work",
        label: "업무"
      }],
      WORK_SUBTABS = [{
        key: "todo",
        label: "할 일"
      }, {
        key: "report",
        label: "보고서",
        dropdown: !1
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
          <span class="mdetail-avatar" style="background:${avatarColor(name)}">${name[0]}</span>
          <div>
            <h1>${name}</h1>
            <div class="mdetail-sub">${info.jobTitle ? `${info.team} · ${info.jobTitle}` : '<span class="muted">없음</span>'}</div>
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
        if (b.dataset.subtab === "report") {
          toast("해당 구성원의 보고서 화면으로 이동합니다.");
          return;
        }
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
  window.MemberDetailScreen = {
    render
  };
})();
