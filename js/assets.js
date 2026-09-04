/* 현황 탭 — 자산 목록 (진입 화면) */
(function () {
  const TODAY = new Date("2026-09-04");
  const { assets } = window.DATA;

  const STATUS_LABEL = {
    stock: ["재고", "stock"], assigned: ["배정중", "assigned"], repair: ["수리중", "repair"],
    lost: ["분실", "lost"], disposed: ["폐기", "disposed"],
  };
  const TYPE_LABEL = { individual: "개별형", quantity: "수량형" };

  function expiryBucket(d) {
    if (!d) return null;
    const dt = new Date(d);
    const days = Math.ceil((dt - TODAY) / 86400000);
    if (days < 0) return { k: "over", t: "지남", c: "exp-over" };
    if (days <= 7) return { k: "soon", t: "임박", c: "exp-soon" };
    return { k: "valid", t: "유효", c: "exp-valid" };
  }
  function expiryCell(d) {
    if (!d) return '<span class="muted">—</span>';
    const b = expiryBucket(d);
    return `${d} <span class="badge ${b.c}">${b.t}</span>`;
  }
  function holderText(a) {
    if (a.type === "individual") {
      if (!a.assignments || !a.assignments.length) return '<span class="muted">재고</span>';
      const names = a.assignments.map(x => [x.employee, x.worksite].filter(Boolean).join("·"));
      return names.length === 1 ? names[0] : `${names[0]} <span class="muted">외 ${names.length - 1}</span>`;
    }
    const total = (a.stocks || []).reduce((s, x) => s + x.qty, 0);
    const places = (a.stocks || []).length;
    return `${total}개 <span class="muted">/ ${places}곳</span>`;
  }
  function labelsCell(labels) {
    if (!labels || !labels.length) return '<span class="muted">—</span>';
    const show = labels.slice(0, 2).map(l => `<span class="tag">${l}</span>`).join("");
    const more = labels.length > 2 ? `<span class="muted">+${labels.length - 2}</span>` : "";
    return show + more;
  }

  const state = { view: "all", page: 1 };

  function view_all() {
    const head = `<tr>
      <th>관리번호</th><th>제품명</th><th>분류</th><th>유형</th><th>상태</th>
      <th>배정·보유 현황</th><th>기한</th><th>라벨</th></tr>`;
    const rows = assets.map(a => {
      const st = a.type === "quantity"
        ? '<span class="muted">—</span>'
        : `<span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>`;
      return `<tr class="clickable" data-id="${a.id}">
        <td>${a.assetNo || '<span class="muted">—</span>'}</td>
        <td>${a.product}</td>
        <td>${a.group} <span class="muted">›</span> ${a.sub}</td>
        <td><span class="type-pill">${TYPE_LABEL[a.type]}</span></td>
        <td>${st}</td>
        <td>${holderText(a)}</td>
        <td>${expiryCell(a.expiry)}</td>
        <td>${labelsCell(a.labels)}</td>
      </tr>`;
    }).join("");
    return { head, rows, count: assets.length };
  }

  function view_product() {
    const map = new Map();
    assets.forEach(a => {
      const key = a.sub + "|" + a.product;
      if (!map.has(key)) map.set(key, { product: a.product, group: a.group, sub: a.sub, type: a.type, list: [] });
      map.get(key).list.push(a);
    });
    const head = `<tr><th>제품명</th><th>분류</th><th>유형</th><th class="num">자산 수</th>
      <th>상태 분포</th><th class="num">총 수량</th></tr>`;
    const rows = [...map.values()].map(g => {
      let dist = "—", totalQty = "—";
      if (g.type === "individual") {
        const c = {};
        g.list.forEach(a => c[a.status] = (c[a.status] || 0) + 1);
        dist = Object.entries(c).map(([k, v]) => `${STATUS_LABEL[k][0]} ${v}`).join(" · ");
      } else {
        totalQty = g.list.reduce((s, a) => s + (a.stocks || []).reduce((t, x) => t + x.qty, 0), 0);
      }
      return `<tr>
        <td>${g.product}</td>
        <td>${g.group} <span class="muted">›</span> ${g.sub}</td>
        <td><span class="type-pill">${TYPE_LABEL[g.type]}</span></td>
        <td class="num">${g.list.length}</td>
        <td>${dist}</td>
        <td class="num">${totalQty}</td>
      </tr>`;
    }).join("");
    return { head, rows, count: map.size };
  }

  function view_axis(axis) {
    // axis: 'employee' | 'worksite'
    const map = new Map();
    const bump = (name, kind, n) => {
      if (!name) return;
      if (!map.has(name)) map.set(name, { name, indiv: 0, qty: 0 });
      map.get(name)[kind] += n;
    };
    assets.forEach(a => {
      if (a.type === "individual") {
        (a.assignments || []).forEach(x => bump(x[axis], "indiv", 1)); // 공동배정: 행별 1건 / 복합: 양축 각각
      } else {
        (a.stocks || []).forEach(x => bump(x[axis], "qty", x.qty));
      }
    });
    const label = axis === "employee" ? "구성원" : "근무지";
    const head = `<tr><th>${label}</th><th class="num">배정 자산 수(개별형)</th><th class="num">보유 수량(수량형)</th></tr>`;
    const rows = [...map.values()].map(r => `<tr>
      <td>${r.name}</td>
      <td class="num">${r.indiv || '<span class="muted">0</span>'}</td>
      <td class="num">${r.qty || '<span class="muted">0</span>'}</td>
    </tr>`).join("");
    return { head, rows, count: map.size };
  }

  function currentView() {
    if (state.view === "all") return view_all();
    if (state.view === "product") return view_product();
    if (state.view === "employee") return view_axis("employee");
    if (state.view === "worksite") return view_axis("worksite");
  }

  function render() {
    const c = document.getElementById("content");
    const v = currentView();
    c.innerHTML = `
      <div class="tabs">
        <a class="active">현황</a>
        <a href="category.html">분류</a>
        <a href="settings.html">설정</a>
      </div>

      <div class="subtabs">
        ${[["all","전체"],["product","제품별"],["employee","구성원별"],["worksite","근무지별"]]
          .map(([k,t]) => `<button data-view="${k}" class="${state.view===k?'active':''}">${t}</button>`).join("")}
      </div>

      <div class="toolbar">
        <button class="filter-btn" data-stub="분류 필터(트리)">▤ 전체 분류 <span class="chev">▾</span></button>
        <button class="filter-btn" data-stub="상태 필터">상태 <span class="chev">▾</span></button>
        <button class="filter-btn" data-stub="기한 필터">기한 <span class="chev">▾</span></button>
        <button class="filter-btn" data-stub="라벨 필터">라벨 <span class="chev">▾</span></button>
        <div class="right">
          <button class="btn primary" id="btn-add">＋ 자산 추가 <span class="chev">▾</span></button>
          <button class="btn" id="btn-bulk-add">일괄 자산 추가</button>
          <button class="btn" id="btn-bulk-assign">일괄 배정·보유 변경</button>
          <button class="btn" id="btn-qr">QR 라벨</button>
        </div>
      </div>

      <div class="countrow">
        <span class="total">전체 <b>${v.count}</b></span>
        <div class="right">
          <input class="search" placeholder="검색" data-stub="검색">
          <button class="btn sm" data-stub="보기 설정">▤ 보기 설정</button>
          <button class="btn sm" data-stub="다운로드">⬇ 다운로드</button>
        </div>
      </div>

      <div class="table-wrap">
        <table><thead>${v.head}</thead><tbody>${v.rows}</tbody></table>
      </div>

      <div class="pager">
        <button>«</button><button>‹</button>
        <button class="active">1</button><button>2</button><button>3</button>
        <button>›</button><button>»</button>
        <span class="pagesize"><select><option>100</option><option>50</option><option>20</option></select></span>
      </div>
    `;

    c.querySelectorAll(".subtabs button").forEach(b =>
      b.onclick = () => { state.view = b.dataset.view; state.page = 1; render(); });

    c.querySelectorAll("tbody tr.clickable").forEach(tr =>
      tr.onclick = () => location.href = `asset-detail.html?id=${tr.dataset.id}`);

    c.querySelectorAll("[data-stub]").forEach(el =>
      el.onclick = () => toast(`"${el.dataset.stub}" — 이후 단계에서 정의`));

    document.getElementById("btn-add").onclick = openAddModal;
    document.getElementById("btn-qr").onclick = openQrModal;
    document.getElementById("btn-bulk-add").onclick = () => location.href = "batch-register.html";
    document.getElementById("btn-bulk-assign").onclick = () => location.href = "batch-assign.html";
  }

  /* ---------- modals ---------- */
  function modal(html) {
    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = html;
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelectorAll("[data-close]").forEach(b => b.onclick = () => back.remove());
    document.body.appendChild(back);
    return back;
  }

  function openAddModal() {
    let type = "individual";
    const m = modal(`
      <div class="modal">
        <h3>자산 추가</h3>
        <div class="body">
          <div class="field">
            <label>자산 유형 <span class="req">*</span></label>
            <div class="seg" id="type-seg">
              <button class="active" data-t="individual">개별형</button>
              <button data-t="quantity">수량형</button>
            </div>
            <div class="hint">유형은 선택한 소분류에서 상속됩니다. (구조안 3.4)</div>
          </div>
          <div class="field"><label>소분류 <span class="req">*</span></label>
            <select><option>전자기기류 › 노트북</option><option>가구류 › 의자</option><option>소모품 › 유니폼</option></select></div>
          <div class="field"><label>제품명 <span class="req">*</span></label><input type="text" placeholder="예: 그램 16 (2024)"></div>
          <div class="field" id="f-assetno"><label>고유관리번호 <span class="req">*</span></label><input type="text" placeholder="예: IT-2026-0001"></div>
          <div class="field"><label>기한</label><input type="date"><div class="hint">소분류 필드 노출 설정이 on일 때만 표시 (기본 off)</div></div>
          <div class="field"><label>라벨</label><input type="text" placeholder="입력 후 Enter · 최대 5개 · 20자"></div>
        </div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" data-close id="save">저장</button>
        </div>
      </div>`);
    m.querySelector("#type-seg").onclick = e => {
      const b = e.target.closest("button"); if (!b) return;
      type = b.dataset.t;
      m.querySelectorAll("#type-seg button").forEach(x => x.classList.toggle("active", x === b));
      m.querySelector("#f-assetno").style.display = type === "quantity" ? "none" : "";
    };
    m.querySelector("#save").addEventListener("click", () => toast("저장되었습니다 (프로토타입 — 반영 없음)"));
  }

  function openQrModal() {
    modal(`
      <div class="modal">
        <h3>QR 라벨 조회·다운로드</h3>
        <div class="body">
          <div class="notice">선택한 자산이 없어 <b>전체 기준 예시</b>를 표시합니다. 실제로는 목록에서 선택한 자산의 라벨을 일괄 다운로드합니다.</div>
          <div class="photos" style="justify-content:center;margin:8px 0 4px">
            <div class="ph" style="width:150px;height:150px;font-size:12px">QR</div>
          </div>
          <p class="hint" style="text-align:center">자산 등록 시 자동 생성 · payload = 앱 자산 상세 딥링크</p>
        </div>
        <div class="foot">
          <button class="btn" data-close>닫기</button>
          <button class="btn primary" data-close>PDF 다운로드</button>
        </div>
      </div>`);
  }

  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:200;box-shadow:0 8px 24px rgba(0,0,0,.25)";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  }

  window.AssetsScreen = { render };
})();
