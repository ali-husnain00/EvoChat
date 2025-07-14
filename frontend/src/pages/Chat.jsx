import React, { useContext, useEffect, useState } from "react";
import { ChatContext } from "../components/Context";
import { FiLogOut, FiPlus, FiMoreVertical } from "react-icons/fi";
import { BsEmojiSmile } from "react-icons/bs";
import { FaPaperclip } from "react-icons/fa";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";

const Chat = () => {
  const { user, BASE_URL, getLoggedInUser, setUser } = useContext(ChatContext);

  const [showOptions, setShowOptions] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [updatedUsername, setUpdatedUsername] = useState(user?.username || "");
  const [updatedEmail, setUpdatedEmail] = useState(user?.email || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [newContactEmail, setNewContactEmail] = useState("");

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isFetchingContacts, setIsFetchingContacts] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);

  const [selectedContact, setSelectedContact] = useState(null);

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
        getMyContacts(); // Refresh contacts
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

  useEffect(() => {
    getMyContacts();
  }, []);

  return (
    <div className="h-screen w-screen flex text-gray-50">
      {/* Sidebar */}
      <div className="w-full md:w-[450px] bg-gray-900 flex flex-col relative border-r border-gray-600">
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
            placeholder="Search contacts"
            className="w-full px-4 py-2 rounded-3xl bg-gray-800 text-gray-100 placeholder:text-gray-400 outline-none border border-white/10"
          />
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto pb-20">
          {isFetchingContacts ? (
            <div className="flex items-center justify-center p-4 text-gray-500">Loading...</div>
          ) : contacts.length > 0 ? (
            contacts.map((u) => (
              <div
                key={u._id}
                onClick={() => setSelectedContact(u)}
                className="flex items-center gap-3 p-3 bg-gray-900 hover:bg-gray-800 transition cursor-pointer border-b border-white/10"
              >
                <img
                  src={
                    u?.avatar
                      ? `${BASE_URL}/uploads/${u.avatar}`
                      : "/default-avatar.webp"
                  }
                  alt={u.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-white">{u.username}</p>
                  <p className={`text-xs ${u.isOnline ? "text-green-400" : "text-gray-400"}`}>
                    {u.isOnline ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 px-4 flex justify-center items-center h-[30vh]">No Contacts Found</p>
          )}
        </div>

        {/* Add Contact Button */}
        <button
          onClick={() => setShowAddForm(true)}
          className="absolute bottom-5 right-5 bg-blue-600 hover:bg-blue-700 p-3 rounded-full shadow-lg transition"
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
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded"
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
      <div className="flex-1 flex flex-col bg-gray-900">
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-3.5 border-b border-gray-600 flex items-center gap-4">
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
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="bg-gray-700 p-3 rounded max-w-[70%]">Hey there!</div>
              <div className="bg-blue-600 p-3 rounded max-w-[70%] ml-auto">Hello, what's up?</div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-600 flex items-center gap-3 bg-gray-800">
              <button className="text-gray-400 hover:text-white transition">
                <BsEmojiSmile size={22} />
              </button>
              <label className="cursor-pointer text-gray-400 hover:text-white transition">
                <FaPaperclip size={20} />
                <input type="file" className="hidden" accept="image/*" />
              </label>
              <input
                type="text"
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded outline-none border border-gray-600"
              />
              <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">Send</button>
            </div>
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                disabled={isUpdatingProfile}
              >
                {isUpdatingProfile ? "Updating..." : "Update"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Chat;
