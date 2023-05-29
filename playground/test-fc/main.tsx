import React from 'react';
import { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  const [num, setNum] = useState(10);
  return <div onClickCapture={() => setNum(num + 1)}>{num}</div>;
}

// function Child() {
//   return (
//     <div>
//       <span>Hello World</span>
//     </div>
//   );
// }

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <App />
);
