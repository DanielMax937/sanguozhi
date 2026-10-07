import { canonical, clone } from './rules.ts';
import { createSession, DEFAULT_ADAPTERS, executeCommand } from './engine.ts';
import { isRecord } from './state.ts';
import type { Command, EngineAdapters, GameState, Session } from './types.ts';

export function replayCommands(initial: GameState, commands: readonly Command[], adapters: EngineAdapters = DEFAULT_ADAPTERS): Session {
  const session = createSession(initial,adapters);
  for (const [index,command] of commands.entries()) {
    const result = executeCommand(session.state,command,adapters);
    if (!result.ok) throw new Error(`Replay command ${index} rejected: ${result.reasons.join('; ')}`);
    const {state:after,...preview} = result;
    // This session is private until return: isolate each new entry, not every historical prefix.
    session.trace.push({...clone(preview),command:clone(command),before:clone(session.state),after:clone(after)});
    session.state = clone(after);
  }
  return session;
}
/** Verifies every state snapshot, formula output and evidence record by deterministic replay. Not a cryptographic signature. */
export function verifySession(value: unknown, adapters: EngineAdapters = DEFAULT_ADAPTERS): Session {
  if (!isRecord(value) || value.saveVersion !== 2 || value.engineVersion !== 'training-kernel-v2' || !Array.isArray(value.trace) || !isRecord(value.initialState) || !isRecord(value.state)) throw new Error('Invalid save envelope (v1 requires explicit state migration; old traces are not silently rewritten)');
  if (canonical(Object.keys(value).sort()) !== canonical(['engineVersion','initialState','saveVersion','state','trace'])) throw new Error('Unexpected save fields');
  const commands: Command[] = [];
  for (const entry of value.trace) {
    if (!isRecord(entry) || !isRecord(entry.command)) throw new Error('Invalid trace entry');
    commands.push(entry.command as unknown as Command);
  }
  const replayed = replayCommands(value.initialState as unknown as GameState,commands,adapters);
  if (canonical(replayed) !== canonical(value)) throw new Error('Save/trace mismatch: current state, outcomes or evidence diverged from replay');
  return replayed;
}
export function saveGame(session: Session, adapters: EngineAdapters = DEFAULT_ADAPTERS): string {
  return canonical(verifySession(session,adapters));
}
export function loadGame(serialized: string, adapters: EngineAdapters = DEFAULT_ADAPTERS): Session {
  return verifySession(JSON.parse(serialized) as unknown,adapters);
}
export function replaySession(session: Session, adapters: EngineAdapters = DEFAULT_ADAPTERS): Session {
  return verifySession(clone(session),adapters);
}
export function evidenceSummary(session: Session): Record<string,number> {
  const result: Record<string,number> = {};
  for (const entry of session.trace) for (const use of entry.evidence) {
    result[use.evidence.level] = (result[use.evidence.level] ?? 0) + 1;
  }
  return result;
}
