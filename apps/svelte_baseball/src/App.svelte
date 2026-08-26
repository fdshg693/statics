<script lang="ts">
  import { getPitchZone, PITCH_ZONES } from './lib/config/pitchZones';
  import { playPitch } from './lib/game/playPitch';
  import { getPitchOutcomeTable } from './lib/game/resolvePitchResult';
  import { createInitialGameState } from './lib/game/state';
  import type {
    GameState,
    PitchOutcome,
    PitchStepSummary,
    PitchZoneId,
    PitchZoneTendency,
  } from './lib/types/game';

  type PitchLogEntry = {
    pitchNumber: number;
    zoneLabel: string;
    outcomeLabel: string;
    detail: string;
  };

  const MAX_LOG_ENTRIES = 6;
  const defaultZoneId: PitchZoneId = 'low-outside';

  const outcomeLabels: Record<PitchOutcome, string> = {
    ball: 'ボール',
    'called-strike': '見逃しストライク',
    'swinging-strike': '空振りストライク',
    foul: 'ファウル',
    walk: '四球',
    strikeout: '三振',
    'in-play-out': 'インプレーアウト',
    single: '単打',
    double: '二塁打',
    triple: '三塁打',
    'home-run': '本塁打',
  };

  const tendencyLabels: Record<PitchZoneTendency, string> = {
    'pitcher-friendly': '投手有利',
    balanced: '五分',
    'hitter-friendly': '打者有利',
  };

  const formatCount = (state: GameState) => `${state.count.balls}-${state.count.strikes}`;

  const buildResultDetail = (summary: PitchStepSummary, state: GameState): string => {
    switch (summary.outcome) {
      case 'ball':
        return `ボールです。現在のカウントは ${formatCount(state)} です。`;
      case 'called-strike':
        return `見逃しでストライクを取りました。現在のカウントは ${formatCount(state)} です。`;
      case 'swinging-strike':
        return `空振りを奪いました。現在のカウントは ${formatCount(state)} です。`;
      case 'foul':
        return `ファウルで粘られました。現在のカウントは ${formatCount(state)} です。`;
      case 'walk':
        return summary.runsScored > 0
          ? `四球で押し出しになりました。${summary.runsScored}点を失いました。`
          : '四球で出塁を許しました。';
      case 'strikeout': {
        const strikeoutType =
          summary.pitchResult === 'called-strike' ? '見逃し三振' : '空振り三振';

        return summary.inningEnded
          ? `${strikeoutType}です。3アウトでこのイニングは終了です。`
          : `${strikeoutType}で1アウト追加しました。`;
      }
      case 'in-play-out':
        return summary.inningEnded
          ? '打たせて取りました。3アウトでこのイニングは終了です。'
          : '打たせて取り、1アウト追加しました。';
      case 'single':
        return summary.runsScored > 0
          ? `単打を許しました。${summary.runsScored}点を失いました。`
          : '単打を許しましたが、失点はありませんでした。';
      case 'double':
        return summary.runsScored > 0
          ? `二塁打を許しました。${summary.runsScored}点を失いました。`
          : '二塁打を許しましたが、失点はありませんでした。';
      case 'triple':
        return summary.runsScored > 0
          ? `三塁打を浴びました。${summary.runsScored}点を失いました。`
          : '三塁打を浴びましたが、失点はありませんでした。';
      case 'home-run':
        return `${summary.runsScored}点本塁打を浴びました。`;
    }
  };

  let gameState = createInitialGameState();
  let selectedZoneId: PitchZoneId = defaultZoneId;
  let lastSummary: PitchStepSummary | null = null;
  let lastDetail = '初球のコースを選んで「投げる」を押してください。';
  let recentPlays: PitchLogEntry[] = [];

  $: selectedZone = getPitchZone(selectedZoneId);
  $: outcomeTable = getPitchOutcomeTable(selectedZoneId);
  $: hasAnyRunner = gameState.bases.first || gameState.bases.second || gameState.bases.third;

  const throwPitch = () => {
    if (gameState.isInningOver) {
      return;
    }

    const pitchStep = playPitch(gameState, selectedZoneId);
    const zone = getPitchZone(selectedZoneId);
    const detail = buildResultDetail(pitchStep.summary, pitchStep.nextState);

    gameState = pitchStep.nextState;
    lastSummary = pitchStep.summary;
    lastDetail = detail;
    recentPlays = [
      {
        pitchNumber: pitchStep.nextState.pitchNumber,
        zoneLabel: zone.label,
        outcomeLabel: outcomeLabels[pitchStep.summary.outcome],
        detail,
      },
      ...recentPlays,
    ].slice(0, MAX_LOG_ENTRIES);
  };

  const resetGame = () => {
    gameState = createInitialGameState();
    selectedZoneId = defaultZoneId;
    lastSummary = null;
    lastDetail = '初球のコースを選んで「投げる」を押してください。';
    recentPlays = [];
  };
</script>

<svelte:head>
  <title>Svelte Baseball</title>
  <meta
    name="description"
    content="Svelte + TypeScript + Vite で構築した、1イニング守備を遊べるシンプルな野球ゲーム"
  />
</svelte:head>

<main class="app-shell">
  <section class="hero panel">
    <div class="hero-header">
      <div>
        <p class="eyebrow">{gameState.isInningOver ? 'Final Result' : 'One Inning Defense'}</p>
        <h1>Svelte Baseball</h1>
      </div>
      <button type="button" class="secondary-button" onclick={resetGame}>リプレイ</button>
    </div>

    <p class="lead">
      1イニング分の守備を担当し、3アウトまでに何点で抑えられるかを競う MVP です。
      Svelte + TypeScript + Vite の単一画面構成で、投球コース選択と進行ロジックを分離しています。
    </p>
  </section>

  <div class="content-grid">
    <section class="panel">
      <div class="panel-header">
        <h2>スコアボード</h2>
        <span class={`state-badge ${gameState.isInningOver ? 'is-over' : 'is-live'}`}>
          {gameState.isInningOver ? 'イニング終了' : 'プレイ中'}
        </span>
      </div>

      <div class="count-strip">
        <article class="count-card count-ball">
          <span class="status-label">ボール</span>
          <strong>{gameState.count.balls}</strong>
        </article>
        <article class="count-card count-strike">
          <span class="status-label">ストライク</span>
          <strong>{gameState.count.strikes}</strong>
        </article>
        <article class="count-card count-out">
          <span class="status-label">アウト</span>
          <strong>{gameState.outs}</strong>
        </article>
      </div>

      <div class="status-grid">
        <article>
          <span class="status-label">失点</span>
          <strong>{gameState.score}</strong>
        </article>
        <article>
          <span class="status-label">投球数</span>
          <strong>{gameState.pitchNumber}</strong>
        </article>
        <article>
          <span class="status-label">現在の打者</span>
          <strong>{gameState.batterNumber}人目</strong>
        </article>
        <article>
          <span class="status-label">前回コース</span>
          <strong>{gameState.lastPitchZone ? getPitchZone(gameState.lastPitchZone).label : 'なし'}</strong>
        </article>
      </div>

      <div class="bases-card">
        <div class="panel-subtitle-row">
          <h3>塁状況</h3>
          <span>{hasAnyRunner ? '走者あり' : '走者なし'}</span>
        </div>

        <div class="diamond">
          <div class={`base base-second ${gameState.bases.second ? 'occupied' : ''}`}>二塁</div>
          <div class={`base base-third ${gameState.bases.third ? 'occupied' : ''}`}>三塁</div>
          <div class={`base base-first ${gameState.bases.first ? 'occupied' : ''}`}>一塁</div>
          <div class="base home-plate">本塁</div>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <h2>投球コース</h2>
        <span class={`tendency tendency-${selectedZone.tendency}`}>
          {tendencyLabels[selectedZone.tendency]}
        </span>
      </div>

      <div class="zone-grid">
        {#each PITCH_ZONES as zone}
          <button
            type="button"
            class:selected={zone.id === selectedZoneId}
            onclick={() => {
              selectedZoneId = zone.id;
            }}
          >
            <span>{zone.label}</span>
          </button>
        {/each}
      </div>

      <p class="helper-text">{selectedZone.aimHint}</p>

      <button type="button" class="pitch-button" onclick={throwPitch} disabled={gameState.isInningOver}>
        {gameState.isInningOver ? 'イニング終了' : `${selectedZone.label}へ投げる`}
      </button>
    </section>

    <section class="panel">
      <div class="panel-header">
        <h2>直前の結果</h2>
        {#if lastSummary}
          <span class="result-tag">{outcomeLabels[lastSummary.outcome]}</span>
        {/if}
      </div>

      <div class="result-box">
        <span class="status-label">結果</span>
        <strong>{lastSummary ? outcomeLabels[lastSummary.outcome] : 'まだ投球していません'}</strong>
        <p>{lastDetail}</p>
      </div>

      <div class="panel-subtitle-row">
        <h3>このコースの結果テーブル</h3>
        <span>合計 100%</span>
      </div>

      <ul class="probability-list">
        {#each outcomeTable as entry}
          <li>
            <span>{outcomeLabels[entry.result]}</span>
            <strong>{entry.weight}%</strong>
          </li>
        {/each}
      </ul>
    </section>
  </div>

  <section class="panel">
    <div class="panel-header">
      <h2>投球ログ</h2>
      <span class="result-tag">{recentPlays.length}件</span>
    </div>

    {#if recentPlays.length === 0}
      <p class="empty-text">まだ投球ログはありません。コースを選んでゲームを始めてください。</p>
    {:else}
      <ul class="history-list">
        {#each recentPlays as play}
          <li>
            <div>
              <strong>#{play.pitchNumber} {play.zoneLabel}</strong>
              <p>{play.detail}</p>
            </div>
            <span>{play.outcomeLabel}</span>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  {#if gameState.isInningOver}
    <section class="panel game-over-panel">
      <p class="eyebrow">Game Over</p>
      <h2>3アウトでイニング終了</h2>
      <p class="lead">最終失点は <strong>{gameState.score}</strong> 点でした。</p>
      <p class="helper-text">
        角を突いて三振と凡打を狙うか、リスクを取ってストライクを先行させるかで展開が変わります。
      </p>
      <button type="button" class="pitch-button" onclick={resetGame}>もう一度プレイ</button>
    </section>
  {/if}
</main>
