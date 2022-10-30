import * as path from "path";
import * as vscode from "vscode";
import { ChildProcess, execFile } from 'child_process';
import * as treeKill from 'tree-kill';

import * as globals from "./globals";
import { Config, ConfigField } from "./Cfg";
import { configCallbacks } from "./ConfigCallbacks";

export type Cmd = (...args: any[]) => unknown;

export default class Ctx implements vscode.Disposable {
    private _extCtx: vscode.ExtensionContext;
    private _config: Config<{
        [key in keyof typeof configCallbacks]: ReturnType<typeof configCallbacks[key]>;
    }>;
    private _outputChannel: vscode.OutputChannel;
    private _terminal: vscode.Terminal | undefined;
    private _terminalStartingWd: string | undefined;
    public isRunning: boolean;
    private _process: ChildProcess | undefined;

    private constructor(
        extCtx: vscode.ExtensionContext,
        outputChannel: vscode.OutputChannel
    ) {
        this._extCtx = extCtx;
        this._extCtx.subscriptions.push(this);
        this._config = new Config(this._extCtx);
        for (const [name, cb] of Object.entries(configCallbacks)) {
            this._config.registerFallbackSetting(name as ConfigField, cb);
        }
        this._outputChannel = outputChannel;
        this.isRunning = false;

        // Default values should be specified in package.json
    }

    static create(extCtx: vscode.ExtensionContext): Ctx {
        const outputChannel = vscode.window.createOutputChannel(globals.LANGUAGE_NAME);
        extCtx.subscriptions.push(outputChannel);
        return new Ctx(extCtx, outputChannel);
    }

    get config() {
        return this._config;
    }

    get terminal(): vscode.Terminal | undefined {
        function isRunning(term: vscode.Terminal | undefined): term is vscode.Terminal {
            return term !== undefined && term.exitStatus === undefined;
        }
        // Don't create redundant terminals. Use existing Octave terminals if they exist.
        if (isRunning(this._terminal)) {
            return this._terminal;
        }


        let tempCandidateNames = [globals.LANGUAGE_NAME, globals.MATLAB_NAME];
        const terminalCandidateNames = tempCandidateNames.map((name) => name.toLocaleLowerCase());

        function isValidTerminal(term: vscode.Terminal | undefined): term is vscode.Terminal {
            return isRunning(term) && terminalCandidateNames.includes(term.name.toLocaleLowerCase());
        }

        const activeTerminal = vscode.window.activeTerminal;
        const fittingTerminal = [activeTerminal].concat(vscode.window.terminals).find(isValidTerminal);

        if (fittingTerminal) {
            this._terminal = fittingTerminal;
            return this._terminal;
        }

        // No appropiate terminals. Create
        // TODO: add field for shellArgs from user (settings)
        const octavePath = this.config.get("octaveLocation");
        if (octavePath === undefined) {
            vscode.window.showErrorMessage("Octave path not found. Please set the path to Octave in the settings.");
            return undefined;
        }
        const workspace = vscode.workspace.workspaceFolders;
        if (!workspace) {
            vscode.window.showWarningMessage("No workspace folder found. Unknown directory where Octave will open.");
        }
        const workspacePath = workspace ? workspace[0].uri.fsPath : undefined;
        this._terminalStartingWd = workspacePath;
        const terminalOptions: vscode.TerminalOptions = {
            name: globals.LANGUAGE_NAME,
            shellPath: octavePath,
            shellArgs: ["--quiet"],
            cwd: workspacePath
        };

        this._terminal = vscode.window.createTerminal(terminalOptions);
        return this._terminal;
    }

    public registerCommand(name: string, factory: (ctx: Ctx) => Cmd) {
        const fullName = `octave.${name}`;
        const cmd = factory(this);
        const d = vscode.commands.registerCommand(fullName, cmd);
        this._extCtx.subscriptions.push(d);
    }

    public runText(code: string): void {
        const preserveFocus = this.config.get("preserveFocus");
        this.terminal?.show(preserveFocus);
        this.terminal?.sendText(code);
    };

    public executeFileInTerminal(document: vscode.TextDocument): void {
        const clearPreviousOutput = this.config.get("clearPreviousOutput");
        if (clearPreviousOutput) {
            vscode.commands.executeCommand("workbench.action.terminal.clear");
        }

        const isAscii = (str: string) => /^[\x00-\x7F]*$/.test(str);
        let filePath = document.fileName;
        const useAbsPath = isAscii(filePath) || this.config.get("alwaysUseAbsolutePaths");
        const wd = this._terminalStartingWd;
        if (!useAbsPath && wd !== undefined) {
            filePath = "./" + path.relative(wd, filePath);
        }
        filePath = filePath.split("\\").join("/");

        const command = isAscii(filePath) ? `run "${filePath}"` : document.getText();
        this.runText(command);
    }

    public executeFileInOutputChannel(document: vscode.TextDocument): void {
        const filePath = document.fileName.split("\\").join("/");
        const clearPreviousOutput = this.config.get("clearPreviousOutput");
        if (clearPreviousOutput) {
            this._outputChannel.clear();
        }
        this.isRunning = true;
        const preserveFocus = this.config.get("preserveFocus");
        this._outputChannel.show(preserveFocus);
        this._outputChannel.appendLine(`[Running] ${path.basename(filePath)}`);
        this._outputChannel.appendLine("");

        const startTime = new Date();
        const octaveLocation = this.config.get("octaveLocation");
        if (octaveLocation === undefined) {
            return;
        }

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

        if (this._process?.pid) {
            treeKill(this._process.pid);
        }
        this.isRunning = false;
    }
}
