'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Carrega tots els mòduls de lògica i estat com al navegador
require(path.join(ROOT, 'js/math/ast.js'));
require(path.join(ROOT, 'js/math/generator.js'));
require(path.join(ROOT, 'js/math/hints.js'));
require(path.join(ROOT, 'js/math/reasoning.js'));
require(path.join(ROOT, 'js/themes.js'));
require(path.join(ROOT, 'js/state/continuum.js'));
require(path.join(ROOT, 'js/state/session.js'));

const { AST, Generator, Hints, Reasoning, Themes, Continuum, Session } = globalThis.OpComb;

console.log('1. Comprovant integritat d’index.html i peu de pàgina obligatori...');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
assert(html.includes('© David Cordones · 2026'), 'Falta atribució obligatòria');
assert(html.includes('AGPL v3'), 'Falta llicència AGPL v3');
assert(html.includes('CC BY-SA 4.0'), 'Falta llicència CC BY-SA 4.0');
assert(html.includes('https://mirrors.creativecommons.org/presskit/buttons/88x31/svg/by-sa.svg'), 'Falta badge oficial CC BY-SA 4.0');
assert(html.includes('href="favicon.svg"'), 'Falta enllaç a favicon.svg');
assert(fs.existsSync(path.join(ROOT, 'favicon.svg')), 'Fitxer favicon.svg no trobat');
assert(fs.readFileSync(path.join(ROOT, 'favicon.svg'), 'utf8').includes('<svg'), 'favicon.svg no conté SVG vàlid');

// Verifica que tots els CSS, JS i recursos locals referenciats existeixen i usen rutes relatives (compatibles amb GitHub Pages)
const localRefs = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((u) => !u.startsWith('http://') && !u.startsWith('https://') && !u.startsWith('#'));
for (const ref of localRefs) {
  assert(!ref.startsWith('/'), 'Ruta absoluta incompatible amb subdirectori de GitHub Pages: ' + ref);
}
const assetRefs = [...html.matchAll(/(?:href|src)="(css\/[^"]+|js\/[^"]+)"/g)].map((m) => m[1]);
assert(assetRefs.length >= 15, 'Nombre inesperat de referències locals');
for (const rel of assetRefs) {
  const cleanRel = rel.split('?')[0];
  const full = path.join(ROOT, cleanRel);
  assert(fs.existsSync(full), 'Fitxer referenciat no trobat: ' + rel);
}

console.log('2. Comprovant les 5 temàtiques, els 6 trofeus i els plànols de muntatge...');
const themes = Themes.getAllThemes();
assert.strictEqual(themes.length, 5, 'Hi ha d’haver 5 temàtiques');
for (const t of themes) {
  assert.strictEqual(t.trophies.length, 6, `La temàtica ${t.id} ha de tenir 6 trofeus`);
  for (const tr of t.trophies) {
    assert(tr.svg.includes('<svg'), `Trofeu ${tr.id} sense SVG`);
  }
  assert(t.assembly && t.assembly.blueprintSvg.includes('<svg'), `Temàtica ${t.id} sense blueprintSvg`);
  assert(t.assembly && t.assembly.finalSvg.includes('<svg'), `Temàtica ${t.id} sense finalSvg`);
  assert.strictEqual(t.assembly.slots.length, 6, `Temàtica ${t.id} ha de tenir 6 ranures`);
}

console.log('3. Stress-test del generador i resolució en cascada (1.200 exercicis)...');
const configs = [
  { course: '5e', themeId: 'cosmos', exercisesPerChallenge: 3 },
  { course: '6e', themeId: 'lab', exercisesPerChallenge: 3 },
  { course: 'custom', themeId: 'expedicio', exercisesPerChallenge: 3, customOps: { mult_div: false, parentesis: true, potencies: false, arrels: false } },
  { course: 'custom', themeId: 'codi', exercisesPerChallenge: 3, customOps: { mult_div: true, parentesis: false, potencies: true, arrels: true } },
  { course: 'custom', themeId: 'classic', exercisesPerChallenge: 3, customOps: { mult_div: true, parentesis: true, potencies: false, arrels: true } }
];

let totalSolved = 0;
for (const cfg of configs) {
  const challenges = Generator.getChallengesForConfig(cfg);
  const seen = new Set();
  for (const ch of challenges) {
    for (let i = 0; i < 60; i++) {
      const ast = Generator.generateExercise(ch, seen);
      assert(AST.validate(ast, 200), `Expressió invàlida a ${ch.level}: ${AST.toPlainString(ast)}`);
      const directVal = AST.evaluate(ast);
      assert(Number.isInteger(directVal) && directVal >= 0 && directVal <= 200, `Valor fora de rang: ${directVal}`);

      // Resol pas a pas en cascada seguint getValidNextIds
      let cur = AST.assignIds(ast);
      let guard = 0;
      while (cur.type !== 'num') {
        guard++;
        assert(guard < 20, 'Massa passos en cascada');
        const validIds = AST.getValidNextIds(cur);
        assert(validIds.size >= 1, `Sense operacions vàlides a: ${AST.toPlainString(cur)}`);
        const nextId = Array.from(validIds)[0];
        const { byId } = AST.getOperationInfo(cur);
        const info = byId.get(nextId);
        assert(info && info.isReady, 'El node seleccionat no està llest');
        assert(Number.isInteger(info.value) && info.value >= 0 && info.value <= 200, 'Resultat intermedi fora de rang');
        cur = AST.replaceNode(cur, nextId, info.value);
      }
      assert.strictEqual(cur.value, directVal, 'La cascada no coincideix amb evaluate()');
      totalSolved++;
    }
  }
}

// També provem generateTargetedExercises per als 6 eixos
for (const axis of ['jerarquia', 'parentesis', 'potencies', 'arrels', 'mult_div', 'sum_rest']) {
  const list = Generator.generateTargetedExercises(axis, { course: '6e' }, 5);
  assert.strictEqual(list.length, 5);
  for (const ast of list) {
    assert(AST.validate(ast, 200), `Targeted ${axis} invàlid`);
  }
}
console.log(`   -> ${totalSolved} exercicis generats, validats i resolts en cascada al 100%!`);

console.log('4. Comprovant diagnòstics formatius (jerarquia i càlcul)...');
// Cas 1: 10 - 4 + 2 -> clicar '+' abans que '-' ha de detectar left_to_right_as
{
  const ast = AST.assignIds(AST.bin('+', AST.bin('-', AST.num(10), AST.num(4)), AST.num(2)));
  const plusId = ast.id;
  const diag = Hints.diagnoseHierarchyError(ast, plusId);
  assert.strictEqual(diag.code, 'left_to_right_as');
}

// Cas 2: 3 + 4 * 2 -> clicar '+' ha de detectar md_before_as
{
  const ast = AST.assignIds(AST.bin('+', AST.num(3), AST.bin('*', AST.num(4), AST.num(2))));
  const diag = Hints.diagnoseHierarchyError(ast, ast.id);
  assert.strictEqual(diag.code, 'md_before_as');
}

// Cas 3: (3 + 4) * 2 -> clicar '*' ha de detectar paren_first
{
  const ast = AST.assignIds(AST.bin('*', AST.paren(AST.bin('+', AST.num(3), AST.num(4))), AST.num(2)));
  const diag = Hints.diagnoseHierarchyError(ast, ast.id);
  assert.strictEqual(diag.code, 'paren_first');
  assert.strictEqual(diag.extraAxis, 'parentesis');
}

// Cas 4: 3^2 escrit com 6 -> pow_mult_trap
{
  const pNode = AST.pow(AST.num(3), 2);
  const diag = Hints.diagnoseCalculationError(pNode, 6);
  assert.strictEqual(diag.code, 'pow_mult_trap');
}

// Cas 5: sqrt(16) escrit com 8 -> sqrt_half_trap
{
  const sNode = AST.sqrt(AST.num(16));
  const diag = Hints.diagnoseCalculationError(sNode, 8);
  assert.strictEqual(diag.code, 'sqrt_half_trap');
}

console.log('5. Comprovant el model del Contínuum (mentalitat de creixement)...');
{
  const cState = Continuum.createInitial(new Set(['jerarquia', 'potencies', 'sum_rest']));
  let snap = Continuum.getSnapshot(cState);
  assert.strictEqual(snap.find((a) => a.id === 'potencies').stage.id, 'unexplored');

  // Falla 2 cops al principi i després encerta 6 cops seguits -> ha d'arribar a Dominat
  Continuum.recordAttempt(cState, 'potencies', false);
  Continuum.recordAttempt(cState, 'potencies', false);
  for (let i = 0; i < 6; i++) Continuum.recordAttempt(cState, 'potencies', true);
  snap = Continuum.getSnapshot(cState);
  assert.strictEqual(snap.find((a) => a.id === 'potencies').stage.id, 'mastered');
}

console.log('6. Comprovant flux de sessió complet i regressió d’IDs / renderitzat...');
function assertAstHasIds(node) {
  assert(node && typeof node.id === 'string' && node.id.length > 0, 'Node sense ID: ' + JSON.stringify(node));
  if (node.type === 'bin') {
    assertAstHasIds(node.left);
    assertAstHasIds(node.right);
  } else if (node.type === 'pow') {
    assertAstHasIds(node.base);
  } else if (node.type === 'sqrt') {
    assertAstHasIds(node.arg);
  } else if (node.type === 'paren') {
    assertAstHasIds(node.inner);
  }
}

{
  const sess = Session.createSession({ course: '5e', themeId: 'cosmos', exercisesPerChallenge: 2 });
  assert.strictEqual(sess.challenges.length, 5);
  assertAstHasIds(sess.currentExercise.currentAst);
  assert(!AST.renderHtml(sess.currentExercise.currentAst).includes('undefined'), 'renderHtml conté undefined en createSession');
  assert(AST.getValidNextIds(sess.currentExercise.currentAst).size >= 1);
  for (const vid of AST.getValidNextIds(sess.currentExercise.currentAst)) {
    assert.strictEqual(typeof vid, 'string');
    assert.notStrictEqual(vid, 'undefined');
  }

  const res1 = Session.advanceAfterExerciseComplete(sess);
  assert.strictEqual(res1.event, 'next_exercise');
  assertAstHasIds(sess.currentExercise.currentAst);
  assert(!AST.renderHtml(sess.currentExercise.currentAst).includes('undefined'));

  const res2 = Session.advanceAfterExerciseComplete(sess);
  assert.strictEqual(res2.event, 'challenge_done');
  assert.strictEqual(res2.trophyIdx, 0);
  assert.deepStrictEqual(sess.trophies, [0]);
  assertAstHasIds(sess.currentExercise.currentAst);

  Session.startTargetedTraining(sess, 'jerarquia');
  assertAstHasIds(sess.currentExercise.currentAst);
  assert(!AST.renderHtml(sess.currentExercise.currentAst).includes('undefined'));

  // Comprova la transició final cap a 'assembly' en completar tots els reptes
  const sessFull = Session.createSession({ course: '5e', themeId: 'lab', exercisesPerChallenge: 1 });
  assert.strictEqual(sessFull.assemblyCompleted, false);
  assert.deepStrictEqual(sessFull.assemblyPlaced, []);
  let lastOutcome = null;
  for (let i = 0; i < sessFull.challenges.length; i++) {
    lastOutcome = Session.advanceAfterExerciseComplete(sessFull);
  }
  assert.strictEqual(lastOutcome.event, 'session_done');
  assert.strictEqual(sessFull.view, 'assembly');
  assert.strictEqual(sessFull.trophies.length, sessFull.challenges.length);
}

console.log('7. Comprovant saneig de localStorage antic, dobles parèntesis i parèntesis independents...');
{
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k)
  };

  const broken = Session.createSession({ course: '6e', themeId: 'lab', exercisesPerChallenge: 3 });
  // Simulem una sessió antiga guardada sense IDs a currentAst ni initialAst
  function stripIds(node) {
    const copy = Object.assign({}, node);
    delete copy.id;
    if (copy.left) copy.left = stripIds(copy.left);
    if (copy.right) copy.right = stripIds(copy.right);
    if (copy.base) copy.base = stripIds(copy.base);
    if (copy.arg) copy.arg = stripIds(copy.arg);
    if (copy.inner) copy.inner = stripIds(copy.inner);
    return copy;
  }
  broken.currentExercise.initialAst = stripIds(broken.currentExercise.initialAst);
  broken.currentExercise.currentAst = stripIds(broken.currentExercise.currentAst);
  broken.currentExercise.selectedNodeId = 'undefined';
  Session.saveSession(broken);

  const repaired = Session.loadSession();
  assert(repaired, 'loadSession ha de recuperar la sessió');
  assertAstHasIds(repaired.currentExercise.initialAst);
  assertAstHasIds(repaired.currentExercise.currentAst);
  assert.strictEqual(repaired.currentExercise.selectedNodeId, null);
  assert(!AST.renderHtml(repaired.currentExercise.currentAst).includes('undefined'));
  delete globalThis.localStorage;
}

{
  const powParen = AST.assignIds(AST.pow(AST.paren(AST.bin('+', AST.num(3), AST.num(4))), 2));
  assert.strictEqual(AST.toPlainString(powParen), '(3 + 4)²');
  assert(!AST.renderHtml(powParen).includes('(('));

  const sqrtParen = AST.assignIds(AST.sqrt(AST.paren(AST.bin('+', AST.num(9), AST.num(16)))));
  assert.strictEqual(AST.toPlainString(sqrtParen), '√(9 + 16)');
  assert(!AST.renderHtml(sqrtParen).includes('(('));

  const leftParenInner = AST.bin('+', AST.num(4), AST.num(3));
  const rightParenInner = AST.bin('-', AST.num(9), AST.num(5));
  const mulNode = AST.bin('*', AST.paren(leftParenInner), AST.paren(rightParenInner));
  const fullAst = AST.assignIds(AST.bin('-', mulNode, AST.sqrt(AST.num(36))));
  const valid = AST.getValidNextIds(fullAst);
  const { list } = AST.getOperationInfo(fullAst);
  const leftId = list.find((i) => i.opType === '+' && i.parenDepth === 1).id;
  const rightId = list.find((i) => i.opType === '-' && i.parenDepth === 1).id;
  const mulId = list.find((i) => i.opType === '*').id;
  const sqrtId = list.find((i) => i.opType === 'sqrt').id;
  assert(valid.has(leftId), 'Ha d’acceptar (4 + 3)');
  assert(valid.has(rightId), 'Ha d’acceptar (9 − 5)');
  assert(!valid.has(mulId), 'No pot acceptar × abans dels parèntesis');
  assert(!valid.has(sqrtId), 'No pot acceptar √36 abans dels parèntesis');
}

console.log('8. Comprovant enllaç preconfigurat docent (URL) i modes de raonament (200+200 reptes)...');
{
  const cfg = {
    course: 'custom',
    themeId: 'codi',
    mode: 'parentesis',
    exercisesPerChallenge: 4,
    customOps: { mult_div: true, parentesis: true, potencies: false, arrels: false }
  };
  const urlStr = Session.buildShareUrl('https://elcordones.github.io/operacions-combinades/index.html', cfg);
  const parsed = Session.parseUrlConfig(new URL(urlStr).search);
  assert(parsed, 'parseUrlConfig ha de llegir la URL generada');
  assert.strictEqual(parsed.course, 'custom');
  assert.strictEqual(parsed.themeId, 'codi');
  assert.strictEqual(parsed.mode, 'parentesis');
  assert.strictEqual(parsed.customOps.mult_div, true);
  assert.strictEqual(parsed.customOps.potencies, false);
  assert.strictEqual(Session.parseUrlConfig(''), null);

  const testConfigs = [
    { course: '5e', themeId: 'cosmos', mode: 'parentesis' },
    { course: '6e', themeId: 'lab', mode: 'parentesis' },
    { course: 'custom', themeId: 'classic', mode: 'parentesis', customOps: { mult_div: false, parentesis: true, potencies: false, arrels: false } }
  ];
  let parenCount = 0;
  for (const c of testConfigs) {
    const seen = new Set();
    for (let i = 0; i < 70; i++) {
      const p = Reasoning.generateParenPuzzle(c, seen);
      assert.notStrictEqual(p.valNoParens, p.target, 'El resultat sense parèntesis ha de diferir de target');
      assert.strictEqual(
        Reasoning.evaluateFlatWithParens(p.terms, p.ops, p.solution[0], p.solution[1]),
        p.target,
        'La solució ha d’avaluar exactament a target'
      );
      parenCount++;
    }
  }

  let errCount = 0;
  for (const c of testConfigs) {
    const seen = new Set();
    for (let i = 0; i < 70; i++) {
      const e = Reasoning.generateErrorPuzzle(c, seen);
      assert.notStrictEqual(e.wrongFinal, e.correctFinal, 'El resultat erroni ha de diferir del correcte');
      assert.strictEqual(e.options.length, 3, 'Calen 3 opcions');
      assert.strictEqual(e.options.filter((o) => o.isCorrect).length, 1, 'Exactament 1 opció correcta');
      assert(e.bugStepIdx >= 0 && e.bugStepIdx < e.buggySteps.length);
      errCount++;
    }
  }

  // Persistència sessió de raonament
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k)
  };
  const rSess = Session.createReasoningSession({ course: '6e', themeId: 'expedicio', mode: 'error' });
  assert.strictEqual(rSess.reasoning.exercises.length, 6);
  Session.saveSession(rSess);
  const rLoaded = Session.loadSession();
  assert(rLoaded && rLoaded.mode === 'error' && rLoaded.reasoning.exercises.length === 6);
  delete globalThis.localStorage;

  console.log(`   -> ${parenCount} reptes de parèntesis i ${errCount} de detecció d’errors validats!`);
}

console.log('TOTES LES PROVES DE V1 HAN PASSAT CORRECTAMENT!');
