import type * as vscode from "vscode";
import { cmd_dictionary } from "./cmds";
import { Ctx } from "./Ctx";

let ctx: Ctx;

export function activate(context: vscode.ExtensionContext) {
    ctx = Ctx.create(context, cmd_dictionary);
}

export function deactivate() {
    ctx.dispose();
}
