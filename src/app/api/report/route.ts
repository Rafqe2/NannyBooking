import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/report
// Body: { reported_type: 'user' | 'ad', reported_id: string, reason: string, note?: string }
export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: me, error: authErr } = await adminClient.auth.getUser(token);
    if (authErr || !me?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { reported_type, reported_id, reason, note } = body;

    if (!reported_type || !reported_id || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!["user", "ad"].includes(reported_type)) {
      return NextResponse.json({ error: "Invalid reported_type" }, { status: 400 });
    }
    // Prevent users from reporting themselves
    if (reported_type === "user" && reported_id === me.user.id) {
      return NextResponse.json({ error: "Cannot report yourself" }, { status: 400 });
    }

    const { error: insertErr } = await adminClient.from("reports").insert({
      reporter_id: me.user.id,
      reported_type,
      reported_id,
      reason,
      note: (note || "").trim(),
    });

    if (insertErr) {
      // Unique constraint = already reported
      if (insertErr.code === "23505") {
        return NextResponse.json({ error: "already_reported" }, { status: 409 });
      }
      console.error("Error inserting report:", insertErr);
      return NextResponse.json({ error: "Failed to submit report" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Report route error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
