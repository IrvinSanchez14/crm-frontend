import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../../test/test-utils';
import { FormField } from './FormField';

describe('FormField', () => {
  it('should render input field with label', () => {
    render(
      <FormField
        label="Project Name"
        type="text"
        value=""
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Project Name')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should call onChange when value changes', async () => {
    const handleChange = vi.fn();
    const { user } = render(
      <FormField
        label="Project Name"
        type="text"
        value=""
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'Test');

    expect(handleChange).toHaveBeenCalled();
  });

  it('should display the provided value', () => {
    render(
      <FormField
        label="Project Name"
        type="text"
        value="My Project"
        onChange={vi.fn()}
      />
    );

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('My Project');
  });

  it('should render as disabled when disabled prop is true', () => {
    render(
      <FormField
        label="Project Name"
        type="text"
        value=""
        onChange={vi.fn()}
        disabled
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('should render with placeholder', () => {
    render(
      <FormField
        label="Project Name"
        type="text"
        value=""
        onChange={vi.fn()}
        placeholder="Enter project name"
      />
    );

    const input = screen.getByPlaceholderText('Enter project name');
    expect(input).toBeInTheDocument();
  });

  it('should render required field', () => {
    render(
      <FormField
        label="Project Name"
        type="text"
        value=""
        onChange={vi.fn()}
        required
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeRequired();
  });

  it('should render date input', () => {
    render(
      <FormField
        label="Start Date"
        type="date"
        value=""
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Start Date')).toBeInTheDocument();
  });

  it('should display error message when provided', () => {
    render(
      <FormField
        label="Project Name"
        type="text"
        value=""
        onChange={vi.fn()}
        error="This field is required"
      />
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });
});
