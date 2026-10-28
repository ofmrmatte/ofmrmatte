FROM node:24-slim
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev
COPY server.mjs index.html admin.html manifest.webmanifest service-worker.js ./
COPY src ./src
COPY lib ./lib
COPY assets ./assets
ENV NODE_ENV=production
ENV PARENTAL_DATA_DIR=/data
ENV APP_DATA_DIR=/data
EXPOSE 3000
CMD ["node", "server.mjs"]
