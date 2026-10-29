(function () {
  const {
    assets
  } = window.DATA;
  if (new URLSearchParams(location.search).get("qa") === "long-list") {
    const sample = assets.find(a => a.sub === "노트북");
    for (let i = 0; i < 100; i++) assets.push({
      ...sample,
      id: `QA-LIST-${i}`,
      assetNo: `QA-LIST-${String(i + 1).padStart(4, "0")}`,
      status: "stock",
      assignments: [],
      _photos: [],
      _activityLog: []
    });
  }
  const DEMO_ASSUME_FEATURE_ADMIN = !0,
    ASSET_MGMT_FLAG_KEY = "shopl_proto_assetMgmtUse",
    COMPANY_PLAN_KEY = "shopl_proto_companyPlan",
    PLAN_RANK = {
      Lite: 0,
      Standard: 1,
      Pro: 2,
      Enterprise: 3,
      Trial: 2
    },
    QA_PLAN = new URLSearchParams(location.search).get("plan");
  function companyPlan() {
    const plan = QA_PLAN || localStorage.getItem(COMPANY_PLAN_KEY) || "Enterprise";
    return Object.hasOwn(PLAN_RANK, plan) ? plan : "Lite";
  }
  function planAllows(minimum) {
    return PLAN_RANK[companyPlan()] >= PLAN_RANK[minimum];
  }
  function canConfigureFeatures() {
    return !0;
  }
  function assetMgmtEnabled() {
    return planAllows("Pro") && localStorage.getItem(ASSET_MGMT_FLAG_KEY) !== "0";
  }
  const FEATURE_GROUPS = [{
    name: "출퇴근 및 방문",
    items: [["출퇴근", "Lite"], ["스케줄", "Lite"], ["휴가", "Lite"], ["초과근무", "Standard"], ["근태 마감", "Standard"], ["방문계획 및 달성", "Standard"], ["위치 확인", "Pro"]]
  }, {
    name: "문서",
    items: [["전자문서", "Standard"]]
  }, {
    name: "커뮤니케이션",
    items: [["할 일", "Pro"], ["공지 및 설문", "Standard"], ["보고서", "Pro"], ["게시판", "Pro"], ["AI 챗봇", "Pro"], ["채팅", "Pro"]]
  }, {
    name: "매장 데이터 수집",
    items: [["판매량", "Enterprise"], ["가격", "Enterprise"], ["재고", "Enterprise"], ["전시현황", "Enterprise"]]
  }, {
    name: "목표 및 평가",
    items: [["목표 달성 관리", "Enterprise"], ["인센티브", "Enterprise"]]
  }, {
    name: "비용",
    items: [["비용 결재", "Pro"]]
  }, {
    name: "관리",
    items: [["자산 관리", "Pro"]]
  }];
  function featureIsOn(name, minimum) {
    return name === "자산 관리" ? assetMgmtEnabled() : planAllows(minimum);
  }
  const ASSET_FEATURE_DESCRIPTION = ["회사가 보유한 자산을 등록하고 배정 현황을 관리하는 기능입니다.", "자산을 분류하고, 구성원·근무지에 배정하거나 상태를 관리할 수 있습니다."],
    ASSET_FEATURE_ART = `<svg viewBox="0 0 320 180" fill="none" aria-hidden="true">
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
    const plan = companyPlan(),
      label = plan === "Trial" ? "무료 체험" : plan;
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
          ${planAllows("Pro") ? "" : '<span class="mapp-plan-tier">Pro 이상</span>'}
          <button type="button" class="toggle-switch${on ? " on" : ""}" data-plan-toggle role="switch" aria-label="자산 관리 사용 여부" aria-checked="${on}"><span class="toggle-knob"></span></button></div>
          <h1>자산 관리</h1>${ASSET_FEATURE_DESCRIPTION.map(text => `<p>${text}</p>`).join("")}</section>
        <section class="mapp-plan-info-card mapp-plan-settings"><h2>세부 기능 설정</h2><ul><li>자산 관리 권한</li></ul>
          <p class="mapp-plan-guide">세부 기능은 대시보드에서 설정할 수 있습니다.<br>(대시보드 &gt; 자산 &gt; 설정)</p>
          <button type="button" class="mapp-plan-dashboard" data-plan-dashboard>대시보드 링크 보기</button></section>
      </div></div>`;
  }
  function openPlanDialog({
    title,
    body,
    actions
  }) {
    const previousFocus = document.activeElement,
      rect = document.querySelector(".mapp-screen").getBoundingClientRect(),
      back = document.createElement("div");
    back.className = "mapp-plan-dialog-back", back.style.cssText = `position:absolute;top:${rect.top + window.scrollY}px;left:${rect.left + window.scrollX}px;width:${rect.width}px;height:${rect.height}px;`, back.innerHTML = `<div class="mapp-plan-dialog" role="dialog" aria-modal="true" aria-labelledby="plan-dialog-title"><div class="mapp-plan-dialog-body"><h2 id="plan-dialog-title">${title}</h2>${body || ""}</div><div class="mapp-plan-dialog-foot">${actions.map((action, index) => `<button type="button" data-plan-dialog-action="${index}">${action.label}</button>`).join("")}</div></div>`;
    function close() {
      back.remove(), document.removeEventListener("keydown", onKey), previousFocus && previousFocus.isConnected && previousFocus.focus();
    }
    function onKey(event) {
      if (event.key === "Escape" && (event.preventDefault(), close()), event.key === "Tab") {
        const buttons = [...back.querySelectorAll("button")],
          first = buttons[0],
          last = buttons[buttons.length - 1];
        event.shiftKey && document.activeElement === first ? (event.preventDefault(), last.focus()) : !event.shiftKey && document.activeElement === last && (event.preventDefault(), first.focus());
      }
    }
    return back.querySelectorAll("[data-plan-dialog-action]").forEach(button => button.onclick = () => {
      close();
      const action = actions[Number(button.dataset.planDialogAction)];
      action.run && action.run();
    }), document.addEventListener("keydown", onKey), document.body.appendChild(back), back.querySelector("button").focus(), back;
  }
  function openPlanDashboardLink() {
    const url = "https://dashboard.shoplworks.com",
      back = openPlanDialog({
        title: "대시보드(PC) 링크",
        body: `<p>PC에서 접속해주세요.</p><div class="mapp-plan-link-content"><p class="mapp-plan-link-url">${url}</p><div class="mapp-plan-link-actions"><button type="button" data-plan-copy><span aria-hidden="true">▣</span>복사</button><button type="button" data-plan-share><span aria-hidden="true">↗</span>공유</button></div></div>`,
        actions: [{
          label: "닫기"
        }]
      });
    back.querySelector("[data-plan-copy]").onclick = async () => {
      try {
        await navigator.clipboard.writeText(url), toast("링크가 복사되었습니다. PC에서 접속해주세요.");
      } catch {
        toast("주소를 길게 눌러 복사해주세요.");
      }
    }, back.querySelector("[data-plan-share]").onclick = async () => {
      if (!navigator.share) {
        toast("이 환경에서는 공유를 지원하지 않습니다. 주소를 복사해주세요.");
        return;
      }
      try {
        await navigator.share({
          title: "대시보드(PC) 링크",
          url
        });
      } catch (error) {
        error.name !== "AbortError" && toast("공유할 수 없습니다. 주소를 복사해주세요.");
      }
    };
  }
  function wirePlanFeatures(root, state, draw) {
    const goto = root.querySelector('[data-mapp-goto="plan-features"]');
    goto && (goto.onclick = () => {
      canConfigureFeatures() && (state.screen = "plan-features", draw());
    }), root.querySelectorAll("[data-plan-dashboard]").forEach(button => button.onclick = openPlanDashboardLink), root.querySelectorAll("[data-plan-feature]").forEach(button => button.onclick = () => {
      if (button.dataset.planFeature !== "자산 관리") {
        toast("이 기능의 상세 화면은 프로토타입 구현 범위에 포함되지 않습니다.");
        return;
      }
      state.featureListScroll = root.querySelector(".mapp-screen").scrollTop, state.screen = "asset-feature", draw();
    });
    const toggle = root.querySelector("[data-plan-toggle]");
    toggle && (toggle.onclick = () => {
      if (!canConfigureFeatures()) return;
      if (!planAllows("Pro")) {
        openPlanDialog({
          title: "Pro 요금제부터 사용할 수 있습니다.",
          body: "<p>자산 관리 기능을 사용하려면 요금제를 업그레이드해주세요.</p>",
          actions: [{
            label: "취소"
          }, {
            label: "대시보드 링크 보기",
            run: openPlanDashboardLink
          }]
        });
        return;
      }
      const on = assetMgmtEnabled();
      openPlanDialog({
        title: on ? "사용 안 함으로 설정하시겠습니까?" : "사용함으로 설정하시겠습니까?",
        body: "",
        // 앱 운영 양식: 사용함/사용 안 함 확인은 바디 없이 타이틀·취소/확인만 제공.
        actions: [{
          label: "취소"
        }, {
          label: "확인",
          run: () => {
            if (!canConfigureFeatures() || !planAllows("Pro")) {
              draw();
              return;
            }
            try {
              localStorage.setItem(ASSET_MGMT_FLAG_KEY, on ? "0" : "1");
            } catch {
              toast("저장하지 못했습니다. 다시 시도해주세요.");
              return;
            }
            draw(), toast("저장되었습니다.");
          }
        }]
      });
    });
  }
  const TODAY = /* @__PURE__ */new Date("2026-09-04"),
    esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]),
    normalizeTagName = value => value.trim().replace(/\s+/g, " ");
  function bindTagNameInput(input, onInput) {
    function insertWithoutSeparator(event, text) {
      if (!text || !text.includes("|")) return;
      event.preventDefault();
      const start = input.selectionStart,
        end = input.selectionEnd,
        room = input.maxLength < 0 ? text.length : Math.max(0, input.maxLength - input.value.length + end - start),
        allowed = text.replace(/\|/g, "").slice(0, room);
      allowed && (input.setRangeText(allowed, start, end, "end"), input.dispatchEvent(new Event("input", {
        bubbles: !0
      })));
    }
    input.addEventListener("beforeinput", event => {
      event.isComposing || insertWithoutSeparator(event, event.data);
    }), input.addEventListener("paste", event => insertWithoutSeparator(event, event.clipboardData.getData("text"))), input.addEventListener("input", () => {
      const before = input.value;
      if (before.includes("|")) {
        const start = before.slice(0, input.selectionStart).replace(/\|/g, "").length,
          end = before.slice(0, input.selectionEnd).replace(/\|/g, "").length;
        input.value = before.replace(/\|/g, ""), input.setSelectionRange(start, end);
      }
      onInput();
    });
  }
  function formatAddPrice(value) {
    return window.formatPurchasePriceInput(value);
  }
  const CLOSE_ICON_SM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    CAL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
    TAG_COLORS = [{
      fg: "#3461c9",
      bg: "#eaf1ff"
    }, {
      fg: "#6b3fd4",
      bg: "#f1ecff"
    }, {
      fg: "#c23c56",
      bg: "#fdecef"
    }, {
      fg: "#1f8f5f",
      bg: "#e8f8f0"
    }, {
      fg: "#b5790a",
      bg: "#fdf3e0"
    }, {
      fg: "#1f8fae",
      bg: "#e6f6fa"
    }];
  function todayStr() {
    const p = n => String(n).padStart(2, "0");
    return `${TODAY.getFullYear()}-${p(TODAY.getMonth() + 1)}-${p(TODAY.getDate())}`;
  }
  function tagColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 997;
    return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
  }
  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    const screen = document.querySelector(".mapp-screen"),
      r = screen ? screen.getBoundingClientRect() : null,
      pos = r ? `left:${r.left + r.width / 2}px;bottom:${window.innerHeight - r.bottom + 32}px;` : "left:50%;bottom:32px;";
    t.style.cssText = `position:fixed;${pos}transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300;max-width:280px;text-align:center`, document.body.appendChild(t), setTimeout(() => t.remove(), 1800);
  }
  function mappOverlay(className, zIndex) {
    const back = document.createElement("div");
    back.className = className;
    const screen = document.querySelector(".mapp-screen"),
      r = screen ? screen.getBoundingClientRect() : {
        top: 0,
        left: 0,
        width: 390,
        height: 844
      };
    return back.style.cssText = `position:absolute;top:${r.top + window.scrollY}px;left:${r.left + window.scrollX}px;width:${r.width}px;height:${r.height}px;z-index:${zIndex};`, document.body.appendChild(back), back;
  }
  function openAddDropdown(anchor, items, onPick) {
    document.querySelectorAll(".dropdown-menu").forEach(menu2 => menu2.remove());
    const menu = document.createElement("div");
    menu.className = "dropdown-menu", menu.innerHTML = items.map(item => `<button type="button" data-key="${item.key}">${item.label}</button>`).join("");
    const r = anchor.getBoundingClientRect();
    menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${Math.max(8, r.right - 180)}px;min-width:180px`, document.body.appendChild(menu), menu.querySelectorAll("button").forEach(button => button.onclick = () => {
      menu.remove(), onPick(button.dataset.key);
    }), setTimeout(() => {
      const close = event => {
        menu.contains(event.target) || (menu.remove(), document.removeEventListener("click", close));
      };
      document.addEventListener("click", close);
    });
  }
  function openAddMonthSheet(title, initialMonth, onApply) {
    const base = initialMonth || todayStr().slice(0, 7);
    let viewY = Number(base.slice(0, 4)),
      selected = initialMonth || "";
    const maxMonth = todayStr().slice(0, 7),
      back = mappOverlay("mapp-sheet-back", 120);
    back.innerHTML = `<div class="mapp-sheet mapp-add-month-sheet" role="dialog" aria-modal="true" aria-label="${title}">
      ${initialMonth ? '<div class="mapp-add-month-reset"><button type="button" data-add-date-reset>초기화</button></div>' : ""}
      <div class="mapp-sheet-body" data-add-month-body></div>
      <div class="mapp-sheet-foot"><button type="button" data-add-month-cancel>취소</button><button type="button" data-add-month-ok>확인</button></div></div>`;
    const body = back.querySelector("[data-add-month-body]"),
      ok = back.querySelector("[data-add-month-ok]"),
      pad = n => String(n).padStart(2, "0");
    function drawMonths() {
      body.innerHTML = `<div class="mapp-add-month-head"><button type="button" data-month-prev aria-label="이전 해">‹</button><strong>${viewY}</strong><button type="button" data-month-next aria-label="다음 해">›</button></div>
        <div class="mapp-add-month-grid">${Array.from({
        length: 12
      }, (_, index) => {
        const value = `${viewY}-${pad(index + 1)}`;
        return `<button type="button" data-month="${value}" aria-label="${index + 1}월" aria-pressed="${value === selected}" class="${value === selected ? "sel" : ""}"${value > maxMonth ? " disabled" : ""}><span>${pad(index + 1)}</span></button>`;
      }).join("")}</div><div class="mapp-cal-sel">${selected ? selected.replace("-", ".") : ""}</div>`, body.querySelector("[data-month-prev]").onclick = () => {
        viewY--, drawMonths();
      };
      const next = body.querySelector("[data-month-next]");
      next.disabled = viewY >= Number(maxMonth.slice(0, 4)), next.onclick = () => {
        next.disabled || (viewY++, drawMonths());
      }, body.querySelectorAll("[data-month]").forEach(button => button.onclick = () => {
        selected = button.dataset.month, drawMonths();
      }), ok.disabled = !selected;
    }
    drawMonths(), back.querySelector("[data-add-month-cancel]").onclick = () => back.remove();
    const reset = back.querySelector("[data-add-date-reset]");
    reset && (reset.onclick = () => {
      back.remove(), onApply("");
    }), ok.onclick = () => {
      selected && (back.remove(), onApply(selected));
    };
  }
  const ME = "김민수",
    DEMO_ASSUME_ASSET_MANAGE_PERMISSION = window.AssetPermissionQa?.managePermission ?? !0;
  function hasAssetManagePermission() { return window.hasPrototypeAssetManagePermission(); }
  const MEMBER_TEAM = {
    김민수: "개발팀",
    이서연: "디자인팀",
    박지훈: "영업팀",
    정우성: "CS팀",
    김철수: "운영팀",
    최유진: "개발팀",
    한소희: "디자인팀",
    장민호: "국내영업",
    오세훈: "운영팀",
    배수지: "CS팀",
    윤재현: "해외영업",
    임하늘: "개발팀"
  };
  function catViewPermission(cat) {
    if (!cat) return !1;
    if (hasAssetManagePermission()) return !0;
    switch (cat.view) {
      case "회사의 모든 구성원":
        return !0;
      case "모든 관리자 및 리더":
        return !0;
      // 현재 페르소나는 리더 김민수
      case "특정 관리자/리더":
        return (cat.viewTarget && cat.viewTarget.members || []).includes(ME);
      case "특정 그룹 및 직무/직급":
        return window.matchesAssetGroupPositionTarget(cat.viewTarget, MEMBER_TEAM[ME], window.ASSET_MEMBER_JOB_TITLES[ME]);
      default:
        return !1;
    }
  }
  function hasViewPermission(a) {
    return catViewPermission(window.DATA.categories.find(c => c.group === a.group && c.sub === a.sub));
  }
  const STATUS_LABEL = {
      stock: ["배정 가능", "stock"],
      assigned: ["배정 중", "assigned"],
      repair: ["수리/점검 중", "repair"],
      lost: ["분실", "lost"],
      disposed: ["폐기", "disposed"]
    },
    CATEGORY_ORDER = new Map(window.DATA.categories.map((c, i) => [c.sub, i]));
  function subOrder(sub) {
    return CATEGORY_ORDER.has(sub) ? CATEGORY_ORDER.get(sub) : 999;
  }
  function sortItems(items) {
    return [...items].sort((p, q) => {
      const bySub = subOrder(p.asset.sub) - subOrder(q.asset.sub);
      return bySub || p.asset.product.localeCompare(q.asset.product, "ko") || (p.asset.assetNo || "").localeCompare(q.asset.assetNo || "", "ko");
    });
  }
  function collectLeaderItems() {
    return assets.filter(a => hasViewPermission(a)).map(a => ({
      asset: a,
      qty: 1
    }));
  }
  function categoryTree() {
    const order = [],
      map = {};
    return window.DATA.categories.forEach(c => {
      catViewPermission(c) && (map[c.group] || (map[c.group] = [], order.push(c.group)), map[c.group].push(c.sub));
    }), hasAssetManagePermission() && (window.DATA.emptyGroups || []).forEach(group => {
      map[group] || (map[group] = [], order.push(group));
    }), order.map(group => ({
      group,
      subs: map[group]
    }));
  }
  function countForSub(sub) {
    return assets.filter(a => a.sub === sub && hasViewPermission(a)).length;
  }
  const THUMB_EMPTY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-4 4 3 4-4 5 4"/></svg>';
  function cardThumb(a) {
    const photos = window.assetPhotos(a);
    return photos.length ? `<span class="mapp-thumb" style="background:${photos[a._primary || 0].color}"></span>` : `<span class="mapp-thumb empty">${THUMB_EMPTY}</span>`;
  }
  function assetCardHtml(x) {
    const a = x.asset;
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
  const MENU_ICON_ASSET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="m21 16-5-5-9 8"/></svg>',
    CHEV_DOWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>',
    PHOTO_COLORS = ["#5b8def", "#8f6ef0", "#eb7f8b", "#3fb37f", "#e0a63c", "#4dabf7"];
  function addFabHtml() {
    return hasAssetManagePermission() ? '<button type="button" class="mapp-asset-add-fab" data-asset-add-open aria-label="자산 추가">+</button>' : "";
  }
  function emptyAddDraft(category) {
    return {
      category: category ? `${category.group}|${category.sub}` : "",
      product: "",
      assetNo: "",
      photos: [],
      primaryPhoto: 0,
      expiry: "",
      expiryTouched: !1,
      labels: [],
      serial: "",
      imei: "",
      manufactured: "",
      purchaseDate: "",
      purchasePrice: "",
      note: ""
    };
  }
  function hasAddInput(draft) {
    return !!draft.category || ["product", "assetNo", "expiry", "serial", "imei", "manufactured", "purchaseDate", "purchasePrice", "note"].some(key => String(draft[key] || "").trim()) || draft.photos.length > 0 || draft.labels.length > 0;
  }
  function confirmAddExit(onLeave, editing = !1) {
    const title = editing ? "수정을 중단하시겠습니까?" : "작성을 중단하시겠습니까?",
      body = editing ? "수정을 중단할 경우 변경된 내용은 저장되지 않습니다." : "지금까지 작성한 내용은 저장되지 않습니다.",
      cb = document.createElement("div");
    cb.className = "modal-back", cb.style.zIndex = 340, cb.innerHTML = `<div class="modal sm" style="width:340px" role="dialog" aria-modal="true" aria-label="${title}">
      <h3>${title}</h3>
      <div class="body" style="font-size:14px">${body}</div>
      <div class="foot"><button type="button" class="btn" data-add-stay>취소</button><button type="button" class="btn primary" data-add-leave>확인</button></div></div>`, document.body.appendChild(cb), cb.querySelector("[data-add-stay]").onclick = () => cb.remove(), cb.querySelector("[data-add-leave]").onclick = () => {
      cb.remove(), onLeave();
    };
  }
  function addCategory(draft) {
    const [group, sub] = (draft.category || "").split("|");
    return window.DATA.categories.find(c => c.group === group && c.sub === sub) || null;
  }
  function formatAddExpiry(value) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    return digits.length > 6 ? `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}` : digits.length > 4 ? `${digits.slice(0, 4)}.${digits.slice(4)}` : digits;
  }
  function parseAddExpiry(value) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (!digits.length) return "";
    if (digits.length !== 8) return null;
    const y = +digits.slice(0, 4),
      m = +digits.slice(4, 6),
      day = +digits.slice(6, 8),
      date = new Date(y, m - 1, day);
    return date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== day ? null : `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  }
  function addExpiryFieldHtml(draft) {
    const value = draft.expiry || "";
    return `<div class="mapp-add-field"><label>유효기한</label><button type="button" class="mapp-add-date${value ? " selected" : ""}" data-add-date="expiry" data-add-date-mode="day"><span>${value || "선택"}</span>${CAL_ICON}</button></div>`;
  }
  function addDraftValid(draft) {
    const cat = addCategory(draft);
    if (!cat || !catViewPermission(cat) || !draft.product.trim() || draft.nameDupKey || !(cat.hiddenFields || []).includes("expiry") && parseAddExpiry(draft.expiry) === null) return !1;
    if (draft.editingId) {
      const asset = assets.find(a => a.id === draft.editingId);
      if (!asset || !hasAssetManagePermission() || asset.status === "disposed" || asset.type !== cat.type) return !1;
    }
    const assetNo = draft.assetNo.trim();
    return (!draft.editingId || !!assetNo) && (draft.editingId ? !assets.some(a => !a.deleted_at && a.id !== draft.editingId && a.assetNo === assetNo) : !draft.assetNoDupValue);
  }
  function addInputHtml(label, key, draft, options) {
    const opts = options || {};
    return `<div class="mapp-add-field"><label for="mapp-add-${key}">${label}${opts.required ? ' <span class="req">*</span>' : ""}</label>
      ${opts.textarea ? `<textarea id="mapp-add-${key}" data-add-field="${key}" maxlength="${opts.maxlength || 500}" placeholder="입력">${esc(draft[key])}</textarea>` : `<input id="mapp-add-${key}" data-add-field="${key}" type="${opts.type || "text"}"${opts.inputmode ? ` inputmode="${opts.inputmode}"` : ""}${opts.maxlength ? ` maxlength="${opts.maxlength}"` : ""}${opts.list ? ` list="${opts.list}"` : ""} value="${esc(draft[key])}" placeholder="입력">`}
      ${opts.hint ? `<p class="hint">${esc(opts.hint)}</p>` : ""}${opts.error ? `<p class="field-err" data-add-error hidden>${opts.error}</p>` : ""}</div>`;
  }
  function addProductFieldHtml(draft) {
    return `<div class="mapp-add-field"><label for="mapp-add-product">품목명 <span class="req">*</span></label>
      <div class="mapp-add-input-wrap"><input id="mapp-add-product" data-add-field="product" type="text" maxlength="50" value="${esc(draft.product)}" placeholder="입력" autocomplete="off" aria-describedby="mapp-add-product-error">
        <div class="mapp-add-suggest" data-add-product-menu hidden></div></div>
      <p id="mapp-add-product-error" class="field-err" data-add-product-error hidden>동일한 명칭이 이미 등록되어 있습니다.</p></div>`;
  }
  function addDateSelectHtml(label, key, draft, mode) {
    const value = draft[key],
      shown = value ? mode === "month" ? value.replace("-", ".") : window.fmtDate(value) : "선택";
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
    const cat = addCategory(draft),
      hidden = cat ? cat.hiddenFields || [] : [],
      categoryLabel = cat ? `${cat.group} › ${cat.sub}` : "선택",
      photoTiles = draft.photos.map((photo, i) => `<div class="mapp-add-photo-tile${i === draft.primaryPhoto ? " primary" : ""}" style="background:${photo.color}">
      <button type="button" data-add-photo-primary="${i}" aria-label="사진 ${i + 1}${i === draft.primaryPhoto ? " 대표" : ""}">${i === draft.primaryPhoto ? "★" : ""}</button>
      <button type="button" class="mapp-add-photo-delete" data-add-photo-delete="${i}" aria-label="사진 삭제">×</button>
    </div>`).join("");
    return `
      <div class="mapp-topbar mapp-add-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        <span class="mapp-topbar-title">${draft.editingId ? "자산 수정" : "자산 추가"}</span>
        ${draft.editingId ? "" : '<button type="button" class="mapp-add-ai-trigger" data-add-ai>AI로 입력</button>'}
      </div>
      <div class="mapp-add-body">
        <div class="mapp-add-field"><label>분류 <span class="req">*</span></label>
          <button type="button" class="mapp-add-select${cat ? " selected" : ""}" data-add-category>${esc(categoryLabel)}<span>›</span></button>
        </div>
        ${addProductFieldHtml(draft)}
        ${`
          <div class="mapp-add-field"><label>사진</label><div class="mapp-add-photos">${photoTiles}<button type="button" class="mapp-add-photo-plus" data-add-photo aria-label="사진 추가">+</button></div></div>
          ${addInputHtml("고유관리번호", "assetNo", draft, {
      required: !!draft.editingId,
      hint: draft.editingId ? "" : window.ASSET_NUMBER_GUIDE,
      maxlength: 30,
      error: "동일한 고유관리번호가 존재합니다."
    })}${draft.editingId, ""}

          <div class="mapp-add-field"><div class="mapp-add-field-label"><label>태그</label><button type="button" data-add-tag-manage>태그 관리</button></div><p class="hint mapp-add-tag-hint">최대 10개까지 선택할 수 있습니다.</p>
            <div class="mapp-add-tag-picker"><div class="tag-input-wrap"><div class="tag-chips" data-add-tag-chips>${addTagChipsHtml(draft.labels)}</div><input type="text" data-add-tag-search placeholder="${draft.labels.length ? "" : "검색"}" autocomplete="off"${draft.labels.length >= window.ASSET_TAG_MAX_COUNT ? " disabled" : ""}></div><div class="mapp-add-suggest" data-add-tag-menu hidden></div></div></div>
          <fieldset class="extra-info-section"${cat?"":" disabled"}><h4>추가 정보</h4>
          ${cat && !window.AssetExtra.visible(cat,"expiry",hasAssetManagePermission()) ? "" : addExpiryFieldHtml(draft)}
          ${hidden.includes("manufactured") ? "" : addDateSelectHtml("제조연월", "manufactured", draft, "month")}
          ${hidden.includes("purchaseDate") ? "" : addDateSelectHtml("구매연월", "purchaseDate", draft, "month")}
          ${hidden.includes("purchasePrice") ? "" : addInputHtml("구매가격", "purchasePrice", draft, {
      inputmode: "decimal",
      maxlength: 21
    })}
          ${window.AssetExtra.customInputs(cat,draft.extraValues||{},'data-mobile-extra',hasAssetManagePermission())}</fieldset>
          ${addInputHtml("메모", "note", draft, {
      textarea: !0,
      maxlength: 500
    })}`}
      </div>
      <div class="mapp-add-foot"><button type="button" class="btn primary" data-add-save${addDraftValid(draft) && editDirty(draft) ? "" : " disabled"}>저장</button></div>`;
  }
  function assetAddCategoryScreenHtml(draft) {
    const categories = new URLSearchParams(location.search).get("qa") === "add-category-empty" ? [] : window.DATA.categories.filter(cat => catViewPermission(cat) && (!draft.editingId || cat.type === assets.find(a => a.id === draft.editingId).type)),
      groups = [];
    return categories.forEach(cat => {
      let group = groups.find(g => g.name === cat.group);
      group || (group = {
        name: cat.group,
        items: []
      }, groups.push(group)), group.items.push(cat);
    }), `
      <div class="mapp-add-category-popup">
      <div class="mapp-topbar mapp-add-category-head">
        <span class="mapp-topbar-title">분류</span>
        <button type="button" class="mapp-add-category-close" data-add-category-close aria-label="닫기">×</button>
      </div>
      <div class="mapp-add-category-body">
        ${groups.length ? `<div class="mapp-directory-search"><input type="search" data-add-category-search placeholder="검색" aria-label="분류 검색" autocomplete="off"></div>
        <div data-add-category-list>${groups.map(group => `<section class="mapp-add-category-group" data-add-category-group data-group-name="${esc(group.name)}">
          <h2>${esc(group.name)}</h2>${group.items.map(cat => `<button type="button" data-add-category-pick="${esc(`${cat.group}|${cat.sub}`)}" data-sub-name="${esc(cat.sub)}"><span>${esc(cat.sub)}</span></button>`).join("")}
        </section>`).join("")}</div>
        <p class="mapp-ws-empty" data-add-category-empty hidden>결과가 없습니다.</p>` : '<p class="mapp-ws-empty">표시할 목록이 없습니다.</p>'}
      </div>
      </div>`;
  }
  function mobileAiDraft(partial) {
    return partial ? {
      product: "MacBook Pro 14",
      serial: "C02AI2026",
      manufactured: "2026-01"
    } : {
      product: "MacBook Pro 14",
      assetNo: "AI-2026-0001",
      serial: "C02AI2026",
      manufactured: "2026-01",
      purchaseDate: "2026-02",
      purchasePrice: "2500000",
      labels: (window.DATA.tags || []).slice(0, 2)
    };
  }
  function applyMobileAiDraft(draft, values, {
    replace = !0
  } = {}) {
    const cat = addCategory(draft);
    if (!cat || !values) return;
    const hidden = cat.hiddenFields || [],
      fill = key => {
        replace ? draft[key] = values[key] == null ? "" : String(values[key]) : !String(draft[key] || "").trim() && values[key] != null && values[key] !== "" && (draft[key] = String(values[key]));
      };
    draft.extraValues={...(values.extraValues||{})};
    fill("product"), fill("note"), draft.labels = (values.labels || []).filter(tag => window.DATA.tags.includes(tag)).slice(0, window.ASSET_TAG_MAX_COUNT), draft._aiDraft = null, draft._aiPendingPhotos = null, fill("assetNo"), hidden.includes("serial") || fill("serial"), hidden.includes("imei") || fill("imei"), hidden.includes("expiry") || fill("expiry"), hidden.includes("manufactured") || fill("manufactured"), hidden.includes("purchaseDate") || fill("purchaseDate"), !hidden.includes("purchasePrice") && (replace || !String(draft.purchasePrice || "").trim()) && (draft.purchasePrice = values.purchasePrice == null || values.purchasePrice === "" ? "" : window.formatPurchasePriceInput(values.purchasePrice));
  }
  function copyCategoryDraft(draft) {
    return JSON.parse(JSON.stringify(draft, (key, value) => key === "_categoryDrafts" ? void 0 : value));
  }
  function recommendedMobileAiCategory() {
    return window.DATA.categories.find(cat => cat.group === "전자기기류" && cat.sub === "노트북") || window.DATA.categories.find(cat => catViewPermission(cat)) || null;
  }
  function confirmMobileAiExit(onLeave) {
    const cb = document.createElement("div");
    cb.className = "modal-back", cb.style.zIndex = 340, cb.innerHTML = `<div class="modal sm" style="width:340px" role="dialog" aria-modal="true" aria-label="AI 입력을 중단하시겠습니까?">
      <h3>AI 입력을 중단하시겠습니까?</h3>
      <div class="body" style="font-size:14px">첨부한 사진과 분석 결과는 저장되지 않습니다.</div>
      <div class="foot"><button type="button" class="btn" data-ai-stay>취소</button><button type="button" class="btn primary" data-ai-leave>확인</button></div>
    </div>`, document.body.appendChild(cb), cb.querySelector("[data-ai-stay]").onclick = () => cb.remove(), cb.querySelector("[data-ai-leave]").onclick = () => {
      cb.remove(), onLeave();
    };
  }
  function openMobileAiInput(draft, onApplied, onChooseCategory) {
    const back = mappOverlay("mapp-ai-back", 130);
    back.innerHTML = `<div class="mapp-ai-dialog" role="dialog" aria-modal="true" aria-label="AI로 입력">
      <div class="mapp-ai-head"><h2>AI로 입력</h2><button type="button" data-ai-close aria-label="닫기">${CLOSE_ICON_SM}</button></div>
      <div class="mapp-ai-body">
        <p class="mapp-ai-guide">자산 사진을 첨부하면 AI가 자산 정보를 분석해 입력합니다.</p>
        <div class="mapp-ai-photos" data-ai-photos></div>
        <div class="mapp-ai-state" data-ai-state></div>
        <button type="button" class="btn primary mapp-ai-analyze" data-ai-analyze>분석하기</button>
      </div>
    </div>`;
    const newPhotos = [],
      photosEl = back.querySelector("[data-ai-photos]"),
      stateEl = back.querySelector("[data-ai-state]"),
      analyze = back.querySelector("[data-ai-analyze]");
    let analyzing = !1;
    function close() {
      back.remove();
    }
    function requestClose() {
      newPhotos.length ? confirmMobileAiExit(close) : close();
    }
    function renderPhotos() {
      const existing = draft.photos.map((photo, index) => `<span class="mapp-ai-photo" style="background:${photo.color}" aria-label="사진 ${index + 1}">${index === draft.primaryPhoto ? '<span class="mapp-ai-star">★</span>' : ""}</span>`).join(""),
        added = newPhotos.map((photo, index) => `<span class="mapp-ai-photo" style="background:${photo.color}" aria-label="새 사진 ${index + 1}">${analyzing ? "" : `<button type="button" data-ai-photo-delete="${index}" aria-label="새 사진 삭제">×</button>`}</span>`).join(""),
        total = draft.photos.length + newPhotos.length,
        add = `<button type="button" class="mapp-ai-photo-add" data-ai-photo-add aria-label="사진 추가" ${analyzing ? "disabled" : ""}>+</button>`;
      photosEl.innerHTML = existing + added + add, analyze.disabled = !total || analyzing, photosEl.querySelectorAll("[data-ai-photo-delete]").forEach(button => button.onclick = () => {
        newPhotos.splice(+button.dataset.aiPhotoDelete, 1), renderPhotos();
      });
      const addButton = photosEl.querySelector("[data-ai-photo-add]");
      addButton && (addButton.onclick = () => {
        if (total >= window.ASSET_PHOTO_MAX_COUNT) {
          toast("자산 1개당 사진은 최대 10장까지 첨부할 수 있습니다.");
          return;
        }
        openAddDropdown(addButton, [{
          key: "camera",
          label: "카메라로 촬영하기"
        }, {
          key: "gallery",
          label: "갤러리에서 불러오기"
        }], () => {
          newPhotos.push({
            id: window.assetPhotoId(),
            color: PHOTO_COLORS[(draft.photos.length + newPhotos.length) % PHOTO_COLORS.length],
            at: `${todayStr()} 00:00`,
            by: ME
          }), renderPhotos();
        });
      });
    }
    function appendPhotos() {
      const room = Math.max(0, window.ASSET_PHOTO_MAX_COUNT - draft.photos.length);
      newPhotos.slice(0, room).forEach(photo => draft.photos.push({
        ...photo
      })), draft.photos.length && draft.primaryPhoto >= draft.photos.length && (draft.primaryPhoto = 0);
    }
    function applyResult(values, recommend) {
      if (recommend) {
        const cat = recommendedMobileAiCategory(),
          next = cat ? `${cat.group}|${cat.sub}` : draft.category;
        next !== draft.category && draft.category && (draft._categoryDrafts || (draft._categoryDrafts = /* @__PURE__ */new Map())).set(draft.category, copyCategoryDraft(draft)), draft.category = next;
      }
      applyMobileAiDraft(draft, values, {
        replace: !0
      }), appendPhotos(), close(), onApplied();
    }
    function direct(values) {
      appendPhotos(), draft.category ? Object.keys(values).length && applyMobileAiDraft(draft, values, {
        replace: !0
      }) : draft._pendingAiOnce = Object.keys(values).length ? values : null, close(), onApplied();
    }
    function renderLoading() {
      analyzing = !0, analyze.hidden = !0, stateEl.innerHTML = `<div class="mapp-ai-loading"><span class="mapp-ai-spinner" aria-hidden="true"></span><b>AI가 자산 정보를 분석하고 있습니다.</b></div>
        <div class="mapp-ai-test-actions"><button type="button" class="btn" data-ai-result="success">성공</button><button type="button" class="btn" data-ai-result="insufficient">정보 부족</button><button type="button" class="btn" data-ai-result="error">분석 오류</button></div>`, stateEl.querySelector('[data-ai-result="success"]').onclick = () => applyResult(mobileAiDraft(!1), !0), stateEl.querySelector('[data-ai-result="insufficient"]').onclick = () => renderFailure("insufficient"), stateEl.querySelector('[data-ai-result="error"]').onclick = () => renderFailure("error"), renderPhotos();
    }
    function renderFailure(kind) {
      analyzing = !1, analyze.hidden = !0;
      const insufficient = kind === "insufficient";
      stateEl.innerHTML = `<div class="mapp-ai-result"><b>${insufficient ? "AI가 자산 정보를 충분히 확인하지 못했습니다." : "AI 분석을 완료하지 못했습니다."}</b>
        <p>${insufficient ? "다시 시도하거나 직접 입력해 주세요." : "잠시 후 다시 시도하거나 직접 입력해 주세요."}</p>
        <p>직접 입력을 선택해도 첨부한 사진과 ${insufficient ? "확인된 정보는" : "확인된 정보가 있으면"} 유지됩니다.</p></div>
        <div class="mapp-ai-result-actions"><button type="button" class="btn" data-ai-retry>다시 시도</button><button type="button" class="btn primary" data-ai-direct>직접 입력</button></div>`, stateEl.querySelector("[data-ai-retry]").onclick = renderLoading, stateEl.querySelector("[data-ai-direct]").onclick = () => direct(insufficient ? mobileAiDraft(!0) : {}), renderPhotos();
    }
    renderPhotos(), analyze.onclick = renderLoading, back.querySelector("[data-ai-close]").onclick = requestClose;
  }
  const DEMO_DIRECTORY_MEMBER = "김민수",
    DEMO_DIRECTORY_WORKSITE = "강남점";
  function directoryMenuHtml(kind, expanded) {
    const member = kind === "member",
      label = member ? "구성원" : "근무지";
    return `<div class="mapp-menu-folder">
      <button type="button" class="mapp-menu-row mapp-menu-fold" data-menu-fold="${kind}" aria-expanded="${!!expanded}" aria-controls="mapp-menu-${kind}-list"><span class="mapp-menu-ic">${member ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="7" r="3.5"/><path d="M5 21v-3a7 7 0 0 1 14 0v3H5Z"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h3M14 7h2M8 11h3M8 15h3"/></svg>'}</span><span>${label}</span><span class="mapp-menu-chev" aria-hidden="true"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 6 5 5 5-5"/></svg></span></button>
      <div class="mapp-menu-sublist" id="mapp-menu-${kind}-list"${expanded ? "" : " hidden"}>
        <button type="button" class="mapp-menu-subrow" data-directory-open="${kind}">${label} 관리</button>
        <span class="mapp-menu-subrow">${member ? "퇴사 직원" : "비활성 근무지"}</span>
        <span class="mapp-menu-subrow">설정</span>
      </div></div>`;
  }
  function directoryEsc(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }
  function directoryTarget(kind) {
    return {
      type: kind === "member" ? "employee" : "worksite",
      value: kind === "member" ? DEMO_DIRECTORY_MEMBER : DEMO_DIRECTORY_WORKSITE
    };
  }
  function directorySelfAsset(a, kind) {
    return !a || a.deleted_at || kind !== "member" || DEMO_DIRECTORY_MEMBER !== ME ? !1 : (a.assignments || []).some(record => record.employee === ME);
  }
  function directoryCanViewAsset(a, kind) {
    return !a || a.deleted_at ? !1 : hasViewPermission(a) || directorySelfAsset(a, kind);
  }
  function directoryAssetAvailable(kind) {
    return assetMgmtEnabled() ? window.DATA.categories.some(cat => catViewPermission(cat)) || assets.some(a => directorySelfAsset(a, kind)) : !1;
  }
  function directoryItems(kind) {
    const target = directoryTarget(kind),
      result = [];
    return assets.forEach(a => {
      a.deleted_at || !directoryCanViewAsset(a, kind) || (a.assignments || []).forEach(record => {
        record[target.type] === target.value && result.push({
          asset: a,
          since:record.since,
          qty: 1
        });
      });
    }), result.sort((a,b)=>(b.since||"").localeCompare(a.since||"")||a.asset.product.localeCompare(b.asset.product,"ko")||(a.asset.assetNo||"").localeCompare(b.asset.assetNo||""));
  }
  const DEMO_DIRECTORY_TASK_ACCESS = !0,
    DIRECTORY_WORK_TASKS = [["tam", "판매 목표", "목표 달성 관리", "Enterprise"], ["todo", "할 일", "할 일", "Pro"], ["report", "보고서", "보고서", "Pro"], ["board", "게시판", "게시판", "Pro"], ["sales", "판매량", "판매량", "Enterprise"], ["price", "가격", "가격", "Enterprise"], ["inventory", "재고", "재고", "Enterprise"], ["display", "전시현황", "전시현황", "Enterprise"]];
  function directoryTaskMenus(kind) {
    return DIRECTORY_WORK_TASKS.filter(([key,, feature, minimum]) => (kind === "worksite" || ["todo", "report", "board"].includes(key)) && (kind === "worksite" || !0) && featureIsOn(feature, minimum));
  }
  function directoryTaskVisible(kind) {
    return directoryTaskMenus(kind).length > 0;
  }
  const DIRECTORY_ICONS = {
    asset: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 5v5M15 5v5M10 15h4"/>',
    todo: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="m8 9 2 2 4-4M8 16h8"/>',
    report: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM9 11h6M9 15h4"/>',
    board: '<path d="M7 3h12v17H5V7l2-4Z"/><path d="M9 8h6M9 12h6M9 16h3"/>'
  };
  function directoryIcon(key) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${DIRECTORY_ICONS[key] || DIRECTORY_ICONS.report}</svg>`;
  }
  function directoryAssetSectionHtml(kind, state, category) {
    const items = directoryItems(kind).filter(item => !category || item.asset.group === category.group && item.asset.sub === category.sub);
    if (!items.length) return `${kind === "member" ? '<div class="mapp-count">전체 <b>0</b></div>' : ""}<p class="mapp-directory-empty">배정 중인 자산이 없습니다.</p>`;
    const cat = category && window.DATA.categories.find(c => c.group === category.group && c.sub === category.sub);
    return `<div class="mapp-directory-asset-tools"><span>전체 <b data-directory-count>${items.length}</b></span>
      <div class="mapp-directory-search"><input type="search" data-directory-search placeholder="품목명/고유관리번호" aria-label="자산 검색" value="${directoryEsc(state.directorySearch || "")}"><button type="button" data-directory-search-clear aria-label="검색어 지우기"${state.directorySearch ? "" : " hidden"}>×</button></div></div>
      <div class="mapp-directory-asset-list">${items.map(x => {
      const a = x.asset,
        status = STATUS_LABEL[a.status] || [a.status, ""];
      return `<button type="button" class="mapp-directory-asset-row" data-search="${directoryEsc(`${a.product} ${a.assetNo||''}`.toLowerCase())}" data-directory-asset="${directoryEsc(a.id)}"><span><strong>${directoryEsc(a.product)}</strong>${`<small>${directoryEsc(a.assetNo || "—")}</small>`}${kind === "member" ? `<small class="mapp-directory-asset-category">${directoryEsc(a.group)} › ${directoryEsc(a.sub)}</small>` : ""}</span><span class="badge ${status[1]}">${status[0]}</span><small>${x.since?x.since.replaceAll('-','.'):'—'}</small></button>`;
    }).join("")}</div>
      <p class="mapp-directory-empty" data-directory-search-empty hidden>결과가 없습니다.</p>`;
  }
  function directoryMemberRecentHtml(state){const items=directoryItems('member');return `<div class="mapp-count">전체 <b>${items.length}</b></div>${items.length?items.slice(0,5).map(x=>`<button class="mapp-directory-asset-row" data-directory-asset="${x.asset.id}"><span><strong>${directoryEsc(x.asset.product)}</strong><small>${directoryEsc(x.asset.assetNo)} · ${directoryEsc(x.asset.group)} › ${directoryEsc(x.asset.sub)}</small></span><span class="badge ${STATUS_LABEL[x.asset.status][1]}">${STATUS_LABEL[x.asset.status][0]}</span><small>${x.since?x.since.replaceAll('-','.'):'—'}</small></button>`).join('')+'<button class="btn" data-directory-member-viewall>전체 보기</button>':'<p class="mapp-directory-empty">배정 중인 자산이 없습니다.</p>'}`;}
  function directoryMemberAssetsScreenHtml(state){return `<div class="mapp-topbar"><button class="mapp-back" data-mapp-back aria-label="뒤로">←</button><span class="mapp-topbar-title">배정 자산</span></div><div class="mapp-body">${directoryAssetSectionHtml('member',state)}</div>`;}
  function directoryWorksiteSummaryHtml() {
    const items = directoryItems("worksite"),
      groups = /* @__PURE__ */new Map();
    return items.forEach(item => {
      const key = item.asset.group + "|" + item.asset.sub;
      groups.has(key) || groups.set(key, {
        group: item.asset.group,
        sub: item.asset.sub,
        count: 0
      }), groups.get(key).count++;
    }), `<div class="mapp-count">전체 <b>${items.length}</b></div>${items.length ? `<div class="mapp-ws-cat-tree">${[...groups.values()].map(category => `<button type="button" class="mapp-ws-cat-row" data-directory-sub-open data-group="${directoryEsc(category.group)}" data-sub="${directoryEsc(category.sub)}"><span>${directoryEsc(category.group)} <span class="mapp-cat-sep">›</span> ${directoryEsc(category.sub)}</span><span class="mapp-ws-cat-count">${category.count}<span class="mapp-menu-chev">›</span></span></button>`).join("")}</div>` : '<p class="mapp-directory-empty">배정 중인 자산이 없습니다.</p>'}`;
  }
  function directoryWorksiteAssetsScreenHtml(state) {
    const ws = DEMO_DIRECTORY_WORKSITE,
      category = state.directoryCategory;
    return `<div class="mapp-directory-page"><div class="mapp-topbar"><button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button></div>
      <div class="mapp-wsdetail-head"><div class="mapp-directory-context">${ws}</div><div class="mapp-wsdetail-sub">${directoryEsc(category.group)} <span class="mapp-cat-sep">›</span> ${directoryEsc(category.sub)}</div></div>
      <div class="mapp-directory-member-assets">${directoryAssetAvailable("worksite") ? directoryAssetSectionHtml("worksite", state, category) : '<p class="mapp-directory-empty">배정 중인 자산이 없습니다.</p>'}</div></div>`;
  }
  function directoryProfileScreenHtml(kind, state) {
    const member = kind === "member",
      name = directoryTarget(kind).value,
      info = MEMBERS.find(person => person.name === name) || {},
      taskVisible = directoryTaskVisible(kind);
    state.directoryTab === "work" && !taskVisible && (state.directoryTab = "info");
    const selected = state.directoryTab || (taskVisible ? "work" : "info"),
      tabs = member ? [["info", "정보"], ["attendance", "근태"], ["work", "업무"]] : [["attendance", "근무"], ["work", "업무"], ["info", "정보"]],
      asset = directoryAssetAvailable(kind),
      otherMenus = directoryTaskMenus(kind),
      assetCard=asset?`<section class="mapp-directory-task-card"><button class="mapp-directory-fold" data-directory-fold="asset" aria-expanded="true"><strong>자산</strong><span>⌃</span></button><div class="mapp-directory-fold-body">${member?directoryMemberRecentHtml(state):directoryWorksiteSummaryHtml()}</div></section>`:'',
      taskBody=otherMenus.map(([key,label])=>`<button class="mapp-directory-nav-card" data-directory-placeholder><span class="mapp-directory-task-icon ${key}">${directoryIcon(key)}</span><strong>${label}</strong></button>`).join(''),
      rows = member ? [["그룹", info.team], ["직무", "매니저"], ["직급", "Lv.3"], ["사번", info.empNo], ["휴대폰번호", info.phone]] : [["근무지 코드", WS_CODE[name]], ["주소", WS_ADDRESS[name]]];
    return `<div class="mapp-directory-page">
      ${member ? `<div class="mapp-topbar"><button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button><div class="mapp-directory-top-actions"><button type="button" data-directory-placeholder aria-label="검색"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></svg></button><button type="button" data-directory-placeholder aria-label="더보기">⋮</button></div></div>
        <header class="mapp-directory-member-header"><div class="mapp-directory-member-top"><span class="mapp-directory-avatar" style="background:${avatarColor(name)}">${name[0]}</span><div class="mapp-directory-contact"><button type="button" data-directory-placeholder aria-label="전화">☎</button><button type="button" data-directory-placeholder aria-label="채팅">${directoryIcon("board")}</button></div></div><h1>${name}</h1><p>${directoryEsc(info.team)}</p><span class="mapp-directory-working">● 근무 중 ›</span></header>` : `<div class="mapp-directory-site-hero"><div class="mapp-topbar"><button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button><div class="mapp-directory-top-actions"><button type="button" data-directory-placeholder aria-label="검색"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></svg></button></div></div><div class="mapp-directory-map" aria-label="근무지 위치"><svg viewBox="0 0 200 120" aria-hidden="true"><rect width="200" height="120" fill="#e6e9e6"/><path d="M-20 100 140 0M0 40l210 60M70 0l50 120M-10 100l220-90" stroke="#fff" stroke-width="12"/><path d="M100 30a16 16 0 0 0-16 16c0 16 16 29 16 29s16-13 16-29a16 16 0 0 0-16-16Z" fill="#333"/><circle cx="100" cy="46" r="8" fill="#e6e9e6"/></svg></div><div class="mapp-directory-site-photo">${directoryIcon("asset")}<span>${name}</span></div></div><header class="mapp-directory-site-header"><div class="mapp-directory-site-status"><span>활성 ›</span><span class="mapp-directory-favorite" aria-label="즐겨찾는 근무지">★</span></div><h1>${name}</h1><small>${WS_CODE[name] || "—"}</small><p>${WS_ADDRESS[name] || "주소 없음"}<button type="button" data-directory-address-copy aria-label="주소 복사">▣</button></p></header>`}
      <div class="mapp-directory-tabs" role="tablist" aria-label="${member ? "구성원" : "근무지"} 상세">${tabs.filter(([key]) => key !== "work" || taskVisible).map(([key, label]) => `<button type="button" role="tab" aria-selected="${selected === key}" class="${selected === key ? "active" : ""}" data-directory-tab="${key}">${label}</button>`).join("")}</div>
      <div class="mapp-directory-task-body">${selected === "work" ? taskBody : selected === "info" ? `<section class="mapp-directory-info"><h2>기본 정보</h2><dl>${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${directoryEsc(value || "—")}</dd></div>`).join("")}</dl></section>${assetCard}` : '<p class="mapp-directory-empty">근무 내역이 없습니다.</p>'}</div></div>`;
  }
  function wireDirectoryProfile(root, state, draw) {
    root.querySelectorAll("[data-directory-tab]").forEach(button => button.onclick = () => {
      state.directoryTab = button.dataset.directoryTab, draw();
    }), root.querySelectorAll("[data-directory-placeholder]").forEach(button => button.onclick = () => toast("이 기능은 프로토타입 범위 밖입니다.")), root.querySelectorAll("[data-directory-fold]").forEach(button => button.onclick = () => {
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded)), button.nextElementSibling.hidden = expanded, button.dataset.directoryFold === "asset" && (state.directoryAssetExpanded = !expanded);
    }), root.querySelectorAll("[data-directory-sub-open]").forEach(button => button.onclick = () => {
      directoryAssetAvailable("worksite") && (state.directoryScroll = root.querySelector(".mapp-screen").scrollTop, state.directoryCategory = {
        group: button.dataset.group,
        sub: button.dataset.sub
      }, state.directorySearch = "", state.screen = "directory-worksite-assets", draw());
    });
    const copy = root.querySelector("[data-directory-address-copy]");
    copy && (copy.onclick = async () => {
      try {
        await navigator.clipboard.writeText(WS_ADDRESS[DEMO_DIRECTORY_WORKSITE]), toast("주소가 복사되었습니다.");
      } catch {
        toast("주소를 복사하지 못했습니다.");
      }
    });
    const search = root.querySelector("[data-directory-search]");
    root.querySelectorAll('[data-directory-member-viewall]').forEach(button=>button.onclick=()=>{state.screen='directory-member-assets';state.directorySearch='';draw();});
    if (!search) return;
    const clear = root.querySelector("[data-directory-search-clear]");
    let shown=20,lastQuery=null;
    const sentinel=document.createElement("div");sentinel.style.height="1px";search.closest(".mapp-directory-member-assets, .mapp-body")?.appendChild(sentinel);
    function filter(){state.directorySearch=search.value;const q=search.value.trim().toLowerCase();if(q!==lastQuery){shown=20;lastQuery=q;}const rows=[...root.querySelectorAll('[data-directory-asset]')],matched=rows.filter(row=>!q||(row.dataset.search||'').includes(q));rows.forEach(row=>row.hidden=true);matched.slice(0,shown).forEach(row=>row.hidden=false);const count=root.querySelector('[data-directory-count]');if(count)count.textContent=matched.length;const empty=root.querySelector('[data-directory-search-empty]');if(empty)empty.hidden=matched.length>0;clear.hidden=!search.value;sentinel.hidden=shown>=matched.length;}
    new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)&&!sentinel.hidden){shown+=20;filter();}},{root:root.querySelector(".mapp-screen")}).observe(sentinel);
    search.addEventListener("input", filter), clear.onclick = () => {
      search.value = "", filter(), search.focus();
    }, filter();
  }
  function wireDirectoryMenu(root, state, draw) {
    root.querySelectorAll("[data-menu-fold]").forEach(button => button.onclick = () => {
      const kind = button.dataset.menuFold,
        expanded = !state.menuExpanded[kind];
      state.menuExpanded[kind] = expanded, button.setAttribute("aria-expanded", String(expanded)), root.querySelector(`#mapp-menu-${kind}-list`).hidden = !expanded;
    }), root.querySelectorAll("[data-directory-open]").forEach(button => button.onclick = () => {
      state.menuScroll = root.querySelector(".mapp-screen").scrollTop, state.screen = button.dataset.directoryOpen === "member" ? "member-profile" : "worksite-profile", state.directoryTab = "info", state.directoryAssetExpanded = !0, state.directorySearch = "", state.directoryScroll = 0, draw();
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
        ${canConfigureFeatures() ? '<button type="button" class="mapp-menu-row mapp-menu-link" data-mapp-goto="plan-features"><span class="mapp-menu-ic">🔌</span>요금제 및 기능</button>' : ""}
        <div class="mapp-menu-divider"></div>
        <div class="mapp-menu-row muted"><span class="mapp-menu-ic">🎧</span>고객 센터</div>
        <div class="mapp-menu-footer">Powered by <b>shopl</b></div>
      </div>`;
  }
  function tabBarHtml(active) {
    return `<div class="mapp-tabbar">${[{
      key: "home",
      ic: "⌂",
      label: "홈"
    }, {
      key: "approval",
      ic: "☑",
      label: "승인",
      dot: !0
    }, {
      key: "menu",
      ic: "☰",
      label: "메뉴"
    }].map(t => `<button type="button" class="mapp-tab${t.key === active ? " active" : ""}" data-mapp-tab="${t.key}">
        <span class="mapp-tab-ic">${t.ic}${t.dot ? '<span class="mapp-dot-badge"></span>' : ""}</span>${t.label}
      </button>`).join("")}</div>`;
  }
  function assetsScreenHtml(state) {
    const groups = categoryTree();
    return `
      <div class="mapp-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        <span class="mapp-topbar-title">자산</span>
      </div>
      <div class="mapp-body">
        ${groups.length ? groups.map(g => `
          <button type="button" class="mapp-menu-cap mapp-tree-group-head" data-tree-collapse data-tree-group="${esc(g.group)}" aria-expanded="${!state.collapsedGroups.has(g.group)}" aria-label="접기/펼치기">
            <span>${g.group}</span>${CHEV_DOWN}
          </button>
          <div class="mapp-ws-cat-tree" data-tree-collapsible ${state.collapsedGroups.has(g.group) ? "hidden" : ""}>${g.subs.length ? g.subs.map(sub => `
            <button type="button" class="mapp-ws-cat-row" data-sub-open data-sub="${sub}">
              <span>${sub}</span>
              <span class="mapp-ws-cat-count">${countForSub(sub)}<span class="mapp-menu-chev">›</span></span>
            </button>`).join("") : '<p class="mapp-ws-empty">소분류 없음</p>'}</div>`).join("") : '<p class="mapp-ws-empty">조회 가능한 자산이 없습니다.</p>'}
      </div>
      ${addFabHtml()}`;
  }
  // 소분류 상세의 상태 필터 칩은 제공하지 않는다. 상태는 필터 팝업에서만 고른다(2026-10-29 사용자 결정).
  function matchesStatus(a, type, statusFilter) {
    return statusFilter === "all" ? !0 : a.status === statusFilter;
  }
  function subDetailScreenHtml(sub, statusFilter, popupFilters) {
    const cat = window.DATA.categories.find(c => c.sub === sub) || {},
      type = cat.type || "individual",
      searchPlaceholder = "품목명/고유관리번호",
      subItems = collectLeaderItems().filter(x => x.asset.sub === sub),
      filterGroups = MappAssetFilter.config(cat, "leader"),
      popupActive = MappAssetFilter.count(popupFilters) > 0,
      items = sortItems(subItems.filter(x => popupActive ? MappAssetFilter.matches(x.asset, popupFilters) : matchesStatus(x.asset, type, statusFilter))),
      emptyMsg = subItems.length ? "결과가 없습니다." : "등록된 자산이 없습니다.";
    return `
      <div class="mapp-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        <span class="mapp-topbar-title mapp-category-title"><small>${esc(cat.group||'')}</small>${esc(sub)}</span>
        ${subItems.length ? MappAssetFilter.buttonHtml(popupFilters) : ""}
      </div>
      <div class="mapp-body">
        ${subItems.length ? `<div class="mapp-search"><input type="text" data-mapp-search placeholder="${searchPlaceholder}"></div>` : ""}
        ${MappAssetFilter.appliedHtml(popupFilters, filterGroups)}
        <div class="mapp-count">전체 <b data-leader-result-count>${items.length}</b></div>
        ${items.length ? `<div class="mapp-card-list">${items.map(x => assetCardHtml(x)).join("")}</div><p class="mapp-ws-empty" data-mapp-empty hidden>결과가 없습니다.</p>` : `<p class="mapp-ws-empty" data-mapp-empty>${emptyMsg}</p>`}
      </div>
      ${addFabHtml()}`;
  }
  function canManage(a) {
    if (!a || a.status === "disposed" || !hasViewPermission(a)) return !1;
    if (hasAssetManagePermission()) return !0;
    const cat = window.DATA.categories.find(c => c.group === a.group && c.sub === a.sub);
    switch (cat && cat.assign) {
      case "회사의 모든 구성원":
      case "모든 관리자 및 리더":
        return !0;
      case "특정 관리자/리더":
        return (cat.assignTarget && cat.assignTarget.members || []).includes(ME);
      case "특정 그룹 및 직무/직급":
        return window.matchesAssetGroupPositionTarget(cat.assignTarget, MEMBER_TEAM[ME], window.ASSET_MEMBER_JOB_TITLES[ME]);
      default:
        return !1;
    }
  }
  function derivedActiveStatus(a) {
    return (a.assignments || []).length ? "assigned" : "stock";
  }
  function categoryPath(a) {
    return `${esc(a.group)} › ${esc(a.sub)}`;
  }
  function editDraftFor(a) {
    return {
      ...emptyAddDraft({
        group: a.group,
        sub: a.sub
      }),
      editingId: a.id,
      extraValues:{...(a.extraValues||{})},
      product: a.product,
      assetNo: a.assetNo || "",
      photos: window.assetPhotos(a).map(p => ({
        ...p
      })),
      primaryPhoto: a._primary || 0,
      expiry: (a.expiry || "").replaceAll("-", "."),
      labels: [...(a.labels || [])],
      serial: a.serial || "",
      imei: a.imei || "",
      manufactured: (a.manufactured || "").slice(0, 7),
      purchaseDate: (a.purchaseDate || "").slice(0, 7),
      purchasePrice: a.price == null ? "" : formatAddPrice(String(a.price)),
      note: a.note || ""
    };
  }
  function draftSnapshot(draft) {
    return JSON.stringify({
      extraValues:draft.extraValues||{},
      category: draft.category,
      product: draft.product.trim(),
      assetNo: draft.assetNo.trim(),
      photos: draft.photos,
      primaryPhoto: draft.primaryPhoto,
      expiry: parseAddExpiry(draft.expiry) ?? draft.expiry.trim(),
      labels: [...draft.labels].sort(),
      serial: draft.serial.trim(),
      imei: draft.imei.trim(),
      manufactured: draft.manufactured,
      purchaseDate: draft.purchaseDate,
      purchasePrice: window.normalizePurchasePrice(draft.purchasePrice),
      note: draft.note.trim()
    });
  }
  function editDirty(draft) {
    return !draft.editingId || draftSnapshot(draft) !== draftSnapshot(editDraftFor(assets.find(a => a.id === draft.editingId)));
  }
  function applyAssetEdit(a, draft) {
    activityLog(a);
    const cat = addCategory(draft),
      pending = [],
      set = (key, value, script, format = v => v || "") => {
        (key === "price" ? window.normalizePurchasePrice(a[key]) === window.normalizePurchasePrice(value) : (a[key] ?? "") === (value ?? "")) || (pending.push({
          script: `자산 정보 수정: ${script}`,
          before: format(a[key]),
          after: format(value)
        }), a[key] = value);
      };
    (a.group !== cat.group || a.sub !== cat.sub) && (pending.push({
      script: "자산 정보 수정: 소분류 이동",
      before: `${a.group} › ${a.sub}`,
      after: `${cat.group} › ${cat.sub}`
    }), a.group = cat.group, a.sub = cat.sub), set("product", draft.product.trim(), "품목명 수정"), set("assetNo", draft.assetNo.trim(), "고유관리번호 수정"), JSON.stringify(a.labels || []) !== JSON.stringify(draft.labels) && (pending.push({
      script: "자산 정보 수정: 태그 수정",
      before: (a.labels || []).join(", "),
      after: draft.labels.join(", ")
    }), a.labels = [...draft.labels]);
    window.AssetExtra.applyCustom(a,draft.extraValues||{},e=>logActivity(a,e));
    const expiry = parseAddExpiry(draft.expiry);
    window.AssetExtra.visible(cat,"expiry",hasAssetManagePermission()) && expiry !== null && set("expiry", expiry || void 0, "유효기한 변경", v => v ? window.fmtDate(v) : "");
    for (const [key, script] of [["manufactured", "제조연월 변경"], ["purchaseDate", "구매연월 변경"]]) window.AssetExtra.visible(cat,key,hasAssetManagePermission()) && (a[key] || "").slice(0, 7) !== draft[key] && set(key, draft[key] ? `${draft[key]}-01` : void 0, script, v => v ? window.fmtMonth(v) : "");
    window.AssetExtra.visible(cat,"purchasePrice",hasAssetManagePermission()) && set("price", window.normalizePurchasePrice(draft.purchasePrice) || void 0, "구매가격 변경", v => v == null ? "" : window.formatPrice(v)), set("note", draft.note.trim() || void 0, "메모 수정"), pending.push(...window.assetPhotoActivities(window.assetPhotos(a), a._primary || 0, draft.photos, draft.primaryPhoto)), window.logAssetActivities(pending, e => logActivity(a, e)), a._photos = draft.photos.map(p => ({
      ...p
    })), a._primary = draft.primaryPhoto, a.photo = draft.photos[draft.primaryPhoto]?.color || null, a.photoCount = draft.photos.length;
  }
  const WS_CODE = {
      강남점: "GN-01",
      판교점: "PG-01",
      본사: "HQ-01",
      역삼점: "YS-01"
    },
    WS_ADDRESS = {
      강남점: "서울특별시 강남구 테헤란로 129",
      판교점: "경기도 성남시 분당구 판교역로 235",
      본사: "서울특별시 중구 을지로 100",
      역삼점: "서울특별시 강남구 역삼로 180"
    },
    MY_WORKSITES = {
      // 역삼점은 조회 가능한 자산이 하나도 없는 근무지 빈 상태 테스트용(2026-09-30) — 이 근무지의 유일한
      // 자산(A026)이 조회 권한 "모든 관리자 및 리더"인 모니터라 전 구성원 기준 항상 필터링됨
      김민수: {
        fixed: "본사",
        assigned: ["강남점", "판교점", "역삼점"]
      },
      정우성: {
        fixed: "강남점",
        assigned: ["본사"]
      }
    };
  function myWorksites(name) {
    return MY_WORKSITES[name] || {
      fixed: "본사",
      assigned: []
    };
  }
  const MEMBERS = [{
      name: "김민수",
      team: "개발팀",
      empNo: "2021001",
      phone: "010-2001-1234"
    }, {
      name: "이서연",
      team: "디자인팀",
      empNo: "2021015",
      phone: "010-3412-5678"
    }, {
      name: "박지훈",
      team: "영업팀",
      empNo: "2020032",
      phone: "010-8823-9910"
    }, {
      name: "정우성",
      team: "CS팀",
      empNo: "2022041",
      phone: "010-5567-2231"
    }, {
      name: "김철수",
      team: "운영팀",
      empNo: "2019008",
      phone: "010-9012-4456"
    }, {
      name: "최유진",
      team: "개발팀",
      empNo: "2023019",
      phone: "010-6634-8821"
    }, {
      name: "한소희",
      team: "디자인팀",
      empNo: "2022055",
      phone: "010-4478-2093"
    }, {
      name: "장민호",
      team: "국내영업",
      empNo: "2020018",
      phone: "010-2345-6712"
    }, {
      name: "오세훈",
      team: "운영팀",
      empNo: "2018014",
      phone: "010-7712-3345"
    }, {
      name: "배수지",
      team: "CS팀",
      empNo: "2021028",
      phone: "010-3356-7789"
    }, {
      name: "윤재현",
      team: "해외영업",
      empNo: "2019033",
      phone: "010-4467-8890"
    }, {
      name: "임하늘",
      team: "개발팀",
      empNo: "2022009",
      phone: "010-5578-9901"
    }],
    IC_EDIT = '<svg viewBox="0 0 24 24"><path d="M4 20l1-4L16 5l3 3L8 19l-4 1z"/><path d="M13.5 6.5l4 4"/></svg>',
    IC_EMP = '<svg class="hi" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5"/></svg>',
    IC_WS = '<svg class="hi" viewBox="0 0 24 24"><path d="M4 20V9.5L12 4l8 5.5V20"/><path d="M9.5 20v-5h5v5"/></svg>',
    INFO_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8v.01"/></svg>',
    CLOSE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    AVATAR_COLORS = ["#5b8def", "#8f6ef0", "#eb7f8b", "#3fb37f", "#e0a63c", "#4dabf7"];
  function avatarColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
  }
  function assignIdentity(x) {
    return x.employee ? `<span class="acard-avatar" style="background:${avatarColor(x.employee)}">${x.employee[0]}</span>
        <div><div class="acard-name">${x.employee}</div><div class="acard-sub">${MEMBER_TEAM[x.employee] || '<span class="muted">—</span>'}</div></div>` : `<span class="acard-avatar ws"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20V9.5L12 4l8 5.5V20"/><path d="M9.5 20v-5h5v5"/></svg></span>
      <div><div class="acard-name">${x.worksite}</div><div class="acard-sub">${WS_CODE[x.worksite] || '<span class="muted">—</span>'}</div></div>`;
  }
  const typeBadge = x => `<span class="acard-type" title="${x.employee ? "구성원" : "근무지"}">${x.employee ? IC_EMP : IC_WS}</span>`;
  function expiryBadge(d) {
    if (!d) return '<span class="muted">—</span>';
    const days = Math.ceil((new Date(d) - TODAY) / 864e5),
      [t, c] = days < 0 ? ["만료", "exp-over"] : days <= 7 ? ["만료 예정", "exp-soon"] : ["유효", "exp-valid"];
    return `${window.fmtDate(d)} <span class="badge ${c}">${t}</span>`;
  }
  function confirmModal(title, body, onOk, danger) {
    const cb = document.createElement("div");
    cb.className = "modal-back", cb.style.zIndex = 340, cb.innerHTML = `
      <div class="modal" style="width:360px">
        <div class="body" style="padding-top:20px">
          <p style="font-size:14px;font-weight:700;margin-bottom:6px">${title}</p>
          ${body ? `<p class="hint" style="margin-top:0">${body}</p>` : ""}
        </div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn ${danger ? "danger" : "primary"}" data-cok>확인</button>
        </div>
      </div>`, cb.querySelector("[data-cclose]").onclick = () => cb.remove(), cb.querySelector("[data-cok]").onclick = () => {
      cb.remove(), onOk();
    }, document.body.appendChild(cb);
  }
  function openStatusChangeConfirm(a, title, body, apply, onDone, danger, successMessage) {
    confirmModal(title, body, () => {
      apply(), toast(successMessage || "상태가 변경되었습니다."), onDone();
    }, danger);
  }
  const WARN_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 9v4M12 16.5h.01M10.3 3.9 2.5 17.5a1.7 1.7 0 0 0 1.47 2.55h16.06a1.7 1.7 0 0 0 1.47-2.55L13.7 3.9a1.7 1.7 0 0 0-2.94 0z"/></svg>';
  function openDisposeConfirmModal(a, onDone) {
    const cb = document.createElement("div");
    cb.className = "modal-back", cb.style.zIndex = 340, cb.innerHTML = `
      <div class="modal" style="width:380px">
        <h3>폐기 처리하시겠습니까?</h3>
        <div class="body">
          <div class="danger-note">${WARN_ICON}<span>기존 배정은 자동으로 종료되며, 이후 배정 추가·자산 수정이 제한됩니다. 자산 관리 권한자는 배정이 없는 배정 가능 상태로 복구할 수 있습니다.</span></div>
          <div class="field" style="margin-top:14px;margin-bottom:0">
            <input type="text" data-del-input placeholder="입력">
          </div>
          <p class="muted" style="margin-top:6px">박스에 DELETE를 입력하면 [확인] 버튼이 활성화됩니다.</p>
        </div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn danger" data-cok disabled>확인</button>
        </div>
      </div>`, cb.querySelector("[data-cclose]").onclick = () => cb.remove();
    const input = cb.querySelector("[data-del-input]"),
      okBtn = cb.querySelector("[data-cok]"),
      confirmed = () => input.value.trim().toUpperCase() === "DELETE";
    input.addEventListener("input", () => {
      okBtn.disabled = !confirmed();
    }), okBtn.onclick = () => {
      if (!confirmed()) return;
      if(!window.hasPrototypeAssetManagePermission()){cb.remove();toast("자산 관리 권한이 없습니다.");return;}
      const before = STATUS_LABEL[a.status][0];
      a.status = "disposed", a.assignments = [], logActivity(a, {
        script: "상태 변경: 폐기 처리",
        before,
        after: STATUS_LABEL[a.status][0]
      }), cb.remove(), toast("폐기 처리되었습니다."), onDone();
    }, document.body.appendChild(cb), input.focus();
  }
  function activityOf(a) {
    const ev = [{
      d: `${a.createdAt || a.purchaseDate || "2024-01-01"} 09:00`,
      script: "자산 등록",
      who: "dana"
    }];
    return (a.assignments || []).forEach(x => ev.push({
      d: `${x.since} 09:00`,
      script: "배정 관리: 신규 배정",
      target: {
        ...x
      },
      before: "",
      after: window.fmtDate(x.since),
      who: "dana"
    })), a.status === "repair" && ev.push({
      d: "2026-08-14 09:00",
      script: "상태 변경: 수리/점검 접수",
      before: "배정 중",
      after: "수리/점검 중",
      who: "dana"
    }), a.status === "lost" && ev.push({
      d: "2026-07-21 09:00",
      script: "상태 변경: 분실 신고",
      before: "배정 중",
      after: "분실",
      who: "정우성"
    }), a.status === "disposed" && ev.push({
      d: "2025-12-30 09:00",
      script: "상태 변경: 폐기 처리",
      before: "배정 중",
      after: "폐기",
      who: "dana"
    }), a.note && ev.push({
      d: "2026-06-02 09:00",
      script: "자산 정보 수정: 메모 수정",
      before: "",
      after: a.note,
      who: "dana"
    }), ev.sort((x, y) => x.d < y.d ? 1 : -1);
  }
  function activityLog(a) {
    return a._activityLog || (a._activityLog = activityOf(a)), a._activityLog;
  }
  function nowStr() {
    const p = n => String(n).padStart(2, "0"),
      real = /* @__PURE__ */new Date();
    return `${todayStr()} ${p(real.getHours())}:${p(real.getMinutes())}`;
  }
  function logActivity(a, entry) {
    activityLog(a).unshift({
      d: nowStr(),
      who: ME,
      ...entry,
      ...(entry.target ? {
        target: {
          ...entry.target
        }
      } : {})
    });
  }
  function historyCardHtml(e) {
    const val = v => esc(v || "없음"),
      targetName = e.target ? e.target.employee || e.target.worksite : null,
      targetMark = e.target ? e.target.employee ? `<span class="hval-avatar" style="background:${avatarColor(e.target.employee)}">${e.target.employee[0]}</span>` : IC_WS : "",
      withTarget = v => e.photoValue ? window.assetPhotoThumbsHtml(v) : e.script === "자산 정보 수정: 메모 수정" ? v ? window.AssetMemo.render(v) : "없음" : targetName && v ? `${targetMark}${esc(targetName)} · ${val(v)}` : val(v);
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
  function timelineHtml(a, query) {
    const q = (query || "").trim().toLowerCase(),
      entries = activityLog(a).filter(e => window.AssetExtra.historyVisible(a,e)).filter(e => q ? (e.target && (e.target.employee || e.target.worksite) || "").toLowerCase().includes(q) : !0);
    return entries.length ? `<div class="dtimeline">${entries.map(historyCardHtml).join("")}</div>` : '<p class="muted" style="padding:6px 0">일치하는 이력이 없습니다</p>';
  }
  function historyScreenHtml(a) {
    return `
      <div class="mapp-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        <span class="mapp-topbar-title">자산 이력</span>
      </div>
      <div class="mapp-body">

        <div data-history-list>${timelineHtml(a, "")}</div>
      </div>`;
  }
  function openMemberPickerPage(initial, onApply, exclude) {
    let query = "";
    const excludeNames = [].concat(exclude || []).filter(Boolean),
      p = mappOverlay("mapp-fullpage-back", 105);
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
      const q = query.trim().toLowerCase(),
        filtered = MEMBERS.filter(m => !excludeNames.includes(m.name) && (!q || m.name.includes(q) || m.empNo.includes(q) || m.phone.includes(q)));
      list.innerHTML = filtered.length ? filtered.map(m => `
        <button type="button" class="picker-member-row" data-pick="${m.name}">
          <span class="picker-avatar" style="background:${avatarColor(m.name)}">${m.name[0]}</span>
          <span class="picker-member-info"><b>${m.name}</b><span>${m.team}</span></span>
        </button>`).join("") : '<p class="muted" style="padding:16px 4px">결과가 없습니다.</p>', list.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => {
        p.remove(), onApply(b.dataset.pick);
      });
    }
    p.querySelector(".picker-search").addEventListener("input", e => {
      query = e.target.value, renderList();
    }), renderList(), p.querySelector("[data-picker-close]").onclick = () => p.remove();
  }
  function openWorksitePickerPage(initial, onApply, exclude) {
    let query = "";
    const excludeNames = [].concat(exclude || []).filter(Boolean),
      p = mappOverlay("mapp-fullpage-back", 105);
    p.innerHTML = `
      <div class="mapp-fullpage-head">
        <span class="mapp-fullpage-head-title">근무지</span>
        <button type="button" class="mapp-fullpage-head-close" data-picker-close aria-label="닫기">${CLOSE_ICON}</button>
      </div>
      <div class="mapp-fullpage-body">
        <input type="text" class="picker-search" placeholder="근무지명/코드/주소">
        <div data-list></div>
      </div>`;
    const list = p.querySelector("[data-list]"),
      fixedName = myWorksites(ME).fixed;
    function rowHtml(name) {
      const code = WS_CODE[name] ? `(${WS_CODE[name]})` : "";
      return `
        <button type="button" class="mapp-picker-ws-row" data-pick="${name}">
          <div class="mapp-picker-ws-name">${name}${code}</div>
          <div class="mapp-picker-ws-address">${WS_ADDRESS[name] || ""}</div>
        </button>`;
    }
    function renderList() {
      const q = query.trim().toLowerCase(),
        matches = name => !q || name.toLowerCase().includes(q) || (WS_CODE[name] || "").toLowerCase().includes(q) || (WS_ADDRESS[name] || "").toLowerCase().includes(q),
        rest = Object.keys(WS_CODE).filter(name => name !== fixedName && !excludeNames.includes(name) && matches(name)).sort((x, y) => x.localeCompare(y, "ko")),
        showFixed = fixedName && !excludeNames.includes(fixedName) && matches(fixedName);
      list.innerHTML = showFixed || rest.length ? (showFixed ? `<div class="mapp-picker-section"><span class="mapp-picker-dot"></span>내 고정 근무지</div>${rowHtml(fixedName)}` : "") + rest.map(rowHtml).join("") : '<p class="muted" style="padding:16px 4px">결과가 없습니다.</p>', list.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => {
        p.remove(), onApply(b.dataset.pick);
      });
    }
    p.querySelector(".picker-search").addEventListener("input", e => {
      query = e.target.value, renderList();
    }), renderList(), p.querySelector("[data-picker-close]").onclick = () => p.remove();
  }
  function openDateSheet(initialIso, maxIso, onApply, options = {}) {
    const [by, bm] = (initialIso || maxIso || todayStr()).split("-").map(Number);
    let viewY = by,
      viewM = bm - 1,
      selected = initialIso || maxIso || "",
      yearMode = !1,
      yearStart = by - 3;
    const maxY = maxIso ? Number(maxIso.slice(0, 4)) : 1 / 0,
      back = mappOverlay("mapp-sheet-back", 110);
    back.innerHTML = `
      <div class="mapp-sheet">
        ${options.reset && initialIso ? '<div class="mapp-add-month-reset"><button type="button" data-cal-reset>초기화</button></div>' : ""}
        <div class="mapp-sheet-body" data-cal-body style="padding-top:16px"></div>
        <div class="mapp-sheet-foot">
          <button type="button" class="btn" data-cal-cancel>취소</button>
          <button type="button" class="btn primary" data-cal-ok>확인</button>
        </div>
      </div>`;
    const body = back.querySelector("[data-cal-body]"),
      okBtn = back.querySelector("[data-cal-ok]"),
      WD = ["일", "월", "화", "수", "목", "금", "토"],
      pad = n => String(n).padStart(2, "0"),
      isoOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
    function drawYears() {
      body.innerHTML = `
        <div class="mapp-cal-head">
          <button type="button" data-year-prev aria-label="이전 연도 목록">‹</button>
          <span class="mapp-cal-ym">${yearStart} - ${yearStart + 11}</span>
          <button type="button" data-year-next aria-label="다음 연도 목록"${yearStart + 12 > maxY ? " disabled" : ""}>›</button>
        </div>
        <div class="mapp-add-month-grid mapp-cal-year-grid">${Array.from({
        length: 12
      }, (_, i) => yearStart + i).map(y => `<button type="button" data-cal-year="${y}" class="${y === viewY ? "sel" : ""}"${y > maxY ? " disabled" : ""}><span>${y}</span></button>`).join("")}</div>`, body.querySelector("[data-year-prev]").onclick = () => {
        yearStart -= 12, drawYears();
      }, body.querySelector("[data-year-next]").onclick = () => {
        yearStart + 12 <= maxY && (yearStart += 12, drawYears());
      }, body.querySelectorAll("[data-cal-year]").forEach(b => b.onclick = () => {
        viewY = Number(b.dataset.calYear), yearMode = !1, drawCal();
      });
    }
    function drawCal() {
      if (yearMode) return drawYears();
      const startDow = new Date(viewY, viewM, 1).getDay(),
        daysInMonth = new Date(viewY, viewM + 1, 0).getDate(),
        cells = Array(startDow).fill(null).concat(Array.from({
          length: daysInMonth
        }, (_, i) => i + 1)),
        rows = [];
      for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
      body.innerHTML = `
        <div class="mapp-cal-head">
          <button type="button" data-cal-prev aria-label="이전 달">‹</button>
          <button type="button" class="mapp-cal-ym" data-cal-ym aria-label="연도 선택">${viewY}.${pad(viewM + 1)}</button>
          <button type="button" data-cal-next aria-label="다음 달">›</button>
          <button type="button" class="mapp-cal-today" data-cal-today>오늘</button>
        </div>
        <div class="mapp-cal-wd">${WD.map(w => `<span>${w}</span>`).join("")}</div>
        <div class="mapp-cal-grid">${rows.map(row => row.map(d => {
        if (d === null) return '<span class="mapp-cal-cell empty"></span>';
        const iso = isoOf(viewY, viewM, d),
          cls = ["mapp-cal-cell"];
        return iso === selected ? cls.push("sel") : iso === todayStr() && cls.push("today"), `<button type="button" class="${cls.join(" ")}" data-cal-day="${iso}"${maxIso && iso > maxIso ? " disabled" : ""}>${d}</button>`;
      }).join("")).join("")}</div>
        <div class="mapp-cal-sel">${selected ? window.fmtDate(selected) : ""}</div>`, body.querySelector("[data-cal-ym]").onclick = () => {
        yearMode = !0, yearStart = viewY - 3, drawCal();
      }, body.querySelector("[data-cal-prev]").onclick = () => {
        viewM--, viewM < 0 && (viewM = 11, viewY--), drawCal();
      }, body.querySelector("[data-cal-next]").onclick = () => {
        viewM++, viewM > 11 && (viewM = 0, viewY++), drawCal();
      }, body.querySelector("[data-cal-today]").onclick = () => {
        const [ty, tm] = todayStr().split("-").map(Number);
        viewY = ty, viewM = tm - 1, selected = todayStr(), drawCal();
      }, body.querySelectorAll("[data-cal-day]").forEach(b => b.onclick = () => {
        selected = b.dataset.calDay, drawCal();
      }), okBtn.disabled = !selected;
    }
    drawCal(), back.querySelector("[data-cal-cancel]").onclick = () => back.remove();
    const calReset = back.querySelector("[data-cal-reset]");
    calReset && (calReset.onclick = () => {
      back.remove(), onApply("");
    }), okBtn.onclick = () => {
      selected && (back.remove(), onApply(selected));
    };
  }
  const FORM_CFG = {
    "assign-add": {
      title: "배정 추가",
      targetLabel: "배정 대상",
      confirm: "배정을 추가하시겠습니까?"
    },
    reassign: {
      title: "재배정",
      targetLabel: "새 배정 대상",
      confirm: "재배정하시겠습니까?"
    }
  };
  function openFormPage(a, target, kind, afterMutate) {
    const cfg = FORM_CFG[kind],
      f = {
        picked: null,
        draft: {
          employee: null,
          worksite: null
        },
        dateIso: "",
        qtyText: ""
      },
      old = kind === "reassign" ? a.assignments[target.index] : null,
      back = mappOverlay("mapp-fullpage-back", 95);
    back.innerHTML = `
      <div class="mapp-fullpage-head">
        <button type="button" class="mapp-back" data-form-back aria-label="뒤로">←</button>
        <span class="mapp-fullpage-head-title">${cfg.title}</span>
      </div>
      <div class="mapp-fullpage-body" data-form-body></div>
      <div class="mapp-fullpage-foot">
        <button type="button" class="btn primary" data-form-save disabled>저장</button>
      </div>`;
    const body = back.querySelector("[data-form-body]"),
      saveBtn = back.querySelector("[data-form-save]"),
      targetSummaryHtml = k => {
        const val = f.draft[k];
        return val ? `
        <div class="aa-target-selected" data-target-open>
          ${k === "employee" ? `<span class="picker-avatar sm" style="background:${avatarColor(val)}">${val[0]}</span>` : ""}<span class="perm-chip">${val}</span>
          <button type="button" class="aa-target-x" data-target-clear aria-label="선택 해제">${CLOSE_ICON}</button>
        </div>` : '<button type="button" class="perm-target-btn" data-target-open><span class="muted">선택</span><span class="chev">›</span></button>';
      },
      dateSummaryHtml = () => f.dateIso ? `
        <div class="aa-target-selected" data-date-open>
          <span class="perm-chip">${window.fmtDate(f.dateIso)}</span>
          <button type="button" class="aa-target-x" data-date-clear aria-label="선택 해제">${CLOSE_ICON}</button>
        </div>` : '<button type="button" class="perm-target-btn" data-date-open><span class="muted">선택</span><span class="chev">›</span></button>',
      updateSaveState = () => {
        const hasTarget = !!(f.picked && f.draft[f.picked]);
        saveBtn.disabled = !(hasTarget && f.dateIso);
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
        ${`
          <div class="field">
            <label>${kind === "reassign" ? "새 배정일" : "배정일"}</label>
            <div class="mapp-date-wrap">${dateSummaryHtml()}</div>
          </div>`}`, body.querySelectorAll('input[name="form-kind"]').forEach(r => r.onchange = () => {
        f.picked = r.value, drawBody();
      });
      const openBtn = body.querySelector("[data-target-open]");
      openBtn && (openBtn.onclick = () => {
        const exclude = kind === "reassign" ? f.picked === "employee" ? old.employee : old.worksite : null;
        f.picked === "employee" ? openMemberPickerPage(f.draft.employee, v => {
          f.draft.employee = v, drawBody();
        }, exclude) : openWorksitePickerPage(f.draft.worksite, v => {
          f.draft.worksite = v, drawBody();
        }, exclude);
      });
      const clearBtn = body.querySelector("[data-target-clear]");
      clearBtn && (clearBtn.onclick = e => {
        e.stopPropagation(), f.draft[f.picked] = null, drawBody();
      });
      const dateOpenBtn = body.querySelector("[data-date-open]");
      dateOpenBtn && (dateOpenBtn.onclick = () => openDateSheet(f.dateIso, todayStr(), v => {
        f.dateIso = v, drawBody();
      }));
      const dateClearBtn = body.querySelector("[data-date-clear]");
      updateSaveState();
    }
    drawBody();
    const requestClose = () => {
      f.picked || Object.values(f.draft).some(Boolean) || f.dateIso || f.qtyText ? confirmAddExit(() => back.remove()) : back.remove();
    };
    back.querySelector("[data-form-back]").onclick = requestClose, saveBtn.onclick = () => {
      if (saveBtn.disabled) return;
      const who = f.draft[f.picked],
        mk = extra => f.picked === "employee" ? {
          employee: who,
          worksite: null,
          ...extra
        } : {
          employee: null,
          worksite: who,
          ...extra
        };
      if (kind === "assign-add") {
        const d = f.dateIso,
          record = mk({
            since: d
          });
        confirmModal(cfg.confirm, "", () => {
          back.remove(), (a.assignments || (a.assignments = [])).push(record), a.status === "stock" && (a.status = "assigned"), logActivity(a, {
            script: "배정 관리: 신규 배정",
            target: record,
            before: "",
            after: window.fmtDate(d)
          }), toast("추가되었습니다."), afterMutate();
        });
      } else if (kind === "reassign") {
        const d = f.dateIso,
          record = mk({
            since: d
          });
        confirmModal(cfg.confirm, "", () => {
          back.remove();
          const idx = target.index,
            beforeLabel = `${old.employee || old.worksite} · ${window.fmtDate(old.since)}`,
            afterLabel = `${record.employee || record.worksite} · ${window.fmtDate(d)}`;
          a.assignments[idx] = record, logActivity(a, {
            script: "배정 관리: 재배정",
            before: beforeLabel,
            after: afterLabel
          }), toast("재배정되었습니다."), afterMutate();
        });
      }
    };
  }
  function openReturnConfirm(a, idx, onDone) {
    confirmModal("반납 처리하시겠습니까?", "반납하면 배정에서 제거됩니다.", () => {
      const old = a.assignments[idx];
      a.assignments.splice(idx, 1), (a.status === "assigned" || a.status === "stock") && (a.status = derivedActiveStatus(a)), logActivity(a, {
        script: "배정 관리: 반납",
        target: old,
        before: window.fmtDate(old.since),
        after: ""
      }), toast("반납되었습니다."), onDone();
    });
  }
  function openPhotoManageModal(a, onDone) {
    const photos = window.assetPhotos(a).map(p => ({
      ...p
    }));
    let primaryIdx = a._primary || 0;
    const snapshot = () => JSON.stringify({
        photos,
        primaryIdx
      }),
      initialSnapshot = snapshot(),
      back = document.createElement("div");
    back.className = "modal-back", back.innerHTML = `
      <div class="modal mapp-photo-modal" style="width:360px">
        <div class="body" style="padding-top:20px">
          <p style="font-size:14px;font-weight:700;margin-bottom:14px">자산 사진</p>
          <div class="areg-photo-row" data-photo-row></div>
        </div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn primary" data-cok disabled>저장</button>
        </div>
      </div>`, document.body.appendChild(back);
    const row = back.querySelector("[data-photo-row]"),
      saveBtn = back.querySelector("[data-cok]"),
      syncSaveState = () => {
        saveBtn.disabled = snapshot() === initialSnapshot;
      };
    function renderPhotos() {
      syncSaveState();
      const tiles = photos.map((p, i) => `
        <button type="button" class="areg-photo-tile${i === primaryIdx ? " primary" : ""}" data-photo-i="${i}" style="background:${p.color}" aria-label="사진 ${i + 1}${i === primaryIdx ? " (대표)" : ""}">
          ${i === primaryIdx ? '<span class="areg-photo-star">★</span>' : ""}
          <span class="areg-photo-del" data-photo-del="${i}" aria-label="삭제">${CLOSE_ICON_SM}</span>
        </button>`).join(""),
        addTile = '<button type="button" class="areg-photo-add" data-photo-add aria-label="사진 추가">+</button>';
      row.innerHTML = tiles + addTile, row.querySelectorAll("[data-photo-i]").forEach(b => b.onclick = e => {
        if (e.target.closest("[data-photo-del]")) return;
        const i = +b.dataset.photoI;
        i !== primaryIdx && (primaryIdx = i, renderPhotos());
      }), row.querySelectorAll("[data-photo-del]").forEach(b => b.onclick = e => {
        e.stopPropagation();
        const i = +b.dataset.photoDel;
        photos.splice(i, 1), !photos.length || primaryIdx === i ? primaryIdx = 0 : primaryIdx > i && (primaryIdx -= 1), renderPhotos();
      });
      const addBtn = row.querySelector("[data-photo-add]");
      addBtn && (addBtn.onclick = () => {
        if (photos.length >= window.ASSET_PHOTO_MAX_COUNT) {
          toast("자산 1개당 사진은 최대 10장까지 첨부할 수 있습니다.");
          return;
        }
        openDropdownMenu(addBtn, [{
          key: "camera",
          label: "카메라로 촬영하기"
        }, {
          key: "gallery",
          label: "갤러리에서 불러오기"
        }], () => {
          photos.push({
            id: window.assetPhotoId(),
            color: PHOTO_COLORS[photos.length % PHOTO_COLORS.length],
            at: `${todayStr()} 00:00`,
            by: ME
          }), photos.length === 1 && (primaryIdx = 0), renderPhotos();
        });
      });
    }
    renderPhotos(), back.querySelector("[data-cclose]").onclick = () => back.remove(), saveBtn.onclick = () => {
      saveBtn.disabled || (back.remove(), window.logAssetActivities(window.assetPhotoActivities(window.assetPhotos(a), a._primary || 0, photos, primaryIdx), e => logActivity(a, e)), a._photos = photos, a._primary = primaryIdx, toast("저장되었습니다."), onDone());
    };
  }
  function openMemoEditModal(a, onDone) {
    const before = window.AssetMemo.normalize(a.note || "");
    window.AssetMemo.open({
      value: before,
      mobile: !0,
      back: mappOverlay("asset-memo-mobile", 90),
      onSave: after => {
        a.note = after, a._noteFormat = "html", logActivity(a, {
          script: "자산 정보 수정: 메모 수정",
          before: before || "",
          after: after || ""
        }), toast("저장되었습니다."), onDone();
      }
    });
  }
  const IC_DOWNLOAD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/></svg>';
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
    const img = back.querySelector(".mapp-viewer-img"),
      countEl = back.querySelector(".mapp-viewer-count"),
      prevBtn = back.querySelector("[data-vprev]"),
      nextBtn = back.querySelector("[data-vnext]");
    function draw() {
      img.style.background = items[cur].color, countEl.textContent = `${cur + 1}/${items.length}`, prevBtn.hidden = nextBtn.hidden = items.length < 2;
    }
    prevBtn.onclick = () => {
      cur = (cur - 1 + items.length) % items.length, draw();
    }, nextBtn.onclick = () => {
      cur = (cur + 1) % items.length, draw();
    }, back.querySelector("[data-vclose]").onclick = () => back.remove(), back.querySelector("[data-vdownload]").onclick = () => toast("사진을 저장하였습니다."), draw();
  }
  const STATUS_TRANSITIONS = {
    // 배정 가능 상태에서는 배정 추가와 같은 동작을 '배정'으로 바로 제공한다(2026-10-29 사용자 결정).
    stock: [["assign-add", "배정"], ["repair-start", "수리/점검 접수"], ["lost-report", "분실 신고"], ["dispose", "폐기 처리"]],
    assigned: [["repair-start", "수리/점검 접수"], ["lost-report", "분실 신고"], ["dispose", "폐기 처리"]],
    repair: [["repair-done", "수리/점검 완료"], ["lost-report", "분실 신고"], ["dispose", "폐기 처리"]],
    lost: [["lost-recover", "분실 회수"], ["dispose", "폐기 처리"]],
    disposed: []
  };
  function statusActions(a) {
    return window.canRestoreDisposedAsset(a) ? [{
      key: "dispose-restore",
      label: "폐기 복구"
    }] : canManage(a) ? STATUS_TRANSITIONS[a.status].filter(([key]) => key !== "dispose" || window.hasPrototypeAssetManagePermission()).map(([key, label]) => ({
      key,
      label,
      danger: key === "dispose"
    })) : [];
  }
  function qrSampleSvg() {
    const mods = [],
      finder = (ox, oy) => {
        for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) (x === 0 || x === 6 || y === 0 || y === 6 || x >= 2 && x <= 4 && y >= 2 && y <= 4) && mods.push([ox + x, oy + y]);
      };
    finder(0, 0), finder(14, 0), finder(0, 14);
    let seed = 42;
    const rand = () => (seed = seed * 1103515245 + 12345 & 2147483647, seed / 2147483647);
    for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) !(x < 8 && y < 8 || x >= 13 && y < 8 || x < 8 && y >= 13) && rand() > 0.55 && mods.push([x, y]);
    return `<svg viewBox="0 0 84 84" fill="#1b1d1f"><rect width="84" height="84" fill="#fff"/>${mods.map(([x, y]) => `<rect x="${x * 4}" y="${y * 4}" width="4" height="4"/>`).join("")}</svg>`;
  }
  function openDropdownMenu(anchor, items, onPick) {
    document.querySelectorAll(".dropdown-menu").forEach(m => m.remove());
    const menu = document.createElement("div");
    menu.className = "dropdown-menu", menu.setAttribute("role", "menu"), menu.innerHTML = items.map(x => `${x.sep ? '<div class="dropdown-sep"></div>' : ""}<button type="button" role="menuitem" data-key="${x.key}"${x.danger ? ' class="danger"' : ""}>${x.label}</button>`).join("");
    const r = anchor.getBoundingClientRect();
    menu.style.cssText = `position:fixed;left:${Math.max(8, r.right - 180)}px;min-width:180px`, document.body.appendChild(menu);
    const height = menu.getBoundingClientRect().height;
    menu.style.top = `${r.bottom + height + 4 > window.innerHeight ? Math.max(8, r.top - height - 4) : r.bottom + 4}px`, anchor.setAttribute("aria-expanded", "true");
    const close = () => {
        menu.remove(), anchor.setAttribute("aria-expanded", "false"), document.removeEventListener("click", outside), document.removeEventListener("keydown", keydown);
      },
      outside = e => {
        !menu.contains(e.target) && !anchor.contains(e.target) && close();
      },
      buttons = [...menu.querySelectorAll("button")],
      keydown = e => {
        if (e.key === "Escape" && (e.preventDefault(), close(), anchor.focus({
          preventScroll: !0
        })), ["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
          e.preventDefault();
          const i = buttons.indexOf(document.activeElement);
          buttons[e.key === "Home" ? 0 : e.key === "End" ? buttons.length - 1 : (i + (e.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length].focus({
            preventScroll: !0
          });
        }
      };
    buttons.forEach(b => b.onclick = () => {
      close(), onPick(b.dataset.key);
    }), buttons[0]?.focus({
      preventScroll: !0
    }), document.addEventListener("click", outside), document.addEventListener("keydown", keydown);
  }
  const QR_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM19 14h2v2h-2zM14 19h2v2h-2zM19 19h2v2h-2z"/></svg>',
    MORE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>';
  function findRecord(a, target) {
    const list = a.assignments || [],
      idx = list.findIndex(record => record[target.type] === target.value);
    return {
      list,
      idx
    };
  }
  function scopedParties(a, target) {
    return (a.assignments || []).filter(record => record[target.type] !== target.value).sort((p, q) => q.since.localeCompare(p.since));
  }
  function scopedPartyRowHtml(record, indiv) {
    return `<div class="mapp-party-row"><div><div class="mapp-party-name">${esc(record.employee || record.worksite)}</div><div class="mapp-party-kind">${record.employee ? "구성원" : "근무지"}</div></div>${`<span class="mapp-party-date">${window.fmtDate(record.since)}</span>`}</div>`;
  }
  function scopedPartiesScreenHtml(a, target) {
    const others = scopedParties(a, target);
    return `<div class="mapp-topbar"><button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button><span class="mapp-topbar-title">공동 배정 대상</span></div><div class="mapp-body"><div class="mapp-count">전체 <b>${others.length}</b></div><div class="mapp-party-list">${others.map(record => scopedPartyRowHtml(record, !0)).join("")}</div></div>`;
  }
  function scopedPartySectionHtml(a, target) {
    const others = scopedParties(a, target);
    return `<div class="dsection"><div class="mapp-party-header"><h2 class="mapp-party-head">공동 배정 대상</h2>${canManage(a) ? '<button type="button" class="btn sm" data-holder-add>배정 추가</button>' : ""}</div><div class="mapp-count">전체 <b>${others.length}</b></div>${others.length ? `<div class="mapp-party-list">${others.slice(0, 5).map(record => scopedPartyRowHtml(record, !0)).join("")}</div>` : '<p class="mapp-party-empty">공동 배정 대상이 없습니다.</p>'}${others.length > 5 ? '<button type="button" class="mapp-party-viewall" data-parties-viewall>전체보기</button>' : ""}</div>`;
  }
  function scopedManageActions(a, target) {
    return !target || !canManage(a) || findRecord(a, target).idx < 0 ? [] : [{
      key: "date",
      label: "배정일 수정",
      sep: !0
    }, {
      key: "reassign",
      label: "재배정"
    }, {
      key: "return",
      label: "반납",
      danger: !0
    }];
  }
  function leaderAssetDetailHtml(a,target=null) {
 activityLog(a);
 const editable=canManage(a), manage=hasAssetManagePermission(), photos=window.assetPhotos(a), record=target?findRecord(a,target):null, current=record&&record.idx>=0?record.list[record.idx]:null;
 const badge=statusActions(a).length?`<button class="badge ${STATUS_LABEL[a.status][1]} clickable" data-status-open>${STATUS_LABEL[a.status][0]} ▾</button>`:`<span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>`;
 const info=[['분류',categoryPath(a)],['태그',(a.labels||[]).map(l=>`<span class="tag">${esc(l)}</span>`).join('')||'—'],['자산 등록일',window.fmtDate(a.createdAt)],['QR 라벨',`<button type="button" class="btn sm icon-only" data-qr-open aria-label="QR 라벨">${QR_ICON}</button>`],['메모',`${window.AssetMemo.render(a.note)}${editable?`<button class="icon-edit" data-memoedit aria-label="메모 수정">${IC_EDIT}</button>`:''}`]].map(([k,v])=>`<div><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');
 const assignments=target?scopedPartySectionHtml(a,target):`<div class="dsection"><div class="mapp-leader-holders-head"><h2>배정 현황</h2>${editable?'<button class="btn sm" data-holder-add>배정 추가</button>':''}</div><div class="mapp-count">전체 <b>${(a.assignments||[]).length}</b></div><div data-holder-list></div></div>`;
 return `<div class="mapp-topbar"><button class="mapp-back" data-mapp-back aria-label="뒤로">←</button>${manage&&!target?`<button class="mapp-more" data-more-open aria-label="더보기">${MORE_ICON}</button>`:''}</div><div class="mapp-body mapp-leader-detail-body">${target?`<div class="mapp-directory-context">${esc(target.value)}</div>`:''}<div class="dhead-id"><div class="mapp-hero-wrap"><button class="mapp-hero-img" data-hero-viewer aria-label="사진 보기"${photos.length?'':' disabled'}>${cardThumb(a)}</button>${photos.length>1?`<span class="mapp-hero-count">+${photos.length-1}</span>`:''}${editable?`<button class="mapp-hero-edit" data-hero-edit aria-label="사진 관리">${IC_EDIT}</button>`:''}</div><div><h1>${esc(a.product)}</h1><div class="dhead-sub">${badge}<div>고유관리번호 <b>${esc(a.assetNo)}</b></div>${current?`<div>배정일 ${window.fmtDate(current.since)}</div>`:''}</div></div></div>${window.AssetExtra.tabs()}<div data-detail-panel="assignment">${assignments}</div><div data-detail-panel="info" hidden><div class="kv2">${info}${window.AssetExtra.detailRows(a,manage,expiryBadge)}</div></div><div data-detail-panel="history" hidden>${timelineHtml(a,'')}</div></div>`;
}
  function leaderHolderList(a, query, kind, requestedPage) {
    const q = (query || "").trim().toLowerCase(),
      rows = (a.assignments || []).map((x, idx) => ({
        x,
        idx
      })).filter(({
        x
      }) => {
        if (!q) return !0;
        if (kind === "worksite") return x.worksite && (x.worksite.toLowerCase().includes(q) || (WS_CODE[x.worksite] || "").toLowerCase().includes(q));
        const member = MEMBERS.find(m => m.name === x.employee);
        return x.employee && (x.employee.toLowerCase().includes(q) || !!member && (member.empNo.includes(q) || member.phone.includes(q)));
      }).sort((p, r) => r.x.since.localeCompare(p.x.since)),
      pages = Math.max(1, Math.ceil(rows.length / 20)),
      page = Math.min(requestedPage, pages);
    return {
      page,
      html: rows.length ? `<div class="acard-list">${rows.slice(0, page * 20).map(({
        x,
        idx
      }) => `<div class="acard${canManage(a) ? " has-actions" : ""}">${typeBadge(x)}${canManage(a) ? `<button type="button" class="mapp-holder-more" data-holder-more data-index="${idx}" aria-label="${esc(x.employee || x.worksite)} 배정 관리" aria-haspopup="menu" aria-expanded="false">${MORE_ICON}</button>` : ""}<div class="acard-id">${assignIdentity(x)}</div><div class="acard-foot"><span class="acard-date">${`배정일 <b>${window.fmtDate(x.since)}</b>`}</span></div></div>`).join("")}</div>${page < pages ? '<div data-holder-sentinel style="height:1px"></div>' : ""}` : `<p class="muted">${q ? "결과가 없습니다." : "배정 대상이 없습니다."}</p>`
    };
  }
  function openLeaderQr(a) {
    const back = mappOverlay("mapp-sheet-back", 90);
    back.innerHTML = `<div class="mapp-sheet"><div class="mapp-sheet-head">QR 라벨</div><div class="mapp-sheet-body mapp-leader-qr-sheet"><div class="label-sheet"><div class="label-qr">${qrSampleSvg()}</div><div class="label-text"><div class="label-product">${esc(a.product)}</div>${a.assetNo ? `<div class="label-no">${esc(a.assetNo)}</div>` : ""}<div class="label-cat">${categoryPath(a)}</div></div></div></div><div class="mapp-sheet-foot"><button type="button" class="btn" data-qr-close>닫기</button><button type="button" class="btn primary" data-qr-download>다운로드</button></div></div>`, back.querySelector("[data-qr-close]").onclick = () => back.remove(), back.onclick = e => {
      e.target === back && back.remove();
    }, back.querySelector("[data-qr-download]").onclick = () => {
      const now = /* @__PURE__ */new Date(),
        pad = n => String(n).padStart(2, "0"),
        stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`,
        fileName = window.assetDownloadFileName(`QR_${a.assetNo}_${stamp}.png`);
      toast("사진을 저장하였습니다.");
    };
  }
  function openDeleteAssetModal(a, onDone) {
    const cb = document.createElement("div");
    cb.className = "modal-back", cb.style.zIndex = 340, cb.innerHTML = `
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
      </div>`, cb.querySelector("[data-cclose]").onclick = () => cb.remove();
    const input = cb.querySelector("[data-del-input]"),
      okBtn = cb.querySelector("[data-cok]"),
      confirmed = () => input.value.trim().toUpperCase() === "DELETE";
    input.addEventListener("input", () => {
      okBtn.disabled = !confirmed();
    }), okBtn.onclick = () => {
      confirmed() && (window.archiveDeletedAsset(a, ME), cb.remove(), onDone(), toast("삭제되었습니다."));
    }, document.body.appendChild(cb), input.focus();
  }
  function render() {
    const root = document.getElementById("app"),
      state = {
        screen: "menu",
        menuExpanded: {
          member: !1,
          worksite: !1
        },
        menuScroll: 0,
        sub: null,
        statusFilter: "all",
        popupFilters: MappAssetFilter.empty(),
        subSearch: "",
        addDraft: null,
        addOrigin: null,
        tagManageDraft: null,
        detailAssetId: null,
        listScroll: 0,
        holderQuery: "",
        holderCategory: "employee",
        holderPage: 1,
        collapsedGroups: /* @__PURE__ */new Set()
      };
    function draw() {
      ["plan-features", "asset-feature"].includes(state.screen) && !canConfigureFeatures() && (state.screen = "menu");
      const showTabBar = state.screen === "menu",
        screenHtml = state.screen === "menu" ? menuScreenHtml(state.menuExpanded) : state.screen === "member-profile" ? directoryProfileScreenHtml("member", state) : state.screen === "worksite-profile" ? directoryProfileScreenHtml("worksite", state) : state.screen === "directory-member-assets" ? directoryMemberAssetsScreenHtml(state) : state.screen === "directory-worksite-assets" ? directoryWorksiteAssetsScreenHtml(state) : state.screen === "plan-features" ? planFeaturesScreenHtml() : state.screen === "asset-feature" ? assetFeatureScreenHtml() : state.screen === "sub-detail" ? subDetailScreenHtml(state.sub, state.statusFilter, state.popupFilters) : state.screen === "asset-detail" ? leaderAssetDetailHtml(assets.find(a => a.id === state.detailAssetId), state.detailTarget) : state.screen === "asset-parties" ? scopedPartiesScreenHtml(assets.find(a => a.id === state.detailAssetId), state.detailTarget) : state.screen === "asset-history" ? historyScreenHtml(assets.find(a => a.id === state.detailAssetId)) : state.screen === "asset-add" ? assetAddScreenHtml(state.addDraft) : state.screen === "asset-add-category" ? assetAddCategoryScreenHtml(state.addDraft) : state.screen === "asset-add-tags" ? assetAddTagManageScreenHtml(state.tagManageDraft) : assetsScreenHtml(state);
      root.innerHTML = `
        <div class="mapp-stage">
          <div class="mapp-phone">
            <div class="mapp-statusbar"><span>9:41</span><span class="mapp-statusbar-icons">•••</span></div>
            <div class="mapp-screen">${screenHtml}</div>
            ${showTabBar ? tabBarHtml("menu") : ""}
          </div>
        </div>`, window.AssetExtra.bindDetailTabs(root), wireDirectoryMenu(root, state, draw), wireDirectoryProfile(root, state, draw), wirePlanFeatures(root, state, draw);
      const back = root.querySelector("[data-mapp-back]");
      back && (back.onclick = () => {
        if (state.screen === "directory-member-assets") {state.screen="member-profile";draw();return;}
        if (state.screen === "directory-worksite-assets") {
          state.screen = "worksite-profile", draw(), root.querySelector(".mapp-screen").scrollTop = state.directoryScroll || 0;
          return;
        }
        if (["member-profile", "worksite-profile"].includes(state.screen)) {
          state.screen = "menu", draw(), root.querySelector(".mapp-screen").scrollTop = state.menuScroll;
          return;
        }
        if (state.screen === "asset-feature") {
          state.screen = "plan-features", draw(), root.querySelector(".mapp-screen").scrollTop = state.featureListScroll || 0;
          return;
        }
        if (state.screen === "asset-add-category") state.screen = "asset-add";else if (state.screen === "asset-add") {
          const leave = () => {
            state.screen = state.addOrigin, state.addDraft = null, state.addOrigin = null, draw();
          };
          (state.addDraft.editingId ? editDirty(state.addDraft) : hasAddInput(state.addDraft)) ? confirmAddExit(leave, !!state.addDraft.editingId) : leave();
          return;
        } else if (["asset-history", "asset-parties"].includes(state.screen)) state.screen = "asset-detail";else if (state.screen === "asset-detail") {
          state.screen = state.directoryDetailFrom || "sub-detail", delete state.directoryDetailFrom, state.detailTarget = null, draw(), root.querySelector(".mapp-screen").scrollTop = state.listScroll;
          return;
        } else state.screen === "sub-detail" ? (state.screen = "assets", state.sub = null, state.statusFilter = "all", state.popupFilters = MappAssetFilter.empty(), state.subSearch = "") : state.screen = "menu";
        draw();
      });
      const gotoAssets = root.querySelector('[data-mapp-goto="assets"]');
      gotoAssets && (gotoAssets.onclick = () => {
        state.screen = "assets", draw();
      }), root.querySelectorAll("[data-mapp-tab]").forEach(b => b.onclick = () => {
        b.dataset.mappTab === "menu" && (state.screen = "menu", draw());
      }), root.querySelectorAll("[data-sub-open]").forEach(b => b.onclick = () => {
        state.screen = "sub-detail", state.sub = b.dataset.sub, state.statusFilter = "all", state.popupFilters = MappAssetFilter.empty(), state.subSearch = "", draw();
      }), root.querySelectorAll("[data-asset-add-open]").forEach(b => b.onclick = () => {
        if (!hasAssetManagePermission()) return;
        const currentCategory = state.screen === "sub-detail" && window.DATA.categories.find(c => c.sub === state.sub) || null;
        state.addOrigin = state.screen, state.addDraft = emptyAddDraft(currentCategory), state.screen = "asset-add", draw();
      }), root.querySelectorAll("[data-tree-collapse]").forEach(b => b.onclick = () => {
        const body = b.nextElementSibling,
          expanded = b.getAttribute("aria-expanded") === "true";
        b.setAttribute("aria-expanded", String(!expanded)), body.hidden = expanded, b.classList.toggle("collapsed", expanded), expanded ? state.collapsedGroups.add(b.dataset.treeGroup) : state.collapsedGroups.delete(b.dataset.treeGroup);
      });
      function applyPopup(filters) {
        state.popupFilters = filters, state.statusFilter = MappAssetFilter.count(filters) ? null : "all", draw();
      }
      MappAssetFilter.wireApplied(root, state.popupFilters, applyPopup);
      const filterBtn = root.querySelector("[data-mapp-filter-open]");
      filterBtn && (filterBtn.onclick = () => MappAssetFilter.open({
        category: window.DATA.categories.find(c => c.sub === state.sub) || {},
        mode: "leader",
        filters: state.popupFilters,
        onApply: applyPopup
      }));
      const searchInput = root.querySelector("[data-mapp-search]");
      if (searchInput) {
        const cards = [...root.querySelectorAll("[data-asset-card]")],
          emptyMsg = root.querySelector("[data-mapp-empty]");
        searchInput.value = state.subSearch;
        let searchObserver = null;
        const applySearch = () => {
          searchObserver?.disconnect(), state.subSearch = searchInput.value;
          const q = state.subSearch.trim().toLowerCase(),
            matching = cards.filter(card => {
              const asset = assets.find(a => a.id === card.dataset.assetId);
              return !q || `${asset?.product || ""} ${asset.assetNo || ""}`.toLowerCase().includes(q);
            }),
            visibleCount = matching.length;
          cards.forEach(card => card.hidden = !0);
          let shown = 0;
          const list = root.querySelector(".mapp-card-list");
          list?.querySelector("[data-list-sentinel]")?.remove();
          const sentinel = document.createElement("div");
          sentinel.dataset.listSentinel = "", sentinel.style.height = "1px";
          const reveal = () => {
              matching.slice(shown, shown + 20).forEach(c => c.hidden = !1), shown += 20, shown >= matching.length && (sentinel.remove(), observer.disconnect());
            },
            observer = searchObserver = new IntersectionObserver(entries => {
              entries.some(e => e.isIntersecting) && reveal();
            }, {
              root: root.querySelector(".mapp-screen")
            });
          reveal(), shown < matching.length && (list.append(sentinel), observer.observe(sentinel));
          const count = root.querySelector("[data-leader-result-count]");
          count && (count.textContent = visibleCount), emptyMsg && cards.length && (emptyMsg.hidden = visibleCount > 0);
        };
        searchInput.addEventListener("input", applySearch), applySearch();
      }
      if (root.querySelectorAll("[data-directory-asset]").forEach(row => row.onclick = () => {
        const kind = ["member-profile","directory-member-assets"].includes(state.screen) ? "member" : "worksite",
          a = assets.find(asset => asset.id === row.dataset.directoryAsset);
        !a || !directoryAssetAvailable(kind) || !directoryCanViewAsset(a, kind) || (state.detailTarget = directoryTarget(kind), state.directoryDetailFrom = state.screen, state.listScroll = root.querySelector(".mapp-screen").scrollTop, state.detailAssetId = a.id, state.screen = "asset-detail", state.holderQuery = "", state.holderCategory = "employee", state.holderPage = 1, draw());
      }), root.querySelectorAll("[data-asset-card]").forEach(card => {
        card.setAttribute("role", "button"), card.tabIndex = 0;
        const open = () => {
          const a = assets.find(x => x.id === card.dataset.assetId);
          !a || !hasViewPermission(a) || (state.listScroll = root.querySelector(".mapp-screen").scrollTop, delete state.directoryDetailFrom, state.detailTarget = null, state.detailAssetId = a.id, state.screen = "asset-detail", state.holderQuery = "", state.holderCategory = "employee", state.holderPage = 1, draw());
        };
        card.onclick = open, card.onkeydown = e => {
          (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open());
        };
      }), state.screen === "asset-detail") {
        let dispatchAction2 = function (key) {
            if (key === "history") {
              state.screen = "asset-history", draw();
              return;
            }
            if (key === "edit") {
              if (target || !hasAssetManagePermission() || a.status === "disposed") return;
              state.addOrigin = "asset-detail", state.addDraft = editDraftFor(a), state.screen = "asset-add", draw();
              return;
            }
            if (key === "delete") {
              if (target || !hasAssetManagePermission()) return;
              openDeleteAssetModal(a, () => {
                state.detailAssetId = null, state.screen = state.directoryDetailFrom || "sub-detail", delete state.directoryDetailFrom, state.detailTarget = null, draw();
              });
              return;
            }
            if (key === "dispose-restore") {
              window.openAssetRestoreConfirm(a, message => {
                afterMutate(), toast(message);
              }, ME);
              return;
            }
            if (!canManage(a)) return;
            if (target) {
              const idx = findRecord(a, target).idx;
              if (idx < 0) return;
              if (key === "return") {
                openReturnConfirm(a, idx, afterMutate);
                return;
              }
              if (key === "reassign") {
                openFormPage(a, {
                  index: idx
                }, "reassign", afterMutate);
                return;
              }
              if (key === "date") {
                const record = a.assignments[idx];
                openDateSheet(record.since, todayStr(), value => {
                  !value || value === record.since || confirmModal("배정일을 수정하시겠습니까?", "", () => {
                    const before = record.since;
                    record.since = value, logActivity(a, {
                      script: "배정 관리: 배정일 변경",
                      target: record,
                      before: window.fmtDate(before),
                      after: window.fmtDate(value)
                    }), afterMutate(), toast("배정일이 수정되었습니다.");
                  });
                });
                return;
              }
            }
            if (key === "assign-add") {
              (a.assignments || []).length >= 5 ? toast("활성 배정은 최대 5건까지 가능합니다.") : openFormPage(a, null, "assign-add", afterMutate);
              return;
            }
            if (!statusActions(a).some(action => action.key === key)) return;
            if (key === "dispose") {
              openDisposeConfirmModal(a, afterMutate);
              return;
            }
            const transitions = {
                "lost-report": ["분실 신고하시겠습니까?", "분실 신고 시 기존 배정은 유지된 채 상태만 분실로 변경됩니다.", "분실 신고", () => "lost"],
                "lost-recover": ["분실 회수 처리하시겠습니까?", "분실 회수 시 배정 여부에 따라 배정 중 또는 배정 가능 상태로 돌아갑니다.", "분실 회수", () => derivedActiveStatus(a)],
                "repair-start": ["수리/점검을 접수하시겠습니까?", "수리/점검을 접수하면 기존 배정은 유지되고 자산 상태가 수리/점검 중으로 변경됩니다.", "수리/점검 접수", () => "repair", "수리/점검이 접수되었습니다."],
                "repair-done": ["수리/점검을 완료하시겠습니까?", "수리/점검을 완료하면 현재 배정 여부에 따라 자산 상태가 배정 중 또는 배정 가능 상태로 변경됩니다.", "수리/점검 완료", () => derivedActiveStatus(a), "수리/점검이 완료되었습니다."]
              },
              [title, body, script, next, successMessage] = transitions[key];
            openStatusChangeConfirm(a, title, body, () => {
              const before = STATUS_LABEL[a.status][0];
              a.status = next(), logActivity(a, {
                script: `상태 변경: ${script}`,
                before,
                after: STATUS_LABEL[a.status][0]
              });
            }, afterMutate, !1, successMessage);
          },
          drawHolders2 = function () {
            const list = root.querySelector("[data-holder-list]");
            if (!list) return;
            const rendered = leaderHolderList(a, state.holderQuery, state.holderCategory, state.holderPage);
            state.holderPage = rendered.page, list.innerHTML = rendered.html, holderObserver?.disconnect();
            const sentinel = list.querySelector("[data-holder-sentinel]");
            sentinel && (holderObserver = new IntersectionObserver(entries => {
              entries.some(e => e.isIntersecting) && (state.holderPage++, drawHolders2());
            }, {
              root: root.querySelector(".mapp-screen")
            }), holderObserver.observe(sentinel)), list.querySelectorAll("[data-holder-page]").forEach(button => button.onclick = () => {
              state.holderPage += Number(button.dataset.holderPage), drawHolders2(), list.scrollIntoView({
                block: "nearest"
              });
            }), list.querySelectorAll("[data-holder-more]").forEach(button => button.onclick = () => {
              openDropdownMenu(button, [{
                key: "date",
                label: "배정일 수정"
              }, {
                key: "reassign",
                label: "재배정"
              }, {
                key: "return",
                label: "반납",
                danger: !0,
                sep: !0
              }], key => {
                if (!canManage(a)) return;
                const idx = Number(button.dataset.index);
                if (key === "return" && openReturnConfirm(a, idx, afterMutate), key === "reassign" && openFormPage(a, {
                  index: idx
                }, "reassign", afterMutate), key === "date") {
                  const record = a.assignments[idx];
                  openDateSheet(record.since, todayStr(), value => {
                    !value || value === record.since || confirmModal("배정일을 수정하시겠습니까?", "", () => {
                      const before = record.since;
                      record.since = value, logActivity(a, {
                        script: "배정 관리: 배정일 변경",
                        target: record,
                        before: window.fmtDate(before),
                        after: window.fmtDate(value)
                      }), afterMutate(), toast("배정일이 수정되었습니다.");
                    });
                  });
                }
              });
            });
          };
        var dispatchAction = dispatchAction2,
          drawHolders = drawHolders2;
        const a = assets.find(x => x.id === state.detailAssetId),
          target = state.detailTarget,
          afterMutate = () => {
            target && findRecord(a, target).idx < 0 ? (state.screen = state.directoryDetailFrom, delete state.directoryDetailFrom, state.detailTarget = null) : state.screen = "asset-detail", draw(), (state.screen === "member-profile" || state.screen === "directory-worksite-assets") && (root.querySelector(".mapp-screen").scrollTop = state.listScroll || 0);
          },
          status = root.querySelector("[data-status-open]");
        status && (status.onclick = () => openDropdownMenu(status, statusActions(a), dispatchAction2));
        const more = root.querySelector("[data-more-open]");
        more && (more.onclick = () => {
          const items = [];
          hasAssetManagePermission() && a.status !== "disposed" && items.push({
            key: "edit",
            label: "자산 수정",
            sep: !0
          }), hasAssetManagePermission() && items.push({
            key: "delete",
            label: "자산 삭제",
            danger: !0
          }), openDropdownMenu(more, items, dispatchAction2);
        }), root.querySelector("[data-hero-viewer]").onclick = () => openPhotoViewer(a);
        const photoEdit = root.querySelector("[data-hero-edit]");
        photoEdit && (photoEdit.onclick = () => {
          canManage(a) && openPhotoManageModal(a, afterMutate);
        });
        const memoEdit = root.querySelector("[data-memoedit]");
        memoEdit && (memoEdit.onclick = () => {
          canManage(a) && openMemoEditModal(a, afterMutate);
        }), root.querySelector("[data-qr-open]").onclick = () => openLeaderQr(a);
        const add = root.querySelector("[data-holder-add]");
        add && (add.onclick = () => dispatchAction2("assign-add"));
        const partiesViewAll = root.querySelector("[data-parties-viewall]");
        partiesViewAll && (partiesViewAll.onclick = () => {
          state.screen = "asset-parties", draw();
        });
        let holderObserver = null;
        const holderQuery = root.querySelector("[data-holder-query]"),
          holderCategory = root.querySelector("[data-holder-category]");
        drawHolders2();
      }
      if (state.screen === "asset-history") {
        const a = assets.find(x => x.id === state.detailAssetId),
          input = root.querySelector("[data-history-q]");
        input && (input.value = a._prototypeHistoryQuery || "", root.querySelector("[data-history-list]").innerHTML = timelineHtml(a, input.value), input.oninput = () => {
          a._prototypeHistoryQuery = input.value, root.querySelector("[data-history-list]").innerHTML = timelineHtml(a, input.value);
        });
      }
      if (state.screen === "asset-add") {
        let syncAddDraft2 = function () {
            draft.extraValues={...(draft.extraValues||{}),...window.AssetExtra.readInputs(root,'data-mobile-extra')};
            ["product", "assetNo", "expiry", "serial", "imei", "manufactured", "purchaseDate", "purchasePrice", "note"].forEach(key => {
              const input = field(key);
              input && (draft[key] = input.value);
            });
          },
          updateAddValidity2 = function () {
            syncAddDraft2();
            const cat = addCategory(draft);
            draft.nameDupKey && draft.nameDupKey !== `${draft.category}|${draft.product.trim()}` && (draft.nameDupKey = null);
            const nameDuplicate = !!draft.nameDupKey,
              nameInput = field("product");
            root.querySelector("[data-add-product-error]").hidden = !nameDuplicate, nameInput.classList.toggle("has-err", nameDuplicate), nameInput.setAttribute("aria-invalid", String(nameDuplicate)), draft.assetNoDupValue !== draft.assetNo.trim() && (draft.assetNoDupValue = null);
            const duplicate = cat && !0 && !!draft.assetNo.trim() && (draft.editingId ? assets.some(a => !a.deleted_at && a.id !== draft.editingId && a.assetNo === draft.assetNo.trim()) : !!draft.assetNoDupValue),
              error = root.querySelector("[data-add-error]");
            error && (error.hidden = !duplicate);
            const assetNoInput = field("assetNo");
            assetNoInput && assetNoInput.classList.toggle("has-err", duplicate);
            const expiryInput2 = field("expiry");
            if (expiryInput2) {
              const showError = draft.expiryTouched && parseAddExpiry(draft.expiry) === null;
              root.querySelector("[data-add-expiry-error]").hidden = !showError, expiryInput2.classList.toggle("has-err", showError), expiryInput2.setAttribute("aria-invalid", String(!!showError));
            }
            const save2 = root.querySelector("[data-add-save]");
            save2 && (save2.disabled = !addDraftValid(draft) || !editDirty(draft));
          },
          renderProductMenu2 = function () {
            const query = productInput.value.trim().toLowerCase(),
              options = query ? productNames.filter(name => name.toLowerCase().includes(query)) : productNames;
            productMenu.innerHTML = options.map(name => `<button type="button" data-add-product-pick="${esc(name)}">${esc(name)}</button>`).join(""), productMenu.hidden = !options.length, productMenu.querySelectorAll("[data-add-product-pick]").forEach(button => button.onclick = () => {
              productInput.value = button.dataset.addProductPick, draft.product = productInput.value, productMenu.hidden = !0, updateAddValidity2();
            });
          },
          renderSelectedTags2 = function () {
            !tagChips || !tagSearch || (tagChips.innerHTML = addTagChipsHtml(draft.labels), tagSearch.disabled = draft.labels.length >= window.ASSET_TAG_MAX_COUNT, tagSearch.placeholder = draft.labels.length ? "" : "검색", tagChips.querySelectorAll("[data-add-tag-remove]").forEach(button => button.onclick = () => {
              draft.labels = draft.labels.filter(tag => tag !== button.dataset.addTagRemove), renderSelectedTags2(), updateAddValidity2(), tagMenu.hidden = !0;
            }));
          },
          renderTagMenu2 = function () {
            if (!tagSearch || draft.labels.length >= window.ASSET_TAG_MAX_COUNT) {
              tagMenu && (tagMenu.hidden = !0);
              return;
            }
            const query = tagSearch.value.trim().toLowerCase(),
              options = (window.DATA.tags || []).filter(tag => !draft.labels.includes(tag) && (!query || tag.toLowerCase().includes(query)));
            tagMenu.innerHTML = options.length ? options.map(tag => `<button type="button" data-add-tag-pick="${esc(tag)}">${esc(tag)}</button>`).join("") : '<div class="mapp-add-suggest-empty">결과가 없습니다.</div>', tagMenu.hidden = !1, tagMenu.querySelectorAll("[data-add-tag-pick]").forEach(button => button.onclick = () => {
              draft.labels.length < window.ASSET_TAG_MAX_COUNT && draft.labels.push(button.dataset.addTagPick), tagSearch.value = "", tagMenu.hidden = !0, renderSelectedTags2(), updateAddValidity2();
            });
          };
        var syncAddDraft = syncAddDraft2,
          updateAddValidity = updateAddValidity2,
          renderProductMenu = renderProductMenu2,
          renderSelectedTags = renderSelectedTags2,
          renderTagMenu = renderTagMenu2;
        const draft = state.addDraft,
          field = key => root.querySelector(`[data-add-field="${key}"]`);
        root.querySelectorAll("[data-mobile-extra]").forEach(el=>el.addEventListener("input",updateAddValidity2));
        window.AssetMemo.mountTextarea(field("note")), root.querySelector("[data-add-category]").onclick = () => {
          syncAddDraft2(), state.screen = "asset-add-category", draw();
        };
        const aiInput = root.querySelector("[data-add-ai]");
        aiInput && (aiInput.onclick = () => {
          syncAddDraft2(), openMobileAiInput(draft, draw, () => {
            state.screen = "asset-add-category", draw();
          });
        });
        const priceInput = root.querySelector('[data-add-field="purchasePrice"]');
        priceInput && window.bindPurchasePriceInput(priceInput), root.querySelectorAll("[data-add-field]").forEach(input => input.addEventListener("input", () => {
          if (input.dataset.addField === "assetNo") {
            const pos = input.selectionStart,
              before = input.value;
            input.value = before.replace(/[^A-Za-z0-9\-_]/g, ""), input.value !== before && pos != null && input.setSelectionRange(Math.max(0, pos - 1), Math.max(0, pos - 1));
          }
          input.dataset.addField === "expiry" && (input.value = formatAddExpiry(input.value)), updateAddValidity2();
        }));
        const expiryInput = field("expiry");
        expiryInput && expiryInput.addEventListener("blur", () => {
          draft.expiryTouched = !0, updateAddValidity2();
        });
        const productInput = field("product"),
          productMenu = root.querySelector("[data-add-product-menu]"),
          currentCat = addCategory(draft),
          productNames = currentCat ? [...new Set(assets.filter(asset => asset.group === currentCat.group && asset.sub === currentCat.sub).map(asset => asset.product).filter(Boolean))] : [];
        productInput.addEventListener("focus", renderProductMenu2), productInput.addEventListener("input", renderProductMenu2), productInput.addEventListener("blur", () => setTimeout(() => {
          productMenu.hidden = !0;
        }, 120));
        const tagSearch = root.querySelector("[data-add-tag-search]"),
          tagMenu = root.querySelector("[data-add-tag-menu]"),
          tagChips = root.querySelector("[data-add-tag-chips]");
        tagSearch && (renderSelectedTags2(), tagSearch.addEventListener("focus", renderTagMenu2), tagSearch.addEventListener("input", renderTagMenu2), tagSearch.addEventListener("blur", () => setTimeout(() => {
          tagMenu.hidden = !0;
        }, 120)));
        const tagManage = root.querySelector("[data-add-tag-manage]");
        tagManage && (tagManage.onclick = () => {
          syncAddDraft2(), state.tagManageDraft = (window.DATA.tags || []).map(tag => ({
            name: tag,
            orig: tag
          })), state.screen = "asset-add-tags", draw();
        }), root.querySelectorAll("[data-add-date]").forEach(button => button.onclick = () => {
          syncAddDraft2();
          const key = button.dataset.addDate,
            apply = value => {
              draft[key] = key === "expiry" ? value.replaceAll("-", ".") : value, updateAddValidity2();
              const shown = value ? button.dataset.addDateMode === "month" ? value.replace("-", ".") : value.replaceAll("-", ".") : "선택";
              button.classList.toggle("selected", !!value), button.innerHTML = `<span>${shown}</span>${CAL_ICON}`;
            };
          key === "expiry" ? openDateSheet(parseAddExpiry(draft.expiry) || "", null, apply, {
            reset: !0
          }) : openAddMonthSheet(key === "manufactured" ? "제조연월" : "구매연월", draft[key], apply);
        }), root.querySelectorAll("[data-add-photo-primary]").forEach(button => button.onclick = () => {
          syncAddDraft2(), draft.primaryPhoto = +button.dataset.addPhotoPrimary, draw();
        }), root.querySelectorAll("[data-add-photo-delete]").forEach(button => button.onclick = () => {
          syncAddDraft2();
          const index = +button.dataset.addPhotoDelete;
          draft.photos.splice(index, 1), !draft.photos.length || draft.primaryPhoto === index ? draft.primaryPhoto = 0 : draft.primaryPhoto > index && (draft.primaryPhoto -= 1), draw();
        });
        const addPhoto = root.querySelector("[data-add-photo]");
        addPhoto && (addPhoto.onclick = () => {
          if (draft.photos.length >= window.ASSET_PHOTO_MAX_COUNT) {
            toast("자산 1개당 사진은 최대 10장까지 첨부할 수 있습니다.");
            return;
          }
          syncAddDraft2(), openAddDropdown(addPhoto, [{
            key: "camera",
            label: "카메라로 촬영하기"
          }, {
            key: "gallery",
            label: "갤러리에서 불러오기"
          }], () => {
            draft.photos.push({
              id: window.assetPhotoId(),
              color: PHOTO_COLORS[draft.photos.length % PHOTO_COLORS.length],
              at: `${todayStr()} 00:00`,
              by: ME
            }), draw();
          });
        });
        const save = root.querySelector("[data-add-save]");
        save && (save.onclick = () => {
          if (updateAddValidity2(), !addDraftValid(draft) || !editDirty(draft)) return;
          if (draft.editingId) {
            const asset2 = assets.find(a => a.id === draft.editingId),
              moved = asset2.group + "|" + asset2.sub !== draft.category;
            applyAssetEdit(asset2, draft), state.sub = asset2.sub, moved && state.detailTarget && (state.directoryCategory = {
              group: asset2.group,
              sub: asset2.sub
            }, state.directorySearch = ""), moved && (state.statusFilter = "all", state.popupFilters = MappAssetFilter.empty(), state.subSearch = "", state.listScroll = 0), state.addDraft = null, state.addOrigin = null, state.screen = "asset-detail", draw(), toast("저장되었습니다.");
            return;
          }
          const cat = addCategory(draft);
          let asset = {
            type: cat.type,
            assetNo: draft.assetNo.trim(),
            product: draft.product.trim(),
            group: cat.group,
            sub: cat.sub,
            status: "stock",
            labels: [...draft.labels],
            extraValues:{...(draft.extraValues||{})},
            assignments: []
          };
    const expiry = parseAddExpiry(draft.expiry);
          !(cat.hiddenFields || []).includes("expiry") && expiry && (asset.expiry = expiry), draft.manufactured && (asset.manufactured = `${draft.manufactured}-01`), draft.purchaseDate && (asset.purchaseDate = `${draft.purchaseDate}-01`), draft.purchasePrice && (asset.price = window.normalizePurchasePrice(draft.purchasePrice)), draft.note.trim() && (asset.note = draft.note.trim()), draft.photos.length && (asset._photos = draft.photos.map(p => ({
            ...p
          })), asset._primary = draft.primaryPhoto, asset.photo = draft.photos[draft.primaryPhoto].color, asset.photoCount = draft.photos.length);
          try {
            [asset] = window.AssetRegistration.registerBatch([asset], {
              who: ME
            });
          } catch (error) {
            error.code === "DUPLICATE_ASSET_NO" && (draft.assetNoDupValue = draft.assetNo.trim()), updateAddValidity2(), toast(error.code === "CATEGORY_CHANGED" ? "설정이 변경되었습니다. 잠시 후 다시 시도해주세요." : "입력 내용을 확인해주세요.");
            return;
          }
          state.screen = "sub-detail", state.sub = cat.sub, state.addDraft = null, state.addOrigin = null, state.statusFilter = "all", state.popupFilters = MappAssetFilter.empty(), state.subSearch = "", draw();
          const addedCard = root.querySelector(`[data-asset-id="${asset.id}"]`);
          addedCard && (addedCard.scrollIntoView({
            block: "nearest"
          }), addedCard.classList.add("mapp-card-added")), toast("자산이 추가되었습니다.");
        }), updateAddValidity2();
      }
      if (state.screen === "asset-add-category") {
        root.querySelector("[data-add-category-close]").onclick = () => {
          state.screen = "asset-add", draw();
        };
        const categorySearch = root.querySelector("[data-add-category-search]");
        categorySearch && categorySearch.addEventListener("input", () => {
          const q = categorySearch.value.trim().toLowerCase();
          let shown = 0;
          root.querySelectorAll("[data-add-category-group]").forEach(group => {
            const groupMatches = !q || group.dataset.groupName.toLowerCase().includes(q);
            let visible = 0;
            group.querySelectorAll("[data-add-category-pick]").forEach(row => {
              row.hidden = !(groupMatches || row.dataset.subName.toLowerCase().includes(q)), row.hidden || visible++;
            }), group.hidden = !visible, shown += visible;
          }), root.querySelector("[data-add-category-empty]").hidden = shown > 0;
        }), [...root.querySelectorAll("[data-add-category-pick]")].forEach(row => row.onclick = () => {
          const previous = state.addDraft,
            product = previous.product,
            category = addCategory({
              category: row.dataset.addCategoryPick
            });
          if (catViewPermission(category)) {
            if (previous.editingId) previous.category = row.dataset.addCategoryPick;else if (row.dataset.addCategoryPick !== previous.category) {
              const cache = previous._categoryDrafts || /* @__PURE__ */new Map();
              previous.category && cache.set(previous.category, copyCategoryDraft(previous)), state.addDraft = cache.has(row.dataset.addCategoryPick) ? copyCategoryDraft(cache.get(row.dataset.addCategoryPick)) : emptyAddDraft(category), state.addDraft.product = product, state.addDraft._categoryDrafts = cache, !previous.category && previous.photos.length && (state.addDraft.photos = previous.photos.map(p => ({
                ...p
              })), state.addDraft.primaryPhoto = previous.primaryPhoto), previous._pendingAiOnce && applyMobileAiDraft(state.addDraft, previous._pendingAiOnce, {
                replace: !0
              });
            }
            state.screen = "asset-add", draw();
          }
        });
      }
      if (state.screen === "asset-add-tags") {
        let duplicateNames2 = function () {
            const counts = {};
            return tagDraft.forEach(tag => {
              const name = normalizeTagName(tag.name);
              name && (counts[name] = (counts[name] || 0) + 1);
            }), new Set(Object.keys(counts).filter(name => counts[name] > 1));
          },
          tagManageDirty2 = function () {
            const next = [...new Set(tagDraft.map(tag => normalizeTagName(tag.name)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko")),
              before = [...master].sort((a, b) => a.localeCompare(b, "ko"));
            return next.length !== before.length || next.some((name, index) => name !== before[index]);
          },
          updateTagManageValidity2 = function () {
            const duplicates = duplicateNames2();
            list.querySelectorAll("[data-add-tag-rename]").forEach(input => {
              const name = normalizeTagName(input.value),
                invalid = !name || duplicates.has(name);
              input.classList.toggle("has-err", invalid), input.setAttribute("aria-invalid", String(invalid));
              let duplicateError = input.parentElement.querySelector("[data-tag-duplicate-error]");
              duplicateError || (duplicateError = document.createElement("p"), duplicateError.className = "field-err", duplicateError.dataset.tagDuplicateError = "", input.after(duplicateError)), duplicateError.textContent = "동일한 명칭이 존재합니다.", duplicateError.hidden = !duplicates.has(name), list.querySelector(`[data-add-tag-required="${input.dataset.addTagRename}"]`).hidden = !!name;
            }), listError.hidden = !0;
            const createName = normalizeTagName(createInput.value),
              createDuplicate = !!createName && tagDraft.some(tag => normalizeTagName(tag.name) === createName);
            createInput.classList.toggle("has-err", createDuplicate), createError.hidden = !createDuplicate, createButton.disabled = !createName || createDuplicate, saveButton.disabled = !tagManageDirty2() || !!duplicates.size || tagDraft.some(tag => !normalizeTagName(tag.name));
          },
          addManagedTag2 = function () {
            const name = normalizeTagName(createInput.value);
            if (!name || tagDraft.some(tag => normalizeTagName(tag.name) === name)) {
              updateTagManageValidity2();
              return;
            }
            tagDraft.unshift({
              name,
              orig: null
            }), draw();
          };
        var duplicateNames = duplicateNames2,
          tagManageDirty = tagManageDirty2,
          updateTagManageValidity = updateTagManageValidity2,
          addManagedTag = addManagedTag2;
        const tagDraft = state.tagManageDraft,
          master = window.DATA.tags || [],
          list = root.querySelector("[data-add-tag-manage-list]"),
          listError = root.querySelector("[data-add-tag-list-error]"),
          createInput = root.querySelector("[data-add-tag-create]"),
          createButton = root.querySelector("[data-add-tag-create-btn]"),
          createError = root.querySelector("[data-add-tag-create-error]"),
          saveButton = root.querySelector("[data-add-tag-manage-save]");
        bindTagNameInput(createInput, updateTagManageValidity2), createInput.addEventListener("keydown", event => {
          event.key === "Enter" && (event.preventDefault(), addManagedTag2());
        }), createButton.onclick = addManagedTag2, list.querySelectorAll("[data-add-tag-rename]").forEach(input => bindTagNameInput(input, () => {
          tagDraft[+input.dataset.addTagRename].name = input.value, updateTagManageValidity2();
        })), list.querySelectorAll("[data-add-tag-delete]").forEach(button => button.onclick = () => {
          tagDraft.splice(+button.dataset.addTagDelete, 1), draw();
        }), root.querySelector("[data-add-tag-manage-close]").onclick = () => {
          state.tagManageDraft = null, state.screen = "asset-add", draw();
        }, saveButton.onclick = () => {
          if (updateTagManageValidity2(), saveButton.disabled) return;
          const finalNames = [...new Set(tagDraft.map(tag => normalizeTagName(tag.name)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko")),
            remainingOriginals = new Set(tagDraft.filter(tag => tag.orig).map(tag => tag.orig)),
            deleted = master.filter(tag => !remainingOriginals.has(tag)),
            renamed = tagDraft.filter(tag => tag.orig && tag.orig !== normalizeTagName(tag.name)).map(tag => ({
              from: tag.orig,
              to: normalizeTagName(tag.name)
            })),
            updateLabels = labels => (labels || []).filter(label => !deleted.includes(label)).map(label => {
              const rename = renamed.find(item => item.from === label);
              return rename ? rename.to : label;
            }).filter((label, index, all) => finalNames.includes(label) && all.indexOf(label) === index);
          [...assets, ...(window.DATA.deletedAssets || [])].forEach(asset => {
            asset.labels = updateLabels(asset.labels);
          }), state.addDraft.labels = updateLabels(state.addDraft.labels), master.length = 0, master.push(...finalNames), state.tagManageDraft = null, state.screen = "asset-add", draw(), toast("저장되었습니다.");
        }, updateTagManageValidity2();
      }
    }
    window.addEventListener("storage", event => {
      ([ASSET_MGMT_FLAG_KEY, COMPANY_PLAN_KEY].includes(event.key) || event.key === null) && draw();
    }), draw();
  }
  window.LeaderScreen = {
    render
  };
})();
