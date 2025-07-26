import React, { useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoCloseOutline } from "react-icons/io5";
import { FaUserSlash, FaTrashAlt } from "react-icons/fa";
import { MdHowToReg } from "react-icons/md";
import { ChatContext } from "./Context";

const ContactInfo = ({ show, onClose, contact, handleDeleteContact, selectedContact, loading, handleBlockContact, handleUnblockContact }) => {
    const { BASE_URL, user } = useContext(ChatContext)
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 180, damping: 18 }}
                        className="bg-gray-700 text-white rounded-2xl shadow-2xl w-[90%] max-w-lg  p-6 relative"
                    >
                        {/* Close Icon */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-300 hover:text-white text-2xl"
                        >
                            <IoCloseOutline />
                        </button>

                        {/* Header */}
                        <div className="flex flex-col items-center text-center mb-6">
                            <img
                                src={contact.avatar ? `${BASE_URL}/uploads/${contact.avatar}` : "/default-avatar.webp"}
                                alt="Avatar"
                                className="w-24 h-24 rounded-full object-cover border-4 border-gray-600 shadow-md"
                            />
                            <h2 className="text-2xl font-bold mt-4">{contact?.username}</h2>
                            <p className="text-sm text-gray-300">{contact?.email}</p>
                        </div>

                        {/* Info Section */}
                        <div className="bg-gray-600/50 rounded-xl p-4 mb-6 space-y-4 shadow-inner">
                            <div className="flex justify-between">
                                <span className="text-gray-300">Status:</span>
                                <span className={`${contact?.isOnline ? "text-green-300" : "text-red-300"}`}>
                                    {contact?.isOnline ? "Online" : "Offline"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-300">Joined:</span>
                                <span>{contact?.createdAt ? new Date(contact.createdAt).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric"
                                }) : "N/A"
                                }</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-between gap-4">
                            <button
                                className="flex-1 flex items-center justify-center gap-2 bg-red-400 text-white hover:bg-red-500 py-2 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                onClick={() => handleDeleteContact(selectedContact?._id)}
                                disabled={loading}
                                aria-label="Delete contact"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg
                                            className="animate-spin h-5 w-5 text-white"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                fill="none"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                                            />
                                        </svg>
                                        deleting...
                                    </span>
                                ) : (
                                    <>
                                        <FaTrashAlt /> Delete
                                    </>
                                )}
                            </button>
                            <button className="flex-1 flex items-center justify-center gap-2 bg-yellow-300 text-yellow-900 hover:bg-yellow-400 py-2 rounded-xl transition cursor-pointer"
                                onClick={() => {
                                    user.blockedUsers.includes(selectedContact._id)
                                        ? handleUnblockContact()
                                        : handleBlockContact()
                                }}
                            >
                                {
                                    user?.blockedUsers?.includes(selectedContact._id) ? (
                                        <>
                                            <MdHowToReg /> Unblock
                                        </>
                                    ) : (
                                        <>
                                            <FaUserSlash /> Block
                                        </>
                                    )
                                }
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ContactInfo;
