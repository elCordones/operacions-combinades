(function (global) {
  'use strict';

  const OpComb = (global.OpComb = global.OpComb || {});

  const OP_SYMBOLS = { '+': '+', '-': '−', '*': '×', '/': '÷' };

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(arr) {
    return arr[randInt(0, arr.length - 1)];
  }

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function termNum(value) {
    return { kind: 'num', value, label: String(value) };
  }

  function termPow(base, exp) {
    const sup = exp === 2 ? '²' : exp === 3 ? '³' : '^' + exp;
    return { kind: 'pow', base, exp, value: Math.pow(base, exp), label: String(base) + sup };
  }

  function termSqrt(arg) {
    return { kind: 'sqrt', arg, value: Math.round(Math.sqrt(arg)), label: '√' + arg };
  }

  function evalSlice(values, ops) {
    if (values.length === 0 || values.length !== ops.length + 1) return NaN;
    const v = values.slice();
    const o = ops.slice();

    // Pass 1: * and / left-to-right
    let i = 0;
    while (i < o.length) {
      if (o[i] === '*' || o[i] === '/') {
        const l = v[i];
        const r = v[i + 1];
        if (!Number.isInteger(l) || !Number.isInteger(r)) return NaN;
        let res;
        if (o[i] === '*') {
          res = l * r;
        } else {
          if (r < 2 || l % r !== 0) return NaN;
          res = l / r;
        }
        if (res < 0 || res > 200) return NaN;
        v.splice(i, 2, res);
        o.splice(i, 1);
      } else {
        i++;
      }
    }

    // Pass 2: + and - left-to-right
    let acc = v[0];
    if (!Number.isInteger(acc) || acc < 0 || acc > 200) return NaN;
    for (let k = 0; k < o.length; k++) {
      const r = v[k + 1];
      if (!Number.isInteger(r)) return NaN;
      acc = o[k] === '+' ? acc + r : acc - r;
      if (acc < 0 || acc > 200) return NaN;
    }
    return acc;
  }

  function evaluateFlatWithParens(terms, ops, startIdx, endIdx) {
    const vals = terms.map((t) => t.value);
    if (startIdx === null || startIdx === undefined || endIdx === null || endIdx === undefined) {
      return evalSlice(vals, ops);
    }
    if (startIdx < 0 || endIdx >= terms.length || startIdx >= endIdx) return NaN;
    if (startIdx === 0 && endIdx === terms.length - 1) return NaN;

    const innerVal = evalSlice(vals.slice(startIdx, endIdx + 1), ops.slice(startIdx, endIdx));
    if (!Number.isInteger(innerVal)) return NaN;

    const outerVals = vals.slice(0, startIdx).concat([innerVal], vals.slice(endIdx + 1));
    const outerOps = ops.slice(0, startIdx).concat(ops.slice(endIdx));
    return evalSlice(outerVals, outerOps);
  }

  function formatFlatExpr(terms, ops, startIdx, endIdx) {
    const hasParens =
      startIdx !== null &&
      startIdx !== undefined &&
      endIdx !== null &&
      endIdx !== undefined &&
      startIdx < endIdx;
    let out = '';
    for (let i = 0; i < terms.length; i++) {
      if (hasParens && i === startIdx) out += '(';
      out += terms[i].label;
      if (hasParens && i === endIdx) out += ')';
      if (i < ops.length) {
        out += ' ' + (OP_SYMBOLS[ops[i]] || ops[i]) + ' ';
      }
    }
    return out;
  }

  function getOpsFromConfig(config) {
    const course = (config && config.course) || '6e';
    if (course === '6e') {
      return { mult_div: true, parentesis: true, potencies: true, arrels: true };
    }
    if (course === '5e') {
      return {
        mult_div: true,
        parentesis: true,
        potencies: true,
        arrels: Boolean(config && config.customOps && config.customOps.arrels)
      };
    }
    return Object.assign(
      { mult_div: true, parentesis: true, potencies: false, arrels: false },
      (config && config.customOps) || {}
    );
  }

  function buildParenCandidate(opsFlags) {
    const patterns = ['sub_sub', 'sub_add'];
    if (opsFlags.mult_div) {
      patterns.push('add_mul', 'mul_sub', 'add_div', 'four_terms');
      if (opsFlags.potencies) patterns.push('pow_mul');
      if (opsFlags.arrels) patterns.push('sqrt_mul');
    }

    const pat = pick(patterns);
    if (pat === 'add_mul') {
      const a = randInt(2, 10);
      const b = randInt(2, 9);
      const c = randInt(2, 6);
      return { terms: [termNum(a), termNum(b), termNum(c)], ops: ['+', '*'], sol: [0, 1] };
    }
    if (pat === 'mul_sub') {
      const c = randInt(2, 9);
      const b = c + randInt(2, 8);
      const a = randInt(2, 7);
      return { terms: [termNum(a), termNum(b), termNum(c)], ops: ['*', '-'], sol: [1, 2] };
    }
    if (pat === 'sub_sub') {
      const c = randInt(2, 12);
      const b = c + randInt(3, 14);
      const a = b + randInt(4, 24);
      return { terms: [termNum(a), termNum(b), termNum(c)], ops: ['-', '-'], sol: [1, 2] };
    }
    if (pat === 'sub_add') {
      const b = randInt(3, 15);
      const c = randInt(2, 14);
      const a = b + c + randInt(2, 24);
      return { terms: [termNum(a), termNum(b), termNum(c)], ops: ['-', '+'], sol: [1, 2] };
    }
    if (pat === 'add_div') {
      const c = randInt(2, 7);
      const q = randInt(2, 10);
      const total = c * q;
      const a = randInt(2, total - 2);
      const b = total - a;
      return { terms: [termNum(a), termNum(b), termNum(c)], ops: ['+', '/'], sol: [0, 1] };
    }
    if (pat === 'four_terms') {
      const a = randInt(2, 8);
      const b = randInt(2, 7);
      const c = randInt(2, 6);
      const d = randInt(2, 10);
      if (Math.random() < 0.5) {
        return { terms: [termNum(a), termNum(b), termNum(c), termNum(d)], ops: ['+', '*', '-'], sol: [0, 1] };
      }
      const x = randInt(2, 6);
      const y = randInt(2, 7);
      const z = randInt(2, 6);
      const w = randInt(2, 12);
      return { terms: [termNum(w), termNum(x), termNum(y), termNum(z)], ops: ['-', '+', '*'], sol: [1, 2] };
    }
    if (pat === 'pow_mul') {
      const base = randInt(2, 5);
      const b = randInt(2, 8);
      const c = randInt(2, 5);
      return { terms: [termPow(base, 2), termNum(b), termNum(c)], ops: ['+', '*'], sol: [0, 1] };
    }
    // sqrt_mul
    const sq = pick([4, 9, 16, 25, 36, 49]);
    const b = randInt(2, 8);
    const c = randInt(2, 6);
    return { terms: [termSqrt(sq), termNum(b), termNum(c)], ops: ['+', '*'], sol: [0, 1] };
  }

  function generateParenPuzzle(config, seenSet) {
    const opsFlags = getOpsFromConfig(config);
    const seen = seenSet || new Set();

    for (let attempt = 0; attempt < 150; attempt++) {
      const cand = buildParenCandidate(opsFlags);
      const valNoParens = evaluateFlatWithParens(cand.terms, cand.ops, null, null);
      const target = evaluateFlatWithParens(cand.terms, cand.ops, cand.sol[0], cand.sol[1]);
      if (
        Number.isInteger(valNoParens) &&
        Number.isInteger(target) &&
        target >= 0 &&
        target <= 200 &&
        valNoParens !== target
      ) {
        const exprPlain = formatFlatExpr(cand.terms, cand.ops, null, null);
        const key = exprPlain + '=' + target;
        if (!seen.has(key)) {
          seen.add(key);
          return {
            kind: 'parentesis',
            terms: cand.terms,
            ops: cand.ops,
            target,
            valNoParens,
            solution: cand.sol,
            exprPlain,
            axis: 'parentesis'
          };
        }
      }
    }

    const fallbackTerms = [termNum(24), termNum(9), termNum(4)];
    const fallbackOps = ['-', '-'];
    return {
      kind: 'parentesis',
      terms: fallbackTerms,
      ops: fallbackOps,
      target: 19,
      valNoParens: 11,
      solution: [1, 2],
      exprPlain: '24 − 9 − 4',
      axis: 'parentesis'
    };
  }

  function buildErrorCandidate(opsFlags) {
    const pool = ['left_to_right_as'];
    if (opsFlags.mult_div) pool.push('md_before_as', 'md_step2', 'left_to_right_md');
    if (opsFlags.parentesis) pool.push('paren_first');
    if (opsFlags.potencies) pool.push('pow_mult_trap');
    if (opsFlags.arrels) pool.push('sqrt_half_trap');

    const kind = pick(pool);

    if (kind === 'md_before_as') {
      const a = randInt(3, 12);
      const b = randInt(2, 8);
      const c = randInt(2, 6);
      const wrongSum = a + b;
      const wrongFinal = wrongSum * c;
      const rightProd = b * c;
      const correctFinal = a + rightProd;
      return {
        initialExpr: `${a} + ${b} × ${c}`,
        buggySteps: [
          { expr: `${wrongSum} × ${c}`, note: `${a} + ${b} = ${wrongSum}`, isBug: true },
          { expr: `${wrongFinal}`, note: `${wrongSum} × ${c} = ${wrongFinal}`, isBug: false }
        ],
        bugStepIdx: 0,
        correctSteps: [
          { expr: `${a} + ${rightProd}`, note: `${b} × ${c} = ${rightProd}` },
          { expr: `${correctFinal}`, note: `${a} + ${rightProd} = ${correctFinal}` }
        ],
        correctFinal,
        wrongFinal,
        axis: 'jerarquia',
        extraAxis: 'mult_div',
        correctOption: 'S’ha sumat abans de fer la multiplicació; primer cal calcular ×.',
        distractors: [
          'La multiplicació s’ha calculat malament per una errada de taules.',
          'Calia començar per la dreta en lloc de l’esquerra.'
        ],
        explanation: `Primer s’ha de fer ${b} × ${c} = ${rightProd} i després sumar-hi ${a} → ${correctFinal}.`
      };
    }

    if (kind === 'md_step2') {
      // Pas 1 correcte (parèntesi o resta inicial), error al pas 2 (sumar abans de multiplicar)
      const x = randInt(2, 7);
      const y = randInt(2, 6);
      const a = x + y;
      const b = randInt(2, 6);
      const c = randInt(2, 5);
      const wrongSum = a + b;
      const wrongFinal = wrongSum * c;
      const rightProd = b * c;
      const correctFinal = a + rightProd;
      return {
        initialExpr: `(${x} + ${y}) + ${b} × ${c}`,
        buggySteps: [
          { expr: `${a} + ${b} × ${c}`, note: `${x} + ${y} = ${a}`, isBug: false },
          { expr: `${wrongSum} × ${c}`, note: `${a} + ${b} = ${wrongSum}`, isBug: true },
          { expr: `${wrongFinal}`, note: `${wrongSum} × ${c} = ${wrongFinal}`, isBug: false }
        ],
        bugStepIdx: 1,
        correctSteps: [
          { expr: `${a} + ${b} × ${c}`, note: `${x} + ${y} = ${a}` },
          { expr: `${a} + ${rightProd}`, note: `${b} × ${c} = ${rightProd}` },
          { expr: `${correctFinal}`, note: `${a} + ${rightProd} = ${correctFinal}` }
        ],
        correctFinal,
        wrongFinal,
        axis: 'jerarquia',
        extraAxis: 'mult_div',
        correctOption: 'En aquesta línia s’ha sumat abans que multiplicar; la × té més prioritat.',
        distractors: [
          'El primer parèntesi estava mal calculat.',
          'Calia multiplicar primer els dos nombres del final per separat i restar-los.'
        ],
        explanation: `El parèntesi (${x} + ${y} = ${a}) era correcte, però després calia fer ${b} × ${c} = ${rightProd} abans de sumar.`
      };
    }

    if (kind === 'left_to_right_as') {
      const b = randInt(4, 14);
      const c = randInt(2, 10);
      const a = b + c + randInt(3, 18);
      const wrongInner = b + c;
      const wrongFinal = a - wrongInner;
      const rightStep = a - b;
      const correctFinal = rightStep + c;
      return {
        initialExpr: `${a} − ${b} + ${c}`,
        buggySteps: [
          { expr: `${a} − ${wrongInner}`, note: `${b} + ${c} = ${wrongInner}`, isBug: true },
          { expr: `${wrongFinal}`, note: `${a} − ${wrongInner} = ${wrongFinal}`, isBug: false }
        ],
        bugStepIdx: 0,
        correctSteps: [
          { expr: `${rightStep} + ${c}`, note: `${a} − ${b} = ${rightStep}` },
          { expr: `${correctFinal}`, note: `${rightStep} + ${c} = ${correctFinal}` }
        ],
        correctFinal,
        wrongFinal,
        axis: 'jerarquia',
        extraAxis: 'sum_rest',
        correctOption: 'Les sumes i restes tenen la mateixa força: cal començar per l’esquerra.',
        distractors: [
          'La suma sempre va abans que la resta a la piràmide.',
          'S’ha restat malament al darrer pas.'
        ],
        explanation: `Com que només hi ha − i +, comencem per l’esquerra: ${a} − ${b} = ${rightStep}, i després + ${c} = ${correctFinal}.`
      };
    }

    if (kind === 'left_to_right_md') {
      const b = randInt(2, 5);
      const c = randInt(2, 5);
      const k = randInt(2, 5);
      const a = b * c * k;
      const wrongInner = b * c;
      const wrongFinal = a / wrongInner;
      const rightStep = a / b;
      const correctFinal = rightStep * c;
      return {
        initialExpr: `${a} ÷ ${b} × ${c}`,
        buggySteps: [
          { expr: `${a} ÷ ${wrongInner}`, note: `${b} × ${c} = ${wrongInner}`, isBug: true },
          { expr: `${wrongFinal}`, note: `${a} ÷ ${wrongInner} = ${wrongFinal}`, isBug: false }
        ],
        bugStepIdx: 0,
        correctSteps: [
          { expr: `${rightStep} × ${c}`, note: `${a} ÷ ${b} = ${rightStep}` },
          { expr: `${correctFinal}`, note: `${rightStep} × ${c} = ${correctFinal}` }
        ],
        correctFinal,
        wrongFinal,
        axis: 'jerarquia',
        extraAxis: 'mult_div',
        correctOption: '× i ÷ tenen la mateixa prioritat: s’ha de fer primer la divisió de l’esquerra.',
        distractors: [
          'La multiplicació sempre es fa abans que la divisió.',
          'Calia sumar els dos últims nombres.'
        ],
        explanation: `En tenir ÷ i × seguides, anem d’esquerra a dreta: ${a} ÷ ${b} = ${rightStep}, i ${rightStep} × ${c} = ${correctFinal}.`
      };
    }

    if (kind === 'paren_first') {
      const a = randInt(2, 6);
      const b = randInt(3, 9);
      const c = randInt(2, 8);
      const wrongProd = a * b;
      const wrongFinal = wrongProd + c;
      const rightInner = b + c;
      const correctFinal = a * rightInner;
      return {
        initialExpr: `${a} × (${b} + ${c})`,
        buggySteps: [
          { expr: `${wrongProd} + ${c}`, note: `${a} × ${b} = ${wrongProd}`, isBug: true },
          { expr: `${wrongFinal}`, note: `${wrongProd} + ${c} = ${wrongFinal}`, isBug: false }
        ],
        bugStepIdx: 0,
        correctSteps: [
          { expr: `${a} × ${rightInner}`, note: `${b} + ${c} = ${rightInner}` },
          { expr: `${correctFinal}`, note: `${a} × ${rightInner} = ${correctFinal}` }
        ],
        correctFinal,
        wrongFinal,
        axis: 'parentesis',
        extraAxis: 'jerarquia',
        correctOption: 'S’ha multiplicat abans de resoldre el que hi ha dins dels parèntesis ( ).',
        distractors: [
          'Calia sumar el primer i l’últim nombre.',
          'El càlcul de la multiplicació és incorrecte.'
        ],
        explanation: `Els parèntesis manen sempre: primer ${b} + ${c} = ${rightInner}, i després ${a} × ${rightInner} = ${correctFinal}.`
      };
    }

    if (kind === 'pow_mult_trap') {
      const base = randInt(3, 7);
      const exp = randInt(0, 1) === 0 || base > 5 ? 2 : 3;
      const sup = exp === 2 ? '²' : '³';
      const c = randInt(4, 18);
      const wrongPow = base * exp;
      const wrongFinal = wrongPow + c;
      const rightPow = Math.pow(base, exp);
      const correctFinal = rightPow + c;
      return {
        initialExpr: `${base}${sup} + ${c}`,
        buggySteps: [
          { expr: `${wrongPow} + ${c}`, note: `${base}${sup} = ${wrongPow}`, isBug: true },
          { expr: `${wrongFinal}`, note: `${wrongPow} + ${c} = ${wrongFinal}`, isBug: false }
        ],
        bugStepIdx: 0,
        correctSteps: [
          { expr: `${rightPow} + ${c}`, note: `${base}${sup} = ${rightPow}` },
          { expr: `${correctFinal}`, note: `${rightPow} + ${c} = ${correctFinal}` }
        ],
        correctFinal,
        wrongFinal,
        axis: 'potencies',
        extraAxis: null,
        correctOption: `S’ha confós la potència amb multiplicar ${base} × ${exp}; cal fer ${Array(exp).fill(base).join(' × ')}.`,
        distractors: [
          'S’havia de fer la suma abans que la potència.',
          'La suma final està mal calculada.'
        ],
        explanation: `${base}${sup} vol dir ${Array(exp).fill(base).join(' × ')} = ${rightPow} (no pas ${base} × ${exp}), i ${rightPow} + ${c} = ${correctFinal}.`
      };
    }

    // sqrt_half_trap
    const sq = pick([16, 36, 64, 100, 144]);
    const c = randInt(3, 18);
    const wrongRoot = sq / 2;
    const wrongFinal = wrongRoot + c;
    const rightRoot = Math.round(Math.sqrt(sq));
    const correctFinal = rightRoot + c;
    return {
      initialExpr: `√${sq} + ${c}`,
      buggySteps: [
        { expr: `${wrongRoot} + ${c}`, note: `√${sq} = ${wrongRoot}`, isBug: true },
        { expr: `${wrongFinal}`, note: `${wrongRoot} + ${c} = ${wrongFinal}`, isBug: false }
      ],
      bugStepIdx: 0,
      correctSteps: [
        { expr: `${rightRoot} + ${c}`, note: `√${sq} = ${rightRoot}` },
        { expr: `${correctFinal}`, note: `${rightRoot} + ${c} = ${correctFinal}` }
      ],
      correctFinal,
      wrongFinal,
      axis: 'arrels',
      extraAxis: null,
      correctOption: `S’ha dividit ${sq} entre 2 en lloc de buscar quin nombre multiplicat per si mateix dona ${sq}.`,
      distractors: [
        'Primer s’havia de sumar i després fer l’arrel quadrada.',
        'Les arrels quadrades sempre donen la meitat del nombre.'
      ],
      explanation: `√${sq} = ${rightRoot} perquè ${rightRoot} × ${rightRoot} = ${sq} (no és la meitat), i ${rightRoot} + ${c} = ${correctFinal}.`
    };
  }

  function generateErrorPuzzle(config, seenSet) {
    const opsFlags = getOpsFromConfig(config);
    const seen = seenSet || new Set();

    for (let attempt = 0; attempt < 150; attempt++) {
      const cand = buildErrorCandidate(opsFlags);
      if (
        cand.wrongFinal !== cand.correctFinal &&
        cand.correctFinal >= 0 &&
        cand.correctFinal <= 200 &&
        !seen.has(cand.initialExpr)
      ) {
        seen.add(cand.initialExpr);
        const options = shuffle([
          { text: cand.correctOption, isCorrect: true },
          { text: cand.distractors[0], isCorrect: false },
          { text: cand.distractors[1], isCorrect: false }
        ]);
        return {
          kind: 'error',
          initialExpr: cand.initialExpr,
          buggySteps: cand.buggySteps,
          bugStepIdx: cand.bugStepIdx,
          correctSteps: cand.correctSteps,
          correctFinal: cand.correctFinal,
          wrongFinal: cand.wrongFinal,
          axis: cand.axis,
          extraAxis: cand.extraAxis,
          options,
          explanation: cand.explanation
        };
      }
    }

    const fb = buildErrorCandidate({ mult_div: false, parentesis: false, potencies: false, arrels: false });
    return {
      kind: 'error',
      initialExpr: fb.initialExpr,
      buggySteps: fb.buggySteps,
      bugStepIdx: fb.bugStepIdx,
      correctSteps: fb.correctSteps,
      correctFinal: fb.correctFinal,
      wrongFinal: fb.wrongFinal,
      axis: fb.axis,
      extraAxis: fb.extraAxis,
      options: shuffle([
        { text: fb.correctOption, isCorrect: true },
        { text: fb.distractors[0], isCorrect: false },
        { text: fb.distractors[1], isCorrect: false }
      ]),
      explanation: fb.explanation
    };
  }

  function generateReasoningSeries(mode, config, count = 6) {
    const seen = new Set();
    const list = [];
    for (let i = 0; i < count; i++) {
      list.push(
        mode === 'error'
          ? generateErrorPuzzle(config, seen)
          : generateParenPuzzle(config, seen)
      );
    }
    return list;
  }

  OpComb.Reasoning = {
    OP_SYMBOLS,
    evaluateFlatWithParens,
    formatFlatExpr,
    generateParenPuzzle,
    generateErrorPuzzle,
    generateReasoningSeries
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
