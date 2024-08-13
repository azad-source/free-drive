import WebSocket, { WebSocketServer } from "ws";

type IGame = Record<string, any>;

const server = new WebSocketServer({ port: 8080 });

const clients: Set<WebSocket> = new Set();

server.on("connection", (ws: WebSocket) => {
  clients.add(ws);

  const users: IGame = {};

  ws.on("message", (message: string) => {
    const gameState = JSON.parse(message);

    const userId = gameState?.id;

    if (userId) {
      if (gameState.isRemoved) {
        delete users[userId];
      } else {
        users[userId] = gameState;
      }
    }

    // Broadcast message to all clients
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(users));
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });
});

console.log("WebSocket server is running on ws://localhost:8080");
