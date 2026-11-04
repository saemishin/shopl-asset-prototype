// 앱(리더·직원) 자산 상세의 연결된 자산 영역과 연결 자산 이동·반납 확인 시트.
// 기준은 Policy_15·대시보드 Web_dc_23 4번·3-3-3·3-4-2와 같고 저장소는 window.AssetLinks를 공유한다.
(() => {
  const L = () => window.AssetLinks;
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const STATUS = { assigned: ["배정 중", "assigned"], stock: ["배정 가능", "stock"], repair: ["수리/점검 중", "repair"], lost: ["분실", "lost"], disposed: ["폐기", "disposed"] };
  const CLOSE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const INFO_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8v.01"/></svg>';
  const label = b => `${b.product} · ${b.assetNo}`;
  // A non-interactive placeholder per hidden asset, generated from the permitted count only.
  const maskedRows = count => Array.from({length: count}, () => `<div class="mlink-row link-unavailable-card"><span class="link-unavailable-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span><div class="mlink-row-main"><b>조회 불가 자산</b><span class="link-unavailable-mask" aria-hidden="true">••••••••</span></div></div>`).join("");
  const badge = b => `<span class="badge ${STATUS[b.status][1]}">${STATUS[b.status][0]}</span>`;
  const thumb = b => {
    const ph = window.assetPhotos(b);
    return ph.length ? `<span class="thumb" style="background:${ph[b._primary || 0].color}"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="m21 16-5-5-9 8"/></svg></span>` : '<span class="thumb empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-4 4 3 4-4 5 4"/></svg></span>';
  };
  function assetSummaryHtml(a) {
    return `<div class="aa-asset-summary" data-current-asset>${thumb(a)}<div class="aa-asset-summary-main"><strong>${esc(a.product)}</strong><span>${esc(a.assetNo)}</span></div></div>`;
  }
  // 현재 자산·배정 정보 카드(대시보드 asset-assignment-summary와 같은 구성)
  function currentCardHtml(a, r, identityInner) {
    return `<div class="asset-assignment-summary" data-current-asset-assignment>${assetSummaryHtml(a)}<div class="asset-assignment-current"><div class="acard-id">${identityInner}</div><span class="acard-date">배정일 <b>${window.fmtDate(r.since)}</b></span></div></div>`;
  }
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
    cb.className = "modal-back", cb.style.zIndex = z, cb.innerHTML = `<div class="modal" style="width:340px"><div class="body" style="padding-top:20px"><p style="font-size:14px;font-weight:700;margin-bottom:6px">${title}</p>${body ? `<div class="hint" style="margin-top:0">${body}</div>` : ""}</div><div class="foot"><button class="btn" data-no>취소</button><button class="btn primary" data-ok>확인</button></div></div>`;
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
      ${v.visible.length ? `<div class="mlink-list">${v.visible.slice(0, 5).map(b => rowHtml(a, b, me)).join("")}</div>` : v.hidden ? "" : '<p class="mlink-empty">연결된 자산이 없습니다.</p>'}
      ${v.visible.length > 5 ? `<button type="button" class="mlink-all" data-mlink-all>전체 보기 (${v.visible.length})</button>` : ""}
      ${v.hidden ? `<p class="mlink-hidden">조회 불가 자산 ${v.hidden}건</p><div class="mlink-list link-unavailable-list">${maskedRows(v.hidden)}</div>` : ""}
    </div>`;
  }
  function prune(log, cause) {
    L().prune().forEach(([x, y]) => {
      log(x, { script: `자산 연결: 연결 해제(${cause})`, before: label(y), after: "" });
      log(y, { script: `자산 연결: 연결 해제(${cause})`, before: label(x), after: "" });
    });
  }
  function cutConfirm(a, b, log, after) {
    confirm("연결을 해제하시겠습니까?", `<span class="mlink-cut-cards">${assetSummaryHtml(a)}${assetSummaryHtml(b)}</span>배정은 바뀌지 않습니다.`, () => {
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
  // 휴대폰 화면을 덮는 전체 화면·팝업
  function overlay(cls, z) {
    const screen = document.querySelector(".mapp-screen"), r = screen ? screen.getBoundingClientRect() : { top: 0, left: 0, width: 390, height: 844 };
    const back = document.createElement("div");
    back.className = cls;
    back.style.cssText = `position:absolute;top:${r.top + window.scrollY}px;left:${r.left + window.scrollX}px;width:${r.width}px;height:${r.height}px;z-index:${z};`;
    document.body.appendChild(back);
    return back;
  }
  const targetActive = r => {
    const type = r.employee ? "employee" : "worksite", name = r.employee || r.worksite;
    return !["retired", "resigned", "inactive"].includes(window.DATA.targetStatuses?.[type]?.[name]);
  };
  // 앱 공통06 분류 선택 팝업(조회용 소분류 복수 선택)
  function openSubSelect(cats, current, onApply) {
    const groups = [], sel = new Set(current || []);
    cats.forEach(c => { let g = groups.find(x => x.name === c.group); g || groups.push(g = { name: c.group, items: [] }), g.items.push(c); });
    let q = "";
    const p = overlay("mapp-fullpage-back", 160);
    p.innerHTML = `<div class="mapp-add-category-popup">
      <div class="mapp-topbar mapp-add-category-head"><span class="mapp-topbar-title">분류</span><button type="button" class="mapp-add-category-close" data-sp-close aria-label="닫기">×</button></div>
      <div class="mapp-add-category-body" data-sp-body></div>
      <div class="mapp-fullpage-foot"><button type="button" class="btn primary" data-sp-apply${cats.length ? "" : " disabled"}>적용</button></div></div>`;
    const body = p.querySelector("[data-sp-body]");
    const visible = () => groups.map(g => ({ g, items: !q || g.name.toLowerCase().includes(q) ? g.items : g.items.filter(c => c.sub.toLowerCase().includes(q)) })).filter(x => x.items.length);
    const state = items => { const n = items.filter(c => sel.has(c.sub)).length; return n === 0 ? "" : n === items.length ? "on" : "mixed"; };
    const box = (st, attr) => `<input type="checkbox" ${attr}${st === "on" ? " checked" : ""} data-mixed="${st === "mixed" ? 1 : 0}">`;
    function draw() {
      if (!cats.length) { body.innerHTML = '<p class="muted mapp-pick-empty">선택할 수 있는 분류가 없습니다.</p>'; return; }
      const v = visible(), all = v.flatMap(x => x.items);
      body.innerHTML = `<div class="mapp-directory-search"><input type="search" data-sp-q placeholder="검색" aria-label="분류 검색" autocomplete="off" value="${esc(q)}"></div>
        ${all.length ? `<div class="mapp-cat-tools"><label class="mapp-cat-row">${box(state(all), "data-sp-all")}<span>전체</span></label><button type="button" class="mapp-cat-reset" data-sp-reset>초기화</button></div>
        ${v.map(({ g, items }, gi) => `<section class="mapp-cat-group"><label class="mapp-cat-row mapp-cat-head">${box(state(items), `data-sp-group="${gi}"`)}<span>${esc(g.name)}</span></label>${items.map(c => `<label class="mapp-cat-row mapp-cat-sub">${box(sel.has(c.sub) ? "on" : "", `data-sp-sub="${esc(c.sub)}"`)}<span>${esc(c.sub)}</span></label>`).join("")}</section>`).join("")}` : '<p class="muted mapp-pick-empty">결과가 없습니다.</p>'}`;
      body.querySelectorAll('[data-mixed="1"]').forEach(x => x.indeterminate = true);
      const input = body.querySelector("[data-sp-q]");
      input.oninput = e => { q = e.target.value.trim().toLowerCase(), draw(); const n = body.querySelector("[data-sp-q]"); n.focus(), n.setSelectionRange(n.value.length, n.value.length); };
      const toggle = (items, on) => items.forEach(c => on ? sel.add(c.sub) : sel.delete(c.sub));
      body.querySelector("[data-sp-all]")?.addEventListener("change", e => { toggle(all, e.target.checked), draw(); });
      body.querySelectorAll("[data-sp-group]").forEach(x => x.onchange = () => { toggle(v[+x.dataset.spGroup].items, x.checked), draw(); });
      body.querySelectorAll("[data-sp-sub]").forEach(x => x.onchange = () => { x.checked ? sel.add(x.dataset.spSub) : sel.delete(x.dataset.spSub), draw(); });
      body.querySelector("[data-sp-reset]")?.addEventListener("click", () => { sel.clear(), draw(); });
    }
    p.querySelector("[data-sp-close]").onclick = () => p.remove();
    p.querySelector("[data-sp-apply]").onclick = () => { const subs = sel.size === cats.length ? [] : cats.filter(c => sel.has(c.sub)).map(c => c.sub); p.remove(), onApply(subs); };
    draw();
  }
  // 앱 공통05 자산 선택 화면. candidates(sub, query)가 후보를 돌려준다. limit이 있으면 선택 상한.
  function openAssetPick({ me, candidates, initialIds = [], initialSubs = [], limit = Infinity, onApply }) {
    const sel = new Set(initialIds),
      cats = window.DATA.categories.filter(c => window.AssetAccess.scope(c, "view", me) && window.AssetAccess.scope(c, "assign", me));
    let subs = [...initialSubs], query = "";
    const p = overlay("mapp-fullpage-back", 150);
    p.innerHTML = `
      <div class="mapp-fullpage-head">
        <button type="button" class="mapp-back" data-pk-back aria-label="뒤로">←</button>
        <span class="mapp-fullpage-head-title">자산 선택</span>
      </div>
      <div class="mapp-fullpage-body">
        <div class="field"><label>분류</label><button type="button" class="perm-target-btn" data-pk-sub><span data-pk-sub-label></span><span class="chev">›</span></button></div>
        <input type="search" class="picker-search" placeholder="품목명·고유관리번호 검색" data-pk-q>
        <div class="mapp-pick-list" data-pk-list></div>
      </div>
      <div class="mapp-fullpage-foot"><button type="button" class="btn primary" data-pk-apply>적용</button></div>`;
    const list = p.querySelector("[data-pk-list]");
    function draw() {
      const items = candidates(subs, query), full = sel.size >= limit;
      p.querySelector("[data-pk-sub-label]").textContent = subs.length ? `${subs[0]}${subs.length > 1 ? ` +${subs.length - 1}` : ""}` : "전체";
      list.innerHTML = items.length ? items.map(a => { const on = sel.has(a.id); return `<label class="mapp-pick-row"><input type="checkbox" data-pk-id="${a.id}"${on ? " checked" : ""}${!on && full ? " disabled" : ""}><span class="mapp-pick-name">${esc(a.product)}</span><span class="mapp-pick-no">${esc(a.assetNo || "")}</span></label>`; }).join("") : '<p class="muted mapp-pick-empty">배정할 수 있는 자산이 없습니다.</p>';
      list.querySelectorAll("[data-pk-id]").forEach(c => c.onchange = () => {
        c.checked ? sel.add(c.dataset.pkId) : sel.delete(c.dataset.pkId), draw();
      });
    }
    p.querySelector("[data-pk-sub]").onclick = () => openSubSelect(cats, subs, v => { subs = v, draw(); });
    p.querySelector("[data-pk-q]").oninput = e => { query = e.target.value, draw(); };
    p.querySelector("[data-pk-back]").onclick = () => p.remove();
    p.querySelector("[data-pk-apply]").onclick = () => { p.remove(), onApply([...sel], subs); };
    draw();
  }
  const byName = (x, y) => String(x.product).localeCompare(String(y.product), "ko") || String(x.assetNo || "").localeCompare(String(y.assetNo || ""));
  // 자산 연결 전체 화면: 배정 대상 → 연결되지 않은 자산 → 새로 배정할 자산 선택 → 배정일
  function openAdd(a, ctx) {
    const room = L().MAX - L().count(a.id), r = a.assignments[0], active = targetActive(r),
      same = new Set(), f = { newIds: [], dateIso: "" };
    const p = overlay("mapp-fullpage-back", 100);
    p.innerHTML = `
      <div class="mapp-fullpage-head">
        <button type="button" class="mapp-back" data-la-back aria-label="뒤로">←</button>
        <span class="mapp-fullpage-head-title">자산 연결</span>
      </div>
      <div class="mapp-fullpage-body" data-la-body></div>
      <div class="mapp-fullpage-foot"><button type="button" class="btn primary" data-la-save disabled>저장</button></div>`;
    const body = p.querySelector("[data-la-body]"), save = p.querySelector("[data-la-save]");
    const chip = (val, openKey, clearKey) => val ? `<div class="aa-target-selected" ${openKey}><span class="perm-chip">${esc(val)}</span><button type="button" class="aa-target-x" ${clearKey} aria-label="선택 해제">${CLOSE_ICON}</button></div>` : `<button type="button" class="perm-target-btn" ${openKey}><span class="muted">선택</span><span class="chev">›</span></button>`;
    const stockCandidates = (subs, q) => {
      q = (q || "").trim().toLowerCase();
      return window.DATA.assets.filter(b => b.id !== a.id && !b.deleted_at && b.status !== "disposed" && !(b.assignments || []).length && canState(b, ctx.me) && (!subs.length || subs.includes(b.sub)) && (!q || `${b.product} ${b.assetNo || ""}`.toLowerCase().includes(q))).sort(byName);
    };
    const draw = () => {
      const cands = L().candidates(a, ctx.me), full = same.size + f.newIds.length >= room,
        picked = f.newIds.map(id => window.DATA.assets.find(x => x.id === id)).filter(Boolean),
        assetLabel = picked.length ? `${picked[0].product}${picked.length > 1 ? ` +${picked.length - 1}` : ""}` : "";
      body.innerHTML = `
        ${currentCardHtml(a, r, ctx.identityInner(r))}
        <section class="mlink-add-sec"><h3>연결 가능 자산</h3><p class="link-section-help">현재 배정 대상에게 배정되어 있는 자산입니다.</p><div class="mlink-list">${cands.length ? cands.map(b => {
          const on = same.has(b.id);
          return `<label class="mlink-row mlink-cand${on ? " on" : ""}"><input type="checkbox" data-pick="${b.id}"${on ? " checked" : ""}${!on && full ? " disabled" : ""}>${thumb(b)}<div class="mlink-row-main"><b>${esc(b.product)}</b><span>${esc(b.assetNo)}</span></div>${badge(b)}</label>`;
        }).join("") : '<p class="mlink-empty">연결할 수 있는 자산이 없습니다.</p>'}</div></section>
        ${active ? `<section class="mlink-add-sec"><h3>자산 추가 연결</h3><p class="link-section-help">현재 배정 대상에게 새로 배정하며 자산을 연결합니다.</p>
          <div class="field"><label>자산</label>${chip(assetLabel, "data-la-asset", "data-la-asset-clear")}</div>
          <div class="field"><label>배정일</label><div class="mapp-date-wrap">${chip(f.dateIso ? window.fmtDate(f.dateIso) : "", "data-la-date", "data-la-date-clear")}</div></div></section>` : ""}`;
      body.querySelectorAll("[data-pick]").forEach(c => c.onchange = () => { c.checked ? same.add(c.dataset.pick) : same.delete(c.dataset.pick), draw(); });
      const assetBtn = body.querySelector("[data-la-asset]");
      assetBtn && (assetBtn.onclick = () => openAssetPick({ me: ctx.me, candidates: stockCandidates, initialIds: f.newIds, limit: room - same.size, onApply: ids => { f.newIds = ids, draw(); } }));
      const dateBtn = body.querySelector("[data-la-date]");
      dateBtn && (dateBtn.onclick = () => ctx.pickDate(f.dateIso, v => { f.dateIso = v, draw(); }));
      [["[data-la-asset-clear]", () => { f.newIds = []; }], ["[data-la-date-clear]", () => { f.dateIso = ""; }]].forEach(([q, fn]) => {
        const x = body.querySelector(q);
        x && (x.onclick = e => { e.stopPropagation(), fn(), draw(); });
      });
      save.disabled = !(same.size + f.newIds.length) || f.newIds.length && !f.dateIso;
    };
    p.querySelector("[data-la-back]").onclick = () => {
      if (!(same.size || f.newIds.length || f.dateIso)) return p.remove();
      const cb = document.createElement("div");
      cb.className = "modal-back", cb.style.zIndex = 340, cb.innerHTML = `<div class="modal sm" style="width:340px" role="dialog" aria-modal="true" aria-label="취소하시겠습니까?"><h3>취소하시겠습니까?</h3><div class="body" style="font-size:14px">취소 시 편집한 내용이 저장되지 않습니다.</div><div class="foot"><button type="button" class="btn" data-stay>취소</button><button type="button" class="btn primary" data-leave>확인</button></div></div>`, document.body.appendChild(cb);
      cb.querySelector("[data-stay]").onclick = () => cb.remove();
      cb.querySelector("[data-leave]").onclick = () => { cb.remove(), p.remove(); };
    };
    save.onclick = () => {
      if (save.disabled) return;
      const key = L().targetKey(a), sameAssets = [...same].map(id => window.DATA.assets.find(x => x.id === id)), newAssets = f.newIds.map(id => window.DATA.assets.find(x => x.id === id));
      const staleSame = sameAssets.filter(b => !b || L().targetKey(b) !== key || L().linked(a.id, b.id)), staleNew = newAssets.filter(b => !b || !active || b.status !== "stock" || b.deleted_at || (b.assignments || []).length);
      if (staleSame.length || staleNew.length) {
        staleSame.forEach(b => b && same.delete(b.id)), f.newIds = f.newIds.filter(id => !staleNew.some(b => b && b.id === id));
        return toast("설정이 변경되었습니다. 잠시 후 다시 시도해주세요."), draw();
      }
      const record = r.employee ? { employee: r.employee, worksite: null, since: f.dateIso } : { employee: null, worksite: r.worksite, since: f.dateIso };
      newAssets.forEach(b => { b.assignments = [{ ...record }], b.status = "assigned", ctx.log(b, { script: "배정 관리: 신규 배정", target: record, before: "", after: window.fmtDate(f.dateIso) }); });
      sameAssets.concat(newAssets).forEach(b => {
        L().add(a, b);
        ctx.log(a, { script: "자산 연결: 연결", before: "", after: label(b) });
        ctx.log(b, { script: "자산 연결: 연결", before: "", after: label(a) });
      });
      p.remove(), toast("저장되었습니다."), ctx.after();
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
  // Selection stays in the first step, including across target/date redraws.
  function createChoice(a, kind, me) {
    const hasLinks = !!L().count(a.id), verb = kind === "reassign" ? "이동" : "반납", plan = L().togetherPlan(a, me);
    let mode = "all";
    const html = () => hasLinks ? `<div class="field" data-mlink-choice><label>연결 자산 처리</label><div class="mlink-modes"><label class="radio-row"><input type="radio" name="mlink-mode" value="all"${mode === "all" ? " checked" : ""}><span>함께</span></label><label class="radio-row"><input type="radio" name="mlink-mode" value="one"${mode === "one" ? " checked" : ""}><span>이 자산만</span></label></div><div data-linked-body></div></div>` : "";
    const wire = root => {
      const area = root.querySelector("[data-mlink-choice]");
      if (!area) return;
      const rows = list => list.map(b => `<div class="mlink-row mlink-row-plain"><div class="mlink-row-main"><b>${esc(b.product)}</b><span>${esc(b.assetNo)}</span></div>${badge(b)}</div>`).join("");
      const draw = () => {
        const cutCount = plan.cutVisible.length + plan.cutHidden, others = plan.move.filter(b => b.id !== a.id);
        area.querySelector("[data-linked-body]").innerHTML = mode === "all" ? `
          ${others.length ? `<div class="mlink-group"><div class="mlink-group-head">함께 ${verb}될 자산 <b>${others.length}</b>건</div><div class="mlink-list">${rows(others)}</div></div>` : ""}${kind === "return" ? '<p class="mlink-note">반납 시 연결은 모두 해제됩니다.</p>' : ""}
          ${cutCount ? `<div class="mlink-group warn"><div class="mlink-group-head">연결이 끊어질 자산 <b>${cutCount}</b>건</div><p class="tg-permission-note">상태 관리 권한이 없습니다.</p><div class="mlink-list">${rows(plan.cutVisible)}${maskedRows(plan.cutHidden)}</div></div>` : ""}` : `<p class="mlink-note">${kind === "return" ? "반납 시 연결은 모두 해제됩니다." : "이 자산에 연결된 자산들은 해제됩니다."}</p>`;
      };
      area.querySelectorAll('[name="mlink-mode"]').forEach(r => r.onchange = () => { mode = r.value; draw(); });
      draw();
    };
    return { html, wire, plan, get mode() { return mode; }, valid: () => !hasLinks || mode !== "all" || L().togetherPlan(a, me).signature === plan.signature };
  }
  function returnReview(a, me, currentHtml, onRun, onStale) {
    const choice = createChoice(a, "return", me);
    const s = sheet("반납", `${currentHtml}<div class="ra-current"><div class="perm-info-note">${INFO_ICON}<span>현재 배정을 종료합니다.</span></div></div>${choice.html()}`, '<button type="button" class="btn" data-close>취소</button><button type="button" class="btn primary" data-save>저장</button>', 120);
    choice.wire(s);
    s.querySelector("[data-close]").onclick = () => s.remove();
    s.querySelector("[data-save]").onclick = () => confirm("반납하시겠습니까?", "", () => {
      if (!choice.valid()) { s.remove(); toast("설정이 변경되었습니다. 잠시 후 다시 시도해주세요."); onStale?.(); return; }
      s.remove(); onRun(choice.mode, choice.plan);
    });
  }
  // 함께 처리 실행: 이동은 같은 기록을 모두에 적용하고 경계 연결을 끊는다.
  function runReassign(a, mode, plan, record, log, name) {
    const items = mode === "all" ? plan.move : [a];
    // Initialize original activity snapshots before the atomic record transition.
    window.AssetMoves.moveBatch(items,record,"2026-09-04",name,log,a);
    if (mode === "all") plan.cutPairs.forEach(([x,y]) => L().remove({id:x},{id:y}));
    prune(log, "이동");
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
  window.MappLinks = { currentCardHtml, openAssetPick, openSubSelect, assetSummaryHtml, sectionHtml, wire, createChoice, returnReview, runReassign, runReturn, prune, unlinkNote };
})();
