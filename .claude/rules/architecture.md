---
paths:
  - "**"
---

## StaticApps 全体構成

`apps/` 配下の各フォルダは完全に独立したアプリケーション（ビルドツール・依存関係を共有しない）。作業前に必ず対象アプリの `apps/<name>/README.md` を読むこと。詳細な一覧・起動方法はルート `README.md` を参照（本ファイルでは重複記載しない）。

- **TypeScript コンパイル済みアプリ**（`simple_login`, `vue_rpg`）: `ts/` を編集し `tsc -p apps/<name>/tsconfig.json` で `js/` に出力。生成済み `js/`/`dist/` を直接編集しない。
- **Vite ビルドアプリ**（`htmx_sugoroku`, `svelte_baseball`）: `src/` を編集し `npm run build` で `dist/` に出力。
- **ビルド不要アプリ**（`alpine_todo`, `blackjack`, `vanilla_circle_cross`, `vue_janken`）: `js/` を直接編集。CDN ライブラリ（Alpine/Vue）は `cdn_resources/` のローカルコピーを `<script type="module">` / import map で読み込む（外部 CDN URL は使わない）。
- `config.yaml` を持つアプリは `python_backend` の `simple-deliver`（`uv run simple-deliver ..\apps\<name>\config.yaml`）経由で配信する前提。ES Modules を使うため直接ブラウザで `index.html` を開くと動かないことが多い。`svelte_baseball` のみ `config.yaml` を持たず、素の Vite (`npm run dev`/`build`) または `apps/justfile` の対応ターゲットで動かす。
- `apps/justfile` に各アプリの起動コマンドがまとまっているが、`svelte_baseball` 以外は暗黙に `python_backend` へ `cd` してから `simple-deliver` を呼ぶ構造になっている点に注意。
- `python_backend`（uv workspace）は静的配信サーバー (`simple_deliver`) と `htmx_sugoroku` 専用の Flask API (`htmx_sugoroku_server`) を提供。詳細は [[SimpleDeliver]] / [[HtmxSugorokuGameApi]] を参照。
- `experiments/` は単体検証用の使い捨て HTML。恒久的なアプリとしては扱わない。

## infra/ 構成（AKS + ArgoCD + Caddy 移行）

`apps/` の全静的アプリを AKS 上の1つの Caddy Pod にパスルーティングで集約し、`htmx_sugoroku` の API のみ別 Pod（gunicorn）に切り出す構成。詳細な設計・作業フェーズは [[PLAN]]（リポジトリ直下 `PLAN.md`）を参照。

- `infra/docker/`: `static.Dockerfile`（全静的アプリをビルドして `caddy:2-alpine` に固める）、`htmx-sugoroku-api.Dockerfile`（`python_backend` の `htmx_sugoroku_server` を gunicorn で起動）、`Caddyfile`。
- `infra/terraform/`: AKS クラスタ（リソースグループ `rg-statics`、クラスタ名 `statics-aks`、japaneast）を IaC でプロビジョニング。tfstate はリモート管理（リソースグループ `rg-statics-tfstate` / ストレージアカウント `ststaticstfstate` / コンテナ `tfstate`、`backend.tf` で参照）。`terraform apply` は実課金を伴うため実行前に必ずユーザー確認を取ること。
- `infra/k8s/`: `base/`（Namespace・Deployment・Service・Ingress の共通マニフェスト）+ `overlays/{kind,aks}`（Kustomize でイメージタグ・TLS有無・レプリカ数を差分管理）。
- `infra/argocd/`: `infra-apps/`（ingress-nginx・cert-manager を ArgoCD 管理下に）、`apps/`（`overlays/kind` / `overlays/aks` を参照する Application）。ArgoCD 自体は鶏卵問題を避けるため手動ブートストラップ。
- `.github/workflows/build-and-push.yaml`: `apps/**` / `python_backend/**` の変更を ghcr.io にビルド&push し、`overlays/aks` のイメージタグを自動更新。
