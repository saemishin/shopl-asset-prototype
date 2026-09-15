/* 분류 관리 — 분류-1 메인 화면(대분류 섹션 + 소분류 요약 테이블) */
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
  const btn = (label, cls = "btn sm") => `<button class="${cls}" data-act="${label}">${label}</button>`;
  const bindActs = scope => scope.querySelectorAll("[data-act]").forEach(b =>
    b.onclick = () => toast(`"${b.dataset.act}" — 이후 단계에서 정의`));

  const countOf = (group, sub) => assets.filter(a => a.group === group && a.sub === sub).length;

  // 대분류 노출 순서는 categories 배열 등장 순서 그대로(4.2: 실제로는 조회 권한 통과하는 소분류가 있는 대분류만 노출되지만,
  // 이 화면은 자산관리 권한 보유자 기준이라 전부 노출)
  function groupsOf() {
    const order = [];
    const map = {};
    categories.forEach(c => {
      if (!map[c.group]) { map[c.group] = []; order.push(c.group); }
      map[c.group].push(c);
    });
    return order.map(group => ({ group, subs: map[group] }));
  }

  function subRowHtml(group, s) {
    return `
      <tr>
        <td>${s.sub}</td>
        <td><span class="type-pill">${s.type === "individual" ? "개별 자산" : "수량 자산"}</span></td>
        <td>${s.view}</td>
        <td>${s.assign}</td>
        <td class="num">${countOf(group, s.sub)}</td>
        <td class="c"><button class="btn sm icon-only" data-submore="${group}|${s.sub}" aria-label="소분류 관리">${MORE_ICON}</button></td>
      </tr>`;
  }
  function groupSectionHtml({ group, subs }) {
    return `
      <section class="cat-group">
        <div class="cat-group-head">
          <h4>${group} <span class="chip">소분류 ${subs.length}개</span></h4>
          <div class="cat-group-acts">
            ${btn("소분류 추가")}
            <button class="btn sm icon-only" data-groupmore="${group}" aria-label="대분류 관리">${MORE_ICON}</button>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>소분류</th><th>자산 유형</th><th>자산 조회 권한</th><th>배정/보유 변경 권한</th>
                <th class="num">자산 수</th><th class="c"></th>
              </tr>
            </thead>
            <tbody>${subs.map(s => subRowHtml(group, s)).join("")}</tbody>
          </table>
        </div>
      </section>`;
  }

  function render() {
    const c = document.getElementById("content");
    const groups = groupsOf();
    c.innerHTML = `
      <div class="tabs">
        <a href="assets.html">현황</a>
        <a class="active">분류</a>
        <a href="settings.html">설정</a>
      </div>
      <div class="toolbar">
        <div class="right">${btn("대분류 추가", "btn sm primary")}</div>
      </div>
      <div class="cat-groups">${groups.map(groupSectionHtml).join("")}</div>
    `;
    bindActs(c);
    c.querySelectorAll("[data-groupmore]").forEach(b => b.onclick = () =>
      dropdown(b, ["대분류 수정", "대분류 삭제"]));
    c.querySelectorAll("[data-submore]").forEach(b => b.onclick = () =>
      dropdown(b, ["소분류 수정", "소분류 대분류 이동", "소분류 삭제"]));
  }

  window.CategoryScreen = { render };
})();
