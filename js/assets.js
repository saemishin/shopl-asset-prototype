(function () {
  const TODAY = /* @__PURE__ */new Date("2026-09-04"),
    {
      assets
    } = window.DATA;
  window.addEventListener("asset-registered", () => render());
  const DEMO_ASSUME_ASSET_MANAGE_PERMISSION = window.AssetPermissionQa?.managePermission ?? !0,
    DEMO_VIEWER_NAME = "김민수",
    memberQaParams = new URLSearchParams(location.search),
    memberQaEnabled = memberQaParams.get("qa") === "member-unavailable",
    memberQaScenario = ["relation", "scope", "partial"].includes(memberQaParams.get("scenario")) ? memberQaParams.get("scenario") : "relation",
    memberQaHiddenCategories = /* @__PURE__ */new Set();
  let memberQaPending = memberQaEnabled;
  const STATUS_LABEL = {
      stock: ["배정 가능", "stock"],
      assigned: ["배정 중", "assigned"],
      repair: ["수리/점검 중", "repair"],
      lost: ["분실", "lost"],
      disposed: ["폐기", "disposed"]
    },
    STATUS_ORDER = ["assigned", "repair", "lost", "disposed", "stock"],
    TYPE_LABEL = {
      individual: "자산"
    },
    EXP_LABEL = {
      valid: "유효",
      soon: "만료 예정",
      over: "만료",
      none: "미설정"
    },
    DOWNLOAD_SHEET_LINKS = {
      all: "https://docs.google.com/spreadsheets/d/1UYRvac6KC84vSu5cfjATV2Wb11cAY0_LtjqNHD4YhSk/edit?usp=drive_link",
      product: {
        individual: "https://docs.google.com/spreadsheets/d/1JgWLKfL1mQoEH02LDDxufezknWSjKrh6QthCO6SptXk/edit?usp=drive_link"
      },
      employee: "https://docs.google.com/spreadsheets/d/1pj6N07JExX6p1AqFCahJ9DvxMVcKzgdhS3-J6asFSWE/edit?usp=drive_link",
      worksite: "https://docs.google.com/spreadsheets/d/10rbRIp_DL3FS-VrtHjV2HXU7VjeQtJilBbHiUFNQkos/edit?usp=drive_link"
    },
    BULK_REGISTER_SHEET_LINKS = {
      individual: "https://docs.google.com/spreadsheets/d/1bmjjq4zuGAcxDv80f03V52GbNEs6y05nIwzei9boABc/edit?usp=drive_link"
    },
    BULK_AI_MAX_PHOTOS = 100,
    BULK_AI_MAX_GROUP_PHOTOS = window.ASSET_PHOTO_MAX_COUNT || 10,
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
  function memberIdentity(name) {
    const team = (MEMBER_INFO[name] || {}).team;
    return `<span class="acard-avatar" style="background:${avatarColor(name)}">${name[0]}</span>
      <div><div class="acard-name">${name}</div><div class="acard-sub">${team || '<span class="muted">—</span>'}</div></div>`;
  }
  const MEMBER_GROUP_TREE = [{
      name: "샤플앤컴퍼니",
      children: [{
        name: "개발팀"
      }, {
        name: "디자인팀"
      }, {
        name: "영업팀",
        children: [{
          name: "국내영업"
        }, {
          name: "해외영업"
        }]
      }, {
        name: "운영팀"
      }, {
        name: "CS팀"
      }]
    }],
    MEMBER_JOB_TITLES = ["직무/직급 없음", "팀장", "매니저", "주임", "사원"],
    SEARCH_PLACEHOLDER = {
      all: "품목명 / 고유관리번호",
      product: "품목명",
      employee: "이름/사번/휴대폰번호",
      worksite: "근무지명/코드"
    },
    RESET_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 1 2.64 6.36"/><path d="M3 20v-6h6"/></svg>',
    SORT_ASC_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18V6M5 6l-3 3M5 6l3 3"/><path d="M11 7h4M11 12h7M11 17h10"/></svg>',
    SORT_DESC_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 6v12M5 18l-3-3M5 18l3-3"/><path d="M11 7h10M11 12h7M11 17h4"/></svg>',
    SORT_FIELDS = [{
      k: "updatedAt",
      label: "최근 변경일시",
      defDir: "desc"
    }, {
      k: "assetNo",
      label: "고유 관리번호",
      defDir: "asc"
    }, {
      k: "product",
      label: "품목명",
      defDir: "asc"
    }, {
      k: "expiry",
      label: "유효기한",
      defDir: "desc"
    }, {
      k: "createdAt",
      label: "자산 등록일",
      defDir: "desc"
    }],
    SORT_FIELDS_PRODUCT = [{
      k: "updatedAt",
      label: "최근 변경일시",
      defDir: "desc"
    }, {
      k: "product",
      label: "품목명",
      defDir: "asc"
    }],
    SORT_FIELDS_MEMBER = [{
      k: "name",
      label: "이름",
      defDir: "asc"
    }, {
      k: "empNo",
      label: "사번",
      defDir: "asc"
    }],
    SORT_FIELDS_WORKSITE = [{
      k: "name",
      label: "근무지명",
      defDir: "asc"
    }, {
      k: "code",
      label: "근무지 코드",
      defDir: "asc"
    }],
    identityQa = new URLSearchParams(location.search);
  identityQa.has("employee-number") && (window.ASSET_MEMBER_NUMBER_ENABLED = identityQa.get("employee-number") !== "off"), identityQa.has("worksite-code") && (window.ASSET_WORKSITE_CODE_ENABLED = identityQa.get("worksite-code") !== "off");
  const displayField = (a, field) => window.AssetExtra.visible(window.AssetExtra.category(a),field,canManageAssets()),
    productKey = a => encodeURIComponent(JSON.stringify([a.group, a.sub, a.product]));
  function sortFieldsFor(view) {
    return view === "product" ? SORT_FIELDS_PRODUCT : view === "employee" ? SORT_FIELDS_MEMBER.filter(f => f.k !== "empNo" || window.ASSET_MEMBER_NUMBER_ENABLED !== !1) : view === "worksite" ? SORT_FIELDS_WORKSITE.filter(f => f.k !== "code" || window.ASSET_WORKSITE_CODE_ENABLED !== !1) : SORT_FIELDS;
  }
  function expiryKey(d) {
    if (!d) return "none";
    const days = Math.ceil((new Date(d) - TODAY) / 864e5);
    return days < 0 ? "over" : days <= 7 ? "soon" : "valid";
  }
  function expiryCell(d) {
    if (!d) return '<span class="muted">—</span>';
    const k = expiryKey(d);
    return `${window.fmtDate(d)} <span class="badge exp-${k}">${EXP_LABEL[k]}</span>`;
  }
  const IC_EMP = '<svg class="hi" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5"/></svg>',
    IC_WS = '<svg class="hi" viewBox="0 0 24 24"><path d="M4 20V9.5L12 4l8 5.5V20"/><path d="M9.5 20v-5h5v5"/></svg>';
  function holderText(a) {
    {
      const as = a.assignments || [];
      if (!as.length) return '<span class="muted">—</span>';
      const sorted2 = [...as].sort((p, q) => p.since === q.since ? 0 : p.since < q.since ? 1 : -1),
        targets2 = [];
      return sorted2.forEach(x => {
        x.employee && targets2.push(`${IC_EMP}${x.employee}`), x.worksite && targets2.push(`${IC_WS}${x.worksite}`);
      }), sorted2.length === 1 ? targets2.join(" ") : `${targets2[0]} <span class="muted">+${targets2.length - 1}</span>`;
    }
  }
  function thumb(a) {
    const ph = window.assetPhotos(a);
    return ph.length ? `<span class="thumb" style="background:${ph[a._primary || 0].color}"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="m21 16-5-5-9 8"/></svg></span>` : '<span class="thumb empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-4 4 3 4-4 5 4"/></svg></span>';
  }
  function prodCell(a) {
    return `<div class="prodcell">${thumb(a)}<span class="pname">${a.product}</span></div>`;
  }
  function memoCell(a) {
    return displayField(a,"memo") && window.AssetMemo.has(a.note) ? '<span class="memo-flag"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6"/><path d="M9 13h5M9 17h4"/></svg></span>' : "";
  }
  function labelsCell(labels) {
    return !labels || !labels.length ? '<span class="muted">—</span>' : `<span class="asset-fit-chips">${labels.map(l => `<span class="tag">${l}</span>`).join("")}<span class="muted" data-chip-rest hidden></span></span>`;
  }
  function fitSummaryChips(scope) {
    scope.querySelectorAll(".asset-fit-chips").forEach(box => {
      const fit = () => {
        const rest = box.querySelector("[data-chip-rest]"),
          chips = [...box.children].filter(x => x !== rest);
        chips.forEach(x => x.hidden = !1), rest.hidden = !0;
        for (let visible = chips.length; visible > 0 && box.scrollWidth > box.clientWidth; visible--) chips[visible - 1].hidden = !0, rest.hidden = !1, rest.textContent = `+${chips.length - visible + 1}`;
      };
      fit(), new ResizeObserver(fit).observe(box);
    });
  }
  const ALL_LABELS = [...new Set(assets.flatMap(a => a.labels || []))].sort(),
    CAT_GROUPS = (() => {
      const m = /* @__PURE__ */new Map();
      return viewableCategories().forEach(c => {
        m.has(c.group) || m.set(c.group, []), m.get(c.group).push(c.sub);
      }), m;
    })(),
    CATEGORY_ORDER = new Map(window.DATA.categories.map((c, i) => [c.sub, i]));
  function subOrder(sub) {
    return CATEGORY_ORDER.has(sub) ? CATEGORY_ORDER.get(sub) : 999;
  }
  function canManageAssets(){return window.hasPrototypeAssetManagePermission();}
  function canViewCategory(cat) {
    if (!cat || memberQaHiddenCategories.has(JSON.stringify([cat.group, cat.sub]))) return !1;
    if (canManageAssets()) return !0;
    switch (cat.view) {
      case "회사의 모든 구성원":
      case "모든 관리자 및 리더":
        return !0;
      case "특정 관리자/리더":
        return (cat.viewTarget?.members || []).includes(DEMO_VIEWER_NAME);
      case "특정 그룹 및 직무/직급":
        return window.matchesAssetGroupPositionTarget(cat.viewTarget, MEMBER_INFO[DEMO_VIEWER_NAME]?.team, window.ASSET_MEMBER_JOB_TITLES[DEMO_VIEWER_NAME]);
      default:
        return !1;
    }
  }
  function canAssignCategory(cat) {
    if (!cat || !canViewCategory(cat)) return !1;
    if (canManageAssets()) return !0;
    switch (cat.assign) {
      case "회사의 모든 구성원":
      case "모든 관리자 및 리더":
        return !0;
      case "특정 관리자/리더":
        return (cat.assignTarget?.members || []).includes(DEMO_VIEWER_NAME);
      case "특정 그룹 및 직무/직급":
        return window.matchesAssetGroupPositionTarget(cat.assignTarget, MEMBER_INFO[DEMO_VIEWER_NAME]?.team, window.ASSET_MEMBER_JOB_TITLES[DEMO_VIEWER_NAME]);
      default:
        return !1;
    }
  }
  function bulkActions() {
    const actions = [];
    return canManageAssets() && actions.push("일괄 추가"), (canManageAssets() || window.DATA.categories.some(canAssignCategory)) && actions.push("일괄 배정"), window.AssetTemplates && window.AssetTemplates.usableTemplates().length && actions.push("템플릿으로 배정"), actions;
  }
  function viewableCategories() {
    return window.DATA.categories.filter(canViewCategory);
  }
  function hasViewScope() {
    return viewableCategories().length > 0;
  }
  function viewableAssets() {
    const categories = new Set(viewableCategories().map(cat => JSON.stringify([cat.group, cat.sub])));
    return assets.filter(a => !a.deleted_at && categories.has(JSON.stringify([a.group, a.sub])));
  }
  let selected = /* @__PURE__ */new Set(),
    activeScreen = new URLSearchParams(location.search).get("screen")==="bulk-register"?"bulk-register":"list",
    qaBulkInitialized = !1,
    bulkAnalyzeTimer = null,
    bulkPhotoSeq = 0,
    bulkGroupSeq = 0;
  const bulkRegister = {
      method: "company",
      type: "individual",
      fileName: "",
      groups: [],
      selectedPhotos: /* @__PURE__ */new Set(),
      lastSelectedPhoto: null,
      results: /* @__PURE__ */new Map(),
      dirtyGroups: /* @__PURE__ */new Set(),
      attempts: /* @__PURE__ */new Map(),
      errorsOnly: !1,
      excluded: /* @__PURE__ */new Set(),
      selectedRows: /* @__PURE__ */new Set(),
      page: 1,
      pageSize: 300,
      hasAnalyzed: !1,
      duplicateErrors: /* @__PURE__ */new Map()
      // group ID → 오류 필드 Set. 중복은 [저장]을 누를 때 검사한다.
    },
    state = {
      view: memberQaEnabled ? "employee" : "all",
      search: "",
      statFilter: null,
      page: 1,
      pageSize: 20,
      sort: memberQaEnabled ? {
        key: "name",
        dir: "asc"
      } : {
        key: "updatedAt",
        dir: "desc"
      },
      filters: {
        category: [],
        type: [],
        status: [],
        expiry: [],
        labels: [],
        note: []
      },
      productType: "individual"
    };
  if (performance.getEntriesByType("navigation")[0]?.type === "back_forward") try {
    const saved = JSON.parse(sessionStorage.getItem("asset-overview-return") || "null");
    saved && Object.assign(state, saved);
  } catch {}
  // 이전 목업의 유형·보유 필터를 복원하지 않고 현재 제공하는 조건만 유지한다.
  state.productType = "individual";
  state.filters = Object.fromEntries(["category", "status", "expiry", "labels", "note"].map(key => [key, Array.isArray(state.filters?.[key]) ? state.filters[key] : []]));
  state.filters.status = state.filters.status.filter(value => Object.hasOwn(STATUS_LABEL, value));
  if (state.statFilter) {
    state.statFilter = Object.fromEntries(Object.entries(state.statFilter).filter(([key]) => ["status", "expiry"].includes(key)));
    if (!Object.keys(state.statFilter).length) state.statFilter = null;
  }
  const classificationScopes={all:[],product:[],employee:[],worksite:[]};
  const scopeStorageKey=view=>`asset-classification:${window.AssetPrototypeActor.companyId}:${DEMO_VIEWER_NAME}:${view}`;
  for(const view of ['all','product','employee','worksite']){try{const stored=JSON.parse(localStorage.getItem(scopeStorageKey(view))||'[]');classificationScopes[view]=Array.isArray(stored)?stored.filter(key=>viewableCategories().some(c=>`${c.group}/${c.sub}`===key)):[];}catch{classificationScopes[view]=[];}}
  // 분류 선택만 브라우저에 기억한다. 보기 방식은 진입할 때마다 요약으로 시작한다.
  const targetModes={employee:'summary',worksite:'summary'};
  const isTargetFull=()=>['employee','worksite'].includes(state.view)&&targetModes[state.view]==='full';
  window.addEventListener('pageshow',e=>{if(e.persisted&&isTargetFull()){targetModes.employee='summary';targetModes.worksite='summary';render();}});
  function targetModeToggleHtml(){return `<div class="target-view-row"><div class="seg-toggle" role="tablist">${[['summary','요약'],['full','종합']].map(([k,t])=>`<button type="button" role="tab" data-target-mode="${k}" class="${targetModes[state.view]===k?'active':''}" aria-selected="${targetModes[state.view]===k}">${t}</button>`).join('')}</div>${isTargetFull()?classificationScopeHtml():''}</div>`;}
  function scopedCategories(){const chosen=classificationScopes[state.view]||[];return viewableCategories().filter(c=>c.type==='individual'&&(!chosen.length||chosen.includes(`${c.group}/${c.sub}`)));}
  function classificationScopeHtml(){const chosen=classificationScopes[state.view]||[],first=viewableCategories().find(c=>chosen.includes(`${c.group}/${c.sub}`));return `<div class="overview-scope"><span>분류</span><button type="button" class="btn sm" id="classification-scope">${first?`${first.sub}${chosen.length>1?' +'+(chosen.length-1):''}`:'전체'} ▾</button></div>`;}
  const rememberOverview = () => sessionStorage.setItem("asset-overview-return", JSON.stringify(state));
  let productGroupsByKey = /* @__PURE__ */new Map(),
    memberRowsByName = /* @__PURE__ */new Map(),
    worksiteRowsByName = /* @__PURE__ */new Map();
  function sortList(list) {
    const {
        key,
        dir
      } = state.sort,
      mul = dir === "asc" ? 1 : -1,
      value = a => key === "expiry" && !displayField(a, "expiry") ? "" : a[key] || "",
      tie = (a, b) => {
        if (["employee", "worksite"].includes(state.view)) {
          const field = state.view === "employee" && window.ASSET_MEMBER_NUMBER_ENABLED !== !1 ? "empNo" : state.view === "worksite" && window.ASSET_WORKSITE_CODE_ENABLED !== !1 ? "code" : "name";
          return !a[field] && b[field] ? 1 : a[field] && !b[field] ? -1 : String(a[field] || a.name || "").localeCompare(String(b[field] || b.name || ""), "ko");
        }
        return String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")) || String(a.id || "").localeCompare(String(b.id || ""));
      };
    return [...list].sort((a, b) => {
      const va = value(a),
        vb = value(b);
      return !va && !vb ? tie(a, b) : va ? vb ? String(va).localeCompare(String(vb), "ko") * mul || tie(a, b) : -1 : 1;
    });
  }
  function emptyFilters() {
    return {
      category: [],
      type: [],
      status: [],
      expiry: [],
      labels: [],
      note: []
    };
  }
  function getFiltered(forStats=false) {
 const f=state.filters,scope=['employee','worksite'].includes(state.view)&&!isTargetFull()?[]:classificationScopes[state.view]||[],q=forStats?'':state.search.trim().toLowerCase();
 return viewableAssets().filter(a=>{
  if(scope.length&&!scope.includes(`${a.group}/${a.sub}`))return false;
  if(!forStats&&state.statFilter){const p=state.statFilter;if(p.status&&!p.status.includes(a.status)||p.expiry&&(!displayField(a,'expiry')||!p.expiry.includes(expiryKey(a.expiry))))return false;}
  return !(f.status.length&&!f.status.includes(a.status)||f.expiry.length&&(!displayField(a,'expiry')||!f.expiry.includes(expiryKey(a.expiry)))||f.note.length&&(!displayField(a,'memo')||!f.note.includes(window.AssetMemo.has(a.note)?'has':'none'))||f.labels.length&&(!displayField(a,'tags')||f.labels.some(l=>!(a.labels||[]).includes(l)))||q&&state.view==='all'&&!`${a.product} ${a.assetNo||''}`.toLowerCase().includes(q)||q&&state.view==='product'&&!a.product.toLowerCase().includes(q));
 });
}
  function activeFilterCount() {
    const f = state.filters;
    return f.status.length + f.expiry.length + f.labels.length + f.note.length;
  }
  function pageSlice(arr) {
    const totalPages = Math.max(1, Math.ceil(arr.length / state.pageSize));
    state.page > totalPages && (state.page = totalPages), state.page < 1 && (state.page = 1);
    const start = (state.page - 1) * state.pageSize;
    return arr.slice(start, start + state.pageSize);
  }
  const CARET = '<svg class="th-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>';
  function view_all(list) {
    const canDelete = canManageAssets(),
      head = `<tr>
      ${canDelete ? '<th class="td-check"><input type="checkbox" data-check-all aria-label="전체 선택"></th>' : ""}
      <th>분류</th><th>품목명</th><th>고유관리번호</th><th>상태</th>
      <th>배정 대상</th><th>유효기한</th><th>태그</th><th class="c">메모</th><th>등록일</th></tr>`,
      rows = pageSlice(sortList(list)).map(a => {
        const st = `<span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>`;
        return `<tr class="clickable" data-id="${a.id}">
        ${canDelete ? `<td class="td-check"><input type="checkbox" data-check data-id="${a.id}" aria-label="선택"></td>` : ""}
        <td>${a.group} <span class="muted">›</span> ${a.sub}</td>
        <td>${prodCell(a)}</td>
        <td>${a.assetNo || '<span class="muted">—</span>'}</td>
        <td>${st}</td>
        <td>${holderText(a)}</td>
        <td>${expiryCell(displayField(a, "expiry") ? a.expiry : "")}</td>
        <td>${displayField(a,"tags")?labelsCell(a.labels):"—"}</td>
        <td class="c">${memoCell(a)}</td>
        <td>${window.fmtDate(a.createdAt)}</td>
      </tr>`;
      }).join("");
    return {
      head,
      rows,
      count: list.length
    };
  }
  function groupByProduct(list) {
    const map = /* @__PURE__ */new Map();
    list.forEach(a => {
      const key = productKey(a);
      map.has(key) || map.set(key, {
        product: a.product,
        group: a.group,
        sub: a.sub,
        type: a.type,
        list: []
      }), map.get(key).list.push(a);
    });
    const groups = [...map.values()];
    return groups.forEach(g => {
      g.updatedAt = g.list.reduce((max, a) => a.updatedAt > max ? a.updatedAt : max, "");
    }), groups;
  }
  function view_product(list) {
    return view_product_individual(list);
  }
  function view_product_individual(list) {
    const head = `<tr><th>분류</th><th>품목명</th><th class="num">자산 수</th>
      <th class="num">배정 중</th><th class="num">수리/점검 중</th><th class="num">분실</th><th class="num">폐기</th><th class="num">배정 가능</th></tr>`,
      groups = groupByProduct(list.filter(a => !0)),
      sorted = sortList(groups),
      paged = pageSlice(sorted);
    productGroupsByKey = new Map(paged.map(g => [productKey(g), g]));
    const rows = paged.map(g => {
      const counts = {
        assigned: 0,
        stock: 0,
        repair: 0,
        lost: 0,
        disposed: 0
      };
      return g.list.forEach(a => {
        counts[a.status] = (counts[a.status] || 0) + 1;
      }), `<tr class="clickable" data-pkey="${productKey(g)}">
        <td>${g.group} <span class="muted">›</span> ${g.sub}</td>
        <td><div class="prodcell">${thumb([...g.list].sort((a, b) => String(a.assetNo || "").localeCompare(String(b.assetNo || ""))).find(a => window.assetPhotos(a).length) || g.list[0])}<span class="pname">${g.product}</span></div></td>
        <td class="num">${g.list.length}</td>
        <td class="num">${counts.assigned}</td>
        <td class="num">${counts.repair}</td>
        <td class="num">${counts.lost}</td>
        <td class="num">${counts.disposed}</td>
        <td class="num">${counts.stock}</td>
      </tr>`;
    }).join("");
    return {
      head,
      rows,
      count: groups.length
    };
  }
  function assetsSummaryCell(items){
 if(!items.length)return '<span class="muted">—</span>';
 const groups=new Map();for(const item of items){const key=`${item.asset.group}/${item.asset.sub}`;if(!groups.has(key))groups.set(key,{group:item.asset.group,sub:item.asset.sub,count:0});groups.get(key).count++;}
 const order=x=>window.DATA.categories.findIndex(c=>c.group===x.group&&c.sub===x.sub);
 return `<span class="asset-fit-chips">${[...groups.values()].sort((a,b)=>order(a)-order(b)).map(x=>`<span class="chip">${x.sub} ${x.count}</span>`).join('')}<span class="chip" data-chip-rest hidden></span></span>`;
}
  function openAssignedAssetsModal(headerHtml,items) {
 const back=modal(`<div class="modal help-modal"><div class="help-modal-head"><h3>배정 자산</h3><button class="btn icon-only sm" data-close aria-label="닫기">×</button></div><div class="body"><div class="modal-info-box">${headerHtml}</div><input class="search" data-assigned-search placeholder="품목명/고유관리번호"><div data-assigned-list></div></div></div>`,{closeOnBackdrop:true});
 const query=back.querySelector('[data-assigned-search]'),list=back.querySelector('[data-assigned-list]'),collapsed=new Set();
 function draw(){const q=query.value.trim().toLowerCase(),groups=new Map();items.filter(x=>!q||`${x.asset.product} ${x.asset.assetNo||''}`.toLowerCase().includes(q)).forEach(x=>{const key=`${x.asset.group}/${x.asset.sub}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(x);});
 list.innerHTML=[...groups.values()].sort((a,b)=>window.DATA.categories.findIndex(c=>c.group===a[0].asset.group&&c.sub===a[0].asset.sub)-window.DATA.categories.findIndex(c=>c.group===b[0].asset.group&&c.sub===b[0].asset.sub)).map(rows=>{rows.sort((a,b)=>a.asset.product.localeCompare(b.asset.product,'ko')||(a.asset.assetNo||'').localeCompare(b.asset.assetNo||''));const a=rows[0].asset,key=`${a.group}/${a.sub}`;return `<div class="assign-group"><button class="assign-group-label" data-assigned-group="${key}"><span>▾</span>${a.group} › ${a.sub} <span class="muted">${rows.length}</span></button><div class="assign-group-body"${collapsed.has(key)?' hidden':''}>${rows.map(x=>`<a class="assign-row" href="asset-detail.html?id=${x.asset.id}" target="_blank" rel="noopener"><div><div>${x.asset.product}</div><div class="acard-sub">${x.asset.assetNo}</div></div><span class="badge ${STATUS_LABEL[x.asset.status][1]}">${STATUS_LABEL[x.asset.status][0]}</span><span class="assign-date">${x.since?x.since.replaceAll('-','.'):'—'}</span></a>`).join('')}</div></div>`;}).join('')||'<p class="muted" style="padding:24px">결과가 없습니다.</p>';
 list.querySelectorAll('[data-assigned-group]').forEach(b=>b.onclick=()=>{const key=b.dataset.assignedGroup;collapsed.has(key)?collapsed.delete(key):collapsed.add(key);draw();});}
 query.oninput=draw;draw();
}
  function currentMemberItems(name) {
    return viewableAssets().flatMap(asset => (asset.assignments || []).filter(relation => relation.employee === name).map(relation => ({
      sub: asset.sub,
      since: relation.since,
      qty: 1,
      asset
    })));
  }
  function openMemberUnavailableModal() {
    const back = modal(`
      <div class="modal sm" role="dialog" aria-modal="true" aria-describedby="member-unavailable-body">
        <div class="body" id="member-unavailable-body">설정이 변경되었습니다. 잠시 후 다시 시도해주세요.</div>
        <div class="foot"><button type="button" class="btn primary" data-member-refresh>확인</button></div>
      </div>`, {
        closeOnBackdrop: !1
      }),
      confirm = back.querySelector("[data-member-refresh]");
    back.addEventListener("keydown", event => {
      (event.key === "Escape" || event.key === "Tab") && (event.preventDefault(), confirm.focus());
    }), confirm.onclick = () => {
      back.remove(), state.view = "employee", state.search = "", state.filters = emptyFilters(), state.statFilter = null, state.sort = {
        key: "name",
        dir: "asc"
      }, state.pageSize = 20, state.page = 1, render();
    }, confirm.focus();
  }
  function simulateMemberChange(name, items) {
    if (!memberQaPending) return;
    if (memberQaPending = !1, memberQaScenario === "scope") {
      items.forEach(item => memberQaHiddenCategories.add(JSON.stringify([item.asset.group, item.asset.sub])));
      return;
    }
    const retainedAsset = memberQaScenario === "partial" ? items[0]?.asset : null;
    assets.forEach(asset => {
      if (asset === retainedAsset) return;
      const field = "assignments";
      asset[field] = (asset[field] || []).filter(relation => relation.employee !== name), !asset[field].length && (asset.status === "assigned" || asset.status === "held") && (asset.status = "stock");
    });
  }
  function mountMemberQaPanel() {
    if (window.PrototypeQa || !memberQaEnabled || document.getElementById("member-unavailable-qa")) return;
    const panel = document.createElement("aside");
    panel.id = "member-unavailable-qa", panel.className = "permission-qa-panel", panel.setAttribute("aria-label", "구성원별 7-3 QA");
    const scenarios = [["relation", "배정 관계 종료"], ["scope", "조회 범위 변경"], ["partial", "일부 관계 유지"]];
    panel.innerHTML = `<div class="permission-qa-head"><strong>구성원별 7-3 QA</strong><button type="button" aria-label="QA 종료">×</button></div>
      <p style="margin:0 0 8px">구성원 행을 눌러 확인하세요.</p>
      <div class="permission-qa-actions">${scenarios.map(([key, label]) => `<button type="button" data-member-scenario="${key}" aria-pressed="${key === memberQaScenario}">${label}</button>`).join("")}</div>`, panel.querySelectorAll("[data-member-scenario]").forEach(button => button.onclick = () => {
      const url = new URL(location.href);
      url.searchParams.set("scenario", button.dataset.memberScenario), location.href = url.toString();
    }), panel.querySelector("[aria-label='QA 종료']").onclick = () => {
      const url = new URL(location.href);
      url.searchParams.delete("qa"), url.searchParams.delete("scenario"), location.href = url.toString();
    }, document.body.appendChild(panel);
  }
  // 종합 보기: 고정 컬럼(구성원 이름·사번·휴대폰번호 / 근무지명·코드) 뒤에 분류 범위의 소분류를 컬럼으로 두고 배정 수를 표시한다.
  function targetFullTable(fixedHeads, fixedCells, rows, keyAttr) {
    const cats = scopedCategories();
    let left = 0;
    const stick = fixedHeads.map(h => { const st = `left:${left}px;min-width:${h.w}px;max-width:${h.w}px`; left += h.w; return st; });
    // 소분류 헤더 한 칸에 대분류명(위)·소분류명(아래)을 두 줄로 적는다(D-20261030-35).
    const head = `<tr>${fixedHeads.map((h, i) => `<th class="tf-sticky${i === fixedHeads.length - 1 ? " tf-sticky-last" : ""}" style="${stick[i]}">${h.label}</th>`).join("")}${cats.map(c => `<th class="num tf-sub"><span class="tf-group-name">${c.group}</span><span>${c.sub}</span></th>`).join("")}</tr>`;
    const body = rows.map(r => {
      const counts = new Map();
      r.items.forEach(it => { const k = `${it.asset.group}/${it.asset.sub}`; counts.set(k, (counts.get(k) || 0) + 1); });
      return `<tr class="clickable" ${keyAttr}="${r.name}">${fixedCells(r).map((cell, i) => `<td class="tf-sticky${i === fixedHeads.length - 1 ? " tf-sticky-last" : ""}" style="${stick[i]}">${cell}</td>`).join("")}${cats.map(c => { const n = counts.get(`${c.group}/${c.sub}`) || 0; return `<td class="num${n ? "" : " tf-zero"}">${n}</td>`; }).join("")}</tr>`;
    }).join("");
    return { head, rows: body, cols: fixedHeads.length + cats.length };
  }
  function view_employee(list) {
    const map = /* @__PURE__ */new Map();
    list.forEach(a => {
      (a.assignments || []).forEach(x => {
        x.employee && (map.has(x.employee) || map.set(x.employee, {
          name: x.employee,
          empNo: (MEMBER_INFO[x.employee] || {}).empNo || "",
          items: []
        }), map.get(x.employee).items.push({
          sub: a.sub,
          qty: 1,
          since: x.since,
          asset: a
        }));
      });
    });
    const head = `<tr><th>이름</th>${window.ASSET_MEMBER_NUMBER_ENABLED !== !1 ? "<th>사번</th>" : ""}<th>휴대폰번호</th><th class="num">배정 자산 수</th><th>배정 자산</th></tr>`,
      q = state.search.trim().toLowerCase(),
      rowsArr = [...map.values()].filter(r => {
        if (!q) return !0;
        const info = MEMBER_INFO[r.name] || {};
        return r.name.toLowerCase().includes(q) || (info.empNo || "").toLowerCase().includes(q) || (info.phone || "").includes(q);
      }),
      sorted = sortList(rowsArr),
      paged = pageSlice(sorted);
    memberRowsByName = new Map(paged.map(r => [r.name, r]));
    if (isTargetFull()) {
      const withNo = window.ASSET_MEMBER_NUMBER_ENABLED !== !1,
        heads = [{ label: "이름", w: 170 }, ...(withNo ? [{ label: "사번", w: 100 }] : []), { label: "휴대폰번호", w: 140 }],
        t = targetFullTable(heads, r => { const info = MEMBER_INFO[r.name] || {}; return [`<div class="acard-id">${memberIdentity(r.name)}</div>`, ...(withNo ? [info.empNo || '<span class="muted">—</span>'] : []), info.phone || '<span class="muted">—</span>']; }, paged, "data-mkey");
      return { ...t, count: rowsArr.length };
    }
    const rows = paged.map(r => {
      const info = MEMBER_INFO[r.name] || {};
      return `<tr class="clickable" data-mkey="${r.name}">
        <td><div class="acard-id">${memberIdentity(r.name)}</div></td>
        ${window.ASSET_MEMBER_NUMBER_ENABLED !== !1 ? `<td>${info.empNo || '<span class="muted">—</span>'}</td>` : ""}
        <td>${info.phone || '<span class="muted">—</span>'}</td>
        <td class="num">${r.items.length}</td>
        <td>${assetsSummaryCell(r.items)}</td>
      </tr>`;
    }).join("");
    return {
      head,
      rows,
      count: rowsArr.length
    };
  }
  function view_worksite(list) {
    const map = /* @__PURE__ */new Map();
    list.forEach(a => {
      (a.assignments || []).forEach(x => {
        x.worksite && (map.has(x.worksite) || map.set(x.worksite, {
          name: x.worksite,
          code: WS_CODE[x.worksite] || "",
          items: []
        }), map.get(x.worksite).items.push({
          sub: a.sub,
          qty: 1,
          since: x.since,
          asset: a
        }));
      });
    });
    const head = `<tr><th>근무지명</th>${window.ASSET_WORKSITE_CODE_ENABLED !== !1 ? "<th>근무지 코드</th>" : ""}<th class="num">배정 자산 수</th><th>배정 자산</th></tr>`,
      q = state.search.trim().toLowerCase(),
      rowsArr = [...map.values()].filter(r => q ? r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q) : !0),
      sorted = sortList(rowsArr),
      paged = pageSlice(sorted);
    worksiteRowsByName = new Map(paged.map(r => [r.name, r]));
    if (isTargetFull()) {
      const withCode = window.ASSET_WORKSITE_CODE_ENABLED !== !1,
        heads = [{ label: "근무지명", w: 160 }, ...(withCode ? [{ label: "근무지 코드", w: 110 }] : [])],
        t = targetFullTable(heads, r => [`<a href="worksite-detail.html?name=${encodeURIComponent(r.name)}" target="_blank" rel="noopener" data-worksite-link>${r.name}</a>`, ...(withCode ? [r.code || '<span class="muted">—</span>'] : [])], paged, "data-wkey");
      return { ...t, count: rowsArr.length };
    }
    const rows = paged.map(r => `<tr class="clickable" data-wkey="${r.name}">
      <td><a href="worksite-detail.html?name=${encodeURIComponent(r.name)}" target="_blank" rel="noopener" data-worksite-link>${r.name}</a></td>
      ${window.ASSET_WORKSITE_CODE_ENABLED !== !1 ? `<td>${r.code || '<span class="muted">—</span>'}</td>` : ""}
      <td class="num">${r.items.length}</td>
      <td>${assetsSummaryCell(r.items)}</td>
    </tr>`).join("");
    return {
      head,
      rows,
      count: rowsArr.length
    };
  }
  function currentView() {
    const list = getFiltered();
    if (state.view === "all") return view_all(list);
    if (state.view === "product") return view_product(list);
    if (state.view === "employee") return view_employee(list);
    if (state.view === "worksite") return view_worksite(list);
  }
  function sortHtml() {
    if (!["all", "product", "employee", "worksite"].includes(state.view)) return "";
    const cur = sortFieldsFor(state.view).find(f => f.k === state.sort.key) || sortFieldsFor(state.view)[0];
    return state.sort.key = cur.k, `
      <div class="sortbar">
        <button class="sort-key-btn" id="sort-key-btn">${cur.label}${CARET}</button>
        <div class="sort-dir-group">
          <button class="sort-dir-btn ${state.sort.dir === "asc" ? "active" : ""}" data-dir="asc" aria-label="오름차순">${SORT_ASC_ICON}</button>
          <button class="sort-dir-btn ${state.sort.dir === "desc" ? "active" : ""}" data-dir="desc" aria-label="내림차순">${SORT_DESC_ICON}</button>
        </div>
      </div>`;
  }
  function openSortKeyMenu(anchor) {
    document.querySelectorAll(".dropdown-menu").forEach(m => m.remove());
    const menu = document.createElement("div");
    menu.className = "dropdown-menu", menu.innerHTML = sortFieldsFor(state.view).map(f => `<button data-k="${f.k}" class="${state.sort.key === f.k ? "active" : ""}">${f.label}</button>`).join("");
    const r = anchor.getBoundingClientRect();
    menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${r.left}px;min-width:${Math.max(r.width, 120)}px`, document.body.appendChild(menu), menu.querySelectorAll("button").forEach(b => b.onclick = () => {
      menu.remove(), state.sort.key = b.dataset.k, state.sort.dir = sortFieldsFor(state.view).find(f => f.k === b.dataset.k).defDir, state.page = 1, render();
    }), setTimeout(() => {
      const close = e => {
        menu.contains(e.target) || (menu.remove(), document.removeEventListener("click", close));
      };
      document.addEventListener("click", close);
    });
  }
  function pagerHtml(total, leftActionsHtml = "") {
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize)),
      p = state.page,
      winStart = Math.max(1, Math.min(p - 2, totalPages - 4)),
      winEnd = Math.min(totalPages, Math.max(p + 2, winStart + 4)),
      pages = [];
    for (let i = Math.max(1, winStart); i <= winEnd; i++) pages.push(i);
    const btn = (label, target, disabled, cls = "") => `<button data-page="${target}" ${disabled ? "disabled" : ""} class="${cls}">${label}</button>`;
    return `
      <div class="pager">
        ${leftActionsHtml ? `<span class="pager-actions">${leftActionsHtml}</span>` : ""}
        ${btn("«", 1, p === 1)}
        ${btn("‹", p - 1, p === 1)}
        ${pages.map(n => btn(n, n, !1, n === p ? "active" : "")).join("")}
        ${btn("›", p + 1, p === totalPages)}
        ${btn("»", totalPages, p === totalPages)}
        <span class="pagesize"><select id="page-size">
          ${[20, 50, 100].map(n => `<option value="${n}" ${state.pageSize === n ? "selected" : ""}>${n}</option>`).join("")}
        </select></span>
      </div>`;
  }
  function filterChips(){const f=state.filters,chips=[],push=(k,label,v)=>chips.push(`<span class="fchip">${label}<button data-clear='${JSON.stringify({k,v})}'>✕</button></span>`);f.status.forEach(v=>push('status',STATUS_LABEL[v][0],v));f.expiry.forEach(v=>push('expiry',EXP_LABEL[v],v));f.labels.forEach(v=>push('labels',v,v));f.note.forEach(v=>push('note',v==='has'?'있음':'없음',v));return chips.length?`<div class="filterbar"><button class="filter-reset" id="filter-reset" aria-label="필터 전체 해제">${RESET_ICON}</button>${chips.join('')}</div>`:'';}
  function tableInner(v) {
    const filtering = activeFilterCount() > 0 || !!state.statFilter || !!state.search.trim(),
      emptyMsg = hasViewScope() ? filtering ? "결과가 없습니다." : ["employee", "worksite"].includes(state.view) ? "표시할 목록이 없습니다." : "등록된 자산이 없습니다." : "조회 가능한 자산이 없습니다.",
      empty = `<tr><td colspan="${v.cols ? v.cols : state.view === "product" ? 8 : state.view === "employee" ? 4 : state.view === "worksite" ? 3 : canManageAssets() ? 10 : 9}" style="text-align:center;color:var(--text-mut);padding:32px">${emptyMsg}</td></tr>`;
    return `<table class="${state.view === "product" ? `tbl-product tbl-product-${state.productType}` : `tbl-${state.view}${isTargetFull() ? " tbl-target-full" : ""}`}"><thead>${v.head}</thead><tbody>${v.rows || empty}</tbody></table>`;
  }
  function typeToggleHtml() {
    return "";
  }
  function bindRows(scope) {
    scope.querySelectorAll("tbody tr[data-id]").forEach(tr => tr.onclick = () => {
      rememberOverview(), location.href = `asset-detail.html?id=${tr.dataset.id}`;
    });
  }
  function bindBulkSelect(scope) {
    const deleteBtn = document.getElementById("btn-bulk-delete");
    if (!deleteBtn) return;
    const checkAll = scope.querySelector("[data-check-all]"),
      rowChecks = () => [...scope.querySelectorAll("tbody [data-check]")];
    function syncHeader() {
      const boxes = rowChecks(),
        checkedCount = boxes.filter(b => b.checked).length;
      checkAll.checked = boxes.length > 0 && checkedCount === boxes.length, checkAll.indeterminate = checkedCount > 0 && checkedCount < boxes.length;
    }
    rowChecks().forEach(cb => {
      cb.addEventListener("click", e => e.stopPropagation()), cb.addEventListener("change", () => {
        cb.checked ? selected.add(cb.dataset.id) : selected.delete(cb.dataset.id), deleteBtn.disabled = selected.size === 0, syncHeader();
      });
    }), checkAll && (checkAll.addEventListener("click", e => e.stopPropagation()), checkAll.addEventListener("change", () => {
      rowChecks().forEach(cb => {
        cb.checked = checkAll.checked, checkAll.checked ? selected.add(cb.dataset.id) : selected.delete(cb.dataset.id);
      }), deleteBtn.disabled = selected.size === 0, checkAll.indeterminate = !1;
    })), deleteBtn.onclick = () => {
      selected.size && openBulkDeleteAssetModal(() => {
        assets.filter(a => selected.has(a.id)).forEach(a => window.archiveDeletedAsset(a, "dana")), selected.clear(), toast("삭제되었습니다."), render();
      });
    };
  }
  const WARN_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 9v4M12 16.5h.01M10.3 3.9 2.5 17.5a1.7 1.7 0 0 0 1.47 2.55h16.06a1.7 1.7 0 0 0 1.47-2.55L13.7 3.9a1.7 1.7 0 0 0-2.94 0z"/></svg>';
  function openBulkDeleteAssetModal(onConfirm) {
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
      confirmed() && (cb.remove(), onConfirm());
    }, document.body.appendChild(cb), input.focus();
  }
  function render() {
    !qaBulkInitialized && new URLSearchParams(location.search).get("qa") === "bulk-ai" && (qaBulkInitialized = !0, activeScreen = "bulk-register", bulkRegister.method = "ai"), mountMemberQaPanel();
    const pendingToast = sessionStorage.getItem("pendingToast");
    if (pendingToast && (sessionStorage.removeItem("pendingToast"), toast(pendingToast)), activeScreen === "bulk-register") {
      renderBulkRegister();
      return;
    }
    selected.clear();
    const c = document.getElementById("content"),
      v = currentView(),
      nAct = state.view === "product" ? state.filters.category.length : activeFilterCount();
    c.innerHTML = `
      <div class="tabs">
        <a class="active">현황</a>
        <a href="category.html">분류</a>
        <a href="settings.html">설정</a>
      </div>

      <div class="subtabs">
        ${[["all", "전체"], ["product", "품목별"], ["employee", "구성원별"], ["worksite", "근무지별"]].map(([k, t]) => `<button data-view="${k}" class="${state.view === k ? "active" : ""}">${t}</button>`).join("")}
        ${state.view === "all" ? `
        <div class="sub-actions">
          ${canManageAssets() ? '<button class="btn primary sm" id="btn-add">＋ 자산 추가</button>' : ""}
          ${bulkActions().length ? '<button class="btn sm" id="btn-bulk">일괄 작업 <span class="chev">▾</span></button>' : ""}
        </div>` : ""}
      </div>

      ${['all','product'].includes(state.view)?classificationScopeHtml():''}
      ${['employee','worksite'].includes(state.view)?targetModeToggleHtml():''}
      ${state.view === "all" ? statsHtml() : ""}
      ${state.view === "product" ? typeToggleHtml() : ""}

      <div class="countrow">
        <span class="total">전체 <b>${v.count}</b></span>
        ${sortHtml()}
        <button class="filter-btn ${nAct ? "set" : ""}" id="btn-filter" ${state.view==='product'?'hidden':''}>▤ ${state.view === "product" ? "분류" : state.view === "employee" ? "구성원" : state.view === "worksite" ? "근무지" : "필터"}${nAct ? ` <b>${nAct}</b>` : ""}</button>
        <div class="right">
          <div class="searchbox${state.search ? " has-term" : ""}">
            <input class="search${state.search ? " expanded" : ""}" id="search-input"
              placeholder="${state.search ? SEARCH_PLACEHOLDER[state.view] : "검색"}" value="${state.search.replace(/"/g, "&quot;")}">
            <button class="search-clear" id="search-clear" type="button" aria-label="검색어 지우기">✕</button>
          </div>
          ${state.view === "all" ? '<button class="btn sm" id="btn-qr-dl">▦ QR 다운로드</button>' : ""}
          <button class="btn sm" id="btn-list-dl">⬇ 다운로드</button>
        </div>
      </div>

      ${filterChips()}

      <div class="table-wrap">${tableInner(v)}</div>

      ${pagerHtml(v.count, state.view === "all" && canManageAssets() ? '<button class="btn sm" id="btn-bulk-delete" disabled>삭제</button>' : "")}
    `, c.querySelector('#classification-scope') && (c.querySelector('#classification-scope').onclick=openCategoryFilterModal), c.querySelectorAll('[data-target-mode]').forEach(b=>b.onclick=()=>{targetModes[state.view]=b.dataset.targetMode;state.page=1;render();}), c.querySelectorAll(".subtabs button").forEach(b => b.onclick = () => {
      state.view = b.dataset.view, ["employee","worksite"].includes(state.view) && (targetModes[state.view]="summary"), state.page = 1, state.filters = emptyFilters(), state.statFilter = null, state.search = "", state.productType = "individual";
      const fields = sortFieldsFor(state.view);
      fields.some(f => f.k === state.sort.key) || (state.sort = {
        key: fields[0].k,
        dir: fields[0].defDir
      }), render();
    }), c.querySelectorAll("[data-worksite-link]").forEach(a => a.onclick = e => e.stopPropagation()), fitSummaryChips(c), bindRows(c), bindBulkSelect(c), c.querySelectorAll("[data-ptype]").forEach(b => b.onclick = () => {
      state.productType !== b.dataset.ptype && (state.productType = b.dataset.ptype, state.filters.category = [], state.page = 1, render());
    }), c.querySelectorAll("tbody tr[data-pkey]").forEach(tr => tr.onclick = () => {
      const g = productGroupsByKey.get(tr.dataset.pkey);
      g && window.openProductUnitsModal(g.product, g.list);
    }), c.querySelectorAll("tbody tr[data-mkey]").forEach(tr => tr.onclick = () => {
      const r = memberRowsByName.get(tr.dataset.mkey);
      if (!r) return;
      simulateMemberChange(r.name, r.items);
      const items = currentMemberItems(r.name);
      if (!items.length) {
        openMemberUnavailableModal();
        return;
      }
      openAssignedAssetsModal(`<div class="acard-id">${memberIdentity(r.name)}</div>`, items);
    }), c.querySelectorAll("tbody tr[data-wkey]").forEach(tr => tr.onclick = () => {
      const r = worksiteRowsByName.get(tr.dataset.wkey),
        codeHtml = r.code || '<span class="muted">—</span>';
      if (r) {
        const current = viewableAssets().flatMap(asset => (asset.assignments || []).filter(x => x.worksite === r.name).map(x => ({
          asset,
          sub: asset.sub,
          since: x.since,
          qty: 1
        })));
        if (!current.length) {
          openMemberUnavailableModal();
          return;
        }
        openAssignedAssetsModal(`<div><a class="cat-unit-product" href="worksite-detail.html?name=${encodeURIComponent(r.name)}" target="_blank" rel="noopener">${r.name}</a><div class="acard-sub">${codeHtml}</div></div>`, current);
      }
    }), c.querySelectorAll("[data-stub]").forEach(el => el.onclick = () => toast(`"${el.dataset.stub}" — 이후 단계에서 정의`));
    const si = document.getElementById("search-input"),
      sbox = si.closest(".searchbox"),
      commit = () => {
        state.search = si.value.trim(), state.page = 1, render();
      };
    si.onfocus = () => {
      si.classList.add("expanded"), si.placeholder = SEARCH_PLACEHOLDER[state.view];
    }, si.onblur = () => {
      !si.value && !state.search && (si.classList.remove("expanded"), si.placeholder = "검색");
    }, si.oninput = () => sbox.classList.toggle("has-term", !!si.value), si.onkeydown = e => {
      e.key === "Enter" && commit();
    }, document.getElementById("search-clear").onclick = () => {
      si.value = "", state.search = "", state.page = 1, render();
    }, c.querySelectorAll("[data-clear]").forEach(b => b.onclick = () => {
      const {
        k,
        v: v2
      } = JSON.parse(b.dataset.clear);
      state.filters[k] = state.filters[k].filter(x => x !== v2), state.statFilter = null, state.page = 1, render();
    }), c.querySelectorAll(".statcol.click").forEach(el => el.onclick = () => {
      const p = JSON.parse(el.dataset.filter),
        isOn = JSON.stringify(state.statFilter) === JSON.stringify(p);
      state.statFilter = isOn ? null : p, state.page = 1, render();
    });
    const resetBtn = document.getElementById("filter-reset");
    resetBtn && (resetBtn.onclick = () => {
      state.filters = emptyFilters(), state.statFilter = null, state.page = 1, render();
    }), c.querySelectorAll(".pager button[data-page]").forEach(b => b.onclick = () => {
      state.page = +b.dataset.page, render();
    });
    const pageSizeSel = document.getElementById("page-size");
    pageSizeSel && (pageSizeSel.onchange = () => {
      state.pageSize = +pageSizeSel.value, state.page = 1, render();
    });
    const sortKeyBtn = document.getElementById("sort-key-btn");
    if (sortKeyBtn && (sortKeyBtn.onclick = () => openSortKeyMenu(sortKeyBtn)), c.querySelectorAll(".sort-dir-btn").forEach(b => b.onclick = () => {
      state.sort.dir = b.dataset.dir, state.page = 1, render();
    }), document.getElementById("btn-filter").onclick = state.view === "product" ? openCategoryFilterModal : state.view === "employee" ? openMemberFilterModal : state.view === "worksite" ? openWorksiteFilterModal : openFilterModal, state.view === "all") {
      document.getElementById("btn-qr-dl").onclick = openQrDownloadModal;
      const addButton = document.getElementById("btn-add");
      addButton && (addButton.onclick = () => {
        canManageAssets() && window.openAssetAddModal();
      });
      const bulkButton = document.getElementById("btn-bulk");
      bulkButton && (bulkButton.onclick = e => openBulkMenu(e.currentTarget));
    }
    document.getElementById("btn-list-dl").disabled = v.count === 0, document.getElementById("btn-qr-dl") && (document.getElementById("btn-qr-dl").disabled = v.count === 0), document.getElementById("btn-list-dl").onclick = () => {
      const url = state.view === "product" ? DOWNLOAD_SHEET_LINKS.product[state.productType] : DOWNLOAD_SHEET_LINKS[state.view];
      window.open(url, "_blank", "noopener");
    };
  }
  function catScoped() {
    return getFiltered(!0);
  }
  function computeStats() {
    const list = catScoped(),
      cnt = k => list.filter(a => a.status === k).length,
      assignable = list.length - cnt("disposed");
    return {
      stock: cnt("stock"),
      assigned: cnt("assigned"),
      repair: cnt("repair"),
      lost: cnt("lost"),
      disposed: cnt("disposed"),
      assignable,
      expOver: list.filter(a => displayField(a, "expiry") && a.expiry && expiryKey(a.expiry) === "over").length,
      expSoon: list.filter(a => displayField(a, "expiry") && a.expiry && expiryKey(a.expiry) === "soon").length,
      rate: assignable ? (Math.round(cnt("assigned") / assignable * 1e3) / 10).toFixed(1) : "0.0"
    };
  }
  function statCol({
    k,
    v,
    sub,
    cls = "",
    filter,
    extra = ""
  }) {
    return `<div${filter ? ` class="statcol click ${cls}" data-filter='${JSON.stringify(filter)}'` : ` class="statcol ${cls}"`}>${extra}<div><div class="statcol-k">${k}</div><div class="statcol-v">${v}${sub ? ` <small>${sub}</small>` : ""}</div></div></div>`;
  }
  function statCard(title, cols) {
    return `<div class="statcard"><div class="statcard-title">${title}</div><div class="statcard-body">${cols.join("")}</div></div>`;
  }
  function statsHtml() {
    const s = computeStats();
    return '<div class="statwrap"><div class="statrow2">' + statCard("자산 현황", [statCol({
      k: "배정 중",
      v: s.rate + "%",
      sub: s.assigned + "/" + s.assignable,
      filter: {
        status: ["assigned"]
      },
      extra: '<div class="donut" style="--pct:' + s.rate + '"><div class="donut-hole"></div></div>'
    }), statCol({
      k: "배정 가능",
      v: s.stock,
      filter: {
        status: ["stock"]
      }
    }), statCol({
      k: "분실",
      v: s.lost,
      cls: "alert",
      filter: {
        status: ["lost"]
      }
    }), statCol({
      k: "수리/점검 중",
      v: s.repair,
      cls: "warn",
      filter: {
        status: ["repair"]
      }
    })]) + statCard("유효기한", [statCol({
      k: "만료 예정",
      v: s.expSoon,
      cls: "warn",
      filter: {
        expiry: ["soon"]
      }
    }), statCol({
      k: "만료",
      v: s.expOver,
      cls: "alert",
      filter: {
        expiry: ["over"]
      }
    })]) + "</div></div>";
  }
  function bulkEsc(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function resetBulkRegister() {
    bulkRegister.groups.flatMap(g => g.photos).forEach(p => {
      p.url?.startsWith("blob:") && URL.revokeObjectURL(p.url);
    }), bulkRegister.method = "company", bulkRegister.type = "individual", bulkRegister.fileName = "", bulkRegister.groups = [], bulkRegister.selectedPhotos.clear(), bulkRegister.lastSelectedPhoto = null, bulkRegister.results.clear(), bulkRegister.dirtyGroups.clear(), bulkRegister.attempts.clear(), bulkRegister.hasAnalyzed = !1, bulkRegister.excluded.clear(), bulkRegister.selectedRows.clear(), bulkRegister.page = 1, bulkRegister.pageSize = 300, bulkRegister.errorsOnly = !1, bulkRegister.duplicateErrors.clear();
  }
  function bulkHasDraft() {
    return !!bulkRegister.fileName || bulkRegister.groups.length > 0 || bulkRegister.results.size > 0;
  }
  function openBulkDiscardConfirm(onConfirm, {
    title = "작성을 중단하시겠습니까?",
    body = "지금까지 작성한 내용은 저장되지 않습니다.",
    confirmLabel = "확인"
  } = {}) {
    const back = document.createElement("div");
    back.className = "modal-back", back.style.zIndex = 340, back.innerHTML = `<div class="modal sm" role="dialog" aria-modal="true" aria-label="${title}">
      <h3>${title}</h3><div class="body">${body}</div>
      <div class="foot"><button class="btn" data-cancel>취소</button><button class="btn primary" data-confirm>${confirmLabel}</button></div>
    </div>`, back.querySelector("[data-cancel]").onclick = () => back.remove(), back.querySelector("[data-confirm]").onclick = () => {
      back.remove(), onConfirm();
    }, document.body.appendChild(back);
  }
  function returnFromBulk(message='') {
    let origin=null;try{origin=JSON.parse(sessionStorage.getItem('asset-bulk-origin')||'null');}catch{}
    sessionStorage.removeItem('asset-bulk-origin');
    if(origin){if(message)sessionStorage.setItem('pendingToast',message);location.href=`category.html?group=${encodeURIComponent(origin.group)}&sub=${encodeURIComponent(origin.sub)}`;return;}
    resetBulkRegister();activeScreen='list';render();if(message)toast(message);
  }
  function leaveBulkRegister() {
    const leave = () => {
      returnFromBulk();
    };
    bulkHasDraft() ? openBulkDiscardConfirm(leave) : leave();
  }
  function bulkPhotoCount() {
    return bulkRegister.groups.reduce((sum, group) => sum + group.photos.length, 0);
  }
  function validBulkImageFiles(fileList) {
    const files = [...fileList],
      valid = files.filter(file => ["image/jpeg", "image/png"].includes(file.type) && file.size <= 20 * 1024 * 1024);
    return valid.length !== files.length && toast("20MB 이하의 JPG, JPEG, PNG 파일만 첨부할 수 있습니다."), valid;
  }
  function newBulkPhoto(file) {
    return {
      id: `bulk-photo-${++bulkPhotoSeq}`,
      name: file.name,
      url: URL.createObjectURL(file),
      file
    };
  }
  function addBulkQaPhotos() {
    const colors = ["#5b8def", "#8f6ef0", "#26a69a"];
    if (bulkPhotoCount() + colors.length > BULK_AI_MAX_PHOTOS || bulkRegister.groups.length + colors.length > BULK_AI_MAX_PHOTOS) {
      toast(`한 번에 사진은 최대 ${BULK_AI_MAX_PHOTOS}장까지 첨부할 수 있습니다.`);
      return;
    }
    colors.forEach((color, index) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="240" height="240" fill="${color}"/><rect x="46" y="62" width="148" height="104" rx="12" fill="white" fill-opacity=".82"/><circle cx="88" cy="104" r="15" fill="${color}"/><path d="M56 150l42-35 31 24 25-21 30 32" fill="none" stroke="${color}" stroke-width="10"/></svg>`;
      newBulkGroup([{
        id: `bulk-photo-${++bulkPhotoSeq}`,
        name: `샘플 자산 ${index + 1}.png`,
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
        file: null
      }]);
    }), renderBulkRegister();
  }
  function newBulkGroup(photos) {
    const group = {
      id: `bulk-group-${++bulkGroupSeq}`,
      photos,
      primaryPhotoId: photos[0]?.id || null
    };
    return bulkRegister.groups.push(group), bulkRegister.dirtyGroups.add(group.id), group;
  }
  function addBulkPhotosAsGroups(fileList) {
    const files = validBulkImageFiles(fileList);
    if (files.length) {
      if (bulkPhotoCount() + files.length > BULK_AI_MAX_PHOTOS || bulkRegister.groups.length + files.length > BULK_AI_MAX_PHOTOS) {
        toast(`한 번에 사진은 최대 ${BULK_AI_MAX_PHOTOS}장까지 첨부할 수 있습니다.`);
        return;
      }
      files.forEach(file => newBulkGroup([newBulkPhoto(file)])), renderBulkRegister();
    }
  }
  function addBulkPhotosToGroup(groupId, fileList) {
    const group = bulkRegister.groups.find(g => g.id === groupId);
    if (!group) return;
    const files = validBulkImageFiles(fileList);
    if (files.length) {
      if (group.photos.length + files.length > BULK_AI_MAX_GROUP_PHOTOS) {
        toast("자산 1개당 사진은 최대 10장까지 첨부할 수 있습니다.");
        return;
      }
      if (bulkPhotoCount() + files.length > BULK_AI_MAX_PHOTOS) {
        toast(`한 번에 사진은 최대 ${BULK_AI_MAX_PHOTOS}장까지 첨부할 수 있습니다.`);
        return;
      }
      group.photos.push(...files.map(newBulkPhoto)), bulkRegister.dirtyGroups.add(groupId), renderBulkRegister();
    }
  }
  function removeBulkPhoto(photoId) {
    const group = bulkRegister.groups.find(g => g.photos.some(p => p.id === photoId));
    if (!group) return;
    const photo = group.photos.find(p => p.id === photoId);
    photo?.url?.startsWith("blob:") && URL.revokeObjectURL(photo.url), group.photos = group.photos.filter(p => p.id !== photoId), group.primaryPhotoId === photoId && (group.primaryPhotoId = group.photos[0]?.id || null), bulkRegister.selectedPhotos.delete(photoId), bulkRegister.lastSelectedPhoto = null, group.photos.length ? bulkRegister.dirtyGroups.add(group.id) : (bulkRegister.groups = bulkRegister.groups.filter(g => g.id !== group.id), bulkRegister.results.delete(group.id), bulkRegister.dirtyGroups.delete(group.id), bulkRegister.attempts.delete(group.id)), renderBulkRegister();
  }
  function flatBulkPhotoIds() {
    return bulkRegister.groups.flatMap(group => group.photos.map(photo => photo.id));
  }
  function selectBulkPhoto(photoId, event) {
    const ids = flatBulkPhotoIds();
    if (event.shiftKey && bulkRegister.lastSelectedPhoto && ids.includes(bulkRegister.lastSelectedPhoto)) {
      const from = ids.indexOf(bulkRegister.lastSelectedPhoto),
        to = ids.indexOf(photoId),
        range = ids.slice(Math.min(from, to), Math.max(from, to) + 1);
      event.metaKey || event.ctrlKey || bulkRegister.selectedPhotos.clear(), range.forEach(id => bulkRegister.selectedPhotos.add(id));
    } else event.metaKey || event.ctrlKey ? (bulkRegister.selectedPhotos.has(photoId) ? bulkRegister.selectedPhotos.delete(photoId) : bulkRegister.selectedPhotos.add(photoId), bulkRegister.lastSelectedPhoto = photoId) : (bulkRegister.selectedPhotos.clear(), bulkRegister.selectedPhotos.add(photoId), bulkRegister.lastSelectedPhoto = photoId);
    renderBulkRegister();
  }
  function moveSelectedBulkPhotos(targetGroupId, beforePhotoId = null) {
    const selectedIds = flatBulkPhotoIds().filter(id => bulkRegister.selectedPhotos.has(id));
    if (!selectedIds.length) return;
    const target = bulkRegister.groups.find(group => group.id === targetGroupId);
    if (!target) return;
    const selectedSet = new Set(selectedIds),
      moving = [];
    bulkRegister.groups.forEach(group => group.photos.forEach(photo => {
      selectedSet.has(photo.id) && moving.push(photo);
    }));
    const targetRemaining = target.photos.filter(photo => !selectedSet.has(photo.id));
    if (targetRemaining.length + moving.length > BULK_AI_MAX_GROUP_PHOTOS) {
      toast("자산 1개당 사진은 최대 10장까지 첨부할 수 있습니다.");
      return;
    }
    const crossGroup = moving.some(photo => !target.photos.some(p => p.id === photo.id)),
      affected = new Set(crossGroup ? [targetGroupId] : []);
    bulkRegister.groups.forEach(group => {
      crossGroup && group.photos.some(photo => selectedSet.has(photo.id)) && affected.add(group.id), group.photos = group.photos.filter(photo => !selectedSet.has(photo.id));
    });
    let insertAt = beforePhotoId ? targetRemaining.findIndex(photo => photo.id === beforePhotoId) : -1;
    insertAt < 0 && (insertAt = targetRemaining.length), target.photos = [...targetRemaining.slice(0, insertAt), ...moving, ...targetRemaining.slice(insertAt)], bulkRegister.groups.forEach(group => {
      group.photos.some(photo => photo.id === group.primaryPhotoId) || (group.primaryPhotoId = group.photos[0]?.id || null);
    }), bulkRegister.groups.filter(group => !group.photos.length).forEach(group => {
      bulkRegister.results.delete(group.id), bulkRegister.attempts.delete(group.id), bulkRegister.dirtyGroups.delete(group.id);
    }), bulkRegister.groups = bulkRegister.groups.filter(group => group.photos.length), affected.forEach(groupId => {
      bulkRegister.groups.some(group => group.id === groupId) && bulkRegister.dirtyGroups.add(groupId);
    }), bulkRegister.selectedPhotos.clear(), bulkRegister.lastSelectedPhoto = null, renderBulkRegister();
  }
  function bulkTags(result) {
    return [...new Set(String(result?.tags || "").split("|").map(tag => tag.trim().replace(/\s+/g, " ")).filter(Boolean))].slice(0, window.ASSET_TAG_MAX_COUNT || 10);
  }
  function bulkUnknownTags(result) {
    const known = new Set(window.DATA.tags || []);
    return bulkTags(result).filter(tag => !known.has(tag));
  }
  function bulkCategoryIsValid(value) {
    return !!value && viewableCategories().some(category => category.type === bulkRegister.type && `${category.group}/${category.sub}` === value);
  }
  function updateBulkResult(groupId, field, value) {
    const result = bulkRegister.results.get(groupId);
    result && (result[field] = value, field === "category" && bulkRegister.duplicateErrors.clear(), result.status === "review" && !bulkResultHasError(result) && (result.status = "success"), renderBulkRegister());
  }
  function openBulkCategoryModal(groupId) {
    const result = bulkRegister.results.get(groupId);
    if (!result) return;
    const categories = viewableCategories().filter(category => category.type === bulkRegister.type);
    let selected2 = result.category;
    const back = document.createElement("div");
    back.className = "modal-back", back.innerHTML = `<div class="modal sm" role="dialog" aria-modal="true" aria-label="분류">
      <h3>분류</h3><div class="body"><input type="text" class="picker-search" data-search placeholder="검색" autocomplete="off"><div class="catpick-list" data-list></div></div>
      <div class="foot"><button class="btn" type="button" data-cancel>취소</button><button class="btn primary" type="button" data-apply>적용</button></div>
    </div>`, document.body.appendChild(back);
    const list = back.querySelector("[data-list]"),
      renderList = () => {
        const query = back.querySelector("[data-search]").value.trim().toLowerCase(),
          groups = /* @__PURE__ */new Map();
        categories.forEach(category => {
          groups.has(category.group) || groups.set(category.group, []), groups.get(category.group).push(category);
        }), list.innerHTML = [...groups].map(([group, subs]) => {
          const shown = subs.filter(category => !query || group.toLowerCase().includes(query) || category.sub.toLowerCase().includes(query));
          return shown.length ? `<div class="catpick-group"><div class="catpick-group-name">${bulkEsc(group)}</div>${shown.map(category => {
            const index = categories.indexOf(category);
            return `<button type="button" class="catpick-row${selected2 === `${category.group}/${category.sub}` ? " active" : ""}" data-category-index="${index}">${bulkEsc(category.sub)}</button>`;
          }).join("")}</div>` : "";
        }).join("") || `<p class="tag-manage-empty">${categories.length ? "결과가 없습니다." : "표시할 목록이 없습니다."}</p>`, back.querySelector("[data-apply]").disabled = !selected2, list.querySelectorAll("[data-category-index]").forEach(button => button.onclick = () => {
          const category = categories[Number(button.dataset.categoryIndex)];
          selected2 = `${category.group}/${category.sub}`, renderList();
        });
      };
    renderList(), back.querySelector("[data-search]").oninput = renderList, back.querySelector("[data-cancel]").onclick = () => back.remove(), back.querySelector("[data-apply]").onclick = () => {
      back.remove(), updateBulkResult(groupId, "category", selected2);
    };
  }
  function openBulkTagModal(groupId) {
    const result = bulkRegister.results.get(groupId);
    if (!result) return;
    const selected2 = new Set(bulkTags(result)),
      back = document.createElement("div");
    back.className = "modal-back", back.innerHTML = `<div class="modal sm" role="dialog" aria-modal="true" aria-label="태그">
      <h3>태그</h3><div class="body"><p class="bulk-tag-limit">최대 ${window.ASSET_TAG_MAX_COUNT || 10}개까지 선택할 수 있습니다.</p><div class="bulk-tag-options" data-options></div></div>
      <div class="foot"><button class="btn bulk-tag-manage-button" type="button" data-manage>태그 관리</button><button class="btn" type="button" data-cancel>취소</button><button class="btn primary" type="button" data-apply>적용</button></div>
    </div>`, document.body.appendChild(back);
    const options = back.querySelector("[data-options]"),
      renderOptions = () => {
        const known = window.DATA.tags || [],
          unknown = [...selected2].filter(tag => !known.includes(tag));
        options.innerHTML = `${unknown.length ? `<div class="bulk-tag-unknown"><b>등록되지 않은 태그</b>${unknown.map(tag => `<button type="button" data-remove-unknown="${bulkEsc(tag)}">${bulkEsc(tag)} ×</button>`).join("")}</div>` : ""}
        ${known.map((tag, index) => `<label><input type="checkbox" data-tag-index="${index}" ${selected2.has(tag) ? "checked" : selected2.size >= window.ASSET_TAG_MAX_COUNT ? "disabled" : ""}>${bulkEsc(tag)}</label>`).join("")}`, options.querySelectorAll("[data-tag-index]").forEach(input => input.onchange = () => {
          const tag = known[Number(input.dataset.tagIndex)];
          if (input.checked && selected2.size >= (window.ASSET_TAG_MAX_COUNT || 10)) {
            input.checked = !1, toast(`태그는 최대 ${window.ASSET_TAG_MAX_COUNT || 10}개까지 선택할 수 있습니다.`);
            return;
          }
          input.checked ? selected2.add(tag) : selected2.delete(tag), renderOptions();
        }), options.querySelectorAll("[data-remove-unknown]").forEach(button => button.onclick = () => {
          selected2.delete(button.dataset.removeUnknown), renderOptions();
        });
      };
    renderOptions(), back.querySelector("[data-manage]").onclick = () => {
      window.openAssetTagManageModal && window.openAssetTagManageModal(({
        renamed,
        deletedOrigs
      }) => {
        const remap = tags => tags.filter(tag => !deletedOrigs.includes(tag)).map(tag => renamed.find(item => item.from === tag)?.to || tag);
        bulkRegister.results.forEach(item => {
          item.tags = [...new Set(remap(bulkTags(item)))].join("|");
        });
        const nextSelected = remap([...selected2]);
        selected2.clear(), nextSelected.forEach(tag => selected2.add(tag)), renderOptions(), renderBulkRegister();
      });
    }, back.querySelector("[data-cancel]").onclick = () => back.remove(), back.querySelector("[data-apply]").onclick = () => {
      back.remove(), updateBulkResult(groupId, "tags", [...selected2].join("|"));
    };
  }
  function bulkFieldEnabled(result, field) {
    const category = (window.DATA.categories || []).find(item => `${item.group}/${item.sub}` === result.category && item.type === bulkRegister.type);
    return !category || window.AssetExtra.enabled(category,field);
  }
  function bulkValidMonth(value) {
    if (!value) return !0;
    const match = /^(\d{4})[.-](\d{2})$/.exec(value);
    if (!match || Number(match[1]) < 1 || Number(match[2]) < 1 || Number(match[2]) > 12) return !1;
    const today = /* @__PURE__ */new Date();
    return `${match[1]}-${match[2]}` <= `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  }
  function bulkValidDate(value) {
    if (!value) return !0;
    const match = /^(\d{4})[.-](\d{2})[.-](\d{2})$/.exec(value);
    if (!match || Number(match[1]) < 1) return !1;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return date.getFullYear() === Number(match[1]) && date.getMonth() + 1 === Number(match[2]) && date.getDate() === Number(match[3]);
  }
  function bulkInputErrors(result) {
    if (!result || result.status === "technical") return {
      technical: !0
    };
    const errors = {};
    bulkCategoryIsValid(result.category) || (errors.category = !0);
    const product = String(result.product || "").trim();
    (!product || product.length > 50) && (errors.product = !0);
    {
      const no = String(result.assetNo || "").trim();
      no && (no.length > 30 || !/^[A-Za-z0-9_-]+$/.test(no)) && (errors.assetNo = !0);
      for (const field of ["serial", "imei"]) bulkFieldEnabled(result, field) && String(result[field] || "").length > 40 && (errors[field] = !0);
    }
    for (const field of ["manufactured", "purchaseDate"]) bulkFieldEnabled(result, field) && !bulkValidMonth(String(result[field] || "").trim()) && (errors[field] = !0);
    if (bulkFieldEnabled(result, "expiry") && !bulkValidDate(String(result.expiry || "").trim()) && (errors.expiry = !0), bulkFieldEnabled(result, "purchasePrice")) {
      const price = String(result.price || "").replace(/,/g, "").trim();
      price && !/^(?:0|[1-9]\d{0,11})(?:\.\d{1,5})?$/.test(price) && (errors.price = !0);
    }
    for(const f of window.DATA.extraFields.filter(f=>!f.deleted)){const cat=window.DATA.categories.find(c=>`${c.group}/${c.sub}`===result.category);if(window.AssetExtra.enabled(cat,f.id)&&String((result.extraValues||{})[f.id]||'').length>100)errors[f.id]=true;}
    return bulkUnknownTags(result).length && (errors.tags = !0), window.AssetMemo.count(result.note || "") > 500 && (errors.note = !0), errors;
  }
  function bulkResultHasError(result, groupId) {
    return Object.keys(bulkInputErrors(result)).length > 0 || !!bulkRegister.duplicateErrors.get(groupId)?.size;
  }
  function checkBulkDuplicates() {
    bulkRegister.duplicateErrors.clear();
    const byNumber = /* @__PURE__ */new Map(),
      byQuantityName = /* @__PURE__ */new Map(),
      add = (groupId, field) => {
        const errors = bulkRegister.duplicateErrors.get(groupId) || /* @__PURE__ */new Set();
        errors.add(field), bulkRegister.duplicateErrors.set(groupId, errors);
      };
    return (window.DATA.assets || []).filter(asset => !asset.deleted_at).forEach(asset => {
      asset.assetNo && byNumber.set(asset.assetNo, null);
    }), bulkActiveGroups().forEach(group => {
      const result = bulkRegister.results.get(group.id);
      if (!(!result || result.status === "technical")) {
        const key = String(result.assetNo || "").trim();
        if (key) if (byNumber.has(key)) {
          add(group.id, "assetNo");
          const previous = byNumber.get(key);
          previous && add(previous, "assetNo");
        } else byNumber.set(key, group.id);
      }
    }), bulkRegister.duplicateErrors.size === 0;
  }
  function bulkActiveGroups() {
    return bulkRegister.groups.filter(g => !bulkRegister.excluded.has(g.id));
  }
  function bulkVisibleGroups() {
    return bulkActiveGroups().filter(g => bulkRegister.results.has(g.id) && (!bulkRegister.errorsOnly || bulkResultHasError(bulkRegister.results.get(g.id), g.id)));
  }
  function bulkErrorCount() {
    return bulkActiveGroups().filter(g => bulkRegister.results.has(g.id) && bulkResultHasError(bulkRegister.results.get(g.id), g.id)).length;
  }
  function bulkCanSave() {
    const groups = bulkActiveGroups();
    return groups.length > 0 && groups.every(g => bulkRegister.results.has(g.id) && !bulkRegister.dirtyGroups.has(g.id) && !bulkResultHasError(bulkRegister.results.get(g.id), g.id));
  }
  function bulkResultTableHtml() {
    if (!bulkRegister.hasAnalyzed) return "";
    bulkErrorCount() || (bulkRegister.errorsOnly = !1);
    const columns = ['<input type="checkbox" data-result-all aria-label="현재 페이지 전체 선택">', "No.", "대분류 *", "소분류 *", "품목명 *", `고유관리번호 <span title="${window.ASSET_NUMBER_GUIDE}">ⓘ</span>`, "유효기한", "태그", "제조연월", "구매연월", "구매가격", "메모", ...window.DATA.extraFields.filter(f=>!f.deleted).map(f=>bulkEsc(f.name))],
      visible = bulkVisibleGroups(),
      pages = Math.max(1, Math.ceil(visible.length / bulkRegister.pageSize));
    bulkRegister.page = Math.min(bulkRegister.page, pages);
    const offset = (bulkRegister.page - 1) * bulkRegister.pageSize,
      rows = visible.slice(offset, offset + bulkRegister.pageSize).map((group, index) => {
        const result = bulkRegister.results.get(group.id),
          errors = bulkInputErrors(result);
        for (const field of bulkRegister.duplicateErrors.get(group.id) || []) errors[field] = !0;
        const tagNames = bulkTags(result),
          [categoryGroup = "", categorySub = ""] = String(result.category || "").split("/"),
          inputCell = (field, {
            mode = "text",
            placeholder = "입력",
            max = "",
            value = result[field] || ""
          } = {}) => {
            const setting = field === "price" ? "purchasePrice" : field,
              enabled = ["product", "assetNo"].includes(field) || bulkFieldEnabled(result, setting),
              date = ["expiry", "manufactured", "purchaseDate"].includes(field);
            return `<td><div class="${date ? "bulk-date-cell" : ""}"><input data-result-field="${field}" data-gid="${group.id}" value="${enabled ? bulkEsc(value) : ""}" placeholder="${enabled ? placeholder : ""}" inputmode="${mode}" ${max ? `maxlength="${max}"` : ""} ${enabled ? "" : "disabled"} class="${enabled && errors[field] ? "is-error" : ""}" aria-invalid="${!!(enabled && errors[field])}">${date ? `<button type="button" class="bulk-calendar" data-calendar="${field}" data-gid="${group.id}" aria-label="${field === "expiry" ? "날짜" : "연월"} 선택" ${enabled ? "" : "disabled"}>▦</button><input class="bulk-native-date" type="${field === "expiry" ? "date" : "month"}" data-calendar-value="${field}" data-gid="${group.id}" tabindex="-1" aria-hidden="true" ${field !== "expiry" ? `max="${(/* @__PURE__ */new Date()).toISOString().slice(0, 7)}"` : ""}>` : ""}</div></td>`;
          };
        return `<tr class="${Object.keys(errors).length ? "bulk-result-error" : ""}" data-result-row="${group.id}">
        <td><input type="checkbox" data-result-check="${group.id}" aria-label="행 선택" ${bulkRegister.selectedRows.has(group.id) ? "checked" : ""}></td><td>${offset + index + 1}</td>
        <td><button type="button" class="bulk-pick-field ${errors.category ? "is-error" : ""}" data-pick-category="${group.id}" aria-label="대분류 선택" aria-invalid="${!!errors.category}">${categoryGroup ? bulkEsc(categoryGroup) : "선택"}<span>›</span></button></td>
        <td><button type="button" class="bulk-pick-field ${errors.category ? "is-error" : ""}" data-pick-category="${group.id}" aria-label="소분류 선택" aria-invalid="${!!errors.category}">${categorySub ? bulkEsc(categorySub) : "선택"}<span>›</span></button></td>
        ${inputCell("product", {
          max: 50
        })}
        ${inputCell("assetNo", {
          max: 30
        })}
        ${inputCell("expiry", {
          placeholder: "YYYY.MM.DD",
          max: 10,
          mode: "numeric"
        })}
        <td><button type="button" class="bulk-pick-field ${errors.tags ? "is-error" : ""}" data-pick-tags="${group.id}" aria-invalid="${!!errors.tags}">${tagNames.length ? `${bulkEsc(tagNames[0])}${tagNames.length > 1 ? ` +${tagNames.length - 1}` : ""}` : "선택"}<span>›</span></button></td>

        ${inputCell("manufactured", {
          placeholder: "YYYY.MM",
          max: 7,
          mode: "numeric"
        })}
        ${inputCell("purchaseDate", {
          placeholder: "YYYY.MM",
          max: 7,
          mode: "numeric"
        })}
        ${inputCell("price", {
          mode: "decimal",
          value: window.formatPurchasePriceInput(result.price)
        })}
        <td><button type="button" class="bulk-pick-field bulk-note-button ${errors.note ? "is-error" : ""}" data-pick-note="${group.id}" aria-invalid="${!!errors.note}">${window.AssetMemo.has(result.note) ? bulkEsc(window.AssetMemo.plain(result.note).slice(0, 32)) : "입력"}<span>›</span></button></td>
        ${window.DATA.extraFields.filter(f=>!f.deleted).map(f=>{const cat=window.DATA.categories.find(c=>`${c.group}/${c.sub}`===result.category),enabled=window.AssetExtra.enabled(cat,f.id),v=(result.extraValues||{})[f.id]||'';return `<td><input data-result-extra="${f.id}" data-gid="${group.id}" value="${enabled?bulkEsc(v):''}" placeholder="${enabled?'입력':''}" ${enabled?'':'disabled'} class="${enabled&&String(v).length>100?'is-error':''}"></td>`;}).join('')}
      </tr>`;
      }).join(""),
      errorCount = bulkErrorCount();
    return errorCount || (bulkRegister.errorsOnly = !1), `<section class="bulk-results-card">
      <div class="bulk-results-head"><div><h3>업로드한 자산</h3><p>전체 ${bulkActiveGroups().filter(g => bulkRegister.results.has(g.id)).length}</p></div><div class="bulk-results-actions"><label class="bulk-errors-toggle" ${errorCount ? "" : "hidden"}><span>오류 라인만 보기</span><input type="checkbox" data-errors-only ${bulkRegister.errorsOnly ? "checked" : ""}><i aria-hidden="true"></i></label></div></div>
      ${visible.length ? `<div class="bulk-results-table-wrap"><table class="bulk-results-table"><thead><tr>${columns.map(label => `<th>${label}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>` : ""}
      <div class="pager"><button class="btn" data-result-delete ${bulkRegister.selectedRows.size ? "" : "disabled"}>삭제</button><button class="btn" data-result-prev ${bulkRegister.page <= 1 ? "disabled" : ""}>‹</button><span>${bulkRegister.page} / ${pages}</span><button class="btn" data-result-next ${bulkRegister.page >= pages ? "disabled" : ""}>›</button><select data-result-size aria-label="페이지당 행 수">${[100, 200, 300].map(n => `<option ${n === bulkRegister.pageSize ? "selected" : ""}>${n}</option>`).join("")}</select></div>
    </section>`;
  }
  function bulkMethodPanelHtml() {
    if (bulkRegister.method !== "ai") {
      const hasFile = !!bulkRegister.fileName;
      return `<div class="bulk-step bulk-file-step">
        <span class="bulk-step-label">STEP 2</span><h3>파일 선택</h3>
        <p>${bulkRegister.method === "company" ? "회사에서 사용하던 자산 양식을 업로드해 주세요." : "Shopl 양식에 입력한 파일을 업로드해 주세요."}</p>
        ${bulkRegister.method === "template" ? '<button class="btn" type="button" data-open-template>양식 열기 ↗</button>' : ""}
        <label class="bulk-file-drop ${hasFile ? "has-file" : ""}" data-file-drop>
          <input type="file" accept=".xlsx,.xls" data-bulk-file hidden>
          ${hasFile ? `<b>✓ 파일 업로드가 완료되었습니다.</b><span>${bulkEsc(bulkRegister.fileName)}</span>` : "<b>파일을 끌어 넣거나 찾아보기로 선택해 주세요.</b><span>엑셀 XLSX, XLS 형식의 파일을 지원합니다.</span>"}
        </label>
        <div class="bulk-panel-actions"><button class="btn" type="button" data-find-file>찾아보기</button><button class="btn primary" type="button" data-apply-file ${hasFile ? "" : "disabled"}>적용</button></div>
      </div>`;
    }
    const selected2 = bulkRegister.selectedPhotos.size,
      groupCards = bulkRegister.groups.map((group, groupIndex) => {
        const result = bulkRegister.results.get(group.id),
          title = result?.product?.trim() ? `자산 ${groupIndex + 1} · ${bulkEsc(result.product.trim())}` : `자산 ${groupIndex + 1}`,
          photos = group.photos.map((photo, photoIndex) => `<div class="bulk-photo ${bulkRegister.selectedPhotos.has(photo.id) ? "selected" : ""}" draggable="true" data-photo-id="${photo.id}" data-group-id="${group.id}">
        <img src="${photo.url}" alt="${bulkEsc(photo.name)}"><button type="button" class="bulk-photo-primary${group.primaryPhotoId === photo.id ? " active" : ""}" data-primary-photo="${photo.id}" aria-label="사진 ${photoIndex + 1}${group.primaryPhotoId === photo.id ? " 대표" : " 대표로 지정"}">${group.primaryPhotoId === photo.id ? "★" : "☆"}</button><button type="button" class="bulk-photo-remove" data-remove-photo="${photo.id}" aria-label="사진 삭제">×</button>
      </div>`).join("");
        return `<article class="bulk-photo-group" data-drop-group="${group.id}">
        <header><b>${title}</b><span>${group.photos.length}/10</span></header>
        <div class="bulk-photo-list">${photos}${group.photos.length < BULK_AI_MAX_GROUP_PHOTOS ? `<label class="bulk-group-add" aria-label="같은 자산 사진 추가">＋<input type="file" accept="image/jpeg,image/png" multiple data-group-file="${group.id}" hidden></label>` : ""}</div>
      </article>`;
      }).join(""),
      canApply = bulkActiveGroups().some(g => !bulkRegister.results.has(g.id) || bulkRegister.dirtyGroups.has(g.id));
    return `<div class="bulk-step bulk-ai-step">
      <span class="bulk-step-label">STEP 2</span><div class="bulk-ai-title"><div><h3>파일 선택</h3><p>사진을 자산별로 묶은 뒤 AI 분석을 적용해 주세요. AI가 입력한 값을 확인하고 필요한 내용을 수정해서 등록할 수 있습니다.</p></div></div>
      ${selected2 ? `<div class="bulk-ai-toolbar"><span>${selected2}장 선택</span><button type="button" data-clear-photo-selection>선택 해제</button></div>` : ""}
      <div class="bulk-ai-drop" data-ai-drop>${groupCards || '<div class="bulk-ai-empty"><b>자산 사진을 추가해 주세요.</b><span>사진을 한 번에 여러 장 선택할 수 있으며, 처음에는 사진 1장당 자산 그룹 1개로 추가됩니다.</span></div>'}</div>
      <div class="bulk-panel-actions">${new URLSearchParams(location.search).get("qa") === "bulk-ai" ? '<button class="btn" type="button" data-add-qa-photos>샘플 사진 3장 추가</button>' : ""}<label class="btn"><input type="file" accept="image/jpeg,image/png" multiple data-global-photo hidden>찾아보기</label>${bulkRegister.hasAnalyzed ? `<button type="button" class="btn" data-reset-analysis ${bulkActiveGroups().length ? "" : "disabled"}>재분석</button>` : ""}<button class="btn primary" type="button" data-analyze ${canApply ? "" : "disabled"}>적용</button></div>
    </div>`;
  }
  function renderBulkRegister() {
    const content = document.getElementById("content"),
      saveEnabled = bulkCanSave();
    content.innerHTML = `<div class="bulk-page">
      <div class="bulk-page-head"><div><button type="button" data-bulk-back aria-label="뒤로가기">‹</button><h2>자산 일괄 추가</h2></div><button class="btn primary" type="button" data-bulk-save ${saveEnabled ? "" : "disabled"}>일괄 추가</button></div>
      <section class="bulk-upload-card">
        <h3>파일 업로드</h3>
        <div class="bulk-upload-grid">
          <div class="bulk-step bulk-method-step">
            <span class="bulk-step-label">STEP 1</span><h3>템플릿 다운로드</h3>
            <div class="bulk-method-heading">업로드 방식</div>
            <div class="bulk-method-list">
              <div class="bulk-method-row"><label><input type="radio" name="bulk-method" value="company" ${bulkRegister.method === "company" ? "checked" : ""}><span>우리 회사의 기존 양식 그대로 업로드할게요.</span></label><button type="button" class="help-icon bulk-method-help" aria-label="회사 양식 등록 방식 도움말" data-tip="업로드한 파일을 AI가 분석해 자산 등록에 필요한 정보를 자동으로 매칭합니다. 일치하지 않거나 누락된 정보가 있으면 추가 입력 또는 재업로드가 필요할 수 있습니다.">?</button></div>
              <div class="bulk-method-row"><label><input type="radio" name="bulk-method" value="template" ${bulkRegister.method === "template" ? "checked" : ""}><span>템플릿을 다운로드한 후, 형식에 맞게 입력하여 업로드할게요.</span></label><button type="button" class="help-icon bulk-method-help" aria-label="Shopl 양식 등록 방식 도움말" data-tip="템플릿에 맞춰 입력한 파일을 업로드하면 더 정확하고 빠르게 자산을 등록할 수 있습니다.">?</button></div>
              <div class="bulk-method-row"><label><input type="radio" name="bulk-method" value="ai" ${bulkRegister.method === "ai" ? "checked" : ""}><span>AI로 자산 사진을 분석해 업로드할게요.</span></label><button type="button" class="help-icon bulk-method-help" aria-label="AI 사진 등록 방식 도움말" data-tip="자산 사진을 올리고 자산별로 묶으면 AI가 정보를 분석해 등록할 내용을 채웁니다. 결과를 확인하고 필요한 정보를 수정한 뒤 등록할 수 있습니다.">?</button></div>
            </div>
          </div>
          ${bulkMethodPanelHtml()}
        </div>
      </section>
      ${bulkRegister.method === "ai" ? bulkResultTableHtml() : ""}
    </div>`, content.querySelector("[data-bulk-back]").onclick = leaveBulkRegister;
    const resetAnalysis = content.querySelector("[data-reset-analysis]");
    if (resetAnalysis && (resetAnalysis.onclick = () => openBulkDiscardConfirm(() => openBulkAnalyzeLoading(!0), {
      title: "다시 분석하시겠습니까?",
      body: "분석 결과와 직접 입력한 내용이 새 분석 결과로 변경됩니다."
    })), content.querySelector("[data-bulk-save]").onclick = () => {
      if (!canManageAssets()) {
        returnFromBulk("자산 관리 권한이 없습니다.");
        return;
      }
      if (!bulkCanSave()) return;
      if (!checkBulkDuplicates()) {
        renderBulkRegister(), content.querySelector(".bulk-result-error")?.scrollIntoView({
          block: "center",
          behavior: "smooth"
        }), toast("오류가 있는 라인이 있습니다. 오류를 수정하거나, 해당 라인을 삭제해주세요.");
        return;
      }
      const drafts = bulkActiveGroups().map(group => {
        const result = bulkRegister.results.get(group.id),
          category = window.DATA.categories.find(cat => `${cat.group}/${cat.sub}` === result.category && cat.type === bulkRegister.type);
        if (!category) return null;
        const photos = group.photos.map(photo => ({
            ...photo,
            color: photo.color || "#5b8def",
            at: (/* @__PURE__ */new Date()).toISOString(),
            by: "dana"
          })),
          month = value => value ? `${value.replaceAll(".", "-")}-01` : void 0;
        return {
          type: bulkRegister.type,
          group: category.group,
          sub: category.sub,
          product: result.product,
          assetNo: result.assetNo || "",
          labels: bulkTags(result),
          extraValues:{...(result.extraValues||{})},
          expiry: result.expiry ? result.expiry.replaceAll(".", "-") : void 0,
          serial: result.serial || void 0,
          imei: result.imei || void 0,
          manufactured: month(result.manufactured),
          purchaseDate: month(result.purchaseDate),
          price: window.normalizePurchasePrice(result.price) || void 0,
          note: result.note || void 0,
          _photos: photos,
          _primary: Math.max(0, group.photos.findIndex(photo => photo.id === group.primaryPhotoId)),
          photo: "#5b8def",
          photoCount: photos.length
        };
      });
      try {
        if (drafts.some(draft => !draft)) throw new Error("CATEGORY_CHANGED");
        window.AssetRegistration.registerBatch(drafts);
      } catch (error) {
        toast(error.code === "CATEGORY_CHANGED" || error.message === "CATEGORY_CHANGED" ? "설정이 변경되었습니다. 잠시 후 다시 시도해주세요." : "오류가 있는 라인이 있습니다. 오류를 수정하거나, 해당 라인을 삭제해주세요.");
        return;
      }
      if(sessionStorage.getItem('asset-bulk-origin')){returnFromBulk('자산이 추가되었습니다.');return;}
      toast("자산이 추가되었습니다."), state.search = "", state.page = 1, state.filters = emptyFilters(), state.statFilter = null, state.sort = {
        key: "updatedAt",
        dir: "desc"
      }, state.view = "all", resetBulkRegister(), activeScreen = "list", render();
    }, content.querySelectorAll('input[name="bulk-method"]').forEach(input => input.onchange = () => {
      if (!input.checked || input.value === bulkRegister.method) return;
      const change = () => {
        const type = bulkRegister.type;
        bulkHasDraft() && resetBulkRegister(), bulkRegister.method = input.value, bulkRegister.type = type, renderBulkRegister(), input.value === "template" && window.open(BULK_REGISTER_SHEET_LINKS[bulkRegister.type], "_blank", "noopener");
      };
      bulkHasDraft() ? (openBulkDiscardConfirm(change, {
        title: "등록 방식을 변경하시겠습니까?",
        body: "입력한 내용은 저장되지 않습니다."
      }), renderBulkRegister()) : change();
    }), bulkRegister.method !== "ai") {
      const fileInput = content.querySelector("[data-bulk-file]"),
        applyFile = files => {
          const file = [...files][0];
          if (!file || !/\.xlsx?$/i.test(file.name) || file.size > 500 * 1024 * 1024) {
            toast("XLSX, XLS 형식의 500MB 이하의 파일만 업로드할 수 있습니다.");
            return;
          }
          bulkRegister.fileName = file.name, renderBulkRegister(), toast("파일 업로드가 완료되었습니다.");
        };
      content.querySelector("[data-find-file]").onclick = () => fileInput.click(), fileInput.onchange = () => applyFile(fileInput.files);
      const drop = content.querySelector("[data-file-drop]");
      drop.ondragover = event => {
        event.preventDefault(), drop.classList.add("dragover");
      }, drop.ondragleave = () => drop.classList.remove("dragover"), drop.ondrop = event => {
        event.preventDefault(), drop.classList.remove("dragover"), applyFile(event.dataTransfer.files);
      }, content.querySelector("[data-apply-file]").onclick = () => toast("공통 일괄 등록 확인 화면으로 이동합니다.");
      const templateButton = content.querySelector("[data-open-template]");
      templateButton && (templateButton.onclick = () => window.open(BULK_REGISTER_SHEET_LINKS[bulkRegister.type], "_blank", "noopener"));
      return;
    }
    content.querySelector("[data-global-photo]").onchange = event => addBulkPhotosAsGroups(event.target.files);
    const qaPhotos = content.querySelector("[data-add-qa-photos]");
    qaPhotos && (qaPhotos.onclick = addBulkQaPhotos);
    const aiDrop = content.querySelector("[data-ai-drop]");
    aiDrop.ondragover = event => {
      event.dataTransfer.types.includes("Files") && (event.preventDefault(), aiDrop.classList.add("dragover"));
    }, aiDrop.ondragleave = event => {
      event.target === aiDrop && aiDrop.classList.remove("dragover");
    }, aiDrop.ondrop = event => {
      !event.dataTransfer.files.length || event.target.closest("[data-drop-group]") || (event.preventDefault(), aiDrop.classList.remove("dragover"), addBulkPhotosAsGroups(event.dataTransfer.files));
    }, content.querySelectorAll("[data-group-file]").forEach(input => input.onchange = () => addBulkPhotosToGroup(input.dataset.groupFile, input.files)), content.querySelectorAll("[data-remove-photo]").forEach(button => button.onclick = event => {
      event.stopPropagation(), removeBulkPhoto(button.dataset.removePhoto);
    }), content.querySelectorAll("[data-primary-photo]").forEach(button => button.onclick = event => {
      event.stopPropagation();
      const group = bulkRegister.groups.find(item => item.photos.some(photo => photo.id === button.dataset.primaryPhoto));
      !group || group.primaryPhotoId === button.dataset.primaryPhoto || (group.primaryPhotoId = button.dataset.primaryPhoto, renderBulkRegister());
    }), content.querySelectorAll("[data-photo-id]").forEach(photo => {
      photo.onclick = event => {
        event.target.closest("button") || selectBulkPhoto(photo.dataset.photoId, event);
      }, photo.ondragstart = event => {
        bulkRegister.selectedPhotos.has(photo.dataset.photoId) || (bulkRegister.selectedPhotos.clear(), bulkRegister.selectedPhotos.add(photo.dataset.photoId), bulkRegister.lastSelectedPhoto = photo.dataset.photoId), event.dataTransfer.setData("text/plain", [...bulkRegister.selectedPhotos].join(",")), event.dataTransfer.effectAllowed = "move";
      }, photo.ondragover = event => {
        event.preventDefault(), event.stopPropagation();
      }, photo.ondrop = event => {
        event.preventDefault(), event.stopPropagation(), moveSelectedBulkPhotos(photo.dataset.groupId, photo.dataset.photoId);
      };
    }), content.querySelectorAll("[data-drop-group]").forEach(group => {
      group.ondragover = event => {
        event.dataTransfer.files.length || (event.preventDefault(), group.classList.add("dragover"));
      }, group.ondragleave = () => group.classList.remove("dragover"), group.ondrop = event => {
        event.preventDefault(), group.classList.remove("dragover"), event.dataTransfer.files.length ? addBulkPhotosToGroup(group.dataset.dropGroup, event.dataTransfer.files) : moveSelectedBulkPhotos(group.dataset.dropGroup);
      };
    });
    const clearSelection = content.querySelector("[data-clear-photo-selection]");
    clearSelection && (clearSelection.onclick = () => {
      bulkRegister.selectedPhotos.clear(), bulkRegister.lastSelectedPhoto = null, renderBulkRegister();
    }), content.querySelector("[data-analyze]").onclick = () => openBulkAnalyzeLoading(!1), bindBulkResultInputs(content);
  }
  function analyzedBulkValues(groupIndex) {
    return {
      category: "전자기기류/노트북",
      product: ["MacBook Pro 14", "무선 키보드", "ThinkPad X1 Carbon"][groupIndex % 3],
      assetNo: `AI-2026-${String(groupIndex + 1).padStart(4, "0")}`,
      price: ["2690000", "89000", "1850000"][groupIndex % 3],
      tags: "본사|IT"
    };
  }
  function openBulkAnalyzeLoading(force = !1) {
    const targets = bulkActiveGroups().filter(g => force || !bulkRegister.results.has(g.id) || bulkRegister.dirtyGroups.has(g.id));
    if (!targets.length) return;
    const back = document.createElement("div");
    back.className = "modal-back", back.style.zIndex = 340;
    const qa = new URLSearchParams(location.search).get("qa") === "bulk-ai";
    back.innerHTML = `<div class="modal sm bulk-ai-loading-modal" role="dialog" aria-modal="true" aria-label="AI 분석 중"><button type="button" data-close aria-label="분석 취소">×</button><div><span class="areg-ai-spinner" aria-hidden="true"></span><b>AI가 자산 사진을 분석하고 있습니다.</b></div>${qa ? '<div class="areg-ai-test-actions"><button class="btn" data-bulk-outcome="success">성공</button><button class="btn" data-bulk-outcome="review">정보 부족</button><button class="btn" data-bulk-outcome="error">분석 오류</button></div>' : ""}</div>`;
    let settled = !1;
    function close() {
      clearTimeout(bulkAnalyzeTimer), bulkAnalyzeTimer = null, back.remove();
    }
    function finish(outcome) {
      if (settled) return;
      if (settled = !0, close(), outcome === "error") {
        targets.forEach(g => bulkRegister.dirtyGroups.add(g.id)), renderBulkRegister(), toast("에러가 발생하였습니다. 잠시 후 다시 시도해보세요.");
        return;
      }
      const staged = /* @__PURE__ */new Map();
      targets.forEach((g, i) => {
        const values = analyzedBulkValues(bulkRegister.groups.indexOf(g));
        qa && i === 0 && new URLSearchParams(location.search).get("scenario") === "memo-over-limit" && (values.note = "메".repeat(501)), staged.set(g.id, {
          ...values,
          status: "success"
        }), outcome === "review" && i === 0 && staged.set(g.id, {
          ...values,
          category: "",
          status: "review"
        });
      }), staged.forEach((v, id) => {
        bulkRegister.results.set(id, v), bulkRegister.dirtyGroups.delete(id);
      }), bulkRegister.duplicateErrors.clear(), bulkRegister.selectedRows.clear(), bulkRegister.page = 1, bulkRegister.hasAnalyzed = !0, bulkRegister.errorsOnly = bulkErrorCount() > 0, renderBulkRegister();
    }
    back.querySelector("[data-close]").onclick = () => {
      settled = !0, close();
    }, back.querySelectorAll("[data-bulk-outcome]").forEach(b => b.onclick = () => finish(b.dataset.bulkOutcome)), document.body.appendChild(back), !qa && new URLSearchParams(location.search).get("hold") !== "loading" && (bulkAnalyzeTimer = setTimeout(() => finish("success"), 1100));
  }
  function bindBulkResultInputs(content) {
    content.querySelectorAll('[data-result-extra]').forEach(el=>el.oninput=()=>{const result=bulkRegister.results.get(el.dataset.gid);result.extraValues||={};result.extraValues[el.dataset.resultExtra]=el.value;el.classList.toggle('is-error',el.value.length>100);content.querySelector('[data-bulk-save]').disabled=!bulkCanSave();});
    const checks = [...content.querySelectorAll("[data-result-check]")],
      all = content.querySelector("[data-result-all]"),
      syncSelection = () => {
        all && (all.checked = checks.length > 0 && checks.every(c => bulkRegister.selectedRows.has(c.dataset.resultCheck)), all.indeterminate = !all.checked && checks.some(c => bulkRegister.selectedRows.has(c.dataset.resultCheck)));
        const del2 = content.querySelector("[data-result-delete]");
        del2 && (del2.disabled = !bulkRegister.selectedRows.size);
      };
    checks.forEach(c => c.onchange = () => {
      c.checked ? bulkRegister.selectedRows.add(c.dataset.resultCheck) : bulkRegister.selectedRows.delete(c.dataset.resultCheck), syncSelection();
    }), all && (all.onchange = () => {
      checks.forEach(c => {
        c.checked = all.checked, c.checked ? bulkRegister.selectedRows.add(c.dataset.resultCheck) : bulkRegister.selectedRows.delete(c.dataset.resultCheck);
      }), syncSelection();
    }), syncSelection();
    const del = content.querySelector("[data-result-delete]");
    del && (del.onclick = () => openBulkDiscardConfirm(() => {
      bulkRegister.selectedRows.forEach(id => {
        bulkRegister.excluded.add(id), bulkRegister.dirtyGroups.delete(id);
      }), bulkRegister.selectedRows.clear(), bulkRegister.duplicateErrors.clear(), renderBulkRegister(), toast("삭제되었습니다.");
    }, {
      title: "삭제하시겠습니까?",
      body: "",
      confirmLabel: "삭제"
    }));
    const movePage = delta => {
        bulkRegister.page += delta, bulkRegister.selectedRows.clear(), renderBulkRegister();
      },
      prev = content.querySelector("[data-result-prev]"),
      next = content.querySelector("[data-result-next]"),
      size = content.querySelector("[data-result-size]");
    prev && (prev.onclick = () => movePage(-1)), next && (next.onclick = () => movePage(1)), size && (size.onchange = () => {
      bulkRegister.pageSize = Number(size.value), bulkRegister.page = 1, bulkRegister.selectedRows.clear(), renderBulkRegister();
    }), content.querySelectorAll("[data-calendar]").forEach(b => b.onclick = () => {
      const picker = content.querySelector(`[data-calendar-value="${b.dataset.calendar}"][data-gid="${b.dataset.gid}"]`),
        field = content.querySelector(`[data-result-field="${b.dataset.calendar}"][data-gid="${b.dataset.gid}"]`);
      picker.value = field.value.replaceAll(".", "-"), picker.showPicker();
    }), content.querySelectorAll("[data-calendar-value]").forEach(p => p.onchange = () => {
      updateBulkResult(p.dataset.gid, p.dataset.calendarValue, p.value.replaceAll("-", "."));
    });
    const errorsOnly = content.querySelector("[data-errors-only]");
    errorsOnly && (errorsOnly.onchange = () => {
      bulkRegister.errorsOnly = errorsOnly.checked, bulkRegister.page = 1, bulkRegister.selectedRows.clear(), renderBulkRegister();
    }), content.querySelectorAll("[data-pick-category]").forEach(button => button.onclick = () => openBulkCategoryModal(button.dataset.pickCategory)), content.querySelectorAll("[data-pick-tags]").forEach(button => button.onclick = () => openBulkTagModal(button.dataset.pickTags)), content.querySelectorAll("[data-pick-note]").forEach(button => button.onclick = () => {
      const result = bulkRegister.results.get(button.dataset.pickNote);
      result && window.AssetMemo.open({
        value: result.note || "",
        onSave: value => {
          updateBulkResult(button.dataset.pickNote, "note", value);
        }
      });
    }), content.querySelectorAll("[data-result-field]").forEach(field => {
      field.dataset.resultField === "price" && window.bindPurchasePriceInput(field);
      const update = () => {
        const result = bulkRegister.results.get(field.dataset.gid);
        if (!result) return;
        const key = field.dataset.resultField;
        if (key === "assetNo" && (field.value = field.value.replace(/[^A-Za-z0-9_-]/g, "")), key === "manufactured" || key === "purchaseDate" || key === "expiry") {
          const digits = field.value.replace(/\D/g, "").slice(0, key === "expiry" ? 8 : 6);
          field.value = key === "expiry" ? digits.length > 6 ? `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}` : digits.length > 4 ? `${digits.slice(0, 4)}.${digits.slice(4)}` : digits : digits.length > 4 ? `${digits.slice(0, 4)}.${digits.slice(4)}` : digits;
        }
        result[key] = field.value, (key === "product" || key === "assetNo") && bulkRegister.duplicateErrors.clear();
        const invalid = !!bulkInputErrors(result)[key];
        field.classList.toggle("is-error", invalid), field.setAttribute("aria-invalid", String(invalid)), field.closest("tr")?.classList.toggle("bulk-result-error", bulkResultHasError(result, field.dataset.gid)), result.status === "review" && !bulkResultHasError(result, field.dataset.gid) && (result.status = "success");
        const toggle = content.querySelector(".bulk-errors-toggle");
        toggle && (toggle.hidden = bulkErrorCount() === 0, toggle.hidden && (bulkRegister.errorsOnly = !1, toggle.querySelector("input").checked = !1));
        const save = content.querySelector("[data-bulk-save]");
        save && (save.disabled = !bulkCanSave());
      };
      field.oninput = update, field.onchange = () => {
        update(), renderBulkRegister();
      };
    });
  }
  function openBulkMenu(anchor) {
    document.querySelectorAll(".dropdown-menu, .hover-tip").forEach(m => m.remove());
    const actions = bulkActions();
    if (!actions.length) return;
    const menu = document.createElement("div");
    menu.className = "dropdown-menu", menu.innerHTML = actions.map(label => `<button type="button" data-bulk-action="${label}">${label}</button>`).join("");
    const r = anchor.getBoundingClientRect();
    menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;right:${window.innerWidth - r.right}px;min-width:${Math.max(r.width, 160)}px`, document.body.appendChild(menu);
    let tip = null;
    menu.querySelectorAll("button").forEach(b => {
      b.onclick = event => {
        if (event.stopPropagation(), b.dataset.bulkAction === "일괄 추가") {
          if (!canManageAssets()) return;
          menu.remove(), resetBulkRegister(), activeScreen = "bulk-register", render();
        } else if (b.dataset.bulkAction === "템플릿으로 배정") {
          menu.remove(), window.AssetTemplates.openTemplateAssign(() => render());
        } else toast("일괄 배정 화면은 기획서에서 확인해 주세요.");
      }, b.addEventListener("mouseenter", () => {
        if (b.dataset.bulkAction === "일괄 추가" || b.dataset.bulkAction === "템플릿으로 배정") return;
        tip = document.createElement("div"), tip.className = "hover-tip", tip.textContent = "PM: 기획서에서 명세 확인", document.body.appendChild(tip);
        const br = b.getBoundingClientRect();
        tip.style.cssText = `position:fixed;top:${br.top + br.height / 2}px;right:${window.innerWidth - br.left + 8}px;transform:translateY(-50%);`;
      }), b.addEventListener("mouseleave", () => {
        tip && (tip.remove(), tip = null);
      });
    }), setTimeout(() => {
      const close = e => {
        menu.contains(e.target) || (menu.remove(), tip && tip.remove(), document.removeEventListener("click", close));
      };
      document.addEventListener("click", close);
    });
  }
  function openFilterModal() {
    const draft = JSON.parse(JSON.stringify(state.filters));
    let group = "status",
      query = "";
    const GROUPS = [{
        k: "status",
        name: "상태"
      }, {
        k: "expiry",
        name: "유효기한"
      }, {
        k: "labels",
        name: "태그"
      }, {
        k: "note",
        name: "메모"
      }],
      SEARCHABLE = ["category", "labels"],
      summary = k => {
        let labels = [];
        if (k === "category" ? labels = draft.category.map(c => {
          const [g, s] = c.split("/");
          return s ? `${g} › ${s}` : g;
        }) : k === "type" ? labels = draft.type.map(v => TYPE_LABEL[v]) : k === "status" ? labels = draft.status.map(v => STATUS_LABEL[v][0]) : k === "expiry" ? labels = draft.expiry.map(v => EXP_LABEL[v]) : k === "labels" ? labels = draft.labels : k === "note" && (labels = draft.note.map(v => v === "has" ? "있음" : "없음")), !labels.length) return "";
        const rest = labels.length > 1 ? ` +${labels.length - 1}` : "";
        return `${labels[0]}${rest}`;
      };
    function visibleValues() {
      const q = query.trim().toLowerCase();
      if (group === "category") {
        const out = [];
        return CAT_GROUPS.forEach((subs, g) => {
          const groupMatches = !q || g.toLowerCase().includes(q),
            filtered = subs.filter(s => groupMatches || s.toLowerCase().includes(q));
          filtered.length && filtered.forEach(s => out.push(`${g}/${s}`));
        }), out;
      }
      return group === "type" ? Object.keys(TYPE_LABEL) : group === "status" ? STATUS_ORDER : group === "expiry" ? Object.keys(EXP_LABEL) : group === "note" ? ["has", "none"] : ALL_LABELS.filter(l => !q || l.toLowerCase().includes(q));
    }
    const back = modal(`
      <div class="modal lg">
        <h3>필터</h3>
        <div class="fmodal">
          <div class="groups" id="f-groups"></div>
          <div class="opts" id="f-opts"></div>
        </div>
        <div class="foot">
          <span class="sum" id="f-sum"></span>
          <button class="btn" data-close>취소</button>
          <button class="btn primary" id="f-apply">적용</button>
        </div>
      </div>`);
    function drawGroups() {
      back.querySelector("#f-groups").innerHTML = GROUPS.map(g => {
        const active = draft[g.k] && draft[g.k].length,
          s = summary(g.k);
        return `<button data-g="${g.k}" class="${g.k === group ? "active" : ""}">
          <span class="g-text">
            <span class="g-name">${g.name}</span>
            ${s ? `<span class="g-sum">${s}</span>` : ""}
          </span>
          ${active ? '<span class="dot"></span>' : ""}
        </button>`;
      }).join(""), back.querySelectorAll("#f-groups button").forEach(b => b.onclick = () => {
        group = b.dataset.g, query = "", drawGroups(), drawOpts();
      });
    }
    function optRow(checked, label, val, cls = "") {
      return `<label class="opt ${cls}"><input type="checkbox" data-v="${val}" ${checked ? "checked" : ""}>${label}</label>`;
    }
    function drawOpts() {
      const box = back.querySelector("#f-opts"),
        showSearch = SEARCHABLE.includes(group);
      box.innerHTML = `
        ${showSearch ? `<input type="text" class="picker-search" id="f-search" placeholder="검색" value="${query.replace(/"/g, "&quot;")}">` : ""}
        <div id="f-dynamic"></div>
      `, showSearch && (box.querySelector("#f-search").oninput = e => {
        query = e.target.value, renderDynamic();
      }), renderDynamic();
    }
    function renderDynamic() {
      const dyn = back.querySelector("#f-dynamic"),
        q = query.trim().toLowerCase();
      let listHtml = "";
      if (group === "category") listHtml = [...CAT_GROUPS.entries()].map(([g, subs]) => {
        const groupMatches = !q || g.toLowerCase().includes(q),
          filtered = subs.filter(s => groupMatches || s.toLowerCase().includes(q));
        if (!filtered.length) return "";
        const all = filtered.map(s => `${g}/${s}`).every(k => draft.category.includes(k)),
          parent = groupMatches ? optRow(all, `<b>${g}</b>`, `grp:${g}`) : "",
          kids = filtered.map(s => optRow(draft.category.includes(`${g}/${s}`), s, `${g}/${s}`, groupMatches ? "child" : "")).join("");
        return parent + kids;
      }).join(""), listHtml || (listHtml = `<p class="muted" style="padding:12px 2px">${CAT_GROUPS.size ? "결과가 없습니다." : "표시할 목록이 없습니다."}</p>`);else if (group === "type") listHtml = Object.entries(TYPE_LABEL).map(([v, l]) => optRow(draft.type.includes(v), l, v)).join("");else if (group === "status") listHtml = STATUS_ORDER.map(v => optRow(draft.status.includes(v), STATUS_LABEL[v][0], v)).join("");else if (group === "expiry") listHtml = Object.entries(EXP_LABEL).map(([v, l]) => optRow(draft.expiry.includes(v), l, v)).join("");else if (group === "labels") {
        const filtered = ALL_LABELS.filter(l => !q || l.toLowerCase().includes(q));
        listHtml = filtered.length ? filtered.map(l => optRow(draft.labels.includes(l), l, l)).join("") : `<p class="muted" style="padding:12px 2px">${ALL_LABELS.length ? "결과가 없습니다." : "표시할 목록이 없습니다."}</p>`;
      } else group === "note" && (listHtml = [{
        v: "has",
        l: "있음"
      }, {
        v: "none",
        l: "없음"
      }].map(o => optRow(draft.note.includes(o.v), o.l, o.v)).join(""));
      const vis = visibleValues(),
        allChecked = vis.length > 0 && vis.every(v => (draft[group] || []).includes(v));
      dyn.innerHTML = `
        <div class="picker-toolbar">
          <label class="picker-check"><input type="checkbox" id="f-select-all" ${allChecked ? "checked" : ""}><span>전체</span></label>
          <span class="right"><button class="filter-reset" id="f-group-reset" aria-label="이 항목 초기화">${RESET_ICON}</button></span>
        </div>
        ${listHtml}
      `, dyn.querySelector("#f-select-all").onchange = e => {
        const vals = visibleValues();
        draft[group] = e.target.checked ? [... /* @__PURE__ */new Set([...draft[group], ...vals])] : draft[group].filter(v => !vals.includes(v)), renderDynamic(), drawGroups(), drawSum();
      }, dyn.querySelector("#f-group-reset").onclick = () => {
        draft[group] = [], renderDynamic(), drawGroups(), drawSum();
      }, dyn.querySelectorAll("input[type=checkbox][data-v]").forEach(cb => cb.onchange = () => {
        const v = cb.dataset.v;
        if (group === "category") {
          if (v.startsWith("grp:")) {
            const g = v.slice(4),
              keys = CAT_GROUPS.get(g).filter(sub => !query || g.toLowerCase().includes(query.toLowerCase()) || sub.toLowerCase().includes(query.toLowerCase())).map(sub => `${g}/${sub}`);
            draft.category = cb.checked ? [... /* @__PURE__ */new Set([...draft.category, ...keys])] : draft.category.filter(k => !keys.includes(k));
          } else draft.category = cb.checked ? [...draft.category, v] : draft.category.filter(k => k !== v);
        } else {
          const arr = draft[group];
          draft[group] = cb.checked ? [...arr, v] : arr.filter(x => x !== v);
        }
        renderDynamic(), drawGroups(), drawSum();
      }), drawSum();
    }
    function drawSum() {
      const n = GROUPS.reduce((sum, g) => sum + (draft[g.k] || []).length, 0);
      back.querySelector("#f-sum").textContent = `선택됨 ${n}`;
    }
    back.querySelector("#f-apply").onclick = () => {
      state.filters = draft, state.statFilter = null, state.page = 1, back.remove(), render();
    }, drawGroups(), drawOpts();
  }
  function openCategoryFilterModal() {
    const groups = /* @__PURE__ */new Map();
    viewableCategories().filter(cat => cat.type === state.productType).forEach(cat => {
      groups.has(cat.group) || groups.set(cat.group, []), groups.get(cat.group).push(cat.sub);
    });
    const draft = [...(classificationScopes[state.view]||[])];
    let query = "";
    function optRow(checked, label, val, cls = "") {
      return `<label class="opt ${cls}"><input type="checkbox" data-v="${val}" ${checked ? "checked" : ""}>${label}</label>`;
    }
    function visibleValues() {
      const q = query.trim().toLowerCase(),
        out = [];
      return groups.forEach((subs, g) => {
        const groupMatches = !q || g.toLowerCase().includes(q),
          filtered = subs.filter(s => groupMatches || s.toLowerCase().includes(q));
        filtered.length && filtered.forEach(s => out.push(`${g}/${s}`));
      }), out;
    }
    if (!groups.size) return modal(`
        <div class="modal">
          <h3>분류</h3>
          <div class="body">
            <p class="muted" style="padding:24px 2px;text-align:center">표시할 목록이 없습니다.</p>
          </div>
          <div class="foot">
            <button class="btn" data-close>취소</button>
            <button class="btn primary" id="cf-apply" disabled>적용</button>
          </div>
        </div>`);
    const back = modal(`
      <div class="modal">
        <h3>분류</h3>
        <div class="body">
          <input type="text" class="picker-search" id="cf-search" placeholder="검색">
          <div id="cf-dynamic" style="margin-top:10px"></div>
        </div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" id="cf-apply">적용</button>
        </div>
      </div>`);
    function renderList() {
      let listHtml = [...groups.entries()].map(([g, subs]) => {
        const q = query.trim().toLowerCase(),
          groupMatches = !q || g.toLowerCase().includes(q),
          filtered = subs.filter(s => groupMatches || s.toLowerCase().includes(q));
        if (!filtered.length) return "";
        const all = filtered.map(s => `${g}/${s}`).every(k => draft.includes(k)),
          parent = groupMatches ? optRow(all, `<b>${g}</b>`, `grp:${g}`) : "",
          kids = filtered.map(s => optRow(draft.includes(`${g}/${s}`), s, `${g}/${s}`, groupMatches ? "child" : "")).join("");
        return parent + kids;
      }).join("");
      listHtml || (listHtml = `<p class="muted" style="padding:12px 2px">${CAT_GROUPS.size ? "결과가 없습니다." : "표시할 목록이 없습니다."}</p>`);
      const vis = visibleValues(),
        allChecked = vis.length > 0 && vis.every(v => draft.includes(v)),
        dyn = back.querySelector("#cf-dynamic");
      dyn.innerHTML = `
        <div class="picker-toolbar">
          <label class="picker-check"><input type="checkbox" id="cf-select-all" ${allChecked ? "checked" : ""}><span>전체</span></label>
          <span class="right"><button class="filter-reset" id="cf-reset" aria-label="초기화">${RESET_ICON}</button></span>
        </div>
        ${listHtml}
      `, dyn.querySelector("#cf-select-all").onchange = e => {
        const vals = visibleValues();
        e.target.checked ? vals.forEach(v => {
          draft.includes(v) || draft.push(v);
        }) : vals.forEach(v => {
          const i = draft.indexOf(v);
          i > -1 && draft.splice(i, 1);
        }), renderList();
      }, dyn.querySelector("#cf-reset").onclick = () => {
        draft.length = 0, renderList();
      }, dyn.querySelectorAll("input[type=checkbox][data-v]").forEach(cb => cb.onchange = () => {
        const v = cb.dataset.v;
        if (v.startsWith("grp:")) {
          const g = v.slice(4),
            keys = groups.get(g).filter(sub => !query || g.toLowerCase().includes(query.toLowerCase()) || sub.toLowerCase().includes(query.toLowerCase())).map(sub => `${g}/${sub}`);
          cb.checked ? keys.forEach(k => {
            draft.includes(k) || draft.push(k);
          }) : keys.forEach(k => {
            const i = draft.indexOf(k);
            i > -1 && draft.splice(i, 1);
          });
        } else if (cb.checked) draft.push(v);else {
          const i = draft.indexOf(v);
          i > -1 && draft.splice(i, 1);
        }
        renderList();
      });
    }
    renderList(), back.querySelector("#cf-search").oninput = e => {
      query = e.target.value, renderList();
    }, back.querySelector("#cf-apply").onclick = () => {
      const ordered=viewableCategories().map(c=>`${c.group}/${c.sub}`),picked=ordered.filter(key=>draft.includes(key));
      classificationScopes[state.view]=picked.length===ordered.length?[]:picked;
      try{localStorage.setItem(scopeStorageKey(state.view),JSON.stringify(classificationScopes[state.view]));}catch{}
      state.statFilter=null;state.page=1;back.remove();render();
    };
  }
  function openMemberFilterModal() {
    let cat = "그룹";
    function nodeRow(n, isChild) {
      const kids = n.children ? n.children.map(c => nodeRow(c, !0)).join("") : "";
      return `<label class="opt ${isChild ? "child" : ""}"><input type="checkbox" checked>${n.name}</label>${kids}`;
    }
    function optsHtml() {
      return cat === "그룹" ? MEMBER_GROUP_TREE.map(n => nodeRow(n, !1)).join("") : MEMBER_JOB_TITLES.map(j => `<label class="opt"><input type="checkbox" checked>${j}</label>`).join("");
    }
    const back = modal(`
      <div class="modal lg">
        <h3>직원 필터</h3>
        <div class="fmodal">
          <div class="groups" id="mf-groups">
            ${["그룹", "직무/직급"].map(g => `<button data-g="${g}" class="${g === cat ? "active" : ""}">
              <span class="g-text"><span class="g-name">${g}</span></span>
            </button>`).join("")}
          </div>
          <div class="opts">
            <input type="text" class="picker-search" placeholder="검색">
            <div class="picker-toolbar">
              <label class="picker-check"><input type="checkbox" checked><span>하위그룹도 한번에 체크</span></label>
              <span class="right"><button class="filter-reset" aria-label="초기화">${RESET_ICON}</button></span>
            </div>
            <div id="mf-opts-list">${optsHtml()}</div>
          </div>
        </div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" id="mf-apply">적용</button>
        </div>
      </div>`);
    back.querySelectorAll("#mf-groups button").forEach(b => b.onclick = () => {
      cat = b.dataset.g, back.querySelectorAll("#mf-groups button").forEach(x => x.classList.toggle("active", x === b)), back.querySelector("#mf-opts-list").innerHTML = optsHtml();
    }), back.querySelector("#mf-apply").onclick = () => {
      back.remove(), toast('"직원 필터" 적용 (프로토타입 — 실제 반영 없음)');
    };
  }
  const WS_PROVINCES = ["도 미지정", "강원도", "경기도", "경상남도", "경상북도", "광주광역시", "대구광역시", "대전광역시", "부산광역시", "서울특별시", "세종특별자치시", "울산광역시", "인천광역시", "전라남도", "전라북도", "제주특별자치도", "충청남도", "충청북도"];
  function openWorksiteFilterModal() {
    const back = modal(`
      <div class="modal lg">
        <h3>근무지 필터</h3>
        <div class="fmodal">
          <div class="groups" id="wf-groups">
            <button class="active"><span class="g-text"><span class="g-name">도</span></span></button>
          </div>
          <div class="opts">
            <input type="text" class="picker-search" placeholder="검색">
            <div class="picker-toolbar">
              <label class="picker-check"><input type="checkbox" checked><span>전체</span></label>
              <span class="right"><button class="filter-reset" aria-label="초기화">${RESET_ICON}</button></span>
            </div>
            <div>${WS_PROVINCES.map(p => `<label class="opt"><input type="checkbox" checked>${p}</label>`).join("")}</div>
          </div>
        </div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" id="wf-apply">적용</button>
        </div>
      </div>`);
    back.querySelector("#wf-apply").onclick = () => {
      back.remove(), toast('"근무지 필터" 적용 (프로토타입 — 실제 반영 없음)');
    };
  }
  function modal(html, {
    closeOnBackdrop = !1
  } = {}) {
    const back = document.createElement("div");
    return back.className = "modal-back", back.innerHTML = html, back.addEventListener("click", e => {
      closeOnBackdrop && e.target === back && back.remove();
    }), back.querySelectorAll("[data-close]").forEach(b => b.onclick = () => back.remove()), document.body.appendChild(back), back;
  }
  function openQrDownloadModal() {
    const list = getFiltered().sort((a, b) => a.product.localeCompare(b.product, "ko")),
      PAGE_SIZE = 20;
    let query = "",
      page = 1;
    const sel = /* @__PURE__ */new Set();
    function filteredList() {
      const q = query.trim().toLowerCase();
      return q ? list.filter(a => `${a.product} ${a.assetNo || ""}`.toLowerCase().includes(q)) : list;
    }
    const m = modal(`
      <div class="modal lg">
        <h3>QR 다운로드</h3>
        <div class="body" style="display:flex;flex-direction:column;max-height:56vh">
          <input type="text" class="picker-search" id="qr-search" placeholder="고유관리번호/품목명">
          <div class="picker-toolbar">
            <label class="picker-check"><input type="checkbox" id="qr-page-all"><span>현재 페이지 전체 선택</span></label>
          </div>
          <div id="qr-rows" style="flex:1;min-height:0;overflow-y:auto"></div>
          <div class="pager" id="qr-pager" style="padding-top:10px"></div>
        </div>
        <div class="foot" style="flex-direction:column;align-items:stretch;gap:8px">
          <span class="sum" id="qr-sum">선택됨 0</span>
          <div style="display:flex;justify-content:flex-end;gap:8px">
            <button class="btn" data-close>취소</button>
            <button class="btn primary" id="qr-go" disabled>다운로드</button>
          </div>
        </div>
      </div>`);
    m.querySelector("#qr-search").oninput = e => {
      query = e.target.value, page = 1, renderList();
    };
    function renderList() {
      const fl = filteredList(),
        totalPages = Math.max(1, Math.ceil(fl.length / PAGE_SIZE));
      page > totalPages && (page = totalPages);
      const pageItems = fl.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
        rowsEl = m.querySelector("#qr-rows");
      rowsEl.innerHTML = pageItems.map(a => `<label class="picker-member-row">
        <input type="checkbox" data-id="${a.id}" ${sel.has(a.id) ? "checked" : ""}>
        <span class="picker-member-info" style="flex:1">
          <b>${a.product}</b><span>${a.assetNo || "—"}</span>
        </span>
        <span class="muted">${a.group} › ${a.sub}</span>
      </label>`).join("") || '<p class="muted" style="padding:16px 0">대상 자산이 없습니다.</p>';
      const pageAllChecked = pageItems.length > 0 && pageItems.every(a => sel.has(a.id));
      m.querySelector("#qr-page-all").checked = pageAllChecked, m.querySelector("#qr-page-all").onchange = e => {
        pageItems.forEach(a => e.target.checked ? sel.add(a.id) : sel.delete(a.id)), renderList();
      }, rowsEl.querySelectorAll("input[data-id]").forEach(cb => cb.onchange = () => {
        cb.checked ? sel.add(cb.dataset.id) : sel.delete(cb.dataset.id), renderList();
      }), m.querySelector("#qr-pager").innerHTML = `
        <button data-qp="prev" ${page === 1 ? "disabled" : ""}>‹</button>
        <span style="padding:0 6px;font-size:12.5px;color:var(--text-sub)">${page} / ${totalPages}</span>
        <button data-qp="next" ${page === totalPages ? "disabled" : ""}>›</button>
      `, m.querySelectorAll("[data-qp]").forEach(b => b.onclick = () => {
        page += b.dataset.qp === "prev" ? -1 : 1, renderList();
      }), m.querySelector("#qr-sum").textContent = `선택됨 ${sel.size}`, m.querySelector("#qr-go").disabled = sel.size === 0;
    }
    m.querySelector("#qr-go").onclick = () => {
      const items = list.filter(a => sel.has(a.id)),
        d = /* @__PURE__ */new Date(),
        p2 = n => String(n).padStart(2, "0"),
        ts = `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}_${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`;
      if (items.length === 1) {
        const a = [...items].sort((a2, b) => String(a2.assetNo || "").localeCompare(String(b.assetNo || ""))).find(a2 => window.assetPhotos(a2).length) || items[0],
          label = a.assetNo || a.id,
          fileName = window.assetDownloadFileName(`QR_${label}_${ts}.png`);
        toast(`"${fileName}" 다운로드 (프로토타입 — 반영 없음)`);
      } else toast(`"Asset_QR_${ts}.zip" (${items.length}건) 다운로드 (프로토타입 — 반영 없음)`);
      m.remove();
    }, renderList();
  }
  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg, t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:200;box-shadow:0 8px 24px rgba(0,0,0,.25)", document.body.appendChild(t), setTimeout(() => t.remove(), 1800);
  }
  window.AssetsScreen = {
    render
  };
})();
