import NextAuth, { type User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getCsrfToken } from "next-auth/react";
import { headers } from "next/headers";
import { parseSiweMessage } from "viem/siwe";
import { publicClient } from "./app/viem";

// The "declare module" block has been removed from here

// Helper function to convert Headers object to a plain object
function headersToObject(headers: Headers): Record<string, string> {
  const obj: Record<string, string> = {};
  headers.forEach((value, key) => {
    obj[key] = value;
  });
  return obj;
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Ethereum",
      credentials: {
        message: { label: "Message", type: "text", placeholder: "0x0" },
        signature: { label: "Signature", type: "text", placeholder: "0x0" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.message || !credentials.signature) {
            return null;
          }

          const siweMessage = parseSiweMessage(credentials.message as string);
          const reqHeaders = headers();
          const csrfToken = await getCsrfToken({
            req: { headers: headersToObject(await reqHeaders) },
          });

          if (siweMessage.nonce !== csrfToken) {
            console.error("Nonce mismatch");
            return null;
          }
          
          if (!siweMessage.address) {
             console.error("SIWE message address is undefined");
             return null;
          }

          const valid = await publicClient.verifyMessage({
            address: siweMessage.address as `0x${string}`,
            message: credentials.message as string,
            signature: credentials.signature as `0x${string}`,
          });

          if (!valid) {
            console.error("Signature validation failed");
            return null;
          }
          
          return { id: siweMessage.address } satisfies User;
        } catch (e) {
          console.error("Error authorizing user", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) {
        session.address = token.sub;
        if (session.user) {
          session.user.id = token.sub;
        }
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
});