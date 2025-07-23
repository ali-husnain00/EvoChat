import express from "express";
const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import connectDb from "./config/db.js";
import user from "./model/user.js";
import verifyToken from "./middlewares/verifyToken.js";
import uploads from "./middlewares/multer.js";
import { Server } from "socket.io";
import http from "http";
import chat from "./model/chat.js";
import message from "./model/message.js";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

dotenv.config();
connectDb();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("App is working");
});

io.on("connection", (socket) => {
  console.log(`✅ Socket connected: ${socket.id}`);

  socket.on("online", async (userId) => {
    socket.userId = userId;
    try {
      const existingUser = await user.findById(userId);
      if (existingUser) {
        existingUser.isOnline = true;
        await existingUser.save();
        console.log(`🟢 ${existingUser.username} is online`);
        socket.broadcast.emit("userOnline", { userId });
      }
    } catch (err) {
      console.error("❌ Error marking user online:", err);
    }
  });

  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`📥 Socket ${socket.id} joined chat: ${chatId}`);
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
          console.log(`🔴 ${existingUser.username} is offline`);
          socket.broadcast.emit("userOffline", { userId: socket.userId });
        }
      } catch (err) {
        console.error("❌ Error marking user offline:", err);
      }
    }
    console.log(`⚠️ Socket disconnected: ${socket.id}`);
  });
});

app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await user.findOne({ email });
    if (existingUser) {
      return res.status(401).send({ msg: "User already exists!" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await user.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(200).send({ msg: "User created successfully!" });
  } catch (error) {
    res.status(500).send({ msg: "Server error while creating user!" });
    console.error(error);
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await user.findOne({ email });
    if (!existingUser) {
      return res.status(401).send({ msg: "User does not exist!" });
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordValid) {
      return res.status(401).send({ msg: "Invalid password!" });
    }

    const token = jwt.sign({ id: existingUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });

    res.status(200).send({ msg: "Login successful!" });
  } catch (error) {
    res.status(500).send({ msg: "Server error while logging in!" });
    console.error(error);
  }
});

app.post("/logout", (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
    });
    res.status(200).send({ msg: "Logged out successfully!" });
  } catch (error) {
    res.status(500).send({ msg: "Server error while logging out!" });
    console.error(error);
  }
});

app.get("/getLoggedInUser", verifyToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const existingUser = await user.findById(userId).select("-password");
    if (!existingUser) {
      return res.status(404).send({ msg: "User not found!" });
    }
    res.status(200).send(existingUser);
  } catch (error) {
    res.status(500).send({ msg: "Server error while fetching user!" });
    console.error(error);
  }
});

app.put(
  "/updateProfile",
  verifyToken,
  uploads.single("avatar"),
  async (req, res) => {
    const { username, email } = req.body;
    const userId = req.user.id;
    try {
      const existingUser = await user.findById(userId);
      if (!existingUser) {
        return res.status(404).send({ msg: "User not found!" });
      }
      existingUser.username = username || existingUser.username;
      existingUser.email = email || existingUser.email;
      if (req.file) {
        existingUser.avatar = req.file.filename;
      }
      await existingUser.save();
      res.status(200).send({ msg: "Profile updated successfully!" });
    } catch (error) {
      res.status(500).send({ msg: "Server error while updating profile!" });
      console.error(error);
    }
  }
);

// Get My Contacts
app.get("/getMyContacts", verifyToken, async (req, res) => {
  const uId = req.user.id;
  try {
    const existingUser = await user
      .findById(uId)
      .populate(
        "contacts.userId",
        "_id username email avatar isOnline createdAt blockedUsers"
      );

    const contacts = existingUser.contacts.map((contact) => contact.userId);
    res.status(200).send(contacts);
  } catch (error) {
    res.status(500).send({ msg: "Server error while fetching contacts!" });
    console.error(error);
  }
});

// Add Contact
app.post("/addContact", verifyToken, async (req, res) => {
  const { email } = req.body;
  const userId = req.user.id;

  try {
    const existingUser = await user.findById(userId);
    if (!existingUser) {
      return res.status(404).send({ msg: "User not found!" });
    }

    const contact = await user.findOne({ email });
    if (!contact) {
      return res.status(404).send({ msg: "Contact not found!" });
    }

    if (contact._id.toString() === userId) {
      return res.status(400).send({ msg: "You cannot add yourself!" });
    }

    // Check if contact already exists
    const alreadyExists = existingUser.contacts.some(
      (c) => c.userId.toString() === contact._id.toString()
    );

    if (alreadyExists) {
      return res.status(400).send({ msg: "Contact already exists!" });
    }

    // Add to contacts
    existingUser.contacts.push({ userId: contact._id });
    await existingUser.save();

    res.status(200).send({ msg: "Contact added successfully!" });
  } catch (error) {
    res.status(500).send({ msg: "Server error while adding contact!" });
    console.error(error);
  }
});

app.post("/getOrCreateChat", verifyToken, async (req, res) => {
  const { receiverId } = req.body;
  const userId = req.user.id;
  try {
    const existingUser = await user.findById(userId);
    if (!existingUser) {
      return res.status(404).send({ msg: "User not found!" });
    }
    const receiver = await user.findById(receiverId);
    if (!receiver) {
      return res.status(404).send({ msg: "Receiver not found!" });
    }
    // Check if chat already exists
    const chatExists = await chat.findOne({
      isGroupChat: false,
      users: { $all: [userId, receiverId] },
    });

    if (!chatExists) {
      // Create new chat
      const newChat = await chat.create({
        chatName: `${existingUser.username} & ${receiver.username}`,
        isGroupChat: false,
        users: [userId, receiverId],
      });
      const messages = await message
        .find({ chat: newChat._id })
        .sort({ createdAt: 1 });
        if (newChat.deletedBy?.includes(userId)) {
          return res.status(200).send({ chatId: newChat._id, messages: [] });
        }
      return res.status(200).send({ chatId: newChat._id, messages });
    }

    // If chat exists, return the chat ID and messages
    const messages = await message
      .find({ chat: chatExists._id })
      .sort({ createdAt: 1 });

    if (chatExists.deletedBy?.includes(userId)) {
      return res.status(200).send({ chatId: chatExists._id, messages: [] });
    }

    res.status(200).send({ chatId: chatExists._id, messages });
  } catch (error) {
    res
      .status(500)
      .send({ msg: "Server error while getting or creating chat!" });
    console.error(error);
  }
});

app.post(
  "/sendMessage",
  verifyToken,
  uploads.single("image"),
  async (req, res) => {
    const { chatId, content } = req.body;
    const userId = req.user.id;
    try {
      const existingChat = await chat.findById(chatId);
      if (!existingChat) {
        return res.status(404).send({ msg: "Chat not found!" });
      }
      if (!content && !req.file) {
        return res
          .status(400)
          .send({ msg: "Message must have text or image." });
      }

      const newMessage = await message.create({
        sender: userId,
        content,
        chat: chatId,
      });

      if (req.file) {
        newMessage.image = req.file.filename;
        await newMessage.save();
      }

      existingChat.latestMessage = newMessage._id;
      await existingChat.save();

      res
        .status(200)
        .send({ msg: "Message sent successfully!", message: newMessage });
    } catch (error) {
      res.status(500).send({ msg: "Server error while sending message!" });
      console.error(error);
    }
  }
);

app.post("/clearChat", verifyToken, async (req, res) => {
  const { chatId } = req.body;
  const userId = req.user.id;

  try {
    const existingChat = await chat.findById(chatId);
    if (!existingChat) {
      return res.status(404).send({ msg: "Chat not found!" });
    }

    if (!existingChat.users.includes(userId)) {
      return res
        .status(403)
        .send({ msg: "You are not a member of this chat!" });
    }

    if (!existingChat.deletedBy?.includes(userId)) {
      existingChat.deletedBy = existingChat.deletedBy || [];
      existingChat.deletedBy.push(userId);
      await existingChat.save();
    }

    res.status(200).send({ msg: "Chat cleared successfully!" });
  } catch (error) {
    res.status(500).send({ msg: "Server error while clearing chat!" });
    console.error(error);
  }
});

app.delete("/deleteContact/:contactId", verifyToken, async (req, res) => {
  const contactId = req.params.contactId;
  const userId = req.user.id;
  try {
    const existingUser = await user.findById(userId);
    if (!existingUser) {
      return res.status(404).send({ msg: "User not found!" });
    }
    
    existingUser.contacts = existingUser.contacts.filter(
      (c) => c.userId.toString() !== contactId
    )
    await existingUser.save();
    res.status(200).send({ msg: "Contact deleted successfully!" });
  } catch (error) {
    res.status(500).send({ msg: "Server error while deleting contact!" });
    console.error(error);
  }
});

app.post("/blockContact/:contactId", verifyToken, async (req, res) => {
  const contactId = req.params.contactId;
  const userId = req.user.id;
  try {
    const existingUser = await user.findById(userId);
    if (!existingUser) {
      return res.status(404).send({ msg: "User not found!" });
    }

    if (existingUser.blockedUsers.includes(contactId)) {
      return res.status(400).send({ msg: "Contact is already blocked!" });
    }

    existingUser.blockedUsers.push(contactId);
    await existingUser.save();
    
    res.status(200).send({ msg: "Contact blocked successfully!" });
  } catch (error) {
    res.status(500).send({ msg: "Server error while blocking contact!" });
    console.error(error);
  }
});

app.post("/unblockContact/:contactId", verifyToken, async (req, res) => {
  const contactId = req.params.contactId;
  const userId = req.user.id;
  try {
    const existingUser = await user.findById(userId);
    if (!existingUser) {
      return res.status(404).send({ msg: "User not found!" });
    }
    if (!existingUser.blockedUsers.includes(contactId)) {
      return res.status(400).send({ msg: "Contact is not blocked!" });
    }
    existingUser.blockedUsers = existingUser.blockedUsers.filter(
      (id) => id.toString() !== contactId
    );
    await existingUser.save();
    res.status(200).send({ msg: "Contact unblocked successfully!" });
  } catch (error) {
    res.status(500).send({ msg: "Server error while unblocking contact!" });
    console.error(error);
  }
});
  

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
