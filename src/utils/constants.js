export const UserRolesEnum = {
  ADMIN: "admin",
  PROJECT_ADMIN: "project-admin",
  MEMBER: "member",
};

export const AvailableUserRoles = Object.values(UserRolesEnum);

export const TaskStatusEnum = {
  TODO: "todo",
  IN_PROGRESS: "in-progress",
  DONE: "done",
};

export const AvailableTaskStatus = Object.values(TaskStatusEnum);

export const ProjectPriorityEnum = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

export const AvailableProjectPriority = Object.values(ProjectPriorityEnum);

