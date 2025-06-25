// Task Management System
class TaskManager {
  constructor() {
    this.tasks = [];
    this.folders = [];
    this.currentFilter = 'all';
    this.currentView = 'list';
    this.currentFolder = null;
    this.searchQuery = '';
    this.sortBy = 'dueDate';
    this.currentDate = new Date();
    this.selectedTasks = new Set();
    
    this.initializeApp();
    this.setupEventListeners();
  }

  // Initialize the application
  initializeApp() {
    this.loadData();
    this.renderFolders();
    this.renderTasks();
    this.updateCalendar();
    this.updateStats();
    this.loadTheme();
  }

  // Load data from localStorage
  loadData() {
    this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    this.folders = JSON.parse(localStorage.getItem('folders')) || [
      { id: 'work', name: 'Work', color: '#3b82f6', count: 0 },
      { id: 'personal', name: 'Personal', color: '#10b981', count: 0 },
      { id: 'shopping', name: 'Shopping', color: '#f59e0b', count: 0 }
    ];
  }

  // Save data to localStorage
  saveData() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
    localStorage.setItem('folders', JSON.stringify(this.folders));
  }

  // Setup all event listeners
  setupEventListeners() {
    // Navigation
    document.getElementById('search-toggle').addEventListener('click', () => this.toggleSearch());
    document.getElementById('search-close').addEventListener('click', () => this.toggleSearch());
    document.getElementById('search-input').addEventListener('input', (e) => this.handleSearch(e.target.value));
    document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());

    // Task management
    document.getElementById('add-task-btn').addEventListener('click', () => this.openTaskModal());
    document.getElementById('add-folder-btn').addEventListener('click', () => this.openFolderModal());

    // Modals
    document.getElementById('modal-close').addEventListener('click', () => this.closeTaskModal());
    document.getElementById('modal-cancel').addEventListener('click', () => this.closeTaskModal());
    document.getElementById('folder-modal-close').addEventListener('click', () => this.closeFolderModal());
    document.getElementById('folder-modal-cancel').addEventListener('click', () => this.closeFolderModal());
    document.getElementById('overlay').addEventListener('click', () => this.closeAllModals());

    // Forms
    document.getElementById('task-form').addEventListener('submit', (e) => this.handleTaskSubmit(e));
    document.getElementById('folder-form').addEventListener('submit', (e) => this.handleFolderSubmit(e));

    // Filters and views
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => this.setFilter(btn.dataset.filter));
    });

    document.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => this.setView(btn.dataset.view));
    });

    // Sorting
    document.getElementById('sort-select').addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.renderTasks();
    });

    // Calendar navigation
    document.getElementById('prev-month').addEventListener('click', () => this.previousMonth());
    document.getElementById('next-month').addEventListener('click', () => this.nextMonth());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));

    // Color picker
    document.querySelectorAll('.color-option').forEach(option => {
      option.addEventListener('click', () => this.selectColor(option));
    });
  }

  // Search functionality
  toggleSearch() {
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('search-input');
    
    searchContainer.classList.toggle('active');
    if (searchContainer.classList.contains('active')) {
      searchInput.focus();
    } else {
      this.searchQuery = '';
      searchInput.value = '';
      this.renderTasks();
    }
  }

  handleSearch(query) {
    this.searchQuery = query.toLowerCase();
    this.renderTasks();
  }

  // Theme management
  loadTheme() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
      document.body.classList.add('dark');
      document.getElementById('theme-toggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
  }

  toggleTheme() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('darkMode', isDark);
    
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    
    themeToggle.style.transform = 'rotate(360deg)';
    setTimeout(() => {
      themeToggle.style.transform = 'rotate(0deg)';
    }, 300);
  }

  // Task management
  openTaskModal(taskId = null) {
    const modal = document.getElementById('task-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('task-form');
    
    if (taskId) {
      const task = this.tasks.find(t => t.id === taskId);
      if (task) {
        modalTitle.textContent = 'Edit Task';
        this.populateTaskForm(task);
        form.dataset.taskId = taskId;
      }
    } else {
      modalTitle.textContent = 'Add New Task';
      form.reset();
      delete form.dataset.taskId;
    }
    
    this.populateFolderSelect();
    this.showModal(modal);
  }

  closeTaskModal() {
    this.hideModal(document.getElementById('task-modal'));
  }

  populateTaskForm(task) {
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description || '';
    document.getElementById('task-folder').value = task.folderId || '';
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-due-date').value = task.dueDate || '';
    document.getElementById('task-reminder').value = task.reminder || '';
    document.getElementById('task-recurring').value = task.recurring || '';
  }

  populateFolderSelect() {
    const select = document.getElementById('task-folder');
    select.innerHTML = '<option value="">No Folder</option>';
    
    this.folders.forEach(folder => {
      const option = document.createElement('option');
      option.value = folder.id;
      option.textContent = folder.name;
      select.appendChild(option);
    });
  }

  handleTaskSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const taskData = {
      id: e.target.dataset.taskId || this.generateId(),
      title: formData.get('task-title'),
      description: formData.get('task-description'),
      folderId: formData.get('task-folder'),
      priority: formData.get('task-priority'),
      dueDate: formData.get('task-due-date'),
      reminder: formData.get('task-reminder'),
      recurring: formData.get('task-recurring'),
      completed: false,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Validate required fields
    if (!taskData.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    if (e.target.dataset.taskId) {
      // Update existing task
      const index = this.tasks.findIndex(t => t.id === e.target.dataset.taskId);
      if (index !== -1) {
        this.tasks[index] = { ...this.tasks[index], ...taskData };
      }
    } else {
      // Add new task
      this.tasks.unshift(taskData);
    }

    this.saveData();
    this.renderTasks();
    this.updateCalendar();
    this.updateStats();
    this.renderFolders(); // Update folder counts
    this.closeTaskModal();
    
    // Show success feedback
    console.log('Task saved:', taskData);
  }

  // Folder management
  openFolderModal() {
    // Set default color selection
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
    document.querySelector('.color-option[data-color="#3b82f6"]').classList.add('selected');
    
    this.showModal(document.getElementById('folder-modal'));
  }

  closeFolderModal() {
    this.hideModal(document.getElementById('folder-modal'));
  }

  handleFolderSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const selectedColor = document.querySelector('.color-option.selected')?.dataset.color || '#3b82f6';
    
    const folderName = formData.get('folder-name');
    
    // Validate folder name
    if (!folderName.trim()) {
      alert('Please enter a folder name');
      return;
    }
    
    // Check if folder name already exists
    if (this.folders.some(f => f.name.toLowerCase() === folderName.toLowerCase())) {
      alert('A folder with this name already exists');
      return;
    }
    
    const folderData = {
      id: this.generateId(),
      name: folderName.trim(),
      color: selectedColor,
      count: 0
    };

    this.folders.push(folderData);
    this.saveData();
    this.renderFolders();
    this.closeFolderModal();
    e.target.reset();
    
    // Reset color selection
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
    document.querySelector('.color-option[data-color="#3b82f6"]').classList.add('selected');
    
    console.log('Folder created:', folderData);
  }

  selectColor(option) {
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
    option.classList.add('selected');
  }

  // Filtering and sorting
  setFilter(filter) {
    this.currentFilter = filter;
    this.currentFolder = null;
    
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    document.querySelectorAll('.folder-item').forEach(item => item.classList.remove('active'));
    
    this.updateViewTitle();
    this.renderTasks();
  }

  setView(view) {
    this.currentView = view;
    
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    
    document.getElementById('task-container').style.display = view === 'list' ? 'block' : 'none';
    document.getElementById('calendar-container').style.display = view === 'calendar' ? 'block' : 'none';
    
    if (view === 'calendar') {
      this.updateCalendar();
    }
  }

  // Task rendering
  renderTasks() {
    const taskList = document.getElementById('task-list');
    const filteredTasks = this.getFilteredTasks();
    const sortedTasks = this.sortTasks(filteredTasks);
    
    if (sortedTasks.length === 0) {
      taskList.innerHTML = this.getEmptyStateHTML();
      return;
    }
    
    taskList.innerHTML = sortedTasks.map(task => this.createTaskHTML(task)).join('');
    this.setupTaskEventListeners();
  }

  getFilteredTasks() {
    let filtered = this.tasks;
    
    // Apply search filter
    if (this.searchQuery) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(this.searchQuery) ||
        task.description.toLowerCase().includes(this.searchQuery)
      );
    }
    
    // Apply main filter
    switch (this.currentFilter) {
      case 'today':
        filtered = filtered.filter(task => this.isToday(task.dueDate) && !task.archived);
        break;
      case 'upcoming':
        filtered = filtered.filter(task => this.isUpcoming(task.dueDate) && !task.archived);
        break;
      case 'completed':
        filtered = filtered.filter(task => task.completed && !task.archived);
        break;
      case 'archived':
        filtered = filtered.filter(task => task.archived);
        break;
      case 'all':
      default:
        // For "all" view, exclude archived tasks
        filtered = filtered.filter(task => !task.archived);
        break;
    }
    
    // Apply folder filter (only if not viewing archived tasks)
    if (this.currentFolder && this.currentFilter !== 'archived') {
      filtered = filtered.filter(task => task.folderId === this.currentFolder);
    }
    
    return filtered;
  }

  sortTasks(tasks) {
    return tasks.sort((a, b) => {
      switch (this.sortBy) {
        case 'priority':
          return this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority);
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'dueDate':
        default:
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
      }
    });
  }

  getPriorityWeight(priority) {
    const weights = { low: 1, medium: 2, high: 3 };
    return weights[priority] || 2;
  }

  createTaskHTML(task) {
    const folder = this.folders.find(f => f.id === task.folderId);
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
    
    return `
      <div class="task-item ${task.completed ? 'completed' : ''} ${task.archived ? 'archived' : ''}" data-task-id="${task.id}">
        <div class="task-header">
          <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
          <div class="task-content">
            <div class="task-title">${this.escapeHtml(task.title)}</div>
            ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
            <div class="task-meta">
              <span class="task-priority ${task.priority}">${task.priority}</span>
              ${folder ? `<span class="task-folder" style="background-color: ${folder.color}20; color: ${folder.color}">
                <i class="fas fa-folder"></i> ${folder.name}
              </span>` : ''}
              ${task.dueDate ? `<span class="task-due-date ${isOverdue ? 'overdue' : ''}">
                <i class="fas fa-calendar"></i> ${this.formatDate(task.dueDate)}
              </span>` : ''}
            </div>
      </div>
      <div class="task-actions">
            <button class="edit-btn" title="Edit task">
              <i class="fas fa-edit"></i>
            </button>
            <button class="archive-btn" title="${task.archived ? 'Unarchive' : 'Archive'} task">
              <i class="fas fa-${task.archived ? 'inbox' : 'archive'}"></i>
            </button>
            <button class="delete-btn" title="Delete task">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  setupTaskEventListeners() {
    document.querySelectorAll('.task-item').forEach(taskEl => {
      const taskId = taskEl.dataset.taskId;
      const checkbox = taskEl.querySelector('.task-checkbox');
      const editBtn = taskEl.querySelector('.edit-btn');
      const archiveBtn = taskEl.querySelector('.archive-btn');
      const deleteBtn = taskEl.querySelector('.delete-btn');

      checkbox.addEventListener('change', () => this.toggleTaskComplete(taskId));
      editBtn.addEventListener('click', () => this.openTaskModal(taskId));
      archiveBtn.addEventListener('click', () => this.toggleTaskArchive(taskId));
      deleteBtn.addEventListener('click', () => this.deleteTask(taskId));
    });
  }

  // Task actions
  toggleTaskComplete(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      task.updatedAt = new Date().toISOString();
      this.saveData();
      this.renderTasks();
      this.updateCalendar();
      this.updateStats();
    }
  }

  toggleTaskArchive(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      const wasArchived = task.archived;
      task.archived = !task.archived;
      task.updatedAt = new Date().toISOString();
      
      this.saveData();
      this.renderTasks();
      this.updateCalendar();
      this.updateStats();
      this.renderFolders(); // Update folder counts
      
      // Show user feedback
      const action = task.archived ? 'archived' : 'unarchived';
      console.log(`Task "${task.title}" ${action}`);
      
      // If we're not in the archived view and we just archived a task, 
      // it should disappear from the current view
      if (task.archived && this.currentFilter !== 'archived') {
        // The task will be removed from view due to the filtering logic
      }
    }
  }

  deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.tasks = this.tasks.filter(t => t.id !== taskId);
      this.saveData();
      this.renderTasks();
      this.updateCalendar();
      this.updateStats();
    }
  }

  // Folder rendering
  renderFolders() {
    const folderList = document.getElementById('folder-list');
    folderList.innerHTML = this.folders.map(folder => {
      const count = this.tasks.filter(task => task.folderId === folder.id && !task.archived).length;
      return `
        <div class="folder-item" data-folder-id="${folder.id}">
          <div class="folder-color" style="background-color: ${folder.color}"></div>
          <span class="folder-name">${folder.name}</span>
          <span class="folder-count">${count}</span>
        </div>
      `;
    }).join('');

    // Add folder click listeners
    document.querySelectorAll('.folder-item').forEach(item => {
      item.addEventListener('click', () => {
        this.currentFolder = item.dataset.folderId;
        this.currentFilter = 'all';
        
        document.querySelectorAll('.folder-item').forEach(f => f.classList.remove('active'));
        document.querySelectorAll('.filter-btn').forEach(f => f.classList.remove('active'));
        document.querySelector('[data-filter="all"]').classList.add('active');
        
        item.classList.add('active');
        this.updateViewTitle();
        this.renderTasks();
      });
    });
  }

  // Calendar functionality
  updateCalendar() {
    const currentMonth = document.getElementById('current-month');
    const calendarGrid = document.getElementById('calendar-grid');
    
    currentMonth.textContent = this.currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    calendarGrid.innerHTML = this.generateCalendarHTML();
    this.setupCalendarEventListeners();
  }

  generateCalendarHTML() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    let html = '';
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isOtherMonth = date.getMonth() !== month;
      const isToday = this.isSameDate(date, today);
      const dayTasks = this.getTasksForDate(date);
      
      html += `
        <div class="calendar-day ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}" data-date="${date.toISOString().split('T')[0]}">
          <div class="calendar-day-number">${date.getDate()}</div>
          <div class="calendar-tasks">
            ${dayTasks.slice(0, 3).map(task => `
              <div class="calendar-task" data-task-id="${task.id}" title="${task.title}">
                ${task.title}
              </div>
            `).join('')}
            ${dayTasks.length > 3 ? `<div class="calendar-task">+${dayTasks.length - 3} more</div>` : ''}
          </div>
        </div>
      `;
    }
    
    return html;
  }

  setupCalendarEventListeners() {
    document.querySelectorAll('.calendar-day').forEach(day => {
      day.addEventListener('click', () => {
        const date = day.dataset.date;
        this.filterByDate(date);
      });
    });

    document.querySelectorAll('.calendar-task').forEach(task => {
      task.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openTaskModal(task.dataset.taskId);
      });
    });
  }

  filterByDate(date) {
    this.currentFilter = 'all';
    this.currentFolder = null;
    
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-filter="all"]').classList.add('active');
    document.querySelectorAll('.folder-item').forEach(item => item.classList.remove('active'));
    
    this.updateViewTitle();
    this.renderTasks();
    
    // Highlight the selected date in calendar
    document.querySelectorAll('.calendar-day').forEach(day => day.classList.remove('selected'));
    document.querySelector(`[data-date="${date}"]`).classList.add('selected');
  }

  previousMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.updateCalendar();
  }

  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.updateCalendar();
  }

  // Utility functions
  getTasksForDate(date) {
    return this.tasks.filter(task => 
      task.dueDate && this.isSameDate(new Date(task.dueDate), date) && !task.archived
    );
  }

  isSameDate(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  isToday(dateString) {
    if (!dateString) return false;
    return this.isSameDate(new Date(dateString), new Date());
  }

  isUpcoming(dateString) {
    if (!dateString) return false;
    const today = new Date();
    const dueDate = new Date(dateString);
    return dueDate > today;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (this.isSameDate(date, today)) return 'Today';
    if (this.isSameDate(date, tomorrow)) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  updateViewTitle() {
    const title = document.getElementById('current-view-title');
    let viewTitle = 'All Tasks';
    
    if (this.currentFolder) {
      const folder = this.folders.find(f => f.id === this.currentFolder);
      viewTitle = folder ? folder.name : 'Unknown Folder';
  } else {
      const filterLabels = {
        today: 'Today',
        upcoming: 'Upcoming',
        completed: 'Completed',
        archived: 'Archived'
      };
      viewTitle = filterLabels[this.currentFilter] || 'All Tasks';
    }
    
    title.textContent = viewTitle;
  }

  updateStats() {
    const activeTasks = this.tasks.filter(t => !t.archived);
    const completedTasks = this.tasks.filter(t => t.completed && !t.archived);
    const archivedTasks = this.tasks.filter(t => t.archived);
    
    let displayText = '';
    
    if (this.currentFilter === 'archived') {
      displayText = `${archivedTasks.length} archived task${archivedTasks.length !== 1 ? 's' : ''}`;
    } else {
      displayText = `${activeTasks.length} task${activeTasks.length !== 1 ? 's' : ''}`;
      if (completedTasks.length > 0) {
        displayText += ` (${completedTasks.length} completed)`;
      }
    }
    
    document.getElementById('task-count').textContent = displayText;
  }

  getEmptyStateHTML() {
    const messages = {
      all: 'No tasks yet. Create your first task to get started!',
      today: 'No tasks due today. Enjoy your day!',
      upcoming: 'No upcoming tasks. You\'re all caught up!',
      completed: 'No completed tasks yet.',
      archived: 'No archived tasks.'
    };
    
    const message = messages[this.currentFilter] || messages.all;
    const showAddButton = this.currentFilter !== 'archived' && this.currentFilter !== 'completed';
    
    return `
      <div class="empty-state">
        <div class="empty-icon">
          <i class="fas fa-clipboard-list"></i>
        </div>
        <h3>No Tasks Found</h3>
        <p>${message}</p>
        ${showAddButton ? `
          <button class="btn-primary" onclick="taskManager.openTaskModal()">
            <i class="fas fa-plus"></i>
            <span>Add Your First Task</span>
          </button>
        ` : ''}
      </div>
    `;
  }

  // Modal management
  showModal(modal) {
    document.getElementById('overlay').classList.add('active');
    modal.classList.add('active');
  }

  hideModal(modal) {
    modal.classList.remove('active');
    document.getElementById('overlay').classList.remove('active');
  }

  closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
      modal.classList.remove('active');
    });
    document.getElementById('overlay').classList.remove('active');
  }

  // Keyboard shortcuts
  handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'n':
          e.preventDefault();
          this.openTaskModal();
          break;
        case 'f':
          e.preventDefault();
          this.toggleSearch();
          break;
        case 'k':
          e.preventDefault();
          this.toggleTheme();
          break;
      }
    }
    
    if (e.key === 'Escape') {
      this.closeAllModals();
      this.toggleSearch();
    }
  }

  // Utility functions
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the application
const taskManager = new TaskManager(); 