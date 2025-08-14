# **App Name**: 404Gotcha

## Core Features:

- Tracking Redirect: Redirect users to the specified URL after tracking.
- Data Logging: Log visit details, including timestamp, IP address, geolocation, device info, and referrer URL, from the request headers and the ipapi.co API.
- Email Notifications: Send instant email notifications with visit data using Nodemailer and Gmail SMTP. Allows configuration of the notification email via environment variables.
- Statistics Dashboard: Provide a password-protected route (`/stats`) to display basic visit logs in an HTML table, including timestamp, IP, location, device, and referrer.
- Smart notification filter: Use a tool to decide when user behavior matches bot or scraping behavior, so it doesn't send notifications to you for those visits.

## Style Guidelines:

- Primary color: Deep Indigo (#3F51B5) for a professional and focused feel.
- Background color: Very light indigo (#E8EAF6).
- Accent color: A more saturated purple (#7E57C2).
- Body and headline font: 'Inter' (sans-serif) for a modern, machined, objective, neutral look, and good legibility in a data-focused application.
- Use simple, clear icons to represent data points in the stats dashboard.
- Clean, minimalist layout with a focus on data presentation. Use tables for logs and clear headings.