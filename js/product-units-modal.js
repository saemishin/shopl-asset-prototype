/* 품목(개별형) 단위 자산 목록 모달 — 분류 화면의 품목 목록, 현황 품목별 화면 공용.
   product(품목명 문자열)와 items(그 품목에 속한 개별 자산 배열)만 받아서 뜨는, 두 화면 어디에도 종속되지 않는 컴포넌트. */
window.openProductUnitsModal = function (product, items) {
  const CLOSE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
  const STATUS_LABEL = { assigned: "배정 중", stock: "재고", repair: "수리 중", lost: "분실", disposed: "폐기" };
  // 상태별 섹션으로 묶어서 보여줌 — 실사용 규모에서는 한 품목의 유닛 수가 두 자릿수를 넘는 경우가 흔해서
  // (예: 동일 노트북 모델을 여러 인원에게 배정), 평평한 리스트+배지만으로는 스캔이 어려움.
  // 컬럼 순서(배정중/재고/수리중/분실/폐기)와 동일한 순서로 섹션을 배치, 섹션 안은 고유관리번호 오름차순, 빈 섹션은 생략.
  const groups = Object.keys(STATUS_LABEL)
    .map(k => ({
      key: k, label: STATUS_LABEL[k],
      list: items.filter(a => a.status === k).sort((a, b) => (a.assetNo || "").localeCompare(b.assetNo || "", "ko")),
    }))
    .filter(g => g.list.length);

  const listHtml = groups.map(g => `
    <div class="cat-unit-group">
      <p class="cat-unit-group-label">${g.label} <span class="muted">${g.list.length}</span></p>
      ${g.list.map(a => `
        <a class="cat-unit-row" href="asset-detail.html?id=${a.id}" target="_blank" rel="noopener">
          <span class="cat-unit-no">${a.assetNo || "—"}</span>
          <span class="badge ${a.status}">${STATUS_LABEL[a.status]}</span>
        </a>`).join("")}
    </div>`).join("");

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
        <div class="cat-unit-list">${listHtml}</div>
      </div>
    </div>`;
  document.body.appendChild(m);
  m.addEventListener("click", e => { if (e.target === m) m.remove(); });
  m.querySelector("[data-close]").onclick = () => m.remove();
};
