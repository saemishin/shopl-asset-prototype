// 템플릿 관리(Web_dc_28)와 템플릿으로 배정(Web_dc_29). 연결 기준은 Policy_15, 저장소는 window.AssetLinks.
(() => {
  const D = window.DATA;
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const MAX_ITEMS = 50;
  const WS_CODE = { 강남점: "GN-01", 판교점: "PG-01", 본사: "HQ-01", 역삼점: "YS-01" };
  const AVATAR_COLORS = ["#5b8def", "#8f6ef0", "#eb7f8b", "#3fb37f", "#e0a63c", "#4dabf7"];
  const MEMBERS = [{
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
    }];
  const avatarColor = name => { let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997; return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]; };
  const CLOSE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  D.templates ||= [
    { id: "T1", name: "노트북 지급 키트", base: { group: "전자기기류", sub: "노트북", product: "그램 16 (2024)" }, items: [{ group: "전자기기류", sub: "케이블·액세서리", product: "무선 마우스", count: 1 }] },
    { id: "T2", name: "매장 업무석 세트", base: { group: "가구류", sub: "책상", product: "데스커 1400" }, items: [{ group: "가구류", sub: "의자", product: "시디즈 T50", count: 2 }] }
  ];
  D.templates.forEach(t => [t.base, ...t.items].forEach(x => { x.group ||= (D.categories.find(c => c.sub === x.sub) || {}).group || ""; }));
  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg, t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:400", document.body.appendChild(t), setTimeout(() => t.remove(), 1800);
  }
  function modal(html, cls = "", z = 320) {
    const back = document.createElement("div");
    back.className = "modal-back", back.style.zIndex = z, back.innerHTML = `<div class="modal ${cls}">${html}</div>`;
    document.body.appendChild(back);
    return back;
  }
  function confirmBox(title, body, onOk, z = 380) {
    const cb = modal(`<h3>${title}</h3>${body ? `<div class="body" style="font-size:13px">${body}</div>` : ""}<div class="foot"><button class="btn" data-no>취소</button><button class="btn primary" data-ok>확인</button></div>`, "sm", z);
    cb.querySelector("[data-no]").onclick = () => cb.remove();
    cb.querySelector("[data-ok]").onclick = () => { cb.remove(), onOk(); };
  }
  const productsOf = sub => [...new Set(D.assets.filter(a => a.sub === sub && !a.deleted_at).map(a => a.product))].sort((p, q) => p.localeCompare(q, "ko"));
  const totalOf = t => 1 + t.items.reduce((n, x) => n + (+x.count || 0), 0);
  const itemKey = x => x.sub + "\u0000" + x.product;
  const thumbOf = a => {
    const ph = window.assetPhotos(a);
    return ph.length ? `<span class="thumb" style="background:${ph[a._primary || 0].color}"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="m21 16-5-5-9 8"/></svg></span>` : '<span class="thumb empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-4 4 3 4-4 5 4"/></svg></span>';
  };

  // ── 공통 입력: 분류 선택 Modal(Web_dc_13 15번) · 품목명 제안 Input · 대상 선택 Modal(Web_dc_23 5번) ──
  function categoryFieldHtml(x, attr) {
    return x.sub ? `<button type="button" class="perm-target-btn tpl-cat" ${attr}><span>${esc(x.group)} › ${esc(x.sub)}</span><span class="chev">›</span></button>` : `<button type="button" class="perm-target-btn tpl-cat" ${attr}><span class="muted">소분류 선택</span><span class="chev">›</span></button>`;
  }
  function pickCategory(x, onDone) {
    window.openAssetCategoryPickModal(D.categories, x.sub ? `${x.group}|${x.sub}` : null, v => {
      const [group, sub] = String(v).split("|");
      sub !== x.sub && (x.product = "", x._text = ""), x.group = group, x.sub = sub, onDone();
    });
    const backs = document.querySelectorAll(".modal-back");
    backs.length && (backs[backs.length - 1].style.zIndex = 390);
  }
  function productFieldHtml(x, attr) {
    return `<div class="tpl-prod"><input type="text" maxlength="50" placeholder="${x.sub ? "품목명 입력" : "소분류를 먼저 선택"}" value="${esc(x._text ?? x.product)}" ${attr}${x.sub ? "" : " disabled"}></div>`;
  }
  function wireProductInput(input, x, onPick, onType) {
    let menu = null;
    const close = () => { menu && (menu.remove(), menu = null); };
    const open = () => {
      close();
      const q = input.value.trim().toLowerCase(), list = productsOf(x.sub).filter(p => !q || p.toLowerCase().includes(q));
      menu = document.createElement("div");
      menu.className = "dropdown-menu tpl-prod-menu";
      menu.innerHTML = list.length ? list.map(p => `<button type="button" data-prod="${esc(p)}">${esc(p)}</button>`).join("") : '<p class="muted" style="padding:8px 12px;margin:0">등록된 품목이 없습니다.</p>';
      const r = input.getBoundingClientRect();
      menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${r.left}px;width:${r.width}px;max-height:220px;overflow-y:auto;z-index:400`;
      document.body.appendChild(menu);
      menu.querySelectorAll("[data-prod]").forEach(b => b.onmousedown = e => { e.preventDefault(), x.product = b.dataset.prod, x._text = undefined, close(), onPick(); });
    };
    input.addEventListener("focus", open);
    input.addEventListener("input", () => { x._text = input.value, x.product = productsOf(x.sub).includes(input.value.trim()) ? input.value.trim() : "", open(), onType(); });
    input.addEventListener("blur", () => setTimeout(close, 120));
  }
  function openTargetPicker(kind, initial, onApply) {
    let picked = initial, query = "";
    const isMember = kind === "employee",
      p = modal(`<h3>${isMember ? "구성원 선택" : "근무지 선택"}</h3><div class="body" style="display:flex;flex-direction:column;max-height:56vh"><input type="text" class="picker-search" placeholder="${isMember ? "이름/사번/휴대폰번호" : "근무지명/코드"}"><div data-list style="flex:1;min-height:0;overflow-y:auto;margin-top:8px"></div></div><div class="foot"><button class="btn" data-close>취소</button><button class="btn primary" data-ok${picked ? "" : " disabled"}>적용</button></div>`, "sm", 380),
      list = p.querySelector("[data-list]");
    const render = () => {
      const q = query.trim().toLowerCase();
      const rows = isMember ? MEMBERS.filter(m => !q || m.name.includes(q) || m.empNo.includes(q) || m.phone.includes(q)).map(m => `<label class="picker-member-row"><input type="radio" name="tp-target" value="${m.name}"${picked === m.name ? " checked" : ""}><span class="picker-avatar" style="background:${avatarColor(m.name)}">${m.name[0]}</span><span class="picker-member-info"><b>${m.name}</b><span>${m.team}</span></span></label>`)
        : Object.keys(WS_CODE).filter(n => !q || n.toLowerCase().includes(q) || WS_CODE[n].toLowerCase().includes(q)).map(n => `<label class="picker-member-row"><input type="radio" name="tp-target" value="${n}"${picked === n ? " checked" : ""}><span class="picker-member-info"><b>${n}</b><span>${WS_CODE[n]}</span></span></label>`);
      list.innerHTML = rows.join("") || '<p class="muted" style="padding:16px 0">결과가 없습니다.</p>';
      list.querySelectorAll('[name="tp-target"]').forEach(r => r.onchange = () => { picked = r.value, p.querySelector("[data-ok]").disabled = !1; });
    };
    p.querySelector(".picker-search").oninput = e => { query = e.target.value, render(); };
    p.querySelector("[data-close]").onclick = () => p.remove();
    p.querySelector("[data-ok]").onclick = () => { p.remove(), onApply(picked); };
    render();
  }

  // ── Web_dc_28 템플릿 관리 ──
  function openTemplateManager() {
    const back = modal(`<h3>템플릿 관리</h3><div class="body tpl-manage-body"><p class="tpl-manage-desc">함께 배정하고 연결할 자산 구성을 미리 만들어 관리합니다.</p><div class="tpl-manage-head"><button class="btn sm primary" data-tpl-add>+ 템플릿 추가</button></div><div class="link-list" data-tpl-list></div></div><div class="foot"><button class="btn" data-close>닫기</button></div>`, "tpl-modal");
    const draw = () => {
      const list = D.templates.slice().sort((p, q) => p.name.localeCompare(q.name, "ko"));
      back.querySelector("[data-tpl-list]").innerHTML = list.length ? list.map(t => `<div class="tpl-card"><div class="tpl-card-main"><b>${esc(t.name)}</b><span class="muted">전체 ${totalOf(t)}개</span><div class="tpl-card-items">${[t.base, ...t.items].map((x, i) => `<span class="tpl-chip${i ? "" : " base"}">${i ? "" : "기준 "}${esc(x.product)}${i ? ` ×${x.count}` : ""}</span>`).join("")}</div></div><div class="tpl-card-actions"><button class="btn sm" data-tpl-edit="${t.id}">수정</button><button class="btn sm" data-tpl-del="${t.id}">삭제</button></div></div>`).join("") : '<p class="muted tpl-empty">등록된 템플릿이 없습니다.</p>';
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
    const pick = x => ({ group: x.group, sub: x.sub, product: x.product, ...(x.count ? { count: x.count } : {}) });
    const original = tpl ? JSON.stringify({ name: tpl.name, base: pick(tpl.base), items: tpl.items.map(pick) }) : "";
    const draft = tpl ? JSON.parse(original) : { name: "", base: { group: "", sub: "", product: "" }, items: [] };
    const back = modal(`<h3>${tpl ? "템플릿 수정" : "템플릿 추가"}</h3><div class="body tpl-edit-body" data-ed></div><div class="foot"><button class="btn" data-cancel>취소</button><button class="btn primary" data-save disabled>저장</button></div>`, "tpl-modal wide", 340);
    const body = back.querySelector("[data-ed]"), save = back.querySelector("[data-save]");
    const errors = () => {
      const name = draft.name.trim(),
        rows = [draft.base, ...draft.items].filter(x => x.product),
        keys = rows.map(itemKey);
      return { dup: !!name && D.templates.some(t => t !== tpl && t.name.trim() === name), dupKeys: new Set(keys.filter((k, i) => keys.indexOf(k) !== i)), over: draft.items.reduce((n, x) => n + (+x.count || 0), 0) > MAX_ITEMS };
    };
    const valid = () => { const e = errors(); return draft.name.trim() && !e.dup && !e.over && !e.dupKeys.size && draft.base.product && draft.items.length && draft.items.every(x => x.product && +x.count >= 1); };
    const changed = () => tpl ? JSON.stringify({ name: draft.name, base: pick(draft.base), items: draft.items.map(pick) }) !== original : !!(draft.name.trim() || draft.base.sub || draft.items.length);
    const rowErr = x => {
      const e = errors();
      if (x._text && !x.product) return "등록된 품목에서 선택해주세요.";
      if (x.product && e.dupKeys.has(itemKey(x))) return "같은 품목이 이미 있습니다.";
      return "";
    };
    const rowHtml = (x, i) => `<div class="tpl-item${i < 0 ? " base" : ""}">
        <div class="tpl-item-fields">${categoryFieldHtml(x, `data-cat="${i}"`)}${productFieldHtml(x, `data-prod="${i}"`)}</div>
        ${i < 0 ? '<span class="tpl-fixed">1개</span>' : `<div class="tpl-stepper"><button type="button" data-dec="${i}"${x.count <= 1 ? " disabled" : ""}>−</button><span>${x.count}</span><button type="button" data-inc="${i}">＋</button></div><button type="button" class="tpl-x" data-del="${i}" aria-label="항목 삭제">${CLOSE_ICON}</button>`}
        <p class="field-err" data-row-err="${i}"${rowErr(x) ? "" : " hidden"}>${rowErr(x)}</p>
      </div>`;
    const draw = () => {
      const e = errors();
      body.innerHTML = `
        <div class="field"><label>템플릿 이름</label><input type="text" maxlength="30" data-name value="${esc(draft.name)}" placeholder="입력"><p class="field-err" data-name-err${e.dup ? "" : " hidden"}>동일한 명칭이 존재합니다.</p></div>
        <div class="tpl-section"><div class="tpl-section-head"><b>기준 자산</b><span class="muted">나머지 항목의 자산이 모두 이 자산에 연결됩니다.</span></div>${rowHtml(draft.base, -1)}</div>
        <div class="tpl-section"><div class="tpl-section-head"><b>연결할 항목</b><span class="muted">기준 자산 제외 최대 ${MAX_ITEMS}개</span></div>
          ${draft.items.length ? draft.items.map(rowHtml).join("") : '<p class="muted tpl-empty">항목을 추가해주세요.</p>'}
          <p class="field-err" data-over-err${e.over ? "" : " hidden"}>기준 자산을 제외한 필요 개수는 최대 ${MAX_ITEMS}개입니다.</p>
          <button type="button" class="tpl-add-row" data-add>+ 항목 추가</button></div>`;
      const at = i => i < 0 ? draft.base : draft.items[i];
      body.querySelector("[data-name]").oninput = ev => { draft.name = ev.target.value, refresh(); };
      body.querySelectorAll("[data-cat]").forEach(b => b.onclick = () => pickCategory(at(+b.dataset.cat), draw));
      body.querySelectorAll("[data-prod]").forEach(inp => wireProductInput(inp, at(+inp.dataset.prod), draw, refresh));
      body.querySelectorAll("[data-dec]").forEach(b => b.onclick = () => { draft.items[+b.dataset.dec].count--, draw(); });
      body.querySelectorAll("[data-inc]").forEach(b => b.onclick = () => { draft.items[+b.dataset.inc].count++, draw(); });
      body.querySelectorAll("[data-del]").forEach(b => b.onclick = () => { draft.items.splice(+b.dataset.del, 1), draw(); });
      body.querySelector("[data-add]").onclick = () => { draft.items.push({ group: "", sub: "", product: "", count: 1 }), draw(); };
      refresh();
    };
    const refresh = () => {
      save.disabled = !valid() || !changed();
      const e = errors();
      body.querySelector("[data-name-err]").hidden = !e.dup;
      body.querySelector("[data-over-err]").hidden = !e.over;
      body.querySelectorAll("[data-row-err]").forEach(p => { const i = +p.dataset.rowErr, msg = rowErr(i < 0 ? draft.base : draft.items[i]); p.textContent = msg, p.hidden = !msg; });
    };
    back.querySelector("[data-cancel]").onclick = () => changed() ? confirmBox("작성을 중단하시겠습니까?", "지금까지 작성한 내용은 저장되지 않습니다.", () => back.remove()) : back.remove();
    save.onclick = () => {
      if (!valid()) return;
      const data = { name: draft.name.trim(), base: pick(draft.base), items: draft.items.map(x => ({ ...pick(x), count: +x.count })) };
      tpl ? Object.assign(tpl, data) : D.templates.push({ id: "T" + Date.now(), ...data });
      back.remove(), toast("저장되었습니다."), onSaved();
    };
    draw();
  }

  // ── Web_dc_29 템플릿으로 배정 ──
  const targetKey = t => t ? (t.type === "employee" ? "e:" : "w:") + t.value : null;
  const assetTargetKey = a => { const r = (a.assignments || [])[0]; return r ? (r.employee ? "e:" + r.employee : "w:" + r.worksite) : null; };
  function usableTemplates() {
    if (window.hasPrototypeAssetManagePermission()) return D.templates;
    const ok = sub => D.assets.some(a => a.sub === sub && window.AssetAccess.canState(a));
    return D.templates.filter(t => [t.base, ...t.items].every(x => ok(x.sub)));
  }
  function openTemplateAssign(onDone, qaDemo = false) {
    const today = "2026-09-04"; // 프로토타입 기준일(다른 화면의 TODAY와 같음)
    const st = { kind: "", target: { employee: null, worksite: null }, tplId: "", date: today, rows: [] };
    const back = modal(`<h3>템플릿으로 배정</h3><div class="body tpl-edit-body" data-ta></div><div class="foot"><button class="btn" data-cancel>취소</button><button class="btn primary" data-save disabled>저장</button></div>`, "tpl-modal wide");
    const body = back.querySelector("[data-ta]"), save = back.querySelector("[data-save]");
    const curTarget = () => st.kind && st.target[st.kind] ? { type: st.kind, value: st.target[st.kind] } : null;
    const assetById = id => D.assets.find(a => a.id === id);
    const allPicked = () => st.rows.flatMap(r => r.picked);
    const isNew = a => !assetTargetKey(a);
    const candidates = row => D.assets.filter(a => !a.deleted_at && a.status !== "disposed" && a.sub === row.sub && a.product === row.product && window.AssetAccess.canState(a) && (isNew(a) ? a.status === "stock" : assetTargetKey(a) === targetKey(curTarget())) && !allPicked().includes(a.id)).sort((p, q) => String(p.assetNo).localeCompare(String(q.assetNo)));
    const anyNew = () => allPicked().some(id => isNew(assetById(id)));
    const ready = () => curTarget() && st.tplId && st.rows.length > 1 && st.rows.every(r => r.picked.length === r.count) && (!anyNew() || st.date);
    const loadTemplate = () => {
      const t = D.templates.find(x => x.id === st.tplId);
      st.rows = t ? [{ ...t.base, count: 1, base: true, picked: [] }, ...t.items.map(x => ({ ...x, picked: [] }))] : [];
    };
    const clearPicked = () => st.rows.forEach(x => x.picked = []);
    const targetField = k => {
      const v = st.target[k];
      return v ? `<div class="aa-target-selected" data-target-open>${k === "employee" ? `<span class="picker-avatar sm" style="background:${avatarColor(v)}">${v[0]}</span>` : ""}<span class="perm-chip">${esc(v)}</span><button type="button" class="aa-target-x" data-target-clear aria-label="선택 해제">${CLOSE_ICON}</button></div>` : '<button type="button" class="perm-target-btn" data-target-open><span class="muted">선택</span><span class="chev">›</span></button>';
    };
    const slotHtml = (r, i) => {
      const full = r.picked.length === r.count;
      return `<div class="tpl-slot${full ? " full" : ""}">
        <div class="tpl-slot-main">
          <div class="tpl-slot-title">${r.base ? '<span class="tpl-chip base">기준</span>' : ""}<b>${esc(r.product)}</b></div>
          <div class="tpl-slot-need">${esc(r.group)} › ${esc(r.sub)} · ${r.count}개 필요 · 선택 <b>${r.picked.length}</b>/${r.count}</div>
        </div>
        <div class="tpl-slot-actions">
          ${r.base ? "" : `<div class="tpl-stepper"><button type="button" data-dec="${i}"${r.count <= 1 ? " disabled" : ""}>−</button><span>${r.count}</span><button type="button" data-inc="${i}">＋</button></div>`}
          ${full ? "" : `<button type="button" class="btn sm" data-row-pick="${i}"${curTarget() ? "" : " disabled"}>자산 선택</button>`}
          ${r.base ? "" : `<button type="button" class="tpl-x" data-row-del="${i}" aria-label="항목 제외">${CLOSE_ICON}</button>`}
        </div>
        ${r.picked.length ? `<div class="tpl-picked">${r.picked.map(id => { const a = assetById(id); return `<span class="tpl-picked-chip">${thumbOf(a)}<span>${esc(a.assetNo)}</span><span class="badge ${isNew(a) ? "stock" : "assigned"}">${isNew(a) ? "새로 배정" : "이미 배정됨"}</span><button type="button" data-unpick="${i}:${id}" aria-label="선택 해제">${CLOSE_ICON}</button></span>`; }).join("")}</div>` : ""}
      </div>`;
    };
    const draw = () => {
      const tpls = usableTemplates().slice().sort((p, q) => p.name.localeCompare(q.name, "ko"));
      body.innerHTML = `
        <div class="field"><label>배정 대상</label>
          <label class="radio-row"><input type="radio" name="ta-kind" value="employee"${st.kind === "employee" ? " checked" : ""}><span>구성원</span></label>
          ${st.kind === "employee" ? `<div class="perm-target-wrap">${targetField("employee")}</div>` : ""}
          <label class="radio-row"><input type="radio" name="ta-kind" value="worksite"${st.kind === "worksite" ? " checked" : ""}><span>근무지</span></label>
          ${st.kind === "worksite" ? `<div class="perm-target-wrap">${targetField("worksite")}</div>` : ""}</div>
        <div class="field"><label>템플릿</label><select data-tpl><option value="">템플릿 선택</option>${tpls.map(t => `<option value="${t.id}"${t.id === st.tplId ? " selected" : ""}>${esc(t.name)}</option>`).join("")}</select></div>
        <div class="field"><label>배정일</label><input type="date" data-date value="${st.date}" max="${today}"><p class="field-help">새로 배정하는 자산에만 적용됩니다.</p></div>
        ${st.rows.length ? `<div class="tpl-section"><div class="tpl-section-head"><b>항목별 자산 선택</b><span class="muted">항목마다 필요한 개수만큼 자산을 선택해주세요.</span></div>${st.rows.map(slotHtml).join("")}<button type="button" class="tpl-add-row" data-row-add>+ 항목 추가</button></div>` : ""}`;
      body.querySelectorAll('[name="ta-kind"]').forEach(r => r.onchange = () => { st.kind = r.value, clearPicked(), draw(); });
      body.querySelectorAll("[data-target-open]").forEach(el => el.onclick = e => {
        if (e.target.closest("[data-target-clear]")) return;
        openTargetPicker(st.kind, st.target[st.kind], v => { v !== st.target[st.kind] && clearPicked(), st.target[st.kind] = v, draw(); });
      });
      body.querySelector("[data-target-clear]")?.addEventListener("click", () => { st.target[st.kind] = null, clearPicked(), draw(); });
      body.querySelector("[data-tpl]").onchange = e => { st.tplId = e.target.value, loadTemplate(), draw(); };
      body.querySelector("[data-date]").onchange = e => { st.date = e.target.value, refresh(); };
      body.querySelectorAll("[data-dec]").forEach(b => b.onclick = () => { const r = st.rows[+b.dataset.dec]; r.count--, r.picked = r.picked.slice(0, r.count), draw(); });
      body.querySelectorAll("[data-inc]").forEach(b => b.onclick = () => { const others = st.rows.filter(x => !x.base).reduce((n, x) => n + x.count, 0); others < MAX_ITEMS && st.rows[+b.dataset.inc].count++, draw(); });
      body.querySelectorAll("[data-row-del]").forEach(b => b.onclick = () => { st.rows.splice(+b.dataset.rowDel, 1), draw(); });
      body.querySelectorAll("[data-unpick]").forEach(b => b.onclick = () => { const [i, id] = b.dataset.unpick.split(":"); st.rows[+i].picked = st.rows[+i].picked.filter(x => x !== id), draw(); });
      body.querySelectorAll("[data-row-pick]").forEach(b => b.onclick = () => openPicker(st.rows[+b.dataset.rowPick]));
      body.querySelector("[data-row-add]")?.addEventListener("click", openRowAdd);
      refresh();
    };
    const refresh = () => { save.disabled = !ready(); };
    function openPicker(row) {
      const room = row.count - row.picked.length, picked = new Set();
      let q = "";
      const pb = modal(`<h3>자산 선택</h3><div class="body" style="display:flex;flex-direction:column;max-height:60vh"><p class="link-target">${esc(row.group)} › ${esc(row.sub)} · <b>${esc(row.product)}</b> · 남은 ${room}개</p><input type="text" class="picker-search" placeholder="고유관리번호" data-q><div class="link-list" data-pl style="flex:1;min-height:0;overflow-y:auto;margin-top:8px"></div></div><div class="foot"><button class="btn" data-no>취소</button><button class="btn primary" data-ok disabled>적용</button></div>`, "", 360);
      pb.querySelector(".modal").style.width = "460px";
      const drawP = () => {
        const all = candidates(row), list = all.filter(a => !q || String(a.assetNo).toLowerCase().includes(q));
        pb.querySelector("[data-pl]").innerHTML = !all.length ? '<p class="muted">선택할 수 있는 자산이 없습니다.</p>' : !list.length ? '<p class="muted">결과가 없습니다.</p>' : list.map(a => `<label class="link-cand"><input type="checkbox" data-p="${a.id}"${picked.has(a.id) ? " checked" : ""}${!picked.has(a.id) && picked.size >= room ? " disabled" : ""}>${thumbOf(a)}<span class="link-row-name">${esc(a.assetNo)}</span><span class="badge ${isNew(a) ? "stock" : "assigned"}">${isNew(a) ? "새로 배정" : "이미 배정됨"}</span></label>`).join("");
        pb.querySelectorAll("[data-p]").forEach(c => c.onchange = () => { c.checked ? picked.add(c.dataset.p) : picked.delete(c.dataset.p), drawP(); });
        pb.querySelector("[data-ok]").disabled = !picked.size;
      };
      pb.querySelector("[data-q]").oninput = e => { q = e.target.value.trim().toLowerCase(), drawP(); };
      pb.querySelector("[data-no]").onclick = () => pb.remove();
      pb.querySelector("[data-ok]").onclick = () => { row.picked.push(...picked), pb.remove(), draw(); };
      drawP();
    }
    function openRowAdd() {
      const nr = { group: "", sub: "", product: "", count: 1, picked: [] };
      const pb = modal(`<h3>항목 추가</h3><div class="body" data-ra></div><div class="foot"><button class="btn" data-no>취소</button><button class="btn primary" data-ok disabled>추가</button></div>`, "", 360);
      pb.querySelector(".modal").style.width = "460px";
      const dup = () => !!nr.product && st.rows.some(r => itemKey(r) === itemKey(nr));
      const drawR = () => {
        pb.querySelector("[data-ra]").innerHTML = `<div class="tpl-item-fields">${categoryFieldHtml(nr, "data-c")}${productFieldHtml(nr, "data-p")}</div><p class="field-err" data-err hidden></p>`;
        pb.querySelector("[data-c]").onclick = () => pickCategory(nr, drawR);
        wireProductInput(pb.querySelector("[data-p]"), nr, drawR, refreshR);
        refreshR();
      };
      const refreshR = () => {
        const err = pb.querySelector("[data-err]"), msg = nr._text && !nr.product ? "등록된 품목에서 선택해주세요." : dup() ? "같은 품목이 이미 있습니다." : "";
        err.textContent = msg, err.hidden = !msg, pb.querySelector("[data-ok]").disabled = !nr.product || dup();
      };
      pb.querySelector("[data-no]").onclick = () => pb.remove();
      pb.querySelector("[data-ok]").onclick = () => { delete nr._text, st.rows.push(nr), pb.remove(), draw(); };
      drawR();
    }
    back.querySelector("[data-cancel]").onclick = () => st.kind || st.tplId ? confirmBox("작성을 중단하시겠습니까?", "지금까지 작성한 내용은 저장되지 않습니다.", () => back.remove()) : back.remove();
    save.onclick = () => {
      if (!ready()) return;
      const target = curTarget(), picked = st.rows.map(r => r.picked.map(assetById));
      // 저장 시점 재검증: 다른 대상 배정·폐기·삭제·연결 상한(Case 7-2)
      const stale = picked.flat().filter(a => a.deleted_at || a.status === "disposed" || (!isNew(a) && assetTargetKey(a) !== targetKey(target)));
      if (stale.length) return toast("설정이 변경되었습니다. 잠시 후 다시 시도해주세요.");
      const base = picked[0][0], others = picked.slice(1).flat();
      if (window.AssetLinks.count(base.id) + others.filter(a => !window.AssetLinks.linked(base.id, a.id)).length > window.AssetLinks.MAX) return toast("설정이 변경되었습니다. 잠시 후 다시 시도해주세요.");
      const record = target.type === "employee" ? { employee: target.value, worksite: null, since: st.date } : { employee: null, worksite: target.value, since: st.date };
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
    if (qaDemo) {
      const t=usableTemplates().slice().sort((a,b)=>a.name.localeCompare(b.name,'ko'))[0];
      if(t){st.kind='employee';st.target.employee='김민수';st.tplId=t.id;loadTemplate();st.rows.forEach(row=>row.picked=candidates(row).slice(0,row.count).map(a=>a.id));}
    }
    draw();
  }
  window.AssetTemplates = { openTemplateManager, openTemplateAssign, usableTemplates };
})();
