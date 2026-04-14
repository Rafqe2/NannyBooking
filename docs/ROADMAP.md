# NannyBooking.lv - Platform Roadmap & Next Steps

*Last updated: March 2026*

## Current State Summary

The platform has core functionality working:
- User registration & authentication (Google OAuth via Supabase)
- Profile management (parent/nanny) — split into 4 tab sub-components (JobAds, Bookings, Messages, Profile)
- Advertisement creation & management (short-term + long-term)
- Search with location, date, and skill filters
- Booking system (create, accept, decline, cancel with reasons)
- In-app messaging between parents and nannies (polling-based, one conversation per participant pair)
- Message flow control: template → contact sharing → contact shared state with re-engagement templates
- Review/rating system after completed bookings
- Multi-language support (EN, LV, RU)
- Admin panel at `/admin` (users, ads, stats)
- SEO: sitemap, robots.txt, OG images, JSON-LD structured data
- PWA manifest (icons still needed)
- Auth flash (FOUC) eliminated — `useSupabaseUser` uses `onAuthStateChange` for instant session resolution

---

## Phase 1: Stability & Polish ✅ Mostly Complete

### Code Quality
- [x] Fix booking limit error message display
- [x] Add error boundaries (profile tabs, search results grid)
- [x] Replace all hardcoded English strings with translation keys (full audit)
- [x] Add comments to service/logic files
- [x] Remove dead code (`disabled={false}`, stale comments, unused lib files)
- [x] Profile page refactored from ~2200 lines into 4 tab sub-components
- [x] Booking accept `relation "public.nannies" does not exist` error fixed (trigger chain rewrite)
- [x] Duplicate messaging tabs fixed — one conversation per participant pair (schema + RPC)
- [x] Auth flash (FOUC) fixed — `useSupabaseUser` now uses `onAuthStateChange`
- [ ] Have native speakers review LV and RU translations for accuracy

### Security ✅ Done

- [x] Fix overly broad users RLS — created `user_public_info` view (email/phone no longer exposed)
- [x] Fix error message leaking env var names in `/api/account/delete`
- [x] Organized public assets into `public/icons/` and `public/images/`
- [ ] **TODO**: Add PWA icons — use realfavicongenerator.net, place in `public/icons/`: `favicon.ico` (32×32), `apple-touch-icon.png` (180×180), `icon-192.png` (192×192), `icon-512.png` (512×512)

### Database
- [x] Remove `nannies` table (deprecated) — migration `20250830040000`
- [x] Add `user_public_info` view — migration `20250829000000`
- [x] Fix `auto_deactivate_fully_booked_ads()` trigger (removed `nannies` join) — migration `20250830020000`
- [x] Consolidate conversations to one per participant pair — migration `20250830030000`
- [ ] **TODO**: Run pending migrations in Supabase SQL editor (if not already applied):
  - `20250829000000_restrict_users_rls_with_public_view.sql`
  - `20250830020000_fix_auto_deactivate_nannies_ref.sql`
  - `20250830030000_conversations_per_participant_pair.sql`
  - `20250830040000_cleanup_legacy_nannies.sql`

---

## Phase 2: Trust & Safety (2-3 weeks)

### User Verification
- [ ] Email verification flow (required before posting ads)
- [ ] Phone number verification via SMS (Twilio/MessageBird)
- [ ] Display verification badges on profiles and ads
- [ ] ID document upload & manual review process
- [ ] Background check integration (Latvia-specific provider)

### Content Moderation
- [ ] Ad content review queue (admin panel)
- [ ] Profanity filter for messages and reviews
- [ ] Report user/ad functionality with admin review
- [ ] Automatic flagging of suspicious accounts (multiple cancellations, bad reviews)

### Safety Features
- [ ] Emergency contact field on booking details
- [ ] Booking check-in/check-out confirmation
- [ ] Location sharing during active bookings (opt-in)
- [ ] Parent identity verification before first booking

---

## Phase 3: Notifications & Communication (1-2 weeks)

### Email Notifications
- [ ] New booking request received
- [ ] Booking accepted/declined
- [ ] Booking cancelled
- [ ] New message received (batched, not per-message)
- [ ] Review received
- [ ] Ad expiring soon reminder
- [ ] Weekly booking summary digest
- **Implementation**: Supabase Edge Functions + Resend/SendGrid

### Real-Time Messaging
- [ ] Replace polling with Supabase Realtime subscriptions
- [ ] Online/offline status indicators
- [ ] Message read receipts
- [ ] Typing indicators

### Push Notifications (Web)
- [ ] Service worker for push notifications
- [ ] Browser permission prompt
- [ ] Notification preferences in profile settings

---

## Phase 4: Enhanced Search & Discovery (2 weeks)

### Search Improvements
- [ ] Map view for search results (Leaflet/Mapbox with Latvia focus)
- [ ] "Near me" search using browser geolocation
- [ ] Save search filters / saved searches
- [ ] Search by nanny name
- [x] Sort results by: price (asc/desc), rating, newest
- [ ] "Featured" or "Verified" badge boost in search ranking

### Recommendations
- [ ] "Recommended for you" based on past bookings
- [x] "Recently viewed" section on homepage (localStorage, last 6 ads)
- [ ] "Popular in your area" section

### SEO & Landing Pages
- [x] Dynamic meta tags per ad page (title, description, OG, Twitter)
- [ ] City-specific landing pages (e.g., /nannies/riga)
- [ ] Structured data (JSON-LD) for Google rich results
- [x] Sitemap generation (/sitemap.xml auto-generated from active ads)
- [x] robots.txt (/robots.txt blocks private routes, allows ads)

---

## Phase 5: Payment & Billing (3-4 weeks)  

### Payment Integration
- [ ] Stripe integration for Latvia (EUR)
- [ ] Secure payment hold on booking confirmation
- [ ] Automatic payout to nanny after completed booking
- [ ] Cancellation refund policies (configurable)
- [ ] Payment history in profile

### Platform Fees
- [ ] Service fee structure (% per booking or subscription)
- [ ] Invoice generation for nannies (tax compliance)
- [ ] Promo codes / referral discounts

### Subscription Model (Optional)
- [ ] Free tier: X bookings/month, basic visibility
- [ ] Premium tier: unlimited bookings, priority in search, verified badge
- [ ] Nanny Pro tier: highlighted ads, analytics dashboard

---

## Phase 6: Admin Panel (2-3 weeks)

### Dashboard
- [x] User statistics (registrations, active users, new last 7 days)
- [x] Booking statistics (pending/confirmed/completed/cancelled)
- [x] Ad statistics (active/inactive, short/long-term)
- [ ] Geographic distribution map

### Management
- [x] User management (view, suspend, delete accounts) at `/admin/users`
- [x] Ad moderation (view, delete) at `/admin/ads`
- [ ] Review moderation (flag/remove inappropriate reviews)
- [ ] Report handling workflow
- [ ] System announcements / maintenance mode
- Admin panel protected by `user_type = "admin"` check; link shown in header for admins

### Analytics
- [x] Google Analytics integration (activated via `NEXT_PUBLIC_GA_MEASUREMENT_ID` env var)
- [ ] Conversion funnel tracking (search -> view ad -> book)
- [ ] User engagement metrics

---

## Phase 7: Mobile & Performance (2-3 weeks)

### Progressive Web App (PWA)
- [ ] Service worker for offline support
- [x] App manifest for "Add to Home Screen" (public/manifest.json)
- [ ] Offline-capable message queue
- [ ] Background sync for bookings

### Performance Optimization
- [ ] Image optimization (profile photos, ad images)
- [x] Code splitting per route (already handled by Next.js)
- [ ] API response caching (SWR/React Query)
- [ ] Database query optimization (indexes, materialized views)
- [ ] CDN for static assets

### Mobile-Specific UX
- [ ] Bottom navigation bar on mobile
- [ ] Swipe gestures for tab navigation
- [ ] Pull-to-refresh on lists
- [ ] Touch-optimized date picker

---

## Phase 8: Growth & Marketing (Ongoing)

### Referral System
- [ ] Invite friends feature (unique referral links)
- [ ] Reward for both referrer and referee (e.g., free booking credit)
- [ ] Referral tracking dashboard

### Social Features
- [ ] Shareable ad links with Open Graph preview images
- [ ] "Share on social media" buttons
- [ ] Testimonials section on landing page

### Content & Community
- [ ] Blog section (childcare tips, safety guides)
- [ ] FAQ page
- [ ] Help center / knowledge base
- [ ] Community guidelines page

### Legal & Compliance
- [ ] GDPR-compliant privacy policy
- [ ] Terms of service
- [ ] Cookie consent banner
- [ ] Data export functionality (GDPR right to data portability)
- [ ] Right to be forgotten (account deletion with full data wipe)

---

## Technical Debt to Address

| Area | Issue | Priority | Status |
|------|-------|----------|--------|
| Profile page | ~2200 lines in single component | High | ✅ Done — split into 4 tab components |
| Type safety | Excessive `any` usage in service files | Medium | Partially fixed |
| Polling | Messages use 10-30s polling instead of Supabase Realtime | Medium | Planned (Phase 3) |
| Notification UI | Toggle switches in profile are UI-only (no backend) | Medium | Planned (Phase 3) |
| Pending migrations | 4 migrations not yet applied to Supabase cloud | High | See Database section above |
| PWA icons | Icon files missing from `public/icons/` | Low | See Go-Live Checklist |

---

## Recommended Implementation Order

1. **Phase 1** - Stability (foundation for everything else)
2. **Phase 2** - Trust & Safety (critical for a childcare platform)
3. **Phase 3** - Notifications (user retention)
4. **Phase 6** - Admin Panel (needed to manage growing userbase)
5. **Phase 4** - Search & Discovery (growth)
6. **Phase 5** - Payments (monetization)
7. **Phase 7** - Mobile & Performance (scale)
8. **Phase 8** - Growth & Marketing (expansion)

---

## Go-Live Checklist

Steps to complete when deploying the platform publicly for the first time.

### 1. Set up Google Analytics (GA4)

The GA script is already in the codebase — it just needs an ID to activate.

1. Go to [analytics.google.com](https://analytics.google.com)
2. Click **Admin** (gear icon, bottom left) → **+ Create** → **Property**
3. Name it "NannyBooking.lv", set timezone to Europe/Riga, currency EUR
4. Choose platform: **Web**
5. Enter URL `https://nannybooking.lv` and a stream name, click **Create stream**
6. Copy the **Measurement ID** — format: `G-XXXXXXXXXX`
7. In Vercel: go to your project → **Settings** → **Environment Variables**
8. Add variable: `NEXT_PUBLIC_GA_MEASUREMENT_ID` = `G-XXXXXXXXXX`
9. Redeploy the project
10. Verify: open the live site, then check **GA4 → Reports → Realtime** — you should see yourself as 1 active user

### 2. Set First Admin User

After deploying, run this in the **Supabase SQL Editor** to grant yourself admin access:

```sql
UPDATE public.users
SET user_type = 'admin'
WHERE email = 'your@email.com';
```

Then visit `/admin` on the live site — the Admin Panel link will appear in the header dropdown.

### 3. Add PWA Icons

The manifest references icon files that need to be created. Use **realfavicongenerator.net** and place files in `public/icons/`:
- `public/icons/favicon.ico` — 32×32 browser tab icon
- `public/icons/apple-touch-icon.png` — 180×180 iOS home screen icon
- `public/icons/icon-192.png` — 192×192 Android PWA icon
- `public/icons/icon-512.png` — 512×512 splash screen icon

These are referenced in `src/app/layout.tsx` and `public/manifest.json`.

### 4. Verify robots.txt and sitemap

- Visit `https://nannybooking.lv/robots.txt` — should show disallow rules for `/profile`, `/admin/`, etc.
- Visit `https://nannybooking.lv/sitemap.xml` — should list all active advertisement URLs
- Submit the sitemap to [Google Search Console](https://search.google.com/search-console)

### 5. Submit to Google Search Console

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add property: `https://nannybooking.lv`
3. Verify ownership (use the HTML tag method — add a `<meta name="google-site-verification">` tag or use the GA connection)
4. Submit sitemap: enter `https://nannybooking.lv/sitemap.xml`

---

*Last updated: February 2026*
