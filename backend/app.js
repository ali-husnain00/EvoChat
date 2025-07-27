import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { Server } from "socket.io";
import http from "http";
import connectDb from "./config/db.js";
import user from "./model/user.js";
import router from "./routes/routes.js";

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: "https://evochat1.netlify.app",
    credentials: true,
  },
});

// Configuration
dotenv.config();
connectDb();

// Middlewares
app.use(
  cors({
    origin: "https://evochat1.netlify.app",
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use(router);

// Socket.io event handlers
io.on("connection", (socket) => {
  
  socket.on("online", async (userId) => {
    socket.userId = userId;
    try {
      const existingUser = await user.findById(userId);
      if (existingUser) {
        existingUser.isOnline = true;
        await existingUser.save();
        socket.broadcast.emit("userOnline", { userId });
      }
    } catch (err) {
      console.error("❌ Error marking user online:", err);
    }
  });

  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
  });

  socket.on("typing", (data) => {
    const { chatId, userId } = data;
    socket.to(chatId).emit("userTyping", { userId });
  });

  socket.on("newMessage", (data) => {
    const { chatId, message } = data;
    socket.to(chatId).emit("messageReceived", message);
  });

  socket.on("disconnect", async () => {
    if (socket.userId) {
      try {
        const existingUser = await user.findById(socket.userId);
        if (existingUser) {
          existingUser.isOnline = false;
          await existingUser.save();
          socket.broadcast.emit("userOffline", { userId: socket.userId });
        }
      } catch (err) {
        console.error("❌ Error marking user offline:", err);
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});