import LiveChatWorkspace from "@/components/chat/LiveChatWorkspace";

export default function UserLiveChatPage() {
  return (
    <section className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-[#faf8fc]">
      <LiveChatWorkspace role="user" />
    </section>
  );
}
