import { useState } from 'react';
import { Heading } from '../../../shared/components/atoms/Heading';
import { Text } from '../../../shared/components/atoms/Text';
import { Button } from '../../../shared/components/atoms/Button';
import { ImageUploadModal } from './ImageUploadModal';
import {
  addRenderingImage,
  deleteRenderingImage,
  uploadImage,
  type RenderingImage,
  type RenderingImageCreate,
} from '../../../infrastructure/api/api.client';

interface TabProposedMaterialsProps {
  renderingId: string;
  companyId: string;
  images: RenderingImage[];
  onRefresh: () => Promise<void>;
}

export function TabProposedMaterials({ renderingId, companyId, images, onRefresh }: TabProposedMaterialsProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const materialImages = images.filter((img) => img.image_type === 'material');

  const handleAddImage = async (file: File, title: string, _isFullPage: boolean) => {
    try {
      setSaving(true);
      setError(null);

      const uploadResult = await uploadImage(file, companyId, 'renderings');

      const imageData: RenderingImageCreate = {
        image_url: uploadResult.url,
        title: title || undefined,
        is_full_page: false,
        image_type: 'material',
        display_order: materialImages.length,
      };
      await addRenderingImage(renderingId, imageData, companyId);
      await onRefresh();
      setShowUploadModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add material image');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this material image?')) return;

    try {
      setSaving(true);
      setError(null);
      await deleteRenderingImage(renderingId, imageId, companyId);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Heading variant="h3">Proposed Materials</Heading>
        <Button variant="primary" size="sm" onClick={() => setShowUploadModal(true)}>
          + Add Material
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {materialImages.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {materialImages.map((image) => (
            <div key={image.id} className="relative group">
              <div className="aspect-square bg-[color:var(--muted)] rounded-lg overflow-hidden">
                <img
                  src={image.image_url}
                  alt={image.title || 'Material sample'}
                  className="w-full h-full object-cover"
                />
              </div>
              {image.title && (
                <Text variant="default" className="mt-2 font-medium truncate">
                  {image.title}
                </Text>
              )}
              {image.description && (
                <Text variant="muted" size="sm" className="truncate">
                  {image.description}
                </Text>
              )}
              <button
                onClick={() => handleDeleteImage(image.id)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete material"
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
          <Text variant="muted">No material samples added yet.</Text>
          <Text variant="muted" size="sm" className="mt-1">
            Upload material samples like countertops, flooring, tiles, etc.
          </Text>
        </div>
      )}

      {showUploadModal && (
        <ImageUploadModal
          imageType="material"
          onClose={() => setShowUploadModal(false)}
          onAdd={handleAddImage}
          saving={saving}
        />
      )}
    </div>
  );
}
