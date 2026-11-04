/* 현재 페이지/열린 모달에 한정된 디자인 케이스 패널. 다른 화면으로 이동하지 않는다. */
(() => {
  const providers = new Map();
  let panel, body, lastSignature = '', lastContextId = '', scheduled = false;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function source(p,item){
    if(/^(Web|Policy)/.test(item.reference))return item.reference;
    const ref=/^(명세|Case|\d)/.test(item.reference)?p.reference.split(' · ')[0]:p.reference;
    return ref+' · '+item.reference;
  }
  function context() {
    const overlays = [...document.querySelectorAll('.modal-back,.asset-memo-back,.asset-memo-discard,.asset-memo-link-back')].filter(el => el.getClientRects().length);
    const top = overlays.map((el, i) => ({el, i, z:Number(getComputedStyle(el).zIndex)||0})).sort((a,b) => b.z-a.z || b.i-a.i)[0]?.el;
    for (const [id,p] of providers) if (p.root && !p.root.isConnected) providers.delete(id);
    const list = [...providers.values()];
    if (top) return list.find(p => p.root === top) || window.DashboardCases?.modal(top) || {id:'unprepared-modal',title:'현재 열린 모달',reference:'출처 확인 필요',sections:[],summary:'이 모달의 명세 연결을 확인해야 합니다.'};
    return list.find(p => !p.root && p.matches()) || {id:'unprepared-page',title:'현재 화면',reference:'자산 화면 밖',sections:[],summary:'자산 대시보드 화면으로 이동하면 해당 화면의 케이스가 표시됩니다.'};
  }
  function refresh() {
    if (!panel) return;
    const p=context();let sections=typeof p.sections==='function'?p.sections():p.sections;
    const extraCases=!p.root?window.DashboardCases?.extrasFor(p.reference):null;
    if(extraCases?.length)sections=[...sections,{title:'목록 조건',items:extraCases.map(([id,label,reference,run])=>({id,label,reference,run}))}];
    const summary=typeof p.summary==='function'?p.summary():p.summary;
    const signature=JSON.stringify([p.id,p.title,p.reference,p.active,summary,sections.map(s=>[s.title,s.items.map(i=>[i.id,i.disabled])])]);
    if (signature===lastSignature) return;
    const contextChanged=p.id!==lastContextId;
    lastContextId=p.id;lastSignature=signature;
    body.innerHTML=`<div class="case-scenarios-context"><strong>${esc(p.title)}</strong><span>${esc(p.reference)}</span></div><p class="case-scenarios-summary">${esc(summary||'')}</p>${sections.map(s=>`<details open><summary>${esc(s.title)}</summary><div class="case-scenarios-options">${s.items.map(item=>`<button type="button" data-case-id="${esc(item.id)}" aria-pressed="${p.active===item.id}"${item.disabled?' disabled':''}>${esc(item.label)}${item.reference?`<small>${esc(source(p,item))}</small>`:''}</button>`).join('')}</div></details>`).join('')}<p class="case-scenarios-note">현재 페이지의 임시 데이터에만 적용됩니다. 모달은 화면에서 직접 열어주세요. 새로고침하면 원래 데이터로 돌아갑니다.</p>${p.reset?'<button type="button" class="case-scenarios-reset">기본 상태로</button>':''}`;
    if(contextChanged)body.scrollTop=0;
    body.querySelectorAll('[data-case-id]').forEach(button=>button.onclick=()=>{
      const item=sections.flatMap(s=>s.items).find(i=>i.id===button.dataset.caseId);
      if(!item||item.disabled)return;
      p.active=item.id;
      item.run();
      refresh();
    });
    body.querySelector('.case-scenarios-reset')?.addEventListener('click',()=>{p.active='default';p.reset();refresh();});
  }
  function schedule() {
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;refresh();});
  }
  window.PrototypeCases={
    register(p){providers.set(p.id,p);schedule();},
    refresh:schedule,
    fixture(p){const items=p.cases.map(([id,label,reference,run])=>({id,label,reference,run}));p.sections=p.groups?p.groups.map(([title,ids])=>({title,items:items.filter(x=>ids.includes(x.id))})):[{title:'표현 케이스',items}];p.matches ||= ()=>false;this.register(p);return p;}
  };
  function mount(){
    panel=document.createElement('aside');panel.id='case-scenarios';panel.className='case-scenarios';panel.setAttribute('aria-label','케이스 시나리오');
    panel.innerHTML='<header><strong>케이스 시나리오</strong><div class="case-scenarios-header-actions"><button type="button" data-panel-side aria-label="케이스 패널 위치 전환">⇄</button><button type="button" data-panel-toggle aria-label="케이스 시나리오 접기" aria-expanded="true">−</button></div></header><div class="case-scenarios-body"></div>';
    document.body.appendChild(panel);body=panel.querySelector('.case-scenarios-body');
    const toggle=panel.querySelector('[data-panel-toggle]');
    panel.querySelector('[data-panel-side]').onclick=()=>{const left=panel.dataset.side!=='left';panel.dataset.side=left?'left':'right';panel.style.left=left?'16px':'';panel.style.right=left?'auto':'';};
    toggle.onclick=()=>{body.hidden=!body.hidden;toggle.textContent=body.hidden?'+':'−';toggle.setAttribute('aria-expanded',String(!body.hidden));toggle.setAttribute('aria-label',body.hidden?'케이스 시나리오 펼치기':'케이스 시나리오 접기');};
    new MutationObserver(records=>{
      if(records.some(r=>!panel.contains(r.target)&&!r.target.closest?.('#prototype-qa')))schedule();
    }).observe(document.body,{childList:true,subtree:true});
    refresh();
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',mount,{once:true}):mount();
})();
