"use strict";
import * as path from "path";
import * as vscode from "vscode";
import { ChildProcess, execFile } from 'child_process';
import * as fs from 'fs';

import * as globals from "./globals";
import { Config } from "./Cfg";

export type Cmd = (...args: any[]) => unknown;

export default class Ctx implements vscode.Disposable {
    private _extCtx: vscode.ExtensionContext;
    private _config: Config;
    private _outputChannel: vscode.OutputChannel;
    private _terminal: vscode.Terminal | undefined;
    public isRunning: boolean;
    private _process: ChildProcess | undefined;

    private constructor(
        extCtx: vscode.ExtensionContext,
        outputChannel: vscode.OutputChannel
    ) {
        this._extCtx = extCtx;
        this._extCtx.subscriptions.push(this);
        this._config = new Config(this._extCtx);
        this._outputChannel = outputChannel;
        this.isRunning = false;

        // Default values should be specified in package.json
    }

    static create(extCtx: vscode.ExtensionContext): Ctx {
        const outputChannel = vscode.window.createOutputChannel(globals.LANGUAGE_NAME);
        const res = new Ctx(extCtx, outputChannel);
        return res;
    }

    get config(): Config {
        return this._config;
    }

    get terminal(): vscode.Terminal {
        function isRunning(term: vscode.Terminal): boolean {
            return term && (term.exitStatus === undefined);
        }
        // Don't create redundant terminals. Use existing Octave terminals if they exist.
        if (isRunning(this._terminal)) {
            return this._terminal;
        }

        const wantedTermName = globals.LANGUAGE_NAME;
        const octavePath = this.config.get<string>("octaveLocation");
        const activeTerminal = vscode.window.activeTerminal;

        function isVSCTerminalOptions(ob: vscode.TerminalOptions | vscode.ExtensionTerminalOptions): ob is vscode.TerminalOptions {
            return "shellPath" in ob;
        }
        function isExtensionCreatedTerminal(term: vscode.Terminal) {
            return term?.name === wantedTermName &&
                isVSCTerminalOptions(term.creationOptions) &&
                term.creationOptions.shellPath === octavePath;
        };
        const candidates = [activeTerminal].concat(vscode.window.terminals);

        const fittingTerminal = candidates.find((term: vscode.Terminal) => {
            return isRunning(term) && isExtensionCreatedTerminal(term);
        });

        if (fittingTerminal) {
            this._terminal = fittingTerminal;
            return this._terminal;
        }

        // No appropiate terminals. Create
        // TODO: add field for shellArgs from user (settings)
        const terminalOptions: vscode.TerminalOptions = {
            name: wantedTermName,
            shellPath: octavePath,
            shellArgs: ["--quiet"],
            cwd: path.dirname(vscode.workspace.workspaceFolders[0].uri.fsPath)
        };

        this._terminal = vscode.window.createTerminal(terminalOptions);
        return this._terminal;
    }

    public push(d: vscode.Disposable): void {
        this._extCtx.subscriptions.push(d);
    }

    registerCommand(name: string, factory: (ctx: Ctx) => Cmd) {
        const fullName = `octave.${name}`;
        const cmd = factory(this);
        const d = vscode.commands.registerCommand(fullName, cmd);
        this.push(d);
    }


    public runText(code: string): void {
        const preserveFocus = this.config.get<boolean>("preserveFocus");
        this.terminal.show(preserveFocus);
        this.terminal.sendText(code);
    };

    public executeFileInTerminal(document: vscode.TextDocument, clearPreviousOutput: boolean, preserveFocus: boolean): void {
        if (clearPreviousOutput) {
            vscode.commands.executeCommand("workbench.action.terminal.clear");
        }
        this.terminal.show(preserveFocus);

        const filePath = document.fileName.split("\\").join("/");

        // regex for non-ascii characters
        const regex: RegExp = /[^\x00-\x7F]/g;
        const isNonAscii = regex.test(filePath);

        const command = isNonAscii ? `"${document.getText()}"` : `run "${filePath}"`;
        this.terminal.sendText(command);
    }

    public executeFileInOutputChannel(document: vscode.TextDocument, clearPreviousOutput: boolean, preserveFocus: boolean): void {
        const filePath = document.fileName.split("\\").join("/");
        if (clearPreviousOutput) {
            this._outputChannel.clear();
        }
        this.isRunning = true;
        this._outputChannel.show(preserveFocus);
        this._outputChannel.appendLine(`[Running] ${path.basename(filePath)}`);
        this._outputChannel.appendLine("");

        const startTime = new Date();
        const octaveLocation = this.config.get<string>("octaveLocation");

        const args = [path.basename(filePath)];
        const options = { cwd: path.dirname(filePath) };
        this._process = execFile(octaveLocation, args, options, (error, stdout, stderr) => {
            if (error) {
                this._outputChannel.appendLine(`[Error] ${error.message}`);
            }
            if (stdout) {
                this._outputChannel.appendLine(`[Output] ${stdout}`);
            }
            if (stderr) {
                this._outputChannel.appendLine(`[Error] ${stderr}`);
            }
            this.isRunning = false;
            const endTime = new Date();
            const elapsedTime = endTime.getTime() - startTime.getTime();
            this._outputChannel.appendLine(`[Finished] ${path.basename(filePath)} (${elapsedTime}ms)`);
        });
    }

    public dispose() {
        this._terminal?.dispose();
        this._outputChannel.dispose();

        if (this.isRunning) {
            this.isRunning = false;
            const kill = require("tree-kill");
            kill(this._process.pid);
        }
    }
}
