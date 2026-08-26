import { describe, it, expect } from 'vitest';
import { loadScript } from './loadScript.js';

const TodoQuery = loadScript('todo/todoQuery.js', 'TodoQuery');

describe('TodoQuery', () => {
  const todos = [
    { id: 1, text: '牛乳を買う', description: 'スーパーに寄る', completed: false, createdAt: '2026-05-20T10:00:00.000Z', order: 200 },
    { id: 2, text: '資料を作る', description: '会議用スライド', completed: true, createdAt: '2026-05-22T10:00:00.000Z', order: 100 },
    { id: 3, text: '掃除する', description: '', completed: false, createdAt: '2026-05-24T10:00:00.000Z', order: 300 },
  ];

  it('状態フィルタを適用する', () => {
    expect(TodoQuery.filterByStatus(todos, 'active')).toHaveLength(2);
    expect(TodoQuery.filterByStatus(todos, 'completed')).toHaveLength(1);
    expect(TodoQuery.filterByStatus(todos, 'all')).toHaveLength(3);
  });

  it('検索文字列を大文字小文字無視で適用する', () => {
    const result = TodoQuery.filterBySearchText(
      [{ text: 'Write Report', description: '' }, { text: 'clean room', description: '' }],
      'report',
    );

    expect(result).toHaveLength(1);
    expect(result[0].text).toBe('Write Report');
  });

  it('本文にも検索文字列を適用する', () => {
    const result = TodoQuery.filterBySearchText(todos, 'スライド');
    expect(result.map(todo => todo.id)).toEqual([2]);
  });

  it('日付範囲フィルタを適用する', () => {
    const result = TodoQuery.filterByDateRange(todos, '2026-05-21', '2026-05-23');
    expect(result.map(todo => todo.id)).toEqual([2]);
  });

  it('複数ソートキーの優先度に従って並び替える', () => {
    const result = TodoQuery.sortTodos(todos, [
      { key: 'text', dir: 'asc' },
      { key: 'completed', dir: 'asc' },
    ]);

    expect(result.map(todo => todo.id)).toEqual([1, 3, 2]);
  });

  it('フィルタ・検索・ソートをまとめて適用する', () => {
    const result = TodoQuery.getFilteredTodos({
      todos,
      filter: 'active',
      searchText: 'する',
      dateFrom: '',
      dateTo: '',
      sortKeys: [{ key: 'createdAt', dir: 'desc' }],
    });

    expect(result.map(todo => todo.id)).toEqual([3]);
  });
});
