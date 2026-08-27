# StaticApps – AKS + ArgoCD + Caddy 移行プラン

## 0. 決定事項サマリ（ヒアリング結果）

| 項目 | 決定内容 |
|---|---|
| 静的配信 | 全アプリを **1つのCaddy Pod** にまとめ、Caddyfileでパスルーティング |
| API切り出し | **htmx_sugoroku_server のみ** を別Podに切り出し（他はAPIを持たない） |
| イメージレジストリ | **GitHub Container Registry (ghcr.io)** + GitHub Actions |
| GitOpsリポジトリ | このリポジトリ自体を `git init` して GitHub push、ArゴCDはこのリポジトリを参照するモノレポ構成 |
| AKSプロビジョニング | **Terraform** でIaC化 |
| ドメイン/TLS | **Cloudflare Registrar** でドメイン取得（未取得）→ cert-manager + Let's Encrypt で自動TLS |
| ローカル検証 | **KIND + ArgoCD** で本番と同じGitOpsフローを検証 |

---

## 1. 全体アーキテクチャ

```
                         [ Cloudflare (Registrar + DNS) ]
                                    │  A record
                                    ▼
                     [ AKS: ingress-nginx (LoadBalancer, Public IP) ]
                                    │  TLS terminate (cert-manager証明書)
                                    ▼
                     [ Service: caddy-static (ClusterIP) ]
                                    │
                     ┌──────────────┴───────────────┐
                     ▼                               ▼
        [ Pod: caddy-static ]            [ Pod: htmx-sugoroku-api ]
        Caddyfileでパスルーティング          Flask (gunicorn) API
        - /alpine_todo/*                  reverse_proxy先
        - /blackjack/*                    Service: htmx-sugoroku-api
        - /simple_login/*
        - /vanilla_circle_cross/*
        - /vue_janken/*
        - /vue_rpg/*
        - /svelte_baseball/*
        - /htmx_sugoroku/*  → 静的はCaddy、
                               /htmx_sugoroku/api/*, /htmx_sugoroku/info
                               は reverse_proxy → htmx-sugoroku-api Service
        - /cdn_resources/*
        - /  → ランディング(アプリ一覧)ページ

ArgoCD (AKS上 / KIND上にもインストール) が本リポジトリの infra/k8s/overlays/{aks,kind}
を監視し、上記マニフェストを自動同期する。
```

**ルーティング方針の注意点**: 現状の各アプリはローカルの `simple_deliver` 経由でそれぞれ
`route: /` として単独配信される前提（=絶対パスで `/cdn_resources/...` 等を参照している箇所がある）。
1つのCaddyに集約してパスプレフィックスを切ると、アプリ内の絶対パス参照が壊れる可能性があるため、
各アプリのHTML/JS内の `cdn_resources` 参照パスを確認し、必要なら `base` タグやビルド設定（Viteの`base`等）
の調整が必要。**Phase 2 で個別に検証すること。**

---

## 2. リポジトリ構成の変更点

```
StaticApps/
├── apps/                      # 既存（変更なし）
├── cdn_resources/             # 既存（変更なし）
├── python_backend/            # 既存（変更なし）
├── infra/
│   ├── docker/
│   │   ├── static.Dockerfile          # 全静的アプリをビルドしてCaddyで固めるマルチステージ
│   │   ├── htmx-sugoroku-api.Dockerfile
│   │   └── Caddyfile
│   ├── terraform/
│   │   ├── main.tf                    # AKS, リソースグループ, Public IP 等
│   │   ├── variables.tf
│   │   ├── outputs.tf                 # kubeconfig等
│   │   └── backend.tf                 # tfstate保存先（Azure Storage推奨）
│   ├── k8s/
│   │   ├── base/
│   │   │   ├── namespace.yaml
│   │   │   ├── caddy-static-deployment.yaml
│   │   │   ├── caddy-static-service.yaml
│   │   │   ├── htmx-sugoroku-api-deployment.yaml
│   │   │   ├── htmx-sugoroku-api-service.yaml
│   │   │   ├── ingress.yaml
│   │   │   └── kustomization.yaml
│   │   └── overlays/
│   │       ├── kind/                  # ローカル検証用（TLSなし、imageは:local）
│   │       │   └── kustomization.yaml
│   │       └── aks/                   # 本番用（TLSあり、imageはCIタグ）
│   │           └── kustomization.yaml
│   └── argocd/
│       ├── bootstrap/                 # ArgoCD自体のinstall manifest参照
│       ├── infra-apps/                # ingress-nginx, cert-manager をArgoCD管理下に
│       │   ├── ingress-nginx-app.yaml
│       │   └── cert-manager-app.yaml
│       └── apps/
│           ├── statics-kind-app.yaml  # overlays/kind を向くApplication
│           └── statics-aks-app.yaml   # overlays/aks を向くApplication
├── .github/
│   └── workflows/
│       └── build-and-push.yaml
├── CLAUDE.md
└── README.md
```

`.claude/rules/architecture.md` にも `infra/` の役割を追記する（Phase 5 で対応）。

---

## 3. コンテナイメージ設計

### 3.1 `static-web` イメージ（全静的アプリ集約）

マルチステージビルドで各アプリのビルドを行い、最終ステージで `caddy:alpine` にまとめる。

- ビルドが必要なアプリ: `simple_login`, `vue_rpg`（tsc）/ `htmx_sugoroku`, `svelte_baseball`（vite build）
- ビルド不要（そのままコピー）: `alpine_todo`, `blackjack`, `vanilla_circle_cross`, `vue_janken`

```dockerfile
# infra/docker/static.Dockerfile （イメージ）
FROM node:20-alpine AS ts-build
WORKDIR /src
COPY apps/simple_login apps/simple_login
COPY apps/vue_rpg apps/vue_rpg
RUN npm install -g typescript && \
    tsc -p apps/simple_login/tsconfig.json && \
    cd apps/vue_rpg && npm ci && cd /src && \
    tsc -p apps/vue_rpg/tsconfig.json

FROM node:20-alpine AS htmx-build
WORKDIR /src/apps/htmx_sugoroku
COPY apps/htmx_sugoroku .
RUN npm ci && npm run build

FROM node:20-alpine AS svelte-build
WORKDIR /src/apps/svelte_baseball
COPY apps/svelte_baseball .
RUN npm ci && npm run build

FROM caddy:2-alpine
COPY infra/docker/Caddyfile /etc/caddy/Caddyfile
COPY apps/alpine_todo            /srv/alpine_todo
COPY apps/blackjack               /srv/blackjack
COPY apps/vanilla_circle_cross    /srv/vanilla_circle_cross
COPY apps/vue_janken               /srv/vue_janken
COPY cdn_resources                 /srv/cdn_resources
COPY --from=ts-build /src/apps/simple_login /srv/simple_login
COPY --from=ts-build /src/apps/vue_rpg      /srv/vue_rpg
COPY --from=htmx-build /src/apps/htmx_sugoroku/dist /srv/htmx_sugoroku
COPY --from=svelte-build /src/apps/svelte_baseball/dist /srv/svelte_baseball
```

### 3.2 `htmx-sugoroku-api` イメージ

`python_backend`（uv workspace）の `htmx_sugoroku_server` パッケージのみを使用。

**要検討**: `main.py` は `app.run(debug=True, ...)` で開発用サーバー。本番運用するなら
`gunicorn` 等のWSGIサーバーへの切り替えが必要（Phase 3 で対応、コード変更を伴うので要合意）。

```dockerfile
# infra/docker/htmx-sugoroku-api.Dockerfile （イメージ）
FROM python:3.13-slim
WORKDIR /app
RUN pip install uv
COPY python_backend python_backend
WORKDIR /app/python_backend
RUN uv sync --package htmx_sugoroku_server
EXPOSE 5000
CMD ["uv", "run", "--package", "htmx_sugoroku_server", "gunicorn", "-b", "0.0.0.0:5000", "htmx_sugoroku_server.main:app"]
```

---

## 4. Caddyfile 設計（イメージ）

```caddyfile
:80 {
    handle_path /alpine_todo/* {
        root * /srv/alpine_todo
        file_server
    }
    handle_path /blackjack/* {
        root * /srv/blackjack
        file_server
    }
    handle_path /simple_login/* {
        root * /srv/simple_login
        file_server
    }
    handle_path /vanilla_circle_cross/* {
        root * /srv/vanilla_circle_cross
        file_server
    }
    handle_path /vue_janken/* {
        root * /srv/vue_janken
        file_server
    }
    handle_path /vue_rpg/* {
        root * /srv/vue_rpg
        file_server
    }
    handle_path /svelte_baseball/* {
        root * /srv/svelte_baseball
        file_server
    }
    handle /htmx_sugoroku/api/* {
        uri strip_prefix /htmx_sugoroku
        reverse_proxy htmx-sugoroku-api.statics.svc.cluster.local:5000
    }
    handle /htmx_sugoroku/info {
        uri strip_prefix /htmx_sugoroku
        reverse_proxy htmx-sugoroku-api.statics.svc.cluster.local:5000
    }
    handle_path /htmx_sugoroku/* {
        root * /srv/htmx_sugoroku
        file_server
    }
    handle_path /cdn_resources/* {
        root * /srv/cdn_resources
        file_server
    }
    handle / {
        respond "StaticApps index (TODO: build a real landing page)" 200
    }
}
```

Kubernetes上ではTLSはIngress側（cert-manager）で終端するため、Caddyは`:80`のみでよい
（Caddyの自動HTTPSは無効化 = `auto_https off` をグローバルオプションで指定する）。

---

## 5. Kubernetes マニフェスト方針

- Namespace: `statics`（1つに集約）
- `caddy-static` Deployment（replicas: 2） + ClusterIP Service
- `htmx-sugoroku-api` Deployment（replicas: 2） + ClusterIP Service
- `Ingress`（ingress-nginx使用、`cert-manager.io/cluster-issuer: letsencrypt-prod` アノテーション付与）
- ghcr.io が private repoの場合は `imagePullSecrets` を各Deploymentに設定（Terraform or 手動でSecret作成）
- Kustomize base + overlay(`kind` / `aks`) でイメージタグ・TLS有無・レプリカ数を差分管理

---

## 6. ArgoCD 構成（app-of-appsパターン）

1. ArgoCD自体は Helm/公式install manifestで **手動ブートストラップ**（KIND/AKS 双方）
   （ArgoCD自身をArgoCDで管理する「鶏と卵」問題を避けるため、初回のみ手動）
2. `infra/argocd/infra-apps/` に ingress-nginx・cert-manager の Helm chart を参照する
   ArgoCD `Application` を配置し、GitOps管理下に置く
3. `infra/argocd/apps/statics-aks-app.yaml` が `infra/k8s/overlays/aks` を、
   `statics-kind-app.yaml` が `infra/k8s/overlays/kind` を参照
4. ルートの `Application`（app-of-apps）が上記すべてを束ねる

---

## 7. Terraform（AKS）方針

- Provider: `azurerm`
- 作成リソース: Resource Group, AKS Cluster（ノードプール小さめ、例 `Standard_B2s` x2、コスト重視）, Public IP（ingress用に予約IPを切る場合）
- ACRは使わない（ghcr.io利用のため不要）
- tfstateはAzure Storage Accountにリモート保存（要事前作成 or bootstrap用の別Terraform）
- Output: `kube_config`（`az aks get-credentials` でも代替可）

**未確定**: Azureサブスクリプション、リージョン、リソースグループ命名規則 → 実装時に確認

---

## 8. CI/CD（GitHub Actions）

`.github/workflows/build-and-push.yaml`:

1. `apps/**` または `python_backend/**` に変更がある push (main) をトリガー
2. `infra/docker/static.Dockerfile` / `infra/docker/htmx-sugoroku-api.Dockerfile` をビルド
3. `ghcr.io/<owner>/statics-web:<sha>` / `ghcr.io/<owner>/htmx-sugoroku-api:<sha>` としてpush
4. `infra/k8s/overlays/aks/kustomization.yaml` の `images:` タグを新SHAに書き換えてcommit&push
   （`yq` or `kustomize edit set image` を使用）
5. ArgoCDが変更を検知して自動sync（`selfHeal: true`, `automated: true` 設定）

---

## 9. ドメイン・TLS導入手順（Cloudflare Registrar、未取得）

1. Cloudflareアカウント作成 → ダッシュボード「Domain Registration」からドメイン検索・購入
   （**課金が発生する操作。実施前に必ずユーザー確認を取る**）
2. 購入するとCloudflareが自動でDNSゾーンも管理（ネームサーバーはCloudflare既定）
3. AKS + ingress-nginx をデプロイし、Service（LoadBalancer）の外部IPを取得
4. Cloudflare DNS管理画面で `A` レコード（例: `statics.example.com` → 上記外部IP）を作成
   - CloudflareのプロキシON（オレンジ雲）はHTTP-01チャレンジと相性が悪い場合があるため、
     証明書発行が安定するまでは **DNSのみ（グレー雲）** を推奨
5. cert-manager をインストールし、`ClusterIssuer`（`letsencrypt-prod`, HTTP-01チャレンジ、
   ingress-nginxを解決に使用）を作成
6. Ingressリソースに `cert-manager.io/cluster-issuer` アノテーションと `tls:` セクションを追加
   → 自動でCertificateが発行される

HTTP-01で十分な場合はCloudflare APIトークンは不要。ワイルドカード証明書が必要になった場合は
DNS-01 + Cloudflare APIトークン（`cert-manager-webhook-cloudflare` 等）への切り替えを検討。

---

## 10. ローカル(KIND)検証手順

1. `kind create cluster --name statics-local`
2. ArgoCD インストール（公式manifest, `kubectl apply -n argocd -f https://.../install.yaml`）
3. ingress-nginx インストール（KIND用の`hostPort`対応マニフェストを使用）
4. cert-manager は **省略可**（KINDでは公開ドメインがないため実TLS発行不可。`overlays/kind`はTLSなし構成）
5. `infra/argocd/apps/statics-kind-app.yaml` を `kubectl apply` してArgoCDに登録
6. ArgoCDが `overlays/kind` を同期 → `kubectl port-forward` または `kind`の`extraPortMappings`経由で
   `http://localhost:8080/` にアクセスして動作確認
7. 各アプリのパスルーティング・`htmx_sugoroku`のAPIリバースプロキシが機能するか確認

---

## 11. 実行フェーズ（作業順）

- （済）**Phase 0**: このリポジトリを `git init` → GitHubにリポジトリ作成してpush
- （済）**Phase 1**: `infra/docker/*` を作成し、ローカルで `docker build` して両イメージが正しく動くか確認
  （各アプリの絶対パス参照問題の洗い出し・修正含む）
- （済）**Phase 2**: `infra/k8s/base` + `overlays/kind` を作成、KIND + ArgoCDで動作確認（Section 10）
- **Phase 3**: `htmx_sugoroku_server` を gunicorn 対応に修正（要合意）
- **Phase 4**: `.github/workflows/build-and-push.yaml` を作成、ghcr.ioへのpushを確認
- **Phase 5**: `infra/terraform` でAKSをプロビジョニング
- **Phase 6**: Cloudflareでドメイン取得（要ユーザー確認・課金発生）、DNS設定
- **Phase 7**: AKSにingress-nginx / cert-manager / ArgoCDをブートストラップ、
  `infra/argocd/apps/statics-aks-app.yaml` を登録して本番同期
- **Phase 8**: 動作確認・`.claude/rules/architecture.md` 更新

---

## 12. 未確定・要検討事項

- Azureサブスクリプション / リージョン / 課金上限
- ghcr.ioイメージをpublicにするか、private + imagePullSecretsにするか
- ドメイン名そのもの（未取得）
- `htmx_sugoroku_server` の `games = {}` はインメモリ状態 → replicas: 2 にするとPod間で
  ゲーム状態が共有されない（セッションアフィニティ or Redis等の外部ストレージが必要になる可能性）
  → 差し当たり `replicas: 1` から開始し、必要になったら再検討
- ランディングページ（`/`）の内容
- 監視・ログ（Azure Monitor等）は本プランのスコープ外
