import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';

// Create a custom render function that includes providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return {
    ...render(ui, {
      wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
      ...options,
    }),
    user: userEvent.setup(),
  };
}

export * from '@testing-library/react';
export { customRender as render, userEvent };
