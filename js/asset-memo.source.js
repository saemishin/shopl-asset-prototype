// Standalone prototype adapter for the dashboard's Tiptap 3.29.2 editor.
// Build: see js/asset-memo-build.md. The generated asset-memo.js has no CDN dependency.
/* 자산 메모 확정 명세 (2026-10-13, 대시보드·직원·리더 공통)
 * - 선택 입력, 본문 최대 500자. HTML 태그 제외, CharacterCount 기본 UTF-16 집계 유지.
 *   일반 초과 입력은 차단, 붙여넣기 초과분은 제거(복잡한 구조가 계속 초과하면 전체 차단).
 * - 공백·줄바꿈·빈 문단만 남으면 빈 값 저장. 조회·필터·목록 아이콘도 같은 판정 사용.
 *   기존 이미지·구분선 노드는 콘텐츠로 유지하며 이미지 업로드/숨은 확장 툴바는 추가하지 않음.
 * - 추가/수정 폼은 직접 편집하고 자산 최종 저장 시 반영. 상세는 메모만 별도 저장:
 *   대시보드 센터 모달, 앱 풀스크린 팝업. 기존 권한·폐기 동결 판정은 호출 화면에서 유지.
 * - 정규화한 HTML로 변경 판정: 서식만 변경해도 저장/이력 대상, 원복하면 저장 비활성.
 *   메모 팝업의 취소/X/배경/ESC는 미저장 변경 시 수정 중단 확인. 폼은 기존 이탈 확인 사용.
 * - 지원 서식 붙여넣기 및 HTML 저장/조회/이력 유지, 목록 툴팁은 본문 텍스트.
 * - 링크: 기본 URI 검증·자동 인식, 편집 중 이동 없음, 조회 시 새 탭.
 *   운영 웹 prompt 대신 미리보기 호환 URL 모달 사용(취소 유지, 빈 URL은 링크 해제).
 * - 저장 콜백 성공 후에만 팝업을 닫음. 예외/Promise 거부/false는 실패로 보고 내용·서식을 보존해 재시도.
 *   저장 중 중복 실행·닫기·추가 편집 방지. 실제 동시 저장은 마지막 성공값 우선(API 구현 계약).
 * - 정적 인메모리 프로토타입. 실제 API/DB·네이티브 키보드·엑셀 생성 구현을 뜻하지 않음.
 */
import { Editor, generateHTML, generateJSON, getSchema } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Highlight } from '@tiptap/extension-highlight';
import { Image } from '@tiptap/extension-image';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { TextAlign } from '@tiptap/extension-text-align';
import { CharacterCount, Placeholder } from '@tiptap/extensions';

const LIMIT = 500;
const base = [
  StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: { openOnClick: false, autolink: true } }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }), Highlight, Image,
  TaskList, TaskItem.configure({ nested: true }),
];
const schema = getSchema(base);
const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const legacyHTML = value => String(value ?? '').split(/\r?\n/).map(line => `<p>${escape(line)}</p>`).join('');
const json = value => generateJSON(value || '<p></p>', base);
function hasContent(node) {
  return /\S/.test(node.text || '') || ['image', 'horizontalRule'].includes(node.type)
    || (node.content || []).some(hasContent);
}
function normalize(value, isHTML = true) {
  const doc = json(isHTML ? value : legacyHTML(value));
  return hasContent(doc) ? generateHTML(doc, base) : '';
}
function plain(value) {
  const walk = node => {
    if (node.text) return node.text;
    if (node.type === 'hardBreak') return '\n';
    const separator = ['doc', 'bulletList', 'orderedList', 'taskList', 'listItem', 'taskItem', 'blockquote'].includes(node.type) ? '\n' : '';
    return (node.content || []).map(walk).join(separator);
  };
  return walk(json(value)).trim();
}
function count(value) {
  const doc = schema.nodeFromJSON(json(value));
  return doc.textBetween(0, doc.content.size, undefined, ' ').length;
}
const has = value => hasContent(json(value));
const render = value => has(value) ? `<div class="asset-memo-read">${normalize(value)}</div>` : '<span class="muted">—</span>';
const icon = body => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const icons = {
  undo: icon('<path d="M9 5 4 10l5 5M4 10h9a6 6 0 0 1 6 6"/>'),
  redo: icon('<path d="m15 5 5 5-5 5M20 10h-9a6 6 0 0 0-6 6"/>'),
  bold: icon('<path d="M7 4h6a4 4 0 0 1 0 8H7V4Zm0 8h7a4 4 0 0 1 0 8H7v-8Z"/>'),
  italic: icon('<path d="M11 4h8M5 20h8M15 4 9 20"/>'),
  underline: icon('<path d="M6 3v7a6 6 0 0 0 12 0V3M4 21h16"/>'),
  strike: icon('<path d="M17 5c-2-3-10-3-10 2 0 2 2 3 5 4M7 19c3 2 10 2 10-3M3 12h18"/>'),
  highlight: icon('<path d="m15 3 6 6-10 10H5v-6L15 3ZM3 21h11"/>'),
  bulletList: icon('<circle cx="4" cy="5" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="19" r="1"/><path d="M9 5h12M9 12h12M9 19h12"/>'),
  orderedList: icon('<path d="M3 3h2v5M3 8h4M3 13c4-3 5 1 0 4h4M10 5h11M10 12h11M10 19h11"/>'),
  left: icon('<path d="M3 4h18M3 9h12M3 14h18M3 19h12"/>'),
  center: icon('<path d="M3 4h18M6 9h12M3 14h18M6 19h12"/>'),
  right: icon('<path d="M3 4h18M9 9h12M3 14h18M9 19h12"/>'),
  justify: icon('<path d="M3 4h18M3 9h18M3 14h18M3 19h18"/>'),
  blockquote: icon('<path d="M4 3v18M9 5h12M9 11h12M9 17h8"/>'),
  link: icon('<path d="m10 14 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 10a4 4 0 0 0 6 0l4-4a4 4 0 0 0-6-6l-1 1"/>'),
};
const groups = [
  [['undo','실행 취소'],['redo','다시 실행']],
  [['h1','제목 1'],['h2','제목 2'],['h3','제목 3']],
  [['bold','굵게'],['italic','기울임'],['underline','밑줄'],['strike','취소선'],['highlight','형광펜']],
  [['bulletList','글머리 기호 목록'],['orderedList','번호 매기기 목록']],
  [['left','왼쪽 정렬'],['center','가운데 정렬'],['right','오른쪽 정렬'],['justify','양쪽 정렬']],
  [['blockquote','인용구'],['link','링크']],
];
const mounted = new Map();
function openLinkInput(editor) {
  if (document.querySelector('.asset-memo-link-back')) return;
  const back=document.createElement('div');
  back.className='asset-memo-link-back';
  const screen=document.querySelector('.mapp-screen');
  if(screen){const r=screen.getBoundingClientRect();back.style.cssText=`position:absolute;top:${r.top+window.scrollY}px;left:${r.left+window.scrollX}px;width:${r.width}px;height:${r.height}px;`;}
  back.innerHTML=`<div class="modal" role="dialog" aria-modal="true" aria-label="링크 URL 입력"><h3>링크</h3><div class="body"><div class="field"><label for="asset-memo-link-url">링크 URL을 입력하세요</label><input id="asset-memo-link-url" type="text" placeholder="https://" value="${escape(editor.getAttributes('link').href||'')}"><p class="field-err" data-link-error hidden>유효한 URL이 아닙니다.</p></div></div><div class="foot"><button type="button" class="btn" data-link-cancel>취소</button><button type="button" class="btn primary" data-link-apply>확인</button></div></div>`;
  document.body.append(back);
  const input=back.querySelector('input');
  const close=()=>{document.removeEventListener('keydown',onKey,true);back.remove();if(!editor.isDestroyed)editor.commands.focus();};
  const apply=()=>{
    const value=input.value;
    const chain=editor.chain().focus().extendMarkRange('link');
    const applied=value===''?chain.unsetLink().run():chain.setLink({href:value}).run();
    if(applied)close();else{back.querySelector('[data-link-error]').hidden=false;input.setAttribute('aria-invalid','true');input.focus();}
  };
  function onKey(event){if(event.key==='Escape'){event.preventDefault();event.stopImmediatePropagation();close();}else if(event.key==='Enter'){event.preventDefault();event.stopImmediatePropagation();apply();}}
  back.querySelector('[data-link-cancel]').onclick=close;
  back.querySelector('[data-link-apply]').onclick=apply;
  back.addEventListener('click',event=>{if(event.target===back)close();});
  document.addEventListener('keydown',onKey,true);
  input.focus();input.select();
}
function mountTextarea(input) {
  if (!input || mounted.has(input)) return mounted.get(input);
  input.value = normalize(input.value);
  input.removeAttribute('maxlength');
  input.dataset.assetMemoSource = '';
  input.hidden = true;
  const shell = document.createElement('div');
  shell.className = 'asset-memo-editor';
  shell.innerHTML = `<div class="asset-memo-toolbar" role="toolbar" aria-label="메모 서식">${groups.map(group => `<div class="asset-memo-tools">${group.map(([key,label]) => `<button type="button" data-memo-tool="${key}" title="${label}" aria-label="${label}"${['undo','redo'].includes(key) ? '' : ' aria-pressed="false"'}>${icons[key] || key.toUpperCase()}</button>`).join('')}</div>`).join('')}</div><div class="asset-memo-body"></div><div class="asset-memo-count" aria-live="polite"><span data-memo-count>0</span><span>/ 500</span></div>`;
  input.after(shell);
  const refresh = editor => {
    shell.querySelector('[data-memo-count]').textContent = editor.storage.characterCount.characters();
    shell.querySelectorAll('[data-memo-tool]').forEach(button => {
      const key = button.dataset.memoTool;
      if (key === 'undo' || key === 'redo') button.disabled = !editor.can()[key]();
      else {
        const active = /^h[123]$/.test(key) ? editor.isActive('heading',{level:Number(key[1])})
          : ['left','center','right','justify'].includes(key) ? editor.isActive({textAlign:key}) : editor.isActive(key);
        button.classList.toggle('active',active);
        button.setAttribute('aria-pressed',String(active));
      }
    });
  };
  const editor = new Editor({
    element: shell.querySelector('.asset-memo-body'),
    extensions: [...base, Placeholder.configure({placeholder:'입력'}), CharacterCount.configure({limit:LIMIT})],
    content: input.value || '<p></p>',
    editorProps: { attributes: { role:'textbox', 'aria-label':'메모', 'aria-multiline':'true', 'data-memo-content':'' } },
    onUpdate: ({editor: instance}) => {
      const next = normalize(instance.getHTML());
      if (next !== input.value) { input.value=next; input.dispatchEvent(new Event('input',{bubbles:true})); }
    },
    onTransaction: ({editor:instance}) => refresh(instance),
  });
  shell.querySelector('.asset-memo-toolbar').addEventListener('mousedown',event=>event.preventDefault());
  shell.querySelectorAll('[data-memo-tool]').forEach(button=>button.addEventListener('click',()=>{
    const key=button.dataset.memoTool, chain=editor.chain().focus();
    if (key==='link') {
      openLinkInput(editor);
    } else if (/^h[123]$/.test(key)) chain.toggleHeading({level:Number(key[1])}).run();
    else if (['left','center','right','justify'].includes(key)) chain.setTextAlign(key).run();
    else if (key==='undo'||key==='redo') chain[key]().run();
    else chain[`toggle${key[0].toUpperCase()+key.slice(1)}`]().run();
  }));
  const api={editor,shell,setValue(value){
    const next=normalize(value);
    // Loading/resetting a form value starts a fresh session; it must not become undoable user input.
    if (next!==normalize(editor.getHTML())) { api.destroy();input.value=next;return mountTextarea(input); }
    input.value=next; refresh(editor);
  },destroy(){editor.destroy();shell.remove();mounted.delete(input);}};
  mounted.set(input,api);
  refresh(editor);
  return api;
}
function confirmDiscard(back,onDiscard) {
  if (back.querySelector('.asset-memo-discard')) return;
  const confirm=document.createElement('div');
  confirm.className='asset-memo-discard';
  confirm.innerHTML='<div class="modal" role="alertdialog" aria-modal="true" aria-label="수정 중단 확인"><h3>수정을 중단하시겠습니까?</h3><div class="body">수정을 중단할 경우 변경된 내용은 저장되지 않습니다.</div><div class="foot"><button type="button" class="btn" data-stay>취소</button><button type="button" class="btn primary" data-discard>확인</button></div></div>';
  back.append(confirm);
  confirm.querySelector('[data-stay]').onclick=()=>confirm.remove();
  confirm.querySelector('[data-discard]').onclick=onDiscard;
}
function open({value='',back,mobile=false,onSave}) {
  const overlay=back||document.createElement('div');
  overlay.classList.add('asset-memo-back');
  overlay.classList.toggle('asset-memo-mobile',mobile);
  if (!back) {overlay.style.zIndex=340;document.body.append(overlay);}
  overlay.innerHTML=`<section class="asset-memo-panel" role="dialog" aria-modal="true" aria-label="메모 수정"><header><h3>메모 수정</h3><button type="button" class="asset-memo-close" aria-label="닫기">${icon('<path d="m6 6 12 12M18 6 6 18"/>')}</button></header><div class="asset-memo-panel-body"><textarea aria-label="메모 입력">${escape(value)}</textarea><p class="muted" data-save-error role="alert" hidden></p></div><footer><button type="button" class="btn" data-cancel>취소</button><button type="button" class="btn primary" data-save disabled>저장</button></footer></section>`;
  const input=overlay.querySelector('textarea'), api=mountTextarea(input), initial=input.value, save=overlay.querySelector('[data-save]');
  let saving=false;
  const error=overlay.querySelector('[data-save-error]');
  const dirty=()=>normalize(input.value)!==initial;
  const close=()=>{document.removeEventListener('keydown',onKey,true);api.destroy();overlay.remove();};
  const requestClose=()=>{if(!saving)dirty()?confirmDiscard(overlay,close):close();};
  function onKey(event){if(event.key!=='Escape'||document.querySelector('.asset-memo-link-back'))return;event.preventDefault();event.stopImmediatePropagation();const confirm=overlay.querySelector('.asset-memo-discard');if(confirm)confirm.remove();else requestClose();}
  input.addEventListener('input',()=>save.disabled=saving||!dirty());
  overlay.querySelector('[data-cancel]').onclick=requestClose;
  overlay.querySelector('.asset-memo-close').onclick=requestClose;
  overlay.addEventListener('click',event=>{if(event.target===overlay)requestClose();});
  // onSave is a commit boundary: failure must not remove the editor or the draft.
  // Current screens save in memory. Real API callers must reject/return false on failure,
  // and update the asset/activity only after a confirmed successful save.
  save.onclick=async()=>{
    if(save.disabled||saving)return;
    const next=normalize(input.value);
    const controls=[...overlay.querySelectorAll('button')].map(button=>({button,disabled:button.disabled}));
    saving=true;error.hidden=true;
    overlay.setAttribute('aria-busy','true');
    api.editor.setEditable(false);
    overlay.querySelectorAll('button').forEach(button=>button.disabled=true);
    try {
      if(await onSave(next)===false)throw new Error('Memo save rejected');
      close();
    } catch {
      // Reuse the existing app save-failure feedback; retain the same editor/undo state.
      error.textContent='저장하지 못했습니다. 다시 시도해주세요.';error.hidden=false;
    } finally {
      saving=false;
      if(overlay.isConnected&&!api.editor.isDestroyed){
        overlay.removeAttribute('aria-busy');
        api.editor.setEditable(true);
        controls.forEach(({button,disabled})=>button.disabled=disabled);
        save.disabled=!dirty();
      }
    }
  };
  document.addEventListener('keydown',onKey,true);
  return overlay;
}
const syncTextarea=input=>{const api=mounted.get(input);if(api)api.setValue(input.value);};
window.AssetMemo={normalize,plain,has,count,render,mountTextarea,syncTextarea,open};
// Seed notes are plain text; an explicit marker prevents interpreting literal '<...>' as HTML.
for(const asset of window.DATA?.assets || []) {
  if(asset.note)asset.note=normalize(asset.note,asset._noteFormat==='html');
  asset._noteFormat='html';
}
// Form pages are recreated by the existing app renderer. Release only detached editors.
new MutationObserver(()=>{for(const [input,api] of mounted)if(!input.isConnected)api.destroy();}).observe(document.documentElement,{childList:true,subtree:true});
