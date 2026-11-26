(function (global) {
  'use strict';

  const OpComb = (global.OpComb = global.OpComb || {});
  const AST = OpComb.AST;
  const Generator = OpComb.Generator;
  const Continuum = OpComb.Continuum;

  const STORAGE_KEY = 'opcomb_v1_session';

  function getActiveAxesForConfig(config) {
    const set = new Set(['jerarquia', 'sum_rest']);
    if (config.course === '6e') {
      set.add('parentesis');
      set.add('potencies');
      set.add('arrels');
      set.add('mult_div');
    } else if (config.course === '5e') {
      set.add('parentesis');
      set.add('potencies');
      set.add('mult_div');
      if (config.customOps && config.customOps.arrels) set.add('arrels');
    } else {
      const ops = config.customOps || {};
      if (ops.parentesis) set.add('parentesis');
      if (ops.potencies) set.add('potencies');
      if (ops.arrels) set.add('arrels');
      if (ops.mult_div) set.add('mult_div');
    }
    return set;
  }

  function hasMissingIds(node) {
    if (!node || typeof node !== 'object') return false;
    if (!node.id) return true;
    if (node.type === 'bin') return hasMissingIds(node.left) || hasMissingIds(node.right);
    if (node.type === 'pow') return hasMissingIds(node.base);
    if (node.type === 'sqrt') return hasMissingIds(node.arg);
    if (node.type === 'paren') return hasMissingIds(node.inner);
    return false;
  }

  function ensureIds(ast) {
    if (!ast) return ast;
    return hasMissingIds(ast) ? AST.assignIds(ast) : AST.clone(ast);
  }

  function createExerciseState(rawAst) {
    const ast = ensureIds(rawAst);
    return {
      initialAst: ast,
      currentAst: AST.clone(ast),
      initialExpr: AST.toPlainString(ast),
      steps: [],
      selectedNodeId: null,
      hadErrorInCurrentStep: false,
      hierarchyScoredThisStep: false,
      hadAnyHint: false
    };
  }

  function createSession(config) {
    const normalizedConfig = {
      course: config.course || '6e',
      themeId: config.themeId || 'cosmos',
      exercisesPerChallenge: Number(config.exercisesPerChallenge) || 3,
      customOps: Object.assign(
        {
          parentesis: true,
          potencies: true,
          arrels: config.course === '6e',
          mult_div: true
        },
        config.customOps || {}
      )
    };

    const challenges = Generator.getChallengesForConfig(normalizedConfig);
    const activeAxes = getActiveAxesForConfig(normalizedConfig);
    const seen = [];
    const seenSet = new Set();
    const firstAst = Generator.generateExercise(challenges[0], seenSet);
    seen.push(...seenSet);

    return {
      version: 1,
      view: 'game',
      config: normalizedConfig,
      challenges,
      currentChallengeIdx: 0,
      currentExerciseIdx: 0,
      seenExpressions: seen,
      currentExercise: createExerciseState(firstAst),
      trophies: [],
      completedExercises: [],
      errorLog: [],
      continuum: Continuum.createInitial(activeAxes),
      reflection: {
        confidence: null,
        note: ''
      },
      targeted: null
    };
  }

  function startTargetedTraining(session, axis) {
    const exercises = Generator.generateTargetedExercises(axis, session.config, 3);
    const firstAst = exercises[0];
    session.view = 'game';
    session.targeted = {
      active: true,
      axis,
      exercises,
      index: 0
    };
    session.currentExercise = createExerciseState(firstAst);
    saveSession(session);
    return session;
  }

  function advanceAfterExerciseComplete(session) {
    const ex = session.currentExercise;
    const isTargeted = Boolean(session.targeted && session.targeted.active);
    const ch = isTargeted
      ? { title: 'Entrenament Dirigit' }
      : session.challenges[session.currentChallengeIdx];

    session.completedExercises.push({
      challengeTitle: ch ? ch.title : 'Repte',
      initialExpr: ex.initialExpr,
      finalValue: AST.evaluate(ex.currentAst),
      steps: ex.steps.slice(),
      hadAnyHint: ex.hadAnyHint,
      targeted: isTargeted
    });

    if (isTargeted) {
      const nextIdx = session.targeted.index + 1;
      if (nextIdx >= session.targeted.exercises.length) {
        session.targeted = null;
        session.view = 'report';
        saveSession(session);
        return { event: 'targeted_done' };
      }
      session.targeted.index = nextIdx;
      const nextAst = session.targeted.exercises[nextIdx];
      session.currentExercise = createExerciseState(nextAst);
      saveSession(session);
      return { event: 'next_exercise' };
    }

    const nextExIdx = session.currentExerciseIdx + 1;
    if (nextExIdx < session.config.exercisesPerChallenge) {
      session.currentExerciseIdx = nextExIdx;
      const seenSet = new Set(session.seenExpressions || []);
      const nextAst = Generator.generateExercise(session.challenges[session.currentChallengeIdx], seenSet);
      session.seenExpressions = Array.from(seenSet);
      session.currentExercise = createExerciseState(nextAst);
      saveSession(session);
      return { event: 'next_exercise' };
    }

    // Repte completat -> atorguem trofeu!
    const earnedIdx = session.currentChallengeIdx;
    if (!session.trophies.includes(earnedIdx)) {
      session.trophies.push(earnedIdx);
    }

    const nextChIdx = session.currentChallengeIdx + 1;
    if (nextChIdx >= session.challenges.length) {
      session.view = 'report';
      saveSession(session);
      return { event: 'session_done', trophyIdx: earnedIdx };
    }

    session.currentChallengeIdx = nextChIdx;
    session.currentExerciseIdx = 0;
    const seenSet = new Set(session.seenExpressions || []);
    const nextAst = Generator.generateExercise(session.challenges[nextChIdx], seenSet);
    session.seenExpressions = Array.from(seenSet);
    session.currentExercise = createExerciseState(nextAst);
    saveSession(session);
    return { event: 'challenge_done', trophyIdx: earnedIdx };
  }

  function saveSession(session) {
    try {
      if (global.localStorage) {
        global.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      }
    } catch (_err) {
      // Ignora errors de quota o mode privat
    }
  }

  function loadSession() {
    try {
      if (!global.localStorage) return null;
      const raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1 || !parsed.currentExercise) return null;
      if (parsed.currentExercise.initialAst && hasMissingIds(parsed.currentExercise.initialAst)) {
        parsed.currentExercise.initialAst = AST.assignIds(parsed.currentExercise.initialAst);
      }
      if (parsed.currentExercise.currentAst && hasMissingIds(parsed.currentExercise.currentAst)) {
        parsed.currentExercise.currentAst = AST.assignIds(parsed.currentExercise.currentAst);
        parsed.currentExercise.selectedNodeId = null;
      }
      if (parsed.currentExercise.hierarchyScoredThisStep === undefined) {
        parsed.currentExercise.hierarchyScoredThisStep = false;
      }
      return parsed;
    } catch (_err) {
      return null;
    }
  }

  function clearSavedSession() {
    try {
      if (global.localStorage) {
        global.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (_err) {
      // Ignora
    }
  }

  OpComb.Session = {
    STORAGE_KEY,
    getActiveAxesForConfig,
    createSession,
    startTargetedTraining,
    advanceAfterExerciseComplete,
    saveSession,
    loadSession,
    clearSavedSession
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
