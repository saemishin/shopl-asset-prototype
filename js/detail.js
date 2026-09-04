/* 자산 상세 (모달 성격이지만 프로토타입에선 페이지로 렌더) — 개별형 / 수량형 */
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

  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:200";
    document.body.appendChild(t); setTimeout(() => t.remove(), 1800);
  }
  function actionBtns(list) {
    return list.map(x => `<button class="btn sm" data-act="${x}">${x}</button>`).join("");
  }

  function render() {
    const id = new URLSearchParams(location.search).get("id");
    const a = assets.find(x => x.id === id) || assets[0];
    const c = document.getElementById("content");
    const isIndiv = a.type === "individual";

    const headActions = isIndiv
      ? actionBtns(["신규 배정", "반납", "재배정·이동", "공동 배정 추가", "상태 변경", "사진", "소분류 이동", "수정", "삭제"])
      : actionBtns(["보유 변경", "보유 대상 추가", "사진", "소분류 이동", "수정", "삭제"]);

    const infoRows = `
      <dl class="kv">
        <dt>분류</dt><dd>${a.group} › ${a.sub} <span class="type-pill">${isIndiv ? "개별형" : "수량형"}</span></dd>
        <dt>제품명</dt><dd>${a.product}</dd>
        ${isIndiv ? `<dt>고유관리번호</dt><dd>${a.assetNo || "—"}</dd>` : ""}
        ${isIndiv ? `<dt>S/N</dt><dd>${a.serial || '<span class="muted">—</span>'}</dd>` : ""}
        ${isIndiv ? `<dt>상태</dt><dd><span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span></dd>` : ""}
        <dt>구매일</dt><dd>${a.purchaseDate || "—"}</dd>
        <dt>${isIndiv ? "구매가격" : "품목 단가"}</dt><dd>${a.price ? a.price.toLocaleString() + "원" : "—"}</dd>
        <dt>기한</dt><dd>${expiryBadge(a.expiry)}</dd>
        <dt>라벨</dt><dd>${chips(a.labels)}</dd>
      </dl>`;

    let rightCard;
    if (isIndiv) {
      const rows = (a.assignments && a.assignments.length)
        ? a.assignments.map(x => `<div class="subrow">
            <span>${[x.employee, x.worksite].filter(Boolean).join(" · ")}</span>
            <span class="muted" style="margin-left:auto">${x.since}~</span>
            <button class="btn sm" data-act="개별 반납">반납</button></div>`).join("")
        : '<p class="muted">활성 배정 없음 — 재고 상태</p>';
      rightCard = `<div class="card"><h4>배정 현황 ${a.assignments && a.assignments.length > 1 ? '<span class="chip">공동 배정 ' + a.assignments.length + '건</span>' : ""}</h4>
        <div class="card-body">${rows}</div></div>
        <div class="card" style="margin-top:16px"><h4>배정 이력</h4>
        <div class="card-body"><p class="muted">이력 타임라인 — 이후 단계에서 정의</p></div></div>`;
    } else {
      const total = (a.stocks || []).reduce((s, x) => s + x.qty, 0);
      const rows = (a.stocks || []).map(x => `<div class="subrow">
        <span>${[x.worksite, x.employee].filter(Boolean).join(" · ")}</span>
        <span style="margin-left:auto;font-variant-numeric:tabular-nums">${x.qty}개</span>
        <button class="btn sm" data-act="보유 대상 제외">제외</button></div>`).join("");
      rightCard = `<div class="card"><h4>보유 현황 <span class="chip">총 ${total}개</span></h4>
        <div class="card-body">${rows}</div></div>`;
    }

    c.innerHTML = `
      <div class="tabs">
        <a href="assets.html" class="active">현황</a>
        <a href="category.html">분류</a>
        <a href="settings.html">설정</a>
      </div>

      <div class="detail-head">
        <div>
          <div class="back"><a href="assets.html">‹ 자산 목록</a></div>
          <h1>${a.product}</h1>
          <div class="meta">${a.id}${a.assetNo ? " · " + a.assetNo : ""}</div>
        </div>
        <div class="actions">${headActions}</div>
      </div>

      <div class="cards">
        <div class="card"><h4>기본 정보</h4><div class="card-body">${infoRows}</div></div>
        <div>
          ${rightCard}
          <div class="card" style="margin-top:16px"><h4>사진 <span class="muted">(최대 4장)</span></h4>
            <div class="card-body"><div class="photos">
              <div class="ph">＋</div><div class="ph">＋</div><div class="ph">＋</div><div class="ph">＋</div>
            </div></div></div>
          <div class="card" style="margin-top:16px"><h4>QR 라벨</h4>
            <div class="card-body" style="display:flex;gap:12px;align-items:center">
              <div class="ph" style="width:64px;height:64px">QR</div>
              <button class="btn sm" data-act="QR 다운로드">다운로드</button>
            </div></div>
        </div>
      </div>
    `;

    c.querySelectorAll("[data-act]").forEach(b =>
      b.onclick = () => toast(`"${b.dataset.act}" — 이후 단계에서 정의`));
  }

  window.DetailScreen = { render };
})();
