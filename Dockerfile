# lindner.earth — personal static site, served from fondue behind the anycast
# edges. Same shape as oddie-apps/static-sites: stock Caddy + the site baked in
# as an immutable, CI-built artifact. TLS + cache + anycast are the edge's job;
# this is a plain HTTP origin on :8080 (non-root) reached over the tunnel.
FROM caddy:2.11.4-alpine@sha256:5f5c8640aae01df9654968d946d8f1a56c497f1dd5c5cda4cf95ab7c14d58648

LABEL org.opencontainers.image.source="https://forge.oddie.app/jlxq0/lindner_web" \
      org.opencontainers.image.title="lindner_web"

# Strip the caddy binary's file capability so it execs cleanly as non-root
# under allowPrivilegeEscalation=false (we bind :8080, unprivileged).
RUN apk add --no-cache libcap && setcap -r /usr/bin/caddy && apk del libcap

ENV XDG_CONFIG_HOME=/tmp/caddy \
    XDG_DATA_HOME=/tmp/caddy

COPY Caddyfile /etc/caddy/Caddyfile
COPY index.html pinterest-41d5c.html /srv/
COPY css/ /srv/css/
COPY js/  /srv/js/

# fail the build on a malformed Caddyfile
RUN caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile

USER 1000:1000
EXPOSE 8080
