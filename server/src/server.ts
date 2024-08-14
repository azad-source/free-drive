import geckos from "@geckos.io/server";
import http from "http";
import express from "express";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: "http://m-azad.ru",
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  })
);

const server = http.createServer(app);

type IGame = Record<string, any>;

const origin = "http://m-azad.ru";

// const server = http.createServer((req, res) => {
//   res.setHeader("Access-Control-Allow-Origin", req.headers.origin || origin);
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
// });

const io = geckos({ cors: { origin: (req) => req.headers.origin || origin } });

io.addServer(server);

server.listen(8080);

const clients = new Set();

io.onConnection((channel) => {
  const users: IGame = {};

  console.log(`${channel.id} got connected`);

  clients.add(channel);

  channel.onDisconnect(() => {
    console.log(`${channel.id} got disconnected`);
  });

  channel.on("chat message", (state) => {
    const gameState = state as IGame;

    const userId = gameState?.id;
    if (userId) {
      if (gameState.isRemoved) {
        delete users[userId];
      } else {
        users[userId] = gameState;
      }
    }

    io.emit("chat message", users);
  });
});
