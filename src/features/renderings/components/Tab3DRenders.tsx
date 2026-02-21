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

interface Tab3DRendersProps {
  renderingId: string;
  companyId: string;
  images: RenderingImage[];
  onRefresh: () => Promise<void>;
}

export function Tab3DRenders({ renderingId, companyId, images, onRefresh }: Tab3DRendersProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectImages = images.filter((img) => img.image_type === 'project');

  const handleAddImage = async (file: File, title: string, isFullPage: boolean) => {
    try {
      setSaving(true);
      setError(null);

      const uploadResult = await uploadImage(file, companyId, 'renderings');

      const imageData: RenderingImageCreate = {
        image_url: uploadResult.url,
        title: title || undefined,
        is_full_page: isFullPage,
        image_type: 'project',
        display_order: projectImages.length,
      };
      await addRenderingImage(renderingId, imageData, companyId);
      await onRefresh();
      setShowUploadModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add image');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;

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
        <Heading variant="h3">3D Renders</Heading>
        <Button variant="primary" size="sm" onClick={() => setShowUploadModal(true)}>
          + Add Image
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {projectImages.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {projectImages.map((image) => (
            <div key={image.id} className="relative group">
              <div className="aspect-video bg-[color:var(--muted)] rounded-lg overflow-hidden">
                <img
                  src={image.image_url}
                  alt={image.title || 'Project render'}
                  className="w-full h-full object-cover"
                />
              </div>
              {image.title && (
                <Text variant="muted" size="sm" className="mt-1 truncate">
                  {image.title}
                </Text>
              )}
              {image.is_full_page && (
                <Text variant="muted" size="sm" className="text-xs italic">
                  Full page in PDF
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
          <Text variant="muted">No 3D render images uploaded yet.</Text>
          <Text variant="muted" size="sm" className="mt-1">
            Upload SketchUp renders, perspectives, or project visualizations.
          </Text>
        </div>
      )}

      {showUploadModal && (
        <ImageUploadModal
          imageType="project"
          onClose={() => setShowUploadModal(false)}
          onAdd={handleAddImage}
          saving={saving}
        />
      )}
    </div>
  );
}
