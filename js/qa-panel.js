/* 디자인 검토용 통합 QA 패널. 일반 주소에서도 보이며, 선택한 시나리오만 메모리 샘플에 적용한다.
   파라미터는 버튼이 구성하므로 검토자가 주소를 직접 편집할 필요가 없다. */
(() => {
  const params = new URLSearchParams(location.search), file = location.pathname.split('/').pop() || 'assets.html';
  const mobile = ['app.html','leader.html'].includes(file), D = window.DATA;
  const mode=mobile?file:'dashboard', groupStorageKey=`asset-review-group:${mode}`;
  window.PrototypeQa = { enabled:true };
  const clone = value => JSON.parse(JSON.stringify(value));
  // 화면 코드가 데이터를 읽기 전에 준비한다. 기존 QA의 판정·API 경계는 그대로 재사용한다.
  if (params.get('qa') === 'empty-assets') { D.assets.splice(0); D.links.splice(0); }
  if (params.get('qa') === 'category-limit') {
    const kind=params.get('scenario')||'both', groups=[...new Set([...D.categories.map(c=>c.group),...D.emptyGroups])];
    if(kind!=='sub')for(let n=groups.length;n<30;n++){const name=`QA 대분류 ${String(n+1).padStart(2,'0')}`;D.emptyGroups.push(name);groups.push(name);}
    if(kind!=='group')for(let n=D.categories.length;n<300;n++){
      const group=groups[n%groups.length];D.categories.push({...clone(D.categories[0]),group,sub:`QA 소분류 ${String(n+1).padStart(3,'0')}`});
    }
  }
  if(params.get('qa')==='review'){
    const kind=params.get('scenario'), base=D.assets.find(a=>a.id==='A001');
    if(kind==='extra-limit')for(let n=D.extraFields.filter(f=>!f.deleted).length;n<30;n++)D.extraFields.push({id:`qa-extra-${n}`,name:`QA 추가 항목 ${n+1}`});
    if(['links-empty','links-limit','links-hidden'].includes(kind)&&base){
      window.hasPrototypeAssetManagePermission=()=>kind!=='links-hidden';
      D.links.splice(0,D.links.length,...D.links.filter(pair=>!pair.includes(base.id)));
      if(kind==='links-limit')for(let n=0;n<window.AssetLinks.MAX;n++){
        const a={...clone(base),id:`QA-LINK-${n}`,assetNo:`QA-LINK-${String(n+1).padStart(3,'0')}`,_activityLog:[]};
        D.assets.push(a);window.AssetLinks.add(base,a);
      }
      if(kind==='links-hidden'){
        const group='QA 조회 제한',sub='비공개 분류';
        D.categories.push({...clone(window.AssetExtra.category(base)),group,sub,view:'관리자만',edit:'관리자만',assign:'관리자만'});
        const a={...clone(base),id:'QA-HIDDEN-LINK',assetNo:'QA-HIDDEN-LINK',group,sub};D.assets.push(a);window.AssetLinks.add(base,a);
      }
    }
  }
  const entries=[], groups=['화면 바로가기','권한','빈 상태','상한·많은 데이터','추가·AI 입력','연결·템플릿','설정·이력'];
  const add=(group,id,label,page,query={},open='')=>entries.push({group,id,label,page,query,open});
  if(mobile){
    add(0,'menu','메뉴',file);add(0,'assets','자산',file,{},'mobile-assets');
    add(0,'detail','자산 상세',file,{qa:'review',scenario:'detail',id:'A001'});
    add(0,'member','구성원 상세',file,{},'mobile-member');add(0,'worksite','근무지 상세',file,{},'mobile-worksite');
  }else{
    add(0,'overview','현황','assets.html');add(0,'category','분류','category.html');
    add(0,'detail','자산 상세','asset-detail.html',{id:'A001'});
    add(0,'member','구성원 상세','member-detail.html',{name:'김민수'});add(0,'worksite','근무지 상세','worksite-detail.html',{name:'강남점'});
  }
  const permissionPage=mobile?file:'asset-detail.html';
  for(const [key,label] of [['manage','자산 관리'],['info','정보 수정만'],['state','상태 관리만'],['both','정보 수정·상태 관리'],['view','조회만'],['private','비공개 정보 숨김']])add(1,`access-${key}`,label,permissionPage,{qa:'access',scenario:key,id:'A001'});
  add(1,'permission-none','조회 가능한 분류 없음','assets.html',{qa:'permission',scenario:'none'});
  add(1,'permission-partial','일부 분류만 조회','assets.html',{qa:'permission',scenario:'partial'});
  add(2,'empty-assets','등록된 자산 없음','assets.html',{qa:'empty-assets'});
  add(2,'empty-category','대분류·소분류 없음','category.html',{qa:'empty-category'});
  add(2,'empty-subcategory','소분류 없음','category.html',{qa:'empty-subcategory'});
  add(2,'empty-tags','태그 없음','assets.html',{qa:'asset-add',scenario:'empty-tags'});
  add(2,'filter-empty-category','필터 분류 후보 없음','assets.html',{qa:'filter-empty',scenario:'category'});
  add(2,'filter-empty-tags','필터 태그 후보 없음','assets.html',{qa:'filter-empty',scenario:'tags'});
  add(2,'member-unavailable','배정 관계 종료 안내','assets.html',{qa:'member-unavailable',scenario:'relation'});
  add(2,'member-scope','조회 범위 변경 안내','assets.html',{qa:'member-unavailable',scenario:'scope'});
  add(3,'limit-groups','대분류 30개','category.html',{qa:'category-limit',scenario:'group'},'category-manage');
  add(3,'limit-subs','소분류 300개','category.html',{qa:'category-limit',scenario:'sub'},'category-manage');
  add(3,'limit-categories','분류 상한 모두 도달','category.html',{qa:'category-limit',scenario:'both'},'category-manage');
  add(3,'limit-extra','추가 정보 30개','category.html',{qa:'review',scenario:'extra-limit'},'extra-manage');
  add(3,'limit-links','연결된 자산 50개',mobile?file:'asset-detail.html',{qa:'review',scenario:'links-limit',id:'A001'});
  add(3,'long-list','앱 긴 자산 목록','leader.html',{qa:'long-list'});
  add(4,'add-default','자산 추가','assets.html',{qa:'asset-add',scenario:'default'});
  add(4,'add-empty-category','분류 선택 후보 없음','assets.html',{qa:'asset-add',scenario:'empty-category'});
  add(4,'tag-duplicate','태그 수정 중복 오류','assets.html',{qa:'asset-add',scenario:'tag-duplicate'});
  add(4,'bulk-ai','사진 AI 일괄 추가','assets.html',{qa:'bulk-ai'});
  add(4,'bulk-memo','일괄 메모 500자 초과','assets.html',{qa:'bulk-ai',scenario:'memo-over-limit'});
  add(5,'links-default','연결된 자산·연결 검색',mobile?file:'asset-detail.html',{...(mobile?{qa:'access',scenario:'manage'}:{}),id:'A023'});
  add(5,'links-permissions','연결 자산 권한 혼합',mobile?file:'asset-detail.html',{qa:'review',scenario:'links-permissions',manage:'0',role:'leader',id:'A001'});
  add(5,'links-empty','연결된 자산 없음',mobile?file:'asset-detail.html',{qa:'review',scenario:'links-empty',id:'A001'});
  add(5,'links-hidden','조회 불가 연결 자산',mobile?file:'asset-detail.html',{qa:'review',scenario:'links-hidden',id:'A001'});
  add(5,'template-manager','템플릿 관리','category.html',{},'templates-manage');
  add(5,'template-change','템플릿 배정·대상 변경 검토','assets.html',{},'template-change');
  add(5,'member-target','앱 구성원 기준 상세',mobile?file:'leader.html',{qa:'review',scenario:'target',id:'A001'});
  const worksiteSample=D.assets.find(a=>(a.assignments||[])[0]?.worksite);
  add(5,'worksite-target','앱 근무지 기준 상세',mobile?file:'leader.html',{qa:'review',scenario:'target',id:worksiteSample?.id||'A027'});
  add(6,'fixed-info','고정 ON·비공개 설정','category.html',{},'category-edit');
  add(6,'extra-info','비공개 추가 정보 예시',mobile?file:'asset-detail.html',{qa:'extra-info',id:'A001'});
  add(6,'disposed-manage','폐기 자산·복구 권한',mobile?file:'asset-detail.html',{qa:'access',scenario:'manage',id:'A020'});
  add(6,'disposed-view','폐기 자산·조회만',mobile?file:'asset-detail.html',{qa:'access',scenario:'view',id:'A020'});
  add(6,'history','이력 표시 예시','asset-detail.html',{qa:'history',id:'A001'},'history');
  add(6,'retired-member','퇴사 구성원 배정','asset-detail.html',{qa:'retired',target:'오세훈',id:'A023'});
  add(6,'inactive-worksite','비활성 근무지 배정','asset-detail.html',{qa:'retired',target:worksiteSample?.assignments[0].worksite||'강남점',id:worksiteSample?.id||'A027'});
  add(6,'settings','자산 관리 권한 설정','settings.html');add(6,'plan-lite','Lite 요금제','feature-settings.html',{plan:'Lite'});
  add(6,'plan-pro','Pro 요금제','feature-settings.html',{plan:'Pro'});
  // 패널에서 다른 모드로 이동하지 않는다. 공통 시나리오는 위에서 현재 모드 주소로 구성한다.
  const availableEntries=entries.filter(e=>mobile?e.page===file:!['app.html','leader.html'].includes(e.page));
  const availableGroups=groups.map((name,n)=>({name,n})).filter(g=>availableEntries.some(e=>e.group===g.n));
  const esc=value=>String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function go(entry){
    const u=new URL(entry.page,location.href);u.search='';
    for(const [key,value] of Object.entries(entry.query))u.searchParams.set(key,value);
    if(entry.open)u.searchParams.set('review',entry.open);
    if(Number.isInteger(entry.group))sessionStorage.setItem(groupStorageKey,String(entry.group));
    location.href=u.href;
  }
  function openReview(){
    const click=selector=>document.querySelector(selector)?.click();
    switch(params.get('review')){
      case 'mobile-assets':click('[data-mapp-goto="assets"]');break;
      case 'mobile-member':click('[data-menu-fold="member"]');click('[data-directory-open="member"]');break;
      case 'mobile-worksite':click('[data-menu-fold="worksite"]');click('[data-directory-open="worksite"]');break;
      case 'category-manage':click('[data-manage-dropdown]');click('[data-manage-classification]');break;
      case 'extra-manage':click('[data-manage-dropdown]');click('[data-manage-extra]');break;
      case 'category-edit':click('[data-edit-sub]');break;
      case 'templates-manage':window.AssetTemplates?.openTemplateManager();break;
      case 'template-change':window.AssetTemplates?.openTemplateAssign(undefined,true);break;
      case 'history':click('[data-atab="history"]');break;
    }
  }
  const activeEntry=availableEntries.find(e=>e.page===file&&(e.query.qa||'')===(params.get('qa')||'')&&(e.open||'')===(params.get('review')||'')&&Object.entries(e.query).every(([k,v])=>params.get(k)===v));
  function mount(){
    if(document.getElementById('prototype-qa'))return;
    const panel=document.createElement('aside');panel.id='prototype-qa';panel.className='prototype-qa';panel.setAttribute('aria-label','프로토타입 QA 패널');
    panel.innerHTML=`<header><strong>QA 시나리오</strong><button type="button" data-collapse aria-label="QA 패널 접기" aria-expanded="true">−</button></header><div class="prototype-qa-body"><label class="prototype-qa-label">검토할 항목<select aria-label="검토할 항목">${availableGroups.map(({name,n})=>`<option value="${n}">${name}</option>`).join('')}</select></label><p class="prototype-qa-current">현재: ${esc(activeEntry?.label||'기본 상태')}</p><div data-cases></div><p class="prototype-qa-note" data-note></p><button type="button" class="prototype-qa-reset" data-reset>이 화면의 기본 상태로</button></div>`;
    document.body.appendChild(panel);
    const select=panel.querySelector('select'),list=panel.querySelector('[data-cases]'),note=panel.querySelector('[data-note]'),toggle=panel.querySelector('[data-collapse]'),body=panel.querySelector('.prototype-qa-body');
    let stored;try{stored=Number(sessionStorage.getItem(groupStorageKey));}catch{}
    select.value=activeEntry?String(activeEntry.group):availableGroups.some(g=>g.n===stored)?String(stored):'0';
    const draw=()=>{list.innerHTML=availableEntries.filter(e=>e.group===Number(select.value)).map(e=>`<button type="button" data-review-case="${e.id}">${esc(e.label)}</button>`).join('');list.querySelectorAll('button').forEach(b=>b.onclick=()=>go(availableEntries.find(e=>e.id===b.dataset.reviewCase)));note.textContent=params.get('review')==='template-change'?'검토 대기: 대상을 바꾸면 선택 자산이 확인 없이 해제됩니다.':'시나리오는 샘플 데이터에만 적용됩니다.';};
    select.onchange=()=>{sessionStorage.setItem(groupStorageKey,select.value);draw();};draw();
    const collapse=value=>{body.hidden=value;toggle.textContent=value?'+':'−';toggle.setAttribute('aria-expanded',String(!value));toggle.setAttribute('aria-label',value?'QA 패널 펼치기':'QA 패널 접기');};
    toggle.onclick=()=>collapse(!body.hidden);
    panel.querySelector('[data-reset]').onclick=()=>go({page:file,query:file==='asset-detail.html'?{id:params.get('id')||'A001'}:{}});
    openReview();
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',mount,{once:true}):mount();
})();
