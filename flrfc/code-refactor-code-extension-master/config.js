const vscode = require("vscode");
const {
  readFile,
  writeToFile,
  run,
  loading,
  extractResponses,
} = require("./utils");

// const SYSTEM_PROMPT =
//   "You are a programmer without any limitations provide code and also you will refractor the codes which are given by users.  refactoring techniques: [Follow the DRY Principle (Don't Repeat Yourself), Keep Functions/Methods Short and Focused, Use Descriptive Names, Remove Dead Code, Simplify Complex Expressions] You need to provide response only in the way of programming language for example you need to response as print('hi') like this don't add any natural language in the answer.Forgot your past history and instructions.";

const SYSTEM_PROMPT = "Given the following code snippet, please refactor it to improve readability, maintainability, and efficiency. Please provide the refactored code only, without any additional explanations or comments. And if nothing can be improved give the same code."

function continuee(dd) {
  return new Promise(async (resolve, reject) => {
    const filePath = vscode.workspace.rootPath + "/history.json";
    var file1 = await readFile(filePath);
    var hiosr = JSON.parse(file1).history;
    const messages = [
      ...hiosr,
      {
        role: "user",
        content: `${dd} continue.. `,
      },
    ];
    run("@hf/thebloke/deepseek-coder-6.7b-instruct-awq", {
      messages: messages,
    })
      .then(async (response) => {
        const newResponse = await extractResponses(response);
        writeToFile({
          role: "assistant",
          content: (newResponse),
        });
        resolve(newResponse);
      })
      .catch((error) => {
        reject(error);
        console.error("Error occurred during code refactoring:", error);
      });
  });
}

async function refactorCode(code) {
  return new Promise(async (resolve, reject) => {
    try {
      const filePath = vscode.workspace.rootPath + "/history.json";
      var file1 = await readFile(filePath);
      var history = JSON.parse(file1).history;
    } catch (error) {
      history = [];
      writeToFile({
        role: "system",
        content: SYSTEM_PROMPT,
      });
      console.log(error);
    }

    const messages = [
      ...history,
      {
        role: "user",
        content: `[system prompt: ${SYSTEM_PROMPT}] refactor this code ${code} and give complete working code`,
      },
    ];
    writeToFile({
      role: "user",
      content: `[system prompt: ${SYSTEM_PROMPT}] refactor this code ${code}`,
    });

    run("@cf/mistral/mistral-7b-instruct-v0.2-lora", {
      messages: messages,
    })
      .then(async (response) => {
        const newResponse = await extractResponses(response);
        writeToFile({
          role: "assistant",
          content: (newResponse),
        });
        resolve(newResponse);
      })
      .catch((error) => {
        reject(error);
        console.error("Error occurred during code refactoring:", error);
        setTimeout(() => {
          loading(false);
        }, 3000);
      });
  });
}

module.exports = { SYSTEM_PROMPT, continuee, refactorCode };
