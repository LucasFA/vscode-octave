"use strict";
import { basename, dirname } from "path";
import * as vscode from "vscode";

export class Commands implements vscode.Disposable {
    private LANGUAGE_NAME = "Octave";
    private EXTENSION_NAME = "octave";
    private COMMANDS = "octave ";

    private outputChannel: vscode.OutputChannel;
    private terminal: vscode.Terminal;
    private document: vscode.TextDocument;
    private cwd: string;
    private isRunning: boolean;
    private process;

    private config() {
        return vscode.workspace.getConfiguration(this.EXTENSION_NAME);
    }
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

    public async runLines(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        let code: string;
        if (!editor) {
            vscode.window.showErrorMessage("No active text editor.");
            return;
        }

        const document = editor.document;
        const selection = editor.selection;

        if (selection.end.line + 1 === document.lineCount) {
            const endPos = document.lineAt(document.lineCount - 1).range.end;
            await editor.edit(e => e.insert(endPos, '\n'));
        }

        let linesToMoveDown = 0;
        if (!selection.isEmpty) {
            const codeRange = new vscode.Range(selection.start, selection.end);
            code = document.getText(codeRange);
        }
        else {
            let line: vscode.TextLine;
            do {
                const currentPos = selection.active.translate(linesToMoveDown, 0);
                linesToMoveDown++;
                line = document.lineAt(currentPos);
            } while (line.isEmptyOrWhitespace && line.lineNumber + 1 < document.lineCount);
            code = line.text;
        }
        await this.runText(code);

        await vscode.commands.executeCommand('cursorMove', { to: 'down', value: linesToMoveDown });
        await vscode.commands.executeCommand('cursorMove', { to: 'wrappedLineFirstNonWhitespaceCharacter' });

    }

    private async runText(code: string): Promise<void> {
        this.terminal = await this.chooseTerminal();

        const preserveFocus = this.config().get<boolean>("preserveFocus", true);
        this.terminal.show(preserveFocus);
        this.terminal.sendText(code);
    }

    constructor() {
        const createOutputChannel = this.config().get<boolean>("createOutputChannel", true);
        if (createOutputChannel) {
            this.outputChannel = vscode.window.createOutputChannel(this.LANGUAGE_NAME);
        }
    }

    public async executeFile(fileUri: vscode.Uri) {
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

        const config = this.config();
        const runInTerminal = config.get<boolean>("runInTerminal", true);
        const clearPreviousOutput = config.get<boolean>("clearPreviousOutput", true);
        const preserveFocus = config.get<boolean>("preserveFocus", true);
        if (runInTerminal) {
            this.terminal = await this.chooseTerminal();
            this.executeFileInTerminal(fileName, clearPreviousOutput, preserveFocus);
        } else {
            this.executeFileInOutputChannel(fileName, clearPreviousOutput, preserveFocus);
        }
    }

    public executeFileInTerminal(fileName: string, clearPreviousOutput, preserveFocus): void {
        if (clearPreviousOutput) {
            vscode.commands.executeCommand("workbench.action.terminal.clear");
        }
        this.terminal.show(preserveFocus);
        // TODO: deal with encoding. Path names with tildes and such have problems
        this.terminal.sendText(`cd \"${this.cwd.split("\\").join("/")}\"`);
        this.terminal.sendText(`run "${fileName.replace(".m", "")}"`);
    }

    public executeFileInOutputChannel(fileName: string, clearPreviousOutput, preserveFocus): void {
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
