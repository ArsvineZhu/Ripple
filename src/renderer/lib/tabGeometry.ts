export function expandedTabSize(id: number, settingsWidth: number | null, freePosition: boolean) {
  const width =
    id === 7 ? (settingsWidth ?? 495) : id === 1 ? 480 : id === 3 ? 330 : id === 0 ? 405 : 380;
  const height =
    id === 7
      ? freePosition
        ? 425
        : 345
      : id === 6
        ? 250
        : id === 3
          ? 150
          : id === 0
            ? 120
            : id === 1
              ? 210
              : 190;
  return { width, height };
}
