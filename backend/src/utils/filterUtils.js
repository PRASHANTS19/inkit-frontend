/**
 * Transform MongoDB-style filter syntax to Prisma format
 * 
 * MongoDB uses: { field: { $in: [...] }, field2: { $gte: value } }
 * Prisma uses:  { field: { in: [...] }, field2: { gte: value } }
 */
export function transformFilter(filter) {
    if (!filter || typeof filter !== 'object') {
        return filter;
    }

    const result = {};

    for (const [key, value] of Object.entries(filter)) {
        if (value === null || value === undefined) {
            result[key] = value;
            continue;
        }

        // If value is an object, check for MongoDB operators
        if (typeof value === 'object' && !Array.isArray(value)) {
            const transformed = {};
            let hasOperators = false;

            for (const [opKey, opValue] of Object.entries(value)) {
                if (opKey.startsWith('$')) {
                    hasOperators = true;
                    // Convert MongoDB operators to Prisma operators
                    const prismaOp = opKey.slice(1); // Remove the $
                    switch (prismaOp) {
                        case 'in':
                        case 'notIn':
                        case 'lt':
                        case 'lte':
                        case 'gt':
                        case 'gte':
                        case 'contains':
                        case 'startsWith':
                        case 'endsWith':
                            transformed[prismaOp] = opValue;
                            break;
                        case 'ne':
                            transformed['not'] = opValue;
                            break;
                        case 'regex':
                            // Prisma doesn't support regex directly, use contains as fallback
                            transformed['contains'] = opValue.replace(/[.*+?^${}()|[\]\\]/g, '');
                            break;
                        default:
                            // Unknown operator, pass through
                            transformed[opKey] = opValue;
                    }
                } else {
                    // Nested object, recurse
                    transformed[opKey] = transformFilter(opValue);
                }
            }

            result[key] = hasOperators ? transformed : transformFilter(value);
        } else if (Array.isArray(value)) {
            // Array values - could be $in shorthand or actual array
            result[key] = value;
        } else {
            // Primitive value, pass through
            result[key] = value;
        }
    }

    return result;
}

/**
 * Parse sort string to Prisma orderBy format
 * Input: "-created_date" or "created_date"
 * Output: { created_date: 'desc' } or { created_date: 'asc' }
 */
export function parseSort(sortBy = '-created_date') {
    if (!sortBy) return { created_date: 'desc' };

    return sortBy.startsWith('-')
        ? { [sortBy.slice(1)]: 'desc' }
        : { [sortBy]: 'asc' };
}
