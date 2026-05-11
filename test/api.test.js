const { describe, it, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const request = require('supertest');

const app = require('../src/app');
const { prisma } = require('../src/lib/prisma');

const skipDb = !process.env.DATABASE_URL || process.env.SKIP_INTEGRATION === '1';

describe('API / health', () => {
  it('GET /api/v1/health returns success', async () => {
    const res = await request(app).get('/api/v1/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data?.status);
  });
});

describe(
  'API / auth & orders (integration)',
  { skip: skipDb },
  () => {
    after(async () => {
      await prisma.$disconnect();
    });

    it('POST /api/v1/auth/forgot-password is non-enumerating', async () => {
      const res = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'missing-user@example.com' });
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    it('POST /api/v1/auth/send-otp + verify-otp', async () => {
      await request(app).post('/api/v1/auth/send-otp').send({
        identifier: 'customer@test.com',
        type: 'email',
      });
      const cust = await prisma.user.findUnique({ where: { email: 'customer@test.com' } });
      assert.ok(cust);
      const row = await prisma.otpVerification.findFirst({
        where: { userId: cust.id, type: 'email', verifiedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      assert.ok(row, 'OTP row should exist after send-otp for seeded user');
      const res = await request(app).post('/api/v1/auth/verify-otp').send({
        identifier: 'customer@test.com',
        code: row.code,
        type: 'email',
      });
      assert.equal(res.status, 200);
      assert.equal(res.body.data?.verified, true);
    });

    it('customer login and POST /api/v1/orders', async () => {
      const login = await request(app).post('/api/v1/auth/login').send({
        identifier: 'customer@test.com',
        password: 'Test@123',
      });
      assert.equal(login.status, 200);
      const token = login.body.data.accessToken;
      const accessPayload = jwt.decode(token);
      assert.equal(accessPayload?.role, 'CUSTOMER');
      assert.equal(accessPayload?.audience, 'APP');
      assert.equal(login.body.data.user.role, 'CUSTOMER');
      assert.equal(login.body.data.user.permissions, undefined);
      const refreshToken = login.body.data.refreshToken;
      assert.equal(typeof refreshToken, 'string');
      assert.equal(refreshToken.split('.').length, 3);
      const refreshPayload = jwt.decode(refreshToken);
      assert.equal(refreshPayload?.type, 'refresh');
      assert.equal(refreshPayload?.userId, login.body.data.user.id);
      assert.equal(refreshPayload?.audience, 'APP');

      const refresh = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
      assert.equal(refresh.status, 200);
      assert.equal(typeof refresh.body.data?.accessToken, 'string');
      assert.equal(typeof refresh.body.data?.refreshToken, 'string');
      assert.equal(refresh.body.data.refreshToken.split('.').length, 3);
      assert.notEqual(refresh.body.data.refreshToken, refreshToken);

      const reused = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });
      assert.equal(reused.status, 401);

      const st = await prisma.serviceType.findUnique({ where: { code: 'local_moving' } });
      assert.ok(st);
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sourceType: 'individual',
          serviceTypeId: st.id,
          locations: [
            { type: 'pickup', addressLine: 'A', city: 'Riyadh' },
            { type: 'dropoff', addressLine: 'B', city: 'Jeddah' },
          ],
        });
      assert.equal(res.status, 201);
      assert.ok(res.body.data?.id);
    });

    it('admin can list offers for demo order', async () => {
      const login = await request(app).post('/api/v1/dashboard/auth/login').send({
        identifier: 'admin@goodstransfer.com',
        password: 'Admin@123',
      });
      assert.equal(login.status, 200);
      const token = login.body.data.accessToken;
      const payload = jwt.decode(token);
      assert.equal(payload?.audience, 'DASHBOARD');
      assert.equal(payload?.myAdmin, true);
      const me = await request(app).get('/api/v1/dashboard/auth/me').set('Authorization', `Bearer ${token}`);
      assert.equal(me.status, 200);
      assert.equal(me.body.data.myAdmin, true);
      assert.equal(Object.prototype.hasOwnProperty.call(me.body.data, 'permissions'), false);
      const res = await request(app).get('/api/v1/dashboard/offers').set('Authorization', `Bearer ${token}`);
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.data));
    });
  }
);
