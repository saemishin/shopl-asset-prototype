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

  const IC_EMP = `<svg class="hi" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5"/></svg>`;
  const IC_WS = `<svg class="hi" viewBox="0 0 24 24"><path d="M4 20V9.5L12 4l8 5.5V20"/><path d="M9.5 20v-5h5v5"/></svg>`;
  const holderOne = x => (x.employee ? `${IC_EMP}${x.employee}` : `${IC_WS}${x.worksite}`);

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

  /* ---------- 활동 로그 (합성 데이터) ---------- */
  function activityOf(a) {
    const ev = [{ d: a.purchaseDate || "2024-01-01", t: "자산 생성", who: "dana" }];
    (a.assignments || []).forEach(x => ev.push({ d: x.since, t: `${x.employee || x.worksite}에게 배정`, who: "dana" }));
    (a.stocks || []).forEach(x => ev.push({ d: a.purchaseDate || "2025-01-01", t: `${x.employee || x.worksite} 보유 대상 추가`, who: "dana" }));
    if (a.status === "repair") ev.push({ d: "2026-08-14", t: "수리 접수 · 배정중 → 수리중", who: "dana" });
    if (a.status === "lost") ev.push({ d: "2026-07-21", t: "분실 신고 · 배정중 → 분실", who: "정우성" });
    if (a.status === "disposed") ev.push({ d: "2025-12-30", t: "폐기 처리 · 활성 배정 자동 종료", who: "dana" });
    if (a.note) ev.push({ d: "2026-06-02", t: "메모 수정", who: "dana" });
    return ev.sort((x, y) => (x.d < y.d ? 1 : -1));
  }
  function timelineHtml(a) {
    return `<ol class="dtimeline">${activityOf(a).map(e => `
      <li><span class="tl-dot"></span>
        <div><div class="tl-t">${e.t}</div><div class="tl-m">${window.fmtDate(e.d)} · ${e.who}</div></div>
      </li>`).join("")}</ol>`;
  }
  function assignCurrentHtml(a) {
    const asg = a.assignments || [];
    if (!asg.length) return '<p class="muted" style="padding:6px 0">배정 없음 (재고 상태)</p>';
    return `<div class="dlist">${asg.map(x => `<div class="drow">
      <span class="who">${holderOne(x)}</span>
      <span class="muted since">${window.fmtDate(x.since)} ~</span>
      <button class="btn sm" data-act="반납">반납</button></div>`).join("")}</div>`;
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

    const subMeta = [
      isIndiv ? `<span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>` : `<span class="type-pill">수량 자산</span>`,
      isIndiv && a.assetNo ? `고유관리번호 <b>${a.assetNo}</b>` : "",
    ].filter(Boolean).join('<span class="ddot">·</span>');

    const QR_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM19 14h2v2h-2zM14 19h2v2h-2zM19 19h2v2h-2z"/></svg>`;
    const qrBtn = `<button class="btn sm icon-only" data-qr aria-label="QR 라벨" title="QR 라벨">${QR_ICON}</button>`;
    const headActions = isIndiv
      ? qrBtn + btn("상태 변경") + `<button class="btn sm" data-more>⋯ 더보기</button>`
      : qrBtn + `<button class="btn sm" data-more>⋯ 더보기</button>`;
    const moreItems = isIndiv
      ? ["재배정·이동", "소분류 이동", "자산 수정", "자산 삭제"]
      : ["소분류 이동", "자산 수정", "자산 삭제"];

    const kv = [
      ["분류", `${a.group} › ${a.sub} <span class="type-pill">${isIndiv ? "개별 자산" : "수량 자산"}</span>`],
      isIndiv ? ["S/N", a.serial || '<span class="muted">—</span>'] : null,
      ["구매일", a.purchaseDate ? window.fmtDate(a.purchaseDate) : "—"],
      [isIndiv ? "구매가격" : "구매가격 (품목 단가)", a.price ? a.price.toLocaleString() + "원" : "—"],
      ["제조연월일", a.manufactured ? window.fmtDate(a.manufactured) : '<span class="muted">—</span>'],
      ["기한", expiryBadge(a.expiry)],
      ["라벨", chips(a.labels)],
      ["메모", a.note || '<span class="muted">—</span>'],
    ].filter(Boolean).map(([k, v]) => `<div><div class="k">${k}</div><div class="v">${v}</div></div>`).join("");

    // 배정/보유 카드
    let holdCard;
    if (isIndiv) {
      const asg = a.assignments || [];
      holdCard = `
        <section class="dcard" id="assign-card">
          <div class="dsection-head">
            <div class="dtabs">
              <button data-atab="current" class="active">현황 ${asg.length > 1 ? `<span class="chip">공동 ${asg.length}건</span>` : ""}</button>
              <button data-atab="history">이력</button>
            </div>
            <div class="hactions">${btn("신규 배정")}${btn("공동 배정 추가")}</div>
          </div>
          <div id="assign-body">${assignCurrentHtml(a)}</div>
        </section>`;
    } else {
      const stocks = a.stocks || [];
      const total = stocks.reduce((s, x) => s + x.qty, 0);
      const rows = stocks.map(x => `<div class="drow"><span class="who">${holderOne(x)}</span>
        <span class="qty">${x.qty}개</span>
        <button class="btn sm" data-act="보유 대상 제외">제외</button></div>`).join("");
      holdCard = `
        <section class="dcard">
          <div class="dsection-head">
            <h4>보유 현황 <span class="chip">총 ${total}개 · ${stocks.length}건</span></h4>
            <div class="hactions">${btn("보유 변경")}${btn("보유 대상 추가")}</div>
          </div>
          <div class="dlist">${rows}</div>
        </section>`;
    }

    c.innerHTML = `
      <div class="detail-topbar">
        <a href="assets.html" class="backbtn" aria-label="목록으로">←</a>
        <span class="navbtns">
          <a href="asset-detail.html?id=${prevId}" aria-label="이전 자산">‹</a>
          <a href="asset-detail.html?id=${nextId}" aria-label="다음 자산">›</a>
        </span>
      </div>

      <div class="dgrid">
        <section class="dcard">
          <div class="dhead-top">
            <div class="dhead-id">
              ${thumb}
              <div>
                <h1>${a.product}</h1>
                <div class="dhead-sub">${subMeta}</div>
              </div>
            </div>
            <div class="dhead-meta">
              <span class="avatar-sm">D</span> 최종 수정 · dana · ${window.fmtDateTime("2026-08-28 14:10")}
            </div>
          </div>
          <div class="dhead-actions">${headActions}</div>

          <div class="dsection">
            <div class="dsection-head"><h4>기본 정보</h4><button class="btn sm" data-act="자산 수정">수정</button></div>
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
    const tb = c.querySelector("[data-viewer]");
    if (tb) tb.onclick = () => openViewer(a, a._primary || 0);

    const card = c.querySelector("#assign-card");
    if (card) {
      const body = card.querySelector("#assign-body");
      card.querySelectorAll("[data-atab]").forEach(t => t.onclick = () => {
        card.querySelectorAll("[data-atab]").forEach(x => x.classList.toggle("active", x === t));
        body.innerHTML = t.dataset.atab === "current" ? assignCurrentHtml(a) : timelineHtml(a);
        bindActs(body);
      });
    }
  }

  window.DetailScreen = { render };
})();
