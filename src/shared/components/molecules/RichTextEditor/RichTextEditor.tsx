/**
 * RichTextEditor Component
 * Wraps react-quill-new with theme-aware styling and a standard toolbar.
 */

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { Text } from '../../atoms/Text';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['clean'],
  ],
};

const formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'list',
];

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  disabled = false,
  label,
}: RichTextEditorProps) {
  return (
    <div className="rich-text-editor">
      {label && (
        <Text size="sm" className="font-medium mb-2 block">
          {label}
        </Text>
      )}
      <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={disabled}
          modules={modules}
          formats={formats}
        />
      </div>
      <style>{`
        .rich-text-editor .ql-toolbar {
          border-color: var(--border);
          background: var(--muted);
          border-radius: 0.5rem 0.5rem 0 0;
        }
        .rich-text-editor .ql-container {
          border-color: var(--border);
          background: var(--background);
          border-radius: 0 0 0.5rem 0.5rem;
          min-height: 150px;
          font-family: inherit;
          font-size: 0.875rem;
        }
        .rich-text-editor .ql-editor {
          min-height: 150px;
          color: var(--foreground);
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: var(--muted-foreground);
          font-style: normal;
        }
        .rich-text-editor .ql-stroke {
          stroke: var(--foreground) !important;
        }
        .rich-text-editor .ql-fill {
          fill: var(--foreground) !important;
        }
        .rich-text-editor .ql-picker-label {
          color: var(--foreground) !important;
        }
        .rich-text-editor .ql-picker-options {
          background: var(--card) !important;
          border-color: var(--border) !important;
        }
        .rich-text-editor .ql-picker-item {
          color: var(--foreground) !important;
        }
        .rich-text-editor .ql-toolbar button:hover .ql-stroke,
        .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: var(--primary) !important;
        }
        .rich-text-editor .ql-toolbar button:hover .ql-fill,
        .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
          fill: var(--primary) !important;
        }
      `}</style>
    </div>
  );
}
