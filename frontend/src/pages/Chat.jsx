import React, { useContext } from 'react'
import { ChatContext } from '../components/Context';

const Chat = () => {

  const {user} = useContext(ChatContext);

  return (
    <div>
      <h1 className="text-2xl text-black">Welcome to the Chat, {user ? user.username : "Guest"}!</h1>
      <p className="text-gray-800">This is your chat interface.</p>
    </div>
  )
}

export default Chat