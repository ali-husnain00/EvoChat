# 💬 EvoChat - Real-Time Chat Application

Welcome to **EvoChat**, a sleek and modern real-time chat application built using the **MERN Stack (MongoDB, Express.js, React.js, Node.js)** and **Socket.IO** for instant messaging. This app is designed with a strong focus on user experience, responsiveness, and modern UI aesthetics.

---

## 🚀 Features

* 🔐 **JWT Authentication** (Login / Register)
* 👥 **Real-time Messaging** with Socket.IO
* ✅ **Block/Unblock Contacts**
* 💬 **Typing Indicators**
* 📂 **Image Upload & Sharing**
* 😊 **Emoji Picker Integration**
* 🌐 **Responsive Design** for all device sizes
* 🔍 **User Search** and Dynamic Contact List
* 🧾 **Message Deletion (Your side / Everyone)**
* 🔒 **Private 1-to-1 Messaging Only**

---

## 🛠️ Tech Stack

### Frontend

* ⚛️ React.js
* 📦 Vite
* 🎨 Tailwind CSS
* 📡 Socket.IO Client
* 🔥 React Toastify for notifications
* 😍 Emoji Picker (emoji-picker-react)

### Backend

* 🌐 Node.js
* 🚂 Express.js
* 🗃 MongoDB with Mongoose
* 🔑 JSON Web Token (JWT) Auth
* 📡 Socket.IO Server
* 🧰 Multer for file handling
* 🛡 CORS, dotenv, bcryptjs, etc.

---

## 📁 Folder Structure (Frontend)

```
/src
  /assets
  /components
  /pages
  /context
  /utils
  App.jsx
  main.jsx
```

## 📁 Folder Structure (Backend)

```
/backend
  /controllers
  /models
  /routes
  /middlewares
  /uploads
  app.js
```

---

## 🧪 How to Run Locally

### 1. Clone the Repo

```bash
git clone https://github.com/ali-husnain00/EvoChat.git
```

### 2. Setup Backend

```bash
cd backend
npm install
create .env file (add your MongoDB URI, JWT_SECRET, PORT)
nodemon app.js
```

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

> 💡 **Make sure MongoDB is running locally or use MongoDB Atlas**

---

## 🌍 Deployment

* 🚀 **Frontend:** Hosted on [Netlify](https://www.netlify.com/)
* 🌐 **Backend:** Use [Render](https://render.com/)

---

## 📧 Contact

Created by [Ali Husnain](https://github.com/ali-husnain00)

Feel free to reach out:

* 🌐 [Portfolio](https://alihusnaindev.netlify.app)
* 📬 [alihusnain68786@gmail.com](mailto:alihusnain68786@gmail.com)

---

## ⭐ Credits

* Inspired by WhatsApp Web UI
* Built with ❤️ using React + Socket.IO

---

## 📝 License

This project is licensed under the MIT License.

---

> **Enjoy chatting in real-time with EvoChat! 🗨️🔥**
