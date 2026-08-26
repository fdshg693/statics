import { describe, it, expect, beforeEach } from 'vitest';
import { loadAlpineComponent } from './loadScript.js';

function createStatsComponent() {
  const factory = loadAlpineComponent([
    'stats/statsCalculator.js',
    'stats/chartDataBuilder.js',
    'stats/motivationMessage.js',
    'stats/chartRenderer.js',
    'stats.js',
  ], 'data', 'statsApp');
  const component = factory();

  // Alpine メソッドのモック
  component.$watch = () => {};
  component.$nextTick = (fn) => fn();
  component.$refs = {};

  return component;
}

describe('statsApp', () => {
  let component;
  let mockTodos;

  beforeEach(() => {
    component = createStatsComponent();

    mockTodos = [];
    component.$store = {
      todoStore: {
        _version: 1,
        getAllTodos: () => mockTodos,
        getCompletedTodos: () => mockTodos.filter(t => t.completed),
        getActiveTodos: () => mockTodos.filter(t => !t.completed),
      },
    };
  });

  describe('formatTime()', () => {
    it('0はデータなし', () => {
      expect(component.formatTime(0)).toBe('データなし');
    });

    it('1時間未満は分で表示', () => {
      expect(component.formatTime(0.5)).toBe('30分');
    });

    it('1時間ちょうどは時間で表示', () => {
      expect(component.formatTime(1)).toBe('1.0時間');
    });

    it('24時間未満は時間で表示', () => {
      expect(component.formatTime(2.5)).toBe('2.5時間');
    });

    it('24時間以上は日で表示', () => {
      expect(component.formatTime(48)).toBe('2.0日');
    });

    it('24時間ちょうどは日で表示', () => {
      expect(component.formatTime(24)).toBe('1.0日');
    });
  });

  describe('formatDate()', () => {
    it('月/日のフォーマットで返す', () => {
      expect(component.formatDate(new Date(2026, 0, 5))).toBe('1/5');
      expect(component.formatDate(new Date(2026, 11, 25))).toBe('12/25');
    });
  });

  describe('setPeriod()', () => {
    it('期間を変更する', () => {
      component.setPeriod('weekly');
      expect(component.period).toBe('weekly');

      component.setPeriod('monthly');
      expect(component.period).toBe('monthly');
    });
  });

  describe('stats (基本統計)', () => {
    it('ToDoがない場合のデフォルト値', () => {
      const stats = component.stats;
      expect(stats.total).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.active).toBe(0);
      expect(stats.completionRate).toBe(0);
    });

    it('完了率を正しく計算する', () => {
      const now = new Date();
      mockTodos.push(
        { id: 1, completed: false, createdAt: now.toISOString() },
        { id: 2, completed: true, createdAt: now.toISOString(), completedAt: now.toISOString() },
        { id: 3, completed: true, createdAt: now.toISOString(), completedAt: now.toISOString() },
      );
      component.$store.todoStore._version = 2;

      const stats = component.stats;
      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(2);
      expect(stats.active).toBe(1);
      expect(stats.completionRate).toBe(67); // Math.round(2/3 * 100)
    });

    it('今日の完了数をカウントする', () => {
      const now = new Date();
      mockTodos.push(
        { id: 1, completed: true, createdAt: now.toISOString(), completedAt: now.toISOString() },
      );
      component.$store.todoStore._version = 3;

      expect(component.stats.todayCompleted).toBe(1);
    });

    it('平均完了時間を計算する', () => {
      const created = new Date('2026-01-01T00:00:00Z');
      const completed = new Date('2026-01-01T02:00:00Z'); // 2時間後
      mockTodos.push(
        { id: 1, completed: true, createdAt: created.toISOString(), completedAt: completed.toISOString() },
      );
      component.$store.todoStore._version = 4;

      expect(component.stats.avgCompletionTime).toBe('2.0時間');
    });
  });

  describe('groupByDay()', () => {
    it('過去7日間のデータをグループ化する', () => {
      const result = component.groupByDay([]);
      const keys = Object.keys(result);
      expect(keys).toHaveLength(7);
      expect(Object.values(result).every(v => v === 0)).toBe(true);
    });

    it('completedAtに基づいてカウントする', () => {
      const now = new Date();
      const key = component.formatDate(now);

      const todos = [
        { completedAt: now.toISOString() },
        { completedAt: now.toISOString() },
      ];

      const result = component.groupByDay(todos);
      expect(result[key]).toBe(2);
    });
  });

  describe('groupByMonth()', () => {
    it('過去12ヶ月のデータをグループ化する', () => {
      const result = component.groupByMonth([]);
      const keys = Object.keys(result);
      expect(keys).toHaveLength(12);
    });
  });

  describe('chartData', () => {
    it('日別のチャートデータを返す', () => {
      component.period = 'daily';
      component.$store.todoStore._version = 10;

      const data = component.chartData;
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(7);
      expect(data[0]).toHaveProperty('label');
      expect(data[0]).toHaveProperty('value');
      expect(data[0]).toHaveProperty('percentage');
    });
  });

  describe('motivationMessage', () => {
    it('ToDoがない場合は空文字列', () => {
      component.$store.todoStore._version = 20;
      expect(component.motivationMessage).toBe('');
    });

    it('今日10個以上完了で最高メッセージ', () => {
      const now = new Date();
      for (let i = 0; i < 10; i++) {
        mockTodos.push({
          id: i + 1,
          completed: true,
          createdAt: now.toISOString(),
          completedAt: now.toISOString(),
        });
      }
      component.$store.todoStore._version = 21;

      expect(component.motivationMessage).toContain('🔥');
    });

    it('完了済みがある場合は何らかのメッセージを返す', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      mockTodos.push({
        id: 1,
        completed: true,
        createdAt: yesterday.toISOString(),
        completedAt: yesterday.toISOString(),
      });
      component.$store.todoStore._version = 22;

      expect(component.motivationMessage).not.toBe('');
    });
  });
});
