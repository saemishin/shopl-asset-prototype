/* 디자인 검토 전용. 기존 입력 이벤트/화면 렌더러로 케이스를 재현하며 저장 API나 이동을 실행하지 않는다. */
(() => {
  const P=window.PrototypeCases, D=window.DATA;
  if(!P||!D)return;
  const clone=v=>JSON.parse(JSON.stringify(v));
  const remembered=new WeakMap(), extras=new WeakMap(), pageExtras=new Map();let serial=0;
  const input=(root,selector,value)=>{
    const el=root.querySelector(selector);if(!el||el.disabled||el.readOnly)return;
    el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));el.dispatchEvent(new Event('blur'));
  };
  const click=(root,selector)=>root.querySelector(selector)?.click();
  const checked=(root,selector,mode)=>{
    [...root.querySelectorAll(selector)].filter(e=>!e.disabled).forEach((el,i)=>{const yes=mode==='all'||mode==='one'&&i===0;if(el.checked!==yes)el.click();});
  };
  const definitions=[
    ['[data-cp-search]','분류 선택','Web 공통06',1,2],
    ['[data-stock-search]','자산 선택','Web 공통14',2,3],
    ['[data-tm-input]','태그 관리','Web 공통07',1,2],
    ['[data-pm-input]','품목 관리','Web24',2,3],
    ['[data-extra-name]','추가 정보 관리','Web23',1,3],
    ['#areg-name','자산 추가·수정',null,3,4],
    ['.areg-ai-modal','AI 입력','Web07',null,null],
    ['[data-tpl-list]','배정 템플릿 관리','Web25',null,2],
    ['[data-template-list]','템플릿 선택','Web13',null,2],
    ['[data-ed]','배정 템플릿 편집','Web25',null,3],
    ['[data-ta]','템플릿으로 배정','Web13',null,1],
    ['[data-product-manage]','품목 관리','Web24',2,3],
    ['[data-stock-cancel]','자산 선택','Web 공통14',2,3],
    ['[data-ai-state]','AI 입력','Web07',null,null]
  ];
  function infer(root){
    let title=(root.querySelector('h3')?.textContent||root.querySelector('[role="dialog"]')?.getAttribute('aria-label')||root.querySelector('.body > p:first-child')?.textContent||(!root.querySelector('input,textarea')&&root.querySelector('.body')?.textContent?.trim().length<90?root.querySelector('.body').textContent:'')||'').trim();
    if(root.querySelector('.catpick-list')&&!root.querySelector('[data-cp-search]'))return {title:title||'분류 선택',reference:'Web 공통06',search:1,list:2};
    const known=definitions.find(([sel])=>root.matches(sel)||root.querySelector(sel));
    if(known){let ref=known[2];if(known[0]==='#areg-name')ref=title==='자산 수정'?'Web09':'Web06';return {title:title||known[1],reference:ref,search:known[3],list:known[4]};}
    const refs={
      '자산 연결':'Web11 · 5번','연결을 해제하시겠습니까?':'Web11 · 6번','반납':'Web 공통12 · 1번','반납하시겠습니까?':'Web 공통12 · 2번',
      '이동':'Web 공통13 · 1번','이동하시겠습니까?':'Web 공통13 · 2번','배정':'Web 공통15 · 1번','자산 배정':'Web 공통15 · 1번','배정하시겠습니까?':'Web 공통15 · 2번',
      '분류 관리':'Web20','소분류 추가':'Web21','소분류 수정':'Web22','구성원 선택':'Web 공통09','근무지 선택':'Web 공통10',
      '구성원 필터':'Web04 · 11번','근무지 필터':'Web05 · 11번','QR 다운로드':'Web02 · 17번','자산 목록':'Web 공통03','배정 자산':'Web 공통04','자산 필터':'Web 공통02','필터':'Web 공통02',
      '배정일 수정':'Web10 · 4번','메모':'Web 공통08','메모 수정':'Web 공통08','특정 그룹 및 직무/직급':'Web21 · 9번','직원':'Web 공통16',
      '관리자/리더 선택':'Web 공통16','직원 선택':'Web 공통16','직원 필터':'Web04 · 11번','그룹 및 직무/직급 선택':'Web21 · 9번','정보 추가 입력 안내':'Web14 · 6번','태그 선택':'Web15 · 14번',
      '연결 자산 추가':'Web13 · 1번','태그':'Web15 · 14번','AI로 입력':'Web07','AI 분석 중':'Web14 · 8번'
    };
    let reference=refs[title];
    if(!reference && /중단|수정을 취소|취소하시겠습니까|페이지를 벗어/.test(root.textContent))reference='Web 공통11';
    if(!reference && /조회할 수 없습니다|설정이 변경되었습니다/.test(root.textContent))reference='Web 공통05';
    if(!reference && /폐기|분실|수리\/점검|복구/.test(title))reference='Web08 · 4번';
    if(!reference && root.querySelector('.memo-editor, [contenteditable="true"]'))reference='Web 공통08';
    if(!reference && root.querySelector('.v-img,.viewer,.viewer-main'))reference='Web08 · 3번';
    if(!reference && root.querySelector('.label-pop,.label-sheet'))reference='Web08 · 8번';
    if(!reference && /업그레이드|사용함으로 설정|사용 안 함으로 설정/.test(root.textContent))reference='Web29 · 2번';
    if(!reference && root.querySelector('[data-group]'))reference='Web 공통02';

    if(title==='필터' && /(?:member|worksite)-detail/.test(location.pathname))reference=(location.pathname.includes('member')?'Web27':'Web28')+' · 11번';
    if(!reference && /삭제하시겠습니까/.test(title)){
      const behind=[...document.querySelectorAll('.modal-back')].filter(el=>el!==root&&!root.contains(el)&&el.getClientRects().length).at(-1)?.querySelector('h3')?.textContent;
      reference=behind==='추가 정보 관리'?'Web23 · 4번':behind==='배정 템플릿 관리'?'Web25 · 4번':location.pathname.endsWith('assets.html')?(document.querySelector('[data-bulk-save]')?'Web15 · 16번':'Web02 · 15번'):'Web08 · 5번';
    }
    return {title:title||'현재 열린 화면',reference:reference||pageReference(),search:/^(구성원 선택|근무지 선택)$/.test(title)?1:title==='배정 자산'?2:null,list:/^(구성원 선택|근무지 선택)$/.test(title)?2:null};
  }
  function pageReference(){
    const file=location.pathname.split('/').pop();
    return {'assets.html':'Web02~05','category.html':'Web18~25','asset-detail.html':'Web08~12','member-detail.html':'Web27','worksite-detail.html':'Web28','settings.html':'Web26','feature-settings.html':'Web29'}[file]||'Web01';
  }
  function modal(root){
    const info=infer(root), extra=(extras.get(root)||[]).filter(x=>!x.when||x.when()).at(-1);if(extra){if(extra.reference)info.reference=extra.reference;if(extra.title)info.title=extra.title;}let p=remembered.get(root);
    if(!p){p={id:'auto-modal-'+(++serial),root,active:'',sections:[],...info};remembered.set(root,p);}
    Object.assign(p,info);
    const items=[],add=(id,label,ref,run)=>items.push({id,label,reference:ref,run});
    const search=!root.querySelector('#areg-name,#mf-groups,#wf-groups')&&root.querySelector('input.picker-search:not([readonly]),[data-cp-search],input[data-search],[data-assigned-search],input[placeholder="검색"]');
    if(search && !search.hidden){
      const selector=search.id?'#'+search.id: search.hasAttribute('data-cp-search')?'[data-cp-search]':search.classList.contains('picker-search')?'input.picker-search:not([readonly])':search.hasAttribute('data-assigned-search')?'[data-assigned-search]':'input[placeholder="검색"],input[data-search]';
      add('search-clear','검색어 없음',info.search?`${info.search}번`:'검색',()=>input(root,selector,''));
      add('search-hit','일부 검색 결과',info.search?`${info.search}번`:'검색',()=>{const name=root.querySelector('.picker-member-info b,.link-row-name,.catpick-group-name')?.textContent?.trim();input(root,selector,name||'김');});
      add('search-empty','검색 결과 없음',info.search?`${info.search}번`:'검색',()=>input(root,selector,'일치하는 결과 없음 999'));
    }
    const choose='input[type="checkbox"]:not([disabled]),input[type="radio"]:not([disabled])';
    if(root.querySelector(choose)&&(/필터|QR 다운로드|태그$|그룹 및 직무/.test(info.title)||/^Web 공통(09|10|14|16)$/.test(info.reference)||root.querySelector('[data-template-list]'))){
      add('selection-one','후보 한 개 선택',info.list?`${info.list}번`:'선택',()=>{[...root.querySelectorAll(choose)].find(e=>!e.checked)?.click();});
      if(root.querySelector('input[type="checkbox"]')){
        add('selection-none','현재 목록 선택 해제',info.list?`${info.list}번`:'선택',()=>checked(root,'input[type="checkbox"]','none'));
      }
    }
    if(root.querySelector('[data-cp-list] [data-v]'))add('category-one','소분류 한 개 선택','2번',()=>click(root,'[data-cp-list] [data-v]'));
    if(root.querySelector('[data-tm-input]')){
      add('tag-empty','태그명 미입력','1번',()=>input(root,'[data-tm-input]',''));
      add('tag-ready','추가 가능한 태그명','1번',()=>input(root,'[data-tm-input]','검토용 신규 태그'));
      add('tag-duplicate','추가 태그명 중복','1번',()=>input(root,'[data-tm-input]',root.querySelector('[data-tm-rename]')?.value||''));
      add('tag-required','기존 태그명 빈값 오류','2번',()=>input(root,'[data-tm-rename]',''));
      add('tag-rename-duplicate','기존 태그명 중복 오류','2번',()=>input(root,'[data-tm-rename]',root.querySelectorAll('[data-tm-rename]')[1]?.value||''));
    }
    for(const [prefix,field,rename] of [['product','[data-pm-input]','[data-pm-name]'],['extra','[data-extra-name]','[data-extra-rename]']])if(root.querySelector(field)){
      add(prefix+'-empty','추가 명칭 미입력',`${info.search}번`,()=>input(root,field,''));
      add(prefix+'-ready','추가 가능한 명칭',`${info.search}번`,()=>input(root,field,'검토용 신규 명칭'));
      add(prefix+'-duplicate','추가 명칭 중복 오류',`${info.search}번`,()=>input(root,field,root.querySelector(rename)?.value||''));
      add(prefix+'-required','기존 명칭 빈값 오류',`${info.list}번`,()=>input(root,rename,''));
      add(prefix+'-rename-duplicate','기존 명칭 중복 오류',`${info.list}번`,()=>input(root,rename,root.querySelectorAll(rename)[1]?.value||''));
    }
    if(root.querySelector('#areg-name')){
      const edit=info.reference==='Web09';
      add('name-empty','품목명 미입력',`${edit?2:3}번`,()=>input(root,'#areg-name',''));
      add('name-long','품목명 최대 길이',`${edit?2:3}번`,()=>input(root,'#areg-name','디자인 확인용 긴 품목명 '.repeat(5).slice(0,50)));
      for(const [id,label,val,n] of [['expiry','유효기한 날짜 오류','20260230',edit?7:8],['manufactured','제조연월 형식 오류','202613',edit?8:9],['purchasedate','구매연월 미래 날짜','209912',edit?8:9]])add(id+'-invalid',label,`${n}번`,()=>input(root,`#areg-${id}-field input[type="text"]`,val));
      add('date-empty','날짜 입력값 없음',`${edit?7:8}·${edit?8:9}번`,()=>['expiry','manufactured','purchasedate'].forEach(id=>input(root,`#areg-${id}-field input[type="text"]`,'')));
      add('price','구매가격 자릿수·콤마',`${edit?9:10}번`,()=>input(root,'#areg-purchaseprice-input','123456789'));
      add('number','고유관리번호 형식 오류',`${edit?4:5}번`,()=>input(root,'#areg-assetno-input','잘못된 번호!'));
    }
    if(root.querySelector('[data-ed] [data-name]')){
      add('template-name-empty','템플릿 이름 미입력','3번',()=>input(root,'[data-name]',''));
      add('template-name-duplicate','템플릿 이름 중복','3번',()=>input(root,'[data-name]',D.templates[0]?.name||''));
      add('template-name-max','템플릿 이름 최대 길이','3번',()=>input(root,'[data-name]','검토용 이름 '.repeat(8).slice(0,30)));
    }

    const date=root.querySelector('[data-assignment-date],[data-dtext],input[placeholder="YYYY.MM.DD"]');
    if(date&&!root.querySelector('#areg-name')){
      const sel=date.hasAttribute('data-assignment-date')?'[data-assignment-date]':date.hasAttribute('data-dtext')?'[data-dtext]':'input[placeholder="YYYY.MM.DD"]';
      add('assignment-date-empty','배정일 미입력','배정일',()=>input(root,sel,''));
      add('assignment-date-valid','유효한 배정일 입력','배정일',()=>input(root,sel,'20260901'));
      add('assignment-date-invalid','배정일 오류','배정일',()=>input(root,sel,'20260230'));
    }
    if(root.querySelector('[name="tg-mode"]')){
      add('together-all','연결된 자산과 함께','1번',()=>click(root,'[name="tg-mode"][value="all"]'));
      add('together-one','이 자산만','1번',()=>click(root,'[name="tg-mode"][value="one"]'));
    }
    if(root.querySelector('[data-f-name]')){
      add('private-off','비공개 설정 없음',info.reference==='Web22'?'6번':'7번',()=>checked(root,'[data-private-field]','none'));
      add('private-on','기본 정보 비공개 설정',info.reference==='Web22'?'6번':'7번',()=>checked(root,'[data-private-field]','all'));
    }
    const editable=root.querySelector('[contenteditable="true"]');
    if(editable){
      const change=text=>{const field=root.querySelector('textarea');if(!field)return;field.value=text?'<p>'+text+'</p>':'';window.AssetMemo.syncTextarea(field);field.dispatchEvent(new Event('input',{bubbles:true}));};
      add('memo-empty','메모 없음','Web 공통08 · 2번',()=>change(''));
      add('memo-limit','메모 500자','Web 공통08 · 2번',()=>change('가'.repeat(500)));
    }
    if(extra){for(const [id,label,reference,run] of (typeof extra.cases==='function'?extra.cases():extra.cases||[]))add(id,label,reference,run);p.reset=extra.reset;}
    for(const item of items){if(/required|rename-duplicate/.test(item.id)){const sel=item.id.startsWith('tag')?'[data-tm-rename]':item.id.startsWith('product')?'[data-pm-name]':'[data-extra-rename]';item.disabled=root.querySelectorAll(sel).length<(item.id.endsWith('rename-duplicate')?2:1);}}
    p.sections=items.length?[{title:'현재 화면에서 확인',items}]:[];
    p.summary=items.length?'실제 입력·선택 이벤트로 상태를 바꿉니다. 저장·확인은 화면에서 직접 실행해주세요.':'이 확인·안내 화면은 단일 표현입니다. 버튼 동작은 실제 화면에서 확인해주세요.';
    if(extra?.summary)p.summary=extra.summary;
    if(root.querySelector('#mf-groups,#wf-groups'))p.summary='기존 프로토타입의 필터 UI 샘플입니다. 검색·적용 결과 연동은 아직 구현되어 있지 않습니다. 체크 상태와 목록 모양만 확인할 수 있습니다.';
    return p;
  }
  const baseline=clone({assets:D.assets,categories:D.categories,links:D.links,products:D.products,extraFields:D.extraFields,tags:D.tags,templates:D.templates,emptyGroups:D.emptyGroups,targetStatuses:D.targetStatuses}),manage=window.hasPrototypeAssetManagePermission;
  function restore(){
    for(const [k,v] of Object.entries(baseline))if(Array.isArray(v)){if(!Array.isArray(D[k]))D[k]=[];D[k].splice(0,D[k].length,...clone(v));}else if(v&&typeof v==='object')D[k]=clone(v);
    window.hasPrototypeAssetManagePermission=manage;
  }
  function access(mode){
    window.hasPrototypeAssetManagePermission=()=>mode==='manage';
    D.categories.forEach(c=>{c.view='회사의 모든 구성원';c.edit=['info','both'].includes(mode)?'회사의 모든 구성원':'관리자만';c.assign=['state','both'].includes(mode)?'회사의 모든 구성원':'관리자만';if(mode==='private')c.privateFields=['expiry','manufactured','purchaseDate','purchasePrice',...(c.extraEnabled||[])];});
  }

  window.DashboardCases={pageActions(ref,cases){pageExtras.set(ref,cases);P.refresh();},extrasFor:ref=>pageExtras.get(ref)||[],modal,input,click,checked,clone,restore,access,baseline,attach(root,extra){if(!root)return;let rows=extras.get(root)||[];rows=rows.filter(x=>x.reference!==extra.reference||x.title!==extra.title);rows.push(extra);extras.set(root,rows);P.refresh();}};
})();
