const require_rolldown_runtime = require("./rolldown-runtime-BGT596CS.cjs");
let node_child_process = require("node:child_process");
let node_path = require("node:path");
let node_fs = require("node:fs");
//#region src/state/proc.ts
var proc_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	isLive: () => isLive,
	ownIdentity: () => ownIdentity,
	powershellPath: () => powershellPath,
	shellBinary: () => shellBinary,
	startIdentity: () => startIdentity
});
function powershellPath(env = process.env) {
	return (0, node_path.join)(env["SystemRoot"] ?? "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
}
const SHELL_DIRS = [
	"/bin",
	"/usr/bin",
	"/usr/local/bin",
	"/opt/homebrew/bin",
	"/snap/bin"
];
/**
* An absolute path for a shell to probe (spec SEC-8): the login shell when `$SHELL` is absolute, else system dirs.
* Never PATH, which inside an npm script starts with `node_modules/.bin`.
*/
function shellBinary(shell, env = process.env, platform = process.platform) {
	const name = shell === "powershell" ? "pwsh" : shell;
	if (platform === "win32") {
		const pwsh = (0, node_path.join)(env["ProgramFiles"] ?? "C:\\Program Files", "PowerShell", "7", "pwsh.exe");
		return shell === "powershell" && (0, node_fs.existsSync)(pwsh) ? pwsh : null;
	}
	const login = env["SHELL"];
	return [...login !== void 0 && (0, node_path.isAbsolute)(login) && (0, node_path.basename)(login) === name ? [login] : [], ...SHELL_DIRS.map((dir) => (0, node_path.join)(dir, name))].find((candidate) => (0, node_fs.existsSync)(candidate)) ?? null;
}
/** The start identity of `pid`, or null when the lookup fails or is ambiguous. */
function startIdentity(pid, platform = process.platform, env = process.env) {
	try {
		if (platform === "linux") {
			const stat = (0, node_fs.readFileSync)(`/proc/${pid}/stat`, "utf8");
			const start = stat.slice(stat.lastIndexOf(")") + 1).trim().split(/\s+/)[19];
			return start !== void 0 && /^\d+$/.test(start) ? start : null;
		}
		if (platform === "darwin") {
			const out = (0, node_child_process.execFileSync)("/bin/ps", [
				"-o",
				"lstart=",
				"-p",
				String(pid)
			], {
				encoding: "utf8",
				env: {
					LC_ALL: "C",
					PATH: "/usr/bin:/bin"
				}
			}).trim();
			return out === "" || out.includes("\n") ? null : out;
		}
		if (platform === "win32") {
			const out = (0, node_child_process.execFileSync)(powershellPath(env), [
				"-NoProfile",
				"-NonInteractive",
				"-Command",
				`(Get-Process -Id ${pid}).StartTime.ToFileTimeUtc()`
			], {
				encoding: "utf8",
				windowsHide: true
			}).trim();
			return /^\d+$/.test(out) ? out : null;
		}
	} catch {
		return null;
	}
	return null;
}
function ownIdentity(platform, env) {
	return {
		pid: process.pid,
		start: startIdentity(process.pid, platform, env)
	};
}
/**
* Whether the recorded process still runs: dead only when the PID is gone or its start identity differs.
* Any failure to look up means live, so nothing ever expires a process that merely cannot be inspected.
*/
function isLive(identity, platform = process.platform) {
	try {
		process.kill(identity.pid, 0);
	} catch (error) {
		if (error.code === "ESRCH") return false;
		return true;
	}
	if (identity.start === null) return true;
	const current = startIdentity(identity.pid, platform);
	return current === null || current === identity.start;
}
//#endregion
Object.defineProperty(exports, "isLive", {
	enumerable: true,
	get: function() {
		return isLive;
	}
});
Object.defineProperty(exports, "ownIdentity", {
	enumerable: true,
	get: function() {
		return ownIdentity;
	}
});
Object.defineProperty(exports, "powershellPath", {
	enumerable: true,
	get: function() {
		return powershellPath;
	}
});
Object.defineProperty(exports, "proc_exports", {
	enumerable: true,
	get: function() {
		return proc_exports;
	}
});
Object.defineProperty(exports, "shellBinary", {
	enumerable: true,
	get: function() {
		return shellBinary;
	}
});
