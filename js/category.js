/* 분류 관리 — 분류-1 메인 화면. 좌측 트리(대분류는 그룹 헤더, 소분류만 선택 가능) + 우측(선택된 소분류 정보 + 자산 목록) */
(function () {
  const { categories, assets } = window.DATA;

  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300";
    document.body.appendChild(t); setTimeout(() => t.remove(), 1800);
  }
  function dropdown(anchor, items) {
    document.querySelectorAll(".dropdown-menu").forEach(m => m.remove());
    const menu = document.createElement("div");
    menu.className = "dropdown-menu";
    menu.innerHTML = items.map((x, i) => `<button data-i="${i}">${x}</button>`).join("");
    const r = anchor.getBoundingClientRect();
    menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${Math.max(8, r.right - 180)}px;min-width:180px`;
    document.body.appendChild(menu);
    menu.querySelectorAll("button").forEach(b => b.onclick = () => { menu.remove(); toast(`"${items[+b.dataset.i]}" — 이후 단계에서 정의`); });
    setTimeout(() => {
      const close = e => { if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener("click", close); } };
      document.addEventListener("click", close);
    });
  }
  const MORE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>`;
  const STATUS_LABEL = { stock: "재고", assigned: "배정중", repair: "수리중", lost: "분실", disposed: "폐기" };
  const FIELD_LABEL = { expiry: "유효기한", serial: "S/N", manufactured: "제조연월일", purchaseDate: "구매일", purchasePrice: "구매가격" };
  const btn = (label, cls = "btn sm") => `<button class="${cls}" data-act="${label}">${label}</button>`;
  const bindActs = scope => scope.querySelectorAll("[data-act]").forEach(b =>
    b.onclick = () => toast(`"${b.dataset.act}" — 이후 단계에서 정의`));

  const assetsOf = (group, sub) => assets.filter(a => a.group === group && a.sub === sub);

  // 대분류 등장 순서대로 그룹핑(소분류는 categories 배열 순서 그대로)
  function groupsOf() {
    const order = [];
    const map = {};
    categories.forEach(c => {
      if (!map[c.group]) { map[c.group] = []; order.push(c.group); }
      map[c.group].push(c);
    });
    return order.map(group => ({ group, subs: map[group] }));
  }

  function treeHtml(groups, sel) {
    return groups.map(({ group, subs }) => `
      <div class="cat-tree-group">
        <div class="cat-tree-label">${group}</div>
        ${subs.map(s => `
          <button class="cat-tree-item${sel.group === group && sel.sub === s.sub ? " active" : ""}"
                  data-tree="${group}|${s.sub}">
            ${s.sub}<span class="cat-tree-count">${assetsOf(group, s.sub).length}</span>
          </button>`).join("")}
      </div>`).join("");
  }

  function assetRowHtml(a) {
    const right = a.type === "individual"
      ? `<span class="badge ${a.status}">${STATUS_LABEL[a.status]}</span>`
      : `${(a.stocks || []).reduce((s, x) => s + x.qty, 0)}개 · 보유 ${(a.stocks || []).length}곳`;
    return `
      <tr class="clickable" data-asset="${a.id}">
        <td>${a.product}</td>
        <td>${right}</td>
        <td>${a.expiry ? window.fmtDate(a.expiry) : '<span class="muted">—</span>'}</td>
      </tr>`;
  }

  function detailHtml(cat) {
    const list = assetsOf(cat.group, cat.sub);
    const hidden = cat.hiddenFields || [];
    const hiddenLabel = hidden.length ? hidden.map(f => FIELD_LABEL[f] || f).join(", ") : "숨김 필드 없음";
    return `
      <div class="cat-detail-head">
        <div>
          <div class="cat-detail-crumb">${cat.group} › ${cat.sub}</div>
          <h3>${cat.sub}</h3>
        </div>
        <div class="cat-detail-acts">
          ${btn("소분류 수정")}
          <button class="btn sm icon-only" data-submore aria-label="소분류 관리">${MORE_ICON}</button>
        </div>
      </div>
      <div class="kv2 cat-detail-kv">
        <div><div class="k">자산 유형</div><div class="v"><span class="type-pill">${cat.type === "individual" ? "개별 자산" : "수량 자산"}</span></div></div>
        <div><div class="k">자산 조회 권한</div><div class="v">${cat.view}</div></div>
        <div><div class="k">배정/보유 변경 권한</div><div class="v">${cat.assign}</div></div>
        <div><div class="k">필드 노출 설정</div><div class="v">${hiddenLabel}</div></div>
      </div>
      <div class="cat-asset-head">
        <h4>자산 목록 <span class="chip">전체 ${list.length}</span></h4>
      </div>
      ${list.length ? `
        <div class="table-wrap">
          <table>
            <thead><tr><th>제품명</th><th>${cat.type === "individual" ? "상태" : "보유 현황"}</th><th>유효기한</th></tr></thead>
            <tbody>${list.map(assetRowHtml).join("")}</tbody>
          </table>
        </div>` : '<p class="muted" style="padding:12px 0">등록된 자산이 없습니다</p>'}
    `;
  }

  function render(sel) {
    const c = document.getElementById("content");
    const groups = groupsOf();
    if (!sel) sel = { group: groups[0].group, sub: groups[0].subs[0].sub };
    const cat = categories.find(x => x.group === sel.group && x.sub === sel.sub);

    c.innerHTML = `
      <div class="tabs">
        <a href="assets.html">현황</a>
        <a class="active">분류</a>
        <a href="settings.html">설정</a>
      </div>
      <div class="toolbar">
        <div class="right">${btn("대분류 추가", "btn sm primary")}</div>
      </div>
      <div class="cat-layout">
        <nav class="cat-tree">${treeHtml(groups, sel)}</nav>
        <div class="cat-detail">${detailHtml(cat)}</div>
      </div>
    `;
    bindActs(c);
    c.querySelectorAll("[data-tree]").forEach(b => b.onclick = () => {
      const [group, sub] = b.dataset.tree.split("|");
      render({ group, sub });
    });
    c.querySelectorAll("[data-asset]").forEach(row => row.onclick = () => {
      location.href = `asset-detail.html?id=${row.dataset.asset}`;
    });
    const submore = c.querySelector("[data-submore]");
    if (submore) submore.onclick = () => dropdown(submore, ["소분류 수정", "소분류 대분류 이동", "소분류 삭제"]);
  }

  window.CategoryScreen = { render: () => render(null) };
})();
