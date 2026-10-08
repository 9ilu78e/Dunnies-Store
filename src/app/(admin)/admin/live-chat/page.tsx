import LiveChatWorkspace from "@/components/chat/LiveChatWorkspace";

export default function AdminLiveChatPage() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <LiveChatWorkspace role="admin" />
    </div>
  );
}
