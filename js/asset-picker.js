// 공통14: 배정 가능 자산의 임시 복수 선택. 상한은 호출 화면이 전달한다.
(() => {
  const esc = value => window.AssetExtra.esc(value);
  const eligible = a => !!a && !a.deleted_at && a.status === 'stock' && !(a.assignments || []).length && window.AssetAccess.canView(a) && window.AssetAccess.canState(a);
  const thumb = a => {
    const photos = window.assetPhotos(a), photo = photos[a._primary || 0];
    return `<span class="thumb${photo ? '' : ' empty'}"${photo ? ` style="background:${esc(photo.color)}"` : ''}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 15 5-4 4 3 4-4 5 4"/></svg></span>`;
  };
  function open({initial = [], excludeIds = [], maxSelection = Infinity, onApply}) {
    const selection = new Map(initial.map(a => [a.id, a])), initialCount = selection.size,
      excluded = new Set(excludeIds), selector = document.createElement('div');
    let query = '', categoryScope = [];
    const categories = window.DATA.categories.filter(c => {const a = {group:c.group, sub:c.sub, status:'stock'}; return window.AssetAccess.canView(a) && window.AssetAccess.canState(a);});
    selector.className = 'modal-back'; selector.style.zIndex = 350;
    selector.innerHTML = `<div class="modal link-select-modal" role="dialog" aria-modal="true" aria-label="자산 선택"><h3>자산 선택</h3><div class="body"><div class="link-select-columns"><section class="link-select-pane"><div class="link-select-tools"><button type="button" class="btn" data-stock-category>분류 <span data-stock-scope-label>전체</span> ▾</button><input type="text" class="picker-search" placeholder="품목명/고유관리번호" aria-label="품목명 또는 고유관리번호 검색" data-stock-search></div><div class="link-select-pane-head">전체 <b data-stock-total>0</b></div><div class="link-list link-select-scroll" data-stock-results></div></section><section class="link-select-pane"><div class="link-select-pane-head">선택됨 <b data-stock-count>0</b></div><div class="link-list link-select-scroll" data-stock-selected></div></section></div></div><div class="foot"><button class="btn" data-stock-cancel>취소</button><button class="btn primary" data-stock-apply>적용</button></div></div>`;
    document.body.appendChild(selector);
    const draw = () => {
      const rows = window.DATA.assets.filter(a => eligible(a) && !excluded.has(a.id))
        .filter(a => (!query || [a.product,a.assetNo].some(v => String(v || '').toLowerCase().includes(query))) && (!categoryScope.length || categoryScope.includes(`${a.group}/${a.sub}`)))
        .sort((a,b) => a.product.localeCompare(b.product,'ko') || String(a.assetNo).localeCompare(String(b.assetNo))),
        results = selector.querySelector('[data-stock-results]'), selected = selector.querySelector('[data-stock-selected]'), scroll = results.scrollTop;
      selector.querySelector('[data-stock-total]').textContent = rows.length;
      selector.querySelector('[data-stock-count]').textContent = selection.size;
      selector.querySelector('[data-stock-scope-label]').textContent = categoryScope.length ? categoryScope[0].split('/').slice(1).join('/') + (categoryScope.length > 1 ? ` +${categoryScope.length-1}` : '') : '전체';
      results.innerHTML = rows.length ? rows.map(a => `<label class="link-cand${selection.has(a.id) ? ' on' : ''}"><input type="checkbox" data-pick="${esc(a.id)}"${selection.has(a.id) ? ' checked' : ''}${!selection.has(a.id) && selection.size >= maxSelection ? ' disabled' : ''}>${thumb(a)}<span class="link-row-main"><span class="link-row-name">${esc(a.product)}</span><span class="link-row-no">${esc(a.assetNo)}</span></span></label>`).join('') : `<p class="muted link-empty">${query || categoryScope.length ? '결과가 없습니다.' : '표시할 목록이 없습니다.'}</p>`;
      results.scrollTop = scroll;
      selected.innerHTML = selection.size ? [...selection.values()].map(a => `<div class="link-selected-row">${thumb(a)}<div class="link-row-main"><span class="link-row-name">${esc(a.product)}</span><span class="link-row-no">${esc(a.assetNo)}</span></div><button type="button" class="link-selected-remove" data-stock-remove="${esc(a.id)}" aria-label="${esc(a.product)} ${esc(a.assetNo)} 선택 해제">×</button></div>`).join('') : '<p class="muted link-empty">선택된 자산이 없습니다.</p>';
      selector.querySelector('[data-stock-apply]').disabled = !selection.size && !initialCount;
      results.querySelectorAll('[data-pick]').forEach(c => c.onchange = () => {const a = window.DATA.assets.find(a => a.id === c.dataset.pick); c.checked ? selection.set(a.id,a) : selection.delete(a.id); draw();});
      selected.querySelectorAll('[data-stock-remove]').forEach(b => b.onclick = () => {selection.delete(b.dataset.stockRemove); draw();});
    };
    selector.querySelector('[data-stock-search]').oninput = e => {query = e.target.value.trim().toLowerCase(); selector.querySelector('[data-stock-results]').scrollTop = 0; draw();};
    selector.querySelector('[data-stock-category]').onclick = () => window.openAssetCategoryScopeModal({categories, selected:categoryScope, onApply:values => {categoryScope = values; selector.querySelector('[data-stock-results]').scrollTop = 0; draw();}});
    selector.querySelector('[data-stock-cancel]').onclick = () => selector.remove();
    selector.querySelector('[data-stock-apply]').onclick = () => {if (selector.querySelector('[data-stock-apply]').disabled) return; selector.remove(); onApply([...selection.values()]);};
    draw(); selector.querySelector('[data-stock-search]').focus();
    return selector;
  }
  window.AssetPicker = {open, eligible};
})();
