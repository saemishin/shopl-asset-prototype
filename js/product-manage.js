// Company product administration: tag-manager layout, scoped to one subcategory.
(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M9.5 7l.7 13a1 1 0 0 0 1 1h5.6a1 1 0 0 0 1-1l.7-13"/></svg>';
  function toast(text) { const node=document.createElement('div');node.className='product-manage-toast';node.textContent=text;document.body.appendChild(node);setTimeout(()=>node.remove(),1800); }
  function confirmExit(onLeave) {
    const back=document.createElement('div');back.className='modal-back';back.style.zIndex=410;
    back.innerHTML='<div class="modal sm" role="dialog" aria-modal="true" aria-label="수정을 취소하시겠습니까?"><h3>수정을 취소하시겠습니까?</h3><div class="body">취소할 경우 수정한 내용이 저장되지 않습니다.</div><div class="foot"><button class="btn" data-stay>취소</button><button class="btn primary" data-leave>확인</button></div></div>';
    back.querySelector('[data-stay]').onclick=()=>back.remove();back.querySelector('[data-leave]').onclick=()=>{back.remove();onLeave();};document.body.appendChild(back);
  }
  window.openAssetProductManageModal = function(onSaved, initialCategory) {
    if (!window.hasPrototypeAssetManagePermission()) return;
    const catalog=window.AssetProducts;
    let category=window.DATA.categories.find(c=>initialCategory&&c.group===initialCategory.group&&c.sub===initialCategory.sub)||null;
    let original=[],draft=[],serial=0,serverDuplicates=new Set();
    const back=document.createElement('div');back.className='modal-back';back.dataset.productManage='';
    back.innerHTML='<div class="modal sm" role="dialog" aria-modal="true" aria-label="품목 관리"><h3>품목 관리</h3><div class="body"><p class="tpl-manage-desc">소분류별 품목을 추가하고 관리합니다.</p><div class="field product-manage-category"><label>소분류</label><button type="button" class="perm-target-btn" data-pm-category></button></div><div class="tag-manage-add"><input type="text" class="cat-manage-input" data-pm-input placeholder="입력" maxlength="50" aria-label="추가할 품목명"><button type="button" class="btn primary" data-pm-add disabled>+ 추가</button></div><p class="field-err" data-pm-add-error hidden>동일한 명칭이 존재합니다.</p><div class="tag-manage-list" data-pm-list style="margin-top:14px"></div></div><div class="foot"><button type="button" class="btn" data-pm-cancel>취소</button><button type="button" class="btn primary" data-pm-save disabled>저장</button></div></div>';
    document.body.appendChild(back);
    const input=back.querySelector('[data-pm-input]'),add=back.querySelector('[data-pm-add]'),save=back.querySelector('[data-pm-save]'),list=back.querySelector('[data-pm-list]'),field=back.querySelector('[data-pm-category]');
    const snapshot=rows=>JSON.stringify(rows.map(p=>[p.id,catalog.normalize(p.name)]).sort((a,b)=>a[0].localeCompare(b[0])));
    const dirty=()=>snapshot(draft)!==snapshot(original);
    const duplicates=()=>new Set(draft.filter(p=>draft.filter(q=>catalog.normalize(q.name)===catalog.normalize(p.name)).length>1).map(p=>p.id));
    function validate() {
      const dup=duplicates(),q=catalog.normalize(input.value),addDup=!!q&&draft.some(p=>catalog.normalize(p.name)===q);
      input.disabled=!category;add.disabled=!category||!q||addDup;
      input.classList.toggle('has-err',addDup);back.querySelector('[data-pm-add-error]').hidden=!addDup;
      for (const el of list.querySelectorAll('[data-pm-name]')) {
        const p=draft.find(p=>p.id===el.dataset.pmName),empty=!catalog.normalize(p.name),conflict=dup.has(p.id)||serverDuplicates.has(p.id);
        el.classList.toggle('has-err',empty||conflict);el.setAttribute('aria-invalid',String(empty||conflict));
        const err=el.parentElement.querySelector('.field-err');err.hidden=!empty&&!conflict;err.textContent=empty?'명칭은 필수로 입력해야 합니다.':'동일한 명칭이 존재합니다.';
      }
      save.disabled=!category||!dirty()||dup.size>0||serverDuplicates.size>0||draft.some(p=>!catalog.normalize(p.name));
    }
    function draw() {
      field.innerHTML=category?`<span>${esc(category.group)} › ${esc(category.sub)}</span><span>›</span>`:'<span class="muted">선택</span><span>›</span>';
      list.innerHTML=!category?'<p class="tag-manage-empty">소분류를 선택해주세요.</p>':draft.length?draft.map(p=>{
        const locked=catalog.assetsOf(p.id).length>0;
        return `<div class="cat-manage-row"><div class="tag-manage-name-field"><input type="text" class="cat-manage-name-input" data-pm-name="${p.id}" value="${esc(p.name)}" maxlength="50" aria-label="품목명"><p class="field-err" hidden></p></div><div class="cat-manage-row-acts"><span class="product-delete-wrap"${locked?' tabindex="0" data-tip="등록된 자산이 있어 삭제할 수 없습니다."':''}><button type="button" class="cat-manage-icon" data-pm-delete="${p.id}" aria-label="${esc(p.name)} 삭제"${locked?' disabled':''}>${TRASH}</button></span></div></div>`;
      }).join(''):'<p class="tag-manage-empty">등록된 품목이 없습니다.</p>';
      list.querySelectorAll('[data-pm-name]').forEach(el=>el.oninput=()=>{draft.find(p=>p.id===el.dataset.pmName).name=el.value;serverDuplicates.delete(el.dataset.pmName);validate();});
      list.querySelectorAll('[data-pm-delete]').forEach(button=>button.onclick=()=>{
        if(button.disabled||catalog.assetsOf(button.dataset.pmDelete).length)return;
        draft=draft.filter(p=>p.id!==button.dataset.pmDelete);serverDuplicates.delete(button.dataset.pmDelete);draw();
      });validate();
    }
    function load(next) { category=next;original=next?catalog.list(next.group,next.sub).map(p=>({...p})):[];draft=original.map(p=>({...p}));serverDuplicates.clear();input.value='';draw(); }
    field.onclick=()=>{
      window.openAssetCategoryPickModal(window.DATA.categories,category?`${category.group}|${category.sub}`:null,value=>{
        const next=window.DATA.categories.find(c=>`${c.group}|${c.sub}`===value);
        if(!next||next===category)return;
        dirty()?confirmExit(()=>load(next)):load(next);
      });
      const picker=document.querySelector('.modal-back:last-child');if(picker)picker.style.zIndex=390;
    };
    function addRow(){if(add.disabled)return;draft.unshift({id:`draft-${++serial}`,name:catalog.normalize(input.value)});input.value='';draw();}
    input.oninput=validate;input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();addRow();}};add.onclick=addRow;
    back.querySelector('[data-pm-cancel]').onclick=()=>dirty()?confirmExit(()=>back.remove()):back.remove();
    save.onclick=()=>{
      validate();if(save.disabled)return;
      try {catalog.save(category.group,category.sub,original,draft);back.remove();toast('저장되었습니다.');onSaved?.();}
      catch(e){
        if(e.code==='PERMISSION'){back.remove();toast('자산 관리 권한이 없습니다.');onSaved?.();return;}
        if(e.code==='DUPLICATE'){serverDuplicates.add(e.id);validate();return;}
        if(e.code==='IN_USE'){const p=original.find(p=>p.id===e.id);if(p&&!draft.some(x=>x.id===p.id))draft.push({...p});draw();toast('설정이 변경되었습니다. 잠시 후 다시 시도해주세요.');return;}
        toast(e.code==='CATEGORY_CHANGED'||e.code==='CHANGED'?'설정이 변경되었습니다. 잠시 후 다시 시도해주세요.':'에러가 발생하였습니다. 잠시 후 다시 시도해보세요.');
      }
    };load(category);return back;
  };
})();
