
import * as vscode from "vscode";
import * as globals from "./globals";

export type ConfigField =
    "showRunIconInEditorTitleMenu" |
    "runInTerminal" |
    "clearPreviousOutput" |
    "preserveFocus" |
    "octaveLocation";

export class Config implements vscode.WorkspaceConfiguration{
    private _config: vscode.WorkspaceConfiguration;

    constructor(extCtx: vscode.ExtensionContext) {
        this._config = vscode.workspace.getConfiguration(globals.EXTENSION_NAME);

        extCtx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(() => {
            this._config = vscode.workspace.getConfiguration(globals.EXTENSION_NAME);
        }));
    }

    public get<T>(section: ConfigField): T | undefined;
    public get<T>(section: ConfigField, defaultValue?: T): T {
        return this._config.get<T>(section, defaultValue);
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