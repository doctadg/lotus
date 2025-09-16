const { createClerkClient } = require('@clerk/backend');
require('dotenv').config();

async function verifyClerkAccounts() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error('❌ CLERK_SECRET_KEY is not set');
    process.exit(1);
  }

  const clerk = createClerkClient({ secretKey });
  
  const targetEmails = ['doctadg@gmail.com', 'solsociety1909@gmail.com'];
  const clerkIds = ['user_328WQJyCVer4LBpsAkgQxlczTbS', 'user_328OsBDyDftC7bUSjnA8gC8ib59'];
  
  console.log('Verifying Clerk accounts...\n');
  
  for (let i = 0; i < targetEmails.length; i++) {
    const email = targetEmails[i];
    const clerkId = clerkIds[i];
    
    try {
      console.log(`=== ${email} ===`);
      
      // Check by Clerk ID
      console.log(`Checking Clerk ID: ${clerkId}`);
      const userById = await clerk.users.getUser(clerkId);
      console.log(`✅ Found user by ID: ${userById.id}`);
      console.log(`   Email: ${userById.emailAddresses[0]?.emailAddress}`);
      console.log(`   Verified: ${userById.emailAddresses[0]?.verification?.status}`);
      console.log(`   Created: ${new Date(userById.createdAt).toISOString()}`);
      console.log(`   Last sign in: ${userById.lastSignInAt ? new Date(userById.lastSignInAt).toISOString() : 'Never'}`);
      console.log(`   Status: ${userById.banned ? 'BANNED' : 'Active'}`);
      
      // Check by email
      console.log(`Checking by email: ${email}`);
      const usersByEmail = await clerk.users.getUserList({ emailAddress: [email] });
      if (usersByEmail.data.length > 0) {
        console.log(`✅ Found ${usersByEmail.data.length} user(s) by email`);
        usersByEmail.data.forEach((user, idx) => {
          console.log(`   User ${idx + 1}: ${user.id} (${user.emailAddresses[0]?.emailAddress})`);
        });
      } else {
        console.log(`❌ No users found by email: ${email}`);
      }
      
    } catch (error) {
      console.error(`❌ Error checking ${email}:`, error.message);
      if (error.errors) {
        error.errors.forEach(err => console.error(`   - ${err.message}`));
      }
    }
    
    console.log('');
  }
}

verifyClerkAccounts().catch(console.error);