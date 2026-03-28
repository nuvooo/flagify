# Togglely Vanilla JavaScript SDK

Vanilla JavaScript SDK for [Togglely](https://togglely.io) feature flag management. Works in browsers (including via CDN) and Node.js without any framework.

## Installation

### npm

```bash
npm install @togglely/sdk
```

### CDN (UMD)

```html
<script src="https://unpkg.com/@togglely/sdk/dist/index.umd.min.js"></script>
```

All exports are available on the global `Togglely` object when loaded via CDN.

## Quick Start

### Browser (ES Modules)

```javascript
import { initTogglely, isEnabled } from '@togglely/sdk';

initTogglely({
  apiKey: 'your-api-key',
  project: 'my-project',
  environment: 'production',
  baseUrl: 'https://togglely.io',
});

const newFeature = await isEnabled('new-feature', false);
if (newFeature) {
  document.getElementById('new-feature').style.display = 'block';
}
```

### Browser (CDN / Script Tag)

```html
<script src="https://unpkg.com/@togglely/sdk/dist/index.umd.min.js"></script>
<script>
  Togglely.initTogglely({
    apiKey: 'your-api-key',
    project: 'my-project',
    environment: 'production',
    baseUrl: 'https://togglely.io',
  });

  Togglely.isEnabled('new-feature').then(function(enabled) {
    if (enabled) {
      document.getElementById('new-feature').style.display = 'block';
    }
  });
</script>
```

### Node.js

```javascript
const { TogglelyClient } = require('@togglely/sdk');

const client = new TogglelyClient({
  apiKey: 'your-api-key',
  project: 'my-project',
  environment: 'production',
  baseUrl: 'https://togglely.io',
});

const enabled = await client.isEnabled('new-feature', false);
console.log('New feature:', enabled);

// Cleanup when done
client.destroy();
```

## Initialization

### `initTogglely(config: TogglelyConfig): TogglelyClient`

Create a global `TogglelyClient` instance. In the browser, the client is also stored as `window.togglely`.

```javascript
import { initTogglely } from '@togglely/sdk';

const client = initTogglely({
  apiKey: 'your-api-key',
  project: 'my-project',
  environment: 'production',
  baseUrl: 'https://togglely.io',
  tenantId: 'brand-a',              // optional
  offlineJsonPath: '/toggles.json', // optional
  timeout: 5000,                    // optional
});
```

### `getGlobalTogglely(): TogglelyClient | null`

Returns the global instance set by `initTogglely`, or `null` if not initialized.

## Global Helper Functions

These functions use the global instance created by `initTogglely()`. They return a `Promise` and log an error if no global instance exists.

### `isEnabled(key: string, defaultValue?: boolean): Promise<boolean>`

```javascript
const enabled = await isEnabled('new-feature', false);
```

### `getString(key: string, defaultValue?: string): Promise<string>`

```javascript
const message = await getString('welcome-message', 'Hello!');
```

### `getNumber(key: string, defaultValue?: number): Promise<number>`

```javascript
const limit = await getNumber('max-items', 10);
```

### `getJSON<T>(key: string, defaultValue?: T): Promise<T>`

```javascript
const config = await getJSON('app-config', { theme: 'dark' });
```

## DOM Helper Functions

### `togglelyToggle(selector, toggleKey, options?): Promise<void>`

Show or hide DOM elements based on a toggle. Adds/removes CSS classes and sets `display` style.

```javascript
import { togglelyToggle } from '@togglely/sdk';

// Show element when toggle is enabled
await togglelyToggle('#new-feature', 'new-feature');

// Hide element when toggle is enabled (invert)
await togglelyToggle('#old-feature', 'new-feature', { invert: true });

// With default value and custom CSS classes
await togglelyToggle('.beta-badge', 'beta-feature', {
  defaultValue: true,
  hideClass: 'togglely-hidden',  // default
  showClass: 'togglely-visible', // default
});
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultValue` | `boolean` | `false` | Value when toggle not found |
| `invert` | `boolean` | `false` | Invert the visibility logic |
| `hideClass` | `string` | `'togglely-hidden'` | CSS class added when hidden |
| `showClass` | `string` | `'togglely-visible'` | CSS class added when visible |

### `togglelyInit(config): () => void`

Initialize multiple toggle-to-element mappings at once. Returns an unsubscribe function. Automatically updates when toggles change.

```javascript
import { togglelyInit } from '@togglely/sdk';

const unsubscribe = togglelyInit({
  // Simple: toggle key -> CSS selectors
  'new-feature': ['.new-feature', '.new-banner'],

  // Single selector
  'dark-mode': 'body',

  // With options
  'premium': {
    selector: '.premium-content',
    defaultValue: false,
  },

  // Invert (hide when enabled)
  'new-ui': {
    selector: '.old-ui',
    invert: true,
  },
});

// Cleanup when no longer needed
unsubscribe();
```

**Config value formats:**

| Format | Example |
|--------|---------|
| `string` | `'new-feature': '.my-selector'` |
| `string[]` | `'new-feature': ['.selector-a', '.selector-b']` |
| `object` | `'new-feature': { selector: '.my-selector', defaultValue: false, invert: false }` |

## Direct Client Usage

For full control, use `TogglelyClient` directly (same API as `@togglely/sdk-core`):

```javascript
import { TogglelyClient } from '@togglely/sdk';

const client = new TogglelyClient({
  apiKey: 'your-api-key',
  project: 'my-project',
  environment: 'production',
  baseUrl: 'https://togglely.io',
  tenantId: 'brand-a',
});

// Set targeting context
client.setContext({ userId: '123', country: 'DE' });

// Evaluate toggles
const enabled = await client.isEnabled('new-feature', false);
const message = await client.getString('welcome-message', 'Hello');
const config = await client.getJSON('app-config', {});

// Listen to events
client.on('ready', () => console.log('Ready!'));
client.on('offline', () => console.log('Offline mode'));
client.on('update', () => console.log('Toggles updated'));
client.on('error', (state) => console.error('Error:', state.lastError));

// Get all cached toggles
const all = client.getAllToggles();

// Manual refresh
await client.refresh();

// Cleanup
client.destroy();
```

## Offline Fallback

### Environment Variables (Node.js)

```bash
TOGGLELY_NEW_FEATURE=true
TOGGLELY_MAX_ITEMS=100
TOGGLELY_WELCOME_MESSAGE="Hello World"
```

```javascript
const client = new TogglelyClient({
  ...config,
  envPrefix: 'TOGGLELY_',  // default
});
```

### Window Object (Browser)

Set before the SDK loads:

```html
<script>
  window.__TOGGLELY_TOGGLES = {
    'new-feature': { value: true, enabled: true },
    'max-items': { value: 100, enabled: true },
    'welcome-message': { value: 'Hello World', enabled: true },
  };
</script>
<script src="https://unpkg.com/@togglely/sdk/dist/index.umd.min.js"></script>
```

### JSON File

Generate at build time and reference in config:

```bash
npx @togglely/sdk-core togglely-pull \
  --apiKey=tk_xxx \
  --project=my-project \
  --environment=production \
  --output=./toggles.json
```

```javascript
initTogglely({
  ...config,
  offlineJsonPath: '/toggles.json',
});
```

### Inline Toggles

```javascript
initTogglely({
  ...config,
  offlineToggles: {
    'new-feature': { value: true, enabled: true },
    'api-timeout': { value: 5000, enabled: true, flagType: 'NUMBER' },
  },
});
```

## CDN Usage Patterns

### Basic Toggle with CDN

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/@togglely/sdk/dist/index.umd.min.js"></script>
</head>
<body>
  <div id="new-feature" style="display: none;">New Feature Content</div>
  <div id="old-feature">Old Feature Content</div>

  <script>
    Togglely.initTogglely({
      apiKey: 'your-api-key',
      project: 'my-project',
      environment: 'production',
      baseUrl: 'https://togglely.io',
    });

    // Using DOM helper
    Togglely.togglelyToggle('#new-feature', 'new-feature');
    Togglely.togglelyToggle('#old-feature', 'new-feature', { invert: true });
  </script>
</body>
</html>
```

### Multiple Toggles with CDN

```html
<script>
  Togglely.initTogglely({
    apiKey: 'your-api-key',
    project: 'my-project',
    environment: 'production',
    baseUrl: 'https://togglely.io',
  });

  Togglely.togglelyInit({
    'new-header': '.header-v2',
    'new-footer': '.footer-v2',
    'premium-banner': { selector: '.premium', defaultValue: false },
    'old-sidebar': { selector: '.sidebar-v1', invert: true },
  });
</script>
```

## Re-exports

The vanilla SDK re-exports everything from `@togglely/sdk-core`:

- `TogglelyClient`
- `createOfflineTogglesScript`
- `togglesToEnvVars`
- Types: `AllTogglesResponse`, `ToggleContext`, `TogglelyConfig`, `TogglelyEventHandler`, `TogglelyEventType`, `TogglelyState`, `ToggleValue`

## License

MIT
