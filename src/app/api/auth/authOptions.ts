import { NextAuthOptions, Session, Account, Profile, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import GoogleProvider from "next-auth/providers/google";

// Rozszerzamy typy lokalnie dla pewności
interface ExtendedSession extends Session {
  backendToken?: string;
}

interface ExtendedJWT extends JWT {
  backendToken?: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({
      account,
      profile,
    }: {
      user: User;
      account: Account | null;
      profile?: Profile;
      email?: { verificationRequest?: boolean };
      credentials?: Record<string, any>;
    }): Promise<boolean> {
      if (account?.provider === "google" && account?.id_token) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/google`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: account.id_token }),
          }
        );
        const responseData = await res.json(); // Zakładając, że backend zwraca JSON
        console.log("Odpowiedź z backendu:", {
          status: res.status,
          ok: res.ok,
          data: responseData,
        });

        if (res.ok && responseData.token) {
          account.backendToken = responseData.token; // Przekaz token do account
        }
        return res.ok;
      }
      return true;
    },

    async jwt({ token, account }: { token: ExtendedJWT; account: Account | null }) {
      if (account?.backendToken) {
        token.backendToken = account.backendToken; // Poprawna nazwa właściwości
      }
      return token;
    },

    async session({ session, token }: { session: ExtendedSession; token: ExtendedJWT }) {
      if (token.backendToken) {
        session.backendToken = token.backendToken; // Przekaz token do sesji
      }
      return session;
    },
  },
};