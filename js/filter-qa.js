/* 현황 > 전체 필터의 옵션 없는 상태 확인 도구.
   ?qa=filter-empty&scenario=category|tags에서만 현재 탭의 메모리 데이터를 바꾼다.
   원본 화면·필터를 재사용하며 일반 URL과 영구 저장 데이터에는 영향을 주지 않는다. */
(function () {
  const params = new URLSearchParams(location.search);
  if (params.get("qa") !== "filter-empty") return;
  const scenario = params.get("scenario") === "tags" ? "tags" : "category";

  if (scenario === "category") {
    // 회사 분류를 지우지 않고, 조회 가능한 소분류가 없는 비관리 계정을 재현한다.
    window.AssetPermissionQa = { enabled: true, scenario: "none", managePermission: false };
    window.DATA.categories.forEach(category => {
      category.view = "관리자만";
      delete category.viewTarget;
    });
  } else {
    // 태그 마스터와 자산의 기존 연결값이 모두 없는 상태. 자산·분류 자체는 유지한다.
    window.DATA.tags = [];
    window.DATA.assets.forEach(asset => { asset.labels = []; });
  }

  function openEmptyFilter() {
    document.getElementById("btn-filter").click();
    document.querySelector(`#f-groups button[data-g="${scenario === "tags" ? "labels" : "category"}"]`).click();
  }

  function mount() {
    if (!window.PrototypeQa && params.get("capture") !== "1") {
      const panel = document.createElement("aside");
      panel.className = "permission-qa-panel";
      panel.setAttribute("aria-label", "필터 빈 옵션 QA 시나리오");
      const scenarios = [["category", "조회 가능한 분류 없음"], ["tags", "등록된 태그 없음"]];
      panel.innerHTML = `<div class="permission-qa-head"><strong>필터 빈 옵션 QA</strong><button type="button" data-filter-qa-close aria-label="QA 종료">×</button></div>
        <div class="permission-qa-actions">${scenarios.map(([key, label]) => `<button type="button" data-filter-scenario="${key}" aria-pressed="${key === scenario}">${label}</button>`).join("")}<button type="button" data-filter-reopen>빈 필터 다시 열기</button></div>`;
      panel.querySelectorAll("[data-filter-scenario]").forEach(button => {
        button.onclick = () => {
          const next = new URL(location.href);
          next.searchParams.set("scenario", button.dataset.filterScenario);
          location.href = next.toString();
        };
      });
      panel.querySelector("[data-filter-reopen]").onclick = openEmptyFilter;
      panel.querySelector("[data-filter-qa-close]").onclick = () => {
        const next = new URL(location.href);
        ["qa", "scenario", "capture"].forEach(key => next.searchParams.delete(key));
        location.href = next.toString();
      };
      document.body.appendChild(panel);
    }
    openEmptyFilter();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})();
