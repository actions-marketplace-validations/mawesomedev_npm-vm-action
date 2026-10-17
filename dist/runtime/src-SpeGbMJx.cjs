const require_messages = require("./messages-vUDkl1-0.cjs");
const require_install = require("./install-C_M5WK98.cjs");
let node_path = require("node:path");
let node_fs = require("node:fs");
//#region src/project.ts
const BOOLEANS = /* @__PURE__ */ new Set(["global", "workspaces"]);
const SHORTHANDS = {
	C: "prefix",
	g: "global",
	L: "location",
	ws: "workspaces"
};
/**
* The subset of nopt that decides the prefix: `--flag value`, `--flag=value`, `--no-flag`, `--flag true|false` for booleans, npm's shorthands and `--`.
* Later flags win, as in nopt.
*/
function parsePrefixFlags(argv, cwd) {
	const flags = {
		prefix: null,
		global: null,
		location: null,
		workspaces: null
	};
	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (arg === "--") break;
		let name;
		let value = null;
		if (arg.startsWith("--")) {
			const eq = arg.indexOf("=");
			name = eq === -1 ? arg.slice(2) : arg.slice(2, eq);
			value = eq === -1 ? null : arg.slice(eq + 1);
			name = SHORTHANDS[name] ?? name;
		} else if (arg.startsWith("-") && arg.length > 1 && SHORTHANDS[arg.slice(1)] !== void 0) name = SHORTHANDS[arg.slice(1)];
		else continue;
		let negated = false;
		if (name.startsWith("no-") && BOOLEANS.has(name.slice(3))) {
			negated = true;
			name = name.slice(3);
		}
		if (BOOLEANS.has(name)) {
			let bool = !negated;
			if (value !== null) bool = value !== "false";
			else if (!negated && (argv[i + 1] === "true" || argv[i + 1] === "false")) {
				bool = argv[i + 1] === "true";
				i += 1;
			}
			if (name === "global") flags.global = bool;
			else flags.workspaces = bool;
			continue;
		}
		if (name !== "prefix" && name !== "location") continue;
		if (value === null) {
			if (i + 1 >= argv.length) continue;
			value = argv[i + 1];
			i += 1;
		}
		if (name === "prefix") flags.prefix = (0, node_path.resolve)(cwd, value);
		else flags.location = value;
	}
	return flags;
}
/** Global mode from the command line and the npm env, CLI winning (spec RES-3). */
function isGlobalMode(flags, env) {
	const fromEnv = env["npm_config_global"];
	const global = flags.global ?? (fromEnv === void 0 || fromEnv === "" ? null : ![
		"false",
		"0",
		"null"
	].includes(fromEnv));
	const location = flags.location ?? env["npm_config_location"] ?? null;
	return global === true || location === "global";
}
function hasPackageJson(dir) {
	try {
		return (0, node_fs.statSync)((0, node_path.join)(dir, "package.json")).isFile();
	} catch {
		return false;
	}
}
function hasNodeModules(dir) {
	try {
		return (0, node_fs.statSync)((0, node_path.join)(dir, "node_modules")).isDirectory();
	} catch {
		return false;
	}
}
function* walkUp(start) {
	let dir = (0, node_path.resolve)(start);
	for (;;) {
		yield dir;
		const parent = (0, node_path.dirname)(dir);
		if (parent === dir) return;
		dir = parent;
	}
}
/** The `workspaces` patterns of a manifest: the array form or `{ packages: [] }`, else none. */
function workspacePatterns(pkg) {
	if (typeof pkg !== "object" || pkg === null) return [];
	let raw = pkg.workspaces;
	if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) raw = raw.packages;
	if (!Array.isArray(raw)) return [];
	return raw.filter((entry) => typeof entry === "string");
}
/**
* Whether `candidate` is one of the workspaces `root` declares, matched like `@npmcli/map-workspaces`.
* A pattern selects directories holding a `package.json`, `!pattern` removes matches, and `node_modules` never matches.
*/
function isWorkspaceOf(root, candidate, patterns) {
	const rel = (0, node_path.relative)(root, candidate);
	if (rel === "" || rel.startsWith("..") || (0, node_path.isAbsolute)(rel) || !hasPackageJson(candidate)) return false;
	if (rel.split(node_path.sep).includes("node_modules")) return false;
	const posix = rel.split(node_path.sep).join("/");
	const { positive, negative } = splitPatterns(patterns);
	return positive.some((pattern) => (0, node_path.matchesGlob)(posix, pattern)) && !negative.some((pattern) => (0, node_path.matchesGlob)(posix, pattern));
}
function splitPatterns(patterns) {
	const positive = [];
	const negative = [];
	for (const raw of patterns) {
		const bangs = /^!+/.exec(raw)?.[0].length ?? 0;
		const pattern = normalizePattern(raw.slice(bangs));
		if (bangs % 2 === 1) {
			negative.push(pattern);
			continue;
		}
		for (let i = negative.length - 1; i >= 0; i -= 1) if ((0, node_path.matchesGlob)(pattern, negative[i])) negative.splice(i, 1);
		positive.push(pattern);
	}
	return {
		positive,
		negative
	};
}
function normalizePattern(pattern) {
	return pattern.replace(/\\/g, "/").replace(/^\.?\/+/, "").replace(/\/+$/, "");
}
function readManifest(dir) {
	try {
		return JSON.parse((0, node_fs.readFileSync)((0, node_path.join)(dir, "package.json"), "utf8"));
	} catch {
		return null;
	}
}
/**
* Mirrors `@npmcli/config` `loadLocalPrefix` (spec RES-2): a CLI prefix is final.
* Otherwise the nearest ancestor with `package.json` or `node_modules` wins, promoted to a parent whose `workspaces` include it unless `--no-workspaces` or global mode.
*/
function findProject(argv, cwd, env = process.env) {
	const flags = parsePrefixFlags(argv, cwd);
	const global = isGlobalMode(flags, env);
	if (flags.prefix !== null) return {
		root: flags.prefix,
		global,
		cliPrefix: flags.prefix
	};
	let localPrefix = null;
	for (const dir of walkUp(cwd)) {
		const manifest = hasPackageJson(dir);
		if (localPrefix === null) {
			if (manifest || hasNodeModules(dir)) {
				localPrefix = dir;
				if (flags.workspaces === false || global) break;
			}
			continue;
		}
		if (!manifest) continue;
		const pkg = readManifest(dir);
		if (pkg !== null && isWorkspaceOf(dir, localPrefix, workspacePatterns(pkg))) {
			localPrefix = dir;
			break;
		}
	}
	return {
		root: localPrefix ?? (0, node_path.resolve)(cwd),
		global,
		cliPrefix: null
	};
}
//#endregion
//#region src/index.ts
/** Resolves the npm to run for `argv` in `cwd` (spec section 5); writes only under the cache, spawns npm only as the transport. */
function resolveNpm(argv, cwd, options = {}) {
	const env = options.env ?? process.env;
	return resolveNpmWith(argv, cwd, options, require_install.createInstaller(require_install.createContext(env, options.home)));
}
async function resolveNpmWith(argv, cwd, options, providers) {
	const env = options.env ?? process.env;
	const own = providers.ownNpm();
	const ownResult = (projectRoot, source, warning) => {
		if (own === null) throw new require_messages.NpmVmError("M-TRANSPORT", require_messages.EXIT.transport, "No npm found beside the active Node; reinstall Node.");
		return {
			kind: "own",
			version: own.version,
			cliPath: own.cliPath,
			source,
			projectRoot,
			selection: null,
			specs: null,
			warning
		};
	};
	if (nonEmpty(env["NPM_VM_DISABLE"])) return ownResult(null, null, null);
	const project = findProject(argv, cwd, env);
	if (project.global) return ownResult(project.root, null, null);
	let parsed;
	let source;
	if (nonEmpty(env["NPM_VM_VERSION"])) {
		parsed = {
			specs: [require_install.parseVersionSpec(env["NPM_VM_VERSION"], "NPM_VM_VERSION")],
			onFail: "error",
			field: "devEngines"
		};
		source = {
			file: "NPM_VM_VERSION",
			field: "env"
		};
	} else {
		const file = (0, node_path.join)(project.root, "package.json");
		let read;
		try {
			read = readSpecs(file);
		} catch (error) {
			if (!(error instanceof require_install.SpecError)) throw error;
			const message = `${file}: ${error.message}`;
			const failure = new require_messages.NpmVmError("M-NOMATCH", require_messages.EXIT.resolution, message);
			return applyPolicy(error.onFail, failure, () => ownResult(project.root, null, message));
		}
		if (read === null) return ownResult(project.root, null, null);
		parsed = read;
		source = {
			file,
			field: read.field
		};
	}
	if (own !== null && require_install.ownNpmSatisfies(own.version, parsed.specs)) return ownResult(project.root, source, null);
	const cached = await providers.cached(parsed.specs);
	let result = require_install.selectCandidate(parsed.specs, cached, providers.nodeVersion);
	if (result.kind === "failed" && !options.offline && !nonEmpty(env["NPM_VM_OFFLINE"])) {
		let fromRegistry;
		try {
			fromRegistry = await providers.registry(parsed.specs);
		} catch (error) {
			if (!(error instanceof require_messages.NpmVmError) || error.id !== "M-TRANSPORT") throw error;
			return applyPolicy(parsed.onFail, error, () => ownResult(project.root, source, error.message));
		}
		result = require_install.selectCandidate(parsed.specs, fromRegistry, providers.nodeVersion);
	}
	if (result.kind === "selected") {
		const { candidate } = result.selection;
		const entry = candidate.entryPath ?? providers.entryPathFor(candidate);
		return {
			kind: candidate.entryPath === null ? "download" : "cached",
			version: candidate.version,
			cliPath: (0, node_path.join)(entry, "bin", "npm-cli.js"),
			source,
			projectRoot: project.root,
			selection: result.selection,
			specs: parsed.specs,
			warning: null
		};
	}
	const message = result.failure.kind === "engine" ? require_messages.engineMessage(result.failure.version, result.failure.enginesNode, providers.nodeVersion) : require_messages.noMatchMessage(parsed.specs, source.file, result.failure.reason);
	const id = result.failure.kind === "engine" ? "M-ENGINE" : "M-NOMATCH";
	const failure = new require_messages.NpmVmError(id, require_messages.EXIT.resolution, message);
	return applyPolicy(parsed.onFail, failure, () => ownResult(project.root, source, message));
}
/** `onFail` makes a failed resolution fatal, a warning before Node's own npm, or silent (spec RES-7). */
function applyPolicy(onFail, failure, fallback) {
	if (onFail === "ignore") return {
		...fallback(),
		warning: null
	};
	if (onFail === "warn") return fallback();
	throw failure;
}
/** Reads and validates the project's specs; a broken file or range follows its own `onFail` when readable, else errors. */
function readSpecs(file) {
	let text;
	try {
		text = (0, node_fs.readFileSync)(file, "utf8");
	} catch {
		return null;
	}
	let pkg;
	try {
		pkg = JSON.parse(text);
	} catch (error) {
		throw new require_messages.NpmVmError("M-NOMATCH", require_messages.EXIT.resolution, `${file} is not valid JSON: ${error.message}`);
	}
	return require_install.parseSpecs(pkg);
}
function nonEmpty(value) {
	return value !== void 0 && value !== "";
}
//#endregion
Object.defineProperty(exports, "findProject", {
	enumerable: true,
	get: function() {
		return findProject;
	}
});
Object.defineProperty(exports, "resolveNpm", {
	enumerable: true,
	get: function() {
		return resolveNpm;
	}
});
Object.defineProperty(exports, "resolveNpmWith", {
	enumerable: true,
	get: function() {
		return resolveNpmWith;
	}
});
