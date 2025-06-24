export type User = {
  id: string;
  name: string;
  avatar: string;
  points: number;
};

export type Priority = "Laag" | "Midden" | "Hoog";

export type Status = "To-do" | "In Progress" | "Done";

export type Label = "Keuken" | "Woonkamer" | "Badkamer" | "Slaapkamer" | "Algemeen";

export type Subtask = {
  id: string;
  text: string;
  completed: boolean;
};

export type Attachment = {
  id:string;
  name: string;
  url: string;
  type: "image" | "file";
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate: Date;
  assigneeId: string | null;
  labels: Label[];
  subtasks: Subtask[];
  attachments: Attachment[];
  isPrivate: boolean;
  createdAt: Date;
  completedAt?: Date;
};
