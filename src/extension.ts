"use strict";
import * as vscode from "vscode";
import * as cmds from "./cmds";
import { Ctx } from "./Ctx";

let ctx: Ctx | undefined;

export function activate(context: vscode.ExtensionContext) {
    ctx = Ctx.create(context);
    
    ctx.registerCommand("run", cmds.executeFile);
    ctx.registerCommand("runLines", cmds.runLines);
    ctx.registerCommand("stop", cmds.stopCommand);

}

export function deactivate() {
    ctx.dispose();
}
