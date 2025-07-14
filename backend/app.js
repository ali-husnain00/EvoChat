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
      .populate("contacts.userId", "_id username email avatar isOnline");

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

app.put("/updateStatus", verifyToken, async (req, res) => {
  const userId = req.user.id; 
  try {
    const existingUser = await user.findById(userId);
    if (!existingUser) {  
      return res.status(404).send({ msg: "User not found!" });
    }
    existingUser.isOnline = !existingUser.isOnline;
    await existingUser.save();
    res.status(200).send({ msg: "Status updated successfully!" });
  } catch (error) {
    res.status(500).send({ msg: "Server error while updating status!" });
    console.error(error);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
