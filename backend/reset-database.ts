import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('🗑️  Starting database reset...\n');

  try {
    // Delete in order to respect foreign key constraints
    console.log('Deleting Messages...');
    await prisma.message.deleteMany({});

    console.log('Deleting Friends...');
    await prisma.friend.deleteMany({});

    console.log('Deleting Contact Messages...');
    await prisma.contactMessage.deleteMany({});

    console.log('Deleting Reports...');
    await prisma.report.deleteMany({});

    console.log('Deleting Ticket Messages...');
    await prisma.ticketMessage.deleteMany({});

    console.log('Deleting Support Tickets...');
    await prisma.supportTicket.deleteMany({});

    console.log('Deleting FAQs...');
    await prisma.fAQ.deleteMany({});

    console.log('Deleting Payment Methods...');
    await prisma.paymentMethod.deleteMany({});

    console.log('Deleting Notifications...');
    await prisma.notification.deleteMany({});

    console.log('Deleting Custom Room Reports...');
    await prisma.customRoomReport.deleteMany({});

    console.log('Deleting Custom Rooms...');
    await prisma.customRoom.deleteMany({});

    console.log('Deleting Transactions...');
    await prisma.transaction.deleteMany({});

    console.log('Deleting Tournament Registrations...');
    await prisma.tournamentRegistration.deleteMany({});

    console.log('Deleting Tournaments...');
    await prisma.tournament.deleteMany({});

    console.log('Deleting Match Players...');
    await prisma.matchPlayer.deleteMany({});

    console.log('Deleting Matches...');
    await prisma.match.deleteMany({});

    console.log('Deleting Team Invitations...');
    await prisma.teamInvitation.deleteMany({});

    console.log('Deleting Team Join Requests...');
    await prisma.teamJoinRequest.deleteMany({});

    console.log('Deleting Team Members...');
    await prisma.teamMember.deleteMany({});

    console.log('Deleting Team Money Requests...');
    await prisma.teamMoneyRequest.deleteMany({});

    console.log('Deleting Team Transactions...');
    await prisma.teamTransaction.deleteMany({});

    console.log('Deleting Teams...');
    await prisma.team.deleteMany({});

    console.log('Deleting Profiles...');
    await prisma.profile.deleteMany({});

    console.log('Deleting Users...');
    await prisma.user.deleteMany({});

    console.log('\n✅ Database reset completed successfully!');
    console.log('All data has been deleted from the database.\n');
  } catch (error) {
    console.error('❌ Error resetting database:', error);
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
