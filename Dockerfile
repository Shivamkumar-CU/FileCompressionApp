FROM node:18

RUN apt-get update && apt-get install -y g++ ghostscript

WORKDIR /app

COPY cpp/main.cpp ./main.cpp
RUN g++ -o compressor main.cpp

COPY backend/package.json ./
RUN npm install

COPY backend/ ./

EXPOSE 5001
CMD ["node", "index.js"]