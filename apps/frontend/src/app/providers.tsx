import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { store } from '../store';
import { router } from './router';
import SocketProvider from './SocketProvider';

export default function Providers() {
  return (
    <Provider store={store}>
      <SocketProvider>
        <RouterProvider router={router} />
      </SocketProvider>
    </Provider>
  );
}
