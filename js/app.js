(function () {
  const esc=value=>window.AssetExtra.esc(value);
  const {
      assets
    } = window.DATA,
    DEMO_ASSUME_FEATURE_ADMIN = !0,
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
  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    const screen = document.querySelector(".mapp-screen"),
      r = screen ? screen.getBoundingClientRect() : null,
      pos = r ? `left:${r.left + r.width / 2}px;bottom:${window.innerHeight - r.bottom + 32}px;` : "left:50%;bottom:32px;";
    t.style.cssText = `position:fixed;${pos}transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300;max-width:280px;text-align:center`, document.body.appendChild(t), setTimeout(() => t.remove(), 1800);
  }
  const STATUS_LABEL = {
      stock: ["배정 가능", "stock"],
      assigned: ["배정 중", "assigned"],
      repair: ["수리/점검 중", "repair"],
      lost: ["분실", "lost"],
      disposed: ["폐기", "disposed"]
    },
    TODAY = /* @__PURE__ */new Date("2026-09-04");
  function todayStr() {
    const p = n => String(n).padStart(2, "0");
    return `${TODAY.getFullYear()}-${p(TODAY.getMonth() + 1)}-${p(TODAY.getDate())}`;
  }
  function expiryBadge(d) {
    if (!d) return '<span class="muted">—</span>';
    const days = Math.ceil((new Date(d) - TODAY) / 864e5),
      [t, c] = days < 0 ? ["만료", "exp-over"] : days <= 7 ? ["만료 예정", "exp-soon"] : ["유효", "exp-valid"];
    return `${window.fmtDate(d)} <span class="badge ${c}">${t}</span>`;
  }
  const chips = arr => arr && arr.length ? arr.map(l => `<span class="tag">${l}</span>`).join("") : '<span class="muted">—</span>',
    memoHtml = note => window.AssetMemo.render(note),
    ME = new URLSearchParams(location.search).get("me") || "김민수",
    WS_CODE = {
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
    MEMBER_TEAM = Object.fromEntries(MEMBERS.map(m => [m.name, m.team]));
  function catViewPermission(cat) { return window.AssetAccess.scope(cat,'view',ME); }
  function hasViewPermission(a) {
    return catViewPermission(window.DATA.categories.find(c => c.group === a.group && c.sub === a.sub));
  }
  const DEMO_ASSUME_PERMISSION = !0;
  function canManage(a) { return window.AssetAccess.canState(a,ME); }
  function canEditInfo(a) { return window.AssetAccess.canInfo(a,ME); }

  const IC_EDIT = '<svg viewBox="0 0 24 24"><path d="M4 20l1-4L16 5l3 3L8 19l-4 1z"/><path d="M13.5 6.5l4 4"/></svg>',
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
  const typeBadge = x => `<span class="acard-type" title="${x.employee ? "구성원" : "근무지"}">${x.employee ? IC_EMP : IC_WS}</span>`,
    IC_PERSON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5"/></svg>',
    IC_WORKSITE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20V9.5L12 4l8 5.5V20"/><path d="M9.5 20v-5h5v5"/></svg>';
  function collectMyItems(name) {
    const items = [];
    return assets.forEach(a => {
      (a.assignments || []).forEach(x => {
        x.employee === name && items.push({
          qty: 1,
          asset: a
        });
      });
    }), items;
  }
  const CATEGORY_ORDER = new Map(window.DATA.categories.map((c, i) => [c.sub, i]));
  function subOrder(sub) {
    return CATEGORY_ORDER.has(sub) ? CATEGORY_ORDER.get(sub) : 999;
  }
  function sortItems(items) {
    return [...items].sort((p, q) => {
      const bySub = subOrder(p.asset.sub) - subOrder(q.asset.sub);
      return bySub || p.asset.product.localeCompare(q.asset.product, "ko") || (p.asset.assetNo || "").localeCompare(q.asset.assetNo || "", "ko");
    });
  }
  function itemsForWorksite(ws, sub) {
    const items = [];
    return assets.forEach(a => {
      sub && a.sub !== sub || hasViewPermission(a) && (a.assignments || []).forEach(x => {
        x.worksite === ws && items.push({
          qty: 1,
          asset: a
        });
      });
    }), sortItems(items);
  }
  function groupItemsBySub(items) {
    const order = [],
      map = {};
    return items.forEach(x => {
      const s = x.asset.sub;
      map[s] || (map[s] = [], order.push(s)), map[s].push(x);
    }), order.map(sub => ({
      sub,
      group: map[sub][0].asset.group,
      items: map[sub]
    }));
  }
  function collectWorksiteGroups(name) {
    const {
        fixed,
        assigned
      } = myWorksites(name),
      assignedSorted = [...assigned].sort((a, b) => a.localeCompare(b, "ko"));
    return [{
      ws: fixed,
      label: "fixed"
    }, ...assignedSorted.map(ws => ({
      ws,
      label: "assigned"
    }))].map(({
      ws,
      label
    }) => ({
      worksite: ws,
      label,
      items: itemsForWorksite(ws)
    }));
  }
  const THUMB_EMPTY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-4 4 3 4-4 5 4"/></svg>';
  function cardThumb(a) {
    const photos = window.assetPhotos(a);
    return photos.length ? `<span class="mapp-thumb" style="background:${photos[a._primary || 0].color}"></span>` : `<span class="mapp-thumb empty">${THUMB_EMPTY}</span>`;
  }
  function cardThumbBtn(a) {
    return `<button type="button" class="mapp-card-thumb-btn" data-card-thumb data-asset-id="${a.id}" aria-label="사진 보기">${cardThumb(a)}</button>`;
  }
  function assetCardHtml(x) {
    const a = x.asset;
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
  function findRecord(a, target) {
    const list = a.assignments || (a.assignments = []),
      idx = list.findIndex(x => target.type === "employee" ? x.employee === target.value : x.worksite === target.value);
    return {
      list,
      idx
    };
  }
  function categoryPath(a) {
    return `${a.group} › ${a.sub}`;
  }
  function otherParties(a, target) {
    return (a.assignments || []).filter(x => !(target.type === "employee" ? x.employee === target.value : x.worksite === target.value)).sort((p, q) => p.since === q.since ? 0 : p.since < q.since ? 1 : -1);
  }
  function partyRowHtml(x, isIndiv) {
    const name = x.employee || x.worksite,
      kind = x.employee ? "구성원" : "근무지";
    return `
      <div class="mapp-party-row">
        <div><div class="mapp-party-name">${name}</div><div class="mapp-party-kind">${kind}</div></div>
        ${`<span class="mapp-party-date">${window.fmtDate(x.since)}</span>`}
      </div>`;
  }
  function derivedActiveStatus(a) {
    return (a.assignments || []).length > 0 ? "assigned" : "stock";
  }
  function assetTabsHtml(active) {
    const mineActive = active === "mine";
    return `
      <div class="mapp-seg-tabs">
        <button type="button" class="mapp-seg-tab${mineActive ? " active" : " icon-only"}" data-mapp-asset-tab="mine" aria-label="내 자산">${mineActive ? "내 자산" : IC_PERSON}</button>
        <button type="button" class="mapp-seg-tab${mineActive ? " icon-only" : " active"}" data-mapp-asset-tab="worksite" aria-label="근무지 자산">${mineActive ? IC_WORKSITE : "근무지 자산"}</button>
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
        ` : '<p class="mapp-empty">배정 중인 자산이 없습니다.</p>'}
      </div>`;
  }
  const WS_LABEL = {
      fixed: "● 고정 근무지",
      assigned: "● 담당 근무지"
    },
    CHEV_DOWN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>';
  function worksiteCategoryTreeHtml(wsName, items) {
    return groupItemsBySub(items).map(sec => `
      <button type="button" class="mapp-ws-cat-row" data-ws-cat-open data-ws="${wsName}" data-sub="${sec.sub}">
        <span>${sec.group} <span class="mapp-cat-sep">›</span> ${sec.sub}</span>
        <span class="mapp-ws-cat-count">${sec.items.length}<span class="mapp-menu-chev">›</span></span>
      </button>`).join("");
  }
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
          ${hasItems ? `<div class="mapp-ws-cat-tree">${worksiteCategoryTreeHtml(group.worksite, group.items)}</div>` : '<p class="mapp-ws-empty">배정 중인 자산이 없습니다.</p>'}
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
  function worksiteDetailScreenHtml(ws, sub, items, filters) {
    const cat = window.DATA.categories.find(c => c.sub === sub) || {},
      group = cat.group || "",
      searchPlaceholder = "품목명/고유관리번호",
      filterGroups = MappAssetFilter.config(cat, "employee"),
      filtered = items.filter(x => MappAssetFilter.matches(x.asset, filters));
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
        ` : `<p class="mapp-empty" data-mapp-empty>${items.length ? "결과가 없습니다." : "배정 중인 자산이 없습니다."}</p>`}
      </div>`;
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
          <div class="danger-note">${WARN_ICON}<span>기존 배정은 자동으로 종료되며, 이후 배정·자산 수정이 제한됩니다. 자산 관리 권한자는 배정이 없는 배정 가능 상태로 복구할 수 있습니다.</span></div>
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
      target: x,
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
      ...entry
    });
  }
  function historyCardHtml(e) {
    const val = v => v || "없음",
      targetName = e.target ? e.target.employee || e.target.worksite : null,
      targetMark = e.target ? e.target.employee ? `<span class="hval-avatar" style="background:${avatarColor(e.target.employee)}">${e.target.employee[0]}</span>` : IC_WS : "",
      withTarget = v => e.photoValue ? window.assetPhotoThumbsHtml(v) : e.script === "자산 정보 수정: 메모 수정" ? v ? window.AssetMemo.render(v) : "없음" : targetName && v ? `${targetMark}${targetName} · ${val(v)}` : val(v);
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
    return back.style.cssText = `position:fixed;top:${r.top}px;left:${r.left}px;width:${r.width}px;height:${r.height}px;z-index:${zIndex};`, document.body.appendChild(back), back;
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
  function openDateSheet(initialIso, maxIso, onApply) {
    const [by, bm] = (initialIso || maxIso).split("-").map(Number);
    let viewY = by,
      viewM = bm - 1,
      selected = initialIso || maxIso;
    const back = mappOverlay("mapp-sheet-back", 110);
    back.innerHTML = `
      <div class="mapp-sheet">
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
    function drawCal() {
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
          <span class="mapp-cal-ym">${viewY}.${pad(viewM + 1)}</span>
          <button type="button" data-cal-next aria-label="다음 달">›</button>
          <button type="button" class="mapp-cal-today" data-cal-today>오늘</button>
        </div>
        <div class="mapp-cal-wd">${WD.map(w => `<span>${w}</span>`).join("")}</div>
        <div class="mapp-cal-grid">${rows.map(row => row.map(d => {
        if (d === null) return '<span class="mapp-cal-cell empty"></span>';
        const iso = isoOf(viewY, viewM, d),
          cls = ["mapp-cal-cell"];
        return iso === selected ? cls.push("sel") : iso === todayStr() && cls.push("today"), `<button type="button" class="${cls.join(" ")}" data-cal-day="${iso}"${iso > maxIso ? " disabled" : ""}>${d}</button>`;
      }).join("")).join("")}</div>
        <div class="mapp-cal-sel">${selected ? window.fmtDate(selected) : ""}</div>`, body.querySelector("[data-cal-prev]").onclick = () => {
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
    drawCal(), back.querySelector("[data-cal-cancel]").onclick = () => back.remove(), okBtn.onclick = () => {
      selected && (back.remove(), onApply(selected));
    };
  }
  const FORM_CFG = {
    "assign-add": {
      title: "배정",
      targetLabel: "배정 대상",
      confirm: "배정하시겠습니까?"
    },
    reassign: {
      title: "재배정",
      targetLabel: "새 배정 대상",
      confirm: "재배정하시겠습니까?"
    }
  };
  function confirmWriteExit(onLeave) {
    const cb = document.createElement("div");
    cb.className = "modal-back", cb.style.zIndex = 340, cb.innerHTML = `<div class="modal sm" style="width:340px" role="dialog" aria-modal="true" aria-label="작성을 중단하시겠습니까?">
      <h3>작성을 중단하시겠습니까?</h3><div class="body" style="font-size:14px">지금까지 작성한 내용은 저장되지 않습니다.</div>
      <div class="foot"><button type="button" class="btn" data-exit-stay>취소</button><button type="button" class="btn primary" data-exit-leave>확인</button></div></div>`, document.body.appendChild(cb), cb.querySelector("[data-exit-stay]").onclick = () => cb.remove(), cb.querySelector("[data-exit-leave]").onclick = () => {
      cb.remove(), onLeave();
    };
  }
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
      old = kind === "reassign" ? a.assignments[findRecord(a, target).idx] : null,
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
      f.picked || Object.values(f.draft).some(Boolean) || f.dateIso || f.qtyText ? confirmWriteExit(() => back.remove()) : back.remove();
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
          }), toast("배정되었습니다."), afterMutate();
        });
      } else if (kind === "reassign") {
        const d = f.dateIso,
          record = mk({
            since: d
          });
        confirmModal(cfg.confirm, "", () => {
          back.remove();
          const idx = findRecord(a, target).idx,
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
      a.assignments.splice(idx, 1), a.status = derivedActiveStatus(a), logActivity(a, {
        script: "배정 관리: 반납",
        target: old,
        before: window.fmtDate(old.since),
        after: ""
      }), toast("반납되었습니다."), onDone();
    });
  }
  const PHOTO_COLORS = ["#5b8def", "#8f6ef0", "#eb7f8b", "#3fb37f", "#e0a63c", "#4dabf7", "#c2554e", "#3f9ba0", "#9a6bd6", "#5aa06a"],
    CLOSE_ICON_SM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
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
    // 배정 가능 상태에서는 상태 메뉴에서 '배정'을 바로 제공한다(D-20261029-52·D-20261030-15).
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
  function manageActions(a, target) {
    if (a.status === "disposed" || !canManage(a)) return [];
    const acts = [];
    {
      const {
        idx
      } = findRecord(a, target);
      idx >= 0 && acts.push({
        key: "date",
        label: "배정일 수정"
      }, {
        key: "reassign",
        label: "재배정"
      }), idx >= 0 && acts.push({
        key: "return",
        label: "반납",
        danger: !0
      });
    }
    return acts;
  }
  function menuActions(a,target) {
    const actions=target?manageActions(a,target):[];
    if(canEditInfo(a))actions.push({key:'edit',label:'자산 수정'});
    if(!target&&window.hasPrototypeAssetManagePermission())actions.push({key:'delete',label:'자산 삭제',danger:true});
    return actions;
  }

  function openDropdownMenu(anchor, items, onPick) {
    document.querySelectorAll(".dropdown-menu").forEach(m => m.remove());
    const menu = document.createElement("div");
    menu.className = "dropdown-menu", menu.innerHTML = items.map(x => `${x.sep ? '<div class="dropdown-sep"></div>' : ""}<button type="button" data-key="${x.key}"${x.danger ? ' class="danger"' : ""}>${x.label}</button>`).join("");
    const r = anchor.getBoundingClientRect();
    menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${Math.max(8, r.right - 180)}px;min-width:180px`, document.body.appendChild(menu), menu.querySelectorAll("button").forEach(b => b.onclick = () => {
      menu.remove(), onPick(b.dataset.key);
    }), setTimeout(() => {
      const close = e => {
        menu.contains(e.target) || (menu.remove(), document.removeEventListener("click", close));
      };
      document.addEventListener("click", close);
    });
  }
  const MORE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>';
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
  function assetDetailScreenHtml(a,target) {
 activityLog(a);
 const actions=statusActions(a), idx=findRecord(a,target).idx, rec=idx>=0?a.assignments[idx]:null, photos=window.assetPhotos(a), manage=window.hasPrototypeAssetManagePermission();
 const info=[['분류',categoryPath(a)],['태그',chips(a.labels)]].map(([k,v])=>`<div><div class="k">${k}</div><div class="v">${v}</div></div>`).join('')+window.AssetExtra.detailRows(a,manage,expiryBadge)+[['자산 등록일',window.fmtDate(a.createdAt)],['QR 라벨','<button class="btn sm" data-qr-open aria-label="QR 라벨">QR 라벨</button>'],['메모',`${memoHtml(a.note)}${window.AssetAccess.canField(a,'memo',ME)?`<button class="icon-edit" data-memoedit aria-label="메모 수정">${IC_EDIT}</button>`:''}`]].map(([k,v])=>`<div><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');
 // 자산 한 건은 한 대상에게만 배정하므로 배정 탭에는 이 대상의 배정 기록 하나만 보여준다(D-20261030-14·15).
 const party=`<div class="dsection"><h2 class="mapp-party-head">배정 대상</h2>${rec?`<div class="mapp-party-list">${partyRowHtml(rec,true)}</div>`:'<p class="mapp-party-empty">배정 대상이 없습니다.</p>'}</div>`;
 return `<div class="mapp-topbar"><button class="mapp-back" data-mapp-back aria-label="뒤로">←</button>${menuActions(a,target).length?`<button class="mapp-more" data-more-open aria-label="더보기">${MORE_ICON}</button>`:''}</div><div class="mapp-body"><div class="dhead-id"><div class="mapp-hero-wrap"><button class="mapp-hero-img" data-hero-viewer aria-label="사진 보기"${photos.length?'':' disabled'}>${cardThumb(a)}</button>${photos.length>1?`<span class="mapp-hero-count">+${photos.length-1}</span>`:''}${canEditInfo(a)?`<button class="mapp-hero-edit" data-hero-edit aria-label="사진 관리">${IC_EDIT}</button>`:''}</div><div><h1>${a.product}</h1><div class="dhead-sub">${actions.length?`<button class="badge ${STATUS_LABEL[a.status][1]} clickable" data-status-open>${STATUS_LABEL[a.status][0]} ▾</button>`:`<span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>`}<div>고유관리번호 <b>${a.assetNo}</b></div>${rec?`<div>배정일 ${window.fmtDate(rec.since)}</div>`:''}</div></div></div>${window.AssetExtra.tabs()}<div data-detail-panel="assignment">${party}</div><div data-detail-panel="info" hidden><div class="kv2">${info}</div>${window.AssetExtra.detailHtml(a,manage,expiryBadge)}</div><div data-detail-panel="history" hidden>${timelineHtml(a,'')}</div></div>`;
}
  const MENU_ICON_ASSET = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="m21 16-5-5-9 8"/></svg>',
    DEMO_DIRECTORY_MEMBER = "김민수",
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
        ${canConfigureFeatures() ? '<button type="button" class="mapp-menu-row mapp-menu-link" data-mapp-goto="plan-features"><span class="mapp-menu-ic">🔌</span>요금제 및 기능</button>' : ""}
        <div class="mapp-menu-divider"></div>
        <div class="mapp-menu-row muted"><span class="mapp-menu-ic">🎧</span>고객 센터</div>
      </div>`;
  }
  function tabBarHtml(active) {
    return `<div class="mapp-tabbar">${[{
      key: "home",
      ic: "⌂",
      label: "홈"
    }, {
      key: "work",
      ic: "☑",
      label: "업무"
    }, {
      key: "menu",
      ic: "☰",
      label: "메뉴"
    }].map(t => `<button type="button" class="mapp-tab${t.key === active ? " active" : ""}" data-mapp-tab="${t.key}"><span class="mapp-tab-ic">${t.ic}</span>${t.label}</button>`).join("")}</div>`;
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
        assetTab: "mine",
        wsFilters: MappAssetFilter.empty(),
        wsSearch: ""
      };
    if(new URLSearchParams(location.search).get('qa')==='access'){
      const sample=assets.find(a=>a.id===(new URLSearchParams(location.search).get('id')||'A001'))||assets[0];
      const record=(sample.assignments||[]).find(r=>r.employee===ME)||(sample.assignments||[])[0];
      const target=record?{type:record.employee?'employee':'worksite',value:record.employee||record.worksite}:null;
      Object.assign(state,{screen:'asset-detail',detailAssetId:sample.id,detailTarget:target,detailFrom:{screen:'menu'}});
    }
    function draw() {
      ["plan-features", "asset-feature"].includes(state.screen) && !canConfigureFeatures() && (state.screen = "menu");
      const items = sortItems(collectMyItems(ME)),
        worksiteGroups = collectWorksiteGroups(ME),
        showTabBar = state.screen === "menu",
        screenHtml = state.screen === "menu" ? menuScreenHtml(state.menuExpanded) : state.screen === "member-profile" ? directoryProfileScreenHtml("member", state) : state.screen === "worksite-profile" ? directoryProfileScreenHtml("worksite", state) : state.screen === "directory-member-assets" ? directoryMemberAssetsScreenHtml(state) : state.screen === "directory-worksite-assets" ? directoryWorksiteAssetsScreenHtml(state) : state.screen === "plan-features" ? planFeaturesScreenHtml() : state.screen === "asset-feature" ? assetFeatureScreenHtml() : state.screen === "worksite-detail" ? worksiteDetailScreenHtml(state.wsDetail, state.wsDetailSub, itemsForWorksite(state.wsDetail, state.wsDetailSub), state.wsFilters) : state.screen === "asset-detail" ? assetDetailScreenHtml(assets.find(x => x.id === state.detailAssetId), state.detailTarget) : state.screen === "asset-parties" ? partiesScreenHtml(assets.find(x => x.id === state.detailAssetId), state.detailTarget) : state.screen === "asset-history" ? historyScreenHtml(assets.find(x => x.id === state.detailAssetId)) : state.assetTab === "mine" ? myAssetsScreenHtml(items) : worksiteAssetsScreenHtml(worksiteGroups);
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
        if (["asset-parties", "asset-history"].includes(state.screen)) state.screen = "asset-detail";else if (state.screen === "asset-detail" && state.detailFrom) {
          const directoryReturn = ["member-profile", "directory-member-assets", "directory-worksite-assets"].includes(state.detailFrom.screen);
          Object.assign(state, state.detailFrom), delete state.detailFrom, draw(), directoryReturn && (root.querySelector(".mapp-screen").scrollTop = state.directoryListScroll || 0);
          return;
        } else state.screen === "worksite-detail" ? (state.screen = "assets", state.assetTab = "worksite") : state.screen = "menu";
        draw();
      });
      function afterMutate() {
        const a = assets.find(x => x.id === state.detailAssetId);
        let directoryReturn = !1;
        findRecord(a, state.detailTarget).idx < 0 && (directoryReturn = ["member-profile", "directory-member-assets", "directory-worksite-assets"].includes(state.detailFrom.screen), Object.assign(state, state.detailFrom), delete state.detailFrom), draw(), directoryReturn && (root.querySelector(".mapp-screen").scrollTop = state.directoryListScroll || 0);
      }
      function openDetail(assetId, target) {
        state.detailFrom = {
          screen: state.screen,
          assetTab: state.assetTab,
          wsDetail: state.wsDetail
        }, state.screen = "asset-detail", state.detailAssetId = assetId, state.detailTarget = target, draw();
      }
      if (root.querySelectorAll("[data-directory-asset]").forEach(row => row.onclick = () => {
        const kind = ["member-profile","directory-member-assets"].includes(state.screen) ? "member" : "worksite",
          a = assets.find(asset => asset.id === row.dataset.directoryAsset);
        !a || !directoryAssetAvailable(kind) || !directoryCanViewAsset(a, kind) || (state.directoryListScroll = root.querySelector(".mapp-screen").scrollTop, openDetail(a.id, directoryTarget(kind)));
      }), state.screen === "assets" && state.assetTab === "mine" ? root.querySelectorAll("[data-asset-card]").forEach(el => el.onclick = () => openDetail(el.dataset.assetId, {
        type: "employee",
        value: ME
      })) : state.screen === "worksite-detail" && root.querySelectorAll("[data-asset-card]").forEach(el => el.onclick = () => openDetail(el.dataset.assetId, {
        type: "worksite",
        value: state.wsDetail
      })), state.screen === "worksite-detail") {
        const applyFilters = filters => {
          state.wsFilters = filters, draw();
        };
        MappAssetFilter.wireApplied(root, state.wsFilters, applyFilters);
        const filterBtn = root.querySelector("[data-mapp-filter-open]");
        filterBtn && (filterBtn.onclick = () => MappAssetFilter.open({
          category: window.DATA.categories.find(c => c.sub === state.wsDetailSub) || {},
          mode: "employee",
          filters: state.wsFilters,
          onApply: applyFilters
        }));
      }
      if (root.querySelectorAll("[data-card-thumb]").forEach(el => el.onclick = e => {
        const asset = assets.find(x => x.id === el.dataset.assetId);
        !asset || !window.assetPhotos(asset).length || (e.stopPropagation(), openPhotoViewer(asset));
      }), state.screen === "asset-detail") {
        let dispatchAction2 = function (key) {
          const {
            idx
          } = findRecord(a, target);
          if(key === "edit"){if(!canEditInfo(a))return;window.openAssetAddModal({asset:a,logActivity:e=>logActivity(a,e),onSaved:draw});return;}
          if(key === "delete"){confirmModal("삭제하시겠습니까?","삭제하면 복구할 수 없습니다.",()=>{window.archiveDeletedAsset(a,ME);Object.assign(state,state.detailFrom);draw();toast("삭제되었습니다.");});return;}
          if (key === "history") state.screen = "asset-history", draw();else if (key === "date") {
            if (a.status === "disposed" || !canManage(a) || idx < 0) return;
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
          } else key === "assign-add" ? (a.assignments || []).length || openFormPage(a, target, "assign-add", afterMutate) : key === "reassign" ? openFormPage(a, target, "reassign", afterMutate) : key === "return" ? openReturnConfirm(a, idx, afterMutate) : key === "lost-report" ? openStatusChangeConfirm(a, "분실 신고하시겠습니까?", "분실 신고 시 기존 배정은 유지된 채 상태만 분실로 변경됩니다.", setStatus("상태 변경: 분실 신고", () => "lost"), afterMutate) : key === "lost-recover" ? openStatusChangeConfirm(a, "분실 회수 처리하시겠습니까?", "분실 회수 시 배정 여부에 따라 배정 중 또는 배정 가능 상태로 돌아갑니다.", setStatus("상태 변경: 분실 회수", () => derivedActiveStatus(a)), afterMutate) : key === "repair-start" ? openStatusChangeConfirm(a, "수리/점검을 접수하시겠습니까?", "수리/점검을 접수하면 기존 배정은 유지되고 자산 상태가 수리/점검 중으로 변경됩니다.", setStatus("상태 변경: 수리/점검 접수", () => "repair"), afterMutate, !1, "수리/점검이 접수되었습니다.") : key === "repair-done" ? openStatusChangeConfirm(a, "수리/점검을 완료하시겠습니까?", "수리/점검을 완료하면 현재 배정 여부에 따라 자산 상태가 배정 중 또는 배정 가능 상태로 변경됩니다.", setStatus("상태 변경: 수리/점검 완료", () => derivedActiveStatus(a)), afterMutate, !1, "수리/점검이 완료되었습니다.") : key === "dispose-restore" ? window.openAssetRestoreConfirm(a, message => {
            afterMutate(), toast(message);
          }, ME) : key === "dispose" && openDisposeConfirmModal(a, afterMutate);
        };
        var dispatchAction = dispatchAction2;
        const a = assets.find(x => x.id === state.detailAssetId),
          target = state.detailTarget,
          setStatus = (script, next) => () => {
            const before = STATUS_LABEL[a.status][0];
            a.status = next(), logActivity(a, {
              script,
              before,
              after: STATUS_LABEL[a.status][0]
            });
          },
          statusOpen = root.querySelector("[data-status-open]");
        root.querySelectorAll("[data-assignment-action]").forEach(button=>button.onclick=()=>dispatchAction2(button.dataset.assignmentAction));
        statusOpen && (statusOpen.onclick = () => openDropdownMenu(statusOpen, statusActions(a), dispatchAction2));
        const moreOpen = root.querySelector("[data-more-open]");
        moreOpen && (moreOpen.onclick = () => openDropdownMenu(moreOpen, menuActions(a, target), dispatchAction2));
        const qr=root.querySelector("[data-qr-open]");if(qr)qr.onclick=()=>openLeaderQr(a);
        const heroBtn = root.querySelector("[data-hero-viewer]");
        heroBtn && (heroBtn.onclick = () => openPhotoViewer(a));
        const heroEdit = root.querySelector("[data-hero-edit]");
        heroEdit && (heroEdit.onclick = e => {
          e.stopPropagation(), openPhotoManageModal(a, afterMutate);
        });
        const memoEdit = root.querySelector("[data-memoedit]");
        memoEdit && (memoEdit.onclick = () => openMemoEditModal(a, afterMutate));
        const partiesViewall = root.querySelector("[data-parties-viewall]");
        partiesViewall && (partiesViewall.onclick = () => {
          state.screen = "asset-parties", draw();
        });
      }
      if (state.screen === "asset-history") {
        const a = assets.find(x => x.id === state.detailAssetId),
          q = root.querySelector("[data-history-q]"),
          list = root.querySelector("[data-history-list]");
        q && (q.value = a._prototypeHistoryQuery || "", list.innerHTML = timelineHtml(a, q.value), q.addEventListener("input", () => {
          a._prototypeHistoryQuery = q.value, list.innerHTML = timelineHtml(a, q.value);
        }));
      }
      const gotoAssets = root.querySelector('[data-mapp-goto="assets"]');
      gotoAssets && (gotoAssets.onclick = () => {
        state.screen = "assets", state.assetTab = "mine", draw();
      }), root.querySelectorAll("[data-mapp-asset-tab]").forEach(b => b.onclick = () => {
        state.assetTab = b.dataset.mappAssetTab, draw();
      }), root.querySelectorAll("[data-mapp-tab]").forEach(b => b.onclick = () => {
        b.dataset.mappTab === "menu" && (state.screen = "menu", draw());
      });
      const searchInput = root.querySelector("[data-mapp-search]");
      if (searchInput) {
        const cards = [...root.querySelectorAll("[data-asset-card]")],
          sections = [...root.querySelectorAll("[data-cat-section]")],
          emptyMsg = root.querySelector("[data-mapp-empty]");
        let searchFoldState = null;
        state.screen === "worksite-detail" && (searchInput.value = state.wsSearch);
        const applySearch = () => {
          state.screen === "worksite-detail" && (state.wsSearch = searchInput.value);
          const q = searchInput.value.trim().toLowerCase();
          q && !searchFoldState && (searchFoldState = new Map(sections.map(sec => [sec, sec.querySelector("[data-cat-collapse]").getAttribute("aria-expanded") === "true"])));
          let anyVisible = !1;
          cards.forEach(card => {
            const asset = assets.find(a => a.id === card.dataset.assetId),
              hay = asset ? `${asset.product}${asset.assetNo || ""}`.toLowerCase() : "",
              match = !q || hay.includes(q);
            card.hidden = !match, match && (anyVisible = !0);
          }), sections.forEach(sec => {
            const matchedCount = [...sec.querySelectorAll("[data-asset-card]")].filter(card => !card.hidden).length;
            sec.hidden = matchedCount === 0, sec.querySelector("[data-cat-result-count]").textContent = matchedCount;
            const expanded = q ? !0 : searchFoldState?.get(sec);
            if (expanded !== void 0) {
              const button = sec.querySelector("[data-cat-collapse]");
              button.setAttribute("aria-expanded", String(expanded)), button.classList.toggle("collapsed", !expanded), sec.querySelector("[data-cat-collapsible]").hidden = !expanded;
            }
          }), q || (searchFoldState = null), emptyMsg && cards.length && (emptyMsg.hidden = anyVisible);
          const count = root.querySelector("[data-worksite-result-count], [data-mine-result-count]");
          count && (count.textContent = cards.filter(card => !card.hidden).length);
        };
        searchInput.addEventListener("input", applySearch), applySearch();
      }
      const wsSearchInput = root.querySelector("[data-mapp-ws-search]");
      if (wsSearchInput) {
        const wsCards = [...root.querySelectorAll("[data-ws-card]")],
          wsCount = root.querySelector("[data-worksite-count]"),
          wsEmpty = root.querySelector("[data-mapp-ws-empty]"),
          applyWorksiteSearch = () => {
            const q = wsSearchInput.value.trim().toLowerCase();
            let count = 0;
            wsCards.forEach(card => {
              const hay = `${card.dataset.wsName}${card.dataset.wsCode}${card.dataset.wsAddress}`.toLowerCase();
              card.hidden = !(!q || hay.includes(q)), card.hidden || count++;
            }), wsCount.textContent = count, wsEmpty.hidden = count > 0;
          };
        wsSearchInput.addEventListener("input", applyWorksiteSearch), applyWorksiteSearch();
      }
      root.querySelectorAll("[data-ws-cat-open]").forEach(b => b.onclick = () => {
        state.screen = "worksite-detail", state.wsDetail = b.dataset.ws, state.wsDetailSub = b.dataset.sub, state.wsFilters = MappAssetFilter.empty(), state.wsSearch = "", draw();
      }), root.querySelectorAll("[data-cat-collapse]").forEach(b => b.onclick = () => {
        const body = b.closest(".mapp-cat-section").querySelector("[data-cat-collapsible]"),
          expanded = b.getAttribute("aria-expanded") === "true";
        b.setAttribute("aria-expanded", String(!expanded)), body.hidden = expanded, b.classList.toggle("collapsed", expanded);
      }), root.querySelectorAll("[data-ws-collapse]").forEach(b => b.onclick = () => {
        const body = b.closest(".mapp-ws-card").querySelector("[data-ws-collapsible]"),
          expanded = b.getAttribute("aria-expanded") === "true";
        b.setAttribute("aria-expanded", String(!expanded)), body.hidden = expanded, b.classList.toggle("collapsed", expanded);
      });
    }
    window.addEventListener("storage", event => {
      ([ASSET_MGMT_FLAG_KEY, COMPANY_PLAN_KEY].includes(event.key) || event.key === null) && draw();
    }), draw();
  }
  window.AppScreen = {
    render
  };
})();
