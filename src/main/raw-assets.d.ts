declare module '*.sql?raw' {
  const sql: string;
  export default sql;
}

declare module '*.md?raw' {
  const markdown: string;
  export default markdown;
}
