import * as vscode from "vscode";
import * as globals from "./globals";
import * as packageJSON from '../package.json';


// function isConfigField(s: string): s is ConfigField {
//     const settings = packageJSON.contributes.configuration.properties;
//     return `${globals.EXTENSION_NAME}.${s}` in Object.keys(settings);
// }

const settings = packageJSON.contributes.configuration.properties;
type ConfigFieldFull = keyof typeof settings;
export type ConfigField = ConfigFieldFull extends `${typeof globals.EXTENSION_NAME}.${infer T}` ? T : never;


interface setting {
    type: string;
    description: string;
    scope: string;
}

interface settingWithDefault<T> extends setting {
    default: T;
}

type configCallback<T> = () => (T | undefined);
export type configCallbackDictionary = { [key in ConfigField]?: configCallback<ConfigFieldTypeDict[key]> };

// Are you here because you want to add a new config option but there's some unknown type shenanigans?
// You may want to add a default value for the setting in the package.json file.
// Only then you will have automatic type checking for the setting.
type ConfigFieldTypeDict = {
    [key in ConfigFieldFull as key extends `${typeof globals.EXTENSION_NAME}.${infer R}` ? R : never]: // remove the "octave." prefix from the key
    typeof settings[key] extends settingWithDefault<infer R> ? R : unknown // if it has a default value of type R, use R
};
type untypedConfigFieldTypeDict = Partial<ConfigFieldTypeDict>;

type possibleReturnTypes = ConfigFieldTypeDict[keyof ConfigFieldTypeDict];

export class Config<TDict extends untypedConfigFieldTypeDict> {
    private _config: vscode.WorkspaceConfiguration;
    private _otherDefaultsCallbacks: configCallbackDictionary;

    constructor(extCtx: vscode.ExtensionContext) {
        this._config = vscode.workspace.getConfiguration(globals.EXTENSION_NAME);

        extCtx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
            this._config = vscode.workspace.getConfiguration(globals.EXTENSION_NAME);
        }));

        this._otherDefaultsCallbacks = {};
    }

    public registerFallbackSetting(section: ConfigField, callback: () => ConfigFieldTypeDict[ConfigField]): this;
    public registerFallbackSetting(section: ConfigField, callback: () => ConfigFieldTypeDict[ConfigField] | undefined): this;
    public registerFallbackSetting(section: ConfigField, callback: () => ConfigFieldTypeDict[ConfigField] | undefined): this {
        if (section in this._otherDefaultsCallbacks) {
            throw new Error(`Config field ${section} already has a fallback value`);
        }

        this._otherDefaultsCallbacks[section] = callback as any;
        return this;
    }

    // read https://www.javiercasas.com/articles/typescript-dependent-types for more info
    // TLDR: using string literals for the section allows the type checker to narrow T in 
    // order to use the correct signature, therefore providing developer tooling
    /**
     * Returns a value from the configuration.
     * 
     * @template `_T` Should _not_ be set by the user, a generic is needed to automatically infer the type of the returned value.
     * @param section Configuration name, supports _dotted_ names
     * @returns The value `section` denotes or `undefined`.
     */
    // so the resulting type is the best from the type in
    // package.json and the return type of the callback(ie the intersection of the two)
    public get<_T extends ConfigField & keyof TDict>(section: _T): ConfigFieldTypeDict[_T] & TDict[_T];
    public get<_T extends ConfigField>(section: _T): ConfigFieldTypeDict[_T];
    public get(section: ConfigField): possibleReturnTypes | undefined {
        const packageSectionDefault = this._config.get(section) as ConfigFieldTypeDict[typeof section] | undefined;
        if (packageSectionDefault) {
            return packageSectionDefault;
        }

        if (section in this._otherDefaultsCallbacks) {
            const cb = this._otherDefaultsCallbacks[section];
            if (cb !== undefined) {
                return cb();
            }
        }

        return undefined;
    }
    public has(section: ConfigFieldFull) {
        return this._config.has(section);
    }
    public inspect<T>(section: ConfigField): undefined | { key: string; defaultValue?: T; globalValue?: T; workspaceValue?: T; workspaceFolderValue?: T; defaultLanguageValue?: T; globalLanguageValue?: T; workspaceLanguageValue?: T; workspaceFolderLanguageValue?: T; languageIds?: string[]; } {
        return this._config.inspect<T>(section);
    }

    public update(section: ConfigField, value: any, configurationTarget?: vscode.ConfigurationTarget): Thenable<void> {
        return this._config.update(section, value, configurationTarget);
    }
}
