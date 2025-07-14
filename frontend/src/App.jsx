import React, { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'
import { Toaster } from 'sonner'
import { ChatContext } from './components/Context'
import Loader from './components/Loader'

const App = () => {

  const { user, loading } = useContext(ChatContext)

  if (loading) {
    return <Loader />
  }

  return (
    <div>
      <Toaster position='top-right' />
      <Routes>
        <Route path='/' element={<Navigate to={user ? "/chat" : "/login"} replace />} />
        <Route path='/login' element={user ? <Navigate to="/chat" replace /> : <Login />} />
        <Route path='/register' element={<Register />} />
        <Route
          path='/chat'
          element={user ? <Chat /> : <Navigate to='/login' replace />}
        />
      </Routes>
    </div>
  )
}

export default App