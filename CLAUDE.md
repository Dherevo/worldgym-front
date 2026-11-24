# WorldGym front: guies d'UI i de feina

Guia curta perquè les pantalles noves quedin com la resta de l'app. Quan algú (l'usuari) corregeix un estil, s'afegeix aquí.

## Estructura
- Vue 3 amb `vue-facing-decorator`: cada pàgina o component són tres fitxers, `x.vue`, `x.ts` (classe) i `x.scss`.
- Pàgines a `src/pages/<nom>/`, components a `src/components/`, rutes a `src/config/routes.ts`, mòduls a `src/modules/`.
- Textos a `src/assets/translations/pages/*.ts` amb `ca`, `es` i `en`. Les variables sempre `{{nom}}` (mai `{nom}` ni `{{{nom}}}`). Cap text escrit directament a la plantilla.
- Icones: `<svg-icon name="heroicons-outline/…">`; comprova que existeixen a `public/svg-icons/`.
- Colors sempre amb variables CSS (`--surface-color`, `--surface-2`, `--border-color`, `--text-secondary`, `--text-muted`, `--primary-color`…). Hi ha temes per usuari: mai colors fixos, excepte semàntics (vermell d'error, groc de rècord).

## Pàgines i contenidors
- Pàgina de ruta: `<AppPage name="x-page" layout="backoffice">`.
- Subpàgina (no pestanya): arrel `div.stats-page` (porta el padding i el gap), una fila `.sub-top` amb `BackButton` **sense etiqueta** + `h1`, i el contingut en `.section-card`.
- Tornar: `if (window.history.state?.back) this.back(); else this.to('/ruta-per-defecte')`.
- **Mai una targeta dins d'una targeta.** Comprova si el component que poses ja és una targeta (`HabitsStreak` ho és).
- Una pàgina que abans vivia dins d'unes pestanyes perd el padding que li donava el contenidor: dona-li'l.
- Un bloc fill directe d'una pàgina més alt d'uns 9.800 px no es revela mai (`scrollReveal`): pagina les llistes llargues.

## Botons
- Accions d'una fila o targeta (editar, eliminar, compartir): **`SwipeRow`** (menú ⋯ o lliscar), no botons sueltos.
- Dins d'una taula: icones `✎ ✕` sense vora (com `.set-edit-btn` de l'entreno), amb `min-height: 0`. Al mòbil `button` té `min-height: 44px` global: sense `min-height: 0` s'estiren.
- Acció principal de la pantalla: botó ple amb el color primari; secundària: contorn.

## Taules
- Capçalera en majúscules petites: `th` 0.8rem, 700, `letter-spacing: .04em`, color `--text-muted`, vora `--border-color`. Cel·les: `padding: .45rem .75rem`, vora `--border-subtle`.
- A 375 px **han de cabre sense scroll horitzontal**: amaga o fusiona columnes a mòbil (p. ex. el descans sota el nom) i treu l'ansa d'arrossegar.

## Formularis
- Els camps numèrics amb − i + (`.number-input`, `.log-field`) només tenen estil dins `.log-form` (`workout.scss`). Si el poses fora, envolta'l.

## Gràfics (Chart.js)
- Barres per **setmana** (per **mes** en períodes llargs, per dia si són ≤ 14 dies) amb `src/modules/chartBuckets.ts`; mai per sessió (els pics enganyen).
- El període comença a l'inici de la primera setmana (`alignedStart`), perquè la primera barra no surti tallada o buida.
- Una mètrica = un gràfic amb xips (pes màxim, volum, repeticions), com Hevy. Pes màxim = màxim de la setmana; volum i reps = suma.
- 1RM (Epley) només amb sèries de fins a 10 repeticions.

## Navegació de l'app
- A l'app (`isApp`) hi ha barra de pestanyes a baix (s'amaga en baixar l'scroll) i `swipe-pager` per canviar de pestanya arrossegant. A la web, menú lateral.
- Progrés → Estadístiques és la pantalla d'inici amb botons a Calendari, Historial, Progressió i Hàbits (pàgines pròpies).
- Els noms d'exercici són enllaços a `/exercise/:id` (classe `exercise-link`).

## Trampes de CSS i de classe
- SCSS imbricat: una regla `@media` de fora perd contra la base si aquesta està més imbricada. Posa el `@media` **dins** de la mateixa regla.
- Camps de classe (`cur = this.index`) no veuen les props: inicialitza a `created()`. Una arrow function com a propietat de classe no té el `this` del component: usa mètodes.
- No deixis `transform` en repòs en contenidors amb modals `position: fixed` (els atrapa).
- `[class$="-page"]` porta una animació d'entrada: l'arrel d'una pàgina ha d'acabar en `-page` només si la vols.

## Flux de feina
- Abans de `master`: `npx eslint src` net.
- Branca `develop` → `git merge --no-ff develop` a `master` → push de totes dues (`master` desplega sol). **API primer, front després** si hi ha endpoint nou.
- Missatges de commit en català, **sense** `Co-Authored-By` ni atribució a Claude.
- APK de debug: `npx vite build --mode prod` → `npx cap sync android` → `./gradlew assembleDebug` (a `android/`) → `adb install -r`. Els fitxers de gradle d'Android que surten modificats no es commiten.
- Proves al mòbil: depuració pel WebView (`adb forward` + CDP). Si l'usuari el fa servir, les captures mostren el que ell fa.
