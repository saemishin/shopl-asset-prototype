/* 자산 등록 팝업 — 현황/분류 화면 공용(아직 러프한 프로토타입: 저장은 토스트만, 실제 데이터 반영 없음).
   assets.js의 "자산 추가" 버튼과 category.js의 소분류별 빈 자산 목록 [자산 추가] 버튼이 이 하나를 같이 씀. */
window.openAssetAddModal = function (opts) {
  opts = opts || {};
  const categories = (window.DATA && window.DATA.categories) || [];
  const preselectValue = opts.group && opts.sub ? `${opts.group}|${opts.sub}` : null;
  const findCat = v => { const [g, s] = (v || "").split("|"); return categories.find(c => c.group === g && c.sub === s); };
  let type = (findCat(preselectValue) || categories[0] || {}).type || "individual";

  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300;box-shadow:0 8px 24px rgba(0,0,0,.25)";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  }

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

  // 태그 — 기등록된 태그 자동완성(입력값 포함하는 것만 드롭다운) + 새 태그 직접 생성, jira 스타일
  const ALL_LABELS = [...new Set((window.DATA && window.DATA.assets || []).flatMap(a => a.labels || []))].sort();
  const CLOSE_ICON_SM = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
  const tags = [];

  const back = document.createElement("div");
  back.className = "modal-back";
  back.innerHTML = `
    <div class="modal">
      <h3>자산 추가</h3>
      <div class="body">
        <div class="field"><label>소분류 <span class="req">*</span></label>
          <select id="areg-cat">${categories.map(c => {
            const v = `${c.group}|${c.sub}`;
            return `<option value="${v}"${v === preselectValue ? " selected" : ""}>${c.group} › ${c.sub}</option>`;
          }).join("")}</select>
          <div class="hint">선택한 소분류의 자산 유형(개별/수량)이 그대로 적용됩니다.</div>
        </div>
        <div class="field"><label>제품명 <span class="req">*</span></label><input type="text" placeholder="예: 그램 16 (2024)"></div>
        <div class="field" id="areg-assetno"${type === "quantity" ? ' style="display:none"' : ""}><label>고유관리번호 <span class="req">*</span></label><input type="text" placeholder="예: IT-2026-0001"></div>
        <div class="field"><label>유효기한</label>${dateFieldHtml()}<div class="hint">소분류 필드 노출 설정이 on일 때만 표시 (기본 off)</div></div>
        <div class="field">
          <label>태그</label>
          <div class="tag-input-wrap" id="areg-tagwrap">
            <div class="tag-chips" data-chips></div>
            <input type="text" data-taginput placeholder="입력 후 Enter · 최대 5개 · 20자">
          </div>
        </div>
      </div>
      <div class="foot">
        <button class="btn" data-close>취소</button>
        <button class="btn primary" data-close id="areg-save">저장</button>
      </div>
    </div>`;
  back.addEventListener("click", e => { if (e.target === back) back.remove(); });
  back.querySelectorAll("[data-close]").forEach(b => b.onclick = () => back.remove());
  document.body.appendChild(back);

  back.querySelector("#areg-cat").onchange = e => {
    const cat = findCat(e.target.value);
    type = (cat && cat.type) || "individual";
    back.querySelector("#areg-assetno").style.display = type === "quantity" ? "none" : "";
  };
  wireDateField(back.querySelector(".dfield"));

  // 태그 입력 위젯
  const tagWrap = back.querySelector("#areg-tagwrap");
  const tagInput = tagWrap.querySelector("[data-taginput]");
  const chipsEl = tagWrap.querySelector("[data-chips]");
  let menu = null;
  function closeMenu() { if (menu) { menu.remove(); menu = null; } }
  function renderChips() {
    chipsEl.innerHTML = tags.map(t => `
      <span class="tag-chip">${t}<button type="button" data-untag="${t}" aria-label="태그 제거">${CLOSE_ICON_SM}</button></span>`).join("");
    chipsEl.querySelectorAll("[data-untag]").forEach(b => b.onclick = () => {
      tags.splice(tags.indexOf(b.dataset.untag), 1);
      renderChips();
    });
    tagInput.placeholder = tags.length ? "" : "입력 후 Enter · 최대 5개 · 20자";
  }
  function addTag(v) {
    v = v.trim().slice(0, 20);
    if (!v || tags.includes(v) || tags.length >= 5) return;
    tags.push(v);
    tagInput.value = "";
    renderChips();
    closeMenu();
  }
  function openMenu() {
    const q = tagInput.value.trim().toLowerCase();
    const opts = q ? ALL_LABELS.filter(l => l.toLowerCase().includes(q) && !tags.includes(l)) : [];
    closeMenu();
    if (!opts.length) return;
    menu = document.createElement("div");
    menu.className = "dropdown-menu";
    menu.innerHTML = opts.slice(0, 8).map(l => `<button type="button" data-pick="${l}">${l}</button>`).join("");
    const r = tagInput.getBoundingClientRect();
    menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${r.left}px;min-width:${r.width}px`;
    document.body.appendChild(menu);
    menu.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => addTag(b.dataset.pick));
  }
  tagInput.addEventListener("input", openMenu);
  tagInput.addEventListener("focus", openMenu);
  tagInput.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); addTag(tagInput.value); }
  });
  document.addEventListener("click", e => { if (menu && !menu.contains(e.target) && e.target !== tagInput) closeMenu(); });
  renderChips();

  back.querySelector("#areg-save").addEventListener("click", () => { closeMenu(); toast("저장되었습니다. (프로토타입 — 반영 없음)"); });

  return back;
};
