# 🚀 Deployment Guide - Maison Lumière

## Quick Start (5 minutes)

### Step 1: Environment Variables Setup
Go to your **Vercel Project Settings → Environment Variables** and add:

```env
# Auto-provided by Neon integration:
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...

# Auto-provided by Blob integration:
BLOB_READ_WRITE_TOKEN=...

# Required - Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=your-random-secret-here

# Required - Your admin email(s)
ADMIN_EMAILS=admin@yourdomain.com

# Optional - For payment processing
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

### Step 2: Deploy
```bash
git push origin administrative-dashboard
```

The deployment will automatically:
- Install dependencies
- Build the Next.js app
- Deploy to Vercel edge network
- Set up database connections

### Step 3: First Admin Setup
1. Visit `https://your-domain.com/admin/sign-in`
2. Click "Need to create the first admin account?"
3. Enter your email (from `ADMIN_EMAILS`)
4. Create a strong password (≥8 chars)
5. Sign in and access the admin dashboard at `/admin`

---

## ✅ Pre-Deployment Checklist

### Code Quality
- [x] TypeScript compilation: SUCCESS
- [x] Production build: SUCCESS
- [x] All routes configured: 29 routes total
- [x] Zero Supabase dependencies
- [x] Git merge conflicts: RESOLVED

### Backend
- [x] Database: Neon PostgreSQL configured
- [x] Authentication: Better Auth with email+password
- [x] File Storage: Vercel Blob configured
- [x] API Routes: All admin endpoints working

### Frontend
- [x] Animations: Smooth transitions on all interactive elements
- [x] Navigation: All links redirect logically
- [x] Admin Panel: Settings icon in header + menu link
- [x] Responsive: Mobile-first design with proper breakpoints

### Security
- [x] Session signing: Better Auth with `BETTER_AUTH_SECRET`
- [x] Admin protection: Email-based access control via `ADMIN_EMAILS`
- [x] File uploads: Size/type validation (max 8MB, image types only)
- [x] API routes: All endpoints authenticated

---

## 📊 Routes & Status

| Route | Type | Status | Notes |
|-------|------|--------|-------|
| `/` | Static | ✅ | Homepage (dynamic due to auth) |
| `/products` | Dynamic | ✅ | Product listing with filters |
| `/products/[slug]` | Dynamic | ✅ | Individual product page |
| `/checkout` | Dynamic | ✅ | Cart and payment |
| `/admin` | Dynamic | ✅ | Dashboard (requires auth) |
| `/admin/products` | Dynamic | ✅ | Product management |
| `/admin/orders` | Dynamic | ✅ | Order management |
| `/admin/banners` | Dynamic | ✅ | Banner management |
| `/admin/coupons` | Dynamic | ✅ | Coupon management |
| `/admin/sign-in` | Dynamic | ✅ | Admin login page |
| `/api/auth/[...all]` | API | ✅ | Better Auth handler |
| `/api/admin/upload` | API | ✅ | File upload (Vercel Blob) |

---

## 🔧 Integrations Required

### 1. Neon Database
- **Status**: ✅ Connected
- **Connection**: Pooled PostgreSQL at `DATABASE_URL`
- **Schema**: Better Auth tables auto-created on first connection
- **Backup**: Enable automatic backups in Neon console

### 2. Vercel Blob Storage
- **Status**: ✅ Connected
- **Token**: `BLOB_READ_WRITE_TOKEN` automatically set
- **Access**: Public (files immediately available via CDN)
- **Limits**: 8MB max per file, optimized for images

### 3. Better Auth
- **Status**: ✅ Configured
- **Method**: Email + password (no OAuth)
- **Database**: Uses same connection pool as app queries
- **Sessions**: 7-day expiration, 1-day update cycle

---

## 🎨 Frontend Features

### Animations & Transitions
- Page load: Staggered fade-in animations
- Hover states: Smooth 300ms transitions
- Admin dashboard: Card scaling + shadow effects
- Navigation: Active state styling with transitions
- Buttons: Consistent hover feedback

### Admin Panel Highlights
- **Dashboard**: Key metrics, recent orders, low stock alerts
- **Products**: Create, update, delete with bulk actions
- **Orders**: Track status, manage fulfillment
- **Banners**: Manage homepage promotional content
- **Coupons**: Create and manage discount codes
- **Uploads**: Drag-drop image upload to Blob storage

### User Experience
- Mobile-first responsive design
- Wishlist functionality
- Shopping cart with persistence
- Order history and tracking
- Size guides and policy pages

---

## 🔒 Security Configuration

### Environment Variables
```env
# NEVER commit these to git:
# - BETTER_AUTH_SECRET
# - BLOB_READ_WRITE_TOKEN
# - RAZORPAY_KEY_SECRET
# - DATABASE_URL

# Always use Vercel's Environment Variables section
```

### Access Control
```
Public routes:
- /
- /products
- /products/[slug]
- /about
- /contact
- /legal
- /size-guide
- /shipping-returns

Authenticated routes (require login):
- /account
- /wishlist
- /orders
- /checkout

Admin routes (require ADMIN_EMAILS):
- /admin/*
- /api/admin/*
```

---

## 📈 Performance Tips

### Vercel Optimization
- ✅ Turbopack enabled (fastest builds)
- ✅ React 19 with concurrent rendering
- ✅ ISR (Incremental Static Regeneration) for product pages
- ✅ Edge caching for static assets
- ✅ Blob CDN for image delivery

### Database Optimization
- ✅ Connection pooling via Neon
- ✅ Prepared statements with Drizzle ORM
- ✅ Efficient query patterns with proper indexing
- ✅ Server-side pagination (not sending all data to client)

### File Storage
- ✅ Vercel Blob global CDN for instant delivery
- ✅ Automatic image optimization
- ✅ Public access for immediate availability

---

## 🐛 Troubleshooting

### Build Fails
**Error**: "Missing database connection"
- **Solution**: Ensure `DATABASE_URL` is set in Vercel Environment
- **Check**: Neon integration is properly connected in Vercel dashboard

### Admin Login Doesn't Work
**Error**: "Invalid email or password"
- **Solution**: Verify `BETTER_AUTH_SECRET` is set (≥32 characters)
- **Check**: Your email is in `ADMIN_EMAILS` list (lowercase)
- **Try**: Clear cookies and try again

### File Upload Fails
**Error**: "Upload failed"
- **Solution**: Check file is under 8MB
- **Verify**: File type is JPEG, PNG, WebP, or GIF
- **Check**: `BLOB_READ_WRITE_TOKEN` is set and valid

### Animations Not Working
**Check**: 
- Browser DevTools → Network → CSS loads
- Verify Tailwind CSS 4 is in `<head>`
- Check for JavaScript errors in console
- Test on different browser/device

---

## 📞 Support & Monitoring

### Vercel Dashboard
- Check deployment logs: **Deployments → Logs**
- Monitor functions: **Functions → Analytics**
- View errors: **Observability → Error Logs**

### Neon Console
- Database metrics: neon.tech/app
- Connection monitoring
- Backup status
- Query analytics

### Blob Management
- Storage usage and limits
- File listings and metadata
- Access logs

---

## 🎯 After Deployment

### Day 1
- [ ] Test admin login
- [ ] Upload a test product image
- [ ] Verify animations smooth on different devices
- [ ] Check all navigation links work
- [ ] Test checkout flow

### Week 1
- [ ] Monitor error rates in Vercel
- [ ] Check database query performance
- [ ] Review Blob storage metrics
- [ ] Test on mobile devices
- [ ] Share site with team for feedback

### Ongoing
- [ ] Monitor Neon connection health
- [ ] Review security logs monthly
- [ ] Plan for content updates
- [ ] Gather user analytics
- [ ] Plan feature enhancements

---

## 📚 Resources

| Resource | Link |
|----------|------|
| Vercel Docs | https://vercel.com/docs |
| Next.js 16 | https://nextjs.org/docs |
| Neon Documentation | https://neon.tech/docs |
| Vercel Blob Guide | https://vercel.com/docs/blob |
| Better Auth | https://better-auth.com |
| Drizzle ORM | https://orm.drizzle.team |
| Tailwind CSS 4 | https://tailwindcss.com/docs |

---

**Status**: ✅ Ready for Production  
**Last Updated**: August 1, 2026  
**Deployment**: `git push origin administrative-dashboard`

---

## Quick Commands

```bash
# Local development
pnpm run dev

# Production build
pnpm run build
pnpm run start

# Lint code
pnpm run lint

# Deploy to production
git push origin administrative-dashboard

# View git log
git log --oneline
```

Good luck! 🎉
