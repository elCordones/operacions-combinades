(function (global) {
  'use strict';

  const OpComb = (global.OpComb = global.OpComb || {});
  const AST = OpComb.AST;

  function diagnoseHierarchyError(root, clickedNodeId) {
    const { list, byId } = AST.getOperationInfo(root);
    const clicked = byId.get(clickedNodeId);
    const validIds = AST.getValidNextIds(root);
    const validInfos = list.filter((item) => validIds.has(item.id));
    const expected = validInfos[0];

    if (!clicked || !expected) {
      return {
        code: 'hierarchy_general',
        title: 'Revisa la jerarquia',
        message: 'Comprova quina operació té més prioritat segons la piràmide.',
        axis: 'jerarquia'
      };
    }

    // 1. Ha clicat una operació fora de parèntesi o d'una arrel composta quan n'hi ha una dins
    if (clicked.parenDepth < expected.parenDepth) {
      return {
        code: 'paren_first',
        title: 'Primer els parèntesis!',
        message:
          'Hi ha operacions dins d’un parèntesi (o dins d’una arrel) que s’han de resoldre abans de sortir a fora.',
        axis: 'jerarquia',
        extraAxis: 'parentesis'
      };
    }

    // 2. Mateixa profunditat, però el bloc clicat té una prioritat inferior al que toca fer ara
    if (clicked.parenDepth === expected.parenDepth && clicked.tier < expected.tier) {
      if (expected.tier === 3 && clicked.tier === 2) {
        return {
          code: 'pow_sqrt_before_md',
          title: 'Potències i arrels abans que × i ÷',
          message:
            'Molt a prop! A la piràmide, les potències (aⁿ) i les arrels (√) es calculen abans que les multiplicacions i divisions.',
          axis: 'jerarquia'
        };
      }
      if (expected.tier === 3 && clicked.tier === 1) {
        return {
          code: 'pow_sqrt_before_as',
          title: 'Potències i arrels abans que + i −',
          message:
            'Recorda la jerarquia: primer resolem potències i arrels quadrades, i deixem les sumes i restes per al final.',
          axis: 'jerarquia'
        };
      }
      if (expected.tier === 2 && clicked.tier === 1) {
        return {
          code: 'md_before_as',
          title: 'Primer multiplicacions i divisions (× ÷)',
          message:
            'Vigila! No podem sumar o restar si encara queda una multiplicació o divisió per fer al mateix nivell.',
          axis: 'jerarquia'
        };
      }
    }

    // 3. Mateixa profunditat i mateix tier → regla d'esquerra a dreta
    if (clicked.tier === expected.tier && clicked.parenDepth === expected.parenDepth) {
      if (clicked.tier === 1) {
        return {
          code: 'left_to_right_as',
          title: "Ordre d'esquerra a dreta",
          message:
            'Les sumes i les restes tenen la mateixa força: quan només queden + i −, comença sempre per la primera de l’esquerra.',
          axis: 'jerarquia'
        };
      }
      if (clicked.tier === 2) {
        return {
          code: 'left_to_right_md',
          title: "Ordre d'esquerra a dreta en × i ÷",
          message:
            'La multiplicació i la divisió tenen la mateixa prioritat: resol sempre la que apareix més a l’esquerra primer.',
          axis: 'jerarquia'
        };
      }
    }

    // 4. Ha clicat una operació no preparada (fills sense calcular)
    if (!clicked.isReady) {
      if (clicked.parenDepth === expected.parenDepth && expected.parenDepth > 0) {
        return {
          code: 'inside_paren_priority',
          title: 'Dins del parèntesi també hi ha jerarquia',
          message:
            'Per calcular aquesta operació, primer has de resoldre la suboperació prioritària que té al costat.',
          axis: 'jerarquia',
          extraAxis: 'parentesis'
        };
      }
      return {
        code: 'inner_first',
        title: 'Encara falta un pas previ',
        message:
          'Encara no tenim els dos nombres calculats per fer aquesta operació. Busca quina va abans!',
        axis: 'jerarquia'
      };
    }

    return {
      code: 'hierarchy_general',
      title: 'Fixa’t en la piràmide',
      message: 'Comprova quin nivell de prioritat toca fer ara mateix.',
      axis: 'jerarquia'
    };
  }

  function diagnoseCalculationError(node, userValue) {
    const axis = AST.getAxisForNode(node);
    const expected = AST.evaluate(node);

    if (node.type === 'pow' && node.base.type === 'num') {
      const b = node.base.value;
      const e = node.exp;
      if (userValue === b * e) {
        return {
          code: 'pow_mult_trap',
          title: 'Compte amb la potència!',
          message: `Has fet ${b} × ${e} = ${userValue}. Recorda que ${b}${e === 2 ? '²' : '³'} vol dir multiplicar la base per ella mateixa (${Array(e).fill(b).join(' × ')}).`,
          axis
        };
      }
      return {
        code: 'pow_calc',
        title: 'Revisa el càlcul de la potència',
        message: `Per calcular ${b}${e === 2 ? '²' : '³'}, multiplica ${Array(e).fill(b).join(' × ')}.`,
        axis
      };
    }

    if (node.type === 'sqrt' && node.arg.type === 'num') {
      const a = node.arg.value;
      if (userValue === a / 2) {
        return {
          code: 'sqrt_half_trap',
          title: 'No és la meitat!',
          message: `√${a} no és dividir entre 2. Busca quin nombre multiplicat per ell mateix dona ${a}.`,
          axis
        };
      }
      return {
        code: 'sqrt_calc',
        title: "Busca l'arrel exacta",
        message: `Quin nombre natural multiplicat per si mateix dona exactament ${a}? Prova-ho pas a pas!`,
        axis
      };
    }

    if (node.type === 'bin') {
      const l = AST.evaluate(node.left);
      const r = AST.evaluate(node.right);
      if (node.op === '+' && userValue === Math.abs(l - r)) {
        return {
          code: 'sign_swap_trap',
          title: 'Fixa’t en el signe (+)',
          message: `És una suma (${l} + ${r}), no una resta!`,
          axis
        };
      }
      if (node.op === '-' && userValue === l + r) {
        return {
          code: 'sign_swap_trap',
          title: 'Fixa’t en el signe (−)',
          message: `És una resta (${l} − ${r}), no una suma!`,
          axis
        };
      }
      if (node.op === '*') {
        return {
          code: 'mul_calc',
          title: 'Repassa aquesta multiplicació',
          message: `Torna a calcular ${l} × ${r}. Si et costa, descompon un dels nombres (per exemple, per 10 o per meitats).`,
          axis
        };
      }
      if (node.op === '/') {
        return {
          code: 'div_calc',
          title: 'Comprova la divisió',
          message: `Quin nombre multiplicat per ${r} dona ${l}? (${r} × ? = ${l}).`,
          axis
        };
      }
      if (node.op === '+') {
        return {
          code: 'add_calc',
          title: 'Comprova la suma',
          message: `Torna a sumar ${l} + ${r} amb calma.`,
          axis
        };
      }
      if (node.op === '-') {
        return {
          code: 'sub_calc',
          title: 'Comprova la resta',
          message: `Quant falta per anar de ${r} fins a ${l}? (${l} − ${r}).`,
          axis
        };
      }
    }

    return {
      code: 'calc_general',
      title: 'Torna-ho a provar',
      message: `El resultat esperat és diferent de ${userValue}. Revisa el càlcul!`,
      axis
    };
  }

  function buildFormativeSummary(session, snapshot) {
    const strengths = [];
    const focusAreas = [];

    for (const item of snapshot) {
      if (!item.active || item.stage.id === 'unexplored') continue;
      if (item.stage.id === 'mastered' || item.stage.id === 'consolidated') {
        strengths.push({
          axis: item.id,
          label: item.label,
          stageLabel: item.stage.label,
          text: `Mostres un domini ${item.stage.label.toLowerCase()} en ${item.label.toLowerCase()} (${item.totalCorrect} de ${item.totalAttempts} encerts).`
        });
      }
    }

    const errors = (session && session.errorLog) || [];
    const countByCode = new Map();
    const exampleByCode = new Map();
    for (const err of errors) {
      countByCode.set(err.code, (countByCode.get(err.code) || 0) + 1);
      if (!exampleByCode.has(err.code)) {
        exampleByCode.set(err.code, err);
      }
    }

    const hierarchyCodes = {
      md_before_as: {
        title: 'Prioritzar × i ÷ abans de + i −',
        tip: 'Abans de sumar o restar, escaneja tota l’expressió buscant multiplicacions i divisions.'
      },
      paren_first: {
        title: 'Resoldre primer els parèntesis ( )',
        tip: 'Entra sempre dins dels parèntesis abans de fer qualsevol operació de fora.'
      },
      inside_paren_priority: {
        title: 'Jerarquia dins dels parèntesis',
        tip: 'Dins d’un parèntesi s’aplica la mateixa piràmide: primer potències/arrels, després ×/÷ i al final +/−.'
      },
      pow_sqrt_before_md: {
        title: 'Potències i arrels abans que × i ÷',
        tip: 'Recorda que el segon graó de la piràmide (aⁿ i √) va sempre davant de multiplicar o dividir.'
      },
      pow_sqrt_before_as: {
        title: 'Potències i arrels abans que + i −',
        tip: 'Calcula primer les potències i arrels abans de sumar o restar.'
      },
      left_to_right_as: {
        title: "Ordre d'esquerra a dreta en + i −",
        tip: 'Quan només quedin sumes i restes, resol sempre la primera de l’esquerra (p. ex., en 10 − 4 + 2 fes primer 10 − 4).'
      },
      left_to_right_md: {
        title: "Ordre d'esquerra a dreta en × i ÷",
        tip: 'Quan tinguis × i ÷ seguides, comença sempre per l’esquerra.'
      }
    };

    for (const [code, meta] of Object.entries(hierarchyCodes)) {
      const count = countByCode.get(code) || 0;
      if (count > 0) {
        const ex = exampleByCode.get(code);
        focusAreas.push({
          kind: 'jerarquia',
          title: meta.title,
          count,
          tip: meta.tip,
          example: ex ? ex.expr : null
        });
      }
    }

    if ((countByCode.get('pow_mult_trap') || 0) > 0) {
      const ex = exampleByCode.get('pow_mult_trap');
      focusAreas.push({
        kind: 'calcul',
        title: 'Diferenciar potència de multiplicació',
        count: countByCode.get('pow_mult_trap'),
        tip: 'Recorda que 3² vol dir 3 × 3 = 9, i mai 3 × 2.',
        example: ex ? ex.expr : null
      });
    }

    if ((countByCode.get('sqrt_half_trap') || 0) > 0) {
      const ex = exampleByCode.get('sqrt_half_trap');
      focusAreas.push({
        kind: 'calcul',
        title: "No confondre l'arrel quadrada amb la meitat",
        count: countByCode.get('sqrt_half_trap'),
        tip: 'Per fer √25 busca quin nombre multiplicat per si mateix dona 25 (5 × 5 = 25).',
        example: ex ? ex.expr : null
      });
    }

    // Si hi ha algun eix actiu feble no cobert per patrons específics, l'afegim
    const weakest = OpComb.Continuum
      ? OpComb.Continuum.getWeakestActiveAxisFromSnapshot(snapshot)
      : null;

    if (focusAreas.length === 0 && weakest && weakest.stage.rank <= 2 && weakest.totalAttempts > 0) {
      focusAreas.push({
        kind: 'general',
        title: `Consolidar ${weakest.label}`,
        count: weakest.totalAttempts - weakest.totalCorrect,
        tip: `Amb una mica més de pràctica guiada en ${weakest.label.toLowerCase()} consolidaràs aquest eix.`,
        example: null
      });
    }

    if (strengths.length === 0) {
      strengths.push({
        axis: 'esforc',
        label: 'Constància i procés',
        stageLabel: 'Actiu',
        text: 'Has anat pas a pas construint la resolució en cascada. Cada intent consolida el teu aprenentatge!'
      });
    }

    const recommendedAxis = weakest ? weakest.id : 'jerarquia';

    return {
      strengths,
      focusAreas,
      recommendedAxis,
      totalErrors: errors.length
    };
  }

  OpComb.Hints = {
    diagnoseHierarchyError,
    diagnoseCalculationError,
    buildFormativeSummary
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
