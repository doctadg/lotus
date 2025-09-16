const { createClerkClient } = require('@clerk/backend');
require('dotenv').config();

async function sendInvitations() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error('❌ CLERK_SECRET_KEY is not set');
    process.exit(1);
  }

  const clerk = createClerkClient({ secretKey });
  
  const targetEmails = ['doctadg56@gmail.com', 'solsociety1909@gmail.com'];
  
  console.log('Sending password setup invitations...\n');
  
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
      
      try {
        // Create an invitation for the existing user
        const invitation = await clerk.invitations.createInvitation({
          emailAddress: email,
          redirectUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login?setup=true`,
        });
        
        console.log('✅ Setup invitation sent');
        console.log(`   Invitation ID: ${invitation.id}`);
        console.log(`   Status: ${invitation.status}`);
      } catch (inviteError) {
        console.error('❌ Failed to send invitation:', inviteError.message);
        
        // If invitation fails, try creating a password reset token
        try {
          console.log('   Trying password reset approach...');
          const resetTokens = await clerk.users.getUserPasswordResetTokens(user.id);
          console.log(`   Existing password reset tokens: ${resetTokens.length}`);
          
          // Note: The user will need to visit /login and use "Forgot Password" 
          // or we can direct them to sign up again which will link to existing account
          console.log('   💡 User should try "Forgot Password" on login page');
          
        } catch (tokenError) {
          console.error('❌ Failed to check reset tokens:', tokenError.message);
        }
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${email}:`, error.message);
      if (error.errors) {
        error.errors.forEach(err => console.error(`   - ${err.message}`));
      }
    }
    
    console.log('');
  }
  
  console.log('📧 Instructions for users:');
  console.log('1. Check your email for setup/invitation links');
  console.log('2. If no email received, go to the login page and click "Forgot Password"');
  console.log('3. This will send a password reset email to set up your password');
  console.log('4. After setting password, you can sign in normally');
  console.log('5. All your existing data (chats, memories, etc.) will be preserved');
}

sendInvitations().catch(console.error);