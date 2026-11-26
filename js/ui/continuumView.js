(function (global) {
  'use strict';

  const OpComb = (global.OpComb = global.OpComb || {});
  const Continuum = OpComb.Continuum;

  function renderInto(container, snapshot, pulsedAxes) {
    if (!container) return;
    const pulseSet = new Set(pulsedAxes || []);
    container.innerHTML = snapshot
      .map((item) => {
        const inactiveClass = item.active ? '' : ' is-inactive';
        const pulseClass = pulseSet.has(item.id) ? ' is-pulsing' : '';
        const pct = item.totalAttempts === 0 ? 6 : Math.max(14, item.percent);
        const attemptsText = item.active
          ? item.totalAttempts === 0
            ? 'Encara sense intents'
            : `${item.totalCorrect} de ${item.totalAttempts} encerts`
          : 'No inclòs en aquesta sessió';

        return (
          `<div class="cont-item${inactiveClass}${pulseClass}" data-axis="${item.id}">` +
            '<div class="cont-item-top">' +
              `<span class="cont-axis-name"><span class="cont-badge">${item.badge}</span><span>${item.label}</span></span>` +
              `<span class="cont-stage-pill" data-stage="${item.stage.id}">${item.stage.icon} ${item.stage.label}</span>` +
            '</div>' +
            '<div class="cont-track" aria-hidden="true">' +
              `<div class="cont-fill" data-stage="${item.stage.id}" style="--fill-pct: ${pct}%"></div>` +
            '</div>' +
            `<div class="cont-meta">${attemptsText}</div>` +
          '</div>'
        );
      })
      .join('');
  }

  function renderAll(continuumState, pulsedAxes) {
    const snapshot = Continuum.getSnapshot(continuumState);
    renderInto(document.getElementById('continuum-list-desktop'), snapshot, pulsedAxes);
    renderInto(document.getElementById('continuum-list-mobile'), snapshot, pulsedAxes);
    return snapshot;
  }

  function renderReport(continuumState) {
    const snapshot = Continuum.getSnapshot(continuumState);
    renderInto(document.getElementById('report-continuum-list'), snapshot, []);
    return snapshot;
  }

  OpComb.ContinuumView = {
    renderAll,
    renderReport
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
