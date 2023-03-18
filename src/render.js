// Front-End script, loaded into the DOM
//TODO : Clean, break up into functions, use jquery instead of getElementById and etc ...
let questionNumber = 1;
window.api !== null
    ? console.log("Loaded API")
    : console.log("Failed to load API");

getEmptyQuestionBox = () => {
    return $("<div>", {
        class: "box question-render-box",
    });
};

// Creates and returns the answer box part at bottom of question
generateAnswerBoxDiv = (answerPrompt = "click to answer ...") => {
    // Create a div of class field
    answerDiv = $("<div>")
        .addClass("field has-addons pt-4")
        // Add two divs, first div is the input text div and second is the submit button
        .append(
            $("<div>")
                // control is BULMA CSS stuff, we need this div wrapper
                .addClass("control")
                // create input field with id "answer-text-field" to be referenced later
                .append(
                    $("<input>")
                        .addClass("input answer-text-field")
                        .attr("type", "text")
                        .attr("placeholder", answerPrompt)
                )
        )
        .append(
            $("<div>")
                // same as before, BULMA CSS wrapper stuff
                .addClass("control")
                // create button with id "answer-submit-button" to be referenced later
                .append(
                    $("<button>")
                        .addClass("button is-info answer-submit-button")
                        .html("Answer")
                )
        );
    return answerDiv;
};

validateAnswer = (inputStr, expectedAnswer) => {
    let numericInput = null;
    // Try convert answer to a number
    try {
        numericInput = window.api
            .evaluate_math(inputStr)
            .toPrecision(3);
    } catch (err) {
        // If it fails answer is wrong, and tell user its not valid
        console.log(`Caught error :\n\t ${err}`);
        return { validInput: false, answerCorrect: false };
    }

    // Otherwise check if the numeric values matches
    let validInput = true;
    let answerCorrect = numericInput == expectedAnswer.toPrecision(3);
    return { validInput, answerCorrect, numericInput };
};

updateAnswerInterpretationSubtitle = (subtitle, text) => {
    // If the interpreted-as subtitle doesn't already exist create it
    if (subtitle.length == 0) {
        subtitle = $("<p>", {
            class: "interpreted-as subtitle is-6 is-italic fade-in-text",
        });
    }
    subtitle.html(text);
    return subtitle;
};

// This is bit expensive, but its the only way to get the animation to work
function forceReflow(element) {
    if (element === undefined) {
        element = document.documentElement;
    }
    void element.offsetHeight;
}

animateCorrect = (element) => {
    element.removeClass("answer-correct");
    element.removeClass("answer-incorrect");

    forceReflow(); /* trigger reflow */

    element.addClass("answer-correct");
};

animateIncorrect = (element) => {
    element.removeClass("answer-incorrect");
    element.removeClass("answer-correct");

    forceReflow(); /* trigger reflow */

    element.addClass("answer-incorrect");
};



// Returns a function using referring to the specific (questionBox, answerTextField) elements passed in
getOnSubmitButtonPressed = (questionBox, expectedAnswer) => {
    // return the function detailing What do when answer button is clicked
    let answerHistory = []
    let onSubmitButtonPressed = () => {
        let answerSubmitButton = questionBox.find(".answer-submit-button");
        let answerTextField = questionBox.find(".answer-text-field");
        let subtitle = questionBox.find(".interpreted-as");

        let { validInput, answerCorrect, numericInput } = validateAnswer(
            answerTextField.val(),
            expectedAnswer
        );
        if (!validInput) {
            // Update subtitle to show current contents of textfield cannot be understood
            updateAnswerInterpretationSubtitle(
                subtitle,
                `Cannot Interpret ${answerTextField.val()}`
            )
                .addClass("has-text-danger")
                .appendTo(questionBox);
            animateIncorrect(questionBox);
            return;
        }

        if (answerCorrect) {
            answerSubmitButton.removeClass("is-danger");
            answerSubmitButton.addClass("is-success");

            animateCorrect(questionBox);
            let currentDate = new Date();
            answerSubmitButton.attr("disabled", true);
            answerSubmitButton.html("Correct");
            answerHistory.push([new Date().toISOString(), true]);
        } else {
            // as of now, a question cannot go from is-success to is-danger, here for future proofing
            answerSubmitButton.removeClass("is-success");

            animateIncorrect(questionBox);

            answerSubmitButton.addClass("is-danger");

            answerSubmitButton.html("Retry");
            answerHistory.push([new Date().toISOString(), false]);
        }
        console.log(answerHistory);

        // Update subtitle to show current numeric interpretation of the textfield
        updateAnswerInterpretationSubtitle(
            subtitle,
            `Interpreted as ${String(numericInput)}`
        )
            .removeClass("has-text-danger")
            .appendTo(questionBox);
    };
    return onSubmitButtonPressed;
};


getQuestionBox = (questionObject, questionNumber) => {
    let questionBox = getEmptyQuestionBox();

    // Add the `question-number` attribute to the `questionBox` element
    questionBox.attr("question-number", questionNumber);

    // Render Latex to questionBox Div
    window.api.render_maths(
        questionObject.body.latex,
        questionBox.get(0),
        { throwOnError: false }
    );

    // Get the answer box field (input bit) and append that to the questionBox
    let answerBox = generateAnswerBoxDiv(questionObject.body.answer_prompt);
    questionBox.append(answerBox);

    // Attach question validation function
    questionBox
        .find(".answer-submit-button")
        .on(
            "click",
            getOnSubmitButtonPressed(
                questionBox,
                Number(questionObject.body.answer)
            )

        );
    
    console.log(questionBox);
    return questionBox;
};



const getQuestions = async () => {
    const questionsList = await window.api.getQuestionsFromBackend()
    console.log(`Got questions ${questionsList.length}`);
    return questionsList
}

onPracticeBtnPress = async () => {
    console.log("Generating questions ...");
    // Get div with id #questions-holder, empty all child nodes if it had already had questions
    let questionHolder = $("#questions-holder").empty(); 

    questionList = await getQuestions();
    console.log(`questionList ${questionList.length}`);
 

    // For each questionObject (from json file) create a questionBox then attach it the questions-holder div
    questionList.forEach((questionObject) => {
        questionBox = getQuestionBox(questionObject);
        questionHolder.append(questionBox);
    });

};


onQuizBtnPress = async () => {
    console.log("Generating questions ...");
    // Get div with id #questions-holder, empty all child nodes if it had already had questions
    let questionHolder = $("#questions-holder").empty();

    questionList = await getQuestions();
    console.log(`questionList ${questionList.length}`);

    // For each questionObject (from json file) create a questionBox then attach it the questions-holder div
    questionList.forEach((questionObject) => {
        questionBox = getQuestionBox(questionObject);
        questionHolder.append(questionBox);
    });
};



let practiceBtn = $("#practice-btn");
practiceBtn.on("click", onPracticeBtnPress);

let quizBtn = $("#quiz-btn");
quizBtn.on("click", onQuizBtnPress);


getQuestionSelect = (tags) => {
    let questionSelect = $("<div>")
        .addClass("block")
        .attr("id", "select-questions");

    tags.forEach((tagString) => {
        let label = $("<label>")
            .addClass("checkbox")
            .append($("<input>").attr("type", "checkbox"))
            .append(" " + tagString);
        questionSelect.append(label);
        questionSelect.append($("<br>"));
    });

    return questionSelect;
};

// Fix this jank-ey animation
tags = [
    "Determinants",
    "Gaussian Elimination",
    "Rotation Matrices",
    "Eigen Vectors",
];

onSelectQuestionsButton = () => {
    let main_menu = $("#main-menu");
    let question_select = $("#select-questions");

    if ((question_select).is(':animated')){
        // If its still animating, then we shouldn't interrupt it now should we?
        return;
    }

    if (question_select.length == 0) {
        question_select = getQuestionSelect(tags);
        question_select.hide();
        main_menu.append(question_select);
    }

    let heightDiff = tags.length * 25;
    let currHeight = question_select.height();
    if (!question_select.is(":visible")) {
        // Slide down the menu
        main_menu
            .animate({
                height: currHeight + heightDiff,
                easing: "ease-in",
            })
            .promise()
            .done(
                // After its slid down, fade in the text
                question_select.fadeIn(1350)
            );
    } else {
        // Fade out text
        question_select.fadeOut()
            .promise()
            .done(
            // After text is faded out slide up the menu
            main_menu.animate({
                height: currHeight - heightDiff,
                easing: "ease-in",
            })
        );
    }
};

$("#select-questions-btn").on("click", onSelectQuestionsButton);

$("#refresh-electron-app").on("click", window.reload);

