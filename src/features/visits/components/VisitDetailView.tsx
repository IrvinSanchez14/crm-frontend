/**
 * Visit Detail View Component
 * Read-only visit summary for the sidebar on the visits list page
 */

import { Text } from '../../../shared/components/atoms/Text';
import { Heading } from '../../../shared/components/atoms/Heading';
import { cn } from '../../../core/utils/cn';
import type { VisitDetail } from '../../../infrastructure/api/api.client';

export interface VisitDetailViewProps {
  visit: VisitDetail;
  onSuccess?: () => void;
  onCancel: () => void;
}

export function VisitDetailView({ visit }: VisitDetailViewProps) {
  const statusColors: Record<string, string> = {
    planning: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    in_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inspection_required: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    visited: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };

  return (
    <div className="space-y-6">
      {/* Visit Details Section */}
      <div className="space-y-4">
        <Heading variant="h3">Visit Details</Heading>

        <div className="space-y-3">
          <div>
            <Text variant="muted" className="text-xs">Title</Text>
            <Text variant="default" className="font-medium">{visit.title}</Text>
          </div>
          <div>
            <Text variant="muted" className="text-xs">Status</Text>
            <span
              className={cn(
                'inline-block px-2 py-1 rounded-full text-xs font-medium mt-1',
                statusColors[visit.status]
              )}
            >
              {visit.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          {visit.description && (
            <div>
              <Text variant="muted" className="text-xs">Description</Text>
              <Text variant="default">{visit.description}</Text>
            </div>
          )}
          {visit.visit_date && (
            <div>
              <Text variant="muted" className="text-xs">Visit Date</Text>
              <Text variant="default">
                {new Date(visit.visit_date).toLocaleDateString()}
              </Text>
            </div>
          )}
          {visit.inspection_notes && (
            <div>
              <Text variant="muted" className="text-xs">Inspection Notes</Text>
              <div
                className="text-sm text-[color:var(--foreground)] prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: visit.inspection_notes }}
              />
            </div>
          )}

          {/* Cost Estimates */}
          {(visit.estimated_materials_cost || visit.estimated_labor_cost || visit.estimated_total_cost) && (
            <div className="border-t border-[color:var(--border)] pt-3 mt-3">
              <Text variant="muted" className="text-xs mb-2">Cost Estimates</Text>
              <div className="space-y-1">
                {visit.estimated_materials_cost && (
                  <div className="flex justify-between">
                    <Text size="sm" variant="muted">Materials</Text>
                    <Text size="sm" className="font-medium">
                      ${parseFloat(visit.estimated_materials_cost).toFixed(2)}
                    </Text>
                  </div>
                )}
                {visit.estimated_labor_cost && (
                  <div className="flex justify-between">
                    <Text size="sm" variant="muted">Labor</Text>
                    <Text size="sm" className="font-medium">
                      ${parseFloat(visit.estimated_labor_cost).toFixed(2)}
                    </Text>
                  </div>
                )}
                {visit.estimated_total_cost && (
                  <div className="flex justify-between border-t border-[color:var(--border)] pt-1 mt-1">
                    <Text size="sm" variant="muted" className="font-medium">Total</Text>
                    <Text size="sm" className="font-medium">
                      ${parseFloat(visit.estimated_total_cost).toFixed(2)}
                    </Text>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
