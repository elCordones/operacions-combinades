(function (global) {
  'use strict';

  const OpComb = (global.OpComb = global.OpComb || {});
  const Session = OpComb.Session;
  const Sound = OpComb.Sound;
  const SetupView = OpComb.SetupView;
  const GameView = OpComb.GameView;
  const ReportView = OpComb.ReportView;

  function installDialogClosedByFallback() {
    if ('closedBy' in HTMLDialogElement.prototype) return;
    const outside = (e, dialog) => {
      const r = dialog.getBoundingClientRect();
      return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    };
    for (const dialog of document.querySelectorAll('dialog[closedby="any"]')) {
      let pressedOutside = false;
      dialog.addEventListener('pointerdown', (e) => {
        pressedOutside = outside(e, dialog);
      });
      dialog.addEventListener('pointerup', (e) => {
        if (pressedOutside && outside(e, dialog)) dialog.close();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    installDialogClosedByFallback();

    const viewSetup = document.getElementById('view-setup');
    const viewGame = document.getElementById('view-game');
    const viewReport = document.getElementById('view-report');
    const btnGoSetup = document.getElementById('btn-go-setup');
    const btnOpenGuide = document.getElementById('btn-open-guide');
    const guideDialog = document.getElementById('guide-dialog');
    const btnToggleSound = document.getElementById('btn-toggle-sound');
    const soundIcon = document.getElementById('sound-icon');
    const soundLabel = document.getElementById('sound-label');

    const btnMobileCont = document.getElementById('btn-mobile-continuum');
    const drawer = document.getElementById('continuum-drawer');
    const colorModeBtns = document.querySelectorAll('.color-mode-btn[data-color-mode]');
    const COLOR_MODE_KEY = 'opcomb_v1_color_mode';
    const VALID_COLOR_MODES = new Set(['light', 'dark', 'system']);

    const SVG_SOUND_ON =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>' +
      '<path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>' +
      '<path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>' +
      '</svg>';

    const SVG_SOUND_OFF =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>' +
      '<line x1="22" y1="9" x2="16" y2="15"/>' +
      '<line x1="16" y1="9" x2="22" y2="15"/>' +
      '</svg>';

    let activeSession = null;

    function syncSoundButton() {
      const muted = Sound.isMuted();
      btnToggleSound.setAttribute('aria-pressed', muted ? 'true' : 'false');
      soundIcon.innerHTML = muted ? SVG_SOUND_OFF : SVG_SOUND_ON;
      soundLabel.textContent = muted ? 'So silenciat' : 'So activat';
    }

    function applyColorMode(mode, persist) {
      const safeMode = VALID_COLOR_MODES.has(mode) ? mode : 'system';
      document.documentElement.dataset.colorMode = safeMode;
      colorModeBtns.forEach((btn) => {
        btn.setAttribute('aria-pressed', btn.dataset.colorMode === safeMode ? 'true' : 'false');
      });
      if (persist) {
        try {
          if (global.localStorage) {
            global.localStorage.setItem(COLOR_MODE_KEY, safeMode);
          }
        } catch (_e) {
          // Ignora errors de quota o mode privat
        }
      }
    }

    function applyViewSwitch(viewName) {
      viewSetup.hidden = viewName !== 'setup';
      viewGame.hidden = viewName !== 'game';
      viewReport.hidden = viewName !== 'report';
      btnGoSetup.hidden = viewName === 'setup';
      if (drawer && drawer.open) drawer.close();
    }

    function getHeadingForView(viewName) {
      if (viewName === 'game') return document.getElementById('game-challenge-title');
      if (viewName === 'report') return document.getElementById('report-heading');
      return document.getElementById('setup-heading');
    }

    function navigateTo(viewName) {
      if (!document.startViewTransition || document.hidden) {
        applyViewSwitch(viewName);
        getHeadingForView(viewName)?.focus();
        return;
      }
      const transition = document.startViewTransition(() => {
        applyViewSwitch(viewName);
      });
      transition.ready.catch(() => {});
      transition.finished
        .catch(() => {})
        .finally(() => {
          getHeadingForView(viewName)?.focus();
        });
    }

    const gameView = GameView.init({
      onGoReport: () => {
        reportView.render(activeSession);
        navigateTo('report');
      }
    });

    const reportView = ReportView.init({
      onStartTargeted: (axis) => {
        if (!activeSession) return;
        Session.startTargetedTraining(activeSession, axis);
        gameView.render(activeSession);
        navigateTo('game');
      },
      onNewSession: () => {
        Session.clearSavedSession();
        activeSession = null;
        setupView.refreshResumeBanner(null);
        navigateTo('setup');
      }
    });

    const setupView = SetupView.init({
      onStart: (config) => {
        activeSession = Session.createSession(config);
        Session.saveSession(activeSession);
        gameView.render(activeSession);
        navigateTo('game');
      },
      onResume: () => {
        const saved = Session.loadSession();
        if (!saved) return;
        activeSession = saved;
        if (activeSession.view === 'report') {
          reportView.render(activeSession);
          navigateTo('report');
        } else {
          gameView.render(activeSession);
          navigateTo('game');
        }
      },
      onDiscard: () => {
        Session.clearSavedSession();
      }
    });

    btnGoSetup.addEventListener('click', () => {
      setupView.refreshResumeBanner(Session.loadSession());
      navigateTo('setup');
    });

    btnOpenGuide.addEventListener('click', () => {
      guideDialog.showModal();
    });

    btnToggleSound.addEventListener('click', () => {
      Sound.toggleMute();
      syncSoundButton();
    });

    btnMobileCont.addEventListener('click', () => {
      if (drawer && !drawer.open) {
        drawer.showModal();
      }
    });

    colorModeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        applyColorMode(btn.dataset.colorMode, true);
      });
    });

    let initialColorMode = document.documentElement.dataset.colorMode;
    try {
      const storedMode = global.localStorage && global.localStorage.getItem(COLOR_MODE_KEY);
      if (VALID_COLOR_MODES.has(storedMode)) initialColorMode = storedMode;
    } catch (_e) {
      // Ignora
    }

    applyColorMode(initialColorMode, false);
    syncSoundButton();
    setupView.refreshResumeBanner(Session.loadSession());
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
