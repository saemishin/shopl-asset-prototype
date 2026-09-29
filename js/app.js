/* 앱 직원모드 — 화면 중앙에 폰 프레임으로 띄우는 목업. 메뉴 화면(관리 섹션 마지막에 자산 추가) + 자산 화면
   (내 자산·근무지 자산 탭) + 근무지 카드 "전체보기"의 목적지 화면 + 카드 클릭 시 진입하는 자산 상세까지 구현.
   자산 상세는 배정/보유 변경 권한(assign_permission_type, category.js에 저장된 소분류별 값으로 실제 판정)이
   있는 자산에 한해 재배정·배정 추가·반납·분실 신고/회수·수리 접수/완료·폐기·보유 대상 추가/변경/해제·사진
   관리 액션을 제공(자산 관리 권한 소관인 필드 수정·소분류 이동 등은 스코프 밖). 배정 추가·재배정·보유 대상
   추가는 대시보드 모달과 동일한 구성의 바텀시트(openFormSheet, 2026-09-28 — 페이지로 했다가 필드가 적어
   어색해서 되돌림), 상단바 "더보기" 맨 위엔 그 자산의 이력 페이지(asset-history, 조회 전용이라 권한 무관)로
   가는 항목이 항상 있음. 실 앱 화면(근무지 목록/보고서/게시판/근무지 상세 정보탭의 "더보기" 카드 패턴)을
   참고해 리스트 화면 공통 요소를 재현. */
(function () {
  const { assets } = window.DATA;
  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300";
    document.body.appendChild(t); setTimeout(() => t.remove(), 1800);
  }
  const STATUS_LABEL = {
    stock: ["재고", "stock"], assigned: ["배정 중", "assigned"], repair: ["수리 중", "repair"],
    lost: ["분실", "lost"], disposed: ["폐기", "disposed"], held: ["보유 중", "assigned"],
  };
  // assets.js/detail.js와 동일한 기준일(이 프로토타입 전역에서 "오늘"로 취급하는 고정 날짜) — 유효기한
  // 배지 판정·배정일 입력 상한(미래 날짜 불가)을 대시보드와 동일하게 맞추기 위해 이 파일에도 중복 정의
  const TODAY = new Date("2026-09-04");
  function todayStr() {
    const p = n => String(n).padStart(2, "0");
    return `${TODAY.getFullYear()}-${p(TODAY.getMonth() + 1)}-${p(TODAY.getDate())}`;
  }
  // 자산 상세(앱) 정보 섹션 — detail.js의 expiryBadge/chips/memoHtml과 동일 로직(이 파일도 자기 완결적이라 중복 유지)
  function expiryBadge(d) {
    if (!d) return '<span class="muted">—</span>';
    const days = Math.ceil((new Date(d) - TODAY) / 86400000);
    const [t, c] = days < 0 ? ["만료", "exp-over"] : days <= 7 ? ["만료 예정", "exp-soon"] : ["유효", "exp-valid"];
    return `${window.fmtDate(d)} <span class="badge ${c}">${t}</span>`;
  }
  const chips = arr => (arr && arr.length) ? arr.map(l => `<span class="tag">${l}</span>`).join("") : '<span class="muted">—</span>';
  const memoHtml = note => note ? `<span>${note}</span>` : '<span class="muted">—</span>';
  // "나" 페르소나 — 구성원 상세와 동일하게 더미 중 한 명을 기본값으로(?me= 쿼리로 다른 사람도 테스트 가능)
  const ME = new URLSearchParams(location.search).get("me") || "김민수";
  // assets.js/detail.js의 WS_CODE/WS_ADDRESS와 동일 값(이 파일도 자기 완결적이라 중복 유지 — 이 프로토타입 전반의 컨벤션)
  const WS_CODE = { "강남점": "GN-01", "판교점": "PG-01", "본사": "HQ-01" };
  const WS_ADDRESS = {
    "강남점": "서울특별시 강남구 테헤란로 129",
    "판교점": "경기도 성남시 분당구 판교역로 235",
    "본사": "서울특별시 중구 을지로 100",
  };
  // 구성원마다 고정 근무지 1개 + 담당 근무지 여러 개(최대 100개, 프로토타입은 데모용으로 소수만) — 이 매핑
  // 자체가 구조설계안에 없던 새 더미 데이터라 이 파일에만 정의(자산관리 기능이 아니라 근무지 기능 소관이라
  // 실 서비스엔 이미 구성원마다 저장돼 있는 값을 여기선 데모용으로 시드)
  const MY_WORKSITES = {
    "김민수": { fixed: "본사", assigned: ["강남점", "판교점"] },
    "정우성": { fixed: "강남점", assigned: ["본사"] },
  };
  function myWorksites(name) {
    return MY_WORKSITES[name] || { fixed: "본사", assigned: [] };
  }
  // detail.js의 MEMBERS와 동일 값(전사 인원 12명, 프로토타입 데모용 — 이 파일도 자기 완결적이라 중복 유지).
  // 배정 대상 선택 피커(검색: 이름/사번/휴대폰번호)와 배정/보유 변경 권한 판정("특정 그룹 및 직무/직급" 팀
  // 매칭)에 씀. 직무/직급은 구성원별 데이터가 프로토타입에 없어 권한 매칭 대상에서 제외.
  const MEMBERS = [
    { name: "김민수", team: "개발팀", empNo: "2021001", phone: "010-2001-1234" },
    { name: "이서연", team: "디자인팀", empNo: "2021015", phone: "010-3412-5678" },
    { name: "박지훈", team: "영업팀", empNo: "2020032", phone: "010-8823-9910" },
    { name: "정우성", team: "CS팀", empNo: "2022041", phone: "010-5567-2231" },
    { name: "김철수", team: "운영팀", empNo: "2019008", phone: "010-9012-4456" },
    { name: "최유진", team: "개발팀", empNo: "2023019", phone: "010-6634-8821" },
    { name: "한소희", team: "디자인팀", empNo: "2022055", phone: "010-4478-2093" },
    { name: "장민호", team: "국내영업", empNo: "2020018", phone: "010-2345-6712" },
    { name: "오세훈", team: "운영팀", empNo: "2018014", phone: "010-7712-3345" },
    { name: "배수지", team: "CS팀", empNo: "2021028", phone: "010-3356-7789" },
    { name: "윤재현", team: "해외영업", empNo: "2019033", phone: "010-4467-8890" },
    { name: "임하늘", team: "개발팀", empNo: "2022009", phone: "010-5578-9901" },
  ];
  const MEMBER_TEAM = Object.fromEntries(MEMBERS.map(m => [m.name, m.team]));
  // 배정/보유 변경 권한 판정 — 이 자산의 소분류에 분류 관리 화면(category.js)에서 저장된 assign(권한 값)·
  // assignTarget(대상)을 찾아 ME 페르소나가 그 범위에 속하는지 실제로 계산. 프로토타입엔 관리자/리더
  // 여부를 나타내는 필드가 없어 "관리자만"·"모든 관리자 및 리더"는 항상 거부(김민수·정우성 둘 다 일반
  // 직원으로 취급) — 실제 서비스라면 이 두 값도 계정의 관리자/리더 여부로 판정됨.
  function hasAssignPermission(a) {
    const cat = window.DATA.categories.find(c => c.group === a.group && c.sub === a.sub);
    if (!cat) return false;
    switch (cat.assign) {
      case "회사의 모든 구성원": return true;
      case "특정 관리자/리더": return (cat.assignTarget && cat.assignTarget.members || []).includes(ME);
      case "특정 그룹 및 직무/직급": return (cat.assignTarget && cat.assignTarget.groups || []).includes(MEMBER_TEAM[ME]);
      default: return false; // 모든 관리자 및 리더 / 관리자만
    }
  }
  // 프로토타입 데모용 오버라이드(2026-09-27) — 판정 로직(hasAssignPermission)은 그대로 두되, 화면에서는
  // 항상 권한이 있다고 가정하고 액션을 노출. 실제 판정값은 그대로 계산돼 코드·디스크립션엔 남아있으므로,
  // 실 서비스에선 이 상수만 지우면 됨(true로 두면 데모 편의, false로 두면 실제 판정 그대로 동작)
  const DEMO_ASSUME_PERMISSION = true;
  function canManage(a) { return DEMO_ASSUME_PERMISSION || hasAssignPermission(a); }
  // detail.js와 동일한 편집 아이콘(이 파일도 자기 완결적이라 중복 정의)
  const IC_EDIT = `<svg viewBox="0 0 24 24"><path d="M4 20l1-4L16 5l3 3L8 19l-4 1z"/><path d="M13.5 6.5l4 4"/></svg>`;
  // 배정 추가·재배정·보유 대상 추가 페이지와 이력 페이지가 쓰는 대시보드(detail.js) 공용 요소 — 아이콘·아바타·
  // 배정 카드(assignIdentity/typeBadge). 그룹(부서) 표기는 detail.js의 EMP_GROUP(8명만) 대신 MEMBER_TEAM(12명 전부) 사용
  const IC_EMP = `<svg class="hi" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5"/></svg>`;
  const IC_WS = `<svg class="hi" viewBox="0 0 24 24"><path d="M4 20V9.5L12 4l8 5.5V20"/><path d="M9.5 20v-5h5v5"/></svg>`;
  const INFO_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8v.01"/></svg>`;
  const CLOSE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
  const AVATAR_COLORS = ["#5b8def", "#8f6ef0", "#eb7f8b", "#3fb37f", "#e0a63c", "#4dabf7"];
  function avatarColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
  }
  function assignIdentity(x) {
    if (x.employee) {
      return `<span class="acard-avatar" style="background:${avatarColor(x.employee)}">${x.employee[0]}</span>
        <div><div class="acard-name">${x.employee}</div><div class="acard-sub">${MEMBER_TEAM[x.employee] || '<span class="muted">—</span>'}</div></div>`;
    }
    return `<span class="acard-avatar ws"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20V9.5L12 4l8 5.5V20"/><path d="M9.5 20v-5h5v5"/></svg></span>
      <div><div class="acard-name">${x.worksite}</div><div class="acard-sub">${WS_CODE[x.worksite] || '<span class="muted">—</span>'}</div></div>`;
  }
  const typeBadge = x => `<span class="acard-type" title="${x.employee ? "구성원" : "근무지"}">${x.employee ? IC_EMP : IC_WS}</span>`;
  const IC_PERSON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5"/></svg>`;
  const IC_WORKSITE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20V9.5L12 4l8 5.5V20"/><path d="M9.5 20v-5h5v5"/></svg>`;

  // 이 구성원에게 배정(개별형)·보유(수량형)된 자산 — member-detail.js의 collectItems와 동일 로직
  function collectMyItems(name) {
    const items = [];
    assets.forEach(a => {
      if (a.type === "individual") {
        (a.assignments || []).forEach(x => { if (x.employee === name) items.push({ qty: 1, asset: a }); });
      } else {
        (a.stocks || []).forEach(x => { if (x.employee === name) items.push({ qty: x.qty, asset: a }); });
      }
    });
    return items;
  }
  // assets.js의 subOrder()와 동일 — 카드 목록도 대시보드와 같은 규칙(분류순→품목명순→동점 처리)으로 정렬,
  // 다만 모바일 카드 리스트는 소분류 구분 헤더 없이 평평한 목록이라 정렬만 적용하고 그룹 라벨은 안 보여줌
  const CATEGORY_ORDER = new Map(window.DATA.categories.map((c, i) => [c.sub, i]));
  function subOrder(sub) { return CATEGORY_ORDER.has(sub) ? CATEGORY_ORDER.get(sub) : 999; }
  function sortItems(items) {
    return [...items].sort((p, q) => {
      const bySub = subOrder(p.asset.sub) - subOrder(q.asset.sub);
      if (bySub) return bySub;
      const byProduct = p.asset.product.localeCompare(q.asset.product, "ko");
      if (byProduct) return byProduct;
      if (p.asset.type === "individual") return (p.asset.assetNo || "").localeCompare(q.asset.assetNo || "", "ko");
      return q.qty - p.qty;
    });
  }
  // 특정 근무지에 배정(개별형)·보유(수량형)된 자산 전체(정렬 적용) — 근무지 카드의 분류별 카운트 집계와
  // "전체보기"(분류별 자산 목록) 화면이 이 함수를 공유해 동일한 집합/정렬을 보장. sub를 주면 그 소분류로만 필터
  function itemsForWorksite(ws, sub) {
    const items = [];
    assets.forEach(a => {
      if (sub && a.sub !== sub) return;
      if (a.type === "individual") {
        (a.assignments || []).forEach(x => { if (x.worksite === ws) items.push({ qty: 1, asset: a }); });
      } else {
        (a.stocks || []).forEach(x => { if (x.worksite === ws) items.push({ qty: x.qty, asset: a }); });
      }
    });
    return sortItems(items);
  }
  // 소분류 단위 그룹핑 — 대시보드 member-detail.js/worksite-detail.js의 assetSectionHtml과 동일한 구조:
  // 대분류별로 다시 묶지 않고, 소분류마다 헤더 하나("대분류 › 소분류 N")를 flat하게 나열. 내 자산·근무지
  // 자산 화면이 이 그룹 단위를 공유해 "대분류 › 소분류" 표기를 앱 전체에서 통일(2026-09-27)
  function groupItemsBySub(items) {
    const order = [];
    const map = {};
    items.forEach(x => {
      const s = x.asset.sub;
      if (!map[s]) { map[s] = []; order.push(s); }
      map[s].push(x);
    });
    return order.map(sub => ({ sub, group: map[sub][0].asset.group, items: map[sub] }));
  }
  // 근무지 자산 — 이 구성원의 고정+담당 근무지 각각에 배정(개별형)·보유(수량형)된 자산을 모음.
  // 카드 정렬: 고정 근무지가 항상 최상단, 담당 근무지는 근무지명 가나다순(member-detail.js collectItems와
  // 동일한 자산 수집 로직을 근무지 기준으로 적용)
  function collectWorksiteGroups(name) {
    const { fixed, assigned } = myWorksites(name);
    const assignedSorted = [...assigned].sort((a, b) => a.localeCompare(b, "ko"));
    const worksites = [{ ws: fixed, label: "fixed" }, ...assignedSorted.map(ws => ({ ws, label: "assigned" }))];
    return worksites.map(({ ws, label }) => ({ worksite: ws, label, items: itemsForWorksite(ws) }));
  }

  const THUMB_EMPTY = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-4 4 3 4-4 5 4"/></svg>`;
  function cardThumb(a) {
    const photos = window.assetPhotos(a);
    if (photos.length) return `<span class="mapp-thumb" style="background:${photos[a._primary || 0].color}"></span>`;
    return `<span class="mapp-thumb empty">${THUMB_EMPTY}</span>`;
  }
  // 카드 구성 확정: 대표 이미지 / 품목명 / 고유관리번호(개별형) / 상태 뱃지(개별형) 또는 보유 수량(수량형) —
  // 분류 등 나머지 정보는 자산 상세에서 확인하는 것으로 스코프 아웃.
  function assetCardHtml(x) {
    const a = x.asset;
    if (a.type === "individual") {
      return `
        <div class="mapp-card" data-asset-card data-asset-id="${a.id}">
          ${cardThumb(a)}
          <div class="mapp-card-body">
            <div class="mapp-card-title">${a.product}</div>
            <div class="mapp-card-sub">${a.assetNo || "—"}</div>
          </div>
          <span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>
        </div>`;
    }
    return `
      <div class="mapp-card" data-asset-card data-asset-id="${a.id}">
        ${cardThumb(a)}
        <div class="mapp-card-body">
          <div class="mapp-card-title">${a.product}</div>
        </div>
        <span class="badge stock">${x.qty}개</span>
      </div>`;
  }
  // 자산 상세(앱)에서 쓰는 공용 헬퍼 — target({type:"employee"|"worksite", value})이 가리키는 이 자산의
  // 구체적인 배정(개별형)/보유(수량형) 레코드를 찾음. 카드는 항상 target에 해당하는 레코드가 있어야만
  // 노출되므로(내 자산/근무지 자산 수집 로직 자체가 그렇게 필터링), 진입 시점엔 idx가 항상 >=0.
  function findRecord(a, target) {
    const list = a.type === "individual" ? (a.assignments || (a.assignments = [])) : (a.stocks || (a.stocks = []));
    const idx = list.findIndex(x => target.type === "employee" ? x.employee === target.value : x.worksite === target.value);
    return { list, idx };
  }
  function categoryPath(a) { return `${a.group} › ${a.sub}`; }
  // 공동 배정/보유 대상 — target 본인을 뺀 나머지(개별형은 자산당 최대 5건 상한이라 항상 4건 이하, 수량형은
  // 보유 대상 수 제한이 없어 무제한일 수 있음). 정보로만 보여주고 각 행에 재배정/반납 같은 액션은 없음 —
  // 이 화면은 "이 target의 레코드"에만 액션을 주는 원칙을 유지, 공동 대상은 조회 전용(2026-09-27).
  // 정렬은 대시보드 detail.js와 동일: 개별형은 배정일 내림차순(최근 배정이 위), 수량형은 보유 수량
  // 내림차순(많은 대상이 위) — "눈에 보이는 값으로 정렬한다"는 동일 원칙. 수량형은 여러 대상이 섞여
  // 보유 수량이 같을 수 있어 동점 시 보유 대상 이름(가나다순)으로 재정렬(2026-09-29)
  function otherParties(a, target) {
    const list = a.type === "individual" ? (a.assignments || []) : (a.stocks || []);
    const others = list.filter(x => !(target.type === "employee" ? x.employee === target.value : x.worksite === target.value));
    return a.type === "individual"
      ? others.sort((p, q) => p.since === q.since ? 0 : (p.since < q.since ? 1 : -1))
      : others.sort((p, q) => q.qty - p.qty || (p.employee || p.worksite).localeCompare(q.employee || q.worksite, "ko"));
  }
  function partyRowHtml(x, isIndiv) {
    const name = x.employee || x.worksite;
    const kind = x.employee ? "구성원" : "근무지";
    return `
      <div class="mapp-party-row">
        <div><div class="mapp-party-name">${name}</div><div class="mapp-party-kind">${kind}</div></div>
        ${isIndiv ? `<span class="mapp-party-date">${window.fmtDate(x.since)}</span>` : `<span class="badge stock">${x.qty}개</span>`}
      </div>`;
  }
  // 재고⟷배정중/보유중⟷재고는 배정·보유 레코드 존재 여부로 자동 파생(구조설계안 3.3) — 분실 회수·수리
  // 완료 시 되돌아갈 상태, 보유 변경·해제 후 상태 재계산에 공용으로 씀
  function derivedActiveStatus(a) { return (a.assignments || []).length > 0 ? "assigned" : "stock"; }
  function derivedHeldStatus(a) { return (a.stocks || []).reduce((s, x) => s + x.qty, 0) > 0 ? "held" : "stock"; }

  // 상단 탭 UI — 실 서비스 패턴(선택된 탭은 라벨이 있는 넓은 필, 비선택 탭은 아이콘만 있는 작은 정사각형)
  function assetTabsHtml(active) {
    const mineActive = active === "mine";
    return `
      <div class="mapp-seg-tabs">
        <button type="button" class="mapp-seg-tab${mineActive ? " active" : " icon-only"}" data-mapp-asset-tab="mine" aria-label="내 자산">${mineActive ? "내 자산" : IC_PERSON}</button>
        <button type="button" class="mapp-seg-tab${!mineActive ? " active" : " icon-only"}" data-mapp-asset-tab="worksite" aria-label="근무지 자산">${!mineActive ? "근무지 자산" : IC_WORKSITE}</button>
      </div>`;
  }

  function myAssetsScreenHtml(items) {
    const sections = groupItemsBySub(items);
    return `
      <div class="mapp-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        <span class="mapp-topbar-title">자산</span>
      </div>
      ${assetTabsHtml("mine")}
      <div class="mapp-body">
        <div class="mapp-search">
          <input type="text" data-mapp-search placeholder="품목명/고유관리번호">
        </div>
        <div class="mapp-count">전체 <b>${items.length}</b></div>
        ${items.length ? `
          <div data-mapp-card-list>${sections.map(sec => `
            <div class="mapp-cat-section" data-cat-section>
              <button type="button" class="mapp-cat-section-head" data-cat-collapse aria-expanded="true" aria-label="접기/펼치기">
                <span>${sec.group} <span class="mapp-cat-sep">›</span> ${sec.sub}</span>
                <span class="mapp-cat-section-count">${sec.items.length}</span>
                ${CHEV_DOWN}
              </button>
              <div class="mapp-card-list" data-cat-collapsible>${sec.items.map(x => assetCardHtml(x)).join("")}</div>
            </div>`).join("")}</div>
          <p class="mapp-empty" data-mapp-empty hidden>결과가 없습니다.</p>
        ` : `<p class="mapp-empty">배정·보유 중인 자산이 없습니다.</p>`}
      </div>`;
  }
  // 근무지 카드 — 자산 카드를 직접 나열하는 대신 대분류>소분류 목록 + 분류별 자산 개수만 보여줌(2026-09-26).
  // 근무지당 자산 수는 무제한일 수 있어 "최대 5개+전체보기" 상한이 필요했지만, 분류 자체는 회사가 만든
  // 만큼만 존재해 항상 유한하므로 그런 상한 장치가 필요 없어짐. 소분류를 누르면 그 근무지·그 소분류의
  // 자산 목록(worksiteDetailScreenHtml)으로 이동. 고정/담당 라벨은 참고 이미지대로 불릿(●)만, 아이콘 없음.
  // 카드마다 접기/펼치기 가능(기본 펼침) — 분류 목록이 접히는 범위
  const WS_LABEL = { fixed: "● 고정 근무지", assigned: "● 담당 근무지" };
  const CHEV_DOWN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>`;
  // 대시보드와 동일하게 소분류마다 헤더 한 줄("대분류 › 소분류 N") — 대분류로 한 번 더 묶는 중첩 없이
  // flat하게 나열(내 자산과 동일한 구조, 2026-09-27). 다만 그 아래 실제 자산을 바로 나열하지 않고 행 자체를
  // 눌러서 그 근무지·그 소분류의 필터된 목록으로 이동(근무지는 자산 수가 무제한일 수 있어서, 개인 소유인
  // 내 자산과 달리 인라인으로 다 못 보여줌)
  function worksiteCategoryTreeHtml(wsName, items) {
    return groupItemsBySub(items).map(sec => `
      <button type="button" class="mapp-ws-cat-row" data-ws-cat-open data-ws="${wsName}" data-sub="${sec.sub}">
        <span>${sec.group} <span class="mapp-cat-sep">›</span> ${sec.sub}</span>
        <span class="mapp-ws-cat-count">${sec.items.length}<span class="mapp-menu-chev">›</span></span>
      </button>`).join("");
  }
  function worksiteCardHtml(group) {
    return `
      <div class="mapp-ws-card" data-ws-card data-ws-name="${group.worksite}" data-ws-code="${WS_CODE[group.worksite] || ""}" data-ws-address="${WS_ADDRESS[group.worksite] || ""}">
        <div class="mapp-ws-head">
          <div class="mapp-ws-head-main">
            <div class="mapp-ws-label">${WS_LABEL[group.label]}</div>
            <div class="mapp-ws-name">${group.worksite}${WS_CODE[group.worksite] ? `(${WS_CODE[group.worksite]})` : ""}</div>
            <div class="mapp-ws-address">${WS_ADDRESS[group.worksite] || ""}</div>
          </div>
          <button type="button" class="mapp-ws-collapse" data-ws-collapse aria-expanded="true" aria-label="접기/펼치기">${CHEV_DOWN}</button>
        </div>
        <div data-ws-collapsible>
          <div class="mapp-ws-count">전체 <b>${group.items.length}</b></div>
          ${group.items.length
            ? `<div class="mapp-ws-cat-tree">${worksiteCategoryTreeHtml(group.worksite, group.items)}</div>`
            : `<p class="mapp-ws-empty">배정·보유 중인 자산이 없습니다.</p>`}
        </div>
      </div>`;
  }
  function worksiteAssetsScreenHtml(groups) {
    return `
      <div class="mapp-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        <span class="mapp-topbar-title">자산</span>
      </div>
      ${assetTabsHtml("worksite")}
      <div class="mapp-body">
        <div class="mapp-search">
          <input type="text" data-mapp-ws-search placeholder="근무지명/코드/주소">
        </div>
        <div class="mapp-count">전체 <b>${groups.length}</b></div>
        <div class="mapp-ws-list" data-mapp-ws-list>${groups.map(worksiteCardHtml).join("")}</div>
      </div>`;
  }
  // 근무지 카드에서 소분류를 누르면 이동하는 목적지 — 그 근무지의 그 소분류 자산 목록. 타이틀 텍스트 없이
  // 뒤로가기 버튼만(근무지명은 바로 아래 헤더에 표기), 근무지명/코드/주소를 각각 줄바꿔 표시하고 지금 보는
  // 소분류를 그 아래에 덧붙임, 그 아래는 내 자산 탭과 동일한 구성(검색+카운트+카드 리스트, 정렬도 동일)
  function worksiteDetailScreenHtml(ws, sub, items) {
    const group = (window.DATA.categories.find(c => c.sub === sub) || {}).group || "";
    return `
      <div class="mapp-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
      </div>
      <div class="mapp-wsdetail-head">
        <div class="mapp-wsdetail-name">${ws}</div>
        <div class="mapp-wsdetail-code">${WS_CODE[ws] || ""}</div>
        <div class="mapp-wsdetail-address">${WS_ADDRESS[ws] || ""}</div>
        <div class="mapp-wsdetail-sub">${group} <span class="mapp-cat-sep">›</span> ${sub}</div>
      </div>
      <div class="mapp-body">
        <div class="mapp-search">
          <input type="text" data-mapp-search placeholder="품목명/고유관리번호">
        </div>
        <div class="mapp-count">전체 <b>${items.length}</b></div>
        ${items.length ? `
          <div class="mapp-card-list" data-mapp-card-list>${items.map(x => assetCardHtml(x)).join("")}</div>
          <p class="mapp-empty" data-mapp-empty hidden>결과가 없습니다.</p>
        ` : `<p class="mapp-empty">배정·보유 중인 자산이 없습니다.</p>`}
      </div>`;
  }

  // ===== 자산 상세(앱) =====
  // 배정/보유 변경 권한이 있는 소분류의 자산에 한해, 이 카드가 나타내는 구체적인 배정/보유 레코드(target)를
  // 대상으로 액션 수행. 자산 관리 권한(manage_permission_type) 소관인 필드 수정·소분류 이동 등은 스코프 밖
  // (구조설계안 4.1/4.3 — "직원모드"는 배정/보유 변경 권한(assign_permission_type) 대상을 위한 화면).
  function confirmModal(title, body, onOk, danger) {
    const cb = document.createElement("div");
    cb.className = "modal-back";
    cb.style.zIndex = 340;
    cb.innerHTML = `
      <div class="modal" style="width:360px">
        <div class="body" style="padding-top:20px">
          <p style="font-size:14px;font-weight:700;margin-bottom:6px">${title}</p>
          ${body ? `<p class="hint" style="margin-top:0">${body}</p>` : ""}
        </div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn ${danger ? "danger" : "primary"}" data-cok>확인</button>
        </div>
      </div>`;
    cb.addEventListener("click", e => { if (e.target === cb) cb.remove(); });
    cb.querySelector("[data-cclose]").onclick = () => cb.remove();
    cb.querySelector("[data-cok]").onclick = () => { cb.remove(); onOk(); };
    document.body.appendChild(cb);
  }
  function openStatusChangeConfirm(a, title, body, apply, onDone, danger) {
    confirmModal(title, body, () => { apply(); toast("상태가 변경되었습니다."); onDone(); }, danger);
  }
  // 폐기 처리 — 대시보드 detail.js의 openDisposeModal과 동일(되돌릴 수 없는 최종 상태라 자산 삭제와 같은
  // DELETE 입력 확인 패턴). 문구·필드 구성 전부 대시보드와 통일(2026-09-28)
  const WARN_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 9v4M12 16.5h.01M10.3 3.9 2.5 17.5a1.7 1.7 0 0 0 1.47 2.55h16.06a1.7 1.7 0 0 0 1.47-2.55L13.7 3.9a1.7 1.7 0 0 0-2.94 0z"/></svg>`;
  function openDisposeConfirmModal(a, onDone) {
    const cb = document.createElement("div");
    cb.className = "modal-back";
    cb.style.zIndex = 340;
    cb.innerHTML = `
      <div class="modal" style="width:380px">
        <h3>폐기 처리하시겠습니까?</h3>
        <div class="body">
          <div class="danger-note">${WARN_ICON}<span>폐기 처리하면 되돌릴 수 없습니다. 기존 배정은 자동으로 종료되며, 이후 배정 추가·자산 수정이 제한됩니다.</span></div>
          <div class="field" style="margin-top:14px;margin-bottom:0">
            <input type="text" data-del-input placeholder="입력">
          </div>
          <p class="muted" style="margin-top:6px">박스에 DELETE를 입력하면 [확인] 버튼이 활성화됩니다.</p>
        </div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn danger" data-cok disabled>확인</button>
        </div>
      </div>`;
    cb.addEventListener("click", e => { if (e.target === cb) cb.remove(); });
    cb.querySelector("[data-cclose]").onclick = () => cb.remove();
    const input = cb.querySelector("[data-del-input]");
    const okBtn = cb.querySelector("[data-cok]");
    const confirmed = () => input.value.trim().toUpperCase() === "DELETE";
    input.addEventListener("input", () => { okBtn.disabled = !confirmed(); });
    okBtn.onclick = () => {
      if (!confirmed()) return;
      const before = STATUS_LABEL[a.status][0];
      a.status = "disposed";
      a.assignments = [];
      logActivity(a, { script: "상태 변경: 폐기 처리", before, after: STATUS_LABEL[a.status][0] });
      cb.remove();
      toast("폐기 처리되었습니다.");
      onDone();
    };
    document.body.appendChild(cb);
    input.focus();
  }
  // ===== 활동 로그(이력) — detail.js와 동일한 스키마·로직(구조설계안 5.5) =====
  // 엔트리: { d(수정한 일시), script("그룹: 세부"), target?(구성원/근무지 레코드), before?/after?, who(수정한 사람) }.
  // 초기 베이스라인은 자산의 현재 상태로부터 세션당 한 번만 만들어지고(asset-detail 첫 렌더에서 시드 — 조작 전 상태가
  // 정확히 남도록), 이후 앱에서 수행하는 배정·보유·상태 변경·메모 수정은 여기 append(수정한 사람은 ME)
  function activityOf(a) {
    const ev = [{ d: `${a.createdAt || a.purchaseDate || "2024-01-01"} 09:00`, script: "자산 등록", who: "dana" }];
    (a.assignments || []).forEach(x => ev.push({
      d: `${x.since} 09:00`, script: "배정 관리: 신규 배정", target: x, before: "", after: window.fmtDate(x.since), who: "dana",
    }));
    (a.stocks || []).forEach(x => ev.push({
      d: `${a.purchaseDate || "2025-01-01"} 09:00`, script: "보유 관리: 보유 대상 추가", target: x, before: "", after: `${x.qty}개`, who: "dana",
    }));
    if (a.status === "repair") ev.push({ d: "2026-08-14 09:00", script: "상태 변경: 수리 접수", before: "배정 중", after: "수리 중", who: "dana" });
    if (a.status === "lost") ev.push({ d: "2026-07-21 09:00", script: "상태 변경: 분실 신고", before: "배정 중", after: "분실", who: "정우성" });
    if (a.status === "disposed") ev.push({ d: "2025-12-30 09:00", script: "상태 변경: 폐기 처리", before: "배정 중", after: "폐기", who: "dana" });
    if (a.note) ev.push({ d: "2026-06-02 09:00", script: "자산 정보 수정: 메모 수정", before: "", after: a.note, who: "dana" });
    return ev.sort((x, y) => (x.d < y.d ? 1 : -1));
  }
  function activityLog(a) {
    if (!a._activityLog) a._activityLog = activityOf(a);
    return a._activityLog;
  }
  // 실제 조작 시각 — 날짜는 고정 데모 날짜(TODAY), 시:분만 실제 클릭 시각(detail.js nowStr와 동일)
  function nowStr() {
    const p = n => String(n).padStart(2, "0");
    const real = new Date();
    return `${todayStr()} ${p(real.getHours())}:${p(real.getMinutes())}`;
  }
  function logActivity(a, entry) {
    activityLog(a).unshift({ d: nowStr(), who: ME, ...entry });
  }
  // 이력 카드 1건 — 대상 이름은 기존/변경 값에 포함, 값이 "없음"인 쪽엔 대상 이름을 안 붙임(detail.js historyCardHtml과 동일)
  function historyCardHtml(e) {
    const val = v => v || "없음";
    const targetName = e.target ? (e.target.employee || e.target.worksite) : null;
    const targetMark = e.target
      ? (e.target.employee
          ? `<span class="hval-avatar" style="background:${avatarColor(e.target.employee)}">${e.target.employee[0]}</span>`
          : IC_WS)
      : "";
    const withTarget = v => (targetName && v) ? `${targetMark}${targetName} · ${val(v)}` : val(v);
    return `
      <div class="hcard">
        <div class="hcard-head">
          <span class="hcard-time">${window.fmtDateTime(e.d)}</span>
          <span class="hcard-avatar" style="background:${avatarColor(e.who)}">${e.who[0]}</span>
          <span class="hcard-who">${e.who}</span>
        </div>
        <div class="hcard-script">${e.script}</div>
        ${"before" in e ? `
          <div class="hcard-diff">
            <div class="hcard-row"><span class="hcard-tag old">기존</span><span class="hcard-val">${withTarget(e.before)}</span></div>
            <div class="hcard-row"><span class="hcard-tag new">변경</span><span class="hcard-val">${withTarget(e.after)}</span></div>
          </div>` : ""}
      </div>`;
  }
  // query가 있으면 수정 대상(구성원/근무지) 이름으로 필터 — 수량형 이력 전용(개별형은 검색 없음)
  function timelineHtml(a, query) {
    const q = (query || "").trim().toLowerCase();
    const entries = activityLog(a).filter(e => {
      if (!q) return true;
      const name = e.target ? (e.target.employee || e.target.worksite || "") : "";
      return name.toLowerCase().includes(q);
    });
    if (!entries.length) return '<p class="muted" style="padding:6px 0">일치하는 이력이 없습니다</p>';
    return `<div class="dtimeline">${entries.map(historyCardHtml).join("")}</div>`;
  }
  // 이력 페이지 — 더보기 메뉴 "이력 보기"의 목적지. 대시보드 이력 탭과 동일한 구성(카드 목록, 수량형은 구성원·
  // 근무지 이름 검색 추가). 조회 전용이라 배정/보유 변경 권한과 무관하게 항상 열림
  function historyScreenHtml(a) {
    return `
      <div class="mapp-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        <span class="mapp-topbar-title">이력</span>
      </div>
      <div class="mapp-body">
        ${a.type === "quantity" ? `<div class="mapp-search"><input type="text" data-history-q placeholder="구성원·근무지 이름으로 검색"></div>` : ""}
        <div data-history-list>${timelineHtml(a, "")}</div>
      </div>`;
  }

  // ===== 날짜 입력·대상 선택 피커 — detail.js와 동일 컴포넌트(이 파일도 자기 완결적이라 중복 유지) =====
  // YYYY.MM.DD 텍스트 마스킹(8자리 숫자만) + 달력 아이콘(네이티브 피커, 미래 날짜 선택 제한). 범위를 벗어나면
  // (자릿수·연도·월·일·미래 날짜) 에러 문구 없이 저장 버튼만 비활성.
  const IC_CAL = `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`;
  function dateFieldHtml(initialIso) {
    const disp = initialIso ? initialIso.replace(/-/g, ".") : "";
    return `
      <div class="dfield">
        <input type="text" inputmode="numeric" data-dtext placeholder="YYYY.MM.DD" maxlength="10" value="${disp}">
        <span class="dfield-pick">${IC_CAL}<input type="date" data-dnative tabindex="-1"></span>
      </div>`;
  }
  function wireDateField(scope, maxIso, onChange) {
    const text = scope.querySelector("[data-dtext]");
    const native = scope.querySelector("[data-dnative]");
    native.max = maxIso;
    const digitsOf = v => v.replace(/\D/g, "").slice(0, 8);
    const format = d => d.length > 6 ? `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6)}`
                       : d.length > 4 ? `${d.slice(0, 4)}.${d.slice(4)}` : d;
    const getValue = () => {
      const d = digitsOf(text.value);
      if (d.length !== 8) return null;
      const y = d.slice(0, 4), m = d.slice(4, 6), dd = d.slice(6, 8);
      const curYear = TODAY.getFullYear();
      if (+y < curYear - 100 || +y > curYear) return null;
      if (+m < 1 || +m > 12) return null;
      if (+dd < 1 || +dd > 31) return null;
      const iso = `${y}-${m}-${dd}`;
      return iso > maxIso ? null : iso;
    };
    text.addEventListener("input", () => { text.value = format(digitsOf(text.value)); onChange(); });
    native.addEventListener("change", () => {
      if (native.value) text.value = native.value.replace(/-/g, ".");
      onChange();
    });
    return getValue;
  }
  // 구성원 선택 — 단일 선택(라디오), 검색(이름/사번/휴대폰번호)+목록. 2차 팝업(.modal.sm)
  function openAssignMemberPicker(initial, onApply, exclude) {
    let picked = initial;
    let query = "";
    const excludeNames = [].concat(exclude || []).filter(Boolean);
    const p = document.createElement("div");
    p.className = "modal-back";
    p.style.zIndex = 340;
    p.innerHTML = `
      <div class="modal sm">
        <h3>구성원 선택</h3>
        <div class="body" style="display:flex;flex-direction:column;max-height:56vh">
          <input type="text" class="picker-search" placeholder="이름/사번/휴대폰번호">
          <div data-list style="flex:1;min-height:0;overflow-y:auto;margin-top:8px"></div>
        </div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" data-ok>적용</button>
        </div>
      </div>`;
    document.body.appendChild(p);
    const list = p.querySelector("[data-list]");
    function renderList() {
      const q = query.trim().toLowerCase();
      const filtered = MEMBERS.filter(m => !excludeNames.includes(m.name) && (!q || m.name.includes(q) || m.empNo.includes(q) || m.phone.includes(q)));
      list.innerHTML = filtered.length ? filtered.map(m => `
        <label class="picker-member-row">
          <input type="radio" name="aa-member" value="${m.name}"${picked === m.name ? " checked" : ""}>
          <span class="picker-avatar" style="background:${avatarColor(m.name)}">${m.name[0]}</span>
          <span class="picker-member-info"><b>${m.name}</b><span>${m.team}</span></span>
        </label>`).join("") : `<p class="muted" style="padding:16px 0">결과가 없습니다.</p>`;
      list.querySelectorAll('input[name="aa-member"]').forEach(r => r.onchange = () => { picked = r.value; });
    }
    p.querySelector(".picker-search").addEventListener("input", e => { query = e.target.value; renderList(); });
    renderList();
    p.addEventListener("click", e => { if (e.target === p) p.remove(); });
    p.querySelector("[data-close]").onclick = () => p.remove();
    p.querySelector("[data-ok]").onclick = () => { p.remove(); onApply(picked); };
  }
  // 근무지 선택 — 검색(근무지명/코드)+목록
  function openAssignWorksitePicker(initial, onApply, exclude) {
    let picked = initial;
    let query = "";
    const excludeNames = [].concat(exclude || []).filter(Boolean);
    const p = document.createElement("div");
    p.className = "modal-back";
    p.style.zIndex = 340;
    p.innerHTML = `
      <div class="modal sm">
        <h3>근무지 선택</h3>
        <div class="body" style="display:flex;flex-direction:column;max-height:56vh">
          <input type="text" class="picker-search" placeholder="근무지명/코드">
          <div data-list style="flex:1;min-height:0;overflow-y:auto;margin-top:8px"></div>
        </div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" data-ok>적용</button>
        </div>
      </div>`;
    document.body.appendChild(p);
    const list = p.querySelector("[data-list]");
    function renderList() {
      const q = query.trim().toLowerCase();
      const filtered = Object.keys(WS_CODE).filter(name => !excludeNames.includes(name) && (!q || name.toLowerCase().includes(q) || WS_CODE[name].toLowerCase().includes(q)));
      list.innerHTML = filtered.length ? filtered.map(name => `
        <label class="picker-member-row">
          <input type="radio" name="aa-worksite" value="${name}"${picked === name ? " checked" : ""}>
          <span class="picker-member-info"><b>${name}</b><span>${WS_CODE[name]}</span></span>
        </label>`).join("") : `<p class="muted" style="padding:16px 0">결과가 없습니다.</p>`;
      list.querySelectorAll('input[name="aa-worksite"]').forEach(r => r.onchange = () => { picked = r.value; });
    }
    p.querySelector(".picker-search").addEventListener("input", e => { query = e.target.value; renderList(); });
    renderList();
    p.addEventListener("click", e => { if (e.target === p) p.remove(); });
    p.querySelector("[data-close]").onclick = () => p.remove();
    p.querySelector("[data-ok]").onclick = () => { p.remove(); onApply(picked); };
  }

  // ===== 배정 추가·재배정·보유 대상 추가 — 바텀시트(2026-09-28, 페이지였다가 필드가 적어 어색해서 되돌림) =====
  // 구성요소·문구는 대시보드 모달(detail.js openAssignAddModal/openReassignModal/openHoldAddModal)과 동일: 대상
  // 라디오(구성원/근무지)+"선택 ›"→피커(그 위에 겹쳐 뜸, 실 앱의 액션시트 위 모달 패턴과 동일), 배정일 또는
  // 보유 수량 스테퍼, 저장 시 확인 팝업. kind로 세 가지를 분기. 재배정은 기존 배정 카드(읽기전용)+안내 문구가
  // 위에 붙고 새 대상 후보에서 현재 대상을 제외, 보유 대상 추가는 이미 보유 중인 대상 전체를 후보에서 제외
  // (detail.js와 동일 규칙)
  const FORM_CFG = {
    "assign-add": { title: "배정 추가", targetLabel: "배정 대상", confirm: "배정을 추가하시겠습니까?" },
    "reassign": { title: "재배정", targetLabel: "새 배정 대상", confirm: "재배정하시겠습니까?" },
    "hold-add": { title: "보유 대상 추가", targetLabel: "보유 대상", confirm: "보유 대상을 추가하시겠습니까?" },
  };
  function openFormSheet(a, target, kind, afterMutate) {
    const cfg = FORM_CFG[kind];
    const f = { picked: null, draft: { employee: null, worksite: null }, dateText: "", qtyText: "" };
    const old = kind === "reassign" ? a.assignments[findRecord(a, target).idx] : null;
    const heldNames = kind === "hold-add" ? (a.stocks || []).map(x => x.employee || x.worksite) : [];
    const remaining = kind === "hold-add" ? a.totalQty - (a.stocks || []).reduce((s, x) => s + x.qty, 0) : 0;

    const back = document.createElement("div");
    back.className = "mapp-sheet-back";
    back.innerHTML = `
      <div class="mapp-sheet">
        <div class="mapp-sheet-head">${cfg.title}</div>
        <div class="mapp-sheet-body" data-form-body></div>
        <div class="mapp-sheet-foot">
          <button type="button" class="btn" data-form-cancel>취소</button>
          <button type="button" class="btn primary" data-form-save disabled>저장</button>
        </div>
      </div>`;
    document.body.appendChild(back);
    const body = back.querySelector("[data-form-body]");
    const saveBtn = back.querySelector("[data-form-save]");
    let getDate = () => null;
    const qtyVal = () => { const n = parseInt(f.qtyText, 10); return Number.isFinite(n) ? n : null; };
    const targetSummaryHtml = k => {
      const val = f.draft[k];
      if (!val) return `<button type="button" class="perm-target-btn" data-target-open><span class="muted">선택</span><span class="chev">›</span></button>`;
      const avatar = k === "employee" ? `<span class="picker-avatar sm" style="background:${avatarColor(val)}">${val[0]}</span>` : "";
      return `
        <div class="aa-target-selected" data-target-open>
          ${avatar}<span class="perm-chip">${val}</span>
          <button type="button" class="aa-target-x" data-target-clear aria-label="선택 해제">${CLOSE_ICON}</button>
        </div>`;
    };
    const updateSaveState = () => {
      const hasTarget = !!(f.picked && f.draft[f.picked]);
      if (kind === "hold-add") { const v = qtyVal(); saveBtn.disabled = !(hasTarget && v !== null && v >= 1 && v <= remaining); }
      else saveBtn.disabled = !(hasTarget && getDate());
    };
    function drawBody() {
      body.innerHTML = `
        ${old ? `
          <div class="ra-current">
            <div class="perm-info-note">${INFO_ICON}<span>기존 배정이 새 대상으로 교체됩니다.</span></div>
            <div class="acard">
              ${typeBadge(old)}
              <div class="acard-id">${assignIdentity(old)}</div>
              <div class="acard-foot"><span class="acard-date">배정일 <b>${window.fmtDate(old.since)}</b></span></div>
            </div>
          </div>` : ""}
        <div class="field">
          <label>${cfg.targetLabel}</label>
          <label class="radio-row"><input type="radio" name="form-kind" value="employee"${f.picked === "employee" ? " checked" : ""}><span>구성원</span></label>
          ${f.picked === "employee" ? `<div class="perm-target-wrap">${targetSummaryHtml("employee")}</div>` : ""}
          <label class="radio-row"><input type="radio" name="form-kind" value="worksite"${f.picked === "worksite" ? " checked" : ""}><span>근무지</span></label>
          ${f.picked === "worksite" ? `<div class="perm-target-wrap">${targetSummaryHtml("worksite")}</div>` : ""}
        </div>
        ${kind === "hold-add" ? `
          <div class="field">
            <label>보유 수량</label>
            <div class="qty-stepper">
              <button type="button" class="qty-step" data-qminus aria-label="수량 감소">－</button>
              <input type="text" inputmode="numeric" data-qinput placeholder="입력" value="">
              <button type="button" class="qty-step" data-qplus aria-label="수량 증가">＋</button>
            </div>
            <div class="acard-sub" style="margin-top:5px">잔여 수량 <b>${remaining}개</b></div>
          </div>` : `
          <div class="field">
            <label>${kind === "reassign" ? "새 배정일" : "배정일"}</label>
            ${dateFieldHtml("")}
          </div>`}`;

      body.querySelectorAll('input[name="form-kind"]').forEach(r => r.onchange = () => { f.picked = r.value; drawBody(); });
      const openBtn = body.querySelector("[data-target-open]");
      if (openBtn) openBtn.onclick = () => {
        const exclude = kind === "reassign" ? (f.picked === "employee" ? old.employee : old.worksite) : kind === "hold-add" ? heldNames : null;
        if (f.picked === "employee") openAssignMemberPicker(f.draft.employee, v => { f.draft.employee = v; drawBody(); }, exclude);
        else openAssignWorksitePicker(f.draft.worksite, v => { f.draft.worksite = v; drawBody(); }, exclude);
      };
      const clearBtn = body.querySelector("[data-target-clear]");
      if (clearBtn) clearBtn.onclick = e => { e.stopPropagation(); f.draft[f.picked] = null; drawBody(); };

      if (kind === "hold-add") {
        const qinput = body.querySelector("[data-qinput]");
        const minus = body.querySelector("[data-qminus]");
        const plus = body.querySelector("[data-qplus]");
        if (f.qtyText) qinput.value = f.qtyText;
        const syncQty = () => {
          const v = qtyVal();
          minus.disabled = v === null || v <= 1;
          plus.disabled = v !== null && v >= remaining;
          updateSaveState();
        };
        qinput.addEventListener("input", () => { qinput.value = qinput.value.replace(/[^0-9]/g, ""); f.qtyText = qinput.value; syncQty(); });
        minus.onclick = () => { const v = qtyVal(); if (v !== null && v > 1) { qinput.value = v - 1; f.qtyText = qinput.value; syncQty(); } };
        plus.onclick = () => { const v = qtyVal() ?? 0; if (v < remaining) { qinput.value = v + 1; f.qtyText = qinput.value; syncQty(); } };
        syncQty();
      } else {
        const dtext = body.querySelector("[data-dtext]");
        if (f.dateText) dtext.value = f.dateText;
        getDate = wireDateField(body, todayStr(), () => { f.dateText = dtext.value; updateSaveState(); });
        updateSaveState();
      }
    }
    drawBody();

    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-form-cancel]").onclick = () => back.remove();
    saveBtn.onclick = () => {
      if (saveBtn.disabled) return;
      const who = f.draft[f.picked];
      const mk = extra => f.picked === "employee" ? { employee: who, worksite: null, ...extra } : { employee: null, worksite: who, ...extra };
      if (kind === "assign-add") {
        const d = getDate();
        const record = mk({ since: d });
        confirmModal(cfg.confirm, "", () => {
          back.remove();
          (a.assignments || (a.assignments = [])).push(record);
          // 재고⟷배정중만 배정/반납으로 자동 파생(수리중·분실·폐기는 배정 여부와 무관하게 별도 관리)
          if (a.status === "stock") a.status = "assigned";
          logActivity(a, { script: "배정 관리: 신규 배정", target: record, before: "", after: window.fmtDate(d) });
          toast("추가되었습니다.");
          afterMutate();
        });
      } else if (kind === "reassign") {
        const d = getDate();
        const record = mk({ since: d });
        confirmModal(cfg.confirm, "", () => {
          back.remove();
          // 반납+신규배정이 아니라 기존 활성 레코드의 대상 자체를 그 자리에서 교체(구조설계안 2.3). target을
          // 특정 한쪽으로 고정할 수 없어 before/after 텍스트로 표현(detail.js와 동일)
          const idx = findRecord(a, target).idx;
          const beforeLabel = `${old.employee || old.worksite} · ${window.fmtDate(old.since)}`;
          const afterLabel = `${record.employee || record.worksite} · ${window.fmtDate(d)}`;
          a.assignments[idx] = record;
          logActivity(a, { script: "배정 관리: 재배정", before: beforeLabel, after: afterLabel });
          toast("재배정되었습니다.");
          afterMutate();
        });
      } else {
        const v = qtyVal();
        const record = mk({ qty: v });
        confirmModal(cfg.confirm, "", () => {
          back.remove();
          (a.stocks || (a.stocks = [])).push(record);
          a.status = derivedHeldStatus(a);
          logActivity(a, { script: "보유 관리: 보유 대상 추가", target: record, before: "", after: `${v}개` });
          toast("추가되었습니다.");
          afterMutate();
        });
      }
    };
  }
  function openReturnConfirm(a, idx, onDone) {
    confirmModal("반납하시겠습니까?", "반납하면 배정에서 제거됩니다.", () => {
      const old = a.assignments[idx];
      a.assignments.splice(idx, 1);
      a.status = derivedActiveStatus(a);
      logActivity(a, { script: "배정 관리: 반납", target: old, before: window.fmtDate(old.since), after: "" });
      toast("반납되었습니다.");
      onDone();
    });
  }
  function openQtyChangeModal(a, idx, onDone) {
    const rec = a.stocks[idx];
    const cur = rec.qty;
    const others = a.stocks.reduce((s, x, i) => i === idx ? s : s + x.qty, 0);
    const max = a.totalQty - others;
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal" style="width:340px">
        <div class="body" style="padding-top:20px">
          <p style="font-size:14px;font-weight:700;margin-bottom:14px">수량 변경</p>
          <input type="number" data-qty-input min="0" max="${max}" value="${rec.qty}" style="width:100%;height:40px;border:1px solid var(--line-strong);border-radius:8px;padding:0 10px">
          <p class="hint" style="margin-top:6px">잔여 수량 포함 최대 ${max}개까지 입력 가능</p>
        </div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn primary" data-cok>변경</button>
        </div>
      </div>`;
    document.body.appendChild(back);
    const qtyInput = back.querySelector("[data-qty-input]");
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-cclose]").onclick = () => back.remove();
    back.querySelector("[data-cok]").onclick = () => {
      const qty = Number(qtyInput.value);
      if (!(qty >= 0 && qty <= max)) return;
      back.remove();
      confirmModal("수량을 변경하시겠습니까?", "", () => {
        rec.qty = qty;
        a.status = derivedHeldStatus(a);
        logActivity(a, { script: "보유 관리: 보유 수량 변경", target: rec, before: `${cur}개`, after: `${qty}개` });
        toast("변경되었습니다.");
        onDone();
      });
    };
  }
  function openHoldReleaseConfirm(a, idx, onDone) {
    confirmModal("보유 대상에서 해제하시겠습니까?", "해제된 수량은 잔여 수량으로 돌아갑니다.", () => {
      const x = a.stocks[idx];
      const qty = x.qty;
      a.stocks.splice(idx, 1);
      a.status = derivedHeldStatus(a);
      logActivity(a, { script: "보유 관리: 보유 대상 해제", target: x, before: `${qty}개`, after: "" });
      toast("해제되었습니다.");
      onDone();
    });
  }
  // 사진 관리 — asset-register.js의 사진 타일 UI·데이터 형태(window.assetPhotos, a._photos/a._primary)를
  // 그대로 재사용(같은 CSS 클래스 .areg-photo-*는 전역 css/app.css에 이미 정의돼 있어 추가 CSS 불필요)
  const PHOTO_COLORS = ["#5b8def", "#8f6ef0", "#eb7f8b", "#3fb37f", "#e0a63c", "#4dabf7", "#c2554e", "#3f9ba0", "#9a6bd6", "#5aa06a"];
  const CLOSE_ICON_SM = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
  function openPhotoManageModal(a, onDone) {
    const photos = window.assetPhotos(a).map(p => ({ ...p }));
    let primaryIdx = a._primary || 0;
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal" style="width:360px">
        <div class="body" style="padding-top:20px">
          <p style="font-size:14px;font-weight:700;margin-bottom:14px">자산 사진</p>
          <div class="areg-photo-row" data-photo-row></div>
        </div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn primary" data-cok>저장</button>
        </div>
      </div>`;
    document.body.appendChild(back);
    const row = back.querySelector("[data-photo-row]");
    function renderPhotos() {
      const tiles = photos.map((p, i) => `
        <button type="button" class="areg-photo-tile${i === primaryIdx ? " primary" : ""}" data-photo-i="${i}" style="background:${p.color}" aria-label="사진 ${i + 1}${i === primaryIdx ? " (대표)" : ""}">
          ${i === primaryIdx ? '<span class="areg-photo-star">★</span>' : ""}
          <span class="areg-photo-del" data-photo-del="${i}" aria-label="삭제">${CLOSE_ICON_SM}</span>
        </button>`).join("");
      const addTile = photos.length < 10 ? `<button type="button" class="areg-photo-add" data-photo-add aria-label="사진 추가">+</button>` : "";
      row.innerHTML = tiles + addTile;
      row.querySelectorAll("[data-photo-i]").forEach(b => b.onclick = e => {
        if (e.target.closest("[data-photo-del]")) return;
        primaryIdx = +b.dataset.photoI; renderPhotos();
      });
      row.querySelectorAll("[data-photo-del]").forEach(b => b.onclick = e => {
        e.stopPropagation();
        const i = +b.dataset.photoDel;
        photos.splice(i, 1);
        if (!photos.length) primaryIdx = 0; else if (primaryIdx >= photos.length) primaryIdx = photos.length - 1;
        renderPhotos();
      });
      const addBtn = row.querySelector("[data-photo-add]");
      if (addBtn) addBtn.onclick = () => {
        photos.push({ color: PHOTO_COLORS[photos.length % PHOTO_COLORS.length], at: `${todayStr()} 00:00`, by: ME });
        if (photos.length === 1) primaryIdx = 0;
        renderPhotos();
      };
    }
    renderPhotos();
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-cclose]").onclick = () => back.remove();
    back.querySelector("[data-cok]").onclick = () => {
      back.remove();
      a._photos = photos;
      a._primary = primaryIdx;
      toast("저장되었습니다.");
      onDone();
    };
  }
  function openMemoEditModal(a, onDone) {
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal" style="width:360px">
        <div class="body" style="padding-top:20px">
          <p style="font-size:14px;font-weight:700;margin-bottom:10px">메모 수정</p>
          <textarea data-memo-input maxlength="500" placeholder="메모를 입력하세요" style="width:100%;min-height:120px;border:1px solid var(--line-strong);border-radius:8px;padding:10px;font:inherit;resize:vertical">${a.note || ""}</textarea>
        </div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn primary" data-cok>저장</button>
        </div>
      </div>`;
    document.body.appendChild(back);
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-cclose]").onclick = () => back.remove();
    back.querySelector("[data-cok]").onclick = () => {
      const before = a.note || "";
      const after = back.querySelector("[data-memo-input]").value.trim();
      back.remove();
      if (after === before) return;
      a.note = after;
      logActivity(a, { script: "자산 정보 수정: 메모 수정", before: before || "없음", after: after || "없음" });
      toast("저장되었습니다.");
      onDone();
    };
  }
  // 자산 사진 뷰어 — 조회 전용(편집은 "사진 관리" 액션에서), 조회 권한만 있어도 볼 수 있어야 해서 배정/보유
  // 변경 권한과 무관하게 항상 열 수 있음. 대시보드 detail.js의 openViewer를 단순화(줌·정보패널·수정메뉴 없이
  // 넘기기+닫기만) — 폰 프레임에 맞는 전체화면 뷰어
  function openPhotoViewer(a) {
    const items = window.assetPhotos(a);
    if (!items.length) return;
    let cur = a._primary || 0;
    const back = document.createElement("div");
    back.className = "mapp-viewer-back";
    back.innerHTML = `
      <div class="mapp-viewer-bar">
        <span class="mapp-viewer-count"></span>
        <button type="button" class="mapp-viewer-close" data-vclose aria-label="닫기">✕</button>
      </div>
      <div class="mapp-viewer-stage">
        <button type="button" class="mapp-viewer-nav" data-vprev aria-label="이전">‹</button>
        <div class="mapp-viewer-img"></div>
        <button type="button" class="mapp-viewer-nav" data-vnext aria-label="다음">›</button>
      </div>`;
    document.body.appendChild(back);
    const img = back.querySelector(".mapp-viewer-img");
    const countEl = back.querySelector(".mapp-viewer-count");
    const prevBtn = back.querySelector("[data-vprev]");
    const nextBtn = back.querySelector("[data-vnext]");
    function draw() {
      img.style.background = items[cur].color;
      countEl.textContent = `${cur + 1} / ${items.length}`;
      prevBtn.hidden = nextBtn.hidden = items.length < 2;
    }
    prevBtn.onclick = () => { cur = (cur - 1 + items.length) % items.length; draw(); };
    nextBtn.onclick = () => { cur = (cur + 1) % items.length; draw(); };
    back.querySelector("[data-vclose]").onclick = () => back.remove();
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    draw();
  }
  // 상태 변경 액션(상태 뱃지 클릭 → 바텀시트) — 개별형 전용(수량형은 재고/보유중만 있고 배정·보유
  // 레코드 존재 여부로 자동 파생돼 수동 상태 변경 액션 자체가 없음, 구조설계안 3.3). 대시보드 detail.js의
  // STATUS_TRANSITIONS과 동일하게 현재 상태에서 갈 수 있는 전이만 노출
  const STATUS_TRANSITIONS = {
    stock: [["repair-start", "수리 접수"], ["lost-report", "분실 신고"], ["dispose", "폐기 처리"]],
    assigned: [["repair-start", "수리 접수"], ["lost-report", "분실 신고"], ["dispose", "폐기 처리"]],
    repair: [["repair-done", "수리 완료"], ["lost-report", "분실 신고"], ["dispose", "폐기 처리"]],
    lost: [["lost-recover", "분실 회수"], ["dispose", "폐기 처리"]],
    disposed: [],
  };
  function statusActions(a) {
    if (a.type !== "individual" || !canManage(a)) return [];
    return STATUS_TRANSITIONS[a.status].map(([key, label]) => ({ key, label, danger: key === "dispose" }));
  }
  // 배정/보유 관리 액션(상단바 "더보기" → 바텀시트) — 상태 변경류를 제외한 나머지: 재배정·배정 추가·반납
  // (개별형), 수량 변경·보유 대상 추가/해제(수량형), 사진 관리(공통). 폐기되지 않았고 배정/보유 변경 권한이
  // 있는 자산에 한해서만 노출. 메모 수정·사진 관리는 더보기가 아니라 각각 메모 값 옆 편집 아이콘/대표 이미지
  // 위 편집 아이콘으로 별도 제공(2026-09-27, assetDetailScreenHtml 참조) — 대시보드 detail.js와 동일한 구조
  function manageActions(a, target) {
    if (a.status === "disposed" || !canManage(a)) return [];
    const acts = [];
    if (a.type === "individual") {
      const { idx } = findRecord(a, target);
      const activeCount = (a.assignments || []).length;
      if (idx >= 0) {
        acts.push({ key: "reassign", label: "재배정" });
        acts.push({ key: "return", label: "반납" });
      }
      if (activeCount < 5) acts.push({ key: "assign-add", label: "배정 추가" });
    } else {
      const { idx } = findRecord(a, target);
      const remaining = a.totalQty - (a.stocks || []).reduce((s, x) => s + x.qty, 0);
      if (idx >= 0) {
        acts.push({ key: "qty-change", label: "수량 변경" });
        acts.push({ key: "hold-release", label: "보유 해제", danger: true });
      }
      if (remaining > 0) acts.push({ key: "hold-add", label: "보유 대상 추가" });
    }
    return acts;
  }
  // 상단바 "더보기" 메뉴 전체 — 맨 위에 "이력 보기"(자산의 이력 페이지로 이동, 개별형·수량형 공통), 그 아래
  // 구분선 뒤에 배정/보유 관리 액션. 이력 조회는 조회 전용이라 배정/보유 변경 권한·폐기 여부와 무관하게 항상 있음
  // (그래서 권한이 없거나 폐기된 자산도 더보기 버튼 자체는 남고, 메뉴엔 "이력 보기"만 뜸)
  function menuActions(a, target) {
    const manage = manageActions(a, target).map((x, i) => i === 0 ? { ...x, sep: true } : x);
    return [{ key: "history", label: "이력 보기" }, ...manage];
  }
  // 앵커 드롭다운 — 상태 뱃지·상단바 "더보기"가 공유. 대시보드 detail.js의 statusDropdown/moreDropdown과
  // 동일한 패턴(버튼 바로 아래 고정 위치, 바깥 클릭 시 닫힘)으로 통일(2026-09-27, 이전엔 바텀시트였음)
  function openDropdownMenu(anchor, items, onPick) {
    document.querySelectorAll(".dropdown-menu").forEach(m => m.remove());
    const menu = document.createElement("div");
    menu.className = "dropdown-menu";
    menu.innerHTML = items.map(x => `${x.sep ? '<div class="dropdown-sep"></div>' : ""}<button type="button" data-key="${x.key}"${x.danger ? ' class="danger"' : ""}>${x.label}</button>`).join("");
    const r = anchor.getBoundingClientRect();
    menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${Math.max(8, r.right - 180)}px;min-width:180px`;
    document.body.appendChild(menu);
    menu.querySelectorAll("button").forEach(b => b.onclick = () => { menu.remove(); onPick(b.dataset.key); });
    setTimeout(() => {
      const close = e => { if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener("click", close); } };
      document.addEventListener("click", close);
    });
  }
  const MORE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>`;
  // 정보 섹션 — 대시보드 자산 상세 왼쪽 카드(dhead-id/dhead-sub/kv2)와 동일한 마크업·CSS 클래스를 그대로
  // 재사용(같은 css/app.css를 공유하는 프로토타입 전역 컨벤션). 배정/보유 현황(다른 배정 대상 전체 목록)은
  // 이 화면에 안 넣음 — 이 카드가 나타내는 건 "이 target의 레코드"라는 스코프를 유지(다른 대상까지 보여주면
  // 대시보드 상세의 배정/보유 현황 섹션을 통째로 옮겨와야 해서 범위가 커짐), 다만 수량형은 전체/보유/잔여
  // 요약 숫자만 뱃지 아래에 덧붙여 "몇 곳에 나뉘어 있는지"는 파악 가능하게 함. QR 라벨은 스코프 밖(필요해지면 추가)
  function assetDetailScreenHtml(a, target) {
    const isIndiv = a.type === "individual";
    activityLog(a);   // 첫 렌더에서 미리 시드 — 이 화면에서 조작하기 전 상태를 이력의 베이스라인으로 남기기 위해(detail.js와 동일)
    const sActs = statusActions(a);
    const { idx: recIdx } = findRecord(a, target);
    const rec = recIdx >= 0 ? (isIndiv ? a.assignments[recIdx] : a.stocks[recIdx]) : null;
    // 수량형은 "내가(이 target이) 가진 수량"만 보여줌 — 다른 보유 대상들의 수량까지 합친 전체/잔여
    // 요약은 배정현황/보유현황(다른 대상 전체 목록)과 마찬가지로 스코프 밖으로 정리(2026-09-26)
    const statusBadge = isIndiv
      ? (sActs.length
          ? `<button type="button" class="badge ${STATUS_LABEL[a.status][1]} clickable" data-status-open>${STATUS_LABEL[a.status][0]} <span class="bchev">▾</span></button>`
          : `<span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>`)
      : `<span class="badge stock">${rec ? rec.qty : 0}개</span>`;
    const subMeta = `<div>${statusBadge}</div>${
      isIndiv && a.assetNo ? `<div style="margin-top:5px">고유관리번호 <b>${a.assetNo}</b></div>` : ""
    }`;
    const cat = window.DATA.categories.find(c => c.group === a.group && c.sub === a.sub) || {};
    const hiddenFields = cat.hiddenFields || [];
    const kv = [
      { k: "분류", v: `<div><span class="type-pill">${isIndiv ? "개별 자산" : "수량 자산"}</span></div><div style="margin-top:5px">${categoryPath(a)}</div>` },
      { k: "유효기한", field: "expiry", v: expiryBadge(a.expiry) },
      { k: "태그", v: chips(a.labels) },
      isIndiv ? { k: "S/N", field: "serial", v: a.serial || '<span class="muted">—</span>' } : null,
      isIndiv ? { k: "IMEI", field: "imei", v: a.imei || '<span class="muted">—</span>' } : null,
      { k: "제조연월일", field: "manufactured", v: a.manufactured ? window.fmtDate(a.manufactured) : '<span class="muted">—</span>' },
      { k: "구매일", field: "purchaseDate", v: a.purchaseDate ? window.fmtDate(a.purchaseDate) : "—" },
      { k: isIndiv ? "구매가격" : "구매가격 (품목 단가)", field: "purchasePrice", v: a.price ? window.formatPrice(a.price) : "—" },
      { k: "자산 등록일", v: window.fmtDate(a.createdAt) },
      // 메모만 값 옆에 편집 아이콘을 붙여 별도 액션(더보기 메뉴가 아니라 바로 수정) — 대시보드 detail.js와
      // 동일한 구조·아이콘(.icon-edit는 전역 css/app.css 공용 클래스)
      canManage(a) ? { k: "메모", v: `${memoHtml(a.note)}<button type="button" class="icon-edit" data-memoedit aria-label="메모 수정" title="메모 수정">${IC_EDIT}</button>` }
        : { k: "메모", v: memoHtml(a.note) },
    ].filter(Boolean)
     .filter(row => !row.field || !hiddenFields.includes(row.field))
     .map(({ k, v }) => `<div><div class="k">${k}</div><div class="v">${v}</div></div>`).join("");
    // 대표 이미지 — 사진 영역을 누르면 뷰어(조회는 권한과 무관하게 항상 가능, 사진 없으면 비활성), 이미지
    // 위 모서리에 겹치는 편집 아이콘을 누르면 사진 관리(더보기 메뉴가 아니라 여기로 이동, 2026-09-27)
    const photos = window.assetPhotos(a);
    const heroHtml = `
      <div class="mapp-hero-wrap">
        <button type="button" class="mapp-hero-img" data-hero-viewer aria-label="사진 보기"${photos.length ? "" : " disabled"}>${cardThumb(a)}</button>
        ${canManage(a) ? `<button type="button" class="mapp-hero-edit" data-hero-edit aria-label="사진 관리" title="사진 관리">${IC_EDIT}</button>` : ""}
      </div>`;
    // 공동 배정/보유 대상 — target 본인을 뺀 나머지를 정보로만 노출(액션 없음). 최대 5개까지 보여주고
    // 초과하면 "전체보기"로 전용 목록 화면(partiesScreenHtml) 이동(근무지 카드의 최대 5개+전체보기와 동일 패턴)
    const others = otherParties(a, target);
    const partyHtml = others.length ? `
      <div class="dsection">
        <div class="mapp-party-head">${isIndiv ? "공동 배정 대상" : "공동 보유 대상"} <span class="mapp-party-count">${others.length}</span></div>
        <div class="mapp-party-list">${others.slice(0, 5).map(x => partyRowHtml(x, isIndiv)).join("")}</div>
        ${others.length > 5 ? `<button type="button" class="mapp-party-viewall" data-parties-viewall>전체보기</button>` : ""}
      </div>` : "";
    return `
      <div class="mapp-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        <button type="button" class="mapp-more" data-more-open aria-label="더보기">${MORE_ICON}</button>
      </div>
      <div class="mapp-body">
        <div class="dhead-id">
          ${heroHtml}
          <div>
            <h1>${a.product}</h1>
            <div class="dhead-sub">${subMeta}</div>
          </div>
        </div>
        <div class="dsection">
          <div class="kv2">${kv}</div>
        </div>
        ${partyHtml}
      </div>`;
  }
  // 공동 배정/보유 대상 "전체보기" 목적지 — target 본인을 뺀 전체 목록(조회 전용, 액션 없음)
  function partiesScreenHtml(a, target) {
    const isIndiv = a.type === "individual";
    const others = otherParties(a, target);
    return `
      <div class="mapp-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        <span class="mapp-topbar-title">${isIndiv ? "공동 배정 대상" : "공동 보유 대상"}</span>
      </div>
      <div class="mapp-body">
        <div class="mapp-count">전체 <b>${others.length}</b></div>
        <div class="mapp-party-list">${others.map(x => partyRowHtml(x, isIndiv)).join("")}</div>
      </div>`;
  }

  // 메뉴 화면 — 실 앱 스크린샷 그대로(관리 섹션 마지막에 "자산" 신규 추가, 화살표 없이 바로 이동)
  const MENU_ICON_ASSET = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="m21 16-5-5-9 8"/></svg>`;
  function menuScreenHtml() {
    return `
      <div class="mapp-menu-head">
        <span class="mapp-brand">shopl <b>샤플앤컴퍼니</b></span>
        <span class="mapp-gear">⚙</span>
      </div>
      <div class="mapp-body mapp-menu-body">
        <div class="mapp-menu-cap">비용</div>
        <div class="mapp-menu-row"><span class="mapp-menu-ic">🧾</span>비용 정산</div>
        <div class="mapp-menu-cap">관리</div>
        <div class="mapp-menu-row">
          <span class="mapp-menu-ic">👤</span>구성원<span class="mapp-menu-chev">⌄</span>
        </div>
        <div class="mapp-menu-row">
          <span class="mapp-menu-ic">📍</span>근무지<span class="mapp-menu-chev">⌄</span>
        </div>
        <div class="mapp-menu-row"><span class="mapp-menu-ic">👥</span>그룹</div>
        <div class="mapp-menu-row" data-mapp-goto="assets"><span class="mapp-menu-ic">${MENU_ICON_ASSET}</span>자산</div>
        <div class="mapp-menu-cap">설정 및 결제</div>
        <div class="mapp-menu-row">
          <span class="mapp-menu-ic">⚙</span>회사 설정<span class="mapp-menu-chev">⌄</span>
        </div>
        <div class="mapp-menu-row"><span class="mapp-menu-ic">🔌</span>요금제 및 기능</div>
        <div class="mapp-menu-divider"></div>
        <div class="mapp-menu-row muted"><span class="mapp-menu-ic">🎧</span>고객 센터</div>
      </div>`;
  }

  function tabBarHtml(active) {
    const items = [{ key: "home", ic: "⌂", label: "홈" }, { key: "work", ic: "☑", label: "업무" }, { key: "menu", ic: "☰", label: "메뉴" }];
    return `<div class="mapp-tabbar">${items.map(t =>
      `<button type="button" class="mapp-tab${t.key === active ? " active" : ""}" data-mapp-tab="${t.key}"><span class="mapp-tab-ic">${t.ic}</span>${t.label}</button>`
    ).join("")}</div>`;
  }

  function render() {
    const root = document.getElementById("app");
    const state = { screen: "menu", assetTab: "mine" };

    function draw() {
      // 배정/보유 변경 액션이 window.DATA.assets를 직접 mutate하므로, 목록은 렌더마다 새로 집계
      // (한 번만 계산해 두면 재배정·반납 등으로 바뀐 내용이 목록 화면에 반영되지 않음)
      const items = sortItems(collectMyItems(ME));
      const worksiteGroups = collectWorksiteGroups(ME);
      const showTabBar = state.screen === "menu";
      const screenHtml = state.screen === "menu" ? menuScreenHtml()
        : state.screen === "worksite-detail" ? worksiteDetailScreenHtml(state.wsDetail, state.wsDetailSub, itemsForWorksite(state.wsDetail, state.wsDetailSub))
        : state.screen === "asset-detail" ? assetDetailScreenHtml(assets.find(x => x.id === state.detailAssetId), state.detailTarget)
        : state.screen === "asset-parties" ? partiesScreenHtml(assets.find(x => x.id === state.detailAssetId), state.detailTarget)
        : state.screen === "asset-history" ? historyScreenHtml(assets.find(x => x.id === state.detailAssetId))
        : state.assetTab === "mine" ? myAssetsScreenHtml(items) : worksiteAssetsScreenHtml(worksiteGroups);

      root.innerHTML = `
        <div class="mapp-stage">
          <div class="mapp-phone">
            <div class="mapp-statusbar"><span>9:41</span><span class="mapp-statusbar-icons">•••</span></div>
            <div class="mapp-screen">${screenHtml}</div>
            ${showTabBar ? tabBarHtml("menu") : ""}
          </div>
        </div>`;

      const back = root.querySelector("[data-mapp-back]");
      if (back) back.onclick = () => {
        // 공동 배정/보유 대상 전체보기는 자산 상세로, 자산 상세는 진입 직전 화면(내 자산/근무지 자산/
        // 전체보기)으로, 전체보기는 근무지 자산 탭으로, 그 외엔 메뉴로 복귀
        if (["asset-parties", "asset-history"].includes(state.screen)) { state.screen = "asset-detail"; }
        else if (state.screen === "asset-detail" && state.detailFrom) { Object.assign(state, state.detailFrom); delete state.detailFrom; }
        else if (state.screen === "worksite-detail") { state.screen = "assets"; state.assetTab = "worksite"; }
        else { state.screen = "menu"; }
        draw();
      };
      // 액션 완료 후 화면 복귀 — 반납·재배정(다른 대상으로)·보유 해제·폐기처럼 이 카드가 나타내던 target의
      // 레코드가 사라졌으면 진입 직전 목록으로, 아니면 자산 상세로(배정 추가·보유 대상 추가·재배정 페이지 포함)
      function afterMutate() {
        const a = assets.find(x => x.id === state.detailAssetId);
        if (findRecord(a, state.detailTarget).idx < 0) { Object.assign(state, state.detailFrom); delete state.detailFrom; }
        draw();
      }
      // 자산 카드 클릭 → 자산 상세(앱) 이동. target(이 카드가 나타내는 구체적 배정/보유 레코드의 주체)은
      // 화면별로 다름: 내 자산 탭은 ME 본인, 근무지 자산(카드 안 축약 카드)·전체보기는 그 카드가 속한 근무지
      function openDetail(assetId, target) {
        state.detailFrom = { screen: state.screen, assetTab: state.assetTab, wsDetail: state.wsDetail };
        state.screen = "asset-detail";
        state.detailAssetId = assetId;
        state.detailTarget = target;
        draw();
      }
      if (state.screen === "assets" && state.assetTab === "mine") {
        root.querySelectorAll("[data-asset-card]").forEach(el => el.onclick = () => openDetail(el.dataset.assetId, { type: "employee", value: ME }));
      } else if (state.screen === "worksite-detail") {
        root.querySelectorAll("[data-asset-card]").forEach(el => el.onclick = () => openDetail(el.dataset.assetId, { type: "worksite", value: state.wsDetail }));
      } else if (state.screen === "asset-detail") {
        const a = assets.find(x => x.id === state.detailAssetId);
        const target = state.detailTarget;
        // 상태 변경 — 상태만 바꾸고 이력에 "상태 변경: …" 1건 기록(detail.js applyStatusChange와 동일)
        const setStatus = (script, next) => () => {
          const before = STATUS_LABEL[a.status][0];
          a.status = next();
          logActivity(a, { script, before, after: STATUS_LABEL[a.status][0] });
        };
        function dispatchAction(key) {
          const { idx } = findRecord(a, target);
          if (key === "history") { state.screen = "asset-history"; draw(); }
          else if (key === "assign-add") openFormSheet(a, target, "assign-add", afterMutate);
          else if (key === "reassign") openFormSheet(a, target, "reassign", afterMutate);
          else if (key === "hold-add") openFormSheet(a, target, "hold-add", afterMutate);
          else if (key === "return") openReturnConfirm(a, idx, afterMutate);
          else if (key === "lost-report") openStatusChangeConfirm(a, "분실 신고하시겠습니까?", "분실 신고 시 기존 배정은 유지된 채 상태만 분실로 변경됩니다.", setStatus("상태 변경: 분실 신고", () => "lost"), afterMutate);
          else if (key === "lost-recover") openStatusChangeConfirm(a, "분실 회수 처리하시겠습니까?", "분실 회수 시 배정 여부에 따라 배정 중 또는 재고 상태로 돌아갑니다.", setStatus("상태 변경: 분실 회수", () => derivedActiveStatus(a)), afterMutate);
          else if (key === "repair-start") openStatusChangeConfirm(a, "수리 접수하시겠습니까?", "수리 접수 시 기존 배정은 유지된 채 상태만 수리 중으로 변경됩니다.", setStatus("상태 변경: 수리 접수", () => "repair"), afterMutate);
          else if (key === "repair-done") openStatusChangeConfirm(a, "수리 완료 처리하시겠습니까?", "수리 완료 시 배정 여부에 따라 배정 중 또는 재고 상태로 돌아갑니다.", setStatus("상태 변경: 수리 완료", () => derivedActiveStatus(a)), afterMutate);
          else if (key === "dispose") openDisposeConfirmModal(a, afterMutate);
          else if (key === "qty-change") openQtyChangeModal(a, idx, afterMutate);
          else if (key === "hold-release") openHoldReleaseConfirm(a, idx, afterMutate);
        }
        // 상태 뱃지 → 상태 변경 드롭다운, 상단바 "더보기" → 배정/보유 관리 드롭다운(대시보드와 동일한
        // 앵커 드롭다운 패턴, 2026-09-27)
        const statusOpen = root.querySelector("[data-status-open]");
        if (statusOpen) statusOpen.onclick = () => openDropdownMenu(statusOpen, statusActions(a), dispatchAction);
        const moreOpen = root.querySelector("[data-more-open]");
        if (moreOpen) moreOpen.onclick = () => openDropdownMenu(moreOpen, menuActions(a, target), dispatchAction);
        // 대표 이미지 클릭 → 사진 뷰어(조회 전용, 권한과 무관, 사진 없으면 disabled라 클릭 안 먹음)
        const heroBtn = root.querySelector("[data-hero-viewer]");
        if (heroBtn) heroBtn.onclick = () => openPhotoViewer(a);
        // 이미지 모서리 편집 아이콘 → 사진 관리(더보기 메뉴 거치지 않음)
        const heroEdit = root.querySelector("[data-hero-edit]");
        if (heroEdit) heroEdit.onclick = e => { e.stopPropagation(); openPhotoManageModal(a, afterMutate); };
        // 메모 옆 편집 아이콘 → 바로 메모 수정(더보기 메뉴 거치지 않음, 대시보드와 동일 구조)
        const memoEdit = root.querySelector("[data-memoedit]");
        if (memoEdit) memoEdit.onclick = () => openMemoEditModal(a, afterMutate);
        // 공동 배정/보유 대상 "전체보기" → 전용 목록 화면
        const partiesViewall = root.querySelector("[data-parties-viewall]");
        if (partiesViewall) partiesViewall.onclick = () => { state.screen = "asset-parties"; draw(); };
      }
      // 이력 페이지 — 수량형 검색은 목록 영역만 다시 그림(입력창을 재렌더하지 않아 한글 IME 조합이 안 깨짐)
      if (state.screen === "asset-history") {
        const a = assets.find(x => x.id === state.detailAssetId);
        const q = root.querySelector("[data-history-q]");
        const list = root.querySelector("[data-history-list]");
        if (q) q.addEventListener("input", () => { list.innerHTML = timelineHtml(a, q.value); });
      }
      const gotoAssets = root.querySelector('[data-mapp-goto="assets"]');
      if (gotoAssets) gotoAssets.onclick = () => { state.screen = "assets"; state.assetTab = "mine"; draw(); };
      root.querySelectorAll("[data-mapp-asset-tab]").forEach(b => b.onclick = () => {
        state.assetTab = b.dataset.mappAssetTab; draw();
      });
      root.querySelectorAll("[data-mapp-tab]").forEach(b => b.onclick = () => {
        if (b.dataset.mappTab === "menu") { state.screen = "menu"; draw(); }
      });

      // 검색 — category.js와 동일한 hidden 토글 패턴(input 재렌더 없음, 한글 IME 조합 깨짐 방지).
      // 내 자산 탭은 대분류 섹션으로 묶여 있어서, 카드 hidden 토글에 더해 섹션 안에 보이는 카드가 하나도
      // 없으면 그 섹션(헤더 포함)도 같이 숨김(전체보기 등 섹션 없는 화면에선 sections가 빈 배열이라 no-op)
      const searchInput = root.querySelector("[data-mapp-search]");
      if (searchInput) {
        const cards = [...root.querySelectorAll("[data-asset-card]")];
        const sections = [...root.querySelectorAll("[data-cat-section]")];
        const emptyMsg = root.querySelector("[data-mapp-empty]");
        searchInput.addEventListener("input", () => {
          const q = searchInput.value.trim().toLowerCase();
          let anyVisible = false;
          cards.forEach(card => {
            const match = !q || card.textContent.toLowerCase().includes(q);
            card.hidden = !match;
            if (match) anyVisible = true;
          });
          sections.forEach(sec => {
            sec.hidden = ![...sec.querySelectorAll("[data-asset-card]")].some(c => !c.hidden);
          });
          if (emptyMsg) emptyMsg.hidden = anyVisible;
        });
      }
      // 근무지 자산 — 근무지명/코드/주소 검색(카드 단위 hidden 토글)
      const wsSearchInput = root.querySelector("[data-mapp-ws-search]");
      if (wsSearchInput) {
        const wsCards = [...root.querySelectorAll("[data-ws-card]")];
        wsSearchInput.addEventListener("input", () => {
          const q = wsSearchInput.value.trim().toLowerCase();
          wsCards.forEach(card => {
            const hay = `${card.dataset.wsName}${card.dataset.wsCode}${card.dataset.wsAddress}`.toLowerCase();
            card.hidden = !(!q || hay.includes(q));
          });
        });
      }
      // 근무지 카드의 소분류 행 클릭 → 그 근무지·그 소분류의 전체 자산 목록으로 이동
      root.querySelectorAll("[data-ws-cat-open]").forEach(b => b.onclick = () => {
        state.screen = "worksite-detail";
        state.wsDetail = b.dataset.ws;
        state.wsDetailSub = b.dataset.sub;
        draw();
      });
      // 내 자산 대분류 섹션 접기/펼치기 — 근무지 카드와 동일한 패턴(기본 펼침)
      root.querySelectorAll("[data-cat-collapse]").forEach(b => b.onclick = () => {
        const body = b.closest(".mapp-cat-section").querySelector("[data-cat-collapsible]");
        const expanded = b.getAttribute("aria-expanded") === "true";
        b.setAttribute("aria-expanded", String(!expanded));
        body.hidden = expanded;
        b.classList.toggle("collapsed", expanded);
      });
      // 근무지 카드 접기/펼치기 — 기본 펼침, 분류 목록이 접히는 범위
      root.querySelectorAll("[data-ws-collapse]").forEach(b => b.onclick = () => {
        const body = b.closest(".mapp-ws-card").querySelector("[data-ws-collapsible]");
        const expanded = b.getAttribute("aria-expanded") === "true";
        b.setAttribute("aria-expanded", String(!expanded));
        body.hidden = expanded;
        b.classList.toggle("collapsed", expanded);
      });
    }
    draw();
  }

  window.AppScreen = { render };
})();
