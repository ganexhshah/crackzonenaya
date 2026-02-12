require('dotenv').config();

console.log('═══════════════════════════════════════════════════════');
console.log('📧 EMAIL CONFIGURATION DIAGNOSTIC');
console.log('═══════════════════════════════════════════════════════\n');

// Check environment variables
console.log('1️⃣  Checking Environment Variables...\n');

const checks = [
  { name: 'EMAIL_HOST', value: process.env.EMAIL_HOST, required: true },
  { name: 'EMAIL_PORT', value: process.env.EMAIL_PORT, required: true },
  { name: 'EMAIL_USER', value: process.env.EMAIL_USER, required: true },
  { name: 'EMAIL_PASSWORD', value: process.env.EMAIL_PASSWORD, required: true },
  { name: 'EMAIL_FROM', value: process.env.EMAIL_FROM, required: false },
];

let allGood = true;

checks.forEach(check => {
  const status = check.value ? '✅' : (check.required ? '❌' : '⚠️');
  const displayValue = check.name === 'EMAIL_PASSWORD' 
    ? (check.value ? `${'*'.repeat(check.value.length)} (${check.value.length} chars)` : 'NOT SET')
    : (check.value || 'NOT SET');
  
  console.log(`${status} ${check.name}: ${displayValue}`);
  
  if (check.required && !check.value) {
    allGood = false;
  }
});

console.log('\n═══════════════════════════════════════════════════════\n');

if (!allGood) {
  console.log('❌ CONFIGURATION INCOMPLETE');
  console.log('Please set all required environment variables in backend/.env\n');
  process.exit(1);
}

// Check Gmail specific issues
if (process.env.EMAIL_HOST === 'smtp.gmail.com') {
  console.log('2️⃣  Gmail Configuration Detected\n');
  console.log('📋 Gmail Requirements:');
  console.log('   • 2-Step Verification must be enabled');
  console.log('   • Use App Password (NOT regular password)');
  console.log('   • App password should be 16 characters');
  console.log('   • Generate at: https://myaccount.google.com/apppasswords\n');
  
  if (process.env.EMAIL_PASSWORD) {
    const passLength = process.env.EMAIL_PASSWORD.length;
    if (passLength === 16) {
      console.log(`✅ Password length is correct (16 characters)`);
    } else {
      console.log(`⚠️  Password length is ${passLength} characters`);
      console.log(`   Gmail app passwords are typically 16 characters`);
      console.log(`   Your current password might be incorrect\n`);
    }
  }
}

console.log('\n═══════════════════════════════════════════════════════\n');
console.log('3️⃣  Next Steps:\n');
console.log('To test email sending, run:');
console.log('   node test-email.js\n');
console.log('To fix Gmail authentication:');
console.log('   1. Visit: https://myaccount.google.com/apppasswords');
console.log('   2. Generate new app password');
console.log('   3. Update EMAIL_PASSWORD in backend/.env');
console.log('   4. Run: node test-email.js\n');
console.log('═══════════════════════════════════════════════════════\n');
