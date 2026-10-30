(function () {
  const {
      categories,
      assets
    } = window.DATA,
    categoryQa = new URLSearchParams(window.location.search).get("qa");
  if (categoryQa === "empty-subcategory") {
    const groupNames = [...new Set(categories.map(c => c.group))].slice(0, 2);
    categories.length = 0, assets.length = 0, window.DATA.emptyGroups.splice(0, window.DATA.emptyGroups.length, ...groupNames);
  } else categoryQa === "empty-category" && (categories.length = 0, assets.length = 0, window.DATA.emptyGroups.length = 0);
  function toast(msg) {
    const t = document.createElement("div");
    t.textContent = msg, t.style.cssText = "position:fixed;left:50%;bottom:32px;transform:translateX(-50%);background:#1b1d1f;color:#fff;padding:10px 16px;border-radius:8px;font-size:12.5px;z-index:300", document.body.appendChild(t), setTimeout(() => t.remove(), 1800);
  }
  function confirmModal(title, body, onOk) {
    const cb = document.createElement("div");
    cb.className = "modal-back", cb.style.zIndex = 340, cb.innerHTML = `
      <div class="modal" style="width:380px">
        <div class="body" style="padding-top:20px">
          <p style="font-size:14px;font-weight:700;margin-bottom:6px">${title}</p>
          <p class="hint" style="margin-top:0">${body}</p>
        </div>
        <div class="foot">
          <button class="btn" data-cclose>취소</button>
          <button class="btn primary" data-cok>확인</button>
        </div>
      </div>`, cb.querySelector("[data-cclose]").onclick = () => cb.remove(), cb.querySelector("[data-cok]").onclick = () => {
      cb.remove(), onOk();
    }, document.body.appendChild(cb);
  }
  const TRASH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M9.5 7l.7 13a1 1 0 0 0 1 1h5.6a1 1 0 0 0 1-1l.7-13"/></svg>',
    HANDLE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    BACK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
    CLOSE_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    RESET_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 1 2.64 6.36"/><path d="M3 20v-6h6"/></svg>',
    INFO_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 8v.01"/></svg>',
    VIEW_OPTIONS = ["회사의 모든 구성원", "모든 관리자 및 리더", "특정 그룹 및 직무/직급", "특정 관리자/리더", "관리자만"],
    ASSIGN_BY_VIEW = {
      "회사의 모든 구성원": {
        options: VIEW_OPTIONS,
        default: "모든 관리자 및 리더"
      },
      "모든 관리자 및 리더": {
        options: ["모든 관리자 및 리더", "특정 그룹 및 직무/직급", "특정 관리자/리더", "관리자만"],
        default: "모든 관리자 및 리더"
      },
      "특정 그룹 및 직무/직급": {
        options: ["특정 그룹 및 직무/직급"],
        default: "특정 그룹 및 직무/직급"
      },
      "특정 관리자/리더": {
        options: ["특정 관리자/리더"],
        default: "특정 관리자/리더"
      },
      관리자만: {
        options: ["관리자만", "특정 관리자/리더"],
        default: "관리자만"
      }
    },
    TARGET_NEEDED = /* @__PURE__ */new Set(["특정 그룹 및 직무/직급", "특정 관리자/리더"]),
    GROUP_TREE = [{
      name: "샤플앤컴퍼니",
      children: [{
        name: "개발팀"
      }, {
        name: "디자인팀"
      }, {
        name: "영업팀",
        children: [{
          name: "국내영업"
        }, {
          name: "해외영업"
        }]
      }, {
        name: "운영팀"
      }, {
        name: "CS팀"
      }]
    }],
    JOB_TITLES = ["직무/직급 없음", "팀장", "매니저", "주임", "사원"],
    MEMBERS = [{
      name: "김민수",
      team: "개발팀",
      role: "admin"
    }, {
      name: "이서연",
      team: "디자인팀"
    }, {
      name: "박지훈",
      team: "영업팀"
    }, {
      name: "정우성",
      team: "CS팀"
    }, {
      name: "김철수",
      team: "운영팀"
    }, {
      name: "최유진",
      team: "개발팀"
    }, {
      name: "한소희",
      team: "디자인팀"
    }, {
      name: "장민호",
      team: "국내영업"
    }, {
      name: "오세훈",
      team: "운영팀"
    }, {
      name: "배수지",
      team: "CS팀"
    }, {
      name: "윤재현",
      team: "해외영업"
    }, {
      name: "임하늘",
      team: "개발팀"
    }],
    AVATAR_COLORS = ["#5b8def", "#8f6ef0", "#eb7f8b", "#3fb37f", "#e0a63c", "#4dabf7"];
  function avatarColor(name) {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 997;
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
  }
  const FIELD_LABEL = {
      serial: "S/N",
      imei: "IMEI",
      purchaseDate: "구매연월",
      purchasePrice: "구매가격",
      manufactured: "제조연월",
      expiry: "유효기한"
    },
    DEFAULT_HIDDEN_FIELDS = {
      individual: ["imei"]
    },
    assignLabel = type => "상태 관리 권한",
    permLabel = kind => kind === "view" ? "자산 조회 권한" : kind === "edit" ? "정보 수정 권한" : "상태 관리 권한",
    RESTRICT_TIP = "변경 권한을 부여하려면 먼저 조회 권한이 부여되어야 합니다.",
    assetsOf = (group, sub) => assets.filter(a => !a.deleted_at && a.group === group && a.sub === sub),
    categoryName = value => String(value || "").trim().replace(/\s+/g, " ");
  function subFormSnapshot(state) {
    const normalize = value => Array.isArray(value) ? value.map(normalize).sort() : value && typeof value == "object" ? Object.fromEntries(Object.keys(value).sort().map(k => [k, normalize(value[k])])) : value;
    return JSON.stringify(normalize({
      ...state,
      name: categoryName(state.name)
    }));
  }
  function categoryExit(onLeave) {
    confirmModal("작성을 중단하시겠습니까?", "지금까지 작성한 내용은 저장되지 않습니다.", onLeave);
  }
  function productPhotoAsset(items) {
    return [...items].sort((a, b) => String(a.assetNo || "").localeCompare(String(b.assetNo || ""))).find(a => window.assetPhotos(a).length) || items[0];
  }
  const collapsedGroups = /* @__PURE__ */new Set();
  function groupsOf() {
    const order = [],
      map = {};
    return categories.forEach(c => {
      map[c.group] || (map[c.group] = [], order.push(c.group)), map[c.group].push(c);
    }), (window.DATA.emptyGroups || []).forEach(g => {
      map[g] || (map[g] = [], order.push(g));
    }), order.map(group => ({
      group,
      subs: map[group]
    }));
  }
  function firstSelectable(groups) {
    for (const g of groups) if (g.subs.length) return {
      group: g.group,
      sub: g.subs[0].sub
    };
    return null;
  }
  function treeHtml(groups, sel) {
    const head = `
      <div class="cat-tree-head">
        ${window.hasPrototypeAssetManagePermission()?'<button class="btn sm" data-manage-dropdown>관리 ▾</button>':''}
      </div>`,
      body = groups.map(({
        group,
        subs
      }) => {
        const collapsed = collapsedGroups.has(group);
        return `
      <div class="cat-tree-group">
        <button class="cat-tree-label" data-toggle="${group}">
          <span class="cat-tree-chevron">${collapsed ? "▸" : "▾"}</span>${group}
        </button>
        ${collapsed ? "" : subs.length ? subs.map(s => `
          <button class="cat-tree-item${sel && sel.group === group && sel.sub === s.sub ? " active" : ""}"
                  data-tree="${group}|${s.sub}">
            ${s.sub}<span class="cat-tree-count">${assetsOf(group, s.sub).length}</span>
          </button>`).join("") : '<p class="cat-tree-empty">소분류 없음</p>'}
      </div>`;
      }).join("");
    return head + body;
  }
  function productsOf(group, sub) {
    const list = assetsOf(group, sub),
      order = [],
      map = {};
    return list.forEach(a => {
      map[a.product] || (map[a.product] = [], order.push(a.product)), map[a.product].push(a);
    }), order.sort((a, b) => a.localeCompare(b, "ko")), order.map(product => {
      const items = map[product],
        assigned = items.filter(a => a.status === "assigned").length,
        stock = items.filter(a => a.status === "stock").length,
        repair = items.filter(a => a.status === "repair").length,
        lost = items.filter(a => a.status === "lost").length,
        disposed = items.filter(a => a.status === "disposed").length;
      return {
        product,
        items,
        total: items.length,
        assigned,
        stock,
        repair,
        lost,
        disposed
      };
    });
  }
  function thumb(a) {
    const ph = window.assetPhotos(a);
    return ph.length ? `<span class="thumb" style="background:${ph[a._primary || 0].color}"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="m21 16-5-5-9 8"/></svg></span>` : '<span class="thumb empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-4 4 3 4-4 5 4"/></svg></span>';
  }
  function prodCell(a, name) {
    return `<div class="prodcell">${thumb(a)}<span class="pname">${name}</span></div>`;
  }
  function productRowHtml(p) {
    return `
      <tr class="clickable cat-prod-row" data-product="${p.product}" data-search-count="${p.total}">
        <td>${prodCell(productPhotoAsset(p.items), p.product)}</td>
        <td class="num">${p.total}</td>
        <td class="num">${p.assigned}</td>
        <td class="num">${p.repair}</td>
        <td class="num">${p.lost}</td>
        <td class="num">${p.disposed}</td>
        <td class="num">${p.stock}</td>
      </tr>`;
  }
  const fieldsForType = type => window.AssetExtra.fields().map(f=>f.id);
  function usageInfoHtml(cat) {
 const manage=window.hasPrototypeAssetManagePermission();
 return window.DATA.extraFields.filter(f=>!f.deleted).filter(f=>manage || !(cat.privateFields||[]).includes(f.id)).map(f=>`<span class="usebullet ${window.AssetExtra.enabled(cat,f.id)?'on':'off'}">${window.AssetExtra.esc(f.name)} ${window.AssetExtra.enabled(cat,f.id)?'ON':'OFF'}${window.AssetExtra.enabled(cat,f.id)&&(cat.privateFields||[]).includes(f.id)?' · 비공개':''}</span>`).join('');
}
  const ASSET_SEARCH_HTML = `
    <div class="cat-asset-search">
      <div class="searchbox">
        <input class="search" type="text" data-product-search placeholder="검색">
        <button class="search-clear" type="button" data-product-search-clear aria-label="검색어 지우기">✕</button>
      </div>
    </div>`,
    assetEmptyHtml = () => `
    <div class="cat-asset-empty">
      <p class="muted">등록된 자산이 없습니다.</p>
      <button class="btn sm" data-add-asset>자산 추가</button><button class="btn sm" data-bulk-add>일괄 추가</button>
    </div>`;
  function assetSectionHtml(cat) {
    {
      const products = productsOf(cat.group, cat.sub);
      return `
        <div class="cat-asset-head">
          <h4>품목 목록</h4>
        </div>
        <div class="cat-asset-countrow">
          <p class="cat-asset-count">전체 <span data-product-result-count>${products.reduce((s, p) => s + p.total, 0)}</span></p>
          ${products.length ? ASSET_SEARCH_HTML : ""}
        </div>
        ${products.length ? `
          <div class="table-wrap" data-asset-table>
            <table class="cat-asset-table">
              <thead><tr><th>품목명</th><th class="num">자산 수</th><th class="num">배정 중</th><th class="num">수리/점검 중</th><th class="num">분실</th><th class="num">폐기</th><th class="num">배정 가능</th></tr></thead>
              <tbody data-asset-tbody></tbody>
            </table>
          </div>
          <p class="muted" data-search-empty hidden style="padding:12px 0">결과가 없습니다.</p>
          <div data-asset-pager></div>` : assetEmptyHtml()}`;
    }
  }
  function permValueHtml(cat, kind) {
    const value = cat[kind];
    return !TARGET_NEEDED.has(value) || !cat[kind + "Target"] ? value : `<button type="button" class="perm-value-link" data-perm-target="${kind}">${value}</button>`;
  }
  function openPermTargetModal(cat, kind) {
    const target = cat[kind + "Target"] || {
        groups: [],
        jobTitles: [],
        members: []
      },
      byName = list => [...list].sort((a, b) => a.localeCompare(b, "ko"));
    let bodyHtml;
    if (cat[kind] === "특정 관리자/리더") {
      const names = byName(target.members);
      bodyHtml = `
        <p class="perm-target-count">전체 <b>${names.length}</b></p>
        <div class="perm-target-list">${names.map(name => {
        const m2 = MEMBERS.find(x => x.name === name);
        return `
            <div class="perm-target-row">
              <span class="picker-avatar" style="background:${avatarColor(name)}">${name[0]}</span>
              <span class="perm-target-info"><b>${name}</b>${m2 ? `<span>${m2.team}</span>` : ""}</span>
            </div>`;
      }).join("")}</div>`;
    } else {
      const section = (label, list) => `
        <div class="perm-target-section">
          <p class="perm-target-label">${label}</p>
          ${list.length ? list.map(n => `<div class="perm-target-row">${n}</div>`).join("") : '<div class="perm-target-row">전체</div>'}
        </div>`;
      bodyHtml = section("그룹", byName(target.groups)) + section("직무/직급", byName(target.jobTitles));
    }
    const m = document.createElement("div");
    m.className = "modal-back", m.innerHTML = `
      <div class="modal help-modal perm-target-modal">
        <div class="help-modal-head">
          <h3>${permLabel(kind)}</h3>
          <button type="button" class="btn icon-only sm" data-close aria-label="닫기">${CLOSE_ICON}</button>
        </div>
        <div class="body">${bodyHtml}</div>
      </div>`, document.body.appendChild(m), m.addEventListener("click", e => {
      e.target === m && m.remove();
    }), m.querySelector("[data-close]").onclick = () => m.remove();
  }
  function detailHtml(cat) {
    return `
      <div class="cat-detail-head">
        <div class="category-two-line"><span>${cat.group}</span><h3>${cat.sub}</h3></div>
        ${window.hasPrototypeAssetManagePermission()?'<div class="cat-detail-acts"><button class="btn sm" data-edit-sub>수정</button></div>':''}
      </div>
      <div class="kv2 cat-detail-kv">
        <div><div class="k">자산 조회 권한</div><div class="v">${permValueHtml(cat, "view")}</div></div>
        <div><div class="k">정보 수정 권한</div><div class="v">${permValueHtml(cat, "edit")}</div></div>
        <div><div class="k">${assignLabel(cat.type)}</div><div class="v">${permValueHtml(cat, "assign")}</div></div>
      </div>
      <div class="cat-usage"${usageInfoHtml(cat)?"":" hidden"}>
        <div class="k">추가 정보</div>
        <div class="cat-usage-bullets">${usageInfoHtml(cat)}</div>
      </div>
      ${assetSectionHtml(cat)}
    `;
  }
  function renderSubForm(container, state, opts) {
    const typeLocked = !!opts.typeLocked;
    container.innerHTML = `
      <div class="field">
        <label>대분류</label>
        <p class="field-static">${opts.groupLabel}</p>
      </div>
      <div class="field">
        <label>소분류명<span class="req">*</span></label>
        <input type="text" class="cat-manage-input" data-f-name value="${state.name}" placeholder="입력" maxlength="30" style="width:100%">
        <p class="field-err" data-f-name-err hidden>동일한 명칭이 존재합니다.</p>
      </div>
      <div class="field">
        <label>자산 조회 권한<span class="req">*</span></label>
        <p class="hint" style="margin-top:0;margin-bottom:8px">이 소분류의 자산을 조회할 수 있는 구성원을 설정합니다.</p>
        <button type="button" class="cat-manage-select-btn" data-f-view-btn><span>${state.view}</span><span class="chev">▾</span></button>
      </div>
      <div class="field">
        <label>정보 수정 권한<span class="req">*</span></label>
        <p class="hint" style="margin-top:0;margin-bottom:8px">이 소분류의 자산 정보·사진·태그·메모를 수정할 수 있는 구성원을 설정합니다.</p>
        <button type="button" class="cat-manage-select-btn" data-f-edit-btn><span>${state.edit}</span><span class="chev">▾</span></button>
      </div>
      <div class="field">
        <label>${assignLabel(state.type)}<span class="req">*</span></label>
        <p class="hint" style="margin-top:0;margin-bottom:8px">이 소분류의 자산을 배정·반납하거나 상태를 변경할 수 있는 구성원을 설정합니다.</p>
        <button type="button" class="cat-manage-select-btn" data-f-assign-btn><span>${state.assign}</span><span class="chev">▾</span></button>
      </div>
      <div class="field">
        <label>정보 설정</label>
        <p class="hint" style="margin-top:0;margin-bottom:10px">비공개로 설정한 항목은 자산 관리 권한을 보유한 구성원만 보고 입력할 수 있습니다.</p>
        <div class="cat-manage-fieldlist" data-f-fields>
          ${[{name:'기본 정보',fields:window.AssetExtra.fixed},{name:'추가 정보',fields:window.DATA.extraFields.filter(f=>!f.deleted)}].filter(group=>group.fields.length).map(group=>`<section class="cat-info-settings-group"><h4>${group.name}</h4>${group.fields.map(f => {
            const locked=window.AssetExtra.fixed.some(x=>x.id===f.id), enabled=locked||(state.extraEnabled||[]).includes(f.id);
            return `<div class="extra-field-settings"><div class="cat-manage-fieldrow"><span>${window.AssetExtra.esc(f.name)}</span><button type="button" class="toggle-switch${enabled?' on':''}" data-field="${f.id}"${locked?' disabled aria-disabled="true"':''} role="switch" aria-checked="${enabled}" aria-label="${window.AssetExtra.esc(f.name)} 노출"><span class="toggle-knob"></span></button></div>${f.description?`<small>${window.AssetExtra.esc(f.description)}</small>`:''}${enabled?`<label class="extra-private"><input type="checkbox" data-private-field="${f.id}"${(state.privateFields||[]).includes(f.id)?' checked':''}>비공개</label>`:''}</div>`;
          }).join('')}</section>`).join('')}
        </div>
      </div>`;
    const nameInputEl = container.querySelector("[data-f-name]"),
      nameErrEl = container.querySelector("[data-f-name-err]");
    container.querySelectorAll('[data-private-field]').forEach(el=>el.onchange=()=>{state.privateFields ||= [];const i=state.privateFields.indexOf(el.dataset.privateField);if(el.checked&&i<0)state.privateFields.push(el.dataset.privateField);else if(!el.checked&&i>=0)state.privateFields.splice(i,1);checkName();});
    function checkName() {
      const val = categoryName(state.name),
        dup = !!val && (opts.siblingNames || []).map(categoryName).includes(val);
      nameInputEl.classList.toggle("has-err", dup), nameErrEl.hidden = !dup, opts.onNameChange(val.length > 0 && !dup && ['view','edit','assign'].every(key=>{
        if(!TARGET_NEEDED.has(state[key]))return !!state[key];
        const target=state[key+'Target'];
        return state[key]==='특정 관리자/리더'?!!target?.members?.length:!!(target?.groups?.length||target?.jobTitles?.length);
      }));
    }
    nameInputEl.addEventListener("input", e => {
      state.name = e.target.value, checkName();
    }), checkName(), container.querySelector("[data-f-edit-btn]").onclick = () => openPermPicker("edit", state, () => renderSubForm(container, state, opts)), container.querySelector("[data-f-view-btn]").onclick = () => openPermPicker("view", state, () => renderSubForm(container, state, opts)), container.querySelector("[data-f-assign-btn]").onclick = () => openPermPicker("assign", state, () => renderSubForm(container, state, opts)), container.querySelector("[data-f-fields]").addEventListener("click", e => {
      const b = e.target.closest("[data-field]");
      if (!b || b.disabled) return;
      const f=b.dataset.field;
      state.extraEnabled ||= [];state.privateFields ||= [];
      const list=window.AssetExtra.fixed.some(x=>x.id===f)?state.hiddenFields:state.extraEnabled,index=list.indexOf(f);
      index===-1?list.push(f):list.splice(index,1);renderSubForm(container,state,opts);
    });
  }
  function openPermPicker(kind, state, onApply) {
    const isView = kind === "view",
      current = state[kind],
      draftTarget = {
        groups: [...state[kind + "Target"].groups],
        jobTitles: [...state[kind + "Target"].jobTitles],
        members: [...state[kind + "Target"].members]
      };
    let picked = current;
    const p = document.createElement("div");
    p.className = "modal-back", p.innerHTML = `
      <div class="modal">
        <h3>${permLabel(kind)}</h3>
        <div class="body" data-picker-body></div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" data-ok>적용</button>
        </div>
      </div>`, document.body.appendChild(p);
    const body = p.querySelector("[data-picker-body]"),
      okBtn = p.querySelector("[data-ok]");
    function isTargetSetFor(v) {
      return v === "특정 그룹 및 직무/직급" ? !draftTarget.groups.length && !draftTarget.jobTitles.length ? !1 : isView || state.view !== v || window.isAssetGroupPositionSubset(draftTarget, state.viewTarget) : v === "특정 관리자/리더" ? draftTarget.members.length > 0 : !1;
    }
    function targetSummaryHtml(v) {
      if (!isTargetSetFor(v)) return '<button type="button" class="perm-target-btn" data-target-open><span class="muted">선택</span><span class="chev">›</span></button>';
      let chips,
        avatar = "";
      return v === "특정 그룹 및 직무/직급" ? (chips = [], draftTarget.groups.length && chips.push(`그룹 : ${draftTarget.groups[0]}${draftTarget.groups.length > 1 ? `<span class="chip-more">+${draftTarget.groups.length - 1}</span>` : ""}`), draftTarget.jobTitles.length && chips.push(`직무/직급 : ${draftTarget.jobTitles[0]}${draftTarget.jobTitles.length > 1 ? `<span class="chip-more">+${draftTarget.jobTitles.length - 1}</span>` : ""}`)) : (avatar = `<span class="picker-avatar sm" style="background:${avatarColor(draftTarget.members[0])}">${draftTarget.members[0][0]}</span>`, chips = [`${draftTarget.members[0]}${draftTarget.members.length > 1 ? `<span class="chip-more">+${draftTarget.members.length - 1}</span>` : ""}`]), `
        <div class="perm-target-row">
          <button type="button" class="perm-target-chips" data-target-open>${avatar}${chips.map(c => `<span class="perm-chip">${c}</span>`).join("")}</button>
          <button type="button" class="perm-target-clear" data-target-clear aria-label="선택 해제">${CLOSE_ICON}</button>
        </div>`;
    }
    function render2() {
      const allowedSet = isView ? null : new Set(ASSIGN_BY_VIEW[state.view].options);
      body.innerHTML = VIEW_OPTIONS.map(v => {
        const isDisabled = allowedSet && !allowedSet.has(v);
        return `
        <label class="radio-row${isDisabled ? " is-disabled" : ""}">
          <input type="radio" name="perm-pick" value="${v}"${v === picked ? " checked" : ""}${isDisabled ? " disabled" : ""}>
          <span>${v}</span>
        </label>
        ${picked === v && TARGET_NEEDED.has(v) ? `<div class="perm-target-wrap">${targetSummaryHtml(v)}</div>` : ""}`;
      }).join("") + (isView ? `<div class="perm-info-note">${INFO_ICON}<span>관리자라도 조회 권한을 부여받아야 이 정보를 볼 수 있습니다.</span></div>` : ""), body.querySelectorAll('input[name="perm-pick"]').forEach(r => r.onchange = () => {
        picked = r.value, render2();
      });
      const openBtn = body.querySelector("[data-target-open]");
      openBtn && (openBtn.onclick = () => {
        const isNarrowedView = !isView && state.view === picked;
        if (picked === "특정 그룹 및 직무/직급") {
          const restrict = isNarrowedView ? {
            groups: state.viewTarget.groups.length ? new Set(state.viewTarget.groups) : null,
            jobTitles: state.viewTarget.jobTitles.length ? new Set(state.viewTarget.jobTitles) : null
          } : null;
          openGroupJobPicker({
            groups: draftTarget.groups,
            jobTitles: draftTarget.jobTitles
          }, res => {
            draftTarget.groups = res.groups, draftTarget.jobTitles = res.jobTitles, render2();
          }, restrict);
        } else if (picked === "특정 관리자/리더") {
          const restrict = !isView && state.view === "관리자만" ? new Set(MEMBERS.filter(m => m.role === "admin").map(m => m.name)) : isNarrowedView ? new Set(state.viewTarget.members) : null;
          openMemberPicker(draftTarget.members, res => {
            draftTarget.members = res, render2();
          }, restrict);
        }
      });
      const clearBtn = body.querySelector("[data-target-clear]");
      clearBtn && (clearBtn.onclick = () => {
        picked === "특정 그룹 및 직무/직급" ? (draftTarget.groups = [], draftTarget.jobTitles = []) : draftTarget.members = [], render2();
      }), okBtn.disabled = TARGET_NEEDED.has(picked) && !isTargetSetFor(picked);
    }
    render2(), p.querySelector("[data-close]").onclick = () => p.remove(), okBtn.onclick = () => {
      if (okBtn.disabled) return;
      const appliedTarget = picked === "특정 그룹 및 직무/직급" ? {
        groups: [...draftTarget.groups],
        jobTitles: [...draftTarget.jobTitles],
        members: []
      } : picked === "특정 관리자/리더" ? {
        groups: [],
        jobTitles: [],
        members: [...draftTarget.members]
      } : {
        groups: [],
        jobTitles: [],
        members: []
      };
      if(isView){
        state.view=picked;state.viewTarget=appliedTarget;
        for(const key of ['edit','assign']){state[key]=ASSIGN_BY_VIEW[picked].default;state[key+'Target']={groups:[],jobTitles:[],members:[]};}
      }else{state[kind]=picked;state[kind+'Target']=appliedTarget;}
      p.remove();onApply();
    };
  }
  function openGroupJobPicker(initial, onApply, restrict) {
    const selGroups = new Set(initial.groups),
      selJobTitles = new Set(initial.jobTitles);
    let activeTab = "groups",
      cascade = !0;
    const collapsed = /* @__PURE__ */new Set();
    let query = "";
    const flatten = nodes => nodes.reduce((out, n) => out.concat(n.name, n.children ? flatten(n.children) : []), []),
      ALL_GROUP_NAMES = flatten(GROUP_TREE),
      selectableGroupNames = restrict?.groups ? ALL_GROUP_NAMES.filter(n => restrict.groups.has(n)) : ALL_GROUP_NAMES;
    function findNode(nodes, name) {
      for (const n of nodes) {
        if (n.name === name) return n;
        if (n.children) {
          const f = findNode(n.children, name);
          if (f) return f;
        }
      }
      return null;
    }
    function setChecked(node, checked, withCascade) {
      restrict?.groups && !restrict.groups.has(node.name) || (checked ? selGroups.add(node.name) : selGroups.delete(node.name), withCascade && node.children && node.children.forEach(c => setChecked(c, checked, !0)));
    }
    function matches(node) {
      return !query || node.name.includes(query) ? !0 : !!(node.children && node.children.some(matches));
    }
    function groupRowHtml(node, depth) {
      if (!matches(node)) return "";
      const hasChildren = node.children && node.children.length,
        isCollapsed = collapsed.has(node.name),
        isDisabled = restrict?.groups && !restrict.groups.has(node.name);
      return `
        <div class="picker-tree-row" style="padding-left:${depth * 20}px">
          ${hasChildren ? `<button type="button" class="picker-tree-toggle" data-toggle-group="${node.name}">${isCollapsed ? "▸" : "▾"}</button>` : '<span class="picker-tree-toggle"></span>'}
          <label class="picker-check${isDisabled ? " is-disabled" : ""}"${isDisabled ? ` data-tip="${RESTRICT_TIP}"` : ""}><input type="checkbox" data-group="${node.name}"${selGroups.has(node.name) ? " checked" : ""}${isDisabled ? " disabled" : ""}><span>${node.name}</span></label>
        </div>
        ${hasChildren && !isCollapsed ? node.children.map(c => groupRowHtml(c, depth + 1)).join("") : ""}`;
    }
    const p = document.createElement("div");
    p.className = "modal-back", p.innerHTML = `
      <div class="modal picker-modal">
        <div class="picker-head">
          <h3>그룹 및 직무/직급 선택</h3>
          <button type="button" class="picker-reset" data-reset>${RESET_ICON}초기화</button>
        </div>
        <div class="picker-layout">
          <div class="picker-tabs">
            <button type="button" class="picker-tab" data-tab="groups">그룹</button>
            <button type="button" class="picker-tab" data-tab="jobTitles">직무/직급</button>
          </div>
          <div class="picker-content" data-content></div>
        </div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" data-ok>적용</button>
        </div>
      </div>`, document.body.appendChild(p);
    const syncSelection = () => {
      const ok = p.querySelector("[data-ok]");
      ok && (ok.disabled = !(selGroups.size + selJobTitles.size));
    };
    new MutationObserver(syncSelection).observe(p, {
      childList: !0,
      subtree: !0
    }), p.addEventListener("change", syncSelection), p.addEventListener("click", () => queueMicrotask(syncSelection)), syncSelection();
    const content = p.querySelector("[data-content]"),
      jobTab = p.querySelector('[data-tab="jobTitles"]');
    function renderContent() {
      if (activeTab === "groups") {
        const allChecked = selectableGroupNames.length > 0 && selectableGroupNames.every(n => selGroups.has(n));
        content.innerHTML = `
          <input type="text" class="picker-search" placeholder="검색어를 입력하세요" value="${query}">
          <div class="picker-toolbar">
            <label class="picker-check"><input type="checkbox" data-select-all${allChecked ? " checked" : ""}><span>전체 선택</span></label>
            <label class="picker-check right"><input type="checkbox" data-cascade${cascade ? " checked" : ""}><span>하위그룹도 한번에 체크</span></label>
          </div>
          <div class="picker-tree">${GROUP_TREE.map(n => groupRowHtml(n, 0)).join("")}</div>`, content.querySelector(".picker-search").addEventListener("input", e => {
          query = e.target.value, renderContent();
        }), content.querySelector("[data-select-all]").onchange = e => {
          selectableGroupNames.forEach(n => e.target.checked ? selGroups.add(n) : selGroups.delete(n)), renderContent();
        }, content.querySelector("[data-cascade]").onchange = e => {
          cascade = e.target.checked;
        }, content.querySelectorAll("[data-toggle-group]").forEach(b => b.onclick = () => {
          collapsed.has(b.dataset.toggleGroup) ? collapsed.delete(b.dataset.toggleGroup) : collapsed.add(b.dataset.toggleGroup), renderContent();
        }), content.querySelectorAll("[data-group]").forEach(cb => cb.onchange = e => {
          setChecked(findNode(GROUP_TREE, e.target.dataset.group), e.target.checked, cascade), renderContent();
        });
      } else {
        const filtered = JOB_TITLES.filter(t => !query || t.includes(query));
        content.innerHTML = `
          <input type="text" class="picker-search" placeholder="검색어를 입력하세요" value="${query}">
          <div class="picker-flatlist">
            ${filtered.map(t => {
          const isDisabled = restrict?.jobTitles && !restrict.jobTitles.has(t);
          return `<label class="picker-check row${isDisabled ? " is-disabled" : ""}"${isDisabled ? ` data-tip="${RESTRICT_TIP}"` : ""}><input type="checkbox" data-jobtitle="${t}"${selJobTitles.has(t) ? " checked" : ""}${isDisabled ? " disabled" : ""}><span>${t}</span></label>`;
        }).join("")}
          </div>`, content.querySelector(".picker-search").addEventListener("input", e => {
          query = e.target.value, renderContent();
        }), content.querySelectorAll("[data-jobtitle]").forEach(cb => cb.onchange = e => {
          e.target.checked ? selJobTitles.add(e.target.dataset.jobtitle) : selJobTitles.delete(e.target.dataset.jobtitle);
        });
      }
    }
    function renderAll() {
      p.querySelectorAll("[data-tab]").forEach(b => b.classList.toggle("active", b.dataset.tab === activeTab)), jobTab.innerHTML = `직무/직급${selJobTitles.size ? '<span class="picker-tab-dot"></span>' : ""}`, renderContent();
    }
    p.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => {
      activeTab = b.dataset.tab, query = "", renderAll();
    }), p.querySelector("[data-reset]").onclick = () => {
      selGroups.clear(), selJobTitles.clear(), renderAll();
    }, renderAll(), p.querySelector("[data-close]").onclick = () => p.remove(), p.querySelector("[data-ok]").onclick = () => {
      p.remove(), onApply({
        groups: [...selGroups],
        jobTitles: [...selJobTitles]
      });
    };
  }
  function openMemberPicker(initial, onApply, restrict) {
    const sel = new Set(initial);
    let query = "";
    const p = document.createElement("div");
    if (p.className = "modal-back", !restrict) {
      let renderSelected2 = function () {
          countEl.textContent = sel.size, selectedList.innerHTML = sel.size ? [...sel].map(name => `
          <div class="picker-selected-row">
            <span class="picker-avatar sm" style="background:${avatarColor(name)}">${name[0]}</span>
            <span>${name}</span>
            <button type="button" class="picker-selected-remove" data-remove="${name}" aria-label="제거">${CLOSE_ICON}</button>
          </div>`).join("") : '<p class="muted" style="padding:16px 0">선택된 인원이 없습니다.</p>', selectedList.querySelectorAll("[data-remove]").forEach(b => b.onclick = () => {
            sel.delete(b.dataset.remove), renderSelected2(), renderList2();
          });
        },
        renderList2 = function () {
          const filtered = MEMBERS.filter(m => !query || m.name.includes(query));
          list2.innerHTML = filtered.length ? filtered.map(m => `
          <label class="picker-member-row">
            <input type="checkbox" data-member="${m.name}"${sel.has(m.name) ? " checked" : ""}>
            <span class="picker-avatar" style="background:${avatarColor(m.name)}">${m.name[0]}</span>
            <span class="picker-member-info"><b>${m.name}</b><span>${m.team}</span></span>
          </label>`).join("") : '<p class="muted" style="padding:16px 0">결과가 없습니다.</p>', p.querySelector("[data-select-all]").checked = filtered.length > 0 && filtered.every(m => sel.has(m.name)), list2.querySelectorAll("[data-member]").forEach(cb => cb.onchange = e => {
            e.target.checked ? sel.add(e.target.dataset.member) : sel.delete(e.target.dataset.member), p.querySelector("[data-select-all]").checked = filtered.length > 0 && filtered.every(m => sel.has(m.name)), renderSelected2();
          });
        };
      var renderSelected = renderSelected2,
        renderList = renderList2;
      p.innerHTML = `
        <div class="modal picker-modal" style="width:680px">
          <h3>직원 선택</h3>
          <div class="picker-split">
            <div class="picker-split-left">
              <input type="text" class="picker-search" placeholder="검색어를 입력하세요">
              <div class="picker-toolbar">
                <label class="picker-check"><input type="checkbox" data-select-all><span>전체 선택</span></label>
                <span class="right">전체 <b>${MEMBERS.length}</b></span>
              </div>
              <div class="picker-memberlist" data-list></div>
            </div>
            <div class="picker-split-right">
              <div class="picker-selected-head"><span>선택됨 <b data-count>${sel.size}</b></span></div>
              <div class="picker-selected-list" data-selected-list></div>
            </div>
          </div>
          <div class="foot">
            <button class="btn" data-close>취소</button>
            <button class="btn primary" data-ok>적용</button>
          </div>
        </div>`, document.body.appendChild(p);
      const syncSelection2 = () => {
        const ok = p.querySelector("[data-ok]");
        ok && (ok.disabled = !sel.size);
      };
      new MutationObserver(syncSelection2).observe(p, {
        childList: !0,
        subtree: !0
      }), p.addEventListener("change", syncSelection2), p.addEventListener("click", () => queueMicrotask(syncSelection2)), syncSelection2();
      const list2 = p.querySelector("[data-list]"),
        countEl = p.querySelector("[data-count]"),
        selectedList = p.querySelector("[data-selected-list]");
      p.querySelector(".picker-search").addEventListener("input", e => {
        query = e.target.value, renderList2();
      }), p.querySelector("[data-select-all]").onchange = e => {
        MEMBERS.filter(m => !query || m.name.includes(query)).forEach(m => e.target.checked ? sel.add(m.name) : sel.delete(m.name)), renderSelected2(), renderList2();
      }, renderList2(), renderSelected2(), p.querySelector("[data-close]").onclick = () => p.remove(), p.querySelector("[data-ok]").onclick = () => {
        p.remove(), onApply([...sel]);
      };
      return;
    }
    const candidates = MEMBERS.filter(m => restrict.has(m.name));
    p.innerHTML = `
      <div class="modal picker-modal">
        <h3>직원 선택</h3>
        <div class="body">
          <input type="text" class="picker-search" placeholder="검색어를 입력하세요">
          <div class="picker-memberlist" data-list></div>
        </div>
        <div class="foot">
          <button class="btn" data-close>취소</button>
          <button class="btn primary" data-ok>적용</button>
        </div>
      </div>`, document.body.appendChild(p);
    const syncSelection = () => {
      const ok = p.querySelector("[data-ok]");
      ok && (ok.disabled = !sel.size);
    };
    new MutationObserver(syncSelection).observe(p, {
      childList: !0,
      subtree: !0
    }), p.addEventListener("change", syncSelection), p.addEventListener("click", () => queueMicrotask(syncSelection)), syncSelection();
    const list = p.querySelector("[data-list]");
    function renderList() {
      const filtered = candidates.filter(m => !query || m.name.includes(query));
      list.innerHTML = filtered.length ? filtered.map(m => `
        <label class="picker-member-row">
          <input type="checkbox" data-member="${m.name}"${sel.has(m.name) ? " checked" : ""}>
          <span class="picker-avatar" style="background:${avatarColor(m.name)}">${m.name[0]}</span>
          <span class="picker-member-info"><b>${m.name}</b><span>${m.team}</span></span>
        </label>`).join("") : '<p class="muted" style="padding:16px 0">결과가 없습니다.</p>', list.querySelectorAll("[data-member]").forEach(cb => cb.onchange = e => {
        e.target.checked ? sel.add(e.target.dataset.member) : sel.delete(e.target.dataset.member);
      });
    }
    p.querySelector(".picker-search").addEventListener("input", e => {
      query = e.target.value, renderList();
    }), renderList(), p.querySelector("[data-close]").onclick = () => p.remove(), p.querySelector("[data-ok]").onclick = () => {
      p.remove(), onApply([...sel]);
    };
  }
  function openExtraInfoManager() {
  const master=window.DATA.extraFields, draft=master.filter(f=>!f.deleted).map(f=>({...f}));
  const initial=JSON.stringify(draft), back=document.createElement('div');
  back.className='modal-back';
  back.innerHTML='<div class="modal scroll-body"><h3>추가 정보 관리</h3><div class="body"><div class="extra-manager-row"><div class="field"><input type="text" data-extra-name maxlength="20" placeholder="입력"><p class="field-err" data-extra-create-error hidden>동일한 명칭이 존재합니다.</p></div><button class="btn primary" data-extra-add disabled>+ 추가</button></div><div data-extra-list></div></div><div class="foot"><button class="btn" data-extra-cancel>취소</button><button class="btn primary" data-extra-save disabled>저장</button></div></div>';
  document.body.appendChild(back);
  let dragging=null;
  const input=back.querySelector('[data-extra-name]'), add=back.querySelector('[data-extra-add]'), save=back.querySelector('[data-extra-save]');
  function validate() {
    const names=draft.map(f=>f.name.trim()), q=input.value.trim(), reserved=[];
    const dup=q && [...names,...reserved].includes(q);
    add.disabled=!q || dup || draft.length>=30;
    input.classList.toggle('has-err',!!dup);back.querySelector('[data-extra-create-error]').hidden=!dup;
    let invalid=false;
    back.querySelectorAll('[data-extra-rename]').forEach(el=>{
      const f=draft.find(f=>f.id===el.dataset.extraRename), name=f.name.trim();
      const error=!name || names.filter(n=>n===name).length>1 || reserved.includes(name);
      el.classList.toggle('has-err',error);el.nextElementSibling.hidden=!error;
      el.nextElementSibling.textContent=!name?'명칭은 필수로 입력해야 합니다.':'동일한 명칭이 존재합니다.';invalid ||= error;
    });
    save.disabled=invalid || initial===JSON.stringify(draft);
  }
  function draw() {
    const list=back.querySelector('[data-extra-list]');
    list.innerHTML=draft.length?draft.map(f=>`<div class="extra-manager-row" draggable="true" data-extra-row="${f.id}"><span aria-label="순서 이동">☰</span><div class="field"><input type="text" maxlength="20" data-extra-rename="${f.id}" value="${window.AssetExtra.esc(f.name)}"><p class="field-err" hidden></p></div><button class="btn sm" data-extra-delete="${f.id}">삭제</button></div>`).join(''):'<p class="muted" style="padding:40px;text-align:center">등록된 추가 정보가 없습니다.</p>';
    list.querySelectorAll('[data-extra-rename]').forEach(el=>el.oninput=()=>{draft.find(f=>f.id===el.dataset.extraRename).name=el.value;validate();});
    list.querySelectorAll('[data-extra-delete]').forEach(button=>button.onclick=()=>confirmModal('삭제하시겠습니까?','',()=>{draft.splice(draft.findIndex(f=>f.id===button.dataset.extraDelete),1);draw();}));
    list.querySelectorAll('[data-extra-row]').forEach(row=>{
      row.ondragstart=e=>{dragging=row.dataset.extraRow;e.dataTransfer.setData('text/plain',dragging);};
      row.ondragover=e=>e.preventDefault();
      row.ondrop=e=>{e.preventDefault();if(!dragging||dragging===row.dataset.extraRow)return;const from=draft.findIndex(f=>f.id===dragging),to=draft.findIndex(f=>f.id===row.dataset.extraRow);draft.splice(to,0,draft.splice(from,1)[0]);dragging=null;draw();};
    });validate();
  }
  input.oninput=validate;
  add.onclick=()=>{if(add.disabled)return;draft.push({id:'extra-'+Date.now()+'-'+draft.length,name:input.value.trim()});input.value='';draw();};
  back.querySelector('[data-extra-cancel]').onclick=()=>{if(JSON.stringify(draft)!==initial) categoryExit(()=>back.remove());else back.remove();};
  save.onclick=()=>{
    if(save.disabled)return;
    if(!window.hasPrototypeAssetManagePermission()){back.remove();toast('자산 관리 권한이 없습니다.');return;}
    const ids=new Set(draft.map(f=>f.id)), retired=master.filter(f=>!ids.has(f.id)).map(f=>({...f,deleted:true}));
    master.splice(0,master.length,...draft.map(f=>({...f,name:f.name.trim()})),...retired);
    back.remove();toast('저장되었습니다.');render();
  };draw();
}
function openManagementMenu(button,sel) {
  document.querySelectorAll('[data-category-manage-menu]').forEach(el=>el.remove());
  const menu=document.createElement('div');menu.className='dropdown-menu';menu.dataset.categoryManageMenu='';
  menu.innerHTML='<button type="button" data-manage-classification>분류</button><button type="button" data-manage-extra>추가 정보</button><button type="button" data-manage-template>템플릿</button>';
  const rect=button.getBoundingClientRect();menu.style.cssText=`position:fixed;left:${rect.left}px;top:${rect.bottom+4}px;min-width:160px`;document.body.appendChild(menu);
  menu.querySelector('[data-manage-classification]').onclick=()=>{menu.remove();openManageModal(sel);};
  menu.querySelector('[data-manage-extra]').onclick=()=>{menu.remove();openExtraInfoManager();};
  menu.querySelector('[data-manage-template]').onclick=()=>{menu.remove();window.AssetTemplates.openTemplateManager();};
  const close=e=>{if(!menu.contains(e.target)&&!button.contains(e.target)){menu.remove();document.removeEventListener('click',close);}};document.addEventListener('click',close);
}

  function openSubEditModal(cat) {
    const hasAssets = assetsOf(cat.group, cat.sub).length > 0,
      state = {
        name: cat.sub,
        type: cat.type,
        view: cat.view,
        assign: cat.assign,
        edit: cat.edit,
        editTarget: structuredClone(cat.editTarget || {groups:[],jobTitles:[],members:[]}),
        viewTarget: cat.viewTarget ? {
          ...cat.viewTarget
        } : {
          groups: [],
          jobTitles: [],
          members: []
        },
        assignTarget: cat.assignTarget ? {
          ...cat.assignTarget
        } : {
          groups: [],
          jobTitles: [],
          members: []
        },
        hiddenFields: [...(cat.hiddenFields || [])], extraEnabled:[...(cat.extraEnabled||[])], privateFields:[...(cat.privateFields||[])]
      },
      initial = subFormSnapshot(state),
      back = document.createElement("div");
    back.className = "modal-back", back.innerHTML = `
      <div class="modal lg cat-manage-modal">
        <div class="cat-manage-head"><h3>소분류 수정</h3></div>
        <div class="cat-manage-create" data-form></div>
        <div class="foot">
          <button class="btn" data-cancel>취소</button>
          <button class="btn primary" data-save>저장</button>
        </div>
      </div>`, document.body.appendChild(back);
    const form = back.querySelector("[data-form]"),
      saveBtn = back.querySelector("[data-save]");
    renderSubForm(form, state, {
      groupLabel: cat.group,
      typeLocked: hasAssets,
      siblingNames: categories.filter(c => c.group === cat.group && c.sub !== cat.sub).map(c => c.sub),
      onNameChange: valid => {
        saveBtn.disabled = !valid || subFormSnapshot(state) === initial;
      }
    }), back.querySelector("[data-cancel]").onclick = () => {
      subFormSnapshot(state) !== initial ? categoryExit(() => back.remove()) : back.remove();
    }, saveBtn.onclick = () => {
      const name = categoryName(state.name);
      if (!(!name || saveBtn.disabled)) {
        if (categories.some(c => c !== cat && c.group === cat.group && categoryName(c.sub) === name)) {
          form.querySelector("[data-f-name]").classList.add("has-err"), form.querySelector("[data-f-name-err]").hidden = !1, saveBtn.disabled = !0;
          return;
        }
        if (!categories.includes(cat) || state.type !== cat.type && assetsOf(cat.group, cat.sub).length) {
          back.remove(), toast("설정이 변경되었습니다. 잠시 후 다시 시도해주세요."), render();
          return;
        }
        cat.sub !== name && assets.forEach(a => {
          a.group === cat.group && a.sub === cat.sub && (a.sub = name);
        }), cat.sub = name, cat.type = state.type, cat.hiddenFields = [...state.hiddenFields], cat.extraEnabled=[...(state.extraEnabled||[])], cat.privateFields=[...(state.privateFields||[])], cat.view = state.view, cat.assign = state.assign, cat.edit = state.edit, cat.editTarget = TARGET_NEEDED.has(state.edit) ? structuredClone(state.editTarget) : null, cat.viewTarget = TARGET_NEEDED.has(state.view) ? {
          ...state.viewTarget
        } : null, cat.assignTarget = TARGET_NEEDED.has(state.assign) ? {
          ...state.assignTarget
        } : null, back.remove(), toast("저장되었습니다."), render({
          group: cat.group,
          sub: cat.sub
        });
      }
    };
  }
  function openManageModal(sel) {
    let draft = groupsOf().map(({
        group,
        subs
      }) => ({
        name: group,
        origName: group,
        subs: subs.map(s => ({
          name: s.sub,
          data: s
        }))
      })),
      dragging = null,
      dirty = !1,
      createGi = null,
      createState = null,
      createInitial = "";
    const selectedCategory = sel ? categories.find(c => c.group === sel.group && c.sub === sel.sub) : null,
      normalizedName = value => value.trim().replace(/\s+/g, " "),
      back = document.createElement("div");
    back.className = "modal-back", back.innerHTML = `
      <div class="modal lg cat-manage-modal">
        <div class="cat-manage-head">
          <button class="btn icon-only sm" data-back hidden aria-label="뒤로">${BACK_ICON}</button>
          <h3 data-modal-title>분류 관리</h3>
        </div>
        <div class="cat-manage-add-group">
          <div class="cat-manage-name-field">
            <input type="text" class="cat-manage-input" placeholder="입력" maxlength="30">
            <p class="field-err" data-addgroup-err hidden>동일한 명칭이 존재합니다.</p>
          </div>
          <button class="btn primary" data-add-group disabled>+ 대분류 추가</button>
        </div>
        <div class="body cat-manage-body"></div>
        <div class="cat-manage-create" hidden></div>
        <div class="foot">
          <button class="btn" data-cancel>취소</button>
          <button class="btn primary" data-confirm disabled>저장</button>
        </div>
      </div>`, document.body.appendChild(back);
    const body = back.querySelector(".cat-manage-body"),
      createEl = back.querySelector(".cat-manage-create"),
      addGroupRow = back.querySelector(".cat-manage-add-group"),
      titleEl = back.querySelector("[data-modal-title]"),
      backBtn = back.querySelector("[data-back]"),
      cancelBtn = back.querySelector("[data-cancel]"),
      confirmBtn = back.querySelector("[data-confirm]"),
      addInput = back.querySelector(".cat-manage-add-group input"),
      addGroupErr = back.querySelector("[data-addgroup-err]");
    let currentMode = "list";
    function computeDups() {
      const groupCounts = /* @__PURE__ */Object.create(null);
      draft.forEach(g => {
        const n = normalizedName(g.name);
        n && (groupCounts[n] = (groupCounts[n] || 0) + 1);
      });
      const groupDups = new Set(Object.keys(groupCounts).filter(n => groupCounts[n] > 1)),
        subDupsByGi = draft.map(g => {
          const counts = /* @__PURE__ */Object.create(null);
          return g.subs.forEach(s => {
            const n = normalizedName(s.name);
            n && (counts[n] = (counts[n] || 0) + 1);
          }), new Set(Object.keys(counts).filter(n => counts[n] > 1));
        });
      return {
        groupDups,
        subDupsByGi
      };
    }
    function updateValidity() {
      const {
        groupDups,
        subDupsByGi
      } = computeDups();
      let anyDup = groupDups.size > 0,
        anyEmpty = !1;
      body.querySelectorAll("[data-rename-group]").forEach(inp => {
        const name = normalizedName(inp.value),
          dup = groupDups.has(name);
        name || (anyEmpty = !0), inp.classList.toggle("has-err", dup), inp.closest(".cat-manage-row").classList.toggle("has-err", dup), inp.parentElement.querySelector("[data-name-err]").hidden = !dup;
      }), body.querySelectorAll("[data-rename-sub]").forEach(inp => {
        const gi = +inp.dataset.renameSub.split("|")[0],
          name = normalizedName(inp.value),
          dup = subDupsByGi[gi] && subDupsByGi[gi].has(name);
        name || (anyEmpty = !0), inp.classList.toggle("has-err", !!dup), inp.closest(".cat-manage-row").classList.toggle("has-err", !!dup), inp.parentElement.querySelector("[data-name-err]").hidden = !dup, dup && (anyDup = !0);
      });
      const addName = normalizedName(addInput.value),
        addDup = !!addName && draft.some(g => normalizedName(g.name) === addName);
      addInput.classList.toggle("has-err", addDup), addGroupErr.hidden = !addDup, back.querySelector("[data-add-group]").disabled = !addName || addDup, currentMode === "list" && (confirmBtn.disabled = !dirty || anyDup || anyEmpty);
    }
    const markDirty = () => {
        dirty = !0, updateValidity();
      },
      clearDragMarks = () => body.querySelectorAll(".drag-over-top,.drag-over-bottom").forEach(el => el.classList.remove("drag-over-top", "drag-over-bottom"));
    function guardedBack() {
      createState && subFormSnapshot(createState) !== createInitial ? confirmModal("페이지를 벗어나시겠습니까?", "페이지를 벗어날 경우 편집한 내용이 저장되지 않습니다.", () => setMode("list")) : setMode("list");
    }
    function setMode(mode) {
      currentMode = mode;
      const isList = mode === "list";
      titleEl.textContent = isList ? "분류 관리" : "소분류 추가", backBtn.hidden = isList, addGroupRow.hidden = !isList, body.hidden = !isList, createEl.hidden = isList, cancelBtn.hidden = !isList, confirmBtn.textContent = "저장", isList ? updateValidity() : confirmBtn.disabled = !0, cancelBtn.onclick = () => {
        back.remove(), render(sel);
      }, confirmBtn.onclick = isList ? saveAll : commitCreate;
    }
    backBtn.onclick = guardedBack, back.addEventListener("click", e => {
      e.target === back && (currentMode === "list" ? cancelBtn.click() : guardedBack());
    });
    function renderBody() {
      body.innerHTML = draft.length ? draft.map((g, gi) => {
        const blocked = g.subs.length > 0;
        return `
        <div class="cat-manage-group">
          <div class="cat-manage-row cat-manage-group-row" draggable="true" data-drag="group" data-gi="${gi}">
            <span class="cat-manage-handle" data-tip="순서 변경">${HANDLE_ICON}</span>
            <div class="cat-manage-name-field">
              <input type="text" class="cat-manage-name-input" data-rename-group="${gi}" value="${g.name}" maxlength="30">
              <p class="field-err" data-name-err hidden>동일한 명칭이 존재합니다.</p>
            </div>
            <div class="cat-manage-row-acts">
              <button class="cat-manage-icon${blocked ? " is-disabled" : ""}" data-del-group="${gi}" aria-label="삭제" aria-disabled="${blocked}"
                data-tip="${blocked ? "등록된 하위 소분류가 있어 삭제할 수 없습니다." : "삭제"}">${TRASH_ICON}</button>
            </div>
          </div>
          <div class="cat-manage-subs">
            ${g.subs.map((s, si) => {
          const hasAssets = assetsOf(s.data.group, s.data.sub).length > 0;
          return `
              <div class="cat-manage-row cat-manage-sub-row" draggable="true" data-drag="sub" data-gi="${gi}" data-si="${si}">
                <span class="cat-manage-handle" data-tip="순서 변경 및 대분류 이동">${HANDLE_ICON}</span>
                <div class="cat-manage-name-field">
                  <input type="text" class="cat-manage-name-input" data-rename-sub="${gi}|${si}" value="${s.name}" maxlength="30">
                  <p class="field-err" data-name-err hidden>동일한 명칭이 존재합니다.</p>
                </div>
                <div class="cat-manage-row-acts">
                  <button class="cat-manage-icon${hasAssets ? " is-disabled" : ""}" data-del-sub="${gi}|${si}" aria-label="삭제" aria-disabled="${hasAssets}"
                    data-tip="${hasAssets ? "등록된 자산이 있어 삭제할 수 없습니다." : "삭제"}">${TRASH_ICON}</button>
                </div>
              </div>`;
        }).join("")}
            ${g.subs.length ? "" : '<p class="cat-tree-empty" style="padding-left:8px">소분류 없음</p>'}
            <button class="btn sm cat-manage-add-sub" data-add-sub="${gi}">+ 소분류 추가</button>
          </div>
        </div>`;
      }).join("") : '<p class="cat-manage-empty">등록된 분류가 없습니다.</p>', updateValidity();
    }
    renderBody();
    function addGroup() {
      const name = normalizedName(addInput.value);
      if (!name || draft.some(g => normalizedName(g.name) === name)) {
        addInput.focus();
        return;
      }
      draft.unshift({
        name,
        origName: null,
        subs: []
      }), addInput.value = "", markDirty(), renderBody();
    }
    back.querySelector("[data-add-group]").onclick = addGroup, addInput.addEventListener("input", updateValidity), addInput.addEventListener("keydown", e => {
      e.key === "Enter" && (e.preventDefault(), addGroup());
    }), body.addEventListener("input", e => {
      const rg = e.target.closest("[data-rename-group]"),
        rs = e.target.closest("[data-rename-sub]");
      if (rg) draft[+rg.dataset.renameGroup].name = e.target.value, markDirty();else if (rs) {
        const [gi, si] = rs.dataset.renameSub.split("|").map(Number);
        draft[gi].subs[si].name = e.target.value, markDirty();
      }
    }), body.addEventListener("click", e => {
      const delGroup = e.target.closest("[data-del-group]"),
        delSub = e.target.closest("[data-del-sub]"),
        addSub = e.target.closest("[data-add-sub]");
      if (delGroup && !delGroup.classList.contains("is-disabled")) draft.splice(+delGroup.dataset.delGroup, 1), markDirty(), renderBody();else if (delSub && !delSub.classList.contains("is-disabled")) {
        const [gi, si] = delSub.dataset.delSub.split("|").map(Number);
        draft[gi].subs.splice(si, 1), markDirty(), renderBody();
      } else addSub && enterCreate(+addSub.dataset.addSub);
    }), body.addEventListener("dragstart", e => {
      const row = e.target.closest("[data-drag]");
      row && (dragging = row.dataset.drag === "group" ? {
        type: "group",
        gi: +row.dataset.gi
      } : {
        type: "sub",
        gi: +row.dataset.gi,
        si: +row.dataset.si
      }, e.dataTransfer.effectAllowed = "move", e.dataTransfer.setData("text/plain", ""), row.classList.add("dragging"));
    }), body.addEventListener("dragend", e => {
      dragging = null, e.target.closest("[data-drag]")?.classList.remove("dragging"), clearDragMarks();
    }), body.addEventListener("dragover", e => {
      if (!dragging) return;
      const subRow = e.target.closest('[data-drag="sub"]'),
        groupRow = e.target.closest('[data-drag="group"]');
      if (dragging.type === "sub" && subRow) {
        e.preventDefault(), clearDragMarks();
        const rect = subRow.getBoundingClientRect();
        subRow.classList.add(e.clientY < rect.top + rect.height / 2 ? "drag-over-top" : "drag-over-bottom");
      } else if (dragging.type === "sub" && groupRow) e.preventDefault(), clearDragMarks(), groupRow.classList.add("drag-over-bottom");else if (dragging.type === "group" && groupRow) {
        e.preventDefault(), clearDragMarks();
        const rect = groupRow.getBoundingClientRect();
        groupRow.classList.add(e.clientY < rect.top + rect.height / 2 ? "drag-over-top" : "drag-over-bottom");
      }
    }), body.addEventListener("drop", e => {
      if (!dragging) return;
      e.preventDefault();
      const subRow = e.target.closest('[data-drag="sub"]'),
        groupRow = e.target.closest('[data-drag="group"]');
      if (dragging.type === "sub") {
        let targetGi, targetIndex;
        if (subRow) targetGi = +subRow.dataset.gi, targetIndex = +subRow.dataset.si + (subRow.classList.contains("drag-over-top") ? 0 : 1);else if (groupRow) targetGi = +groupRow.dataset.gi, targetIndex = draft[targetGi].subs.length;else {
          dragging = null, clearDragMarks();
          return;
        }
        const [moved] = draft[dragging.gi].subs.splice(dragging.si, 1);
        let insertAt = targetIndex;
        dragging.gi === targetGi && dragging.si < targetIndex && (insertAt -= 1), draft[targetGi].subs.splice(insertAt, 0, moved), markDirty(), renderBody();
      } else if (dragging.type === "group" && groupRow) {
        const targetIndex = +groupRow.dataset.gi + (groupRow.classList.contains("drag-over-top") ? 0 : 1),
          [moved] = draft.splice(dragging.gi, 1);
        let insertAt = targetIndex;
        dragging.gi < targetIndex && (insertAt -= 1), draft.splice(insertAt, 0, moved), markDirty(), renderBody();
      }
      dragging = null, clearDragMarks();
    });
    function saveAll() {
      const dups = computeDups(),
        hasEmptyName = draft.some(g => !normalizedName(g.name) || g.subs.some(s => !normalizedName(s.name)));
      if (!dirty || hasEmptyName || dups.groupDups.size > 0 || dups.subDupsByGi.some(s => s.size > 0)) return;
      const newCategories = [],
        newEmptyGroups = [];
      let nextSelection = null;
      draft.forEach(g => {
        const groupName = normalizedName(g.name);
        if (!g.subs.length) {
          newEmptyGroups.push(groupName);
          return;
        }
        g.subs.forEach(s => {
          const oldGroup = s.data.group,
            oldSub = s.data.sub,
            subName = normalizedName(s.name);
          (oldGroup !== groupName || oldSub !== subName) && assets.forEach(a => {
            a.group === oldGroup && a.sub === oldSub && (a.group = groupName, a.sub = subName);
          }), newCategories.push({
            ...s.data,
            group: groupName,
            sub: subName
          }), s.data === selectedCategory && (nextSelection = {
            group: groupName,
            sub: subName
          });
        });
      }), categories.length = 0, categories.push(...newCategories), window.DATA.emptyGroups = newEmptyGroups, back.remove(), toast("저장되었습니다."), render(nextSelection);
    }
    function enterCreate(gi) {
      createGi = gi, createState = {
        name: "",
        type: "individual",
        view: VIEW_OPTIONS[0],
        assign: ASSIGN_BY_VIEW[VIEW_OPTIONS[0]].default,
        edit: ASSIGN_BY_VIEW[VIEW_OPTIONS[0]].default,
        editTarget: {groups:[],jobTitles:[],members:[]},
        viewTarget: {
          groups: [],
          jobTitles: [],
          members: []
        },
        assignTarget: {
          groups: [],
          jobTitles: [],
          members: []
        },
        hiddenFields: [...DEFAULT_HIDDEN_FIELDS.individual]
      }, createInitial = subFormSnapshot(createState), renderCreateForm(), setMode("create"), confirmBtn.disabled = !categoryName(createState.name);
    }
    function renderCreateForm() {
      renderSubForm(createEl, createState, {
        groupLabel: draft[createGi].name,
        typeLocked: !1,
        siblingNames: draft[createGi].subs.map(s => s.name),
        onNameChange: valid => {
          confirmBtn.disabled = !valid;
        }
      });
    }
    function commitCreate() {
      const name = categoryName(createState.name);
      if (!name) return;
      const newCat = {
        group: draft[createGi].origName || draft[createGi].name,
        sub: name,
        type: createState.type,
        hiddenFields: [...createState.hiddenFields], extraEnabled:[...(createState.extraEnabled||[])], privateFields:[...(createState.privateFields||[])],
        view: createState.view,
        assign: createState.assign,
        edit: createState.edit,
        editTarget: TARGET_NEEDED.has(createState.edit) ? structuredClone(createState.editTarget) : null,
        viewTarget: TARGET_NEEDED.has(createState.view) ? {
          ...createState.viewTarget
        } : null,
        assignTarget: TARGET_NEEDED.has(createState.assign) ? {
          ...createState.assignTarget
        } : null
      };
      categories.push(newCat), draft[createGi].subs.push({
        name,
        data: newCat
      }), toast("소분류가 추가되었습니다."), setMode("list"), renderBody();
    }
    setMode("list");
  }
  function wireAssetSection(c, cat) {
    const tbody = c.querySelector("[data-asset-tbody]");
    if (tbody) {
      const items = productsOf(cat.group, cat.sub),
        nameOf = it => it.product,
        stored = JSON.parse(sessionStorage.getItem("asset-category-return") || "null"),
        st = stored?.group === cat.group && stored?.sub === cat.sub ? {
          q: stored.q,
          page: stored.page,
          size: stored.size
        } : {
          q: "",
          page: 1,
          size: 20
        },
        searchInput = c.querySelector("[data-product-search]");
      searchInput.value = st.q;
      const sbox = searchInput.closest(".searchbox"),
        tableWrap = c.querySelector("[data-asset-table]"),
        emptyMsg = c.querySelector("[data-search-empty]"),
        pagerEl = c.querySelector("[data-asset-pager]"),
        countEl = c.querySelector("[data-product-result-count]"),
        pagerHtml = totalPages => {
          const p = st.page,
            winStart = Math.max(1, Math.min(p - 2, totalPages - 4)),
            winEnd = Math.min(totalPages, Math.max(p + 2, winStart + 4)),
            btn = (label, target, disabled, cls = "") => `<button data-page="${target}" ${disabled ? "disabled" : ""} class="${cls}">${label}</button>`,
            nums = [];
          for (let i = winStart; i <= winEnd; i++) nums.push(btn(i, i, !1, i === p ? "active" : ""));
          return `
          <div class="pager">
            ${btn("«", 1, p === 1)}${btn("‹", p - 1, p === 1)}${nums.join("")}${btn("›", p + 1, p === totalPages)}${btn("»", totalPages, p === totalPages)}
            <span class="pagesize"><select data-asset-pagesize>${[20, 50, 100].map(n => `<option value="${n}" ${st.size === n ? "selected" : ""}>${n}</option>`).join("")}</select></span>
          </div>`;
        },
        refresh = () => {
          const q = st.q.trim().toLowerCase(),
            filtered = q ? items.filter(it => nameOf(it).toLowerCase().includes(q)) : items;
          countEl.textContent = filtered.reduce((sum, p) => sum + p.total, 0);
          const totalPages = Math.max(1, Math.ceil(filtered.length / st.size));
          st.page > totalPages && (st.page = totalPages);
          const pageItems = filtered.slice((st.page - 1) * st.size, st.page * st.size);
          tbody.innerHTML = pageItems.map(productRowHtml).join(""), tableWrap.hidden = !filtered.length, emptyMsg.hidden = !!filtered.length, pagerEl.innerHTML = filtered.length ? pagerHtml(totalPages) : "", tbody.querySelectorAll(".cat-prod-row").forEach(row => row.onclick = () => {
            const p = items.find(x => x.product === row.dataset.product);
            p && window.openProductUnitsModal(p.product, p.items);
          }), tbody.querySelectorAll("[data-asset]").forEach(row => row.onclick = e => {
            e.stopPropagation(), sessionStorage.setItem("asset-category-return", JSON.stringify({
              ...st,
              group: cat.group,
              sub: cat.sub
            })), location.href = `asset-detail.html?id=${row.dataset.asset}`;
          }), pagerEl.querySelectorAll("button[data-page]").forEach(b => b.onclick = () => {
            st.page = +b.dataset.page, refresh();
          });
          const sizeSel = pagerEl.querySelector("[data-asset-pagesize]");
          sizeSel && (sizeSel.onchange = () => {
            st.size = +sizeSel.value, st.page = 1, refresh();
          }), sbox.classList.toggle("has-term", !!st.q);
        };
      searchInput.addEventListener("input", () => {
        st.q = searchInput.value, st.page = 1, refresh();
      }), searchInput.onfocus = () => {
        searchInput.classList.add("expanded"), searchInput.placeholder = "품목명";
      }, searchInput.onblur = () => {
        searchInput.value || (searchInput.classList.remove("expanded"), searchInput.placeholder = "검색");
      }, c.querySelector("[data-product-search-clear]").onclick = () => {
        searchInput.value = "", st.q = "", st.page = 1, refresh(), searchInput.focus();
      }, refresh();
    }
    const bulkButton=c.querySelector('[data-bulk-add]');
    if(bulkButton)bulkButton.onclick=()=>{sessionStorage.setItem('asset-bulk-origin',JSON.stringify({group:cat.group,sub:cat.sub}));location.href='assets.html?screen=bulk-register';};
    const addAssetBtn = c.querySelector("[data-add-asset]");
    addAssetBtn && (addAssetBtn.onclick = () => window.openAssetAddModal({
      type: cat.type,
      group: cat.group,
      sub: cat.sub,
      onSaved: () => render({
        group: cat.group,
        sub: cat.sub
      })
    }));
  }
  function render(sel) {
    if(!sel){const params=new URLSearchParams(location.search),group=params.get('group'),sub=params.get('sub');if(categories.some(c=>c.group===group&&c.sub===sub))sel={group,sub};}
    const pendingToast=sessionStorage.getItem('pendingToast');if(pendingToast){sessionStorage.removeItem('pendingToast');toast(pendingToast);}
    if (!sel && performance.getEntriesByType("navigation")[0]?.type === "back_forward") {
      const saved = JSON.parse(sessionStorage.getItem("asset-category-return") || "null");
      saved && (sel = {
        group: saved.group,
        sub: saved.sub
      });
    }
    const c = document.getElementById("content"),
      groups = groupsOf();
    (!sel || !categories.some(x => x.group === sel.group && x.sub === sel.sub)) && (sel = firstSelectable(groups));
    const cat = sel ? categories.find(x => x.group === sel.group && x.sub === sel.sub) : null;
    c.innerHTML = `
      <div class="tabs">
        <a href="assets.html">현황</a>
        <a class="active">분류</a>
        <a href="settings.html">설정</a>
      </div>
      ${groups.length === 0 ? `
        <div class="cat-layout cat-layout-empty">
          <div class="cat-empty-page">
            <p>등록된 분류가 없습니다.</p>
            <button type="button" class="btn sm" data-manage>분류 관리</button>
          </div>
        </div>` : `
        <div class="cat-layout">
          <nav class="cat-tree">${treeHtml(groups, sel)}</nav>
          <div class="cat-detail${cat ? "" : " is-empty"}">${cat ? detailHtml(cat) : `
            <p class="cat-sub-empty">등록된 소분류가 없습니다.</p>
            <button type="button" class="btn sm" data-manage>분류 관리</button>`}</div>
        </div>`}
    `, c.classList.add("cat-split"), c.querySelectorAll("[data-tree]").forEach(b => b.onclick = () => {
      const [group, sub] = b.dataset.tree.split("|");
      render({
        group,
        sub
      });
    }), c.querySelectorAll("[data-toggle]").forEach(b => b.onclick = () => {
      const g = b.dataset.toggle;
      collapsedGroups.has(g) ? collapsedGroups.delete(g) : collapsedGroups.add(g), render(sel);
    }), c.querySelectorAll("[data-manage]").forEach(b => b.onclick = () => openManageModal(sel)); c.querySelectorAll("[data-manage-dropdown]").forEach(b=>b.onclick=()=>openManagementMenu(b,sel));
    const editBtn = c.querySelector("[data-edit-sub]");
    editBtn && (editBtn.onclick = () => openSubEditModal(cat)), c.querySelectorAll("[data-perm-target]").forEach(b => b.onclick = () => openPermTargetModal(cat, b.dataset.permTarget)), wireAssetSection(c, cat);
  }
  window.CategoryScreen = {
    render: () => render(null)
  };
})();
