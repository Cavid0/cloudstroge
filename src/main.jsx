import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';
import App from './App';
import './index.css';

// Configure Amplify with auto-generated AWS settings
Amplify.configure(awsExports);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
