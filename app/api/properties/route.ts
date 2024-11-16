import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  let client;

  try {
    client = await pool.connect();

    const result = await client.query('SELECT * FROM property_listings ORDER BY id DESC');

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error) {
    console.error('Error fetching properties:', error);

    return NextResponse.json({ message: 'Error fetching properties.', error: error }, { status: 500 });
  } finally {
    
    if (client) {
      client.release();
    }
  }
}
