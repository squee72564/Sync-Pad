import { RouterProvider } from '@tanstack/react-router';
import ReactDOM from 'react-dom/client';
import { createBrowserAuthContext } from '#/lib/auth-context';
import { createQueryClient } from '#/lib/query';
import { getRouter } from './router';

const rootElement = document.getElementById('app');

if (!rootElement) {
  throw new Error('Root app element #app was not found');
}

if (!rootElement.innerHTML) {
  const auth = createBrowserAuthContext();
  const queryClient = createQueryClient();
  const router = getRouter({ auth, queryClient });
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <RouterProvider router={router} context={{ auth, queryClient }} />,
  );
}
