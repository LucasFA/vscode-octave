"use strict";
import * as vscode from "vscode";


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
