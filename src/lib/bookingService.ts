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
        // eslint-disable-next-line no-console
        console.error("createBooking error - full error object:", JSON.stringify(error, null, 2));
        console.error("createBooking error - error.message:", error.message);
        console.error("createBooking error - error.details:", error.details);
        console.error("createBooking error - error.hint:", error.hint);
        console.error("createBooking error - error.code:", error.code);
        
        // Handle different error formats - Supabase errors have a message property
        let errorMessage = 'Failed to create booking. Please try again.';
        
        if (error.message) {
          errorMessage = error.message;
        } else if (error.details) {
          errorMessage = error.details;
        } else if (error.hint) {
          errorMessage = error.hint;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else {
          // Try to extract message from error object
          const errorStr = JSON.stringify(error);
          if (errorStr && errorStr !== '{}') {
            errorMessage = errorStr;
          }
        }
        
        return { success: false, error: errorMessage };
      }
      if (!data) {
        return { success: false, error: 'No booking ID returned from server' };
      }
      return { success: true, id: data as string };
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error("createBooking exception", e);
      const errorMsg = e?.message || e?.toString() || JSON.stringify(e) || 'Failed to create booking. Please try again.';
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


