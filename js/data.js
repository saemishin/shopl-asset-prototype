/* Sample data for the prototype. Not a real schema — mirrors 구조설계안 fields. */
window.DATA = (function () {
  // 분류: 대분류 > 소분류(개별형/수량형)
  // hiddenFields: 소분류 필드 노출 설정에서 off된 선택 필드(구조안 3.3). 상세에서 해당 행 자체를 숨김
  // view/assign: 자산 조회 권한 / 배정·보유 변경 권한(구조안 4.3) — assign은 항상 view의 부분집합
  const categories = [
    { group: "가구류", sub: "책상", type: "individual", hiddenFields: ["expiry"], view: "회사의 모든 구성원", assign: "모든 관리자 및 리더" },
    { group: "가구류", sub: "의자", type: "individual", hiddenFields: ["expiry"], view: "회사의 모든 구성원", assign: "모든 관리자 및 리더" },
    // 서랍장: 등록된 자산이 아직 없는 소분류 샘플 — 분류 관리 모달에서 "활성 상태(삭제 가능)" 삭제 버튼을 보여주기 위한 용도
    { group: "가구류", sub: "서랍장", type: "individual", hiddenFields: ["expiry"], view: "회사의 모든 구성원", assign: "모든 관리자 및 리더" },
    { group: "전자기기류", sub: "노트북", type: "individual", view: "모든 관리자 및 리더", assign: "모든 관리자 및 리더" },
    { group: "전자기기류", sub: "모니터", type: "individual", view: "모든 관리자 및 리더", assign: "특정 관리자/리더" },
    { group: "전자기기류", sub: "케이블·액세서리", type: "quantity", view: "회사의 모든 구성원", assign: "모든 관리자 및 리더" },
    { group: "소모품", sub: "유니폼", type: "quantity", view: "회사의 모든 구성원", assign: "특정 관리자/리더" },
    { group: "소모품", sub: "문구류", type: "quantity", view: "회사의 모든 구성원", assign: "회사의 모든 구성원" },
  ];

  // 대분류만 생성되고 아직 소분류가 없는 상태(생성 직후 등)도 가능 — 샘플로 하나 둠
  const emptyGroups = ["비품"];

  // 개별 자산: 활성 배정(assignments) 0~N건. 각 레코드는 worksite/employee 중 정확히 1개.
  // 수량 자산: stocks 행별 수량. 각 행은 worksite/employee 중 정확히 1개.
  const assets = [
    { id: "A001", type: "individual", assetNo: "IT-2024-0012", product: "그램 16 (2024)", group: "전자기기류", sub: "노트북",
      status: "assigned", serial: "SN-8842-AA", createdAt: "2024-03-12", purchaseDate: "2024-03-11", price: 1890000, manufactured: "2024-01-20",
      expiry: "2027-03-10", note: "키보드 자판 일부 마모 확인 — 2025-06 교체 요청 이력 있음. 배정 반납 시 상태 재확인 필요. 트랙패드 클릭감 저하 민원 1건 접수돼 다음 정기 점검 때 같이 확인 요망.", photo: "#4b7bec", photoCount: 6,
      labels: ["본사", "개발팀"], assignments: [{ employee: "김민수", worksite: null, since: "2024-03-15" }] },
    { id: "A002", type: "individual", assetNo: "IT-2024-0013", product: "그램 16 (2024)", group: "전자기기류", sub: "노트북",
      status: "stock", serial: "SN-8842-AB", createdAt: "2024-03-12", purchaseDate: "2024-03-11", price: 1890000, expiry: "2027-03-10",
      labels: ["본사"], assignments: [] },
    // 같은 품목(그램 16 (2024))을 여러 인원에게 배정하는 실사용 규모(인원 50명 미만인 회사도 동일 모델 10대+ 보유 흔함) 반영용 —
    // 정보는 A001/A002와 대부분 동일(같은 구매 배치), 고유관리번호/상태/배정 대상만 다름
    { id: "A011", type: "individual", assetNo: "IT-2024-0014", product: "그램 16 (2024)", group: "전자기기류", sub: "노트북",
      status: "assigned", serial: "SN-8842-AC", createdAt: "2024-03-12", purchaseDate: "2024-03-11", price: 1890000, expiry: "2027-03-10",
      labels: ["개발팀"], assignments: [{ employee: "이서연", worksite: null, since: "2024-04-02" }] },
    { id: "A012", type: "individual", assetNo: "IT-2024-0015", product: "그램 16 (2024)", group: "전자기기류", sub: "노트북",
      status: "assigned", serial: "SN-8842-AD", createdAt: "2024-03-12", purchaseDate: "2024-03-11", price: 1890000, expiry: "2027-03-10",
      labels: [], assignments: [{ employee: "박지훈", worksite: null, since: "2024-05-11" }] },
    { id: "A013", type: "individual", assetNo: "IT-2024-0016", product: "그램 16 (2024)", group: "전자기기류", sub: "노트북",
      status: "assigned", serial: "SN-8842-AE", createdAt: "2024-03-12", purchaseDate: "2024-03-11", price: 1890000, expiry: "2027-03-10",
      labels: ["본사"], assignments: [{ employee: "정우성", worksite: null, since: "2024-06-20" }] },
    { id: "A014", type: "individual", assetNo: "IT-2024-0017", product: "그램 16 (2024)", group: "전자기기류", sub: "노트북",
      status: "assigned", serial: "SN-8842-AF", createdAt: "2024-03-12", purchaseDate: "2024-03-11", price: 1890000, expiry: "2027-03-10",
      labels: [], assignments: [{ employee: "김철수", worksite: null, since: "2024-07-15" }] },
    { id: "A015", type: "individual", assetNo: "IT-2024-0018", product: "그램 16 (2024)", group: "전자기기류", sub: "노트북",
      status: "stock", serial: "SN-8842-AG", createdAt: "2024-03-12", purchaseDate: "2024-03-11", price: 1890000, expiry: "2027-03-10",
      labels: [], assignments: [] },
    { id: "A016", type: "individual", assetNo: "IT-2024-0019", product: "그램 16 (2024)", group: "전자기기류", sub: "노트북",
      status: "stock", serial: "SN-8842-AH", createdAt: "2024-03-12", purchaseDate: "2024-03-11", price: 1890000, expiry: "2027-03-10",
      labels: [], assignments: [] },
    { id: "A017", type: "individual", assetNo: "IT-2024-0020", product: "그램 16 (2024)", group: "전자기기류", sub: "노트북",
      status: "stock", serial: "SN-8842-AI", createdAt: "2024-03-12", purchaseDate: "2024-03-11", price: 1890000, expiry: "2027-03-10",
      labels: ["본사"], assignments: [] },
    { id: "A018", type: "individual", assetNo: "IT-2024-0021", product: "그램 16 (2024)", group: "전자기기류", sub: "노트북",
      status: "repair", serial: "SN-8842-AJ", createdAt: "2024-03-12", purchaseDate: "2024-03-11", price: 1890000, expiry: "2027-03-10",
      note: "2026-08 키보드 오작동으로 수리 접수, 센터 입고", labels: ["수리이력"],
      assignments: [{ employee: "최유진", worksite: null, since: "2024-08-01" }] },
    { id: "A019", type: "individual", assetNo: "IT-2024-0022", product: "그램 16 (2024)", group: "전자기기류", sub: "노트북",
      status: "lost", serial: "SN-8842-AK", createdAt: "2024-03-12", purchaseDate: "2024-03-11", price: 1890000, expiry: "2027-03-10",
      note: "2026-07 재택 반출 후 미회수, 분실 신고", labels: ["분실추적"],
      assignments: [{ employee: "한소희", worksite: null, since: "2024-09-05" }] },
    { id: "A020", type: "individual", assetNo: "IT-2024-0023", product: "그램 16 (2024)", group: "전자기기류", sub: "노트북",
      status: "disposed", serial: "SN-8842-AL", createdAt: "2024-03-12", purchaseDate: "2024-03-11", price: 1890000, expiry: "2027-03-10",
      labels: [], assignments: [] },
    { id: "A003", type: "individual", assetNo: "IT-2023-0090", product: "맥북 프로 14", group: "전자기기류", sub: "노트북",
      status: "repair", serial: "C02XR-99", createdAt: "2023-08-03", purchaseDate: "2023-08-02", price: 2690000, expiry: "", photo: "#8854d0", photoCount: 8,
      note: "2026-08 배터리 스웰링으로 수리 접수, 센터 입고", labels: ["디자인팀"],
      assignments: [{ employee: "이서연", worksite: null, since: "2023-08-10" }] },
    { id: "A004", type: "individual", assetNo: "FN-2022-0031", product: "시디즈 T50", group: "가구류", sub: "의자",
      status: "assigned", serial: "", createdAt: "2022-05-23", purchaseDate: "2022-05-20", price: 320000, expiry: "", photo: "#26a69a",
      labels: ["강남점"], assignments: [{ employee: null, worksite: "강남점", since: "2022-06-01" }] },
    { id: "A005", type: "individual", assetNo: "FN-2022-0032", product: "시디즈 T50", group: "가구류", sub: "의자",
      status: "assigned", serial: "", createdAt: "2022-05-23", purchaseDate: "2022-05-20", price: 320000, expiry: "",
      labels: [], assignments: [
        { employee: "박지훈", worksite: null, since: "2023-01-04" },
        { employee: null, worksite: "강남점", since: "2023-06-01" },
        { employee: null, worksite: "판교점", since: "2024-02-11" },
      ] },
    { id: "A006", type: "individual", assetNo: "IT-2021-0005", product: "델 U2720Q", group: "전자기기류", sub: "모니터",
      status: "lost", serial: "CN-0KL-77", createdAt: "2021-11-16", purchaseDate: "2021-11-15", price: 690000, expiry: "",
      note: "2026-07 재택 반출 후 미회수, 분실 신고", labels: ["분실추적"],
      assignments: [{ employee: "정우성", worksite: null, since: "2022-01-10" }] },
    { id: "A007", type: "individual", assetNo: "IT-2020-0001", product: "HP 프로북 450", group: "전자기기류", sub: "노트북",
      status: "disposed", serial: "5CD-0-AA", createdAt: "2020-02-03", purchaseDate: "2020-02-01", price: 950000, expiry: "",
      labels: [], assignments: [] },
    { id: "A008", type: "individual", assetNo: "FN-2025-0101", product: "데스커 1400", group: "가구류", sub: "책상",
      status: "assigned", serial: "", createdAt: "2025-01-21", purchaseDate: "2025-01-20", price: 210000, expiry: "", photo: "#8395a7",
      labels: ["판교점"], assignments: [{ employee: null, worksite: "판교점", since: "2025-02-01" }] },
    { id: "A009", type: "individual", assetNo: "FN-2025-0102", product: "데스커 1400", group: "가구류", sub: "책상",
      status: "stock", serial: "", createdAt: "2025-03-11", purchaseDate: "2025-03-10", price: 210000, expiry: "",
      labels: [], assignments: [] },
    { id: "A010", type: "individual", assetNo: "IT-2022-0210", product: "씽크패드 X1", group: "전자기기류", sub: "노트북",
      status: "stock", serial: "PF-2K9X-11", createdAt: "2022-06-10", purchaseDate: "2022-06-09", price: 1650000, expiry: "2026-07-01",
      labels: [], assignments: [] },
    // 구성원별·근무지별 "배정된 자산" 칩·모달의 5개 초과 오버플로("+N") 케이스를 화면에서 실제로 볼 수 있게,
    // 구성원 1명(오세훈)·근무지 1곳(본사)에 소분류 7종(5개 초과)을 걸치도록 자산을 추가함(서랍장은 분류 관리
    // 모달의 "활성 상태 삭제" 테스트용 빈 소분류라 그대로 비워둠)
    { id: "A021", type: "individual", assetNo: "FN-2025-0103", product: "데스커 1400", group: "가구류", sub: "책상",
      status: "assigned", serial: "", createdAt: "2025-01-21", purchaseDate: "2025-01-20", price: 210000, expiry: "",
      labels: [], assignments: [{ employee: "오세훈", worksite: null, since: "2025-03-02" }] },
    { id: "A022", type: "individual", assetNo: "FN-2022-0033", product: "시디즈 T50", group: "가구류", sub: "의자",
      status: "assigned", serial: "", createdAt: "2022-05-23", purchaseDate: "2022-05-20", price: 320000, expiry: "",
      labels: [], assignments: [{ employee: "오세훈", worksite: null, since: "2022-07-14" }] },
    { id: "A023", type: "individual", assetNo: "IT-2023-0091", product: "맥북 프로 14", group: "전자기기류", sub: "노트북",
      status: "assigned", serial: "C02XR-A1", createdAt: "2023-08-03", purchaseDate: "2023-08-02", price: 2690000, expiry: "",
      labels: [], assignments: [{ employee: "오세훈", worksite: null, since: "2023-09-01" }] },
    { id: "A024", type: "individual", assetNo: "IT-2021-0006", product: "델 U2720Q", group: "전자기기류", sub: "모니터",
      status: "assigned", serial: "CN-0KL-78", createdAt: "2021-11-16", purchaseDate: "2021-11-15", price: 690000, expiry: "",
      labels: [], assignments: [{ employee: "오세훈", worksite: null, since: "2022-02-05" }] },
    { id: "A025", type: "individual", assetNo: "FN-2025-0104", product: "데스커 1400", group: "가구류", sub: "책상",
      status: "assigned", serial: "", createdAt: "2025-01-21", purchaseDate: "2025-01-20", price: 210000, expiry: "",
      labels: ["본사"], assignments: [{ employee: null, worksite: "본사", since: "2025-04-10" }] },
    { id: "A026", type: "individual", assetNo: "FN-2022-0034", product: "시디즈 T50", group: "가구류", sub: "의자",
      status: "assigned", serial: "", createdAt: "2022-05-23", purchaseDate: "2022-05-20", price: 320000, expiry: "",
      labels: ["본사"], assignments: [{ employee: null, worksite: "본사", since: "2022-08-20" }] },
    { id: "A027", type: "individual", assetNo: "IT-2022-0211", product: "씽크패드 X1", group: "전자기기류", sub: "노트북",
      status: "assigned", serial: "PF-2K9X-12", createdAt: "2022-06-10", purchaseDate: "2022-06-09", price: 1650000, expiry: "2026-07-01",
      labels: ["본사"], assignments: [{ employee: null, worksite: "본사", since: "2022-09-01" }] },
    { id: "A028", type: "individual", assetNo: "IT-2021-0007", product: "델 U2720Q", group: "전자기기류", sub: "모니터",
      status: "assigned", serial: "CN-0KL-79", createdAt: "2021-11-16", purchaseDate: "2021-11-15", price: 690000, expiry: "",
      labels: ["본사"], assignments: [{ employee: null, worksite: "본사", since: "2022-03-01" }] },

    // total_qty 120, 배분합계 115 — 잔여 5개(미배분, 소진 아님) 시연용. 한소희는 0개 보유(소진이 아닌
    // 품목에 속한 0개짜리 보유 대상이라 "미보유대상" 통계에 실제로 잡히는 유일한 샘플)
    { id: "A101", type: "quantity", assetNo: "", product: "2026 하복 유니폼", group: "소모품", sub: "유니폼",
      status: "held", totalQty: 120, serial: "", createdAt: "2026-04-02", purchaseDate: "2026-04-01", price: 18000, manufactured: "2026-03-15",
      expiry: "2027-04-01", note: "L/XL 사이즈 위주 소진 빠름", photo: "#e67e22", photoCount: 10,
      labels: ["하복"], stocks: [
        { worksite: "강남점", employee: null, qty: 60 },
        { worksite: "판교점", employee: null, qty: 40 },
        { worksite: null, employee: "김철수", qty: 12 },
        { worksite: null, employee: "오세훈", qty: 3 },
        { worksite: null, employee: "한소희", qty: 0 },
      ] },
    { id: "A102", type: "quantity", assetNo: "", product: "USB-C 케이블 2m", group: "전자기기류", sub: "케이블·액세서리",
      status: "held", totalQty: 47, serial: "", createdAt: "2025-09-11", purchaseDate: "2025-09-10", price: 9000, expiry: "",
      labels: [], stocks: [
        { worksite: "본사", employee: null, qty: 34 },
        { worksite: "강남점", employee: null, qty: 8 },
        { worksite: null, employee: "오세훈", qty: 5 },
      ] },
    { id: "A103", type: "quantity", assetNo: "", product: "A4 복사용지", group: "소모품", sub: "문구류",
      status: "held", totalQty: 10, serial: "", createdAt: "2026-06-02", purchaseDate: "2026-06-01", price: 4200, expiry: "2028-06-01",
      labels: ["소모"], stocks: [
        { worksite: "본사", employee: null, qty: 0 },
        { worksite: null, employee: "오세훈", qty: 10 },
      ] },
    { id: "A104", type: "quantity", assetNo: "", product: "2025 동복 유니폼", group: "소모품", sub: "유니폼",
      status: "held", totalQty: 33, serial: "", createdAt: "2025-10-02", purchaseDate: "2025-10-01", price: 24000, expiry: "2026-09-08",
      labels: ["동복"], stocks: [
        { worksite: "판교점", employee: null, qty: 25 },
        { worksite: "본사", employee: null, qty: 8 },
      ] },
    // 보유 대상 0건(전액 미배분) 샘플 — 상세 페이지 보유 현황 빈 상태 문구 + 전체 탭 "재고" 상태 확인용.
    // total_qty는 있는데(20개 구매) 아직 아무에게도 배분 안 한 상태 — 배분합계 0 → 재고
    { id: "A105", type: "quantity", assetNo: "", product: "무선 마우스", group: "전자기기류", sub: "케이블·액세서리",
      status: "stock", totalQty: 20, serial: "", createdAt: "2026-08-01", purchaseDate: "2026-07-30", price: 25000, expiry: "",
      labels: [], stocks: [] },
  ];

  // 태그 마스터 목록 — 기존 자산들에 찍힌 distinct 라벨로 초기 시드(태그 관리 모달 도입 이후로는 이 배열이 기준이 됨)
  const tags = [...new Set(assets.flatMap(a => a.labels || []))].sort((a, b) => a.localeCompare(b, "ko"));

  // 최근 수정일시 — 실제로는 AssetActivity(5.5)에서 자산별 최근 이벤트 시각을 파생하는 것과 동일한 개념.
  // 상세 화면 이력(detail.js의 activityOf)이 만들어내는 이벤트와 같은 소스 기준으로, 그중 가장 늦은 날짜를 미리 계산해둠
  assets.forEach(a => {
    const dates = [a.createdAt || a.purchaseDate || "2024-01-01"];
    (a.assignments || []).forEach(x => dates.push(x.since));
    if ((a.stocks || []).length) dates.push(a.purchaseDate || "2025-01-01");
    if (a.status === "repair") dates.push("2026-08-14");
    if (a.status === "lost") dates.push("2026-07-21");
    if (a.status === "disposed") dates.push("2025-12-30");
    if (a.note) dates.push("2026-06-02");
    a.updatedAt = dates.reduce((max, d) => (d > max ? d : max));
  });

  return { categories, assets, emptyGroups, tags };
})();

/* 자산 관리 공통 날짜 표기: yyyy.mm.dd(요일) hh:mm / 날짜만: yyyy.mm.dd(요일) */
(function () {
  const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
  const p = n => String(n).padStart(2, "0");
  const parse = s => new Date(String(s).replace(" ", "T"));
  window.fmtDate = s => { if (!s) return "—"; const d = parse(s); return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}(${DAYS[d.getDay()]})`; };
  window.fmtDateTime = s => { if (!s) return "—"; const d = parse(s); return `${window.fmtDate(s)} ${p(d.getHours())}:${p(d.getMinutes())}`; };
})();

/* 공통 사진 헬퍼 — 목록·상세가 같은 대표 사진을 쓰도록 공유 */
window.tintHex = function (hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const cl = v => Math.max(0, Math.min(255, v));
  const r = cl((n >> 16) + amt), g = cl(((n >> 8) & 255) + amt), b = cl((n & 255) + amt);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};
window.assetPhotos = (function () {
  const TINTS = [0, 26, -24, 42, -40, 14, -12, 34, -30, 8];
  const DATES = ["2026-08-28 14:10", "2026-08-28 14:12", "2026-07-15 09:33", "2026-07-15 09:34", "2026-06-02 17:20", "2026-06-02 17:22", "2026-05-20 11:05", "2026-05-20 11:06", "2026-04-10 08:48", "2026-04-10 08:49"];
  const BY = ["dana", "김민수", "dana", "이서연", "dana", "김민수", "dana", "이서연", "dana", "김민수"];
  return function (a) {
    if (a._photos) return a._photos;
    if (!a.photo) return (a._photos = []);
    a._primary = 0;
    return (a._photos = TINTS.slice(0, a.photoCount || 5).map((t, i) => ({
      color: t === 0 ? a.photo : window.tintHex(a.photo, t),
      at: DATES[i], by: BY[i],
    })));
  };
})();
