import WebSocket, { WebSocketServer } from "ws";

const server = new WebSocketServer({ port: 8080 });

const clients: Set<WebSocket> = new Set();

server.on("connection", (ws: WebSocket) => {
  console.log("New client connected");
  clients.add(ws);

  ws.on("message", (message: WebSocket.MessageEvent) => {
    console.log(`Received message: ${message}`);

    // Broadcast message to all clients
    clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        // Ensure message is a string before sending
        if (typeof message.data === "string") {
          client.send(message.data);
        }
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });
});

console.log("WebSocket server is running on ws://localhost:8080");
