# Database Reset Guide

This guide explains how to delete all data from your database.

## ⚠️ WARNING

**This operation is IRREVERSIBLE!** All data will be permanently deleted including:

- All users and profiles
- All teams and team members
- All matches and tournaments
- All transactions and wallet balances
- All messages and friendships
- All custom rooms and reports
- All support tickets
- All notifications
- Everything else in the database

## Prerequisites

Make sure your database connection is properly configured in `.env`:
```
DATABASE_URL="your_database_connection_string"
```

## How to Reset the Database

### Option 1: Using npm script (Recommended)

```bash
cd backend
npm run reset
```

### Option 2: Using ts-node directly

```bash
cd backend
npx ts-node reset-database.ts
```

### Option 3: Manual execution

```bash
cd backend
npx ts-node -e "require('./reset-database.ts')"
```

## What Happens During Reset

The script will:

1. Delete all records from all tables in the correct order (respecting foreign key constraints)
2. Keep the database schema intact (tables, columns, indexes remain)
3. Reset auto-increment counters
4. Display progress for each table being cleared

## After Reset

After resetting, you may want to:

1. **Seed the database** with initial data:
   ```bash
   npm run seed
   ```

2. **Create a new admin user** manually or through the seed script

3. **Verify the reset** using Prisma Studio:
   ```bash
   npm run prisma:studio
   ```

## Troubleshooting

### Foreign Key Constraint Errors

If you encounter foreign key errors, the script deletes tables in the correct order. If issues persist:

```bash
# Force reset (PostgreSQL)
npx prisma db push --force-reset --accept-data-loss
```

### Connection Issues

Ensure your database is running and the `DATABASE_URL` is correct:

```bash
# Test connection
npx prisma db pull
```

## Safety Tips

1. **Backup first**: Always backup your database before resetting
2. **Test environment**: Test the reset in a development environment first
3. **Double-check**: Make sure you're connected to the correct database
4. **Verify**: Check your `.env` file to confirm the database URL

## Alternative: Complete Database Reset

If you want to reset the schema as well (drop and recreate all tables):

```bash
npx prisma migrate reset
```

This will:
- Drop the database
- Create a new database
- Apply all migrations
- Run seed scripts (if configured)
