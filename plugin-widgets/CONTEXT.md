# plugin-widgets — Context Reference

> **Purpose of this file**: Quick orientation for AI coding assistants (and human contributors) diving into this codebase cold. Read this before touching any file in this directory.

---

## What this plugin does

`plugin-widgets` is a NativeScript plugin that provides native home-screen weather widgets for both **Android** and **iOS**. It contains:

1. **JSON-based widget layout definitions** (`src/widgets/*.json`) — a single source of truth for widget UI.
2. **Code generators** (`scripts/generators/`) — TypeScript scripts that read those JSON files and emit platform-native code for Android (Kotlin/Glance), iOS (SwiftUI), and NativeScript Svelte components.
3. **Renderers** (`scripts/renderers/`) — runtime interpretation of the same JSON for HTML preview generation.
4. **Native platform code** (`platforms/`) — hand-written Kotlin and Swift files that wire everything together plus the generated files.
5. **NativeScript bridge** (`src/`) — TypeScript glue that lets the main app trigger widget updates and pass data.

The key design principle: **define the layout once in JSON, render everywhere.**

---

## Directory structure

```
plugin-widgets/
├── CONTEXT.md                     ← you are here
├── README.md                      ← user-facing DSL docs
├── MAPBOX_EXPRESSIONS.md          ← expression syntax reference
├── schema.json                    ← JSON Schema for widget layout files
├── package.json                   ← scripts to run generators (npm run generate:*)
│
├── src/
│   ├── widgets/                   ← ★ WIDGET LAYOUT DEFINITIONS (JSON) ★
│   │   ├── SimpleWeatherWidget.json
│   │   ├── SimpleWeatherWithClockWidget.json
│   │   ├── SimpleWeatherWithDateWidget.json
│   │   ├── HourlyWeatherWidget.json
│   │   ├── DailyWeatherWidget.json
│   │   ├── ForecastWeatherWidget.json
│   │   └── samples/               ← sample data used during image generation
│   │
│   ├── svelte/
│   │   └── generated/             ← AUTO-GENERATED .svelte components (do not edit)
│   │       └── *View.generated.svelte
│   │
│   ├── WidgetTypes.ts             ← WeatherWidgetData, WidgetConfig, HourlyData, DailyData…
│   ├── WidgetKindConfigs.ts       ← AUTO-GENERATED kind config map (do not edit)
│   ├── WidgetBridge.android.ts    ← NS ↔ Android widget bridge
│   ├── WidgetBridge.ios.ts        ← NS ↔ iOS widget bridge
│   ├── WidgetConfigManager.ts     ← persists widget configurations
│   ├── WidgetDataManager.ts       ← fetches & caches weather data for widgets
│   ├── WidgetUpdateService.ts     ← schedules periodic widget refreshes
│   ├── mapbox-expressions.ts      ← runtime expression evaluator (used by HTML renderer)
│   └── index.ts                   ← plugin public API
│
├── scripts/
│   ├── generators/                ← ★ CODE GENERATORS ★
│   │   ├── shared-utils.ts        ← types, guards, alignment/color/font helpers
│   │   ├── expression-compiler.ts ← compiles Mapbox expressions → Kotlin/Swift/JS/TS
│   │   ├── modifier-builders.ts   ← builds platform modifier chains (Glance/SwiftUI/CSS)
│   │   ├── glance-generator.ts    ← JSON → Kotlin Glance composables
│   │   ├── swift-generator.ts     ← JSON → SwiftUI views
│   │   ├── nativescript-svelte-generator.ts  ← JSON → Svelte Native components
│   │   ├── generate-widget-kind-configs.ts   ← JSON → TS + Kotlin + Swift kind configs
│   │   ├── generate-samples.ts    ← creates sample JSON data files for preview
│   │   └── generate-images.ts     ← renders widget previews as PNG via Puppeteer
│   │
│   └── renderers/
│       └── html-renderer.ts       ← runtime JSON → HTML (used by image generator)
│
└── platforms/
    ├── android/
    │   └── java/com/akylas/weather/widgets/
    │       ├── WeatherWidgetManager.kt        ← data model + update orchestration
    │       ├── WeatherWidget.kt               ← base Glance widget class
    │       ├── *Widget.kt                     ← one file per widget kind
    │       ├── WidgetTheme.kt                 ← Material3 color tokens
    │       ├── WidgetComposables.kt           ← shared composable helpers
    │       ├── WidgetConfigurationActivity.kt ← widget config screen
    │       └── generated/
    │           └── *Content.generated.kt      ← AUTO-GENERATED Glance composables
    │
    └── ios/
        └── extensions/widgets/
            ├── WeatherTimelineProvider.swift  ← WidgetKit timeline
            ├── WeatherWidgetData.swift        ← data model
            ├── WidgetColorProvider.swift      ← color token provider
            ├── SharedComponents.swift         ← reusable SwiftUI views
            ├── AllWeatherWidgets.swift        ← registers all widget kinds
            ├── WidgetKindConfigs.generated.swift  ← AUTO-GENERATED
            └── generated/
                └── *View.generated.swift      ← AUTO-GENERATED SwiftUI views
```

---

## Widget JSON schema

Every widget JSON file (`src/widgets/*.json`) conforms to `schema.json`. Key top-level fields:

```jsonc
{
  "name": "SimpleWeatherWidget",       // PascalCase, matches file name
  "displayName": "Simple Weather",     // human-readable
  "description": "...",
  "supportedSizes": [                  // array of { width, height, family }
    { "width": 80, "height": 80, "family": "small" }
  ],
  "defaultPadding": 8,                 // number or Mapbox expression
  "background": { "type": "solid", "color": "widgetBackground" },
  "settings": {                        // optional per-widget user settings
    "clockBold": { "type": "boolean", "default": true, "title": "Bold clock" }
  },
  "variants": [                        // optional size-conditional root layouts
    { "condition": "<expression>", "layout": { /* LayoutElement */ } }
  ],
  "layout": { /* root LayoutElement */ }
}
```

### Layout element types

| `type`        | Description              | Android         | iOS          | NS Svelte        |
|---------------|--------------------------|-----------------|--------------|------------------|
| `column`      | Vertical flex container  | `Column`        | `VStack`     | `stacklayout` vertical |
| `row`         | Horizontal flex container| `Row`           | `HStack`     | `stacklayout` horizontal |
| `stack`       | Z-axis overlay           | `Box`           | `ZStack`     | `gridlayout`     |
| `label`       | Text                     | `Text`          | `Text`       | `label`          |
| `image`       | Weather icon             | `Image`         | `WeatherIconView` | `image`    |
| `spacer`      | Flexible space           | `Spacer`        | `Spacer`     | margin on sibling|
| `divider`     | Horizontal rule          | `Box`           | `Divider`    | `stacklayout`    |
| `scrollView`  | Scrollable area          | `LazyColumn/Row`| `ScrollView` | merged into collectionview |
| `forEach`     | Repeat template for list | `.forEach { item ->` | `ForEach` | `collectionview` |
| `conditional` | If/else branching        | `if (…) { … }` | `if … { … }` | `{#if …}`       |
| `clock`       | Live clock               | `Text` + DateFormat | `Text(.time)` | `label` + `nowTime()` |
| `date`        | Current date             | `Text` + DateFormat | `Text(.date)` | `label`       |

### Common element properties

```jsonc
{
  "type": "label",
  "id": "tempLabel",                    // optional, for identification
  "visible": true,                      // static visibility
  "visibleIf": ["has", "temperature"],  // dynamic visibility (Mapbox expr)
  "padding": 8,                         // number or expression
  "paddingHorizontal": 4,
  "paddingVertical": 4,
  "margin": 4,
  "marginHorizontal": 4,
  "marginVertical": 4,
  "width": 100,                         // number, "100%", or expression
  "height": 50,
  "fillWidth": true,                    // expand to fill parent width
  "fillHeight": true,
  "fillMaxSize": true,                  // fill both width and height
  "flex": 1,                            // weight (like flex: 1 in CSS)
  "backgroundColor": "surface",        // theme color or hex
  "cornerRadius": 8,
  "alignment": "center",               // main-axis: start | center | end | space-between
  "crossAlignment": "start",           // cross-axis: start | center | end
  "spacing": 4                          // gap between children
}
```

---

## Mapbox expression syntax

All dynamic values use Mapbox-style expression arrays. The first element is the operator.

```jsonc
// Property access
["get", "temperature"]             // → data.temperature
["get", "item.hour"]               // → item.hour (inside forEach)
["get", "size.width"]              // → geometry width

// Existence check
["has", "description"]             // → data.description != null / isNotEmpty()

// Arithmetic
["+", ["get", "temp"], 5]
["-", ["get", "temp"], 32]
["*", ["get", "temp"], 1.8]
["/", ["get", "temp"], 2]

// Comparison
["<", ["get", "size.width"], 120]
[">=", ["get", "size.height"], 80]
["==", ["get", "windSpeed"], "0"]

// Logical
["all", cond1, cond2]             // AND
["any", cond1, cond2]             // OR
["!", cond]                        // NOT

// Conditional (like a switch)
["case",
  condition1, value1,
  condition2, value2,
  fallback
]

// String
["concat", str1, str2]
["upcase", str]
["downcase", str]
["substring", str, start, length]

// Data paths:
// - Plain names like "temperature" → prefixed as data.temperature
// - "item.*" prefix → used inside forEach, stays as-is
// - "size.width" / "size.height" → widget geometry dimensions
// - "data.*" / "config.*" → already-prefixed, kept as-is
// - "config.settings.clockBold" → user setting reference
```

---

## Shared generator modules

All generators live in `scripts/generators/` and share these modules:

### `shared-utils.ts`
Core types and pure helpers used by all generators:
- `BaseLayoutElement` — canonical interface for layout elements (has `[key: string]: any`)
- `Expression` — `any[] | string | number | boolean | null | undefined`
- `isExpression(v)` — type guard: is `v` a Mapbox expression array?
- `hasTemplateBinding(s)` — does string contain `{{...}}` placeholders?
- `getSingleBinding(s)` — extracts `prop` if string is exactly `{{prop}}`
- `parseTemplate(s)` — splits template into `{type:'text'|'binding', value}` segments
- `toPlatformHorizontalAlignment(alignment, platform)` — converts `start|center|end|space-between` to platform value
- `toPlatformVerticalAlignment(alignment, platform)` — same for vertical
- `toPlatformFontWeight(weight, platform)` — `normal|medium|bold` → platform token
- `isThemeColor(color)` — checks if string is a known theme color name
- `parseHexColor(hex)` — normalizes hex color string
- `sanitizeIdentifier(s)` — strips non-alphanumeric chars
- `normalizePropertyPath(path, addDataPrefix)` — ensures correct `data.` / `item.` prefix
- `isItemPath(path)` — checks if path starts with `item.`
- `isSettingReference(s)` — checks if string is `config.settings.*`
- `getSettingKey(s)` — strips `config.settings.` prefix
- `indent(level, spaces?)` / `indentLines(text, level)` — indentation helpers
- `extractModifierProperties(element)` / `hasModifiers(element)` — modifier extraction

### `expression-compiler.ts`
Compiles Mapbox expressions to platform-specific code strings:
```typescript
compileExpression(expr, { platform, context?, formatter?, addDataPrefix? }): string
compilePropertyValue(value, options, defaultValue?): string
```
- `platform`: `'kotlin' | 'swift' | 'javascript' | 'typescript'`
- `context`: `'value'` (default) or `'condition'`
- `formatter`: optional function to convert literal values (e.g. `(v) => \`${v}.dp\``)
- `addDataPrefix`: whether to add `data.` to bare property names (default `true`)

### `modifier-builders.ts`
Builds platform modifier/style chains from element properties:
- `buildGlanceModifier(element)` → `GlanceModifier.fillMaxWidth().padding(8.dp)…` string
- `buildSwiftModifiers(element)` → `string[]` of `.frame(…)`, `.padding(…)` etc.
- `buildHtmlStyles(element)` → `Record<string, string>` CSS properties
- `buildNativeScriptAttributes(element)` → `Record<string, string>` NS attributes
- `formatColor(colorValue, platform)` → platform-specific color expression
- `formatDimension(value, platform)` → `8.dp` / `8` / `"8px"`
- `formatFontSize(value, platform)` → `8.sp` / `8` / `"8px"`
- `DEFAULT_COLOR_MAPS` — theme color token → platform expression maps for all 4 platforms
- `stylesToCss(styles)` / `attributesToString(attrs)` — serialization helpers

---

## Generators

All generators are run via npm scripts from the `plugin-widgets/` directory:

```bash
# Run all generators in order
npm run generate:all

# Individual generators
npm run generate:kind-configs   # JSON schemas → TS + Kotlin + Swift kind configs
npm run generate:samples        # sample weather data files
npm run generate:ns             # JSON → Svelte Native components
npm run generate:glance         # JSON → Kotlin Glance composables
npm run generate:swift          # JSON → SwiftUI views
npm run generate:images         # widget preview PNGs (requires Puppeteer)
```

### `glance-generator.ts` — Android Glance
- Reads `src/widgets/*.json`
- Outputs `platforms/android/java/com/akylas/weather/widgets/generated/*Content.generated.kt`
- Generated composable signature: `fun ${Name}Content(context: Context, config: WidgetConfig, data: WeatherWidgetData, size: DpSize)`
- Uses `buildGlanceModifier`, `compileExpression({ platform: 'kotlin' })`, `toPlatformVerticalAlignment(…, 'glance')`
- Local helper `formatTextColor(v)` wraps hex colors in `ColorProvider(…)` for Glance `Text` style

### `swift-generator.ts` — iOS SwiftUI
- Reads `src/widgets/*.json`
- Outputs `platforms/ios/extensions/widgets/generated/*View.generated.swift`
- Generated view signature: `struct ${Name}View: View { let entry: WeatherEntry … }`
- Uses `compileExpression({ platform: 'swift' })`, `toPlatformFontWeight(…, 'swift')`, `DEFAULT_COLOR_MAPS.swift`
- Handles `config.settings.*` font weight via `isSettingReference` + ternary expression

### `nativescript-svelte-generator.ts` — Svelte Native
- Reads `src/widgets/*.json`
- Outputs `src/svelte/generated/*View.generated.svelte`
- Generates `<script context="module">` + `<script>` + markup
- Exports props: `config: WidgetConfig`, `data: WeatherWidgetData`, `size: {width, height}`
- Color tokens become reactive: `$: ({ colorOnSurface, … } = $colors)`
- `forEach` → `<collectionview>` with `<Template let:item>`
- `conditional` → Svelte `{#if …}{:else}{/if}`
- Has local `evaluateMapboxExpression` (handles `coalesce`, `not`, `%` not in shared compiler)
- Template strings `{{prop}}` converted via `convertBindingToSvelteExpr` using `getSingleBinding`/`parseTemplate`

### `generate-widget-kind-configs.ts`
- Reads `src/widgets/*.json` for `name` and `settings` fields
- Outputs:
  - `src/WidgetKindConfigs.ts` — `WIDGET_KIND_CONFIGS`, `getDefaultKindConfig()`
  - `platforms/android/…/WidgetKindConfigs.generated.kt` — `WidgetKindConfigs` object
  - `platforms/ios/…/WidgetKindConfigs.generated.swift` — `WidgetKindConfigs` class

### `generate-samples.ts`
- Produces sample JSON data in `src/widgets/samples/`
- Used to feed data into the image generator

### `generate-images.ts`
- Uses Puppeteer to load `scripts/index.html` + `html-renderer.ts`
- Renders each widget at each supported size
- Outputs PNG files for README / app store assets

---

## Renderers

### `scripts/renderers/html-renderer.ts`
- **Runtime** (not a generator): parses layout JSON and emits HTML string
- Uses `src/mapbox-expressions.ts` for expression evaluation
- Used by the Vite dev server (`vite.config.ts` + `scripts/index.html`) to preview widgets in browser
- Also used by `generate-images.ts` to produce PNGs via Puppeteer
- **Still uses local color/font maps** — candidate for future refactoring to use shared modules

### `src/mapbox-expressions.ts`
- Browser/NativeScript runtime expression evaluator
- Powers the HTML renderer and in-app Svelte widget previews
- Separate from `expression-compiler.ts` (which generates *code strings*); this one *evaluates* expressions against real data

---

## Theme colors

| Name              | Dark hex  | Usage                        |
|-------------------|-----------|------------------------------|
| `onSurface`       | `#E6E1E5` | Primary text                 |
| `onSurfaceVariant`| `#CAC4D0` | Secondary / muted text       |
| `primary`         | `#D0BCFF` | Accent / highlight           |
| `error`           | `#F2B8B5` | Error states                 |
| `widgetBackground`| `#1C1B1F` | Widget container background  |
| `surface`         | `#2B2930` | Card / inner surface         |

Platform resolution:
- **Kotlin/Glance**: `GlanceTheme.colors.*` (resolved at runtime by system)
- **Swift/SwiftUI**: `WidgetColorProvider.*` (custom color provider)
- **JS/TS**: literal hex values (dark mode defaults)

---

## Data flow

```
src/widgets/*.json
        │
        ├──► glance-generator.ts ──────► platforms/android/…/generated/*.kt
        │                                          ↑ used by *Widget.kt → Glance
        │
        ├──► swift-generator.ts ───────► platforms/ios/…/generated/*.swift
        │                                          ↑ used by AllWeatherWidgets.swift
        │
        ├──► nativescript-svelte-generator.ts ──► src/svelte/generated/*.svelte
        │                                          ↑ imported in app for in-app preview
        │
        ├──► generate-widget-kind-configs.ts ──► src/WidgetKindConfigs.ts
        │                                    ──► platforms/android/…/WidgetKindConfigs.generated.kt
        │                                    ──► platforms/ios/…/WidgetKindConfigs.generated.swift
        │
        └──► html-renderer.ts (runtime) ──► Puppeteer ──► PNG preview images
```

Widget update at runtime:
```
App (NativeScript)
  → WidgetUpdateService.ts
  → WidgetDataManager.ts   (fetches weather, formats WeatherWidgetData)
  → WidgetBridge.android.ts / WidgetBridge.ios.ts
  → Native platform update (Android: Glance requestUpdate, iOS: WidgetCenter reloadTimelines)
```

---

## How to add a new widget

1. **Create the JSON** in `src/widgets/NewWidget.json` following the schema.
2. **Run all generators**: `npm run generate:all` from the `plugin-widgets/` directory.
3. **Android**: The generated `NewWidgetContent.generated.kt` is ready. Create `platforms/android/java/.../NewWidget.kt` extending `WeatherWidget`, referencing the generated content.
4. **iOS**: The generated `NewWidgetView.generated.swift` is ready. Register it in `AllWeatherWidgets.swift`.
5. **App preview**: Import the generated Svelte component from `src/svelte/generated/NewWidgetView.generated.svelte`.
6. Add the widget kind to any manifest / configuration files as needed.

---

## How to modify a generator

The generators follow a consistent pattern:
1. Parse JSON into `WidgetLayout` / `BaseLayoutElement` objects.
2. Walk the element tree recursively with `generateElement(element, indent)`.
3. Each element type has a dedicated `generate*` function.
4. Use shared utilities from `shared-utils.ts`, `expression-compiler.ts`, and `modifier-builders.ts` for all expression compilation, color/font mapping, and modifier building.
5. **Glance is the reference implementation** — it is the most tested and complete generator. When in doubt, follow its patterns.

When adding a new expression operator:
- Add it to `expression-compiler.ts` (handles Kotlin, Swift, JS, TS in one place).
- The NativeScript generator has a local `evaluateMapboxExpression` for operators it handles differently (`coalesce`, `not`, `%`); add there too if needed.

---

## Running the dev preview

```bash
cd plugin-widgets
npm run dev   # starts Vite dev server on http://localhost:5173
              # renders widget previews in the browser using html-renderer.ts
```

---

## Key files to know

| File | When to touch |
|------|---------------|
| `src/widgets/*.json` | Add/change widget layouts |
| `scripts/generators/shared-utils.ts` | Add shared types, helpers, alignment/color/font logic |
| `scripts/generators/expression-compiler.ts` | Add new Mapbox expression operators |
| `scripts/generators/modifier-builders.ts` | Add new CSS/Glance/Swift modifier handling |
| `scripts/generators/glance-generator.ts` | Change Android Glance output (reference impl) |
| `scripts/generators/swift-generator.ts` | Change iOS SwiftUI output |
| `scripts/generators/nativescript-svelte-generator.ts` | Change Svelte Native output |
| `scripts/renderers/html-renderer.ts` | Change HTML preview rendering |
| `src/WidgetTypes.ts` | Add/change shared TypeScript types |
| `platforms/android/java/…/WeatherWidgetManager.kt` | Change Android data model |
| `platforms/ios/extensions/widgets/WeatherWidgetData.swift` | Change iOS data model |
