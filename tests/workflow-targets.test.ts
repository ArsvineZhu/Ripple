import { describe, expect, it } from 'vitest';
import { splitWorkflowTargets } from '../src/renderer/lib/workflowTargets';

describe('workflow targets', () => {
  it('accepts comma and semicolon variants used across locales', () => {
    expect(
      splitWorkflowTargets('Spotify， YouTube、 docs.google.com, Docs; Slack； terminal'),
    ).toEqual(['Spotify', 'YouTube', 'docs.google.com', 'Docs', 'Slack', 'terminal']);
  });
});
