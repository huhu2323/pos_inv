# Frontend Architecture

This document describes how the Tofu POS Terminal React app is organized after the feature-based refactor. Use it when adding screens, moving files, or onboarding to the codebase.

---

## Design goals

1. **Feature colocation** — UI, hooks, and feature-specific utils live together by domain (POS, products, sales, etc.).
2. **Shared infrastructure** — Cross-cutting concerns (theme, layout, formatting, database) stay in `shared/` and `lib/`.
3. **Explicit imports** — Path alias `@/` replaces deep relative paths (`../../`). No barrel re-exports except at app boundaries.
4. **Thin app shell** — Routing and providers are separated from feature code.

---

## Directory layout

```
src/
├── main.tsx                 # Bootstrap: init DB, mount React
├── index.css                # Global styles
│
├── app/                     # Application shell
│   ├── App.tsx              # Root component (providers + router)
│   ├── providers.tsx        # ThemeModeProvider + AuthProvider
│   └── routes.tsx           # Route tree and guards
│
├── features/                # Domain modules (one folder per business area)
│   ├── auth/
│   │   ├── api/             # authService (login, sessions, bcrypt)
│   │   ├── components/      # ProtectedRoute, AdminRoute
│   │   ├── context/         # AuthContext, authContextState
│   │   ├── hooks/           # useAuth
│   │   └── pages/           # LoginPage
│   ├── dashboard/pages/
│   ├── pos/
│   │   ├── pages/           # PosPage (orchestrator)
│   │   ├── components/      # Product grid, cart, payment, dialogs
│   │   ├── hooks/           # usePosCart
│   │   ├── utils/           # posProducts, posStyles, posPanelDialog
│   │   └── types.ts         # CartLine and POS-specific types
│   ├── products/
│   │   ├── pages/
│   │   └── components/      # Form, detail, variant editor, image fields
│   ├── inventory/
│   ├── sales/
│   ├── invoices/
│   │   └── utils/           # printInvoice (jsPDF receipts)
│   ├── employees/
│   ├── settings/
│   └── archive/
│
├── shared/                  # Reusable, domain-agnostic code
│   ├── components/          # AuthLoadingScreen
│   │   └── images/          # StoredImage (used by POS + products)
│   ├── hooks/               # useNativeBackButton, useResolvedImageUrl
│   ├── layouts/
│   │   ├── AppLayout.tsx    # Sidebar shell for admin pages
│   │   └── navConfig.ts     # Navigation items and drawer constants
│   ├── theme/               # MUI theme, dark/light toggle
│   └── utils/               # currency, vat, formatDate, snakeCase, persistentStorage
│
└── lib/                     # Data layer (not React UI)
    ├── db/                  # Dexie, SQLite adapter, types, migrations
    └── services/            # CRUD and business rules per entity
```

---

## Feature module anatomy

Each feature under `features/<name>/` follows the same pattern:

| Subfolder | Purpose | Example |
|-----------|---------|---------|
| `pages/` | Route-level screens | `ProductsPage.tsx` |
| `components/` | Dialogs, tables, panels used only by this feature | `ProductFormDialog.tsx` |
| `hooks/` | Feature-specific React hooks | `usePosCart.ts` |
| `utils/` | Pure helpers for this domain | `posProducts.ts`, `printInvoice.ts` |
| `api/` | Optional; auth keeps low-level API here | `authService.ts` |

**Rule of thumb:** If a component is used by exactly one feature, keep it in that feature. If two or more features need it, move it to `shared/`.

Entity services (`productService`, `saleService`, etc.) remain in `lib/services/` because they are shared infrastructure consumed by multiple features.

---

## Routing

Routes are defined in `src/app/routes.tsx`:

```
/login                          → LoginPage (public)
/pos                            → PosPage (fullscreen, no sidebar)
/dashboard, /sales, /invoices   → AppLayout + page (all authenticated users)
/products, /inventory, …        → AppLayout + AdminRoute + page (admin only)
```

Guard chain:

1. **`ProtectedRoute`** — Requires a logged-in user; redirects to `/login`.
2. **`AppLayout`** — Sidebar, top bar, and `<Outlet />` for nested pages.
3. **`AdminRoute`** — Requires `role === 'admin'`; redirects to `/dashboard`.

POS intentionally sits **outside** `AppLayout` for a fullscreen register experience.

---

## Import conventions

Use the `@/` alias (configured in `vite.config.ts` and `tsconfig.app.json`):

```ts
import { useAuth } from '@/features/auth/hooks/useAuth'
import { listProducts } from '@/lib/services/productService'
import type { Product } from '@/lib/db/types'
import { formatCurrency } from '@/shared/utils/currency'
```

| Import from | When |
|-------------|------|
| `@/features/<domain>/…` | Feature pages, components, hooks, utils |
| `@/shared/…` | Theme, layout, cross-feature UI and utils |
| `@/lib/db/…` | Types and database access |
| `@/lib/services/…` | Entity CRUD and business logic |
| `@/app/…` | App shell only (routes, providers) |

Avoid:

- Deep relative paths (`../../../`)
- Barrel files that re-export entire modules (hurts tree-shaking and hides dependencies)

---

## State and data flow

```
Page / Component
      ↓ calls
lib/services/*     (productService, saleService, …)
      ↓ uses
lib/db/database    (Dexie on web/desktop, SQLite on mobile)
```

**Auth state** lives in React context (`features/auth/context/`). Pages consume it via `useAuth()`.

**Theme mode** lives in `shared/theme/` via `ThemeModeProvider` and `useThemeMode()`.

**Local UI state** (dialogs, form fields, table loading) stays in page components or feature hooks — there is no global Redux/Zustand store.

---

## POS feature breakdown

The POS register was split from a single 700+ line page into focused pieces:

| File | Responsibility |
|------|----------------|
| `pages/PosPage.tsx` | Load products, wire sale completion, layout grid |
| `hooks/usePosCart.ts` | Cart lines, totals, add/remove/clear |
| `components/PosHeader.tsx` | Top bar with user info and exit |
| `components/PosProductGrid.tsx` | Product tiles, search/barcode buttons |
| `components/PosCartPanel.tsx` | Line items with quantity controls |
| `components/PosPaymentPanel.tsx` | Numpad, quick bills, change, complete sale |
| `components/PosSearchDialog.tsx` | QWERTY search overlay |
| `components/PosBarcodeDialog.tsx` | Manual/scanner barcode entry |
| `utils/posProducts.ts` | Build sellable items from catalog |
| `utils/posStyles.ts` | Touch-friendly button sizes and numpad keys |

---

## Shared utilities

| Utility | Location | Used by |
|---------|----------|---------|
| `formatCurrency` | `shared/utils/currency.ts` | POS, sales, invoices, dashboard |
| `formatDate` | `shared/utils/formatDate.ts` | Sales, invoices, inventory, employees, archive |
| `calculateVatBreakdown` | `shared/utils/vat.ts` | Invoice service |
| `toSnakeCase` | `shared/utils/snakeCase.ts` | Product form (image filenames) |
| `persistentStorage` | `shared/utils/persistentStorage.ts` | Auth session token |

---

## Adding a new feature

1. Create `src/features/<name>/pages/<Name>Page.tsx`.
2. Add components under `features/<name>/components/` if needed.
3. Add or extend a service in `lib/services/` if new persistence is required.
4. Add types to `lib/db/types.ts` and schema migrations if the database changes.
5. Register the route in `src/app/routes.tsx`.
6. Add a nav item in `shared/layouts/navConfig.ts` if it should appear in the sidebar.
7. Wrap with `AdminRoute` in `routes.tsx` if admin-only.

---

## Adding a new shared component

Place it in `shared/components/` (or `shared/components/images/` for image-related UI). Import from `@/shared/components/...` in any feature.

Only promote to `shared/` when **two or more features** need the same component.

---

## Database and services

The `lib/` folder is intentionally separate from React:

- **`lib/db/types.ts`** — Single source of truth for domain types (`Product`, `Sale`, `Invoice`, `User`, etc.).
- **`lib/db/database.ts`** — Picks Dexie (web/desktop) or SQLite (Capacitor native) at startup.
- **`lib/services/*`** — Async functions that pages call directly; no React dependencies.

This keeps business logic testable and avoids coupling UI to storage details.

---

## Theme

MUI theme configuration lives in `shared/theme/`:

- `createAppTheme.ts` — Palette, typography, component overrides
- `ThemeModeProvider.tsx` — Wraps app with MUI `ThemeProvider`
- `ThemeModeToggle.tsx` — Light/dark switch (used in layout and login)
- `useThemeMode.ts` — Read/toggle current mode

---

## Electron and Capacitor

Platform-specific code stays outside `src/`:

- `electron/main.ts`, `electron/preload.ts` — Desktop shell
- `capacitor.config.ts`, `android/`, `ios/` — Mobile shell
- `shared/hooks/useNativeBackButton.ts` — Android hardware back button (Capacitor only)

The React app itself is platform-agnostic; `main.tsx` initializes the database before rendering.

---

## Related docs

- [README](../README.md) — Setup, features, and scripts
- [RELEASING.md](./RELEASING.md) — Versioning and desktop/mobile release process
