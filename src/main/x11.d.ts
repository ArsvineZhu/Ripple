declare module 'x11' {
  interface Display {
    client: { on(event: string, callback: (error: Error) => void): void; terminate(): void };
  }
  const x11: { createClient(callback: (error: Error | null, display: Display) => void): void };
  export default x11;
}
