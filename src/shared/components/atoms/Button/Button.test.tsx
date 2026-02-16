import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../../test/test-utils';
import { Button } from './Button';

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const { user } = render(<Button onClick={handleClick}>Click me</Button>);
    
    await user.click(screen.getByText('Click me'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should render primary variant by default', () => {
    render(<Button>Primary</Button>);
    
    const button = screen.getByText('Primary');
    expect(button).toBeInTheDocument();
  });

  it('should render secondary variant', () => {
    render(<Button variant="secondary">Secondary</Button>);
    
    const button = screen.getByText('Secondary');
    expect(button).toBeInTheDocument();
  });

  it('should render danger variant', () => {
    render(<Button variant="danger">Danger</Button>);
    
    const button = screen.getByText('Danger');
    expect(button).toBeInTheDocument();
  });

  it('should render ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    
    const button = screen.getByText('Ghost');
    expect(button).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    
    const button = screen.getByText('Disabled');
    expect(button).toBeDisabled();
  });

  it('should not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    const { user } = render(
      <Button disabled onClick={handleClick}>
        Disabled
      </Button>
    );
    
    await user.click(screen.getByText('Disabled'));
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    render(<Button className="custom-class">Custom</Button>);
    
    const button = screen.getByText('Custom');
    expect(button.className).toContain('custom-class');
  });

  it('should render with type="submit"', () => {
    render(<Button type="submit">Submit</Button>);
    
    const button = screen.getByText('Submit');
    expect(button).toHaveAttribute('type', 'submit');
  });
});
