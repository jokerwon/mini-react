import React from 'react';
import { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  const [num] = useState(10);
  return <div>{num}</div>;
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <App />
);
