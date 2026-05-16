import { supabase } from "./supabase";

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: "topup" | "spend" | "refund" | "bonus";
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
}

export const WalletService = {
  async getWallet(userId: string): Promise<Wallet | null> {
    const { data, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", userId)
      .single();
    if (error) {
      console.error("WalletService.getWallet:", error);
      return null;
    }
    return data as Wallet;
  },

  async getTransactions(userId: string, limit = 50): Promise<WalletTransaction[]> {
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("WalletService.getTransactions:", error);
      return [];
    }
    return (data as WalletTransaction[]) ?? [];
  },

  // NOTE: topup/refund are intentionally NOT exposed here.
  // The SQL functions require service_role and will reject any client call.
  // Top-ups happen server-side from /api/stripe/webhook once Stripe is wired up.

  async spend(
    userId: string,
    amount: number,
    description?: string,
    referenceId?: string,
    referenceType?: string
  ): Promise<{ wallet: Wallet | null; error: string | null }> {
    const { data, error } = await supabase.rpc("spend_from_wallet", {
      p_user_id: userId,
      p_amount: amount,
      p_description: description ?? "Purchase",
      p_reference_id: referenceId ?? null,
      p_reference_type: referenceType ?? null,
    });
    if (error) {
      const msg = error.message?.includes("Insufficient balance")
        ? "Insufficient balance"
        : error.message ?? "Payment failed";
      return { wallet: null, error: msg };
    }
    return { wallet: data as Wallet, error: null };
  },
};
