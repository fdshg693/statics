import { describe, it, expect } from 'vitest';
import { loadScript } from './loadScript.js';

const TodoSort = loadScript('todo/todoSort.js', 'TodoSort');

describe('TodoSort', () => {
  it('未設定キーは asc で追加する', () => {
    expect(TodoSort.toggle([], 'text')).toEqual([{ key: 'text', dir: 'asc' }]);
  });

  it('asc の次は desc に切り替える', () => {
    expect(TodoSort.toggle([{ key: 'text', dir: 'asc' }], 'text')).toEqual([
      { key: 'text', dir: 'desc' },
    ]);
  });

  it('desc の次はキーを除去する', () => {
    expect(TodoSort.toggle([{ key: 'text', dir: 'desc' }], 'text')).toEqual([]);
  });

  it('優先度付きの表示情報を返す', () => {
    const info = TodoSort.getInfo([
      { key: 'text', dir: 'asc' },
      { key: 'completed', dir: 'desc' },
    ], 'text');

    expect(info).toEqual({ dir: 'asc', priority: 2 });
  });

  it('UI表示用のラベルを返す', () => {
    expect(TodoSort.getDisplay([{ key: 'createdAt', dir: 'asc' }])).toEqual([
      { key: 'createdAt', dir: 'asc', label: '作成日' },
    ]);
  });
});
