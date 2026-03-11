# Profile Page - Professional Improvement Plan

The profile page (`src/app/profile/page.tsx`) is currently ~2200 lines in a single component.
Below are categorized improvements to make it professional-grade.

---

## 1. Architecture & Code Quality

### Split into Sub-Components
The profile page manages 4 tabs with 40+ useState hooks. Break it into:
- `src/components/profile/JobAdsTab.tsx` - advertisement management
- `src/components/profile/BookingsTab.tsx` - bookings list, calendar, detail modal
- `src/components/profile/MessagesTab.tsx` - conversation list + message thread
- `src/components/profile/ProfileTab.tsx` - user info editing
- `src/components/profile/BookingDetailModal.tsx` - booking detail popup
- Keep shared state (user, active tab) in the parent, pass via props

### Type Safety
- Replace all `as any` casts with proper TypeScript interfaces
- Create `types/booking.ts`, `types/advertisement.ts`, `types/conversation.ts`
- Type the BookingItem, ConversationItem, and message objects properly

### State Management
- Consider using `useReducer` for the booking/message state machines
- Extract polling logic into custom hooks (`useConversations`, `useMessages`, `useBookings`)

---

## 2. UX Improvements

### Loading States
- Replace full-page spinner with skeleton loading (tab-specific skeletons)
- Add loading spinners on accept/decline/cancel buttons while processing
- Show skeleton cards while bookings and conversations load

### Booking Tab
- Add filter chips: "All", "Short-term", "Long-term" booking type filter
- Add search by counterparty name
- Show booking count summary (e.g., "3 pending, 2 confirmed, 5 completed")
- Improve pagination: larger buttons, show total pages, "First/Last" navigation
- For long-term bookings, show a distinct visual treatment (purple theme vs default)

### Messages Tab
- Add message search within conversations
- Add "Mark all as read" button
- Show typing indicator or "last seen" status
- Add conversation pinning/favoriting
- Show message timestamps grouped by day ("Today", "Yesterday", "Feb 15")
- Implement real-time WebSocket messaging (replace polling)

### Ads Tab
- Show ad performance stats (views, booking requests received)
- Add quick duplicate action for ads
- Show remaining active days for short-term ads
- Better empty state with illustration/icon

### Profile Tab
- Add profile completion percentage indicator
- Show verification badges (email verified, phone verified)
- Add profile photo upload
- Show user's average response time
- Add availability schedule display for nannies
- Make notification toggles functional (connect to backend)

---

## 3. Visual Polish

### Consistent Design System
- Standardize button sizes and styles (create reusable Button component)
- Standardize modal headers (gradient vs flat - pick one)
- Consistent spacing (use a spacing scale: 4, 8, 12, 16, 24, 32)
- Consistent card styles across all tabs

### Responsive Design
- Test and fix mobile layouts for all tabs
- Messages tab: improve mobile conversation switching
- Bookings tab: stack calendar above list on mobile
- Profile tab: full-width form fields on mobile

### Accessibility
- Add `aria-label` to all icon-only buttons
- Add keyboard navigation for tab switching
- Ensure proper focus management in modals (focus trap)
- Add screen reader announcements for toast notifications
- Color-code + text label for booking statuses (not just color dots)

---

## 4. Performance

### Data Fetching
- Use `Promise.all` for parallel data loading on initial render
- Cache conversation list between tab switches
- Implement virtual scrolling for long conversation/booking lists
- Debounce message sending to prevent double-sends

### Rendering
- Memoize expensive renders (booking cards, conversation items)
- Use `React.memo` for child components
- Lazy load tab content (only mount active tab's component)

---

## 5. Notifications System (Currently Non-Functional)

The email/SMS toggles in Profile tab are UI-only. To make them work:

### Email Notifications
- Add `notification_preferences` column to users table (JSONB)
- Create Supabase Edge Function triggered on booking status changes
- Send emails via Resend/SendGrid for: new booking, booking accepted, booking cancelled, new message

### Push Notifications (Future)
- Implement Web Push API with service worker
- Notify on: new booking requests, messages, booking status changes
- Add push notification toggle to profile settings

---

## 6. Security Hardening

- Add rate limiting on message sending
- Validate message content length server-side
- Add CSRF protection for profile updates
- Improve delete account flow: require password/OTP confirmation
- Add session timeout warning

---

## Priority Order

| Priority | Item | Impact |
|----------|------|--------|
| P0 | Split into sub-components | Maintainability |
| P0 | Fix notification toggles (remove or implement) | User trust |
| P1 | Skeleton loading states | Perceived performance |
| P1 | Type safety cleanup | Developer experience |
| P1 | Mobile responsive fixes | User reach |
| P2 | Message search + real-time | User engagement |
| P2 | Booking type filters | Usability |
| P2 | Profile photo upload | Professionalism |
| P3 | Accessibility improvements | Inclusivity |
| P3 | Performance optimizations | Scale readiness |
