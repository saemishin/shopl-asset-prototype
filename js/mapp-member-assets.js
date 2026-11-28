// 구성원 상세의 최근 배정과 전체 목록은 같은 자산 행을 사용한다.
window.MemberAssetViews = (() => {
  const esc = window.AssetExtra.esc;
  function row({asset, since}, statuses) {
    const [label, color] = statuses[asset.status] || [asset.status, ""];
    return `<button type="button" class="mapp-directory-asset-row member-asset-row" data-directory-asset="${esc(asset.id)}" data-search="${esc([asset.product, asset.assetNo].filter(Boolean).join(" ").toLowerCase())}">
      <span class="badge ${color}">${esc(label)}</span>
      <small class="member-asset-path"><span>${esc(asset.group)}</span> › <span>${esc(asset.sub)}</span></small>
      <strong>${esc(asset.product)}</strong><small class="member-asset-number">${esc(asset.assetNo || "—")}</small>
      <small>배정일: ${since ? esc(since.replaceAll("-", ".")) : "—"}</small>
    </button>`;
  }
  function recent(items, statuses) {
    if (!items.length) return '<p class="mapp-directory-empty">배정 중인 자산이 없습니다.</p>';
    return items.slice(0, 5).map(item => row(item, statuses)).join("") +
      '<button type="button" class="btn member-view-all" data-directory-member-viewall>전체 보기</button>';
  }
  function list(items, query, statuses) {
    if (!items.length) return '<p class="mapp-directory-empty">배정 중인 자산이 없습니다.</p>';
    return `<div class="mapp-directory-asset-tools">
      <div class="mapp-directory-search"><input type="search" data-directory-search placeholder="품목명/고유관리번호" aria-label="자산 검색" value="${esc(query || "")}"><button type="button" data-directory-search-clear aria-label="검색어 지우기" hidden>×</button></div>
      <b data-member-count>전체 (<span data-directory-count>${items.length}</span>)</b></div>
      <div class="mapp-directory-asset-list">${items.map(item => row(item, statuses)).join("")}</div>
      <p class="mapp-directory-empty" data-directory-search-empty hidden>결과가 없습니다.</p>`;
  }
  function profile(name, info, color) {
    const avatar = info.photo ? `<img src="${esc(info.photo)}" alt="">` : esc(name[0]);
    return `<header class="member-assets-profile"><span class="mapp-directory-avatar" style="background:${color}">${avatar}</span>
      <div><strong>${esc(name)}</strong><small>${esc(info.team || "")}</small></div></header>`;
  }
  function infoCards(assetCard) {
    const labels = ["추가 정보", "그룹 및 권한", "근무 정보", "개인 정보", "급여 정보", "자산", "기기 및 앱 정보"];
    return labels.map(label => {
      if (label === "자산") return assetCard;
      return `<details class="mapp-directory-info member-info"><summary>${label}</summary><p>등록된 ${label}가 없습니다.</p></details>`;
    }).join("");
  }
  return { recent, list, profile, infoCards };
})();
