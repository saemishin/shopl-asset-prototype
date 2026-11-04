// 대시보드 공통09 구성원 선택·공통10 근무지 선택 Modal. 배정·이동·템플릿 배정에서 같이 쓴다.
(() => {
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  // 데모 데이터: 근무지 주소, 관리자·리더 구분, 로그인 계정의 고정 근무지
  const ADDRESS = { 강남점: "서울특별시 강남구 테헤란로 129", 판교점: "경기도 성남시 분당구 판교역로 235", 본사: "서울특별시 중구 을지로 100", 역삼점: "서울특별시 강남구 역삼로 180" };
  const ROLE = { 박지훈: "리더", 정우성: "관리자" };
  const MY_FIXED = "본사";
  const color = name => { let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) % 360; return `hsl(${h} 55% 58%)`; };
  // members: [{name, team, empNo, phone}], worksites: {name: code}
  function open({ kind, members = [], worksites = {}, initial = null, exclude = [], onApply, z = 350 }) {
    const isMember = kind === "employee", ex = [].concat(exclude || []).filter(Boolean);
    let picked = initial, query = "";
    const back = document.createElement("div");
    back.className = "modal-back", back.style.zIndex = z;
    back.innerHTML = `<div class="modal sm"><h3>${isMember ? "구성원 선택" : "근무지 선택"}</h3>
      <div class="body" style="display:flex;flex-direction:column;max-height:56vh"><input type="text" class="picker-search" placeholder="${isMember ? "이름/사번/휴대폰번호" : "근무지명/코드/주소"}"><div data-list style="flex:1;min-height:0;overflow-y:auto;margin-top:8px"></div></div>
      <div class="foot"><button class="btn" data-close>취소</button><button class="btn primary" data-ok>적용</button></div></div>`;
    document.body.appendChild(back);
    const list = back.querySelector("[data-list]"), ok = back.querySelector("[data-ok]");
    const radio = v => `<input type="radio" name="tp-pick" value="${esc(v)}"${picked === v ? " checked" : ""}>`;
    function draw() {
      const q = query.trim().toLowerCase();
      let html = "", all;
      if (isMember) {
        all = members.filter(m => !ex.includes(m.name)).sort((x, y) => x.name.localeCompare(y.name, "ko"));
        const rows = all.filter(m => !q || [m.name, m.empNo, m.phone].some(v => String(v || "").toLowerCase().includes(q)));
        html = rows.map(m => `<label class="picker-member-row">${radio(m.name)}${window.pickerAvatarHtml(m.name, m.color || color(m.name), ROLE[m.name])}<span class="picker-member-info"><b>${esc(m.name)}</b><span>${esc(m.team || "—")}</span></span></label>`).join("");
      } else {
        all = Object.keys(worksites).filter(n => !ex.includes(n));
        const match = n => !q || [n, worksites[n], ADDRESS[n]].some(v => String(v || "").toLowerCase().includes(q));
        const row = n => `<label class="picker-member-row">${radio(n)}<span class="picker-member-info"><b>${esc(n)}</b><span>${esc(worksites[n] || "—")}</span><span class="picker-ws-address">${esc(ADDRESS[n] || "")}</span></span></label>`;
        const fixed = all.includes(MY_FIXED) && match(MY_FIXED), rest = all.filter(n => n !== MY_FIXED && match(n)).sort((x, y) => x.localeCompare(y, "ko"));
        html = (fixed ? `<div class="mapp-picker-section"><span class="mapp-picker-dot"></span>내 고정 근무지</div>${row(MY_FIXED)}${rest.length ? '<div class="picker-ws-divider"></div>' : ""}` : "") + rest.map(row).join("");
      }
      list.innerHTML = html || `<p class="muted" style="padding:16px 0">${all.length ? "결과가 없습니다." : "표시할 목록이 없습니다."}</p>`;
      ok.disabled = !all.includes(picked);
      list.querySelectorAll('[name="tp-pick"]').forEach(r => r.onchange = () => { picked = r.value, ok.disabled = false; });
    }
    back.querySelector(".picker-search").oninput = e => { query = e.target.value, draw(); };
    back.querySelector("[data-close]").onclick = () => back.remove();
    ok.onclick = () => { if (ok.disabled) return; back.remove(), onApply(picked); };

    if(window.DashboardCases){const initialMembers=members.slice(),initialSites={...worksites};window.DashboardCases.attach(back,{reference:isMember?'Web 공통09':'Web 공통10',reset:()=>{members=initialMembers.slice();worksites={...initialSites};picked=initial;query='';back.querySelector('.picker-search').value='';draw();},cases:[
      ['pick-none','선택 없음','2·4번',()=>{picked=null;draw();}],
      ['candidates-none','선택 가능한 대상 없음','2번',()=>{members=[];worksites={};picked=null;query='';draw();}]
    ]});}
    draw();
  }
  window.TargetPicker = { open };
})();
