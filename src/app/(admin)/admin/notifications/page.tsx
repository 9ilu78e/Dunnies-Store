import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NotificationList from "@/components/notification/NotificationList";

export default function AdminNotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200 hover:text-purple-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-sm font-medium text-purple-600">Admin dashboard</p>
            <h1 className="bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-4xl font-bold text-transparent">
              Admin Notifications
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Stay up to date with important store activity and updates.
            </p>
          </div>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <NotificationList role="admin" />
        </div>
      </div>
    </div>
  );
}
