const { createClerkClient } = require('@clerk/backend');
require('dotenv').config();

async function fixAuthMethods() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error('❌ CLERK_SECRET_KEY is not set');
    process.exit(1);
  }

  const clerk = createClerkClient({ secretKey });
  
  const targetEmails = ['doctadg56@gmail.com', 'solsociety1909@gmail.com'];
  
  console.log('Checking and fixing authentication methods...\n');
  
  for (const email of targetEmails) {
    try {
      console.log(`=== ${email} ===`);
      
      // Get user by email
      const usersList = await clerk.users.getUserList({ emailAddress: [email] });
      if (usersList.data.length === 0) {
        console.log(`❌ No user found with email: ${email}`);
        continue;
      }
      
      const user = usersList.data[0];
      console.log(`User ID: ${user.id}`);
      
      // Check current password authentication
      const hasPassword = user.passwordEnabled;
      const externalAccounts = user.externalAccounts || [];
      
      console.log(`Password enabled: ${hasPassword}`);
      console.log(`External accounts: ${externalAccounts.length}`);
      externalAccounts.forEach(account => {
        console.log(`  - ${account.provider}: ${account.emailAddress}`);
      });
      
      // Check if user needs password setup
      if (!hasPassword && externalAccounts.length === 0) {
        console.log('⚠️  User has no authentication method set up');
        console.log('   Sending password reset email to enable password login...');
        
        try {
          // Create a password reset token and send email
          const token = await clerk.users.createPasswordReset({ userId: user.id });
          console.log('✅ Password reset email sent');
          console.log(`   Token ID: ${token.id}`);
        } catch (resetError) {
          console.error('❌ Failed to send password reset:', resetError.message);
          
          // Alternative: Update user to enable password
          try {
            console.log('   Trying alternative: enabling password directly...');
            await clerk.users.updateUser(user.id, {
              skipPasswordRequirement: false,
            });
            console.log('✅ Password requirement enabled. User will need to set password on next login.');
          } catch (updateError) {
            console.error('❌ Failed to enable password:', updateError.message);
          }
        }
      } else if (hasPassword) {
        console.log('✅ Password authentication is available');
      } else {
        console.log('ℹ️  User has external authentication methods');
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${email}:`, error.message);
      if (error.errors) {
        error.errors.forEach(err => console.error(`   - ${err.message}`));
      }
    }
    
    console.log('');
  }
  
  console.log('💡 Next steps:');
  console.log('1. Users should check their email for password reset instructions');
  console.log('2. They can set a new password and then sign in normally');
  console.log('3. Alternatively, they can use social login (Google/GitHub) if available');
}

fixAuthMethods().catch(console.error);