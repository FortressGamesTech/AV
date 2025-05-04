# Architecture Notes

## Project Structure (Step 1)

- **src/app/**: Main entry point for the Next.js App Router. Contains layout, global styles, and page components.
  - `layout.tsx`: Root layout for the app. Sets up theme, React Query provider, analytics, and now wraps the app in AuthProvider for authentication context (to be revisited).
  - `page.tsx`: Home page. Shows navigation, header, and onboarding steps. Handles Supabase connection check.
  - `globals.css`: Global Tailwind CSS styles.
- **src/components/**: Shared React components (e.g., AuthButton, Header, ThemeToggle, Sidebar, Breadcrumb) used throughout the app.
  - `Sidebar.tsx`: Pure client component with a hardcoded role and local menu config. Renders navigation reliably regardless of authentication state. Designed for incremental enhancement as authentication is reintroduced.
  - `Breadcrumb.tsx`: Client component for displaying current route as breadcrumb navigation.
- **src/providers/**: Context providers for theming, React Query, and (optionally) authentication/global state.
- **src/hooks/**: Custom React hooks for encapsulating logic (auth logic to be revisited).
- **src/utils/**: Utility functions (e.g., Supabase client creation, temporary auth utility).
- **src/mocks/**: Mock data or API handlers for testing and development.
- **src/test/**: Test utilities and files for automated testing.

## Navigation & Layout (Step 3)
- **Sidebar**: Implemented as a pure client component with a hardcoded role and local menu config. This ensures the sidebar always renders, enabling UI and feature development even if authentication is not yet finalized.
- **Breadcrumb**: Provides route context for users, improving navigation clarity.
- **Responsive Layout**: The layout supports both desktop and mobile navigation patterns.

## Storage & Uploads
- Supabase Storage is used for client uploads.
- RLS policies are in place for secure access.
- Cleanup scripts ensure DB and storage stay in sync.
- UI for uploads is modern, with uploader name, date, and size.

## Next Steps
- Enhance client list with filtering, sorting, and pagination.
- Add client history (past events) to client detail pages.
- Continue with event management features as per the implementation plan.

## Configuration
- **tailwind.config.js**: Tailwind CSS configuration, including custom colors and plugins.
- **package.json**: Lists all dependencies, scripts, and project metadata.
- **.env**: (Not committed) Should contain Supabase and other environment variables.

## Authentication Context (Step 2)
- **SupabaseAuthProvider**: Centralizes authentication state (user, session, role) and exposes login/logout methods. Makes it easy for any component to access authentication info and enforce role-based access.
- **Usage**: Wraps the entire app in `layout.tsx`, so all components can use the `useSupabaseAuth` hook to access auth state.

## Summary
This structure enables reliable navigation rendering and incremental development. The Sidebar can be enhanced with real authentication logic once the underlying issues are resolved, without blocking UI or feature progress.
