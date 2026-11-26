(function (global) {
  'use strict';

  const OpComb = (global.OpComb = global.OpComb || {});
  const AST = OpComb.AST;
  const Hints = OpComb.Hints;
  const Themes = OpComb.Themes;
  const Continuum = OpComb.Continuum;
  const ContinuumView = OpComb.ContinuumView;
  const Session = OpComb.Session;
  const Sound = OpComb.Sound;

  function init(callbacks) {
    const themePill = document.getElementById('game-theme-pill');
    const progressPill = document.getElementById('game-progress-pill');
    const targetedPill = document.getElementById('game-targeted-pill');
    const challengeTitle = document.getElementById('game-challenge-title');
    const challengeFocus = document.getElementById('game-challenge-focus');
    const trophyStrip = document.getElementById('trophy-strip');
    const exerciseDots = document.getElementById('exercise-dots');
    const stepBadge = document.getElementById('step-instruction-badge');
    const cascadeHistory = document.getElementById('cascade-history');
    const activeExprWrap = document.querySelector('.active-expression-wrap');
    const activeEqPrefix = document.getElementById('active-eq-prefix');
    const activeExprEl = document.getElementById('active-expression');
    const notebookHelper = document.getElementById('notebook-helper');
    const calcForm = document.getElementById('calc-step-form');
    const calcLabel = document.getElementById('calc-prompt-label');
    const calcInput = document.getElementById('calc-answer-input');
    const btnCancelSel = document.getElementById('btn-cancel-selection');
    const feedbackBox = document.getElementById('game-feedback');
    const feedbackIcon = document.getElementById('feedback-icon');
    const feedbackTitle = document.getElementById('feedback-title');
    const feedbackMessage = document.getElementById('feedback-message');
    const doneBar = document.getElementById('exercise-done-bar');
    const doneMessage = document.getElementById('done-message');
    const btnNextExercise = document.getElementById('btn-next-exercise');
    const btnFinishEarly = document.getElementById('btn-finish-early');

    const trophyDialog = document.getElementById('trophy-dialog');
    const trophyModalArt = document.getElementById('trophy-modal-art');
    const trophyModalTitle = document.getElementById('trophy-modal-title');
    const trophyModalDesc = document.getElementById('trophy-modal-desc');

    let currentSession = null;

    function showFeedback(kind, title, message) {
      feedbackBox.hidden = false;
      feedbackBox.className = 'feedback-box ' + (kind === 'success' ? 'is-success' : 'is-hint');
      feedbackIcon.textContent = kind === 'success' ? '✅' : '💡';
      feedbackTitle.textContent = title;
      feedbackMessage.textContent = message;
    }

    function hideFeedback() {
      feedbackBox.hidden = true;
    }

    function renderTrophyStrip(session, theme) {
      trophyStrip.innerHTML = session.challenges
        .map((ch, idx) => {
          const trophy = theme.trophies[idx] || theme.trophies[theme.trophies.length - 1];
          const earned = session.trophies.includes(idx);
          return (
            `<div class="trophy-mini ${earned ? 'is-earned' : 'is-locked'}" title="${trophy.name}: ${trophy.desc}">` +
              `<span class="trophy-mini-svg">${trophy.svg}</span>` +
              `<span>${earned ? trophy.name : `Repte ${idx + 1}`}</span>` +
            '</div>'
          );
        })
        .join('');
    }

    function renderExerciseDots(session) {
      const isTargeted = Boolean(session.targeted && session.targeted.active);
      const total = isTargeted ? session.targeted.exercises.length : session.config.exercisesPerChallenge;
      const current = isTargeted ? session.targeted.index : session.currentExerciseIdx;
      const dots = [];
      for (let i = 0; i < total; i++) {
        const cls = i < current ? 'is-done' : i === current ? 'is-current' : '';
        dots.push(`<span class="ex-dot ${cls}" aria-hidden="true"></span>`);
      }
      exerciseDots.innerHTML =
        `<span>Exercici ${current + 1} de ${total}</span>` + dots.join('');
    }

    function render(session, pulsedAxes) {
      currentSession = session;
      const theme = Themes.getTheme(session.config.themeId);
      const isTargeted = Boolean(session.targeted && session.targeted.active);
      const ch = session.challenges[session.currentChallengeIdx];
      const ex = session.currentExercise;

      document.documentElement.dataset.theme = theme.id;
      themePill.textContent = theme.name;

      if (isTargeted) {
        targetedPill.hidden = false;
        progressPill.textContent = `Pràctica ${session.targeted.index + 1} de ${session.targeted.exercises.length}`;
        const axisMeta = Continuum.AXES_META.find((a) => a.id === session.targeted.axis);
        challengeTitle.textContent = 'Entrenament Dirigit';
        challengeFocus.textContent = axisMeta
          ? `Focus en ${axisMeta.label}: ${axisMeta.desc}`
          : 'Reforç personalitzat';
      } else {
        targetedPill.hidden = true;
        progressPill.textContent = `Repte ${session.currentChallengeIdx + 1} de ${session.challenges.length}`;
        challengeTitle.textContent = ch.title;
        challengeFocus.textContent = ch.focus;
      }

      renderTrophyStrip(session, theme);
      renderExerciseDots(session);

      // Historial de passos en cascada de l'exercici actual
      if (ex.steps.length === 0) {
        cascadeHistory.innerHTML = '';
      } else {
        cascadeHistory.innerHTML = ex.steps
          .map(
            (s, i) =>
              '<div class="cascade-line">' +
                `<span class="eq-prefix" aria-hidden="true">${i === 0 ? '' : '='}</span>` +
                `<span>${s.expr}</span>` +
                `<span class="cascade-line-note">${s.opText} = ${s.result}</span>` +
              '</div>'
          )
          .join('');
      }

      const isDone = ex.currentAst.type === 'num';
      if (activeEqPrefix) activeEqPrefix.hidden = ex.steps.length === 0;
      if (activeExprWrap) activeExprWrap.classList.toggle('is-done', isDone);
      if (notebookHelper) notebookHelper.hidden = !(ex.steps.length === 0 && !ex.selectedNodeId && !isDone);
      activeExprEl.innerHTML = AST.renderHtml(ex.currentAst, ex.selectedNodeId, isDone);

      if (isDone) {
        stepBadge.textContent = 'Exercici resolt!';
        calcForm.hidden = true;
        doneBar.hidden = false;
        const isLastTargeted = isTargeted && session.targeted.index + 1 >= session.targeted.exercises.length;
        const isLastOfChallenge = !isTargeted && session.currentExerciseIdx + 1 >= session.config.exercisesPerChallenge;
        const isLastOfAll = isLastOfChallenge && session.currentChallengeIdx + 1 >= session.challenges.length;

        if (isLastTargeted || isLastOfAll) {
          doneMessage.textContent = `Resultat final: ${AST.evaluate(ex.currentAst)}. Has completat tots els reptes!`;
          btnNextExercise.textContent = 'Veure informe formatiu →';
        } else if (isLastOfChallenge) {
          doneMessage.textContent = `Resultat final: ${AST.evaluate(ex.currentAst)}. Repte completat!`;
          btnNextExercise.textContent = 'Recull el teu trofeu →';
        } else {
          doneMessage.textContent = `Molt bé! Resultat final: ${AST.evaluate(ex.currentAst)}.`;
          btnNextExercise.textContent = 'Següent exercici →';
        }
        btnNextExercise.focus();
      } else if (ex.selectedNodeId) {
        const { byId } = AST.getOperationInfo(ex.currentAst);
        const selInfo = byId.get(ex.selectedNodeId);
        stepBadge.textContent = 'Pas 2: Calcula el bloc seleccionat';
        calcForm.hidden = false;
        doneBar.hidden = true;
        calcLabel.textContent = selInfo
          ? `Quant fa ${AST.formatSubexpression(selInfo.node)} ?`
          : 'Calcula el resultat:';
        calcInput.value = '';
        calcInput.focus();
      } else {
        stepBadge.textContent = 'Pas 1: Clica l’operació prioritària';
        calcForm.hidden = true;
        doneBar.hidden = true;
      }

      ContinuumView.renderAll(session.continuum, pulsedAxes);
    }

    // Micro-pas 1: clicar una operació a l'expressió
    activeExprEl.addEventListener('click', (e) => {
      if (!currentSession) return;
      const btn = e.target.closest('button[data-node-id]');
      if (!btn || btn.disabled) return;

      const ex = currentSession.currentExercise;
      if (ex.currentAst.type === 'num') return;

      const clickedId = btn.dataset.nodeId;
      if (clickedId === ex.selectedNodeId) {
        calcInput.focus();
        return;
      }
      const validIds = AST.getValidNextIds(ex.currentAst);

      if (validIds.has(clickedId)) {
        if (!ex.hierarchyScoredThisStep) {
          Continuum.recordAttempt(currentSession.continuum, 'jerarquia', true);
          ex.hierarchyScoredThisStep = true;
        }
        ex.selectedNodeId = clickedId;
        ex.hadErrorInCurrentStep = false;
        Sound.playStepOk();
        hideFeedback();
        Session.saveSession(currentSession);
        render(currentSession, ['jerarquia']);
      } else {
        ex.hadErrorInCurrentStep = true;
        ex.hadAnyHint = true;
        btn.classList.remove('is-error-shake');
        void btn.offsetWidth;
        btn.classList.add('is-error-shake');
        const diag = Hints.diagnoseHierarchyError(ex.currentAst, clickedId);
        Continuum.recordAttempt(currentSession.continuum, 'jerarquia', false);
        const pulsed = ['jerarquia'];
        if (diag.extraAxis) {
          Continuum.recordAttempt(currentSession.continuum, diag.extraAxis, false);
          pulsed.push(diag.extraAxis);
        }
        currentSession.errorLog.push({
          code: diag.code,
          kind: 'jerarquia',
          axis: diag.axis,
          expr: AST.toPlainString(ex.currentAst),
          detail: diag.title
        });
        Sound.playHint();
        Session.saveSession(currentSession);
        ContinuumView.renderAll(currentSession.continuum, pulsed);
        showFeedback('hint', diag.title, diag.message);
      }
    });

    function cancelSelection() {
      if (!currentSession) return;
      currentSession.currentExercise.selectedNodeId = null;
      hideFeedback();
      Session.saveSession(currentSession);
      render(currentSession);
    }

    btnCancelSel.addEventListener('click', cancelSelection);

    calcInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelSelection();
      }
    });

    // Micro-pas 2: comprovar el càlcul parcial
    calcForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!currentSession) return;
      const ex = currentSession.currentExercise;
      if (!ex.selectedNodeId) return;

      const raw = calcInput.value.trim();
      if (raw === '' || !/^\d+$/.test(raw)) {
        showFeedback('hint', 'Escriu un nombre natural', 'Introdueix el resultat amb xifres (sense espais ni decimals).');
        calcInput.focus();
        return;
      }

      const userVal = Number(raw);
      const { byId } = AST.getOperationInfo(ex.currentAst);
      const opInfo = byId.get(ex.selectedNodeId);
      if (!opInfo) return;

      const expected = opInfo.value;
      if (userVal === expected) {
        const hadParens = AST.hasOperationType(ex.currentAst, 'paren');
        Continuum.recordAttempt(currentSession.continuum, opInfo.axis, true);
        const pulsed = [opInfo.axis];
        if (hadParens && opInfo.parenDepth > 0) {
          Continuum.recordAttempt(currentSession.continuum, 'parentesis', true);
          pulsed.push('parentesis');
        }

        const exprBefore = AST.toPlainString(ex.currentAst);
        const opText = AST.formatSubexpression(opInfo.node);
        ex.steps.push({
          expr: exprBefore,
          opText,
          result: expected,
          hadHint: ex.hadErrorInCurrentStep
        });

        ex.currentAst = AST.replaceNode(ex.currentAst, ex.selectedNodeId, expected);
        ex.selectedNodeId = null;
        ex.hadErrorInCurrentStep = false;
        ex.hierarchyScoredThisStep = false;

        Sound.playStepOk();
        showFeedback('success', 'Pas correcte!', `${opText} = ${expected}.`);
        Session.saveSession(currentSession);
        render(currentSession, pulsed);
      } else {
        ex.hadErrorInCurrentStep = true;
        ex.hadAnyHint = true;
        const diag = Hints.diagnoseCalculationError(opInfo.node, userVal);
        Continuum.recordAttempt(currentSession.continuum, diag.axis, false);
        currentSession.errorLog.push({
          code: diag.code,
          kind: 'calcul',
          axis: diag.axis,
          expr: AST.formatSubexpression(opInfo.node),
          detail: `${userVal} en lloc de ${expected}`
        });
        Sound.playHint();
        Session.saveSession(currentSession);
        ContinuumView.renderAll(currentSession.continuum, [diag.axis]);
        showFeedback('hint', diag.title, diag.message);
        calcInput.select();
        calcInput.focus();
      }
    });

    btnNextExercise.addEventListener('click', () => {
      if (!currentSession) return;
      hideFeedback();
      const outcome = Session.advanceAfterExerciseComplete(currentSession);

      if (outcome.trophyIdx !== undefined) {
        const theme = Themes.getTheme(currentSession.config.themeId);
        const trophy = theme.trophies[outcome.trophyIdx] || theme.trophies[0];
        trophyModalArt.innerHTML = trophy.svg;
        trophyModalTitle.textContent = trophy.name;
        trophyModalDesc.textContent = trophy.desc;
        Sound.playTrophy();

        const onTrophyClosed = () => {
          trophyDialog.removeEventListener('close', onTrophyClosed);
          if (outcome.event === 'session_done') {
            callbacks.onGoReport();
          } else {
            render(currentSession);
            challengeTitle.focus();
          }
        };
        trophyDialog.addEventListener('close', onTrophyClosed);
        trophyDialog.showModal();
        return;
      }

      if (outcome.event === 'targeted_done' || outcome.event === 'session_done') {
        callbacks.onGoReport();
      } else {
        render(currentSession);
      }
    });

    btnFinishEarly.addEventListener('click', () => {
      if (!currentSession) return;
      currentSession.view = 'report';
      Session.saveSession(currentSession);
      callbacks.onGoReport();
    });

    return {
      render
    };
  }

  OpComb.GameView = {
    init
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
