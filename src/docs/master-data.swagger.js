/**
 * @swagger
 * /service-categories:
 *   get:
 *     tags: [Master Data]
 *     summary: List service categories
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/SortByQuery'
 *       - $ref: '#/components/parameters/SortOrderQuery'
 *       - $ref: '#/components/parameters/SearchQuery'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Paginated'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *   post:
 *     tags: [Master Data]
 *     summary: Create service category
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name]
 *             properties:
 *               code: { type: string }
 *               name: { type: string }
 *               nameAr: { type: string, nullable: true }
 *               description: { type: string, nullable: true }
 *               icon: { type: string, nullable: true }
 *               sortOrder: { type: integer }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Created'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 * /service-categories/{id}:
 *   get:
 *     tags: [Master Data]
 *     summary: Get service category
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *     tags: [Master Data]
 *     summary: Update service category
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
 *               code: { type: string }
 *               name: { type: string }
 *               nameAr: { type: string, nullable: true }
 *               description: { type: string, nullable: true }
 *               icon: { type: string, nullable: true }
 *               sortOrder: { type: integer }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     tags: [Master Data]
 *     summary: Delete service category
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 * /service-types:
 *   get:
 *     tags: [Master Data]
 *     summary: List service types
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/SortByQuery'
 *       - $ref: '#/components/parameters/SortOrderQuery'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Paginated'
 *   post:
 *     tags: [Master Data]
 *     summary: Create service type
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [serviceCategoryId, code, name]
 *             properties:
 *               serviceCategoryId: { type: string, format: uuid }
 *               code: { type: string }
 *               name: { type: string }
 *               nameAr: { type: string, nullable: true }
 *               description: { type: string, nullable: true }
 *               sortOrder: { type: integer }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Created'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 * /service-types/{id}:
 *   get:
 *     tags: [Master Data]
 *     summary: Get service type
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *     tags: [Master Data]
 *     summary: Update service type
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
 *               serviceCategoryId: { type: string, format: uuid }
 *               code: { type: string }
 *               name: { type: string }
 *               nameAr: { type: string, nullable: true }
 *               description: { type: string, nullable: true }
 *               sortOrder: { type: integer }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   delete:
 *     tags: [Master Data]
 *     summary: Delete service type
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 * /vehicle-types:
 *   get:
 *     tags: [Master Data]
 *     summary: List vehicle types
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Paginated'
 *   post:
 *     tags: [Master Data]
 *     summary: Create vehicle type
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name]
 *             properties:
 *               code: { type: string }
 *               name: { type: string }
 *               nameAr: { type: string, nullable: true }
 *               description: { type: string, nullable: true }
 *               capacity: { type: string, nullable: true }
 *               sortOrder: { type: integer }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Created'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 * /vehicle-types/{id}:
 *   get:
 *     tags: [Master Data]
 *     summary: Get vehicle type
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *   patch:
 *     tags: [Master Data]
 *     summary: Update vehicle type
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
 *               code: { type: string }
 *               name: { type: string }
 *               nameAr: { type: string, nullable: true }
 *               description: { type: string, nullable: true }
 *               capacity: { type: string, nullable: true }
 *               sortOrder: { type: integer }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   delete:
 *     tags: [Master Data]
 *     summary: Delete vehicle type
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 * /cities:
 *   get:
 *     tags: [Master Data]
 *     summary: List cities
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Paginated'
 *   post:
 *     tags: [Master Data]
 *     summary: Create city
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name]
 *             properties:
 *               code: { type: string }
 *               name: { type: string }
 *               nameAr: { type: string, nullable: true }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Created'
 * /cities/{id}:
 *   get:
 *     tags: [Master Data]
 *     summary: Get city
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *   patch:
 *     tags: [Master Data]
 *     summary: Update city
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
 *               code: { type: string }
 *               name: { type: string }
 *               nameAr: { type: string, nullable: true }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *   delete:
 *     tags: [Master Data]
 *     summary: Delete city
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 * /zones:
 *   get:
 *     tags: [Master Data]
 *     summary: List zones
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Paginated'
 *   post:
 *     tags: [Master Data]
 *     summary: Create zone
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name]
 *             properties:
 *               code: { type: string }
 *               name: { type: string }
 *               nameAr: { type: string, nullable: true }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Created'
 * /zones/{id}:
 *   get:
 *     tags: [Master Data]
 *     summary: Get zone
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *   patch:
 *     tags: [Master Data]
 *     summary: Update zone
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
 *               code: { type: string }
 *               name: { type: string }
 *               nameAr: { type: string, nullable: true }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *   delete:
 *     tags: [Master Data]
 *     summary: Delete zone
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 * /areas:
 *   get:
 *     tags: [Master Data]
 *     summary: List areas
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Paginated'
 *   post:
 *     tags: [Master Data]
 *     summary: Create area
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cityId, code, name]
 *             properties:
 *               cityId: { type: string, format: uuid }
 *               code: { type: string }
 *               name: { type: string }
 *               nameAr: { type: string, nullable: true }
 *               zoneId: { type: string, format: uuid, nullable: true }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Created'
 * /areas/{id}:
 *   get:
 *     tags: [Master Data]
 *     summary: Get area
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *   patch:
 *     tags: [Master Data]
 *     summary: Update area
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
 *               cityId: { type: string, format: uuid }
 *               code: { type: string }
 *               name: { type: string }
 *               nameAr: { type: string, nullable: true }
 *               zoneId: { type: string, format: uuid, nullable: true }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *   delete:
 *     tags: [Master Data]
 *     summary: Delete area
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 * /branches:
 *   get:
 *     tags: [Master Data]
 *     summary: List provider branches
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Paginated'
 *   post:
 *     tags: [Master Data]
 *     summary: Create provider branch
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [providerId, name]
 *             properties:
 *               providerId: { type: string, format: uuid }
 *               name: { type: string }
 *               nameAr: { type: string, nullable: true }
 *               address: { type: string, nullable: true }
 *               phone: { type: string, nullable: true }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Created'
 * /branches/{id}:
 *   get:
 *     tags: [Master Data]
 *     summary: Get provider branch
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *   patch:
 *     tags: [Master Data]
 *     summary: Update provider branch
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
 *               providerId: { type: string, format: uuid }
 *               name: { type: string }
 *               nameAr: { type: string, nullable: true }
 *               address: { type: string, nullable: true }
 *               phone: { type: string, nullable: true }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *   delete:
 *     tags: [Master Data]
 *     summary: Delete provider branch
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 * /pricing-settings:
 *   get:
 *     tags: [Master Data]
 *     summary: List pricing settings
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Paginated'
 *   post:
 *     tags: [Master Data]
 *     summary: Create pricing setting
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [serviceTypeCode]
 *             properties:
 *               serviceTypeCode: { type: string }
 *               baseFare: { type: number }
 *               perKmRate: { type: number }
 *               perWorkerRate: { type: number }
 *               floorRate: { type: number }
 *               fragileMultiplier: { type: number }
 *               currency: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Created'
 * /pricing-settings/{id}:
 *   get:
 *     tags: [Master Data]
 *     summary: Get pricing setting
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *   patch:
 *     tags: [Master Data]
 *     summary: Update pricing setting
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
 *               serviceTypeCode: { type: string }
 *               baseFare: { type: number }
 *               perKmRate: { type: number }
 *               perWorkerRate: { type: number }
 *               floorRate: { type: number }
 *               fragileMultiplier: { type: number }
 *               currency: { type: string }
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *   delete:
 *     tags: [Master Data]
 *     summary: Delete pricing setting
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 * /app-settings:
 *   get:
 *     tags: [Master Data]
 *     summary: List app settings
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Paginated'
 *   post:
 *     tags: [Master Data]
 *     summary: Create app setting
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [key, value]
 *             properties:
 *               key: { type: string }
 *               value: { type: string }
 *               group: { type: string }
 *     responses:
 *       201:
 *         $ref: '#/components/responses/Created'
 * /app-settings/{id}:
 *   get:
 *     tags: [Master Data]
 *     summary: Get app setting
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *   patch:
 *     tags: [Master Data]
 *     summary: Update app setting
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
 *               key: { type: string }
 *               value: { type: string }
 *               group: { type: string }
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *   delete:
 *     tags: [Master Data]
 *     summary: Delete app setting
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 */

module.exports = {};
