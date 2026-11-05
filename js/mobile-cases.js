/* 앱 리더·직원 디자인 검토용. URL 이동·팝업 열기·Toast 시연 없이 현재 화면의 메모리만 변경한다. */
(() => {
  const D=window.DATA, clone=x=>JSON.parse(JSON.stringify(x)), attached=new WeakMap(), activeByRoot=new WeakMap();
  const baseline=clone({assets:D.assets,categories:D.categories,links:D.links,tags:D.tags,extraFields:D.extraFields});
  const originalManage=window.hasPrototypeAssetManagePermission;
  const api=window.MobileCases={plan:null,featureUse:null,managed:null};
  window.hasPrototypeAssetManagePermission=()=>api.managed===null?originalManage():api.managed;
  const item=(id,label,reference,run,disabled=false)=>({id,label,reference,run,disabled});
  const group=(title,items)=>({title,items});
  const setInput=(root,selector,value)=>{
    const input=root.querySelector(selector);if(!input||input.disabled||input.readOnly)return;
    input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
  };
  function restore(){for(const [key,value]of Object.entries(baseline))if(Array.isArray(D[key]))D[key].splice(0,D[key].length,...clone(value));api.plan=api.featureUse=api.managed=null;}
  api.attach=(root,provider)=>{attached.set(root,provider);window.PrototypeCases?.refresh();};
  api.fixture=(root,title,reference,cases,reset)=>api.attach(root,{id:'mobile-'+title,title,reference,sections:[group('표현 케이스',cases.map(c=>item(...c)))],reset});
  const ref=(mode,n)=>`App(${mode==='leader'?'L':'E'})${String(n).padStart(2,'0')}`;
  const common=n=>`App 공통${String(n).padStart(2,'0')}`;
  const shared=n=>`App(E,L)${String(n).padStart(2,'0')}`;
  api.bind=({mode,state,draw,me,setDirectory,directoryTarget,worksites})=>{
    const asset=()=>D.assets.find(a=>a.id===state.detailAssetId);
    const tab=()=>state.screen==='asset-detail'?(document.querySelector('#app [data-detail-tab].active')?.dataset.detailTab||'assignment'):null;
    function redraw(){const selectedTab=tab();draw();if(selectedTab)document.querySelector('#app [data-detail-tab="'+selectedTab+'"]')?.click();window.PrototypeCases.refresh();}
    function reset(){restore();setDirectory?.(null);if(state.popupFilters)state.popupFilters=MappAssetFilter.empty();if(state.wsFilters)state.wsFilters=MappAssetFilter.empty();state.statusFilter='all';state.subSearch=state.wsSearch='';redraw();}
    function permissions(kind){
      api.managed=kind==='manage';
      for(const c of D.categories){c.view='회사의 모든 구성원';c.edit=['info','both'].includes(kind)?'회사의 모든 구성원':'관리자만';c.assign=['state','both'].includes(kind)?'회사의 모든 구성원':'관리자만';}
      redraw();
    }
    const featureCases=()=>group('요금제·기능 사용',[
      item('pro-on','Pro 이상 · 사용 ON',shared(10)+' · 1·2번',()=>{api.plan='Pro';api.featureUse=true;redraw();}),
      item('pro-off','Pro 이상 · 사용 OFF',shared(10)+' · 2번',()=>{api.plan='Pro';api.featureUse=false;redraw();}),
      item('lite','하위 요금제 · 업그레이드 안내',shared(10)+' · 1·2번',()=>{api.plan='Lite';api.featureUse=false;redraw();})]);
    const permissionCases=()=>group('권한',[
      ['manage','자산 관리 권한'],['info','조회·정보 수정만'],['state','조회·상태 관리만'],['both','조회·정보 수정·상태 관리'],['view','조회만']
    ].map(([id,label])=>item(id,label,shared(2)+' · 2번 / '+shared(5)+' · 2번',()=>permissions(id))));
    function detailCases(){
      const a=asset();if(!a)return[];
      const status=group('자산 상태',['assigned','stock','repair','lost','disposed'].map((s,i)=>item('status-'+s,['배정 중','배정 가능 · 배정 없음','수리/점검 중','분실','폐기'][i],shared(5)+' · 1·2번',()=>{
        a.status=s;if(s==='stock'||s==='disposed'){a.assignments=[];D.links.splice(0,D.links.length,...D.links.filter(p=>!p.includes(a.id)));state.detailTarget=null;}
        else if(!a.assignments?.length)a.assignments=[{employee:me,worksite:null,since:'2026-10-01'}];
        redraw();
      })));
      function links(count,mixed){
        a.status='assigned';if(!a.assignments?.length)a.assignments=[{employee:me,worksite:null,since:'2026-10-01'}];
        D.links.splice(0,D.links.length,...D.links.filter(p=>!p.includes(a.id)));
        D.assets.splice(0,D.assets.length,...D.assets.filter(b=>!b.id.startsWith('MCASE-LINK-')));
        D.categories.splice(0,D.categories.length,...D.categories.filter(c=>!c.sub.startsWith('연결 검토')));
        if(mixed){api.managed=false;const current=window.AssetExtra.category(a);current.view=current.assign='회사의 모든 구성원';}
        for(let i=0;i<count;i++){
          const c=clone(window.AssetExtra.category(a));c.sub=`연결 검토 ${i+1}`;c.view=mixed&&i===0?'관리자만':'회사의 모든 구성원';c.assign=mixed&&i<2?'관리자만':'회사의 모든 구성원';
          D.categories.push(c);
          const b={...clone(a),id:'MCASE-LINK-'+i,assetNo:'CASE-'+String(i+1).padStart(3,'0'),sub:c.sub,product:['보안 단말','상태 관리 제한 디스플레이','연결 자산'][mixed?Math.min(i,2):2]+` ${i+1}`,_activityLog:[]};
          D.assets.push(b);D.links.push([a.id,b.id]);
        }redraw();
      }
      return [status,permissionCases(),group('연결된 자산',[
        item('links-none','연결 없음',shared(4)+' · 3번',()=>links(0,false)),
        item('links-many','6건 · 전체 보기',shared(4)+' · 3·4번',()=>links(6,false)),
        item('links-mixed','조회 불가·상태 관리 불가 혼합',shared(4)+' · 5·8번',()=>links(3,true)),
        item('links-limit','50건 · 연결 상한',shared(4)+' · 2번',()=>links(50,false))]),
      group('사진·정보',[
        item('photos-none','사진 없음',shared(6)+' · 1번',()=>{a._photos=[];a.photoCount=0;a.photo=null;redraw();}),
        item('photos-ten','사진 10장',shared(6)+' · 1·2번',()=>{a._photos=Array.from({length:10},(_,i)=>({id:'mobile-photo-'+i,color:['#4b7bec','#20bf6b','#8854d0'][i%3],at:'2026-11-05 10:00',by:me}));a.photoCount=10;a._primary=0;redraw();}),
        item('note-empty','메모 없음',shared(6)+' · 3번',()=>{a.note='';redraw();}),
        item('private','비공개 기본 정보 · 관리 권한 없음',shared(1)+' · 8~12번',()=>{api.managed=false;window.AssetExtra.category(a).privateFields=['expiry','manufactured','purchaseDate','purchasePrice'];redraw();})])];
    }
    function formCases(formState=state,render=redraw){
      const d=formState.addDraft;if(!d)return[];
      if(formState.screen==='asset-add-tags')return[group('태그 목록',[
        item('tags-none','등록 태그 없음',shared(1)+' · 16번',()=>{formState.tagManageDraft=[];render();}),
        item('tags-duplicate','기등록 태그명 중복',shared(1)+' · 16번',()=>{const t=formState.tagManageDraft;if(t.length<2)return;t[1].name=t[0].name;render();},formState.tagManageDraft.length<2)])];
      if(formState.screen==='asset-add-category')return[group('분류 후보',[
        item('cat-none','선택 가능한 분류 없음',shared(1)+' · 15번',()=>{api.managed=false;D.categories.forEach(c=>c.view='관리자만');render();})])];
      return[group('입력 상태',[
        item('form-photo0','사진 없음',shared(1)+' · 4번',()=>{d.photos=[];render();}),
        item('form-photo10','사진 10장',shared(1)+' · 4번',()=>{d.photos=Array.from({length:10},(_,i)=>({id:'form-photo-'+i,color:'#4b7bec',at:'2026-11-05 10:00',by:me}));d.primaryPhoto=0;render();}),
        item('form-expiry','유효기한 형식 오류',shared(1)+' · 8번',()=>{d.expiry='2026.13.40';d.expiryTouched=true;render();}),
        item('form-price','구매가격 입력',shared(1)+' · 10번',()=>{d.purchasePrice='1234567';render();}),
        item('form-number','고유관리번호 미입력',shared(1)+' · 5번',()=>{if(!d.editingId){d.assetNo='';render();}},!!d.editingId),
        item('form-note','메모 500자',shared(1)+' · 11번',()=>{d.note='메모 '.repeat(166)+'완료';render();})])];
    }
    api.formCases=formCases;
    function registration(a){return clone((a._activityLog||[]).find(e=>e.script==='자산 등록')||{d:(a.createdAt||'2026-09-01')+' 09:00',who:me,script:'자산 등록'});}
    function historyCases(){return[group('이력 목록',[
      item('history-registration','자산 등록 이력만',shared(7)+' · 2번',()=>{const a=asset(),event=registration(a);a.status='stock';a.assignments=[];a._assignmentHistory=[];D.links.splice(0,D.links.length,...D.links.filter(p=>!p.includes(a.id)));state.detailTarget=null;a._activityLog=[event];redraw();}),
      item('history-long','이력 다수 · 스크롤',shared(7)+' · 2번',()=>{const a=asset(),event=registration(a),logs=(a._activityLog||[]).filter(e=>e.script!=='자산 등록');a._activityLog=[...Array.from({length:20},(_,i)=>clone(logs.length?logs[i%logs.length]:{d:event.d,who:me,script:'자산 정보 수정: 메모 수정',before:'',after:'검토용 메모'})),event];redraw();})])];}
    // Each data scenario starts from a stable seed, including after an empty/permission scenario.
    function listData(many){
      D.categories.splice(0,D.categories.length,...clone(baseline.categories));
      D.assets.splice(0,D.assets.length,...clone(baseline.assets));
      D.links.splice(0,D.links.length,...clone(baseline.links));
      api.managed=null;
      if(state.popupFilters)state.popupFilters=MappAssetFilter.empty();
      if(state.wsFilters)state.wsFilters=MappAssetFilter.empty();
      state.statusFilter='all';state.subSearch=state.wsSearch=state.directorySearch='';
      state.collapsedGroups?.clear();
      if(!many){D.assets.splice(0);D.links.splice(0);redraw();return;}
      const s=state.screen,hub=mode==='leader'&&s==='assets',member=s.includes('member'),directory=s.includes('profile')||s.startsWith('directory-');
      const target=directory?directoryTarget(member?'member':'worksite'):s==='worksite-detail'?{type:'worksite',value:state.wsDetail}:mode==='employee'?state.assetTab==='mine'?{type:'employee',value:me}:{type:'worksite',value:worksites().fixed||worksites().assigned[0]}:null;
      const sub=s==='sub-detail'||s==='sub-switch'?state.sub:s==='worksite-detail'?state.wsDetailSub:s==='directory-worksite-assets'?state.directoryCategory?.sub:null;
      const tree=hub||s==='worksite-profile'||(mode==='employee'&&s==='assets'&&state.assetTab==='worksite');
      const category=D.categories.find(c=>c.sub===sub)||D.categories.find(c=>window.AssetAccess.scope(c,'view',me))||D.categories[0];
      if(!category){redraw();return;}
      const base=clone(baseline.assets.find(a=>a.group===category.group&&a.sub===category.sub&&!a.deleted_at)||baseline.assets.find(a=>!a.deleted_at));
      D.assets.splice(0);D.links.splice(0);
      for(let i=0;i<30;i++){
        const c=tree?{...clone(category),group:hub?'스크롤 확인용 분류':category.group,sub:'스크롤 확인 '+String(i+1).padStart(2,'0')}:category;
        if(tree)D.categories.push(c);
        D.assets.push({...clone(base),id:'MCASE-LIST-'+i,assetNo:'SCROLL-'+String(i+1).padStart(3,'0'),product:'스크롤 확인 자산 '+String(i+1).padStart(2,'0'),group:c.group,sub:c.sub,deleted_at:null,status:target?'assigned':'stock',assignments:target?[{employee:target.type==='employee'?target.value:null,worksite:target.type==='worksite'?target.value:null,since:'2026-09-01'}]:[],_activityLog:undefined});
      }
      redraw();
    }
    const descriptor=()=>{
      const s=state.screen;
      if(s==='menu')return['메뉴',ref(mode,1)];
      if(s==='asset-detail')return tab()==='history'?['자산 상세 · 이력',shared(7)]:tab()==='info'?['자산 상세 · 정보',shared(6)]:['자산 상세 · 배정',shared(3)+' / '+shared(4)];
      if(s==='asset-history')return['자산 이력',shared(7)];
      if(s?.startsWith('asset-add'))return[s==='asset-add-category'?'분류 선택':s==='asset-add-tags'?'태그 관리':state.addDraft?.editingId?'자산 수정':'자산 추가',shared(1)];
      if(s==='member-profile'||s==='directory-member-assets')return['구성원 상세 · 자산',shared(8)];
      if(s==='worksite-profile'||s==='directory-worksite-assets')return['근무지 상세 · 자산',shared(9)];
      if(s==='plan-features'||s==='asset-feature')return['요금제 및 기능 · 자산 관리',shared(10)];
      if(s==='worksite-detail')return['근무지 자산 · 소분류',ref(mode,3)];
      if(s==='sub-detail')return['소분류 상세',ref(mode,3)];
      if(s==='sub-switch')return['소분류 상세 · 소분류 선택',ref(mode,3)];
      if(s==='asset-parties')return['배정 현황',shared(3)];
      return[mode==='leader'?'자산 허브':state.assetTab==='mine'?'내 자산':'근무지 자산',ref(mode,2)];
    };
    const provider={get id(){return 'mobile-page-'+state.screen+'-'+(state.assetTab||'')+'-'+(tab()||'');},get title(){return descriptor()[0];},get reference(){return descriptor()[1];},matches:()=>true,
      summary:'현재 화면에서 확인할 조건을 선택하세요. 다른 화면이나 팝업으로 이동하지 않습니다.',reset,
      sections:()=>{
        const s=state.screen;
        if(s==='menu'||s==='plan-features'||s==='asset-feature')return[featureCases()];
        if(s==='asset-detail'&&tab()==='history')return historyCases();
        if(s==='asset-detail'&&tab()==='info')return detailCases().filter(g=>g.title!=='연결된 자산');
        if(s==='asset-detail'||s==='asset-parties')return detailCases();
        if(s==='asset-history')return historyCases();
        if(s?.startsWith('asset-add'))return formCases();
        const directory=s?.includes('profile')||s?.startsWith('directory-'),member=s?.includes('member');
        const listRef=directory?shared(member?8:9)+' · '+(member?'4·6번':'4·5번'):s==='assets'?ref(mode,2)+' · '+(mode==='leader'?'2·3번':state.assetTab==='mine'?'3번':'4번'):ref(mode,3)+' · '+(mode==='leader'?'5·6번':'6번');
        const hub=mode==='leader'&&s==='assets';
        const sections=[group(hub?'분류 트리 데이터':'목록 데이터',[
          item('list-empty',hub?'자산 0건 · 분류별 건수 0':'표시할 자산 없음',listRef,()=>listData(false)),
          item('list-long',hub?'분류 다수 · 스크롤':s==='member-profile'?'배정 자산 다수 · 전체 보기':'자산 다수 · 스크롤',listRef,()=>listData(true))
        ])];
        if(!directory&&mode==='leader')sections.push(group('소분류 조회 범위',[
          item('view-none','조회 가능한 소분류 없음',ref(mode,2)+' · 2번',()=>{api.managed=false;D.categories.forEach(c=>c.view='관리자만');redraw();}),
          item('view-partial','일부 소분류만 조회',ref(mode,2)+' · 2번',()=>{api.managed=false;D.categories.forEach((c,i)=>c.view=i<2?'회사의 모든 구성원':'관리자만');redraw();})]));
        if(directory)sections.push(group('대상 상태',[
          item('target-active','재직 구성원 / 활성 근무지',shared(member?8:9)+' · 2번',()=>{setDirectory(null);redraw();}),
          item('target-inactive',member?'퇴사 구성원':'비활성 근무지',shared(member?8:9)+' · 2번',()=>{setDirectory(member?'retired':'inactive');redraw();})]));
        const search=document.querySelector('#app [data-mapp-search],#app [data-worksite-search],#app .mapp-directory-search input');
        if(search)sections.push(group('검색 결과',[
          item('search-none','검색 결과 없음',provider.reference+' · 검색',()=>setInput(document.getElementById('app'),'[data-mapp-search],[data-worksite-search],.mapp-directory-search input','검색결과없는조건')),
          item('search-clear','검색어 없음',provider.reference+' · 검색',()=>setInput(document.getElementById('app'),'[data-mapp-search],[data-worksite-search],.mapp-directory-search input',''))]));
        return sections;
      }};
    api.pageReference=()=>descriptor()[1];
    window.PrototypeCases.register(provider);
  };
  api.modal=root=>{
    const custom=attached.get(root);if(custom){custom.root=root;return custom;}
    let title=(root.querySelector('.mapp-fullpage-head-title,.mapp-topbar-title,.mapp-sheet-head,h2,h3')?.textContent||root.querySelector('[role="dialog"]')?.getAttribute('aria-label')||root.querySelector('.body p')?.textContent||'확인').trim();
    let reference=api.pageReference?.()||shared(2),summary='열려 있는 팝업을 실제 화면의 버튼으로 조작해 확인하세요.';
    const cases=[],add=(...c)=>cases.push(item(...c));
    if(title==='자산 추가·배정')reference=api.pageReference()+' · '+(api.pageReference().includes('03')?'7번':'4번');
    else if(root.querySelector('.picker-search')?.placeholder.includes('이름/사번')){title='구성원 선택';reference=common(3);}
    else if(root.querySelector('[data-ws-filter]')){title='근무지 선택';reference=common(4);}
    else if(root.matches('.mapp-asset-filter'))reference=common(7);
    else if(root.querySelector('[data-pk-q]'))reference=common(5);
    else if(root.querySelector('[data-sp-q],[data-sp-body]'))reference=common(6);
    else if(root.querySelector('[data-ai-analyze]'))reference=ref('leader',5);
    else if(root.matches('.asset-memo-back,.asset-memo-mobile')||root.querySelector('.asset-memo-editor'))reference=shared(6)+' · 3번';
    else if(/취소하시|중단하시|저장하지/.test(title))reference=common(1);
    else if(/배정일|날짜|연월/.test(title)||root.querySelector('[data-cal-day],[data-cal-year]'))reference=common(2);
    else if(/구성원|직원/.test(title))reference=common(3);
    else if(/근무지/.test(title))reference=common(4);
    else if(/연결/.test(title))reference=shared(4);
    else if(/배정|이동|반납/.test(title))reference=shared(3);
    else if(/사진|QR/.test(title)||root.matches('.mapp-viewer-back'))reference=shared(6);
    else if(root.matches('.mapp-plan-dialog-back'))reference=shared(10);
    const search=root.querySelector('input[type="search"],.picker-search');
    if(search){
      add('search-none','검색 결과 없음',reference+' · 검색',()=>setInput(root,'input[type="search"],.picker-search','검색결과없는조건'));
      add('search-clear','검색어 없음',reference+' · 검색',()=>setInput(root,'input[type="search"],.picker-search',''));
    }
    const memo=root.querySelector('textarea');
    if(memo&&root.querySelector('.asset-memo-editor,[contenteditable="true"]')){
      const fillMemo=value=>{memo.value=value;window.AssetMemo.syncTextarea(memo);memo.dispatchEvent(new Event('input',{bubbles:true}));};
      add('memo-empty','메모 없음',shared(6)+' · 3번',()=>fillMemo(''));
      add('memo-limit','메모 500자',shared(6)+' · 3번',()=>fillMemo('가'.repeat(500)));
    }
    const boxes=[...root.querySelectorAll('input[type="checkbox"]')].filter(x=>!x.disabled&&!x.matches('[data-filter-all],[data-sp-all],[data-sp-group]'));
    if(boxes.length){
      const indexes=boxes.map(b=>[...root.querySelectorAll('input[type="checkbox"]')].indexOf(b));
      const apply=v=>{for(const i of indexes){const x=root.querySelectorAll('input[type="checkbox"]')[i];if(x&&!x.disabled&&x.checked!==v){x.checked=v;x.dispatchEvent(new Event('change',{bubbles:true}));}}};
      add('none','선택 없음',reference+' · 선택',()=>apply(false));
      add('all','표시 목록 모두 선택',reference+' · 선택',()=>apply(true));
    }
    const radio=root.querySelectorAll('input[type="radio"]');
    for(const r of radio){if(!/mode/.test(r.name)||r.disabled)continue;const label=r.closest('label')?.textContent.trim();if(label)add('radio-'+r.value,label,shared(4)+' · 8번',()=>r.click());}
    if(root.querySelector('[data-del-input]')){
      add('delete-empty','확인 문구 미입력',shared(5)+' · 9번',()=>setInput(root,'[data-del-input]',''));
      add('delete-ready','확인 문구 일치',shared(5)+' · 9번',()=>setInput(root,'[data-del-input]','DELETE'));
    }
    return{get active(){return activeByRoot.get(root);},set active(value){activeByRoot.set(root,value);},id:'mobile-modal-'+title,root,title,reference,summary,sections:cases.length?[group('표현 케이스',cases)]:[]};
  };
})();
