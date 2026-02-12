export interface DnsRecord {
    name: string;
    ttl?: number;
    class?: string;
    type: string;
    data: string;
}

export function parseZoneFile(content: string): DnsRecord[] {
    const records: DnsRecord[] = [];
    const lines = content.split('\n');
    let currentOrigin = '@';
    let defaultTtl = 3600;

    // Regex for standard BIND record format:
    // name  ttl  class  type  data
    // example.com.  3600  IN  A  1.2.3.4
    // @             IN      MX 10 mail.example.com.
    const recordRegex = /^(\S+)?\s+(?:(\d+)\s+)?(?:(IN|CS|CH|HS)\s+)?([A-Z]+)\s+(.+)$/i;

    for (let line of lines) {
        // Strip comments
        line = line.split(';')[0].trim();
        if (!line) continue;

        // Handle $ORIGIN and $TTL directives
        if (line.startsWith('$ORIGIN')) {
            const parts = line.split(/\s+/);
            if (parts[1]) currentOrigin = parts[1];
            continue;
        }
        if (line.startsWith('$TTL')) {
            const parts = line.split(/\s+/);
            if (parts[1]) defaultTtl = parseInt(parts[1], 10);
            continue;
        }

        const match = line.match(recordRegex);
        if (match) {
            let [_, name, ttlStr, classStr, type, data] = match;

            // Handle name inheritance (blank name means use previous)
            if (!name) {
                // If previous record exists, use its name, otherwise use origin
                name = records.length > 0 ? records[records.length - 1].name : currentOrigin;
            }

            // If name is @, replace with origin (or simply keep as @ if logic prefers)
            // For this parse, let's normalize '@' to the root concept or keep as is.
            // Usually zone files are relative. Let's keep strict to file content for now 
            // but if we need absolute FQDNs we might need to expand.

            const ttl = ttlStr ? parseInt(ttlStr, 10) : defaultTtl;

            records.push({
                name,
                ttl,
                class: classStr || 'IN',
                type: type.toUpperCase(),
                data: data.trim()
            });
        }
    }

    return records;
}
