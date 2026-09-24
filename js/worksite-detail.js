/* 근무지 상세 — 구성원 상세(member-detail.js)와 동일한 패턴의 목업. "업무 > 자산" 서브탭만 실제 동작하고
   나머지 탭·서브탭은 정적 목업(디스크립션에서 설명 예정, 자산관리 기능 스코프 밖).
   실 서비스 조사 결과 근무지 상세의 업무 탭엔 "할 일" 없이 판매 목표(TAM)·보고서·게시판만 있음 —
   구성원과 달리 이 목록으로 구성. 업무를 일반 탭처럼 통일하는 것도 구성원 상세와 동일(사용자 확정 사항). */
(function () {
  const { assets } = window.DATA;

  // 자산 배지 색상 — assets.js의 STATUS_LABEL과 동일(개별형 행에만 필요한 부분만 발췌)
  const STATUS_LABEL = {
    stock: ["재고", "stock"], assigned: ["배정 중", "assigned"], repair: ["수리 중", "repair"],
    lost: ["분실", "lost"], disposed: ["폐기", "disposed"],
  };
  // assets.js의 WS_CODE/WS_ADDRESS와 동일 값(이 파일은 자기 완결적이라 재사용 대신 중복 유지 — 컨벤션)
  const WS_CODE = { "강남점": "GN-01", "판교점": "PG-01", "본사": "HQ-01" };
  const WS_ADDRESS = {
    "강남점": "서울특별시 강남구 테헤란로 129",
    "판교점": "경기도 성남시 분당구 판교역로 235",
    "본사": "서울특별시 중구 을지로 100",
  };
  const AVATAR_WS_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20V9.5L12 4l8 5.5V20"/><path d="M9.5 20v-5h5v5"/></svg>`;
  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300";
    document.body.appendChild(t); setTimeout(() => t.remove(), 1800);
  }
  // 보고서·게시판 그룹 선택 드롭다운 — 구성원 상세와 동일 근거(파라미터 없는 API라 대상별로 안 갈림)
  const WORK_GROUPS = ["개발팀", "디자인팀", "영업팀", "운영팀", "CS팀"];
  // assets.js의 subOrder()와 동일 — 소분류 섹션 순서를 분류 관리 화면 저장 순서로 배치
  const CATEGORY_ORDER = new Map(window.DATA.categories.map((c, i) => [c.sub, i]));
  function subOrder(sub) { return CATEGORY_ORDER.has(sub) ? CATEGORY_ORDER.get(sub) : 999; }

  // 이 근무지에 배정(개별형)·보유(수량형)된 자산 전부 수집 — assets.js view_worksite()와 동일한 집계 로직을
  // 특정 근무지 1곳으로 좁힌 버전
  function collectItems(name) {
    const items = [];
    assets.forEach(a => {
      if (a.type === "individual") {
        (a.assignments || []).forEach(x => { if (x.worksite === name) items.push({ sub: a.sub, qty: 1, asset: a }); });
      } else {
        (a.stocks || []).forEach(x => { if (x.worksite === name) items.push({ sub: a.sub, qty: x.qty, asset: a }); });
      }
    });
    return items;
  }

  function rowHtml(x) {
    const a = x.asset;
    if (a.type === "individual") {
      return `<a class="mdetail-asset-row" href="asset-detail.html?id=${a.id}" target="_blank" rel="noopener">
        <div><div>${a.product}</div><div class="acard-sub">${a.assetNo || "—"}</div></div>
        <span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>
      </a>`;
    }
    return `<a class="mdetail-asset-row" href="asset-detail.html?id=${a.id}" target="_blank" rel="noopener">
      <span>${a.product}</span>
      <span class="badge stock">${x.qty}개</span>
    </a>`;
  }

  function assetSectionHtml(items) {
    if (!items.length) return `<div class="mdetail-empty">배정·보유 중인 자산이 없습니다.</div>`;
    const bySub = new Map();
    items.forEach(x => { if (!bySub.has(x.sub)) bySub.set(x.sub, []); bySub.get(x.sub).push(x); });
    // 배정·보유 자산 모달(assets.js openAssignedAssetsModal)·구성원 상세와 동일한 기준: 소분류는 subOrder(),
    // 그룹 내부는 품목명 우선 + 동점 시 개별형=고유관리번호, 수량형=보유 수량 내림차순
    const groups = [...bySub.entries()].sort((a, b) => subOrder(a[0]) - subOrder(b[0]));
    groups.forEach(([, list]) => list.sort((p, q) => {
      const byProduct = p.asset.product.localeCompare(q.asset.product, "ko");
      if (byProduct) return byProduct;
      if (p.asset.type === "individual") return (p.asset.assetNo || "").localeCompare(q.asset.assetNo || "", "ko");
      return q.qty - p.qty;
    }));
    const groupsHtml = groups.map(([sub, list]) => `
      <div class="mdetail-group-head">${list[0].asset.group} <span class="muted">›</span> ${sub} <span class="muted">${list.length}</span></div>
      ${list.map(rowHtml).join("")}`).join("");
    return `<div class="mdetail-count">전체 <b>${items.length}</b></div>${groupsHtml}`;
  }

  function render() {
    const name = new URLSearchParams(location.search).get("name") || Object.keys(WS_CODE)[0];
    const items = collectItems(name);
    const c = document.getElementById("content");

    const TABS = [{ key: "shift", label: "근무" }, { key: "work", label: "업무" }, { key: "info", label: "정보" }];
    // 실 서비스 조사 결과 근무지 업무엔 "할 일"이 없음(구성원 전용) — 판매 목표(TAM)·보고서·게시판만 있고,
    // 자산은 이번에 새로 추가하는 항목이라 맨 앞으로(사용자 확정)
    const WORK_SUBTABS = [
      { key: "asset", label: "자산" },
      { key: "tam", label: "판매 목표" },
      { key: "report", label: "보고서", dropdown: true },
      { key: "board", label: "게시판", dropdown: true },
    ];
    const state = { tab: "work", subtab: "asset", openDropdown: null };

    function bodyHtml() {
      if (state.tab !== "work") {
        return `<div class="mdetail-placeholder">이 탭은 자산관리 기능 스코프 밖 — 디스크립션에서 설명 예정</div>`;
      }
      if (state.subtab !== "asset") {
        return `<div class="mdetail-placeholder">이 항목은 자산관리 기능 스코프 밖 — 디스크립션에서 설명 예정</div>`;
      }
      return assetSectionHtml(items);
    }

    function draw() {
      c.innerHTML = `
        <div class="detail-topbar"><a href="assets.html" class="backbtn" aria-label="뒤로">←</a></div>
        <div class="mdetail-head">
          <span class="mdetail-avatar ws">${AVATAR_WS_ICON}</span>
          <div>
            <h1>${name}</h1>
            <div class="mdetail-sub">${WS_CODE[name] || '<span class="muted">—</span>'} · ${WS_ADDRESS[name] || '<span class="muted">주소 없음</span>'}</div>
          </div>
        </div>
        <div class="mdetail-tabs">
          ${TABS.map(t => `<button class="mdetail-tab ${state.tab === t.key ? "active" : ""}" data-tab="${t.key}">${t.label}</button>`).join("")}
        </div>
        ${state.tab === "work" ? `<div class="mdetail-panel">
          <div class="mdetail-subtabs">
            ${WORK_SUBTABS.map(t => t.dropdown ? `<span class="mdetail-subtab-wrap">
                <button class="mdetail-subtab" data-dropdown="${t.key}">${t.label} <span class="bchev">▾</span></button>
                ${state.openDropdown === t.key ? `<div class="mdetail-group-dropdown">
                  ${WORK_GROUPS.map(g => `<button class="mdetail-group-item" data-group="${g}">${g}</button>`).join("")}
                </div>` : ""}
              </span>` : `<button class="mdetail-subtab ${state.subtab === t.key ? "active" : ""}" data-subtab="${t.key}">${t.label}</button>`).join("")}
          </div>
          <div class="mdetail-body">${bodyHtml()}</div>
        </div>` : `<div class="mdetail-body">${bodyHtml()}</div>`}`;

      c.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => {
        state.tab = b.dataset.tab;
        if (state.tab === "work" && !state.subtab) state.subtab = "asset";
        state.openDropdown = null;
        draw();
      });
      c.querySelectorAll("[data-subtab]").forEach(b => b.onclick = () => { state.subtab = b.dataset.subtab; state.openDropdown = null; draw(); });
      c.querySelectorAll("[data-dropdown]").forEach(b => b.onclick = (e) => {
        e.stopPropagation();
        state.openDropdown = state.openDropdown === b.dataset.dropdown ? null : b.dataset.dropdown;
        draw();
      });
      c.querySelectorAll("[data-group]").forEach(b => b.onclick = (e) => {
        e.stopPropagation();
        toast(`"${b.dataset.group}" 그룹 선택 — 실제 이동은 이 프로토타입 범위 밖입니다`);
        state.openDropdown = null;
        draw();
      });
    }
    document.addEventListener("click", () => { if (state.openDropdown) { state.openDropdown = null; draw(); } });
    draw();
  }

  window.WorksiteDetailScreen = { render };
})();
