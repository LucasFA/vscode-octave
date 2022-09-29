
import * as vscode from "vscode";
import * as globals from "./globals";
import * as fs from 'fs';
import * as path from 'path';

export type ConfigField =
    "showRunIconInEditorTitleMenu" |
    "runInTerminal" |
    "clearPreviousOutput" |
    "preserveFocus" |
    "octaveLocation";

const otherDefaultsCallbacks = {
    octaveLocation: getOctavefromEnvPath
} as const;

type ConfigFieldReturnType = {
    "showRunIconInEditorTitleMenu": boolean;
    "runInTerminal": boolean;
    "clearPreviousOutput": boolean;
    "preserveFocus": boolean;
    "octaveLocation": string;
};

type possibleReturnTypes = ConfigFieldReturnType[keyof ConfigFieldReturnType];

export class Config {
    private _config: vscode.WorkspaceConfiguration;

    constructor(extCtx: vscode.ExtensionContext) {
        this._config = vscode.workspace.getConfiguration(globals.EXTENSION_NAME);

        extCtx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
            this._config = vscode.workspace.getConfiguration(globals.EXTENSION_NAME);
        }));
    }

    public get<T extends possibleReturnTypes>(section: ConfigField): T {
        const sectionDefault = this._config.get<T>(section);
        if (section == "octaveLocation" && !sectionDefault) { // Note: it checks for empty string, not only undefined
            return otherDefaultsCallbacks[section]() as T;
        }
        return sectionDefault;
    }
    public has(section: ConfigField) {
        return this._config.has(section);
    }
    public inspect<T>(section: ConfigField): { key: string; defaultValue?: T; globalValue?: T; workspaceValue?: T; workspaceFolderValue?: T; defaultLanguageValue?: T; globalLanguageValue?: T; workspaceLanguageValue?: T; workspaceFolderLanguageValue?: T; languageIds?: string[]; } {
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

    const envPaths: string[] | string = process.env.PATH.split(splitChar);
    for (const env_path of envPaths) {
        const octave_path: string = path.join(env_path, fileName);
        if (fs.existsSync(octave_path)) {
            return octave_path;
        }
    }
    return undefined;
}

