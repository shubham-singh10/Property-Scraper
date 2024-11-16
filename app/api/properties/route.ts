import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Initialize the database pool once
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  let client;

  try {
    // Acquire a client from the pool
    client = await pool.connect();

    // Query the database
    const result = await client.query('SELECT * FROM property_listings ORDER BY id DESC');

    // Return the query result
    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching properties:', error);

    // Return error response
    return NextResponse.json({ message: 'Error fetching properties.', error: error }, { status: 500 });
  } finally {
    // Release the client back to the pool
    if (client) {
      client.release();
    }
  }
}
