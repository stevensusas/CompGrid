FROM --platform=linux/amd64 node:18-bullseye-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

ENV HOST=0.0.0.0
ENV PORT=9000

EXPOSE 9000

RUN echo "#!/bin/sh\nnode app.js" > start.sh && \
    chmod +x start.sh

ENTRYPOINT ["/app/start.sh"] 