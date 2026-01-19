# Visits and Budgets Feature Implementation

## Overview
This document describes the implementation of the Visits and Budgets features in the CRM frontend, following the existing design patterns and architecture.

## Features Implemented

### 1. Visits Feature (`src/features/visits/`)
- **VisitsPage**: Main page to list and manage visits
  - Filter by project
  - Filter by status
  - Table view with visit details
  - Click to view/edit visit details
  
- **CreateVisitForm**: Form to create a new visit
  - Select project
  - Add title, description, visit date
  - Add inspection notes
  - Add estimated costs (materials, labor)
  - Status selection
  
- **VisitDetailView**: View and edit visit details
  - Edit visit information
  - View visit status
  - **Integrated Budget Management**: Shows budget for the visit
  - Create budget button if no budget exists

### 2. Budgets Feature (`src/features/budgets/`)
- **BudgetView**: Main budget display component
  - Shows budget status and total amount
  - Displays all budget items grouped by section
  - Accept budget button (when status is `pending_approval`)
  - Shows acceptance information when accepted
  
- **BudgetItemsList**: Lists all budget items
  - Groups items by section name
  - Table view with description, unit, quantity, price, subtotal
  - Edit/Delete buttons for draft budgets
  - Shows catalog item reference if item came from catalog
  
- **AddBudgetItemForm**: Form to add new budget items
  - Option to use catalog item (auto-fills name, unit, price)
  - Or add custom item manually
  - Section name (optional)
  - Description, unit, quantity, unit price
  - Auto-calculates subtotal
  
- **EditBudgetItemForm**: Form to edit existing budget items
  - Edit all item fields
  - Auto-recalculates subtotal

### 3. API Client Updates (`src/infrastructure/api/api.client.ts`)
- Added Visit types and interfaces
- Added Budget types and interfaces
- Added CatalogItem types and interfaces
- Added all API methods:
  - `getVisits()`, `getVisit()`, `createVisit()`, `updateVisit()`, `changeVisitStatus()`
  - `getBudgetByVisit()`, `getBudget()`, `createBudget()`, `updateBudget()`
  - `addBudgetItem()`, `updateBudgetItem()`, `deleteBudgetItem()`
  - `acceptBudget()`, `rejectBudget()`
  - `getCatalogItems()`
- Added public methods: `putPublic()`, `patchPublic()`, `deletePublic()`

### 4. Routes and Navigation
- Added `/visits` route in `App.tsx`
- Added "Visits" menu item in Sidebar

## Workflow

### Visit Creation Workflow
1. User navigates to Visits page
2. Clicks "Create Visit"
3. Selects a project
4. Fills in visit details (title, description, date, notes)
5. Adds estimated costs (optional)
6. Can add photos/videos (max 10 total)
7. Saves visit

### Budget Creation Workflow
1. User opens a visit detail view
2. Clicks "Create Budget" button
3. Budget is created in DRAFT status
4. User adds budget items:
   - **Option A**: Select from catalog
     - Choose catalog item
     - Auto-fills name, unit, base price
     - Can customize price/quantity
   - **Option B**: Add custom item
     - Enter description, unit, quantity, price manually
5. Items are grouped by section (e.g., "PROVISIONALS", "DEMO", "ELECTRICAL")
6. Total is automatically calculated

### Budget Acceptance Workflow
1. Budget status changes to `PENDING_APPROVAL` (manually or automatically)
2. User clicks "Accept Budget" button
3. **Critical**: Project status automatically changes to `APPROVED`
4. Budget status changes to `ACCEPTED`
5. System tracks who accepted and when

## Design Patterns Followed

### ✅ Consistent with Existing Code
- Same component structure as Projects feature
- Uses same Table component with `key` and `label` props
- Uses same FormField, Combobox, Button components
- Same styling with CSS variables
- Same error handling patterns
- Same loading states

### ✅ Architecture
- Feature-based folder structure
- Separation of concerns (pages, components)
- API client abstraction
- Type safety with TypeScript
- Proper error handling

### ✅ User Experience
- Right sidebar for forms (consistent with Projects)
- Table view for lists
- Filtering capabilities
- Status badges with colors
- Clear workflow progression

## Key Features

### Visit Media Validation
- Maximum 10 images allowed
- Maximum 10 attachments allowed
- Maximum 10 total media (images + attachments)
- Validation happens in both frontend (schema) and backend (service)

### Budget Hybrid Approach
- **Catalog Items**: Reusable products/services
  - Fast budget creation
  - Standard pricing
  - Can customize price per project
- **Custom Items**: Project-specific work
  - Flexible for unique requirements
  - No need to clutter catalog

### Budget Acceptance Impact
- When budget is accepted:
  - Budget status → `ACCEPTED`
  - Project status → `APPROVED` (automatic)
  - Tracks acceptance date and user
  - Project moves forward in workflow

## Files Created

### Visits Feature
- `src/features/visits/index.ts`
- `src/features/visits/pages/VisitsPage.tsx`
- `src/features/visits/components/CreateVisitForm.tsx`
- `src/features/visits/components/VisitDetailView.tsx`

### Budgets Feature
- `src/features/budgets/index.ts`
- `src/features/budgets/components/BudgetView.tsx`
- `src/features/budgets/components/BudgetItemsList.tsx`
- `src/features/budgets/components/AddBudgetItemForm.tsx`
- `src/features/budgets/components/EditBudgetItemForm.tsx`

### API Updates
- Updated `src/infrastructure/api/api.client.ts` with Visit, Budget, and CatalogItem types

### Routes & Navigation
- Updated `src/App.tsx` with visits route
- Updated `src/shared/components/organisms/Sidebar/Sidebar.tsx` with visits menu item

## Testing Checklist

- [ ] Create a visit for a project
- [ ] View visit details
- [ ] Edit visit information
- [ ] Create budget for a visit
- [ ] Add budget items from catalog
- [ ] Add custom budget items
- [ ] Edit budget items
- [ ] Delete budget items
- [ ] Accept budget (verify project status changes)
- [ ] Filter visits by project
- [ ] Filter visits by status
- [ ] Verify media validation (max 10)

## Next Steps

1. Test the complete workflow end-to-end
2. Add file upload functionality for visit images/videos
3. Add budget status change workflow (draft → pending_approval)
4. Add notifications when budget is accepted
5. Add budget printing/export functionality
