/* 분류 관리 — 분류-1 메인 화면. 좌측 트리(대분류는 그룹 헤더, 소분류만 선택 가능) + 우측(선택된 소분류 정보 + 품목 목록) */
(function () {
  const { categories, assets } = window.DATA;

  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300";
    document.body.appendChild(t); setTimeout(() => t.remove(), 1800);
  }
  function confirmModal(title, body, onOk) {
    const cb = document.createElement("div");
    cb.className = "modal-back";
    cb.style.zIndex = 340;
    cb.innerHTML = `
      <div class="modal" style="width:380px">
        <div class="body" style="padding-top:20px">
          <p style="font-size:14px;font-weight:700;margin-bottom:6px">${title}</p>
          <p class="hint" style="margin-top:0">${body}</p>
        </div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn primary" data-cok>확인</button>
        </div>
      </div>`;
    cb.addEventListener("click", e => { if (e.target === cb) cb.remove(); });
    cb.querySelector("[data-cclose]").onclick = () => cb.remove();
    cb.querySelector("[data-cok]").onclick = () => { cb.remove(); onOk(); };
    document.body.appendChild(cb);
  }
  const TRASH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M9.5 7l.7 13a1 1 0 0 0 1 1h5.6a1 1 0 0 0 1-1l.7-13"/></svg>`;
  const HANDLE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`;
  const BACK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>`;
  const CLOSE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
  const RESET_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 1 2.64 6.36"/><path d="M3 20v-6h6"/></svg>`;
  const INFO_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8v.01"/></svg>`;

  // 자산 조회·배정/보유 변경 권한 옵션 — 구조설계안 4.3. assign은 항상 view 범위의 부분집합(표에 정의된 선택 가능 범위/기본값 그대로 반영)
  const VIEW_OPTIONS = ["회사의 모든 구성원", "모든 관리자 및 리더", "특정 그룹 및 직무/직급", "특정 관리자/리더", "관리자만"];
  const ASSIGN_BY_VIEW = {
    "회사의 모든 구성원": { options: VIEW_OPTIONS, default: "모든 관리자 및 리더" },
    "모든 관리자 및 리더": { options: ["모든 관리자 및 리더", "특정 그룹 및 직무/직급", "특정 관리자/리더", "관리자만"], default: "모든 관리자 및 리더" },
    "특정 그룹 및 직무/직급": { options: ["특정 그룹 및 직무/직급"], default: "특정 그룹 및 직무/직급" },
    "특정 관리자/리더": { options: ["특정 관리자/리더"], default: "특정 관리자/리더" },
    "관리자만": { options: ["관리자만", "특정 관리자/리더"], default: "관리자만" },
  };
  const TARGET_NEEDED = new Set(["특정 그룹 및 직무/직급", "특정 관리자/리더"]);

  // 권한 대상 선택(그룹/직무/직급·구성원 선택 모달)용 샘플 데이터 — 실제 조직도 연동 전, 프로토타입 데모용
  const GROUP_TREE = [
    { name: "샤플앤컴퍼니", children: [
      { name: "개발팀" },
      { name: "디자인팀" },
      { name: "영업팀", children: [{ name: "국내영업" }, { name: "해외영업" }] },
      { name: "운영팀" },
      { name: "CS팀" },
    ] },
  ];
  const JOB_TITLES = ["직무/직급 없음", "팀장", "매니저", "주임", "사원"];
  const MEMBERS = [
    { name: "김민수", team: "개발팀" }, { name: "이서연", team: "디자인팀" }, { name: "박지훈", team: "영업팀" },
    { name: "정우성", team: "CS팀" }, { name: "김철수", team: "운영팀" }, { name: "최유진", team: "개발팀" },
    { name: "한소희", team: "디자인팀" }, { name: "장민호", team: "국내영업" }, { name: "오세훈", team: "운영팀" },
    { name: "배수지", team: "CS팀" }, { name: "윤재현", team: "해외영업" }, { name: "임하늘", team: "개발팀" },
  ];
  const AVATAR_COLORS = ["#5b8def", "#8f6ef0", "#eb7f8b", "#3fb37f", "#e0a63c", "#4dabf7"];
  function avatarColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
  }
  // 구조설계안 3.3: 필드 노출 설정 대상은 S/N·IMEI·구매일·구매가격·제조연월일·유효기한 6개(IMEI·S/N은 개별형 전용) — 기본값: IMEI·유효기한 off, 나머지 on
  const FIELD_LABEL = { serial: "S/N", imei: "IMEI", purchaseDate: "구매일", purchasePrice: "구매가격", manufactured: "제조연월일", expiry: "유효기한" };
  const DEFAULT_HIDDEN_FIELDS = { individual: ["imei", "expiry"], quantity: ["expiry"] };
  // 배정/보유 변경 권한 — 개별형은 "배정", 수량형은 "보유"로 부르는 게 구조설계안 4.3 표현과도 맞고,
  // 화면이 항상 하나의 자산 유형으로 스코프돼 있으니(소분류 상세·생성/수정 폼) 더 정확하게 부를 수 있음
  const assignLabel = type => type === "individual" ? "배정 변경 권한" : "보유 변경 권한";
  // 배정/보유 변경 권한 대상은 조회 권한 대상의 부분집합이어야 함(구조설계안 4.3) — 대상 선택 모달에서 비활성 처리할 때 쓰는 안내 문구
  const RESTRICT_TIP = "변경 권한을 부여하려면 먼저 조회 권한이 부여되어야 합니다.";

  const assetsOf = (group, sub) => assets.filter(a => a.group === group && a.sub === sub);

  // 대분류별 접기/펼치기 상태 — 기본은 전부 펼쳐진 상태(Set이 비어있으면 전부 펼침), render() 사이에도 유지됨
  const collapsedGroups = new Set();

  // 대분류 등장 순서대로 그룹핑(소분류는 categories 배열 순서 그대로). 소분류가 아직 없는 대분류(emptyGroups)도 포함
  function groupsOf() {
    const order = [];
    const map = {};
    categories.forEach(c => {
      if (!map[c.group]) { map[c.group] = []; order.push(c.group); }
      map[c.group].push(c);
    });
    (window.DATA.emptyGroups || []).forEach(g => {
      if (!map[g]) { map[g] = []; order.push(g); }
    });
    return order.map(group => ({ group, subs: map[group] }));
  }
  function firstSelectable(groups) {
    for (const g of groups) if (g.subs.length) return { group: g.group, sub: g.subs[0].sub };
    return null;
  }

  function treeHtml(groups, sel) {
    const head = `
      <div class="cat-tree-head">
        <button class="btn sm" data-manage>분류 관리</button>
      </div>`;
    const body = groups.map(({ group, subs }) => {
      const collapsed = collapsedGroups.has(group);
      return `
      <div class="cat-tree-group">
        <button class="cat-tree-label" data-toggle="${group}">
          <span class="cat-tree-chevron">${collapsed ? "▸" : "▾"}</span>${group}
        </button>
        ${collapsed ? "" : (subs.length ? subs.map(s => `
          <button class="cat-tree-item${sel && sel.group === group && sel.sub === s.sub ? " active" : ""}"
                  data-tree="${group}|${s.sub}">
            ${s.sub}<span class="cat-tree-count">${assetsOf(group, s.sub).length}</span>
          </button>`).join("") : '<p class="cat-tree-empty">소분류 없음</p>')}
      </div>`;
    }).join("");
    return head + body;
  }

  // 개별형 자산 목록을 품목(품목명) 단위로 집계 — 품목 식별키는 구조안 3.1과 동일하게 "소분류+품목명".
  // 이미 소분류 하나로 좁혀진 목록이라 정렬은 품목명순만 적용(현황 화면 정렬 정책의 2단계와 동일)
  function productsOf(group, sub) {
    const list = assetsOf(group, sub);
    const order = [];
    const map = {};
    list.forEach(a => {
      if (!map[a.product]) { map[a.product] = []; order.push(a.product); }
      map[a.product].push(a);
    });
    order.sort((a, b) => a.localeCompare(b, "ko"));
    return order.map(product => {
      const items = map[product];
      const assigned = items.filter(a => a.status === "assigned").length;
      const stock = items.filter(a => a.status === "stock").length;
      const repair = items.filter(a => a.status === "repair").length;
      const lost = items.filter(a => a.status === "lost").length;
      const disposed = items.filter(a => a.status === "disposed").length;
      return { product, items, total: items.length, assigned, stock, repair, lost, disposed };
    });
  }

  // 현황(assets.js)의 thumb()와 동일 — 대표 사진(window.assetPhotos, data.js 공유)을 품목명 옆에 표시
  function thumb(a) {
    const ph = window.assetPhotos(a);
    if (ph.length) {
      const c = ph[a._primary || 0].color;
      return `<span class="thumb" style="background:${c}"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="m21 16-5-5-9 8"/></svg></span>`;
    }
    return `<span class="thumb empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-4 4 3 4-4 5 4"/></svg></span>`;
  }
  function prodCell(a, name) {
    return `<div class="prodcell">${thumb(a)}<span class="pname">${name}</span></div>`;
  }

  function productRowHtml(p) {
    return `
      <tr class="clickable cat-prod-row" data-product="${p.product}">
        <td>${prodCell(p.items[0], p.product)}</td>
        <td class="num">${p.total}</td>
        <td class="num">${p.assigned}</td>
        <td class="num">${p.stock}</td>
        <td class="num">${p.repair}</td>
        <td class="num">${p.lost}</td>
        <td class="num">${p.disposed}</td>
      </tr>`;
  }

  function stockRowHtml(a) {
    const qty = (a.stocks || []).reduce((s, x) => s + x.qty, 0);
    const targets = (a.stocks || []).length;
    return `
      <tr class="clickable" data-asset="${a.id}">
        <td>${prodCell(a, a.product)}</td>
        <td class="num">${a.totalQty}</td>
        <td class="num">${qty}</td>
        <td class="num">${a.totalQty - qty}</td>
        <td class="num">${targets}</td>
        <td>${a.expiry ? window.fmtDate(a.expiry) : '<span class="muted">—</span>'}</td>
      </tr>`;
  }

  // 관리 정보 — 소분류 필드 노출 설정(구조안 3.3)을 전체 필드 대비 on/off 라벨로 표시. S/N·IMEI는 개별형에만 해당하는 필드라 수량형엔 안 보여줌
  const fieldsForType = type => type === "individual"
    ? ["serial", "imei", "purchaseDate", "purchasePrice", "manufactured", "expiry"]
    : ["purchaseDate", "purchasePrice", "manufactured", "expiry"];

  function usageInfoHtml(cat) {
    const hidden = cat.hiddenFields || [];
    const fields = fieldsForType(cat.type);
    return fields.map(f => {
      const on = !hidden.includes(f);
      return `<span class="usebullet ${on ? "on" : "off"}">${FIELD_LABEL[f]}</span>`;
    }).join("");
  }

  // 현황 페이지 검색창(searchbox/search/search-clear)과 동일한 패턴 — 평소엔 좁고 "검색", 포커스하면 넓어지며 "품목명"
  const ASSET_SEARCH_HTML = `
    <div class="cat-asset-search">
      <div class="searchbox">
        <input class="search" type="text" data-product-search placeholder="검색">
        <button class="search-clear" type="button" data-product-search-clear aria-label="검색어 지우기">✕</button>
      </div>
    </div>`;
  const assetEmptyHtml = () => `
    <div class="cat-asset-empty">
      <p class="muted">등록된 자산이 없습니다.</p>
      <button class="btn sm" data-add-asset>자산 추가</button>
    </div>`;

  function assetSectionHtml(cat) {
    if (cat.type === "individual") {
      const products = productsOf(cat.group, cat.sub);
      const total = products.reduce((s, p) => s + p.total, 0);
      return `
        <div class="cat-asset-head">
          <h4>품목 목록</h4>
        </div>
        <div class="cat-asset-countrow">
          <p class="cat-asset-count">전체 ${total}</p>
          ${products.length ? ASSET_SEARCH_HTML : ""}
        </div>
        ${products.length ? `
          <div class="table-wrap">
            <table class="cat-asset-table">
              <thead><tr><th>품목명</th><th class="num">자산 수</th><th class="num">배정 중</th><th class="num">재고</th><th class="num">수리 중</th><th class="num">분실</th><th class="num">폐기</th></tr></thead>
              <tbody>${products.map(productRowHtml).join("")}</tbody>
            </table>
          </div>
          <p class="muted" data-search-empty hidden style="padding:12px 0">결과가 없습니다.</p>` : assetEmptyHtml()}`;
    }
    // 이미 소분류 하나로 좁혀진 목록이라 정렬은 품목명순만 적용(개별형 productsOf()와 동일 원칙)
    const list = [...assetsOf(cat.group, cat.sub)].sort((a, b) => a.product.localeCompare(b.product, "ko"));
    return `
      <div class="cat-asset-head">
        <h4>품목 목록</h4>
      </div>
      <div class="cat-asset-countrow">
        <p class="cat-asset-count">전체 ${list.length}</p>
        ${list.length ? ASSET_SEARCH_HTML : ""}
      </div>
      ${list.length ? `
        <div class="table-wrap">
          <table class="cat-asset-table">
            <thead><tr><th>품목명</th><th class="num">전체 수량</th><th class="num">보유 수량</th><th class="num">잔여 수량</th><th class="num">보유 대상</th><th>유효기한</th></tr></thead>
            <tbody>${list.map(stockRowHtml).join("")}</tbody>
          </table>
        </div>
        <p class="muted" data-search-empty hidden style="padding:12px 0">결과가 없습니다.</p>` : assetEmptyHtml()}`;
  }

  function detailHtml(cat) {
    return `
      <div class="cat-detail-head">
        <h3>${cat.sub} <span class="type-pill">${cat.type === "individual" ? "개별 자산" : "수량 자산"}</span></h3>
        <div class="cat-detail-acts"><button class="btn sm" data-edit-sub>수정</button></div>
      </div>
      <div class="kv2 cat-detail-kv">
        <div><div class="k">자산 조회 권한</div><div class="v">${cat.view}</div></div>
        <div><div class="k">${assignLabel(cat.type)}</div><div class="v">${cat.assign}</div></div>
      </div>
      <div class="cat-usage">
        <div class="k">관리 정보</div>
        <div class="cat-usage-bullets">${usageInfoHtml(cat)}</div>
      </div>
      ${assetSectionHtml(cat)}
    `;
  }

  // 소분류 생성/수정 폼 — 둘 다 이 함수 하나로 렌더링(소분류 생성 화면 vs [수정] 모달이 필드 구성은 완전히 동일하고
  // 뒤로가기 유무·모달 타이틀만 다름). state: { name, type, view, assign, viewTarget, assignTarget, hiddenFields }
  // opts: { groupLabel, typeLocked, onNameChange(valid) }
  function renderSubForm(container, state, opts) {
    const typeLocked = !!opts.typeLocked;
    container.innerHTML = `
      <div class="field">
        <label>대분류</label>
        <p class="field-static">${opts.groupLabel}</p>
      </div>
      <div class="field">
        <label>소분류명<span class="req">*</span></label>
        <input type="text" class="cat-manage-input" data-f-name value="${state.name}" placeholder="입력" maxlength="30" style="width:100%">
        <p class="field-err" data-f-name-err hidden>동일한 명칭이 존재합니다.</p>
      </div>
      <div class="field">
        <label>자산 유형<span class="req">*</span> <button type="button" class="help-icon" data-f-type-help aria-label="자산 유형 도움말">?</button></label>
        ${typeLocked ? `
          <p class="field-static">${state.type === "individual" ? "개별 자산" : "수량 자산"}</p>
          <p class="hint" style="margin:4px 0 0">등록된 자산이 있어 자산 유형을 변경할 수 없습니다.</p>
        ` : `
          <div class="seg" data-f-type>
            <button type="button" data-val="individual" class="${state.type === "individual" ? "active" : ""}">개별 자산</button>
            <button type="button" data-val="quantity" class="${state.type === "quantity" ? "active" : ""}">수량 자산</button>
          </div>
        `}
      </div>
      <div class="field">
        <label>자산 조회 권한<span class="req">*</span></label>
        <p class="hint" style="margin-top:0;margin-bottom:8px">이 소분류의 자산을 조회할 수 있는 대상을 설정합니다.</p>
        <button type="button" class="cat-manage-select-btn" data-f-view-btn><span>${state.view}</span><span class="chev">▾</span></button>
      </div>
      <div class="field">
        <label>${assignLabel(state.type)}<span class="req">*</span></label>
        <p class="hint" style="margin-top:0;margin-bottom:8px">이 소분류의 자산에 대해 ${state.type === "individual" ? "배정" : "보유"} 변경을 할 수 있는 대상을 설정합니다.</p>
        <button type="button" class="cat-manage-select-btn" data-f-assign-btn><span>${state.assign}</span><span class="chev">▾</span></button>
      </div>
      <div class="field">
        <label>관리 정보</label>
        <p class="hint" style="margin-top:0;margin-bottom:10px">이 소분류의 자산 관리에 필요한 정보만 사용하도록 설정합니다.</p>
        <div class="cat-manage-fieldlist" data-f-fields>
          ${fieldsForType(state.type).map(f => `
            <div class="cat-manage-fieldrow">
              <span>${FIELD_LABEL[f]}</span>
              <button type="button" class="toggle-switch${state.hiddenFields.includes(f) ? "" : " on"}" data-field="${f}" role="switch" aria-checked="${!state.hiddenFields.includes(f)}" aria-label="${FIELD_LABEL[f]} 노출"><span class="toggle-knob"></span></button>
            </div>`).join("")}
        </div>
      </div>`;

    // 소분류명은 같은 대분류 안에서만 유일하면 되도록 검증(다른 대분류의 동명 소분류는 무관 — 항상 "대분류 › 소분류"로 노출돼 혼동 없음)
    const nameInputEl = container.querySelector("[data-f-name]");
    const nameErrEl = container.querySelector("[data-f-name-err]");
    function checkName() {
      const val = state.name.trim();
      const dup = !!val && (opts.siblingNames || []).includes(val);
      nameInputEl.classList.toggle("has-err", dup);
      nameErrEl.hidden = !dup;
      opts.onNameChange(val.length > 0 && !dup);
    }
    nameInputEl.addEventListener("input", e => { state.name = e.target.value; checkName(); });
    checkName();

    if (!typeLocked) {
      container.querySelector("[data-f-type]").addEventListener("click", e => {
        const b = e.target.closest("[data-val]");
        if (!b) return;
        state.type = b.dataset.val;
        state.hiddenFields = [...DEFAULT_HIDDEN_FIELDS[state.type]];
        renderSubForm(container, state, opts);
      });
    }
    container.querySelector("[data-f-type-help]").onclick = openTypeHelp;
    container.querySelector("[data-f-view-btn]").onclick = () => openPermPicker("view", state, () => renderSubForm(container, state, opts));
    container.querySelector("[data-f-assign-btn]").onclick = () => openPermPicker("assign", state, () => renderSubForm(container, state, opts));
    container.querySelector("[data-f-fields]").addEventListener("click", e => {
      const b = e.target.closest("[data-field]");
      if (!b) return;
      const f = b.dataset.field;
      const i = state.hiddenFields.indexOf(f);
      if (i === -1) state.hiddenFields.push(f); else state.hiddenFields.splice(i, 1);
      b.classList.toggle("on");
      b.setAttribute("aria-checked", String(!state.hiddenFields.includes(f)));
    });
  }

  // 자산 유형 도움말 — 대시보드 공용 도움말 모달 패턴(다이얼로그 위에 dim 오버레이) 참조
  function openTypeHelp() {
    const p = document.createElement("div");
    p.className = "modal-back";
    p.innerHTML = `
      <div class="modal help-modal">
        <div class="help-modal-head">
          <h3>도움말</h3>
          <button type="button" class="btn icon-only sm" data-close aria-label="닫기">${CLOSE_ICON}</button>
        </div>
        <div class="body">
          <p><b>개별 자산</b><br>노트북, 책상처럼 실물 하나하나를 구분해서 관리하는 자산입니다. 자산마다 별도의 배정 정보와 상태(배정 중·재고·수리 중·분실·폐기)를 가지며, 필요한 경우 S/N·IMEI 같은 개체 식별 정보도 함께 관리할 수 있습니다.</p>
          <p><b>수량 자산</b><br>유니폼, 사무용품처럼 개별 식별 없이 수량으로만 관리하는 자산입니다. 근무지·구성원별 보유 수량을 기록하고, 잔여 수량을 확인할 수 있습니다.</p>
        </div>
      </div>`;
    document.body.appendChild(p);
    p.addEventListener("click", e => { if (e.target === p) p.remove(); });
    p.querySelector("[data-close]").onclick = () => p.remove();
  }

  // 조회/배정 권한 선택 — 드롭다운이 아니라 라디오 목록의 모달 선택창으로. "특정 그룹 및 직무/직급"·"특정 관리자/리더"는
  // 대상을 별도로 지정해야 하는 옵션이라, 선택 시 그 아래 요약 UI가 추가되고 눌러서 하위 선택 모달을 연다.
  // 라디오를 이리저리 바꿔도 이 모달이 열려 있는 동안은(적용/취소로 닫기 전까지) 각 옵션별 세부 선택 내용을 draftTarget에 그대로 들고 있음
  // state: { view, assign, viewTarget, assignTarget } 형태의 아무 객체나(소분류 생성 폼·수정 폼 공용) — 적용되면 onApply() 호출
  function openPermPicker(kind, state, onApply) {
    const isView = kind === "view";
    const current = state[kind];
    const draftTarget = {
      groups: [...state[kind + "Target"].groups],
      jobTitles: [...state[kind + "Target"].jobTitles],
      members: [...state[kind + "Target"].members],
    };
    let picked = current;

    const p = document.createElement("div");
    p.className = "modal-back";
    p.innerHTML = `
      <div class="modal">
        <h3>${isView ? "자산 조회 권한" : assignLabel(state.type)}</h3>
        <div class="body" data-picker-body></div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" data-ok>적용</button>
        </div>
      </div>`;
    document.body.appendChild(p);
    const body = p.querySelector("[data-picker-body]");
    const okBtn = p.querySelector("[data-ok]");

    // "특정 그룹 및 직무/직급"과 "특정 관리자/리더"는 서로 다른 대상 종류라 draftTarget 안에서도 완전히 독립적으로 관리 —
    // 라디오를 이리저리 바꿔도 각자 골라둔 내용이 안 섞이고 그대로 남아있어야 함
    function isTargetSetFor(v) {
      if (v === "특정 그룹 및 직무/직급") return draftTarget.groups.length > 0 || draftTarget.jobTitles.length > 0;
      if (v === "특정 관리자/리더") return draftTarget.members.length > 0;
      return false;
    }
    function targetSummaryHtml(v) {
      if (!isTargetSetFor(v)) return `<button type="button" class="perm-target-btn" data-target-open><span class="muted">선택</span><span class="chev">›</span></button>`;
      let chips, avatar = "";
      if (v === "특정 그룹 및 직무/직급") {
        chips = [];
        if (draftTarget.groups.length) chips.push(`그룹 : ${draftTarget.groups[0]}${draftTarget.groups.length > 1 ? `<span class="chip-more">+${draftTarget.groups.length - 1}</span>` : ""}`);
        if (draftTarget.jobTitles.length) chips.push(`직무/직급 : ${draftTarget.jobTitles[0]}${draftTarget.jobTitles.length > 1 ? `<span class="chip-more">+${draftTarget.jobTitles.length - 1}</span>` : ""}`);
      } else {
        avatar = `<span class="picker-avatar sm" style="background:${avatarColor(draftTarget.members[0])}">${draftTarget.members[0][0]}</span>`;
        chips = [`${draftTarget.members[0]}${draftTarget.members.length > 1 ? `<span class="chip-more">+${draftTarget.members.length - 1}</span>` : ""}`];
      }
      return `
        <div class="perm-target-row">
          <button type="button" class="perm-target-chips" data-target-open>${avatar}${chips.map(c => `<span class="perm-chip">${c}</span>`).join("")}</button>
          <button type="button" class="perm-target-clear" data-target-clear aria-label="선택 해제">${CLOSE_ICON}</button>
        </div>`;
    }
    function render() {
      // 배정/보유 변경 권한은 조회 권한값에 따라 고를 수 있는 옵션이 제한되지만(구조설계안 4.3), 옵션 자체를 숨기지 않고
      // 5개 다 보여준 채로 선택 불가한 것만 비활성 처리 — 뭐가 왜 안 되는지는 목록만 봐도 자연스럽게 드러나서 별도 툴팁은 안 둠
      const allowedSet = isView ? null : new Set(ASSIGN_BY_VIEW[state.view].options);
      body.innerHTML = VIEW_OPTIONS.map(v => {
        const isDisabled = allowedSet && !allowedSet.has(v);
        return `
        <label class="radio-row${isDisabled ? " is-disabled" : ""}">
          <input type="radio" name="perm-pick" value="${v}"${v === picked ? " checked" : ""}${isDisabled ? " disabled" : ""}>
          <span>${v}</span>
        </label>
        ${picked === v && TARGET_NEEDED.has(v) ? `<div class="perm-target-wrap">${targetSummaryHtml(v)}</div>` : ""}`;
      }).join("")
        + (isView ? `<div class="perm-info-note">${INFO_ICON}<span>관리자라도 조회 권한을 부여받아야 이 정보를 볼 수 있습니다.</span></div>` : "");

      body.querySelectorAll('input[name="perm-pick"]').forEach(r => r.onchange = () => { picked = r.value; render(); });
      const openBtn = body.querySelector("[data-target-open]");
      if (openBtn) openBtn.onclick = () => {
        // 배정/보유 변경 권한 쪽에서, 조회 권한 자체가 같은 "특정 그룹/관리자" 타입으로 좁혀져 있으면
        // 조회 권한에서 고른 대상 밖은 선택 못 하게 제한(조회 권한이 회사 전체/관리자 전체처럼 넓으면 제한 없음)
        const isNarrowedView = !isView && state.view === picked;
        if (picked === "특정 그룹 및 직무/직급") {
          const restrict = isNarrowedView ? { groups: new Set(state.viewTarget.groups), jobTitles: new Set(state.viewTarget.jobTitles) } : null;
          openGroupJobPicker({ groups: draftTarget.groups, jobTitles: draftTarget.jobTitles }, res => {
            draftTarget.groups = res.groups; draftTarget.jobTitles = res.jobTitles;
            render();
          }, restrict);
        } else if (picked === "특정 관리자/리더") {
          const restrict = isNarrowedView ? new Set(state.viewTarget.members) : null;
          openMemberPicker(draftTarget.members, res => { draftTarget.members = res; render(); }, restrict);
        }
      };
      const clearBtn = body.querySelector("[data-target-clear]");
      if (clearBtn) clearBtn.onclick = () => {
        if (picked === "특정 그룹 및 직무/직급") { draftTarget.groups = []; draftTarget.jobTitles = []; }
        else { draftTarget.members = []; }
        render();
      };
      okBtn.disabled = TARGET_NEEDED.has(picked) && !isTargetSetFor(picked);
    }
    render();

    p.addEventListener("click", e => { if (e.target === p) p.remove(); });
    p.querySelector("[data-close]").onclick = () => p.remove();
    okBtn.onclick = () => {
      if (okBtn.disabled) return;
      // 실제로 선택된 종류(picked)에 해당하는 대상만 커밋 — draftTarget엔 다른 옵션 볼 때 골라둔 값이 같이 남아있을 수 있어 그건 버림
      const appliedTarget = picked === "특정 그룹 및 직무/직급"
        ? { groups: [...draftTarget.groups], jobTitles: [...draftTarget.jobTitles], members: [] }
        : picked === "특정 관리자/리더"
          ? { groups: [], jobTitles: [], members: [...draftTarget.members] }
          : { groups: [], jobTitles: [], members: [] };
      if (isView) {
        state.view = picked;
        state.assign = ASSIGN_BY_VIEW[picked].default;
        state.viewTarget = appliedTarget;
        state.assignTarget = { groups: [], jobTitles: [], members: [] };
      } else {
        state.assign = picked;
        state.assignTarget = appliedTarget;
      }
      p.remove();
      onApply();
    };
  }

  // 그룹 및 직무/직급 선택 — 대시보드 공용 컴포넌트 참조(좌측 그룹/직무·직급 탭 + 우측 체크리스트)
  // restrict가 있으면(배정/보유 변경 권한이 조회 권한과 같은 "특정 그룹 및 직무/직급" 타입일 때) 조회 권한에서
  // 고르지 않은 그룹/직무·직급은 선택 자체를 막고 사유를 보여줌 — 변경 권한은 조회 권한의 부분집합이어야 함(구조설계안 4.3)
  function openGroupJobPicker(initial, onApply, restrict) {
    const selGroups = new Set(initial.groups);
    const selJobTitles = new Set(initial.jobTitles);
    let activeTab = "groups";
    let cascade = true;
    const collapsed = new Set();
    let query = "";

    const flatten = nodes => nodes.reduce((out, n) => out.concat(n.name, n.children ? flatten(n.children) : []), []);
    const ALL_GROUP_NAMES = flatten(GROUP_TREE);
    const selectableGroupNames = restrict ? ALL_GROUP_NAMES.filter(n => restrict.groups.has(n)) : ALL_GROUP_NAMES;
    function findNode(nodes, name) {
      for (const n of nodes) {
        if (n.name === name) return n;
        if (n.children) { const f = findNode(n.children, name); if (f) return f; }
      }
      return null;
    }
    function setChecked(node, checked, withCascade) {
      checked ? selGroups.add(node.name) : selGroups.delete(node.name);
      if (withCascade && node.children) node.children.forEach(c => setChecked(c, checked, true));
    }
    function matches(node) {
      if (!query) return true;
      if (node.name.includes(query)) return true;
      return !!(node.children && node.children.some(matches));
    }
    function groupRowHtml(node, depth) {
      if (!matches(node)) return "";
      const hasChildren = node.children && node.children.length;
      const isCollapsed = collapsed.has(node.name);
      const isDisabled = restrict && !restrict.groups.has(node.name);
      return `
        <div class="picker-tree-row" style="padding-left:${depth * 20}px">
          ${hasChildren ? `<button type="button" class="picker-tree-toggle" data-toggle-group="${node.name}">${isCollapsed ? "▸" : "▾"}</button>` : `<span class="picker-tree-toggle"></span>`}
          <label class="picker-check${isDisabled ? " is-disabled" : ""}"${isDisabled ? ` data-tip="${RESTRICT_TIP}"` : ""}><input type="checkbox" data-group="${node.name}"${selGroups.has(node.name) ? " checked" : ""}${isDisabled ? " disabled" : ""}><span>${node.name}</span></label>
        </div>
        ${hasChildren && !isCollapsed ? node.children.map(c => groupRowHtml(c, depth + 1)).join("") : ""}`;
    }

    const p = document.createElement("div");
    p.className = "modal-back";
    p.innerHTML = `
      <div class="modal picker-modal">
        <div class="picker-head">
          <h3>그룹 및 직무/직급 선택</h3>
          <button type="button" class="picker-reset" data-reset>${RESET_ICON}초기화</button>
        </div>
        <div class="picker-layout">
          <div class="picker-tabs">
            <button type="button" class="picker-tab" data-tab="groups">그룹</button>
            <button type="button" class="picker-tab" data-tab="jobTitles">직무/직급</button>
          </div>
          <div class="picker-content" data-content></div>
        </div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" data-ok>적용</button>
        </div>
      </div>`;
    document.body.appendChild(p);
    const content = p.querySelector("[data-content]");
    const jobTab = p.querySelector('[data-tab="jobTitles"]');

    function renderContent() {
      if (activeTab === "groups") {
        const allChecked = selectableGroupNames.length > 0 && selectableGroupNames.every(n => selGroups.has(n));
        content.innerHTML = `
          <input type="text" class="picker-search" placeholder="검색어를 입력하세요" value="${query}">
          <div class="picker-toolbar">
            <label class="picker-check"><input type="checkbox" data-select-all${allChecked ? " checked" : ""}><span>전체 선택</span></label>
            <label class="picker-check right"><input type="checkbox" data-cascade${cascade ? " checked" : ""}><span>하위그룹도 한번에 체크</span></label>
          </div>
          <div class="picker-tree">${GROUP_TREE.map(n => groupRowHtml(n, 0)).join("")}</div>`;
        content.querySelector(".picker-search").addEventListener("input", e => { query = e.target.value; renderContent(); });
        content.querySelector("[data-select-all]").onchange = e => { selectableGroupNames.forEach(n => e.target.checked ? selGroups.add(n) : selGroups.delete(n)); renderContent(); };
        content.querySelector("[data-cascade]").onchange = e => { cascade = e.target.checked; };
        content.querySelectorAll("[data-toggle-group]").forEach(b => b.onclick = () => {
          collapsed.has(b.dataset.toggleGroup) ? collapsed.delete(b.dataset.toggleGroup) : collapsed.add(b.dataset.toggleGroup);
          renderContent();
        });
        content.querySelectorAll("[data-group]").forEach(cb => cb.onchange = e => {
          setChecked(findNode(GROUP_TREE, e.target.dataset.group), e.target.checked, cascade);
          renderContent();
        });
      } else {
        const filtered = JOB_TITLES.filter(t => !query || t.includes(query));
        content.innerHTML = `
          <input type="text" class="picker-search" placeholder="검색어를 입력하세요" value="${query}">
          <div class="picker-flatlist">
            ${filtered.map(t => {
              const isDisabled = restrict && !restrict.jobTitles.has(t);
              return `<label class="picker-check row${isDisabled ? " is-disabled" : ""}"${isDisabled ? ` data-tip="${RESTRICT_TIP}"` : ""}><input type="checkbox" data-jobtitle="${t}"${selJobTitles.has(t) ? " checked" : ""}${isDisabled ? " disabled" : ""}><span>${t}</span></label>`;
            }).join("")}
          </div>`;
        content.querySelector(".picker-search").addEventListener("input", e => { query = e.target.value; renderContent(); });
        content.querySelectorAll("[data-jobtitle]").forEach(cb => cb.onchange = e => {
          e.target.checked ? selJobTitles.add(e.target.dataset.jobtitle) : selJobTitles.delete(e.target.dataset.jobtitle);
        });
      }
    }
    function renderAll() {
      p.querySelectorAll("[data-tab]").forEach(b => b.classList.toggle("active", b.dataset.tab === activeTab));
      jobTab.innerHTML = `직무/직급${selJobTitles.size ? '<span class="picker-tab-dot"></span>' : ""}`;
      renderContent();
    }
    p.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { activeTab = b.dataset.tab; query = ""; renderAll(); });
    p.querySelector("[data-reset]").onclick = () => { selGroups.clear(); selJobTitles.clear(); renderAll(); };
    renderAll();

    p.addEventListener("click", e => { if (e.target === p) p.remove(); });
    p.querySelector("[data-close]").onclick = () => p.remove();
    p.querySelector("[data-ok]").onclick = () => { p.remove(); onApply({ groups: [...selGroups], jobTitles: [...selJobTitles] }); };
  }

  // 구성원(직원) 선택 — 대시보드 공용 컴포넌트 참조
  // restrict 없음(조회 권한): 좌우 분할(전체 목록 + 선택됨 목록), 자유 선택
  // restrict 있음(배정/보유 변경 권한 — 조회 권한의 부분집합이어야 함, 구조설계안 4.3): 단일 목록으로 전환하고
  // 조회 권한 범위 밖 인원은 비활성화가 아니라 목록에서 완전히 제외(실제 대시보드 "구성원 추가 정보" 등 restrict형
  // 직원 선택 팝업과 동일한 패턴)
  function openMemberPicker(initial, onApply, restrict) {
    const sel = new Set(initial);
    let query = "";
    const p = document.createElement("div");
    p.className = "modal-back";

    if (!restrict) {
      p.innerHTML = `
        <div class="modal picker-modal" style="width:680px">
          <h3>직원 선택</h3>
          <div class="picker-split">
            <div class="picker-split-left">
              <input type="text" class="picker-search" placeholder="검색어를 입력하세요">
              <div class="picker-toolbar">
                <label class="picker-check"><input type="checkbox" data-select-all><span>전체 선택</span></label>
                <span class="right">전체 <b>${MEMBERS.length}</b></span>
              </div>
              <div class="picker-memberlist" data-list></div>
            </div>
            <div class="picker-split-right">
              <div class="picker-selected-head"><span>선택됨 <b data-count>${sel.size}</b></span></div>
              <div class="picker-selected-list" data-selected-list></div>
            </div>
          </div>
          <div class="foot">
            <button class="btn" data-close>취소</button>
            <button class="btn primary" data-ok>적용</button>
          </div>
        </div>`;
      document.body.appendChild(p);
      const list = p.querySelector("[data-list]");
      const countEl = p.querySelector("[data-count]");
      const selectedList = p.querySelector("[data-selected-list]");

      function renderSelected() {
        countEl.textContent = sel.size;
        selectedList.innerHTML = sel.size ? [...sel].map(name => `
          <div class="picker-selected-row">
            <span class="picker-avatar sm" style="background:${avatarColor(name)}">${name[0]}</span>
            <span>${name}</span>
            <button type="button" class="picker-selected-remove" data-remove="${name}" aria-label="제거">${CLOSE_ICON}</button>
          </div>`).join("") : '<p class="muted" style="padding:16px 0">선택된 인원이 없습니다.</p>';
        selectedList.querySelectorAll("[data-remove]").forEach(b => b.onclick = () => {
          sel.delete(b.dataset.remove);
          renderSelected(); renderList();
        });
      }
      function renderList() {
        const filtered = MEMBERS.filter(m => !query || m.name.includes(query));
        list.innerHTML = filtered.length ? filtered.map(m => `
          <label class="picker-member-row">
            <input type="checkbox" data-member="${m.name}"${sel.has(m.name) ? " checked" : ""}>
            <span class="picker-avatar" style="background:${avatarColor(m.name)}">${m.name[0]}</span>
            <span class="picker-member-info"><b>${m.name}</b><span>${m.team}</span></span>
          </label>`).join("") : `<p class="muted" style="padding:16px 0">결과가 없습니다.</p>`;
        p.querySelector("[data-select-all]").checked = filtered.length > 0 && filtered.every(m => sel.has(m.name));
        list.querySelectorAll("[data-member]").forEach(cb => cb.onchange = e => {
          e.target.checked ? sel.add(e.target.dataset.member) : sel.delete(e.target.dataset.member);
          p.querySelector("[data-select-all]").checked = filtered.length > 0 && filtered.every(m => sel.has(m.name));
          renderSelected();
        });
      }
      p.querySelector(".picker-search").addEventListener("input", e => { query = e.target.value; renderList(); });
      p.querySelector("[data-select-all]").onchange = e => {
        MEMBERS.filter(m => !query || m.name.includes(query)).forEach(m => e.target.checked ? sel.add(m.name) : sel.delete(m.name));
        renderSelected(); renderList();
      };
      renderList();
      renderSelected();
      p.addEventListener("click", e => { if (e.target === p) p.remove(); });
      p.querySelector("[data-close]").onclick = () => p.remove();
      p.querySelector("[data-ok]").onclick = () => { p.remove(); onApply([...sel]); };
      return;
    }

    // restrict 있음 — 조회 권한 범위 안의 인원만 후보로 제공
    const candidates = MEMBERS.filter(m => restrict.has(m.name));
    p.innerHTML = `
      <div class="modal picker-modal">
        <h3>직원 선택</h3>
        <div class="body">
          <input type="text" class="picker-search" placeholder="검색어를 입력하세요">
          <div class="picker-memberlist" data-list></div>
        </div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" data-ok>적용</button>
        </div>
      </div>`;
    document.body.appendChild(p);
    const list = p.querySelector("[data-list]");
    function renderList() {
      const filtered = candidates.filter(m => !query || m.name.includes(query));
      list.innerHTML = filtered.length ? filtered.map(m => `
        <label class="picker-member-row">
          <input type="checkbox" data-member="${m.name}"${sel.has(m.name) ? " checked" : ""}>
          <span class="picker-avatar" style="background:${avatarColor(m.name)}">${m.name[0]}</span>
          <span class="picker-member-info"><b>${m.name}</b><span>${m.team}</span></span>
        </label>`).join("") : `<p class="muted" style="padding:16px 0">결과가 없습니다.</p>`;
      list.querySelectorAll("[data-member]").forEach(cb => cb.onchange = e => {
        e.target.checked ? sel.add(e.target.dataset.member) : sel.delete(e.target.dataset.member);
      });
    }
    p.querySelector(".picker-search").addEventListener("input", e => { query = e.target.value; renderList(); });
    renderList();
    p.addEventListener("click", e => { if (e.target === p) p.remove(); });
    p.querySelector("[data-close]").onclick = () => p.remove();
    p.querySelector("[data-ok]").onclick = () => { p.remove(); onApply([...sel]); };
  }

  // 소분류 수정 — 자산 상세 우측 패널의 [수정] 버튼에서 진입. 필드 구성은 소분류 생성 화면과 동일(renderSubForm 공용) —
  // 뒤로가기 없이 바로 모달로 뜨고 타이틀만 다름. 이미 등록된 자산이 있으면 자산 유형은 변경 제한(구조설계안 3.3)
  function openSubEditModal(cat) {
    const hasAssets = assetsOf(cat.group, cat.sub).length > 0;
    const state = {
      name: cat.sub, type: cat.type, view: cat.view, assign: cat.assign,
      viewTarget: cat.viewTarget ? { ...cat.viewTarget } : { groups: [], jobTitles: [], members: [] },
      assignTarget: cat.assignTarget ? { ...cat.assignTarget } : { groups: [], jobTitles: [], members: [] },
      hiddenFields: [...(cat.hiddenFields || [])],
    };
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal lg cat-manage-modal">
        <div class="cat-manage-head"><h3>소분류 수정</h3></div>
        <div class="cat-manage-create" data-form></div>
        <div class="foot">
          <button class="btn" data-cancel>취소</button>
          <button class="btn primary" data-save>저장</button>
        </div>
      </div>`;
    document.body.appendChild(back);
    const form = back.querySelector("[data-form]");
    const saveBtn = back.querySelector("[data-save]");
    renderSubForm(form, state, {
      groupLabel: cat.group,
      typeLocked: hasAssets,
      siblingNames: categories.filter(c => c.group === cat.group && c.sub !== cat.sub).map(c => c.sub),
      onNameChange: valid => { saveBtn.disabled = !valid; },
    });
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-cancel]").onclick = () => back.remove();
    saveBtn.onclick = () => {
      const name = state.name.trim();
      if (!name) return;
      // 이름이 바뀌면 이 소분류에 걸린 자산들의 sub도 같이 갱신(대분류는 이 폼에서 안 바뀌므로 group은 그대로)
      if (cat.sub !== name) {
        assets.forEach(a => { if (a.group === cat.group && a.sub === cat.sub) a.sub = name; });
      }
      cat.sub = name;
      cat.type = state.type;
      cat.hiddenFields = [...state.hiddenFields];
      cat.view = state.view;
      cat.assign = state.assign;
      cat.viewTarget = TARGET_NEEDED.has(state.view) ? { ...state.viewTarget } : null;
      cat.assignTarget = TARGET_NEEDED.has(state.assign) ? { ...state.assignTarget } : null;
      back.remove();
      toast("저장되었습니다.");
      render({ group: cat.group, sub: cat.sub });
    };
  }

  // 대분류/소분류 추가·이름변경·삭제·순서변경(핸들 드래그)을 한 곳에서 처리하는 구조 편집 전용 모달.
  // 열려 있는 동안은 draft(로컬 사본)만 수정하고, [저장]을 눌러야 실제 데이터(window.DATA)에 반영됨 — [취소]/배경 클릭 시 draft는 버려짐.
  // 유형·권한·필드노출 같은 "내용"은 여기서 안 다룸 — 소분류 생성/수정은 별도 폼(소분류 상세의 "소분류 수정" 버튼)이 담당
  function openManageModal(sel) {
    // draft: [{ name, subs: [{ name, data(원본 category 객체 참조 — 삭제 가능 여부는 항상 이 원본 소속 기준으로 판단) }] }]
    // 이름변경/삭제/순서변경/대분류 추가는 전부 이 draft에만 반영되고 [저장]을 눌러야 실제 데이터로 감. 단, 소분류 생성만은 예외
    // — 유형·권한까지 다 채우는 무거운 액션이라(분류 관리 화면 안에서 벌크로 여러 개 만드는 상황 고려) 폼에서 확정하는 즉시 실제 데이터에 반영됨(draft 취소와 무관)
    // origName: 실제 데이터상의 원래 대분류명(대분류 이름변경은 draft라 취소될 수 있음 — 그 사이 소분류 생성이 즉시 커밋될 때는
    // 항상 이 origName을 써서, 나중에 이름변경이 취소돼도 방금 만든 소분류가 엉뚱한 이름의 그룹으로 붕 뜨지 않게 함)
    let draft = groupsOf().map(({ group, subs }) => ({ name: group, origName: group, subs: subs.map(s => ({ name: s.sub, data: s })) }));
    let dragging = null;
    let dirty = false;
    let createGi = null; // 소분류 생성 모드일 때, 생성 대상 대분류의 draft 인덱스
    let createState = null;

    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal lg cat-manage-modal">
        <div class="cat-manage-head">
          <button class="btn icon-only sm" data-back hidden aria-label="뒤로">${BACK_ICON}</button>
          <h3 data-modal-title>분류 관리</h3>
        </div>
        <div class="cat-manage-add-group">
          <input type="text" class="cat-manage-input" placeholder="입력" maxlength="30">
          <button class="btn primary" data-add-group>+ 대분류 추가</button>
        </div>
        <p class="field-err" data-addgroup-err hidden style="margin:0 20px">동일한 명칭이 존재합니다.</p>
        <div class="body cat-manage-body"></div>
        <p class="field-err" data-body-err hidden style="margin:0 20px 12px">동일한 명칭이 존재합니다.</p>
        <div class="cat-manage-create" hidden></div>
        <div class="foot">
          <button class="btn" data-cancel>취소</button>
          <button class="btn primary" data-confirm disabled>저장</button>
        </div>
      </div>`;
    document.body.appendChild(back);

    const body = back.querySelector(".cat-manage-body");
    const createEl = back.querySelector(".cat-manage-create");
    const addGroupRow = back.querySelector(".cat-manage-add-group");
    const titleEl = back.querySelector("[data-modal-title]");
    const backBtn = back.querySelector("[data-back]");
    const cancelBtn = back.querySelector("[data-cancel]");
    const confirmBtn = back.querySelector("[data-confirm]");
    const addInput = back.querySelector(".cat-manage-add-group input");
    const addGroupErr = back.querySelector("[data-addgroup-err]");
    const bodyErr = back.querySelector("[data-body-err]");
    let currentMode = "list";
    // 대분류명은 전체 통틀어, 소분류명은 같은 대분류 안에서만 유일하면 됨(다른 대분류의 동명 소분류는 무관)
    function computeDups() {
      const groupCounts = {};
      draft.forEach(g => { const n = g.name.trim(); if (n) groupCounts[n] = (groupCounts[n] || 0) + 1; });
      const groupDups = new Set(Object.keys(groupCounts).filter(n => groupCounts[n] > 1));
      const subDupsByGi = draft.map(g => {
        const counts = {};
        g.subs.forEach(s => { const n = s.name.trim(); if (n) counts[n] = (counts[n] || 0) + 1; });
        return new Set(Object.keys(counts).filter(n => counts[n] > 1));
      });
      return { groupDups, subDupsByGi };
    }
    function updateValidity() {
      const { groupDups, subDupsByGi } = computeDups();
      let anyDup = groupDups.size > 0;
      body.querySelectorAll("[data-rename-group]").forEach(inp => {
        inp.classList.toggle("has-err", groupDups.has(inp.value.trim()));
      });
      body.querySelectorAll("[data-rename-sub]").forEach(inp => {
        const gi = +inp.dataset.renameSub.split("|")[0];
        const dup = subDupsByGi[gi] && subDupsByGi[gi].has(inp.value.trim());
        inp.classList.toggle("has-err", !!dup);
        if (dup) anyDup = true;
      });
      bodyErr.hidden = !anyDup;
      const addDup = draft.some(g => g.name.trim() === addInput.value.trim());
      addInput.classList.toggle("has-err", !!addInput.value.trim() && addDup);
      addGroupErr.hidden = !(addInput.value.trim() && addDup);
      back.querySelector("[data-add-group]").disabled = !!addInput.value.trim() && addDup;
      if (currentMode === "list") confirmBtn.disabled = !dirty || anyDup;
    }
    const markDirty = () => { dirty = true; updateValidity(); };
    const clearDragMarks = () => body.querySelectorAll(".drag-over-top,.drag-over-bottom")
      .forEach(el => el.classList.remove("drag-over-top", "drag-over-bottom"));

    // 뒤로가기 — 소분류명을 입력한 상태(= [저장]이 활성화될 만큼 진행된 상태)에서 나가려 하면 한 번 확인. 이름을 아직 안 썼으면 잃을 내용이 없다고 보고 바로 이동
    function guardedBack() {
      if (createState && createState.name.trim()) {
        confirmModal("페이지를 벗어나시겠습니까?", "페이지를 벗어날 경우 편집한 내용이 저장되지 않습니다.", () => setMode("list"));
      } else {
        setMode("list");
      }
    }
    function setMode(mode) {
      currentMode = mode;
      const isList = mode === "list";
      titleEl.textContent = isList ? "분류 관리" : "소분류 추가";
      backBtn.hidden = isList;
      addGroupRow.hidden = !isList;
      body.hidden = !isList;
      createEl.hidden = isList;
      cancelBtn.hidden = !isList; // 소분류 생성 화면에선 헤더의 뒤로가기(←)가 같은 역할을 하므로 푸터 취소는 없앰
      confirmBtn.textContent = "저장";
      if (isList) updateValidity(); else confirmBtn.disabled = true;
      cancelBtn.onclick = () => { back.remove(); render(sel); };
      confirmBtn.onclick = isList ? saveAll : commitCreate;
    }
    backBtn.onclick = guardedBack;
    back.addEventListener("click", e => {
      if (e.target !== back) return;
      if (currentMode === "list") cancelBtn.click(); else guardedBack();
    });

    function renderBody() {
      body.innerHTML = draft.map((g, gi) => {
        const blocked = g.subs.length > 0;
        return `
        <div class="cat-manage-group">
          <div class="cat-manage-row cat-manage-group-row" draggable="true" data-drag="group" data-gi="${gi}">
            <span class="cat-manage-handle" data-tip="순서 변경">${HANDLE_ICON}</span>
            <input type="text" class="cat-manage-name-input" data-rename-group="${gi}" value="${g.name}" maxlength="30">
            <div class="cat-manage-row-acts">
              <button class="cat-manage-icon${blocked ? " is-disabled" : ""}" data-del-group="${gi}" aria-label="삭제"
                data-tip="${blocked ? "등록된 하위 소분류가 있어 삭제할 수 없습니다." : "삭제"}">${TRASH_ICON}</button>
            </div>
          </div>
          <div class="cat-manage-subs">
            ${g.subs.map((s, si) => {
              const hasAssets = assetsOf(s.data.group, s.data.sub).length > 0;
              return `
              <div class="cat-manage-row cat-manage-sub-row" draggable="true" data-drag="sub" data-gi="${gi}" data-si="${si}">
                <span class="cat-manage-handle" data-tip="순서 변경 및 대분류 이동">${HANDLE_ICON}</span>
                <input type="text" class="cat-manage-name-input" data-rename-sub="${gi}|${si}" value="${s.name}" maxlength="30">
                <div class="cat-manage-row-acts">
                  <button class="cat-manage-icon${hasAssets ? " is-disabled" : ""}" data-del-sub="${gi}|${si}" aria-label="삭제"
                    data-tip="${hasAssets ? "등록된 자산이 있어 삭제할 수 없습니다." : "삭제"}">${TRASH_ICON}</button>
                </div>
              </div>`;
            }).join("")}
            ${g.subs.length ? "" : '<p class="cat-tree-empty" style="padding-left:8px">소분류 없음</p>'}
            <button class="btn sm cat-manage-add-sub" data-add-sub="${gi}">+ 소분류 추가</button>
          </div>
        </div>`;
      }).join("");
      updateValidity();
    }
    renderBody();

    function addGroup() {
      const name = addInput.value.trim();
      if (!name || draft.some(g => g.name.trim() === name)) { addInput.focus(); return; }
      draft.unshift({ name, origName: null, subs: [] });
      addInput.value = "";
      markDirty(); renderBody();
    }
    back.querySelector("[data-add-group]").onclick = addGroup;
    addInput.addEventListener("input", updateValidity);
    addInput.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); addGroup(); } });

    body.addEventListener("input", e => {
      const rg = e.target.closest("[data-rename-group]");
      const rs = e.target.closest("[data-rename-sub]");
      if (rg) { draft[+rg.dataset.renameGroup].name = e.target.value; markDirty(); }
      else if (rs) {
        const [gi, si] = rs.dataset.renameSub.split("|").map(Number);
        draft[gi].subs[si].name = e.target.value; markDirty();
      }
    });
    body.addEventListener("click", e => {
      const delGroup = e.target.closest("[data-del-group]");
      const delSub = e.target.closest("[data-del-sub]");
      const addSub = e.target.closest("[data-add-sub]");
      if (delGroup && !delGroup.classList.contains("is-disabled")) {
        draft.splice(+delGroup.dataset.delGroup, 1);
        markDirty(); renderBody();
      } else if (delSub && !delSub.classList.contains("is-disabled")) {
        const [gi, si] = delSub.dataset.delSub.split("|").map(Number);
        draft[gi].subs.splice(si, 1);
        markDirty(); renderBody();
      } else if (addSub) {
        enterCreate(+addSub.dataset.addSub);
      }
    });

    // 드래그 정렬 — 핸들을 잡고 시작(입력창/버튼에서는 브라우저 기본 동작이 드래그를 가로채 자연히 막힘)
    body.addEventListener("dragstart", e => {
      const row = e.target.closest("[data-drag]");
      if (!row) return;
      dragging = row.dataset.drag === "group"
        ? { type: "group", gi: +row.dataset.gi }
        : { type: "sub", gi: +row.dataset.gi, si: +row.dataset.si };
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", "");
      row.classList.add("dragging");
    });
    body.addEventListener("dragend", e => {
      dragging = null;
      e.target.closest("[data-drag]")?.classList.remove("dragging");
      clearDragMarks();
    });
    body.addEventListener("dragover", e => {
      if (!dragging) return;
      const subRow = e.target.closest('[data-drag="sub"]');
      const groupRow = e.target.closest('[data-drag="group"]');
      if (dragging.type === "sub" && subRow) {
        e.preventDefault(); clearDragMarks();
        const rect = subRow.getBoundingClientRect();
        subRow.classList.add(e.clientY < rect.top + rect.height / 2 ? "drag-over-top" : "drag-over-bottom");
      } else if (dragging.type === "sub" && groupRow) {
        e.preventDefault(); clearDragMarks();
        groupRow.classList.add("drag-over-bottom");
      } else if (dragging.type === "group" && groupRow) {
        e.preventDefault(); clearDragMarks();
        const rect = groupRow.getBoundingClientRect();
        groupRow.classList.add(e.clientY < rect.top + rect.height / 2 ? "drag-over-top" : "drag-over-bottom");
      }
    });
    body.addEventListener("drop", e => {
      if (!dragging) return;
      e.preventDefault();
      const subRow = e.target.closest('[data-drag="sub"]');
      const groupRow = e.target.closest('[data-drag="group"]');
      if (dragging.type === "sub") {
        let targetGi, targetIndex;
        if (subRow) {
          targetGi = +subRow.dataset.gi;
          targetIndex = +subRow.dataset.si + (subRow.classList.contains("drag-over-top") ? 0 : 1);
        } else if (groupRow) {
          targetGi = +groupRow.dataset.gi;
          targetIndex = 0;
        } else { dragging = null; clearDragMarks(); return; }
        const [moved] = draft[dragging.gi].subs.splice(dragging.si, 1);
        let insertAt = targetIndex;
        if (dragging.gi === targetGi && dragging.si < targetIndex) insertAt -= 1;
        draft[targetGi].subs.splice(insertAt, 0, moved);
        markDirty(); renderBody();
      } else if (dragging.type === "group" && groupRow) {
        const targetIndex = +groupRow.dataset.gi + (groupRow.classList.contains("drag-over-top") ? 0 : 1);
        const [moved] = draft.splice(dragging.gi, 1);
        let insertAt = targetIndex;
        if (dragging.gi < targetIndex) insertAt -= 1;
        draft.splice(insertAt, 0, moved);
        markDirty(); renderBody();
      }
      dragging = null;
      clearDragMarks();
    });

    function saveAll() {
      const dups = computeDups();
      if (!dirty || dups.groupDups.size > 0 || dups.subDupsByGi.some(s => s.size > 0)) return;
      const newCategories = [];
      const newEmptyGroups = [];
      draft.forEach(g => {
        if (!g.subs.length) { newEmptyGroups.push(g.name); return; }
        g.subs.forEach(s => {
          // 이름변경·대분류이동으로 소속이 바뀐 소분류는, 거기 걸린 자산들의 group/sub도 같이 옮겨줘야
          // 자산 목록 조회(assetsOf)가 끊기지 않음 — 원래 소속(s.data.group/sub) 기준으로 자산을 찾아 갱신
          const oldGroup = s.data.group, oldSub = s.data.sub;
          if (oldGroup !== g.name || oldSub !== s.name) {
            assets.forEach(a => { if (a.group === oldGroup && a.sub === oldSub) { a.group = g.name; a.sub = s.name; } });
          }
          newCategories.push({ ...s.data, group: g.name, sub: s.name });
        });
      });
      categories.length = 0;
      categories.push(...newCategories);
      window.DATA.emptyGroups = newEmptyGroups;
      back.remove();
      toast("저장되었습니다.");
      render(null);
    }

    // 소분류 생성 — 유형·권한까지 다 채우는 무거운 액션이라 여기서만 예외적으로 "추가"를 누르는 즉시 실제 데이터(categories)에 반영됨.
    // 이 draft(구조 편집)의 [취소]와는 무관 — 다만 목록에 바로 보이도록 draft에도 같이 끼워 넣음
    function enterCreate(gi) {
      createGi = gi;
      createState = {
        name: "", type: "individual",
        view: VIEW_OPTIONS[0], assign: ASSIGN_BY_VIEW[VIEW_OPTIONS[0]].default,
        viewTarget: { groups: [], jobTitles: [], members: [] },
        assignTarget: { groups: [], jobTitles: [], members: [] },
        hiddenFields: [...DEFAULT_HIDDEN_FIELDS.individual],
      };
      renderCreateForm();
      setMode("create");
    }


    function renderCreateForm() {
      renderSubForm(createEl, createState, {
        groupLabel: draft[createGi].name,
        typeLocked: false,
        siblingNames: draft[createGi].subs.map(s => s.name),
        onNameChange: valid => { confirmBtn.disabled = !valid; },
      });
    }

    function commitCreate() {
      const name = createState.name.trim();
      if (!name) return;
      const group = draft[createGi].origName || draft[createGi].name;
      const newCat = {
        group, sub: name, type: createState.type, hiddenFields: [...createState.hiddenFields],
        view: createState.view, assign: createState.assign,
        viewTarget: TARGET_NEEDED.has(createState.view) ? { ...createState.viewTarget } : null,
        assignTarget: TARGET_NEEDED.has(createState.assign) ? { ...createState.assignTarget } : null,
      };
      categories.push(newCat);
      draft[createGi].subs.push({ name, data: newCat });
      toast("소분류가 추가되었습니다.");
      setMode("list");
      renderBody();
    }

    setMode("list");
  }

  function wireAssetSection(c, cat) {
    c.querySelectorAll(".cat-prod-row").forEach(row => row.onclick = () => {
      const p = productsOf(cat.group, cat.sub).find(x => x.product === row.dataset.product);
      if (p) window.openProductUnitsModal(p.product, p.items);
    });
    c.querySelectorAll("[data-asset]").forEach(row => row.onclick = e => {
      e.stopPropagation();
      window.open(`asset-detail.html?id=${row.dataset.asset}`, "_blank", "noopener");
    });
    const searchInput = c.querySelector("[data-product-search]");
    if (searchInput) {
      const sbox = searchInput.closest(".searchbox");
      const clearBtn = c.querySelector("[data-product-search-clear]");
      const rows = [...c.querySelectorAll(".cat-asset-table tbody tr")];
      const emptyMsg = c.querySelector("[data-search-empty]");
      const applyFilter = () => {
        const q = searchInput.value.trim().toLowerCase();
        let anyVisible = false;
        rows.forEach(tr => {
          const match = !q || tr.querySelector("td").textContent.toLowerCase().includes(q);
          tr.hidden = !match;
          if (match) anyVisible = true;
        });
        if (emptyMsg) emptyMsg.hidden = anyVisible;
        sbox.classList.toggle("has-term", !!searchInput.value);
      };
      searchInput.addEventListener("input", applyFilter);
      searchInput.onfocus = () => { searchInput.classList.add("expanded"); searchInput.placeholder = "품목명"; };
      searchInput.onblur = () => { if (!searchInput.value) { searchInput.classList.remove("expanded"); searchInput.placeholder = "검색"; } };
      clearBtn.onclick = () => { searchInput.value = ""; applyFilter(); searchInput.focus(); };
    }
    const addAssetBtn = c.querySelector("[data-add-asset]");
    if (addAssetBtn) addAssetBtn.onclick = () => window.openAssetAddModal({ type: cat.type, group: cat.group, sub: cat.sub });
  }

  function render(sel) {
    const c = document.getElementById("content");
    const groups = groupsOf();
    if (!sel) sel = firstSelectable(groups);
    const cat = sel ? categories.find(x => x.group === sel.group && x.sub === sel.sub) : null;

    c.innerHTML = `
      <div class="tabs">
        <a href="assets.html">현황</a>
        <a class="active">분류</a>
        <a href="settings.html">설정</a>
      </div>
      <div class="cat-layout">
        <nav class="cat-tree">${treeHtml(groups, sel)}</nav>
        <div class="cat-detail">${cat ? detailHtml(cat) : '<p class="muted" style="padding:20px 0">소분류를 선택하세요</p>'}</div>
      </div>
    `;
    c.classList.add("cat-split");
    c.querySelectorAll("[data-tree]").forEach(b => b.onclick = () => {
      const [group, sub] = b.dataset.tree.split("|");
      render({ group, sub });
    });
    c.querySelectorAll("[data-toggle]").forEach(b => b.onclick = () => {
      const g = b.dataset.toggle;
      if (collapsedGroups.has(g)) collapsedGroups.delete(g); else collapsedGroups.add(g);
      render(sel);
    });
    c.querySelector("[data-manage]").onclick = () => openManageModal(sel);
    const editBtn = c.querySelector("[data-edit-sub]");
    if (editBtn) editBtn.onclick = () => openSubEditModal(cat);
    wireAssetSection(c, cat);
  }

  window.CategoryScreen = { render: () => render(null) };
})();
