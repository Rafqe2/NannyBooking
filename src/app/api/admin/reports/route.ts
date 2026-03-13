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
  return { client: adminClient };
}

// GET /api/admin/reports?status=pending&limit=50&offset=0
export async function GET(req: Request) {
  try {
    const { client } = await getAdminClient(req.headers.get("authorization"));
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";
    const limit = Math.min(Number(searchParams.get("limit") || 50), 100);
    const offset = Number(searchParams.get("offset") || 0);

    const { data: reports, error, count } = await client
      .from("reports")
      .select("*", { count: "exact" })
      .eq("status", status)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Enrich with reporter + reported target names in parallel
    const reporterIds = Array.from(new Set((reports || []).map((r: any) => r.reporter_id as string)));
    const userTargetIds = (reports || [])
      .filter((r: any) => r.reported_type === "user")
      .map((r: any) => r.reported_id);
    const adTargetIds = (reports || [])
      .filter((r: any) => r.reported_type === "ad")
      .map((r: any) => r.reported_id);

    const [reportersRes, targetUsersRes, targetAdsRes] = await Promise.all([
      reporterIds.length > 0
        ? client.from("users").select("id, name, surname, email").in("id", reporterIds)
        : Promise.resolve({ data: [] }),
      userTargetIds.length > 0
        ? client.from("users").select("id, name, surname").in("id", userTargetIds)
        : Promise.resolve({ data: [] }),
      adTargetIds.length > 0
        ? client.from("advertisements").select("id, title").in("id", adTargetIds)
        : Promise.resolve({ data: [] }),
    ]);

    const reporterMap = new Map((reportersRes.data || []).map((u: any) => [u.id, u]));
    const userMap = new Map((targetUsersRes.data || []).map((u: any) => [u.id, u]));
    const adMap = new Map((targetAdsRes.data || []).map((a: any) => [a.id, a]));

    const enriched = (reports || []).map((r: any) => {
      const reporter = reporterMap.get(r.reporter_id);
      const target = r.reported_type === "user"
        ? userMap.get(r.reported_id)
        : adMap.get(r.reported_id);
      return {
        ...r,
        reporter_name: reporter ? `${reporter.name || ""} ${reporter.surname || ""}`.trim() : "Unknown",
        reporter_email: reporter?.email || "",
        target_name: target
          ? (r.reported_type === "user"
              ? `${(target as any).name || ""} ${(target as any).surname || ""}`.trim()
              : (target as any).title)
          : "Unknown",
      };
    });

    return NextResponse.json({ reports: enriched, total: count ?? 0 });
  } catch (e: any) {
    const status = e.message === "Forbidden" ? 403 : e.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: e.message }, { status });
  }
}

// PATCH /api/admin/reports - update report status
// Body: { id: string, status: 'reviewed' | 'dismissed' }
export async function PATCH(req: Request) {
  try {
    const { client } = await getAdminClient(req.headers.get("authorization"));
    const { id, status } = await req.json();

    if (!id || !["reviewed", "dismissed"].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { error } = await client
      .from("reports")
      .update({ status })
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    const httpStatus = e.message === "Forbidden" ? 403 : e.message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: e.message }, { status: httpStatus });
  }
}
