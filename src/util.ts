"use strict";
import * as vscode from "vscode";
import * as globals from "./globals"


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

export function getConfig<T>(field: ConfigField, defaultValue?: T): T {
    if (defaultValue) {
        return config().get<T>(field, defaultValue);
    }
    else {
        return config().get<T>(field);
    }
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

    let term = vscode.window.createTerminal(requiredName);
    // FIXME: currently still opens octave from the PATH variable. There's differing behaviour depending on the terminal
    // eg: "C:/.../octave.bat" opens octave on cmd but not on powershell. Bash users might have any experience
    // const octaveLocation = config().get<string>("octaveLocation", globals.OCTAVE_PATH);
    term.sendText("octave");
    delay(800); // let Octave warm up
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
