import { useState } from 'react';
import Message from './Message';

function App() {
  const [count, setCount] = useState(0);

  function handleClick() {
    setCount(count + 1);
  }

  return (
    <div>
      <h1>Leo Rodarte App</h1>
      <p>Count: {count}</p>
      <button onClick={handleClick}>Increase Count</button>
      <Message text={`Button has been clicked ${count} times!`} name="Leo Rodarte" />
      <Message text="Props make components reusable." name="Leo" />
    </div>
  );
}

export default App;