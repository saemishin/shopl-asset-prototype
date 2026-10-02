/* 앱 리더모드 — 러프 프로토타입(2026-09-30). 직원모드(app.js)와 달리 "내 자산"이 아니라 조회 권한 범위
   안의 회사 전체 자산을 보는 화면. 자산 상세는 아직 제외. 소분류 상세 검색·필터와 권한 기반 자산 추가를 구현.
   필터는 직원모드와 공용 팝업 사용. 이 파일도 다른 화면 파일들과 동일하게
   자기 완결적(상수 중복 정의)이라 app.js/assets.js와 겹치는 부분이 많음 */
(function () {
  const { assets } = window.DATA;
  const TODAY = new Date("2026-09-04");
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // 태그는 앞뒤 공백 제거·연속 공백 한 칸으로 정규화하되 대소문자는 유지한다.
  const normalizeTagName = value => value.trim().replace(/\s+/g, " ");
  function formatAddPrice(value) {
    const digits = value.replace(/[^0-9]/g, "").slice(0, 12);
    return digits ? Number(digits).toLocaleString("ko-KR") : "";
  }
  const CLOSE_ICON_SM = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>`;
  const CAL_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>`;
  const TAG_COLORS = [
    { fg: "#3461c9", bg: "#eaf1ff" }, { fg: "#6b3fd4", bg: "#f1ecff" },
    { fg: "#c23c56", bg: "#fdecef" }, { fg: "#1f8f5f", bg: "#e8f8f0" },
    { fg: "#b5790a", bg: "#fdf3e0" }, { fg: "#1f8fae", bg: "#e6f6fa" },
  ];
  function todayStr() {
    const p = n => String(n).padStart(2, "0");
    return `${TODAY.getFullYear()}-${p(TODAY.getMonth() + 1)}-${p(TODAY.getDate())}`;
  }
  function tagColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 997;
    return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
  }
  // app.js의 toast()와 동일(중복) — .mapp-screen 영역 기준으로 떠서 폰 목업 밖으로 안 나가게
  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    const screen = document.querySelector(".mapp-screen");
    const r = screen ? screen.getBoundingClientRect() : null;
    const pos = r ? `left:${r.left + r.width / 2}px;bottom:${window.innerHeight - r.bottom + 32}px;` : "left:50%;bottom:32px;";
    t.style.cssText = `position:fixed;${pos}transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300;max-width:280px;text-align:center`;
    document.body.appendChild(t); setTimeout(() => t.remove(), 1800);
  }
  // 직원모드에서 쓰는 앱 오버레이·앵커 메뉴 패턴을 리더 파일 안에서도 자기 완결적으로 재사용한다.
  function mappOverlay(className, zIndex) {
    const back = document.createElement("div");
    back.className = className;
    const screen = document.querySelector(".mapp-screen");
    const r = screen ? screen.getBoundingClientRect() : { top: 0, left: 0, width: 390, height: 844 };
    back.style.cssText = `position:fixed;top:${r.top}px;left:${r.left}px;width:${r.width}px;height:${r.height}px;z-index:${zIndex};`;
    document.body.appendChild(back);
    return back;
  }
  function openAddDropdown(anchor, items, onPick) {
    document.querySelectorAll(".dropdown-menu").forEach(menu => menu.remove());
    const menu = document.createElement("div");
    menu.className = "dropdown-menu";
    menu.innerHTML = items.map(item => `<button type="button" data-key="${item.key}">${item.label}</button>`).join("");
    const r = anchor.getBoundingClientRect();
    menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${Math.max(8, r.right - 180)}px;min-width:180px`;
    document.body.appendChild(menu);
    menu.querySelectorAll("button").forEach(button => button.onclick = () => { menu.remove(); onPick(button.dataset.key); });
    setTimeout(() => {
      const close = event => {
        if (!menu.contains(event.target)) { menu.remove(); document.removeEventListener("click", close); }
      };
      document.addEventListener("click", close);
    });
  }
  function openAddMonthSheet(title, initialMonth, onApply) {
    const base = initialMonth || todayStr().slice(0, 7);
    let viewY = Number(base.slice(0, 4));
    let selected = initialMonth || "";
    const maxMonth = todayStr().slice(0, 7);
    const back = mappOverlay("mapp-sheet-back", 120);
    back.innerHTML = `<div class="mapp-sheet mapp-add-month-sheet" role="dialog" aria-modal="true" aria-label="${title}">
      ${initialMonth ? '<div class="mapp-add-month-reset"><button type="button" data-add-date-reset>초기화</button></div>' : ""}
      <div class="mapp-sheet-body" data-add-month-body></div>
      <div class="mapp-sheet-foot"><button type="button" data-add-month-cancel>취소</button><button type="button" data-add-month-ok>확인</button></div></div>`;
    const body = back.querySelector("[data-add-month-body]");
    const ok = back.querySelector("[data-add-month-ok]");
    const pad = n => String(n).padStart(2, "0");
    function drawMonths() {
      body.innerHTML = `<div class="mapp-add-month-head"><button type="button" data-month-prev aria-label="이전 해">‹</button><strong>${viewY}</strong><button type="button" data-month-next aria-label="다음 해">›</button></div>
        <div class="mapp-add-month-grid">${Array.from({ length: 12 }, (_, index) => {
          const value = `${viewY}-${pad(index + 1)}`;
          return `<button type="button" data-month="${value}" aria-label="${index + 1}월" aria-pressed="${value === selected}" class="${value === selected ? "sel" : ""}"${value > maxMonth ? " disabled" : ""}><span>${pad(index + 1)}</span></button>`;
        }).join("")}</div><div class="mapp-cal-sel">${selected ? selected.replace("-", ".") : ""}</div>`;
      body.querySelector("[data-month-prev]").onclick = () => { viewY--; drawMonths(); };
      const next = body.querySelector("[data-month-next]");
      next.disabled = viewY >= Number(maxMonth.slice(0, 4));
      next.onclick = () => { if (!next.disabled) { viewY++; drawMonths(); } };
      body.querySelectorAll("[data-month]").forEach(button => button.onclick = () => { selected = button.dataset.month; drawMonths(); });
      ok.disabled = !selected;
    }
    drawMonths();
    back.addEventListener("click", event => { if (event.target === back) back.remove(); });
    back.querySelector("[data-add-month-cancel]").onclick = () => back.remove();
    const reset = back.querySelector("[data-add-date-reset]");
    if (reset) reset.onclick = () => { back.remove(); onApply(""); };
    ok.onclick = () => { if (selected) { back.remove(); onApply(selected); } };
  }

  // "나" 페르소나 — 리더 1명(김민수)을 고정. 앱 직원모드의 ?me= 같은 전환 기능은 이번 러프 스코프에 없음
  const ME = "김민수";
  // 실제 서비스에서는 전역 manage_permission_type(관리자만/관리자 및 모든 리더/관리자 및 특정 리더)과
  // manage_permission_targets를 판정한다. 프로토타입의 김민수 계정은 자산 관리 권한 보유자로 고정한다.
  const DEMO_ASSUME_ASSET_MANAGE_PERMISSION = true;
  function hasAssetManagePermission() {
    return DEMO_ASSUME_ASSET_MANAGE_PERMISSION;
  }
  // detail.js/app.js의 MEMBERS와 동일 값(이 파일도 자기 완결적이라 중복 유지) — 조회 권한 판정(팀 매칭)에만 씀
  const MEMBER_TEAM = {
    "김민수": "개발팀", "이서연": "디자인팀", "박지훈": "영업팀", "정우성": "CS팀", "김철수": "운영팀",
    "최유진": "개발팀", "한소희": "디자인팀", "장민호": "국내영업", "오세훈": "운영팀", "배수지": "CS팀",
    "윤재현": "해외영업", "임하늘": "개발팀",
  };
  // app.js의 hasViewPermission과 동일 로직(그대로 중복) — 리더모드 자산 화면은 "조회 권한을 가진 자산
  // 전체"가 화면의 정의 그 자체라, 이 판정 함수가 목록 수집의 핵심. 소분류 트리(허브 화면)는 자산이 아니라
  // 카테고리 자체를 걸러야 해서 판정 로직을 catViewPermission(cat)으로 분리하고 hasViewPermission(a)은 그걸 재사용
  function catViewPermission(cat) {
    if (!cat) return false;
    // 구조설계안 4.1/4.2: 자산 관리 권한자는 소분류 설정과 무관하게 전체 조회 가능.
    if (hasAssetManagePermission()) return true;
    switch (cat.view) {
      case "회사의 모든 구성원": return true;
      case "모든 관리자 및 리더": return true; // 현재 페르소나는 리더 김민수
      case "특정 관리자/리더": return (cat.viewTarget && cat.viewTarget.members || []).includes(ME);
      case "특정 그룹 및 직무/직급": return (cat.viewTarget && cat.viewTarget.groups || []).includes(MEMBER_TEAM[ME]);
      default: return false; // 관리자만: 관리권한 예외가 없으면 리더는 접근 불가
    }
  }
  function hasViewPermission(a) {
    return catViewPermission(window.DATA.categories.find(c => c.group === a.group && c.sub === a.sub));
  }
  const STATUS_LABEL = {
    stock: ["재고", "stock"], assigned: ["배정 중", "assigned"], repair: ["수리 중", "repair"],
    lost: ["분실", "lost"], disposed: ["폐기", "disposed"], held: ["보유 중", "assigned"],
  };
  // assets.js의 isDepleted/hasUnheldHolder와 동일(중복) — 수량형 소분류 화면의 "소진"·"미보유대상" 필터에 씀
  function isDepleted(a) {
    return a.type === "quantity" && a.totalQty - (a.stocks || []).reduce((s, x) => s + x.qty, 0) === 0;
  }
  function hasUnheldHolder(a) {
    return a.type === "quantity" && (a.stocks || []).some(x => x.qty === 0);
  }
  const CATEGORY_ORDER = new Map(window.DATA.categories.map((c, i) => [c.sub, i]));
  function subOrder(sub) { return CATEGORY_ORDER.has(sub) ? CATEGORY_ORDER.get(sub) : 999; }
  function sortItems(items) {
    return [...items].sort((p, q) => {
      const bySub = subOrder(p.asset.sub) - subOrder(q.asset.sub);
      if (bySub) return bySub;
      const byProduct = p.asset.product.localeCompare(q.asset.product, "ko");
      if (byProduct) return byProduct;
      if (p.asset.type === "individual") return (p.asset.assetNo || "").localeCompare(q.asset.assetNo || "", "ko");
      return q.qty - p.qty;
    });
  }
  // 대시보드 "전체" 탭과 동일하게 자산 1건당 한 행(특정 배정/보유 대상 기준이 아님) — 수량형의 qty는
  // 특정 보유자의 보유 수량이 아니라 그 자산의 총 수량(totalQty)
  function collectLeaderItems() {
    return assets.filter(a => hasViewPermission(a)).map(a => ({ asset: a, qty: a.type === "quantity" ? (a.totalQty || 0) : 1 }));
  }
  // 허브 화면용 — 대시보드 분류 관리 화면의 트리와 동일하게, 자산 보유 여부와 무관하게 조회 권한을 가진
  // 소분류를 전부 대분류별로 묶어서 보여줌(2026-09-30 — 유형 칩 제거하면서 "허브는 순수 카테고리 트리"로 단순화).
  // 대분류만 있고 소분류가 아직 없는 경우(window.DATA.emptyGroups, data.js "비품" 샘플)도 대시보드와 동일하게
  // 그 대분류는 노출하고 "소분류 없음"으로 표시(2026-09-30) — 소분류가 없어 권한 체크 대상 자체가 없으니 숨길 이유가 없음
  function categoryTree() {
    const order = [];
    const map = {};
    window.DATA.categories.forEach(c => {
      if (!catViewPermission(c)) return;
      if (!map[c.group]) { map[c.group] = []; order.push(c.group); }
      map[c.group].push(c.sub);
    });
    (window.DATA.emptyGroups || []).forEach(group => {
      if (!map[group]) { map[group] = []; order.push(group); }
    });
    return order.map(group => ({ group, subs: map[group] }));
  }
  function countForSub(sub) { return assets.filter(a => a.sub === sub && hasViewPermission(a)).length; }

  const THUMB_EMPTY = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-4 4 3 4-4 5 4"/></svg>`;
  function cardThumb(a) {
    const photos = window.assetPhotos(a);
    if (photos.length) return `<span class="mapp-thumb" style="background:${photos[a._primary || 0].color}"></span>`;
    return `<span class="mapp-thumb empty">${THUMB_EMPTY}</span>`;
  }
  // 이번 러프 스코프엔 자산 상세·사진 뷰어가 없어 썸네일은 클릭 동작 없이 그냥 보여주기만 함(app.js의
  // cardThumbBtn과 달리 버튼이 아님)
  function assetCardHtml(x) {
    const a = x.asset;
    if (a.type === "individual") {
      return `
        <div class="mapp-card" data-asset-card data-asset-id="${a.id}">
          ${cardThumb(a)}
          <div class="mapp-card-body">
            <div class="mapp-card-title">${a.product}</div>
            <div class="mapp-card-sub">${a.assetNo || "—"}</div>
          </div>
          <span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>
        </div>`;
    }
    return `
      <div class="mapp-card" data-asset-card data-asset-id="${a.id}">
        ${cardThumb(a)}
        <div class="mapp-card-body">
          <div class="mapp-card-title">${a.product}</div>
        </div>
        <span class="badge stock">${x.qty}개</span>
      </div>`;
  }

  const MENU_ICON_ASSET = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="m21 16-5-5-9 8"/></svg>`;
  const CHEV_DOWN = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>`;
  const PHOTO_COLORS = ["#5b8def", "#8f6ef0", "#eb7f8b", "#3fb37f", "#e0a63c", "#4dabf7"];

  function addFabHtml() {
    return hasAssetManagePermission()
      ? '<button type="button" class="mapp-asset-add-fab" data-asset-add-open aria-label="자산 추가">+</button>' : "";
  }
  function emptyAddDraft(category) {
    return {
      category: category ? `${category.group}|${category.sub}` : "", product: "", assetNo: "", totalQty: "",
      photos: [], primaryPhoto: 0, expiry: "", expiryTouched: false, labels: [], serial: "", imei: "", manufactured: "",
      purchaseDate: "", purchasePrice: "", note: "",
    };
  }
  function hasAddInput(draft) {
    // 분류 선택·지워진 값·단순 태그 검색어는 이탈 확인에서 제외한다.
    return ["product", "assetNo", "totalQty", "expiry", "serial", "imei", "manufactured", "purchaseDate", "purchasePrice", "note"]
      .some(key => String(draft[key] || "").trim()) || draft.photos.length > 0 || draft.labels.length > 0;
  }
  function confirmAddExit(onLeave) {
    const cb = document.createElement("div");
    cb.className = "modal-back";
    cb.style.zIndex = 340;
    cb.innerHTML = `<div class="modal sm" style="width:340px" role="dialog" aria-modal="true" aria-label="작성을 중단하시겠습니까?">
      <h3>작성을 중단하시겠습니까?</h3>
      <div class="body" style="font-size:14px">지금까지 작성한 내용은 저장되지 않습니다.</div>
      <div class="foot"><button type="button" class="btn" data-add-stay>취소</button><button type="button" class="btn primary" data-add-leave>확인</button></div></div>`;
    document.body.appendChild(cb);
    cb.querySelector("[data-add-stay]").onclick = () => cb.remove();
    cb.querySelector("[data-add-leave]").onclick = () => { cb.remove(); onLeave(); };
    cb.onclick = event => { if (event.target === cb) cb.remove(); };
  }
  function addCategory(draft) {
    const [group, sub] = (draft.category || "").split("|");
    return window.DATA.categories.find(c => c.group === group && c.sub === sub) || null;
  }
  // 대시보드 wireDateField와 동일: 숫자 8자리 마스킹, 실제 날짜 확인, 빈 값·미래 날짜 허용.
  function formatAddExpiry(value) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    return digits.length > 6 ? `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`
      : digits.length > 4 ? `${digits.slice(0, 4)}.${digits.slice(4)}` : digits;
  }
  function parseAddExpiry(value) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (!digits.length) return "";
    if (digits.length !== 8) return null;
    const y = +digits.slice(0, 4), m = +digits.slice(4, 6), day = +digits.slice(6, 8);
    const date = new Date(y, m - 1, day);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== day) return null;
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  }
  function addExpiryFieldHtml(draft) {
    const showError = draft.expiryTouched && parseAddExpiry(draft.expiry) === null;
    return `<div class="mapp-add-field"><label for="mapp-add-expiry">유효기한</label>
      <input id="mapp-add-expiry" data-add-field="expiry" type="text" inputmode="numeric" maxlength="10" placeholder="입력" value="${esc(draft.expiry)}" class="${showError ? "has-err" : ""}" aria-describedby="mapp-add-expiry-hint mapp-add-expiry-error" aria-invalid="${!!showError}">
      <p id="mapp-add-expiry-hint" class="hint mapp-add-expiry-hint">*8자리 입력 (YYYY.MM.DD)</p>
      <p id="mapp-add-expiry-error" class="field-err" data-add-expiry-error${showError ? "" : " hidden"}>유효한 날짜가 아닙니다.</p></div>`;
  }
  function addDraftValid(draft) {
    const cat = addCategory(draft);
    if (!cat || !catViewPermission(cat) || !draft.product.trim()) return false;
    if (!(cat.hiddenFields || []).includes("expiry") && parseAddExpiry(draft.expiry) === null) return false;
    if (cat.type === "quantity") return /^[1-9][0-9]*$/.test(draft.totalQty);
    const assetNo = draft.assetNo.trim();
    return !!assetNo && !assets.some(a => a.assetNo === assetNo);
  }
  function addInputHtml(label, key, draft, options) {
    const opts = options || {};
    return `<div class="mapp-add-field"><label for="mapp-add-${key}">${label}${opts.required ? ' <span class="req">*</span>' : ""}</label>
      ${opts.textarea
        ? `<textarea id="mapp-add-${key}" data-add-field="${key}" maxlength="${opts.maxlength || 500}" placeholder="입력">${esc(draft[key])}</textarea>`
        : `<input id="mapp-add-${key}" data-add-field="${key}" type="${opts.type || "text"}"${opts.inputmode ? ` inputmode="${opts.inputmode}"` : ""}${opts.maxlength ? ` maxlength="${opts.maxlength}"` : ""}${opts.list ? ` list="${opts.list}"` : ""} value="${esc(draft[key])}" placeholder="입력">`}
      ${opts.error ? `<p class="field-err" data-add-error hidden>${opts.error}</p>` : ""}</div>`;
  }
  function addProductFieldHtml(draft) {
    return `<div class="mapp-add-field"><label for="mapp-add-product">품목명 <span class="req">*</span></label>
      <div class="mapp-add-input-wrap"><input id="mapp-add-product" data-add-field="product" type="text" maxlength="50" value="${esc(draft.product)}" placeholder="입력" autocomplete="off">
        <div class="mapp-add-suggest" data-add-product-menu hidden></div></div></div>`;
  }
  function addDateSelectHtml(label, key, draft, mode) {
    const value = draft[key];
    const shown = value ? (mode === "month" ? value.replace("-", ".") : window.fmtDate(value)) : "선택";
    return `<div class="mapp-add-field"><label>${label}</label><button type="button" class="mapp-add-date${value ? " selected" : ""}" data-add-date="${key}" data-add-date-mode="${mode}"><span>${shown}</span>${CAL_ICON}</button></div>`;
  }
  function addTagChipsHtml(labels) {
    return labels.map(tag => {
      const color = tagColor(tag);
      return `<span class="tag-chip" style="background:${color.bg};border-color:${color.fg};color:${color.fg}">${esc(tag)}<button type="button" data-add-tag-remove="${esc(tag)}" aria-label="${esc(tag)} 태그 제거" style="color:${color.fg}">${CLOSE_ICON_SM}</button></span>`;
    }).join("");
  }
  function assetAddTagManageScreenHtml(draft) {
    return `<div class="mapp-add-category-popup"><div class="mapp-topbar mapp-add-category-head"><span class="mapp-topbar-title">태그 관리</span><button type="button" class="mapp-add-category-close" data-add-tag-manage-close aria-label="닫기">×</button></div>
      <div class="mapp-add-tag-manage-body"><div class="mapp-add-tag-create"><input type="text" data-add-tag-create placeholder="입력" maxlength="20"><button type="button" class="btn primary" data-add-tag-create-btn>+ 추가</button></div><p class="field-err" data-add-tag-create-error hidden>동일한 명칭이 존재합니다.</p>
        <div class="mapp-add-tag-manage-list" data-add-tag-manage-list>${draft.map((tag, index) => `<div class="mapp-add-tag-manage-row"><div class="tag-manage-name-field"><input type="text" value="${esc(tag.name)}" maxlength="20" data-add-tag-rename="${index}" aria-describedby="mapp-tag-name-required-${index}"><p class="field-err" id="mapp-tag-name-required-${index}" data-add-tag-required="${index}" hidden>명칭은 필수로 입력해야 합니다.</p></div><button type="button" data-add-tag-delete="${index}" aria-label="태그 삭제">×</button></div>`).join("")}</div>
        ${draft.length ? "" : '<p class="mapp-empty">등록된 태그가 없습니다.</p>'}<p class="field-err" data-add-tag-list-error hidden>동일한 명칭이 존재합니다.</p></div>
      <div class="mapp-add-foot"><button type="button" class="btn primary" data-add-tag-manage-save disabled>저장</button></div></div>`;
  }
  function assetAddScreenHtml(draft) {
    const cat = addCategory(draft);
    const hidden = cat ? (cat.hiddenFields || []) : [];
    const categoryLabel = cat ? `${cat.group} › ${cat.sub}` : "선택";
    const photoTiles = draft.photos.map((color, i) => `<div class="mapp-add-photo-tile${i === draft.primaryPhoto ? " primary" : ""}" style="background:${color}">
      <button type="button" data-add-photo-primary="${i}" aria-label="사진 ${i + 1}${i === draft.primaryPhoto ? " 대표" : ""}">${i === draft.primaryPhoto ? "★" : ""}</button>
      <button type="button" class="mapp-add-photo-delete" data-add-photo-delete="${i}" aria-label="사진 삭제">×</button>
    </div>`).join("");
    return `
      <div class="mapp-topbar mapp-add-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        <span class="mapp-topbar-title">자산 추가</span>
      </div>
      <div class="mapp-add-body">
        <div class="mapp-add-field"><label>분류 <span class="req">*</span></label>
          <button type="button" class="mapp-add-select${cat ? " selected" : ""}" data-add-category>${esc(categoryLabel)}<span>›</span></button>
        </div>
        ${addProductFieldHtml(draft)}
        ${cat ? `
          <div class="mapp-add-field"><label>사진</label><div class="mapp-add-photos">${photoTiles}${draft.photos.length < 10 ? '<button type="button" class="mapp-add-photo-plus" data-add-photo aria-label="사진 추가">+</button>' : ""}</div></div>
          ${cat.type === "individual" ? addInputHtml("고유관리번호", "assetNo", draft, { required: true, maxlength: 30, error: "동일한 고유관리번호가 존재합니다." }) : addInputHtml("총 수량", "totalQty", draft, { required: true, inputmode: "numeric", maxlength: 6 })}
          ${!hidden.includes("expiry") ? addExpiryFieldHtml(draft) : ""}
          <div class="mapp-add-field"><div class="mapp-add-field-label"><label>태그</label><button type="button" data-add-tag-manage>태그 관리</button></div><p class="hint mapp-add-tag-hint">최대 5개까지 선택할 수 있습니다.</p>
            <div class="mapp-add-tag-picker"><div class="tag-input-wrap"><div class="tag-chips" data-add-tag-chips>${addTagChipsHtml(draft.labels)}</div><input type="text" data-add-tag-search placeholder="${draft.labels.length ? "" : "검색"}" autocomplete="off"${draft.labels.length >= 5 ? " disabled" : ""}></div><div class="mapp-add-suggest" data-add-tag-menu hidden></div></div></div>
          ${cat.type === "individual" && !hidden.includes("serial") ? addInputHtml("S/N", "serial", draft, { maxlength: 40 }) : ""}
          ${cat.type === "individual" && !hidden.includes("imei") ? addInputHtml("IMEI", "imei", draft, { maxlength: 40 }) : ""}
          ${!hidden.includes("manufactured") ? addDateSelectHtml("제조연월", "manufactured", draft, "month") : ""}
          ${!hidden.includes("purchaseDate") ? addDateSelectHtml("구매연월", "purchaseDate", draft, "month") : ""}
          ${!hidden.includes("purchasePrice") ? addInputHtml("구매가격", "purchasePrice", draft, { inputmode: "numeric", maxlength: 15 }) : ""}
          ${addInputHtml("메모", "note", draft, { textarea: true, maxlength: 500 })}` : ""}
      </div>
      <div class="mapp-add-foot"><button type="button" class="btn primary" data-add-save${addDraftValid(draft) ? "" : " disabled"}>저장</button></div>`;
  }
  function assetAddCategoryScreenHtml() {
    // 자산 관리 권한은 분류·자산 CRUD 범위를 부여하므로 대시보드 등록 화면처럼 전체 소분류를 선택지로 제공한다.
    const categories = window.DATA.categories.filter(catViewPermission);
    const groups = [];
    categories.forEach(cat => {
      let group = groups.find(g => g.name === cat.group);
      if (!group) { group = { name: cat.group, items: [] }; groups.push(group); }
      group.items.push(cat);
    });
    return `
      <div class="mapp-add-category-popup">
      <div class="mapp-topbar mapp-add-category-head">
        <span class="mapp-topbar-title">분류</span>
        <button type="button" class="mapp-add-category-close" data-add-category-close aria-label="닫기">×</button>
      </div>
      <div class="mapp-add-category-body">
        <div data-add-category-list>${groups.map(group => `<section class="mapp-add-category-group" data-add-category-group>
          <h2>${esc(group.name)}</h2>${group.items.map(cat => `<button type="button" data-add-category-pick="${esc(`${cat.group}|${cat.sub}`)}"><span>${esc(cat.sub)}</span></button>`).join("")}
        </section>`).join("")}</div>
      </div>
      </div>`;
  }

  // 메뉴 화면 — 실 앱 스크린샷 참고(직원모드와 달리 "비용" 섹션 없음, 맨 위에 "승인" 섹션 추가, 관리
  // 섹션 맨 하단에 직원모드와 동일하게 "자산" 추가). 하단 "Powered by shopl"도 참고 이미지 그대로 재현
  function menuScreenHtml() {
    return `
      <div class="mapp-menu-head">
        <span class="mapp-brand">shopl <b>샤플앤컴퍼니</b></span>
        <span class="mapp-gear">⚙</span>
      </div>
      <div class="mapp-body mapp-menu-body">
        <div class="mapp-menu-cap">승인</div>
        <div class="mapp-menu-row"><span class="mapp-menu-ic">📋</span>승인<span class="mapp-dot-badge"></span></div>
        <div class="mapp-menu-cap">관리</div>
        <div class="mapp-menu-row">
          <span class="mapp-menu-ic">👤</span>구성원<span class="mapp-menu-chev">⌄</span>
        </div>
        <div class="mapp-menu-row">
          <span class="mapp-menu-ic">📍</span>근무지<span class="mapp-menu-chev">⌄</span>
        </div>
        <div class="mapp-menu-row"><span class="mapp-menu-ic">👥</span>그룹</div>
        <div class="mapp-menu-row" data-mapp-goto="assets"><span class="mapp-menu-ic">${MENU_ICON_ASSET}</span>자산</div>
        <div class="mapp-menu-cap">설정 및 결제</div>
        <div class="mapp-menu-row">
          <span class="mapp-menu-ic">⚙</span>회사 설정<span class="mapp-menu-chev">⌄</span>
        </div>
        <div class="mapp-menu-row"><span class="mapp-menu-ic">🔌</span>요금제 및 기능</div>
        <div class="mapp-menu-divider"></div>
        <div class="mapp-menu-row muted"><span class="mapp-menu-ic">🎧</span>고객 센터</div>
        <div class="mapp-menu-footer">Powered by <b>shopl</b></div>
      </div>`;
  }

  // 하단 탭바 — 직원모드는 "업무"지만 리더모드는 "승인"(빨간 점 뱃지 포함). 이번 스코프는 "메뉴"만 실제로
  // 동작하고 "홈"·"승인"은 자리만(클릭해도 아무 동작 없음)
  function tabBarHtml(active) {
    const items = [
      { key: "home", ic: "⌂", label: "홈" },
      { key: "approval", ic: "☑", label: "승인", dot: true },
      { key: "menu", ic: "☰", label: "메뉴" },
    ];
    return `<div class="mapp-tabbar">${items.map(t =>
      `<button type="button" class="mapp-tab${t.key === active ? " active" : ""}" data-mapp-tab="${t.key}">
        <span class="mapp-tab-ic">${t.ic}${t.dot ? '<span class="mapp-dot-badge"></span>' : ""}</span>${t.label}
      </button>`
    ).join("")}</div>`;
  }

  // 자산 화면(허브) — 대시보드 분류 관리 화면의 트리처럼 조회 권한 가진 대분류·소분류를 전부 보여주기만
  // 하고, 소분류를 눌러야 실제 목록(소분류 상세 화면)으로 드릴다운(2026-09-30 — 유형 칩까지 없애고 순수
  // 카테고리 탐색 화면으로 단순화. 카드가 보이는 곳은 소분류 상세 화면 하나뿐이라는 규칙은 그대로)
  function assetsScreenHtml() {
    const groups = categoryTree();
    return `
      <div class="mapp-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        <span class="mapp-topbar-title">자산</span>
      </div>
      <div class="mapp-body">
        ${groups.length ? groups.map(g => `
          <button type="button" class="mapp-menu-cap mapp-tree-group-head" data-tree-collapse aria-expanded="true" aria-label="접기/펼치기">
            <span>${g.group}</span>${CHEV_DOWN}
          </button>
          <div class="mapp-ws-cat-tree" data-tree-collapsible>${g.subs.length ? g.subs.map(sub => `
            <button type="button" class="mapp-ws-cat-row" data-sub-open data-sub="${sub}">
              <span>${sub}</span>
              <span class="mapp-ws-cat-count">${countForSub(sub)}<span class="mapp-menu-chev">›</span></span>
            </button>`).join("") : `<p class="mapp-ws-empty">소분류 없음</p>`}</div>`).join("")
          : `<p class="mapp-ws-empty">조회 가능한 자산이 없습니다.</p>`}
      </div>
      ${addFabHtml()}`;
  }
  // 소분류 상세 화면 — 카드가 실제로 보이는 유일한 화면. 소분류가 정해지면 자산 유형도 자동으로 정해지므로
  // (한 소분류는 개별형·수량형 중 하나만) 그 유형에 맞는 상태 칩을 단일 선택으로 노출. 전체가 기본 선택이고,
  // 선택한 칩을 다시 눌러도 유지되며 전체를 누르면 모든 상태를 보여줌(2026-09-30).
  // 팝업 필터와 상태 칩은 동시에 적용하지 않고 마지막으로 적용한 방식으로 교체.
  const INDIV_STATUS_CHIPS = [["all", "전체"], ["stock", "재고"], ["assigned", "배정 중"], ["lost", "분실"], ["repair", "수리 중"]];
  const QTY_STATUS_CHIPS = [["all", "전체"], ["stock", "재고"], ["held", "보유 중"], ["depleted", "소진"], ["unheld", "미보유대상"]];
  // 대시보드 통계 카드의 "?" 도움말 툴팁과 동일 문구(assets.js statHelp) — 소진·미보유대상은 라벨만으론
  // 뜻이 안 잡히는 파생 개념이라, 앱에선 툴팁 대신 필터 적용 시 그 아래 항상 문구로 노출(2026-09-30)
  const STATUS_HELP = {
    depleted: "전체 수량을 모두 배분해 남은 잔여 수량이 없는 품목의 수입니다.",
    unheld: "보유 수량이 0개인 보유 대상의 수입니다.",
  };
  function matchesStatus(a, type, statusFilter) {
    if (statusFilter === "all") return true;
    if (type === "individual") return a.status === statusFilter;
    if (statusFilter === "stock" || statusFilter === "held") return a.status === statusFilter;
    if (statusFilter === "depleted") return isDepleted(a);
    if (statusFilter === "unheld") return hasUnheldHolder(a);
    return true;
  }
  function subDetailScreenHtml(sub, statusFilter, popupFilters) {
    const cat = window.DATA.categories.find(c => c.sub === sub) || {};
    const type = cat.type || "individual";
    const searchPlaceholder = type === "quantity" ? "품목명" : "품목명/고유관리번호";
    const statusChips = type === "individual" ? INDIV_STATUS_CHIPS : QTY_STATUS_CHIPS;
    // 소분류 자체가 빈 경우와 상태 필터 결과만 빈 경우를 구분(대시보드와 동일 문구).
    const subItems = collectLeaderItems().filter(x => x.asset.sub === sub);
    const filterGroups = MappAssetFilter.config(cat, "leader");
    const popupActive = MappAssetFilter.count(popupFilters) > 0;
    const items = sortItems(subItems.filter(x => popupActive
      ? MappAssetFilter.matches(x.asset, popupFilters) : matchesStatus(x.asset, type, statusFilter)));
    const emptyMsg = subItems.length ? "결과가 없습니다." : "등록된 자산이 없습니다.";
    return `
      <div class="mapp-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        ${MappAssetFilter.buttonHtml(popupFilters)}
      </div>
      <div class="mapp-subdetail-head">
        <h1 class="mapp-subdetail-title">${cat.group || ""} <span class="mapp-cat-sep">›</span> ${sub}</h1>
      </div>
      <div class="mapp-body">
        ${subItems.length ? `<div class="mapp-chip-row">${statusChips.map(([k, l]) =>
          `<button type="button" class="mapp-chip${k === statusFilter ? " active" : ""}" data-status-chip="${k}" aria-pressed="${k === statusFilter}">${l}</button>`).join("")}</div>` : ""}
        ${subItems.length && STATUS_HELP[statusFilter] ? `<p class="hint">${STATUS_HELP[statusFilter]}</p>` : ""}
        <div class="mapp-search">
          <input type="text" data-mapp-search placeholder="${searchPlaceholder}">
        </div>
        ${MappAssetFilter.appliedHtml(popupFilters, filterGroups)}
        <div class="mapp-count">전체 <b data-leader-result-count>${items.length}</b></div>
        ${items.length ? `<div class="mapp-card-list">${items.map(x => assetCardHtml(x)).join("")}</div><p class="mapp-ws-empty" data-mapp-empty hidden>결과가 없습니다.</p>` : `<p class="mapp-ws-empty" data-mapp-empty>${emptyMsg}</p>`}
      </div>
      ${addFabHtml()}`;
  }

  function render() {
    const root = document.getElementById("app");
    const state = { screen: "menu", sub: null, statusFilter: "all", popupFilters: MappAssetFilter.empty(), subSearch: "", addDraft: null, addOrigin: null, tagManageDraft: null };

    function draw() {
      const showTabBar = state.screen === "menu";
      const screenHtml = state.screen === "menu" ? menuScreenHtml()
        : state.screen === "sub-detail" ? subDetailScreenHtml(state.sub, state.statusFilter, state.popupFilters)
        : state.screen === "asset-add" ? assetAddScreenHtml(state.addDraft)
        : state.screen === "asset-add-category" ? assetAddCategoryScreenHtml()
        : state.screen === "asset-add-tags" ? assetAddTagManageScreenHtml(state.tagManageDraft)
        : assetsScreenHtml();
      root.innerHTML = `
        <div class="mapp-stage">
          <div class="mapp-phone">
            <div class="mapp-statusbar"><span>9:41</span><span class="mapp-statusbar-icons">•••</span></div>
            <div class="mapp-screen">${screenHtml}</div>
            ${showTabBar ? tabBarHtml("menu") : ""}
          </div>
        </div>`;

      const back = root.querySelector("[data-mapp-back]");
      if (back) back.onclick = () => {
        // 소분류 상세 → 자산 허브, 그 외엔 메뉴로 복귀
        if (state.screen === "asset-add-category") state.screen = "asset-add";
        else if (state.screen === "asset-add") {
          const leave = () => { state.screen = state.addOrigin; state.addDraft = null; state.addOrigin = null; draw(); };
          if (hasAddInput(state.addDraft)) confirmAddExit(leave);
          else leave();
          return;
        }
        else if (state.screen === "sub-detail") { state.screen = "assets"; state.sub = null; state.statusFilter = "all"; state.popupFilters = MappAssetFilter.empty(); state.subSearch = ""; }
        else { state.screen = "menu"; }
        draw();
      };
      const gotoAssets = root.querySelector('[data-mapp-goto="assets"]');
      if (gotoAssets) gotoAssets.onclick = () => { state.screen = "assets"; draw(); };
      root.querySelectorAll("[data-mapp-tab]").forEach(b => b.onclick = () => {
        // "홈"·"승인" 탭은 이번 러프 스코프 밖이라 동작 없음(메뉴만 실제 이동)
        if (b.dataset.mappTab === "menu") { state.screen = "menu"; draw(); }
      });
      // 소분류 행 탭 → 소분류 상세(드릴다운)로 진입, 매번 전체를 기본 선택
      root.querySelectorAll("[data-sub-open]").forEach(b => b.onclick = () => {
        state.screen = "sub-detail";
        state.sub = b.dataset.sub;
        state.statusFilter = "all";
        state.popupFilters = MappAssetFilter.empty();
        state.subSearch = "";
        draw();
      });
      // 자산 추가 FAB — manage_permission_type 기반 자산 관리 권한 보유자에게만 렌더. 허브는 미선택,
      // 소분류 상세는 현재 분류를 미리 선택해 같은 추가 페이지로 진입한다.
      root.querySelectorAll("[data-asset-add-open]").forEach(b => b.onclick = () => {
        if (!hasAssetManagePermission()) return;
        const currentCategory = state.screen === "sub-detail"
          ? window.DATA.categories.find(c => c.sub === state.sub) || null : null;
        state.addOrigin = state.screen;
        state.addDraft = emptyAddDraft(currentCategory);
        state.screen = "asset-add";
        draw();
      });
      // 대분류 접기/펼치기 — 기본 펼침(app.js의 내 자산 대분류 섹션과 동일한 패턴), DOM만 직접 토글하고 재렌더 안 함
      root.querySelectorAll("[data-tree-collapse]").forEach(b => b.onclick = () => {
        const body = b.nextElementSibling;
        const expanded = b.getAttribute("aria-expanded") === "true";
        b.setAttribute("aria-expanded", String(!expanded));
        body.hidden = expanded;
        b.classList.toggle("collapsed", expanded);
      });
      // 상태 칩을 선택하면 팝업 조건을 모두 해제. 팝업 적용 중에는 전체 칩도 비선택.
      root.querySelectorAll("[data-status-chip]").forEach(b => b.onclick = () => {
        state.popupFilters = MappAssetFilter.empty();
        state.statusFilter = b.dataset.statusChip;
        draw();
      });
      function applyPopup(filters) {
        state.popupFilters = filters;
        state.statusFilter = MappAssetFilter.count(filters) ? null : "all";
        draw();
      }
      MappAssetFilter.wireApplied(root, state.popupFilters, applyPopup);
      const filterBtn = root.querySelector("[data-mapp-filter-open]");
      if (filterBtn) filterBtn.onclick = () => MappAssetFilter.open({
        category: window.DATA.categories.find(c => c.sub === state.sub) || {},
        mode: "leader", filters: state.popupFilters, onApply: applyPopup,
      });
      // 검색은 현재 상태 칩 또는 팝업 필터 결과 안에서 추가로 적용. 자산 유형에 따라 실제 품목명과
      // 개별형 고유관리번호만 비교해 상태·수량 텍스트가 우연히 검색되는 일을 막는다.
      const searchInput = root.querySelector("[data-mapp-search]");
      if (searchInput) {
        const cards = [...root.querySelectorAll("[data-asset-card]")];
        const emptyMsg = root.querySelector("[data-mapp-empty]");
        searchInput.value = state.subSearch;
        const applySearch = () => {
          state.subSearch = searchInput.value;
          const q = state.subSearch.trim().toLowerCase();
          cards.forEach(card => {
            const asset = assets.find(a => a.id === card.dataset.assetId);
            const hay = asset ? `${asset.product}${asset.type === "individual" ? asset.assetNo || "" : ""}`.toLowerCase() : "";
            card.hidden = !(!q || hay.includes(q));
          });
          const visibleCount = cards.filter(card => !card.hidden).length;
          const count = root.querySelector("[data-leader-result-count]");
          if (count) count.textContent = visibleCount;
          if (emptyMsg && cards.length) emptyMsg.hidden = visibleCount > 0;
        };
        searchInput.addEventListener("input", applySearch);
        applySearch();
      }
      if (state.screen === "asset-add") {
        const draft = state.addDraft;
        const field = key => root.querySelector(`[data-add-field="${key}"]`);
        function syncAddDraft() {
          ["product", "assetNo", "totalQty", "expiry", "serial", "imei", "manufactured", "purchaseDate", "purchasePrice", "note"].forEach(key => {
            const input = field(key);
            if (input) draft[key] = input.value;
          });
        }
        function updateAddValidity() {
          syncAddDraft();
          const cat = addCategory(draft);
          const duplicate = cat && cat.type === "individual" && !!draft.assetNo.trim() && assets.some(a => a.assetNo === draft.assetNo.trim());
          const error = root.querySelector("[data-add-error]");
          if (error) error.hidden = !duplicate;
          const assetNoInput = field("assetNo");
          if (assetNoInput) assetNoInput.classList.toggle("has-err", duplicate);
          const expiryInput = field("expiry");
          if (expiryInput) {
            const showError = draft.expiryTouched && parseAddExpiry(draft.expiry) === null;
            root.querySelector("[data-add-expiry-error]").hidden = !showError;
            expiryInput.classList.toggle("has-err", showError);
            expiryInput.setAttribute("aria-invalid", String(!!showError));
          }
          const save = root.querySelector("[data-add-save]");
          if (save) save.disabled = !addDraftValid(draft);
        }
        root.querySelector("[data-add-category]").onclick = () => { syncAddDraft(); state.screen = "asset-add-category"; draw(); };
        root.querySelectorAll("[data-add-field]").forEach(input => input.addEventListener("input", () => {
          if (input.dataset.addField === "assetNo") {
            const pos = input.selectionStart;
            const before = input.value;
            input.value = before.replace(/[^A-Za-z0-9\-_]/g, "");
            if (input.value !== before && pos != null) input.setSelectionRange(Math.max(0, pos - 1), Math.max(0, pos - 1));
          }
          if (input.dataset.addField === "expiry") input.value = formatAddExpiry(input.value);
          if (input.dataset.addField === "totalQty") input.value = input.value.replace(/[^0-9]/g, "");
          if (input.dataset.addField === "purchasePrice") {
            // 콤마는 표시용이며 숫자는 기존처럼 최대 12자리. 중간 편집 시 커서도 입력 위치를 유지한다.
            const position = input.selectionStart;
            const digitsBefore = input.value.slice(0, position).replace(/[^0-9]/g, "").length;
            input.value = formatAddPrice(input.value);
            if (position != null) {
              let cursor = 0, digitsSeen = 0;
              while (cursor < input.value.length && digitsSeen < digitsBefore) {
                if (/[0-9]/.test(input.value[cursor])) digitsSeen++;
                cursor++;
              }
              input.setSelectionRange(cursor, cursor);
            }
          }
          updateAddValidity();
        }));
        const expiryInput = field("expiry");
        if (expiryInput) expiryInput.addEventListener("blur", () => { draft.expiryTouched = true; updateAddValidity(); });
        // 품목명은 새 값 직접 입력을 허용하면서, 같은 분류의 기존 품목만 필드 아래 자체 메뉴로 제안한다.
        const productInput = field("product");
        const productMenu = root.querySelector("[data-add-product-menu]");
        const currentCat = addCategory(draft);
        const productNames = currentCat ? [...new Set(assets.filter(asset => asset.group === currentCat.group && asset.sub === currentCat.sub).map(asset => asset.product).filter(Boolean))] : [];
        function renderProductMenu() {
          const query = productInput.value.trim().toLowerCase();
          const options = query ? productNames.filter(name => name.toLowerCase().includes(query)) : productNames;
          productMenu.innerHTML = options.map(name => `<button type="button" data-add-product-pick="${esc(name)}">${esc(name)}</button>`).join("");
          productMenu.hidden = !options.length;
          productMenu.querySelectorAll("[data-add-product-pick]").forEach(button => button.onclick = () => {
            productInput.value = button.dataset.addProductPick;
            draft.product = productInput.value;
            productMenu.hidden = true;
            updateAddValidity();
          });
        }
        productInput.addEventListener("focus", renderProductMenu);
        productInput.addEventListener("input", renderProductMenu);
        productInput.addEventListener("blur", () => setTimeout(() => { productMenu.hidden = true; }, 120));
        // 앱 태그도 대시보드와 같은 검색형 선택을 사용한다. 선택된 값만 칩으로 남고 최대 5개에서 입력을 잠근다.
        const tagSearch = root.querySelector("[data-add-tag-search]");
        const tagMenu = root.querySelector("[data-add-tag-menu]");
        const tagChips = root.querySelector("[data-add-tag-chips]");
        function renderSelectedTags() {
          if (!tagChips || !tagSearch) return;
          tagChips.innerHTML = addTagChipsHtml(draft.labels);
          tagSearch.disabled = draft.labels.length >= 5;
          tagSearch.placeholder = draft.labels.length ? "" : "검색";
          tagChips.querySelectorAll("[data-add-tag-remove]").forEach(button => button.onclick = () => {
            draft.labels = draft.labels.filter(tag => tag !== button.dataset.addTagRemove);
            renderSelectedTags();
            tagMenu.hidden = true;
          });
        }
        function renderTagMenu() {
          if (!tagSearch || draft.labels.length >= 5) { if (tagMenu) tagMenu.hidden = true; return; }
          const query = tagSearch.value.trim().toLowerCase();
          const options = (window.DATA.tags || []).filter(tag => !draft.labels.includes(tag) && (!query || tag.toLowerCase().includes(query)));
          tagMenu.innerHTML = options.length ? options.map(tag => `<button type="button" data-add-tag-pick="${esc(tag)}">${esc(tag)}</button>`).join("") : '<div class="mapp-add-suggest-empty">결과가 없습니다.</div>';
          tagMenu.hidden = false;
          tagMenu.querySelectorAll("[data-add-tag-pick]").forEach(button => button.onclick = () => {
            if (draft.labels.length < 5) draft.labels.push(button.dataset.addTagPick);
            tagSearch.value = "";
            tagMenu.hidden = true;
            renderSelectedTags();
          });
        }
        if (tagSearch) {
          renderSelectedTags();
          tagSearch.addEventListener("focus", renderTagMenu);
          tagSearch.addEventListener("input", renderTagMenu);
          tagSearch.addEventListener("blur", () => setTimeout(() => { tagMenu.hidden = true; }, 120));
        }
        const tagManage = root.querySelector("[data-add-tag-manage]");
        if (tagManage) tagManage.onclick = () => {
          syncAddDraft();
          state.tagManageDraft = (window.DATA.tags || []).map(tag => ({ name: tag, orig: tag }));
          state.screen = "asset-add-tags";
          draw();
        };
        root.querySelectorAll("[data-add-date]").forEach(button => button.onclick = () => {
          syncAddDraft();
          const key = button.dataset.addDate;
          const apply = value => {
            draft[key] = value;
            const shown = value ? (button.dataset.addDateMode === "month" ? value.replace("-", ".") : window.fmtDate(value)) : "선택";
            button.classList.toggle("selected", !!value);
            button.innerHTML = `<span>${shown}</span>${CAL_ICON}`;
          };
          openAddMonthSheet(key === "manufactured" ? "제조연월" : "구매연월", draft[key], apply);
        });
        root.querySelectorAll("[data-add-photo-primary]").forEach(button => button.onclick = () => {
          syncAddDraft(); draft.primaryPhoto = +button.dataset.addPhotoPrimary; draw();
        });
        root.querySelectorAll("[data-add-photo-delete]").forEach(button => button.onclick = () => {
          syncAddDraft();
          const index = +button.dataset.addPhotoDelete;
          draft.photos.splice(index, 1);
          // 대표 삭제 시 현재 사진 목록에서 가장 앞에 남은 사진을 자동 대표로 지정한다.
          if (!draft.photos.length || draft.primaryPhoto === index) draft.primaryPhoto = 0;
          else if (draft.primaryPhoto > index) draft.primaryPhoto -= 1;
          draw();
        });
        const addPhoto = root.querySelector("[data-add-photo]");
        if (addPhoto) addPhoto.onclick = () => {
          syncAddDraft();
          openAddDropdown(addPhoto, [
            { key: "camera", label: "카메라로 촬영하기" },
            { key: "gallery", label: "갤러리에서 불러오기" },
          ], () => { draft.photos.push(PHOTO_COLORS[draft.photos.length % PHOTO_COLORS.length]); draw(); });
        };
        const save = root.querySelector("[data-add-save]");
        if (save) save.onclick = () => {
          updateAddValidity();
          if (!addDraftValid(draft)) return;
          const cat = addCategory(draft);
          const numericIds = assets.map(a => Number(String(a.id).replace(/\D/g, ""))).filter(Number.isFinite);
          const asset = {
            id: `A${String((numericIds.length ? Math.max(...numericIds) : 0) + 1).padStart(3, "0")}`,
            type: cat.type, assetNo: cat.type === "individual" ? draft.assetNo.trim() : "", product: draft.product.trim(),
            group: cat.group, sub: cat.sub, status: "stock", createdAt: "2026-09-04", labels: [...draft.labels],
            assignments: cat.type === "individual" ? [] : undefined, stocks: cat.type === "quantity" ? [] : undefined,
          };
          if (cat.type === "quantity") asset.totalQty = parseInt(draft.totalQty, 10);
          const expiry = parseAddExpiry(draft.expiry);
          if (!(cat.hiddenFields || []).includes("expiry") && expiry) asset.expiry = expiry;
          if (cat.type === "individual" && draft.serial.trim()) asset.serial = draft.serial.trim();
          if (cat.type === "individual" && draft.imei.trim()) asset.imei = draft.imei.trim();
          if (draft.manufactured) asset.manufactured = `${draft.manufactured}-01`;
          if (draft.purchaseDate) asset.purchaseDate = `${draft.purchaseDate}-01`;
          if (draft.purchasePrice) asset.price = Number(draft.purchasePrice.replace(/[^0-9]/g, ""));
          if (draft.note.trim()) asset.note = draft.note.trim();
          if (draft.photos.length) {
            asset._photos = draft.photos.map(color => ({ color, at: "2026-09-04 00:00", by: ME }));
            asset._primary = draft.primaryPhoto;
            asset.photo = draft.photos[draft.primaryPhoto];
            asset.photoCount = draft.photos.length;
          }
          assets.push(asset);
          state.screen = "sub-detail";
          state.sub = cat.sub;
          state.addDraft = null;
          state.addOrigin = null;
          state.statusFilter = "all";
          state.popupFilters = MappAssetFilter.empty();
          state.subSearch = "";
          draw();
          const addedCard = root.querySelector(`[data-asset-id="${asset.id}"]`);
          if (addedCard) {
            addedCard.scrollIntoView({ block: "nearest" });
            addedCard.classList.add("mapp-card-added");
          }
          toast("자산이 추가되었습니다.");
        };
        updateAddValidity();
      }
      if (state.screen === "asset-add-category") {
        root.querySelector("[data-add-category-close]").onclick = () => { state.screen = "asset-add"; draw(); };
        const rows = [...root.querySelectorAll("[data-add-category-pick]")];
        rows.forEach(row => row.onclick = () => {
          const product = state.addDraft.product;
          const category = addCategory({ category: row.dataset.addCategoryPick });
          if (!catViewPermission(category)) return;
          // 현재 분류를 다시 선택하면 입력을 유지하고 팝업만 닫는다(대시보드와 동일).
          if (row.dataset.addCategoryPick !== state.addDraft.category) {
            state.addDraft = emptyAddDraft(category);
            state.addDraft.product = product;
          }
          state.screen = "asset-add";
          draw();
        });
      }
      if (state.screen === "asset-add-tags") {
        const tagDraft = state.tagManageDraft;
        const master = window.DATA.tags || [];
        const list = root.querySelector("[data-add-tag-manage-list]");
        const listError = root.querySelector("[data-add-tag-list-error]");
        const createInput = root.querySelector("[data-add-tag-create]");
        const createButton = root.querySelector("[data-add-tag-create-btn]");
        const createError = root.querySelector("[data-add-tag-create-error]");
        const saveButton = root.querySelector("[data-add-tag-manage-save]");
        function duplicateNames() {
          const counts = {};
          tagDraft.forEach(tag => { const name = normalizeTagName(tag.name); if (name) counts[name] = (counts[name] || 0) + 1; });
          return new Set(Object.keys(counts).filter(name => counts[name] > 1));
        }
        function tagManageDirty() {
          const next = [...new Set(tagDraft.map(tag => normalizeTagName(tag.name)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
          const before = [...master].sort((a, b) => a.localeCompare(b, "ko"));
          return next.length !== before.length || next.some((name, index) => name !== before[index]);
        }
        function updateTagManageValidity() {
          const duplicates = duplicateNames();
          list.querySelectorAll("[data-add-tag-rename]").forEach(input => {
            const name = normalizeTagName(input.value);
            const invalid = !name || duplicates.has(name);
            input.classList.toggle("has-err", invalid);
            input.setAttribute("aria-invalid", String(invalid));
            list.querySelector(`[data-add-tag-required="${input.dataset.addTagRename}"]`).hidden = !!name;
          });
          listError.hidden = !duplicates.size;
          const createName = normalizeTagName(createInput.value);
          const createDuplicate = !!createName && tagDraft.some(tag => normalizeTagName(tag.name) === createName);
          createInput.classList.toggle("has-err", createDuplicate);
          createError.hidden = !createDuplicate;
          createButton.disabled = !createName || createDuplicate;
          saveButton.disabled = !tagManageDirty() || !!duplicates.size || tagDraft.some(tag => !normalizeTagName(tag.name));
        }
        function addManagedTag() {
          const name = normalizeTagName(createInput.value);
          if (!name || tagDraft.some(tag => normalizeTagName(tag.name) === name)) { updateTagManageValidity(); return; }
          tagDraft.unshift({ name, orig: null });
          draw();
        }
        createInput.addEventListener("input", updateTagManageValidity);
        createInput.addEventListener("keydown", event => { if (event.key === "Enter") { event.preventDefault(); addManagedTag(); } });
        createButton.onclick = addManagedTag;
        list.querySelectorAll("[data-add-tag-rename]").forEach(input => input.addEventListener("input", () => {
          tagDraft[+input.dataset.addTagRename].name = input.value;
          updateTagManageValidity();
        }));
        list.querySelectorAll("[data-add-tag-delete]").forEach(button => button.onclick = () => { tagDraft.splice(+button.dataset.addTagDelete, 1); draw(); });
        root.querySelector("[data-add-tag-manage-close]").onclick = () => { state.tagManageDraft = null; state.screen = "asset-add"; draw(); };
        saveButton.onclick = () => {
          updateTagManageValidity();
          if (saveButton.disabled) return;
          const finalNames = [...new Set(tagDraft.map(tag => normalizeTagName(tag.name)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
          const remainingOriginals = new Set(tagDraft.filter(tag => tag.orig).map(tag => tag.orig));
          const deleted = master.filter(tag => !remainingOriginals.has(tag));
          const renamed = tagDraft.filter(tag => tag.orig && tag.orig !== normalizeTagName(tag.name)).map(tag => ({ from: tag.orig, to: normalizeTagName(tag.name) }));
          const updateLabels = labels => (labels || []).filter(label => !deleted.includes(label)).map(label => {
            const rename = renamed.find(item => item.from === label);
            return rename ? rename.to : label;
          }).filter((label, index, all) => finalNames.includes(label) && all.indexOf(label) === index);
          assets.forEach(asset => { asset.labels = updateLabels(asset.labels); });
          state.addDraft.labels = updateLabels(state.addDraft.labels);
          master.length = 0;
          master.push(...finalNames);
          state.tagManageDraft = null;
          state.screen = "asset-add";
          draw();
          toast("저장되었습니다.");
        };
        updateTagManageValidity();
      }
    }
    draw();
  }

  window.LeaderScreen = { render };
})();
