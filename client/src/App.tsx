
import {  createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import './App.css'
import Login from './pages/Login'
import SignUp from './pages/Signup'
import Dashboard from './pages/Dashboard'
import ProfilePage from './pages/Profile'
import EditProfile from './pages/EditProfile'
import UserProfilePage from './pages/UserProfilePage'
import { ToastContainer } from 'react-toastify'
import ProtectedRoute from './components/ProtectedRoutes'

function App() {
    
  const router=createBrowserRouter(
    createRoutesFromElements(
       <Route>
    <Route path='' element={<SignUp/>}/>
    <Route path='/login' element={<Login/>}/>
    <Route path='/dashboard' element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
    <Route path='/profile' element={<ProtectedRoute><ProfilePage /></ProtectedRoute>}/>
    <Route path='/profile/:searchUserId' element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>}/>
    <Route path='/edit-profile' element={<ProtectedRoute><EditProfile /></ProtectedRoute>}/>
      </Route> 
    )
  )
  return (
     <>
     <RouterProvider router={router}/>
       <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored" 
      />
     </>
  )
}

export default App
