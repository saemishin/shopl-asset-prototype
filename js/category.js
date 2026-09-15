/* 분류 관리 — 분류-1 메인 화면. 좌측 트리(대분류는 그룹 헤더, 소분류만 선택 가능) + 우측(선택된 소분류 정보 + 자산 목록) */
(function () {
  const { categories, assets } = window.DATA;

  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300";
    document.body.appendChild(t); setTimeout(() => t.remove(), 1800);
  }
  // 배정중/재고 외 상태(수리중·분실·폐기)는 "기타"로 묶어서 보여줌 — 구조설계안 3.4 status 정의 기준
  const STATUS_LABEL = { stock: "재고", assigned: "배정중", repair: "수리중", lost: "분실", disposed: "폐기" };
  const FIELD_LABEL = { expiry: "유효기한", serial: "S/N", manufactured: "제조연월일", purchaseDate: "구매일", purchasePrice: "구매가격" };
  const btn = (label, cls = "btn sm") => `<button class="${cls}" data-act="${label}">${label}</button>`;
  const bindActs = scope => scope.querySelectorAll("[data-act]").forEach(b =>
    b.onclick = () => toast(`"${b.dataset.act}" — 이후 단계에서 정의`));

  const assetsOf = (group, sub) => assets.filter(a => a.group === group && a.sub === sub);

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
    const body = groups.map(({ group, subs }) => `
      <div class="cat-tree-group">
        <div class="cat-tree-label">${group}</div>
        ${subs.length ? subs.map(s => `
          <button class="cat-tree-item${sel && sel.group === group && sel.sub === s.sub ? " active" : ""}"
                  data-tree="${group}|${s.sub}">
            ${s.sub}<span class="cat-tree-count">${assetsOf(group, s.sub).length}</span>
          </button>`).join("") : '<p class="cat-tree-empty">소분류 없음</p>'}
      </div>`).join("");
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

  // 대분류/소분류 추가·이름변경·삭제·순서변경을 한 곳에서 처리하는 통합 모달(전부 placeholder)
  function openManageModal() {
    const groups = groupsOf();
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal lg">
        <h3>분류 관리</h3>
        <div class="body cat-manage-body">
          ${groups.map(({ group, subs }, gi) => `
            <div class="cat-manage-group">
              <div class="cat-manage-group-head">
                <span class="cat-manage-group-name">${group}</span>
                <div class="cat-manage-group-acts">
                  <button class="btn sm icon-only" data-act="대분류 위로 이동" aria-label="위로" title="위로"${gi === 0 ? " disabled" : ""}>↑</button>
                  <button class="btn sm icon-only" data-act="대분류 아래로 이동" aria-label="아래로" title="아래로"${gi === groups.length - 1 ? " disabled" : ""}>↓</button>
                  <button class="btn sm" data-act="대분류 이름 변경">이름 변경</button>
                  <button class="btn sm" data-act="대분류 삭제">삭제</button>
                </div>
              </div>
              <div class="cat-manage-subs">
                ${subs.map(s => `
                  <div class="cat-manage-sub">
                    <span>${s.sub}</span>
                    <div class="cat-manage-sub-acts">
                      <button class="btn sm" data-act="소분류 이름 변경">이름 변경</button>
                      <button class="btn sm" data-act="소분류 대분류 이동">대분류 이동</button>
                      <button class="btn sm" data-act="소분류 삭제">삭제</button>
                    </div>
                  </div>`).join("")}
                <button class="btn sm" data-act="소분류 추가">+ 소분류 추가</button>
              </div>
            </div>`).join("")}
        </div>
        <div class="foot">
          <button class="btn primary" data-act="대분류 추가">+ 대분류 추가</button>
          <button class="btn" data-close>닫기</button>
        </div>
      </div>`;
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-close]").onclick = () => back.remove();
    bindActs(back);
    document.body.appendChild(back);
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
    c.querySelector("[data-manage]").onclick = () => openManageModal();
    wireAssetSection(c);
  }

  window.CategoryScreen = { render: () => render(null) };
})();
