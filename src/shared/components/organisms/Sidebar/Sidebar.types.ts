export interface SidebarProps {
  /**
   * Whether the sidebar is open
   */
  isOpen: boolean;
  /**
   * Callback when sidebar should be closed
   */
  onClose: () => void;
  /**
   * Optional additional CSS classes
   */
  className?: string;
}

export interface SidebarItem {
  /**
   * Unique identifier for the menu item
   */
  id: string;
  /**
   * Display label for the menu item
   */
  label: string;
  /**
   * Optional icon component
   */
  icon?: React.ReactNode;
  /**
   * Optional navigation path
   */
  path?: string;
  /**
   * Optional click handler
   */
  onClick?: () => void;
  /**
   * Optional child items for expandable sub-menus
   */
  children?: SidebarItem[];
}

