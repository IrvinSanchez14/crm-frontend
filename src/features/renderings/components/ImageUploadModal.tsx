import { useState } from 'react';
import { Heading } from '../../../shared/components/atoms/Heading';
import { Text } from '../../../shared/components/atoms/Text';
import { Label } from '../../../shared/components/atoms/Label/Label';
import { Button } from '../../../shared/components/atoms/Button';

interface ImageUploadModalProps {
  imageType: 'project' | 'material';
  onClose: () => void;
  onAdd: (file: File, title: string, isFullPage: boolean) => void;
  saving: boolean;
}

export function ImageUploadModal({ imageType, onClose, onAdd, saving }: ImageUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [isFullPage, setIsFullPage] = useState(imageType === 'project');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(selectedFile.type)) {
        alert('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
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
      const syntheticEvent = {
        target: { files: [droppedFile] },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(syntheticEvent);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const modalTitle = imageType === 'project' ? 'Add 3D Render Image' : 'Add Material Image';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[color:var(--card)] rounded-lg p-6 w-full max-w-md mx-4">
        <Heading variant="h3" className="mb-4">{modalTitle}</Heading>

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
              placeholder={imageType === 'project' ? 'e.g., Top View, Perspective' : 'e.g., Countertop, Floor Tile'}
              className="w-full px-3 py-2 border border-[color:var(--border)] rounded-lg bg-[color:var(--background)] text-[color:var(--foreground)]"
            />
          </div>

          {imageType === 'project' && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isFullPage}
                onChange={(e) => setIsFullPage(e.target.checked)}
                className="rounded"
              />
              <Text variant="default">Full page image in PDF</Text>
            </label>
          )}
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
