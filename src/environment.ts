export function buildLaunchEnvironment(
    configured: unknown,
    base: NodeJS.ProcessEnv = process.env,
    platform: NodeJS.Platform = process.platform
): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(base)) {
        if (value !== undefined) {
            result[key] = value;
        }
    }

    if (typeof configured !== "object" || configured === null || Array.isArray(configured)) {
        return result;
    }

    const caseInsensitive = platform === "win32";
    for (const [key, value] of Object.entries(configured)) {
        if (typeof value !== "string") {
            continue;
        }
        if (caseInsensitive) {
            const lower = key.toLowerCase();
            for (const existing of Object.keys(result)) {
                if (existing.toLowerCase() === lower) {
                    delete result[existing];
                }
            }
        }
        result[key] = value;
    }
    return result;
}
