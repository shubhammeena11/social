This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Like and Follow Retention

Likes and follows are soft-deleted with `isDeleted` and `deletedAt`. The existing unique indexes on `(user, post)` and `(follower, following)` are intentionally retained: a later like or follow reactivates that pair's existing record, preventing duplicate active relationships without an index migration. Existing records missing `isDeleted` are treated as active, so no backfill is required. Rejected follow requests remain as `rejected` records; cancelling a pending request soft-deletes it.

Like and follower counters are updated once per atomic relationship transition. If a database failure interrupts a counter update, pause relationship writes and run `npm run reconcile:relationship-counts` to review computed counts. Run `npm run reconcile:relationship-counts -- --apply` only after reviewing the dry-run output; the apply mode sets post and user counters to counts derived from active Likes and accepted Follows. The command never changes relationship records or indexes.
