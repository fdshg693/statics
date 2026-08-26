/**
 * RPGゲームで使用する定数定義
 * マジックナンバーを避け、保守性を向上させるための定数ファイル
 */

/**
 * 戦闘システムに関連する定数
 * @namespace BattleConstants
 */
export const BattleConstants = {
  /**
   * ダメージ計算時のランダム要素の最小倍率
   * @type {number}
   */
  DAMAGE_RANDOM_MIN: 0.8,

  /**
   * ダメージ計算時のランダム要素の最大倍率
   * @type {number}
   */
  DAMAGE_RANDOM_MAX: 1.2,

  /**
   * 防御アクション時のダメージ軽減率（50%軽減）
   * @type {number}
   */
  DEFENSE_DAMAGE_REDUCTION: 0.5,

  /**
   * 攻撃時の最小ダメージ（どんなに防御力が高くても必ず与えるダメージ）
   * @type {number}
   */
  MINIMUM_DAMAGE: 1,
};

/**
 * プレイヤーのアクションに関連する定数
 * @namespace PlayerActionConstants
 */
export const PlayerActionConstants = {
  /**
   * 回復アクション時の回復量（最大HPに対する割合）
   * @type {number}
   */
  HEAL_RATE: 0.3,

  /**
   * 初期MP（最大MP）
   * @type {number}
   */
  INITIAL_MP: 30,

  /**
   * 通常攻撃のMP消費
   * @type {number}
   */
  ATTACK_MP_COST: 0,

  /**
   * 回復のMP消費
   * @type {number}
   */
  HEAL_MP_COST: 8,

  /**
   * 防御のMP消費
   * @type {number}
   */
  DEFEND_MP_COST: 4,

  /**
   * 逃走のMP消費
   * @type {number}
   */
  ESCAPE_MP_COST: 6,

  /**
   * 逃走アクション時の成功率（50%）
   * @type {number}
   */
  ESCAPE_SUCCESS_RATE: 0.5,
};

/**
 * レベルアップ時のステータス成長に関連する定数
 * @namespace LevelUpConstants
 */
export const LevelUpConstants = {
  /**
   * レベルアップ時のHP増加量
   * @type {number}
   */
  HP_INCREASE: 10,

  /**
   * レベルアップ時の攻撃力増加量
   * @type {number}
   */
  ATTACK_INCREASE: 3,

  /**
   * レベルアップ時の防御力増加量
   * @type {number}
   */
  DEFENSE_INCREASE: 2,

  /**
   * レベルアップ時のMP増加量
   * @type {number}
   */
  MP_INCREASE: 5,

  /**
   * 次のレベルアップに必要な経験値の倍率
   * 例: レベル1→2に100EXP必要な場合、レベル2→3には150EXP必要
   * @type {number}
   */
  EXP_MULTIPLIER: 1.5,
};

/**
 * 階層システムに関連する定数
 * @namespace FloorConstants
 */
export const FloorConstants = {
  /**
   * 次の階層に進むために必要な戦闘回数
   * @type {number}
   */
  BATTLES_PER_FLOOR: 3,
};

/**
 * 敵のタイプ別の能力値倍率
 * @namespace EnemyTypeMultipliers
 */
export const EnemyTypeMultipliers = {
  /**
   * 通常敵の能力値倍率（基準値）
   * @type {number}
   */
  NORMAL: 1.0,

  /**
   * リーダー敵の能力値倍率（通常の1.5倍）
   * @type {number}
   */
  LEADER: 1.5,

  /**
   * ボス敵の能力値倍率（通常の2倍）
   * @type {number}
   */
  BOSS: 2.0,
};

/**
 * すべての定数をまとめたデフォルトエクスポート
 */
export default {
  BattleConstants,
  PlayerActionConstants,
  LevelUpConstants,
  FloorConstants,
  EnemyTypeMultipliers,
};
