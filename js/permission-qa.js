/* 권한 범위 QA 도구.
   ?qa=permission일 때만 테스트 데이터를 적용하고 화면에 시나리오 전환 패널을 표시한다.
   일반 URL에서는 데이터와 권한 판정에 영향을 주지 않는다. */
(function () {
  const params = new URLSearchParams(location.search);
  const enabled = params.get("qa") === "permission";
  const scenarioKeys = ["manage", "none", "empty", "partial"];
  const scenario = scenarioKeys.includes(params.get("scenario")) ? params.get("scenario") : "manage";

  window.AssetPermissionQa = {
    enabled,
    scenario,
    managePermission: !enabled || scenario === "manage",
  };

  if (!enabled) return;

  if (scenario !== "manage") {
    // 관리 권한이 없는 계정의 소분류 조회 범위를 재현한다. 실제 인증·회사 데이터와 연결하지 않는다.
    window.DATA.categories.forEach(category => {
      category.view = "관리자만";
      delete category.viewTarget;
    });
    const visibleSubcategory = scenario === "empty"
      ? "서랍장"
      : scenario === "partial" ? "케이블·액세서리" : "";
    if (visibleSubcategory) {
      const category = window.DATA.categories.find(item => item.sub === visibleSubcategory);
      if (category) category.view = "회사의 모든 구성원";
    }
  }

  const options = [
    ["manage", "기본 설정"],
    ["none", "조회 권한 없음"],
    ["empty", "빈 분류만 조회"],
    ["partial", "일부 분류만 조회"],
  ];

  function moveTo(nextScenario) {
    const next = new URL(location.href);
    next.searchParams.set("qa", "permission");
    next.searchParams.set("scenario", nextScenario);
    location.href = next.toString();
  }

  function closeQa() {
    const next = new URL(location.href);
    next.searchParams.delete("qa");
    next.searchParams.delete("scenario");
    location.href = next.toString();
  }

  function mountPanel() {
    const panel = document.createElement("aside");
    panel.className = "permission-qa-panel";
    panel.setAttribute("aria-label", "권한 QA 시나리오");
    panel.innerHTML = `<div class="permission-qa-head"><strong>권한 QA</strong><button type="button" data-qa-close aria-label="QA 종료">×</button></div>
      <div class="permission-qa-actions">${options.map(([key, label]) => `<button type="button" data-qa-scenario="${key}" aria-pressed="${key === scenario}">${label}</button>`).join("")}</div>`;
    document.body.appendChild(panel);
    panel.querySelectorAll("[data-qa-scenario]").forEach(button => {
      button.onclick = () => moveTo(button.dataset.qaScenario);
    });
    panel.querySelector("[data-qa-close]").onclick = closeQa;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountPanel, { once: true });
  else mountPanel();
})();

// Review the new independent information/state permissions without duplicate QA pages.
(function(){
  const p=new URLSearchParams(location.search);if(p.get('qa')!=='access')return;
  const options=[['manage','자산 관리'],['info','정보 수정만'],['state','상태 관리만'],['both','수정·상태 관리'],['view','조회만'],['private','비공개 확인']];
  const panel=document.createElement('aside');panel.className='permission-qa-panel';
  panel.innerHTML='<div class="permission-qa-head"><strong>소분류 권한 QA</strong></div><div class="permission-qa-actions">'+options.map(([key,label])=>`<button type="button" data-access-case="${key}" aria-pressed="${(p.get('scenario')||'info')===key}">${label}</button>`).join('')+'</div>';
  panel.querySelectorAll('[data-access-case]').forEach(button=>button.onclick=()=>{const u=new URL(location.href);u.searchParams.set('scenario',button.dataset.accessCase);location.href=u.href;});
  document.body.appendChild(panel);
})();
