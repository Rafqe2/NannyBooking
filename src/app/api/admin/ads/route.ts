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

// GET /api/admin/ads - list all ads
export async function GET(req: Request) {
  try {
    const client = await getAdminClient(req.headers.get("authorization"));

    const { data, error } = await client
      .from("advertisements")
      .select(
        "id, title, type, is_active, price_per_hour, location_city, created_at, user_id, users(name, surname, email)"
      )
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) throw new Error(error.message);
    return NextResponse.json({ ads: data });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    const status = msg === "Forbidden" ? 403 : msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}

// DELETE /api/admin/ads - delete an ad
export async function DELETE(req: Request) {
  try {
    const client = await getAdminClient(req.headers.get("authorization"));
    const { adId } = await req.json().catch(() => ({}));

    if (!adId) {
      return NextResponse.json({ error: "Missing adId" }, { status: 400 });
    }

    const { error } = await client
      .from("advertisements")
      .delete()
      .eq("id", adId);

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    const status = msg === "Forbidden" ? 403 : msg === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
