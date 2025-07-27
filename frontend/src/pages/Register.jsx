import React, { useContext, useState } from "react";
import { motion } from "framer-motion";
import logo from "/EvoChat_logo1.png";
import { Link, useNavigate } from "react-router-dom";
import {toast} from "sonner";
import { ChatContext } from "../components/Context";

const Register = () => {

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { BASE_URL } = useContext(ChatContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!username || !email || !password) {
      toast.warning("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, email, password }),  
      }); 
      const data = await res.json();
      if(res.ok){
        toast.success(data.msg);
        navigate("/login");
        setUsername("");
        setEmail("");
        setPassword("");
      }
      else if(res.status === 401) {
        toast.error(data.msg);
      }
    } catch (error) {
      toast.error("Registration failed. Please try again.");
      console.error("Registration error:", error);
    }
    finally{
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-[90%] max-w-md bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10"
      >
        <div className="flex flex-col items-center mb-6">
          <img src={logo} alt="EvoChat" className="w-16 mb-4" />
          <h2 className="text-white text-center text-3xl font-bold">Join EvoChat</h2>
          <p className="text-gray-300 text-sm mt-1">Stay connected. Secure. Fast. Private.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full mb-4 py-2 px-4 bg-white/5 rounded text-white placeholder-gray-400 focus:outline-none"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full mb-4 py-2 px-4 bg-white/5 rounded text-white placeholder-gray-400 focus:outline-none"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full mb-6 py-2 px-4 bg-white/5 rounded text-white placeholder-gray-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-2 text-white font-semibold rounded cursor-pointer"
          >
           {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Please wait...
              </span>
            ) : "Create Account"}
          </button>
          <p className="text-gray-300 text-sm text-center mt-4">
            Already have an account? <Link to="/login" className="text-blue-400 hover:underline">Login</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
