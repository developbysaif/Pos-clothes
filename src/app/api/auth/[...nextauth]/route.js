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

        // Validate against authorized staff credentials
        const validUsers = [
          {
            email: 'admin@boutique.com',
            password: 'admin123',
            id: 'usr-admin-1',
            name: 'Saif Super Admin',
            role: 'SUPER_ADMIN',
          },
          {
            email: 'manager@boutique.com',
            password: 'manager123',
            id: 'usr-manager-1',
            name: 'Bilal Store Manager',
            role: 'MANAGER',
          },
          {
            email: 'cashier@boutique.com',
            password: 'cashier123',
            id: 'usr-cashier-1',
            name: 'Zainab Lead Cashier',
            role: 'CASHIER',
          },
        ];

        const matched = validUsers.find(
          (u) =>
            u.email.toLowerCase() === credentials.email.toLowerCase().trim() &&
            u.password === credentials.password
        );

        if (matched) {
          return {
            id: matched.id,
            name: matched.name,
            email: matched.email,
            role: matched.role,
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
