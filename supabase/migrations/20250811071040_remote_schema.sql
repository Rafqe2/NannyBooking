

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."check_nanny_availability"("p_nanny_id" "uuid", "p_start_date" "date", "p_end_date" "date") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
declare
  unavailable_dates integer;
begin
  select count(*)
  into unavailable_dates
  from public.nanny_availability a
  where a.nanny_id = p_nanny_id
    and a.date between p_start_date and p_end_date
    and a.available = false;

  return unavailable_dates = 0;
end;
$$;


ALTER FUNCTION "public"."check_nanny_availability"("p_nanny_id" "uuid", "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_available_nannies"("p_location" character varying, "p_start_date" "date", "p_end_date" "date") RETURNS TABLE("nanny_id" "uuid", "user_id" "uuid", "name" character varying, "surname" character varying, "location" character varying, "hourly_rate" numeric, "experience_years" integer, "languages" "text"[], "availability" character varying, "verified" boolean, "rating" numeric, "reviews_count" integer, "bio" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  return query
    select
      n.id as nanny_id,
      n.user_id,
      u.name,
      u.surname,
      n.location,
      n.hourly_rate,
      n.experience_years,
      n.languages,
      n.availability,
      n.verified,
      n.rating,
      n.reviews_count,
      n.bio
    from public.nannies n
    join public.users u on n.user_id = u.id
    where n.location ilike '%' || p_location || '%'
      and public.check_nanny_availability(n.id, p_start_date, p_end_date)
    order by n.rating desc, n.reviews_count desc;
end;
$$;


ALTER FUNCTION "public"."get_available_nannies"("p_location" character varying, "p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_auth_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  insert into public.users (id, email, name, surname, picture)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'family_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_auth_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  insert into public.users (id, email, name, surname, picture)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'family_name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_nanny_rating"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  update public.nannies
  set
    rating = (
      select coalesce(avg(r.rating), 0)
      from public.reviews r
      where r.nanny_id = coalesce(new.nanny_id, old.nanny_id)
    ),
    reviews_count = (
      select count(*)
      from public.reviews r
      where r.nanny_id = coalesce(new.nanny_id, old.nanny_id)
    )
  where id = coalesce(new.nanny_id, old.nanny_id);

  return coalesce(new, old);
end;
$$;


ALTER FUNCTION "public"."update_nanny_rating"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."advertisements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "type" character varying(20) NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "experience" "text" NOT NULL,
    "skills" "text"[] DEFAULT '{}'::"text"[],
    "availability_start_time" time without time zone,
    "availability_end_time" time without time zone,
    "location_city" character varying(100) NOT NULL,
    "location_address" character varying(255),
    "location_zip_code" character varying(20),
    "price_per_hour" numeric(8,2) NOT NULL,
    "additional_info" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "advertisements_type_check" CHECK ((("type")::"text" = ANY ((ARRAY['short-term'::character varying, 'long-term'::character varying])::"text"[])))
);


ALTER TABLE "public"."advertisements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nanny_id" "uuid" NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "bookings_check" CHECK (("end_date" >= "start_date")),
    CONSTRAINT "bookings_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'confirmed'::character varying, 'cancelled'::character varying, 'completed'::character varying])::"text"[]))),
    CONSTRAINT "bookings_total_amount_check" CHECK (("total_amount" >= (0)::numeric))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nannies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "location" character varying(255) NOT NULL,
    "hourly_rate" numeric(8,2) NOT NULL,
    "experience_years" integer NOT NULL,
    "languages" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "availability" character varying(255) NOT NULL,
    "verified" boolean DEFAULT false,
    "rating" numeric(3,2) DEFAULT 0,
    "reviews_count" integer DEFAULT 0,
    "bio" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "nannies_experience_years_check" CHECK (("experience_years" >= 0)),
    CONSTRAINT "nannies_hourly_rate_check" CHECK (("hourly_rate" >= (0)::numeric)),
    CONSTRAINT "nannies_rating_check" CHECK ((("rating" >= (0)::numeric) AND ("rating" <= (5)::numeric))),
    CONSTRAINT "nannies_reviews_count_check" CHECK (("reviews_count" >= 0))
);


ALTER TABLE "public"."nannies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."nanny_availability" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nanny_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "available" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."nanny_availability" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nanny_id" "uuid" NOT NULL,
    "parent_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(100) NOT NULL,
    "surname" character varying(100) NOT NULL,
    "email" character varying(255) NOT NULL,
    "registry_date" timestamp with time zone DEFAULT "now"(),
    "user_type" character varying(20) NOT NULL,
    "additional_info" "text",
    "phone" "text",
    "location" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "picture" "text",
    "given_name" "text",
    "family_name" "text",
    CONSTRAINT "users_user_type_check" CHECK ((("user_type")::"text" = ANY (ARRAY[('parent'::character varying)::"text", ('nanny'::character varying)::"text", ('admin'::character varying)::"text", ('pending'::character varying)::"text"])))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."advertisements"
    ADD CONSTRAINT "advertisements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nannies"
    ADD CONSTRAINT "nannies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."nanny_availability"
    ADD CONSTRAINT "nanny_availability_nanny_id_date_key" UNIQUE ("nanny_id", "date");



ALTER TABLE ONLY "public"."nanny_availability"
    ADD CONSTRAINT "nanny_availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_nanny_id_parent_id_key" UNIQUE ("nanny_id", "parent_id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_advertisements_is_active" ON "public"."advertisements" USING "btree" ("is_active");



CREATE INDEX "idx_advertisements_location_city" ON "public"."advertisements" USING "btree" ("location_city");



CREATE INDEX "idx_advertisements_type" ON "public"."advertisements" USING "btree" ("type");



CREATE INDEX "idx_advertisements_user_id" ON "public"."advertisements" USING "btree" ("user_id");



CREATE INDEX "idx_bookings_dates" ON "public"."bookings" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_bookings_nanny_id" ON "public"."bookings" USING "btree" ("nanny_id");



CREATE INDEX "idx_bookings_parent_id" ON "public"."bookings" USING "btree" ("parent_id");



CREATE INDEX "idx_bookings_status" ON "public"."bookings" USING "btree" ("status");



CREATE INDEX "idx_nannies_location" ON "public"."nannies" USING "btree" ("location");



CREATE INDEX "idx_nannies_rating" ON "public"."nannies" USING "btree" ("rating");



CREATE INDEX "idx_nannies_user_id" ON "public"."nannies" USING "btree" ("user_id");



CREATE INDEX "idx_nannies_verified" ON "public"."nannies" USING "btree" ("verified");



CREATE INDEX "idx_nanny_availability_available" ON "public"."nanny_availability" USING "btree" ("available");



CREATE INDEX "idx_nanny_availability_date" ON "public"."nanny_availability" USING "btree" ("date");



CREATE INDEX "idx_nanny_availability_nanny_id" ON "public"."nanny_availability" USING "btree" ("nanny_id");



CREATE INDEX "idx_reviews_nanny_id" ON "public"."reviews" USING "btree" ("nanny_id");



CREATE INDEX "idx_reviews_parent_id" ON "public"."reviews" USING "btree" ("parent_id");



CREATE INDEX "idx_reviews_rating" ON "public"."reviews" USING "btree" ("rating");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



CREATE INDEX "idx_users_user_type" ON "public"."users" USING "btree" ("user_type");



CREATE OR REPLACE TRIGGER "update_advertisements_updated_at" BEFORE UPDATE ON "public"."advertisements" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_bookings_updated_at" BEFORE UPDATE ON "public"."bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_nannies_updated_at" BEFORE UPDATE ON "public"."nannies" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_nanny_rating_on_review_delete" AFTER DELETE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_nanny_rating"();



CREATE OR REPLACE TRIGGER "update_nanny_rating_on_review_insert" AFTER INSERT ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_nanny_rating"();



CREATE OR REPLACE TRIGGER "update_nanny_rating_on_review_update" AFTER UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_nanny_rating"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."advertisements"
    ADD CONSTRAINT "advertisements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_nanny_id_fkey" FOREIGN KEY ("nanny_id") REFERENCES "public"."nannies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nannies"
    ADD CONSTRAINT "nannies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."nanny_availability"
    ADD CONSTRAINT "nanny_availability_nanny_id_fkey" FOREIGN KEY ("nanny_id") REFERENCES "public"."nannies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_nanny_id_fkey" FOREIGN KEY ("nanny_id") REFERENCES "public"."nannies"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow profile creation during signup" ON "public"."users" FOR INSERT WITH CHECK ((("auth"."uid"() = "id") OR ("auth"."role"() = 'authenticated'::"text")));



CREATE POLICY "Anyone can view availability" ON "public"."nanny_availability" FOR SELECT USING (true);



CREATE POLICY "Anyone can view nannies" ON "public"."nannies" FOR SELECT USING (true);



CREATE POLICY "Anyone can view reviews" ON "public"."reviews" FOR SELECT USING (true);



CREATE POLICY "Authenticated users can view their profile" ON "public"."users" FOR SELECT USING ((("auth"."role"() = 'authenticated'::"text") AND ("auth"."uid"() = "id")));



CREATE POLICY "Nannies can manage their own availability" ON "public"."nanny_availability" USING (("auth"."uid"() IN ( SELECT "nannies"."user_id"
   FROM "public"."nannies"
  WHERE ("nannies"."id" = "nanny_availability"."nanny_id"))));



CREATE POLICY "Nannies can update their own profile" ON "public"."nannies" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Parents can create bookings" ON "public"."bookings" FOR INSERT WITH CHECK (("auth"."uid"() = "parent_id"));



CREATE POLICY "Parents can create reviews" ON "public"."reviews" FOR INSERT WITH CHECK (("auth"."uid"() = "parent_id"));



CREATE POLICY "Parents can delete their own reviews" ON "public"."reviews" FOR DELETE USING (("auth"."uid"() = "parent_id"));



CREATE POLICY "Parents can update their own reviews" ON "public"."reviews" FOR UPDATE USING (("auth"."uid"() = "parent_id"));



CREATE POLICY "Users can delete own profile" ON "public"."users" FOR DELETE USING (true);



CREATE POLICY "Users can delete their own advertisements" ON "public"."advertisements" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own profile" ON "public"."users" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can insert their own advertisements" ON "public"."advertisements" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own nanny profile" ON "public"."nannies" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own profile" ON "public"."users" FOR UPDATE USING (true);



CREATE POLICY "Users can update their own advertisements" ON "public"."advertisements" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own bookings" ON "public"."bookings" FOR UPDATE USING ((("auth"."uid"() = "parent_id") OR ("auth"."uid"() IN ( SELECT "nannies"."user_id"
   FROM "public"."nannies"
  WHERE ("nannies"."id" = "bookings"."nanny_id")))));



CREATE POLICY "Users can update their own profile" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view all active advertisements" ON "public"."advertisements" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Users can view own profile" ON "public"."users" FOR SELECT USING (true);



CREATE POLICY "Users can view their own bookings" ON "public"."bookings" FOR SELECT USING ((("auth"."uid"() = "parent_id") OR ("auth"."uid"() IN ( SELECT "nannies"."user_id"
   FROM "public"."nannies"
  WHERE ("nannies"."id" = "bookings"."nanny_id")))));



CREATE POLICY "Users can view their own profile" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "ads_delete_own" ON "public"."advertisements" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "ads_insert_own" ON "public"."advertisements" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "ads_select_active" ON "public"."advertisements" FOR SELECT USING (("is_active" = true));



CREATE POLICY "ads_update_own" ON "public"."advertisements" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."advertisements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nannies" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."nanny_availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_insert_self" ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "users_select_own" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "users_update_own" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."check_nanny_availability"("p_nanny_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."check_nanny_availability"("p_nanny_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_nanny_availability"("p_nanny_id" "uuid", "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_available_nannies"("p_location" character varying, "p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."get_available_nannies"("p_location" character varying, "p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_nannies"("p_location" character varying, "p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_auth_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_nanny_rating"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_nanny_rating"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_nanny_rating"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."advertisements" TO "anon";
GRANT ALL ON TABLE "public"."advertisements" TO "authenticated";
GRANT ALL ON TABLE "public"."advertisements" TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



GRANT ALL ON TABLE "public"."nannies" TO "anon";
GRANT ALL ON TABLE "public"."nannies" TO "authenticated";
GRANT ALL ON TABLE "public"."nannies" TO "service_role";



GRANT ALL ON TABLE "public"."nanny_availability" TO "anon";
GRANT ALL ON TABLE "public"."nanny_availability" TO "authenticated";
GRANT ALL ON TABLE "public"."nanny_availability" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
