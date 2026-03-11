import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getAdminClient(authHeader: string | null) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  if (!supabaseUrl || !serviceKey) throw new Error("Missing env vars");

  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) throw new Error("Unauthorized");

  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: me, error } = await adminClient.auth.getUser(token);
  if (error || !me?.user) throw new Error("Unauthorized");

  const { data: profile } = await adminClient
    .from("users")
    .select("user_type")
    .eq("id", me.user.id)
    .single();

  if (profile?.user_type !== "admin") throw new Error("Forbidden");
  return adminClient;
}

export async function GET(req: Request) {
  try {
    const client = await getAdminClient(req.headers.get("authorization"));

    const [usersRes, adsRes, bookingsRes, recentRes] = await Promise.all([
      client.from("users").select("user_type"),
      client.from("advertisements").select("is_active, ad_type"),
      client.from("bookings").select("status"),
      client
        .from("users")
        .select("id")
        .gte(
          "created_at",
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        ),
    ]);

    const users = usersRes.data || [];
    const ads = adsRes.data || [];
    const bookings = bookingsRes.data || [];
    const recentUsers = recentRes.data || [];

    return NextResponse.json({
      users: {
        total: users.length,
        parents: users.filter((u) => u.user_type === "parent").length,
        nannies: users.filter((u) => u.user_type === "nanny").length,
        pending: users.filter((u) => u.user_type === "pending").length,
        admins: users.filter((u) => u.user_type === "admin").length,
        newLast7Days: recentUsers.length,
      },
      ads: {
        total: ads.length,
        active: ads.filter((a) => a.is_active).length,
        inactive: ads.filter((a) => !a.is_active).length,
        shortTerm: ads.filter((a) => a.ad_type === "short-term").length,
        longTerm: ads.filter((a) => a.ad_type === "long-term").length,
      },
      bookings: {
        total: bookings.length,
        pending: bookings.filter((b) => b.status === "pending").length,
        confirmed: bookings.filter((b) => b.status === "confirmed").length,
        completed: bookings.filter((b) => b.status === "completed").length,
        cancelled: bookings.filter((b) => b.status === "cancelled").length,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    const status = msg === "Forbidden" ? 403 : msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
