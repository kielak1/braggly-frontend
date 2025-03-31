import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { AuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import type { Account } from "next-auth";

type ExtendedToken = JWT & {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  idToken?: string; 
};

// 🔁 Funkcja odświeżająca token Google
async function refreshAccessToken(token: any) {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data);

    return {
      ...token,
      accessToken: data.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
      refreshToken: data.refresh_token ?? token.refreshToken, // Google często nie wysyła go ponownie
    };
  } catch (error) {
    console.error("Błąd odświeżania tokena:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}
const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],

  callbacks: {
    async jwt({
      token,
      account,
    }: {
      token: ExtendedToken;
      account?: (Account & { expires_in?: number }) | null;
    }): Promise<JWT> {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt =
          Math.floor(Date.now() / 1000) + (account.expires_in || 3600);
        token.idToken = account.id_token;
      }

      if (Date.now() >= (token.expiresAt || 0) * 1000) {
        return await refreshAccessToken(token);
      }

      return token;
    },

    async session({
      session,
      token,
    }: {
      session: Session;
      token: ExtendedToken;
    }): Promise<Session> {
      session.backendToken = token.accessToken as string;
      session.idToken = token.idToken;
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
  },
});

export { handler as GET, handler as POST };
