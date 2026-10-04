"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const EmailUsersContent = dynamic(() => import("./EmailUsersContent"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
    </div>
  ),
});

export default function EmailUsersClient() {
  return <EmailUsersContent />;
}
