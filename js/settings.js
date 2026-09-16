/* 설정 — 자산관리 권한 설정(설정-1, 구조설계안 4.1). 다른 Shopl 설정 화면(할 일 설정하기 > 템플릿 생성 권한) 패턴 참조:
   관리자(고정 포함, 비활성) + 리더 체크 시 전체/특정 리더 라디오, 특정 리더는 대상 선택(리더 이상만 노출) + 변경 있을 때만 저장 활성화 */
(function () {
  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300";
    document.body.appendChild(t); setTimeout(() => t.remove(), 1800);
  }
  const CLOSE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
  const AVATAR_COLORS = ["#5b8def", "#8f6ef0", "#eb7f8b", "#3fb37f", "#e0a63c", "#4dabf7"];
  function avatarColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
  }
  // "특정 리더" 대상 선택 팝업용 — 일반 구성원 전체가 아니라 리더 이상 권한을 가진 사람만 노출되는 샘플
  const LEADERS = [
    { name: "김민수", team: "개발팀" }, { name: "이서연", team: "디자인팀" },
    { name: "박지훈", team: "영업팀" }, { name: "정우성", team: "CS팀" },
    { name: "김철수", team: "운영팀" }, { name: "한소희", team: "디자인팀" },
    { name: "장민호", team: "국내영업" }, { name: "배수지", team: "CS팀" },
  ];

  // leaderMode: "none"(관리자만) | "all"(관리자 및 모든 리더) | "specific"(관리자 및 특정 리더)
  let saved = { leaderMode: "none", leaderTargets: [] };
  let draft = { leaderMode: "none", leaderTargets: [] };

  function isDirty() {
    if (draft.leaderMode !== saved.leaderMode) return true;
    if (draft.leaderMode !== "specific") return false;
    const a = [...draft.leaderTargets].sort(), b = [...saved.leaderTargets].sort();
    return a.length !== b.length || a.some((v, i) => v !== b[i]);
  }

  // 특정 리더를 선택했는데 대상이 0명이면 저장 불가
  function canSave() {
    if (draft.leaderMode === "specific" && draft.leaderTargets.length === 0) return false;
    return isDirty();
  }

  function targetRowHtml() {
    if (!draft.leaderTargets.length) {
      return `<button type="button" class="perm-target-btn" data-target-open><span class="muted">선택</span><span class="chev">›</span></button>`;
    }
    const first = draft.leaderTargets[0];
    const chip = `${first}${draft.leaderTargets.length > 1 ? `<span class="chip-more">+${draft.leaderTargets.length - 1}</span>` : ""}`;
    return `
      <div class="perm-target-row">
        <button type="button" class="perm-target-chips" data-target-open>
          <span class="picker-avatar sm" style="background:${avatarColor(first)}">${first[0]}</span>
          <span class="perm-chip">${chip}</span>
        </button>
        <button type="button" class="perm-target-clear" data-target-clear aria-label="선택 해제">${CLOSE_ICON}</button>
      </div>`;
  }

  function bodyHtml() {
    const leaderOn = draft.leaderMode !== "none";
    return `
      <div class="settings-card">
        <h4>자산 관리 권한</h4>
        <ul class="settings-hint-list">
          <li>대분류·소분류 카테고리를 생성·수정·삭제할 수 있습니다.</li>
          <li>자산을 등록·수정·삭제할 수 있습니다.</li>
          <li>소분류별로 설정된 조회/배정 권한과 무관하게, 모든 소분류의 자산을 조회하고 배정/보유를 변경할 수 있습니다.</li>
        </ul>
        <label class="opt is-disabled"><input type="checkbox" checked disabled><span>관리자</span></label>
        <label class="opt"><input type="checkbox" data-toggle-leader${leaderOn ? " checked" : ""}><span>리더</span></label>
        ${leaderOn ? `
          <label class="opt child"><input type="radio" name="leader-mode" value="all"${draft.leaderMode === "all" ? " checked" : ""}><span>전체 리더</span></label>
          <label class="opt child"><input type="radio" name="leader-mode" value="specific"${draft.leaderMode === "specific" ? " checked" : ""}><span>특정 리더</span></label>
          ${draft.leaderMode === "specific" ? `<div class="perm-target-wrap" style="margin-left:44px">${targetRowHtml()}</div>` : ""}
        ` : ""}
      </div>
      <div class="settings-foot">
        <button class="btn primary" data-save${canSave() ? "" : " disabled"}>저장</button>
      </div>`;
  }

  function render() {
    const c = document.getElementById("content");
    c.innerHTML = `
      <div class="tabs">
        <a href="assets.html">현황</a>
        <a href="category.html">분류</a>
        <a class="active">설정</a>
      </div>
      <div class="settings-head">
        <h3>자산 관리</h3>
        <button class="btn sm" data-guide>사용 가이드 보기</button>
      </div>
      <div id="settings-body"></div>`;
    c.querySelector("[data-guide]").onclick = () => toast("사용 가이드 페이지 — 이후 URL 정의 예정");
    renderBody();
  }

  function renderBody() {
    const body = document.getElementById("settings-body");
    body.innerHTML = bodyHtml();

    body.querySelector("[data-toggle-leader]").onchange = e => {
      draft.leaderMode = e.target.checked ? "all" : "none";
      draft.leaderTargets = [];
      renderBody();
    };
    body.querySelectorAll('input[name="leader-mode"]').forEach(r => r.onchange = () => {
      draft.leaderMode = r.value;
      if (r.value === "all") draft.leaderTargets = [];
      renderBody();
    });
    const openBtn = body.querySelector("[data-target-open]");
    if (openBtn) openBtn.onclick = () => openLeaderPicker(draft.leaderTargets, res => { draft.leaderTargets = res; renderBody(); });
    const clearBtn = body.querySelector("[data-target-clear]");
    if (clearBtn) clearBtn.onclick = () => { draft.leaderTargets = []; renderBody(); };

    const saveBtn = body.querySelector("[data-save]");
    saveBtn.onclick = () => {
      if (saveBtn.disabled) return;
      saved = { leaderMode: draft.leaderMode, leaderTargets: [...draft.leaderTargets] };
      toast("저장되었습니다");
      renderBody();
    };
  }

  // 직원 선택(리더 이상만) — 대시보드 공용 "직원 선택" 팝업 패턴 참조: 좌측 검색+전체선택+목록, 우측 선택됨 요약+직접 추가+선택 리스트
  function openLeaderPicker(initial, onApply) {
    const sel = new Set(initial);
    let query = "";
    const p = document.createElement("div");
    p.className = "modal-back";
    p.innerHTML = `
      <div class="modal picker-modal" style="width:680px">
        <h3>직원 선택</h3>
        <div class="picker-split">
          <div class="picker-split-left">
            <input type="text" class="picker-search" placeholder="이름/사번/휴대폰 번호">
            <div class="picker-toolbar">
              <label class="picker-check"><input type="checkbox" data-select-all><span>전체 선택</span></label>
              <span class="right">전체 <b>${LEADERS.length}</b></span>
            </div>
            <div class="picker-memberlist" data-list></div>
          </div>
          <div class="picker-split-right">
            <div class="picker-selected-head">
              <span>선택됨 <b data-count>${sel.size}</b></span>
              <button type="button" class="btn sm" data-direct-add>+ 직접 추가</button>
            </div>
            <div class="picker-selected-list" data-selected-list></div>
          </div>
        </div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" data-ok>적용</button>
        </div>
      </div>`;
    document.body.appendChild(p);
    const list = p.querySelector("[data-list]");
    const countEl = p.querySelector("[data-count]");
    const selectedList = p.querySelector("[data-selected-list]");

    function renderSelected() {
      countEl.textContent = sel.size;
      selectedList.innerHTML = sel.size ? [...sel].map(name => `
        <div class="picker-selected-row">
          <span class="picker-avatar sm" style="background:${avatarColor(name)}">${name[0]}</span>
          <span>${name}</span>
          <button type="button" class="picker-selected-remove" data-remove="${name}" aria-label="제거">${CLOSE_ICON}</button>
        </div>`).join("") : '<p class="muted" style="padding:16px 0">선택된 인원이 없습니다.</p>';
      selectedList.querySelectorAll("[data-remove]").forEach(b => b.onclick = () => {
        sel.delete(b.dataset.remove);
        renderSelected();
        renderList();
      });
    }
    function renderList() {
      const filtered = LEADERS.filter(m => !query || m.name.includes(query));
      list.innerHTML = filtered.length ? filtered.map(m => `
        <label class="picker-member-row">
          <input type="checkbox" data-member="${m.name}"${sel.has(m.name) ? " checked" : ""}>
          <span class="picker-avatar" style="background:${avatarColor(m.name)}">${m.name[0]}</span>
          <span class="picker-member-info"><b>${m.name}</b><span>${m.team}</span></span>
        </label>`).join("") : `<p class="muted" style="padding:16px 0">결과가 없습니다.</p>`;
      p.querySelector("[data-select-all]").checked = filtered.length > 0 && filtered.every(m => sel.has(m.name));
      list.querySelectorAll("[data-member]").forEach(cb => cb.onchange = e => {
        e.target.checked ? sel.add(e.target.dataset.member) : sel.delete(e.target.dataset.member);
        p.querySelector("[data-select-all]").checked = filtered.length > 0 && filtered.every(m => sel.has(m.name));
        renderSelected();
      });
    }
    p.querySelector(".picker-search").addEventListener("input", e => { query = e.target.value; renderList(); });
    p.querySelector("[data-select-all]").onchange = e => {
      LEADERS.filter(m => !query || m.name.includes(query)).forEach(m => e.target.checked ? sel.add(m.name) : sel.delete(m.name));
      renderSelected();
      renderList();
    };
    p.querySelector("[data-direct-add]").onclick = () => toast(`"직접 추가" — 이후 단계에서 정의`);
    renderList();
    renderSelected();
    p.addEventListener("click", e => { if (e.target === p) p.remove(); });
    p.querySelector("[data-close]").onclick = () => p.remove();
    p.querySelector("[data-ok]").onclick = () => { p.remove(); onApply([...sel]); };
  }

  window.SettingsScreen = { render };
})();
