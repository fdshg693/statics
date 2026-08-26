FROM node:20-alpine AS ts-build
WORKDIR /src
RUN npm install -g typescript@5.9.3

COPY apps/simple_login apps/simple_login
RUN tsc -p apps/simple_login/tsconfig.json && \
    rm -rf apps/simple_login/ts apps/simple_login/tsconfig.json \
           apps/simple_login/config.yaml apps/simple_login/README.md \
           apps/simple_login/NEXT.md

COPY apps/vue_rpg apps/vue_rpg
RUN cd apps/vue_rpg && npm ci && cd /src && tsc -p apps/vue_rpg/tsconfig.json && \
    rm -rf apps/vue_rpg/ts apps/vue_rpg/tsconfig.json apps/vue_rpg/node_modules \
           apps/vue_rpg/package.json apps/vue_rpg/package-lock.json \
           apps/vue_rpg/config.yaml apps/vue_rpg/README.md apps/vue_rpg/docs

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
COPY apps/alpine_todo             /srv/alpine_todo
COPY apps/blackjack                /srv/blackjack
COPY apps/vanilla_circle_cross     /srv/vanilla_circle_cross
COPY apps/vue_janken                /srv/vue_janken
COPY cdn_resources                  /srv/cdn_resources
COPY --from=ts-build /src/apps/simple_login /srv/simple_login
COPY --from=ts-build /src/apps/vue_rpg      /srv/vue_rpg
COPY --from=htmx-build /src/apps/htmx_sugoroku/dist    /srv/htmx_sugoroku
COPY --from=svelte-build /src/apps/svelte_baseball/dist /srv/svelte_baseball
