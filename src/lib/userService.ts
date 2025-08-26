import { supabase } from "./supabase";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  surname: string;
  user_type: "parent" | "nanny" | "admin" | "pending";
  picture?: string;
  additional_info?: string;
  phone?: string;
  location?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

export class UserService {
  // Upsert/refresh user profile from Supabase auth user metadata
  static async upsertUserFromAuth(sessionUser: {
    id: string;
    email: string;
    user_metadata?: Record<string, any> | null;
  }): Promise<UserProfile | null> {
    try {
      const meta = sessionUser.user_metadata || {};
      const userData = {
        email: sessionUser.email,
        name: (meta as any).given_name || (meta as any).name || "",
        surname: (meta as any).family_name || "",
        picture: (meta as any).picture || null,
        updated_at: new Date().toISOString(),
      } as Partial<UserProfile>;

      const { data, error } = await supabase
        .from("users")
        .update(userData)
        .eq("id", sessionUser.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating user:", error);
        return null;
      }

      return data as any;
    } catch (error) {
      console.error("Error in upsertUserFromAuth:", error);
      return null;
    }
  }

  // Get public profile via RPC (safe for viewers)
  static async getPublicProfileById(userId: string): Promise<
    | {
        user_id: string;
        full_name: string | null;
        picture: string | null;
        member_since: string | null;
        bio: string | null;
        user_type: string | null;
        rating: number | null;
        reviews_count: number | null;
      }
    | null
  > {
    try {
      const { data, error } = await supabase.rpc(
        "get_user_public_profile",
        {
          p_user_id: userId,
        }
      );
      if (error) {
        // eslint-disable-next-line no-console
        console.error("Error getting public user:", error);
        return null;
      }
      const row = Array.isArray(data) ? (data[0] as any) : (data as any);
      return row || null;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Error in getPublicProfileById:", error);
      return null;
    }
  }

  // Get user profile by email
  static async getUserByEmail(email: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (error) {
        console.error("Error getting user:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in getUserByEmail:", error);
      return null;
    }
  }

  // Get user profile by ID
  static async getUserById(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error getting user by id:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in getUserById:", error);
      return null;
    }
  }

  // Check if user profile is complete (has user_type set to parent/nanny, not pending)
  static async isProfileComplete(email: string): Promise<boolean> {
    try {
      const user = await this.getUserByEmail(email);
      // Consider profile complete if user exists and has a valid user_type (not pending)
      return (
        user?.user_type !== null &&
        user?.user_type !== undefined &&
        user?.user_type !== "pending"
      );
    } catch (error) {
      console.error("Error checking profile completion:", error);
      return false;
    }
  }

  // Complete user profile (update user_type and names)
  static async completeProfile(
    email: string,
    userType: "parent" | "nanny",
    name: string,
    surname: string
  ): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          user_type: userType,
          name: name.trim(),
          surname: surname.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("email", email)
        .select()
        .single();

      if (error) {
        console.error("Error completing profile:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in completeProfile:", error);
      return null;
    }
  }

  // Update user profile with additional info
  static async updateProfile(
    email: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("email", email)
        .select()
        .single();

      if (error) {
        console.error("Error updating profile:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in updateProfile:", error);
      return null;
    }
  }

  // Update profile by user id (preferred for RLS)
  static async updateProfileById(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from("users")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        console.error("Error updating profile by id:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in updateProfileById:", error);
      return null;
    }
  }
}
