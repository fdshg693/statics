export function initBoard(boardSize: number): void {
  const board = document.getElementById('board');
  if (!board) return;
  board.innerHTML = '';

  for (let i = 0; i <= boardSize; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.textContent = String(i);
    cell.id = `cell-${i}`;

    if (i === 0) {
      cell.classList.add('start');
    } else if (i === boardSize) {
      cell.classList.add('goal');
    }

    board.appendChild(cell);
  }

  updatePlayerPosition(0);
}

export function updatePlayerPosition(position: number): void {
  document.querySelectorAll('.player').forEach(p => p.remove());

  const cell = document.getElementById(`cell-${position}`);
  if (cell) {
    const player = document.createElement('div');
    player.className = 'player';
    player.textContent = '\u{1F3AE}';
    cell.appendChild(player);
  }
}
