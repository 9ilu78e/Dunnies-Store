"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Edit2,
  Camera,
  Save,
  X,
  Lock,
  Bell,
  Shield,
  Globe,
  Loader2,
} from "lucide-react";
import { getCurrentUser } from "@/services/auth";
import { showToast } from "@/components/ui/Toast";

type CurrentUser = {
  id: string;
  fullName: string;
  firstName?: string;
  email: string;
  phone?: string | null;
};

const getAvatarUrl = (fullName?: string, email?: string) => {
  if (email) {
    return `https://unavatar.io/${encodeURIComponent(email)}`;
  }
  if (fullName) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      fullName
    )}&background=8b5cf6&color=fff`;
  }
  return "https://ui-avatars.com/api/?name=Dunnis+Stores&background=8b5cf6&color=fff";
};

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "Prefer not to say",
  });

  useEffect(() => {
    let mounted = true;
    const fetchUser = async () => {
      setLoading(true);
      try {
        const currentUser = await getCurrentUser();
        if (!mounted) return;
        if (!currentUser) {
          router.replace("/login?from=settings");
          return;
        }
        setUser(currentUser);
        const fullName = currentUser.fullName || "";
        const [firstName = "", ...rest] = fullName.split(" ");
        const lastName = rest.join(" ");
        setProfile({
          firstName: currentUser.firstName || firstName,
          lastName,
          email: currentUser.email,
          phone: currentUser.phone || "",
          dateOfBirth: "",
          gender: "Prefer not to say",
        });
      } catch (error) {
        if (mounted) {
          router.replace("/login?from=settings");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    fetchUser();
    return () => {
      mounted = false;
    };
  }, [router]);

  const avatar = useMemo(
    () => getAvatarUrl(user?.fullName, user?.email),
    [user?.fullName, user?.email]
  );

  const userFullName =
    [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
    user?.fullName ||
    "User";

  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: true,
    newsletter: false,
    smsNotifications: true,
  });

  const sections = [
    { id: "profile", label: "Profile Information", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Shield },
    { id: "preferences", label: "Preferences", icon: Globe },
  ];

  const handleSave = async () => {
    try {
      const userId = localStorage.getItem("userId");

      if (!userId) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          dateOfBirth: profile.dateOfBirth,
          gender: profile.gender,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        setIsEditing(false);
        showToast("Profile updated successfully!", "success", "right");
      } else {
        const error = await response.json();
        showToast(
          `Failed to update profile: ${error.error || "Unknown error"}`,
          "error",
          "right"
        );
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      showToast("Error saving profile", "error", "right");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (loading) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading your settings...</span>
        </div>
      </section>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
            Account Settings
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-2 sm:p-4 overflow-x-auto lg:overflow-visible">
              <nav className="flex lg:flex-col gap-1 lg:space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`flex items-center gap-2 lg:gap-3 px-2 sm:px-3 lg:px-4 py-2 sm:py-3 rounded-lg lg:rounded-xl transition-all whitespace-nowrap lg:whitespace-normal shrink-0 lg:shrink ${
                        activeSection === section.id
                          ? "bg-purple-50 text-purple-600 font-semibold"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-xs sm:text-sm">
                        {section.label}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {}
          <div className="lg:col-span-3">
            {}
            {activeSection === "profile" && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-6">
                  <h2 className="text-base sm:text-xl font-bold text-gray-900">
                    Profile Information
                  </h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-purple-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-semibold hover:bg-purple-700 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleCancel}
                        className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-300 transition-all"
                      >
                        <X className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                      <button
                        onClick={handleSave}
                        className="flex items-center justify-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-semibold hover:bg-green-700 transition-all"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                    </div>
                  )}
                </div>

                {}
                <div className="flex flex-col sm:flex-row items-center sm:gap-6 mb-8 pb-8 border-b border-gray-200 gap-4">
                  <div className="relative shrink-0">
                    <Image
                      src={avatar}
                      alt={userFullName}
                      width={96}
                      height={96}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-gray-200"
                      referrerPolicy="no-referrer"
                    />
                    {isEditing && (
                      <button className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 transition-all">
                        <Camera className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="text-center sm:text-left flex-1 min-w-0">
                    <h3 className="text-sm sm:text-lg font-bold text-gray-900">
                      {userFullName}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {profile.email}
                    </p>
                    {isEditing && (
                      <button className="mt-2 text-xs sm:text-sm text-purple-600 hover:text-purple-700 font-semibold">
                        Change Profile Picture
                      </button>
                    )}
                  </div>
                </div>

                {}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      First Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={profile.firstName}
                        onChange={(e) =>
                          setProfile({ ...profile, firstName: e.target.value })
                        }
                        disabled={!isEditing}
                        className={`w-full pl-11 pr-4 py-3 border rounded-xl ${
                          isEditing
                            ? "border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                            : "border-gray-200 bg-gray-50"
                        } focus:outline-none transition-all`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={profile.lastName}
                        onChange={(e) =>
                          setProfile({ ...profile, lastName: e.target.value })
                        }
                        disabled={!isEditing}
                        className={`w-full pl-11 pr-4 py-3 border rounded-xl ${
                          isEditing
                            ? "border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                            : "border-gray-200 bg-gray-50"
                        } focus:outline-none transition-all`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) =>
                          setProfile({ ...profile, email: e.target.value })
                        }
                        disabled={!isEditing}
                        className={`w-full pl-11 pr-4 py-3 border rounded-xl ${
                          isEditing
                            ? "border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                            : "border-gray-200 bg-gray-50"
                        } focus:outline-none transition-all`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) =>
                          setProfile({ ...profile, phone: e.target.value })
                        }
                        disabled={!isEditing}
                        className={`w-full pl-11 pr-4 py-3 border rounded-xl ${
                          isEditing
                            ? "border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                            : "border-gray-200 bg-gray-50"
                        } focus:outline-none transition-all`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={profile.dateOfBirth}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            dateOfBirth: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        className={`w-full pl-11 pr-4 py-3 border rounded-xl ${
                          isEditing
                            ? "border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                            : "border-gray-200 bg-gray-50"
                        } focus:outline-none transition-all`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      value={profile.gender}
                      onChange={(e) =>
                        setProfile({ ...profile, gender: e.target.value })
                      }
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 border rounded-xl ${
                        isEditing
                          ? "border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                          : "border-gray-200 bg-gray-50"
                      } focus:outline-none transition-all`}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">
                        Prefer not to say
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {}
            {activeSection === "security" && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-6">
                  Security Settings
                </h2>

                <div className="space-y-4 sm:space-y-6">
                  <div className="border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                      Password
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-4">
                      Last changed 3 months ago
                    </p>
                    <button className="bg-purple-600 text-white px-4 sm:px-6 py-2 text-sm sm:text-base rounded-lg font-semibold hover:bg-purple-700 transition-all">
                      Change Password
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                      Two-Factor Authentication
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-4">
                      Add an extra layer of security to your account
                    </p>
                    <button className="bg-green-600 text-white px-4 sm:px-6 py-2 text-sm sm:text-base rounded-lg font-semibold hover:bg-green-700 transition-all">
                      Enable 2FA
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                      Active Sessions
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-4">
                      Manage devices where you're currently logged in
                    </p>
                    <button className="border-2 border-gray-300 text-gray-700 px-4 sm:px-6 py-2 text-sm sm:text-base rounded-lg font-semibold hover:bg-gray-50 transition-all">
                      View Sessions
                    </button>
                  </div>
                </div>
              </div>
            )}

            {}
            {activeSection === "notifications" && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-6">
                  Notification Preferences
                </h2>

                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl">
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                        Order Updates
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Get notified about your order status
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-2 shrink-0">
                      <input
                        type="checkbox"
                        checked={notifications.orderUpdates}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            orderUpdates: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 sm:w-14 sm:h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 sm:after:h-6 after:w-5 sm:after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl">
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                        Promotions & Offers
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Receive exclusive deals and discounts
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-2 shrink-0">
                      <input
                        type="checkbox"
                        checked={notifications.promotions}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            promotions: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 sm:w-14 sm:h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 sm:after:h-6 after:w-5 sm:after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl">
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                        Newsletter
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Weekly updates and tips
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-2 shrink-0">
                      <input
                        type="checkbox"
                        checked={notifications.newsletter}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            newsletter: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 sm:w-14 sm:h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 sm:after:h-6 after:w-5 sm:after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg sm:rounded-xl">
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                        SMS Notifications
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Receive text messages for important updates
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-2 shrink-0">
                      <input
                        type="checkbox"
                        checked={notifications.smsNotifications}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            smsNotifications: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 sm:w-14 sm:h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 sm:after:h-6 after:w-5 sm:after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {}
            {activeSection === "privacy" && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-6">
                  Privacy Settings
                </h2>

                <div className="space-y-4 sm:space-y-6">
                  <div className="border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                      Data Privacy
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-4">
                      Manage how your data is collected and used
                    </p>
                    <button className="text-purple-600 hover:text-purple-700 text-sm sm:text-base font-semibold">
                      View Privacy Policy →
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                      Download Your Data
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-4">
                      Request a copy of your personal data
                    </p>
                    <button className="border-2 border-purple-600 text-purple-600 px-4 sm:px-6 py-2 text-sm sm:text-base rounded-lg font-semibold hover:bg-purple-50 transition-all">
                      Request Data
                    </button>
                  </div>

                  <div className="border border-red-200 rounded-lg sm:rounded-xl p-4 sm:p-6 bg-red-50">
                    <h3 className="text-base sm:text-lg font-semibold text-red-900 mb-2">
                      Delete Account
                    </h3>
                    <p className="text-xs sm:text-sm text-red-700 mb-4">
                      Permanently delete your account and all data
                    </p>
                    <button className="bg-red-600 text-white px-4 sm:px-6 py-2 text-sm sm:text-base rounded-lg font-semibold hover:bg-red-700 transition-all">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}

            {}
            {activeSection === "preferences" && (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-6">
                  Preferences
                </h2>

                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                      Language
                    </label>
                    <select className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none">
                      <option>English</option>
                      <option>Spanish</option>
                      <option>French</option>
                      <option>German</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                      Currency
                    </label>
                    <select className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none">
                      <option>USD ($)</option>
                      <option>NGN (₦)</option>
                      <option>EUR (€)</option>
                      <option>GBP (£)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                      Time Zone
                    </label>
                    <select className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none">
                      <option>WAT (West Africa Time)</option>
                      <option>GMT (Greenwich Mean Time)</option>
                      <option>EST (Eastern Standard Time)</option>
                      <option>PST (Pacific Standard Time)</option>
                    </select>
                  </div>

                  <button className="w-full bg-purple-600 text-white py-2 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl font-semibold hover:bg-purple-700 transition-all">
                    Save Preferences
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
