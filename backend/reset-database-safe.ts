import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function resetDatabase() {
  console.log('\n⚠️  DATABASE RESET WARNING ⚠️\n');
  console.log('This will permanently delete ALL data from your database including:');
  console.log('  • All users and profiles');
  console.log('  • All teams and members');
  console.log('  • All matches and tournaments');
  console.log('  • All transactions and wallet balances');
  console.log('  • All messages and friendships');
  console.log('  • All custom rooms and reports');
  console.log('  • All support tickets');
  console.log('  • Everything else\n');

  const answer1 = await question('Are you sure you want to continue? (yes/no): ');
  
  if (answer1.toLowerCase() !== 'yes') {
    console.log('\n❌ Reset cancelled.');
    rl.close();
    await prisma.$disconnect();
    return;
  }

  const answer2 = await question('\nType "DELETE ALL DATA" to confirm: ');
  
  if (answer2 !== 'DELETE ALL DATA') {
    console.log('\n❌ Reset cancelled. Confirmation text did not match.');
    rl.close();
    await prisma.$disconnect();
    return;
  }

  rl.close();

  console.log('\n🗑️  Starting database reset...\n');

  try {
    // Get counts before deletion
    const counts = {
      users: await prisma.user.count(),
      teams: await prisma.team.count(),
      matches: await prisma.match.count(),
      transactions: await prisma.transaction.count(),
      messages: await prisma.message.count(),
      friends: await prisma.friend.count(),
      customRooms: await prisma.customRoom.count(),
      tickets: await prisma.supportTicket.count(),
    };

    console.log('Current database statistics:');
    console.log(`  • Users: ${counts.users}`);
    console.log(`  • Teams: ${counts.teams}`);
    console.log(`  • Matches: ${counts.matches}`);
    console.log(`  • Transactions: ${counts.transactions}`);
    console.log(`  • Messages: ${counts.messages}`);
    console.log(`  • Friends: ${counts.friends}`);
    console.log(`  • Custom Rooms: ${counts.customRooms}`);
    console.log(`  • Support Tickets: ${counts.tickets}\n`);

    // Delete in order to respect foreign key constraints
    const deletions = [
      { name: 'Messages', fn: () => prisma.message.deleteMany({}) },
      { name: 'Friends', fn: () => prisma.friend.deleteMany({}) },
      { name: 'Contact Messages', fn: () => prisma.contactMessage.deleteMany({}) },
      { name: 'Reports', fn: () => prisma.report.deleteMany({}) },
      { name: 'Ticket Messages', fn: () => prisma.ticketMessage.deleteMany({}) },
      { name: 'Support Tickets', fn: () => prisma.supportTicket.deleteMany({}) },
      { name: 'FAQs', fn: () => prisma.fAQ.deleteMany({}) },
      { name: 'Payment Methods', fn: () => prisma.paymentMethod.deleteMany({}) },
      { name: 'Notifications', fn: () => prisma.notification.deleteMany({}) },
      { name: 'Custom Room Reports', fn: () => prisma.customRoomReport.deleteMany({}) },
      { name: 'Custom Rooms', fn: () => prisma.customRoom.deleteMany({}) },
      { name: 'Transactions', fn: () => prisma.transaction.deleteMany({}) },
      { name: 'Tournament Registrations', fn: () => prisma.tournamentRegistration.deleteMany({}) },
      { name: 'Tournaments', fn: () => prisma.tournament.deleteMany({}) },
      { name: 'Match Players', fn: () => prisma.matchPlayer.deleteMany({}) },
      { name: 'Matches', fn: () => prisma.match.deleteMany({}) },
      { name: 'Team Invitations', fn: () => prisma.teamInvitation.deleteMany({}) },
      { name: 'Team Join Requests', fn: () => prisma.teamJoinRequest.deleteMany({}) },
      { name: 'Team Members', fn: () => prisma.teamMember.deleteMany({}) },
      { name: 'Team Money Requests', fn: () => prisma.teamMoneyRequest.deleteMany({}) },
      { name: 'Team Transactions', fn: () => prisma.teamTransaction.deleteMany({}) },
      { name: 'Teams', fn: () => prisma.team.deleteMany({}) },
      { name: 'Profiles', fn: () => prisma.profile.deleteMany({}) },
      { name: 'Users', fn: () => prisma.user.deleteMany({}) },
    ];

    for (const deletion of deletions) {
      process.stdout.write(`Deleting ${deletion.name}... `);
      const result = await deletion.fn();
      console.log(`✓ (${result.count} records)`);
    }

    console.log('\n✅ Database reset completed successfully!');
    console.log('All data has been deleted from the database.\n');
  } catch (error) {
    console.error('\n❌ Error resetting database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
