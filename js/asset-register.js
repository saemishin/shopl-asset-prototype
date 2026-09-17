/* 자산 등록 팝업 — 현황/분류 화면 공용(아직 러프한 프로토타입: 저장은 토스트만, 실제 데이터 반영 없음).
   assets.js의 "자산 추가" 버튼과 category.js의 소분류별 빈 자산 목록 [자산 추가] 버튼이 이 하나를 같이 씀. */
(function () {
  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300;box-shadow:0 8px 24px rgba(0,0,0,.25)";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  }
  const CLOSE_ICON_SM = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
  const TRASH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M9.5 7l.7 13a1 1 0 0 0 1 1h5.6a1 1 0 0 0 1-1l.7-13"/></svg>`;
  const TAG_COLORS = [
    { fg: "#3461c9", bg: "#eaf1ff" },
    { fg: "#6b3fd4", bg: "#f1ecff" },
    { fg: "#c23c56", bg: "#fdecef" },
    { fg: "#1f8f5f", bg: "#e8f8f0" },
    { fg: "#b5790a", bg: "#fdf3e0" },
    { fg: "#1f8fae", bg: "#e6f6fa" },
  ];
  function tagColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
    return TAG_COLORS[Math.abs(h) % TAG_COLORS.length];
  }

  // 태그 관리 — 태그는 구조설계안 §5.3상 별도 엔티티 없이 자산의 문자열 리스트지만, 오타·변형이 계속 쌓이기만 하고
  // 정리할 수 없는 문제 때문에 window.DATA.tags를 마스터 목록으로 두고 이 화면에서만 추가/이름변경/삭제를 관리함.
  // 분류 관리 모달과 동일한 draft 편집 모델: 변경은 [저장]을 눌러야 실제 데이터(마스터 목록 + 각 자산의 labels)에 반영됨.
  function openTagManageModal(onSaved) {
    const master = (window.DATA && window.DATA.tags) || [];
    let draft = master.map(t => ({ name: t, orig: t }));

    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal sm">
        <h3>태그 관리</h3>
        <div class="body">
          <div class="tag-manage-add">
            <input type="text" class="cat-manage-input" data-tm-input placeholder="입력" maxlength="20">
            <button type="button" class="btn primary" data-tm-add>+ 추가</button>
          </div>
          <p class="field-err" data-tm-add-err hidden>동일한 명칭이 존재합니다.</p>
          <div class="tag-manage-list" data-tm-list style="margin-top:14px"></div>
          <p class="field-err" data-tm-list-err hidden>동일한 명칭이 존재합니다.</p>
        </div>
        <div class="foot">
          <button type="button" class="btn" data-tm-cancel>취소</button>
          <button type="button" class="btn primary" data-tm-save disabled>저장</button>
        </div>
      </div>`;
    document.body.appendChild(back);

    const listEl = back.querySelector("[data-tm-list]");
    const listErr = back.querySelector("[data-tm-list-err]");
    const addInput = back.querySelector("[data-tm-input]");
    const addBtn = back.querySelector("[data-tm-add]");
    const addErr = back.querySelector("[data-tm-add-err]");
    const saveBtn = back.querySelector("[data-tm-save]");

    // 태그명은 구조설계안상 대소문자 구분이라 중복 판정도 trim 후 대소문자 그대로 정확히 일치할 때만
    function dupNameSet() {
      const counts = {};
      draft.forEach(t => { const n = t.name.trim(); if (n) counts[n] = (counts[n] || 0) + 1; });
      return new Set(Object.keys(counts).filter(n => counts[n] > 1));
    }
    // "변경 있음" 여부는 플래그가 아니라 원본(master)과의 실제 내용 비교로 판정 —
    // 추가했다가 도로 지우는 것처럼 순가감이 상쇄돼 원래 상태로 돌아왔으면 저장 비활성화가 맞음
    function isDirty() {
      const current = [...new Set(draft.map(t => t.name.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
      const orig = [...master].sort((a, b) => a.localeCompare(b, "ko"));
      if (current.length !== orig.length) return true;
      return current.some((v, i) => v !== orig[i]);
    }
    function updateValidity() {
      const dups = dupNameSet();
      listEl.querySelectorAll("[data-tm-rename]").forEach(inp => {
        inp.classList.toggle("has-err", dups.has(inp.value.trim()));
      });
      listErr.hidden = dups.size === 0;
      const addDup = draft.some(t => t.name.trim() === addInput.value.trim());
      addInput.classList.toggle("has-err", !!addInput.value.trim() && addDup);
      addErr.hidden = !(addInput.value.trim() && addDup);
      addBtn.disabled = !!addInput.value.trim() && addDup;
      saveBtn.disabled = !isDirty() || dups.size > 0;
    }
    function renderList() {
      listEl.innerHTML = draft.length ? draft.map((t, i) => `
        <div class="cat-manage-row">
          <input type="text" class="cat-manage-name-input" data-tm-rename="${i}" value="${t.name}" maxlength="20">
          <div class="cat-manage-row-acts">
            <button type="button" class="cat-manage-icon" data-tm-del="${i}" aria-label="삭제"
              data-tip="삭제 시 이 태그를 사용 중인 자산에서 모두 삭제됩니다.">${TRASH_ICON}</button>
          </div>
        </div>`).join("") : `<p class="tag-manage-empty">등록된 태그가 없습니다.</p>`;
      updateValidity();
    }
    renderList();

    function addRow() {
      const name = addInput.value.trim().slice(0, 20);
      if (!name || draft.some(t => t.name.trim() === name)) { addInput.focus(); return; }
      draft.unshift({ name, orig: null });
      addInput.value = "";
      renderList();
    }
    addBtn.onclick = addRow;
    addInput.addEventListener("input", updateValidity);
    addInput.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); addRow(); } });

    listEl.addEventListener("input", e => {
      const r = e.target.closest("[data-tm-rename]");
      if (r) { draft[+r.dataset.tmRename].name = e.target.value; updateValidity(); }
    });
    listEl.addEventListener("click", e => {
      const d = e.target.closest("[data-tm-del]");
      if (d) { draft.splice(+d.dataset.tmDel, 1); renderList(); }
    });

    back.querySelector("[data-tm-cancel]").onclick = () => back.remove();
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });

    saveBtn.onclick = () => {
      if (!isDirty() || dupNameSet().size > 0) return;
      const finalNames = [...new Set(draft.map(t => t.name.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
      const remainingOrigs = new Set(draft.filter(t => t.orig).map(t => t.orig));
      const deletedOrigs = master.filter(t => !remainingOrigs.has(t));
      const renamed = draft
        .filter(t => t.orig && t.orig !== t.name.trim())
        .map(t => ({ from: t.orig, to: t.name.trim() }));

      (window.DATA.assets || []).forEach(a => {
        if (!a.labels || !a.labels.length) return;
        a.labels = a.labels
          .filter(l => !deletedOrigs.includes(l))
          .map(l => { const r = renamed.find(rn => rn.from === l); return r ? r.to : l; });
      });
      master.length = 0;
      master.push(...finalNames);

      back.remove();
      toast("저장되었습니다.");
      if (onSaved) onSaved({ renamed, deletedOrigs });
    };

    return back;
  }

  // 소분류 선택 모달 — 검색 + 대분류/소분류 트리, 단일 선택, 푸터 [취소]/[적용]. 필터 모달의 분류 트리 구조를 단일 선택용으로 단순화.
  function openCategoryPickModal(categories, currentValue, onApply) {
    let selected = currentValue;
    let query = "";

    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal sm">
        <h3>소분류</h3>
        <div class="body">
          <input type="text" class="picker-search" data-cp-search placeholder="검색" autocomplete="off">
          <div class="catpick-list" data-cp-list></div>
        </div>
        <div class="foot">
          <button type="button" class="btn" data-cp-cancel>취소</button>
          <button type="button" class="btn primary" data-cp-apply>적용</button>
        </div>
      </div>`;
    document.body.appendChild(back);

    const listEl = back.querySelector("[data-cp-list]");
    const searchInput = back.querySelector("[data-cp-search]");

    function groupsOf() {
      const m = new Map();
      categories.forEach(c => { if (!m.has(c.group)) m.set(c.group, []); m.get(c.group).push(c.sub); });
      return m;
    }
    function renderList() {
      const q = query.trim().toLowerCase();
      let html = "";
      groupsOf().forEach((subs, g) => {
        const groupMatches = !q || g.toLowerCase().includes(q);
        const filtered = subs.filter(s => groupMatches || s.toLowerCase().includes(q));
        if (!filtered.length) return;
        html += `<div class="catpick-group">
          <div class="catpick-group-name">${g}</div>
          ${filtered.map(s => {
            const v = `${g}|${s}`;
            return `<button type="button" class="catpick-row${selected === v ? " active" : ""}" data-v="${v}">${s}</button>`;
          }).join("")}
        </div>`;
      });
      listEl.innerHTML = html || `<p class="tag-manage-empty">결과가 없습니다.</p>`;
      listEl.querySelectorAll("[data-v]").forEach(b => b.onclick = () => { selected = b.dataset.v; renderList(); });
    }
    renderList();

    searchInput.addEventListener("input", () => { query = searchInput.value; renderList(); });
    back.querySelector("[data-cp-cancel]").onclick = () => back.remove();
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-cp-apply]").onclick = () => { back.remove(); onApply(selected); };

    return back;
  }

  window.openAssetAddModal = function (opts) {
    opts = opts || {};
    const categories = (window.DATA && window.DATA.categories) || [];
    const preselectValue = opts.group && opts.sub ? `${opts.group}|${opts.sub}` : null;
    const findCat = v => { const [g, s] = (v || "").split("|"); return categories.find(c => c.group === g && c.sub === s); };
    let type = (findCat(preselectValue) || {}).type || "individual";

    // 배정일 수정(detail.js)과 동일한 마스킹 정책(YYYY.MM.DD, 8자리 숫자) — 단, 유효기한은 만료일 성격상 미래 날짜도 허용
    const IC_CAL = `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`;
    function dateFieldHtml() {
      return `
        <div class="dfield">
          <input type="text" inputmode="numeric" data-dtext placeholder="YYYY.MM.DD" maxlength="10">
          <span class="dfield-pick">${IC_CAL}<input type="date" data-dnative tabindex="-1"></span>
        </div>`;
    }
    function wireDateField(scope) {
      const text = scope.querySelector("[data-dtext]");
      const native = scope.querySelector("[data-dnative]");
      const digitsOf = v => v.replace(/\D/g, "").slice(0, 8);
      const format = d => d.length > 6 ? `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6)}`
                         : d.length > 4 ? `${d.slice(0, 4)}.${d.slice(4)}` : d;
      text.addEventListener("input", () => { text.value = format(digitsOf(text.value)); });
      native.addEventListener("change", () => { if (native.value) text.value = native.value.replace(/-/g, "."); });
    }

    const tags = [];

    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal">
        <h3>자산 추가</h3>
        <div class="body">
          <div class="field"><label>소분류 <span class="req">*</span></label>
            <div class="tag-input-wrap" id="areg-catwrap" style="cursor:pointer">
              <span id="areg-cat-display" style="flex:1;font-size:12.5px">선택</span>
            </div>
          </div>
          <div class="field" id="areg-name-field"><label>제품명 <span class="req">*</span></label><input type="text" id="areg-name" placeholder="입력" maxlength="50" autocomplete="off"></div>
          <div class="field" id="areg-assetno"><label>고유관리번호 <span class="req">*</span></label><input type="text" id="areg-assetno-input" placeholder="입력" maxlength="30">
            <p class="field-err" data-assetno-err hidden>동일한 명칭이 존재합니다.</p>
          </div>
          <div class="field" id="areg-expiry-field"><label>유효기한</label>${dateFieldHtml()}</div>
          <div class="field">
            <div class="field-label-row">
              <label>태그</label>
              <button type="button" class="btn sm" id="areg-tag-manage">태그 관리</button>
            </div>
            <div class="tag-input-wrap" id="areg-tagwrap">
              <div class="tag-chips" data-chips></div>
              <input type="text" data-taginput placeholder="검색" autocomplete="off">
            </div>
          </div>
        </div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" data-close id="areg-save" disabled>저장</button>
        </div>
      </div>`;
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelectorAll("[data-close]").forEach(b => b.onclick = () => { if (!b.disabled) back.remove(); });
    document.body.appendChild(back);
    wireDateField(back.querySelector(".dfield"));

    const nameField = back.querySelector("#areg-name-field");
    const nameInput = back.querySelector("#areg-name");
    const assetNoField = back.querySelector("#areg-assetno");
    const assetNoInput = back.querySelector("#areg-assetno-input");
    const assetNoErr = back.querySelector("[data-assetno-err]");
    const expiryField = back.querySelector("#areg-expiry-field");
    const dtext = back.querySelector("[data-dtext]");
    const dnative = back.querySelector("[data-dnative]");
    const saveBtn = back.querySelector("#areg-save");

    // 고유관리번호는 QR 라벨 파일명의 식별키로 그대로 쓰여서, 파일명에 부적합한 문자가 섞이지 않도록 영문·숫자·하이픈·언더스코어만 허용
    function assetNoDup(v) {
      if (!v) return false;
      return (window.DATA.assets || []).some(a => a.assetNo && a.assetNo === v);
    }
    function checkValid() {
      const nameOk = nameInput.value.trim().length > 0;
      const noVal = assetNoInput.value.trim();
      const dup = type !== "quantity" && assetNoDup(noVal);
      assetNoErr.hidden = !dup;
      assetNoInput.classList.toggle("has-err", dup);
      const noOk = type === "quantity" ? true : (noVal.length > 0 && !dup);
      saveBtn.disabled = !(catValue && nameOk && noOk);
    }
    // 제품명 자동완성 — "소분류+제품명" 조합이 제품 단위라, 같은 소분류에 이미 등록된 제품명을 제안해서
    // 띄어쓰기·표기 차이로 같은 제품이 여러 이름으로 쪼개지는 걸 막음. 태그와 달리 목록에 없는 새 이름도 항상 입력 가능(강제 선택 아님)
    let prodMenu = null, prodHi = -1;
    function closeProdMenu() { if (prodMenu) { prodMenu.remove(); prodMenu = null; } prodHi = -1; }
    function productOptions() {
      if (!catValue) return [];
      const cat = findCat(catValue);
      if (!cat) return [];
      const q = nameInput.value.trim().toLowerCase();
      const names = [...new Set((window.DATA.assets || [])
        .filter(a => a.group === cat.group && a.sub === cat.sub)
        .map(a => a.product).filter(Boolean))];
      // 포커스만 하고 아직 안 쳤으면(q 없음) 전체 목록을 보여줌(태그 검색과 동일) — 검색어가 있는데 매칭이
      // 없으면 자동완성 성격상 "결과 없음" 표시 없이 그냥 드롭다운을 띄우지 않음(새 제품명 입력이 정상 상태)
      return q ? names.filter(n => n.toLowerCase().includes(q)) : names;
    }
    function openProdMenu() {
      const opts = productOptions();
      closeProdMenu();
      if (!opts.length) return;
      prodMenu = document.createElement("div");
      prodMenu.className = "dropdown-menu";
      prodHi = 0;
      prodMenu.innerHTML = opts.map((n, i) => `<button type="button" data-v="${n}" class="${i === 0 ? "active" : ""}">${n}</button>`).join("");
      const r = nameInput.getBoundingClientRect();
      prodMenu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${r.left}px;min-width:${r.width}px`;
      document.body.appendChild(prodMenu);
      prodMenu.querySelectorAll("[data-v]").forEach(b => b.onclick = () => {
        nameInput.value = b.dataset.v;
        closeProdMenu();
        checkValid();
      });
    }
    function moveProdHi(delta) {
      if (!prodMenu) return;
      const btns = [...prodMenu.querySelectorAll("button")];
      if (!btns.length) return;
      if (btns[prodHi]) btns[prodHi].classList.remove("active");
      prodHi = Math.max(0, Math.min(btns.length - 1, prodHi + delta));
      btns[prodHi].classList.add("active");
      btns[prodHi].scrollIntoView({ block: "nearest" });
    }
    nameInput.addEventListener("input", () => { checkValid(); openProdMenu(); });
    nameInput.addEventListener("focus", () => { if (!nameInput.disabled) openProdMenu(); });
    nameInput.addEventListener("keydown", e => {
      if (!prodMenu) return;
      if (e.key === "ArrowDown") { e.preventDefault(); moveProdHi(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); moveProdHi(-1); }
      else if (e.key === "Enter") {
        e.preventDefault();
        const btns = [...prodMenu.querySelectorAll("button")];
        const b = btns[prodHi];
        if (b) { nameInput.value = b.dataset.v; closeProdMenu(); checkValid(); }
      } else if (e.key === "Escape") { closeProdMenu(); }
    });
    document.addEventListener("click", e => {
      if (prodMenu && !prodMenu.contains(e.target) && e.target !== nameInput) closeProdMenu();
    });
    assetNoInput.addEventListener("input", () => {
      // value를 그냥 덮어쓰면 커서가 항상 맨 끝으로 튀어서, 중간에 타이핑하다 막힌 것처럼 느껴짐 —
      // 제거된 글자 수만큼 커서 위치를 보정해서 원래 있던 자리에 그대로 남게 함
      const before = assetNoInput.value;
      const pos = assetNoInput.selectionStart;
      const filtered = before.replace(/[^A-Za-z0-9\-_]/g, "");
      if (filtered !== before) {
        const removedBefore = before.slice(0, pos).length - before.slice(0, pos).replace(/[^A-Za-z0-9\-_]/g, "").length;
        assetNoInput.value = filtered;
        const newPos = Math.max(0, pos - removedBefore);
        assetNoInput.setSelectionRange(newPos, newPos);
      }
      checkValid();
    });

    // 소분류 — 검색 + 대분류/소분류 트리 모달(openCategoryPickModal)에서 단일 선택.
    // 기본은 비워둔 상태(자동 첫 항목 선택 없음) — 미선택 상태에선 고유관리번호 등 유형별 필드를 모두 노출.
    const catWrap = back.querySelector("#areg-catwrap");
    const catDisplay = back.querySelector("#areg-cat-display");
    let catValue = null;

    function catLabel(v) { const c = findCat(v); return c ? `${c.group} › ${c.sub}` : ""; }
    function applyAssetNoVisibility() {
      assetNoField.style.display = (catValue && type === "quantity") ? "none" : "";
    }
    function renderCatDisplay() {
      if (catValue) { catDisplay.textContent = catLabel(catValue); catDisplay.style.color = "var(--text)"; }
      else { catDisplay.textContent = "선택"; catDisplay.style.color = "var(--text-mut)"; }
    }
    // 소분류를 바꿀 때마다(선택 해제 포함) 이미 입력해둔 값은 전부 초기화 — 다른 소분류의 값이 뒤섞여 남아있지 않도록
    function resetOtherFields() {
      nameInput.value = "";
      assetNoInput.value = "";
      assetNoErr.hidden = true;
      assetNoInput.classList.remove("has-err");
      dtext.value = "";
      dnative.value = "";
      tags.length = 0;
      renderChips();
    }
    // 소분류를 아직 안 골랐으면 나머지 필드는 채워봐야 소용없으니(어차피 소분류 바뀌면 초기화됨) 비활성화 —
    // hover 시 이유를 안내(data-tip). [태그 관리]는 이 자산과 무관한 전역 기능이라 잠그지 않음
    const LOCK_TIP = "소분류를 먼저 선택해주세요.";
    function setLocked(locked) {
      [nameInput, assetNoInput, dtext, dnative, tagInput].forEach(el => { el.disabled = locked; });
      [nameField, assetNoField, expiryField].forEach(el => {
        el.classList.toggle("lock-hint", locked);
        if (locked) el.setAttribute("data-tip", LOCK_TIP); else el.removeAttribute("data-tip");
      });
      tagWrap.classList.toggle("is-locked", locked);
      tagWrap.classList.toggle("lock-hint", locked);
      if (locked) tagWrap.setAttribute("data-tip", LOCK_TIP); else tagWrap.removeAttribute("data-tip");
    }
    function selectCat(v) {
      const changed = v !== catValue;
      catValue = v;
      const cat = findCat(v);
      type = (cat && cat.type) || "individual";
      renderCatDisplay();
      applyAssetNoVisibility();
      setLocked(!catValue);
      if (changed) resetOtherFields();
      checkValid();
    }
    catWrap.addEventListener("click", () => {
      openCategoryPickModal(categories, catValue, v => selectCat(v));
    });

    // 소분류 초기값 반영(과 그에 딸린 setLocked/resetOtherFields 호출)은 태그 위젯(renderChips 등)까지
    // 다 준비된 뒤로 미룸 — 그 전에 부르면 아직 선언되기 전(TDZ)인 tagInput/chipsEl을 참조해서 에러
    renderCatDisplay();
    applyAssetNoVisibility();

    // 태그 입력 위젯 — 마스터 목록(window.DATA.tags)에서 검색해 선택만 가능(즉석 생성 없음). 새 태그는 [태그 관리]에서만 추가
    const tagWrap = back.querySelector("#areg-tagwrap");
    const tagInput = tagWrap.querySelector("[data-taginput]");
    const chipsEl = tagWrap.querySelector("[data-chips]");
    let menu = null, hiIndex = -1;
    function closeMenu() { if (menu) { menu.remove(); menu = null; } hiIndex = -1; }
    function renderChips() {
      chipsEl.innerHTML = tags.map(t => {
        const c = tagColor(t);
        return `<span class="tag-chip" style="background:${c.bg};border-color:${c.fg};color:${c.fg}">${t}<button type="button" data-untag="${t}" aria-label="태그 제거" style="color:${c.fg}">${CLOSE_ICON_SM}</button></span>`;
      }).join("");
      chipsEl.querySelectorAll("[data-untag]").forEach(b => b.onclick = () => {
        tags.splice(tags.indexOf(b.dataset.untag), 1);
        renderChips();
      });
      tagInput.placeholder = tags.length ? "" : "검색";
    }
    function addTag(v) {
      if (!v || tags.includes(v) || tags.length >= 5) return;
      tags.push(v);
      tagInput.value = "";
      renderChips();
      closeMenu();
    }
    function tagOptions() {
      const q = tagInput.value.trim().toLowerCase();
      const source = (window.DATA && window.DATA.tags) || [];
      return source.filter(l => l.toLowerCase().includes(q) && !tags.includes(l));
    }
    function openMenu() {
      if (tags.length >= 5) return; // 최대 5개 다 찼으면 더 고를 필요 없음
      const opts = tagOptions();
      closeMenu();
      menu = document.createElement("div");
      menu.className = "dropdown-menu";
      hiIndex = opts.length ? 0 : -1;
      menu.innerHTML = opts.length
        ? opts.map((l, i) => `<button type="button" data-pick="${l}" class="${i === 0 ? "active" : ""}">${l}</button>`).join("")
        : `<div class="dropdown-empty">결과가 없습니다.</div>`;
      const r = tagWrap.getBoundingClientRect();
      menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${r.left}px;min-width:${r.width}px`;
      document.body.appendChild(menu);
      menu.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => addTag(b.dataset.pick));
    }
    function moveHi(delta) {
      if (!menu) return;
      const btns = [...menu.querySelectorAll("button")];
      if (!btns.length) return;
      if (btns[hiIndex]) btns[hiIndex].classList.remove("active");
      hiIndex = Math.max(0, Math.min(btns.length - 1, hiIndex + delta));
      btns[hiIndex].classList.add("active");
      btns[hiIndex].scrollIntoView({ block: "nearest" });
    }
    tagInput.addEventListener("input", openMenu);
    tagInput.addEventListener("focus", openMenu);
    tagInput.addEventListener("keydown", e => {
      if (e.key === "ArrowDown") { e.preventDefault(); moveHi(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); moveHi(-1); }
      else if (e.key === "Enter") {
        e.preventDefault();
        if (menu) {
          const btns = [...menu.querySelectorAll("button")];
          const b = btns[hiIndex];
          if (b) addTag(b.dataset.pick);
        }
      } else if (e.key === "Escape") { closeMenu(); }
    });
    document.addEventListener("click", e => {
      if (menu && !menu.contains(e.target) && e.target !== tagInput) closeMenu();
    });
    renderChips();
    checkValid();
    if (preselectValue) selectCat(preselectValue);
    else setLocked(true);

    back.querySelector("#areg-tag-manage").onclick = () => {
      closeMenu();
      openTagManageModal(({ renamed, deletedOrigs }) => {
        let changed = false;
        for (let i = tags.length - 1; i >= 0; i--) {
          if (deletedOrigs.includes(tags[i])) { tags.splice(i, 1); changed = true; continue; }
          const r = renamed.find(rn => rn.from === tags[i]);
          if (r) { tags[i] = r.to; changed = true; }
        }
        if (changed) renderChips();
      });
    };

    saveBtn.addEventListener("click", () => { closeMenu(); toast("저장되었습니다. (프로토타입 — 반영 없음)"); });

    return back;
  };
})();
