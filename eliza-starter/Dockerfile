FROM node:22.0.0 as build

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN corepack -v

WORKDIR /usr/src/app/

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN npm run build

FROM node:22.0.0

WORKDIR /usr/src/app/

COPY package.json ./
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules

ENV PORT=80
ENV NODE_ENV=production

CMD ["node", "dist/index"]
