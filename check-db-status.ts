import postgres from 'postgres';

const sql = postgres(process.env.POSTGRES_URL || '');

async function checkDatabase() {
  try {
    const messages = await sql`SELECT COUNT(*) as count FROM "Message"`;
    const chats = await sql`SELECT COUNT(*) as count FROM "Chat"`;
    const users = await sql`SELECT COUNT(*) as count FROM "User"`;
    const websiteContent = await sql`SELECT COUNT(*) as count FROM website_content`;
    const documents = await sql`SELECT COUNT(*) as count FROM "Document_Knowledge"`;

    console.log('\n📊 Production Database Status:\n');
    console.log(`  Messages: ${messages[0].count}`);
    console.log(`  Chats: ${chats[0].count}`);
    console.log(`  Users: ${users[0].count}`);
    console.log(`  Website Content: ${websiteContent[0].count}`);
    console.log(`  Documents: ${documents[0].count}`);
    console.log('\n');

    await sql.end();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDatabase();
