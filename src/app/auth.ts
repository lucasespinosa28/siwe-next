import NextAuth, { type Session, type User } from "next-auth";
import { type JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import { getCsrfToken } from "next-auth/react";
import { headers } from "next/headers";
import { parseSiweMessage } from "viem/siwe";
import { publicClient } from "./Web3Provider";

// Extend Session type to include address and id on user
declare module "next-auth" {
  interface Session {
    address?: string;
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

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
        message: {
          label: "Message",
          type: "text",
          placeholder: "0x0",
        },
        signature: {
          label: "Signature",
          type: "text",
          placeholder: "0x0",
        },
      },
      async authorize(
        credentials: Record<"message" | "signature", string> | undefined,
      ) {
        try {
          if (!credentials?.message || !credentials.signature) {
            return null;
          }

          const siweMessage = parseSiweMessage(
            credentials.message as string
          );

          // 1. Verify the nonce
          // Await headers() since it's a Promise
          const reqHeaders = await headers();
          const csrfToken = await getCsrfToken({
            req: { headers: headersToObject(reqHeaders) },
          });

          if (siweMessage.nonce !== csrfToken) {
            console.error("Nonce mismatch");
            return null;
          }

          // 2. Verify the signature
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

          // 3. Return the user object with id as string
          if (!siweMessage.address) return null;
          return {
            id: siweMessage.address as `0x${string}`,
          } satisfies User;

        } catch (e) {
          console.error("Error authorizing user", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }: { token: JWT; user: User | null }): JWT {
      if (user && user.id) {
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }: { session: Session; token: JWT }): Session {
      if (token.sub) {
        session.address = token.sub;
        if (session.user) {
          session.user.id = token.sub;
        } else {
          session.user = { id: token.sub };
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