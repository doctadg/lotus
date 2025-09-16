const { createClerkClient } = require('@clerk/backend');
require('dotenv').config();

async function enablePasswordAuth() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error('❌ CLERK_SECRET_KEY is not set');
    process.exit(1);
  }

  const clerk = createClerkClient({ secretKey });
  
  const userId = 'user_328OsJZiL9swi8TZoBtKgWEKhFL'; // doctadg56@gmail.com
  
  console.log('Enabling password authentication for user...\n');
  
  try {
    // First, let's try to update the user to require password
    console.log('Updating user to enable password...');
    const updatedUser = await clerk.users.updateUser(userId, {
      passwordDigest: null, // Clear any existing password hash
      skipPasswordRequirement: false, // Require password
      skipPasswordChecks: false, // Enable password validation
    });
    
    console.log('✅ User updated successfully');
    console.log(`Password enabled: ${updatedUser.passwordEnabled}`);
    
    // Now let's create a password reset token to allow user to set password
    console.log('\nCreating password reset opportunity...');
    
    try {
      // Try to create a password reset using the correct API
      const response = await fetch(`https://api.clerk.com/v1/users/${userId}/password_reset`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const resetData = await response.json();
        console.log('✅ Password reset initiated');
        console.log(`Reset token created, email should be sent`);
      } else {
        const errorData = await response.json();
        console.log('❌ Failed to create password reset:', errorData.message || response.status);
      }
    } catch (resetError) {
      console.error('❌ Password reset error:', resetError.message);
    }
    
  } catch (error) {
    console.error('❌ Error updating user:', error.message);
    if (error.errors) {
      error.errors.forEach(err => console.error(`   - ${err.message}`));
    }
  }
  
  console.log('\n📧 Next steps for user:');
  console.log('1. Go to your app login page');
  console.log('2. Click "Forgot Password"');
  console.log('3. Enter: doctadg56@gmail.com');
  console.log('4. Check email for password reset link');
  console.log('5. Set a new password');
  console.log('6. Sign in with new password');
}

enablePasswordAuth().catch(console.error);