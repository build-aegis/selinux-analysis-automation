'use client';

import { useState } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);

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
    <main className="min-h-screen bg-[#000000] text-[#00ff00] font-mono">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyIiBoZWlnaHQ9IjIiPjxyZWN0IHdpZHRoPSIyIiBoZWlnaHQ9IjIiIGZpbGw9IiMwMDAwMDAiLz48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSIjMDAwMDAwIiBmaWxsLW9wYWNpdHk9IjAuMTUiLz48L3N2Zz4=')] opacity-50"></div>
        <div className="absolute inset-0 bg-gradient-radial from-transparent to-black opacity-40"></div>
      </div>

      <nav className="border-b border-[#00ff00]/30 bg-black/80 fixed top-0 w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold animate-pulse">
            <span className="text-[#00ff00]">&gt; </span>
            SELinux Policy Analyzer
          </h1>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 hover:bg-[#00ff00]/10 transition-colors border border-[#00ff00]/30 rounded"
            aria-label="Help"
          >
            <QuestionMarkCircleIcon className="w-6 h-6" />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 relative">
        {showHelp && (
          <div className="mb-8 bg-black/80 p-6 rounded border border-[#00ff00]/30 shadow-[0_0_15px_rgba(0,255,0,0.1)]">
            <h2 className="text-xl font-semibold mb-4">&gt; Help Manual</h2>
            <ul className="space-y-2 text-[#00ff00]/90">
              <li>$ Enter your query in natural language (e.g., "Show me all processes that can access /etc/passwd")</li>
              <li>$ The analyzer will convert your query into a Cypher query for the Neo4j database</li>
              <li>$ Results will show relevant SELinux policy information based on your query</li>
              <li>$ You can ask about permissions, transitions, file contexts, and more</li>
            </ul>
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative group">
                <textarea
                  className="w-full p-4 bg-black/80 border border-[#00ff00]/30 rounded text-[#00ff00] placeholder-[#00ff00]/50 focus:ring-1 focus:ring-[#00ff00]/50 focus:border-[#00ff00]/50 transition-all min-h-[120px] shadow-[0_0_15px_rgba(0,255,0,0.1)] group-hover:shadow-[0_0_20px_rgba(0,255,0,0.15)]"
                  placeholder="Enter your natural language query here..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ caretColor: '#00ff00' }}
                />
                <div className="absolute bottom-4 right-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[#00ff00]/10 hover:bg-[#00ff00]/20 border border-[#00ff00]/30 rounded font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-[0_0_10px_rgba(0,255,0,0.1)]"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        PROCESSING...
                      </>
                    ) : (
                      'ANALYZE >>'
                    )}
                  </button>
                </div>
              </div>
              
              {error && (
                <p className="text-red-400 text-sm">! {error}</p>
              )}
            </form>

            {results && (
              <>
                <div className="bg-black/80 border border-[#00ff00]/30 rounded p-6 shadow-[0_0_15px_rgba(0,255,0,0.1)]">
                  <h2 className="text-xl font-semibold mb-4">&gt; Query Results</h2>
                  {results.results && results.results.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-black/60 border border-[#00ff00]/30">
                        <thead>
                          <tr className="bg-[#00ff00]/10">
                            {Object.keys(results.results[0]).map((key) => (
                              <th key={key} className="py-2 px-4 border-b border-[#00ff00]/30 text-left">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {results.results.map((item, idx) => (
                            <tr key={idx} className="border-b border-[#00ff00]/30">
                              {Object.values(item).map((value, valueIdx) => (
                                <td key={valueIdx} className="py-2 px-4 text-[#00ff00]/90">
                                  {Array.isArray(value) ? value.join(', ') : value}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-[#00ff00]/50">No results found</p>
                  )}
                </div>

                <div className="bg-black/80 border border-[#00ff00]/30 rounded p-6 shadow-[0_0_15px_rgba(0,255,0,0.1)]">
                  <h2 className="text-xl font-semibold mb-4">&gt; Analysis</h2>
                  <div className="text-[#00ff00]/90">
                    {results.interpretation && results.interpretation.split('\n\n').map((paragraph, idx) => (
                      <p key={idx} className="mb-4">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="bg-black/80 border border-[#00ff00]/30 rounded p-6 h-fit sticky top-24 shadow-[0_0_15px_rgba(0,255,0,0.1)]">
            <h2 className="text-xl font-semibold mb-4">&gt; Generated Query</h2>
            <div className="bg-black/80 p-4 rounded border border-[#00ff00]/30">
              <pre className="text-sm text-[#00ff00]/90 overflow-x-auto whitespace-pre-wrap">
                {results ? results.cypher_query : 'Waiting for input...'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}