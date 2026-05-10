/**
 * @swagger
 * /health:
 *   get:
 *     tags: [System]
 *     summary: API health check
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */

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
 *         description: Paginated list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 * /service-types:
 *   get:
 *     tags: [Master Data]
 *     summary: List service types
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *     responses:
 *       200:
 *         description: OK
 * /vehicle-types:
 *   get:
 *     tags: [Master Data]
 *     summary: List vehicle types
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 * /cities:
 *   get:
 *     tags: [Master Data]
 *     summary: List cities
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 * /zones:
 *   get:
 *     tags: [Master Data]
 *     summary: List zones
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 * /areas:
 *   get:
 *     tags: [Master Data]
 *     summary: List areas
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 * /branches:
 *   get:
 *     tags: [Master Data]
 *     summary: List branches (provider + master data rules)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 * /pricing-settings:
 *   get:
 *     tags: [Master Data]
 *     summary: List pricing settings
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 * /app-settings:
 *   get:
 *     tags: [Master Data]
 *     summary: List app settings
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 */

/**
 * @swagger
 * /orders:
 *   get:
 *     tags: [Orders]
 *     summary: List orders (RBAC + tenant scoped)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/StatusQuery'
 *       - $ref: '#/components/parameters/DateFromQuery'
 *       - $ref: '#/components/parameters/DateToQuery'
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Orders]
 *     summary: Create order
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order by id
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags: [Orders]
 *     summary: Update order
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Orders]
 *     summary: Soft-delete order
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /orders/{id}/timeline:
 *   get:
 *     tags: [Orders]
 *     summary: Order status history
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /orders/{id}/attachments:
 *   get:
 *     tags: [Orders]
 *     summary: List attachment metadata
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Orders]
 *     summary: Register attachment metadata
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       201:
 *         description: Created
 * /orders/{id}/submit:
 *   post:
 *     tags: [Orders]
 *     summary: Submit order (approval vs publish)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /orders/{id}/publish:
 *   post:
 *     tags: [Orders]
 *     summary: Publish for offers
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /orders/{id}/cancel:
 *   post:
 *     tags: [Orders]
 *     summary: Cancel order
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /orders/{id}/assign:
 *   post:
 *     tags: [Orders]
 *     summary: Assign provider/driver
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /orders/{id}/start:
 *   post:
 *     tags: [Orders]
 *     summary: Start execution
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /orders/{id}/arrive-pickup:
 *   post:
 *     tags: [Orders]
 *     summary: Arrived at pickup
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /orders/{id}/pickup:
 *   post:
 *     tags: [Orders]
 *     summary: Picked up
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /orders/{id}/arrive-dropoff:
 *   post:
 *     tags: [Orders]
 *     summary: Arrived at dropoff
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /orders/{id}/deliver:
 *   post:
 *     tags: [Orders]
 *     summary: Delivered
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /orders/{id}/complete:
 *   post:
 *     tags: [Orders]
 *     summary: Complete order
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 */

/**
 * @swagger
 * /offers:
 *   get:
 *     tags: [Offers]
 *     summary: List offers
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Offers]
 *     summary: Create offer
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /offers/{id}:
 *   get:
 *     tags: [Offers]
 *     summary: Get offer
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags: [Offers]
 *     summary: Update offer
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Offers]
 *     summary: Delete offer
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /offers/{id}/accept:
 *   post:
 *     tags: [Offers]
 *     summary: Accept offer
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /offers/{id}/reject:
 *   post:
 *     tags: [Offers]
 *     summary: Reject offer
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /offers/{id}/withdraw:
 *   post:
 *     tags: [Offers]
 *     summary: Withdraw offer
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /assignments:
 *   get:
 *     tags: [Assignments]
 *     summary: List assignments
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Assignments]
 *     summary: Create assignment
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /assignments/{id}:
 *   get:
 *     tags: [Assignments]
 *     summary: Get assignment
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags: [Assignments]
 *     summary: Update assignment
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Assignments]
 *     summary: Delete assignment
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /order-items:
 *   get:
 *     tags: [Orders]
 *     summary: List order items
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Orders]
 *     summary: Create order item
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /order-items/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order item
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags: [Orders]
 *     summary: Update order item
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Orders]
 *     summary: Delete order item
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 */

/**
 * @swagger
 * /tracking/{orderId}:
 *   get:
 *     tags: [Tracking]
 *     summary: Latest tracking for order
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/OrderIdPath'
 *     responses:
 *       200:
 *         description: OK
 * /tracking/{orderId}/history:
 *   get:
 *     tags: [Tracking]
 *     summary: Tracking event history
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/OrderIdPath'
 *     responses:
 *       200:
 *         description: OK
 * /tracking/{orderId}/events:
 *   post:
 *     tags: [Tracking]
 *     summary: Append tracking event
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/OrderIdPath'
 *     responses:
 *       201:
 *         description: Created
 * /tracking/{orderId}/location:
 *   post:
 *     tags: [Tracking]
 *     summary: Post GPS location
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/OrderIdPath'
 *     responses:
 *       201:
 *         description: Created
 * /delivery-proofs/{orderId}:
 *   get:
 *     tags: [Delivery]
 *     summary: List delivery proofs for order
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/OrderIdPath'
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Delivery]
 *     summary: Create delivery proof
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/OrderIdPath'
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @swagger
 * /companies:
 *   get:
 *     tags: [Companies]
 *     summary: List companies (tenant scoped)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Companies]
 *     summary: Create company
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /companies/{id}:
 *   get:
 *     tags: [Companies]
 *     summary: Get company
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags: [Companies]
 *     summary: Update company
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Companies]
 *     summary: Soft-delete company
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /company-branches:
 *   get:
 *     tags: [Companies]
 *     summary: List branches
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Companies]
 *     summary: Create branch
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /company-branches/{id}:
 *   get:
 *     tags: [Companies]
 *     summary: Get branch
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags: [Companies]
 *     summary: Update branch
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Companies]
 *     summary: Delete branch
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /company-users:
 *   get:
 *     tags: [Companies]
 *     summary: List company users
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Companies]
 *     summary: Link user to company
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /company-users/{id}:
 *   get:
 *     tags: [Companies]
 *     summary: Get company user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags: [Companies]
 *     summary: Update company user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Companies]
 *     summary: Remove company user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /company-billing-profiles:
 *   get:
 *     tags: [Companies]
 *     summary: List billing profiles
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Companies]
 *     summary: Create billing profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /company-billing-profiles/{id}:
 *   patch:
 *     tags: [Companies]
 *     summary: Update billing profile
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /approval-rules:
 *   get:
 *     tags: [Approvals]
 *     summary: List approval rules
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Approvals]
 *     summary: Create approval rule
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /approval-rules/{id}:
 *   patch:
 *     tags: [Approvals]
 *     summary: Update approval rule
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Approvals]
 *     summary: Delete approval rule
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /approvals:
 *   get:
 *     tags: [Approvals]
 *     summary: Pending approval orders queue
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 * /approvals/{id}:
 *   get:
 *     tags: [Approvals]
 *     summary: Order pending approval (id = orderId)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /approvals/{id}/approve:
 *   post:
 *     tags: [Approvals]
 *     summary: Approve order
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /approvals/{id}/reject:
 *   post:
 *     tags: [Approvals]
 *     summary: Reject order
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 */

/**
 * @swagger
 * /providers:
 *   get:
 *     tags: [Providers]
 *     summary: List providers
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Providers]
 *     summary: Create provider
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /providers/{id}:
 *   get:
 *     tags: [Providers]
 *     summary: Get provider
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags: [Providers]
 *     summary: Update provider
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Providers]
 *     summary: Soft-delete provider
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /providers/{id}/toggle-availability:
 *   post:
 *     tags: [Providers]
 *     summary: Toggle accepting orders
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /provider-users:
 *   get:
 *     tags: [Providers]
 *     summary: List provider users
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Providers]
 *     summary: Link user to provider
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /provider-users/{id}:
 *   get:
 *     tags: [Providers]
 *     summary: Get provider user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags: [Providers]
 *     summary: Update provider user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Providers]
 *     summary: Delete provider user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /provider-documents:
 *   get:
 *     tags: [Providers]
 *     summary: List provider documents
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Providers]
 *     summary: Create document record
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /provider-documents/{id}:
 *   get:
 *     tags: [Providers]
 *     summary: Get provider document by id
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags: [Providers]
 *     summary: Update document
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Providers]
 *     summary: Delete document
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /provider-service-areas:
 *   get:
 *     tags: [Providers]
 *     summary: List service areas
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Providers]
 *     summary: Add service area
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /provider-service-areas/{id}:
 *   patch:
 *     tags: [Providers]
 *     summary: Update service area
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Providers]
 *     summary: Remove service area
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /provider-availability:
 *   get:
 *     tags: [Providers]
 *     summary: List availability rows
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Providers]
 *     summary: Create availability row
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /provider-drivers:
 *   get:
 *     tags: [Providers]
 *     summary: List drivers
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Providers]
 *     summary: Create driver
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /provider-drivers/{id}:
 *   get:
 *     tags: [Providers]
 *     summary: Get driver
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags: [Providers]
 *     summary: Update driver
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Providers]
 *     summary: Delete driver
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /provider-workers:
 *   get:
 *     tags: [Providers]
 *     summary: List workers
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Providers]
 *     summary: Create worker
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /provider-workers/{id}:
 *   get:
 *     tags: [Providers]
 *     summary: Get worker
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags: [Providers]
 *     summary: Update worker
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Providers]
 *     summary: Delete worker
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /provider-vehicles:
 *   get:
 *     tags: [Providers]
 *     summary: List vehicles
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Providers]
 *     summary: Create vehicle
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /provider-vehicles/{id}:
 *   get:
 *     tags: [Providers]
 *     summary: Get vehicle
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags: [Providers]
 *     summary: Update vehicle
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Providers]
 *     summary: Delete vehicle
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /provider-wallet:
 *   get:
 *     tags: [Providers]
 *     summary: Provider wallet
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 * /provider-earnings:
 *   get:
 *     tags: [Providers]
 *     summary: Earnings summary
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 * /provider-settlements:
 *   get:
 *     tags: [Providers]
 *     summary: List settlements
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 */

/**
 * @swagger
 * /invoices:
 *   get:
 *     tags: [Finance]
 *     summary: List invoices
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Finance]
 *     summary: Create invoice
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /invoices/{id}:
 *   get:
 *     tags: [Finance]
 *     summary: Get invoice
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags: [Finance]
 *     summary: Update invoice
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Finance]
 *     summary: Delete invoice
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /invoices/{id}/issue:
 *   post:
 *     tags: [Finance]
 *     summary: Issue invoice
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /invoices/{id}/mark-paid:
 *   post:
 *     tags: [Finance]
 *     summary: Mark invoice paid
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /payments:
 *   get:
 *     tags: [Finance]
 *     summary: List payments
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Finance]
 *     summary: Create payment
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /payments/{id}:
 *   get:
 *     tags: [Finance]
 *     summary: Get payment
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags: [Finance]
 *     summary: Update payment
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /commissions:
 *   get:
 *     tags: [Finance]
 *     summary: List commissions
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 * /commissions/{id}:
 *   get:
 *     tags: [Finance]
 *     summary: Get commission by id
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /settlements:
 *   get:
 *     tags: [Finance]
 *     summary: List settlements
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Finance]
 *     summary: Create settlement
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /settlements/{id}:
 *   get:
 *     tags: [Finance]
 *     summary: Get settlement by id
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /earnings/reports:
 *   get:
 *     tags: [Finance]
 *     summary: Earnings reports
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 * /earnings/reports/{id}:
 *   get:
 *     tags: [Finance]
 *     summary: Get earnings report by id
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 */

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List users
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Users]
 *     summary: Create user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags: [Users]
 *     summary: Update user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Users]
 *     summary: Soft-delete user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /roles:
 *   get:
 *     tags: [Users]
 *     summary: List roles
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Users]
 *     summary: Create role (super admin)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /roles/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get role
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags: [Users]
 *     summary: Update role
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Users]
 *     summary: Delete role
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /permissions:
 *   get:
 *     tags: [Users]
 *     summary: List permissions
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Users]
 *     summary: Create permission
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /permissions/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get permission
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags: [Users]
 *     summary: Update permission
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Users]
 *     summary: Delete permission
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /roles/{id}/permissions:
 *   post:
 *     tags: [Users]
 *     summary: Attach permissions to role
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /profiles/me:
 *   get:
 *     tags: [Users]
 *     summary: Current user profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags: [Users]
 *     summary: Update own profile
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 * /customers/me:
 *   get:
 *     tags: [Customers]
 *     summary: Individual customer record
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags: [Customers]
 *     summary: Update customer preferences
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 * /customer-addresses:
 *   get:
 *     tags: [Customers]
 *     summary: List addresses
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Customers]
 *     summary: Create address
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /customer-addresses/{id}:
 *   get:
 *     tags: [Customers]
 *     summary: Get address
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags: [Customers]
 *     summary: Update address
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Customers]
 *     summary: Delete address
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /reviews:
 *   get:
 *     tags: [Customers]
 *     summary: List my reviews
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Customers]
 *     summary: Submit review
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @swagger
 * /tickets:
 *   get:
 *     tags: [Support]
 *     summary: List tickets (tenant + RBAC scoped)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Support]
 *     summary: Create ticket
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /tickets/{id}:
 *   get:
 *     tags: [Support]
 *     summary: Get ticket
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   patch:
 *     tags: [Support]
 *     summary: Update ticket
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Support]
 *     summary: Delete ticket (super admin)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /tickets/{id}/comments:
 *   get:
 *     tags: [Support]
 *     summary: List comments
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Support]
 *     summary: Add comment
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       201:
 *         description: Created
 * /tickets/{id}/assign:
 *   post:
 *     tags: [Support]
 *     summary: Assign ticket
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /tickets/{id}/resolve:
 *   post:
 *     tags: [Support]
 *     summary: Resolve ticket
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /tickets/{id}/close:
 *   post:
 *     tags: [Support]
 *     summary: Close ticket
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /issue-types:
 *   get:
 *     tags: [Support]
 *     summary: List issue types
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List my notifications
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *   post:
 *     tags: [Notifications]
 *     summary: Create notification (internal)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /notifications/{id}:
 *   get:
 *     tags: [Notifications]
 *     summary: Get notification by id
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /notifications/{id}/read:
 *   post:
 *     tags: [Notifications]
 *     summary: Mark read
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /notifications/read-all:
 *   post:
 *     tags: [Notifications]
 *     summary: Mark all read
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 * /uploads:
 *   post:
 *     tags: [Uploads]
 *     summary: Upload file (multipart)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Created
 * /uploads/{id}:
 *   get:
 *     tags: [Uploads]
 *     summary: File metadata
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 *   delete:
 *     tags: [Uploads]
 *     summary: Delete file
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 * /dashboard/internal/overview:
 *   get:
 *     tags: [Dashboard]
 *     summary: Internal overview
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 * /dashboard/internal/revenue-summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Internal revenue
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 * /dashboard/internal/orders-summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Internal orders
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 * /dashboard/company/overview:
 *   get:
 *     tags: [Dashboard]
 *     summary: Company overview
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 * /dashboard/company/orders-summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Company orders
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 * /dashboard/provider/overview:
 *   get:
 *     tags: [Dashboard]
 *     summary: Provider overview
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 * /dashboard/provider/performance:
 *   get:
 *     tags: [Dashboard]
 *     summary: Provider performance
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 * /dashboard/provider/earnings-summary:
 *   get:
 *     tags: [Dashboard]
 *     summary: Provider earnings
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 * /audit-logs:
 *   get:
 *     tags: [Audit]
 *     summary: Audit log entries
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 * /delivery-proofs/{id}:
 *   patch:
 *     tags: [Delivery]
 *     summary: Update delivery proof by id
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPath'
 *     responses:
 *       200:
 *         description: OK
 */

module.exports = {};
