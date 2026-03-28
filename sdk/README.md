# Togglely SDKs

Official JavaScript/TypeScript SDKs for [Togglely](https://togglely.io) -- a self-hosted, multi-tenant feature toggle management platform.

## Packages

| Package | npm | Use Case | Framework |
|---------|-----|----------|-----------|
| [`@togglely/sdk-core`](./core) | `npm i @togglely/sdk-core` | Shared engine, server-side, custom integrations | Framework-agnostic |
| [`@togglely/sdk-react`](./react) | `npm i @togglely/sdk-react` | React apps, Next.js (SSR/SSG) | React 18+ |
| [`@togglely/sdk-vue`](./vue) | `npm i @togglely/sdk-vue` | Vue apps, Nuxt (SSR) | Vue 3 |
| [`@togglely/sdk-svelte`](./svelte) | `npm i @togglely/sdk-svelte` | Svelte apps, SvelteKit (SSR) | Svelte 4/5 |
| [`@togglely/sdk`](./vanilla) | `npm i @togglely/sdk` | Vanilla JS, CDN script tag, Node.js scripts | Browser / Node.js |

### Which package should I use?

- **React / Next.js** -- `@togglely/sdk-react` (includes hooks, components, SSR helper)
- **Vue / Nuxt** -- `@togglely/sdk-vue` (includes composables, directives, plugin)
- **Svelte / SvelteKit** -- `@togglely/sdk-svelte` (includes stores, actions, runes support)
- **Plain HTML / jQuery / Node.js** -- `@togglely/sdk` (global helpers, DOM helpers, CDN)
- **Custom framework or server-side only** -- `@togglely/sdk-core` (direct client API)

All framework SDKs depend on `@togglely/sdk-core` internally; you never need to install it separately.

## Quick Start

### React

```bash
npm install @togglely/sdk-react
```

```tsx
import { TogglelyProvider, useToggle } from '@togglely/sdk-react';

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
  return isEnabled ? <NewFeature /> : <OldFeature />;
}
```

### Vue

```bash
npm install @togglely/sdk-vue
```

```typescript
import { createApp } from 'vue';
import { createTogglely } from '@togglely/sdk-vue';

const app = createApp(App);
app.use(createTogglely({
  apiKey: 'your-api-key',
  project: 'my-project',
  environment: 'production',
  baseUrl: 'https://togglely.io',
}));
```

```vue
<script setup>
import { useToggle } from '@togglely/sdk-vue';
const isEnabled = useToggle('new-feature', false);
</script>

<template>
  <NewFeature v-if="isEnabled" />
  <OldFeature v-else />
</template>
```

### Svelte

```bash
npm install @togglely/sdk-svelte
```

```svelte
<script>
  import { initTogglely, toggle } from '@togglely/sdk-svelte';

  initTogglely({
    apiKey: 'your-api-key',
    project: 'my-project',
    environment: 'production',
    baseUrl: 'https://togglely.io',
  });

  const isEnabled = toggle('new-feature', false);
</script>

{#if $isEnabled}
  <NewFeature />
{:else}
  <OldFeature />
{/if}
```

### Vanilla JS

```bash
npm install @togglely/sdk
```

```javascript
import { initTogglely, isEnabled } from '@togglely/sdk';

initTogglely({
  apiKey: 'your-api-key',
  project: 'my-project',
  environment: 'production',
  baseUrl: 'https://togglely.io',
});

const enabled = await isEnabled('new-feature', false);
```

Or via CDN:

```html
<script src="https://unpkg.com/@togglely/sdk/dist/index.umd.min.js"></script>
<script>
  Togglely.initTogglely({ apiKey: 'your-api-key', project: 'my-project', environment: 'production', baseUrl: 'https://togglely.io' });
  Togglely.isEnabled('new-feature').then(function(enabled) { /* ... */ });
</script>
```

## Key Features

### Multi-Brand / Multi-Tenant Support

All SDKs support `tenantId` (or `brandKey`) for multi-tenant projects:

```typescript
// React
<TogglelyProvider tenantId="brand-a" ... />

// Vue
app.use(createTogglely({ tenantId: 'brand-a', ... }));

// Svelte
initTogglely({ tenantId: 'brand-a', ... });

// Core
const client = new TogglelyClient({ tenantId: 'brand-a', ... });
```

### Offline Fallback

All SDKs support four offline fallback methods (in priority order):

1. **Inline toggles** -- pass toggle values directly in config
2. **JSON file** -- load from a static JSON file (generated at build time)
3. **Environment variables** -- Node.js (`TOGGLELY_*` prefix)
4. **Window object** -- Browser (`window.__TOGGLELY_TOGGLES`)

See [Core SDK: Offline Fallback](./core/README.md#offline-fallback-configuration) for details.

### Build-Time JSON Generation

Pull toggles at build time for offline/static deployments:

```bash
npx @togglely/sdk-core togglely-pull \
  --apiKey=your-api-key \
  --project=my-project \
  --environment=production \
  --output=./toggles.json
```

### Targeting Context

Set user attributes for server-side targeting rules:

```typescript
// React
const client = useTogglelyClient();
client.setContext({ userId: '123', country: 'DE' });

// Vue
const { setContext } = useTogglelyContext();
setContext({ userId: '123', country: 'DE' });

// Core
client.setContext({ userId: '123', country: 'DE' });
```

### Refresh Strategies

Three built-in strategies control how toggles stay up to date:

| Strategy | Description | Best for |
|----------|-------------|----------|
| `manual` (default) | Cached reads are side-effect free; call `refresh()` explicitly | Frontend apps |
| `interval` | Background refresh on a fixed interval | Dashboards, internal tools |
| `stale-while-revalidate` | Cached reads may trigger a throttled background refresh | Interactive apps |

## Documentation

- [Core SDK -- Full API Reference](./core/README.md)
- [React SDK -- Hooks, Components, SSR](./react/README.md)
- [Vue SDK -- Composables, Directives, SSR](./vue/README.md)
- [Svelte SDK -- Stores, Actions, SSR](./svelte/README.md)
- [Vanilla JS SDK -- CDN, DOM Helpers, Node.js](./vanilla/README.md)

## License

MIT
