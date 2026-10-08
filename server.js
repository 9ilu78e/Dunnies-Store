const http = require("node:http");
const next = require("next");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const { WebSocket, WebSocketServer } = require("ws");
const { getLiveChatReply } = require("./src/lib/liveChatAutoResponses.js");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "0.0.0.0";
const port = Number.parseInt(process.env.PORT || "3000", 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const prisma = new PrismaClient();
const webSocketServer = new WebSocketServer({
  noServer: true,
  maxPayload: 16 * 1024,
});
const clients = new Map();
const voiceNotePrefix = "dunnies-voice-note:";
const imageMessagePrefix = "dunnies-image:";

function getCloudinaryAttachment(body, prefix) {
  if (!body.startsWith(prefix)) return null;
  try {
    const attachment = JSON.parse(body.slice(prefix.length));
    const url = new URL(attachment.url);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") {
      return null;
    }
    return attachment;
  } catch {
    return null;
  }
}

function isValidVoiceNoteBody(body) {
  const voiceNote = getCloudinaryAttachment(body, voiceNotePrefix);
  return !!(
    voiceNote &&
      Number.isInteger(voiceNote.durationSeconds) &&
      voiceNote.durationSeconds >= 1 &&
    voiceNote.durationSeconds <= 120
  );
}

function isValidImageBody(body) {
  return !!getCloudinaryAttachment(body, imageMessagePrefix);
}

function hasAdminJoinedConversation(conversationId) {
  for (const client of clients.values()) {
    if (
      client.role === "admin" &&
      client.conversations.has(conversationId)
    ) {
      return true;
    }
  }
  return false;
}

async function notifyChatParticipants(conversation, client, body) {
  try {
    const attachmentType = body.startsWith(voiceNotePrefix)
      ? "voice note"
      : body.startsWith(imageMessagePrefix)
      ? "image"
      : null;
    const preview = attachmentType
      ? `sent a ${attachmentType}`
      : body.slice(0, 120);

    if (client.role === "user") {
      const [users, firebaseUsers] = await Promise.all([
        prisma.user.findMany({
          where: { role: { equals: "admin", mode: "insensitive" } },
          select: { id: true },
        }),
        prisma.firebaseUser.findMany({
          where: { role: { equals: "admin", mode: "insensitive" } },
          select: { uid: true },
        }),
      ]);
      const adminIds = new Set([
        ...users.map((user) => user.id),
        ...firebaseUsers.map((user) => user.uid),
      ]);
      if (adminIds.size > 0) {
        await prisma.notification.createMany({
          data: Array.from(adminIds, (accountId) => ({
            recipientRole: "admin",
            accountId,
            title: "New live chat message",
            message: `${client.name || "A customer"} ${preview}.`,
            link: "/admin/live-chat",
          })),
        });
      }
      return;
    }

    await prisma.notification.create({
      data: {
        recipientRole: "user",
        accountId: conversation.userAccountId,
        title: "New reply in live chat",
        message: `Support replied: ${preview}`,
        link: "/live-chat",
      },
    });
  } catch (error) {
    console.error("[LIVE_CHAT_NOTIFICATION]", error);
  }
}

function send(socket, payload) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

function sendError(socket, message) {
  send(socket, { type: "error", message });
}

function broadcastToAdmins(payload) {
  for (const [socket, client] of clients) {
    if (client.role === "admin" && client.watchingInbox) send(socket, payload);
  }
}

function broadcastToConversation(conversationId, payload) {
  for (const [socket, client] of clients) {
    if (client.conversations.has(conversationId)) send(socket, payload);
  }
}

function broadcastTyping(conversationId, senderRole, payload) {
  for (const [socket, client] of clients) {
    if (
      client.role !== senderRole &&
      client.conversations.has(conversationId)
    ) {
      send(socket, payload);
    }
  }
}

async function authenticateTicket(ticket) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Chat authentication is not configured.");

  const claims = jwt.verify(ticket, secret, {
    audience: "dunnies-live-chat",
    issuer: "dunnies-store",
  });
  if (
    typeof claims === "string" ||
    claims.purpose !== "live-chat" ||
    typeof claims.accountId !== "string" ||
    (claims.accountSource !== "user" &&
      claims.accountSource !== "firebaseUser")
  ) {
    throw new Error("Invalid chat ticket.");
  }

  const account =
    claims.accountSource === "user"
      ? await prisma.user.findUnique({
          where: { id: claims.accountId },
          select: { id: true, fullName: true, email: true, role: true },
        }).then((user) =>
          user
            ? {
                id: user.id,
                name: user.fullName,
                email: user.email,
                role: user.role,
              }
            : null
        )
      : await prisma.firebaseUser.findUnique({
          where: { uid: claims.accountId },
          select: { uid: true, name: true, email: true, role: true },
        }).then((user) =>
          user
            ? {
                id: user.uid,
                name: user.name,
                email: user.email,
                role: user.role,
              }
            : null
        );

  if (!account) throw new Error("Chat account was not found.");
  const role = account.role.toLowerCase() === "admin" ? "admin" : "user";
  return {
    accountId: account.id,
    accountSource: claims.accountSource,
    name: role === "admin" ? "Admin" : account.name,
    email: account.email,
    role,
    conversations: new Set(),
    watchingInbox: false,
  };
}

async function handleClientMessage(socket, client, raw) {
  let packet;
  try {
    packet = JSON.parse(raw.toString());
  } catch {
    sendError(socket, "Invalid message format.");
    return;
  }

  if (!packet || typeof packet.type !== "string") {
    sendError(socket, "A message type is required.");
    return;
  }

  if (packet.type === "watch_inbox") {
    if (client.role !== "admin") {
      sendError(socket, "Admin access is required for the inbox.");
      return;
    }
    client.watchingInbox = true;
    send(socket, { type: "inbox_ready" });
    return;
  }

  if (packet.type === "join") {
    if (typeof packet.conversationId !== "string") {
      sendError(socket, "A conversation ID is required.");
      return;
    }
    const conversation = await prisma.liveChatConversation.findUnique({
      where: { id: packet.conversationId },
      select: {
        id: true,
        userAccountId: true,
        userAccountSource: true,
        status: true,
      },
    });
    if (!conversation) {
      sendError(socket, "Conversation not found.");
      return;
    }
    if (
      client.role !== "admin" &&
      (conversation.userAccountId !== client.accountId ||
        conversation.userAccountSource !== client.accountSource)
    ) {
      sendError(socket, "Access to this conversation is denied.");
      return;
    }

    client.conversations.add(conversation.id);
    send(socket, { type: "joined", conversationId: conversation.id });
    if (client.role === "user") {
      broadcastToAdmins({
        type: "conversation_updated",
        conversationId: conversation.id,
      });
    }
    return;
  }

  if (packet.type === "message") {
    const conversationId =
      typeof packet.conversationId === "string" ? packet.conversationId : "";
    const body = typeof packet.body === "string" ? packet.body.trim() : "";
    if (!conversationId || !client.conversations.has(conversationId)) {
      sendError(socket, "Join this conversation before sending a message.");
      return;
    }
    if (!body || body.length > 4000) {
      sendError(socket, "Messages must be between 1 and 4,000 characters.");
      return;
    }
    const isVoiceNote = body.startsWith(voiceNotePrefix);
    const isImageMessage = body.startsWith(imageMessagePrefix);
    if (
      (isVoiceNote && !isValidVoiceNoteBody(body)) ||
      (isImageMessage && !isValidImageBody(body))
    ) {
      sendError(
        socket,
        isImageMessage
          ? "This image attachment is invalid. Please choose it again."
          : "This voice note is invalid. Please record it again."
      );
      return;
    }

    const conversation = await prisma.liveChatConversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        userAccountId: true,
        userAccountSource: true,
        status: true,
      },
    });
    if (
      !conversation ||
      (client.role !== "admin" &&
        (conversation.userAccountId !== client.accountId ||
          conversation.userAccountSource !== client.accountSource))
    ) {
      sendError(socket, "Access to this conversation is denied.");
      return;
    }
    if (conversation.status !== "open") {
      sendError(socket, "This conversation is closed.");
      return;
    }

    const [message] = await prisma.$transaction([
      prisma.liveChatMessage.create({
        data: {
          conversationId,
          senderAccountId: client.accountId,
          senderRole: client.role,
          senderName: client.role === "admin" ? "Admin" : client.name,
          body,
        },
      }),
      prisma.liveChatConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);
    broadcastToConversation(conversationId, { type: "message", message });
    await notifyChatParticipants(conversation, client, body);
    if (client.role === "user") {
      const existingAdminReply = await prisma.liveChatMessage.findFirst({
        where: { conversationId, senderRole: "admin" },
        select: { id: true },
      });
      if (!existingAdminReply && !hasAdminJoinedConversation(conversationId)) {
        const assistantMessage = await prisma.liveChatMessage.create({
          data: {
            conversationId,
            senderAccountId: "assistant",
            senderRole: "assistant",
            senderName: "Dunnis Assistant",
            body: isVoiceNote
              ? "Thanks for the voice note. Our support team will listen and reply here soon."
              : isImageMessage
              ? "Thanks for sharing the image. Our support team will review it and reply here soon."
              : getLiveChatReply(body),
          },
        });
        broadcastToConversation(conversationId, {
          type: "message",
          message: assistantMessage,
        });
      }
    }
    broadcastToAdmins({
      type: "conversation_updated",
      conversationId,
    });
    return;
  }

  if (packet.type === "typing") {
    const conversationId =
      typeof packet.conversationId === "string" ? packet.conversationId : "";
    if (
      !conversationId ||
      !client.conversations.has(conversationId) ||
      typeof packet.isTyping !== "boolean"
    ) {
      sendError(socket, "Join this conversation before sending typing updates.");
      return;
    }

    broadcastTyping(conversationId, client.role, {
      type: "typing",
      conversationId,
      senderRole: client.role,
      senderName: client.role === "admin" ? "Admin" : client.name,
      isTyping: packet.isTyping,
    });
    return;
  }

  if (packet.type === "close_conversation") {
    if (client.role !== "admin" || typeof packet.conversationId !== "string") {
      sendError(socket, "Admin access is required to close conversations.");
      return;
    }
    const conversation = await prisma.liveChatConversation.update({
      where: { id: packet.conversationId },
      data: { status: "closed" },
      select: { id: true, status: true },
    });
    const payload = {
      type: "conversation_status",
      conversationId: conversation.id,
      status: conversation.status,
    };
    broadcastToConversation(conversation.id, payload);
    broadcastToAdmins({
      type: "conversation_updated",
      conversationId: conversation.id,
    });
    return;
  }

  sendError(socket, "Unsupported chat action.");
}

app
  .prepare()
  .then(() => {
    const server = http.createServer((request, response) => {
      handle(request, response);
    });

    server.on("upgrade", async (request, socket, head) => {
      let requestUrl;
      try {
        requestUrl = new URL(request.url || "/", `http://${request.headers.host}`);
      } catch {
        socket.destroy();
        return;
      }
      if (requestUrl.pathname !== "/ws/live-chat") return;

      const origin = request.headers.origin;
      let originHost = null;
      try {
        originHost = origin ? new URL(origin).host : null;
      } catch {
        originHost = null;
      }
      if (!originHost || originHost !== request.headers.host) {
        socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
        socket.destroy();
        return;
      }

      try {
        const client = await authenticateTicket(
          requestUrl.searchParams.get("ticket") || ""
        );
        webSocketServer.handleUpgrade(request, socket, head, (webSocket) => {
          clients.set(webSocket, client);
          webSocketServer.emit("connection", webSocket, request);
        });
      } catch {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
      }
    });

    webSocketServer.on("connection", (socket) => {
      const client = clients.get(socket);
      if (!client) {
        socket.close(1008, "Authentication required");
        return;
      }

      socket.on("message", (raw) => {
        void handleClientMessage(socket, client, raw).catch((error) => {
          console.error("[LIVE_CHAT_WEBSOCKET_MESSAGE]", error);
          sendError(socket, "Unable to process that chat action.");
        });
      });
      socket.on("close", () => clients.delete(socket));
      socket.on("error", (error) => {
        console.error("[LIVE_CHAT_WEBSOCKET]", error);
        clients.delete(socket);
      });
    });

    server.listen(port, hostname, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });

    const shutdown = () => {
      for (const socket of clients.keys()) socket.close(1001, "Server shutting down");
      server.close(() => {
        void prisma.$disconnect().finally(() => process.exit(0));
      });
    };
    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  })
  .catch((error) => {
    console.error("Unable to start the Dunnis Store server:", error);
    process.exit(1);
  });
