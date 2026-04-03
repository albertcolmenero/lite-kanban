export type SerializedBoardTask = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  statusId: string;
  priorityId: string;
  position: number;
  dueDate: string | null;
  status: { id: string; name: string; sortOrder: number };
  priority: { id: string; name: string; sortOrder: number };
  labels: { label: { id: string; name: string; color: string } }[];
  subtasks: {
    id: string;
    title: string;
    completed: boolean;
    position: number;
  }[];
  attachments: {
    id: string;
    url: string;
    filename: string | null;
    contentType: string | null;
    size: number | null;
  }[];
  comments: {
    id: string;
    userId: string;
    body: string;
    createdAt: string;
    updatedAt: string;
  }[];
  activities: {
    id: string;
    type: string;
    metadata: unknown;
    createdAt: string;
  }[];
};

export type SerializedStatus = {
  id: string;
  name: string;
  sortOrder: number;
  isFinal: boolean;
};

export type SerializedPriority = {
  id: string;
  name: string;
  sortOrder: number;
};

export type SerializedProjectLabel = {
  id: string;
  name: string;
  color: string;
};
