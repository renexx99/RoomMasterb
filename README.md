
```
roommaster
├─ docs
├─ eslint.config.mjs
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ public
│  ├─ assets
│  ├─ file.svg
│  ├─ globe.svg
│  ├─ next.svg
│  ├─ vercel.svg
│  └─ window.svg
├─ README.md
├─ src
│  ├─ app
│  │  ├─ admin
│  │  │  └─ dashboard
│  │  │     └─ page.tsx
│  │  ├─ api
│  │  ├─ auth
│  │  │  ├─ layout.tsx
│  │  │  ├─ login
│  │  │  │  └─ page.tsx
│  │  │  └─ register
│  │  │     └─ page.tsx
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  ├─ page.tsx
│  │  └─ super-admin
│  │     └─ dashboard
│  │        └─ page.tsx
│  ├─ components
│  │  ├─ charts
│  │  ├─ feedback
│  │  ├─ forms
│  │  └─ layout
│  ├─ core
│  │  ├─ config
│  │  │  ├─ env.ts
│  │  │  ├─ routes.ts
│  │  │  └─ supabaseClient.ts
│  │  ├─ constants
│  │  │  └─ roles.ts
│  │  ├─ hooks
│  │  ├─ providers
│  │  │  └─ AppProvider.tsx
│  │  ├─ types
│  │  │  └─ database.ts
│  │  └─ utils
│  ├─ features
│  │  ├─ admin
│  │  │  ├─ components
│  │  │  ├─ hooks
│  │  │  ├─ models
│  │  │  ├─ repositories
│  │  │  └─ services
│  │  ├─ auth
│  │  │  ├─ components
│  │  │  │  ├─ LoginForm.tsx
│  │  │  │  ├─ ProtectedRoute.tsx
│  │  │  │  └─ RegisterForm.tsx
│  │  │  ├─ hooks
│  │  │  │  └─ useAuth.ts
│  │  │  ├─ models
│  │  │  ├─ repositories
│  │  │  └─ services
│  │  ├─ guest
│  │  ├─ master-data
│  │  │  ├─ hooks
│  │  │  ├─ models
│  │  │  ├─ repositories
│  │  │  └─ services
│  │  ├─ reservation
│  │  ├─ room
│  │  ├─ super-admin
│  │  │  ├─ components
│  │  │  ├─ hooks
│  │  │  ├─ models
│  │  │  ├─ repositories
│  │  │  └─ services
│  │  └─ transaction
│  ├─ global.css
│  ├─ lib
│  └─ middleware.ts
├─ supabase
│  └─ migrations
│     └─ 001_create_profiles_and_hotels.sql
└─ tsconfig.json

```