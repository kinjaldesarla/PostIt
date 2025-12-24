import { Sparkles } from "lucide-react";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/AxiosInstances";
import type { LoginPayload } from "../types/Auth";
import { toast } from "react-toastify";
import axios from "axios";

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    identifier:"",
    password: "",
  });
  const navigate=useNavigate();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async(e: React.FormEvent) => {
    e.preventDefault();
    const payload:LoginPayload={...formData}
     try {
      const response = await axiosInstance.post('/user/login',
        payload,
        {withCredentials:true}
      )
    
     localStorage.setItem('token',response.data.data.accesstoken)
     localStorage.setItem('userid',response.data.data.user._id)
          setFormData({
        identifier:"",
         password: ""
       })
           console.log("User logged in successfully:", response.data.data);
           toast.success(response.data.message || "logged In successfully!");
           navigate("/dashboard");
     } catch (err:unknown) {
        setFormData({
        identifier:"",
         password: ""
       })
        if (axios.isAxiosError(err)) {
    console.error("login error:", err.response?.data || err.message);
    if (err.response?.data?.message) {
      toast.error(err.response.data.message);
    } else {
      toast.error("Login failed. Please try again.");
    }
  } else {
    console.error("Unexpected error:", err);
    toast.error("Something went wrong. Please try again.");
  }
     }
  };

  return (
    <div className="flex flex-col items-center p-10 justify-center mt-4 px-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white border border-gray-200 rounded-2xl px-12 py-10 shadow-md hover:shadow-xl transition duration-300">
         <div className="flex justify-center gap-3 items-center mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="text-white" size={20} />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                  POST IT
                </h1>

          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            {["identifier", "password"].map((field, i) => (
              <div key={i} className="relative">
                <input
                  type={field === "password" ? "password" : "text"}
                  name={field}
                  placeholder={field === "identifier" ? "Username or Email" : "Password"}
                  value={(formData)[field as keyof LoginPayload]}
                  onChange={handleChange}
                  className="peer border w-full rounded-lg px-3 pt-5 pb-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition placeholder-transparent"
                  required
                />
                <label
                  className="absolute left-3 top-2 text-gray-400 text-xs peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 transition-all duration-200"
                >
                  {field === "identifier" ? "Username or Email" : "Password"}
                </label>
              </div>
            ))}

           <button 
                  type="submit"
                  className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  Log In
                </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
           
          </div>

     
        </div>

        {/* Signup Redirect */}
        <div className="bg-white border border-gray-200 rounded-2xl mt-4 p-5 text-center shadow-sm hover:shadow transition duration-300">
          <p className="text-sm">
            Don’t have an account?{" "}
            <Link
              to="/"
              className="text-pink-500 font-semibold hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
