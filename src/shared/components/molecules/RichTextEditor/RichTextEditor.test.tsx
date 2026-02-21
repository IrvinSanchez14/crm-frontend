/**
 * Tests for RichTextEditor component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../../test/test-utils';

// Mock react-quill-new since it requires a full browser DOM
vi.mock('react-quill-new', () => {
  return {
    __esModule: true,
    default: ({ value, onChange, placeholder, readOnly }: {
      value: string;
      onChange: (val: string) => void;
      placeholder?: string;
      readOnly?: boolean;
      theme?: string;
      modules?: unknown;
      formats?: string[];
    }) => (
      <div data-testid="quill-editor">
        <textarea
          data-testid="quill-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      </div>
    ),
  };
});

vi.mock('react-quill-new/dist/quill.snow.css', () => ({}));

import { RichTextEditor } from './RichTextEditor';

describe('RichTextEditor', () => {
  it('renders without crashing', () => {
    render(
      <RichTextEditor value="" onChange={() => {}} />
    );

    expect(screen.getByTestId('quill-editor')).toBeInTheDocument();
  });

  it('renders with a label when provided', () => {
    render(
      <RichTextEditor value="" onChange={() => {}} label="Inspection Notes" />
    );

    expect(screen.getByText('Inspection Notes')).toBeInTheDocument();
  });

  it('does not render label when not provided', () => {
    render(
      <RichTextEditor value="" onChange={() => {}} />
    );

    expect(screen.queryByText('Inspection Notes')).not.toBeInTheDocument();
  });

  it('passes value to the editor', () => {
    render(
      <RichTextEditor value="<p>Hello world</p>" onChange={() => {}} />
    );

    const textarea = screen.getByTestId('quill-textarea');
    expect(textarea).toHaveValue('<p>Hello world</p>');
  });

  it('calls onChange when editor content changes', async () => {
    const handleChange = vi.fn();
    const { user } = render(
      <RichTextEditor value="" onChange={handleChange} />
    );

    const textarea = screen.getByTestId('quill-textarea');
    await user.type(textarea, 'New text');

    expect(handleChange).toHaveBeenCalled();
  });

  it('passes placeholder to the editor', () => {
    render(
      <RichTextEditor
        value=""
        onChange={() => {}}
        placeholder="Enter notes..."
      />
    );

    const textarea = screen.getByTestId('quill-textarea');
    expect(textarea).toHaveAttribute('placeholder', 'Enter notes...');
  });

  it('applies disabled styling when disabled', () => {
    const { container } = render(
      <RichTextEditor value="" onChange={() => {}} disabled />
    );

    const wrapper = container.querySelector('.opacity-50');
    expect(wrapper).toBeInTheDocument();
  });
});
