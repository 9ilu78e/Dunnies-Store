import LiveChatWorkspace from "@/components/chat/LiveChatWorkspace";

export default function AdminLiveChatPage() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="mb-3 shrink-0 px-3 pt-3 sm:px-5 sm:pt-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-600">
          Customer support
        </p>
        <h1 className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">
          Live chat
        </h1>
        <p className="mt-1 text-xs text-gray-600">
          Reply to customer conversations in real time.
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <LiveChatWorkspace role="admin" />
      </div>
    </div>
  );
}
