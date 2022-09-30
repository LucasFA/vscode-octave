
import * as vscode from "vscode";
import * as globals from "./globals";
import * as fs from 'fs';
import * as path from 'path';


const otherDefaultsCallbacks = {
    octaveLocation: getOctavefromEnvPath
} as const;

type ConfigFieldTypeDict = {
    "showRunIconInEditorTitleMenu": boolean;
    "runInTerminal": boolean;
    "clearPreviousOutput": boolean;
    "preserveFocus": boolean;
    "octaveLocation": string;
};

type ConfigField = keyof ConfigFieldTypeDict;
type possibleReturnTypes = ConfigFieldTypeDict[ConfigField];

// type ConfigFieldReturnType<T extends ConfigField> = ConfigFieldTypeDict[T]

export class Config {
    private _config: vscode.WorkspaceConfiguration;

    constructor(extCtx: vscode.ExtensionContext) {
        this._config = vscode.workspace.getConfiguration(globals.EXTENSION_NAME);

        extCtx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
            this._config = vscode.workspace.getConfiguration(globals.EXTENSION_NAME);
        }));
    }

    // read https://www.javiercasas.com/articles/typescript-dependent-types for more info
    // TLDR: using string literals for the section allows the type checker to narrow T in 
    // order to use the correct signature, therefore providing developer tooling
    
    /**
     * Returns a value from the configuration.
     * 
     * @template `T` Should _not_ be set by the user, a generic is needed to automatically infer the type of the returned value.
     * @param section Configuration name, supports _dotted_ names
     * @returns The value `section` denotes or `undefined`.
     */
    public get<T extends ConfigField>(section: T): ConfigFieldTypeDict[T];
    public get(section: ConfigField): possibleReturnTypes | undefined {
        const sectionDefault = this._config.get(section) as ConfigFieldTypeDict[typeof section] | undefined;
        if (section == "octaveLocation" && !sectionDefault) { // Note: it checks for empty string, not only undefined
            return otherDefaultsCallbacks[section]();
        }
        return sectionDefault;
    }
    public has(section: ConfigField) {
        return this._config.has(section);
    }
    public inspect<T>(section: ConfigField): undefined | { key: string; defaultValue?: T; globalValue?: T; workspaceValue?: T; workspaceFolderValue?: T; defaultLanguageValue?: T; globalLanguageValue?: T; workspaceLanguageValue?: T; workspaceFolderLanguageValue?: T; languageIds?: string[]; } {
        return this._config.inspect<T>(section);
    }

    public update(section: ConfigField, value: any, configurationTarget?: vscode.ConfigurationTarget): Thenable<void> {
        return this._config.update(section, value, configurationTarget);
    }
}

function getOctavefromEnvPath(): string | undefined {
    let fileRoot = "octave";
    let splitChar = ':';
    let fileExtension = '';

    const platform = process.platform;
    if (platform === 'win32') {
        fileRoot += "-cli";
        splitChar = ';';
        fileExtension = '.exe';
    }
    const fileName = fileRoot + fileExtension;

    const envPaths = process.env.PATH?.split(splitChar);
    
    if (envPaths) {
        for (const env_path of envPaths) {
            const octave_path: string = path.join(env_path, fileName);
            if (fs.existsSync(octave_path)) {
                return octave_path;
            }
        }
    }
    return undefined;
}

