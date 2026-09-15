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
  // 배정중/재고 외 상태(수리중·분실·폐기)는 "기타"로 묶어서 보여줌 — 구조설계안 3.4 status 정의 기준
  const STATUS_LABEL = { stock: "재고", assigned: "배정중", repair: "수리중", lost: "분실", disposed: "폐기" };
  const FIELD_LABEL = { expiry: "유효기한", serial: "S/N", manufactured: "제조연월일", purchaseDate: "구매일", purchasePrice: "구매가격" };
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
        <span class="cat-tree-head-label">대분류</span>
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
          </button>`).join("") : '<p class="cat-tree-empty">없음</p>')}
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

  // 관리 정보 — 소분류 필드 노출 설정(구조안 3.3)을 전체 필드 대비 on/off 라벨로 표시. S/N은 개별형에만 해당하는 필드라 수량형엔 안 보여줌
  function usageInfoHtml(cat) {
    const hidden = cat.hiddenFields || [];
    const fields = cat.type === "individual"
      ? ["expiry", "serial", "manufactured", "purchaseDate", "purchasePrice"]
      : ["expiry", "manufactured", "purchaseDate", "purchasePrice"];
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
  function openManageModal() {
    // draft: [{ name, subs: [{ name, data(원본 category 객체 참조 — 삭제 가능 여부는 항상 이 원본 소속 기준으로 판단) }] }]
    let draft = groupsOf().map(({ group, subs }) => ({ name: group, subs: subs.map(s => ({ name: s.sub, data: s })) }));
    let dragging = null;
    let dirty = false;

    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal lg cat-manage-modal">
        <h3>분류 관리</h3>
        <div class="cat-manage-add-group">
          <input type="text" class="cat-manage-input" placeholder="입력" maxlength="30">
          <button class="btn primary" data-add-group>+ 대분류 추가</button>
        </div>
        <div class="body cat-manage-body"></div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" data-save disabled>저장</button>
        </div>
      </div>`;
    document.body.appendChild(back);

    const body = back.querySelector(".cat-manage-body");
    const saveBtn = back.querySelector("[data-save]");
    const addInput = back.querySelector(".cat-manage-add-group input");
    const markDirty = () => { dirty = true; saveBtn.disabled = false; };
    const clearDragMarks = () => body.querySelectorAll(".drag-over-top,.drag-over-bottom")
      .forEach(el => el.classList.remove("drag-over-top", "drag-over-bottom"));

    function renderBody() {
      body.innerHTML = draft.map((g, gi) => {
        const blocked = g.subs.length > 0;
        return `
        <div class="cat-manage-group">
          <div class="cat-manage-row cat-manage-group-row" draggable="true" data-drag="group" data-gi="${gi}">
            <span class="cat-manage-handle" title="드래그해서 순서 변경">${HANDLE_ICON}</span>
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
                <span class="cat-manage-handle" title="드래그해서 순서·대분류 변경">${HANDLE_ICON}</span>
                <input type="text" class="cat-manage-name-input" data-rename-sub="${gi}|${si}" value="${s.name}" maxlength="30">
                <div class="cat-manage-row-acts">
                  <button class="cat-manage-icon${hasAssets ? " is-disabled" : ""}" data-del-sub="${gi}|${si}" aria-label="삭제"
                    data-tip="${hasAssets ? "등록된 자산이 있어 삭제할 수 없습니다" : "삭제"}">${TRASH_ICON}</button>
                </div>
              </div>`;
            }).join("")}
            <button class="btn sm cat-manage-add-sub" data-act="소분류 추가">+ 소분류 추가</button>
          </div>
        </div>`;
      }).join("");
    }
    renderBody();

    function addGroup() {
      const name = addInput.value.trim();
      if (!name) { addInput.focus(); return; }
      draft.unshift({ name, subs: [] });
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
      const addSub = e.target.closest('[data-act="소분류 추가"]');
      if (delGroup && !delGroup.classList.contains("is-disabled")) {
        draft.splice(+delGroup.dataset.delGroup, 1);
        markDirty(); renderBody();
      } else if (delSub && !delSub.classList.contains("is-disabled")) {
        const [gi, si] = delSub.dataset.delSub.split("|").map(Number);
        draft[gi].subs.splice(si, 1);
        markDirty(); renderBody();
      } else if (addSub) {
        toast(`"소분류 추가" — 이후 단계에서 정의`);
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

    saveBtn.onclick = () => {
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
    };
    back.querySelector("[data-close]").onclick = () => back.remove();
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
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
    c.querySelector("[data-manage]").onclick = () => openManageModal();
    wireAssetSection(c);
  }

  window.CategoryScreen = { render: () => render(null) };
})();
