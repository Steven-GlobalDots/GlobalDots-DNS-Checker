import { useState } from 'react'
import { parseZoneFile, type DnsRecord } from './utils/zoneParser'
import { compareRecords, type ComparisonResult } from './utils/comparisonEngine'
import { ResultsView } from './components/ResultsView'

function App() {
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [destinationType, setDestinationType] = useState<'file' | 'server'>('file')
  const [destinationFile, setDestinationFile] = useState<File | null>(null)
  const [destinationServer, setDestinationServer] = useState<string>('')
  const [results, setResults] = useState<ComparisonResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCompare = async () => {
    if (!sourceFile) return;

    setIsLoading(true);
    setError(null);

    try {
      // Parse source file
      const sourceText = await sourceFile.text();
      const sourceRecords = parseZoneFile(sourceText);

      let destRecords: DnsRecord[] = [];

      if (destinationType === 'file' && destinationFile) {
        // Parse destination file
        const destText = await destinationFile.text();
        destRecords = parseZoneFile(destText);
      } else if (destinationType === 'server' && destinationServer) {
        // Query DNS server for each source record
        destRecords = await queryDnsServer(sourceRecords);
      }

      // Compare records
      const comparisonResults = compareRecords(sourceRecords, destRecords);
      setResults(comparisonResults);
    } catch (err: any) {
      setError(err.message || 'An error occurred during comparison');
    } finally {
      setIsLoading(false);
    }
  };

  const queryDnsServer = async (sourceRecords: DnsRecord[]): Promise<DnsRecord[]> => {
    const results: DnsRecord[] = [];

    // Get unique name+type combinations
    const uniqueQueries = new Map<string, DnsRecord>();
    for (const record of sourceRecords) {
      const key = `${record.name}|${record.type}`;
      if (!uniqueQueries.has(key)) {
        uniqueQueries.set(key, record);
      }
    }

    // Query each unique record
    for (const [_, record] of uniqueQueries) {
      try {
        // Use relative path - Worker serves both frontend and API
        const response = await fetch(
          `/api/query?name=${encodeURIComponent(record.name)}&type=${encodeURIComponent(record.type)}`
        );

        if (!response.ok) {
          console.warn(`Failed to query ${record.name} ${record.type}`);
          continue;
        }

        const data = await response.json();

        // Parse DNS response (Google DNS JSON format)
        if (data.Answer) {
          for (const answer of data.Answer) {
            results.push({
              name: answer.name,
              type: answer.type === 1 ? 'A' :
                answer.type === 5 ? 'CNAME' :
                  answer.type === 15 ? 'MX' :
                    answer.type === 16 ? 'TXT' :
                      answer.type === 28 ? 'AAAA' :
                        String(answer.type),
              ttl: answer.TTL,
              data: answer.data
            });
          }
        }
      } catch (err) {
        console.error(`Error querying ${record.name}:`, err);
      }
    }

    return results;
  };

  const handleReset = () => {
    setSourceFile(null);
    setDestinationType('file');
    setDestinationFile(null);
    setDestinationServer('');
    setResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="bg-gray-800 border-b border-gray-700 p-6 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            GlobalDots DNS Checker
          </h1>
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
          >
            Reset
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {error && (
          <div className="bg-red-900/50 border border-red-700 rounded-xl p-4">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {!results ? (
          <>
            {/* Source Section */}
            <section className="bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-blue-400">1. Source of Truth</h2>
                <span className="text-xs bg-blue-900/50 text-blue-200 px-3 py-1 rounded-full border border-blue-800">
                  Required
                </span>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload Zone File
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md hover:border-gray-500 transition-colors cursor-pointer bg-gray-800/50">
                  <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-400">
                      <label htmlFor="source-file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-blue-500 hover:text-blue-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-blue-500">
                        <span>Upload a file</span>
                        <input id="source-file-upload" name="source-file-upload" type="file" className="sr-only" onChange={(e) => setSourceFile(e.target.files?.[0] || null)} />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      BIND, TXT, or zone files
                    </p>
                    {sourceFile && (
                      <p className="text-sm text-green-400 font-semibold mt-2">
                        Selected: {sourceFile.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Destination Section */}
            <section className="bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-purple-400">2. Destination</h2>
                <div className="flex bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setDestinationType('file')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${destinationType === 'file'
                      ? 'bg-gray-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    Zone File
                  </button>
                  <button
                    onClick={() => setDestinationType('server')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${destinationType === 'server'
                      ? 'bg-gray-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                      }`}
                  >
                    DNS Server
                  </button>
                </div>
              </div>

              {destinationType === 'file' ? (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload Comparison Zone File
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md hover:border-gray-500 transition-colors cursor-pointer bg-gray-800/50">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-400">
                        <label htmlFor="dest-file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-purple-500 hover:text-purple-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-800 focus-within:ring-purple-500">
                          <span>Upload a file</span>
                          <input id="dest-file-upload" name="dest-file-upload" type="file" className="sr-only" onChange={(e) => setDestinationFile(e.target.files?.[0] || null)} />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      {destinationFile && (
                        <p className="text-sm text-green-400 font-semibold mt-2">
                          Selected: {destinationFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <label htmlFor="dns-server" className="block text-sm font-medium text-gray-300">
                    Authoritative DNS Server
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      type="text"
                      name="dns-server"
                      id="dns-server"
                      className="focus:ring-purple-500 focus:border-purple-500 block w-full pl-4 pr-12 sm:text-sm border-gray-600 bg-gray-700 rounded-md text-white placeholder-gray-400 py-3"
                      placeholder="e.g., ns1.example.com or 1.1.1.1"
                      value={destinationServer}
                      onChange={(e) => setDestinationServer(e.target.value)}
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-400">
                    We will query this server for every record found in the source zone file.
                  </p>
                </div>
              )}
            </section>

            {/* Action Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleCompare}
                disabled={!sourceFile || (destinationType === 'file' ? !destinationFile : !destinationServer) || isLoading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isLoading ? 'Comparing...' : 'Run Comparison'}
              </button>
            </div>
          </>
        ) : (
          <ResultsView results={results} />
        )}
      </main>
    </div>
  )
}

export default App
