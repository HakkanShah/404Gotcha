# 404Gotcha - Link Tracker & Analytics

404Gotcha is a simple yet powerful tool to track traffic and get insights about visitors who click on your links. It's designed to be deployed on Vercel and uses Vercel KV for data storage.

## How It Works

1.  **The Link is the Key:** You share the link to this application. When someone clicks it, they are instantly redirected to the destination you've configured (e.g., your GitHub profile).
2.  **The Secret Logbook:** In that split second, the app records information about the visitor: their location, device, and how they found your link.
3.  **Bot Filtering:** The app uses an AI-powered filter to distinguish between real human visitors and automated bots, ensuring your stats are clean.
4.  **The Dashboard:** A password-protected `/stats` page shows you a detailed history of all your visitors.
5.  **Instant Notifications:** You receive an email notification for every new human visitor.

## Vercel Deployment Guide

### 1. Fork and Clone the Repository

Fork this repository to your GitHub account and clone it to your local machine.

### 2. Create a Vercel Project

- Go to your Vercel dashboard and create a new project.
- Import your forked repository from GitHub.
- Vercel will automatically detect that it's a Next.js project.

### 3. Create a Vercel KV Database

- In your Vercel project's dashboard, go to the **Storage** tab.
- Select **KV (using Vercel Redis)** and create a new database.
- After creating it, click **Connect Project**. Vercel will automatically add the required `KV_*` environment variables to your project.

### 4. Add Other Environment Variables

- In your Vercel project, go to **Settings** -> **Environment Variables**.
- Add the following variables:
  - `REDIRECT_URL`: The URL to redirect visitors to (e.g., `https://github.com/your-username`).
  - `STATS_PASSWORD`: The password to protect your dashboard.
  - `GMAIL_EMAIL`: Your Gmail address for sending notifications.
  - `GMAIL_APP_PASSWORD`: Your Gmail [App Password](https://support.google.com/accounts/answer/185833).
  - `NOTIFICATION_EMAIL`: The email address where you want to receive notifications.

### 5. Redeploy

After adding all the environment variables, trigger a new deployment from your Vercel dashboard for the changes to take effect.

Your application is now live!
