/* 분류 관리 — 분류-1 메인 화면. 좌측 트리(대분류는 그룹 헤더, 소분류만 선택 가능) + 우측(선택된 소분류 정보 + 자산 목록) */
(function () {
  const { categories, assets } = window.DATA;

  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300";
    document.body.appendChild(t); setTimeout(() => t.remove(), 1800);
  }
  const TRASH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M9.5 7l.7 13a1 1 0 0 0 1 1h5.6a1 1 0 0 0 1-1l.7-13"/></svg>`;
  const HANDLE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>`;
  const BACK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>`;
  const CLOSE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;

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
  // 배정중/재고 외 상태(수리중·분실·폐기)는 "기타"로 묶어서 보여줌 — 구조설계안 3.4 status 정의 기준
  const STATUS_LABEL = { stock: "재고", assigned: "배정중", repair: "수리중", lost: "분실", disposed: "폐기" };
  // 구조설계안 3.3: 필드 노출 설정 대상은 S/N·IMEI·구매일·구매가격·제조연월일·유효기한 6개(IMEI·S/N은 개별형 전용) — 기본값: IMEI·유효기한 off, 나머지 on
  const FIELD_LABEL = { serial: "S/N", imei: "IMEI", purchaseDate: "구매일", purchasePrice: "구매가격", manufactured: "제조연월일", expiry: "유효기한" };
  const DEFAULT_HIDDEN_FIELDS = { individual: ["imei", "expiry"], quantity: ["expiry"] };
  const btn = (label, cls = "btn sm") => `<button class="${cls}" data-act="${label}">${label}</button>`;
  const bindActs = scope => scope.querySelectorAll("[data-act]").forEach(b =>
    b.onclick = () => toast(`"${b.dataset.act}" — 이후 단계에서 정의`));

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

  // 개별형 자산 목록을 제품(제품명) 단위로 집계 — 제품 식별키는 구조안 3.1과 동일하게 "소분류+제품명"
  function productsOf(group, sub) {
    const list = assetsOf(group, sub);
    const order = [];
    const map = {};
    list.forEach(a => {
      if (!map[a.product]) { map[a.product] = []; order.push(a.product); }
      map[a.product].push(a);
    });
    return order.map(product => {
      const items = map[product];
      const assigned = items.filter(a => a.status === "assigned").length;
      const stock = items.filter(a => a.status === "stock").length;
      const repair = items.filter(a => a.status === "repair").length;
      const lost = items.filter(a => a.status === "lost").length;
      const disposed = items.filter(a => a.status === "disposed").length;
      return { product, items, total: items.length, assigned, stock, other: repair + lost + disposed, repair, lost, disposed };
    });
  }

  function productRowHtml(p) {
    const otherTitle = p.other ? ` title="수리중 ${p.repair} · 분실 ${p.lost} · 폐기 ${p.disposed}"` : "";
    return `
      <tr class="clickable cat-prod-row">
        <td><span class="cat-prod-chevron">▸</span>${p.product}</td>
        <td class="num">${p.total}</td>
        <td class="num">${p.assigned}</td>
        <td class="num">${p.stock}</td>
        <td class="num"${otherTitle}>${p.other}</td>
      </tr>
      <tr class="cat-prod-sub" hidden>
        <td colspan="5">
          ${p.items.map(a => `
            <div class="cat-unit-row" data-asset="${a.id}">
              <span class="cat-unit-no">${a.assetNo || "—"}</span>
              <span class="badge ${a.status}">${STATUS_LABEL[a.status]}</span>
            </div>`).join("")}
        </td>
      </tr>`;
  }

  function stockRowHtml(a) {
    const right = `${(a.stocks || []).reduce((s, x) => s + x.qty, 0)}개 · 보유 ${(a.stocks || []).length}곳`;
    return `
      <tr class="clickable" data-asset="${a.id}">
        <td>${a.product}</td>
        <td>${right}</td>
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

  function assetSectionHtml(cat) {
    if (cat.type === "individual") {
      const products = productsOf(cat.group, cat.sub);
      const total = products.reduce((s, p) => s + p.total, 0);
      return `
        <div class="cat-asset-head">
          <h4>자산 목록 <span class="chip">전체 ${total}</span></h4>
        </div>
        ${products.length ? `
          <div class="table-wrap">
            <table>
              <thead><tr><th>제품명</th><th class="num">전체</th><th class="num">배정중</th><th class="num">재고</th><th class="num">기타</th></tr></thead>
              <tbody>${products.map(productRowHtml).join("")}</tbody>
            </table>
          </div>` : '<p class="muted" style="padding:12px 0">등록된 자산이 없습니다</p>'}`;
    }
    const list = assetsOf(cat.group, cat.sub);
    return `
      <div class="cat-asset-head">
        <h4>자산 목록 <span class="chip">전체 ${list.length}</span></h4>
      </div>
      ${list.length ? `
        <div class="table-wrap">
          <table>
            <thead><tr><th>제품명</th><th>보유 현황</th><th>유효기한</th></tr></thead>
            <tbody>${list.map(stockRowHtml).join("")}</tbody>
          </table>
        </div>` : '<p class="muted" style="padding:12px 0">등록된 자산이 없습니다</p>'}`;
  }

  function detailHtml(cat) {
    return `
      <div class="cat-detail-head">
        <h3>${cat.sub} <span class="type-pill">${cat.type === "individual" ? "개별 자산" : "수량 자산"}</span></h3>
        <div class="cat-detail-acts">${btn("소분류 수정")}</div>
      </div>
      <div class="kv2 cat-detail-kv">
        <div><div class="k">자산 조회 권한</div><div class="v">${cat.view}</div></div>
        <div><div class="k">배정/보유 변경 권한</div><div class="v">${cat.assign}</div></div>
      </div>
      <div class="cat-usage">
        <div class="k">관리 정보</div>
        <div class="cat-usage-bullets">${usageInfoHtml(cat)}</div>
      </div>
      ${assetSectionHtml(cat)}
    `;
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
        <div class="body cat-manage-body"></div>
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
    let currentMode = "list";
    const markDirty = () => { dirty = true; if (currentMode === "list") confirmBtn.disabled = false; };
    const clearDragMarks = () => body.querySelectorAll(".drag-over-top,.drag-over-bottom")
      .forEach(el => el.classList.remove("drag-over-top", "drag-over-bottom"));

    function setMode(mode) {
      currentMode = mode;
      const isList = mode === "list";
      titleEl.textContent = isList ? "분류 관리" : "소분류 추가";
      backBtn.hidden = isList;
      addGroupRow.hidden = !isList;
      body.hidden = !isList;
      createEl.hidden = isList;
      cancelBtn.textContent = "취소";
      confirmBtn.textContent = "저장";
      confirmBtn.disabled = isList ? !dirty : true;
      // 취소 자체는 draft(이름변경/삭제/순서변경/대분류추가)만 버림 — 소분류 생성은 이미 실제 반영됐으므로, 닫을 때 배경 트리를 다시 그려서 그대로 보여줌
      cancelBtn.onclick = isList ? (() => { back.remove(); render(sel); }) : (() => setMode("list"));
      confirmBtn.onclick = isList ? saveAll : commitCreate;
    }
    backBtn.onclick = () => setMode("list");
    back.addEventListener("click", e => { if (e.target === back) cancelBtn.click(); });

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
                data-tip="${blocked ? "등록된 하위 소분류가 있어 삭제할 수 없습니다" : "삭제"}">${TRASH_ICON}</button>
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
                    data-tip="${hasAssets ? "등록된 자산이 있어 삭제할 수 없습니다" : "삭제"}">${TRASH_ICON}</button>
                </div>
              </div>`;
            }).join("")}
            <button class="btn sm cat-manage-add-sub" data-add-sub="${gi}">+ 소분류 추가</button>
          </div>
        </div>`;
      }).join("");
    }
    renderBody();

    function addGroup() {
      const name = addInput.value.trim();
      if (!name) { addInput.focus(); return; }
      draft.unshift({ name, origName: null, subs: [] });
      addInput.value = "";
      markDirty(); renderBody();
    }
    back.querySelector("[data-add-group]").onclick = addGroup;
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
      if (!dirty) return;
      const newCategories = [];
      const newEmptyGroups = [];
      draft.forEach(g => {
        if (!g.subs.length) { newEmptyGroups.push(g.name); return; }
        g.subs.forEach(s => newCategories.push({ ...s.data, group: g.name, sub: s.name }));
      });
      categories.length = 0;
      categories.push(...newCategories);
      window.DATA.emptyGroups = newEmptyGroups;
      back.remove();
      toast("분류 구조가 저장되었습니다");
      render(null);
    }

    // 소분류 생성 — 유형·권한까지 다 채우는 무거운 액션이라 여기서만 예외적으로 "추가"를 누르는 즉시 실제 데이터(categories)에 반영됨.
    // 이 draft(구조 편집)의 [취소]와는 무관 — 다만 목록에 바로 보이도록 draft에도 같이 끼워 넣음
    function enterCreate(gi) {
      createGi = gi;
      createState = {
        name: "", type: "individual",
        view: VIEW_OPTIONS[0], assign: ASSIGN_BY_VIEW[VIEW_OPTIONS[0]].default,
        hiddenFields: [...DEFAULT_HIDDEN_FIELDS.individual],
      };
      renderCreateForm();
      setMode("create");
    }

    function createFormHtml() {
      const s = createState;
      return `
        <div class="field">
          <label>대분류</label>
          <div class="cat-manage-create-group">${draft[createGi].name}</div>
        </div>
        <div class="field">
          <label>소분류명<span class="req">*</span></label>
          <input type="text" class="cat-manage-input" data-f-name value="${s.name}" placeholder="입력" maxlength="30" style="width:100%">
        </div>
        <div class="field">
          <label>자산 유형<span class="req">*</span> <button type="button" class="help-icon" data-f-type-help aria-label="자산 유형 도움말">?</button></label>
          <div class="seg" data-f-type>
            <button type="button" data-val="individual" class="${s.type === "individual" ? "active" : ""}">개별 자산</button>
            <button type="button" data-val="quantity" class="${s.type === "quantity" ? "active" : ""}">수량 자산</button>
          </div>
        </div>
        <div class="field">
          <label>자산 조회 권한<span class="req">*</span></label>
          <button type="button" class="cat-manage-select-btn" data-f-view-btn><span>${s.view}</span><span class="chev">▾</span></button>
          ${TARGET_NEEDED.has(s.view) ? `<button type="button" class="btn sm" style="margin-top:8px" data-f-target="view">대상 선택</button> <span class="hint">선택된 대상 없음</span>` : ""}
        </div>
        <div class="field">
          <label>배정/보유 변경 권한<span class="req">*</span></label>
          <button type="button" class="cat-manage-select-btn" data-f-assign-btn><span>${s.assign}</span><span class="chev">▾</span></button>
          ${TARGET_NEEDED.has(s.assign) ? `<button type="button" class="btn sm" style="margin-top:8px" data-f-target="assign">대상 선택</button> <span class="hint">선택된 대상 없음</span>` : ""}
        </div>
        <div class="field">
          <label>관리 정보</label>
          <p class="hint" style="margin-top:0;margin-bottom:10px">이 유형의 자산 관리에 필요한 정보만 사용하도록 설정할 수 있습니다.</p>
          <div class="cat-manage-fieldlist" data-f-fields>
            ${fieldsForType(s.type).map(f => `
              <div class="cat-manage-fieldrow">
                <span>${FIELD_LABEL[f]}</span>
                <button type="button" class="toggle-switch${s.hiddenFields.includes(f) ? "" : " on"}" data-field="${f}" role="switch" aria-checked="${!s.hiddenFields.includes(f)}" aria-label="${FIELD_LABEL[f]} 노출"><span class="toggle-knob"></span></button>
              </div>`).join("")}
          </div>
        </div>`;
    }

    function renderCreateForm() {
      createEl.innerHTML = createFormHtml();
      confirmBtn.disabled = !createState.name.trim();

      createEl.querySelector("[data-f-name]").addEventListener("input", e => {
        createState.name = e.target.value;
        confirmBtn.disabled = !createState.name.trim();
      });
      createEl.querySelector("[data-f-type]").addEventListener("click", e => {
        const b = e.target.closest("[data-val]");
        if (!b) return;
        createState.type = b.dataset.val;
        createState.hiddenFields = [...DEFAULT_HIDDEN_FIELDS[createState.type]];
        renderCreateForm();
      });
      createEl.querySelector("[data-f-type-help]").onclick = openTypeHelp;
      createEl.querySelector("[data-f-view-btn]").onclick = () => openPermPicker("view");
      createEl.querySelector("[data-f-assign-btn]").onclick = () => openPermPicker("assign");
      createEl.querySelectorAll("[data-f-target]").forEach(b => b.onclick = () => toast(`"대상 선택" — 이후 단계에서 정의`));
      createEl.querySelector("[data-f-fields]").addEventListener("click", e => {
        const b = e.target.closest("[data-field]");
        if (!b) return;
        const f = b.dataset.field;
        const i = createState.hiddenFields.indexOf(f);
        if (i === -1) createState.hiddenFields.push(f); else createState.hiddenFields.splice(i, 1);
        b.classList.toggle("on");
        b.setAttribute("aria-checked", String(!createState.hiddenFields.includes(f)));
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
            <p><b>개별 자산</b><br>노트북, 책상처럼 실물 하나하나를 구분해서 관리하는 자산입니다. 자산마다 별도의 배정 정보와 상태(배정중·재고·수리중·분실·폐기)를 가지며, 필요한 경우 S/N·IMEI 같은 개체 식별 정보도 함께 관리할 수 있습니다.</p>
            <p><b>수량 자산</b><br>유니폼, 사무용품처럼 개별 식별 없이 수량으로만 관리하는 자산입니다. 근무지·구성원별 보유 수량을 기록하고, 재고가 얼마나 남았는지 확인할 수 있습니다.</p>
          </div>
        </div>`;
      document.body.appendChild(p);
      p.addEventListener("click", e => { if (e.target === p) p.remove(); });
      p.querySelector("[data-close]").onclick = () => p.remove();
    }

    // 조회/배정 권한 선택 — 드롭다운이 아니라 라디오 목록의 모달 선택창으로
    function openPermPicker(kind) {
      const isView = kind === "view";
      const options = isView ? VIEW_OPTIONS : ASSIGN_BY_VIEW[createState.view].options;
      const current = createState[kind];
      const p = document.createElement("div");
      p.className = "modal-back";
      p.innerHTML = `
        <div class="modal">
          <h3>${isView ? "자산 조회 권한" : "배정/보유 변경 권한"}</h3>
          <div class="body">
            ${options.map(v => `
              <label class="radio-row">
                <input type="radio" name="perm-pick" value="${v}"${v === current ? " checked" : ""}>
                <span>${v}</span>
              </label>`).join("")}
          </div>
          <div class="foot">
            <button class="btn" data-close>취소</button>
            <button class="btn primary" data-ok>적용</button>
          </div>
        </div>`;
      document.body.appendChild(p);
      p.addEventListener("click", e => { if (e.target === p) p.remove(); });
      p.querySelector("[data-close]").onclick = () => p.remove();
      p.querySelector("[data-ok]").onclick = () => {
        const picked = p.querySelector('input[name="perm-pick"]:checked')?.value;
        if (!picked) return;
        if (isView) {
          createState.view = picked;
          createState.assign = ASSIGN_BY_VIEW[picked].default;
        } else {
          createState.assign = picked;
        }
        p.remove();
        renderCreateForm();
      };
    }

    function commitCreate() {
      const name = createState.name.trim();
      if (!name) return;
      const group = draft[createGi].origName || draft[createGi].name;
      const newCat = { group, sub: name, type: createState.type, hiddenFields: [...createState.hiddenFields], view: createState.view, assign: createState.assign };
      categories.push(newCat);
      draft[createGi].subs.push({ name, data: newCat });
      toast(`"${name}" 소분류가 생성되었습니다`);
      setMode("list");
      renderBody();
    }

    setMode("list");
  }

  function wireAssetSection(c, a) {
    c.querySelectorAll(".cat-prod-row").forEach(row => row.onclick = () => {
      const sub = row.nextElementSibling;
      const chevron = row.querySelector(".cat-prod-chevron");
      const willShow = sub.hidden;
      sub.hidden = !willShow;
      chevron.textContent = willShow ? "▾" : "▸";
    });
    c.querySelectorAll("[data-asset]").forEach(row => row.onclick = e => {
      e.stopPropagation();
      location.href = `asset-detail.html?id=${row.dataset.asset}`;
    });
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
    bindActs(c);
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
    wireAssetSection(c);
  }

  window.CategoryScreen = { render: () => render(null) };
})();
