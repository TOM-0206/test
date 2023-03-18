// Middle-End, initializes the API

const { contextBridge, ipcRenderer } = require("electron");
const katex = require("katex");
const mathjs = require("mathjs");

contextBridge.exposeInMainWorld("api", {
    // our list of loaded questions
    question_list: [],

    // Function to render maths to html dom element
    render_maths: katex.render,

    // Function to evaluate text input to numeric value
    evaluate_math: mathjs.evaluate,

    // Invoke must return something 
    getQuestionsFromBackend: () => ipcRenderer.invoke('get-questions'),

});

console.log("Preload JS loaded");