(function (global) {
  'use strict';

  const OpComb = (global.OpComb = global.OpComb || {});
  const AST = OpComb.AST;
  const Generator = OpComb.Generator;
  const Reasoning = OpComb.Reasoning;
  const Continuum = OpComb.Continuum;

  const STORAGE_KEY = 'opcomb_v1_session';
  const VALID_COURSES = new Set(['5e', '6e', 'custom']);
  const VALID_THEMES = new Set(['cosmos', 'lab', 'expedicio', 'codi', 'classic']);
  const VALID_MODES = new Set(['cascada', 'parentesis', 'error']);

  function normalizeConfig(config) {
    const course = VALID_COURSES.has(config && config.course) ? config.course : '6e';
    const themeId = VALID_THEMES.has(config && config.themeId) ? config.themeId : 'cosmos';
    const mode = VALID_MODES.has(config && config.mode) ? config.mode : 'cascada';
    const exNum = Number(config && config.exercisesPerChallenge);
    const exercisesPerChallenge = Number.isInteger(exNum) && exNum >= 1 && exNum <= 10 ? exNum : 3;

    let customOps;
    if (course === '6e') {
      customOps = { mult_div: true, parentesis: true, potencies: true, arrels: true };
    } else if (course === '5e') {
      customOps = {
        mult_div: true,
        parentesis: true,
        potencies: true,
        arrels: Boolean(config && config.customOps && config.customOps.arrels)
      };
    } else {
      customOps = Object.assign(
        { mult_div: true, parentesis: true, potencies: true, arrels: true },
        (config && config.customOps) || {}
      );
    }

    return {
      course,
      themeId,
      mode,
      exercisesPerChallenge,
      customOps
    };
  }

  function parseUrlConfig(searchStr) {
    if (!searchStr || typeof searchStr !== 'string') return null;
    const params = new URLSearchParams(searchStr);
    const hasAny = ['curs', 'tema', 'ex', 'mode', 'ops', 'auto'].some((k) => params.has(k));
    if (!hasAny) return null;

    const rawCourse = params.get('curs');
    const course = VALID_COURSES.has(rawCourse) ? rawCourse : '6e';
    const rawTheme = params.get('tema');
    const themeId = VALID_THEMES.has(rawTheme) ? rawTheme : 'cosmos';
    const rawMode = params.get('mode');
    const mode = VALID_MODES.has(rawMode) ? rawMode : 'cascada';
    const rawEx = Number(params.get('ex'));
    const exercisesPerChallenge = rawEx === 3 || rawEx === 4 || rawEx === 5 ? rawEx : 3;

    let customOps = {
      mult_div: true,
      parentesis: true,
      potencies: true,
      arrels: course === '6e'
    };

    if (params.has('ops')) {
      const tokens = new Set(
        params
          .get('ops')
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
      );
      customOps = {
        mult_div: tokens.has('md'),
        parentesis: tokens.has('par'),
        potencies: tokens.has('pot'),
        arrels: tokens.has('arr')
      };
    }

    const cfg = normalizeConfig({
      course,
      themeId,
      mode,
      exercisesPerChallenge,
      customOps
    });
    cfg.auto = params.get('auto') === '1' || params.get('auto') === 'true';
    return cfg;
  }

  function buildShareUrl(baseHref, config) {
    const cfg = normalizeConfig(config);
    const url = new URL(baseHref);
    url.search = '';
    url.hash = '';
    url.searchParams.set('curs', cfg.course);
    url.searchParams.set('tema', cfg.themeId);
    if (cfg.mode !== 'cascada') {
      url.searchParams.set('mode', cfg.mode);
    } else {
      url.searchParams.set('ex', String(cfg.exercisesPerChallenge));
    }
    if (cfg.course === 'custom') {
      const opsTokens = [];
      if (cfg.customOps.mult_div) opsTokens.push('md');
      if (cfg.customOps.parentesis) opsTokens.push('par');
      if (cfg.customOps.potencies) opsTokens.push('pot');
      if (cfg.customOps.arrels) opsTokens.push('arr');
      url.searchParams.set('ops', opsTokens.join(','));
    }
    return url.toString();
  }

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
    const normalizedConfig = normalizeConfig(config);

    const challenges = Generator.getChallengesForConfig(normalizedConfig);
    const activeAxes = getActiveAxesForConfig(normalizedConfig);
    const seen = [];
    const seenSet = new Set();
    const firstAst = Generator.generateExercise(challenges[0], seenSet);
    seen.push(...seenSet);

    return {
      version: 1,
      view: 'game',
      mode: 'cascada',
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
      targeted: null,
      assemblyCompleted: false,
      assemblyPlaced: [],
      assemblyOrder: null
    };
  }

  function createReasoningSession(config) {
    const normalizedConfig = normalizeConfig(config);
    const mode = normalizedConfig.mode === 'error' ? 'error' : 'parentesis';
    const activeAxes = getActiveAxesForConfig(normalizedConfig);
    if (mode === 'parentesis') activeAxes.add('parentesis');

    const exercises = Reasoning
      ? Reasoning.generateReasoningSeries(mode, normalizedConfig, 6)
      : [];

    return {
      version: 1,
      view: 'reasoning',
      mode,
      config: normalizedConfig,
      challenges: [],
      currentChallengeIdx: 0,
      currentExerciseIdx: 0,
      seenExpressions: [],
      currentExercise: null,
      reasoning: {
        mode,
        exercises,
        index: 0,
        completedCurrent: false,
        hadHintCurrent: false,
        startTermIdx: null,
        endTermIdx: null,
        bugFound: false
      },
      trophies: [],
      completedExercises: [],
      errorLog: [],
      continuum: Continuum.createInitial(activeAxes),
      reflection: {
        confidence: null,
        note: ''
      },
      targeted: null,
      assemblyCompleted: false,
      assemblyPlaced: [],
      assemblyOrder: null
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
      session.view = 'assembly';
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
      if (!parsed || parsed.version !== 1) return null;
      const isReasoning = parsed.mode === 'parentesis' || parsed.mode === 'error';
      if (!isReasoning && !parsed.currentExercise) return null;
      if (isReasoning && (!parsed.reasoning || !Array.isArray(parsed.reasoning.exercises))) return null;

      if (parsed.currentExercise) {
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
      }
      parsed.assemblyCompleted = Boolean(parsed.assemblyCompleted);
      parsed.assemblyPlaced = Array.isArray(parsed.assemblyPlaced) ? parsed.assemblyPlaced : [];
      if (!Array.isArray(parsed.assemblyOrder)) {
        parsed.assemblyOrder = null;
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
    normalizeConfig,
    parseUrlConfig,
    buildShareUrl,
    createSession,
    createReasoningSession,
    startTargetedTraining,
    advanceAfterExerciseComplete,
    saveSession,
    loadSession,
    clearSavedSession
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
