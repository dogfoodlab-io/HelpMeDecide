import type {
  Collaborator,
  CollaboratorPermission,
  CollaboratorRole,
} from "./types";

const permissionsByRole: Record<CollaboratorRole, CollaboratorPermission[]> = {
  owner: [
    "read-context",
    "add-options",
    "answer-prompts",
    "vote",
    "comment",
    "flag-concerns",
    "view-outcome",
  ],
  participant: [
    "read-context",
    "add-options",
    "answer-prompts",
    "vote",
    "comment",
    "flag-concerns",
    "view-outcome",
  ],
  viewer: ["read-context", "view-outcome"],
};

export function createCollaborator(input: {
  id: string;
  name: string;
  role: CollaboratorRole;
}): Collaborator {
  return {
    id: input.id,
    name: input.name,
    role: input.role,
    permissions: permissionsByRole[input.role],
    responseState: "invited",
  };
}

export function canCollaborator(
  collaborator: Collaborator,
  permission: CollaboratorPermission,
): boolean {
  return collaborator.permissions.includes(permission);
}
