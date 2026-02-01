import express from "express"
import dotenv from 'dotenv'
import http from 'http'
import { Server } from "socket.io";
import cors from "cors";
import { connectDB } from "./db/db.js";
import userRoutes from "./Routes/user.routes.js";
import cookieParser from "cookie-parser";

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: "https://video-streaming-wine.vercel.app",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/users", userRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://video-streaming-wine.vercel.app",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', (roomId, userName) => {
    socket.join(roomId);
    
    // Attach room and name to the socket instance for later use
    socket.roomId = roomId;
    socket.userName = userName;

    console.log(`User ${userName} joined room: ${roomId}`);
    
    // Notify the person already in the room that a newcomer has joined
    socket.to(roomId).emit('user-connected', userName);
  });

  // NEW: Relay the Creator's name back to the Newcomer
  socket.on('return-name', ({ roomId, userName }) => {
    console.log(`Relaying Creator's name (${userName}) back to newcomer in room ${roomId}`);
    socket.to(roomId).emit('receiving-name', userName);
  });

  socket.on('offer', ({ roomId, sdp }) => {
    socket.to(roomId).emit('offer', { sdp, from: socket.id });
  });

  socket.on('answer', ({ roomId, sdp }) => {
    socket.to(roomId).emit('answer', { sdp });
  });

  socket.on('ice-candidate', ({ roomId, candidate }) => {
    socket.to(roomId).emit('ice-candidate', { candidate });
  });

  socket.on('disconnect', () => {
    if (socket.roomId) {
      // Notify the partner that this specific user has left
      socket.to(socket.roomId).emit('user-disconnected', socket.userName);
    }
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Signaling server running on http://localhost:${PORT}`);
});