import { supabase } from "./supabase";
import { Database } from "../types/database";

type Advertisement = Database["public"]["Tables"]["advertisements"]["Row"];
type AdvertisementInsert =
  Database["public"]["Tables"]["advertisements"]["Insert"];
type AdvertisementUpdate =
  Database["public"]["Tables"]["advertisements"]["Update"];

export class AdvertisementService {
  static async getAdvertisementById(
    advertisementId: string
  ): Promise<Advertisement | null> {
    try {
      const { data, error } = await supabase
        .from("advertisements")
        .select("*")
        .eq("id", advertisementId)
        .single();
      if (error) {
        console.error("Error fetching advertisement by id:", error);
        return null;
      }
      return data ?? null;
    } catch (error) {
      console.error("Error fetching advertisement by id:", error);
      return null;
    }
  }

  static async getAvailabilitySlots(
    advertisementId: string
  ): Promise<
    { available_date: string; start_time: string; end_time: string }[]
  > {
    try {
      const { data, error } = await supabase
        .from("advertisement_availability")
        .select("available_date, start_time, end_time")
        .eq("advertisement_id", advertisementId)
        .order("available_date", { ascending: true })
        .order("start_time", { ascending: true });
      if (error) {
        console.error("Error fetching availability slots:", error);
        return [];
      }
      return (data as any[]) || [];
    } catch (error) {
      console.error("Error fetching availability slots:", error);
      return [];
    }
  }

  static async addLocations(
    advertisementId: string,
    labels: string[]
  ): Promise<boolean> {
    try {
      const cleaned = (labels || [])
        .map((l) => String(l).trim())
        .filter((l) => l.length > 0);
      if (!cleaned.length) return true;
      const { error } = await supabase
        .from("advertisement_locations")
        .insert(
          cleaned.map((label, idx) => ({
            advertisement_id: advertisementId,
            label,
            order_index: idx,
          }))
        );
      if (error) {
        console.error("Error adding locations:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error adding locations:", error);
      return false;
    }
  }

  static async getLocations(
    advertisementId: string
  ): Promise<{ label: string }[]> {
    try {
      const { data, error } = await supabase
        .from("advertisement_locations")
        .select("label")
        .eq("advertisement_id", advertisementId)
        .order("order_index", { ascending: true });
      if (error) {
        console.error("Error fetching locations:", error);
        return [];
      }
      return (data as any[]) || [];
    } catch (error) {
      console.error("Error fetching locations:", error);
      return [];
    }
  }

  // duplicate removed

  static async replaceLocations(
    advertisementId: string,
    labels: string[]
  ): Promise<boolean> {
    const cleared = await this.deleteLocations(advertisementId);
    if (!cleared) return false;
    return this.addLocations(advertisementId, labels);
  }

  static async deleteLocations(advertisementId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("advertisement_locations")
        .delete()
        .eq("advertisement_id", advertisementId);
      if (error) {
        console.error("Error deleting locations:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error deleting locations:", error);
      return false;
    }
  }
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

  static async deleteAvailabilitySlots(
    advertisementId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("advertisement_availability")
        .delete()
        .eq("advertisement_id", advertisementId);
      if (error) {
        console.error("Error deleting availability slots:", error);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error deleting availability slots:", error);
      return false;
    }
  }

  static async replaceAvailabilitySlots(
    advertisementId: string,
    slots: { available_date: string; start_time: string; end_time: string }[]
  ): Promise<boolean> {
    const cleared = await this.deleteAvailabilitySlots(advertisementId);
    if (!cleared) return false;
    return this.addAvailabilitySlots(advertisementId, slots);
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
