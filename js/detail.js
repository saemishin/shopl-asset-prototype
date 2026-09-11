/* 자산 상세 — 페이지. Shopl 상세(판매량·근무지) 레이아웃 참조 */
(function () {
  const TODAY = new Date("2026-09-04");
  const { assets } = window.DATA;
  const STATUS_LABEL = {
    stock: ["재고", "stock"], assigned: ["배정중", "assigned"], repair: ["수리중", "repair"],
    lost: ["분실", "lost"], disposed: ["폐기", "disposed"],
  };

  function expiryBadge(d) {
    if (!d) return '<span class="muted">—</span>';
    const days = Math.ceil((new Date(d) - TODAY) / 86400000);
    const [t, c] = days < 0 ? ["지남", "exp-over"] : days <= 7 ? ["임박", "exp-soon"] : ["유효", "exp-valid"];
    return `${window.fmtDate(d)} <span class="badge ${c}">${t}</span>`;
  }
  const chips = arr => (arr && arr.length) ? arr.map(l => `<span class="tag">${l}</span>`).join("") : '<span class="muted">—</span>';

  // 메모: 최대 500자(구조설계안 3.4), 화면엔 길이 제한 없이 전체 노출(말줄임·접기 없음)
  const memoHtml = note => note ? `<span>${note}</span>` : '<span class="muted">—</span>';

  const IC_EMP = `<svg class="hi" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5"/></svg>`;
  const IC_WS = `<svg class="hi" viewBox="0 0 24 24"><path d="M4 20V9.5L12 4l8 5.5V20"/><path d="M9.5 20v-5h5v5"/></svg>`;
  const IC_EDIT = `<svg viewBox="0 0 24 24"><path d="M4 20l1-4L16 5l3 3L8 19l-4 1z"/><path d="M13.5 6.5l4 4"/></svg>`;

  // 배정 현황 카드 — 구성원/근무지 여부에 따른 아이덴티티 표현.
  // ※ 그룹(부서)·근무지 코드는 구조설계안에 없는 필드 — 구성원/근무지가 "기존 재사용" 엔티티라 여기선 프로토타입 데모용 샘플값만 매핑
  const EMP_GROUP = { "김민수": "개발팀", "이서연": "디자인팀", "박지훈": "영업팀", "정우성": "CS팀", "김철수": "운영팀" };
  const WS_CODE = { "강남점": "GN-01", "판교점": "PG-01", "본사": "HQ-01" };
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
  const btn = (label, cls = "btn sm") => `<button class="${cls}" data-act="${label}">${label}</button>`;
  const bindActs = scope => scope.querySelectorAll("[data-act]").forEach(b =>
    b.onclick = () => toast(`"${b.dataset.act}" — 이후 단계에서 정의`));

  function openQrModal(a) {
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal">
        <h3>QR 라벨</h3>
        <div class="body" style="display:flex;gap:16px;align-items:center">
          <div class="ph" style="width:96px;height:96px;flex-shrink:0">QR</div>
          <div>
            <p style="font-size:13px;font-weight:600">${a.product}${a.assetNo ? ` / ${a.assetNo}` : ""}</p>
            <p class="muted" style="margin-top:4px">자산 등록 시 자동 생성 · 스캔 시 앱 자산 상세로 연결</p>
          </div>
        </div>
        <div class="foot">
          <button class="btn" data-close>닫기</button>
          <button class="btn primary" data-act="QR 라벨 다운로드">다운로드</button>
        </div>
      </div>`;
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-close]").onclick = () => back.remove();
    bindActs(back);
    document.body.appendChild(back);
  }

  /* ---------- 활동 로그 ---------- */
  // 초기 스냅샷(합성 데이터) — 세션 시작 시 자산의 현재 상태로부터 한 번만 만들어지는 베이스라인
  function activityOf(a) {
    const ev = [{ d: a.createdAt || a.purchaseDate || "2024-01-01", t: "자산 생성", who: "dana" }];
    (a.assignments || []).forEach(x => ev.push({ d: x.since, t: `${x.employee || x.worksite}에게 배정`, who: "dana" }));
    (a.stocks || []).forEach(x => ev.push({ d: a.purchaseDate || "2025-01-01", t: `${x.employee || x.worksite} 보유 대상 추가 · ${x.qty}개`, who: "dana" }));
    if (a.status === "repair") ev.push({ d: "2026-08-14", t: "수리 접수 · 배정중 → 수리중", who: "dana" });
    if (a.status === "lost") ev.push({ d: "2026-07-21", t: "분실 신고 · 배정중 → 분실", who: "정우성" });
    if (a.status === "disposed") ev.push({ d: "2025-12-30", t: "폐기 처리 · 활성 배정 자동 종료", who: "dana" });
    if (a.note) ev.push({ d: "2026-06-02", t: "메모 수정", who: "dana" });
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
  function logActivity(a, t) {
    activityLog(a).unshift({ d: todayStr(), t, who: "dana" });
  }
  // 보유 레코드의 "최종 수정일" — 최초 등록(자산 등록일과 동일 취급) 이후 수량이 바뀐 적 있으면 그 시점, 없으면 등록일
  const stockUpdatedAt = (a, x) => x._updatedAt || a.createdAt;
  function timelineHtml(a) {
    return `<ol class="dtimeline">${activityLog(a).map(e => `
      <li><span class="tl-dot"></span>
        <div><div class="tl-t">${e.t}</div><div class="tl-m">${window.fmtDate(e.d)} · ${e.who}</div></div>
      </li>`).join("")}</ol>`;
  }
  // 보유 현황 — 배정 현황과 동일한 카드 UI(assignIdentity 재사용) + 검색(구성원/근무지 카테고리 선택)
  // 정렬: 최종 수정일 내림차순(최근 변경 위로) → 동률(일괄 처리 등)이면 이름 가나다순
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
        return x.employee.toLowerCase().includes(q);
      })
      .sort((p, q2) => {
        const dp = stockUpdatedAt(a, p.x), dq = stockUpdatedAt(a, q2.x);
        if (dp !== dq) return dp < dq ? 1 : -1;
        const np = p.x.employee || p.x.worksite, nq = q2.x.employee || q2.x.worksite;
        return np.localeCompare(nq, "ko");
      });
    if (!rows.length) return '<p class="muted" style="padding:6px 0">일치하는 보유 대상이 없습니다</p>';
    return `<div class="acard-list">${rows.map(({ x, idx }) => `
      <div class="acard" data-idx="${idx}">
        ${typeBadge(x)}
        <div class="acard-id">${assignIdentity(x)}</div>
        <div class="acard-foot">
          <div class="acard-meta">
            <span class="acard-date">보유 수량 <b class="qty">${x.qty}개</b></span>
            <span class="acard-date">최종 수정일 <b>${window.fmtDate(stockUpdatedAt(a, x))}</b></span>
          </div>
          <div class="acard-actions">
            <button class="btn sm" data-qtyedit>수량 변경</button>
            <button class="btn sm" data-release>보유 해제</button>
          </div>
        </div>
      </div>`).join("")}</div>`;
  }
  // 수량 변경 팝오버 — 스테퍼(1 미만 불가) + 직접입력(포커스 시 기존값 지우고 새로 입력, 미입력 시 저장 비활성)
  function openQtyPopover(anchor, a, idx) {
    document.querySelectorAll(".qty-popover").forEach(m => m.remove());
    const cur = a.stocks[idx].qty;
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
      minus.disabled = v === null || v <= 1;
      save.disabled = v === null || v < 1;
    };
    input.addEventListener("input", () => {
      input.value = input.value.replace(/[^0-9]/g, "");
      sync();
    });
    minus.onclick = () => { const v = val(); if (v !== null && v > 1) { input.value = v - 1; sync(); } };
    plus.onclick = () => { const v = val() ?? 0; input.value = v + 1; sync(); };
    save.onclick = () => {
      const v = val();
      if (v === null || v < 1) return;
      const x = a.stocks[idx];
      const name = x.employee || x.worksite;
      a.stocks[idx].qty = v;
      a.stocks[idx]._updatedAt = todayStr();
      logActivity(a, `${name} 보유 수량 변경 · ${cur}개 → ${v}개`);
      pop.remove();
      toast(`보유 수량이 ${v}개로 변경되었습니다`);
      render();
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
      const name = x.employee || x.worksite;
      confirmModal(`${name}을(를) 보유 대상에서 해제하시겠습니까?<br><span class="muted" style="font-size:12px">보유 기록이 삭제되며, 이후 이 자산의 보유 대상 목록에 나타나지 않습니다. (수량만 바꾸려면 취소 후 수량 변경을 이용하세요)</span>`, () => {
        const qty = x.qty;
        a.stocks.splice(idx, 1);
        logActivity(a, `${name} 보유 대상에서 해제 · 기존 수량 ${qty}개`);
        toast("보유 대상에서 해제되었습니다");
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
    if (!asg.length) return '<p class="muted" style="padding:6px 0">배정 없음 (재고 상태)</p>';
    const rows = asg.map((x, idx) => ({ x, idx })).sort((p, q) => (p.x.since < q.x.since ? 1 : -1));
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
  // 배정일 수정 팝오버 — 대상(구성원/근무지)은 여기서 못 바꿈(재배정으로만), 날짜만 수정
  function openDatePopover(anchor, a, idx) {
    document.querySelectorAll(".qty-popover").forEach(m => m.remove());
    const cur = a.assignments[idx].since;
    const pop = document.createElement("div");
    pop.className = "qty-popover";
    pop.innerHTML = `
      <input type="date" data-dinput value="${cur}">
      <div class="qty-pop-acts">
        <button class="btn sm" data-dcancel>취소</button>
        <button class="btn sm primary" data-dsave>저장</button>
      </div>`;
    const r = anchor.getBoundingClientRect();
    pop.style.cssText = `position:fixed;top:${r.bottom + 6}px;left:${Math.max(8, r.right - 200)}px`;
    document.body.appendChild(pop);

    const input = pop.querySelector("[data-dinput]");
    const save = pop.querySelector("[data-dsave]");
    const sync = () => { save.disabled = !input.value; };
    input.addEventListener("input", sync);
    save.onclick = () => {
      if (!input.value) return;
      const v = input.value;
      const x = a.assignments[idx];
      const name = x.employee || x.worksite;
      x.since = v;
      logActivity(a, `${name} 배정일 변경 · ${window.fmtDate(cur)} → ${window.fmtDate(v)}`);
      pop.remove();
      toast(`배정일이 ${window.fmtDate(v)}로 변경되었습니다`);
      render();
    };
    pop.querySelector("[data-dcancel]").onclick = () => pop.remove();
    sync();
    input.focus();
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
        a._primary = cur; toast("자산 대표 사진으로 지정되었습니다"); draw();
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
    const prevId = assets[(idx - 1 + assets.length) % assets.length].id;
    const nextId = assets[(idx + 1) % assets.length].id;
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
    const statusItems = isIndiv ? STATUS_TRANSITIONS[a.status] : [];
    const statusBadge = isIndiv
      ? (statusItems.length
          ? `<button class="badge ${STATUS_LABEL[a.status][1]} clickable" data-statuschange>${STATUS_LABEL[a.status][0]} <span class="bchev">▾</span></button>`
          : `<span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>`)
      : "";   // 수량 자산 뱃지는 분류(kv2)에 이미 노출돼 중복 — 헤더엔 표기하지 않음
    const subMeta = isIndiv
      ? `<div>${statusBadge}</div>${a.assetNo ? `<div style="margin-top:5px">고유관리번호 <b>${a.assetNo}</b></div>` : ""}`
      : "";

    const QR_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM19 14h2v2h-2zM14 19h2v2h-2zM19 19h2v2h-2z"/></svg>`;
    const qrBtn = `<button class="btn sm icon-only" data-qr aria-label="QR 라벨" title="QR 라벨">${QR_ICON}</button>`;
    // 자산관리(소분류 이동·자산 수정·자산 삭제)만 남음. 재배정은 배정 행으로, 상태 변경은 상태 뱃지로 이동.
    const MORE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>`;
    const mgrBtn = `<button class="btn sm icon-only corner" data-more aria-label="자산관리" title="자산관리">${MORE_ICON}</button>`;
    const moreItems = ["소분류 이동", "자산 수정", "자산 삭제"];

    // 필수값(분류) 먼저, 선택값이 뒤따름. 태그·유효기한은 분류 바로 다음. 제조연월일이 구매일보다 앞(제조가 구매보다 먼저 일어나는 시점).
    // 선택 필드(field 태그가 있는 행)는 소분류 필드 노출 설정(hiddenFields)에서 off면 행 자체를 숨김.
    // 구매일·구매가격을 붙여서 "취득 정보" 세트로 묶고, 그 뒤로 사용자 입력이 아니라 시스템이 자동 기록하는 필드(등록일·QR 라벨)를 배치.
    // 메모는 마지막(최대 500자, 길어질 수 있음) — 자유 입력값이지만 길이가 가변적이라 다른 고정형 필드들 뒤에 둠.
    const cat = (window.DATA.categories || []).find(x => x.group === a.group && x.sub === a.sub) || {};
    const hidden = cat.hiddenFields || [];
    const kv = [
      { k: "분류", v: `<div><span class="type-pill">${isIndiv ? "개별 자산" : "수량 자산"}</span></div><div style="margin-top:5px">${a.group} › ${a.sub}</div>` },
      { k: "태그", v: chips(a.labels) },
      { k: "유효기한", field: "expiry", v: expiryBadge(a.expiry) },
      isIndiv ? { k: "S/N", field: "serial", v: a.serial || '<span class="muted">—</span>' } : null,
      { k: "제조연월일", field: "manufactured", v: a.manufactured ? window.fmtDate(a.manufactured) : '<span class="muted">—</span>' },
      { k: "구매일", field: "purchaseDate", v: a.purchaseDate ? window.fmtDate(a.purchaseDate) : "—" },
      { k: isIndiv ? "구매가격" : "구매가격 (품목 단가)", field: "purchasePrice", v: a.price ? a.price.toLocaleString() + "원" : "—" },
      { k: "등록일", v: window.fmtDate(a.createdAt) },
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
            <div class="hactions" id="assign-actions">${btn("배정 추가")}</div>
          </div>
          <div id="assign-body">${assignCurrentHtml(a)}</div>
        </section>`;
    } else {
      const stocks = a.stocks || [];
      const total = stocks.reduce((s, x) => s + x.qty, 0);
      holdCard = `
        <section class="dcard" id="stock-card">
          <div class="dsection-head">
            <div class="dtabs">
              <button data-stab="current" class="active">보유 현황 <span class="chip">총 ${total}개</span></button>
              <button data-stab="history">이력</button>
            </div>
            <div class="hactions" id="stock-actions">${btn("보유 대상 추가")}</div>
          </div>
          <div class="stock-toolbar" id="stock-toolbar">
            <span class="stock-count">전체 <b>${stocks.length}</b></span>
            <div class="stock-search">
              <select id="stock-cat">
                <option value="employee">구성원</option>
                <option value="worksite">근무지</option>
              </select>
              <input type="text" id="stock-q" placeholder="이름·휴대폰번호·사번으로 검색">
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
            <a href="asset-detail.html?id=${prevId}" aria-label="이전 자산">‹</a>
            <a href="asset-detail.html?id=${nextId}" aria-label="다음 자산">›</a>
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
    c.querySelector("[data-qr]").onclick = () => openQrModal(a);
    c.querySelector("[data-more]").onclick = e => dropdown(e.currentTarget, moreItems);
    const sc = c.querySelector("[data-statuschange]");
    if (sc) sc.onclick = e => dropdown(e.currentTarget, statusItems);
    const tb = c.querySelector("[data-viewer]");
    if (tb) tb.onclick = () => openViewer(a, a._primary || 0);

    const card = c.querySelector("#assign-card");
    if (card) {
      const body = card.querySelector("#assign-body");
      const actions = card.querySelector("#assign-actions");
      wireAssignCards(body, a);
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
      const stockCat = scard.querySelector("#stock-cat");
      const stockQ = scard.querySelector("#stock-q");
      const CAT_PLACEHOLDER = { employee: "이름·휴대폰번호·사번으로 검색", worksite: "근무지명·코드·주소로 검색" };
      const refreshStock = () => {
        sbody.innerHTML = stockCards(a, stockQ.value, stockCat.value);
        wireStockCards(sbody, a);
      };
      stockCat.onchange = () => { stockQ.placeholder = CAT_PLACEHOLDER[stockCat.value]; refreshStock(); };
      stockQ.oninput = refreshStock;
      wireStockCards(sbody, a);

      scard.querySelectorAll("[data-stab]").forEach(t => t.onclick = () => {
        scard.querySelectorAll("[data-stab]").forEach(x => x.classList.toggle("active", x === t));
        const isCurrent = t.dataset.stab === "current";
        sactions.hidden = !isCurrent;   // 보유 대상 추가·검색은 현황 탭에서만
        stoolbar.hidden = !isCurrent;
        if (isCurrent) refreshStock();
        else sbody.innerHTML = timelineHtml(a);
      });
    }
  }

  window.DetailScreen = { render };
})();
