import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/emailService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NotifyEvent =
  | "booking_created"
  | "booking_confirmed"
  | "booking_cancelled"
  | "new_message";

// POST /api/email/notify
// Body: { event: NotifyEvent, bookingId: string, conversationId?: string }
export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    // Verify caller is authenticated
    const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? null;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: me, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !me?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { event, bookingId } = body as { event: NotifyEvent; bookingId: string };

    if (!event || !bookingId) {
      return NextResponse.json({ error: "Missing event or bookingId" }, { status: 400 });
    }

    // Fetch booking (no joins — fetch users separately to avoid FK name issues)
    const { data: booking, error: bErr } = await admin
      .from("bookings")
      .select("id, start_date, status, parent_id, nanny_id, advertisement_id")
      .eq("id", bookingId)
      .single();

    if (bErr || !booking) {
      console.error("Email notify: booking not found", bErr, "bookingId:", bookingId);
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Fetch both users and ad owner in parallel
    const [parentRow, nannyRow, adRow] = await Promise.all([
      admin.from("users").select("id, name, surname, email").eq("id", booking.parent_id).single(),
      admin.from("users").select("id, name, surname, email").eq("id", booking.nanny_id).single(),
      booking.advertisement_id
        ? admin.from("advertisements").select("user_id, type").eq("id", booking.advertisement_id).single()
        : Promise.resolve({ data: null }),
    ]);

    const parent = parentRow.data;
    const nanny  = nannyRow.data;
    const adOwnerId: string | null = adRow.data?.user_id ?? null;
    const adType: string = adRow.data?.type ?? "short-term";

    const formatName = (u: { name: string; surname?: string | null } | null) =>
      u ? `${u.name}${u.surname ? " " + u.surname : ""}`.trim() : "User";

    const formatDate = (d: string | null) =>
      d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB") : "—";

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://auklite.lv";

    const ctaButton = (label: string) =>
      `<a href="${siteUrl}/profile" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">${label}</a>`;

    const emailWrapper = (title: string, body: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family:sans-serif;background:#f9fafb;margin:0;padding:24px;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
    <div style="background:#7c3aed;padding:24px 32px;">
      <span style="color:#fff;font-size:22px;font-weight:700;">Auklite</span>
    </div>
    <div style="padding:28px 32px;">
      <h2 style="margin:0 0 12px;color:#111827;font-size:18px;">${title}</h2>
      ${body}
      <hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;"/>
      <p style="color:#9ca3af;font-size:12px;margin:0;">Auklite · Latvia's childcare platform</p>
    </div>
  </div>
</body>
</html>`;

    switch (event) {
      case "booking_created": {
        // Notify the ad owner that someone requested a booking
        const recipientUser = adOwnerId === nanny?.id ? nanny : parent;
        const requesterUser = adOwnerId === nanny?.id ? parent : nanny;
        if (!recipientUser?.email) break;

        const isContact = adType === "long-term";
        const subject = isContact
          ? `New contact request from ${formatName(requesterUser)}`
          : `New booking request from ${formatName(requesterUser)}`;

        const bodyHtml = `
          <p style="color:#374151;">Hi ${formatName(recipientUser)},</p>
          <p style="color:#374151;">${isContact ? `<strong>${formatName(requesterUser)}</strong> has sent you a contact request.` : `<strong>${formatName(requesterUser)}</strong> has requested a booking.`}</p>
          ${!isContact ? `<p style="color:#374151;"><strong>Date:</strong> ${formatDate(booking.start_date)}</p>` : ""}
          <p style="color:#374151;">Log in to accept or decline.</p>
          ${ctaButton("View booking")}`;

        await sendEmail(recipientUser.email, subject, emailWrapper(subject, bodyHtml));
        break;
      }

      case "booking_confirmed": {
        // Notify the requester (the other party — not the ad owner)
        const recipientUser = adOwnerId === nanny?.id ? parent : nanny;
        const confirmerUser = adOwnerId === nanny?.id ? nanny : parent;
        if (!recipientUser?.email) break;

        const isContact = adType === "long-term";
        const subject = isContact
          ? `Your contact request was accepted by ${formatName(confirmerUser)}`
          : `Your booking was confirmed by ${formatName(confirmerUser)}`;

        const bodyHtml = `
          <p style="color:#374151;">Hi ${formatName(recipientUser)},</p>
          <p style="color:#374151;">Great news! ${isContact ? "Your contact request has been accepted." : "Your booking has been confirmed."}</p>
          ${!isContact ? `<p style="color:#374151;"><strong>Date:</strong> ${formatDate(booking.start_date)}</p>` : ""}
          <p style="color:#374151;">You can now message each other in the app.</p>
          ${ctaButton("Open messages")}`;

        await sendEmail(recipientUser.email, subject, emailWrapper(subject, bodyHtml));
        break;
      }

      case "booking_cancelled": {
        // Notify the other party (whoever didn't cancel)
        const cancellerIsParent = me.user.id === parent?.id;
        const recipientUser = cancellerIsParent ? nanny : parent;
        const cancellerUser = cancellerIsParent ? parent : nanny;
        if (!recipientUser?.email) break;

        const isContact = adType === "long-term";
        const subject = isContact
          ? `Contact request cancelled by ${formatName(cancellerUser)}`
          : `Booking cancelled by ${formatName(cancellerUser)}`;

        const bodyHtml = `
          <p style="color:#374151;">Hi ${formatName(recipientUser)},</p>
          <p style="color:#374151;">${isContact ? "A contact request has been cancelled." : `The booking for <strong>${formatDate(booking.start_date)}</strong> has been cancelled.`}</p>
          ${ctaButton("View your bookings")}`;

        await sendEmail(recipientUser.email, subject, emailWrapper(subject, bodyHtml));
        break;
      }

      case "new_message": {
        // conversationId must be provided; notify the other participant
        const { conversationId } = body as { conversationId?: string };
        if (!conversationId) break;

        const { data: conv } = await admin
          .from("conversations")
          .select("participant_1_id, participant_2_id")
          .eq("id", conversationId)
          .single();

        if (!conv) break;

        const recipientId =
          conv.participant_1_id === me.user.id
            ? conv.participant_2_id
            : conv.participant_1_id;

        const { data: recipientRow } = await admin
          .from("users")
          .select("name, surname, email")
          .eq("id", recipientId)
          .single();

        if (!recipientRow?.email) break;

        // Only send if recipient has no unread from this sender in the last 10 min
        // (avoids spamming on rapid-fire messages)
        const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const { count } = await admin
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conversationId)
          .eq("sender_id", me.user.id)
          .eq("is_read", false)
          .gt("created_at", tenMinsAgo);

        if ((count ?? 0) > 1) break; // already notified recently

        const senderUser = parent?.id === me.user.id ? parent : nanny;
        const subject = `New message from ${formatName(senderUser)}`;

        const bodyHtml = `
          <p style="color:#374151;">Hi ${formatName(recipientRow)},</p>
          <p style="color:#374151;">You have a new message from <strong>${formatName(senderUser)}</strong>.</p>
          ${ctaButton("Read message")}`;

        await sendEmail(recipientRow.email, subject, emailWrapper(subject, bodyHtml));
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown event" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Email notify error:", e);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
