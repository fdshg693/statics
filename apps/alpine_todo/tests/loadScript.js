import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const jsDir = resolve(__dirname, '..', 'js');

function readScripts(fileNames) {
  return []
    .concat(fileNames)
    .map(fileName => readFileSync(resolve(jsDir, fileName), 'utf-8'))
    .join('\n');
}

/**
 * ブラウザ用スクリプトファイルを読み込み、指定した変数を返す
 * (class宣言やconst等、ブロックスコープの変数を抽出可能)
 *
 * @param {string|string[]} fileNames - js/ 配下のファイル名
 * @param {string} returnVar - 返す変数名
 * @param {object} globals - 追加のグローバル変数
 * @returns {*}
 */
export function loadScript(fileNames, returnVar, globals = {}) {
  const code = readScripts(fileNames);
  const paramNames = Object.keys(globals);
  const paramValues = Object.values(globals);
  return new Function(...paramNames, `${code}\nreturn ${returnVar};`)(...paramValues);
}

/**
 * Alpine.store() / Alpine.data() で登録されるコンポーネント定義を抽出する
 *
 * ソースファイルを new Function で実行し、Alpine のモックで定義をキャプチャする。
 * document.addEventListener('alpine:init', ...) の登録を避けるため、
 * Proxy で document をラップして alpine:init コールバックを即時実行する。
 *
 * @param {string|string[]} fileNames - js/ 配下のファイル名
 * @param {'store'|'data'} type - 'store' = Alpine.store(), 'data' = Alpine.data()
 * @param {string} name - 登録名 ('todoStore', 'statsApp' 等)
 * @param {object} globals - 追加のグローバル変数 (例: { OrderManager })
 * @returns {*} store定義オブジェクト or dataファクトリ関数
 */
export function loadAlpineComponent(fileNames, type, name, globals = {}) {
  const code = readScripts(fileNames);

  let captured;
  const mockAlpine = {
    store: type === 'store'
      ? (n, def) => { if (n === name) captured = def; }
      : () => {},
    data: type === 'data'
      ? (n, factory) => { if (n === name) captured = factory; }
      : () => {},
  };

  // alpine:init リスナーの蓄積を防ぐため、Proxy で即時実行する
  const docProxy = new Proxy(document, {
    get(target, prop) {
      if (prop === 'addEventListener') {
        return (event, callback) => {
          if (event === 'alpine:init') {
            callback();
          } else {
            target.addEventListener(event, callback);
          }
        };
      }
      const value = Reflect.get(target, prop);
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });

  const allGlobals = { Alpine: mockAlpine, document: docProxy, ...globals };
  const paramNames = Object.keys(allGlobals);
  const paramValues = Object.values(allGlobals);

  const fn = new Function(...paramNames, code);
  fn(...paramValues);

  return captured;
}
