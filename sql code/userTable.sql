create table public.users (
  id uuid not null default gen_random_uuid (),
  name character varying(100) not null,
  surname character varying(100) not null,
  email character varying(255) not null,
  registry_date timestamp with time zone null default now(),
  user_type character varying(20) not null,
  additional_info text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  picture text null,
  given_name text null,
  family_name text null,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_user_type_check check (
    (
      (user_type)::text = any (
        (
          array[
            'parent'::character varying,
            'nanny'::character varying,
            'admin'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_users_email on public.users using btree (email) TABLESPACE pg_default;

create index IF not exists idx_users_user_type on public.users using btree (user_type) TABLESPACE pg_default;

create trigger update_users_updated_at BEFORE
update on users for EACH row
execute FUNCTION update_updated_at_column ();