# Supabase Backend Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login and create a new project
3. Choose a project name (e.g., "auklite")
4. Set a database password
5. Choose a region close to your users
6. Wait for the project to be created

## 2. Get Your Project Credentials

1. Go to your project dashboard
2. Navigate to Settings > API
3. Copy your:
   - Project URL
   - Anon/public key

## 3. Set Environment Variables

Create a `.env.local` file in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 4. Run SQL Migrations

Go to your Supabase dashboard > SQL Editor and run these migrations in order:

### Migration 1: Users Table

```sql
-- Copy and paste the content from sql-migrations/001_create_users_table.sql
```

### Migration 2: Nannies Table

```sql
-- Copy and paste the content from sql-migrations/002_create_nannies_table.sql
```

### Migration 3: Nanny Availability Table

```sql
-- Copy and paste the content from sql-migrations/003_create_nanny_availability_table.sql
```

### Migration 4: Reviews Table

```sql
-- Copy and paste the content from sql-migrations/004_create_reviews_table.sql
```

### Migration 5: Bookings Table

```sql
-- Copy and paste the content from sql-migrations/005_create_bookings_table.sql
```

### Migration 6: Functions

```sql
-- Copy and paste the content from sql-migrations/006_create_functions.sql
```

### Migration 7: Fix RLS Policies (IMPORTANT!)

```sql
-- Copy and paste the content from sql-migrations/007_fix_rls_policies.sql
```

## 5. Configure Authentication

1. Go to Authentication > Settings
2. **IMPORTANT**: Disable "Enable email confirmations" for testing (or keep enabled if you want email verification)
3. Configure your site URL (e.g., `http://localhost:3000` for development)
4. Add redirect URLs:
   - `http://localhost:3000/profile`
   - `http://localhost:3000/auth/callback`

## 6. Test the Setup

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000`
3. Try signing up a new user
4. Check if the user appears in your Supabase dashboard > Authentication > Users
5. Check if the user profile appears in your database > users table

## 7. Database Schema Overview

### Tables Created:

- **users**: User profiles with name, surname, email, date of birth (optional), etc.
- **nannies**: Nanny-specific information (location, hourly rate, experience)
- **nanny_availability**: Daily availability for each nanny
- **reviews**: Parent reviews for nannies
- **bookings**: Booking records between parents and nannies

### Security Features:

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Public read access for nanny listings
- Automatic rating updates when reviews are added

### Functions Created:

- `update_nanny_rating()`: Automatically updates nanny ratings
- `check_nanny_availability()`: Checks if nanny is available for dates
- `get_available_nannies()`: Gets available nannies for location and dates

## 8. Local Development

You don't need to run a local server for Supabase - it's a cloud service. However, you need:

1. **Next.js development server**: `npm run dev` (runs on localhost:3000)
2. **Supabase project**: Running in the cloud
3. **Environment variables**: Configured in `.env.local`

## 9. Production Deployment

When deploying to production:

1. Update your Supabase project settings with your production domain
2. Add production redirect URLs in Supabase Auth settings
3. Update environment variables in your hosting platform
4. Ensure your domain is added to Supabase Auth allowed origins

## 10. Troubleshooting

### Common Issues:

1. **CORS errors**: Check your Supabase Auth settings for allowed origins
2. **RLS policy errors**: Make sure users are authenticated before accessing protected data
3. **Environment variables not loading**: Restart your development server after adding `.env.local`
4. **"User not found" after email verification**: This is now fixed with automatic profile creation
5. **Sign up button not working**: Fixed with proper mode switching in AuthModal

### Debug Steps:

1. Check browser console for errors
2. Check Supabase dashboard > Logs for database errors
3. Verify environment variables are loaded correctly
4. Test authentication flow step by step

## 11. Recent Fixes Applied

### Fixed Issues:

1. **RLS Policy Violation**: Updated policies to allow user creation during signup
2. **Date of Birth**: Removed from registration form (now optional)
3. **User Not Found**: Added automatic profile creation for verified users
4. **Sign Up Button**: Fixed mode switching in authentication modal
5. **Profile Creation**: Enhanced error handling and automatic profile creation

### Key Changes:

- Made `date_born` optional in database schema
- Added automatic profile creation for users without profiles
- Fixed RLS policies to allow proper user registration
- Improved error handling in profile page
- Enhanced authentication modal with proper mode switching

## 12. Next Steps

After setup is complete:

1. Test user registration and login
2. Test profile creation and editing
3. Test nanny search functionality
4. Add more features like booking system
5. Implement payment processing
6. Add admin dashboard for user management

## 13. Security Best Practices

1. Never expose your service role key in client-side code
2. Always use RLS policies to protect data
3. Validate all user inputs
4. Use HTTPS in production
5. Regularly update dependencies
6. Monitor your Supabase usage and logs
