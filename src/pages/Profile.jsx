import React, { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaSignOutAlt } from "react-icons/fa";
import { Navbar } from "../components";

const STRAPI_URL = "https://campuskatale-fwih.onrender.com";

function Profile() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("ads");
  const [userListings, setUserListings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Default placeholders (fallback)
  const defaultUser = {
    name: "CampusKatale User",
    email: "user@example.com",
    avatar: "https://via.placeholder.com/150",
    stats: { ads: 0, sells: 0, buys: 0 },
    about: "Welcome to CampusKatale! Complete your profile to get started.",
  };

  // Fetch user's listings when component mounts or user changes
  useEffect(() => {
    const fetchUserListings = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Fetch products where seller/clerkUserId matches current user
        // Adjust the filter based on your Strapi schema
        const response = await fetch(
          `${STRAPI_URL}/api/products?filters[clerkUserId][$eq]=${user.id}&populate=*`
        );
        
        if (!response.ok) throw new Error("Failed to fetch listings");
        
        const data = await response.json();
        setUserListings(data.data || []);
      } catch (error) {
        console.error("Error fetching user listings:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserListings();
    }
  }, [user]);

  const currentUser = user
    ? {
        name: user.fullName || user.firstName || defaultUser.name,
        email: user.primaryEmailAddress?.emailAddress || defaultUser.email,
        avatar: user.imageUrl || defaultUser.avatar,
        stats: {
          ...defaultUser.stats,
          ads: userListings.length, // Update ads count with actual listings
        },
        about: defaultUser.about,
      }
    : defaultUser;

  const tabs = [
    { key: "ads", label: "Ads Posted" },
    { key: "sells", label: "Sales Made" },
    { key: "buys", label: "Purchases Made" },
  ];

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    
    try {
      const response = await fetch(`${STRAPI_URL}/api/products/${listingId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error("Failed to delete listing");
      
      // Refresh listings after deletion
      setUserListings((prev) => prev.filter((listing) => listing.id !== listingId));
      alert("Listing deleted successfully!");
    } catch (error) {
      console.error("Error deleting listing:", error);
      alert("Failed to delete listing");
    }
  };

  const handleEditListing = (listingId) => {
    navigate(`/edit-listing/${listingId}`);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex justify-center py-12 px-4 font-[Lexend]">
      <Navbar />
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-lg p-8 mt-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-12">
          <div className="relative">
            <img
              src={currentUser.avatar}
              alt="Profile"
              className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#177529]"
            />
            <button className="absolute bottom-0 right-0 bg-[#97C040] p-2 rounded-full shadow-md hover:bg-[#F8C810] transition-all">
              <FaEdit className="text-white" />
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-2">
            <h1 className="text-3xl font-bold text-[#0C0D19]">
              {currentUser.name}
            </h1>
            <p className="text-gray-600">{currentUser.email}</p>
            <p className="text-[#177529] font-medium">Verified User</p>

            <div className="mt-4 flex gap-4">
              <button
                className="px-4 py-2 bg-[#177529] text-white rounded-xl hover:brightness-110 transition-all flex items-center gap-2"
                onClick={() => navigate("/")}
              >
                Back to Home
              </button>

              <button
                className="px-4 py-2 border border-[#177529] text-[#177529] rounded-xl hover:bg-[#177529] hover:text-white transition-all flex items-center gap-2"
                onClick={() => signOut(() => navigate("/"))}
              >
                <FaSignOutAlt /> Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
          {Object.entries(currentUser.stats).map(([key, value]) => (
            <div
              key={key}
              className="bg-[#F9FAFB] rounded-xl shadow p-6 text-center"
            >
              <p className="text-2xl font-bold text-[#177529]">{value}</p>
              <p className="text-gray-600 capitalize">{key}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mt-10">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                className={`py-2 px-6 font-semibold transition-all ${
                  activeTab === tab.key
                    ? "text-[#177529] border-b-4 border-[#177529]"
                    : "text-gray-500 hover:text-[#177529]"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-6 min-h-[120px] text-gray-600">
            {activeTab === "ads" && (
              <div className="space-y-4">
                <p>You have posted {userListings.length} ad(s).</p>

                {loading ? (
                  <p className="text-gray-500">Loading your listings...</p>
                ) : userListings.length > 0 ? (
                  <div className="space-y-3">
                    {userListings.map((listing) => (
                      <div
                        key={listing.id}
                        className="border rounded-lg p-4 flex justify-between items-center bg-gray-50"
                      >
                        <div>
                          <h3 className="font-semibold">{listing.attributes.title}</h3>
                          <p className="text-sm text-gray-600">
                            Price: UGX {listing.attributes.price}
                          </p>
                          <p className="text-xs text-gray-500">
                            Posted: {new Date(listing.attributes.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditListing(listing.id)}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteListing(listing.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">You haven't posted any ads yet.</p>
                )}

                <button
                  onClick={() => navigate("/add-listing")}
                  className="px-5 py-2 bg-[#177529] text-white rounded-lg font-semibold hover:bg-[#135c21] transition"
                >
                  + Post New Ad
                </button>
              </div>
            )}

            {activeTab === "sells" &&
              `You have completed ${currentUser.stats.sells} sales.`}

            {activeTab === "buys" &&
              `You have made ${currentUser.stats.buys} purchases.`}
          </div>
        </div>

        {/* About */}
        <div className="mt-10">
          <h2 className="text-xl font-semibold text-[#0C0D19] mb-4">
            About Me
          </h2>
          <p className="text-gray-600">{currentUser.about}</p>
        </div>
      </div>
    </div>
  );
}

export default Profile;