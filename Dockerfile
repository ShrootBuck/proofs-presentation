FROM node:22-alpine AS build
WORKDIR /app
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY . .
RUN npm run check && npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3040 STATE_PATH=/data/rooms.json
RUN npm install --no-audit --no-fund --ignore-scripts qrcode@1.5.4 katex@0.18.2
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
COPY --from=build /app/lib ./lib
COPY --from=build /app/voting ./voting
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 3040
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD node -e "fetch('http://127.0.0.1:3040/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server/server.mjs"]
