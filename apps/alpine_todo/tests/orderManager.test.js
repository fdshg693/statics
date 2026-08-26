import { describe, it, expect } from 'vitest';
import { loadScript } from './loadScript.js';

const OrderManager = loadScript('shared/orderManager.js', 'OrderManager');

describe('OrderManager', () => {
  describe('定数', () => {
    it('GAP = 2^16 = 65536', () => {
      expect(OrderManager.GAP).toBe(65536);
    });

    it('MIN_GAP = 2', () => {
      expect(OrderManager.MIN_GAP).toBe(2);
    });
  });

  describe('between()', () => {
    it('2つの値の中間値を返す', () => {
      expect(OrderManager.between(0, 65536)).toBe(32768);
    });

    it('ビットシフトで計算される', () => {
      expect(OrderManager.between(0, 100)).toBe(50);
      expect(OrderManager.between(100, 200)).toBe(150);
    });

    it('奇数の間隔では切り捨てされる', () => {
      // (0 + 3) >> 1 = 1
      expect(OrderManager.between(0, 3)).toBe(1);
    });

    it('間隔がMIN_GAP未満の場合はnullを返す', () => {
      expect(OrderManager.between(0, 1)).toBeNull();
      expect(OrderManager.between(5, 5)).toBeNull();
    });

    it('ちょうどMIN_GAP=2の間隔では中間値を返す', () => {
      expect(OrderManager.between(0, 2)).toBe(1);
    });
  });

  describe('before()', () => {
    it('先頭のorder値からGAP分前の値を返す', () => {
      expect(OrderManager.before(65536)).toBe(0);
      expect(OrderManager.before(0)).toBe(-65536);
    });
  });

  describe('after()', () => {
    it('末尾のorder値からGAP分後の値を返す', () => {
      expect(OrderManager.after(0)).toBe(65536);
      expect(OrderManager.after(65536)).toBe(131072);
    });
  });

  describe('calcDropOrder()', () => {
    it('アイテムがない場合は0を返す', () => {
      expect(OrderManager.calcDropOrder(null, null)).toBe(0);
    });

    it('先頭にドロップ: before()で計算', () => {
      expect(OrderManager.calcDropOrder(null, { order: 65536 })).toBe(0);
    });

    it('末尾にドロップ: after()で計算', () => {
      expect(OrderManager.calcDropOrder({ order: 65536 }, null)).toBe(131072);
    });

    it('中間にドロップ: between()で計算', () => {
      expect(OrderManager.calcDropOrder({ order: 0 }, { order: 65536 })).toBe(32768);
    });

    it('間隔不足の場合はnullを返す', () => {
      expect(OrderManager.calcDropOrder({ order: 0 }, { order: 1 })).toBeNull();
    });
  });

  describe('normalize()', () => {
    it('order値をGAP間隔で振り直す', () => {
      const items = [{ order: 100 }, { order: 1 }, { order: 50 }];
      OrderManager.normalize(items);
      expect(items[0].order).toBe(0);
      expect(items[1].order).toBe(65536);
      expect(items[2].order).toBe(131072);
    });

    it('ソート順に並び替えられる', () => {
      const items = [
        { order: 300, text: 'c' },
        { order: 100, text: 'a' },
        { order: 200, text: 'b' },
      ];
      OrderManager.normalize(items);
      expect(items[0].text).toBe('a');
      expect(items[1].text).toBe('b');
      expect(items[2].text).toBe('c');
    });

    it('空配列でも動作する', () => {
      const items = [];
      OrderManager.normalize(items);
      expect(items).toEqual([]);
    });
  });

  describe('assignInitial()', () => {
    it('orderがnullのアイテムにGAP間隔で値を割り当てる', () => {
      const items = [
        { text: 'a', order: null },
        { text: 'b', order: null },
        { text: 'c', order: null },
      ];
      const changed = OrderManager.assignInitial(items);
      expect(changed).toBe(true);
      expect(items[0].order).toBe(0);
      expect(items[1].order).toBe(65536);
      expect(items[2].order).toBe(131072);
    });

    it('既にorderがあるアイテムは変更しない', () => {
      const items = [
        { text: 'a', order: 100 },
        { text: 'b', order: 200 },
      ];
      const changed = OrderManager.assignInitial(items);
      expect(changed).toBe(false);
      expect(items[0].order).toBe(100);
      expect(items[1].order).toBe(200);
    });

    it('orderがundefinedのアイテムも割り当て対象', () => {
      const items = [{ text: 'a' }];
      const changed = OrderManager.assignInitial(items);
      expect(changed).toBe(true);
      expect(items[0].order).toBe(0);
    });

    it('混在: orderがないアイテムのみ変更', () => {
      const items = [
        { text: 'a', order: 100 },
        { text: 'b', order: null },
        { text: 'c', order: 300 },
      ];
      const changed = OrderManager.assignInitial(items);
      expect(changed).toBe(true);
      expect(items[0].order).toBe(100);
      expect(items[1].order).toBe(65536);
      expect(items[2].order).toBe(300);
    });
  });

  describe('連続二分割', () => {
    it('16回の二分割後に間隔がMIN_GAP未満になる', () => {
      let prev = 0;
      let next = OrderManager.GAP; // 65536
      let mid;
      let splits = 0;

      while ((mid = OrderManager.between(prev, next)) !== null) {
        next = mid;
        splits++;
      }

      // 65536 → 32768 → ... → 2 → 1 (null): 16回
      expect(splits).toBe(16);
    });
  });
});
