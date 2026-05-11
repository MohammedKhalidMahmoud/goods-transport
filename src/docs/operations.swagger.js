/**
 * @swagger
 * /offers:
 *   get:
 *     tags: [Offers]
 *     summary: List offers
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Paginated'
 *   post:
 *     tags: [Offers]
 *     summary: Create provider offer
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, price]
 *             properties:
 *               orderId: { type: string, format: uuid }
 *               price: { type: number }
 *               estimatedDuration: { type: string, nullable: true }
 *               notes: { type: string, nullable: true }
 *               validUntil: { type: string, format: date-time, nullable: true }
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Created'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/Unprocessable'
 * /offers/{id}:
 *   get:
 *     tags: [Offers]
 *     summary: Get offer
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *     tags: [Offers]
 *     summary: Update pending offer
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price: { type: number }
 *               notes: { type: string, nullable: true }
 *               validUntil: { type: string, format: date-time, nullable: true }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       422:
 *         $ref: '#/components/responses/Unprocessable'
 *   delete:
 *     tags: [Offers]
 *     summary: Withdraw pending offer
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       422:
 *         $ref: '#/components/responses/Unprocessable'
 * /offers/{id}/accept:
 *   post:
 *     tags: [Offers]
 *     summary: Accept offer
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       422:
 *         $ref: '#/components/responses/Unprocessable'
 * /offers/{id}/reject:
 *   post:
 *     tags: [Offers]
 *     summary: Reject offer
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 * /offers/{id}/withdraw:
 *   post:
 *     tags: [Offers]
 *     summary: Withdraw offer
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 * /assignments:
 *   get:
 *     tags: [Assignments]
 *     summary: List assignments
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Paginated'
 *   post:
 *     tags: [Assignments]
 *     summary: Create assignment
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, providerId]
 *             properties:
 *               orderId: { type: string, format: uuid }
 *               providerId: { type: string, format: uuid }
 *               driverId: { type: string, format: uuid, nullable: true }
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Created'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 * /assignments/{id}:
 *   get:
 *     tags: [Assignments]
 *     summary: Get assignment
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *     tags: [Assignments]
 *     summary: Update assignment status
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, accepted, rejected, in_progress, completed, canceled]
 *               notes: { type: string, nullable: true }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   delete:
 *     tags: [Assignments]
 *     summary: Cancel assignment
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 * /order-items:
 *   get:
 *     tags: [Orders]
 *     summary: List order items for an order
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   post:
 *     tags: [Orders]
 *     summary: Create order item
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, name]
 *             properties:
 *               orderId: { type: string, format: uuid }
 *               name: { type: string }
 *               quantity: { type: integer, minimum: 1 }
 *               description: { type: string, nullable: true }
 *               isFragile: { type: boolean }
 *               weight: { type: number }
 *               dimensions: { type: string, nullable: true }
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Created'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 * /order-items/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order item
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *     tags: [Orders]
 *     summary: Update order item
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               quantity: { type: integer }
 *               description: { type: string, nullable: true }
 *               isFragile: { type: boolean }
 *               weight: { type: number }
 *               dimensions: { type: string, nullable: true }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   delete:
 *     tags: [Orders]
 *     summary: Delete order item
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 * /tracking/{orderId}:
 *   get:
 *     tags: [Tracking]
 *     summary: Latest tracking events for order
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/OrderIdPath'
 *       - in: query
 *         name: assignmentId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 * /tracking/{orderId}/history:
 *   get:
 *     tags: [Tracking]
 *     summary: Tracking event history
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/OrderIdPath'
 *       - in: query
 *         name: assignmentId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 * /tracking/{orderId}/events:
 *   post:
 *     tags: [Tracking]
 *     summary: Append tracking event
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/OrderIdPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventType]
 *             properties:
 *               eventType: { type: string }
 *               latitude: { type: number, nullable: true }
 *               longitude: { type: number, nullable: true }
 *               data: { type: object, nullable: true, additionalProperties: true }
 *               assignmentId: { type: string, format: uuid, nullable: true }
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Created'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 * /tracking/{orderId}/location:
 *   post:
 *     tags: [Tracking]
 *     summary: Post GPS location
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/OrderIdPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitude, longitude]
 *             properties:
 *               latitude: { type: number }
 *               longitude: { type: number }
 *               assignmentId: { type: string, format: uuid, nullable: true }
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Created'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 * /delivery-proofs/{id}:
 *   get:
 *     tags: [Delivery]
 *     summary: List delivery proofs for order
 *     description: For GET and POST, the path id is an order id. For PATCH, the path id is a delivery proof id.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *   post:
 *     tags: [Delivery]
 *     summary: Create delivery proof for order
 *     description: The path id is the order id.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, fileName, filePath, mimeType]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [photo, signature, confirmation]
 *               fileName: { type: string }
 *               filePath: { type: string }
 *               mimeType: { type: string }
 *               notes: { type: string, nullable: true }
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Created'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   patch:
 *     tags: [Delivery]
 *     summary: Update delivery proof notes
 *     description: The path id is the delivery proof id.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes: { type: string, nullable: true }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 */

module.exports = {};
