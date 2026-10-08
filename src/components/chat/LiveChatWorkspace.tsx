"use client";

import {
  type ChangeEvent,
  FormEvent,
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  Headphones,
  ImagePlus,
  LoaderCircle,
  MessageCircle,
  Mic,
  RotateCw,
  Send,
  Square,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

type ChatRole = "user" | "admin";
type MessageRole = ChatRole | "assistant";

type ChatMessage = {
  id: string;
  conversationId: string;
  senderAccountId: string;
  senderRole: MessageRole;
  senderName: string;
  body: string;
  createdAt: string;
};

type ChatConversation = {
  id: string;
  userAccountId: string;
  userName: string;
  userEmail: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
};

type VoiceNoteDraft = {
  blob: Blob;
  previewUrl: string;
  durationSeconds: number;
  uploadedUrl?: string;
};

type VoiceNoteMessage = {
  url: string | null;
  durationSeconds: number;
};

type ImageMessageDraft = {
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
};

type Props = {
  role: ChatRole;
};

const GROUP_WINDOW_MS = 5 * 60 * 1000;
const VOICE_NOTE_PREFIX = "dunnies-voice-note:";
const IMAGE_MESSAGE_PREFIX = "dunnies-image:";
const MAX_VOICE_NOTE_SECONDS = 120;
const MAX_CHAT_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300";

const readJson = async (response: Response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Unable to load live chat.");
  }
  return data;
};

const sameDay = (a: string, b: string) =>
  new Date(a).toDateString() === new Date(b).toDateString();

const sameGroup = (a?: ChatMessage, b?: ChatMessage) =>
  !!a &&
  !!b &&
  a.senderAccountId === b.senderAccountId &&
  a.senderRole === b.senderRole &&
  sameDay(a.createdAt, b.createdAt) &&
  Math.abs(new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) <
    GROUP_WINDOW_MS;

const formatDay = (iso: string) => {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
};

const formatVoiceDuration = (totalSeconds: number) =>
  `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(
    2,
    "0"
  )}`;

const parseVoiceNote = (body: string): VoiceNoteMessage | null => {
  if (!body.startsWith(VOICE_NOTE_PREFIX)) return null;
  try {
    const parsed = JSON.parse(body.slice(VOICE_NOTE_PREFIX.length));
    const url = new URL(parsed.url);
    if (
      url.protocol === "https:" &&
      url.hostname === "res.cloudinary.com" &&
      Number.isInteger(parsed.durationSeconds) &&
      parsed.durationSeconds >= 1 &&
      parsed.durationSeconds <= MAX_VOICE_NOTE_SECONDS
    ) {
      return { url: url.href, durationSeconds: parsed.durationSeconds };
    }
  } catch {
    return { url: null, durationSeconds: 0 };
  }
  return { url: null, durationSeconds: 0 };
};

const parseImageMessage = (body: string): string | null | undefined => {
  if (!body.startsWith(IMAGE_MESSAGE_PREFIX)) return undefined;
  try {
    const parsed = JSON.parse(body.slice(IMAGE_MESSAGE_PREFIX.length));
    const url = new URL(parsed.url);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com"
      ? url.href
      : null;
  } catch {
    return null;
  }
};

export default function LiveChatWorkspace({ role }: Props) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [typingName, setTypingName] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isRequestingMicrophone, setIsRequestingMicrophone] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceNoteDraft, setVoiceNoteDraft] =
    useState<VoiceNoteDraft | null>(null);
  const [imageMessageDraft, setImageMessageDraft] =
    useState<ImageMessageDraft | null>(null);
  const [isUploadingVoice, setIsUploadingVoice] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [connectionState, setConnectionState] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<(() => Promise<void>) | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const discardRecordingRef = useRef(false);
  const mountedRef = useRef(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remoteTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const isTypingRef = useRef(false);

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      discardRecordingRef.current = true;
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    const previewUrl = voiceNoteDraft?.previewUrl;
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [voiceNoteDraft?.previewUrl]);

  useEffect(() => {
    const previewUrl = imageMessageDraft?.previewUrl;
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [imageMessageDraft?.previewUrl]);

  const loadConversations = useCallback(async () => {
    const response = await fetch("/api/chat/conversations", {
      credentials: "same-origin",
      cache: "no-store",
    });
    const data = await readJson(response);
    const loaded = data.conversations as ChatConversation[];
    setConversations(loaded);
    return loaded;
  }, []);

  useEffect(() => {
    let active = true;
    let connecting = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const initialize = async () => {
      try {
        setLoading(true);
        setError("");

        let initialConversations = await loadConversations();
        if (role === "user" && initialConversations.length === 0) {
          const response = await fetch("/api/chat/conversations", {
            method: "POST",
            credentials: "same-origin",
          });
          const data = await readJson(response);
          initialConversations = [data.conversation];
          setConversations(initialConversations);
        }
        if (!active) return;

        const preferredConversation =
          initialConversations.find(
            (conversation) => conversation.status === "open"
          ) || initialConversations[0];
        if (preferredConversation) setSelectedId(preferredConversation.id);

        const connect = async () => {
          if (!active || connecting) return;
          connecting = true;
          setConnectionState("connecting");
          try {
            const sessionResponse = await fetch("/api/chat/session", {
              method: "POST",
              credentials: "same-origin",
            });
            const { ticket } = await readJson(sessionResponse);
            if (!active) return;

            const protocol =
              window.location.protocol === "https:" ? "wss:" : "ws:";
            const socket = new WebSocket(
              `${protocol}//${
                window.location.host
              }/ws/live-chat?ticket=${encodeURIComponent(ticket)}`
            );
            socketRef.current = socket;

            socket.onopen = () => {
              connecting = false;
              if (!active) {
                socket.close();
                return;
              }
              setError("");
              setConnectionState("connected");
              if (role === "admin") {
                socket.send(JSON.stringify({ type: "watch_inbox" }));
              }
              const currentConversationId = selectedIdRef.current;
              if (currentConversationId) {
                socket.send(
                  JSON.stringify({
                    type: "join",
                    conversationId: currentConversationId,
                  })
                );
              }
            };

            socket.onmessage = (event) => {
              let packet: {
                type?: string;
                message?: ChatMessage | string;
                conversationId?: string;
                status?: string;
                senderRole?: ChatRole;
                senderName?: string;
                isTyping?: boolean;
              };
              try {
                packet = JSON.parse(event.data as string);
              } catch {
                setError("Received an invalid live chat update.");
                return;
              }

              if (
                packet.type === "message" &&
                packet.message &&
                typeof packet.message === "object"
              ) {
                const receivedMessage = packet.message;
                setMessages((current) =>
                  current.some((item) => item.id === receivedMessage.id)
                    ? current
                    : [...current, receivedMessage]
                );
                void loadConversations().catch((loadError: unknown) => {
                  setError(
                    loadError instanceof Error
                      ? loadError.message
                      : "Unable to refresh conversations."
                  );
                });
              } else if (              packet.type === "typing" &&
              packet.conversationId === selectedIdRef.current &&
              packet.senderRole !== role
              ) {
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
              }
              if (remoteTypingTimeoutRef.current) {
                clearTimeout(remoteTypingTimeoutRef.current);
                remoteTypingTimeoutRef.current = null;
              }
              setTypingName(
                packet.isTyping
                  ? packet.senderRole === "admin"
                    ? "Admin"
                    : packet.senderName || "Someone"
                  : null
              );
              if (packet.isTyping) {
                remoteTypingTimeoutRef.current = setTimeout(
                  () => {
                    setTypingName(null);
                    remoteTypingTimeoutRef.current = null;
                  },
                  3000
                );
              }
              } else if (
              packet.type === "conversation_updated") {
                void loadConversations().catch((loadError: unknown) => {
                  setError(
                    loadError instanceof Error
                      ? loadError.message
                      : "Unable to refresh conversations."
                  );
                });
                if (role === "admin") {
                  window.dispatchEvent(
                    new Event("dunnis:notifications-changed")
                  );
                }
              } else if (
                packet.type === "conversation_status" &&
                packet.conversationId &&
                packet.status
              ) {
                setConversations((current) =>
                  current.map((conversation) =>
                    conversation.id === packet.conversationId
                      ? { ...conversation, status: packet.status as string }
                      : conversation
                  )
                );
              } else if (
                packet.type === "error" &&
                typeof packet.message === "string"
              ) {
                setError(packet.message);
              }
            };

            socket.onclose = () => {
              connecting = false;
              if (active) {
                setConnectionState("disconnected");
                setTypingName(null);
                isTypingRef.current = false;
                reconnectTimer = setTimeout(() => void connect(), 2000);
              }
            };
            socket.onerror = () => {
              if (active) {
                setError("Live chat connection interrupted. Reconnecting...");
              }
              socket.close();
            };
          } catch (connectionError) {
            connecting = false;
            const message =
              connectionError instanceof Error
                ? connectionError.message
                : "Unable to connect to live chat.";
            if (active) {
              setError(message);
              if (!message.toLowerCase().includes("log in")) {
                reconnectTimer = setTimeout(() => void connect(), 5000);
              }
            }
          }
        };
        reconnectRef.current = connect;

        void connect();
      } catch (initializationError) {
        if (!active) return;
        setError(
          initializationError instanceof Error
            ? initializationError.message
            : "Unable to start live chat."
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void initialize();
    return () => {
      active = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (remoteTypingTimeoutRef.current) {
        clearTimeout(remoteTypingTimeoutRef.current);
      }
      reconnectRef.current = null;
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [loadConversations, role]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      setTypingName(null);
      return;
    }

    let active = true;
    setMessages([]);
    setTypingName(null);
    isTypingRef.current = false;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (remoteTypingTimeoutRef.current) {
      clearTimeout(remoteTypingTimeoutRef.current);
      remoteTypingTimeoutRef.current = null;
    }
    const loadMessages = async () => {
      try {
        const response = await fetch(
          `/api/chat/conversations/${encodeURIComponent(selectedId)}/messages`,
          { credentials: "same-origin", cache: "no-store" }
        );
        const data = await readJson(response);
        if (active) setMessages(data.messages);
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load chat messages."
          );
        }
      }
    };
    void loadMessages();

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({ type: "join", conversationId: selectedId })
      );
    }

    return () => {
      active = false;
    };
  }, [selectedId]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }
  }, [messages]);

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedId) ||
    null;
  const visibleMessages = messages.filter(
    (message) => message.senderRole !== "assistant"
  );
  const composerDisabled =
    !selectedConversation || selectedConversation.status !== "open";

  const sendTypingStatus = (isTyping: boolean) => {
    const socket = socketRef.current;
    if (
      !selectedId ||
      !socket ||
      socket.readyState !== WebSocket.OPEN ||
      isTypingRef.current === isTyping
    ) {
      return;
    }
    isTypingRef.current = isTyping;
    socket.send(
      JSON.stringify({
        type: "typing",
        conversationId: selectedId,
        isTyping,
      })
    );
  };

  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    sendTypingStatus(false);
  };

  const clearRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const startVoiceRecording = async () => {
    const conversationId = selectedId;
    if (
      composerDisabled ||
      !conversationId ||
      connectionState !== "connected" ||
      isRequestingMicrophone ||
      isUploadingVoice ||
      draft.trim()
    ) {
      return;
    }
    if (
      typeof MediaRecorder === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError("Voice recording is not supported in this browser.");
      return;
    }

    setIsRequestingMicrophone(true);
    try {
      setError("");
      setVoiceNoteDraft(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mountedRef.current || selectedIdRef.current !== conversationId) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      mediaStreamRef.current = stream;

      const preferredTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/mp4",
      ];
      const mimeType = preferredTypes.find((type) =>
        MediaRecorder.isTypeSupported(type)
      );
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recordingChunksRef.current = [];
      recordingStartedAtRef.current = Date.now();
      discardRecordingRef.current = false;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        discardRecordingRef.current = true;
        if (mountedRef.current) {
          setError("Recording stopped unexpectedly. Please try again.");
        }
        if (recorder.state === "recording") recorder.stop();
      };
      recorder.onstop = () => {
        clearRecordingTimer();
        const startedAt = recordingStartedAtRef.current;
        const durationSeconds = Math.min(
          MAX_VOICE_NOTE_SECONDS,
          Math.max(1, Math.round((Date.now() - (startedAt || Date.now())) / 1000))
        );
        const blob = new Blob(recordingChunksRef.current, {
          type: recorder.mimeType || recordingChunksRef.current[0]?.type,
        });
        const keepRecording =
          !discardRecordingRef.current && mountedRef.current;
        recordingChunksRef.current = [];
        recordingStartedAtRef.current = null;
        if (mediaRecorderRef.current === recorder) {
          mediaRecorderRef.current = null;
        }
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        discardRecordingRef.current = false;

        if (!mountedRef.current) return;
        setIsRecordingVoice(false);
        if (!keepRecording) {
          setRecordingSeconds(0);
          return;
        }
        if (blob.size === 0) {
          setRecordingSeconds(0);
          setError("No audio was recorded. Please try again.");
          return;
        }
        if (blob.size > MAX_CHAT_ATTACHMENT_SIZE) {
          setRecordingSeconds(0);
          setError("This voice note is too large. Please record a shorter one.");
          return;
        }
        setError("");
        setRecordingSeconds(durationSeconds);
        setVoiceNoteDraft({
          blob,
          previewUrl: URL.createObjectURL(blob),
          durationSeconds,
        });
      };

      recorder.start(250);
      setIsRecordingVoice(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        const startedAt = recordingStartedAtRef.current;
        if (!startedAt) return;
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        setRecordingSeconds(elapsed);
        if (elapsed >= MAX_VOICE_NOTE_SECONDS) {
          clearRecordingTimer();
          if (recorder.state === "recording") recorder.stop();
        }
      }, 250);
    } catch (recordingError) {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      mediaRecorderRef.current = null;
      if (!mountedRef.current) return;
      setIsRecordingVoice(false);
      const errorName =
        recordingError instanceof DOMException ? recordingError.name : "";
      setError(
        errorName === "NotAllowedError" || errorName === "SecurityError"
          ? "Allow microphone access in your browser to record a voice note."
          : errorName === "NotFoundError"
          ? "No microphone was found. Connect a microphone and try again."
          : recordingError instanceof Error
          ? recordingError.message
          : "Unable to start voice recording."
      );
    } finally {
      if (mountedRef.current) setIsRequestingMicrophone(false);
    }
  };

  const stopVoiceRecording = () => {
    clearRecordingTimer();
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelVoiceRecording = () => {
    discardRecordingRef.current = true;
    clearRecordingTimer();
    setVoiceNoteDraft(null);
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    } else {
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      setIsRecordingVoice(false);
      setRecordingSeconds(0);
    }
  };

  const sendVoiceNote = async () => {
    const voiceNote = voiceNoteDraft;
    const conversationId = selectedId;
    const socket = socketRef.current;
    if (
      !voiceNote ||
      !conversationId ||
      composerDisabled ||
      !socket ||
      socket.readyState !== WebSocket.OPEN
    ) {
      setError("Reconnect to the chat before sending your voice note.");
      return;
    }

    const mimeType = voiceNote.blob.type.split(";")[0].toLowerCase();
    const extension =
      mimeType === "audio/ogg"
        ? "ogg"
        : mimeType === "audio/mp4" || mimeType === "audio/x-m4a"
        ? "m4a"
        : mimeType === "audio/mpeg"
        ? "mp3"
        : mimeType === "audio/wav"
        ? "wav"
        : mimeType === "audio/aac"
        ? "aac"
        : "webm";

    try {
      setIsUploadingVoice(true);
      setError("");
      let uploadedUrl = voiceNote.uploadedUrl;
      if (!uploadedUrl) {
        const formData = new FormData();
        formData.append(
          "file",
          new File([voiceNote.blob], `voice-note.${extension}`, {
            type: voiceNote.blob.type || "audio/webm",
          })
        );
        formData.append("conversationId", conversationId);

        const response = await fetch("/api/chat/upload", {
          method: "POST",
          credentials: "same-origin",
          body: formData,
        });
        const data = await readJson(response);
        if (typeof data.url !== "string") {
          throw new Error("The uploaded voice note did not return an audio URL.");
        }
        uploadedUrl = data.url;
      }
      if (typeof uploadedUrl !== "string") {
        throw new Error("The uploaded voice note URL is missing.");
      }
      const audioUrl = new URL(uploadedUrl);
      if (
        audioUrl.protocol !== "https:" ||
        audioUrl.hostname !== "res.cloudinary.com"
      ) {
        throw new Error("The uploaded voice note URL is not valid.");
      }
      if (!voiceNote.uploadedUrl) {
        setVoiceNoteDraft({ ...voiceNote, uploadedUrl: audioUrl.href });
      }
      const activeSocket = socketRef.current;
      if (
        selectedIdRef.current !== conversationId ||
        !activeSocket ||
        activeSocket.readyState !== WebSocket.OPEN
      ) {
        throw new Error(
          "The chat connection changed before the voice note could be sent. Please try again."
        );
      }

      stopTyping();
      activeSocket.send(
        JSON.stringify({
          type: "message",
          conversationId,
          body: `${VOICE_NOTE_PREFIX}${JSON.stringify({
            url: audioUrl.href,
            durationSeconds: voiceNote.durationSeconds,
          })}`,
        })
      );
      setVoiceNoteDraft(null);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to send this voice note."
      );
    } finally {
      setIsUploadingVoice(false);
    }
  };

  const selectImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const supportedTypes = new Set([
      "image/avif",
      "image/gif",
      "image/jpeg",
      "image/png",
      "image/webp",
    ]);
    if (!supportedTypes.has(file.type.toLowerCase())) {
      setError("Choose a JPG, PNG, GIF, WebP, or AVIF image.");
      return;
    }
    if (file.size > MAX_CHAT_ATTACHMENT_SIZE) {
      setError("Images must be 10MB or smaller.");
      return;
    }
    setError("");
    setVoiceNoteDraft(null);
    setImageMessageDraft({
      file,
      previewUrl: URL.createObjectURL(file),
    });
  };

  const cancelImageMessage = () => {
    if (isUploadingImage) return;
    setImageMessageDraft(null);
  };

  const sendImageMessage = async () => {
    const imageDraft = imageMessageDraft;
    const conversationId = selectedId;
    const socket = socketRef.current;
    if (
      !imageDraft ||
      !conversationId ||
      composerDisabled ||
      !socket ||
      socket.readyState !== WebSocket.OPEN
    ) {
      setError("Reconnect to the chat before sending this image.");
      return;
    }

    try {
      setIsUploadingImage(true);
      setError("");
      let uploadedUrl = imageDraft.uploadedUrl;
      if (!uploadedUrl) {
        const formData = new FormData();
        formData.append("file", imageDraft.file);
        formData.append("conversationId", conversationId);
        const response = await fetch("/api/chat/upload", {
          method: "POST",
          credentials: "same-origin",
          body: formData,
        });
        const data = await readJson(response);
        if (data.kind !== "image" || typeof data.url !== "string") {
          throw new Error("The uploaded image did not return a valid image URL.");
        }
        uploadedUrl = data.url;
      }

      if (typeof uploadedUrl !== "string") {
        throw new Error("The uploaded image URL is missing.");
      }
      const imageUrl = new URL(uploadedUrl);
      if (
        imageUrl.protocol !== "https:" ||
        imageUrl.hostname !== "res.cloudinary.com"
      ) {
        throw new Error("The uploaded image URL is not valid.");
      }
      if (!imageDraft.uploadedUrl) {
        setImageMessageDraft({ ...imageDraft, uploadedUrl: imageUrl.href });
      }

      const activeSocket = socketRef.current;
      if (
        selectedIdRef.current !== conversationId ||
        !activeSocket ||
        activeSocket.readyState !== WebSocket.OPEN
      ) {
        throw new Error(
          "The chat connection changed before the image could be sent. Please try again."
        );
      }

      stopTyping();
      activeSocket.send(
        JSON.stringify({
          type: "message",
          conversationId,
          body: `${IMAGE_MESSAGE_PREFIX}${JSON.stringify({
            url: imageUrl.href,
          })}`,
        })
      );
      setImageMessageDraft(null);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Unable to send this image."
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const body = draft.trim();
    const socket = socketRef.current;
    if (
      !body ||
      !selectedId ||
      !socket ||
      socket.readyState !== WebSocket.OPEN
    ) {
      return;
    }
    if (body.length > 4000) {
      setError("Messages can be up to 4,000 characters.");
      return;
    }
    setError("");
    stopTyping();
    socket.send(
      JSON.stringify({ type: "message", conversationId: selectedId, body })
    );
    setDraft("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const startNewConversation = async () => {
    try {
      setBusy(true);
      setError("");
      const response = await fetch("/api/chat/conversations", {
        method: "POST",
        credentials: "same-origin",
      });
      const data = await readJson(response);
      setConversations((current) => [
        data.conversation,
        ...current.filter((item) => item.id !== data.conversation.id),
      ]);
      setSelectedId(data.conversation.id);
    } catch (startError) {
      setError(
        startError instanceof Error
          ? startError.message
          : "Unable to start a new conversation."
      );
    } finally {
      setBusy(false);
    }
  };

  const closeConversation = () => {
    const socket = socketRef.current;
    if (!selectedId || !socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(
      JSON.stringify({ type: "close_conversation", conversationId: selectedId })
    );
  };

  if (loading) {
    return (
      <div
        role="status"
        className={`flex w-full items-center justify-center gap-2 px-4 text-center text-sm text-gray-500 ${
          role === "user" ? "min-h-0 flex-1" : "min-h-64 sm:min-h-80"
        }`}
      >
        <LoaderCircle className="h-5 w-5 shrink-0 animate-spin text-purple-600" />
        Connecting to live chat...
      </div>
    );
  }

  if (error.includes("log in") || error.includes("Unauthorized")) {
    return (
      <div
        className={`mx-auto flex w-full max-w-lg flex-col items-center justify-center rounded-2xl border border-purple-100 bg-white p-4 text-center shadow-sm sm:rounded-3xl sm:p-8 ${
          role === "user" ? "min-h-0 flex-1" : ""
        }`}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-600 sm:h-14 sm:w-14">
          <UserRound className="h-6 w-6 sm:h-7 sm:w-7" />
        </span>
        <h2 className="mt-4 text-lg font-bold text-gray-900 sm:text-xl">
          Log in to chat with our team
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Sign in to start a private conversation and see your previous
          messages.
        </p>
        <Link
          href="/login"
          className={`mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 min-[420px]:w-auto ${focusRing}`}
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Customer header */}
      {role === "user" && (
        <header className="flex w-full min-w-0 shrink-0 items-center justify-between gap-3 border-b border-purple-100 bg-white px-3 py-3 shadow-sm sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-md shadow-purple-200 sm:h-11 sm:w-11">
              <Headphones className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-gray-900 sm:text-lg">
                Dunnis Support
              </h1>
              <p className="truncate text-xs text-gray-500">
                Live chat with our team
              </p>
            </div>
          </div>
          {connectionState === "disconnected" ? (
            <button
              type="button"
              onClick={() => void reconnectRef.current?.()}
              aria-label="Reconnect to live chat"
              className="inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              <RotateCw className="h-3.5 w-3.5" />
              Reconnect
            </button>
          ) : (
            <span
              role="status"
              aria-live="polite"
              className={`inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                connectionState === "connected"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {connectionState === "connecting" ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              )}
              {connectionState === "connected" ? "Connected" : "Reconnecting"}
            </span>
          )}
        </header>
      )}

      <section className="flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col overflow-hidden bg-white">
        {/* Admin header */}
        {role === "admin" && (
          <header className="flex shrink-0 items-center gap-2 border-b border-gray-100 px-3 py-2 sm:px-4">
            <label htmlFor="admin-chat-customer" className="sr-only">
              Choose a conversation
            </label>
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <select
                id="admin-chat-customer"
                value={selectedId || ""}
                onChange={(event) => setSelectedId(event.target.value || null)}
                disabled={
                  conversations.length === 0 ||
                  isRecordingVoice ||
                  isRequestingMicrophone ||
                  Boolean(voiceNoteDraft) ||
                  isUploadingVoice ||
                  Boolean(imageMessageDraft) ||
                  isUploadingImage
                }
                className="min-h-9 w-full appearance-none truncate rounded-lg border border-gray-200 bg-white py-1.5 pl-3 pr-9 text-sm text-gray-700 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 disabled:bg-gray-50"
              >
                <option value="" disabled>
                  {conversations.length
                    ? "Select a conversation"
                    : "No chats yet"}
                </option>
                {conversations.map((conversation) => (
                  <option key={conversation.id} value={conversation.id}>
                    {conversation.userName || conversation.userEmail || "Customer"} ·{" "}
                    {conversation.status}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            {connectionState === "disconnected" && (
              <button
                type="button"
                onClick={() => void reconnectRef.current?.()}
                aria-label="Reconnect to live chat"
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-red-200 text-red-700 hover:bg-red-50 ${focusRing}`}
              >
                <RotateCw className="h-4 w-4" />
              </button>
            )}
            {selectedConversation?.status === "open" && (
              <button
                type="button"
                onClick={closeConversation}
                aria-label="Close chat"
                title="Close chat"
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 ${focusRing}`}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </header>
        )}

        {/* Messages */}
        <div
          ref={messagesContainerRef}
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
          className="chat-scrollbar flex min-h-0 flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-[#fcfbfd] p-2.5 sm:p-5 lg:px-8"
        >
          {!selectedConversation ? (
            <div className="m-auto max-w-sm px-2 text-center">
              <MessageCircle className="mx-auto h-9 w-9 text-purple-300 sm:h-10 sm:w-10" />
              <p className="mt-3 font-semibold text-gray-800">
                Choose a conversation
              </p>
              <p className="mt-1 text-sm text-gray-500">
                New customer chats will appear in your inbox here.
              </p>
            </div>
          ) : visibleMessages.length === 0 ? (
            <div className="m-auto w-full max-w-md text-center">
              {role === "admin" ? (
                <div className="px-2">
                  <MessageCircle className="mx-auto h-9 w-9 text-purple-300 sm:h-10 sm:w-10" />
                  <p className="mt-3 font-semibold text-gray-800">
                    Start the conversation
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Reply here and the customer will receive your message
                    instantly.
                  </p>
                </div>
              ) : (
                <div className="px-3 text-sm text-gray-500">
                  Send a message to start chatting with our team.
                </div>
              )}
            </div>
          ) : (
            visibleMessages.map((message, index) => {
              const previous = visibleMessages[index - 1];
              const next = visibleMessages[index + 1];
              const ownMessage = message.senderRole === role;
              const voiceNote = parseVoiceNote(message.body);
              const imageUrl = parseImageMessage(message.body);
              const displaySenderName =
                message.senderRole === "admin" ? "Admin" : message.senderName;
              const startsGroup = !sameGroup(previous, message);
              const endsGroup = !sameGroup(message, next);
              const startsDay =
                !previous || !sameDay(previous.createdAt, message.createdAt);
              return (
                <Fragment key={message.id}>
                  {startsDay && (
                    <div className="my-2 flex items-center gap-3 text-[11px] font-medium text-gray-400">
                      <span className="h-px flex-1 bg-gray-100" />
                      <span>{formatDay(message.createdAt)}</span>
                      <span className="h-px flex-1 bg-gray-100" />
                    </div>
                  )}
                  <div
                    className={`flex min-w-0 ${
                      ownMessage ? "justify-end" : "justify-start"
                    } ${startsGroup && !startsDay ? "mt-2 sm:mt-3" : ""}`}
                  >
                    <div
                      className={`min-w-0 max-w-[88%] rounded-2xl px-3.5 py-2 sm:max-w-[75%] lg:max-w-[65%] ${
                        ownMessage
                          ? `bg-purple-600 text-white ${
                              endsGroup ? "rounded-br-md" : ""
                            }`
                          : `border border-gray-100 bg-white text-gray-800 shadow-sm ${
                              endsGroup ? "rounded-bl-md" : ""
                            }`
                      }`}
                    >
                      {startsGroup && (
                        <p
                          className={`mb-0.5 truncate text-[10px] font-semibold ${
                            ownMessage ? "text-purple-100" : "text-purple-700"
                          }`}
                        >
                          {displaySenderName}
                        </p>
                      )}
                      {voiceNote ? (
                        <div className="min-w-0">
                          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
                            <Mic className="h-3.5 w-3.5" />
                            Voice note ·{" "}
                            {formatVoiceDuration(voiceNote.durationSeconds)}
                          </p>
                          {voiceNote.url ? (
                            <audio
                              controls
                              preload="metadata"
                              aria-label="Play voice note"
                              className="h-9 w-[min(16rem,65vw)] max-w-full"
                              src={voiceNote.url}
                            />
                          ) : (
                            <p className="text-xs opacity-80">
                              This voice note is unavailable.
                            </p>
                          )}
                        </div>
                      ) : imageUrl !== undefined ? (
                        imageUrl ? (
                          <a
                            href={imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Open shared image"
                          >
                            <img
                              src={imageUrl}
                              alt="Image shared in chat"
                              loading="lazy"
                              className="max-h-72 max-w-full rounded-xl object-contain"
                            />
                          </a>
                        ) : (
                          <p className="text-xs opacity-80">
                            This image is unavailable.
                          </p>
                        )
                      ) : (
                        <p className="whitespace-pre-wrap text-sm leading-5 [overflow-wrap:anywhere]">
                          {message.body}
                        </p>
                      )}
                      {endsGroup && (
                        <p
                          className={`mt-1 text-right text-[10px] ${
                            ownMessage ? "text-purple-100" : "text-gray-400"
                          }`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {ownMessage && (
                            <Check className="ml-1 inline h-3 w-3" />
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                </Fragment>
              );
            })
          )}

        </div>

        {typingName && selectedConversation?.status === "open" && (
          <div
            role="status"
            aria-live="polite"
            className="flex shrink-0 items-center gap-2 border-t border-gray-50 bg-white px-4 py-1.5 text-xs text-gray-500 sm:px-6"
          >
            <span className="flex items-center gap-0.5" aria-hidden="true">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-500 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-500 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-purple-500" />
            </span>
            <span>{typingName} is typing...</span>
          </div>
        )}

        {/* Error */}
        {error && (
          <p
            role="alert"
            className="shrink-0 border-t border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700 [overflow-wrap:anywhere] sm:px-5"
          >
            {error}
          </p>
        )}

        {/* Composer */}
        {role === "user" && selectedConversation?.status === "closed" ? (
          <div className="shrink-0 border-t border-gray-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center sm:p-4">
            <button
              type="button"
              onClick={() => void startNewConversation()}
              disabled={busy}
              className={`min-h-11 w-full rounded-full bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-60 min-[420px]:w-auto ${focusRing}`}
            >
              {busy ? "Starting..." : "Start a new chat"}
            </button>
          </div>
        ) : (
          <div className="shrink-0 border-t border-gray-100 bg-white">
            {draft.length > 3500 && (
              <p
                className={`px-4 pt-2 text-right text-[10px] ${
                  draft.length >= 4000 ? "text-red-600" : "text-gray-400"
                }`}
              >
                {draft.length}/4000
              </p>
            )}
            <form
              onSubmit={sendMessage}
              className="mx-3 my-3 flex items-end gap-2 rounded-3xl border border-gray-200 bg-white p-2 shadow-sm transition focus-within:border-purple-300 focus-within:shadow-md focus-within:shadow-purple-100/70 sm:mx-5 sm:my-4 sm:gap-3 sm:p-2.5"
            >
              {isRecordingVoice ? (
                <>
                  <div
                    role="status"
                    aria-live="polite"
                    className="flex min-h-12 min-w-0 flex-1 items-center gap-3 rounded-2xl bg-red-50 px-3"
                  >
                    <span className="relative flex h-3 w-3 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-red-700">
                        Recording voice note
                      </span>
                      <span className="block text-xs text-red-600">
                        {formatVoiceDuration(recordingSeconds)} / 2:00 max
                      </span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={cancelVoiceRecording}
                    aria-label="Discard voice note"
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-50 ${focusRing}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={stopVoiceRecording}
                    aria-label="Stop recording"
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-600 text-white transition hover:bg-red-700 ${focusRing}`}
                  >
                    <Square className="h-4 w-4 fill-current" />
                  </button>
                </>
              ) : voiceNoteDraft ? (
                <>
                  <div className="min-w-0 flex-1 px-1">
                    <p className="mb-1 text-xs font-semibold text-gray-700">
                      Voice note preview ·{" "}
                      {formatVoiceDuration(voiceNoteDraft.durationSeconds)}
                    </p>
                    <audio
                      controls
                      preload="metadata"
                      aria-label="Preview voice note"
                      className="h-9 w-full"
                      src={voiceNoteDraft.previewUrl}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={cancelVoiceRecording}
                    disabled={isUploadingVoice}
                    aria-label="Discard voice note"
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 ${focusRing}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendVoiceNote()}
                    disabled={
                      isUploadingVoice ||
                      composerDisabled ||
                      connectionState !== "connected"
                    }
                    aria-label={
                      isUploadingVoice ? "Uploading voice note" : "Send voice note"
                    }
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-sm transition hover:from-violet-700 hover:to-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
                  >
                    {isUploadingVoice ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </>
              ) : imageMessageDraft ? (
                <>
                  <div className="flex min-w-0 flex-1 items-center gap-3 px-1">
                    <img
                      src={imageMessageDraft.previewUrl}
                      alt="Image ready to send"
                      className="h-14 w-14 shrink-0 rounded-xl border border-gray-200 object-cover"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {imageMessageDraft.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Image attachment ·{" "}
                        {(imageMessageDraft.file.size / (1024 * 1024)).toFixed(
                          1
                        )}{" "}
                        MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={cancelImageMessage}
                    disabled={isUploadingImage}
                    aria-label="Discard image"
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 ${focusRing}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendImageMessage()}
                    disabled={
                      isUploadingImage ||
                      composerDisabled ||
                      connectionState !== "connected"
                    }
                    aria-label={isUploadingImage ? "Uploading image" : "Send image"}
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-sm transition hover:from-violet-700 hover:to-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
                  >
                    {isUploadingImage ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </>
              ) : (
                <>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/avif,image/gif,image/jpeg,image/png,image/webp"
                    onChange={selectImage}
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={
                      composerDisabled ||
                      connectionState !== "connected" ||
                      isUploadingImage
                    }
                    aria-label="Attach an image"
                    title="Attach an image"
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
                  >
                    <ImagePlus className="h-4 w-4" />
                  </button>
                  <label htmlFor="live-chat-message" className="sr-only">
                    Write a message
                  </label>
                  <textarea
                    id="live-chat-message"
                    ref={textareaRef}
                    value={draft}
                    onChange={(event) => {
                      setDraft(event.target.value);
                      if (event.target.value.trim() && !composerDisabled) {
                        sendTypingStatus(true);
                        if (typingTimeoutRef.current) {
                          clearTimeout(typingTimeoutRef.current);
                        }
                        typingTimeoutRef.current = setTimeout(stopTyping, 1200);
                      } else {
                        stopTyping();
                      }
                      event.target.style.height = "auto";
                      event.target.style.height = `${Math.min(
                        event.target.scrollHeight,
                        128
                      )}px`;
                    }}
                    onBlur={stopTyping}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    maxLength={4000}
                    rows={1}
                    disabled={
                      composerDisabled || isUploadingVoice || isUploadingImage
                    }
                    placeholder={
                      composerDisabled
                        ? "Select an open conversation to reply"
                        : connectionState !== "connected"
                        ? "Waiting for connection..."
                        : "Write a message..."
                    }
                    className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-2xl bg-gray-50 px-3 py-2.5 text-base outline-none transition placeholder:text-gray-400 focus:bg-white disabled:bg-gray-100 sm:px-4 sm:py-3 sm:text-sm"
                  />
                  {draft.trim() ? (
                    <button
                      type="submit"
                      disabled={
                        composerDisabled ||
                        connectionState !== "connected" ||
                        isUploadingVoice ||
                        isUploadingImage
                      }
                      aria-label="Send message"
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-sm transition hover:from-violet-700 hover:to-fuchsia-700 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-300 ${focusRing}`}
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void startVoiceRecording()}
                      disabled={
                        composerDisabled ||
                        connectionState !== "connected" ||
                        isRequestingMicrophone ||
                        isUploadingVoice ||
                        isUploadingImage
                      }
                      aria-label="Record a voice note"
                      title="Record a voice note"
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-violet-700 transition hover:border-violet-300 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
                    >
                      {isRequestingMicrophone ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </>
              )}
            </form>
          </div>
        )}
      </section>
    </>
  );
}