const require_rolldown_runtime = require("./rolldown-runtime-BGT596CS.cjs");
const require_messages = require("./messages-vUDkl1-0.cjs");
const require_proc = require("./proc-hB8N9WjN.cjs");
const require_lease = require("./lease-HBD4CmBx.cjs");
let node_path = require("node:path");
let node_fs = require("node:fs");
//#region src/state/lock.ts
var lock_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	LOCK_FILE: () => LOCK_FILE,
	acquireLock: () => acquireLock,
	lockOwnerLive: () => lockOwnerLive,
	lockPath: () => lockPath,
	readLock: () => readLock,
	tryLock: () => tryLock
});
const LOCK_FILE = "lock";
const WAIT_LIMIT_MS = 1e4;
function lockPath(stateDir) {
	return (0, node_path.join)(stateDir, LOCK_FILE);
}
function readLock(stateDir) {
	try {
		const parsed = JSON.parse((0, node_fs.readFileSync)(lockPath(stateDir), "utf8"));
		if (typeof parsed.pid !== "number" || typeof parsed.token !== "string") return null;
		return {
			pid: parsed.pid,
			start: typeof parsed.start === "string" ? parsed.start : null,
			host: typeof parsed.host === "string" ? parsed.host : "?",
			machineId: typeof parsed.machineId === "string" ? parsed.machineId : "?",
			createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : "",
			token: parsed.token
		};
	} catch {
		return null;
	}
}
/** Whether the lock owner can be shown to be dead: only on this machine, and only by PROC-1. */
function lockOwnerLive(record, machineId) {
	if (record === null) return true;
	if (record.machineId !== machineId) return true;
	return require_proc.isLive(record);
}
function tryCreate(path, record) {
	try {
		(0, node_fs.writeFileSync)(path, JSON.stringify(record), {
			flag: "wx",
			mode: 384
		});
	} catch (error) {
		if (error.code === "EEXIST") return false;
		(0, node_fs.rmSync)(path, { force: true });
		throw error;
	}
	return true;
}
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
* Takes the exclusive lock (spec MUT-1): created with O_EXCL, released only by its owner, never reclaimed.
* Waits with backoff for up to 10 s, then fails with M-LOCKED naming the file and whether the owner is live.
*/
async function acquireLock(stateDir, owner, options = {}) {
	(0, node_fs.mkdirSync)(stateDir, {
		recursive: true,
		mode: 448
	});
	const path = lockPath(stateDir);
	const record = {
		...owner,
		token: require_lease.newToken()
	};
	const deadline = Date.now() + (options.waitMs ?? WAIT_LIMIT_MS);
	let delay = 50;
	for (;;) {
		if (tryCreate(path, record)) return {
			path,
			release() {
				if (readLock(stateDir)?.token === record.token) (0, node_fs.rmSync)(path, { force: true });
			}
		};
		if (Date.now() + delay > deadline) {
			const holder = readLock(stateDir);
			const foreign = holder !== null && holder.machineId !== owner.machineId;
			const live = lockOwnerLive(holder, owner.machineId);
			throw new require_messages.NpmVmError("M-LOCKED", require_messages.EXIT.problems, require_messages.lockedMessage(path, holder, live, foreign));
		}
		await sleep(delay);
		delay = Math.min(delay * 2, 1e3);
	}
}
/** One attempt, no waiting; for the launcher's recovery check, which must never delay npm. */
function tryLock(stateDir, owner) {
	(0, node_fs.mkdirSync)(stateDir, {
		recursive: true,
		mode: 448
	});
	const path = lockPath(stateDir);
	const record = {
		...owner,
		token: require_lease.newToken()
	};
	if (!tryCreate(path, record)) return null;
	return {
		path,
		release() {
			if (readLock(stateDir)?.token === record.token) (0, node_fs.rmSync)(path, { force: true });
		}
	};
}
//#endregion
Object.defineProperty(exports, "acquireLock", {
	enumerable: true,
	get: function() {
		return acquireLock;
	}
});
Object.defineProperty(exports, "lockOwnerLive", {
	enumerable: true,
	get: function() {
		return lockOwnerLive;
	}
});
Object.defineProperty(exports, "lockPath", {
	enumerable: true,
	get: function() {
		return lockPath;
	}
});
Object.defineProperty(exports, "lock_exports", {
	enumerable: true,
	get: function() {
		return lock_exports;
	}
});
Object.defineProperty(exports, "readLock", {
	enumerable: true,
	get: function() {
		return readLock;
	}
});
