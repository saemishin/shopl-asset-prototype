/* Sample data for the prototype. Not a real schema — mirrors 구조설계안 fields. */
window.DATA = (function () {
  // 분류: 대분류 > 소분류(개별형/수량형)
  const categories = [
    { group: "가구류", sub: "책상", type: "individual" },
    { group: "가구류", sub: "의자", type: "individual" },
    { group: "전자기기류", sub: "노트북", type: "individual" },
    { group: "전자기기류", sub: "모니터", type: "individual" },
    { group: "전자기기류", sub: "케이블·액세서리", type: "quantity" },
    { group: "소모품", sub: "유니폼", type: "quantity" },
    { group: "소모품", sub: "문구류", type: "quantity" },
  ];

  // 개별형 자산: 활성 배정(assignments) 0~N건. worksite/employee 중 최소 1.
  // 수량형 자산: stocks 행별 수량.
  const assets = [
    { id: "A001", type: "individual", assetNo: "IT-2024-0012", product: "그램 16 (2024)", group: "전자기기류", sub: "노트북",
      status: "assigned", serial: "SN-8842-AA", purchaseDate: "2024-03-11", price: 1890000, manufactured: "2024-01-20",
      expiry: "2027-03-10", note: "키보드 자판 일부 마모 — 2025-06 교체 요청 이력",
      labels: ["본사", "개발팀"], assignments: [{ employee: "김민수", worksite: null, since: "2024-03-15" }] },
    { id: "A002", type: "individual", assetNo: "IT-2024-0013", product: "그램 16 (2024)", group: "전자기기류", sub: "노트북",
      status: "stock", serial: "SN-8842-AB", purchaseDate: "2024-03-11", price: 1890000, expiry: "2027-03-10",
      labels: ["본사"], assignments: [] },
    { id: "A003", type: "individual", assetNo: "IT-2023-0090", product: "맥북 프로 14", group: "전자기기류", sub: "노트북",
      status: "repair", serial: "C02XR-99", purchaseDate: "2023-08-02", price: 2690000, expiry: "",
      labels: ["디자인팀"], assignments: [{ employee: "이서연", worksite: null, since: "2023-08-10" }] },
    { id: "A004", type: "individual", assetNo: "FN-2022-0031", product: "시디즈 T50", group: "가구류", sub: "의자",
      status: "assigned", serial: "", purchaseDate: "2022-05-20", price: 320000, expiry: "",
      labels: ["강남점"], assignments: [{ employee: null, worksite: "강남점", since: "2022-06-01" }] },
    { id: "A005", type: "individual", assetNo: "FN-2022-0032", product: "시디즈 T50", group: "가구류", sub: "의자",
      status: "assigned", serial: "", purchaseDate: "2022-05-20", price: 320000, expiry: "",
      labels: [], assignments: [
        { employee: "박지훈", worksite: "강남점", since: "2023-01-04" },
        { employee: null, worksite: "판교점", since: "2024-02-11" },
      ] },
    { id: "A006", type: "individual", assetNo: "IT-2021-0005", product: "델 U2720Q", group: "전자기기류", sub: "모니터",
      status: "lost", serial: "CN-0KL-77", purchaseDate: "2021-11-15", price: 690000, expiry: "",
      labels: ["분실추적"], assignments: [{ employee: "정우성", worksite: null, since: "2022-01-10" }] },
    { id: "A007", type: "individual", assetNo: "IT-2020-0001", product: "HP 프로북 450", group: "전자기기류", sub: "노트북",
      status: "disposed", serial: "5CD-0-AA", purchaseDate: "2020-02-01", price: 950000, expiry: "",
      labels: [], assignments: [] },
    { id: "A008", type: "individual", assetNo: "FN-2025-0101", product: "데스커 1400", group: "가구류", sub: "책상",
      status: "assigned", serial: "", purchaseDate: "2025-01-20", price: 210000, expiry: "",
      labels: ["판교점"], assignments: [{ employee: null, worksite: "판교점", since: "2025-02-01" }] },

    { id: "A101", type: "quantity", assetNo: "", product: "2026 하복 유니폼", group: "소모품", sub: "유니폼",
      status: null, serial: "", purchaseDate: "2026-04-01", price: 18000, manufactured: "2026-03-15",
      expiry: "2027-04-01", note: "L/XL 사이즈 위주 소진 빠름",
      labels: ["하복"], stocks: [
        { worksite: "강남점", employee: null, qty: 60 },
        { worksite: "판교점", employee: null, qty: 40 },
        { worksite: "강남점", employee: "김철수", qty: 12 },
      ] },
    { id: "A102", type: "quantity", assetNo: "", product: "USB-C 케이블 2m", group: "전자기기류", sub: "케이블·액세서리",
      status: null, serial: "", purchaseDate: "2025-09-10", price: 9000, expiry: "",
      labels: [], stocks: [
        { worksite: "본사", employee: null, qty: 34 },
        { worksite: "강남점", employee: null, qty: 8 },
      ] },
    { id: "A103", type: "quantity", assetNo: "", product: "A4 복사용지", group: "소모품", sub: "문구류",
      status: null, serial: "", purchaseDate: "2026-06-01", price: 4200, expiry: "2028-06-01",
      labels: ["소모"], stocks: [
        { worksite: "본사", employee: null, qty: 0 },
      ] },
    { id: "A104", type: "quantity", assetNo: "", product: "2025 동복 유니폼", group: "소모품", sub: "유니폼",
      status: null, serial: "", purchaseDate: "2025-10-01", price: 24000, expiry: "2026-09-08",
      labels: ["동복"], stocks: [
        { worksite: "판교점", employee: null, qty: 25 },
      ] },
  ];

  return { categories, assets };
})();
