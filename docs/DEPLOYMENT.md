# TaxSense AI Deployment Guide

**FY 2025-26 (AY 2026-27)** — Production Deployment

## Overview

TaxSense AI is a Next.js 16 application with a deterministic tax engine. It's stateless, scalable, and suitable for cloud deployment.

### Tech Stack

- **Frontend**: Next.js 14→16, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, FastAPI (optional)
- **Database**: Supabase (PostgreSQL, optional for persistence)
- **Authentication**: Supabase Auth (optional)
- **Deployment**: Vercel, Render, AWS, or self-hosted
- **Performance**: <1ms tax computation, <100ms API response

---

## Quick Start Deployment

### 1. Environment Variables

Create `.env.local` for local development or `.env.production` for production:

```bash
# Optional: Supabase (for persistence)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Admin access for analytics
ADMIN_EMAILS=admin@taxsense.ai,ca@firm.com

# Optional: LLM providers for intake
GROQ_API_KEY=your-groq-api-key
```

### 2. Vercel Deployment (Recommended)

**Simplest option for most teams:**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

**Environment variables in Vercel dashboard:**
- Settings → Environment Variables
- Paste all .env vars (they're encrypted)

### 3. Docker Deployment (Self-Hosted)

```dockerfile
# Dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy app
COPY .next ./.next
COPY public ./public

# Build
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**Build & deploy:**

```bash
# Build Docker image
docker build -t taxsense-ai:latest .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  taxsense-ai:latest

# Push to registry (e.g., Docker Hub)
docker tag taxsense-ai:latest myregistry/taxsense-ai:latest
docker push myregistry/taxsense-ai:latest
```

### 4. Render Deployment

```bash
# Connect Render to GitHub repo
# Select Node environment
# Set build command: npm run build
# Set start command: npm start
# Add environment variables
# Deploy
```

---

## Production Configuration

### Performance Optimization

```javascript
// next.config.mjs
export default {
  reactStrictMode: true,
  swcMinify: true,          // SWC minification
  compress: true,           // Gzip compression
  poweredByHeader: false,   // Remove header
  
  // API routes caching
  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5,
  },

  // Image optimization
  images: {
    unoptimized: true,      // If no image optimization needed
  },

  // Headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=60' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
};
```

### Security Headers

```javascript
// next.config.mjs
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'geolocation=(), microphone=()' },
      ],
    },
  ];
}
```

### Rate Limiting

Add rate limiting to API routes:

```typescript
// src/app/api/middleware/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 h'),
});

export async function middleware(request: Request) {
  const identifier = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const { success } = await ratelimit.limit(identifier);

  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }
}
```

### Database Connection Pooling

For Supabase:

```typescript
// Use connection pooling
const connectionString = `${SUPABASE_URL}/rest/v1`;
// Pooling handled automatically by Supabase
```

---

## Monitoring & Observability

### Logging

```typescript
// src/lib/logger.ts
export function log(level: 'info' | 'error' | 'warn', message: string, data?: any) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
    env: process.env.NODE_ENV,
  };

  if (level === 'error') {
    console.error(JSON.stringify(entry));
    // Send to error tracking (Sentry, etc.)
  } else {
    console.log(JSON.stringify(entry));
  }
}
```

### Error Tracking (Sentry)

```typescript
// sentry.server.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Filter sensitive data
    return event;
  },
});
```

### Health Check Endpoint

```typescript
// src/app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
}
```

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm ci
      - run: npm test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v4
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: true
```

---

## Scaling Considerations

### Horizontal Scaling

TaxSense AI is stateless and scales horizontally:

```bash
# Kubernetes deployment example
kubectl scale deployment taxsense-ai --replicas=5
```

### Caching Strategy

```typescript
// Cache computed results (optional)
const cache = new Map<string, CachedComputation>();

export function getCachedComputation(profileHash: string) {
  return cache.get(profileHash);
}

export function setCachedComputation(profileHash: string, result: any) {
  cache.set(profileHash, {
    result,
    cachedAt: Date.now(),
  });
}
```

### Database Optimization

- Index frequently queried columns (user_id, created_at)
- Archive old computations quarterly
- Use connection pooling for all database ops

---

## Backup & Recovery

### Database Backups

```bash
# Supabase automatic backups (daily)
# Access via Supabase dashboard → Database → Backups

# Manual backup
pg_dump -U postgres -h db.supabase.co dbname > backup.sql

# Restore
psql -U postgres -h db.supabase.co dbname < backup.sql
```

### Application Backup

```bash
# Git tag releases
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Docker image retention
docker tag taxsense-ai:latest myregistry/taxsense-ai:v1.0.0
docker push myregistry/taxsense-ai:v1.0.0
```

---

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations run (`npm run db:migrate`)
- [ ] SSL/TLS enabled
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Error tracking (Sentry) connected
- [ ] Monitoring dashboards set up
- [ ] Backup schedule confirmed
- [ ] Health check endpoint tested
- [ ] Load testing completed (k6, Artillery)
- [ ] Security scan passed (Snyk, OWASP)
- [ ] Documentation updated
- [ ] Team trained on deployment process

---

## Rollback Procedure

```bash
# Vercel rollback
vercel rollback

# Docker rollback
docker run -p 3000:3000 myregistry/taxsense-ai:previous-stable

# Git rollback
git revert HEAD
git push origin main
```

---

## Support & Troubleshooting

### Common Issues

**Issue: High API response times**
- Check database query performance
- Enable query result caching
- Review database indexes

**Issue: Memory leaks**
- Monitor Node.js heap usage
- Check for unclosed database connections
- Review event listener cleanup

**Issue: Database connection errors**
- Verify connection string
- Check firewall/VPC settings
- Ensure connection pooling enabled

**Issue: TLS/SSL errors**
- Verify certificate expiration
- Check certificate chain
- Ensure HSTS configured

---

## Performance Benchmarks

- **Tax computation**: <1ms (pure function)
- **API response**: <100ms (with DB)
- **Build time**: ~5 minutes
- **Deploy time**: ~2-3 minutes (Vercel)
- **Uptime target**: 99.9%

---

## Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment/vercel)
- [Vercel Edge Functions](https://vercel.com/docs/concepts/functions/edge-functions)
- [Supabase Deployment](https://supabase.com/docs/guides/hosting/overview)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

**Questions or issues?** Open an issue on GitHub or contact MNB Research.
