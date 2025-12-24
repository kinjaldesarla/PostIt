import React, { useEffect, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import {
 
  Heart,
  MessageCircle,
  X,
} from "lucide-react";
import {  useParams } from "react-router-dom";
import axiosInstance from "../utils/AxiosInstances";
import { toast } from "react-toastify";
import type { Notify, UserProfile } from "../types/User";
import axios from "axios";
import PostModal from "../components/PostModal";



type ProfileTab = "posts" | "saved";
type FollowStatus = "none" | "requested" | "following";

const UserProfilePage: React.FC = () => {
  const [profileTab, _setProfileTab] = useState<ProfileTab>("posts");
  const [followStatus, setFollowStatus] = useState<FollowStatus>("none");
  const [modalFollowStatus, setModalFollowStatus] = useState<Record<string, FollowStatus>>({});
  const { searchUserId } = useParams<{ searchUserId: string }>();
  const [isOwnProfile, setIsOwnProfile] = useState(false);
   const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [user, setUser] = useState<UserProfile>({
    profile: {
      profilePhoto: "",
      username: "",
      fullname: "",
      bio: "",
      followers: [],
      following: [],
      savedPost: [],
      isPrivate:false
    },
    posts:[],
    totalPost: 0,
  });
  const canViewContent = !(user.profile.isPrivate)|| followStatus === "following" || isOwnProfile;
  const [activeModal, setActiveModal] = useState<"followers" | "following" | null>(null);


const updatePostInGrid = (updatedPost: any) => {
  setUser((prev) => ({
    ...prev,
    posts: prev.posts.map((p) =>
      p._id === updatedPost._id ? { ...p, ...updatedPost } : p
    ),
  }));
};


  const fetchUserProfile = async () => {
    try {
      const response = await axiosInstance.get(
        `user/search-user/${searchUserId}`,
        { withCredentials: true }
      );
      const profileData = response.data.data;
      console.log(response.data.data);
      
      setUser(profileData);
      
      // Check if viewing own profile
      const currentUserId = localStorage.getItem("userid");
      setIsOwnProfile(currentUserId === searchUserId);
      
      // Check follow status after getting profile data
      await checkFollowStatus(profileData);

    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to fetch profile");
      } else {
        toast.error("Something went wrong.");
      }
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [searchUserId]);

  const checkFollowStatus = async (profileData: UserProfile) => {
    const currentUserId = localStorage.getItem("userid");
    
    // First check if we're actually following (check if current user ID is in their followers array)
    const isFollowing = profileData.profile.followers.some(
      (follower: any) => {
        // Handle both string IDs and object IDs
        const followerId = typeof follower === 'string' ? follower : follower._id;
        return followerId === currentUserId;
      }
    );
    
    if (isFollowing) {
      setFollowStatus("following");
      return;
    }

    // If not following, check if there's a pending request
    try {
      const response = await axiosInstance.get(
        `user/notifications/${searchUserId}`,
        { withCredentials: true }
      );
      const notifications = response.data.data.notifications;
      
      const pendingRequest = notifications.find(
        (notify: Notify) => 
          notify.sender._id === currentUserId && 
          notify.status === 'pending' &&
          notify.type === 'follow'
      );
      
      if (pendingRequest) {
        setFollowStatus("requested");
      } else {
        setFollowStatus("none");
      }
    } catch (err) {
      setFollowStatus("none");
    }
  };

  const toggleFollow = async () => {
    try {
      if (followStatus === "none") {
        console.log('hey');
        
        const res = await axiosInstance.patch(
          `user/follow-user-request/${searchUserId}`,
          {},
          { withCredentials: true }
        );
        console.log(res.data.data);
        
        const status = res.data.data.notification?.status;
        if (status === "pending") {
          setFollowStatus("requested");
          toast.info("Follow request sent");
        } else {
          setFollowStatus("following");
          toast.success("User followed");
        }
        await fetchUserProfile();
      } else if (followStatus === "requested") {
        toast.info("Request already sent");
      } else if (followStatus === "following") {
        await axiosInstance.patch(
          `user/unfollow-user/${searchUserId}`,
          {},
          { withCredentials: true }
        );
        setFollowStatus("none");
        toast.success("Unfollowed successfully");
        await fetchUserProfile();
      }
    } catch (err: unknown) {
      console.log('error');
      
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to follow user");
      } else {
        toast.error("Something went wrong.");
      }
    }
  };

  const toggleFollowFromList = async (userId: string) => {
    try {
      const status = modalFollowStatus[userId] || "none";

      if (status === "none") {
        const res = await axiosInstance.patch(
          `user/follow-user-request/${userId}`,
          {},
          { withCredentials: true }
        );
        const newStatus =
          res.data.data.notification?.status === "pending"
            ? "requested"
            : "following";

        setModalFollowStatus((prev) => ({ ...prev, [userId]: newStatus }));
        if (newStatus === 'requested') {
          toast.info("Follow request sent");
        } else {
          toast.success("User followed");
        }
        await fetchUserProfile();
      } else if (status === "requested") {
        toast.info("Request already sent");
      } else if (status === "following") {
        await axiosInstance.patch(
          `user/unfollow-user/${userId}`,
          {},
          { withCredentials: true }
        );
        setModalFollowStatus((prev) => ({ ...prev, [userId]: "none" }));
        toast.success("Unfollowed successfully");
        await fetchUserProfile();
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to follow user");
      } else {
        toast.error("Something went wrong.");
      }
    }
  };

  const removeFollower = async (followerId: string) => {
    try {
      await axiosInstance.patch(
        `user/remove-follower/${followerId}`,
        {},
        { withCredentials: true }
      );
      toast.success("Follower removed successfully");
      await fetchUserProfile();
      setModalFollowStatus((prev) => ({ ...prev, [followerId]: "none" }));
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data?.message || "Failed to remove follower");
      } else {
        toast.error("Something went wrong.");
      }
    }
  };

  const initModalFollowStatuses = async (usersList: any[]) => {
    const currentUserId = localStorage.getItem("userid");
    const statusMap: Record<string, FollowStatus> = {};

    for (const u of usersList) {
      if (u._id === currentUserId) {
        statusMap[u._id] = "none";
        continue;
      }

      try {
        // Get the user's full profile to check their followers array
        const profileResponse = await axiosInstance.get(
          `user/search-user/${u._id}`,
          { withCredentials: true }
        );
        const userProfile = profileResponse.data.data;
        
        // Check if current user is in their followers array (we are following them)
        const isFollowing = userProfile.profile.followers.some(
          (follower: any) => {
            const followerId = typeof follower === 'string' ? follower : follower._id;
            return followerId === currentUserId;
          }
        );
        
        if (isFollowing) {
          statusMap[u._id] = 'following';
          continue;
        }

        // If not following, check for pending request in notifications
        const notifResponse = await axiosInstance.get(
          `user/notifications/${u._id}`,
          { withCredentials: true }
        );
        const notifications = notifResponse.data.data.notifications;

        const pendingRequest = notifications.find(
          (notify: Notify) => 
            notify.sender._id === currentUserId && 
            notify.status === 'pending' &&
            notify.type === 'follow'
        );

        if (pendingRequest) {
          statusMap[u._id] = 'requested';
        } else {
          statusMap[u._id] = 'none';
        }
      } catch (err) {
        statusMap[u._id] = "none";
      }
    }

    setModalFollowStatus(statusMap);
  };

  const handleOpenModal = async (modalType: "followers" | "following") => {
    setActiveModal(modalType);
    const usersList = modalType === "followers" ? user.profile.followers : user.profile.following;
    await initModalFollowStatuses(usersList);
  };

  // Add these states at the top of your component

const [_comments, setComments] = useState<string[]>([]); // Local copy of comments

// Update fetchUserProfile to set comments for selectedPost if needed
useEffect(() => {
  if (selectedPost) {
    setComments(selectedPost.postComment || []);
  }
}, [selectedPost]);


const getSinglePost=async (postId: string) => {
    try {
      const res = await axiosInstance.get(`post/post/${postId}`, {
        withCredentials: true,
      });
      const postData = res.data.data
      console.log(postData);
      
      setSelectedPost({ ...postData, activeIndex: 0 });
     setShowPostModal(true)
    } catch {
      toast.error("Failed to load post details");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar onCollapseChange={() => {}} />

        {/* Main Content */}
        <main className="flex-1 ml-72">
          <div className="max-w-6xl mx-auto px-8 py-8">
            {/* Profile Header */}
            <section className="mb-12">
              <div className="flex items-start space-x-12 mb-8">
                {/* Profile Picture */}
                <div className="relative flex-shrink-0">
                  <img
                    src={
                      user.profile.profilePhoto ||
                      'https://res.cloudinary.com/dmarnah7d/image/upload/v1760940580/default_profile_tth4p1.jpg'
                    }
                    alt="Profile"
                    className="w-36 h-36 rounded-full object-cover border-4 border-gray-100"
                  />
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-6 mb-6">
                    <h1 className="text-2xl font-medium text-black">
                      {user?.profile.username}
                    </h1>
                    {!isOwnProfile && (
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={toggleFollow}
                          className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
                            followStatus === "following"
                              ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                              : followStatus === "requested"
                              ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                              : "bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
                          }`}
                        >
                          {followStatus === "following"
                            ? "Following"
                            : followStatus === "requested"
                            ? "Requested"
                            : "Follow"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center space-x-8 mb-4">
                    <div className="font-semibold text-gray-900">
                      {user?.totalPost}{" "}
                      <span className="text-gray-600 text-sm">posts</span>
                    </div>
                    <button
                      onClick={() =>canViewContent?handleOpenModal("followers"):''}
                      className="font-semibold text-gray-900 hover:underline"
                    >
                      {user?.profile.followers.length}{" "}
                      <span className="text-gray-600 text-sm">followers</span>
                    </button>
                    <button
                      onClick={() => canViewContent?handleOpenModal("following"):''}
                      className="font-semibold text-gray-900 hover:underline"
                    >
                      {user?.profile.following.length}{" "}
                      <span className="text-gray-600 text-sm">following</span>
                    </button>
                  </div>

                  {/* Bio */}
                  <div className="mt-4">
                    <div className="font-semibold text-gray-900">
                      {user?.profile.fullname}
                    </div>
                    <div className="text-gray-600">{user?.profile.bio}</div>
                  </div>
                </div>
              </div>
            </section>
  {!canViewContent? <div className=" border-t border-gray-300 w-full mx-auto mb-6 text-center py-16 col-span-3">

    <h3 className="text-xl font-semibold text-gray-900 mb-2">
      This account is private
    </h3>
    <p className="text-gray-600">
      Follow to see their photos and videos.
    </p>
  </div>:''}
            {/* Profile Navigation */}
           { canViewContent?<section className="border-t border-gray-200">
              <nav className="flex justify-center space-x-16 -mb-px">
               
              </nav>
            </section>:''}

           {/* Posts Grid */}
                    { canViewContent? <section className="mt-8">
                        {profileTab === 'posts' && (
                          <div className="grid grid-cols-3 gap-2">
  {user.posts?.length > 0 ? (
  user.posts.map((post) => (
    <div
      key={post._id}
      onClick={() => getSinglePost(post._id)}
      className="relative aspect-square bg-gray-100 cursor-pointer group overflow-hidden"
    >
      <img
        src={post.post[0]}
        alt="Post"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      {(post.likesCount || post.commentsCount) > 0 && (
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="flex items-center space-x-6 text-white">
            <div className="flex items-center space-x-2">
              <Heart size={20} className="fill-white" />
              <span className="font-semibold">{post.likesCount}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageCircle size={20} className="fill-white" />
              <span className="font-semibold">{post.commentsCount}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  ))
) : (
  <p>No posts yet</p>
)}


          
                          </div>
                        )}
          
                       
                      </section>:''}
          </div>
        </main>
      </div>

{ canViewContent && showPostModal && selectedPost &&  (
<PostModal
  post={selectedPost}
  onClose={() => setShowPostModal(false)}
  refresh={() => getSinglePost(selectedPost._id)}
  currentUserId={localStorage.getItem("userid")!}
  onUpdatePost={updatePostInGrid} 
/>

)}
      {/* Followers / Following Modal */}
      { canViewContent && activeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-96 rounded-lg shadow-lg overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-3 border-b">
              <h2 className="font-semibold text-lg">
                {activeModal === "followers" ? "Followers" : "Following"}
              </h2>
              <button onClick={() => setActiveModal(null)}>
                <X size={20} />
              </button>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {(activeModal === "followers"
                ? user.profile.followers
                : user.profile.following
              ).map((u: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={
                        u.profilePhoto ||
                        'https://res.cloudinary.com/dmarnah7d/image/upload/v1760940580/default_profile_tth4p1.jpg'
                      }
                      alt={u.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <span className="font-medium">{u.username}</span>
                  </div>
                  {localStorage.getItem("userid") === u._id ? (
                    <span className="text-sm text-gray-500">You</span>
                  ) : isOwnProfile && activeModal === "followers" ? (
                    // Show Remove button only for own profile's followers
                    <button
                      onClick={() => removeFollower(u._id)}
                      className="px-6 py-2 rounded-lg font-semibold transition-all duration-200 bg-gray-200 text-gray-900 hover:bg-gray-300"
                    >
                      Remove
                    </button>
                  ) : (
                    // Show Follow/Following/Requested for following list or other user's lists
                    <button
                      onClick={() => toggleFollowFromList(u._id)}
                      className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${
                        modalFollowStatus[u._id] === "following"
                          ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                          : modalFollowStatus[u._id] === "requested"
                          ? "bg-gray-200 text-gray-900 hover:bg-gray-300"
                          : "bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:from-orange-600 hover:to-pink-600"
                      }`}
                    >
                      {modalFollowStatus[u._id] === "following"
                        ? "Following"
                        : modalFollowStatus[u._id] === "requested"
                        ? "Requested"
                        : "Follow"}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;