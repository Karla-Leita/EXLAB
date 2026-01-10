const difficulties = {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: { rows: 16, cols: 16, mines: 40 },
    hard: { rows: 16, cols: 30, mines: 99 }
};

const boardElement = document.getElementById('board');
const difficultySelect = document.getElementById('difficulty');
const resetBtn = document.getElementById('reset-btn');
const minesLeftElement = document.getElementById('mines-left');
const timerElement = document.getElementById('timer');
const messageElement = document.getElementById('message');

let board = [];
let revealedCount = 0;
let flagsCount = 0;
let totalMines = 0;
let timer = null;
let secondsElapsed = 0;
let gameActive = false;
let boardGenerated = false;

function startGame() {
    const { rows, cols, mines } = difficulties[difficultySelect.value];
    totalMines = mines;
    revealedCount = 0;
    flagsCount = 0;
    secondsElapsed = 0;
    updateTimerDisplay();
    updateMinesDisplay();
    messageElement.textContent = '';
    messageElement.style.color = 'var(--text)';
    clearInterval(timer);
    timer = null;
    gameActive = true;
    boardGenerated = false;

    board = Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) => ({
            row,
            col,
            mine: false,
            revealed: false,
            flagged: false,
            adjacent: 0,
            element: null
        }))
    );

    renderBoard();
}

function placeMines(mines, initialCell) {
    const { rows, cols } = difficulties[difficultySelect.value];
    let placed = 0;
    while (placed < mines) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        const candidate = board[row][col];
        if (!candidate.mine && candidate !== initialCell) {
            board[row][col].mine = true;
            placed++;
        }
    }
}

function calculateAdjacents() {
    const directions = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
    ];

    for (const row of board) {
        for (const cell of row) {
            if (cell.mine) continue;
            let count = 0;
            for (const [dr, dc] of directions) {
                const nr = cell.row + dr;
                const nc = cell.col + dc;
                if (board[nr]?.[nc]?.mine) count++;
            }
            cell.adjacent = count;
        }
    }
}

function renderBoard() {
    const rows = board.length;
    const cols = board[0].length;
    boardElement.innerHTML = '';
    boardElement.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    boardElement.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;

    for (const row of board) {
        for (const cell of row) {
            const div = document.createElement('button');
            div.className = 'cell';
            div.setAttribute('role', 'gridcell');
            div.setAttribute('data-row', cell.row);
            div.setAttribute('data-col', cell.col);
            div.addEventListener('click', handleReveal);
            div.addEventListener('contextmenu', handleFlag);
            div.addEventListener('keydown', (event) => {
                if (event.key.toLowerCase() === 'f') {
                    event.preventDefault();
                    toggleFlag(cell);
                }
            });
            cell.element = div;
            boardElement.appendChild(div);
        }
    }
}

function handleReveal(event) {
    event.preventDefault();
    const cell = getCellFromElement(event.currentTarget);
    if (!cell || !gameActive) return;
    if (cell.revealed || cell.flagged) return;

    if (!boardGenerated) {
        placeMines(totalMines, cell);
        calculateAdjacents();
        boardGenerated = true;
    }

    if (!timer) {
        timer = setInterval(() => {
            secondsElapsed++;
            updateTimerDisplay();
        }, 1000);
    }

    revealCell(cell);
}

function handleFlag(event) {
    event.preventDefault();
    const cell = getCellFromElement(event.currentTarget);
    if (!cell || !gameActive) return;
    toggleFlag(cell);
}

function toggleFlag(cell) {
    if (cell.revealed) return;

    if (cell.flagged) {
        cell.flagged = false;
        cell.element.classList.remove('flagged');
        flagsCount--;
    } else if (flagsCount < totalMines) {
        cell.flagged = true;
        cell.element.classList.add('flagged');
        flagsCount++;
    }
    updateMinesDisplay();
}

function revealCell(cell) {
    if (cell.revealed || cell.flagged) return;

    cell.revealed = true;
    cell.element.classList.add('revealed');
    cell.element.classList.toggle('mine', cell.mine);

    if (cell.mine) {
        cell.element.classList.add('revealed');
        endGame(false);
        return;
    }

    revealedCount++;
    if (cell.adjacent > 0) {
        cell.element.dataset.number = cell.adjacent;
        cell.element.textContent = cell.adjacent;
    } else {
        floodReveal(cell);
    }

    checkWinCondition();
}

function floodReveal(startCell) {
    const stack = [startCell];
    while (stack.length) {
        const cell = stack.pop();
        for (const neighbor of getNeighbors(cell)) {
            if (!neighbor.revealed && !neighbor.flagged && !neighbor.mine) {
                neighbor.revealed = true;
                neighbor.element.classList.add('revealed');
                revealedCount++;
                if (neighbor.adjacent > 0) {
                    neighbor.element.dataset.number = neighbor.adjacent;
                    neighbor.element.textContent = neighbor.adjacent;
                } else {
                    stack.push(neighbor);
                }
            }
        }
    }
}

function getNeighbors(cell) {
    const neighbors = [];
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = cell.row + dr;
            const nc = cell.col + dc;
            const neighbor = board[nr]?.[nc];
            if (neighbor) neighbors.push(neighbor);
        }
    }
    return neighbors;
}

function revealAllMines() {
    for (const row of board) {
        for (const cell of row) {
            if (cell.mine) {
                cell.element.classList.add('mine', 'revealed');
            }
        }
    }
}

function checkWinCondition() {
    const { rows, cols } = difficulties[difficultySelect.value];
    const totalCells = rows * cols;
    if (revealedCount === totalCells - totalMines) {
        endGame(true);
    }
}

function endGame(won) {
    gameActive = false;
    clearInterval(timer);
    timer = null;

    if (won) {
        messageElement.textContent = '🎉 ¡Victoria! Has despejado todas las minas.';
        messageElement.style.color = 'var(--success)';
        revealSafeCells();
    } else {
        messageElement.textContent = '💥 ¡Boom! Has detonado una mina. Inténtalo de nuevo.';
        messageElement.style.color = 'var(--danger)';
        revealAllMines();
    }
}

function revealSafeCells() {
    for (const row of board) {
        for (const cell of row) {
            if (!cell.revealed && !cell.mine) {
                cell.revealed = true;
                cell.element.classList.add('revealed');
                if (cell.adjacent > 0) {
                    cell.element.dataset.number = cell.adjacent;
                    cell.element.textContent = cell.adjacent;
                }
            }
        }
    }
}

function getCellFromElement(element) {
    const row = Number(element.getAttribute('data-row'));
    const col = Number(element.getAttribute('data-col'));
    return board[row]?.[col] ?? null;
}

function updateMinesDisplay() {
    const remaining = Math.max(totalMines - flagsCount, 0);
    minesLeftElement.textContent = remaining.toString().padStart(3, '0');
}

function updateTimerDisplay() {
    timerElement.textContent = secondsElapsed.toString().padStart(3, '0');
}

resetBtn.addEventListener('click', startGame);
difficultySelect.addEventListener('change', startGame);

document.addEventListener('contextmenu', (event) => {
    if (event.target.classList?.contains('cell')) {
        event.preventDefault();
    }
});

startGame();
