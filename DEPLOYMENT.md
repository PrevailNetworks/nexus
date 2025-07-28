# Nexus Deployment Guide

## Overview
This guide covers deploying the Nexus intranet application to Vercel using the optimized Vite configuration.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Vercel account
- Firebase project setup

## Environment Variables

### Required Firebase Variables
Create a `.env.local` file in the project root with your Firebase configuration:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Application Configuration
VITE_APP_NAME=Nexus
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production
```

### Optional Variables
```bash
# Google AI (for AI features)
VITE_GOOGLE_AI_API_KEY=your-google-ai-api-key

# Supabase (if keeping any legacy features)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Deployment Options

### Option 1: Vercel CLI (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy from project directory:**
   ```bash
   cd nexus
   vercel
   ```

4. **Configure environment variables:**
   ```bash
   vercel env add VITE_FIREBASE_API_KEY
   vercel env add VITE_FIREBASE_AUTH_DOMAIN
   # ... add all required variables
   ```

5. **Deploy to production:**
   ```bash
   vercel --prod
   ```

### Option 2: GitHub Integration

1. **Push code to GitHub repository**
2. **Import project in Vercel dashboard:**
   - Go to https://vercel.com/dashboard
   - Click "Add New Project"
   - Import from GitHub
   - Select your repository

3. **Configure build settings:**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Add environment variables:**
   - Go to Project Settings → Environment Variables
   - Add all required Firebase variables

5. **Deploy:**
   - Push to main branch or manually trigger deployment

## Build Configuration

### Optimized `vite.config.ts`
The project includes optimized build settings:

- **Code Splitting**: Separate chunks for better caching
- **Minification**: ESBuild for fast builds
- **Asset Optimization**: Immutable caching for assets
- **Tree Shaking**: Remove unused code

### `vercel.json` Features
- **SPA Routing**: All routes redirect to index.html
- **Caching**: Optimized cache headers for assets
- **Security**: Security headers for production
- **Performance**: Optimized for Core Web Vitals

## Performance Optimizations

### Bundle Analysis
```bash
npm run build:analyze
```

### Chunk Optimization
The build separates code into logical chunks:
- `react-vendor`: React core
- `router-vendor`: React Router
- `ui-vendor`: Radix UI components
- `firebase-vendor`: Firebase SDK
- `utils-vendor`: Utility libraries

### Caching Strategy
- **Assets**: 1 year cache with immutable flag
- **HTML**: No cache, must revalidate
- **Service Worker**: Future PWA support ready

## Post-Deployment Checklist

### 1. Verify Firebase Configuration
- [ ] Authentication working
- [ ] Firestore reads/writes working
- [ ] Storage uploads working
- [ ] Security rules properly configured

### 2. Test Core Features
- [ ] User authentication/login
- [ ] Dashboard loading
- [ ] Feed functionality
- [ ] Employee management (admin users)
- [ ] Time clock features
- [ ] File uploads
- [ ] Real-time updates

### 3. Performance Verification
- [ ] Lighthouse score > 90
- [ ] Core Web Vitals passing
- [ ] Bundle size reasonable (<2MB)
- [ ] Initial load time < 3s

### 4. Security Verification
- [ ] Environment variables not exposed
- [ ] Firebase security rules enforced
- [ ] HTTPS enforced
- [ ] Security headers present

## Monitoring & Maintenance

### Vercel Analytics
Enable Vercel Analytics for performance monitoring:
```bash
vercel analytics
```

### Error Tracking
Consider integrating error tracking:
- Sentry
- LogRocket
- Bugsnag

### Database Monitoring
Monitor Firebase usage:
- Firestore read/write operations
- Storage bandwidth usage
- Authentication usage

## Troubleshooting

### Common Build Issues

**TypeScript Errors:**
```bash
npm run type-check
```

**Dependency Issues:**
```bash
npm ci
npm run build
```

**Environment Variables:**
- Ensure all `VITE_` prefixed variables are set
- Check Vercel environment variable configuration
- Verify Firebase project configuration

### Common Runtime Issues

**Firebase Connection:**
- Verify API keys and project configuration
- Check Firestore security rules
- Ensure domains are whitelisted in Firebase console

**Routing Issues:**
- Verify `vercel.json` rewrites configuration
- Check React Router configuration
- Ensure all routes are properly defined

### Performance Issues

**Large Bundle Size:**
```bash
npm run build:analyze
```
- Review chunk splitting configuration
- Consider lazy loading for large components
- Optimize image sizes and formats

**Slow Loading:**
- Enable Vercel Edge Network
- Optimize images with `next/image` equivalent
- Implement service worker caching

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Review Firebase console logs
3. Monitor browser developer console
4. Check environment variable configuration

## Version Updates

When updating dependencies:
```bash
npm update
npm run build
npm run preview
```

Test thoroughly before deploying to production.