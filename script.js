document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector, root = document) =>
    root.querySelector(selector);

  // =====================================
  // 1. MOBILE MENU
  // =====================================
  const menuBtn = $("#menuBtn");
  const navLinks = $("#navLinks");

  if (menuBtn && navLinks) {
    menuBtn.setAttribute("aria-expanded", "false");

    menuBtn.addEventListener("click", () => {
      const open = navLinks.classList.toggle("open");
      menuBtn.textContent = open ? "✕" : "☰";
      menuBtn.setAttribute("aria-expanded", String(open));
    });

    navLinks.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("open");
        menuBtn.textContent = "☰";
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  // =====================================
  // 2. COPYRIGHT YEAR
  // =====================================
  document.querySelectorAll(".year").forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  // =====================================
  // 3. LIVE CLOCK AND DATE
  // =====================================
  const clock = $("#liveClock");
  const date = $("#liveDate");

  function updateClock() {
    const now = new Date();

    if (clock) {
      clock.textContent = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
    }

    if (date) {
      date.textContent = now.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    }
  }

  updateClock();
  if (clock || date) {
    setInterval(updateClock, 1000);
  }

  // =====================================
  // 4. NOTES SEARCH AND FILTERS
  // =====================================
  const search = $("[data-search]");
  const list = search
    ? document.getElementById(search.dataset.search)
    : null;
  const emptyState = $("#emptyState");

  let category = "all";

  function updateNotes() {
    if (!search || !list) return;

    let visible = 0;
    const query = search.value.trim().toLowerCase();

    list.querySelectorAll(".searchable").forEach(card => {
      const textMatch = card.textContent.toLowerCase().includes(query);
      const categoryMatch =
        category === "all" || card.dataset.category === category;

      card.hidden = !(textMatch && categoryMatch);

      if (!card.hidden) visible++;
    });

    if (emptyState) {
      emptyState.hidden = visible > 0;
    }
  }

  if (search) search.addEventListener("input", updateNotes);

  document.querySelectorAll("[data-filters]").forEach(group => {
    group.querySelectorAll("[data-filter]").forEach(button => {
      button.addEventListener("click", () => {
        category = button.dataset.filter;

        group.querySelectorAll("[data-filter]").forEach(item => {
          const active = item === button;
          item.classList.toggle("selected", active);
          item.setAttribute("aria-pressed", String(active));
        });

        updateNotes();
      });
    });
  });

  // =====================================
  // 5. PERSONAL STUDY GOAL
  // =====================================
  const goalSelect = $("#goalSelect");
  const saveGoal = $("#saveGoal");
  const addStudy = $("#addStudy");
  const resetStudy = $("#resetStudy");
  const goalProgress = $("#goalProgress");
  const goalText = $("#goalText");

  const today = new Date();
  const dateKey = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  function readStored(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? fallback : JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function store(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  const savedStudy = readStored("cwm-study", {});
  let studyMinutes =
    savedStudy.date === dateKey &&
    Number.isFinite(savedStudy.minutes)
      ? Math.max(0, savedStudy.minutes)
      : 0;

  let studyGoal = [30, 60, 90, 120].includes(savedStudy.goal)
    ? savedStudy.goal
    : 60;

  function saveStudy() {
    store("cwm-study", {
      date: dateKey,
      minutes: studyMinutes,
      goal: studyGoal
    });
  }

  function renderGoal() {
    if (!goalText || !goalProgress) return;

    const percent = Math.min(100, studyMinutes / studyGoal * 100);

    goalProgress.style.width = percent + "%";
    goalText.textContent =
      `${studyMinutes} of ${studyGoal} minutes completed` +
      (studyMinutes >= studyGoal ? " — Goal achieved! 🎉" : "");

    goalProgress.setAttribute("role", "progressbar");
    goalProgress.setAttribute("aria-valuemin", "0");
    goalProgress.setAttribute("aria-valuemax", "100");
    goalProgress.setAttribute("aria-valuenow", String(Math.round(percent)));
  }

  if (goalSelect) goalSelect.value = String(studyGoal);

  if (saveGoal) {
    saveGoal.addEventListener("click", () => {
      studyGoal = Number(goalSelect.value);
      saveStudy();
      renderGoal();
    });
  }

  if (addStudy) {
    addStudy.addEventListener("click", () => {
      studyMinutes += 15;
      saveStudy();
      renderGoal();
    });
  }

  if (resetStudy) {
    resetStudy.addEventListener("click", () => {
      studyMinutes = 0;
      saveStudy();
      renderGoal();
    });
  }

  renderGoal();

  // =====================================
  // 6. PERSONAL STUDY PLANNER
  // =====================================
  const taskForm = $("#taskForm");
  const taskInput = $("#taskInput");
  const taskList = $("#taskList");
  const taskCount = $("#taskCount");
  const taskEmpty = $("#taskEmpty");
  const clearCompleted = $("#clearCompleted");

  const storedTasks = readStored("cwm-tasks", []);
  let tasks = Array.isArray(storedTasks)
    ? storedTasks.filter(task =>
        task &&
        typeof task.id === "string" &&
        typeof task.text === "string" &&
        typeof task.done === "boolean"
      )
    : [];

  // Use textContent instead of injecting user text as HTML.
  function renderTasks() {
    if (!taskList) return;

    taskList.replaceChildren();

    tasks.forEach(task => {
      const li = document.createElement("li");
      li.className = "task-item" + (task.done ? " done" : "");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.done;
      checkbox.id = "task-" + task.id;
      checkbox.setAttribute("aria-label", "Complete " + task.text);

      checkbox.addEventListener("change", () => {
        task.done = checkbox.checked;
        store("cwm-tasks", tasks);
        renderTasks();
      });

      const label = document.createElement("label");
      label.htmlFor = checkbox.id;
      label.textContent = task.text;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "delete-task";
      remove.textContent = "Delete";
      remove.setAttribute("aria-label", "Delete " + task.text);

      remove.addEventListener("click", () => {
        tasks = tasks.filter(item => item.id !== task.id);
        store("cwm-tasks", tasks);
        renderTasks();
      });

      li.append(checkbox, label, remove);
      taskList.append(li);
    });

    const doneCount = tasks.filter(task => task.done).length;

    if (taskCount) {
      taskCount.textContent =
        `${doneCount}/${tasks.length} tasks completed`;
    }

    if (taskEmpty) taskEmpty.hidden = tasks.length !== 0;
  }

  if (taskForm && taskInput) {
    taskForm.addEventListener("submit", event => {
      event.preventDefault();

      const text = taskInput.value.trim();
      if (!text) return;

      tasks.push({
        id: Date.now().toString() + "-" + Math.random().toString(36).slice(2, 8),
        text,
        done: false
      });

      store("cwm-tasks", tasks);
      taskInput.value = "";
      renderTasks();
      taskInput.focus();
    });
  }

  if (clearCompleted) {
    clearCompleted.addEventListener("click", () => {
      tasks = tasks.filter(task => !task.done);
      store("cwm-tasks", tasks);
      renderTasks();
    });
  }

  renderTasks();

  // =====================================
  // 7. INTERACTIVE CODING QUIZ
  // =====================================
  const quizApp = $("#quizApp");

  const questions = [
    {
      question: "Which keyword defines a function in Python?",
      options: ["func", "def", "function", "define"],
      answer: 1,
      explanation: "Python functions are declared using the def keyword."
    },
    {
      question: "Which data type stores True or False?",
      options: ["String", "Integer", "Boolean", "List"],
      answer: 2,
      explanation: "Boolean values represent True or False."
    },
    {
      question: "Which HTML tag creates a hyperlink?",
      options: ["<link>", "<href>", "<a>", "<url>"],
      answer: 2,
      explanation: "The anchor tag <a> creates a hyperlink."
    },
    {
      question: "Which CSS property changes text colour?",
      options: ["font-style", "color", "background", "text-size"],
      answer: 1,
      explanation: "Use the color property to change text colour."
    },
    {
      question: "What does AI stand for?",
      options: [
        "Automated Internet",
        "Artificial Intelligence",
        "Advanced Input",
        "Applied Interface"
      ],
      answer: 1,
      explanation: "AI stands for Artificial Intelligence."
    },
    {
      question: "Which Python library is widely used for tabular data?",
      options: ["Pandas", "Turtle", "Random", "Tkinter"],
      answer: 0,
      explanation: "Pandas provides tools for working with tabular data."
    }
  ];

  let questionIndex = 0;
  let score = 0;
  let answered = false;

  function quizButton(text, className, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = text;
    button.addEventListener("click", onClick);
    return button;
  }

  function renderQuiz() {
    if (!quizApp) return;

    quizApp.replaceChildren();

    if (questionIndex >= questions.length) {
      const result = document.createElement("div");
      result.className = "quiz-result";

      const title = document.createElement("h3");
      title.textContent = "Quiz completed!";

      const scoreText = document.createElement("strong");
      scoreText.textContent = `${score}/${questions.length}`;

      const message = document.createElement("p");
      message.className = "quiz-feedback";
      message.textContent = score === questions.length
        ? "Perfect score! Excellent work."
        : "Keep practising. You can try again to improve your score.";

      const restart = quizButton(
        "Try Again ↻",
        "btn primary",
        () => {
          questionIndex = 0;
          score = 0;
          answered = false;
          renderQuiz();
        }
      );

      result.append(title, scoreText, message, restart);
      quizApp.append(result);
      return;
    }

    const q = questions[questionIndex];

    const progress = document.createElement("p");
    progress.className = "quiz-progress";
    progress.textContent =
      `Question ${questionIndex + 1} of ${questions.length} · Score ${score}`;

    const bar = document.createElement("div");
    bar.className = "progress-track";

    const fill = document.createElement("div");
    fill.className = "progress-fill";
    fill.style.width = `${questionIndex / questions.length * 100}%`;
    bar.append(fill);

    const question = document.createElement("h3");
    question.className = "quiz-question";
    question.textContent = q.question;

    const options = document.createElement("div");
    options.className = "quiz-options";

    const feedback = document.createElement("p");
    feedback.className = "quiz-feedback";
    feedback.setAttribute("aria-live", "polite");

    const actions = document.createElement("div");
    actions.className = "quiz-actions";

    const next = quizButton(
      questionIndex === questions.length - 1
        ? "See Results →"
        : "Next Question →",
      "btn primary",
      () => {
        if (!answered) return;
        questionIndex++;
        answered = false;
        renderQuiz();
      }
    );

    next.disabled = true;

    q.options.forEach((option, index) => {
      const button = quizButton(
        `${String.fromCharCode(65 + index)}. ${option}`,
        "quiz-option",
        () => {
          if (answered) return;

          answered = true;
          const correct = index === q.answer;

          if (correct) score++;

          options.querySelectorAll("button").forEach((item, i) => {
            item.disabled = true;

            if (i === q.answer) item.classList.add("correct");
            if (i === index && !correct) item.classList.add("incorrect");
          });

          feedback.textContent = correct
            ? "Correct! " + q.explanation
            : "Not quite. " + q.explanation;

          progress.textContent =
            `Question ${questionIndex + 1} of ${questions.length} · Score ${score}`;

          next.disabled = false;
        }
      );

      options.append(button);
    });

    actions.append(next);
    quizApp.append(progress, bar, question, options, feedback, actions);
  }

  renderQuiz();
});