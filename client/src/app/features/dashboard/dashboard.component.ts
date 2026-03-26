import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Task, TaskService } from '../../core/services/task.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { TaskCardComponent } from '../../shared/components/task-card.component';
import { isPast } from 'date-fns';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, TaskCardComponent],
  template: `
    <div class="dashboard-header animate-slide-in">
      <div class="header-content">
        <h1>Overview</h1>
        <div class="controls-bar">
          <input type="text" class="search-input" placeholder="Search tasks..." [(ngModel)]="searchQuery" (input)="distributeTasks()">
          <select class="sort-select" [(ngModel)]="sortBy" (change)="distributeTasks()">
            <option value="">Sort By...</option>
            <option value="priority-desc">Priority (High to Low)</option>
            <option value="priority-asc">Priority (Low to High)</option>
            <option value="date-asc">Date (Near to Far)</option>
            <option value="date-desc">Date (Far to Near)</option>
            <option *ngIf="currentView === 'list'" value="status-asc">Status (Todo -> Done)</option>
            <option *ngIf="currentView === 'list'" value="status-desc">Status (Done -> Todo)</option>
          </select>
        </div>
        <div class="view-toggles">
          <button class="btn" [class.btn-primary]="currentView === 'kanban'" [class.btn-outline]="currentView !== 'kanban'" (click)="setView('kanban')">Kanban</button>
          <button class="btn" [class.btn-primary]="currentView === 'list'" [class.btn-outline]="currentView !== 'list'" (click)="setView('list')">List</button>
          <button class="btn" [class.btn-primary]="currentView === 'calendar'" [class.btn-outline]="currentView !== 'calendar'" (click)="setView('calendar')">Calendar</button>
        </div>
      </div>
      
      <!-- Quick Add Bar -->
      <div class="quick-add-bar glass-panel">
        <input type="text" placeholder="Quick Add Task... (Press Enter)" [(ngModel)]="quickAddTaskTitle" (keyup.enter)="addQuickTask()">
        <button class="btn btn-primary" (click)="openNewTaskModal()">+ Full Form</button>
      </div>
      
      <div *ngIf="overdueTasksCount > 0" class="overdue-banner pulse">
        ⚠️ You have {{ overdueTasksCount }} overdue tasks!
      </div>
    </div>

    <!-- MAIN VIEWS -->
    <div class="board-wrapper animate-fade-in" *ngIf="currentView === 'kanban'">
      
      <div class="column glass-panel">
        <div class="column-header">
          <h3>To Do ( Drag and drop tasks to update their status )</h3>
          <span class="count">{{ todoTasks.length }}</span>
        </div>
        <div class="task-list" 
             id="todoList"
             cdkDropList 
             [cdkDropListData]="todoTasks"
             [cdkDropListConnectedTo]="['inProgressList', 'doneList']"
             (cdkDropListDropped)="drop($event, 'Todo')">
          <app-task-card *ngFor="let task of todoTasks" [task]="task" cdkDrag (statusChange)="onStatusChange($event)" (edit)="openEditModal($event)" (delete)="deleteTask($event)"></app-task-card>
        </div>
      </div>

      <div class="column glass-panel">
        <div class="column-header">
          <h3>In Progress</h3>
          <span class="count">{{ inProgressTasks.length }}</span>
        </div>
        <div class="task-list"
             id="inProgressList"
             cdkDropList 
             [cdkDropListData]="inProgressTasks"
             [cdkDropListConnectedTo]="['todoList', 'doneList']"
             (cdkDropListDropped)="drop($event, 'In Progress')">
          <app-task-card *ngFor="let task of inProgressTasks" [task]="task" cdkDrag (statusChange)="onStatusChange($event)" (edit)="openEditModal($event)" (delete)="deleteTask($event)"></app-task-card>
        </div>
      </div>

      <div class="column glass-panel">
        <div class="column-header">
          <h3>Done</h3>
          <span class="count">{{ doneTasks.length }}</span>
        </div>
        <div class="task-list"
             id="doneList"
             cdkDropList 
             [cdkDropListData]="doneTasks"
             [cdkDropListConnectedTo]="['todoList', 'inProgressList']"
             (cdkDropListDropped)="drop($event, 'Done')">
          <app-task-card *ngFor="let task of doneTasks" [task]="task" cdkDrag (statusChange)="onStatusChange($event)" (edit)="openEditModal($event)" (delete)="deleteTask($event)"></app-task-card>
        </div>
      </div>

    </div>

    <div class="list-wrapper animate-fade-in" *ngIf="currentView === 'list'">
      <div class="glass-panel" style="padding: 20px;">
        <table class="list-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Task</th>
              <th>Priority</th>
              <th>Due Date</th>
              <th>Est. Time</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let task of displayedTasks" [class.text-muted]="task.status === 'Done'">
              <td>
                <span class="status-dot" [ngClass]="'dot-' + task.status.replace(' ', '').toLowerCase()"></span>
                {{ task.status }}
              </td>
              <td style="font-weight: 500;">{{ task.title }}</td>
              <td><span class="priority-badge" [ngClass]="'priority-' + task.priority.toLowerCase()">{{ task.priority }}</span></td>
              <td>{{ task.dueDate | date:'shortDate' || '-' }}</td>
              <td>{{ task.estimatedTime ? task.estimatedTime + 'h' : '-' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Calendar View Placeholder -->
    <div class="calendar-wrapper animate-fade-in" *ngIf="currentView === 'calendar'">
      <div class="glass-panel" style="padding: 20px;">
        <div class="calendar-grid">
          <div class="calendar-day" *ngFor="let day of calendarDays">
            <div class="day-header" [class.is-today]="day.isToday">{{ day.date | date:'EEE, MMM d' }}</div>
            <div class="day-tasks">
               <div class="cal-task" *ngFor="let t of day.tasks" [ngClass]="'cal-status-' + t.status.replace(' ', '').toLowerCase()">
                 <span class="cal-title">{{ t.title }}</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Form (Basic Implementation) -->
    <div class="modal-backdrop" *ngIf="showModal">
      <div class="modal glass-panel animate-slide-in">
        <div class="modal-header">
          <h2>{{ isEditing ? 'Edit Task' : 'Create New Task' }}</h2>
          <button class="btn-icon" (click)="showModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <form (ngSubmit)="submitFullTask()" #tf="ngForm">
            <div class="form-group">
              <label>Title</label>
              <input type="text" name="title" [(ngModel)]="newTask.title" required>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea name="description" [(ngModel)]="newTask.description" rows="3"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Status</label>
                <select name="status" [(ngModel)]="newTask.status">
                  <option value="Todo">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>
              <div class="form-group">
                <label>Priority</label>
                <select name="priority" [(ngModel)]="newTask.priority">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div class="form-group">
                <label>Due Date</label>
                <input type="date" name="dueDate" [(ngModel)]="newTask.dueDate" [min]="todayString" (ngModelChange)="validateDueDate()">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Estimated Time (hrs)</label>
                <input type="number" name="estimatedTime" [(ngModel)]="newTask.estimatedTime" min="0" step="0.5">
              </div>
              <div class="form-group" *ngIf="isEditing">
                <label>Actual Time (hrs)</label>
                <input type="number" name="actualTime" [(ngModel)]="newTask.actualTime" min="0" step="0.5">
              </div>
            </div>

            <div class="form-group" *ngIf="newTask.status === 'In Progress'">
              <label>Completion Level: <span class="text-accent">{{ newTask.progress || 0 }}%</span></label>
              <input type="range" name="progress" [(ngModel)]="newTask.progress" (ngModelChange)="checkProgress($event)" min="0" max="100" step="5" class="range-slider">
            </div>
            
            <div class="modal-footer">
              <button type="button" class="btn btn-outline" (click)="showModal = false">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="!tf.valid">Save Task</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-header {
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }
    .header-content h1 {
      font-size: 2rem;
      background: linear-gradient(135deg, #03631d, var(--text-muted));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .controls-bar {
      display: flex;
      gap: 12px;
      flex: 1;
      max-width: 400px;
    }
    .search-input {
      flex: 1;
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
    }
    .sort-select {
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--border-color);
    }
    .view-toggles {
      display: flex;
      gap: 8px;
    }
    
    .quick-add-bar {
      display: flex;
      gap: 12px;
      padding: 12px;
      align-items: center;
    }
    .quick-add-bar input {
      flex: 1;
      height: 100%;
      border: none;
      background: rgba(255,255,255,0.05);
      border-radius: var(--border-radius-sm);
    }
    .quick-add-bar input:focus {
      background: rgba(88, 166, 255, 0.1);
      box-shadow: none;
      outline: 1px solid var(--accent-base);
    }

    .overdue-banner {
      background-color: rgba(248, 81, 73, 0.1);
      border-left: 4px solid var(--danger);
      padding: 12px 16px;
      border-radius: var(--border-radius-sm);
      color: var(--danger);
      font-weight: 600;
      margin-bottom: 8px;
    }
    .pulse {
      animation: pulseAlert 2s infinite;
    }
    @keyframes pulseAlert {
      0% { box-shadow: 0 0 0 0 rgba(248,81,73,0.4); }
      70% { box-shadow: 0 0 0 10px rgba(248,81,73,0); }
      100% { box-shadow: 0 0 0 0 rgba(248,81,73,0); }
    }

    /* Kanban */
    .board-wrapper {
      display: flex;
      flex-wrap: nowrap;
      gap: 24px;
      align-items: stretch;
      min-height: calc(100vh - 250px);
      overflow-x: auto;
      padding-bottom: 12px;
    }
    .column {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: auto;
      min-width: 300px;
    }
    .column-header {
      padding: 16px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255,255,255,0.02);
    }
    .column-header h3 { font-size: 1.1rem; }
    .count {
      background: var(--bg-color);
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
    }
    .task-list {
      padding: 16px;
      flex: 1;
      overflow: visible;
      min-height: 100px;
    }

    /* Drag Drop Classes */
    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 4px;
      box-shadow: 0 5px 15px -3px rgba(0, 0, 0, 0.8);
      background: var(--bg-panel);
      z-index: 1050 !important;
    }
    .cdk-drag-placeholder { opacity: 0.3; }
    .cdk-drag-animating { transition: transform 250ms cubic-bezier(0, 0, 0.2, 1); }

    /* List View Table */
    .list-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .list-table th, .list-table td {
      padding: 12px;
      border-bottom: 1px solid var(--border-color);
    }
    .list-table th { color: var(--text-muted); font-weight: 500; }
    .status-dot {
      display: inline-block;
      width: 8px; height: 8px; border-radius: 50%;
      margin-right: 8px;
    }
    .dot-todo { background: var(--text-muted); }
    .dot-inprogress { background: var(--accent-base); }
    .dot-done { background: var(--success); }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal {
      width: 500px;
      max-width: 90%;
      background: var(--bg-color);
    }
    .modal-header {
      padding: 20px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn-icon { background: none; color: var(--text-main); font-size: 1.5rem; }
    .modal-body { padding: 20px; }
    .form-row { display: flex; gap: 16px; }
    .form-row > div { flex: 1; }
    .form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
    
    .priority-badge { font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; font-weight: 600; text-transform: uppercase; }
    .priority-high { background: rgba(248, 81, 73, 0.1); color: var(--danger); }
    .priority-medium { background: rgba(210, 153, 34, 0.1); color: var(--warning); }
    .priority-low { background: rgba(35, 134, 54, 0.1); color: var(--success); }
    
    /* Calendar */
    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 12px;
    }
    .calendar-day {
      min-height: 120px;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-sm);
      display: flex;
      flex-direction: column;
      background: rgba(255,255,255,0.02);
    }
    .day-header {
      padding: 8px;
      font-size: 0.85rem;
      border-bottom: 1px solid var(--border-color);
      text-align: right;
      background: rgba(0,0,0,0.2);
    }
    .day-header.is-today { font-weight: bold; color: var(--accent-base); }
    .day-tasks { padding: 4px; display: flex; flex-direction: column; gap: 4px; overflow-y: auto; flex: 1; }
    .cal-task {
      font-size: 0.75rem;
      padding: 4px;
      border-radius: 4px;
      background: var(--bg-panel-hover);
      color: var(--text-main);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      border-left: 2px solid var(--text-muted);
    }
    .cal-status-inprogress { border-left-color: var(--accent-base); background: rgba(88, 166, 255, 0.1); }
    .cal-status-done { border-left-color: var(--success); background: rgba(35, 134, 54, 0.1); opacity: 0.7;text-decoration: line-through; }
    
    /* Animations */
    .animate-slide-in { animation: slideIn 0.4s ease; }
    .animate-fade-in { animation: fadeIn 0.4s ease; }
    .text-accent { color: var(--accent-base); font-weight: bold; }
    .range-slider {
      -webkit-appearance: none; width: 100%; height: 6px; border-radius: 4px; background: rgba(255,255,255,0.1); border: none; padding: 0; outline: none; margin-top: 8px;
    }
    .range-slider::-webkit-slider-thumb {
      -webkit-appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--accent-base); cursor: pointer;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private taskService = inject(TaskService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  allTasks: Task[] = [];
  displayedTasks: Task[] = [];
  todoTasks: Task[] = [];
  inProgressTasks: Task[] = [];
  doneTasks: Task[] = [];

  currentView: 'kanban' | 'list' | 'calendar' = 'kanban';
  overdueTasksCount = 0;
  
  calendarDays: {date: Date, isToday: boolean, tasks: Task[]}[] = [];

  searchQuery = '';
  sortBy = '';
  todayString = new Date().toISOString().split('T')[0];

  setView(view: 'kanban' | 'list' | 'calendar') {
    this.currentView = view;
    if (view !== 'list' && this.sortBy.startsWith('status')) {
      this.sortBy = '';
      this.distributeTasks();
    }
  }

  // Quick Add
  quickAddTaskTitle = '';

  // Modal
  showModal = false;
  isEditing = false;
  editingId: string | null = null;
  newTask: Partial<Task> = this.getEmptyTask();

  ngOnInit() {
    if (!this.authService.isLoggedIn()) return; 
    this.loadTasks();
  }

  loadTasks() {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.allTasks = tasks;
        this.distributeTasks();
        this.checkOverdue();
      },
      error: () => this.toastService.show('Failed to load tasks', 'error')
    });
  }

  distributeTasks() {
    let filtered = [...this.allTasks];
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.title.toLowerCase().includes(q));
    }
    if (this.sortBy === 'priority-desc') {
      const p: { [key: string]: number } = { 'High': 3, 'Medium': 2, 'Low': 1 };
      filtered.sort((a,b) => p[b.priority] - p[a.priority]);
    } else if (this.sortBy === 'priority-asc') {
      const p: { [key: string]: number } = { 'High': 3, 'Medium': 2, 'Low': 1 };
      filtered.sort((a,b) => p[a.priority] - p[b.priority]);
    } else if (this.sortBy === 'date-asc') {
      filtered.sort((a,b) => {
        if(!a.dueDate) return 1;
        if(!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (this.sortBy === 'date-desc') {
      filtered.sort((a,b) => {
        if(!a.dueDate) return 1;
        if(!b.dueDate) return -1;
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      });
    } else if (this.sortBy === 'status-asc') {
      const s: { [key: string]: number } = { 'Todo': 1, 'In Progress': 2, 'Done': 3 };
      filtered.sort((a,b) => s[a.status] - s[b.status]);
    } else if (this.sortBy === 'status-desc') {
      const s: { [key: string]: number } = { 'Todo': 1, 'In Progress': 2, 'Done': 3 };
      filtered.sort((a,b) => s[b.status] - s[a.status]);
    }

    this.todoTasks = filtered.filter(t => t.status === 'Todo');
    this.inProgressTasks = filtered.filter(t => t.status === 'In Progress');
    this.doneTasks = filtered.filter(t => t.status === 'Done');
    this.displayedTasks = filtered;
    this.generateCalendar(filtered);
    this.updateOverdueCount();
  }

  generateCalendar(tasks: Task[]) {
    const today = new Date();
    // Only looking at the next 14 days for a mini-calendar view, starting from Sunday of this week
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay()); 
    const days = [];
    
    for(let i=0; i<14; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        days.push({
            date: d,
            isToday: d.toDateString() === today.toDateString(),
            tasks: tasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === d.toDateString())
        });
    }
    this.calendarDays = days;
  }

  updateOverdueCount() {
    this.overdueTasksCount = this.allTasks.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && t.status !== 'Done').length;
  }

  checkOverdue() {
    this.updateOverdueCount();
    if (this.overdueTasksCount > 0) {
      this.toastService.show(`You have ${this.overdueTasksCount} overdue tasks!`, 'error', 5000);
    }
  }

  addQuickTask() {
    if (!this.quickAddTaskTitle.trim()) return;
    
    const task: Partial<Task> = {
      title: this.quickAddTaskTitle,
      status: 'Todo',
      priority: 'Medium'
    };

    this.taskService.createTask(task).subscribe({
      next: (res) => {
        this.allTasks.push(res);
        this.distributeTasks();
        this.quickAddTaskTitle = '';
        this.toastService.show('Task added!', 'success');
      },
      error: () => this.toastService.show('Failed to add task', 'error')
    });
  }

  openNewTaskModal() {
    this.isEditing = false;
    this.editingId = null;
    this.newTask = this.getEmptyTask();
    this.showModal = true;
  }

  openEditModal(task: Task) {
    this.isEditing = true;
    this.editingId = task._id || null;
    this.newTask = { ...task };
    if (this.newTask.dueDate) {
      this.newTask.dueDate = new Date(this.newTask.dueDate).toISOString().split('T')[0];
    }
    this.showModal = true;
  }

  validateDueDate() {
    if (this.newTask.dueDate && this.newTask.dueDate < this.todayString) {
      this.toastService.show('Due date cannot be in the past! Resetting to today.', 'warning');
      this.newTask.dueDate = this.todayString;
    }
  }

  checkProgress(val: any) {
    if (Number(val) === 100) {
      this.newTask.status = 'Done';
      this.toastService.show('100% reached! Task marked as Done.', 'success');
    }
  }

  deleteTask(id: string) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(id).subscribe({
        next: () => {
          this.toastService.show('Task deleted', 'info');
          this.loadTasks();
        },
        error: () => this.toastService.show('Failed to delete', 'error')
      });
    }
  }

  submitFullTask() {
    if (this.isEditing && this.editingId) {
      this.taskService.updateTask(this.editingId, this.newTask).subscribe({
        next: () => {
          this.showModal = false;
          this.toastService.show('Task Updated!', 'success');
          this.loadTasks();
        },
        error: () => this.toastService.show('Failed to update task', 'error')
      });
    } else {
      this.taskService.createTask(this.newTask).subscribe({
        next: (res) => {
          this.allTasks.push(res);
          this.distributeTasks();
          this.showModal = false;
          this.toastService.show('Task Created!', 'success');
          this.checkOverdue();
        },
        error: () => this.toastService.show('Failed to create task', 'error')
      });
    }
  }

  getEmptyTask(): Partial<Task> {
    return { title: '', description: '', priority: 'Medium', status: 'Todo', estimatedTime: 0, progress: 0 };
  }

  onStatusChange(event: {id: string, status: string}) {
    // Quick optimism update
    const tIndex = this.allTasks.findIndex(t => t._id === event.id);
    if (tIndex > -1) {
      this.allTasks[tIndex].status = event.status as 'Todo' | 'In Progress' | 'Done';
      this.distributeTasks();
    }
    
    this.taskService.updateTaskStatus(event.id, event.status).subscribe({
      next: () => this.toastService.show(`Task marked as ${event.status}`, 'success'),
      error: () => {
        this.toastService.show('Update failed', 'error');
        this.loadTasks(); // revert changes
      }
    });
  }

  drop(event: CdkDragDrop<Task[]>, newStatus: string) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      
      const movedTask = event.container.data[event.currentIndex];
      movedTask.status = newStatus as 'Todo' | 'In Progress' | 'Done';
      this.updateOverdueCount();
      
      if (movedTask._id) {
        this.taskService.updateTaskStatus(movedTask._id, newStatus).subscribe({
          next: () => this.toastService.show('Moved task', 'info'),
          error: () => this.loadTasks() // revert if fail
        });
      }
    }
  }
}
