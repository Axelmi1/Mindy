import { Test } from '@nestjs/testing';
import { GoneException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let email: { sendMagicLink: jest.Mock };

  beforeEach(async () => {
    prisma = {
      magicLinkToken: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        create: jest.fn().mockResolvedValue({ id: 't1' }),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      user: { update: jest.fn().mockResolvedValue({ id: 'u1', email: 'a@b.c' }) },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };
    email = { sendMagicLink: jest.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailService, useValue: email },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  describe('sendMagicLink', () => {
    it('generates a token and sends email', async () => {
      await service.sendMagicLink('u1', 'a@b.c');
      expect(prisma.magicLinkToken.create).toHaveBeenCalled();
      expect(email.sendMagicLink).toHaveBeenCalledWith('a@b.c', expect.stringContaining('mindy://auth/verify/'));
    });

    it('invalidates prior active tokens for same (userId,email)', async () => {
      await service.sendMagicLink('u1', 'a@b.c');
      expect(prisma.magicLinkToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'u1', email: 'a@b.c', usedAt: null }),
        }),
      );
    });
  });

  describe('verify', () => {
    it('throws NotFound for unknown token', async () => {
      prisma.magicLinkToken.findUnique.mockResolvedValue(null);
      await expect(service.verify('bad')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws Gone when already used', async () => {
      prisma.magicLinkToken.findUnique.mockResolvedValue({
        id: 't1', usedAt: new Date(), expiresAt: new Date(Date.now() + 60000), userId: 'u1', email: 'a@b.c',
      });
      await expect(service.verify('used')).rejects.toBeInstanceOf(GoneException);
    });

    it('throws Gone when expired', async () => {
      prisma.magicLinkToken.findUnique.mockResolvedValue({
        id: 't1', usedAt: null, expiresAt: new Date(Date.now() - 1000), userId: 'u1', email: 'a@b.c',
      });
      await expect(service.verify('old')).rejects.toBeInstanceOf(GoneException);
    });

    it('marks token used and verifies email on success', async () => {
      prisma.magicLinkToken.findUnique.mockResolvedValue({
        id: 't1', usedAt: null, expiresAt: new Date(Date.now() + 60000), userId: 'u1', email: 'a@b.c',
      });
      const result = await service.verify('ok');
      expect(prisma.magicLinkToken.update).toHaveBeenCalled();
      expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 'u1' },
        data: { email: 'a@b.c', emailVerified: true },
      }));
      expect(result).toEqual({ id: 'u1', email: 'a@b.c' });
    });
  });
});
