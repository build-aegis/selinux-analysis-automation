'use client';

import React, { useState } from 'react';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const response = await fetch('/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process query');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">SELinux Policy Analysis Tool</h1>
      
      <div className="mb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="query" className="block text-sm font-medium mb-1">
              Enter your security policy query:
            </label>
            <textarea
              id="query"
              rows={3}
              className="w-full p-2 border border-gray-300 rounded-md"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., Find all domains with read and write access to sensitive files"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Analyze'}
          </button>
        </form>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {results && (
        <div className="space-y-6">
          <div className="p-4 bg-gray-100 rounded-md">
            <h2 className="text-xl font-semibold mb-2">Generated Cypher Query</h2>
            <pre className="p-3 bg-gray-800 text-green-400 rounded overflow-x-auto">
              {results.cypher_query}
            </pre>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Query Results</h2>
            {results.results.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      {Object.keys(results.results[0]).map((key) => (
                        <th key={key} className="py-2 px-4 border-b text-left">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.results.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        {Object.values(item).map((value, valueIdx) => (
                          <td key={valueIdx} className="py-2 px-4">
                            {Array.isArray(value) ? value.join(', ') : value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No results found</p>
            )}
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h2 className="text-xl font-semibold mb-2">Analysis</h2>
            <div className="prose">
              {results.interpretation.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="mb-2">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}