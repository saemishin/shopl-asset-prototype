window.DATA = function () {
  const categories = [{
      group: "가구류",
      sub: "책상",
      type: "individual",
      hiddenFields: [],
      view: "회사의 모든 구성원",
      assign: "모든 관리자 및 리더"
    }, {
      group: "가구류",
      sub: "의자",
      type: "individual",
      hiddenFields: [],
      view: "회사의 모든 구성원",
      assign: "모든 관리자 및 리더"
    },
    // 서랍장: 등록된 자산이 아직 없는 소분류 샘플 — 분류 관리 모달에서 "활성 상태(삭제 가능)" 삭제 버튼을 보여주기 위한 용도
    {
      group: "가구류",
      sub: "서랍장",
      type: "individual",
      hiddenFields: [],
      view: "회사의 모든 구성원",
      assign: "모든 관리자 및 리더"
    }, {
      group: "전자기기류",
      sub: "노트북",
      type: "individual",
      view: "모든 관리자 및 리더",
      assign: "모든 관리자 및 리더"
    }, {
      group: "전자기기류",
      sub: "모니터",
      type: "individual",
      view: "모든 관리자 및 리더",
      assign: "특정 관리자/리더",
      assignTarget: {
        groups: [],
        jobTitles: [],
        members: ["이서연", "최유진"]
      }
    },
    // 권한 대상 조회 모달 확인용 — 기본 데모 사용자(김민수, 개발팀·팀장)가 계속 대상에 포함되도록 지정
    {
      group: "전자기기류",
      sub: "케이블·액세서리",
      type: "individual",
      view: "회사의 모든 구성원",
      assign: "특정 그룹 및 직무/직급",
      assignTarget: {
        groups: ["개발팀", "영업팀"],
        jobTitles: ["팀장"],
        members: []
      }
    }, {
      group: "소모품",
      sub: "유니폼",
      type: "individual",
      view: "회사의 모든 구성원",
      assign: "특정 관리자/리더"
    }, {
      group: "소모품",
      sub: "문구류",
      type: "individual",
      view: "회사의 모든 구성원",
      assign: "회사의 모든 구성원"
    }],
    emptyGroups = ["비품"],
    assets = [{
      id: "A001",
      type: "individual",
      assetNo: "IT-2024-0012",
      product: "그램 16 (2024)",
      group: "전자기기류",
      sub: "노트북",
      status: "assigned",
      serial: "SN-8842-AA",
      createdAt: "2024-03-12",
      purchaseDate: "2024-03-11",
      price: 189e4,
      manufactured: "2024-01-20",
      expiry: "2027-03-10",
      note: "키보드 자판 일부 마모 확인 — 2025-06 교체 요청 이력 있음. 배정 반납 시 상태 재확인 필요. 트랙패드 클릭감 저하 민원 1건 접수돼 다음 정기 점검 때 같이 확인 요망.",
      photo: "#4b7bec",
      photoCount: 6,
      labels: ["본사", "개발팀"],
      assignments: [{
        employee: "김민수",
        worksite: null,
        since: "2024-03-15"
      }]
    },
    {
      id: "A002",
      type: "individual",
      assetNo: "IT-2024-0013",
      product: "그램 16 (2024)",
      group: "전자기기류",
      sub: "노트북",
      status: "assigned",
      serial: "SN-8842-AB",
      createdAt: "2024-03-12",
      purchaseDate: "2024-03-11",
      price: 189e4,
      expiry: "2027-03-10",
      labels: ["본사"],
      // 자산 한 건은 한 대상에게만 배정한다(설계기록 D-20261030-14, 공동 배정 제거).
      assignments: [{
        employee: null,
        worksite: "강남점",
        since: "2024-08-01"
      }]
    },
    // 같은 품목(그램 16 (2024))을 여러 인원에게 배정하는 실사용 규모(인원 50명 미만인 회사도 동일 모델 10대+ 보유 흔함) 반영용 —
    // 정보는 A001/A002와 대부분 동일(같은 구매 배치), 고유관리번호/상태/배정 대상만 다름
    {
      id: "A011",
      type: "individual",
      assetNo: "IT-2024-0014",
      product: "그램 16 (2024)",
      group: "전자기기류",
      sub: "노트북",
      status: "assigned",
      serial: "SN-8842-AC",
      createdAt: "2024-03-12",
      purchaseDate: "2024-03-11",
      price: 189e4,
      expiry: "2027-03-10",
      labels: ["개발팀"],
      assignments: [{
        employee: "이서연",
        worksite: null,
        since: "2024-04-02"
      }]
    }, {
      id: "A012",
      type: "individual",
      assetNo: "IT-2024-0015",
      product: "그램 16 (2024)",
      group: "전자기기류",
      sub: "노트북",
      status: "assigned",
      serial: "SN-8842-AD",
      createdAt: "2024-03-12",
      purchaseDate: "2024-03-11",
      price: 189e4,
      expiry: "2027-03-10",
      labels: [],
      assignments: [{
        employee: "박지훈",
        worksite: null,
        since: "2024-05-11"
      }]
    }, {
      id: "A013",
      type: "individual",
      assetNo: "IT-2024-0016",
      product: "그램 16 (2024)",
      group: "전자기기류",
      sub: "노트북",
      status: "assigned",
      serial: "SN-8842-AE",
      createdAt: "2024-03-12",
      purchaseDate: "2024-03-11",
      price: 189e4,
      expiry: "2027-03-10",
      labels: ["본사"],
      assignments: [{
        employee: "정우성",
        worksite: null,
        since: "2024-06-20"
      }]
    }, {
      id: "A014",
      type: "individual",
      assetNo: "IT-2024-0017",
      product: "그램 16 (2024)",
      group: "전자기기류",
      sub: "노트북",
      status: "assigned",
      serial: "SN-8842-AF",
      createdAt: "2024-03-12",
      purchaseDate: "2024-03-11",
      price: 189e4,
      expiry: "2027-03-10",
      labels: [],
      assignments: [{
        employee: "김철수",
        worksite: null,
        since: "2024-07-15"
      }]
    }, {
      id: "A015",
      type: "individual",
      assetNo: "IT-2024-0018",
      product: "그램 16 (2024)",
      group: "전자기기류",
      sub: "노트북",
      status: "stock",
      serial: "SN-8842-AG",
      createdAt: "2024-03-12",
      purchaseDate: "2024-03-11",
      price: 189e4,
      expiry: "2027-03-10",
      labels: [],
      assignments: []
    }, {
      id: "A016",
      type: "individual",
      assetNo: "IT-2024-0019",
      product: "그램 16 (2024)",
      group: "전자기기류",
      sub: "노트북",
      status: "stock",
      serial: "SN-8842-AH",
      createdAt: "2024-03-12",
      purchaseDate: "2024-03-11",
      price: 189e4,
      expiry: "2027-03-10",
      labels: [],
      assignments: []
    }, {
      id: "A017",
      type: "individual",
      assetNo: "IT-2024-0020",
      product: "그램 16 (2024)",
      group: "전자기기류",
      sub: "노트북",
      status: "stock",
      serial: "SN-8842-AI",
      createdAt: "2024-03-12",
      purchaseDate: "2024-03-11",
      price: 189e4,
      expiry: "2027-03-10",
      labels: ["본사"],
      assignments: []
    }, {
      id: "A018",
      type: "individual",
      assetNo: "IT-2024-0021",
      product: "그램 16 (2024)",
      group: "전자기기류",
      sub: "노트북",
      status: "repair",
      serial: "SN-8842-AJ",
      createdAt: "2024-03-12",
      purchaseDate: "2024-03-11",
      price: 189e4,
      expiry: "2027-03-10",
      note: "2026-08 키보드 오작동으로 수리/점검 접수, 센터 입고",
      labels: ["수리이력"],
      assignments: [{
        employee: "최유진",
        worksite: null,
        since: "2024-08-01"
      }]
    }, {
      id: "A019",
      type: "individual",
      assetNo: "IT-2024-0022",
      product: "그램 16 (2024)",
      group: "전자기기류",
      sub: "노트북",
      status: "lost",
      serial: "SN-8842-AK",
      createdAt: "2024-03-12",
      purchaseDate: "2024-03-11",
      price: 189e4,
      expiry: "2027-03-10",
      note: "2026-07 재택 반출 후 미회수, 분실 신고",
      labels: ["분실추적"],
      assignments: [{
        employee: "한소희",
        worksite: null,
        since: "2024-09-05"
      }]
    }, {
      id: "A020",
      type: "individual",
      assetNo: "IT-2024-0023",
      product: "그램 16 (2024)",
      group: "전자기기류",
      sub: "노트북",
      status: "disposed",
      serial: "SN-8842-AL",
      createdAt: "2024-03-12",
      purchaseDate: "2024-03-11",
      price: 189e4,
      expiry: "2027-03-10",
      labels: [],
      assignments: []
    }, {
      id: "A003",
      type: "individual",
      assetNo: "IT-2023-0090",
      product: "맥북 프로 14",
      group: "전자기기류",
      sub: "노트북",
      status: "repair",
      serial: "C02XR-99",
      createdAt: "2023-08-03",
      purchaseDate: "2023-08-02",
      price: 269e4,
      expiry: "",
      photo: "#8854d0",
      photoCount: 8,
      note: "2026-08 배터리 스웰링으로 수리/점검 접수, 센터 입고",
      labels: ["디자인팀"],
      assignments: [{
        employee: "이서연",
        worksite: null,
        since: "2023-08-10"
      }]
    }, {
      id: "A004",
      type: "individual",
      assetNo: "FN-2022-0031",
      product: "시디즈 T50",
      group: "가구류",
      sub: "의자",
      status: "assigned",
      serial: "",
      createdAt: "2022-05-23",
      purchaseDate: "2022-05-20",
      price: 32e4,
      expiry: "",
      photo: "#26a69a",
      labels: ["강남점"],
      assignments: [{
        employee: null,
        worksite: "강남점",
        since: "2022-06-01"
      }]
    }, {
      id: "A005",
      type: "individual",
      assetNo: "FN-2022-0032",
      product: "시디즈 T50",
      group: "가구류",
      sub: "의자",
      status: "assigned",
      serial: "",
      createdAt: "2022-05-23",
      purchaseDate: "2022-05-20",
      price: 32e4,
      expiry: "",
      labels: [],
      assignments: [{
        employee: "박지훈",
        worksite: null,
        since: "2023-01-04"
      }]
    }, {
      id: "A006",
      type: "individual",
      assetNo: "IT-2021-0005",
      product: "델 U2720Q",
      group: "전자기기류",
      sub: "모니터",
      status: "lost",
      serial: "CN-0KL-77",
      createdAt: "2021-11-16",
      purchaseDate: "2021-11-15",
      price: 69e4,
      expiry: "",
      note: "2026-07 재택 반출 후 미회수, 분실 신고",
      labels: ["분실추적"],
      assignments: [{
        employee: "정우성",
        worksite: null,
        since: "2022-01-10"
      }]
    }, {
      id: "A007",
      type: "individual",
      assetNo: "IT-2020-0001",
      product: "HP 프로북 450",
      group: "전자기기류",
      sub: "노트북",
      status: "disposed",
      serial: "5CD-0-AA",
      createdAt: "2020-02-03",
      purchaseDate: "2020-02-01",
      price: 95e4,
      expiry: "",
      labels: [],
      assignments: []
    }, {
      id: "A008",
      type: "individual",
      assetNo: "FN-2025-0101",
      product: "데스커 1400",
      group: "가구류",
      sub: "책상",
      status: "assigned",
      serial: "",
      createdAt: "2025-01-21",
      purchaseDate: "2025-01-20",
      price: 21e4,
      expiry: "",
      photo: "#8395a7",
      labels: ["판교점"],
      assignments: [{
        employee: null,
        worksite: "판교점",
        since: "2025-02-01"
      }]
    }, {
      id: "A009",
      type: "individual",
      assetNo: "FN-2025-0102",
      product: "데스커 1400",
      group: "가구류",
      sub: "책상",
      status: "stock",
      serial: "",
      createdAt: "2025-03-11",
      purchaseDate: "2025-03-10",
      price: 21e4,
      expiry: "",
      labels: [],
      assignments: []
    }, {
      id: "A010",
      type: "individual",
      assetNo: "IT-2022-0210",
      product: "씽크패드 X1",
      group: "전자기기류",
      sub: "노트북",
      status: "stock",
      serial: "PF-2K9X-11",
      createdAt: "2022-06-10",
      purchaseDate: "2022-06-09",
      price: 165e4,
      expiry: "2026-07-01",
      labels: [],
      assignments: []
    },
    // 구성원별·근무지별 "배정된 자산" 칩·모달의 5개 초과 오버플로("+N") 케이스를 화면에서 실제로 볼 수 있게,
    // 구성원 1명(오세훈)·근무지 1곳(본사)에 소분류 7종(5개 초과)을 걸치도록 자산을 추가함(서랍장은 분류 관리
    // 모달의 "활성 상태 삭제" 테스트용 빈 소분류라 그대로 비워둠)
    {
      id: "A021",
      type: "individual",
      assetNo: "FN-2025-0103",
      product: "데스커 1400",
      group: "가구류",
      sub: "책상",
      status: "assigned",
      serial: "",
      createdAt: "2025-01-21",
      purchaseDate: "2025-01-20",
      price: 21e4,
      expiry: "",
      labels: [],
      assignments: [{
        employee: "오세훈",
        worksite: null,
        since: "2025-03-02"
      }]
    }, {
      id: "A022",
      type: "individual",
      assetNo: "FN-2022-0033",
      product: "시디즈 T50",
      group: "가구류",
      sub: "의자",
      status: "assigned",
      serial: "",
      createdAt: "2022-05-23",
      purchaseDate: "2022-05-20",
      price: 32e4,
      expiry: "",
      labels: [],
      assignments: [{
        employee: "오세훈",
        worksite: null,
        since: "2022-07-14"
      }]
    }, {
      id: "A023",
      type: "individual",
      assetNo: "IT-2023-0091",
      product: "맥북 프로 14",
      group: "전자기기류",
      sub: "노트북",
      status: "assigned",
      serial: "C02XR-A1",
      createdAt: "2023-08-03",
      purchaseDate: "2023-08-02",
      price: 269e4,
      expiry: "",
      labels: [],
      assignments: [{
        employee: "오세훈",
        worksite: null,
        since: "2023-09-01"
      }]
    }, {
      id: "A024",
      type: "individual",
      assetNo: "IT-2021-0006",
      product: "델 U2720Q",
      group: "전자기기류",
      sub: "모니터",
      status: "assigned",
      serial: "CN-0KL-78",
      createdAt: "2021-11-16",
      purchaseDate: "2021-11-15",
      price: 69e4,
      expiry: "",
      labels: [],
      assignments: [{
        employee: "오세훈",
        worksite: null,
        since: "2022-02-05"
      }]
    }, {
      id: "A025",
      type: "individual",
      assetNo: "FN-2025-0104",
      product: "데스커 1400",
      group: "가구류",
      sub: "책상",
      status: "assigned",
      serial: "",
      createdAt: "2025-01-21",
      purchaseDate: "2025-01-20",
      price: 21e4,
      expiry: "",
      labels: ["본사"],
      assignments: [{
        employee: null,
        worksite: "본사",
        since: "2025-04-10"
      }]
    }, {
      id: "A026",
      type: "individual",
      assetNo: "FN-2022-0034",
      product: "시디즈 T50",
      group: "가구류",
      sub: "의자",
      status: "assigned",
      serial: "",
      createdAt: "2022-05-23",
      purchaseDate: "2022-05-20",
      price: 32e4,
      expiry: "",
      labels: ["본사"],
      assignments: [{
        employee: null,
        worksite: "본사",
        since: "2022-08-20"
      }]
    }, {
      id: "A027",
      type: "individual",
      assetNo: "IT-2022-0211",
      product: "씽크패드 X1",
      group: "전자기기류",
      sub: "노트북",
      status: "assigned",
      serial: "PF-2K9X-12",
      createdAt: "2022-06-10",
      purchaseDate: "2022-06-09",
      price: 165e4,
      expiry: "2026-07-01",
      labels: ["본사"],
      assignments: [{
        employee: null,
        worksite: "본사",
        since: "2022-09-01"
      }]
    }, {
      id: "A028",
      type: "individual",
      assetNo: "IT-2021-0007",
      product: "델 U2720Q",
      group: "전자기기류",
      sub: "모니터",
      status: "assigned",
      serial: "CN-0KL-79",
      createdAt: "2021-11-16",
      purchaseDate: "2021-11-15",
      price: 69e4,
      expiry: "",
      labels: ["본사"],
      assignments: [{
        employee: null,
        worksite: "본사",
        since: "2022-03-01"
      }]
    },
    // 근무지 자산 "조회 가능한 자산이 하나도 없는 근무지" 빈 상태 데모용(2026-09-30) — 역삼점(김민수의 담당
    // 근무지, app.js MY_WORKSITES)의 유일한 자산이 모니터(조회 권한 "모든 관리자 및 리더", 관리자/리더 필드가
    // 없는 이 프로토타입에선 전원 필터링)라 근무지 자산 화면에서 역삼점 카드가 "전체 0"+빈 상태로 뜸
    {
      id: "A029",
      type: "individual",
      assetNo: "IT-2021-0008",
      product: "델 U2720Q",
      group: "전자기기류",
      sub: "모니터",
      status: "assigned",
      serial: "CN-0KL-80",
      createdAt: "2021-11-16",
      purchaseDate: "2021-11-15",
      price: 69e4,
      expiry: "",
      labels: ["역삼점"],
      assignments: [{
        employee: null,
        worksite: "역삼점",
        since: "2022-03-01"
      }]
    }, {
      id: "A101",
      type: "individual",
      assetNo: "DEMO-A101",
      product: "2026 하복 유니폼",
      group: "소모품",
      sub: "유니폼",
      status: "assigned",
      serial: "",
      createdAt: "2026-04-02",
      purchaseDate: "2026-04-01",
      price: 18e3,
      manufactured: "2026-03-15",
      expiry: "2027-04-01",
      note: "L/XL 사이즈 위주 소진 빠름",
      photo: "#e67e22",
      photoCount: 10,
      labels: ["하복"],
      assignments: [{
        worksite: "강남점",
        employee: null,
        since: "2026-06-01"
      }]
    }, {
      id: "A102",
      type: "individual",
      assetNo: "DEMO-A102",
      product: "USB-C 케이블 2m",
      group: "전자기기류",
      sub: "케이블·액세서리",
      status: "assigned",
      serial: "",
      createdAt: "2025-09-11",
      purchaseDate: "2025-09-10",
      price: 9e3,
      expiry: "",
      labels: [],
      assignments: [{
        worksite: "본사",
        employee: null,
        since: "2026-06-01"
      }]
    }, {
      id: "A103",
      type: "individual",
      assetNo: "DEMO-A103",
      product: "A4 복사용지 한 박스",
      group: "소모품",
      sub: "문구류",
      status: "assigned",
      serial: "",
      createdAt: "2026-06-02",
      purchaseDate: "2026-06-01",
      price: 4200,
      expiry: "2028-06-01",
      labels: ["소모"],
      assignments: [{
        employee: "오세훈",
        worksite: null,
        since: "2026-06-01"
      }]
    }, {
      id: "A104",
      type: "individual",
      assetNo: "DEMO-A104",
      product: "2025 동복 유니폼",
      group: "소모품",
      sub: "유니폼",
      status: "assigned",
      serial: "",
      createdAt: "2025-10-02",
      purchaseDate: "2025-10-01",
      price: 24e3,
      expiry: "2026-09-08",
      labels: ["동복"],
      assignments: [{
        worksite: "판교점",
        employee: null,
        since: "2026-06-01"
      }]
    }, {
      id: "A105",
      type: "individual",
      assetNo: "DEMO-A105",
      product: "무선 마우스",
      group: "전자기기류",
      sub: "케이블·액세서리",
      status: "stock",
      serial: "",
      createdAt: "2026-08-01",
      purchaseDate: "2026-07-30",
      price: 25e3,
      expiry: "",
      labels: [],
      assignments: []
    },
    // 신규 구성원 6명 추가. 다만 이번엔 데모 전용이라 MEMBERS/MEMBER_INFO/EMP_GROUP엔 등록 안 함(그 목록들에
    {
      id: "A106",
      type: "individual",
      assetNo: "DEMO-A106",
      product: "네임펜 세트",
      group: "소모품",
      sub: "문구류",
      status: "assigned",
      serial: "",
      createdAt: "2026-03-02",
      purchaseDate: "2026-03-01",
      price: 3500,
      expiry: "",
      labels: [],
      assignments: [{
        employee: "김민수",
        worksite: null,
        since: "2026-06-01"
      }]
    }],
    tags = [...new Set(assets.flatMap(a => a.labels || []))].sort((a, b) => a.localeCompare(b, "ko"));
  assets.forEach(a => {
    const dates = [a.createdAt || a.purchaseDate || "2024-01-01"];
    (a.assignments || []).forEach(x => dates.push(x.since)), a.status === "repair" && dates.push("2026-08-14"), a.status === "lost" && dates.push("2026-07-21"), a.status === "disposed" && dates.push("2025-12-30"), a.note && dates.push("2026-06-02"), a.updatedAt = dates.reduce((max, d) => d > max ? d : max);
  });
  const deletedAssets = [];
  try {
    const saved = sessionStorage.getItem("justDeletedAssetRecord");
    saved && (deletedAssets.push(JSON.parse(saved)), sessionStorage.removeItem("justDeletedAssetRecord"));
    const delId = sessionStorage.getItem("justDeletedAssetId");
    if (delId) {
      sessionStorage.removeItem("justDeletedAssetId");
      const idx = assets.findIndex(a => a.id === delId);
      idx > -1 && assets.splice(idx, 1);
    }
  } catch {}
  return {
    categories,
    assets,
    deletedAssets,
    emptyGroups,
    tags,
    targetStatuses: {
      employee: {},
      worksite: {}
    }
  };
}();
(function () {
  const DAYS = ["일", "월", "화", "수", "목", "금", "토"],
    p = n => String(n).padStart(2, "0"),
    parse = s => new Date(String(s).replace(" ", "T"));
  window.fmtDate = s => {
    if (!s) return "—";
    const d = parse(s);
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}(${DAYS[d.getDay()]})`;
  }, window.fmtDateTime = s => {
    if (!s) return "—";
    const d = parse(s);
    return `${window.fmtDate(s)} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }, window.fmtMonth = s => {
    if (!s) return "—";
    const d = parse(s);
    return `${d.getFullYear()}.${p(d.getMonth() + 1)}`;
  };
})();
window.ASSET_MEMBER_JOB_TITLES = {
  김민수: "팀장",
  이서연: "매니저",
  박지훈: "매니저",
  정우성: "사원",
  김철수: "팀장",
  최유진: "주임",
  한소희: "사원",
  장민호: "매니저",
  오세훈: "주임",
  배수지: "사원",
  윤재현: "매니저",
  임하늘: null
};
window.matchesAssetGroupPositionTarget = function (target, group, jobTitle) {
  const groups = target?.groups || [],
    jobs = target?.jobTitles || [];
  if (!groups.length && !jobs.length) return !1;
  const matchesGroup = !groups.length || groups.includes(group),
    matchesJob = !jobs.length || jobTitle !== void 0 && jobs.includes(jobTitle || "직무/직급 없음");
  return matchesGroup && matchesJob;
};
window.isAssetGroupPositionSubset = function (target, viewTarget) {
  const groups = target?.groups || [],
    jobs = target?.jobTitles || [],
    viewGroups = viewTarget?.groups || [],
    viewJobs = viewTarget?.jobTitles || [];
  return !groups.length && !jobs.length || !viewGroups.length && !viewJobs.length ? !1 : [[groups, viewGroups], [jobs, viewJobs]].every(([selected, allowed]) => !allowed.length || selected.length > 0 && selected.every(value => allowed.includes(value)));
};
(function () {
  const CURRENCY_FORMATS = {
    KRW: {
      symbol: "원",
      position: "suffix"
    },
    USD: {
      symbol: "$",
      position: "prefix"
    },
    JPY: {
      symbol: "円",
      position: "suffix"
    },
    EUR: {
      symbol: "€",
      position: "prefix"
    }
  };
  window.CLIENT_CURRENCY = "KRW";
  const PRICE_INTEGER_DIGITS = 12,
    PRICE_FRACTION_DIGITS = 5;
  function priceInputText(value) {
    const raw = String(value ?? "").replace(/,/g, "").replace(/[^0-9.]/g, "");
    if (!raw) return "";
    const [integer, ...fractions] = raw.split(".");
    return (integer.replace(/^0+(?=\d)/, "").slice(0, PRICE_INTEGER_DIGITS) || "0") + (fractions.length ? "." + fractions.join("").slice(0, PRICE_FRACTION_DIGITS) : "");
  }
  window.normalizePurchasePrice = function (value) {
    const raw = priceInputText(value);
    if (!raw) return "";
    const [integer, fraction = ""] = raw.split("."),
      significantFraction = fraction.replace(/0+$/, "");
    return integer + (significantFraction ? "." + significantFraction : "");
  }, window.formatPurchasePriceInput = function (value) {
    const raw = priceInputText(value);
    if (!raw) return "";
    const [integer, fraction] = raw.split(".");
    return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (fraction !== void 0 ? "." + fraction : "");
  }, window.bindPurchasePriceInput = function (input) {
    input.addEventListener("input", () => {
      const position = input.selectionStart,
        charactersBefore = input.value.slice(0, position).replace(/[^0-9.]/g, "").length;
      if (input.value = window.formatPurchasePriceInput(input.value), position != null) {
        let cursor = 0,
          seen = 0;
        for (; cursor < input.value.length && seen < charactersBefore;) /[0-9.]/.test(input.value[cursor]) && seen++, cursor++;
        input.setSelectionRange(cursor, cursor);
      }
    });
  }, window.formatPrice = function (amount) {
    if (amount == null || amount === "") return "";
    const fmt = CURRENCY_FORMATS[window.CLIENT_CURRENCY] || CURRENCY_FORMATS.KRW,
      n = window.formatPurchasePriceInput(window.normalizePurchasePrice(amount));
    return fmt.position === "prefix" ? `${fmt.symbol}${n}` : `${n}${fmt.symbol}`;
  };
})();
window.ASSET_PHOTO_MAX_COUNT = 10;
window.ASSET_TAG_MAX_COUNT = 10;
window.tintHex = function (hex, amt) {
  const n = parseInt(hex.slice(1), 16),
    cl = v => Math.max(0, Math.min(255, v)),
    r = cl((n >> 16) + amt),
    g = cl((n >> 8 & 255) + amt),
    b = cl((n & 255) + amt);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};
window.assetPhotos = /* @__PURE__ */function () {
  const TINTS = [0, 26, -24, 42, -40, 14, -12, 34, -30, 8],
    DATES = ["2026-08-28 14:10", "2026-08-28 14:12", "2026-07-15 09:33", "2026-07-15 09:34", "2026-06-02 17:20", "2026-06-02 17:22", "2026-05-20 11:05", "2026-05-20 11:06", "2026-04-10 08:48", "2026-04-10 08:49"],
    BY = ["dana", "김민수", "dana", "이서연", "dana", "김민수", "dana", "이서연", "dana", "김민수"];
  return function (a) {
    return a._photos ? a._photos : a.photo ? (a._primary = 0, a._photos = TINTS.slice(0, a.photoCount || 5).map((t, i) => ({
      id: `${a.id}-p${i + 1}`,
      color: t === 0 ? a.photo : window.tintHex(a.photo, t),
      at: DATES[i],
      by: BY[i]
    }))) : a._photos = [];
  };
}();
window.assetPhotoId = /* @__PURE__ */function () {
  let seq = 0;
  return () => `photo-${Date.now().toString(36)}-${++seq}`;
}();
window.assetPhotoActivities = function (beforePhotos, beforePrimary, afterPhotos, afterPrimary) {
  const key = p => p.id || [p.color, p.at, p.by].join("|"),
    copy = list => (list || []).map(p => ({
      ...p
    })),
    before = copy(beforePhotos),
    after = copy(afterPhotos),
    entries = [];
  before.length === after.length && before.every((p, i) => key(p) === key(after[i])) || entries.push({
    script: "자산 사진 관리: 사진 변경",
    photoValue: !0,
    before,
    after
  });
  const beforeMain = before[beforePrimary || 0] || null,
    afterMain = after[afterPrimary || 0] || null;
  return beforeMain && afterMain && key(beforeMain) !== key(afterMain) && entries.push({
    script: "자산 사진 관리: 대표 사진 변경",
    photoValue: !0,
    before: [beforeMain],
    after: [afterMain]
  }), entries;
};
window.assetPhotoThumbsHtml = function (list) {
  return !list || !list.length ? "없음" : `<span class="hval-photos">${list.map(p => `<span class="hval-photo" style="background:${p.color}"></span>`).join("")}</span>`;
};
window.ASSET_ACTIVITY_ORDER = ["자산 정보 수정: 소분류 이동", "자산 정보 수정: 품목명 수정", "자산 사진 관리: 사진 변경", "자산 사진 관리: 대표 사진 변경", "자산 정보 수정: 고유관리번호 수정", "자산 정보 수정: 태그 수정", "자산 정보 수정: 유효기한 변경", "자산 정보 수정: S/N 수정", "자산 정보 수정: IMEI 수정", "자산 정보 수정: 제조연월 변경", "자산 정보 수정: 구매연월 변경", "자산 정보 수정: 구매가격 변경", "자산 정보 수정: 메모 수정"];
window.logAssetActivities = function (entries, log) {
  const rank = e => {
    const i = window.ASSET_ACTIVITY_ORDER.indexOf(e.script);
    return i < 0 ? window.ASSET_ACTIVITY_ORDER.length : i;
  };
  entries.map((e, i) => ({
    e,
    i
  })).sort((x, y) => rank(x.e) - rank(y.e) || x.i - y.i).reverse().forEach(x => log(x.e));
};
window.assetDownloadFileName = function (value) {
  let name = String(value ?? "").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").replace(/[. ]+$/g, "_");
  return /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)/i.test(name) && (name = "_" + name), name || "_";
};
window.assetDownloadFileNames = function (values) {
  const used = /* @__PURE__ */new Set();
  return values.map(value => {
    const name = window.assetDownloadFileName(value),
      dot = name.lastIndexOf("."),
      stem = dot > 0 ? name.slice(0, dot) : name,
      extension = dot > 0 ? name.slice(dot) : "";
    let next = name,
      number = 2;
    for (; used.has(next.toLowerCase());) next = `${stem} (${number++})${extension}`;
    return used.add(next.toLowerCase()), next;
  });
};
window.archiveDeletedAsset = function (asset, actor) {
  const record = JSON.parse(JSON.stringify(asset));
  record.deleted_at = (/* @__PURE__ */new Date()).toISOString(), record.deleted_by = actor, window.DATA.deletedAssets.push(record);
  const index = window.DATA.assets.indexOf(asset);
  return index > -1 && window.DATA.assets.splice(index, 1), record;
};
(function () {
  const counters = /* @__PURE__ */new Map(),
    params = new URLSearchParams(location.search),
    mobile = /(?:leader|app)\.html$/.test(location.pathname);
  window.AssetPrototypeActor = {
    role: params.get("qa") === "restore" ? params.get("role") === "admin" ? "admin" : "leader" : mobile ? "leader" : "admin",
    companyId: "demo-company",
    timeZone: "Asia/Seoul"
  }, window.ASSET_NUMBER_GUIDE = "입력하지 않으면 자산 등록 시 자동으로 발급됩니다. (형식: ASSET-YYYY-000001)";
  function stamp(now, timeZone) {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23"
      }).formatToParts(now),
      values = Object.fromEntries(parts.map(part => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}`;
  }
  function fail(code) {
    const error = new Error(code);
    throw error.code = code, error;
  }
  window.AssetRegistration = {
    registerBatch(drafts, options = {}) {
      (!Array.isArray(drafts) || !drafts.length) && fail("EMPTY_BATCH");
      const actor = window.AssetPrototypeActor,
        companyId = options.companyId || actor.companyId,
        at = stamp(options.now || /* @__PURE__ */new Date(), options.timeZone || actor.timeZone),
        year = at.slice(0, 4),
        key = `${companyId}:${year}`,
        existing = window.DATA.assets.filter(asset => !asset.deleted_at && (asset.companyId || actor.companyId) === companyId),
        used = new Set(existing.filter(asset => !0).map(asset => asset.assetNo).filter(Boolean)),
        prepared = drafts.map(draft => {
          const asset = {
              ...draft,
              companyId,
              type: "individual",
              // 목업 호환용 내부 값. 사용자 유형 선택은 제공하지 않는다.
              product: String(draft.product || "").trim(),
              assetNo: String(draft.assetNo || "").trim()
            },
            category = window.DATA.categories.find(cat => cat.group === asset.group && cat.sub === asset.sub);
          category || fail("CATEGORY_CHANGED"), (!asset.product || asset.product.length > 50) && fail("INVALID_PRODUCT"), asset.assetNo && !/^[A-Za-z0-9_-]{1,30}$/.test(asset.assetNo) && fail("INVALID_ASSET_NO"), asset.assetNo && (used.has(asset.assetNo) && fail("DUPLICATE_ASSET_NO"), used.add(asset.assetNo));
          delete asset.totalQty;
          delete asset.stocks; // 회사 양식의 수량을 등록 개수로 해석하지 않는다.
          const hidden = []; // Basic information is always enabled; only custom fields have use toggles.
          asset.extraValues = Object.fromEntries((window.DATA.extraFields || []).filter(f => !f.deleted && (category.extraEnabled || []).includes(f.id)).map(f => [f.id,String((draft.extraValues||{})[f.id]||"").trim().slice(0,100)]));
          delete asset.serial; delete asset.imei;
          for (const field of ["expiry", "serial", "imei", "manufactured", "purchaseDate", "price"]) hidden.includes(field === "price" ? "purchasePrice" : field) && delete asset[field];
          return asset;
        });
      let sequence = counters.get(key) || 0,
        nextId = [...window.DATA.assets, ...(window.DATA.deletedAssets || [])].reduce((max, asset) => Math.max(max, /^A\d+$/.test(asset.id) ? Number(asset.id.slice(1)) : 0), 0);
      const created = prepared.map(asset => {
        if (!asset.assetNo) {
          do asset.assetNo = `ASSET-${year}-${String(++sequence).padStart(6, "0")}`; while (used.has(asset.assetNo));
          used.add(asset.assetNo);
        }
        return {
          ...asset,
          id: `A${String(++nextId).padStart(3, "0")}`,
          status: "stock",
          createdAt: at.slice(0, 10),
          assignments: [],
          _activityLog: [{
            d: at,
            who: options.who || "dana",
            script: "자산 등록"
          }]
        };
      });
      return window.DATA.assets.push(...created), counters.set(key, sequence), created;
    }
  }, window.canRestoreDisposedAsset = asset => window.hasPrototypeAssetManagePermission() && window.DATA.assets.includes(asset) && !asset.deleted_at && !0 && asset.status === "disposed", window.restoreDisposedAsset = (asset, who = "dana") => {
    !window.hasPrototypeAssetManagePermission() && fail("PERMISSION_DENIED"), window.canRestoreDisposedAsset(asset) || fail("ASSET_CHANGED"), asset._activityLog || fail("HISTORY_NOT_INITIALIZED"), asset.status = "stock", asset.assignments = [], asset._activityLog.unshift({
      d: stamp(/* @__PURE__ */new Date(), window.AssetPrototypeActor.timeZone),
      who,
      script: "상태 변경: 폐기 복구",
      before: "폐기",
      after: "배정 가능"
    });
  }, window.openAssetRestoreConfirm = (asset, onDone, who) => {
    if (!window.canRestoreDisposedAsset(asset)) return;
    const back = document.createElement("div");
    back.className = "modal-back", back.style.zIndex = 340, back.innerHTML = `<div class="modal sm" role="dialog" aria-modal="true" aria-label="폐기 자산 복구">
      <h3>폐기 자산을 복구하시겠습니까?</h3><div class="body">배정이 없는 배정 가능 상태로 복구됩니다. 기존 배정은 복원되지 않습니다.</div>
      <div class="foot"><button type="button" class="btn" data-restore-cancel>취소</button><button type="button" class="btn primary" data-restore-confirm>확인</button></div></div>`, back.querySelector("[data-restore-cancel]").onclick = () => back.remove(), back.querySelector("[data-restore-confirm]").onclick = () => {
      let message;
      try {
        window.restoreDisposedAsset(asset, who), message = "자산이 복구되었습니다.";
      } catch (error) {
        if (!["PERMISSION_DENIED", "ASSET_CHANGED"].includes(error.code)) {
          const notice = document.createElement("div");
          notice.textContent = "에러가 발생하였습니다. 잠시 후 다시 시도해보세요.", notice.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;z-index:400", document.body.appendChild(notice), setTimeout(() => notice.remove(), 1800);
          return;
        }
        message = error.code === "PERMISSION_DENIED" ? "자산 관리 권한이 없습니다." : "설정이 변경되었습니다. 잠시 후 다시 시도해주세요.";
      }
      back.remove(), onDone(message);
    }, document.body.appendChild(back);
  };
})();
window.formatAssetCount = value => Number(value || 0).toLocaleString("en-US");

// D-20261029-40/41: company definitions, category visibility, per-asset values.
// This prototype keeps data in memory; server authorization must enforce the same boundaries.
(function () {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const fixed = [
    {id:'expiry',name:'유효기한',description:'교체·점검 기한 등을 기록합니다. 만료 예정이거나 만료된 자산을 현황에서 확인할 수 있습니다.'},
    {id:'manufactured',name:'제조연월',description:'자산이 제조된 연월을 기록합니다.'},
    {id:'purchaseDate',name:'구매연월',description:'자산을 구매한 연월을 기록합니다.'},
    {id:'purchasePrice',name:'구매가격',description:'자산 1개를 구매한 가격을 기록합니다.'}
  ];
  window.DATA.extraFields ||= [];
  // 데모 회사가 직접 추가한 추가 정보 항목(정책상 실제 회사는 빈 목록에서 시작). 소분류마다 ON/OFF를 다르게 둔다:
  // 노트북 S/N·IMEI ON, 모니터 S/N만 ON, 그 외 소분류는 OFF. 기존 S/N·IMEI 값은 OFF 소분류에서도 원본값으로 보존한다.
  if (!window.DATA.extraFields.length && new URLSearchParams(location.search).get('qa') !== 'extra-info') {
    window.DATA.extraFields.push({id:'sn',name:'S/N'},{id:'imei',name:'IMEI'});
    const ON = {'노트북':['sn','imei'],'모니터':['sn']};
    for (const c of window.DATA.categories) c.extraEnabled = [...(ON[c.sub] || [])];
    for (const a of window.DATA.assets) {
      const v = {};
      if (a.serial) v.sn = a.serial;
      if (a.imei) v.imei = a.imei;
      if (Object.keys(v).length) a.extraValues = {...v, ...(a.extraValues || {})};
    }
    // IMEI 데모 값: LTE 모델로 가정한 노트북 일부에만 입력
    window.DATA.assets.filter(a => a.sub === '노트북' && a.status !== 'disposed').slice(0, 3)
      .forEach((a, i) => { a.extraValues = {...(a.extraValues || {}), imei: `35937955039${1650 + i}`}; });
  }
  window.hasPrototypeAssetManagePermission = () => {
    const p = new URLSearchParams(location.search);
    if (p.has('manage')) return p.get('manage') === '1';
    if (window.AssetPermissionQa?.enabled) return !!window.AssetPermissionQa.managePermission;
    if (p.get('role') === 'viewer') return false;
    if (p.get('role') === 'admin' || p.get('role') === 'manager') return true;
    return !/(?:^|\/)app\.html$/.test(location.pathname);
  };
  const category = a => a && window.DATA.categories.find(c => c.group === a.group && c.sub === a.sub);
  const normalizeField = id => ({labels:'tags',note:'memo',price:'purchasePrice'}[id] || id);
  const enabled = (cat,id) => !!cat && (['tags','memo',...fixed.map(f=>f.id)].includes(normalizeField(id)) || (cat.extraEnabled||[]).includes(id));
  const visible = (cat,id,manage=window.hasPrototypeAssetManagePermission()) => enabled(cat,id) && (['tags','memo'].includes(normalizeField(id)) || manage || !(cat.privateFields||[]).includes(normalizeField(id)));
  const fields = () => [...fixed,...window.DATA.extraFields.filter(f=>!f.deleted)];
  function values(a,manage) {
    const cat=category(a);
    return fields().filter(f=>visible(cat,f.id,manage)).map(f=>({ ...f,value: f.id==='purchasePrice' ? a.price : fixed.some(x=>x.id===f.id) ? a[f.id] : (a.extraValues||{})[f.id] }));
  }
  function detailRows(a,manage,expiryFormat,group='basic') {
    return values(a,manage).filter(f=>fixed.some(x=>x.id===f.id)===(group==='basic')).map(f=>{
      let value=f.value == null || f.value==='' ? '—' : esc(f.value);
      if(f.value && f.id==='expiry') value=expiryFormat ? expiryFormat(f.value) : window.fmtDate(f.value);
      if(f.value && ['manufactured','purchaseDate'].includes(f.id)) value=window.fmtMonth(f.value);
      if(f.value!=null && f.id==='purchasePrice') value=window.formatPrice(f.value);
      return `<div><div class="k">${esc(f.name)}</div><div class="v">${value}</div></div>`;
    }).join('');
  }
  // 기본 정보는 기존 목록에서, 회사 커스텀 항목만 별도 추가 정보 섹션에서 표시한다.
  function detailHtml(a,manage,expiryFormat) {
    const rows=detailRows(a,manage,expiryFormat,'custom');
    return rows ? `<section class="extra-info-section asset-custom-info"><h4>추가 정보</h4><div class="kv2">${rows}</div></section>` : '';
  }
  function historyVisible(asset,entry,manage=window.hasPrototypeAssetManagePermission()) {
    if(manage) return true;
    const id=entry.fieldId || ((entry.script||'').includes('메모 수정')?'memo':(entry.script||'').includes('태그 수정')?'tags':fixed.find(f=>(entry.script||'').startsWith(`자산 정보 수정: ${f.name} `))?.id);
    return !id || ['tags','memo'].includes(normalizeField(id)) || !(category(asset)?.privateFields||[]).includes(id);
  }
  function customInputs(cat,values={},attr='data-extra-input',manage=true) {
    return window.DATA.extraFields.filter(f=>!f.deleted && visible(cat,f.id,manage)).map(f=>`<div class="field mapp-add-field"><label>${esc(f.name)}</label><input type="text" ${attr}="${esc(f.id)}" maxlength="100" placeholder="입력" value="${esc(values[f.id]||'')}"></div>`).join('');
  }
  function readInputs(scope,attr='data-extra-input') {
    return Object.fromEntries([...scope.querySelectorAll(`[${attr}]`)].map(el=>[el.getAttribute(attr),el.value.trim().slice(0,100)]));
  }
  function applyCustom(asset,input,log) {
    asset.extraValues ||= {};
    for(const f of window.DATA.extraFields.filter(f=>!f.deleted)) {
      if(!(f.id in input) || !visible(category(asset),f.id)) continue;
      const value=String(input[f.id]||'').trim().slice(0,100), before=asset.extraValues[f.id]||'';
      if(before===value) continue;
      asset.extraValues[f.id]=value;
      log?.({script:`자산 정보 수정: ${f.name} 수정`,fieldId:f.id,fieldName:f.name,before,after:value});
    }
  }
  function bindDetailTabs(root) {
    root.querySelectorAll('[data-detail-tab]').forEach(button=>button.onclick=()=>{
      root.querySelectorAll('[data-detail-tab]').forEach(b=>b.classList.toggle('active',b===button));
      root.querySelectorAll('[data-detail-panel]').forEach(panel=>panel.hidden=panel.dataset.detailPanel!==button.dataset.detailTab);
    });
  }
  const tabs = () => '<div class="asset-detail-tabs"><button type="button" class="active" data-detail-tab="assignment">배정</button><button type="button" data-detail-tab="info">정보</button><button type="button" data-detail-tab="history">이력</button></div>';
  window.AssetExtra={fixed,fields,settingsFields:fields,category,enabled,visible,values,detailRows,detailHtml,historyVisible,customInputs,readInputs,applyCustom,bindDetailTabs,tabs,esc};
})();

(function(){if(new URLSearchParams(location.search).get('qa')!=='extra-info')return;window.DATA.extraFields.push({id:'qa-serial',name:'S/N'},{id:'qa-owner',name:'구매 담당자'});for(const c of window.DATA.categories){c.extraEnabled=['qa-serial','qa-owner'];c.privateFields=['purchasePrice','qa-owner'];}for(const a of window.DATA.assets)a.extraValues={'qa-serial':a.serial||'DEMO-SN-'+a.id,'qa-owner':'구매팀'};})();

// The sample Sheets remain reference files. The production export must use current
// company definitions and authorization, never send hidden values to the client.
window.AssetExtra.exportColumns=()=>window.AssetExtra.fields().map(f=>({id:f.id,name:f.name}));
window.AssetExtra.exportValues=(asset,manage=window.hasPrototypeAssetManagePermission())=>Object.fromEntries(window.AssetExtra.fields().map(f=>[f.id,window.AssetExtra.visible(window.AssetExtra.category(asset),f.id,manage)?(f.id==='purchasePrice'?asset.price:window.AssetExtra.fixed.some(x=>x.id===f.id)?asset[f.id]:asset.extraValues?.[f.id])??'':'']));


// D-20261030: independent subcategory view / information edit / state management.
// This is an in-memory prototype. Production APIs must enforce both category and field permissions.
(function () {
  const params = new URLSearchParams(location.search);
  const roles = {admin:'admin',manager:'leader',leader:'leader',employee:'employee',viewer:'employee'};
  const teams = {'김민수':'개발팀','이서연':'디자인팀','박지훈':'영업팀','정우성':'CS팀','김철수':'운영팀','최유진':'개발팀','한소희':'디자인팀','장민호':'국내영업','오세훈':'운영팀','배수지':'CS팀','윤재현':'해외영업','임하늘':'개발팀'};
  const managed = () => window.hasPrototypeAssetManagePermission();
  const qa = params.get('qa') === 'access';
  const scenario = params.get('scenario') || 'info';
  for (const cat of window.DATA.categories) {
    cat.hiddenFields = []; // Fixed fields have no OFF state.
    cat.privateFields=(cat.privateFields||[]).filter(id=>!['tags','labels','memo','note'].includes(id));
    cat.edit ||= cat.assign || '모든 관리자 및 리더';
    cat.editTarget ||= cat.assignTarget ? JSON.parse(JSON.stringify(cat.assignTarget)) : {groups:[],jobTitles:[],members:[]};
    if (qa) {
      cat.view='회사의 모든 구성원';
      cat.edit=['info','both','private'].includes(scenario)?'회사의 모든 구성원':'관리자만';
      cat.assign=['state','both'].includes(scenario)?'회사의 모든 구성원':'관리자만';
      if(scenario==='private') cat.privateFields=[...new Set([...(cat.privateFields||[]),'purchasePrice'])];
    }
  }
  // In QA, do not inherit the normal dashboard/leader manager persona.
  if(qa) window.hasPrototypeAssetManagePermission=()=>scenario==='manage';
  function actor(name) {
    return {name:name||params.get('me')||'김민수',role:roles[params.get('role')] || (/app\.html$/.test(location.pathname)?'employee':'leader')};
  }
  function scope(cat,key,name) {
    if(!cat)return false;
    if(managed())return true;
    const a=actor(name),target=cat[key+'Target'];
    switch(cat[key]) {
      case '회사의 모든 구성원':return true;
      case '모든 관리자 및 리더':return a.role==='admin'||a.role==='leader';
      case '관리자만':return a.role==='admin';
      case '특정 관리자/리더':return ['admin','leader'].includes(a.role)&&(target?.members||[]).includes(a.name);
      case '특정 그룹 및 직무/직급':return window.matchesAssetGroupPositionTarget(target,teams[a.name],window.ASSET_MEMBER_JOB_TITLES[a.name]);
      default:return false;
    }
  }
  const category=window.AssetExtra.category;
  function canInfo(a,name){return !!a && !a.deleted_at && a.status!=='disposed' && (managed() || (scope(category(a),'view',name)&&scope(category(a),'edit',name)));}
  function canState(a,name){return !!a && !a.deleted_at && a.status!=='disposed' && (managed() || (scope(category(a),'view',name)&&scope(category(a),'assign',name)));}
  function canField(a,id,name){return canInfo(a,name) && (managed() || (!['group','sub','category','product','assetNo'].includes(id)&&window.AssetExtra.visible(category(a),id,false)));}
  function protectForm(root,a,mobile=false){
    if(!a)return;
    const restricted=!managed();
    const name=root.querySelector(mobile?'[data-add-field="product"]':'#areg-name');
    const number=root.querySelector(mobile?'[data-add-field="assetNo"]':'#areg-assetno-input');
    [name,number].filter(Boolean).forEach(el=>{el.readOnly=restricted;el.setAttribute('aria-readonly',String(restricted));});
    const cat=root.querySelector(mobile?'[data-add-category]':'#areg-catwrap');
    if(cat){if(cat.tagName==='BUTTON')cat.disabled=restricted;cat.setAttribute('aria-disabled',String(restricted));cat.classList.toggle('asset-readonly',restricted);}
    root.querySelector(mobile?'[data-add-tag-manage]':'#areg-tag-manage')?.toggleAttribute('hidden',restricted);
    for(const [id,selector] of mobile?[['tags','[data-add-tag-search]'],['memo','[data-add-field="note"]']]:[['tags','#areg-tag-field'],['memo','#areg-note-field']]){
      const el=root.querySelector(selector),row=mobile?el?.closest('.mapp-add-field'):el;
      if(row)row.hidden=!window.AssetExtra.visible(category(a),id);
    }
    for(const id of ['expiry','manufactured','purchaseDate','purchasePrice']){
      const el=root.querySelector(`[data-add-date="${id}"], [data-add-field="${id}"]`);
      if(mobile&&el)el.closest('.mapp-add-field').hidden=!window.AssetExtra.visible(category(a),id);
    }
  }
  window.AssetAccess={scope,canInfo,canState,canField,protectForm,managed};
})();
