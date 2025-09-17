import { prisma } from '@/lib/db/prisma';
import { NextRequest } from 'next/server';
import * as institutionsApi from '@/app/api/institutions/route';

// Mock NextAuth
jest.mock('@/lib/auth/get-server-session', () => ({
  getServerSession: jest.fn().mockResolvedValue({
    user: { id: 'test-user-id', name: 'Test User' }
  }),
  withAuth: (handler: Function) => handler,
}));

describe('/api/institutions', () => {
  beforeEach(async () => {
    // Clean up database
    await prisma.institution.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/institutions', () => {
    it('should return empty array when no institutions exist', async () => {
      const req = new NextRequest('http://localhost:3000/api/institutions');
      const response = await institutionsApi.GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([]);
    });

    it('should return institutions ordered by displayOrder', async () => {
      // Create test institutions
      await prisma.institution.createMany({
        data: [
          { name: 'Bank B', displayOrder: 2 },
          { name: 'Bank A', displayOrder: 1 },
          { name: 'Bank C', displayOrder: 3 },
        ],
      });

      const req = new NextRequest('http://localhost:3000/api/institutions');
      const response = await institutionsApi.GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(3);
      expect(data[0].name).toBe('Bank A');
      expect(data[1].name).toBe('Bank B');
      expect(data[2].name).toBe('Bank C');
    });
  });

  describe('POST /api/institutions', () => {
    it('should create a new institution', async () => {
      const payload = {
        name: 'Test Bank',
        type: 'bank',
        color: '#ff0000',
        displayOrder: 1,
      };

      const req = new NextRequest('http://localhost:3000/api/institutions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await institutionsApi.POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe('Test Bank');
      expect(data.type).toBe('bank');
      expect(data.color).toBe('#ff0000');
      expect(data.displayOrder).toBe(1);
    });

    it('should reject invalid data', async () => {
      const payload = {
        // Missing required 'name' field
        type: 'bank',
      };

      const req = new NextRequest('http://localhost:3000/api/institutions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const response = await institutionsApi.POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid data');
    });
  });
});
