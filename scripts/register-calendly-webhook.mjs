const token = process.env.CALENDLY_PERSONAL_ACCESS_TOKEN;
const callbackUrl = process.env.CALENDLY_WEBHOOK_URL
  ?? `${process.env.APP_URL?.replace(/\/$/, "")}/api/webhooks/calendly`;

if (!token || !callbackUrl.startsWith("https://")) {
  throw new Error("Set CALENDLY_PERSONAL_ACCESS_TOKEN and APP_URL or CALENDLY_WEBHOOK_URL");
}

const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
const me = await fetch("https://api.calendly.com/users/me", { headers });
if (!me.ok) throw new Error(`Calendly user lookup failed: ${me.status}`);
const user = await me.json();
const organization = user.resource?.current_organization;
if (!organization) throw new Error("Calendly account has no current organization");

const response = await fetch("https://api.calendly.com/webhook_subscriptions", {
  method: "POST",
  headers,
  body: JSON.stringify({
    url: callbackUrl,
    events: ["invitee.created", "invitee.canceled"],
    organization,
    scope: "organization",
  }),
});
if (!response.ok) throw new Error(`Calendly webhook registration failed: ${response.status} ${await response.text()}`);
console.log(JSON.stringify(await response.json(), null, 2));
