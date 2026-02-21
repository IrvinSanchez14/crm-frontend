/**
 * Tests for VisitDetailPage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../../../test/test-utils';
import { VisitDetailPage } from './VisitDetailPage';

// Mock react-router-dom hooks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'visit-123' }),
    useNavigate: () => mockNavigate,
  };
});

// Mock react-quill-new
vi.mock('react-quill-new', () => ({
  __esModule: true,
  default: ({ value, onChange, placeholder }: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
  }) => (
    <textarea
      data-testid="quill-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));
vi.mock('react-quill-new/dist/quill.snow.css', () => ({}));

// Mock useAuth
vi.mock('../../../shared/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { name: 'Test User', email: 'test@test.com', access_token: 'mock-token' },
    logout: vi.fn(),
  }),
}));

// Mock JWT decode
vi.mock('../../../core/utils/jwt.utils', () => ({
  decodeJwt: () => ({ company_id: 'company-123' }),
}));

// Mock API
const mockGetVisit = vi.fn();
const mockGetProjects = vi.fn();
const mockUpdateVisit = vi.fn();

vi.mock('../../../infrastructure/api/api.client', () => ({
  getVisit: (...args: unknown[]) => mockGetVisit(...args),
  getProjects: (...args: unknown[]) => mockGetProjects(...args),
  updateVisit: (...args: unknown[]) => mockUpdateVisit(...args),
}));

// Mock VisitAttachmentSection
vi.mock('../components/VisitAttachmentSection', () => ({
  VisitAttachmentSection: ({ visitId }: { visitId: string }) => (
    <div data-testid="visit-attachment-section">Attachments for {visitId}</div>
  ),
}));

const mockVisitData = {
  id: 'visit-123',
  title: 'Test Visit',
  description: 'Visit description',
  status: 'planning' as const,
  visit_date: '2026-02-15',
  inspection_notes: '<p>Some notes</p>',
  estimated_materials_cost: '1000.00',
  estimated_labor_cost: '500.00',
  estimated_total_cost: '1500.00',
  images: null,
  attachments: null,
  visit_items: null,
  project_id: 'project-123',
  created_by_user_id: 'user-1',
  edited_by_user_id: null,
  created_by_name: 'Test User',
  edited_by_name: null,
  created_at: '2026-02-15T10:00:00Z',
  updated_at: '2026-02-15T10:00:00Z',
};

const mockProjectData = [
  {
    id: 'project-123',
    name: 'Test Project',
  },
];

describe('VisitDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetVisit.mockResolvedValue(mockVisitData);
    mockGetProjects.mockResolvedValue(mockProjectData);
    mockUpdateVisit.mockResolvedValue(mockVisitData);
  });

  it('shows loading state initially', () => {
    // Delay the resolve to show loading state
    mockGetVisit.mockImplementation(() => new Promise(() => {}));

    render(<VisitDetailPage />);

    expect(screen.getByText('Loading visit...')).toBeInTheDocument();
  });

  it('renders visit title after loading', async () => {
    render(<VisitDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Visit')).toBeInTheDocument();
    });
  });

  it('renders project name after loading', async () => {
    render(<VisitDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Project: Test Project')).toBeInTheDocument();
    });
  });

  it('does not show Edit Visit button (read-only)', async () => {
    render(<VisitDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Visit')).toBeInTheDocument();
    });

    expect(screen.queryByText('Edit Visit')).not.toBeInTheDocument();
  });

  it('renders tabs: Details, Notes, Attachments', async () => {
    render(<VisitDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Details')).toBeInTheDocument();
    });

    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(screen.getByText('Attachments')).toBeInTheDocument();
  });

  it('shows Details tab by default with visit info', async () => {
    render(<VisitDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Visit Information')).toBeInTheDocument();
    });

    expect(screen.getByText('PLANNING')).toBeInTheDocument();
  });

  it('shows cost estimates in details tab', async () => {
    render(<VisitDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('$1000.00')).toBeInTheDocument();
    });

    expect(screen.getByText('$500.00')).toBeInTheDocument();
    expect(screen.getByText('$1500.00')).toBeInTheDocument();
  });

  it('switches to Notes tab and shows editor', async () => {
    const { user } = render(<VisitDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Notes')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Notes'));

    expect(screen.getByText('Inspection Notes')).toBeInTheDocument();
    expect(screen.getByText('Save Notes')).toBeInTheDocument();
    expect(screen.getByTestId('quill-editor')).toBeInTheDocument();
  });

  it('switches to Attachments tab and shows attachment section', async () => {
    const { user } = render(<VisitDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Attachments')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Attachments'));

    expect(screen.getByTestId('visit-attachment-section')).toBeInTheDocument();
    expect(screen.getByText('Attachments for visit-123')).toBeInTheDocument();
  });

  it('shows error state when visit fetch fails', async () => {
    mockGetVisit.mockRejectedValue(new Error('Not found'));

    render(<VisitDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Not found')).toBeInTheDocument();
    });

    expect(screen.getByText('Back to Visits')).toBeInTheDocument();
  });

  it('does not show budget section anywhere', async () => {
    render(<VisitDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Visit')).toBeInTheDocument();
    });

    expect(screen.queryByText('Budget')).not.toBeInTheDocument();
    expect(screen.queryByText('Create Budget')).not.toBeInTheDocument();
  });
});
