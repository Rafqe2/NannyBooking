export interface BookingItem {
  id: string;
  booking_date: string | null;
  start_time: string | null;
  end_time: string | null;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "expired";
  message: string | null;
  has_review: boolean;
  counterparty_full_name: string | null;
  counterparty_id: string | null;
  advertisement_id: string | null;
  ad_type: string | null;
  ad_owner_id: string | null;
  cancellation_reason: string | null;
  cancellation_note: string | null;
  cancelled_at: string | null;
  parent_id: string;
  nanny_id: string;
}
