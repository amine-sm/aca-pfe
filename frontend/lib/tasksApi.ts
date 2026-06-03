import { apiFetch } from "./api";

export interface TaskCompletion {
  id: number;
  task_id: number;
  user_id: number;
  completed_at: string;
  feeling_score: number;
  reflection_answer_1: string | null;
  reflection_answer_2: string | null;
  psy_note: string | null;
  psy_reviewed: boolean;
}

export interface Task {
  id: number;
  user_id: number;
  psychologist_id: number;
  title: string;
  description: string | null;
  objective: string | null;
  reflection_question_1: string | null;
  reflection_question_2: string | null;
  frequency: "daily" | "weekly";
  status: "active" | "completed" | "paused" | "archived";
  start_date: string;
  end_date: string | null;
  due_at: string | null;
  created_at: string;
  updated_at?: string;
  psy_name?: string;

  // Enrichi côté backend
  completion_count?: number;
  last_completion?: TaskCompletion | null;
  is_late?: boolean;
  completions?: TaskCompletion[];
}

export interface TasksStats {
  total: number;
  active: number;
  completed: number;
  paused: number;
  late: number;
  total_completions: number;
}

export interface TimelinePoint {
  week: string;
  avg_feeling: number;
  nb_completions: number;
}


// ============================================
// USER
// ============================================
export function getMyTasks() {
  return apiFetch<{ success: boolean; tasks: Task[] }>("/tasks/mine");
}

export function completeTask(
  taskId: number,
  payload: {
    feeling_score: number;
    reflection_answer_1?: string;
    reflection_answer_2?: string;
  }
) {
  return apiFetch<{ success: boolean; completion_id: number; message: string }>(
    `/tasks/${taskId}/complete`,
    { method: "POST", body: JSON.stringify(payload) }
  );
}


// ============================================
// PSYCHOLOGUE
// ============================================
export function createTask(payload: {
  user_id: number;
  title: string;
  description?: string;
  objective?: string;
  reflection_question_1?: string;
  reflection_question_2?: string;
  frequency?: "daily" | "weekly";
  start_date?: string;
  end_date?: string;
}) {
  return apiFetch<{ success: boolean; task_id: number; message: string }>(
    "/tasks",
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export function updateTask(
  taskId: number,
  payload: Partial<{
    title: string;
    description: string;
    objective: string;
    reflection_question_1: string;
    reflection_question_2: string;
    frequency: "daily" | "weekly";
    status: "active" | "completed" | "paused" | "archived";
    end_date: string;
  }>
) {
  return apiFetch<{ success: boolean; message: string }>(`/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteTask(taskId: number) {
  return apiFetch<{ success: boolean; message: string }>(`/tasks/${taskId}`, {
    method: "DELETE",
  });
}

export function getPatientTasks(userId: number | string) {
  return apiFetch<{
    success: boolean;
    tasks: Task[];
    stats: TasksStats;
    timeline: TimelinePoint[];
  }>(`/tasks/patient/${userId}`);
}

export function getLateTasksAlerts() {
  return apiFetch<{
    success: boolean;
    total: number;
    late_tasks: Array<Task & { patient_name: string; patient_email: string }>;
  }>("/tasks/alerts");
}
