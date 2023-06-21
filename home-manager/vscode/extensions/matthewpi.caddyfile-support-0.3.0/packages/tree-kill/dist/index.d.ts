import { ExecException } from 'node:child_process';

type Signal = string | number;
type Callback = (error?: ExecException) => void;
/**
 * Kills process identified by `pid` and all its children
 *
 * @param pid Process ID to kill
 * @param signal Signal to send to the process, defaults to 'SIGTERM'.
 * @param callback Callback function to call when a process is killed.
 */
declare function treeKill(pid: number, signal?: Signal, callback?: Callback): void;

export { treeKill };
