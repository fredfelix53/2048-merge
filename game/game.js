/* ===== 2048 Merge — Game =====
   Classic 2048: swipe to slide tiles, same numbers merge, try to reach 2048
   Touch swipe, keyboard arrows, smooth animations, score/undo, game over detection
*/
(function() {
  'use strict';

  let GRID_SIZE = 4;
  let BOARD_SIZE = 4;
  let CELL_SIZE = 0;
  let GRID_PADDING = 6;

  let canvas, ctx;
  let grid = [];
  let score = 0;
  let bestTile = 0;
  let totalMerges = 0;
  let gameOver = false;
  let won2048 = false;
  let mergeAnimations = [];
  let spawnAnimations = [];
  let scorePopups = [];
  let undoStack = [];

  let animFrame = null;
  let gameRunning = false;

  // Tile colors
  const TILE_COLORS = {
    0:     { bg: 'rgba(255,255,255,0.05)', text: '#0000' },
    2:     { bg: '#eee4da', text: '#776e65' },
    4:     { bg: '#ede0c8', text: '#776e65' },
    8:     { bg: '#f2b179', text: '#f9f6f2' },
    16:    { bg: '#f59563', text: '#f9f6f2' },
    32:    { bg: '#f67c5f', text: '#f9f6f2' },
    64:    { bg: '#f65e3b', text: '#f9f6f2' },
    128:   { bg: '#edcf72', text: '#f9f6f2' },
    256:   { bg: '#edcc61', text: '#f9f6f2' },
    512:   { bg: '#edc850', text: '#f9f6f2' },
    1024:  { bg: '#edc53f', text: '#f9f6f2' },
    2048:  { bg: '#edc22e', text: '#f9f6f2' },
    4096:  { bg: '#3c3a32', text: '#f9f6f2' },
    8192:  { bg: '#3c3a32', text: '#f9f6f2' },
    super: { bg: '#1a1a2e', text: '#ffd700' },
  };

  function init() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    resize();

    ProgressionSystem.load();

    // Initialize framework modules
    AdsManager.init();
    ChallengesSystem.init();
    StoreRotator.init();
    RetentionSystem.init();
    CollectiblesSystem.init();
    TutorialSystem.init({ gameTitle: '2048 Merge' });
    if (TutorialSystem.shouldShow()) {
      setTimeout(() => TutorialSystem.start(), 500);
    }

    RetentionSystem.onGameStart();

    const bonuses = ProgressionSystem.getActiveBonuses();
    BOARD_SIZE = 4 + bonuses.extraSpace;
    GRID_SIZE = BOARD_SIZE;

    score = 0;
    bestTile = 0;
    totalMerges = 0;
    gameOver = false;
    won2048 = false;
    undoStack = [];
    mergeAnimations = [];
    spawnAnimations = [];
    scorePopups = [];

    initGrid();
    addRandomTile();
    addRandomTile();

    updateUI();
    setupInput();

    gameRunning = true;
    render();

    document.getElementById('newGame').addEventListener('click', restartGame);
    document.getElementById('undoBtn').addEventListener('click', undo);
  }

  function resize() {
    const maxW = Math.min(window.innerWidth - 16, 480);
    const maxH = Math.min(window.innerHeight - 250, 500);
    const size = Math.min(maxW, maxH);
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    canvas.width = size;
    canvas.height = size;
    CELL_SIZE = (size - GRID_PADDING * 2) / BOARD_SIZE;
  }

  function initGrid() {
    grid = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      grid[r] = [];
      for (let c = 0; c < BOARD_SIZE; c++) {
        grid[r][c] = 0;
      }
    }
  }

  function addRandomTile() {
    const empty = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (grid[r][c] === 0) empty.push({ r, c });
      }
    }
    if (empty.length === 0) return null;
    const pos = empty[Math.floor(Math.random() * empty.length)];
    const bonuses = ProgressionSystem.getActiveBonuses();
    const val = Math.random() < 0.1 ? (bonuses.startNumber === 4 ? 4 : 4) : (bonuses.startNumber === 4 ? 2 : 2);
    grid[pos.r][pos.c] = val;
    spawnAnimations.push({ r: pos.r, c: pos.c, scale: 0, maxScale: 1, value: val });
    return pos;
  }

  function getEmptyCount() {
    let c = 0;
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let cc = 0; cc < BOARD_SIZE; cc++)
        if (grid[r][cc] === 0) c++;
    return c;
  }

  function move(direction) {
    if (gameOver) return;
    if (getEmptyCount() === 0 && !canMerge()) {
      gameOver = true;
      endGame();
      return;
    }

    // Save state for undo
    const state = { grid: grid.map(r => [...r]), score };
    undoStack.push(state);
    if (undoStack.length > 10) undoStack.shift();

    let merged = false;
    const bonuses = ProgressionSystem.getActiveBonuses();
    const pointsMult = bonuses.pointsMult;
    const comboBonus = bonuses.comboBonus;

    if (direction === 'left') merged = moveLeft(pointsMult, comboBonus);
    else if (direction === 'right') merged = moveRight(pointsMult, comboBonus);
    else if (direction === 'up') merged = moveUp(pointsMult, comboBonus);
    else if (direction === 'down') merged = moveDown(pointsMult, comboBonus);

    if (merged) {
      totalMerges += countMergesInMove || 0;
      addRandomTile();
      updateUI();
      if (!canMove()) { gameOver = true; endGame(); }
    }
  }

  let countMergesInMove = 0;

  function slideRow(row) {
    let arr = row.filter(v => v !== 0);
    countMergesInMove = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        const bonuses = ProgressionSystem.getActiveBonuses();
        const mergeBonus = bonuses.mergeBonus;
        const newVal = arr[i] * 2;
        const points = newVal + mergeBonus;
        score += points;
        if (newVal > bestTile) bestTile = newVal;
        if (newVal === 2048 && !won2048) { won2048 = true; showAchievement('2048 Master! 🏆'); }
        arr[i] = newVal;
        arr[i + 1] = 0;
        countMergesInMove++;
      }
    }
    arr = arr.filter(v => v !== 0);
    while (arr.length < row.length) arr.push(0);
    return arr;
  }

  function moveLeft(pm, cb) {
    let changed = false;
    for (let r = 0; r < BOARD_SIZE; r++) {
      const original = [...grid[r]];
      grid[r] = slideRow(grid[r]);
      const mergeCount = countMergesInMove;
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (grid[r][c] !== original[c]) changed = true;
      }
    }
    return changed;
  }

  function moveRight(pm, cb) {
    let changed = false;
    for (let r = 0; r < BOARD_SIZE; r++) {
      const original = [...grid[r]];
      grid[r] = slideRow(grid[r].reverse()).reverse();
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (grid[r][c] !== original[c]) changed = true;
      }
    }
    return changed;
  }

  function moveUp(pm, cb) {
    let changed = false;
    for (let c = 0; c < BOARD_SIZE; c++) {
      const col = [];
      for (let r = 0; r < BOARD_SIZE; r++) col.push(grid[r][c]);
      const original = [...col];
      const result = slideRow(col);
      for (let r = 0; r < BOARD_SIZE; r++) grid[r][c] = result[r];
      for (let r = 0; r < BOARD_SIZE; r++) if (grid[r][c] !== original[r]) changed = true;
    }
    return changed;
  }

  function moveDown(pm, cb) {
    let changed = false;
    for (let c = 0; c < BOARD_SIZE; c++) {
      const col = [];
      for (let r = 0; r < BOARD_SIZE; r++) col.push(grid[r][c]);
      const original = [...col];
      const result = slideRow(col.reverse()).reverse();
      for (let r = 0; r < BOARD_SIZE; r++) grid[r][c] = result[r];
      for (let r = 0; r < BOARD_SIZE; r++) if (grid[r][c] !== original[r]) changed = true;
    }
    return changed;
  }

  function canMerge() {
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (c + 1 < BOARD_SIZE && grid[r][c] === grid[r][c + 1]) return true;
        if (r + 1 < BOARD_SIZE && grid[r][c] === grid[r + 1][c]) return true;
      }
    return false;
  }

  function canMove() {
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++)
        if (grid[r][c] === 0) return true;
    return canMerge();
  }

  function undo() {
    if (gameOver || undoStack.length === 0) return;
    const state = undoStack.pop();
    grid = state.grid;
    score = state.score;
    updateUI();
  }

  function endGame() {
    gameOver = true;
    const result = { score, bestTile, merges: totalMerges };
    ProgressionSystem.endOfGame(result);
    ProgressionSystem.checkAchievements();

    // Framework game-over hooks
    RetentionSystem.onGameEnd(result.score || 0);
    RetentionSystem.submitScore('Player', result.score || 0);
    ChallengesSystem.reportProgress('games', 1);
    ChallengesSystem.reportProgress('score', result.score || 0);
    ChallengesSystem.reportProgress('lines', result.merges || 0);
    CollectiblesSystem.incrementTracker('totalGames');
    if (result.score > 0) CollectiblesSystem.incrementTracker('wins');
    CollectiblesSystem.setTracker('highestScore', result.bestTile || 0);
    AdsManager.tryShowInterstitial();

    document.getElementById('gameOverScreen').style.display = 'flex';
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalBestTile').textContent = bestTile;
    document.getElementById('finalMerges').textContent = totalMerges;
  }

  function restartGame() {
    document.getElementById('gameOverScreen').style.display = 'none';
    RetentionSystem.onGameStart();
    const bonuses = ProgressionSystem.getActiveBonuses();
    BOARD_SIZE = 4 + bonuses.extraSpace;
    GRID_SIZE = BOARD_SIZE;
    score = 0;
    bestTile = 0;
    totalMerges = 0;
    gameOver = false;
    won2048 = false;
    undoStack = [];
    mergeAnimations = [];
    spawnAnimations = [];
    scorePopups = [];
    initGrid();
    addRandomTile();
    addRandomTile();
    updateUI();
  }

  function updateUI() {
    document.getElementById('score').textContent = score;
    document.getElementById('bestTile').textContent = bestTile > 0 ? bestTile : '-';
    document.getElementById('merges').textContent = totalMerges;
    // Undo button
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) undoBtn.textContent = `↩️ ${undoStack.length > 0 ? undoStack.length : ''}`;
  }

  function showAchievement(text) {
    const el = document.getElementById('achievement') || (() => {
      const n = document.createElement('div');
      n.id = 'achievement';
      document.body.appendChild(n);
      return n;
    })();
    el.textContent = text;
    el.className = 'show';
    clearTimeout(el._timeout);
    el._timeout = setTimeout(() => el.className = '', 3000);
  }

  // ─── Input ────────────────────────────────────────
  function setupInput() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
      switch(e.key) {
        case 'ArrowLeft': e.preventDefault(); move('left'); render(); break;
        case 'ArrowRight': e.preventDefault(); move('right'); render(); break;
        case 'ArrowUp': e.preventDefault(); move('up'); render(); break;
        case 'ArrowDown': e.preventDefault(); move('down'); render(); break;
      }
    });

    // Touch/swipe
    let startX, startY;
    canvas.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
    }, { passive: true });
    canvas.addEventListener('touchend', (e) => {
      if (!startX) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (Math.max(absDx, absDy) < 20) return;
      if (absDx > absDy) move(dx > 0 ? 'right' : 'left');
      else move(dy > 0 ? 'down' : 'up');
      render();
      startX = null;
    }, { passive: true });

    // Mouse drag
    let mouseDown = false;
    let mx, my;
    canvas.addEventListener('mousedown', (e) => { mouseDown = true; mx = e.clientX; my = e.clientY; });
    canvas.addEventListener('mouseup', (e) => {
      if (!mouseDown) return;
      mouseDown = false;
      const dx = e.clientX - mx;
      const dy = e.clientY - my;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (Math.max(absDx, absDy) < 10) return;
      if (absDx > absDy) move(dx > 0 ? 'right' : 'left');
      else move(dy > 0 ? 'down' : 'up');
      render();
    });
  }

  // ─── Render ────────────────────────────────────────
  function render() {
    const w = canvas.width;
    const h = canvas.height;

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 8);
    ctx.fill();

    // Grid background
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const x = GRID_PADDING + c * CELL_SIZE + 2;
        const y = GRID_PADDING + r * CELL_SIZE + 2;
        const size = CELL_SIZE - 4;
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.beginPath();
        ctx.roundRect(x, y, size, size, 4);
        ctx.fill();
      }
    }

    // Tiles
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const val = grid[r][c];
        if (val === 0) continue;
        const x = GRID_PADDING + c * CELL_SIZE + 2;
        const y = GRID_PADDING + r * CELL_SIZE + 2;
        const size = CELL_SIZE - 4;

        const colors = TILE_COLORS[val] || TILE_COLORS.super;
        ctx.fillStyle = colors.bg;
        ctx.beginPath();
        ctx.roundRect(x, y, size, size, 4);
        ctx.fill();

        // Text
        ctx.fillStyle = colors.text;
        ctx.font = `bold ${val >= 1000 ? CELL_SIZE * 0.25 : val >= 100 ? CELL_SIZE * 0.3 : CELL_SIZE * 0.35}px 'Segoe UI', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(val, x + size / 2, y + size / 2);
      }
    }

    // Spawn animations
    for (let i = spawnAnimations.length - 1; i >= 0; i--) {
      const a = spawnAnimations[i];
      a.scale += 0.05;
      if (a.scale >= a.maxScale) { spawnAnimations.splice(i, 1); continue; }
      const x = GRID_PADDING + a.c * CELL_SIZE + CELL_SIZE / 2;
      const y = GRID_PADDING + a.r * CELL_SIZE + CELL_SIZE / 2;
      const size = CELL_SIZE * a.scale * 0.9;
      ctx.save();
      ctx.globalAlpha = a.scale;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(x, y, size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(a.value, x, y);
      ctx.restore();
    }
  }

  // ─── Public API ─────────────────────────────────────
  window.Merge2048 = { init, restartGame, move };

  window.addEventListener('resize', () => { if (gameRunning) { resize(); render(); } });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
