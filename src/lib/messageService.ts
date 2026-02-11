import { supabase } from "./supabase";

export interface Conversation {
  id: string;
  booking_id: string;
  participant_1: string;
  participant_2: string;
  created_at: string;
  updated_at: string;
  // Enriched fields
  counterparty_name: string;
  counterparty_picture: string | null;
  booking_date: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_template: boolean;
  read_at: string | null;
  created_at: string;
}

export class MessageService {
  static async getConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      return [];
    }

    const convs = data || [];
    if (convs.length === 0) return [];

    // Batch fetch: collect all unique counterparty IDs and booking IDs
    const counterpartyIds = new Set<string>();
    const bookingIds = new Set<string>();
    const convIds = convs.map((c: any) => c.id);

    for (const conv of convs as any[]) {
      const cpId = conv.participant_1 === userId ? conv.participant_2 : conv.participant_1;
      counterpartyIds.add(cpId);
      bookingIds.add(conv.booking_id);
    }

    // Batch queries in parallel: users, bookings, last messages, unread counts
    const [usersRes, bookingsRes, lastMsgsRes, unreadRes] = await Promise.all([
      // All counterparty users in one query
      supabase
        .from("users")
        .select("id, name, surname, picture")
        .in("id", Array.from(counterpartyIds)),
      // All bookings in one query
      supabase
        .from("bookings")
        .select("id, start_date")
        .in("id", Array.from(bookingIds)),
      // Last message per conversation - get recent messages and pick latest per conv
      supabase
        .from("messages")
        .select("conversation_id, content, created_at")
        .in("conversation_id", convIds)
        .order("created_at", { ascending: false }),
      // Unread messages for this user
      supabase
        .from("messages")
        .select("conversation_id")
        .in("conversation_id", convIds)
        .neq("sender_id", userId)
        .is("read_at", null),
    ]);

    // Build lookup maps
    const userMap = new Map<string, { name: string; surname: string; picture: string | null }>();
    for (const u of (usersRes.data || []) as any[]) {
      userMap.set(u.id, u);
    }

    const bookingMap = new Map<string, string>();
    for (const b of (bookingsRes.data || []) as any[]) {
      bookingMap.set(b.id, b.start_date);
    }

    // Last message per conversation (first occurrence = latest due to order desc)
    const lastMsgMap = new Map<string, { content: string; created_at: string }>();
    for (const msg of (lastMsgsRes.data || []) as any[]) {
      if (!lastMsgMap.has(msg.conversation_id)) {
        lastMsgMap.set(msg.conversation_id, { content: msg.content, created_at: msg.created_at });
      }
    }

    // Unread count per conversation
    const unreadMap = new Map<string, number>();
    for (const msg of (unreadRes.data || []) as any[]) {
      unreadMap.set(msg.conversation_id, (unreadMap.get(msg.conversation_id) || 0) + 1);
    }

    // Assemble enriched conversations
    return convs.map((conv: any) => {
      const cpId = conv.participant_1 === userId ? conv.participant_2 : conv.participant_1;
      const userInfo = userMap.get(cpId);
      const lastMsg = lastMsgMap.get(conv.id);

      return {
        ...conv,
        counterparty_name: userInfo
          ? `${userInfo.name || ""} ${userInfo.surname || ""}`.trim()
          : "Unknown",
        counterparty_picture: userInfo?.picture || null,
        booking_date: bookingMap.get(conv.booking_id) || null,
        last_message: lastMsg?.content || null,
        last_message_at: lastMsg?.created_at || null,
        unread_count: unreadMap.get(conv.id) || 0,
      } as Conversation;
    });
  }

  static async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return [];
    }

    return (data || []) as Message[];
  }

  static async sendMessage(
    conversationId: string,
    content: string,
    isTemplate: boolean = false
  ): Promise<Message | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.substring(0, 1000),
        is_template: isTemplate,
      })
      .select()
      .single();

    if (error) {
      console.error("Error sending message:", error);
      return null;
    }

    return data as Message;
  }

  static async markAsRead(conversationId: string): Promise<void> {
    await supabase.rpc("mark_messages_read", {
      p_conversation_id: conversationId,
    });
  }

  static async getOrCreateConversation(
    bookingId: string
  ): Promise<string | null> {
    const { data, error } = await supabase.rpc(
      "get_or_create_conversation",
      { p_booking_id: bookingId }
    );

    if (error) {
      console.error("Error getting/creating conversation:", error);
      return null;
    }

    return data as string;
  }

  static async getUnreadCount(): Promise<number> {
    const { data, error } = await supabase.rpc("get_unread_message_count");
    if (error) return 0;
    return Number(data || 0);
  }
}
