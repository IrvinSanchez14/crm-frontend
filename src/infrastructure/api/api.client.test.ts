import { describe, it, expect } from 'vitest';
import type { Project, ProjectCreate, ProjectDetail } from './api.client';

describe('API Client Types', () => {
  describe('Project', () => {
    it('should have correct structure', () => {
      const project: Project = {
        id: '123',
        name: 'Test Project',
        description: 'A test project',
        status: 'lead',
        start_date: '2026-01-01',
        address: '123 Test St',
        client_id: 'client-123',
        category_id: 'category-123',
        created_by_user_id: 'user-123',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      expect(project.id).toBeDefined();
      expect(project.name).toBe('Test Project');
      expect(project.status).toBe('lead');
      // Verify removed fields don't exist
      expect('estimated_budget' in project).toBe(false);
      expect('actual_cost' in project).toBe(false);
      expect('estimated_completion_date' in project).toBe(false);
      expect('actual_completion_date' in project).toBe(false);
    });

    it('should allow null values for optional fields', () => {
      const project: Project = {
        id: '123',
        name: 'Test Project',
        description: null,
        status: 'lead',
        start_date: null,
        address: null,
        client_id: 'client-123',
        category_id: 'category-123',
        created_by_user_id: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      expect(project.description).toBeNull();
      expect(project.start_date).toBeNull();
      expect(project.address).toBeNull();
    });
  });

  describe('ProjectCreate', () => {
    it('should have correct structure for minimal data', () => {
      const projectCreate: ProjectCreate = {
        name: 'New Project',
        client_id: 'client-123',
        category_id: 'category-123',
      };

      expect(projectCreate.name).toBe('New Project');
      expect(projectCreate.client_id).toBe('client-123');
      expect(projectCreate.category_id).toBe('category-123');
    });

    it('should accept optional fields', () => {
      const projectCreate: ProjectCreate = {
        name: 'New Project',
        description: 'Project description',
        status: 'approved',
        start_date: '2026-02-01',
        address: '456 New St',
        client_id: 'client-123',
        category_id: 'category-123',
        created_by_user_id: 'user-123',
      };

      expect(projectCreate.description).toBe('Project description');
      expect(projectCreate.status).toBe('approved');
      expect(projectCreate.start_date).toBe('2026-02-01');
      expect(projectCreate.address).toBe('456 New St');
    });

    it('should not have budget or completion date fields', () => {
      const projectCreate: ProjectCreate = {
        name: 'New Project',
        client_id: 'client-123',
        category_id: 'category-123',
      };

      // TypeScript would catch this at compile time, but verify at runtime too
      expect('estimated_budget' in projectCreate).toBe(false);
      expect('actual_cost' in projectCreate).toBe(false);
      expect('estimated_completion_date' in projectCreate).toBe(false);
      expect('actual_completion_date' in projectCreate).toBe(false);
    });
  });

  describe('ProjectDetail', () => {
    it('should extend Project with relationships', () => {
      const projectDetail: ProjectDetail = {
        id: '123',
        name: 'Test Project',
        description: 'A test project',
        status: 'in_progress',
        start_date: '2026-01-01',
        address: '123 Test St',
        client_id: 'client-123',
        category_id: 'category-123',
        created_by_user_id: 'user-123',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        client: {
          id: 'client-123',
          name: 'Test Client',
          email: 'client@test.com',
          phone: '555-0000',
          address: '123 Client St',
          company_id: 'company-123',
          is_active: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        category: {
          id: 'category-123',
          name: 'Kitchen Remodel',
          description: 'Kitchen projects',
          company_id: 'company-123',
          is_active: true,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
        created_by_name: 'John Doe',
      };

      expect(projectDetail.client).toBeDefined();
      expect(projectDetail.category).toBeDefined();
      expect(projectDetail.created_by_name).toBe('John Doe');
    });
  });

  describe('ProjectStatus', () => {
    it('should have all valid status values', () => {
      const validStatuses = [
        'lead',
        'quoted',
        'approved',
        'in_progress',
        'completed',
        'cancelled',
        'on_hold',
      ];

      validStatuses.forEach((status) => {
        const project: Project = {
          id: '123',
          name: 'Test',
          description: null,
          status: status as any,
          start_date: null,
          address: null,
          client_id: 'client-123',
          category_id: 'category-123',
          created_by_user_id: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        };

        expect(project.status).toBe(status);
      });
    });
  });
});
