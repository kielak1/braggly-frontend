import { Session, Account } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    backendToken?: string;
    idToken?: string;
  }

  interface Account {
    backendToken?: string; // Dodajemy backendToken do Account
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    backendToken?: string;
  }
}