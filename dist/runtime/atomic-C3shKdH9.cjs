const require_lease = require("./lease-HBD4CmBx.cjs");
let node_path = require("node:path");
let node_fs = require("node:fs");
//#region src/state/atomic.ts
const RETRY_CODES = /* @__PURE__ */ new Set([
	"EBUSY",
	"EPERM",
	"EACCES"
]);
const RETRY_LIMIT_MS = 5e3;
function sleepSync(ms) {
	Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}
/**
* Runs a file operation, retrying Windows sharing violations with backoff for up to 5 s (spec MUT-3).
* Elsewhere the same codes are real permission errors and surface at once.
*/
function withSharingRetry(operation, platform = process.platform, limitMs = RETRY_LIMIT_MS) {
	const started = Date.now();
	let delay = 20;
	for (;;) try {
		return operation();
	} catch (error) {
		const code = error.code ?? "";
		if (platform !== "win32" || !RETRY_CODES.has(code) || Date.now() - started + delay > limitMs) throw error;
		sleepSync(delay);
		delay = Math.min(delay * 2, 500);
	}
}
/** Writes `content` to `path` through a temp file in the same dir, fsynced and renamed into place. */
function atomicWrite(path, content, mode = 420) {
	const dir = (0, node_path.dirname)(path);
	(0, node_fs.mkdirSync)(dir, { recursive: true });
	const temp = (0, node_path.join)(dir, `.${require_lease.newToken()}.tmp`);
	try {
		const fd = (0, node_fs.openSync)(temp, "wx", mode);
		try {
			const buffer = typeof content === "string" ? Buffer.from(content, "utf8") : content;
			for (let offset = 0; offset < buffer.length;) {
				const written = (0, node_fs.writeSync)(fd, buffer, offset, buffer.length - offset);
				if (written <= 0) throw new Error(`short write to ${temp}: ${offset} of ${buffer.length} bytes`);
				offset += written;
			}
			(0, node_fs.fsyncSync)(fd);
		} finally {
			(0, node_fs.closeSync)(fd);
		}
		withSharingRetry(() => (0, node_fs.renameSync)(temp, path));
	} catch (error) {
		(0, node_fs.rmSync)(temp, { force: true });
		throw error;
	}
}
/** Renames with the Windows retry; a cross-device rename is not retried, it is a layout error. */
function atomicRename(from, to) {
	withSharingRetry(() => (0, node_fs.renameSync)(from, to));
}
function removeWithRetry(path) {
	withSharingRetry(() => (0, node_fs.rmSync)(path, {
		recursive: true,
		force: true
	}));
}
//#endregion
Object.defineProperty(exports, "atomicRename", {
	enumerable: true,
	get: function() {
		return atomicRename;
	}
});
Object.defineProperty(exports, "atomicWrite", {
	enumerable: true,
	get: function() {
		return atomicWrite;
	}
});
Object.defineProperty(exports, "removeWithRetry", {
	enumerable: true,
	get: function() {
		return removeWithRetry;
	}
});
Object.defineProperty(exports, "withSharingRetry", {
	enumerable: true,
	get: function() {
		return withSharingRetry;
	}
});
