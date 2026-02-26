/**
 * Create / Edit Budget Page
 * If a budget already exists for the visit, loads it (edit mode).
 * Otherwise creates a new draft budget (create mode).
 * Items are saved immediately via API as they are added.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../../../shared/components/organisms/Header';
import { Sidebar } from '../../../shared/components/organisms/Sidebar';
import { useAuth } from '../../../shared/hooks/useAuth';
import { Heading } from '../../../shared/components/atoms/Heading';
import { Text } from '../../../shared/components/atoms/Text';
import { Button } from '../../../shared/components/atoms/Button';
import { Input } from '../../../shared/components/atoms/Input';
import { Label } from '../../../shared/components/atoms/Label';
import { cn } from '../../../core/utils/cn';
import {
  getVisit,
  getProject,
  createBudget,
  getBudget,
  getBudgetByVisit,
  addBudgetCategory,
  addBudgetItem,
  deleteBudgetItem,
  deleteBudgetCategory,
  reorderBudgetCategories,
  uploadImage,
  getCatalogItems,
  getBudgetItemSuggestions,
  type BudgetDetail,
  type BudgetCategoryDetail,
  type BudgetItemCreate,
  type VisitDetail,
  type ProjectDetail,
  type CatalogItem,
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';
import { formatCurrencyDisplay } from '../../../core/utils/currency.utils';
import { calcSellingPrice, calcProfit, calcLineSubtotal } from '../../../core/utils/pricing.utils';
import { useTranslation } from 'react-i18next';
import { EditBudgetItemForm } from '../components/EditBudgetItemForm';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ---------------------------------------------------------------------------
// Autocomplete input — Google-style suggestions from catalog items
// ---------------------------------------------------------------------------

type SuggestionEntry =
  | { type: 'catalog'; item: CatalogItem }
  | { type: 'recent'; description: string };

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: CatalogItem) => void;
  onSelectSuggestion?: (description: string) => void;
  catalogItems: CatalogItem[];
  itemSuggestions?: string[];
  placeholder?: string;
}

function AutocompleteInput({
  value,
  onChange,
  onSelect,
  onSelectSuggestion,
  catalogItems,
  itemSuggestions = [],
  placeholder = 'Type item name...',
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Build unified suggestion list: catalog matches first, then recent (deduped)
  const entries: SuggestionEntry[] = (() => {
    if (!value.trim()) return [];
    const q = value.toLowerCase();
    const catalogMatches = catalogItems
      .filter((c) => c.name.toLowerCase().includes(q))
      .map((item): SuggestionEntry => ({ type: 'catalog', item }));
    const catalogNames = new Set(catalogMatches.map((e) => (e as { type: 'catalog'; item: CatalogItem }).item.name.toLowerCase()));
    const recentMatches = itemSuggestions
      .filter((d) => d.toLowerCase().includes(q) && !catalogNames.has(d.toLowerCase()))
      .map((description): SuggestionEntry => ({ type: 'recent', description }));
    return [...catalogMatches, ...recentMatches];
  })();

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Scroll highlighted into view
  useEffect(() => {
    if (open && highlighted >= 0 && listRef.current) {
      const el = listRef.current.children[highlighted] as HTMLElement | undefined;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlighted, open]);

  const selectEntry = (entry: SuggestionEntry) => {
    if (entry.type === 'catalog') {
      onSelect(entry.item);
    } else {
      onChange(entry.description);
      onSelectSuggestion?.(entry.description);
    }
    setOpen(false);
    setHighlighted(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!open || entries.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((p) => (p < entries.length - 1 ? p + 1 : p));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((p) => (p > 0 ? p - 1 : -1));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault();
      selectEntry(entries[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setHighlighted(-1);
    }
  };

  // Check if we need a section header
  const firstRecentIdx = entries.findIndex((e) => e.type === 'recent');
  const hasBothSections = firstRecentIdx > 0;

  return (
    <div ref={wrapperRef} className="relative">
      <textarea
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlighted(-1);
        }}
        onFocus={() => { if (value.trim()) setOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={2}
        className="w-full px-2 py-1.5 border border-[color:var(--border)] rounded bg-[color:var(--background)] text-[color:var(--foreground)] text-sm resize-y"
      />
      {open && entries.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 left-0 right-0 mt-1 max-h-48 overflow-auto bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg shadow-lg py-1"
        >
          {entries.map((entry, idx) => (
            <li
              key={entry.type === 'catalog' ? entry.item.id : `recent-${idx}`}
              className={cn(
                'px-3 py-2 text-sm cursor-pointer transition-colors',
                idx === highlighted
                  ? 'bg-[color:var(--muted)] text-[color:var(--foreground)]'
                  : 'text-[color:var(--foreground)] hover:bg-[color:var(--muted)]',
                hasBothSections && idx === firstRecentIdx && 'border-t border-[color:var(--border)]',
              )}
              onMouseEnter={() => setHighlighted(idx)}
              onClick={() => selectEntry(entry)}
            >
              {entry.type === 'catalog' ? (
                <>
                  <span className="font-medium">{entry.item.name}</span>
                  <span className="ml-2 text-xs text-[color:var(--muted-foreground)]">
                    {entry.item.unity} &middot; {formatCurrencyDisplay(entry.item.price_base)}
                  </span>
                </>
              ) : (
                <>
                  <span>{entry.description}</span>
                  <span className="ml-2 text-xs text-[color:var(--muted-foreground)]">recent</span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface NewItemRow {
  name: string;
  unit: string;
  quantity: string;
  unit_price: string;
  catalog_item_id: string;
}

const emptyNewItem: NewItemRow = {
  name: '',
  unit: '',
  quantity: '',
  unit_price: '',
  catalog_item_id: '',
};

const itemSubtotal = (item: NewItemRow): number => {
  const qty = parseFloat(item.quantity);
  const price = parseFloat(item.unit_price);
  if (isNaN(qty) || isNaN(price)) return 0;
  return calcLineSubtotal(qty, price);
};

// ---------------------------------------------------------------------------
// Reusable item row — used in both "Add Category" form and saved-category
// inline add row. Renders <tr> cells for one editable item.
// ---------------------------------------------------------------------------

interface ItemRowCellsProps {
  item: NewItemRow;
  catalogItems: CatalogItem[];
  itemSuggestions?: string[];
  onChange: (field: keyof NewItemRow, value: string) => void;
  onCatalogSelect: (catalogItem: CatalogItem) => void;
  actionButton: React.ReactNode;
}

function ItemRowCells({ item, catalogItems, itemSuggestions, onChange, onCatalogSelect, actionButton }: ItemRowCellsProps) {
  return (
    <>
      <td className="px-3 py-2">
        <AutocompleteInput
          value={item.name}
          onChange={(v) => {
            onChange('name', v);
            // Clear catalog link when user types manually
            if (item.catalog_item_id) onChange('catalog_item_id', '');
          }}
          onSelect={(c) => {
            onCatalogSelect(c);
          }}
          catalogItems={catalogItems}
          itemSuggestions={itemSuggestions}
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={item.unit}
          onChange={(e) => onChange('unit', e.target.value)}
          placeholder="Unit"
          className="w-full px-2 py-1.5 border border-[color:var(--border)] rounded bg-[color:var(--background)] text-[color:var(--foreground)] text-sm"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          value={item.quantity}
          onChange={(e) => onChange('quantity', e.target.value)}
          placeholder="0"
          min="0"
          step="any"
          className="w-full px-2 py-1.5 border border-[color:var(--border)] rounded bg-[color:var(--background)] text-[color:var(--foreground)] text-sm text-right"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          value={item.unit_price}
          onChange={(e) => onChange('unit_price', e.target.value)}
          placeholder="0.00"
          min="0"
          step="0.01"
          className="w-full px-2 py-1.5 border border-[color:var(--border)] rounded bg-[color:var(--background)] text-[color:var(--foreground)] text-sm text-right"
        />
      </td>
      <td className="px-3 py-2 text-right text-[color:var(--foreground)]">
        {formatCurrencyDisplay(calcSellingPrice(parseFloat(item.unit_price) || 0))}
      </td>
      <td className="px-3 py-2 text-right text-[color:var(--foreground)]">
        {formatCurrencyDisplay(calcProfit(parseFloat(item.unit_price) || 0))}
      </td>
      <td className="px-3 py-2 text-right font-medium text-[color:var(--foreground)]">
        {formatCurrencyDisplay(itemSubtotal(item))}
      </td>
      <td className="px-3 py-2">{actionButton}</td>
    </>
  );
}

// ---------------------------------------------------------------------------
// Sortable category card wrapper
// ---------------------------------------------------------------------------

interface SortableCategoryCardProps {
  id: string;
  children: (dragHandleProps: Record<string, unknown>) => React.ReactNode;
}

function SortableCategoryCard({ id, children }: SortableCategoryCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] overflow-hidden">
      {children({ ...attributes, ...listeners })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function CreateBudgetPage() {
  const { id: visitId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation('budgets');

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [visit, setVisit] = useState<VisitDetail | null>(null);
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [budget, setBudget] = useState<BudgetDetail | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Category form
  const [categoryName, setCategoryName] = useState('');
  const [categoryImages, setCategoryImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [formItems, setFormItems] = useState<NewItemRow[]>([{ ...emptyNewItem }]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Per-category inline add-item (keyed by category id)
  const [newItems, setNewItems] = useState<Record<string, NewItemRow>>({});
  const [savingItem, setSavingItem] = useState<string | null>(null);
  const [itemError, setItemError] = useState<Record<string, string>>({});

  // Delete states
  const [deletingItem, setDeletingItem] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'budget' | 'order'>('budget');
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);

  // Catalog & suggestions
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [itemSuggestions, setItemSuggestions] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCompanyId = useCallback((): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  }, [user]);

  // ---- Init ----
  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!visitId) return;
      const companyId = getCompanyId();
      if (!companyId) {
        setError(t('common:messages.sessionExpired'));
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const visitData = await getVisit(visitId, companyId);
        if (cancelled) return;
        setVisit(visitData);
        const projectData = await getProject(visitData.project_id, companyId);
        if (cancelled) return;
        setProject(projectData);

        const existingBudget = await getBudgetByVisit(visitId, companyId);
        if (cancelled) return;
        let budgetData: BudgetDetail;
        if (existingBudget) {
          budgetData = existingBudget;
          setIsEditMode(true);
        } else {
          budgetData = await createBudget(
            { title: `Budget for ${visitData.title}`, visit_id: visitId },
            companyId,
          );
        }
        if (cancelled) return;
        setBudget(budgetData);

        const [catalog, suggestions] = await Promise.all([
          getCatalogItems({ company_id: companyId, active_only: true, limit: 1000 }),
          getBudgetItemSuggestions(companyId, '').catch(() => [] as string[]),
        ]);
        if (cancelled) return;
        setCatalogItems(catalog);
        setItemSuggestions(suggestions);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t('common:messages.errorLoading'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => { cancelled = true; };
  }, [visitId, getCompanyId]);

  const refreshBudget = useCallback(async () => {
    if (!budget) return;
    const companyId = getCompanyId();
    if (!companyId) return;
    const refreshed = await getBudget(budget.id, companyId);
    setBudget(refreshed);
  }, [budget, getCompanyId]);

  // ---- Form-item helpers (Add Category form) ----

  const setFormField = (index: number, field: keyof NewItemRow, value: string) => {
    setFormItems((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const selectFormCatalog = (index: number, c: CatalogItem) => {
    setFormItems((prev) =>
      prev.map((r, i) =>
        i === index
          ? { ...r, catalog_item_id: c.id, name: c.name, unit: c.unity, unit_price: c.price_base }
          : r,
      ),
    );
  };

  const addFormRow = () => setFormItems((p) => [...p, { ...emptyNewItem }]);
  const removeFormRow = (i: number) => setFormItems((p) => (p.length <= 1 ? p : p.filter((_, j) => j !== i)));
  const formTotal = () => formItems.reduce((s, r) => s + itemSubtotal(r), 0);

  // ---- Inline add-item helpers (saved categories) ----

  const getNewItem = (catId: string): NewItemRow => newItems[catId] || { ...emptyNewItem };

  const setNewField = (catId: string, field: keyof NewItemRow, value: string) => {
    setNewItems((prev) => ({
      ...prev,
      [catId]: { ...(prev[catId] || { ...emptyNewItem }), [field]: value },
    }));
  };

  const selectNewCatalog = (catId: string, c: CatalogItem) => {
    setNewItems((prev) => ({
      ...prev,
      [catId]: {
        ...(prev[catId] || { ...emptyNewItem }),
        catalog_item_id: c.id,
        name: c.name,
        unit: c.unity,
        unit_price: c.price_base,
      },
    }));
  };

  // ---- Save new item to existing category ----

  const handleAddItem = async (categoryId: string) => {
    if (!budget) return;
    const item = getNewItem(categoryId);

    if (!item.name.trim()) { setItemError((p) => ({ ...p, [categoryId]: t('itemNameRequired') })); return; }
    if (!item.quantity || parseFloat(item.quantity) <= 0) { setItemError((p) => ({ ...p, [categoryId]: t('quantityRequired') })); return; }
    if (!item.unit_price || parseFloat(item.unit_price) < 0) { setItemError((p) => ({ ...p, [categoryId]: t('unitPriceRequired') })); return; }

    const companyId = getCompanyId();
    if (!companyId) return;

    try {
      setSavingItem(categoryId);
      setItemError((p) => { const n = { ...p }; delete n[categoryId]; return n; });
      await addBudgetItem(budget.id, categoryId, {
        description: item.name.trim(),
        unit: item.unit || undefined,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: itemSubtotal(item).toFixed(2),
        catalog_item_id: item.catalog_item_id || undefined,
      }, companyId);
      await refreshBudget();
      setNewItems((p) => { const n = { ...p }; delete n[categoryId]; return n; });
    } catch (err) {
      setItemError((p) => ({ ...p, [categoryId]: err instanceof Error ? err.message : t('common:messages.errorLoading') }));
    } finally {
      setSavingItem(null);
    }
  };

  // ---- Delete item / category ----

  const handleDeleteItem = async (categoryId: string, itemId: string) => {
    if (!budget) return;
    const companyId = getCompanyId();
    if (!companyId) return;
    try {
      setDeletingItem(itemId);
      await deleteBudgetItem(budget.id, categoryId, itemId, companyId);
      await refreshBudget();
    } catch (err) {
      setItemError((p) => ({ ...p, [categoryId]: err instanceof Error ? err.message : t('common:messages.errorLoading') }));
    } finally {
      setDeletingItem(null);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!budget) return;
    const companyId = getCompanyId();
    if (!companyId) return;
    try {
      setDeletingCategory(categoryId);
      await deleteBudgetCategory(budget.id, categoryId, companyId);
      await refreshBudget();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common:messages.errorLoading'));
    } finally {
      setDeletingCategory(null);
    }
  };

  // ---- Category drag-and-drop reorder ----

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const sortedCategories = useMemo(
    () => budget ? [...budget.budget_categories].sort((a, b) => a.order_index - b.order_index) : [],
    [budget]
  );

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !budget) return;

    const oldIndex = sortedCategories.findIndex((c) => c.id === active.id);
    const newIndex = sortedCategories.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(sortedCategories, oldIndex, newIndex);

    // Optimistic update
    setBudget({
      ...budget,
      budget_categories: reordered.map((c, idx) => ({ ...c, order_index: idx })),
    });

    // Persist to backend
    const companyId = getCompanyId();
    if (!companyId) return;
    try {
      await reorderBudgetCategories(budget.id, reordered.map((c) => c.id), companyId);
    } catch (err) {
      // Revert on failure
      await refreshBudget();
    }
  }, [budget, sortedCategories, getCompanyId, refreshBudget]);

  // ---- Image upload ----

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (categoryImages.length >= 3) { setCategoryError(t('maxImagesError')); return; }
    const companyId = getCompanyId();
    if (!companyId) return;
    try {
      setUploadingImage(true);
      setCategoryError(null);
      const result = await uploadImage(file, companyId, 'budgets');
      setCategoryImages((p) => [...p, result.url]);
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : t('common:messages.errorLoading'));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (i: number) => setCategoryImages((p) => p.filter((_, j) => j !== i));

  // ---- Save category (with items) ----

  const handleSaveCategory = async () => {
    if (!budget) return;
    if (!categoryName.trim()) { setCategoryError(t('categoryNameRequired')); return; }

    const validItems = formItems.filter(
      (r) => r.name.trim() && parseFloat(r.quantity) > 0 && parseFloat(r.unit_price) >= 0,
    );
    const companyId = getCompanyId();
    if (!companyId) return;

    try {
      setSavingCategory(true);
      setCategoryError(null);

      const itemsPayload: BudgetItemCreate[] = validItems.map((r, idx) => ({
        description: r.name.trim(),
        unit: r.unit || undefined,
        quantity: r.quantity,
        unit_price: r.unit_price,
        subtotal: itemSubtotal(r).toFixed(2),
        order_index: idx,
        catalog_item_id: r.catalog_item_id || undefined,
      }));

      await addBudgetCategory(budget.id, {
        name: categoryName.trim(),
        images: categoryImages.length > 0 ? categoryImages : undefined,
        items: itemsPayload.length > 0 ? itemsPayload : undefined,
      }, companyId);

      await refreshBudget();
      setCategoryName('');
      setCategoryImages([]);
      setFormItems([{ ...emptyNewItem }]);
      setCategoryError(null);
      setShowCategoryModal(false);
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : t('common:messages.errorLoading'));
    } finally {
      setSavingCategory(false);
    }
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setCategoryName('');
    setCategoryImages([]);
    setFormItems([{ ...emptyNewItem }]);
    setCategoryError(null);
  };

  // ---- Computed ----

  const grandTotal = budget
    ? budget.budget_categories.reduce((s, c) => s + parseFloat(c.subtotal || '0'), 0)
    : 0;

  const pageTitle = isEditMode ? t('editBudget') : t('createBudget');

  // ---- Table header (shared) ----

  const tableHead = (
    <thead>
      <tr className="bg-[color:var(--muted)]/30 border-b border-[color:var(--border)]">
        <th className="text-left px-3 py-2 font-medium text-[color:var(--muted-foreground)] min-w-[200px]">{t('name')}</th>
        <th className="text-left px-3 py-2 font-medium text-[color:var(--muted-foreground)] w-24">{t('unit')}</th>
        <th className="text-right px-3 py-2 font-medium text-[color:var(--muted-foreground)] w-20">{t('quantity')}</th>
        <th className="text-right px-3 py-2 font-medium text-[color:var(--muted-foreground)] w-28">{t('realPrice')}</th>
        <th className="text-right px-3 py-2 font-medium text-[color:var(--muted-foreground)] w-32">{t('realPriceWithGanancia')}</th>
        <th className="text-right px-3 py-2 font-medium text-[color:var(--muted-foreground)] w-28">{t('gananciaBruta')}</th>
        <th className="text-right px-3 py-2 font-medium text-[color:var(--muted-foreground)] w-28">{t('subtotal')}</th>
        <th className="w-12"></th>
      </tr>
    </thead>
  );

  // ---- Spinner icon ----

  const spinner = (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  // ==== Render ====

  const shell = (content: React.ReactNode) => (
    <div className="min-h-screen bg-[color:var(--background)]">
      <Header
        userName={user?.name || user?.email || 'User'}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onLogout={logout}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <main className={cn('pt-5', 'transition-all duration-500 ease-out', isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0')}>
        {content}
      </main>
    </div>
  );

  if (loading) {
    return shell(
      <div className="p-6 flex items-center justify-center">
        <Text variant="muted">{t('loading')}</Text>
      </div>,
    );
  }

  if (error && !budget) {
    return shell(
      <div className="p-6">
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg mb-4">{error}</div>
        <Button variant="secondary" onClick={() => navigate(`/budgets/${visitId}`)}>{t('backToVisit')}</Button>
      </div>,
    );
  }

  return shell(
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="secondary" size="sm" onClick={() => navigate(`/budgets/${visitId}`)} aria-label="Back to visit">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Button>
        <div className="flex-1">
          <Heading variant="h1">{pageTitle}</Heading>
          <Text variant="muted" size="sm">{project?.name} &mdash; {visit?.title}</Text>
        </div>
        <div className="text-right">
          <Text variant="muted" size="sm">{t('grandTotal')}</Text>
          <Heading variant="h2">{formatCurrencyDisplay(grandTotal)}</Heading>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg mb-6">{error}</div>
      )}

      {/* ========== Tabs ========== */}
      {budget && sortedCategories.length > 0 && (
        <div className="flex gap-1 mb-6 border-b border-[color:var(--border)]">
          <button
            type="button"
            onClick={() => setActiveTab('budget')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === 'budget'
                ? 'border-[color:var(--primary)] text-[color:var(--primary)]'
                : 'border-transparent text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]'
            )}
          >
            {t('tabBudget')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('order')}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
              activeTab === 'order'
                ? 'border-[color:var(--primary)] text-[color:var(--primary)]'
                : 'border-transparent text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]'
            )}
          >
            {t('tabOrderCategories')}
          </button>
        </div>
      )}

      {/* ========== Saved categories ========== */}
      {budget && sortedCategories.length > 0 && activeTab === 'budget' && (
        <div className="space-y-4 mb-8 max-h-[60vh] overflow-y-auto pr-1">
          {sortedCategories.map((category: BudgetCategoryDetail) => {
            const catTotal = category.budget_items.reduce((s, i) => s + parseFloat(i.subtotal || '0'), 0);
            const ni = getNewItem(category.id);
            const isSaving = savingItem === category.id;
            const catErr = itemError[category.id];
            const isDeletingCat = deletingCategory === category.id;

            return (
              <div key={category.id} className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] overflow-hidden">
                {/* Category header */}
                <div className="flex items-center justify-between px-6 py-4 bg-[color:var(--muted)]/30">
                  <Heading variant="h4">{category.name}</Heading>
                  <div className="flex items-center gap-3">
                    <Text className="font-semibold text-lg">{formatCurrencyDisplay(catTotal)}</Text>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={isDeletingCat}
                      className={cn('text-[color:var(--muted-foreground)] hover:text-[color:var(--destructive)] transition-colors', isDeletingCat && 'opacity-50 cursor-not-allowed')}
                      aria-label="Delete category"
                      title="Delete category"
                    >
                      {isDeletingCat ? spinner : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Items table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    {tableHead}
                    <tbody>
                      {/* Saved items */}
                      {category.budget_items.map((item) => {
                        const deleting = deletingItem === item.id;
                        if (editingItemId === item.id) {
                          return (
                            <tr key={item.id} className="border-b border-[color:var(--border)]">
                              <td colSpan={8} className="px-3 py-3">
                                <EditBudgetItemForm
                                  budgetId={budget!.id}
                                  categoryId={category.id}
                                  item={item}
                                  onSuccess={() => {
                                    setEditingItemId(null);
                                    refreshBudget();
                                  }}
                                  onCancel={() => setEditingItemId(null)}
                                />
                              </td>
                            </tr>
                          );
                        }
                        return (
                          <tr key={item.id} className="border-b border-[color:var(--border)]">
                            <td className="px-3 py-3 whitespace-pre-wrap">{item.description}</td>
                            <td className="px-3 py-3">{item.unit || '\u2014'}</td>
                            <td className="text-right px-3 py-3">{item.quantity}</td>
                            <td className="text-right px-3 py-3">{formatCurrencyDisplay(item.unit_price)}</td>
                            <td className="text-right px-3 py-3">{formatCurrencyDisplay(calcSellingPrice(parseFloat(item.unit_price)))}</td>
                            <td className="text-right px-3 py-3">{formatCurrencyDisplay(calcProfit(parseFloat(item.unit_price)))}</td>
                            <td className="text-right px-3 py-3 font-medium">{formatCurrencyDisplay(item.subtotal)}</td>
                            <td className="px-3 py-3">
                              <div className="flex gap-1 items-center">
                                <button
                                  type="button"
                                  onClick={() => setEditingItemId(item.id)}
                                  className="text-[color:var(--muted-foreground)] hover:text-[color:var(--primary)] transition-colors"
                                  aria-label="Edit item"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteItem(category.id, item.id)}
                                  disabled={deleting}
                                  className={cn('text-[color:var(--muted-foreground)] hover:text-[color:var(--destructive)] transition-colors', deleting && 'opacity-50 cursor-not-allowed')}
                                  aria-label="Delete item"
                                >
                                  {deleting ? spinner : (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {/* Inline add-item row */}
                      <tr className="bg-[color:var(--muted)]/10">
                        <ItemRowCells
                          item={ni}
                          catalogItems={catalogItems}
                          itemSuggestions={itemSuggestions}
                          onChange={(field, val) => setNewField(category.id, field, val)}
                          onCatalogSelect={(c) => selectNewCatalog(category.id, c)}
                          actionButton={
                            <button
                              type="button"
                              onClick={() => handleAddItem(category.id)}
                              disabled={isSaving}
                              className={cn(
                                'w-8 h-8 flex items-center justify-center rounded-full',
                                'bg-[color:var(--primary)] text-white',
                                'hover:opacity-90 transition-opacity',
                                isSaving && 'opacity-50 cursor-not-allowed',
                              )}
                              aria-label="Add item"
                            >
                              {isSaving ? spinner : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              )}
                            </button>
                          }
                        />
                      </tr>
                    </tbody>
                  </table>
                </div>

                {catErr && <div className="px-6 py-2 text-sm text-red-600 dark:text-red-400">{catErr}</div>}

                {category.images && category.images.length > 0 && (
                  <div className="px-6 py-3 border-t border-[color:var(--border)] flex gap-2">
                    {category.images.map((url, idx) => (
                      <img key={idx} src={url} alt={`${category.name} ${idx + 1}`} className="w-16 h-16 object-cover rounded-md border border-[color:var(--border)]" />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========== Order Categories Tab ========== */}
      {budget && sortedCategories.length > 0 && activeTab === 'order' && (
        <div className="mb-8">
          <Text variant="muted" size="sm" className="mb-4">{t('orderCategoriesDescription')}</Text>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortedCategories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {sortedCategories.map((category, idx) => (
                  <SortableCategoryCard key={category.id} id={category.id}>
                    {(dragHandleProps) => (
                      <div className="flex items-center gap-3 px-4 py-3">
                        <button
                          type="button"
                          className="cursor-grab active:cursor-grabbing text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors touch-none"
                          aria-label="Drag to reorder"
                          {...dragHandleProps}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                          </svg>
                        </button>
                        <span className="text-sm font-medium text-[color:var(--muted-foreground)] w-6">{idx + 1}.</span>
                        <Text variant="default" className="font-medium flex-1">{category.name}</Text>
                        <Text variant="muted" size="sm">
                          {category.budget_items.length} {t('items').toLowerCase()}
                        </Text>
                      </div>
                    )}
                  </SortableCategoryCard>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* ========== Add Category Button + Done ========== */}
      {activeTab === 'budget' && (
        <div className="flex items-center justify-between mb-6">
          <Button variant="primary" onClick={() => setShowCategoryModal(true)}>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('addCategory')}
            </span>
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/budgets/${visitId}`)}>{t('done')}</Button>
        </div>
      )}

      {/* ========== Add Category Modal ========== */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={closeCategoryModal} />

          {/* Modal panel */}
          <div className="relative bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4 p-6">
            {/* Modal header */}
            <div className="flex items-center justify-between mb-6">
              <Heading variant="h3">{t('addCategory')}</Heading>
              <button
                type="button"
                onClick={closeCategoryModal}
                className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {categoryError && (
              <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg mb-4 text-sm">{categoryError}</div>
            )}

            {/* Name */}
            <div className="mb-6 space-y-2">
              <Label htmlFor="category-name">{t('categoryName')} <span className="text-[color:var(--destructive)]">*</span></Label>
              <Input
                id="category-name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder={t('categoryPlaceholder')}
                className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)]"
              />
            </div>

            {/* Images */}
            <div className="mb-6">
              <Label>{t('maxImages')}</Label>
              <div className="flex items-center gap-3 mt-2">
                {categoryImages.map((url, idx) => (
                  <div key={idx} className="relative group">
                    <img src={url} alt={`Upload ${idx + 1}`} className="w-20 h-20 object-cover rounded-md border border-[color:var(--border)]" />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >&times;</button>
                  </div>
                ))}
                {categoryImages.length < 3 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className={cn(
                      'w-20 h-20 border-2 border-dashed border-[color:var(--border)] rounded-md',
                      'flex items-center justify-center text-[color:var(--muted-foreground)]',
                      'hover:border-[color:var(--primary)] hover:text-[color:var(--primary)] transition-colors',
                      uploadingImage && 'opacity-50 cursor-not-allowed',
                    )}
                  >
                    {uploadingImage ? spinner : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </div>
            </div>

            {/* Items table */}
            <div className="mb-6">
              <Label className="mb-2 block">{t('items')}</Label>
              <div className="overflow-x-auto border border-[color:var(--border)] rounded-lg">
                <table className="w-full text-sm">
                  {tableHead}
                  <tbody>
                    {formItems.map((item, index) => (
                      <tr key={index} className="border-b border-[color:var(--border)] last:border-b-0">
                        <ItemRowCells
                          item={item}
                          catalogItems={catalogItems}
                          itemSuggestions={itemSuggestions}
                          onChange={(field, val) => setFormField(index, field, val)}
                          onCatalogSelect={(c) => selectFormCatalog(index, c)}
                          actionButton={
                            <button
                              type="button"
                              onClick={() => removeFormRow(index)}
                              disabled={formItems.length <= 1}
                              className={cn('text-[color:var(--muted-foreground)] hover:text-[color:var(--destructive)] transition-colors', formItems.length <= 1 && 'opacity-30 cursor-not-allowed')}
                              aria-label="Remove row"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          }
                        />
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[color:var(--muted)]/20">
                      <td className="px-3 py-2">
                        <button type="button" onClick={addFormRow} className="flex items-center gap-1 text-sm text-[color:var(--primary)] hover:underline">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          {t('addRow')}
                        </button>
                      </td>
                      <td colSpan={5} className="px-3 py-2 text-right font-medium text-[color:var(--muted-foreground)]">{t('categoryTotal')}</td>
                      <td className="px-3 py-2 text-right font-semibold text-[color:var(--foreground)]">{formatCurrencyDisplay(formTotal())}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={closeCategoryModal}>{t('common:actions.cancel')}</Button>
              <Button variant="primary" onClick={handleSaveCategory} disabled={savingCategory}>
                {savingCategory ? t('saving') : t('saveCategory')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>,
  );
}
