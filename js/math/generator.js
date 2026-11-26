(function (global) {
  'use strict';

  const OpComb = (global.OpComb = global.OpComb || {});
  const AST = OpComb.AST;

  const POWERS_ALL = [
    [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2],
    [2, 3], [3, 3], [4, 3], [5, 3]
  ];
  const POWERS_5E = [
    [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2],
    [2, 3]
  ];
  const EXACT_SQUARES = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144];

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(arr) {
    return arr[randInt(0, arr.length - 1)];
  }

  function makePowerNode(use5e) {
    const [b, e] = pick(use5e ? POWERS_5E : POWERS_ALL);
    return AST.pow(AST.num(b), e);
  }

  function makeSqrtNode() {
    return AST.sqrt(AST.num(pick(EXACT_SQUARES)));
  }

  function makeExactDivNode(maxQuotient = 12, maxDivisor = 9) {
    const divisor = randInt(2, maxDivisor);
    const quotient = randInt(2, maxQuotient);
    return AST.bin('/', AST.num(divisor * quotient), AST.num(divisor));
  }

  function makeMulNode(maxFactor = 12) {
    return AST.bin('*', AST.num(randInt(2, maxFactor)), AST.num(randInt(2, 9)));
  }

  function makeAddOrSubPair(allowSub = true) {
    const a = randInt(4, 35);
    const b = randInt(2, 25);
    if (allowSub && Math.random() < 0.5 && a > b) {
      return AST.bin('-', AST.num(a), AST.num(b));
    }
    return AST.bin('+', AST.num(a), AST.num(b));
  }

  function getChallengesForConfig(config) {
    const course = config.course || '6e';
    const ops = config.customOps || {
      parentesis: true,
      potencies: true,
      arrels: course === '6e',
      mult_div: true
    };

    if (course === '5e') {
      const ch = [
        {
          id: 'ch1',
          level: 'as_order',
          title: "Ordre d'esquerra a dreta",
          focus: 'Sumes i restes encadenades',
          tip: 'Quan només hi ha sumes i restes, resol sempre d’esquerra a dreta!'
        },
        {
          id: 'ch2',
          level: 'md_priority',
          title: 'La força de × i ÷',
          focus: 'Multiplicacions i divisions abans que sumes i restes',
          tip: 'Busca primer les multiplicacions i divisions.'
        },
        {
          id: 'ch3',
          level: 'parens_basic',
          title: 'El poder dels parèntesis',
          focus: 'Prioritat absoluta dins de ( )',
          tip: 'Resol primer el que hi ha dins dels parèntesis.'
        },
        {
          id: 'ch4',
          level: 'powers_5e',
          title: 'Descobrint les potències',
          focus: 'Quadrats i cubs combinats',
          tip: 'Recorda: 4² vol dir 4 × 4, no pas 4 × 2.'
        },
        {
          id: 'ch5',
          level: ops.arrels ? 'full_5e_roots' : 'full_5e',
          title: 'Repte Final de 5è',
          focus: 'Combinació de tot el que has après',
          tip: 'Segueix la piràmide pas a pas sense presses.'
        }
      ];
      return ch;
    }

    if (course === '6e') {
      return [
        {
          id: 'ch1',
          level: 'as_order',
          title: "Ordre d'esquerra a dreta",
          focus: 'Sumes i restes combinades',
          tip: 'En sumes i restes, comença sempre per l’esquerra.'
        },
        {
          id: 'ch2',
          level: 'md_priority',
          title: 'Prioritat de × i ÷',
          focus: 'Combinació de +, −, × i ÷',
          tip: 'Les multiplicacions i divisions van abans que sumes i restes.'
        },
        {
          id: 'ch3',
          level: 'parens_combo',
          title: 'El poder dels parèntesis',
          focus: 'Parèntesis amb diverses operacions',
          tip: 'Comprova què hi ha dins de cada parèntesi abans de sortir-ne.'
        },
        {
          id: 'ch4',
          level: 'powers_roots',
          title: 'Potències i arrels quadrades',
          focus: 'Operacions aⁿ i √ combinades',
          tip: 'Potències i arrels tenen prioritat sobre ×, ÷, + i −.'
        },
        {
          id: 'ch5',
          level: 'full_hierarchy',
          title: 'Jerarquia completa',
          focus: 'Tots 4 nivells de la piràmide',
          tip: 'Parèntesis → Potències/Arrels → ×/÷ → +/−.'
        },
        {
          id: 'ch6',
          level: 'master_6e',
          title: 'Repte Mestre',
          focus: 'Expressions llargues i dobles parèntesis',
          tip: 'Fixa’t bé si hi ha dos parèntesis o operacions dins d’un parèntesi.'
        }
      ];
    }

    // Mode Personalitzat
    const list = [
      {
        id: 'ch1',
        level: 'as_order',
        title: "Ordre d'esquerra a dreta",
        focus: 'Sumes i restes combinades',
        tip: 'Resol sempre d’esquerra a dreta.'
      }
    ];

    if (ops.mult_div) {
      list.push({
        id: 'ch' + (list.length + 1),
        level: 'md_priority',
        title: 'Multiplicacions i divisions',
        focus: 'Prioritat de × i ÷',
        tip: 'Fes primer × i ÷ abans de sumar o restar.'
      });
    }

    if (ops.parentesis) {
      list.push({
        id: 'ch' + (list.length + 1),
        level: ops.mult_div ? 'parens_combo' : 'parens_as',
        title: 'El poder dels parèntesis',
        focus: 'Operacions dins de ( )',
        tip: 'El parèntesi mana sempre en primer lloc.'
      });
    }

    if (ops.potencies || ops.arrels) {
      const prLevel = ops.potencies && ops.arrels
        ? 'powers_roots'
        : ops.potencies
          ? 'powers_5e'
          : 'roots_only';
      list.push({
        id: 'ch' + (list.length + 1),
        level: prLevel,
        title: ops.potencies && ops.arrels ? 'Potències i arrels' : ops.potencies ? 'Potències' : 'Arrels quadrades',
        focus: 'Prioritat de potències i/o arrels',
        tip: 'Resol potències i arrels abans de multiplicar o sumar.'
      });
    }

    list.push({
      id: 'ch' + (list.length + 1),
      level: 'custom_mix',
      customOps: ops,
      title: 'Repte Combinat Final',
      focus: 'Totes les operacions seleccionades',
      tip: 'Aplica la jerarquia completa amb calma.'
    });

    return list;
  }

  function buildCandidateForLevel(level, customOps) {
    const n = AST.num;
    const bin = AST.bin;
    const paren = AST.paren;

    switch (level) {
      case 'as_order': {
        const pattern = randInt(0, 3);
        if (pattern === 0) {
          // a - b + c (error clàssic d'esquerra a dreta)
          const b = randInt(3, 18);
          const a = b + randInt(2, 24);
          const c = randInt(2, 20);
          return bin('+', bin('-', n(a), n(b)), n(c));
        }
        if (pattern === 1) {
          // a - b - c
          const c = randInt(2, 12);
          const b = randInt(3, 15);
          const a = b + c + randInt(2, 20);
          return bin('-', bin('-', n(a), n(b)), n(c));
        }
        if (pattern === 2) {
          // a + b - c + d
          const a = randInt(5, 25);
          const b = randInt(4, 20);
          const c = randInt(3, Math.min(20, a + b - 2));
          const d = randInt(2, 15);
          return bin('+', bin('-', bin('+', n(a), n(b)), n(c)), n(d));
        }
        // a - b + c - d
        const b = randInt(4, 15);
        const a = b + randInt(5, 25);
        const c = randInt(5, 18);
        const d = randInt(2, Math.min(14, a - b + c - 1));
        return bin('-', bin('+', bin('-', n(a), n(b)), n(c)), n(d));
      }

      case 'md_priority': {
        const pattern = randInt(0, 4);
        if (pattern === 0) {
          // a + b * c
          return bin('+', n(randInt(3, 25)), makeMulNode(10));
        }
        if (pattern === 1) {
          // a - b * c
          const mul = makeMulNode(9);
          const mv = AST.evaluate(mul);
          return bin('-', n(mv + randInt(3, 30)), mul);
        }
        if (pattern === 2) {
          // a + b / c
          return bin('+', n(randInt(4, 28)), makeExactDivNode(12, 8));
        }
        if (pattern === 3) {
          // a * b + c / d
          return bin('+', makeMulNode(9), makeExactDivNode(10, 7));
        }
        // a / b * c (ordre esquerra a dreta en ×/÷)
        const d = randInt(2, 8);
        const q = randInt(2, 10);
        return bin('*', bin('/', n(d * q), n(d)), n(randInt(2, 7)));
      }

      case 'parens_as': {
        const pattern = randInt(0, 1);
        if (pattern === 0) {
          const inner = makeAddOrSubPair(true);
          const iv = AST.evaluate(inner);
          return bin('-', n(iv + randInt(5, 30)), paren(inner));
        }
        const inner = makeAddOrSubPair(true);
        return bin('+', n(randInt(4, 25)), paren(inner));
      }

      case 'parens_basic':
      case 'parens_combo': {
        const pattern = randInt(0, 4);
        if (pattern === 0) {
          // (a + b) * c
          const a = randInt(2, 12);
          const b = randInt(2, 10);
          return bin('*', paren(bin('+', n(a), n(b))), n(randInt(2, 7)));
        }
        if (pattern === 1) {
          // k * (a - b)
          const b = randInt(2, 12);
          const a = b + randInt(2, 11);
          return bin('*', n(randInt(2, 8)), paren(bin('-', n(a), n(b))));
        }
        if (pattern === 2) {
          // (a + b) / d
          const d = randInt(2, 8);
          const q = randInt(2, 12);
          const total = d * q;
          const a = randInt(2, total - 2);
          return bin('/', paren(bin('+', n(a), n(total - a))), n(d));
        }
        if (pattern === 3) {
          // c + (a * b - k)
          const mul = makeMulNode(8);
          const mv = AST.evaluate(mul);
          const k = randInt(2, Math.max(3, mv - 2));
          return bin('+', n(randInt(3, 25)), paren(bin('-', mul, n(k))));
        }
        // x - (a + b * c)
        const inner = bin('+', n(randInt(2, 12)), makeMulNode(6));
        const iv = AST.evaluate(inner);
        return bin('-', n(iv + randInt(4, 30)), paren(inner));
      }

      case 'powers_5e': {
        const pattern = randInt(0, 3);
        if (pattern === 0) {
          return bin('+', makePowerNode(true), makeMulNode(8));
        }
        if (pattern === 1) {
          const p = makePowerNode(true);
          const pv = AST.evaluate(p);
          return bin('-', n(pv + randInt(5, 35)), p);
        }
        if (pattern === 2) {
          const p = makePowerNode(true);
          return bin('+', bin('*', n(randInt(2, 6)), p), n(randInt(3, 20)));
        }
        // (a + b)² - c
        const a = randInt(2, 6);
        const b = randInt(1, 5);
        return bin('-', AST.pow(paren(bin('+', n(a), n(b))), 2), n(randInt(2, 20)));
      }

      case 'roots_only': {
        const pattern = randInt(0, 2);
        if (pattern === 0) {
          return bin('+', makeSqrtNode(), n(randInt(4, 30)));
        }
        if (pattern === 1) {
          const sq = makeSqrtNode();
          return bin('-', bin('+', n(randInt(15, 45)), sq), n(randInt(2, 12)));
        }
        const target = pick(EXACT_SQUARES.slice(0, 8));
        const a = randInt(2, target - 2);
        return bin('+', AST.sqrt(paren(bin('+', n(a), n(target - a)))), n(randInt(2, 12)));
      }

      case 'powers_roots': {
        const pattern = randInt(0, 4);
        if (pattern === 0) {
          return bin('+', makePowerNode(false), makeSqrtNode());
        }
        if (pattern === 1) {
          const p = makePowerNode(false);
          const sq = makeSqrtNode();
          return bin('-', bin('+', p, n(randInt(10, 30))), sq);
        }
        if (pattern === 2) {
          return bin('+', bin('*', n(randInt(2, 5)), makeSqrtNode()), makePowerNode(true));
        }
        if (pattern === 3) {
          // √(a + b) × c
          const target = pick(EXACT_SQUARES.slice(0, 8));
          const a = randInt(2, target - 2);
          return bin('*', AST.sqrt(paren(bin('+', n(a), n(target - a)))), n(randInt(2, 6)));
        }
        // a² ÷ d + √x
        const p = pick([[4, 2], [6, 2], [8, 2], [10, 2], [4, 3]]);
        const val = Math.pow(p[0], p[1]);
        const d = p[0] === 10 ? 5 : 4;
        return bin('+', bin('/', AST.pow(n(p[0]), p[1]), n(d)), makeSqrtNode());
      }

      case 'full_5e':
      case 'full_5e_roots':
      case 'full_hierarchy': {
        const allowSqrt = level !== 'full_5e';
        const pattern = randInt(0, 3);
        if (pattern === 0) {
          // a + b × (c - d) + p
          const d = randInt(2, 8);
          const c = d + randInt(2, 7);
          const term = bin('*', n(randInt(2, 6)), paren(bin('-', n(c), n(d))));
          const extra = allowSqrt && Math.random() < 0.5 ? makeSqrtNode() : makePowerNode(level !== 'full_hierarchy');
          return bin('+', bin('+', n(randInt(3, 18)), term), extra);
        }
        if (pattern === 1) {
          // (p - k) ÷ d + m
          const p = makePowerNode(level !== 'full_hierarchy');
          const pv = AST.evaluate(p);
          const d = randInt(2, 5);
          const k = pv % d + d * randInt(0, 2);
          const sub = paren(bin('-', p, n(k)));
          const extra = allowSqrt && Math.random() < 0.5 ? makeSqrtNode() : n(randInt(3, 15));
          return bin('+', bin('/', sub, n(d)), extra);
        }
        if (pattern === 2) {
          // m - (a² + √b)
          const p = makePowerNode(true);
          const rhs = allowSqrt ? makeSqrtNode() : n(randInt(3, 14));
          const inner = bin('+', p, rhs);
          return bin('-', n(AST.evaluate(inner) + randInt(5, 40)), paren(inner));
        }
        // a × b − c² + d
        const p = makePowerNode(true);
        const mul = bin('*', n(randInt(5, 12)), n(randInt(6, 12)));
        return bin('+', bin('-', mul, p), allowSqrt ? makeSqrtNode() : n(randInt(2, 15)));
      }

      case 'master_6e': {
        const pattern = randInt(0, 2);
        if (pattern === 0) {
          // (a + b) × (c - d) - √x
          const a = randInt(2, 7);
          const b = randInt(2, 6);
          const d = randInt(2, 6);
          const c = d + randInt(2, 6);
          const prod = bin('*', paren(bin('+', n(a), n(b))), paren(bin('-', n(c), n(d))));
          return bin('-', prod, makeSqrtNode());
        }
        if (pattern === 1) {
          // (a² + b × c) ÷ d + √x
          const sq = makeSqrtNode();
          const a = randInt(3, 8);
          const mul = bin('*', n(randInt(2, 6)), n(randInt(2, 5)));
          const sum = bin('+', AST.pow(n(a), 2), mul);
          const sv = AST.evaluate(sum);
          const divs = [2, 3, 4, 5, 6].filter((x) => sv % x === 0);
          const d = divs.length ? pick(divs) : 2;
          return bin('+', bin('/', paren(sum), n(d)), sq);
        }
        // x − ((a + b)² − c × d)
        const a = randInt(2, 5);
        const b = randInt(1, 4);
        const p = AST.pow(paren(bin('+', n(a), n(b))), 2);
        const mul = bin('*', n(randInt(2, 5)), n(randInt(2, 5)));
        const inner = bin('-', p, mul);
        return bin('-', n(AST.evaluate(inner) + randInt(6, 30)), paren(inner));
      }

      case 'custom_mix': {
        const ops = customOps || { parentesis: true, potencies: true, arrels: true, mult_div: true };
        const pool = ['as_order'];
        if (ops.mult_div) pool.push('md_priority');
        if (ops.parentesis) pool.push(ops.mult_div ? 'parens_combo' : 'parens_as');
        if (ops.potencies && ops.arrels) pool.push('powers_roots');
        else if (ops.potencies) pool.push('powers_5e');
        else if (ops.arrels) pool.push('roots_only');

        if (ops.parentesis && ops.mult_div && ops.potencies && ops.arrels) {
          pool.push('full_hierarchy');
        } else if (ops.parentesis && ops.mult_div && ops.potencies) {
          pool.push('full_5e');
        }
        return buildCandidateForLevel(pick(pool), customOps);
      }

      default:
        return buildCandidateForLevel('md_priority');
    }
  }

  function getFallbackForLevel(level) {
    const n = AST.num;
    const bin = AST.bin;
    const paren = AST.paren;
    switch (level) {
      case 'as_order':
        return bin('+', bin('-', n(18), n(7)), n(5));
      case 'md_priority':
        return bin('+', n(8), bin('*', n(4), n(3)));
      case 'parens_as':
        return bin('-', n(25), paren(bin('+', n(6), n(4))));
      case 'parens_basic':
      case 'parens_combo':
        return bin('*', paren(bin('+', n(5), n(3))), n(4));
      case 'powers_5e':
        return bin('+', AST.pow(n(4), 2), bin('*', n(3), n(5)));
      case 'roots_only':
        return bin('+', AST.sqrt(n(36)), bin('-', n(15), n(4)));
      case 'powers_roots':
        return bin('-', bin('+', AST.pow(n(5), 2), AST.sqrt(n(64))), n(7));
      case 'full_5e':
        return bin('+', bin('*', n(3), paren(bin('-', n(9), n(4)))), AST.pow(n(3), 2));
      case 'full_5e_roots':
      case 'full_hierarchy':
        return bin('+', bin('*', n(3), paren(bin('-', n(8), n(3)))), bin('-', AST.pow(n(4), 2), AST.sqrt(n(25))));
      case 'master_6e':
        return bin('-', bin('*', paren(bin('+', n(4), n(3))), paren(bin('-', n(9), n(5)))), AST.sqrt(n(36)));
      default:
        return bin('+', n(10), bin('*', n(3), n(4)));
    }
  }

  function generateExercise(challengeDef, seenSet) {
    const seen = seenSet || new Set();
    for (let attempt = 0; attempt < 150; attempt++) {
      const candidate = buildCandidateForLevel(challengeDef.level, challengeDef.customOps);
      if (AST.validate(candidate, 200)) {
        const plain = AST.toPlainString(candidate);
        if (!seen.has(plain)) {
          seen.add(plain);
          return AST.assignIds(candidate);
        }
      }
    }
    const fallback = getFallbackForLevel(challengeDef.level);
    return AST.assignIds(fallback);
  }

  function generateTargetedExercises(axis, config, count = 3) {
    const ops = (config && config.customOps) || {
      parentesis: true,
      potencies: true,
      arrels: config && config.course !== '5e',
      mult_div: true
    };

    const levelByAxis = {
      sum_rest: 'as_order',
      mult_div: 'md_priority',
      parentesis: ops.mult_div ? 'parens_combo' : 'parens_as',
      potencies: 'powers_5e',
      arrels: ops.potencies ? 'powers_roots' : 'roots_only',
      jerarquia: ops.arrels ? 'full_hierarchy' : (ops.potencies ? 'full_5e' : 'parens_combo')
    };

    const level = levelByAxis[axis] || 'md_priority';
    const seen = new Set();
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push(generateExercise({ level, customOps: ops }, seen));
    }
    return list;
  }

  OpComb.Generator = {
    POWERS_ALL,
    POWERS_5E,
    EXACT_SQUARES,
    getChallengesForConfig,
    generateExercise,
    generateTargetedExercises
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
