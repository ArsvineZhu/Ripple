export function splitWorkflowTargets(input: string) {
  return input
    .split(/[,，、;；]/u)
    .map((target) => target.trim())
    .filter(Boolean);
}
