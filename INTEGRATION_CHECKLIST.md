# Integration Checklist for Reviews & Enhanced Search

## ✅ Already Implemented

1. **Enhanced Search Filters** - ✅ Fully integrated in SearchResults.tsx

   - Price range filters
   - Skills filtering
   - Rating filters
   - Verified only filter
   - Has reviews filter

2. **Search Results Rating Display** - ✅ Shows ratings in search cards

   - Displays ownerRating and ownerReviewsCount
   - Shows star rating with count

3. **Review System Components** - ✅ Created

   - ReviewModal.tsx
   - ReviewsList.tsx
   - reviewService.ts

4. **Database Migrations** - ✅ Created
   - Reviews system tables and policies
   - Enhanced search filters in search_ads RPC
   - RLS performance optimizations

---

## ❌ Missing Integrations

### 1. **Profile Page - Bookings Tab** (HIGH PRIORITY)

**File:** `src/app/profile/page.tsx`

**What's Missing:**

- ReviewModal component not imported
- No review button for completed bookings
- No check if booking already has review
- Booking data doesn't include `advertisement_id` and `counterparty_id` needed for reviews

**What Needs to be Done:**

1. Import ReviewModal and ReviewsList
2. Add state for `reviewingBooking`
3. Add review button next to completed bookings
4. Check if booking already has a review (hide button if reviewed)
5. Extend `get_my_bookings` RPC to include:
   - `advertisement_id` (to link review to ad)
   - `counterparty_id` (the user being reviewed)
   - `has_review` (boolean flag if review exists)

**Code Location:** Around line 940-1000 where bookings are displayed

---

### 2. **User Profile Page** (HIGH PRIORITY)

**File:** `src/app/user/[id]/page.tsx`

**What's Missing:**

- ReviewsList component not imported or displayed
- Only shows rating count, not actual reviews

**What Needs to be Done:**

1. Import ReviewsList component
2. Add ReviewsList section after the profile bio
3. Pass the user's ID to ReviewsList
4. Show rating stats (already shows rating, but not breakdown)

**Code Location:** After line 105 (after the bio section)

---

### 3. **Advertisement Detail Page** (MEDIUM PRIORITY)

**File:** `src/app/advertisement/[id]/page.tsx`

**What's Missing:**

- ReviewsList component not imported or displayed
- No reviews shown for the advertisement owner

**What Needs to be Done:**

1. Import ReviewsList component
2. Add ReviewsList section showing reviews for `ad.user_id`
3. Display rating stats prominently near owner info

**Code Location:** After line 300 (after skills/experience section)

---

### 4. **Database Migration - Extend get_my_bookings** (HIGH PRIORITY)

**File:** New migration file needed

**What's Missing:**

- `get_my_bookings` RPC doesn't return `advertisement_id`
- `get_my_bookings` RPC doesn't return `counterparty_id`
- `get_my_bookings` RPC doesn't return `has_review` flag

**What Needs to be Done:**

1. Create new migration file
2. Modify `get_my_bookings` to:
   - Join with bookings table to get advertisement_id (if bookings table has it)
   - Calculate counterparty_id (parent or nanny depending on viewer)
   - Check if review exists for this booking
3. Add these fields to the return table

**Note:** Need to check if bookings table has `advertisement_id` column. If not, may need to add it or derive it from booking context.

---

### 5. **Booking Completion Flow** (MEDIUM PRIORITY)

**What's Missing:**

- Need to verify how bookings are marked as "completed"
- Need to ensure completed bookings trigger review availability

**What Needs to be Done:**

1. Check booking status update flow
2. Verify bookings can be marked as "completed"
3. Ensure review button only shows for "completed" bookings
4. Add UI to mark booking as completed (if not automated)

---

### 6. **Review Button Logic** (MEDIUM PRIORITY)

**What's Missing:**

- Function to check if booking already has review
- Logic to determine who can review whom

**What Needs to be Done:**

1. Use `can_user_review` RPC function (already exists)
2. Check review existence before showing button
3. Determine reviewee_id based on booking:
   - If user is parent → reviewee is nanny
   - If user is nanny → reviewee is parent

---

## Implementation Order

### Phase 1: Database (Do First)

1. ✅ Run migration `20250826100000_reviews_system_fixed.sql`
2. ✅ Run migration `20250826110000_enhanced_search_filters.sql`
3. ✅ Run migration `20250826120000_fix_reviews_rls_performance.sql`
4. ⚠️ **NEW:** Create migration to extend `get_my_bookings` with review fields

### Phase 2: Profile Page Integration

1. Add ReviewModal to profile page
2. Add review button for completed bookings
3. Test review creation flow

### Phase 3: Display Reviews

1. Add ReviewsList to user profile page
2. Add ReviewsList to advertisement detail page
3. Verify rating displays work correctly

### Phase 4: Testing

1. Test complete review flow:
   - Complete a booking
   - Write a review
   - View reviews on profile
   - View reviews on ad page
2. Test enhanced search filters
3. Test rating displays in search results

---

## Quick Reference: Component Props

### ReviewModal

```typescript
<ReviewModal
  bookingId={string}
  advertisementId={string}
  revieweeId={string}
  revieweeName={string}
  onClose={() => void}
  onSuccess={() => void}
/>
```

### ReviewsList

```typescript
<ReviewsList
  userId={string}
  showStats={boolean} // default: true
/>
```

---

## Database Schema Reference

### Reviews Table

- `id` (uuid)
- `advertisement_id` (uuid) - links to ad
- `booking_id` (uuid) - links to booking
- `reviewer_id` (uuid) - user writing review
- `reviewee_id` (uuid) - user being reviewed
- `rating` (1-5)
- `title` (text, nullable)
- `comment` (text)
- `response` (text, nullable) - owner response
- `is_verified` (boolean) - from booking

### Bookings Table (current)

- `id` (uuid)
- `nanny_id` (uuid)
- `parent_id` (uuid)
- `start_date` (date)
- `end_date` (date)
- `status` (pending|confirmed|cancelled|completed)
- `total_amount` (numeric)

**Note:** Bookings table may need `advertisement_id` column if not present.
