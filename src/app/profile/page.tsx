"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useState, useEffect } from "react";
import { UserService } from "../../lib/userService";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

type TabType = "job-ads" | "bookings" | "messages" | "profile";

export default function ProfilePage() {
  const { user, error, isLoading } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>("job-ads");
  const [isEditing, setIsEditing] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    location: "",
    bio: "",
  });

  // Fetch user profile from Supabase
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.email) {
        try {
          const profile = await UserService.getUserByEmail(user.email);
          setUserProfile(profile);
          if (profile) {
            setEditForm({
              name: profile.name || user.name || "",
              email: profile.email || user.email || "",
              phone: profile.phone || "",
              location: profile.location || "",
              bio: profile.bio || "",
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  // Redirect to login if not authenticated
  if (!isLoading && !user) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header user={null} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">
              Please sign in to view your profile.
            </p>
            <a
              href="/api/auth/login"
              className="mt-4 inline-block bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors duration-200"
            >
              Sign In
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement profile update logic
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const tabs = [
    { id: "job-ads", label: "Job Ads", icon: "📋" },
    { id: "bookings", label: "Bookings", icon: "📅" },
    { id: "messages", label: "Messages", icon: "💬" },
    { id: "profile", label: "Profile", icon: "👤" },
  ] as const;

  const renderJobAdsTab = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-3xl font-bold text-gray-900">My Job Ads</h3>
            <p className="text-gray-600 mt-3 text-lg">
              Manage your childcare job postings
            </p>
          </div>
          <button className="bg-purple-600 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl text-lg">
            Create New Ad
          </button>
        </div>

        {/* Empty State - No Job Ads Yet */}
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl p-12 border border-purple-200 shadow-lg text-center">
          <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h4 className="text-2xl font-bold text-gray-900 mb-4">
            No Job Ads Yet
          </h4>
          <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
            Create your first job ad to find the perfect childcare provider for
            your family.
          </p>
          <button className="bg-purple-600 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl text-lg">
            Create Your First Ad
          </button>
        </div>
      </div>
    </div>
  );

  const renderBookingsTab = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-3xl font-bold text-gray-900">My Bookings</h3>
            <p className="text-gray-600 mt-3 text-lg">
              Manage your childcare appointments
            </p>
          </div>
          <div className="flex space-x-4">
            <button className="px-8 py-4 text-purple-600 border border-purple-600 rounded-2xl font-semibold hover:bg-purple-50 transition-all duration-200 text-lg">
              Upcoming
            </button>
            <button className="px-8 py-4 text-gray-600 border border-gray-300 rounded-2xl font-semibold hover:bg-gray-50 transition-all duration-200 text-lg">
              Past
            </button>
          </div>
        </div>

        {/* Empty State - No Bookings Yet */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-3xl p-12 text-center">
          <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h4 className="text-2xl font-bold text-gray-900 mb-4">
            No Bookings Yet
          </h4>
          <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
            Your upcoming childcare appointments will appear here once you make
            bookings.
          </p>
          <button className="bg-green-600 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl text-lg">
            Browse Nannies
          </button>
        </div>
      </div>
    </div>
  );

  const renderMessagesTab = () => (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-3xl font-bold text-gray-900">Messages</h3>
            <p className="text-gray-600 mt-3 text-lg">
              Communicate with your childcare providers
            </p>
          </div>
          <button className="bg-purple-600 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl text-lg">
            New Message
          </button>
        </div>

        {/* Empty State - No Messages Yet */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-12 text-center">
          <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h4 className="text-2xl font-bold text-gray-900 mb-4">
            No Messages Yet
          </h4>
          <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
            Your conversations with childcare providers will appear here once
            you start messaging.
          </p>
          <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl text-lg">
            Start Messaging
          </button>
        </div>
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 rounded-3xl p-12 text-white shadow-2xl">
        <div className="flex items-center space-x-10">
          <div className="w-40 h-40 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30">
            {user?.picture ? (
              <img
                src={user.picture}
                alt="Profile"
                className="w-36 h-36 rounded-full"
              />
            ) : (
              <svg
                className="w-20 h-20 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-5xl font-bold mb-4">{user?.name}</h2>
            <p className="text-purple-100 text-2xl mb-6">{user?.email}</p>
            <div className="flex items-center space-x-6">
              <span className="bg-white/20 px-6 py-3 rounded-full text-lg font-semibold border border-white/30">
                {user?.user_type === "parent" ? "Parent" : "Nanny"}
              </span>
              <span className="text-purple-100 text-lg">
                Member since{" "}
                {userProfile?.created_at
                  ? formatDate(userProfile.created_at)
                  : "Recently"}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-white/20 hover:bg-white/30 px-8 py-4 rounded-2xl font-semibold transition-all duration-200 border border-white/30 hover:border-white/50 text-lg"
          >
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>
      </div>

      {/* Profile Form */}
      {isEditing ? (
        <form
          onSubmit={handleEditSubmit}
          className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100"
        >
          <h3 className="text-3xl font-bold mb-10 text-gray-900">
            Edit Profile
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-4">
                Full Name
              </label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="w-full px-6 py-5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xl"
              />
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-4">
                Email
              </label>
              <input
                type="email"
                value={editForm.email}
                disabled
                className="w-full px-6 py-5 border border-gray-300 rounded-2xl bg-gray-50 text-gray-500 cursor-not-allowed text-xl"
              />
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-4">
                Phone Number
              </label>
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
                className="w-full px-6 py-5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xl"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-4">
                Location
              </label>
              <input
                type="text"
                value={editForm.location}
                onChange={(e) =>
                  setEditForm({ ...editForm, location: e.target.value })
                }
                className="w-full px-6 py-5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xl"
                placeholder="City, State"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-lg font-semibold text-gray-700 mb-4">
                Bio
              </label>
              <textarea
                value={editForm.bio}
                onChange={(e) =>
                  setEditForm({ ...editForm, bio: e.target.value })
                }
                rows={6}
                className="w-full px-6 py-5 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xl resize-none"
                placeholder="Tell us about yourself, your experience, and what you're looking for..."
              />
            </div>
          </div>
          <div className="flex justify-end space-x-6 mt-10">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-10 py-5 border border-gray-300 rounded-2xl font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200 text-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-10 py-5 bg-purple-600 text-white rounded-2xl font-semibold hover:bg-purple-700 transition-all duration-200 text-xl shadow-lg hover:shadow-xl"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100">
          <h3 className="text-3xl font-bold mb-10 text-gray-900">
            Profile Information
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <label className="block text-lg font-semibold text-gray-500 mb-3">
                Full Name
              </label>
              <p className="text-gray-900 font-semibold text-xl">
                {user?.name || "Not set"}
              </p>
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-500 mb-3">
                Email
              </label>
              <p className="text-gray-900 font-semibold text-xl">
                {user?.email}
              </p>
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-500 mb-3">
                Phone Number
              </label>
              <p className="text-gray-900 font-semibold text-xl">
                {editForm.phone || "Not set"}
              </p>
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-500 mb-3">
                Location
              </label>
              <p className="text-gray-900 font-semibold text-xl">
                {editForm.location || "Not set"}
              </p>
            </div>
            <div className="lg:col-span-2">
              <label className="block text-lg font-semibold text-gray-500 mb-3">
                Bio
              </label>
              <p className="text-gray-900 text-xl leading-relaxed">
                {editForm.bio || "No bio added yet."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Account Settings */}
      <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100">
        <h3 className="text-3xl font-bold mb-10 text-gray-900">
          Account Settings
        </h3>
        <div className="space-y-8">
          <div className="flex items-center justify-between p-8 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all duration-200">
            <div>
              <h4 className="font-semibold text-gray-900 text-xl">
                Email Notifications
              </h4>
              <p className="text-gray-600 mt-2 text-lg">
                Receive updates about bookings and messages
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-16 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-8 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-all duration-200">
            <div>
              <h4 className="font-semibold text-gray-900 text-xl">
                SMS Notifications
              </h4>
              <p className="text-gray-600 mt-2 text-lg">
                Get text messages for urgent updates
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-16 h-8 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-7 after:w-7 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "job-ads":
        return renderJobAdsTab();
      case "bookings":
        return renderBookingsTab();
      case "messages":
        return renderMessagesTab();
      case "profile":
        return renderProfileTab();
      default:
        return renderJobAdsTab();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header user={user} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header user={null} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600">Error: {error.message}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header user={user} />

      <main className="flex-1 px-4 py-16">
        <div className="max-w-8xl mx-auto">
          {/* Tab Navigation */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-4 mb-10">
            <div className="flex space-x-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-4 px-10 py-6 rounded-2xl font-semibold transition-all duration-300 text-xl ${
                    activeTab === tab.id
                      ? "bg-purple-600 text-white shadow-lg transform scale-105"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-2xl">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </div>
      </main>

      <Footer />
    </div>
  );
}
