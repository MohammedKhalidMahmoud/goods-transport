/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email or phone
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Unauthorized
 *
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *     responses:
 *       200:
 *         description: OK
 *
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke refresh token
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 *
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset (email)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Generic success (no user enumeration)
 *
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Complete password reset with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password updated
 *
 * /auth/send-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Send OTP to email or phone
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, type]
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email or phone matching the account
 *               type:
 *                 type: string
 *                 enum: [email, phone]
 *     responses:
 *       200:
 *         description: Generic success
 *
 * /auth/verify-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify OTP code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, code, type]
 *             properties:
 *               identifier:
 *                 type: string
 *               code:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [email, phone]
 *     responses:
 *       200:
 *         description: Verified
 *       401:
 *         description: Invalid code
 *
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Current user profile and tenant context
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OK
 */

module.exports = {};
