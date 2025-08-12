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
  // Save or update user profile from Auth0 data
  static async upsertUserFromAuth0(
    auth0User: any
  ): Promise<UserProfile | null> {
    try {
      const userData = {
        email: auth0User.email,
        name: auth0User.given_name || "",
        surname: auth0User.family_name || "",
        picture: auth0User.picture || null,
        user_type: "pending",
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("users")
        .update(userData)
        .eq("id", auth0User.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating user:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error in upsertUserFromAuth0:", error);
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
