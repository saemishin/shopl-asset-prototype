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
    return `${d} <span class="badge ${c}">${t}</span>`;
  }
  const chips = arr => (arr && arr.length) ? arr.map(l => `<span class="tag">${l}</span>`).join("") : '<span class="muted">—</span>';

  const IC_EMP = `<svg class="hi" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5"/></svg>`;
  const IC_WS = `<svg class="hi" viewBox="0 0 24 24"><path d="M4 20V9.5L12 4l8 5.5V20"/><path d="M9.5 20v-5h5v5"/></svg>`;
  const holderOne = x => (x.employee ? `${IC_EMP}${x.employee}` : `${IC_WS}${x.worksite}`);

  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:200";
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

  function render() {
    const id = new URLSearchParams(location.search).get("id");
    const idx = Math.max(0, assets.findIndex(x => x.id === id));
    const a = assets[idx];
    const c = document.getElementById("content");
    const isIndiv = a.type === "individual";
    const prevId = assets[(idx - 1 + assets.length) % assets.length].id;
    const nextId = assets[(idx + 1) % assets.length].id;

    const thumb = a.photo
      ? `<span class="dthumb" style="background:${a.photo}"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="m21 16-5-5-9 8"/></svg></span>`
      : `<span class="dthumb empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-4 4 3 4-4 5 4"/></svg></span>`;

    const subMeta = [
      isIndiv ? `<span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>` : `<span class="type-pill">수량 자산</span>`,
      isIndiv && a.assetNo ? `고유관리번호 <b>${a.assetNo}</b>` : "",
      isIndiv && a.serial ? `S/N ${a.serial}` : "",
    ].filter(Boolean).join('<span class="ddot">·</span>');

    const headActions = isIndiv
      ? btn("상태 변경") + `<button class="btn sm" data-more>⋯ 더보기</button>`
      : `<button class="btn sm" data-more>⋯ 더보기</button>`;
    const moreItems = isIndiv
      ? ["재배정·이동", "소분류 이동", "자산 수정", "자산 삭제"]
      : ["소분류 이동", "자산 수정", "자산 삭제"];

    const kv = [
      ["분류", `${a.group} › ${a.sub} <span class="type-pill">${isIndiv ? "개별 자산" : "수량 자산"}</span>`],
      ["제품명", a.product],
      isIndiv ? ["고유관리번호", a.assetNo || "—"] : null,
      isIndiv ? ["S/N", a.serial || '<span class="muted">—</span>'] : null,
      ["구매일", a.purchaseDate || "—"],
      [isIndiv ? "구매가격" : "구매가격 (품목 단가)", a.price ? a.price.toLocaleString() + "원" : "—"],
      ["제조연월일", a.manufactured || '<span class="muted">—</span>'],
      ["기한", expiryBadge(a.expiry)],
      ["라벨", chips(a.labels)],
      ["메모", a.note || '<span class="muted">—</span>'],
    ].filter(Boolean).map(([k, v]) => `<div><div class="k">${k}</div><div class="v">${v}</div></div>`).join("");

    // 배정/보유 카드
    let holdCard;
    if (isIndiv) {
      const asg = a.assignments || [];
      const rows = asg.length
        ? asg.map(x => `<div class="drow"><span class="who">${holderOne(x)}</span>
            <span class="muted since">${x.since} ~</span>
            <button class="btn sm" data-act="반납">반납</button></div>`).join("")
        : '<p class="muted" style="padding:6px 0">배정 없음 (재고 상태)</p>';
      holdCard = `
        <section class="dcard">
          <div class="dsection-head">
            <h4>배정 현황 ${asg.length > 1 ? `<span class="chip">공동 배정 ${asg.length}건</span>` : ""}</h4>
            <div class="hactions">${btn("신규 배정")}${btn("공동 배정 추가")}</div>
          </div>
          <div class="dlist">${rows}</div>
        </section>
        <section class="dcard">
          <div class="dsection-head"><h4>배정 이력</h4></div>
          <p class="muted" style="padding:4px 0">배정·반납 타임라인 — 이후 단계에서 정의</p>
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

    const photoSlots = [0, 1, 2, 3].map(i =>
      i === 0 && a.photo ? `<div class="ph" style="background:${a.photo}"></div>` : `<div class="ph">＋</div>`).join("");

    c.innerHTML = `
      <div class="detail-topbar">
        <a href="assets.html" class="backbtn" aria-label="목록으로">←</a>
        <span class="navbtns">
          <a href="asset-detail.html?id=${prevId}" aria-label="이전 자산">‹</a>
          <a href="asset-detail.html?id=${nextId}" aria-label="다음 자산">›</a>
        </span>
      </div>

      <section class="dcard dhead">
        <div class="dhead-top">
          <div class="dhead-id">
            ${thumb}
            <div>
              <h1>${a.product}</h1>
              <div class="dhead-sub">${subMeta}</div>
            </div>
          </div>
          <div class="dhead-meta">
            <span class="avatar-sm">D</span> 최종 수정 · dana · 2026.08.28 14:10
          </div>
        </div>
        <div class="dhead-actions">${headActions}</div>

        <div class="dsection">
          <div class="dsection-head"><h4>기본 정보</h4><button class="btn sm" data-act="자산 수정">수정</button></div>
          <div class="kv2">${kv}</div>
        </div>
      </section>

      ${holdCard}

      <section class="dcard">
        <div class="dsection-head"><h4>사진 <span class="muted">(최대 4장)</span></h4><button class="btn sm" data-act="사진 업로드">＋ 업로드</button></div>
        <div class="photos">${photoSlots}</div>
      </section>

      <section class="dcard">
        <div class="dsection-head"><h4>QR 라벨</h4></div>
        <div class="qrbox">
          <div class="ph" style="width:76px;height:76px">QR</div>
          <div>
            <p class="muted" style="margin-bottom:6px">자산 등록 시 자동 생성 · 스캔 시 앱 자산 상세로 연결</p>
            <button class="btn sm" data-act="QR 라벨 다운로드">다운로드</button>
          </div>
        </div>
      </section>
    `;

    c.querySelectorAll("[data-act]").forEach(b => b.onclick = () => toast(`"${b.dataset.act}" — 이후 단계에서 정의`));
    c.querySelector("[data-more]").onclick = e => dropdown(e.currentTarget, moreItems);
  }

  window.DetailScreen = { render };
})();
