# Priya HR WhatsApp Bot - Setup Guide

## Step 1: Install Node.js

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# Close and reopen terminal, then:
nvm install --lts
nvm use --lts
```

## Step 2: Install dependencies

```bash
cd "Whatsapp Bot"
npm install
```

## Step 3: Set up Neon (PostgreSQL)

1. Go to https://neon.tech and sign up (free)
2. Create a new project called "whatsapp-bot"
3. Copy the connection string (looks like `postgresql://user:pass@host/dbname?sslmode=require`)

## Step 4: Set up OpenAI

1. Go to https://platform.openai.com/api-keys
2. Create a new API key

## Step 5: Set up Meta WhatsApp (Testing Number)

1. Go to https://developers.facebook.com and log in
2. Create a new App → Business → name it "PriyaHRBot"
3. Add "WhatsApp" product to your app
4. In WhatsApp > API Setup:
   - Note your **Test number** (format: +1 555...)
   - Note your **Phone Number ID**
   - Generate a **Temporary Access Token** (or set up a permanent System User token)
5. For the webhook (you'll configure this after deploying to Vercel — see Step 8)

## Step 6: Create .env.local

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in:
```
DATABASE_URL=postgresql://...your neon url...
OPENAI_API_KEY=sk-...your openai key...
META_VERIFY_TOKEN=mySecretVerifyToken123  ← pick anything, you'll use this in Meta dashboard
META_WHATSAPP_TOKEN=...your meta access token...
META_PHONE_NUMBER_ID=...your phone number id...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 7: Set up the database

```bash
npm run db:push    # creates all tables in Neon
npx tsx lib/db/seed.ts  # seeds default settings and sample questions
```

## Step 8: Run locally

```bash
npm run dev
```

Open http://localhost:3000 - you'll see the dashboard.

## Step 9: Deploy to Vercel

1. Push code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create whatsapp-hr-bot --private --push  # if you have gh CLI
# OR go to github.com and create a repo manually, then git remote add + push
```

2. Go to https://vercel.com → New Project → import your GitHub repo
3. Add all environment variables from `.env.local` in Vercel's project settings
4. Deploy!

## Step 10: Set up WhatsApp Webhook on Meta

After Vercel deploy, your webhook URL will be:
```
https://your-app.vercel.app/api/webhook
```

1. In Meta App Dashboard → WhatsApp → Configuration → Webhooks
2. Callback URL: `https://your-app.vercel.app/api/webhook`
3. Verify Token: the same value you set in `META_VERIFY_TOKEN`
4. Subscribe to: **messages** field
5. Click Verify and Save

## Step 11: Add test number

In Meta → WhatsApp → API Setup → "To" field, add your personal number.
Send a message to the test WhatsApp number Meta gave you.
Watch it appear in your dashboard at https://your-app.vercel.app

---

## Common issues

**Webhook not verifying?**
- Make sure `META_VERIFY_TOKEN` in Vercel env matches what you typed in Meta dashboard
- Check Vercel function logs for errors

**Messages not sending back?**
- Check `META_WHATSAPP_TOKEN` hasn't expired (temporary tokens last 24h — use a System User token for production)
- Check Vercel function logs

**Database errors?**
- Run `npm run db:push` again after any schema changes
