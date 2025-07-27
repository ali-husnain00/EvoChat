import user from "../model/user.js";
import chat from "../model/chat.js";
import message from "../model/message.js";

// Get or Create Chat
export const getOrCreateChat = async (req, res) => {
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
};

// Send Message
export const sendMessage = async (req, res) => {
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
};

// Clear Chat
export const clearChat = async (req, res) => {
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
};

// Get Unseen Messages
export const getUnseenMessages = async (req, res) => {
  const userId = req.user.id;

  try {
    const existingUser = await user.findById(userId);
    if (!existingUser) {
      return res.status(404).send({ msg: "User not found!" });
    }

    const chats = await chat
      .find({ users: userId })
      .populate("latestMessage users");
    const unseenResults = await Promise.all(
      chats.map(async (chatItem) => {
        const unseenMsgs = await message.find({
          chat: chatItem._id,
          sender: { $ne: userId },
          seen: false,
        });

        if (unseenMsgs.length > 0) {
          const receiver = chatItem.users.find(
            (u) => u._id.toString() !== userId
          );

          return {
            chatId: chatItem._id,
            unseenCount: unseenMsgs.length,
            receiverId: receiver._id,
            latestMessage: chatItem.latestMessage,
          };
        } else {
          return null;
        }
      })
    );

    const unseenMessages = unseenResults.filter((item) => item !== null);

    res.status(200).send({ unseenMessages });
  } catch (error) {
    res
      .status(500)
      .send({ msg: "Server error while fetching unseen messages!" });
    console.error("Error in /getUnseenMessages:", error);
  }
};

// Mark Messages as Seen
export const markMessagesSeen = async (req, res) => {
  const { chatId } = req.body;
  const userId = req.user.id;

  try {
    const existingChat = await chat.findById(chatId);
    if (!existingChat) {
      return res.status(404).send({ msg: "Chat not found!" });
    }

    const unseenMessages = await message.find({
      chat: chatId,
      sender: { $ne: userId },
      seen: false,
    });
    if (unseenMessages.length > 0) {
      await message.updateMany(
        { _id: { $in: unseenMessages.map((msg) => msg._id) } },
        { $set: { seen: true } }
      );
    }
    res.status(200).send({ msg: "Messages marked as seen successfully!" });
  } catch (error) {
    res
      .status(500)
      .send({ msg: "Server error while marking messages as seen!" });
    console.error("Error in /markMessagesSeen:", error);
  }
};

// Delete Message
export const deleteMessage = async (req, res) => {
  const { messageToDeleteId, chatId } = req.body;
  const userId = req.user.id;

  try {
    const existingUser = await user.findById(userId);
    if (!existingUser) {
      return res.status(404).send({ msg: "User not found!" });
    }

    const c = await chat.findById(chatId);
    if (!c) {
      return res.status(404).send({ msg: "Chat not found!" });
    }

    const existingMessage = await message.findOne({ _id: messageToDeleteId, chat: chatId });
    if (!existingMessage) {
      return res.status(404).send({ msg: "Message not found!" });
    }

    await message.findByIdAndDelete(messageToDeleteId);

    res.status(200).send({ msg: "Message deleted successfully!" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ msg: "An error occurred while deleting message" });
  }
};