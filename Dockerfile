FROM openfaas/classic-watchdog:0.18.1 as watchdog

FROM node:10.19.0-alpine as ship

COPY --from=watchdog /fwatchdog /usr/bin/fwatchdog
RUN chmod +x /usr/bin/fwatchdog

RUN addgroup -S app && adduser app -S -G app

RUN mkdir -p /usr/src/app
COPY --chown=app:app . /usr/src/app

RUN chmod +rx -R /usr/src/app/component \
    && chown app:app -R /usr/src/app \
    && chmod 777 /tmp

WORKDIR /usr/src/app/component

USER app

ENV cgi_headers="true"
ENV fprocess="node bootstrap.js"
EXPOSE 8080

HEALTHCHECK --interval=3s CMD [ -e /tmp/.lock ] || exit 1

CMD ["fwatchdog"]
