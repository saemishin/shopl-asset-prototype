// 직접 배정과 구성원·근무지 상세의 대상 고정 배정. 선택 적용은 초안만 변경한다.
(() => {
  const esc = value => window.AssetExtra.esc(value), TODAY = '2026-09-04';
  const activeTarget = (kind,name) => !!name && !['retired','resigned','inactive'].includes(window.DATA.targetStatuses?.[kind]?.[name]);
  const validDate = value => {
    const digits = String(value).replace(/\D/g,'');
    if (digits.length !== 8) return null;
    const y = +digits.slice(0,4), m = +digits.slice(4,6), d = +digits.slice(6,8), date = new Date(y,m-1,d), iso = `${digits.slice(0,4)}-${digits.slice(4,6)}-${digits.slice(6,8)}`;
    return y >= 1926 && date.getFullYear() === y && date.getMonth() === m-1 && date.getDate() === d && iso <= TODAY ? iso : null;
  };
  const modal = (title,body,footer,z=320) => {
    const back = document.createElement('div'); back.className = 'modal-back'; back.style.zIndex = z;
    back.innerHTML = `<div class="modal scroll-body" style="width:460px" role="dialog" aria-modal="true" aria-label="${esc(title)}"><h3>${esc(title)}</h3><div class="body">${body}</div><div class="foot">${footer}</div></div>`;
    document.body.appendChild(back); return back;
  };
  const confirm = (title,body,onConfirm) => {
    const back = modal(title,body,'<button class="btn" data-confirm-cancel>취소</button><button class="btn primary" data-confirm-ok>확인</button>',380);
    back.querySelector('[data-confirm-cancel]').onclick = () => back.remove();
    back.querySelector('[data-confirm-ok]').onclick = () => {back.remove(); onConfirm();};
  };
  function assignBatch(items,record) {
    // 전부 검사한 뒤 한 번에 반영한다. 상태/기록 저장 중 예외도 전부 되돌린다.
    if (!items.length || !validDate(record.since) || !activeTarget(record.employee ? 'employee' : 'worksite',record.employee || record.worksite) || !!record.employee === !!record.worksite || new Set(items.map(a=>a.id)).size !== items.length || items.some(a=>!window.DATA.assets.includes(a) || !window.AssetPicker.eligible(a))) throw new Error('ASSET_CHANGED');
    const stamp = `${TODAY} ${new Date().toTimeString().slice(0,8)}`, snapshots = items.map(a => ({a,status:a.status,assignments:a.assignments,updatedAt:a.updatedAt,log:a._activityLog}));
    try {
      items.forEach(a => {
        a.assignments = [{...record}]; a.status = 'assigned'; a.updatedAt = stamp;
        const entry = {d:stamp,who:'dana',script:'배정 관리: 신규 배정',target:{...record},before:'',after:window.fmtDate(record.since)};
        // 배정 가능 시드 자산의 이전 등록/메모 이력도 보존한다.
        const initial = a._activityLog || [{d:`${a.createdAt || a.purchaseDate || '2024-01-01'} 09:00`,who:'dana',script:'자산 등록'}, ...(a.note ? [{d:'2026-06-02 09:00',who:'dana',script:'자산 정보 수정: 메모 수정',before:'',after:a.note}] : [])].sort((x,y)=>x.d < y.d ? 1 : -1);
        a._activityLog = [entry,...initial];
      });
    } catch (error) {
      snapshots.forEach(({a,...old}) => {a.status=old.status; a.assignments=old.assignments; for(const [key,value] of [['updatedAt',old.updatedAt],['_activityLog',old.log]]) value === undefined ? delete a[key] : a[key]=value;});
      throw error;
    }
  }
  function open({members = [],worksites = {},fixedTarget = null,onSaved,onChanged,toast}) {
    let selected = [], kind = fixedTarget?.type || null, dateText = '';
    const target = {employee:null,worksite:null};
    if(fixedTarget){target[fixedTarget.type]=fixedTarget.value; if(!activeTarget(fixedTarget.type,fixedTarget.value)){toast('설정이 변경되었습니다. 잠시 후 다시 시도해주세요.');return;}}
    const back = modal('자산 배정','<div data-assignment-body></div>','<button class="btn" data-assignment-cancel>취소</button><button class="btn primary" data-assignment-save disabled>저장</button>');
    const body = back.querySelector('[data-assignment-body]'), save = back.querySelector('[data-assignment-save]');
    const candidates = k => (k === 'employee' ? members.map(m=>({...m,value:m.name,search:[m.name,m.empNo,m.phone]})) : Object.entries(worksites).map(([name,code])=>({name,value:name,code,search:[name,code]}))).filter(x=>activeTarget(k,x.value)).sort((a,b)=>a.name.localeCompare(b.name,'ko'));
    function pickTarget() {
      const k = kind;
      window.TargetPicker.open({kind:k, members:members.filter(m=>activeTarget('employee',m.name)), worksites:Object.fromEntries(Object.entries(worksites).filter(([n])=>activeTarget('worksite',n))), initial:target[k], onApply:v=>{target[k]=v; draw();}});
    }
    const sync = () => {save.disabled = !(selected.length && kind && target[kind] && validDate(dateText));};
    function draw() {
      const fixedCard = fixedTarget ? `<div class="field"><label>배정 대상</label><div class="aa-asset-summary target-assignment-summary">${fixedTarget.type === 'worksite' ? '<span class="acard-avatar ws"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 20V9.5L12 4l8 5.5V20"/><path d="M9.5 20v-5h5v5"/></svg></span>' : `<span class="picker-avatar" style="background:${esc(fixedTarget.color || '#5b8def')}">${esc(fixedTarget.value[0])}</span>`}<div class="aa-asset-summary-main"><strong>${esc(fixedTarget.value)}</strong><span>${esc(fixedTarget.subtitle || '')}</span></div></div></div>` : '';
      const assetsField = `<div class="field"><label>자산</label><div class="link-search-field"><input class="picker-search" type="text" readonly placeholder="선택" value="${esc(selected[0]?.product||'')}" aria-label="배정할 자산 선택" aria-haspopup="dialog" data-assignment-assets>${selected.length>1?`<span class="link-search-count tpl-selection-count">+${selected.length-1}</span>`:''}${selected.length?`<button type="button" class="tpl-field-clear" data-assignment-assets-clear aria-label="자산 선택 해제"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`:''}</div></div>`, targetFields = `<div class="field"><label>배정 대상</label>${[['employee','구성원'],['worksite','근무지']].map(([k,label])=>`<label class="radio-row"><input type="radio" name="assignment-kind" value="${k}"${kind===k?' checked':''}><span>${label}</span></label>${kind===k?`<div class="perm-target-wrap">${target[k]?`<div class="aa-target-selected" data-assignment-target role="button" tabindex="0" aria-label="배정 대상 다시 선택"><span class="perm-chip">${esc(target[k])}</span><button type="button" class="aa-target-x" aria-label="배정 대상 선택 해제" data-assignment-clear>×</button></div>`:'<button type="button" class="perm-target-btn" data-assignment-target><span class="muted">선택</span><span class="chev">›</span></button>'}</div>`:''}`).join('')}</div>`, dateField = `<div class="field"><label>배정일</label><div class="dfield"><input type="text" inputmode="numeric" placeholder="YYYY.MM.DD" maxlength="10" value="${esc(dateText)}" aria-label="배정일" data-assignment-date><span class="dfield-pick"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg><input type="date" min="1926-01-01" max="${TODAY}" data-assignment-calendar tabindex="-1"></span></div><p class="field-err" data-assignment-date-error hidden>유효한 날짜가 아닙니다.</p></div>`;
      body.innerHTML = fixedCard + assetsField + (fixedTarget ? '' : targetFields) + dateField;
      const openAssets=()=>window.AssetPicker.open({initial:selected,onApply:items=>{selected=items; draw();}}), input=body.querySelector('[data-assignment-assets]');
      input.onclick=openAssets; body.querySelector('[data-assignment-assets-clear]')?.addEventListener('click',e=>{e.stopPropagation();selected=[];draw();}); input.onkeydown=e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();openAssets();}};
      body.querySelectorAll('[name="assignment-kind"]').forEach(r=>r.onchange=()=>{kind=r.value; draw();});
      const targetField=body.querySelector('[data-assignment-target]');
      targetField?.addEventListener('click',pickTarget);
      targetField?.addEventListener('keydown',e=>{if(e.target===targetField && ['Enter',' '].includes(e.key)){e.preventDefault();pickTarget();}});
      body.querySelector('[data-assignment-clear]')?.addEventListener('click',e=>{e.stopPropagation();target[kind]=null; draw();});
      const text=body.querySelector('[data-assignment-date]'), error=body.querySelector('[data-assignment-date-error]'), showError=on=>{error.hidden=!on; text.classList.toggle('has-err',on);};
      text.oninput=()=>{const d=text.value.replace(/\D/g,'').slice(0,8); dateText=d.length>6?`${d.slice(0,4)}.${d.slice(4,6)}.${d.slice(6)}`:d.length>4?`${d.slice(0,4)}.${d.slice(4)}`:d; text.value=dateText; showError(false); sync();};
      text.onblur=()=>showError(!!dateText&&!validDate(dateText));
      body.querySelector('[data-assignment-calendar]').onchange=e=>{if(e.target.value){dateText=e.target.value.replace(/-/g,'.');text.value=dateText;}showError(!!dateText&&!validDate(dateText));sync();};
      sync();
    }
    back.querySelector('[data-assignment-cancel]').onclick=()=>{
      if(selected.length || (!fixedTarget && (kind || Object.values(target).some(Boolean))) || dateText.trim()) confirm('취소하시겠습니까?','취소 시 편집한 내용이 저장되지 않습니다.',()=>back.remove());
      else back.remove();
    };
    save.onclick=()=>{
      if(save.disabled)return;
      const snapshot=selected.map(a=>({a,group:a.group,sub:a.sub})), record={employee:kind==='employee'?target.employee:null,worksite:kind==='worksite'?target.worksite:null,since:validDate(dateText)};
      confirm('배정하시겠습니까?','',()=>{
        try {
          if(snapshot.some(x=>x.a.group!==x.group||x.a.sub!==x.sub)||!candidates(kind).some(x=>x.value===target[kind]))throw new Error('ASSET_CHANGED');
          if(new URLSearchParams(location.search).get('assignmentError')==='system')throw new Error('SYSTEM_ERROR');
          assignBatch(selected,record); back.remove(); onSaved(); toast('배정되었습니다.');
        } catch(error) {
          if(error.message==='ASSET_CHANGED'){back.remove();onChanged();toast('설정이 변경되었습니다. 잠시 후 다시 시도해주세요.');}
          else toast('에러가 발생하였습니다. 잠시 후 다시 시도해보세요.');
        }
      });
    };
    draw(); return back;
  }
  window.AssetAssignment = {open,assignBatch,validDate};
})();
