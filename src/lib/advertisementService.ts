import { supabase } from "./supabase";
import { Database } from "../types/database";

type Advertisement = Database["public"]["Tables"]["advertisements"]["Row"];
type AdvertisementInsert =
  Database["public"]["Tables"]["advertisements"]["Insert"];
type AdvertisementUpdate =
  Database["public"]["Tables"]["advertisements"]["Update"];

export class AdvertisementService {
  static async createAdvertisement(
    userId: string,
    advertisementData: Omit<AdvertisementInsert, "user_id">
  ): Promise<Advertisement | null> {
    try {
      const { data, error } = await supabase
        .from("advertisements")
        .insert({
          user_id: userId,
          is_active: false,
          ...advertisementData,
        } as any)
        .select()
        .single();

      if (error) {
        console.error("Error creating advertisement:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error creating advertisement:", error);
      return null;
    }
  }

  static async getInactiveCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("advertisements")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_active", false);
    if (error) {
      console.error("Error counting inactive ads:", error);
      return 0;
    }
    return count || 0;
  }

  static async hasActiveAd(userId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from("advertisements")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_active", true);
    if (error) {
      console.error("Error checking active ad:", error);
      return false;
    }
    return (count || 0) > 0;
  }

  static async getUserAdvertisements(userId: string): Promise<Advertisement[]> {
    try {
      const { data, error } = await supabase
        .from("advertisements")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching user advertisements:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching user advertisements:", error);
      return [];
    }
  }

  static async getAllActiveAdvertisements(): Promise<Advertisement[]> {
    try {
      const { data, error } = await supabase
        .from("advertisements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching advertisements:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error fetching advertisements:", error);
      return [];
    }
  }

  static async updateAdvertisement(
    advertisementId: string,
    updates: AdvertisementUpdate
  ): Promise<Advertisement | null> {
    try {
      const { data, error } = await supabase
        .from("advertisements")
        .update(updates)
        .eq("id", advertisementId)
        .select()
        .single();

      if (error) {
        console.error("Error updating advertisement:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error updating advertisement:", error);
      return null;
    }
  }

  static async addAvailabilitySlots(
    advertisementId: string,
    slots: { available_date: string; start_time: string; end_time: string }[]
  ): Promise<boolean> {
    try {
      if (!slots.length) return true;
      const { error } = await supabase
        .from("advertisement_availability")
        .insert(
          slots.map((s) => ({
            advertisement_id: advertisementId,
            available_date: s.available_date,
            start_time: s.start_time,
            end_time: s.end_time,
          }))
        );

      if (error) {
        console.error("Error adding availability slots:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error adding availability slots:", error);
      return false;
    }
  }

  static async deleteAdvertisement(advertisementId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("advertisements")
        .delete()
        .eq("id", advertisementId);

      if (error) {
        console.error("Error deleting advertisement:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      return false;
    }
  }

  static async deactivateAdvertisement(
    advertisementId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("advertisements")
        .update({ is_active: false })
        .eq("id", advertisementId);

      if (error) {
        console.error("Error deactivating advertisement:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error deactivating advertisement:", error);
      return false;
    }
  }
}
