import LiveChatWorkspace from "@/components/chat/LiveChatWorkspace";

export default function AdminLiveChatPage() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex shrink-0 items-center gap-2 px-3 py-2 sm:px-4">
        <h1 className="text-base font-bold text-gray-900 sm:text-lg">
          Live chat
        </h1>
        <p className="truncate text-xs text-gray-500">
          Reply to customer conversations in real time.
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <LiveChatWorkspace role="admin" />
      </div>
    </div>
  );
}
