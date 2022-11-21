import * as vscode from "vscode";
import * as globals from "./globals";
import type * as packageJSON from '../package.json';

type fullSettings = typeof packageJSON.contributes.configuration.properties;

// Are you here because you want to add a new config option but there's some unknown type shenanigans?
// You may want to add a default value for the setting in the package.json file.
// Only then you will have automatic type checking for the setting.
type ConfigFieldTypeDict = {
    [key in keyof fullSettings as key extends `${string}.${infer SettingName}` ? SettingName : never]:
        fullSettings[key] extends { default: infer DefaultT; } ?
            DefaultT:
            unknown;
};
export type ConfigField = keyof ConfigFieldTypeDict;
type possibleReturnTypes = ConfigFieldTypeDict[keyof ConfigFieldTypeDict];

export type configCallbackDictionary = { readonly [key in ConfigField]?: () => ConfigFieldTypeDict[key] | undefined };

export class Config<CbTDict extends Partial<ConfigFieldTypeDict>> {
    private _config: vscode.WorkspaceConfiguration;
    private readonly _otherDefaultsCallbacks: configCallbackDictionary;

    constructor(extCtx: vscode.ExtensionContext, otherDefaultsCallbacks: configCallbackDictionary = {}) {
        this._config = vscode.workspace.getConfiguration(globals.EXTENSION_NAME);

        extCtx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
            this._config = vscode.workspace.getConfiguration(globals.EXTENSION_NAME);
        }));

        this._otherDefaultsCallbacks = otherDefaultsCallbacks;
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
    public get<_T extends ConfigField & keyof CbTDict>(section: _T): ConfigFieldTypeDict[_T] & CbTDict[_T];
    public get<_T extends ConfigField>(section: _T): ConfigFieldTypeDict[_T];
    public get(section: ConfigField): possibleReturnTypes | undefined {
        const packageSectionDefault = this._config.get(section);
        if (packageSectionDefault) {
            return packageSectionDefault;
        }

        const cb = this._otherDefaultsCallbacks[section];
        if (cb !== undefined) {
            return cb();
        }

        return undefined;
    }
    public has(section: ConfigField) {
        return this._config.has(section);
    }
    public inspect<T>(section: ConfigField): undefined | { key: string; defaultValue?: T; globalValue?: T; workspaceValue?: T; workspaceFolderValue?: T; defaultLanguageValue?: T; globalLanguageValue?: T; workspaceLanguageValue?: T; workspaceFolderLanguageValue?: T; languageIds?: string[]; } {
        return this._config.inspect<T>(section);
    }

    public update(section: ConfigField, value: CbTDict[typeof section], configurationTarget?: vscode.ConfigurationTarget): Thenable<void> {
        return this._config.update(section, value, configurationTarget);
    }
}
