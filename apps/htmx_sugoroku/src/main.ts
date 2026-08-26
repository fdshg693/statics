import { initApiClient, getApiClient } from './api/client';
import {
  createInitialState,
  applyStartResponse,
  applyRollResponse,
  type GameState,
} from './game/state';
import { initBoard, updatePlayerPosition } from './game/board';
import { showDiceAnimation, updateGameInfo, updateControls } from './game/ui';

let gameState: GameState = createInitialState();

async function setupMocking(): Promise<void> {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mock/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
    console.log('[MSW] Mocking enabled');
  }
}

async function startGame(): Promise<void> {
  const apiUrlInput = document.getElementById('api-url') as HTMLInputElement | null;
  const baseUrl = apiUrlInput?.value.trim() || '';
  initApiClient(baseUrl);

  try {
    const client = getApiClient();
    const { data, error } = await client.POST('/api/game/start');

    if (error || !data) {
      throw new Error(error?.error || 'ゲームの開始に失敗しました');
    }

    gameState = applyStartResponse(data);
    initBoard(gameState.boardSize);
    updateGameInfo(gameState, data.message);
    updateControls(false, rollDice, startGame);
  } catch (err) {
    console.error('Error:', err);
    alert(
      'ゲームの開始に失敗しました。バックエンドサーバーが起動しているか確認してください。\n\nエラー: ' +
        (err instanceof Error ? err.message : String(err)),
    );
  }
}

async function rollDice(): Promise<void> {
  if (!gameState.gameId) {
    alert('先にゲームを開始してください');
    return;
  }

  if (gameState.isFinished) {
    alert('ゲームは終了しています。新しいゲームを開始してください。');
    return;
  }

  try {
    const client = getApiClient();
    const { data, error } = await client.POST('/api/game/roll', {
      body: {
        game_id: gameState.gameId,
        current_position: gameState.position,
      },
    });

    if (error || !data) {
      throw new Error(error?.error || 'サイコロを振ることに失敗しました');
    }

    showDiceAnimation(data.dice);

    setTimeout(() => {
      gameState = applyRollResponse(gameState, data);
      updatePlayerPosition(gameState.position);
      updateGameInfo(gameState, data.message);

      if (data.is_finished) {
        updateControls(true, rollDice, startGame);
      }
    }, 500);
  } catch (err) {
    console.error('Error:', err);
    alert(
      'サイコロを振ることに失敗しました。\n\nエラー: ' +
        (err instanceof Error ? err.message : String(err)),
    );
  }
}

async function main(): Promise<void> {
  await setupMocking();

  const startBtn = document.querySelector('.btn-start');
  if (startBtn) {
    startBtn.addEventListener('click', startGame);
  }
}

main();
