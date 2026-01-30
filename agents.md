# PDFCraft - Codebase Knowledge

> This file contains important patterns and knowledge about the codebase.
> Update this whenever you discover something future iterations should know.

## Project Structure

```
pdfcraft/
├── app/                    # Next.js App Router
│   ├── (marketing)/        # Public pages (landing, pricing)
│   ├── (dashboard)/        # Authenticated pages
│   ├── (auth)/             # Login, signup
│   └── api/                # API routes
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── marketing/          # Landing page components
│   └── dashboard/          # Dashboard components
├── lib/                    # Utilities and services
│   ├── supabase/           # Supabase clients
│   ├── stripe/             # Stripe utilities
│   └── pdf/                # PDF generation
└── types/                  # TypeScript types
```

## Important Patterns

### Supabase Client Usage

**Browser (Client Components):**
```typescript
import { createBrowserClient } from '@/lib/supabase/client'
const supabase = createBrowserClient()
```

**Server (Server Components/API Routes):**
```typescript
import { createServerClient } from '@/lib/supabase/server'
const supabase = createServerClient()
```

**Admin (Service Role - bypasses RLS):**
```typescript
import { createAdminClient } from '@/lib/supabase/admin'
const supabase = createAdminClient()
```

### API Authentication

Public API endpoints use API key auth:
```typescript
import { validateApiKey } from '@/lib/api/auth'

export async function POST(request: Request) {
  const authResult = await validateApiKey(request)
  if (!authResult.success) {
    return Response.json({ error: authResult.error }, { status: 401 })
  }
  const { userId, apiKeyId } = authResult
  // ... continue
}
```

### Error Response Format

All API errors follow this format:
```typescript
{
  error: {
    code: 'ERROR_CODE',
    message: 'Human readable message',
    details?: { /* field-level errors */ }
  }
}
```

### Database Types

After modifying database schema, regenerate types:
```bash
npx supabase gen types typescript --project-id <project-id> > types/database.ts
```

## MCP Server Notes

### Supabase MCP
- **Project ID:** `mmywsbwmxrpogawwwlbm` (shared with Deal Scout)
- **Region:** us-west-2
- Use `execute_sql` for schema changes
- Use `apply_migration` for DDL operations (creates versioned migrations)
- Always enable RLS after creating tables
- Create indexes on foreign key columns

### Vercel MCP
- Set env vars before deploying
- Use `--prod` flag for production deploys

### Stripe MCP
- Store price IDs in lib/stripe/config.ts
- Test mode prices have different IDs than live

## Common Issues & Solutions

### Issue: Puppeteer fails on Vercel
**Solution:** Use @sparticuz/chromium and puppeteer-core, not puppeteer

### Issue: Supabase auth not persisting
**Solution:** Make sure middleware.ts is refreshing the session

### Issue: Stripe webhook signature invalid
**Solution:** Use raw body, not parsed JSON for signature verification

## Key File Locations

| Purpose | Location |
|---------|----------|
| Supabase types | `types/database.ts` |
| Stripe price IDs | `lib/stripe/config.ts` |
| PDF generator | `lib/pdf/generator.ts` |
| API key validation | `lib/api/auth.ts` |
| Usage tracking | `lib/usage/tracker.ts` |

---

*Last updated: Iteration 2 - story-002*
