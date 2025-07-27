import express from "express";
import verifyToken from "../middlewares/verifyToken.js";
import uploads from "../middlewares/multer.js";

// Import controllers
import {
  registerUser,
  loginUser,
  logoutUser,
  getLoggedInUser,
  updateProfile,
  getMyContacts,
  addContact,
  deleteContact,
  blockContact,
  unblockContact,
} from "../controllers/userController.js";

import {
  getOrCreateChat,
  sendMessage,
  clearChat,
  getUnseenMessages,
  markMessagesSeen,
  deleteMessage,
} from "../controllers/chatController.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.send("App is working");
});

// User routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.get("/getLoggedInUser", verifyToken, getLoggedInUser);
router.put("/updateProfile", verifyToken, uploads.single("avatar"), updateProfile);

// Contact routes
router.get("/getMyContacts", verifyToken, getMyContacts);
router.post("/addContact", verifyToken, addContact);
router.delete("/deleteContact/:contactId", verifyToken, deleteContact);
router.post("/blockContact/:contactId", verifyToken, blockContact);
router.post("/unblockContact/:contactId", verifyToken, unblockContact);

// Chat routes
router.post("/getOrCreateChat", verifyToken, getOrCreateChat);
router.post("/sendMessage", verifyToken, uploads.single("image"), sendMessage);
router.post("/clearChat", verifyToken, clearChat);
router.get("/getUnseenMessages", verifyToken, getUnseenMessages);
router.post("/markMessagesSeen", verifyToken, markMessagesSeen);
router.delete("/deleteMessage", verifyToken, deleteMessage);

export default router;