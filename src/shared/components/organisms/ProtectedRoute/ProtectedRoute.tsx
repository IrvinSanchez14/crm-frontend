/**
 * ProtectedRoute Organism
 * Route protection component with loading state
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { Text } from '../../atoms/Text';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Text variant="muted">Loading...</Text>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

