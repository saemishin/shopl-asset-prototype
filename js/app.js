/* 앱 직원모드 — 화면 중앙에 폰 프레임으로 띄우는 목업. 메뉴 화면(관리 섹션 마지막에 자산 추가) + 자산 화면
   (내 자산·근무지 자산 탭) + 근무지 카드 "전체보기"의 목적지 화면 + 카드 클릭 시 진입하는 자산 상세까지 구현.
   자산 상세는 배정/보유 변경 권한(assign_permission_type, category.js에 저장된 소분류별 값으로 실제 판정)이
   있는 자산에 한해 재배정·배정 추가·반납·분실 신고/회수·수리 접수/완료·폐기·보유 대상 추가/변경/해제·사진
   관리 액션을 제공(자산 관리 권한 소관인 필드 수정·소분류 이동 등은 스코프 밖). 배정 추가·재배정·보유 대상
   추가는 대시보드 모달과 동일한 구성의 전체 화면 페이지(openFormPage, 2026-09-29 — 바텀시트였다가, 대상
   선택 피커·날짜 선택이 각각 풀페이지·캘린더 시트로 커지면서 폼 자체도 페이지인 쪽이 자연스러워져 다시 전환),
   상단바 "더보기" 맨 위엔 그 자산의 이력 페이지(asset-history, 조회 전용이라 권한 무관)로
   가는 항목이 항상 있음. 실 앱 화면(근무지 목록/보고서/게시판/근무지 상세 정보탭의 "더보기" 카드 패턴)을
   참고해 리스트 화면 공통 요소를 재현. */
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

  // 뷰포트 기준(bottom:32px)으로 고정돼 있으면 폰 목업이 뷰포트 하단에 딱 붙어있지 않은 이상 토스트가
  // 폰 밖으로 떨어져 보임 — .mapp-screen의 실제 좌표를 재서 그 영역 기준 하단/가운데에 뜨도록 함(2026-09-30)
  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    const screen = document.querySelector(".mapp-screen");
    const r = screen ? screen.getBoundingClientRect() : null;
    const pos = r ? `left:${r.left + r.width / 2}px;bottom:${window.innerHeight - r.bottom + 32}px;` : "left:50%;bottom:32px;";
    t.style.cssText = `position:fixed;${pos}transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300;max-width:280px;text-align:center`;
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
  // 자산 조회 권한 판정 — hasAssignPermission과 동일한 구조(같은 프로토타입 단순화 규칙 적용). 내 자산
  // 탭은 본인에게 배정/보유된 것만 보여줘서 조회 권한과 무관하게 항상 노출하지만(구조설계안 §8), 근무지
  // 자산 탭은 나 아닌 다른 사람·근무지의 배정/보유 현황까지 보여주는 화면이라 소분류별 조회 권한을 실제로
  // 적용(2026-09-30 — 지금까지는 이 필터 자체가 없어서 조회 권한과 무관하게 근무지의 모든 자산이 다 보였음)
  function catViewPermission(cat) {
    if (!cat) return false;
    switch (cat.view) {
      case "회사의 모든 구성원": return true;
      case "특정 관리자/리더": return (cat.viewTarget && cat.viewTarget.members || []).includes(ME);
      case "특정 그룹 및 직무/직급": return (cat.viewTarget && cat.viewTarget.groups || []).includes(MEMBER_TEAM[ME]);
      default: return false; // 모든 관리자 및 리더 / 관리자만
    }
  }
  function hasViewPermission(a) {
    return catViewPermission(window.DATA.categories.find(c => c.group === a.group && c.sub === a.sub));
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
  // 내 자산과 구성원·근무지 대상 목록이 이 정렬 함수를 함께 사용한다. 그룹 표시 여부는 화면별로 결정.
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
  // "전체보기"(분류별 자산 목록) 화면이 이 함수를 공유해 동일한 집합/정렬을 보장. sub를 주면 그 소분류로만
  // 필터. 근무지 자산은 나 아닌 다른 대상의 배정/보유 현황도 보여주므로 조회 권한 필터를 실제로 적용(2026-09-30)
  function itemsForWorksite(ws, sub) {
    const items = [];
    assets.forEach(a => {
      if (sub && a.sub !== sub) return;
      if (!hasViewPermission(a)) return;
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
  // 목록 카드의 썸네일 영역 — 앱 공통 동작(2026-09-30): 카드 어디를 눌러도 상세로 가던 것에서, 썸네일만
  // 따로 눌렀을 때는 상세를 거치지 않고 바로 사진 뷰어로 직행(자산 상세 화면의 대표 이미지와 동일한 동작을
  // 목록 단계에서도). 카드 클릭 핸들러가 부모에 별도로 있어 여기선 stopPropagation으로 버블링만 막고,
  // 사진이 없는 자산은 뷰어를 열 게 없으니 막지 않고 그대로 버블링시켜 카드 클릭(상세 진입)으로 처리
  function cardThumbBtn(a) {
    return `<button type="button" class="mapp-card-thumb-btn" data-card-thumb data-asset-id="${a.id}" aria-label="사진 보기">${cardThumb(a)}</button>`;
  }
  // 카드 구성 확정: 대표 이미지 / 품목명 / 고유관리번호(개별형) / 상태 뱃지(개별형) 또는 보유 수량(수량형) —
  // 분류 등 나머지 정보는 자산 상세에서 확인하는 것으로 스코프 아웃.
  function assetCardHtml(x) {
    const a = x.asset;
    if (a.type === "individual") {
      return `
        <div class="mapp-card" data-asset-card data-asset-id="${a.id}">
          ${cardThumbBtn(a)}
          <div class="mapp-card-body">
            <div class="mapp-card-title">${a.product}</div>
            <div class="mapp-card-sub">${a.assetNo || "—"}</div>
          </div>
          <span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>
        </div>`;
    }
    return `
      <div class="mapp-card" data-asset-card data-asset-id="${a.id}">
        ${cardThumbBtn(a)}
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
        <div class="mapp-count">전체 <b data-mine-result-count>${items.length}</b></div>
        ${items.length ? `
          <div data-mapp-card-list>${sections.map(sec => `
            <div class="mapp-cat-section" data-cat-section>
              <button type="button" class="mapp-cat-section-head" data-cat-collapse aria-expanded="true" aria-label="접기/펼치기">
                <span>${sec.group} <span class="mapp-cat-sep">›</span> ${sec.sub}</span>
                <span class="mapp-cat-section-count" data-cat-result-count>${sec.items.length}</span>
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
  // 접근 가능한 근무지는(고정·담당) 조건 없이 전부 카드로 보여주고, 그 안에 조회 가능한 자산이 하나도
  // 없으면(원래부터 배정·보유가 없거나, 있어도 전부 조회 권한 밖인 소분류라 필터로 걸러진 경우 — 화면에서는
  // 두 경우를 구분하지 않고 동일하게 처리) 분류 목록 대신 안내 문구만 보여줌. 접기/펼치기 버튼은 내용이
  // 없어도 그대로 노출(2026-09-30 — 처음엔 접을 게 없다고 생략했었는데, 카드마다 헤더 구성이 달라지는 게
  // 더 어색하다는 피드백으로 항상 노출로 되돌림 — 접으면 안내 문구만 같이 숨겨질 뿐 부작용 없음)
  function worksiteCardHtml(group) {
    const hasItems = group.items.length > 0;
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
          ${hasItems
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
        <div class="mapp-count">전체 <b data-worksite-count>${groups.length}</b></div>
        <div class="mapp-ws-list" data-mapp-ws-list>${groups.map(worksiteCardHtml).join("")}</div>
        <p class="mapp-empty" data-mapp-ws-empty${groups.length ? " hidden" : ""}>결과가 없습니다.</p>
      </div>`;
  }
  // 근무지 카드에서 소분류를 누르면 이동하는 목적지 — 그 근무지의 그 소분류 자산 목록. 타이틀 텍스트 없이
  // 뒤로가기·필터 버튼만(근무지명은 바로 아래 헤더에 표기), 근무지명/코드/주소를 각각 줄바꿔 표시하고 지금 보는
  // 소분류를 그 아래에 덧붙임, 그 아래는 내 자산 탭과 동일한 구성(검색+카운트+카드 리스트, 정렬도 동일)
  function worksiteDetailScreenHtml(ws, sub, items, filters) {
    const cat = window.DATA.categories.find(c => c.sub === sub) || {};
    const group = cat.group || "";
    const searchPlaceholder = cat.type === "quantity" ? "품목명" : "품목명/고유관리번호";
    const filterGroups = MappAssetFilter.config(cat, "employee");
    const filtered = items.filter(x => MappAssetFilter.matches(x.asset, filters));
    return `
      <div class="mapp-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        ${MappAssetFilter.buttonHtml(filters)}
      </div>
      <div class="mapp-wsdetail-head">
        <div class="mapp-wsdetail-name">${ws}</div>
        <div class="mapp-wsdetail-code">${WS_CODE[ws] || ""}</div>
        <div class="mapp-wsdetail-address">${WS_ADDRESS[ws] || ""}</div>
        <div class="mapp-wsdetail-sub">${group} <span class="mapp-cat-sep">›</span> ${sub}</div>
      </div>
      <div class="mapp-body">
        <div class="mapp-search">
          <input type="text" data-mapp-search placeholder="${searchPlaceholder}">
        </div>
        ${MappAssetFilter.appliedHtml(filters, filterGroups)}
        <div class="mapp-count">전체 <b data-worksite-result-count>${filtered.length}</b></div>
        ${filtered.length ? `
          <div class="mapp-card-list" data-mapp-card-list>${filtered.map(x => assetCardHtml(x)).join("")}</div>
          <p class="mapp-empty" data-mapp-empty hidden>결과가 없습니다.</p>
        ` : `<p class="mapp-empty" data-mapp-empty>${items.length ? "결과가 없습니다." : "배정·보유 중인 자산이 없습니다."}</p>`}
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
  function mappOverlay(className, zIndex) {
    const back = document.createElement("div");
    back.className = className;
    const screen = document.querySelector(".mapp-screen");
    const r = screen ? screen.getBoundingClientRect() : { top: 0, left: 0, width: 390, height: 844 };
    back.style.cssText = `position:fixed;top:${r.top}px;left:${r.left}px;width:${r.width}px;height:${r.height}px;z-index:${zIndex};`;
    document.body.appendChild(back);
    return back;
  }
  // ===== 대상 선택 피커(구성원/근무지) — 전체 화면 페이지(2026-09-29, 라디오+검색+적용 방식의 2차 팝업에서
  // 전환). 단일 선택이라 행을 누르면 그 값으로 바로 선택 완료 + 페이지 닫힘(적용 버튼 없음). 상단엔 타이틀 +
  // 닫기(X)만(뒤로가기 아님 — 대상 선택을 취소하는 것이지 폼의 이전 단계로 돌아가는 게 아니라서). 근무지는
  // 이 화면(ME)의 고정 근무지(myWorksites(ME).fixed)를 "●내 고정 근무지" 섹션으로 최상단 고정, 나머지는
  // 이름 가나다순 =====
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
  // 배정/보유 작성 중 이탈: 대상 유형만 선택해도 작성 시작으로 판단한다.
  function confirmWriteExit(onLeave) {
    const cb = document.createElement("div");
    cb.className = "modal-back"; cb.style.zIndex = 340;
    cb.innerHTML = `<div class="modal sm" style="width:340px" role="dialog" aria-modal="true" aria-label="작성을 중단하시겠습니까?">
      <h3>작성을 중단하시겠습니까?</h3><div class="body" style="font-size:14px">지금까지 작성한 내용은 저장되지 않습니다.</div>
      <div class="foot"><button type="button" class="btn" data-exit-stay>취소</button><button type="button" class="btn primary" data-exit-leave>확인</button></div></div>`;
    document.body.appendChild(cb);
    cb.querySelector("[data-exit-stay]").onclick = () => cb.remove();
    cb.querySelector("[data-exit-leave]").onclick = () => { cb.remove(); onLeave(); };
    cb.onclick = event => { if (event.target === cb) cb.remove(); };
  }
  function openFormPage(a, target, kind, afterMutate) {
    const cfg = FORM_CFG[kind];
    const f = { picked: null, draft: { employee: null, worksite: null }, dateIso: "", qtyText: "" };
    const old = kind === "reassign" ? a.assignments[findRecord(a, target).idx] : null;
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
      if (f.picked || Object.values(f.draft).some(Boolean) || f.dateIso || f.qtyText) confirmWriteExit(() => back.remove());
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
    confirmModal("반납 처리하시겠습니까?", "반납하면 배정에서 제거됩니다.", () => {
      const old = a.assignments[idx];
      a.assignments.splice(idx, 1);
      a.status = derivedActiveStatus(a);
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
      logActivity(a, { script: "보유 관리: 보유 대상 해제", target: x, before: `${qty}개`, after: "" });
      toast("보유 대상에서 해제되었습니다.");
      onDone();
    });
  }
  // 사진 관리 — asset-register.js의 사진 타일 UI·데이터 형태(window.assetPhotos, a._photos/a._primary)를
  // 그대로 재사용(같은 CSS 클래스 .areg-photo-*는 전역 css/app.css에 이미 정의돼 있어 추가 CSS 불필요)
  const PHOTO_COLORS = ["#5b8def", "#8f6ef0", "#eb7f8b", "#3fb37f", "#e0a63c", "#4dabf7", "#c2554e", "#3f9ba0", "#9a6bd6", "#5aa06a"];
  const CLOSE_ICON_SM = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
  // 사진 삭제 버튼은 asset-register.js와 같은 CSS를 쓰지만(hover 시 노출) 앱은 터치라 호버가 없어
  // .mapp-photo-modal 스코프로 항상 노출되게 오버라이드(2026-09-30). 추가는 색상만 바뀌는 더미라 실제
  // 카메라/갤러리 연동은 없지만, 어느 메뉴를 눌러도 사진 한 장이 추가되는 것으로 시뮬레이션(요청대로).
  // 저장 버튼은 사진 목록과 대표가 최초 상태에서 실제로 바뀐 경우에만 활성화
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
          <textarea data-memo-input maxlength="500" placeholder="입력" style="width:100%;flex:1;min-height:280px;border:1px solid var(--line-strong);border-radius:8px;padding:10px;font:inherit;resize:none">${before}</textarea>
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
  // 배정/보유 관리 액션(상단바 "더보기" → 드롭다운) — 상태 변경류를 제외한 나머지: 배정일 수정·재배정·배정 추가·반납
  // (개별형), 수량 변경·보유 대상 추가/해제(수량형), 사진 관리(공통). 폐기되지 않았고 배정/보유 변경 권한이
  // 있는 자산에 한해서만 노출. 메모 수정·사진 관리는 더보기가 아니라 각각 메모 값 옆 편집 아이콘/대표 이미지
  // 위 편집 아이콘으로 별도 제공(2026-09-27, assetDetailScreenHtml 참조) — 대시보드 detail.js와 동일한 구조.
  // 순서는 "자주 쓰는 것 먼저, 되돌리는 액션(반납/보유 해제)은 맨 아래 빨간 글씨"(2026-09-29 재정렬).
  // 공동 대상 제목 옆 추가 버튼(배정 5건/잔여 수량 0)도 권한이 있으면 숨기지 않고 항상 노출 — 대시보드는
  // 배정 추가를 비활성+호버 툴팁으로 처리하지만, 앱은 터치 환경이라 호버가 없어 그 패턴을 그대로 못 씀. 대신
  // 둘 다 항상 활성 상태로 두고 누르면(dispatchAction) 토스트로 안내하는 방식으로 통일(2026-09-30, 배정
  // 추가도 처음엔 대시보드처럼 비활성+data-tip 툴팁으로 만들었다가 호버 불가 문제로 토스트 방식으로 전환)
  function manageActions(a, target) {
    if (a.status === "disposed" || !canManage(a)) return [];
    const acts = [];
    if (a.type === "individual") {
      const { idx } = findRecord(a, target);
      if (idx >= 0) acts.push({ key: "date", label: "배정일 수정" }, { key: "reassign", label: "재배정" });
      if (idx >= 0) acts.push({ key: "return", label: "반납", danger: true });
    } else {
      const { idx } = findRecord(a, target);
      if (idx >= 0) acts.push({ key: "qty-change", label: "수량 변경" });
      if (idx >= 0) acts.push({ key: "hold-release", label: "보유 해제", danger: true });
    }
    return acts;
  }
  // 상단바 "더보기" 메뉴 전체 — 맨 위에 "자산 이력"(자산의 이력 페이지로 이동, 개별형·수량형 공통), 그 아래
  // 배정/보유 관리 액션(구분선 없이 이어서, 2026-09-29). 이력 조회는 조회 전용이라 배정/보유 변경 권한·폐기
  // 여부와 무관하게 항상 있음(그래서 권한이 없거나 폐기된 자산도 더보기 버튼 자체는 남고, 메뉴엔 "자산 이력"만 뜸)
  function menuActions(a, target) {
    return [{ key: "history", label: "자산 이력" }, ...manageActions(a, target)];
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
    }${isIndiv && rec ? `<div>배정일 ${window.fmtDate(rec.since)}</div>` : ""}`;
    const cat = window.DATA.categories.find(c => c.group === a.group && c.sub === a.sub) || {};
    const hiddenFields = cat.hiddenFields || [];
    const kv = [
      { k: "분류", v: `<div><span class="type-pill">${isIndiv ? "개별 자산" : "수량 자산"}</span></div><div style="margin-top:5px">${categoryPath(a)}</div>` },
      { k: "유효기한", field: "expiry", v: expiryBadge(a.expiry) },
      { k: "태그", v: chips(a.labels) },
      isIndiv ? { k: "S/N", field: "serial", v: a.serial || '<span class="muted">—</span>' } : null,
      isIndiv ? { k: "IMEI", field: "imei", v: a.imei || '<span class="muted">—</span>' } : null,
      { k: "제조연월", field: "manufactured", v: a.manufactured ? window.fmtMonth(a.manufactured) : '<span class="muted">—</span>' },
      { k: "구매연월", field: "purchaseDate", v: a.purchaseDate ? window.fmtMonth(a.purchaseDate) : "—" },
      { k: "구매가격", field: "purchasePrice", v: a.price ? window.formatPrice(a.price) : "—" },
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
        ${photos.length > 1 ? `<span class="mapp-hero-count">+${photos.length - 1}</span>` : ""}
        ${canManage(a) ? `<button type="button" class="mapp-hero-edit" data-hero-edit aria-label="사진 관리" title="사진 관리">${IC_EDIT}</button>` : ""}
      </div>`;
    // 공동 배정/보유 대상 — target 본인을 뺀 나머지를 정보로만 노출(액션 없음). 최대 5개까지 보여주고
    // 초과하면 "전체보기"로 전용 목록 화면(partiesScreenHtml) 이동(근무지 카드의 최대 5개+전체보기와 동일 패턴)
    const others = otherParties(a, target);
    // 공동 대상이 0건이어도 섹션을 유지해 추가 진입점을 제공한다. 행은 계속 조회 전용이다.
    const partyHtml = `
      <div class="dsection">
        <div class="mapp-party-header"><h2 class="mapp-party-head">${isIndiv ? "공동 배정 대상" : "공동 보유 대상"}</h2>${canManage(a) && a.status !== "disposed" ? `<button type="button" class="btn sm" data-party-add>${isIndiv ? "배정 추가" : "보유 대상 추가"}</button>` : ""}</div>
        <div class="mapp-count">전체 <b>${others.length}</b></div>
        ${others.length ? `<div class="mapp-party-list">${others.slice(0, 5).map(x => partyRowHtml(x, isIndiv)).join("")}</div>` : `<p class="mapp-party-empty">${isIndiv ? "공동 배정 대상이 없습니다." : "공동 보유 대상이 없습니다."}</p>`}
        ${others.length > 5 ? `<button type="button" class="mapp-party-viewall" data-parties-viewall>전체보기</button>` : ""}
      </div>`;
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
    return (kind === "member" && DEMO_DIRECTORY_MEMBER === ME) || hasViewPermission(a);
  }
  function directoryAssetAvailable(kind) {
    if (!assetMgmtEnabled()) return false;
    // 자산 0건도 분류 조회 권한으로 노출. 메뉴/부모 탭은 데이터 건수로 숨기지 않는다.
    return (kind === "member" && DEMO_DIRECTORY_MEMBER === ME) || window.DATA.categories.some(cat => catViewPermission(cat));
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
        <div class="mapp-menu-cap">비용</div>
        <div class="mapp-menu-row"><span class="mapp-menu-ic">🧾</span>비용 정산</div>
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
    const state = { screen: "menu", menuExpanded: { member: false, worksite: false }, menuScroll: 0, assetTab: "mine", wsFilters: MappAssetFilter.empty(), wsSearch: "" };

    function draw() {
      const featureScreens = ["plan-features", "asset-feature"];
      if (featureScreens.includes(state.screen) && !canConfigureFeatures()) state.screen = "menu";
      if (!["menu", "member-profile", "worksite-profile", ...featureScreens].includes(state.screen) && !assetMgmtEnabled()) {
        // 회사 기능 OFF/요금제 미충족이면 이미 열려 있던 상세·편집 페이지도 접근을 차단한다.
        const filterCancel = document.querySelector(".mapp-asset-filter [data-filter-cancel]");
        if (filterCancel) filterCancel.click(); // 공용 필터의 포커스/스크롤 이벤트도 정상 해제.
        document.querySelectorAll(".mapp-fullpage-back, .mapp-sheet-back, .mapp-viewer-back, .dropdown-menu, .modal-back").forEach(node => node.remove());
        delete state.detailFrom;
        state.screen = "menu";
      }
      // 배정/보유 변경 액션이 window.DATA.assets를 직접 mutate하므로, 목록은 렌더마다 새로 집계
      // (한 번만 계산해 두면 재배정·반납 등으로 바뀐 내용이 목록 화면에 반영되지 않음)
      const items = sortItems(collectMyItems(ME));
      const worksiteGroups = collectWorksiteGroups(ME);
      const showTabBar = state.screen === "menu";
      const screenHtml = state.screen === "menu" ? menuScreenHtml(state.menuExpanded)
        : state.screen === "member-profile" ? directoryProfileScreenHtml("member", state)
        : state.screen === "worksite-profile" ? directoryProfileScreenHtml("worksite", state)
        : state.screen === "directory-worksite-assets" ? directoryWorksiteAssetsScreenHtml(state)
        : state.screen === "plan-features" ? planFeaturesScreenHtml()
        : state.screen === "asset-feature" ? assetFeatureScreenHtml()
        : state.screen === "worksite-detail" ? worksiteDetailScreenHtml(state.wsDetail, state.wsDetailSub, itemsForWorksite(state.wsDetail, state.wsDetailSub), state.wsFilters)
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
        // 공동 배정/보유 대상 전체보기는 자산 상세로, 자산 상세는 진입 직전 화면(내 자산/근무지 자산/
        // 전체보기)으로, 전체보기는 근무지 자산 탭으로, 그 외엔 메뉴로 복귀
        if (["asset-parties", "asset-history"].includes(state.screen)) { state.screen = "asset-detail"; }
        else if (state.screen === "asset-detail" && state.detailFrom) {
          const directoryReturn = ["member-profile", "directory-worksite-assets"].includes(state.detailFrom.screen);
          Object.assign(state, state.detailFrom); delete state.detailFrom;
          draw(); if (directoryReturn) root.querySelector(".mapp-screen").scrollTop = state.directoryListScroll || 0; return;
        }
        else if (state.screen === "worksite-detail") { state.screen = "assets"; state.assetTab = "worksite"; }
        else { state.screen = "menu"; }
        draw();
      };
      // 액션 완료 후 화면 복귀 — 반납·재배정(다른 대상으로)·보유 해제·폐기처럼 이 카드가 나타내던 target의
      // 레코드가 사라졌으면 진입 직전 목록으로, 아니면 자산 상세로(배정 추가·보유 대상 추가·재배정 페이지 포함)
      function afterMutate() {
        const a = assets.find(x => x.id === state.detailAssetId);
        let directoryReturn = false;
        if (findRecord(a, state.detailTarget).idx < 0) {
          directoryReturn = ["member-profile", "directory-worksite-assets"].includes(state.detailFrom.screen);
          Object.assign(state, state.detailFrom); delete state.detailFrom;
        }
        draw();
        if (directoryReturn) root.querySelector(".mapp-screen").scrollTop = state.directoryListScroll || 0;
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
      root.querySelectorAll("[data-directory-asset]").forEach(row => row.onclick = () => {
        const kind = state.screen === "member-profile" ? "member" : "worksite";
        const a = assets.find(asset => asset.id === row.dataset.directoryAsset);
        if (!a || !directoryAssetAvailable(kind) || !directoryCanViewAsset(a, kind)) return;
        state.directoryListScroll = root.querySelector(".mapp-screen").scrollTop;
        openDetail(a.id, directoryTarget(kind));
      });
      if (state.screen === "assets" && state.assetTab === "mine") {
        root.querySelectorAll("[data-asset-card]").forEach(el => el.onclick = () => openDetail(el.dataset.assetId, { type: "employee", value: ME }));
      } else if (state.screen === "worksite-detail") {
        root.querySelectorAll("[data-asset-card]").forEach(el => el.onclick = () => openDetail(el.dataset.assetId, { type: "worksite", value: state.wsDetail }));
      }
      if (state.screen === "worksite-detail") {
        const applyFilters = filters => { state.wsFilters = filters; draw(); };
        MappAssetFilter.wireApplied(root, state.wsFilters, applyFilters);
        const filterBtn = root.querySelector("[data-mapp-filter-open]");
        if (filterBtn) filterBtn.onclick = () => MappAssetFilter.open({
          category: window.DATA.categories.find(c => c.sub === state.wsDetailSub) || {},
          mode: "employee", filters: state.wsFilters, onApply: applyFilters,
        });
      }
      // 목록 카드 썸네일 → 뷰어 직행(공통 동작, 화면 무관하게 항상 와이어링). 사진이 없으면 stopPropagation을
      // 안 해서 카드 자체의 클릭(상세 진입)으로 자연히 넘어감
      root.querySelectorAll("[data-card-thumb]").forEach(el => el.onclick = e => {
        const asset = assets.find(x => x.id === el.dataset.assetId);
        if (!asset || !window.assetPhotos(asset).length) return;
        e.stopPropagation();
        openPhotoViewer(asset);
      });
      if (state.screen === "asset-detail") {
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
          // 내 자산·근무지 자산·구성원/근무지 상세 모두 현재 target의 배정일만 정정한다.
          else if (key === "date") {
            if (a.type !== "individual" || a.status === "disposed" || !canManage(a) || idx < 0) return;
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
          else if (key === "assign-add") {
            if ((a.assignments || []).length >= 5) toast("활성 배정은 최대 5건까지 가능합니다.");
            else openFormPage(a, target, "assign-add", afterMutate);
          }
          else if (key === "reassign") openFormPage(a, target, "reassign", afterMutate);
          else if (key === "hold-add") {
            const remaining = a.totalQty - (a.stocks || []).reduce((s, x) => s + x.qty, 0);
            if (remaining <= 0) toast("잔여 수량이 없습니다.");
            else openFormPage(a, target, "hold-add", afterMutate);
          }
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
        const partyAdd = root.querySelector("[data-party-add]");
        if (partyAdd) partyAdd.onclick = () => {
          if (!canManage(a) || a.status === "disposed") return;
          dispatchAction(a.type === "individual" ? "assign-add" : "hold-add");
        };
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
        // 검색 중 펼침은 임시 상태. 검색을 지우면 검색 직전 수동 접힘으로 복원한다.
        // 목록 복귀 시 상태를 보존하는 정책과는 별개이며 기존 화면 재진입 초기화는 유지한다.
        let searchFoldState = null;
        if (state.screen === "worksite-detail") searchInput.value = state.wsSearch;
        const applySearch = () => {
          if (state.screen === "worksite-detail") state.wsSearch = searchInput.value;
          const q = searchInput.value.trim().toLowerCase();
          if (q && !searchFoldState) {
            searchFoldState = new Map(sections.map(sec => [sec, sec.querySelector("[data-cat-collapse]").getAttribute("aria-expanded") === "true"]));
          }
          let anyVisible = false;
          cards.forEach(card => {
            const asset = assets.find(a => a.id === card.dataset.assetId);
            const hay = asset ? `${asset.product}${asset.type === "individual" ? asset.assetNo || "" : ""}`.toLowerCase() : "";
            const match = !q || hay.includes(q);
            card.hidden = !match;
            if (match) anyVisible = true;
          });
          sections.forEach(sec => {
            const matchedCount = [...sec.querySelectorAll("[data-asset-card]")].filter(card => !card.hidden).length;
            sec.hidden = matchedCount === 0;
            sec.querySelector("[data-cat-result-count]").textContent = matchedCount;
            const expanded = q ? true : searchFoldState?.get(sec);
            if (expanded !== undefined) {
              const button = sec.querySelector("[data-cat-collapse]");
              button.setAttribute("aria-expanded", String(expanded));
              button.classList.toggle("collapsed", !expanded);
              sec.querySelector("[data-cat-collapsible]").hidden = !expanded;
            }
          });
          if (!q) searchFoldState = null;
          if (emptyMsg && cards.length) emptyMsg.hidden = anyVisible;
          const count = root.querySelector("[data-worksite-result-count], [data-mine-result-count]");
          if (count) count.textContent = cards.filter(card => !card.hidden).length;
        };
        searchInput.addEventListener("input", applySearch);
        applySearch();
      }
      // 근무지 자산 — 근무지명/코드/주소 검색(카드 단위 hidden 토글)
      const wsSearchInput = root.querySelector("[data-mapp-ws-search]");
      if (wsSearchInput) {
        const wsCards = [...root.querySelectorAll("[data-ws-card]")];
        const wsCount = root.querySelector("[data-worksite-count]");
        const wsEmpty = root.querySelector("[data-mapp-ws-empty]");
        const applyWorksiteSearch = () => {
          const q = wsSearchInput.value.trim().toLowerCase();
          let count = 0;
          wsCards.forEach(card => {
            const hay = `${card.dataset.wsName}${card.dataset.wsCode}${card.dataset.wsAddress}`.toLowerCase();
            card.hidden = !(!q || hay.includes(q));
            if (!card.hidden) count++;
          });
          wsCount.textContent = count;
          wsEmpty.hidden = count > 0;
        };
        wsSearchInput.addEventListener("input", applyWorksiteSearch);
        applyWorksiteSearch();
      }
      // 근무지 카드의 소분류 행 클릭 → 그 근무지·그 소분류의 전체 자산 목록으로 이동
      root.querySelectorAll("[data-ws-cat-open]").forEach(b => b.onclick = () => {
        state.screen = "worksite-detail";
        state.wsDetail = b.dataset.ws;
        state.wsDetailSub = b.dataset.sub;
        state.wsFilters = MappAssetFilter.empty();
        state.wsSearch = "";
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
    window.addEventListener("storage", event => {
      if ([ASSET_MGMT_FLAG_KEY, COMPANY_PLAN_KEY].includes(event.key) || event.key === null) draw();
    });
    draw();
  }

  window.AppScreen = { render };
})();
