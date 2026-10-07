CREATE TABLE "LiveChatConversation" (
    "id" TEXT NOT NULL,
    "userAccountSource" TEXT NOT NULL,
    "userAccountId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveChatConversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LiveChatMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderAccountId" TEXT NOT NULL,
    "senderRole" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LiveChatConversation_userAccountSource_userAccountId_status_updatedAt_idx"
ON "LiveChatConversation"("userAccountSource", "userAccountId", "status", "updatedAt");

CREATE INDEX "LiveChatConversation_status_updatedAt_idx"
ON "LiveChatConversation"("status", "updatedAt");

CREATE INDEX "LiveChatMessage_conversationId_createdAt_idx"
ON "LiveChatMessage"("conversationId", "createdAt");

ALTER TABLE "LiveChatMessage"
ADD CONSTRAINT "LiveChatMessage_conversationId_fkey"
FOREIGN KEY ("conversationId") REFERENCES "LiveChatConversation"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
