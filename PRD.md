# Product Requirements Document (PRD)
## FBG Platform - Fashion By Grant

**Version:** 1.0
**Last Updated:** February 6, 2026
**Document Owner:** Product Management
**Status:** Active

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [Feature Sections](#3-feature-sections)
   - [A. Public Store (Customer-Facing)](#a-public-store-customer-facing)
   - [B. Authentication & Authorization](#b-authentication--authorization)
   - [C. Customer Account](#c-customer-account)
   - [D. Cart & Checkout](#d-cart--checkout)
   - [E. Admin Dashboard](#e-admin-dashboard)
   - [F. Staff Dashboard](#f-staff-dashboard)
   - [G. Super Admin Dashboard](#g-super-admin-dashboard)
4. [Integration Matrix](#4-integration-matrix)
5. [Technical Requirements](#5-technical-requirements)
6. [Testing Checklists](#6-testing-checklists)

---

## 1. Executive Summary

### 1.1 Product Overview

**FBG Platform (Fashion By Grant)** is a comprehensive e-commerce and business management platform for a Nigerian luxury fashion brand specializing in bespoke African wear. The platform serves four distinct user types:

- **Customers**: Browse products, place orders, request bespoke services
- **Staff**: Process orders, manage bespoke production tasks, log customer interactions
- **Admins**: Manage entire store operations (products, orders, customers, inventory, CRM, ERP)
- **Super Admins**: System-wide configuration, user management, analytics

### 1.2 Target Market

- **Primary**: Nigerian customers seeking luxury African fashion (Ankara, Adire, Aso-oke, Senator styles)
- **Geographic Focus**: Lagos (primary), Nigeria-wide (interstate shipping)
- **Price Point**: Premium/luxury segment
- **Unique Value Proposition**: Bespoke tailoring with precise measurements, indigenous fabrics, contemporary fusion designs

### 1.3 Business Goals

1. **Revenue Growth**: Enable online sales with seamless Paystack integration for Nigerian market
2. **Operational Efficiency**: Streamline bespoke order management with production pipeline tracking
3. **Customer Retention**: Build loyalty through personalized measurements, wishlist, reviews, notifications
4. **Brand Positioning**: Establish premium online presence reflecting luxury craftsmanship
5. **CRM & Analytics**: Leverage customer segmentation, interaction logging, and data-driven insights

### 1.4 Platform Scale

- **95+ pages** across 6 major sections
- **70+ API endpoints** for backend operations
- **35+ database models** (Prisma ORM on PostgreSQL/SQLite)
- **4 role-based dashboards** with distinct permissions

---

## 2. User Roles & Permissions

### 2.1 Role Definitions

| Role | Database Value | Description | Primary Dashboard |
|------|---------------|-------------|-------------------|
| Customer | `CUSTOMER` | End users who browse, purchase, and request bespoke services | `/account/dashboard` |
| Staff | `STAFF` | Production team members who fulfill orders and complete tasks | `/staff/dashboard` |
| Admin | `ADMIN` | Store managers with full operational control | `/admin/dashboard` |
| Super Admin | `SUPER_ADMIN` | System administrators with global access | `/super-admin/dashboard` |

### 2.2 Permission Matrix

| Feature Area | Customer | Staff | Admin | Super Admin |
|-------------|----------|-------|-------|-------------|
| **Public Store** | View, Browse, Purchase | View | View | View |
| **Product Catalog** | View active products | View | Full CRUD | Full CRUD |
| **Orders** | Own orders only | Process assigned | All orders | All orders |
| **Bespoke Orders** | Request, view own | Process assigned tasks | Full pipeline mgmt | Full pipeline mgmt |
| **Customers (CRM)** | Own profile only | View, log interactions | Full 360 view, CRUD | Full 360 view, CRUD |
| **Inventory** | - | - | Adjust stock | View |
| **Shipping Zones** | - | - | Configure | Configure |
| **Coupons** | Apply at checkout | - | CRUD | CRUD |
| **Reviews** | Write for purchased items | - | Moderate | Moderate |
| **Support Tickets** | Create, reply | View, reply | View all, reply | View all, reply |
| **Users** | - | - | Manage admins/staff | Manage all roles |
| **SMTP/Email** | - | - | - | Configure |
| **Store Settings** | - | - | Edit | Edit |
| **Activity Logs** | - | - | - | View all |

### 2.3 Access Control Implementation

**Middleware-Based Protection** (`src/middleware.ts`):
- Redirects unauthenticated users to appropriate login page based on path
- Prevents role escalation (e.g., CUSTOMER cannot access `/admin`)
- Hierarchical access: Super Admin can access all dashboards, Admin can access Staff areas

**API-Level Protection** (`src/lib/rbac.ts`):
- `requireAuth()`: Validates session exists
- `requireRole(allowedRoles)`: Enforces role-based access
- `requireOwnership(resourceUserId)`: Ensures users can only access their own data (unless admin)

---

## 3. Feature Sections

## A. Public Store (Customer-Facing)

### A.1 Homepage

**Feature Name**: Homepage
**Route**: `/`
**Pages Involved**: `src/app/(public)/page.tsx`

**User Story**:
As a visitor, I want to see a visually appealing homepage with featured products, categories, and brand story so that I understand the brand and can quickly navigate to products.

**Acceptance Criteria**:
1. Hero carousel displays 4+ slides with full-screen images and overlay text
2. Categories grid shows Bespoke (2-col span), Indigenous, Urban Fusion, Accessories
3. Latest Drops section displays 4 most recent products from database
4. Editorial quote section with founder message
5. The Craft section explains 3 artisan techniques (Adire, Aso-Oke, Tailoring)
6. Bespoke CTA banner with "Book Appointment" button
7. About section with studio info and "Get Directions" link
8. Contact section with address, hours, phone, and consultation form
9. All product cards link to `/product/[slug]`
10. Page loads in <2s on 3G connection

**Database Models**: `Product`, `ProductImage`, `ProductVariant`, `Category`

**API Endpoints**:
- None (server-side rendered with `getCachedProducts()` utility)

**Integration Points**:
- Product catalog (fetches latest 4 products)
- Cache layer (`getCachedProducts` with 300s revalidation)

**Current Status**: ✅ Working

---

### A.2 Shop / Product Catalog

**Feature Name**: Shop Catalog with Filtering
**Route**: `/shop`
**Pages Involved**: `src/app/(public)/shop/page.tsx`, `FilterSidebarWrapper.tsx`, `SortDropdown.tsx`, `Pagination.tsx`

**User Story**:
As a customer, I want to browse all products, filter by category/price/search, sort by price/date, and paginate results so that I can find products that match my preferences.

**Acceptance Criteria**:
1. Grid displays 12 products per page (2 cols mobile, 3 cols desktop)
2. Breadcrumbs show current navigation path
3. **Filters**:
   - Category filter (sidebar checkboxes, fetched from DB)
   - Price range filter (min/max input)
   - Search query (text input)
4. **Sorting**:
   - Newest (default)
   - Price: Low to High
   - Price: High to Low
5. Pagination controls (Previous, numbered pages, Next)
6. "Showing X-Y of Z results" counter
7. Empty state when no products match filters with "Clear all filters" link
8. URL parameters persist filters (`?category=bespoke&priceMin=5000&sort=price-asc&page=2`)
9. Product cards show image, name, price, category badge, "New" badge if applicable
10. Clicking product card navigates to `/product/[slug]`

**Database Models**: `Product`, `ProductImage`, `ProductVariant`, `Category`

**API Endpoints**: None (server-side rendered)

**Validation Schema**: `shopFilterSchema` (Zod, `src/lib/validation-schemas.ts`)

**Integration Points**:
- Prisma queries with `where`, `orderBy`, `skip`, `take` for filtering/pagination
- Category relationships (many-to-many via implicit join table)

**Current Status**: ✅ Working

---

### A.3 Product Detail Page

**Feature Name**: Product Detail with Variant Selection
**Route**: `/product/[slug]`
**Pages Involved**: `src/app/(public)/product/[slug]/page.tsx`, `ProductClient.tsx`, `ProductImageGallery.tsx`, `ReviewSection.tsx`

**User Story**:
As a customer, I want to view product details, select size/color variants, see real product images, read reviews, and add items to cart so that I can make informed purchase decisions.

**Acceptance Criteria**:
1. **Image Gallery**:
   - Primary large image (600x800px aspect ratio)
   - Thumbnail strip below (4-5 thumbnails, scrollable)
   - Click thumbnail to change main image
   - Zoom on hover (desktop)
2. **Product Info**:
   - Product name (H1)
   - Price (formatted as NGN with Naira symbol)
   - Average rating (stars) + review count (e.g., "4.5 stars (12 reviews)")
   - Short description
   - Long description (expandable or always visible)
   - Category badge
3. **Variant Selection**:
   - Size selector (radio buttons or dropdown)
   - Color selector if variants have colors (color swatches)
   - Stock indicator ("In Stock" / "Low Stock" / "Out of Stock")
   - Disable "Add to Cart" if out of stock
4. **Add to Cart**:
   - Quantity selector (default 1, max based on stock)
   - "Add to Cart" button (opens cart drawer on success)
   - "Add to Wishlist" button (heart icon, toggles saved state)
5. **Reviews Section**:
   - Display approved reviews (rating, title, comment, user name, date)
   - "Write a Review" button (requires login and purchase)
   - Pagination for reviews if >5
6. **Related Products**:
   - Show 4 products from same category
   - Grid layout with product cards
7. **Breadcrumbs**: Home > Shop > [Product Name]
8. **404** if product not found or inactive

**Database Models**: `Product`, `ProductImage`, `ProductVariant`, `Category`, `Review`, `WishlistItem`

**API Endpoints**:
- `GET /api/wishlist` (fetch user's wishlist)
- `POST /api/wishlist` (add product)
- `DELETE /api/wishlist/[productId]` (remove product)

**Integration Points**:
- CartContext (React Context, localStorage-based)
- WishlistContext (React Context, API-backed)
- ReviewSection component (server-side fetch + client-side form)

**Current Status**: ✅ Working

---

### A.4 Contact Page

**Feature Name**: Contact Form Submission
**Route**: `/contact`
**Pages Involved**: `src/app/(public)/contact/page.tsx`, `ContactForm.tsx`

**User Story**:
As a visitor, I want to submit a contact form with my name, email, and message so that I can reach the brand for inquiries.

**Acceptance Criteria**:
1. Form fields:
   - First Name (required, max 100 chars)
   - Last Name (required, max 100 chars)
   - Email (required, valid email format)
   - Message (required, max 1000 chars, textarea)
2. Client-side validation before submit
3. "Send Message" button (disabled while submitting, shows loading spinner)
4. Success message: "Thank you! We'll get back to you within 24 hours."
5. Error message if submission fails
6. Form resets after successful submission
7. Contact info displayed:
   - Address: "No 15, Station Road, Off Lagos-Abeokuta Expressway, Alagbado, Lagos"
   - Email: hello@fashionbygrant.com
   - Phone: +234 800 123 4567
8. Opening hours table
9. Google Maps embed (optional)

**Database Models**: `ContactMessage`

**API Endpoints**:
- `POST /api/contact` (creates ContactMessage record)

**Validation Schema**: Zod schema in API route

**Integration Points**:
- Admin Messages page (`/admin/messages`) to view submissions
- Email notification to admin (optional, not currently implemented)

**Current Status**: ⚠️ Partially Working
- Form exists and renders
- API endpoint `/api/contact` needs verification
- Admin notification on new message NOT implemented

---

### A.5 Bespoke / Custom Pages

**Feature Name**: CMS-Driven Content Pages
**Routes**: `/bespoke`, `/studio`, `/alterations`, `/fabric-sourcing`, `/group-orders`, `/about`, `/faq`, `/size-guide`, `/delivery`, `/terms`
**Pages Involved**: `src/app/(public)/[slug]/page.tsx`, `ContentPage.tsx`

**User Story**:
As a customer, I want to read detailed information about bespoke services, studio visits, FAQs, and policies so that I understand the brand's offerings and terms.

**Acceptance Criteria**:
1. Each page fetches content from `PageContent` table by slug
2. If page exists in DB:
   - Display title (H1)
   - Render content (rich text / Markdown / HTML)
   - Meta title and description for SEO
3. If page does not exist:
   - Show 404 page
4. Admin can create/edit pages via `/admin/pages`
5. Pages can be published/unpublished (draft state)

**Database Models**: `PageContent`

**API Endpoints**: None (server-side fetch via Prisma)

**Integration Points**:
- Admin CMS Pages (`/admin/pages`) for content management

**Current Status**: ✅ Working

---

### A.6 Consultation Booking (Homepage Form)

**Feature Name**: Consultation Request Submission
**Location**: Homepage contact section form
**Component**: Embedded form in `src/app/(public)/page.tsx`

**User Story**:
As a visitor, I want to request a consultation (measurement/fitting, wedding, fabric selection, pickup) so that I can book an appointment.

**Acceptance Criteria**:
1. Form fields:
   - Name (required)
   - Phone (required)
   - Type (dropdown: Measurement/Fitting, Wedding Consultation, Fabric Selection, Pick up)
   - Message (optional, textarea)
2. Submit button creates `ConsultationBooking` record
3. Success message displayed
4. Form resets after submission
5. Admin can view bookings at `/admin/consultations`

**Database Models**: `ConsultationBooking`

**API Endpoints**:
- `POST /api/consultations` (creates booking)

**Integration Points**:
- Admin Consultations page for management
- Email notification to admin (optional, not implemented)

**Current Status**: ⚠️ Partially Working
- Form exists but **NOT functional** (no submit handler connected)
- API endpoint exists
- Admin consultation page exists

---

## B. Authentication & Authorization

### B.1 Customer Signup

**Feature Name**: Customer Registration with Email Verification
**Route**: `/signup`
**Pages Involved**: `src/app/(auth)/signup/page.tsx`

**User Story**:
As a new visitor, I want to create an account with email and password so that I can place orders and track my purchases.

**Acceptance Criteria**:
1. Form fields:
   - Full Name (required, max 100 chars)
   - Email (required, unique, valid format)
   - Password (required, min 8 chars, must include uppercase, lowercase, number)
   - Confirm Password (must match password)
2. Client-side validation before submit
3. Password strength indicator (weak/medium/strong)
4. Show/hide password toggle (eye icon)
5. "Keep me signed in" checkbox (optional)
6. Submit creates `User` record with role=CUSTOMER, status=ACTIVE
7. Generate unique verification token
8. Send verification email to user's email address
9. Redirect to `/verify-email` with success message
10. Error handling:
    - "Email already exists" if duplicate
    - "Passwords do not match"
    - Generic error message for server failures

**Database Models**: `User`, `CustomerProfile`

**API Endpoints**:
- `POST /api/auth/register` (creates user + sends verification email)

**Validation Schema**: Zod schema in API route

**Integration Points**:
- Email service (`sendEmail` utility)
- Email template for verification link
- NextAuth session creation after verification

**Current Status**: ⚠️ Partially Working
- Form exists and validation works
- API endpoint creates user
- Email verification **NOT IMPLEMENTED** (no SMTP configured by default)
- Verification link generation works but emails may not send

---

### B.2 Email Verification

**Feature Name**: Email Verification via Token Link
**Route**: `/verify-email`
**Pages Involved**: `src/app/(auth)/verify-email/page.tsx`

**User Story**:
As a new user, I want to verify my email address by clicking a link in my inbox so that I can activate my account.

**Acceptance Criteria**:
1. User receives email with verification link: `/verify-email?token=abc123`
2. Page validates token:
   - If valid: Set `emailVerified` to current timestamp
   - If invalid/expired: Show error "Invalid or expired verification link"
3. Success message: "Email verified! You can now log in."
4. "Go to Login" button redirects to `/login`
5. Token is single-use (cannot be reused)

**Database Models**: `User`

**API Endpoints**:
- `POST /api/auth/verify-email` (verifies token, updates user)

**Integration Points**:
- Signup flow (sends verification email)
- Login flow (checks if emailVerified is set)

**Current Status**: ⚠️ Partially Working
- Page exists
- API endpoint exists
- Email sending requires SMTP configuration

---

### B.3 Customer Login

**Feature Name**: Customer Login with Credentials
**Route**: `/login`
**Pages Involved**: `src/app/(auth)/login/page.tsx`

**User Story**:
As a registered customer, I want to log in with my email and password so that I can access my account.

**Acceptance Criteria**:
1. Form fields:
   - Email (required)
   - Password (required)
2. "Keep me signed in" checkbox (extends session duration)
3. "Forgot password?" link to `/forgot-password`
4. Submit triggers NextAuth `signIn("credentials")`
5. On success: Redirect to `/account/dashboard`
6. On failure: Show error "Invalid email or password"
7. If account suspended: Show error "Account suspended. Contact support."
8. Social login buttons (Google, Apple) - visual only, not functional
9. "Create an account" link to `/signup`
10. Update `lastLoginAt` timestamp on successful login

**Database Models**: `User`

**API Endpoints**:
- NextAuth handles via `/api/auth/[...nextauth]/route.ts`

**Integration Points**:
- NextAuth Credentials provider
- bcryptjs for password comparison
- Middleware redirects logged-in users away from `/login`

**Current Status**: ✅ Working

---

### B.4 Admin / Staff / Super Admin Login

**Feature Name**: Role-Specific Login Pages
**Routes**: `/admin/login`, `/staff/login`, `/super-admin/login`
**Pages Involved**: Separate login pages for each role

**User Story**:
As an admin/staff/super admin, I want to log in via a dedicated login page so that I am redirected to my appropriate dashboard.

**Acceptance Criteria**:
1. Each page uses same credentials flow as customer login
2. Design variations:
   - Admin: Indigo color scheme
   - Staff: Emerald color scheme
   - Super Admin: Blue color scheme
3. After login, middleware redirects to appropriate dashboard:
   - Admin → `/admin/dashboard`
   - Staff → `/staff/dashboard`
   - Super Admin → `/super-admin/dashboard`
4. If wrong role attempts access (e.g., CUSTOMER logs in at `/admin/login`), redirect to their own dashboard

**Database Models**: `User`

**API Endpoints**: Same NextAuth flow

**Integration Points**: Middleware (`src/middleware.ts`)

**Current Status**: ✅ Working

---

### B.5 Forgot Password / Reset Password

**Feature Name**: Password Reset Flow
**Routes**: `/forgot-password`, `/reset-password`
**Pages Involved**: `src/app/(auth)/forgot-password/page.tsx`, `src/app/(auth)/reset-password/page.tsx`

**User Story**:
As a user who forgot my password, I want to receive a password reset link via email so that I can regain access to my account.

**Acceptance Criteria**:
1. **Forgot Password** (`/forgot-password`):
   - Email input (required)
   - Submit creates `PasswordReset` record with unique token
   - Send email with reset link: `/reset-password?token=xyz789`
   - Token expires after 1 hour
   - Success message: "If an account exists, a reset link has been sent."
2. **Reset Password** (`/reset-password?token=xyz789`):
   - Validate token exists and not expired
   - New Password input (min 8 chars, strength requirements)
   - Confirm Password input (must match)
   - Submit updates user's `passwordHash`
   - Delete used token from `PasswordReset`
   - Success message: "Password updated successfully. You can now log in."
   - "Go to Login" button

**Database Models**: `User`, `PasswordReset`

**API Endpoints**:
- `POST /api/auth/forgot-password` (creates reset token, sends email)
- `POST /api/auth/reset-password` (validates token, updates password)

**Integration Points**:
- Email service
- bcryptjs for password hashing

**Current Status**: ⚠️ Partially Working
- Pages exist
- API endpoints exist
- Email delivery depends on SMTP configuration

---

### B.6 Logout

**Feature Name**: User Logout
**Method**: NextAuth `signOut()` function

**User Story**:
As a logged-in user, I want to log out so that my session is terminated.

**Acceptance Criteria**:
1. Logout button in header/navigation
2. Clicking triggers `signOut()` from NextAuth
3. Session cookie is cleared
4. User redirected to homepage `/`

**Current Status**: ✅ Working

---

## C. Customer Account

### C.1 Customer Dashboard

**Feature Name**: Account Overview Dashboard
**Route**: `/account/dashboard`
**Pages Involved**: `src/app/account/dashboard/page.tsx`

**User Story**:
As a logged-in customer, I want to see an overview of my account activity (recent orders, wishlist count, notifications) so that I can quickly access key information.

**Acceptance Criteria**:
1. Welcome message with user's name
2. **Stats Cards**:
   - Total Orders (count)
   - Total Spent (sum of paid order totals)
   - Wishlist Items (count)
   - Unread Notifications (count)
3. **Recent Orders** (last 5):
   - Order number
   - Date placed
   - Status badge
   - Total amount
   - "View Details" link to `/account/orders/[id]`
4. **Quick Actions**:
   - "Track Order" button
   - "View Wishlist" button
   - "Write Review" button
5. **Account Health**:
   - Profile completion percentage
   - Prompt to add measurements if missing
6. If no orders: Empty state with "Start Shopping" CTA

**Database Models**: `Order`, `WishlistItem`, `Notification`, `User`

**API Endpoints**: None (server-side fetch)

**Current Status**: ✅ Working

---

### C.2 Order History & Detail

**Feature Name**: View Order History and Individual Order Details
**Routes**: `/account/orders`, `/account/orders/[id]`
**Pages Involved**: `src/app/account/orders/page.tsx`, `src/app/account/orders/[id]/page.tsx`

**User Story**:
As a customer, I want to view all my past orders and see detailed information for each order so that I can track deliveries and review purchases.

**Acceptance Criteria**:
1. **Order History Page**:
   - Table/list of all orders (newest first)
   - Columns: Order #, Date, Status, Total, Actions
   - Status badges (Pending, Processing, Shipped, Delivered, Cancelled)
   - "View Details" button per order
   - Pagination if >20 orders
   - Empty state if no orders
2. **Order Detail Page**:
   - Order number, date, status
   - Payment status (Paid/Unpaid)
   - Shipping address
   - Order items (product name, image, size, quantity, price)
   - Subtotal, shipping, discount, total
   - Tracking number (if available) with "Track Shipment" link
   - "Request Return" button (only if status=DELIVERED)
   - "Reorder" button (adds all items to cart)
   - Status timeline/history (logs from `OrderStatusLog`)
3. Breadcrumbs: Account > Orders > [Order #]

**Database Models**: `Order`, `OrderItem`, `OrderStatusLog`, `Payment`

**API Endpoints**: None (server-side fetch)

**Integration Points**:
- Return request flow (`/account/returns`)
- Tracking integration (external tracking URL)

**Current Status**: ✅ Working

---

### C.3 Profile Management

**Feature Name**: Edit Customer Profile
**Route**: `/account/profile`
**Pages Involved**: `src/app/account/profile/page.tsx`

**User Story**:
As a customer, I want to update my name, email, phone, and password so that my account information stays current.

**Acceptance Criteria**:
1. **Profile Form**:
   - Full Name (required)
   - Email (required, unique, read-only or with re-verification if changed)
   - Phone (optional, format validation)
   - Default Shipping Address (textarea, optional)
   - Notes (textarea, private notes for admin)
2. **Change Password Section** (separate):
   - Current Password (required)
   - New Password (min 8 chars, strength requirements)
   - Confirm New Password
   - Submit updates `passwordHash`
3. Success message: "Profile updated successfully"
4. Error handling for validation failures
5. "Save Changes" button

**Database Models**: `User`, `CustomerProfile`

**API Endpoints**:
- `PUT /api/account/profile` (updates user + profile)

**Validation Schema**: Zod schema in API route

**Current Status**: ✅ Working

---

### C.4 Address Management

**Feature Name**: Manage Shipping Addresses
**Route**: `/account/addresses` (planned, not yet implemented)

**User Story**:
As a customer, I want to save multiple shipping addresses so that I can quickly select one during checkout.

**Acceptance Criteria**:
1. List all saved addresses
2. "Add New Address" button opens form/modal
3. Address form fields:
   - Label (e.g., "Home", "Office")
   - First Name, Last Name
   - Address Line 1, Address Line 2 (optional)
   - City
   - State (dropdown of Nigerian states)
   - Postal Code (optional)
   - Phone
   - "Set as default" checkbox
4. Edit/Delete actions per address
5. Default address highlighted
6. During checkout, customer can select from saved addresses

**Database Models**: New model needed (`Address` or extend `CustomerProfile`)

**API Endpoints**: CRUD endpoints for addresses (not yet implemented)

**Current Status**: ❌ Not Built

---

### C.5 Measurements

**Feature Name**: View Saved Body Measurements
**Route**: `/account/measurements`
**Pages Involved**: `src/app/account/measurements/page.tsx`

**User Story**:
As a customer, I want to view my saved body measurements so that I can reference them for bespoke orders.

**Acceptance Criteria**:
1. Display all measurement sets (if multiple)
2. Each measurement shows:
   - Label (e.g., "Default", "Wedding Suit 2024")
   - Upper body: Chest, Shoulder, Sleeve Length, Neck, Back Length
   - Lower body: Waist, Hip, Inseam, Outseam, Thigh
   - Additional: Height, Weight
   - Notes, Measured By, Measured At
3. "Request Measurement Update" button (creates support ticket)
4. Empty state: "No measurements on file. Contact us to schedule a fitting."

**Database Models**: `CustomerMeasurement`

**API Endpoints**: None (view-only, server-side fetch)

**Integration Points**:
- Admin can add/edit measurements via Customer 360 page
- Bespoke orders reference measurement ID

**Current Status**: ✅ Working (view-only)

---

### C.6 Wishlist

**Feature Name**: Manage Wishlist
**Route**: `/account/wishlist`
**Pages Involved**: `src/app/account/wishlist/page.tsx`

**User Story**:
As a customer, I want to save products to a wishlist so that I can purchase them later.

**Acceptance Criteria**:
1. Grid displays all wishlist items (product cards)
2. Each card shows:
   - Product image
   - Name
   - Price
   - "Remove from Wishlist" button (heart icon, filled)
   - "Add to Cart" button
3. Clicking product navigates to product detail page
4. "Remove" updates wishlist immediately
5. Empty state: "Your wishlist is empty. Start adding products!"
6. Wishlist count badge in header updates in real-time

**Database Models**: `WishlistItem`, `Product`

**API Endpoints**:
- `GET /api/wishlist` (fetch user's wishlist)
- `POST /api/wishlist` (add product)
- `DELETE /api/wishlist/[productId]` (remove product)

**Integration Points**:
- WishlistContext (React Context)
- Product detail page (Add to Wishlist button)

**Current Status**: ✅ Working

---

### C.7 Reviews

**Feature Name**: Write and View Product Reviews
**Route**: `/account/reviews`
**Pages Involved**: `src/app/account/reviews/page.tsx`

**User Story**:
As a customer, I want to write reviews for products I've purchased so that I can share my experience with others.

**Acceptance Criteria**:
1. **Review List** (customer's submitted reviews):
   - Product name, image
   - Rating (stars)
   - Review title, comment
   - Status badge (Pending, Approved, Rejected)
   - Date submitted
   - Edit/Delete buttons (only if status=PENDING)
2. **Write Review**:
   - Only for products in delivered orders
   - Cannot review same product twice
   - Form fields:
     - Rating (1-5 stars, required)
     - Title (optional, max 100 chars)
     - Comment (required, max 500 chars)
   - Submit creates `Review` with status=PENDING
   - Admin must approve before public display
3. Success message: "Review submitted! It will appear after approval."

**Database Models**: `Review`, `Product`, `Order`, `OrderItem`

**API Endpoints**:
- `GET /api/reviews` (user's reviews)
- `POST /api/reviews` (create review)
- `PUT /api/reviews/[id]` (edit review)
- `DELETE /api/reviews/[id]` (delete review)

**Integration Points**:
- Product detail page (displays approved reviews)
- Admin Reviews page (moderation)

**Current Status**: ✅ Working

---

### C.8 Notifications

**Feature Name**: View In-App Notifications
**Route**: `/account/notifications`
**Pages Involved**: `src/app/account/notifications/page.tsx`

**User Story**:
As a customer, I want to receive notifications about order updates, promotions, and system messages so that I stay informed.

**Acceptance Criteria**:
1. List all notifications (newest first)
2. Each notification shows:
   - Icon based on type (Order Update, Payment, Support, Promotion, System)
   - Title
   - Message
   - Timestamp ("2 hours ago")
   - Read/unread indicator (bold if unread)
   - Link (optional, e.g., to order detail)
3. "Mark as Read" button per notification
4. "Mark All as Read" button
5. Filter by type (dropdown)
6. Pagination if >20 notifications
7. Unread count badge in header notification bell icon
8. Empty state: "No notifications yet"

**Database Models**: `Notification`

**API Endpoints**:
- `GET /api/notifications` (fetch user's notifications)
- `GET /api/notifications/unread-count` (for badge)
- `PUT /api/notifications/[id]` (mark as read)
- `PUT /api/notifications/mark-all-read` (mark all)

**Integration Points**:
- Notification creation utility (`src/lib/notifications.ts`)
- Triggered by: order status changes, payment confirmations, admin messages, bespoke updates

**Current Status**: ✅ Working

---

### C.9 Support Tickets

**Feature Name**: Create and Manage Support Tickets
**Routes**: `/account/tickets`, `/account/tickets/new`, `/account/tickets/[id]`
**Pages Involved**: `src/app/account/tickets/page.tsx`, `new/page.tsx`, `[id]/page.tsx`

**User Story**:
As a customer, I want to submit support tickets for order issues or general inquiries so that I can get assistance.

**Acceptance Criteria**:
1. **Ticket List**:
   - Table of tickets (newest first)
   - Columns: Ticket #, Subject, Status (Open/In Progress/Resolved/Closed), Priority, Created Date
   - "New Ticket" button
2. **Create Ticket**:
   - Form fields:
     - Related Order (dropdown of user's orders, optional)
     - Subject (required, max 200 chars)
     - Priority (dropdown: Low, Normal, High)
     - Message (required, textarea, max 2000 chars)
   - Submit creates `SupportTicket` with initial message
   - Success: Redirect to ticket detail page
3. **Ticket Detail**:
   - Ticket number, subject, status, priority
   - Conversation thread (messages chronological)
   - Reply form (textarea, "Send Reply" button)
   - "Close Ticket" button (changes status to CLOSED)
   - Only customer and admins can see non-internal messages

**Database Models**: `SupportTicket`, `SupportTicketMessage`, `Order`, `User`

**API Endpoints**:
- `GET /api/tickets` (user's tickets)
- `POST /api/tickets` (create ticket)
- `GET /api/tickets/[id]` (fetch ticket + messages)
- `POST /api/tickets/[id]/messages` (add reply)
- `PUT /api/tickets/[id]/status` (update status)

**Integration Points**:
- Admin Tickets page (`/admin/tickets`)
- Email notifications (optional)

**Current Status**: ✅ Working

---

### C.10 Returns Management

**Feature Name**: Request Product Returns
**Route**: `/account/returns` (not yet a dedicated page)
**Component**: Part of order detail page

**User Story**:
As a customer, I want to request a return for a delivered order so that I can get a refund or replacement.

**Acceptance Criteria**:
1. "Request Return" button only visible if:
   - Order status = DELIVERED
   - Within return window (e.g., 14 days of delivery)
2. Return request form:
   - Reason (dropdown: Wrong size, Defective, Changed mind, etc.)
   - Additional details (textarea, max 500 chars)
   - Upload images (optional, up to 3 images)
3. Submit creates `ReturnRequest` with status=PENDING
4. Customer receives confirmation notification
5. Admin processes return at `/admin/returns/[id]`
6. Return statuses: Pending, Approved, Rejected, Refunded

**Database Models**: `ReturnRequest`, `Order`

**API Endpoints**:
- `POST /api/returns` (create return request)
- `GET /api/returns` (user's returns, if dedicated page exists)

**Integration Points**:
- Admin Returns page for processing
- Payment refund flow (manual or Paystack refund API)

**Current Status**: ⚠️ Partially Working
- Return request creation works
- No dedicated customer-facing returns page
- Customer sees returns via order detail page

---

## D. Cart & Checkout

### D.1 Shopping Cart (Context & Drawer)

**Feature Name**: Client-Side Shopping Cart
**Component**: `CartContext.tsx`, `CartDrawer.tsx` (assumed)
**Location**: Accessible from header cart icon

**User Story**:
As a customer, I want to add products to a cart, adjust quantities, and see the total so that I can review my selections before checkout.

**Acceptance Criteria**:
1. **Cart Context**:
   - Stores cart items in localStorage (persists across sessions)
   - Methods: `addItem`, `removeItem`, `updateQuantity`, `clearCart`
   - Computed: `cartCount`, `cartTotal`
2. **Cart Drawer** (slides in from right):
   - Triggered by "Add to Cart" or clicking cart icon
   - Lists all cart items:
     - Product image, name, size, price
     - Quantity selector (+-buttons)
     - Remove button (X icon)
   - Subtotal display
   - "Continue Shopping" button (closes drawer)
   - "Checkout" button (navigates to `/checkout`)
3. Empty cart state: "Your cart is empty"
4. Cart count badge on header icon updates in real-time

**Database Models**: None (cart is client-side only until checkout)

**API Endpoints**: None

**Integration Points**:
- Product detail page (Add to Cart)
- Checkout page (reads cart items)

**Current Status**: ✅ Working

---

### D.2 Checkout Flow

**Feature Name**: Multi-Step Checkout with Payment
**Route**: `/checkout`
**Pages Involved**: `src/app/checkout/page.tsx`

**User Story**:
As a customer, I want to complete my purchase by entering shipping info, selecting a shipping method, and paying via Paystack so that I receive my order.

**Acceptance Criteria**:
1. **Pre-Checkout Validation**:
   - If cart is empty, show "Cart is empty" message
   - Pre-fill email/name for logged-in users
2. **Step 1: Information**:
   - Contact info: Email, Phone
   - Shipping address: First Name, Last Name, Address, City, State (dropdown of Nigerian states), Postal Code
   - "Continue to Shipping" button
   - Validation: All required fields filled
3. **Step 2: Shipping**:
   - Display contact summary (with "Change" link)
   - Display shipping address summary
   - Fetch shipping rates based on selected state
   - Show available shipping methods (radio buttons):
     - Method name, estimated days, price
   - If no rates available, show error + contact prompt
   - "Continue to Payment" button
4. **Step 3: Payment**:
   - Display contact, shipping, and method summaries
   - Payment info box: "Secured by Paystack"
   - Accepted methods: Visa, Mastercard, Verve, bank transfer, USSD
   - "Pay [Total]" button
5. **Order Summary** (sticky sidebar):
   - List all cart items (image, name, size, qty, price)
   - Coupon code input + "Apply" button
   - Subtotal, Shipping, Discount, Total
   - Trust signals: "100% Secure Checkout", "3-5 days delivery"
6. **Payment Processing**:
   - Submit triggers `POST /api/payments/initialize`
   - API creates Order + Payment records
   - Returns Paystack authorization URL
   - Redirect user to Paystack payment page
7. **After Payment**:
   - Paystack redirects to `/checkout/success?reference=xyz`
   - Verify payment via `POST /api/payments/verify`
   - Display success message with order number
   - "View Order" button, "Continue Shopping" button
   - Clear cart

**Database Models**: `Order`, `OrderItem`, `Payment`, `ShippingRate`, `ShippingZone`, `Coupon`

**API Endpoints**:
- `POST /api/payments/initialize` (creates order + payment, returns Paystack URL)
- `GET /api/shipping/rates?state=[state]` (fetches shipping rates for state)
- `POST /api/payments/verify` (verifies payment with Paystack)
- `POST /api/webhooks/paystack` (webhook for payment confirmation)

**Validation Schema**: `checkoutSchema` (Zod)

**Integration Points**:
- Paystack API (`initializePayment` utility)
- Stock management (reduces inventory after payment)
- Order fulfillment flow (creates order status log)
- Email notifications (order confirmation)
- Customer notifications (in-app notification)

**Current Status**: ✅ Working

---

### D.3 Checkout Success Page

**Feature Name**: Post-Payment Confirmation
**Route**: `/checkout/success?reference=[ref]`
**Pages Involved**: `src/app/checkout/success/page.tsx`

**User Story**:
As a customer who just paid, I want to see a confirmation page with my order details so that I know my purchase was successful.

**Acceptance Criteria**:
1. Verify payment reference with Paystack
2. If payment successful:
   - Update Order status to PROCESSING
   - Update Payment status to PAID
   - Deduct stock from ProductVariant
   - Create OrderStatusLog entry
   - Send order confirmation email
   - Create in-app notification
3. Display:
   - Success checkmark icon
   - "Thank you for your order!"
   - Order number
   - "We've sent a confirmation email to [email]"
   - Estimated delivery date
   - "Track Order" button → `/account/orders/[id]`
   - "Continue Shopping" button → `/shop`
4. If payment failed:
   - Show error message
   - "Retry Payment" button or "Contact Support"

**Database Models**: `Order`, `Payment`, `OrderStatusLog`, `ProductVariant`, `StockMovement`

**API Endpoints**:
- `POST /api/payments/verify`

**Integration Points**:
- Payment fulfillment utility (`src/lib/payment-fulfillment.ts`)
- Email service
- Notification service

**Current Status**: ✅ Working

---

## E. Admin Dashboard

### E.1 Admin Dashboard Overview

**Feature Name**: Admin Dashboard with KPIs
**Route**: `/admin/dashboard`
**Pages Involved**: `src/app/admin/dashboard/page.tsx`

**User Story**:
As an admin, I want to see high-level business metrics (revenue, orders, customers, products) so that I can monitor store performance at a glance.

**Acceptance Criteria**:
1. **KPI Cards** (top row):
   - Total Revenue (this month, with % change vs last month)
   - Total Orders (this month, with % change)
   - Total Products (active count)
   - Total Customers (count)
2. **Recent Orders** (table, last 10):
   - Order #, Customer, Date, Status, Total
   - Quick actions: "View", "Update Status"
3. **Revenue Chart**:
   - Line/bar chart showing daily/weekly/monthly revenue
   - Date range selector
4. **Low Stock Alerts**:
   - List products with stock < 10 units
   - Link to inventory page
5. **Quick Actions**:
   - "Create Product", "View Orders", "View Customers"

**Database Models**: `Order`, `Product`, `User`, `ProductVariant`

**API Endpoints**: None (server-side aggregation)

**Current Status**: ✅ Working

---

### E.2 Orders Management

**Feature Name**: View and Manage All Orders
**Routes**: `/admin/orders`, `/admin/orders/[id]`
**Pages Involved**: `src/app/admin/orders/page.tsx`, `OrdersListFilters.tsx`, `[id]/page.tsx`

**User Story**:
As an admin, I want to view all orders, filter by status/date/customer, and update order statuses so that I can fulfill orders efficiently.

**Acceptance Criteria**:
1. **Orders List**:
   - Table with columns: Order #, Customer, Date, Status, Payment Status, Total
   - Filters: Status (dropdown), Payment Status, Date Range, Search (order # or customer email)
   - Sorting: Date (newest/oldest), Total (high/low)
   - Pagination (20 per page)
   - "Export CSV" button
2. **Order Detail**:
   - Full order information (customer, items, shipping address, payment details)
   - **Status Update** (dropdown with save button):
     - PENDING → PROCESSING → SHIPPED → DELIVERED → CANCELLED
   - Add tracking number + tracking URL
   - "Print Invoice" button
   - "Refund Order" button (if paid)
   - "Cancel Order" button (with confirmation modal)
   - Status history timeline (from OrderStatusLog)
3. On status update:
   - Create OrderStatusLog entry
   - Send notification to customer
   - Send email to customer

**Database Models**: `Order`, `OrderItem`, `OrderStatusLog`, `Payment`, `User`

**API Endpoints**:
- `PUT /api/orders/[id]/status` (update status)

**Integration Points**:
- Notification service
- Email service
- Shipping integrations (tracking number input)

**Current Status**: ✅ Working

---

### E.3 Products Management

**Feature Name**: CRUD for Products and Variants
**Routes**: `/admin/products`, `/admin/products/new`, `/admin/products/[id]/edit`
**Pages Involved**: `src/app/admin/products/page.tsx`, `ProductsListFilters.tsx`, `new/page.tsx`, `[id]/edit/page.tsx`

**User Story**:
As an admin, I want to create, edit, and delete products with variants so that I can manage the store catalog.

**Acceptance Criteria**:
1. **Product List**:
   - Table: Image, Name, Category, Price, Stock, Status
   - Filters: Category, Status (Active/Inactive), Search (name/SKU)
   - Sorting: Name (A-Z), Price, Created Date
   - Pagination
   - "Add Product" button
   - Quick actions: Edit, Delete (with confirmation)
2. **Create/Edit Product**:
   - **Basic Info**:
     - Name (required, unique slug auto-generated)
     - Short Description (max 200 chars)
     - Long Description (rich text editor or textarea)
     - Base Price (required, NGN)
     - Status (Active/Inactive dropdown)
   - **Flags**:
     - Is New (checkbox)
     - Is Featured (checkbox)
     - Is On Sale (checkbox)
     - Made to Order (checkbox)
   - **Categories** (multi-select or checkboxes)
   - **Collections** (multi-select)
   - **Images**:
     - Upload multiple images (drag-drop or file picker)
     - Set image order (drag to reorder)
     - Delete image
     - Max 10 images per product
   - **Variants**:
     - Add variant rows (SKU, Size, Color, Stock Qty, Price Override)
     - Delete variant
     - Each variant must have unique SKU
   - "Save Product" button
   - "Save & Add Another" button
   - Validation errors displayed
3. On save:
   - Create/update Product, ProductImage, ProductVariant records
   - Upload images to Supabase storage
   - Redirect to product list or edit page

**Database Models**: `Product`, `ProductImage`, `ProductVariant`, `Category`, `Collection`

**API Endpoints**:
- `GET /api/admin/products` (list products)
- `POST /api/admin/products` (create product)
- `PUT /api/admin/products/[id]` (update product)
- `DELETE /api/admin/products/[id]` (soft delete or hard delete)

**File Upload**: Supabase storage integration

**Current Status**: ✅ Working

---

### E.4 Categories Management

**Feature Name**: CRUD for Product Categories with Hierarchy
**Route**: `/admin/categories`
**Pages Involved**: `src/app/admin/categories/page.tsx`, `CategoriesClient.tsx`, `CategoryFormDialog.tsx`

**User Story**:
As an admin, I want to create and manage product categories (with parent-child relationships) so that I can organize the catalog.

**Acceptance Criteria**:
1. **Category List**:
   - Tree view showing parent-child relationships
   - Each category shows: Name, Slug, Product Count
   - "Add Category" button
   - Edit/Delete actions per category
2. **Create/Edit Category** (modal/dialog):
   - Name (required, unique slug auto-generated)
   - Parent Category (dropdown, optional for top-level)
   - Description (textarea)
   - "Save" button
3. Validation:
   - Category cannot be its own parent
   - Slug must be unique
4. On delete:
   - Warn if category has products
   - Reassign products or prevent deletion

**Database Models**: `Category`

**API Endpoints**:
- `GET /api/admin/categories` (list all)
- `POST /api/admin/categories` (create)
- `PUT /api/admin/categories/[id]` (update)
- `DELETE /api/admin/categories/[id]` (delete)

**Current Status**: ✅ Working

---

### E.5 Collections Management

**Feature Name**: CRUD for Product Collections
**Route**: `/admin/collections`
**Pages Involved**: `src/app/admin/collections/page.tsx`, `CollectionsClient.tsx`

**User Story**:
As an admin, I want to create collections (e.g., "Summer 2024", "Wedding Collection") so that I can feature curated product groupings.

**Acceptance Criteria**:
1. **Collections List**:
   - Table: Name, Slug, Product Count, Status (Active/Inactive), Created Date
   - "Add Collection" button
   - Edit/Delete actions
2. **Create/Edit Collection** (modal/dialog):
   - Name (required)
   - Slug (auto-generated, editable)
   - Description (textarea)
   - Is Active (checkbox)
   - "Save" button
3. Products are assigned to collections via product edit page

**Database Models**: `Collection`

**API Endpoints**:
- `GET /api/admin/collections`
- `POST /api/admin/collections`
- `PUT /api/admin/collections/[id]`
- `DELETE /api/admin/collections/[id]`

**Current Status**: ✅ Working

---

### E.6 Coupons Management

**Feature Name**: CRUD for Discount Coupons
**Route**: `/admin/coupons`
**Pages Involved**: `src/app/admin/coupons/page.tsx`, `CouponsClient.tsx`

**User Story**:
As an admin, I want to create discount coupons (percentage or fixed amount) with usage limits and expiration dates so that I can run promotions.

**Acceptance Criteria**:
1. **Coupon List**:
   - Table: Code, Type, Value, Usage (X/Y), Status, Valid From, Expires At
   - "Create Coupon" button
   - Edit/Delete/Deactivate actions
2. **Create/Edit Coupon** (modal/page):
   - Code (required, unique, uppercase)
   - Type (dropdown: Percentage / Fixed Amount)
   - Value (required, number)
   - Min Order Amount (optional, NGN)
   - Max Uses (optional, number)
   - Valid From (date picker, optional)
   - Expires At (date picker, optional)
   - Is Active (checkbox)
   - "Save" button
3. Validation:
   - Percentage value must be 1-100
   - Fixed amount must be > 0
   - Expires At must be after Valid From
4. Coupon application logic:
   - Check active status, date range, usage limits
   - Apply discount at checkout

**Database Models**: `Coupon`

**API Endpoints**:
- `GET /api/admin/coupons`
- `POST /api/admin/coupons`
- `PUT /api/admin/coupons/[id]`
- `DELETE /api/admin/coupons/[id]`

**Current Status**: ✅ Working

---

### E.7 Inventory Management

**Feature Name**: Stock Adjustments and Low Stock Alerts
**Route**: `/admin/inventory`
**Pages Involved**: `src/app/admin/inventory/page.tsx`, `InventoryClient.tsx`

**User Story**:
As an admin, I want to view stock levels for all product variants, adjust stock, and see low stock alerts so that I can prevent stockouts.

**Acceptance Criteria**:
1. **Inventory Table**:
   - Columns: Product Name, SKU, Size/Color, Current Stock, Status
   - Filters: Category, Status, Low Stock (< 10 units)
   - Search by product name or SKU
   - Sorting: Stock (low/high), Name
   - Pagination
2. **Stock Adjustment** (inline or modal):
   - Input field to adjust quantity (+/-)
   - Reason (dropdown: Restock, Damaged, Lost, Correction, Sale)
   - "Save" button
   - Creates StockMovement record
3. **Low Stock Alerts**:
   - Highlight rows with stock < 10 in red/yellow
   - Badge showing "Low Stock"
4. **Stock Movement History** (per variant):
   - Log of all adjustments (date, type, quantity, reason, user)

**Database Models**: `ProductVariant`, `StockMovement`

**API Endpoints**:
- `GET /api/admin/inventory` (list variants with stock)
- `PUT /api/admin/inventory` (batch update stock or per-variant update)

**Server Actions**: `adjustStock` (in `actions.ts`)

**Current Status**: ✅ Working

---

### E.8 Shipping Zones & Rates

**Feature Name**: Configure Shipping Zones and Rates
**Route**: `/admin/shipping`
**Pages Involved**: `src/app/admin/shipping/page.tsx`, `ShippingPageClient.tsx`, `ShippingZoneDialog.tsx`, `ShippingRateDialog.tsx`

**User Story**:
As an admin, I want to define shipping zones (by Nigerian states) and set rates per zone so that customers see accurate shipping costs at checkout.

**Acceptance Criteria**:
1. **Shipping Zones List**:
   - Table: Zone Name, States (comma-separated), Rates Count, Status
   - "Add Zone" button
   - Edit/Delete actions
2. **Create/Edit Zone** (modal):
   - Zone Name (e.g., "Lagos Mainland")
   - States (multi-select from Nigerian states list)
   - Is Active (checkbox)
   - "Save" button
3. **Shipping Rates** (per zone):
   - Table: Method Name, Price, Estimated Days, Status
   - "Add Rate" button
   - Edit/Delete actions
4. **Create/Edit Rate** (modal):
   - Method Name (e.g., "Standard Delivery", "Express")
   - Price (NGN)
   - Estimated Days (e.g., "3-5")
   - Is Active (checkbox)
   - "Save" button
5. Checkout integration:
   - When customer selects state, fetch rates for matching zone
   - If no zone matches, show "No shipping available"

**Database Models**: `ShippingZone`, `ShippingRate`

**API Endpoints**: Server actions in `actions.ts`

**Current Status**: ✅ Working

---

### E.9 Returns Management

**Feature Name**: Process Return Requests
**Routes**: `/admin/returns`, `/admin/returns/[id]`
**Pages Involved**: `src/app/admin/returns/page.tsx`, `[id]/page.tsx`, `ProcessReturnForm.tsx`

**User Story**:
As an admin, I want to review and process customer return requests so that I can approve refunds or replacements.

**Acceptance Criteria**:
1. **Returns List**:
   - Table: Return ID, Order #, Customer, Reason, Status, Date Requested
   - Filters: Status (Pending/Approved/Rejected/Refunded)
   - Sorting: Date (newest first)
   - Pagination
2. **Return Detail**:
   - Order information (customer, items, total)
   - Return reason and customer notes
   - Uploaded images (if any)
   - Status history
   - **Process Form**:
     - Status dropdown (Approve/Reject/Refund)
     - Refund Amount (pre-filled with order total, editable)
     - Admin Notes (textarea)
     - "Submit" button
3. On approval:
   - Update ReturnRequest status
   - Create notification for customer
   - Send email confirmation
4. On refund:
   - Mark as REFUNDED
   - Admin manually issues refund (or integrate Paystack refund API)

**Database Models**: `ReturnRequest`, `Order`

**API Endpoints**:
- `GET /api/admin/returns`
- `PUT /api/admin/returns/[id]` (process return)

**Current Status**: ✅ Working

---

### E.10 Reviews Moderation

**Feature Name**: Approve/Reject Product Reviews
**Route**: `/admin/reviews`
**Pages Involved**: `src/app/admin/reviews/page.tsx`, `ReviewsClient.tsx`

**User Story**:
As an admin, I want to moderate customer reviews before they appear on product pages so that I can filter spam or inappropriate content.

**Acceptance Criteria**:
1. **Reviews List**:
   - Table: Product, Customer, Rating, Title, Status, Date
   - Filters: Status (Pending/Approved/Rejected), Rating (1-5 stars)
   - Sorting: Date (newest first)
   - Pagination
2. **Actions** (per review):
   - "View" button (shows full comment in modal)
   - "Approve" button (changes status to APPROVED)
   - "Reject" button (changes status to REJECTED)
   - "Delete" button (hard delete, with confirmation)
3. Approved reviews appear on product detail pages

**Database Models**: `Review`, `Product`, `User`

**API Endpoints**:
- `GET /api/admin/reviews`
- `PUT /api/admin/reviews/[id]` (approve/reject)
- `DELETE /api/admin/reviews/[id]` (delete)

**Current Status**: ✅ Working

---

### E.11 Bespoke Orders Pipeline

**Feature Name**: Manage Bespoke Orders with Production Stages
**Routes**: `/admin/bespoke`, `/admin/bespoke/new`, `/admin/bespoke/[id]`
**Pages Involved**: `src/app/admin/bespoke/page.tsx`, `new/page.tsx`, `[id]/page.tsx`, `BespokeOrderDetailClient.tsx`

**User Story**:
As an admin, I want to manage bespoke orders through a multi-stage pipeline (Inquiry → Delivered) so that I can track custom garment production.

**Acceptance Criteria**:
1. **Bespoke Orders List**:
   - Kanban board or table grouped by status
   - Statuses: INQUIRY, MEASURING, DESIGNING, CUTTING, SEWING, FITTING, FINISHING, READY, DELIVERED
   - Columns: Order #, Customer, Status, Created Date, Estimated Completion
   - Filters: Status, Date Range, Search (customer name/email)
   - "Create Bespoke Order" button
2. **Create Bespoke Order**:
   - Customer (search existing or enter new)
   - Customer Name, Email, Phone (required)
   - Design Description (textarea)
   - Design Images (upload multiple, e.g., inspiration photos)
   - Reference Images (upload)
   - Measurement (select from customer's saved measurements or "Schedule New Fitting")
   - Estimated Price (NGN)
   - Deposit Amount (NGN, optional)
   - Fabric Details (textarea)
   - Estimated Completion Date (date picker)
   - Internal Notes (textarea, hidden from customer)
   - "Create Order" button
3. **Bespoke Order Detail**:
   - Customer info (name, email, phone, link to Customer 360)
   - Status badge with color-coded pill
   - **Update Status** (dropdown with save button):
     - On change: create BespokeStatusLog, send notification, send email
   - Design images gallery
   - Measurement details (if linked)
   - Pricing: Estimated Price, Final Price, Deposit Amount, Deposit Paid (checkbox)
   - Timeline: Estimated vs Actual Completion Date
   - **Production Tasks** (embedded list):
     - Task title, stage, status, assigned to, due date
     - "Add Task" button
   - **Status History** (timeline from BespokeStatusLog)
   - "Delete Order" button (with confirmation)

**Database Models**: `BespokeOrder`, `BespokeStatusLog`, `ProductionTask`, `CustomerMeasurement`, `User`

**API Endpoints**:
- `GET /api/admin/bespoke` (list all)
- `POST /api/admin/bespoke` (create)
- `GET /api/admin/bespoke/[id]` (detail)
- `PUT /api/admin/bespoke/[id]` (update)
- `PUT /api/admin/bespoke/[id]/status` (update status)
- `DELETE /api/admin/bespoke/[id]` (delete)

**Current Status**: ✅ Working

---

### E.12 Production Tasks

**Feature Name**: Task Management for Bespoke Production
**Route**: `/admin/production`
**Pages Involved**: `src/app/admin/production/page.tsx`

**User Story**:
As an admin, I want to create and assign production tasks (cutting, sewing, fitting, etc.) to staff members so that bespoke orders are completed on schedule.

**Acceptance Criteria**:
1. **Tasks Board**:
   - Kanban view grouped by status (NOT_STARTED, IN_PROGRESS, COMPLETED)
   - Each card shows: Task title, Bespoke order #, Assigned to, Due date, Priority
   - Drag-drop to change status (optional)
2. **Create Task** (modal or form):
   - Bespoke Order (dropdown, required)
   - Title (required)
   - Description (textarea)
   - Stage (dropdown: MEASURING, DESIGNING, CUTTING, SEWING, FITTING, FINISHING)
   - Assigned To (dropdown of STAFF users)
   - Priority (Low/Normal/High)
   - Due Date (date picker)
   - Estimated Hours (number)
   - "Create Task" button
3. **Task Detail** (modal):
   - View all task info
   - Update status (dropdown: NOT_STARTED, IN_PROGRESS, COMPLETED)
   - Actual Hours (input)
   - Completed At (auto-filled when status=COMPLETED)
   - Notes (textarea)
   - "Save" button
4. On task completion:
   - If all tasks for a bespoke order are COMPLETED, suggest updating bespoke status to READY

**Database Models**: `ProductionTask`, `BespokeOrder`, `User`

**API Endpoints**:
- `GET /api/admin/production` (list all tasks)
- `POST /api/admin/production` (create task)
- `PUT /api/admin/production/[id]` (update task)
- `DELETE /api/admin/production/[id]` (delete task)

**Current Status**: ✅ Working

---

### E.13 Fabric Inventory

**Feature Name**: Manage Fabric Stock
**Routes**: `/admin/fabrics`, `/admin/fabrics/[id]`
**Pages Involved**: `src/app/admin/fabrics/page.tsx`, `FabricsPageClient.tsx`, `[id]/page.tsx`

**User Story**:
As an admin, I want to track fabric inventory (type, color, pattern, quantity in yards, supplier) so that I know what materials are available for bespoke orders.

**Acceptance Criteria**:
1. **Fabric List**:
   - Table: Image, Name, Type, Color, Pattern, Qty (yards), Min Stock, Supplier, Status
   - Filters: Type (Cotton, Silk, Linen, Ankara, Adire, Aso-Oke, etc.), Supplier, Low Stock
   - Search by name
   - Sorting: Name, Qty
   - Pagination
   - "Add Fabric" button
2. **Create/Edit Fabric** (page or modal):
   - Name (required)
   - Type (dropdown or text)
   - Color (text or color picker)
   - Pattern (text, e.g., "Floral", "Geometric")
   - Quantity (Yards) (number, required)
   - Min Stock Level (number, for alerts)
   - Cost Per Yard (NGN, optional)
   - Supplier (dropdown of suppliers)
   - Location (text, e.g., "Shelf A3")
   - Image (upload)
   - Notes (textarea)
   - Is Available (checkbox)
   - "Save" button
3. **Low Stock Alert**:
   - Highlight fabrics where Qty < Min Stock Level
   - Dashboard widget showing low stock count

**Database Models**: `FabricInventory`, `Supplier`

**API Endpoints**:
- `GET /api/admin/fabrics`
- `POST /api/admin/fabrics`
- `PUT /api/admin/fabrics/[id]`
- `DELETE /api/admin/fabrics/[id]`

**Current Status**: ✅ Working

---

### E.14 Suppliers Management

**Feature Name**: CRUD for Fabric Suppliers
**Routes**: `/admin/suppliers`, `/admin/suppliers/[id]`
**Pages Involved**: `src/app/admin/suppliers/page.tsx`, `SuppliersPageClient.tsx`, `[id]/page.tsx`

**User Story**:
As an admin, I want to maintain a list of fabric suppliers with contact info so that I can easily reorder materials.

**Acceptance Criteria**:
1. **Supplier List**:
   - Table: Name, Contact Name, Phone, WhatsApp, Email, City, State, Status
   - Filters: Status (Active/Inactive), State
   - Search by name
   - "Add Supplier" button
2. **Create/Edit Supplier** (page or modal):
   - Name (required)
   - Contact Name (optional)
   - Email (optional, format validation)
   - Phone (optional)
   - WhatsApp (optional)
   - Address, City, State (dropdowns for Nigerian states)
   - Notes (textarea)
   - Is Active (checkbox)
   - "Save" button
3. **Supplier Detail**:
   - View all info
   - List of fabrics from this supplier (linked table)
   - "Edit", "Deactivate", "Delete" buttons

**Database Models**: `Supplier`, `FabricInventory`

**API Endpoints**:
- `GET /api/admin/suppliers`
- `POST /api/admin/suppliers`
- `PUT /api/admin/suppliers/[id]`
- `DELETE /api/admin/suppliers/[id]`

**Current Status**: ✅ Working

---

### E.15 Customer 360 View (CRM)

**Feature Name**: Comprehensive Customer Management
**Routes**: `/admin/customers`, `/admin/customers/[id]`
**Pages Involved**: `src/app/admin/customers/page.tsx`, `CustomerListFilters.tsx`, `[id]/page.tsx`, `Customer360Client.tsx`

**User Story**:
As an admin, I want to view a 360-degree profile of each customer (orders, measurements, interactions, tickets, segments, tags) so that I can provide personalized service.

**Acceptance Criteria**:
1. **Customer List**:
   - Table: Name, Email, Phone, Total Orders, Total Spent, Tags, Created Date
   - Filters: Segment, Tags, Status (Active/Suspended)
   - Search by name/email
   - Sorting: Name, Total Spent, Created Date
   - Pagination
2. **Customer 360 Page** (tabbed interface):
   - **Overview Tab**:
     - Customer name, email, phone, status
     - Stats cards: Orders, Total Spent, Avg Order Value, Wishlist Items
     - Tags (badges, add/remove tags)
     - Segments (badges, add/remove from segments)
     - Notes (admin-only, add note form)
   - **Orders Tab**:
     - List of all customer orders
     - Quick actions: View, Update Status
   - **Measurements Tab**:
     - All saved measurements (view-only or CRUD)
     - "Add Measurement" button
   - **Interactions Tab**:
     - Log of all interactions (type, subject, description, staff, date)
     - "Log Interaction" button
   - **Tickets Tab**:
     - All support tickets from this customer
     - Link to ticket detail
3. **Add Customer** (button on list page):
   - Manual customer creation (name, email, phone, password)
   - Role=CUSTOMER

**Database Models**: `User`, `CustomerProfile`, `Order`, `CustomerMeasurement`, `CustomerInteraction`, `CustomerTag`, `CustomerTagAssignment`, `CustomerSegment`, `CustomerSegmentMember`, `CustomerNote`, `SupportTicket`

**API Endpoints**:
- `GET /api/admin/customers` (list)
- `GET /api/admin/customers/[id]` (360 detail)
- `POST /api/admin/customers/[id]/interactions` (log interaction)
- `POST /api/admin/customers/[id]/measurements` (add measurement)
- `PUT /api/admin/customers/[id]/measurements/[measurementId]` (update)
- `POST /api/admin/customers/[id]/tags` (assign tag)
- `DELETE /api/admin/customers/[id]/tags/[tagId]` (remove tag)
- `POST /api/admin/customers/[id]/segments` (add to segment)
- `DELETE /api/admin/customers/[id]/segments/[segmentId]` (remove)

**Current Status**: ✅ Working

---

### E.16 Customer Segments

**Feature Name**: CRUD for Customer Segments
**Routes**: `/admin/segments`, `/admin/segments/[id]`
**Pages Involved**: `src/app/admin/segments/page.tsx`, `SegmentListClient.tsx`, `[id]/page.tsx`

**User Story**:
As an admin, I want to create customer segments (VIP, Inactive, High Spenders, etc.) so that I can target marketing campaigns and apply business logic.

**Acceptance Criteria**:
1. **Segment List**:
   - Table: Name, Description, Member Count, Color (badge), Automatic, Created Date
   - "Create Segment" button
2. **Create/Edit Segment** (page or modal):
   - Name (required, unique)
   - Description (textarea)
   - Color (color picker, for badge display)
   - Is Automatic (checkbox, for future rule-based segments)
   - Criteria (JSON or text, for automatic segments)
   - "Save" button
3. **Segment Detail**:
   - List of members (customer names, emails)
   - "Add Member" button (search customer, add to segment)
   - "Remove" action per member
4. Usage:
   - Filter customers by segment on Customer List page
   - Use segments in email campaigns (future feature)

**Database Models**: `CustomerSegment`, `CustomerSegmentMember`, `User`

**API Endpoints**:
- `GET /api/admin/segments`
- `POST /api/admin/segments`
- `GET /api/admin/segments/[id]`
- `PUT /api/admin/segments/[id]`
- `DELETE /api/admin/segments/[id]`

**Current Status**: ✅ Working

---

### E.17 Newsletter Subscribers

**Feature Name**: Manage Email Newsletter Subscribers
**Route**: `/admin/newsletter`
**Pages Involved**: `src/app/admin/newsletter/page.tsx`, `newsletter-table.tsx`, `export-csv-button.tsx`

**User Story**:
As an admin, I want to view all newsletter subscribers and export the list so that I can run email campaigns.

**Acceptance Criteria**:
1. **Subscriber List**:
   - Table: Email, Source (Signup Form, Checkout, Manual), Subscribed At, Status (Subscribed/Unsubscribed)
   - Filters: Status, Source, Date Range
   - Search by email
   - Sorting: Date (newest first)
   - Pagination
2. **Export CSV** button:
   - Downloads CSV with all subscribers matching current filters
   - Columns: Email, Source, Subscribed At, Unsubscribed At
3. **Manual Add** (button):
   - Input email, click "Add" to create subscriber
4. **Unsubscribe** action (per row):
   - Sets `isSubscribed=false`, `unsubscribedAt=now()`

**Database Models**: `NewsletterSubscriber`

**API Endpoints**: Server actions in `actions.ts`

**Public Integration**:
- Footer newsletter form submits to `POST /api/newsletter/subscribe`
- Unsubscribe link: `POST /api/newsletter/unsubscribe?email=[email]`

**Current Status**: ✅ Working

---

### E.18 Consultations Management

**Feature Name**: Manage Consultation Bookings
**Routes**: `/admin/consultations`, `/admin/consultations/[id]`
**Pages Involved**: `src/app/admin/consultations/page.tsx`, `consultations-table.tsx`, `[id]/page.tsx`

**User Story**:
As an admin, I want to view consultation requests (measurement, wedding, fabric selection) and update their status so that I can schedule appointments.

**Acceptance Criteria**:
1. **Consultations List**:
   - Table: Name, Phone, Email, Type, Status, Preferred Date, Created Date
   - Filters: Status (Pending/Confirmed/Completed/Cancelled), Type
   - Sorting: Date (newest first)
   - Pagination
2. **Consultation Detail**:
   - View all info (name, phone, email, type, message, preferred date)
   - **Update Status** (dropdown: Pending/Confirmed/Completed/Cancelled)
   - Admin notes (textarea)
   - "Save" button
3. On status change to CONFIRMED:
   - Send confirmation SMS/email to customer (optional, not implemented)

**Database Models**: `ConsultationBooking`

**API Endpoints**: Server actions in `actions.ts`

**Current Status**: ✅ Working

---

### E.19 Messages (Contact Form Submissions)

**Feature Name**: View Contact Form Messages
**Routes**: `/admin/messages`, `/admin/messages/[id]`
**Pages Involved**: `src/app/admin/messages/page.tsx`, `[id]/page.tsx`

**User Story**:
As an admin, I want to view messages submitted via the contact form so that I can respond to inquiries.

**Acceptance Criteria**:
1. **Messages List**:
   - Table: Name, Email, Message (truncated), Is Read, Date
   - Filters: Read/Unread
   - Sorting: Date (newest first)
   - Pagination
2. **Message Detail**:
   - Full name (first + last)
   - Email
   - Full message
   - Date submitted
   - "Mark as Read" button
   - "Delete" button (with confirmation)
3. On open:
   - Auto-mark as read

**Database Models**: `ContactMessage`

**API Endpoints**: Server actions in `actions.ts`

**Current Status**: ✅ Working

---

### E.20 Support Tickets (Admin View)

**Feature Name**: Manage All Support Tickets
**Routes**: `/admin/tickets`, `/admin/tickets/[id]`
**Pages Involved**: `src/app/admin/tickets/page.tsx`, `TicketsListFilters.tsx`, `[id]/page.tsx`

**User Story**:
As an admin, I want to view all support tickets, reply to customers, and update ticket status so that I can provide customer support.

**Acceptance Criteria**:
1. **Ticket List**:
   - Table: Ticket #, Customer, Subject, Status, Priority, Created Date
   - Filters: Status, Priority, Search (subject/customer)
   - Sorting: Date, Priority
   - Pagination
2. **Ticket Detail**:
   - Ticket info (customer, subject, status, priority)
   - Conversation thread (chronological)
   - **Reply Form**:
     - Message (textarea)
     - "Internal Note" checkbox (visible only to admins/staff)
     - "Send Reply" button
   - **Update Status** (dropdown: Open/In Progress/Resolved/Closed)
   - **Update Priority** (dropdown: Low/Normal/High)
3. On reply:
   - Create SupportTicketMessage
   - Send email notification to customer (if not internal)

**Database Models**: `SupportTicket`, `SupportTicketMessage`, `User`, `Order`

**API Endpoints**: Same as customer ticket APIs

**Current Status**: ✅ Working

---

### E.21 CMS Pages

**Feature Name**: CRUD for Content Pages
**Routes**: `/admin/pages`, `/admin/pages/new`, `/admin/pages/[id]/edit`
**Pages Involved**: `src/app/admin/pages/page.tsx`, `PageForm.tsx`, `new/page.tsx`, `[id]/edit/page.tsx`

**User Story**:
As an admin, I want to create and edit content pages (About, FAQ, Terms, etc.) so that I can update site content without code changes.

**Acceptance Criteria**:
1. **Pages List**:
   - Table: Title, Slug, Status (Published/Draft), Created Date, Updated Date
   - "Create Page" button
   - Edit/Delete actions
2. **Create/Edit Page**:
   - Title (required)
   - Slug (auto-generated, editable, must be unique)
   - Content (rich text editor or textarea, supports Markdown or HTML)
   - Meta Title (SEO)
   - Meta Description (SEO)
   - Is Published (checkbox)
   - "Save Draft" button
   - "Publish" button
3. Preview button (opens `/[slug]` in new tab)
4. Published pages are accessible at `/[slug]`

**Database Models**: `PageContent`

**API Endpoints**: Server actions in `actions.ts`

**Current Status**: ✅ Working

---

### E.22 Reports & Analytics

**Feature Name**: Business Intelligence Reports
**Route**: `/admin/reports`
**Pages Involved**: `src/app/admin/reports/page.tsx`

**User Story**:
As an admin, I want to view sales reports, product performance, and customer insights so that I can make data-driven decisions.

**Acceptance Criteria**:
1. **Date Range Selector** (apply to all reports)
2. **Revenue Report**:
   - Total revenue (chart: daily/weekly/monthly)
   - Revenue by product category (pie chart)
   - Revenue by payment status (Paid vs Unpaid)
3. **Orders Report**:
   - Total orders
   - Orders by status (bar chart)
   - Average order value
   - Orders by source (Online vs Bespoke)
4. **Products Report**:
   - Top 10 products by revenue
   - Top 10 products by units sold
   - Products with no sales (last 30 days)
5. **Customers Report**:
   - New customers (this period)
   - Customer lifetime value (CLV)
   - Repeat purchase rate
6. **Export** buttons (CSV/Excel)

**Database Models**: `Order`, `Product`, `User`

**API Endpoints**:
- `GET /api/admin/reports?startDate=X&endDate=Y` (aggregated data)

**Current Status**: ⚠️ Partially Working
- Page exists
- Charts/data fetching may need completion

---

### E.23 User Management

**Feature Name**: CRUD for Admin/Staff Users
**Routes**: `/admin/users`, `/admin/users/new`, `/admin/users/[id]`, `/admin/users/[id]/edit`
**Pages Involved**: `src/app/admin/users/page.tsx`, `UsersListFilters.tsx`, `new/page.tsx`, `[id]/page.tsx`, `[id]/edit/page.tsx`

**User Story**:
As an admin, I want to create, edit, and manage admin and staff user accounts so that I can control who has access to the system.

**Acceptance Criteria**:
1. **User List**:
   - Table: Name, Email, Role (Admin/Staff), Status (Active/Suspended), Last Login, Created Date
   - Filters: Role, Status
   - Search by name/email
   - "Add User" button
2. **Create/Edit User**:
   - Name (required)
   - Email (required, unique)
   - Role (dropdown: ADMIN, STAFF) (cannot create SUPER_ADMIN from admin panel)
   - Status (dropdown: ACTIVE, SUSPENDED)
   - Password (required for new users, optional for edit)
   - "Save" button
3. **User Detail**:
   - View user info
   - Activity log (last login, actions)
   - "Edit", "Suspend", "Delete" buttons
4. On suspend:
   - User cannot log in
   - Show error "Account suspended" on login attempt

**Database Models**: `User`

**API Endpoints**:
- `GET /api/admin/users`
- `POST /api/admin/users`
- `GET /api/admin/users/[id]`
- `PUT /api/admin/users/[id]`
- `DELETE /api/admin/users/[id]`

**Current Status**: ✅ Working

---

### E.24 Store Settings

**Feature Name**: Configure Store Information
**Route**: `/admin/settings`
**Pages Involved**: `src/app/admin/settings/page.tsx`, `SettingsClient.tsx`

**User Story**:
As an admin, I want to configure store details (name, logo, social links, payment keys, WhatsApp) so that the site reflects current branding and integrations.

**Acceptance Criteria**:
1. **Settings Form**:
   - Store Name (required)
   - Store Email (required)
   - Store Phone (required)
   - Store Address (textarea)
   - Currency (default: NGN, read-only or dropdown)
   - Paystack Public Key (required for payments)
   - Paystack Secret Key (required, encrypted before save, shown as asterisks)
   - WhatsApp Number (for customer support)
   - Social Links (Instagram, Facebook, Twitter URLs)
   - Free Shipping Threshold (NGN, optional)
   - Logo URL (upload to Supabase)
   - Favicon URL (upload to Supabase)
   - "Save Settings" button
2. On save:
   - Update StoreSettings record (single row table)
   - Encrypt Paystack Secret Key before storing
3. These settings are used:
   - Site header (logo, name)
   - Footer (social links, WhatsApp)
   - Checkout (Paystack keys)

**Database Models**: `StoreSettings`

**API Endpoints**: Server actions or API route

**Current Status**: ✅ Working

---

## F. Staff Dashboard

### F.1 Staff Dashboard

**Feature Name**: Staff Overview with Assigned Tasks
**Route**: `/staff/dashboard`
**Pages Involved**: `src/app/staff/dashboard/page.tsx`

**User Story**:
As a staff member, I want to see my assigned tasks for today and pending orders so that I know what to work on.

**Acceptance Criteria**:
1. **My Tasks Today** (cards or list):
   - Tasks assigned to me with due date = today
   - Shows: Bespoke Order #, Task Title, Stage, Priority, Due Time
   - "Start Task" or "Mark Complete" button
2. **Pending Orders** (last 10):
   - Orders in PROCESSING status
   - Shows: Order #, Customer, Date, Total
   - "View Details" link
3. **Quick Stats**:
   - My Open Tasks (count)
   - Orders to Process Today (count)
   - Bespoke Orders in Progress (count)
4. **Quick Actions**:
   - "View All Tasks"
   - "View All Orders"

**Database Models**: `ProductionTask`, `Order`, `User`

**Current Status**: ✅ Working

---

### F.2 Staff Orders View

**Feature Name**: View and Process Orders
**Routes**: `/staff/orders`, `/staff/orders/[id]`
**Pages Involved**: `src/app/staff/orders/page.tsx`, `[id]/page.tsx`

**User Story**:
As a staff member, I want to view orders assigned to me (or all orders) and update their status so that I can fulfill orders.

**Acceptance Criteria**:
1. Similar to Admin Orders, but may have limited actions
2. Can update order status (PROCESSING → SHIPPED)
3. Can add tracking number
4. Cannot delete orders or access all admin features

**Database Models**: `Order`, `OrderItem`, `OrderStatusLog`

**Current Status**: ✅ Working

---

### F.3 Staff Bespoke Orders

**Feature Name**: View Bespoke Orders and Complete Tasks
**Routes**: `/staff/bespoke`, `/staff/bespoke/[id]`
**Pages Involved**: `src/app/staff/bespoke/page.tsx`, `[id]/page.tsx`

**User Story**:
As a staff member, I want to view bespoke orders and mark my assigned tasks as complete so that production progresses.

**Acceptance Criteria**:
1. View all bespoke orders (read-only detail)
2. See tasks assigned to me
3. Update task status (IN_PROGRESS, COMPLETED)
4. Log actual hours worked
5. Cannot change bespoke order status (admin-only)

**Database Models**: `BespokeOrder`, `ProductionTask`

**Current Status**: ✅ Working

---

### F.4 Staff Tasks

**Feature Name**: My Production Tasks
**Route**: `/staff/tasks`
**Pages Involved**: `src/app/staff/tasks/page.tsx`

**User Story**:
As a staff member, I want to see all tasks assigned to me so that I can manage my workload.

**Acceptance Criteria**:
1. List of tasks where `assignedToId` = current user
2. Filters: Status, Stage, Due Date
3. Kanban board view (NOT_STARTED, IN_PROGRESS, COMPLETED)
4. Drag-drop to update status
5. Click task to view detail + update

**Database Models**: `ProductionTask`, `BespokeOrder`

**Current Status**: ✅ Working

---

### F.5 Staff Customers

**Feature Name**: View Customer Info and Log Interactions
**Routes**: `/staff/customers`, `/staff/customers/[id]`
**Pages Involved**: `src/app/staff/customers/page.tsx`, `[id]/page.tsx`

**User Story**:
As a staff member, I want to search for customers and log interactions (phone calls, visits, fittings) so that we maintain interaction history.

**Acceptance Criteria**:
1. Search customers by name/email/phone
2. View customer detail (limited to Overview, Orders, Measurements, Interactions)
3. **Log Interaction** (button):
   - Type (dropdown: Phone Call, In-Person Visit, Fitting, Consultation, Complaint)
   - Subject (optional)
   - Description (textarea, required)
   - "Save" button
4. Cannot edit customer profile or manage segments/tags (admin-only)

**Database Models**: `User`, `CustomerInteraction`, `Order`, `CustomerMeasurement`

**API Endpoints**:
- `POST /api/admin/customers/[id]/interactions`

**Current Status**: ✅ Working

---

### F.6 Staff Interactions Log

**Feature Name**: View All Logged Interactions
**Route**: `/staff/interactions`
**Pages Involved**: `src/app/staff/interactions/page.tsx`

**User Story**:
As a staff member, I want to see all customer interactions I've logged so that I can review my activity.

**Acceptance Criteria**:
1. List of interactions where `staffUserId` = current user
2. Columns: Customer Name, Type, Subject, Description, Date
3. Filters: Type, Date Range
4. Sorting: Date (newest first)
5. Click to view customer detail

**Database Models**: `CustomerInteraction`, `User`

**Current Status**: ✅ Working

---

## G. Super Admin Dashboard

### G.1 Super Admin Dashboard

**Feature Name**: System-Wide Overview
**Route**: `/super-admin/dashboard`
**Pages Involved**: `src/app/super-admin/dashboard/page.tsx`

**User Story**:
As a super admin, I want to see global stats across all stores/tenants (if multi-tenant) or system health metrics so that I can monitor the platform.

**Acceptance Criteria**:
1. **System Stats**:
   - Total Users (all roles)
   - Total Orders (all time)
   - Total Revenue (all time)
   - Active Sessions (if tracked)
2. **Recent Activity** (from ActivityLog):
   - User actions (logins, changes, deletions)
   - Show: User, Action, Entity Type, Entity ID, Timestamp
3. **Quick Links**:
   - "Manage Users"
   - "View Activity Logs"
   - "Configure SMTP"

**Database Models**: `User`, `Order`, `ActivityLog`

**API Endpoints**:
- `GET /api/super-admin/stats`

**Current Status**: ✅ Working

---

### G.2 Super Admin Users

**Feature Name**: Manage All Users (Including Super Admins)
**Route**: `/super-admin/users`
**Pages Involved**: `src/app/super-admin/users/page.tsx`

**User Story**:
As a super admin, I want to create, edit, and delete users of any role (including other super admins) so that I have full control.

**Acceptance Criteria**:
1. Similar to Admin Users, but:
   - Can create/edit SUPER_ADMIN role
   - Can view all users (customers, staff, admin, super admin)
2. Filters: Role (all roles)
3. Suspend/Delete actions for any user

**Database Models**: `User`

**Current Status**: ✅ Working

---

### G.3 Store Settings

**Feature Name**: Configure Global Store Settings
**Route**: `/super-admin/store-settings`
**Pages Involved**: `src/app/super-admin/store-settings/page.tsx`, `store-settings-form.tsx`

**User Story**:
As a super admin, I want to configure store-wide settings so that I can control branding and integrations.

**Acceptance Criteria**:
- Same as Admin Settings page, but accessible to super admin only

**Database Models**: `StoreSettings`

**Current Status**: ✅ Working

---

### G.4 SMTP Settings

**Feature Name**: Configure Email Server
**Route**: `/super-admin/settings/smtp`
**Pages Involved**: `src/app/super-admin/settings/smtp/page.tsx`, `smtp-settings-form.tsx`

**User Story**:
As a super admin, I want to configure SMTP settings (host, port, username, password) so that the platform can send emails.

**Acceptance Criteria**:
1. **SMTP Form**:
   - Host (e.g., smtp.gmail.com)
   - Port (e.g., 587, 465, 25)
   - Encryption (dropdown: None, TLS, SSL)
   - Username (email address)
   - Password (encrypted before save, shown as asterisks)
   - From Name (e.g., "Fashion By Grant")
   - From Email (e.g., noreply@fashionbygrant.com)
   - Reply-To Email (optional)
   - Is Active (checkbox)
   - "Save" button
2. **Test Email** button:
   - Input: Test recipient email
   - Sends test email to verify SMTP works
   - Shows success/error message
3. On save:
   - Encrypt password before storing in `SmtpSettings`
   - Only one active SMTP config at a time

**Database Models**: `SmtpSettings`

**API Endpoints**:
- `POST /api/admin/settings/smtp` (save settings)
- `POST /api/admin/settings/smtp/test` (send test email)

**Current Status**: ✅ Working

---

### G.5 Email Templates

**Feature Name**: Manage Email Templates
**Routes**: `/super-admin/settings/templates`, `/super-admin/settings/templates/new`, `/super-admin/settings/templates/[id]`
**Pages Involved**: `src/app/super-admin/settings/templates/page.tsx`, `new/page.tsx`, `[id]/page.tsx`

**User Story**:
As a super admin, I want to create and edit email templates (order confirmation, password reset, etc.) so that I can customize transactional emails.

**Acceptance Criteria**:
1. **Template List**:
   - Table: Name, Subject, Status (Active/Inactive), Created Date
   - "Create Template" button
2. **Create/Edit Template**:
   - Name (unique, e.g., "order-confirmation", "password-reset")
   - Subject (can include variables like `{{orderNumber}}`)
   - Body HTML (rich text editor or code editor, supports Handlebars syntax)
   - Body Text (plain text fallback)
   - Is Active (checkbox)
   - "Save" button
3. **Variables** (documentation):
   - List of available variables per template type
   - Example: Order Confirmation: `{{customerName}}`, `{{orderNumber}}`, `{{total}}`, `{{trackingUrl}}`
4. **Preview** button:
   - Shows rendered template with sample data

**Database Models**: `EmailTemplate`

**API Endpoints**:
- `GET /api/admin/settings/templates`
- `POST /api/admin/settings/templates`
- `PUT /api/admin/settings/templates/[id]`
- `DELETE /api/admin/settings/templates/[id]`

**Current Status**: ✅ Working

---

### G.6 Email Logs

**Feature Name**: View Email Send History
**Route**: `/super-admin/settings/email-logs`
**Pages Involved**: `src/app/super-admin/settings/email-logs/page.tsx`

**User Story**:
As a super admin, I want to view a log of all emails sent by the system so that I can troubleshoot delivery issues.

**Acceptance Criteria**:
1. **Email Logs Table**:
   - Columns: To Email, Template Name, Subject, Status (Sent/Failed), Error Message, Sent At
   - Filters: Status, Template Name, Date Range
   - Search by recipient email
   - Sorting: Date (newest first)
   - Pagination (50 per page)
2. **Log Detail** (modal or expandable row):
   - Full payload (JSON)
   - Error message (if failed)
   - Retry button (if failed)

**Database Models**: `EmailLog`

**Current Status**: ✅ Working

---

### G.7 Activity Logs

**Feature Name**: System Activity Audit Trail
**Route**: `/super-admin/activity`
**Pages Involved**: `src/app/super-admin/activity/page.tsx`

**User Story**:
As a super admin, I want to view all user actions (logins, CRUD operations, deletions) so that I can audit system usage and detect anomalies.

**Acceptance Criteria**:
1. **Activity Log Table**:
   - Columns: User, Action, Entity Type, Entity ID, Metadata, Timestamp
   - Filters: User (dropdown), Action Type, Entity Type, Date Range
   - Search by Entity ID
   - Sorting: Date (newest first)
   - Pagination (100 per page)
2. **Actions Tracked**:
   - User login/logout
   - Create/Update/Delete operations on:
     - Products, Orders, Users, Bespoke Orders, Customers, etc.
3. Metadata field stores additional context (JSON):
   - Example: `{"oldValue": "PENDING", "newValue": "PROCESSING"}` for status updates

**Database Models**: `ActivityLog`, `User`

**Current Status**: ✅ Working

---

### G.8 Analytics

**Feature Name**: Advanced Business Analytics
**Route**: `/super-admin/analytics` (or `/super-admin/reports`)
**Pages Involved**: `src/app/super-admin/reports/page.tsx`

**User Story**:
As a super admin, I want to access detailed analytics (cohort analysis, funnel metrics, LTV) so that I can drive strategic decisions.

**Acceptance Criteria**:
1. **Cohort Analysis**:
   - Retention by signup month
   - Repeat purchase rate
2. **Funnel Metrics**:
   - Checkout abandonment rate
   - Cart-to-purchase conversion
3. **Customer LTV**:
   - Average lifetime value by segment
4. **Revenue Breakdown**:
   - By category, by collection, by product
5. **Traffic Sources** (if tracked):
   - Organic, Referral, Direct
6. **Export** all reports to CSV/Excel

**Database Models**: `User`, `Order`, `Product`, `Category`

**API Endpoints**:
- `GET /api/super-admin/analytics?metric=[metric]&startDate=X&endDate=Y`

**Current Status**: ⚠️ Partially Working
- Basic stats work
- Advanced analytics may need implementation

---

### G.9 Categories (Super Admin Override)

**Feature Name**: Manage Categories (Super Admin)
**Route**: `/super-admin/categories`

Same as Admin Categories, but super admin access.

**Current Status**: ✅ Working

---

### G.10 Collections (Super Admin Override)

**Feature Name**: Manage Collections (Super Admin)
**Route**: `/super-admin/collections`

Same as Admin Collections.

**Current Status**: ✅ Working

---

### G.11 CMS (Super Admin Override)

**Feature Name**: Manage CMS Pages (Super Admin)
**Route**: `/super-admin/cms`

Same as Admin CMS Pages.

**Current Status**: ✅ Working

---

### G.12 Coupons (Super Admin Override)

**Feature Name**: Manage Coupons (Super Admin)
**Route**: `/super-admin/coupons`

Same as Admin Coupons.

**Current Status**: ✅ Working

---

### G.13 Shipping (Super Admin Override)

**Feature Name**: Manage Shipping Zones (Super Admin)
**Route**: `/super-admin/shipping`

Same as Admin Shipping.

**Current Status**: ✅ Working

---

## 4. Integration Matrix

This matrix shows how features trigger notifications, emails, stock updates, and other cross-feature impacts.

| Trigger Event | Affected Systems | Expected Behavior |
|--------------|------------------|-------------------|
| **Order Placed** | Order, Payment, Stock, Notification, Email | - Create Order + OrderItem records<br>- Create Payment (PENDING)<br>- DO NOT deduct stock yet<br>- NO notification sent (payment not confirmed) |
| **Payment Confirmed** (Paystack webhook) | Order, Payment, Stock, Notification, Email | - Update Order.paymentStatus=PAID, status=PROCESSING<br>- Update Payment.status=PAID<br>- Deduct stock from ProductVariant<br>- Create StockMovement (type=SALE)<br>- Create in-app Notification for customer<br>- Send order confirmation email |
| **Order Status Changed** | Notification, Email, OrderStatusLog | - Create OrderStatusLog entry<br>- Send notification to customer<br>- Send email to customer<br>- If status=SHIPPED: include tracking info |
| **Return Requested** | ReturnRequest, Notification | - Create ReturnRequest (PENDING)<br>- Notify admin (in-app) |
| **Return Processed** | ReturnRequest, Notification, Email | - Update ReturnRequest.status<br>- Notify customer (in-app + email)<br>- If REFUNDED: admin manually refunds via Paystack |
| **Review Submitted** | Review, Notification | - Create Review (PENDING)<br>- Notify admin for moderation |
| **Review Approved** | Review, Notification | - Update Review.status=APPROVED<br>- Notify customer (optional) |
| **Bespoke Status Changed** | BespokeOrder, BespokeStatusLog, Notification, Email | - Create BespokeStatusLog<br>- Send notification to customer<br>- Send email to customer |
| **Production Task Completed** | ProductionTask, BespokeOrder | - Update task.status=COMPLETED<br>- If all tasks complete: suggest updating bespoke status |
| **Newsletter Signup** | NewsletterSubscriber | - Create NewsletterSubscriber (isSubscribed=true) |
| **Contact Form Submitted** | ContactMessage, Notification | - Create ContactMessage<br>- Notify admin (optional, NOT implemented) |
| **Consultation Requested** | ConsultationBooking, Notification | - Create ConsultationBooking<br>- Notify admin (optional, NOT implemented) |
| **Support Ticket Created** | SupportTicket, SupportTicketMessage | - Create ticket + initial message |
| **Support Ticket Reply** | SupportTicketMessage, Notification, Email | - Create message<br>- If from admin: notify customer (email + in-app)<br>- If from customer: notify admin (in-app) |
| **Stock Adjusted** | ProductVariant, StockMovement | - Update variant.stockQty<br>- Create StockMovement record |
| **User Suspended** | User | - User cannot login<br>- Active sessions terminated (if session management implemented) |
| **Password Reset Requested** | PasswordReset, Email | - Create token<br>- Send email with reset link |

### 4.1 Missing Integrations (Identified Issues)

Based on code review, the following integrations are **missing or incomplete**:

1. **Contact Form** → Admin Notification
   - Contact form creates `ContactMessage` but does NOT send notification to admin
   - **Fix**: Add `createNotification` call for admin users after message creation

2. **Consultation Booking** → Admin Notification
   - Consultation form on homepage is NOT functional (no submit handler)
   - **Fix**: Connect form to `/api/consultations` endpoint, add admin notification

3. **Email Sending Reliability**
   - Email sending requires SMTP configuration
   - Default seed data does NOT include SMTP settings
   - **Fix**: Document SMTP setup in deployment guide, provide example settings

4. **Stock Deduction Timing**
   - Stock is deducted AFTER payment confirmation (correct)
   - BUT: No stock reservation during pending payment (race condition possible)
   - **Fix**: Implement stock reservation system or accept risk for low-traffic site

5. **Paystack Webhook Verification**
   - Webhook endpoint `/api/webhooks/paystack` exists
   - Needs verification that signature validation is implemented
   - **Fix**: Verify Paystack signature using secret key

6. **Return Refund Processing**
   - Return approval flow works
   - Actual refund is MANUAL (admin must refund via Paystack dashboard)
   - **Fix**: Integrate Paystack Refund API for automated refunds

7. **Customer Address Management**
   - No dedicated address management page
   - Addresses stored as JSON in Order.shippingAddress
   - **Fix**: Build Address CRUD feature (future enhancement)

---

## 5. Technical Requirements

### 5.1 Technology Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4 (@theme directive), custom design system
- **Backend**: Next.js API routes (serverless functions)
- **Database**: PostgreSQL (production), SQLite (development), Prisma ORM
- **Authentication**: NextAuth.js with Credentials provider
- **File Storage**: Supabase Storage (images, uploads)
- **Payments**: Paystack (Nigerian payment gateway)
- **Email**: Nodemailer with configurable SMTP
- **State Management**: React Context (Cart, Wishlist), Server Components (data fetching)
- **Validation**: Zod schemas
- **Security**: bcryptjs (password hashing), custom encryption utility, rate limiting

### 5.2 Performance Requirements

1. **Page Load Time**:
   - Public pages: <2s on 3G
   - Admin pages: <3s on broadband
2. **Server Response Time**:
   - API routes: <500ms p95
   - Database queries: <200ms p95
3. **Image Optimization**:
   - Next.js Image component for all images
   - Lazy loading below fold
   - WebP format with fallbacks
4. **Caching**:
   - Product catalog: 5-minute cache (revalidate=300)
   - Static pages: 1-hour cache
   - ISR for product detail pages

### 5.3 Security Requirements

1. **Authentication**:
   - Passwords hashed with bcryptjs (10 rounds)
   - Session tokens signed by NextAuth
   - Email verification for new signups
2. **Authorization**:
   - Middleware enforces role-based access
   - API routes validate permissions using `requireRole()`
   - Ownership checks for customer resources
3. **Input Validation**:
   - All API inputs validated with Zod schemas
   - SQL injection prevented by Prisma parameterized queries
   - XSS prevention via React's automatic escaping
4. **Rate Limiting**:
   - Checkout: 5 requests per 15 minutes per IP
   - Login: 10 requests per 15 minutes per IP
   - API: 100 requests per 15 minutes per IP (general)
5. **Data Protection**:
   - Sensitive data encrypted at rest (Paystack keys, SMTP passwords)
   - HTTPS enforced in production
   - CSRF protection via NextAuth
6. **Payment Security**:
   - PCI compliance via Paystack (no card data stored)
   - Webhook signature verification
   - Price validation server-side (never trust client)

### 5.4 Database Constraints

1. **Unique Constraints**:
   - User.email
   - Product.slug
   - Category.slug
   - Collection.slug
   - Coupon.code
   - ProductVariant.sku
   - PasswordReset.token
   - CustomerSegment.name
   - EmailTemplate.name
2. **Indexes** (for query performance):
   - User: email, role+status, verificationToken
   - Product: slug, status, status+createdAt, isFeatured, isNew
   - Order: userId, customerEmail, status, orderNumber, paymentStatus
   - Review: productId+status
   - Notification: userId+isRead
   - BespokeOrder: userId, status, orderNumber
   - ProductionTask: bespokeOrderId, assignedToId+status, status
3. **Cascading Deletes**:
   - Delete User → delete CustomerProfile, Cart, WishlistItems, Notifications
   - Delete Product → delete ProductImages, ProductVariants
   - Delete Order → delete OrderItems, OrderStatusLogs
   - Delete BespokeOrder → delete ProductionTasks, BespokeStatusLogs
   - Delete SupportTicket → delete SupportTicketMessages

### 5.5 API Response Format Standards

All API routes follow this JSON response structure:

**Success**:
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* payload */ }
}
```

**Error**:
```json
{
  "success": false,
  "message": "Error description",
  "errors": { /* field-level errors or array of strings */ }
}
```

**HTTP Status Codes**:
- 200: Success
- 201: Created
- 400: Bad request (validation error)
- 401: Unauthorized
- 403: Forbidden (insufficient permissions)
- 404: Not found
- 409: Conflict (e.g., duplicate, stock unavailable)
- 422: Unprocessable entity (Zod validation error)
- 429: Too many requests (rate limit)
- 500: Internal server error

### 5.6 Error Handling Standards

1. **Client-Side**:
   - Display user-friendly error messages
   - Show field-level errors inline (below input)
   - Global error toast for unexpected errors
   - Retry button for network failures
2. **Server-Side**:
   - Log all errors with context (user ID, endpoint, timestamp)
   - Never expose stack traces to client in production
   - Catch database errors and return generic message
   - Validate all inputs before processing

### 5.7 Nigerian Localization Requirements

1. **Currency**:
   - Default: NGN (Nigerian Naira)
   - Display symbol: ₦ or NGN
   - Format: ₦50,000.00 (comma thousands separator, 2 decimals)
2. **States**:
   - Dropdown of 36 Nigerian states + Abuja FCT
   - Shipping zones mapped to states
3. **Payment**:
   - Paystack integration (supports NGN)
   - Accept: Card, Bank Transfer, USSD, Mobile Money
4. **Phone Numbers**:
   - Format: +234 XXX XXX XXXX
   - Validation: Nigerian format
5. **WhatsApp Integration**:
   - WhatsApp number in footer for customer support
   - "Chat on WhatsApp" button links to WhatsApp Web/app

---

## 6. Testing Checklists

### 6.1 Public Store Testing

**Homepage**:
- [ ] Hero carousel auto-advances every 5 seconds
- [ ] All category cards link to correct shop filters
- [ ] Latest Drops section shows 4 products
- [ ] "Add to Cart" button on product cards works
- [ ] Consultation form submits successfully
- [ ] Footer newsletter signup works

**Shop Page**:
- [ ] Products display in grid
- [ ] Category filter applies correctly
- [ ] Price range filter works (min/max)
- [ ] Search query filters products
- [ ] Sorting (newest, price asc/desc) works
- [ ] Pagination works, maintains filters
- [ ] URL params persist on refresh

**Product Detail**:
- [ ] Main image displays
- [ ] Thumbnail click changes main image
- [ ] Variant selection updates price and stock
- [ ] "Add to Cart" works, opens cart drawer
- [ ] Quantity selector respects stock limit
- [ ] "Add to Wishlist" toggles heart icon
- [ ] Reviews section shows approved reviews
- [ ] Related products display

**Contact Page**:
- [ ] Form validation works (required fields, email format)
- [ ] Submit creates ContactMessage record
- [ ] Success message displays
- [ ] Form resets after submit

**Checkout**:
- [ ] Step 1: All fields validate
- [ ] Step 2: Shipping rates fetch based on state
- [ ] Step 3: Payment button redirects to Paystack
- [ ] After payment: Success page shows order number
- [ ] Cart clears after successful payment
- [ ] Stock is deducted after payment

---

### 6.2 Authentication Testing

**Signup**:
- [ ] Email uniqueness validated
- [ ] Password strength requirements enforced
- [ ] Verification email sent
- [ ] User created with role=CUSTOMER, status=ACTIVE

**Login**:
- [ ] Valid credentials log in successfully
- [ ] Invalid credentials show error
- [ ] Suspended accounts show error
- [ ] Redirect to appropriate dashboard by role
- [ ] "Remember me" extends session

**Email Verification**:
- [ ] Verification link works
- [ ] Invalid token shows error
- [ ] Expired token shows error

**Password Reset**:
- [ ] Forgot password sends reset link
- [ ] Reset link validates token
- [ ] New password updates user
- [ ] Token expires after 1 hour

---

### 6.3 Customer Account Testing

**Dashboard**:
- [ ] Stats cards display correct counts
- [ ] Recent orders show last 5
- [ ] Quick action buttons link correctly

**Orders**:
- [ ] Order history shows all user orders
- [ ] Order detail shows items, total, status
- [ ] "Request Return" button appears for DELIVERED orders
- [ ] "Reorder" adds all items to cart

**Profile**:
- [ ] Form pre-fills with user data
- [ ] Update name/email/phone works
- [ ] Change password validates current password
- [ ] Success message displays

**Wishlist**:
- [ ] All wishlist items display
- [ ] "Remove" removes item immediately
- [ ] "Add to Cart" works
- [ ] Empty state shows when no items

**Reviews**:
- [ ] Can only review purchased products
- [ ] Cannot review same product twice
- [ ] Submit creates review with status=PENDING
- [ ] Edit/Delete works for PENDING reviews

**Notifications**:
- [ ] All notifications display
- [ ] Unread notifications are bolded
- [ ] "Mark as Read" updates isRead
- [ ] "Mark All as Read" works
- [ ] Badge count in header is correct

**Tickets**:
- [ ] Create ticket works
- [ ] Reply works
- [ ] "Close Ticket" updates status

---

### 6.4 Admin Dashboard Testing

**Orders**:
- [ ] List shows all orders
- [ ] Filters work (status, payment status, date)
- [ ] Update status creates log and sends notification
- [ ] Add tracking number works
- [ ] "Export CSV" downloads file

**Products**:
- [ ] Create product works (with images, variants)
- [ ] Edit product updates all fields
- [ ] Delete product works (with confirmation)
- [ ] Image upload to Supabase works
- [ ] Variant SKU uniqueness enforced

**Categories**:
- [ ] Create category works
- [ ] Parent-child relationship works
- [ ] Edit/Delete works
- [ ] Cannot delete category with products

**Coupons**:
- [ ] Create coupon works
- [ ] Validation enforces rules (percentage 1-100, date range)
- [ ] Coupon applies at checkout
- [ ] Usage count increments
- [ ] Max uses limit enforced

**Inventory**:
- [ ] Stock adjustment works
- [ ] StockMovement record created
- [ ] Low stock alerts show

**Shipping**:
- [ ] Create zone with states works
- [ ] Add rate to zone works
- [ ] Checkout fetches rates for selected state

**Returns**:
- [ ] Return requests display
- [ ] Approve/Reject updates status
- [ ] Customer receives notification

**Reviews**:
- [ ] Approve/Reject works
- [ ] Approved reviews appear on product page

**Bespoke**:
- [ ] Create bespoke order works
- [ ] Update status creates log and sends notification
- [ ] Add task to order works

**Production**:
- [ ] Create task works
- [ ] Assign to staff works
- [ ] Update status works

**Customers**:
- [ ] Customer 360 shows all tabs
- [ ] Add measurement works
- [ ] Log interaction works
- [ ] Add/Remove tags works
- [ ] Add/Remove segments works

**Segments**:
- [ ] Create segment works
- [ ] Add member to segment works

**Newsletter**:
- [ ] Subscriber list displays
- [ ] Export CSV works

**Messages**:
- [ ] Contact messages display
- [ ] Mark as read works

**Tickets**:
- [ ] Admin can reply to tickets
- [ ] Update status/priority works

**CMS**:
- [ ] Create page works
- [ ] Edit page updates content
- [ ] Published pages appear at /[slug]

---

### 6.5 Super Admin Testing

**SMTP Settings**:
- [ ] Save settings works
- [ ] Password is encrypted
- [ ] Test email sends successfully

**Email Templates**:
- [ ] Create template works
- [ ] Variables render correctly
- [ ] Preview shows rendered template

**Email Logs**:
- [ ] Logs display sent emails
- [ ] Failed emails show error message

**Activity Logs**:
- [ ] User actions are logged
- [ ] Filters work

---

### 6.6 Integration Testing

**Order Flow (End-to-End)**:
1. [ ] Customer adds product to cart
2. [ ] Proceeds to checkout
3. [ ] Enters shipping info
4. [ ] Selects shipping method
5. [ ] Applies coupon code
6. [ ] Pays via Paystack
7. [ ] Receives order confirmation email
8. [ ] Receives in-app notification
9. [ ] Stock is deducted
10. [ ] Admin sees order in dashboard
11. [ ] Admin updates status to SHIPPED
12. [ ] Customer receives shipping notification
13. [ ] Customer tracks order
14. [ ] Admin marks as DELIVERED
15. [ ] Customer can write review
16. [ ] Customer can request return

**Bespoke Flow (End-to-End)**:
1. [ ] Customer submits consultation form (or admin creates bespoke order)
2. [ ] Admin creates bespoke order
3. [ ] Admin schedules measurement (creates task)
4. [ ] Staff completes measurement task
5. [ ] Admin adds measurement to customer profile
6. [ ] Admin updates bespoke status to DESIGNING
7. [ ] Customer receives notification
8. [ ] Admin creates production tasks (cutting, sewing, fitting, finishing)
9. [ ] Staff completes tasks
10. [ ] Admin updates status to READY
11. [ ] Customer receives notification
12. [ ] Customer collects/receives garment
13. [ ] Admin marks as DELIVERED

---

## Summary

This PRD comprehensively documents all features, acceptance criteria, database models, API endpoints, and integration points for the FBG Platform. Implementation agents can use this as the single source of truth to fix bugs, complete missing features, and ensure all functionality works end-to-end.

**Total Features Documented**: 90+
**Total Pages**: 95+
**Total API Endpoints**: 70+
**Total Database Models**: 35+

**Next Steps**:
1. Conduct integration testing using checklists in Section 6
2. Fix identified issues (contact form, consultation booking, SMTP setup)
3. Complete missing features (address management, advanced analytics)
4. Deploy to staging and perform QA
5. Launch to production

---

**End of PRD**
