import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '../../core/services/task.service';
import { differenceInDays, isPast, parseISO } from 'date-fns';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="task-card glass-panel" [class.is-done]="task.status === 'Done'" [class.is-overdue]="isOverdue">
      
      <!-- Progress & Deadline Bars -->
      <div class="bars-container">
        <div class="completion-bar" [style.width.%]="completionPercentage" [style.background]="completionColor"></div>
        <div class="deadline-bar" *ngIf="task.dueDate" [style.width.%]="deadlinePercentage" [style.background]="deadlineColor"></div>
      </div>

      <div class="card-content">
        <div class="card-header">
          <label class="custom-checkbox">
            <input type="checkbox" [checked]="task.status === 'Done'" (change)="onToggleDone($event)">
            <span class="checkmark"></span>
          </label>
          <h3 class="task-title" [class.strike]="task.status === 'Done'">{{ task.title }}</h3>
          <span class="priority-badge" [ngClass]="'priority-' + task.priority.toLowerCase()">{{ task.priority }}</span>
          
          <div class="card-actions">
            <button class="icon-btn edit-btn" (click)="onEdit($event)" title="Edit Task">✏️</button>
            <button class="icon-btn delete-btn" (click)="onDelete($event)" title="Delete Task">🗑️</button>
          </div>
        </div>
        
        <p class="task-desc" *ngIf="task.description">{{ task.description }}</p>
        
        <div class="card-footer">
          <div class="status-badge" [ngClass]="'status-' + task.status.replace(' ', '-').toLowerCase()">
            {{ task.status }}
          </div>
          
          <div class="due-date" *ngIf="task.dueDate" [class.text-danger]="isOverdue && task.status !== 'Done'">
            <span class="icon">📅</span> 
            {{ task.dueDate | date:'mediumDate' }} 
            <span *ngIf="isOverdue && task.status !== 'Done'">(Overdue!)</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .task-card {
      position: relative;
      border-radius: var(--border-radius-sm);
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
      cursor: grab;
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
      background: var(--bg-panel);
    }
    .task-card:active {
      cursor: grabbing;
    }
    .task-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
    .task-card.is-done {
      opacity: 0.7;
    }
    .task-card.is-overdue {
      border: 1px solid rgba(248, 81, 73, 0.4);
    }
    
    /* Bars */
    .bars-container {
      display: flex;
      flex-direction: column;
      height: 6px;
      width: 100%;
    }
    .completion-bar, .deadline-bar {
      height: 3px;
      transition: width 0.3s ease, background-color 0.3s ease;
    }
    .completion-bar { background: var(--accent-base); }
    .deadline-bar { background: var(--success); }

    .card-content {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }

    .task-title {
      font-size: 1.1rem;
      font-weight: 500;
      flex: 1;
      margin: 0;
      line-height: 1.3;
    }
    .strike {
      text-decoration: line-through;
      color: var(--text-muted);
    }

    .custom-checkbox {
      display: inline-block;
      position: relative;
      width: 20px;
      height: 20px;
      cursor: pointer;
      margin-top: 2px;
    }
    .custom-checkbox input {
      position: absolute;
      opacity: 0;
      cursor: pointer;
      height: 0;
      width: 0;
    }
    .checkmark {
      position: absolute;
      top: 0;
      left: 0;
      height: 20px;
      width: 20px;
      background-color: transparent;
      border: 2px solid var(--border-color);
      border-radius: 4px;
      transition: all 0.2s;
    }
    .custom-checkbox:hover input ~ .checkmark {
      border-color: var(--accent-base);
    }
    .custom-checkbox input:checked ~ .checkmark {
      background-color: var(--success);
      border-color: var(--success);
    }
    .checkmark:after {
      content: "";
      position: absolute;
      display: none;
      left: 6px;
      top: 2px;
      width: 4px;
      height: 10px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
    .custom-checkbox input:checked ~ .checkmark:after {
      display: block;
    }

    .priority-badge {
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .priority-high { background: rgba(248, 81, 73, 0.1); color: var(--danger); }
    .priority-medium { background: rgba(210, 153, 34, 0.1); color: var(--warning); }
    .priority-low { background: rgba(35, 134, 54, 0.1); color: var(--success); }

    .task-desc {
      font-size: 0.9rem;
      color: var(--text-muted);
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      font-size: 0.85rem;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      background: var(--bg-panel-hover);
      color: var(--text-muted);
    }
    .status-todo { border-left: 2px solid var(--text-muted); }
    .status-in-progress { border-left: 2px solid var(--accent-base); color: var(--accent-base); }
    .status-done { border-left: 2px solid var(--success); color: var(--success); }

    .due-date {
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .text-danger {
      color: var(--danger);
      font-weight: 600;
    }
    .icon-btn {
      background: none; border: none; font-size: 1rem; cursor: pointer; opacity: 0.5; padding: 4px;
      transition: all 0.2s; border-radius: 4px;
    }
    .icon-btn:hover { opacity: 1; background: var(--bg-panel-hover); }
    .delete-btn:hover { color: var(--danger); background: rgba(248, 81, 73, 0.1); }
    .card-actions { display: flex; gap: 4px; align-items: center; }
  `]
})
export class TaskCardComponent implements OnInit {
  @Input() task!: Task;
  @Output() statusChange = new EventEmitter<{ id: string, status: string }>();
  @Output() edit = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<string>();

  completionPercentage = 0;
  completionColor = 'var(--accent-base)';

  deadlinePercentage = 100;
  deadlineColor = 'var(--success)';
  isOverdue = false;

  ngOnInit() {
    this.calculateProgressBars();
  }

  calculateProgressBars() {
    // Completion Bar
    if (this.task.status === 'Done') {
      this.completionPercentage = 100;
      this.completionColor = 'var(--success)';
    } else if (this.task.status === 'In Progress') {
      this.completionPercentage = this.task.progress || 0;
      this.completionColor = 'var(--accent-base)';
    } else {
      this.completionPercentage = 0;
    }

    // Deadline Bar (visual shrink logic arbitrarily based on 30 days total timeline)
    if (this.task.dueDate) {
      const due = new Date(this.task.dueDate);
      const now = new Date();
      this.isOverdue = isPast(due) && this.task.status !== 'Done';
      
      const daysLeft = differenceInDays(due, now);
      
      if (this.isOverdue) {
        this.deadlinePercentage = 100;
        this.deadlineColor = 'var(--danger)';
      } else {
        // Assume 14 days max to scale
        const maxDays = 14;
        const boundedDays = Math.max(0, Math.min(daysLeft, maxDays));
        this.deadlinePercentage = (boundedDays / maxDays) * 100;
        
        if (daysLeft > 7) {
          this.deadlineColor = 'var(--success)';
        } else if (daysLeft > 2) {
          this.deadlineColor = 'var(--warning)';
        } else {
          this.deadlineColor = 'var(--danger)';
          this.deadlinePercentage = Math.max(this.deadlinePercentage, 10); // minimum visual width
        }
      }
    } else {
      this.deadlinePercentage = 0;
    }
  }

  onToggleDone(event: any) {
    const isChecked = event.target.checked;
    const newStatus = isChecked ? 'Done' : 'Todo';
    if (this.task._id) {
      this.statusChange.emit({ id: this.task._id, status: newStatus });
    }
  }

  onEdit(event: Event) {
    event.stopPropagation();
    this.edit.emit(this.task);
  }

  onDelete(event: Event) {
    event.stopPropagation();
    if(this.task._id) {
      this.delete.emit(this.task._id);
    }
  }
}
