# Togglely Vue SDK

Vue 3 composables, directives, and plugin for [Togglely](https://togglely.io) feature flag management.

## Installation

```bash
npm install @togglely/sdk-vue
```

`@togglely/sdk-core` is included as a dependency -- you do not need to install it separately.

## Quick Start

```typescript
// main.ts
import { createApp } from 'vue';
import { createTogglely } from '@togglely/sdk-vue';
import App from './App.vue';

const app = createApp(App);

app.use(createTogglely({
  apiKey: 'your-api-key',
  project: 'my-project',
  environment: 'production',
  baseUrl: 'https://togglely.io',
}));

app.mount('#app');
```

```vue
<!-- MyComponent.vue -->
<script setup>
import { useToggle, useStringToggle, useNumberToggle } from '@togglely/sdk-vue';

const isEnabled = useToggle('new-feature', false);
const message = useStringToggle('welcome-message', 'Hello!');
const limit = useNumberToggle('max-items', 10);
</script>

<template>
  <div v-if="isEnabled">
    <h1>{{ message }}</h1>
    <p>Max items: {{ limit }}</p>
  </div>
  <div v-else>
    Feature not available
  </div>
</template>
```

## Plugin Installation

### `createTogglely(options): Plugin`

Creates a Vue plugin that initializes a `TogglelyClient` and provides it to the entire app via `inject`.

```typescript
interface TogglelyPluginOptions extends TogglelyConfig {
  initialToggles?: Record<string, any>;  // Pre-fetched toggles for SSR
}

app.use(createTogglely({
  // --- Required ---
  apiKey: 'your-api-key',
  project: 'my-project',
  environment: 'production',
  baseUrl: 'https://togglely.io',

  // --- Optional ---
  tenantId: 'brand-a',
  offlineJsonPath: '/toggles.json',
  offlineToggles: { 'feature-x': { value: true, enabled: true } },
  initialToggles: serverFetchedToggles,
  refreshStrategy: 'manual',
  refreshIntervalMs: 30000,
  timeout: 5000,
}));
```

The client is also available as `this.$togglely` in the Options API.

## Composables API Reference

### `useToggle(key: string, defaultValue?: boolean): Ref<boolean>`

Reactive boolean toggle. Returns a `Ref<boolean>` that updates automatically when toggles change.

```typescript
const isEnabled = useToggle('new-feature', false);
// Use in template: v-if="isEnabled"
```

### `useStringToggle(key: string, defaultValue?: string): Ref<string>`

Reactive string toggle.

```typescript
const message = useStringToggle('welcome-message', 'Hello!');
// Use in template: {{ message }}
```

### `useNumberToggle(key: string, defaultValue?: number): Ref<number>`

Reactive number toggle.

```typescript
const limit = useNumberToggle('max-items', 10);
```

### `useJSONToggle<T>(key: string, defaultValue?: T): Ref<T>`

Reactive JSON toggle.

```typescript
interface ThemeConfig { primary: string; mode: 'light' | 'dark' }
const theme = useJSONToggle<ThemeConfig>('theme-config', { primary: '#000', mode: 'light' });
```

### `useToggles(): DeepReadonly<Ref<Record<string, ToggleValue>>>`

Returns all cached toggles as a read-only reactive ref.

```typescript
const allToggles = useToggles();
```

### `useTogglelyClient(): TogglelyClient`

Access the underlying client for direct API calls.

```typescript
const client = useTogglelyClient();
await client.refresh();
```

### `useTogglelyState(): DeepReadonly<Ref<TogglelyState>>`

Reactive SDK state (`isReady`, `isOffline`, `lastError`, `lastFetch`). Updates on every event.

```vue
<script setup>
import { useTogglelyState } from '@togglely/sdk-vue';
const state = useTogglelyState();
</script>

<template>
  <div v-if="!state.isReady">Loading toggles...</div>
  <div v-else-if="state.isOffline">Offline mode</div>
</template>
```

### `useTogglelyReady(): Ref<boolean>`

Shorthand for the `isReady` state.

### `useTogglelyOffline(): Ref<boolean>`

Shorthand for the `isOffline` state.

### `useTogglelyContext(): { setContext, clearContext, getContext }`

Manage the targeting context.

```typescript
const { setContext, clearContext, getContext } = useTogglelyContext();

setContext({ userId: '123', country: 'DE' });
const ctx = getContext(); // { userId: '123', country: 'DE' }
clearContext();
```

## Directives

### `v-feature-toggle`

Show or hide elements based on a feature toggle. Register the directive globally:

```typescript
import { vFeatureToggle } from '@togglely/sdk-vue';
app.directive('feature-toggle', vFeatureToggle);
```

**Simple usage** (pass toggle key as a string):

```vue
<template>
  <div v-feature-toggle="'new-feature'">
    Only visible when 'new-feature' is enabled
  </div>
</template>
```

**With options:**

```vue
<template>
  <div v-feature-toggle="{ toggle: 'premium', defaultValue: false }">
    Premium content
  </div>
</template>
```

The directive sets `display: none` when the toggle is disabled and restores it when enabled. It subscribes to `update` events and cleans up on unmount.

## FeatureToggle Component (Recipe)

The SDK does not ship a `.vue` component, but you can create one easily:

```vue
<!-- FeatureToggle.vue -->
<script setup>
import { useToggle } from '@togglely/sdk-vue';

const props = defineProps({
  name: { type: String, required: true },
  defaultValue: { type: Boolean, default: false },
});

const isEnabled = useToggle(props.name, props.defaultValue);
</script>

<template>
  <slot v-if="isEnabled" />
  <slot v-else name="fallback" />
</template>
```

Usage:

```vue
<FeatureToggle name="new-dashboard">
  <NewDashboard />
  <template #fallback>
    <OldDashboard />
  </template>
</FeatureToggle>
```

## SSR Integration (Nuxt)

### Nuxt Plugin

```typescript
// plugins/togglely.ts
import { createTogglely } from '@togglely/sdk-vue';

export default defineNuxtPlugin(async (nuxtApp) => {
  // Optionally fetch toggles server-side
  let initialToggles = {};
  if (import.meta.server) {
    const config = useRuntimeConfig();
    const response = await $fetch(
      `${config.togglelyBaseUrl}/sdk/flags/${config.togglelyProject}/${config.togglelyEnv}`,
      { headers: { Authorization: `Bearer ${config.togglelyApiKey}` } }
    );
    initialToggles = response;
  }

  nuxtApp.vueApp.use(createTogglely({
    apiKey: useRuntimeConfig().public.togglelyApiKey,
    project: useRuntimeConfig().public.togglelyProject,
    environment: useRuntimeConfig().public.togglelyEnv,
    baseUrl: useRuntimeConfig().public.togglelyBaseUrl,
    initialToggles,
  }));
});
```

### Nuxt Runtime Config

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    togglelyApiKey: '',       // server-only
    togglelyBaseUrl: '',
    togglelyProject: '',
    togglelyEnv: '',
    public: {
      togglelyApiKey: '',     // also available client-side
      togglelyProject: '',
      togglelyEnv: '',
      togglelyBaseUrl: '',
    },
  },
});
```

## Build-Time JSON Generation

```json
{
  "scripts": {
    "build": "togglely-pull --apiKey=$TOGGLELY_APIKEY --project=my-project --environment=production --output=./public/toggles.json && vite build"
  }
}
```

```typescript
app.use(createTogglely({
  ...config,
  offlineJsonPath: '/toggles.json',
}));
```

## Re-exports

The Vue SDK re-exports from `@togglely/sdk-core`:

- `TogglelyClient`
- `createOfflineTogglesScript`
- `togglesToEnvVars`
- Types: `ToggleContext`, `TogglelyConfig`, `TogglelyState`

## License

MIT
