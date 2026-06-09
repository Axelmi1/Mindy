import { Test } from '@nestjs/testing';
import { GoneException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../notifications/email.service';
import { UsersService } from '../users/users.service';

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
        { provide: JwtService, useValue: { sign: jest.fn(() => 'signed.jwt.token') } },
        { provide: UsersService, useValue: { create: jest.fn(), findById: jest.fn() } },
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

// ── Standalone helper for direct-instantiation tests ─────────────────────────

function makeService(over: any = {}) {
  const prisma = {
    user: { findUnique: jest.fn() },
    magicLinkToken: { updateMany: jest.fn(), create: jest.fn(), findUnique: jest.fn() },
    $transaction: jest.fn(),
    ...over.prisma,
  };
  const jwt = { sign: jest.fn(() => 'signed.jwt.token'), ...over.jwt };
  const users = { create: jest.fn(), findById: jest.fn(), ...over.users };
  const email = { sendMagicLink: jest.fn() };
  const service = new AuthService(prisma as any, email as any, jwt as any, users as any);
  return { service, prisma, jwt, users };
}

describe('AuthService.register', () => {
  it('hashes the password, creates the user and returns a token', async () => {
    const { service, users, jwt } = makeService({
      users: { create: jest.fn(async (d: any) => ({ id: 'u1', username: d.username, password: d.password })) },
    });
    const out = await service.register({ email: 'A@B.com', password: 'secret12', username: 'sat' });
    const created = (users.create as jest.Mock).mock.calls[0][0];
    expect(created.email).toBe('a@b.com');
    expect(created.password).not.toBe('secret12');
    expect(await bcrypt.compare('secret12', created.password)).toBe(true);
    expect(jwt.sign).toHaveBeenCalledWith({ sub: 'u1', username: 'sat' });
    expect(out.accessToken).toBe('signed.jwt.token');
  });
});

describe('AuthService.login', () => {
  it('returns a token for valid credentials', async () => {
    const hash = await bcrypt.hash('secret12', 12);
    const { service, jwt } = makeService({
      prisma: { user: { findUnique: jest.fn(async () => ({ id: 'u1', username: 'sat', password: hash })) } },
    });
    const out = await service.login({ email: 'a@b.com', password: 'secret12' });
    expect(jwt.sign).toHaveBeenCalled();
    expect(out.accessToken).toBe('signed.jwt.token');
  });

  it('rejects a wrong password', async () => {
    const hash = await bcrypt.hash('secret12', 12);
    const { service } = makeService({
      prisma: { user: { findUnique: jest.fn(async () => ({ id: 'u1', username: 'sat', password: hash })) } },
    });
    await expect(service.login({ email: 'a@b.com', password: 'WRONG' })).rejects.toThrow(UnauthorizedException);
  });

  it('rejects when the user has no password (legacy account)', async () => {
    const { service } = makeService({
      prisma: { user: { findUnique: jest.fn(async () => ({ id: 'u1', username: 'sat', password: null })) } },
    });
    await expect(service.login({ email: 'a@b.com', password: 'whatever' })).rejects.toThrow(UnauthorizedException);
  });

  it('rejects an unknown email', async () => {
    const { service } = makeService({
      prisma: { user: { findUnique: jest.fn(async () => null) } },
    });
    await expect(service.login({ email: 'no@one.com', password: 'x' })).rejects.toThrow(UnauthorizedException);
  });
});
