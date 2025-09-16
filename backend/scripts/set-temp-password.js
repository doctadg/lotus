const { createClerkClient } = require('@clerk/backend');
require('dotenv').config();

async function setTempPassword() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error('❌ CLERK_SECRET_KEY is not set');
    process.exit(1);
  }

  const clerk = createClerkClient({ secretKey });
  
  const userId = 'user_328OsJZiL9swi8TZoBtKgWEKhFL'; // doctadg56@gmail.com
  const tempPassword = 'TempPass123!'; // User should change this immediately
  
  console.log('Setting temporary password for user...\n');
  
  try {
    // Set a temporary password for the user
    console.log('Setting temporary password...');
    const updatedUser = await clerk.users.updateUser(userId, {
      password: tempPassword,
      skipPasswordRequirement: false,
    });
    
    console.log('✅ Temporary password set successfully');
    console.log(`Password enabled: ${updatedUser.passwordEnabled}`);
    
    console.log('\n🔐 TEMPORARY LOGIN CREDENTIALS:');
    console.log('Email: doctadg56@gmail.com');
    console.log(`Password: ${tempPassword}`);
    console.log('\n⚠️  IMPORTANT: Change this password immediately after logging in!');
    console.log('\nSteps to log in:');
    console.log('1. Go to your app login page');
    console.log('2. Enter email: doctadg56@gmail.com');
    console.log(`3. Enter password: ${tempPassword}`);
    console.log('4. After successful login, go to account settings');
    console.log('5. Change to a secure password of your choice');
    
  } catch (error) {
    console.error('❌ Error setting password:', error.message);
    if (error.errors) {
      error.errors.forEach(err => console.error(`   - ${err.message}`));
    }
    
    // Alternative approach: enable passwordless signin
    console.log('\n🔄 Trying alternative: Enable passwordless sign-in...');
    try {
      const altUser = await clerk.users.updateUser(userId, {
        skipPasswordRequirement: true, // Allow passwordless
      });
      console.log('✅ Passwordless sign-in enabled');
      console.log('\n📧 User can now:');
      console.log('1. Go to login page');
      console.log('2. Enter email: doctadg56@gmail.com');
      console.log('3. Choose "Send magic link" or similar passwordless option');
      console.log('4. Check email for magic link to sign in');
    } catch (altError) {
      console.error('❌ Alternative approach failed:', altError.message);
    }
  }
}

setTempPassword().catch(console.error);