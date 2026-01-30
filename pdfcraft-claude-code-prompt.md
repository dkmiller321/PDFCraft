# 🤖 PDFCraft - Claude Code Autonomous Build Prompt

## Overview

You are building **PDFCraft**, a PDF generation SaaS with AI-powered template creation. This prompt uses the **Ralph methodology** for autonomous, iterative development.

**Available MCP Servers:**
- `supabase` - Database operations, auth, storage
- `vercel` - Deployment, environment variables, domains
- `stripe` - Products, prices, customers, subscriptions

---

## Project Context

### What We're Building
A modern PDF generation API that allows developers to:
1. Convert HTML/URLs to PDF via simple API
2. Create reusable templates with variable substitution
3. Generate templates using AI (unique differentiator)

### Tech Stack
- **Frontend:** Next.js 14 (App Router), Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes (or separate Hono server)
- **Database:** Supabase (Postgres + Auth + Storage)
- **Payments:** Stripe (Subscriptions + Usage-based)
- **PDF Engine:** Puppeteer (via API route or edge function)
- **Deployment:** Vercel
- **AI:** Claude API (for template generation)

### File Structure
```
pdfcraft/
├── app/
│   ├── (marketing)/          # Landing page, pricing
│   │   ├── page.tsx
│   │   └── pricing/page.tsx
│   ├── (dashboard)/          # Authenticated app
│   │   ├── layout.tsx
│   │   ├── page.tsx          # Dashboard home
│   │   ├── templates/
│   │   ├── api-keys/
│   │   ├── usage/
│   │   └── settings/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   └── api/
│       ├── v1/
│       │   ├── generate/route.ts
│       │   ├── templates/route.ts
│       │   └── ai/route.ts
│       └── webhooks/
│           └── stripe/route.ts
├── components/
│   ├── ui/                   # shadcn components
│   ├── marketing/
│   └── dashboard/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── admin.ts
│   ├── stripe/
│   ├── pdf/
│   └── utils.ts
├── types/
└── public/
```

---

## MCP Server Usage Guidelines

### Supabase MCP
```
# Database operations
Use supabase MCP to:
- Create/modify tables via SQL
- Set up Row Level Security (RLS) policies
- Create database functions
- Manage storage buckets

Example commands:
- mcp__supabase__execute_sql: Run SQL queries
- mcp__supabase__list_tables: See existing tables
- mcp__supabase__get_table: Get table schema
```

### Vercel MCP
```
# Deployment operations
Use vercel MCP to:
- Deploy the application
- Set environment variables
- Check deployment status
- Manage domains

Example commands:
- mcp__vercel__deploy: Deploy current state
- mcp__vercel__set_env: Set environment variable
- mcp__vercel__list_deployments: Check deploy status
```

### Stripe MCP
```
# Payment operations
Use stripe MCP to:
- Create products and prices
- Set up subscription plans
- Configure webhooks
- Check customer status

Example commands:
- mcp__stripe__create_product: Create a product
- mcp__stripe__create_price: Create a price
- mcp__stripe__list_products: List products
```

---

## Ralph Implementation

### How It Works
1. Read `prd.json` to find the first story where `passes: false`
2. Read `progress.txt` for context from previous iterations
3. Read any `agents.md` files for codebase knowledge
4. Implement the story completely
5. Verify ALL acceptance criteria pass
6. Commit changes to git
7. Update `prd.json`: set `passes: true`
8. Append to `progress.txt`: what was done, learnings
9. Update `agents.md` if patterns discovered
10. Exit - loop restarts fresh

### Critical Rules
- **ONE story per iteration** - Don't try to do multiple
- **Verify before marking complete** - All acceptance criteria must pass
- **Commit atomic changes** - Each story = one commit
- **Document learnings** - Future iterations need context

---

## System Prompt for Each Iteration

```
You are an autonomous coding agent building PDFCraft, a PDF generation SaaS.

CURRENT TASK:
Read prd.json and implement the FIRST story where passes=false.

CONTEXT FILES:
1. prd.json - User stories with acceptance criteria
2. progress.txt - What previous iterations accomplished
3. agents.md - Codebase knowledge and patterns

MCP SERVERS AVAILABLE:
- supabase: Database, auth, storage operations
- vercel: Deployment, env vars
- stripe: Products, prices, subscriptions

WORKFLOW:
1. Read prd.json, find first incomplete story
2. Read progress.txt for context
3. Read relevant agents.md files
4. Plan the implementation
5. Write the code
6. Verify EVERY acceptance criterion
7. Run any tests/checks needed
8. Commit with message: "feat: [story-id] - [title]"
9. Update prd.json: set passes=true for this story
10. Append to progress.txt:
    - Story ID completed
    - Files created/modified
    - Key learnings
    - Any issues encountered
11. Update agents.md if you discovered important patterns

VERIFICATION:
Before marking a story complete, you MUST verify each acceptance criterion.
For API routes: Make test requests
For UI: Check the component renders
For database: Query to confirm schema
For integrations: Test the connection

If you cannot verify a criterion, do NOT mark the story complete.

OUTPUT:
At the end of your iteration, output:
- STORY COMPLETED: [story-id]
- FILES CHANGED: [list]
- NEXT STORY: [next-story-id] or "ALL COMPLETE"
```

---

## Orchestration Script (ralph.sh)

```bash
#!/bin/bash

# PDFCraft Ralph Orchestration Script
# Runs Claude Code in autonomous loop

MAX_ITERATIONS=${1:-25}
ITERATION=0

echo "🚀 Starting PDFCraft Ralph Build"
echo "Max iterations: $MAX_ITERATIONS"

# Initialize files if they don't exist
if [ ! -f "progress.txt" ]; then
    echo "# PDFCraft Build Progress" > progress.txt
    echo "Started: $(date)" >> progress.txt
    echo "" >> progress.txt
fi

if [ ! -f "prd.json" ]; then
    echo "❌ Error: prd.json not found. Create it first."
    exit 1
fi

while [ $ITERATION -lt $MAX_ITERATIONS ]; do
    ITERATION=$((ITERATION + 1))
    echo ""
    echo "═══════════════════════════════════════"
    echo "📍 Iteration $ITERATION of $MAX_ITERATIONS"
    echo "═══════════════════════════════════════"
    
    # Check if all stories are complete
    INCOMPLETE=$(jq '.stories[] | select(.passes == false) | .id' prd.json 2>/dev/null | head -1)
    
    if [ -z "$INCOMPLETE" ]; then
        echo "✅ All stories complete!"
        break
    fi
    
    echo "Next story: $INCOMPLETE"
    
    # Run Claude Code with the system prompt
    # This assumes you have claude-code CLI installed
    claude-code --prompt "$(cat claude-iteration-prompt.md)"
    
    # Small delay between iterations
    sleep 2
done

echo ""
echo "═══════════════════════════════════════"
echo "🏁 Ralph Build Complete"
echo "Total iterations: $ITERATION"
echo "═══════════════════════════════════════"

# Show final status
echo ""
echo "📊 Final Story Status:"
jq '.stories[] | "\(.id): \(if .passes then "✅" else "❌" end) \(.title)"' prd.json
```

---

## Initial Setup Commands

Before starting Ralph, run these setup commands:

```bash
# 1. Create Next.js project
npx create-next-app@latest pdfcraft --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"

# 2. Install dependencies
cd pdfcraft
npm install @supabase/supabase-js @supabase/ssr stripe @stripe/stripe-js puppeteer-core @sparticuz/chromium zod lucide-react

# 3. Install shadcn/ui
npx shadcn@latest init
npx shadcn@latest add button card input label tabs toast dialog dropdown-menu avatar badge separator

# 4. Create initial files
touch progress.txt
touch prd.json
mkdir -p lib/supabase lib/stripe lib/pdf

# 5. Initialize git
git init
git add .
git commit -m "chore: initial project setup"
```

---

## Environment Variables Needed

Use Vercel MCP to set these:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# App
NEXT_PUBLIC_APP_URL=https://pdfcraft.dev

# AI (for template generation)
ANTHROPIC_API_KEY=
```

---

## Notes for Success

### Do's
- ✅ Keep stories small and focused
- ✅ Verify acceptance criteria before completing
- ✅ Commit after each story
- ✅ Update progress.txt with learnings
- ✅ Use MCP servers for infrastructure operations

### Don'ts
- ❌ Don't skip verification steps
- ❌ Don't combine multiple stories
- ❌ Don't leave uncommitted changes
- ❌ Don't mark stories complete without testing

### If Stuck
If a story cannot be completed:
1. Document why in progress.txt
2. Leave passes: false
3. Add a note to the story in prd.json
4. Move to next story if independent

---

## Quick Reference

### Story Status Check
```bash
jq '.stories[] | "\(.id): \(.passes)"' prd.json
```

### View Progress
```bash
tail -50 progress.txt
```

### Manual Story Complete
```bash
jq '.stories |= map(if .id == "story-X" then .passes = true else . end)' prd.json > tmp.json && mv tmp.json prd.json
```

### Reset All Stories
```bash
jq '.stories |= map(.passes = false)' prd.json > tmp.json && mv tmp.json prd.json
```
