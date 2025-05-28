# Dockerfile
FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install -g expo-cli@6.3.0

RUN npm install -g @expo/ngrok@^4.1.0

COPY . .

RUN npm install

EXPOSE 8081 19000 19001 19002

CMD ["npx", "expo", "start", "--tunnel"]
