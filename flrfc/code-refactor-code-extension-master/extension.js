const vscode = require("vscode");
const { continuee, refactorCode } = require("./config");
const {
  loading,
  readFile,
  writeToFile,
  isCode,
  extractCode,
  extractResponses,
  getFileType,
} = require("./utils");

const statusBarItem = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Left,
  100
);

const getFullCodeCommand = vscode.commands.registerCommand(
  "codehorcrux.refactor",
  async () => {
    const activeEditor = vscode.window.activeTextEditor;
    loading(true, statusBarItem);
    if (activeEditor) {
      const document = activeEditor.document;
      const fileType = getFileType(document.fileName);
      const fileContent = await readFile(document.fileName);
      try {
        try {
          let response = await refactorCode(fileContent);
          if (isCode(response)) {
            const extractedCode = await extractCode(response);
            console.log(extractedCode);
            await activeEditor.edit((editBuilder) => {
              const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(document.getText().length)
              );
              editBuilder.replace(fullRange, extractedCode);
            });
          } else {
            await activeEditor.edit((editBuilder) => {
              const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(document.getText().length)
              );
              const sliceLength =
                fileType == "py"
                  ? 6
                  : fileType == "js"
                  ? 10
                  : fileType == "java"
                  ? 4
                  : fileType == "c"
                  ? 1
                  : 5;
              console.log(response)
              editBuilder.replace(fullRange, response.split("```")[1]?.slice(sliceLength, ));
            });
          }
        } catch (error) {
          console.error(error);
        }
        loading(false, statusBarItem);
      } catch (error) {
        console.error("Error occurred during code refactoring:", error);
        setTimeout(() => {
          loading(false, statusBarItem);
        }, 3000);
      }
    } else {
      vscode.window.showErrorMessage("No active editor found.");
    }
  }
);

/**
 * @param {vscode.ExtensionContext} context
 */

function activate(context) {
  context.subscriptions.push(getFullCodeCommand);
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
