/*
  Usage:
    1) Ensure env vars are set: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY
    2) Run: node scripts/migrate-clerk-users.js

  This script links existing DB users to Clerk by email.
*/

const { PrismaClient } = require('@prisma/client');
const { createClerkClient } = require('@clerk/backend');
require('dotenv').config();

async function main() {
  const prisma = new PrismaClient();

  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error('CLERK_SECRET_KEY is not set. Aborting.');
    process.exit(1);
  }

  const clerk = createClerkClient({ secretKey });

  const users = await prisma.user.findMany({ where: { clerkId: null } });
  console.log(`Found ${users.length} users without Clerk ID`);

  let linked = 0;
  let created = 0;
  let failed = 0;

  for (const u of users) {
    if (!u.email) continue;
    try {
      // Try to find existing Clerk user by email
      const list = await clerk.users.getUserList({ emailAddress: [u.email] });
      let clerkUser = list?.data?.[0];

      if (!clerkUser) {
        // Create a passwordless user (user will complete in Clerk UI)
        clerkUser = await clerk.users.createUser({
          emailAddress: [u.email],
          skipPasswordRequirement: true,
          firstName: u.name ? String(u.name).split(' ')[0] : undefined,
          lastName: u.name ? String(u.name).split(' ').slice(1).join(' ') || undefined : undefined,
        });
        created++;
        console.log(`Created Clerk user for ${u.email} -> ${clerkUser.id}`);
      } else {
        linked++;
        console.log(`Found existing Clerk user for ${u.email} -> ${clerkUser.id}`);
      }

      await prisma.user.update({
        where: { id: u.id },
        data: { clerkId: clerkUser.id },
      });
    } catch (err) {
      failed++;
      console.error(`Failed to link/migrate ${u.email}:`, err?.errors?.[0] || err?.message || err);
    }
  }

  console.log(`\nMigration complete. Linked: ${linked}, Created: ${created}, Failed: ${failed}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

