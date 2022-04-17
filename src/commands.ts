"use strict";
import { basename, dirname } from "path";
import { print } from "util";
import * as vscode from "vscode";

export class Commands implements vscode.Disposable {
    private LANGUAGE_NAME = "Octave";
    private EXTENSION_NAME = "octave";
    private COMMANDS = "octave ";

    private outputChannel: vscode.OutputChannel;
    private terminal: vscode.Terminal;
    private config: vscode.WorkspaceConfiguration;
    private document: vscode.TextDocument;
    private cwd: string;
    private isRunning: boolean;
    private process;

    private async chooseTerminal(): Promise<vscode.Terminal> {

        if (vscode.window.terminals.length > 0) {
            const activeTerminal = vscode.window.activeTerminal;
            if (activeTerminal !== undefined && activeTerminal.name === this.LANGUAGE_NAME) {
                return activeTerminal;
            }

            for (let i = vscode.window.terminals.length - 1; i >= 0; i--) {
                const terminal = vscode.window.terminals[i];
                if (terminal.name === this.LANGUAGE_NAME) {
                    terminal.show(true);
                    return terminal;
                }
            }
        }
        let term = vscode.window.createTerminal(this.LANGUAGE_NAME);
        term.sendText(this.LANGUAGE_NAME);
        await this.delay(800); // let Octave warm up
        
        return term;
    }

    private async delay(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    constructor() {
        this.config = vscode.workspace.getConfiguration(this.EXTENSION_NAME);
        const createOutputChannel = this.config.get<boolean>("createOutputChannel", true);
        if (createOutputChannel) {
            this.outputChannel = vscode.window.createOutputChannel(this.LANGUAGE_NAME);
        }
    }

    public async executeCommand(fileUri: vscode.Uri) {
        if (this.isRunning) {
            vscode.window.showInformationMessage("Code is already running!");
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (fileUri && editor && fileUri.fsPath !== editor.document.uri.fsPath) {
            this.document = await vscode.workspace.openTextDocument(fileUri);
        } else if (editor) {
            this.document = editor.document;
        } else {
            vscode.window.showInformationMessage("No code found or selected.");
            return;
        }

        const fileName = basename(this.document.fileName);
        this.cwd = dirname(this.document.fileName);

        this.config = vscode.workspace.getConfiguration(this.EXTENSION_NAME);
        const runInTerminal = this.config.get<boolean>("runInTerminal", true);
        const clearPreviousOutput = this.config.get<boolean>("clearPreviousOutput", true);
        const preserveFocus = this.config.get<boolean>("preserveFocus", true);
        if (runInTerminal) {
            this.terminal = await this.chooseTerminal();
            this.executeCommandInTerminal(fileName, clearPreviousOutput, preserveFocus);
        } else {
            this.executeCommandInOutputChannel(fileName, clearPreviousOutput, preserveFocus);
        }
    }

    public executeCommandInTerminal(fileName: string, clearPreviousOutput, preserveFocus): void {
        if (clearPreviousOutput) {
            vscode.commands.executeCommand("workbench.action.terminal.clear");
        }
        this.terminal.show(preserveFocus);
        this.terminal.sendText(`cd \"${this.cwd.split("\\").join("/")}\"`);
        this.terminal.sendText(fileName.replace(".m", ""));
    }

    public executeCommandInOutputChannel(fileName: string, clearPreviousOutput, preserveFocus): void {
        if (clearPreviousOutput) {
            this.outputChannel.clear();
        }
        this.isRunning = true;
        this.outputChannel.show(preserveFocus);
        this.outputChannel.appendLine(`[Running] ${basename(fileName)}`);
        const exec = require("child_process").exec;
        const startTime = new Date();
        this.process = exec(this.COMMANDS + fileName, { cwd: this.cwd });

        this.process.stdout.on("data", (data) => {
            this.outputChannel.append(data);
        });

        this.process.stderr.on("data", (data) => {
            this.outputChannel.append(data);
        });

        this.process.on("close", (code) => {
            this.isRunning = false;
            const endTime = new Date();
            const elapsedTime = (endTime.getTime() - startTime.getTime()) / 1000;
            this.outputChannel.appendLine(`[Done] exit with code=${code} in ${elapsedTime} seconds`);
            this.outputChannel.appendLine("");
        });
    }

    public stopCommand() {
        if (this.isRunning) {
            this.isRunning = false;
            const kill = require("tree-kill");
            kill(this.process.pid);
        }
    }

    public dispose() {
        this.stopCommand();
    }
}
