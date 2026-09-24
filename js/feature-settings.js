/* 기능 설정 — 실 대시보드의 기능 on/off 화면 재현(UsageFeatureSettingRow 패턴: 일러스트+제목+설명 불릿+
   [상세 설정]+토글). 관리자 전용 화면이라는 설정이지만 이 프로토타입엔 역할 구분이 없어 접근 제한은 생략.
   "관리" 탭의 "자산 관리" 카드만 실제로 동작(토글 시 좌측 메뉴에서 자산 메뉴 표시/숨김) — 나머지 탭은
   실 화면 구조(탭 목록)만 보여주고 카드 내용은 없음(정적 카드로 옮겼던 출퇴근 및 방문·비용 탭은
   스코프 밖이라 이번에 제거, 2026-09-24). */
(function () {
  const ASSET_MGMT_FLAG_KEY = "shopl_proto_assetMgmtUse";
  function assetMgmtOn() { return localStorage.getItem(ASSET_MGMT_FLAG_KEY) !== "0"; }
  function setAssetMgmtOn(v) { localStorage.setItem(ASSET_MGMT_FLAG_KEY, v ? "1" : "0"); }

  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300";
    document.body.appendChild(t); setTimeout(() => t.remove(), 1800);
  }
  function confirmModal(title, body, onOk) {
    const cb = document.createElement("div");
    cb.className = "modal-back";
    cb.style.zIndex = 340;
    cb.innerHTML = `
      <div class="modal" style="width:380px">
        <div class="body" style="padding-top:20px">
          <p style="font-size:14px;font-weight:700;margin-bottom:6px">${title}</p>
          ${body ? `<p class="hint" style="margin-top:0">${body}</p>` : ""}
        </div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn primary" data-cok>확인</button>
        </div>
      </div>`;
    cb.addEventListener("click", e => { if (e.target === cb) cb.remove(); });
    cb.querySelector("[data-cclose]").onclick = () => cb.remove();
    cb.querySelector("[data-cok]").onclick = () => { cb.remove(); onOk(); };
    document.body.appendChild(cb);
  }
  // 사용함 전환 직후 안내 — 확인 버튼 하나뿐이고 "설정하러 가기" 텍스트 링크로 자산 설정 화면 이동(참고 이미지)
  function openTurnOnInfoModal() {
    const cb = document.createElement("div");
    cb.className = "modal-back";
    cb.style.zIndex = 340;
    cb.innerHTML = `
      <div class="modal" style="width:420px">
        <div class="body" style="padding-top:20px">
          <p style="font-size:16px;font-weight:700;margin-bottom:14px">사용함으로 설정되었습니다.</p>
          <p class="hint" style="margin-top:0">설정 페이지로 이동하여 우리 회사에 꼭 맞는 환경을 만들어보세요.</p>
          <button type="button" class="ufs-goto-link" data-goto-settings>설정하러 가기</button>
        </div>
        <div class="foot">
          <button class="btn primary" data-cok>확인</button>
        </div>
      </div>`;
    cb.addEventListener("click", e => { if (e.target === cb) cb.remove(); });
    cb.querySelector("[data-cok]").onclick = () => cb.remove();
    cb.querySelector("[data-goto-settings]").onclick = () => { location.href = "settings.html"; };
    document.body.appendChild(cb);
  }
  const HELP_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 4.6-1.4c.6.9.3 1.7-.4 2.3-.7.6-1.2 1-1.2 2.1"/><path d="M12 17h.01"/></svg>`;

  const TABS = [
    { key: "document", label: "문서" },
    { key: "communication", label: "커뮤니케이션" },
    { key: "psi", label: "매장 데이터 수집" },
    { key: "goal", label: "목표 및 평가" },
    { key: "mgmt", label: "관리" },
  ];

  function cardHtml({ icon, color, title, help, detail, desc }, isOn, extraAttrs) {
    return `
      <div class="ufs-row"${extraAttrs || ""}>
        <div class="ufs-illust" style="background:${color}"><span>${icon}</span></div>
        <div class="ufs-body">
          <div class="ufs-title-row">
            <span class="ufs-title">${title}</span>
            ${help ? `<button type="button" class="ufs-help" data-tip="도움말" aria-label="도움말">${HELP_ICON}</button>` : ""}
            ${detail ? `<button type="button" class="ufs-detail" data-detail>상세 설정 ↗</button>` : ""}
          </div>
          <ul class="ufs-desc">${desc.map(d => `<li>${d}</li>`).join("")}</ul>
        </div>
        <button type="button" class="toggle-switch ufs-switch${isOn ? " on" : ""}" data-toggle role="switch" aria-checked="${isOn}" aria-label="${title} 사용 여부"><span class="toggle-knob"></span></button>
      </div>`;
  }

  function render() {
    const c = document.getElementById("content");
    const state = { tab: "mgmt" };

    function bodyHtml() {
      if (state.tab === "mgmt") {
        const on = assetMgmtOn();
        return cardHtml({
          icon: "📦", color: "#eaf1ff", title: "자산 관리", help: false, detail: true,
          desc: [
            "회사가 보유한 자산을 등록하고 배정·보유 현황을 관리하는 기능입니다.",
            "자산을 유형별로 분류하고, 구성원·근무지에 배정하거나 상태를 관리할 수 있습니다.",
          ],
        }, on, ' data-asset-mgmt-row="1"');
      }
      return `<div class="mdetail-placeholder">이 탭은 자산관리 기능 스코프 밖 — 디스크립션에서 설명 예정</div>`;
    }

    function draw() {
      c.innerHTML = `
        <div class="ufs-tabs">
          ${TABS.map(t => `<button class="ufs-tab ${state.tab === t.key ? "active" : ""}" data-ufs-tab="${t.key}">${t.label}</button>`).join("")}
        </div>
        <div class="ufs-panel">${bodyHtml()}</div>`;

      c.querySelectorAll("[data-ufs-tab]").forEach(b => b.onclick = () => { state.tab = b.dataset.ufsTab; draw(); });

      // 자산 관리 — 실제로 동작(확인 모달 → localStorage 반영 → 좌측 메뉴는 다음 페이지 이동 시 반영)
      const assetRow = c.querySelector("[data-asset-mgmt-row]");
      if (assetRow) {
        assetRow.querySelector("[data-toggle]").onclick = () => {
          const on = assetMgmtOn();
          if (on) {
            confirmModal(
              "사용 안 함으로 설정하시겠습니까?",
              "사용 안 함으로 설정할 경우 '자산' 메뉴가 비노출 되며, 직원들이 앱에서 더 이상 자산을 관리할 수 없게 됩니다.",
              () => {
                setAssetMgmtOn(false);
                toast("상태가 변경되었습니다.");
                draw();
              }
            );
          } else {
            confirmModal("사용함으로 설정하시겠습니까?", "", () => {
              setAssetMgmtOn(true);
              toast("상태가 변경되었습니다.");
              draw();
              openTurnOnInfoModal();
            });
          }
        };
        assetRow.querySelector("[data-detail]").onclick = () => { location.href = "settings.html"; };
      }
    }
    draw();
  }

  window.FeatureSettingsScreen = { render };
})();
