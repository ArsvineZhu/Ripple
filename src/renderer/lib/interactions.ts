export const isInteractiveTarget = (target: EventTarget | null) => {
  if (!(target instanceof Element)) return false;
  const targetTag = target.tagName;
  return (
    targetTag === 'INPUT' ||
    targetTag === 'TEXTAREA' ||
    targetTag === 'SELECT' ||
    targetTag === 'LABEL' ||
    target?.closest?.('[data-island-interactive]') ||
    target?.closest?.('button') ||
    target?.closest?.('label') ||
    target?.closest?.('[role="combobox"], [role="listbox"]')
  );
};
