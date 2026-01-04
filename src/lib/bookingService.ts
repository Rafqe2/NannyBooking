import { supabase } from "./supabase";

export interface CreateBookingInput {
  adId: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:mm
  end: string; // HH:mm
  message?: string;
}

export class BookingService {
  static async createBooking(input: CreateBookingInput): Promise<{success: true, id: string} | {success: false, error: string}> {
    const { data, error } = await supabase.rpc("create_booking_from_ad", {
      p_ad_id: input.adId,
      p_date: input.date,
      p_start: input.start,
      p_end: input.end,
      p_message: input.message ?? null,
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.error("createBooking error", error);
      return { success: false, error: error.message || 'Unknown error' };
    }
    return { success: true, id: data as string };
  }

  static async respond(bookingId: string, action: "confirm" | "cancel"): Promise<boolean> {
    const { error } = await supabase.rpc("respond_booking", {
      p_booking_id: bookingId,
      p_action: action,
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.error("respond booking error", error);
      return false;
    }
    return true;
  }

  static async cancelWithReason(
    bookingId: string, 
    reason: string, 
    note: string
  ): Promise<boolean> {
    const { error } = await supabase.rpc("cancel_booking_with_reason", {
      p_booking_id: bookingId,
      p_reason: reason,
      p_note: note,
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.error("cancel booking with reason error", error);
      return false;
    }
    return true;
  }

  static async deletePending(bookingId: string): Promise<boolean> {
    const { error } = await supabase.rpc("delete_pending_booking", {
      p_booking_id: bookingId,
    });
    if (error) {
      // eslint-disable-next-line no-console
      console.error("delete pending booking error", error);
      return false;
    }
    return true;
  }
}


