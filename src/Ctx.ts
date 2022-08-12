"use strict";
import { basename, dirname } from "path";
import * as vscode from "vscode";
import * as util from "./util";
import * as globals from "./globals";

export type Cmd = (...args: any[]) => unknown;

export class Ctx implements vscode.Disposable {
    private _extCtx: vscode.ExtensionContext;
    private _outputChannel: vscode.OutputChannel;
    private _terminal: vscode.Terminal;
    public isRunning: boolean;
    private _process;

    private constructor(
        extCtx: vscode.ExtensionContext,
        outputChannel: vscode.OutputChannel
    ) { 
        this._extCtx = extCtx;
        this._extCtx.subscriptions.push(this);
        this._outputChannel = outputChannel;
        this.isRunning = false;
    }
    
    static create(extCtx: vscode.ExtensionContext): Ctx {
        const outputChannel = vscode.window.createOutputChannel(globals.LANGUAGE_NAME);
        const res = new Ctx(extCtx, outputChannel);
        return res;
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
        this._terminal = util.setupTerminal();
        const preserveFocus = util.getConfig<boolean>("preserveFocus");
        this._terminal.show(preserveFocus);
        this._terminal.sendText(code);
    };
    
    public executeFileInTerminal(document: vscode.TextDocument, clearPreviousOutput: boolean, preserveFocus: boolean): void {
        this._terminal = util.setupTerminal();
        if (clearPreviousOutput) {
            vscode.commands.executeCommand("workbench.action.terminal.clear");
        }
        this._terminal.show(preserveFocus);

        const filePath = document.fileName.split("\\").join("/");

        // regex for non-ascii characters
        const regex: RegExp = /[^\x00-\x7F]/g;
        const isNonAscii = regex.test(filePath);

        if (isNonAscii) {
            this._terminal.sendText(`"${document.getText()}"`);
        }
        else {
            this._terminal.sendText(`run "${filePath}"`);
        }
    }

    public executeFileInOutputChannel(document: vscode.TextDocument, clearPreviousOutput: boolean, preserveFocus: boolean): void {
        const filePath = document.fileName.split("\\").join("/");
        if (clearPreviousOutput) {
            this._outputChannel.clear();
        }
        this.isRunning = true;
        this._outputChannel.show(preserveFocus);
        this._outputChannel.appendLine(`[Running] ${basename(filePath)}`);
        const exec = require("child_process").exec;
        const startTime = new Date();
        const octaveLocation = util.getConfig<string>("octaveLocation");

        this._process = exec(`"${octaveLocation}" ${basename(filePath)}`, { cwd: dirname(filePath) });

        this._process.stdout.on("data", (data) => {
            this._outputChannel.append(data);
        });

        this._process.stderr.on("data", (data) => {
            this._outputChannel.append(data);
        });

        this._process.on("close", (code) => {
            this.isRunning = false;
            const endTime = new Date();
            const elapsedTime = (endTime.getTime() - startTime.getTime()) / 1000;
            this._outputChannel.appendLine(`[Done] exit with code=${code} in ${elapsedTime} seconds`);
            this._outputChannel.appendLine("");
        });
    }

    public dispose() {
        this._terminal.dispose();
        this._outputChannel.dispose();
        
        if (this.isRunning) {
            this.isRunning = false;
            const kill = require("tree-kill");
            kill(this._process.pid);
        }
    }
}
