# Operacions Combinades (Cicle Superior) - Estat i Documentació

## 1. Descripció i Especificacions del Projecte

- **Objectiu principal**: Desenvolupar una aplicació web educativa gamificada per repassar i consolidar la jerarquia de les operacions combinades a Cicle Superior de Primària (5è i 6è), alineada amb el currículum competencial de Catalunya (Decret 175/2022). L'eina combina reptes de dificultat progressiva amb resolució pas a pas guiada en cascada, una finestreta viva del *Contínuum de Coneixement* i un informe final eminentment formatiu.
- **Públic destinatari / Usuaris**: Alumnat de 5è i 6è de Primària (10-12 anys) i professorat d'aula. Optimitzada per a Chromebook, tauleta, ordinador d'escriptori i pissarra digital interactiva (PDI).
- **Stack tecnològic**:
  - **HTML5 semàntic**: primitives natives Baseline (`<dialog>`, `<details>`, `popover`).
  - **CSS3 modular**: design tokens, temes amb `[data-theme]`, Container Queries (`@container`), layout responsive i estils d'impressió dedicats (`@media print`).
  - **JavaScript (vanilla modular sense dependències)**: mòduls IIFE sota `OpComb` carregats amb `<script defer>` (compatible tant amb `file://` obrint `index.html` directament com amb servidor web); persistència local amb `localStorage` i efectes sonors opcionals amb Web Audio API.
- **Privacitat i llicenciament obligatori**:
  - Processament 100% local al navegador: no es recullen ni s'envien dades personals de l'alumnat a cap servidor extern.
  - Peu de pàgina obligatori en totes les pantalles: `© David Cordones · 2026`, llicència del codi **AGPL v3** i llicència de continguts educatius **CC BY-SA 4.0**.
- **Arquitectura i arbre de fitxers previst**:
  - `index.html`: Estructura principal semàntica i contenidors de vistes.
  - `favicon.svg`: Icona vectorial representativa de les quatre operacions (`+ − × ÷`).
  - `README.md`, `.nojekyll`, `.gitignore`: Documentació del repositori i preparació per a GitHub Pages.
  - `css/theme.css`: Variables de disseny, paletes cromàtiques per temàtica i tokens tipogràfics/d'accessibilitat.
  - `css/layout.css`: Graella principal (`main + aside`), adaptació responsive i Container Queries.
  - `css/components.css`: Estils de targetes, cascada interactiva, trofeus, barres del contínuum, diàlegs i peu de pàgina.
  - `css/print.css`: Full d'estil d'impressió/PDF net per a l'informe formatiu final.
  - `js/main.js`: Punt d'entrada, enrutament entre pantalles i coordinació de la sessió.
  - `js/themes.js`: Definició de les 5 temàtiques, narratives, icones/trofeus SVG i paletes.
  - `js/math/ast.js`: Representació en arbre sintàctic abstracte (AST), avaluació i reducció pas a pas.
  - `js/math/generator.js`: Generador procedimental d'expressions amb invariants estrictes de Primària.
  - `js/math/hints.js`: Classificador d'errors (jerarquia vs. càlcul vs. ordre) i generador de pistes formatives.
  - `js/math/reasoning.js`: Generador i avaluador per als modes de raonament (*Col·loca els parèntesis* i *Detecta l'error*).
  - `js/state/continuum.js`: Model del Contínuum de Coneixement (6 eixos, mitjana mòbil i estadis competencials).
  - `js/state/session.js`: Gestió de l'estat de partida, progrés de reptes, historial i `localStorage`.
  - `js/ui/setupView.js`: Pantalla inicial de selecció de curs/mode, personalització i temàtica.
  - `js/ui/gameView.js`: Tauler de resolució pas a pas en cascada i guia ràpida DUA.
  - `js/ui/reasoningView.js`: Tauler interactiu per als modes *Col·loca els parèntesis* i *Detecta l'error*.
  - `js/ui/assemblyView.js`: Activitat final de muntatge tipus trencaclosques amb micro-repàs de jerarquia.
  - `js/ui/continuumView.js`: Finestreta lateral/desplegable del Contínuum en temps real.
  - `js/ui/reportView.js`: Resum final formatiu, vitrina de trofeus, entrenament dirigit i impressió PDF.
  - `js/ui/sound.js`: Síntesi lleugera de feedback sonor via Web Audio API amb control de silenci.

---

## 2. Especificació Pedagògica i Funcional Acordada

### A. Selector inicial de curs i nivell
- **Mode 5è (Adaptat)**: 5 reptes progressius centrats en sumes, restes, multiplicacions, divisions, parèntesis i introducció controlada a potències quadrades (arrels desactivades per defecte, activables si es vol).
- **Mode 6è (Complet)**: 6 reptes progressius que integren totes les operacions: sumes, restes, multiplicacions, divisions, parèntesis (incloent-hi combinats), potències ($a^2, a^3, 10^n$) i arrels quadrades exactes fins a $\sqrt{144}$.
- **Mode Personalitzat**: Configuració docent/alumne per activar o desactivar operacions concretes i ajustar el nombre d'exercicis per repte (per defecte, **3 exercicis per repte**).

### B. 5 Temàtiques i sistema de trofeus col·leccionables
Seleccionables a l'inici de la sessió, cada repte superat desbloqueja un trofeu temàtic dins una vitrina visual:
1. **Missió Cosmos** (Espai): reparar i equipar una nau espacial (ex. *Escut de Parèntesis*, *Propulsor Exponencial*, *Nucli d'Arrel*, *Brúixola Estel·lar*...).
2. **El Gran Laboratori** (Alquímia / Ciència): descobrir fórmules i elements (ex. *Cristall de Prioritat*, *Poció Doble*, *Elixir Quadrat*, *Fórmula Mestra*...).
3. **Expedició Perduda** (Arqueologia): desxifrar inscripcions d'un temple antic (ex. *Clau de Pedra*, *Tòtem de l'Arrel*, *Medalló d'Or*, *Tresor del Temple*...).
4. **Mestre del Codi** (Robòtica / Ciberespai): assemblar i activar un robot peça a peça (ex. *Xip Lògic*, *Bateria de Potència*, *Sensor d'Arrels*, *Cervell Quàntic*...).
5. **Mode Clàssic (DUA)**: estètica neta de baix estímul visual amb medalles geomètriques discretes, pensada per a alumnat amb alta sensibilitat sensorial o necessitat de baixa distracció.

### C. Mecànica de resolució: Pas a pas guiat en cascada (Motor AST)
- **Invariants matemàtics estrictes de Primària**:
  - Tots els resultats intermedis i finals són nombres naturals ($\ge 0$).
  - Divisions sempre exactes (residu $0$).
  - Arrels quadrades sempre exactes ($\sqrt{4}$ fins a $\sqrt{144}$).
  - Valors intermedis controlats ($\le 200$) per garantir càlcul mental assolible.
- **Flux en dos micro-passos per cada reducció**:
  1. **Micro-pas 1 — Decisió de jerarquia**: l'alumne clica sobre l'operació prioritària de l'expressió actual. Si no és prioritària, el sistema identifica el tipus d'error de jerarquia (p. ex. sumar abans de multiplicar, ignorar un parèntesi, no respectar l'ordre d'esquerra a dreta) i mostra una pista formativa immediata.
  2. **Micro-pas 2 — Càlcul parcial**: un cop seleccionada l'operació correcta, l'alumne introdueix el resultat d'aquell bloc. Si falla, el classificador detecta patrons habituals (p. ex. confondre $3^2$ amb $3 \times 2$, errors de taules o arrels) i ofereix una pista específica; si encerta, l'expressió es reescriu en una nova línia reduïda en cascada fins a arribar al resultat final.

### D. Finestreta del Contínuum de Coneixement
- **Integració responsive**: panell lateral fix sempre visible en pantalles grans (`main + aside`) i pestanya desplegable accessible en tauleta i mòbil.
- **6 eixos competencials**:
  1. *Ordre i jerarquia*
  2. *Parèntesis `( )`*
  3. *Potències `aⁿ`*
  4. *Arrels quadrades `√`*
  5. *Multiplicacions i divisions `× ÷`*
  6. *Sumes i restes `+ -`*
- **Estadis evolutius (sense notes numèriques punitives)**: *Sense explorar* → *Iniciant* → *En procés* → *Consolidat* → *Dominat*.
- **Lògica de mentalitat de creixement**: cada eix es calcula mitjançant una mitjana mòbil ponderada dels darrers intents perquè els avenços recents es reflecteixin positivament en directe, acompanyats de micro-animacions respectuoses amb `prefers-reduced-motion`.

### E. Resum final eminentment formatiu
- **Vitrina de trofeus** aconseguits segons la temàtica escollida.
- **Mapa complet del Contínuum** amb l'estadi assolit a cada un dels 6 eixos.
- **Diagnòstic qualitatiu personalitzat**: blocs de *Punts forts* i *Consells per millorar* en llenguatge proper, diferenciant explícitament els errors de jerarquia dels errors de càlcul específic o d'ordre esquerra-dreta.
- **Historial revisable pas a pas**: acordió natiu (`<details>`) per desplegar els exercicis realitzats (especialment aquells amb pistes) i revisar la cascada completa.
- **Autoavaluació metacognitiva breu**: petit espai de reflexió per a l'alumne sobre el seu procés.
- **Entrenament Dirigit**: botó d'acció que genera automàticament una mini-sèrie de 3 reptes curts focalitzats en l'eix amb menys domini del contínuum.
- **Exportació / Impressió neta a PDF**: vista adaptada amb `@media print` i camp de nom opcional exclusivament per a l'imprès (no s'emmagatzema ni s'envia enlloc).

### F. Accessibilitat i DUA
- **Guia ràpida de la piràmide de jerarquia**: modal natiu (`<dialog>`) consultable en qualsevol moment des del tauler de joc.
- **Estàndard WCAG 2.1 AA**: contrast mínim 4.5:1, navegació completa per teclat i ús d'icones/text juntament amb el color per no dependre mai només del color.
- **Control sensorial**: botó de silenci per als efectes sonors i mode visual *Clàssic (DUA)* sense distraccions.

---

## 3. Estat Actual i Punt de Control (Darrera sessió: 2026-11-26)

- **Estat general**: V2.0 funcional amb 3 modalitats d'activitat (*Cascada guiada*, *Col·loca els parèntesis*, *Detecta l'error*), muntatge final tipus trencaclosques, enllaç docent preconfigurat per URL, mode clar/fosc/dispositiu i peu compacte.
- **Funcionalitats completades**:
  - [x] Definició tecnopedagògica completa (5 temàtiques, progressió 5è/6è/Personalitzat, mecànica pas a pas en cascada, Contínuum en 6 eixos i informe formatiu).
  - [x] Motor matemàtic AST (`js/math/ast.js`), generador procedimental amb invariants de Primària (`js/math/generator.js`), diagnòstic formatiu de pistes (`js/math/hints.js`) i motor de raonament (`js/math/reasoning.js`).
  - [x] Model del Contínuum amb mitjana mòbil ponderada (`js/state/continuum.js`), gestió de sessió amb `localStorage` i paràmetres d'URL compartibles (`js/state/session.js`) i 5 temàtiques amb trofeus i plànols SVG (`js/themes.js`).
  - [x] Interfície web responsive i accessible (`index.html`, `css/theme.css`, `css/layout.css`, `css/components.css`, `css/print.css`) amb guia ràpida `<dialog>`, panell mòbil del Contínuum en `<dialog>` natiu, selector d'aparença **Clar / Fosc / Dispositiu** (`color-scheme` + `light-dark()` amb persistència a `localStorage` i script anti-FOUC), diàleg de trofeu, control de so amb icones SVG i peu de llicències compacte (`© David Cordones · 2026`, AGPL v3 + CC BY-SA 4.0).
  - [x] Controladors de vistes (`setupView.js`, `gameView.js`, `reasoningView.js`, `assemblyView.js`, `continuumView.js`, `reportView.js`, `sound.js`, `main.js`) incloent-hi **Enllaç preconfigurat docent**, **Col·loca els parèntesis**, **Detecta l'error**, **Muntatge Final Interactiu**, *Entrenament Dirigit*, autoavaluació metacognitiva, historial desplegable `<details>` i impressió PDF (sempre en mode clar).
  - [x] Bateria automatitzada (`tests/verify-v1.js`) i proves E2E en Chrome headless: sintaxi JS vàlida, 1.380 exercicis en cascada + 420 reptes de raonament validats, regressió d'IDs/saneig de `localStorage`, enllaç preconfigurat URL, flux complet al DOM sense errors de consola, modes d'aparença, muntatge final i disseny responsive en escriptori (`1280×980`) i mòbil (`390×844`).
- **Punt exacte on ens hem quedat**:
  - S'han implementat l'enllaç preconfigurat docent (`?curs=&tema=&mode=&ex=&ops=&auto=`) amb botó *"Copiar enllaç per a la classe"* i els dos nous modes de raonament (*Col·loca els parèntesis* i *Detecta l'error*), publicats a GitHub Pages (`https://elcordones.github.io/operacions-combinades/`).
- **Decisions tècniques i incidències conegudes**:
  - Arquitectura 100% *client-side* basada en IIFEs sota l'espai de noms compartit `globalThis.OpComb` (carregats amb `<script defer>`), compatible tant amb doble clic sobre `index.html` (`file://`) com amb servidor web.
  - `AST.clone(node)` ara preserva `node.id`, i `Session` centralitza la inicialització d'exercicis a `createExerciseState` garantint IDs vàlids des del primer moment.
  - `navigateTo()` protegeix `document.startViewTransition` quan `document.hidden` és cert o la transició s'avorta (`InvalidStateError`) per evitar promeses rebutjades sense capturar.
  - Mode d'aparença implementat amb primitives Baseline (`<meta name="color-scheme" content="light dark">`, `color-scheme` i `light-dark()`) i forçat a `light` en `@media print`.
  - El full d'estils base s'anomena `css/theme.css` (en lloc de `tokens.css`) perquè el patró `*token*` de `.gitignore_global` no l'exclogui en fer `git add`.
  - Els recursos CSS/JS a `index.html` inclouen versió de caché (`?v=1.3`) i el diàleg del darrer trofeu blinda el pas a `#view-assembly` tant en `close` com en `submit`.

---

## 4. Full de Ruta d'Implementació (Roadmap / Propers Passos)

- **Fase 1 — Motor matemàtic AST, generador amb invariants i diagnòstic de pistes**:
  - [x] Implementar `js/math/ast.js`, `js/math/generator.js` i `js/math/hints.js`.
- **Fase 2 — Estat de sessió, Contínuum i 5 temàtiques**:
  - [x] Implementar `js/state/continuum.js`, `js/state/session.js` i `js/themes.js`.
- **Fase 3 — Interfície responsive, cascada interactiva i Contínuum en directe**:
  - [x] Maquetar `index.html` i `css/{theme,layout,components,print}.css` amb el peu de pàgina obligatori.
  - [x] Implementar `js/ui/{setupView,gameView,continuumView,sound}.js` i `js/main.js`.
- **Fase 4 — Informe formatiu final, entrenament dirigit i impressió PDF**:
  - [x] Implementar `js/ui/reportView.js` i `css/print.css`.
- **Fase 5 — Validació, muntatge final i reptes competencials (V2.0)**:
  - [x] Provar i corregir la V1 al navegador (escriptori 1280px, mòbil 390px, flux interactiu pas a pas i diàlegs).
  - [x] Publicar el repositori a GitHub i activar GitHub Pages (`https://elcordones.github.io/operacions-combinades/`).
  - [x] Afegir activitat final de muntatge tipus trencaclosques (`assemblyView.js`) per a les 5 temàtiques.
  - [x] Implementar enllaç preconfigurat per al docent (`?curs=...&tema=...&mode=...&ops=...`) i botó *"Copiar enllaç per a la classe"*.
  - [x] Implementar els modes de raonament *«Col·loca els parèntesis»* i *«Detecta l'error»* (`js/math/reasoning.js` + `js/ui/reasoningView.js`).
- **Fase 6 — Backlog i millores futures (V2.1 / V3)**:
  - [ ] Prova real a l'aula / impressió PDF en paper i recollida de feedback docent.
  - [ ] **Mini-problemes contextualitzats**: situació breu d'aula on triar l'expressió combinada correcta entre 3 opcions abans de resoldre-la pas a pas.
  - [ ] **Teclat numèric integrat en pantalla**: activable o automàtic en PDI/tauleta perquè el teclat virtual del sistema no tapi l'expressió al Pas 2.
  - [ ] **Lectura en veu alta de pistes (DUA)**: síntesi de veu en català (`Web Speech API ca-ES`) opcional a les pistes formatives i guia ràpida.
  - [ ] **Mode Pissarra Digital (PDI)**: ampliació de tipografia i vista neta d'exemple per a explicacions en gran grup.
  - [ ] **Àlbum / Col·lecció global dels 5 elements finals**: vitrina persistent a `localStorage` a la pantalla d'inici (*Nau*, *Fórmula*, *Temple*, *Robot*, *Piràmide*).
  - [ ] **Exportació i importació de sessió (`.json`)**: per continuar partides entre Chromebooks o desar còpies d'informe.
  - [ ] **Celebració visual discreta**: animació de confeti lleugera en completar el muntatge final respectant `prefers-reduced-motion`.
