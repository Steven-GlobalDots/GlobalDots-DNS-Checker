import type { DnsRecord } from './zoneParser';

export interface ComparisonResult {
    matching: DnsRecord[];
    missing: DnsRecord[];
    different: Array<{
        record: DnsRecord;
        sourceValue: string;
        destValue: string;
    }>;
}

/**
 * Compares two sets of DNS records and categorizes them.
 * 
 * @param sourceRecords - Records from the source zone file (source of truth)
 * @param destRecords - Records from the destination (zone file or DNS query)
 * @returns Categorized comparison results
 */
export function compareRecords(
    sourceRecords: DnsRecord[],
    destRecords: DnsRecord[]
): ComparisonResult {
    const matching: DnsRecord[] = [];
    const missing: DnsRecord[] = [];
    const different: Array<{
        record: DnsRecord;
        sourceValue: string;
        destValue: string;
    }> = [];

    // Create a map of destination records for quick lookup
    // Key format: "name|type" (case-insensitive)
    const destMap = new Map<string, DnsRecord[]>();

    for (const destRecord of destRecords) {
        const key = `${destRecord.name.toLowerCase()}|${destRecord.type.toUpperCase()}`;
        if (!destMap.has(key)) {
            destMap.set(key, []);
        }
        destMap.get(key)!.push(destRecord);
    }

    // Compare each source record
    for (const sourceRecord of sourceRecords) {
        const key = `${sourceRecord.name.toLowerCase()}|${sourceRecord.type.toUpperCase()}`;
        const destMatches = destMap.get(key);

        if (!destMatches || destMatches.length === 0) {
            // Record exists in source but not in destination
            missing.push(sourceRecord);
            continue;
        }

        // Check if the data matches
        const sourceData = normalizeRecordData(sourceRecord.data);
        let foundMatch = false;

        for (const destRecord of destMatches) {
            const destData = normalizeRecordData(destRecord.data);

            if (sourceData === destData) {
                matching.push(sourceRecord);
                foundMatch = true;
                break;
            }
        }

        if (!foundMatch) {
            // Record exists but with different data
            different.push({
                record: sourceRecord,
                sourceValue: sourceRecord.data,
                destValue: destMatches[0].data // Show first matching record type
            });
        }
    }

    return { matching, missing, different };
}

/**
 * Normalizes record data for comparison.
 * Handles trailing dots, whitespace, and case sensitivity.
 */
function normalizeRecordData(data: string): string {
    return data
        .trim()
        .toLowerCase()
        .replace(/\.$/, ''); // Remove trailing dot if present
}

/**
 * Exports comparison results to different formats.
 */
export function exportResults(
    results: ComparisonResult,
    format: 'text' | 'csv' | 'json'
): string {
    switch (format) {
        case 'json':
            return JSON.stringify(results, null, 2);

        case 'csv':
            return generateCSV(results);

        case 'text':
            return generateText(results);

        default:
            return '';
    }
}

function generateCSV(results: ComparisonResult): string {
    const lines: string[] = [];
    lines.push('Status,Name,Type,TTL,Data,Source Value,Dest Value');

    for (const record of results.matching) {
        lines.push(`Matching,${record.name},${record.type},${record.ttl || ''},${record.data},,`);
    }

    for (const record of results.missing) {
        lines.push(`Missing,${record.name},${record.type},${record.ttl || ''},${record.data},,`);
    }

    for (const diff of results.different) {
        lines.push(`Different,${diff.record.name},${diff.record.type},${diff.record.ttl || ''},,${diff.sourceValue},${diff.destValue}`);
    }

    return lines.join('\n');
}

function generateText(results: ComparisonResult): string {
    const lines: string[] = [];

    lines.push('=== MATCHING RECORDS ===');
    for (const record of results.matching) {
        lines.push(`${record.name} ${record.ttl || ''} ${record.type} ${record.data}`);
    }

    lines.push('\n=== MISSING RECORDS ===');
    for (const record of results.missing) {
        lines.push(`${record.name} ${record.ttl || ''} ${record.type} ${record.data}`);
    }

    lines.push('\n=== DIFFERENT RECORDS ===');
    for (const diff of results.different) {
        lines.push(`${diff.record.name} ${diff.record.type}`);
        lines.push(`  Source: ${diff.sourceValue}`);
        lines.push(`  Dest:   ${diff.destValue}`);
    }

    return lines.join('\n');
}
