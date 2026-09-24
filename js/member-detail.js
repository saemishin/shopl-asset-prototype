/* 구성원 상세 — 실제 대시보드 화면 구조를 재현한 목업. "업무 > 자산" 서브탭만 실제 동작하고
   나머지 탭·서브탭은 정적 목업(디스크립션에서 설명 예정, 자산관리 기능 스코프 밖).
   실제 대시보드는 "업무"가 페이지 탭이 아니라 팝오버 드롭다운(정보/근태와 성격이 다름)이지만,
   자산을 그 자리에서 바로 보여줘야 해서 이 프로토타입에서만 일반 탭처럼 통일(사용자 확정 사항). */
(function () {
  const { assets } = window.DATA;

  // 자산 배지 색상 — assets.js의 STATUS_LABEL과 동일(개별형 행에만 필요한 부분만 발췌)
  const STATUS_LABEL = {
    stock: ["재고", "stock"], assigned: ["배정 중", "assigned"], repair: ["수리 중", "repair"],
    lost: ["분실", "lost"], disposed: ["폐기", "disposed"],
  };
  // assets.js의 MEMBER_INFO와 동일 값(이 파일은 자기 완결적이라 재사용 대신 중복 유지 — 이 프로토타입 전반의 컨벤션)
  const MEMBER_INFO = {
    "김민수": { team: "개발팀", empNo: "2021001", phone: "010-2001-1234", grade: "Lv.3", jobTitle: "매니저" },
    "이서연": { team: "디자인팀", empNo: "2021015", phone: "010-3412-5678", grade: "Lv.2", jobTitle: "주임" },
    "박지훈": { team: "영업팀", empNo: "2020032", phone: "010-8823-9910", grade: "Lv.4", jobTitle: "팀장" },
    "정우성": { team: "CS팀", empNo: "2022041", phone: "010-5567-2231", grade: "Lv.1", jobTitle: "사원" },
    "김철수": { team: "운영팀", empNo: "2019008", phone: "010-9012-4456", grade: "Lv.5", jobTitle: "팀장" },
    "최유진": { team: "개발팀", empNo: "2023019", phone: "010-6634-8821", grade: "Lv.1", jobTitle: "사원" },
    "한소희": { team: "디자인팀", empNo: "2022055", phone: "010-4478-2093", grade: "Lv.2", jobTitle: "주임" },
    "오세훈": { team: "운영팀", empNo: "2018014", phone: "010-7712-3345", grade: "Lv.4", jobTitle: "매니저" },
  };
  const AVATAR_COLORS = ["#5b8def", "#8f6ef0", "#eb7f8b", "#3fb37f", "#e0a63c", "#4dabf7"];
  function avatarColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
  }
  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300";
    document.body.appendChild(t); setTimeout(() => t.remove(), 1800);
  }
  // 보고서·게시판 그룹 선택 드롭다운 — 실 서비스 조사 결과 이 근무지/구성원으로 좁혀진 목록이 아니라
  // 보고 있는 관리자 세션 기준의 전역 그룹 목록(파라미터 없는 API)이라, 이 프로토타입도 근무지 상세와
  // 동일한 더미 그룹 목록을 그대로 재사용(구성원마다 달라지지 않음)
  const WORK_GROUPS = ["개발팀", "디자인팀", "영업팀", "운영팀", "CS팀"];
  // assets.js의 subOrder()와 동일 — 소분류 섹션 순서를 가나다순이 아니라 분류 관리 화면에 저장된
  // 등장 순서로 배치(배정·보유 자산 모달과 동일 기준으로 맞춤, 2026-09-24)
  const CATEGORY_ORDER = new Map(window.DATA.categories.map((c, i) => [c.sub, i]));
  function subOrder(sub) { return CATEGORY_ORDER.has(sub) ? CATEGORY_ORDER.get(sub) : 999; }

  // 이 구성원에게 배정(개별형)·보유(수량형)된 자산 전부 수집 — assets.js view_employee()와 동일한 집계 로직을
  // 특정 구성원 1명으로 좁힌 버전
  function collectItems(name) {
    const items = [];
    assets.forEach(a => {
      if (a.type === "individual") {
        (a.assignments || []).forEach(x => { if (x.employee === name) items.push({ sub: a.sub, qty: 1, asset: a }); });
      } else {
        (a.stocks || []).forEach(x => { if (x.employee === name) items.push({ sub: a.sub, qty: x.qty, asset: a }); });
      }
    });
    return items;
  }

  // 정보 > 추가 정보 탭 스타일 참고(흰 박스 안에 풀너비 행 + 구분선) — 개별 카드가 아니라 한 박스 안의
  // 나열형 리스트라, 자산 상세의 .acard(개별 박스+간격)와는 다른 톤으로 새로 정의(.mdetail-asset-row)
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
    // 배정·보유 자산 모달(assets.js openAssignedAssetsModal)과 동일한 기준: 소분류는 subOrder(),
    // 그룹 내부는 품목명 우선 + 동점 시 개별형=고유관리번호, 수량형=보유 수량 오름차순
    const groups = [...bySub.entries()].sort((a, b) => subOrder(a[0]) - subOrder(b[0]));
    groups.forEach(([, list]) => list.sort((p, q) => {
      const byProduct = p.asset.product.localeCompare(q.asset.product, "ko");
      if (byProduct) return byProduct;
      if (p.asset.type === "individual") return (p.asset.assetNo || "").localeCompare(q.asset.assetNo || "", "ko");
      return p.qty - q.qty;
    }));
    const groupsHtml = groups.map(([sub, list]) => `
      <div class="mdetail-group-head">${list[0].asset.group} <span class="muted">›</span> ${sub} <span class="muted">${list.length}</span></div>
      ${list.map(rowHtml).join("")}`).join("");
    return `<div class="mdetail-count">전체 <b>${items.length}</b></div>${groupsHtml}`;
  }

  function render() {
    const name = new URLSearchParams(location.search).get("name") || Object.keys(MEMBER_INFO)[0];
    const info = MEMBER_INFO[name] || {};
    const items = collectItems(name);
    const c = document.getElementById("content");

    const TABS = [{ key: "info", label: "정보" }, { key: "attendance", label: "근태" }, { key: "work", label: "업무" }];
    const WORK_SUBTABS = [
      { key: "asset", label: "자산" },
      { key: "todo", label: "할 일" },
      { key: "report", label: "보고서", dropdown: true },
      { key: "board", label: "게시판", dropdown: true },
    ];
    // 업무 > 자산을 바로 보여주는 게 이 페이지를 만든 목적이라 기본 진입 상태로 설정
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
          <span class="mdetail-avatar" style="background:${avatarColor(name)}">${name[0]}</span>
          <div>
            <h1>${name}</h1>
            <div class="mdetail-sub">${info.jobTitle ? `${info.team} · ${info.jobTitle}` : '<span class="muted">없음</span>'}</div>
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
      // 보고서·게시판 — 실제 페이지 이동 없이 그룹 선택 드롭다운까지만 구현(사용자 확정 스코프)
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

  window.MemberDetailScreen = { render };
})();
