/* 품목(개별형) 단위 자산 목록 모달 — 분류 화면의 품목 목록, 현황 품목별 화면 공용.
   product(품목명 문자열)와 items(그 품목에 속한 개별 자산 배열)만 받아서 뜨는, 두 화면 어디에도 종속되지 않는 컴포넌트. */
window.openProductUnitsModal = function (product, items) {
  const CLOSE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
  const STATUS_LABEL = { assigned: "배정 중", stock: "재고", repair: "수리 중", lost: "분실", disposed: "폐기" };
  // 상태 5개를 가로 5열로 고정 배치 — 열 타이틀이 이미 상태를 말해줘서 행마다 뱃지를 또 붙일 필요가 없고(고유관리번호만 표시),
  // 개수가 0인 상태도 열 자체는 항상 유지(빈 채로 둠, 별도 문구 없음)해서 품목이 달라져도 열 배치가 흔들리지 않게 함.
  // 컬럼 순서는 테이블과 동일(배정중/재고/수리중/분실/폐기), 열 안은 고유관리번호 오름차순.
  const groups = Object.keys(STATUS_LABEL).map(k => ({
    key: k, label: STATUS_LABEL[k],
    list: items.filter(a => a.status === k).sort((a, b) => (a.assetNo || "").localeCompare(b.assetNo || "", "ko")),
  }));

  const colsHtml = groups.map(g => `
    <div class="cat-unit-col">
      <p class="cat-unit-col-label">${g.label} <span class="muted">${g.list.length}</span></p>
      ${g.list.map(a => `
        <a class="cat-unit-no-row" href="asset-detail.html?id=${a.id}" target="_blank" rel="noopener">${a.assetNo || "—"}</a>`).join("")}
    </div>`).join("");

  const m = document.createElement("div");
  m.className = "modal-back";
  m.innerHTML = `
    <div class="modal units-modal help-modal">
      <div class="help-modal-head">
        <h3>자산 목록</h3>
        <button type="button" class="btn icon-only sm" data-close aria-label="닫기">${CLOSE_ICON}</button>
      </div>
      <div class="body">
        <p class="cat-unit-product">${product}</p>
        <div class="cat-unit-list">${colsHtml}</div>
      </div>
    </div>`;
  document.body.appendChild(m);
  m.addEventListener("click", e => { if (e.target === m) m.remove(); });
  m.querySelector("[data-close]").onclick = () => m.remove();
};
