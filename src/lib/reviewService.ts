import { supabase } from "./supabase";

export interface Review {
  id: string;
  advertisement_id: string;
  reviewer_id: string;
  reviewee_id: string;
  booking_id: string | null;
  rating: number;
  title: string | null;
  comment: string;
  response: string | null;
  response_date: string | null;
  helpful_count: number;
  reported_count: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  reviewer_name?: string;
  reviewer_picture?: string;
  reviewee_name?: string;
  reviewee_picture?: string;
}

export interface RatingStats {
  average_rating: number;
  total_reviews: number;
  rating_breakdown: {
    "5": number;
    "4": number;
    "3": number;
    "2": number;
    "1": number;
  };
}

export interface CreateReviewInput {
  bookingId: string;
  advertisementId: string;
  revieweeId: string;
  rating: number;
  title?: string;
  comment: string;
}

export interface UpdateReviewInput {
  rating?: number;
  title?: string;
  comment?: string;
}

export class ReviewService {
  /**
   * Create a new review
   */
  static async createReview(
    input: CreateReviewInput
  ): Promise<{ success: boolean; review?: Review; error?: string }> {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        return { success: false, error: "Not authenticated" };
      }

      const { data, error } = await supabase
        .from("reviews")
        .insert({
          booking_id: input.bookingId,
          advertisement_id: input.advertisementId,
          reviewer_id: userData.user.id,
          reviewee_id: input.revieweeId,
          rating: input.rating,
          title: input.title || null,
          comment: input.comment,
          is_verified: true, // Since it's from a booking
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating review:", error);
        return { success: false, error: error.message };
      }

      return { success: true, review: data as Review };
    } catch (error: any) {
      console.error("Error creating review:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }

  /**
   * Update an existing review
   */
  static async updateReview(
    reviewId: string,
    updates: UpdateReviewInput
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("reviews")
        .update(updates)
        .eq("id", reviewId);

      if (error) {
        console.error("Error updating review:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error updating review:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }

  /**
   * Add a response to a review (for reviewee)
   */
  static async respondToReview(
    reviewId: string,
    response: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("reviews")
        .update({
          response,
          response_date: new Date().toISOString(),
        })
        .eq("id", reviewId);

      if (error) {
        console.error("Error responding to review:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error("Error responding to review:", error);
      return { success: false, error: error.message || "Unknown error" };
    }
  }

  /**
   * Delete a review
   */
  static async deleteReview(reviewId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (error) {
        console.error("Error deleting review:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error deleting review:", error);
      return false;
    }
  }

  /**
   * Get reviews for a specific user
   */
  static async getUserReviews(
    userId: string,
    options?: { limit?: number; offset?: number }
  ): Promise<Review[]> {
    try {
      let query = supabase
        .from("reviews")
        .select(
          `
          *,
          reviewer:reviewer_id (
            name,
            surname,
            picture
          )
        `
        )
        .eq("reviewee_id", userId)
        .order("created_at", { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching user reviews:", error);
        return [];
      }

      return (data || []).map((review: any) => ({
        ...review,
        reviewer_name: review.reviewer
          ? `${review.reviewer.name} ${review.reviewer.surname}`.trim()
          : "Anonymous",
        reviewer_picture: review.reviewer?.picture || null,
      }));
    } catch (error) {
      console.error("Error fetching user reviews:", error);
      return [];
    }
  }

  /**
   * Get review for a specific booking
   */
  static async getBookingReview(bookingId: string): Promise<Review | null> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("booking_id", bookingId)
        .eq("reviewer_id", userData.user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No review found
          return null;
        }
        console.error("Error fetching booking review:", error);
        return null;
      }

      return data as Review;
    } catch (error) {
      console.error("Error fetching booking review:", error);
      return null;
    }
  }

  /**
   * Check if user can review a booking
   */
  static async canReviewBooking(bookingId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("can_user_review", {
        p_booking_id: bookingId,
      });

      if (error) {
        console.error("Error checking review eligibility:", error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error("Error checking review eligibility:", error);
      return false;
    }
  }

  /**
   * Get user rating statistics
   */
  static async getUserRatingStats(userId: string): Promise<RatingStats | null> {
    try {
      const { data, error } = await supabase.rpc("get_user_rating_stats", {
        p_user_id: userId,
      });

      if (error) {
        console.error("Error fetching rating stats:", error);
        return null;
      }

      if (!data || data.length === 0) {
        return {
          average_rating: 0,
          total_reviews: 0,
          rating_breakdown: { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 },
        };
      }

      return data[0];
    } catch (error) {
      console.error("Error fetching rating stats:", error);
      return null;
    }
  }

  /**
   * Mark review as helpful/not helpful
   */
  static async markReviewHelpful(
    reviewId: string,
    isHelpful: boolean
  ): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;

      // Check if already marked
      const { data: existing } = await supabase
        .from("review_helpfulness")
        .select("id, is_helpful")
        .eq("review_id", reviewId)
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (existing) {
        if (existing.is_helpful === isHelpful) {
          // Remove if clicking same button
          const { error } = await supabase
            .from("review_helpfulness")
            .delete()
            .eq("id", existing.id);

          return !error;
        } else {
          // Update if switching
          const { error } = await supabase
            .from("review_helpfulness")
            .update({ is_helpful: isHelpful })
            .eq("id", existing.id);

          return !error;
        }
      } else {
        // Insert new
        const { error } = await supabase.from("review_helpfulness").insert({
          review_id: reviewId,
          user_id: userData.user.id,
          is_helpful: isHelpful,
        });

        return !error;
      }
    } catch (error) {
      console.error("Error marking review helpful:", error);
      return false;
    }
  }

  /**
   * Report a review
   */
  static async reportReview(
    reviewId: string,
    reason: "spam" | "offensive" | "inappropriate" | "fake" | "other",
    description?: string
  ): Promise<boolean> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;

      const { error } = await supabase.from("review_reports").insert({
        review_id: reviewId,
        reporter_id: userData.user.id,
        reason,
        description: description || null,
      });

      if (error) {
        console.error("Error reporting review:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error reporting review:", error);
      return false;
    }
  }

  /**
   * Get user's helpfulness status for a review
   */
  static async getUserHelpfulnessStatus(
    reviewId: string
  ): Promise<boolean | null> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const { data, error } = await supabase
        .from("review_helpfulness")
        .select("is_helpful")
        .eq("review_id", reviewId)
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return data.is_helpful;
    } catch (error) {
      console.error("Error fetching helpfulness status:", error);
      return null;
    }
  }
}

