# SQL Files for Auklite Project

## 🔧 **Current Setup Files**

### `userTable.sql`

- **Purpose**: Your actual Supabase users table schema
- **Contains**: Complete table structure with name, surname, email, user_type, etc.
- **Status**: ✅ **ACTIVE** - This is your current database structure

### `fix-rls-policy.sql`

- **Purpose**: Fix Row-Level Security policies for Auth0 users
- **When to run**: If you get 401 errors when saving user data
- **Status**: ✅ **READY TO RUN** - Run this to fix RLS issues

### `update-user-type-constraint.sql`

- **Purpose**: Add "pending" as valid user_type to allow profile completion flow
- **When to run**: To fix profile completion redirect issues
- **Status**: ✅ **READY TO RUN** - Run this to fix profile completion

## 🗂️ **Other Files (Not Currently Used)**

### `setup-users-table.sql`

- **Purpose**: Minimal users table setup (old version)
- **Status**: ❌ **DEPRECATED** - Use userTable.sql instead

### `migration.sql`

- **Purpose**: Migration script (old version)
- **Status**: ❌ **DEPRECATED** - Use specific files above

### Other files:

- Various nanny-related schemas and functions
- Security policies and automation scripts
- **Status**: 🔄 **FUTURE USE** - For when you expand the app

## 🚀 **Quick Setup**

1. **Run `fix-rls-policy.sql`** - Fixes 401 errors
2. **Run `update-user-type-constraint.sql`** - Fixes profile completion redirects
3. **Your `userTable.sql`** - Already active, no changes needed

## 📝 **Current Flow**

1. User signs in with Auth0 (Google/Meta/Apple)
2. User gets `user_type: "pending"`
3. Redirected to complete-profile page
4. User selects Parent/Nanny
5. `user_type` updated to "parent"/"nanny"
6. Profile complete! ✅
