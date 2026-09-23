/* 자산 등록 팝업 — 현황/분류 화면 공용(아직 러프한 프로토타입: 저장은 토스트만, 실제 데이터 반영 없음).
   assets.js의 "자산 추가" 버튼과 category.js의 소분류별 빈 자산 목록 [자산 추가] 버튼이 이 하나를 같이 씀. */
(function () {
  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300;box-shadow:0 8px 24px rgba(0,0,0,.25)";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  }
  const CLOSE_ICON_SM = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>`;
  const TRASH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M9.5 7l.7 13a1 1 0 0 0 1 1h5.6a1 1 0 0 0 1-1l.7-13"/></svg>`;
  const TAG_COLORS = [
    { fg: "#3461c9", bg: "#eaf1ff" },
    { fg: "#6b3fd4", bg: "#f1ecff" },
    { fg: "#c23c56", bg: "#fdecef" },
    { fg: "#1f8f5f", bg: "#e8f8f0" },
    { fg: "#b5790a", bg: "#fdf3e0" },
    { fg: "#1f8fae", bg: "#e6f6fa" },
  ];
  function tagColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
    return TAG_COLORS[Math.abs(h) % TAG_COLORS.length];
  }

  // 태그 관리 — 태그는 구조설계안 §5.3상 별도 엔티티 없이 자산의 문자열 리스트지만, 오타·변형이 계속 쌓이기만 하고
  // 정리할 수 없는 문제 때문에 window.DATA.tags를 마스터 목록으로 두고 이 화면에서만 추가/이름변경/삭제를 관리함.
  // 분류 관리 모달과 동일한 draft 편집 모델: 변경은 [저장]을 눌러야 실제 데이터(마스터 목록 + 각 자산의 labels)에 반영됨.
  function openTagManageModal(onSaved) {
    const master = (window.DATA && window.DATA.tags) || [];
    let draft = master.map(t => ({ name: t, orig: t }));

    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal sm">
        <h3>태그 관리</h3>
        <div class="body">
          <div class="tag-manage-add">
            <input type="text" class="cat-manage-input" data-tm-input placeholder="입력" maxlength="20">
            <button type="button" class="btn primary" data-tm-add>+ 추가</button>
          </div>
          <p class="field-err" data-tm-add-err hidden>동일한 명칭이 존재합니다.</p>
          <div class="tag-manage-list" data-tm-list style="margin-top:14px"></div>
          <p class="field-err" data-tm-list-err hidden>동일한 명칭이 존재합니다.</p>
        </div>
        <div class="foot">
          <button type="button" class="btn" data-tm-cancel>취소</button>
          <button type="button" class="btn primary" data-tm-save disabled>저장</button>
        </div>
      </div>`;
    document.body.appendChild(back);

    const listEl = back.querySelector("[data-tm-list]");
    const listErr = back.querySelector("[data-tm-list-err]");
    const addInput = back.querySelector("[data-tm-input]");
    const addBtn = back.querySelector("[data-tm-add]");
    const addErr = back.querySelector("[data-tm-add-err]");
    const saveBtn = back.querySelector("[data-tm-save]");

    // 태그명은 구조설계안상 대소문자 구분이라 중복 판정도 trim 후 대소문자 그대로 정확히 일치할 때만
    function dupNameSet() {
      const counts = {};
      draft.forEach(t => { const n = t.name.trim(); if (n) counts[n] = (counts[n] || 0) + 1; });
      return new Set(Object.keys(counts).filter(n => counts[n] > 1));
    }
    // "변경 있음" 여부는 플래그가 아니라 원본(master)과의 실제 내용 비교로 판정 —
    // 추가했다가 도로 지우는 것처럼 순가감이 상쇄돼 원래 상태로 돌아왔으면 저장 비활성화가 맞음
    function isDirty() {
      const current = [...new Set(draft.map(t => t.name.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
      const orig = [...master].sort((a, b) => a.localeCompare(b, "ko"));
      if (current.length !== orig.length) return true;
      return current.some((v, i) => v !== orig[i]);
    }
    function updateValidity() {
      const dups = dupNameSet();
      listEl.querySelectorAll("[data-tm-rename]").forEach(inp => {
        inp.classList.toggle("has-err", dups.has(inp.value.trim()));
      });
      listErr.hidden = dups.size === 0;
      const addDup = draft.some(t => t.name.trim() === addInput.value.trim());
      addInput.classList.toggle("has-err", !!addInput.value.trim() && addDup);
      addErr.hidden = !(addInput.value.trim() && addDup);
      addBtn.disabled = !!addInput.value.trim() && addDup;
      saveBtn.disabled = !isDirty() || dups.size > 0;
    }
    function renderList() {
      listEl.innerHTML = draft.length ? draft.map((t, i) => `
        <div class="cat-manage-row">
          <input type="text" class="cat-manage-name-input" data-tm-rename="${i}" value="${t.name}" maxlength="20">
          <div class="cat-manage-row-acts">
            <button type="button" class="cat-manage-icon" data-tm-del="${i}" aria-label="삭제"
              data-tip="삭제 시 이 태그를 사용 중인 자산에서 모두 삭제됩니다.">${TRASH_ICON}</button>
          </div>
        </div>`).join("") : `<p class="tag-manage-empty">등록된 태그가 없습니다.</p>`;
      updateValidity();
    }
    renderList();

    function addRow() {
      const name = addInput.value.trim().slice(0, 20);
      if (!name || draft.some(t => t.name.trim() === name)) { addInput.focus(); return; }
      draft.unshift({ name, orig: null });
      addInput.value = "";
      renderList();
    }
    addBtn.onclick = addRow;
    addInput.addEventListener("input", updateValidity);
    addInput.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); addRow(); } });

    listEl.addEventListener("input", e => {
      const r = e.target.closest("[data-tm-rename]");
      if (r) { draft[+r.dataset.tmRename].name = e.target.value; updateValidity(); }
    });
    listEl.addEventListener("click", e => {
      const d = e.target.closest("[data-tm-del]");
      if (d) { draft.splice(+d.dataset.tmDel, 1); renderList(); }
    });

    back.querySelector("[data-tm-cancel]").onclick = () => back.remove();
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });

    saveBtn.onclick = () => {
      if (!isDirty() || dupNameSet().size > 0) return;
      const finalNames = [...new Set(draft.map(t => t.name.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko"));
      const remainingOrigs = new Set(draft.filter(t => t.orig).map(t => t.orig));
      const deletedOrigs = master.filter(t => !remainingOrigs.has(t));
      const renamed = draft
        .filter(t => t.orig && t.orig !== t.name.trim())
        .map(t => ({ from: t.orig, to: t.name.trim() }));

      (window.DATA.assets || []).forEach(a => {
        if (!a.labels || !a.labels.length) return;
        a.labels = a.labels
          .filter(l => !deletedOrigs.includes(l))
          .map(l => { const r = renamed.find(rn => rn.from === l); return r ? r.to : l; });
      });
      master.length = 0;
      master.push(...finalNames);

      back.remove();
      toast("저장되었습니다.");
      if (onSaved) onSaved({ renamed, deletedOrigs });
    };

    return back;
  }

  // 소분류 선택 모달 — 검색 + 대분류/소분류 트리, 단일 선택, 푸터 [취소]/[적용]. 필터 모달의 분류 트리 구조를 단일 선택용으로 단순화.
  function openCategoryPickModal(categories, currentValue, onApply) {
    let selected = currentValue;
    let query = "";

    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal sm">
        <h3>소분류</h3>
        <div class="body">
          <input type="text" class="picker-search" data-cp-search placeholder="검색" autocomplete="off">
          <div class="catpick-list" data-cp-list></div>
        </div>
        <div class="foot">
          <button type="button" class="btn" data-cp-cancel>취소</button>
          <button type="button" class="btn primary" data-cp-apply>적용</button>
        </div>
      </div>`;
    document.body.appendChild(back);

    const listEl = back.querySelector("[data-cp-list]");
    const searchInput = back.querySelector("[data-cp-search]");

    function groupsOf() {
      const m = new Map();
      categories.forEach(c => { if (!m.has(c.group)) m.set(c.group, []); m.get(c.group).push(c.sub); });
      return m;
    }
    function renderList() {
      const q = query.trim().toLowerCase();
      let html = "";
      groupsOf().forEach((subs, g) => {
        const groupMatches = !q || g.toLowerCase().includes(q);
        const filtered = subs.filter(s => groupMatches || s.toLowerCase().includes(q));
        if (!filtered.length) return;
        html += `<div class="catpick-group">
          <div class="catpick-group-name">${g}</div>
          ${filtered.map(s => {
            const v = `${g}|${s}`;
            return `<button type="button" class="catpick-row${selected === v ? " active" : ""}" data-v="${v}">${s}</button>`;
          }).join("")}
        </div>`;
      });
      listEl.innerHTML = html || `<p class="tag-manage-empty">결과가 없습니다.</p>`;
      listEl.querySelectorAll("[data-v]").forEach(b => b.onclick = () => { selected = b.dataset.v; renderList(); });
    }
    renderList();

    searchInput.addEventListener("input", () => { query = searchInput.value; renderList(); });
    back.querySelector("[data-cp-cancel]").onclick = () => back.remove();
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-cp-apply]").onclick = () => { back.remove(); onApply(selected); };

    return back;
  }

  // 자산 수정(prefill) 시 유효기한 외 구매일·제조연월일 등의 "미래 아님" 검증 기준으로 씀 — 이 앱 전체가 쓰는
  // 고정 데모 날짜(2026-09-04)와 동일하게 맞춤(detail.js의 TODAY/todayStr과 동일 값)
  const TODAY = new Date("2026-09-04");
  function todayStr() {
    const p = n => String(n).padStart(2, "0");
    return `${TODAY.getFullYear()}-${p(TODAY.getMonth() + 1)}-${p(TODAY.getDate())}`;
  }

  // 소분류 이동 트리 — 자산 수정에서 소분류를 바꿀 때 사용(자산 삭제와 마찬가지로 detail.js의 "···" 메뉴에
  // 있던 "소분류 이동"을 여기 자산 수정 폼으로 흡수). 현재 소분류는 설명 없이 비활성화만(재배정 모달이 현재
  // 대상을 그냥 빼는 것과 같은 원칙), 다른 자산 유형의 소분류는 구조설계안 6장 제약이라 비활성화+툴팁으로 안내
  function openCategoryMoveModal(categories, currentGroup, currentSub, currentType, onApply) {
    let picked = null;
    const groupMap = {}, order = [];
    categories.forEach(c => {
      if (!groupMap[c.group]) { groupMap[c.group] = []; order.push(c.group); }
      groupMap[c.group].push(c);
    });
    const groups = order.map(group => ({ group, subs: groupMap[group] }));

    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal picker-modal">
        <h3>소분류</h3>
        <div class="body" data-body></div>
        <div class="foot">
          <button type="button" class="btn" data-cancel>취소</button>
          <button type="button" class="btn primary" data-apply disabled>적용</button>
        </div>
      </div>`;
    document.body.appendChild(back);
    const body = back.querySelector("[data-body]");
    const applyBtn = back.querySelector("[data-apply]");

    function draw() {
      body.innerHTML = groups.map(g => `
        <div class="submove-group">
          <div class="submove-group-name">${g.group}</div>
          ${g.subs.map(c => {
            const isCurrent = c.group === currentGroup && c.sub === currentSub;
            const isOtherType = c.type !== currentType;
            const disabled = isCurrent || isOtherType;
            const tip = !isCurrent && isOtherType ? "다른 자산 유형으로는 이동할 수 없습니다." : "";
            const checked = picked && picked.group === g.group && picked.sub === c.sub;
            return `
            <label class="radio-row${disabled ? " is-disabled" : ""}"${tip ? ` data-tip="${tip}"` : ""}>
              <input type="radio" name="catmove" data-group="${g.group}" data-sub="${c.sub}"${disabled ? " disabled" : ""}${checked ? " checked" : ""}>
              <span>${c.sub}</span>
            </label>`;
          }).join("")}
        </div>`).join("");
      body.querySelectorAll('input[name="catmove"]').forEach(r => r.onchange = () => {
        picked = { group: r.dataset.group, sub: r.dataset.sub };
        applyBtn.disabled = false;
      });
    }
    draw();

    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelector("[data-cancel]").onclick = () => back.remove();
    applyBtn.onclick = () => { if (!picked) return; back.remove(); onApply(picked); };
  }

  window.openAssetAddModal = function (opts) {
    opts = opts || {};
    const categories = (window.DATA && window.DATA.categories) || [];
    const preselectValue = opts.group && opts.sub ? `${opts.group}|${opts.sub}` : null;
    const findCat = v => { const [g, s] = (v || "").split("|"); return categories.find(c => c.group === g && c.sub === s); };
    let type = (findCat(preselectValue) || {}).type || "individual";

    // 배정일 수정(detail.js)과 동일한 마스킹 정책(YYYY.MM.DD, 8자리 숫자) — 단, 유효기한은 만료일 성격상 미래 날짜도 허용
    const IC_CAL = `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>`;
    function dateFieldHtml() {
      return `
        <div class="dfield">
          <input type="text" inputmode="numeric" data-dtext placeholder="YYYY.MM.DD" maxlength="10">
          <span class="dfield-pick">${IC_CAL}<input type="date" data-dnative tabindex="-1"></span>
        </div>`;
    }
    // maxIso가 있으면(구매일·제조연월일) 미래 날짜 불가, 없으면(유효기한) 만료일 성격상 미래 날짜도 허용.
    // getValue()는 8자리를 다 채운 유효한 날짜면 ISO, 완전히 비어있으면 "", 불완전/범위밖이면 null을 돌려줌
    function wireDateField(scope, maxIso) {
      const text = scope.querySelector("[data-dtext]");
      const native = scope.querySelector("[data-dnative]");
      if (maxIso) native.max = maxIso;
      const digitsOf = v => v.replace(/\D/g, "").slice(0, 8);
      const format = d => d.length > 6 ? `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6)}`
                         : d.length > 4 ? `${d.slice(0, 4)}.${d.slice(4)}` : d;
      const getValue = () => {
        const d = digitsOf(text.value);
        if (!d.length) return "";
        if (d.length !== 8) return null;
        const y = d.slice(0, 4), m = d.slice(4, 6), dd = d.slice(6, 8);
        if (+m < 1 || +m > 12 || +dd < 1 || +dd > 31) return null;
        const iso = `${y}-${m}-${dd}`;
        return maxIso && iso > maxIso ? null : iso;
      };
      text.addEventListener("input", () => { text.value = format(digitsOf(text.value)); });
      native.addEventListener("change", () => { if (native.value) text.value = native.value.replace(/-/g, "."); });
      return getValue;
    }

    const tags = [];

    const back = document.createElement("div");
    back.className = "modal-back";
    back.innerHTML = `
      <div class="modal scroll-body">
        <h3>${opts.asset ? "자산 수정" : "자산 추가"}</h3>
        <div class="body">
          <div class="field"><label>소분류 <span class="req">*</span></label>
            <div class="tag-input-wrap" id="areg-catwrap" style="cursor:pointer">
              <span id="areg-cat-display" style="flex:1;font-size:12.5px">선택</span>
            </div>
          </div>
          <div class="field" id="areg-name-field"><label>품목명 <span class="req">*</span></label><input type="text" id="areg-name" placeholder="입력" maxlength="50" autocomplete="off"></div>
          <div class="field" id="areg-assetno"><label>고유관리번호 <span class="req">*</span></label><input type="text" id="areg-assetno-input" placeholder="입력" maxlength="30">
            <p class="field-err" data-assetno-err hidden>동일한 명칭이 존재합니다.</p>
          </div>
          <div class="field" id="areg-totalqty-field"><label>총 수량 <span class="req">*</span></label><input type="text" inputmode="numeric" id="areg-totalqty-input" placeholder="입력" maxlength="6"></div>
          <div class="field" id="areg-expiry-field"><label>유효기한</label>${dateFieldHtml()}</div>
          <div class="field" id="areg-tag-field">
            <div class="field-label-row">
              <label>태그</label>
              <button type="button" class="btn sm" id="areg-tag-manage">태그 관리</button>
            </div>
            <div class="tag-input-wrap" id="areg-tagwrap">
              <div class="tag-chips" data-chips></div>
              <input type="text" data-taginput placeholder="검색" autocomplete="off">
            </div>
          </div>
          <div class="field" id="areg-serial-field"><label>S/N</label><input type="text" id="areg-serial-input" placeholder="입력" maxlength="40"></div>
          <div class="field" id="areg-imei-field"><label>IMEI</label><input type="text" id="areg-imei-input" placeholder="입력" maxlength="40"></div>
          <div class="field" id="areg-manufactured-field"><label>제조연월일</label>${dateFieldHtml()}</div>
          <div class="field" id="areg-purchasedate-field"><label>구매일</label>${dateFieldHtml()}</div>
          <div class="field" id="areg-purchaseprice-field"><label>구매가격</label><input type="text" inputmode="numeric" id="areg-purchaseprice-input" placeholder="입력" maxlength="12"></div>
          <div class="field" id="areg-note-field"><label>메모</label><textarea id="areg-note-input" placeholder="입력" maxlength="500"></textarea></div>
        </div>
        <div class="foot">
          <button type="button" class="btn" data-close>취소</button>
          <button type="button" class="btn primary" id="areg-save" disabled>저장</button>
        </div>
      </div>`;
    back.addEventListener("click", e => { if (e.target === back) back.remove(); });
    back.querySelectorAll("[data-close]").forEach(b => b.onclick = () => { if (!b.disabled) back.remove(); });
    document.body.appendChild(back);

    const nameField = back.querySelector("#areg-name-field");
    const nameInput = back.querySelector("#areg-name");
    const assetNoField = back.querySelector("#areg-assetno");
    const assetNoInput = back.querySelector("#areg-assetno-input");
    const assetNoErr = back.querySelector("[data-assetno-err]");
    const totalQtyField = back.querySelector("#areg-totalqty-field");
    const totalQtyInput = back.querySelector("#areg-totalqty-input");
    const tagFieldEl = back.querySelector("#areg-tag-field");
    const expiryField = back.querySelector("#areg-expiry-field");
    const serialField = back.querySelector("#areg-serial-field");
    const serialInput = back.querySelector("#areg-serial-input");
    const imeiField = back.querySelector("#areg-imei-field");
    const imeiInput = back.querySelector("#areg-imei-input");
    const manufacturedField = back.querySelector("#areg-manufactured-field");
    const purchaseDateField = back.querySelector("#areg-purchasedate-field");
    const purchasePriceField = back.querySelector("#areg-purchaseprice-field");
    const purchasePriceInput = back.querySelector("#areg-purchaseprice-input");
    const noteField = back.querySelector("#areg-note-field");
    const noteInput = back.querySelector("#areg-note-input");
    const saveBtn = back.querySelector("#areg-save");

    const getExpiry = wireDateField(expiryField);
    const getManufactured = wireDateField(manufacturedField, todayStr());
    const getPurchaseDate = wireDateField(purchaseDateField, todayStr());

    // 고유관리번호는 QR 라벨 파일명의 식별키로 그대로 쓰여서, 파일명에 부적합한 문자가 섞이지 않도록 영문·숫자·하이픈·언더스코어만 허용.
    // 수정 모드에선 자기 자신은 중복 검사에서 제외(안 그러면 기존 값 그대로 저장하려 해도 항상 "중복"으로 걸림)
    function assetNoDup(v) {
      if (!v) return false;
      return (window.DATA.assets || []).some(a => a !== opts.asset && a.assetNo && a.assetNo === v);
    }
    function checkValid() {
      const nameOk = nameInput.value.trim().length > 0;
      const noVal = assetNoInput.value.trim();
      const dup = type !== "quantity" && assetNoDup(noVal);
      assetNoErr.hidden = !dup;
      assetNoInput.classList.toggle("has-err", dup);
      const noOk = type === "quantity" ? true : (noVal.length > 0 && !dup);
      const totalQtyOk = type === "quantity" ? /^[1-9][0-9]*$/.test(totalQtyInput.value.trim()) : true;
      saveBtn.disabled = !(catValue && nameOk && noOk && totalQtyOk);
    }
    // 품목명 자동완성 — "소분류+품목명" 조합이 품목 단위라, 같은 소분류에 이미 등록된 품목명을 제안해서
    // 띄어쓰기·표기 차이로 같은 품목이 여러 이름으로 쪼개지는 걸 막음. 태그와 달리 목록에 없는 새 이름도 항상 입력 가능(강제 선택 아님)
    let prodMenu = null, prodHi = -1;
    function closeProdMenu() { if (prodMenu) { prodMenu.remove(); prodMenu = null; } prodHi = -1; }
    function productOptions() {
      if (!catValue) return [];
      const cat = findCat(catValue);
      if (!cat) return [];
      const q = nameInput.value.trim().toLowerCase();
      const names = [...new Set((window.DATA.assets || [])
        .filter(a => a.group === cat.group && a.sub === cat.sub)
        .map(a => a.product).filter(Boolean))];
      // 포커스만 하고 아직 안 쳤으면(q 없음) 전체 목록을 보여줌(태그 검색과 동일) — 검색어가 있는데 매칭이
      // 없으면 자동완성 성격상 "결과 없음" 표시 없이 그냥 드롭다운을 띄우지 않음(새 품목명 입력이 정상 상태)
      return q ? names.filter(n => n.toLowerCase().includes(q)) : names;
    }
    function openProdMenu() {
      const opts = productOptions();
      closeProdMenu();
      if (!opts.length) return;
      prodMenu = document.createElement("div");
      prodMenu.className = "dropdown-menu";
      prodHi = 0;
      prodMenu.innerHTML = opts.map((n, i) => `<button type="button" data-v="${n}" class="${i === 0 ? "active" : ""}">${n}</button>`).join("");
      const r = nameInput.getBoundingClientRect();
      prodMenu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${r.left}px;min-width:${r.width}px`;
      document.body.appendChild(prodMenu);
      prodMenu.querySelectorAll("[data-v]").forEach(b => b.onclick = () => {
        nameInput.value = b.dataset.v;
        closeProdMenu();
        checkValid();
      });
    }
    function moveProdHi(delta) {
      if (!prodMenu) return;
      const btns = [...prodMenu.querySelectorAll("button")];
      if (!btns.length) return;
      if (btns[prodHi]) btns[prodHi].classList.remove("active");
      prodHi = Math.max(0, Math.min(btns.length - 1, prodHi + delta));
      btns[prodHi].classList.add("active");
      btns[prodHi].scrollIntoView({ block: "nearest" });
    }
    nameInput.addEventListener("input", () => { checkValid(); openProdMenu(); });
    nameInput.addEventListener("focus", () => { if (!nameInput.disabled) openProdMenu(); });
    nameInput.addEventListener("keydown", e => {
      if (!prodMenu) return;
      if (e.key === "ArrowDown") { e.preventDefault(); moveProdHi(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); moveProdHi(-1); }
      else if (e.key === "Enter") {
        e.preventDefault();
        const btns = [...prodMenu.querySelectorAll("button")];
        const b = btns[prodHi];
        if (b) { nameInput.value = b.dataset.v; closeProdMenu(); checkValid(); }
      } else if (e.key === "Escape") { closeProdMenu(); }
    });
    document.addEventListener("click", e => {
      if (prodMenu && !prodMenu.contains(e.target) && e.target !== nameInput) closeProdMenu();
    });
    assetNoInput.addEventListener("input", () => {
      // value를 그냥 덮어쓰면 커서가 항상 맨 끝으로 튀어서, 중간에 타이핑하다 막힌 것처럼 느껴짐 —
      // 제거된 글자 수만큼 커서 위치를 보정해서 원래 있던 자리에 그대로 남게 함
      const before = assetNoInput.value;
      const pos = assetNoInput.selectionStart;
      const filtered = before.replace(/[^A-Za-z0-9\-_]/g, "");
      if (filtered !== before) {
        const removedBefore = before.slice(0, pos).length - before.slice(0, pos).replace(/[^A-Za-z0-9\-_]/g, "").length;
        assetNoInput.value = filtered;
        const newPos = Math.max(0, pos - removedBefore);
        assetNoInput.setSelectionRange(newPos, newPos);
      }
      checkValid();
    });
    totalQtyInput.addEventListener("input", () => {
      totalQtyInput.value = totalQtyInput.value.replace(/[^0-9]/g, "");
      checkValid();
    });
    // 구매가격은 숫자 전용이라 천단위 콤마를 붙여 표시(저장 시엔 콤마를 떼고 숫자로 파싱)
    purchasePriceInput.addEventListener("input", () => {
      const digits = purchasePriceInput.value.replace(/[^0-9]/g, "");
      purchasePriceInput.value = digits ? Number(digits).toLocaleString() : "";
    });

    // 소분류 — 검색 + 대분류/소분류 트리 모달(openCategoryPickModal)에서 단일 선택.
    // 기본은 비워둔 상태(자동 첫 항목 선택 없음) — 미선택 상태에선 소분류 필드만 보이고 나머지는 아예 숨김
    // (골라야 알 수 있는 유형별 필드를 미리 잠긴 채로 보여주는 것보다, 선택 후 필요한 것만 드러나는 쪽이 더 간결)
    const catWrap = back.querySelector("#areg-catwrap");
    const catDisplay = back.querySelector("#areg-cat-display");
    let catValue = null;

    function catLabel(v) { const c = findCat(v); return c ? `${c.group} › ${c.sub}` : ""; }
    // 소분류별 필드 노출 설정(구조설계안 3.3 hiddenFields) 반영 — S/N·IMEI는 개별형 전용이라 유형 조건과 같이 봄
    function applyFieldVisibility() {
      const show = !!catValue;
      const cat = findCat(catValue);
      const hiddenFields = (cat && cat.hiddenFields) || [];
      // 메모는 구조설계안 3.4상 소분류 필드 노출 설정과 무관하게 항상 노출되는 필드라 hiddenFields 체크 없음
      [nameField, tagFieldEl, noteField].forEach(el => { el.style.display = show ? "" : "none"; });
      assetNoField.style.display = show && type !== "quantity" ? "" : "none";
      // 총 수량은 개별형엔 없는 개념(실물 1개=Asset 1건이라 총 수량이 항상 1, 구조설계안 3.4)
      totalQtyField.style.display = show && type !== "individual" ? "" : "none";
      expiryField.style.display = show && !hiddenFields.includes("expiry") ? "" : "none";
      serialField.style.display = show && type === "individual" && !hiddenFields.includes("serial") ? "" : "none";
      imeiField.style.display = show && type === "individual" && !hiddenFields.includes("imei") ? "" : "none";
      manufacturedField.style.display = show && !hiddenFields.includes("manufactured") ? "" : "none";
      purchaseDateField.style.display = show && !hiddenFields.includes("purchaseDate") ? "" : "none";
      purchasePriceField.style.display = show && !hiddenFields.includes("purchasePrice") ? "" : "none";
    }
    function renderCatDisplay() {
      if (catValue) { catDisplay.textContent = catLabel(catValue); catDisplay.style.color = "var(--text)"; }
      else { catDisplay.textContent = "선택"; catDisplay.style.color = "var(--text-mut)"; }
    }
    // 소분류를 바꿀 때마다(선택 해제 포함) 이미 입력해둔 값은 전부 초기화 — 다른 소분류의 값이 뒤섞여 남아있지 않도록.
    // 자산 수정(opts.asset)에서는 selectCat에서 이 함수 호출 자체를 건너뜀(아래) — 소분류만 바꿨는데 이미 채워진
    // 기존 값(S/N·구매가격 등)이 날아가면 안 되기 때문. 신규 등록은 잃을 값이 없어 초기화가 안전하고 자연스러움
    function resetOtherFields() {
      nameInput.value = "";
      assetNoInput.value = "";
      assetNoErr.hidden = true;
      assetNoInput.classList.remove("has-err");
      totalQtyInput.value = "";
      tags.length = 0;
      renderChips();
      [expiryField, manufacturedField, purchaseDateField].forEach(f => {
        f.querySelector("[data-dtext]").value = "";
        f.querySelector("[data-dnative]").value = "";
      });
      serialInput.value = "";
      imeiInput.value = "";
      purchasePriceInput.value = "";
      noteInput.value = "";
    }
    function selectCat(v) {
      const changed = v !== catValue;
      catValue = v;
      const cat = findCat(v);
      type = (cat && cat.type) || "individual";
      renderCatDisplay();
      applyFieldVisibility();
      if (changed && !opts.asset) resetOtherFields();
      checkValid();
    }
    function setDateInputs(fieldEl, iso) {
      fieldEl.querySelector("[data-dtext]").value = iso ? iso.replace(/-/g, ".") : "";
      fieldEl.querySelector("[data-dnative]").value = iso || "";
    }
    // 자산 수정 진입 시 기존 값 전체를 채움 — selectCat을 거치지 않아(resetOtherFields 우회) 안전
    function prefillFromAsset(asset) {
      catValue = `${asset.group}|${asset.sub}`;
      type = asset.type;
      renderCatDisplay();
      applyFieldVisibility();
      nameInput.value = asset.product || "";
      if (type !== "quantity") assetNoInput.value = asset.assetNo || "";
      if (type !== "individual") totalQtyInput.value = asset.totalQty != null ? String(asset.totalQty) : "";
      tags.length = 0;
      (asset.labels || []).forEach(l => tags.push(l));
      renderChips();
      setDateInputs(expiryField, asset.expiry);
      if (type === "individual") {
        serialInput.value = asset.serial || "";
        imeiInput.value = asset.imei || "";
      }
      setDateInputs(manufacturedField, asset.manufactured);
      setDateInputs(purchaseDateField, asset.purchaseDate);
      purchasePriceInput.value = asset.price != null ? asset.price.toLocaleString() : "";
      noteInput.value = asset.note || "";
      checkValid();
    }
    catWrap.addEventListener("click", () => {
      if (opts.asset) {
        openCategoryMoveModal(categories, opts.asset.group, opts.asset.sub, opts.asset.type, v => selectCat(`${v.group}|${v.sub}`));
      } else {
        openCategoryPickModal(categories, catValue, v => selectCat(v));
      }
    });

    // 소분류 초기값 반영(과 그에 딸린 resetOtherFields 호출)은 태그 위젯(renderChips 등)까지 다 준비된
    // 뒤로 미룸 — 그 전에 부르면 아직 선언되기 전(TDZ)인 tagInput/chipsEl을 참조해서 에러.
    // applyFieldVisibility()는 tagFieldEl(단순 DOM 참조)만 써서 TDZ 위험 없이 먼저 불러도 안전
    renderCatDisplay();
    applyFieldVisibility();

    // 태그 입력 위젯 — 마스터 목록(window.DATA.tags)에서 검색해 선택만 가능(즉석 생성 없음). 새 태그는 [태그 관리]에서만 추가
    const tagWrap = back.querySelector("#areg-tagwrap");
    const tagInput = tagWrap.querySelector("[data-taginput]");
    const chipsEl = tagWrap.querySelector("[data-chips]");
    let menu = null, hiIndex = -1;
    function closeMenu() { if (menu) { menu.remove(); menu = null; } hiIndex = -1; }
    function renderChips() {
      chipsEl.innerHTML = tags.map(t => {
        const c = tagColor(t);
        return `<span class="tag-chip" style="background:${c.bg};border-color:${c.fg};color:${c.fg}">${t}<button type="button" data-untag="${t}" aria-label="태그 제거" style="color:${c.fg}">${CLOSE_ICON_SM}</button></span>`;
      }).join("");
      chipsEl.querySelectorAll("[data-untag]").forEach(b => b.onclick = () => {
        tags.splice(tags.indexOf(b.dataset.untag), 1);
        renderChips();
      });
      tagInput.placeholder = tags.length ? "" : "검색";
    }
    function addTag(v) {
      if (!v || tags.includes(v) || tags.length >= 5) return;
      tags.push(v);
      tagInput.value = "";
      renderChips();
      closeMenu();
    }
    function tagOptions() {
      const q = tagInput.value.trim().toLowerCase();
      const source = (window.DATA && window.DATA.tags) || [];
      return source.filter(l => l.toLowerCase().includes(q) && !tags.includes(l));
    }
    function openMenu() {
      if (tags.length >= 5) return; // 최대 5개 다 찼으면 더 고를 필요 없음
      const opts = tagOptions();
      closeMenu();
      menu = document.createElement("div");
      menu.className = "dropdown-menu";
      hiIndex = opts.length ? 0 : -1;
      menu.innerHTML = opts.length
        ? opts.map((l, i) => `<button type="button" data-pick="${l}" class="${i === 0 ? "active" : ""}">${l}</button>`).join("")
        : `<div class="dropdown-empty">결과가 없습니다.</div>`;
      const r = tagWrap.getBoundingClientRect();
      menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${r.left}px;min-width:${r.width}px`;
      document.body.appendChild(menu);
      menu.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => addTag(b.dataset.pick));
    }
    function moveHi(delta) {
      if (!menu) return;
      const btns = [...menu.querySelectorAll("button")];
      if (!btns.length) return;
      if (btns[hiIndex]) btns[hiIndex].classList.remove("active");
      hiIndex = Math.max(0, Math.min(btns.length - 1, hiIndex + delta));
      btns[hiIndex].classList.add("active");
      btns[hiIndex].scrollIntoView({ block: "nearest" });
    }
    tagInput.addEventListener("input", openMenu);
    tagInput.addEventListener("focus", openMenu);
    tagInput.addEventListener("keydown", e => {
      if (e.key === "ArrowDown") { e.preventDefault(); moveHi(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); moveHi(-1); }
      else if (e.key === "Enter") {
        e.preventDefault();
        if (menu) {
          const btns = [...menu.querySelectorAll("button")];
          const b = btns[hiIndex];
          if (b) addTag(b.dataset.pick);
        }
      } else if (e.key === "Escape") { closeMenu(); }
    });
    document.addEventListener("click", e => {
      if (menu && !menu.contains(e.target) && e.target !== tagInput) closeMenu();
    });
    renderChips();
    checkValid();
    if (opts.asset) prefillFromAsset(opts.asset);
    else if (preselectValue) selectCat(preselectValue);

    back.querySelector("#areg-tag-manage").onclick = () => {
      closeMenu();
      openTagManageModal(({ renamed, deletedOrigs }) => {
        let changed = false;
        for (let i = tags.length - 1; i >= 0; i--) {
          if (deletedOrigs.includes(tags[i])) { tags.splice(i, 1); changed = true; continue; }
          const r = renamed.find(rn => rn.from === tags[i]);
          if (r) { tags[i] = r.to; changed = true; }
        }
        if (changed) renderChips();
      });
    };

    // 자산 수정(opts.asset)은 실제로 자산 객체를 갱신 + 활동 이력을 남김. 자산 추가는 아직 러프한 목업이라
    // 기존과 동일하게 토스트만(실제 데이터 반영 없음) — 이번 스코프는 "수정"만, 신규 등록 저장은 별도 과제.
    // 바뀐 필드마다 "자산 정보 수정: OOO" 형식으로 각각 따로 기록(뭉뚱그린 한 건이 아니라 배정/보유 관리만큼
    // 촘촘하게 — 필드별로 실제 값이 바뀐 것만 기록되고, 아무것도 안 바꾸고 저장하면 아무 것도 안 남음)
    saveBtn.addEventListener("click", () => {
      closeMenu();
      if (opts.asset) {
        const asset = opts.asset;
        const logChange = (script, before, after) => {
          if (opts.logActivity) opts.logActivity({ script: `자산 정보 수정: ${script}`, before, after });
        };
        const cat = findCat(catValue);
        if (cat && (cat.group !== asset.group || cat.sub !== asset.sub)) {
          const before = `${asset.group} › ${asset.sub}`, after = `${cat.group} › ${cat.sub}`;
          asset.group = cat.group;
          asset.sub = cat.sub;
          logChange("소분류 이동", before, after);
        }
        const dateFmt = d => d ? window.fmtDate(d) : "";
        const setIf = (script, key, val, format) => {
          if (asset[key] === val) return;
          const fmt = format || (v => v || "");
          logChange(script, fmt(asset[key]), fmt(val));
          asset[key] = val;
        };
        setIf("품목명 수정", "product", nameInput.value.trim());
        if (type !== "quantity") setIf("고유관리번호 수정", "assetNo", assetNoInput.value.trim());
        if (type !== "individual") setIf("총 수량 변경", "totalQty", parseInt(totalQtyInput.value, 10) || 0, v => v ? `${v}개` : "");
        const newTags = [...tags];
        if (JSON.stringify(newTags) !== JSON.stringify(asset.labels || [])) {
          logChange("태그 수정", (asset.labels || []).join(", "), newTags.join(", "));
          asset.labels = newTags;
        }
        const expiry = getExpiry();
        if (expiry !== null) setIf("유효기한 변경", "expiry", expiry || undefined, dateFmt);
        if (type === "individual") {
          setIf("S/N 수정", "serial", serialInput.value.trim() || undefined);
          setIf("IMEI 수정", "imei", imeiInput.value.trim() || undefined);
        }
        const manufactured = getManufactured();
        if (manufactured !== null) setIf("제조연월일 변경", "manufactured", manufactured || undefined, dateFmt);
        const purchaseDate = getPurchaseDate();
        if (purchaseDate !== null) setIf("구매일 변경", "purchaseDate", purchaseDate || undefined, dateFmt);
        // 통화 표기는 클라이언트 단위 전역 설정 — window.formatPrice 참조(구조설계안 3.4, data.js)
        const priceDigits = purchasePriceInput.value.replace(/[^0-9]/g, "");
        setIf("구매가격 변경", "price", priceDigits ? parseInt(priceDigits, 10) : undefined, v => (v != null ? window.formatPrice(v) : ""));
        setIf("메모 수정", "note", noteInput.value.trim() || undefined);
        back.remove();
        toast("저장되었습니다.");
        if (opts.onSaved) opts.onSaved();
      } else {
        back.remove();
        toast("저장되었습니다. (프로토타입 — 반영 없음)");
      }
    });

    return back;
  };
})();
