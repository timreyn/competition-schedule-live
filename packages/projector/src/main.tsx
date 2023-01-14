import { ApolloProvider } from '@apollo/client';
import React from 'react';
import ReactDOM from 'react-dom/client';
import client from './apolloClient';
import App from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
);
