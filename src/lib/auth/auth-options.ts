import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { Adapter } from 'next-auth/adapters';
import { prisma } from '../db/prisma';
import bcrypt from 'bcryptjs';
import { MockGoogleProvider } from './mock-provider';

// Helper function to create initial data for OAuth users
async function createInitialDataForOAuthUser(userId: string) {
  try {
    // Check if user already has data
    const existingInstitutions = await prisma.institution.count({
      where: { userId }
    });
    
    if (existingInstitutions === 0) {
      // Create sample data for new OAuth user
      const institution = await prisma.institution.create({
        data: {
          userId,
          name: 'My Bank',
          type: 'bank',
          color: '#4F46E5',
          displayOrder: 0,
        }
      });
      
      const account = await prisma.account.create({
        data: {
          userId,
          institutionId: institution.id,
          name: 'Checking Account',
          type: 'CHECKING',
          currency: 'EUR',
          displayOrder: 0,
          isActive: true,
        }
      });
      
      // Add a welcome snapshot
      await prisma.accountSnapshot.create({
        data: {
          accountId: account.id,
          date: new Date(),
          valueOriginal: 1000,
          currency: 'EUR',
          valueEur: 1000,
          exchangeRate: 1,
        }
      });
    }
  } catch (error) {
    console.error('Error creating initial data for OAuth user:', error);
  }
}

// Custom Prisma Adapter to handle our renamed models
const customPrismaAdapter: Adapter = {
  createUser: async (data: any) => {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        emailVerified: data.emailVerified,
        image: data.image,
      },
    });
    return {
      id: user.id,
      email: user.email,
      name: user.name || null,
      image: user.image || null,
      emailVerified: user.emailVerified,
    };
  },
  getUser: async (id) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name || null,
      image: user.image || null,
      emailVerified: user.emailVerified,
    };
  },
  getUserByEmail: async (email) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      name: user.name || null,
      image: user.image || null,
      emailVerified: user.emailVerified,
    };
  },
  getUserByAccount: async ({ providerAccountId, provider }) => {
    const account = await prisma.oAuthAccount.findFirst({
      where: { providerAccountId, provider },
      include: { user: true },
    });
    if (!account?.user) return null;
    return {
      id: account.user.id,
      email: account.user.email,
      name: account.user.name || null,
      image: account.user.image || null,
      emailVerified: account.user.emailVerified,
    };
  },
  updateUser: async ({ id, ...data }) => {
    const user = await prisma.user.update({
      where: { id },
      data,
    });
    return {
      id: user.id,
      email: user.email,
      name: user.name || null,
      image: user.image || null,
      emailVerified: user.emailVerified,
    };
  },
  linkAccount: async (data) => {
    await prisma.oAuthAccount.create({
      data: {
        userId: data.userId,
        type: data.type,
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        refresh_token: data.refresh_token,
        access_token: data.access_token,
        expires_at: data.expires_at,
        token_type: data.token_type,
        scope: data.scope,
        id_token: data.id_token,
        session_state: data.session_state,
      },
    });
  },
  createSession: async ({ sessionToken, userId, expires }) => {
    // Sessions are handled by JWT, not needed for JWT strategy
    return { sessionToken, userId, expires };
  },
  getSessionAndUser: async (sessionToken) => {
    // Sessions are handled by JWT, not needed for JWT strategy
    return null;
  },
  updateSession: async ({ sessionToken }) => {
    // Sessions are handled by JWT, not needed for JWT strategy
    return null;
  },
  deleteSession: async (sessionToken) => {
    // Sessions are handled by JWT, not needed for JWT strategy
  },
};

export const authOptions: NextAuthOptions = {
  // No adapter - using JWT strategy for all auth methods
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'email@example.com' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please provide email and password');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user || !user.passwordHash) {
          throw new Error('Invalid email or password');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error('Invalid email or password');
        }

        return {
          id: user.id,
          name: user.name || user.username || user.email,
          email: user.email,
          username: user.username || user.email,
        };
      }
    }),
    // OAuth providers
    // Use mock provider in development if USE_MOCK_AUTH is set
    ...(process.env.NODE_ENV === 'development' && process.env.USE_MOCK_AUTH === 'true' ? [
      MockGoogleProvider()
    ] : process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true, // Allow linking by email
      })
    ] : []),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? [
      GitHubProvider({
        clientId: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true, // Allow linking by email
      })
    ] : []),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle OAuth sign-ins
      if (account?.provider && account.provider !== 'credentials') {
        try {
          // Check if user exists
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email! }
          });
          
          if (!dbUser) {
            // Create new user
            dbUser = await prisma.user.create({
              data: {
                email: user.email!,
                name: user.name,
                image: user.image,
                emailVerified: new Date(),
              }
            });
            
            // Create initial data for new user
            await createInitialDataForOAuthUser(dbUser.id);
          }
          
          // Store OAuth account info if not exists
          const existingAccount = await prisma.oAuthAccount.findFirst({
            where: {
              userId: dbUser.id,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            }
          });
          
          if (!existingAccount) {
            await prisma.oAuthAccount.create({
              data: {
                userId: dbUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state as string | undefined,
              }
            });
          }
          
          // Update user object with database ID
          user.id = dbUser.id;
          
        } catch (error) {
          console.error('Error in OAuth sign-in:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          id: user.id,
          email: user.email,
          name: user.name,
          provider: account.provider,
        };
      }
      
      // Subsequent requests - token already has user info
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
