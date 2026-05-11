/**
 * @swagger
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: List orders scoped by RBAC and tenant context
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/StatusQuery'
 *       - $ref: '#/components/parameters/DateFromQuery'
 *       - $ref: '#/components/parameters/DateToQuery'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Paginated'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   post:
 *     tags: [Orders]
 *     summary: Create order
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [serviceTypeId]
 *             properties:
 *               sourceType:
 *                 type: string
 *                 enum: [individual, company]
 *               serviceTypeId:
 *                 type: string
 *                 format: uuid
 *               vehicleTypeId:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               workerCount:
 *                 type: integer
 *                 minimum: 1
 *               isFragile:
 *                 type: boolean
 *               notes:
 *                 type: string
 *                 nullable: true
 *               scheduledDate:
 *                 type: string
 *                 format: date-time
 *               scheduledTimeSlot:
 *                 type: string
 *                 nullable: true
 *               estimatedPrice:
 *                 type: number
 *               locations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [type, addressLine, city]
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [pickup, dropoff]
 *                     addressLine: { type: string }
 *                     city: { type: string }
 *                     area: { type: string, nullable: true }
 *                     latitude: { type: number }
 *                     longitude: { type: number }
 *                     floor: { type: integer }
 *                     unit: { type: string, nullable: true }
 *                     hasElevator: { type: boolean }
 *                     contactName: { type: string, nullable: true }
 *                     contactPhone: { type: string, nullable: true }
 *                     notes: { type: string, nullable: true }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [name]
 *                   properties:
 *                     name: { type: string }
 *                     quantity: { type: integer, minimum: 1 }
 *                     description: { type: string, nullable: true }
 *                     isFragile: { type: boolean }
 *                     weight: { type: number }
 *                     dimensions: { type: string, nullable: true }
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Created'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order by id
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *     tags: [Orders]
 *     summary: Update order
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
 *               sourceType:
 *                 type: string
 *                 enum: [individual, company]
 *               serviceTypeId: { type: string, format: uuid }
 *               vehicleTypeId: { type: string, format: uuid, nullable: true }
 *               workerCount: { type: integer, minimum: 1 }
 *               isFragile: { type: boolean }
 *               notes: { type: string, nullable: true }
 *               scheduledDate: { type: string, format: date-time }
 *               scheduledTimeSlot: { type: string, nullable: true }
 *               estimatedPrice: { type: number }
 *               locations:
 *                 type: array
 *                 items:
 *                   type: object
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Orders]
 *     summary: Soft-delete order
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * /orders/{id}/timeline:
 *   get:
 *     tags: [Orders]
 *     summary: Order status history
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 * /orders/{id}/attachments:
 *   get:
 *     tags: [Orders]
 *     summary: List order attachment metadata
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *   post:
 *     tags: [Orders]
 *     summary: Register order attachment metadata
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fileName, originalName, filePath, mimeType, fileSize]
 *             properties:
 *               fileName: { type: string }
 *               originalName: { type: string }
 *               filePath: { type: string }
 *               mimeType: { type: string }
 *               fileSize: { type: integer }
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Created'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 * /orders/{id}/submit:
 *   post:
 *     tags: [Orders]
 *     summary: Submit order for approval or publishing
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 * /orders/{id}/publish:
 *   post:
 *     tags: [Orders]
 *     summary: Publish order for offers
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 * /orders/{id}/cancel:
 *   post:
 *     tags: [Orders]
 *     summary: Cancel order
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 * /orders/{id}/assign:
 *   post:
 *     tags: [Orders]
 *     summary: Assign provider and optional driver
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [providerId]
 *             properties:
 *               providerId: { type: string, format: uuid }
 *               driverId: { type: string, format: uuid, nullable: true }
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Created'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 * /orders/{id}/start:
 *   post:
 *     tags: [Orders]
 *     summary: Mark order en route to pickup
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 * /orders/{id}/arrive-pickup:
 *   post:
 *     tags: [Orders]
 *     summary: Mark order arrived at pickup
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 * /orders/{id}/pickup:
 *   post:
 *     tags: [Orders]
 *     summary: Mark order picked up
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 * /orders/{id}/arrive-dropoff:
 *   post:
 *     tags: [Orders]
 *     summary: Mark order arrived at dropoff
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 * /orders/{id}/deliver:
 *   post:
 *     tags: [Orders]
 *     summary: Mark order delivered
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 * /orders/{id}/complete:
 *   post:
 *     tags: [Orders]
 *     summary: Complete order
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 */

module.exports = {};
