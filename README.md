React Ascii-Art lib (image to ascii)
Usage:
```bash
npm install react-ascii-art
```
```jsx
import React from 'react';
import AsciiArt from 'react-ascii-art';
const App = () => (
  <div>
    <h1>Ascii Art Example</h1>
    <AsciiArt src="/image.jpg" width={100} height={50} />
  </div>
);
```