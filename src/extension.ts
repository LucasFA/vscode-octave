import * as vscode from "vscode";
import { cmd_dictionary } from "./cmds";
import Ctx from "./Ctx";

let ctx: Ctx;

export function activate(context: vscode.ExtensionContext) {
    ctx = Ctx.create(context);
    
    for (const [name, cmd] of Object.entries(cmd_dictionary)) {
        ctx.registerCommand(name, cmd);
    }
}

export function deactivate() {
    ctx.dispose();
}
