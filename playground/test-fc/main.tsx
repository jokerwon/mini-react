import React from 'react';
import { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  const [num, setNum] = useState(10);
  window.setNum = setNum;
  return num === 3 ? <Child /> : <div>{num}</div>;
}

function Child() {
  return (
    <div>
      <span>Hello World</span>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <App />
);
