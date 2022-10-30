import * as fs from 'fs';
import * as path from 'path';

// NOTE: I wanted to add a typecheck to this indicating the keys are configFields and the values are configCallbacks,
// but really this is typechecked when calling the generic constructor of Config
export const configCallbacks = {
    octaveLocation: getOctavefromEnvPath
} as const;

function getOctavefromEnvPath(): string | undefined {
    let fileRoot = "octave";
    const splitChar = path.delimiter;
    let fileExtension = '';

    const platform = process.platform;
    if (platform === 'win32') {
        fileRoot += "-cli";
        fileExtension = '.exe';
    }
    const fileName = fileRoot + fileExtension;

    const envPaths = process.env.PATH?.split(splitChar);

    for (const env_path of envPaths ?? []) {
        const octave_path: string = path.join(env_path, fileName);
        if (fs.existsSync(octave_path)) {
            return octave_path;
        }
    }

    return undefined;
}