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
  return '<section class="target-assets" aria-label="배정 자산"><div data-target-tools></div><div data-target-table></div><div data-target-pager></div></section>';
}
  function wireAssetSearch(c) {
  const host=c.querySelector('.target-assets');if(!host)return;
  const name=new URLSearchParams(location.search).get('name')||"김민수";
  window.TargetAssets.wire(host,window.__targetAssetItems||[],id=>'asset-detail.html?id='+id+'&targetType=employee&targetValue='+encodeURIComponent(name));
}

  function render() {
    const name = new URLSearchParams(location.search).get("name") || Object.keys(MEMBER_INFO)[0],
      info = MEMBER_INFO[name] || {}, items = collectItems(name), c = document.getElementById("content"),
      infoTabs = ["기본 정보", "추가 정보", "그룹 및 권한", "근무 정보", "개인 정보", "급여 정보", "자산", "기기 및 앱 정보"];
    c.classList.add("directory-detail");
    c.innerHTML = `
      <div class="detail-topbar"><a href="assets.html" class="backbtn" aria-label="뒤로">←</a></div>
      <div class="mdetail-head">
        <span class="mdetail-avatar" style="background:${avatarColor(name)}">${name[0]}</span>
        <div><h1>${name}</h1><div class="mdetail-sub">${info.jobTitle ? `${info.team} · ${info.jobTitle}` : '<span class="muted">없음</span>'}</div></div>
      </div>
      <nav class="mdetail-tabs" aria-label="구성원 상세 메뉴">
        <span class="mdetail-tab active" aria-current="page">정보</span>
        <span class="mdetail-tab">근태</span>
        <span class="mdetail-tab">업무 <span class="bchev">▾</span></span>
      </nav>
      <section class="mdetail-panel">
        <nav class="mdetail-info-tabs" aria-label="구성원 정보 항목">${infoTabs.map(label => `<span class="mdetail-info-tab${label === '자산' ? ' active' : ''}"${label === '자산' ? ' aria-current="page"' : ''}>${label}</span>`).join('')}</nav>
        <div class="mdetail-body">${assetSectionHtml(items)}</div>
      </section>`;
    wireAssetSearch(c);
  }
  window.MemberDetailScreen = {
    render
  };
})();
