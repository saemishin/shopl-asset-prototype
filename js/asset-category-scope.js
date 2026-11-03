// 공통01 조회 범위 분류 선택: 임시 선택 후 적용, 검색/전체/초기화.
(() => {
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  window.openAssetCategoryScopeModal = ({ categories, selected = [], onApply, zIndex = 360 }) => {
    const groups = new Map(), ordered = [];
    categories.forEach(c => {
      const key = `${c.group}/${c.sub}`;
      if (ordered.includes(key)) return;
      ordered.push(key);
      if (!groups.has(c.group)) groups.set(c.group, []);
      groups.get(c.group).push({ sub:c.sub, key });
    });
    const draft = new Set(selected.filter(key => ordered.includes(key))), back = document.createElement("div");
    let query = "";
    back.className = "modal-back";
    back.style.zIndex = zIndex;
    back.innerHTML = `<div class="modal asset-category-scope-modal" role="dialog" aria-label="분류 선택"><h3>분류</h3><div class="body">${groups.size ? '<input type="text" class="picker-search" placeholder="검색" aria-label="분류 검색" data-scope-search><div data-scope-list></div>' : '<p class="muted">표시할 목록이 없습니다.</p>'}</div><div class="foot"><button class="btn" data-scope-cancel>취소</button><button class="btn primary" data-scope-apply${groups.size ? "" : " disabled"}>적용</button></div></div>`;
    document.body.appendChild(back);
    const shown = () => {
      const q = query.trim().toLowerCase();
      return [...groups].map(([group, subs]) => ({group, subs:subs.filter(c => !q || group.toLowerCase().includes(q) || c.sub.toLowerCase().includes(q))})).filter(g => g.subs.length);
    };
    const draw = () => {
      if (!groups.size) return;
      const rows = shown(), visibleKeys = rows.flatMap(g => g.subs.map(c => c.key)), all = visibleKeys.length && visibleKeys.every(key => draft.has(key));
      back.querySelector("[data-scope-list]").innerHTML = `<div class="picker-toolbar"><label class="picker-check"><input type="checkbox" data-scope-all${all ? " checked" : ""}><span>전체</span></label><span class="right"><button class="filter-reset" data-scope-reset aria-label="초기화">↻</button></span></div>${rows.map(({group,subs}) => `<label class="opt"><input type="checkbox" data-scope-group="${esc(group)}"${subs.every(c => draft.has(c.key)) ? " checked" : ""}><b>${esc(group)}</b></label>${subs.map(c => `<label class="opt child"><input type="checkbox" data-scope-key="${esc(c.key)}"${draft.has(c.key) ? " checked" : ""}>${esc(c.sub)}</label>`).join("")}`).join("") || '<p class="muted">결과가 없습니다.</p>'}`;
      // 전체·대분류의 일부 선택은 native indeterminate로 표시한다.
      const syncPartial = (el, keys) => {
        const count = keys.filter(key => draft.has(key)).length;
        el.indeterminate = count > 0 && count < keys.length;
        el.setAttribute("aria-checked", el.indeterminate ? "mixed" : String(el.checked));
      };
      syncPartial(back.querySelector("[data-scope-all]"), visibleKeys);
      back.querySelectorAll("[data-scope-group]").forEach(el => {
        syncPartial(el, rows.find(g => g.group === el.dataset.scopeGroup).subs.map(c => c.key));
      });
      const setKeys = (keys, checked) => keys.forEach(key => checked ? draft.add(key) : draft.delete(key));
      back.querySelector("[data-scope-all]").onchange = e => { setKeys(visibleKeys,e.target.checked); draw(); };
      back.querySelector("[data-scope-reset]").onclick = () => { draft.clear(); draw(); };
      back.querySelectorAll("[data-scope-group]").forEach(el => el.onchange = () => { setKeys(rows.find(g => g.group === el.dataset.scopeGroup).subs.map(c => c.key),el.checked); draw(); });
      back.querySelectorAll("[data-scope-key]").forEach(el => el.onchange = () => { setKeys([el.dataset.scopeKey],el.checked); draw(); });
    };
    back.querySelector("[data-scope-cancel]").onclick = () => back.remove();
    back.querySelector("[data-scope-apply]").onclick = () => {
      const picked = ordered.filter(key => draft.has(key));
      back.remove(); onApply(picked.length === ordered.length ? [] : picked);
    };
    if (groups.size) { back.querySelector("[data-scope-search]").oninput = e => { query=e.target.value; draw(); }; draw(); }
    return back;
  };
})();
