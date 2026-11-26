// Shared by the employee asset menu and the employee/leader worksite profile.
window.worksiteAssetCardHtml = function (item, { directory, cardThumb, escape, status }) {
  const asset = item.asset;
  const id = escape(asset.id);
  const search = escape([asset.product, asset.assetNo].filter(Boolean).join(" ").toLowerCase());
  const attributes = directory
    ? `data-directory-asset="${id}" data-search="${search}"`
    : `data-asset-card data-asset-id="${id}"`;
  const hasPhoto = window.assetPhotos(asset).length > 0;
  const date = item.since ? escape(item.since.replaceAll("-", ".")) : "—";
  return `<div class="mapp-card" ${attributes}>
    <button type="button" class="mapp-card-thumb-btn" data-worksite-thumb="${id}" aria-label="${hasPhoto ? "사진 보기" : "자산 상세 보기"}">${cardThumb(asset)}</button>
    <button type="button" class="mapp-card-body" style="text-align:left; padding:0; overflow:hidden">
      <span style="display:block" class="mapp-card-title">${escape(asset.product)}</span>
      <span style="display:block" class="mapp-card-sub">${escape(asset.assetNo || "—")}</span>
      <span style="display:block" class="mapp-card-sub">배정일: ${date}</span>
    </button>
    <span class="badge ${status[1]}">${escape(status[0])}</span>
  </div>`;
};
