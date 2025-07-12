import React from 'react'
import {Routes, Route} from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'
import { Toaster } from 'sonner'

const App = () => {
  return (
    <div>
      <Toaster position='top-right'/>
      <Routes>
        <Route path='/login' element = {<Login/>} />
        <Route path='/register' element = {<Register/>}/>
        <Route path='/chat' element = {<Chat/>} />
      </Routes>
    </div>
  )
}

export default App