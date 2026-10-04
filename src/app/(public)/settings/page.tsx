"use client";

import UserAvatar from "@/components/ui/UserAvatar";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Edit2,
  Save,
  X,
  Lock,
  Bell,
  Shield,
  Globe,
  Loader2,
  Download,
} from "lucide-react";
import { getCurrentUser } from "@/services/auth";
import {
  sendFirebasePasswordReset,
  signOutFirebase,
} from "@/services/firebaseAuth";
import { showToast } from "@/components/ui/Toast";

type CurrentUser = {
  id: string;
  fullName: string;
  firstName?: string;
  email: string;
  phone?: string | null;
  photoURL?: string | null;
  provider?: string;
  dateOfBirth?: string;
  gender?: string;
};

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [passwordFormOpen, setPasswordFormOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [preferences, setPreferences] = useState({
    language: "English",
    currency: "NGN",
    timeZone: "WAT",
  });
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
        const [currentUser, accountResponse] = await Promise.all([
          getCurrentUser(),
          fetch("/api/account", {
            credentials: "same-origin",
            cache: "no-store",
          }),
        ]);
        if (!mounted) return;
        if (!currentUser || !accountResponse.ok) {
          router.replace("/login?from=settings");
          return;
        }
        const accountData = await accountResponse.json();
        const account = accountData.user as CurrentUser & {
          dateOfBirth: string;
          gender: string;
          notificationPreferences: typeof notifications;
          language: string;
          currency: string;
          timeZone: string;
        };
        setUser(account);
        const fullName = account.fullName || "";
        const [firstName = "", ...rest] = fullName.split(" ");
        const lastName = rest.join(" ");
        setProfile({
          firstName: firstName,
          lastName,
          email: account.email,
          phone: account.phone || "",
          dateOfBirth: account.dateOfBirth || "",
          gender: account.gender || "Prefer not to say",
        });
        setNotifications(account.notificationPreferences);
        setPreferences({
          language: account.language,
          currency: account.currency,
          timeZone: account.timeZone,
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
      setSaving(true);
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          dateOfBirth: profile.dateOfBirth,
          gender: profile.gender,
        }),
      });

      if (response.ok) {
        const { user: updatedUser } = await response.json();
        setUser((current) =>
          current ? { ...current, fullName: updatedUser.fullName, phone: updatedUser.phone } : current
        );
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
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const fullName = user?.fullName || "";
    const [firstName = "", ...rest] = fullName.split(" ");
    setProfile((current) => ({
      ...current,
      firstName,
      lastName: rest.join(" "),
      phone: user?.phone || "",
      dateOfBirth: user?.dateOfBirth || "",
      gender: user?.gender || "Prefer not to say",
    }));
    setIsEditing(false);
  };

  const saveNotificationPreferences = async (next: typeof notifications) => {
    setNotifications(next);
    setSavingPreferences(true);
    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ notificationPreferences: next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save notification settings.");
      showToast("Notification preferences saved.", "success", "right");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to save notification settings.",
        "error",
        "right"
      );
    } finally {
      setSavingPreferences(false);
    }
  };

  const savePreferences = async () => {
    setSavingPreferences(true);
    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(preferences),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save preferences.");
      showToast("Preferences saved.", "success", "right");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to save preferences.",
        "error",
        "right"
      );
    } finally {
      setSavingPreferences(false);
    }
  };

  const updatePassword = async () => {
    try {
      const response = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to update password.");
      setCurrentPassword("");
      setNewPassword("");
      setPasswordFormOpen(false);
      showToast("Password updated successfully.", "success", "right");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to update password.", "error", "right");
    }
  };

  const sendPasswordReset = async () => {
    try {
      if (!user?.email) throw new Error("Your account email is unavailable.");
      await sendFirebasePasswordReset(user.email);
      showToast("Password reset instructions have been emailed to you.", "success", "right");
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : "Unable to send password reset email.",
        "error",
        "right"
      );
    }
  };

  const exportAccountData = async () => {
    try {
      const response = await fetch("/api/account?export=true", {
        credentials: "same-origin",
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to export account data.");
      const pdf = new jsPDF();
      const margin = 18;
      const pageHeight = pdf.internal.pageSize.getHeight();
      const textWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      let y = margin;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text("Dunnis Stores - Account Data", margin, y);
      y += 9;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(`Exported: ${new Date().toLocaleString()}`, margin, y);
      y += 8;
      pdf.setFont("courier", "normal");
      pdf.setFontSize(8);

      for (const line of JSON.stringify(data, null, 2).split("\n")) {
        const wrappedLines = pdf.splitTextToSize(line || " ", textWidth);
        for (const wrappedLine of wrappedLines) {
          if (y > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(wrappedLine, margin, y);
          y += 4;
        }
      }

      pdf.save("dunnis-account-data.pdf");
      showToast("Your account data has been downloaded.", "success", "right");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to export account data.", "error", "right");
    }
  };

  const deleteAccount = async () => {
    if (
      !window.confirm(
        "Permanently delete your account? Your saved addresses and profile will be removed. Existing order records will be retained without your account link."
      )
    ) {
      return;
    }
    setDeleting(true);
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to delete account.");
      await signOutFirebase();
      router.replace("/");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Unable to delete account.", "error", "right");
      setDeleting(false);
    }
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
                        disabled={saving}
                        className="flex items-center justify-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm sm:text-base font-semibold hover:bg-green-700 transition-all"
                      >
                        <Save className="w-4 h-4" />
                        <span>{saving ? "Saving..." : "Save"}</span>
                      </button>
                    </div>
                  )}
                </div>

                {}
                <div className="flex flex-col sm:flex-row items-center sm:gap-6 mb-8 pb-8 border-b border-gray-200 gap-4">
                  <div className="relative shrink-0">
                    <UserAvatar
                      src={user?.photoURL}
                      alt={userFullName}
                      width={96}
                      height={96}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-gray-200"
                    />
                  </div>
                  <div className="text-center sm:text-left flex-1 min-w-0">
                    <h3 className="text-sm sm:text-lg font-bold text-gray-900">
                      {userFullName}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      {profile.email}
                    </p>
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
                        disabled
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
                    {user.provider === "database" ? (
                      <>
                        <p className="text-xs sm:text-sm text-gray-600 mb-4">
                          Choose a new password for your account.
                        </p>
                        {passwordFormOpen ? (
                          <div className="space-y-3">
                            <input
                              type="password"
                              autoComplete="current-password"
                              placeholder="Current password"
                              value={currentPassword}
                              onChange={(event) => setCurrentPassword(event.target.value)}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2"
                            />
                            <input
                              type="password"
                              autoComplete="new-password"
                              placeholder="New password (at least 8 characters)"
                              value={newPassword}
                              onChange={(event) => setNewPassword(event.target.value)}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2"
                            />
                            <button
                              type="button"
                              onClick={() => void updatePassword()}
                              className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-purple-700"
                            >
                              Save new password
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPasswordFormOpen(true)}
                            className="bg-purple-600 text-white px-4 sm:px-6 py-2 text-sm sm:text-base rounded-lg font-semibold hover:bg-purple-700 transition-all"
                          >
                            Change Password
                          </button>
                        )}
                      </>
                    ) : user.provider === "firebase-email" ? (
                      <>
                        <p className="text-xs sm:text-sm text-gray-600 mb-4">
                          We’ll email a secure password-reset link to {user.email}.
                        </p>
                        <button
                          type="button"
                          onClick={() => void sendPasswordReset()}
                          className="bg-purple-600 text-white px-4 sm:px-6 py-2 text-sm sm:text-base rounded-lg font-semibold hover:bg-purple-700 transition-all"
                        >
                          Send password reset email
                        </button>
                      </>
                    ) : (
                      <p className="text-xs sm:text-sm text-gray-600">
                        Your password is managed by your sign-in provider.
                      </p>
                    )}
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
                          void saveNotificationPreferences({
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
                          void saveNotificationPreferences({
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
                          void saveNotificationPreferences({
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
                        Save your preference for future text alerts. SMS delivery is not currently enabled.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-2 shrink-0">
                      <input
                        type="checkbox"
                        checked={notifications.smsNotifications}
                        onChange={(e) =>
                          void saveNotificationPreferences({
                            ...notifications,
                            smsNotifications: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 sm:w-14 sm:h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 sm:after:h-6 after:w-5 sm:after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  {savingPreferences && (
                    <p className="mt-3 text-xs text-gray-500">Saving preferences...</p>
                  )}
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
                    <a
                      href="/privacy"
                      className="text-purple-600 hover:text-purple-700 text-sm sm:text-base font-semibold"
                    >
                      View Privacy Policy →
                    </a>
                  </div>

                  <div className="border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                      Download Your Data
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-4">
                      Request a copy of your personal data
                    </p>
                    <button
                      type="button"
                      onClick={() => void exportAccountData()}
                      className="inline-flex items-center gap-2 border-2 border-purple-600 text-purple-600 px-4 sm:px-6 py-2 text-sm sm:text-base rounded-lg font-semibold hover:bg-purple-50 transition-all"
                    >
                      <Download className="h-4 w-4" />
                      Download Data
                    </button>
                  </div>

                  <div className="border border-red-200 rounded-lg sm:rounded-xl p-4 sm:p-6 bg-red-50">
                    <h3 className="text-base sm:text-lg font-semibold text-red-900 mb-2">
                      Delete Account
                    </h3>
                    <p className="text-xs sm:text-sm text-red-700 mb-4">
                      Delete your profile and saved addresses. Order records are retained for store records with personal details removed.
                    </p>
                    <button
                      type="button"
                      onClick={() => void deleteAccount()}
                      disabled={deleting}
                      className="bg-red-600 text-white px-4 sm:px-6 py-2 text-sm sm:text-base rounded-lg font-semibold hover:bg-red-700 disabled:opacity-60 transition-all"
                    >
                      {deleting ? "Deleting..." : "Delete Account"}
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
                    <select
                      value={preferences.language}
                      onChange={(event) => setPreferences({ ...preferences, language: event.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                    >
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
                    <select
                      value={preferences.currency}
                      onChange={(event) => setPreferences({ ...preferences, currency: event.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                    >
                      <option value="NGN">NGN (₦)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                      Time Zone
                    </label>
                    <select
                      value={preferences.timeZone}
                      onChange={(event) => setPreferences({ ...preferences, timeZone: event.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl text-sm sm:text-base focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                    >
                      <option value="WAT">WAT (West Africa Time)</option>
                      <option value="GMT">GMT (Greenwich Mean Time)</option>
                      <option value="EST">EST (Eastern Standard Time)</option>
                      <option value="PST">PST (Pacific Standard Time)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => void savePreferences()}
                    disabled={savingPreferences}
                    className="w-full bg-purple-600 text-white py-2 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-60 transition-all"
                  >
                    {savingPreferences ? "Saving..." : "Save Preferences"}
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
