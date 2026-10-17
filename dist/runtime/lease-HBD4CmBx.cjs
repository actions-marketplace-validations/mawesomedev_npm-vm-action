const require_rolldown_runtime = require("./rolldown-runtime-BGT596CS.cjs");
const require_proc = require("./proc-hB8N9WjN.cjs");
let node_path = require("node:path");
let node_fs = require("node:fs");
let node_crypto = require("node:crypto");
let node_os = require("node:os");
//#region src/state/lease.ts
var lease_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	acquireShared: () => acquireShared,
	createGate: () => createGate,
	createLease: () => createLease,
	gatePath: () => gatePath,
	leaseSurvived: () => leaseSurvived,
	leasesDir: () => leasesDir,
	listLeases: () => listLeases,
	newToken: () => newToken,
	ownerLive: () => ownerLive,
	ownerRecord: () => ownerRecord,
	readOwner: () => readOwner,
	removeGate: () => removeGate
});
function leasesDir(entry) {
	return `${entry}.leases`;
}
function gatePath(entry) {
	return `${entry}.prune`;
}
function newToken() {
	return (0, node_crypto.randomBytes)(8).toString("hex");
}
function ownerRecord(machineId, identity = require_proc.ownIdentity()) {
	return {
		...identity,
		host: (0, node_os.hostname)(),
		machineId,
		createdAt: (/* @__PURE__ */ new Date()).toISOString()
	};
}
function readOwner(file) {
	try {
		const parsed = JSON.parse((0, node_fs.readFileSync)(file, "utf8"));
		if (typeof parsed.pid !== "number") return null;
		return {
			pid: parsed.pid,
			start: typeof parsed.start === "string" ? parsed.start : null,
			host: typeof parsed.host === "string" ? parsed.host : "?",
			machineId: typeof parsed.machineId === "string" ? parsed.machineId : "?",
			createdAt: typeof parsed.createdAt === "string" ? parsed.createdAt : ""
		};
	} catch {
		return null;
	}
}
/** A file in the per-machine cache belongs to a dead owner only when PROC-1 says so; unreadable means live. */
function ownerLive(file) {
	const owner = readOwner(file);
	return owner === null ? true : require_proc.isLive(owner);
}
/** Creates a shared lease on `entry`; the file name is unique, so a prune can never delete a live one by mistake. */
function createLease(entry, owner) {
	const dir = leasesDir(entry);
	for (let attempt = 0;; attempt += 1) {
		(0, node_fs.mkdirSync)(dir, {
			recursive: true,
			mode: 448
		});
		const path = (0, node_path.join)(dir, newToken());
		try {
			(0, node_fs.writeFileSync)(path, JSON.stringify(owner), {
				mode: 384,
				flag: "wx"
			});
		} catch (error) {
			(0, node_fs.rmSync)(path, { force: true });
			if (error.code === "ENOENT" && attempt < 3) continue;
			throw error;
		}
		return {
			path,
			release() {
				(0, node_fs.rmSync)(path, { force: true });
			}
		};
	}
}
/**
* Whether a lease created before a gate check is still in place (spec LEASE-1).
* A prune that passed its own lease check first moves the whole leases dir away, taking the file with it.
*/
function leaseSurvived(lease) {
	return (0, node_fs.existsSync)(lease.path);
}
function listLeases(entry) {
	try {
		return (0, node_fs.readdirSync)(leasesDir(entry)).map((name) => (0, node_path.join)(leasesDir(entry), name));
	} catch {
		return [];
	}
}
function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
const GATE_WAIT_MS = 5e3;
/**
* The runtime's shared lease (spec LEASE-1): lease first, then look for a live prune gate.
* A live gate means the entry is going away: wait briefly, retry once, else return null so the caller fetches a private entry.
*/
async function acquireShared(entry, owner, options = {}) {
	for (let attempt = 0; attempt < 3; attempt += 1) {
		const lease = createLease(entry, owner);
		const gate = gatePath(entry);
		let gated = false;
		try {
			gated = ownerLive(gate);
		} catch {
			gated = false;
		}
		if (!gated || !gateExists(gate)) {
			if (leaseSurvived(lease)) return lease;
			continue;
		}
		lease.release();
		const deadline = Date.now() + (options.waitMs ?? GATE_WAIT_MS);
		while (Date.now() < deadline && gateExists(gate)) await sleep(50);
	}
	return null;
}
function gateExists(gate) {
	try {
		return readOwner(gate) !== null;
	} catch {
		return false;
	}
}
/** Creates the prune gate with O_EXCL; false when another gate exists (there is only ever one prune, so a leftover). */
function createGate(entry, owner) {
	try {
		(0, node_fs.writeFileSync)(gatePath(entry), JSON.stringify(owner), {
			flag: "wx",
			mode: 384
		});
	} catch (error) {
		if (error.code === "EEXIST") return false;
		(0, node_fs.rmSync)(gatePath(entry), { force: true });
		throw error;
	}
	return true;
}
function removeGate(entry) {
	(0, node_fs.rmSync)(gatePath(entry), { force: true });
}
//#endregion
Object.defineProperty(exports, "acquireShared", {
	enumerable: true,
	get: function() {
		return acquireShared;
	}
});
Object.defineProperty(exports, "createGate", {
	enumerable: true,
	get: function() {
		return createGate;
	}
});
Object.defineProperty(exports, "createLease", {
	enumerable: true,
	get: function() {
		return createLease;
	}
});
Object.defineProperty(exports, "gatePath", {
	enumerable: true,
	get: function() {
		return gatePath;
	}
});
Object.defineProperty(exports, "leaseSurvived", {
	enumerable: true,
	get: function() {
		return leaseSurvived;
	}
});
Object.defineProperty(exports, "lease_exports", {
	enumerable: true,
	get: function() {
		return lease_exports;
	}
});
Object.defineProperty(exports, "leasesDir", {
	enumerable: true,
	get: function() {
		return leasesDir;
	}
});
Object.defineProperty(exports, "listLeases", {
	enumerable: true,
	get: function() {
		return listLeases;
	}
});
Object.defineProperty(exports, "newToken", {
	enumerable: true,
	get: function() {
		return newToken;
	}
});
Object.defineProperty(exports, "ownerLive", {
	enumerable: true,
	get: function() {
		return ownerLive;
	}
});
Object.defineProperty(exports, "ownerRecord", {
	enumerable: true,
	get: function() {
		return ownerRecord;
	}
});
Object.defineProperty(exports, "removeGate", {
	enumerable: true,
	get: function() {
		return removeGate;
	}
});
