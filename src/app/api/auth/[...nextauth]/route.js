import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'cashier@noorpos.local' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Demo credential authentication check (or query Postgres user table)
        if (
          credentials.email === 'cashier@noorpos.local' ||
          credentials.email === 'saif@boutique.pos' ||
          credentials.password === 'password123'
        ) {
          return {
            id: '7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f',
            name: 'Saif Cashier',
            email: credentials.email,
            role: 'cashier',
          };
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 12 * 60 * 60, // 12 hours terminal shift
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'boutique_pos_super_secret_jwt_key_2026',
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
