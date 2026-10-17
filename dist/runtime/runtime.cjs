Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_messages = require("./messages-vUDkl1-0.cjs");
const require_install = require("./install-C_M5WK98.cjs");
const require_src = require("./src-SpeGbMJx.cjs");
let node_child_process = require("node:child_process");
let node_path = require("node:path");
//#region src/runtime.ts
/** The launcher ABI this runtime needs; a launcher runs runtimes of its own ABI or one below (spec RUN-2). */
const abi = 1;
/** Entry point `bootstrap.cjs` calls; returns the exit code. */
async function main(selector, argv, options) {
	try {
		if (selector === "cli") {
			const { run } = await Promise.resolve().then(() => require("./dispatch-B9OSfqsn.cjs"));
			return await run(argv, {
				home: options.home,
				env: process.env
			});
		}
		return await launch(selector, argv, options.home);
	} catch (error) {
		if (require_messages.isNpmVmError(error)) {
			process.stderr.write(`npm-vm: ${error.message}\n`);
			return error.exitCode;
		}
		process.stderr.write(`npm-vm: ${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
		return require_messages.EXIT.problems;
	}
}
/**
* Finishes journals left by a crashed command before anything else runs (spec RUN-2, MUT-2).
* The lock is tried once without waiting: npm must never wait on a setup, and `current` is always runnable.
*/
async function recoverLeftovers(home) {
	const { resolveDirs } = await Promise.resolve().then(() => require("./home-BaoZZSBy.cjs")).then((n) => n.home_exports);
	const { hasJournals, recoverDeadJournals } = await Promise.resolve().then(() => require("./journal-_bs-eJRJ.cjs")).then((n) => n.journal_exports);
	const { lockOwnerLive, readLock, tryLock } = await Promise.resolve().then(() => require("./lock-DBeYN-Zg.cjs")).then((n) => n.lock_exports);
	const { ownerRecord } = await Promise.resolve().then(() => require("./lease-HBD4CmBx.cjs")).then((n) => n.lease_exports);
	const dirs = resolveDirs(process.env, home);
	if (!hasJournals(dirs.journal)) return;
	const owner = ownerRecord(dirs.machine.id);
	const lock = tryLock(dirs.state, owner);
	if (lock === null) {
		const holder = readLock(dirs.state);
		if (!lockOwnerLive(holder, dirs.machine.id)) process.stderr.write(`npm-vm: ${require_messages.lockedMessage((0, node_path.join)(dirs.state, "lock"), holder, false, false)}\n`);
		return;
	}
	try {
		const report = recoverDeadJournals(dirs.journal, dirs.machine.id);
		for (const id of report.changed) process.stderr.write(`npm-vm: ${require_messages.changedMessage(id, "leftover change")}\n`);
	} finally {
		lock.release();
	}
}
/** Resolves and runs npm or npx for the current directory (spec RUN-3 to RUN-7). */
async function launch(selector, argv, home) {
	const env = process.env;
	await recoverLeftovers(home);
	let installer = null;
	const lazy = () => {
		installer ??= Promise.resolve().then(() => require("./install-C_M5WK98.cjs")).then((n) => n.install_exports).then((install) => install.createInstaller(install.createContext(env, home)));
		return installer;
	};
	const providers = {
		nodeVersion: process.version,
		ownNpm: () => require_install.findOwnNpm(),
		cached: async (specs) => (await lazy()).cached(specs),
		registry: async (specs) => (await lazy()).registry(specs),
		entryPathFor: (candidate) => (0, node_path.join)(home, "pending", candidate.version)
	};
	const result = await require_src.resolveNpmWith(argv, process.cwd(), { env }, providers);
	if (result.warning !== null) process.stderr.write(`npm-vm: ${result.warning}\n`);
	const script = selector === "npx" ? "npx-cli.js" : "npm-cli.js";
	if (result.kind === "own" || result.selection === null) return runChild((0, node_path.join)((0, node_path.dirname)(result.cliPath), script), argv, null);
	const ensured = await (await lazy()).ensure(result.selection);
	const { createLease, ownerRecord } = await Promise.resolve().then(() => require("./lease-HBD4CmBx.cjs")).then((n) => n.lease_exports);
	const { startIdentity } = await Promise.resolve().then(() => require("./proc-hB8N9WjN.cjs")).then((n) => n.proc_exports);
	const { resolveDirs } = await Promise.resolve().then(() => require("./home-BaoZZSBy.cjs")).then((n) => n.home_exports);
	const machineId = resolveDirs(env, home).machine.id;
	const leaseForChild = (child) => {
		const pid = child.pid;
		return createLease(ensured.entryPath, ownerRecord(machineId, {
			pid,
			start: startIdentity(pid)
		})).release;
	};
	return runChild((0, node_path.join)(ensured.entryPath, "bin", script), argv, ensured.lease.release, leaseForChild);
}
const FORWARD_NOW = ["SIGTERM", "SIGHUP"];
const FORWARD_LATER = ["SIGINT", "SIGQUIT"];
const LATER_DELAY_MS = 1e3;
function alive(child) {
	return child.exitCode === null && child.signalCode === null;
}
/**
* Spawns npm with inherited stdio and mirrors its exit (spec RUN-3 to RUN-5).
* SIGTERM and SIGHUP are forwarded at once; SIGINT and SIGQUIT only if the child outlives them by a second, since a terminal already hit the whole group.
*/
function runChild(script, argv, release, onSpawn = null) {
	return new Promise((resolve) => {
		const child = (0, node_child_process.spawn)(process.execPath, [script, ...argv], {
			stdio: "inherit",
			env: process.env
		});
		const releaseChild = child.pid === void 0 ? null : onSpawn?.(child) ?? null;
		const handlers = [];
		const timers = [];
		if (process.platform !== "win32") {
			for (const signal of FORWARD_NOW) handlers.push([signal, () => child.kill(signal)]);
			for (const signal of FORWARD_LATER) handlers.push([signal, () => {
				const timer = setTimeout(() => {
					if (alive(child)) child.kill(signal);
				}, LATER_DELAY_MS);
				timer.unref();
				timers.push(timer);
			}]);
			for (const [signal, handler] of handlers) process.on(signal, handler);
		}
		const cleanup = () => {
			for (const [signal, handler] of handlers) process.removeListener(signal, handler);
			for (const timer of timers) clearTimeout(timer);
			releaseChild?.();
			release?.();
		};
		child.on("error", (error) => {
			cleanup();
			process.stderr.write(`npm-vm: cannot start ${script}: ${error.message}\n`);
			resolve(require_messages.EXIT.problems);
		});
		child.on("exit", (code, signal) => {
			cleanup();
			if (signal !== null) {
				process.kill(process.pid, signal);
				return;
			}
			resolve(code ?? require_messages.EXIT.problems);
		});
	});
}
//#endregion
exports.abi = abi;
exports.main = main;
exports.runChild = runChild;
