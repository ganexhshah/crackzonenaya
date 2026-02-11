#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Pre-Deployment Checklist\n');

const checks = {
  passed: [],
  failed: [],
  warnings: []
};

// Check 1: Frontend package.json exists
console.log('📦 Checking frontend package.json...');
if (fs.existsSync('frontend/package.json')) {
  checks.passed.push('Frontend package.json exists');
} else {
  checks.failed.push('Frontend package.json not found');
}

// Check 2: Backend package.json exists
console.log('📦 Checking backend package.json...');
if (fs.existsSync('backend/package.json')) {
  checks.passed.push('Backend package.json exists');
} else {
  checks.failed.push('Backend package.json not found');
}

// Check 3: Frontend .env.example exists
console.log('🔐 Checking frontend environment template...');
if (fs.existsSync('frontend/.env.example')) {
  checks.passed.push('Frontend .env.example exists');
} else {
  checks.warnings.push('Frontend .env.example not found - create one for reference');
}

// Check 4: Backend .env.example exists
console.log('🔐 Checking backend environment template...');
if (fs.existsSync('backend/.env.example')) {
  checks.passed.push('Backend .env.example exists');
} else {
  checks.warnings.push('Backend .env.example not found - create one for reference');
}

// Check 5: Prisma schema exists
console.log('🗄️  Checking Prisma schema...');
if (fs.existsSync('backend/prisma/schema.prisma')) {
  checks.passed.push('Prisma schema exists');
} else {
  checks.failed.push('Prisma schema not found');
}

// Check 6: .gitignore exists
console.log('📝 Checking .gitignore...');
if (fs.existsSync('.gitignore')) {
  checks.passed.push('.gitignore exists');
} else {
  checks.warnings.push('.gitignore not found');
}

// Check 7: Vercel config files
console.log('⚙️  Checking Vercel configurations...');
if (fs.existsSync('frontend/vercel.json')) {
  checks.passed.push('Frontend vercel.json exists');
} else {
  checks.warnings.push('Frontend vercel.json not found');
}

if (fs.existsSync('backend/vercel.json')) {
  checks.passed.push('Backend vercel.json exists');
} else {
  checks.warnings.push('Backend vercel.json not found');
}

// Check 8: Try frontend build
console.log('\n🏗️  Testing frontend build...');
try {
  process.chdir('frontend');
  console.log('   Installing dependencies...');
  execSync('npm install', { stdio: 'ignore' });
  console.log('   Running build...');
  execSync('npm run build', { stdio: 'ignore' });
  checks.passed.push('Frontend builds successfully');
  process.chdir('..');
} catch (error) {
  checks.failed.push('Frontend build failed - check for errors');
  process.chdir('..');
}

// Check 9: Try backend build
console.log('🏗️  Testing backend build...');
try {
  process.chdir('backend');
  console.log('   Installing dependencies...');
  execSync('npm install', { stdio: 'ignore' });
  console.log('   Running build...');
  execSync('npm run build', { stdio: 'ignore' });
  checks.passed.push('Backend builds successfully');
  process.chdir('..');
} catch (error) {
  checks.failed.push('Backend build failed - check for errors');
  process.chdir('..');
}

// Check 10: Git repository
console.log('\n📚 Checking Git repository...');
if (fs.existsSync('.git')) {
  checks.passed.push('Git repository initialized');
  
  try {
    const remote = execSync('git remote -v', { encoding: 'utf-8' });
    if (remote.includes('origin')) {
      checks.passed.push('Git remote configured');
    } else {
      checks.warnings.push('Git remote not configured');
    }
  } catch {
    checks.warnings.push('Git remote not configured');
  }
} else {
  checks.warnings.push('Git repository not initialized');
}

// Print Results
console.log('\n' + '='.repeat(50));
console.log('📊 RESULTS\n');

if (checks.passed.length > 0) {
  console.log('✅ PASSED (' + checks.passed.length + '):');
  checks.passed.forEach(check => console.log('   ✓ ' + check));
  console.log('');
}

if (checks.warnings.length > 0) {
  console.log('⚠️  WARNINGS (' + checks.warnings.length + '):');
  checks.warnings.forEach(check => console.log('   ⚠ ' + check));
  console.log('');
}

if (checks.failed.length > 0) {
  console.log('❌ FAILED (' + checks.failed.length + '):');
  checks.failed.forEach(check => console.log('   ✗ ' + check));
  console.log('');
}

console.log('='.repeat(50));

if (checks.failed.length === 0) {
  console.log('\n🎉 All critical checks passed! Ready for deployment.');
  console.log('\n📖 Next steps:');
  console.log('   1. Review DEPLOYMENT_GUIDE.md');
  console.log('   2. Set up environment variables');
  console.log('   3. Push to GitHub');
  console.log('   4. Deploy to Vercel');
  process.exit(0);
} else {
  console.log('\n❌ Some checks failed. Please fix the issues before deploying.');
  process.exit(1);
}
