import { Sidebar } from "../components/Sidebar";
import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/AxiosInstances";
import type { EditUserProfile } from "../types/User";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const EditProfile: React.FC = () => {
  const [formData, setFormData] = useState<EditUserProfile>({
    username: "",
    fullname: "",
    bio: "",
    profilePhoto: null,
    isPrivate: false,
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [_isCollapsed, setIsCollapsed] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const navigate = useNavigate();

  // 🔹 Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get("/user/profile", {
          withCredentials: true,
        });
        const user = response.data.data.profile;
        console.log(response.data.data);
        
        setFormData((prev) => ({
          ...prev,
          username: user.username || "",
          fullname: user.fullname || "",
          bio: user.bio || "",
          profilePhoto: user.profilePhoto || null,
          isPrivate: user.isPrivate , // 👈 fetch backend privacy value
        }));
     console.log("From backend:", user.isPrivate)
        
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      }
    };
    fetchProfile();
  }, []);

  // 🔹 Handle text input
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // 🔹 Handle photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, profilePhoto: e.target.files[0] });
    }
  };

  // 🔹 Handle profile update (sends isPrivate automatically)
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = new FormData();
    payload.append("username", formData.username);
    payload.append("fullname", formData.fullname);
    payload.append("bio", formData.bio);
    payload.append("isPrivate", formData.isPrivate.toString()); // 👈 added privacy field
    if (formData.profilePhoto instanceof File) {
      payload.append("profilePhoto", formData.profilePhoto);
    }

    try {
      const response = await axiosInstance.patch("user/edit-profile", payload, {
        withCredentials: true,
      });

      // Update state with new photo URL (from backend)
      if (response.data.data.profilePhoto) {
        setFormData({
          ...formData,
          profilePhoto: response.data.data.profilePhoto,
        });
      }

      toast.success(response.data.message || "Profile Updated");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error("Update error:", err.response?.data || err.message);
        toast.error(
          err.response?.data?.message ||
            "User profile not updated. Please try again."
        );
      } else {
        console.error("Unexpected error:", err);
        toast.error("Something went wrong. Please try again.");
      }
    }
  };

  // 🔹 Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New password and confirm password do not match!");
      return;
    }
    try {
      await axiosInstance.patch(
        "user/change-password",
        {
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        },
        { withCredentials: true }
      );
      toast.success("Password updated successfully!");
      setFormData({
        ...formData,
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordSection(false);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error("Password not changed:", err.response?.data || err.message);
        toast.error(
          err.response?.data?.message || "Password not changed. Please try again."
        );
      } else {
        console.error("Unexpected error:", err);
        toast.error("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <>
      <Sidebar onCollapseChange={setIsCollapsed} />
      <div className="min-h-screen bg-gray-50 flex justify-center py-12">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-md p-8">
          <div className="flex justify-between mx-3">
            <h2 className="text-2xl font-bold mb-8 text-center">
              Edit Profile
            </h2>
            <div className="mb-4">
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="px-4 py-2 rounded-lg border border-gray-400 text-gray-700 hover:bg-gray-100 transition"
              >
                ← Back to Profile
              </button>
            </div>
          </div>

          {/* -------- Edit Profile Form -------- */}
          <form onSubmit={handleProfileSubmit} className="space-y-8">
            {/* Profile Photo */}
            <div className="flex items-center space-x-6">
              <img
                src={
                  formData.profilePhoto
                    ? formData.profilePhoto instanceof File
                      ? URL.createObjectURL(formData.profilePhoto)
                      : formData.profilePhoto
                    : 'https://res.cloudinary.com/dmarnah7d/image/upload/v1760940580/default_profile_tth4p1.jpg'
                }
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Profile Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="mt-1 block text-sm text-gray-500"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-orange-500"
                placeholder="Enter your username"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                name="fullname"
                value={formData.fullname}
                onChange={handleChange}
                className="mt-1 block w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-orange-500"
                placeholder="Enter your full name"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-orange-500"
                placeholder="Tell something about yourself..."
              />
            </div>

            {/* 🔹 Account Privacy Toggle */}
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div>
                <h3 className="text-sm font-medium text-gray-800">
                  Account Privacy
                </h3>
                <p className="text-xs text-gray-500">
                  
                     Your profile is public and visible to everyone.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!(formData.isPrivate)}
                  onChange={(e) =>
                    setFormData({ ...formData, isPrivate: !e.target.checked})
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer
                  peer-checked:after:translate-x-full peer-checked:after:border-white after:content-['']
                  after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300
                  after:border after:rounded-full after:h-5 after:w-5 after:transition-all
                  peer-checked:bg-gradient-to-r peer-checked:from-orange-500 peer-checked:to-pink-500">
                </div>
              </label>
            </div>

            {/* Save Profile */}
            <div className="flex justify-center">
              <button
                type="submit"
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold shadow-md hover:opacity-90 transition"
              >
                Save Profile
              </button>
            </div>
          </form>

          {/* -------- Password Section -------- */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="px-4 py-2 rounded-lg border border-orange-500 text-orange-500 hover:bg-orange-50 transition"
            >
              {showPasswordSection ? "Cancel" : "Change Password"}
            </button>
          </div>

          {showPasswordSection && (
            <form
              onSubmit={handlePasswordChange}
              className="mt-6 space-y-4 border-t pt-6"
            >
              <h3 className="text-lg font-semibold mb-4">Change Password</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Old Password
                </label>
                <input
                  type="password"
                  name="oldPassword"
                  value={formData.oldPassword}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter old password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-orange-500"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-gray-300 p-2 focus:ring-2 focus:ring-orange-500"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold shadow-md hover:opacity-90 transition"
                >
                  Update Password
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
};

export default EditProfile;


