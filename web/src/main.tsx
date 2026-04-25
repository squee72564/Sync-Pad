import { RouterProvider } from '@tanstack/react-router';
import ReactDOM from 'react-dom/client';
import { getRouter } from './router';

const rootElement = document.getElementById('app');

if (!rootElement) {
  throw new Error('Root app element #app was not found');
}

if (!rootElement.innerHTML) {
  const router = getRouter();
  const root = ReactDOM.createRoot(rootElement);
  root.render(<RouterProvider router={router} />);
}
