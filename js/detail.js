(function () {
  const TODAY = /* @__PURE__ */new Date("2026-09-04"),
    {
      assets
    } = window.DATA,
    STATUS_LABEL = {
      stock: ["배정 가능", "stock"],
      assigned: ["배정 중", "assigned"],
      repair: ["수리/점검 중", "repair"],
      lost: ["분실", "lost"],
      disposed: ["폐기", "disposed"]
    };
  function expiryBadge(d) {
    if (!d) return '<span class="muted">—</span>';
    const days = Math.ceil((new Date(d) - TODAY) / 864e5),
      [t, c] = days < 0 ? ["만료", "exp-over"] : days <= 7 ? ["만료 예정", "exp-soon"] : ["유효", "exp-valid"];
    return `${window.fmtDate(d)} <span class="badge ${c}">${t}</span>`;
  }
  const chips = arr => arr && arr.length ? arr.map(l => `<span class="tag">${l}</span>`).join("") : '<span class="muted">—</span>';
  const targetParams=new URLSearchParams(location.search), targetContext=["employee","worksite"].includes(targetParams.get("targetType"))?{type:targetParams.get("targetType"),value:targetParams.get("targetValue")}:null;
  function canManageAssets() { return window.hasPrototypeAssetManagePermission(); }
  let historyDir = "desc", detailTab = "current", historyAssetId = null;
  const memoHtml = note => window.AssetMemo.render(note),
    IC_EMP = '<svg class="hi" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5"/></svg>',
    IC_WS = '<svg class="hi" viewBox="0 0 24 24"><path d="M4 20V9.5L12 4l8 5.5V20"/><path d="M9.5 20v-5h5v5"/></svg>',
    IC_EDIT = '<svg viewBox="0 0 24 24"><path d="M4 20l1-4L16 5l3 3L8 19l-4 1z"/><path d="M13.5 6.5l4 4"/></svg>',
    INFO_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8v.01"/></svg>',
    EMP_GROUP = {
      김민수: "개발팀",
      이서연: "디자인팀",
      박지훈: "영업팀",
      정우성: "CS팀",
      김철수: "운영팀",
      최유진: "개발팀",
      한소희: "디자인팀",
      오세훈: "운영팀"
    },
    WS_CODE = {
      강남점: "GN-01",
      판교점: "PG-01",
      본사: "HQ-01",
      역삼점: "YS-01"
    },
    WS_ADDRESS = {
      강남점: "서울특별시 강남구 테헤란로 129",
      판교점: "경기도 성남시 분당구 판교역로 235",
      본사: "서울특별시 중구 을지로 100",
      역삼점: "서울특별시 강남구 역삼로 180"
    },
    MEMBERS = [{
      name: "김민수",
      team: "개발팀",
      empNo: "2021001",
      phone: "010-2001-1234",
      grade: "Lv.3"
    }, {
      name: "이서연",
      team: "디자인팀",
      empNo: "2021015",
      phone: "010-3412-5678",
      grade: "Lv.2"
    }, {
      name: "박지훈",
      team: "영업팀",
      empNo: "2020032",
      phone: "010-8823-9910",
      grade: "Lv.4"
    }, {
      name: "정우성",
      team: "CS팀",
      empNo: "2022041",
      phone: "010-5567-2231",
      grade: "Lv.1"
    }, {
      name: "김철수",
      team: "운영팀",
      empNo: "2019008",
      phone: "010-9012-4456",
      grade: "Lv.5"
    }, {
      name: "최유진",
      team: "개발팀",
      empNo: "2023019",
      phone: "010-6634-8821",
      grade: "Lv.1"
    }, {
      name: "한소희",
      team: "디자인팀",
      empNo: "2022055",
      phone: "010-4478-2093",
      grade: "Lv.2"
    }, {
      name: "장민호",
      team: "국내영업",
      empNo: "2020018",
      phone: "010-2345-6712",
      grade: "Lv.3"
    }, {
      name: "오세훈",
      team: "운영팀",
      empNo: "2018014",
      phone: "010-7712-3345",
      grade: "Lv.4"
    }, {
      name: "배수지",
      team: "CS팀",
      empNo: "2021028",
      phone: "010-3356-7789",
      grade: "Lv.2"
    }, {
      name: "윤재현",
      team: "해외영업",
      empNo: "2019033",
      phone: "010-4467-8890",
      grade: "Lv.5"
    }, {
      name: "임하늘",
      team: "개발팀",
      empNo: "2022009",
      phone: "010-5578-9901",
      grade: "Lv.1"
    }],
    CLOSE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    AVATAR_COLORS = ["#5b8def", "#8f6ef0", "#eb7f8b", "#3fb37f", "#e0a63c", "#4dabf7"];
  function avatarColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
  }
  const AVATAR_WS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20V9.5L12 4l8 5.5V20"/><path d="M9.5 20v-5h5v5"/></svg>';
  function assignIdentity(x) {
    return x.employee ? `<span class="acard-avatar" style="background:${avatarColor(x.employee)}">${x.employee[0]}</span>
        <div><div class="acard-name">${x.employee}</div><div class="acard-sub">${EMP_GROUP[x.employee] || '<span class="muted">—</span>'}</div></div>` : `<span class="acard-avatar ws">${AVATAR_WS_ICON}</span>
      <div><div class="acard-name">${x.worksite}</div><div class="acard-sub">${WS_CODE[x.worksite] || '<span class="muted">—</span>'}</div></div>`;
  }
  const typeBadge = x => `<span class="acard-type" title="${x.employee ? "구성원" : "근무지"}">${x.employee ? IC_EMP : IC_WS}</span>`,
    photosOf = window.assetPhotos;
  function tsNow() {
    const d = /* @__PURE__ */new Date(),
      p = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  }
  const zipName = a => window.assetDownloadFileName(`${a.assetNo || a.product}_Photos_${tsNow()}.zip`);
  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg, t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300", document.body.appendChild(t), setTimeout(() => t.remove(), 1800);
  }
  function openStatusConfirmModal(title, note, onConfirm) {
    const cb = document.createElement("div");
    cb.className = "modal-back", cb.style.zIndex = 340, cb.innerHTML = `
      <div class="modal" style="width:380px">
        <h3>${title}</h3>
        <div class="body"><div class="perm-info-note">${INFO_ICON}<span>${note}</span></div></div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn primary" data-cok>확인</button>
        </div>
      </div>`, cb.querySelector("[data-cclose]").onclick = () => cb.remove(), cb.querySelector("[data-cok]").onclick = () => {
      cb.remove(), onConfirm();
    }, document.body.appendChild(cb);
  }
  function applyStatusChange(a, script, newStatus, successMessage) {
    const before = STATUS_LABEL[a.status][0];
    a.status = newStatus, logActivity(a, {
      script,
      before,
      after: STATUS_LABEL[a.status][0]
    }), toast(successMessage || `${script.split(": ").pop()}되었습니다.`), render();
  }
  const deriveReturnStatus = a => (a.assignments || []).length > 0 ? "assigned" : "stock";
  function handleRepairStart(a) {
    openStatusConfirmModal("수리/점검을 접수하시겠습니까?", "수리/점검을 접수하면 기존 배정은 유지되고 자산 상태가 수리/점검 중으로 변경됩니다.", () => applyStatusChange(a, "상태 변경: 수리/점검 접수", "repair", "수리/점검이 접수되었습니다."));
  }
  function handleLostReport(a) {
    openStatusConfirmModal("분실 신고하시겠습니까?", "분실 신고 시 기존 배정은 유지된 채 상태만 분실로 변경됩니다.", () => applyStatusChange(a, "상태 변경: 분실 신고", "lost"));
  }
  function handleRepairDone(a) {
    openStatusConfirmModal("수리/점검을 완료하시겠습니까?", "수리/점검을 완료하면 현재 배정 여부에 따라 자산 상태가 배정 중 또는 배정 가능 상태로 변경됩니다.", () => applyStatusChange(a, "상태 변경: 수리/점검 완료", deriveReturnStatus(a), "수리/점검이 완료되었습니다."));
  }
  function handleLostRecover(a) {
    openStatusConfirmModal("분실 회수 처리하시겠습니까?", "분실 회수 시 배정 여부에 따라 배정 중 또는 배정 가능 상태로 돌아갑니다.", () => applyStatusChange(a, "상태 변경: 분실 회수", deriveReturnStatus(a)));
  }
  function openDisposeModal(a) {
    const cb = document.createElement("div");
    cb.className = "modal-back", cb.style.zIndex = 340, cb.innerHTML = `
      <div class="modal" style="width:380px">
        <h3>폐기 처리하시겠습니까?</h3>
        <div class="body">
          <div class="danger-note">${WARN_ICON}<span>기존 배정은 자동으로 종료되며, 이후 배정·자산 수정이 제한됩니다. 자산 관리 권한자는 배정이 없는 배정 가능 상태로 복구할 수 있습니다.${window.AssetLinks.count(a.id) ? ` 연결된 자산 ${window.AssetLinks.count(a.id)}건과의 연결이 해제됩니다.` : ""}</span></div>
          <div class="field" style="margin-top:14px;margin-bottom:0">
            <input type="text" data-del-input placeholder="입력">
          </div>
          <p class="muted" style="margin-top:6px">박스에 DELETE를 입력하면 [확인] 버튼이 활성화됩니다.</p>
        </div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn danger" data-cok disabled>확인</button>
        </div>
      </div>`, cb.querySelector("[data-cclose]").onclick = () => cb.remove();
    const input = cb.querySelector("[data-del-input]"),
      okBtn = cb.querySelector("[data-cok]"),
      confirmed = () => input.value.trim().toUpperCase() === "DELETE";
    input.addEventListener("input", () => {
      okBtn.disabled = !confirmed();
    }), okBtn.onclick = () => {
      if (!confirmed()) return;
      if(!window.hasPrototypeAssetManagePermission()){cb.remove();toast("자산 관리 권한이 없습니다.");return;}
      const before = STATUS_LABEL[a.status][0];
      a.status = "disposed", a.assignments = [], logActivity(a, {
        script: "상태 변경: 폐기 처리",
        before,
        after: STATUS_LABEL[a.status][0]
      }), pruneLinks("폐기"), cb.remove(), toast("폐기 처리되었습니다."), render();
    }, document.body.appendChild(cb), input.focus();
  }
  const STATUS_ACTION_HANDLERS = {
    // 배정 가능 상태의 상태 변경 메뉴에서 배정 현황의 [배정]과 같은 Modal을 바로 연다.
    "배정": a => openAssignAddModal(a),
    "수리/점검 접수": handleRepairStart,
    "분실 신고": handleLostReport,
    "수리/점검 완료": handleRepairDone,
    "분실 회수": handleLostRecover,
    "폐기 처리": openDisposeModal,
    "폐기 복구": a => window.openAssetRestoreConfirm(a, message => {
      render(), toast(message);
    })
  };
  function statusDropdown(anchor, items, a) {
    document.querySelectorAll(".dropdown-menu").forEach(m => m.remove());
    const menu = document.createElement("div");
    menu.className = "dropdown-menu", menu.innerHTML = items.map((x, i) => `<button data-i="${i}"${x === "폐기 처리" ? ' class="danger"' : ""}>${x}</button>`).join("");
    const r = anchor.getBoundingClientRect();
    menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${Math.max(8, r.right - 180)}px;min-width:180px`, document.body.appendChild(menu), menu.querySelectorAll("button").forEach(b => b.onclick = () => {
      menu.remove();
      const label = items[+b.dataset.i];
      (STATUS_ACTION_HANDLERS[label] || (() => toast(`"${label}" — 이후 단계에서 정의`)))(a);
    }), setTimeout(() => {
      const close = e => {
        menu.contains(e.target) || (menu.remove(), document.removeEventListener("click", close));
      };
      document.addEventListener("click", close);
    });
  }
  function confirmWriteExit(onLeave) {
    const cb = document.createElement("div");
    cb.className = "modal-back", cb.style.zIndex = 340, cb.innerHTML = `<div class="modal sm" style="width:340px" role="dialog" aria-modal="true" aria-label="작성을 중단하시겠습니까?">
      <h3>작성을 중단하시겠습니까?</h3><div class="body" style="font-size:14px">지금까지 작성한 내용은 저장되지 않습니다.</div>
      <div class="foot"><button type="button" class="btn" data-exit-stay>취소</button><button type="button" class="btn primary" data-exit-leave>확인</button></div></div>`, document.body.appendChild(cb), cb.querySelector("[data-exit-stay]").onclick = () => cb.remove(), cb.querySelector("[data-exit-leave]").onclick = () => {
      cb.remove(), onLeave();
    };
  }
  function confirmModal(msg, onOk) {
    const cb = document.createElement("div");
    cb.className = "modal-back", cb.style.zIndex = 340, cb.innerHTML = `
      <div class="modal" style="width:380px">
        <div class="body" style="padding-top:20px;font-size:13px">${msg}</div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn primary" data-cok>확인</button>
        </div>
      </div>`, cb.querySelector("[data-cclose]").onclick = () => cb.remove(), cb.querySelector("[data-cok]").onclick = () => {
      cb.remove(), onOk();
    }, document.body.appendChild(cb);
  }
  function openMemoQuickEditModal(a) {
    const before = window.AssetMemo.normalize(a.note || "");
    window.AssetMemo.open({
      value: before,
      onSave: after => {
        a.note = after, a._noteFormat = "html", logActivity(a, {
          script: "자산 정보 수정: 메모 수정",
          before: before || "",
          after: after || ""
        }), toast("저장되었습니다."), render();
      }
    });
  }
  const WARN_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 9v4M12 16.5h.01M10.3 3.9 2.5 17.5a1.7 1.7 0 0 0 1.47 2.55h16.06a1.7 1.7 0 0 0 1.47-2.55L13.7 3.9a1.7 1.7 0 0 0-2.94 0z"/></svg>';
  function openDeleteAssetModal(a) {
    const cb = document.createElement("div");
    cb.className = "modal-back", cb.style.zIndex = 340, cb.innerHTML = `
      <div class="modal" style="width:380px">
        <h3>삭제하시겠습니까?</h3>
        <div class="body">
          <div class="danger-note">${WARN_ICON}<span>삭제하면 복구할 수 없으니 신중하게 결정해주세요.${window.AssetLinks.count(a.id) ? ` 연결된 자산 ${window.AssetLinks.count(a.id)}건과의 연결이 해제됩니다.` : ""}</span></div>
          <div class="field" style="margin-top:14px;margin-bottom:0">
            <input type="text" data-del-input placeholder="입력">
          </div>
          <p class="muted" style="margin-top:6px">박스에 DELETE를 입력하면 [삭제] 버튼이 활성화됩니다.</p>
        </div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn danger" data-cok disabled>삭제</button>
        </div>
      </div>`, cb.querySelector("[data-cclose]").onclick = () => cb.remove();
    const input = cb.querySelector("[data-del-input]"),
      okBtn = cb.querySelector("[data-cok]"),
      confirmed = () => input.value.trim().toUpperCase() === "DELETE";
    input.addEventListener("input", () => {
      okBtn.disabled = !confirmed();
    }), okBtn.onclick = () => {
      if (!confirmed()) return;
      const deleted = window.archiveDeletedAsset(a, "dana");
      sessionStorage.setItem("justDeletedAssetRecord", JSON.stringify(deleted)), sessionStorage.setItem("justDeletedAssetId", a.id), sessionStorage.setItem("pendingToast", "삭제되었습니다."), location.href = "assets.html";
    }, document.body.appendChild(cb), input.focus();
  }
  function moreDropdown(anchor, items, a) {
    document.querySelectorAll(".dropdown-menu").forEach(m => m.remove());
    const menu = document.createElement("div");
    menu.className = "dropdown-menu", menu.innerHTML = items.map((x, i) => `<button data-i="${i}"${x === "자산 삭제" ? ' class="danger"' : ""}>${x}</button>`).join("");
    const r = anchor.getBoundingClientRect();
    menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${Math.max(8, r.right - 180)}px;min-width:180px`, document.body.appendChild(menu), menu.querySelectorAll("button").forEach(b => b.onclick = () => {
      menu.remove();
      const label = items[+b.dataset.i];
      label === "자산 삭제" ? openDeleteAssetModal(a) : label === "자산 수정" ? window.openAssetAddModal({
        asset: a,
        logActivity: entry => logActivity(a, entry),
        onSaved: () => render()
      }) : toast(`"${label}" — 이후 단계에서 정의`);
    }), setTimeout(() => {
      const close = e => {
        menu.contains(e.target) || (menu.remove(), document.removeEventListener("click", close));
      };
      document.addEventListener("click", close);
    });
  }
  const btn = (label, cls = "btn sm") => `<button class="${cls}" data-act="${label}">${label}</button>`,
    bindActs = scope => scope.querySelectorAll("[data-act]").forEach(b => b.onclick = () => toast(`"${b.dataset.act}" — 이후 단계에서 정의`));
  function qrSampleSvg() {
    const mods = [],
      finder = (ox, oy) => {
        for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) (x === 0 || x === 6 || y === 0 || y === 6 || x >= 2 && x <= 4 && y >= 2 && y <= 4) && mods.push([ox + x, oy + y]);
      };
    finder(0, 0), finder(14, 0), finder(0, 14);
    let seed = 42;
    const rand = () => (seed = seed * 1103515245 + 12345 & 2147483647, seed / 2147483647);
    for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) !(x < 8 && y < 8 || x >= 13 && y < 8 || x < 8 && y >= 13) && rand() > 0.55 && mods.push([x, y]);
    return `<svg viewBox="0 0 84 84" fill="#1b1d1f"><rect width="84" height="84" fill="#fff"/>${mods.map(([x, y]) => `<rect x="${x * 4}" y="${y * 4}" width="4" height="4"/>`).join("")}</svg>`;
  }
  function labelSheetHtml(a) {
    return `
      <div class="label-sheet">
        <div class="label-qr">${qrSampleSvg()}</div>
        <div class="label-text">
          <div class="label-product">${a.product}</div>
          ${a.assetNo ? `<div class="label-no">${a.assetNo}</div>` : ""}
          <div class="label-cat">${a.group} › ${a.sub}</div>
        </div>
      </div>`;
  }
  function openLabelPreview(a) {
    const back = document.createElement("div");
    back.className = "modal-back", back.style.zIndex = 350, back.innerHTML = `
      <div class="label-pop">
        <button class="label-pop-close" data-close aria-label="닫기">✕</button>
        ${labelSheetHtml(a)}
      </div>`, back.addEventListener("click", e => {
      e.target === back && back.remove();
    }), back.querySelector("[data-close]").onclick = () => back.remove(), document.body.appendChild(back);
  }
  function openQrPopover(a, anchor) {
    document.querySelectorAll(".qty-popover, .qr-popover").forEach(m => m.remove());
    const pop = document.createElement("div");
    pop.className = "qr-popover", pop.innerHTML = `
      <div class="qr-popover-body">
        <button class="qr-thumb" data-preview aria-label="라벨 미리보기">
          ${qrSampleSvg()}
          <span class="qr-thumb-hover">라벨 미리보기</span>
        </button>
        <div>
          <p style="font-size:13px;font-weight:600">${a.product}${a.assetNo ? ` / ${a.assetNo}` : ""}</p>
          <p class="muted" style="margin-top:4px">QR 라벨을 스캔하여 앱에서 자산의 배정 현황 및 이력을 조회할 수 있습니다.</p>
        </div>
      </div>
      <div class="qr-popover-acts">
        <button class="btn primary" data-dl>라벨 다운로드</button>
        <button class="btn" data-close>닫기</button>
      </div>`;
    const r = anchor.getBoundingClientRect();
    pop.style.cssText = `position:fixed;top:${r.bottom + 8}px;left:${Math.max(8, r.right - 320)}px`, document.body.appendChild(pop), pop.querySelector("[data-close]").onclick = () => pop.remove(), pop.querySelector("[data-preview]").onclick = () => openLabelPreview(a), pop.querySelector("[data-dl]").onclick = () => {
      const d = /* @__PURE__ */new Date(),
        p2 = n => String(n).padStart(2, "0"),
        ts = `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}_${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}`,
        label = a.assetNo || a.id,
        fileName = window.assetDownloadFileName(`QR_${label}_${ts}.png`);
      toast(`"${fileName}" 다운로드 (프로토타입 — 반영 없음)`), pop.remove();
    }, setTimeout(() => {
      const close = e => {
        !pop.contains(e.target) && e.target !== anchor && (pop.remove(), document.removeEventListener("click", close));
      };
      document.addEventListener("click", close);
    });
  }
  function activityOf(a) {
    const ev = [{
      d: `${a.createdAt || a.purchaseDate || "2024-01-01"} 09:00`,
      script: "자산 등록",
      who: "dana"
    }];
    return (a.assignments || []).forEach(x => ev.push({
      d: `${x.since} 09:00`,
      script: "배정 관리: 신규 배정",
      target: x,
      before: "",
      after: window.fmtDate(x.since),
      who: "dana"
    })), a.status === "repair" && ev.push({
      d: "2026-08-14 09:00",
      script: "상태 변경: 수리/점검 접수",
      before: "배정 중",
      after: "수리/점검 중",
      who: "dana"
    }), a.status === "lost" && ev.push({
      d: "2026-07-21 09:00",
      script: "상태 변경: 분실 신고",
      before: "배정 중",
      after: "분실",
      who: "정우성"
    }), a.status === "disposed" && ev.push({
      d: "2025-12-30 09:00",
      script: "상태 변경: 폐기 처리",
      before: "배정 중",
      after: "폐기",
      who: "dana"
    }), a.note && ev.push({
      d: "2026-06-02 09:00",
      script: "자산 정보 수정: 메모 수정",
      before: "",
      after: a.note,
      who: "dana"
    }), ev.sort((x, y) => x.d < y.d ? 1 : -1);
  }
  function activityLog(a) {
    return a._activityLog || (a._activityLog = activityOf(a)), a._activityLog;
  }
  function todayStr() {
    const p = n => String(n).padStart(2, "0");
    return `${TODAY.getFullYear()}-${p(TODAY.getMonth() + 1)}-${p(TODAY.getDate())}`;
  }
  function nowStr() {
    const p = n => String(n).padStart(2, "0"),
      real = /* @__PURE__ */new Date();
    return `${todayStr()} ${p(real.getHours())}:${p(real.getMinutes())}`;
  }
  function logActivity(a, entry) {
    activityLog(a).unshift({
      d: nowStr(),
      who: "dana",
      ...entry
    });
  }
  function historyPerson(name) {
    const retired = ["retired", "resigned"].includes(window.DATA.targetStatuses?.employee?.[name]);
    return {label:retired ? `[퇴사] ${Array.from(name || "").map(() => "*").join("")}` : name || "—", initial:retired ? "" : (name || "")[0] || ""};
  }
  function historyTargetHtml(target, value) {
    if (!target || !value) return window.AssetExtra.esc(value || "없음");
    const person = target.employee && historyPerson(target.employee), inactive = target.worksite && window.DATA.targetStatuses?.worksite?.[target.worksite] === "inactive";
    const icon = person ? `<span class="hval-avatar" style="background:${avatarColor(target.employee)}">${person.initial}</span>` : IC_WS;
    return `${icon}${window.AssetExtra.esc(person ? person.label : `${inactive ? "[비활성] " : ""}${target.worksite}`)} · ${window.AssetExtra.esc(value)}`;
  }
  function historyCardHtml(e) {
    const esc = window.AssetExtra.esc, who = historyPerson(e.who), isLink = (e.script || "").startsWith("자산 연결:"),
      related = isLink ? assets.find(a => a.id === e.relatedAssetId || (!e.relatedAssetId && `${a.product} · ${a.assetNo}` === (e.before || e.after))) : null,
      hiddenRelated = isLink && (e.relatedAssetId ? !related || !window.AssetAccess.canView(related) : related && !window.AssetAccess.canView(related));
    const valueHtml = (value, side) => {
      if (e.photoValue) return window.assetPhotoThumbsHtml(value);
      if (e.script === "자산 정보 수정: 메모 수정") return value ? window.AssetMemo.render(value) : "없음";
      if (isLink && value && hiddenRelated) return "조회 불가 자산";
      if (e.assignmentMove) {
        const target = side === "before" ? e.previousTarget : e.nextTarget;
        return target ? historyTargetHtml(target, window.fmtDate(target.since)) : esc(value || "없음");
      }
      return e.target ? historyTargetHtml(e.target, value) : esc(value || "없음");
    };
    return `
      <div class="hcard" data-history-time="${esc(e.d)}">
        <div class="hcard-head">
          <span class="hcard-time">${window.fmtDateTime(e.d)}</span>
          <span class="hcard-avatar" style="background:${avatarColor(e.who || "")}">${esc(who.initial)}</span>
          <span class="hcard-who">${esc(who.label)}</span>
        </div>
        <div class="hcard-script">${esc(e.script)}</div>
        ${"before" in e ? `
          <div class="hcard-diff">
            <div class="hcard-row"><span class="hcard-tag old">기존</span><span class="hcard-val">${valueHtml(e.before,"before")}</span></div>
            <div class="hcard-row"><span class="hcard-tag new">변경</span><span class="hcard-val">${valueHtml(e.after,"after")}</span></div>
          </div>` : ""}
      </div>`;
  }
  function timelineHtml(a) {
    // Never reverse the stored log: equal-time activities keep the save/field order in both directions.
    const entries = activityLog(a).map((e,index) => ({e:window.AssetMoves.forTarget(e,targetContext),index}))
      .filter(({e}) => window.AssetExtra.historyVisible(a,e))
      .sort((x,y) => (historyDir === "asc" ? 1 : -1) * String(x.e.d).localeCompare(String(y.e.d)) || x.index-y.index);
    return entries.length ? `<div class="dtimeline">${entries.map(({e}) => historyCardHtml(e)).join("")}</div>` : '<p class="muted" style="padding:6px 0">표시할 이력이 없습니다.</p>';
  }
  const HISTORY_ASC_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18V6M5 6l-3 3M5 6l3 3"/><path d="M11 7h4M11 12h7M11 17h10"/></svg>',
    HISTORY_DESC_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 6v12M5 18l-3-3M5 18l3-3"/><path d="M11 7h10M11 12h7M11 17h4"/></svg>';
  const STOCK_PAGE_SIZE = 20;
  let stockPage = 1;
  function assignCurrentHtml(a) {
    const asg = a.assignments || [];
    // 자산 한 건은 한 대상에게만 배정한다(D-20261030-14·15). 배정이 없으면 빈 상태 안에 [배정]을 둔다.
    return asg.length ? `<div class="acard-list">${asg.slice(0, 1).map((x, idx) => ({
      x,
      idx
    })).sort((p, q) => p.x.since === q.x.since ? 0 : p.x.since < q.x.since ? 1 : -1).map(({
      x,
      idx
    }) => `
      <div class="acard" data-idx="${idx}">
        ${typeBadge(x)}${targetContext&&x[targetContext.type]===targetContext.value?'<span class="badge assigned">선택 대상</span>':""}
        <div class="acard-id">${assignIdentity(x)}</div>
        <div class="acard-foot">
          <span class="acard-date">배정일 <b>${window.fmtDate(x.since)}</b><button class="icon-edit" data-dateedit aria-label="배정일 수정" title="배정일 수정">${IC_EDIT}</button></span>
          <div class="acard-actions">
            <button class="btn sm" data-act="반납">반납</button>
            <button class="btn sm" data-act="이동">이동</button>
          </div>
        </div>
      </div>`).join("")}</div>${linksHtml(a)}` : `<div class="assign-empty"><p class="muted">배정 대상이 없습니다.</p>${a.status === "disposed" ? "" : '<button class="btn sm" data-assign-new>배정</button>'}</div>`;
  }
  function applyTargetContext(scope,a){
    if(!window.AssetAccess.canState(a)){scope.querySelectorAll('[data-dateedit],.acard-actions,#assign-actions,[data-assign-new]').forEach(el=>el.remove());}
    if(!targetContext)return;
    const idx=(a.assignments||[]).findIndex(x=>x[targetContext.type]===targetContext.value);
    if(idx<0){scope.querySelector('.dgrid').innerHTML='<p class="muted">설정이 변경되었습니다. 잠시 후 다시 시도해주세요.</p>';return;}
    scope.querySelectorAll('.navbtns').forEach(x=>x.remove());
    scope.querySelectorAll('.acard[data-idx]').forEach(card=>{if(+card.dataset.idx!==idx)card.querySelectorAll('[data-act],[data-dateedit]').forEach(x=>x.remove());});
    const head=scope.querySelector('.dhead-sub');if(head)head.insertAdjacentHTML('beforeend',`<div>${targetContext.value} · 배정일 ${window.fmtDate(a.assignments[idx].since)}</div>`);
  }
  const IC_CAL = '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
  function dateFieldHtml(initialIso) {
    return `
      <div class="dfield">
        <input type="text" inputmode="numeric" data-dtext placeholder="YYYY.MM.DD" maxlength="10" value="${initialIso ? initialIso.replace(/-/g, ".") : ""}">
        <span class="dfield-pick">${IC_CAL}<input type="date" data-dnative tabindex="-1"></span>
      </div>
      <p class="field-err" data-date-err hidden>유효한 날짜가 아닙니다.</p>`;
  }
  function wireDateField(scope, maxIso, onChange) {
    const text = scope.querySelector("[data-dtext]"),
      native = scope.querySelector("[data-dnative]");
    native.max = maxIso;
    const digitsOf = v => v.replace(/\D/g, "").slice(0, 8),
      format = d => d.length > 6 ? `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6)}` : d.length > 4 ? `${d.slice(0, 4)}.${d.slice(4)}` : d,
      getValue = () => {
        const d = digitsOf(text.value);
        if (d.length !== 8) return null;
        const y = d.slice(0, 4),
          m = d.slice(4, 6),
          dd = d.slice(6, 8),
          curYear = TODAY.getFullYear();
        if (+y < curYear - 100 || +y > curYear || +m < 1 || +m > 12 || +dd < 1 || +dd > 31) return null;
        const dt = new Date(+y, +m - 1, +dd);
        if (dt.getMonth() !== +m - 1 || dt.getDate() !== +dd) return null;
        const iso = `${y}-${m}-${dd}`;
        return iso > maxIso ? null : iso;
      },
      errEl = scope.querySelector("[data-date-err]"),
      showError = on => {
        text.classList.toggle("has-err", on), errEl && (errEl.hidden = !on);
      },
      checkError = () => showError(!!text.value && !getValue());
    return text.addEventListener("input", () => {
      text.value = format(digitsOf(text.value)), showError(!1), onChange();
    }), text.addEventListener("blur", checkError), native.addEventListener("change", () => {
      native.value && (text.value = native.value.replace(/-/g, ".")), checkError(), onChange();
    }), getValue;
  }
  function openDatePopover(anchor, a, idx) {
    document.querySelectorAll(".qty-popover").forEach(m => m.remove());
    const cur = a.assignments[idx].since,
      max = todayStr(),
      pop = document.createElement("div");
    pop.className = "qty-popover", pop.innerHTML = `
      ${dateFieldHtml(cur)}
      <div class="qty-pop-acts">
        <button class="btn sm" data-dcancel>취소</button>
        <button class="btn sm primary" data-dsave>저장</button>
      </div>`;
    const r = anchor.getBoundingClientRect();
    pop.style.cssText = `position:fixed;top:${r.bottom + 6}px;left:${Math.max(8, r.right - 220)}px`, document.body.appendChild(pop);
    const save = pop.querySelector("[data-dsave]"),
      getValue = wireDateField(pop, max, () => {
        save.disabled = !getValue() || getValue() === cur;
      });
    save.onclick = () => {
      const v = getValue();
      if (!v) return;
      const x = a.assignments[idx];
      pop.remove(), confirmModal("배정일을 수정하시겠습니까?", () => {
        x.since = v, logActivity(a, {
          script: "배정 관리: 배정일 변경",
          target: x,
          before: window.fmtDate(cur),
          after: window.fmtDate(v)
        }), toast("배정일이 수정되었습니다."), render();
      });
    }, pop.querySelector("[data-dcancel]").onclick = () => pop.remove(), save.disabled = !getValue() || getValue() === cur, pop.querySelector("[data-dtext]").focus();
  }
  function wireAssignCards(scope, a) {
    scope.querySelector("[data-assign-new]")?.addEventListener("click", () => openAssignAddModal(a));
    wireLinks(scope, a);
    scope.querySelectorAll("[data-dateedit]").forEach(b => b.onclick = () => {
      const row = b.closest(".acard");
      openDatePopover(b, a, +row.dataset.idx);
    }), scope.querySelectorAll('[data-act="이동"]').forEach(b => b.onclick = () => {
      const row = b.closest(".acard");
      openReassignModal(a, +row.dataset.idx);
    }), scope.querySelectorAll('[data-act="반납"]').forEach(b => b.onclick = () => {
      const row = b.closest(".acard");
      returnAssignment(a, +row.dataset.idx);
    });
  }
  // ── 자산 연결(Web_dc_23 4번, Policy_15) ──
  const linkLabel = b => `${b.product} · ${b.assetNo}`;
  // Use only the permitted count; do not put hidden asset identities or statuses into markup.
  const maskedLinkRows = count => Array.from({length: count}, () => `<div class="link-row static link-unavailable-card"><span class="link-unavailable-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span><div class="link-row-main"><span class="link-row-name">조회 불가 자산</span><span class="link-row-no link-unavailable-mask" aria-hidden="true">••••••••</span></div></div>`).join("");
  const linkThumb = b => {
    const ph = window.assetPhotos(b);
    return ph.length ? `<span class="thumb" style="background:${ph[b._primary || 0].color}"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="m21 16-5-5-9 8"/></svg></span>` : '<span class="thumb empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-4 4 3 4-4 5 4"/></svg></span>';
  };
  function assetSummaryHtml(a) {
    return `<div class="aa-asset-summary" data-current-asset>${linkThumb(a)}<div class="aa-asset-summary-main"><strong>${window.AssetExtra.esc(a.product)}</strong><span>${window.AssetExtra.esc(a.assetNo)}</span></div></div>`;
  }
  function assignmentTargetActive(r) {
    const type = r.employee ? "employee" : "worksite", name = r.employee || r.worksite;
    return !["retired", "resigned", "inactive"].includes(window.DATA.targetStatuses?.[type]?.[name]);
  }
  // 자산 연결·이동·반납에서 같은 읽기 전용 현재 자산/배정 카드를 사용한다.
  function assetAssignmentSummaryHtml(a, r = a.assignments[0]) {
    const inactive = !assignmentTargetActive(r);
    return `<div class="asset-assignment-summary" data-current-asset-assignment>
      ${assetSummaryHtml(a)}
      <div class="asset-assignment-current">
        <div class="acard-id">${assignIdentity(r)}${inactive ? `<span class="badge">${r.employee ? "퇴사" : "비활성"}</span>` : ""}</div>
        <span class="acard-date">배정일 <b>${window.fmtDate(r.since)}</b></span>
      </div>
    </div>`;
  }
  function linkRowHtml(a, b) {
    const canCut = window.AssetAccess.canState(a) && window.AssetAccess.canState(b);
    return `<div class="link-row" data-link-open="${b.id}">
      ${linkThumb(b)}<div class="link-row-main"><span class="link-row-name">${b.product}</span><span class="link-row-no">${b.assetNo}</span></div>
      <span class="badge ${STATUS_LABEL[b.status][1]}">${STATUS_LABEL[b.status][0]}</span>
      ${canCut ? `<button class="btn sm" data-link-cut="${b.id}">연결 해제</button>` : ""}
    </div>`;
  }
  function linksHtml(a) {
    const v = window.AssetLinks.view(a),
      full = window.AssetLinks.count(a.id) >= window.AssetLinks.MAX,
      addBtn = window.AssetAccess.canState(a) ? `<button class="btn sm" data-link-add${full ? " disabled" : ""}>자산 연결</button>` : "";
    return `<div class="link-sec">
      <div class="link-head"><h3>연결된 자산 <span class="muted">${v.visible.length}</span></h3>${addBtn}</div>
      ${v.visible.length ? `<div class="link-list">${v.visible.map(b => linkRowHtml(a, b)).join("")}</div>` : v.hidden ? "" : '<p class="muted link-empty">연결된 자산이 없습니다.</p>'}
      ${v.hidden ? `<p class="link-hidden">조회 불가 자산 ${v.hidden}건</p><div class="link-list link-unavailable-list">${maskedLinkRows(v.hidden)}</div>` : ""}
    </div>`;
  }
  // 대상이 달라지거나 배정이 없어진 연결을 해제하고 양쪽 이력에 원인과 함께 남긴다.
  function pruneLinks(cause) {
    window.AssetLinks.prune().forEach(([x, y]) => {
      logActivity(x, { script: `자산 연결: 연결 해제(${cause})`, relatedAssetId:y.id, before: linkLabel(y), after: "" });
      logActivity(y, { script: `자산 연결: 연결 해제(${cause})`, relatedAssetId:x.id, before: linkLabel(x), after: "" });
    });
  }
  function wireLinks(scope, a) {
    scope.querySelector("[data-link-add]")?.addEventListener("click", () => openLinkAddModal(a));
    wireLinkRows(scope, a, () => render());
  }
  function wireLinkRows(scope, a, after) {
    scope.querySelectorAll("[data-link-open]").forEach(row => row.onclick = e => {
      e.target.closest("[data-link-cut]") || (location.href = `asset-detail.html?id=${row.dataset.linkOpen}`);
    });
    scope.querySelectorAll("[data-link-cut]").forEach(b => b.onclick = e => {
      e.stopPropagation();
      openLinkCutConfirm(a, window.DATA.assets.find(x => x.id === b.dataset.linkCut), after);
    });
  }
  function openLinkCutConfirm(a, b, after) {
    const cb = document.createElement("div");
    cb.className = "modal-back", cb.style.zIndex = 360, cb.innerHTML = `
      <div class="modal" style="width:380px">
        <h3>연결을 해제하시겠습니까?</h3>
        <div class="body"><div class="link-cut-pair">${assetSummaryHtml(a)}${assetSummaryHtml(b)}</div><p class="muted">배정은 바뀌지 않습니다.</p></div>
        <div class="foot"><button class="btn" data-cclose>취소</button><button class="btn primary" data-cok>확인</button></div>
      </div>`, document.body.appendChild(cb);
    cb.querySelector("[data-cclose]").onclick = () => cb.remove();
    cb.querySelector("[data-cok]").onclick = () => {
      cb.remove();
      if (!window.AssetLinks.remove(a, b)) return toast("설정이 변경되었습니다. 잠시 후 다시 시도해주세요."), after();
      logActivity(a, { script: "자산 연결: 연결 해제", relatedAssetId:b.id, before: linkLabel(b), after: "" });
      logActivity(b, { script: "자산 연결: 연결 해제", relatedAssetId:a.id, before: linkLabel(a), after: "" });
      toast("연결이 해제되었습니다."), after();
    };
  }
  // 현재 자산/배정 → 기존 배정 자산 연결 → 새 배정 및 연결
  function openLinkAddModal(a) {
    const room = window.AssetLinks.MAX - window.AssetLinks.count(a.id),
      picked = new Map(),
      r = a.assignments[0];
    const back = document.createElement("div");
    back.className = "modal-back", back.innerHTML = `
      <div class="modal link-add-modal">
        <h3>자산 연결</h3>
        <div class="body">
          ${assetAssignmentSummaryHtml(a, r)}
          <section class="link-add-sec">
            <h4>연결 가능 자산</h4>
            <p class="link-section-help">현재 배정 대상에게 배정되어 있는 자산입니다.</p>
            <div class="link-list" data-link-same></div>
          </section>
          <section class="link-add-sec" data-link-new-section${assignmentTargetActive(r) ? "" : " hidden"}>
            <h4>자산 추가 연결</h4>
            <p class="link-section-help">현재 배정 대상에게 새로 배정하며 자산을 연결합니다.</p>
            <div class="link-search-field"><input type="text" class="picker-search" placeholder="선택" data-link-q readonly aria-label="자산 선택 열기" aria-haspopup="dialog"><span class="link-search-count" data-link-picked-count hidden></span></div>
            <div class="field link-date" data-link-date><label>배정일</label>${dateFieldHtml(todayStr())}</div>
          </section>
        </div>
        <div class="foot"><button class="btn" data-close>취소</button><button class="btn primary" data-save disabled>저장</button></div>
      </div>`, document.body.appendChild(back);
    const save = back.querySelector("[data-save]"), dateBox = back.querySelector("[data-link-date]");
    const isNew = b => !(b.assignments || []).length;
    const getDate = wireDateField(dateBox, todayStr(), () => refresh());
    const rowHtml = (b, selection = picked, count = selection.size) => {
      const on = selection.has(b.id), lock = !on && count >= room;
      return `<label class="link-cand${on ? " on" : ""}"><input type="checkbox" data-pick="${b.id}"${on ? " checked" : ""}${lock ? " disabled" : ""}>${linkThumb(b)}<span class="link-row-main"><span class="link-row-name">${b.product}</span><span class="link-row-no">${b.assetNo}</span></span>${isNew(b) ? "" : `<span class="badge ${STATUS_LABEL[b.status][1]}">${STATUS_LABEL[b.status][0]}</span>`}</label>`;
    };
    const refresh = () => {
      const newCount = [...picked.values()].filter(isNew).length;
      back.querySelector("[data-link-new-section]").hidden = !assignmentTargetActive(r);
      dateBox.hidden = !assignmentTargetActive(r);
      save.disabled = !picked.size || newCount && !getDate();
    };
    const draw = () => {
      const same = window.AssetLinks.candidates(a),
        pickedNew = [...picked.values()].filter(isNew);
      back.querySelector("[data-link-same]").innerHTML = same.length ? same.map(b => rowHtml(b)).join("") : '<p class="muted link-empty">연결할 수 있는 자산이 없습니다.</p>';
      const count = back.querySelector("[data-link-picked-count]");
      back.querySelector("[data-link-q]").value = pickedNew[0]?.product || "";
      count.hidden = pickedNew.length < 2;
      count.textContent = pickedNew.length > 1 ? `+${pickedNew.length - 1}` : "";
      back.querySelectorAll("[data-pick]").forEach(c => c.onchange = () => {
        const b = window.DATA.assets.find(x => x.id === c.dataset.pick);
        c.checked ? picked.set(b.id, b) : picked.delete(b.id), draw();
      });
      refresh();
    };
    function openStockSelector() {
      if (!assignmentTargetActive(r)) return;
      const selection = new Map([...picked].filter(([, b]) => isNew(b))),
        existingCount = [...picked.values()].filter(b => !isNew(b)).length,
        initialNewCount = selection.size,
        selector = document.createElement("div"), esc = window.AssetExtra.esc;
      let query = "", categoryScope = [];
      const accessibleCategories = window.DATA.categories.filter(c => {
        const probe = {group:c.group,sub:c.sub,status:"stock"};
        return window.AssetAccess.canView(probe) && window.AssetAccess.canState(probe);
      });
      const candidates = () => window.DATA.assets.filter(b => b.id !== a.id && !b.deleted_at && b.status === "stock" && !(b.assignments || []).length && window.AssetAccess.canView(b) && window.AssetAccess.canState(b))
        .sort((x,y) => x.product.localeCompare(y.product,"ko") || String(x.assetNo).localeCompare(String(y.assetNo)));
      selector.className = "modal-back";
      selector.style.zIndex = 350;
      selector.innerHTML = `<div class="modal link-select-modal" role="dialog" aria-label="자산 선택">
        <h3>자산 선택</h3>
        <div class="body"><div class="link-select-columns">
          <section class="link-select-pane"><div class="link-select-tools"><button type="button" class="btn" data-stock-category>분류 <span data-stock-scope-label>전체</span> ▾</button><input type="text" class="picker-search" placeholder="품목명/고유관리번호" aria-label="품목명 또는 고유관리번호 검색" data-stock-search></div><div class="link-select-pane-head">전체 <b data-stock-total>0</b></div><div class="link-list link-select-scroll" data-stock-results></div></section>
          <section class="link-select-pane"><div class="link-select-pane-head">선택됨 <b data-stock-count>0</b></div><div class="link-list link-select-scroll" data-stock-selected></div></section>
        </div></div>
        <div class="foot"><button class="btn" data-stock-cancel>취소</button><button class="btn primary" data-stock-apply>적용</button></div>
      </div>`;
      document.body.appendChild(selector);
      const drawResults = () => {
        const allCandidates = candidates(),
          rows = allCandidates.filter(b => (!query || [b.product,b.assetNo].some(value => String(value || "").toLowerCase().includes(query))) && (!categoryScope.length || categoryScope.includes(`${b.group}/${b.sub}`))),
          count = existingCount + selection.size, results = selector.querySelector("[data-stock-results]"), selected = selector.querySelector("[data-stock-selected]"), scroll = results.scrollTop;
        selector.querySelector("[data-stock-total]").textContent = rows.length;
        selector.querySelector("[data-stock-count]").textContent = selection.size;
        selector.querySelector("[data-stock-scope-label]").textContent = categoryScope.length ? categoryScope[0].split("/").slice(1).join("/") + (categoryScope.length > 1 ? ` +${categoryScope.length-1}` : "") : "전체";
        results.innerHTML = rows.length ? rows.map(b => rowHtml(b, selection, count)).join("") : `<p class="muted link-empty">${query || categoryScope.length ? "결과가 없습니다." : "표시할 목록이 없습니다."}</p>`;
        results.scrollTop = scroll;
        selected.innerHTML = selection.size ? [...selection.values()].map(b => `<div class="link-selected-row">${linkThumb(b)}<div class="link-row-main"><span class="link-row-name">${esc(b.product)}</span><span class="link-row-no">${esc(b.assetNo)}</span></div><button type="button" class="link-selected-remove" data-stock-remove="${esc(b.id)}" aria-label="${esc(b.product)} ${esc(b.assetNo)} 선택 해제">×</button></div>`).join("") : '<p class="muted link-empty">선택된 자산이 없습니다.</p>';
        selector.querySelector("[data-stock-apply]").disabled = !selection.size && !initialNewCount;
        results.querySelectorAll("[data-pick]").forEach(c => c.onchange = () => {
          const b = window.DATA.assets.find(x => x.id === c.dataset.pick);
          c.checked ? selection.set(b.id, b) : selection.delete(b.id); drawResults();
        });
        selected.querySelectorAll("[data-stock-remove]").forEach(button => button.onclick = () => { selection.delete(button.dataset.stockRemove); drawResults(); });
      };
      selector.querySelector("[data-stock-search]").oninput = e => { query = e.target.value.trim().toLowerCase(); selector.querySelector("[data-stock-results]").scrollTop=0; drawResults(); };
      selector.querySelector("[data-stock-category]").onclick = () => window.openAssetCategoryScopeModal({categories:accessibleCategories,selected:categoryScope,onApply:values => {categoryScope=values; selector.querySelector("[data-stock-results]").scrollTop=0; drawResults();}});
      selector.querySelector("[data-stock-cancel]").onclick = () => selector.remove();
      selector.querySelector("[data-stock-apply]").onclick = () => {
        [...picked].forEach(([id, b]) => { if (isNew(b)) picked.delete(id); });
        selection.forEach((b, id) => picked.set(id, b));
        selector.remove(); draw();
      };
      drawResults();
      selector.querySelector("[data-stock-search]").focus();
    }
    const searchField = back.querySelector("[data-link-q]");
    searchField.onclick = openStockSelector;
    searchField.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openStockSelector(); } };
    back.querySelector("[data-close]").onclick = () => back.remove();
    save.onclick = () => {
      const targets = [...picked.values()], key = window.AssetLinks.targetKey(a), d = getDate();
      // 저장 시점 재검증: 같은 대상 후보이거나 여전히 배정 가능한 자산인지(새11 Case 5-7-2)
      const stale = targets.filter(b => isNew(b) ? !assignmentTargetActive(r) || b.status !== "stock" || b.deleted_at : window.AssetLinks.targetKey(b) !== key || window.AssetLinks.linked(a.id, b.id));
      if (stale.length) return stale.forEach(b => picked.delete(b.id)), toast("설정이 변경되었습니다. 잠시 후 다시 시도해주세요."), draw();
      const record = r.employee ? { employee: r.employee, worksite: null, since: d } : { employee: null, worksite: r.worksite, since: d };
      targets.forEach(b => {
        isNew(b) && (b.assignments = [{ ...record }], b.status = "assigned", logActivity(b, { script: "배정 관리: 신규 배정", target: record, before: "", after: window.fmtDate(d) }));
        window.AssetLinks.add(a, b);
        logActivity(a, { script: "자산 연결: 연결", relatedAssetId:b.id, before: "", after: linkLabel(b) });
        logActivity(b, { script: "자산 연결: 연결", relatedAssetId:a.id, before: "", after: linkLabel(a) });
      });
      back.remove(), toast("저장되었습니다."), render();
    };
    draw();
  }
  // The first step owns selection; the final confirmation never repeats asset details.
  function linkedAssetChoice(a, kind) {
    const hasLinks = !!window.AssetLinks.count(a.id), plan = window.AssetLinks.togetherPlan(a);
    const verb = kind === "reassign" ? "이동" : "반납";
    let mode = "all";
    const rows = list => list.map(b => `<div class="link-row static"><div class="link-row-main"><span class="link-row-name">${window.AssetExtra.esc(b.product)}</span><span class="link-row-no">${window.AssetExtra.esc(b.assetNo)}</span></div><span class="badge ${STATUS_LABEL[b.status][1]}">${STATUS_LABEL[b.status][0]}</span></div>`).join("");
    const html = () => hasLinks ? `<div class="field" data-linked-choice><label>연결 자산 처리</label><label class="radio-row"><input type="radio" name="tg-mode" value="all"${mode === "all" ? " checked" : ""}><span>연결된 자산과 함께</span></label><label class="radio-row"><input type="radio" name="tg-mode" value="one"${mode === "one" ? " checked" : ""}><span>이 자산만</span></label><div data-tg-body style="margin-top:10px"></div></div>` : "";
    const wire = root => {
      const area = root.querySelector("[data-linked-choice]");
      if (!area) return;
      const draw = () => {
        const cutCount = plan.cutVisible.length + plan.cutHidden, others = plan.move.filter(b => b.id !== a.id);
        area.querySelector("[data-tg-body]").innerHTML = mode === "all" ? `
          ${others.length ? `<div class="tg-sec"><div class="tg-sec-head">함께 ${verb}될 자산 <b>${others.length}</b>건</div><div class="link-list">${rows(others)}</div></div>` : ""}${kind === "return" ? '<p class="muted" style="margin-top:6px">반납 시 연결은 모두 해제됩니다.</p>' : ""}
          ${cutCount ? `<div class="tg-sec"><div class="tg-sec-head">연결이 끊어질 자산 <b>${cutCount}</b>건</div><p class="tg-permission-note">상태 관리 권한이 없습니다.</p><div class="link-list">${rows(plan.cutVisible)}${maskedLinkRows(plan.cutHidden)}</div></div>` : ""}` : `<p class="muted">${kind === "return" ? "반납 시 연결은 모두 해제됩니다." : "이 자산에 연결된 자산들은 해제됩니다."}</p>`;
      };
      area.querySelectorAll('[name="tg-mode"]').forEach(r => r.onchange = () => { mode = r.value; draw(); });
      draw();
    };
    return { html, wire, plan, get mode() { return mode; }, valid: () => !hasLinks || mode !== "all" || window.AssetLinks.togetherPlan(a).signature === plan.signature };
  }
  function returnAssignment(a, idx) {
    const old = a.assignments[idx], choice = linkedAssetChoice(a, "return"), back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `<div class="modal scroll-body" style="width:460px"><h3>반납</h3><div class="body">${assetAssignmentSummaryHtml(a, old)}<div class="ra-current"><div class="perm-info-note">${INFO_ICON}<span>현재 배정을 종료합니다.</span></div></div>${choice.html()}</div><div class="foot"><button class="btn" data-close>취소</button><button class="btn primary" data-save>저장</button></div></div>`;
    document.body.appendChild(back); choice.wire(back);
    back.querySelector("[data-close]").onclick = () => back.remove();
    back.querySelector("[data-save]").onclick = () => confirmModal("반납하시겠습니까?", () => {
      if (!choice.valid()) { back.remove(); toast("설정이 변경되었습니다. 잠시 후 다시 시도해주세요."); render(); return; }
      const returnOne = (x, note) => {
        const rec = x.assignments[0];
        x.assignments = []; x.status === "assigned" && (x.status = "stock");
        logActivity(x, { script: "배정 관리: 반납" + (note || ""), target: rec, before: window.fmtDate(rec.since), after: "" });
      };
      (choice.mode === "all" ? choice.plan.move : [a]).forEach(x => returnOne(x, x === a ? "" : ` (${a.product} · ${a.assetNo}과 함께)`));
      back.remove(); pruneLinks("반납"); toast("반납되었습니다."); render();
    });
  }
  function openAssignAddModal(a) {
    let picked = null;
    const draftTarget = {
      employee: null,
      worksite: null
    };
    let dateText = "";
    const back = document.createElement("div");
    back.className = "modal-back", back.innerHTML = `
      <div class="modal" style="width:400px">
        <h3>배정</h3>
        <div class="body" data-body></div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" data-save disabled>저장</button>
        </div>
      </div>`, document.body.appendChild(back);
    const body = back.querySelector("[data-body]"),
      saveBtn = back.querySelector("[data-save]");
    function targetSummaryHtml(k) {
      const val = draftTarget[k];
      return val ? `
        <div class="aa-target-selected" data-target-open>
          ${k === "employee" ? `<span class="picker-avatar sm" style="background:${avatarColor(val)}">${val[0]}</span>` : ""}<span class="perm-chip">${val}</span>
          <button type="button" class="aa-target-x" data-target-clear aria-label="선택 해제">${CLOSE_ICON}</button>
        </div>` : '<button type="button" class="perm-target-btn" data-target-open><span class="muted">선택</span><span class="chev">›</span></button>';
    }
    let getDate = () => null;
    function draw() {
      body.innerHTML = `
        ${assetSummaryHtml(a)}
        <div class="field">
          <label>배정 대상</label>
          <label class="radio-row"><input type="radio" name="aa-kind" value="employee"${picked === "employee" ? " checked" : ""}><span>구성원</span></label>
          ${picked === "employee" ? `<div class="perm-target-wrap">${targetSummaryHtml("employee")}</div>` : ""}
          <label class="radio-row"><input type="radio" name="aa-kind" value="worksite"${picked === "worksite" ? " checked" : ""}><span>근무지</span></label>
          ${picked === "worksite" ? `<div class="perm-target-wrap">${targetSummaryHtml("worksite")}</div>` : ""}
        </div>
        <div class="field">
          <label>배정일</label>
          ${dateFieldHtml("")}
        </div>`;
      const dtext = body.querySelector("[data-dtext]");
      dateText && (dtext.value = dateText), body.querySelectorAll('input[name="aa-kind"]').forEach(r => r.onchange = () => {
        picked = r.value, draw();
      });
      const openBtn = body.querySelector("[data-target-open]");
      openBtn && (openBtn.onclick = () => {
        picked === "employee" ? openAssignMemberPicker(draftTarget.employee, v => {
          draftTarget.employee = v, draw();
        }) : openAssignWorksitePicker(draftTarget.worksite, v => {
          draftTarget.worksite = v, draw();
        });
      });
      const clearBtn = body.querySelector("[data-target-clear]");
      clearBtn && (clearBtn.onclick = e => {
        e.stopPropagation(), draftTarget[picked] = null, draw();
      }), getDate = wireDateField(body, todayStr(), () => {
        dateText = dtext.value, updateSaveState();
      }), updateSaveState();
    }
    function updateSaveState() {
      saveBtn.disabled = !(picked && draftTarget[picked] && getDate());
    }
    draw();
    const requestClose = () => {
      picked || Object.values(draftTarget).some(Boolean) || dateText.trim() ? confirmWriteExit(() => back.remove()) : back.remove();
    };
    back.querySelector("[data-close]").onclick = requestClose, saveBtn.onclick = () => {
      if (saveBtn.disabled) return;
      const d = getDate(),
        record = picked === "employee" ? {
          employee: draftTarget.employee,
          worksite: null,
          since: d
        } : {
          employee: null,
          worksite: draftTarget.worksite,
          since: d
        };
      confirmModal("배정하시겠습니까?", () => {
        back.remove(), (a.assignments || (a.assignments = [])).push(record), a.status === "stock" && (a.status = "assigned"), logActivity(a, {
          script: "배정 관리: 신규 배정",
          target: record,
          before: "",
          after: window.fmtDate(d)
        }), toast("배정되었습니다."), render();
      });
    };
  }
  function openReassignModal(a, idx) {
    const old = a.assignments[idx], choice = linkedAssetChoice(a, "reassign");
    let picked = null;
    const draftTarget = {
      employee: null,
      worksite: null
    };
    let dateText = "";
    const back = document.createElement("div");
    back.className = "modal-back", back.innerHTML = `
      <div class="modal scroll-body" style="width:460px">
        <h3>이동</h3>
        <div class="body" data-body></div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" data-save disabled>저장</button>
        </div>
      </div>`, document.body.appendChild(back);
    const body = back.querySelector("[data-body]"),
      saveBtn = back.querySelector("[data-save]");
    function targetSummaryHtml(k) {
      const val = draftTarget[k];
      return val ? `
        <div class="aa-target-selected" data-target-open>
          ${k === "employee" ? `<span class="picker-avatar sm" style="background:${avatarColor(val)}">${val[0]}</span>` : ""}<span class="perm-chip">${val}</span>
          <button type="button" class="aa-target-x" data-target-clear aria-label="선택 해제">${CLOSE_ICON}</button>
        </div>` : '<button type="button" class="perm-target-btn" data-target-open><span class="muted">선택</span><span class="chev">›</span></button>';
    }
    let getDate = () => null;
    function draw() {
      body.innerHTML = `
        ${assetAssignmentSummaryHtml(a, old)}
        <div class="ra-current">
          <div class="perm-info-note">${INFO_ICON}<span>기존 배정을 반납하고 새 대상에게 배정합니다.</span></div>
        </div>
        <div class="field">
          <label>이동시킬 대상</label>
          <label class="radio-row"><input type="radio" name="ra-kind" value="employee"${picked === "employee" ? " checked" : ""}><span>구성원</span></label>
          ${picked === "employee" ? `<div class="perm-target-wrap">${targetSummaryHtml("employee")}</div>` : ""}
          <label class="radio-row"><input type="radio" name="ra-kind" value="worksite"${picked === "worksite" ? " checked" : ""}><span>근무지</span></label>
          ${picked === "worksite" ? `<div class="perm-target-wrap">${targetSummaryHtml("worksite")}</div>` : ""}
        </div>
        <div class="field">
          <label>새 배정일</label>
          ${dateFieldHtml("")}
        </div>${choice.html()}`;
      choice.wire(body);
      const dtext = body.querySelector("[data-dtext]");
      dateText && (dtext.value = dateText), body.querySelectorAll('input[name="ra-kind"]').forEach(r => r.onchange = () => {
        picked = r.value, draw();
      });
      const openBtn = body.querySelector("[data-target-open]");
      openBtn && (openBtn.onclick = () => {
        picked === "employee" ? openAssignMemberPicker(draftTarget.employee, v => {
          draftTarget.employee = v, draw();
        }, old.employee) : openAssignWorksitePicker(draftTarget.worksite, v => {
          draftTarget.worksite = v, draw();
        }, old.worksite);
      });
      const clearBtn = body.querySelector("[data-target-clear]");
      clearBtn && (clearBtn.onclick = e => {
        e.stopPropagation(), draftTarget[picked] = null, draw();
      }), getDate = wireDateField(body, todayStr(), () => {
        dateText = dtext.value, updateSaveState();
      }), updateSaveState();
    }
    function updateSaveState() {
      saveBtn.disabled = !(picked && draftTarget[picked] && getDate());
    }
    draw();
    const requestClose = () => {
      picked || Object.values(draftTarget).some(Boolean) || dateText.trim() || choice.mode !== "all" ? confirmWriteExit(() => back.remove()) : back.remove();
    };
    back.querySelector("[data-close]").onclick = requestClose, saveBtn.onclick = () => {
      if (saveBtn.disabled) return;
      const d = getDate(),
        record = picked === "employee" ? {
          employee: draftTarget.employee,
          worksite: null,
          since: d
        } : {
          employee: null,
          worksite: draftTarget.worksite,
          since: d
        };
      const move = (items, plan) => {
        // Materialize old history before replacing the active record.
        items.forEach(activityLog);
        try { window.AssetMoves.moveBatch(items,record,todayStr(),undefined,logActivity,a); }
        catch (_) { toast("설정이 변경되었습니다. 잠시 후 다시 시도해주세요."); render(); return; }
        plan && plan.cutPairs.forEach(([x,y]) => window.AssetLinks.remove({id:x},{id:y}));
        back.remove(); pruneLinks("이동"); toast("이동되었습니다."); render();
      };
      confirmModal("이동하시겠습니까?", () => {
        if (!choice.valid()) { back.remove(); toast("설정이 변경되었습니다. 잠시 후 다시 시도해주세요."); render(); return; }
        move(choice.mode === "all" ? choice.plan.move : [a], choice.mode === "all" ? choice.plan : null);
      });
    };
  }
  function openAssignMemberPicker(initial, onApply, exclude) {
    let picked = initial,
      query = "";
    const excludeNames = [].concat(exclude || []).filter(Boolean),
      p = document.createElement("div");
    p.className = "modal-back", p.style.zIndex = 340, p.innerHTML = `
      <div class="modal sm">
        <h3>구성원 선택</h3>
        <div class="body" style="display:flex;flex-direction:column;max-height:56vh">
          <input type="text" class="picker-search" placeholder="이름/사번/휴대폰번호">
          <div data-list style="flex:1;min-height:0;overflow-y:auto;margin-top:8px"></div>
        </div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" data-ok>적용</button>
        </div>
      </div>`, document.body.appendChild(p);
    const list = p.querySelector("[data-list]");
    function renderList() {
      const q = query.trim().toLowerCase(),
        filtered = MEMBERS.filter(m => !excludeNames.includes(m.name) && (!q || m.name.includes(q) || m.empNo.includes(q) || m.phone.includes(q)));
      list.innerHTML = filtered.length ? filtered.map(m => `
        <label class="picker-member-row">
          <input type="radio" name="aa-member" value="${m.name}"${picked === m.name ? " checked" : ""}>
          <span class="picker-avatar" style="background:${avatarColor(m.name)}">${m.name[0]}</span>
          <span class="picker-member-info"><b>${m.name}</b><span>${m.team}</span></span>
        </label>`).join("") : '<p class="muted" style="padding:16px 0">결과가 없습니다.</p>', list.querySelectorAll('input[name="aa-member"]').forEach(r => r.onchange = () => {
        picked = r.value; p.querySelector('[data-ok]').disabled = !picked;
      });
    }
    p.querySelector(".picker-search").addEventListener("input", e => {
      query = e.target.value, renderList();
    }), renderList(), p.querySelector('[data-ok]').disabled = !picked, p.querySelector("[data-close]").onclick = () => p.remove(), p.querySelector("[data-ok]").onclick = () => {
      p.remove(), onApply(picked);
    };
  }
  function openAssignWorksitePicker(initial, onApply, exclude) {
    let picked = initial,
      query = "";
    const excludeNames = [].concat(exclude || []).filter(Boolean),
      p = document.createElement("div");
    p.className = "modal-back", p.style.zIndex = 340, p.innerHTML = `
      <div class="modal sm">
        <h3>근무지 선택</h3>
        <div class="body" style="display:flex;flex-direction:column;max-height:56vh">
          <input type="text" class="picker-search" placeholder="근무지명/코드">
          <div data-list style="flex:1;min-height:0;overflow-y:auto;margin-top:8px"></div>
        </div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" data-ok>적용</button>
        </div>
      </div>`, document.body.appendChild(p);
    const list = p.querySelector("[data-list]");
    function renderList() {
      const q = query.trim().toLowerCase(),
        filtered = Object.keys(WS_CODE).filter(name => !excludeNames.includes(name) && (!q || name.toLowerCase().includes(q) || WS_CODE[name].toLowerCase().includes(q)));
      list.innerHTML = filtered.length ? filtered.map(name => `
        <label class="picker-member-row">
          <input type="radio" name="aa-worksite" value="${name}"${picked === name ? " checked" : ""}>
          <span class="picker-member-info"><b>${name}</b><span>${WS_CODE[name]}</span></span>
        </label>`).join("") : '<p class="muted" style="padding:16px 0">결과가 없습니다.</p>', list.querySelectorAll('input[name="aa-worksite"]').forEach(r => r.onchange = () => {
        picked = r.value; p.querySelector('[data-ok]').disabled = !picked;
      });
    }
    p.querySelector(".picker-search").addEventListener("input", e => {
      query = e.target.value, renderList();
    }), renderList(), p.querySelector('[data-ok]').disabled = !picked, p.querySelector("[data-close]").onclick = () => p.remove(), p.querySelector("[data-ok]").onclick = () => {
      p.remove(), onApply(picked);
    };
  }
  function openViewer(a, start) {
    const items = photosOf(a);
    if (!items.length) return;
    let cur = start || 0,
      zoom = 1,
      infoOn = !1,
      idleTimer;
    const back = document.createElement("div");
    back.className = "modal-back viewer-back", back.innerHTML = `
      <div class="viewer bar-hidden">
        <div class="v-bar">
          <div class="v-bar-l">
            <span class="v-count"></span>
            <button data-vprev class="v-ib" data-tip="이전" aria-label="이전">‹</button>
            <button data-vnext class="v-ib" data-tip="다음" aria-label="다음">›</button>
          </div>
          <div class="v-bar-c">
            <button data-vfs class="v-ib" data-tip="전체 스크린">⛶</button>
            <button data-vzin class="v-ib" data-tip="확대">＋</button>
            <button data-vzout class="v-ib" data-tip="축소">－</button>
            <button data-vinfo class="v-ib" data-tip="정보">ⓘ</button>
          </div>
          <div class="v-bar-r">
            <button data-vmore class="v-ib" aria-label="더보기">⋮</button>
            <button data-vclose class="v-ib" aria-label="닫기">✕</button>
          </div>
        </div>
        <div class="v-info" hidden>
          <span class="v-info-badge">자산</span>
          <div class="v-info-t">${a.product}${a.assetNo ? ` / ${a.assetNo}` : ""}</div>
          <div class="v-info-date"></div>
          <div class="v-info-by"><span class="avatar-sm"></span><span class="v-info-name"></span></div>
        </div>
        <div class="v-stage">
          <div class="v-img-wrap"><div class="v-img"></div></div>
        </div>
      </div>`;
    const V = back.querySelector(".viewer");
    function draw() {
      const p = items[cur],
        img = V.querySelector(".v-img");
      img.style.background = p.color, img.style.transform = `scale(${zoom})`, V.querySelector(".v-count").textContent = `${cur + 1} / ${items.length}`, V.querySelector(".v-info-date").textContent = window.fmtDateTime(p.at), V.querySelector(".v-info-name").textContent = p.by, V.querySelector(".avatar-sm").textContent = p.by[0].toUpperCase(), V.querySelector("[data-vprev]").disabled = cur === 0, V.querySelector("[data-vnext]").disabled = cur === items.length - 1;
    }
    const go = d => {
      cur = Math.max(0, Math.min(items.length - 1, cur + d)), zoom = 1, draw();
    };
    function showBar() {
      V.classList.remove("bar-hidden"), clearTimeout(idleTimer), infoOn || (idleTimer = setTimeout(() => V.classList.add("bar-hidden"), 2500));
    }
    V.addEventListener("mousemove", showBar);
    function toggleInfo() {
      infoOn = !infoOn, V.querySelector(".v-info").hidden = !infoOn, V.querySelector("[data-vinfo]").classList.toggle("on", infoOn), showBar();
    }
    function zoomBy(d) {
      zoom = Math.min(3, Math.max(1, +(zoom + d).toFixed(2))), draw();
    }
    function moreMenu(anchor) {
      document.querySelectorAll(".dropdown-menu").forEach(m => m.remove());
      const list = [];
      cur !== a._primary && list.push({
        t: "대표 사진으로 지정",
        fn: () => confirmModal("자산 대표 사진으로 지정하시겠습니까?", () => {
          window.logAssetActivities(window.assetPhotoActivities(items, a._primary || 0, items, cur), e => logActivity(a, e)), a._primary = cur, toast("자산 대표 사진으로 지정되었습니다."), draw();
        })
      }), list.push({
        t: "다운로드",
        fn: () => toast("다운로드 — 원본 파일명 그대로 (프로토타입)")
      }), list.push({
        t: "삭제",
        fn: () => confirmModal("자산 사진을 삭제하시겠습니까?", delCur),
        danger: !0
      }), list.push({
        t: "전체 사진 다운로드",
        fn: () => toast(`${zipName(a)} 다운로드 (프로토타입)`),
        sep: !0
      });
      if(!window.AssetAccess.canInfo(a))for(let i=list.length-1;i>=0;i--)if(['대표 사진으로 지정','삭제'].includes(list[i].t))list.splice(i,1);
      const menu = document.createElement("div");
      menu.className = "dropdown-menu", menu.innerHTML = list.map((x, i) => (x.sep ? '<div class="dropdown-sep"></div>' : "") + `<button data-i="${i}" class="${x.danger ? "danger" : ""}">${x.t}</button>`).join("");
      const r = anchor.getBoundingClientRect();
      menu.style.cssText = `position:fixed;top:${r.bottom + 6}px;left:${Math.max(8, r.right - 190)}px;min-width:190px;z-index:320`, document.body.appendChild(menu), menu.querySelectorAll("button").forEach(b => b.onclick = () => {
        menu.remove(), list[+b.dataset.i].fn();
      }), setTimeout(() => {
        const close2 = e => {
          menu.contains(e.target) || (menu.remove(), document.removeEventListener("click", close2));
        };
        document.addEventListener("click", close2);
      });
    }
    function delCur() {
      const wasPrimary = cur === a._primary,
        beforeItems = items.map(p => ({
          ...p
        })),
        beforePrimary = a._primary || 0;
      if (items.splice(cur, 1), wasPrimary ? a._primary = 0 : a._primary > cur && (a._primary -= 1), window.logAssetActivities(window.assetPhotoActivities(beforeItems, beforePrimary, items, a._primary || 0), e => logActivity(a, e)), !items.length) {
        close(), toast("자산 사진이 삭제되었습니다."), DetailScreen.render();
        return;
      }
      cur >= items.length && (cur = items.length - 1), zoom = 1, draw(), toast("자산 사진이 삭제되었습니다.");
    }
    function close() {
      back.remove(), document.removeEventListener("keydown", key), DetailScreen.render();
    }
    const key = e => {
      e.key === "Escape" ? close() : e.key === "ArrowLeft" ? go(-1) : e.key === "ArrowRight" ? go(1) : e.key === "+" || e.key === "=" ? zoomBy(0.25) : e.key === "-" ? zoomBy(-0.25) : e.key.toLowerCase() === "i" && toggleInfo();
    };
    back.addEventListener("click", e => {
      e.target === back && close();
    }), V.querySelectorAll("[data-vprev]").forEach(b => b.onclick = () => go(-1)), V.querySelectorAll("[data-vnext]").forEach(b => b.onclick = () => go(1)), V.querySelector("[data-vclose]").onclick = close, V.querySelector("[data-vinfo]").onclick = toggleInfo, V.querySelector("[data-vzin]").onclick = () => zoomBy(0.25), V.querySelector("[data-vzout]").onclick = () => zoomBy(-0.25), V.querySelector("[data-vfs]").onclick = () => V.classList.toggle("fs"), V.querySelector("[data-vmore]").onclick = e => moreMenu(e.currentTarget), document.addEventListener("keydown", key), document.body.appendChild(back), draw(), showBar();
  }
  function render() {
    const id = new URLSearchParams(location.search).get("id"),
      idx = Math.max(0, assets.findIndex(x => x.id === id)),
      a = assets[idx],
      c = document.getElementById("content"),
      isIndiv = !0,
      prevA = assets[(idx - 1 + assets.length) % assets.length],
      nextA = assets[(idx + 1) % assets.length],
      prevId = prevA.id,
      nextId = nextA.id,
      photos = photosOf(a),
      primColor = photos.length ? photos[a._primary || 0].color : null,
      thumb = photos.length ? `<button class="dthumb" style="background:${primColor}" data-viewer aria-label="사진 보기">
           ${photos.length > 1 ? `<span class="tcount">+${photos.length - 1}</span>` : ""}</button>` : '<span class="dthumb empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-4 4 3 4-4 5 4"/></svg></span>',
      statusItems = {
        stock: ["배정", "수리/점검 접수", "분실 신고", "폐기 처리"],
        assigned: ["수리/점검 접수", "분실 신고", "폐기 처리"],
        repair: ["수리/점검 완료", "분실 신고", "폐기 처리"],
        lost: ["분실 회수", "폐기 처리"],
        disposed: window.canRestoreDisposedAsset(a) ? ["폐기 복구"] : []
      }[a.status].filter(label => label === "폐기 복구" ? window.canRestoreDisposedAsset(a) : label === "폐기 처리" ? canManageAssets() : window.AssetAccess.canState(a)),
      statusBadge = statusItems.length ? `<button class="badge ${STATUS_LABEL[a.status][1]} clickable" data-statuschange>${STATUS_LABEL[a.status][0]} <span class="bchev">▾</span></button>` : `<span class="badge ${STATUS_LABEL[a.status][1]}">${STATUS_LABEL[a.status][0]}</span>`,
      heldQty = 0,
      subMeta = `<div>${statusBadge}</div>${a.assetNo ? `<div style="margin-top:5px">고유관리번호 <b>${a.assetNo}</b></div>` : ""}`,
      qrBtn = '<button class="btn sm icon-only" data-qr aria-label="QR 라벨" title="QR 라벨"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM19 14h2v2h-2zM14 19h2v2h-2zM19 19h2v2h-2z"/></svg></button>',
      mgrBtn = '<button class="btn sm icon-only corner" data-more aria-label="자산관리" title="자산관리"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg></button>',
      moreItems = [...(window.AssetAccess.canInfo(a)?["자산 수정"]:[]),...(!targetContext&&canManageAssets()?["자산 삭제"]:[])],
      hidden = ((window.DATA.categories || []).find(x => x.group === a.group && x.sub === a.sub) || {}).hiddenFields || [],
      kv = [
 {k:'분류',v:`${a.group} › ${a.sub}`},
 {k:'태그',v:chips(a.labels)}
].map(({k,v})=>`<div><div class="k">${k}</div><div class="v">${v}</div></div>`).join('')+window.AssetExtra.detailRows(a,canManageAssets(),expiryBadge)+[
 {k:'자산 등록일',v:window.fmtDate(a.createdAt)}, {k:'QR 라벨',v:qrBtn},
 {k:'메모',v:`${memoHtml(a.note)}${window.AssetAccess.canField(a,'memo')?`<button class="icon-edit" data-memoedit aria-label="메모 수정">${IC_EDIT}</button>`:''}`}
].map(({k,v})=>`<div><div class="k">${k}</div><div class="v">${v}</div></div>`).join('');
    activityLog(a);
    if (historyAssetId !== a.id) { historyAssetId=a.id; detailTab="current"; historyDir="desc"; }
    let holdCard;
    {
      holdCard = `
        <section class="dcard" id="assign-card">
          <div class="dsection-head">
            <div class="dtabs">
              <button data-atab="current" class="active">배정 현황</button>
              <button data-atab="history">이력</button>
            </div>
            <div class="hactions" id="assign-actions"></div>
            <div class="history-actions" data-history-actions hidden>
              <div class="sort-dir-group" role="group" aria-label="이력 정렬 방향">
                <button type="button" class="sort-dir-btn" data-history-dir="asc" aria-label="오래된순" aria-pressed="false">${HISTORY_ASC_ICON}</button>
                <button type="button" class="sort-dir-btn" data-history-dir="desc" aria-label="최신순" aria-pressed="true">${HISTORY_DESC_ICON}</button>
              </div>
            </div>
          </div>
          <div id="assign-body">${assignCurrentHtml(a)}</div>
        </section>`;
    }
    c.innerHTML = `
      <div class="detail-topbar">
        <a href="assets.html" class="backbtn" aria-label="목록으로">←</a>
      </div>

      <div class="dgrid">
        <section class="dcard">
          <span class="navbtns">
            <a href="asset-detail.html?id=${prevId}" aria-label="이전 자산" data-tip="${prevA.product}">‹</a>
            <a href="asset-detail.html?id=${nextId}" aria-label="다음 자산" data-tip="${nextA.product}">›</a>
          </span>
          <div class="dhead-top" style="position:relative">
            ${moreItems.length?mgrBtn:""}
            <div class="dhead-id">
              ${thumb}
              <div>
                <h1>${a.product}</h1>
                <div class="dhead-sub">${subMeta}</div>
              </div>
            </div>
          </div>

          <div class="dsection">
            <div class="kv2">${kv}</div>${window.AssetExtra.detailHtml(a,canManageAssets(),expiryBadge)}
          </div>
        </section>

        ${holdCard}
      </div>
    `, c.classList.add("detail-split"), bindActs(c), c.querySelector("[data-qr]").onclick = e => openQrPopover(a, e.currentTarget), c.querySelector("[data-more]")?.addEventListener("click",e => moreDropdown(e.currentTarget, moreItems, a));
    const sc = c.querySelector("[data-statuschange]");
    sc && (sc.onclick = e => statusDropdown(e.currentTarget, statusItems, a));
    const tb = c.querySelector("[data-viewer]");
    tb && (tb.onclick = () => openViewer(a, a._primary || 0));
    const memoEdit = c.querySelector("[data-memoedit]");
    memoEdit && (memoEdit.onclick = () => openMemoQuickEditModal(a));
    const card = c.querySelector("#assign-card");
    if (card) {
      const body = card.querySelector("#assign-body"),
        actions = card.querySelector("#assign-actions");
      wireAssignCards(body, a);applyTargetContext(c,a);
      const historyActions = card.querySelector("[data-history-actions]");
      const drawTab = () => {
        const isCurrent = detailTab === "current";
        card.querySelectorAll("[data-atab]").forEach(x => x.classList.toggle("active", x.dataset.atab === detailTab));
        body.innerHTML = isCurrent ? assignCurrentHtml(a) : timelineHtml(a);
        actions.hidden = !isCurrent; historyActions.hidden = isCurrent;
        historyActions.querySelectorAll("[data-history-dir]").forEach(button => {
          const active = button.dataset.historyDir === historyDir;
          button.classList.toggle("active", active); button.setAttribute("aria-pressed", String(active));
        });
        bindActs(body); if (isCurrent) wireAssignCards(body,a); applyTargetContext(c,a);
      };
      card.querySelectorAll("[data-atab]").forEach(t => t.onclick = () => { detailTab=t.dataset.atab; drawTab(); });
      historyActions.querySelectorAll("[data-history-dir]").forEach(button => button.onclick = () => {
        if (historyDir === button.dataset.historyDir) return;
        historyDir=button.dataset.historyDir; drawTab(); card.scrollTop=0;
      });
      drawTab();
    }
    const scard = c.querySelector("#stock-card");
  }
  window.DetailScreen = {
    render
  };
})();
