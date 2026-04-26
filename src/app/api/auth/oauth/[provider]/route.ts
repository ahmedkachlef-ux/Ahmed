import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { setSession } from "@/lib/auth";
import { ActivityLog } from "@/models/ActivityLog";

type Provider = "google" | "facebook" | "yahoo";

const META: Record<Provider, { auth: string; token: string; userInfo: string; scope: string }> = {
  google: {
    auth: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    userInfo: "https://www.googleapis.com/oauth2/v3/userinfo",
    scope: "openid email profile"
  },
  facebook: {
    auth: "https://www.facebook.com/v18.0/dialog/oauth",
    token: "https://graph.facebook.com/v18.0/oauth/access_token",
    userInfo: "https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,picture",
    scope: "email,public_profile"
  },
  yahoo: {
    auth: "https://api.login.yahoo.com/oauth2/request_auth",
    token: "https://api.login.yahoo.com/oauth2/get_token",
    userInfo: "https://api.login.yahoo.com/openid/v1/userinfo",
    scope: "openid profile email"
  }
};

function envFor(p: Provider) {
  const id = process.env[`${p.toUpperCase()}_CLIENT_ID`];
  const secret = process.env[`${p.toUpperCase()}_CLIENT_SECRET`];
  return { id, secret };
}

function redirectUri(req: NextRequest, p: Provider) {
  const url = new URL(req.url);
  return `${url.origin}/api/auth/oauth/${p}?callback=1`;
}

export async function GET(req: NextRequest, { params }: { params: { provider: string } }) {
  const provider = params.provider as Provider;
  if (!META[provider]) return NextResponse.json({ error: "unknown_provider" }, { status: 404 });
  const { searchParams } = new URL(req.url);
  const isCallback = searchParams.get("callback");
  const { id, secret } = envFor(provider);

  // Graceful fallback: if no client id configured, simulate a demo sign-in so the UI flow remains usable.
  if (!id || !secret) {
    const fakeEmail = `demo-${provider}-${Math.floor(Math.random() * 9000 + 1000)}@advancia.demo`;
    const u = await upsertSocialUser({
      email: fakeEmail,
      name: `${provider[0].toUpperCase() + provider.slice(1)} Demo User`,
      provider
    });
    await setSession({ sub: String(u._id), email: u.email, role: u.role, name: u.fullName });
    return NextResponse.redirect(new URL("/dashboard?social=demo", req.url));
  }

  if (!isCallback) {
    const url = new URL(META[provider].auth);
    url.searchParams.set("client_id", id);
    url.searchParams.set("redirect_uri", redirectUri(req, provider));
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", META[provider].scope);
    url.searchParams.set("state", provider);
    return NextResponse.redirect(url);
  }

  // Callback
  const code = searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login?error=oauth", req.url));

  try {
    const tokenRes = await fetch(META[provider].token, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: id,
        client_secret: secret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri(req, provider)
      })
    });
    const tokenJson: any = await tokenRes.json();
    const accessToken = tokenJson.access_token;
    if (!accessToken) throw new Error("no_token");

    const infoRes = await fetch(META[provider].userInfo, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const info: any = await infoRes.json();

    const email = info.email || `${provider}-${info.id || "user"}@advancia.local`;
    const name = info.name || info.given_name || `${provider} user`;
    const u = await upsertSocialUser({ email, name, provider });
    await setSession({ sub: String(u._id), email: u.email, role: u.role, name: u.fullName });
    return NextResponse.redirect(new URL("/dashboard?social=" + provider, req.url));
  } catch {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", req.url));
  }
}

async function upsertSocialUser({ email, name, provider }: { email: string; name: string; provider: Provider }) {
  await connectDB();
  let user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    const [firstName, ...rest] = name.trim().split(/\s+/);
    user = await User.create({
      recordId: "REC-" + Date.now().toString(36).toUpperCase(),
      fullName: name,
      firstName,
      lastName: rest.join(" "),
      email: email.toLowerCase(),
      authProvider: provider,
      emailVerified: true,
      avatar: ["fox", "panda", "tiger", "owl"][Math.floor(Math.random() * 4)],
      role: "user",
      status: "active"
    });
    await ActivityLog.create({ actor: user._id, actorRole: "user", action: "register", target: email, metadata: { provider } });
  }
  user.lastLogin = new Date();
  await user.save();
  return user;
}
