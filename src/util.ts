"use strict";
import * as vscode from "vscode";
import * as globals from "./globals"

export function config() {
    return vscode.workspace.getConfiguration(globals.EXTENSION_NAME);
}

export async function setupTerminal(requiredName: string = globals.LANGUAGE_NAME): Promise<vscode.Terminal> {
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
        return false;
    }

    return true;
}
