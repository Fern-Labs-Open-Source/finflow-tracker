import { OAuthConfig } from 'next-auth/providers/oauth';

/**
 * Mock OAuth Provider for local development
 * This simulates Google OAuth without needing real credentials
 */
export function MockGoogleProvider(): OAuthConfig<any> {
  return {
    id: 'mock-google',
    name: 'Mock Google',
    type: 'oauth',
    version: '2.0',
    authorization: {
      url: 'http://localhost:3000/api/auth/mock/authorize',
      params: {
        scope: 'openid email profile',
        response_type: 'code',
      },
    },
    token: {
      url: 'http://localhost:3000/api/auth/mock/token',
    },
    userinfo: {
      url: 'http://localhost:3000/api/auth/mock/userinfo',
    },
    client: {
      id: 'mock-client-id',
      secret: 'mock-client-secret',
    },
    profile(profile: any) {
      return {
        id: profile.sub || profile.id,
        name: profile.name,
        email: profile.email,
        image: profile.picture,
      } as any;
    },
  };
}

/**
 * Mock credentials for testing different user scenarios
 */
export const MOCK_USERS = [
  {
    id: 'mock-user-1',
    email: 'test@example.com',
    name: 'Test User',
    image: 'https://via.placeholder.com/150',
  },
  {
    id: 'mock-user-2',
    email: 'admin@example.com',
    name: 'Admin User',
    image: 'https://via.placeholder.com/150',
  },
];
