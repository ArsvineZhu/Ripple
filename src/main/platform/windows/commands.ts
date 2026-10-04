// Tokenizes an argument string, correctly handling mid-token quotes.
// --flag="hello world"  ->  ['--flag=hello world']
// "quoted arg" --bare   ->  ['quoted arg', '--bare']
export function tokenizeArgs(str: string) {
  const args: string[] = [];
  let i = 0;
  while (i < str.length) {
    while (i < str.length && /\s/.test(str[i])) i++;
    if (i >= str.length) break;
    let token = '';
    while (i < str.length && !/\s/.test(str[i])) {
      if (str[i] === '"') {
        i++;
        while (i < str.length && str[i] !== '"') token += str[i++];
        if (i < str.length) i++; // consume closing quote
      } else {
        token += str[i++];
      }
    }
    if (token) args.push(token);
  }
  return args;
}

// Parses a Windows command string into { exe, args }.
// Normalizes forward slashes and expands %ENV_VAR% before splitting.
export function parseCommand(input: string) {
  const prepared = input
    .replace(/\//g, '\\')
    .replace(/%([^%]+)%/g, (_, v) => process.env[v] || `%${v}%`);

  // Quoted exe path: "C:\path with spaces\app.exe" [args...]
  const quotedMatch = prepared.match(/^"([^"]+)"(.*)/);
  if (quotedMatch) {
    return {
      exe: quotedMatch[1],
      args: quotedMatch[2].trim() ? tokenizeArgs(quotedMatch[2].trim()) : [],
    };
  }

  // Unquoted path: find exe boundary by known extension so that spaces inside
  // the path (C:\Program Files\...) don't cause premature splitting.
  const extMatch = prepared.match(/^(.+?\.(?:exe|cmd|bat|com|ps1))(?:\s+(.*))?$/i);
  if (extMatch) {
    return {
      exe: extMatch[1],
      args: extMatch[2] ? tokenizeArgs(extMatch[2]) : [],
    };
  }

  // No recognised extension (e.g. cmd, wt) — split on first whitespace.
  const spaceIdx = prepared.search(/\s/);
  if (spaceIdx === -1) return { exe: prepared, args: [] };
  return {
    exe: prepared.slice(0, spaceIdx),
    args: tokenizeArgs(prepared.slice(spaceIdx + 1).trim()),
  };
}
