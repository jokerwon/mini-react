import React from 'react';
import ReactDOM from 'react-dom';

function App() {
  return <div>Hello World</div>;
}

const root = document.querySelector('#root');

ReactDOM.createRoot(root).render(<App />);
