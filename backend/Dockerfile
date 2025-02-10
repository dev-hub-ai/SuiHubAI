FROM node:20 as build

WORKDIR /usr/src/app/

COPY package*.json ./

RUN yarn --frozen-lockfile

COPY . .

RUN yarn run build

FROM node:20

WORKDIR /usr/src/app/

COPY --from=build /usr/src/app/package.json ./
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules

ENV PORT=80
ENV NODE_ENV=production

CMD ["node", "dist/apps/platform/main"]
