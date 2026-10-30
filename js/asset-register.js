(function () {
  const normalizeTagName = value => value.trim().replace(/\s+/g, " ");
  function bindTagNameInput(input, onInput) {
    function insertWithoutSeparator(event, text) {
      if (!text || !text.includes("|")) return;
      event.preventDefault();
      const start = input.selectionStart,
        end = input.selectionEnd,
        room = input.maxLength < 0 ? text.length : Math.max(0, input.maxLength - input.value.length + end - start),
        allowed = text.replace(/\|/g, "").slice(0, room);
      allowed && (input.setRangeText(allowed, start, end, "end"), input.dispatchEvent(new Event("input", {
        bubbles: !0
      })));
    }
    input.addEventListener("beforeinput", event => {
      event.isComposing || insertWithoutSeparator(event, event.data);
    }), input.addEventListener("paste", event => insertWithoutSeparator(event, event.clipboardData.getData("text"))), input.addEventListener("input", () => {
      const before = input.value;
      if (before.includes("|")) {
        const start = before.slice(0, input.selectionStart).replace(/\|/g, "").length,
          end = before.slice(0, input.selectionEnd).replace(/\|/g, "").length;
        input.value = before.replace(/\|/g, ""), input.setSelectionRange(start, end);
      }
      onInput();
    });
  }
  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg, t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300;box-shadow:0 8px 24px rgba(0,0,0,.25)", document.body.appendChild(t), setTimeout(() => t.remove(), 1800);
  }
  const CLOSE_ICON_SM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    TRASH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M9.5 7l.7 13a1 1 0 0 0 1 1h5.6a1 1 0 0 0 1-1l.7-13"/></svg>',
    TAG_COLORS = [{
      fg: "#3461c9",
      bg: "#eaf1ff"
    }, {
      fg: "#6b3fd4",
      bg: "#f1ecff"
    }, {
      fg: "#c23c56",
      bg: "#fdecef"
    }, {
      fg: "#1f8f5f",
      bg: "#e8f8f0"
    }, {
      fg: "#b5790a",
      bg: "#fdf3e0"
    }, {
      fg: "#1f8fae",
      bg: "#e6f6fa"
    }];
  function tagColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
    return TAG_COLORS[Math.abs(h) % TAG_COLORS.length];
  }
  function openTagManageModal(onSaved) {
    const master = window.DATA && window.DATA.tags || [];
    let draft = master.map(t => ({
      name: t,
      orig: t
    }));
    const back = document.createElement("div");
    back.className = "modal-back", back.innerHTML = `
      <div class="modal sm">
        <h3>태그 관리</h3>
        <div class="body">
          <div class="tag-manage-add">
            <input type="text" class="cat-manage-input" data-tm-input placeholder="입력" maxlength="20">
            <button type="button" class="btn primary" data-tm-add>+ 추가</button>
          </div>
          <p class="field-err" data-tm-add-err hidden>동일한 명칭이 존재합니다.</p>
          <div class="tag-manage-list" data-tm-list style="margin-top:14px"></div>
        </div>
        <div class="foot">
          <button type="button" class="btn" data-tm-cancel>취소</button>
          <button type="button" class="btn primary" data-tm-save disabled>저장</button>
        </div>
      </div>`, document.body.appendChild(back);
    const listEl = back.querySelector("[data-tm-list]"),
      addInput = back.querySelector("[data-tm-input]"),
      addBtn = back.querySelector("[data-tm-add]"),
      addErr = back.querySelector("[data-tm-add-err]"),
      saveBtn = back.querySelector("[data-tm-save]");
    function dupNameSet() {
      const counts = {};
      return draft.forEach(t => {
        const n = normalizeTagName(t.name);
        n && (counts[n] = (counts[n] || 0) + 1);
      }), new Set(Object.keys(counts).filter(n => counts[n] > 1));
    }
    function isDirty() {
      const current = [...new Set(draft.map(t => normalizeTagName(t.name)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko")),
        orig = [...master].sort((a, b) => a.localeCompare(b, "ko"));
      return current.length !== orig.length ? !0 : current.some((v, i) => v !== orig[i]);
    }
    function updateValidity() {
      const dups = dupNameSet();
      listEl.querySelectorAll("[data-tm-rename]").forEach(inp => {
        const name = normalizeTagName(inp.value),
          invalid = !name || dups.has(name);
        inp.classList.toggle("has-err", invalid), inp.setAttribute("aria-invalid", String(invalid)), listEl.querySelector(`[data-tm-required="${inp.dataset.tmRename}"]`).hidden = !!name, listEl.querySelector(`[data-tm-duplicate="${inp.dataset.tmRename}"]`).hidden = !name || !dups.has(name);
      });
      const addDup = draft.some(t => normalizeTagName(t.name) === normalizeTagName(addInput.value));
      addInput.classList.toggle("has-err", !!normalizeTagName(addInput.value) && addDup), addErr.hidden = !(normalizeTagName(addInput.value) && addDup), addBtn.disabled = !normalizeTagName(addInput.value) || addDup, saveBtn.disabled = !isDirty() || dups.size > 0 || draft.some(t => !normalizeTagName(t.name));
    }
    function renderList() {
      listEl.innerHTML = draft.length ? draft.map((t, i) => `
        <div class="cat-manage-row">
          <div class="tag-manage-name-field">
            <input type="text" class="cat-manage-name-input" data-tm-rename="${i}" value="${t.name}" maxlength="20" aria-describedby="tm-name-required-${i} tm-name-duplicate-${i}">
            <p class="field-err" id="tm-name-required-${i}" data-tm-required="${i}" hidden>명칭은 필수로 입력해야 합니다.</p>
            <p class="field-err" id="tm-name-duplicate-${i}" data-tm-duplicate="${i}" hidden>동일한 명칭이 존재합니다.</p>
          </div>
          <div class="cat-manage-row-acts">
            <button type="button" class="cat-manage-icon" data-tm-del="${i}" aria-label="삭제"
              data-tip="삭제 시 이 태그를 사용 중인 자산에서 모두 삭제됩니다.">${TRASH_ICON}</button>
          </div>
        </div>`).join("") : '<p class="tag-manage-empty">등록된 태그가 없습니다.</p>', listEl.querySelectorAll("[data-tm-rename]").forEach(input => bindTagNameInput(input, () => {
        draft[+input.dataset.tmRename].name = input.value, updateValidity();
      })), updateValidity();
    }
    renderList();
    function addRow() {
      const name = normalizeTagName(addInput.value).slice(0, 20);
      if (!name || draft.some(t => normalizeTagName(t.name) === name)) {
        addInput.focus();
        return;
      }
      draft.unshift({
        name,
        orig: null
      }), addInput.value = "", renderList();
    }
    return addBtn.onclick = addRow, bindTagNameInput(addInput, updateValidity), addInput.addEventListener("keydown", e => {
      e.key === "Enter" && (e.preventDefault(), addRow());
    }), listEl.addEventListener("click", e => {
      const d = e.target.closest("[data-tm-del]");
      d && (draft.splice(+d.dataset.tmDel, 1), renderList());
    }), back.querySelector("[data-tm-cancel]").onclick = () => back.remove(), saveBtn.onclick = () => {
      if (!isDirty() || dupNameSet().size > 0 || draft.some(t => !normalizeTagName(t.name))) return;
      const finalNames = [...new Set(draft.map(t => normalizeTagName(t.name)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko")),
        remainingOrigs = new Set(draft.filter(t => t.orig).map(t => t.orig)),
        deletedOrigs = master.filter(t => !remainingOrigs.has(t)),
        renamed = draft.filter(t => t.orig && t.orig !== normalizeTagName(t.name)).map(t => ({
          from: t.orig,
          to: normalizeTagName(t.name)
        }));
      [...(window.DATA.assets || []), ...(window.DATA.deletedAssets || [])].forEach(a => {
        !a.labels || !a.labels.length || (a.labels = a.labels.filter(l => !deletedOrigs.includes(l)).map(l => {
          const r = renamed.find(rn => rn.from === l);
          return r ? r.to : l;
        }));
      }), master.length = 0, master.push(...finalNames), back.remove(), toast("저장되었습니다."), onSaved && onSaved({
        renamed,
        deletedOrigs
      });
    }, back;
  }
  window.openAssetTagManageModal = openTagManageModal;
  window.openAssetCategoryPickModal = openCategoryPickModal;
  function openCategoryPickModal(categories, currentValue, onApply) {
    let selected = currentValue,
      query = "";
    const back = document.createElement("div");
    back.className = "modal-back", back.innerHTML = `
      <div class="modal sm">
        <h3>분류</h3>
        <div class="body">
          <input type="text" class="picker-search" data-cp-search placeholder="검색" autocomplete="off">
          <div class="catpick-list" data-cp-list></div>
        </div>
        <div class="foot">
          <button type="button" class="btn" data-cp-cancel>취소</button>
          <button type="button" class="btn primary" data-cp-apply>적용</button>
        </div>
      </div>`, document.body.appendChild(back);
    const listEl = back.querySelector("[data-cp-list]"),
      searchInput = back.querySelector("[data-cp-search]");
    function groupsOf() {
      const m = /* @__PURE__ */new Map();
      return categories.forEach(c => {
        m.has(c.group) || m.set(c.group, []), m.get(c.group).push(c.sub);
      }), m;
    }
    function renderList() {
      const hasOptions = categories.length > 0;
      if (searchInput.hidden = !hasOptions, back.querySelector("[data-cp-apply]").disabled = !categories.some(c => `${c.group}|${c.sub}` === selected), !hasOptions) {
        listEl.innerHTML = '<p class="tag-manage-empty">표시할 목록이 없습니다.</p>';
        return;
      }
      const q = query.trim().toLowerCase();
      let html = "";
      groupsOf().forEach((subs, g) => {
        const groupMatches = !q || g.toLowerCase().includes(q),
          filtered = subs.filter(s => groupMatches || s.toLowerCase().includes(q));
        filtered.length && (html += `<div class="catpick-group">
          <div class="catpick-group-name">${g}</div>
          ${filtered.map(s => {
          const v = `${g}|${s}`;
          return `<button type="button" class="catpick-row${selected === v ? " active" : ""}" data-v="${v}">${s}</button>`;
        }).join("")}
        </div>`);
      }), listEl.innerHTML = html || '<p class="tag-manage-empty">결과가 없습니다.</p>', listEl.querySelectorAll("[data-v]").forEach(b => b.onclick = () => {
        selected = b.dataset.v, renderList();
      });
    }
    return renderList(), searchInput.addEventListener("input", () => {
      query = searchInput.value, renderList();
    }), back.querySelector("[data-cp-cancel]").onclick = () => back.remove(), back.querySelector("[data-cp-apply]").onclick = () => {
      back.querySelector("[data-cp-apply]").disabled || (back.remove(), onApply(selected));
    }, back;
  }
  const TODAY = /* @__PURE__ */new Date("2026-09-04");
  function todayStr() {
    const p = n => String(n).padStart(2, "0");
    return `${TODAY.getFullYear()}-${p(TODAY.getMonth() + 1)}-${p(TODAY.getDate())}`;
  }
  function openCategoryMoveModal(categories, currentGroup, currentSub, currentType, onApply) {
    let picked = {
        group: currentGroup,
        sub: currentSub
      },
      query = "";
    const groupMap = {},
      order = [];
    categories.forEach(c => {
      groupMap[c.group] || (groupMap[c.group] = [], order.push(c.group)), groupMap[c.group].push(c);
    });
    const groups = order.map(group => ({
        group,
        subs: groupMap[group]
      })),
      back = document.createElement("div");
    back.className = "modal-back", back.innerHTML = `
      <div class="modal picker-modal">
        <h3>분류</h3>
        <div class="body" style="display:flex;flex-direction:column;max-height:60vh">
          <input type="text" class="picker-search" data-move-search placeholder="검색" autocomplete="off">
          <div data-body style="flex:1;min-height:0;overflow-y:auto;margin-top:8px"></div>
        </div>
        <div class="foot">
          <button type="button" class="btn" data-cancel>취소</button>
          <button type="button" class="btn primary" data-apply>적용</button>
        </div>
      </div>`, document.body.appendChild(back);
    const body = back.querySelector("[data-body]"),
      applyBtn = back.querySelector("[data-apply]"),
      searchInput = back.querySelector("[data-move-search]");
    function draw() {
      const q = query.trim().toLowerCase(),
        html = groups.map(g => {
          const groupMatches = !q || g.group.toLowerCase().includes(q),
            subs = g.subs.filter(c => groupMatches || c.sub.toLowerCase().includes(q));
          return subs.length ? `
        <div class="submove-group">
          <div class="submove-group-name">${g.group}</div>
          ${subs.map(c => {
            const checked = picked && picked.group === g.group && picked.sub === c.sub;
            return `
            <label class="radio-row">
              <input type="radio" name="catmove" data-group="${g.group}" data-sub="${c.sub}"${checked ? " checked" : ""}>
              <span>${c.sub}</span>
            </label>`;
          }).join("")}
        </div>` : "";
        }).join("");
      body.innerHTML = html || '<p class="tag-manage-empty">결과가 없습니다.</p>', body.querySelectorAll('input[name="catmove"]').forEach(r => r.onchange = () => {
        picked = {
          group: r.dataset.group,
          sub: r.dataset.sub
        }, applyBtn.disabled = !1;
      }), applyBtn.disabled = !picked;
    }
    draw(), searchInput.addEventListener("input", () => {
      query = searchInput.value, draw();
    }), back.querySelector("[data-cancel]").onclick = () => back.remove(), applyBtn.onclick = () => {
      picked && (back.remove(), onApply(picked));
    };
  }
  window.openAssetAddModal = function (opts) {
    opts = opts || {};
    const hasAssetManagePermission = () => window.hasPrototypeAssetManagePermission();
    if (opts.asset ? !window.AssetAccess.canInfo(opts.asset) : !hasAssetManagePermission()) return null;
    const categories = (window.DATA && window.DATA.categories || []).filter(c => hasAssetManagePermission() || opts.asset && c.group===opts.asset.group && c.sub===opts.asset.sub),
      preselectValue = opts.group && opts.sub ? `${opts.group}|${opts.sub}` : null,
      findCat = v => {
        const [g, s] = (v || "").split("|");
        return categories.find(c => c.group === g && c.sub === s);
      };
    let type = (findCat(preselectValue) || {}).type || "individual";
    const IC_CAL = '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
    function dateFieldHtml() {
      return `
        <div class="dfield">
          <input type="text" inputmode="numeric" data-dtext placeholder="YYYY.MM.DD" maxlength="10">
          <span class="dfield-pick">${IC_CAL}<input type="date" data-dnative tabindex="-1"></span>
        </div>`;
    }
    const isRealDate = (y, m, dd) => {
      const dt = new Date(y, m - 1, dd);
      return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === dd;
    };
    function wireDateField(scope, maxIso) {
      const text = scope.querySelector("[data-dtext]"),
        native = scope.querySelector("[data-dnative]");
      maxIso && (native.max = maxIso);
      const digitsOf = v => v.replace(/\D/g, "").slice(0, 8),
        format = d => d.length > 6 ? `${d.slice(0, 4)}.${d.slice(4, 6)}.${d.slice(6)}` : d.length > 4 ? `${d.slice(0, 4)}.${d.slice(4)}` : d,
        getValue = () => {
          const d = digitsOf(text.value);
          if (!d.length) return "";
          if (d.length !== 8) return null;
          const y = +d.slice(0, 4),
            m = +d.slice(4, 6),
            dd = +d.slice(6, 8);
          if (!isRealDate(y, m, dd)) return null;
          const iso = `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
          return maxIso && iso > maxIso ? null : iso;
        };
      return getValue.touched = !1, text.addEventListener("input", () => {
        text.value = format(digitsOf(text.value)), getValue.touched = !1, checkValid();
      }), text.addEventListener("blur", () => {
        getValue.touched = !0, checkValid();
      }), native.addEventListener("change", () => {
        native.value && (text.value = native.value.replace(/-/g, ".")), getValue.touched = !0, checkValid();
      }), getValue;
    }
    function monthFieldHtml() {
      return `
        <div class="dfield">
          <input type="text" inputmode="numeric" data-dtext placeholder="YYYY.MM" maxlength="7">
          <span class="dfield-pick">${IC_CAL}<input type="month" data-dnative tabindex="-1"></span>
        </div>`;
    }
    function wireMonthField(scope, maxIso) {
      const text = scope.querySelector("[data-dtext]"),
        native = scope.querySelector("[data-dnative]"),
        maxMonth = maxIso ? maxIso.slice(0, 7) : null;
      maxMonth && (native.max = maxMonth);
      const digitsOf = v => v.replace(/\D/g, "").slice(0, 6),
        format = d => d.length > 4 ? `${d.slice(0, 4)}.${d.slice(4)}` : d,
        getValue = () => {
          const d = digitsOf(text.value);
          if (!d.length) return "";
          if (d.length !== 6) return null;
          const y = d.slice(0, 4),
            m = d.slice(4, 6);
          if (+m < 1 || +m > 12) return null;
          const ym = `${y}-${m}`;
          return maxMonth && ym > maxMonth ? null : `${ym}-01`;
        };
      return getValue.touched = !1, text.addEventListener("input", () => {
        text.value = format(digitsOf(text.value)), getValue.touched = !1, checkValid();
      }), text.addEventListener("blur", () => {
        getValue.touched = !0, checkValid();
      }), native.addEventListener("change", () => {
        native.value && (text.value = native.value.replace("-", ".")), getValue.touched = !0, checkValid();
      }), getValue;
    }
    const tags = [],
      PHOTO_COLORS = ["#5b8def", "#8f6ef0", "#eb7f8b", "#3fb37f", "#e0a63c", "#4dabf7", "#c2554e", "#3f9ba0", "#9a6bd6", "#5aa06a"];
    let photos = [],
      primaryIdx = 0;
    const back = document.createElement("div");
    back.className = "modal-back" + (/app\.html$/.test(location.pathname) ? " mapp-register-edit" : ""), back.innerHTML = `
      <div class="modal scroll-body areg">
        <div class="areg-head">
          <h3>${opts.asset ? "자산 수정" : "자산 추가"}</h3>
          ${opts.asset ? "" : '<button type="button" class="areg-ai-trigger" data-ai-input>AI로 입력</button>'}
        </div>
        <div class="body">
          <div class="areg-col-left">
            <div class="field"><label>분류 <span class="req">*</span></label>
              <div class="tag-input-wrap" id="areg-catwrap" style="cursor:pointer">
                <span id="areg-cat-display" style="flex:1;font-size:12.5px">선택</span>
              </div>
            </div>
            <div class="field" id="areg-name-field"><label>품목명 <span class="req">*</span></label><input type="text" id="areg-name" placeholder="입력" maxlength="50" autocomplete="off" aria-describedby="areg-name-error">
              <p class="field-err" id="areg-name-error" data-name-err hidden>동일한 명칭이 이미 등록되어 있습니다.</p></div>
          </div>
          <div class="areg-col-right" id="areg-col-right">
            <div class="field" id="areg-photo-field">
              <label>사진</label>
              <div class="areg-photo-row" id="areg-photo-row"></div>
            </div>
            <div class="field" id="areg-assetno"><label>고유관리번호${opts.asset ? ' <span class="req">*</span>' : ""}</label><input type="text" id="areg-assetno-input" placeholder="입력" maxlength="30">
              ${opts.asset ? "" : `<p class="hint">${window.ASSET_NUMBER_GUIDE}</p>`}
              <p class="field-err" data-assetno-err hidden>동일한 명칭이 존재합니다.</p>
            </div>
            <div class="field" id="areg-expiry-field"><label>유효기한</label>${dateFieldHtml()}
              <p class="field-err" data-date-err hidden>유효한 날짜가 아닙니다.</p>
            </div>
            <div class="field" id="areg-tag-field">
              <div class="field-label-row">
                <label>태그</label>
                <button type="button" class="btn sm" id="areg-tag-manage">태그 관리</button>
              </div>
              <p class="hint areg-tag-hint">최대 10개까지 선택할 수 있습니다.</p>
              <div class="tag-input-wrap" id="areg-tagwrap">
                <div class="tag-chips" data-chips></div>
                <input type="text" data-taginput placeholder="검색" autocomplete="off">
              </div>
            </div>
            <div class="field" id="areg-serial-field"><label>S/N</label><input type="text" id="areg-serial-input" placeholder="입력" maxlength="40"></div>
            <div class="field" id="areg-imei-field"><label>IMEI</label><input type="text" id="areg-imei-input" placeholder="입력" maxlength="40"></div>
            <div class="field" id="areg-manufactured-field"><label>제조연월</label>${monthFieldHtml()}
              <p class="field-err" data-date-err hidden>유효한 날짜가 아닙니다.</p>
            </div>
            <div class="field" id="areg-purchasedate-field"><label>구매연월</label>${monthFieldHtml()}
              <p class="field-err" data-date-err hidden>유효한 날짜가 아닙니다.</p>
            </div>
            <div class="field" id="areg-purchaseprice-field"><label>구매가격</label><input type="text" inputmode="decimal" id="areg-purchaseprice-input" placeholder="입력" maxlength="21"></div>
            <div class="field" id="areg-note-field"><label>메모</label><textarea id="areg-note-input" placeholder="입력" maxlength="500"></textarea></div>
          </div>
        </div>
        <div class="foot">
          <button type="button" class="btn" data-close>취소</button>
          <button type="button" class="btn primary" id="areg-save" disabled>저장</button>
        </div>
      </div>`, back.querySelectorAll("[data-close]").forEach(b => b.onclick = () => {
      b.disabled || requestClose();
    }), document.body.appendChild(back);
    const modalEl = back.querySelector(".modal"),
      rightCol = back.querySelector("#areg-col-right"),
      nameField = back.querySelector("#areg-name-field"),
      nameInput = back.querySelector("#areg-name"),
      nameErr = back.querySelector("[data-name-err]"),
      photoRow = back.querySelector("#areg-photo-row"),
      assetNoField = back.querySelector("#areg-assetno"),
      assetNoInput = back.querySelector("#areg-assetno-input"),
      assetNoErr = back.querySelector("[data-assetno-err]"),
      tagFieldEl = back.querySelector("#areg-tag-field"),
      expiryField = back.querySelector("#areg-expiry-field"),
      serialField = back.querySelector("#areg-serial-field"),
      serialInput = back.querySelector("#areg-serial-input"),
      imeiField = back.querySelector("#areg-imei-field"),
      imeiInput = back.querySelector("#areg-imei-input"),
      manufacturedField = back.querySelector("#areg-manufactured-field"),
      purchaseDateField = back.querySelector("#areg-purchasedate-field"),
      purchasePriceField = back.querySelector("#areg-purchaseprice-field"),
      purchasePriceInput = back.querySelector("#areg-purchaseprice-input"),
      noteField = back.querySelector("#areg-note-field"),
      noteInput = back.querySelector("#areg-note-input");
    window.AssetMemo.mountTextarea(noteInput);
    const saveBtn = back.querySelector("#areg-save");
    let initialEditValues = null,
      savedNumberError = null,
      savedNameError = null;
    const getExpiry = wireDateField(expiryField),
      getManufactured = wireMonthField(manufacturedField, todayStr()),
      getPurchaseDate = wireMonthField(purchaseDateField, todayStr());
    function assetNoDup(v) {
      return v ? (window.DATA.assets || []).some(a => a !== opts.asset && a.assetNo && a.assetNo === v) : !1;
    }
    function dateFieldValid(fieldEl, getValue) {
      if (fieldEl.style.display === "none") return !0;
      const invalid = getValue() === null,
        errEl = fieldEl.querySelector("[data-date-err]"),
        showErr = invalid && getValue.touched;
      return errEl && (errEl.hidden = !showErr), fieldEl.querySelector("[data-dtext]").classList.toggle("has-err", showErr), !invalid;
    }
    function editValues() {
      const dateValue = (field, getValue) => getValue() === null ? field.querySelector("[data-dtext]").value : getValue(),
        price = window.normalizePurchasePrice(purchasePriceInput.value);
      return {
        category: catValue,
        extraValues:window.AssetExtra.readInputs(back),
        name: nameInput.value.trim(),
        assetNo: assetNoInput.value.trim(),
        expiry: dateValue(expiryField, getExpiry),
        manufactured: dateValue(manufacturedField, getManufactured),
        purchaseDate: dateValue(purchaseDateField, getPurchaseDate),
        price,
        serial: serialInput.value.trim(),
        imei: imeiInput.value.trim(),
        note: noteInput.value.trim(),
        tags: [...tags].sort(),
        photos: photos.map(photo => ({
          ...photo
        })),
        primary: primaryIdx
      };
    }
    function editDirty() {
      return !!initialEditValues && JSON.stringify(editValues()) !== JSON.stringify(initialEditValues);
    }
    function hasAddInput() {
      const inputs = [nameInput, assetNoInput, serialInput, imeiInput, purchasePriceInput, noteInput, ...[expiryField, manufacturedField, purchaseDateField].map(field => field.querySelector("[data-dtext]"))];
      return !!catValue || inputs.some(input => input.value.trim()) || tags.length > 0 || photos.length > 0;
    }
    function requestClose() {
      if (closeMenu(), closeProdMenu(), opts.asset ? !editDirty() : !hasAddInput()) {
        back.remove();
        return;
      }
      if (document.querySelector("[data-register-exit]")) return;
      const title = opts.asset ? "수정을 중단하시겠습니까?" : "작성을 중단하시겠습니까?",
        body = opts.asset ? "수정을 중단할 경우 변경된 내용은 저장되지 않습니다." : "지금까지 작성한 내용은 저장되지 않습니다.",
        cb = document.createElement("div");
      cb.className = "modal-back", cb.style.zIndex = 340, cb.innerHTML = `<div class="modal sm" data-register-exit role="dialog" aria-modal="true" aria-label="${title}">
        <h3>${title}</h3>
        <div class="body" style="font-size:14px">${body}</div>
        <div class="foot"><button type="button" class="btn" data-register-stay>취소</button><button type="button" class="btn primary" data-register-leave>확인</button></div></div>`, document.body.appendChild(cb), cb.querySelector("[data-register-stay]").onclick = () => cb.remove(), cb.querySelector("[data-register-leave]").onclick = () => {
        cb.remove(), back.remove();
      };
    }
    function checkValid() {
      const name = nameInput.value.trim(),
        nameKey = `${catValue}|${name}`;
      savedNameError !== nameKey && (savedNameError = null);
      const nameDup = opts.asset ? !1 : savedNameError === nameKey;
      nameErr.hidden = !nameDup, nameInput.classList.toggle("has-err", nameDup), nameInput.setAttribute("aria-invalid", String(nameDup));
      const nameOk = name.length > 0 && !nameDup,
        noVal = assetNoInput.value.trim();
      savedNumberError !== noVal && (savedNumberError = null);
      const dup = !!noVal && (opts.asset ? assetNoDup(noVal) : savedNumberError === noVal);
      assetNoErr.hidden = !dup, assetNoInput.classList.toggle("has-err", dup);
      const noOk = (!opts.asset || noVal.length > 0) && !dup,
        expiryOk = dateFieldValid(expiryField, getExpiry),
        manufacturedOk = dateFieldValid(manufacturedField, getManufactured),
        purchaseDateOk = dateFieldValid(purchaseDateField, getPurchaseDate);
      saveBtn.disabled = !(catValue && nameOk && noOk && expiryOk && manufacturedOk && purchaseDateOk && (!opts.asset || editDirty()));
    }
    let prodMenu = null,
      prodHi = -1;
    function closeProdMenu() {
      prodMenu && (prodMenu.remove(), prodMenu = null), prodHi = -1;
    }
    function productOptions() {
      if (!catValue) return [];
      const cat = findCat(catValue);
      if (!cat) return [];
      const q = nameInput.value.trim().toLowerCase(),
        names = [...new Set((window.DATA.assets || []).filter(a => a.group === cat.group && a.sub === cat.sub).map(a => a.product).filter(Boolean))];
      return q ? names.filter(n => n.toLowerCase().includes(q)) : names;
    }
    function openProdMenu() {
      if(nameInput.readOnly)return;
      const opts2 = productOptions();
      if (closeProdMenu(), !opts2.length) return;
      prodMenu = document.createElement("div"), prodMenu.className = "dropdown-menu", prodHi = 0, prodMenu.innerHTML = opts2.map((n, i) => `<button type="button" data-v="${n}" class="${i === 0 ? "active" : ""}">${n}</button>`).join("");
      const r = nameInput.getBoundingClientRect();
      prodMenu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${r.left}px;min-width:${r.width}px`, document.body.appendChild(prodMenu), prodMenu.querySelectorAll("[data-v]").forEach(b => b.onclick = () => {
        nameInput.value = b.dataset.v, closeProdMenu(), checkValid();
      });
    }
    function moveProdHi(delta) {
      if (!prodMenu) return;
      const btns = [...prodMenu.querySelectorAll("button")];
      btns.length && (btns[prodHi] && btns[prodHi].classList.remove("active"), prodHi = Math.max(0, Math.min(btns.length - 1, prodHi + delta)), btns[prodHi].classList.add("active"), btns[prodHi].scrollIntoView({
        block: "nearest"
      }));
    }
    nameInput.addEventListener("input", () => {
      checkValid(), openProdMenu();
    }), nameInput.addEventListener("focus", () => {
      nameInput.disabled || openProdMenu();
    }), nameInput.addEventListener("keydown", e => {
      if (prodMenu) if (e.key === "ArrowDown") e.preventDefault(), moveProdHi(1);else if (e.key === "ArrowUp") e.preventDefault(), moveProdHi(-1);else if (e.key === "Enter") {
        e.preventDefault();
        const b = [...prodMenu.querySelectorAll("button")][prodHi];
        b && (nameInput.value = b.dataset.v, closeProdMenu(), checkValid());
      } else e.key === "Escape" && closeProdMenu();
    }), document.addEventListener("click", e => {
      prodMenu && !prodMenu.contains(e.target) && e.target !== nameInput && closeProdMenu();
    }), assetNoInput.addEventListener("input", () => {
      const before = assetNoInput.value,
        pos = assetNoInput.selectionStart,
        filtered = before.replace(/[^A-Za-z0-9\-_]/g, "");
      if (filtered !== before) {
        const removedBefore = before.slice(0, pos).length - before.slice(0, pos).replace(/[^A-Za-z0-9\-_]/g, "").length;
        assetNoInput.value = filtered;
        const newPos = Math.max(0, pos - removedBefore);
        assetNoInput.setSelectionRange(newPos, newPos);
      }
      checkValid();
    }), window.bindPurchasePriceInput(purchasePriceInput);
    const catWrap = back.querySelector("#areg-catwrap"),
      catDisplay = back.querySelector("#areg-cat-display");
    let catValue = null,
      activeAiDraft = null;
    const categoryDrafts = /* @__PURE__ */new Map();
    function catLabel(v) {
      const c = findCat(v);
      return c ? `${c.group} › ${c.sub}` : "";
    }
    function applyFieldVisibility() {
 const cat=findCat(catValue), manage=window.hasPrototypeAssetManagePermission();
 rightCol.style.display='flex';modalEl.classList.remove('wide');assetNoField.style.display='';
 serialField.style.display='none';imeiField.style.display='none';
 const rows=[['expiry',expiryField],['manufactured',manufacturedField],['purchaseDate',purchaseDateField],['purchasePrice',purchasePriceField]];
 let section=back.querySelector('[data-extra-section]');
 if(!section){section=document.createElement('section');section.className='extra-info-section';section.dataset.extraSection='';section.innerHTML='<h4>추가 정보</h4><div data-custom-inputs></div>';rightCol.appendChild(section);}
 // 기본 정보의 마지막은 메모. 날짜·가격은 기본 정보로 유지한다.
 for(const [id,field] of rows){field.style.display=!cat||window.AssetExtra.visible(cat,id,manage)?'':'none';field.querySelectorAll('input,button').forEach(el=>el.disabled=!cat);rightCol.insertBefore(field,noteField);}
 rightCol.insertBefore(tagFieldEl,expiryField);
 const custom=section.querySelector('[data-custom-inputs]'), current=window.AssetExtra.readInputs(custom);
 custom.innerHTML=window.AssetExtra.customInputs(cat,{...(opts.asset?.extraValues||{}),...current},'data-extra-input',manage);
 tagFieldEl.hidden=false;noteField.hidden=false;
 section.hidden=!custom.children.length;
}
    function renderCatDisplay() {
      catValue ? (catDisplay.textContent = catLabel(catValue), catDisplay.style.color = "var(--text)") : (catDisplay.textContent = "선택", catDisplay.style.color = "var(--text-mut)");
    }
    function resetOtherFields() {
      back.querySelectorAll("[data-extra-input]").forEach(el=>el.value="");
      assetNoInput.value = "", assetNoErr.hidden = !0, assetNoInput.classList.remove("has-err"), tags.length = 0, renderChips(), photos.length = 0, primaryIdx = 0, renderPhotos(), [expiryField, manufacturedField, purchaseDateField].forEach(f => {
        f.querySelector("[data-dtext]").value = "", f.querySelector("[data-dnative]").value = "";
      }), serialInput.value = "", imeiInput.value = "", purchasePriceInput.value = "", noteInput.value = "", window.AssetMemo.syncTextarea(noteInput);
    }
    function captureCategoryDraft() {
      return {
        extraValues:window.AssetExtra.readInputs(back),
        fields: [assetNoInput, serialInput, imeiInput, purchasePriceInput, noteInput].map(el => el.value),
        dates: [expiryField, manufacturedField, purchaseDateField].map(el => el.querySelector("[data-dtext]").value),
        tags: tags.slice(),
        photos: photos.map(p => ({
          ...p
        })),
        primaryIdx
      };
    }
    function restoreCategoryDraft(saved) {
      back.querySelectorAll("[data-extra-input]").forEach(el=>el.value=(saved.extraValues||{})[el.dataset.extraInput]||"");
      [assetNoInput, serialInput, imeiInput, purchasePriceInput, noteInput].forEach((el, i) => el.value = saved.fields[i]), [expiryField, manufacturedField, purchaseDateField].forEach((el, i) => {
        el.querySelector("[data-dtext]").value = saved.dates[i], el.querySelector("[data-dnative]").value = saved.dates[i].replaceAll(".", "-");
      }), tags.splice(0, tags.length, ...saved.tags), photos = saved.photos.map(p => ({
        ...p
      })), primaryIdx = saved.primaryIdx, window.AssetMemo.syncTextarea(noteInput), renderChips(), renderPhotos();
    }
    function selectCat(v) {
      const changed = v !== catValue,
        uncategorizedPhotos = catValue ? null : photos.map(p => ({
          ...p
        }));
      changed && !opts.asset && catValue && categoryDrafts.set(catValue, captureCategoryDraft()), catValue = v;
      const cat = findCat(v);
      if (type = cat && cat.type || "individual", renderCatDisplay(), applyFieldVisibility(), changed && !opts.asset && (resetOtherFields(), categoryDrafts.has(v) ? restoreCategoryDraft(categoryDrafts.get(v)) : uncategorizedPhotos?.length && (photos = uncategorizedPhotos, renderPhotos()), activeAiDraft)) {
        const pending = activeAiDraft;
        activeAiDraft = null, applyAiValues(pending, {
          replace: !0
        });
      }
      checkValid();
    }
    function setDateInputs(fieldEl, iso) {
      const native = fieldEl.querySelector("[data-dnative]"),
        isMonth = native.type === "month",
        shown = iso && isMonth ? iso.slice(0, 7) : iso;
      fieldEl.querySelector("[data-dtext]").value = shown ? shown.replace(/-/g, ".") : "", native.value = shown || "";
    }
    function prefillFromAsset(asset) {
      catValue = `${asset.group}|${asset.sub}`, type = asset.type, renderCatDisplay(), applyFieldVisibility(), nameInput.value = asset.product || "", assetNoInput.value = asset.assetNo || "", tags.length = 0, (asset.labels || []).forEach(l => tags.push(l)), renderChips(), photos.length = 0, window.assetPhotos(asset).forEach(p => photos.push({
        ...p
      })), primaryIdx = asset._primary || 0, renderPhotos(), setDateInputs(expiryField, asset.expiry), serialInput.value = asset.serial || "", imeiInput.value = asset.imei || "", setDateInputs(manufacturedField, asset.manufactured), setDateInputs(purchaseDateField, asset.purchaseDate), purchasePriceInput.value = window.formatPurchasePriceInput(asset.price), noteInput.value = asset.note || "", window.AssetMemo.syncTextarea(noteInput), checkValid();
    }
    catWrap.addEventListener("click", () => {
      if(opts.asset&&!hasAssetManagePermission())return;
      opts.asset ? openCategoryMoveModal(categories, opts.asset.group, opts.asset.sub, opts.asset.type, v => selectCat(`${v.group}|${v.sub}`)) : openCategoryPickModal(categories, catValue, v => selectCat(v));
    }), renderCatDisplay(), applyFieldVisibility();
    const tagWrap = back.querySelector("#areg-tagwrap"),
      tagInput = tagWrap.querySelector("[data-taginput]"),
      chipsEl = tagWrap.querySelector("[data-chips]");
    let menu = null,
      hiIndex = -1;
    function closeMenu() {
      menu && (menu.remove(), menu = null), hiIndex = -1;
    }
    function renderChips() {
      chipsEl.innerHTML = tags.map(t => {
        const c = tagColor(t);
        return `<span class="tag-chip" style="background:${c.bg};border-color:${c.fg};color:${c.fg}">${t}<button type="button" data-untag="${t}" aria-label="태그 제거" style="color:${c.fg}">${CLOSE_ICON_SM}</button></span>`;
      }).join(""), chipsEl.querySelectorAll("[data-untag]").forEach(b => b.onclick = () => {
        tags.splice(tags.indexOf(b.dataset.untag), 1), renderChips();
      }), tagInput.placeholder = tags.length ? "" : "검색", checkValid();
    }
    function addTag(v) {
      !v || tags.includes(v) || tags.length >= window.ASSET_TAG_MAX_COUNT || (tags.push(v), tagInput.value = "", renderChips(), closeMenu());
    }
    function tagOptions() {
      const q = tagInput.value.trim().toLowerCase();
      return (window.DATA && window.DATA.tags || []).filter(l => l.toLowerCase().includes(q) && !tags.includes(l));
    }
    function openMenu() {
      if (tags.length >= window.ASSET_TAG_MAX_COUNT) return;
      const opts2 = tagOptions();
      closeMenu(), menu = document.createElement("div"), menu.className = "dropdown-menu", hiIndex = opts2.length ? 0 : -1, menu.innerHTML = opts2.length ? opts2.map((l, i) => `<button type="button" data-pick="${l}" class="${i === 0 ? "active" : ""}">${l}</button>`).join("") : '<div class="dropdown-empty">결과가 없습니다.</div>';
      const r = tagWrap.getBoundingClientRect();
      menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${r.left}px;min-width:${r.width}px`, document.body.appendChild(menu), menu.querySelectorAll("[data-pick]").forEach(b => b.onclick = () => addTag(b.dataset.pick));
    }
    function moveHi(delta) {
      if (!menu) return;
      const btns = [...menu.querySelectorAll("button")];
      btns.length && (btns[hiIndex] && btns[hiIndex].classList.remove("active"), hiIndex = Math.max(0, Math.min(btns.length - 1, hiIndex + delta)), btns[hiIndex].classList.add("active"), btns[hiIndex].scrollIntoView({
        block: "nearest"
      }));
    }
    tagInput.addEventListener("input", openMenu), tagInput.addEventListener("focus", openMenu), tagInput.addEventListener("keydown", e => {
      if (e.key === "ArrowDown") e.preventDefault(), moveHi(1);else if (e.key === "ArrowUp") e.preventDefault(), moveHi(-1);else if (e.key === "Enter") {
        if (e.preventDefault(), menu) {
          const b = [...menu.querySelectorAll("button")][hiIndex];
          b && addTag(b.dataset.pick);
        }
      } else e.key === "Escape" && closeMenu();
    }), document.addEventListener("click", e => {
      menu && !menu.contains(e.target) && e.target !== tagInput && closeMenu();
    });
    function renderPhotos() {
      const tiles = photos.map((p, i) => `
        <button type="button" class="areg-photo-tile${i === primaryIdx ? " primary" : ""}" data-photo-i="${i}" style="background:${p.color}" aria-label="사진 ${i + 1}${i === primaryIdx ? " (대표)" : ""}">
          ${i === primaryIdx ? '<span class="areg-photo-star">★</span>' : ""}
          <span class="areg-photo-del" data-photo-del="${i}" aria-label="삭제">${CLOSE_ICON_SM}</span>
        </button>`).join(""),
        addTile = `<button type="button" class="areg-photo-add" id="areg-photo-add-btn" aria-label="사진 추가" ${photos.length >= window.ASSET_PHOTO_MAX_COUNT ? "disabled" : ""}>+</button>`;
      photoRow.innerHTML = tiles + addTile, photoRow.querySelectorAll("[data-photo-i]").forEach(b => b.onclick = e => {
        e.target.closest("[data-photo-del]") || (primaryIdx = +b.dataset.photoI, renderPhotos());
      }), photoRow.querySelectorAll("[data-photo-del]").forEach(b => b.onclick = e => {
        e.stopPropagation();
        const i = +b.dataset.photoDel;
        photos.splice(i, 1), !photos.length || primaryIdx === i ? primaryIdx = 0 : primaryIdx > i && (primaryIdx -= 1), renderPhotos();
      });
      const addBtn = photoRow.querySelector("#areg-photo-add-btn");
      addBtn && (addBtn.onclick = () => {
        photos.push({
          id: window.assetPhotoId(),
          color: PHOTO_COLORS[photos.length % PHOTO_COLORS.length],
          at: `${todayStr()} 00:00`,
          by: "dana"
        }), photos.length === 1 && (primaryIdx = 0), renderPhotos();
      }), checkValid();
    }
    renderPhotos();
    function aiPhoto(offset) {
      return {
        id: window.assetPhotoId(),
        color: PHOTO_COLORS[(photos.length + offset) % PHOTO_COLORS.length],
        at: `${todayStr()} 00:00`,
        by: "dana"
      };
    }
    function fieldIsShown(field) {
      return field.style.display !== "none";
    }
    function setAiValue(input, value, replace) {
      replace ? input.value = value == null ? "" : String(value) : !input.value.trim() && value != null && value !== "" && (input.value = String(value));
    }
    function setAiDate(field, value, replace) {
      fieldIsShown(field) && (replace || !field.querySelector("[data-dtext]").value.trim()) && setDateInputs(field, value || "");
    }
    function applyAiValues(draft, {
      replace = !0
    } = {}) {
      back.querySelectorAll("[data-extra-input]").forEach(el=>el.value=String((draft?.extraValues||{})[el.dataset.extraInput]||""));
      draft && (setAiValue(nameInput, draft.name, replace), tags.splice(0, tags.length, ...(draft.tags || []).filter(tag => window.DATA.tags.includes(tag)).slice(0, window.ASSET_TAG_MAX_COUNT)), renderChips(), fieldIsShown(assetNoField) && setAiValue(assetNoInput, draft.assetNo, replace), fieldIsShown(serialField) && setAiValue(serialInput, draft.serial, replace), fieldIsShown(imeiField) && setAiValue(imeiInput, draft.imei, replace), fieldIsShown(purchasePriceField) && setAiValue(purchasePriceInput, draft.price == null ? "" : window.formatPurchasePriceInput(draft.price), replace), fieldIsShown(noteField) && (replace || !noteInput.value.trim() && draft.note) && (noteInput.value = draft.note || "", window.AssetMemo.syncTextarea(noteInput)), setAiDate(expiryField, draft.expiry, replace), setAiDate(manufacturedField, draft.manufactured, replace), setAiDate(purchaseDateField, draft.purchaseDate, replace), checkValid());
    }
    function appendAiPhotos(newPhotos) {
      const room = Math.max(0, window.ASSET_PHOTO_MAX_COUNT - photos.length);
      newPhotos.slice(0, room).forEach(photo => photos.push({
        ...photo
      })), photos.length && primaryIdx >= photos.length && (primaryIdx = 0), renderPhotos();
    }
    function recommendedCategory() {
      return categories.find(c => c.group === "전자기기류" && c.sub === "노트북") || categories[0] || null;
    }
    function mockAiDraft(partial) {
      return partial ? {
        name: "MacBook Pro 14",
        serial: "C02AI2026",
        manufactured: "2026-01-01"
      } : {
        name: "MacBook Pro 14",
        assetNo: "AI-2026-0001",
        serial: "C02AI2026",
        manufactured: "2026-01-01",
        purchaseDate: "2026-02-01",
        price: "2500000",
        tags: (window.DATA.tags || []).slice(0, 2)
      };
    }
    function applyAiResult(draft, newPhotos, recommend) {
      const previousPhotos = photos.map(p => ({
          ...p
        })),
        previousPrimary = primaryIdx;
      if (recommend) {
        const cat = recommendedCategory();
        cat && selectCat(`${cat.group}|${cat.sub}`);
      }
      activeAiDraft = null, applyAiValues(draft, {
        replace: !0
      }), photos = previousPhotos, primaryIdx = previousPrimary, appendAiPhotos(newPhotos), catValue && categoryDrafts.set(catValue, captureCategoryDraft());
    }
    function continueAiDirectly(draft, newPhotos) {
      appendAiPhotos(newPhotos), catValue ? Object.keys(draft).length && applyAiValues(draft, {
        replace: !0
      }) : activeAiDraft = Object.keys(draft).length ? draft : null;
    }
    function openAiInputModal() {
      closeMenu(), closeProdMenu();
      const aiBack = document.createElement("div");
      aiBack.className = "modal-back areg-ai-back", aiBack.innerHTML = `
        <div class="modal areg-ai-modal" role="dialog" aria-modal="true" aria-label="AI로 입력">
          <div class="areg-ai-head">
            <h3>AI로 입력</h3>
            <button type="button" class="areg-ai-close" data-ai-cancel aria-label="닫기">${CLOSE_ICON_SM}</button>
          </div>
          <div class="body">
            <p class="areg-ai-guide">자산 사진을 첨부하면 AI가 자산 정보를 분석해 입력합니다.</p>
            <div class="areg-ai-photos" data-ai-photos></div>
            <div class="areg-ai-state" data-ai-state></div>
            <button type="button" class="btn primary areg-ai-analyze" data-ai-analyze>분석하기</button>
          </div>
        </div>`, document.body.appendChild(aiBack);
      const newPhotos = [],
        photosEl = aiBack.querySelector("[data-ai-photos]"),
        stateEl = aiBack.querySelector("[data-ai-state]"),
        analyzeBtn = aiBack.querySelector("[data-ai-analyze]");
      let analyzing = !1;
      function closeAi() {
        aiBack.remove();
      }
      function requestAiClose() {
        if (newPhotos.length === 0) {
          closeAi();
          return;
        }
        if (document.querySelector("[data-ai-exit]")) return;
        const confirmBack = document.createElement("div");
        confirmBack.className = "modal-back", confirmBack.style.zIndex = 340, confirmBack.innerHTML = `<div class="modal sm" data-ai-exit role="dialog" aria-modal="true" aria-label="AI 입력을 중단하시겠습니까?">
          <h3>AI 입력을 중단하시겠습니까?</h3>
          <div class="body" style="font-size:14px">첨부한 사진과 분석 결과는 저장되지 않습니다.</div>
          <div class="foot"><button type="button" class="btn" data-ai-stay>취소</button><button type="button" class="btn primary" data-ai-leave>확인</button></div>
        </div>`, document.body.appendChild(confirmBack), confirmBack.querySelector("[data-ai-stay]").onclick = () => confirmBack.remove(), confirmBack.querySelector("[data-ai-leave]").onclick = () => {
          confirmBack.remove(), closeAi();
        };
      }
      function renderAiPhotos() {
        const existingTiles = photos.map((photo, i) => `
          <span class="areg-ai-photo" style="background:${photo.color}" aria-label="사진 ${i + 1}">
            ${i === primaryIdx ? '<span class="areg-photo-star">★</span>' : ""}
          </span>`).join(""),
          newTiles = newPhotos.map((photo, i) => `
          <span class="areg-ai-photo" style="background:${photo.color}" aria-label="새 사진 ${i + 1}">
            ${analyzing ? "" : `<button type="button" class="areg-ai-photo-del" data-ai-photo-del="${i}" aria-label="새 사진 삭제">${CLOSE_ICON_SM}</button>`}
          </span>`).join(""),
          total = photos.length + newPhotos.length,
          add = `<button type="button" class="areg-photo-add" data-ai-photo-add aria-label="사진 추가" ${analyzing || total >= window.ASSET_PHOTO_MAX_COUNT ? "disabled" : ""}>+</button>`;
        photosEl.innerHTML = existingTiles + newTiles + add, analyzeBtn.disabled = total === 0 || analyzing, photosEl.querySelectorAll("[data-ai-photo-del]").forEach(button => button.onclick = () => {
          newPhotos.splice(+button.dataset.aiPhotoDel, 1), renderAiPhotos();
        });
        const addBtn = photosEl.querySelector("[data-ai-photo-add]");
        addBtn && (addBtn.onclick = () => {
          newPhotos.push(aiPhoto(newPhotos.length)), renderAiPhotos();
        });
      }
      function renderInitial() {
        analyzing = !1, stateEl.innerHTML = "", analyzeBtn.hidden = !1, renderAiPhotos();
      }
      function renderLoading() {
        analyzing = !0, analyzeBtn.hidden = !0, stateEl.innerHTML = `
          <div class="areg-ai-loading"><span class="areg-ai-spinner" aria-hidden="true"></span><b>AI가 자산 정보를 분석하고 있습니다.</b></div>
          <div class="areg-ai-test-actions">
            <button type="button" class="btn" data-ai-outcome="success">성공</button>
            <button type="button" class="btn" data-ai-outcome="insufficient">정보 부족</button>
            <button type="button" class="btn" data-ai-outcome="error">분석 오류</button>
          </div>`, stateEl.querySelector('[data-ai-outcome="success"]').onclick = () => {
          applyAiResult(mockAiDraft(!1), newPhotos, !0), aiBack.remove();
        }, stateEl.querySelector('[data-ai-outcome="insufficient"]').onclick = () => renderFailure("insufficient"), stateEl.querySelector('[data-ai-outcome="error"]').onclick = () => renderFailure("error"), renderAiPhotos();
      }
      function renderFailure(kind) {
        analyzing = !1, analyzeBtn.hidden = !0;
        const insufficient = kind === "insufficient";
        stateEl.innerHTML = `
          <div class="areg-ai-result is-error">
            <b>${insufficient ? "AI가 자산 정보를 충분히 확인하지 못했습니다." : "AI 분석을 완료하지 못했습니다."}</b>
            <p>${insufficient ? "다시 시도하거나 직접 입력해 주세요." : "잠시 후 다시 시도하거나 직접 입력해 주세요."}</p>
            <p>직접 입력을 선택해도 첨부한 사진과 ${insufficient ? "확인된 정보는" : "확인된 정보가 있으면"} 유지됩니다.</p>
          </div>
          <div class="areg-ai-result-actions">
            <button type="button" class="btn" data-ai-retry>다시 시도</button>
            <button type="button" class="btn primary" data-ai-direct>직접 입력</button>
          </div>`, stateEl.querySelector("[data-ai-retry]").onclick = renderLoading, stateEl.querySelector("[data-ai-direct]").onclick = () => {
          aiBack.remove(), continueAiDirectly(insufficient ? mockAiDraft(!0) : {}, newPhotos);
        }, renderAiPhotos();
      }
      renderInitial(), analyzeBtn.onclick = renderLoading, aiBack.querySelector("[data-ai-cancel]").onclick = requestAiClose;
    }
    const aiInputBtn = back.querySelector("[data-ai-input]");
    return aiInputBtn && (aiInputBtn.onclick = openAiInputModal), renderChips(), checkValid(), opts.asset ? prefillFromAsset(opts.asset) : preselectValue && selectCat(preselectValue), opts.asset && (initialEditValues = editValues()), checkValid(), opts.asset && window.AssetAccess.protectForm(back,opts.asset), back.addEventListener("input", checkValid), back.addEventListener("change", checkValid), back.querySelector("#areg-tag-manage").onclick = () => {
      if(!hasAssetManagePermission())return;
      closeMenu(), openTagManageModal(({
        renamed,
        deletedOrigs
      }) => {
        let changed = !1;
        for (let i = tags.length - 1; i >= 0; i--) {
          if (deletedOrigs.includes(tags[i])) {
            tags.splice(i, 1), changed = !0;
            continue;
          }
          const r = renamed.find(rn => rn.from === tags[i]);
          r && (tags[i] = r.to, changed = !0);
        }
        initialEditValues && (initialEditValues.tags = [...(opts.asset.labels || [])].sort()), changed && renderChips(), checkValid();
      });
    }, saveBtn.addEventListener("click", () => {
      if (checkValid(), !saveBtn.disabled) if (closeMenu(), opts.asset) {
        const asset = opts.asset;
        if(!window.AssetAccess.canInfo(asset)){toast('자산 관리 권한이 없습니다.');return;}
        if(!hasAssetManagePermission() && (catValue!==`${asset.group}|${asset.sub}` || nameInput.value.trim()!==asset.product || assetNoInput.value.trim()!==asset.assetNo)){toast('자산 관리 권한이 없습니다.');return;}
        const pending = [],
          logChange = (script, before, after) => {
            pending.push({
              script: `자산 정보 수정: ${script}`,
              before,
              after
            });
          },
          cat = findCat(catValue);
        if (cat && (cat.group !== asset.group || cat.sub !== asset.sub)) {
          const before = `${asset.group} › ${asset.sub}`,
            after = `${cat.group} › ${cat.sub}`;
          asset.group = cat.group, asset.sub = cat.sub, logChange("소분류 이동", before, after);
        }
        const dateFmt = d => d ? window.fmtDate(d) : "",
          setIf = (script, key, val, format) => {
            if (key === "price" ? window.normalizePurchasePrice(asset[key]) === window.normalizePurchasePrice(val) : asset[key] === val) return;
            const setting=key==="price"?"purchasePrice":key;
            if(!window.AssetAccess.canField(asset,setting))return;
            const fmt = format || (v => v || "");
            logChange(script, fmt(asset[key]), fmt(val)), asset[key] = val;
          };
        setIf("품목명 수정", "product", nameInput.value.trim()), setIf("고유관리번호 수정", "assetNo", assetNoInput.value.trim());
        const newTags = [...tags];
        window.AssetAccess.canField(asset,"tags") && JSON.stringify(newTags) !== JSON.stringify(asset.labels || []) && (logChange("태그 수정", (asset.labels || []).join(", "), newTags.join(", ")), asset.labels = newTags);
        const expiry = getExpiry();
        expiry !== null && setIf("유효기한 변경", "expiry", expiry || void 0, dateFmt);
        const monthFmt = d => d ? window.fmtMonth(d) : "",
          manufactured = getManufactured();
        fieldIsShown(manufacturedField) && manufactured !== null && (manufactured || "").slice(0, 7) !== (asset.manufactured || "").slice(0, 7) && (logChange("제조연월 변경", monthFmt(asset.manufactured), monthFmt(manufactured)), asset.manufactured = manufactured || void 0);
        const purchaseDate = getPurchaseDate();
        fieldIsShown(purchaseDateField) && purchaseDate !== null && (purchaseDate || "").slice(0, 7) !== (asset.purchaseDate || "").slice(0, 7) && (logChange("구매연월 변경", monthFmt(asset.purchaseDate), monthFmt(purchaseDate)), asset.purchaseDate = purchaseDate || void 0);
        const price = window.normalizePurchasePrice(purchasePriceInput.value);
        setIf("구매가격 변경", "price", price || void 0, v => v != null ? window.formatPrice(v) : ""), setIf("메모 수정", "note", noteInput.value.trim() || void 0), window.AssetExtra.applyCustom(asset,window.AssetExtra.readInputs(back),e=>pending.push(e)), pending.push(...window.assetPhotoActivities(window.assetPhotos(asset), asset._primary || 0, photos, primaryIdx)), opts.logActivity && window.logAssetActivities(pending, e => opts.logActivity(e)), asset._photos = photos, asset._primary = primaryIdx, back.remove(), toast("저장되었습니다."), opts.onSaved && opts.onSaved();
      } else {
        const cat = findCat(catValue),
          draft = {
            type,
            group: cat.group,
            sub: cat.sub,
            product: nameInput.value.trim(),
            extraValues:window.AssetExtra.readInputs(back),
            assetNo: assetNoInput.value.trim(),
            expiry: getExpiry() || void 0,
            manufactured: getManufactured() || void 0,
            purchaseDate: getPurchaseDate() || void 0,
            serial: serialInput.value.trim() || void 0,
            imei: imeiInput.value.trim() || void 0,
            price: window.normalizePurchasePrice(purchasePriceInput.value) || void 0,
            note: noteInput.value.trim() || void 0,
            labels: [...tags],
            _photos: photos.map(photo => ({
              ...photo
            })),
            _primary: primaryIdx,
            photo: photos[primaryIdx]?.color,
            photoCount: photos.length
          };
        try {
          window.AssetRegistration.registerBatch([draft]);
        } catch (error) {
          error.code === "DUPLICATE_ASSET_NO" && (savedNumberError = assetNoInput.value.trim()), error.code === "DUPLICATE_PRODUCT" && (savedNameError = `${catValue}|${nameInput.value.trim()}`), checkValid(), toast(error.code === "CATEGORY_CHANGED" ? "설정이 변경되었습니다. 잠시 후 다시 시도해주세요." : "입력 내용을 확인해주세요.");
          return;
        }
        back.remove(), window.dispatchEvent(new Event("asset-registered")), opts.onSaved && opts.onSaved(), toast("자산이 추가되었습니다.");
      }
    }), back;
  };
})();
(function () {
  const params = new URLSearchParams(location.search);
  if (params.get("qa") !== "asset-add") return;
  const scenarios = [["default", "기본 입력"], ["empty-category", "분류 없음"], ["empty-tags", "태그 없음"], ["tag-duplicate", "태그 수정 중복"]],
    scenario = scenarios.some(([key]) => key === params.get("scenario")) ? params.get("scenario") : "default";
  scenario === "empty-category" ? (window.DATA.categories = [], window.DATA.assets = [], window.DATA.emptyGroups = []) : scenario === "empty-tags" && (window.DATA.tags = [], window.DATA.assets.forEach(asset => {
    asset.labels = [];
  }));
  function mount() {
    if(!window.PrototypeQa){
    const panel = document.createElement("aside");
    panel.className = "permission-qa-panel", panel.setAttribute("aria-label", "자산 추가 QA 시나리오"), panel.innerHTML = `<div class="permission-qa-head"><strong>자산 추가 QA</strong><button type="button" data-register-qa-close aria-label="QA 종료">×</button></div>
      <div class="permission-qa-actions">${scenarios.map(([key, label]) => `<button type="button" data-register-scenario="${key}" aria-pressed="${key === scenario}">${label}</button>`).join("")}</div>`, document.body.appendChild(panel), panel.querySelectorAll("[data-register-scenario]").forEach(button => {
      button.onclick = () => {
        const next = new URL(location.href);
        next.searchParams.set("scenario", button.dataset.registerScenario), location.href = next.toString();
      };
    }), panel.querySelector("[data-register-qa-close]").onclick = () => {
      const next = new URL(location.href);
      next.searchParams.delete("qa"), next.searchParams.delete("scenario"), location.href = next.toString();
    };
    }
    const cat = window.DATA.categories[0],
      parent = window.openAssetAddModal(cat ? {
        group: cat.group,
        sub: cat.sub
      } : {});
    if (parent && (scenario === "empty-category" && parent.querySelector("#areg-catwrap").click(), (scenario === "empty-tags" || scenario === "tag-duplicate") && (parent.querySelector("#areg-tag-manage").click(), scenario === "tag-duplicate"))) {
      const inputs = document.querySelectorAll("[data-tm-rename]");
      inputs.length >= 2 && (inputs[1].value = inputs[0].value, inputs[1].dispatchEvent(new Event("input", {
        bubbles: !0
      })));
    }
  }
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", mount, {
    once: !0
  }) : mount();
})();
