import React, { useContext, useEffect, useState } from "react";
import { ChatContext } from "../components/Context";
import { FiLogOut, FiPlus, FiMoreVertical, FiTrash2, FiUserX, FiInfo, FiSend } from "react-icons/fi";
import { MdHowToReg } from "react-icons/md";
import { BsEmojiSmile } from "react-icons/bs";
import { FaPaperclip } from "react-icons/fa";
import { HiArrowLeft } from "react-icons/hi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useRef } from "react";
import EmojiPicker from "emoji-picker-react"
import ContactInfo from "../components/ContactInfo";

const SOCKET_URL = import.meta.env.VITE_BASE_URL;

const Chat = () => {
  const { user, BASE_URL, getLoggedInUser, setUser } = useContext(ChatContext);

  const [showOptions, setShowOptions] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showContactInfo, setShowContactInfo] = useState(false);

  const [updatedUsername, setUpdatedUsername] = useState(user?.username || "");
  const [updatedEmail, setUpdatedEmail] = useState(user?.email || "");
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [newContactEmail, setNewContactEmail] = useState("");

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isFetchingContacts, setIsFetchingContacts] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [searchContact, setSearchContact] = useState("");

  const [selectedContact, setSelectedContact] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);

  const [message, setMessage] = useState("");
  const [unseenMessages, setUnseenMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [typingUser, setTypingUser] = useState(null);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showChatOptions, setShowChatOptions] = useState(false);

  const typingTimeOutRef = useRef(null);
  const latestMessageRef = useRef(null);

  const [loading, setLoading] = useState(false);

  const [showChat, setShowChat] = useState(false)

  const navigate = useNavigate();

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleUpdateProfile = async () => {
    const formData = new FormData();
    formData.append("username", updatedUsername);
    formData.append("email", updatedEmail);
    if (selectedFile) formData.append("avatar", selectedFile);

    setIsUpdatingProfile(true);
    try {
      const res = await fetch(`${BASE_URL}/updateProfile`, {
        method: "PUT",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.msg);
        setShowProfileModal(false);
        await getLoggedInUser();
      }
    } catch (error) {
      toast.error("Error updating profile");
      console.error("Update profile error:", error);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch(`${BASE_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.msg);
        setShowOptions(false);
        setUser(null);
        navigate("/login");
      }
    } catch (error) {
      toast.error("Logout failed. Please try again.");
      console.error("Logout error:", error);
    }
  };

  const getMyContacts = async () => {
    setIsFetchingContacts(true);
    try {
      const res = await fetch(`${BASE_URL}/getMyContacts`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setContacts(data);
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setIsFetchingContacts(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContactEmail) return toast.error("Please enter an email.");

    setIsAddingContact(true);
    try {
      const res = await fetch(`${BASE_URL}/addContact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: newContactEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.msg);
        setShowAddForm(false);
        setNewContactEmail("");
        await getLoggedInUser();
        getMyContacts();
      } else {
        toast.error(data.msg);
      }
    } catch (error) {
      toast.error("Error adding contact");
      console.error("Add contact error:", error);
    } finally {
      setIsAddingContact(false);
    }
  };

  const getOrCreateChat = async () => {
    if (!selectedContact) return;

    try {
      const res = await fetch(`${BASE_URL}/getOrCreateChat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ receiverId: selectedContact._id }),
      });
      const data = await res.json();
      if (res.ok) {
        console.log("Chat retrieved/created:", data.chatId);
        setChatId(data.chatId);
        setMessages(data.messages || []);
      } else {
        console.error("Failed to retrieve chat:", data.msg);
      }
    } catch (error) {
      console.error("Error getting or creating chat:", error);
    }
  };

  useEffect(() => {
    if (user) {
      getMyContacts();
      getUnseenMessages();
    }
  }, [user]);

  useEffect(() => {
    if (selectedContact) {
      getOrCreateChat();
    }
  }, [selectedContact]);

  useEffect(() => {
    if (!user) return;

    const newSocket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      transports: ["websocket"],
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("✅ Connected to socket:", newSocket.id);
      newSocket.emit("online", user._id);
    });

    newSocket.on("disconnect", () => {
      console.log("⚠️ Disconnected from socket:", newSocket.id);
    });

    return () => {
      console.log("🔌 Cleaning up socket");
      newSocket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (!socket) return;

    const handleUserStatusChange = () => {
      getMyContacts();
    };

    socket.on("userOnline", handleUserStatusChange);
    socket.on("userOffline", handleUserStatusChange);

    return () => {
      socket.off("userOnline", handleUserStatusChange);
      socket.off("userOffline", handleUserStatusChange);
    };
  }, [socket]);

  useEffect(() => {
    if (!socket || !chatId) return;

    socket.emit("joinChat", chatId);

    socket.on("userTyping", (data) => {
      const { userId } = data;
      if (userId !== user._id) {
        setTypingUser(userId);

        if (typingTimeOutRef.current) {
          clearTimeout(typingTimeOutRef.current);
        }

        typingTimeOutRef.current = setTimeout(() => {
          setTypingUser(null);
          typingTimeOutRef.current = null;
        }, 3000);
      }
    });

    const handleNewMessage = (newMsg) => {
      setMessages((prev) => [...prev, newMsg]);
      if (chatId) {
        setTimeout(() => {
          markMessagesAsSeen();
        }, 300);
      }
    };

    socket.on("messageReceived", handleNewMessage);

    return () => {
      socket.off("messageReceived", handleNewMessage);
      socket.off("userTyping");
      if (typingTimeOutRef.current) {
        clearTimeout(typingTimeOutRef.current);
        typingTimeOutRef.current = null;
      }
    };
  }, [socket, chatId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("chatId", chatId);
    if (message.trim()) formData.append("content", message);
    if (selectedImage) formData.append("image", selectedImage);

    try {
      const res = await fetch(`${BASE_URL}/sendMessage`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [...prev, data.message]);
        setMessage("");
        setSelectedImage(null);
        if (socket) {
          socket.emit("newMessage", { chatId, message: data.message });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleClearChat = async () => {
    if (!chatId) return;
    try {
      const res = await fetch(`${BASE_URL}/clearChat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chatId }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages([]);
        toast.success(data.msg);
      }
    } catch (error) {
      console.error("Error clearing chat:", error);
      toast.error("Failed to clear chat");
    }
  }

  const handleDeleteContact = async (contactId) => {
    if (!contactId) return;
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/deleteContact/${contactId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.msg);
        setContacts((prev) => prev.filter((c) => c._id !== contactId));
        if (selectedContact?._id === contactId) {
          setSelectedContact(null);
          setChatId(null);
          setMessages([]);
          setShowContactInfo(false);
        }
      }
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("Failed to delete contact");
    }
    finally {
      setLoading(false);
    }
  };

  const handleBlockContact = async () => {
    if (!selectedContact?._id) return;
    try {
      const res = await fetch(`${BASE_URL}/blockContact/${selectedContact._id}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.msg);
        setUser((prev) => {
          return {
            ...prev,
            blockedUsers: [...prev.blockedUsers, selectedContact._id]
          }
        })
      }
    } catch (error) {
      console.error("Error blocking user:", error);
      toast.error("Failed to block user");
    }
  };

  const handleUnblockContact = async () => {
    if (!selectedContact?._id) return;
    try {
      const res = await fetch(`${BASE_URL}/unblockContact/${selectedContact._id}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.msg);
        setUser((prev) => {
          return {
            ...prev,
            blockedUsers: prev.blockedUsers.filter((userId) => userId !== selectedContact._id)
          }
        })
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast.error("Failed to unblock user");
    }
  };

  const getUnseenMessages = async () => {
    if (!user?._id) return;
    try {
      const res = await fetch(`${BASE_URL}/getUnseenMessages`, {
        method: "GET",
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setUnseenMessages(data.unseenMessages);
      }
    } catch (error) {
      console.error("Error fetching unseen messages:", error);
    }
  }

  const markMessagesAsSeen = async () => {
    if (!chatId || !user?._id) return;
    try {
      const res = await fetch(`${BASE_URL}/markMessagesSeen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chatId }),
      });
      const data = await res.json();
      if (res.ok) {
        getUnseenMessages()
      }
    } catch (error) {
      console.error("Error marking messages as seen:", error);
      toast.error("Failed to mark messages as seen");
    }
  };

  useEffect(() => {
    if (chatId) {
      markMessagesAsSeen();
    }
  }, [chatId])

  useEffect(() => {
    if (latestMessageRef.current) {
      latestMessageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  {/* Latest message logic */ }
  const latestMessage = messages.length > 0 ? messages.length - 1 : null;

  {/* Filter contacts based on search input */ }
  const filteredContacts = contacts.filter((c) => c.username.toLowerCase().includes(searchContact.toLowerCase()));

  {/* Check if the user has blocked the selected contact or vice versa */ }
  const youBlockedThem = user.blockedUsers.includes(selectedContact?._id);
  const theyBlockedYou = selectedContact?.blockedUsers.includes(user._id);

  return (
    <div className="w-screen h-screen flex text-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div   className={`h-full min-h-full relative w-full md:w-[350px] lg:w-[450px] flex flex-col bg-gray-900 border-r border-gray-700 overflow-y-auto ${
      showChat ? "hidden" : "flex"
    } md:flex`}>
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-gray-600">
          <img src="/EvoChat_logo1.png" alt="EvoChat" className="w-11 h-11" />
          <div className="relative">
            <button onClick={() => setShowOptions(!showOptions)} className="hover:text-gray-300">
              <FiMoreVertical size={20} />
            </button>
            {showOptions && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 bg-gray-700 border border-gray-600 rounded shadow-lg z-10 w-[150px] text-sm"
              >
                <button
                  className="w-full px-4 py-2 hover:bg-gray-600 text-left"
                  onClick={() => {
                    setShowProfileModal(true);
                    setShowOptions(false);
                  }}
                >
                  My Profile
                </button>
                <button
                  onClick={() => {
                    setShowOptions(false);
                    handleLogout();
                  }}
                  className="w-full px-4 py-2 hover:bg-gray-600 text-left text-red-400 flex items-center gap-2"
                >
                  <FiLogOut /> Logout
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-gray-600">
          <input
            type="text"
            value={searchContact}
            onChange={(e) => setSearchContact(e.target.value)}
            placeholder="Search contacts"
            className="w-full px-4 py-2 rounded-3xl bg-gray-800 text-gray-100 placeholder:text-gray-400 outline-none border border-white/10"
          />
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto pb-20">
          {isFetchingContacts ? (
            <div className="flex items-center justify-center p-4 text-gray-500">Loading...</div>
          ) : filteredContacts.length > 0 ? (
            filteredContacts.map((u) => {
              const unseenInfo = unseenMessages?.find(
                msg => msg.receiverId === u._id
              );
              return (
                <div
                  key={u._id}
                  onClick={() => {
                    setSelectedContact(u);
                    unseenInfo ? unseenInfo.unseenCount = 0 : null;
                    setShowChat(true)
                  }}
                  className="flex items-center justify-between gap-3 p-3 bg-gray-900 hover:bg-gray-800 transition cursor-pointer border-b border-white/10"
                >
                  <div className="flex gap-3 items-center">
                    <img
                      src={
                        u?.avatar
                          ? `${BASE_URL}/uploads/${u.avatar}`
                          : "/default-avatar.webp"
                      }
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-white">{u.username}</p>
                      {
                        user.blockedUsers.includes(u._id) ? (
                          <p className="text-xs text-red-400">You blocked this user</p>
                        ) : u.blockedUsers.includes(user._id) ? (
                          <p className="text-xs text-red-400">This user blocked you</p>
                        ) : (
                          <p className={`text-xs ${u.isOnline ? "text-green-400" : "text-gray-400"}`}>
                            {u.isOnline ? "Online" : "Offline"}
                          </p>
                        )
                      }
                    </div>
                  </div>
                  {
                    unseenInfo?.unseenCount > 0 && (
                      <span className="bg-[#665bff] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {unseenInfo.unseenCount}
                      </span>
                    )
                  }
                </div>
              )
            })
          ) : (
            <p className="text-gray-400 px-4 flex justify-center items-center h-[30vh]">No Contacts Found</p>
          )}
        </div>

        {/* Add Contact Button */}
        <button
          onClick={() => setShowAddForm(true)}
          className="absolute bottom-5 right-5 bg-[#665bff] hover:bg-[#5b4ffd] p-3 rounded-full shadow-lg transition"
        >
          <FiPlus size={20} />
        </button>

        {/* Add Contact Modal */}
        {showAddForm && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gray-800 p-6 rounded shadow-lg w-[90%] max-w-sm border border-gray-600"
            >
              <h3 className="text-lg font-semibold mb-4">Add New Contact</h3>
              <input
                type="email"
                value={newContactEmail}
                onChange={(e) => setNewContactEmail(e.target.value)}
                placeholder="Enter email"
                className="w-full px-3 py-2 mb-4 rounded bg-gray-700 text-white outline-none border border-gray-600"
              />
              <div className="flex justify-end gap-2">
                <button className="px-4 py-1.5 bg-gray-600 rounded" onClick={() => setShowAddForm(false)}>
                  Cancel
                </button>
                <button
                  onClick={handleAddContact}
                  className="px-4 py-1.5 bg-[#665bff] hover:bg-[#5b4ffd] rounded"
                  disabled={isAddingContact}
                >
                  {isAddingContact ? "Adding..." : "Add"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Chat Window */}
      <div className={`h-full min-h-full flex-1 flex flex-col bg-gray-900 overflow-y-auto ${
      showChat ? "flex" : "hidden"
    } md:flex`}>
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-3.5 border-b border-gray-600 flex items-center gap-4 justify-between">
              <div className="flex items-center gap-4 cursor-default">
                <HiArrowLeft className="w-6 h-6 text-white cursor-pointer" onClick={() => setShowChat(false)} />
                <div className="flex gap-3 items-center" onClick={() =>setShowContactInfo(true)}>
                  <img
                  src={
                    selectedContact.avatar
                      ? `${BASE_URL}/uploads/${selectedContact.avatar}`
                      : "/default-avatar.webp"
                  }
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-lg font-semibold text-white">{selectedContact.username}</h2>
                  <p className={`text-sm ${selectedContact.isOnline ? "text-green-400" : "text-gray-400"}`}>
                    {selectedContact.isOnline ? "Online" : "Offline"}
                    {typingUser === selectedContact._id && (
                      <span className="text-gray-400 ml-2 italic">(Typing...)</span>
                    )}
                  </p>
                </div>
                </div>
              </div>
              <button onClick={() => setShowChatOptions(!showChatOptions)}>
                <FiMoreVertical size={20} />
              </button>
              {/* Chat Options */}
              {showChatOptions && (
                <div className="absolute right-4 top-12 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-30 w-48 py-2">
                  <button onClick={() => {
                    setShowChatOptions(!showChatOptions)
                    setShowContactInfo(true);
                  }} className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-gray-700 transition">
                    <FiInfo className="mr-2 text-green-400" size={16} />
                    Contact Info
                  </button>
                  <button
                    onClick={() => {
                      user.blockedUsers.includes(selectedContact._id)
                        ? handleUnblockContact()
                        : handleBlockContact();
                      setShowChatOptions(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-gray-700 transition"
                  >
                    {
                      user.blockedUsers.includes(selectedContact._id) ? (
                        <>
                          <MdHowToReg className="mr-2 text-red-400" size={16} />
                          Unblock Contact
                        </>
                      ) : (
                        <>
                          <FiUserX className="mr-2 text-red-400" size={16} />
                          Block Contact
                        </>
                      )
                    }
                  </button>
                  <button onClick={() => {
                    setShowChatOptions(!showChatOptions)
                    handleClearChat();
                  }} className="flex items-center w-full px-4 py-2 text-sm text-white hover:bg-gray-700 transition">
                    <FiTrash2 className="mr-2 text-red-400" size={16} />
                    Clear Chat
                  </button>
                  <div className="border-t border-gray-600 my-2" />
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length > 0 ? (
                messages.map((msg, index) => (
                  <motion.div
                    key={msg._id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    ref={index === latestMessage ? latestMessageRef : null}
                    className={`p-3 rounded-lg flex flex-col relative
    ${msg.sender === user._id
                        ? "bg-[#665bff] ml-auto text-white"
                        : "bg-gray-700 text-gray-200"
                      }`}
                    style={{
                      maxWidth: msg.image ? "300px" : "70%",
                      wordBreak: "break-word",
                    }}
                  >
                    <h4
                      className={`font-semibold mb-1 ${msg.sender === user._id ? "text-purple-300" : "text-gray-300"
                        }`}
                    >
                      {msg.sender === user._id ? "You" : selectedContact.username}
                    </h4>

                    {msg.image && (
                      <img
                        src={`${BASE_URL}/uploads/${msg.image}`}
                        onClick={() => setPreviewImage(`${BASE_URL}/uploads/${msg.image}`)}
                        className="rounded mt-1 max-w-full object-cover cursor-pointer hover:opacity-90 transition"
                        style={{ maxHeight: "300px" }}
                        alt="Sent"
                      />
                    )}

                    {msg.content && (
                      <div className="whitespace-pre-wrap mt-2 text-sm">
                        {msg.content}
                      </div>
                    )}

                    <span
                      className="text-xs opacity-70 absolute bottom-1 right-2 select-none"
                      style={{ fontSize: "0.65rem" }}
                    >
                      {new Date(msg.createdAt || msg.timestamp || Date.now()).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-[80vh]">
                  <img
                    src="/chat-placeholder.png"
                    className="w-24 h-24 mx-auto mb-4 opacity-20"
                  />
                  <p className="text-gray-500 flex justify-center items-center">No messages yet</p>
                </div>
              )}
            </div>

            <AnimatePresence>
              {selectedImage && (
                <motion.div
                  key="previewImage"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className="relative mb-2 max-w-[150px] mr-5 flex justify-center"
                >
                  <img
                    src={URL.createObjectURL(selectedImage)}
                    alt="Preview"
                    className="rounded shadow-md max-w-full max-h-[120px] object-cover"
                  />
                  <button
                    className="absolute top-0 right-0 bg-black bg-opacity-60 text-white rounded-full p-1 hover:bg-opacity-80"
                    onClick={() => setSelectedImage(null)}
                  >
                    ✖
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message Input */}
            {
              youBlockedThem ? (
                <div className="p-4 flex flex-col items-center justify-center text-center text-red-400">
                  <p>You have blocked this contact. Unblock to send messages.</p>
                  <button
                    className="text-blue-500 hover:text-blue-400 mt-2 cursor-pointer flex items-center gap-1"
                    onClick={handleUnblockContact}
                  >
                    <MdHowToReg fontSize={18} />
                    Unblock
                  </button>
                </div>
              ) : theyBlockedYou ? (
                <div className="p-4 text-center text-red-400">
                  <p>You’ve been blocked by this contact. You cannot send messages.</p>
                </div>
              ) : (
                <form className="p-4 border-t border-gray-600 flex items-center gap-3 bg-gray-800" onSubmit={handleSendMessage}>
                  <button className="text-gray-400 hover:text-white transition" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                    <BsEmojiSmile size={22} />
                  </button>
                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-[60px] z-50 ">
                      <EmojiPicker theme="dark" onEmojiClick={(emojiData) => {
                        setMessage((prev) => prev + emojiData.emoji);
                        setShowEmojiPicker(false);
                      }} />
                    </div>
                  )}
                  <label className="cursor-pointer text-gray-400 hover:text-white transition">
                    <FaPaperclip size={20} />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file && file.type.startsWith("image/")
                      ) {
                        setSelectedImage(file);
                      }
                    }} />
                  </label>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded outline-none border border-gray-600"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      socket?.emit("typing", { chatId, userId: user._id });
                    }}
                  />
                  <button className="bg-[#665bff] hover:bg-[#5b4ffd] cursor-pointer p-3 rounded-full" type="submit">
                    <FiSend fontSize={18}/>
                  </button>
                </form>
              )
            }
          </>
        ) : (
          // Placeholder if no contact is selected
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <img
              src="/chat-placeholder.png"
              alt="Start Chatting"
              className="w-40 h-40 opacity-20 mb-6"
            />
            <h2 className="text-2xl font-semibold text-gray-300 mb-2">No Chat Selected</h2>
            <p className="text-gray-500 max-w-sm">
              Select a contact from the sidebar to start chatting. You can also add a new contact if no one is listed.
            </p>
          </div>
        )}
      </div>


      {/* Profile Modal */}
      {showProfileModal && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 p-6 rounded-lg shadow-xl w-[90%] max-w-sm border border-gray-600 text-white"
          >
            <h3 className="text-lg font-semibold mb-4">My Profile</h3>
            <div className="flex flex-col items-center mb-4">
              <label htmlFor="profile-pic" className="cursor-pointer">
                <img
                  src={
                    user?.avatar
                      ? `${BASE_URL}/uploads/${user.avatar}`
                      : "/default-avatar.webp"
                  }
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-600"
                  loading="lazy"
                />
                <input
                  id="profile-pic"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePicChange}
                  className="hidden"
                />
              </label>
            </div>
            <div className="space-y-4 mb-4">
              <input
                type="text"
                value={updatedUsername}
                onChange={(e) => setUpdatedUsername(e.target.value)}
                placeholder="Username"
                className="w-full px-3 py-2 rounded bg-gray-700 text-white outline-none border border-gray-600"
              />
              <input
                type="email"
                value={updatedEmail}
                onChange={(e) => setUpdatedEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-3 py-2 rounded bg-gray-700 text-white outline-none border border-gray-600"
              />
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProfile}
                className="px-4 py-2 bg-[#665bff] hover:bg-[#5b4ffd] rounded"
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? "Updating..." : "Update"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Full Image Preview */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            key="fullPreview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50"
            onClick={() => setPreviewImage(null)}
          >
            <motion.img
              src={previewImage}
              alt="Preview"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="max-w-[90%] max-h-[90%] object-contain rounded"
            />
            <button
              className="absolute top-5 right-5 text-white text-3xl font-bold"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewImage(null);
              }}
            >
              ✖
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Contact Info Modal */}
      <ContactInfo show={showContactInfo} onClose={() => setShowContactInfo(false)} contact={selectedContact}
        handleDeleteContact={handleDeleteContact} selectedContact={selectedContact} loading={loading} handleBlockContact={handleBlockContact} handleUnblockContact={handleUnblockContact}
      />
    </div>
  );
};

export default Chat;
