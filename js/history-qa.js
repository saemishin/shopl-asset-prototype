/* 이력 카드 QA 도구.
   ?qa=history일 때만 자산 상세 이력 탭에 Web_dc_24의 모든 활동 케이스를 담은 샘플 이력을 메모리로 넣는다(캡처·확인용).
   A001(그램 16), A106(네임펜 세트), 폐기 처리 확인용 A020(폐기된 그램 16)에 적용한다.
   일반 URL과 저장 데이터에는 영향을 주지 않는다. 배열은 화면 표시 순서(최신이 위)이다. */
(function () {
  if (new URLSearchParams(location.search).get("qa") !== "history") return;
  const assets = window.DATA.assets || [];
  const find = id => assets.find(a => a.id === id);
  const D = s => window.fmtDate(s), Mo = s => window.fmtMonth(s), P = v => window.formatPrice(v);
  const emp = (name, extra) => ({ employee: name, worksite: null, ...extra });
  const ws = (name, extra) => ({ employee: null, worksite: name, ...extra });
  const photo = (id, color, at, by) => ({ id, color, at, by });
  const ph = {
    a: photo("qa-p1", "#4b7bec", "2026-05-20 11:05", "dana"),
    b: photo("qa-p2", "#6595ff", "2026-05-20 11:06", "김민수"),
    c: photo("qa-p3", "#3363d4", "2026-07-15 09:33", "dana"),
    d: photo("qa-p4", "#e08a3c", "2026-08-28 14:10", "이서연"),
  };

  const indiv = find("A001");
  if (indiv) indiv._activityLog = [
    // 상태 변경
    { d: "2026-09-03 18:10", who: "dana", script: "상태 변경: 분실 회수", before: "분실", after: "배정 중" },
    { d: "2026-09-02 10:00", who: "김민수", script: "상태 변경: 분실 신고", before: "배정 중", after: "분실" },
    { d: "2026-08-30 15:20", who: "dana", script: "상태 변경: 수리/점검 완료", before: "수리/점검 중", after: "배정 중" },
    { d: "2026-08-25 09:40", who: "dana", script: "상태 변경: 수리/점검 접수", before: "배정 중", after: "수리/점검 중" },
    // 배정
    { d: "2026-08-20 11:00", who: "dana", script: "배정 관리: 반납", target: ws("역삼점"), before: D("2026-06-01"), after: "" },
    { d: "2026-08-12 14:30", who: "dana", script: "배정 관리: 재배정", before: `박지훈 · ${D("2026-05-02")}`, after: `이서연 · ${D("2026-08-12")}` },
    { d: "2026-07-01 10:15", who: "김민수", script: "배정 관리: 배정일 변경", target: emp("김민수"), before: D("2024-03-20"), after: D("2024-03-15") },
    { d: "2026-06-01 09:00", who: "dana", script: "배정 관리: 신규 배정", target: ws("역삼점"), before: "", after: D("2026-06-01") },
    { d: "2026-05-02 09:00", who: "dana", script: "배정 관리: 신규 배정", target: emp("박지훈"), before: "", after: D("2026-05-02") },
    // 사진: 추가+대표 변경(같은 저장) / 전부 삭제 / 첫 추가
    { d: "2026-04-18 16:00", who: "dana", script: "자산 사진 관리: 사진 변경", photoValue: true, before: [ph.a, ph.b], after: [ph.a, ph.b, ph.c] },
    { d: "2026-04-18 16:00", who: "dana", script: "자산 사진 관리: 대표 사진 변경", photoValue: true, before: [ph.a], after: [ph.c] },
    { d: "2026-04-15 10:00", who: "이서연", script: "자산 사진 관리: 사진 변경", photoValue: true, before: [ph.a, ph.b], after: [ph.a] },
    { d: "2026-04-10 08:50", who: "dana", script: "자산 사진 관리: 사진 변경", photoValue: true, before: [], after: [ph.a, ph.b] },
    // 자산 정보 수정: 한 번의 저장으로 바뀐 항목들(정책09 4.1 순서)
    { d: "2026-04-02 13:20", who: "dana", script: "자산 정보 수정: 소분류 이동", before: "전자기기류 › 모니터", after: "전자기기류 › 노트북" },
    { d: "2026-04-02 13:20", who: "dana", script: "자산 정보 수정: 품목명 수정", before: "그램 16", after: "그램 16 (2024)" },
    { d: "2026-04-02 13:20", who: "dana", script: "자산 정보 수정: 고유관리번호 수정", before: "IT-2024-012", after: "IT-2024-0012" },
    { d: "2026-04-02 13:20", who: "dana", script: "자산 정보 수정: 유효기한 변경", before: "", after: D("2027-03-10") },
    { d: "2026-04-02 13:20", who: "dana", script: "자산 정보 수정: 태그 수정", before: "본사", after: "본사, 개발팀" },
    { d: "2026-04-02 13:20", who: "dana", script: "자산 정보 수정: S/N 수정", before: "SN-8842", after: "SN-8842-AA" },
    { d: "2026-04-02 13:20", who: "dana", script: "자산 정보 수정: IMEI 수정", before: "", after: "356938035643809" },
    { d: "2026-04-02 13:20", who: "dana", script: "자산 정보 수정: 제조연월 변경", before: Mo("2023-12-01"), after: Mo("2024-01-01") },
    { d: "2026-04-02 13:20", who: "dana", script: "자산 정보 수정: 구매연월 변경", before: "", after: Mo("2024-03-01") },
    { d: "2026-04-02 13:20", who: "dana", script: "자산 정보 수정: 구매가격 변경", before: P(1790000), after: P(1890000) },
    { d: "2026-04-02 13:20", who: "dana", script: "자산 정보 수정: 메모 수정", before: "", after: "<p><strong>키보드 자판</strong> 일부 마모 확인</p><ul><li>배정 반납 시 상태 재확인</li></ul>" },
    { d: "2024-03-12 09:00", who: "dana", script: "자산 등록" },
  ];

  const disposed = find("A020");
  if (disposed) disposed._activityLog = [
    { d: "2025-12-30 09:00", who: "dana", script: "상태 변경: 폐기 처리", before: "배정 중", after: "폐기" },
    { d: "2024-04-01 09:00", who: "dana", script: "배정 관리: 신규 배정", target: emp("최유진"), before: "", after: D("2024-04-01") },
    { d: "2024-03-12 09:00", who: "dana", script: "자산 등록" },
  ];

  const stationery = find("A106");
  if (stationery) stationery._activityLog = [
    { d: "2026-09-01 17:00", who: "dana", script: "배정 관리: 반납", target: emp("정우성"), before: D("2026-03-05"), after: "" },
    { d: "2026-08-10 09:10", who: "dana", script: "배정 관리: 배정일 변경", target: emp("김민수"), before: D("2026-06-02"), after: D("2026-06-01") },
    { d: "2026-07-01 11:00", who: "dana", script: "자산 사진 관리: 사진 변경", photoValue: true, before: [], after: [ph.d] },
    { d: "2026-06-15 14:00", who: "dana", script: "자산 정보 수정: 품목명 수정", before: "네임펜", after: "네임펜 세트" },
    { d: "2026-06-15 14:00", who: "dana", script: "자산 정보 수정: 구매가격 변경", before: P(3000), after: P(3500) },
    { d: "2026-06-01 09:00", who: "dana", script: "배정 관리: 신규 배정", target: emp("김민수"), before: "", after: D("2026-06-01") },
    { d: "2026-03-05 09:00", who: "dana", script: "배정 관리: 신규 배정", target: emp("정우성"), before: "", after: D("2026-03-05") },
    { d: "2026-03-02 09:00", who: "dana", script: "자산 등록" },
  ];
})();
