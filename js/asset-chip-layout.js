(() => {
  function labelsCell(labels, escape) {
    if (!labels?.length) return '<span class="muted">—</span>';
    const chips = labels.map(label => `<span class="tag">${escape(label)}</span>`).join('');
    return `<span class="asset-fit-chips fitted-tags">${chips}<span class="tag" data-chip-rest hidden></span></span>`;
  }
  function fitSummaryChips(scope) {
    scope.querySelectorAll(".asset-fit-chips").forEach(box => {
      const fit = () => {
        const rest = box.querySelector("[data-chip-rest]"),
          chips = [...box.children].filter(x => x !== rest);
        chips.forEach(x => x.hidden = !1), rest.hidden = !0;
        for (let visible = chips.length; visible > 0 && box.scrollWidth > box.clientWidth; visible--) chips[visible - 1].hidden = !0, rest.hidden = !1, rest.textContent = `+${chips.length - visible + 1}`;
      };
      fit(), new ResizeObserver(fit).observe(box);
    });
  }
  window.AssetChipLayout = {labelsCell, fit:fitSummaryChips};
})();
