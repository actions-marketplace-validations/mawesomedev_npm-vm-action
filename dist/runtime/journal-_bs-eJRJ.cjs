const require_rolldown_runtime = require("./rolldown-runtime-BGT596CS.cjs");
const require_proc = require("./proc-hB8N9WjN.cjs");
const require_lease = require("./lease-HBD4CmBx.cjs");
const require_atomic = require("./atomic-C3shKdH9.cjs");
let node_path = require("node:path");
let node_fs = require("node:fs");
let node_crypto = require("node:crypto");
//#region src/state/meta.ts
function sha256(content) {
	return (0, node_crypto.createHash)("sha256").update(content).digest("hex");
}
function isUtf8(content) {
	return !content.includes(0) && Buffer.from(content.toString("utf8"), "utf8").equals(content);
}
function lineEndingsOf(text) {
	const crlf = (text.match(/\r\n/g) ?? []).length;
	const lf = (text.match(/\n/g) ?? []).length - crlf;
	if (crlf === 0 && lf === 0) return "none";
	if (crlf > 0 && lf > 0) return "mixed";
	return crlf > 0 ? "crlf" : "lf";
}
const MISSING = {
	type: "missing",
	mode: 0,
	sha256: null,
	encoding: null,
	lineEndings: null,
	symlinkTarget: null
};
/** Captures `path` without following symlinks; a missing path is a valid state, not an error. */
function captureMeta(path) {
	let stat;
	try {
		stat = (0, node_fs.lstatSync)(path);
	} catch {
		return MISSING;
	}
	const mode = process.platform === "win32" ? 0 : stat.mode & 4095;
	if (stat.isSymbolicLink()) return {
		type: "symlink",
		mode,
		sha256: null,
		encoding: null,
		lineEndings: null,
		symlinkTarget: (0, node_fs.readlinkSync)(path)
	};
	if (stat.isDirectory()) return {
		type: "directory",
		mode,
		sha256: null,
		encoding: null,
		lineEndings: null,
		symlinkTarget: null
	};
	if (!stat.isFile()) return {
		type: "other",
		mode,
		sha256: null,
		encoding: null,
		lineEndings: null,
		symlinkTarget: null
	};
	const content = (0, node_fs.readFileSync)(path);
	const utf8 = isUtf8(content);
	return {
		type: "file",
		mode,
		sha256: sha256(content),
		encoding: utf8 ? "utf8" : "binary",
		lineEndings: utf8 ? lineEndingsOf(content.toString("utf8")) : null,
		symlinkTarget: null
	};
}
/** Whether the path still holds exactly what `meta` recorded (spec MUT-5): same type, same bytes or link target. */
function metaMatches(path, meta) {
	const now = captureMeta(path);
	return now.type === meta.type && now.sha256 === meta.sha256 && now.symlinkTarget === meta.symlinkTarget;
}
//#endregion
//#region src/state/journal.ts
var journal_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	hasJournals: () => hasJournals,
	journalPath: () => journalPath,
	listJournals: () => listJournals,
	mutateFile: () => mutateFile,
	readJournal: () => readJournal,
	recoverDeadJournals: () => recoverDeadJournals,
	recoverForeignJournal: () => recoverForeignJournal,
	recoverJournal: () => recoverJournal
});
function journalPath(journalDir, id) {
	return (0, node_path.join)(journalDir, `${id}.json`);
}
function readJournal(file) {
	try {
		const parsed = JSON.parse((0, node_fs.readFileSync)(file, "utf8"));
		return typeof parsed.id === "string" && typeof parsed.target === "string" ? parsed : null;
	} catch {
		return null;
	}
}
function listJournals(journalDir) {
	let names;
	try {
		names = (0, node_fs.readdirSync)(journalDir);
	} catch {
		return [];
	}
	return names.filter((name) => name.endsWith(".json")).map((name) => readJournal((0, node_path.join)(journalDir, name))).filter((journal) => journal !== null);
}
function hasJournals(journalDir) {
	return listJournals(journalDir).length > 0;
}
/**
* Applies one file change under a journal: backup and staged copy first, the journal, then the write.
* The journal and its sidecars disappear only after the target holds the intended bytes.
*/
function mutateFile(journalDir, kind, owner, target, content, mode = 420) {
	(0, node_fs.mkdirSync)(journalDir, {
		recursive: true,
		mode: 448
	});
	const id = `${kind}-${require_lease.newToken()}`;
	const original = captureMeta(target);
	let backup = null;
	if (original.type === "file") {
		backup = (0, node_path.join)(journalDir, `${id}.bak`);
		(0, node_fs.copyFileSync)(target, backup);
	}
	let staged = null;
	if (content !== null) {
		staged = (0, node_path.join)(journalDir, `${id}.new`);
		require_atomic.atomicWrite(staged, content, 384);
	}
	const journal = {
		id,
		kind,
		owner,
		target,
		original,
		intended: content === null ? null : sha256(content),
		staged,
		backup,
		mode,
		createdAt: (/* @__PURE__ */ new Date()).toISOString()
	};
	require_atomic.atomicWrite(journalPath(journalDir, id), JSON.stringify(journal), 384);
	apply(journal, content);
	discard(journalDir, journal);
}
function apply(journal, content) {
	if (content === null) {
		require_atomic.withSharingRetry(() => {
			if ((0, node_fs.existsSync)(journal.target)) (0, node_fs.unlinkSync)(journal.target);
		});
		return;
	}
	require_atomic.atomicWrite(journal.target, content, journal.mode);
}
function discard(journalDir, journal) {
	for (const sidecar of [journal.backup, journal.staged]) if (sidecar !== null) (0, node_fs.rmSync)(sidecar, { force: true });
	(0, node_fs.rmSync)(journalPath(journalDir, journal.id), { force: true });
}
function targetSha(target) {
	const meta = captureMeta(target);
	return meta.type === "file" ? meta.sha256 : null;
}
/**
* Finishes one journal (spec MUT-2): a target already at the intended bytes is done; one still at the
* original is replayed from the staged copy; anything else is left alone and reported as changed (MUT-5).
*/
function recoverJournal(journalDir, journal, report) {
	const current = targetSha(journal.target);
	const exists = captureMeta(journal.target).type !== "missing";
	if (journal.intended === null ? !exists : current === journal.intended) {
		discard(journalDir, journal);
		report.finished.push(journal.id);
		return;
	}
	if (metaMatches(journal.target, journal.original)) {
		if (journal.intended === null) {
			apply(journal, null);
			report.replayed.push(journal.id);
		} else if (journal.staged !== null && (0, node_fs.existsSync)(journal.staged) && sha256((0, node_fs.readFileSync)(journal.staged)) === journal.intended) {
			apply(journal, (0, node_fs.readFileSync)(journal.staged));
			report.replayed.push(journal.id);
		} else report.rolledBack.push(journal.id);
		discard(journalDir, journal);
		return;
	}
	report.changed.push(journal.target);
	discard(journalDir, journal);
}
/** Recovers every journal whose owner is dead on this machine; foreign and live ones are skipped. */
function recoverDeadJournals(journalDir, machineId, kinds) {
	const report = {
		finished: [],
		replayed: [],
		rolledBack: [],
		changed: [],
		skipped: []
	};
	for (const journal of listJournals(journalDir)) {
		if (kinds !== void 0 && !kinds.includes(journal.kind)) continue;
		if (journal.owner.machineId !== machineId || require_proc.isLive(journal.owner)) {
			report.skipped.push(journal.id);
			continue;
		}
		recoverJournal(journalDir, journal, report);
	}
	return report;
}
/** Recovers one journal the operator vouched for, whatever machine owns it (the `recover` command). */
function recoverForeignJournal(journalDir, id, confirmedMachineId) {
	const report = {
		finished: [],
		replayed: [],
		rolledBack: [],
		changed: [],
		skipped: []
	};
	const journal = readJournal(journalPath(journalDir, id));
	if (journal === null) throw new Error(`no journal ${id} in ${journalDir}`);
	if (journal.owner.machineId !== confirmedMachineId) throw new Error(`journal ${id} belongs to machine ${journal.owner.machineId}, not ${confirmedMachineId}`);
	recoverJournal(journalDir, journal, report);
	return report;
}
//#endregion
Object.defineProperty(exports, "MISSING", {
	enumerable: true,
	get: function() {
		return MISSING;
	}
});
Object.defineProperty(exports, "captureMeta", {
	enumerable: true,
	get: function() {
		return captureMeta;
	}
});
Object.defineProperty(exports, "journal_exports", {
	enumerable: true,
	get: function() {
		return journal_exports;
	}
});
Object.defineProperty(exports, "listJournals", {
	enumerable: true,
	get: function() {
		return listJournals;
	}
});
Object.defineProperty(exports, "metaMatches", {
	enumerable: true,
	get: function() {
		return metaMatches;
	}
});
Object.defineProperty(exports, "mutateFile", {
	enumerable: true,
	get: function() {
		return mutateFile;
	}
});
Object.defineProperty(exports, "recoverDeadJournals", {
	enumerable: true,
	get: function() {
		return recoverDeadJournals;
	}
});
Object.defineProperty(exports, "recoverForeignJournal", {
	enumerable: true,
	get: function() {
		return recoverForeignJournal;
	}
});
Object.defineProperty(exports, "sha256", {
	enumerable: true,
	get: function() {
		return sha256;
	}
});
