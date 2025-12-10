import express from "express";
import { createServer } from "http";
import { ExpressPeerServer } from "peer";
import cors from "cors";

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST"],
}));

const server = createServer(app);

// Servidor PeerJS
const peerServer = ExpressPeerServer(server, {
  path: "/",  // 👈 este es el fix
});

// Montar PeerJS en /peerjs
app.use("/peerjs", peerServer);

server.listen(3004, () => {
  console.log("🚀 PeerJS server running at http://localhost:3004/peerjs");
});

peerServer.on("connection", (client) => {
  console.log("🔵 Peer connected:", client.getId());
});
