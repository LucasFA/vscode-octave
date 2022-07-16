"use strict";
import * as vscode from "vscode";
import * as globals from "./globals"
import * as fs from "fs";
import * as path from 'path';


export type ConfigField =
    "showRunIconInEditorTitleMenu" |
    "runInTerminal"                |
    "clearPreviousOutput"          |
    "preserveFocus"                |
    "octaveLocation";

// Default values should be specified in package.json

// NOTE: use event system to subscribe to onDidChangeConfiguration
export function config() {
    return vscode.workspace.getConfiguration(globals.EXTENSION_NAME);
}

export function getConfig<T>(field: ConfigField, defaultValue?: T): T | undefined {
    return config().get<T>(field, defaultValue);
}

function getOctavefromEnvPath(platform: string): string | undefined {
    let fileName = "octave"
    let splitChar = ':';
    let fileExtension = '';

    if (platform === 'win32') {
        fileName += "-cli"
        splitChar = ';';
        fileExtension = '.exe';
    }

    const envPaths: string[] | string = process.env.PATH.split(splitChar);
    for (const env_path of envPaths) {
        const octave_path: string = path.join(env_path, fileName + fileExtension);
        if (fs.existsSync(octave_path)) {
            return octave_path;
        }
    }
    return undefined;
}

export async function setupTerminal(requiredName: string = globals.LANGUAGE_NAME): Promise<vscode.Terminal> {
    // Don't create redundant terminals. Use existing Octave terminals if they exist.
    if (vscode.window.terminals.length > 0) {
        const activeTerminal = vscode.window.activeTerminal;
        if (activeTerminal !== undefined && activeTerminal.name === requiredName) {
            activeTerminal.show(true);
            return activeTerminal;
        }

        for (let i = vscode.window.terminals.length - 1; i >= 0; i--) {
            const terminal = vscode.window.terminals[i];
            if (terminal.name === requiredName) {
                terminal.show(true);
                return terminal;
            }
        }
    }
    let octavePath = getConfig<string>("octaveLocation")
    if (!octavePath) {
        const platform: string = process.platform;
        octavePath = getOctavefromEnvPath(platform)
    }

    // TODO: add field for shellArgs from user (settings)
    const terminalOptions: vscode.TerminalOptions = {
        name: requiredName,
        shellPath: octavePath,
        cwd: path.dirname(vscode.workspace.workspaceFolders[0].uri.fsPath)

    }

    const term = vscode.window.createTerminal(terminalOptions);
    return term;
}

export async function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function saveDocument(document: vscode.TextDocument): Promise<boolean> {
    if (document.isUntitled) {
        void vscode.window.showErrorMessage('Document is unsaved. Please save and retry.');
        return false;
    }

    const isSaved: boolean = document.isDirty ? (await document.save()) : true;
    if (!isSaved) {
        void vscode.window.showErrorMessage('Cannot run command. Document could not be saved.');
    }
    return isSaved;
}
