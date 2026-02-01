import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Route,Routes } from 'react-router-dom'
import Navbar from './component/Navbar'
import Signup from './pages/Signup'
import Login from './pages/Login'
import HomePage from './pages/HomePage'
import VideoPage from './pages/VideoPage'
import Dashboard from './dashboard/Dashboard'
function App() {
  const [count, setCount] = useState(0)
const user=false
  return (
    <>
      <Navbar/>
        <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/signup' element={!user? <Signup />:<HomePage/>}/>
        <Route path='/login' element={!user?<Login />:<HomePage/> }/>
        <Route path='/room/:roomId' element={<VideoPage />} />
          {/* <Route path='video' element={<VideoPage />} /> */}
        <Route path='/dashboard' element={<Dashboard />} />
        {/* <Route path='/secret-dashboard' element={!user?<AdminPages/>:<Navigate to='/login'/>}/>  */}

       </Routes>
    </>
  )
}

export default App
