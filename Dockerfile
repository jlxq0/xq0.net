FROM node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2 AS bundle-check

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund

COPY scripts/ scripts/
COPY test/ test/
COPY src/xq.js src/xq.js
COPY js/xq.js js/xq.js
COPY js/jquery-1.7.1.min.js js/jquery.terminal-min.js js/profile.js js/
COPY css/crt.css css/jquery.terminal.css css/
COPY Caddyfile CNAME Dockerfile apple-touch-icon.png favicon.ico favicon.svg favicon-32.png index.html pinterest-41d5c.html robots.txt site.webmanifest sitemap.xml ./

# Refuse to publish a stale generated bundle or an incomplete runtime tree.
RUN npm test

# lindner.earth is served from fondue behind the anycast edges. TLS, compression,
# and caching are the edge's job; this is a plain HTTP origin on :8080.
FROM caddy:2.11.4-alpine@sha256:5f5c8640aae01df9654968d946d8f1a56c497f1dd5c5cda4cf95ab7c14d58648

LABEL org.opencontainers.image.source="https://forge.oddie.app/jlxq0/lindner_web" \
      org.opencontainers.image.title="lindner_web"

# Strip the caddy binary's file capability so it execs cleanly as non-root
# under allowPrivilegeEscalation=false (we bind :8080, unprivileged).
RUN apk add --no-cache libcap && setcap -r /usr/bin/caddy && apk del libcap

ENV XDG_CONFIG_HOME=/tmp/caddy \
    XDG_DATA_HOME=/tmp/caddy

COPY --from=bundle-check /build/Caddyfile /etc/caddy/Caddyfile
COPY --from=bundle-check /build/index.html /build/CNAME /build/apple-touch-icon.png /build/favicon.ico /build/favicon.svg /build/favicon-32.png /build/pinterest-41d5c.html /build/robots.txt /build/site.webmanifest /build/sitemap.xml /srv/
COPY --from=bundle-check /build/css/crt.css /build/css/jquery.terminal.css /srv/css/
COPY --from=bundle-check /build/js/jquery-1.7.1.min.js /build/js/jquery.terminal-min.js /build/js/profile.js /build/js/xq.js /srv/js/

# fail the build on a malformed Caddyfile
RUN caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile

USER 1000:1000
EXPOSE 8080
