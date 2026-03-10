/**
 * PATCH v4 — Start screens + menu buttons + canvas resize
 * Запускается ПОСЛЕ games.js
 * Не трогает логику игр — только UI оболочку
 */
(function(){
'use strict';

/* ════════════════════════════════════════════
   УТИЛИТЫ
════════════════════════════════════════════ */
const $ = id => document.getElementById(id);
const qsa = (sel, ctx) => Array.from((ctx||document).querySelectorAll(sel));

/* ════════════════════════════════════════════
   СТАРТОВЫЙ ЭКРАН — создаём для каждой игры
   Вставляем ПЕРЕД игровым контентом
════════════════════════════════════════════ */

const GAME_CONFIGS = {
  puzzle: {
    icon: '🧩',
    title: 'Пазл «Петропавловск»',
    desc: 'Собери картинку достопримечательности города, переставляя кусочки!',
    optGroups: [
      {
        label: 'Выбери картинку:',
        key: 'img',
        opts: [
          { val:'ablai', label:'🏰 Резиденция' },
          { val:'park',  label:'🌳 Парк' },
          { val:'sobor', label:'⛪ Собор' },
          { val:'step',  label:'🌇 Степь' },
        ]
      },
      {
        label: 'Сложность:',
        key: 'grid',
        opts: [
          { val:'3', label:'3×3 · Лёгкий' },
          { val:'4', label:'4×4 · Средний' },
          { val:'5', label:'5×5 · Сложный' },
        ]
      }
    ],
  },
  memory: {
    icon: '🃏',
    title: '«Найди пару»',
    desc: 'Переворачивай карточки и находи одинаковые пары. Тренируй память!',
    optGroups: [
      {
        label: 'Набор карточек:',
        key: 'memset',
        opts: [
          { val:'animals', label:'🐆 Животные' },
          { val:'sights',  label:'🏛 Достопримечательности' },
          { val:'nature',  label:'🌿 Природа' },
          { val:'objects', label:'🏠 Предметы' },
        ]
      }
    ],
  },
  quiz: {
    icon: '❓',
    title: 'Знаю свой город!',
    desc: '14 вопросов о Петропавловске и Казахстане. Каждая игра — случайные 10 вопросов!',
    badges: ['🏙 Краеведение', '🌿 Природа', '🎨 Традиции'],
  },
  coloring: {
    icon: '🎨',
    title: 'Раскраска «Казахстан»',
    desc: 'Выбери картинку, возьми кисть и раскрась! Сохрани свой шедевр!',
    optGroups: [
      {
        label: 'Выбери сцену:',
        key: 'scene',
        opts: [
          { val:'0', label:'🏠 Юрта' },
          { val:'1', label:'🌄 Степь' },
          { val:'2', label:'🔷 Орнамент' },
          { val:'3', label:'🐆 Животные' },
          { val:'4', label:'🏙 Закат в городе' },
        ]
      }
    ],
  },
  sort: {
    icon: '📦',
    title: 'Разложи по группам!',
    desc: 'Нажми на предмет — он выделится. Затем нажми на нужную корзину!',
    optGroups: [
      {
        label: 'Выбери набор:',
        key: 'sortmode',
        opts: [
          { val:'seasons', label:'🍂 Времена года' },
          { val:'animals', label:'🐺 Дикие / Домашние' },
          { val:'sizes',   label:'🔴 Большой / Маленький' },
          { val:'food',    label:'🍎 Фрукты / Овощи' },
        ]
      }
    ],
  },
};

/* Выбранные значения на стартовых экранах */
const startSelections = {
  puzzle: { img:'ablai', grid:'3' },
  memory: { memset:'animals' },
  quiz:   {},
  coloring: { scene:'0' },
  sort:   { sortmode:'seasons' },
};

function buildStartScreen(gameId, cfg) {
  const panel = $('game-' + gameId);
  if (!panel) return;

  // Враппер start screen
  const ss = document.createElement('div');
  ss.id = 'gss-' + gameId;
  ss.className = 'gss-overlay';

  let optsHtml = '';

  if (cfg.badges) {
    optsHtml += `<div class="gss-info-badges">` +
      cfg.badges.map(b => `<div class="gss-badge">${b}</div>`).join('') +
      `</div>`;
  }

  if (cfg.optGroups) {
    cfg.optGroups.forEach(group => {
      optsHtml += `<span class="gss-opts-label">${group.label}</span>`;
      optsHtml += `<div class="gss-opts-row">`;
      group.opts.forEach((opt, i) => {
        const defaultKey = group.key;
        const isActive = startSelections[gameId][defaultKey] === opt.val ? ' active' : '';
        optsHtml += `<button class="gss-opt${isActive}" data-key="${group.key}" data-val="${opt.val}">${opt.label}</button>`;
      });
      optsHtml += `</div>`;
    });
  }

  ss.innerHTML = `
    <div class="gss-card">
      <span class="gss-big-icon">${cfg.icon}</span>
      <h2>${cfg.title}</h2>
      <p>${cfg.desc}</p>
      ${optsHtml}
      <button class="gss-play-btn" id="gss-play-${gameId}">▶ Начать игру!</button>
    </div>`;

  // Вставляем В НАЧАЛО panel
  panel.insertBefore(ss, panel.firstChild);

  // Клики по опциям
  qsa('.gss-opt', ss).forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key;
      // deactivate same-group
      qsa(`.gss-opt[data-key="${key}"]`, ss).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      startSelections[gameId][key] = btn.dataset.val;
    });
  });

  // PLAY button
  $('gss-play-' + gameId).addEventListener('click', () => {
    applySelectionsAndStart(gameId);
  });
}

function applySelectionsAndStart(gameId) {
  const sel = startSelections[gameId];
  // Hide start screen, show game content
  const ss = $('gss-' + gameId);
  if (ss) ss.style.display = 'none';
  showGameContent(gameId, true);

  // Apply selections and (re)start the game
  switch(gameId) {
    case 'puzzle':
      // Set image thumbnail active
      qsa('.pthumb').forEach(b => b.classList.toggle('active', b.dataset.img === sel.img));
      // Set difficulty active
      qsa('.puzzle-difficulty .diff-btn').forEach(b => b.classList.toggle('active', b.dataset.grid === sel.grid));
      // Update PS state via clicking the active buttons (triggers existing logic)
      const imgBtn = document.querySelector(`.pthumb[data-img="${sel.img}"]`);
      const diffBtn = document.querySelector(`.puzzle-difficulty .diff-btn[data-grid="${sel.grid}"]`);
      if (imgBtn) { imgBtn.click(); return; } // triggers puzzleInit internally
      break;
    case 'memory':
      const memBtn = document.querySelector(`[data-memset="${sel.memset}"]`);
      if (memBtn) { memBtn.click(); return; }
      break;
    case 'quiz':
      const qrBtn = $('quiz-restart');
      if (qrBtn) { qrBtn.click(); return; }
      break;
    case 'coloring':
      // Select scene
      const sceneIdx = parseInt(sel.scene || '0');
      const sceneThumb = document.querySelectorAll('.coloring-thumb')[sceneIdx];
      if (sceneThumb) { sceneThumb.click(); }
      break;
    case 'sort':
      const sortBtn = document.querySelector(`[data-sortmode="${sel.sortmode}"]`);
      if (sortBtn) { sortBtn.click(); return; }
      break;
  }
}

function showGameContent(gameId, show) {
  const panel = $('game-' + gameId);
  if (!panel) return;
  // All direct children except start screen
  Array.from(panel.children).forEach(child => {
    if (child.id === 'gss-' + gameId) return;
    child.style.display = show ? '' : 'none';
  });
}

function showStartScreen(gameId) {
  const ss = $('gss-' + gameId);
  if (ss) ss.style.display = '';
  showGameContent(gameId, false);
}

/* Build all start screens */
Object.entries(GAME_CONFIGS).forEach(([id, cfg]) => {
  buildStartScreen(id, cfg);
  // Initially hide game content
  showGameContent(id, false);
});

/* ════════════════════════════════════════════
   «В МЕНЮ» кнопки в заголовках игр
════════════════════════════════════════════ */
const MENU_BTN_MAP = {
  puzzle:   'puzzle-new',
  memory:   'mem-new',
  quiz:     'quiz-restart',
  coloring: 'color-new',
  sort:     'sort-new',
};

Object.keys(GAME_CONFIGS).forEach(gameId => {
  // Find existing game-controls-top in this game panel
  const panel = $('game-' + gameId);
  if (!panel) return;
  const ctrl = panel.querySelector('.game-controls-top');
  if (!ctrl) return;

  // Insert «В меню» button before existing buttons
  const btn = document.createElement('button');
  btn.className = 'btn-to-menu';
  btn.title = 'В меню игры';
  btn.innerHTML = '⌂';
  btn.addEventListener('click', () => {
    showStartScreen(gameId);
    // Stop any running timers/state
    if (gameId === 'puzzle') {
      const ni = document.getElementById('puzzle-new');
      // Just hide win overlay if visible
      const wo = document.getElementById('puzzle-win');
      if (wo) wo.classList.add('hidden');
    }
    if (gameId === 'quiz') {
      // reset quiz view
      const qa = $('quiz-question-area');
      const qf = $('quiz-finish-area');
      if (qa) qa.classList.remove('hidden');
      if (qf) qf.classList.add('hidden');
    }
    // Hide win overlays
    ['puzzle-win','memory-win','sort-win'].forEach(id => {
      const el = $(id); if (el) el.classList.add('hidden');
    });
  });

  // Insert as first child of controls
  ctrl.insertBefore(btn, ctrl.firstChild);
});

/* ════════════════════════════════════════════
   WIN OVERLAYS — add «В меню» secondary button
════════════════════════════════════════════ */
function addMenuToWin(winId, gameId) {
  const winBox = document.querySelector(`#${winId} .win-box`);
  if (!winBox) return;
  // Wrap existing win-btn in .win-btns if not already
  const existingBtn = winBox.querySelector('.win-btn');
  if (!existingBtn) return;
  if (existingBtn.parentElement.classList.contains('win-btns')) return; // already done

  const wrapper = document.createElement('div');
  wrapper.className = 'win-btns';
  existingBtn.parentElement.insertBefore(wrapper, existingBtn);
  wrapper.appendChild(existingBtn);

  const menuBtn = document.createElement('button');
  menuBtn.className = 'win-btn win-btn-sec';
  menuBtn.textContent = '⌂ В меню';
  menuBtn.addEventListener('click', () => {
    document.getElementById(winId).classList.add('hidden');
    showStartScreen(gameId);
  });
  wrapper.appendChild(menuBtn);
}

addMenuToWin('puzzle-win',  'puzzle');
addMenuToWin('memory-win',  'memory');
addMenuToWin('sort-win',    'sort');

/* Quiz finish — add menu button */
(function(){
  const fa = $('quiz-finish-area');
  if (!fa) return;
  const btn = fa.querySelector('.win-btn');
  if (!btn || btn.parentElement.classList.contains('win-btns')) return;
  const wrap = document.createElement('div');
  wrap.className = 'win-btns';
  btn.parentElement.insertBefore(wrap, btn);
  wrap.appendChild(btn);
  const mb = document.createElement('button');
  mb.className = 'win-btn win-btn-sec';
  mb.textContent = '⌂ В меню';
  mb.addEventListener('click', () => {
    fa.classList.add('hidden');
    $('quiz-question-area') && $('quiz-question-area').classList.remove('hidden');
    showStartScreen('quiz');
  });
  wrap.appendChild(mb);
})();

/* ════════════════════════════════════════════
   CANVAS — responsive resize on window resize
════════════════════════════════════════════ */
function resizeCanvas() {
  const canvas = $('color-canvas');
  if (!canvas) return;
  const stage = canvas.parentElement;
  if (!stage) return;
  // Save current drawing
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  tempCanvas.getContext('2d').drawImage(canvas, 0, 0);

  const maxW = Math.min(stage.clientWidth || 520, 520);
  const newH  = Math.round(maxW * 400 / 520);
  if (Math.abs(canvas.width - maxW) < 10) return; // no change
  canvas.width  = maxW;
  canvas.height = newH;
  // Restore drawing scaled
  canvas.getContext('2d').drawImage(tempCanvas, 0, 0, maxW, newH);
}
window.addEventListener('resize', () => { clearTimeout(window._rcTimer); window._rcTimer = setTimeout(resizeCanvas, 200); });

/* ════════════════════════════════════════════
   PUZZLE BOARD — recalc cell size on resize
════════════════════════════════════════════ */
function recalcPuzzle() {
  const board = $('puzzle-board');
  if (!board || !board.children.length) return;
  const container = board.parentElement;
  if (!container) return;
  const cols = getComputedStyle(board).gridTemplateColumns.split(' ').length;
  if (!cols) return;
  const availW = Math.min(container.clientWidth || 420, 480);
  const cellSize = Math.floor((availW - cols * 3 - 10) / cols);
  Array.from(board.children).forEach(piece => {
    piece.style.width  = cellSize + 'px';
    piece.style.height = cellSize + 'px';
    // font size
    const ppi = piece.querySelector('.ppi');
    if (ppi) ppi.style.fontSize = Math.max(10, cellSize * .22) + 'px';
  });
}
window.addEventListener('resize', () => { clearTimeout(window._rpTimer); window._rpTimer = setTimeout(recalcPuzzle, 200); });

/* ════════════════════════════════════════════
   SORT BUCKETS — highlight on hover (touch)
════════════════════════════════════════════ */
document.addEventListener('touchmove', function(e) {
  const touch = e.touches[0];
  const target = document.elementFromPoint(touch.clientX, touch.clientY);
  qsa('.sort-bucket').forEach(b => b.classList.remove('hover-target'));
  if (target) {
    const bucket = target.closest('.sort-bucket');
    if (bucket) bucket.classList.add('hover-target');
  }
}, { passive: true });

/* ════════════════════════════════════════════
   OFFLINE CARDS — ensure display flex (patch)
════════════════════════════════════════════ */
qsa('.ocard').forEach(card => {
  if (!card.style.display) card.style.display = 'flex';
});

/* ════════════════════════════════════════════
   SWITCH GAME — hide start, show if game
   was previously started (remember state)
════════════════════════════════════════════ */
const gameStarted = {};
qsa('.onav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const gid = btn.dataset.game;
    if (!gameStarted[gid]) {
      // Not started yet — show start screen, hide content
      showStartScreen(gid);
    }
    // else leave as-is (game in progress)
  });
});

// Track when a game is actually started
Object.keys(GAME_CONFIGS).forEach(gameId => {
  const playBtn = $('gss-play-' + gameId);
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      gameStarted[gameId] = true;
    }, true); // capture phase — fires before applySelectionsAndStart
  }
  // Re-clicking restart also counts
  const resetIds = {
    puzzle: 'puzzle-new', memory: 'mem-new',
    quiz: 'quiz-restart', sort: 'sort-new',
  };
  const rBtn = $(resetIds[gameId]);
  if (rBtn) rBtn.addEventListener('click', () => { gameStarted[gameId] = true; });
});

/* ════════════════════════════════════════════
   INITIAL STATE — show puzzle start screen
   (first visible game)
════════════════════════════════════════════ */
// Already handled above by showGameContent(id, false) for all games
// The puzzle panel is .active so its start screen is visible ✓

})();
