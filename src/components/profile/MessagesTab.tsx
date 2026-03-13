"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslation } from "../LanguageProvider";
import { MessageService, Conversation, Message as ChatMessage } from "../../lib/messageService";
import { formatDateDDMMYYYY } from "../../lib/date";
import { UserProfile } from "../../lib/userService";
import { User } from "@supabase/supabase-js";

interface MessagesTabProps {
  userProfile: UserProfile | null;
  user: User | null;
}

export default function MessagesTab({ userProfile, user }: MessagesTabProps) {
  const { t, language } = useTranslation();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ChatMessage[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Reset contact fields when switching conversations
  useEffect(() => {
    setContactEmail("");
    setContactPhone("");
    setContactError(null);
  }, [activeConversation]);

  // Load conversations and poll every 15s
  useEffect(() => {
    if (!userProfile?.id) return;
    let active = true;
    const loadConversations = async () => {
      const convs = await MessageService.getConversations(userProfile.id);
      if (active) setConversations(convs);
    };
    loadConversations();
    const interval = setInterval(loadConversations, 15000);
    return () => { active = false; clearInterval(interval); };
  }, [userProfile?.id]);

  // Load messages for active conversation and poll every 10s
  useEffect(() => {
    if (!activeConversation) return;
    let active = true;
    const loadMessages = async () => {
      setLoadingMessages(true);
      const msgs = await MessageService.getMessages(activeConversation);
      if (active) {
        setConversationMessages(msgs);
        setLoadingMessages(false);
        await MessageService.markAsRead(activeConversation);
      }
    };
    loadMessages();
    const interval = setInterval(loadMessages, 10000);
    return () => { active = false; clearInterval(interval); };
  }, [activeConversation]);

  // Auto-scroll to bottom of messages container (not the page)
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [conversationMessages]);

  const handleSendTemplate = useCallback(async (text: string) => {
    if (!activeConversation || sendingMessage) return;
    setSendingMessage(true);
    const msg = await MessageService.sendMessage(activeConversation, text, true);
    if (msg) {
      setConversationMessages((prev) => [...prev, msg]);
    }
    setSendingMessage(false);
  }, [activeConversation, sendingMessage]);

  const handleSendContact = useCallback(async () => {
    if (!activeConversation || sendingMessage) return;
    const email = contactEmail.trim();
    const phone = contactPhone.trim();
    if (!email && !phone) {
      setContactError(t("messages.fillAtLeastOne"));
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setContactError(t("messages.invalidEmail"));
      return;
    }
    if (phone && !/^[+]?[\d\s\-()\u200B]{7,20}$/.test(phone.replace(/\s/g, "").replace(/[\-()]/g, ""))) {
      setContactError(t("messages.invalidPhone"));
      return;
    }
    if (phone && phone.replace(/\D/g, "").length < 7) {
      setContactError(t("messages.invalidPhone"));
      return;
    }
    setContactError(null);
    setSendingMessage(true);
    const parts: string[] = [];
    if (email) parts.push(`📧 ${email}`);
    if (phone) parts.push(`📱 ${phone}`);
    const msg = await MessageService.sendMessage(activeConversation, parts.join("\n"), false);
    if (msg) {
      setConversationMessages((prev) => [...prev, msg]);
      setContactEmail("");
      setContactPhone("");
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

  const activeConvData = conversations.find((c) => c.id === activeConversation);
  const templates = [
    t("messages.template1"),
    t("messages.template2"),
    t("messages.template3"),
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {conversations.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 px-8">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t("messages.noConversations")}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {t("messages.noConversationsDesc")}
            </p>
          </div>
        ) : (
          /* Conversation Layout */
          <div className="flex flex-col md:flex-row h-auto md:h-[600px]">
            {/* Left sidebar - conversation list */}
            <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-gray-200 overflow-y-auto flex-shrink-0 max-h-60 md:max-h-none">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv.id)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    activeConversation === conv.id ? "bg-purple-50 border-l-4 border-l-purple-600" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    {conv.counterparty_picture ? (
                      <img
                        src={conv.counterparty_picture}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 font-semibold text-sm">
                          {(conv.counterparty_name || "?")[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 text-sm truncate">
                          {conv.counterparty_name}
                        </span>
                        {conv.unread_count > 0 && (
                          <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                      {conv.last_message && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {conv.last_message}
                        </p>
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

            {/* Right panel - messages */}
            <div className="flex-1 flex flex-col min-w-0">
              {!activeConversation ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                  {t("messages.selectConversation")}
                </div>
              ) : (
                <>
                  {/* Conversation header */}
                  {activeConvData && (
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                      {activeConvData.counterparty_picture ? (
                        <img
                          src={activeConvData.counterparty_picture}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-purple-600 font-semibold text-xs">
                            {(activeConvData.counterparty_name || "?")[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="font-medium text-gray-900 text-sm">
                        {activeConvData.counterparty_name}
                      </span>
                    </div>
                  )}

                  {/* Message history */}
                  <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loadingMessages && conversationMessages.length === 0 && (
                      <div className="text-center text-gray-400 text-sm py-8">
                        Loading...
                      </div>
                    )}
                    {conversationMessages.map((msg) => {
                      const isOwn = msg.sender_id === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                              isOwn
                                ? "bg-purple-600 text-white rounded-br-md"
                                : "bg-gray-100 text-gray-900 rounded-bl-md"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            <p className={`text-xs mt-1 ${isOwn ? "text-purple-200" : "text-gray-400"}`}>
                              {formatMessageTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Bottom action panel */}
                  {(() => {
                    if (activeConvData?.booking_status === "cancelled") {
                      return (
                        <div className="p-4 border-t border-gray-200 text-center text-sm text-gray-500 bg-gray-50">
                          {t("messages.conversationClosed")}
                        </div>
                      );
                    }
                    const myMsgs = conversationMessages.filter(m => m.sender_id === user?.id);
                    const sentTemplate = myMsgs.some(m => m.is_template);
                    const sentContact = myMsgs.some(m => !m.is_template);
                    // If user sent a new template AFTER their last contact share,
                    // prompt them to share contact again (prevents template spam).
                    const lastContactTime = sentContact
                      ? (myMsgs.filter(m => !m.is_template).at(-1)?.created_at ?? "")
                      : "";
                    const hasNewTemplateSinceContact = sentContact
                      && myMsgs.some(m => m.is_template && m.created_at > lastContactTime);

                    const templateButtons = (
                      <div className="flex flex-col gap-2">
                        {[
                          { icon: "👋", text: templates[0] },
                          { icon: "💬", text: templates[1] },
                          { icon: "✅", text: templates[2] },
                        ].map(({ icon, text }, i) => (
                          <button
                            key={i}
                            onClick={() => handleSendTemplate(text)}
                            disabled={sendingMessage}
                            className="w-full text-left text-sm px-4 py-3 bg-white border border-purple-100 text-gray-800 rounded-2xl hover:bg-purple-50 hover:border-purple-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-start gap-3 group"
                          >
                            <span className="text-lg leading-tight mt-0.5 flex-shrink-0">{icon}</span>
                            <span className="leading-snug group-hover:text-purple-800 transition-colors">{text}</span>
                          </button>
                        ))}
                      </div>
                    );

                    if (sentContact && !hasNewTemplateSinceContact) {
                      // Contact shared, no new template since — show confirmation + template options
                      return (
                        <div className="border-t border-gray-100">
                          <div className="px-4 py-3 bg-green-50 flex items-center gap-3">
                            <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                              <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-green-800">{t("messages.contactShared")}</p>
                              <p className="text-xs text-green-600">{t("messages.contactSharedDesc")}</p>
                            </div>
                          </div>
                          <div className="p-4 bg-gray-50">
                            <p className="text-xs text-gray-400 mb-2">{t("messages.templatesOnly")}</p>
                            {templateButtons}
                          </div>
                        </div>
                      );
                    }

                    if (sentTemplate || hasNewTemplateSinceContact) {
                      // Sent a template — share contact info
                      return (
                        <div className="p-4 border-t border-gray-100 bg-purple-50/50">
                          <p className="text-sm font-semibold text-gray-800 mb-0.5">{t("messages.shareContact")}</p>
                          <p className="text-xs text-gray-500 mb-3">{t("messages.shareContactDesc")}</p>
                          <div className="space-y-2">
                            <input
                              type="email"
                              value={contactEmail}
                              onChange={(e) => { setContactEmail(e.target.value); setContactError(null); }}
                              placeholder={t("messages.emailPlaceholder")}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                            />
                            <input
                              type="tel"
                              value={contactPhone}
                              onChange={(e) => { setContactPhone(e.target.value); setContactError(null); }}
                              placeholder={t("messages.phonePlaceholder")}
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                            />
                            {contactError && (
                              <p className="text-xs text-red-500">{contactError}</p>
                            )}
                            <button
                              onClick={handleSendContact}
                              disabled={sendingMessage}
                              className="w-full py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {sendingMessage ? "..." : t("messages.shareContactBtn")}
                            </button>
                          </div>
                        </div>
                      );
                    }

                    // State 1: no messages sent yet — show templates
                    return (
                      <div className="p-4 border-t border-gray-100 bg-gray-50">
                        <p className="text-xs text-gray-400 mb-3">{t("messages.templatesOnly")}</p>
                        {templateButtons}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
