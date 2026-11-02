/* Dashboard capture fixtures for Web_dc_12.
   qa=history only; A001 = information/photos, A106 = assignments/status/links.
   The normal seed and stored data are untouched. capture=1 hides the QA panel. */
(function () {
  const params = new URLSearchParams(location.search);
  if (params.get("qa") !== "history") return;
  const find = id => window.DATA.assets.find(a => a.id === id), D = window.fmtDate, Mo = window.fmtMonth;
  const emp = (employee,since) => ({employee,worksite:null,since}), ws = (worksite,since) => ({employee:null,worksite,since});
  const photo = (id,color) => ({id,color,at:"2026-04-18 16:00",by:"dana"});
  const photos = [photo("qa-p1","#4b7bec"),photo("qa-p2","#6595ff"),photo("qa-p3","#e08a3c")];
  const event = (d,script,before,after,extra={}) => ({d,who:"dana",script,...(before === undefined ? {} : {before,after}),...extra});
  const info = find("A001"), operations = find("A106");
  const edit = (label,id,before,after,extra={}) => event("2026-04-02 13:20",`자산 정보 수정: ${label}`,before,after,{fieldId:id,...extra});
  if (info) {
    const ownerId="history-owner";
    if (!window.DATA.extraFields.some(f => f.id === ownerId)) window.DATA.extraFields.push({id:ownerId,name:"구매 담당자"});
    const cat=window.AssetExtra.category(info);
    cat.extraEnabled=[...new Set([...(cat.extraEnabled||[]),ownerId])];
    cat.privateFields=[...new Set([...(cat.privateFields||[]),"purchasePrice",ownerId])];
    info._activityLog = [
      event("2026-08-28 14:10","자산 정보 수정: 메모 수정","<p>반납 시 상태 확인</p>","<p><strong>반납 시 상태 확인</strong></p>",{fieldId:"memo"}),
      event("2026-08-26 09:00","자산 정보 수정: 메모 수정","","<p><strong>키보드 상태 확인</strong></p><ul><li>반납 시 외관 확인</li></ul>",{fieldId:"memo"}),
      event("2026-08-20 11:00","자산 사진 관리: 사진 변경",photos,[],{photoValue:true}),
      event("2026-08-18 11:00","자산 사진 관리: 사진 변경",photos,[photos[0],photos[2]],{photoValue:true}),
      // Same save: photos first, then primary. Both sort directions must preserve this order.
      event("2026-04-18 16:00","자산 사진 관리: 사진 변경",[photos[0],photos[1]],photos,{photoValue:true}),
      event("2026-04-18 16:00","자산 사진 관리: 대표 사진 변경",[photos[0]],[photos[2]],{photoValue:true}),
      event("2026-04-10 08:50","자산 사진 관리: 사진 변경",[],[photos[0],photos[1]],{photoValue:true}),
      // Current edit-form order; S/N and IMEI are custom fields, not fixed information.
      edit("소분류 변경","sub","전자기기류 › 모니터","전자기기류 › 노트북"),
      edit("품목명 수정","product","그램 16","그램 16 (2024)"),
      edit("고유관리번호 수정","assetNo","IT-2024-012","IT-2024-0012"),
      edit("태그 수정","tags","본사","본사, 개발팀"),
      edit("유효기한 변경","expiry","",D("2027-03-10")),
      edit("제조연월 변경","manufactured",Mo("2023-12-01"),Mo("2024-01-01")),
      edit("구매연월 변경","purchaseDate","",Mo("2024-03-01")),
      edit("구매가격 변경","purchasePrice","$1,200","₩1,500,000"),
      edit("메모 수정","memo","","<p>배정 전 구성품 확인</p>"),
      edit("S/N 수정","sn","SN-8842","SN-8842-AA",{fieldName:"S/N"}),
      edit("IMEI 수정","imei","","356938035643809",{fieldName:"IMEI"}),
      edit("구매 담당자 수정",ownerId,"홍길동","구매팀",{fieldName:"구매 담당자"}),
      event("2024-03-12 09:00","자산 등록")
    ];
  }
  window.DATA.targetStatuses.employee["오세훈"]="retired";
  window.DATA.targetStatuses.worksite["강남점"]="inactive";
  const label = id => {const a=find(id);return a ? `${a.product} · ${a.assetNo}` : "연결 자산";};
  const link = (d,id,cut=false,cause="") => event(d,`자산 연결: ${cut ? "연결 해제" : "연결"}${cause ? `(${cause})` : ""}`,cut?label(id):"",cut?"":label(id),{relatedAssetId:id});
  const move = (d,previousTarget,nextTarget,extra={}) => event(d,"배정 관리: 이동",`${previousTarget.employee||previousTarget.worksite} · ${D(previousTarget.since)}`,`${nextTarget.employee||nextTarget.worksite} · ${D(nextTarget.since)}`,{assignmentMove:true,previousTarget,nextTarget,...extra});
  if (operations) operations._activityLog = [
    // Visible and permission-restricted counterpart examples. manage=0 uses existing category permissions.
    link("2026-09-03 18:10","A107",true,"이동"),
    link("2026-09-03 18:09","A107"),
    link("2026-09-02 17:00","A001",true,"반납"),
    event("2026-09-02 17:00",`배정 관리: 반납 (${label("A001")}과 함께)`,D("2026-08-20"),"",{target:emp("김민수","2026-08-20")}),
    link("2026-09-01 17:00","A001",true,"이동"),
    move("2026-09-01 17:00",ws("본사","2026-08-01"),emp("김민수","2026-09-01"),{script:`배정 관리: 이동 (${label("A001")}과 함께)`}),
    link("2026-08-31 15:00","A001",true,"삭제"),
    link("2026-08-30 15:00","A001",true,"폐기"),
    event("2026-08-29 15:00","상태 변경: 폐기 복구","폐기","배정 가능"),
    event("2026-08-28 15:00","상태 변경: 폐기 처리","배정 중","폐기"),
    event("2026-08-27 11:00","상태 변경: 수리/점검 완료","수리/점검 중","배정 중"),
    event("2026-08-25 09:40","상태 변경: 수리/점검 접수","배정 중","수리/점검 중"),
    event("2026-08-24 18:10","상태 변경: 분실 회수","분실","배정 중"),
    event("2026-08-23 10:00","상태 변경: 분실 신고","배정 중","분실",{who:"오세훈"}),
    link("2026-08-22 15:00","A001",true),
    link("2026-08-21 15:00","A001"),
    move("2026-08-20 14:30",emp("박지훈","2026-05-02"),ws("본사","2026-08-20")),
    event("2026-08-19 11:00","배정 관리: 반납",D("2026-06-01"),"",{target:ws("역삼점","2026-06-01")}),
    event("2026-07-01 10:15","배정 관리: 배정일 변경",D("2024-03-20"),D("2024-03-15"),{target:emp("김민수","2024-03-15")}),
    event("2026-06-01 09:00","배정 관리: 신규 배정","",D("2026-06-01"),{target:ws("강남점","2026-06-01")}),
    event("2026-05-02 09:00","배정 관리: 신규 배정","",D("2026-05-02"),{target:emp("오세훈","2026-05-02")}),
    event("2026-03-02 09:00","자산 등록")
  ];
  const disposed=find("A020");
  if (disposed) disposed._activityLog=[event("2025-12-30 09:00","상태 변경: 폐기 처리","배정 중","폐기"),event("2024-03-12 09:00","자산 등록")];
  document.addEventListener("DOMContentLoaded",() => {
    if (params.get("capture")==="1") document.body.classList.add("history-capture");
    document.querySelector('[data-atab="history"]')?.click();
  },{once:true});
})();
