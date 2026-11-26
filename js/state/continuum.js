(function (global) {
  'use strict';

  const OpComb = (global.OpComb = global.OpComb || {});

  const AXES_META = [
    {
      id: 'jerarquia',
      label: 'Ordre i jerarquia',
      badge: '1-2-3',
      desc: 'Triar quina operació va primer en cada pas'
    },
    {
      id: 'parentesis',
      label: 'Parèntesis',
      badge: '( )',
      desc: 'Respectar i resoldre el que hi ha dins dels parèntesis'
    },
    {
      id: 'potencies',
      label: 'Potències',
      badge: 'aⁿ',
      desc: 'Calcular quadrats i cubs (base × base...)'
    },
    {
      id: 'arrels',
      label: 'Arrels quadrades',
      badge: '√',
      desc: 'Trobar el nombre que multiplicat per si mateix dona el radicand'
    },
    {
      id: 'mult_div',
      label: 'Multiplicacions i divisions',
      badge: '× ÷',
      desc: 'Càlcul exacte de productes i divisions'
    },
    {
      id: 'sum_rest',
      label: 'Sumes i restes',
      badge: '+ −',
      desc: 'Càlcul mental de sumes i restes'
    }
  ];

  const STAGES = [
    { id: 'unexplored', rank: 0, label: 'Sense explorar', icon: '○', pct: 6 },
    { id: 'starting', rank: 1, label: 'Iniciant', icon: '◔', pct: 28 },
    { id: 'in_progress', rank: 2, label: 'En procés', icon: '◑', pct: 54 },
    { id: 'consolidated', rank: 3, label: 'Consolidat', icon: '◕', pct: 78 },
    { id: 'mastered', rank: 4, label: 'Dominat', icon: '★', pct: 100 }
  ];

  const WINDOW_SIZE = 8;

  function createInitial(activeAxesSet) {
    const state = {};
    for (const meta of AXES_META) {
      state[meta.id] = {
        recent: [],
        totalAttempts: 0,
        totalCorrect: 0,
        active: activeAxesSet ? activeAxesSet.has(meta.id) : true
      };
    }
    return state;
  }

  function computeWeightedScore(recent) {
    if (!recent || recent.length === 0) return 0;
    let weightedSum = 0;
    let totalWeight = 0;
    for (let i = 0; i < recent.length; i++) {
      const weight = i + 1;
      weightedSum += (recent[i] ? 1 : 0) * weight;
      totalWeight += weight;
    }
    return weightedSum / totalWeight;
  }

  function computeStage(axisData) {
    if (!axisData || axisData.totalAttempts === 0) {
      return { stage: STAGES[0], percent: 0 };
    }

    const score = computeWeightedScore(axisData.recent);
    const n = axisData.recent.length;

    let stageIdx = 1;
    if (n >= 4 && score >= 0.85) {
      stageIdx = 4; // Dominat
    } else if (n >= 2 && score >= 0.68) {
      stageIdx = 3; // Consolidat
    } else if (score >= 0.35 || axisData.totalCorrect >= 1) {
      stageIdx = 2; // En procés
    } else {
      stageIdx = 1; // Iniciant
    }

    const stage = STAGES[stageIdx];
    const percent = Math.max(12, Math.round(score * 100));
    return { stage, percent };
  }

  function recordAttempt(state, axisId, isCorrect) {
    if (!state[axisId]) return state;
    const entry = state[axisId];
    entry.active = true;
    entry.totalAttempts += 1;
    if (isCorrect) entry.totalCorrect += 1;
    entry.recent.push(Boolean(isCorrect));
    if (entry.recent.length > WINDOW_SIZE) {
      entry.recent.shift();
    }
    return state;
  }

  function getSnapshot(state) {
    return AXES_META.map((meta) => {
      const data = state[meta.id] || {
        recent: [],
        totalAttempts: 0,
        totalCorrect: 0,
        active: true
      };
      const { stage, percent } = computeStage(data);
      return {
        id: meta.id,
        label: meta.label,
        badge: meta.badge,
        desc: meta.desc,
        active: data.active,
        totalAttempts: data.totalAttempts,
        totalCorrect: data.totalCorrect,
        recent: data.recent.slice(),
        stage,
        percent
      };
    });
  }

  function getWeakestActiveAxisFromSnapshot(snapshot) {
    const explored = snapshot.filter((a) => a.active && a.totalAttempts > 0);
    if (explored.length === 0) {
      return snapshot.find((a) => a.active) || snapshot[0];
    }
    let weakest = explored[0];
    for (const item of explored) {
      if (item.stage.rank < weakest.stage.rank) {
        weakest = item;
      } else if (item.stage.rank === weakest.stage.rank && item.percent < weakest.percent) {
        weakest = item;
      }
    }
    return weakest;
  }

  function getWeakestActiveAxis(state) {
    return getWeakestActiveAxisFromSnapshot(getSnapshot(state));
  }

  OpComb.Continuum = {
    AXES_META,
    STAGES,
    createInitial,
    recordAttempt,
    getSnapshot,
    getWeakestActiveAxis,
    getWeakestActiveAxisFromSnapshot
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
