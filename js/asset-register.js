/* 자산 등록 팝업 — 현황/분류 화면 공용(아직 러프한 프로토타입: 저장은 토스트만, 실제 데이터 반영 없음).
   assets.js의 "자산 추가" 버튼과 category.js의 소분류별 빈 자산 목록 [자산 추가] 버튼이 이 하나를 같이 씀. */
window.openAssetAddModal = function (opts) {
  opts = opts || {};
  let type = opts.type || "individual";
  // 분류 화면에서 열면 지금 보고 있던 소분류가, 현황 화면에서 열면(group/sub 없음) 첫 소분류가 기본 선택됨
  const categories = (window.DATA && window.DATA.categories) || [];
  const preselectValue = opts.group && opts.sub ? `${opts.group}|${opts.sub}` : null;

  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300;box-shadow:0 8px 24px rgba(0,0,0,.25)";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  }

  const back = document.createElement("div");
  back.className = "modal-back";
  back.innerHTML = `
    <div class="modal">
      <h3>자산 추가</h3>
      <div class="body">
        <div class="field">
          <label>자산 유형 <span class="req">*</span></label>
          <div class="seg" id="areg-type-seg">
            <button class="${type === "individual" ? "active" : ""}" data-t="individual">개별 자산</button>
            <button class="${type === "quantity" ? "active" : ""}" data-t="quantity">수량 자산</button>
          </div>
          <div class="hint">유형은 선택한 소분류에서 상속됩니다. (구조안 3.4)</div>
        </div>
        <div class="field"><label>소분류 <span class="req">*</span></label>
          <select>${categories.map(c => {
            const v = `${c.group}|${c.sub}`;
            return `<option value="${v}"${v === preselectValue ? " selected" : ""}>${c.group} › ${c.sub}</option>`;
          }).join("")}</select></div>
        <div class="field"><label>제품명 <span class="req">*</span></label><input type="text" placeholder="예: 그램 16 (2024)"></div>
        <div class="field" id="areg-assetno"${type === "quantity" ? ' style="display:none"' : ""}><label>고유관리번호 <span class="req">*</span></label><input type="text" placeholder="예: IT-2026-0001"></div>
        <div class="field"><label>유효기한</label><input type="date"><div class="hint">소분류 필드 노출 설정이 on일 때만 표시 (기본 off)</div></div>
        <div class="field"><label>태그</label><input type="text" placeholder="입력 후 Enter · 최대 5개 · 20자"></div>
      </div>
      <div class="foot">
        <button class="btn" data-close>취소</button>
        <button class="btn primary" data-close id="areg-save">저장</button>
      </div>
    </div>`;
  back.addEventListener("click", e => { if (e.target === back) back.remove(); });
  back.querySelectorAll("[data-close]").forEach(b => b.onclick = () => back.remove());
  document.body.appendChild(back);

  back.querySelector("#areg-type-seg").onclick = e => {
    const b = e.target.closest("button");
    if (!b) return;
    type = b.dataset.t;
    back.querySelectorAll("#areg-type-seg button").forEach(x => x.classList.toggle("active", x === b));
    back.querySelector("#areg-assetno").style.display = type === "quantity" ? "none" : "";
  };
  back.querySelector("#areg-save").addEventListener("click", () => toast("저장되었습니다. (프로토타입 — 반영 없음)"));

  return back;
};
