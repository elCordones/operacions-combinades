(function (global) {
  'use strict';

  const OpComb = (global.OpComb = global.OpComb || {});
  const Themes = OpComb.Themes;
  const Session = OpComb.Session;

  function init(callbacks) {
    const form = document.getElementById('setup-form');
    const customPanel = document.getElementById('custom-ops-panel');
    const exCountWrap = document.getElementById('ex-count-wrap');
    const themeContainer = document.getElementById('theme-options');
    const sharedBanner = document.getElementById('shared-config-banner');
    const resumeBanner = document.getElementById('resume-banner');
    const resumeSummary = document.getElementById('resume-summary');
    const btnResume = document.getElementById('btn-resume-session');
    const btnDiscard = document.getElementById('btn-discard-session');
    const btnCopyShare = document.getElementById('btn-copy-share-link');
    const shareStatus = document.getElementById('share-link-status');

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

    function syncExCountVisibility() {
      const mode = form.querySelector('input[name="activityMode"]:checked')?.value || 'cascada';
      if (exCountWrap) exCountWrap.hidden = mode !== 'cascada';
    }

    function getCurrentConfig() {
      const course = form.querySelector('input[name="course"]:checked')?.value || '6e';
      const themeId = form.querySelector('input[name="themeId"]:checked')?.value || 'cosmos';
      const mode = form.querySelector('input[name="activityMode"]:checked')?.value || 'cascada';
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

      return {
        course,
        themeId,
        mode,
        exercisesPerChallenge,
        customOps
      };
    }

    function applyConfig(cfg, fromUrl) {
      if (!cfg) return;
      const courseRadio = form.querySelector(`input[name="course"][value="${cfg.course}"]`);
      if (courseRadio) courseRadio.checked = true;

      const modeRadio = form.querySelector(`input[name="activityMode"][value="${cfg.mode || 'cascada'}"]`);
      if (modeRadio) modeRadio.checked = true;

      const exRadio = form.querySelector(`input[name="exCount"][value="${cfg.exercisesPerChallenge || 3}"]`);
      if (exRadio) exRadio.checked = true;

      const themeRadio = form.querySelector(`input[name="themeId"][value="${cfg.themeId}"]`);
      if (themeRadio) {
        themeRadio.checked = true;
        document.documentElement.dataset.theme = cfg.themeId;
      }

      if (cfg.customOps) {
        document.getElementById('op-mult-div').checked = Boolean(cfg.customOps.mult_div);
        document.getElementById('op-parentesis').checked = Boolean(cfg.customOps.parentesis);
        document.getElementById('op-potencies').checked = Boolean(cfg.customOps.potencies);
        document.getElementById('op-arrels').checked = Boolean(cfg.customOps.arrels);
      }

      syncCustomVisibility();
      syncExCountVisibility();
      if (sharedBanner) sharedBanner.hidden = !fromUrl;
    }

    form.addEventListener('change', (e) => {
      if (e.target.name === 'course') {
        syncCustomVisibility();
      }
      if (e.target.name === 'activityMode') {
        syncExCountVisibility();
      }
      if (e.target.name === 'themeId') {
        document.documentElement.dataset.theme = e.target.value;
      }
      if (shareStatus) shareStatus.textContent = '';
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      callbacks.onStart(getCurrentConfig());
    });

    if (btnCopyShare) {
      btnCopyShare.addEventListener('click', async () => {
        const shareUrl = Session.buildShareUrl(global.location.href, getCurrentConfig());
        let copied = false;
        try {
          if (global.navigator && global.navigator.clipboard && global.navigator.clipboard.writeText) {
            await global.navigator.clipboard.writeText(shareUrl);
            copied = true;
          }
        } catch (_err) {
          copied = false;
        }
        if (!copied && document.execCommand) {
          try {
            const ta = document.createElement('textarea');
            ta.value = shareUrl;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            copied = document.execCommand('copy');
            document.body.removeChild(ta);
          } catch (_err2) {
            copied = false;
          }
        }
        if (shareStatus) {
          shareStatus.textContent = copied
            ? 'Enllaç copiat! Enganxa’l a Classroom o Moodle.'
            : `Enllaç llest: ${shareUrl}`;
        }
      });
    }

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
      if (savedSession.mode === 'parentesis' || savedSession.mode === 'error') {
        const r = savedSession.reasoning || { index: 0, exercises: [] };
        const modeTitle = savedSession.mode === 'error' ? "Detecta l'error" : 'Col·loca els parèntesis';
        resumeSummary.textContent = `${theme.name} · ${modeTitle} · Repte ${(r.index || 0) + 1} de ${(r.exercises && r.exercises.length) || 6}`;
      } else {
        const chNum = (savedSession.currentChallengeIdx || 0) + 1;
        const totalCh = (savedSession.challenges && savedSession.challenges.length) || 6;
        const trophiesCount = (savedSession.trophies && savedSession.trophies.length) || 0;
        resumeSummary.textContent = `${theme.name} · Repte ${chNum} de ${totalCh} · ${trophiesCount} trofeus aconseguits`;
      }
      resumeBanner.hidden = false;
    }

    syncCustomVisibility();
    syncExCountVisibility();

    return {
      refreshResumeBanner,
      getCurrentConfig,
      applyConfig
    };
  }

  OpComb.SetupView = {
    init
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
