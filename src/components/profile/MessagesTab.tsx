"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "../LanguageProvider";
import { MessageService, Conversation, Message as ChatMessage } from "../../lib/messageService";
import { formatDateDDMMYYYY } from "../../lib/date";
import { UserProfile } from "../../lib/userService";
import { User } from "@supabase/supabase-js";
import { notifyBooking } from "../../lib/notifyService";

const WORD_LIMIT = 100;

function wordCount(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

interface MessagesTabProps {
  userProfile: UserProfile | null;
  user: User | null;
}

export default function MessagesTab({ userProfile, user }: MessagesTabProps) {
  const { t, language } = useTranslation();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Reset state when switching conversations
  useEffect(() => {
    setDraft("");
    setContactEmail("");
    setContactPhone("");
    setContactError(null);
    setShowContactForm(false);
  }, [activeConversation]);

  // Load conversations and poll every 15s
  useEffect(() => {
    if (!userProfile?.id) return;
    let active = true;
    const load = async () => {
      const convs = await MessageService.getConversations(userProfile.id);
      if (active) setConversations(convs);
    };
    load();
    const interval = setInterval(load, 15000);
    return () => { active = false; clearInterval(interval); };
  }, [userProfile?.id]);

  // Load messages for active conversation and poll every 10s
  useEffect(() => {
    if (!activeConversation) return;
    let active = true;
    const load = async () => {
      setLoadingMessages(true);
      const msgs = await MessageService.getMessages(activeConversation);
      if (active) {
        setConversationMessages(msgs);
        setLoadingMessages(false);
        await MessageService.markAsRead(activeConversation);
      }
    };
    load();
    const interval = setInterval(load, 10000);
    return () => { active = false; clearInterval(interval); };
  }, [activeConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conversationMessages]);

  // ── One-message-each model ────────────────────────────────────────────────
  // System messages (booking accepted etc.) are is_template = true — excluded from limits.
  // Each participant can send exactly ONE free-form message.
  // After both have sent → conversation locks, contact share is shown.
  const userMessages  = conversationMessages.filter(m => !m.is_template);
  const myUserMsgs    = userMessages.filter(m => m.sender_id === user?.id);
  const theirUserMsgs = userMessages.filter(m => m.sender_id !== user?.id);

  // Exclude contact-info shares from the "message sent" count
  const isContactMsg  = (m: ChatMessage) => m.content.includes("📧") || m.content.includes("📱");
  const myRealMsgs    = myUserMsgs.filter(m => !isContactMsg(m));
  const theirRealMsgs = theirUserMsgs.filter(m => !isContactMsg(m));

  const iSentMyMessage   = myRealMsgs.length > 0;
  const theySentMessage  = theirRealMsgs.length > 0;
  const canSend          = !iSentMyMessage;                         // only if I haven't sent yet
  const bothHaveMessaged = iSentMyMessage && theySentMessage;       // both sent → show contact

  // Detect if user already shared contact info (messages containing 📧 or 📱)
  const alreadySharedContact = myUserMsgs.some(
    m => m.content.includes("📧") || m.content.includes("📱")
  );

  const words = wordCount(draft);
  const overLimit = words > WORD_LIMIT;

  const handleSendMessage = useCallback(async () => {
    if (!activeConversation || sendingMessage || !canSend || overLimit || draft.trim() === "") return;
    setSendingMessage(true);
    const msg = await MessageService.sendMessage(activeConversation, draft.trim(), false);
    if (msg) {
      setConversationMessages(prev => [...prev, msg]);
      setDraft("");
      const conv = conversations.find(c => c.id === activeConversation);
      if (conv?.booking_id) {
        notifyBooking("new_message", conv.booking_id, { conversationId: activeConversation });
      }
    }
    setSendingMessage(false);
  }, [activeConversation, sendingMessage, canSend, overLimit, draft, conversations]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleSendContact = useCallback(async () => {
    if (!activeConversation || sendingMessage) return;
    const email = contactEmail.trim();
    const phone = contactPhone.trim();
    if (!email && !phone) { setContactError(t("messages.fillAtLeastOne")); return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setContactError(t("messages.invalidEmail")); return;
    }
    if (phone && phone.replace(/\D/g, "").length < 7) {
      setContactError(t("messages.invalidPhone")); return;
    }
    setContactError(null);
    setSendingMessage(true);
    const parts: string[] = [];
    if (email) parts.push(`📧 ${email}`);
    if (phone) parts.push(`📱 ${phone}`);
    const msg = await MessageService.sendMessage(activeConversation, parts.join("\n"), false);
    if (msg) {
      setConversationMessages(prev => [...prev, msg]);
      setContactEmail("");
      setContactPhone("");
      setShowContactForm(false);
    }
    setSendingMessage(false);
  }, [activeConversation, sendingMessage, contactEmail, contactPhone, t]);

  const formatMessageTime = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (msgDate.getTime() === today.getTime()) return time;
    if (msgDate.getTime() === yesterday.getTime()) return `${t("messages.yesterday")} ${time}`;
    return `${formatDateDDMMYYYY(date)} ${time}`;
  }, [t, language]);

  const activeConvData = conversations.find(c => c.id === activeConversation);
  const counterpartyName = activeConvData?.counterparty_name ?? "them";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {conversations.length === 0 ? (
          <div className="text-center py-16 px-8">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t("messages.noConversations")}</h3>
            <p className="text-gray-600 max-w-md mx-auto">{t("messages.noConversationsDesc")}</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row h-auto md:h-[640px]">
            {/* ── Sidebar ───────────────────────────────────────────────── */}
            <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-gray-200 overflow-y-auto flex-shrink-0 max-h-60 md:max-h-none">
              {conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv.id)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    activeConversation === conv.id ? "bg-brand-50 border-l-4 border-l-brand-600" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {conv.counterparty_picture ? (
                      <img src={conv.counterparty_picture} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-brand-600 font-semibold text-sm">
                          {(conv.counterparty_name || "?")[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 text-sm truncate">{conv.counterparty_name}</span>
                        {conv.unread_count > 0 && (
                          <span className="bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      {conv.last_message && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{conv.last_message}</p>
                      )}
                      {conv.booking_date && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {t("messages.bookingOn")} {formatDateDDMMYYYY(new Date(conv.booking_date + "T00:00:00"))}
                        </p>
                      )}
                      {conv.booking_status === "cancelled" && (
                        <span className="text-xs text-red-500 font-medium">{t("booking.cancelled")}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* ── Message panel ─────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0">
              {!activeConversation ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                  {t("messages.selectConversation")}
                </div>
              ) : (
                <>
                  {/* Header */}
                  {activeConvData && (
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                      {activeConvData.counterparty_picture ? (
                        <img src={activeConvData.counterparty_picture} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                          <span className="text-brand-600 font-semibold text-xs">
                            {(activeConvData.counterparty_name || "?")[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="font-medium text-gray-900 text-sm">{activeConvData.counterparty_name}</span>
                    </div>
                  )}

                  {/* Message history */}
                  <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loadingMessages && conversationMessages.length === 0 && (
                      <div className="text-center text-gray-400 text-sm py-8">Loading...</div>
                    )}
                    {conversationMessages.map(msg => {
                      const isOwn = msg.sender_id === user?.id;
                      const isSystem = msg.is_template;
                      if (isSystem) {
                        return (
                          <div key={msg.id} className="flex justify-center">
                            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                              {msg.content}
                            </span>
                          </div>
                        );
                      }
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[72%] px-4 py-3 rounded-2xl ${
                              isOwn
                                ? "bg-brand-600 text-white rounded-br-md"
                                : "bg-gray-100 text-gray-900 rounded-bl-md"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                            <p className={`text-xs mt-1.5 ${isOwn ? "text-brand-200" : "text-gray-400"}`}>
                              {formatMessageTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Bottom compose panel ─────────────────────────────── */}
                  {activeConvData?.booking_status === "cancelled" ? (
                    <div className="p-4 border-t border-gray-200 text-center text-sm text-gray-500 bg-gray-50">
                      {t("messages.conversationClosed")}
                    </div>
                  ) : (
                    <div className="border-t border-gray-200">

                      {/* Contact info prompt — shown after both have exchanged messages */}
                      {bothHaveMessaged && !alreadySharedContact && (
                        <div className="border-b border-gray-100 bg-amber-50 px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-amber-900">{t("messages.connectFurther")}</p>
                              <p className="text-xs text-amber-700 mt-0.5">{t("messages.connectFurtherDesc")}</p>
                            </div>
                            {!showContactForm && (
                              <button
                                onClick={() => setShowContactForm(true)}
                                className="flex-shrink-0 text-xs px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                              >
                                {t("messages.shareContactToggle")}
                              </button>
                            )}
                          </div>

                          {showContactForm && (
                            <div className="mt-3 space-y-2">
                              <input
                                type="email"
                                value={contactEmail}
                                onChange={e => { setContactEmail(e.target.value); setContactError(null); }}
                                placeholder={t("messages.emailPlaceholder")}
                                className="w-full px-3 py-2 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                              />
                              <input
                                type="tel"
                                value={contactPhone}
                                onChange={e => { setContactPhone(e.target.value); setContactError(null); }}
                                placeholder={t("messages.phonePlaceholder")}
                                className="w-full px-3 py-2 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                              />
                              {contactError && <p className="text-xs text-red-600">{contactError}</p>}
                              <div className="flex gap-2">
                                <button
                                  onClick={handleSendContact}
                                  disabled={sendingMessage}
                                  className="flex-1 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
                                >
                                  {sendingMessage ? "..." : t("messages.shareContactBtn")}
                                </button>
                                <button
                                  onClick={() => setShowContactForm(false)}
                                  className="px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
                                >
                                  {t("common.cancel")}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {alreadySharedContact && (
                        <div className="border-b border-gray-100 px-4 py-2.5 bg-green-50 flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-xs text-green-800 font-medium">{t("messages.contactShared")}</span>
                          <span className="text-xs text-green-600">· {t("messages.contactSharedDesc")}</span>
                        </div>
                      )}

                      {/* Compose area */}
                      {/* Only show compose if user hasn't sent their one message yet */}
                      {canSend ? (
                        <div className="p-4">
                          <textarea
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t("messages.typeMessage")}
                            rows={4}
                            className={`w-full px-3 py-2.5 text-sm border rounded-xl resize-none focus:outline-none focus:ring-2 transition-colors ${
                              overLimit
                                ? "border-red-300 focus:ring-red-300 bg-red-50"
                                : "border-gray-200 focus:ring-brand-400 bg-white"
                            }`}
                          />
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs ${overLimit ? "text-red-600 font-medium" : "text-gray-400"}`}>
                              {t("messages.wordCount").replace("{count}", String(words))}
                              {overLimit && ` · ${t("messages.wordLimitReached")}`}
                            </span>
                            <button
                              onClick={handleSendMessage}
                              disabled={sendingMessage || overLimit || draft.trim() === ""}
                              className="px-4 py-1.5 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {sendingMessage ? "..." : t("messages.send")}
                            </button>
                          </div>
                          <p className="text-xs text-gray-400 mt-1.5">
                            {t("common.cmdEnterToSend") || "⌘ Enter to send"}
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-500">
                            {t("messages.waitingForReply").replace("{name}", counterpartyName)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
