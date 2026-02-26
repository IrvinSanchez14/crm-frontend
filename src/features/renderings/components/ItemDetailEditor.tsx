import { useState } from 'react';
import { Text } from '../../../shared/components/atoms/Text';
import { Label } from '../../../shared/components/atoms/Label/Label';
import { Button } from '../../../shared/components/atoms/Button';
import {
  addRenderingItem,
  updateRenderingItem,
  uploadImage,
  type RenderingItem,
  type RenderingItemCreate,
  type RenderingItemUpdate,
  type BudgetItemDetail,
} from '../../../infrastructure/api/api.client';

interface ItemDetailEditorProps {
  renderingId: string;
  companyId: string;
  budgetItem: BudgetItemDetail;
  budgetCategoryName: string;
  existingRenderingItem: RenderingItem | null;
  onSave: () => Promise<void>;
  onCancel: () => void;
}

export function ItemDetailEditor({
  renderingId,
  companyId,
  budgetItem,
  budgetCategoryName,
  existingRenderingItem,
  onSave,
  onCancel,
}: ItemDetailEditorProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>(
    existingRenderingItem?.specifications
      ? Object.entries(existingRenderingItem.specifications).map(([key, value]) => ({ key, value }))
      : [{ key: '', value: '' }]
  );

  const [productImageUrl, setProductImageUrl] = useState(existingRenderingItem?.product_image_url || '');
  const [productImagePreview, setProductImagePreview] = useState(existingRenderingItem?.product_image_url || '');
  const subtotal = (() => {
    const existing = existingRenderingItem?.subtotal;
    if (existing && parseFloat(String(existing)) !== 0) return String(existing);
    return budgetItem.subtotal || '0';
  })();
  const [tax, setTax] = useState(existingRenderingItem?.tax || '');
  const [notes, setNotes] = useState(existingRenderingItem?.notes || 'Labor not included');
  const [disclaimer, setDisclaimer] = useState(existingRenderingItem?.disclaimer || 'Pricing is strictly an estimate - the final pricing will be determined once the on-site measurement, final layout, and product selection are signed off on.');

  const calculatedTotal = (() => {
    const sub = parseFloat(subtotal) || 0;
    const t = parseFloat(tax) || 0;
    return (sub + t).toFixed(2);
  })();

  const addSpec = () => setSpecs([...specs, { key: '', value: '' }]);
  const removeSpec = (index: number) => setSpecs(specs.filter((_, i) => i !== index));
  const updateSpec = (index: number, field: 'key' | 'value', value: string) => {
    const newSpecs = [...specs];
    newSpecs[index][field] = value;
    setSpecs(newSpecs);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => setProductImagePreview(reader.result as string);
      reader.readAsDataURL(file);

      const result = await uploadImage(file, companyId, 'renderings');
      setProductImageUrl(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const specifications: Record<string, string> = {};
      specs.forEach(({ key, value }) => {
        if (key.trim() && value.trim()) {
          specifications[key.trim()] = value.trim();
        }
      });

      if (existingRenderingItem) {
        const updateData: RenderingItemUpdate = {
          specifications: Object.keys(specifications).length > 0 ? specifications : undefined,
          product_image_url: productImageUrl || undefined,
          subtotal: subtotal || undefined,
          tax: tax || undefined,
          total: calculatedTotal,
          notes: notes || undefined,
          disclaimer: disclaimer || undefined,
          show_in_details_page: true,
        };
        await updateRenderingItem(renderingId, existingRenderingItem.id, updateData, companyId);
      } else {
        const createData: RenderingItemCreate = {
          budget_item_id: budgetItem.id,
          category: budgetCategoryName,
          name: budgetItem.description,
          specifications: Object.keys(specifications).length > 0 ? specifications : undefined,
          product_image_url: productImageUrl || undefined,
          subtotal: subtotal || undefined,
          tax: tax || undefined,
          total: calculatedTotal,
          notes: notes || undefined,
          disclaimer: disclaimer || undefined,
          show_in_details_page: true,
        };
        await addRenderingItem(renderingId, createData, companyId);
      }

      await onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-[color:var(--border)] rounded-lg p-4 mt-2 bg-[color:var(--card)]">
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <Text variant="muted" size="sm">Category</Text>
          <Text variant="default" className="font-medium">{budgetCategoryName}</Text>
        </div>
        <div>
          <Text variant="muted" size="sm">Item</Text>
          <Text variant="default" className="font-medium">{budgetItem.description}</Text>
        </div>
      </div>

      {/* Specifications */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <Label>Specifications</Label>
          <Button variant="secondary" size="sm" onClick={addSpec}>
            + Add Spec
          </Button>
        </div>
        <div className="space-y-2">
          {specs.map((spec, index) => (
            <div key={index} className="flex gap-2">
              <textarea
                value={spec.key}
                onChange={(e) => updateSpec(index, 'key', e.target.value)}
                placeholder="Key (e.g., Door Style)"
                rows={2}
                className="flex-1 px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] text-sm resize-y"
              />
              <textarea
                value={spec.value}
                onChange={(e) => updateSpec(index, 'value', e.target.value)}
                placeholder="Value"
                rows={2}
                className="flex-1 px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] text-sm resize-y"
              />
              {specs.length > 1 && (
                <Button variant="secondary" size="sm" onClick={() => removeSpec(index)}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Product Image */}
      <div className="mb-4">
        <Label>Product Image</Label>
        <div className="mt-1 flex items-start gap-4">
          {productImagePreview && (
            <div className="w-24 h-24 flex-shrink-0 bg-[color:var(--muted)] rounded-lg overflow-hidden">
              <img src={productImagePreview} alt="Product" className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageUpload}
              disabled={uploading}
              className="text-sm"
            />
            {uploading && <Text variant="muted" size="sm" className="mt-1">Uploading...</Text>}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="space-y-1">
          <Label htmlFor="subtotal">Subtotal</Label>
          <div className="px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--muted)] text-[color:var(--foreground)] text-sm font-medium">
            ${subtotal}
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="tax">Tax</Label>
          <input
            id="tax"
            type="number"
            step="0.01"
            value={tax}
            onChange={(e) => setTax(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label>Total</Label>
          <div className="px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--muted)] text-[color:var(--foreground)] text-sm font-medium">
            ${calculatedTotal}
          </div>
        </div>
      </div>

      {/* Notes & Disclaimer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-1">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Labor not included"
            rows={3}
            className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] text-sm resize-y"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="disclaimer">Disclaimer</Label>
          <textarea
            id="disclaimer"
            value={disclaimer}
            onChange={(e) => setDisclaimer(e.target.value)}
            placeholder="e.g., Prices subject to change"
            rows={3}
            className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] text-sm resize-y"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : existingRenderingItem ? 'Update Details' : 'Save Details'}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
