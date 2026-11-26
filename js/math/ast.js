(function (global) {
  'use strict';

  const OpComb = (global.OpComb = global.OpComb || {});

  const OP_SYMBOLS = {
    '+': '+',
    '-': '−',
    '*': '×',
    '/': '÷'
  };

  const OP_NAMES_CA = {
    '+': 'suma',
    '-': 'resta',
    '*': 'multiplicació',
    '/': 'divisió'
  };

  function num(value) {
    return { type: 'num', value };
  }

  function bin(op, left, right) {
    return { type: 'bin', op, left, right };
  }

  function pow(base, exp) {
    return { type: 'pow', base, exp };
  }

  function sqrt(arg) {
    return { type: 'sqrt', arg };
  }

  function paren(inner) {
    return { type: 'paren', inner };
  }

  function clone(node) {
    if (!node || typeof node !== 'object') return node;
    let copy;
    switch (node.type) {
      case 'num':
        copy = num(node.value);
        break;
      case 'bin':
        copy = bin(node.op, clone(node.left), clone(node.right));
        break;
      case 'pow':
        copy = pow(clone(node.base), node.exp);
        break;
      case 'sqrt':
        copy = sqrt(clone(node.arg));
        break;
      case 'paren':
        copy = paren(clone(node.inner));
        break;
      default:
        throw new Error('Tipus de node desconegut: ' + node.type);
    }
    if (node.id !== undefined) copy.id = node.id;
    return copy;
  }

  function assignIds(root) {
    let counter = 1;
    function walkAssign(node) {
      const id = 'n' + counter++;
      if (node.type === 'num') {
        return { type: 'num', value: node.value, id };
      }
      if (node.type === 'bin') {
        return {
          type: 'bin',
          op: node.op,
          id,
          left: walkAssign(node.left),
          right: walkAssign(node.right)
        };
      }
      if (node.type === 'pow') {
        return {
          type: 'pow',
          exp: node.exp,
          id,
          base: walkAssign(node.base)
        };
      }
      if (node.type === 'sqrt') {
        return {
          type: 'sqrt',
          id,
          arg: walkAssign(node.arg)
        };
      }
      if (node.type === 'paren') {
        return {
          type: 'paren',
          id,
          inner: walkAssign(node.inner)
        };
      }
      throw new Error('Tipus de node desconegut: ' + node.type);
    }
    return walkAssign(root);
  }

  function evaluate(node) {
    if (!node) return NaN;
    switch (node.type) {
      case 'num':
        return Number.isInteger(node.value) && node.value >= 0 ? node.value : NaN;
      case 'paren':
        return evaluate(node.inner);
      case 'pow': {
        const b = evaluate(node.base);
        if (!Number.isInteger(b) || b < 0) return NaN;
        const res = Math.pow(b, node.exp);
        return Number.isSafeInteger(res) && res >= 0 ? res : NaN;
      }
      case 'sqrt': {
        const a = evaluate(node.arg);
        if (!Number.isInteger(a) || a < 0) return NaN;
        const r = Math.round(Math.sqrt(a));
        return r * r === a ? r : NaN;
      }
      case 'bin': {
        const l = evaluate(node.left);
        const r = evaluate(node.right);
        if (!Number.isInteger(l) || !Number.isInteger(r)) return NaN;
        switch (node.op) {
          case '+':
            return l + r;
          case '-':
            return l - r >= 0 ? l - r : NaN;
          case '*':
            return l * r;
          case '/':
            return r >= 1 && l % r === 0 ? l / r : NaN;
          default:
            return NaN;
        }
      }
      default:
        return NaN;
    }
  }

  function countOperations(node) {
    if (!node) return 0;
    switch (node.type) {
      case 'num':
        return 0;
      case 'paren':
        return countOperations(node.inner);
      case 'pow':
        return 1 + countOperations(node.base);
      case 'sqrt':
        return 1 + countOperations(node.arg);
      case 'bin':
        return 1 + countOperations(node.left) + countOperations(node.right);
      default:
        return 0;
    }
  }

  function validate(root, maxVal = 200) {
    if (!root) return false;
    if (countOperations(root) < 2) return false;

    let valid = true;
    function check(node) {
      if (!valid) return;
      const val = evaluate(node);
      if (!Number.isInteger(val) || val < 0 || val > maxVal) {
        valid = false;
        return;
      }
      if (node.type === 'bin') {
        if (node.op === '/') {
          const rVal = evaluate(node.right);
          if (!Number.isInteger(rVal) || rVal < 2) {
            valid = false;
            return;
          }
        }
        check(node.left);
        check(node.right);
      } else if (node.type === 'pow') {
        check(node.base);
      } else if (node.type === 'sqrt') {
        const aVal = evaluate(node.arg);
        if (!Number.isInteger(aVal) || aVal < 4) {
          valid = false;
          return;
        }
        check(node.arg);
      } else if (node.type === 'paren') {
        check(node.inner);
      }
    }

    check(root);
    if (!valid) return false;

    const assigned = assignIds(root);
    return getValidNextIds(assigned).size >= 1;
  }

  function getAxisForNode(node) {
    if (node.type === 'pow') return 'potencies';
    if (node.type === 'sqrt') return 'arrels';
    if (node.type === 'bin') {
      return node.op === '*' || node.op === '/' ? 'mult_div' : 'sum_rest';
    }
    return 'jerarquia';
  }

  function getTierForNode(node) {
    if (node.type === 'pow' || node.type === 'sqrt') return 3;
    if (node.type === 'bin') {
      return node.op === '*' || node.op === '/' ? 2 : 1;
    }
    return 0;
  }

  function getOperationInfo(root) {
    const infoList = [];
    const byId = new Map();

    function walk(node, parenDepth, parentId, parenGroupId) {
      if (!node || node.type === 'num') return;

      if (node.type === 'paren') {
        walk(node.inner, parenDepth + 1, node.id, node.id);
        return;
      }

      const isReady =
        (node.type === 'bin' && node.left.type === 'num' && node.right.type === 'num') ||
        (node.type === 'pow' && node.base.type === 'num') ||
        (node.type === 'sqrt' && node.arg.type === 'num');

      const info = {
        id: node.id,
        node,
        opType: node.type === 'bin' ? node.op : node.type,
        tier: getTierForNode(node),
        parenDepth,
        isReady,
        value: evaluate(node),
        axis: getAxisForNode(node),
        parentId: parentId || null,
        parenGroupId: parenGroupId || null
      };

      infoList.push(info);
      if (node.id) byId.set(node.id, info);

      if (node.type === 'bin') {
        walk(node.left, parenDepth, node.id, parenGroupId);
        walk(node.right, parenDepth, node.id, parenGroupId);
      } else if (node.type === 'pow') {
        if (node.base.type === 'num' || node.base.type === 'paren') {
          walk(node.base, parenDepth, node.id, parenGroupId);
        } else {
          walk(node.base, parenDepth + 1, node.id, node.id);
        }
      } else if (node.type === 'sqrt') {
        if (node.arg.type === 'num' || node.arg.type === 'paren') {
          walk(node.arg, parenDepth, node.id, parenGroupId);
        } else {
          walk(node.arg, parenDepth + 1, node.id, node.id);
        }
      }
    }

    walk(root, 0, null, null);
    return { list: infoList, byId };
  }

  function getValidNextIds(root) {
    const { list, byId } = getOperationInfo(root);
    const ready = list.filter((item) => item.isReady);
    if (ready.length === 0) return new Set();

    let maxDepth = -1;
    for (const item of ready) {
      if (item.parenDepth > maxDepth) maxDepth = item.parenDepth;
    }
    const deepest = ready.filter((item) => item.parenDepth === maxDepth);

    let maxTier = -1;
    for (const item of deepest) {
      if (item.tier > maxTier) maxTier = item.tier;
    }
    const highestTier = deepest.filter((item) => item.tier === maxTier);

    const valid = new Set();
    if (highestTier.length <= 1) {
      highestTier.forEach((item) => valid.add(item.id));
      return valid;
    }

    const first = highestTier[0];
    valid.add(first.id);

    const inOrder = [];
    function collectInOrder(node) {
      if (!node || node.type === 'num') return;
      if (node.type === 'paren') {
        collectInOrder(node.inner);
        return;
      }
      if (node.type === 'bin') {
        collectInOrder(node.left);
        inOrder.push(node);
        collectInOrder(node.right);
      } else if (node.type === 'pow') {
        collectInOrder(node.base);
        inOrder.push(node);
      } else if (node.type === 'sqrt') {
        inOrder.push(node);
        collectInOrder(node.arg);
      }
    }
    collectInOrder(root);

    const candidateIds = new Set(highestTier.map((i) => i.id));
    const firstIdx = inOrder.findIndex((n) => n.id === first.id);
    for (let idx = firstIdx + 1; idx < inOrder.length; idx++) {
      const n = inOrder[idx];
      if (!candidateIds.has(n.id)) continue;

      const info = byId.get(n.id);
      if (info && info.parenGroupId !== first.parenGroupId) {
        valid.add(n.id);
        continue;
      }

      let separated = false;
      for (let k = firstIdx + 1; k < idx; k++) {
        if (getTierForNode(inOrder[k]) < maxTier) {
          separated = true;
          break;
        }
      }
      if (separated) valid.add(n.id);
    }

    return valid;
  }

  function unwrapSingleParens(node) {
    if (!node) return node;
    if (node.type === 'num') return node;
    if (node.type === 'paren') {
      const inner = unwrapSingleParens(node.inner);
      if (inner.type === 'num') return inner;
      return paren(inner);
    }
    if (node.type === 'pow') {
      return pow(unwrapSingleParens(node.base), node.exp);
    }
    if (node.type === 'sqrt') {
      return sqrt(unwrapSingleParens(node.arg));
    }
    if (node.type === 'bin') {
      return bin(node.op, unwrapSingleParens(node.left), unwrapSingleParens(node.right));
    }
    return node;
  }

  function replaceNode(root, targetId, numericValue) {
    function walk(node) {
      if (!node) return node;
      if (node.id === targetId) {
        return num(numericValue);
      }
      if (node.type === 'paren') {
        return paren(walk(node.inner));
      }
      if (node.type === 'pow') {
        return pow(walk(node.base), node.exp);
      }
      if (node.type === 'sqrt') {
        return sqrt(walk(node.arg));
      }
      if (node.type === 'bin') {
        return bin(node.op, walk(node.left), walk(node.right));
      }
      return clone(node);
    }

    const replaced = walk(root);
    const unwrapped = unwrapSingleParens(replaced);
    return assignIds(unwrapped);
  }

  function supDigit(exp) {
    return exp === 2 ? '²' : exp === 3 ? '³' : '^' + exp;
  }

  function toPlainString(node) {
    if (!node) return '';
    switch (node.type) {
      case 'num':
        return String(node.value);
      case 'paren':
        return '(' + toPlainString(node.inner) + ')';
      case 'pow': {
        const baseStr =
          node.base.type === 'num'
            ? String(node.base.value)
            : node.base.type === 'paren'
              ? toPlainString(node.base)
              : '(' + toPlainString(node.base) + ')';
        return baseStr + supDigit(node.exp);
      }
      case 'sqrt': {
        if (node.arg.type === 'num') return '√' + node.arg.value;
        if (node.arg.type === 'paren') return '√' + toPlainString(node.arg);
        return '√(' + toPlainString(node.arg) + ')';
      }
      case 'bin':
        return toPlainString(node.left) + ' ' + OP_SYMBOLS[node.op] + ' ' + toPlainString(node.right);
      default:
        return '';
    }
  }

  function formatSubexpression(node) {
    return toPlainString(node);
  }

  function getAriaLabelForOp(node) {
    if (node.type === 'pow') {
      return toPlainString(node.base) + ' elevat a ' + node.exp;
    }
    if (node.type === 'sqrt') {
      return node.arg.type === 'num'
        ? 'arrel quadrada de ' + node.arg.value
        : 'arrel quadrada';
    }
    if (node.type === 'bin') {
      const name = OP_NAMES_CA[node.op] || node.op;
      if (node.left.type === 'num' && node.right.type === 'num') {
        return name + ': ' + node.left.value + ' ' + OP_SYMBOLS[node.op] + ' ' + node.right.value;
      }
      return name;
    }
    return 'operació';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderHtml(node, selectedId, disabled) {
    if (!node) return '';
    const isSelected = selectedId && node.id === selectedId;
    const selClass = isSelected ? ' is-selected' : '';
    const disAttr = disabled ? ' disabled' : '';

    if (node.type === 'num') {
      return '<span class="expr-num">' + node.value + '</span>';
    }

    if (node.type === 'paren') {
      return (
        '<span class="expr-paren">' +
        '<span class="expr-sym expr-sym--paren">(</span>' +
        renderHtml(node.inner, selectedId, disabled) +
        '<span class="expr-sym expr-sym--paren">)</span>' +
        '</span>'
      );
    }

    if (node.type === 'pow') {
      const label = escapeHtml(getAriaLabelForOp(node));
      if (node.base.type === 'num') {
        return (
          '<span class="expr-group' + selClass + '" data-group-id="' + node.id + '">' +
          '<button type="button" class="op-btn op-btn--pow' + selClass + '" data-node-id="' + node.id + '" aria-label="' + label + '" aria-pressed="' + (isSelected ? 'true' : 'false') + '"' + disAttr + '>' +
          '<span class="op-base">' + node.base.value + '</span><sup class="op-exp">' + node.exp + '</sup>' +
          '</button></span>'
        );
      }
      const innerHtml =
        node.base.type === 'paren'
          ? renderHtml(node.base, selectedId, disabled)
          : '<span class="expr-sym">(</span>' + renderHtml(node.base, selectedId, disabled) + '<span class="expr-sym">)</span>';
      return (
        '<span class="expr-group' + selClass + '" data-group-id="' + node.id + '">' +
        innerHtml +
        '<button type="button" class="op-btn op-btn--pow' + selClass + '" data-node-id="' + node.id + '" aria-label="' + label + '" aria-pressed="' + (isSelected ? 'true' : 'false') + '"' + disAttr + '>' +
        '<sup class="op-exp">' + node.exp + '</sup></button></span>'
      );
    }

    if (node.type === 'sqrt') {
      const label = escapeHtml(getAriaLabelForOp(node));
      if (node.arg.type === 'num') {
        return (
          '<span class="expr-group' + selClass + '" data-group-id="' + node.id + '">' +
          '<button type="button" class="op-btn op-btn--sqrt' + selClass + '" data-node-id="' + node.id + '" aria-label="' + label + '" aria-pressed="' + (isSelected ? 'true' : 'false') + '"' + disAttr + '>' +
          '<span class="op-sqrt-sym">√</span><span class="op-radicand">' + node.arg.value + '</span>' +
          '</button></span>'
        );
      }
      const innerHtml =
        node.arg.type === 'paren'
          ? renderHtml(node.arg, selectedId, disabled)
          : '<span class="expr-sym">(</span>' + renderHtml(node.arg, selectedId, disabled) + '<span class="expr-sym">)</span>';
      return (
        '<span class="expr-group' + selClass + '" data-group-id="' + node.id + '">' +
        '<button type="button" class="op-btn op-btn--sqrt' + selClass + '" data-node-id="' + node.id + '" aria-label="' + label + '" aria-pressed="' + (isSelected ? 'true' : 'false') + '"' + disAttr + '>' +
        '<span class="op-sqrt-sym">√</span></button>' +
        innerHtml +
        '</span>'
      );
    }

    if (node.type === 'bin') {
      const label = escapeHtml(getAriaLabelForOp(node));
      const sym = OP_SYMBOLS[node.op] || node.op;
      return (
        '<span class="expr-group' + selClass + '" data-group-id="' + node.id + '">' +
        renderHtml(node.left, selectedId, disabled) +
        '<button type="button" class="op-btn op-btn--bin' + selClass + '" data-node-id="' + node.id + '" aria-label="' + label + '" aria-pressed="' + (isSelected ? 'true' : 'false') + '"' + disAttr + '>' +
        sym +
        '</button>' +
        renderHtml(node.right, selectedId, disabled) +
        '</span>'
      );
    }

    return '';
  }

  function hasOperationType(root, typeFilter) {
    let found = false;
    function walk(node) {
      if (!node || found) return;
      if (node.type === typeFilter) {
        found = true;
        return;
      }
      if (node.type === 'bin' && (node.op === typeFilter || (typeFilter === 'mult_div' && (node.op === '*' || node.op === '/')) || (typeFilter === 'sum_rest' && (node.op === '+' || node.op === '-')))) {
        found = true;
        return;
      }
      if (node.type === 'bin') {
        walk(node.left);
        walk(node.right);
      } else if (node.type === 'pow') {
        walk(node.base);
      } else if (node.type === 'sqrt') {
        walk(node.arg);
      } else if (node.type === 'paren') {
        walk(node.inner);
      }
    }
    walk(root);
    return found;
  }

  OpComb.AST = {
    OP_SYMBOLS,
    num,
    bin,
    pow,
    sqrt,
    paren,
    clone,
    assignIds,
    evaluate,
    countOperations,
    validate,
    getAxisForNode,
    getTierForNode,
    getOperationInfo,
    getValidNextIds,
    replaceNode,
    toPlainString,
    formatSubexpression,
    renderHtml,
    hasOperationType
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
