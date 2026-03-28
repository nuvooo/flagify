# Togglely Core SDK

Framework-agnostic core SDK for [Togglely](https://togglely.io) feature flag management with offline support, multi-brand/tenant capabilities, and a professionalized refresh model.

## Installation

```bash
npm install @togglely/sdk-core
```

## Quick Start

```typescript
import { TogglelyClient } from '@togglely/sdk-core';

const client = new TogglelyClient({
  apiKey: 'your-api-key',
  project: 'my-project',
  environment: 'production',
  baseUrl: 'https://togglely.io',
});

const isEnabled = await client.isEnabled('new-feature');
const message = await client.getString('welcome-message', 'Hello!');
const timeout = await client.getNumber('api-timeout', 5000);
const config = await client.getJSON<AppConfig>('app-config', { theme: 'dark' });
```

## Configuration Reference

```typescript
const client = new TogglelyClient({
  // --- Required ---
  apiKey: string,         // API key from your Togglely dashboard
  project: string,        // Project key (e.g. 'my-project')
  environment: string,    // Environment key (e.g. 'production', 'staging')
  baseUrl: string,        // Your Togglely instance URL (e.g. 'https://togglely.io')

  // --- Network ---
  timeout: number,        // Request timeout in ms (default: 5000)
  autoFetch: boolean,     // Fetch toggles on construction (default: true)

  // --- Offline ---
  offlineFallback: boolean,               // Enable offline fallback (default: true)
  offlineJsonPath: string | undefined,    // Path to offline JSON file
  offlineToggles: Record<string, ToggleValue>, // Inline offline toggles
  envPrefix: string,                      // Env var prefix (default: 'TOGGLELY_')

  // --- Multi-Tenant ---
  brandKey: string,       // Brand key for multi-brand projects
  tenantId: string,       // Tenant ID (alias for brandKey)

  // --- Targeting ---
  context: ToggleContext, // Initial targeting context (userId, email, country, ...)

  // --- Refresh ---
  refreshStrategy: 'manual' | 'interval' | 'stale-while-revalidate', // default: 'manual'
  refreshIntervalMs: number,       // Interval period in ms (default: 30000)
  minRefreshIntervalMs: number,    // SWR cooldown in ms (default: 5000)
});
```

### Key Types

```typescript
interface ToggleValue {
  value: any;
  enabled: boolean;
  flagType?: 'BOOLEAN' | 'STRING' | 'NUMBER' | 'JSON';
}

interface ToggleContext {
  userId?: string;
  email?: string;
  country?: string;
  region?: string;
  [key: string]: any;   // arbitrary custom attributes
}

interface TogglelyState {
  isReady: boolean;
  isOffline: boolean;
  lastError: Error | null;
  lastFetch: Date | null;
}
```

## Full API Reference

### Toggle Evaluation

#### `isEnabled(key: string, defaultValue?: boolean): Promise<boolean>`

Check whether a boolean feature flag is enabled. Returns `true` only when the toggle exists, `enabled === true`, **and** `value === true` (for boolean flags) or `enabled === true` (for non-boolean flags).

```typescript
const showBeta = await client.isEnabled('beta-feature', false);
```

#### `getString(key: string, defaultValue?: string): Promise<string>`

Get the string value of a toggle. Returns `defaultValue` if the toggle does not exist or is disabled.

```typescript
const welcomeMsg = await client.getString('welcome-message', 'Hello!');
```

#### `getNumber(key: string, defaultValue?: number): Promise<number>`

Get the numeric value of a toggle. Returns `defaultValue` if not found or disabled.

```typescript
const maxItems = await client.getNumber('max-items', 10);
```

#### `getJSON<T>(key: string, defaultValue?: T): Promise<T>`

Get a parsed JSON object from a toggle. If the stored value is a JSON string, it is parsed automatically. Returns `defaultValue` on parse failure or if disabled.

```typescript
interface ThemeConfig { primary: string; mode: 'light' | 'dark' }
const theme = await client.getJSON<ThemeConfig>('theme-config', { primary: '#000', mode: 'light' });
```

#### `getValue(key: string): Promise<ToggleValue | null>`

Get the raw `ToggleValue` for a key. Returns `null` if the toggle does not exist. This is the low-level method used by all typed accessors above.

```typescript
const raw = await client.getValue('my-flag');
if (raw?.enabled) {
  console.log('Flag type:', raw.flagType, 'Value:', raw.value);
}
```

#### `getAllToggles(): Record<string, ToggleValue>`

Return all currently cached toggles as a plain object. This is synchronous and does not trigger a network request.

```typescript
const all = client.getAllToggles();
Object.entries(all).forEach(([key, toggle]) => {
  console.log(`${key}: enabled=${toggle.enabled}, value=${toggle.value}`);
});
```

### Refresh

#### `refresh(): Promise<void>`

Manually fetch the latest toggles from the server. Concurrent calls are deduplicated (only one in-flight request at a time). Emits `ready` (first load), `update` (if payload changed), or `error`/`offline`.

```typescript
await client.refresh();
```

### Context Management

#### `setContext(context: ToggleContext): void`

Merge new attributes into the current targeting context. The context is sent as a query parameter on every refresh.

```typescript
client.setContext({ userId: 'user-123', country: 'DE' });
```

#### `getContext(): ToggleContext`

Return a copy of the current targeting context.

```typescript
const ctx = client.getContext();
console.log(ctx.userId);
```

#### `clearContext(): void`

Reset the targeting context to an empty object.

```typescript
client.clearContext();
```

### Event System

#### `on(event: TogglelyEventType, handler: (state: TogglelyState) => void): () => void`

Subscribe to an event. Returns an unsubscribe function.

#### `off(event: TogglelyEventType, handler: (state: TogglelyState) => void): void`

Unsubscribe a previously registered handler.

**Events:**

| Event | Emitted when |
|-------|-------------|
| `ready` | Toggles are fetched successfully for the first time |
| `update` | A refresh returns a different toggle payload than the cached one |
| `error` | Any refresh fails (network error, HTTP error, timeout) |
| `offline` | The client transitions to offline mode (fallback toggles active) |
| `online` | The client transitions back from offline to online |

```typescript
const unsubscribe = client.on('ready', (state) => {
  console.log('Togglely ready! Last fetch:', state.lastFetch);
});

client.on('update', (state) => {
  console.log('Toggles changed');
});

client.on('error', (state) => {
  console.error('Refresh failed:', state.lastError?.message);
});

client.on('offline', () => console.log('Switched to offline fallback'));
client.on('online', () => console.log('Back online'));

// Cleanup
unsubscribe();
```

### State Inspection

#### `isReady(): boolean`

Returns `true` after the first successful fetch.

#### `isOffline(): boolean`

Returns `true` when the client is using offline fallback data.

#### `getState(): TogglelyState`

Returns a copy of the full state object (`isReady`, `isOffline`, `lastError`, `lastFetch`).

### Lifecycle

#### `destroy(): void`

Clear all cached toggles, remove all event handlers, and stop any interval/timeout timers. Call this when you unmount or shut down.

```typescript
client.destroy();
```

#### `forceOfflineMode(): void`

Manually switch to offline mode and emit the `offline` event.

#### `forceOnlineMode(): void`

Switch back to online mode, trigger a refresh, and emit the `online` event.

## Error Handling Patterns

The SDK is designed to be resilient. Here is how different failure scenarios behave:

| Scenario | Behavior |
|----------|----------|
| **Network failure / timeout** | `error` event emitted. If `offlineFallback` is enabled and offline toggles were loaded, switches to offline mode (`offline` event). Cached values remain available. |
| **HTTP 401 Unauthorized** | Treated as a refresh error. `error` event with `state.lastError.message === 'HTTP 401'`. The SDK does not retry automatically. |
| **HTTP 500 Server Error** | Same as network failure -- `error` event, falls back to offline toggles if available. |
| **Request timeout** | Governed by the `timeout` config (default 5000ms). Behaves like a network failure. |
| **Toggle key not found** | `getValue()` returns `null`; typed accessors (`isEnabled`, `getString`, etc.) return the `defaultValue`. |
| **JSON parse failure** | `getJSON()` returns the `defaultValue` if the stored string is not valid JSON. |

**Recommended pattern:**

```typescript
const client = new TogglelyClient({
  apiKey: 'tk_xxx',
  project: 'my-project',
  environment: 'production',
  baseUrl: 'https://togglely.io',
  offlineFallback: true,
  offlineToggles: {
    'critical-feature': { value: true, enabled: true },
  },
});

client.on('error', (state) => {
  reportToMonitoring('togglely_error', state.lastError);
});

client.on('offline', () => {
  console.warn('Using offline toggles -- some values may be stale');
});
```

## Offline Fallback Configuration

When the API is unreachable, the SDK uses offline toggles. Four sources are checked in priority order:

### 1. Inline Toggles (highest priority)

Pass toggle values directly in the constructor config:

```typescript
const client = new TogglelyClient({
  ...baseConfig,
  offlineToggles: {
    'new-feature': { value: true, enabled: true },
    'api-timeout': { value: 5000, enabled: true, flagType: 'NUMBER' },
    'app-config': { value: { theme: 'dark' }, enabled: true, flagType: 'JSON' },
  },
});
```

### 2. JSON File

Load toggles from a static JSON file. In the browser, the file is fetched via `fetch()`. In Node.js, it is read from the filesystem.

```typescript
const client = new TogglelyClient({
  ...baseConfig,
  offlineJsonPath: '/toggles.json', // relative to public root in browser
});
```

Generate the file at build time:

```bash
npx @togglely/sdk-core togglely-pull \
  --apiKey=tk_xxx \
  --project=my-project \
  --environment=production \
  --output=./public/toggles.json
```

### 3. Environment Variables (Node.js)

Environment variables with the configured prefix are automatically parsed:

```bash
TOGGLELY_NEW_FEATURE=true        # -> key "new-feature", value true
TOGGLELY_API_TIMEOUT=5000        # -> key "api-timeout", value 5000
TOGGLELY_APP_CONFIG='{"a":1}'    # -> key "app-config", value {a: 1}
```

The prefix is configurable (default `TOGGLELY_`). Key transformation: strip prefix, lowercase, replace `_` with `-`.

```typescript
const client = new TogglelyClient({
  ...baseConfig,
  envPrefix: 'MYAPP_FLAGS_',
});
```

### 4. Window Object (Browser)

Set `window.__TOGGLELY_TOGGLES` before the SDK initializes:

```html
<script>
  window.__TOGGLELY_TOGGLES = {
    'new-feature': { value: true, enabled: true },
    'api-timeout': { value: 5000, enabled: true },
  };
</script>
<script src="your-app.js"></script>
```

### Injecting Offline Toggles at Build Time

Two utility functions help with build-time injection:

```typescript
import { createOfflineTogglesScript, togglesToEnvVars } from '@togglely/sdk-core';

// Generate a <script> tag for HTML injection
const scriptTag = createOfflineTogglesScript({ 'feature-a': true });
// -> '<script>window.__TOGGLELY_TOGGLES = {"feature-a":true};</script>'

// Generate env var mappings
const envVars = togglesToEnvVars({ 'feature-a': true }, 'TOGGLELY_');
// -> { TOGGLELY_FEATURE_A: 'true' }
```

## Refresh Strategies

### `manual` (default)

Cached reads never trigger network requests. Call `refresh()` explicitly when you want fresh data.

```typescript
const client = new TogglelyClient({
  ...baseConfig,
  refreshStrategy: 'manual',
});

// Refresh on user action
document.getElementById('refresh-btn').addEventListener('click', () => {
  client.refresh();
});
```

### `interval`

A background timer calls `refresh()` at a fixed interval.

```typescript
const client = new TogglelyClient({
  ...baseConfig,
  refreshStrategy: 'interval',
  refreshIntervalMs: 30000, // every 30 seconds
});
```

### `stale-while-revalidate`

Cached reads return immediately but may schedule a background refresh. A cooldown (`minRefreshIntervalMs`) prevents excessive requests.

```typescript
const client = new TogglelyClient({
  ...baseConfig,
  refreshStrategy: 'stale-while-revalidate',
  minRefreshIntervalMs: 5000, // at most one refresh every 5 seconds
});
```

| Strategy | Network on read? | Automatic background refresh? | Best for |
|----------|-----------------|------------------------------|----------|
| `manual` | No | No | Frontend apps, controlled refresh |
| `interval` | No | Yes (fixed timer) | Dashboards, internal tools |
| `stale-while-revalidate` | No (returns cache) | Yes (throttled) | Interactive apps with tolerance for staleness |

## Multi-Tenant / Brand Context

For projects serving multiple brands or tenants, use `tenantId` or `brandKey`. Both are sent as query parameters and added to the targeting context automatically.

```typescript
const client = new TogglelyClient({
  apiKey: 'tk_xxx',
  project: 'my-project',
  environment: 'production',
  baseUrl: 'https://togglely.io',
  tenantId: 'brand-a',   // or brandKey: 'brand-a'
});

// Switch tenant at runtime
client.setContext({ tenantId: 'brand-b' });
await client.refresh();
```

## Performance Best Practices

- **Batch mode:** The SDK automatically batches concurrent `getValue()` calls within a 10ms window into a single `refresh()` request. You do not need to manage this yourself.
- **Cache TTL:** All typed accessors (`isEnabled`, `getString`, etc.) return from the in-memory cache when a value exists. No network call is made unless the cache is empty or `stale-while-revalidate` triggers a background refresh.
- **Deduplicated refreshes:** Concurrent calls to `refresh()` share a single in-flight request.
- **Refresh intervals:** For `interval` strategy, 30 seconds is a reasonable default. For `stale-while-revalidate`, set `minRefreshIntervalMs` to at least 5 seconds to avoid excessive traffic.
- **Destroy on unmount:** Always call `client.destroy()` when the client is no longer needed to clean up timers and handlers.

## Build-Time JSON Generation (CLI)

```bash
# Basic usage
npx @togglely/sdk-core togglely-pull \
  --apiKey=tk_xxx \
  --project=my-project \
  --environment=production \
  --output=./public/toggles.json

# With tenant
togglely-pull \
  --apiKey=tk_xxx \
  --project=my-project \
  --environment=production \
  --tenantId=brand-a \
  --output=./toggles.json

# Output formats
togglely-pull --format=json  # JSON file (default)
togglely-pull --format=env   # .env file
togglely-pull --format=js    # JavaScript module

# Using environment variables instead of flags
export TOGGLELY_APIKEY=tk_xxx
export TOGGLELY_PROJECT=my-project
export TOGGLELY_ENVIRONMENT=production
togglely-pull --output=./toggles.json

# Using a config file
togglely-pull --config=./togglely.config.js
```

### Config File (togglely.config.js)

```javascript
module.exports = {
  apiKey: process.env.TOGGLELY_APIKEY,
  project: 'my-project',
  environment: 'production',
  baseUrl: 'https://togglely.io',
  tenantId: process.env.BRAND_KEY,
  output: './public/toggles.json',
  format: 'json',
};
```

### Build Script Integration

```json
{
  "scripts": {
    "build": "togglely-pull && vite build",
    "build:staging": "togglely-pull --environment=staging && vite build",
    "build:prod": "togglely-pull --environment=production && vite build"
  }
}
```

## License

MIT
