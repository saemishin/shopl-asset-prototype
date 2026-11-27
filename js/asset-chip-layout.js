(() => {
  function labelsCell(labels, escape) {
    if (!labels?.length) return '<span class="muted">—</span>';
    const rest = labels.length - 1;
    return `<span class="fitted-tags"><span class="tag">${escape(labels[0])}</span>${rest ? `<span class="tag">+${rest}</span>` : ''}</span>`;
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
