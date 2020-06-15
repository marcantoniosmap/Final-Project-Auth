FROM node:9-slim
# RUN apk add --no-cache nodejs npm


WORKDIR /app

COPY . /app


RUN npm install

EXPOSE 8000

ENTRYPOINT ["node"]

CMD ['index.js']