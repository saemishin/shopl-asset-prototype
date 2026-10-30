// 템플릿 관리(Web_dc_28)와 템플릿으로 배정(Web_dc_29). 연결 기준은 Policy_15, 저장소는 window.AssetLinks.
(() => {
  const D = window.DATA;
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const MAX_ITEMS = 50;
  D.templates ||= [
    { id: "T1", name: "노트북 지급 키트", base: { sub: "노트북", product: "그램 16 (2024)" }, items: [{ sub: "케이블·액세서리", product: "무선 마우스", count: 1 }] },
    { id: "T2", name: "매장 업무석 세트", base: { sub: "책상", product: "데스커 1400" }, items: [{ sub: "의자", product: "시디즈 T50", count: 2 }] }
  ];
  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg, t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:400", document.body.appendChild(t), setTimeout(() => t.remove(), 1800);
  }
  function modal(html, width = 520, z = 320) {
    const back = document.createElement("div");
    back.className = "modal-back", back.style.zIndex = z, back.innerHTML = `<div class="modal" style="width:${width}px">${html}</div>`;
    document.body.appendChild(back);
    return back;
  }
  function confirmBox(title, body, onOk, z = 360) {
    const cb = modal(`<h3>${title}</h3>${body ? `<div class="body" style="font-size:13px">${body}</div>` : ""}<div class="foot"><button class="btn" data-no>취소</button><button class="btn primary" data-ok>확인</button></div>`, 360, z);
    cb.querySelector("[data-no]").onclick = () => cb.remove();
    cb.querySelector("[data-ok]").onclick = () => { cb.remove(), onOk(); };
  }
  const subs = () => [...new Set(D.categories.map(c => c.sub).filter(Boolean))];
  const productsOf = sub => [...new Set(D.assets.filter(a => a.sub === sub && !a.deleted_at).map(a => a.product))].sort((p, q) => p.localeCompare(q, "ko"));
  const totalOf = t => 1 + t.items.reduce((n, x) => n + (+x.count || 0), 0);
  const itemKey = x => x.sub + "\u0000" + x.product;

  // ── Web_dc_28 템플릿 관리 ──
  function openTemplateManager() {
    const back = modal(`<h3>템플릿 관리</h3><div class="body" style="max-height:60vh;overflow-y:auto"><div style="display:flex;justify-content:flex-end;margin-bottom:8px"><button class="btn sm primary" data-tpl-add>+ 템플릿 추가</button></div><div data-tpl-list></div></div><div class="foot"><button class="btn" data-close>닫기</button></div>`);
    const draw = () => {
      const list = D.templates.slice().sort((p, q) => p.name.localeCompare(q.name, "ko"));
      back.querySelector("[data-tpl-list]").innerHTML = list.length ? list.map(t => `<div class="link-row static"><div class="link-row-main"><span class="link-row-name">${esc(t.name)}</span><span class="link-row-no">기준 ${esc(t.base.product)} · 전체 ${totalOf(t)}개</span></div><button class="btn sm" data-tpl-edit="${t.id}">수정</button><button class="btn sm" data-tpl-del="${t.id}">삭제</button></div>`).join("") : '<p class="muted" style="padding:32px;text-align:center">등록된 템플릿이 없습니다.</p>';
      back.querySelectorAll("[data-tpl-edit]").forEach(b => b.onclick = () => openTemplateEditor(D.templates.find(t => t.id === b.dataset.tplEdit), draw));
      back.querySelectorAll("[data-tpl-del]").forEach(b => b.onclick = () => confirmBox("삭제하시겠습니까?", "", () => {
        D.templates.splice(D.templates.findIndex(t => t.id === b.dataset.tplDel), 1), toast("삭제되었습니다."), draw();
      }));
    };
    back.querySelector("[data-tpl-add]").onclick = () => openTemplateEditor(null, draw);
    back.querySelector("[data-close]").onclick = () => back.remove();
    back.onclick = e => { e.target === back && back.remove(); };
    draw();
  }
  function openTemplateEditor(tpl, onSaved) {
    const original = tpl ? JSON.stringify({ name: tpl.name, base: tpl.base, items: tpl.items }) : "";
    const draft = tpl ? JSON.parse(original) : { name: "", base: { sub: "", product: "" }, items: [] };
    const back = modal(`<h3>${tpl ? "템플릿 수정" : "템플릿 추가"}</h3><div class="body" style="max-height:64vh;overflow-y:auto" data-ed></div><div class="foot"><button class="btn" data-cancel>취소</button><button class="btn primary" data-save disabled>저장</button></div>`, 620, 340);
    const body = back.querySelector("[data-ed]"), save = back.querySelector("[data-save]");
    const subSelect = (val, attr) => `<select ${attr}><option value="">소분류 선택</option>${subs().map(s => `<option${s === val ? " selected" : ""}>${esc(s)}</option>`).join("")}</select>`;
    const prodSelect = (sub, val, attr) => `<select ${attr}${sub ? "" : " disabled"}><option value="">품목명 선택</option>${(sub ? productsOf(sub) : []).map(p => `<option${p === val ? " selected" : ""}>${esc(p)}</option>`).join("")}</select>`;
    const errors = () => {
      const name = draft.name.trim(),
        dup = name && D.templates.some(t => t !== tpl && t.name.trim() === name),
        keys = [draft.base, ...draft.items].map(itemKey),
        dupRows = new Set(keys.filter((k, i) => keys.indexOf(k) !== i)),
        sum = draft.items.reduce((n, x) => n + (+x.count || 0), 0);
      return { dup, dupRows, over: sum > MAX_ITEMS };
    };
    const valid = () => {
      const e = errors();
      return draft.name.trim() && !e.dup && !e.over && !e.dupRows.size && draft.base.sub && draft.base.product && draft.items.length && draft.items.every(x => x.sub && x.product && +x.count >= 1);
    };
    const draw = () => {
      const e = errors();
      body.innerHTML = `
        <div class="field"><label>템플릿 이름</label><input type="text" maxlength="30" data-name value="${esc(draft.name)}" placeholder="입력"><p class="field-err" data-name-err${e.dup ? "" : " hidden"}>동일한 명칭이 존재합니다.</p></div>
        <div class="field"><label>기준 자산</label><div class="tpl-row">${subSelect(draft.base.sub, "data-base-sub")}${prodSelect(draft.base.sub, draft.base.product, "data-base-prod")}<span class="tpl-count">1개</span><span class="tpl-del-ph"></span></div>${e.dupRows.has(itemKey(draft.base)) && draft.base.product ? '<p class="field-err">같은 품목이 이미 있습니다.</p>' : ""}</div>
        <div class="field"><label>연결할 항목</label>${draft.items.length ? draft.items.map((x, i) => `<div class="tpl-row">${subSelect(x.sub, `data-item-sub="${i}"`)}${prodSelect(x.sub, x.product, `data-item-prod="${i}"`)}<input type="number" min="1" class="tpl-count" data-item-count="${i}" value="${x.count}"><button class="btn sm" data-item-del="${i}">삭제</button></div>${e.dupRows.has(itemKey(x)) && x.product ? '<p class="field-err">같은 품목이 이미 있습니다.</p>' : ""}`).join("") : '<p class="muted">항목을 추가해주세요.</p>'}${e.over ? '<p class="field-err">기준 자산을 제외한 필요 개수는 최대 50개입니다.</p>' : ""}
        <button class="btn sm" data-item-add style="margin-top:6px">+ 항목 추가</button></div>`;
      body.querySelector("[data-name]").oninput = ev => { draft.name = ev.target.value, refresh(); };
      body.querySelector("[data-base-sub]").onchange = ev => { draft.base = { sub: ev.target.value, product: "" }, draw(); };
      body.querySelector("[data-base-prod]").onchange = ev => { draft.base.product = ev.target.value, draw(); };
      body.querySelectorAll("[data-item-sub]").forEach(s => s.onchange = () => { draft.items[+s.dataset.itemSub] = { ...draft.items[+s.dataset.itemSub], sub: s.value, product: "" }, draw(); });
      body.querySelectorAll("[data-item-prod]").forEach(s => s.onchange = () => { draft.items[+s.dataset.itemProd].product = s.value, draw(); });
      body.querySelectorAll("[data-item-count]").forEach(s => s.onchange = () => { draft.items[+s.dataset.itemCount].count = Math.max(1, parseInt(s.value, 10) || 1), draw(); });
      body.querySelectorAll("[data-item-del]").forEach(b => b.onclick = () => { draft.items.splice(+b.dataset.itemDel, 1), draw(); });
      body.querySelector("[data-item-add]").onclick = () => { draft.items.push({ sub: "", product: "", count: 1 }), draw(); };
      refresh();
    };
    const changed = () => tpl ? JSON.stringify(draft) !== original : draft.name.trim() || draft.base.sub || draft.items.length;
    const refresh = () => {
      save.disabled = !valid() || !changed();
      const err = body.querySelector("[data-name-err]");
      err && (err.hidden = !errors().dup);
    };
    back.querySelector("[data-cancel]").onclick = () => changed() ? confirmBox("작성을 중단하시겠습니까?", "지금까지 작성한 내용은 저장되지 않습니다.", () => back.remove(), 380) : back.remove();
    save.onclick = () => {
      if (!valid()) return;
      const data = { name: draft.name.trim(), base: draft.base, items: draft.items.map(x => ({ ...x, count: +x.count })) };
      tpl ? Object.assign(tpl, data) : D.templates.push({ id: "T" + Date.now(), ...data });
      back.remove(), toast("저장되었습니다."), onSaved();
    };
    draw();
  }

  // ── Web_dc_29 템플릿으로 배정 ──
  const targetKey = t => t ? (t.type === "employee" ? "e:" : "w:") + t.value : null;
  const assetTargetKey = a => { const r = (a.assignments || [])[0]; return r ? (r.employee ? "e:" + r.employee : "w:" + r.worksite) : null; };
  function targetOptions(type) {
    const names = new Set();
    D.assets.forEach(a => (a.assignments || []).forEach(r => r[type] && names.add(r[type])));
    (type === "worksite" ? ["강남점", "판교점", "역삼점", "본사"] : []).forEach(n => names.add(n));
    return [...names].sort((p, q) => p.localeCompare(q, "ko"));
  }
  function usableTemplates() {
    if (window.hasPrototypeAssetManagePermission()) return D.templates;
    const ok = sub => D.assets.some(a => a.sub === sub && window.AssetAccess.canState(a));
    return D.templates.filter(t => [t.base, ...t.items].every(x => ok(x.sub)));
  }
  function openTemplateAssign(onDone) {
    const today = new Date().toISOString().slice(0, 10);
    const st = { kind: "", target: null, tplId: "", date: today, rows: [] };
    const back = modal(`<h3>템플릿으로 배정</h3><div class="body" style="max-height:68vh;overflow-y:auto" data-ta></div><div class="foot"><button class="btn" data-cancel>취소</button><button class="btn primary" data-save disabled>저장</button></div>`, 640);
    const body = back.querySelector("[data-ta]"), save = back.querySelector("[data-save]");
    const allPicked = () => st.rows.flatMap(r => r.picked);
    const isNew = a => !assetTargetKey(a);
    const candidates = row => D.assets.filter(a => !a.deleted_at && a.status !== "disposed" && a.sub === row.sub && a.product === row.product && window.AssetAccess.canState(a) && (isNew(a) ? a.status === "stock" : assetTargetKey(a) === targetKey(st.target)) && !allPicked().includes(a.id)).sort((p, q) => String(p.assetNo).localeCompare(String(q.assetNo)));
    const ready = () => st.target && st.tplId && st.rows.length > 1 && st.rows.every(r => r.picked.length === r.count) && (!allPicked().some(id => isNew(D.assets.find(a => a.id === id))) || st.date);
    const loadTemplate = () => {
      const t = D.templates.find(x => x.id === st.tplId);
      st.rows = t ? [{ ...t.base, count: 1, base: true, picked: [] }, ...t.items.map(x => ({ ...x, picked: [] }))] : [];
    };
    const assetById = id => D.assets.find(a => a.id === id);
    const draw = () => {
      const tpls = usableTemplates().slice().sort((p, q) => p.name.localeCompare(q.name, "ko"));
      const anyNew = allPicked().some(id => isNew(assetById(id)));
      body.innerHTML = `
        <div class="field"><label>배정 대상</label>
          <label class="radio-row"><input type="radio" name="ta-kind" value="employee"${st.kind === "employee" ? " checked" : ""}><span>구성원</span></label>
          <label class="radio-row"><input type="radio" name="ta-kind" value="worksite"${st.kind === "worksite" ? " checked" : ""}><span>근무지</span></label>
          ${st.kind ? `<select data-target><option value="">선택</option>${targetOptions(st.kind).map(n => `<option${st.target?.value === n ? " selected" : ""}>${esc(n)}</option>`).join("")}</select>` : ""}</div>
        <div class="field"><label>템플릿</label><select data-tpl${st.target ? "" : " disabled"}><option value="">템플릿 선택</option>${tpls.map(t => `<option value="${t.id}"${t.id === st.tplId ? " selected" : ""}>${esc(t.name)}</option>`).join("")}</select></div>
        <div class="field"><label>배정일</label><input type="date" data-date value="${st.date}" max="${today}"${anyNew ? "" : " disabled"}><p class="muted" style="margin-top:4px">새로 배정하는 자산에만 적용됩니다.</p></div>
        ${st.rows.length ? `<div class="field"><label>항목별 자산 선택</label>${st.rows.map((r, i) => `<div class="tpl-slot">
          <div class="tpl-slot-head"><b>${r.base ? "[기준] " : ""}${esc(r.product)}</b><span class="muted">${esc(r.sub)}</span>
            ${r.base ? '<span class="tpl-count">1개</span>' : `<input type="number" min="1" class="tpl-count" data-row-count="${i}" value="${r.count}">`}
            <span class="muted">${r.picked.length}/${r.count}</span>
            ${r.picked.length < r.count ? `<button class="btn sm" data-row-pick="${i}">자산 선택</button>` : ""}
            ${r.base ? "" : `<button class="btn sm" data-row-del="${i}">제외</button>`}</div>
          ${r.picked.map(id => { const a = assetById(id); return `<div class="link-row static"><div class="link-row-main"><span class="link-row-name">${esc(a.assetNo)}</span><span class="link-row-no">${isNew(a) ? "새로 배정" : "이미 배정됨"}</span></div><button class="btn sm" data-unpick="${i}:${id}">삭제</button></div>`; }).join("")}
        </div>`).join("")}<button class="btn sm" data-row-add style="margin-top:6px">+ 항목 추가</button></div>` : ""}`;
      body.querySelectorAll('[name="ta-kind"]').forEach(r => r.onchange = () => { st.kind = r.value, st.target = null, st.rows.forEach(x => x.picked = []), draw(); });
      body.querySelector("[data-target]")?.addEventListener("change", e => { st.target = e.target.value ? { type: st.kind, value: e.target.value } : null, st.rows.forEach(x => x.picked = []), draw(); });
      body.querySelector("[data-tpl]").onchange = e => { st.tplId = e.target.value, loadTemplate(), draw(); };
      body.querySelector("[data-date]").onchange = e => { st.date = e.target.value, refresh(); };
      body.querySelectorAll("[data-row-count]").forEach(inp => inp.onchange = () => {
        const r = st.rows[+inp.dataset.rowCount], others = st.rows.filter(x => !x.base && x !== r).reduce((n, x) => n + x.count, 0);
        r.count = Math.min(Math.max(1, parseInt(inp.value, 10) || 1), MAX_ITEMS - others), r.picked = r.picked.slice(0, r.count), draw();
      });
      body.querySelectorAll("[data-row-del]").forEach(b => b.onclick = () => { st.rows.splice(+b.dataset.rowDel, 1), draw(); });
      body.querySelectorAll("[data-unpick]").forEach(b => b.onclick = () => { const [i, id] = b.dataset.unpick.split(":"); st.rows[+i].picked = st.rows[+i].picked.filter(x => x !== id), draw(); });
      body.querySelectorAll("[data-row-pick]").forEach(b => b.onclick = () => openPicker(st.rows[+b.dataset.rowPick]));
      body.querySelector("[data-row-add]")?.addEventListener("click", () => openRowAdd());
      refresh();
    };
    const refresh = () => { save.disabled = !ready(); };
    function openPicker(row) {
      const room = row.count - row.picked.length, picked = new Set();
      const pb = modal(`<h3>자산 선택 · ${esc(row.product)}</h3><div class="body" style="max-height:56vh;overflow-y:auto" data-pl></div><div class="foot"><button class="btn" data-no>취소</button><button class="btn primary" data-ok disabled>적용</button></div>`, 440, 360);
      const drawP = () => {
        const list = candidates(row);
        pb.querySelector("[data-pl]").innerHTML = list.length ? list.map(a => `<label class="link-cand"><input type="checkbox" data-p="${a.id}"${picked.has(a.id) ? " checked" : ""}${!picked.has(a.id) && picked.size >= room ? " disabled" : ""}><span class="link-row-name">${esc(a.assetNo)}</span><span class="link-row-no">${isNew(a) ? "새로 배정" : "이미 배정됨"}</span></label>`).join("") : '<p class="muted">선택할 수 있는 자산이 없습니다.</p>';
        pb.querySelectorAll("[data-p]").forEach(c => c.onchange = () => { c.checked ? picked.add(c.dataset.p) : picked.delete(c.dataset.p), drawP(); });
        pb.querySelector("[data-ok]").disabled = !picked.size;
      };
      pb.querySelector("[data-no]").onclick = () => pb.remove();
      pb.querySelector("[data-ok]").onclick = () => { row.picked.push(...picked), pb.remove(), draw(); };
      drawP();
    }
    function openRowAdd() {
      const nr = { sub: "", product: "", count: 1, picked: [] };
      const pb = modal(`<h3>항목 추가</h3><div class="body" data-ra></div><div class="foot"><button class="btn" data-no>취소</button><button class="btn primary" data-ok disabled>추가</button></div>`, 420, 360);
      const drawR = () => {
        const dup = st.rows.some(r => itemKey(r) === itemKey(nr));
        pb.querySelector("[data-ra]").innerHTML = `<div class="tpl-row"><select data-s><option value="">소분류 선택</option>${subs().map(s => `<option${s === nr.sub ? " selected" : ""}>${esc(s)}</option>`).join("")}</select><select data-p${nr.sub ? "" : " disabled"}><option value="">품목명 선택</option>${(nr.sub ? productsOf(nr.sub) : []).map(p => `<option${p === nr.product ? " selected" : ""}>${esc(p)}</option>`).join("")}</select></div>${dup && nr.product ? '<p class="field-err">같은 품목이 이미 있습니다.</p>' : ""}`;
        pb.querySelector("[data-s]").onchange = e => { nr.sub = e.target.value, nr.product = "", drawR(); };
        pb.querySelector("[data-p]").onchange = e => { nr.product = e.target.value, drawR(); };
        pb.querySelector("[data-ok]").disabled = !nr.product || dup;
      };
      pb.querySelector("[data-no]").onclick = () => pb.remove();
      pb.querySelector("[data-ok]").onclick = () => { st.rows.push(nr), pb.remove(), draw(); };
      drawR();
    }
    back.querySelector("[data-cancel]").onclick = () => st.target || st.tplId ? confirmBox("작성을 중단하시겠습니까?", "지금까지 작성한 내용은 저장되지 않습니다.", () => back.remove()) : back.remove();
    save.onclick = () => {
      if (!ready()) return;
      const picked = st.rows.map(r => ({ ...r, assets: r.picked.map(assetById) }));
      // 저장 시점 재검증: 다른 대상 배정·폐기·삭제·연결 상한(Case 7-2)
      const stale = picked.flatMap(r => r.assets).filter(a => a.deleted_at || a.status === "disposed" || (!isNew(a) && assetTargetKey(a) !== targetKey(st.target)));
      if (stale.length) return toast("설정이 변경되었습니다. 잠시 후 다시 시도해주세요.");
      const base = picked[0].assets[0], others = picked.slice(1).flatMap(r => r.assets);
      if (window.AssetLinks.count(base.id) + others.filter(a => !window.AssetLinks.linked(base.id, a.id)).length > window.AssetLinks.MAX) return toast("설정이 변경되었습니다. 잠시 후 다시 시도해주세요.");
      const record = st.kind === "employee" ? { employee: st.target.value, worksite: null, since: st.date } : { employee: null, worksite: st.target.value, since: st.date };
      const log = (a, entry) => a._activityLog && a._activityLog.unshift({ d: new Date().toISOString().slice(0, 16).replace("T", " "), who: "dana", ...entry });
      [base, ...others].forEach(a => {
        if (isNew(a)) a.assignments = [{ ...record }], a.status === "stock" && (a.status = "assigned"), log(a, { script: "배정 관리: 신규 배정", target: record, before: "", after: window.fmtDate(st.date) });
      });
      others.forEach(a => {
        if (window.AssetLinks.add(base, a)) {
          log(base, { script: "자산 연결: 연결", before: "", after: `${a.product} · ${a.assetNo}` });
          log(a, { script: "자산 연결: 연결", before: "", after: `${base.product} · ${base.assetNo}` });
        }
      });
      back.remove(), toast("저장되었습니다."), onDone && onDone();
    };
    draw();
  }
  window.AssetTemplates = { openTemplateManager, openTemplateAssign, usableTemplates };
})();
