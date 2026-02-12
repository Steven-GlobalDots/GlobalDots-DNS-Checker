import { useState } from 'react';
import { type ComparisonResult, exportResults } from '../utils/comparisonEngine';
import type { DnsRecord } from '../utils/zoneParser';

interface ResultsViewProps {
    results: ComparisonResult;
}

export function ResultsView({ results }: ResultsViewProps) {
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const [viewFormat, setViewFormat] = useState<'ui' | 'text' | 'csv' | 'json'>('ui');

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    const handleDownload = (format: 'text' | 'csv' | 'json') => {
        const content = exportResults(results, format);
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dns-comparison.${format}`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const renderRecordList = (records: DnsRecord[]) => (
        <div className="space-y-2">
            {records.map((record, idx) => (
                <div key={idx} className="bg-gray-700 p-3 rounded-md border border-gray-600">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-gray-400">Name:</span>
                            <span className="ml-2 text-white font-mono">{record.name}</span>
                        </div>
                        <div>
                            <span className="text-gray-400">Type:</span>
                            <span className="ml-2 text-blue-400 font-semibold">{record.type}</span>
                        </div>
                        <div>
                            <span className="text-gray-400">TTL:</span>
                            <span className="ml-2 text-white">{record.ttl || 'N/A'}</span>
                        </div>
                        <div className="col-span-4">
                            <span className="text-gray-400">Value:</span>
                            <span className="ml-2 text-white font-mono break-all">{record.data}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderDifferentRecords = () => (
        <div className="space-y-2">
            {results.different.map((diff, idx) => (
                <div key={idx} className="bg-gray-700 p-3 rounded-md border border-yellow-600">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-gray-400">Name:</span>
                            <span className="ml-2 text-white font-mono">{diff.record.name}</span>
                        </div>
                        <div>
                            <span className="text-gray-400">Type:</span>
                            <span className="ml-2 text-blue-400 font-semibold">{diff.record.type}</span>
                        </div>
                        <div className="col-span-4">
                            <div className="space-y-2">
                                <div>
                                    <span className="text-gray-400">Source:</span>
                                    <span className="ml-2 text-green-400 font-mono break-all">{diff.sourceValue}</span>
                                </div>
                                <div>
                                    <span className="text-gray-400">Destination:</span>
                                    <span className="ml-2 text-red-400 font-mono break-all">{diff.destValue}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    if (viewFormat !== 'ui') {
        const content = exportResults(results, viewFormat as 'text' | 'csv' | 'json');
        return (
            <div className="bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-white">Results Preview</h2>
                    <button
                        onClick={() => setViewFormat('ui')}
                        className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
                    >
                        Back to UI View
                    </button>
                </div>
                <pre className="bg-gray-900 p-4 rounded-md overflow-auto max-h-96 text-sm text-gray-300 font-mono">
                    {content}
                </pre>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-900/50 to-green-800/30 rounded-xl p-6 border border-green-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-300 text-sm font-medium">Matching Records</p>
                            <p className="text-3xl font-bold text-white mt-2">{results.matching.length}</p>
                        </div>
                        <div className="bg-green-600/30 p-3 rounded-full">
                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-900/50 to-red-800/30 rounded-xl p-6 border border-red-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-300 text-sm font-medium">Missing Records</p>
                            <p className="text-3xl font-bold text-white mt-2">{results.missing.length}</p>
                        </div>
                        <div className="bg-red-600/30 p-3 rounded-full">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 rounded-xl p-6 border border-yellow-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-300 text-sm font-medium">Different Values</p>
                            <p className="text-3xl font-bold text-white mt-2">{results.different.length}</p>
                        </div>
                        <div className="bg-yellow-600/30 p-3 rounded-full">
                            <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Export Controls */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">Export Options</h3>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => setViewFormat('text')}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors text-sm"
                    >
                        View as Text
                    </button>
                    <button
                        onClick={() => setViewFormat('csv')}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors text-sm"
                    >
                        View as CSV
                    </button>
                    <button
                        onClick={() => setViewFormat('json')}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors text-sm"
                    >
                        View as JSON
                    </button>
                    <div className="border-l border-gray-600 mx-2"></div>
                    <button
                        onClick={() => handleDownload('text')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
                    >
                        Download Text
                    </button>
                    <button
                        onClick={() => handleDownload('csv')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
                    >
                        Download CSV
                    </button>
                    <button
                        onClick={() => handleDownload('json')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
                    >
                        Download JSON
                    </button>
                </div>
            </div>

            {/* Expandable Sections */}
            <div className="space-y-4">
                {/* Matching Records */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    <button
                        onClick={() => toggleSection('matching')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-750 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-green-400 text-2xl">✓</span>
                            <span className="text-lg font-semibold text-white">Matching Records ({results.matching.length})</span>
                        </div>
                        <svg
                            className={`w-6 h-6 text-gray-400 transition-transform ${expandedSection === 'matching' ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {expandedSection === 'matching' && (
                        <div className="px-6 py-4 border-t border-gray-700">
                            {results.matching.length > 0 ? renderRecordList(results.matching) : <p className="text-gray-400">No matching records</p>}
                        </div>
                    )}
                </div>

                {/* Missing Records */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    <button
                        onClick={() => toggleSection('missing')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-750 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-red-400 text-2xl">✗</span>
                            <span className="text-lg font-semibold text-white">Missing Records ({results.missing.length})</span>
                        </div>
                        <svg
                            className={`w-6 h-6 text-gray-400 transition-transform ${expandedSection === 'missing' ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {expandedSection === 'missing' && (
                        <div className="px-6 py-4 border-t border-gray-700">
                            {results.missing.length > 0 ? renderRecordList(results.missing) : <p className="text-gray-400">No missing records</p>}
                        </div>
                    )}
                </div>

                {/* Different Records */}
                <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                    <button
                        onClick={() => toggleSection('different')}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-750 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-yellow-400 text-2xl">⚠</span>
                            <span className="text-lg font-semibold text-white">Different Values ({results.different.length})</span>
                        </div>
                        <svg
                            className={`w-6 h-6 text-gray-400 transition-transform ${expandedSection === 'different' ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {expandedSection === 'different' && (
                        <div className="px-6 py-4 border-t border-gray-700">
                            {results.different.length > 0 ? renderDifferentRecords() : <p className="text-gray-400">No different records</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
