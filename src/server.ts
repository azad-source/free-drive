import geckos, { iceServers } from "@geckos.io/server";
import http from "http";
import pako from "pako";

type IGame = Record<string, any>;

const origin = "http://m-azad.ru";
const port = 9208;
const MSG = "msg";

const server = http.createServer((req, res) => {
  // res.setHeader("Access-Control-Allow-Origin", req.headers.origin || origin);
  // res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  // res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
});

const io = geckos({
  cors: { origin, allowAuthorization: true },
  iceServers,
});

io.addServer(server);

server.listen(port);

server.on("connection", () => {
  console.log(`connection ...`);
});

server.on("connect", () => {
  console.log(`connect ...`);
});

server.on("close", () => {
  console.log(`connection closed`);
});

server.on("listening", () => {
  console.log(`listening on port ${port}`);
});

const clients = new Set();

io.onConnection((channel) => {
  const users: IGame = {};

  console.log(`${channel.id} got connected`);

  clients.add(channel);

  channel.onDisconnect(() => {
    console.log(`${channel.id} got disconnected`);
  });

  channel.on(MSG, (res: Uint8Array) => {
    const gameState: IGame = JSON.parse(pako.ungzip(res, { to: "string" }));
    const userId = gameState?.id;
    if (userId) {
      if (gameState.isRemoved) {
        delete users[userId];
      } else {
        users[userId] = gameState;
      }
    }

    const unit8Array: Uint8Array = pako.gzip(JSON.stringify(users));
    io.emit(MSG, unit8Array);
  });
});
