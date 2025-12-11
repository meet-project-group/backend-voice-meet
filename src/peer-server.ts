import express from "express";
import { createServer } from "http";
import { ExpressPeerServer } from "peer";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  })
);

const server = createServer(app);

// Servidor PeerJS
const peerServer = ExpressPeerServer(server, {
  path: "/", // raíz del peer server
});

// Montar PeerJS en /peerjs
app.use("/peerjs", peerServer);

// Render asigna un puerto dinámico
const PORT = process.env.PORT || 3004;

server.listen(PORT, () => {
  console.log(`🚀 PeerJS server running on port ${PORT}`);
});

peerServer.on("connection", (client) => {
  console.log("🔵 Peer connected:", client.getId());
});

