import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(req: Request) {
  const { url } = await req.json();
  console.log("Url: ", url);
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const client = await pool.connect();

  let listingId: number | undefined;

  try {
    const insertQuery = `INSERT INTO property_listings (url, status) VALUES ($1, 'In Progress') RETURNING id;`;
    const { rows } = await client.query(insertQuery, [url]);
    console.log('Rows: ', rows);
    listingId = rows[0].id;

    if (!listingId) {
      throw new Error('Listing ID is undefined.');
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    const title = await page.evaluate(() => {
      const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
      return ogTitle || document.title || "No title found";
    });

    let location = "No location found";
    try {
      await page.waitForSelector('.property-address', { timeout: 60000 });
      location = await page.$eval('.property-address', (el) => el.textContent?.trim() || "No location found");
    } catch (error) {
      console.log("Error waiting for location selector:", error);
    }

    let price = "No price found";
    try {
      price = await page.$eval('.property-price', (el) => el.textContent?.trim() || "No price found");
    } catch (error) {
      console.log("Error extracting price:", error);
    }

    let pictureUrl = "No image found";
    try {
      pictureUrl = await page.$eval('meta[property="og:image"]', (el) => el.getAttribute('content') || "No image found");
    } catch (error) {
      console.log("Error extracting image URL:", error);
    }

    console.log('Title:', title);
    console.log('Location:', location);
    console.log('Price:', price);
    console.log('Picture URL:', pictureUrl);

    const updateQuery = `
      UPDATE property_listings
      SET title = $1, location = $2, price = $3, picture_url = $4, status = 'Completed'
      WHERE id = $5;
    `;
    await client.query(updateQuery, [title, location, price, pictureUrl, listingId]);

    await browser.close();

    return NextResponse.json({ message: 'Scraping completed!' });
  } catch (error: any) {
    if (listingId) {
      const failQuery = `UPDATE property_listings SET status = 'Failed' WHERE id = $1;`;
      try {
        await client.query(failQuery, [listingId]);
      } catch (updateError) {
        console.error("Error updating status to 'Failed':", updateError);
      }
    }

    console.error('Error during scraping:', error);
    return NextResponse.json({ error: 'Scraping failed.', details: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}
