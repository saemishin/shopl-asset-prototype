// 앱(리더·직원) 자산 상세의 연결된 자산 영역과 연결 자산 재배정·반납 확인 시트.
// 기준은 Policy_15·대시보드 Web_dc_23 4번·3-3-3·3-4-2와 같고 저장소는 window.AssetLinks를 공유한다.
(() => {
  const L = () => window.AssetLinks;
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const STATUS = { assigned: ["배정 중", "assigned"], stock: ["배정 가능", "stock"], repair: ["수리/점검 중", "repair"], lost: ["분실", "lost"], disposed: ["폐기", "disposed"] };
  const CLOSE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const label = b => `${b.product} · ${b.assetNo}`;
  const badge = b => `<span class="badge ${STATUS[b.status][1]}">${STATUS[b.status][0]}</span>`;
  const thumb = b => {
    const ph = window.assetPhotos(b);
    return ph.length ? `<span class="thumb" style="background:${ph[b._primary || 0].color}"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="m21 16-5-5-9 8"/></svg></span>` : '<span class="thumb empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-4 4 3 4-4 5 4"/></svg></span>';
  };
  function toast(msg) {
    const t = document.createElement("div"), screen = document.querySelector(".mapp-screen"), r = screen ? screen.getBoundingClientRect() : null;
    t.textContent = msg, t.style.cssText = `position:fixed;${r ? `left:${r.left + r.width / 2}px;bottom:${window.innerHeight - r.bottom + 32}px;` : "left:50%;bottom:32px;"}transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:400;max-width:280px;text-align:center`;
    document.body.appendChild(t), setTimeout(() => t.remove(), 1800);
  }
  // 휴대폰 화면 안에 붙는 하단 시트
  function sheet(title, bodyHtml, footHtml, z = 120) {
    const screen = document.querySelector(".mapp-screen"), r = screen ? screen.getBoundingClientRect() : { top: 0, left: 0, width: 390, height: 844 };
    const back = document.createElement("div");
    back.className = "mapp-sheet-back mlink-sheet-back";
    back.style.cssText = `position:absolute;top:${r.top + window.scrollY}px;left:${r.left + window.scrollX}px;width:${r.width}px;height:${r.height}px;z-index:${z};`;
    back.innerHTML = `<div class="mapp-sheet mlink-sheet"><div class="mapp-sheet-head">${title}</div><div class="mapp-sheet-body mlink-sheet-body">${bodyHtml}</div>${footHtml ? `<div class="mapp-sheet-foot">${footHtml}</div>` : ""}</div>`;
    document.body.appendChild(back);
    return back;
  }
  function confirm(title, body, onOk, z = 340) {
    const cb = document.createElement("div");
    cb.className = "modal-back", cb.style.zIndex = z, cb.innerHTML = `<div class="modal" style="width:340px"><div class="body" style="padding-top:20px"><p style="font-size:14px;font-weight:700;margin-bottom:6px">${title}</p>${body ? `<p class="hint" style="margin-top:0">${body}</p>` : ""}</div><div class="foot"><button class="btn" data-no>취소</button><button class="btn primary" data-ok>확인</button></div></div>`;
    document.body.appendChild(cb);
    cb.querySelector("[data-no]").onclick = () => cb.remove();
    cb.querySelector("[data-ok]").onclick = () => { cb.remove(), onOk(); };
  }
  const canState = (a, me) => window.AssetAccess.canState(a, me);
  function rowHtml(a, b, me, withCut = true) {
    const cut = withCut && canState(a, me) && canState(b, me);
    return `<div class="mlink-row" data-mlink-open="${b.id}">${thumb(b)}<div class="mlink-row-main"><b>${esc(b.product)}</b><span>${esc(b.assetNo)}</span></div>${badge(b)}${cut ? `<button type="button" class="mlink-cut" data-mlink-cut="${b.id}" aria-label="연결 해제">${CLOSE_ICON}</button>` : ""}</div>`;
  }
  // 배정 탭의 배정 카드 아래 영역(활성 배정이 있을 때만)
  function sectionHtml(a, me) {
    if (!(a.assignments || []).length || a.status === "disposed") return "";
    const v = L().view(a, me), full = L().count(a.id) >= L().MAX;
    return `<div class="dsection mlink-sec">
      <div class="mlink-head"><h2>연결된 자산 <span>${v.visible.length}</span></h2>${canState(a, me) ? `<button type="button" class="btn sm" data-mlink-add${full ? " disabled" : ""}>자산 연결</button>` : ""}</div>
      ${v.visible.length ? `<div class="mlink-list">${v.visible.slice(0, 5).map(b => rowHtml(a, b, me)).join("")}</div>` : '<p class="mlink-empty">연결된 자산이 없습니다.</p>'}
      ${v.visible.length > 5 ? `<button type="button" class="mlink-all" data-mlink-all>전체 보기 (${v.visible.length})</button>` : ""}
      ${v.hidden ? `<p class="mlink-hidden">조회할 수 없는 연결 자산 ${v.hidden}건</p>` : ""}
    </div>`;
  }
  function prune(log, cause) {
    L().prune().forEach(([x, y]) => {
      log(x, { script: `자산 연결: 연결 해제(${cause})`, before: label(y), after: "" });
      log(y, { script: `자산 연결: 연결 해제(${cause})`, before: label(x), after: "" });
    });
  }
  function cutConfirm(a, b, log, after) {
    confirm("연결을 해제하시겠습니까?", `<strong>${esc(label(a))}</strong><br><span aria-hidden="true">↕</span><br><strong>${esc(label(b))}</strong><br><br>배정은 바뀌지 않습니다.`, () => {
      if (!L().remove(a, b)) return toast("설정이 변경되었습니다. 잠시 후 다시 시도해주세요."), after();
      log(a, { script: "자산 연결: 연결 해제", before: label(b), after: "" });
      log(b, { script: "자산 연결: 연결 해제", before: label(a), after: "" });
      toast("연결이 해제되었습니다."), after();
    }, 380);
  }
  function wireRows(scope, a, ctx, after) {
    scope.querySelectorAll("[data-mlink-open]").forEach(row => row.onclick = e => {
      if (e.target.closest("[data-mlink-cut]")) return;
      document.querySelectorAll(".mlink-sheet-back").forEach(s => s.remove());
      ctx.open(row.dataset.mlinkOpen);
    });
    scope.querySelectorAll("[data-mlink-cut]").forEach(btn => btn.onclick = e => {
      e.stopPropagation();
      cutConfirm(a, window.DATA.assets.find(x => x.id === btn.dataset.mlinkCut), ctx.log, after);
    });
  }
  function openAll(a, ctx) {
    const s = sheet("연결된 자산", '<div class="mlink-list" data-list></div>', '<button type="button" class="btn" data-close>닫기</button>');
    const draw = () => {
      const v = L().view(a, ctx.me), list = s.querySelector("[data-list]");
      list.innerHTML = v.visible.map(b => rowHtml(a, b, ctx.me)).join("") || '<p class="mlink-empty">연결된 자산이 없습니다.</p>';
      wireRows(list, a, ctx, () => { draw(), ctx.after(); });
    };
    s.querySelector("[data-close]").onclick = () => s.remove();
    s.onclick = e => { e.target === s && s.remove(); };
    draw();
  }
  // 자산 연결 시트: 배정 대상 → 이 대상의 연결되지 않은 자산 → 배정 가능 자산 검색(새 배정)
  function openAdd(a, ctx) {
    const room = L().MAX - L().count(a.id), picked = new Map(), r = a.assignments[0], today = "2026-09-04"; // 프로토타입 기준일(다른 화면의 TODAY와 같음)
    let q = "", date = today;
    const isNew = b => !(b.assignments || []).length;
    const s = sheet("자산 연결", `
      <section class="mlink-add-sec"><h3>배정 대상</h3>${ctx.identity(r)}</section>
      <section class="mlink-add-sec"><h3>연결되지 않은 자산</h3><div class="mlink-list" data-same></div></section>
      <section class="mlink-add-sec"><h3>배정 가능 자산 검색</h3><input type="text" class="picker-search" placeholder="고유관리번호" data-q><div class="mlink-list mlink-found" data-found></div>
        <div class="mlink-date" data-date-box hidden><label>배정일</label><input type="date" data-date value="${today}" max="${today}"><p class="mlink-help">검색해서 선택한 자산을 이 대상에게 새로 배정하면서 연결합니다.</p></div></section>`, '<button type="button" class="btn" data-close>취소</button><button type="button" class="btn primary" data-save disabled>저장</button>');
    const save = s.querySelector("[data-save]"), dateBox = s.querySelector("[data-date-box]");
    const rowHtml = b => {
      const on = picked.has(b.id), lock = !on && picked.size >= room;
      return `<label class="mlink-row mlink-cand${on ? " on" : ""}"><input type="checkbox" data-pick="${b.id}"${on ? " checked" : ""}${lock ? " disabled" : ""}>${thumb(b)}<div class="mlink-row-main"><b>${esc(b.product)}</b><span>${esc(b.assetNo)}</span></div>${isNew(b) ? '<span class="badge stock">새로 배정</span>' : badge(b)}</label>`;
    };
    const refresh = () => {
      const newCount = [...picked.values()].filter(isNew).length;
      dateBox.hidden = !newCount;
      save.disabled = !picked.size || newCount && (!date || date > today);
    };
    const draw = () => {
      const same = L().candidates(a, ctx.me), pickedNew = [...picked.values()].filter(isNew),
        found = q ? L().stockMatches(a, ctx.me, q).filter(b => !picked.has(b.id)) : [];
      s.querySelector("[data-same]").innerHTML = same.length ? same.map(rowHtml).join("") : '<p class="mlink-empty">연결할 수 있는 자산이 없습니다.</p>';
      s.querySelector("[data-found]").innerHTML = pickedNew.concat(found).map(rowHtml).join("") || (q ? '<p class="mlink-empty">결과가 없습니다.</p>' : "");
      s.querySelectorAll("[data-pick]").forEach(c => c.onchange = () => {
        const b = window.DATA.assets.find(x => x.id === c.dataset.pick);
        c.checked ? picked.set(b.id, b) : picked.delete(b.id), draw();
      });
      refresh();
    };
    s.querySelector("[data-q]").oninput = e => { q = e.target.value.trim().toLowerCase(), draw(); };
    s.querySelector("[data-date]").onchange = e => { date = e.target.value, refresh(); };
    s.querySelector("[data-close]").onclick = () => s.remove();
    save.onclick = () => {
      const targets = [...picked.values()], key = L().targetKey(a);
      const stale = targets.filter(b => isNew(b) ? b.status !== "stock" || b.deleted_at : L().targetKey(b) !== key || L().linked(a.id, b.id));
      if (stale.length) return stale.forEach(b => picked.delete(b.id)), toast("설정이 변경되었습니다. 잠시 후 다시 시도해주세요."), draw();
      const record = r.employee ? { employee: r.employee, worksite: null, since: date } : { employee: null, worksite: r.worksite, since: date };
      targets.forEach(b => {
        isNew(b) && (b.assignments = [{ ...record }], b.status = "assigned", ctx.log(b, { script: "배정 관리: 신규 배정", target: record, before: "", after: window.fmtDate(date) }));
        L().add(a, b);
        ctx.log(a, { script: "자산 연결: 연결", before: "", after: label(b) });
        ctx.log(b, { script: "자산 연결: 연결", before: "", after: label(a) });
      });
      s.remove(), toast("저장되었습니다."), ctx.after();
    };
    draw();
  }
  function wire(root, a, ctx) {
    const sec = root.querySelector(".mlink-sec");
    if (!sec) return;
    sec.querySelector("[data-mlink-add]")?.addEventListener("click", () => openAdd(a, ctx));
    sec.querySelector("[data-mlink-all]")?.addEventListener("click", () => openAll(a, ctx));
    wireRows(sec, a, ctx, ctx.after);
  }
  // 연결 자산 재배정·반납 확인 시트. 연결이 없으면 false를 돌려 기존 확인을 쓰게 한다.
  function together(a, kind, me, onRun) {
    if (!L().count(a.id)) return false;
    const verb = kind === "reassign" ? "재배정" : "반납", plan = L().togetherPlan(a, me);
    let mode = "all";
    const s = sheet(`${verb}하시겠습니까?`, `<div class="mlink-modes"><label class="radio-row"><input type="radio" name="mlink-mode" value="all" checked><span>연결된 자산과 함께</span></label><label class="radio-row"><input type="radio" name="mlink-mode" value="one"><span>이 자산만</span></label></div><div data-body></div>`, '<button type="button" class="btn" data-close>취소</button><button type="button" class="btn primary" data-ok>확인</button>', 340);
    const rows = list => list.map(b => rowHtml(a, b, me, false)).join("");
    const draw = () => {
      const cutCount = plan.cutVisible.length + plan.cutHidden;
      s.querySelector("[data-body]").innerHTML = mode === "all" ? `
        <div class="mlink-group"><div class="mlink-group-head">함께 ${verb}될 자산 <b>${plan.move.length}</b>건</div><div class="mlink-list">${rows(plan.move)}</div>${kind === "return" ? '<p class="mlink-note">반납 시 연결은 모두 해제됩니다.</p>' : ""}</div>
        ${cutCount ? `<div class="mlink-group warn"><div class="mlink-group-head">상태 관리 권한이 없어 함께 ${verb}되지 않고 연결이 끊어질 자산 <b>${cutCount}</b>건</div><div class="mlink-list">${rows(plan.cutVisible)}</div>${plan.cutHidden ? `<p class="mlink-hidden">조회할 수 없는 자산 ${plan.cutHidden}건</p>` : ""}</div>` : ""}`
        : `<p class="mlink-note">${kind === "return" ? "반납 시 연결은 모두 해제됩니다." : "이 자산에 연결된 자산들은 해제됩니다."}</p>`;
    };
    s.querySelectorAll('[name="mlink-mode"]').forEach(r => r.onchange = () => { mode = r.value, draw(); });
    s.querySelector("[data-close]").onclick = () => s.remove();
    s.querySelector("[data-ok]").onclick = () => {
      s.remove();
      if (mode === "all" && L().togetherPlan(a, me).signature !== plan.signature) return toast("설정이 변경되었습니다. 잠시 후 다시 시도해주세요.");
      onRun(mode, plan);
    };
    draw();
    return true;
  }
  // 함께 처리 실행: 재배정은 같은 기록을 모두에 적용하고 경계 연결을 끊는다.
  function runReassign(a, mode, plan, record, log) {
    const one = (x, note) => {
      const prev = x.assignments[0];
      x.assignments[0] = { ...record }, log(x, { script: "배정 관리: 재배정" + (note || ""), before: `${prev.employee || prev.worksite} · ${window.fmtDate(prev.since)}`, after: `${record.employee || record.worksite} · ${window.fmtDate(record.since)}` });
    };
    mode === "all" ? (plan.cutPairs.forEach(([x, y]) => L().remove({ id: x }, { id: y })), plan.move.forEach(x => one(x, x === a ? "" : ` (${a.product} · ${a.assetNo}과 함께)`))) : one(a);
    prune(log, "재배정");
  }
  function runReturn(a, mode, plan, log, nextStatus) {
    const one = (x, note) => {
      const rec = x.assignments[0];
      x.assignments = [], x.status = nextStatus(x), log(x, { script: "배정 관리: 반납" + (note || ""), target: rec, before: window.fmtDate(rec.since), after: "" });
    };
    mode === "all" ? plan.move.forEach(x => one(x, x === a ? "" : ` (${a.product} · ${a.assetNo}과 함께)`)) : one(a);
    prune(log, "반납");
  }
  const unlinkNote = a => L().count(a.id) ? ` 연결된 자산 ${L().count(a.id)}건과의 연결이 해제됩니다.` : "";
  window.MappLinks = { sectionHtml, wire, together, runReassign, runReturn, prune, unlinkNote };
})();
