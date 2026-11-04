// 직원모드 자산 수정 전체 화면(App(E,L)_dc_05). 리더모드(js/leader.js) 자산 추가·수정 폼과 같은 화면·동작을 쓴다.
(function () {
  let ME = "김민수", toast = () => {}, activityLog = a => (a._activityLog ||= []), logActivity = () => {};
  const PHOTO_COLORS = ["#5b8def", "#8f6ef0", "#eb7f8b", "#3fb37f", "#e0a63c", "#4dabf7"];
  const assets = window.DATA.assets;
  function hasAssetManagePermission() { return window.hasPrototypeAssetManagePermission(); }
  const TODAY = /* @__PURE__ */new Date("2026-09-04"),
    esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]),
    normalizeTagName = value => value.trim().replace(/\s+/g, " ");
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
  function formatAddPrice(value) {
    return window.formatPurchasePriceInput(value);
  }
  const CLOSE_ICON_SM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    CAL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></svg>',
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
  function todayStr() {
    const p = n => String(n).padStart(2, "0");
    return `${TODAY.getFullYear()}-${p(TODAY.getMonth() + 1)}-${p(TODAY.getDate())}`;
  }
  function tagColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 997;
    return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
  }
  function mappOverlay(className, zIndex) {
    const back = document.createElement("div");
    back.className = className;
    const screen = document.querySelector(".mapp-screen"),
      r = screen ? screen.getBoundingClientRect() : {
        top: 0,
        left: 0,
        width: 390,
        height: 844
      };
    return back.style.cssText = `position:absolute;top:${r.top + window.scrollY}px;left:${r.left + window.scrollX}px;width:${r.width}px;height:${r.height}px;z-index:${zIndex};`, document.body.appendChild(back), back;
  }
  function openAddDropdown(anchor, items, onPick) {
    document.querySelectorAll(".dropdown-menu").forEach(menu2 => menu2.remove());
    const menu = document.createElement("div");
    menu.className = "dropdown-menu", menu.innerHTML = items.map(item => `<button type="button" data-key="${item.key}">${item.label}</button>`).join("");
    const r = anchor.getBoundingClientRect();
    menu.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${Math.max(8, r.right - 180)}px;min-width:180px`, document.body.appendChild(menu), menu.querySelectorAll("button").forEach(button => button.onclick = () => {
      menu.remove(), onPick(button.dataset.key);
    }), setTimeout(() => {
      const close = event => {
        menu.contains(event.target) || (menu.remove(), document.removeEventListener("click", close));
      };
      document.addEventListener("click", close);
    });
  }
  function openAddMonthSheet(title, initialMonth, onApply) {
    const base = initialMonth || todayStr().slice(0, 7);
    let viewY = Number(base.slice(0, 4)),
      selected = initialMonth || "";
    const maxMonth = todayStr().slice(0, 7),
      back = mappOverlay("mapp-sheet-back", 120);
    back.innerHTML = `<div class="mapp-sheet mapp-add-month-sheet" role="dialog" aria-modal="true" aria-label="${title}">
      ${initialMonth ? '<div class="mapp-add-month-reset"><button type="button" data-add-date-reset>초기화</button></div>' : ""}
      <div class="mapp-sheet-body" data-add-month-body></div>
      <div class="mapp-sheet-foot"><button type="button" data-add-month-cancel>취소</button><button type="button" data-add-month-ok>확인</button></div></div>`;
    const body = back.querySelector("[data-add-month-body]"),
      ok = back.querySelector("[data-add-month-ok]"),
      pad = n => String(n).padStart(2, "0");
    function drawMonths() {
      body.innerHTML = `<div class="mapp-add-month-head"><button type="button" data-month-prev aria-label="이전 해">‹</button><strong>${viewY}</strong><button type="button" data-month-next aria-label="다음 해">›</button></div>
        <div class="mapp-add-month-grid">${Array.from({
        length: 12
      }, (_, index) => {
        const value = `${viewY}-${pad(index + 1)}`;
        return `<button type="button" data-month="${value}" aria-label="${index + 1}월" aria-pressed="${value === selected}" class="${value === selected ? "sel" : ""}"${value > maxMonth ? " disabled" : ""}><span>${pad(index + 1)}</span></button>`;
      }).join("")}</div><div class="mapp-cal-sel">${selected ? selected.replace("-", ".") : ""}</div>`, body.querySelector("[data-month-prev]").onclick = () => {
        viewY--, drawMonths();
      };
      const next = body.querySelector("[data-month-next]");
      next.disabled = viewY >= Number(maxMonth.slice(0, 4)), next.onclick = () => {
        next.disabled || (viewY++, drawMonths());
      }, body.querySelectorAll("[data-month]").forEach(button => button.onclick = () => {
        selected = button.dataset.month, drawMonths();
      }), ok.disabled = !selected;
    }
    drawMonths(), back.querySelector("[data-add-month-cancel]").onclick = () => back.remove();
    const reset = back.querySelector("[data-add-date-reset]");
    reset && (reset.onclick = () => {
      back.remove(), onApply("");
    }), ok.onclick = () => {
      selected && (back.remove(), onApply(selected));
    };
  }
  function catViewPermission(cat) { return window.AssetAccess.scope(cat,'view',ME); }
  function emptyAddDraft(category) {
    return {
      category: category ? `${category.group}|${category.sub}` : "",
      product: "",
      assetNo: "",
      photos: [],
      primaryPhoto: 0,
      expiry: "",
      expiryTouched: !1,
      labels: [],
      serial: "",
      imei: "",
      manufactured: "",
      purchaseDate: "",
      purchasePrice: "",
      note: ""
    };
  }
  function hasAddInput(draft) {
    return (!!draft.category && draft.category !== draft._presetCategory) || !!(draft._categoryDrafts && draft._categoryDrafts.size) || ["product", "assetNo", "expiry", "serial", "imei", "manufactured", "purchaseDate", "purchasePrice", "note"].some(key => String(draft[key] || "").trim()) || draft.photos.length > 0 || draft.labels.length > 0;
  }
  function confirmAddExit(onLeave, editing = !1) {
    const title = editing ? "수정을 취소하시겠습니까?" : "취소하시겠습니까?",
      body = editing ? "취소할 경우 수정한 내용이 저장되지 않습니다." : "취소 시 편집한 내용이 저장되지 않습니다.",
      cb = document.createElement("div");
    cb.className = "modal-back", cb.style.zIndex = 340, cb.innerHTML = `<div class="modal sm" style="width:340px" role="dialog" aria-modal="true" aria-label="${title}">
      <h3>${title}</h3>
      <div class="body" style="font-size:14px">${body}</div>
      <div class="foot"><button type="button" class="btn" data-add-stay>취소</button><button type="button" class="btn primary" data-add-leave>확인</button></div></div>`, document.body.appendChild(cb), cb.querySelector("[data-add-stay]").onclick = () => cb.remove(), cb.querySelector("[data-add-leave]").onclick = () => {
      cb.remove(), onLeave();
    };
  }
  function addCategory(draft) {
    const [group, sub] = (draft.category || "").split("|");
    return window.DATA.categories.find(c => c.group === group && c.sub === sub) || null;
  }
  function formatAddExpiry(value) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    return digits.length > 6 ? `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}` : digits.length > 4 ? `${digits.slice(0, 4)}.${digits.slice(4)}` : digits;
  }
  function parseAddExpiry(value) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (!digits.length) return "";
    if (digits.length !== 8) return null;
    const y = +digits.slice(0, 4),
      m = +digits.slice(4, 6),
      day = +digits.slice(6, 8),
      date = new Date(y, m - 1, day);
    return date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== day ? null : `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
  }
  function addExpiryFieldHtml(draft) {
    const value = draft.expiry || "";
    return `<div class="mapp-add-field"><label>유효기한</label><button type="button" class="mapp-add-date${value ? " selected" : ""}" data-add-date="expiry" data-add-date-mode="day"><span>${value || "선택"}</span>${CAL_ICON}</button></div>`;
  }
  function addDraftValid(draft) {
    const cat = addCategory(draft);
    if (!cat || !catViewPermission(cat) || !draft.product.trim() || draft.nameDupKey || window.AssetExtra.visible(cat,"expiry") && parseAddExpiry(draft.expiry) === null) return !1;
    if (draft.editingId) {
      const asset = assets.find(a => a.id === draft.editingId);
      if (!asset || !canEditInfo(asset) || asset.type !== cat.type) return !1;
    }
    const assetNo = draft.assetNo.trim();
    return (!draft.editingId || !!assetNo) && (draft.editingId ? !assets.some(a => !a.deleted_at && a.id !== draft.editingId && a.assetNo === assetNo) : !draft.assetNoDupValue);
  }
  function addInputHtml(label, key, draft, options) {
    const opts = options || {};
    return `<div class="mapp-add-field"><label for="mapp-add-${key}">${label}${opts.required ? ' <span class="req">*</span>' : ""}</label>
      ${opts.textarea ? `<textarea id="mapp-add-${key}" data-add-field="${key}" maxlength="${opts.maxlength || 500}" placeholder="입력">${esc(draft[key])}</textarea>` : `<input id="mapp-add-${key}" data-add-field="${key}" type="${opts.type || "text"}"${opts.inputmode ? ` inputmode="${opts.inputmode}"` : ""}${opts.maxlength ? ` maxlength="${opts.maxlength}"` : ""}${opts.list ? ` list="${opts.list}"` : ""} value="${esc(draft[key])}" placeholder="입력">`}
      ${opts.hint ? `<p class="hint">${esc(opts.hint)}</p>` : ""}${opts.error ? `<p class="field-err" data-add-error hidden>${opts.error}</p>` : ""}</div>`;
  }
  function addProductFieldHtml(draft) {
    return `<div class="mapp-add-field"><label for="mapp-add-product">품목명 <span class="req">*</span></label>
      <div class="mapp-add-input-wrap"><input id="mapp-add-product" data-add-field="product" type="text" maxlength="50" value="${esc(draft.product)}" placeholder="입력" autocomplete="off" aria-describedby="mapp-add-product-error">
        <div class="mapp-add-suggest" data-add-product-menu hidden></div></div>
      <p id="mapp-add-product-error" class="field-err" data-add-product-error hidden>동일한 명칭이 이미 등록되어 있습니다.</p></div>`;
  }
  function addDateSelectHtml(label, key, draft, mode) {
    const value = draft[key],
      shown = value ? mode === "month" ? value.replace("-", ".") : window.fmtDate(value) : "선택";
    return `<div class="mapp-add-field"><label>${label}</label><button type="button" class="mapp-add-date${value ? " selected" : ""}" data-add-date="${key}" data-add-date-mode="${mode}"><span>${shown}</span>${CAL_ICON}</button></div>`;
  }
  function addTagChipsHtml(labels) {
    return labels.map(tag => {
      const color = tagColor(tag);
      return `<span class="tag-chip" style="background:${color.bg};border-color:${color.fg};color:${color.fg}">${esc(tag)}<button type="button" data-add-tag-remove="${esc(tag)}" aria-label="${esc(tag)} 태그 제거" style="color:${color.fg}">${CLOSE_ICON_SM}</button></span>`;
    }).join("");
  }
  function assetAddTagManageScreenHtml(draft) {
    return `<div class="mapp-add-category-popup"><div class="mapp-topbar mapp-add-category-head"><span class="mapp-topbar-title">태그 관리</span><button type="button" class="mapp-add-category-close" data-add-tag-manage-close aria-label="닫기">×</button></div>
      <div class="mapp-add-tag-manage-body"><div class="mapp-add-tag-create"><input type="text" data-add-tag-create placeholder="입력" maxlength="20"><button type="button" class="btn primary" data-add-tag-create-btn>+ 추가</button></div><p class="field-err" data-add-tag-create-error hidden>동일한 명칭이 존재합니다.</p>
        <div class="mapp-add-tag-manage-list" data-add-tag-manage-list>${draft.map((tag, index) => `<div class="mapp-add-tag-manage-row"><div class="tag-manage-name-field"><input type="text" value="${esc(tag.name)}" maxlength="20" data-add-tag-rename="${index}" aria-describedby="mapp-tag-name-required-${index}"><p class="field-err" id="mapp-tag-name-required-${index}" data-add-tag-required="${index}" hidden>명칭은 필수로 입력해야 합니다.</p></div><button type="button" data-add-tag-delete="${index}" aria-label="태그 삭제">×</button></div>`).join("")}</div>
        ${draft.length ? "" : '<p class="mapp-empty">등록된 태그가 없습니다.</p>'}<p class="field-err" data-add-tag-list-error hidden>동일한 명칭이 존재합니다.</p></div>
      <div class="mapp-add-foot"><button type="button" class="btn primary" data-add-tag-manage-save disabled>저장</button></div></div>`;
  }
  function assetAddScreenHtml(draft) {
    const cat = addCategory(draft),
      hidden = cat ? cat.hiddenFields || [] : [],
      categoryLabel = cat ? `${cat.group} › ${cat.sub}` : "선택",
      photoTiles = draft.photos.map((photo, i) => `<div class="mapp-add-photo-tile${i === draft.primaryPhoto ? " primary" : ""}" style="background:${photo.color}">
      <button type="button" data-add-photo-primary="${i}" aria-label="사진 ${i + 1}${i === draft.primaryPhoto ? " 대표" : ""}">${i === draft.primaryPhoto ? "★" : ""}</button>
      <button type="button" class="mapp-add-photo-delete" data-add-photo-delete="${i}" aria-label="사진 삭제">×</button>
    </div>`).join("");
    return `
      <div class="mapp-topbar mapp-add-topbar">
        <button type="button" class="mapp-back" data-mapp-back aria-label="뒤로">←</button>
        <span class="mapp-topbar-title">${draft.editingId ? "자산 수정" : "자산 추가"}</span>
        ${draft.editingId ? "" : '<button type="button" class="mapp-add-ai-trigger" data-add-ai>AI로 입력</button>'}
      </div>
      <div class="mapp-add-body">
        <div class="mapp-add-field"><label>분류 <span class="req">*</span></label>
          <button type="button" class="mapp-add-select${cat ? " selected" : ""}" data-add-category>${esc(categoryLabel)}<span>›</span></button>
        </div>
        ${addProductFieldHtml(draft)}
        ${`
          <div class="mapp-add-field"><label>사진</label><div class="mapp-add-photos">${photoTiles}<button type="button" class="mapp-add-photo-plus" data-add-photo aria-label="사진 추가">+</button></div></div>
          ${addInputHtml("고유관리번호", "assetNo", draft, {
      required: !!draft.editingId,
      hint: draft.editingId ? "" : window.ASSET_NUMBER_GUIDE,
      maxlength: 30,
      error: "동일한 고유관리번호가 존재합니다."
    })}${draft.editingId, ""}

          <div class="mapp-add-field"><div class="mapp-add-field-label"><label>태그</label><button type="button" data-add-tag-manage>태그 관리</button></div><p class="hint mapp-add-tag-hint">최대 10개까지 선택할 수 있습니다.</p>
            <div class="mapp-add-tag-picker"><div class="tag-input-wrap"><div class="tag-chips" data-add-tag-chips>${addTagChipsHtml(draft.labels)}</div><input type="text" data-add-tag-search placeholder="${draft.labels.length ? "" : "검색"}" autocomplete="off"${draft.labels.length >= window.ASSET_TAG_MAX_COUNT ? " disabled" : ""}></div><div class="mapp-add-suggest" data-add-tag-menu hidden></div></div></div>
          <fieldset class="asset-fixed-inputs">
          ${cat && !window.AssetExtra.visible(cat,"expiry",hasAssetManagePermission()) ? "" : addExpiryFieldHtml(draft)}
          ${cat && !window.AssetExtra.visible(cat,"manufactured") ? "" : addDateSelectHtml("제조연월", "manufactured", draft, "month")}
          ${cat && !window.AssetExtra.visible(cat,"purchaseDate") ? "" : addDateSelectHtml("구매연월", "purchaseDate", draft, "month")}
          ${cat && !window.AssetExtra.visible(cat,"purchasePrice") ? "" : addInputHtml("구매가격", "purchasePrice", draft, {
      inputmode: "decimal",
      maxlength: 21
    })}
          </fieldset>
          ${addInputHtml("메모", "note", draft, {
      textarea: !0,
      maxlength: 500
    })}
          ${window.AssetExtra.customInputs(cat,draft.extraValues||{},'data-mobile-extra',hasAssetManagePermission()) ? `<section class="extra-info-section"><h4>추가 정보</h4>${window.AssetExtra.customInputs(cat,draft.extraValues||{},'data-mobile-extra',hasAssetManagePermission())}</section>` : ""}`}
      </div>
      <div class="mapp-add-foot"><button type="button" class="btn primary" data-add-save${addDraftValid(draft) && editDirty(draft) ? "" : " disabled"}>저장</button></div>`;
  }
  function assetAddCategoryScreenHtml(draft) {
    const categories = new URLSearchParams(location.search).get("qa") === "add-category-empty" ? [] : window.DATA.categories.filter(cat => catViewPermission(cat) && (!draft.editingId || cat.type === assets.find(a => a.id === draft.editingId).type)),
      groups = [];
    return categories.forEach(cat => {
      let group = groups.find(g => g.name === cat.group);
      group || (group = {
        name: cat.group,
        items: []
      }, groups.push(group)), group.items.push(cat);
    }), `
      <div class="mapp-add-category-popup">
      <div class="mapp-topbar mapp-add-category-head">
        <span class="mapp-topbar-title">분류</span>
        <button type="button" class="mapp-add-category-close" data-add-category-close aria-label="닫기">×</button>
      </div>
      <div class="mapp-add-category-body">
        ${groups.length ? `<div class="mapp-directory-search"><input type="search" data-add-category-search placeholder="검색" aria-label="분류 검색" autocomplete="off"></div>
        <div data-add-category-list>${groups.map(group => `<section class="mapp-add-category-group" data-add-category-group data-group-name="${esc(group.name)}">
          <h2>${esc(group.name)}</h2>${group.items.map(cat => { const cur = `${cat.group}|${cat.sub}` === draft.category; return `<button type="button" data-add-category-pick="${esc(`${cat.group}|${cat.sub}`)}" data-sub-name="${esc(cat.sub)}" aria-pressed="${cur}"${cur ? ' style="color:#1f6feb;font-weight:600"' : ""}><span>${esc(cat.sub)}</span>${cur ? '<span aria-hidden="true" style="margin-left:auto">✓</span>' : ""}</button>`; }).join("")}
        </section>`).join("")}</div>
        <p class="mapp-ws-empty" data-add-category-empty hidden>결과가 없습니다.</p>` : '<p class="mapp-ws-empty">표시할 목록이 없습니다.</p>'}
      </div>
      </div>`;
  }
  function canManage(a) { return window.AssetAccess.canState(a,ME); }
  function canEditInfo(a) { return window.AssetAccess.canInfo(a,ME); }

  function derivedActiveStatus(a) {
    return (a.assignments || []).length ? "assigned" : "stock";
  }
  function categoryPath(a) {
    return `${esc(a.group)} › ${esc(a.sub)}`;
  }
  function editDraftFor(a) {
    return {
      ...emptyAddDraft({
        group: a.group,
        sub: a.sub
      }),
      editingId: a.id,
      extraValues:{...(a.extraValues||{})},
      product: a.product,
      assetNo: a.assetNo || "",
      photos: window.assetPhotos(a).map(p => ({
        ...p
      })),
      primaryPhoto: a._primary || 0,
      expiry: (a.expiry || "").replaceAll("-", "."),
      labels: [...(a.labels || [])],
      serial: a.serial || "",
      imei: a.imei || "",
      manufactured: (a.manufactured || "").slice(0, 7),
      purchaseDate: (a.purchaseDate || "").slice(0, 7),
      purchasePrice: a.price == null ? "" : formatAddPrice(String(a.price)),
      note: a.note || ""
    };
  }
  function draftSnapshot(draft) {
    return JSON.stringify({
      extraValues:draft.extraValues||{},
      category: draft.category,
      product: draft.product.trim(),
      assetNo: draft.assetNo.trim(),
      photos: draft.photos,
      primaryPhoto: draft.primaryPhoto,
      expiry: parseAddExpiry(draft.expiry) ?? draft.expiry.trim(),
      labels: [...draft.labels].sort(),
      serial: draft.serial.trim(),
      imei: draft.imei.trim(),
      manufactured: draft.manufactured,
      purchaseDate: draft.purchaseDate,
      purchasePrice: window.normalizePurchasePrice(draft.purchasePrice),
      note: draft.note.trim()
    });
  }
  function editDirty(draft) {
    return !draft.editingId || draftSnapshot(draft) !== draftSnapshot(editDraftFor(assets.find(a => a.id === draft.editingId)));
  }
  function applyAssetEdit(a, draft) {
    if(!canEditInfo(a))return;
    if(!hasAssetManagePermission()){
      draft.category=`${a.group}|${a.sub}`;draft.product=a.product;draft.assetNo=a.assetNo;
    }
    if(!window.AssetAccess.canField(a,'tags',ME))draft.labels=[...(a.labels||[])];
    if(!window.AssetAccess.canField(a,'memo',ME))draft.note=a.note||'';
    activityLog(a);
    const cat = addCategory(draft),
      pending = [],
      set = (key, value, script, format = v => v || "") => {
        (key === "price" ? window.normalizePurchasePrice(a[key]) === window.normalizePurchasePrice(value) : (a[key] ?? "") === (value ?? "")) || (pending.push({
          script: `자산 정보 수정: ${script}`,
          before: format(a[key]),
          after: format(value)
        }), a[key] = value);
      };
    (a.group !== cat.group || a.sub !== cat.sub) && (pending.push({
      script: "자산 정보 수정: 소분류 변경",
      before: `${a.group} › ${a.sub}`,
      after: `${cat.group} › ${cat.sub}`
    }), a.group = cat.group, a.sub = cat.sub), set("product", draft.product.trim(), "품목명 수정"), set("assetNo", draft.assetNo.trim(), "고유관리번호 수정"), JSON.stringify(a.labels || []) !== JSON.stringify(draft.labels) && (pending.push({
      script: "자산 정보 수정: 태그 수정",
      before: (a.labels || []).join(", "),
      after: draft.labels.join(", ")
    }), a.labels = [...draft.labels]);
    window.AssetExtra.applyCustom(a,draft.extraValues||{},e=>logActivity(a,e));
    const expiry = parseAddExpiry(draft.expiry);
    window.AssetExtra.visible(cat,"expiry",hasAssetManagePermission()) && expiry !== null && set("expiry", expiry || void 0, "유효기한 변경", v => v ? window.fmtDate(v) : "");
    for (const [key, script] of [["manufactured", "제조연월 변경"], ["purchaseDate", "구매연월 변경"]]) window.AssetExtra.visible(cat,key,hasAssetManagePermission()) && (a[key] || "").slice(0, 7) !== draft[key] && set(key, draft[key] ? `${draft[key]}-01` : void 0, script, v => v ? window.fmtMonth(v) : "");
    window.AssetExtra.visible(cat,"purchasePrice",hasAssetManagePermission()) && set("price", window.normalizePurchasePrice(draft.purchasePrice) || void 0, "구매가격 변경", v => v == null ? "" : window.formatPrice(v)), set("note", draft.note.trim() || void 0, "메모 수정"), pending.push(...window.assetPhotoActivities(window.assetPhotos(a), a._primary || 0, draft.photos, draft.primaryPhoto)), window.logAssetActivities(pending, e => logActivity(a, e)), a._photos = draft.photos.map(p => ({
      ...p
    })), a._primary = draft.primaryPhoto, a.photo = draft.photos[draft.primaryPhoto]?.color || null, a.photoCount = draft.photos.length;
  }
  function openDateSheet(initialIso, maxIso, onApply, options = {}) {
    const [by, bm] = (initialIso || maxIso || todayStr()).split("-").map(Number);
    let viewY = by,
      viewM = bm - 1,
      selected = initialIso || "",
      yearMode = !1,
      yearStart = by - 3;
    const maxY = maxIso ? Number(maxIso.slice(0, 4)) : 1 / 0,
      back = mappOverlay("mapp-sheet-back", 110);
    back.innerHTML = `
      <div class="mapp-sheet">
        ${options.reset && initialIso ? '<div class="mapp-add-month-reset"><button type="button" data-cal-reset>초기화</button></div>' : ""}
        <div class="mapp-sheet-body" data-cal-body style="padding-top:16px"></div>
        <div class="mapp-sheet-foot">
          <button type="button" class="btn" data-cal-cancel>취소</button>
          <button type="button" class="btn primary" data-cal-ok>확인</button>
        </div>
      </div>`;
    const body = back.querySelector("[data-cal-body]"),
      okBtn = back.querySelector("[data-cal-ok]"),
      WD = ["일", "월", "화", "수", "목", "금", "토"],
      pad = n => String(n).padStart(2, "0"),
      isoOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
    function drawYears() {
      body.innerHTML = `
        <div class="mapp-cal-head">
          <button type="button" data-year-prev aria-label="이전 연도 목록">‹</button>
          <span class="mapp-cal-ym">${yearStart} - ${yearStart + 11}</span>
          <button type="button" data-year-next aria-label="다음 연도 목록"${yearStart + 12 > maxY ? " disabled" : ""}>›</button>
        </div>
        <div class="mapp-add-month-grid mapp-cal-year-grid">${Array.from({
        length: 12
      }, (_, i) => yearStart + i).map(y => `<button type="button" data-cal-year="${y}" class="${y === viewY ? "sel" : ""}"${y > maxY ? " disabled" : ""}><span>${y}</span></button>`).join("")}</div>`, body.querySelector("[data-year-prev]").onclick = () => {
        yearStart -= 12, drawYears();
      }, body.querySelector("[data-year-next]").onclick = () => {
        yearStart + 12 <= maxY && (yearStart += 12, drawYears());
      }, body.querySelectorAll("[data-cal-year]").forEach(b => b.onclick = () => {
        viewY = Number(b.dataset.calYear), yearMode = !1, drawCal();
      });
    }
    function drawCal() {
      if (yearMode) return drawYears();
      const startDow = new Date(viewY, viewM, 1).getDay(),
        daysInMonth = new Date(viewY, viewM + 1, 0).getDate(),
        cells = Array(startDow).fill(null).concat(Array.from({
          length: daysInMonth
        }, (_, i) => i + 1)),
        rows = [];
      for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
      body.innerHTML = `
        <div class="mapp-cal-head">
          <button type="button" data-cal-prev aria-label="이전 달">‹</button>
          <button type="button" class="mapp-cal-ym" data-cal-ym aria-label="연도 선택">${viewY}.${pad(viewM + 1)}</button>
          <button type="button" data-cal-next aria-label="다음 달">›</button>
          <button type="button" class="mapp-cal-today" data-cal-today>오늘</button>
        </div>
        <div class="mapp-cal-wd">${WD.map(w => `<span>${w}</span>`).join("")}</div>
        <div class="mapp-cal-grid">${rows.map(row => row.map(d => {
        if (d === null) return '<span class="mapp-cal-cell empty"></span>';
        const iso = isoOf(viewY, viewM, d),
          cls = ["mapp-cal-cell"];
        return iso === selected ? cls.push("sel") : iso === todayStr() && cls.push("today"), `<button type="button" class="${cls.join(" ")}" data-cal-day="${iso}"${maxIso && iso > maxIso ? " disabled" : ""}>${d}</button>`;
      }).join("")).join("")}</div>
        <div class="mapp-cal-sel">${selected ? window.fmtDate(selected) : '<span class="muted">선택</span>'}</div>`, body.querySelector("[data-cal-ym]").onclick = () => {
        yearMode = !0, yearStart = viewY - 3, drawCal();
      }, body.querySelector("[data-cal-prev]").onclick = () => {
        viewM--, viewM < 0 && (viewM = 11, viewY--), drawCal();
      }, body.querySelector("[data-cal-next]").onclick = () => {
        viewM++, viewM > 11 && (viewM = 0, viewY++), drawCal();
      }, body.querySelector("[data-cal-today]").onclick = () => {
        const [ty, tm] = todayStr().split("-").map(Number);
        viewY = ty, viewM = tm - 1, selected = todayStr(), drawCal();
      }, body.querySelectorAll("[data-cal-day]").forEach(b => b.onclick = () => {
        selected = b.dataset.calDay, drawCal();
      }), okBtn.disabled = !selected;
    }
    drawCal(), back.querySelector("[data-cal-cancel]").onclick = () => back.remove();
    const calReset = back.querySelector("[data-cal-reset]");
    calReset && (calReset.onclick = () => {
      back.remove(), onApply("");
    }), okBtn.onclick = () => {
      selected && (back.remove(), onApply(selected));
    };
  }
  function open(opts) {
    ME = opts.me || ME, toast = opts.toast || toast, activityLog = opts.activityLog || activityLog, logActivity = opts.logActivity || logActivity;
    const asset = opts.asset;
    if (!asset || !canEditInfo(asset)) return;
    const state = { screen: "asset-add", addDraft: editDraftFor(asset), tagManageDraft: null };
    const back = mappOverlay("mapp-fullpage-back", 90);
    let root = back;
    function close() { back.remove(); }
    function draw() {
      const html = state.screen === "asset-add-category" ? assetAddCategoryScreenHtml(state.addDraft) : state.screen === "asset-add-tags" ? assetAddTagManageScreenHtml(state.tagManageDraft) : assetAddScreenHtml(state.addDraft);
      back.innerHTML = `<div class="mapp-screen" style="position:absolute;inset:0;overflow:auto;background:#fff">${html}</div>`;
      root = back;
      const backBtn = root.querySelector("[data-mapp-back]");
      backBtn && (backBtn.onclick = () => {
        const d = state.addDraft;
        ["product","assetNo","purchasePrice","note"].forEach(k => { const el = root.querySelector(`[data-add-field="${k}"]`); el && (d[k] = el.value); });
        editDirty(d) ? confirmAddExit(close, !0) : close();
      });
      if (state.screen === "asset-add") {
        let syncAddDraft2 = function () {
            draft.extraValues={...(draft.extraValues||{}),...window.AssetExtra.readInputs(root,'data-mobile-extra')};
            ["product", "assetNo", "expiry", "serial", "imei", "manufactured", "purchaseDate", "purchasePrice", "note"].forEach(key => {
              const input = field(key);
              input && (draft[key] = input.value);
            });
          },
          updateAddValidity2 = function () {
            syncAddDraft2();
            const cat = addCategory(draft);
            draft.nameDupKey && draft.nameDupKey !== `${draft.category}|${draft.product.trim()}` && (draft.nameDupKey = null);
            const nameDuplicate = !!draft.nameDupKey,
              nameInput = field("product");
            root.querySelector("[data-add-product-error]").hidden = !nameDuplicate, nameInput.classList.toggle("has-err", nameDuplicate), nameInput.setAttribute("aria-invalid", String(nameDuplicate)), draft.assetNoDupValue !== draft.assetNo.trim() && (draft.assetNoDupValue = null);
            const duplicate = cat && !0 && !!draft.assetNo.trim() && (draft.editingId ? assets.some(a => !a.deleted_at && a.id !== draft.editingId && a.assetNo === draft.assetNo.trim()) : !!draft.assetNoDupValue),
              error = root.querySelector("[data-add-error]");
            error && (error.hidden = !duplicate);
            const assetNoInput = field("assetNo");
            assetNoInput && assetNoInput.classList.toggle("has-err", duplicate);
            const expiryInput2 = field("expiry");
            if (expiryInput2) {
              const showError = draft.expiryTouched && parseAddExpiry(draft.expiry) === null;
              root.querySelector("[data-add-expiry-error]").hidden = !showError, expiryInput2.classList.toggle("has-err", showError), expiryInput2.setAttribute("aria-invalid", String(!!showError));
            }
            const save2 = root.querySelector("[data-add-save]");
            save2 && (save2.disabled = !addDraftValid(draft) || !editDirty(draft));
          },
          renderProductMenu2 = function () {
            if(productInput.readOnly)return;
            const query = productInput.value.trim().toLowerCase(),
              options = query ? productNames.filter(name => name.toLowerCase().includes(query)) : productNames;
            productMenu.innerHTML = options.map(name => `<button type="button" data-add-product-pick="${esc(name)}">${esc(name)}</button>`).join(""), productMenu.hidden = !options.length, productMenu.querySelectorAll("[data-add-product-pick]").forEach(button => button.onclick = () => {
              productInput.value = button.dataset.addProductPick, draft.product = productInput.value, productMenu.hidden = !0, updateAddValidity2();
            });
          },
          renderSelectedTags2 = function () {
            !tagChips || !tagSearch || (tagChips.innerHTML = addTagChipsHtml(draft.labels), tagSearch.disabled = draft.labels.length >= window.ASSET_TAG_MAX_COUNT, tagSearch.placeholder = draft.labels.length ? "" : "검색", tagChips.querySelectorAll("[data-add-tag-remove]").forEach(button => button.onclick = () => {
              draft.labels = draft.labels.filter(tag => tag !== button.dataset.addTagRemove), renderSelectedTags2(), updateAddValidity2(), tagMenu.hidden = !0;
            }));
          },
          renderTagMenu2 = function () {
            if (!tagSearch || draft.labels.length >= window.ASSET_TAG_MAX_COUNT) {
              tagMenu && (tagMenu.hidden = !0);
              return;
            }
            const query = tagSearch.value.trim().toLowerCase(),
              options = (window.DATA.tags || []).filter(tag => !draft.labels.includes(tag) && (!query || tag.toLowerCase().includes(query)));
            tagMenu.innerHTML = options.length ? options.map(tag => `<button type="button" data-add-tag-pick="${esc(tag)}">${esc(tag)}</button>`).join("") : '<div class="mapp-add-suggest-empty">결과가 없습니다.</div>', tagMenu.hidden = !1, tagMenu.querySelectorAll("[data-add-tag-pick]").forEach(button => button.onclick = () => {
              draft.labels.length < window.ASSET_TAG_MAX_COUNT && draft.labels.push(button.dataset.addTagPick), tagSearch.value = "", tagMenu.hidden = !0, renderSelectedTags2(), updateAddValidity2();
            });
          };
        var syncAddDraft = syncAddDraft2,
          updateAddValidity = updateAddValidity2,
          renderProductMenu = renderProductMenu2,
          renderSelectedTags = renderSelectedTags2,
          renderTagMenu = renderTagMenu2;
        const draft = state.addDraft,
          field = key => root.querySelector(`[data-add-field="${key}"]`);
        root.querySelectorAll("[data-mobile-extra]").forEach(el=>el.addEventListener("input",updateAddValidity2));
        window.AssetMemo.mountTextarea(field("note")), root.querySelector("[data-add-category]").onclick = () => {
          syncAddDraft2(), state.screen = "asset-add-category", draw();
        };
        const aiInput = root.querySelector("[data-add-ai]");
        aiInput && (aiInput.onclick = () => {
          syncAddDraft2(), openMobileAiInput(draft, draw, () => {
            state.screen = "asset-add-category", draw();
          });
        });
        const priceInput = root.querySelector('[data-add-field="purchasePrice"]');
        priceInput && window.bindPurchasePriceInput(priceInput), root.querySelectorAll("[data-add-field]").forEach(input => input.addEventListener("input", () => {
          if (input.dataset.addField === "assetNo") {
            const pos = input.selectionStart,
              before = input.value;
            input.value = before.replace(/[^A-Za-z0-9\-_]/g, ""), input.value !== before && pos != null && input.setSelectionRange(Math.max(0, pos - 1), Math.max(0, pos - 1));
          }
          input.dataset.addField === "expiry" && (input.value = formatAddExpiry(input.value)), updateAddValidity2();
        }));
        const expiryInput = field("expiry");
        expiryInput && expiryInput.addEventListener("blur", () => {
          draft.expiryTouched = !0, updateAddValidity2();
        });
        const productInput = field("product"),
          productMenu = root.querySelector("[data-add-product-menu]"),
          currentCat = addCategory(draft),
          productNames = currentCat ? window.AssetProducts.list(currentCat.group,currentCat.sub).map(p=>p.name) : [];
        productInput.addEventListener("focus", renderProductMenu2), productInput.addEventListener("input", renderProductMenu2), productInput.addEventListener("blur", () => setTimeout(() => {
          productMenu.hidden = !0;
        }, 120));
        const tagSearch = root.querySelector("[data-add-tag-search]"),
          tagMenu = root.querySelector("[data-add-tag-menu]"),
          tagChips = root.querySelector("[data-add-tag-chips]");
        tagSearch && (renderSelectedTags2(), tagSearch.addEventListener("focus", renderTagMenu2), tagSearch.addEventListener("input", renderTagMenu2), tagSearch.addEventListener("blur", () => setTimeout(() => {
          tagMenu.hidden = !0;
        }, 120)));
        const tagManage = root.querySelector("[data-add-tag-manage]");
        tagManage && (tagManage.onclick = () => {
          syncAddDraft2(), state.tagManageDraft = (window.DATA.tags || []).map(tag => ({
            name: tag,
            orig: tag
          })), state.screen = "asset-add-tags", draw();
        }), root.querySelectorAll("[data-add-date]").forEach(button => button.onclick = () => {
          syncAddDraft2();
          const key = button.dataset.addDate,
            apply = value => {
              draft[key] = key === "expiry" ? value.replaceAll("-", ".") : value, updateAddValidity2();
              const shown = value ? button.dataset.addDateMode === "month" ? value.replace("-", ".") : value.replaceAll("-", ".") : "선택";
              button.classList.toggle("selected", !!value), button.innerHTML = `<span>${shown}</span>${CAL_ICON}`;
            };
          key === "expiry" ? openDateSheet(parseAddExpiry(draft.expiry) || "", null, apply, {
            reset: !0
          }) : openAddMonthSheet(key === "manufactured" ? "제조연월" : "구매연월", draft[key], apply);
        }), root.querySelectorAll("[data-add-photo-primary]").forEach(button => button.onclick = () => {
          syncAddDraft2(), draft.primaryPhoto = +button.dataset.addPhotoPrimary, draw();
        }), root.querySelectorAll("[data-add-photo-delete]").forEach(button => button.onclick = () => {
          syncAddDraft2();
          const index = +button.dataset.addPhotoDelete;
          draft.photos.splice(index, 1), !draft.photos.length || draft.primaryPhoto === index ? draft.primaryPhoto = 0 : draft.primaryPhoto > index && (draft.primaryPhoto -= 1), draw();
        });
        const addPhoto = root.querySelector("[data-add-photo]");
        addPhoto && (addPhoto.onclick = () => {
          if (draft.photos.length >= window.ASSET_PHOTO_MAX_COUNT) {
            toast(`사진은 최대 ${window.ASSET_PHOTO_MAX_COUNT}개까지 등록할 수 있습니다.`);
            return;
          }
          syncAddDraft2(), openAddDropdown(addPhoto, [{
            key: "camera",
            label: "카메라로 촬영하기"
          }, {
            key: "gallery",
            label: "갤러리에서 불러오기"
          }], () => {
            draft.photos.push({
              id: window.assetPhotoId(),
              color: PHOTO_COLORS[draft.photos.length % PHOTO_COLORS.length],
              at: `${todayStr()} 00:00`,
              by: ME
            }), draw();
          });
        });
        if(draft.editingId)window.AssetAccess.protectForm(root,assets.find(a=>a.id===draft.editingId),true);
        const save = root.querySelector("[data-add-save]");
        save && (save.onclick = () => {
          if (updateAddValidity2(), !addDraftValid(draft) || !editDirty(draft)) return;
          applyAssetEdit(asset, draft), window.AssetProducts.reconcile(), close(), opts.onSaved && opts.onSaved(), toast("저장되었습니다.");
        }), updateAddValidity2();
      }
      if (state.screen === "asset-add-category") {
        root.querySelector("[data-add-category-close]").onclick = () => {
          state.screen = "asset-add", draw();
        };
        const categorySearch = root.querySelector("[data-add-category-search]");
        categorySearch && categorySearch.addEventListener("input", () => {
          const q = categorySearch.value.trim().toLowerCase();
          let shown = 0;
          root.querySelectorAll("[data-add-category-group]").forEach(group => {
            const groupMatches = !q || group.dataset.groupName.toLowerCase().includes(q);
            let visible = 0;
            group.querySelectorAll("[data-add-category-pick]").forEach(row => {
              row.hidden = !(groupMatches || row.dataset.subName.toLowerCase().includes(q)), row.hidden || visible++;
            }), group.hidden = !visible, shown += visible;
          }), root.querySelector("[data-add-category-empty]").hidden = shown > 0;
        }), [...root.querySelectorAll("[data-add-category-pick]")].forEach(row => row.onclick = () => {
          const previous = state.addDraft,
            product = previous.product,
            category = addCategory({
              category: row.dataset.addCategoryPick
            });
          if (catViewPermission(category)) {
            if (previous.editingId) previous.category = row.dataset.addCategoryPick;
            else if (row.dataset.addCategoryPick !== previous.category) {
              if (!previous.category) {
                // Preserve all basic inputs when choosing the first category.
                previous.category = row.dataset.addCategoryPick;
                if (previous._pendingAiOnce) {
                  const pending = previous._pendingAiOnce;
                  delete previous._pendingAiOnce;
                  if (pending.extraOnly) {
                    previous.extraValues ||= {};
                    Object.entries(pending.extraValues).forEach(([k, v]) => { !String(previous.extraValues[k] || "").trim() && v && (previous.extraValues[k] = String(v)); });
                  } else applyMobileAiDraft(previous, pending, { replace: true });
                }
              } else {
                const cache = previous._categoryDrafts || new Map();
                cache.set(previous.category, copyCategoryDraft(previous));
                state.addDraft = cache.has(row.dataset.addCategoryPick)
                  ? copyCategoryDraft(cache.get(row.dataset.addCategoryPick))
                  : emptyAddDraft(category);
                state.addDraft.product = product;
                state.addDraft._categoryDrafts = cache;
              }
            }
            state.screen = "asset-add", draw();
          }
        });
      }
      if (state.screen === "asset-add-tags") {
        let duplicateNames2 = function () {
            const counts = {};
            return tagDraft.forEach(tag => {
              const name = normalizeTagName(tag.name);
              name && (counts[name] = (counts[name] || 0) + 1);
            }), new Set(Object.keys(counts).filter(name => counts[name] > 1));
          },
          tagManageDirty2 = function () {
            const next = [...new Set(tagDraft.map(tag => normalizeTagName(tag.name)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko")),
              before = [...master].sort((a, b) => a.localeCompare(b, "ko"));
            return next.length !== before.length || next.some((name, index) => name !== before[index]);
          },
          updateTagManageValidity2 = function () {
            const duplicates = duplicateNames2();
            list.querySelectorAll("[data-add-tag-rename]").forEach(input => {
              const name = normalizeTagName(input.value),
                invalid = !name || duplicates.has(name);
              input.classList.toggle("has-err", invalid), input.setAttribute("aria-invalid", String(invalid));
              let duplicateError = input.parentElement.querySelector("[data-tag-duplicate-error]");
              duplicateError || (duplicateError = document.createElement("p"), duplicateError.className = "field-err", duplicateError.dataset.tagDuplicateError = "", input.after(duplicateError)), duplicateError.textContent = "동일한 명칭이 존재합니다.", duplicateError.hidden = !duplicates.has(name), list.querySelector(`[data-add-tag-required="${input.dataset.addTagRename}"]`).hidden = !!name;
            }), listError.hidden = !0;
            const createName = normalizeTagName(createInput.value),
              createDuplicate = !!createName && tagDraft.some(tag => normalizeTagName(tag.name) === createName);
            createInput.classList.toggle("has-err", createDuplicate), createError.hidden = !createDuplicate, createButton.disabled = !createName || createDuplicate, saveButton.disabled = !tagManageDirty2() || !!duplicates.size || tagDraft.some(tag => !normalizeTagName(tag.name));
          },
          addManagedTag2 = function () {
            const name = normalizeTagName(createInput.value);
            if (!name || tagDraft.some(tag => normalizeTagName(tag.name) === name)) {
              updateTagManageValidity2();
              return;
            }
            tagDraft.unshift({
              name,
              orig: null
            }), draw();
          };
        var duplicateNames = duplicateNames2,
          tagManageDirty = tagManageDirty2,
          updateTagManageValidity = updateTagManageValidity2,
          addManagedTag = addManagedTag2;
        const tagDraft = state.tagManageDraft,
          master = window.DATA.tags || [],
          list = root.querySelector("[data-add-tag-manage-list]"),
          listError = root.querySelector("[data-add-tag-list-error]"),
          createInput = root.querySelector("[data-add-tag-create]"),
          createButton = root.querySelector("[data-add-tag-create-btn]"),
          createError = root.querySelector("[data-add-tag-create-error]"),
          saveButton = root.querySelector("[data-add-tag-manage-save]");
        bindTagNameInput(createInput, updateTagManageValidity2), createInput.addEventListener("keydown", event => {
          event.key === "Enter" && (event.preventDefault(), addManagedTag2());
        }), createButton.onclick = addManagedTag2, list.querySelectorAll("[data-add-tag-rename]").forEach(input => bindTagNameInput(input, () => {
          tagDraft[+input.dataset.addTagRename].name = input.value, updateTagManageValidity2();
        })), list.querySelectorAll("[data-add-tag-delete]").forEach(button => button.onclick = () => {
          tagDraft.splice(+button.dataset.addTagDelete, 1), draw(), toast("삭제 시 이 태그를 사용 중인 자산에서 모두 삭제됩니다.");
        }), root.querySelector("[data-add-tag-manage-close]").onclick = () => {
          const leaveTagManage = () => { state.tagManageDraft = null, state.screen = "asset-add", draw(); };
          tagManageDirty2() ? confirmAddExit(leaveTagManage, !0) : leaveTagManage();
        }, saveButton.onclick = () => {
          if (updateTagManageValidity2(), saveButton.disabled) return;
          const finalNames = [...new Set(tagDraft.map(tag => normalizeTagName(tag.name)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ko")),
            remainingOriginals = new Set(tagDraft.filter(tag => tag.orig).map(tag => tag.orig)),
            deleted = master.filter(tag => !remainingOriginals.has(tag)),
            renamed = tagDraft.filter(tag => tag.orig && tag.orig !== normalizeTagName(tag.name)).map(tag => ({
              from: tag.orig,
              to: normalizeTagName(tag.name)
            })),
            updateLabels = labels => (labels || []).filter(label => !deleted.includes(label)).map(label => {
              const rename = renamed.find(item => item.from === label);
              return rename ? rename.to : label;
            }).filter((label, index, all) => finalNames.includes(label) && all.indexOf(label) === index);
          [...assets, ...(window.DATA.deletedAssets || [])].forEach(asset => {
            asset.labels = updateLabels(asset.labels);
          }), state.addDraft.labels = updateLabels(state.addDraft.labels), master.length = 0, master.push(...finalNames), state.tagManageDraft = null, state.screen = "asset-add", draw(), toast("저장되었습니다.");
        }, updateTagManageValidity2();
      }
    }
    draw();
  }
  window.MappAssetEdit = { open };
})();
