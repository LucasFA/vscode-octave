"use strict";
import * as vscode from "vscode";
import { Commands } from "./commands";

const commands = new Commands();

export function activate(context: vscode.ExtensionContext) {

    const run = vscode.commands.registerCommand("octave.run", (fileUri: vscode.Uri) => {
        commands.executeCommand(fileUri);
    });
    
    const runLines = vscode.commands.registerCommand("octave.runLines", () => {
        commands.runLines();
    });

    const stop = vscode.commands.registerCommand("octave.stop", () => {
        commands.stopCommand();
    });

    context.subscriptions.push(run);
    context.subscriptions.push(runLines);
    context.subscriptions.push(commands);
}

export function deactivate() {
    commands.stopCommand();
}
