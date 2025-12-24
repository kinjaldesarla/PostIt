import React, { useEffect, useState } from "react";
import {
  Home,
  Search,
  Bell,
  PlusSquare,
  User,
  X,
  Sparkles,
  type LucideIcon,
  LogOut,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import CreatePost from "./Createpost";
import axiosInstance from "../utils/AxiosInstances";
import axios from "axios";
import { toast } from "react-toastify";

interface SidebarItem {
  icon: LucideIcon;
  label: string;
  key: string;
}
type ActiveTab = "home" | "search" | "notifications" | "create" | "profile" | "logout"|"none";

interface SidebarProps {
  onCollapseChange?: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCollapseChange }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [previousTab, setPreviousTab] = useState<ActiveTab>("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<any[]>([]); // Notifications data
  const [searchResults, setSearchResults] = useState<any[]>([]); // Search results
  const [showCreatePost, setShowCreatePost] = useState(false); // CreatePost modal
  const location = useLocation();
  const navigate = useNavigate();

  // Highlight based on route
 useEffect(() => {
  // If we're in search flow → show no highlight
  if (activeTab === "search") {
    setActiveTab("none");
    return;
  }

  if (location.pathname === "/dashboard") {
    setActiveTab("home");
  } else if (
    location.pathname === "/profile" ||
    location.pathname === "/edit-profile"
  ) {
    setActiveTab("profile");
  } else if (location.pathname === "/notifications") {
    setActiveTab("notifications");
  } else {
    setActiveTab("none"); // default when nothing should be highlighted
  }
}, [location.pathname]);

  const isCollapsed = ["search", "notifications"].includes(activeTab);

  useEffect(() => {
    onCollapseChange?.(isCollapsed);
  }, [isCollapsed, onCollapseChange]);

  const sidebarItems: SidebarItem[] = [
    { icon: Home, label: "Home", key: "home" },
    { icon: Search, label: "Search", key: "search" },
    { icon: Bell, label: "Notifications", key: "notifications" },
    { icon: PlusSquare, label: "Create Post", key: "create" },
    { icon: User, label: "Profile", key: "profile" },
    { icon: LogOut, label: "Logout", key: "logout" },
  ];

  const handleTabClick = (key: string) => {
    if (key === "create") {
      setShowCreatePost(true); // open CreatePost modal
      return;
    }

    if (key === "search" || key === "notifications") setPreviousTab(activeTab);

    setActiveTab(key as ActiveTab);

    if (key === "home") navigate("/dashboard");
    else if (key === "profile") navigate("/profile");
    else if (key === "logout") {
      localStorage.removeItem("token");
      localStorage.removeItem("userid")
      navigate("/login");
    }
  };

  // ----------------- Handlers for backend integration -----------------
 // Inside Sidebar component
useEffect(() => {
  const delayDebounce = setTimeout(() => {
    if (searchQuery.trim().length > 0) {
      handleSearch();
    } else {
      setSearchResults([]); // clear if empty
    }
  }, 500); // 500ms debounce

  return () => clearTimeout(delayDebounce);
}, [searchQuery]);

const handleSearch = async () => {
  try {
    const response = await axiosInstance.get(
      `user/search?query=${searchQuery}`,
      { withCredentials: true }
    );

    setSearchResults(response.data.data.users); // ✅ only the array
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error("searching error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Search failed. Please try again.");
    } else {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong. Please try again.");
    }
  }
};

const getSingleProfile=async(searchUserId:string)=>{
  const userId=localStorage.getItem('userid')
try {
  if(searchUserId==userId){
    navigate('/profile')
  }
  else{
  const response=await axiosInstance.get(`user/search-user/${searchUserId}`)
  navigate(`/profile/${response.data.data.profile._id}`)
  }
   setActiveTab("search");  
    setSearchQuery("");     
    setSearchResults([]); 
} catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error("searching error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Searched profile not found. Please try again.");
    } else {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong. Please try again.");
    }
  }
};


  const handleFetchNotifications = async () => {
    try {
      const response=await axiosInstance.get('user/notifications',{withCredentials:true});
      console.log(response.data.data);
      setNotifications(response.data.data.notifications)
    } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error("notification fetching error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "notifications are not found.");
    } else {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong. Please try again.");
    }
  }
  };
useEffect(() => {
  if (activeTab === "notifications") {
    handleFetchNotifications();
  }
}, [activeTab]);

const handleCreatePostSubmit = async (formData: FormData) => {
  try {
    const response = await axiosInstance.post("/post/create-post", formData, {
      withCredentials: true,
      headers: { "Content-Type": "multipart/form-data" },
    });
    console.log("Post created successfully:", response.data.data);
    toast.success("Post uploaded!");
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error("post uploading error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "post not uploaded.");
    } else {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong. Please try again.");
    }
  }
};


  const handleConfirmFollow=async(requestId:string)=>{
    try {
      await axiosInstance.patch(`user/accept-request/${requestId}`,{},{withCredentials:true})
       setNotifications((prev) =>
      prev.map((notif) =>
        notif._id === requestId ? { ...notif, status: "accepted" } : notif
      )
    );
   
      }catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error("notification accpeting error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "request not confirmed.");
    } else {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong. Please try again.");
    }
  }
  }

  const handleDeleteFollowRequest=async(notificationId :string)=>{
    try {
     await axiosInstance.delete(`user/delete-notification/${notificationId}`)
      setNotifications((prev) =>
      prev.filter((notif) => notif._id !== notificationId)
    );
      
    }catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error("notification deleting error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "request is not removed.");
    } else {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong. Please try again.");
    }
  }
  }


  // -------------------------------------------------------------------

  return (
    <>
      <aside
        className={`fixed left-0 top-0 h-screen transition-all duration-300 bg-white border-r border-gray-200 shadow-sm z-50
        ${isCollapsed ? "w-20" : "w-72"}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="px-6 py-6 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Sparkles className="text-white" size={20} />
              </div>
              {activeTab !== "search" && activeTab !== "notifications" && (
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                  POST IT
                </h1>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-6 relative">
            <div className="space-y-2">
              {sidebarItems.map((item: SidebarItem) => (
                <div key={item.key} className="relative">
                  <button
                    onClick={() => handleTabClick(item.key)}
                    className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl text-left transition-all duration-200 
                    ${activeTab === item.key
                        ? "bg-gradient-to-r from-orange-50 to-pink-50 text-orange-600 border border-orange-200"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <item.icon size={22} />
                    {activeTab !== "search" && activeTab !== "notifications" && (
                      <span className="font-medium text-base">{item.label}</span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </nav>
        </div>
      </aside>


{/* Search Panel */}
{activeTab === "search" && (
  <div className="fixed left-20 top-0 h-screen w-96 bg-white border-r border-gray-200 shadow-md z-40 p-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold">Search</h2>
      <button
        type="button"
        onClick={() => setActiveTab(previousTab)}
        className="p-2 rounded-full hover:bg-gray-100"
      >
        <X size={20} />
      </button>
    </div>
    <input
      type="text"
      placeholder="Search people"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full px-4 py-2 border rounded-lg mb-4 focus:ring-2 focus:ring-orange-400 outline-none"
    />

    <div className="space-y-3">
      {searchResults.length > 0 ? (
        searchResults.map((user: any, idx) => (
          <div
            key={idx}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
            onClick={()=>getSingleProfile(user._id)}
          >
            <img
              src={user.profilePhoto || 'https://res.cloudinary.com/dmarnah7d/image/upload/v1760940580/default_profile_tth4p1.jpg'}
              alt={user.username}
              className="w-10 h-10 rounded-full"
            />
            <span className="font-medium">{user.username}</span>
          </div>
        ))
      ) : (
        <p className="text-gray-400">No results</p>
      )}
    </div>
  </div>
)}


     {/* Notifications Panel */}
{activeTab === "notifications" && (
  <div className="fixed left-20 top-0 h-screen w-96 bg-white border-r border-gray-200 shadow-md z-40 p-6">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-bold">Notifications</h2>
      <button
        onClick={() => setActiveTab(previousTab)}
        className="p-2 rounded-full hover:bg-gray-100"
      >
        <X size={20} />
      </button>
    </div>

    <div className="space-y-4">
      {notifications.length > 0 ? (
        notifications.map((notif) => (
          <div
            key={notif._id}
            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
          >
            <div className="flex items-center space-x-3">
              <img
                src={notif.sender.profilePhoto || 'https://res.cloudinary.com/dmarnah7d/image/upload/v1760940580/default_profile_tth4p1.jpg'}
                alt={notif.sender.username}
                className="w-10 h-10 rounded-full"
              />
              <p className="text-sm">
                <span className="font-medium">{notif.sender.username}</span>{" "}
                {notif.status === "pending" ? "requested to follow you." : "started following you."}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {notif.status === "pending" ? (
                <>
                  <button
                    onClick={() => handleConfirmFollow(notif._id)}
                    className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleDeleteFollowRequest(notif._id)}
                    className="px-3 py-1 text-sm text-gray-700 border rounded hover:bg-gray-100"
                  >
                    X
                  </button>
                </>
              ) :  notif.status === "requested" ? (
    <button
      disabled
      className="px-2 py-1 text-sm rounded bg-gray-300 text-gray-600 cursor-not-allowed"
    >
      Requested
    </button>
  ) : notif.status === "accepted" ? (
    <button
      disabled
      className="px-2 py-1 text-sm rounded bg-gray-500 text-white cursor-not-allowed"
    >
      Following
    </button>
  ) : null}
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-400">No notifications</p>
      )}
    </div>
  </div>
)}

      {/* Create Post Modal */}
     {showCreatePost && (
  <CreatePost
    onClose={() => setShowCreatePost(false)}
    onSubmit={handleCreatePostSubmit}
  />
)}

    </>
  );
};







    


