/* 자산 상세 — 페이지. Shopl 상세(판매량·근무지) 레이아웃 참조 */
(function () {
  const TODAY = new Date("2026-09-04");
  const { assets } = window.DATA;
  // held(보유 중)는 수량형 전용 — assets.js STATUS_LABEL과 동일하게 유지(파일별 로컬 상수, 공용 모듈 아님)
  const STATUS_LABEL = {
    stock: ["재고", "stock"], assigned: ["배정 중", "assigned"], repair: ["수리 중", "repair"],
    lost: ["분실", "lost"], disposed: ["폐기", "disposed"], held: ["보유 중", "assigned"],
  };

  function expiryBadge(d) {
    if (!d) return '<span class="muted">—</span>';
    const days = Math.ceil((new Date(d) - TODAY) / 86400000);
    const [t, c] = days < 0 ? ["만료", "exp-over"] : days <= 7 ? ["만료 예정", "exp-soon"] : ["유효", "exp-valid"];
    return `${window.fmtDate(d)} <span class="badge ${c}">${t}</span>`;
  }
  const chips = arr => (arr && arr.length) ? arr.map(l => `<span class="tag">${l}</span>`).join("") : '<span class="muted">—</span>';

  // 메모: 최대 500자(구조설계안 3.4), 화면엔 길이 제한 없이 전체 노출(말줄임·접기 없음)
  const memoHtml = note => note ? `<span>${note}</span>` : '<span class="muted">—</span>';

  const IC_EMP = `<svg class="hi" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5"/></svg>`;
  const IC_WS = `<svg class="hi" viewBox="0 0 24 24"><path d="M4 20V9.5L12 4l8 5.5V20"/><path d="M9.5 20v-5h5v5"/></svg>`;
  const IC_EDIT = `<svg viewBox="0 0 24 24"><path d="M4 20l1-4L16 5l3 3L8 19l-4 1z"/><path d="M13.5 6.5l4 4"/></svg>`;
  const INFO_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8v.01"/></svg>`;

  // 배정 현황 카드 — 구성원/근무지 여부에 따른 아이덴티티 표현.
  // ※ 그룹(부서)·근무지 코드는 구조설계안에 없는 필드 — 구성원/근무지가 "기존 재사용" 엔티티라 여기선 프로토타입 데모용 샘플값만 매핑
  const EMP_GROUP = {
    "김민수": "개발팀", "이서연": "디자인팀", "박지훈": "영업팀", "정우성": "CS팀", "김철수": "운영팀",
    "최유진": "개발팀", "한소희": "디자인팀", "오세훈": "운영팀",
  };
  const WS_CODE = { "강남점": "GN-01", "판교점": "PG-01", "본사": "HQ-01" };
  // 근무지별 엑셀 다운로드(아이데이션 중)용 주소 — 실 서비스 DB엔 근무지마다 이미 주소값이 있어서 프로토타입엔 더미로만 시드(assets.js의 WS_ADDRESS와 동일)
  const WS_ADDRESS = {
    "강남점": "서울특별시 강남구 테헤란로 129",
    "판교점": "경기도 성남시 분당구 판교역로 235",
    "본사": "서울특별시 중구 을지로 100",
  };
  // 배정 추가 시 대상 후보 목록 — category.js의 MEMBERS와 동일 값(전사 인원 12명, 프로토타입 데모용)
  // empNo·phone은 assets.js의 MEMBER_INFO와 동일 값(8명), 나머지 4명은 같은 형식으로 새로 시드.
  // grade(등급)는 구성원별 엑셀 다운로드(아이데이션 중)용 — 실 서비스엔 구성원마다 저장돼있는 값, 프로토타입엔 더미로만 시드
  const MEMBERS = [
    { name: "김민수", team: "개발팀", empNo: "2021001", phone: "010-2001-1234", grade: "Lv.3" },
    { name: "이서연", team: "디자인팀", empNo: "2021015", phone: "010-3412-5678", grade: "Lv.2" },
    { name: "박지훈", team: "영업팀", empNo: "2020032", phone: "010-8823-9910", grade: "Lv.4" },
    { name: "정우성", team: "CS팀", empNo: "2022041", phone: "010-5567-2231", grade: "Lv.1" },
    { name: "김철수", team: "운영팀", empNo: "2019008", phone: "010-9012-4456", grade: "Lv.5" },
    { name: "최유진", team: "개발팀", empNo: "2023019", phone: "010-6634-8821", grade: "Lv.1" },
    { name: "한소희", team: "디자인팀", empNo: "2022055", phone: "010-4478-2093", grade: "Lv.2" },
    { name: "장민호", team: "국내영업", empNo: "2020018", phone: "010-2345-6712", grade: "Lv.3" },
    { name: "오세훈", team: "운영팀", empNo: "2018014", phone: "010-7712-3345", grade: "Lv.4" },
    { name: "배수지", team: "CS팀", empNo: "2021028", phone: "010-3356-7789", grade: "Lv.2" },
    { name: "윤재현", team: "해외영업", empNo: "2019033", phone: "010-4467-8890", grade: "Lv.5" },
    { name: "임하늘", team: "개발팀", empNo: "2022009", phone: "010-5578-9901", grade: "Lv.1" },
  ];
  const CLOSE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
  const AVATAR_COLORS = ["#5b8def", "#8f6ef0", "#eb7f8b", "#3fb37f", "#e0a63c", "#4dabf7"];
  function avatarColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
  }
  const AVATAR_WS_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20V9.5L12 4l8 5.5V20"/><path d="M9.5 20v-5h5v5"/></svg>`;
  // 프로필 이미지+이름+그룹은 공통 컴포넌트라 그 영역엔 손대지 않고, 구성원/근무지 구분은 카드 우측 상단에 별도로 표시(자산관리 카드의 corner 아이콘과 동일 패턴)
  function assignIdentity(x) {
    if (x.employee) {
      return `<span class="acard-avatar" style="background:${avatarColor(x.employee)}">${x.employee[0]}</span>
        <div><div class="acard-name">${x.employee}</div><div class="acard-sub">${EMP_GROUP[x.employee] || '<span class="muted">—</span>'}</div></div>`;
    }
    return `<span class="acard-avatar ws">${AVATAR_WS_ICON}</span>
      <div><div class="acard-name">${x.worksite}</div><div class="acard-sub">${WS_CODE[x.worksite] || '<span class="muted">—</span>'}</div></div>`;
  }
  const typeBadge = x => `<span class="acard-type" title="${x.employee ? "구성원" : "근무지"}">${x.employee ? IC_EMP : IC_WS}</span>`;

  const photosOf = window.assetPhotos;   // 목록과 공유 (js/data.js)
  function tsNow() {
    const d = new Date(), p = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  }
  const zipName = a => `${(a.assetNo || a.product).replace(/[\\/:*?"<>|\s]+/g, "_")}_Photos_${tsNow()}.zip`;

  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300";
    document.body.appendChild(t); setTimeout(() => t.remove(), 1800);
  }
  // 되돌릴 수 있는 상태 전이(수리 접수/분실 신고/수리 완료/분실 회수) 공용 확인 모달 — 재배정 모달과 같은
  // 회색 안내 박스(perm-info-note)로 뭐가 바뀌는지 미리 알려줌. 입력값 없음(반납과 동일한 이유 — 구조설계안에
  // 상태 변경 자체에 별도 입력 필드가 정의돼 있지 않음)
  function openStatusConfirmModal(title, note, onConfirm) {
    const cb = document.createElement("div");
    cb.className = "modal-back";
    cb.style.zIndex = 340;
    cb.innerHTML = `
      <div class="modal" style="width:380px">
        <h3>${title}</h3>
        <div class="body"><div class="perm-info-note">${INFO_ICON}<span>${note}</span></div></div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn primary" data-cok>저장</button>
        </div>
      </div>`;
    cb.addEventListener("click", e => { if (e.target === cb) cb.remove(); });
    cb.querySelector("[data-cclose]").onclick = () => cb.remove();
    cb.querySelector("[data-cok]").onclick = () => { cb.remove(); onConfirm(); };
    document.body.appendChild(cb);
  }
  // script는 활동 이력용 "그룹: 세부" 전체 이름("상태 변경: 수리 접수" 등) — 토스트는 그룹 접두어 없이
  // 세부 동작명만 써야 자연스러워서 ": " 뒤쪽만 잘라 씀
  function applyStatusChange(a, script, newStatus) {
    const before = STATUS_LABEL[a.status][0];
    a.status = newStatus;
    logActivity(a, { script, before, after: STATUS_LABEL[a.status][0] });
    toast(`${script.split(": ").pop()}되었습니다.`);
    render();
  }
  // 수리 완료·분실 회수는 고정 목적지가 없음 — 반납과 동일한 파생 규칙(활성 배정 유무)으로 배정중/재고 복귀
  const deriveReturnStatus = a => ((a.assignments || []).length > 0 ? "assigned" : "stock");
  function handleRepairStart(a) {
    openStatusConfirmModal("수리 접수하시겠습니까?", "수리 접수 시 기존 배정은 유지된 채 상태만 수리 중으로 변경됩니다.",
      () => applyStatusChange(a, "상태 변경: 수리 접수", "repair"));
  }
  function handleLostReport(a) {
    openStatusConfirmModal("분실 신고하시겠습니까?", "분실 신고 시 기존 배정은 유지된 채 상태만 분실로 변경됩니다.",
      () => applyStatusChange(a, "상태 변경: 분실 신고", "lost"));
  }
  function handleRepairDone(a) {
    openStatusConfirmModal("수리 완료 처리하시겠습니까?", "수리 완료 시 배정 여부에 따라 배정 중 또는 재고 상태로 돌아갑니다.",
      () => applyStatusChange(a, "상태 변경: 수리 완료", deriveReturnStatus(a)));
  }
  function handleLostRecover(a) {
    openStatusConfirmModal("분실 회수 처리하시겠습니까?", "분실 회수 시 배정 여부에 따라 배정 중 또는 재고 상태로 돌아갑니다.",
      () => applyStatusChange(a, "상태 변경: 분실 회수", deriveReturnStatus(a)));
  }
  // 폐기 처리 — 되돌릴 수 없는 최종 상태라 자산 삭제와 동일한 DELETE 입력 확인 패턴 재사용.
  // 활성 배정은 자동 종료(구조설계안 3.4)하되, 반납처럼 레코드별로 따로 로그를 남기지 않고 "폐기 처리"
  // 한 건으로 묶어서 기록 — 배정 종료가 이 액션의 부수효과일 뿐 별도로 시작된 사용자 행동이 아니기 때문
  // (자산 정보 수정처럼 사용자가 각각 입력한 필드들과는 성격이 다름 — 그쪽은 필드별로 각각 기록함)
  function openDisposeModal(a) {
    const cb = document.createElement("div");
    cb.className = "modal-back";
    cb.style.zIndex = 340;
    cb.innerHTML = `
      <div class="modal" style="width:380px">
        <h3>폐기 처리하시겠습니까?</h3>
        <div class="body">
          <div class="danger-note">${WARN_ICON}<span>폐기 처리하면 되돌릴 수 없습니다. 기존 배정은 자동으로 종료되며, 이후 배정 추가·자산 수정이 제한됩니다.</span></div>
          <div class="field" style="margin-top:14px;margin-bottom:0">
            <input type="text" data-del-input placeholder="입력">
          </div>
          <p class="muted" style="margin-top:6px">박스에 DELETE를 입력하면 [저장] 버튼이 활성화됩니다.</p>
        </div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn danger" data-cok disabled>저장</button>
        </div>
      </div>`;
    cb.addEventListener("click", e => { if (e.target === cb) cb.remove(); });
    cb.querySelector("[data-cclose]").onclick = () => cb.remove();
    const input = cb.querySelector("[data-del-input]");
    const okBtn = cb.querySelector("[data-cok]");
    const confirmed = () => input.value.trim().toUpperCase() === "DELETE";
    input.addEventListener("input", () => { okBtn.disabled = !confirmed(); });
    okBtn.onclick = () => {
      if (!confirmed()) return;
      const before = STATUS_LABEL[a.status][0];
      a.status = "disposed";
      a.assignments = [];
      logActivity(a, { script: "상태 변경: 폐기 처리", before, after: STATUS_LABEL[a.status][0] });
      cb.remove();
      toast("폐기 처리되었습니다.");
      render();
    };
    document.body.appendChild(cb);
    input.focus();
  }
  const STATUS_ACTION_HANDLERS = {
    "수리 접수": handleRepairStart,
    "분실 신고": handleLostReport,
    "수리 완료": handleRepairDone,
    "분실 회수": handleLostRecover,
    "폐기 처리": openDisposeModal,
  };
  // 상태 변경(상태 뱃지) 전용 드롭다운 — "···" 메뉴의 moreDropdown()과 같은 이유로 공용 dropdown() 대신 분리
  function statusDropdown(anchor, items, a) {
    document.querySelectorAll(".dropdown-menu").forEach(m => m.remove());
    const menu = document.createElement("div");
    menu.className = "dropdown-menu";
    menu.innerHTML = items.map((x, i) => `<button data-i="${i}"${x === "폐기 처리" ? ' class="danger"' : ""}>${x}</button>`).join("");
    const r = anchor.getBoundingClientRect();
    menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${Math.max(8, r.right - 180)}px;min-width:180px`;
    document.body.appendChild(menu);
    menu.querySelectorAll("button").forEach(b => b.onclick = () => {
      menu.remove();
      const label = items[+b.dataset.i];
      (STATUS_ACTION_HANDLERS[label] || (() => toast(`"${label}" — 이후 단계에서 정의`)))(a);
    });
    setTimeout(() => {
      const close = e => { if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener("click", close); } };
      document.addEventListener("click", close);
    });
  }
  // 보유 현황 검색의 구성원/근무지 카테고리 선택 — 네이티브 select 대신 앱 공용 dropdown-menu UI로
  function openStockCatMenu(anchor, current, onSelect) {
    document.querySelectorAll(".dropdown-menu").forEach(m => m.remove());
    const items = [["employee", "구성원"], ["worksite", "근무지"]];
    const menu = document.createElement("div");
    menu.className = "dropdown-menu";
    menu.innerHTML = items.map(([v, label]) => `<button data-v="${v}" class="${v === current ? "active" : ""}">${label}</button>`).join("");
    const r = anchor.getBoundingClientRect();
    menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${r.left}px;min-width:${r.width}px`;
    document.body.appendChild(menu);
    menu.querySelectorAll("button").forEach(b => b.onclick = () => { menu.remove(); onSelect(b.dataset.v); });
    setTimeout(() => {
      const close = e => { if (!menu.contains(e.target) && e.target !== anchor) { menu.remove(); document.removeEventListener("click", close); } };
      document.addEventListener("click", close);
    });
  }
  function confirmModal(msg, onOk) {
    const cb = document.createElement("div");
    cb.className = "modal-back";
    cb.style.zIndex = 340;
    cb.innerHTML = `
      <div class="modal" style="width:380px">
        <div class="body" style="padding-top:20px;font-size:13px">${msg}</div>
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
  const WARN_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 9v4M12 16.5h.01M10.3 3.9 2.5 17.5a1.7 1.7 0 0 0 1.47 2.55h16.06a1.7 1.7 0 0 0 1.47-2.55L13.7 3.9a1.7 1.7 0 0 0-2.94 0z"/></svg>`;
  // 중요 데이터 삭제 확인 패턴 — 실수 방지를 위해 "DELETE"를 정확히 입력해야 삭제 버튼 활성화
  function openDeleteAssetModal(a) {
    const cb = document.createElement("div");
    cb.className = "modal-back";
    cb.style.zIndex = 340;
    cb.innerHTML = `
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
      </div>`;
    cb.addEventListener("click", e => { if (e.target === cb) cb.remove(); });
    cb.querySelector("[data-cclose]").onclick = () => cb.remove();
    const input = cb.querySelector("[data-del-input]");
    const okBtn = cb.querySelector("[data-cok]");
    const confirmed = () => input.value.trim().toUpperCase() === "DELETE";
    input.addEventListener("input", () => { okBtn.disabled = !confirmed(); });
    okBtn.onclick = () => {
      if (!confirmed()) return;
      assets.splice(assets.indexOf(a), 1);
      // 상세 → 목록 이동이 즉시 일어나서 이 페이지에서 토스트를 띄우면 거의 안 보임 — 목록 페이지 첫 렌더에서 대신 띄움.
      // 이동한 페이지에서 data.js가 처음부터 재실행되며 위 splice가 무효화되는 것도 같은 이유로 justDeletedAssetId로 별도 전달(data.js 참조)
      sessionStorage.setItem("justDeletedAssetId", a.id);
      sessionStorage.setItem("pendingToast", "삭제되었습니다.");
      location.href = "assets.html";
    };
    document.body.appendChild(cb);
    input.focus();
  }
  // "···" 자산관리 메뉴 전용 드롭다운 — 상태 변경 드롭다운(dropdown())과 공용 함수를 쓰면 항목별 분기가 안 돼서
  // 분리. "자산 삭제"·"자산 수정"만 실제 동작. 소분류 이동은 별도 액션이 아니라 자산 수정 폼 안의 소분류
  // 필드로 흡수됨(재배정이 배정과 다른 별도 액션인 것과 달리, 소분류는 전역 자산관리 권한만 있으면 다른 필드
  // 수정과 다를 게 없는 값이라 굳이 나눌 이유가 없다고 재검토 후 병합)
  function moreDropdown(anchor, items, a) {
    document.querySelectorAll(".dropdown-menu").forEach(m => m.remove());
    const menu = document.createElement("div");
    menu.className = "dropdown-menu";
    menu.innerHTML = items.map((x, i) => `<button data-i="${i}"${x === "자산 삭제" ? ' class="danger"' : ""}>${x}</button>`).join("");
    const r = anchor.getBoundingClientRect();
    menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${Math.max(8, r.right - 180)}px;min-width:180px`;
    document.body.appendChild(menu);
    menu.querySelectorAll("button").forEach(b => b.onclick = () => {
      menu.remove();
      const label = items[+b.dataset.i];
      if (label === "자산 삭제") openDeleteAssetModal(a);
      else if (label === "자산 수정") {
        window.openAssetAddModal({
          asset: a,
          logActivity: entry => logActivity(a, entry),
          onSaved: () => render(),
        });
      } else toast(`"${label}" — 이후 단계에서 정의`);
    });
    setTimeout(() => {
      const close = e => { if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener("click", close); } };
      document.addEventListener("click", close);
    });
  }
  const btn = (label, cls = "btn sm") => `<button class="${cls}" data-act="${label}">${label}</button>`;
  const bindActs = scope => scope.querySelectorAll("[data-act]").forEach(b =>
    b.onclick = () => toast(`"${b.dataset.act}" — 이후 단계에서 정의`));

  // QR 라벨 샘플 이미지 — 실제 디코딩되는 값은 아니고 목업용 정적 패턴(파인더 패턴 3개 + 결정적 데이터 영역)
  function qrSampleSvg() {
    const n = 21, cell = 4, size = n * cell;
    const mods = [];
    const finder = (ox, oy) => {
      for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
        if (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4)) mods.push([ox + x, oy + y]);
      }
    };
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
    let seed = 42;
    const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const inFinder = (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8);
      if (!inFinder && rand() > 0.55) mods.push([x, y]);
    }
    const rects = mods.map(([x, y]) => `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}"/>`).join("");
    return `<svg viewBox="0 0 ${size} ${size}" fill="#1b1d1f"><rect width="${size}" height="${size}" fill="#fff"/>${rects}</svg>`;
  }
  // 실제 라벨(다운로드 파일) 구성 — QR + 품목명 + 고유번호(개별형만) + 대분류 › 소분류
  function labelSheetHtml(a) {
    return `
      <div class="label-sheet">
        <div class="label-qr">${qrSampleSvg()}</div>
        <div class="label-text">
          <div class="label-product">${a.product}</div>
          ${a.assetNo ? `<div class="label-no">${a.assetNo}</div>` : ""}
          <div class="label-cat">${a.group} › ${a.sub}</div>
        </div>
      </div>`;
  }
  // 이미지만 보여주는 가벼운 라이트박스 — 타이틀/푸터 없이 우상단 x로만 닫음
  function openLabelPreview(a) {
    const back = document.createElement("div");
    back.className = "modal-back";
    back.style.zIndex = 350;
    back.innerHTML = `
      <div class="label-pop">
        <button class="label-pop-close" data-close aria-label="닫기">✕</button>
        ${labelSheetHtml(a)}
      </div>`;
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-close]").onclick = () => back.remove();
    document.body.appendChild(back);
  }
  // 기존 공용 컴포넌트(근무지 출퇴근용 QR)와 동일하게 dim 없는 앵커형 팝오버로
  function openQrPopover(a, anchor) {
    document.querySelectorAll(".qty-popover, .qr-popover").forEach(m => m.remove());
    const pop = document.createElement("div");
    pop.className = "qr-popover";
    pop.innerHTML = `
      <div class="qr-popover-body">
        <button class="qr-thumb" data-preview aria-label="라벨 미리보기">
          ${qrSampleSvg()}
          <span class="qr-thumb-hover">라벨 미리보기</span>
        </button>
        <div>
          <p style="font-size:13px;font-weight:600">${a.product}${a.assetNo ? ` / ${a.assetNo}` : ""}</p>
          <p class="muted" style="margin-top:4px">QR 라벨을 스캔하여 앱에서 자산의 배정 현황 및 이력을 조회할 수 있습니다.</p>
        </div>
      </div>
      <div class="qr-popover-acts">
        <button class="btn primary" data-dl>라벨 다운로드</button>
        <button class="btn" data-close>닫기</button>
      </div>`;
    const r = anchor.getBoundingClientRect();
    pop.style.cssText = `position:fixed;top:${r.bottom + 8}px;left:${Math.max(8, r.right - 320)}px`;
    document.body.appendChild(pop);
    pop.querySelector("[data-close]").onclick = () => pop.remove();
    pop.querySelector("[data-preview]").onclick = () => openLabelPreview(a);
    // 구조설계안 5.4 사진 다운로드와 동일한 식별 라벨 규칙(개별=고유관리번호, 수량=품목명) + QR 접두어
    pop.querySelector("[data-dl]").onclick = () => {
      const d = new Date(), p2 = n => String(n).padStart(2, "0");
      const ts = `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`;
      const label = a.type === "individual" ? (a.assetNo || a.id) : a.product;
      toast(`"QR_${label}_${ts}.png" 다운로드 (프로토타입 — 반영 없음)`);
      pop.remove();
    };
    setTimeout(() => {
      const close = e => { if (!pop.contains(e.target) && e.target !== anchor) { pop.remove(); document.removeEventListener("click", close); } };
      document.addEventListener("click", close);
    });
  }

  /* ---------- 활동 로그 ----------
   * 엔트리 스키마: { d(수정한 일시), script(스크립트), target?(수정 대상 — 구성원/근무지 객체, 없으면 자산 자체),
   *                 before?/after?(기존값/변경값 — 두 키가 아예 없으면 값 블록 자체를 생략, "" 이면 "없음"으로 표시), who(수정한 사람) }
   * 유형별 스크립트 정의는 구조설계안 5.5 참조. "그룹: 세부" 형식으로 그룹핑(예: "상태 변경: 분실 신고")
   * — 아직 트리거할 UI가 없는 유형(사진)만 그 기능을 만들 때 추가. */
  // 초기 스냅샷(합성 데이터) — 세션 시작 시 자산의 현재 상태로부터 한 번만 만들어지는 베이스라인
  function activityOf(a) {
    const ev = [{ d: `${a.createdAt || a.purchaseDate || "2024-01-01"} 09:00`, script: "자산 등록", who: "dana" }];
    (a.assignments || []).forEach(x => ev.push({
      d: `${x.since} 09:00`, script: "배정 관리: 신규 배정", target: x, before: "", after: window.fmtDate(x.since), who: "dana",
    }));
    (a.stocks || []).forEach(x => ev.push({
      d: `${a.purchaseDate || "2025-01-01"} 09:00`, script: "보유 관리: 보유 대상 추가", target: x, before: "", after: `${x.qty}개`, who: "dana",
    }));
    if (a.status === "repair") ev.push({ d: "2026-08-14 09:00", script: "상태 변경: 수리 접수", before: "배정 중", after: "수리 중", who: "dana" });
    if (a.status === "lost") ev.push({ d: "2026-07-21 09:00", script: "상태 변경: 분실 신고", before: "배정 중", after: "분실", who: "정우성" });
    if (a.status === "disposed") ev.push({ d: "2025-12-30 09:00", script: "상태 변경: 폐기 처리", before: "배정 중", after: "폐기", who: "dana" });
    if (a.note) ev.push({ d: "2026-06-02 09:00", script: "자산 정보 수정: 메모 수정", before: "", after: a.note, who: "dana" });
    return ev.sort((x, y) => (x.d < y.d ? 1 : -1));
  }
  // 실제 이력 로그 — activityOf()의 베이스라인을 세션당 한 번만 시드하고, 이후 실사용자 조작(수량 변경·보유 해제 등)은
  // 여기 append해서 남김. 그래야 대상이 삭제되거나 값이 바뀌어도 "무슨 일이 있었는지"가 이력에서 사라지지 않음.
  function activityLog(a) {
    if (!a._activityLog) a._activityLog = activityOf(a);
    return a._activityLog;
  }
  function todayStr() {
    const p = n => String(n).padStart(2, "0");
    return `${TODAY.getFullYear()}-${p(TODAY.getMonth() + 1)}-${p(TODAY.getDate())}`;
  }
  // 실제 조작 시각 — 자산 등록일 등에 쓰는 고정 데모 날짜(TODAY)는 그대로 두고, 시:분만 실제 클릭 시각을 사용
  function nowStr() {
    const p = n => String(n).padStart(2, "0");
    const real = new Date();
    return `${todayStr()} ${p(real.getHours())}:${p(real.getMinutes())}`;
  }
  function logActivity(a, entry) {
    activityLog(a).unshift({ d: nowStr(), who: "dana", ...entry });
  }
  // 이력 카드 1건 렌더링 — 대상 이름은 기존/변경 값에 포함(카드 상단에 별도 아바타 행 없음), before/after 키가 아예 없으면 값 블록 생략
  function historyCardHtml(e) {
    const val = v => v || "없음";
    const targetName = e.target ? (e.target.employee || e.target.worksite) : null;
    // 구성원은 프로필 이미지(대시보드 공통 규칙), 근무지는 인라인 아이콘(assets.js 목록과 동일 패턴)
    const targetMark = e.target
      ? (e.target.employee
          ? `<span class="hval-avatar" style="background:${avatarColor(e.target.employee)}">${e.target.employee[0]}</span>`
          : IC_WS)
      : "";
    // 값이 "없음"인 쪽엔 대상 이름을 안 붙임 — 신규 배정의 "기존"처럼 그 시점엔 아직 이 대상과 실제
    // 관계(레코드)가 없었던 경우까지 이름을 붙이면 "이미 있었는데 비어있었다"로 오독됨. 값이 있는 쪽에만
    // "이름 · 값"으로 표기(반납의 "변경"·보유 대상 추가의 "기존" 등 반대 방향도 동일 규칙)
    const withTarget = v => (targetName && v) ? `${targetMark}${targetName} · ${val(v)}` : val(v);
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
  // query가 있으면 수정 대상(구성원/근무지) 이름으로 필터 — 수량형 이력 탭 전용(개별형은 검색 없음)
  function timelineHtml(a, query) {
    const q = (query || "").trim().toLowerCase();
    const entries = activityLog(a).filter(e => {
      if (!q) return true;
      const name = e.target ? (e.target.employee || e.target.worksite || "") : "";
      return name.toLowerCase().includes(q);
    });
    if (!entries.length) return '<p class="muted" style="padding:6px 0">일치하는 이력이 없습니다</p>';
    return `<div class="dtimeline">${entries.map(historyCardHtml).join("")}</div>`;
  }
  // 보유 현황 — 배정 현황과 동일한 카드 UI(assignIdentity 재사용) + 검색(구성원/근무지 카테고리 선택)
  // 보유 대상 수는 상한이 없어(구조설계안 2.1) 목록이 길어질 수 있음 — 20개 단위 페이지네이션(QR 다운로드
  // 모달과 동일한 고정 20 방식). 검색/카테고리 전환 시 1페이지로 리셋(render() 안에서 처리)
  const STOCK_PAGE_SIZE = 20;
  let stockPage = 1;
  // 수량형 상태 파생 — 레코드 존재 여부가 아니라 배분합계(모든 보유자 quantity의 합) 기준(구조설계안 3.4).
  // 배분합계가 0이면 quantity 0인 레코드가 남아있어도 재고(그 경우 total_qty 전체가 잔여 수량)
  function deriveQtyStatus(a) {
    const sum = (a.stocks || []).reduce((s, x) => s + x.qty, 0);
    a.status = sum > 0 ? "held" : "stock";
  }
  // 정렬: 이름 가나다순(배정일처럼 시간 기준으로 정렬할 값이 없어서 — 최근 변경은 이력 탭 검색으로 확인)
  function stockCards(a, query, cat) {
    const stocks = a.stocks || [];
    const q = (query || "").trim().toLowerCase();
    const rows = stocks
      .map((x, idx) => ({ x, idx }))
      .filter(({ x }) => {
        if (!q) return true;
        if (cat === "worksite") {
          if (!x.worksite) return false;
          const code = (WS_CODE[x.worksite] || "").toLowerCase();
          return x.worksite.toLowerCase().includes(q) || code.includes(q);
        }
        if (!x.employee) return false;
        if (x.employee.toLowerCase().includes(q)) return true;
        // 사번·휴대폰번호는 카드엔 안 보이지만(레코드에 표시할 필요 없음) 검색만 가능하게 MEMBERS에서 조회
        const info = MEMBERS.find(m => m.name === x.employee);
        return !!info && ((info.empNo || "").toLowerCase().includes(q) || (info.phone || "").includes(q));
      })
      // 보유 수량 오름차순(적은/소진된 대상이 위로) — 개별형이 배정일(눈에 보이는 값)로 정렬하는 것과
      // 같은 원칙으로 이름 대신 수량으로 변경. 이름순이면 소진(0개)된 대상을 찾기 어렵다는 피드백 반영
      .sort((p, q2) => p.x.qty - q2.x.qty);
    // 검색 중 결과 없음과 완전 미보유(레코드 자체가 0건)는 다른 상황이라 문구도 구분
    if (!rows.length) return q
      ? '<p class="muted" style="padding:6px 0">일치하는 보유 대상이 없습니다</p>'
      : '<p class="muted" style="padding:6px 0">보유 대상이 없습니다.</p>';
    const totalPages = Math.max(1, Math.ceil(rows.length / STOCK_PAGE_SIZE));
    if (stockPage > totalPages) stockPage = totalPages;
    const pageRows = rows.slice((stockPage - 1) * STOCK_PAGE_SIZE, stockPage * STOCK_PAGE_SIZE);
    const pagerHtml = totalPages > 1 ? `
      <div class="pager">
        <button data-spage="prev" ${stockPage === 1 ? "disabled" : ""}>‹</button>
        <span style="padding:0 6px;font-size:12.5px;color:var(--text-sub)">${stockPage} / ${totalPages}</span>
        <button data-spage="next" ${stockPage === totalPages ? "disabled" : ""}>›</button>
      </div>` : "";
    return `<div class="acard-list">${pageRows.map(({ x, idx }) => `
      <div class="acard" data-idx="${idx}">
        ${typeBadge(x)}
        <div class="acard-id">${assignIdentity(x)}</div>
        <div class="acard-foot">
          <span class="acard-date">보유 수량 <b class="qty">${x.qty}개</b></span>
          <div class="acard-actions">
            <button class="btn sm" data-qtyedit>수량 변경</button>
            <button class="btn sm" data-release>보유 해제</button>
          </div>
        </div>
      </div>`).join("")}</div>${pagerHtml}`;
  }
  // 수량 변경 팝오버 — 스테퍼(0 미만 불가, total_qty 잔여 수량 초과 불가) + 직접입력(포커스 시 기존값 지우고
  // 새로 입력, 미입력 시 저장 비활성). 0은 구조설계안 2.1 "quantity 0 포함해서 직접 증감" 명시대로 허용
  function openQtyPopover(anchor, a, idx) {
    document.querySelectorAll(".qty-popover").forEach(m => m.remove());
    const cur = a.stocks[idx].qty;
    // 이 보유자를 제외한 나머지 보유자들의 합 — 이 값 + 새 입력값이 total_qty를 못 넘음(잔여 수량 상한)
    const otherSum = a.stocks.reduce((s, x, i) => i === idx ? s : s + x.qty, 0);
    const max = a.totalQty - otherSum;
    const pop = document.createElement("div");
    pop.className = "qty-popover";
    pop.innerHTML = `
      <div class="qty-stepper">
        <button type="button" class="qty-step" data-qminus aria-label="수량 감소">－</button>
        <input type="text" inputmode="numeric" data-qinput placeholder="입력" value="${cur}">
        <button type="button" class="qty-step" data-qplus aria-label="수량 증가">＋</button>
      </div>
      <div class="qty-pop-acts">
        <button class="btn sm" data-qcancel>취소</button>
        <button class="btn sm primary" data-qsave>저장</button>
      </div>`;
    const r = anchor.getBoundingClientRect();
    pop.style.cssText = `position:fixed;top:${r.bottom + 6}px;left:${Math.max(8, r.right - 200)}px`;
    document.body.appendChild(pop);

    const input = pop.querySelector("[data-qinput]");
    const minus = pop.querySelector("[data-qminus]");
    const plus = pop.querySelector("[data-qplus]");
    const save = pop.querySelector("[data-qsave]");
    const val = () => { const n = parseInt(input.value, 10); return Number.isFinite(n) ? n : null; };
    const sync = () => {
      const v = val();
      minus.disabled = v === null || v <= 0;
      plus.disabled = v === null || v >= max;
      save.disabled = v === null || v < 0 || v > max;
    };
    input.addEventListener("input", () => {
      input.value = input.value.replace(/[^0-9]/g, "");
      sync();
    });
    minus.onclick = () => { const v = val(); if (v !== null && v > 0) { input.value = v - 1; sync(); } };
    plus.onclick = () => { const v = val() ?? 0; if (v < max) { input.value = v + 1; sync(); } };
    save.onclick = () => {
      const v = val();
      if (v === null || v < 0 || v > max) return;
      const x = a.stocks[idx];
      pop.remove();
      confirmModal("수량을 변경하시겠습니까?", () => {
        a.stocks[idx].qty = v;
        deriveQtyStatus(a);
        logActivity(a, { script: "보유 관리: 보유 수량 변경", target: x, before: `${cur}개`, after: `${v}개` });
        toast("수량이 변경되었습니다.");
        render();
      });
    };
    pop.querySelector("[data-qcancel]").onclick = () => pop.remove();
    sync();
    input.focus(); input.select();
    setTimeout(() => {
      const close = e => { if (!pop.contains(e.target) && e.target !== anchor) { pop.remove(); document.removeEventListener("click", close); } };
      document.addEventListener("click", close);
    });
  }
  function wireStockCards(scope, a) {
    scope.querySelectorAll("[data-release]").forEach(b => b.onclick = () => {
      const row = b.closest(".acard");
      const idx = +row.dataset.idx;
      const x = a.stocks[idx];
      confirmModal(`보유 대상에서 해제하시겠습니까?<br><span class="muted" style="font-size:12px">해제 시 이 자산의 보유 현황 목록에 나타나지 않습니다.</span>`, () => {
        const qty = x.qty;
        a.stocks.splice(idx, 1);
        deriveQtyStatus(a);
        logActivity(a, { script: "보유 관리: 보유 대상 해제", target: x, before: `${qty}개`, after: "" });
        toast("보유 대상에서 해제되었습니다.");
        render();
      });
    });
    scope.querySelectorAll("[data-qtyedit]").forEach(b => b.onclick = () => {
      const row = b.closest(".acard");
      openQtyPopover(b, a, +row.dataset.idx);
    });
  }
  // 정렬: 배정일 내림차순(최신 배정이 위로)
  function assignCurrentHtml(a) {
    const asg = a.assignments || [];
    if (!asg.length) return '<p class="muted" style="padding:6px 0">배정 대상이 없습니다.</p>';
    const rows = asg.map((x, idx) => ({ x, idx }))
      .sort((p, q) => p.x.since === q.x.since ? 0 : (p.x.since < q.x.since ? 1 : -1));
    return `<div class="acard-list">${rows.map(({ x, idx }) => `
      <div class="acard" data-idx="${idx}">
        ${typeBadge(x)}
        <div class="acard-id">${assignIdentity(x)}</div>
        <div class="acard-foot">
          <span class="acard-date">배정일 <b>${window.fmtDate(x.since)}</b><button class="icon-edit" data-dateedit aria-label="배정일 수정" title="배정일 수정">${IC_EDIT}</button></span>
          <div class="acard-actions">
            <button class="btn sm" data-act="재배정">재배정</button>
            <button class="btn sm" data-act="반납">반납</button>
          </div>
        </div>
      </div>`).join("")}</div>`;
  }
  // 공통 날짜 입력 컴포넌트 — YYYY.MM.DD 텍스트 마스킹(8자리 숫자만) + 달력 아이콘(네이티브 피커, 미래 날짜 선택 제한).
  // 5번째·7번째 숫자 입력 시 자동 마침표. 범위를 벗어나면(자릿수·연도·월·일·미래 날짜) 에러 문구 없이 저장 버튼만 비활성.
  const IC_CAL = `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`;
  function dateFieldHtml(initialIso) {
    const disp = initialIso ? initialIso.replace(/-/g, ".") : "";
    return `
      <div class="dfield">
        <input type="text" inputmode="numeric" data-dtext placeholder="YYYY.MM.DD" maxlength="10" value="${disp}">
        <span class="dfield-pick">${IC_CAL}<input type="date" data-dnative tabindex="-1"></span>
      </div>`;
  }
  // scope 안의 .dfield를 마스킹·검증 로직과 연결하고, 유효한 값을 읽어오는 getter를 반환
  function wireDateField(scope, maxIso, onChange) {
    const text = scope.querySelector("[data-dtext]");
    const native = scope.querySelector("[data-dnative]");
    native.max = maxIso;
    const digitsOf = v => v.replace(/\D/g, "").slice(0, 8);
    const format = d => d.length > 6 ? `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6)}`
                       : d.length > 4 ? `${d.slice(0, 4)}.${d.slice(4)}` : d;
    const getValue = () => {
      const d = digitsOf(text.value);
      if (d.length !== 8) return null;                          // 8자리 미만
      const y = d.slice(0, 4), m = d.slice(4, 6), dd = d.slice(6, 8);
      const curYear = TODAY.getFullYear();
      if (+y < curYear - 100 || +y > curYear) return null;       // 연도 범위
      if (+m < 1 || +m > 12) return null;                        // 월 범위
      if (+dd < 1 || +dd > 31) return null;                      // 일 범위
      const iso = `${y}-${m}-${dd}`;
      return iso > maxIso ? null : iso;                          // 미래 날짜
    };
    text.addEventListener("input", () => { text.value = format(digitsOf(text.value)); onChange(); });
    native.addEventListener("change", () => {
      if (native.value) text.value = native.value.replace(/-/g, ".");
      onChange();
    });
    return getValue;
  }
  // 배정일 수정 팝오버 — 대상(구성원/근무지)은 여기서 못 바꿈(재배정으로만), 날짜만 수정
  function openDatePopover(anchor, a, idx) {
    document.querySelectorAll(".qty-popover").forEach(m => m.remove());
    const cur = a.assignments[idx].since;
    const max = todayStr();
    const pop = document.createElement("div");
    pop.className = "qty-popover";
    pop.innerHTML = `
      ${dateFieldHtml(cur)}
      <div class="qty-pop-acts">
        <button class="btn sm" data-dcancel>취소</button>
        <button class="btn sm primary" data-dsave>저장</button>
      </div>`;
    const r = anchor.getBoundingClientRect();
    pop.style.cssText = `position:fixed;top:${r.bottom + 6}px;left:${Math.max(8, r.right - 220)}px`;
    document.body.appendChild(pop);

    const save = pop.querySelector("[data-dsave]");
    const getValue = wireDateField(pop, max, () => { save.disabled = !getValue(); });
    save.onclick = () => {
      const v = getValue();
      if (!v) return;
      const x = a.assignments[idx];
      pop.remove();
      confirmModal("배정일을 수정하시겠습니까?", () => {
        x.since = v;
        logActivity(a, { script: "배정 관리: 배정일 변경", target: x, before: window.fmtDate(cur), after: window.fmtDate(v) });
        toast("배정일이 수정되었습니다.");
        render();
      });
    };
    pop.querySelector("[data-dcancel]").onclick = () => pop.remove();
    save.disabled = !getValue();
    pop.querySelector("[data-dtext]").focus();
    setTimeout(() => {
      const close = e => { if (!pop.contains(e.target) && e.target !== anchor) { pop.remove(); document.removeEventListener("click", close); } };
      document.addEventListener("click", close);
    });
  }
  function wireAssignCards(scope, a) {
    scope.querySelectorAll("[data-dateedit]").forEach(b => b.onclick = () => {
      const row = b.closest(".acard");
      openDatePopover(b, a, +row.dataset.idx);
    });
    // bindActs(scope)가 위에서 이미 이 버튼도 스텁 토스트로 바인딩했으므로, 실제 핸들러로 덮어씀
    scope.querySelectorAll('[data-act="재배정"]').forEach(b => b.onclick = () => {
      const row = b.closest(".acard");
      openReassignModal(a, +row.dataset.idx);
    });
    scope.querySelectorAll('[data-act="반납"]').forEach(b => b.onclick = () => {
      const row = b.closest(".acard");
      returnAssignment(a, +row.dataset.idx);
    });
  }

  // 반납 — 입력할 값이 없는 액션(구조설계안엔 "배정일 수정"만 있고 "반납일 수정"은 없음, returned_at은
  // 실제 조작 시점으로 자동 기록). 확인 모달만으로 처리
  function returnAssignment(a, idx) {
    const old = a.assignments[idx];
    confirmModal("반납 처리하시겠습니까?", () => {
      a.assignments.splice(idx, 1);
      // 재고⟷배정중만 배정/반납으로 자동 파생 — 남은 활성 레코드가 없을 때만 재고로 전환(공동배정 중 일부만
      // 반납이면 나머지 활성 레코드가 있으므로 유지)
      if (a.assignments.length === 0 && a.status === "assigned") a.status = "stock";
      logActivity(a, { script: "배정 관리: 반납", target: old, before: window.fmtDate(old.since), after: "" });
      toast("반납되었습니다.");
      render();
    });
  }

  // 배정 추가 — 대상(구성원/근무지 중 1개, 구조설계안 2.1 "정확히 1개 필수") + 배정일.
  // 대상 선택 UI는 분류 관리의 권한 대상 선택(category.js openPermPicker)과 동일한 패턴: 라디오 선택 시
  // "선택 ›" 버튼이 뜨고 눌러야 하위 피커가 열림, 라디오를 구성원↔근무지로 왔다갔다 해도 각자 골라둔 값은
  // draftTarget에 독립적으로 남아있어서 재선택이 필요 없음(모달 열려있는 동안 한정, 적용/취소로 닫으면 사라짐)
  function openAssignAddModal(a) {
    let picked = null; // "employee" | "worksite"
    const draftTarget = { employee: null, worksite: null };
    let dateText = ""; // draw()가 매번 body를 다시 그려도 이미 입력한 배정일 텍스트가 안 날아가게 별도 보존

    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal" style="width:400px">
        <h3>배정 추가</h3>
        <div class="body" data-body></div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" data-save disabled>저장</button>
        </div>
      </div>`;
    document.body.appendChild(back);
    const body = back.querySelector("[data-body]");
    const saveBtn = back.querySelector("[data-save]");

    // 선택 전엔 "선택 ›" 버튼, 선택 후엔 아바타+이름+해제(X)가 전부 한 박스 안에 같이 들어감(X만 따로 떨어진
    // 박스였던 걸 병합) — 박스 자체(X 제외)를 클릭하면 재선택 팝업이 다시 열림
    function targetSummaryHtml(k) {
      const val = draftTarget[k];
      if (!val) return `<button type="button" class="perm-target-btn" data-target-open><span class="muted">선택</span><span class="chev">›</span></button>`;
      const avatar = k === "employee" ? `<span class="picker-avatar sm" style="background:${avatarColor(val)}">${val[0]}</span>` : "";
      return `
        <div class="aa-target-selected" data-target-open>
          ${avatar}<span class="perm-chip">${val}</span>
          <button type="button" class="aa-target-x" data-target-clear aria-label="선택 해제">${CLOSE_ICON}</button>
        </div>`;
    }

    let getDate = () => null;
    function draw() {
      body.innerHTML = `
        <div class="field">
          <label>배정 대상</label>
          <label class="radio-row"><input type="radio" name="aa-kind" value="employee"${picked === "employee" ? " checked" : ""}><span>구성원</span></label>
          ${picked === "employee" ? `<div class="perm-target-wrap">${targetSummaryHtml("employee")}</div>` : ""}
          <label class="radio-row"><input type="radio" name="aa-kind" value="worksite"${picked === "worksite" ? " checked" : ""}><span>근무지</span></label>
          ${picked === "worksite" ? `<div class="perm-target-wrap">${targetSummaryHtml("worksite")}</div>` : ""}
        </div>
        <div class="field">
          <label>배정일</label>
          ${dateFieldHtml("")}
        </div>`;
      const dtext = body.querySelector("[data-dtext]");
      if (dateText) dtext.value = dateText;

      body.querySelectorAll('input[name="aa-kind"]').forEach(r => r.onchange = () => { picked = r.value; draw(); });
      const openBtn = body.querySelector("[data-target-open]");
      if (openBtn) openBtn.onclick = () => {
        if (picked === "employee") openAssignMemberPicker(draftTarget.employee, v => { draftTarget.employee = v; draw(); });
        else openAssignWorksitePicker(draftTarget.worksite, v => { draftTarget.worksite = v; draw(); });
      };
      const clearBtn = body.querySelector("[data-target-clear]");
      if (clearBtn) clearBtn.onclick = e => { e.stopPropagation(); draftTarget[picked] = null; draw(); };

      getDate = wireDateField(body, todayStr(), () => { dateText = dtext.value; updateSaveState(); });
      updateSaveState();
    }
    function updateSaveState() {
      saveBtn.disabled = !(picked && draftTarget[picked] && getDate());
    }
    draw();

    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-close]").onclick = () => back.remove();
    saveBtn.onclick = () => {
      if (saveBtn.disabled) return;
      const d = getDate();
      const record = picked === "employee"
        ? { employee: draftTarget.employee, worksite: null, since: d }
        : { employee: null, worksite: draftTarget.worksite, since: d };
      // 배정 추가 모달은 그대로 띄워둔 채(뒤에 겹쳐 보이게) 확인 모달만 위에 띄움 — 확인 취소 시 다시 편집 가능해야 하므로
      confirmModal("배정을 추가하시겠습니까?", () => {
        back.remove();
        (a.assignments || (a.assignments = [])).push(record);
        // 재고⟷배정중만 배정/반납으로 자동 파생(수리중·분실·폐기는 배정 여부와 무관하게 별도 관리 — 상태 변경 드롭다운 참조)
        if (a.status === "stock") a.status = "assigned";
        logActivity(a, { script: "배정 관리: 신규 배정", target: record, before: "", after: window.fmtDate(d) });
        toast("추가되었습니다.");
        render();
      });
    };
  }

  // 재배정 — 구조설계안 2.3 "반납·신규배정과 구분되는 독립 액션. 기존 활성 레코드의 배정 대상을 새 대상으로
  // 교체(레코드가 종료되지 않고 유지됨, 반납 상태를 거치지 않음)". 배정 추가와 거의 같은 UI(대상 라디오+피커
  // +날짜)를 세로로 이어붙이되: (1) 위에 현재 배정을 읽기전용 카드로 보여주고, (2) 새 대상 후보에서 현재
  // 대상은 제외(같은 대상으로 날짜만 바꾸고 싶으면 배정일 수정을 쓰면 되므로 역할이 안 겹치게), (3) 무슨
  // 일이 일어나는지 모달 상단에 상시 안내(확인 팝업까지 가기 전에 알 수 있어야 함)
  function openReassignModal(a, idx) {
    const old = a.assignments[idx];
    let picked = null; // "employee" | "worksite"
    const draftTarget = { employee: null, worksite: null };
    let dateText = "";

    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal" style="width:400px">
        <h3>재배정</h3>
        <div class="body" data-body></div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" data-save disabled>저장</button>
        </div>
      </div>`;
    document.body.appendChild(back);
    const body = back.querySelector("[data-body]");
    const saveBtn = back.querySelector("[data-save]");

    function targetSummaryHtml(k) {
      const val = draftTarget[k];
      if (!val) return `<button type="button" class="perm-target-btn" data-target-open><span class="muted">선택</span><span class="chev">›</span></button>`;
      const avatar = k === "employee" ? `<span class="picker-avatar sm" style="background:${avatarColor(val)}">${val[0]}</span>` : "";
      return `
        <div class="aa-target-selected" data-target-open>
          ${avatar}<span class="perm-chip">${val}</span>
          <button type="button" class="aa-target-x" data-target-clear aria-label="선택 해제">${CLOSE_ICON}</button>
        </div>`;
    }

    let getDate = () => null;
    function draw() {
      body.innerHTML = `
        <div class="ra-current">
          <div class="perm-info-note">${INFO_ICON}<span>기존 배정이 새 대상으로 교체됩니다.</span></div>
          <div class="acard">
            ${typeBadge(old)}
            <div class="acard-id">${assignIdentity(old)}</div>
            <div class="acard-foot"><span class="acard-date">배정일 <b>${window.fmtDate(old.since)}</b></span></div>
          </div>
        </div>
        <div class="field">
          <label>새 배정 대상</label>
          <label class="radio-row"><input type="radio" name="ra-kind" value="employee"${picked === "employee" ? " checked" : ""}><span>구성원</span></label>
          ${picked === "employee" ? `<div class="perm-target-wrap">${targetSummaryHtml("employee")}</div>` : ""}
          <label class="radio-row"><input type="radio" name="ra-kind" value="worksite"${picked === "worksite" ? " checked" : ""}><span>근무지</span></label>
          ${picked === "worksite" ? `<div class="perm-target-wrap">${targetSummaryHtml("worksite")}</div>` : ""}
        </div>
        <div class="field">
          <label>새 배정일</label>
          ${dateFieldHtml("")}
        </div>`;
      const dtext = body.querySelector("[data-dtext]");
      if (dateText) dtext.value = dateText;

      body.querySelectorAll('input[name="ra-kind"]').forEach(r => r.onchange = () => { picked = r.value; draw(); });
      const openBtn = body.querySelector("[data-target-open]");
      if (openBtn) openBtn.onclick = () => {
        if (picked === "employee") openAssignMemberPicker(draftTarget.employee, v => { draftTarget.employee = v; draw(); }, old.employee);
        else openAssignWorksitePicker(draftTarget.worksite, v => { draftTarget.worksite = v; draw(); }, old.worksite);
      };
      const clearBtn = body.querySelector("[data-target-clear]");
      if (clearBtn) clearBtn.onclick = e => { e.stopPropagation(); draftTarget[picked] = null; draw(); };

      getDate = wireDateField(body, todayStr(), () => { dateText = dtext.value; updateSaveState(); });
      updateSaveState();
    }
    function updateSaveState() {
      saveBtn.disabled = !(picked && draftTarget[picked] && getDate());
    }
    draw();

    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-close]").onclick = () => back.remove();
    saveBtn.onclick = () => {
      if (saveBtn.disabled) return;
      const d = getDate();
      const record = picked === "employee"
        ? { employee: draftTarget.employee, worksite: null, since: d }
        : { employee: null, worksite: draftTarget.worksite, since: d };
      confirmModal("재배정하시겠습니까?", () => {
        back.remove();
        // 반납+신규배정 조합이 아니라 기존 활성 레코드의 대상 자체를 그 자리에서 교체(레코드는 종료되지 않음,
        // 구조설계안 2.3 — 재배정은 반납·신규배정과 구분되는 독립 액션). target을 특정 한쪽으로 고정할 수
        // 없어(대상 자체가 바뀌는 게 요지) 상태 변경류 로그(수리 접수 등)와 동일하게 target 없이 before/after
        // 텍스트로 표현
        const beforeLabel = `${old.employee || old.worksite} · ${window.fmtDate(old.since)}`;
        const afterLabel = `${record.employee || record.worksite} · ${window.fmtDate(d)}`;
        a.assignments[idx] = record;
        logActivity(a, { script: "배정 관리: 재배정", before: beforeLabel, after: afterLabel });
        toast("재배정되었습니다.");
        render();
      });
    };
  }

  // 보유 대상 추가 — 배정 추가와 같은 대상 선택 UI(라디오+피커+상태보존)를 재사용하되, 날짜 대신 수량
  // 입력(최소 1, 잔여 수량 초과 불가 — 구조설계안 2.3). 이미 보유 중인 대상 전체(구성원·근무지 구분 없이)를
  // 후보에서 제외(수량만 바꾸고 싶으면 보유 변경을 쓰면 되므로 역할이 안 겹치게 — 배정 추가/재배정과 동일 원칙)
  function openHoldAddModal(a) {
    let picked = null; // "employee" | "worksite"
    const draftTarget = { employee: null, worksite: null };
    let qtyText = "";
    const heldNames = (a.stocks || []).map(x => x.employee || x.worksite);
    const remaining = a.totalQty - (a.stocks || []).reduce((s, x) => s + x.qty, 0);
    if (remaining <= 0) { toast("잔여 수량이 없습니다."); return; }

    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal" style="width:400px">
        <h3>보유 대상 추가</h3>
        <div class="body" data-body></div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" data-save disabled>저장</button>
        </div>
      </div>`;
    document.body.appendChild(back);
    const body = back.querySelector("[data-body]");
    const saveBtn = back.querySelector("[data-save]");

    function targetSummaryHtml(k) {
      const val = draftTarget[k];
      if (!val) return `<button type="button" class="perm-target-btn" data-target-open><span class="muted">선택</span><span class="chev">›</span></button>`;
      const avatar = k === "employee" ? `<span class="picker-avatar sm" style="background:${avatarColor(val)}">${val[0]}</span>` : "";
      return `
        <div class="aa-target-selected" data-target-open>
          ${avatar}<span class="perm-chip">${val}</span>
          <button type="button" class="aa-target-x" data-target-clear aria-label="선택 해제">${CLOSE_ICON}</button>
        </div>`;
    }

    function qtyVal() { const n = parseInt(qtyText, 10); return Number.isFinite(n) ? n : null; }
    function updateSaveState() {
      const v = qtyVal();
      saveBtn.disabled = !(picked && draftTarget[picked] && v !== null && v >= 1 && v <= remaining);
    }

    function draw() {
      body.innerHTML = `
        <div class="field">
          <label>보유 대상</label>
          <label class="radio-row"><input type="radio" name="ha-kind" value="employee"${picked === "employee" ? " checked" : ""}><span>구성원</span></label>
          ${picked === "employee" ? `<div class="perm-target-wrap">${targetSummaryHtml("employee")}</div>` : ""}
          <label class="radio-row"><input type="radio" name="ha-kind" value="worksite"${picked === "worksite" ? " checked" : ""}><span>근무지</span></label>
          ${picked === "worksite" ? `<div class="perm-target-wrap">${targetSummaryHtml("worksite")}</div>` : ""}
        </div>
        <div class="field">
          <label>보유 수량</label>
          <div class="qty-stepper">
            <button type="button" class="qty-step" data-qminus aria-label="수량 감소">－</button>
            <input type="text" inputmode="numeric" data-qinput placeholder="입력" value="">
            <button type="button" class="qty-step" data-qplus aria-label="수량 증가">＋</button>
          </div>
          <div class="acard-sub" style="margin-top:5px">잔여 수량 <b>${remaining}개</b></div>
        </div>`;
      const qinput = body.querySelector("[data-qinput]");
      if (qtyText) qinput.value = qtyText;

      body.querySelectorAll('input[name="ha-kind"]').forEach(r => r.onchange = () => { picked = r.value; draw(); });
      const openBtn = body.querySelector("[data-target-open]");
      if (openBtn) openBtn.onclick = () => {
        if (picked === "employee") openAssignMemberPicker(draftTarget.employee, v => { draftTarget.employee = v; draw(); }, heldNames);
        else openAssignWorksitePicker(draftTarget.worksite, v => { draftTarget.worksite = v; draw(); }, heldNames);
      };
      const clearBtn = body.querySelector("[data-target-clear]");
      if (clearBtn) clearBtn.onclick = e => { e.stopPropagation(); draftTarget[picked] = null; draw(); };

      const minus = body.querySelector("[data-qminus]");
      const plus = body.querySelector("[data-qplus]");
      const val = () => { const n = parseInt(qinput.value, 10); return Number.isFinite(n) ? n : null; };
      const syncQty = () => {
        const v = val();
        minus.disabled = v === null || v <= 1;
        // 비어있을 땐(v===null) +를 눌러 1부터 시작할 수 있어야 하므로 비활성화하지 않음 — remaining은
        // 이 모달이 열릴 때 이미 1 이상임을 보장(0이면 모달 자체를 안 엶)
        plus.disabled = v !== null && v >= remaining;
        updateSaveState();
      };
      qinput.addEventListener("input", () => { qinput.value = qinput.value.replace(/[^0-9]/g, ""); qtyText = qinput.value; syncQty(); });
      minus.onclick = () => { const v = val(); if (v !== null && v > 1) { qinput.value = v - 1; qtyText = qinput.value; syncQty(); } };
      plus.onclick = () => { const v = val() ?? 0; if (v < remaining) { qinput.value = v + 1; qtyText = qinput.value; syncQty(); } };
      syncQty();
    }
    draw();

    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-close]").onclick = () => back.remove();
    saveBtn.onclick = () => {
      if (saveBtn.disabled) return;
      const v = qtyVal();
      const record = picked === "employee"
        ? { employee: draftTarget.employee, worksite: null, qty: v }
        : { employee: null, worksite: draftTarget.worksite, qty: v };
      confirmModal("보유 대상을 추가하시겠습니까?", () => {
        back.remove();
        (a.stocks || (a.stocks = [])).push(record);
        deriveQtyStatus(a);
        logActivity(a, { script: "보유 관리: 보유 대상 추가", target: record, before: "", after: `${v}개` });
        toast("추가되었습니다.");
        render();
      });
    };
  }

  // 구성원 선택 — 단일 선택(라디오), 검색(이름/사번/휴대폰번호)+목록. category.js의 openMemberPicker(다중선택)와
  // 달리 배정 대상은 정확히 1명이라 더 가벼운 단일 리스트로 구성. 2차 모달이라 .modal.sm(뒤 모달 가장자리가
  // 보이게 해서 겹쳐 떠 있음을 인지시킴). 검색창은 고정, 목록만 스크롤(footer가 항상 보이게)
  function openAssignMemberPicker(initial, onApply, exclude) {
    let picked = initial;
    let query = "";
    const excludeNames = [].concat(exclude || []).filter(Boolean);
    const p = document.createElement("div");
    p.className = "modal-back";
    p.style.zIndex = 340;
    p.innerHTML = `
      <div class="modal sm">
        <h3>구성원 선택</h3>
        <div class="body" style="display:flex;flex-direction:column;max-height:56vh">
          <input type="text" class="picker-search" placeholder="이름/사번/휴대폰번호">
          <div data-list style="flex:1;min-height:0;overflow-y:auto;margin-top:8px"></div>
        </div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" data-ok>적용</button>
        </div>
      </div>`;
    document.body.appendChild(p);
    const list = p.querySelector("[data-list]");
    function renderList() {
      const q = query.trim().toLowerCase();
      const filtered = MEMBERS.filter(m => !excludeNames.includes(m.name) && (!q || m.name.includes(q) || m.empNo.includes(q) || m.phone.includes(q)));
      list.innerHTML = filtered.length ? filtered.map(m => `
        <label class="picker-member-row">
          <input type="radio" name="aa-member" value="${m.name}"${picked === m.name ? " checked" : ""}>
          <span class="picker-avatar" style="background:${avatarColor(m.name)}">${m.name[0]}</span>
          <span class="picker-member-info"><b>${m.name}</b><span>${m.team}</span></span>
        </label>`).join("") : `<p class="muted" style="padding:16px 0">결과가 없습니다.</p>`;
      list.querySelectorAll('input[name="aa-member"]').forEach(r => r.onchange = () => { picked = r.value; });
    }
    p.querySelector(".picker-search").addEventListener("input", e => { query = e.target.value; renderList(); });
    renderList();
    p.addEventListener("click", e => { if (e.target === p) p.remove(); });
    p.querySelector("[data-close]").onclick = () => p.remove();
    p.querySelector("[data-ok]").onclick = () => { p.remove(); onApply(picked); };
  }

  // 근무지 선택 — 검색(근무지명/코드)+목록(대표 사진 없이 이름·코드만 — 구성원과 달리 프로필 사진이 의미가
  // 약해서 뺌). 지금은 3곳뿐이라 검색 체감은 적지만 구성원 선택과 구조를 통일해둠
  function openAssignWorksitePicker(initial, onApply, exclude) {
    let picked = initial;
    let query = "";
    const excludeNames = [].concat(exclude || []).filter(Boolean);
    const p = document.createElement("div");
    p.className = "modal-back";
    p.style.zIndex = 340;
    p.innerHTML = `
      <div class="modal sm">
        <h3>근무지 선택</h3>
        <div class="body" style="display:flex;flex-direction:column;max-height:56vh">
          <input type="text" class="picker-search" placeholder="근무지명/코드">
          <div data-list style="flex:1;min-height:0;overflow-y:auto;margin-top:8px"></div>
        </div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" data-ok>적용</button>
        </div>
      </div>`;
    document.body.appendChild(p);
    const list = p.querySelector("[data-list]");
    function renderList() {
      const q = query.trim().toLowerCase();
      const filtered = Object.keys(WS_CODE).filter(name => !excludeNames.includes(name) && (!q || name.toLowerCase().includes(q) || WS_CODE[name].toLowerCase().includes(q)));
      list.innerHTML = filtered.length ? filtered.map(name => `
        <label class="picker-member-row">
          <input type="radio" name="aa-worksite" value="${name}"${picked === name ? " checked" : ""}>
          <span class="picker-member-info"><b>${name}</b><span>${WS_CODE[name]}</span></span>
        </label>`).join("") : `<p class="muted" style="padding:16px 0">결과가 없습니다.</p>`;
      list.querySelectorAll('input[name="aa-worksite"]').forEach(r => r.onchange = () => { picked = r.value; });
    }
    p.querySelector(".picker-search").addEventListener("input", e => { query = e.target.value; renderList(); });
    renderList();
    p.addEventListener("click", e => { if (e.target === p) p.remove(); });
    p.querySelector("[data-close]").onclick = () => p.remove();
    p.querySelector("[data-ok]").onclick = () => { p.remove(); onApply(picked); };
  }

  /* ---------- 공통 사진 뷰어 ---------- */
  function openViewer(a, start) {
    const items = photosOf(a);
    if (!items.length) return;
    let cur = start || 0;
    let zoom = 1;
    let infoOn = false;
    let idleTimer;

    const back = document.createElement("div");
    back.className = "modal-back viewer-back";
    back.innerHTML = `
      <div class="viewer bar-hidden">
        <div class="v-bar">
          <div class="v-bar-l">
            <span class="v-count"></span>
            <button data-vprev class="v-ib" data-tip="이전" aria-label="이전">‹</button>
            <button data-vnext class="v-ib" data-tip="다음" aria-label="다음">›</button>
          </div>
          <div class="v-bar-c">
            <button data-vfs class="v-ib" data-tip="전체 스크린">⛶</button>
            <button data-vzin class="v-ib" data-tip="확대">＋</button>
            <button data-vzout class="v-ib" data-tip="축소">－</button>
            <button data-vinfo class="v-ib" data-tip="정보">ⓘ</button>
          </div>
          <div class="v-bar-r">
            <button data-vmore class="v-ib" aria-label="더보기">⋮</button>
            <button data-vclose class="v-ib" aria-label="닫기">✕</button>
          </div>
        </div>
        <div class="v-info" hidden>
          <span class="v-info-badge">자산</span>
          <div class="v-info-t">${a.product}${a.assetNo ? ` / ${a.assetNo}` : ""}</div>
          <div class="v-info-date"></div>
          <div class="v-info-by"><span class="avatar-sm"></span><span class="v-info-name"></span></div>
        </div>
        <div class="v-stage">
          <div class="v-img-wrap"><div class="v-img"></div></div>
        </div>
      </div>`;
    const V = back.querySelector(".viewer");

    function draw() {
      const p = items[cur];
      const img = V.querySelector(".v-img");
      img.style.background = p.color;
      img.style.transform = `scale(${zoom})`;
      V.querySelector(".v-count").textContent = `${cur + 1} / ${items.length}`;
      V.querySelector(".v-info-date").textContent = window.fmtDateTime(p.at);
      V.querySelector(".v-info-name").textContent = p.by;
      V.querySelector(".avatar-sm").textContent = p.by[0].toUpperCase();
      V.querySelector("[data-vprev]").disabled = cur === 0;
      V.querySelector("[data-vnext]").disabled = cur === items.length - 1;
    }
    const go = d => { cur = Math.max(0, Math.min(items.length - 1, cur + d)); zoom = 1; draw(); };

    function showBar() {
      V.classList.remove("bar-hidden");
      clearTimeout(idleTimer);
      if (!infoOn) idleTimer = setTimeout(() => V.classList.add("bar-hidden"), 2500);
    }
    V.addEventListener("mousemove", showBar);

    function toggleInfo() {
      infoOn = !infoOn;
      V.querySelector(".v-info").hidden = !infoOn;
      V.querySelector("[data-vinfo]").classList.toggle("on", infoOn);
      showBar();
    }
    function zoomBy(d) { zoom = Math.min(3, Math.max(1, +(zoom + d).toFixed(2))); draw(); }

    function moreMenu(anchor) {
      document.querySelectorAll(".dropdown-menu").forEach(m => m.remove());
      const list = [];
      if (cur !== a._primary) list.push({ t: "대표 사진으로 지정", fn: () => confirmModal("자산 대표 사진으로 지정하시겠습니까?", () => {
        a._primary = cur; toast("자산 대표 사진으로 지정되었습니다."); draw();
      }) });
      list.push({ t: "다운로드", fn: () => toast("다운로드 — 원본 파일명 그대로 (프로토타입)") });
      list.push({ t: "삭제", fn: () => confirmModal("자산 사진을 삭제하시겠습니까?", delCur), danger: true });
      list.push({ t: "전체 사진 다운로드", fn: () => toast(`${zipName(a)} 다운로드 (프로토타입)`), sep: true });
      const menu = document.createElement("div");
      menu.className = "dropdown-menu";
      menu.innerHTML = list.map((x, i) => (x.sep ? '<div class="dropdown-sep"></div>' : "") +
        `<button data-i="${i}" class="${x.danger ? "danger" : ""}">${x.t}</button>`).join("");
      const r = anchor.getBoundingClientRect();
      menu.style.cssText = `position:fixed;top:${r.bottom + 6}px;left:${Math.max(8, r.right - 190)}px;min-width:190px;z-index:320`;
      document.body.appendChild(menu);
      menu.querySelectorAll("button").forEach(b => b.onclick = () => { menu.remove(); list[+b.dataset.i].fn(); });
      setTimeout(() => {
        const close = e => { if (!menu.contains(e.target)) { menu.remove(); document.removeEventListener("click", close); } };
        document.addEventListener("click", close);
      });
    }
    function delCur() {
      const wasPrimary = cur === a._primary;
      items.splice(cur, 1);
      if (!items.length) { close(); toast("자산 사진이 삭제되었습니다."); DetailScreen.render(); return; }
      if (wasPrimary) a._primary = 0;
      else if (a._primary > cur) a._primary -= 1;
      if (cur >= items.length) cur = items.length - 1;
      zoom = 1; draw();
      toast("자산 사진이 삭제되었습니다.");
    }

    function close() {
      back.remove();
      document.removeEventListener("keydown", key);
      DetailScreen.render();   // 헤더 썸네일·개수 반영
    }
    const key = e => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "+" || e.key === "=") zoomBy(0.25);
      else if (e.key === "-") zoomBy(-0.25);
      else if (e.key.toLowerCase() === "i") toggleInfo();
    };

    back.addEventListener("click", e => { if (e.target === back) close(); });
    V.querySelectorAll("[data-vprev]").forEach(b => b.onclick = () => go(-1));
    V.querySelectorAll("[data-vnext]").forEach(b => b.onclick = () => go(1));
    V.querySelector("[data-vclose]").onclick = close;
    V.querySelector("[data-vinfo]").onclick = toggleInfo;
    V.querySelector("[data-vzin]").onclick = () => zoomBy(0.25);
    V.querySelector("[data-vzout]").onclick = () => zoomBy(-0.25);
    V.querySelector("[data-vfs]").onclick = () => V.classList.toggle("fs");
    V.querySelector("[data-vmore]").onclick = e => moreMenu(e.currentTarget);
    document.addEventListener("keydown", key);

    document.body.appendChild(back);
    draw();
    showBar();
  }

  function render() {
    const id = new URLSearchParams(location.search).get("id");
    const idx = Math.max(0, assets.findIndex(x => x.id === id));
    const a = assets[idx];
    const c = document.getElementById("content");
    const isIndiv = a.type === "individual";
    const prevA = assets[(idx - 1 + assets.length) % assets.length];
    const nextA = assets[(idx + 1) % assets.length];
    const prevId = prevA.id, nextId = nextA.id;
    const photos = photosOf(a);

    const primColor = photos.length ? photos[a._primary || 0].color : null;
    const thumb = photos.length
      ? `<button class="dthumb" style="background:${primColor}" data-viewer aria-label="사진 보기">
           ${photos.length > 1 ? `<span class="tcount">+${photos.length - 1}</span>` : ""}</button>`
      : `<span class="dthumb empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-4 4 3 4-4 5 4"/></svg></span>`;

    // 상태 변경으로 이동 가능한 전이만 노출. 재고⟷배정중은 배정/반납으로 자동 파생되므로 이 메뉴엔 없음. 폐기는 최종 상태라 뱃지가 클릭 불가.
    const STATUS_TRANSITIONS = {
      stock: ["수리 접수", "분실 신고", "폐기 처리"],
      assigned: ["수리 접수", "분실 신고", "폐기 처리"],
      repair: ["수리 완료", "분실 신고", "폐기 처리"],
      lost: ["분실 회수", "폐기 처리"],
      disposed: [],
    };
    // 수량형은 상태 변경 액션 자체가 없음(재고·보유중만, AssetStock 레코드 유무로 자동 파생) — 항상 읽기전용 뱃지
    const statusItems = isIndiv ? STATUS_TRANSITIONS[a.status] : [];
    const statusBadge = isIndiv && statusItems.length
      ? `<button class="badge ${STATUS_LABEL[a.status][1]} clickable" data-statuschange>${STATUS_LABEL[a.status][0]} <span class="bchev">▾</span></button>`
      : `<span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>`;
    const heldQty = !isIndiv ? (a.stocks || []).reduce((s, x) => s + x.qty, 0) : 0;
    const subMeta = `<div>${statusBadge}</div>${
      isIndiv && a.assetNo ? `<div style="margin-top:5px">고유관리번호 <b>${a.assetNo}</b></div>` : ""
    }${
      !isIndiv ? `<div style="margin-top:5px">전체 <b>${a.totalQty}개</b> · 보유 <b>${heldQty}개</b> · 잔여 <b>${a.totalQty - heldQty}개</b></div>` : ""
    }`;

    const QR_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM19 14h2v2h-2zM14 19h2v2h-2zM19 19h2v2h-2z"/></svg>`;
    const qrBtn = `<button class="btn sm icon-only" data-qr aria-label="QR 라벨" title="QR 라벨">${QR_ICON}</button>`;
    // 자산관리(자산 수정·자산 삭제)만 남음. 재배정은 배정 행으로, 상태 변경은 상태 뱃지로, 소분류 이동은
    // 자산 수정 폼 안의 소분류 필드로 흡수됨(별도 메뉴 항목이었으나 병합).
    const MORE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>`;
    const mgrBtn = `<button class="btn sm icon-only corner" data-more aria-label="자산관리" title="자산관리">${MORE_ICON}</button>`;
    // 폐기 동결(구조설계안 3.4: "폐기는 완전 동결 — 필드 수정 불가") — 자산 수정만 메뉴에서 빠짐, 삭제는 예외적으로 계속 허용
    const moreItems = a.status === "disposed" ? ["자산 삭제"] : ["자산 수정", "자산 삭제"];

    // 필수값(분류) 먼저, 선택값이 뒤따름. 유효기한·태그는 분류 바로 다음(전체 탭 테이블 컬럼 순서와 통일).
    // 제조연월일이 구매일보다 앞(제조가 구매보다 먼저 일어나는 시점).
    // 선택 필드(field 태그가 있는 행)는 소분류 필드 노출 설정(hiddenFields)에서 off면 행 자체를 숨김.
    // 구매일·구매가격을 붙여서 "취득 정보" 세트로 묶고, 그 뒤로 사용자 입력이 아니라 시스템이 자동 기록하는 필드(등록일·QR 라벨)를 배치.
    // 메모는 마지막(최대 500자, 길어질 수 있음) — 자유 입력값이지만 길이가 가변적이라 다른 고정형 필드들 뒤에 둠.
    const cat = (window.DATA.categories || []).find(x => x.group === a.group && x.sub === a.sub) || {};
    const hidden = cat.hiddenFields || [];
    const kv = [
      { k: "분류", v: `<div><span class="type-pill">${isIndiv ? "개별 자산" : "수량 자산"}</span></div><div style="margin-top:5px">${a.group} › ${a.sub}</div>` },
      { k: "유효기한", field: "expiry", v: expiryBadge(a.expiry) },
      { k: "태그", v: chips(a.labels) },
      isIndiv ? { k: "S/N", field: "serial", v: a.serial || '<span class="muted">—</span>' } : null,
      isIndiv ? { k: "IMEI", field: "imei", v: a.imei || '<span class="muted">—</span>' } : null,
      { k: "제조연월일", field: "manufactured", v: a.manufactured ? window.fmtDate(a.manufactured) : '<span class="muted">—</span>' },
      { k: "구매일", field: "purchaseDate", v: a.purchaseDate ? window.fmtDate(a.purchaseDate) : "—" },
      // 통화 표기는 클라이언트 단위 전역 설정 — window.formatPrice 참조(구조설계안 3.4, data.js)
      { k: isIndiv ? "구매가격" : "구매가격 (품목 단가)", field: "purchasePrice", v: a.price ? window.formatPrice(a.price) : "—" },
      { k: "자산 등록일", v: window.fmtDate(a.createdAt) },
      { k: "QR 라벨", v: qrBtn },
      { k: "메모", v: memoHtml(a.note) },
    ].filter(Boolean)
     .filter(row => !row.field || !hidden.includes(row.field))
     .map(({ k, v }) => `<div><div class="k">${k}</div><div class="v">${v}</div></div>`).join("");

    // 배정/보유 카드. 카드 상단 액션은 "추가"만 담당(라벨 하나로 고정) — 재배정/반납/배정일 수정/수량 변경은 각 행에 종속.
    activityLog(a);   // 첫 렌더에서 미리 시드 — 조작 전 상태를 정확히 베이스라인으로 남기기 위해(개별형·수량형 공통)
    let holdCard;
    if (isIndiv) {
      const asg = a.assignments || [];
      holdCard = `
        <section class="dcard" id="assign-card">
          <div class="dsection-head">
            <div class="dtabs">
              <button data-atab="current" class="active">배정 현황</button>
              <button data-atab="history">이력</button>
            </div>
            <div class="hactions" id="assign-actions">${a.status === "disposed" ? "" : btn("배정 추가")}</div>
          </div>
          <div id="assign-body">${assignCurrentHtml(a)}</div>
        </section>`;
    } else {
      const stocks = a.stocks || [];
      holdCard = `
        <section class="dcard" id="stock-card">
          <div class="dsection-head">
            <div class="dtabs">
              <button data-stab="current" class="active">보유 현황</button>
              <button data-stab="history">이력</button>
            </div>
            <div class="hactions" id="stock-actions">${btn("보유 대상 추가")}</div>
          </div>
          <div class="stock-toolbar" id="stock-toolbar">
            <span class="stock-count">전체 <b>${stocks.length}</b></span>
            <div class="stock-search">
              <button type="button" class="stock-cat-btn" id="stock-cat-btn" data-cat="employee">구성원<span class="bchev">▾</span></button>
              <input type="text" id="stock-q" placeholder="이름/사번/휴대폰번호">
            </div>
          </div>
          <div class="stock-toolbar" id="history-toolbar" hidden>
            <div class="stock-search solo">
              <input type="text" id="history-q" placeholder="구성원·근무지 이름으로 검색">
            </div>
          </div>
          <div id="stock-body">${stockCards(a, "", "employee")}</div>
        </section>`;
    }

    c.innerHTML = `
      <div class="detail-topbar">
        <a href="assets.html" class="backbtn" aria-label="목록으로">←</a>
      </div>

      <div class="dgrid">
        <section class="dcard">
          <span class="navbtns">
            <a href="asset-detail.html?id=${prevId}" aria-label="이전 자산" data-tip="${prevA.product}">‹</a>
            <a href="asset-detail.html?id=${nextId}" aria-label="다음 자산" data-tip="${nextA.product}">›</a>
          </span>
          <div class="dhead-top" style="position:relative">
            ${mgrBtn}
            <div class="dhead-id">
              ${thumb}
              <div>
                <h1>${a.product}</h1>
                <div class="dhead-sub">${subMeta}</div>
              </div>
            </div>
          </div>

          <div class="dsection">
            <div class="kv2">${kv}</div>
          </div>
        </section>

        ${holdCard}
      </div>
    `;
    c.classList.add("detail-split");

    bindActs(c);
    c.querySelector("[data-qr]").onclick = e => openQrPopover(a, e.currentTarget);
    c.querySelector("[data-more]").onclick = e => moreDropdown(e.currentTarget, moreItems, a);
    const sc = c.querySelector("[data-statuschange]");
    if (sc) sc.onclick = e => statusDropdown(e.currentTarget, statusItems, a);
    const tb = c.querySelector("[data-viewer]");
    if (tb) tb.onclick = () => openViewer(a, a._primary || 0);

    const card = c.querySelector("#assign-card");
    if (card) {
      const body = card.querySelector("#assign-body");
      const actions = card.querySelector("#assign-actions");
      wireAssignCards(body, a);
      // bindActs(c)가 위에서 이미 이 버튼도 잡아 스텁 토스트로 바인딩했으므로, 실제 핸들러로 덮어씀
      const addBtn = actions.querySelector("[data-act]");
      if (addBtn) addBtn.onclick = () => openAssignAddModal(a);
      card.querySelectorAll("[data-atab]").forEach(t => t.onclick = () => {
        card.querySelectorAll("[data-atab]").forEach(x => x.classList.toggle("active", x === t));
        const isCurrent = t.dataset.atab === "current";
        body.innerHTML = isCurrent ? assignCurrentHtml(a) : timelineHtml(a);
        actions.hidden = !isCurrent;   // 배정 액션은 현황 탭에서만
        bindActs(body);
        if (isCurrent) wireAssignCards(body, a);
      });
    }
    const scard = c.querySelector("#stock-card");
    if (scard) {
      const sbody = scard.querySelector("#stock-body");
      const sactions = scard.querySelector("#stock-actions");
      const stoolbar = scard.querySelector("#stock-toolbar");
      const htoolbar = scard.querySelector("#history-toolbar");
      const historyQ = scard.querySelector("#history-q");
      const stockCatBtn = scard.querySelector("#stock-cat-btn");
      let stockCat = "employee";
      const stockQ = scard.querySelector("#stock-q");
      const CAT_PLACEHOLDER = { employee: "이름/사번/휴대폰번호", worksite: "근무지명/코드" };
      const CAT_LABEL = { employee: "구성원", worksite: "근무지" };
      const refreshStock = () => {
        sbody.innerHTML = stockCards(a, stockQ.value, stockCat);
        wireStockCards(sbody, a);
        sbody.querySelectorAll("[data-spage]").forEach(b => b.onclick = () => {
          stockPage += b.dataset.spage === "prev" ? -1 : 1;
          refreshStock();
        });
      };
      stockCatBtn.onclick = () => openStockCatMenu(stockCatBtn, stockCat, v => {
        stockCat = v;
        stockCatBtn.innerHTML = `${CAT_LABEL[v]}<span class="bchev">▾</span>`;
        stockQ.placeholder = CAT_PLACEHOLDER[v];
        stockPage = 1;
        refreshStock();
      });
      stockQ.oninput = () => { stockPage = 1; refreshStock(); };
      historyQ.oninput = () => { sbody.innerHTML = timelineHtml(a, historyQ.value); };
      // 최초 렌더(위 템플릿의 stock-body)엔 페이저 버튼 이벤트가 아직 안 걸려있으니 refreshStock()으로
      // 다시 그려서 wireStockCards + 페이저 바인딩을 한 번에 맞춤(검색어·카테고리는 기본값과 동일해 결과는 같음)
      refreshStock();
      // bindActs(c)가 위에서 이미 이 버튼도 잡아 스텁 토스트로 바인딩했으므로, 실제 핸들러로 덮어씀
      const saddBtn = sactions.querySelector("[data-act]");
      if (saddBtn) saddBtn.onclick = () => openHoldAddModal(a);

      scard.querySelectorAll("[data-stab]").forEach(t => t.onclick = () => {
        scard.querySelectorAll("[data-stab]").forEach(x => x.classList.toggle("active", x === t));
        const isCurrent = t.dataset.stab === "current";
        sactions.hidden = !isCurrent;   // 보유 대상 추가·검색은 현황 탭에서만
        stoolbar.hidden = !isCurrent;
        htoolbar.hidden = isCurrent;    // 이력 검색은 이력 탭에서만
        if (isCurrent) refreshStock();
        else { historyQ.value = ""; sbody.innerHTML = timelineHtml(a, ""); }
      });
    }
  }

  window.DetailScreen = { render };
})();
