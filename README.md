# SmartCare V2.2 - Visual Experience & Emotional Design

## Product Philosophy

SmartCare is not simply an AI tool.

It is an emotional parenting companion.

Every screen should make parents feel:

😊 Calm

❤️ Supported

🌞 Encouraged

🎉 Inspired

The product should feel warm, beautiful and delightful.

Avoid dense text.

Avoid enterprise dashboards.

Avoid technical language.

The experience should feel like opening a beautiful parenting magazine that refreshes every day.

---

# Daily Visual Cards

Every recommendation should include a large visual card.

Examples:

🍳 Recipe

Large meal photo.

Nutritional highlights.

Preparation time.

Difficulty.

Healthy tip.

Shopping list button.

---

🎮 Activity

Beautiful illustration.

Skills developed.

Duration.

Materials required.

Indoor / Outdoor badge.

Age recommendation.

---

📚 Bedtime Story

Beautiful AI-generated cover image.

Story title.

Reading time.

Play audio button (future).

Save favourite button.

Future:

Generate illustrated storybook pages.

---

🧠 Development Insight

Cute illustration.

Friendly icon.

Simple explanation.

One activity to try today.

Avoid long articles.

---

❤️ Parenting Tip

Illustrated quote card.

Very short.

Easy to remember.

Share button.

---

☕ Coffee Walk

Large park or café image.

Weather indicator.

Distance.

Age group.

Attendees.

Join button.

---

🎉 Weekend Activities

Every event card should display:

Large image.

Age suitability.

Distance.

Free / Paid badge.

Indoor / Outdoor.

Bookmark button.

---

# Family Memory Timeline

This should become one of the signature experiences.

Timeline style.

Large photos.

Beautiful spacing.

AI-generated journal entry.

Examples:

📷

Jack counted to ten today.

Today Jack proudly counted to ten without help.

Small moments become lifelong memories.

❤️

Future:

Parents can print monthly and yearly memory books.

---

# AI Generated Images

Use AI-generated illustrations whenever no real photo exists.

Generate:

Today's Game

Today's Story

Development Cards

Learning Activities

Celebration Cards

The illustration style should be:

Soft

Watercolour inspired

Modern children's book

Warm pastel palette

Friendly characters

Consistent visual identity.

---

# Personalised Storybook

Every bedtime story should have:

Story cover

Main character illustration

Optional future page illustrations

Parents can save stories.

Children should recognise themselves as the hero.

---

# Home Screen Experience

The home screen should feel alive.

Morning example:

🌞 Good Morning Lucy

Jack is 3 years 2 months.

━━━━━━━━━━━━

🍳 Today's Recipe

(Large meal photo)

━━━━━━━━━━━━

🎮 Today's Adventure

(Beautiful illustration)

━━━━━━━━━━━━

🧠 Today's Growth Moment

(Cute development card)

━━━━━━━━━━━━

❤️ Parenting Encouragement

━━━━━━━━━━━━

📚 Tonight's Story

(Cover illustration)

━━━━━━━━━━━━

📷 Yesterday's Happy Memory

(Family photo)

━━━━━━━━━━━━

☕ Nearby Parent Meetups

━━━━━━━━━━━━

🎉 Weekend Activities

━━━━━━━━━━━━

💬 Chat with MumBot

Every section should feel inviting.

---

# Empty States

Never display blank pages.

Instead use friendly illustrations.

Examples:

No memories yet?

Let's create your first family memory ❤️

No activities nearby?

We'll recommend some soon.

No toy exchanges?

Be the first parent in your neighbourhood.

---

# Icons

Use friendly icons throughout.

Examples:

🍳 Meals

🎮 Activities

🧠 Learning

❤️ Parenting

📚 Stories

📷 Memories

☕ Community

🎉 Events

♻️ Exchange

---

# Animation

Use subtle animations.

Cards gently appear.

Buttons softly animate.

Celebrate milestones with delightful micro-interactions.

Avoid distracting animations.

---

# Colour Palette

Warm neutral backgrounds.

Soft greens.

Sky blue.

Warm yellow.

Coral accents.

Rounded cards.

Gentle shadows.

Never use harsh colours.

Never look corporate.

---

# Mobile First

Design every screen for one-handed use.

Large touch targets.

Minimal typing.

Maximum three taps to any core feature.

Parents are often holding a child while using the app.

---

# Ultimate Design Goal

Every time a parent opens SmartCare they should feel:

"This app understands my family."

"This app makes parenting easier."

"This app makes me smile."

Design for emotion first.

Technology second.

---

# Google & GitHub Sign-In Setup

Third-party login requires **real OAuth credentials** in Vercel — not the placeholder values from `.env.example` (e.g. `your-google-client-id`).

## 1. Google (Gmail)

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**
2. Create an **OAuth client ID** of type **Web application**
3. Under **Authorized redirect URIs**, add:
   - Production: `https://smartcare-iota.vercel.app/api/auth/callback/google`
   - Local dev: `http://localhost:3000/api/auth/callback/google`
4. Copy the **Client ID** (ends with `.apps.googleusercontent.com`) and **Client secret**
5. In **Vercel → Project → Settings → Environment Variables**, set:
   - `GOOGLE_CLIENT_ID` = your real client ID
   - `GOOGLE_CLIENT_SECRET` = your real client secret
   - `NEXTAUTH_URL` = `https://smartcare-iota.vercel.app`
   - `NEXTAUTH_SECRET` = a long random string
6. **Redeploy** the app after saving env vars

## 2. GitHub (optional)

1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
2. **Authorization callback URL**: `https://smartcare-iota.vercel.app/api/auth/callback/github`
3. Set `GITHUB_ID` and `GITHUB_SECRET` in Vercel, then redeploy

## Verify

After deploy, visit `/api/auth/providers` — it should return `{"google":true,...}` only when credentials are valid. If you see `misconfigured: true`, the env vars are still placeholders or malformed.

