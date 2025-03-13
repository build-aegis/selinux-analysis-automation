'use client';

import { useState } from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const [query, setQuery] = useState('');
  const [cypherQuery, setCypherQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      setError('Please enter a query');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to process query');
      }
      
      const data = await response.json();
      setCypherQuery(data.cypher_query);
      setResults(data.results || []);
    } catch (err) {
      console.error('Error:', err);
      setError('An error occurred while processing your request');
    } finally {
      setIsLoading(false);
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
                    disabled={isLoading}
                  >
                    {isLoading ? (
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

            <div className="bg-black/80 border border-[#00ff00]/30 rounded p-6 shadow-[0_0_15px_rgba(0,255,0,0.1)]">
              <h2 className="text-xl font-semibold mb-4">&gt; Results</h2>
              {results.length > 0 ? (
                <div className="space-y-4">
                  {results.map((result, idx) => (
                    <div key={idx} className="bg-black/80 p-4 rounded border border-[#00ff00]/30">
                      <pre className="text-sm text-[#00ff00]/90 overflow-x-auto">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#00ff00]/50">No results available...</p>
              )}
            </div>
          </div>

          <div className="bg-black/80 border border-[#00ff00]/30 rounded p-6 h-fit sticky top-24 shadow-[0_0_15px_rgba(0,255,0,0.1)]">
            <h2 className="text-xl font-semibold mb-4">&gt; Generated Query</h2>
            <div className="bg-black/80 p-4 rounded border border-[#00ff00]/30">
              <pre className="text-sm text-[#00ff00]/90 overflow-x-auto whitespace-pre-wrap">
                {cypherQuery || 'Waiting for input...'}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}