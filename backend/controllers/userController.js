import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import user from "../model/user.js";

// Register User
export const registerUser = async (req, res) => {
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
};

// Login User
export const loginUser = async (req, res) => {
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
      expiresIn: "24h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });

    res.status(200).send({ msg: "Login successful!" });
  } catch (error) {
    res.status(500).send({ msg: "Server error while logging in!" });
    console.error(error);
  }
};

// Logout User
export const logoutUser = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });
    res.status(200).send({ msg: "Logged out successfully!" });
  } catch (error) {
    res.status(500).send({ msg: "Server error while logging out!" });
    console.error(error);
  }
};

// Get Logged In User
export const getLoggedInUser = async (req, res) => {
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
};

// Update Profile
export const updateProfile = async (req, res) => {
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
};

// Get My Contacts
export const getMyContacts = async (req, res) => {
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
};

// Add Contact
export const addContact = async (req, res) => {
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
};

// Delete Contact
export const deleteContact = async (req, res) => {
  const contactId = req.params.contactId;
  const userId = req.user.id;
  try {
    const existingUser = await user.findById(userId);
    if (!existingUser) {
      return res.status(404).send({ msg: "User not found!" });
    }

    existingUser.contacts = existingUser.contacts.filter(
      (c) => c.userId.toString() !== contactId
    );
    await existingUser.save();
    res.status(200).send({ msg: "Contact deleted successfully!" });
  } catch (error) {
    res.status(500).send({ msg: "Server error while deleting contact!" });
    console.error(error);
  }
};

// Block Contact
export const blockContact = async (req, res) => {
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
};

// Unblock Contact
export const unblockContact = async (req, res) => {
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
};