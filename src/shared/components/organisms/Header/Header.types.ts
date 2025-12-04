export interface HeaderProps {
  /**
   * User name to display in the menu
   */
  userName?: string;
  /**
   * Callback when logout is clicked
   */
  onLogout: () => void;
  /**
   * Optional callback when hamburger menu is clicked
   */
  onMenuClick?: () => void;
  /**
   * Optional additional CSS classes
   */
  className?: string;
}
