/* 품목(개별형) 단위 자산 목록 모달 — 분류 화면의 품목 목록, 현황 품목별 화면 공용.
   product(품목명 문자열)와 items(그 품목에 속한 개별 자산 배열)만 받아서 뜨는, 두 화면 어디에도 종속되지 않는 컴포넌트. */
window.openProductUnitsModal = function (product, items) {
  const CLOSE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
  const STATUS_LABEL = { stock: "재고", assigned: "배정 중", repair: "수리 중", lost: "분실", disposed: "폐기" };
  // 고유관리번호 가나다(코드)순 — 이 목록에서 유닛을 찾아보는 가장 예측 가능한 기준이라 채택(상태별로 구간을 나누는 안도
  // 검토했으나, 보통 한 품목의 유닛 수가 몇 개 안 돼서 배지 색만으로도 상태 구분이 충분히 되고, 굳이 섹션을 나눌 만큼은 아니라고 판단)
  const sorted = [...items].sort((a, b) => (a.assetNo || "").localeCompare(b.assetNo || "", "ko"));

  const m = document.createElement("div");
  m.className = "modal-back";
  m.innerHTML = `
    <div class="modal help-modal">
      <div class="help-modal-head">
        <h3>자산 목록</h3>
        <button type="button" class="btn icon-only sm" data-close aria-label="닫기">${CLOSE_ICON}</button>
      </div>
      <div class="body">
        <p class="cat-unit-product">${product}</p>
        <div class="cat-unit-list">
          ${sorted.map(a => `
            <a class="cat-unit-row" href="asset-detail.html?id=${a.id}" target="_blank" rel="noopener">
              <span class="cat-unit-no">${a.assetNo || "—"}</span>
              <span class="badge ${a.status}">${STATUS_LABEL[a.status]}</span>
            </a>`).join("")}
        </div>
      </div>
    </div>`;
  document.body.appendChild(m);
  m.addEventListener("click", e => { if (e.target === m) m.remove(); });
  m.querySelector("[data-close]").onclick = () => m.remove();
};
