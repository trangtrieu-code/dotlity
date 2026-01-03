(function () {
  // Flow: 1) Storage + DOM  2) Load/Save  3) Render list  4) Add task  5) Edit task
  //       6) Toggle + Delete (inside render)  7) Wire events + initial render

  // ----- 1. Constants and DOM refs -----
  const STORAGE_KEY = 'dotlity-todo';

  const todoInput = document.getElementById('todoInput');
  const todoAddBtn = document.getElementById('todoAddBtn');
  const todoList = document.getElementById('todoList');
  const todoEmpty = document.getElementById('todoEmpty');

  if (!todoList || !todoEmpty) return;

  // ----- 2. Load from / save to localStorage -----
  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }

  function saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {}
  }

  // ----- 3. Render list (and empty state) -----
  function render() {
    const tasks = loadTasks();
    todoList.innerHTML = '';

    if (tasks.length === 0) {
      todoEmpty.classList.remove('hidden');
      return;
    }

    todoEmpty.classList.add('hidden');

    // Render tasks
    tasks.forEach(function (task) {
      // Task item
      const item = document.createElement('div');
      item.className = 'todo-item flex items-center gap-2 py-1.5';
      item.setAttribute('data-id', task.id);

      // Checkbox
      const check = document.createElement('button');
      check.type = 'button';
      check.className = 'todo-check flex-shrink-0 p-0.5 rounded text-slate-400 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary';
      check.setAttribute('aria-label', task.done ? 'Mark incomplete' : 'Mark complete');
      check.innerHTML = task.done
        ? '<span class="material-symbols-outlined text-lg" style="font-variation-settings:\'FILL\' 1">check_circle</span>'
        : '<span class="material-symbols-outlined text-lg">radio_button_unchecked</span>';
      check.addEventListener('click', function () {
        const list = loadTasks();
        const idx = list.findIndex(function (t) { return t.id === task.id; });
        if (idx !== -1) {
          list[idx].done = !list[idx].done;
          saveTasks(list);
          render();
        }
      });

      // Task text wrap
      const textWrap = document.createElement('div');
      textWrap.className = 'todo-text-wrap flex-1 min-w-0';

      // Task text
      const textSpan = document.createElement('span');
      textSpan.className = 'todo-text block truncate text-sm text-slate-800 dark:text-slate-100 cursor-text select-text';
      if (task.done) textSpan.classList.add('line-through', 'text-slate-500', 'dark:text-slate-400');
      textSpan.textContent = task.text;
      textSpan.addEventListener('dblclick', function () {
        startEdit(task, textWrap, textSpan);
      });
      textWrap.appendChild(textSpan);

      // Delete
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'todo-delete flex-shrink-0 p-0.5 rounded text-slate-400 hover:text-red-500 focus:outline-none';
      delBtn.setAttribute('aria-label', 'Delete task');
      delBtn.innerHTML = '<span class="material-symbols-outlined text-sm">close</span>';
      delBtn.addEventListener('click', function () {
        const list = loadTasks().filter(function (t) { return t.id !== task.id; });
        saveTasks(list);
        render();
      });

      item.appendChild(check);
      item.appendChild(textWrap);
      item.appendChild(delBtn);
      todoList.appendChild(item);
    });
  }

  // ----- 4. Add new task -----
  function addTask() {
    const text = (todoInput && todoInput.value) ? todoInput.value.trim() : '';
    if (text === '') return;
    const tasks = loadTasks();
    tasks.push({ id: 'todo-' + Date.now(), text: text, done: false });
    saveTasks(tasks);
    if (todoInput) todoInput.value = '';
    render();
  }

  // Edit task
  function startEdit(task, textWrap, textSpan) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'todo-edit-input w-full px-2 py-1 text-sm rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-primary outline-none';
    input.value = task.text;
    input.setAttribute('data-id', task.id);

    // Save edited task
    function saveEdit() {
      const newText = input.value.trim();
      const list = loadTasks();
      const idx = list.findIndex(function (t) { return t.id === task.id; });
      if (idx === -1) return;
      if (newText === '') {
        list.splice(idx, 1);
      } else {
        list[idx].text = newText;
      }
      saveTasks(list);
      if (textWrap.contains(input)) {
        textWrap.removeChild(input);
        textWrap.appendChild(textSpan);
      }
      render();
    }

    // Cancel edit
    function cancelEdit() {
      if (textWrap.contains(input)) {
        textWrap.removeChild(input);
        textWrap.appendChild(textSpan);
      }
    }

    // Save edited task on blur
    input.addEventListener('blur', saveEdit);
    // Save edited task on Enter
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.blur();
      }
      if (e.key === 'Escape') cancelEdit();
    });

    textWrap.removeChild(textSpan);
    textWrap.appendChild(input);
    input.focus();
    input.select();
  }

  //Wire events
  if (todoAddBtn) todoAddBtn.addEventListener('click', addTask);
  if (todoInput) {
    todoInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') addTask();
    });
  }

  // Render the initial list
  render();
})();
