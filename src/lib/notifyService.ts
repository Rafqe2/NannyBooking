import { supabase } from "./supabase";

type NotifyEvent =
  | "booking_created"
  | "booking_confirmed"
  | "booking_cancelled"
  | "new_message";

export async function notifyBooking(
  event: NotifyEvent,
  bookingId: string,
  opts?: { conversationId?: string }
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    await fetch("/api/email/notify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ event, bookingId, ...opts }),
    });
    // Fire-and-forget — don't block UI on email success/failure
  } catch {
    // Email failures are non-critical — swallow silently
  }
}
