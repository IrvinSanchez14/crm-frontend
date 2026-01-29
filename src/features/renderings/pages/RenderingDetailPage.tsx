/**
 * Rendering Detail Page
 * Full-page view for managing rendering with images and items
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../../../shared/components/organisms/Header';
import { Sidebar } from '../../../shared/components/organisms/Sidebar';
import { useAuth } from '../../../shared/hooks/useAuth';
import { Heading } from '../../../shared/components/atoms/Heading';
import { Text } from '../../../shared/components/atoms/Text';
import { Button } from '../../../shared/components/atoms/Button';
import { Label } from '../../../shared/components/atoms/Label/Label';
import { cn } from '../../../core/utils/cn';
import {
  getRendering,
  updateRendering,
  addRenderingImage,
  deleteRenderingImage,
  addRenderingItem,
  updateRenderingItem,
  deleteRenderingItem,
  generateRenderingPDF,
  uploadImage,
  type RenderingDetail,
  type RenderingUpdate,
  type RenderingImage,
  type RenderingItem,
  type RenderingImageCreate,
  type RenderingItemCreate,
  type RenderingItemUpdate,
  type RenderingStatus
} from '../../../infrastructure/api/api.client';
import { decodeJwt } from '../../../core/utils/jwt.utils';

export function RenderingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [rendering, setRendering] = useState<RenderingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<RenderingUpdate>({});

  // Modal states
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<RenderingItem | null>(null);

  // Get company_id from JWT token
  const getCompanyId = useCallback((): string | null => {
    if (!user?.access_token) return null;
    const payload = decodeJwt(user.access_token);
    return payload?.company_id || null;
  }, [user]);

  // Fetch rendering data
  const fetchRendering = useCallback(async () => {
    if (!id) return;

    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getRendering(id, companyId);
      setRendering(data);
      setFormData({
        title: data.title,
        description: data.description || undefined,
        status: data.status,
        expiration_date: data.expiration_date || undefined,
        notes: data.notes || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rendering');
    } finally {
      setLoading(false);
    }
  }, [id, getCompanyId]);

  useEffect(() => {
    fetchRendering();
  }, [fetchRendering]);

  const handleChange = (field: keyof RenderingUpdate) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (error) setError(null);
  };

  const handleSave = async () => {
    if (!id || !rendering) return;

    const companyId = getCompanyId();
    if (!companyId) {
      setError('Company ID not found. Please log in again.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await updateRendering(id, formData, companyId);
      await fetchRendering();
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update rendering');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (rendering) {
      setFormData({
        title: rendering.title,
        description: rendering.description || undefined,
        status: rendering.status,
        expiration_date: rendering.expiration_date || undefined,
        notes: rendering.notes || undefined,
      });
    }
    setIsEditing(false);
  };

  // Image handlers
  const handleAddImage = async (file: File, title: string, isFullPage: boolean) => {
    if (!id) return;

    const companyId = getCompanyId();
    if (!companyId) return;

    try {
      setSaving(true);

      // Upload file to R2 storage
      const uploadResult = await uploadImage(file, companyId, 'renderings');

      // Add image reference to rendering
      const imageData: RenderingImageCreate = {
        image_url: uploadResult.url,
        title: title || undefined,
        is_full_page: isFullPage,
        display_order: (rendering?.images.length || 0),
      };
      await addRenderingImage(id, imageData, companyId);
      await fetchRendering();
      setShowAddImageModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add image');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!id) return;

    const companyId = getCompanyId();
    if (!companyId) return;

    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      setSaving(true);
      await deleteRenderingImage(id, imageId, companyId);
      await fetchRendering();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    } finally {
      setSaving(false);
    }
  };

  // Item handlers
  const handleAddItem = async (itemData: RenderingItemCreate) => {
    if (!id) return;

    const companyId = getCompanyId();
    if (!companyId) return;

    try {
      setSaving(true);
      await addRenderingItem(id, itemData, companyId);
      await fetchRendering();
      setShowAddItemModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add item');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateItem = async (itemId: string, itemData: RenderingItemUpdate) => {
    if (!id) return;

    const companyId = getCompanyId();
    if (!companyId) return;

    try {
      setSaving(true);
      await updateRenderingItem(id, itemId, itemData, companyId);
      await fetchRendering();
      setEditingItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!id) return;

    const companyId = getCompanyId();
    if (!companyId) return;

    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      setSaving(true);
      await deleteRenderingItem(id, itemId, companyId);
      await fetchRendering();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    } finally {
      setSaving(false);
    }
  };

  // Generate PDF
  const handleGeneratePDF = async () => {
    if (!id) return;

    const companyId = getCompanyId();
    if (!companyId) return;

    try {
      setGeneratingPDF(true);
      const blob = await generateRenderingPDF(id, companyId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rendering_${rendering?.title || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const statusColors: Record<RenderingStatus, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  // Get material samples and detail items
  const materialSamples = rendering?.items.filter(item => item.show_in_materials_page) || [];
  const detailItems = rendering?.items.filter(item => item.show_in_details_page) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[color:var(--background)]">
        <Header
          userName={user?.name || user?.email || 'User'}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          onLogout={logout}
        />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main
          className={cn(
            'w-full pt-5',
            'transition-all duration-500 ease-out',
            isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
          )}
        >
          <div className="p-6 flex items-center justify-center">
            <Text variant="muted">Loading rendering...</Text>
          </div>
        </main>
      </div>
    );
  }

  if (error && !rendering) {
    return (
      <div className="min-h-screen bg-[color:var(--background)]">
        <Header
          userName={user?.name || user?.email || 'User'}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
          onLogout={logout}
        />
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main
          className={cn(
            'w-full pt-5',
            'transition-all duration-500 ease-out',
            isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
          )}
        >
          <div className="p-6">
            <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg mb-4">
              {error}
            </div>
            <Button variant="secondary" onClick={() => navigate('/renderings')}>
              Back to Renderings
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      <Header
        userName={user?.name || user?.email || 'User'}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onLogout={logout}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main
        className={cn(
          'w-full pt-5',
          'transition-all duration-500 ease-out',
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        )}
      >
        <div className="p-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/renderings')}
              aria-label="Back to renderings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <div className="flex-1">
              <Heading variant="h1">{rendering?.title}</Heading>
              {rendering?.visit && (
                <Text variant="muted" size="sm">Visit: {rendering.visit.title}</Text>
              )}
            </div>
            <Button
              variant="primary"
              onClick={handleGeneratePDF}
              disabled={generatingPDF}
            >
              {generatingPDF ? 'Generating...' : 'Generate PDF'}
            </Button>
            {!isEditing && (
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Rendering Info Card */}
          <div className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] p-6 mb-6">
            <Heading variant="h3" className="mb-4">Rendering Information</Heading>

            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <input
                      id="title"
                      type="text"
                      value={formData.title || ''}
                      onChange={handleChange('title')}
                      disabled={saving}
                      className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={formData.status || 'draft'}
                      onChange={handleChange('status')}
                      disabled={saving}
                      className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expiration_date">Expiration Date</Label>
                    <input
                      id="expiration_date"
                      type="date"
                      value={formData.expiration_date || ''}
                      onChange={handleChange('expiration_date')}
                      disabled={saving}
                      className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={handleChange('description')}
                    disabled={saving}
                    rows={2}
                    className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)] resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="secondary" onClick={handleCancelEdit} disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Text variant="muted" className="text-xs mb-1">Status</Text>
                  <span className={cn('inline-block px-2 py-1 rounded-full text-xs font-medium', statusColors[rendering?.status || 'draft'])}>
                    {rendering?.status.toUpperCase()}
                  </span>
                </div>
                <div>
                  <Text variant="muted" className="text-xs mb-1">Expiration</Text>
                  <Text variant="default">
                    {rendering?.expiration_date ? new Date(rendering.expiration_date).toLocaleDateString() : '—'}
                  </Text>
                </div>
                <div>
                  <Text variant="muted" className="text-xs mb-1">Created</Text>
                  <Text variant="default">
                    {rendering?.created_at ? new Date(rendering.created_at).toLocaleDateString() : '—'}
                  </Text>
                </div>
                {rendering?.description && (
                  <div className="md:col-span-3">
                    <Text variant="muted" className="text-xs mb-1">Description</Text>
                    <Text variant="default">{rendering.description}</Text>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Project Images Section */}
          <div className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <Heading variant="h3">Project Images</Heading>
              <Button variant="primary" size="sm" onClick={() => setShowAddImageModal(true)}>
                + Add Image
              </Button>
            </div>

            {rendering?.images && rendering.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {rendering.images.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-video bg-[color:var(--muted)] rounded-lg overflow-hidden">
                      <img
                        src={image.image_url}
                        alt={image.title || 'Project image'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {image.title && (
                      <Text variant="muted" size="sm" className="mt-1 truncate">
                        {image.title}
                      </Text>
                    )}
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Delete image"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-[color:var(--muted)] rounded-lg text-center">
                <Text variant="muted">No project images uploaded yet.</Text>
                <Text variant="muted" size="sm" className="mt-1">
                  Upload 3D renderings or photos of the project.
                </Text>
              </div>
            )}
          </div>

          {/* Proposed Materials Section */}
          <div className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <Heading variant="h3">Proposed Materials</Heading>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingItem(null);
                  setShowAddItemModal(true);
                }}
              >
                + Add Material
              </Button>
            </div>

            {materialSamples.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {materialSamples.map((item) => (
                  <div key={item.id} className="relative group">
                    <div className="aspect-square bg-[color:var(--muted)] rounded-lg overflow-hidden">
                      {item.material_image_url ? (
                        <img
                          src={item.material_image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Text variant="muted">No image</Text>
                        </div>
                      )}
                    </div>
                    <Text variant="default" className="mt-2 font-medium">
                      {item.category}
                    </Text>
                    <Text variant="muted" size="sm">{item.name}</Text>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-1 bg-blue-500 text-white rounded-full"
                        aria-label="Edit item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 bg-red-500 text-white rounded-full"
                        aria-label="Delete item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-[color:var(--muted)] rounded-lg text-center">
                <Text variant="muted">No materials added yet.</Text>
                <Text variant="muted" size="sm" className="mt-1">
                  Add material samples like countertop, flooring, tiles, etc.
                </Text>
              </div>
            )}
          </div>

          {/* Item Details Section */}
          <div className="bg-[color:var(--card)] rounded-lg border border-[color:var(--border)] p-6">
            <div className="flex items-center justify-between mb-4">
              <Heading variant="h3">Item Details</Heading>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setEditingItem(null);
                  setShowAddItemModal(true);
                }}
              >
                + Add Item
              </Button>
            </div>

            {detailItems.length > 0 ? (
              <div className="space-y-4">
                {detailItems.map((item) => (
                  <div
                    key={item.id}
                    className="border border-[color:var(--border)] rounded-lg p-4 relative group"
                  >
                    <div className="flex gap-4">
                      {item.product_image_url && (
                        <div className="w-32 h-32 flex-shrink-0 bg-[color:var(--muted)] rounded-lg overflow-hidden">
                          <img
                            src={item.product_image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <Text variant="default" className="font-semibold text-lg">
                              {item.category}
                            </Text>
                            <Text variant="muted">{item.name}</Text>
                          </div>
                          {item.total && (
                            <Text variant="default" className="font-semibold text-lg">
                              ${parseFloat(item.total).toFixed(2)}
                            </Text>
                          )}
                        </div>

                        {item.specifications && Object.keys(item.specifications).length > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {Object.entries(item.specifications).map(([key, value]) => (
                              <div key={key}>
                                <Text variant="muted" size="sm">{key}:</Text>
                                <Text variant="default" size="sm">{value}</Text>
                              </div>
                            ))}
                          </div>
                        )}

                        {item.notes && (
                          <Text variant="muted" size="sm" className="mt-2 italic">
                            {item.notes}
                          </Text>
                        )}
                      </div>
                    </div>

                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingItem(item)}
                        className="p-1 bg-blue-500 text-white rounded-full"
                        aria-label="Edit item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 bg-red-500 text-white rounded-full"
                        aria-label="Delete item"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-[color:var(--muted)] rounded-lg text-center">
                <Text variant="muted">No items added yet.</Text>
                <Text variant="muted" size="sm" className="mt-1">
                  Add detailed items like cabinets, hardware, countertops with specs and pricing.
                </Text>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Image Modal */}
      {showAddImageModal && (
        <AddImageModal
          onClose={() => setShowAddImageModal(false)}
          onAdd={handleAddImage}
          saving={saving}
        />
      )}

      {/* Add/Edit Item Modal */}
      {(showAddItemModal || editingItem) && (
        <ItemModal
          item={editingItem}
          onClose={() => {
            setShowAddItemModal(false);
            setEditingItem(null);
          }}
          onAdd={handleAddItem}
          onUpdate={editingItem ? (data) => handleUpdateItem(editingItem.id, data) : undefined}
          saving={saving}
        />
      )}
    </div>
  );
}

// Add Image Modal Component
function AddImageModal({
  onClose,
  onAdd,
  saving
}: {
  onClose: () => void;
  onAdd: (file: File, title: string, isFullPage: boolean) => void;
  saving: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [isFullPage, setIsFullPage] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(selectedFile.type)) {
        alert('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
        return;
      }
      // Validate file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      // Create a synthetic event to reuse validation logic
      const syntheticEvent = {
        target: { files: [droppedFile] }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(syntheticEvent);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[color:var(--card)] rounded-lg p-6 w-full max-w-md mx-4">
        <Heading variant="h3" className="mb-4">Add Project Image</Heading>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="image_file">Image File *</Label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-[color:var(--border)] rounded-lg p-4 text-center cursor-pointer hover:border-[color:var(--primary)] transition-colors"
              onClick={() => document.getElementById('image_file')?.click()}
            >
              {preview ? (
                <div className="space-y-2">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-48 mx-auto rounded-lg object-contain"
                  />
                  <Text variant="muted" size="sm">{file?.name}</Text>
                </div>
              ) : (
                <div className="py-8">
                  <Text variant="muted">Drag and drop an image here, or click to select</Text>
                  <Text variant="muted" size="sm" className="mt-1">JPEG, PNG, WebP, GIF (max 10MB)</Text>
                </div>
              )}
              <input
                id="image_file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_title">Title</Label>
            <input
              id="image_title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Top View, Perspective"
              className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isFullPage}
              onChange={(e) => setIsFullPage(e.target.checked)}
              className="rounded"
            />
            <Text variant="default">Full page image in PDF</Text>
          </label>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="primary"
            onClick={() => file && onAdd(file, title, isFullPage)}
            disabled={saving || !file}
            className="flex-1"
          >
            {saving ? 'Uploading...' : 'Upload Image'}
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={saving} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

// Item Modal Component
function ItemModal({
  item,
  onClose,
  onAdd,
  onUpdate,
  saving
}: {
  item: RenderingItem | null;
  onClose: () => void;
  onAdd: (data: RenderingItemCreate) => void;
  onUpdate?: (data: RenderingItemUpdate) => void;
  saving: boolean;
}) {
  const [formData, setFormData] = useState({
    category: item?.category || '',
    name: item?.name || '',
    is_material_sample: item?.is_material_sample || false,
    material_image_url: item?.material_image_url || '',
    product_image_url: item?.product_image_url || '',
    subtotal: item?.subtotal || '',
    tax: item?.tax || '',
    total: item?.total || '',
    show_in_materials_page: item?.show_in_materials_page || false,
    show_in_details_page: item?.show_in_details_page ?? true,
    notes: item?.notes || '',
    disclaimer: item?.disclaimer || '',
  });

  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>(
    item?.specifications
      ? Object.entries(item.specifications).map(([key, value]) => ({ key, value }))
      : [{ key: '', value: '' }]
  );

  const handleSubmit = () => {
    const specifications: Record<string, string> = {};
    specs.forEach(({ key, value }) => {
      if (key.trim() && value.trim()) {
        specifications[key.trim()] = value.trim();
      }
    });

    const data = {
      ...formData,
      specifications: Object.keys(specifications).length > 0 ? specifications : undefined,
      subtotal: formData.subtotal || undefined,
      tax: formData.tax || undefined,
      total: formData.total || undefined,
      material_image_url: formData.material_image_url || undefined,
      product_image_url: formData.product_image_url || undefined,
      notes: formData.notes || undefined,
      disclaimer: formData.disclaimer || undefined,
    };

    if (item && onUpdate) {
      onUpdate(data);
    } else {
      onAdd(data);
    }
  };

  const addSpec = () => setSpecs([...specs, { key: '', value: '' }]);
  const removeSpec = (index: number) => setSpecs(specs.filter((_, i) => i !== index));
  const updateSpec = (index: number, field: 'key' | 'value', value: string) => {
    const newSpecs = [...specs];
    newSpecs[index][field] = value;
    setSpecs(newSpecs);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
      <div className="bg-[color:var(--card)] rounded-lg p-6 w-full max-w-2xl mx-4 my-auto">
        <Heading variant="h3" className="mb-4">
          {item ? 'Edit Item' : 'Add Item'}
        </Heading>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <input
                id="category"
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Cabinets, Countertop"
                className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Item name"
                className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
              />
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.show_in_materials_page}
                onChange={(e) => setFormData({ ...formData, show_in_materials_page: e.target.checked })}
                className="rounded"
              />
              <Text variant="default" size="sm">Show in Materials Page</Text>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.show_in_details_page}
                onChange={(e) => setFormData({ ...formData, show_in_details_page: e.target.checked })}
                className="rounded"
              />
              <Text variant="default" size="sm">Show in Details Page</Text>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="material_image_url">Material Image URL</Label>
              <input
                id="material_image_url"
                type="url"
                value={formData.material_image_url}
                onChange={(e) => setFormData({ ...formData, material_image_url: e.target.value })}
                placeholder="For materials page"
                className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product_image_url">Product Image URL</Label>
              <input
                id="product_image_url"
                type="url"
                value={formData.product_image_url}
                onChange={(e) => setFormData({ ...formData, product_image_url: e.target.value })}
                placeholder="For details page"
                className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
              />
            </div>
          </div>

          {/* Specifications */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Specifications</Label>
              <Button variant="secondary" size="sm" onClick={addSpec}>
                + Add Spec
              </Button>
            </div>
            {specs.map((spec, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={spec.key}
                  onChange={(e) => updateSpec(index, 'key', e.target.value)}
                  placeholder="Key (e.g., Door Style)"
                  className="flex-1 px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
                />
                <input
                  type="text"
                  value={spec.value}
                  onChange={(e) => updateSpec(index, 'value', e.target.value)}
                  placeholder="Value"
                  className="flex-1 px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
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

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subtotal">Subtotal</Label>
              <input
                id="subtotal"
                type="number"
                step="0.01"
                value={formData.subtotal}
                onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax">Tax</Label>
              <input
                id="tax"
                type="number"
                step="0.01"
                value={formData.tax}
                onChange={(e) => setFormData({ ...formData, tax: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total">Total</Label>
              <input
                id="total"
                type="number"
                step="0.01"
                value={formData.total}
                onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <input
              id="notes"
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g., Labor not included"
              className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={saving || !formData.category || !formData.name}
            className="flex-1"
          >
            {saving ? 'Saving...' : item ? 'Update Item' : 'Add Item'}
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={saving} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
