export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          given_name: string | null;
          family_name: string | null;
          name: string | null;
          picture: string | null;
          user_type: "parent" | "nanny" | "pending" | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          given_name?: string | null;
          family_name?: string | null;
          name?: string | null;
          picture?: string | null;
          user_type?: "parent" | "nanny" | "pending" | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          given_name?: string | null;
          family_name?: string | null;
          name?: string | null;
          picture?: string | null;
          user_type?: "parent" | "nanny" | "pending" | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      advertisements: {
        Row: {
          id: string;
          user_id: string;
          type: "short-term" | "long-term";
          title: string;
          description: string;
          experience: string;
          skills: string[];
          availability_start_time: string | null;
          availability_end_time: string | null;
          location_city: string;
          location_address: string | null;
          location_zip_code: string | null;
          price_per_hour: number;
          additional_info: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "short-term" | "long-term";
          title: string;
          description: string;
          experience: string;
          skills?: string[];
          availability_start_time?: string | null;
          availability_end_time?: string | null;
          location_city: string;
          location_address?: string | null;
          location_zip_code?: string | null;
          price_per_hour: number;
          additional_info?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: "short-term" | "long-term";
          title?: string;
          description?: string;
          experience?: string;
          skills?: string[];
          availability_start_time?: string | null;
          availability_end_time?: string | null;
          location_city?: string;
          location_address?: string | null;
          location_zip_code?: string | null;
          price_per_hour?: number;
          additional_info?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
