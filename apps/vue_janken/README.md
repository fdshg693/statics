# vue_janken

## 概要

Vue 3 で作られたブラウザ向けのじゃんけんゲームです。
CPU と対戦しながら結果を蓄積し、履歴や統計をリアルタイムに確認できます。

## 使用技術

- Vue.js 3
- Composition API
- ES Modules
- HTML / CSS / JavaScript
- localStorage
- ローカル CDN リソース: `/cdn_resources/vue.esm-browser.js`

## 実装の特徴

- コンポーネントと Composable を分けた Vue 3 構成です。
- ゲーム進行、スコア、履歴表示、確認モーダルなどを責務ごとに分離しています。
- `reactive` や `computed` を使って、対戦結果と統計表示を同期させています。
- データは localStorage に保存されるため、再読み込み後も履歴や集計を保持できます。

## 起動方法

Vue を `/cdn_resources/` から読み込むため、静的サーバー経由で起動してください。

```powershell
cd c:\CodeRoot\StaticApps
python -m http.server 8000
```

起動後、`http://localhost:8000/apps/vue_janken/` にアクセスします。
