(function (global) {
  'use strict';

  const OpComb = (global.OpComb = global.OpComb || {});
  const Reasoning = OpComb.Reasoning;
  const Themes = OpComb.Themes;
  const Continuum = OpComb.Continuum;
  const ContinuumView = OpComb.ContinuumView;
  const Session = OpComb.Session;
  const Sound = OpComb.Sound;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function init(callbacks) {
    const themePill = document.getElementById('reasoning-theme-pill');
    const progressPill = document.getElementById('reasoning-progress-pill');
    const modePill = document.getElementById('reasoning-mode-pill');
    const titleEl = document.getElementById('reasoning-title');
    const subtitleEl = document.getElementById('reasoning-subtitle');
    const dotsEl = document.getElementById('reasoning-dots');
    const btnMobileCont = document.getElementById('btn-reasoning-mobile-continuum');
    const btnFinishEarly = document.getElementById('btn-reasoning-finish');

    const parenPanel = document.getElementById('reasoning-paren-panel');
    const parenExprEl = document.getElementById('reasoning-paren-expr');
    const btnParenCheck = document.getElementById('btn-paren-check');
    const btnParenClear = document.getElementById('btn-paren-clear');

    const errorPanel = document.getElementById('reasoning-error-panel');
    const errorInitialEl = document.getElementById('reasoning-error-initial');
    const errorStepsEl = document.getElementById('reasoning-error-steps');
    const errorOptionsWrap = document.getElementById('reasoning-error-options-wrap');
    const errorOptionsEl = document.getElementById('reasoning-error-options');
    const correctedBox = document.getElementById('reasoning-corrected-box');
    const correctedStepsEl = document.getElementById('reasoning-corrected-steps');

    const feedbackBox = document.getElementById('reasoning-feedback');
    const feedbackIcon = document.getElementById('reasoning-feedback-icon');
    const feedbackTitle = document.getElementById('reasoning-feedback-title');
    const feedbackMsg = document.getElementById('reasoning-feedback-message');

    const doneBar = document.getElementById('reasoning-done-bar');
    const doneMsg = document.getElementById('reasoning-done-message');
    const btnNext = document.getElementById('btn-reasoning-next');

    let currentSession = null;

    function showFeedback(kind, title, message) {
      feedbackBox.hidden = false;
      feedbackBox.className =
        'feedback-box ' + (kind === 'success' ? 'is-success' : kind === 'hint' ? 'is-hint' : 'is-guide');
      feedbackIcon.textContent = kind === 'success' ? '✅' : kind === 'hint' ? '💡' : '🧠';
      feedbackTitle.textContent = title;
      feedbackMsg.textContent = message;
    }

    function hideFeedback() {
      feedbackBox.hidden = true;
    }

    function renderDots(r) {
      const total = r.exercises.length;
      const dots = [];
      for (let i = 0; i < total; i++) {
        const cls = i < r.index ? 'is-done' : i === r.index ? 'is-current' : '';
        dots.push(`<span class="ex-dot ${cls}" aria-hidden="true"></span>`);
      }
      dotsEl.innerHTML = `<span>Repte ${r.index + 1} de ${total}</span>` + dots.join('');
    }

    function renderParenMode(session, puzzle, r) {
      parenPanel.hidden = false;
      errorPanel.hidden = true;

      const hasBoth = r.startTermIdx !== null && r.endTermIdx !== null && r.startTermIdx < r.endTermIdx;
      const hasStartOnly = r.startTermIdx !== null && r.endTermIdx === null;

      const htmlParts = [];
      for (let i = 0; i < puzzle.terms.length; i++) {
        if (hasBoth && i === r.startTermIdx) {
          htmlParts.push('<span class="paren-token is-open" aria-hidden="true">(</span>');
        } else if (hasStartOnly && i === r.startTermIdx) {
          htmlParts.push('<span class="paren-token is-pending" aria-hidden="true">(</span>');
        }

        const isInside = hasBoth && i >= r.startTermIdx && i <= r.endTermIdx;
        const isStart = r.startTermIdx === i;
        const cls = [
          'term-btn',
          isInside ? 'is-grouped' : '',
          isStart ? 'is-start-term' : ''
        ]
          .filter(Boolean)
          .join(' ');

        htmlParts.push(
          `<button type="button" class="${cls}" data-term-idx="${i}"${r.completedCurrent ? ' disabled' : ''}>` +
            escapeHtml(puzzle.terms[i].label) +
          '</button>'
        );

        if (hasBoth && i === r.endTermIdx) {
          htmlParts.push('<span class="paren-token is-close" aria-hidden="true">)</span>');
        }

        if (i < puzzle.ops.length) {
          const sym = Reasoning.OP_SYMBOLS[puzzle.ops[i]] || puzzle.ops[i];
          htmlParts.push(`<span class="expr-sym">${sym}</span>`);
        }
      }

      htmlParts.push(`<span class="target-equals">= <strong>${puzzle.target}</strong></span>`);
      parenExprEl.innerHTML = htmlParts.join('');

      btnParenCheck.disabled = !hasBoth || r.completedCurrent;
      btnParenClear.disabled = (r.startTermIdx === null && r.endTermIdx === null) || r.completedCurrent;
    }

    function renderErrorMode(session, puzzle, r) {
      parenPanel.hidden = true;
      errorPanel.hidden = false;

      errorInitialEl.textContent = puzzle.initialExpr;

      errorStepsEl.innerHTML = puzzle.buggySteps
        .map((st, idx) => {
          const isBugSolved = r.bugFound && idx === puzzle.bugStepIdx;
          const cls = 'err-step-btn' + (isBugSolved ? ' is-bug-found' : '');
          const dis = r.bugFound ? ' disabled' : '';
          return (
            `<button type="button" class="${cls}" data-step-idx="${idx}"${dis}>` +
              `<span class="err-step-expr">= ${escapeHtml(st.expr)}</span>` +
              `<span class="cascade-line-note">${escapeHtml(st.note)}</span>` +
            '</button>'
          );
        })
        .join('');

      if (r.bugFound && !r.completedCurrent) {
        errorOptionsWrap.hidden = false;
        errorOptionsEl.innerHTML = puzzle.options
          .map(
            (opt, idx) =>
              `<button type="button" class="reason-choice-btn" data-opt-idx="${idx}">` +
                escapeHtml(opt.text) +
              '</button>'
          )
          .join('');
      } else {
        errorOptionsWrap.hidden = true;
      }

      if (r.completedCurrent) {
        correctedBox.hidden = false;
        correctedStepsEl.innerHTML =
          `<div class="history-step-row"><span>${escapeHtml(puzzle.initialExpr)}</span><span class="cascade-line-note">Expressió original</span></div>` +
          puzzle.correctSteps
            .map(
              (st) =>
                `<div class="history-step-row"><span>= ${escapeHtml(st.expr)}</span><span class="cascade-line-note">${escapeHtml(st.note)}</span></div>`
            )
            .join('');
      } else {
        correctedBox.hidden = true;
      }
    }

    function render(session, pulsedAxes) {
      currentSession = session;
      const r = session.reasoning;
      const theme = Themes.getTheme(session.config.themeId);
      const puzzle = r.exercises[r.index];
      const isErrorMode = session.mode === 'error';

      document.documentElement.dataset.theme = theme.id;
      themePill.textContent = theme.name;
      progressPill.textContent = `Repte ${r.index + 1} de ${r.exercises.length}`;
      modePill.textContent = isErrorMode ? "🔍 Detecta l'error" : '( ) Col·loca els parèntesis';

      if (isErrorMode) {
        titleEl.textContent = "Troba l'error de jerarquia o càlcul";
        subtitleEl.textContent = r.bugFound
          ? 'Pas 2: Tria quina explicació descriu l’error d’aquesta línia.'
          : 'Pas 1: Clica sobre la línia on s’ha comès l’error.';
      } else {
        titleEl.textContent = 'Col·loca els parèntesis al lloc exacte';
        subtitleEl.textContent =
          'Clica el primer nombre on vols obrir «(» i l’últim on vols tancar «)» per obtenir el resultat.';
      }

      renderDots(r);

      if (isErrorMode) {
        renderErrorMode(session, puzzle, r);
      } else {
        renderParenMode(session, puzzle, r);
      }

      if (r.completedCurrent) {
        doneBar.hidden = false;
        const isLast = r.index + 1 >= r.exercises.length;
        doneMsg.textContent = isLast
          ? 'Has completat tota la sèrie de raonament!'
          : 'Molt ben raonat! Repte superat.';
        btnNext.textContent = isLast ? 'Veure informe formatiu →' : 'Següent repte →';
      } else {
        doneBar.hidden = true;
      }

      ContinuumView.renderAll(session.continuum, pulsedAxes);
    }

    // Interacció Mode 1: Col·loca els parèntesis
    parenExprEl.addEventListener('click', (e) => {
      if (!currentSession || currentSession.mode !== 'parentesis') return;
      const r = currentSession.reasoning;
      if (r.completedCurrent) return;
      const btn = e.target.closest('button.term-btn[data-term-idx]');
      if (!btn) return;
      const idx = Number(btn.dataset.termIdx);
      const puzzle = r.exercises[r.index];

      if (r.startTermIdx === null || r.endTermIdx !== null) {
        r.startTermIdx = idx;
        r.endTermIdx = null;
        showFeedback('guide', 'Inici seleccionat «(»', 'Ara clica el nombre on vols tancar els parèntesis «)».');
      } else if (idx === r.startTermIdx) {
        r.startTermIdx = null;
        r.endTermIdx = null;
        hideFeedback();
      } else {
        const s = Math.min(r.startTermIdx, idx);
        const end = Math.max(r.startTermIdx, idx);
        if (s === 0 && end === puzzle.terms.length - 1) {
          showFeedback(
            'hint',
            'Agrupa només una part',
            'Els parèntesis han d’embolcallar una operació parcial, no tota l’expressió sencera.'
          );
          r.startTermIdx = null;
          r.endTermIdx = null;
        } else {
          r.startTermIdx = s;
          r.endTermIdx = end;
          hideFeedback();
        }
      }
      Session.saveSession(currentSession);
      render(currentSession);
    });

    btnParenClear.addEventListener('click', () => {
      if (!currentSession || currentSession.mode !== 'parentesis') return;
      const r = currentSession.reasoning;
      if (r.completedCurrent) return;
      r.startTermIdx = null;
      r.endTermIdx = null;
      hideFeedback();
      Session.saveSession(currentSession);
      render(currentSession);
    });

    btnParenCheck.addEventListener('click', () => {
      if (!currentSession || currentSession.mode !== 'parentesis') return;
      const r = currentSession.reasoning;
      const puzzle = r.exercises[r.index];
      if (r.completedCurrent || r.startTermIdx === null || r.endTermIdx === null) return;

      const got = Reasoning.evaluateFlatWithParens(puzzle.terms, puzzle.ops, r.startTermIdx, r.endTermIdx);
      const placedExpr = Reasoning.formatFlatExpr(puzzle.terms, puzzle.ops, r.startTermIdx, r.endTermIdx);

      if (got === puzzle.target) {
        r.completedCurrent = true;
        Continuum.recordAttempt(currentSession.continuum, 'parentesis', true);
        Continuum.recordAttempt(currentSession.continuum, 'jerarquia', true);
        currentSession.completedExercises.push({
          challengeTitle: 'Col·loca els parèntesis',
          initialExpr: puzzle.exprPlain,
          finalValue: puzzle.target,
          steps: [
            {
              expr: puzzle.exprPlain,
              opText: `Objectiu = ${puzzle.target}`,
              result: placedExpr,
              hadHint: r.hadHintCurrent
            }
          ],
          hadAnyHint: r.hadHintCurrent,
          targeted: false
        });
        Sound.playStepOk();
        showFeedback('success', 'Exacte!', `${placedExpr} = ${puzzle.target}.`);
        Session.saveSession(currentSession);
        render(currentSession, ['parentesis', 'jerarquia']);
        btnNext.focus();
      } else {
        r.hadHintCurrent = true;
        Continuum.recordAttempt(currentSession.continuum, 'parentesis', false);
        currentSession.errorLog.push({
          code: 'paren_first',
          kind: 'jerarquia',
          axis: 'parentesis',
          expr: puzzle.exprPlain,
          detail: `${placedExpr} = ${Number.isInteger(got) ? got : 'no exacte'} (objectiu ${puzzle.target})`
        });
        Sound.playHint();
        Session.saveSession(currentSession);
        ContinuumView.renderAll(currentSession.continuum, ['parentesis']);
        if (Number.isInteger(got)) {
          showFeedback(
            'hint',
            `Aquesta col·locació dona ${got}`,
            `${placedExpr} = ${got}, però busquem ${puzzle.target}. Prova d’agrupar uns altres nombres!`
          );
        } else {
          showFeedback(
            'hint',
            'Aquesta agrupació no encaixa',
            `${placedExpr} no dona un nombre natural exacte de Primària. Prova una altra parella!`
          );
        }
      }
    });

    // Interacció Mode 2: Detecta l'error
    errorStepsEl.addEventListener('click', (e) => {
      if (!currentSession || currentSession.mode !== 'error') return;
      const r = currentSession.reasoning;
      if (r.bugFound || r.completedCurrent) return;
      const btn = e.target.closest('button.err-step-btn[data-step-idx]');
      if (!btn) return;
      const idx = Number(btn.dataset.stepIdx);
      const puzzle = r.exercises[r.index];

      if (idx === puzzle.bugStepIdx) {
        r.bugFound = true;
        Sound.playStepOk();
        showFeedback('guide', 'Has trobat la línia errònia!', 'Ara tria quina explicació justifica per què aquest pas és incorrecte.');
        Session.saveSession(currentSession);
        render(currentSession);
      } else {
        r.hadHintCurrent = true;
        btn.classList.remove('is-error-shake');
        void btn.offsetWidth;
        btn.classList.add('is-error-shake');
        Sound.playHint();
        Session.saveSession(currentSession);
        showFeedback(
          'hint',
          'Aquest pas és correcte!',
          `El càlcul (${puzzle.buggySteps[idx].note}) està ben fet. Revisa les altres línies!`
        );
      }
    });

    errorOptionsEl.addEventListener('click', (e) => {
      if (!currentSession || currentSession.mode !== 'error') return;
      const r = currentSession.reasoning;
      if (!r.bugFound || r.completedCurrent) return;
      const btn = e.target.closest('button.reason-choice-btn[data-opt-idx]');
      if (!btn) return;
      const optIdx = Number(btn.dataset.optIdx);
      const puzzle = r.exercises[r.index];
      const opt = puzzle.options[optIdx];
      if (!opt) return;

      if (opt.isCorrect) {
        r.completedCurrent = true;
        const pulsed = ['jerarquia'];
        Continuum.recordAttempt(currentSession.continuum, 'jerarquia', true);
        if (puzzle.axis && puzzle.axis !== 'jerarquia') {
          Continuum.recordAttempt(currentSession.continuum, puzzle.axis, true);
          pulsed.push(puzzle.axis);
        }
        currentSession.completedExercises.push({
          challengeTitle: "Detecta l'error",
          initialExpr: puzzle.initialExpr,
          finalValue: puzzle.correctFinal,
          steps: puzzle.correctSteps.map((st, sIdx) => ({
            expr: sIdx === 0 ? puzzle.initialExpr : puzzle.correctSteps[sIdx - 1].expr,
            opText: st.note,
            result: puzzle.correctFinal,
            hadHint: r.hadHintCurrent
          })),
          hadAnyHint: r.hadHintCurrent,
          targeted: false
        });
        Sound.playStepOk();
        showFeedback('success', 'Diagnòstic perfecte!', puzzle.explanation);
        Session.saveSession(currentSession);
        render(currentSession, pulsed);
        btnNext.focus();
      } else {
        r.hadHintCurrent = true;
        btn.classList.remove('is-error-shake');
        void btn.offsetWidth;
        btn.classList.add('is-error-shake');
        const targetAxis = puzzle.axis || 'jerarquia';
        Continuum.recordAttempt(currentSession.continuum, targetAxis, false);
        currentSession.errorLog.push({
          code: 'hierarchy_general',
          kind: 'jerarquia',
          axis: targetAxis,
          expr: puzzle.initialExpr,
          detail: 'Explicació errònia al mode Detecta l’error'
        });
        Sound.playHint();
        Session.saveSession(currentSession);
        ContinuumView.renderAll(currentSession.continuum, [targetAxis]);
        showFeedback('hint', 'Revisa aquesta explicació', 'Torna a llegir què s’ha operat en aquella línia i comprova la piràmide.');
      }
    });

    btnNext.addEventListener('click', () => {
      if (!currentSession || !currentSession.reasoning) return;
      const r = currentSession.reasoning;
      hideFeedback();
      if (r.index + 1 >= r.exercises.length) {
        currentSession.view = 'report';
        Session.saveSession(currentSession);
        callbacks.onGoReport();
        return;
      }
      r.index += 1;
      r.completedCurrent = false;
      r.hadHintCurrent = false;
      r.startTermIdx = null;
      r.endTermIdx = null;
      r.bugFound = false;
      Session.saveSession(currentSession);
      render(currentSession);
    });

    btnFinishEarly.addEventListener('click', () => {
      if (!currentSession) return;
      currentSession.view = 'report';
      Session.saveSession(currentSession);
      callbacks.onGoReport();
    });

    if (btnMobileCont) {
      btnMobileCont.addEventListener('click', () => {
        if (callbacks.onOpenMobileContinuum) callbacks.onOpenMobileContinuum();
      });
    }

    return {
      render
    };
  }

  OpComb.ReasoningView = {
    init
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
