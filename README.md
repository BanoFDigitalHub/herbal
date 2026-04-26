# VitalCare — Pure Wellness E-commerce

Full-stack men's wellness e-commerce platform built for the Pakistani market. Built with Node.js, Express, MongoDB, and vanilla JS.

## Features

**Frontend (Customer-facing)**
- Apothecary-themed responsive design (Cormorant Garamond + Inter)
- Product browsing with categories, featured product, best sellers
- Quick-view modal with variants, gallery, reviews, details
- LocalStorage cart with multi-item, qty controls, free delivery threshold
- Checkout with delivery details + COD
- WhatsApp order confirmation with full order summary
- Mobile-first with hamburger menu and slide-in cart drawer

**Admin Panel (`/admin/login.html`)**
- Dashboard with stats (orders, revenue, low stock, last 7 days)
- Order management (status updates, search, filter, WhatsApp customer button)
- Inventory management (low-stock highlighting, inline stock edit)
- Product CRUD with full form (NOT modal): name, variants, gallery (link or upload), description, details key/value pairs, reviews, stock, category, sale tag, featured/best-seller flags
- Category management with editable hero images, titles, and subtitles
- Auto-generated product URL: `domain/product/{slug}-{5digit-code}`
- Password autofill disabled on login

**Backend**
- JWT auth (env-based admin credentials, no DB users table)
- MongoDB with Mongoose models (Product, Category, Order, Setting)
- Server-side price calculation on orders (anti-tampering)
- Auto-seeded default categories: Delay Tablets, Delay Spray, Delay Creams, Combo Deals
- Multer image upload (8MB limit, image-only)
- WhatsApp deep link generation with order summary

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure `.env`
The `.env` file is already configured with your MongoDB Atlas connection. Update `WHATSAPP_NUMBER` and `DOMAIN` for production:

```
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
ADMIN_EMAIL=admin@vitalcare.pk
ADMIN_PASSWORD=Admin@12345
WHATSAPP_NUMBER=923001234567
DOMAIN=https://vitalcare.pk
PORT=5000
```

### 3. Run
```bash
npm start
```

Server starts on `http://localhost:5000`. Default categories are seeded automatically on first run.

### 4. Access
- **Customer site**: `http://localhost:5000/`
- **Admin panel**: `http://localhost:5000/admin/login.html`
  - Email: `admin@vitalcare.pk`
  - Password: `Admin@12345`

## Project Structure

```
vitalcare-backend/
├── server.js                  # Express app entry
├── package.json
├── .env                       # Credentials (NOT committed)
├── models/
│   ├── Category.js
│   ├── Product.js             # Auto-generates productCode + URL
│   ├── Order.js               # Auto orderNumber
│   └── Setting.js
├── middleware/
│   ├── auth.js                # JWT verification
│   └── upload.js              # Multer config
├── routes/
│   ├── auth.js                # /api/auth/login, /verify
│   ├── categories.js          # CRUD + hero image upload
│   ├── products.js            # CRUD + image/gallery upload
│   └── orders.js              # Place order, admin manage, stats
└── public/
    ├── index.html             # Customer storefront
    ├── frontend.js            # Cart, checkout, product modal
    ├── admin/
    │   ├── login.html
    │   ├── index.html         # Admin SPA shell
    │   ├── admin.css
    │   └── app.js             # All admin views (dashboard, orders, products, inventory, categories)
    └── uploads/               # User-uploaded images
        ├── products/
        └── gallery/
```

## API Routes

### Public
- `GET /api/config` — returns whatsappNumber, deliveryFee, etc.
- `GET /api/categories` — active categories
- `GET /api/products` — supports `?category=ID&featured=true&bestseller=true&search=&limit=`
- `GET /api/products/slug/:slugCode` — single product by URL slug
- `POST /api/orders` — place order (server recalculates prices)

### Admin (Bearer JWT required)
- `POST /api/auth/login` — get token
- `GET /api/auth/verify` — verify token
- `POST/PUT/DELETE /api/categories` — CRUD (default categories cannot be deleted)
- `POST /api/categories/upload-hero` — multer upload
- `POST/PUT/DELETE /api/products` — CRUD
- `POST /api/products/upload` — main image
- `POST /api/products/upload-gallery` — multiple gallery images
- `PATCH /api/products/:id/stock` — quick stock update
- `GET /api/orders` — list with filters
- `PATCH /api/orders/:id/status` — update status
- `GET /api/orders/stats/overview` — dashboard stats

## Deployment

### Backend (Render)
1. Push project to GitHub.
2. Create new Web Service on Render, connect repo.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables from `.env`.
6. **Important**: Render disks are ephemeral — uploaded images at `/public/uploads/` will be lost on redeploy. For production, switch to **Cloudinary** or **AWS S3** for image storage. (Current setup is fine for testing/staging.)

### Frontend
The frontend is served by the same Node.js server, so no separate frontend host is required. Just point your domain to the Render URL.

### MongoDB
Already configured with MongoDB Atlas — your connection string is in `.env`. No further setup needed.

## Customizing

**Change WhatsApp number**: edit `.env` `WHATSAPP_NUMBER` (no `+`, country code first, e.g., `923001234567`).

**Add a category**: log in to admin → Categories → Add. Upload a hero image to make it appear on the homepage's "Shop by Category" section.

**Make a product featured**: edit the product, check "Featured Product". Only one will display on the homepage.

**Change colors**: edit CSS variables at the top of `public/index.html`:
```css
--bg: #fbfaf7;        /* ivory background */
--accent: #2d5043;    /* deep forest green */
--gold: #b89968;      /* gold accent */
--sale: #a8443a;      /* sale red */
```

## Tech Stack
- **Backend**: Node.js, Express, Mongoose, JWT, Multer, bcryptjs
- **Database**: MongoDB Atlas
- **Frontend**: Vanilla JS, Vanilla CSS, no framework
- **Fonts**: Cormorant Garamond (display), Inter (body)

## License
Built by Bano Digital Hub. All rights reserved.

---

**Need help?** Check the code comments — every route, model, and helper is annotated.
