import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NotificationList from "@/components/notification/NotificationList";

export default function UserNotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-gray-200 hover:text-purple-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-sm font-medium text-purple-600">My account</p>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          </div>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <NotificationList role="user" />
        </div>
      </div>
    </div>
  );
}
