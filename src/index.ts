import express from "express";
import cors from "cors";
import { Server as IOServer } from "socket.io";
import { createServer } from "http";
import dotenv from "dotenv";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);

/* ================================================
   REGISTRO REAL POR ROOM
================================================= */
const voiceRooms: Record<string, { peerId: string; username: string }[]> = {};

const io = new IOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  path: "/voice/socket.io",
});

io.on("connection", (socket) => {
  console.log("[socket] connected:", socket.id);

  /* ================================================
     JOIN
  ================================================ */
  socket.on("join-voice-room", ({ roomId, peerId, username }) => {
    socket.join(roomId);
    socket.data.peerId = peerId;
    socket.data.username = username;
    socket.data.roomId = roomId;

    if (!voiceRooms[roomId]) voiceRooms[roomId] = [];

    // Evitar duplicados (caso extraño)
    const exists = voiceRooms[roomId].some(u => u.peerId === peerId);
    if (!exists) {
      voiceRooms[roomId].push({ peerId, username });
    }

    // Enviar lista al usuario nuevo
    socket.emit("voice-room-users", voiceRooms[roomId]);

    // Notificar a los demás
    socket.to(roomId).emit("user-connected", { peerId, username });

    console.log(`[socket] ${username} (${peerId}) joined ${roomId}`);
  });

  /* ================================================
     DISCONNECT
  ================================================ */
  socket.on("disconnect", () => {
    const { roomId, peerId } = socket.data;

    if (roomId && peerId) {
      // 1. Eliminar del registro
      if (voiceRooms[roomId]) {
        voiceRooms[roomId] = voiceRooms[roomId].filter(
          (u) => u.peerId !== peerId
        );

        // 2. Si la sala queda vacía → eliminarla
        if (voiceRooms[roomId].length === 0) {
          delete voiceRooms[roomId];
        }
      }

      // 3. Avisar al front
      socket.to(roomId).emit("user-disconnected", peerId);
    }

    console.log("[socket] disconnected:", peerId);
  });
});

/* ================================================
   HEALTH
================================================ */
app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

const PORT = process.env.PORT || 3003;

httpServer.listen(PORT, () => {
  console.log("Voice server running on port", PORT);
});
