import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminEmail = 'hello@ganeshsahu.com.np';
  const adminUsername = 'ganeshsahu';
  const adminPassword = 'G@nesh98';

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      OR: [
        { email: adminEmail },
        { username: adminUsername }
      ]
    }
  });

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists');
    console.log('📧 Email:', existingAdmin.email);
    console.log('👤 Username:', existingAdmin.username);
    console.log('🔑 Role:', existingAdmin.role);
    
    // Update to admin if not already
    if (existingAdmin.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: { role: 'ADMIN' }
      });
      console.log('✅ Updated existing user to ADMIN role');
    }
  } else {
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        username: adminUsername,
        password: hashedPassword,
        fullName: 'Ganesh Sahu',
        role: 'ADMIN',
        isVerified: true,
        status: 'ACTIVE'
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', admin.email);
    console.log('👤 Username:', admin.username);
    console.log('🔑 Password:', adminPassword);
    console.log('🔐 Role:', admin.role);
  }

  console.log('\n🎉 Seed completed!');
  console.log('\n📝 Admin Login Credentials:');
  console.log('   Email: hello@ganeshsahu.com.np');
  console.log('   Password: G@nesh98');
  console.log('\n🌐 Login at: http://localhost:3000/admin/login');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
