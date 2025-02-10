FROM node:20.13.1 AS frontend-build

WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./

RUN yarn install

COPY . ./

RUN yarn run build

FROM nginx:1.20.2-alpine AS frontend-server

WORKDIR /usr/app/html

COPY --from=frontend-build /usr/src/app/dist .
COPY ./nginx/nginx.conf /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
