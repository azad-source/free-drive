import geckos from "@geckos.io/server";
import http from "http";

type IGame = Record<string, any>;

const server = http.createServer((req, res) => {
  const origin1 = req.headers.origin;
  const origin2 = "http://m-azad.ru:80";

  res.setHeader("Access-Control-Allow-Origin", origin2);
  // res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }
});

const io = geckos({
  // cors: { allowAuthorization: true, origin: "m-azad.ru" },
});

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
