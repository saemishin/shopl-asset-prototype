// 공통01 조회 범위 분류 선택: 임시 선택 후 적용, 검색/전체/초기화.
(() => {
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  window.openAssetCategoryScopeModal = ({categories, selected=[], onApply, zIndex=360}) => {
    const baseline=categories.slice(),initial=selected.slice(),groups=new Map(),ordered=[];
    const draft=new Set(),back=document.createElement('div');
    let query='',activeCase='default';
    function prepare(list){
      groups.clear();ordered.splice(0);
      list.forEach(c=>{const key=`${c.group}/${c.sub}`;if(ordered.includes(key))return;ordered.push(key);if(!groups.has(c.group))groups.set(c.group,[]);groups.get(c.group).push({sub:c.sub,key});});
    }
    prepare(baseline);initial.filter(key=>ordered.includes(key)).forEach(key=>draft.add(key));
    back.className='modal-back';back.style.zIndex=zIndex;
    back.innerHTML='<div class="modal asset-category-scope-modal" role="dialog" aria-label="분류 선택"><h3>분류</h3><div class="body"></div><div class="foot"><button class="btn" data-scope-cancel>취소</button><button class="btn primary" data-scope-apply>적용</button></div></div>';
    document.body.appendChild(back);
    const shown=()=>{const q=query.trim().toLowerCase();return [...groups].map(([group,subs])=>({group,subs:subs.filter(c=>!q||group.toLowerCase().includes(q)||c.sub.toLowerCase().includes(q))})).filter(g=>g.subs.length);};
    function draw(){
      if(!groups.size)return;
      const rows=shown(),visibleKeys=rows.flatMap(g=>g.subs.map(c=>c.key)),all=visibleKeys.length&&visibleKeys.every(key=>draft.has(key));
      back.querySelector('[data-scope-list]').innerHTML=`<div class="picker-toolbar"><label class="picker-check"><input type="checkbox" data-scope-all${all?' checked':''}><span>전체</span></label><span class="right"><button class="filter-reset" data-scope-reset aria-label="초기화">↻</button></span></div>${rows.map(({group,subs})=>`<label class="opt"><input type="checkbox" data-scope-group="${esc(group)}"${subs.every(c=>draft.has(c.key))?' checked':''}><b>${esc(group)}</b></label>${subs.map(c=>`<label class="opt child"><input type="checkbox" data-scope-key="${esc(c.key)}"${draft.has(c.key)?' checked':''}>${esc(c.sub)}</label>`).join('')}`).join('')||'<p class="muted">결과가 없습니다.</p>'}`;
      const syncPartial=(el,keys)=>{const n=keys.filter(key=>draft.has(key)).length;el.indeterminate=n>0&&n<keys.length;el.setAttribute('aria-checked',el.indeterminate?'mixed':String(el.checked));};
      syncPartial(back.querySelector('[data-scope-all]'),visibleKeys);
      back.querySelectorAll('[data-scope-group]').forEach(el=>syncPartial(el,rows.find(g=>g.group===el.dataset.scopeGroup).subs.map(c=>c.key)));
      const setKeys=(keys,checked)=>keys.forEach(key=>checked?draft.add(key):draft.delete(key));
      const changed=()=>{activeCase='manual';draw();window.PrototypeCases?.refresh();};
      back.querySelector('[data-scope-all]').onchange=e=>{setKeys(visibleKeys,e.target.checked);changed();};
      back.querySelector('[data-scope-reset]').onclick=()=>{draft.clear();changed();};
      back.querySelectorAll('[data-scope-group]').forEach(el=>el.onchange=()=>{setKeys(rows.find(g=>g.group===el.dataset.scopeGroup).subs.map(c=>c.key),el.checked);changed();});
      back.querySelectorAll('[data-scope-key]').forEach(el=>el.onchange=()=>{setKeys([el.dataset.scopeKey],el.checked);changed();});
    }
    function body(){
      back.querySelector('.body').innerHTML=groups.size?'<input type="text" class="picker-search" placeholder="검색" aria-label="분류 검색" data-scope-search><div data-scope-list></div>':'<p class="muted">표시할 목록이 없습니다.</p>';
      back.querySelector('[data-scope-apply]').disabled=!groups.size;
      if(groups.size){const input=back.querySelector('[data-scope-search]');input.value=query;input.oninput=()=>{query=input.value;activeCase='manual';draw();window.PrototypeCases?.refresh();};draw();}
    }
    back.querySelector('[data-scope-cancel]').onclick=()=>back.remove();
    back.querySelector('[data-scope-apply]').onclick=()=>{const picked=ordered.filter(key=>draft.has(key));back.remove();onApply(picked.length===ordered.length?[]:picked);};
    body();
    if(window.PrototypeCases){
      function applyCase(key){
        prepare(key==='no-candidates'?[]:baseline);draft.clear();query='';activeCase=key;
        if(key==='default')initial.filter(k=>ordered.includes(k)).forEach(k=>draft.add(k));
        if(key==='all'||key==='search-group'||key==='search-sub')ordered.forEach(k=>draft.add(k));
        if(key==='partial')ordered.filter((key,i)=>i!==1).forEach(k=>draft.add(k));
        if(key==='one'&&ordered[0])draft.add(ordered[0]);
        if(key==='search-group')query=baseline[0]?.group||'';
        if(key==='search-sub')query=baseline[0]?.sub||'';
        if(key==='no-results')query='일치하지 않는 분류';
        body();window.PrototypeCases.refresh();
      }
      const item=(id,label,reference,disabled=false)=>({id,label,reference,disabled,run:()=>applyCase(id)});
      window.PrototypeCases.register({
        id:`category-scope-${Date.now()}`,root:back,title:'분류 선택 · 조회 범위',reference:'Web 공통01',
        get active(){return activeCase;},set active(value){activeCase=value;},
        summary:()=>`조회 후보 ${ordered.length}개 · 선택 ${draft.size}개${query?` · 검색: ${query}`:''}`,
        reset:()=>applyCase('default'),
        sections:[
          {title:'선택 상태',items:[item('default','진입 시 선택값','명세 4',!baseline.length),item('none','선택 없음·초기화 후','명세 3·6',!baseline.length),item('one','소분류 1개 선택','명세 4',!baseline.length),item('partial','일부 선택·중간 체크','명세 2·4',baseline.length<2),item('all','전체 선택','명세 2·4·6',!baseline.length)]},
          {title:'검색 결과',items:[item('search-group','대분류명 일치','명세 1',!baseline.length),item('search-sub','소분류명 일치','명세 1',!baseline.length),item('no-results','검색 결과 없음','명세 1·6',!baseline.length)]},
          {title:'조회 범위',items:[item('no-candidates','조회 가능한 소분류 없음','Case 4-2')]}
        ]
      });
    }
    return back;
  };
})();
