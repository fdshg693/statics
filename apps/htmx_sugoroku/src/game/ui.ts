import type { GameState } from './state';

export function showDiceAnimation(diceValue: number): void {
  const info = document.querySelector('.game-info');
  if (!info) return;

  const diceDisplay = document.createElement('div');
  diceDisplay.className = 'dice-display';
  diceDisplay.textContent = `\u{1F3B2} ${diceValue}`;
  info.appendChild(diceDisplay);

  setTimeout(() => diceDisplay.remove(), 2000);
}

export function updateGameInfo(state: GameState, message: string): void {
  const info = document.querySelector('.game-info');
  if (!info) return;

  info.innerHTML = `
    <p>${message}</p>
    <p class="position-info">現在位置: ${state.position} / ${state.boardSize}</p>
  `;
}

export function updateControls(
  isFinished: boolean,
  onRoll: () => void,
  onStart: () => void,
): void {
  const controls = document.querySelector('.controls');
  if (!controls) return;
  controls.innerHTML = '';

  if (isFinished) {
    controls.appendChild(createButton('もう一度プレイ', 'btn btn-reset', onStart));
  } else {
    controls.appendChild(createButton('サイコロを振る', 'btn btn-roll', onRoll));
    controls.appendChild(createButton('リセット', 'btn btn-reset', onStart));
  }
}

function createButton(text: string, className: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.className = className;
  btn.addEventListener('click', onClick);
  return btn;
}
