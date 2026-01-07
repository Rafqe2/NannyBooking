-- Remove availability slot when booking is confirmed
-- When a nanny confirms a booking, remove the corresponding date from their advertisement availability

-- Update respond_booking function to remove availability slot when confirming
CREATE OR REPLACE FUNCTION public.respond_booking(
  p_booking_id uuid,
  p_action text
) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := (select auth.uid());
  v_parent_user_id uuid;
  v_nanny_user_id uuid;
  v_status text;
  v_ad_id uuid;
  v_booking_date date;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  
  select b.parent_id, b.nanny_id, b.status, b.advertisement_id, b.start_date
  into v_parent_user_id, v_nanny_user_id, v_status, v_ad_id, v_booking_date
  from public.bookings b
  where b.id = p_booking_id;
  
  if not found then raise exception 'booking not found'; end if;
  if v_status <> 'pending' then raise exception 'booking not pending'; end if;

  if p_action = 'confirm' then
    if v_uid <> v_nanny_user_id and v_uid <> v_parent_user_id then 
      raise exception 'not a participant'; 
    end if;
    if v_uid = v_nanny_user_id then
      -- Update booking status to confirmed
      update public.bookings set status = 'confirmed' where id = p_booking_id;
      
      -- Remove the availability slot for this date from the advertisement
      -- Only remove if this is a short-term ad (has availability slots)
      if v_ad_id is not null and v_booking_date is not null then
        delete from public.advertisement_availability
        where advertisement_id = v_ad_id
          and available_date = v_booking_date;
      end if;
    else
      raise exception 'only nanny can confirm';
    end if;
  elsif p_action = 'cancel' then
    if v_uid <> v_nanny_user_id and v_uid <> v_parent_user_id then 
      raise exception 'not a participant'; 
    end if;
    update public.bookings set status = 'cancelled' where id = p_booking_id;
  else
    raise exception 'invalid action';
  end if;
end; $$;

REVOKE ALL ON FUNCTION public.respond_booking(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.respond_booking(uuid, text) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Updated respond_booking to remove availability slots when booking is confirmed! ✅';
END $$;

