# Theme Setup Guide

This library uses `next-themes` to manage light and dark modes. For the theme switching buttons to work correctly, you must wrap your application with the provided `AgentThemeProvider`.

## 1. Wrap your Application
In your root layout or `App` component, import and use `AgentThemeProvider`.

### Next.js (App Router)
In your `layout.js`:

```jsx
import { AgentThemeProvider } from 'ai-agent';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AgentThemeProvider>
          {children}
        </AgentThemeProvider>
      </body>
    </html>
  )
}
```
> [!IMPORTANT]
> Adding `suppressHydrationWarning` to the `<html>` tag is required by `next-themes` to avoid hydration mismatch errors.

### Other React Apps
Wrap your main component:
```jsx
import { AgentThemeProvider } from 'ai-agent';

ReactDOM.render(
  <AgentThemeProvider>
    <App />
  </AgentThemeProvider>,
  document.getElementById('root')
);
```

## 2. Tailwind Configuration
Ensure your `tailwind.config.js` in the **consuming project** includes `darkMode: 'class'`:
```javascript
module.exports = {
  darkMode: 'class',
  // ... rest of your config
}
```

## 3. Usage
Once the provider is in place, the theme switching logic inside `HomepageNavbar` (and other components) will work automatically, toggling the `.dark` class on the `<html>` element.
