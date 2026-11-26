(function (global) {
  'use strict';

  const OpComb = (global.OpComb = global.OpComb || {});
  const Themes = OpComb.Themes;
  const Hints = OpComb.Hints;
  const Continuum = OpComb.Continuum;
  const ContinuumView = OpComb.ContinuumView;
  const Session = OpComb.Session;

  function init(callbacks) {
    const themePill = document.getElementById('report-theme-pill');
    const subtitleEl = document.getElementById('report-subtitle');
    const finalArtifactEl = document.getElementById('report-final-artifact');
    const trophiesEl = document.getElementById('report-trophies');
    const strengthsList = document.getElementById('report-strengths-list');
    const focusList = document.getElementById('report-focus-list');
    const targetedDesc = document.getElementById('targeted-cta-desc');
    const btnStartTargeted = document.getElementById('btn-start-targeted');
    const historyList = document.getElementById('report-history-list');
    const printNameInput = document.getElementById('student-print-name');
    const printDateStamp = document.getElementById('print-date-stamp');
    const btnPrint = document.getElementById('btn-print-report');
    const btnNewSession = document.getElementById('btn-new-session');
    const metacogBtns = document.querySelectorAll('.metacog-btn');
    const metacogNote = document.getElementById('metacog-note');

    let currentSession = null;
    let currentRecommendedAxis = 'jerarquia';

    function render(session) {
      currentSession = session;
      const theme = Themes.getTheme(session.config.themeId);
      document.documentElement.dataset.theme = theme.id;

      themePill.textContent = theme.name;
      const doneCount = session.completedExercises.length;
      const trophyCount = session.trophies.length;
      subtitleEl.textContent =
        `Has resolt ${doneCount} ${doneCount === 1 ? 'expressió' : 'expressions'} pas a pas i has aconseguit ${trophyCount} ${trophyCount === 1 ? 'trofeu' : 'trofeus'}.`;

      printDateStamp.textContent = new Date().toLocaleDateString('ca-ES');

      // Element final assemblat (si completat o disponible per muntar)
      if (finalArtifactEl) {
        if (session.assemblyCompleted && theme.assembly) {
          finalArtifactEl.hidden = false;
          finalArtifactEl.innerHTML =
            `<div class="final-artifact-art">${theme.assembly.finalSvg}</div>` +
            '<div class="final-artifact-info">' +
              '<span class="pill pill-accent">Element final assemblat!</span>' +
              `<strong>${theme.assembly.finalName}</strong>` +
              `<p>${theme.assembly.finalDesc}</p>` +
            '</div>';
        } else if (!session.assemblyCompleted && session.trophies.length >= session.challenges.length && session.challenges.length > 0 && theme.assembly) {
          finalArtifactEl.hidden = false;
          finalArtifactEl.innerHTML =
            '<div class="final-artifact-info">' +
              '<strong>Tens totes les peces aconseguides!</strong>' +
              `<p>Encara pots completar el muntatge de «${theme.assembly.finalName}».</p>` +
            '</div>' +
            '<button type="button" id="btn-report-go-assembly" class="btn btn-primary btn-sm no-print">Munta l’element final →</button>';
        } else {
          finalArtifactEl.hidden = true;
          finalArtifactEl.innerHTML = '';
        }
      }

      // Vitrina de trofeus
      trophiesEl.innerHTML = session.challenges
        .map((ch, idx) => {
          const trophy = theme.trophies[idx] || theme.trophies[theme.trophies.length - 1];
          const earned = session.trophies.includes(idx);
          return (
            `<div class="trophy-card ${earned ? 'is-earned' : 'is-locked'}">` +
              `<div class="trophy-card-svg">${trophy.svg}</div>` +
              `<div class="trophy-card-name">${trophy.name}</div>` +
              `<div class="trophy-card-desc">${earned ? trophy.desc : `Pendent (${ch.title})`}</div>` +
            '</div>'
          );
        })
        .join('');

      // Mapa del Contínuum
      const snapshot = ContinuumView.renderReport(session.continuum);

      // Diagnòstic qualitatiu
      const summary = Hints.buildFormativeSummary(session, snapshot);
      currentRecommendedAxis = summary.recommendedAxis;

      strengthsList.innerHTML = summary.strengths
        .map(
          (s) =>
            '<li class="diag-item">' +
              `<strong>${s.label} (${s.stageLabel})</strong>` +
              `<span>${s.text}</span>` +
            '</li>'
        )
        .join('');

      if (summary.focusAreas.length === 0) {
        focusList.innerHTML =
          '<li class="diag-item">' +
            '<strong>Excel·lent precisió!</strong>' +
            '<span>No s’han detectat patrons d’error repetits. Pots pujar el repte amb el mode de 6è o personalitzat.</span>' +
          '</li>';
      } else {
        focusList.innerHTML = summary.focusAreas
          .map(
            (f) =>
              '<li class="diag-item">' +
                `<strong>${f.title}</strong>` +
                `<span>${f.tip}</span>` +
                (f.example ? `<span class="diag-example">Exemple treballat: ${f.example}</span>` : '') +
              '</li>'
          )
          .join('');
      }

      const recMeta = Continuum.AXES_META.find((a) => a.id === currentRecommendedAxis);
      targetedDesc.textContent = recMeta
        ? `Vols reforçar «${recMeta.label}»? Fes 3 reptes curts enfocats només en aquest punt.`
        : 'Fes 3 reptes ràpids per consolidar el teu punt de millora.';

      // Autoavaluació metacognitiva
      metacogBtns.forEach((btn) => {
        const selected = session.reflection && session.reflection.confidence === btn.dataset.confidence;
        btn.classList.toggle('is-selected', Boolean(selected));
        btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });
      metacogNote.value = (session.reflection && session.reflection.note) || '';

      // Historial revisable pas a pas amb <details>
      if (doneCount === 0) {
        historyList.innerHTML = '<p class="card-subtitle">Encara no has completat cap expressió en aquesta sessió.</p>';
      } else {
        historyList.innerHTML = session.completedExercises
          .map((ex, idx) => {
            const badge = ex.hadAnyHint
              ? '<span class="pill pill-warn">Amb pistes</span>'
              : '<span class="pill pill-accent">Sense pistes</span>';
            const stepsHtml = ex.steps
              .map(
                (st, sIdx) =>
                  `<div class="history-step-row"><span>${sIdx === 0 ? '' : '= '}${st.expr}</span><span class="cascade-line-note">${st.opText} = ${st.result}</span></div>`
              )
              .join('');
            return (
              `<details class="history-item"${ex.hadAnyHint ? ' open' : ''}>` +
                `<summary>` +
                  `<span>#${idx + 1} · ${ex.initialExpr} = ${ex.finalValue}</span>` +
                  badge +
                '</summary>' +
                '<div class="history-steps">' +
                  stepsHtml +
                  `<div><strong>= ${ex.finalValue}</strong></div>` +
                '</div>' +
              '</details>'
            );
          })
          .join('');
      }
    }

    metacogBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!currentSession) return;
        currentSession.reflection = currentSession.reflection || { confidence: null, note: '' };
        currentSession.reflection.confidence = btn.dataset.confidence;
        Session.saveSession(currentSession);
        metacogBtns.forEach((b) => {
          const isSel = b === btn;
          b.classList.toggle('is-selected', isSel);
          b.setAttribute('aria-pressed', isSel ? 'true' : 'false');
        });
      });
    });

    metacogNote.addEventListener('input', () => {
      if (!currentSession) return;
      currentSession.reflection = currentSession.reflection || { confidence: null, note: '' };
      currentSession.reflection.note = metacogNote.value;
      Session.saveSession(currentSession);
    });

    // El nom d'impressió NO es guarda a localStorage per privacitat
    printNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') e.preventDefault();
    });

    btnPrint.addEventListener('click', () => {
      printDateStamp.textContent = new Date().toLocaleDateString('ca-ES');
      global.print();
    });

    btnStartTargeted.addEventListener('click', () => {
      if (!currentSession) return;
      callbacks.onStartTargeted(currentRecommendedAxis);
    });

    btnNewSession.addEventListener('click', () => {
      callbacks.onNewSession();
    });

    if (finalArtifactEl) {
      finalArtifactEl.addEventListener('click', (e) => {
        if (e.target.closest('#btn-report-go-assembly') && callbacks.onGoAssembly) {
          callbacks.onGoAssembly();
        }
      });
    }

    return {
      render
    };
  }

  OpComb.ReportView = {
    init
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
