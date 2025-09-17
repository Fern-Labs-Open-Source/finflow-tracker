const { Client } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_MCa2yow5epmz@ep-silent-cell-adwln18k-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require';

const client = new Client({
  connectionString: connectionString
});

async function testConnection() {
  try {
    console.log('Attempting to connect...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    const result = await client.query('SELECT NOW()');
    console.log('Current time:', result.rows[0].now);
    
    await client.end();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error);
  }
}

testConnection();
