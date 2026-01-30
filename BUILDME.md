# 🚀 PDFCraft - Claude Code Build Kit

This folder contains everything needed to autonomously build PDFCraft using Claude Code with the Ralph methodology.

## 📁 Files Included

| File | Purpose |
|------|---------|
| `pdfcraft-claude-code-prompt.md` | Master prompt with project context and MCP usage |
| `prd.json` | 38 user stories with acceptance criteria |
| `claude-iteration-prompt.md` | Prompt used for each Ralph iteration |
| `progress.txt` | Running log of what's been accomplished |
| `agents.md` | Persistent codebase knowledge |
| `ralph.sh` | Orchestration script (optional) |
| `pdfcraft-design-plan.md` | Full design document for reference |

## 🏃‍♂️ Quick Start

### Option A: Manual Iteration (Recommended to Start)

1. **Open Claude Code** in your project directory

2. **Copy the iteration prompt:**
   ```bash
   cat claude-iteration-prompt.md | pbcopy  # Mac
   cat claude-iteration-prompt.md | xclip   # Linux
   ```

3. **Paste into Claude Code** and let it work

4. **Repeat** until all stories are complete

### Option B: Semi-Automated with ralph.sh

1. **Make the script executable:**
   ```bash
   chmod +x ralph.sh
   ```

2. **Check status:**
   ```bash
   ./ralph.sh --status
   ```

3. **Run the loop:**
   ```bash
   ./ralph.sh 40  # Max 40 iterations
   ```

4. **Follow the prompts** to invoke Claude Code for each iteration

## 📋 Story Breakdown

The build is divided into 38 stories across these phases:

### Phase 1: Infrastructure (Stories 1-7)
- Database schema setup
- Auth triggers
- Storage buckets
- Stripe products
- Environment variables
- Supabase clients
- Auth middleware

### Phase 2: Core API (Stories 8-17)
- Auth pages
- Dashboard layout
- API key management
- PDF generation
- Usage tracking

### Phase 3: Templates (Stories 18-22)
- Templates CRUD
- Template generation
- Templates UI

### Phase 4: Billing (Stories 23-26)
- Stripe checkout
- Webhooks
- Customer portal
- Settings page

### Phase 5: AI Features (Stories 27-28)
- AI template backend
- AI template UI

### Phase 6: Marketing & Polish (Stories 29-38)
- Landing page
- Pricing page
- Documentation
- SDK
- Error handling
- Rate limiting
- SEO
- Deployment
- Testing

## 🔧 MCP Server Usage

Your Claude Code has these MCP servers available:

### Supabase
```
mcp__supabase__execute_sql     # Run SQL
mcp__supabase__list_tables     # View tables
mcp__supabase__get_table       # Table schema
```

### Vercel
```
mcp__vercel__deploy            # Deploy app
mcp__vercel__set_env           # Set env vars
mcp__vercel__list_deployments  # Check status
```

### Stripe
```
mcp__stripe__create_product    # Create product
mcp__stripe__create_price      # Create price
mcp__stripe__list_products     # List products
```

## ✅ Verification Methods

Claude Code should verify each criterion before marking complete:

| Criterion Type | Verification Method |
|---------------|---------------------|
| Database table exists | `SELECT * FROM information_schema.tables WHERE table_name = 'X'` |
| API endpoint works | `curl -X POST http://localhost:3000/api/v1/...` |
| File exists | `ls -la path/to/file.ts` |
| Component renders | Check file structure and exports |
| Integration works | Test the actual connection |

## 📊 Tracking Progress

### View Status
```bash
./ralph.sh --status
# Or manually:
jq '.stories[] | "\(.id): \(if .passes then "✅" else "⬜" end) \(.title)"' prd.json
```

### View Progress Log
```bash
tail -100 progress.txt
```

### Count Remaining
```bash
jq '[.stories[] | select(.passes == false)] | length' prd.json
```

### Reset If Needed
```bash
./ralph.sh --reset
# Or manually:
jq '.stories |= map(.passes = false)' prd.json > tmp.json && mv tmp.json prd.json
```

## 🛠️ Before You Start

### 1. Create the Next.js Project
```bash
npx create-next-app@latest pdfcraft --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
cd pdfcraft
```

### 2. Install Dependencies
```bash
npm install @supabase/supabase-js @supabase/ssr stripe @stripe/stripe-js puppeteer-core @sparticuz/chromium zod lucide-react handlebars

npx shadcn@latest init
npx shadcn@latest add button card input label tabs toast dialog dropdown-menu avatar badge separator table
```

### 3. Copy These Files
```bash
cp path/to/prd.json .
cp path/to/progress.txt .
cp path/to/agents.md .
cp path/to/claude-iteration-prompt.md .
cp path/to/ralph.sh .
```

### 4. Initialize Git
```bash
git init
git add .
git commit -m "chore: initial project setup with Ralph build kit"
```

### 5. Set Up Services

**Supabase:**
- Create project at supabase.com
- Note your project URL and anon key
- Get service role key from settings

**Stripe:**
- Create account at stripe.com
- Get API keys (test mode to start)
- Note publishable and secret keys

**Vercel:**
- Connect your repo to Vercel
- Don't deploy yet (stories will handle this)

## 💡 Tips for Success

1. **Start with Story 1** - Database schema must exist before anything else

2. **Don't Skip Verification** - Actually test things work before marking complete

3. **Read progress.txt** - It tells Claude Code what previous iterations did

4. **Update agents.md** - When you discover important patterns, document them

5. **Commit Per Story** - Keeps changes atomic and reversible

6. **If Stuck, Skip** - If a story is blocked, document why and move to next independent story

## 🐛 Troubleshooting

### "Table doesn't exist" errors
- Ensure Story 1 (database schema) completed successfully
- Check Supabase dashboard for tables

### "Puppeteer not working"
- Make sure you're using `@sparticuz/chromium` and `puppeteer-core`
- Check Vercel function timeout settings

### "Stripe webhook failing"
- Use Stripe CLI to test locally: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Check webhook secret is set correctly

### "Auth not persisting"
- Verify middleware.ts is correctly refreshing sessions
- Check cookie settings for your domain

## 📚 Reference Documents

- `pdfcraft-design-plan.md` - Full design document with architecture, user flows, pricing strategy
- `domain-options.md` - Domain name options to purchase

## 🎯 Success Criteria

The MVP is complete when:

- [ ] All 38 stories pass
- [ ] Can sign up and log in
- [ ] Can generate PDF via API
- [ ] Can create and use templates
- [ ] AI template generation works
- [ ] Stripe billing works
- [ ] Deployed to production

---

Good luck! 🚀

*Remember: Ship fast, iterate later. MVP quality is the goal.*
