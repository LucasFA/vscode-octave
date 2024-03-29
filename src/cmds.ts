import * as vscode from "vscode";
import type { Ctx, Cmd } from "./Ctx";
import * as util from "./util";

export const cmd_dictionary = {
    run: executeFile,
    runLines: runLines,
    stop: stopCommand,
} as const;

function runLines(ctx: Ctx): Cmd {
    return async () => {
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
        ctx.runText(code);

        await vscode.commands.executeCommand('cursorMove', { to: 'down', value: linesToMoveDown });
        await vscode.commands.executeCommand('cursorMove', { to: 'wrappedLineFirstNonWhitespaceCharacter' });
    };
}

function executeFile(ctx: Ctx): Cmd {
    return async (fileUri: vscode.Uri) => {
        if (ctx.isRunning) {
            vscode.window.showInformationMessage("Code is already running!");
            return;
        }
        let document: vscode.TextDocument;
        const editor = vscode.window.activeTextEditor;
        if (fileUri && editor && fileUri.fsPath !== editor.document.uri.fsPath) {
            document = await vscode.workspace.openTextDocument(fileUri);
        } else if (editor) {
            document = editor.document;
        } else {
            vscode.window.showInformationMessage("No code found or selected.");
            return;
        }
        const isSaved = await util.saveDocument(document);
        if (!isSaved) {
            return;
        }

        await ctx.executeFile(document);
    };
}

function stopCommand(ctx: Ctx): Cmd {
    return async () => {
        ctx.dispose();
    }
}
