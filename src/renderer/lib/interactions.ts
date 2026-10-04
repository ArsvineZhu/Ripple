export const isInteractiveTarget = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return false;
  const targetTag = target.tagName;
  return (
    targetTag === 'INPUT' ||
    targetTag === 'TEXTAREA' ||
    targetTag === 'SELECT' ||
    targetTag === 'LABEL' ||
    target?.closest?.('button') ||
    target?.closest?.('.radio-label') ||
    target?.closest?.('.task-row') ||
    target?.closest?.('.clipboard-row')
  );
};
