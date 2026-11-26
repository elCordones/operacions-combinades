(function (global) {
  'use strict';

  const OpComb = (global.OpComb = global.OpComb || {});
  const Themes = OpComb.Themes;

  function init(callbacks) {
    const form = document.getElementById('setup-form');
    const customPanel = document.getElementById('custom-ops-panel');
    const themeContainer = document.getElementById('theme-options');
    const resumeBanner = document.getElementById('resume-banner');
    const resumeSummary = document.getElementById('resume-summary');
    const btnResume = document.getElementById('btn-resume-session');
    const btnDiscard = document.getElementById('btn-discard-session');

    // Renderitza les 5 temàtiques
    const themes = Themes.getAllThemes();
    themeContainer.innerHTML = themes
      .map(
        (t, idx) =>
          `<label class="theme-card">` +
            `<input type="radio" name="themeId" value="${t.id}"${idx === 0 ? ' checked' : ''}>` +
            '<div class="theme-card-head">' +
              `<span class="theme-card-icon">${t.iconSvg}</span>` +
              '<div>' +
                `<span class="theme-card-title">${t.name}</span>` +
                `<span class="theme-card-tagline">${t.tagline}</span>` +
              '</div>' +
            '</div>' +
            `<p class="theme-card-desc">${t.shortDesc}</p>` +
          '</label>'
      )
      .join('');

    function syncCustomVisibility() {
      const checkedCourse = form.querySelector('input[name="course"]:checked');
      const isCustom = checkedCourse && checkedCourse.value === 'custom';
      customPanel.hidden = !isCustom;
    }

    form.addEventListener('change', (e) => {
      if (e.target.name === 'course') {
        syncCustomVisibility();
      }
      if (e.target.name === 'themeId') {
        document.documentElement.dataset.theme = e.target.value;
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const course = form.querySelector('input[name="course"]:checked')?.value || '6e';
      const themeId = form.querySelector('input[name="themeId"]:checked')?.value || 'cosmos';
      const exercisesPerChallenge = Number(form.querySelector('input[name="exCount"]:checked')?.value || 3);

      const customOps =
        course === 'custom'
          ? {
              mult_div: document.getElementById('op-mult-div').checked,
              parentesis: document.getElementById('op-parentesis').checked,
              potencies: document.getElementById('op-potencies').checked,
              arrels: document.getElementById('op-arrels').checked
            }
          : {
              mult_div: true,
              parentesis: true,
              potencies: true,
              arrels: course === '6e'
            };

      callbacks.onStart({
        course,
        themeId,
        exercisesPerChallenge,
        customOps
      });
    });

    btnResume.addEventListener('click', () => {
      callbacks.onResume();
    });

    btnDiscard.addEventListener('click', () => {
      callbacks.onDiscard();
      resumeBanner.hidden = true;
    });

    function refreshResumeBanner(savedSession) {
      if (!savedSession) {
        resumeBanner.hidden = true;
        return;
      }
      const theme = Themes.getTheme(savedSession.config.themeId);
      const chNum = (savedSession.currentChallengeIdx || 0) + 1;
      const totalCh = (savedSession.challenges && savedSession.challenges.length) || 6;
      const trophiesCount = (savedSession.trophies && savedSession.trophies.length) || 0;
      resumeSummary.textContent = `${theme.name} · Repte ${chNum} de ${totalCh} · ${trophiesCount} trofeus aconseguits`;
      resumeBanner.hidden = false;
    }

    syncCustomVisibility();

    return {
      refreshResumeBanner
    };
  }

  OpComb.SetupView = {
    init
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
