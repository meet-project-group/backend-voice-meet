import express from "express";
import cors from "cors";
import { Server as IOServer } from "socket.io";
import { createServer } from "http";
import { ExpressPeerServer } from "peer";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);

/* =========================
    SOCKET.IO — VOZ
========================= */
const voiceRooms: Record<string, { peerId: string; username: string }[]> = {};

const io = new IOServer(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  path: "/voice/socket.io",
});

io.on("connection", (socket) => {
  console.log("[socket] connected:", socket.id);

  socket.on("join-voice-room", ({ roomId, peerId, username }) => {
    socket.join(roomId);

    socket.data.peerId = peerId;
    socket.data.username = username;
    socket.data.roomId = roomId;

    if (!voiceRooms[roomId]) voiceRooms[roomId] = [];
    if (!voiceRooms[roomId].some(u => u.peerId === peerId)) {
      voiceRooms[roomId].push({ peerId, username });
    }

    socket.emit("voice-room-users", voiceRooms[roomId]);
    socket.to(roomId).emit("user-connected", { peerId, username });
  });

  socket.on("disconnect", () => {
    const { roomId, peerId } = socket.data;

    if (roomId && peerId) {
      voiceRooms[roomId] = voiceRooms[roomId]?.filter(u => u.peerId !== peerId) || [];
      if (voiceRooms[roomId]?.length === 0) delete voiceRooms[roomId];

      socket.to(roomId).emit("user-disconnected", peerId);
    }

    console.log("[socket] disconnected:", peerId);
  });
});

/* =========================
    PEERJS — VIDEO
========================= */
const peerServer = ExpressPeerServer(httpServer, {
  path: "/", 
});

// importante → esto evita conflictos
app.use("/peerjs", peerServer);

/* =========================
    HEALTH
========================= */
app.get("/health", (_req, res) => res.json({ ok: true }));

/* =========================
    START
========================= */
const PORT = process.env.PORT || 3004;

httpServer.listen(PORT, () => {
  console.log(`🚀 Unified Voice + PeerJS server running on port ${PORT}`);
});

