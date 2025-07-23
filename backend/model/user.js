import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String }, 
    isOnline: { type: Boolean, default: false },
    contacts:[
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        addedAt: { type: Date, default: Date.now }
      }
    ],
    blockedUsers: [
      {
        type : mongoose.Schema.Types.ObjectId, 
        ref: "User"
      }
    ],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
