# NextMart — E-commerce Web Application

NextMart is a React-based e-commerce project with a customer shopping flow and an admin area for managing store data.

## Features

### Customer experience
- Browse the home page and product catalogue
- View product details
- Add products to the cart and update quantities
- Sign in with email/password or Google
- Complete a checkout flow with Cash on Delivery or UPI intent/QR instructions
- View order confirmation and order history

### Admin experience
- Admin dashboard
- Add products with image/video media
- Manage products, orders, and users
- Protected customer and admin routes

> **Payment note:** The current UPI flow collects a user-entered UTR and records an order as pending verification. It does not automatically verify a bank/UPI payment. Treat this as a demo/manual-review flow, not a production payment gateway. COD is also represented as an order status.

## Tech Stack

- React 18
- Vite 5
- React Router
- Firebase Authentication
- Cloud Firestore
- Cloudinary uploads (image/video)
- Tailwind CSS 4
- Framer Motion
- React Toastify
- Lucide React

## Run Locally

1. Install Node.js (LTS).
2. Clone the repository:

   ```bash
   git clone https://github.com/Bharath170/nextmart.git
   cd nextmart
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Create a `.env` file in the project root using the variables below.
5. Start the development server:

   ```bash
   npm run dev
   ```

6. Create a production build:

   ```bash
   npm run build
   ```

## Environment Variables

Create `.env` in the project root:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_restricted_upload_preset
```

Do not commit your real `.env` file. Vite variables are included in the client bundle, so they are not suitable for private server secrets. Configure Firebase Authentication, Firestore Security Rules, and Cloudinary upload restrictions in their respective dashboards.

## Project Structure

```text
src/
  admin/       Admin dashboard and management pages
  components/  Shared UI components and route guards
  context/     Authentication and cart state
  firebase/    Firebase initialization
  pages/       Storefront, product, cart, checkout, and order pages
  utils/       Shared utilities
public/        Static assets and UPI app logos
```

## Important Production Checklist

- Review Firestore Security Rules; never rely only on client-side route guards for authorization.
- Ensure only trusted administrators can grant or change admin roles.
- Restrict Cloudinary unsigned uploads by file type, size, and upload preset; rotate the currently configured preset before using this project publicly.
- Verify payments server-side through an authorized payment provider before marking an order as paid.
- Validate order prices and product data on a trusted backend rather than trusting client-submitted totals.
- Test authentication, cart, checkout, and admin permissions before deployment.

## Project Status

Portfolio / learning project. Review the security and payment checklist before using it for real customers.

## Author

**Bharath Simha Reddy** — [GitHub](https://github.com/Bharath170)
