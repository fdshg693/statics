import { describe, it, expect, beforeEach } from 'vitest';
import { loadScript, loadAlpineComponent } from './loadScript.js';

const OrderManager = loadScript('shared/orderManager.js', 'OrderManager');

/** テストごとに新しいストアインスタンスを生成する */
function createStore() {
  return loadAlpineComponent([
    'shared/orderManager.js',
    'shared/toast.js',
    'shared/todoRepository.js',
    'shared/todoService.js',
    'todoStore.js',
  ], 'store', 'todoStore');
}

describe('todoStore', () => {
  let store;

  beforeEach(() => {
    localStorage.clear();
    store = createStore();
  });

  describe('init()', () => {
    it('localStorageが空の場合、デフォルト値で初期化', () => {
      store.init();
      expect(store.todos).toEqual([]);
      expect(store.nextId).toBe(1);
    });

    it('localStorageからデータを読み込む', () => {
      const data = {
        todos: [{ id: 1, text: 'test', completed: false, order: 0 }],
        nextId: 2,
      };
      localStorage.setItem('todos', JSON.stringify(data));

      store.init();
      expect(store.todos).toHaveLength(1);
      expect(store.todos[0].text).toBe('test');
      expect(store.nextId).toBe(2);
    });

    it('不正なJSONの場合、デフォルト値にリセット', () => {
      localStorage.setItem('todos', 'invalid json');

      store.init();
      expect(store.todos).toEqual([]);
      expect(store.nextId).toBe(1);
    });

    it('order値がないアイテムにマイグレーションを適用', () => {
      const data = {
        todos: [
          { id: 1, text: 'a' },
          { id: 2, text: 'b' },
        ],
        nextId: 3,
      };
      localStorage.setItem('todos', JSON.stringify(data));

      store.init();
      expect(store.todos[0].order).toBe(0);
      expect(store.todos[1].order).toBe(65536);
    });

    it('本文がない既存データに空文字を補完する', () => {
      const data = {
        todos: [
          { id: 1, text: 'a', completed: false, order: 0 },
        ],
        nextId: 2,
      };
      localStorage.setItem('todos', JSON.stringify(data));

      store.init();

      expect(store.todos[0].description).toBe('');

      const saved = JSON.parse(localStorage.getItem('todos'));
      expect(saved.todos[0].description).toBe('');
    });
  });

  describe('addTodo()', () => {
    beforeEach(() => store.init());

    it('新しいToDoを追加する', () => {
      store.addTodo('テスト');
      expect(store.todos).toHaveLength(1);
      expect(store.todos[0].text).toBe('テスト');
      expect(store.todos[0].description).toBe('');
      expect(store.todos[0].completed).toBe(false);
      expect(store.todos[0].completedAt).toBeNull();
      expect(store.todos[0].id).toBe(1);
    });

    it('本文付きのToDoを追加する', () => {
      store.addTodo('タイトル', '本文');
      expect(store.todos[0].description).toBe('本文');
    });

    it('IDが自動インクリメントされる', () => {
      store.addTodo('ToDo 1');
      store.addTodo('ToDo 2');
      expect(store.todos[0].id).toBe(1);
      expect(store.todos[1].id).toBe(2);
    });

    it('空文字列は追加しない', () => {
      store.addTodo('');
      expect(store.todos).toHaveLength(0);
    });

    it('空白のみのテキストは追加しない', () => {
      store.addTodo('   ');
      expect(store.todos).toHaveLength(0);
    });

    it('テキストの前後の空白をトリムする', () => {
      store.addTodo('  テスト  ');
      expect(store.todos[0].text).toBe('テスト');
    });

    it('本文の前後の空白をトリムする', () => {
      store.addTodo('タイトル', '  本文  ');
      expect(store.todos[0].description).toBe('本文');
    });

    it('createdAtがISO文字列で設定される', () => {
      store.addTodo('テスト');
      const created = new Date(store.todos[0].createdAt);
      expect(created.getTime()).not.toBeNaN();
    });

    it('order値が末尾に追加される', () => {
      store.addTodo('ToDo 1');
      store.addTodo('ToDo 2');
      expect(store.todos[1].order).toBeGreaterThan(store.todos[0].order);
      expect(store.todos[1].order - store.todos[0].order).toBe(OrderManager.GAP);
    });

    it('localStorageに保存される', () => {
      store.addTodo('テスト');
      const saved = JSON.parse(localStorage.getItem('todos'));
      expect(saved.todos).toHaveLength(1);
      expect(saved.nextId).toBe(2);
    });
  });

  describe('deleteTodo()', () => {
    beforeEach(() => {
      store.init();
      store.addTodo('ToDo 1');
      store.addTodo('ToDo 2');
    });

    it('指定IDのToDoを削除する', () => {
      store.deleteTodo(1);
      expect(store.todos).toHaveLength(1);
      expect(store.todos[0].id).toBe(2);
    });

    it('存在しないIDを指定してもエラーにならない', () => {
      store.deleteTodo(999);
      expect(store.todos).toHaveLength(2);
    });

    it('削除後にlocalStorageが更新される', () => {
      store.deleteTodo(1);
      const saved = JSON.parse(localStorage.getItem('todos'));
      expect(saved.todos).toHaveLength(1);
    });
  });

  describe('updateTodo()', () => {
    beforeEach(() => {
      store.init();
      store.addTodo('元タイトル', '元本文');
    });

    it('タイトルと本文を更新する', () => {
      store.updateTodo(1, '新タイトル', '新本文');
      expect(store.todos[0].text).toBe('新タイトル');
      expect(store.todos[0].description).toBe('新本文');
    });

    it('空タイトルでは更新しない', () => {
      const hasUpdated = store.updateTodo(1, '   ', '新本文');
      expect(hasUpdated).toBe(false);
      expect(store.todos[0].text).toBe('元タイトル');
      expect(store.todos[0].description).toBe('元本文');
    });

    it('更新内容をlocalStorageに保存する', () => {
      store.updateTodo(1, '保存後タイトル', '保存後本文');
      const saved = JSON.parse(localStorage.getItem('todos'));
      expect(saved.todos[0].text).toBe('保存後タイトル');
      expect(saved.todos[0].description).toBe('保存後本文');
    });
  });

  describe('toggleComplete()', () => {
    beforeEach(() => {
      store.init();
      store.addTodo('テスト');
    });

    it('未完了→完了にトグル', () => {
      store.toggleComplete(1);
      expect(store.todos[0].completed).toBe(true);
      expect(store.todos[0].completedAt).toBeTruthy();
    });

    it('完了→未完了にトグル', () => {
      store.toggleComplete(1);
      store.toggleComplete(1);
      expect(store.todos[0].completed).toBe(false);
      expect(store.todos[0].completedAt).toBeNull();
    });

    it('completedAtにISO文字列が設定される', () => {
      store.toggleComplete(1);
      const completedAt = new Date(store.todos[0].completedAt);
      expect(completedAt.getTime()).not.toBeNaN();
    });

    it('存在しないIDは無視される', () => {
      store.toggleComplete(999);
      expect(store.todos[0].completed).toBe(false);
    });
  });

  describe('reorderTodo()', () => {
    beforeEach(() => {
      store.init();
      store.addTodo('ToDo 1');
      store.addTodo('ToDo 2');
    });

    it('order値を更新する', () => {
      store.reorderTodo(1, 999);
      expect(store.todos[0].order).toBe(999);
    });

    it('存在しないIDは無視される', () => {
      const originalOrder = store.todos[0].order;
      store.reorderTodo(999, 12345);
      expect(store.todos[0].order).toBe(originalOrder);
    });
  });

  describe('normalizeOrders()', () => {
    beforeEach(() => {
      store.init();
      store.addTodo('a');
      store.addTodo('b');
      store.addTodo('c');
    });

    it('order値をGAP間隔で振り直す', () => {
      // わざと間隔を詰める
      store.todos[0].order = 1;
      store.todos[1].order = 2;
      store.todos[2].order = 3;

      store.normalizeOrders();

      expect(store.todos[0].order).toBe(0);
      expect(store.todos[1].order).toBe(65536);
      expect(store.todos[2].order).toBe(131072);
    });
  });

  describe('フィルターメソッド', () => {
    beforeEach(() => {
      store.init();
      store.addTodo('active1');
      store.addTodo('active2');
      store.addTodo('completed1');
      store.toggleComplete(3);
    });

    it('getAllTodos()は全件返す', () => {
      expect(store.getAllTodos()).toHaveLength(3);
    });

    it('getActiveTodos()は未完了のみ返す', () => {
      const active = store.getActiveTodos();
      expect(active).toHaveLength(2);
      expect(active.every(t => !t.completed)).toBe(true);
    });

    it('getCompletedTodos()は完了済みのみ返す', () => {
      const completed = store.getCompletedTodos();
      expect(completed).toHaveLength(1);
      expect(completed[0].completed).toBe(true);
    });
  });

  describe('算出プロパティ', () => {
    beforeEach(() => {
      store.init();
      store.addTodo('active1');
      store.addTodo('completed1');
      store.toggleComplete(2);
    });

    it('activeCountは未完了数', () => {
      expect(store.activeCount).toBe(1);
    });

    it('completedCountは完了数', () => {
      expect(store.completedCount).toBe(1);
    });

    it('totalCountは全数', () => {
      expect(store.totalCount).toBe(2);
    });
  });

  describe('save() / load サイクル', () => {
    it('保存したデータを再読み込みできる', () => {
      store.init();
      store.addTodo('永続化テスト');
      store.toggleComplete(1);

      // 新しいストアで読み込み
      const store2 = createStore();
      store2.init();

      expect(store2.todos).toHaveLength(1);
      expect(store2.todos[0].text).toBe('永続化テスト');
      expect(store2.todos[0].completed).toBe(true);
      expect(store2.nextId).toBe(2);
    });
  });

  describe('_version', () => {
    it('save()ごとにインクリメントされる', () => {
      store.init();
      const v0 = store._version;

      store.addTodo('test');
      expect(store._version).toBe(v0 + 1);

      store.toggleComplete(1);
      expect(store._version).toBe(v0 + 2);
    });
  });
});
