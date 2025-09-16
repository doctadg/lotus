const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function checkUsers() {
  const prisma = new PrismaClient();
  
  const targetEmails = ['doctadg56@gmail.com', 'solsociety1909@gmail.com'];
  
  console.log('Checking for users with emails:', targetEmails);
  
  for (const email of targetEmails) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        _count: {
          select: {
            chats: true,
            memories: true,
            contexts: true,
            embeddings: true
          }
        }
      }
    });
    
    if (user) {
      console.log(`\n=== User: ${email} ===`);
      console.log(`ID: ${user.id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Role: ${user.role}`);
      console.log(`Clerk ID: ${user.clerkId || 'NOT SET'}`);
      console.log(`Created: ${user.createdAt}`);
      console.log(`Data counts:`);
      console.log(`  - Chats: ${user._count.chats}`);
      console.log(`  - Memories: ${user._count.memories}`);
      console.log(`  - Contexts: ${user._count.contexts}`);
      console.log(`  - Embeddings: ${user._count.embeddings}`);
    } else {
      console.log(`\n❌ User not found: ${email}`);
    }
  }
  
  await prisma.$disconnect();
}

checkUsers().catch(console.error);