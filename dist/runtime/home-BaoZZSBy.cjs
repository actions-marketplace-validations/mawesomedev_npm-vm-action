const require_rolldown_runtime = require("./rolldown-runtime-BGT596CS.cjs");
let node_child_process = require("node:child_process");
let node_path = require("node:path");
let node_fs = require("node:fs");
let node_crypto = require("node:crypto");
let node_os = require("node:os");
//#region src/setup/home.ts
var home_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	cacheBase: () => cacheBase,
	defaultHome: () => defaultHome,
	readMachineId: () => readMachineId,
	resolveDirs: () => resolveDirs
});
function localAppData(env) {
	return env["LOCALAPPDATA"] ?? (0, node_path.join)((0, node_os.homedir)(), "AppData", "Local");
}
function defaultHome(env, platform = process.platform) {
	if (platform === "win32") return (0, node_path.join)(localAppData(env), "npm-vm");
	return (0, node_path.join)(env["XDG_DATA_HOME"] || (0, node_path.join)((0, node_os.homedir)(), ".local", "share"), "npm-vm");
}
function cacheBase(env, platform = process.platform) {
	if (platform === "win32") return (0, node_path.join)(localAppData(env), "npm-vm-cache");
	return (0, node_path.join)(env["XDG_CACHE_HOME"] || (0, node_path.join)((0, node_os.homedir)(), ".cache"), "npm-vm");
}
function platformId(platform, env) {
	try {
		if (platform === "linux") {
			for (const file of ["/etc/machine-id", "/var/lib/dbus/machine-id"]) try {
				const id = (0, node_fs.readFileSync)(file, "utf8").trim();
				if (id !== "") return id;
			} catch {}
			return null;
		}
		if (platform === "darwin") {
			const out = (0, node_child_process.execFileSync)("/usr/sbin/ioreg", [
				"-rd1",
				"-c",
				"IOPlatformExpertDevice"
			], {
				encoding: "utf8",
				env: { PATH: "/usr/bin:/bin:/usr/sbin:/sbin" }
			});
			return /"IOPlatformUUID"\s*=\s*"([^"]+)"/.exec(out)?.[1] ?? null;
		}
		if (platform === "win32") {
			const reg = (0, node_path.join)(env["SystemRoot"] ?? "C:\\Windows", "System32", "reg.exe");
			const out = (0, node_child_process.execFileSync)(reg, [
				"query",
				"HKLM\\SOFTWARE\\Microsoft\\Cryptography",
				"/v",
				"MachineGuid"
			], { encoding: "utf8" });
			return /MachineGuid\s+REG_SZ\s+(\S+)/.exec(out)?.[1] ?? null;
		}
	} catch {}
	return null;
}
/** The hashed machine id, or a hashed hostname when the platform id is unreadable. */
function readMachineId(env = process.env, platform = process.platform) {
	const raw = platformId(platform, env);
	const source = raw ?? (0, node_os.hostname)();
	return {
		id: (0, node_crypto.createHash)("sha256").update(source).digest("hex").slice(0, 16),
		fallback: raw === null
	};
}
function resolveDirs(env = process.env, home = env["NPM_VM_HOME"] || defaultHome(env), platform = process.platform, machine = readMachineId(env, platform)) {
	const absoluteHome = (0, node_path.resolve)(home);
	const state = (0, node_path.join)(absoluteHome, "state");
	return {
		home: absoluteHome,
		cache: (0, node_path.join)(cacheBase(env, platform), machine.id),
		state,
		tmp: (0, node_path.join)(state, "tmp"),
		journal: (0, node_path.join)(state, "journal"),
		machine
	};
}
//#endregion
Object.defineProperty(exports, "home_exports", {
	enumerable: true,
	get: function() {
		return home_exports;
	}
});
Object.defineProperty(exports, "resolveDirs", {
	enumerable: true,
	get: function() {
		return resolveDirs;
	}
});
