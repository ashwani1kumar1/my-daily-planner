
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }
  
 
  function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function(...args) {
      if (!lastRan) {
        func.apply(this, args);
        lastRan = Date.now();
      } else {
        clearTimeout(lastFunc);
        lastFunc = setTimeout(() => {
          if ((Date.now() - lastRan) >= limit) {
            func.apply(this, args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    };
  }
  
 
  const STORAGE_KEY = 'daily_planner_tasks';
  

  function loadTasks() {
    const tasksStr = localStorage.getItem(STORAGE_KEY);
    try {
      return tasksStr ? JSON.parse(tasksStr) : [];
    } catch {
      return [];
    }
  }
  
 
  function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }
  
  class TaskManager {
    constructor() {
      this.tasks = loadTasks();
    }
  
    addTask(text, category) {
      const newTask = {
        id: Date.now().toString(),
        text: text.trim(),
        category,
        completed: false,
      };
      this.tasks.unshift(newTask);
      this.save();
    }
  
    toggleTaskCompletion(id) {
      this.tasks = this.tasks.map(task => 
        task.id === id ? {...task, completed: !task.completed} : task
      );
      this.save();
    }
  
    deleteTask(id) {
      this.tasks = this.tasks.filter(task => task.id !== id);
      this.save();
    }
  
    clearAll() {
      this.tasks = [];
      this.save();
    }
  
    save() {
      saveTasks(this.tasks);
    }
  
    getTasks() {
      return [...this.tasks];
    }
  }
  
  
  const newTaskInput = document.getElementById('new-task-input');
  const addTaskBtn = document.getElementById('add-task-button');
  const taskCategorySelect = document.getElementById('task-category');
  const taskListEl = document.getElementById('task-list');
  const searchBar = document.getElementById('search-bar');
  const clearAllBtn = document.getElementById('clear-all-btn');
  const backToTopBtn = document.getElementById('back-to-top');
  
  
  const taskManager = new TaskManager();
  

  function renderTasks(filter = '') {
    const tasks = taskManager.getTasks();
    taskListEl.innerHTML = '';
  
    const filteredTasks = tasks.filter(task => 
      task.text.toLowerCase().includes(filter.toLowerCase())
    );
  
    if(filteredTasks.length === 0) {
      taskListEl.innerHTML = '<li style="color:#666; padding:1rem; text-align:center;">No tasks found.</li>';
      clearAllBtn.disabled = taskManager.tasks.length === 0;
      return;
    }
  
    for (const task of filteredTasks) {
      const li = document.createElement('li');
      li.className = 'task-item';
      li.dataset.id = task.id;
      li.setAttribute('tabindex', '0');
  
      const leftDiv = document.createElement('div');
      leftDiv.className = 'task-left';
  
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.setAttribute('aria-label', `Mark task "${task.text}" as completed`);
      checkbox.addEventListener('change', () => {
        taskManager.toggleTaskCompletion(task.id);
        renderTasks(searchBar.value);
      });
  
      const spanText = document.createElement('span');
      spanText.className = 'task-text' + (task.completed ? ' completed' : '');
      spanText.textContent = task.text;
     
      spanText.addEventListener('click', () => {
        taskManager.toggleTaskCompletion(task.id);
        renderTasks(searchBar.value);
      });
      spanText.setAttribute('role', 'checkbox');
      spanText.setAttribute('aria-checked', task.completed.toString());
      spanText.tabIndex = 0;
      spanText.addEventListener('keydown', (e) => {
        if(e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          taskManager.toggleTaskCompletion(task.id);
          renderTasks(searchBar.value);
        }
      });
  
      const categoryTag = document.createElement('span');
      categoryTag.className = 'task-category-tag';
      categoryTag.textContent = task.category;
  
      leftDiv.appendChild(checkbox);
      leftDiv.appendChild(spanText);
      leftDiv.appendChild(categoryTag);
  
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'task-actions';
  
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-btn';
      deleteBtn.setAttribute('aria-label', `Delete task "${task.text}"`);
      deleteBtn.textContent = '×';
      deleteBtn.addEventListener('click', () => {
        if(confirm(`Are you sure you want to delete task:\n"${task.text}"?`)) {
          taskManager.deleteTask(task.id);
          renderTasks(searchBar.value);
        }
      });
  
      actionsDiv.appendChild(deleteBtn);
  
      li.appendChild(leftDiv);
      li.appendChild(actionsDiv);
      taskListEl.appendChild(li);
    }
    clearAllBtn.disabled = taskManager.tasks.length === 0;
  }
  
 
  document.getElementById('add-task-form').addEventListener('submit', e => {
    e.preventDefault();
    const text = newTaskInput.value.trim();
    const category = taskCategorySelect.value || 'Personal';
    if(text === '') return;
    taskManager.addTask(text, category);
    newTaskInput.value = '';
    addTaskBtn.disabled = true;
    renderTasks(searchBar.value);
    newTaskInput.focus();
  });
  
 
  newTaskInput.addEventListener('input', () => {
    addTaskBtn.disabled = newTaskInput.value.trim() === '';
  });
  
  const handleSearch = debounce(() => {
    renderTasks(searchBar.value.trim());
  }, 300);
  
  searchBar.addEventListener('input', handleSearch);
  
 
  clearAllBtn.addEventListener('click', () => {
    if(confirm('Are you sure you want to clear all tasks?')) {
      taskManager.clearAll();
      renderTasks(searchBar.value);
    }
  });
 
  function toggleBackToTop() {
    if(window.scrollY > 300) {
      backToTopBtn.style.display = 'flex';
    } else {
      backToTopBtn.style.display = 'none';
    }
  }
  window.addEventListener('scroll', throttle(toggleBackToTop, 200));
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  

  renderTasks();
  
  