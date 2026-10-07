/* 앱 리더모드 — 러프 프로토타입(2026-09-30). 직원모드(app.js)와 달리 "내 자산"이 아니라 조회 권한 범위
   안의 회사 전체 자산을 보는 화면. 자산 상세는 직원모드 레이아웃과 대시보드의 관리 정책을 적용. 소분류 검색·필터와 권한 기반 추가/수정을 구현.
   필터는 직원모드와 공용 팝업 사용. 이 파일도 다른 화면 파일들과 동일하게
   자기 완결적(상수 중복 정의)이라 app.js/assets.js와 겹치는 부분이 많음 */
(function () {
  const { assets } = window.DATA;

  // 요금제 및 기능은 회사 전역 설정이며 직원/리더 모드와 별개로 관리자급(서버 역할 2/7/9)만 접근한다.
  // 이번 화면을 확인하기 위한 관리자급 권한 가정이다. 기존 자산 화면의 페르소나/권한 시뮬레이션은 유지한다.
  const DEMO_ASSUME_FEATURE_ADMIN = true;
  const ASSET_MGMT_FLAG_KEY = "shopl_proto_assetMgmtUse";
  const COMPANY_PLAN_KEY = "shopl_proto_companyPlan";
  const PLAN_RANK = { Lite: 0, Standard: 1, Pro: 2, Enterprise: 3, Trial: 2 };
  function companyPlan() {
    const plan = localStorage.getItem(COMPANY_PLAN_KEY) || "Enterprise";
    return Object.hasOwn(PLAN_RANK, plan) ? plan : "Lite";
  }
  function planAllows(minimum) { return PLAN_RANK[companyPlan()] >= PLAN_RANK[minimum]; }
  function canConfigureFeatures() { return DEMO_ASSUME_FEATURE_ADMIN; }
  // 신규 고객사 및 출시 시 기존 Pro 이상 고객사는 최초 사용값이 ON. 이후 명시적으로 저장한 OFF는 유지한다.
  // 무료 체험은 기존 요금제 공통 판정처럼 Pro 수준. 요금제 자격과 회사 사용값은 서로 다른 축이다.
  function assetMgmtEnabled() { return planAllows("Pro") && localStorage.getItem(ASSET_MGMT_FLAG_KEY) !== "0"; }
  const FEATURE_GROUPS = [
    { name: "출퇴근 및 방문", items: [["출퇴근", "Lite"], ["스케줄", "Lite"], ["휴가", "Lite"], ["초과근무", "Standard"], ["근태 마감", "Standard"], ["방문계획 및 달성", "Standard"], ["위치 확인", "Pro"]] },
    { name: "문서", items: [["전자문서", "Standard"]] },
    { name: "커뮤니케이션", items: [["할 일", "Pro"], ["공지 및 설문", "Standard"], ["보고서", "Pro"], ["게시판", "Pro"], ["AI 챗봇", "Pro"], ["채팅", "Pro"]] },
    { name: "매장 데이터 수집", items: [["판매량", "Enterprise"], ["가격", "Enterprise"], ["재고", "Enterprise"], ["전시현황", "Enterprise"]] },
    { name: "목표 및 평가", items: [["목표 달성 관리", "Enterprise"], ["인센티브", "Enterprise"]] },
    { name: "비용", items: [["비용 결재", "Pro"]] },
    { name: "관리", items: [["자산 관리", "Pro"]] },
  ];
  // 기타 기능의 사용값은 목록 재현용 ON 시드. 해당 기능 상세/토글은 이번 구현 범위 밖이다.
  function featureIsOn(name, minimum) { return name === "자산 관리" ? assetMgmtEnabled() : planAllows(minimum); }
  const ASSET_FEATURE_DESCRIPTION = [
    "회사가 보유한 자산을 등록하고 배정·보유 현황을 관리하는 기능입니다.",
    "자산을 유형별로 분류하고, 구성원·근무지에 배정하거나 상태를 관리할 수 있습니다.",
  ];
  const ASSET_FEATURE_ART = `<svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
    <rect x="26" y="24" width="268" height="144" rx="15" fill="#bdddeb"/>
    <rect x="26" y="40" width="268" height="128" rx="12" fill="#f6fafc"/>
    <circle cx="40" cy="32" r="3" fill="#659eb5"/><circle cx="50" cy="32" r="3" fill="#53c8af"/><circle cx="60" cy="32" r="3" fill="#3199ed"/>
    <rect x="43" y="58" width="91" height="93" rx="10" fill="#e5f0f5"/>
    <path d="m61 83 28-14 28 14-28 15-28-15Z" fill="#7ebce4"/><path d="M61 83v33l28 15V98L61 83Z" fill="#519fce"/><path d="M117 83v33l-28 15V98l28-15Z" fill="#3091c7"/><path d="m75 76 28 15v13" stroke="#e8f7ff" stroke-width="5"/>
    <rect x="150" y="61" width="125" height="26" rx="7" fill="#e8f2f7"/><rect x="160" y="70" width="51" height="6" rx="3" fill="#8bb6ca"/>
    <rect x="150" y="99" width="125" height="26" rx="7" fill="#e8f2f7"/><rect x="160" y="108" width="69" height="6" rx="3" fill="#8bb6ca"/>
    <circle cx="260" cy="74" r="6" fill="#3ab5a1"/><path d="m257 74 2 2 4-4" stroke="white" stroke-width="1.5"/>
    <circle cx="260" cy="112" r="6" fill="#3ab5a1"/><path d="m257 112 2 2 4-4" stroke="white" stroke-width="1.5"/>
    <rect x="180" y="137" width="95" height="7" rx="3.5" fill="#bdddeb"/>
  </svg>`;
  function planFeaturesScreenHtml() {
    const plan = companyPlan();
    const label = plan === "Trial" ? "무료 체험" : plan;
    return `<div class="mapp-plan-page">
      <div class="mapp-topbar"><button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button><span class="mapp-topbar-title">요금제 및 기능</span></div>
      <div class="mapp-plan-body">
        <div class="mapp-plan-current"><strong>${label}</strong><p>${label}${plan === "Trial" ? "을 이용 중입니다." : " 요금제를 사용 중입니다."}</p></div>
        <div class="mapp-plan-intro"><p>사용할 기능을 선택해보세요.</p><div>세부 기능은 대시보드에서 설정할 수 있습니다.<br>(대시보드 &gt; 기능 설정)</div><button type="button" class="mapp-plan-dashboard" data-plan-dashboard>대시보드 링크 보기</button></div>
        ${FEATURE_GROUPS.map(group => `<section class="mapp-plan-group"><h2>${group.name}</h2><div class="mapp-plan-list">${group.items.map(([name, minimum]) => {
          const on = featureIsOn(name, minimum);
          return `<button type="button" class="mapp-plan-row${on ? " on" : ""}" data-plan-feature="${name}"><span>${name}${on ? '<i class="mapp-plan-use-dot" aria-label="사용 중"></i>' : ""}</span><span class="mapp-plan-chevron" aria-hidden="true">›</span></button>`;
        }).join("")}</div></section>`).join("")}
      </div></div>`;
  }
  function assetFeatureScreenHtml() {
    const on = assetMgmtEnabled();
    return `<div class="mapp-plan-page mapp-plan-detail">
      <div class="mapp-plan-hero"><div class="mapp-topbar"><button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button></div>${ASSET_FEATURE_ART}</div>
      <div class="mapp-plan-detail-body">
        <section class="mapp-plan-info-card"><div class="mapp-plan-toggle-row">
          ${!planAllows("Pro") ? '<span class="mapp-plan-tier">Pro 이상</span>' : ""}
          <button type="button" class="toggle-switch${on ? " on" : ""}" data-plan-toggle role="switch" aria-label="자산 관리 사용 여부" aria-checked="${on}"><span class="toggle-knob"></span></button></div>
          <h1>자산 관리</h1>${ASSET_FEATURE_DESCRIPTION.map(text => `<p>${text}</p>`).join("")}</section>
        <section class="mapp-plan-info-card mapp-plan-settings"><h2>세부 기능 설정</h2><ul><li>자산 관리 권한</li></ul>
          <p class="mapp-plan-guide">세부 기능은 대시보드에서 설정할 수 있습니다.<br>(대시보드 &gt; 자산 &gt; 설정)</p>
          <button type="button" class="mapp-plan-dashboard" data-plan-dashboard>대시보드 링크 보기</button></section>
      </div></div>`;
  }
  function openPlanDialog({ title, body, actions }) {
    const previousFocus = document.activeElement;
    const screen = document.querySelector(".mapp-screen");
    const rect = screen.getBoundingClientRect();
    const back = document.createElement("div");
    back.className = "mapp-plan-dialog-back";
    back.style.cssText = `position:absolute;top:${rect.top + window.scrollY}px;left:${rect.left + window.scrollX}px;width:${rect.width}px;height:${rect.height}px;`;
    back.innerHTML = `<div class="mapp-plan-dialog" role="dialog" aria-modal="true" aria-labelledby="plan-dialog-title"><div class="mapp-plan-dialog-body"><h2 id="plan-dialog-title">${title}</h2>${body || ""}</div><div class="mapp-plan-dialog-foot">${actions.map((action, index) => `<button type="button" data-plan-dialog-action="${index}">${action.label}</button>`).join("")}</div></div>`;
    function close() {
      back.remove(); document.removeEventListener("keydown", onKey);
      if (previousFocus && previousFocus.isConnected) previousFocus.focus();
    }
    function onKey(event) {
      if (event.key === "Escape") { event.preventDefault(); close(); }
      if (event.key === "Tab") {
        const buttons = [...back.querySelectorAll("button")];
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    }
    back.querySelectorAll("[data-plan-dialog-action]").forEach(button => button.onclick = () => { close(); const action = actions[Number(button.dataset.planDialogAction)]; if (action.run) action.run(); });
    back.onclick = event => { if (event.target === back) close(); };
    document.addEventListener("keydown", onKey);
    document.body.appendChild(back);
    back.querySelector("button").focus();
    return back;
  }
  function openPlanDashboardLink() {
    const url = "https://dashboard.shoplworks.com";
    const back = openPlanDialog({ title: "대시보드(PC) 링크", body: `<p>PC에서 접속해주세요.</p><div class="mapp-plan-link-content"><p class="mapp-plan-link-url">${url}</p><div class="mapp-plan-link-actions"><button type="button" data-plan-copy><span aria-hidden="true">▣</span>복사</button><button type="button" data-plan-share><span aria-hidden="true">↗</span>공유</button></div></div>`, actions: [{ label: "닫기" }] });
    back.querySelector("[data-plan-copy]").onclick = async () => {
      try { await navigator.clipboard.writeText(url); toast("링크가 복사되었습니다. PC에서 접속해주세요."); }
      catch { toast("주소를 길게 눌러 복사해주세요."); }
    };
    back.querySelector("[data-plan-share]").onclick = async () => {
      if (!navigator.share) { toast("이 환경에서는 공유를 지원하지 않습니다. 주소를 복사해주세요."); return; }
      try { await navigator.share({ title: "대시보드(PC) 링크", url }); }
      catch (error) { if (error.name !== "AbortError") toast("공유할 수 없습니다. 주소를 복사해주세요."); }
    };
  }
  function wirePlanFeatures(root, state, draw) {
    const goto = root.querySelector('[data-mapp-goto="plan-features"]');
    if (goto) goto.onclick = () => { if (!canConfigureFeatures()) return; state.screen = "plan-features"; draw(); };
    root.querySelectorAll("[data-plan-dashboard]").forEach(button => button.onclick = openPlanDashboardLink);
    root.querySelectorAll("[data-plan-feature]").forEach(button => button.onclick = () => {
      if (button.dataset.planFeature !== "자산 관리") { toast("이 기능의 상세 화면은 프로토타입 구현 범위에 포함되지 않습니다."); return; }
      state.featureListScroll = root.querySelector(".mapp-screen").scrollTop;
      state.screen = "asset-feature"; draw();
    });
    const toggle = root.querySelector("[data-plan-toggle]");
    if (!toggle) return;
    toggle.onclick = () => {
      if (!canConfigureFeatures()) return;
      if (!planAllows("Pro")) {
        openPlanDialog({ title: "Pro 요금제부터 사용할 수 있습니다.", body: "<p>자산 관리 기능을 사용하려면 요금제를 업그레이드해주세요.</p>", actions: [{ label: "취소" }, { label: "대시보드 링크 보기", run: openPlanDashboardLink }] });
        return;
      }
      const on = assetMgmtEnabled();
      openPlanDialog({ title: on ? "사용 안 함으로 설정하시겠습니까?" : "사용함으로 설정하시겠습니까?",
        body: "", // 앱 운영 양식: 사용함/사용 안 함 확인은 바디 없이 타이틀·취소/확인만 제공.
        actions: [{ label: "취소" }, { label: "확인", run: () => {
          // 확인 당시에도 관리자/요금제 검사. 취소하거나 저장에 실패하면 기존 사용값과 화면을 유지한다.
          if (!canConfigureFeatures() || !planAllows("Pro")) { draw(); return; }
          try { localStorage.setItem(ASSET_MGMT_FLAG_KEY, on ? "0" : "1"); }
          catch { toast("저장하지 못했습니다. 다시 시도해주세요."); return; }
          draw(); toast("저장되었습니다.");
        } }],
      });
    };
  }

  const TODAY = new Date("2026-09-04");
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // 태그는 앞뒤 공백 제거·연속 공백 한 칸으로 정규화하되 대소문자는 유지한다.
  const normalizeTagName = value => value.trim().replace(/\s+/g, " ");
  function formatAddPrice(value) {
    const digits = value.replace(/[^0-9]/g, "").slice(0, 12);
    return digits ? Number(digits).toLocaleString("ko-KR") : "";
  }
  const CLOSE_ICON_SM = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>`;
  const CAL_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>`;
  const TAG_COLORS = [
    { fg: "#3461c9", bg: "#eaf1ff" }, { fg: "#6b3fd4", bg: "#f1ecff" },
    { fg: "#c23c56", bg: "#fdecef" }, { fg: "#1f8f5f", bg: "#e8f8f0" },
    { fg: "#b5790a", bg: "#fdf3e0" }, { fg: "#1f8fae", bg: "#e6f6fa" },
  ];
  function todayStr() {
    const p = n => String(n).padStart(2, "0");
    return `${TODAY.getFullYear()}-${p(TODAY.getMonth() + 1)}-${p(TODAY.getDate())}`;
  }
  function tagColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 997;
    return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
  }
  // app.js의 toast()와 동일(중복) — .mapp-screen 영역 기준으로 떠서 폰 목업 밖으로 안 나가게
  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    const screen = document.querySelector(".mapp-screen");
    const r = screen ? screen.getBoundingClientRect() : null;
    const pos = r ? `left:${r.left + r.width / 2}px;bottom:${window.innerHeight - r.bottom + 32}px;` : "left:50%;bottom:32px;";
    t.style.cssText = `position:fixed;${pos}transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300;max-width:280px;text-align:center`;
    document.body.appendChild(t); setTimeout(() => t.remove(), 1800);
  }
  // 직원모드에서 쓰는 앱 오버레이·앵커 메뉴 패턴을 리더 파일 안에서도 자기 완결적으로 재사용한다.
  function mappOverlay(className, zIndex) {
    const back = document.createElement("div");
    back.className = className;
    const screen = document.querySelector(".mapp-screen");
    const r = screen ? screen.getBoundingClientRect() : { top: 0, left: 0, width: 390, height: 844 };
    // 폰보다 낮은 브라우저에서도 페이지 스크롤을 따라 폼의 하단 버튼에 접근 가능하도록 문서 좌표에 고정.
    back.style.cssText = `position:absolute;top:${r.top + window.scrollY}px;left:${r.left + window.scrollX}px;width:${r.width}px;height:${r.height}px;z-index:${zIndex};`;
    document.body.appendChild(back);
    return back;
  }
  function openAddDropdown(anchor, items, onPick) {
    document.querySelectorAll(".dropdown-menu").forEach(menu => menu.remove());
    const menu = document.createElement("div");
    menu.className = "dropdown-menu";
    menu.innerHTML = items.map(item => `<button type="button" data-key="${item.key}">${item.label}</button>`).join("");
    const r = anchor.getBoundingClientRect();
    menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${Math.max(8, r.right - 180)}px;min-width:180px`;
    document.body.appendChild(menu);
    menu.querySelectorAll("button").forEach(button => button.onclick = () => { menu.remove(); onPick(button.dataset.key); });
    setTimeout(() => {
      const close = event => {
        if (!menu.contains(event.target)) { menu.remove(); document.removeEventListener("click", close); }
      };
      document.addEventListener("click", close);
    });
  }
  function openAddMonthSheet(title, initialMonth, onApply) {
    const base = initialMonth || todayStr().slice(0, 7);
    let viewY = Number(base.slice(0, 4));
    let selected = initialMonth || "";
    const maxMonth = todayStr().slice(0, 7);
    const back = mappOverlay("mapp-sheet-back", 120);
    back.innerHTML = `<div class="mapp-sheet mapp-add-month-sheet" role="dialog" aria-modal="true" aria-label="${title}">
      ${initialMonth ? '<div class="mapp-add-month-reset"><button type="button" data-add-date-reset>초기화</button></div>' : ""}
      <div class="mapp-sheet-body" data-add-month-body></div>
      <div class="mapp-sheet-foot"><button type="button" data-add-month-cancel>취소</button><button type="button" data-add-month-ok>확인</button></div></div>`;
    const body = back.querySelector("[data-add-month-body]");
    const ok = back.querySelector("[data-add-month-ok]");
    const pad = n => String(n).padStart(2, "0");
    function drawMonths() {
      body.innerHTML = `<div class="mapp-add-month-head"><button type="button" data-month-prev aria-label="이전 해">‹</button><strong>${viewY}</strong><button type="button" data-month-next aria-label="다음 해">›</button></div>
        <div class="mapp-add-month-grid">${Array.from({ length: 12 }, (_, index) => {
          const value = `${viewY}-${pad(index + 1)}`;
          return `<button type="button" data-month="${value}" aria-label="${index + 1}월" aria-pressed="${value === selected}" class="${value === selected ? "sel" : ""}"${value > maxMonth ? " disabled" : ""}><span>${pad(index + 1)}</span></button>`;
        }).join("")}</div><div class="mapp-cal-sel">${selected ? selected.replace("-", ".") : ""}</div>`;
      body.querySelector("[data-month-prev]").onclick = () => { viewY--; drawMonths(); };
      const next = body.querySelector("[data-month-next]");
      next.disabled = viewY >= Number(maxMonth.slice(0, 4));
      next.onclick = () => { if (!next.disabled) { viewY++; drawMonths(); } };
      body.querySelectorAll("[data-month]").forEach(button => button.onclick = () => { selected = button.dataset.month; drawMonths(); });
      ok.disabled = !selected;
    }
    drawMonths();
    back.addEventListener("click", event => { if (event.target === back) back.remove(); });
    back.querySelector("[data-add-month-cancel]").onclick = () => back.remove();
    const reset = back.querySelector("[data-add-date-reset]");
    if (reset) reset.onclick = () => { back.remove(); onApply(""); };
    ok.onclick = () => { if (selected) { back.remove(); onApply(selected); } };
  }

  // "나" 페르소나 — 리더 1명(김민수)을 고정. 앱 직원모드의 ?me= 같은 전환 기능은 이번 러프 스코프에 없음
  const ME = "김민수";
  // 실제 서비스에서는 전역 manage_permission_type(관리자만/관리자 및 모든 리더/관리자 및 특정 리더)과
  // manage_permission_targets를 판정한다. 프로토타입의 김민수 계정은 자산 관리 권한 보유자로 고정한다.
  const DEMO_ASSUME_ASSET_MANAGE_PERMISSION = true;
  function hasAssetManagePermission() {
    return DEMO_ASSUME_ASSET_MANAGE_PERMISSION;
  }
  // detail.js/app.js의 MEMBERS와 동일 값(이 파일도 자기 완결적이라 중복 유지) — 조회 권한 판정(팀 매칭)에만 씀
  const MEMBER_TEAM = {
    "김민수": "개발팀", "이서연": "디자인팀", "박지훈": "영업팀", "정우성": "CS팀", "김철수": "운영팀",
    "최유진": "개발팀", "한소희": "디자인팀", "장민호": "국내영업", "오세훈": "운영팀", "배수지": "CS팀",
    "윤재현": "해외영업", "임하늘": "개발팀",
  };
  // app.js의 hasViewPermission과 동일 로직(그대로 중복) — 리더모드 자산 화면은 "조회 권한을 가진 자산
  // 전체"가 화면의 정의 그 자체라, 이 판정 함수가 목록 수집의 핵심. 소분류 트리(허브 화면)는 자산이 아니라
  // 카테고리 자체를 걸러야 해서 판정 로직을 catViewPermission(cat)으로 분리하고 hasViewPermission(a)은 그걸 재사용
  function catViewPermission(cat) {
    if (!cat) return false;
    // 구조설계안 4.1/4.2: 자산 관리 권한자는 소분류 설정과 무관하게 전체 조회 가능.
    if (hasAssetManagePermission()) return true;
    switch (cat.view) {
      case "회사의 모든 구성원": return true;
      case "모든 관리자 및 리더": return true; // 현재 페르소나는 리더 김민수
      case "특정 관리자/리더": return (cat.viewTarget && cat.viewTarget.members || []).includes(ME);
      case "특정 그룹 및 직무/직급": return (cat.viewTarget && cat.viewTarget.groups || []).includes(MEMBER_TEAM[ME]);
      default: return false; // 관리자만: 관리권한 예외가 없으면 리더는 접근 불가
    }
  }
  function hasViewPermission(a) {
    return catViewPermission(window.DATA.categories.find(c => c.group === a.group && c.sub === a.sub));
  }
  const STATUS_LABEL = {
    stock: ["재고", "stock"], assigned: ["배정 중", "assigned"], repair: ["수리 중", "repair"],
    lost: ["분실", "lost"], disposed: ["폐기", "disposed"], held: ["보유 중", "assigned"],
  };
  // assets.js의 isDepleted/hasUnheldHolder와 동일(중복) — 수량형 소분류 화면의 "소진"·"미보유대상" 필터에 씀
  function isDepleted(a) {
    return a.type === "quantity" && a.totalQty - (a.stocks || []).reduce((s, x) => s + x.qty, 0) === 0;
  }
  function hasUnheldHolder(a) {
    return a.type === "quantity" && (a.stocks || []).some(x => x.qty === 0);
  }
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
  // 대시보드 "전체" 탭과 동일하게 자산 1건당 한 행(특정 배정/보유 대상 기준이 아님) — 수량형의 qty는
  // 특정 보유자의 보유 수량이 아니라 그 자산의 총 수량(totalQty)
  function collectLeaderItems() {
    return assets.filter(a => hasViewPermission(a)).map(a => ({ asset: a, qty: a.type === "quantity" ? (a.totalQty || 0) : 1 }));
  }
  // 허브 화면용 — 대시보드 분류 관리 화면의 트리와 동일하게, 자산 보유 여부와 무관하게 조회 권한을 가진
  // 소분류를 전부 대분류별로 묶어서 보여줌(2026-09-30 — 유형 칩 제거하면서 "허브는 순수 카테고리 트리"로 단순화).
  // 대분류만 있고 소분류가 아직 없는 경우(window.DATA.emptyGroups, data.js "비품" 샘플)도 대시보드와 동일하게
  // 그 대분류는 노출하고 "소분류 없음"으로 표시(2026-09-30) — 소분류가 없어 권한 체크 대상 자체가 없으니 숨길 이유가 없음
  function categoryTree() {
    const order = [];
    const map = {};
    window.DATA.categories.forEach(c => {
      if (!catViewPermission(c)) return;
      if (!map[c.group]) { map[c.group] = []; order.push(c.group); }
      map[c.group].push(c.sub);
    });
    (window.DATA.emptyGroups || []).forEach(group => {
      if (!map[group]) { map[group] = []; order.push(group); }
    });
    return order.map(group => ({ group, subs: map[group] }));
  }
  function countForSub(sub) { return assets.filter(a => a.sub === sub && hasViewPermission(a)).length; }

  const THUMB_EMPTY = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-4 4 3 4-4 5 4"/></svg>`;
  function cardThumb(a) {
    const photos = window.assetPhotos(a);
    if (photos.length) return `<span class="mapp-thumb" style="background:${photos[a._primary || 0].color}"></span>`;
    return `<span class="mapp-thumb empty">${THUMB_EMPTY}</span>`;
  }
  // 이번 러프 스코프엔 자산 상세·사진 뷰어가 없어 썸네일은 클릭 동작 없이 그냥 보여주기만 함(app.js의
  // cardThumbBtn과 달리 버튼이 아님)
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

  const MENU_ICON_ASSET = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="m21 16-5-5-9 8"/></svg>`;
  const CHEV_DOWN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>`;
  const PHOTO_COLORS = ["#5b8def", "#8f6ef0", "#eb7f8b", "#3fb37f", "#e0a63c", "#4dabf7"];

  function addFabHtml() {
    return hasAssetManagePermission()
      ? '<button type="button" class="mapp-asset-add-fab" data-asset-add-open aria-label="자산 추가">+</button>' : "";
  }
  function emptyAddDraft(category) {
    return {
      category: category ? `${category.group}|${category.sub}` : "", product: "", assetNo: "", totalQty: "",
      photos: [], primaryPhoto: 0, expiry: "", expiryTouched: false, labels: [], serial: "", imei: "", manufactured: "",
      purchaseDate: "", purchasePrice: "", note: "",
    };
  }
  function hasAddInput(draft) {
    // 분류 선택·지워진 값·단순 태그 검색어는 이탈 확인에서 제외한다.
    return ["product", "assetNo", "totalQty", "expiry", "serial", "imei", "manufactured", "purchaseDate", "purchasePrice", "note"]
      .some(key => String(draft[key] || "").trim()) || draft.photos.length > 0 || draft.labels.length > 0;
  }
  function confirmAddExit(onLeave, editing = false) {
    const title = editing ? "수정을 중단하시겠습니까?" : "작성을 중단하시겠습니까?";
    const body = editing ? "수정을 중단할 경우 변경된 내용은 저장되지 않습니다." : "지금까지 작성한 내용은 저장되지 않습니다.";
    const cb = document.createElement("div");
    cb.className = "modal-back";
    cb.style.zIndex = 340;
    cb.innerHTML = `<div class="modal sm" style="width:340px" role="dialog" aria-modal="true" aria-label="${title}">
      <h3>${title}</h3>
      <div class="body" style="font-size:14px">${body}</div>
      <div class="foot"><button type="button" class="btn" data-add-stay>취소</button><button type="button" class="btn primary" data-add-leave>확인</button></div></div>`;
    document.body.appendChild(cb);
    cb.querySelector("[data-add-stay]").onclick = () => cb.remove();
    cb.querySelector("[data-add-leave]").onclick = () => { cb.remove(); onLeave(); };
    cb.onclick = event => { if (event.target === cb) cb.remove(); };
  }
  function addCategory(draft) {
    const [group, sub] = (draft.category || "").split("|");
    return window.DATA.categories.find(c => c.group === group && c.sub === sub) || null;
  }
  // 대시보드 wireDateField와 동일: 숫자 8자리 마스킹, 실제 날짜 확인, 빈 값·미래 날짜 허용.
  function formatAddExpiry(value) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    return digits.length > 6 ? `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`
      : digits.length > 4 ? `${digits.slice(0, 4)}.${digits.slice(4)}` : digits;
  }
  function parseAddExpiry(value) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (!digits.length) return "";
    if (digits.length !== 8) return null;
    const y = +digits.slice(0, 4), m = +digits.slice(4, 6), day = +digits.slice(6, 8);
    const date = new Date(y, m - 1, day);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== day) return null;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  }
  function addExpiryFieldHtml(draft) {
    const showError = draft.expiryTouched && parseAddExpiry(draft.expiry) === null;
    return `<div class="mapp-add-field"><label for="mapp-add-expiry">유효기한</label>
      <input id="mapp-add-expiry" data-add-field="expiry" type="text" inputmode="numeric" maxlength="10" placeholder="입력" value="${esc(draft.expiry)}" class="${showError ? "has-err" : ""}" aria-describedby="mapp-add-expiry-hint mapp-add-expiry-error" aria-invalid="${!!showError}">
      <p id="mapp-add-expiry-hint" class="hint mapp-add-expiry-hint">*8자리 입력 (YYYY.MM.DD)</p>
      <p id="mapp-add-expiry-error" class="field-err" data-add-expiry-error${showError ? "" : " hidden"}>유효한 날짜가 아닙니다.</p></div>`;
  }
  function addDraftValid(draft) {
    const cat = addCategory(draft);
    if (!cat || !catViewPermission(cat) || !draft.product.trim()) return false;
    if (!(cat.hiddenFields || []).includes("expiry") && parseAddExpiry(draft.expiry) === null) return false;
    if (draft.editingId) {
      const asset = assets.find(a => a.id === draft.editingId);
      if (!asset || !hasAssetManagePermission() || asset.status === "disposed" || asset.type !== cat.type) return false;
      if (cat.type === "quantity" && Number(draft.totalQty) < (asset.stocks || []).reduce((sum,x) => sum + x.qty,0)) return false;
    }
    if (cat.type === "quantity") return /^[1-9][0-9]*$/.test(draft.totalQty);
    const assetNo = draft.assetNo.trim();
    return !!assetNo && !assets.some(a => a.id !== draft.editingId && a.assetNo === assetNo);
  }
  function addInputHtml(label, key, draft, options) {
    const opts = options || {};
    return `<div class="mapp-add-field"><label for="mapp-add-${key}">${label}${opts.required ? ' <span class="req">*</span>' : ""}</label>
      ${opts.textarea
        ? `<textarea id="mapp-add-${key}" data-add-field="${key}" maxlength="${opts.maxlength || 500}" placeholder="입력">${esc(draft[key])}</textarea>`
        : `<input id="mapp-add-${key}" data-add-field="${key}" type="${opts.type || "text"}"${opts.inputmode ? ` inputmode="${opts.inputmode}"` : ""}${opts.maxlength ? ` maxlength="${opts.maxlength}"` : ""}${opts.list ? ` list="${opts.list}"` : ""} value="${esc(draft[key])}" placeholder="입력">`}
      ${opts.error ? `<p class="field-err" data-add-error hidden>${opts.error}</p>` : ""}</div>`;
  }
  function addProductFieldHtml(draft) {
    return `<div class="mapp-add-field"><label for="mapp-add-product">품목명 <span class="req">*</span></label>
      <div class="mapp-add-input-wrap"><input id="mapp-add-product" data-add-field="product" type="text" maxlength="50" value="${esc(draft.product)}" placeholder="입력" autocomplete="off">
        <div class="mapp-add-suggest" data-add-product-menu hidden></div></div></div>`;
  }
  function addDateSelectHtml(label, key, draft, mode) {
    const value = draft[key];
    const shown = value ? (mode === "month" ? value.replace("-", ".") : window.fmtDate(value)) : "선택";
    return `<div class="mapp-add-field"><label>${label}</label><button type="button" class="mapp-add-date${value ? " selected" : ""}" data-add-date="${key}" data-add-date-mode="${mode}"><span>${shown}</span>${CAL_ICON}</button></div>`;
  }
  function addTagChipsHtml(labels) {
    return labels.map(tag => {
      const color = tagColor(tag);
      return `<span class="tag-chip" style="background:${color.bg};border-color:${color.fg};color:${color.fg}">${esc(tag)}<button type="button" data-add-tag-remove="${esc(tag)}" aria-label="${esc(tag)} 태그 제거" style="color:${color.fg}">${CLOSE_ICON_SM}</button></span>`;
    }).join("");
  }
  function assetAddTagManageScreenHtml(draft) {
    return `<div class="mapp-add-category-popup"><div class="mapp-topbar mapp-add-category-head"><span class="mapp-topbar-title">태그 관리</span><button type="button" class="mapp-add-category-close" data-add-tag-manage-close aria-label="닫기">×</button></div>
      <div class="mapp-add-tag-manage-body"><div class="mapp-add-tag-create"><input type="text" data-add-tag-create placeholder="입력" maxlength="20"><button type="button" class="btn primary" data-add-tag-create-btn>+ 추가</button></div><p class="field-err" data-add-tag-create-error hidden>동일한 명칭이 존재합니다.</p>
        <div class="mapp-add-tag-manage-list" data-add-tag-manage-list>${draft.map((tag, index) => `<div class="mapp-add-tag-manage-row"><div class="tag-manage-name-field"><input type="text" value="${esc(tag.name)}" maxlength="20" data-add-tag-rename="${index}" aria-describedby="mapp-tag-name-required-${index}"><p class="field-err" id="mapp-tag-name-required-${index}" data-add-tag-required="${index}" hidden>명칭은 필수로 입력해야 합니다.</p></div><button type="button" data-add-tag-delete="${index}" aria-label="태그 삭제">×</button></div>`).join("")}</div>
        ${draft.length ? "" : '<p class="mapp-empty">등록된 태그가 없습니다.</p>'}<p class="field-err" data-add-tag-list-error hidden>동일한 명칭이 존재합니다.</p></div>
      <div class="mapp-add-foot"><button type="button" class="btn primary" data-add-tag-manage-save disabled>저장</button></div></div>`;
  }
  function assetAddScreenHtml(draft) {
    const cat = addCategory(draft);
    const hidden = cat ? (cat.hiddenFields || []) : [];
    const categoryLabel = cat ? `${cat.group} › ${cat.sub}` : "선택";
    const photoTiles = draft.photos.map((photo, i) => `<div class="mapp-add-photo-tile${i === draft.primaryPhoto ? " primary" : ""}" style="background:${photo.color}">
      <button type="button" data-add-photo-primary="${i}" aria-label="사진 ${i + 1}${i === draft.primaryPhoto ? " 대표" : ""}">${i === draft.primaryPhoto ? "★" : ""}</button>
      <button type="button" class="mapp-add-photo-delete" data-add-photo-delete="${i}" aria-label="사진 삭제">×</button>
    </div>`).join("");
    return `
      <div class="mapp-topbar mapp-add-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        <span class="mapp-topbar-title">${draft.editingId ? "자산 수정" : "자산 추가"}</span>
      </div>
      <div class="mapp-add-body">
        <div class="mapp-add-field"><label>분류 <span class="req">*</span></label>
          <button type="button" class="mapp-add-select${cat ? " selected" : ""}" data-add-category>${esc(categoryLabel)}<span>›</span></button>
        </div>
        ${addProductFieldHtml(draft)}
        ${cat ? `
          <div class="mapp-add-field"><label>사진</label><div class="mapp-add-photos">${photoTiles}${draft.photos.length < 10 ? '<button type="button" class="mapp-add-photo-plus" data-add-photo aria-label="사진 추가">+</button>' : ""}</div></div>
          ${cat.type === "individual" ? addInputHtml("고유관리번호", "assetNo", draft, { required: true, maxlength: 30, error: "동일한 고유관리번호가 존재합니다." }) : addInputHtml("총 수량", "totalQty", draft, { required: true, inputmode: "numeric", maxlength: 6 })}${draft.editingId && cat.type === "quantity" ? '<p class="field-err" data-edit-qty-error hidden>배분 수량보다 적게 입력할 수 없습니다.</p>' : ""}
          ${!hidden.includes("expiry") ? addExpiryFieldHtml(draft) : ""}
          <div class="mapp-add-field"><div class="mapp-add-field-label"><label>태그</label><button type="button" data-add-tag-manage>태그 관리</button></div><p class="hint mapp-add-tag-hint">최대 5개까지 선택할 수 있습니다.</p>
            <div class="mapp-add-tag-picker"><div class="tag-input-wrap"><div class="tag-chips" data-add-tag-chips>${addTagChipsHtml(draft.labels)}</div><input type="text" data-add-tag-search placeholder="${draft.labels.length ? "" : "검색"}" autocomplete="off"${draft.labels.length >= 5 ? " disabled" : ""}></div><div class="mapp-add-suggest" data-add-tag-menu hidden></div></div></div>
          ${cat.type === "individual" && !hidden.includes("serial") ? addInputHtml("S/N", "serial", draft, { maxlength: 40 }) : ""}
          ${cat.type === "individual" && !hidden.includes("imei") ? addInputHtml("IMEI", "imei", draft, { maxlength: 40 }) : ""}
          ${!hidden.includes("manufactured") ? addDateSelectHtml("제조연월", "manufactured", draft, "month") : ""}
          ${!hidden.includes("purchaseDate") ? addDateSelectHtml("구매연월", "purchaseDate", draft, "month") : ""}
          ${!hidden.includes("purchasePrice") ? addInputHtml("구매가격", "purchasePrice", draft, { inputmode: "numeric", maxlength: 15 }) : ""}
          ${addInputHtml("메모", "note", draft, { textarea: true, maxlength: 500 })}` : ""}
      </div>
      <div class="mapp-add-foot"><button type="button" class="btn primary" data-add-save${addDraftValid(draft) && editDirty(draft) ? "" : " disabled"}>저장</button></div>`;
  }
  function assetAddCategoryScreenHtml(draft) {
    // 자산 관리 권한은 분류·자산 CRUD 범위를 부여하므로 대시보드 등록 화면처럼 전체 소분류를 선택지로 제공한다.
    const categories = window.DATA.categories.filter(cat => catViewPermission(cat) && (!draft.editingId || cat.type === assets.find(a => a.id === draft.editingId).type));
    const groups = [];
    categories.forEach(cat => {
      let group = groups.find(g => g.name === cat.group);
      if (!group) { group = { name: cat.group, items: [] }; groups.push(group); }
      group.items.push(cat);
    });
    return `
      <div class="mapp-add-category-popup">
      <div class="mapp-topbar mapp-add-category-head">
        <span class="mapp-topbar-title">분류</span>
        <button type="button" class="mapp-add-category-close" data-add-category-close aria-label="닫기">×</button>
      </div>
      <div class="mapp-add-category-body">
        <div data-add-category-list>${groups.map(group => `<section class="mapp-add-category-group" data-add-category-group>
          <h2>${esc(group.name)}</h2>${group.items.map(cat => `<button type="button" data-add-category-pick="${esc(`${cat.group}|${cat.sub}`)}"><span>${esc(cat.sub)}</span></button>`).join("")}
        </section>`).join("")}</div>
      </div>
      </div>`;
  }

  // 메뉴 화면 — 실 앱 스크린샷 참고(직원모드와 달리 "비용" 섹션 없음, 맨 위에 "승인" 섹션 추가, 관리
  // 섹션 맨 하단에 직원모드와 동일하게 "자산" 추가). 하단 "Powered by shopl"도 참고 이미지 그대로 재현

  // 앱 메뉴의 관리 진입점. 목록 화면은 자산 프로토타입 범위 밖이므로 대시보드처럼 임의의 상세로 이동.
  const DEMO_DIRECTORY_MEMBER = "김민수";
  const DEMO_DIRECTORY_WORKSITE = "강남점";
  function directoryMenuHtml(kind, expanded) {
    const member = kind === "member";
    const label = member ? "구성원" : "근무지";
    const icon = member
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="7" r="3.5"/><path d="M5 21v-3a7 7 0 0 1 14 0v3H5Z"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h3M14 7h2M8 11h3M8 15h3"/></svg>';
    return `<div class="mapp-menu-folder">
      <button type="button" class="mapp-menu-row mapp-menu-fold" data-menu-fold="${kind}" aria-expanded="${!!expanded}" aria-controls="mapp-menu-${kind}-list"><span class="mapp-menu-ic">${icon}</span><span>${label}</span><span class="mapp-menu-chev" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 6 5 5 5-5"/></svg></span></button>
      <div class="mapp-menu-sublist" id="mapp-menu-${kind}-list"${expanded ? "" : " hidden"}>
        <button type="button" class="mapp-menu-subrow" data-directory-open="${kind}">${label} 관리</button>
        <span class="mapp-menu-subrow">${member ? "퇴사 직원" : "비활성 근무지"}</span>
        <span class="mapp-menu-subrow">설정</span>
      </div></div>`;
  }
  // 상세 자체의 조회 권한은 기존 구성원/근무지 기능의 책임이다. 자산은 기존 소분류 조회 판정을
  // 재사용하며 본인 배정·보유 예외를 유지한다. 기능 설정 관리자 데모 가정으로 자산 권한을 확대하지 않는다.
  function directoryEsc(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }
  function directoryTarget(kind) {
    return { type: kind === "member" ? "employee" : "worksite", value: kind === "member" ? DEMO_DIRECTORY_MEMBER : DEMO_DIRECTORY_WORKSITE };
  }
  function directoryCanViewAsset(a, kind) {
    return false || hasViewPermission(a);
  }
  function directoryAssetAvailable(kind) {
    if (!assetMgmtEnabled()) return false;
    // 자산 0건도 분류 조회 권한으로 노출. 메뉴/부모 탭은 데이터 건수로 숨기지 않는다.
    return false || window.DATA.categories.some(cat => catViewPermission(cat));
  }
  function directoryItems(kind) {
    const target = directoryTarget(kind), result = [];
    assets.forEach(a => {
      if (a.deleted_at || !directoryCanViewAsset(a, kind)) return;
      const list = a.type === "individual" ? a.assignments || [] : a.stocks || [];
      list.forEach(record => {
        if (record[target.type] === target.value) result.push({ asset: a, qty: a.type === "individual" ? 1 : record.qty });
      });
    });
    return sortItems(result);
  }
  // 다른 업무 기능은 이번 프로토타입의 정적 ON 시드/요금제를 재사용한다. 실제 앱 연결 시에는 보고서·게시판
  // 그룹 접근, 수집 대상자 등의 서버 판정을 각각 유지해야 한다(첨부 릴리즈 분석). 아래 true는 임의 상세의
  // 조회자가 본인 또는 관리 대상에 접근 가능하고 기존 업무 그룹도 보유한다는 데모 가정이며 역할 판정이 아니다.
  const DEMO_DIRECTORY_TASK_ACCESS = true;
  const DIRECTORY_WORK_TASKS = [["tam", "판매 목표", "목표 달성 관리", "Enterprise"], ["todo", "할 일", "할 일", "Pro"], ["report", "보고서", "보고서", "Pro"], ["board", "게시판", "게시판", "Pro"], ["sales", "판매량", "판매량", "Enterprise"], ["price", "가격", "가격", "Enterprise"], ["inventory", "재고", "재고", "Enterprise"], ["display", "전시현황", "전시현황", "Enterprise"]];
  function directoryTaskMenus(kind) {
    return DIRECTORY_WORK_TASKS.filter(([key, , feature, minimum]) =>
      (kind === "worksite" || ["todo", "report", "board"].includes(key)) &&
      (kind === "worksite" || DEMO_DIRECTORY_TASK_ACCESS) && featureIsOn(feature, minimum));
  }
  function directoryTaskVisible(kind) {
    // 기존 업무 조건에 자산 조건을 OR로 추가: 다른 업무가 모두 OFF여도 자산으로 업무 탭을 열 수 있다.
    return directoryTaskMenus(kind).length > 0 || directoryAssetAvailable(kind);
  }
  const DIRECTORY_ICONS = {
    asset: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 5v5M15 5v5M10 15h4"/>',
    todo: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="m8 9 2 2 4-4M8 16h8"/>',
    report: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM9 11h6M9 15h4"/>',
    board: '<path d="M7 3h12v17H5V7l2-4Z"/><path d="M9 8h6M9 12h6M9 16h3"/>'
  };
  function directoryIcon(key) { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${DIRECTORY_ICONS[key] || DIRECTORY_ICONS.report}</svg>`; }
  function directoryAssetSectionHtml(kind, state, category) {
    const items = directoryItems(kind).filter(item => !category || (item.asset.group === category.group && item.asset.sub === category.sub));
    if (!items.length) return `${kind === "member" ? '<div class="mapp-count">전체 <b>0</b></div>' : ""}<p class="mapp-directory-empty">배정·보유 중인 자산이 없습니다.</p>`;
    const cat = category && window.DATA.categories.find(c => c.group === category.group && c.sub === category.sub);
    const searchPlaceholder = cat && cat.type === "quantity" ? "품목명" : "품목명/고유관리번호";
    // 구성원 목록은 분류별 섹션 없이 나열하되 내 자산과 같은 sortItems 정렬을 유지한다.
    // 분류 저장 순서 → 품목명 → 개별형 관리번호 / 수량형 해당 대상의 보유량 내림차순.
    return `<div class="mapp-directory-asset-tools"><span>전체 <b data-directory-count>${items.length}</b></span>
      <div class="mapp-directory-search"><input type="search" data-directory-search placeholder="${searchPlaceholder}" aria-label="자산 검색" value="${directoryEsc(state.directorySearch || "")}"><button type="button" data-directory-search-clear aria-label="검색어 지우기"${state.directorySearch ? "" : " hidden"}>×</button></div></div>
      <div class="mapp-directory-asset-list">${items.map(x => {
        const a = x.asset, status = STATUS_LABEL[a.status] || [a.status, ""];
        return `<button type="button" class="mapp-directory-asset-row" data-directory-asset="${directoryEsc(a.id)}"><span><strong>${directoryEsc(a.product)}</strong>${a.type === "individual" ? `<small>${directoryEsc(a.assetNo || "—")}</small>` : ""}${kind === "member" ? `<small class="mapp-directory-asset-category">${directoryEsc(a.group)} › ${directoryEsc(a.sub)}</small>` : ""}</span><span class="badge ${a.type === "individual" ? status[1] : "stock"}">${a.type === "individual" ? status[0] : `${x.qty}개`}</span></button>`;
      }).join("")}</div>
      <p class="mapp-directory-empty" data-directory-search-empty hidden>결과가 없습니다.</p>`;
  }
  // 근무지 업무 카드에는 직원모드 근무지 자산과 같은 분류별 건수만 표시한다.
  // 자산 전체를 인라인으로 나열하지 않으며 검색은 소분류 목록 안에서만 제공한다.
  function directoryWorksiteSummaryHtml() {
    const items = directoryItems("worksite"), groups = new Map();
    items.forEach(item => {
      const key = item.asset.group + "|" + item.asset.sub;
      if (!groups.has(key)) groups.set(key, { group: item.asset.group, sub: item.asset.sub, count: 0 });
      groups.get(key).count++;
    });
    return `<div class="mapp-count">전체 <b>${items.length}</b></div>${items.length
      ? `<div class="mapp-ws-cat-tree">${[...groups.values()].map(category => `<button type="button" class="mapp-ws-cat-row" data-directory-sub-open data-group="${directoryEsc(category.group)}" data-sub="${directoryEsc(category.sub)}"><span>${directoryEsc(category.group)} <span class="mapp-cat-sep">›</span> ${directoryEsc(category.sub)}</span><span class="mapp-ws-cat-count">${category.count}<span class="mapp-menu-chev">›</span></span></button>`).join("")}</div>`
      : '<p class="mapp-directory-empty">배정·보유 중인 자산이 없습니다.</p>'}`;
  }
  function directoryWorksiteAssetsScreenHtml(state) {
    const ws = DEMO_DIRECTORY_WORKSITE, category = state.directoryCategory;
    return `<div class="mapp-directory-page"><div class="mapp-topbar"><button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button></div>
      <div class="mapp-wsdetail-head"><div class="mapp-directory-context">${ws}</div><div class="mapp-wsdetail-sub">${directoryEsc(category.group)} <span class="mapp-cat-sep">›</span> ${directoryEsc(category.sub)}</div></div>
      <div class="mapp-directory-member-assets">${directoryAssetAvailable("worksite") ? directoryAssetSectionHtml("worksite", state, category) : '<p class="mapp-directory-empty">배정·보유 중인 자산이 없습니다.</p>'}</div></div>`;
  }
  function directoryProfileScreenHtml(kind, state) {
    const member = kind === "member", name = directoryTarget(kind).value;
    const info = MEMBERS.find(person => person.name === name) || {};
    const taskVisible = directoryTaskVisible(kind);
    if (state.directoryTab === "work" && !taskVisible) state.directoryTab = "info";
    const selected = state.directoryTab || (taskVisible ? "work" : "info");
    const tabs = member ? [["info", "정보"], ["attendance", "근태"], ["work", "업무"]] : [["attendance", "근무"], ["work", "업무"], ["info", "정보"]];
    const asset = directoryAssetAvailable(kind);
    const otherMenus = directoryTaskMenus(kind);
    const taskBody = member
      ? `${asset ? `<section class="mapp-directory-task-card"><button type="button" class="mapp-directory-fold" data-directory-fold="asset" aria-expanded="${state.directoryAssetExpanded !== false}"><strong>자산</strong><span aria-hidden="true">⌃</span></button><div class="mapp-directory-fold-body"${state.directoryAssetExpanded === false ? " hidden" : ""}>${directoryAssetSectionHtml("member", state)}</div></section>` : ""}${otherMenus.map(([key, label]) => `<button type="button" class="mapp-directory-nav-card" data-directory-placeholder><span class="mapp-directory-task-icon ${key}">${directoryIcon(key)}</span><strong>${label}</strong></button>`).join("")}`
      : `${asset ? `<section class="mapp-directory-task-card"><button type="button" class="mapp-directory-fold" data-directory-fold="asset" aria-expanded="${state.directoryAssetExpanded !== false}"><strong>자산</strong><span aria-hidden="true">⌃</span></button><div class="mapp-directory-fold-body"${state.directoryAssetExpanded === false ? " hidden" : ""}>${directoryWorksiteSummaryHtml()}</div></section>` : ""}${otherMenus.map(([key, label]) => `<section class="mapp-directory-task-card"><button type="button" class="mapp-directory-fold" data-directory-fold="${key}" aria-expanded="true"><strong>${label}</strong><span aria-hidden="true">⌃</span></button><div class="mapp-directory-fold-body"><p class="mapp-directory-empty">${key === "tam" ? "배정된 판매 목표가 없습니다." : key === "todo" ? "오늘 배정된 할 일이 없습니다." : `${label}${["board", "sales", "price", "display"].includes(key) ? "이" : "가"} 없습니다.`}</p></div></section>`).join("")}`;
    const rows = member ? [["그룹", info.team], ["직무", "매니저"], ["직급", "Lv.3"], ["사번", info.empNo], ["휴대폰번호", info.phone]] : [["근무지 코드", WS_CODE[name]], ["주소", WS_ADDRESS[name]]];
    return `<div class="mapp-directory-page">
      ${member ? `<div class="mapp-topbar"><button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button><div class="mapp-directory-top-actions"><button type="button" data-directory-placeholder aria-label="검색">${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></svg>' }</button><button type="button" data-directory-placeholder aria-label="더보기">⋮</button></div></div>
        <header class="mapp-directory-member-header"><div class="mapp-directory-member-top"><span class="mapp-directory-avatar" style="background:${avatarColor(name)}">${name[0]}</span><div class="mapp-directory-contact"><button type="button" data-directory-placeholder aria-label="전화">☎</button><button type="button" data-directory-placeholder aria-label="채팅">${directoryIcon("board")}</button></div></div><h1>${name}</h1><p>${directoryEsc(info.team)}</p><span class="mapp-directory-working">● 근무 중 ›</span></header>`
      : `<div class="mapp-directory-site-hero"><div class="mapp-topbar"><button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button><div class="mapp-directory-top-actions"><button type="button" data-directory-placeholder aria-label="검색">${'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></svg>' }</button></div></div><div class="mapp-directory-map" aria-label="근무지 위치"><svg viewBox="0 0 200 120" aria-hidden="true"><rect width="200" height="120" fill="#e6e9e6"/><path d="M-20 100 140 0M0 40l210 60M70 0l50 120M-10 100l220-90" stroke="#fff" stroke-width="12"/><path d="M100 30a16 16 0 0 0-16 16c0 16 16 29 16 29s16-13 16-29a16 16 0 0 0-16-16Z" fill="#333"/><circle cx="100" cy="46" r="8" fill="#e6e9e6"/></svg></div><div class="mapp-directory-site-photo">${directoryIcon("asset")}<span>${name}</span></div></div><header class="mapp-directory-site-header"><div class="mapp-directory-site-status"><span>활성 ›</span><span class="mapp-directory-favorite" aria-label="즐겨찾는 근무지">★</span></div><h1>${name}</h1><small>${WS_CODE[name] || "—"}</small><p>${WS_ADDRESS[name] || "주소 없음"}<button type="button" data-directory-address-copy aria-label="주소 복사">▣</button></p></header>`}
      <div class="mapp-directory-tabs" role="tablist" aria-label="${member ? "구성원" : "근무지"} 상세">${tabs.filter(([key]) => key !== "work" || taskVisible).map(([key, label]) => `<button type="button" role="tab" aria-selected="${selected === key}" class="${selected === key ? "active" : ""}" data-directory-tab="${key}">${label}</button>`).join("")}</div>
      <div class="mapp-directory-task-body">${selected === "work" ? taskBody : selected === "info" ? `<section class="mapp-directory-info"><h2>기본 정보</h2><dl>${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${directoryEsc(value || "—")}</dd></div>`).join("")}</dl></section>` : '<p class="mapp-directory-empty">근무 내역이 없습니다.</p>'}</div></div>`;
  }
  function wireDirectoryProfile(root, state, draw) {
    root.querySelectorAll("[data-directory-tab]").forEach(button => button.onclick = () => { state.directoryTab = button.dataset.directoryTab; draw(); });
    root.querySelectorAll("[data-directory-placeholder]").forEach(button => button.onclick = () => toast("이 기능은 프로토타입 범위 밖입니다."));
    root.querySelectorAll("[data-directory-fold]").forEach(button => button.onclick = () => {
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded)); button.nextElementSibling.hidden = expanded;
      if (button.dataset.directoryFold === "asset") state.directoryAssetExpanded = !expanded;
    });
    root.querySelectorAll("[data-directory-sub-open]").forEach(button => button.onclick = () => {
      if (!directoryAssetAvailable("worksite")) return;
      state.directoryScroll = root.querySelector(".mapp-screen").scrollTop;
      state.directoryCategory = { group: button.dataset.group, sub: button.dataset.sub };
      state.directorySearch = ""; state.screen = "directory-worksite-assets"; draw();
    });
    const copy = root.querySelector("[data-directory-address-copy]");
    if (copy) copy.onclick = async () => { try { await navigator.clipboard.writeText(WS_ADDRESS[DEMO_DIRECTORY_WORKSITE]); toast("주소가 복사되었습니다."); } catch { toast("주소를 복사하지 못했습니다."); } };
    const search = root.querySelector("[data-directory-search]");
    if (!search) return;
    const clear = root.querySelector("[data-directory-search-clear]");
    function filter() {
      state.directorySearch = search.value;
      const query = search.value.trim().toLowerCase(); let total = 0;
      root.querySelectorAll("[data-directory-asset]").forEach(row => {
        const a = assets.find(asset => asset.id === row.dataset.directoryAsset);
        // 품목명만 수량형, 품목명/관리번호 개별형. 대소문자는 검색시에만 정규화한다.
        const matched = !query || a.product.toLowerCase().includes(query) || (a.type === "individual" && (a.assetNo || "").toLowerCase().includes(query));
        row.hidden = !matched; if (matched) total++;
      });
      root.querySelector("[data-directory-count]").textContent = total;
      root.querySelector("[data-directory-search-empty]").hidden = total > 0;
      clear.hidden = !search.value;
    }
    search.addEventListener("input", filter);
    clear.onclick = () => { search.value = ""; filter(); search.focus(); };
    filter();
  }
  function wireDirectoryMenu(root, state, draw) {
    root.querySelectorAll("[data-menu-fold]").forEach(button => button.onclick = () => {
      const kind = button.dataset.menuFold;
      const expanded = !state.menuExpanded[kind];
      state.menuExpanded[kind] = expanded;
      button.setAttribute("aria-expanded", String(expanded));
      root.querySelector(`#mapp-menu-${kind}-list`).hidden = !expanded;
    });
    root.querySelectorAll("[data-directory-open]").forEach(button => button.onclick = () => {
      state.menuScroll = root.querySelector(".mapp-screen").scrollTop;
      state.screen = button.dataset.directoryOpen === "member" ? "member-profile" : "worksite-profile";
      state.directoryTab = "work"; state.directoryAssetExpanded = true; state.directorySearch = ""; state.directoryScroll = 0;
      draw();
    });
  }

  function menuScreenHtml(menuExpanded = {}) {
    return `
      <div class="mapp-menu-head">
        <span class="mapp-brand">shopl <b>샤플앤컴퍼니</b></span>
        <span class="mapp-gear">⚙</span>
      </div>
      <div class="mapp-body mapp-menu-body">
        <div class="mapp-menu-cap">승인</div>
        <div class="mapp-menu-row"><span class="mapp-menu-ic">📋</span>승인<span class="mapp-dot-badge"></span></div>
        <div class="mapp-menu-cap">관리</div>
        ${directoryMenuHtml("member", menuExpanded.member)}
        ${directoryMenuHtml("worksite", menuExpanded.worksite)}
        <div class="mapp-menu-row"><span class="mapp-menu-ic">👥</span>그룹</div>
        ${assetMgmtEnabled() ? `<div class="mapp-menu-row" data-mapp-goto="assets"><span class="mapp-menu-ic">${MENU_ICON_ASSET}</span>자산</div>` : ""}
        <div class="mapp-menu-cap">설정 및 결제</div>
        <div class="mapp-menu-row">
          <span class="mapp-menu-ic">⚙</span>회사 설정<span class="mapp-menu-chev">⌄</span>
        </div>
        ${canConfigureFeatures() ? `<button type="button" class="mapp-menu-row mapp-menu-link" data-mapp-goto="plan-features"><span class="mapp-menu-ic">🔌</span>요금제 및 기능</button>` : ""}
        <div class="mapp-menu-divider"></div>
        <div class="mapp-menu-row muted"><span class="mapp-menu-ic">🎧</span>고객 센터</div>
        <div class="mapp-menu-footer">Powered by <b>shopl</b></div>
      </div>`;
  }

  // 하단 탭바 — 직원모드는 "업무"지만 리더모드는 "승인"(빨간 점 뱃지 포함). 이번 스코프는 "메뉴"만 실제로
  // 동작하고 "홈"·"승인"은 자리만(클릭해도 아무 동작 없음)
  function tabBarHtml(active) {
    const items = [
      { key: "home", ic: "⌂", label: "홈" },
      { key: "approval", ic: "☑", label: "승인", dot: true },
      { key: "menu", ic: "☰", label: "메뉴" },
    ];
    return `<div class="mapp-tabbar">${items.map(t =>
      `<button type="button" class="mapp-tab${t.key === active ? " active" : ""}" data-mapp-tab="${t.key}">
        <span class="mapp-tab-ic">${t.ic}${t.dot ? '<span class="mapp-dot-badge"></span>' : ""}</span>${t.label}
      </button>`
    ).join("")}</div>`;
  }

  // 자산 화면(허브) — 대시보드 분류 관리 화면의 트리처럼 조회 권한 가진 대분류·소분류를 전부 보여주기만
  // 하고, 소분류를 눌러야 실제 목록(소분류 상세 화면)으로 드릴다운(2026-09-30 — 유형 칩까지 없애고 순수
  // 카테고리 탐색 화면으로 단순화. 카드가 보이는 곳은 소분류 상세 화면 하나뿐이라는 규칙은 그대로)
  function assetsScreenHtml() {
    const groups = categoryTree();
    return `
      <div class="mapp-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        <span class="mapp-topbar-title">자산</span>
      </div>
      <div class="mapp-body">
        ${groups.length ? groups.map(g => `
          <button type="button" class="mapp-menu-cap mapp-tree-group-head" data-tree-collapse aria-expanded="true" aria-label="접기/펼치기">
            <span>${g.group}</span>${CHEV_DOWN}
          </button>
          <div class="mapp-ws-cat-tree" data-tree-collapsible>${g.subs.length ? g.subs.map(sub => `
            <button type="button" class="mapp-ws-cat-row" data-sub-open data-sub="${sub}">
              <span>${sub}</span>
              <span class="mapp-ws-cat-count">${countForSub(sub)}<span class="mapp-menu-chev">›</span></span>
            </button>`).join("") : `<p class="mapp-ws-empty">소분류 없음</p>`}</div>`).join("")
          : `<p class="mapp-ws-empty">조회 가능한 자산이 없습니다.</p>`}
      </div>
      ${addFabHtml()}`;
  }
  // 소분류 상세 화면 — 카드가 실제로 보이는 유일한 화면. 소분류가 정해지면 자산 유형도 자동으로 정해지므로
  // (한 소분류는 개별형·수량형 중 하나만) 그 유형에 맞는 상태 칩을 단일 선택으로 노출. 전체가 기본 선택이고,
  // 선택한 칩을 다시 눌러도 유지되며 전체를 누르면 모든 상태를 보여줌(2026-09-30).
  // 팝업 필터와 상태 칩은 동시에 적용하지 않고 마지막으로 적용한 방식으로 교체.
  const INDIV_STATUS_CHIPS = [["all", "전체"], ["stock", "재고"], ["assigned", "배정 중"], ["lost", "분실"], ["repair", "수리 중"]];
  const QTY_STATUS_CHIPS = [["all", "전체"], ["stock", "재고"], ["held", "보유 중"], ["depleted", "소진"], ["unheld", "미보유대상"]];
  // 대시보드 통계 카드의 "?" 도움말 툴팁과 동일 문구(assets.js statHelp) — 소진·미보유대상은 라벨만으론
  // 뜻이 안 잡히는 파생 개념이라, 앱에선 툴팁 대신 필터 적용 시 그 아래 항상 문구로 노출(2026-09-30)
  const STATUS_HELP = {
    depleted: "전체 수량을 모두 배분해 남은 잔여 수량이 없는 품목의 수입니다.",
    unheld: "보유 수량이 0개인 보유 대상의 수입니다.",
  };
  function matchesStatus(a, type, statusFilter) {
    if (statusFilter === "all") return true;
    if (type === "individual") return a.status === statusFilter;
    if (statusFilter === "stock" || statusFilter === "held") return a.status === statusFilter;
    if (statusFilter === "depleted") return isDepleted(a);
    if (statusFilter === "unheld") return hasUnheldHolder(a);
    return true;
  }
  function subDetailScreenHtml(sub, statusFilter, popupFilters) {
    const cat = window.DATA.categories.find(c => c.sub === sub) || {};
    const type = cat.type || "individual";
    const searchPlaceholder = type === "quantity" ? "품목명" : "품목명/고유관리번호";
    const statusChips = type === "individual" ? INDIV_STATUS_CHIPS : QTY_STATUS_CHIPS;
    // 소분류 자체가 빈 경우와 상태 필터 결과만 빈 경우를 구분(대시보드와 동일 문구).
    const subItems = collectLeaderItems().filter(x => x.asset.sub === sub);
    const filterGroups = MappAssetFilter.config(cat, "leader");
    const popupActive = MappAssetFilter.count(popupFilters) > 0;
    const items = sortItems(subItems.filter(x => popupActive
      ? MappAssetFilter.matches(x.asset, popupFilters) : matchesStatus(x.asset, type, statusFilter)));
    const emptyMsg = subItems.length ? "결과가 없습니다." : "등록된 자산이 없습니다.";
    return `
      <div class="mapp-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        ${MappAssetFilter.buttonHtml(popupFilters)}
      </div>
      <div class="mapp-subdetail-head">
        <h1 class="mapp-subdetail-title">${cat.group || ""} <span class="mapp-cat-sep">›</span> ${sub}</h1>
      </div>
      <div class="mapp-body">
        ${subItems.length ? `<div class="mapp-chip-row">${statusChips.map(([k, l]) =>
          `<button type="button" class="mapp-chip${k === statusFilter ? " active" : ""}" data-status-chip="${k}" aria-pressed="${k === statusFilter}">${l}</button>`).join("")}</div>` : ""}
        ${subItems.length && STATUS_HELP[statusFilter] ? `<p class="hint">${STATUS_HELP[statusFilter]}</p>` : ""}
        <div class="mapp-search">
          <input type="text" data-mapp-search placeholder="${searchPlaceholder}">
        </div>
        ${MappAssetFilter.appliedHtml(popupFilters, filterGroups)}
        <div class="mapp-count">전체 <b data-leader-result-count>${items.length}</b></div>
        ${items.length ? `<div class="mapp-card-list">${items.map(x => assetCardHtml(x)).join("")}</div><p class="mapp-ws-empty" data-mapp-empty hidden>결과가 없습니다.</p>` : `<p class="mapp-ws-empty" data-mapp-empty>${emptyMsg}</p>`}
      </div>
      ${addFabHtml()}`;
  }


  // 구조설계안 4.1/4.3: 관리권한자는 전체 변경 가능. 조회 권한과 변경 권한은 별도로 판정한다.
  function canManage(a) {
    if (!a || a.status === "disposed" || !hasViewPermission(a)) return false;
    if (hasAssetManagePermission()) return true;
    const cat = window.DATA.categories.find(c => c.group === a.group && c.sub === a.sub);
    switch (cat && cat.assign) {
      case "회사의 모든 구성원": case "모든 관리자 및 리더": return true;
      case "특정 관리자/리더": return (cat.assignTarget && cat.assignTarget.members || []).includes(ME);
      case "특정 그룹 및 직무/직급": return (cat.assignTarget && cat.assignTarget.groups || []).includes(MEMBER_TEAM[ME]);
      default: return false;
    }
  }
  function derivedActiveStatus(a) { return (a.assignments || []).length ? "assigned" : "stock"; }
  function derivedHeldStatus(a) { return (a.stocks || []).reduce((sum, x) => sum + x.qty, 0) > 0 ? "held" : "stock"; }
  function categoryPath(a) { return `${esc(a.group)} › ${esc(a.sub)}`; }
  function editDraftFor(a) {
    return { ...emptyAddDraft({ group: a.group, sub: a.sub }), editingId: a.id, product: a.product,
      assetNo: a.assetNo || "", totalQty: a.totalQty == null ? "" : String(a.totalQty),
      photos: window.assetPhotos(a).map(p => ({ ...p })), primaryPhoto: a._primary || 0,
      expiry: (a.expiry || "").replaceAll("-", "."), labels: [...(a.labels || [])], serial: a.serial || "", imei: a.imei || "",
      manufactured: (a.manufactured || "").slice(0, 7), purchaseDate: (a.purchaseDate || "").slice(0, 7),
      purchasePrice: a.price == null ? "" : formatAddPrice(String(a.price)), note: a.note || "" };
  }
  function draftSnapshot(draft) {
    return JSON.stringify({ category: draft.category, product: draft.product.trim(), assetNo: draft.assetNo.trim(),
      totalQty: Number(draft.totalQty), photos: draft.photos, primaryPhoto: draft.primaryPhoto, expiry: parseAddExpiry(draft.expiry) ?? draft.expiry.trim(),
      labels: [...draft.labels].sort(), serial: draft.serial.trim(), imei: draft.imei.trim(), manufactured: draft.manufactured,
      purchaseDate: draft.purchaseDate, purchasePrice: draft.purchasePrice.replace(/[^0-9]/g, ""), note: draft.note.trim() });
  }
  function editDirty(draft) {
    return !draft.editingId || draftSnapshot(draft) !== draftSnapshot(editDraftFor(assets.find(a => a.id === draft.editingId)));
  }
  function applyAssetEdit(a, draft) {
    activityLog(a);
    const cat = addCategory(draft);
    const set = (key, value, script, format = v => v || "") => {
      if ((a[key] ?? "") === (value ?? "")) return;
      logActivity(a, { script: `자산 정보 수정: ${script}`, before: format(a[key]), after: format(value) });
      a[key] = value;
    };
    if (a.group !== cat.group || a.sub !== cat.sub) {
      logActivity(a, { script: "자산 정보 수정: 소분류 이동", before: `${a.group} › ${a.sub}`, after: `${cat.group} › ${cat.sub}` });
      a.group = cat.group; a.sub = cat.sub;
    }
    set("product", draft.product.trim(), "품목명 수정");
    if (a.type === "individual") {
      set("assetNo", draft.assetNo.trim(), "고유관리번호 수정");
      set("serial", draft.serial.trim() || undefined, "S/N 수정"); set("imei", draft.imei.trim() || undefined, "IMEI 수정");
    } else set("totalQty", Number(draft.totalQty), "총 수량 변경", v => `${v}개`);
    if (JSON.stringify(a.labels || []) !== JSON.stringify(draft.labels)) {
      logActivity(a, { script: "자산 정보 수정: 태그 수정", before: (a.labels || []).join(", "), after: draft.labels.join(", ") });
      a.labels = [...draft.labels];
    }
    const expiry = parseAddExpiry(draft.expiry);
    if (expiry !== null) set("expiry", expiry || undefined, "유효기한 변경", v => v ? window.fmtDate(v) : "");
    for (const [key, script] of [["manufactured", "제조연월 변경"], ["purchaseDate", "구매연월 변경"]]) {
      if ((a[key] || "").slice(0, 7) !== draft[key]) set(key, draft[key] ? `${draft[key]}-01` : undefined, script, v => v ? window.fmtMonth(v) : "");
    }
    set("price", draft.purchasePrice ? Number(draft.purchasePrice.replace(/[^0-9]/g, "")) : undefined, "구매가격 변경", v => v == null ? "" : window.formatPrice(v));
    set("note", draft.note.trim() || undefined, "메모 수정");
    a._photos = draft.photos.map(p => ({ ...p })); a._primary = draft.primaryPhoto;
    a.photo = draft.photos[draft.primaryPhoto]?.color || null; a.photoCount = draft.photos.length;
  }

  const WS_CODE = { "강남점": "GN-01", "판교점": "PG-01", "본사": "HQ-01", "역삼점": "YS-01" };
  const WS_ADDRESS = {
    "강남점": "서울특별시 강남구 테헤란로 129",
    "판교점": "경기도 성남시 분당구 판교역로 235",
    "본사": "서울특별시 중구 을지로 100",
    "역삼점": "서울특별시 강남구 역삼로 180",
  };
  // 구성원마다 고정 근무지 1개 + 담당 근무지 여러 개(최대 100개, 프로토타입은 데모용으로 소수만) — 이 매핑
  // 자체가 구조설계안에 없던 새 더미 데이터라 이 파일에만 정의(자산관리 기능이 아니라 근무지 기능 소관이라
  // 실 서비스엔 이미 구성원마다 저장돼 있는 값을 여기선 데모용으로 시드)
  const MY_WORKSITES = {
    // 역삼점은 조회 가능한 자산이 하나도 없는 근무지 빈 상태 테스트용(2026-09-30) — 이 근무지의 유일한
    // 자산(A026)이 조회 권한 "모든 관리자 및 리더"인 모니터라 전 구성원 기준 항상 필터링됨
    "김민수": { fixed: "본사", assigned: ["강남점", "판교점", "역삼점"] },
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

  function expiryBadge(d) {
    if (!d) return '<span class="muted">—</span>';
    const days = Math.ceil((new Date(d) - TODAY) / 86400000);
    const [t, c] = days < 0 ? ["만료", "exp-over"] : days <= 7 ? ["만료 예정", "exp-soon"] : ["유효", "exp-valid"];
    return `${window.fmtDate(d)} <span class="badge ${c}">${t}</span>`;
  }
  // "나" 페르소나 — 구성원 상세와 동일하게 더미 중 한 명을 기본값으로(?me= 쿼리로 다른 사람도 테스트 가능)

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
      d: `${x.since} 09:00`, script: "배정 관리: 신규 배정", target: { ...x }, before: "", after: window.fmtDate(x.since), who: "dana",
    }));
    (a.stocks || []).forEach(x => ev.push({
      d: `${a.purchaseDate || "2025-01-01"} 09:00`, script: "보유 관리: 보유 대상 추가", target: { ...x }, before: "", after: `${x.qty}개`, who: "dana",
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
    activityLog(a).unshift({ d: nowStr(), who: ME, ...entry, ...(entry.target ? { target: { ...entry.target } } : {}) });
  }
  // 이력 카드 1건 — 대상 이름은 기존/변경 값에 포함, 값이 "없음"인 쪽엔 대상 이름을 안 붙임(detail.js historyCardHtml과 동일)
  function historyCardHtml(e) {
    const val = v => esc(v || "없음");
    const targetName = e.target ? (e.target.employee || e.target.worksite) : null;
    const targetMark = e.target
      ? (e.target.employee
          ? `<span class="hval-avatar" style="background:${avatarColor(e.target.employee)}">${e.target.employee[0]}</span>`
          : IC_WS)
      : "";
    const withTarget = v => (targetName && v) ? `${targetMark}${esc(targetName)} · ${val(v)}` : val(v);
    return `
      <div class="hcard">
        <div class="hcard-head">
          <span class="hcard-time">${window.fmtDateTime(e.d)}</span>
          <span class="hcard-avatar" style="background:${avatarColor(e.who)}">${e.who[0]}</span>
          <span class="hcard-who">${e.who}</span>
        </div>
        <div class="hcard-script">${esc(e.script)}</div>
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
        <span class="mapp-topbar-title">자산 이력</span>
      </div>
      <div class="mapp-body">
        ${a.type === "quantity" ? `<div class="mapp-search"><input type="text" data-history-q placeholder="구성원·근무지 이름으로 검색"></div>` : ""}
        <div data-history-list>${timelineHtml(a, "")}</div>
      </div>`;
  }

  // 전체 화면 오버레이 공용 헬퍼(폼 페이지·대상 선택 페이지·바텀시트 전부) — 폰 목업(.mapp-phone) 자체를
  // 다시 그리는 draw()와 무관하게 독립적으로 떠 있어야 해서(그래야 타이핑·피커 조작 중 실수로 draw()가
  // 불려도 안 날아감) body에 별도로 붙이되, 매번 폰 화면 영역(.mapp-screen)의 실제 좌표를 재서 그 자리에
  // 고정 — 그래야 상태바+베젤이 그대로 보이는 채로 "폰 안의 화면"만 바뀐 것처럼 보임(2026-09-29, 뷰포트
  // 전체를 덮어 폰 목업 자체가 사라져 보이던 문제 수정, 이어서 바텀시트도 같은 문제라 공용화)

  function openMemberPickerPage(initial, onApply, exclude) {
    let query = "";
    const excludeNames = [].concat(exclude || []).filter(Boolean);
    const p = mappOverlay("mapp-fullpage-back", 105);
    p.innerHTML = `
      <div class="mapp-fullpage-head">
        <span class="mapp-fullpage-head-title">구성원</span>
        <button type="button" class="mapp-fullpage-head-close" data-picker-close aria-label="닫기">${CLOSE_ICON}</button>
      </div>
      <div class="mapp-fullpage-body">
        <input type="text" class="picker-search" placeholder="이름/사번/휴대폰번호">
        <div data-list></div>
      </div>`;
    const list = p.querySelector("[data-list]");
    function renderList() {
      const q = query.trim().toLowerCase();
      const filtered = MEMBERS.filter(m => !excludeNames.includes(m.name) && (!q || m.name.includes(q) || m.empNo.includes(q) || m.phone.includes(q)));
      list.innerHTML = filtered.length ? filtered.map(m => `
        <button type="button" class="picker-member-row" data-pick="${m.name}">
          <span class="picker-avatar" style="background:${avatarColor(m.name)}">${m.name[0]}</span>
          <span class="picker-member-info"><b>${m.name}</b><span>${m.team}</span></span>
        </button>`).join("") : `<p class="muted" style="padding:16px 4px">결과가 없습니다.</p>`;
      list.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => { p.remove(); onApply(b.dataset.pick); });
    }
    p.querySelector(".picker-search").addEventListener("input", e => { query = e.target.value; renderList(); });
    renderList();
    p.addEventListener("click", e => { if (e.target === p) p.remove(); });
    p.querySelector("[data-picker-close]").onclick = () => p.remove();
  }
  function openWorksitePickerPage(initial, onApply, exclude) {
    let query = "";
    const excludeNames = [].concat(exclude || []).filter(Boolean);
    const p = mappOverlay("mapp-fullpage-back", 105);
    p.innerHTML = `
      <div class="mapp-fullpage-head">
        <span class="mapp-fullpage-head-title">근무지</span>
        <button type="button" class="mapp-fullpage-head-close" data-picker-close aria-label="닫기">${CLOSE_ICON}</button>
      </div>
      <div class="mapp-fullpage-body">
        <input type="text" class="picker-search" placeholder="근무지명/코드/주소">
        <div data-list></div>
      </div>`;
    const list = p.querySelector("[data-list]");
    const fixedName = myWorksites(ME).fixed;
    function rowHtml(name) {
      const code = WS_CODE[name] ? `(${WS_CODE[name]})` : "";
      return `
        <button type="button" class="mapp-picker-ws-row" data-pick="${name}">
          <div class="mapp-picker-ws-name">${name}${code}</div>
          <div class="mapp-picker-ws-address">${WS_ADDRESS[name] || ""}</div>
        </button>`;
    }
    function renderList() {
      const q = query.trim().toLowerCase();
      const matches = name => !q || name.toLowerCase().includes(q) || (WS_CODE[name] || "").toLowerCase().includes(q) || (WS_ADDRESS[name] || "").toLowerCase().includes(q);
      const rest = Object.keys(WS_CODE)
        .filter(name => name !== fixedName && !excludeNames.includes(name) && matches(name))
        .sort((x, y) => x.localeCompare(y, "ko"));
      const showFixed = fixedName && !excludeNames.includes(fixedName) && matches(fixedName);
      list.innerHTML = (showFixed || rest.length)
        ? (showFixed ? `<div class="mapp-picker-section"><span class="mapp-picker-dot"></span>내 고정 근무지</div>${rowHtml(fixedName)}` : "") + rest.map(rowHtml).join("")
        : `<p class="muted" style="padding:16px 4px">결과가 없습니다.</p>`;
      list.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => { p.remove(); onApply(b.dataset.pick); });
    }
    p.querySelector(".picker-search").addEventListener("input", e => { query = e.target.value; renderList(); });
    renderList();
    p.addEventListener("click", e => { if (e.target === p) p.remove(); });
    p.querySelector("[data-picker-close]").onclick = () => p.remove();
  }
  // 날짜 선택 — 바텀시트 캘린더(2026-09-29, 텍스트 입력 필드에서 전환 — 구성원/근무지처럼 "선택"으로 제공).
  // 월 이동(‹/›)·오늘로 이동, 선택한 날짜는 파란 원 + 아래 텍스트로 표시. maxIso 초과 날짜는 비활성
  function openDateSheet(initialIso, maxIso, onApply) {
    const [by, bm] = (initialIso || maxIso).split("-").map(Number);
    let viewY = by, viewM = bm - 1;
    let selected = initialIso || maxIso;
    const back = mappOverlay("mapp-sheet-back", 110);
    back.innerHTML = `
      <div class="mapp-sheet">
        <div class="mapp-sheet-body" data-cal-body style="padding-top:16px"></div>
        <div class="mapp-sheet-foot">
          <button type="button" class="btn" data-cal-cancel>취소</button>
          <button type="button" class="btn primary" data-cal-ok>확인</button>
        </div>
      </div>`;
    const body = back.querySelector("[data-cal-body]");
    const okBtn = back.querySelector("[data-cal-ok]");
    const WD = ["일", "월", "화", "수", "목", "금", "토"];
    const pad = n => String(n).padStart(2, "0");
    const isoOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
    function drawCal() {
      const startDow = new Date(viewY, viewM, 1).getDay();
      const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
      const cells = Array(startDow).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
      const rows = [];
      for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
      body.innerHTML = `
        <div class="mapp-cal-head">
          <button type="button" data-cal-prev aria-label="이전 달">‹</button>
          <span class="mapp-cal-ym">${viewY}.${pad(viewM + 1)}</span>
          <button type="button" data-cal-next aria-label="다음 달">›</button>
          <button type="button" class="mapp-cal-today" data-cal-today>오늘</button>
        </div>
        <div class="mapp-cal-wd">${WD.map(w => `<span>${w}</span>`).join("")}</div>
        <div class="mapp-cal-grid">${rows.map(row => row.map(d => {
          if (d === null) return `<span class="mapp-cal-cell empty"></span>`;
          const iso = isoOf(viewY, viewM, d);
          const cls = ["mapp-cal-cell"];
          if (iso === selected) cls.push("sel");
          else if (iso === todayStr()) cls.push("today");
          return `<button type="button" class="${cls.join(" ")}" data-cal-day="${iso}"${iso > maxIso ? " disabled" : ""}>${d}</button>`;
        }).join("")).join("")}</div>
        <div class="mapp-cal-sel">${selected ? window.fmtDate(selected) : ""}</div>`;
      body.querySelector("[data-cal-prev]").onclick = () => { viewM--; if (viewM < 0) { viewM = 11; viewY--; } drawCal(); };
      body.querySelector("[data-cal-next]").onclick = () => { viewM++; if (viewM > 11) { viewM = 0; viewY++; } drawCal(); };
      body.querySelector("[data-cal-today]").onclick = () => {
        const [ty, tm] = todayStr().split("-").map(Number);
        viewY = ty; viewM = tm - 1; selected = todayStr(); drawCal();
      };
      body.querySelectorAll("[data-cal-day]").forEach(b => b.onclick = () => { selected = b.dataset.calDay; drawCal(); });
      okBtn.disabled = !selected;
    }
    drawCal();
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-cal-cancel]").onclick = () => back.remove();
    okBtn.onclick = () => { if (!selected) return; back.remove(); onApply(selected); };
  }

  // ===== 배정 추가·재배정·보유 대상 추가 — 전체 화면 페이지(2026-09-29, 바텀시트였다가 다시 전환 — 대상
  // 선택 피커가 풀페이지로, 날짜 선택이 캘린더 시트로 커지면서 폼 자체도 페이지인 쪽이 자연스러움). 구성요소·
  // 문구는 대시보드 모달(detail.js openAssignAddModal/openReassignModal/openHoldAddModal)과 동일: 대상 라디오
  // (구성원/근무지)+"선택 ›"→피커, 배정일도 같은 "선택 ›" 버튼으로 캘린더 시트를 엶. 저장 시 확인 팝업.
  // kind로 세 가지를 분기. 재배정은 기존 배정 카드(읽기전용)+안내 문구가 위에 붙고 새 대상 후보에서 현재
  // 대상을 제외, 보유 대상 추가는 이미 보유 중인 대상 전체를 후보에서 제외(detail.js와 동일 규칙)
  const FORM_CFG = {
    "assign-add": { title: "배정 추가", targetLabel: "배정 대상", confirm: "배정을 추가하시겠습니까?" },
    "reassign": { title: "재배정", targetLabel: "새 배정 대상", confirm: "재배정하시겠습니까?" },
    "hold-add": { title: "보유 대상 추가", targetLabel: "보유 대상", confirm: "보유 대상을 추가하시겠습니까?" },
  };
  function openFormPage(a, target, kind, afterMutate) {
    const cfg = FORM_CFG[kind];
    const f = { picked: null, draft: { employee: null, worksite: null }, dateIso: "", qtyText: "" };
    const old = kind === "reassign" ? a.assignments[target.index] : null;
    const heldNames = kind === "hold-add" ? (a.stocks || []).map(x => x.employee || x.worksite) : [];
    const remaining = kind === "hold-add" ? a.totalQty - (a.stocks || []).reduce((s, x) => s + x.qty, 0) : 0;

    const back = mappOverlay("mapp-fullpage-back", 95);
    back.innerHTML = `
      <div class="mapp-fullpage-head">
        <button type="button" class="mapp-back" data-form-back aria-label="뒤로">←</button>
        <span class="mapp-fullpage-head-title">${cfg.title}</span>
      </div>
      <div class="mapp-fullpage-body" data-form-body></div>
      <div class="mapp-fullpage-foot">
        <button type="button" class="btn primary" data-form-save disabled>저장</button>
      </div>`;
    const body = back.querySelector("[data-form-body]");
    const saveBtn = back.querySelector("[data-form-save]");
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
    const dateSummaryHtml = () => {
      if (!f.dateIso) return `<button type="button" class="perm-target-btn" data-date-open><span class="muted">선택</span><span class="chev">›</span></button>`;
      return `
        <div class="aa-target-selected" data-date-open>
          <span class="perm-chip">${window.fmtDate(f.dateIso)}</span>
          <button type="button" class="aa-target-x" data-date-clear aria-label="선택 해제">${CLOSE_ICON}</button>
        </div>`;
    };
    const updateSaveState = () => {
      const hasTarget = !!(f.picked && f.draft[f.picked]);
      if (kind === "hold-add") { const v = qtyVal(); saveBtn.disabled = !(hasTarget && v !== null && v >= 1 && v <= remaining); }
      else saveBtn.disabled = !(hasTarget && f.dateIso);
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
            <div class="mapp-date-wrap">${dateSummaryHtml()}</div>
          </div>`}`;

      body.querySelectorAll('input[name="form-kind"]').forEach(r => r.onchange = () => { f.picked = r.value; drawBody(); });
      const openBtn = body.querySelector("[data-target-open]");
      if (openBtn) openBtn.onclick = () => {
        const exclude = kind === "reassign" ? (f.picked === "employee" ? old.employee : old.worksite) : kind === "hold-add" ? heldNames : null;
        if (f.picked === "employee") openMemberPickerPage(f.draft.employee, v => { f.draft.employee = v; drawBody(); }, exclude);
        else openWorksitePickerPage(f.draft.worksite, v => { f.draft.worksite = v; drawBody(); }, exclude);
      };
      const clearBtn = body.querySelector("[data-target-clear]");
      if (clearBtn) clearBtn.onclick = e => { e.stopPropagation(); f.draft[f.picked] = null; drawBody(); };
      const dateOpenBtn = body.querySelector("[data-date-open]");
      if (dateOpenBtn) dateOpenBtn.onclick = () => openDateSheet(f.dateIso, todayStr(), v => { f.dateIso = v; drawBody(); });
      const dateClearBtn = body.querySelector("[data-date-clear]");
      if (dateClearBtn) dateClearBtn.onclick = e => { e.stopPropagation(); f.dateIso = ""; drawBody(); };

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
      }
      updateSaveState();
    }
    drawBody();

    const requestClose = () => {
      // 기존 재배정 대상(읽기 전용)은 제외하고 새 작성 필드만 확인한다.
      if (f.picked || Object.values(f.draft).some(Boolean) || f.dateIso || f.qtyText) confirmAddExit(() => back.remove());
      else back.remove();
    };
    back.addEventListener("click", e => { if (e.target === back) requestClose(); });
    back.querySelector("[data-form-back]").onclick = requestClose;
    saveBtn.onclick = () => {
      if (saveBtn.disabled) return;
      const who = f.draft[f.picked];
      const mk = extra => f.picked === "employee" ? { employee: who, worksite: null, ...extra } : { employee: null, worksite: who, ...extra };
      if (kind === "assign-add") {
        const d = f.dateIso;
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
        const d = f.dateIso;
        const record = mk({ since: d });
        confirmModal(cfg.confirm, "", () => {
          back.remove();
          // 반납+신규배정이 아니라 기존 활성 레코드의 대상 자체를 그 자리에서 교체(구조설계안 2.3). target을
          // 특정 한쪽으로 고정할 수 없어 before/after 텍스트로 표현(detail.js와 동일)
          const idx = target.index;
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
    confirmModal("반납 처리하시겠습니까?", "반납하면 배정에서 제거됩니다.", () => {
      const old = a.assignments[idx];
      a.assignments.splice(idx, 1);
      if (a.status === "assigned" || a.status === "stock") a.status = derivedActiveStatus(a);
      logActivity(a, { script: "배정 관리: 반납", target: old, before: window.fmtDate(old.since), after: "" });
      toast("반납되었습니다.");
      onDone();
    });
  }
  // 수량 변경 — 보유 대상 추가 페이지와 동일한 스테퍼 UI로 통일(2026-09-30, 직접입력 number 필드에서 전환)
  // 퇴사 구성원·비활성 근무지도 기존 보유량 감소/0 정리는 가능하지만 추가 배분은 불가.
  // 상태는 기존 대상 엔티티에서 받은 값이며 자산 자체의 재고/보유 상태와는 별개다.
  function stockChangeLimit(a, idx) {
    const record = a.stocks[idx];
    const kind = record.employee ? "employee" : "worksite";
    const name = record.employee || record.worksite;
    const status = window.DATA.targetStatuses?.[kind]?.[name];
    const decreaseOnly = status === (kind === "employee" ? "retired" : "inactive");
    const otherSum = a.stocks.reduce((sum, stock, i) => i === idx ? sum : sum + stock.qty, 0);
    const available = a.totalQty - otherSum;
    return { max: decreaseOnly ? Math.min(record.qty, available) : available, decreaseOnly };
  }
  function openQtyChangeModal(a, idx, onDone) {
    const rec = a.stocks[idx];
    const cur = rec.qty;
    const { max, decreaseOnly } = stockChangeLimit(a, idx);
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal" style="width:340px">
        <div class="body" style="padding-top:20px">
          <p style="font-size:14px;font-weight:700;margin-bottom:14px">수량 변경</p>
          <div class="qty-stepper">
            <button type="button" class="qty-step" data-qminus aria-label="수량 감소">－</button>
            <input type="text" inputmode="numeric" data-qinput placeholder="입력" value="${cur}">
            <button type="button" class="qty-step" data-qplus aria-label="수량 증가">＋</button>
          </div>
          <p class="hint" style="margin-top:6px">${decreaseOnly ? `변경 가능 수량: 0~${max}개` : `잔여 수량: ${max}개`}</p>
        </div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn primary" data-cok>저장</button>
        </div>
      </div>`;
    document.body.appendChild(back);
    const input = back.querySelector("[data-qinput]");
    const minus = back.querySelector("[data-qminus]");
    const plus = back.querySelector("[data-qplus]");
    const saveBtn = back.querySelector("[data-cok]");
    const val = () => { const n = parseInt(input.value, 10); return Number.isFinite(n) ? n : null; };
    const sync = () => {
      const v = val();
      minus.disabled = v === null || v <= 0;
      plus.disabled = v === null || v >= max;
      saveBtn.disabled = v === null || v < 0 || v > max || v === cur;
    };
    input.addEventListener("input", () => { input.value = input.value.replace(/[^0-9]/g, ""); sync(); });
    minus.onclick = () => { const v = val(); if (v !== null && v > 0) { input.value = v - 1; sync(); } };
    plus.onclick = () => { const v = val() ?? 0; if (v < max) { input.value = v + 1; sync(); } };
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-cclose]").onclick = () => back.remove();
    saveBtn.onclick = () => {
      const qty = val();
      // 저장 직전에 현재 대상 상태도 재확인한다. 비활성화 후 수량 증가가 반영되지 않게 한다.
      if (!(qty !== null && qty >= 0 && qty <= stockChangeLimit(a, idx).max) || qty === cur) return;
      back.remove();
      confirmModal("수량을 변경하시겠습니까?", "", () => {
        rec.qty = qty;
        a.status = derivedHeldStatus(a);
        logActivity(a, { script: "보유 관리: 보유 수량 변경", target: rec, before: `${cur}개`, after: `${qty}개` });
        toast("변경되었습니다.");
        onDone();
      });
    };
    sync();
  }
  function openHoldReleaseConfirm(a, idx, onDone) {
    confirmModal("보유 대상에서 해제하시겠습니까?", "해제된 수량은 잔여 수량으로 돌아갑니다.", () => {
      const x = a.stocks[idx];
      const qty = x.qty;
      a.stocks.splice(idx, 1);
      a.status = derivedHeldStatus(a);
      logActivity(a, { script: "보유 관리: 보유 대상 해제", target: { ...x }, before: `${qty}개`, after: "" });
      toast("보유 대상에서 해제되었습니다.");
      onDone();
    });
  }
  // 사진 관리 — asset-register.js의 사진 타일 UI·데이터 형태(window.assetPhotos, a._photos/a._primary)를
  // 그대로 재사용(같은 CSS 클래스 .areg-photo-*는 전역 css/app.css에 이미 정의돼 있어 추가 CSS 불필요)

  function openPhotoManageModal(a, onDone) {
    const photos = window.assetPhotos(a).map(p => ({ ...p }));
    let primaryIdx = a._primary || 0;
    // 사진 목록·업로드 메타와 대표 사진을 최초 상태와 비교한다. 원복하면 저장도 비활성화한다.
    const snapshot = () => JSON.stringify({ photos, primaryIdx });
    const initialSnapshot = snapshot();
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal mapp-photo-modal" style="width:360px">
        <div class="body" style="padding-top:20px">
          <p style="font-size:14px;font-weight:700;margin-bottom:14px">자산 사진</p>
          <div class="areg-photo-row" data-photo-row></div>
        </div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn primary" data-cok disabled>저장</button>
        </div>
      </div>`;
    document.body.appendChild(back);
    const row = back.querySelector("[data-photo-row]");
    const saveBtn = back.querySelector("[data-cok]");
    const syncSaveState = () => { saveBtn.disabled = snapshot() === initialSnapshot; };
    function renderPhotos() {
      syncSaveState();
      const tiles = photos.map((p, i) => `
        <button type="button" class="areg-photo-tile${i === primaryIdx ? " primary" : ""}" data-photo-i="${i}" style="background:${p.color}" aria-label="사진 ${i + 1}${i === primaryIdx ? " (대표)" : ""}">
          ${i === primaryIdx ? '<span class="areg-photo-star">★</span>' : ""}
          <span class="areg-photo-del" data-photo-del="${i}" aria-label="삭제">${CLOSE_ICON_SM}</span>
        </button>`).join("");
      const addTile = photos.length < 10 ? `<button type="button" class="areg-photo-add" data-photo-add aria-label="사진 추가">+</button>` : "";
      row.innerHTML = tiles + addTile;
      row.querySelectorAll("[data-photo-i]").forEach(b => b.onclick = e => {
        if (e.target.closest("[data-photo-del]")) return;
        const i = +b.dataset.photoI;
        if (i === primaryIdx) return;
        primaryIdx = i; renderPhotos();
      });
      row.querySelectorAll("[data-photo-del]").forEach(b => b.onclick = e => {
        e.stopPropagation();
        const i = +b.dataset.photoDel;
        photos.splice(i, 1);
        // 대표 삭제 시 현재 사진 목록에서 가장 앞에 남은 사진을 자동 대표로 지정한다.
        if (!photos.length || primaryIdx === i) primaryIdx = 0;
        else if (primaryIdx > i) primaryIdx -= 1;
        renderPhotos();
      });
      const addBtn = row.querySelector("[data-photo-add]");
      if (addBtn) addBtn.onclick = () => {
        openDropdownMenu(addBtn, [
          { key: "camera", label: "카메라로 촬영하기" },
          { key: "gallery", label: "갤러리에서 불러오기" },
        ], () => {
          photos.push({ color: PHOTO_COLORS[photos.length % PHOTO_COLORS.length], at: `${todayStr()} 00:00`, by: ME });
          if (photos.length === 1) primaryIdx = 0;
          renderPhotos();
        });
      };
    }
    renderPhotos();
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-cclose]").onclick = () => back.remove();
    saveBtn.onclick = () => {
      if (saveBtn.disabled) return;
      back.remove();
      a._photos = photos;
      a._primary = primaryIdx;
      toast("저장되었습니다.");
      onDone();
    };
  }
  // 메모 수정 — 바텀시트(2026-09-29, 센터 모달에서 전환). 메모는 길어질 수 있어 센터 모달보다 세로 공간이
  // 넉넉한 시트가 유리 — 배정 추가/재배정 시트(.mapp-sheet, max-height:80vh)와 같은 컨테이너를 쓰되,
  // 입력란만 있는 화면이라 텍스트영역에 넉넉한 최소 높이를 직접 줘서 그 시트들과 비슷한 체감 높이로 맞춤
  function openMemoEditModal(a, onDone) {
    const before = a.note || "";
    const back = mappOverlay("mapp-sheet-back", 90);
    back.innerHTML = `
      <div class="mapp-sheet">
        <div class="mapp-sheet-head">메모 수정</div>
        <div class="mapp-sheet-body" style="display:flex">
          <textarea data-memo-input maxlength="500" placeholder="입력" style="width:100%;flex:1;min-height:280px;border:1px solid var(--line-strong);border-radius:8px;padding:10px;font:inherit;resize:none">${esc(before)}</textarea>
        </div>
        <div class="mapp-sheet-foot">
          <button type="button" class="btn" data-cclose>취소</button>
          <button type="button" class="btn primary" data-cok disabled>저장</button>
        </div>
      </div>`;
    const input = back.querySelector("[data-memo-input]");
    const saveBtn = back.querySelector("[data-cok]");
    input.addEventListener("input", () => { saveBtn.disabled = input.value.trim() === before; });
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-cclose]").onclick = () => back.remove();
    saveBtn.onclick = () => {
      if (saveBtn.disabled) return;
      const after = input.value.trim();
      back.remove();
      a.note = after;
      logActivity(a, { script: "자산 정보 수정: 메모 수정", before: before || "없음", after: after || "없음" });
      toast("저장되었습니다.");
      onDone();
    };
  }
  // 자산 사진 뷰어 — 조회 전용(편집은 "사진 관리" 액션에서), 조회 권한만 있어도 볼 수 있어야 해서 배정/보유
  // 변경 권한과 무관하게 항상 열 수 있음. 대시보드 detail.js의 openViewer를 단순화(줌·정보패널·수정메뉴 없이
  // 넘기기+닫기만) — 폰 프레임에 맞는 전체화면 뷰어
  const IC_DOWNLOAD = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/></svg>`;
  // 사진 뷰어 — 폰 화면 영역에 뜨는 전체 화면(2026-09-30, 뷰포트 전체를 덮어 폰 목업이 사라져 보이던 문제
  // 수정, 다른 전체 화면 오버레이와 동일하게 mappOverlay 사용). 상단바는 왼쪽 뒤로가기(종료)·가운데 "N/M"
  // 카운트·오른쪽 다운로드(프로토타입이라 실제 파일은 없음, 대시보드 사진 다운로드와 동일하게 토스트로 안내)
  function openPhotoViewer(a) {
    const items = window.assetPhotos(a);
    if (!items.length) return;
    let cur = a._primary || 0;
    const back = mappOverlay("mapp-viewer-back", 250);
    back.innerHTML = `
      <div class="mapp-viewer-bar">
        <button type="button" class="mapp-viewer-back-btn" data-vclose aria-label="닫기">←</button>
        <span class="mapp-viewer-count"></span>
        <button type="button" class="mapp-viewer-dl" data-vdownload aria-label="다운로드">${IC_DOWNLOAD}</button>
      </div>
      <div class="mapp-viewer-stage">
        <button type="button" class="mapp-viewer-nav" data-vprev aria-label="이전">‹</button>
        <div class="mapp-viewer-img"></div>
        <button type="button" class="mapp-viewer-nav" data-vnext aria-label="다음">›</button>
      </div>`;
    const img = back.querySelector(".mapp-viewer-img");
    const countEl = back.querySelector(".mapp-viewer-count");
    const prevBtn = back.querySelector("[data-vprev]");
    const nextBtn = back.querySelector("[data-vnext]");
    function draw() {
      img.style.background = items[cur].color;
      countEl.textContent = `${cur + 1}/${items.length}`;
      prevBtn.hidden = nextBtn.hidden = items.length < 2;
    }
    prevBtn.onclick = () => { cur = (cur - 1 + items.length) % items.length; draw(); };
    nextBtn.onclick = () => { cur = (cur + 1) % items.length; draw(); };
    back.querySelector("[data-vclose]").onclick = () => back.remove();
    back.querySelector("[data-vdownload]").onclick = () => toast("사진을 저장하였습니다.");
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


  function qrSampleSvg() {
    const n = 21, cell = 4, size = n * cell;
    const mods = [];
    const finder = (ox, oy) => {
      for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
        if (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4)) mods.push([ox + x, oy + y]);
      }
    };
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
    let seed = 42;
    const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const inFinder = (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
      if (!inFinder && rand() > 0.55) mods.push([x, y]);
    }
    const rects = mods.map(([x, y]) => `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}"/>`).join("");
    return `<svg viewBox="0 0 ${size} ${size}" fill="#1b1d1f"><rect width="${size}" height="${size}" fill="#fff"/>${rects}</svg>`;
  }


  // 직원 상세의 레이아웃 + 대시보드의 자산 전체 단위 배정/보유 관리. 특정 대상에 귀속되지 않는다.
  function openDropdownMenu(anchor, items, onPick) {
    document.querySelectorAll(".dropdown-menu").forEach(m => m.remove());
    const menu = document.createElement("div");
    menu.className = "dropdown-menu"; menu.setAttribute("role", "menu");
    menu.innerHTML = items.map(x => `${x.sep ? '<div class="dropdown-sep"></div>' : ""}<button type="button" role="menuitem" data-key="${x.key}"${x.danger ? ' class="danger"' : ""}>${x.label}</button>`).join("");
    const r = anchor.getBoundingClientRect();
    menu.style.cssText = `position:fixed;left:${Math.max(8, r.right - 180)}px;min-width:180px`;
    document.body.appendChild(menu);
    const height = menu.getBoundingClientRect().height;
    menu.style.top = `${r.bottom+height+4 > window.innerHeight ? Math.max(8,r.top-height-4) : r.bottom+4}px`;
    anchor.setAttribute("aria-expanded", "true");
    const close = () => {
      menu.remove(); anchor.setAttribute("aria-expanded", "false");
      document.removeEventListener("click", outside); document.removeEventListener("keydown", keydown);
    };
    const outside = e => { if (!menu.contains(e.target) && !anchor.contains(e.target)) close(); };
    const buttons = [...menu.querySelectorAll("button")];
    const keydown = e => {
      if (e.key === "Escape") { e.preventDefault(); close(); anchor.focus({preventScroll:true}); }
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
        e.preventDefault(); const i = buttons.indexOf(document.activeElement);
        buttons[e.key === "Home" ? 0 : e.key === "End" ? buttons.length-1 : (i+(e.key === "ArrowDown" ? 1 : -1)+buttons.length)%buttons.length].focus({preventScroll:true});
      }
    };
    buttons.forEach(b => b.onclick = () => { close(); onPick(b.dataset.key); });
    buttons[0]?.focus({preventScroll:true});
    document.addEventListener("click", outside); document.addEventListener("keydown", keydown);
  }
  // 모바일 검색 대상: 닫힌 버튼에는 아이콘만, 메뉴에는 아이콘과 명칭을 함께 표시한다.
  function openHolderCategoryMenu(anchor, current, onPick) {
    document.querySelectorAll(".dropdown-menu").forEach(menu => menu.remove());
    const menu = document.createElement("div");
    menu.id = "leader-holder-category-menu";
    menu.className = "dropdown-menu mapp-leader-holder-menu";
    menu.setAttribute("role", "menu"); menu.setAttribute("aria-label", "검색 대상");
    menu.innerHTML = [["employee", "구성원", IC_EMP], ["worksite", "근무지", IC_WS]].map(([key,label,icon]) =>
      `<button type="button" role="menuitemradio" aria-checked="${key === current}" data-kind="${key}"><span aria-hidden="true">${icon}</span><span>${label}</span><span class="selection-mark" aria-hidden="true">${key === current ? "✓" : ""}</span></button>`).join("");
    const rect = anchor.getBoundingClientRect();
    menu.style.cssText = `position:fixed;left:${Math.max(8, Math.min(rect.left, window.innerWidth-168))}px;width:160px;`;
    anchor.setAttribute("aria-expanded", "true"); anchor.setAttribute("aria-controls", menu.id);
    document.body.appendChild(menu);
    const height = menu.getBoundingClientRect().height;
    menu.style.top = `${rect.bottom+height+4 > window.innerHeight ? Math.max(8,rect.top-height-4) : rect.bottom+4}px`;
    const close = () => {
      menu.remove(); anchor.setAttribute("aria-expanded", "false"); anchor.removeAttribute("aria-controls");
      document.removeEventListener("click", outside); document.removeEventListener("keydown", keydown);
    };
    const outside = event => { if (!menu.contains(event.target) && !anchor.contains(event.target)) close(); };
    const buttons = [...menu.querySelectorAll("button")];
    const keydown = event => {
      if (event.key === "Escape") { event.preventDefault(); close(); anchor.focus({ preventScroll: true }); }
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault(); const index = buttons.indexOf(document.activeElement);
        const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length-1 : (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
        buttons[next].focus({ preventScroll: true });
      }
    };
    buttons.forEach(button => button.onclick = () => { close(); onPick(button.dataset.kind); anchor.focus({ preventScroll: true }); });
    (buttons.find(button => button.dataset.kind === current) || buttons[0]).focus({ preventScroll: true });
    document.addEventListener("click", outside); document.addEventListener("keydown", keydown);
  }

  const QR_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM19 14h2v2h-2zM14 19h2v2h-2zM19 19h2v2h-2z"/></svg>`;
  const MORE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>`;
  // 근무지 자산 상세는 회사 전체 현황이 아닌 target의 활성 배정/보유 기록을 조회한다.
  // 대상은 진입 시 전달하고 인덱스는 액션 직전에 다시 찾는다(정렬·공동 대상 변경에도 타 기록을 수정하지 않음).
  function findRecord(a, target) {
    const list = a.type === "individual" ? a.assignments || [] : a.stocks || [];
    const idx = list.findIndex(record => record[target.type] === target.value);
    return { list, idx };
  }
  function scopedParties(a, target) {
    const list = a.type === "individual" ? a.assignments || [] : a.stocks || [];
    const others = list.filter(record => record[target.type] !== target.value);
    return a.type === "individual"
      ? others.sort((p, q) => q.since.localeCompare(p.since))
      : others.sort((p, q) => q.qty - p.qty || (p.employee || p.worksite).localeCompare(q.employee || q.worksite, "ko"));
  }
  function scopedPartyRowHtml(record, indiv) {
    return `<div class="mapp-party-row"><div><div class="mapp-party-name">${esc(record.employee || record.worksite)}</div><div class="mapp-party-kind">${record.employee ? "구성원" : "근무지"}</div></div>${indiv ? `<span class="mapp-party-date">${window.fmtDate(record.since)}</span>` : `<span class="badge stock">${record.qty}개</span>`}</div>`;
  }
  function scopedPartiesScreenHtml(a, target) {
    const indiv = a.type === "individual", others = scopedParties(a, target);
    return `<div class="mapp-topbar"><button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button><span class="mapp-topbar-title">${indiv ? "공동 배정 대상" : "공동 보유 대상"}</span></div><div class="mapp-body"><div class="mapp-count">전체 <b>${others.length}</b></div><div class="mapp-party-list">${others.map(record => scopedPartyRowHtml(record, indiv)).join("")}</div></div>`;
  }
  function scopedPartySectionHtml(a, target) {
    const indiv = a.type === "individual", others = scopedParties(a, target);
    return `<div class="dsection"><div class="mapp-party-header"><h2 class="mapp-party-head">${indiv ? "공동 배정 대상" : "공동 보유 대상"}</h2>${canManage(a) ? `<button type="button" class="btn sm" data-holder-add>${indiv ? "배정 추가" : "보유 대상 추가"}</button>` : ""}</div><div class="mapp-count">전체 <b>${others.length}</b></div>${others.length ? `<div class="mapp-party-list">${others.slice(0, 5).map(record => scopedPartyRowHtml(record, indiv)).join("")}</div>` : `<p class="mapp-party-empty">${indiv ? "공동 배정 대상이 없습니다." : "공동 보유 대상이 없습니다."}</p>`}${others.length > 5 ? '<button type="button" class="mapp-party-viewall" data-parties-viewall>전체보기</button>' : ""}</div>`;
  }
  function scopedManageActions(a, target) {
    if (!target || !canManage(a) || findRecord(a, target).idx < 0) return [];
    return a.type === "individual"
      ? [{key:"date",label:"배정일 수정",sep:true},{key:"reassign",label:"재배정"},{key:"return",label:"반납",danger:true}]
      : [{key:"qty-change",label:"수량 변경",sep:true},{key:"hold-release",label:"보유 해제",danger:true}];
  }
  // 회사 자산 진입은 전체 현황, 근무지 진입(target)은 직원모드와 같은 해당 근무지 기록 중심 상세.
  // 대상 기준 상세는 자산 수정·삭제를 제공하지 않으며 배정/보유 변경 권한에 따른 관리 기능만 제공한다.
  function leaderAssetDetailHtml(a, target = null) {
    activityLog(a);
    const indiv = a.type === "individual", editable = canManage(a), photos = window.assetPhotos(a);
    const hidden = (window.DATA.categories.find(c => c.group === a.group && c.sub === a.sub) || {}).hiddenFields || [];
    const kv = [
      ["분류", `<span class="type-pill">${indiv ? "개별 자산" : "수량 자산"}</span><div>${categoryPath(a)}</div>`],
      ["유효기한", expiryBadge(a.expiry), "expiry"], ["태그", (a.labels || []).map(l => `<span class="tag">${esc(l)}</span>`).join("") || "—"],
      ...(indiv ? [["S/N", esc(a.serial || "—"), "serial"], ["IMEI", esc(a.imei || "—"), "imei"]] : []),
      ["제조연월", a.manufactured ? window.fmtMonth(a.manufactured) : "—", "manufactured"],
      ["구매연월", a.purchaseDate ? window.fmtMonth(a.purchaseDate) : "—", "purchaseDate"],
      ["구매가격", a.price != null ? window.formatPrice(a.price) : "—", "purchasePrice"],
      ["자산 등록일", window.fmtDate(a.createdAt)],
      ["QR 라벨", `<button type="button" class="btn sm icon-only" data-qr-open aria-label="QR 라벨">${QR_ICON}</button>`],
      ["메모", `<span class="mapp-leader-note">${esc(a.note || "—")}</span>${editable ? `<button type="button" class="icon-edit" data-memoedit aria-label="메모 수정">${IC_EDIT}</button>` : ""}`],
    ].filter(row => !row[2] || !hidden.includes(row[2])).map(([k,v]) => `<div><div class="k">${k}</div><div class="v">${v}</div></div>`).join("");
    const record = target ? findRecord(a, target) : null;
    const current = record && record.idx >= 0 ? record.list[record.idx] : null;
    const distributed = (a.stocks || []).reduce((sum,x) => sum + x.qty,0);
    const badge = target && !indiv ? `<span class="badge stock">${current ? current.qty : 0}개</span>` : statusActions(a).length ? `<button type="button" class="badge ${STATUS_LABEL[a.status][1]} clickable" data-status-open>${STATUS_LABEL[a.status][0]} ▾</button>` : `<span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>`;
    return `<div class="mapp-topbar"><button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button><button type="button" class="mapp-more" data-more-open aria-label="더보기">${MORE_ICON}</button></div>
      <div class="mapp-body mapp-leader-detail-body">
        ${target ? `<div class="mapp-directory-context mapp-scoped-context">${esc(target.value)}</div>` : ""}
        <div class="dhead-id"><div class="mapp-hero-wrap"><button type="button" class="mapp-hero-img" data-hero-viewer aria-label="사진 보기"${photos.length ? "" : " disabled"}>${cardThumb(a)}</button>${photos.length > 1 ? `<span class="mapp-hero-count">+${photos.length-1}</span>` : ""}${editable ? `<button type="button" class="mapp-hero-edit" data-hero-edit aria-label="사진 관리">${IC_EDIT}</button>` : ""}</div>
          <div><h1>${esc(a.product)}</h1><div class="dhead-sub">${badge}${indiv ? `<div>고유관리번호 <b>${esc(a.assetNo)}</b></div>` : ""}${target && indiv && current ? `<div>배정일 ${window.fmtDate(current.since)}</div>` : ""}</div></div></div>
        ${!target && !indiv ? `<div class="mapp-leader-qty-summary"><div>전체<strong>${a.totalQty}개</strong></div><div>보유<strong>${distributed}개</strong></div><div>잔여<strong>${a.totalQty-distributed}개</strong></div></div>` : ""}
        <div class="dsection"><div class="kv2">${kv}</div></div>
        ${target ? scopedPartySectionHtml(a, target) : `<div class="dsection"><div class="mapp-leader-holders-head"><h2>${indiv ? "배정 현황" : "보유 현황"}</h2>${editable ? `<button type="button" class="btn sm" data-holder-add>${indiv ? "배정 추가" : "보유 대상 추가"}</button>` : ""}</div>
          <div class="mapp-count">전체 <b>${(indiv ? a.assignments || [] : a.stocks || []).length}</b></div>
          ${!indiv ? `<div class="mapp-leader-holder-search"><button type="button" class="mapp-leader-holder-kind" data-holder-category aria-label="검색 대상: 구성원" aria-haspopup="menu" aria-expanded="false"><span aria-hidden="true">${IC_EMP}</span><span class="chev" aria-hidden="true">${CHEV_DOWN}</span></button><input type="text" data-holder-query placeholder="이름/사번/휴대폰번호"></div>` : ""}
          <div data-holder-list></div>
        </div>`}</div>`;
  }
  function leaderHolderList(a, query, kind, requestedPage) {
    const indiv = a.type === "individual", q = (query || "").trim().toLowerCase();
    const rows = (indiv ? a.assignments || [] : a.stocks || []).map((x,idx) => ({x,idx})).filter(({x}) => {
      if (!q) return true;
      if (kind === "worksite") return x.worksite && (x.worksite.toLowerCase().includes(q) || (WS_CODE[x.worksite] || "").toLowerCase().includes(q));
      const member = MEMBERS.find(m => m.name === x.employee);
      return x.employee && (x.employee.toLowerCase().includes(q) || !!member && (member.empNo.includes(q) || member.phone.includes(q)));
    }).sort((p,r) => indiv ? r.x.since.localeCompare(p.x.since) : r.x.qty-p.x.qty || (p.x.employee || p.x.worksite).localeCompare(r.x.employee || r.x.worksite,"ko"));
    const pages = Math.max(1,Math.ceil(rows.length/20)), page = Math.min(requestedPage,pages);
    return { page, html: rows.length ? `<div class="acard-list">${rows.slice((page-1)*20,page*20).map(({x,idx}) => `<div class="acard${canManage(a) ? " has-actions" : ""}">${typeBadge(x)}${canManage(a) ? `<button type="button" class="mapp-holder-more" data-holder-more data-index="${idx}" aria-label="${esc(x.employee || x.worksite)} ${indiv ? "배정" : "보유"} 관리" aria-haspopup="menu" aria-expanded="false">${MORE_ICON}</button>` : ""}<div class="acard-id">${assignIdentity(x)}</div><div class="acard-foot"><span class="acard-date">${indiv ? `배정일 <b>${window.fmtDate(x.since)}</b>` : `보유 수량 <b>${x.qty}개</b>`}</span></div></div>`).join("")}</div>${pages>1 ? `<div class="pager"><button data-holder-page="-1"${page===1 ? " disabled" : ""} aria-label="이전 페이지">‹</button><span>${page} / ${pages}</span><button data-holder-page="1"${page===pages ? " disabled" : ""} aria-label="다음 페이지">›</button></div>` : ""}` : `<p class="muted">${q ? "결과가 없습니다." : indiv ? "배정 대상이 없습니다." : "보유 대상이 없습니다."}</p>` };
  }
  function openLeaderQr(a) {
    const back = mappOverlay("mapp-sheet-back", 90);
    back.innerHTML = `<div class="mapp-sheet"><div class="mapp-sheet-head">QR 라벨</div><div class="mapp-sheet-body mapp-leader-qr-sheet"><div class="label-sheet"><div class="label-qr">${qrSampleSvg()}</div><div class="label-text"><div class="label-product">${esc(a.product)}</div>${a.assetNo ? `<div class="label-no">${esc(a.assetNo)}</div>` : ""}<div class="label-cat">${categoryPath(a)}</div></div></div></div><div class="mapp-sheet-foot"><button type="button" class="btn" data-qr-close>닫기</button><button type="button" class="btn primary" data-qr-download>다운로드</button></div></div>`;
    back.querySelector('[data-qr-close]').onclick = () => back.remove();
    back.onclick = e => { if (e.target === back) back.remove(); };
    back.querySelector('[data-qr-download]').onclick = () => {
      const now = new Date(), pad = n => String(n).padStart(2,"0");
      const stamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      toast(`"QR_${a.type === "individual" ? a.assetNo : a.product}_${stamp}.png" 다운로드 (프로토타입 — 반영 없음)`); back.remove();
    };
  }

  function openDeleteAssetModal(a, onDone) {
    const cb = document.createElement("div");
    cb.className = "modal-back";
    cb.style.zIndex = 340;
    cb.innerHTML = `
      <div class="modal" style="width:380px">
        <h3>삭제하시겠습니까?</h3>
        <div class="body">
          <div class="danger-note">${WARN_ICON}<span>삭제하면 복구할 수 없으니 신중하게 결정해주세요.</span></div>
          <div class="field" style="margin-top:14px;margin-bottom:0">
            <input type="text" data-del-input placeholder="입력">
          </div>
          <p class="muted" style="margin-top:6px">박스에 DELETE를 입력하면 [삭제] 버튼이 활성화됩니다.</p>
        </div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn danger" data-cok disabled>삭제</button>
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
      assets.splice(assets.indexOf(a), 1);
      cb.remove(); onDone(); toast("삭제되었습니다.");
    };
    document.body.appendChild(cb);
    input.focus();
  }

  function render() {
    const root = document.getElementById("app");
    const state = { screen: "menu", menuExpanded: { member: false, worksite: false }, menuScroll: 0, sub: null, statusFilter: "all", popupFilters: MappAssetFilter.empty(), subSearch: "", addDraft: null, addOrigin: null, tagManageDraft: null, detailAssetId: null, listScroll: 0, holderQuery: "", holderCategory: "employee", holderPage: 1 };

    function draw() {
      const featureScreens = ["plan-features", "asset-feature"];
      if (featureScreens.includes(state.screen) && !canConfigureFeatures()) state.screen = "menu";
      if (!["menu", "member-profile", "worksite-profile", ...featureScreens].includes(state.screen) && !assetMgmtEnabled()) {
        // 회사 기능 OFF/요금제 미충족이면 이미 열려 있던 상세·편집 페이지도 접근을 차단한다.
        const filterCancel = document.querySelector(".mapp-asset-filter [data-filter-cancel]");
        if (filterCancel) filterCancel.click(); // 공용 필터의 포커스/스크롤 이벤트도 정상 해제.
        document.querySelectorAll(".mapp-fullpage-back, .mapp-sheet-back, .mapp-viewer-back, .dropdown-menu, .modal-back").forEach(node => node.remove());
        delete state.directoryDetailFrom; state.detailTarget = null;
        state.screen = "menu";
      }
      const showTabBar = state.screen === "menu";
      const screenHtml = state.screen === "menu" ? menuScreenHtml(state.menuExpanded)
        : state.screen === "member-profile" ? directoryProfileScreenHtml("member", state)
        : state.screen === "worksite-profile" ? directoryProfileScreenHtml("worksite", state)
        : state.screen === "directory-worksite-assets" ? directoryWorksiteAssetsScreenHtml(state)
        : state.screen === "plan-features" ? planFeaturesScreenHtml()
        : state.screen === "asset-feature" ? assetFeatureScreenHtml()
        : state.screen === "sub-detail" ? subDetailScreenHtml(state.sub, state.statusFilter, state.popupFilters)
        : state.screen === "asset-detail" ? leaderAssetDetailHtml(assets.find(a => a.id === state.detailAssetId), state.detailTarget)
        : state.screen === "asset-parties" ? scopedPartiesScreenHtml(assets.find(a => a.id === state.detailAssetId), state.detailTarget)
        : state.screen === "asset-history" ? historyScreenHtml(assets.find(a => a.id === state.detailAssetId))
        : state.screen === "asset-add" ? assetAddScreenHtml(state.addDraft)
        : state.screen === "asset-add-category" ? assetAddCategoryScreenHtml(state.addDraft)
        : state.screen === "asset-add-tags" ? assetAddTagManageScreenHtml(state.tagManageDraft)
        : assetsScreenHtml();
      root.innerHTML = `
        <div class="mapp-stage">
          <div class="mapp-phone">
            <div class="mapp-statusbar"><span>9:41</span><span class="mapp-statusbar-icons">•••</span></div>
            <div class="mapp-screen">${screenHtml}</div>
            ${showTabBar ? tabBarHtml("menu") : ""}
          </div>
        </div>`;

      wireDirectoryMenu(root, state, draw);
      wireDirectoryProfile(root, state, draw);
      wirePlanFeatures(root, state, draw);
      const back = root.querySelector("[data-mapp-back]");
      if (back) back.onclick = () => {
        if (state.screen === "directory-worksite-assets") {
          state.screen = "worksite-profile"; draw();
          root.querySelector(".mapp-screen").scrollTop = state.directoryScroll || 0; return;
        }
        if (["member-profile", "worksite-profile"].includes(state.screen)) {
          state.screen = "menu"; draw();
          root.querySelector(".mapp-screen").scrollTop = state.menuScroll;
          return;
        }
        if (state.screen === "asset-feature") {
          state.screen = "plan-features"; draw();
          root.querySelector(".mapp-screen").scrollTop = state.featureListScroll || 0;
          return;
        }
        // 소분류 상세 → 자산 허브, 그 외엔 메뉴로 복귀
        if (state.screen === "asset-add-category") state.screen = "asset-add";
        else if (state.screen === "asset-add") {
          const leave = () => { state.screen = state.addOrigin; state.addDraft = null; state.addOrigin = null; draw(); };
          if (state.addDraft.editingId ? editDirty(state.addDraft) : hasAddInput(state.addDraft)) confirmAddExit(leave, !!state.addDraft.editingId);
          else leave();
          return;
        }
        else if (["asset-history", "asset-parties"].includes(state.screen)) state.screen = "asset-detail";
        else if (state.screen === "asset-detail") {
          state.screen = state.directoryDetailFrom || "sub-detail"; delete state.directoryDetailFrom; state.detailTarget = null;
          draw(); root.querySelector(".mapp-screen").scrollTop = state.listScroll; return;
        }
        else if (state.screen === "sub-detail") { state.screen = "assets"; state.sub = null; state.statusFilter = "all"; state.popupFilters = MappAssetFilter.empty(); state.subSearch = ""; }
        else { state.screen = "menu"; }
        draw();
      };
      const gotoAssets = root.querySelector('[data-mapp-goto="assets"]');
      if (gotoAssets) gotoAssets.onclick = () => { state.screen = "assets"; draw(); };
      root.querySelectorAll("[data-mapp-tab]").forEach(b => b.onclick = () => {
        // "홈"·"승인" 탭은 이번 러프 스코프 밖이라 동작 없음(메뉴만 실제 이동)
        if (b.dataset.mappTab === "menu") { state.screen = "menu"; draw(); }
      });
      // 소분류 행 탭 → 소분류 상세(드릴다운)로 진입, 매번 전체를 기본 선택
      root.querySelectorAll("[data-sub-open]").forEach(b => b.onclick = () => {
        state.screen = "sub-detail";
        state.sub = b.dataset.sub;
        state.statusFilter = "all";
        state.popupFilters = MappAssetFilter.empty();
        state.subSearch = "";
        draw();
      });
      // 자산 추가 FAB — manage_permission_type 기반 자산 관리 권한 보유자에게만 렌더. 허브는 미선택,
      // 소분류 상세는 현재 분류를 미리 선택해 같은 추가 페이지로 진입한다.
      root.querySelectorAll("[data-asset-add-open]").forEach(b => b.onclick = () => {
        if (!hasAssetManagePermission()) return;
        const currentCategory = state.screen === "sub-detail"
          ? window.DATA.categories.find(c => c.sub === state.sub) || null : null;
        state.addOrigin = state.screen;
        state.addDraft = emptyAddDraft(currentCategory);
        state.screen = "asset-add";
        draw();
      });
      // 대분류 접기/펼치기 — 기본 펼침(app.js의 내 자산 대분류 섹션과 동일한 패턴), DOM만 직접 토글하고 재렌더 안 함
      root.querySelectorAll("[data-tree-collapse]").forEach(b => b.onclick = () => {
        const body = b.nextElementSibling;
        const expanded = b.getAttribute("aria-expanded") === "true";
        b.setAttribute("aria-expanded", String(!expanded));
        body.hidden = expanded;
        b.classList.toggle("collapsed", expanded);
      });
      // 상태 칩을 선택하면 팝업 조건을 모두 해제. 팝업 적용 중에는 전체 칩도 비선택.
      root.querySelectorAll("[data-status-chip]").forEach(b => b.onclick = () => {
        state.popupFilters = MappAssetFilter.empty();
        state.statusFilter = b.dataset.statusChip;
        draw();
      });
      function applyPopup(filters) {
        state.popupFilters = filters;
        state.statusFilter = MappAssetFilter.count(filters) ? null : "all";
        draw();
      }
      MappAssetFilter.wireApplied(root, state.popupFilters, applyPopup);
      const filterBtn = root.querySelector("[data-mapp-filter-open]");
      if (filterBtn) filterBtn.onclick = () => MappAssetFilter.open({
        category: window.DATA.categories.find(c => c.sub === state.sub) || {},
        mode: "leader", filters: state.popupFilters, onApply: applyPopup,
      });
      // 검색은 현재 상태 칩 또는 팝업 필터 결과 안에서 추가로 적용. 자산 유형에 따라 실제 품목명과
      // 개별형 고유관리번호만 비교해 상태·수량 텍스트가 우연히 검색되는 일을 막는다.
      const searchInput = root.querySelector("[data-mapp-search]");
      if (searchInput) {
        const cards = [...root.querySelectorAll("[data-asset-card]")];
        const emptyMsg = root.querySelector("[data-mapp-empty]");
        searchInput.value = state.subSearch;
        const applySearch = () => {
          state.subSearch = searchInput.value;
          const q = state.subSearch.trim().toLowerCase();
          cards.forEach(card => {
            const asset = assets.find(a => a.id === card.dataset.assetId);
            const hay = asset ? `${asset.product}${asset.type === "individual" ? asset.assetNo || "" : ""}`.toLowerCase() : "";
            card.hidden = !(!q || hay.includes(q));
          });
          const visibleCount = cards.filter(card => !card.hidden).length;
          const count = root.querySelector("[data-leader-result-count]");
          if (count) count.textContent = visibleCount;
          if (emptyMsg && cards.length) emptyMsg.hidden = visibleCount > 0;
        };
        searchInput.addEventListener("input", applySearch);
        applySearch();
      }
      root.querySelectorAll("[data-directory-asset]").forEach(row => row.onclick = () => {
        const kind = state.screen === "member-profile" ? "member" : "worksite";
        const a = assets.find(asset => asset.id === row.dataset.directoryAsset);
        if (!a || !directoryAssetAvailable(kind) || !directoryCanViewAsset(a, kind)) return;
        state.detailTarget = directoryTarget(kind);
        state.directoryDetailFrom = state.screen; state.listScroll = root.querySelector(".mapp-screen").scrollTop;
        state.detailAssetId = a.id; state.screen = "asset-detail";
        state.holderQuery = ""; state.holderCategory = "employee"; state.holderPage = 1; draw();
      });
      root.querySelectorAll("[data-asset-card]").forEach(card => {
        card.setAttribute("role", "button"); card.tabIndex = 0;
        const open = () => {
          const a = assets.find(x => x.id === card.dataset.assetId);
          if (!a || !hasViewPermission(a)) return;
          state.listScroll = root.querySelector(".mapp-screen").scrollTop;
          delete state.directoryDetailFrom; state.detailTarget = null;
          state.detailAssetId = a.id; state.screen = "asset-detail";
          state.holderQuery = ""; state.holderCategory = "employee"; state.holderPage = 1; draw();
        };
        card.onclick = open;
        card.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } };
      });
      if (state.screen === "asset-detail") {
        const a = assets.find(x => x.id === state.detailAssetId);
        const target = state.detailTarget;
        // 회사 전체 상세는 반납/해제 후 유지. 근무지 상세는 그 근무지 기록이 사라지면 대상 목록으로 복귀.
        const afterMutate = () => {
          if (target && findRecord(a, target).idx < 0) {
            state.screen = state.directoryDetailFrom; delete state.directoryDetailFrom; state.detailTarget = null;
          } else state.screen = "asset-detail";
          draw();
          if (state.screen === "member-profile" || state.screen === "directory-worksite-assets") root.querySelector(".mapp-screen").scrollTop = state.listScroll || 0;
        };
        function dispatchAction(key) {
          if (key === "history") { state.screen = "asset-history"; draw(); return; }
          if (key === "edit") {
            if (target || !hasAssetManagePermission() || a.status === "disposed") return;
            state.addOrigin = "asset-detail"; state.addDraft = editDraftFor(a); state.screen = "asset-add"; draw(); return;
          }
          if (key === "delete") {
            if (target || !hasAssetManagePermission()) return;
            openDeleteAssetModal(a, () => { state.detailAssetId = null; state.screen = state.directoryDetailFrom || "sub-detail"; delete state.directoryDetailFrom; state.detailTarget = null; draw(); }); return;
          }
          if (!canManage(a)) return;
          if (target) {
            const idx = findRecord(a, target).idx;
            if (idx < 0) return;
            if (key === "return") { openReturnConfirm(a, idx, afterMutate); return; }
            if (key === "reassign") { openFormPage(a, { index: idx }, "reassign", afterMutate); return; }
            if (key === "qty-change") { openQtyChangeModal(a, idx, afterMutate); return; }
            if (key === "hold-release") { openHoldReleaseConfirm(a, idx, afterMutate); return; }
            if (key === "date") {
              const record = a.assignments[idx];
              openDateSheet(record.since, todayStr(), value => {
                if (!value || value === record.since) return;
                confirmModal("배정일을 수정하시겠습니까?", "", () => {
                  const before = record.since; record.since = value;
                  logActivity(a, { script: "배정 관리: 배정일 변경", target: record, before: window.fmtDate(before), after: window.fmtDate(value) });
                  afterMutate(); toast("배정일이 수정되었습니다.");
                });
              }); return;
            }
          }
          if (key === "assign-add") {
            if ((a.assignments || []).length >= 5) toast("활성 배정은 최대 5건까지 가능합니다.");
            else openFormPage(a, null, "assign-add", afterMutate);
            return;
          }
          if (key === "hold-add") {
            if (a.totalQty - (a.stocks || []).reduce((sum,x) => sum+x.qty,0) <= 0) toast("잔여 수량이 없습니다.");
            else openFormPage(a, null, "hold-add", afterMutate);
            return;
          }
          if (!statusActions(a).some(action => action.key === key)) return;
          if (key === "dispose") { openDisposeConfirmModal(a, afterMutate); return; }
          const transitions = {
            "lost-report": ["분실 신고하시겠습니까?", "분실 신고 시 기존 배정은 유지된 채 상태만 분실로 변경됩니다.", "분실 신고", () => "lost"],
            "lost-recover": ["분실 회수 처리하시겠습니까?", "분실 회수 시 배정 여부에 따라 배정 중 또는 재고 상태로 돌아갑니다.", "분실 회수", () => derivedActiveStatus(a)],
            "repair-start": ["수리 접수하시겠습니까?", "수리 접수 시 기존 배정은 유지된 채 상태만 수리 중으로 변경됩니다.", "수리 접수", () => "repair"],
            "repair-done": ["수리 완료 처리하시겠습니까?", "수리 완료 시 배정 여부에 따라 배정 중 또는 재고 상태로 돌아갑니다.", "수리 완료", () => derivedActiveStatus(a)],
          };
          const [title, body, script, next] = transitions[key];
          openStatusChangeConfirm(a, title, body, () => {
            const before = STATUS_LABEL[a.status][0]; a.status = next();
            logActivity(a, { script: `상태 변경: ${script}`, before, after: STATUS_LABEL[a.status][0] });
          }, afterMutate);
        }
        const status = root.querySelector('[data-status-open]');
        if (status) status.onclick = () => openDropdownMenu(status, statusActions(a), dispatchAction);
        const more = root.querySelector('[data-more-open]');
        more.onclick = () => {
          const items = [{ key: "history", label: "자산 이력" }];
          // 자산 수정·삭제는 회사 전체 상세 전용. 대상 상세는 권한 보유자여도 제공하지 않는다.
          if (!target && hasAssetManagePermission() && a.status !== "disposed") items.push({ key: "edit", label: "자산 수정", sep: true });
          items.push(...scopedManageActions(a, target));
          if (!target && hasAssetManagePermission()) items.push({ key: "delete", label: "자산 삭제", danger: true });
          openDropdownMenu(more, items, dispatchAction);
        };
        root.querySelector('[data-hero-viewer]').onclick = () => openPhotoViewer(a);
        const photoEdit = root.querySelector('[data-hero-edit]');
        if (photoEdit) photoEdit.onclick = () => { if (canManage(a)) openPhotoManageModal(a, afterMutate); };
        const memoEdit = root.querySelector('[data-memoedit]');
        if (memoEdit) memoEdit.onclick = () => { if (canManage(a)) openMemoEditModal(a, afterMutate); };
        root.querySelector('[data-qr-open]').onclick = () => openLeaderQr(a);
        const add = root.querySelector('[data-holder-add]');
        if (add) add.onclick = () => dispatchAction(a.type === "individual" ? "assign-add" : "hold-add");
        const partiesViewAll = root.querySelector('[data-parties-viewall]');
        if (partiesViewAll) partiesViewAll.onclick = () => { state.screen = "asset-parties"; draw(); };
        function drawHolders() {
          const list = root.querySelector('[data-holder-list]');
          if (!list) return; // 대상 상세의 공동 대상은 조회 전용이며 전체 현황 관리 UI를 연결하지 않는다.
          const rendered = leaderHolderList(a, state.holderQuery, state.holderCategory, state.holderPage);
          state.holderPage = rendered.page; list.innerHTML = rendered.html;
          list.querySelectorAll('[data-holder-page]').forEach(button => button.onclick = () => { state.holderPage += Number(button.dataset.holderPage); drawHolders(); list.scrollIntoView({block:"nearest"}); });
          list.querySelectorAll('[data-holder-more]').forEach(button => button.onclick = () => {
            const items = a.type === "individual"
              ? [{key:"date",label:"배정일 수정"},{key:"reassign",label:"재배정"},{key:"return",label:"반납",danger:true,sep:true}]
              : [{key:"qty",label:"수량 변경"},{key:"release",label:"보유 해제",danger:true,sep:true}];
            openDropdownMenu(button, items, key => {
            if (!canManage(a)) return;
            const idx = Number(button.dataset.index);
            if (key === "return") openReturnConfirm(a, idx, afterMutate);
            if (key === "reassign") openFormPage(a, { index: idx }, "reassign", afterMutate);
            if (key === "qty") openQtyChangeModal(a, idx, afterMutate);
            if (key === "release") openHoldReleaseConfirm(a, idx, afterMutate);
            if (key === "date") {
              const record = a.assignments[idx];
              openDateSheet(record.since, todayStr(), value => {
                if (!value || value === record.since) return;
                confirmModal("배정일을 수정하시겠습니까?", "", () => {
                  const before = record.since; record.since = value;
                  logActivity(a, { script: "배정 관리: 배정일 변경", target: record, before: window.fmtDate(before), after: window.fmtDate(value) });
                  afterMutate(); toast("배정일이 수정되었습니다.");
                });
              });
            }
            });
          });
        }
        const holderQuery = root.querySelector('[data-holder-query]');
        const holderCategory = root.querySelector('[data-holder-category]');
        if (holderQuery) {
          const syncHolderCategory = () => {
            const employee = state.holderCategory === "employee";
            holderCategory.innerHTML = `<span aria-hidden="true">${employee ? IC_EMP : IC_WS}</span><span class="chev" aria-hidden="true">${CHEV_DOWN}</span>`;
            holderCategory.setAttribute("aria-label", `검색 대상: ${employee ? "구성원" : "근무지"}`);
            holderCategory.title = employee ? "구성원" : "근무지";
            holderQuery.placeholder = employee ? "이름/사번/휴대폰번호" : "근무지명/코드";
          };
          holderQuery.value = state.holderQuery; syncHolderCategory();
          holderQuery.oninput = () => { state.holderQuery = holderQuery.value; state.holderPage = 1; drawHolders(); };
          holderCategory.onclick = () => openHolderCategoryMenu(holderCategory, state.holderCategory, kind => {
            if (kind === state.holderCategory) return;
            state.holderCategory = kind; state.holderQuery = ""; state.holderPage = 1;
            holderQuery.value = ""; syncHolderCategory(); drawHolders();
          });
        }
        drawHolders();
      }
      if (state.screen === "asset-history") {
        const a = assets.find(x => x.id === state.detailAssetId), input = root.querySelector('[data-history-q]');
        if (input) input.oninput = () => { root.querySelector('[data-history-list]').innerHTML = timelineHtml(a, input.value); };
      }

      if (state.screen === "asset-add") {
        const draft = state.addDraft;
        const field = key => root.querySelector(`[data-add-field="${key}"]`);
        function syncAddDraft() {
          ["product", "assetNo", "totalQty", "expiry", "serial", "imei", "manufactured", "purchaseDate", "purchasePrice", "note"].forEach(key => {
            const input = field(key);
            if (input) draft[key] = input.value;
          });
        }
        function updateAddValidity() {
          syncAddDraft();
          const cat = addCategory(draft);
          const duplicate = cat && cat.type === "individual" && !!draft.assetNo.trim() && assets.some(a => a.id !== draft.editingId && a.assetNo === draft.assetNo.trim());
          const error = root.querySelector("[data-add-error]");
          if (error) error.hidden = !duplicate;
          const assetNoInput = field("assetNo");
          if (assetNoInput) assetNoInput.classList.toggle("has-err", duplicate);
          const expiryInput = field("expiry");
          if (expiryInput) {
            const showError = draft.expiryTouched && parseAddExpiry(draft.expiry) === null;
            root.querySelector("[data-add-expiry-error]").hidden = !showError;
            expiryInput.classList.toggle("has-err", showError);
            expiryInput.setAttribute("aria-invalid", String(!!showError));
          }
          const save = root.querySelector("[data-add-save]");
          if (save) save.disabled = !addDraftValid(draft) || !editDirty(draft);
          const qtyError = root.querySelector("[data-edit-qty-error]");
          if (qtyError) qtyError.hidden = Number(draft.totalQty) >= (assets.find(a => a.id === draft.editingId).stocks || []).reduce((sum,x) => sum + x.qty,0);
        }
        root.querySelector("[data-add-category]").onclick = () => { syncAddDraft(); state.screen = "asset-add-category"; draw(); };
        root.querySelectorAll("[data-add-field]").forEach(input => input.addEventListener("input", () => {
          if (input.dataset.addField === "assetNo") {
            const pos = input.selectionStart;
            const before = input.value;
            input.value = before.replace(/[^A-Za-z0-9\-_]/g, "");
            if (input.value !== before && pos != null) input.setSelectionRange(Math.max(0, pos - 1), Math.max(0, pos - 1));
          }
          if (input.dataset.addField === "expiry") input.value = formatAddExpiry(input.value);
          if (input.dataset.addField === "totalQty") input.value = input.value.replace(/[^0-9]/g, "");
          if (input.dataset.addField === "purchasePrice") {
            // 콤마는 표시용이며 숫자는 기존처럼 최대 12자리. 중간 편집 시 커서도 입력 위치를 유지한다.
            const position = input.selectionStart;
            const digitsBefore = input.value.slice(0, position).replace(/[^0-9]/g, "").length;
            input.value = formatAddPrice(input.value);
            if (position != null) {
              let cursor = 0, digitsSeen = 0;
              while (cursor < input.value.length && digitsSeen < digitsBefore) {
                if (/[0-9]/.test(input.value[cursor])) digitsSeen++;
                cursor++;
              }
              input.setSelectionRange(cursor, cursor);
            }
          }
          updateAddValidity();
        }));
        const expiryInput = field("expiry");
        if (expiryInput) expiryInput.addEventListener("blur", () => { draft.expiryTouched = true; updateAddValidity(); });
        // 품목명은 새 값 직접 입력을 허용하면서, 같은 분류의 기존 품목만 필드 아래 자체 메뉴로 제안한다.
        const productInput = field("product");
        const productMenu = root.querySelector("[data-add-product-menu]");
        const currentCat = addCategory(draft);
        const productNames = currentCat ? [...new Set(assets.filter(asset => asset.group === currentCat.group && asset.sub === currentCat.sub).map(asset => asset.product).filter(Boolean))] : [];
        function renderProductMenu() {
          const query = productInput.value.trim().toLowerCase();
          const options = query ? productNames.filter(name => name.toLowerCase().includes(query)) : productNames;
          productMenu.innerHTML = options.map(name => `<button type="button" data-add-product-pick="${esc(name)}">${esc(name)}</button>`).join("");
          productMenu.hidden = !options.length;
          productMenu.querySelectorAll("[data-add-product-pick]").forEach(button => button.onclick = () => {
            productInput.value = button.dataset.addProductPick;
            draft.product = productInput.value;
            productMenu.hidden = true;
            updateAddValidity();
          });
        }
        productInput.addEventListener("focus", renderProductMenu);
        productInput.addEventListener("input", renderProductMenu);
        productInput.addEventListener("blur", () => setTimeout(() => { productMenu.hidden = true; }, 120));
        // 앱 태그도 대시보드와 같은 검색형 선택을 사용한다. 선택된 값만 칩으로 남고 최대 5개에서 입력을 잠근다.
        const tagSearch = root.querySelector("[data-add-tag-search]");
        const tagMenu = root.querySelector("[data-add-tag-menu]");
        const tagChips = root.querySelector("[data-add-tag-chips]");
        function renderSelectedTags() {
          if (!tagChips || !tagSearch) return;
          tagChips.innerHTML = addTagChipsHtml(draft.labels);
          tagSearch.disabled = draft.labels.length >= 5;
          tagSearch.placeholder = draft.labels.length ? "" : "검색";
          tagChips.querySelectorAll("[data-add-tag-remove]").forEach(button => button.onclick = () => {
            draft.labels = draft.labels.filter(tag => tag !== button.dataset.addTagRemove);
            renderSelectedTags(); updateAddValidity();
            tagMenu.hidden = true;
          });
        }
        function renderTagMenu() {
          if (!tagSearch || draft.labels.length >= 5) { if (tagMenu) tagMenu.hidden = true; return; }
          const query = tagSearch.value.trim().toLowerCase();
          const options = (window.DATA.tags || []).filter(tag => !draft.labels.includes(tag) && (!query || tag.toLowerCase().includes(query)));
          tagMenu.innerHTML = options.length ? options.map(tag => `<button type="button" data-add-tag-pick="${esc(tag)}">${esc(tag)}</button>`).join("") : '<div class="mapp-add-suggest-empty">결과가 없습니다.</div>';
          tagMenu.hidden = false;
          tagMenu.querySelectorAll("[data-add-tag-pick]").forEach(button => button.onclick = () => {
            if (draft.labels.length < 5) draft.labels.push(button.dataset.addTagPick);
            tagSearch.value = "";
            tagMenu.hidden = true;
            renderSelectedTags(); updateAddValidity();
          });
        }
        if (tagSearch) {
          renderSelectedTags();
          tagSearch.addEventListener("focus", renderTagMenu);
          tagSearch.addEventListener("input", renderTagMenu);
          tagSearch.addEventListener("blur", () => setTimeout(() => { tagMenu.hidden = true; }, 120));
        }
        const tagManage = root.querySelector("[data-add-tag-manage]");
        if (tagManage) tagManage.onclick = () => {
          syncAddDraft();
          state.tagManageDraft = (window.DATA.tags || []).map(tag => ({ name: tag, orig: tag }));
          state.screen = "asset-add-tags";
          draw();
        };
        root.querySelectorAll("[data-add-date]").forEach(button => button.onclick = () => {
          syncAddDraft();
          const key = button.dataset.addDate;
          const apply = value => {
            draft[key] = value; updateAddValidity();
            const shown = value ? (button.dataset.addDateMode === "month" ? value.replace("-", ".") : window.fmtDate(value)) : "선택";
            button.classList.toggle("selected", !!value);
            button.innerHTML = `<span>${shown}</span>${CAL_ICON}`;
          };
          openAddMonthSheet(key === "manufactured" ? "제조연월" : "구매연월", draft[key], apply);
        });
        root.querySelectorAll("[data-add-photo-primary]").forEach(button => button.onclick = () => {
          syncAddDraft(); draft.primaryPhoto = +button.dataset.addPhotoPrimary; draw();
        });
        root.querySelectorAll("[data-add-photo-delete]").forEach(button => button.onclick = () => {
          syncAddDraft();
          const index = +button.dataset.addPhotoDelete;
          draft.photos.splice(index, 1);
          // 대표 삭제 시 현재 사진 목록에서 가장 앞에 남은 사진을 자동 대표로 지정한다.
          if (!draft.photos.length || draft.primaryPhoto === index) draft.primaryPhoto = 0;
          else if (draft.primaryPhoto > index) draft.primaryPhoto -= 1;
          draw();
        });
        const addPhoto = root.querySelector("[data-add-photo]");
        if (addPhoto) addPhoto.onclick = () => {
          syncAddDraft();
          openAddDropdown(addPhoto, [
            { key: "camera", label: "카메라로 촬영하기" },
            { key: "gallery", label: "갤러리에서 불러오기" },
          ], () => { draft.photos.push({ color: PHOTO_COLORS[draft.photos.length % PHOTO_COLORS.length], at: `${todayStr()} 00:00`, by: ME }); draw(); });
        };
        const save = root.querySelector("[data-add-save]");
        if (save) save.onclick = () => {
          updateAddValidity();
          if (!addDraftValid(draft) || !editDirty(draft)) return;
          if (draft.editingId) {
            const asset = assets.find(a => a.id === draft.editingId);
            const moved = asset.group + "|" + asset.sub !== draft.category;
            applyAssetEdit(asset, draft);
            state.sub = asset.sub;
            if (moved && state.detailTarget) { state.directoryCategory = { group: asset.group, sub: asset.sub }; state.directorySearch = ""; }
            if (moved) { state.statusFilter = "all"; state.popupFilters = MappAssetFilter.empty(); state.subSearch = ""; state.listScroll = 0; }
            state.addDraft = null; state.addOrigin = null; state.screen = "asset-detail";
            draw(); toast("저장되었습니다."); return;
          }
          const cat = addCategory(draft);
          const numericIds = assets.map(a => Number(String(a.id).replace(/\D/g, ""))).filter(Number.isFinite);
          const asset = {
            id: `A${String((numericIds.length ? Math.max(...numericIds) : 0) + 1).padStart(3, "0")}`,
            type: cat.type, assetNo: cat.type === "individual" ? draft.assetNo.trim() : "", product: draft.product.trim(),
            group: cat.group, sub: cat.sub, status: "stock", createdAt: "2026-09-04", labels: [...draft.labels],
            assignments: cat.type === "individual" ? [] : undefined, stocks: cat.type === "quantity" ? [] : undefined,
          };
          if (cat.type === "quantity") asset.totalQty = parseInt(draft.totalQty, 10);
          const expiry = parseAddExpiry(draft.expiry);
          if (!(cat.hiddenFields || []).includes("expiry") && expiry) asset.expiry = expiry;
          if (cat.type === "individual" && draft.serial.trim()) asset.serial = draft.serial.trim();
          if (cat.type === "individual" && draft.imei.trim()) asset.imei = draft.imei.trim();
          if (draft.manufactured) asset.manufactured = `${draft.manufactured}-01`;
          if (draft.purchaseDate) asset.purchaseDate = `${draft.purchaseDate}-01`;
          if (draft.purchasePrice) asset.price = Number(draft.purchasePrice.replace(/[^0-9]/g, ""));
          if (draft.note.trim()) asset.note = draft.note.trim();
          if (draft.photos.length) {
            asset._photos = draft.photos.map(p => ({ ...p }));
            asset._primary = draft.primaryPhoto;
            asset.photo = draft.photos[draft.primaryPhoto].color;
            asset.photoCount = draft.photos.length;
          }
          assets.push(asset);
          state.screen = "sub-detail";
          state.sub = cat.sub;
          state.addDraft = null;
          state.addOrigin = null;
          state.statusFilter = "all";
          state.popupFilters = MappAssetFilter.empty();
          state.subSearch = "";
          draw();
          const addedCard = root.querySelector(`[data-asset-id="${asset.id}"]`);
          if (addedCard) {
            addedCard.scrollIntoView({ block: "nearest" });
            addedCard.classList.add("mapp-card-added");
          }
          toast("자산이 추가되었습니다.");
        };
        updateAddValidity();
      }
      if (state.screen === "asset-add-category") {
        root.querySelector("[data-add-category-close]").onclick = () => { state.screen = "asset-add"; draw(); };
        const rows = [...root.querySelectorAll("[data-add-category-pick]")];
        rows.forEach(row => row.onclick = () => {
          const product = state.addDraft.product;
          const category = addCategory({ category: row.dataset.addCategoryPick });
          if (!catViewPermission(category)) return;
          // 현재 분류를 다시 선택하면 입력을 유지하고 팝업만 닫는다(대시보드와 동일).
          if (state.addDraft.editingId) state.addDraft.category = row.dataset.addCategoryPick;
          else if (row.dataset.addCategoryPick !== state.addDraft.category) {
            state.addDraft = emptyAddDraft(category);
            state.addDraft.product = product;
          }
          state.screen = "asset-add";
          draw();
        });
      }
      if (state.screen === "asset-add-tags") {
        const tagDraft = state.tagManageDraft;
        const master = window.DATA.tags || [];
        const list = root.querySelector("[data-add-tag-manage-list]");
        const listError = root.querySelector("[data-add-tag-list-error]");
        const createInput = root.querySelector("[data-add-tag-create]");
        const createButton = root.querySelector("[data-add-tag-create-btn]");
        const createError = root.querySelector("[data-add-tag-create-error]");
        const saveButton = root.querySelector("[data-add-tag-manage-save]");
        function duplicateNames() {
          const counts = {};
          tagDraft.forEach(tag => { const name = normalizeTagName(tag.name); if (name) counts[name] = (counts[name] || 0) + 1; });
          return new Set(Object.keys(counts).filter(name => counts[name] > 1));
        }
        function tagManageDirty() {
          const next = [...new Set(tagDraft.map(tag => normalizeTagName(tag.name)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
          const before = [...master].sort((a, b) => a.localeCompare(b, "ko"));
          return next.length !== before.length || next.some((name, index) => name !== before[index]);
        }
        function updateTagManageValidity() {
          const duplicates = duplicateNames();
          list.querySelectorAll("[data-add-tag-rename]").forEach(input => {
            const name = normalizeTagName(input.value);
            const invalid = !name || duplicates.has(name);
            input.classList.toggle("has-err", invalid);
            input.setAttribute("aria-invalid", String(invalid));
            list.querySelector(`[data-add-tag-required="${input.dataset.addTagRename}"]`).hidden = !!name;
          });
          listError.hidden = !duplicates.size;
          const createName = normalizeTagName(createInput.value);
          const createDuplicate = !!createName && tagDraft.some(tag => normalizeTagName(tag.name) === createName);
          createInput.classList.toggle("has-err", createDuplicate);
          createError.hidden = !createDuplicate;
          createButton.disabled = !createName || createDuplicate;
          saveButton.disabled = !tagManageDirty() || !!duplicates.size || tagDraft.some(tag => !normalizeTagName(tag.name));
        }
        function addManagedTag() {
          const name = normalizeTagName(createInput.value);
          if (!name || tagDraft.some(tag => normalizeTagName(tag.name) === name)) { updateTagManageValidity(); return; }
          tagDraft.unshift({ name, orig: null });
          draw();
        }
        createInput.addEventListener("input", updateTagManageValidity);
        createInput.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); addManagedTag(); } });
        createButton.onclick = addManagedTag;
        list.querySelectorAll("[data-add-tag-rename]").forEach(input => input.addEventListener("input", () => {
          tagDraft[+input.dataset.addTagRename].name = input.value;
          updateTagManageValidity();
        }));
        list.querySelectorAll("[data-add-tag-delete]").forEach(button => button.onclick = () => { tagDraft.splice(+button.dataset.addTagDelete, 1); draw(); });
        root.querySelector("[data-add-tag-manage-close]").onclick = () => { state.tagManageDraft = null; state.screen = "asset-add"; draw(); };
        saveButton.onclick = () => {
          updateTagManageValidity();
          if (saveButton.disabled) return;
          const finalNames = [...new Set(tagDraft.map(tag => normalizeTagName(tag.name)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
          const remainingOriginals = new Set(tagDraft.filter(tag => tag.orig).map(tag => tag.orig));
          const deleted = master.filter(tag => !remainingOriginals.has(tag));
          const renamed = tagDraft.filter(tag => tag.orig && tag.orig !== normalizeTagName(tag.name)).map(tag => ({ from: tag.orig, to: normalizeTagName(tag.name) }));
          const updateLabels = labels => (labels || []).filter(label => !deleted.includes(label)).map(label => {
            const rename = renamed.find(item => item.from === label);
            return rename ? rename.to : label;
          }).filter((label, index, all) => finalNames.includes(label) && all.indexOf(label) === index);
          assets.forEach(asset => { asset.labels = updateLabels(asset.labels); });
          state.addDraft.labels = updateLabels(state.addDraft.labels);
          master.length = 0;
          master.push(...finalNames);
          state.tagManageDraft = null;
          state.screen = "asset-add";
          draw();
          toast("저장되었습니다.");
        };
        updateTagManageValidity();
      }
    }
    window.addEventListener("storage", event => {
      if ([ASSET_MGMT_FLAG_KEY, COMPANY_PLAN_KEY].includes(event.key) || event.key === null) draw();
    });
    draw();
  }

  window.LeaderScreen = { render };
})();
