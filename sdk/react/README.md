# Togglely React SDK

React hooks, components, and SSR helpers for [Togglely](https://togglely.io) feature flag management.

## Installation

```bash
npm install @togglely/sdk-react
```

`@togglely/sdk-core` is included as a dependency -- you do not need to install it separately.

## Quick Start

```tsx
import { TogglelyProvider, useToggle, FeatureToggle } from '@togglely/sdk-react';

function App() {
  return (
    <TogglelyProvider
      apiKey="your-api-key"
      project="my-project"
      environment="production"
      baseUrl="https://togglely.io"
    >
      <MyComponent />
    </TogglelyProvider>
  );
}

function MyComponent() {
  const isEnabled = useToggle('new-feature', false);

  return (
    <div>
      {isEnabled && <NewFeature />}

      <FeatureToggle toggle="premium-feature" fallback={<FreeVersion />}>
        <PremiumVersion />
      </FeatureToggle>
    </div>
  );
}
```

## Provider

### `<TogglelyProvider>`

Wrap your app (or a subtree) with the provider. It creates a `TogglelyClient` instance and makes it available to all hooks and components below it.

```tsx
interface TogglelyProviderProps {
  // --- Required (passed to TogglelyClient) ---
  apiKey: string;
  project: string;
  environment: string;
  baseUrl: string;

  // --- Optional ---
  children: ReactNode;
  initialToggles?: Record<string, any>;    // Pre-fetched toggles for SSR
  initialContext?: ToggleContext;           // Initial targeting context
  offlineFallback?: boolean;               // Enable offline fallback (default: true)
  tenantId?: string;                       // Multi-tenant support
  brandKey?: string;                       // Alias for tenantId
  timeout?: number;                        // Request timeout in ms
  offlineJsonPath?: string;                // Path to offline JSON file
  offlineToggles?: Record<string, ToggleValue>; // Inline offline toggles
  refreshStrategy?: 'manual' | 'interval' | 'stale-while-revalidate';
  refreshIntervalMs?: number;
  minRefreshIntervalMs?: number;
}
```

```tsx
<TogglelyProvider
  apiKey="your-api-key"
  project="my-project"
  environment="production"
  baseUrl="https://togglely.io"
  tenantId="brand-a"
  offlineJsonPath="/toggles.json"
  initialContext={{ userId: '123' }}
>
  {children}
</TogglelyProvider>
```

## Hooks API Reference

### `useToggle(key: string, defaultValue?: boolean): boolean`

Returns `true` when the boolean toggle is enabled **and** its value is `true`.

```tsx
const showBeta = useToggle('beta-feature', false);
```

### `useEnabled(key: string, defaultValue?: boolean): boolean`

Returns `true` when the toggle's `enabled` field is `true`, regardless of its value. Use this for non-boolean flags where you only care whether the flag is active.

```tsx
const isActive = useEnabled('welcome-banner', false);
```

### `useStringToggle(key: string, defaultValue?: string): string`

Returns the string value of a toggle, or `defaultValue` if not found/disabled.

```tsx
const message = useStringToggle('welcome-message', 'Hello!');
```

### `useNumberToggle(key: string, defaultValue?: number): number`

Returns the numeric value of a toggle.

```tsx
const maxItems = useNumberToggle('max-items', 10);
```

### `useJSONToggle<T>(key: string, defaultValue?: T): T`

Returns a parsed JSON object from a toggle.

```tsx
interface ThemeConfig { primary: string; mode: 'light' | 'dark' }
const theme = useJSONToggle<ThemeConfig>('theme-config', { primary: '#000', mode: 'light' });
```

### `useToggles(): Record<string, ToggleValue>`

Returns all cached toggles. Updates automatically when toggles change.

```tsx
const allToggles = useToggles();
```

### `useTogglelyClient(): TogglelyClient`

Access the underlying `TogglelyClient` instance for direct API calls.

```tsx
const client = useTogglelyClient();
client.setContext({ userId: '123' });
await client.refresh();
```

### `useTogglelyState(): TogglelyState`

Returns the current SDK state (`isReady`, `isOffline`, `lastError`, `lastFetch`). Updates reactively on every event.

```tsx
const { isReady, isOffline, lastError } = useTogglelyState();

if (!isReady) return <Loading />;
if (lastError) return <ErrorBanner error={lastError} />;
```

### `useTogglelyReady(): boolean`

Shorthand for `useTogglelyState().isReady`.

### `useTogglelyOffline(): boolean`

Shorthand for `useTogglelyState().isOffline`.

### `useTogglelyContext(): { setContext, clearContext, context }`

Manage the targeting context reactively.

```tsx
const { setContext, clearContext, context } = useTogglelyContext();

useEffect(() => {
  setContext({ userId: user.id, country: user.country });
}, [user]);
```

### `useTogglelySuspense(): TogglelyClient`

Suspends rendering until toggles are ready. Use with `<React.Suspense>`.

```tsx
function App() {
  return (
    <React.Suspense fallback={<Loading />}>
      <TogglelyProvider {...config}>
        <Content />
      </TogglelyProvider>
    </React.Suspense>
  );
}

function Content() {
  const client = useTogglelySuspense(); // suspends until ready
  return <MainApp />;
}
```

## Components

### `<FeatureToggle>`

Conditionally render content based on a boolean toggle.

```tsx
interface FeatureToggleProps {
  toggle: string;           // Toggle key
  children: ReactNode;      // Rendered when enabled
  fallback?: ReactNode;     // Rendered when disabled (default: null)
  defaultValue?: boolean;   // Default if toggle not found (default: false)
}
```

```tsx
<FeatureToggle toggle="new-dashboard" fallback={<OldDashboard />}>
  <NewDashboard />
</FeatureToggle>
```

### `<FeatureToggleSwitch>` + `<FeatureToggleCase>`

Render different content based on the toggle's boolean state.

```tsx
<FeatureToggleSwitch toggle="new-feature" defaultValue={false}>
  <FeatureToggleCase when={true}>
    <NewVersion />
  </FeatureToggleCase>
  <FeatureToggleCase when={false}>
    <OldVersion />
  </FeatureToggleCase>
  <FeatureToggleCase>
    {/* Default case (when `when` is omitted) */}
    <FallbackVersion />
  </FeatureToggleCase>
</FeatureToggleSwitch>
```

## Higher-Order Component

### `withFeatureToggle(Component, options)`

Wrap a component so it only renders when a toggle is enabled.

```tsx
interface WithFeatureToggleOptions {
  toggle: string;
  defaultValue?: boolean;
  fallback?: React.ComponentType<any>;
}

const ProtectedFeature = withFeatureToggle(MyFeature, {
  toggle: 'premium-feature',
  defaultValue: false,
  fallback: UpgradeBanner,
});

// Usage
<ProtectedFeature someProp="value" />
```

## SSR Integration

### Next.js App Router

```tsx
// app/layout.tsx
import { TogglelyProvider } from '@togglely/sdk-react';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const response = await fetch(
    `${process.env.TOGGLELY_BASE_URL}/sdk/flags/${process.env.TOGGLELY_PROJECT}/${process.env.TOGGLELY_ENV}`,
    { headers: { Authorization: `Bearer ${process.env.TOGGLELY_APIKEY}` } }
  );
  const initialToggles = await response.json();

  return (
    <html>
      <body>
        <TogglelyProvider
          apiKey={process.env.TOGGLELY_APIKEY!}
          project={process.env.TOGGLELY_PROJECT!}
          environment={process.env.TOGGLELY_ENV!}
          baseUrl={process.env.TOGGLELY_BASE_URL!}
          initialToggles={initialToggles}
        >
          {children}
        </TogglelyProvider>
      </body>
    </html>
  );
}
```

### Next.js Pages Router

Use the `getTogglelyState()` helper to fetch toggles server-side:

```tsx
import { TogglelyProvider, getTogglelyState } from '@togglely/sdk-react';

export async function getServerSideProps() {
  const initialToggles = await getTogglelyState({
    apiKey: process.env.TOGGLELY_APIKEY!,
    project: 'my-project',
    environment: 'production',
    baseUrl: 'https://togglely.io',
  });

  return { props: { initialToggles } };
}

export default function Page({ initialToggles }: { initialToggles: Record<string, any> }) {
  return (
    <TogglelyProvider
      apiKey={process.env.NEXT_PUBLIC_TOGGLELY_APIKEY!}
      project="my-project"
      environment="production"
      baseUrl="https://togglely.io"
      initialToggles={initialToggles}
    >
      <MyComponent />
    </TogglelyProvider>
  );
}
```

### `getTogglelyState(config, context?): Promise<Record<string, any>>`

Server-side helper that creates a temporary client, fetches all toggles, and returns them. The client is created with `autoFetch: false` and `offlineFallback: false`.

```typescript
const toggles = await getTogglelyState(
  {
    apiKey: 'tk_xxx',
    project: 'my-project',
    environment: 'production',
    baseUrl: 'https://togglely.io',
  },
  { userId: 'user-123', country: 'DE' }  // optional context
);
```

## Build-Time JSON Generation

Generate offline JSON during your build:

```json
{
  "scripts": {
    "build": "togglely-pull --apiKey=$TOGGLELY_APIKEY --project=my-project --environment=production --output=./public/toggles.json && next build"
  }
}
```

Then reference it in your provider:

```tsx
<TogglelyProvider
  apiKey="your-api-key"
  project="my-project"
  environment="production"
  baseUrl="https://togglely.io"
  offlineJsonPath="/toggles.json"
>
```

## Re-exports

The React SDK re-exports these from `@togglely/sdk-core` for convenience:

- `TogglelyClient`
- `createOfflineTogglesScript`
- `togglesToEnvVars`
- Types: `ToggleContext`, `TogglelyConfig`, `TogglelyEventType`, `TogglelyState`

## License

MIT
