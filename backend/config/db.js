import mongoose from "mongoose";

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.log("An error occured while connecting to database" + error);
  }
};

export default connectDb;
