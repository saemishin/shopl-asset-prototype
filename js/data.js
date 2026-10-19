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
      // 공동 배정 샘플(구조설계안 2.3) — 앱 자산 상세의 "공동 배정 대상" 정보 섹션 확인용으로 이서연을 공동 배정자로 추가(2026-09-27)
      labels: ["본사", "개발팀"], assignments: [{ employee: "김민수", worksite: null, since: "2024-03-15" }, { employee: "이서연", worksite: null, since: "2024-05-01" }] },
    // 배정 추가 상한 테스트용 — 자산 하나당 활성 배정 최대 5건(구조설계안 2.1·6)을 꽉 채운 샘플(2026-09-30,
    // 원래 status:"stock"/assignments:[] 재고 샘플이었으나 A015/A016도 같은 역할이라 이걸로 대체)
    { id: "A002", type: "individual", assetNo: "IT-2024-0013", product: "그램 16 (2024)", group: "전자기기류", sub: "노트북",
      status: "assigned", serial: "SN-8842-AB", createdAt: "2024-03-12", purchaseDate: "2024-03-11", price: 1890000, expiry: "2027-03-10",
      labels: ["본사"], assignments: [
        { employee: "김민수", worksite: null, since: "2024-04-01" },
        { employee: "이서연", worksite: null, since: "2024-05-01" },
        { employee: "박지훈", worksite: null, since: "2024-06-01" },
        { employee: "정우성", worksite: null, since: "2024-07-01" },
        { employee: null, worksite: "강남점", since: "2024-08-01" },
      ] },
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
      note: "2026-08 키보드 오작동으로 수리/점검 접수, 센터 입고", labels: ["수리이력"],
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
      note: "2026-08 배터리 스웰링으로 수리/점검 접수, 센터 입고", labels: ["디자인팀"],
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
    // 근무지 자산 "조회 가능한 자산이 하나도 없는 근무지" 빈 상태 데모용(2026-09-30) — 역삼점(김민수의 담당
    // 근무지, app.js MY_WORKSITES)의 유일한 자산이 모니터(조회 권한 "모든 관리자 및 리더", 관리자/리더 필드가
    // 없는 이 프로토타입에선 전원 필터링)라 근무지 자산 화면에서 역삼점 카드가 "전체 0"+빈 상태로 뜸
    { id: "A029", type: "individual", assetNo: "IT-2021-0008", product: "델 U2720Q", group: "전자기기류", sub: "모니터",
      status: "assigned", serial: "CN-0KL-80", createdAt: "2021-11-16", purchaseDate: "2021-11-15", price: 690000, expiry: "",
      labels: ["역삼점"], assignments: [{ employee: null, worksite: "역삼점", since: "2022-03-01" }] },

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
    // 보유 대상 21건(20개 페이지네이션 확인용 — 근무지 3곳+기존 구성원 12명만으론 15건뿐이라 부족해서
    // 신규 구성원 6명 추가. 다만 이번엔 데모 전용이라 MEMBERS/MEMBER_INFO/EMP_GROUP엔 등록 안 함(그 목록들에
    // 없어도 assignIdentity()가 "—"로 무해하게 처리) — "보유 대상 추가" 후보 목록엔 안 뜨는 점 참고
    { id: "A106", type: "quantity", assetNo: "", product: "네임펜 세트", group: "소모품", sub: "문구류",
      status: "held", totalQty: 70, serial: "", createdAt: "2026-03-02", purchaseDate: "2026-03-01", price: 3500, expiry: "",
      labels: [], stocks: [
        { worksite: "강남점", employee: null, qty: 8 },
        { worksite: "판교점", employee: null, qty: 6 },
        { worksite: "본사", employee: null, qty: 10 },
        { worksite: null, employee: "김민수", qty: 2 },
        { worksite: null, employee: "이서연", qty: 3 },
        { worksite: null, employee: "박지훈", qty: 1 },
        { worksite: null, employee: "정우성", qty: 4 },
        { worksite: null, employee: "김철수", qty: 0 },
        { worksite: null, employee: "최유진", qty: 2 },
        { worksite: null, employee: "한소희", qty: 3 },
        { worksite: null, employee: "장민호", qty: 1 },
        { worksite: null, employee: "오세훈", qty: 5 },
        { worksite: null, employee: "배수지", qty: 2 },
        { worksite: null, employee: "윤재현", qty: 3 },
        { worksite: null, employee: "임하늘", qty: 1 },
        { worksite: null, employee: "신동욱", qty: 2 },
        { worksite: null, employee: "구자영", qty: 1 },
        { worksite: null, employee: "황민재", qty: 3 },
        { worksite: null, employee: "서지우", qty: 2 },
        { worksite: null, employee: "권태호", qty: 4 },
        { worksite: null, employee: "나윤아", qty: 1 },
      ] },
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

  // 자산 삭제는 상세 → 목록으로 실제 페이지 이동(location.href)이 뒤따르는데, 이 앱은 인메모리 전용이라
  // 이동한 페이지에서 이 스크립트가 처음부터 다시 실행되며 방금 한 splice가 무효화됨 — 그래서 삭제 직전에
  // sessionStorage에 남겨둔 id를 여기서 한 번 더 적용해 페이지가 바뀌어도 삭제가 유지되게 함
  const deletedAssets = [];
  try {
    const saved = sessionStorage.getItem("justDeletedAssetRecord");
    if (saved) { deletedAssets.push(JSON.parse(saved)); sessionStorage.removeItem("justDeletedAssetRecord"); }
    const delId = sessionStorage.getItem("justDeletedAssetId");
    if (delId) {
      sessionStorage.removeItem("justDeletedAssetId");
      const idx = assets.findIndex(a => a.id === delId);
      if (idx > -1) assets.splice(idx, 1);
    }
  } catch (e) { /* sessionStorage 접근 불가 환경 대비 */ }

  // 배정/보유 대상의 상태를 기존 구성원·근무지 응답에서 전달받는 프로토타입 연결 지점.
  // employee: active/retired, worksite: active/inactive. 값이 없는 기존 데모 대상은 활성으로 가정한다.
  // 실제 앱에서는 이름 키 대신 기존 대상 ID/상태 응답을 사용하며, 자산 상태와 혼동하지 않는다.
  // 상태가 바뀌어도 기존 배정/보유 레코드나 수량은 여기서 자동 변경하지 않는다.
  const targetStatuses = { employee: {}, worksite: {} };
  return { categories, assets, deletedAssets, emptyGroups, tags, targetStatuses };
})();

/* 자산 관리 공통 날짜 표기: yyyy.mm.dd(요일) hh:mm / 날짜만: yyyy.mm.dd(요일) */
(function () {
  const DAYS = ["일", "월", "화", "수", "목", "금", "토"];
  const p = n => String(n).padStart(2, "0");
  const parse = s => new Date(String(s).replace(" ", "T"));
  window.fmtDate = s => { if (!s) return "—"; const d = parse(s); return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}(${DAYS[d.getDay()]})`; };
  window.fmtDateTime = s => { if (!s) return "—"; const d = parse(s); return `${window.fmtDate(s)} ${p(d.getHours())}:${p(d.getMinutes())}`; };
  // 제조연월·구매연월 전용(2026-09-30, 일 단위 제거 — 저장은 그대로 YYYY-MM-01이라 일자를 무시하고 연월만 표기)
  window.fmtMonth = s => { if (!s) return "—"; const d = parse(s); return `${d.getFullYear()}.${p(d.getMonth() + 1)}`; };
})();

/* 그룹·직무/직급 권한 판정(2026-10-13): 기존 Shopl 그룹/직무 대상 선택 기준을 준용한다.
   같은 축의 여러 선택은 OR, 그룹과 직무/직급 사이에는 AND. 한 축만 지정하면 다른 축은 전체이며
   양쪽 모두 미선택은 미설정(조회 허용 아님). 하위 그룹은 선택기에서 함께 선택한 실제 목록으로 판정한다.
   아래 직무/직급은 기존 데모 구성원을 위한 샘플일 뿐, 직무명으로 관리자/리더 역할을 추정하지 않는다.
   실 서비스는 그룹 ID·직무/직급 ID와 명시적 전체 플래그를 사용하고 회사 권한/조회 예외를 별도 판정한다. */
window.ASSET_MEMBER_JOB_TITLES = {
  "김민수": "팀장", "이서연": "매니저", "박지훈": "매니저", "정우성": "사원",
  "김철수": "팀장", "최유진": "주임", "한소희": "사원", "장민호": "매니저",
  "오세훈": "주임", "배수지": "사원", "윤재현": "매니저", "임하늘": null,
};
window.matchesAssetGroupPositionTarget = function (target, group, jobTitle) {
  const groups = target?.groups || [], jobs = target?.jobTitles || [];
  if (!groups.length && !jobs.length) return false;
  const matchesGroup = !groups.length || groups.includes(group);
  const matchesJob = !jobs.length || (jobTitle !== undefined && jobs.includes(jobTitle || "직무/직급 없음"));
  return matchesGroup && matchesJob;
};
window.isAssetGroupPositionSubset = function (target, viewTarget) {
  const groups = target?.groups || [], jobs = target?.jobTitles || [];
  const viewGroups = viewTarget?.groups || [], viewJobs = viewTarget?.jobTitles || [];
  if ((!groups.length && !jobs.length) || (!viewGroups.length && !viewJobs.length)) return false;
  return [[groups, viewGroups], [jobs, viewJobs]]
    .every(([selected, allowed]) => !allowed.length || (selected.length > 0 && selected.every(value => allowed.includes(value))));
};

/* 구매가격 통화 표기 — 자산마다 다른 게 아니라 클라이언트(회사) 단위로 하나만 설정되는 전역 값(구조설계안 3.4).
   통화 코드마다 기호 위치(접두/접미)가 달라서 표시 로직을 한 곳에 모아둠 — CLIENT_CURRENCY만 바꾸면
   화면·엑셀 전체의 구매가격 표기가 같이 바뀜. 지금은 회사 설정 화면이 없어 상수로 고정(기본값 KRW) */
(function () {
  const CURRENCY_FORMATS = {
    KRW: { symbol: "원", position: "suffix" },
    USD: { symbol: "$", position: "prefix" },
    JPY: { symbol: "円", position: "suffix" },
    EUR: { symbol: "€", position: "prefix" },
  };
  window.CLIENT_CURRENCY = "KRW";
  // 구매가격 공통 정책(2026-10-13): 구분자를 제외한 정수부 12자리, 소수부 5자리.
  // 정수 표시의 15자에 소수점/소수부는 별도로 더해진다. 숫자로 변환하면 큰 소수 금액의
  // 끝자리가 반올림되므로 편집·저장·표시는 십진 문자열로 처리한다(기존 숫자 시드도 호환).
  const PRICE_INTEGER_DIGITS = 12;
  const PRICE_FRACTION_DIGITS = 5;
  function priceInputText(value) {
    const raw = String(value ?? "").replace(/,/g, "").replace(/[^0-9.]/g, "");
    if (!raw) return "";
    const [integer, ...fractions] = raw.split(".");
    const whole = integer.replace(/^0+(?=\d)/, "").slice(0, PRICE_INTEGER_DIGITS) || "0";
    return whole + (fractions.length ? "." + fractions.join("").slice(0, PRICE_FRACTION_DIGITS) : "");
  }
  window.normalizePurchasePrice = function (value) {
    const raw = priceInputText(value);
    if (!raw) return "";
    const [integer, fraction = ""] = raw.split(".");
    const significantFraction = fraction.replace(/0+$/, "");
    return integer + (significantFraction ? "." + significantFraction : "");
  };
  window.formatPurchasePriceInput = function (value) {
    const raw = priceInputText(value);
    if (!raw) return "";
    const [integer, fraction] = raw.split(".");
    return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (fraction !== undefined ? "." + fraction : "");
  };
  window.bindPurchasePriceInput = function (input) {
    input.addEventListener("input", () => {
      const position = input.selectionStart;
      const charactersBefore = input.value.slice(0, position).replace(/[^0-9.]/g, "").length;
      input.value = window.formatPurchasePriceInput(input.value);
      if (position != null) {
        let cursor = 0, seen = 0;
        while (cursor < input.value.length && seen < charactersBefore) {
          if (/[0-9.]/.test(input.value[cursor])) seen++;
          cursor++;
        }
        input.setSelectionRange(cursor, cursor);
      }
    });
  };
  window.formatPrice = function (amount) {
    if (amount == null || amount === "") return "";
    const fmt = CURRENCY_FORMATS[window.CLIENT_CURRENCY] || CURRENCY_FORMATS.KRW;
    const n = window.formatPurchasePriceInput(window.normalizePurchasePrice(amount));
    return fmt.position === "prefix" ? `${fmt.symbol}${n}` : `${n}${fmt.symbol}`;
  };
})();

/* 자산 사진 정책(2026-10-13): 사진당 20MB 수준의 기존 Shopl 공통 첨부 정책을 준용한다.
   대시보드 직접 파일은 JPEG/JPG·PNG 및 디코딩 검증, 앱은 공통 카메라/갤러리·변환/축소 경로를 사용한다.
   바이트 계산과 용량 검사 시점·변환 품질은 플랫폼 공통 코드에 위임하며 PSID의 10MB 예외는 가져오지 않는다.
   현재 사진 첨부는 색상 스와치 목업으로 실 파일 선택·용량 검사·압축·서버 업로드를 수행하지 않는다.
   실 서비스 구현에서 아래 장수 제한과 공통 첨부 검증/전처리를 함께 적용해야 한다. */
window.ASSET_PHOTO_MAX_COUNT = 10;
window.ASSET_TAG_MAX_COUNT = 10;

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
      id: `${a.id}-p${i + 1}`,
      color: t === 0 ? a.photo : window.tintHex(a.photo, t),
      at: DATES[i], by: BY[i],
    })));
  };
})();

/* 사진 활동 이력(2026-10-13 확정, 설계 기록 D-20261013-34 · 활동 이력 정책 2절)
 * - 사진 추가·삭제는 저장 1회당 "자산 사진 관리: 사진 변경" 1건. 추가와 삭제가 섞여도 1건이며
 *   기존 = 저장 전 목록 전체, 변경 = 저장 후 목록 전체(0장이면 "없음").
 * - "자산 사진 관리: 대표 사진 변경"은 저장 전후 대표가 다르고 양쪽 모두 대표가 있을 때만 기록한다.
 *   직접 지정과 대표 삭제에 따른 승계를 같게 다룬다. 0장에서 첫 추가·전부 삭제는 사진 변경만 남는다.
 * - 둘 다 해당하면 사진 변경 → 대표 사진 변경 순서로 기록한다. 원복해 전후가 같으면 아무것도 남기지 않는다.
 * - 자산 추가 때 첨부한 사진은 "자산 등록"에 포함하므로 추가 저장에서는 이 헬퍼를 호출하지 않는다.
 * 사진은 배열 위치가 아니라 id로 식별한다. 이력에는 복사본을 넣어 삭제된 사진도 계속 보여준다.
 * 프로토타입 사진은 색상 목업이라 썸네일도 색상 칸으로 그린다. */
window.assetPhotoId = (function () {
  let seq = 0;
  return () => `photo-${Date.now().toString(36)}-${++seq}`;
})();
window.assetPhotoActivities = function (beforePhotos, beforePrimary, afterPhotos, afterPrimary) {
  const key = p => p.id || [p.color, p.at, p.by].join("|");
  const copy = list => (list || []).map(p => ({ ...p }));
  const before = copy(beforePhotos), after = copy(afterPhotos);
  const entries = [];
  const sameList = before.length === after.length && before.every((p, i) => key(p) === key(after[i]));
  if (!sameList) entries.push({ script: "자산 사진 관리: 사진 변경", photoValue: true, before, after });
  const beforeMain = before[beforePrimary || 0] || null, afterMain = after[afterPrimary || 0] || null;
  if (beforeMain && afterMain && key(beforeMain) !== key(afterMain)) {
    entries.push({ script: "자산 사진 관리: 대표 사진 변경", photoValue: true, before: [beforeMain], after: [afterMain] });
  }
  return entries;
};
window.assetPhotoThumbsHtml = function (list) {
  if (!list || !list.length) return "없음";
  return `<span class="hval-photos">${list.map(p => `<span class="hval-photo" style="background:${p.color}"></span>`).join("")}</span>`;
};

/* 같은 저장에서 생긴 여러 활동의 표시 순서(2026-10-13 확정, 설계 기록 D-20261013-35 · 활동 이력 정책 4.1)
 * 이력은 최신이 위이고, 한 번의 저장으로 생긴 활동들은 자산 수정 입력 항목 순서대로 위에서 아래로 보여준다.
 * 사진만 저장한 경우도 사진 변경 → 대표 사진 변경 순서이다.
 * 각 화면의 logActivity는 새 항목을 맨 위에 넣으므로, 표시 순서의 역순으로 기록해야 화면에서 순서대로 보인다. */
window.ASSET_ACTIVITY_ORDER = [
  "자산 정보 수정: 소분류 이동", "자산 정보 수정: 품목명 수정",
  "자산 사진 관리: 사진 변경", "자산 사진 관리: 대표 사진 변경",
  "자산 정보 수정: 고유관리번호 수정", "자산 정보 수정: 전체 수량 변경",
  "자산 정보 수정: 유효기한 변경", "자산 정보 수정: 태그 수정",
  "자산 정보 수정: S/N 수정", "자산 정보 수정: IMEI 수정",
  "자산 정보 수정: 제조연월 변경", "자산 정보 수정: 구매연월 변경",
  "자산 정보 수정: 구매가격 변경", "자산 정보 수정: 메모 수정",
];
window.logAssetActivities = function (entries, log) {
  const rank = e => { const i = window.ASSET_ACTIVITY_ORDER.indexOf(e.script); return i < 0 ? window.ASSET_ACTIVITY_ORDER.length : i; };
  entries.map((e, i) => ({ e, i })).sort((x, y) => rank(x.e) - rank(y.e) || x.i - y.i).reverse().forEach(x => log(x.e));
};

/* 다운로드 파일명 계약(2026-10-13): 품목명 원문은 유지하고 파일명에만 적용한다.
 * 부적합 문자는 _, 같은 묶음의 동명 파일은 확장자 앞 (2), (3)...로 구분한다.
 * 실제 ZIP/엑셀 생성은 별도 개발 대상이며 현재 다운로드 버튼은 토스트 목업이다.
 */
window.assetDownloadFileName = function (value) {
  let name = String(value ?? '').replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').replace(/[. ]+$/g, '_');
  if (/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(name)) name = '_' + name;
  return name || '_';
};
window.assetDownloadFileNames = function (values) {
  const used = new Set();
  return values.map(value => {
    const name = window.assetDownloadFileName(value);
    const dot = name.lastIndexOf('.'), stem = dot > 0 ? name.slice(0, dot) : name;
    const extension = dot > 0 ? name.slice(dot) : '';
    let next = name, number = 2;
    while (used.has(next.toLowerCase())) next = `${stem} (${number++})${extension}`;
    used.add(next.toLowerCase());
    return next;
  });
};
// 삭제 이력은 사용자 화면에 별도 표시하지 않는다. 원본·활동·수행자·시점은 내부 보존한다.
// 정적 데모에서는 활성 배열에서 제외하고 별도 인메모리 기록으로 보존(API의 soft-delete 구현 아님).
window.archiveDeletedAsset = function (asset, actor) {
  const record = JSON.parse(JSON.stringify(asset));
  record.deleted_at = new Date().toISOString(); record.deleted_by = actor;
  window.DATA.deletedAssets.push(record);
  const index = window.DATA.assets.indexOf(asset);
  if (index > -1) window.DATA.assets.splice(index, 1);
  return record;
};
