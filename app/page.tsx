'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const Home = () => {
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Scraping in progress...');
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
      } else {
        setMessage(data.error || 'Scraping failed.');
      }
    } catch (error: any) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const navigateToProperties = () => {
    router.push('/properties');
  };

  const isScraping = message === 'Scraping in progress...';

  return (
    <main className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
        <h1 className="text-2xl font-semibold text-center text-gray-800 mb-6">
          MagicBricks Property Scraper
        </h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Enter MagicBricks URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            className="p-3 border border-gray-300 text-gray-900 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
            disabled={isScraping}
          />
          <button
            type="submit"
            className={`w-full p-3 ${
              isScraping ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'
            } text-white rounded-lg font-medium focus:ring-2 focus:ring-blue-300 transition duration-200`}
            disabled={isScraping}
          >
            {isScraping ? 'Scraping...' : 'Scrape Property'}
          </button>
        </form>
        {message && (
          <p className="mt-4 text-center text-sm text-gray-600">{message}</p>
        )}
        <button
          onClick={navigateToProperties}
          className={`w-full mt-4 p-3 ${
            isScraping ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600'
          } text-white rounded-lg font-medium focus:ring-2 focus:ring-gray-300 transition duration-200`}
          disabled={isScraping}
        >
          Go to Properties
        </button>
      </div>
    </main>
  );
};

export default Home;
