import WebSocket, { WebSocketServer } from "ws";

const PORT =
  typeof process.env.WEB_SOCKET_PORT === "number"
    ? process.env.WEB_SOCKET_PORT
    : 8080;

const HOST = "ws://m-azad.ru" || process.env.WEB_SOCKET_HOST;

const server = new WebSocketServer({ port: 8080 });

const clients: Set<WebSocket> = new Set();

server.on("connection", (ws: WebSocket) => {
  console.log("New client connected");
  clients.add(ws);
  let users: any[] = [];

  ws.on("message", (message: string) => {
    console.log(`Received message: ${message}`);

    const gameState: any = JSON.parse(message);

    if (gameState.id) {
      if (users.every((i) => i.id !== gameState.id)) {
        users.push(gameState);
      } else {
        users.forEach((state, index) => {
          if (state.id === gameState.id) {
            users.splice(index, 1, gameState);
          }
        });
      }
    }

    // Broadcast message to all clients
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(users.filter((u) => !u.isRemoved)));
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });
});

console.log("WebSocket server is running on ws://localhost:8080");
