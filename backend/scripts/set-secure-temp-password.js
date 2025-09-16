const { createClerkClient } = require('@clerk/backend');
require('dotenv').config();

async function setSecureTempPassword() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.error('❌ CLERK_SECRET_KEY is not set');
    process.exit(1);
  }

  const clerk = createClerkClient({ secretKey });
  
  const userIds = [
    { id: 'user_328OsJZiL9swi8TZoBtKgWEKhFL', email: 'doctadg56@gmail.com' },
    { id: 'user_328OsBDyDftC7bUSjnA8gC8ib59', email: 'solsociety1909@gmail.com' }
  ];
  
  // Generate unique secure temporary passwords
  const generateSecurePassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };
  
  console.log('Setting secure temporary passwords...\n');
  
  for (const user of userIds) {
    const tempPassword = generateSecurePassword();
    
    try {
      console.log(`Setting password for ${user.email}...`);
      const updatedUser = await clerk.users.updateUser(user.id, {
        password: tempPassword,
        skipPasswordRequirement: false,
      });
      
      console.log('✅ Temporary password set successfully');
      console.log(`Password enabled: ${updatedUser.passwordEnabled}`);
      
      console.log(`\n🔐 TEMPORARY LOGIN CREDENTIALS FOR ${user.email.toUpperCase()}:`);
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${tempPassword}`);
      console.log('⚠️  CHANGE THIS PASSWORD IMMEDIATELY AFTER LOGGING IN!\n');
      
    } catch (error) {
      console.error(`❌ Error setting password for ${user.email}:`, error.message);
      if (error.errors) {
        error.errors.forEach(err => console.error(`   - ${err.message}`));
      }
      console.log('');
    }
  }
  
  console.log('📋 LOGIN INSTRUCTIONS:');
  console.log('1. Go to your app login page');
  console.log('2. Enter your email and temporary password above');
  console.log('3. After successful login, immediately change your password');
  console.log('4. All your existing data will be available');
}

setSecureTempPassword().catch(console.error);