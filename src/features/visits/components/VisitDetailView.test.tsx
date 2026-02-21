/**
 * Tests for VisitDetailView component (sidebar version)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { VisitDetailView } from './VisitDetailView';
import type { VisitDetail } from '../../../infrastructure/api/api.client';

const mockVisit: VisitDetail = {
  id: '123',
  title: 'Site Inspection #1',
  description: 'Full site walkthrough',
  status: 'planning',
  visit_date: '2026-02-15',
  inspection_notes: '<p>Foundation looks good</p>',
  estimated_materials_cost: '5000.00',
  estimated_labor_cost: '3000.00',
  estimated_total_cost: '8000.00',
  images: null,
  attachments: null,
  visit_items: null,
  project_id: 'proj-1',
  created_by_user_id: 'user-1',
  edited_by_user_id: null,
  created_by_name: 'John Doe',
  edited_by_name: null,
  created_at: '2026-02-15T10:00:00Z',
  updated_at: '2026-02-15T10:00:00Z',
};

describe('VisitDetailView', () => {
  const defaultProps = {
    visit: mockVisit,
    onCancel: vi.fn(),
    onSuccess: vi.fn(),
  };

  it('renders visit title', () => {
    render(<VisitDetailView {...defaultProps} />);

    expect(screen.getByText('Site Inspection #1')).toBeInTheDocument();
  });

  it('renders visit status badge', () => {
    render(<VisitDetailView {...defaultProps} />);

    expect(screen.getByText('PLANNING')).toBeInTheDocument();
  });

  it('renders description when present', () => {
    render(<VisitDetailView {...defaultProps} />);

    expect(screen.getByText('Full site walkthrough')).toBeInTheDocument();
  });

  it('renders visit date when present', () => {
    render(<VisitDetailView {...defaultProps} />);

    // The date will be formatted by toLocaleDateString
    expect(screen.getByText('Visit Date')).toBeInTheDocument();
  });

  it('renders cost estimates', () => {
    render(<VisitDetailView {...defaultProps} />);

    expect(screen.getByText('$5000.00')).toBeInTheDocument();
    expect(screen.getByText('$3000.00')).toBeInTheDocument();
    expect(screen.getByText('$8000.00')).toBeInTheDocument();
  });

  it('does not show edit button (read-only)', () => {
    render(<VisitDetailView {...defaultProps} />);

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('does not show budget section', () => {
    render(<VisitDetailView {...defaultProps} />);

    expect(screen.queryByText('Budget')).not.toBeInTheDocument();
    expect(screen.queryByText('Create Budget')).not.toBeInTheDocument();
  });

  it('renders inspection notes as HTML', () => {
    render(<VisitDetailView {...defaultProps} />);

    expect(screen.getByText('Foundation looks good')).toBeInTheDocument();
  });

  it('hides optional fields when null', () => {
    const visitNoOptionals: VisitDetail = {
      ...mockVisit,
      description: null,
      visit_date: null,
      inspection_notes: null,
      estimated_materials_cost: null,
      estimated_labor_cost: null,
      estimated_total_cost: null,
    };

    render(<VisitDetailView {...defaultProps} visit={visitNoOptionals} />);

    expect(screen.queryByText('Description')).not.toBeInTheDocument();
    expect(screen.queryByText('Visit Date')).not.toBeInTheDocument();
    expect(screen.queryByText('Inspection Notes')).not.toBeInTheDocument();
    expect(screen.queryByText('Cost Estimates')).not.toBeInTheDocument();
  });
});
