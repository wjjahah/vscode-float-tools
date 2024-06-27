// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { pasreNumberMarkdown, pasreNumberWebview } from "./calculate_float";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "float-tools" is now active!');

  let convertSelectNum = vscode.commands.registerCommand(
    "float-tools.convertSelectNum",
    () => {
      const editor = vscode.window.activeTextEditor;

      if (editor) {
        const document = editor.document;
        const selection = editor.selection;

        // Get the word within the selection
        const word = document.getText(selection);
        const retMessage = pasreNumberWebview(word);

        if (retMessage !== "") {
          const hoverMessage = new vscode.MarkdownString(retMessage);
          hoverMessage.isTrusted = true; // 允许使用 HTML 标签
          console.log(retMessage);
          // return new vscode.Hover(hoverMessage);

          // 创建 Webview 面板并指定显示在当前编辑器的右侧
          const panel = vscode.window.createWebviewPanel(
            "float-tools webview", // 唯一标识符
            "Float tools Webview", // 面板标题
            vscode.ViewColumn.Beside, // 显示在当前编辑器的右侧
            {
              enableScripts: true, // 允许在 Webview 中运行 JavaScript
            }
          );

          panel.webview.html = retMessage;
        }
      }
    }
  );

  // 注册一个 Hover 提供者
  const hoverProvider = vscode.languages.registerHoverProvider(
    { scheme: "file", language: "cpp" },
    {
      provideHover(document, position, token) {
        const range = document.getWordRangeAtPosition(
          position,
          /(-?(0[xX](\.[0-9a-fA-F]+|[0-9a-fA-F]+(\.[0-9a-fA-F]*)?)[pP][+-]?\d+|0[xX][0-9a-fA-F]+|\d+(\.\d*)?|\.\d+([eE][+-]?\d+)?))/
        );
        const word = range ? document.getText(range) : undefined;

        if (word) {
          const retMessage = pasreNumberMarkdown(word);

          if (retMessage !== "") {
            const hoverMessage = new vscode.MarkdownString(retMessage);
            hoverMessage.isTrusted = true; // 允许使用 HTML 标签
            // console.log(`retMessage = (${hoverMessage})`);
            return new vscode.Hover(hoverMessage);
          }
        }
        return undefined;
      },
    }
  );

  context.subscriptions.push(convertSelectNum);
  context.subscriptions.push(hoverProvider);
}

// This method is called when your extension is deactivated
export function deactivate() {}
