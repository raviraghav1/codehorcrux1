const fs = require("fs");
const path = require("path");
const vscode = require("vscode");

// async function run(model, input) {
//   const filePath = vscode.workspace.rootPath + "streaming_responses.txt";
//   const response = await fetch(
//     `https://api.cloudflare.com/client/v4/accounts/89a8a1278748c1908293490b681f7c0a/ai/run/${model}`,
//     {
//       headers: {
//         Authorization: `Bearer TdEBl3XistfGxzKPe7uLbyz_O9UeluVk2EBUMuuE`,
//       },
//       method: "POST",
//       body: JSON.stringify(input),
//     }
//   )
//   const result = await response.json();
//   return result;
// }

function deleteStream() {
  const filePath = vscode.workspace.rootPath + "/streaming_responses.json";
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return;
    }

    fs.truncate(filePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
        return;
      }
    });
  });
}

async function run(model, input) {
  deleteStream();
  const filePath = vscode.workspace.rootPath + "/streaming_responses.json";
  const responseStream = fs.createWriteStream(filePath, { flags: "a" });
  const newArray = []

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/89a8a1278748c1908293490b681f7c0a/ai/run/${model}`,
    {
      headers: {
        Authorization: `Bearer uBC6NqucYkHkqbBLmOu_gCQh1oxoGedvxIZCh6TE`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({...input, stream:true}),
    }
  );
  const reader = response.body.getReader();
  let remainingData = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    const chunk = new TextDecoder().decode(value);
    const fullData = remainingData + chunk;
    const parts = fullData.split("data: ");
    remainingData = parts.pop();
    for (const part of parts) {
      try {
        const jsonData = JSON.parse(part);
        responseStream.write(JSON.stringify(jsonData) + ",\n");
        newArray.push(JSON.stringify(jsonData));
      } catch (error) {
        console.log("Invalid JSON data:", part);
      }
    }
  }
  var jsonArray = newArray.map(function(str) {
    return JSON.parse(str);
});

  responseStream.end();
  return jsonArray;
}

async function extractResponses(jsonArray) {
  let result = ""
  jsonArray.forEach(data => result += data.response.toString());
  return result;
}

function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function writeToFile(data) {
  const filePath = vscode.workspace.rootPath + "/history.json";
  let fileData;
  try {
    const jsonData = fs.readFileSync(filePath, "utf8");
    try {
      fileData = JSON.parse(jsonData);
    } catch (error) {
      fileData = { history: [] };
    }
    if (!fileData.history) {
      fileData.history = [];
    }
    fileData.history.push(data);
  } catch (err) {
    fileData = { history: [] };
    fileData.history.push(data);
  }
  fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
  vscode.window.showInformationMessage("code written to history.json");
}

function isCode(str) {
  const regex = /^```[\s\S]*?```$/;
  return regex.test(str);
}

function loading(state, statusBarItem) {
  if (state == true) {
    statusBarItem.text = "$(sync~spin) Refactoring...";
    statusBarItem.show();
  } else {
    setTimeout(() => {
      statusBarItem.hide();
    }, 3000);
  }
}

const extractCode = (code) => {
  var pattern = /```[\s\S]+?```/g;
  var codeBlocks = code.match(pattern);
  return codeBlocks
};

function getFileType(filePath) {
  const extension = path.extname(filePath);
  return extension.split(".")[1] || "";
}

module.exports = {
  readFile,
  writeToFile,
  isCode,
  run,
  loading,
  extractCode,
  extractResponses,
  getFileType
};
