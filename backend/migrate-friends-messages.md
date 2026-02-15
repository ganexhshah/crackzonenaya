# Database Migration Instructions

Run these commands in the backend directory to add Friend and Message features:

```bash
# Generate Prisma client with new models
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add_friends_and_messages

# Or if in production
npx prisma migrate deploy
```

This will create the `Friend` and `Message` tables in your database.
