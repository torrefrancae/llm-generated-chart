import React from 'react';
import { createRoot } from 'react-dom/client';
import Studio from '@/components/Studio';
import '@/styles.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('root missing');
}
createRoot(root).render(
  <React.StrictMode>
    <Studio />
  </React.StrictMode>
);
