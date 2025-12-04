export interface UserMenuProps {
  /**
   * User display name shown in the menu
   */
  userName?: string;
  /**
   * Callback when logout is clicked
   */
  onLogout: () => void;
  /**
   * Optional additional CSS classes
   */
  className?: string;
}
