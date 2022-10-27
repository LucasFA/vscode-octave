import * as fs from 'fs';
import * as path from 'path';

// TODO: I want to add a type to this indicating the keys are configFields and the values are configCallbacks
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