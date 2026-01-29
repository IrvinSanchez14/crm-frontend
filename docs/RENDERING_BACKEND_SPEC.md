# Rendering Backend Specification

## Overview

This document contains the backend implementation details for the Rendering feature in the canas-construction API.

---

## Database Schema

### 1. `renderings` table

```sql
CREATE TABLE renderings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected')),

    -- Relationships
    visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,
    budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Metadata
    expiration_date DATE,
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_renderings_company_id ON renderings(company_id);
CREATE INDEX idx_renderings_visit_id ON renderings(visit_id);
CREATE INDEX idx_renderings_budget_id ON renderings(budget_id);
CREATE INDEX idx_renderings_status ON renderings(status);
```

### 2. `rendering_images` table

```sql
CREATE TABLE rendering_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rendering_id UUID NOT NULL REFERENCES renderings(id) ON DELETE CASCADE,

    image_url TEXT NOT NULL,
    title VARCHAR(255),
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_full_page BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_rendering_images_rendering_id ON rendering_images(rendering_id);
CREATE INDEX idx_rendering_images_display_order ON rendering_images(rendering_id, display_order);
```

### 3. `rendering_items` table

```sql
CREATE TABLE rendering_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rendering_id UUID NOT NULL REFERENCES renderings(id) ON DELETE CASCADE,
    budget_item_id UUID REFERENCES budget_items(id) ON DELETE SET NULL,

    -- Item Details
    category VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,

    -- Material sample (for materials page)
    is_material_sample BOOLEAN DEFAULT false,
    material_image_url TEXT,

    -- Specifications (flexible key-value)
    specifications JSONB DEFAULT '{}',

    -- Pricing
    subtotal DECIMAL(12,2),
    tax DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2),

    -- Product image (for details page)
    product_image_url TEXT,

    -- Display options
    display_order INTEGER DEFAULT 0,
    show_in_materials_page BOOLEAN DEFAULT false,
    show_in_details_page BOOLEAN DEFAULT true,

    -- Notes
    notes TEXT,
    disclaimer TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_rendering_items_rendering_id ON rendering_items(rendering_id);
CREATE INDEX idx_rendering_items_budget_item_id ON rendering_items(budget_item_id);
CREATE INDEX idx_rendering_items_display_order ON rendering_items(rendering_id, display_order);
```

---

## Pydantic Models

### File: `app/models/rendering.py`

```python
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from uuid import UUID
from datetime import datetime, date
from enum import Enum


class RenderingStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    APPROVED = "approved"
    REJECTED = "rejected"


# ============ Rendering Image Models ============

class RenderingImageBase(BaseModel):
    image_url: str
    title: Optional[str] = None
    description: Optional[str] = None
    display_order: int = 0
    is_full_page: bool = True


class RenderingImageCreate(RenderingImageBase):
    pass


class RenderingImageUpdate(BaseModel):
    image_url: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    display_order: Optional[int] = None
    is_full_page: Optional[bool] = None


class RenderingImage(RenderingImageBase):
    id: UUID
    rendering_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# ============ Rendering Item Models ============

class RenderingItemBase(BaseModel):
    category: str
    name: str
    is_material_sample: bool = False
    material_image_url: Optional[str] = None
    specifications: Optional[Dict[str, str]] = None
    subtotal: Optional[str] = None
    tax: Optional[str] = None
    total: Optional[str] = None
    product_image_url: Optional[str] = None
    display_order: int = 0
    show_in_materials_page: bool = False
    show_in_details_page: bool = True
    notes: Optional[str] = None
    disclaimer: Optional[str] = None


class RenderingItemCreate(RenderingItemBase):
    budget_item_id: Optional[UUID] = None


class RenderingItemUpdate(BaseModel):
    budget_item_id: Optional[UUID] = None
    category: Optional[str] = None
    name: Optional[str] = None
    is_material_sample: Optional[bool] = None
    material_image_url: Optional[str] = None
    specifications: Optional[Dict[str, str]] = None
    subtotal: Optional[str] = None
    tax: Optional[str] = None
    total: Optional[str] = None
    product_image_url: Optional[str] = None
    display_order: Optional[int] = None
    show_in_materials_page: Optional[bool] = None
    show_in_details_page: Optional[bool] = None
    notes: Optional[str] = None
    disclaimer: Optional[str] = None


class RenderingItem(RenderingItemBase):
    id: UUID
    rendering_id: UUID
    budget_item_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ Rendering Models ============

class RenderingBase(BaseModel):
    title: str
    description: Optional[str] = None
    visit_id: Optional[UUID] = None
    budget_id: Optional[UUID] = None
    expiration_date: Optional[date] = None
    notes: Optional[str] = None


class RenderingCreate(RenderingBase):
    pass


class RenderingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[RenderingStatus] = None
    visit_id: Optional[UUID] = None
    budget_id: Optional[UUID] = None
    expiration_date: Optional[date] = None
    notes: Optional[str] = None


class Rendering(RenderingBase):
    id: UUID
    status: RenderingStatus
    company_id: UUID
    created_by_user_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RenderingDetail(Rendering):
    images: List[RenderingImage] = []
    items: List[RenderingItem] = []
    created_by_name: Optional[str] = None
    # Optional related entities
    visit: Optional[Any] = None  # VisitDetail
    budget: Optional[Any] = None  # BudgetDetail


# ============ Special Request Models ============

class ReorderImagesRequest(BaseModel):
    image_ids: List[UUID]


class ImportBudgetItemsRequest(BaseModel):
    budget_item_ids: List[UUID]
```

---

## API Endpoints

### File: `app/routers/renderings.py`

```python
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from typing import List, Optional
from uuid import UUID

from app.models.rendering import (
    RenderingCreate, RenderingUpdate, RenderingDetail,
    RenderingImageCreate, RenderingImageUpdate, RenderingImage,
    RenderingItemCreate, RenderingItemUpdate, RenderingItem,
    RenderingStatus, ReorderImagesRequest, ImportBudgetItemsRequest
)
from app.services.rendering_service import RenderingService
from app.services.pdf_service import PDFService

router = APIRouter(prefix="/renderings", tags=["renderings"])


# ============ Rendering CRUD ============

@router.get("", response_model=List[RenderingDetail])
async def get_renderings(
    company_id: UUID = Query(...),
    visit_id: Optional[UUID] = Query(None),
    budget_id: Optional[UUID] = Query(None),
    status: Optional[RenderingStatus] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    service: RenderingService = Depends()
):
    """Get all renderings for a company with optional filters."""
    return await service.get_renderings(
        company_id=company_id,
        visit_id=visit_id,
        budget_id=budget_id,
        status=status,
        skip=skip,
        limit=limit
    )


@router.get("/{rendering_id}", response_model=RenderingDetail)
async def get_rendering(
    rendering_id: UUID,
    company_id: UUID = Query(...),
    service: RenderingService = Depends()
):
    """Get a specific rendering by ID."""
    rendering = await service.get_rendering(rendering_id, company_id)
    if not rendering:
        raise HTTPException(status_code=404, detail="Rendering not found")
    return rendering


@router.get("/visit/{visit_id}", response_model=RenderingDetail)
async def get_rendering_by_visit(
    visit_id: UUID,
    company_id: UUID = Query(...),
    service: RenderingService = Depends()
):
    """Get rendering by visit ID."""
    rendering = await service.get_rendering_by_visit(visit_id, company_id)
    if not rendering:
        raise HTTPException(status_code=404, detail="Rendering not found for this visit")
    return rendering


@router.get("/budget/{budget_id}", response_model=RenderingDetail)
async def get_rendering_by_budget(
    budget_id: UUID,
    company_id: UUID = Query(...),
    service: RenderingService = Depends()
):
    """Get rendering by budget ID."""
    rendering = await service.get_rendering_by_budget(budget_id, company_id)
    if not rendering:
        raise HTTPException(status_code=404, detail="Rendering not found for this budget")
    return rendering


@router.post("/", response_model=RenderingDetail)
async def create_rendering(
    rendering_data: RenderingCreate,
    company_id: UUID = Query(...),
    created_by_user_id: Optional[UUID] = Query(None),
    service: RenderingService = Depends()
):
    """Create a new rendering."""
    return await service.create_rendering(
        rendering_data=rendering_data,
        company_id=company_id,
        created_by_user_id=created_by_user_id
    )


@router.put("/{rendering_id}", response_model=RenderingDetail)
async def update_rendering(
    rendering_id: UUID,
    rendering_data: RenderingUpdate,
    company_id: UUID = Query(...),
    service: RenderingService = Depends()
):
    """Update a rendering."""
    rendering = await service.update_rendering(rendering_id, rendering_data, company_id)
    if not rendering:
        raise HTTPException(status_code=404, detail="Rendering not found")
    return rendering


@router.delete("/{rendering_id}")
async def delete_rendering(
    rendering_id: UUID,
    company_id: UUID = Query(...),
    service: RenderingService = Depends()
):
    """Delete a rendering."""
    success = await service.delete_rendering(rendering_id, company_id)
    if not success:
        raise HTTPException(status_code=404, detail="Rendering not found")
    return {"message": "Rendering deleted successfully"}


# ============ Rendering Images ============

@router.post("/{rendering_id}/images", response_model=RenderingImage)
async def add_rendering_image(
    rendering_id: UUID,
    image_data: RenderingImageCreate,
    company_id: UUID = Query(...),
    service: RenderingService = Depends()
):
    """Add an image to a rendering."""
    return await service.add_image(rendering_id, image_data, company_id)


@router.put("/{rendering_id}/images/{image_id}", response_model=RenderingImage)
async def update_rendering_image(
    rendering_id: UUID,
    image_id: UUID,
    image_data: RenderingImageUpdate,
    company_id: UUID = Query(...),
    service: RenderingService = Depends()
):
    """Update a rendering image."""
    image = await service.update_image(rendering_id, image_id, image_data, company_id)
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    return image


@router.delete("/{rendering_id}/images/{image_id}")
async def delete_rendering_image(
    rendering_id: UUID,
    image_id: UUID,
    company_id: UUID = Query(...),
    service: RenderingService = Depends()
):
    """Delete a rendering image."""
    success = await service.delete_image(rendering_id, image_id, company_id)
    if not success:
        raise HTTPException(status_code=404, detail="Image not found")
    return {"message": "Image deleted successfully"}


@router.post("/{rendering_id}/images/reorder", response_model=List[RenderingImage])
async def reorder_rendering_images(
    rendering_id: UUID,
    request: ReorderImagesRequest,
    company_id: UUID = Query(...),
    service: RenderingService = Depends()
):
    """Reorder images for a rendering."""
    return await service.reorder_images(rendering_id, request.image_ids, company_id)


# ============ Rendering Items ============

@router.post("/{rendering_id}/items", response_model=RenderingItem)
async def add_rendering_item(
    rendering_id: UUID,
    item_data: RenderingItemCreate,
    company_id: UUID = Query(...),
    service: RenderingService = Depends()
):
    """Add an item to a rendering."""
    return await service.add_item(rendering_id, item_data, company_id)


@router.put("/{rendering_id}/items/{item_id}", response_model=RenderingItem)
async def update_rendering_item(
    rendering_id: UUID,
    item_id: UUID,
    item_data: RenderingItemUpdate,
    company_id: UUID = Query(...),
    service: RenderingService = Depends()
):
    """Update a rendering item."""
    item = await service.update_item(rendering_id, item_id, item_data, company_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.delete("/{rendering_id}/items/{item_id}")
async def delete_rendering_item(
    rendering_id: UUID,
    item_id: UUID,
    company_id: UUID = Query(...),
    service: RenderingService = Depends()
):
    """Delete a rendering item."""
    success = await service.delete_item(rendering_id, item_id, company_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}


@router.post("/{rendering_id}/items/from-budget", response_model=List[RenderingItem])
async def import_budget_items(
    rendering_id: UUID,
    request: ImportBudgetItemsRequest,
    company_id: UUID = Query(...),
    service: RenderingService = Depends()
):
    """Import items from a budget into this rendering."""
    return await service.import_from_budget(
        rendering_id=rendering_id,
        budget_item_ids=request.budget_item_ids,
        company_id=company_id
    )


# ============ PDF Generation ============

@router.get("/{rendering_id}/pdf")
async def generate_rendering_pdf(
    rendering_id: UUID,
    company_id: UUID = Query(...),
    service: RenderingService = Depends(),
    pdf_service: PDFService = Depends()
):
    """Generate PDF for a rendering."""
    rendering = await service.get_rendering(rendering_id, company_id)
    if not rendering:
        raise HTTPException(status_code=404, detail="Rendering not found")

    pdf_bytes = await pdf_service.generate_rendering_pdf(rendering)

    filename = f"Rendering_{rendering.title.replace(' ', '_')}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
```

---

## Service Layer

### File: `app/services/rendering_service.py`

```python
from typing import List, Optional
from uuid import UUID
from datetime import datetime

from app.models.rendering import (
    RenderingCreate, RenderingUpdate, RenderingDetail,
    RenderingImageCreate, RenderingImageUpdate, RenderingImage,
    RenderingItemCreate, RenderingItemUpdate, RenderingItem,
    RenderingStatus
)
from app.database import database


class RenderingService:

    async def get_renderings(
        self,
        company_id: UUID,
        visit_id: Optional[UUID] = None,
        budget_id: Optional[UUID] = None,
        status: Optional[RenderingStatus] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[RenderingDetail]:
        """Get all renderings with filters."""
        query = """
            SELECT r.*, u.name as created_by_name
            FROM renderings r
            LEFT JOIN users u ON r.created_by_user_id = u.id
            WHERE r.company_id = :company_id
        """
        params = {"company_id": company_id}

        if visit_id:
            query += " AND r.visit_id = :visit_id"
            params["visit_id"] = visit_id
        if budget_id:
            query += " AND r.budget_id = :budget_id"
            params["budget_id"] = budget_id
        if status:
            query += " AND r.status = :status"
            params["status"] = status.value

        query += " ORDER BY r.created_at DESC OFFSET :skip LIMIT :limit"
        params["skip"] = skip
        params["limit"] = limit

        rows = await database.fetch_all(query, params)

        renderings = []
        for row in rows:
            rendering = RenderingDetail(**dict(row))
            rendering.images = await self._get_images(row["id"])
            rendering.items = await self._get_items(row["id"])
            renderings.append(rendering)

        return renderings

    async def get_rendering(
        self,
        rendering_id: UUID,
        company_id: UUID
    ) -> Optional[RenderingDetail]:
        """Get a single rendering by ID."""
        query = """
            SELECT r.*, u.name as created_by_name
            FROM renderings r
            LEFT JOIN users u ON r.created_by_user_id = u.id
            WHERE r.id = :id AND r.company_id = :company_id
        """
        row = await database.fetch_one(query, {"id": rendering_id, "company_id": company_id})

        if not row:
            return None

        rendering = RenderingDetail(**dict(row))
        rendering.images = await self._get_images(rendering_id)
        rendering.items = await self._get_items(rendering_id)

        # Optionally fetch related visit/budget
        if rendering.visit_id:
            rendering.visit = await self._get_visit(rendering.visit_id, company_id)
        if rendering.budget_id:
            rendering.budget = await self._get_budget(rendering.budget_id, company_id)

        return rendering

    async def get_rendering_by_visit(
        self,
        visit_id: UUID,
        company_id: UUID
    ) -> Optional[RenderingDetail]:
        """Get rendering by visit ID."""
        query = """
            SELECT id FROM renderings
            WHERE visit_id = :visit_id AND company_id = :company_id
            LIMIT 1
        """
        row = await database.fetch_one(query, {"visit_id": visit_id, "company_id": company_id})
        if row:
            return await self.get_rendering(row["id"], company_id)
        return None

    async def get_rendering_by_budget(
        self,
        budget_id: UUID,
        company_id: UUID
    ) -> Optional[RenderingDetail]:
        """Get rendering by budget ID."""
        query = """
            SELECT id FROM renderings
            WHERE budget_id = :budget_id AND company_id = :company_id
            LIMIT 1
        """
        row = await database.fetch_one(query, {"budget_id": budget_id, "company_id": company_id})
        if row:
            return await self.get_rendering(row["id"], company_id)
        return None

    async def create_rendering(
        self,
        rendering_data: RenderingCreate,
        company_id: UUID,
        created_by_user_id: Optional[UUID] = None
    ) -> RenderingDetail:
        """Create a new rendering."""
        query = """
            INSERT INTO renderings (
                title, description, status, visit_id, budget_id,
                company_id, created_by_user_id, expiration_date, notes
            ) VALUES (
                :title, :description, 'draft', :visit_id, :budget_id,
                :company_id, :created_by_user_id, :expiration_date, :notes
            )
            RETURNING *
        """
        params = {
            **rendering_data.model_dump(),
            "company_id": company_id,
            "created_by_user_id": created_by_user_id
        }
        row = await database.fetch_one(query, params)
        return await self.get_rendering(row["id"], company_id)

    async def update_rendering(
        self,
        rendering_id: UUID,
        rendering_data: RenderingUpdate,
        company_id: UUID
    ) -> Optional[RenderingDetail]:
        """Update a rendering."""
        # Build dynamic update query
        update_fields = []
        params = {"id": rendering_id, "company_id": company_id}

        for field, value in rendering_data.model_dump(exclude_unset=True).items():
            if value is not None:
                update_fields.append(f"{field} = :{field}")
                params[field] = value.value if hasattr(value, 'value') else value

        if not update_fields:
            return await self.get_rendering(rendering_id, company_id)

        update_fields.append("updated_at = :updated_at")
        params["updated_at"] = datetime.utcnow()

        query = f"""
            UPDATE renderings
            SET {', '.join(update_fields)}
            WHERE id = :id AND company_id = :company_id
            RETURNING *
        """
        row = await database.fetch_one(query, params)

        if not row:
            return None
        return await self.get_rendering(rendering_id, company_id)

    async def delete_rendering(
        self,
        rendering_id: UUID,
        company_id: UUID
    ) -> bool:
        """Delete a rendering."""
        query = """
            DELETE FROM renderings
            WHERE id = :id AND company_id = :company_id
            RETURNING id
        """
        row = await database.fetch_one(query, {"id": rendering_id, "company_id": company_id})
        return row is not None

    # ============ Image Methods ============

    async def _get_images(self, rendering_id: UUID) -> List[RenderingImage]:
        query = """
            SELECT * FROM rendering_images
            WHERE rendering_id = :rendering_id
            ORDER BY display_order
        """
        rows = await database.fetch_all(query, {"rendering_id": rendering_id})
        return [RenderingImage(**dict(row)) for row in rows]

    async def add_image(
        self,
        rendering_id: UUID,
        image_data: RenderingImageCreate,
        company_id: UUID
    ) -> RenderingImage:
        # Verify rendering exists
        rendering = await self.get_rendering(rendering_id, company_id)
        if not rendering:
            raise ValueError("Rendering not found")

        query = """
            INSERT INTO rendering_images (
                rendering_id, image_url, title, description, display_order, is_full_page
            ) VALUES (
                :rendering_id, :image_url, :title, :description, :display_order, :is_full_page
            )
            RETURNING *
        """
        params = {"rendering_id": rendering_id, **image_data.model_dump()}
        row = await database.fetch_one(query, params)
        return RenderingImage(**dict(row))

    async def update_image(
        self,
        rendering_id: UUID,
        image_id: UUID,
        image_data: RenderingImageUpdate,
        company_id: UUID
    ) -> Optional[RenderingImage]:
        # Verify rendering exists
        rendering = await self.get_rendering(rendering_id, company_id)
        if not rendering:
            return None

        update_fields = []
        params = {"id": image_id, "rendering_id": rendering_id}

        for field, value in image_data.model_dump(exclude_unset=True).items():
            if value is not None:
                update_fields.append(f"{field} = :{field}")
                params[field] = value

        if not update_fields:
            query = "SELECT * FROM rendering_images WHERE id = :id AND rendering_id = :rendering_id"
            row = await database.fetch_one(query, params)
            return RenderingImage(**dict(row)) if row else None

        query = f"""
            UPDATE rendering_images
            SET {', '.join(update_fields)}
            WHERE id = :id AND rendering_id = :rendering_id
            RETURNING *
        """
        row = await database.fetch_one(query, params)
        return RenderingImage(**dict(row)) if row else None

    async def delete_image(
        self,
        rendering_id: UUID,
        image_id: UUID,
        company_id: UUID
    ) -> bool:
        # Verify rendering exists
        rendering = await self.get_rendering(rendering_id, company_id)
        if not rendering:
            return False

        query = """
            DELETE FROM rendering_images
            WHERE id = :id AND rendering_id = :rendering_id
            RETURNING id
        """
        row = await database.fetch_one(query, {"id": image_id, "rendering_id": rendering_id})
        return row is not None

    async def reorder_images(
        self,
        rendering_id: UUID,
        image_ids: List[UUID],
        company_id: UUID
    ) -> List[RenderingImage]:
        # Verify rendering exists
        rendering = await self.get_rendering(rendering_id, company_id)
        if not rendering:
            raise ValueError("Rendering not found")

        for order, image_id in enumerate(image_ids):
            query = """
                UPDATE rendering_images
                SET display_order = :order
                WHERE id = :id AND rendering_id = :rendering_id
            """
            await database.execute(query, {
                "order": order,
                "id": image_id,
                "rendering_id": rendering_id
            })

        return await self._get_images(rendering_id)

    # ============ Item Methods ============

    async def _get_items(self, rendering_id: UUID) -> List[RenderingItem]:
        query = """
            SELECT * FROM rendering_items
            WHERE rendering_id = :rendering_id
            ORDER BY display_order
        """
        rows = await database.fetch_all(query, {"rendering_id": rendering_id})
        return [RenderingItem(**dict(row)) for row in rows]

    async def add_item(
        self,
        rendering_id: UUID,
        item_data: RenderingItemCreate,
        company_id: UUID
    ) -> RenderingItem:
        # Verify rendering exists
        rendering = await self.get_rendering(rendering_id, company_id)
        if not rendering:
            raise ValueError("Rendering not found")

        query = """
            INSERT INTO rendering_items (
                rendering_id, budget_item_id, category, name,
                is_material_sample, material_image_url, specifications,
                subtotal, tax, total, product_image_url,
                display_order, show_in_materials_page, show_in_details_page,
                notes, disclaimer
            ) VALUES (
                :rendering_id, :budget_item_id, :category, :name,
                :is_material_sample, :material_image_url, :specifications,
                :subtotal, :tax, :total, :product_image_url,
                :display_order, :show_in_materials_page, :show_in_details_page,
                :notes, :disclaimer
            )
            RETURNING *
        """
        params = {
            "rendering_id": rendering_id,
            **item_data.model_dump()
        }
        # Convert specifications dict to JSON
        if params.get("specifications"):
            import json
            params["specifications"] = json.dumps(params["specifications"])

        row = await database.fetch_one(query, params)
        return RenderingItem(**dict(row))

    async def update_item(
        self,
        rendering_id: UUID,
        item_id: UUID,
        item_data: RenderingItemUpdate,
        company_id: UUID
    ) -> Optional[RenderingItem]:
        # Verify rendering exists
        rendering = await self.get_rendering(rendering_id, company_id)
        if not rendering:
            return None

        update_fields = []
        params = {"id": item_id, "rendering_id": rendering_id}

        for field, value in item_data.model_dump(exclude_unset=True).items():
            if value is not None:
                update_fields.append(f"{field} = :{field}")
                if field == "specifications":
                    import json
                    params[field] = json.dumps(value)
                else:
                    params[field] = value

        if not update_fields:
            query = "SELECT * FROM rendering_items WHERE id = :id AND rendering_id = :rendering_id"
            row = await database.fetch_one(query, params)
            return RenderingItem(**dict(row)) if row else None

        update_fields.append("updated_at = :updated_at")
        params["updated_at"] = datetime.utcnow()

        query = f"""
            UPDATE rendering_items
            SET {', '.join(update_fields)}
            WHERE id = :id AND rendering_id = :rendering_id
            RETURNING *
        """
        row = await database.fetch_one(query, params)
        return RenderingItem(**dict(row)) if row else None

    async def delete_item(
        self,
        rendering_id: UUID,
        item_id: UUID,
        company_id: UUID
    ) -> bool:
        # Verify rendering exists
        rendering = await self.get_rendering(rendering_id, company_id)
        if not rendering:
            return False

        query = """
            DELETE FROM rendering_items
            WHERE id = :id AND rendering_id = :rendering_id
            RETURNING id
        """
        row = await database.fetch_one(query, {"id": item_id, "rendering_id": rendering_id})
        return row is not None

    async def import_from_budget(
        self,
        rendering_id: UUID,
        budget_item_ids: List[UUID],
        company_id: UUID
    ) -> List[RenderingItem]:
        """Import budget items as rendering items."""
        rendering = await self.get_rendering(rendering_id, company_id)
        if not rendering:
            raise ValueError("Rendering not found")

        created_items = []
        current_order = len(rendering.items)

        for budget_item_id in budget_item_ids:
            # Fetch budget item
            query = """
                SELECT bi.*, b.visit_id
                FROM budget_items bi
                JOIN budgets b ON bi.budget_id = b.id
                WHERE bi.id = :id
            """
            budget_item = await database.fetch_one(query, {"id": budget_item_id})

            if budget_item:
                item_data = RenderingItemCreate(
                    budget_item_id=budget_item_id,
                    category=budget_item["section_name"] or "Item",
                    name=budget_item["description"],
                    subtotal=str(budget_item["subtotal"]) if budget_item["subtotal"] else None,
                    total=str(budget_item["subtotal"]) if budget_item["subtotal"] else None,
                    display_order=current_order,
                    show_in_details_page=True
                )
                item = await self.add_item(rendering_id, item_data, company_id)
                created_items.append(item)
                current_order += 1

        return created_items

    # ============ Helper Methods ============

    async def _get_visit(self, visit_id: UUID, company_id: UUID):
        """Fetch visit details (implement based on your visit service)."""
        # Import and use your existing visit service
        pass

    async def _get_budget(self, budget_id: UUID, company_id: UUID):
        """Fetch budget details (implement based on your budget service)."""
        # Import and use your existing budget service
        pass
```

---

## PDF Generation Service

### File: `app/services/pdf_service.py` (Rendering section)

```python
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.platypus import PageBreak
from io import BytesIO
import httpx

from app.models.rendering import RenderingDetail


class PDFService:

    async def generate_rendering_pdf(self, rendering: RenderingDetail) -> bytes:
        """Generate a PDF for a rendering proposal."""
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=0.5*inch,
            leftMargin=0.5*inch,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch
        )

        styles = getSampleStyleSheet()
        story = []

        # ============ Page 1-3: Project Images ============
        for image in rendering.images:
            if image.is_full_page:
                # Add header
                story.append(self._create_header(rendering))
                story.append(Spacer(1, 0.3*inch))

                # Add image (full page)
                try:
                    img = await self._fetch_image(image.image_url)
                    if img:
                        # Scale to fit page
                        img_width = 7*inch
                        img_height = 9*inch
                        story.append(Image(img, width=img_width, height=img_height))
                except Exception as e:
                    story.append(Paragraph(f"[Image: {image.title or 'Project Image'}]", styles['Normal']))

                story.append(PageBreak())

        # ============ Page 4: Proposed Materials ============
        material_items = [item for item in rendering.items if item.show_in_materials_page]

        if material_items:
            story.append(self._create_header(rendering))
            story.append(Spacer(1, 0.3*inch))
            story.append(Paragraph("Proposed Materials:", styles['Heading2']))
            story.append(Spacer(1, 0.3*inch))

            # Create 2x2 grid of materials
            material_data = []
            row = []
            for i, item in enumerate(material_items):
                cell_content = []
                cell_content.append(Paragraph(f"<b>{item.category}</b>", styles['Normal']))

                if item.material_image_url:
                    try:
                        img = await self._fetch_image(item.material_image_url)
                        if img:
                            cell_content.append(Image(img, width=2.5*inch, height=2.5*inch))
                    except:
                        pass

                row.append(cell_content)

                if len(row) == 2 or i == len(material_items) - 1:
                    while len(row) < 2:
                        row.append("")
                    material_data.append(row)
                    row = []

            if material_data:
                table = Table(material_data, colWidths=[3.5*inch, 3.5*inch])
                table.setStyle(TableStyle([
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('PADDING', (0, 0), (-1, -1), 10),
                ]))
                story.append(table)

            story.append(PageBreak())

        # ============ Page 5+: Item Details ============
        detail_items = [item for item in rendering.items if item.show_in_details_page]

        for item in detail_items:
            story.append(self._create_header(rendering))
            story.append(Spacer(1, 0.2*inch))

            # Item title
            story.append(Paragraph(f"<b>Job:</b> {rendering.title}", styles['Normal']))
            story.append(Spacer(1, 0.2*inch))

            # Category header
            header_style = ParagraphStyle(
                'ItemHeader',
                parent=styles['Heading3'],
                backColor=colors.HexColor('#1a365d'),
                textColor=colors.white,
                padding=6
            )
            story.append(Paragraph(item.category, header_style))
            story.append(Spacer(1, 0.1*inch))

            # Specifications table
            if item.specifications:
                spec_data = [[k, v] for k, v in item.specifications.items()]
                spec_table = Table(spec_data, colWidths=[2*inch, 4*inch])
                spec_table.setStyle(TableStyle([
                    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                    ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
                    ('PADDING', (0, 0), (-1, -1), 6),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                ]))
                story.append(spec_table)

            story.append(Spacer(1, 0.2*inch))

            # Pricing
            if item.subtotal or item.total:
                pricing_data = []
                if item.subtotal:
                    pricing_data.append(["Subtotal:", f"${float(item.subtotal):,.2f}"])
                if item.tax:
                    pricing_data.append(["Tax:", f"${float(item.tax):,.2f}"])
                if item.total:
                    pricing_data.append(["Total:", f"${float(item.total):,.2f}"])

                pricing_table = Table(pricing_data, colWidths=[2*inch, 2*inch])
                pricing_table.setStyle(TableStyle([
                    ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
                    ('FONTSIZE', (0, 0), (-1, -1), 10),
                    ('LINEABOVE', (0, -1), (-1, -1), 1, colors.black),
                    ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                ]))
                story.append(pricing_table)

            # Notes/disclaimer
            if item.notes:
                story.append(Spacer(1, 0.2*inch))
                story.append(Paragraph(f"<i>{item.notes}</i>", styles['Normal']))

            if item.disclaimer:
                story.append(Spacer(1, 0.1*inch))
                story.append(Paragraph(
                    f"<font size=8>{item.disclaimer}</font>",
                    styles['Normal']
                ))

            # Expiration date
            if rendering.expiration_date:
                story.append(Spacer(1, 0.2*inch))
                story.append(Paragraph(
                    f"This estimate expires on: {rendering.expiration_date.strftime('%B %d, %Y')}",
                    styles['Normal']
                ))

            story.append(PageBreak())

        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer.read()

    def _create_header(self, rendering: RenderingDetail):
        """Create company header for each page."""
        styles = getSampleStyleSheet()

        header_data = [[
            Paragraph("<b>CANA'S KITCHEN & BATH</b><br/>491 Nashua St - Milford, NH 03055", styles['Normal']),
            Paragraph(f"{rendering.title}", styles['Normal'])
        ]]

        header_table = Table(header_data, colWidths=[4*inch, 3*inch])
        header_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('LINEBELOW', (0, 0), (-1, 0), 1, colors.HexColor('#1a365d')),
            ('TEXTCOLOR', (0, 0), (0, 0), colors.HexColor('#1a365d')),
        ]))

        return header_table

    async def _fetch_image(self, url: str) -> BytesIO:
        """Fetch image from URL."""
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            if response.status_code == 200:
                return BytesIO(response.content)
        return None
```

---

## Migration File

### File: `migrations/versions/xxx_add_renderings_tables.py`

```python
"""Add renderings tables

Revision ID: xxx
Revises: previous_revision
Create Date: 2026-01-19
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


revision = 'xxx'
down_revision = 'previous_revision'
branch_labels = None
depends_on = None


def upgrade():
    # Create renderings table
    op.create_table(
        'renderings',
        sa.Column('id', UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(50), server_default='draft', nullable=False),
        sa.Column('visit_id', UUID(), nullable=True),
        sa.Column('budget_id', UUID(), nullable=True),
        sa.Column('company_id', UUID(), nullable=False),
        sa.Column('created_by_user_id', UUID(), nullable=True),
        sa.Column('expiration_date', sa.Date(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['visit_id'], ['visits.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['budget_id'], ['budgets.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.CheckConstraint("status IN ('draft', 'sent', 'approved', 'rejected')", name='valid_rendering_status')
    )

    op.create_index('idx_renderings_company_id', 'renderings', ['company_id'])
    op.create_index('idx_renderings_visit_id', 'renderings', ['visit_id'])
    op.create_index('idx_renderings_budget_id', 'renderings', ['budget_id'])
    op.create_index('idx_renderings_status', 'renderings', ['status'])

    # Create rendering_images table
    op.create_table(
        'rendering_images',
        sa.Column('id', UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('rendering_id', UUID(), nullable=False),
        sa.Column('image_url', sa.Text(), nullable=False),
        sa.Column('title', sa.String(255), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('display_order', sa.Integer(), server_default='0', nullable=False),
        sa.Column('is_full_page', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['rendering_id'], ['renderings.id'], ondelete='CASCADE')
    )

    op.create_index('idx_rendering_images_rendering_id', 'rendering_images', ['rendering_id'])

    # Create rendering_items table
    op.create_table(
        'rendering_items',
        sa.Column('id', UUID(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('rendering_id', UUID(), nullable=False),
        sa.Column('budget_item_id', UUID(), nullable=True),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('is_material_sample', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('material_image_url', sa.Text(), nullable=True),
        sa.Column('specifications', JSONB(), server_default='{}', nullable=True),
        sa.Column('subtotal', sa.Numeric(12, 2), nullable=True),
        sa.Column('tax', sa.Numeric(12, 2), server_default='0', nullable=True),
        sa.Column('total', sa.Numeric(12, 2), nullable=True),
        sa.Column('product_image_url', sa.Text(), nullable=True),
        sa.Column('display_order', sa.Integer(), server_default='0', nullable=False),
        sa.Column('show_in_materials_page', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('show_in_details_page', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('disclaimer', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('NOW()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['rendering_id'], ['renderings.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['budget_item_id'], ['budget_items.id'], ondelete='SET NULL')
    )

    op.create_index('idx_rendering_items_rendering_id', 'rendering_items', ['rendering_id'])
    op.create_index('idx_rendering_items_budget_item_id', 'rendering_items', ['budget_item_id'])


def downgrade():
    op.drop_table('rendering_items')
    op.drop_table('rendering_images')
    op.drop_table('renderings')
```

---

## Router Registration

### File: `app/main.py` (add to existing)

```python
from app.routers import renderings

# Add to existing router includes
app.include_router(renderings.router)
```

---

## Summary

### Tables to Create
1. `renderings` - Main rendering entity
2. `rendering_images` - Project images (uploaded by admin)
3. `rendering_items` - Materials and item details

### Endpoints (15 total)
- **Renderings CRUD**: 7 endpoints
- **Images**: 4 endpoints
- **Items**: 4 endpoints

### Files to Create/Modify
1. `app/models/rendering.py` - Pydantic models
2. `app/routers/renderings.py` - API endpoints
3. `app/services/rendering_service.py` - Business logic
4. `app/services/pdf_service.py` - Add rendering PDF generation
5. `migrations/versions/xxx_add_renderings_tables.py` - Database migration
6. `app/main.py` - Register router
