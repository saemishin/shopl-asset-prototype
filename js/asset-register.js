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
    let dirty = false;

    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal">
        <h3>태그 관리</h3>
        <div class="body">
          <div class="tag-manage-add">
            <input type="text" class="cat-manage-input" data-tm-input placeholder="입력" maxlength="20">
            <button type="button" class="btn primary" data-tm-add>+ 추가</button>
          </div>
          <div class="tag-manage-list" data-tm-list style="margin-top:14px"></div>
        </div>
        <div class="foot">
          <button type="button" class="btn" data-tm-cancel>취소</button>
          <button type="button" class="btn primary" data-tm-save disabled>저장</button>
        </div>
      </div>`;
    document.body.appendChild(back);

    const listEl = back.querySelector("[data-tm-list]");
    const addInput = back.querySelector("[data-tm-input]");
    const saveBtn = back.querySelector("[data-tm-save]");

    function markDirty() { dirty = true; saveBtn.disabled = false; }
    function renderList() {
      listEl.innerHTML = draft.length ? draft.map((t, i) => `
        <div class="cat-manage-row">
          <input type="text" class="cat-manage-name-input" data-tm-rename="${i}" value="${t.name}" maxlength="20">
          <div class="cat-manage-row-acts">
            <button type="button" class="cat-manage-icon" data-tm-del="${i}" aria-label="삭제"
              data-tip="삭제 시 이 태그를 사용 중인 자산에서 모두 삭제됩니다.">${TRASH_ICON}</button>
          </div>
        </div>`).join("") : `<p class="tag-manage-empty">등록된 태그가 없습니다.</p>`;
    }
    renderList();

    function addRow() {
      const name = addInput.value.trim().slice(0, 20);
      if (!name) { addInput.focus(); return; }
      draft.unshift({ name, orig: null });
      addInput.value = "";
      markDirty();
      renderList();
    }
    back.querySelector("[data-tm-add]").onclick = addRow;
    addInput.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); addRow(); } });

    listEl.addEventListener("input", e => {
      const r = e.target.closest("[data-tm-rename]");
      if (r) { draft[+r.dataset.tmRename].name = e.target.value; markDirty(); }
    });
    listEl.addEventListener("click", e => {
      const d = e.target.closest("[data-tm-del]");
      if (d) { draft.splice(+d.dataset.tmDel, 1); markDirty(); renderList(); }
    });

    back.querySelector("[data-tm-cancel]").onclick = () => back.remove();
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });

    saveBtn.onclick = () => {
      if (!dirty) return;
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
      <div class="modal">
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
              <button type="button" class="wrap-clear" id="areg-cat-clear" hidden aria-label="소분류 선택 해제">${CLOSE_ICON_SM}</button>
            </div>
          </div>
          <div class="field"><label>제품명 <span class="req">*</span></label><input type="text" id="areg-name" placeholder="입력"></div>
          <div class="field" id="areg-assetno"><label>고유관리번호 <span class="req">*</span></label><input type="text" id="areg-assetno-input" placeholder="입력"></div>
          <div class="field"><label>유효기한</label>${dateFieldHtml()}</div>
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

    const nameInput = back.querySelector("#areg-name");
    const assetNoField = back.querySelector("#areg-assetno");
    const assetNoInput = back.querySelector("#areg-assetno-input");
    const saveBtn = back.querySelector("#areg-save");

    function checkValid() {
      const nameOk = nameInput.value.trim().length > 0;
      const noOk = type === "quantity" ? true : assetNoInput.value.trim().length > 0;
      saveBtn.disabled = !(catValue && nameOk && noOk);
    }
    nameInput.addEventListener("input", checkValid);
    assetNoInput.addEventListener("input", checkValid);

    // 소분류 — 검색 + 대분류/소분류 트리 모달(openCategoryPickModal)에서 단일 선택.
    // 기본은 비워둔 상태(자동 첫 항목 선택 없음) — 미선택 상태에선 고유관리번호 등 유형별 필드를 모두 노출.
    const catWrap = back.querySelector("#areg-catwrap");
    const catDisplay = back.querySelector("#areg-cat-display");
    const catClear = back.querySelector("#areg-cat-clear");
    let catValue = null;

    function catLabel(v) { const c = findCat(v); return c ? `${c.group} › ${c.sub}` : ""; }
    function updateCatClear() { catClear.hidden = !catValue; }
    function applyAssetNoVisibility() {
      assetNoField.style.display = (catValue && type === "quantity") ? "none" : "";
    }
    function renderCatDisplay() {
      if (catValue) { catDisplay.textContent = catLabel(catValue); catDisplay.style.color = "var(--text)"; }
      else { catDisplay.textContent = "선택"; catDisplay.style.color = "var(--text-mut)"; }
    }
    function selectCat(v) {
      catValue = v;
      const cat = findCat(v);
      type = (cat && cat.type) || "individual";
      renderCatDisplay();
      updateCatClear();
      applyAssetNoVisibility();
      checkValid();
    }
    catWrap.addEventListener("click", e => {
      if (catClear.contains(e.target)) return;
      openCategoryPickModal(categories, catValue, v => selectCat(v));
    });
    catClear.onclick = e => {
      e.stopPropagation();
      catValue = null;
      renderCatDisplay();
      updateCatClear();
      applyAssetNoVisibility();
      checkValid();
    };

    if (preselectValue) selectCat(preselectValue);
    else { renderCatDisplay(); applyAssetNoVisibility(); }

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
