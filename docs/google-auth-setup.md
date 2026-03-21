# Google Sign-In Setup Guide

This guide walks you through enabling Google sign-in for Sabrina's Vault. The app works fully without authentication — this is optional and only needed if you want per-user data in the future.

## Overview

You need to:
1. Create Google OAuth credentials in Google Cloud Console
2. Enable the Google provider in your Supabase project
3. Configure redirect URLs

---

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console — Credentials](https://console.cloud.google.com/apis/credentials)
2. Select your project (or create a new one)
3. Click **Create Credentials** → **OAuth client ID**
4. If prompted, configure the OAuth consent screen first:
   - Choose **External** user type
   - Fill in the app name (e.g., "Sabrina's Vault")
   - Add your email as the support/developer contact
   - Add the scope: `email`, `profile`, `openid`
   - Save and continue
5. Back on the credentials page, click **Create Credentials** → **OAuth client ID**
6. Application type: **Web application**
7. Name: `Sabrina's Vault` (or whatever you prefer)
8. Under **Authorized redirect URIs**, add:
   ```
   https://kqdunvqnnuhzqeckufxt.supabase.co/auth/v1/callback
   ```
9. Click **Create**
10. Copy the **Client ID** and **Client Secret** — you'll need these in the next step

---

## Step 2: Enable Google Provider in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (`kqdunvqnnuhzqeckufxt`)
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list and toggle it **on**
5. Paste the **Client ID** from Step 1
6. Paste the **Client Secret** from Step 1
7. Click **Save**

---

## Step 3: Configure Redirect URLs

1. In the Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Make sure the **Site URL** is set to:
   ```
   https://sabrinacarmona.github.io/mtg-deck-centre/
   ```
3. Under **Redirect URLs**, add:
   ```
   https://sabrinacarmona.github.io/mtg-deck-centre/
   ```
   (Also add `http://localhost:5173/` if you want local dev to work with auth)
4. Click **Save**

---

## Step 4: Test It

1. Open the app in your browser
2. Click the **Sign In** button in the sidebar (desktop) or header (mobile)
3. You should be redirected to Google's sign-in page
4. After signing in, you'll be redirected back to the app
5. Your avatar/name should appear where the Sign In button was

---

## Troubleshooting

### "Google sign-in is not configured yet" toast
This means the Google provider is not enabled in Supabase, or the credentials are incorrect. Double-check Steps 1 and 2.

### Redirected to wrong URL after sign-in
Make sure the redirect URLs in Step 3 exactly match your deployed app URL, including the trailing slash.

### Sign-in works locally but not on GitHub Pages
Ensure `https://sabrinacarmona.github.io/mtg-deck-centre/` is in the Supabase redirect URLs (Step 3) and that the Google OAuth authorized redirect URI includes the Supabase callback URL (Step 1).

### OAuth consent screen shows "unverified app"
This is normal for development. Google shows this warning for apps that haven't been through their verification process. Click "Continue" to proceed. For production use, you can submit the app for verification in the Google Cloud Console.
