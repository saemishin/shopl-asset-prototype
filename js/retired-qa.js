/* 퇴사·비활성 대상 QA 도구.
   ?qa=retired일 때만 지정한 보유·배정 대상을 메모리에서 퇴사 구성원·비활성 근무지로 바꾼다(캡처·확인용).
   target 파라미터가 없으면 오세훈(퇴사)을 사용한다. 일반 URL과 저장 데이터에는 영향을 주지 않는다. */
(function () {
  const params = new URLSearchParams(location.search);
  if (params.get("qa") !== "retired") return;
  const target = params.get("target") || "오세훈";
  const statuses = window.DATA.targetStatuses;
  const isWorksite = (window.DATA.assets || []).some(a =>
    (a.stocks || []).concat(a.assignments || []).some(x => x.worksite === target));
  if (isWorksite) statuses.worksite[target] = "inactive";
  else statuses.employee[target] = "retired";
})();
