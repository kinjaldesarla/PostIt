import axios from "axios";
import { Sparkles } from "lucide-react";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../utils/AxiosInstances";
import type { SignupPayload } from "../types/Auth";
import { toast } from "react-toastify";

const SignUp: React.FC = () => {
  const [formData, setFormData] = useState<SignupPayload>({
    email: "",
    fullname: "",
    username: "",
    password: "",
  });
const navigate=useNavigate();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSubmit = async(e: React.FormEvent) => {
   const payload:SignupPayload={...formData}
    e.preventDefault();
 try {
  const response=await axiosInstance.post('user/signup',
   payload,
   {withCredentials:true}
  )
   localStorage.setItem('token',response.data.data.accesstoken)
   localStorage.setItem('userid',response.data.data.AuthenicatedUser._id)
     setFormData({
    email: "",
    fullname: "",
    username: "",
    password: "",
  })
      toast.success(response.data.message || "Registered successfully!");
      navigate("/dashboard");
 } catch (err:unknown) {
   setFormData({
    email: "",
    fullname: "",
    username: "",
    password: "",
  })
   if (axios.isAxiosError(err)) {
    console.error("Registration error:", err.response?.data || err.message);
    if (err.response?.data?.message) {
      toast.error(err.response.data.message);
    } else {
      toast.error("Registration failed. Please try again.");
    }
  } else {
    console.error("Unexpected error:", err);
    toast.error("Something went wrong. Please try again.");
  }
 }
  };

  return (
    <div className="flex flex-col items-center justify-center pt-10 p-10 min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Signup Card */}
        <div className="bg-white border border-gray-200 rounded-2xl px-12 py-10 shadow-md hover:shadow-xl transition duration-300">
          <div className="flex justify-center gap-3 items-center mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Sparkles className="text-white" size={20} />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                  POST IT
                </h1>

          </div>
          {/* Subtitle */}
          <p className="text-center text-gray-500 font-medium mb-6">
            Sign up to see posts from your friends ✨
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            {["email", "fullname", "username", "password"].map((field, i) => (
              <div key={i} className="relative">
                <input
                  type={field === "password" ? "password" : "text"}
                  name={field}
                  placeholder={
                    field === "username"
                      ? "Username"
                      : field === "fullname"
                      ? "Full Name"
                      : field === "email"
                      ? "Email"
                      : "Password"
                  }
                  value={(formData )[field as keyof SignupPayload]}
                  onChange={handleChange}
                  className="peer border w-full rounded-lg px-3 pt-5 pb-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition placeholder-transparent"
                  required
                />
                <label
                  className="absolute left-3 top-2 text-gray-400 text-xs peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 transition-all duration-200"
                >
                  {field === "username"
                    ? "Username"
                    : field === "fullname"
                    ? "Full Name"
                    : field === "email"
                    ? "Email"
                    : "Password"}
                </label>
              </div>
            ))}

           <button 
                  type="submit"
                  className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                 Sign Up
                </button>
          </form>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center mt-5 leading-relaxed">
            By signing up, you agree to our{" "}
            <span className="font-medium text-pink-500 cursor-pointer hover:underline">
              Terms
            </span>
            ,{" "}
            <span className="font-medium text-pink-500 cursor-pointer hover:underline">
              Privacy Policy
            </span>{" "}
            and{" "}
            <span className="font-medium text-pink-500 cursor-pointer hover:underline">
              Cookies Policy
            </span>
            .
          </p>
        </div>

        {/* Login Redirect */}
        <div className="bg-white border border-gray-200 rounded-2xl mt-4 p-5 text-center shadow-sm hover:shadow transition duration-300">
          <p className="text-sm">
            Have an account?{" "}
            <Link
              to="/login"
              className="text-pink-500 font-semibold hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
