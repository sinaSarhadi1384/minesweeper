/**
 * Minesweeper - مین‌سویپر کلاسیک
 * پیاده‌سازی کامل با سه سطح دشواری، حالت سفارشی، کیبورد و تاچ
 */

(function() {
    'use strict';

    // ===== DIFFICULTY PRESETS =====
    const DIFFICULTIES = {
        beginner: { rows: 9, cols: 9, mines: 10, name: 'مبتدی' },
        intermediate: { rows: 16, cols: 16, mines: 40, name: 'متوسط' },
        expert: { rows: 16, cols: 30, mines: 99, name: 'حرفه‌ای' },
        custom: { rows: 16, cols: 30, mines: 99, name: 'سفارشی' }
    };

    // ===== STATE =====
    let state = {
        difficulty: 'beginner',
        rows: 9,
        cols: 9,
        mines: 10,
        board: [],
        revealedCount: 0,
        flaggedCount: 0,
        gameStatus: 'ready', // ready, playing, won, lost
        firstClick: true,
        timer: 0,
        timerInterval: null,
        startTime: null,
    };

    // ===== DOM ELEMENTS =====
    const els = {
        board: document.getElementById('board'),
        minesCount: document.getElementById('minesCount'),
        timer: document.getElementById('timer'),
        face: document.getElementById('face'),
        status: document.getElementById('status'),
        newGameBtn: document.getElementById('newGameBtn'),
        diffBtns: document.querySelectorAll('.diff-btn'),
        customModal: document.getElementById('customModal'),
        customRows: document.getElementById('customRows'),
        customCols: document.getElementById('customCols'),
        customMines: document.getElementById('customMines'),
        customCancel: document.getElementById('customCancel'),
        customApply: document.getElementById('customApply'),
        gameOverModal: document.getElementById('gameOverModal'),
        gameOverTitle: document.getElementById('gameOverTitle'),
        gameOverMessage: document.getElementById('gameOverMessage'),
        gameOverStats: document.getElementById('gameOverStats'),
        playAgainBtn: document.getElementById('playAgainBtn'),
        winModal: document.getElementById('winModal'),
        winStats: document.getElementById('winStats'),
        nextGameBtn: document.getElementById('nextGameBtn'),
    };

    // ===== UTILITIES =====
    function $(sel, ctx = document) { return ctx.querySelector(sel); }
    function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // ===== TIMER =====
    function startTimer() {
        state.startTime = Date.now();
        state.timerInterval = setInterval(() => {
            state.timer = Math.floor((Date.now() - state.startTime) / 1000);
            els.timer.textContent = state.timer.toString().padStart(3, '0');
        }, 1000);
    }

    function stopTimer() {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }

    function resetTimer() {
        stopTimer();
        state.timer = 0;
        els.timer.textContent = '000';
    }

    // ===== BOARD GENERATION =====
    function createEmptyBoard(rows, cols) {
        const board = [];
        for (let r = 0; r < rows; r++) {
            const row = [];
            for (let c = 0; c < cols; c++) {
                row.push({
                    row: r, col: c,
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0,
                    element: null,
                });
            }
            board.push(row);
        }
        return board;
    }

    function placeMines(board, rows, cols, mines, safeR, safeC) {
        const positions = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                // Exclude safe cell and its neighbors for first click fairness
                const dr = Math.abs(r - safeR);
                const dc = Math.abs(c - safeC);
                if (dr <= 1 && dc <= 1) continue;
                positions.push({ r, c });
            }
        }
        shuffle(positions);
        const minePositions = positions.slice(0, mines);
        minePositions.forEach(({ r, c }) => {
            board[r][c].isMine = true;
        });
        return minePositions;
    }

    function calculateNumbers(board, rows, cols) {
        const dirs = [-1, 0, 1];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (board[r][c].isMine) continue;
                let count = 0;
                for (const dr of dirs) {
                    for (const dc of dirs) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) {
                            count++;
                        }
                    }
                }
                board[r][c].neighborMines = count;
            }
        }
    }

    // ===== RENDERING =====
    function renderBoard() {
        const { rows, cols } = state;
        // Determine ideal cell size: ~36px per cell, capped by container width
        const minCellSize = cols >= 25 ? 26 : cols >= 16 ? 30 : 34;
        const idealWidth = cols * minCellSize + 2; // +2 for border padding
        const maxBoardWidth = Math.min(idealWidth, window.innerWidth - 48);

        els.board.style.width = `${maxBoardWidth}px`;
        els.board.style.maxWidth = '100%';
        els.board.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
        els.board.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
        els.board.style.minHeight = `${Math.min(rows * minCellSize + 2, window.innerHeight - 200)}px`;
        els.board.innerHTML = '';

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const cell = state.board[r][c];
                const btn = document.createElement('button');
                btn.className = 'cell';
                btn.dataset.row = r;
                btn.dataset.col = c;
                btn.setAttribute('role', 'gridcell');
                btn.setAttribute('aria-label', `سلول ${r + 1}، ${c + 1}`);
                cell.element = btn;

                updateCellDisplay(cell);
                els.board.appendChild(btn);
            }
        }
    }

    function updateCellDisplay(cell) {
        const { element, isRevealed, isFlagged, isMine, neighborMines } = cell;
        if (!element) return;

        element.classList.toggle('revealed', isRevealed);
        element.classList.toggle('flagged', isFlagged);
        element.classList.toggle('mine', isRevealed && isMine);
        element.classList.toggle('exploded', isRevealed && isMine && state.gameStatus === 'lost' && cell === getExplodedCell());
        element.classList.toggle('wrong', isFlagged && !isMine && state.gameStatus === 'lost');
        element.removeAttribute('data-number');

        if (isRevealed && !isMine && neighborMines > 0) {
            element.textContent = neighborMines;
            element.dataset.number = neighborMines;
        } else if (isRevealed && !isMine) {
            element.textContent = '';
        } else if (!isRevealed) {
            element.textContent = '';
        }
    }

    function getExplodedCell() {
        for (const row of state.board) {
            for (const cell of row) {
                if (cell.isMine && cell.isRevealed && cell.element?.classList.contains('exploded')) {
                    return cell;
                }
            }
        }
        return null;
    }

    function updateAllCells() {
        for (const row of state.board) {
            for (const cell of row) {
                updateCellDisplay(cell);
            }
        }
    }

    // ===== GAME LOGIC =====
    function initGame(difficulty = 'beginner') {
        const config = DIFFICULTIES[difficulty] || DIFFICULTIES.beginner;
        state.difficulty = difficulty;
        state.rows = config.rows;
        state.cols = config.cols;
        state.mines = config.mines;
        state.board = createEmptyBoard(state.rows, state.cols);
        state.revealedCount = 0;
        state.flaggedCount = 0;
        state.gameStatus = 'ready';
        state.firstClick = true;

        resetTimer();
        updateMinesCounter();
        setFace('smile');
        setStatus('بازی جدید - برای شروع کلیک کنید');
        renderBoard();
        updateDifficultyButtons();
    }

    function handleFirstClick(r, c) {
        placeMines(state.board, state.rows, state.cols, state.mines, r, c);
        calculateNumbers(state.board, state.rows, state.cols);
        state.firstClick = false;
        state.gameStatus = 'playing';
        startTimer();
        revealCell(r, c);
    }

    function revealCell(r, c) {
        if (r < 0 || r >= state.rows || c < 0 || c >= state.cols) return;
        const cell = state.board[r][c];
        if (cell.isRevealed || cell.isFlagged) return;

        if (state.firstClick) {
            handleFirstClick(r, c);
            return;
        }

        cell.isRevealed = true;
        state.revealedCount++;
        updateCellDisplay(cell);

        if (cell.isMine) {
            gameOver(false, cell);
            return;
        }

        if (cell.neighborMines === 0) {
            // Auto-reveal neighbors
            const dirs = [-1, 0, 1];
            for (const dr of dirs) {
                for (const dc of dirs) {
                    if (dr === 0 && dc === 0) continue;
                    revealCell(r + dr, c + dc);
                }
            }
        }

        checkWin();
    }

    function toggleFlag(r, c) {
        if (state.gameStatus !== 'playing') return;
        const cell = state.board[r][c];
        if (cell.isRevealed) return;

        cell.isFlagged = !cell.isFlagged;
        state.flaggedCount += cell.isFlagged ? 1 : -1;
        updateMinesCounter();
        updateCellDisplay(cell);
        checkWin();
    }

    function chordReveal(r, c) {
        if (state.gameStatus !== 'playing') return;
        const cell = state.board[r][c];
        if (!cell.isRevealed || cell.neighborMines === 0) return;

        // Count flags around
        let flagCount = 0;
        const dirs = [-1, 0, 1];
        for (const dr of dirs) {
            for (const dc of dirs) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr, nc = c + dc;
                if (nr >= 0 && nr < state.rows && nc >= 0 && nc < state.cols) {
                    if (state.board[nr][nc].isFlagged) flagCount++;
                }
            }
        }

        if (flagCount === cell.neighborMines) {
            // Reveal all non-flagged neighbors
            for (const dr of dirs) {
                for (const dc of dirs) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < state.rows && nc >= 0 && nc < state.cols) {
                        const neighbor = state.board[nr][nc];
                        if (!neighbor.isFlagged && !neighbor.isRevealed) {
                            revealCell(nr, nc);
                        }
                    }
                }
            }
        }
    }

    function checkWin() {
        const totalCells = state.rows * state.cols;
        const nonMineCells = totalCells - state.mines;
        if (state.revealedCount === nonMineCells) {
            gameOver(true);
        }
    }

    function gameOver(won, explodedCell = null) {
        state.gameStatus = won ? 'won' : 'lost';
        stopTimer();

        // Reveal all mines
        for (const row of state.board) {
            for (const cell of row) {
                if (cell.isMine) {
                    cell.isRevealed = true;
                    if (!won && cell === explodedCell) {
                        cell.element?.classList.add('exploded');
                    }
                } else if (cell.isFlagged && !cell.isMine) {
                    cell.element?.classList.add('wrong');
                }
            }
        }
        updateAllCells();

        if (won) {
            setFace('win');
            setStatus('🎉 تبریک! شما برنده شدید!');
            showWinModal();
        } else {
            setFace('dead');
            setStatus('💥 بازی تمام شد - مین منفجر شد!');
            showGameOverModal(explodedCell);
        }
    }

    // ===== UI HELPERS =====
    function updateMinesCounter() {
        const remaining = state.mines - state.flaggedCount;
        els.minesCount.textContent = remaining.toString().padStart(3, '0');
        els.minesCount.style.color = remaining < 0 ? 'var(--danger)' : 'var(--accent)';
    }

    function setFace(type) {
        els.face.className = 'face ' + type;
        const faces = { smile: '😊', oh: '😮', dead: '💀', win: '😎', cool: '😎' };
        els.face.textContent = faces[type] || '😊';
    }

    function setStatus(msg) {
        els.status.textContent = msg;
    }

    function updateDifficultyButtons() {
        els.diffBtns.forEach(btn => {
            const isActive = btn.dataset.difficulty === state.difficulty;
            btn.setAttribute('aria-pressed', isActive);
        });
    }

    // ===== MODALS =====
    function showCustomModal() {
        els.customRows.value = state.rows;
        els.customCols.value = state.cols;
        els.customMines.value = state.mines;
        els.customModal.showModal();
        els.customRows.focus();
    }

    function hideCustomModal() {
        els.customModal.close();
    }

    function applyCustomSettings() {
        const rows = parseInt(els.customRows.value, 10);
        const cols = parseInt(els.customCols.value, 10);
        const mines = parseInt(els.customMines.value, 10);

        console.log('applyCustomSettings called with:', { rows, cols, mines });

        if (isNaN(rows) || isNaN(cols) || isNaN(mines)) {
            console.warn('Invalid values - NaN');
            return;
        }
        if (rows < 8 || rows > 30 || cols < 8 || cols > 30) {
            console.warn('Rows/cols out of range (8-30)');
            return;
        }
        const maxMines = rows * cols - 9;
        if (mines < 10 || mines > maxMines) {
            console.warn(`Mines out of range (10-${maxMines})`);
            return;
        }

        state.difficulty = 'custom';
        DIFFICULTIES.custom = { rows, cols, mines, name: 'سفارشی' };
        hideCustomModal();
        initGame('custom');
    }

    function showGameOverModal(explodedCell) {
        const timeStr = formatTime(state.timer);
        els.gameOverTitle.textContent = 'بازی تمام شد';
        els.gameOverMessage.textContent = 'متاسفانه روی یک مین کلیک کردید.';
        els.gameOverStats.innerHTML = `
            <div class="stat-item"><span class="label">زمان</span><span class="value">${timeStr}</span></div>
            <div class="stat-item"><span class="label">مینی‌های پیدا شده</span><span class="value">${state.flaggedCount}</span></div>
            <div class="stat-item"><span class="label">سلول‌های باز شده</span><span class="value">${state.revealedCount}</span></div>
        `;
        els.gameOverModal.showModal();
    }

    function showWinModal() {
        const timeStr = formatTime(state.timer);
        els.winStats.innerHTML = `
            <div class="stat-item"><span class="label">زمان</span><span class="value">${timeStr}</span></div>
            <div class="stat-item"><span class="label">سطح</span><span class="value">${DIFFICULTIES[state.difficulty].name}</span></div>
        `;
        els.winModal.showModal();
    }

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    // ===== EVENT HANDLERS =====
    function setupGlobalEvents() {
        // Click / Touch
        els.board.addEventListener('click', (e) => {
            const cellEl = e.target.closest('.cell');
            if (!cellEl) return;
            // Ignore clicks if game ended
            if (state.gameStatus === 'won' || state.gameStatus === 'lost') return;
            const r = parseInt(cellEl.dataset.row, 10);
            const c = parseInt(cellEl.dataset.col, 10);
            if (e.shiftKey) {
                // Shift+Click for chord (only when game is in progress)
                if (state.gameStatus === 'playing') chordReveal(r, c);
            } else {
                revealCell(r, c);
            }
        });

        // Context menu for flag
        els.board.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const cellEl = e.target.closest('.cell');
            if (!cellEl) return;
            const r = parseInt(cellEl.dataset.row, 10);
            const c = parseInt(cellEl.dataset.col, 10);
            toggleFlag(r, c);
        });

        // Touch for mobile - long press for flag
        let touchTimer = null;
        let touchStart = null;

        els.board.addEventListener('touchstart', (e) => {
            const cellEl = e.target.closest('.cell');
            if (!cellEl) return;
            touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, cellEl };
            touchTimer = setTimeout(() => {
                if (touchStart && state.gameStatus === 'playing') {
                    const r = parseInt(touchStart.cellEl.dataset.row, 10);
                    const c = parseInt(touchStart.cellEl.dataset.col, 10);
                    toggleFlag(r, c);
                    if (navigator.vibrate) navigator.vibrate(50);
                }
            }, 400);
        }, { passive: true });

        els.board.addEventListener('touchmove', (e) => {
            if (!touchStart) return;
            const dx = e.touches[0].clientX - touchStart.x;
            const dy = e.touches[0].clientY - touchStart.y;
            if (Math.hypot(dx, dy) > 10) {
                clearTimeout(touchTimer);
                touchStart = null;
            }
        }, { passive: true });

        els.board.addEventListener('touchend', () => {
            clearTimeout(touchTimer);
            touchStart = null;
        }, { passive: true });

        // Keyboard navigation
        els.board.addEventListener('keydown', (e) => {
            const cellEl = e.target.closest('.cell');
            if (!cellEl) return;

            const r = parseInt(cellEl.dataset.row, 10);
            const c = parseInt(cellEl.dataset.col, 10);
            let nr = r, nc = c;

            switch (e.key) {
                case 'ArrowUp': nr--; break;
                case 'ArrowDown': nr++; break;
                case 'ArrowLeft': nc++; break; // RTL
                case 'ArrowRight': nc--; break; // RTL
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    revealCell(r, c);
                    break;
                case 'f':
                case 'F':
                    if (state.gameStatus === 'playing') toggleFlag(r, c);
                    break;
                case 'c':
                case 'C':
                    if (state.gameStatus === 'playing') chordReveal(r, c);
                    break;
                default: return;
            }

            if (nr !== r || nc !== c) {
                e.preventDefault();
                const target = els.board.querySelector(`[data-row="${nr}"][data-col="${nc}"]`);
                if (target) target.focus();
            }
        });

        // Chord hint visual on mousedown
        els.board.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            const cellEl = e.target.closest('.cell');
            if (!cellEl || state.gameStatus !== 'playing') return;
            const r = parseInt(cellEl.dataset.row, 10);
            const c = parseInt(cellEl.dataset.col, 10);
            const cell = state.board[r][c];
            if (cell && cell.isRevealed && cell.neighborMines > 0) {
                const dirs = [-1, 0, 1];
                for (const dr of dirs) {
                    for (const dc of dirs) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = r + dr, nc = c + dc;
                        if (nr >= 0 && nr < state.rows && nc >= 0 && nc < state.cols) {
                            const nCell = state.board[nr][nc];
                            if (nCell && !nCell.isRevealed && !nCell.isFlagged) {
                                nCell.element?.classList.add('chord-hint');
                            }
                        }
                    }
                }
            }
        });

        const clearChordHints = () => {
            els.board.querySelectorAll('.chord-hint').forEach(el => el.classList.remove('chord-hint'));
        };
        els.board.addEventListener('mouseup', clearChordHints);
        els.board.addEventListener('mouseleave', clearChordHints);

        // Face button
        els.newGameBtn.addEventListener('click', () => initGame(state.difficulty));
        els.newGameBtn.addEventListener('mousedown', () => setFace('oh'));
        els.newGameBtn.addEventListener('mouseup', () => setFace(state.gameStatus === 'won' ? 'win' : 'smile'));
        els.newGameBtn.addEventListener('mouseleave', () => setFace(state.gameStatus === 'won' ? 'win' : 'smile'));

        // Difficulty buttons
        els.diffBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const diff = btn.dataset.difficulty;
                if (diff === 'custom') {
                    showCustomModal();
                    updateDifficultyButtons();
                } else {
                    initGame(diff);
                }
            });
        });

        // Custom modal
        els.customCancel.addEventListener('click', hideCustomModal);
        els.customApply.addEventListener('click', applyCustomSettings);
        els.customModal.addEventListener('click', (e) => {
            if (e.target === els.customModal) hideCustomModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && els.customModal.open) hideCustomModal();
        });

        // Game over modal
        els.playAgainBtn.addEventListener('click', () => {
            els.gameOverModal.close();
            initGame(state.difficulty);
        });
        els.gameOverModal.addEventListener('click', (e) => {
            if (e.target === els.gameOverModal) els.gameOverModal.close();
        });

        // Win modal
        els.nextGameBtn.addEventListener('click', () => {
            els.winModal.close();
            initGame(state.difficulty);
        });
        els.winModal.addEventListener('click', (e) => {
            if (e.target === els.winModal) els.winModal.close();
        });
    }

    // ===== INIT =====
    function init() {
        setupGlobalEvents();
        initGame('beginner');
        console.log('💣 Minesweeper loaded!');
        console.log('Controls: Click = Reveal, Right-click/Long-press = Flag, Shift+Click = Chord');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for debugging
    window.minesweeper = {
        newGame: (diff) => initGame(diff || state.difficulty),
        getState: () => ({ ...state }),
        DIFFICULTIES,
    };
})();