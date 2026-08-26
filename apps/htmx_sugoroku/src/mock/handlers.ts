import { http, HttpResponse } from 'msw';
import { faker } from '@faker-js/faker';
import type { components } from '../generated/api-types';

type GameStartResponse = components['schemas']['GameStartResponse'];
type RollDiceRequest = components['schemas']['RollDiceRequest'];
type RollDiceResponse = components['schemas']['RollDiceResponse'];
type GameStatusResponse = components['schemas']['GameStatusResponse'];
type ErrorResponse = components['schemas']['ErrorResponse'];
type InfoResponse = components['schemas']['InfoResponse'];

const mockGames = new Map<string, { position: number; boardSize: number }>();
const BOARD_SIZE = 30;

export const handlers = [
  http.post('/api/game/start', () => {
    const gameId = faker.string.uuid();
    mockGames.set(gameId, { position: 0, boardSize: BOARD_SIZE });

    return HttpResponse.json({
      game_id: gameId,
      position: 0,
      board_size: BOARD_SIZE,
      message: 'ゲームを開始しました！（モック）',
    } satisfies GameStartResponse);
  }),

  http.post('/api/game/roll', async ({ request }) => {
    const body = (await request.json()) as RollDiceRequest;
    const game = mockGames.get(body.game_id);

    if (!game) {
      return HttpResponse.json(
        { error: 'ゲームが見つかりません' } satisfies ErrorResponse,
        { status: 404 },
      );
    }

    const dice = faker.number.int({ min: 1, max: 6 });
    const newPosition = Math.min(body.current_position + dice, BOARD_SIZE);
    const isFinished = newPosition >= BOARD_SIZE;

    game.position = newPosition;

    let message = `サイコロは${dice}が出ました！（モック）`;
    if (isFinished) {
      message += ' おめでとうございます、ゴールです！';
    }

    return HttpResponse.json({
      dice,
      new_position: newPosition,
      is_finished: isFinished,
      message,
    } satisfies RollDiceResponse);
  }),

  http.get('/api/game/status', ({ request }) => {
    const url = new URL(request.url);
    const gameId = url.searchParams.get('game_id');

    if (!gameId || !mockGames.has(gameId)) {
      return HttpResponse.json(
        { error: 'ゲームが見つかりません' } satisfies ErrorResponse,
        { status: 404 },
      );
    }

    const game = mockGames.get(gameId)!;
    return HttpResponse.json({
      game_id: gameId,
      position: game.position,
      board_size: game.boardSize,
      is_finished: game.position >= game.boardSize,
    } satisfies GameStatusResponse);
  }),

  http.get('/info', () => {
    return HttpResponse.json({
      message: 'すごろくゲーム バックエンドサーバー（モック）',
      endpoints: {
        start: 'POST /api/game/start',
        roll: 'POST /api/game/roll',
        status: 'GET /api/game/status?game_id={game_id}',
      },
    } satisfies InfoResponse);
  }),
];
