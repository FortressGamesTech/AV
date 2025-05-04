# AV Client File System (AVCFS) Implementation Plan

## Overview
This implementation plan provides a step-by-step guide for developing the AV Client File System (AVCFS) using Next.js and Supabase. The system will serve as a central operational tool for Fortress Games to plan, cost, quote, and measure ROI for events and activations.

## Tech Stack Summary
- **Frontend**: Next.js 14 (App Router) with React 18, TypeScript, Tailwind CSS, and shadcn/ui components
- **Backend**: Supabase with PostgreSQL for database management
- **Authentication**: Supabase Auth with role-based permissions
- **State Management**: TanStack Query v5 for client-side state management
- **PDF Generation**: react-pdf
- **Calendar/Timeline**: FullCalendar with Gantt extension

## Clarifications & Assumptions (as of 2024-06)

- **Database schema** is finalized and defined in `database-schema.md`.
- **User roles**: administrator, operations_manager, sales_manager, tech_lead, event_coordinator, with permissions as described below.
- **Authentication**: Email/password only (no social login).
- **File uploads**: Stored in Supabase Storage, max 10MB, allowed types: PDF, DOCX, XLSX, JPG, PNG. Basic file type validation only.
- **Custom Supabase functions**: 
  - Event total calculation (includes discounts/custom prices, excludes taxes)
  - Resource availability (handles overlapping events, minimum hours)
  - ROI calculation (supports actual and projected values)
  - All implemented as Postgres functions, exposed via lightweight API endpoints.
- **Event dates/times**: JSONB structure supports multi-day, recurring, and overlapping events. Example:
  ```json
  "event_dates": [
    {"date": "2025-06-15", "is_setup": false},
    {"date": "2025-06-16", "is_setup": false},
    {"date": "2025-06-17", "is_teardown": true}
  ],
  "event_times": [
    {"start": "09:00", "end": "17:00", "date_index": 0},
    {"start": "10:00", "end": "16:00", "date_index": 1}
  ]
  ```
- **Resource availability**: Initially labor only; equipment/inventory in future. Conflicts show visual warnings, can be overridden by management.
- **PDF generation**: On-demand, stored for download. Must include company logo, brand colors, fonts, header/footer with company info.
- **Analytics/dashboard**: KPIs include revenue, costs, margins, resource utilization, ROI. Filterable by location, client, event, date. Bar/column, line, and pie charts preferred. Export as CSV and PDF supported.
- **Mobile**: Responsive design, supports latest Chrome, Safari, Firefox, Edge. Focus on iOS (Safari) and Android (Chrome).
- **Testing/UAT**: Admin is sole UAT stakeholder. Any feedback tracking method is acceptable.
- **Deployment**: Vercel, standard security (HTTPS, auth), no special compliance.
- **Design system**: Use shadcn/ui and Tailwind defaults. No Figma or custom design system.

## User Roles & Permissions

- **Administrator**: Full access to all features.
- **Operations Manager**: Manage resources, review conflicts, approve staffing plans.
- **Sales Manager**: Handle pricing, create quotes, manage client communications.
- **Tech Lead**: Review labor requirements, manage inventory, flag conflicts.
- **Event Coordinator**: Create/manage events, add line items, generate event orders.

## Implementation Approach
The implementation will follow a phased approach, with each phase focusing on a specific aspect of the system. Each step includes:
- Clear instructions on what to implement
- Tests to validate the implementation
- Updates to the progress.md and architecture.md files

---

## Phase 0: Codebase and Database Audit

### Step 0: Existing Codebase and Supabase Audit
**Objective**: Thoroughly analyze the existing codebase and Supabase implementation to understand the current state and structure.

**Tasks**:
1. Review the entire Next.js starter project structure and identify key components, configuration files, and dependencies
2. Connect to the Supabase instance and validate the implemented schema against the schema.md reference document
3. Examine existing tables, relationships, RLS policies, and functions in the Supabase database
4. Inspect all environment variables, API connections, and authentication configuration
5. Create a comprehensive report documenting the current state of both the codebase and database
6. Identify any deviations from the schema or missing elements that need to be addressed
7. Map out how the existing codebase structure will align with the planned implementation

**Test**:
- Successfully connect to the Supabase instance from the local environment
- Retrieve sample data from all existing tables
- Verify authentication connection is properly configured
- Document all existing schema elements, including tables, views, and functions
- Confirm project can build and run locally without errors

---

## Phase 1: Project Setup and Authentication

### Step 1: Project Structure and Base Configuration
**Objective**: Set up the project structure and base configuration.

**Tasks**:
1. Create a basic folder structure for the project
2. Set up environment variables for Supabase
3. Configure Tailwind CSS and shadcn/ui
4. Set up base layout components

**Test**:
- Verify that the application builds without errors
- Confirm that the base layout renders correctly
- Check that environment variables are correctly loaded

### Step 2: Authentication System
**Objective**: Implement user authentication with Supabase Auth.

**Tasks**:
1. Set up Supabase auth context provider (email/password only)
2. Create login page with email/password authentication
3. Implement authentication middleware for protected routes
4. Create user profile and settings pages
5. Add role-based authorization logic (see roles above)

**Test**:
- Register a new user account
- Log in with the registered credentials
- Verify that protected routes are inaccessible without authentication
- Confirm that user profile information is correctly displayed
- Test role-based access restrictions

### Step 3: Navigation and Base Layout
**Objective**: Implement the main navigation and layout components.

**Tasks**:
1. Create a responsive header component
2. Implement sidebar navigation with role-based menu items
3. Create breadcrumb navigation component
4. Add footer component
5. Implement mobile-responsive design for all layout components

**Test**:
- Verify that all navigation components render correctly
- Test responsive behavior on different screen sizes
- Confirm that menu items change based on user role
- Ensure breadcrumb navigation updates correctly based on the current route

---

## Phase 2: Client Management

### Step 4: Client List Page
**Objective**: Create the client listing page with filtering and sorting capabilities.

**Tasks**:
1. Create the client list page component
2. Implement data fetching from Supabase using TanStack Query
3. Add filtering by client name, type, and status
4. Implement sorting by different columns
5. Create pagination component

**Test**:
- Verify that clients are correctly fetched and displayed
- Test filtering by different criteria
- Confirm that sorting works for all columns
- Test pagination functionality

### Step 5: Client Detail Views
**Objective**: Create detailed client profile pages.

**Tasks**:
1. Implement client detail page with tabs for different sections
2. Create client information component showing contact details
3. Add client history section showing past events
4. Implement edit client functionality
5. Create client document repository section (file uploads: max 10MB, PDF/DOCX/XLSX/JPG/PNG, Supabase Storage)

**Test**:
- Navigate to a client detail page and verify information is correct
- Edit client information and confirm changes are saved
- Check that client history correctly displays past events
- Test document upload and download functionality (with file restrictions)

### Step 6: Client Creation Flow
**Objective**: Implement the client creation process.

**Tasks**:
1. Create a multi-step form for client creation
2. Implement form validation
3. Add client type selection (internal/external)
4. Create contact information form component
5. Implement Supabase database interaction to save new clients

**Test**:
- Complete the client creation form with valid data
- Verify that form validation catches invalid inputs
- Confirm that the new client is correctly saved to the database
- Check that the UI updates to show the newly created client

---

## Phase 3: Event Management

### Step 7: Event List Page
**Objective**: Create the event listing page with filtering and calendar views.

**Tasks**:
1. Implement event list page component
2. Create table view for events with filtering and sorting
3. Add calendar view using FullCalendar
4. Implement Gantt chart view for timeline visualization
5. Add quick action buttons for common operations

**Test**:
- Verify that events are correctly fetched and displayed in table format
- Test switching between table, calendar, and Gantt views
- Confirm that filtering and sorting work correctly
- Test quick actions functionality

### Step 8: Event Creation Flow
**Objective**: Implement the event creation process.

**Tasks**:
1. Create a multi-step form for event creation
2. Implement client selection component
3. Add event type selection (one-off/recurring/multi-day)
4. Create date and time selection components
5. Implement location selection
6. Add event contact information form
7. Save event data to Supabase

**Test**:
- Complete the event creation form with valid data
- Test client search and selection functionality
- Verify that date and time selectors work correctly
- Confirm that the new event is correctly saved to the database
- Check that event appears on the event list page after creation

### Step 9: Event Detail Page
**Objective**: Create the event detail page with all information and actions.

**Tasks**:
1. Implement event detail page with tabs for different sections
2. Create event summary component
3. Add client information section
4. Implement event status management (quote/confirmed/in-progress/complete)
5. Create event timeline visualization (support multi-day, recurring, overlapping events per JSONB structure)

**Test**:
- Navigate to an event detail page and verify information is correct
- Test changing event status and confirm updates are saved
- Check that client information is correctly displayed
- Verify that timeline visualization shows correct information

---

## Phase 4: Line Item Management

### Step 10: Line Item Database
**Objective**: Implement the line item management system.

**Tasks**:
1. Create line item list page with filtering and categorization
2. Implement line item detail component
3. Add line item creation form
4. Create department and type filtering
5. Implement search functionality

**Test**:
- Verify that line items are correctly fetched and displayed
- Test filtering by department and type
- Create a new line item and confirm it appears in the list
- Test search functionality with different keywords

### Step 11: Line Item Editor
**Objective**: Create a detailed editor for line items.

**Tasks**:
1. Implement line item editing form
2. Create cost breakdown component
3. Add required resources selection (JSONB array)
4. Implement pricing controls (default RRP, internal cost)
5. Create status toggle for active/inactive
6. Margin calculation: Margin % = (Total Revenue - Total Cost) / Total Cost * 100; Visual indicators: Red (<15%), Yellow (15-30%), Green (>30%)

**Test**:
- Edit an existing line item and verify changes are saved
- Test cost breakdown calculations and margin indicators
- Add and remove required resources
- Toggle active status and confirm it updates correctly

---

## Phase 5: Quoting & Costing Engine

### Step 12: Event Line Items Management
**Objective**: Implement the system for adding line items to events.

**Tasks**:
1. Create event line items tab in event detail page
2. Implement drag-and-drop interface for adding line items
3. Add quantity selectors with automatic cost calculation
4. Create customization options for adjusting package contents
5. Implement category organization by department/function

**Test**:
- Add line items to an event using the drag-and-drop interface
- Adjust quantities and verify cost calculations update
- Customize package contents and confirm changes are saved
- Check that items are correctly categorized by department

### Step 13: Staffing Section
**Objective**: Implement the staffing management system for events.

**Tasks**:
1. Create staffing tab in event detail page
2. Implement labor type selection component
3. Add hours input with cost calculation
4. Create smart staffing recommendation engine
5. Implement capacity checking with alerts (labor only; conflicts show warnings, can be overridden by management)

**Test**:
- Add labor resources to an event
- Adjust hours and verify cost calculations update
- Test smart staffing recommendations
- Trigger capacity warnings by exceeding available resources and test override

### Step 14: Pricing Controls
**Objective**: Implement pricing and discount controls for events.

**Tasks**:
1. Create pricing section in event detail page
2. Implement RRP display from database
3. Add custom pricing override controls
4. Create discount application (percentage or fixed amount)
5. Implement margin calculation with visual indicators

**Test**:
- Verify that recommended retail prices are correctly displayed
- Override prices and confirm changes are saved
- Apply discounts and check that totals update correctly
- Verify margin calculations and visual indicators

---

## Phase 6: ROI Measurement System

### Step 15: ROI Metrics Management
**Objective**: Implement the ROI metrics database and management.

**Tasks**:
1. Create ROI metrics list page
2. Implement ROI metric creation form
3. Add category selection (direct_revenue/value_attribution)
4. Create unit value and type inputs
5. Implement calculation method selection (support both actual and projected values)

**Test**:
- Create new ROI metrics with different categories
- Verify that metrics are correctly saved to the database
- Edit existing metrics and confirm changes are applied
- Test different calculation methods

### Step 16: Event ROI Calculator
**Objective**: Implement the ROI calculator for events.

**Tasks**:
1. Create ROI tab in event detail page
2. Implement direct revenue input section
3. Add value attribution metrics section
4. Create standardized conversion calculations
5. Implement ROI templates for common event types

**Test**:
- Add direct revenue inputs to an event
- Select value attribution metrics and enter quantities
- Verify that ROI calculations are correct
- Test applying ROI templates to events

### Step 17: ROI Dashboard
**Objective**: Create the ROI analytics dashboard.

**Tasks**:
1. Implement ROI dashboard page
2. Create total expected return visualization
3. Add cost-to-value ratio charts
4. Implement department attribution breakdown
5. Create historical comparison charts

**Test**:
- Navigate to the ROI dashboard and verify visualizations
- Filter by different date ranges and event types
- Check that department attribution shows correct percentages
- Test historical comparison with past events

---

## Phase 7: Resource Management

### Step 18: Resource Calendar
**Objective**: Implement the resource management calendar.

**Tasks**:
1. Create resource calendar page
2. Implement timeline view of all committed resources
3. Add filtering by resource type and department
4. Create conflict detection logic
5. Implement resource availability checking

**Test**:
- View resource commitments on the calendar
- Filter by different resource types
- Create conflicting resource assignments and verify alerts
- Check resource availability for different time periods

### Step 19: Capacity Planning
**Objective**: Implement the capacity planning system.

**Tasks**:
1. Create capacity planning page
2. Implement resource capacity management
3. Add utilization metrics visualizations
4. Create capacity forecasting charts
5. Implement capacity constraint warnings

**Test**:
- Update resource capacities and verify changes are saved
- Check utilization metrics for accuracy
- Test capacity forecasting with different scenarios
- Trigger capacity constraint warnings

---

## Phase 8: Output & Reporting

### Step 20: Event Order PDF Generation
**Objective**: Implement PDF generation for event orders.

**Tasks**:
1. Create PDF template for event orders (include company logo, brand colors, fonts, header/footer with company info)
2. Implement event summary section
3. Add service breakdown with descriptions
4. Create staffing plan section
5. Implement timeline visualization
6. Add contact information section
7. Store generated PDFs for later download

**Test**:
- Generate PDF for an event
- Verify that all sections contain correct information and branding
- Check that formatting is consistent and professional
- Test downloading and printing the PDF

### Step 21: Analytics Dashboard
**Objective**: Create the main analytics dashboard.

**Tasks**:
1. Implement analytics dashboard page
2. Create financial performance charts (bar/column, line, pie)
3. Add resource utilization visualizations
4. Implement ROI trends analysis
5. Create department metrics section
6. Add filters for Location, Client, Event, Date
7. Implement export as CSV and PDF

**Test**:
- Navigate to the analytics dashboard and verify all visualizations
- Filter by different date ranges and event types
- Check that data is accurately represented in charts
- Test export functionality for reports

---

## Phase 9: Mobile Responsiveness and Optimization

### Step 22: Mobile UI Optimization
**Objective**: Optimize the UI for mobile devices.

**Tasks**:
1. Review and adjust all components for mobile responsiveness (focus on iOS Safari, Android Chrome, and latest desktop browsers)
2. Create mobile-specific navigation
3. Implement touch-friendly controls
4. Optimize forms for mobile input
5. Test and fix any mobile-specific issues

**Test**:
- Test the application on various mobile devices and screen sizes
- Verify that all features are accessible on mobile
- Check touch interactions work correctly
- Confirm that forms are easily usable on small screens

### Step 23: Performance Optimization
**Objective**: Optimize application performance.

**Tasks**:
1. Implement code splitting for better loading times
2. Add caching strategies for frequently accessed data
3. Optimize database queries
4. Implement lazy loading for components
5. Add loading states and skeleton screens

**Test**:
- Measure and compare loading times before and after optimization
- Check network requests to verify caching is working
- Test application performance with large datasets
- Verify that lazy loading improves initial load time

---

## Phase 10: Final Testing and Deployment

### Step 24: Comprehensive Testing
**Objective**: Perform comprehensive testing of the entire application.

**Tasks**:
1. Create test scenarios for all major workflows
2. Perform end-to-end testing of complete processes
3. Test edge cases and error handling
4. Conduct user acceptance testing with stakeholders
5. Fix any identified issues

**Test**:
- Complete all test scenarios and document results
- Verify that all workflows function as expected
- Check error handling for various scenarios
- Collect and address feedback from user acceptance testing

### Step 25: Deployment Preparation
**Objective**: Prepare the application for production deployment.

**Tasks**:
1. Configure production environment variables
2. Set up error logging and monitoring
3. Create deployment scripts (target: Vercel)
4. Implement database backup procedures
5. Prepare documentation for users and administrators
6. Ensure standard security practices (HTTPS, authentication)

**Test**:
- Test deployment to staging environment
- Verify that all features work in the staging environment
- Check that error logging and monitoring are functioning
- Test database backup and restore procedures

---

## Conclusion
This implementation plan provides a structured approach to developing the AV Client File System. Each step builds upon the previous ones to create a comprehensive system that meets all the requirements specified in the PRD. The phased approach allows for incremental testing and validation throughout the development process.