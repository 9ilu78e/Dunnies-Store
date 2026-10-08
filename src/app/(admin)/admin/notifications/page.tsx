import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import NotificationList from "@/components/notification/NotificationList";

export default function AdminNotificationsPage() {
  return (
    <div className="min-h-screen bg-[#faf8fa] px-3 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-center gap-3 sm:mb-7">
          <Link
            href="/dashboard"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#eee7ed] transition hover:text-purple-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-600">
              Admin dashboard
            </p>
            <h1 className="mt-0.5 text-2xl font-bold text-gray-900 sm:text-3xl">
              Admin Notifications
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Stay up to date with important store activity and updates.
            </p>
          </div>
        </div>
        <div className="rounded-[24px] border border-[#eee7ed] bg-white p-3 shadow-sm sm:p-6">
          <NotificationList role="admin" />
        </div>
      </div>
    </div>
  );
}
