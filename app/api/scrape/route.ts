import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export async function POST(req: Request) {
    const { url } = await req.json();
    // console.log("Url: ", url);
    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const client = await pool.connect();
    let listingId: number | undefined;

    try {
        const insertQuery = `INSERT INTO property_listings (url, status) VALUES ($1, 'In Progress') RETURNING id;`;
        const { rows } = await client.query(insertQuery, [url]);
        // console.log('Rows: ', rows);
        listingId = rows[0].id;
        if (!listingId) throw new Error('Listing ID is undefined.');

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        const page = await browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
        });

        await page.goto(url, { waitUntil: 'domcontentloaded' });

        const title = await page.evaluate(() => {
            const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content');
            return ogTitle || document.title || "No title found";
        });

        // address
        let location = "No location found";
        try {
            const jsonLd = await page.$eval('script[type="application/ld+json"]', (el) => el.textContent);
            if (jsonLd) {
                const jsonData = JSON.parse(jsonLd);
                const address = jsonData?.address;
                if (address) {
                    location = `${address.streetAddress}, ${address.addressLocality}, ${address.addressRegion}, ${address.postalCode}`;
                }
            }
        } catch (error) {
            console.log("Error extracting address from JSON-LD:", error);
        }

        // Extract price
        let price = "No price found";
        try {
            const metaDescription = await page.$eval('meta[name="description"]', (el) => el.getAttribute('content') || "");
            const priceMatch = metaDescription.match(/Property Sale Price\s*-\s*(.+?)\s✓/);
            if (priceMatch && priceMatch[1]) {
                price = priceMatch[1].trim();
            }
        } catch (error) {
            console.log("Error extracting price:", error);
        }

        // Extract image URL
        let pictureUrl: string = "No image found";
        try {

            const extractedUrl = await page.$eval(
                'img[src*="img.staticmb.com/mbphoto"]',
                (el) => el.getAttribute('src')
            );

            pictureUrl = extractedUrl ?? "No image found";
            console.log("Property Image URL extracted:", pictureUrl);
        } catch (error) {
            console.error("Error extracting property image URL:", error);
        }


        // console.log('Title:', title);
        // console.log('Location:', location);
        // console.log('Price:', price);
        // console.log('Picture URL:', pictureUrl);

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
            await client.query(failQuery, [listingId]);
        }
        // console.error('Error during scraping:', error);
        return NextResponse.json({ error: 'Scraping failed.', details: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
