// Back-End code goes here?

//#region BoilerplateWindowCreation
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const $ = require("jquery");
const fs = require("fs");

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
    app.quit();
}

const WIDTH = 1440;
const HEIGHT = 720;

const createWindow = () => {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        WIDTH: WIDTH,
        HEIGHT: HEIGHT,
        webPreferences: {
            sandbox: false,
            preload: path.join(__dirname, "preload.js"),
        },
    });

    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, "index.html"));
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
//#endregion

/*
----------------------------------------------------------------------
Reading Question from local storage then sending it front-end via IPC
----------------------------------------------------------------------
*/
readQuestionAsync = async (filepath) => {
  return JSON.parse(await fs.promises.readFile(filepath, "utf8"));
};

const getQuestionsAsync = async (
    path_to_questions = path.join(__dirname, "questions")) => {
    try {
        fileNames = await fs.promises.readdir(path_to_questions);
        questionsList = []
        for (const fileName of fileNames) {
          // If it doesn't match the regex format for a question, skip
          if (!/question-(\d)+.json/.test(fileName)) continue;

          let questionObject = await readQuestionAsync(path.join(path_to_questions, fileName))
          questionsList.push(questionObject);
        }

        return questionsList
    } 
    catch (error) {
        console.log("Unable load questions due to : " + error);
        return [];
    }
};

// Listen for get-questions event from api
//  if such a request is made, the callback function described below will return a promise to resolve with a list of questions
ipcMain.handle("get-questions", async (event) => {
    qList = await getQuestionsAsync();
    return qList;
});


