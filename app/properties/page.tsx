"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Property {
  id: number;
  title: string;
  location: string;
  price: string;
  picture_url: string;
  status: string;
}

const PropertiesPage = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch("/api/properties");
        if (!response.ok) {
          throw new Error("Failed to fetch properties. Please try again later.");
        }
        const data = await response.json();
        setProperties(data);
      } catch (error: any) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  if (loading) {
    return (
      <main className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-lg font-semibold text-gray-600">Loading properties...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-lg font-semibold text-red-600">{error}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 focus:ring-2 focus:ring-blue-300"
        >
          Back
        </button>
      </main>
    );
  }

  if (properties.length === 0) {
    return (
      <main className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-lg font-semibold text-gray-600">
          No properties found. Please try again later.
        </p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 focus:ring-2 focus:ring-blue-300"
        >
          Back
        </button>
      </main>
    );
  }

  return (
    <main className="p-4 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Scraped Properties</h1>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 focus:ring-2 focus:ring-gray-400"
        >
          Back
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="table-auto w-full bg-white shadow-md border border-gray-300 rounded-lg">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="p-4">Title</th>
              <th className="p-4">Location</th>
              <th className="p-4">Price</th>
              <th className="p-4">Picture</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((property, index) => (
              <tr
                key={property.id}
                className={index % 2 === 0 ? "bg-gray-100" : "bg-white"}
              >
                <td className="p-4 border-b text-gray-700">{property.title || "N/A"}</td>
                <td className="p-4 border-b text-gray-700">
                  {property.location || "No location found"}
                </td>
                <td className="p-4 border-b text-gray-700">
                  {property.price || "No price found"}
                </td>
                <td className="p-4 border-b text-center">
                  {property.picture_url ? (
                    <img
                      src={property.picture_url}
                      alt={property.title}
                      className="h-16 w-16 object-cover mx-auto text-gray-700"
                    />
                  ) : (
                    <span className="text-gray-500 italic">No Image</span>
                  )}
                </td>
                <td className="p-4 border-b text-gray-700">{property.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
};

export default PropertiesPage;
