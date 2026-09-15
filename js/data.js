/* Sample data for the prototype. Not a real schema — mirrors 구조설계안 fields. */
window.DATA = (function () {
  // 분류: 대분류 > 소분류(개별형/수량형)
  // hiddenFields: 소분류 필드 노출 설정에서 off된 선택 필드(구조안 3.3). 상세에서 해당 행 자체를 숨김
  // view/assign: 자산 조회 권한 / 배정·보유 변경 권한(구조안 4.3) — assign은 항상 view의 부분집합
  const categories = [
    { group: "가구류", sub: "책상", type: "individual", hiddenFields: ["expiry"], view: "회사의 모든 구성원", assign: "모든 관리자 및 리더" },
    { group: "가구류", sub: "의자", type: "individual", hiddenFields: ["expiry"], view: "회사의 모든 구성원", assign: "모든 관리자 및 리더" },
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

    { id: "A101", type: "quantity", assetNo: "", product: "2026 하복 유니폼", group: "소모품", sub: "유니폼",
      status: null, serial: "", createdAt: "2026-04-02", purchaseDate: "2026-04-01", price: 18000, manufactured: "2026-03-15",
      expiry: "2027-04-01", note: "L/XL 사이즈 위주 소진 빠름", photo: "#e67e22", photoCount: 10,
      labels: ["하복"], stocks: [
        { worksite: "강남점", employee: null, qty: 60 },
        { worksite: "판교점", employee: null, qty: 40 },
        { worksite: null, employee: "김철수", qty: 12 },
      ] },
    { id: "A102", type: "quantity", assetNo: "", product: "USB-C 케이블 2m", group: "전자기기류", sub: "케이블·액세서리",
      status: null, serial: "", createdAt: "2025-09-11", purchaseDate: "2025-09-10", price: 9000, expiry: "",
      labels: [], stocks: [
        { worksite: "본사", employee: null, qty: 34 },
        { worksite: "강남점", employee: null, qty: 8 },
      ] },
    { id: "A103", type: "quantity", assetNo: "", product: "A4 복사용지", group: "소모품", sub: "문구류",
      status: null, serial: "", createdAt: "2026-06-02", purchaseDate: "2026-06-01", price: 4200, expiry: "2028-06-01",
      labels: ["소모"], stocks: [
        { worksite: "본사", employee: null, qty: 0 },
      ] },
    { id: "A104", type: "quantity", assetNo: "", product: "2025 동복 유니폼", group: "소모품", sub: "유니폼",
      status: null, serial: "", createdAt: "2025-10-02", purchaseDate: "2025-10-01", price: 24000, expiry: "2026-09-08",
      labels: ["동복"], stocks: [
        { worksite: "판교점", employee: null, qty: 25 },
      ] },
  ];

  return { categories, assets, emptyGroups };
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
