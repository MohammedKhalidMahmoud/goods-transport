# Order Status Matrix

## Platform: Goods Transfer — Enterprise Logistics Platform

---

## Order Statuses

| Status | Code | Description |
|---|---|---|
| Draft | `draft` | Order created but not yet submitted |
| Submitted | `submitted` | Order submitted for processing |
| Pending Approval | `pending_approval` | Awaiting company approval (company orders only) |
| Approved | `approved` | Approved by line manager / company admin |
| Rejected | `rejected` | Rejected by approver |
| Published for Offers | `published_for_offers` | Available for providers to submit offers |
| Offer Received | `offer_received` | At least one offer submitted |
| Offer Accepted | `offer_accepted` | An offer has been accepted |
| Assigned | `assigned` | Driver/team assigned to the order |
| En Route to Pickup | `en_route_to_pickup` | Driver heading to pickup location |
| Arrived at Pickup | `arrived_pickup` | Driver arrived at pickup point |
| Picked Up | `picked_up` | Goods loaded and picked up |
| In Transit | `in_transit` | Goods being transported |
| Arrived at Dropoff | `arrived_dropoff` | Driver arrived at delivery location |
| Delivered | `delivered` | Goods delivered, pending confirmation |
| Completed | `completed` | Order fully completed and confirmed |
| Canceled | `canceled` | Order canceled |

---

## Status Transition Rules

| From | To | Actor | Validation |
|---|---|---|---|
| — | `draft` | employee, individual_customer, company_admin | Initial creation |
| `draft` | `submitted` | employee, individual_customer, company_admin | Required fields validated |
| `submitted` | `pending_approval` | system | Auto-triggered for company orders with approval rules |
| `submitted` | `published_for_offers` | system, ops_admin | Auto-triggered for individual orders or approved company orders |
| `pending_approval` | `approved` | line_manager, company_admin | Approval rule satisfied |
| `pending_approval` | `rejected` | line_manager, company_admin | Rejection reason required |
| `approved` | `published_for_offers` | system, ops_admin | Auto-publish after approval |
| `published_for_offers` | `offer_received` | system | Auto-triggered when first offer arrives |
| `offer_received` | `offer_received` | system | Additional offers (stays in same status) |
| `offer_received` | `offer_accepted` | company_admin, employee, individual_customer, ops_admin | One offer selected |
| `offer_accepted` | `assigned` | provider_admin, ops_admin, system | Driver/team assigned |
| `assigned` | `en_route_to_pickup` | delivery_driver | Driver starts heading to pickup |
| `en_route_to_pickup` | `arrived_pickup` | delivery_driver | GPS proximity or manual check-in |
| `arrived_pickup` | `picked_up` | delivery_driver | Goods loaded confirmation |
| `picked_up` | `in_transit` | delivery_driver | Departure confirmed |
| `in_transit` | `arrived_dropoff` | delivery_driver | GPS proximity or manual check-in |
| `arrived_dropoff` | `delivered` | delivery_driver | Delivery proof submitted |
| `delivered` | `completed` | company_admin, individual_customer, system | Customer confirmation or auto-complete timer |

### Cancellation Transitions

| From | To | Actor | Validation |
|---|---|---|---|
| `draft` | `canceled` | employee, individual_customer, company_admin | No restrictions |
| `submitted` | `canceled` | employee, individual_customer, company_admin, ops_admin | No restrictions |
| `pending_approval` | `canceled` | employee, company_admin, ops_admin | Before approval decision |
| `approved` | `canceled` | company_admin, ops_admin | Before publishing |
| `published_for_offers` | `canceled` | company_admin, individual_customer, ops_admin | All pending offers auto-rejected |
| `offer_received` | `canceled` | company_admin, individual_customer, ops_admin | All pending offers auto-rejected |
| `offer_accepted` | `canceled` | ops_admin | Cancellation fee may apply |
| `assigned` | `canceled` | ops_admin | Requires special approval, cancellation fee |

> Orders in `en_route_to_pickup` and beyond cannot be canceled through normal flow. They require ops_admin escalation and manual handling.

---

## Offer Statuses

| Status | Code | Description |
|---|---|---|
| Pending | `pending` | Offer submitted, awaiting decision |
| Accepted | `accepted` | Offer accepted by requester |
| Rejected | `rejected` | Offer rejected by requester |
| Expired | `expired` | Offer validity period passed |
| Withdrawn | `withdrawn` | Provider withdrew the offer |

### Offer Transitions

| From | To | Actor | Validation |
|---|---|---|---|
| — | `pending` | provider_admin, provider_operator | Order must be in `published_for_offers` or `offer_received` |
| `pending` | `accepted` | company_admin, employee, individual_customer, ops_admin | Only one offer accepted per order |
| `pending` | `rejected` | company_admin, employee, individual_customer, ops_admin | Optional rejection reason |
| `pending` | `expired` | system | Auto-expire based on validity period |
| `pending` | `withdrawn` | provider_admin, provider_operator | Before acceptance |

---

## Approval Statuses

| Status | Code | Description |
|---|---|---|
| Pending | `pending` | Awaiting approval decision |
| Approved | `approved` | Request approved |
| Rejected | `rejected` | Request rejected |

### Approval Transitions

| From | To | Actor | Validation |
|---|---|---|---|
| — | `pending` | system | Auto-created when order needs approval |
| `pending` | `approved` | line_manager, company_admin | Matches approval rule hierarchy |
| `pending` | `rejected` | line_manager, company_admin | Rejection reason required |

---

## Invoice Statuses

| Status | Code | Description |
|---|---|---|
| Draft | `draft` | Invoice created, not yet issued |
| Issued | `issued` | Invoice sent to customer |
| Partially Paid | `partially_paid` | Partial payment received |
| Paid | `paid` | Fully paid |
| Canceled | `canceled` | Invoice canceled/voided |
| Overdue | `overdue` | Payment past due date |

### Invoice Transitions

| From | To | Actor | Validation |
|---|---|---|---|
| — | `draft` | system, finance_admin | Auto-created on order completion |
| `draft` | `issued` | finance_admin | All line items verified |
| `issued` | `partially_paid` | system, finance_admin | Partial payment recorded |
| `issued` | `paid` | system, finance_admin | Full payment recorded |
| `partially_paid` | `paid` | system, finance_admin | Remaining balance paid |
| `issued` | `overdue` | system | Auto-triggered on due date |
| `overdue` | `paid` | system, finance_admin | Late payment received |
| `draft` | `canceled` | finance_admin | Before issuance |
| `issued` | `canceled` | finance_admin, super_admin | Credit note may be required |

---

## Ticket Statuses

| Status | Code | Description |
|---|---|---|
| Open | `open` | Ticket created |
| In Progress | `in_progress` | Support working on it |
| Resolved | `resolved` | Issue resolved |
| Closed | `closed` | Ticket closed |

### Ticket Transitions

| From | To | Actor | Validation |
|---|---|---|---|
| — | `open` | Any authenticated user | Ticket created |
| `open` | `in_progress` | support_admin | Agent picks up ticket |
| `in_progress` | `resolved` | support_admin | Resolution provided |
| `resolved` | `closed` | system, support_admin, ticket creator | Confirmed or auto-close timer |
| `resolved` | `open` | ticket creator | Reopened if not satisfied |
| `open` | `closed` | support_admin, super_admin | Closed without resolution (spam, duplicate) |

---

## Status Modeling Notes

1. All status changes must be recorded in `order_status_history` with actor, timestamp, and optional notes.
2. Status transitions are enforced at the service layer, not the database layer.
3. Invalid transitions return 422 Unprocessable Entity with descriptive message.
4. Bulk status updates are not supported — each order transitions individually.
5. System-triggered transitions (e.g., auto-expire) are handled by scheduled jobs.
