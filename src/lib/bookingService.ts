// BookingService — wraps all booking-related Supabase RPC calls.
// All mutations go through server-side RPCs so business rules (availability
// checks, duplicate prevention, status transitions) are enforced in the DB.
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
    try {
      const { data, error } = await supabase.rpc("create_booking_from_ad", {
        p_ad_id: input.adId,
        p_date: input.date,
        p_start: input.start,
        p_end: input.end,
        p_message: input.message ?? null,
      });
      if (error) {
        // Combine all error fields so we never lose the raise exception message
        const allParts = [error.message, error.details, error.hint]
          .filter(Boolean)
          .join(' | ');
        const errorMessage = allParts || (typeof error === 'string' ? error : JSON.stringify(error)) || 'Failed to create booking. Please try again.';
        
        return { success: false, error: errorMessage };
      }
      if (!data) {
        return { success: false, error: 'No booking ID returned from server' };
      }
      return { success: true, id: data as string };
    } catch (e: unknown) {
      // eslint-disable-next-line no-console
      console.error("createBooking exception", e);
      const errorMsg = e instanceof Error ? e.message : (typeof e === 'string' ? e : 'Failed to create booking. Please try again.');
      return { 
        success: false, 
        error: errorMsg
      };
    }
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
