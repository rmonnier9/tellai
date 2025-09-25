# shadcn/ui monorepo template

This template is for creating a monorepo with shadcn/ui.

## Usage

```bash
pnpm dlx shadcn@latest init
```

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/dashboard
```

This will place the ui components in the `packages/ui/src/components` directory.

## Tailwind

Your `tailwind.config.ts` and `globals.css` are already set up to use the components from the `ui` package.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button"
```

TODO MVP
[] Keywords API
    - https://dataforseo.com/
[] Post Planner Workflow

---
Onboarding

Business Detail
- Website URL
- Business Name
- Language 
- Country
- Description

Audience and Competitors
- Enter your target audience groups to create relevant content. (max 7)
- Enter competitors (websites url) to discover the SEO keywords they rank for (max 7)


Connect Google Search Console (Avoid suggesting keywords you already rank for)
---