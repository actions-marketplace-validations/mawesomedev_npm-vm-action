const require_rolldown_runtime = require("./rolldown-runtime-BGT596CS.cjs");
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/internal/constants.js
var require_constants = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	module.exports = {
		MAX_LENGTH: 256,
		MAX_SAFE_COMPONENT_LENGTH: 16,
		MAX_SAFE_BUILD_LENGTH: 250,
		MAX_SAFE_INTEGER: Number.MAX_SAFE_INTEGER || 
		/* istanbul ignore next */ 9007199254740991,
		RELEASE_TYPES: [
			"major",
			"premajor",
			"minor",
			"preminor",
			"patch",
			"prepatch",
			"prerelease"
		],
		SEMVER_SPEC_VERSION: "2.0.0",
		FLAG_INCLUDE_PRERELEASE: 1,
		FLAG_LOOSE: 2
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/internal/debug.js
var require_debug = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	module.exports = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {};
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/internal/re.js
var require_re = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const { MAX_SAFE_COMPONENT_LENGTH, MAX_SAFE_BUILD_LENGTH, MAX_LENGTH } = require_constants();
	const debug = require_debug();
	exports = module.exports = {};
	const re = exports.re = [];
	const safeRe = exports.safeRe = [];
	const src = exports.src = [];
	const safeSrc = exports.safeSrc = [];
	const t = exports.t = {};
	let R = 0;
	const LETTERDASHNUMBER = "[a-zA-Z0-9-]";
	const safeRegexReplacements = [
		["\\s", 1],
		["\\d", MAX_LENGTH],
		[LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH]
	];
	const makeSafeRegex = (value) => {
		for (const [token, max] of safeRegexReplacements) value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
		return value;
	};
	const createToken = (name, value, isGlobal) => {
		const safe = makeSafeRegex(value);
		const index = R++;
		debug(name, index, value);
		t[name] = index;
		src[index] = value;
		safeSrc[index] = safe;
		re[index] = new RegExp(value, isGlobal ? "g" : void 0);
		safeRe[index] = new RegExp(safe, isGlobal ? "g" : void 0);
	};
	createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*");
	createToken("NUMERICIDENTIFIERLOOSE", "\\d+");
	createToken("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
	createToken("MAINVERSION", `(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})`);
	createToken("MAINVERSIONLOOSE", `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})`);
	createToken("PRERELEASEIDENTIFIER", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIER]})`);
	createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIERLOOSE]})`);
	createToken("PRERELEASE", `(?:-(${src[t.PRERELEASEIDENTIFIER]}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);
	createToken("PRERELEASELOOSE", `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);
	createToken("BUILDIDENTIFIER", `${LETTERDASHNUMBER}+`);
	createToken("BUILD", `(?:\\+(${src[t.BUILDIDENTIFIER]}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);
	createToken("FULLPLAIN", `v?${src[t.MAINVERSION]}${src[t.PRERELEASE]}?${src[t.BUILD]}?`);
	createToken("FULL", `^${src[t.FULLPLAIN]}$`);
	createToken("LOOSEPLAIN", `[v=\\s]*${src[t.MAINVERSIONLOOSE]}${src[t.PRERELEASELOOSE]}?${src[t.BUILD]}?`);
	createToken("LOOSE", `^${src[t.LOOSEPLAIN]}$`);
	createToken("GTLT", "((?:<|>)?=?)");
	createToken("XRANGEIDENTIFIERLOOSE", `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
	createToken("XRANGEIDENTIFIER", `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);
	createToken("XRANGEPLAIN", `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:${src[t.PRERELEASE]})?${src[t.BUILD]}?)?)?`);
	createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:${src[t.PRERELEASELOOSE]})?${src[t.BUILD]}?)?)?`);
	createToken("XRANGE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
	createToken("XRANGELOOSE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);
	createToken("COERCEPLAIN", `(^|[^\\d])(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
	createToken("COERCE", `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
	createToken("COERCEFULL", src[t.COERCEPLAIN] + `(?:${src[t.PRERELEASE]})?(?:${src[t.BUILD]})?(?:$|[^\\d])`);
	createToken("COERCERTL", src[t.COERCE], true);
	createToken("COERCERTLFULL", src[t.COERCEFULL], true);
	createToken("LONETILDE", "(?:~>?)");
	createToken("TILDETRIM", `(\\s*)${src[t.LONETILDE]}\\s+`, true);
	exports.tildeTrimReplace = "$1~";
	createToken("TILDE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
	createToken("TILDELOOSE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);
	createToken("LONECARET", "(?:\\^)");
	createToken("CARETTRIM", `(\\s*)${src[t.LONECARET]}\\s+`, true);
	exports.caretTrimReplace = "$1^";
	createToken("CARET", `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
	createToken("CARETLOOSE", `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);
	createToken("COMPARATORLOOSE", `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
	createToken("COMPARATOR", `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);
	createToken("COMPARATORTRIM", `(\\s*)${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
	exports.comparatorTrimReplace = "$1$2$3";
	createToken("HYPHENRANGE", `^\\s*(${src[t.XRANGEPLAIN]})\\s+-\\s+(${src[t.XRANGEPLAIN]})\\s*$`);
	createToken("HYPHENRANGELOOSE", `^\\s*(${src[t.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t.XRANGEPLAINLOOSE]})\\s*$`);
	createToken("STAR", "(<|>)?=?\\s*\\*");
	createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$");
	createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/internal/parse-options.js
var require_parse_options = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const looseOption = Object.freeze({ loose: true });
	const emptyOpts = Object.freeze({});
	const parseOptions = (options) => {
		if (!options) return emptyOpts;
		if (typeof options !== "object") return looseOption;
		return options;
	};
	module.exports = parseOptions;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/internal/identifiers.js
var require_identifiers = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const numeric = /^[0-9]+$/;
	const compareIdentifiers = (a, b) => {
		if (typeof a === "number" && typeof b === "number") return a === b ? 0 : a < b ? -1 : 1;
		const anum = numeric.test(a);
		const bnum = numeric.test(b);
		if (anum && bnum) {
			a = +a;
			b = +b;
		}
		return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
	};
	const rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);
	module.exports = {
		compareIdentifiers,
		rcompareIdentifiers
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/classes/semver.js
var require_semver$1 = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const debug = require_debug();
	const { MAX_LENGTH, MAX_SAFE_INTEGER } = require_constants();
	const { safeRe: re, t } = require_re();
	const parseOptions = require_parse_options();
	const { compareIdentifiers } = require_identifiers();
	const isPrereleaseIdentifier = (prerelease, identifier) => {
		const identifiers = identifier.split(".");
		if (identifiers.length > prerelease.length) return false;
		for (let i = 0; i < identifiers.length; i++) if (compareIdentifiers(prerelease[i], identifiers[i]) !== 0) return false;
		return true;
	};
	module.exports = class SemVer {
		constructor(version, options) {
			options = parseOptions(options);
			if (version instanceof SemVer) {
				if (version.loose === !!options.loose && version.includePrerelease === !!options.includePrerelease) return version;
				else version = version.version;
			} else if (typeof version !== "string") throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`);
			if (version.length > MAX_LENGTH) throw new TypeError(`version is longer than ${MAX_LENGTH} characters`);
			debug("SemVer", version, options);
			this.options = options;
			this.loose = !!options.loose;
			this.includePrerelease = !!options.includePrerelease;
			const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);
			if (!m) throw new TypeError(`Invalid Version: ${version}`);
			this.raw = version;
			this.major = +m[1];
			this.minor = +m[2];
			this.patch = +m[3];
			if (this.major > MAX_SAFE_INTEGER || this.major < 0) throw new TypeError("Invalid major version");
			if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) throw new TypeError("Invalid minor version");
			if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) throw new TypeError("Invalid patch version");
			if (!m[4]) this.prerelease = [];
			else this.prerelease = m[4].split(".").map((id) => {
				if (/^[0-9]+$/.test(id)) {
					const num = +id;
					if (num >= 0 && num < MAX_SAFE_INTEGER) return num;
				}
				return id;
			});
			this.build = m[5] ? m[5].split(".") : [];
			this.format();
		}
		format() {
			this.version = `${this.major}.${this.minor}.${this.patch}`;
			if (this.prerelease.length) this.version += `-${this.prerelease.join(".")}`;
			return this.version;
		}
		toString() {
			return this.version;
		}
		compare(other) {
			debug("SemVer.compare", this.version, this.options, other);
			if (!(other instanceof SemVer)) {
				if (typeof other === "string" && other === this.version) return 0;
				other = new SemVer(other, this.options);
			}
			if (other.version === this.version) return 0;
			return this.compareMain(other) || this.comparePre(other);
		}
		compareMain(other) {
			if (!(other instanceof SemVer)) other = new SemVer(other, this.options);
			if (this.major < other.major) return -1;
			if (this.major > other.major) return 1;
			if (this.minor < other.minor) return -1;
			if (this.minor > other.minor) return 1;
			if (this.patch < other.patch) return -1;
			if (this.patch > other.patch) return 1;
			return 0;
		}
		comparePre(other) {
			if (!(other instanceof SemVer)) other = new SemVer(other, this.options);
			if (this.prerelease.length && !other.prerelease.length) return -1;
			else if (!this.prerelease.length && other.prerelease.length) return 1;
			else if (!this.prerelease.length && !other.prerelease.length) return 0;
			let i = 0;
			do {
				const a = this.prerelease[i];
				const b = other.prerelease[i];
				debug("prerelease compare", i, a, b);
				if (a === void 0 && b === void 0) return 0;
				else if (b === void 0) return 1;
				else if (a === void 0) return -1;
				else if (a === b) continue;
				else return compareIdentifiers(a, b);
			} while (++i);
		}
		compareBuild(other) {
			if (!(other instanceof SemVer)) other = new SemVer(other, this.options);
			let i = 0;
			do {
				const a = this.build[i];
				const b = other.build[i];
				debug("build compare", i, a, b);
				if (a === void 0 && b === void 0) return 0;
				else if (b === void 0) return 1;
				else if (a === void 0) return -1;
				else if (a === b) continue;
				else return compareIdentifiers(a, b);
			} while (++i);
		}
		inc(release, identifier, identifierBase) {
			if (release.startsWith("pre")) {
				if (!identifier && identifierBase === false) throw new Error("invalid increment argument: identifier is empty");
				if (identifier) {
					const match = `-${identifier}`.match(this.options.loose ? re[t.PRERELEASELOOSE] : re[t.PRERELEASE]);
					if (!match || match[1] !== identifier) throw new Error(`invalid identifier: ${identifier}`);
				}
			}
			switch (release) {
				case "premajor":
					this.prerelease.length = 0;
					this.patch = 0;
					this.minor = 0;
					this.major++;
					this.inc("pre", identifier, identifierBase);
					break;
				case "preminor":
					this.prerelease.length = 0;
					this.patch = 0;
					this.minor++;
					this.inc("pre", identifier, identifierBase);
					break;
				case "prepatch":
					this.prerelease.length = 0;
					this.inc("patch", identifier, identifierBase);
					this.inc("pre", identifier, identifierBase);
					break;
				case "prerelease":
					if (this.prerelease.length === 0) this.inc("patch", identifier, identifierBase);
					this.inc("pre", identifier, identifierBase);
					break;
				case "release":
					if (this.prerelease.length === 0) throw new Error(`version ${this.raw} is not a prerelease`);
					this.prerelease.length = 0;
					break;
				case "major":
					if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) this.major++;
					this.minor = 0;
					this.patch = 0;
					this.prerelease = [];
					break;
				case "minor":
					if (this.patch !== 0 || this.prerelease.length === 0) this.minor++;
					this.patch = 0;
					this.prerelease = [];
					break;
				case "patch":
					if (this.prerelease.length === 0) this.patch++;
					this.prerelease = [];
					break;
				case "pre": {
					const base = Number(identifierBase) ? 1 : 0;
					if (this.prerelease.length === 0) this.prerelease = [base];
					else {
						let i = this.prerelease.length;
						while (--i >= 0) if (typeof this.prerelease[i] === "number") {
							this.prerelease[i]++;
							i = -2;
						}
						if (i === -1) {
							if (identifier === this.prerelease.join(".") && identifierBase === false) throw new Error("invalid increment argument: identifier already exists");
							this.prerelease.push(base);
						}
					}
					if (identifier) {
						let prerelease = [identifier, base];
						if (identifierBase === false) prerelease = [identifier];
						if (isPrereleaseIdentifier(this.prerelease, identifier)) {
							const prereleaseBase = this.prerelease[identifier.split(".").length];
							if (isNaN(prereleaseBase)) this.prerelease = prerelease;
						} else this.prerelease = prerelease;
					}
					break;
				}
				default: throw new Error(`invalid increment argument: ${release}`);
			}
			this.raw = this.format();
			if (this.build.length) this.raw += `+${this.build.join(".")}`;
			return this;
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/parse.js
var require_parse = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const SemVer = require_semver$1();
	const parse = (version, options, throwErrors = false) => {
		if (version instanceof SemVer) return version;
		try {
			return new SemVer(version, options);
		} catch (er) {
			if (!throwErrors) return null;
			throw er;
		}
	};
	module.exports = parse;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/valid.js
var require_valid$1 = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const parse = require_parse();
	const valid = (version, options) => {
		const v = parse(version, options);
		return v ? v.version : null;
	};
	module.exports = valid;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/clean.js
var require_clean = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const parse = require_parse();
	const clean = (version, options) => {
		const s = parse(version.trim().replace(/^[=v]+/, ""), options);
		return s ? s.version : null;
	};
	module.exports = clean;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/inc.js
var require_inc = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const SemVer = require_semver$1();
	const inc = (version, release, options, identifier, identifierBase) => {
		if (typeof options === "string") {
			identifierBase = identifier;
			identifier = options;
			options = void 0;
		}
		try {
			return new SemVer(version instanceof SemVer ? version.version : version, options).inc(release, identifier, identifierBase).version;
		} catch (er) {
			return null;
		}
	};
	module.exports = inc;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/diff.js
var require_diff = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const parse = require_parse();
	const diff = (version1, version2) => {
		const v1 = parse(version1, null, true);
		const v2 = parse(version2, null, true);
		const comparison = v1.compare(v2);
		if (comparison === 0) return null;
		const v1Higher = comparison > 0;
		const highVersion = v1Higher ? v1 : v2;
		const lowVersion = v1Higher ? v2 : v1;
		const highHasPre = !!highVersion.prerelease.length;
		if (!!lowVersion.prerelease.length && !highHasPre) {
			if (!lowVersion.patch && !lowVersion.minor) return "major";
			if (lowVersion.compareMain(highVersion) === 0) {
				if (lowVersion.minor && !lowVersion.patch) return "minor";
				return "patch";
			}
		}
		const prefix = highHasPre ? "pre" : "";
		if (v1.major !== v2.major) return prefix + "major";
		if (v1.minor !== v2.minor) return prefix + "minor";
		if (v1.patch !== v2.patch) return prefix + "patch";
		return "prerelease";
	};
	module.exports = diff;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/major.js
var require_major = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const SemVer = require_semver$1();
	const major = (a, loose) => new SemVer(a, loose).major;
	module.exports = major;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/minor.js
var require_minor = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const SemVer = require_semver$1();
	const minor = (a, loose) => new SemVer(a, loose).minor;
	module.exports = minor;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/patch.js
var require_patch = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const SemVer = require_semver$1();
	const patch = (a, loose) => new SemVer(a, loose).patch;
	module.exports = patch;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/prerelease.js
var require_prerelease = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const parse = require_parse();
	const prerelease = (version, options) => {
		const parsed = parse(version, options);
		return parsed && parsed.prerelease.length ? parsed.prerelease : null;
	};
	module.exports = prerelease;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/compare.js
var require_compare = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const SemVer = require_semver$1();
	const compare = (a, b, loose) => new SemVer(a, loose).compare(new SemVer(b, loose));
	module.exports = compare;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/rcompare.js
var require_rcompare = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const compare = require_compare();
	const rcompare = (a, b, loose) => compare(b, a, loose);
	module.exports = rcompare;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/compare-loose.js
var require_compare_loose = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const compare = require_compare();
	const compareLoose = (a, b) => compare(a, b, true);
	module.exports = compareLoose;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/compare-build.js
var require_compare_build = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const SemVer = require_semver$1();
	const compareBuild = (a, b, loose) => {
		const versionA = new SemVer(a, loose);
		const versionB = new SemVer(b, loose);
		return versionA.compare(versionB) || versionA.compareBuild(versionB);
	};
	module.exports = compareBuild;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/sort.js
var require_sort = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const compareBuild = require_compare_build();
	const sort = (list, loose) => list.sort((a, b) => compareBuild(a, b, loose));
	module.exports = sort;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/rsort.js
var require_rsort = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const compareBuild = require_compare_build();
	const rsort = (list, loose) => list.sort((a, b) => compareBuild(b, a, loose));
	module.exports = rsort;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/gt.js
var require_gt = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const compare = require_compare();
	const gt = (a, b, loose) => compare(a, b, loose) > 0;
	module.exports = gt;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/lt.js
var require_lt = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const compare = require_compare();
	const lt = (a, b, loose) => compare(a, b, loose) < 0;
	module.exports = lt;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/eq.js
var require_eq = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const compare = require_compare();
	const eq = (a, b, loose) => compare(a, b, loose) === 0;
	module.exports = eq;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/neq.js
var require_neq = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const compare = require_compare();
	const neq = (a, b, loose) => compare(a, b, loose) !== 0;
	module.exports = neq;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/gte.js
var require_gte = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const compare = require_compare();
	const gte = (a, b, loose) => compare(a, b, loose) >= 0;
	module.exports = gte;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/lte.js
var require_lte = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const compare = require_compare();
	const lte = (a, b, loose) => compare(a, b, loose) <= 0;
	module.exports = lte;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/cmp.js
var require_cmp = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const eq = require_eq();
	const neq = require_neq();
	const gt = require_gt();
	const gte = require_gte();
	const lt = require_lt();
	const lte = require_lte();
	const cmp = (a, op, b, loose) => {
		switch (op) {
			case "===":
				if (typeof a === "object") a = a.version;
				if (typeof b === "object") b = b.version;
				return a === b;
			case "!==":
				if (typeof a === "object") a = a.version;
				if (typeof b === "object") b = b.version;
				return a !== b;
			case "":
			case "=":
			case "==": return eq(a, b, loose);
			case "!=": return neq(a, b, loose);
			case ">": return gt(a, b, loose);
			case ">=": return gte(a, b, loose);
			case "<": return lt(a, b, loose);
			case "<=": return lte(a, b, loose);
			default: throw new TypeError(`Invalid operator: ${op}`);
		}
	};
	module.exports = cmp;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/coerce.js
var require_coerce = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const SemVer = require_semver$1();
	const parse = require_parse();
	const { safeRe: re, t } = require_re();
	const coerce = (version, options) => {
		if (version instanceof SemVer) return version;
		if (typeof version === "number") version = String(version);
		if (typeof version !== "string") return null;
		options = options || {};
		let match = null;
		if (!options.rtl) match = version.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
		else {
			const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
			let next;
			while ((next = coerceRtlRegex.exec(version)) && (!match || match.index + match[0].length !== version.length)) {
				if (!match || next.index + next[0].length !== match.index + match[0].length) match = next;
				coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
			}
			coerceRtlRegex.lastIndex = -1;
		}
		if (match === null) return null;
		const major = match[2];
		const minor = match[3] || "0";
		const patch = match[4] || "0";
		const prerelease = options.includePrerelease && match[5] ? `-${match[5]}` : "";
		const build = options.includePrerelease && match[6] ? `+${match[6]}` : "";
		return parse(`${major}.${minor}.${patch}${prerelease}${build}`, options);
	};
	module.exports = coerce;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/truncate.js
var require_truncate = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const parse = require_parse();
	const constants = require_constants();
	const SemVer = require_semver$1();
	const truncate = (version, truncation, options) => {
		if (!constants.RELEASE_TYPES.includes(truncation)) return null;
		const clonedVersion = cloneInputVersion(version, options);
		return clonedVersion && doTruncation(clonedVersion, truncation);
	};
	const cloneInputVersion = (version, options) => {
		const versionStringToParse = version instanceof SemVer ? version.version : version;
		return parse(versionStringToParse, options);
	};
	const doTruncation = (version, truncation) => {
		if (isPrerelease(truncation)) return version.version;
		version.prerelease = [];
		switch (truncation) {
			case "major":
				version.minor = 0;
				version.patch = 0;
				break;
			case "minor": version.patch = 0;
		}
		return version.format();
	};
	const isPrerelease = (type) => {
		return type.startsWith("pre");
	};
	module.exports = truncate;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/internal/lrucache.js
var require_lrucache = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	var LRUCache = class {
		constructor() {
			this.max = 1e3;
			this.map = /* @__PURE__ */ new Map();
		}
		get(key) {
			const value = this.map.get(key);
			if (value === void 0) return;
			else {
				this.map.delete(key);
				this.map.set(key, value);
				return value;
			}
		}
		delete(key) {
			return this.map.delete(key);
		}
		set(key, value) {
			if (!this.delete(key) && value !== void 0) {
				if (this.map.size >= this.max) {
					const firstKey = this.map.keys().next().value;
					this.delete(firstKey);
				}
				this.map.set(key, value);
			}
			return this;
		}
	};
	module.exports = LRUCache;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/classes/range.js
var require_range = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const SPACE_CHARACTERS = /\s+/g;
	module.exports = class Range {
		constructor(range, options) {
			options = parseOptions(options);
			if (range instanceof Range) {
				if (range.loose === !!options.loose && range.includePrerelease === !!options.includePrerelease) return range;
				else return new Range(range.raw, options);
			}
			if (range instanceof Comparator) {
				this.raw = range.value;
				this.set = [[range]];
				this.formatted = void 0;
				return this;
			}
			this.options = options;
			this.loose = !!options.loose;
			this.includePrerelease = !!options.includePrerelease;
			this.raw = range.trim().replace(SPACE_CHARACTERS, " ");
			this.set = this.raw.split("||").map((r) => this.parseRange(r.trim())).filter((c) => c.length);
			if (!this.set.length) throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
			if (this.set.length > 1) {
				const first = this.set[0];
				this.set = this.set.filter((c) => !isNullSet(c[0]));
				if (this.set.length === 0) this.set = [first];
				else if (this.set.length > 1) {
					for (const c of this.set) if (c.length === 1 && isAny(c[0])) {
						this.set = [c];
						break;
					}
				}
			}
			this.formatted = void 0;
		}
		get range() {
			if (this.formatted === void 0) {
				this.formatted = "";
				for (let i = 0; i < this.set.length; i++) {
					if (i > 0) this.formatted += "||";
					const comps = this.set[i];
					for (let k = 0; k < comps.length; k++) {
						if (k > 0) this.formatted += " ";
						this.formatted += comps[k].toString().trim();
					}
				}
			}
			return this.formatted;
		}
		format() {
			return this.range;
		}
		toString() {
			return this.range;
		}
		parseRange(range) {
			range = range.replace(BUILDSTRIPRE, "");
			const memoKey = ((this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) | (this.options.loose && FLAG_LOOSE)) + ":" + range;
			const cached = cache.get(memoKey);
			if (cached) return cached;
			const loose = this.options.loose;
			const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
			range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
			debug("hyphen replace", range);
			range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
			debug("comparator trim", range);
			range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
			debug("tilde trim", range);
			range = range.replace(re[t.CARETTRIM], caretTrimReplace);
			debug("caret trim", range);
			let rangeList = range.split(" ").map((comp) => parseComparator(comp, this.options)).join(" ").split(/\s+/).map((comp) => replaceGTE0(comp, this.options));
			if (loose) rangeList = rangeList.filter((comp) => {
				debug("loose invalid filter", comp, this.options);
				return !!comp.match(re[t.COMPARATORLOOSE]);
			});
			debug("range list", rangeList);
			const rangeMap = /* @__PURE__ */ new Map();
			const comparators = rangeList.map((comp) => new Comparator(comp, this.options));
			for (const comp of comparators) {
				if (isNullSet(comp)) return [comp];
				rangeMap.set(comp.value, comp);
			}
			if (rangeMap.size > 1 && rangeMap.has("")) rangeMap.delete("");
			const result = [...rangeMap.values()];
			cache.set(memoKey, result);
			return result;
		}
		intersects(range, options) {
			if (!(range instanceof Range)) throw new TypeError("a Range is required");
			return this.set.some((thisComparators) => {
				return isSatisfiable(thisComparators, options) && range.set.some((rangeComparators) => {
					return isSatisfiable(rangeComparators, options) && thisComparators.every((thisComparator) => {
						return rangeComparators.every((rangeComparator) => {
							return thisComparator.intersects(rangeComparator, options);
						});
					});
				});
			});
		}
		test(version) {
			if (!version) return false;
			if (typeof version === "string") try {
				version = new SemVer(version, this.options);
			} catch (er) {
				return false;
			}
			for (let i = 0; i < this.set.length; i++) if (testSet(this.set[i], version, this.options)) return true;
			return false;
		}
	};
	const cache = new (require_lrucache())();
	const parseOptions = require_parse_options();
	const Comparator = require_comparator();
	const debug = require_debug();
	const SemVer = require_semver$1();
	const { safeRe: re, src, t, comparatorTrimReplace, tildeTrimReplace, caretTrimReplace } = require_re();
	const { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = require_constants();
	const BUILDSTRIPRE = new RegExp(src[t.BUILD], "g");
	const isNullSet = (c) => c.value === "<0.0.0-0";
	const isAny = (c) => c.value === "";
	const isSatisfiable = (comparators, options) => {
		let result = true;
		const remainingComparators = comparators.slice();
		let testComparator = remainingComparators.pop();
		while (result && remainingComparators.length) {
			result = remainingComparators.every((otherComparator) => {
				return testComparator.intersects(otherComparator, options);
			});
			testComparator = remainingComparators.pop();
		}
		return result;
	};
	const parseComparator = (comp, options) => {
		comp = comp.replace(re[t.BUILD], "");
		debug("comp", comp, options);
		comp = replaceCarets(comp, options);
		debug("caret", comp);
		comp = replaceTildes(comp, options);
		debug("tildes", comp);
		comp = replaceXRanges(comp, options);
		debug("xrange", comp);
		comp = replaceStars(comp, options);
		debug("stars", comp);
		return comp;
	};
	const isX = (id) => !id || id.toLowerCase() === "x" || id === "*";
	const invalidXRangeOrder = (M, m, p) => isX(M) && !isX(m) || isX(m) && p && !isX(p);
	const replaceTildes = (comp, options) => {
		return comp.trim().split(/\s+/).map((c) => replaceTilde(c, options)).join(" ");
	};
	const replaceTilde = (comp, options) => {
		const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
		const z = options.includePrerelease ? "-0" : "";
		return comp.replace(r, (_, M, m, p, pr) => {
			debug("tilde", comp, _, M, m, p, pr);
			let ret;
			if (isX(M)) ret = "";
			else if (isX(m)) ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
			else if (isX(p)) ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
			else if (pr) {
				debug("replaceTilde pr", pr);
				ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
			} else ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
			debug("tilde return", ret);
			return ret;
		});
	};
	const replaceCarets = (comp, options) => {
		return comp.trim().split(/\s+/).map((c) => replaceCaret(c, options)).join(" ");
	};
	const replaceCaret = (comp, options) => {
		debug("caret", comp, options);
		const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
		const z = options.includePrerelease ? "-0" : "";
		return comp.replace(r, (_, M, m, p, pr) => {
			debug("caret", comp, _, M, m, p, pr);
			let ret;
			if (isX(M)) ret = "";
			else if (isX(m)) ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
			else if (isX(p)) {
				if (M === "0") ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
				else ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
			} else if (pr) {
				debug("replaceCaret pr", pr);
				if (M === "0") {
					if (m === "0") ret = `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0`;
					else ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
				} else ret = `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`;
			} else {
				debug("no pr");
				if (M === "0") {
					if (m === "0") ret = `>=${M}.${m}.${p} <${M}.${m}.${+p + 1}-0`;
					else ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
				} else ret = `>=${M}.${m}.${p} <${+M + 1}.0.0-0`;
			}
			debug("caret return", ret);
			return ret;
		});
	};
	const replaceXRanges = (comp, options) => {
		debug("replaceXRanges", comp, options);
		return comp.split(/\s+/).map((c) => replaceXRange(c, options)).join(" ");
	};
	const replaceXRange = (comp, options) => {
		comp = comp.trim();
		const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
		return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
			debug("xRange", comp, ret, gtlt, M, m, p, pr);
			if (invalidXRangeOrder(M, m, p)) return comp;
			const xM = isX(M);
			const xm = xM || isX(m);
			const xp = xm || isX(p);
			const anyX = xp;
			if (gtlt === "=" && anyX) gtlt = "";
			pr = options.includePrerelease ? "-0" : "";
			if (xM) {
				if (gtlt === ">" || gtlt === "<") ret = "<0.0.0-0";
				else ret = "*";
			} else if (gtlt && anyX) {
				if (xm) m = 0;
				p = 0;
				if (gtlt === ">") {
					gtlt = ">=";
					if (xm) {
						M = +M + 1;
						m = 0;
						p = 0;
					} else {
						m = +m + 1;
						p = 0;
					}
				} else if (gtlt === "<=") {
					gtlt = "<";
					if (xm) M = +M + 1;
					else m = +m + 1;
				}
				if (gtlt === "<") pr = "-0";
				ret = `${gtlt + M}.${m}.${p}${pr}`;
			} else if (xm) ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
			else if (xp) ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`;
			debug("xRange return", ret);
			return ret;
		});
	};
	const replaceStars = (comp, options) => {
		debug("replaceStars", comp, options);
		return comp.trim().replace(re[t.STAR], "");
	};
	const replaceGTE0 = (comp, options) => {
		debug("replaceGTE0", comp, options);
		return comp.trim().replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], "");
	};
	const hyphenReplace = (incPr) => ($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr) => {
		if (isX(fM)) from = "";
		else if (isX(fm)) from = `>=${fM}.0.0${incPr ? "-0" : ""}`;
		else if (isX(fp)) from = `>=${fM}.${fm}.0${incPr ? "-0" : ""}`;
		else if (fpr) from = `>=${from}`;
		else from = `>=${from}${incPr ? "-0" : ""}`;
		if (isX(tM)) to = "";
		else if (isX(tm)) to = `<${+tM + 1}.0.0-0`;
		else if (isX(tp)) to = `<${tM}.${+tm + 1}.0-0`;
		else if (tpr) to = `<=${tM}.${tm}.${tp}-${tpr}`;
		else if (incPr) to = `<${tM}.${tm}.${+tp + 1}-0`;
		else to = `<=${to}`;
		return `${from} ${to}`.trim();
	};
	const testSet = (set, version, options) => {
		for (let i = 0; i < set.length; i++) if (!set[i].test(version)) return false;
		if (version.prerelease.length && !options.includePrerelease) {
			for (let i = 0; i < set.length; i++) {
				debug(set[i].semver);
				if (set[i].semver === Comparator.ANY) continue;
				if (set[i].semver.prerelease.length > 0) {
					const allowed = set[i].semver;
					if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) return true;
				}
			}
			return false;
		}
		return true;
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/classes/comparator.js
var require_comparator = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const ANY = Symbol("SemVer ANY");
	module.exports = class Comparator {
		static get ANY() {
			return ANY;
		}
		constructor(comp, options) {
			options = parseOptions(options);
			if (comp instanceof Comparator) {
				if (comp.loose === !!options.loose) return comp;
				else comp = comp.value;
			}
			comp = comp.trim().split(/\s+/).join(" ");
			debug("comparator", comp, options);
			this.options = options;
			this.loose = !!options.loose;
			this.parse(comp);
			if (this.semver === ANY) this.value = "";
			else this.value = this.operator + this.semver.version;
			debug("comp", this);
		}
		parse(comp) {
			const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
			const m = comp.match(r);
			if (!m) throw new TypeError(`Invalid comparator: ${comp}`);
			this.operator = m[1] !== void 0 ? m[1] : "";
			if (this.operator === "=") this.operator = "";
			if (!m[2]) this.semver = ANY;
			else this.semver = new SemVer(m[2], this.options.loose);
		}
		toString() {
			return this.value;
		}
		test(version) {
			debug("Comparator.test", version, this.options.loose);
			if (this.semver === ANY || version === ANY) return true;
			if (typeof version === "string") try {
				version = new SemVer(version, this.options);
			} catch (er) {
				return false;
			}
			return cmp(version, this.operator, this.semver, this.options);
		}
		intersects(comp, options) {
			if (!(comp instanceof Comparator)) throw new TypeError("a Comparator is required");
			if (this.operator === "") {
				if (this.value === "") return true;
				return new Range(comp.value, options).test(this.value);
			} else if (comp.operator === "") {
				if (comp.value === "") return true;
				return new Range(this.value, options).test(comp.semver);
			}
			options = parseOptions(options);
			if (options.includePrerelease && (this.value === "<0.0.0-0" || comp.value === "<0.0.0-0")) return false;
			if (!options.includePrerelease && (this.value.startsWith("<0.0.0") || comp.value.startsWith("<0.0.0"))) return false;
			if (this.operator.startsWith(">") && comp.operator.startsWith(">")) return true;
			if (this.operator.startsWith("<") && comp.operator.startsWith("<")) return true;
			if (this.semver.version === comp.semver.version && this.operator.includes("=") && comp.operator.includes("=")) return true;
			if (cmp(this.semver, "<", comp.semver, options) && this.operator.startsWith(">") && comp.operator.startsWith("<")) return true;
			if (cmp(this.semver, ">", comp.semver, options) && this.operator.startsWith("<") && comp.operator.startsWith(">")) return true;
			return false;
		}
	};
	const parseOptions = require_parse_options();
	const { safeRe: re, t } = require_re();
	const cmp = require_cmp();
	const debug = require_debug();
	const SemVer = require_semver$1();
	const Range = require_range();
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/satisfies.js
var require_satisfies = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const Range = require_range();
	const satisfies = (version, range, options) => {
		try {
			range = new Range(range, options);
		} catch (er) {
			return false;
		}
		return range.test(version);
	};
	module.exports = satisfies;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/ranges/to-comparators.js
var require_to_comparators = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const Range = require_range();
	const toComparators = (range, options) => new Range(range, options).set.map((comp) => comp.map((c) => c.value).join(" ").trim().split(" "));
	module.exports = toComparators;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/ranges/max-satisfying.js
var require_max_satisfying = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const SemVer = require_semver$1();
	const Range = require_range();
	const maxSatisfying = (versions, range, options) => {
		let max = null;
		let maxSV = null;
		let rangeObj = null;
		try {
			rangeObj = new Range(range, options);
		} catch (er) {
			return null;
		}
		versions.forEach((v) => {
			if (rangeObj.test(v)) {
				if (!max || maxSV.compare(v) === -1) {
					max = v;
					maxSV = new SemVer(max, options);
				}
			}
		});
		return max;
	};
	module.exports = maxSatisfying;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/ranges/min-satisfying.js
var require_min_satisfying = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const SemVer = require_semver$1();
	const Range = require_range();
	const minSatisfying = (versions, range, options) => {
		let min = null;
		let minSV = null;
		let rangeObj = null;
		try {
			rangeObj = new Range(range, options);
		} catch (er) {
			return null;
		}
		versions.forEach((v) => {
			if (rangeObj.test(v)) {
				if (!min || minSV.compare(v) === 1) {
					min = v;
					minSV = new SemVer(min, options);
				}
			}
		});
		return min;
	};
	module.exports = minSatisfying;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/ranges/min-version.js
var require_min_version = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const SemVer = require_semver$1();
	const Range = require_range();
	const gt = require_gt();
	const minVersion = (range, loose) => {
		range = new Range(range, loose);
		let minver = new SemVer("0.0.0");
		if (range.test(minver)) return minver;
		minver = new SemVer("0.0.0-0");
		if (range.test(minver)) return minver;
		minver = null;
		for (let i = 0; i < range.set.length; ++i) {
			const comparators = range.set[i];
			let setMin = null;
			comparators.forEach((comparator) => {
				const compver = new SemVer(comparator.semver.version);
				switch (comparator.operator) {
					case ">":
						if (compver.prerelease.length === 0) compver.patch++;
						else compver.prerelease.push(0);
						compver.raw = compver.format();
					case "":
					case ">=":
						if (!setMin || gt(compver, setMin)) setMin = compver;
						break;
					case "<":
					case "<=": break;
					/* istanbul ignore next */
					default: throw new Error(`Unexpected operation: ${comparator.operator}`);
				}
			});
			if (setMin && (!minver || gt(minver, setMin))) minver = setMin;
		}
		if (minver && range.test(minver)) return minver;
		return null;
	};
	module.exports = minVersion;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/ranges/valid.js
var require_valid = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const Range = require_range();
	const validRange = (range, options) => {
		try {
			return new Range(range, options).range || "*";
		} catch (er) {
			return null;
		}
	};
	module.exports = validRange;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/ranges/outside.js
var require_outside = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const SemVer = require_semver$1();
	const Comparator = require_comparator();
	const { ANY } = Comparator;
	const Range = require_range();
	const satisfies = require_satisfies();
	const gt = require_gt();
	const lt = require_lt();
	const lte = require_lte();
	const gte = require_gte();
	const outside = (version, range, hilo, options) => {
		version = new SemVer(version, options);
		range = new Range(range, options);
		let gtfn, ltefn, ltfn, comp, ecomp;
		switch (hilo) {
			case ">":
				gtfn = gt;
				ltefn = lte;
				ltfn = lt;
				comp = ">";
				ecomp = ">=";
				break;
			case "<":
				gtfn = lt;
				ltefn = gte;
				ltfn = gt;
				comp = "<";
				ecomp = "<=";
				break;
			default: throw new TypeError("Must provide a hilo val of \"<\" or \">\"");
		}
		if (satisfies(version, range, options)) return false;
		for (let i = 0; i < range.set.length; ++i) {
			const comparators = range.set[i];
			let high = null;
			let low = null;
			comparators.forEach((comparator) => {
				if (comparator.semver === ANY) comparator = new Comparator(">=0.0.0");
				high = high || comparator;
				low = low || comparator;
				if (gtfn(comparator.semver, high.semver, options)) high = comparator;
				else if (ltfn(comparator.semver, low.semver, options)) low = comparator;
			});
			if (high.operator === comp || high.operator === ecomp) return false;
			if ((!low.operator || low.operator === comp) && ltefn(version, low.semver)) return false;
			else if (low.operator === ecomp && ltfn(version, low.semver)) return false;
		}
		return true;
	};
	module.exports = outside;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/ranges/gtr.js
var require_gtr = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const outside = require_outside();
	const gtr = (version, range, options) => outside(version, range, ">", options);
	module.exports = gtr;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/ranges/ltr.js
var require_ltr = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const outside = require_outside();
	const ltr = (version, range, options) => outside(version, range, "<", options);
	module.exports = ltr;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/ranges/intersects.js
var require_intersects = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const Range = require_range();
	const intersects = (r1, r2, options) => {
		r1 = new Range(r1, options);
		r2 = new Range(r2, options);
		return r1.intersects(r2, options);
	};
	module.exports = intersects;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/ranges/simplify.js
var require_simplify = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const satisfies = require_satisfies();
	const compare = require_compare();
	module.exports = (versions, range, options) => {
		const set = [];
		let first = null;
		let prev = null;
		const v = versions.sort((a, b) => compare(a, b, options));
		for (const version of v) if (satisfies(version, range, options)) {
			prev = version;
			if (!first) first = version;
		} else {
			if (prev) set.push([first, prev]);
			prev = null;
			first = null;
		}
		if (first) set.push([first, null]);
		const ranges = [];
		for (const [min, max] of set) if (min === max) ranges.push(min);
		else if (!max && min === v[0]) ranges.push("*");
		else if (!max) ranges.push(`>=${min}`);
		else if (min === v[0]) ranges.push(`<=${max}`);
		else ranges.push(`${min} - ${max}`);
		const simplified = ranges.join(" || ");
		const original = typeof range.raw === "string" ? range.raw : String(range);
		return simplified.length < original.length ? simplified : range;
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/ranges/subset.js
var require_subset = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const Range = require_range();
	const Comparator = require_comparator();
	const { ANY } = Comparator;
	const satisfies = require_satisfies();
	const compare = require_compare();
	const subset = (sub, dom, options = {}) => {
		if (sub === dom) return true;
		sub = new Range(sub, options);
		dom = new Range(dom, options);
		let sawNonNull = false;
		OUTER: for (const simpleSub of sub.set) {
			for (const simpleDom of dom.set) {
				const isSub = simpleSubset(simpleSub, simpleDom, options);
				sawNonNull = sawNonNull || isSub !== null;
				if (isSub) continue OUTER;
			}
			if (sawNonNull) return false;
		}
		return true;
	};
	const minimumVersionWithPreRelease = [new Comparator(">=0.0.0-0")];
	const minimumVersion = [new Comparator(">=0.0.0")];
	const simpleSubset = (sub, dom, options) => {
		if (sub === dom) return true;
		if (sub.length === 1 && sub[0].semver === ANY) {
			if (dom.length === 1 && dom[0].semver === ANY) return true;
			else if (options.includePrerelease) sub = minimumVersionWithPreRelease;
			else sub = minimumVersion;
		}
		if (dom.length === 1 && dom[0].semver === ANY) {
			if (options.includePrerelease) return true;
			else dom = minimumVersion;
		}
		const eqSet = /* @__PURE__ */ new Set();
		let gt, lt;
		for (const c of sub) if (c.operator === ">" || c.operator === ">=") gt = higherGT(gt, c, options);
		else if (c.operator === "<" || c.operator === "<=") lt = lowerLT(lt, c, options);
		else eqSet.add(c.semver);
		if (eqSet.size > 1) return null;
		let gtltComp;
		if (gt && lt) {
			gtltComp = compare(gt.semver, lt.semver, options);
			if (gtltComp > 0) return null;
			else if (gtltComp === 0 && (gt.operator !== ">=" || lt.operator !== "<=")) return null;
		}
		for (const eq of eqSet) {
			if (gt && !satisfies(eq, String(gt), options)) return null;
			if (lt && !satisfies(eq, String(lt), options)) return null;
			for (const c of dom) if (!satisfies(eq, String(c), options)) return false;
			return true;
		}
		let higher, lower;
		let hasDomLT, hasDomGT;
		let needDomLTPre = lt && !options.includePrerelease && lt.semver.prerelease.length ? lt.semver : false;
		let needDomGTPre = gt && !options.includePrerelease && gt.semver.prerelease.length ? gt.semver : false;
		if (needDomLTPre && needDomLTPre.prerelease.length === 1 && lt.operator === "<" && needDomLTPre.prerelease[0] === 0) needDomLTPre = false;
		for (const c of dom) {
			hasDomGT = hasDomGT || c.operator === ">" || c.operator === ">=";
			hasDomLT = hasDomLT || c.operator === "<" || c.operator === "<=";
			if (gt) {
				if (needDomGTPre) {
					if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomGTPre.major && c.semver.minor === needDomGTPre.minor && c.semver.patch === needDomGTPre.patch) needDomGTPre = false;
				}
				if (c.operator === ">" || c.operator === ">=") {
					higher = higherGT(gt, c, options);
					if (higher === c && higher !== gt) return false;
				} else if (gt.operator === ">=" && !c.test(gt.semver)) return false;
			}
			if (lt) {
				if (needDomLTPre) {
					if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomLTPre.major && c.semver.minor === needDomLTPre.minor && c.semver.patch === needDomLTPre.patch) needDomLTPre = false;
				}
				if (c.operator === "<" || c.operator === "<=") {
					lower = lowerLT(lt, c, options);
					if (lower === c && lower !== lt) return false;
				} else if (lt.operator === "<=" && !c.test(lt.semver)) return false;
			}
			if (!c.operator && (lt || gt) && gtltComp !== 0) return false;
		}
		if (gt && hasDomLT && !lt && gtltComp !== 0) return false;
		if (lt && hasDomGT && !gt && gtltComp !== 0) return false;
		if (needDomGTPre || needDomLTPre) return false;
		return true;
	};
	const higherGT = (a, b, options) => {
		if (!a) return b;
		const comp = compare(a.semver, b.semver, options);
		return comp > 0 ? a : comp < 0 ? b : b.operator === ">" && a.operator === ">=" ? b : a;
	};
	const lowerLT = (a, b, options) => {
		if (!a) return b;
		const comp = compare(a.semver, b.semver, options);
		return comp < 0 ? a : comp > 0 ? b : b.operator === "<" && a.operator === "<=" ? b : a;
	};
	module.exports = subset;
}));
//#endregion
//#region ../../node_modules/.pnpm/semver@7.8.5/node_modules/semver/index.js
var require_semver = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const internalRe = require_re();
	const constants = require_constants();
	const SemVer = require_semver$1();
	const identifiers = require_identifiers();
	module.exports = {
		parse: require_parse(),
		valid: require_valid$1(),
		clean: require_clean(),
		inc: require_inc(),
		diff: require_diff(),
		major: require_major(),
		minor: require_minor(),
		patch: require_patch(),
		prerelease: require_prerelease(),
		compare: require_compare(),
		rcompare: require_rcompare(),
		compareLoose: require_compare_loose(),
		compareBuild: require_compare_build(),
		sort: require_sort(),
		rsort: require_rsort(),
		gt: require_gt(),
		lt: require_lt(),
		eq: require_eq(),
		neq: require_neq(),
		gte: require_gte(),
		lte: require_lte(),
		cmp: require_cmp(),
		coerce: require_coerce(),
		truncate: require_truncate(),
		Comparator: require_comparator(),
		Range: require_range(),
		satisfies: require_satisfies(),
		toComparators: require_to_comparators(),
		maxSatisfying: require_max_satisfying(),
		minSatisfying: require_min_satisfying(),
		minVersion: require_min_version(),
		validRange: require_valid(),
		outside: require_outside(),
		gtr: require_gtr(),
		ltr: require_ltr(),
		intersects: require_intersects(),
		simplifyRange: require_simplify(),
		subset: require_subset(),
		SemVer,
		re: internalRe.re,
		src: internalRe.src,
		tokens: internalRe.t,
		SEMVER_SPEC_VERSION: constants.SEMVER_SPEC_VERSION,
		RELEASE_TYPES: constants.RELEASE_TYPES,
		compareIdentifiers: identifiers.compareIdentifiers,
		rcompareIdentifiers: identifiers.rcompareIdentifiers
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/proc-log@6.1.0/node_modules/proc-log/lib/index.js
var require_lib$1 = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	module.exports = {
		META: Symbol("proc-log.meta"),
		output: {
			LEVELS: [
				"standard",
				"error",
				"buffer",
				"flush"
			],
			KEYS: {
				standard: "standard",
				error: "error",
				buffer: "buffer",
				flush: "flush"
			},
			standard: function(...args) {
				return process.emit("output", "standard", ...args);
			},
			error: function(...args) {
				return process.emit("output", "error", ...args);
			},
			buffer: function(...args) {
				return process.emit("output", "buffer", ...args);
			},
			flush: function(...args) {
				return process.emit("output", "flush", ...args);
			}
		},
		log: {
			LEVELS: [
				"notice",
				"error",
				"warn",
				"info",
				"verbose",
				"http",
				"silly",
				"timing",
				"pause",
				"resume"
			],
			KEYS: {
				notice: "notice",
				error: "error",
				warn: "warn",
				info: "info",
				verbose: "verbose",
				http: "http",
				silly: "silly",
				timing: "timing",
				pause: "pause",
				resume: "resume"
			},
			error: function(...args) {
				return process.emit("log", "error", ...args);
			},
			notice: function(...args) {
				return process.emit("log", "notice", ...args);
			},
			warn: function(...args) {
				return process.emit("log", "warn", ...args);
			},
			info: function(...args) {
				return process.emit("log", "info", ...args);
			},
			verbose: function(...args) {
				return process.emit("log", "verbose", ...args);
			},
			http: function(...args) {
				return process.emit("log", "http", ...args);
			},
			silly: function(...args) {
				return process.emit("log", "silly", ...args);
			},
			timing: function(...args) {
				return process.emit("log", "timing", ...args);
			},
			pause: function() {
				return process.emit("log", "pause");
			},
			resume: function() {
				return process.emit("log", "resume");
			}
		},
		time: {
			LEVELS: ["start", "end"],
			KEYS: {
				start: "start",
				end: "end"
			},
			start: function(name, fn) {
				process.emit("time", "start", name);
				function end() {
					return process.emit("time", "end", name);
				}
				if (typeof fn === "function") {
					const res = fn();
					if (res && res.finally) return res.finally(end);
					end();
					return res;
				}
				return end;
			},
			end: function(name) {
				return process.emit("time", "end", name);
			}
		},
		input: {
			LEVELS: [
				"start",
				"end",
				"read"
			],
			KEYS: {
				start: "start",
				end: "end",
				read: "read"
			},
			start: function(...args) {
				let fn;
				if (typeof args[0] === "function") fn = args.shift();
				process.emit("input", "start", ...args);
				function end() {
					return process.emit("input", "end", ...args);
				}
				if (typeof fn === "function") {
					const res = fn();
					if (res && res.finally) return res.finally(end);
					end();
					return res;
				}
				return end;
			},
			end: function(...args) {
				return process.emit("input", "end", ...args);
			},
			read: function(...args) {
				let resolve, reject;
				const promise = new Promise((_resolve, _reject) => {
					resolve = _resolve;
					reject = _reject;
				});
				process.emit("input", "read", resolve, reject, ...args);
				return promise;
			}
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/lru-cache@11.5.2/node_modules/lru-cache/dist/commonjs/node/index.min.js
var require_index_min$1 = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports) => {
	var j = (u, t) => () => (t || u((t = { exports: {} }).exports, t), t.exports);
	var I = j((O) => {
		"use strict";
		Object.defineProperty(O, "__esModule", { value: !0 });
		O.tracing = O.metrics = void 0;
		var U = require("node:diagnostics_channel");
		O.metrics = (0, U.channel)("lru-cache:metrics");
		O.tracing = (0, U.tracingChannel)("lru-cache");
	});
	var P = j((R) => {
		"use strict";
		Object.defineProperty(R, "__esModule", { value: !0 });
		R.defaultPerf = void 0;
		R.defaultPerf = typeof performance == "object" && performance && typeof performance.now == "function" ? performance : Date;
	});
	Object.defineProperty(exports, "__esModule", { value: !0 });
	exports.LRUCache = void 0;
	var g = I();
	var N = P();
	var C = () => g.metrics.hasSubscribers || g.tracing.hasSubscribers;
	var k = /* @__PURE__ */ new Set();
	var G = typeof process == "object" && process ? process : {};
	var V = (u, t, e, i) => {
		typeof G.emitWarning == "function" ? G.emitWarning(u, t, e, i) : console.error(`[${e}] ${t}: ${u}`);
	};
	var q = (u) => !k.has(u);
	var T = (u) => !!u && u === Math.floor(u) && u > 0 && isFinite(u);
	var H = (u) => T(u) ? u <= Math.pow(2, 8) ? Uint8Array : u <= Math.pow(2, 16) ? Uint16Array : u <= Math.pow(2, 32) ? Uint32Array : u <= Number.MAX_SAFE_INTEGER ? W : null : null;
	var W = class extends Array {
		constructor(t) {
			super(t), this.fill(0);
		}
	};
	var L = class u {
		heap;
		length;
		static #o = !1;
		static create(t) {
			let e = H(t);
			if (!e) return [];
			u.#o = !0;
			let i = new u(t, e);
			return u.#o = !1, i;
		}
		constructor(t, e) {
			if (!u.#o) throw new TypeError("instantiate Stack using Stack.create(n)");
			this.heap = new e(t), this.length = 0;
		}
		push(t) {
			this.heap[this.length++] = t;
		}
		pop() {
			return this.heap[--this.length];
		}
	};
	exports.LRUCache = class u {
		#o;
		#c;
		#m;
		#W;
		#S;
		#x;
		#j;
		#w;
		get perf() {
			return this.#w;
		}
		ttl;
		ttlResolution;
		ttlAutopurge;
		updateAgeOnGet;
		updateAgeOnHas;
		allowStale;
		noDisposeOnSet;
		noUpdateTTL;
		maxEntrySize;
		sizeCalculation;
		noDeleteOnFetchRejection;
		noDeleteOnStaleGet;
		allowStaleOnFetchAbort;
		allowStaleOnFetchRejection;
		ignoreFetchAbort;
		backgroundFetchSize;
		#n;
		#b;
		#s;
		#i;
		#t;
		#l;
		#u;
		#a;
		#h;
		#_;
		#r;
		#y;
		#F;
		#d;
		#g;
		#T;
		#U;
		#f;
		#R;
		static unsafeExposeInternals(t) {
			return {
				starts: t.#F,
				ttls: t.#d,
				autopurgeTimers: t.#g,
				sizes: t.#y,
				keyMap: t.#s,
				keyList: t.#i,
				valList: t.#t,
				next: t.#l,
				prev: t.#u,
				get head() {
					return t.#a;
				},
				get tail() {
					return t.#h;
				},
				free: t.#_,
				isBackgroundFetch: (e) => t.#e(e),
				backgroundFetch: (e, i, s, n) => t.#G(e, i, s, n),
				moveToTail: (e) => t.#M(e),
				indexes: (e) => t.#A(e),
				rindexes: (e) => t.#z(e),
				isStale: (e) => t.#p(e)
			};
		}
		get max() {
			return this.#o;
		}
		get maxSize() {
			return this.#c;
		}
		get calculatedSize() {
			return this.#b;
		}
		get size() {
			return this.#n;
		}
		get fetchMethod() {
			return this.#x;
		}
		get memoMethod() {
			return this.#j;
		}
		get dispose() {
			return this.#m;
		}
		get onInsert() {
			return this.#W;
		}
		get disposeAfter() {
			return this.#S;
		}
		constructor(t) {
			let { max: e = 0, ttl: i, ttlResolution: s = 1, ttlAutopurge: n, updateAgeOnGet: o, updateAgeOnHas: l, allowStale: h, dispose: r, onInsert: c, disposeAfter: w, noDisposeOnSet: y, noUpdateTTL: d, maxSize: p = 0, maxEntrySize: f = 0, sizeCalculation: _, fetchMethod: a, memoMethod: S, noDeleteOnFetchRejection: F, noDeleteOnStaleGet: b, allowStaleOnFetchRejection: m, allowStaleOnFetchAbort: A, ignoreFetchAbort: z, backgroundFetchSize: x = 1, perf: v } = t;
			if (this.backgroundFetchSize = x, v !== void 0 && typeof v?.now != "function") throw new TypeError("perf option must have a now() method if specified");
			if (this.#w = v ?? N.defaultPerf, e !== 0 && !T(e)) throw new TypeError("max option must be a nonnegative integer");
			let E = e ? H(e) : Array;
			if (!E) throw new Error("invalid max value: " + e);
			if (this.#o = e, this.#c = p, this.maxEntrySize = f || this.#c, this.sizeCalculation = _, this.sizeCalculation) {
				if (!this.#c && !this.maxEntrySize) throw new TypeError("cannot set sizeCalculation without setting maxSize or maxEntrySize");
				if (typeof this.sizeCalculation != "function") throw new TypeError("sizeCalculation set to non-function");
			}
			if (S !== void 0 && typeof S != "function") throw new TypeError("memoMethod must be a function if defined");
			if (this.#j = S, a !== void 0 && typeof a != "function") throw new TypeError("fetchMethod must be a function if specified");
			if (this.#x = a, this.#U = !!a, this.#s = /* @__PURE__ */ new Map(), this.#i = Array.from({ length: e }).fill(void 0), this.#t = Array.from({ length: e }).fill(void 0), this.#l = new E(e), this.#u = new E(e), this.#a = 0, this.#h = 0, this.#_ = L.create(e), this.#n = 0, this.#b = 0, typeof r == "function" && (this.#m = r), typeof c == "function" && (this.#W = c), typeof w == "function" ? (this.#S = w, this.#r = []) : (this.#S = void 0, this.#r = void 0), this.#T = !!this.#m, this.#R = !!this.#W, this.#f = !!this.#S, this.noDisposeOnSet = !!y, this.noUpdateTTL = !!d, this.noDeleteOnFetchRejection = !!F, this.allowStaleOnFetchRejection = !!m, this.allowStaleOnFetchAbort = !!A, this.ignoreFetchAbort = !!z, this.maxEntrySize !== 0) {
				if (this.#c !== 0 && !T(this.#c)) throw new TypeError("maxSize must be a positive integer if specified");
				if (!T(this.maxEntrySize)) throw new TypeError("maxEntrySize must be a positive integer if specified");
				this.#X();
			}
			if (this.allowStale = !!h, this.noDeleteOnStaleGet = !!b, this.updateAgeOnGet = !!o, this.updateAgeOnHas = !!l, this.ttlResolution = T(s) || s === 0 ? s : 1, this.ttlAutopurge = !!n, this.ttl = i || 0, this.ttl) {
				if (!T(this.ttl)) throw new TypeError("ttl must be a positive integer if specified");
				this.#k();
			}
			if (this.#o === 0 && this.ttl === 0 && this.#c === 0) throw new TypeError("At least one of max, maxSize, or ttl is required");
			if (!this.ttlAutopurge && !this.#o && !this.#c) {
				let D = "LRU_CACHE_UNBOUNDED";
				q(D) && (k.add(D), V("TTL caching without ttlAutopurge, max, or maxSize can result in unbounded memory consumption.", "UnboundedCacheWarning", D, u));
			}
		}
		getRemainingTTL(t) {
			return this.#s.has(t) ? 1 / 0 : 0;
		}
		#k() {
			let t = new W(this.#o), e = new W(this.#o);
			this.#d = t, this.#F = e;
			let i = this.ttlAutopurge ? Array.from({ length: this.#o }) : void 0;
			this.#g = i, this.#H = (h, r, c = this.#w.now()) => {
				e[h] = r !== 0 ? c : 0, t[h] = r, s(h, r);
			}, this.#D = (h) => {
				e[h] = t[h] !== 0 ? this.#w.now() : 0, s(h, t[h]);
			};
			let s = this.ttlAutopurge ? (h, r) => {
				if (i?.[h] && (clearTimeout(i[h]), i[h] = void 0), r && r !== 0 && i) {
					let c = setTimeout(() => {
						this.#p(h) ? (this.#v(this.#i[h], "expire"), i[h] = void 0) : s(h, l(h));
					}, r + 1);
					c.unref && c.unref(), i[h] = c;
				}
			} : () => {};
			this.#E = (h, r) => {
				if (t[r]) {
					let c = t[r], w = e[r];
					if (!c || !w) return;
					h.ttl = c, h.start = w, h.now = n || o();
					h.remainingTTL = c - (h.now - w);
				}
			};
			let n = 0, o = () => {
				let h = this.#w.now();
				if (this.ttlResolution > 0) {
					n = h;
					let r = setTimeout(() => n = 0, this.ttlResolution);
					r.unref && r.unref();
				}
				return h;
			};
			this.getRemainingTTL = (h) => {
				let r = this.#s.get(h);
				return r === void 0 ? 0 : l(r);
			};
			let l = (h) => {
				let r = t[h], c = e[h];
				if (!r || !c) return 1 / 0;
				return r - ((n || o()) - c);
			};
			this.#p = (h) => {
				let r = e[h], c = t[h];
				return !!c && !!r && (n || o()) - r > c;
			};
		}
		#D = () => {};
		#E = () => {};
		#H = () => {};
		#p = () => !1;
		#X() {
			let t = new W(this.#o);
			this.#b = 0, this.#y = t, this.#C = (e) => {
				this.#b -= t[e], t[e] = 0;
			}, this.#N = (e, i, s, n) => {
				if (!T(s)) {
					if (this.#e(i)) return this.backgroundFetchSize;
					if (n) {
						if (typeof n != "function") throw new TypeError("sizeCalculation must be a function");
						if (s = n(i, e), !T(s)) throw new TypeError("sizeCalculation return invalid (expect positive integer)");
					} else throw new TypeError("invalid size value (must be positive integer). When maxSize or maxEntrySize is used, sizeCalculation or size must be set.");
				}
				return s;
			}, this.#I = (e, i, s) => {
				if (t[e] = i, this.#c) {
					let n = this.#c - t[e];
					for (; this.#b > n;) this.#P(!0);
				}
				this.#b += t[e], s && (s.entrySize = i, s.totalCalculatedSize = this.#b);
			};
		}
		#C = (t) => {};
		#I = (t, e, i) => {};
		#N = (t, e, i, s) => {
			if (i || s) throw new TypeError("cannot set size without setting maxSize or maxEntrySize on cache");
			return 0;
		};
		*#A({ allowStale: t = this.allowStale } = {}) {
			if (this.#n) for (let e = this.#h; this.#V(e) && ((t || !this.#p(e)) && (yield e), e !== this.#a);) e = this.#u[e];
		}
		*#z({ allowStale: t = this.allowStale } = {}) {
			if (this.#n) for (let e = this.#a; this.#V(e) && ((t || !this.#p(e)) && (yield e), e !== this.#h);) e = this.#l[e];
		}
		#V(t) {
			return t !== void 0 && this.#s.get(this.#i[t]) === t;
		}
		*entries() {
			for (let t of this.#A()) this.#t[t] !== void 0 && this.#i[t] !== void 0 && !this.#e(this.#t[t]) && (yield [this.#i[t], this.#t[t]]);
		}
		*rentries() {
			for (let t of this.#z()) this.#t[t] !== void 0 && this.#i[t] !== void 0 && !this.#e(this.#t[t]) && (yield [this.#i[t], this.#t[t]]);
		}
		*keys() {
			for (let t of this.#A()) {
				let e = this.#i[t];
				e !== void 0 && !this.#e(this.#t[t]) && (yield e);
			}
		}
		*rkeys() {
			for (let t of this.#z()) {
				let e = this.#i[t];
				e !== void 0 && !this.#e(this.#t[t]) && (yield e);
			}
		}
		*values() {
			for (let t of this.#A()) this.#t[t] !== void 0 && !this.#e(this.#t[t]) && (yield this.#t[t]);
		}
		*rvalues() {
			for (let t of this.#z()) this.#t[t] !== void 0 && !this.#e(this.#t[t]) && (yield this.#t[t]);
		}
		[Symbol.iterator]() {
			return this.entries();
		}
		[Symbol.toStringTag] = "LRUCache";
		find(t, e = {}) {
			for (let i of this.#A()) {
				let s = this.#t[i], n = this.#e(s) ? s.__staleWhileFetching : s;
				if (n !== void 0 && t(n, this.#i[i], this)) return this.#L(this.#i[i], e);
			}
		}
		forEach(t, e = this) {
			for (let i of this.#A()) {
				let s = this.#t[i], n = this.#e(s) ? s.__staleWhileFetching : s;
				n !== void 0 && t.call(e, n, this.#i[i], this);
			}
		}
		rforEach(t, e = this) {
			for (let i of this.#z()) {
				let s = this.#t[i], n = this.#e(s) ? s.__staleWhileFetching : s;
				n !== void 0 && t.call(e, n, this.#i[i], this);
			}
		}
		purgeStale() {
			let t = !1;
			for (let e of this.#z({ allowStale: !0 })) this.#p(e) && (this.#v(this.#i[e], "expire"), t = !0);
			return t;
		}
		info(t) {
			let e = this.#s.get(t);
			if (e === void 0) return;
			let i = this.#t[e], s = this.#e(i) ? i.__staleWhileFetching : i;
			if (s === void 0) return;
			let n = { value: s };
			if (this.#d && this.#F) {
				let o = this.#d[e], l = this.#F[e];
				if (o && l) n.ttl = o - (this.#w.now() - l), n.start = Date.now();
			}
			return this.#y && (n.size = this.#y[e]), n;
		}
		dump() {
			let t = [];
			for (let e of this.#A({ allowStale: !0 })) {
				let i = this.#i[e], s = this.#t[e], n = this.#e(s) ? s.__staleWhileFetching : s;
				if (n === void 0 || i === void 0) continue;
				let o = { value: n };
				if (this.#d && this.#F) {
					o.ttl = this.#d[e];
					let l = this.#w.now() - this.#F[e];
					o.start = Math.floor(Date.now() - l);
				}
				this.#y && (o.size = this.#y[e]), t.unshift([i, o]);
			}
			return t;
		}
		load(t) {
			this.clear();
			for (let [e, i] of t) {
				if (i.start) {
					let s = Date.now() - i.start;
					i.start = this.#w.now() - s;
				}
				this.#O(e, i.value, i);
			}
		}
		set(t, e, i = {}) {
			let { status: s = g.metrics.hasSubscribers ? {} : void 0 } = i;
			i.status = s, s && (s.op = "set", s.key = t, e !== void 0 && (s.value = e), s.cache = this);
			let n = this.#O(t, e, i);
			return s && g.metrics.hasSubscribers && g.metrics.publish(s), n;
		}
		#O(t, e, i, s) {
			let { ttl: n = this.ttl, start: o, noDisposeOnSet: l = this.noDisposeOnSet, sizeCalculation: h = this.sizeCalculation, status: r } = i, c = this.#e(e);
			if (e === void 0) return r && (r.set = "deleted"), this.delete(t), this;
			let { noUpdateTTL: w = this.noUpdateTTL } = i;
			r && !c && (r.value = e);
			let y = this.#N(t, e, i.size || 0, h, r);
			if (this.maxEntrySize && y > this.maxEntrySize) return this.#v(t, "set"), r && (r.set = "miss", r.maxEntrySizeExceeded = !0), this;
			let d = this.#n === 0 ? void 0 : this.#s.get(t);
			if (d === void 0) d = this.#n === 0 ? this.#h : this.#_.length !== 0 ? this.#_.pop() : this.#n === this.#o ? this.#P(!1) : this.#n, this.#i[d] = t, this.#t[d] = e, this.#s.set(t, d), this.#l[this.#h] = d, this.#u[d] = this.#h, this.#h = d, this.#n++, this.#I(d, y, r), r && (r.set = "add"), w = !1, this.#R && !c && this.#W?.(e, t, "add");
			else {
				this.#M(d);
				let p = this.#t[d];
				if (e !== p) {
					if (!l) if (this.#e(p)) {
						p !== s && p.__abortController.abort(/* @__PURE__ */ new Error("replaced"));
						let { __staleWhileFetching: f } = p;
						f !== void 0 && f !== e && (this.#T && this.#m?.(f, t, "set"), this.#f && this.#r?.push([
							f,
							t,
							"set"
						]));
					} else this.#T && this.#m?.(p, t, "set"), this.#f && this.#r?.push([
						p,
						t,
						"set"
					]);
					if (this.#C(d), this.#I(d, y, r), this.#t[d] = e, !c) {
						let f = p && this.#e(p) ? p.__staleWhileFetching : p, _ = f === void 0 ? "add" : e !== f ? "replace" : "update";
						r && (r.set = _, f !== void 0 && (r.oldValue = f)), this.#R && this.onInsert?.(e, t, _);
					}
				} else c || (r && (r.set = "update"), this.#R && this.onInsert?.(e, t, "update"));
			}
			if (n !== 0 && !this.#d && this.#k(), this.#d && (w || this.#H(d, n, o), r && this.#E(r, d)), !l && this.#f && this.#r) {
				let p = this.#r, f;
				for (; f = p?.shift();) this.#S?.(...f);
			}
			return this;
		}
		pop() {
			try {
				for (; this.#n;) {
					let t = this.#t[this.#a];
					if (this.#P(!0), this.#e(t)) {
						if (t.__staleWhileFetching) return t.__staleWhileFetching;
					} else if (t !== void 0) return t;
				}
			} finally {
				if (this.#f && this.#r) {
					let t = this.#r, e;
					for (; e = t?.shift();) this.#S?.(...e);
				}
			}
		}
		#P(t) {
			let e = this.#a, i = this.#i[e], s = this.#t[e], n = this.#e(s);
			n && s.__abortController.abort(/* @__PURE__ */ new Error("evicted"));
			let o = n ? s.__staleWhileFetching : s;
			return (this.#T || this.#f) && o !== void 0 && (this.#T && this.#m?.(o, i, "evict"), this.#f && this.#r?.push([
				o,
				i,
				"evict"
			])), this.#C(e), this.#g?.[e] && (clearTimeout(this.#g[e]), this.#g[e] = void 0), t && (this.#i[e] = void 0, this.#t[e] = void 0, this.#_.push(e)), this.#n === 1 ? (this.#a = this.#h = 0, this.#_.length = 0) : this.#a = this.#l[e], this.#s.delete(i), this.#n--, e;
		}
		has(t, e = {}) {
			let { status: i = g.metrics.hasSubscribers ? {} : void 0 } = e;
			e.status = i, i && (i.op = "has", i.key = t, i.cache = this);
			let s = this.#Y(t, e);
			return g.metrics.hasSubscribers && g.metrics.publish(i), s;
		}
		#Y(t, e = {}) {
			let { updateAgeOnHas: i = this.updateAgeOnHas, status: s } = e, n = this.#s.get(t);
			if (n !== void 0) {
				let o = this.#t[n];
				if (this.#e(o) && o.__staleWhileFetching === void 0) return !1;
				if (this.#p(n)) s && (s.has = "stale", this.#E(s, n));
				else return i && this.#D(n), s && (s.has = "hit", this.#E(s, n)), !0;
			} else s && (s.has = "miss");
			return !1;
		}
		peek(t, e = {}) {
			let { status: i = C() ? {} : void 0 } = e;
			i && (i.op = "peek", i.key = t, i.cache = this), e.status = i;
			let s = this.#J(t, e);
			return g.metrics.hasSubscribers && g.metrics.publish(i), s;
		}
		#J(t, e) {
			let { status: i, allowStale: s = this.allowStale } = e, n = this.#s.get(t);
			if (n === void 0 || !s && this.#p(n)) {
				i && (i.peek = n === void 0 ? "miss" : "stale");
				return;
			}
			let o = this.#t[n], l = this.#e(o) ? o.__staleWhileFetching : o;
			return i && (l !== void 0 ? (i.peek = "hit", i.value = l) : i.peek = "miss"), l;
		}
		#G(t, e, i, s) {
			let n = e === void 0 ? void 0 : this.#t[e];
			if (this.#e(n)) return n;
			let o = new AbortController(), { signal: l } = i;
			l?.addEventListener("abort", () => o.abort(l.reason), { signal: o.signal });
			let h = {
				signal: o.signal,
				options: i,
				context: s
			}, r = (f, _ = !1) => {
				let { aborted: a } = o.signal, S = i.ignoreFetchAbort && f !== void 0, F = i.ignoreFetchAbort || !!(i.allowStaleOnFetchAbort && f !== void 0);
				if (i.status && (a && !_ ? (i.status.fetchAborted = !0, i.status.fetchError = o.signal.reason, S && (i.status.fetchAbortIgnored = !0)) : i.status.fetchResolved = !0), a && !S && !_) return w(o.signal.reason, F);
				let b = d, m = this.#t[e];
				return (m === d || m === void 0 && S && _) && (f === void 0 ? b.__staleWhileFetching !== void 0 ? this.#t[e] = b.__staleWhileFetching : this.#v(t, "fetch") : (i.status && (i.status.fetchUpdated = !0), this.#O(t, f, h.options, b))), f;
			}, c = (f) => (i.status && (i.status.fetchRejected = !0, i.status.fetchError = f), w(f, !1)), w = (f, _) => {
				let { aborted: a } = o.signal, S = a && i.allowStaleOnFetchAbort, F = S || i.allowStaleOnFetchRejection, b = F || i.noDeleteOnFetchRejection, m = d;
				if (this.#t[e] === d && (!b || !_ && m.__staleWhileFetching === void 0 ? this.#v(t, "fetch") : S || (this.#t[e] = m.__staleWhileFetching)), F) return i.status && m.__staleWhileFetching !== void 0 && (i.status.returnedStale = !0), m.__staleWhileFetching;
				if (m.__returned === m) throw f;
			}, y = (f, _) => {
				let a = this.#x?.(t, n, h);
				o.signal.addEventListener("abort", () => {
					(!i.ignoreFetchAbort || i.allowStaleOnFetchAbort) && (f(void 0), i.allowStaleOnFetchAbort && (f = (S) => r(S, !0)));
				}), a && a instanceof Promise ? a.then((S) => f(S === void 0 ? void 0 : S), _) : a !== void 0 && f(a);
			};
			i.status && (i.status.fetchDispatched = !0);
			let d = new Promise(y).then(r, c), p = Object.assign(d, {
				__abortController: o,
				__staleWhileFetching: n,
				__returned: void 0
			});
			return e === void 0 ? (this.#O(t, p, {
				...h.options,
				status: void 0
			}), e = this.#s.get(t)) : this.#t[e] = p, p;
		}
		#e(t) {
			if (!this.#U) return !1;
			let e = t;
			return !!e && e instanceof Promise && e.hasOwnProperty("__staleWhileFetching") && e.__abortController instanceof AbortController;
		}
		fetch(t, e = {}) {
			let i = g.tracing.hasSubscribers, { status: s = C() ? {} : void 0 } = e;
			e.status = s, s && e.context && (s.context = e.context);
			let n = this.#q(t, e);
			return s && i && (s.trace = !0, g.tracing.tracePromise(() => n, s).catch(() => {})), n;
		}
		async #q(t, e = {}) {
			let { allowStale: i = this.allowStale, updateAgeOnGet: s = this.updateAgeOnGet, noDeleteOnStaleGet: n = this.noDeleteOnStaleGet, ttl: o = this.ttl, noDisposeOnSet: l = this.noDisposeOnSet, size: h = 0, sizeCalculation: r = this.sizeCalculation, noUpdateTTL: c = this.noUpdateTTL, noDeleteOnFetchRejection: w = this.noDeleteOnFetchRejection, allowStaleOnFetchRejection: y = this.allowStaleOnFetchRejection, ignoreFetchAbort: d = this.ignoreFetchAbort, allowStaleOnFetchAbort: p = this.allowStaleOnFetchAbort, context: f, forceRefresh: _ = !1, status: a, signal: S } = e;
			if (a && (a.op = "fetch", a.key = t, _ && (a.forceRefresh = !0), a.cache = this), !this.#U) return a && (a.fetch = "get"), this.#L(t, {
				allowStale: i,
				updateAgeOnGet: s,
				noDeleteOnStaleGet: n,
				status: a
			});
			let F = {
				allowStale: i,
				updateAgeOnGet: s,
				noDeleteOnStaleGet: n,
				ttl: o,
				noDisposeOnSet: l,
				size: h,
				sizeCalculation: r,
				noUpdateTTL: c,
				noDeleteOnFetchRejection: w,
				allowStaleOnFetchRejection: y,
				allowStaleOnFetchAbort: p,
				ignoreFetchAbort: d,
				status: a,
				signal: S
			}, b = this.#s.get(t);
			if (b === void 0) {
				a && (a.fetch = "miss");
				let m = this.#G(t, b, F, f);
				return m.__returned = m;
			} else {
				let m = this.#t[b];
				if (this.#e(m)) {
					let E = i && m.__staleWhileFetching !== void 0;
					return a && (a.fetch = "inflight", E && (a.returnedStale = !0)), E ? m.__staleWhileFetching : m.__returned = m;
				}
				let A = this.#p(b);
				if (!_ && !A) return a && (a.fetch = "hit"), this.#M(b), s && this.#D(b), a && this.#E(a, b), m;
				let z = this.#G(t, b, F, f), v = z.__staleWhileFetching !== void 0 && i;
				return a && (a.fetch = A ? "stale" : "refresh", v && A && (a.returnedStale = !0)), v ? z.__staleWhileFetching : z.__returned = z;
			}
		}
		forceFetch(t, e = {}) {
			let i = g.tracing.hasSubscribers, { status: s = C() ? {} : void 0 } = e;
			e.status = s, s && e.context && (s.context = e.context);
			let n = this.#K(t, e);
			return s && i && (s.trace = !0, g.tracing.tracePromise(() => n, s).catch(() => {})), n;
		}
		async #K(t, e = {}) {
			let i = await this.#q(t, e);
			if (i === void 0) throw new Error("fetch() returned undefined");
			return i;
		}
		memo(t, e = {}) {
			let { status: i = g.metrics.hasSubscribers ? {} : void 0 } = e;
			e.status = i, i && (i.op = "memo", i.key = t, e.context && (i.context = e.context), i.cache = this);
			let s = this.#Q(t, e);
			return i && (i.value = s), g.metrics.hasSubscribers && g.metrics.publish(i), s;
		}
		#Q(t, e = {}) {
			let i = this.#j;
			if (!i) throw new Error("no memoMethod provided to constructor");
			let { context: s, status: n, forceRefresh: o, ...l } = e;
			n && o && (n.forceRefresh = !0);
			let h = this.#L(t, l), r = o || h === void 0;
			if (n && (n.memo = r ? "miss" : "hit", r || (n.value = h)), !r) return h;
			let c = i(t, h, {
				options: l,
				context: s
			});
			return n && (n.value = c), this.#O(t, c, l), c;
		}
		get(t, e = {}) {
			let { status: i = g.metrics.hasSubscribers ? {} : void 0 } = e;
			e.status = i, i && (i.op = "get", i.key = t, i.cache = this);
			let s = this.#L(t, e);
			return i && (s !== void 0 && (i.value = s), g.metrics.hasSubscribers && g.metrics.publish(i)), s;
		}
		#L(t, e = {}) {
			let { allowStale: i = this.allowStale, updateAgeOnGet: s = this.updateAgeOnGet, noDeleteOnStaleGet: n = this.noDeleteOnStaleGet, status: o } = e, l = this.#s.get(t);
			if (l === void 0) {
				o && (o.get = "miss");
				return;
			}
			let h = this.#t[l], r = this.#e(h);
			return o && this.#E(o, l), this.#p(l) ? r ? (o && (o.get = "stale-fetching"), i && h.__staleWhileFetching !== void 0 ? (o && (o.returnedStale = !0), h.__staleWhileFetching) : void 0) : (n || this.#v(t, "expire"), o && (o.get = "stale"), i ? (o && (o.returnedStale = !0), h) : void 0) : (o && (o.get = r ? "fetching" : "hit"), this.#M(l), s && this.#D(l), r ? h.__staleWhileFetching : h);
		}
		#B(t, e) {
			this.#u[e] = t, this.#l[t] = e;
		}
		#M(t) {
			t !== this.#h && (t === this.#a ? this.#a = this.#l[t] : this.#B(this.#u[t], this.#l[t]), this.#B(this.#h, t), this.#h = t);
		}
		delete(t) {
			return this.#v(t, "delete");
		}
		#v(t, e) {
			g.metrics.hasSubscribers && g.metrics.publish({
				op: "delete",
				delete: e,
				key: t,
				cache: this
			});
			let i = !1;
			if (this.#n !== 0) {
				let s = this.#s.get(t);
				if (s !== void 0) if (this.#g?.[s] && (clearTimeout(this.#g[s]), this.#g[s] = void 0), i = !0, this.#n === 1) this.#$(e);
				else {
					this.#C(s);
					let n = this.#t[s];
					if (this.#e(n) ? n.__abortController.abort(/* @__PURE__ */ new Error("deleted")) : (this.#T || this.#f) && (this.#T && this.#m?.(n, t, e), this.#f && this.#r?.push([
						n,
						t,
						e
					])), this.#s.delete(t), this.#i[s] = void 0, this.#t[s] = void 0, s === this.#h) this.#h = this.#u[s];
					else if (s === this.#a) this.#a = this.#l[s];
					else {
						let o = this.#u[s];
						this.#l[o] = this.#l[s];
						let l = this.#l[s];
						this.#u[l] = this.#u[s];
					}
					this.#n--, this.#_.push(s);
				}
			}
			if (this.#f && this.#r?.length) {
				let s = this.#r, n;
				for (; n = s?.shift();) this.#S?.(...n);
			}
			return i;
		}
		clear() {
			return this.#$("delete");
		}
		#$(t) {
			for (let e of this.#z({ allowStale: !0 })) {
				let i = this.#t[e];
				if (this.#e(i)) i.__abortController.abort(/* @__PURE__ */ new Error("deleted"));
				else {
					let s = this.#i[e];
					this.#T && this.#m?.(i, s, t), this.#f && this.#r?.push([
						i,
						s,
						t
					]);
				}
			}
			if (this.#s.clear(), this.#t.fill(void 0), this.#i.fill(void 0), this.#d && this.#F) {
				this.#d.fill(0), this.#F.fill(0);
				for (let e of this.#g ?? []) e !== void 0 && clearTimeout(e);
				this.#g?.fill(void 0);
			}
			if (this.#y && this.#y.fill(0), this.#a = 0, this.#h = 0, this.#_.length = 0, this.#b = 0, this.#n = 0, this.#f && this.#r) {
				let e = this.#r, i;
				for (; i = e?.shift();) this.#S?.(...i);
			}
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/glob@13.0.6/node_modules/glob/dist/commonjs/index.min.js
var require_index_min = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports) => {
	var R = (n, t) => () => (t || n((t = { exports: {} }).exports, t), t.exports);
	var Ge = R((Y) => {
		"use strict";
		Object.defineProperty(Y, "__esModule", { value: !0 });
		Y.range = Y.balanced = void 0;
		var Gs = (n, t, e) => {
			let s = n instanceof RegExp ? Ie(n, e) : n, i = t instanceof RegExp ? Ie(t, e) : t, r = s !== null && i != null && (0, Y.range)(s, i, e);
			return r && {
				start: r[0],
				end: r[1],
				pre: e.slice(0, r[0]),
				body: e.slice(r[0] + s.length, r[1]),
				post: e.slice(r[1] + i.length)
			};
		};
		Y.balanced = Gs;
		var Ie = (n, t) => {
			let e = t.match(n);
			return e ? e[0] : null;
		}, zs = (n, t, e) => {
			let s, i, r, h, o, a = e.indexOf(n), l = e.indexOf(t, a + 1), f = a;
			if (a >= 0 && l > 0) {
				if (n === t) return [a, l];
				for (s = [], r = e.length; f >= 0 && !o;) {
					if (f === a) s.push(f), a = e.indexOf(n, f + 1);
					else if (s.length === 1) {
						let c = s.pop();
						c !== void 0 && (o = [c, l]);
					} else i = s.pop(), i !== void 0 && i < r && (r = i, h = l), l = e.indexOf(t, f + 1);
					f = a < l && a >= 0 ? a : l;
				}
				s.length && h !== void 0 && (o = [r, h]);
			}
			return o;
		};
		Y.range = zs;
	});
	var Ke = R((it) => {
		"use strict";
		Object.defineProperty(it, "__esModule", { value: !0 });
		it.EXPANSION_MAX = void 0;
		it.expand = ei;
		var ze = Ge(), Ue = "\0SLASH" + Math.random() + "\0", $e = "\0OPEN" + Math.random() + "\0", ue = "\0CLOSE" + Math.random() + "\0", qe = "\0COMMA" + Math.random() + "\0", He = "\0PERIOD" + Math.random() + "\0", Us = new RegExp(Ue, "g"), $s = new RegExp($e, "g"), qs = new RegExp(ue, "g"), Hs = new RegExp(qe, "g"), Vs = new RegExp(He, "g"), Ks = /\\\\/g, Xs = /\\{/g, Ys = /\\}/g, Js = /\\,/g, Zs = /\\./g;
		it.EXPANSION_MAX = 1e5;
		function ce(n) {
			return isNaN(n) ? n.charCodeAt(0) : parseInt(n, 10);
		}
		function Qs(n) {
			return n.replace(Ks, Ue).replace(Xs, $e).replace(Ys, ue).replace(Js, qe).replace(Zs, He);
		}
		function ti(n) {
			return n.replace(Us, "\\").replace($s, "{").replace(qs, "}").replace(Hs, ",").replace(Vs, ".");
		}
		function Ve(n) {
			if (!n) return [""];
			let t = [], e = (0, ze.balanced)("{", "}", n);
			if (!e) return n.split(",");
			let { pre: s, body: i, post: r } = e, h = s.split(",");
			h[h.length - 1] += "{" + i + "}";
			let o = Ve(r);
			return r.length && (h[h.length - 1] += o.shift(), h.push.apply(h, o)), t.push.apply(t, h), t;
		}
		function ei(n, t = {}) {
			if (!n) return [];
			let { max: e = it.EXPANSION_MAX } = t;
			return n.slice(0, 2) === "{}" && (n = "\\{\\}" + n.slice(2)), ht(Qs(n), e, !0).map(ti);
		}
		function si(n) {
			return "{" + n + "}";
		}
		function ii(n) {
			return /^-?0\d/.test(n);
		}
		function ri(n, t) {
			return n <= t;
		}
		function ni(n, t) {
			return n >= t;
		}
		function ht(n, t, e) {
			let s = [], i = (0, ze.balanced)("{", "}", n);
			if (!i) return [n];
			let r = i.pre, h = i.post.length ? ht(i.post, t, !1) : [""];
			if (/\$$/.test(i.pre)) for (let o = 0; o < h.length && o < t; o++) {
				let a = r + "{" + i.body + "}" + h[o];
				s.push(a);
			}
			else {
				let o = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(i.body), a = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(i.body), l = o || a, f = i.body.indexOf(",") >= 0;
				if (!l && !f) return i.post.match(/,(?!,).*\}/) ? (n = i.pre + "{" + i.body + ue + i.post, ht(n, t, !0)) : [n];
				let c;
				if (l) c = i.body.split(/\.\./);
				else if (c = Ve(i.body), c.length === 1 && c[0] !== void 0 && (c = ht(c[0], t, !1).map(si), c.length === 1)) return h.map((u) => i.pre + c[0] + u);
				let d;
				if (l && c[0] !== void 0 && c[1] !== void 0) {
					let u = ce(c[0]), m = ce(c[1]), p = Math.max(c[0].length, c[1].length), b = c.length === 3 && c[2] !== void 0 ? Math.abs(ce(c[2])) : 1, w = ri;
					m < u && (b *= -1, w = ni);
					let E = c.some(ii);
					d = [];
					for (let y = u; w(y, m); y += b) {
						let S;
						if (a) S = String.fromCharCode(y), S === "\\" && (S = "");
						else if (S = String(y), E) {
							let B = p - S.length;
							if (B > 0) {
								let U = new Array(B + 1).join("0");
								y < 0 ? S = "-" + U + S.slice(1) : S = U + S;
							}
						}
						d.push(S);
					}
				} else {
					d = [];
					for (let u = 0; u < c.length; u++) d.push.apply(d, ht(c[u], t, !1));
				}
				for (let u = 0; u < d.length; u++) for (let m = 0; m < h.length && s.length < t; m++) {
					let p = r + d[u] + h[m];
					(!e || l || p) && s.push(p);
				}
			}
			return s;
		}
	});
	var Xe = R((Ct) => {
		"use strict";
		Object.defineProperty(Ct, "__esModule", { value: !0 });
		Ct.assertValidPattern = void 0;
		var hi = 65536, oi = (n) => {
			if (typeof n != "string") throw new TypeError("invalid pattern");
			if (n.length > hi) throw new TypeError("pattern is too long");
		};
		Ct.assertValidPattern = oi;
	});
	var Je = R((Rt) => {
		"use strict";
		Object.defineProperty(Rt, "__esModule", { value: !0 });
		Rt.parseClass = void 0;
		var ai = {
			"[:alnum:]": ["\\p{L}\\p{Nl}\\p{Nd}", !0],
			"[:alpha:]": ["\\p{L}\\p{Nl}", !0],
			"[:ascii:]": ["\\x00-\\x7f", !1],
			"[:blank:]": ["\\p{Zs}\\t", !0],
			"[:cntrl:]": ["\\p{Cc}", !0],
			"[:digit:]": ["\\p{Nd}", !0],
			"[:graph:]": [
				"\\p{Z}\\p{C}",
				!0,
				!0
			],
			"[:lower:]": ["\\p{Ll}", !0],
			"[:print:]": ["\\p{C}", !0],
			"[:punct:]": ["\\p{P}", !0],
			"[:space:]": ["\\p{Z}\\t\\r\\n\\v\\f", !0],
			"[:upper:]": ["\\p{Lu}", !0],
			"[:word:]": ["\\p{L}\\p{Nl}\\p{Nd}\\p{Pc}", !0],
			"[:xdigit:]": ["A-Fa-f0-9", !1]
		}, ot = (n) => n.replace(/[[\]\\-]/g, "\\$&"), li = (n) => n.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), Ye = (n) => n.join(""), ci = (n, t) => {
			let e = t;
			if (n.charAt(e) !== "[") throw new Error("not in a brace expression");
			let s = [], i = [], r = e + 1, h = !1, o = !1, a = !1, l = !1, f = e, c = "";
			t: for (; r < n.length;) {
				let p = n.charAt(r);
				if ((p === "!" || p === "^") && r === e + 1) {
					l = !0, r++;
					continue;
				}
				if (p === "]" && h && !a) {
					f = r + 1;
					break;
				}
				if (h = !0, p === "\\" && !a) {
					a = !0, r++;
					continue;
				}
				if (p === "[" && !a) {
					for (let [b, [w, v, E]] of Object.entries(ai)) if (n.startsWith(b, r)) {
						if (c) return [
							"$.",
							!1,
							n.length - e,
							!0
						];
						r += b.length, E ? i.push(w) : s.push(w), o = o || v;
						continue t;
					}
				}
				if (a = !1, c) {
					p > c ? s.push(ot(c) + "-" + ot(p)) : p === c && s.push(ot(p)), c = "", r++;
					continue;
				}
				if (n.startsWith("-]", r + 1)) {
					s.push(ot(p + "-")), r += 2;
					continue;
				}
				if (n.startsWith("-", r + 1)) {
					c = p, r += 2;
					continue;
				}
				s.push(ot(p)), r++;
			}
			if (f < r) return [
				"",
				!1,
				0,
				!1
			];
			if (!s.length && !i.length) return [
				"$.",
				!1,
				n.length - e,
				!0
			];
			if (i.length === 0 && s.length === 1 && /^\\?.$/.test(s[0]) && !l) return [
				li(s[0].length === 2 ? s[0].slice(-1) : s[0]),
				!1,
				f - e,
				!1
			];
			let d = "[" + (l ? "^" : "") + Ye(s) + "]", u = "[" + (l ? "" : "^") + Ye(i) + "]";
			return [
				s.length && i.length ? "(" + d + "|" + u + ")" : s.length ? d : u,
				o,
				f - e,
				!0
			];
		};
		Rt.parseClass = ci;
	});
	var kt = R((At) => {
		"use strict";
		Object.defineProperty(At, "__esModule", { value: !0 });
		At.unescape = void 0;
		var ui = (n, { windowsPathsNoEscape: t = !1, magicalBraces: e = !0 } = {}) => e ? t ? n.replace(/\[([^\/\\])\]/g, "$1") : n.replace(/((?!\\).|^)\[([^\/\\])\]/g, "$1$2").replace(/\\([^\/])/g, "$1") : t ? n.replace(/\[([^\/\\{}])\]/g, "$1") : n.replace(/((?!\\).|^)\[([^\/\\{}])\]/g, "$1$2").replace(/\\([^\/{}])/g, "$1");
		At.unescape = ui;
	});
	var pe = R((Dt) => {
		"use strict";
		Object.defineProperty(Dt, "__esModule", { value: !0 });
		Dt.AST = void 0;
		var fi = Je(), Mt = kt(), di = /* @__PURE__ */ new Set([
			"!",
			"?",
			"+",
			"*",
			"@"
		]), Ze = (n) => di.has(n), pi = "(?!(?:^|/)\\.\\.?(?:$|/))", Pt = "(?!\\.)", mi = /* @__PURE__ */ new Set(["[", "."]), gi = /* @__PURE__ */ new Set(["..", "."]), wi = /* @__PURE__ */ new Set("().*{}+?[]^$\\!"), bi = (n) => n.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), de = "[^/]", Qe = de + "*?", ts = de + "+?";
		Dt.AST = class n {
			type;
			#t;
			#s;
			#n = !1;
			#r = [];
			#h;
			#S;
			#w;
			#c = !1;
			#o;
			#f;
			#u = !1;
			constructor(t, e, s = {}) {
				this.type = t, t && (this.#s = !0), this.#h = e, this.#t = this.#h ? this.#h.#t : this, this.#o = this.#t === this ? s : this.#t.#o, this.#w = this.#t === this ? [] : this.#t.#w, t === "!" && !this.#t.#c && this.#w.push(this), this.#S = this.#h ? this.#h.#r.length : 0;
			}
			get hasMagic() {
				if (this.#s !== void 0) return this.#s;
				for (let t of this.#r) if (typeof t != "string" && (t.type || t.hasMagic)) return this.#s = !0;
				return this.#s;
			}
			toString() {
				return this.#f !== void 0 ? this.#f : this.type ? this.#f = this.type + "(" + this.#r.map((t) => String(t)).join("|") + ")" : this.#f = this.#r.map((t) => String(t)).join("");
			}
			#a() {
				if (this !== this.#t) throw new Error("should only call on root");
				if (this.#c) return this;
				this.toString(), this.#c = !0;
				let t;
				for (; t = this.#w.pop();) {
					if (t.type !== "!") continue;
					let e = t, s = e.#h;
					for (; s;) {
						for (let i = e.#S + 1; !s.type && i < s.#r.length; i++) for (let r of t.#r) {
							if (typeof r == "string") throw new Error("string part in extglob AST??");
							r.copyIn(s.#r[i]);
						}
						e = s, s = e.#h;
					}
				}
				return this;
			}
			push(...t) {
				for (let e of t) if (e !== "") {
					if (typeof e != "string" && !(e instanceof n && e.#h === this)) throw new Error("invalid part: " + e);
					this.#r.push(e);
				}
			}
			toJSON() {
				let t = this.type === null ? this.#r.slice().map((e) => typeof e == "string" ? e : e.toJSON()) : [this.type, ...this.#r.map((e) => e.toJSON())];
				return this.isStart() && !this.type && t.unshift([]), this.isEnd() && (this === this.#t || this.#t.#c && this.#h?.type === "!") && t.push({}), t;
			}
			isStart() {
				if (this.#t === this) return !0;
				if (!this.#h?.isStart()) return !1;
				if (this.#S === 0) return !0;
				let t = this.#h;
				for (let e = 0; e < this.#S; e++) {
					let s = t.#r[e];
					if (!(s instanceof n && s.type === "!")) return !1;
				}
				return !0;
			}
			isEnd() {
				if (this.#t === this || this.#h?.type === "!") return !0;
				if (!this.#h?.isEnd()) return !1;
				if (!this.type) return this.#h?.isEnd();
				let t = this.#h ? this.#h.#r.length : 0;
				return this.#S === t - 1;
			}
			copyIn(t) {
				typeof t == "string" ? this.push(t) : this.push(t.clone(this));
			}
			clone(t) {
				let e = new n(this.type, t);
				for (let s of this.#r) e.copyIn(s);
				return e;
			}
			static #i(t, e, s, i) {
				let r = !1, h = !1, o = -1, a = !1;
				if (e.type === null) {
					let u = s, m = "";
					for (; u < t.length;) {
						let p = t.charAt(u++);
						if (r || p === "\\") {
							r = !r, m += p;
							continue;
						}
						if (h) {
							u === o + 1 ? (p === "^" || p === "!") && (a = !0) : p === "]" && !(u === o + 2 && a) && (h = !1), m += p;
							continue;
						} else if (p === "[") {
							h = !0, o = u, a = !1, m += p;
							continue;
						}
						if (!i.noext && Ze(p) && t.charAt(u) === "(") {
							e.push(m), m = "";
							let b = new n(p, e);
							u = n.#i(t, b, u, i), e.push(b);
							continue;
						}
						m += p;
					}
					return e.push(m), u;
				}
				let l = s + 1, f = new n(null, e), c = [], d = "";
				for (; l < t.length;) {
					let u = t.charAt(l++);
					if (r || u === "\\") {
						r = !r, d += u;
						continue;
					}
					if (h) {
						l === o + 1 ? (u === "^" || u === "!") && (a = !0) : u === "]" && !(l === o + 2 && a) && (h = !1), d += u;
						continue;
					} else if (u === "[") {
						h = !0, o = l, a = !1, d += u;
						continue;
					}
					if (Ze(u) && t.charAt(l) === "(") {
						f.push(d), d = "";
						let m = new n(u, f);
						f.push(m), l = n.#i(t, m, l, i);
						continue;
					}
					if (u === "|") {
						f.push(d), d = "", c.push(f), f = new n(null, e);
						continue;
					}
					if (u === ")") return d === "" && e.#r.length === 0 && (e.#u = !0), f.push(d), d = "", e.push(...c, f), l;
					d += u;
				}
				return e.type = null, e.#s = void 0, e.#r = [t.substring(s - 1)], l;
			}
			static fromGlob(t, e = {}) {
				let s = new n(null, void 0, e);
				return n.#i(t, s, 0, e), s;
			}
			toMMPattern() {
				if (this !== this.#t) return this.#t.toMMPattern();
				let t = this.toString(), [e, s, i, r] = this.toRegExpSource();
				if (!(i || this.#s || this.#o.nocase && !this.#o.nocaseMagicOnly && t.toUpperCase() !== t.toLowerCase())) return s;
				let o = (this.#o.nocase ? "i" : "") + (r ? "u" : "");
				return Object.assign(new RegExp(`^${e}$`, o), {
					_src: e,
					_glob: t
				});
			}
			get options() {
				return this.#o;
			}
			toRegExpSource(t) {
				let e = t ?? !!this.#o.dot;
				if (this.#t === this && this.#a(), !this.type) {
					let a = this.isStart() && this.isEnd() && !this.#r.some((u) => typeof u != "string"), l = this.#r.map((u) => {
						let [m, p, b, w] = typeof u == "string" ? n.#v(u, this.#s, a) : u.toRegExpSource(t);
						return this.#s = this.#s || b, this.#n = this.#n || w, m;
					}).join(""), f = "";
					if (this.isStart() && typeof this.#r[0] == "string" && !(this.#r.length === 1 && gi.has(this.#r[0]))) {
						let m = mi, p = e && m.has(l.charAt(0)) || l.startsWith("\\.") && m.has(l.charAt(2)) || l.startsWith("\\.\\.") && m.has(l.charAt(4)), b = !e && !t && m.has(l.charAt(0));
						f = p ? pi : b ? Pt : "";
					}
					let c = "";
					return this.isEnd() && this.#t.#c && this.#h?.type === "!" && (c = "(?:$|\\/)"), [
						f + l + c,
						(0, Mt.unescape)(l),
						this.#s = !!this.#s,
						this.#n
					];
				}
				let s = this.type === "*" || this.type === "+", i = this.type === "!" ? "(?:(?!(?:" : "(?:", r = this.#d(e);
				if (this.isStart() && this.isEnd() && !r && this.type !== "!") {
					let a = this.toString();
					return this.#r = [a], this.type = null, this.#s = void 0, [
						a,
						(0, Mt.unescape)(this.toString()),
						!1,
						!1
					];
				}
				let h = !s || t || e || !Pt ? "" : this.#d(!0);
				h === r && (h = ""), h && (r = `(?:${r})(?:${h})*?`);
				let o = "";
				if (this.type === "!" && this.#u) o = (this.isStart() && !e ? Pt : "") + ts;
				else {
					let a = this.type === "!" ? "))" + (this.isStart() && !e && !t ? Pt : "") + Qe + ")" : this.type === "@" ? ")" : this.type === "?" ? ")?" : this.type === "+" && h ? ")" : this.type === "*" && h ? ")?" : `)${this.type}`;
					o = i + r + a;
				}
				return [
					o,
					(0, Mt.unescape)(r),
					this.#s = !!this.#s,
					this.#n
				];
			}
			#d(t) {
				return this.#r.map((e) => {
					if (typeof e == "string") throw new Error("string type in extglob ast??");
					let [s, i, r, h] = e.toRegExpSource(t);
					return this.#n = this.#n || h, s;
				}).filter((e) => !(this.isStart() && this.isEnd()) || !!e).join("|");
			}
			static #v(t, e, s = !1) {
				let i = !1, r = "", h = !1, o = !1;
				for (let a = 0; a < t.length; a++) {
					let l = t.charAt(a);
					if (i) {
						i = !1, r += (wi.has(l) ? "\\" : "") + l;
						continue;
					}
					if (l === "*") {
						if (o) continue;
						o = !0, r += s && /^[*]+$/.test(t) ? ts : Qe, e = !0;
						continue;
					} else o = !1;
					if (l === "\\") {
						a === t.length - 1 ? r += "\\\\" : i = !0;
						continue;
					}
					if (l === "[") {
						let [f, c, d, u] = (0, fi.parseClass)(t, a);
						if (d) {
							r += f, h = h || c, a += d - 1, e = e || u;
							continue;
						}
					}
					if (l === "?") {
						r += de, e = !0;
						continue;
					}
					r += bi(l);
				}
				return [
					r,
					(0, Mt.unescape)(t),
					!!e,
					h
				];
			}
		};
	});
	var me = R((Ft) => {
		"use strict";
		Object.defineProperty(Ft, "__esModule", { value: !0 });
		Ft.escape = void 0;
		var yi = (n, { windowsPathsNoEscape: t = !1, magicalBraces: e = !1 } = {}) => e ? t ? n.replace(/[?*()[\]{}]/g, "[$&]") : n.replace(/[?*()[\]\\{}]/g, "\\$&") : t ? n.replace(/[?*()[\]]/g, "[$&]") : n.replace(/[?*()[\]\\]/g, "\\$&");
		Ft.escape = yi;
	});
	var H = R((g) => {
		"use strict";
		Object.defineProperty(g, "__esModule", { value: !0 });
		g.unescape = g.escape = g.AST = g.Minimatch = g.match = g.makeRe = g.braceExpand = g.defaults = g.filter = g.GLOBSTAR = g.sep = g.minimatch = void 0;
		var Si = Ke(), jt = Xe(), is = pe(), vi = me(), Ei = kt(), _i = (n, t, e = {}) => ((0, jt.assertValidPattern)(t), !e.nocomment && t.charAt(0) === "#" ? !1 : new J(t, e).match(n));
		g.minimatch = _i;
		var Oi = /^\*+([^+@!?\*\[\(]*)$/, xi = (n) => (t) => !t.startsWith(".") && t.endsWith(n), Ti = (n) => (t) => t.endsWith(n), Ci = (n) => (n = n.toLowerCase(), (t) => !t.startsWith(".") && t.toLowerCase().endsWith(n)), Ri = (n) => (n = n.toLowerCase(), (t) => t.toLowerCase().endsWith(n)), Ai = /^\*+\.\*+$/, ki = (n) => !n.startsWith(".") && n.includes("."), Mi = (n) => n !== "." && n !== ".." && n.includes("."), Pi = /^\.\*+$/, Di = (n) => n !== "." && n !== ".." && n.startsWith("."), Fi = /^\*+$/, ji = (n) => n.length !== 0 && !n.startsWith("."), Ni = (n) => n.length !== 0 && n !== "." && n !== "..", Li = /^\?+([^+@!?\*\[\(]*)?$/, Wi = ([n, t = ""]) => {
			let e = rs([n]);
			return t ? (t = t.toLowerCase(), (s) => e(s) && s.toLowerCase().endsWith(t)) : e;
		}, Bi = ([n, t = ""]) => {
			let e = ns([n]);
			return t ? (t = t.toLowerCase(), (s) => e(s) && s.toLowerCase().endsWith(t)) : e;
		}, Ii = ([n, t = ""]) => {
			let e = ns([n]);
			return t ? (s) => e(s) && s.endsWith(t) : e;
		}, Gi = ([n, t = ""]) => {
			let e = rs([n]);
			return t ? (s) => e(s) && s.endsWith(t) : e;
		}, rs = ([n]) => {
			let t = n.length;
			return (e) => e.length === t && !e.startsWith(".");
		}, ns = ([n]) => {
			let t = n.length;
			return (e) => e.length === t && e !== "." && e !== "..";
		}, hs = typeof process == "object" && process ? typeof process.env == "object" && process.env && process.env.__MINIMATCH_TESTING_PLATFORM__ || process.platform : "posix", es = {
			win32: { sep: "\\" },
			posix: { sep: "/" }
		};
		g.sep = hs === "win32" ? es.win32.sep : es.posix.sep;
		g.minimatch.sep = g.sep;
		g.GLOBSTAR = Symbol("globstar **");
		g.minimatch.GLOBSTAR = g.GLOBSTAR;
		var Ui = "[^/]*?", $i = "(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?", qi = "(?:(?!(?:\\/|^)\\.).)*?", Hi = (n, t = {}) => (e) => (0, g.minimatch)(e, n, t);
		g.filter = Hi;
		g.minimatch.filter = g.filter;
		var F = (n, t = {}) => Object.assign({}, n, t), Vi = (n) => {
			if (!n || typeof n != "object" || !Object.keys(n).length) return g.minimatch;
			let t = g.minimatch;
			return Object.assign((s, i, r = {}) => t(s, i, F(n, r)), {
				Minimatch: class extends t.Minimatch {
					constructor(i, r = {}) {
						super(i, F(n, r));
					}
					static defaults(i) {
						return t.defaults(F(n, i)).Minimatch;
					}
				},
				AST: class extends t.AST {
					constructor(i, r, h = {}) {
						super(i, r, F(n, h));
					}
					static fromGlob(i, r = {}) {
						return t.AST.fromGlob(i, F(n, r));
					}
				},
				unescape: (s, i = {}) => t.unescape(s, F(n, i)),
				escape: (s, i = {}) => t.escape(s, F(n, i)),
				filter: (s, i = {}) => t.filter(s, F(n, i)),
				defaults: (s) => t.defaults(F(n, s)),
				makeRe: (s, i = {}) => t.makeRe(s, F(n, i)),
				braceExpand: (s, i = {}) => t.braceExpand(s, F(n, i)),
				match: (s, i, r = {}) => t.match(s, i, F(n, r)),
				sep: t.sep,
				GLOBSTAR: g.GLOBSTAR
			});
		};
		g.defaults = Vi;
		g.minimatch.defaults = g.defaults;
		var Ki = (n, t = {}) => ((0, jt.assertValidPattern)(n), t.nobrace || !/\{(?:(?!\{).)*\}/.test(n) ? [n] : (0, Si.expand)(n, { max: t.braceExpandMax }));
		g.braceExpand = Ki;
		g.minimatch.braceExpand = g.braceExpand;
		var Xi = (n, t = {}) => new J(n, t).makeRe();
		g.makeRe = Xi;
		g.minimatch.makeRe = g.makeRe;
		var Yi = (n, t, e = {}) => {
			let s = new J(t, e);
			return n = n.filter((i) => s.match(i)), s.options.nonull && !n.length && n.push(t), n;
		};
		g.match = Yi;
		g.minimatch.match = g.match;
		var ss = /[?*]|[+@!]\(.*?\)|\[|\]/, Ji = (n) => n.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"), J = class {
			options;
			set;
			pattern;
			windowsPathsNoEscape;
			nonegate;
			negate;
			comment;
			empty;
			preserveMultipleSlashes;
			partial;
			globSet;
			globParts;
			nocase;
			isWindows;
			platform;
			windowsNoMagicRoot;
			regexp;
			constructor(t, e = {}) {
				(0, jt.assertValidPattern)(t), e = e || {}, this.options = e, this.pattern = t, this.platform = e.platform || hs, this.isWindows = this.platform === "win32";
				let s = "allowWindowsEscape";
				this.windowsPathsNoEscape = !!e.windowsPathsNoEscape || e[s] === !1, this.windowsPathsNoEscape && (this.pattern = this.pattern.replace(/\\/g, "/")), this.preserveMultipleSlashes = !!e.preserveMultipleSlashes, this.regexp = null, this.negate = !1, this.nonegate = !!e.nonegate, this.comment = !1, this.empty = !1, this.partial = !!e.partial, this.nocase = !!this.options.nocase, this.windowsNoMagicRoot = e.windowsNoMagicRoot !== void 0 ? e.windowsNoMagicRoot : !!(this.isWindows && this.nocase), this.globSet = [], this.globParts = [], this.set = [], this.make();
			}
			hasMagic() {
				if (this.options.magicalBraces && this.set.length > 1) return !0;
				for (let t of this.set) for (let e of t) if (typeof e != "string") return !0;
				return !1;
			}
			debug(...t) {}
			make() {
				let t = this.pattern, e = this.options;
				if (!e.nocomment && t.charAt(0) === "#") {
					this.comment = !0;
					return;
				}
				if (!t) {
					this.empty = !0;
					return;
				}
				this.parseNegate(), this.globSet = [...new Set(this.braceExpand())], e.debug && (this.debug = (...r) => console.error(...r)), this.debug(this.pattern, this.globSet);
				let s = this.globSet.map((r) => this.slashSplit(r));
				this.globParts = this.preprocess(s), this.debug(this.pattern, this.globParts);
				let i = this.globParts.map((r, h, o) => {
					if (this.isWindows && this.windowsNoMagicRoot) {
						let a = r[0] === "" && r[1] === "" && (r[2] === "?" || !ss.test(r[2])) && !ss.test(r[3]), l = /^[a-z]:/i.test(r[0]);
						if (a) return [...r.slice(0, 4), ...r.slice(4).map((f) => this.parse(f))];
						if (l) return [r[0], ...r.slice(1).map((f) => this.parse(f))];
					}
					return r.map((a) => this.parse(a));
				});
				if (this.debug(this.pattern, i), this.set = i.filter((r) => r.indexOf(!1) === -1), this.isWindows) for (let r = 0; r < this.set.length; r++) {
					let h = this.set[r];
					h[0] === "" && h[1] === "" && this.globParts[r][2] === "?" && typeof h[3] == "string" && /^[a-z]:$/i.test(h[3]) && (h[2] = "?");
				}
				this.debug(this.pattern, this.set);
			}
			preprocess(t) {
				if (this.options.noglobstar) for (let s = 0; s < t.length; s++) for (let i = 0; i < t[s].length; i++) t[s][i] === "**" && (t[s][i] = "*");
				let { optimizationLevel: e = 1 } = this.options;
				return e >= 2 ? (t = this.firstPhasePreProcess(t), t = this.secondPhasePreProcess(t)) : e >= 1 ? t = this.levelOneOptimize(t) : t = this.adjascentGlobstarOptimize(t), t;
			}
			adjascentGlobstarOptimize(t) {
				return t.map((e) => {
					let s = -1;
					for (; (s = e.indexOf("**", s + 1)) !== -1;) {
						let i = s;
						for (; e[i + 1] === "**";) i++;
						i !== s && e.splice(s, i - s);
					}
					return e;
				});
			}
			levelOneOptimize(t) {
				return t.map((e) => (e = e.reduce((s, i) => {
					let r = s[s.length - 1];
					return i === "**" && r === "**" ? s : i === ".." && r && r !== ".." && r !== "." && r !== "**" ? (s.pop(), s) : (s.push(i), s);
				}, []), e.length === 0 ? [""] : e));
			}
			levelTwoFileOptimize(t) {
				Array.isArray(t) || (t = this.slashSplit(t));
				let e = !1;
				do {
					if (e = !1, !this.preserveMultipleSlashes) {
						for (let i = 1; i < t.length - 1; i++) {
							let r = t[i];
							i === 1 && r === "" && t[0] === "" || (r === "." || r === "") && (e = !0, t.splice(i, 1), i--);
						}
						t[0] === "." && t.length === 2 && (t[1] === "." || t[1] === "") && (e = !0, t.pop());
					}
					let s = 0;
					for (; (s = t.indexOf("..", s + 1)) !== -1;) {
						let i = t[s - 1];
						i && i !== "." && i !== ".." && i !== "**" && (e = !0, t.splice(s - 1, 2), s -= 2);
					}
				} while (e);
				return t.length === 0 ? [""] : t;
			}
			firstPhasePreProcess(t) {
				let e = !1;
				do {
					e = !1;
					for (let s of t) {
						let i = -1;
						for (; (i = s.indexOf("**", i + 1)) !== -1;) {
							let h = i;
							for (; s[h + 1] === "**";) h++;
							h > i && s.splice(i + 1, h - i);
							let o = s[i + 1], a = s[i + 2], l = s[i + 3];
							if (o !== ".." || !a || a === "." || a === ".." || !l || l === "." || l === "..") continue;
							e = !0, s.splice(i, 1);
							let f = s.slice(0);
							f[i] = "**", t.push(f), i--;
						}
						if (!this.preserveMultipleSlashes) {
							for (let h = 1; h < s.length - 1; h++) {
								let o = s[h];
								h === 1 && o === "" && s[0] === "" || (o === "." || o === "") && (e = !0, s.splice(h, 1), h--);
							}
							s[0] === "." && s.length === 2 && (s[1] === "." || s[1] === "") && (e = !0, s.pop());
						}
						let r = 0;
						for (; (r = s.indexOf("..", r + 1)) !== -1;) {
							let h = s[r - 1];
							if (h && h !== "." && h !== ".." && h !== "**") {
								e = !0;
								let a = r === 1 && s[r + 1] === "**" ? ["."] : [];
								s.splice(r - 1, 2, ...a), s.length === 0 && s.push(""), r -= 2;
							}
						}
					}
				} while (e);
				return t;
			}
			secondPhasePreProcess(t) {
				for (let e = 0; e < t.length - 1; e++) for (let s = e + 1; s < t.length; s++) {
					let i = this.partsMatch(t[e], t[s], !this.preserveMultipleSlashes);
					if (i) {
						t[e] = [], t[s] = i;
						break;
					}
				}
				return t.filter((e) => e.length);
			}
			partsMatch(t, e, s = !1) {
				let i = 0, r = 0, h = [], o = "";
				for (; i < t.length && r < e.length;) if (t[i] === e[r]) h.push(o === "b" ? e[r] : t[i]), i++, r++;
				else if (s && t[i] === "**" && e[r] === t[i + 1]) h.push(t[i]), i++;
				else if (s && e[r] === "**" && t[i] === e[r + 1]) h.push(e[r]), r++;
				else if (t[i] === "*" && e[r] && (this.options.dot || !e[r].startsWith(".")) && e[r] !== "**") {
					if (o === "b") return !1;
					o = "a", h.push(t[i]), i++, r++;
				} else if (e[r] === "*" && t[i] && (this.options.dot || !t[i].startsWith(".")) && t[i] !== "**") {
					if (o === "a") return !1;
					o = "b", h.push(e[r]), i++, r++;
				} else return !1;
				return t.length === e.length && h;
			}
			parseNegate() {
				if (this.nonegate) return;
				let t = this.pattern, e = !1, s = 0;
				for (let i = 0; i < t.length && t.charAt(i) === "!"; i++) e = !e, s++;
				s && (this.pattern = t.slice(s)), this.negate = e;
			}
			matchOne(t, e, s = !1) {
				let i = this.options;
				if (this.isWindows) {
					let p = typeof t[0] == "string" && /^[a-z]:$/i.test(t[0]), b = !p && t[0] === "" && t[1] === "" && t[2] === "?" && /^[a-z]:$/i.test(t[3]), w = typeof e[0] == "string" && /^[a-z]:$/i.test(e[0]), v = !w && e[0] === "" && e[1] === "" && e[2] === "?" && typeof e[3] == "string" && /^[a-z]:$/i.test(e[3]), E = b ? 3 : p ? 0 : void 0, y = v ? 3 : w ? 0 : void 0;
					if (typeof E == "number" && typeof y == "number") {
						let [S, B] = [t[E], e[y]];
						S.toLowerCase() === B.toLowerCase() && (e[y] = S, y > E ? e = e.slice(y) : E > y && (t = t.slice(E)));
					}
				}
				let { optimizationLevel: r = 1 } = this.options;
				r >= 2 && (t = this.levelTwoFileOptimize(t)), this.debug("matchOne", this, {
					file: t,
					pattern: e
				}), this.debug("matchOne", t.length, e.length);
				for (var h = 0, o = 0, a = t.length, l = e.length; h < a && o < l; h++, o++) {
					this.debug("matchOne loop");
					var f = e[o], c = t[h];
					if (this.debug(e, f, c), f === !1) return !1;
					if (f === g.GLOBSTAR) {
						this.debug("GLOBSTAR", [
							e,
							f,
							c
						]);
						var d = h, u = o + 1;
						if (u === l) {
							for (this.debug("** at the end"); h < a; h++) if (t[h] === "." || t[h] === ".." || !i.dot && t[h].charAt(0) === ".") return !1;
							return !0;
						}
						for (; d < a;) {
							var m = t[d];
							if (this.debug(`
globstar while`, t, d, e, u, m), this.matchOne(t.slice(d), e.slice(u), s)) return this.debug("globstar found match!", d, a, m), !0;
							if (m === "." || m === ".." || !i.dot && m.charAt(0) === ".") {
								this.debug("dot detected!", t, d, e, u);
								break;
							}
							this.debug("globstar swallow a segment, and continue"), d++;
						}
						return !!(s && (this.debug(`
>>> no match, partial?`, t, d, e, u), d === a));
					}
					let p;
					if (typeof f == "string" ? (p = c === f, this.debug("string match", f, c, p)) : (p = f.test(c), this.debug("pattern match", f, c, p)), !p) return !1;
				}
				if (h === a && o === l) return !0;
				if (h === a) return s;
				if (o === l) return h === a - 1 && t[h] === "";
				throw new Error("wtf?");
			}
			braceExpand() {
				return (0, g.braceExpand)(this.pattern, this.options);
			}
			parse(t) {
				(0, jt.assertValidPattern)(t);
				let e = this.options;
				if (t === "**") return g.GLOBSTAR;
				if (t === "") return "";
				let s, i = null;
				(s = t.match(Fi)) ? i = e.dot ? Ni : ji : (s = t.match(Oi)) ? i = (e.nocase ? e.dot ? Ri : Ci : e.dot ? Ti : xi)(s[1]) : (s = t.match(Li)) ? i = (e.nocase ? e.dot ? Bi : Wi : e.dot ? Ii : Gi)(s) : (s = t.match(Ai)) ? i = e.dot ? Mi : ki : (s = t.match(Pi)) && (i = Di);
				let r = is.AST.fromGlob(t, this.options).toMMPattern();
				return i && typeof r == "object" && Reflect.defineProperty(r, "test", { value: i }), r;
			}
			makeRe() {
				if (this.regexp || this.regexp === !1) return this.regexp;
				let t = this.set;
				if (!t.length) return this.regexp = !1, this.regexp;
				let e = this.options, s = e.noglobstar ? Ui : e.dot ? $i : qi, i = new Set(e.nocase ? ["i"] : []), r = t.map((a) => {
					let l = a.map((c) => {
						if (c instanceof RegExp) for (let d of c.flags.split("")) i.add(d);
						return typeof c == "string" ? Ji(c) : c === g.GLOBSTAR ? g.GLOBSTAR : c._src;
					});
					l.forEach((c, d) => {
						let u = l[d + 1], m = l[d - 1];
						c !== g.GLOBSTAR || m === g.GLOBSTAR || (m === void 0 ? u !== void 0 && u !== g.GLOBSTAR ? l[d + 1] = "(?:\\/|" + s + "\\/)?" + u : l[d] = s : u === void 0 ? l[d - 1] = m + "(?:\\/|\\/" + s + ")?" : u !== g.GLOBSTAR && (l[d - 1] = m + "(?:\\/|\\/" + s + "\\/)" + u, l[d + 1] = g.GLOBSTAR));
					});
					let f = l.filter((c) => c !== g.GLOBSTAR);
					if (this.partial && f.length >= 1) {
						let c = [];
						for (let d = 1; d <= f.length; d++) c.push(f.slice(0, d).join("/"));
						return "(?:" + c.join("|") + ")";
					}
					return f.join("/");
				}).join("|"), [h, o] = t.length > 1 ? ["(?:", ")"] : ["", ""];
				r = "^" + h + r + o + "$", this.partial && (r = "^(?:\\/|" + h + r.slice(1, -1) + o + ")$"), this.negate && (r = "^(?!" + r + ").+$");
				try {
					this.regexp = new RegExp(r, [...i].join(""));
				} catch {
					this.regexp = !1;
				}
				return this.regexp;
			}
			slashSplit(t) {
				return this.preserveMultipleSlashes ? t.split("/") : this.isWindows && /^\/\/[^\/]+/.test(t) ? ["", ...t.split(/\/+/)] : t.split(/\/+/);
			}
			match(t, e = this.partial) {
				if (this.debug("match", t, this.pattern), this.comment) return !1;
				if (this.empty) return t === "";
				if (t === "/" && e) return !0;
				let s = this.options;
				this.isWindows && (t = t.split("\\").join("/"));
				let i = this.slashSplit(t);
				this.debug(this.pattern, "split", i);
				let r = this.set;
				this.debug(this.pattern, "set", r);
				let h = i[i.length - 1];
				if (!h) for (let o = i.length - 2; !h && o >= 0; o--) h = i[o];
				for (let o = 0; o < r.length; o++) {
					let a = r[o], l = i;
					if (s.matchBase && a.length === 1 && (l = [h]), this.matchOne(l, a, e)) return s.flipNegate ? !0 : !this.negate;
				}
				return s.flipNegate ? !1 : this.negate;
			}
			static defaults(t) {
				return g.minimatch.defaults(t).Minimatch;
			}
		};
		g.Minimatch = J;
		var Zi = pe();
		Object.defineProperty(g, "AST", {
			enumerable: !0,
			get: function() {
				return Zi.AST;
			}
		});
		var Qi = me();
		Object.defineProperty(g, "escape", {
			enumerable: !0,
			get: function() {
				return Qi.escape;
			}
		});
		var tr = kt();
		Object.defineProperty(g, "unescape", {
			enumerable: !0,
			get: function() {
				return tr.unescape;
			}
		});
		g.minimatch.AST = is.AST;
		g.minimatch.Minimatch = J;
		g.minimatch.escape = vi.escape;
		g.minimatch.unescape = Ei.unescape;
	});
	var fs = R((Wt) => {
		"use strict";
		Object.defineProperty(Wt, "__esModule", { value: !0 });
		Wt.LRUCache = void 0;
		var er = typeof performance == "object" && performance && typeof performance.now == "function" ? performance : Date, as = /* @__PURE__ */ new Set(), ge = typeof process == "object" && process ? process : {}, ls = (n, t, e, s) => {
			typeof ge.emitWarning == "function" ? ge.emitWarning(n, t, e, s) : console.error(`[${e}] ${t}: ${n}`);
		}, Lt = globalThis.AbortController, os = globalThis.AbortSignal;
		if (typeof Lt > "u") {
			os = class {
				onabort;
				_onabort = [];
				reason;
				aborted = !1;
				addEventListener(e, s) {
					this._onabort.push(s);
				}
			}, Lt = class {
				constructor() {
					t();
				}
				signal = new os();
				abort(e) {
					if (!this.signal.aborted) {
						this.signal.reason = e, this.signal.aborted = !0;
						for (let s of this.signal._onabort) s(e);
						this.signal.onabort?.(e);
					}
				}
			};
			let n = ge.env?.LRU_CACHE_IGNORE_AC_WARNING !== "1", t = () => {
				n && (n = !1, ls("AbortController is not defined. If using lru-cache in node 14, load an AbortController polyfill from the `node-abort-controller` package. A minimal polyfill is provided for use by LRUCache.fetch(), but it should not be relied upon in other contexts (eg, passing it to other APIs that use AbortController/AbortSignal might have undesirable effects). You may disable this with LRU_CACHE_IGNORE_AC_WARNING=1 in the env.", "NO_ABORT_CONTROLLER", "ENOTSUP", t));
			};
		}
		var sr = (n) => !as.has(n), V = (n) => n && n === Math.floor(n) && n > 0 && isFinite(n), cs = (n) => V(n) ? n <= Math.pow(2, 8) ? Uint8Array : n <= Math.pow(2, 16) ? Uint16Array : n <= Math.pow(2, 32) ? Uint32Array : n <= Number.MAX_SAFE_INTEGER ? Nt : null : null, Nt = class extends Array {
			constructor(n) {
				super(n), this.fill(0);
			}
		}, ir = class at {
			heap;
			length;
			static #t = !1;
			static create(t) {
				let e = cs(t);
				if (!e) return [];
				at.#t = !0;
				let s = new at(t, e);
				return at.#t = !1, s;
			}
			constructor(t, e) {
				if (!at.#t) throw new TypeError("instantiate Stack using Stack.create(n)");
				this.heap = new e(t), this.length = 0;
			}
			push(t) {
				this.heap[this.length++] = t;
			}
			pop() {
				return this.heap[--this.length];
			}
		};
		Wt.LRUCache = class us {
			#t;
			#s;
			#n;
			#r;
			#h;
			#S;
			#w;
			#c;
			get perf() {
				return this.#c;
			}
			ttl;
			ttlResolution;
			ttlAutopurge;
			updateAgeOnGet;
			updateAgeOnHas;
			allowStale;
			noDisposeOnSet;
			noUpdateTTL;
			maxEntrySize;
			sizeCalculation;
			noDeleteOnFetchRejection;
			noDeleteOnStaleGet;
			allowStaleOnFetchAbort;
			allowStaleOnFetchRejection;
			ignoreFetchAbort;
			#o;
			#f;
			#u;
			#a;
			#i;
			#d;
			#v;
			#y;
			#p;
			#R;
			#m;
			#O;
			#x;
			#g;
			#b;
			#E;
			#T;
			#e;
			#F;
			static unsafeExposeInternals(t) {
				return {
					starts: t.#x,
					ttls: t.#g,
					autopurgeTimers: t.#b,
					sizes: t.#O,
					keyMap: t.#u,
					keyList: t.#a,
					valList: t.#i,
					next: t.#d,
					prev: t.#v,
					get head() {
						return t.#y;
					},
					get tail() {
						return t.#p;
					},
					free: t.#R,
					isBackgroundFetch: (e) => t.#l(e),
					backgroundFetch: (e, s, i, r) => t.#z(e, s, i, r),
					moveToTail: (e) => t.#N(e),
					indexes: (e) => t.#k(e),
					rindexes: (e) => t.#M(e),
					isStale: (e) => t.#_(e)
				};
			}
			get max() {
				return this.#t;
			}
			get maxSize() {
				return this.#s;
			}
			get calculatedSize() {
				return this.#f;
			}
			get size() {
				return this.#o;
			}
			get fetchMethod() {
				return this.#S;
			}
			get memoMethod() {
				return this.#w;
			}
			get dispose() {
				return this.#n;
			}
			get onInsert() {
				return this.#r;
			}
			get disposeAfter() {
				return this.#h;
			}
			constructor(t) {
				let { max: e = 0, ttl: s, ttlResolution: i = 1, ttlAutopurge: r, updateAgeOnGet: h, updateAgeOnHas: o, allowStale: a, dispose: l, onInsert: f, disposeAfter: c, noDisposeOnSet: d, noUpdateTTL: u, maxSize: m = 0, maxEntrySize: p = 0, sizeCalculation: b, fetchMethod: w, memoMethod: v, noDeleteOnFetchRejection: E, noDeleteOnStaleGet: y, allowStaleOnFetchRejection: S, allowStaleOnFetchAbort: B, ignoreFetchAbort: U, perf: et } = t;
				if (et !== void 0 && typeof et?.now != "function") throw new TypeError("perf option must have a now() method if specified");
				if (this.#c = et ?? er, e !== 0 && !V(e)) throw new TypeError("max option must be a nonnegative integer");
				let st = e ? cs(e) : Array;
				if (!st) throw new Error("invalid max value: " + e);
				if (this.#t = e, this.#s = m, this.maxEntrySize = p || this.#s, this.sizeCalculation = b, this.sizeCalculation) {
					if (!this.#s && !this.maxEntrySize) throw new TypeError("cannot set sizeCalculation without setting maxSize or maxEntrySize");
					if (typeof this.sizeCalculation != "function") throw new TypeError("sizeCalculation set to non-function");
				}
				if (v !== void 0 && typeof v != "function") throw new TypeError("memoMethod must be a function if defined");
				if (this.#w = v, w !== void 0 && typeof w != "function") throw new TypeError("fetchMethod must be a function if specified");
				if (this.#S = w, this.#T = !!w, this.#u = /* @__PURE__ */ new Map(), this.#a = new Array(e).fill(void 0), this.#i = new Array(e).fill(void 0), this.#d = new st(e), this.#v = new st(e), this.#y = 0, this.#p = 0, this.#R = ir.create(e), this.#o = 0, this.#f = 0, typeof l == "function" && (this.#n = l), typeof f == "function" && (this.#r = f), typeof c == "function" ? (this.#h = c, this.#m = []) : (this.#h = void 0, this.#m = void 0), this.#E = !!this.#n, this.#F = !!this.#r, this.#e = !!this.#h, this.noDisposeOnSet = !!d, this.noUpdateTTL = !!u, this.noDeleteOnFetchRejection = !!E, this.allowStaleOnFetchRejection = !!S, this.allowStaleOnFetchAbort = !!B, this.ignoreFetchAbort = !!U, this.maxEntrySize !== 0) {
					if (this.#s !== 0 && !V(this.#s)) throw new TypeError("maxSize must be a positive integer if specified");
					if (!V(this.maxEntrySize)) throw new TypeError("maxEntrySize must be a positive integer if specified");
					this.#$();
				}
				if (this.allowStale = !!a, this.noDeleteOnStaleGet = !!y, this.updateAgeOnGet = !!h, this.updateAgeOnHas = !!o, this.ttlResolution = V(i) || i === 0 ? i : 1, this.ttlAutopurge = !!r, this.ttl = s || 0, this.ttl) {
					if (!V(this.ttl)) throw new TypeError("ttl must be a positive integer if specified");
					this.#P();
				}
				if (this.#t === 0 && this.ttl === 0 && this.#s === 0) throw new TypeError("At least one of max, maxSize, or ttl is required");
				if (!this.ttlAutopurge && !this.#t && !this.#s) {
					let le = "LRU_CACHE_UNBOUNDED";
					sr(le) && (as.add(le), ls("TTL caching without ttlAutopurge, max, or maxSize can result in unbounded memory consumption.", "UnboundedCacheWarning", le, us));
				}
			}
			getRemainingTTL(t) {
				return this.#u.has(t) ? 1 / 0 : 0;
			}
			#P() {
				let t = new Nt(this.#t), e = new Nt(this.#t);
				this.#g = t, this.#x = e;
				let s = this.ttlAutopurge ? new Array(this.#t) : void 0;
				this.#b = s, this.#W = (h, o, a = this.#c.now()) => {
					if (e[h] = o !== 0 ? a : 0, t[h] = o, s?.[h] && (clearTimeout(s[h]), s[h] = void 0), o !== 0 && s) {
						let l = setTimeout(() => {
							this.#_(h) && this.#A(this.#a[h], "expire");
						}, o + 1);
						l.unref && l.unref(), s[h] = l;
					}
				}, this.#C = (h) => {
					e[h] = t[h] !== 0 ? this.#c.now() : 0;
				}, this.#D = (h, o) => {
					if (t[o]) {
						let a = t[o], l = e[o];
						if (!a || !l) return;
						h.ttl = a, h.start = l, h.now = i || r();
						h.remainingTTL = a - (h.now - l);
					}
				};
				let i = 0, r = () => {
					let h = this.#c.now();
					if (this.ttlResolution > 0) {
						i = h;
						let o = setTimeout(() => i = 0, this.ttlResolution);
						o.unref && o.unref();
					}
					return h;
				};
				this.getRemainingTTL = (h) => {
					let o = this.#u.get(h);
					if (o === void 0) return 0;
					let a = t[o], l = e[o];
					if (!a || !l) return 1 / 0;
					return a - ((i || r()) - l);
				}, this.#_ = (h) => {
					let o = e[h], a = t[h];
					return !!a && !!o && (i || r()) - o > a;
				};
			}
			#C = () => {};
			#D = () => {};
			#W = () => {};
			#_ = () => !1;
			#$() {
				let t = new Nt(this.#t);
				this.#f = 0, this.#O = t, this.#L = (e) => {
					this.#f -= t[e], t[e] = 0;
				}, this.#B = (e, s, i, r) => {
					if (this.#l(s)) return 0;
					if (!V(i)) if (r) {
						if (typeof r != "function") throw new TypeError("sizeCalculation must be a function");
						if (i = r(s, e), !V(i)) throw new TypeError("sizeCalculation return invalid (expect positive integer)");
					} else throw new TypeError("invalid size value (must be positive integer). When maxSize or maxEntrySize is used, sizeCalculation or size must be set.");
					return i;
				}, this.#j = (e, s, i) => {
					if (t[e] = s, this.#s) {
						let r = this.#s - t[e];
						for (; this.#f > r;) this.#G(!0);
					}
					this.#f += t[e], i && (i.entrySize = s, i.totalCalculatedSize = this.#f);
				};
			}
			#L = (t) => {};
			#j = (t, e, s) => {};
			#B = (t, e, s, i) => {
				if (s || i) throw new TypeError("cannot set size without setting maxSize or maxEntrySize on cache");
				return 0;
			};
			*#k({ allowStale: t = this.allowStale } = {}) {
				if (this.#o) for (let e = this.#p; !(!this.#I(e) || ((t || !this.#_(e)) && (yield e), e === this.#y));) e = this.#v[e];
			}
			*#M({ allowStale: t = this.allowStale } = {}) {
				if (this.#o) for (let e = this.#y; !(!this.#I(e) || ((t || !this.#_(e)) && (yield e), e === this.#p));) e = this.#d[e];
			}
			#I(t) {
				return t !== void 0 && this.#u.get(this.#a[t]) === t;
			}
			*entries() {
				for (let t of this.#k()) this.#i[t] !== void 0 && this.#a[t] !== void 0 && !this.#l(this.#i[t]) && (yield [this.#a[t], this.#i[t]]);
			}
			*rentries() {
				for (let t of this.#M()) this.#i[t] !== void 0 && this.#a[t] !== void 0 && !this.#l(this.#i[t]) && (yield [this.#a[t], this.#i[t]]);
			}
			*keys() {
				for (let t of this.#k()) {
					let e = this.#a[t];
					e !== void 0 && !this.#l(this.#i[t]) && (yield e);
				}
			}
			*rkeys() {
				for (let t of this.#M()) {
					let e = this.#a[t];
					e !== void 0 && !this.#l(this.#i[t]) && (yield e);
				}
			}
			*values() {
				for (let t of this.#k()) this.#i[t] !== void 0 && !this.#l(this.#i[t]) && (yield this.#i[t]);
			}
			*rvalues() {
				for (let t of this.#M()) this.#i[t] !== void 0 && !this.#l(this.#i[t]) && (yield this.#i[t]);
			}
			[Symbol.iterator]() {
				return this.entries();
			}
			[Symbol.toStringTag] = "LRUCache";
			find(t, e = {}) {
				for (let s of this.#k()) {
					let i = this.#i[s], r = this.#l(i) ? i.__staleWhileFetching : i;
					if (r !== void 0 && t(r, this.#a[s], this)) return this.get(this.#a[s], e);
				}
			}
			forEach(t, e = this) {
				for (let s of this.#k()) {
					let i = this.#i[s], r = this.#l(i) ? i.__staleWhileFetching : i;
					r !== void 0 && t.call(e, r, this.#a[s], this);
				}
			}
			rforEach(t, e = this) {
				for (let s of this.#M()) {
					let i = this.#i[s], r = this.#l(i) ? i.__staleWhileFetching : i;
					r !== void 0 && t.call(e, r, this.#a[s], this);
				}
			}
			purgeStale() {
				let t = !1;
				for (let e of this.#M({ allowStale: !0 })) this.#_(e) && (this.#A(this.#a[e], "expire"), t = !0);
				return t;
			}
			info(t) {
				let e = this.#u.get(t);
				if (e === void 0) return;
				let s = this.#i[e], i = this.#l(s) ? s.__staleWhileFetching : s;
				if (i === void 0) return;
				let r = { value: i };
				if (this.#g && this.#x) {
					let h = this.#g[e], o = this.#x[e];
					if (h && o) r.ttl = h - (this.#c.now() - o), r.start = Date.now();
				}
				return this.#O && (r.size = this.#O[e]), r;
			}
			dump() {
				let t = [];
				for (let e of this.#k({ allowStale: !0 })) {
					let s = this.#a[e], i = this.#i[e], r = this.#l(i) ? i.__staleWhileFetching : i;
					if (r === void 0 || s === void 0) continue;
					let h = { value: r };
					if (this.#g && this.#x) {
						h.ttl = this.#g[e];
						let o = this.#c.now() - this.#x[e];
						h.start = Math.floor(Date.now() - o);
					}
					this.#O && (h.size = this.#O[e]), t.unshift([s, h]);
				}
				return t;
			}
			load(t) {
				this.clear();
				for (let [e, s] of t) {
					if (s.start) {
						let i = Date.now() - s.start;
						s.start = this.#c.now() - i;
					}
					this.set(e, s.value, s);
				}
			}
			set(t, e, s = {}) {
				if (e === void 0) return this.delete(t), this;
				let { ttl: i = this.ttl, start: r, noDisposeOnSet: h = this.noDisposeOnSet, sizeCalculation: o = this.sizeCalculation, status: a } = s, { noUpdateTTL: l = this.noUpdateTTL } = s, f = this.#B(t, e, s.size || 0, o);
				if (this.maxEntrySize && f > this.maxEntrySize) return a && (a.set = "miss", a.maxEntrySizeExceeded = !0), this.#A(t, "set"), this;
				let c = this.#o === 0 ? void 0 : this.#u.get(t);
				if (c === void 0) c = this.#o === 0 ? this.#p : this.#R.length !== 0 ? this.#R.pop() : this.#o === this.#t ? this.#G(!1) : this.#o, this.#a[c] = t, this.#i[c] = e, this.#u.set(t, c), this.#d[this.#p] = c, this.#v[c] = this.#p, this.#p = c, this.#o++, this.#j(c, f, a), a && (a.set = "add"), l = !1, this.#F && this.#r?.(e, t, "add");
				else {
					this.#N(c);
					let d = this.#i[c];
					if (e !== d) {
						if (this.#T && this.#l(d)) {
							d.__abortController.abort(/* @__PURE__ */ new Error("replaced"));
							let { __staleWhileFetching: u } = d;
							u !== void 0 && !h && (this.#E && this.#n?.(u, t, "set"), this.#e && this.#m?.push([
								u,
								t,
								"set"
							]));
						} else h || (this.#E && this.#n?.(d, t, "set"), this.#e && this.#m?.push([
							d,
							t,
							"set"
						]));
						if (this.#L(c), this.#j(c, f, a), this.#i[c] = e, a) {
							a.set = "replace";
							let u = d && this.#l(d) ? d.__staleWhileFetching : d;
							u !== void 0 && (a.oldValue = u);
						}
					} else a && (a.set = "update");
					this.#F && this.onInsert?.(e, t, e === d ? "update" : "replace");
				}
				if (i !== 0 && !this.#g && this.#P(), this.#g && (l || this.#W(c, i, r), a && this.#D(a, c)), !h && this.#e && this.#m) {
					let d = this.#m, u;
					for (; u = d?.shift();) this.#h?.(...u);
				}
				return this;
			}
			pop() {
				try {
					for (; this.#o;) {
						let t = this.#i[this.#y];
						if (this.#G(!0), this.#l(t)) {
							if (t.__staleWhileFetching) return t.__staleWhileFetching;
						} else if (t !== void 0) return t;
					}
				} finally {
					if (this.#e && this.#m) {
						let t = this.#m, e;
						for (; e = t?.shift();) this.#h?.(...e);
					}
				}
			}
			#G(t) {
				let e = this.#y, s = this.#a[e], i = this.#i[e];
				return this.#T && this.#l(i) ? i.__abortController.abort(/* @__PURE__ */ new Error("evicted")) : (this.#E || this.#e) && (this.#E && this.#n?.(i, s, "evict"), this.#e && this.#m?.push([
					i,
					s,
					"evict"
				])), this.#L(e), this.#b?.[e] && (clearTimeout(this.#b[e]), this.#b[e] = void 0), t && (this.#a[e] = void 0, this.#i[e] = void 0, this.#R.push(e)), this.#o === 1 ? (this.#y = this.#p = 0, this.#R.length = 0) : this.#y = this.#d[e], this.#u.delete(s), this.#o--, e;
			}
			has(t, e = {}) {
				let { updateAgeOnHas: s = this.updateAgeOnHas, status: i } = e, r = this.#u.get(t);
				if (r !== void 0) {
					let h = this.#i[r];
					if (this.#l(h) && h.__staleWhileFetching === void 0) return !1;
					if (this.#_(r)) i && (i.has = "stale", this.#D(i, r));
					else return s && this.#C(r), i && (i.has = "hit", this.#D(i, r)), !0;
				} else i && (i.has = "miss");
				return !1;
			}
			peek(t, e = {}) {
				let { allowStale: s = this.allowStale } = e, i = this.#u.get(t);
				if (i === void 0 || !s && this.#_(i)) return;
				let r = this.#i[i];
				return this.#l(r) ? r.__staleWhileFetching : r;
			}
			#z(t, e, s, i) {
				let r = e === void 0 ? void 0 : this.#i[e];
				if (this.#l(r)) return r;
				let h = new Lt(), { signal: o } = s;
				o?.addEventListener("abort", () => h.abort(o.reason), { signal: h.signal });
				let a = {
					signal: h.signal,
					options: s,
					context: i
				}, l = (p, b = !1) => {
					let { aborted: w } = h.signal, v = s.ignoreFetchAbort && p !== void 0, E = s.ignoreFetchAbort || !!(s.allowStaleOnFetchAbort && p !== void 0);
					if (s.status && (w && !b ? (s.status.fetchAborted = !0, s.status.fetchError = h.signal.reason, v && (s.status.fetchAbortIgnored = !0)) : s.status.fetchResolved = !0), w && !v && !b) return c(h.signal.reason, E);
					let y = u, S = this.#i[e];
					return (S === u || v && b && S === void 0) && (p === void 0 ? y.__staleWhileFetching !== void 0 ? this.#i[e] = y.__staleWhileFetching : this.#A(t, "fetch") : (s.status && (s.status.fetchUpdated = !0), this.set(t, p, a.options))), p;
				}, f = (p) => (s.status && (s.status.fetchRejected = !0, s.status.fetchError = p), c(p, !1)), c = (p, b) => {
					let { aborted: w } = h.signal, v = w && s.allowStaleOnFetchAbort, E = v || s.allowStaleOnFetchRejection, y = E || s.noDeleteOnFetchRejection, S = u;
					if (this.#i[e] === u && (!y || !b && S.__staleWhileFetching === void 0 ? this.#A(t, "fetch") : v || (this.#i[e] = S.__staleWhileFetching)), E) return s.status && S.__staleWhileFetching !== void 0 && (s.status.returnedStale = !0), S.__staleWhileFetching;
					if (S.__returned === S) throw p;
				}, d = (p, b) => {
					let w = this.#S?.(t, r, a);
					w && w instanceof Promise && w.then((v) => p(v === void 0 ? void 0 : v), b), h.signal.addEventListener("abort", () => {
						(!s.ignoreFetchAbort || s.allowStaleOnFetchAbort) && (p(void 0), s.allowStaleOnFetchAbort && (p = (v) => l(v, !0)));
					});
				};
				s.status && (s.status.fetchDispatched = !0);
				let u = new Promise(d).then(l, f), m = Object.assign(u, {
					__abortController: h,
					__staleWhileFetching: r,
					__returned: void 0
				});
				return e === void 0 ? (this.set(t, m, {
					...a.options,
					status: void 0
				}), e = this.#u.get(t)) : this.#i[e] = m, m;
			}
			#l(t) {
				if (!this.#T) return !1;
				let e = t;
				return !!e && e instanceof Promise && e.hasOwnProperty("__staleWhileFetching") && e.__abortController instanceof Lt;
			}
			async fetch(t, e = {}) {
				let { allowStale: s = this.allowStale, updateAgeOnGet: i = this.updateAgeOnGet, noDeleteOnStaleGet: r = this.noDeleteOnStaleGet, ttl: h = this.ttl, noDisposeOnSet: o = this.noDisposeOnSet, size: a = 0, sizeCalculation: l = this.sizeCalculation, noUpdateTTL: f = this.noUpdateTTL, noDeleteOnFetchRejection: c = this.noDeleteOnFetchRejection, allowStaleOnFetchRejection: d = this.allowStaleOnFetchRejection, ignoreFetchAbort: u = this.ignoreFetchAbort, allowStaleOnFetchAbort: m = this.allowStaleOnFetchAbort, context: p, forceRefresh: b = !1, status: w, signal: v } = e;
				if (!this.#T) return w && (w.fetch = "get"), this.get(t, {
					allowStale: s,
					updateAgeOnGet: i,
					noDeleteOnStaleGet: r,
					status: w
				});
				let E = {
					allowStale: s,
					updateAgeOnGet: i,
					noDeleteOnStaleGet: r,
					ttl: h,
					noDisposeOnSet: o,
					size: a,
					sizeCalculation: l,
					noUpdateTTL: f,
					noDeleteOnFetchRejection: c,
					allowStaleOnFetchRejection: d,
					allowStaleOnFetchAbort: m,
					ignoreFetchAbort: u,
					status: w,
					signal: v
				}, y = this.#u.get(t);
				if (y === void 0) {
					w && (w.fetch = "miss");
					let S = this.#z(t, y, E, p);
					return S.__returned = S;
				} else {
					let S = this.#i[y];
					if (this.#l(S)) {
						let st = s && S.__staleWhileFetching !== void 0;
						return w && (w.fetch = "inflight", st && (w.returnedStale = !0)), st ? S.__staleWhileFetching : S.__returned = S;
					}
					let B = this.#_(y);
					if (!b && !B) return w && (w.fetch = "hit"), this.#N(y), i && this.#C(y), w && this.#D(w, y), S;
					let U = this.#z(t, y, E, p), et = U.__staleWhileFetching !== void 0 && s;
					return w && (w.fetch = B ? "stale" : "refresh", et && B && (w.returnedStale = !0)), et ? U.__staleWhileFetching : U.__returned = U;
				}
			}
			async forceFetch(t, e = {}) {
				let s = await this.fetch(t, e);
				if (s === void 0) throw new Error("fetch() returned undefined");
				return s;
			}
			memo(t, e = {}) {
				let s = this.#w;
				if (!s) throw new Error("no memoMethod provided to constructor");
				let { context: i, forceRefresh: r, ...h } = e, o = this.get(t, h);
				if (!r && o !== void 0) return o;
				let a = s(t, o, {
					options: h,
					context: i
				});
				return this.set(t, a, h), a;
			}
			get(t, e = {}) {
				let { allowStale: s = this.allowStale, updateAgeOnGet: i = this.updateAgeOnGet, noDeleteOnStaleGet: r = this.noDeleteOnStaleGet, status: h } = e, o = this.#u.get(t);
				if (o !== void 0) {
					let a = this.#i[o], l = this.#l(a);
					return h && this.#D(h, o), this.#_(o) ? (h && (h.get = "stale"), l ? (h && s && a.__staleWhileFetching !== void 0 && (h.returnedStale = !0), s ? a.__staleWhileFetching : void 0) : (r || this.#A(t, "expire"), h && s && (h.returnedStale = !0), s ? a : void 0)) : (h && (h.get = "hit"), l ? a.__staleWhileFetching : (this.#N(o), i && this.#C(o), a));
				} else h && (h.get = "miss");
			}
			#U(t, e) {
				this.#v[e] = t, this.#d[t] = e;
			}
			#N(t) {
				t !== this.#p && (t === this.#y ? this.#y = this.#d[t] : this.#U(this.#v[t], this.#d[t]), this.#U(this.#p, t), this.#p = t);
			}
			delete(t) {
				return this.#A(t, "delete");
			}
			#A(t, e) {
				let s = !1;
				if (this.#o !== 0) {
					let i = this.#u.get(t);
					if (i !== void 0) if (this.#b?.[i] && (clearTimeout(this.#b?.[i]), this.#b[i] = void 0), s = !0, this.#o === 1) this.#q(e);
					else {
						this.#L(i);
						let r = this.#i[i];
						if (this.#l(r) ? r.__abortController.abort(/* @__PURE__ */ new Error("deleted")) : (this.#E || this.#e) && (this.#E && this.#n?.(r, t, e), this.#e && this.#m?.push([
							r,
							t,
							e
						])), this.#u.delete(t), this.#a[i] = void 0, this.#i[i] = void 0, i === this.#p) this.#p = this.#v[i];
						else if (i === this.#y) this.#y = this.#d[i];
						else {
							let h = this.#v[i];
							this.#d[h] = this.#d[i];
							let o = this.#d[i];
							this.#v[o] = this.#v[i];
						}
						this.#o--, this.#R.push(i);
					}
				}
				if (this.#e && this.#m?.length) {
					let i = this.#m, r;
					for (; r = i?.shift();) this.#h?.(...r);
				}
				return s;
			}
			clear() {
				return this.#q("delete");
			}
			#q(t) {
				for (let e of this.#M({ allowStale: !0 })) {
					let s = this.#i[e];
					if (this.#l(s)) s.__abortController.abort(/* @__PURE__ */ new Error("deleted"));
					else {
						let i = this.#a[e];
						this.#E && this.#n?.(s, i, t), this.#e && this.#m?.push([
							s,
							i,
							t
						]);
					}
				}
				if (this.#u.clear(), this.#i.fill(void 0), this.#a.fill(void 0), this.#g && this.#x) {
					this.#g.fill(0), this.#x.fill(0);
					for (let e of this.#b ?? []) e !== void 0 && clearTimeout(e);
					this.#b?.fill(void 0);
				}
				if (this.#O && this.#O.fill(0), this.#y = 0, this.#p = 0, this.#R.length = 0, this.#f = 0, this.#o = 0, this.#e && this.#m) {
					let e = this.#m, s;
					for (; s = e?.shift();) this.#h?.(...s);
				}
			}
		};
	});
	var Oe = R((P) => {
		"use strict";
		var nr = P && P.__importDefault || function(n) {
			return n && n.__esModule ? n : { default: n };
		};
		Object.defineProperty(P, "__esModule", { value: !0 });
		P.Minipass = P.isWritable = P.isReadable = P.isStream = void 0;
		var ds = typeof process == "object" && process ? process : {
			stdout: null,
			stderr: null
		}, _e = require("node:events"), ws = nr(require("node:stream")), hr = require("node:string_decoder"), or = (n) => !!n && typeof n == "object" && (n instanceof qt || n instanceof ws.default || (0, P.isReadable)(n) || (0, P.isWritable)(n));
		P.isStream = or;
		var ar = (n) => !!n && typeof n == "object" && n instanceof _e.EventEmitter && typeof n.pipe == "function" && n.pipe !== ws.default.Writable.prototype.pipe;
		P.isReadable = ar;
		var lr = (n) => !!n && typeof n == "object" && n instanceof _e.EventEmitter && typeof n.write == "function" && typeof n.end == "function";
		P.isWritable = lr;
		var $ = Symbol("EOF"), q = Symbol("maybeEmitEnd"), K = Symbol("emittedEnd"), Bt = Symbol("emittingEnd"), lt = Symbol("emittedError"), It = Symbol("closed"), ps = Symbol("read"), Gt = Symbol("flush"), ms = Symbol("flushChunk"), L = Symbol("encoding"), rt = Symbol("decoder"), x = Symbol("flowing"), ct = Symbol("paused"), nt = Symbol("resume"), T = Symbol("buffer"), M = Symbol("pipes"), C = Symbol("bufferLength"), we = Symbol("bufferPush"), zt = Symbol("bufferShift"), k = Symbol("objectMode"), O = Symbol("destroyed"), be = Symbol("error"), ye = Symbol("emitData"), gs = Symbol("emitEnd"), Se = Symbol("emitEnd2"), I = Symbol("async"), ve = Symbol("abort"), Ut = Symbol("aborted"), ut = Symbol("signal"), Z = Symbol("dataListeners"), D = Symbol("discarded"), ft = (n) => Promise.resolve().then(n), cr = (n) => n(), ur = (n) => n === "end" || n === "finish" || n === "prefinish", fr = (n) => n instanceof ArrayBuffer || !!n && typeof n == "object" && n.constructor && n.constructor.name === "ArrayBuffer" && n.byteLength >= 0, dr = (n) => !Buffer.isBuffer(n) && ArrayBuffer.isView(n), $t = class {
			src;
			dest;
			opts;
			ondrain;
			constructor(t, e, s) {
				this.src = t, this.dest = e, this.opts = s, this.ondrain = () => t[nt](), this.dest.on("drain", this.ondrain);
			}
			unpipe() {
				this.dest.removeListener("drain", this.ondrain);
			}
			proxyErrors(t) {}
			end() {
				this.unpipe(), this.opts.end && this.dest.end();
			}
		}, Ee = class extends $t {
			unpipe() {
				this.src.removeListener("error", this.proxyErrors), super.unpipe();
			}
			constructor(t, e, s) {
				super(t, e, s), this.proxyErrors = (i) => this.dest.emit("error", i), t.on("error", this.proxyErrors);
			}
		}, pr = (n) => !!n.objectMode, mr = (n) => !n.objectMode && !!n.encoding && n.encoding !== "buffer", qt = class extends _e.EventEmitter {
			[x] = !1;
			[ct] = !1;
			[M] = [];
			[T] = [];
			[k];
			[L];
			[I];
			[rt];
			[$] = !1;
			[K] = !1;
			[Bt] = !1;
			[It] = !1;
			[lt] = null;
			[C] = 0;
			[O] = !1;
			[ut];
			[Ut] = !1;
			[Z] = 0;
			[D] = !1;
			writable = !0;
			readable = !0;
			constructor(...t) {
				let e = t[0] || {};
				if (super(), e.objectMode && typeof e.encoding == "string") throw new TypeError("Encoding and objectMode may not be used together");
				pr(e) ? (this[k] = !0, this[L] = null) : mr(e) ? (this[L] = e.encoding, this[k] = !1) : (this[k] = !1, this[L] = null), this[I] = !!e.async, this[rt] = this[L] ? new hr.StringDecoder(this[L]) : null, e && e.debugExposeBuffer === !0 && Object.defineProperty(this, "buffer", { get: () => this[T] }), e && e.debugExposePipes === !0 && Object.defineProperty(this, "pipes", { get: () => this[M] });
				let { signal: s } = e;
				s && (this[ut] = s, s.aborted ? this[ve]() : s.addEventListener("abort", () => this[ve]()));
			}
			get bufferLength() {
				return this[C];
			}
			get encoding() {
				return this[L];
			}
			set encoding(t) {
				throw new Error("Encoding must be set at instantiation time");
			}
			setEncoding(t) {
				throw new Error("Encoding must be set at instantiation time");
			}
			get objectMode() {
				return this[k];
			}
			set objectMode(t) {
				throw new Error("objectMode must be set at instantiation time");
			}
			get async() {
				return this[I];
			}
			set async(t) {
				this[I] = this[I] || !!t;
			}
			[ve]() {
				this[Ut] = !0, this.emit("abort", this[ut]?.reason), this.destroy(this[ut]?.reason);
			}
			get aborted() {
				return this[Ut];
			}
			set aborted(t) {}
			write(t, e, s) {
				if (this[Ut]) return !1;
				if (this[$]) throw new Error("write after end");
				if (this[O]) return this.emit("error", Object.assign(/* @__PURE__ */ new Error("Cannot call write after a stream was destroyed"), { code: "ERR_STREAM_DESTROYED" })), !0;
				typeof e == "function" && (s = e, e = "utf8"), e || (e = "utf8");
				let i = this[I] ? ft : cr;
				if (!this[k] && !Buffer.isBuffer(t)) {
					if (dr(t)) t = Buffer.from(t.buffer, t.byteOffset, t.byteLength);
					else if (fr(t)) t = Buffer.from(t);
					else if (typeof t != "string") throw new Error("Non-contiguous data written to non-objectMode stream");
				}
				return this[k] ? (this[x] && this[C] !== 0 && this[Gt](!0), this[x] ? this.emit("data", t) : this[we](t), this[C] !== 0 && this.emit("readable"), s && i(s), this[x]) : t.length ? (typeof t == "string" && (e !== this[L] || this[rt]?.lastNeed) && (t = Buffer.from(t, e)), Buffer.isBuffer(t) && this[L] && (t = this[rt].write(t)), this[x] && this[C] !== 0 && this[Gt](!0), this[x] ? this.emit("data", t) : this[we](t), this[C] !== 0 && this.emit("readable"), s && i(s), this[x]) : (this[C] !== 0 && this.emit("readable"), s && i(s), this[x]);
			}
			read(t) {
				if (this[O]) return null;
				if (this[D] = !1, this[C] === 0 || t === 0 || t && t > this[C]) return this[q](), null;
				this[k] && (t = null), this[T].length > 1 && !this[k] && (this[T] = [this[L] ? this[T].join("") : Buffer.concat(this[T], this[C])]);
				let e = this[ps](t || null, this[T][0]);
				return this[q](), e;
			}
			[ps](t, e) {
				if (this[k]) this[zt]();
				else {
					let s = e;
					t === s.length || t === null ? this[zt]() : typeof s == "string" ? (this[T][0] = s.slice(t), e = s.slice(0, t), this[C] -= t) : (this[T][0] = s.subarray(t), e = s.subarray(0, t), this[C] -= t);
				}
				return this.emit("data", e), !this[T].length && !this[$] && this.emit("drain"), e;
			}
			end(t, e, s) {
				return typeof t == "function" && (s = t, t = void 0), typeof e == "function" && (s = e, e = "utf8"), t !== void 0 && this.write(t, e), s && this.once("end", s), this[$] = !0, this.writable = !1, (this[x] || !this[ct]) && this[q](), this;
			}
			[nt]() {
				this[O] || (!this[Z] && !this[M].length && (this[D] = !0), this[ct] = !1, this[x] = !0, this.emit("resume"), this[T].length ? this[Gt]() : this[$] ? this[q]() : this.emit("drain"));
			}
			resume() {
				return this[nt]();
			}
			pause() {
				this[x] = !1, this[ct] = !0, this[D] = !1;
			}
			get destroyed() {
				return this[O];
			}
			get flowing() {
				return this[x];
			}
			get paused() {
				return this[ct];
			}
			[we](t) {
				this[k] ? this[C] += 1 : this[C] += t.length, this[T].push(t);
			}
			[zt]() {
				return this[k] ? this[C] -= 1 : this[C] -= this[T][0].length, this[T].shift();
			}
			[Gt](t = !1) {
				do				;
while (this[ms](this[zt]()) && this[T].length);
				!t && !this[T].length && !this[$] && this.emit("drain");
			}
			[ms](t) {
				return this.emit("data", t), this[x];
			}
			pipe(t, e) {
				if (this[O]) return t;
				this[D] = !1;
				let s = this[K];
				return e = e || {}, t === ds.stdout || t === ds.stderr ? e.end = !1 : e.end = e.end !== !1, e.proxyErrors = !!e.proxyErrors, s ? e.end && t.end() : (this[M].push(e.proxyErrors ? new Ee(this, t, e) : new $t(this, t, e)), this[I] ? ft(() => this[nt]()) : this[nt]()), t;
			}
			unpipe(t) {
				let e = this[M].find((s) => s.dest === t);
				e && (this[M].length === 1 ? (this[x] && this[Z] === 0 && (this[x] = !1), this[M] = []) : this[M].splice(this[M].indexOf(e), 1), e.unpipe());
			}
			addListener(t, e) {
				return this.on(t, e);
			}
			on(t, e) {
				let s = super.on(t, e);
				if (t === "data") this[D] = !1, this[Z]++, !this[M].length && !this[x] && this[nt]();
				else if (t === "readable" && this[C] !== 0) super.emit("readable");
				else if (ur(t) && this[K]) super.emit(t), this.removeAllListeners(t);
				else if (t === "error" && this[lt]) {
					let i = e;
					this[I] ? ft(() => i.call(this, this[lt])) : i.call(this, this[lt]);
				}
				return s;
			}
			removeListener(t, e) {
				return this.off(t, e);
			}
			off(t, e) {
				let s = super.off(t, e);
				return t === "data" && (this[Z] = this.listeners("data").length, this[Z] === 0 && !this[D] && !this[M].length && (this[x] = !1)), s;
			}
			removeAllListeners(t) {
				let e = super.removeAllListeners(t);
				return (t === "data" || t === void 0) && (this[Z] = 0, !this[D] && !this[M].length && (this[x] = !1)), e;
			}
			get emittedEnd() {
				return this[K];
			}
			[q]() {
				!this[Bt] && !this[K] && !this[O] && this[T].length === 0 && this[$] && (this[Bt] = !0, this.emit("end"), this.emit("prefinish"), this.emit("finish"), this[It] && this.emit("close"), this[Bt] = !1);
			}
			emit(t, ...e) {
				let s = e[0];
				if (t !== "error" && t !== "close" && t !== O && this[O]) return !1;
				if (t === "data") return !this[k] && !s ? !1 : this[I] ? (ft(() => this[ye](s)), !0) : this[ye](s);
				if (t === "end") return this[gs]();
				if (t === "close") {
					if (this[It] = !0, !this[K] && !this[O]) return !1;
					let r = super.emit("close");
					return this.removeAllListeners("close"), r;
				} else if (t === "error") {
					this[lt] = s, super.emit(be, s);
					let r = !this[ut] || this.listeners("error").length ? super.emit("error", s) : !1;
					return this[q](), r;
				} else if (t === "resume") {
					let r = super.emit("resume");
					return this[q](), r;
				} else if (t === "finish" || t === "prefinish") {
					let r = super.emit(t);
					return this.removeAllListeners(t), r;
				}
				let i = super.emit(t, ...e);
				return this[q](), i;
			}
			[ye](t) {
				for (let s of this[M]) s.dest.write(t) === !1 && this.pause();
				let e = this[D] ? !1 : super.emit("data", t);
				return this[q](), e;
			}
			[gs]() {
				return this[K] ? !1 : (this[K] = !0, this.readable = !1, this[I] ? (ft(() => this[Se]()), !0) : this[Se]());
			}
			[Se]() {
				if (this[rt]) {
					let e = this[rt].end();
					if (e) {
						for (let s of this[M]) s.dest.write(e);
						this[D] || super.emit("data", e);
					}
				}
				for (let e of this[M]) e.end();
				let t = super.emit("end");
				return this.removeAllListeners("end"), t;
			}
			async collect() {
				let t = Object.assign([], { dataLength: 0 });
				this[k] || (t.dataLength = 0);
				let e = this.promise();
				return this.on("data", (s) => {
					t.push(s), this[k] || (t.dataLength += s.length);
				}), await e, t;
			}
			async concat() {
				if (this[k]) throw new Error("cannot concat in objectMode");
				let t = await this.collect();
				return this[L] ? t.join("") : Buffer.concat(t, t.dataLength);
			}
			async promise() {
				return new Promise((t, e) => {
					this.on(O, () => e(/* @__PURE__ */ new Error("stream destroyed"))), this.on("error", (s) => e(s)), this.on("end", () => t());
				});
			}
			[Symbol.asyncIterator]() {
				this[D] = !1;
				let t = !1, e = async () => (this.pause(), t = !0, {
					value: void 0,
					done: !0
				});
				return {
					next: () => {
						if (t) return e();
						let i = this.read();
						if (i !== null) return Promise.resolve({
							done: !1,
							value: i
						});
						if (this[$]) return e();
						let r, h, o = (c) => {
							this.off("data", a), this.off("end", l), this.off(O, f), e(), h(c);
						}, a = (c) => {
							this.off("error", o), this.off("end", l), this.off(O, f), this.pause(), r({
								value: c,
								done: !!this[$]
							});
						}, l = () => {
							this.off("error", o), this.off("data", a), this.off(O, f), e(), r({
								done: !0,
								value: void 0
							});
						}, f = () => o(/* @__PURE__ */ new Error("stream destroyed"));
						return new Promise((c, d) => {
							h = d, r = c, this.once(O, f), this.once("error", o), this.once("end", l), this.once("data", a);
						});
					},
					throw: e,
					return: e,
					[Symbol.asyncIterator]() {
						return this;
					},
					[Symbol.asyncDispose]: async () => {}
				};
			}
			[Symbol.iterator]() {
				this[D] = !1;
				let t = !1, e = () => (this.pause(), this.off(be, e), this.off(O, e), this.off("end", e), t = !0, {
					done: !0,
					value: void 0
				}), s = () => {
					if (t) return e();
					let i = this.read();
					return i === null ? e() : {
						done: !1,
						value: i
					};
				};
				return this.once("end", e), this.once(be, e), this.once(O, e), {
					next: s,
					throw: e,
					return: e,
					[Symbol.iterator]() {
						return this;
					},
					[Symbol.dispose]: () => {}
				};
			}
			destroy(t) {
				if (this[O]) return t ? this.emit("error", t) : this.emit(O), this;
				this[O] = !0, this[D] = !0, this[T].length = 0, this[C] = 0;
				let e = this;
				return typeof e.close == "function" && !this[It] && e.close(), t ? this.emit("error", t) : this.emit(O), this;
			}
			static get isStream() {
				return P.isStream;
			}
		};
		P.Minipass = qt;
	});
	var Ms = R((_) => {
		"use strict";
		var gr = _ && _.__createBinding || (Object.create ? (function(n, t, e, s) {
			s === void 0 && (s = e);
			var i = Object.getOwnPropertyDescriptor(t, e);
			(!i || ("get" in i ? !t.__esModule : i.writable || i.configurable)) && (i = {
				enumerable: !0,
				get: function() {
					return t[e];
				}
			}), Object.defineProperty(n, s, i);
		}) : (function(n, t, e, s) {
			s === void 0 && (s = e), n[s] = t[e];
		})), wr = _ && _.__setModuleDefault || (Object.create ? (function(n, t) {
			Object.defineProperty(n, "default", {
				enumerable: !0,
				value: t
			});
		}) : function(n, t) {
			n.default = t;
		}), br = _ && _.__importStar || function(n) {
			if (n && n.__esModule) return n;
			var t = {};
			if (n != null) for (var e in n) e !== "default" && Object.prototype.hasOwnProperty.call(n, e) && gr(t, n, e);
			return wr(t, n), t;
		};
		Object.defineProperty(_, "__esModule", { value: !0 });
		_.PathScurry = _.Path = _.PathScurryDarwin = _.PathScurryPosix = _.PathScurryWin32 = _.PathScurryBase = _.PathPosix = _.PathWin32 = _.PathBase = _.ChildrenCache = _.ResolveCache = void 0;
		var Qt = fs(), Yt = require("node:path"), yr = require("node:url"), pt = require("fs"), Sr = br(require("node:fs")), vr = pt.realpathSync.native, Ht = require("node:fs/promises"), bs = Oe(), mt = {
			lstatSync: pt.lstatSync,
			readdir: pt.readdir,
			readdirSync: pt.readdirSync,
			readlinkSync: pt.readlinkSync,
			realpathSync: vr,
			promises: {
				lstat: Ht.lstat,
				readdir: Ht.readdir,
				readlink: Ht.readlink,
				realpath: Ht.realpath
			}
		}, _s = (n) => !n || n === mt || n === Sr ? mt : {
			...mt,
			...n,
			promises: {
				...mt.promises,
				...n.promises || {}
			}
		}, Os = /^\\\\\?\\([a-z]:)\\?$/i, Er = (n) => n.replace(/\//g, "\\").replace(Os, "$1\\"), _r = /[\\\/]/, N = 0, xs = 1, Ts = 2, G = 4, Cs = 6, Rs = 8, Q = 10, As = 12, j = 15, dt = ~j, xe = 16, ys = 32, gt = 64, W = 128, Vt = 256, Xt = 512, Ss = gt | W | Xt, Or = 1023, Te = (n) => n.isFile() ? Rs : n.isDirectory() ? G : n.isSymbolicLink() ? Q : n.isCharacterDevice() ? Ts : n.isBlockDevice() ? Cs : n.isSocket() ? As : n.isFIFO() ? xs : N, vs = new Qt.LRUCache({ max: 4096 }), wt = (n) => {
			let t = vs.get(n);
			if (t) return t;
			let e = n.normalize("NFKD");
			return vs.set(n, e), e;
		}, Es = new Qt.LRUCache({ max: 4096 }), Kt = (n) => {
			let t = Es.get(n);
			if (t) return t;
			let e = wt(n.toLowerCase());
			return Es.set(n, e), e;
		}, bt = class extends Qt.LRUCache {
			constructor() {
				super({ max: 256 });
			}
		};
		_.ResolveCache = bt;
		var Jt = class extends Qt.LRUCache {
			constructor(t = 16384) {
				super({
					maxSize: t,
					sizeCalculation: (e) => e.length + 1
				});
			}
		};
		_.ChildrenCache = Jt;
		var ks = Symbol("PathScurry setAsCwd"), A = class {
			name;
			root;
			roots;
			parent;
			nocase;
			isCWD = !1;
			#t;
			#s;
			get dev() {
				return this.#s;
			}
			#n;
			get mode() {
				return this.#n;
			}
			#r;
			get nlink() {
				return this.#r;
			}
			#h;
			get uid() {
				return this.#h;
			}
			#S;
			get gid() {
				return this.#S;
			}
			#w;
			get rdev() {
				return this.#w;
			}
			#c;
			get blksize() {
				return this.#c;
			}
			#o;
			get ino() {
				return this.#o;
			}
			#f;
			get size() {
				return this.#f;
			}
			#u;
			get blocks() {
				return this.#u;
			}
			#a;
			get atimeMs() {
				return this.#a;
			}
			#i;
			get mtimeMs() {
				return this.#i;
			}
			#d;
			get ctimeMs() {
				return this.#d;
			}
			#v;
			get birthtimeMs() {
				return this.#v;
			}
			#y;
			get atime() {
				return this.#y;
			}
			#p;
			get mtime() {
				return this.#p;
			}
			#R;
			get ctime() {
				return this.#R;
			}
			#m;
			get birthtime() {
				return this.#m;
			}
			#O;
			#x;
			#g;
			#b;
			#E;
			#T;
			#e;
			#F;
			#P;
			#C;
			get parentPath() {
				return (this.parent || this).fullpath();
			}
			get path() {
				return this.parentPath;
			}
			constructor(t, e = N, s, i, r, h, o) {
				this.name = t, this.#O = r ? Kt(t) : wt(t), this.#e = e & Or, this.nocase = r, this.roots = i, this.root = s || this, this.#F = h, this.#g = o.fullpath, this.#E = o.relative, this.#T = o.relativePosix, this.parent = o.parent, this.parent ? this.#t = this.parent.#t : this.#t = _s(o.fs);
			}
			depth() {
				return this.#x !== void 0 ? this.#x : this.parent ? this.#x = this.parent.depth() + 1 : this.#x = 0;
			}
			childrenCache() {
				return this.#F;
			}
			resolve(t) {
				if (!t) return this;
				let e = this.getRootString(t), i = t.substring(e.length).split(this.splitSep);
				return e ? this.getRoot(e).#D(i) : this.#D(i);
			}
			#D(t) {
				let e = this;
				for (let s of t) e = e.child(s);
				return e;
			}
			children() {
				let t = this.#F.get(this);
				if (t) return t;
				let e = Object.assign([], { provisional: 0 });
				return this.#F.set(this, e), this.#e &= ~xe, e;
			}
			child(t, e) {
				if (t === "" || t === ".") return this;
				if (t === "..") return this.parent || this;
				let s = this.children(), i = this.nocase ? Kt(t) : wt(t);
				for (let a of s) if (a.#O === i) return a;
				let r = this.parent ? this.sep : "", h = this.#g ? this.#g + r + t : void 0, o = this.newChild(t, N, {
					...e,
					parent: this,
					fullpath: h
				});
				return this.canReaddir() || (o.#e |= W), s.push(o), o;
			}
			relative() {
				if (this.isCWD) return "";
				if (this.#E !== void 0) return this.#E;
				let t = this.name, e = this.parent;
				if (!e) return this.#E = this.name;
				let s = e.relative();
				return s + (!s || !e.parent ? "" : this.sep) + t;
			}
			relativePosix() {
				if (this.sep === "/") return this.relative();
				if (this.isCWD) return "";
				if (this.#T !== void 0) return this.#T;
				let t = this.name, e = this.parent;
				if (!e) return this.#T = this.fullpathPosix();
				let s = e.relativePosix();
				return s + (!s || !e.parent ? "" : "/") + t;
			}
			fullpath() {
				if (this.#g !== void 0) return this.#g;
				let t = this.name, e = this.parent;
				if (!e) return this.#g = this.name;
				let i = e.fullpath() + (e.parent ? this.sep : "") + t;
				return this.#g = i;
			}
			fullpathPosix() {
				if (this.#b !== void 0) return this.#b;
				if (this.sep === "/") return this.#b = this.fullpath();
				if (!this.parent) {
					let i = this.fullpath().replace(/\\/g, "/");
					return /^[a-z]:\//i.test(i) ? this.#b = `//?/${i}` : this.#b = i;
				}
				let t = this.parent, e = t.fullpathPosix(), s = e + (!e || !t.parent ? "" : "/") + this.name;
				return this.#b = s;
			}
			isUnknown() {
				return (this.#e & j) === N;
			}
			isType(t) {
				return this[`is${t}`]();
			}
			getType() {
				return this.isUnknown() ? "Unknown" : this.isDirectory() ? "Directory" : this.isFile() ? "File" : this.isSymbolicLink() ? "SymbolicLink" : this.isFIFO() ? "FIFO" : this.isCharacterDevice() ? "CharacterDevice" : this.isBlockDevice() ? "BlockDevice" : this.isSocket() ? "Socket" : "Unknown";
			}
			isFile() {
				return (this.#e & j) === Rs;
			}
			isDirectory() {
				return (this.#e & j) === G;
			}
			isCharacterDevice() {
				return (this.#e & j) === Ts;
			}
			isBlockDevice() {
				return (this.#e & j) === Cs;
			}
			isFIFO() {
				return (this.#e & j) === xs;
			}
			isSocket() {
				return (this.#e & j) === As;
			}
			isSymbolicLink() {
				return (this.#e & Q) === Q;
			}
			lstatCached() {
				return this.#e & ys ? this : void 0;
			}
			readlinkCached() {
				return this.#P;
			}
			realpathCached() {
				return this.#C;
			}
			readdirCached() {
				let t = this.children();
				return t.slice(0, t.provisional);
			}
			canReadlink() {
				if (this.#P) return !0;
				if (!this.parent) return !1;
				let t = this.#e & j;
				return !(t !== N && t !== Q || this.#e & Vt || this.#e & W);
			}
			calledReaddir() {
				return !!(this.#e & xe);
			}
			isENOENT() {
				return !!(this.#e & W);
			}
			isNamed(t) {
				return this.nocase ? this.#O === Kt(t) : this.#O === wt(t);
			}
			async readlink() {
				let t = this.#P;
				if (t) return t;
				if (this.canReadlink() && this.parent) try {
					let e = await this.#t.promises.readlink(this.fullpath()), s = (await this.parent.realpath())?.resolve(e);
					if (s) return this.#P = s;
				} catch (e) {
					this.#M(e.code);
					return;
				}
			}
			readlinkSync() {
				let t = this.#P;
				if (t) return t;
				if (this.canReadlink() && this.parent) try {
					let e = this.#t.readlinkSync(this.fullpath()), s = this.parent.realpathSync()?.resolve(e);
					if (s) return this.#P = s;
				} catch (e) {
					this.#M(e.code);
					return;
				}
			}
			#W(t) {
				this.#e |= xe;
				for (let e = t.provisional; e < t.length; e++) {
					let s = t[e];
					s && s.#_();
				}
			}
			#_() {
				this.#e & W || (this.#e = (this.#e | W) & dt, this.#$());
			}
			#$() {
				let t = this.children();
				t.provisional = 0;
				for (let e of t) e.#_();
			}
			#L() {
				this.#e |= Xt, this.#j();
			}
			#j() {
				if (this.#e & gt) return;
				let t = this.#e;
				(t & j) === G && (t &= dt), this.#e = t | gt, this.#$();
			}
			#B(t = "") {
				t === "ENOTDIR" || t === "EPERM" ? this.#j() : t === "ENOENT" ? this.#_() : this.children().provisional = 0;
			}
			#k(t = "") {
				t === "ENOTDIR" ? this.parent.#j() : t === "ENOENT" && this.#_();
			}
			#M(t = "") {
				let e = this.#e;
				e |= Vt, t === "ENOENT" && (e |= W), (t === "EINVAL" || t === "UNKNOWN") && (e &= dt), this.#e = e, t === "ENOTDIR" && this.parent && this.parent.#j();
			}
			#I(t, e) {
				return this.#z(t, e) || this.#G(t, e);
			}
			#G(t, e) {
				let s = Te(t), i = this.newChild(t.name, s, { parent: this }), r = i.#e & j;
				return r !== G && r !== Q && r !== N && (i.#e |= gt), e.unshift(i), e.provisional++, i;
			}
			#z(t, e) {
				for (let s = e.provisional; s < e.length; s++) {
					let i = e[s];
					if ((this.nocase ? Kt(t.name) : wt(t.name)) === i.#O) return this.#l(t, i, s, e);
				}
			}
			#l(t, e, s, i) {
				let r = e.name;
				return e.#e = e.#e & dt | Te(t), r !== t.name && (e.name = t.name), s !== i.provisional && (s === i.length - 1 ? i.pop() : i.splice(s, 1), i.unshift(e)), i.provisional++, e;
			}
			async lstat() {
				if ((this.#e & W) === 0) try {
					return this.#U(await this.#t.promises.lstat(this.fullpath())), this;
				} catch (t) {
					this.#k(t.code);
				}
			}
			lstatSync() {
				if ((this.#e & W) === 0) try {
					return this.#U(this.#t.lstatSync(this.fullpath())), this;
				} catch (t) {
					this.#k(t.code);
				}
			}
			#U(t) {
				let { atime: e, atimeMs: s, birthtime: i, birthtimeMs: r, blksize: h, blocks: o, ctime: a, ctimeMs: l, dev: f, gid: c, ino: d, mode: u, mtime: m, mtimeMs: p, nlink: b, rdev: w, size: v, uid: E } = t;
				this.#y = e, this.#a = s, this.#m = i, this.#v = r, this.#c = h, this.#u = o, this.#R = a, this.#d = l, this.#s = f, this.#S = c, this.#o = d, this.#n = u, this.#p = m, this.#i = p, this.#r = b, this.#w = w, this.#f = v, this.#h = E;
				let y = Te(t);
				this.#e = this.#e & dt | y | ys, y !== N && y !== G && y !== Q && (this.#e |= gt);
			}
			#N = [];
			#A = !1;
			#q(t) {
				this.#A = !1;
				let e = this.#N.slice();
				this.#N.length = 0, e.forEach((s) => s(null, t));
			}
			readdirCB(t, e = !1) {
				if (!this.canReaddir()) {
					e ? t(null, []) : queueMicrotask(() => t(null, []));
					return;
				}
				let s = this.children();
				if (this.calledReaddir()) {
					let r = s.slice(0, s.provisional);
					e ? t(null, r) : queueMicrotask(() => t(null, r));
					return;
				}
				if (this.#N.push(t), this.#A) return;
				this.#A = !0;
				let i = this.fullpath();
				this.#t.readdir(i, { withFileTypes: !0 }, (r, h) => {
					if (r) this.#B(r.code), s.provisional = 0;
					else {
						for (let o of h) this.#I(o, s);
						this.#W(s);
					}
					this.#q(s.slice(0, s.provisional));
				});
			}
			#H;
			async readdir() {
				if (!this.canReaddir()) return [];
				let t = this.children();
				if (this.calledReaddir()) return t.slice(0, t.provisional);
				let e = this.fullpath();
				if (this.#H) await this.#H;
				else {
					let s = () => {};
					this.#H = new Promise((i) => s = i);
					try {
						for (let i of await this.#t.promises.readdir(e, { withFileTypes: !0 })) this.#I(i, t);
						this.#W(t);
					} catch (i) {
						this.#B(i.code), t.provisional = 0;
					}
					this.#H = void 0, s();
				}
				return t.slice(0, t.provisional);
			}
			readdirSync() {
				if (!this.canReaddir()) return [];
				let t = this.children();
				if (this.calledReaddir()) return t.slice(0, t.provisional);
				let e = this.fullpath();
				try {
					for (let s of this.#t.readdirSync(e, { withFileTypes: !0 })) this.#I(s, t);
					this.#W(t);
				} catch (s) {
					this.#B(s.code), t.provisional = 0;
				}
				return t.slice(0, t.provisional);
			}
			canReaddir() {
				if (this.#e & Ss) return !1;
				let t = j & this.#e;
				return t === N || t === G || t === Q;
			}
			shouldWalk(t, e) {
				return (this.#e & G) === G && !(this.#e & Ss) && !t.has(this) && (!e || e(this));
			}
			async realpath() {
				if (this.#C) return this.#C;
				if (!((Xt | Vt | W) & this.#e)) try {
					let t = await this.#t.promises.realpath(this.fullpath());
					return this.#C = this.resolve(t);
				} catch {
					this.#L();
				}
			}
			realpathSync() {
				if (this.#C) return this.#C;
				if (!((Xt | Vt | W) & this.#e)) try {
					let t = this.#t.realpathSync(this.fullpath());
					return this.#C = this.resolve(t);
				} catch {
					this.#L();
				}
			}
			[ks](t) {
				if (t === this) return;
				t.isCWD = !1, this.isCWD = !0;
				let e = /* @__PURE__ */ new Set([]), s = [], i = this;
				for (; i && i.parent;) e.add(i), i.#E = s.join(this.sep), i.#T = s.join("/"), i = i.parent, s.push("..");
				for (i = t; i && i.parent && !e.has(i);) i.#E = void 0, i.#T = void 0, i = i.parent;
			}
		};
		_.PathBase = A;
		var yt = class n extends A {
			sep = "\\";
			splitSep = _r;
			constructor(t, e = N, s, i, r, h, o) {
				super(t, e, s, i, r, h, o);
			}
			newChild(t, e = N, s = {}) {
				return new n(t, e, this.root, this.roots, this.nocase, this.childrenCache(), s);
			}
			getRootString(t) {
				return Yt.win32.parse(t).root;
			}
			getRoot(t) {
				if (t = Er(t.toUpperCase()), t === this.root.name) return this.root;
				for (let [e, s] of Object.entries(this.roots)) if (this.sameRoot(t, e)) return this.roots[t] = s;
				return this.roots[t] = new Et(t, this).root;
			}
			sameRoot(t, e = this.root.name) {
				return t = t.toUpperCase().replace(/\//g, "\\").replace(Os, "$1\\"), t === e;
			}
		};
		_.PathWin32 = yt;
		var St = class n extends A {
			splitSep = "/";
			sep = "/";
			constructor(t, e = N, s, i, r, h, o) {
				super(t, e, s, i, r, h, o);
			}
			getRootString(t) {
				return t.startsWith("/") ? "/" : "";
			}
			getRoot(t) {
				return this.root;
			}
			newChild(t, e = N, s = {}) {
				return new n(t, e, this.root, this.roots, this.nocase, this.childrenCache(), s);
			}
		};
		_.PathPosix = St;
		var vt = class {
			root;
			rootPath;
			roots;
			cwd;
			#t;
			#s;
			#n;
			nocase;
			#r;
			constructor(t = process.cwd(), e, s, { nocase: i, childrenCacheSize: r = 16384, fs: h = mt } = {}) {
				this.#r = _s(h), (t instanceof URL || t.startsWith("file://")) && (t = (0, yr.fileURLToPath)(t));
				let o = e.resolve(t);
				this.roots = Object.create(null), this.rootPath = this.parseRootPath(o), this.#t = new bt(), this.#s = new bt(), this.#n = new Jt(r);
				let a = o.substring(this.rootPath.length).split(s);
				if (a.length === 1 && !a[0] && a.pop(), i === void 0) throw new TypeError("must provide nocase setting to PathScurryBase ctor");
				this.nocase = i, this.root = this.newRoot(this.#r), this.roots[this.rootPath] = this.root;
				let l = this.root, f = a.length - 1, c = e.sep, d = this.rootPath, u = !1;
				for (let m of a) {
					let p = f--;
					l = l.child(m, {
						relative: new Array(p).fill("..").join(c),
						relativePosix: new Array(p).fill("..").join("/"),
						fullpath: d += (u ? "" : c) + m
					}), u = !0;
				}
				this.cwd = l;
			}
			depth(t = this.cwd) {
				return typeof t == "string" && (t = this.cwd.resolve(t)), t.depth();
			}
			childrenCache() {
				return this.#n;
			}
			resolve(...t) {
				let e = "";
				for (let r = t.length - 1; r >= 0; r--) {
					let h = t[r];
					if (!(!h || h === ".") && (e = e ? `${h}/${e}` : h, this.isAbsolute(h))) break;
				}
				let s = this.#t.get(e);
				if (s !== void 0) return s;
				let i = this.cwd.resolve(e).fullpath();
				return this.#t.set(e, i), i;
			}
			resolvePosix(...t) {
				let e = "";
				for (let r = t.length - 1; r >= 0; r--) {
					let h = t[r];
					if (!(!h || h === ".") && (e = e ? `${h}/${e}` : h, this.isAbsolute(h))) break;
				}
				let s = this.#s.get(e);
				if (s !== void 0) return s;
				let i = this.cwd.resolve(e).fullpathPosix();
				return this.#s.set(e, i), i;
			}
			relative(t = this.cwd) {
				return typeof t == "string" && (t = this.cwd.resolve(t)), t.relative();
			}
			relativePosix(t = this.cwd) {
				return typeof t == "string" && (t = this.cwd.resolve(t)), t.relativePosix();
			}
			basename(t = this.cwd) {
				return typeof t == "string" && (t = this.cwd.resolve(t)), t.name;
			}
			dirname(t = this.cwd) {
				return typeof t == "string" && (t = this.cwd.resolve(t)), (t.parent || t).fullpath();
			}
			async readdir(t = this.cwd, e = { withFileTypes: !0 }) {
				typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof A || (e = t, t = this.cwd);
				let { withFileTypes: s } = e;
				if (t.canReaddir()) {
					let i = await t.readdir();
					return s ? i : i.map((r) => r.name);
				} else return [];
			}
			readdirSync(t = this.cwd, e = { withFileTypes: !0 }) {
				typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof A || (e = t, t = this.cwd);
				let { withFileTypes: s = !0 } = e;
				return t.canReaddir() ? s ? t.readdirSync() : t.readdirSync().map((i) => i.name) : [];
			}
			async lstat(t = this.cwd) {
				return typeof t == "string" && (t = this.cwd.resolve(t)), t.lstat();
			}
			lstatSync(t = this.cwd) {
				return typeof t == "string" && (t = this.cwd.resolve(t)), t.lstatSync();
			}
			async readlink(t = this.cwd, { withFileTypes: e } = { withFileTypes: !1 }) {
				typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof A || (e = t.withFileTypes, t = this.cwd);
				let s = await t.readlink();
				return e ? s : s?.fullpath();
			}
			readlinkSync(t = this.cwd, { withFileTypes: e } = { withFileTypes: !1 }) {
				typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof A || (e = t.withFileTypes, t = this.cwd);
				let s = t.readlinkSync();
				return e ? s : s?.fullpath();
			}
			async realpath(t = this.cwd, { withFileTypes: e } = { withFileTypes: !1 }) {
				typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof A || (e = t.withFileTypes, t = this.cwd);
				let s = await t.realpath();
				return e ? s : s?.fullpath();
			}
			realpathSync(t = this.cwd, { withFileTypes: e } = { withFileTypes: !1 }) {
				typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof A || (e = t.withFileTypes, t = this.cwd);
				let s = t.realpathSync();
				return e ? s : s?.fullpath();
			}
			async walk(t = this.cwd, e = {}) {
				typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof A || (e = t, t = this.cwd);
				let { withFileTypes: s = !0, follow: i = !1, filter: r, walkFilter: h } = e, o = [];
				(!r || r(t)) && o.push(s ? t : t.fullpath());
				let a = /* @__PURE__ */ new Set(), l = (c, d) => {
					a.add(c), c.readdirCB((u, m) => {
						if (u) return d(u);
						let p = m.length;
						if (!p) return d();
						let b = () => {
							--p === 0 && d();
						};
						for (let w of m) (!r || r(w)) && o.push(s ? w : w.fullpath()), i && w.isSymbolicLink() ? w.realpath().then((v) => v?.isUnknown() ? v.lstat() : v).then((v) => v?.shouldWalk(a, h) ? l(v, b) : b()) : w.shouldWalk(a, h) ? l(w, b) : b();
					}, !0);
				}, f = t;
				return new Promise((c, d) => {
					l(f, (u) => {
						if (u) return d(u);
						c(o);
					});
				});
			}
			walkSync(t = this.cwd, e = {}) {
				typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof A || (e = t, t = this.cwd);
				let { withFileTypes: s = !0, follow: i = !1, filter: r, walkFilter: h } = e, o = [];
				(!r || r(t)) && o.push(s ? t : t.fullpath());
				let a = /* @__PURE__ */ new Set([t]);
				for (let l of a) {
					let f = l.readdirSync();
					for (let c of f) {
						(!r || r(c)) && o.push(s ? c : c.fullpath());
						let d = c;
						if (c.isSymbolicLink()) {
							if (!(i && (d = c.realpathSync()))) continue;
							d.isUnknown() && d.lstatSync();
						}
						d.shouldWalk(a, h) && a.add(d);
					}
				}
				return o;
			}
			[Symbol.asyncIterator]() {
				return this.iterate();
			}
			iterate(t = this.cwd, e = {}) {
				return typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof A || (e = t, t = this.cwd), this.stream(t, e)[Symbol.asyncIterator]();
			}
			[Symbol.iterator]() {
				return this.iterateSync();
			}
			*iterateSync(t = this.cwd, e = {}) {
				typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof A || (e = t, t = this.cwd);
				let { withFileTypes: s = !0, follow: i = !1, filter: r, walkFilter: h } = e;
				(!r || r(t)) && (yield s ? t : t.fullpath());
				let o = /* @__PURE__ */ new Set([t]);
				for (let a of o) {
					let l = a.readdirSync();
					for (let f of l) {
						(!r || r(f)) && (yield s ? f : f.fullpath());
						let c = f;
						if (f.isSymbolicLink()) {
							if (!(i && (c = f.realpathSync()))) continue;
							c.isUnknown() && c.lstatSync();
						}
						c.shouldWalk(o, h) && o.add(c);
					}
				}
			}
			stream(t = this.cwd, e = {}) {
				typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof A || (e = t, t = this.cwd);
				let { withFileTypes: s = !0, follow: i = !1, filter: r, walkFilter: h } = e, o = new bs.Minipass({ objectMode: !0 });
				(!r || r(t)) && o.write(s ? t : t.fullpath());
				let a = /* @__PURE__ */ new Set(), l = [t], f = 0, c = () => {
					let d = !1;
					for (; !d;) {
						let u = l.shift();
						if (!u) {
							f === 0 && o.end();
							return;
						}
						f++, a.add(u);
						let m = (b, w, v = !1) => {
							if (b) return o.emit("error", b);
							if (i && !v) {
								let E = [];
								for (let y of w) y.isSymbolicLink() && E.push(y.realpath().then((S) => S?.isUnknown() ? S.lstat() : S));
								if (E.length) {
									Promise.all(E).then(() => m(null, w, !0));
									return;
								}
							}
							for (let E of w) E && (!r || r(E)) && (o.write(s ? E : E.fullpath()) || (d = !0));
							f--;
							for (let E of w) {
								let y = E.realpathCached() || E;
								y.shouldWalk(a, h) && l.push(y);
							}
							d && !o.flowing ? o.once("drain", c) : p || c();
						}, p = !0;
						u.readdirCB(m, !0), p = !1;
					}
				};
				return c(), o;
			}
			streamSync(t = this.cwd, e = {}) {
				typeof t == "string" ? t = this.cwd.resolve(t) : t instanceof A || (e = t, t = this.cwd);
				let { withFileTypes: s = !0, follow: i = !1, filter: r, walkFilter: h } = e, o = new bs.Minipass({ objectMode: !0 }), a = /* @__PURE__ */ new Set();
				(!r || r(t)) && o.write(s ? t : t.fullpath());
				let l = [t], f = 0, c = () => {
					let d = !1;
					for (; !d;) {
						let u = l.shift();
						if (!u) {
							f === 0 && o.end();
							return;
						}
						f++, a.add(u);
						let m = u.readdirSync();
						for (let p of m) (!r || r(p)) && (o.write(s ? p : p.fullpath()) || (d = !0));
						f--;
						for (let p of m) {
							let b = p;
							if (p.isSymbolicLink()) {
								if (!(i && (b = p.realpathSync()))) continue;
								b.isUnknown() && b.lstatSync();
							}
							b.shouldWalk(a, h) && l.push(b);
						}
					}
					d && !o.flowing && o.once("drain", c);
				};
				return c(), o;
			}
			chdir(t = this.cwd) {
				let e = this.cwd;
				this.cwd = typeof t == "string" ? this.cwd.resolve(t) : t, this.cwd[ks](e);
			}
		};
		_.PathScurryBase = vt;
		var Et = class extends vt {
			sep = "\\";
			constructor(t = process.cwd(), e = {}) {
				let { nocase: s = !0 } = e;
				super(t, Yt.win32, "\\", {
					...e,
					nocase: s
				}), this.nocase = s;
				for (let i = this.cwd; i; i = i.parent) i.nocase = this.nocase;
			}
			parseRootPath(t) {
				return Yt.win32.parse(t).root.toUpperCase();
			}
			newRoot(t) {
				return new yt(this.rootPath, G, void 0, this.roots, this.nocase, this.childrenCache(), { fs: t });
			}
			isAbsolute(t) {
				return t.startsWith("/") || t.startsWith("\\") || /^[a-z]:(\/|\\)/i.test(t);
			}
		};
		_.PathScurryWin32 = Et;
		var _t = class extends vt {
			sep = "/";
			constructor(t = process.cwd(), e = {}) {
				let { nocase: s = !1 } = e;
				super(t, Yt.posix, "/", {
					...e,
					nocase: s
				}), this.nocase = s;
			}
			parseRootPath(t) {
				return "/";
			}
			newRoot(t) {
				return new St(this.rootPath, G, void 0, this.roots, this.nocase, this.childrenCache(), { fs: t });
			}
			isAbsolute(t) {
				return t.startsWith("/");
			}
		};
		_.PathScurryPosix = _t;
		var Zt = class extends _t {
			constructor(t = process.cwd(), e = {}) {
				let { nocase: s = !0 } = e;
				super(t, {
					...e,
					nocase: s
				});
			}
		};
		_.PathScurryDarwin = Zt;
		_.Path = process.platform === "win32" ? yt : St;
		_.PathScurry = process.platform === "win32" ? Et : process.platform === "darwin" ? Zt : _t;
	});
	var Re = R((te) => {
		"use strict";
		Object.defineProperty(te, "__esModule", { value: !0 });
		te.Pattern = void 0;
		var xr = H(), Tr = (n) => n.length >= 1, Cr = (n) => n.length >= 1, Rr = Symbol.for("nodejs.util.inspect.custom");
		te.Pattern = class n {
			#t;
			#s;
			#n;
			length;
			#r;
			#h;
			#S;
			#w;
			#c;
			#o;
			#f = !0;
			constructor(t, e, s, i) {
				if (!Tr(t)) throw new TypeError("empty pattern list");
				if (!Cr(e)) throw new TypeError("empty glob list");
				if (e.length !== t.length) throw new TypeError("mismatched pattern list and glob list lengths");
				if (this.length = t.length, s < 0 || s >= this.length) throw new TypeError("index out of range");
				if (this.#t = t, this.#s = e, this.#n = s, this.#r = i, this.#n === 0) {
					if (this.isUNC()) {
						let [r, h, o, a, ...l] = this.#t, [f, c, d, u, ...m] = this.#s;
						l[0] === "" && (l.shift(), m.shift());
						let p = [
							r,
							h,
							o,
							a,
							""
						].join("/"), b = [
							f,
							c,
							d,
							u,
							""
						].join("/");
						this.#t = [p, ...l], this.#s = [b, ...m], this.length = this.#t.length;
					} else if (this.isDrive() || this.isAbsolute()) {
						let [r, ...h] = this.#t, [o, ...a] = this.#s;
						h[0] === "" && (h.shift(), a.shift());
						let l = r + "/", f = o + "/";
						this.#t = [l, ...h], this.#s = [f, ...a], this.length = this.#t.length;
					}
				}
			}
			[Rr]() {
				return "Pattern <" + this.#s.slice(this.#n).join("/") + ">";
			}
			pattern() {
				return this.#t[this.#n];
			}
			isString() {
				return typeof this.#t[this.#n] == "string";
			}
			isGlobstar() {
				return this.#t[this.#n] === xr.GLOBSTAR;
			}
			isRegExp() {
				return this.#t[this.#n] instanceof RegExp;
			}
			globString() {
				return this.#S = this.#S || (this.#n === 0 ? this.isAbsolute() ? this.#s[0] + this.#s.slice(1).join("/") : this.#s.join("/") : this.#s.slice(this.#n).join("/"));
			}
			hasMore() {
				return this.length > this.#n + 1;
			}
			rest() {
				return this.#h !== void 0 ? this.#h : this.hasMore() ? (this.#h = new n(this.#t, this.#s, this.#n + 1, this.#r), this.#h.#o = this.#o, this.#h.#c = this.#c, this.#h.#w = this.#w, this.#h) : this.#h = null;
			}
			isUNC() {
				let t = this.#t;
				return this.#c !== void 0 ? this.#c : this.#c = this.#r === "win32" && this.#n === 0 && t[0] === "" && t[1] === "" && typeof t[2] == "string" && !!t[2] && typeof t[3] == "string" && !!t[3];
			}
			isDrive() {
				let t = this.#t;
				return this.#w !== void 0 ? this.#w : this.#w = this.#r === "win32" && this.#n === 0 && this.length > 1 && typeof t[0] == "string" && /^[a-z]:$/i.test(t[0]);
			}
			isAbsolute() {
				let t = this.#t;
				return this.#o !== void 0 ? this.#o : this.#o = t[0] === "" && t.length > 1 || this.isDrive() || this.isUNC();
			}
			root() {
				let t = this.#t[0];
				return typeof t == "string" && this.isAbsolute() && this.#n === 0 ? t : "";
			}
			checkFollowGlobstar() {
				return !(this.#n === 0 || !this.isGlobstar() || !this.#f);
			}
			markFollowGlobstar() {
				return this.#n === 0 || !this.isGlobstar() || !this.#f ? !1 : (this.#f = !1, !0);
			}
		};
	});
	var ke = R((ee) => {
		"use strict";
		Object.defineProperty(ee, "__esModule", { value: !0 });
		ee.Ignore = void 0;
		var Ps = H(), Ar = Re(), kr = typeof process == "object" && process && typeof process.platform == "string" ? process.platform : "linux", Ae = class {
			relative;
			relativeChildren;
			absolute;
			absoluteChildren;
			platform;
			mmopts;
			constructor(t, { nobrace: e, nocase: s, noext: i, noglobstar: r, platform: h = kr }) {
				this.relative = [], this.absolute = [], this.relativeChildren = [], this.absoluteChildren = [], this.platform = h, this.mmopts = {
					dot: !0,
					nobrace: e,
					nocase: s,
					noext: i,
					noglobstar: r,
					optimizationLevel: 2,
					platform: h,
					nocomment: !0,
					nonegate: !0
				};
				for (let o of t) this.add(o);
			}
			add(t) {
				let e = new Ps.Minimatch(t, this.mmopts);
				for (let s = 0; s < e.set.length; s++) {
					let i = e.set[s], r = e.globParts[s];
					if (!i || !r) throw new Error("invalid pattern object");
					for (; i[0] === "." && r[0] === ".";) i.shift(), r.shift();
					let h = new Ar.Pattern(i, r, 0, this.platform), o = new Ps.Minimatch(h.globString(), this.mmopts), a = r[r.length - 1] === "**", l = h.isAbsolute();
					l ? this.absolute.push(o) : this.relative.push(o), a && (l ? this.absoluteChildren.push(o) : this.relativeChildren.push(o));
				}
			}
			ignored(t) {
				let e = t.fullpath(), s = `${e}/`, i = t.relative() || ".", r = `${i}/`;
				for (let h of this.relative) if (h.match(i) || h.match(r)) return !0;
				for (let h of this.absolute) if (h.match(e) || h.match(s)) return !0;
				return !1;
			}
			childrenIgnored(t) {
				let e = t.fullpath() + "/", s = (t.relative() || ".") + "/";
				for (let i of this.relativeChildren) if (i.match(s)) return !0;
				for (let i of this.absoluteChildren) if (i.match(e)) return !0;
				return !1;
			}
		};
		ee.Ignore = Ae;
	});
	var Fs = R((z) => {
		"use strict";
		Object.defineProperty(z, "__esModule", { value: !0 });
		z.Processor = z.SubWalks = z.MatchRecord = z.HasWalkedCache = void 0;
		var Ds = H(), se = class n {
			store;
			constructor(t = /* @__PURE__ */ new Map()) {
				this.store = t;
			}
			copy() {
				return new n(new Map(this.store));
			}
			hasWalked(t, e) {
				return this.store.get(t.fullpath())?.has(e.globString());
			}
			storeWalked(t, e) {
				let s = t.fullpath(), i = this.store.get(s);
				i ? i.add(e.globString()) : this.store.set(s, /* @__PURE__ */ new Set([e.globString()]));
			}
		};
		z.HasWalkedCache = se;
		var ie = class {
			store = /* @__PURE__ */ new Map();
			add(t, e, s) {
				let i = (e ? 2 : 0) | (s ? 1 : 0), r = this.store.get(t);
				this.store.set(t, r === void 0 ? i : i & r);
			}
			entries() {
				return [...this.store.entries()].map(([t, e]) => [
					t,
					!!(e & 2),
					!!(e & 1)
				]);
			}
		};
		z.MatchRecord = ie;
		var re = class {
			store = /* @__PURE__ */ new Map();
			add(t, e) {
				if (!t.canReaddir()) return;
				let s = this.store.get(t);
				s ? s.find((i) => i.globString() === e.globString()) || s.push(e) : this.store.set(t, [e]);
			}
			get(t) {
				let e = this.store.get(t);
				if (!e) throw new Error("attempting to walk unknown path");
				return e;
			}
			entries() {
				return this.keys().map((t) => [t, this.store.get(t)]);
			}
			keys() {
				return [...this.store.keys()].filter((t) => t.canReaddir());
			}
		};
		z.SubWalks = re;
		z.Processor = class n {
			hasWalkedCache;
			matches = new ie();
			subwalks = new re();
			patterns;
			follow;
			dot;
			opts;
			constructor(t, e) {
				this.opts = t, this.follow = !!t.follow, this.dot = !!t.dot, this.hasWalkedCache = e ? e.copy() : new se();
			}
			processPatterns(t, e) {
				this.patterns = e;
				let s = e.map((i) => [t, i]);
				for (let [i, r] of s) {
					this.hasWalkedCache.storeWalked(i, r);
					let h = r.root(), o = r.isAbsolute() && this.opts.absolute !== !1;
					if (h) {
						i = i.resolve(h === "/" && this.opts.root !== void 0 ? this.opts.root : h);
						let c = r.rest();
						if (c) r = c;
						else {
							this.matches.add(i, !0, !1);
							continue;
						}
					}
					if (i.isENOENT()) continue;
					let a, l, f = !1;
					for (; typeof (a = r.pattern()) == "string" && (l = r.rest());) i = i.resolve(a), r = l, f = !0;
					if (a = r.pattern(), l = r.rest(), f) {
						if (this.hasWalkedCache.hasWalked(i, r)) continue;
						this.hasWalkedCache.storeWalked(i, r);
					}
					if (typeof a == "string") {
						let c = a === ".." || a === "" || a === ".";
						this.matches.add(i.resolve(a), o, c);
						continue;
					} else if (a === Ds.GLOBSTAR) {
						(!i.isSymbolicLink() || this.follow || r.checkFollowGlobstar()) && this.subwalks.add(i, r);
						let c = l?.pattern(), d = l?.rest();
						if (!l || (c === "" || c === ".") && !d) this.matches.add(i, o, c === "" || c === ".");
						else if (c === "..") {
							let u = i.parent || i;
							d ? this.hasWalkedCache.hasWalked(u, d) || this.subwalks.add(u, d) : this.matches.add(u, o, !0);
						}
					} else a instanceof RegExp && this.subwalks.add(i, r);
				}
				return this;
			}
			subwalkTargets() {
				return this.subwalks.keys();
			}
			child() {
				return new n(this.opts, this.hasWalkedCache);
			}
			filterEntries(t, e) {
				let s = this.subwalks.get(t), i = this.child();
				for (let r of e) for (let h of s) {
					let o = h.isAbsolute(), a = h.pattern(), l = h.rest();
					a === Ds.GLOBSTAR ? i.testGlobstar(r, h, l, o) : a instanceof RegExp ? i.testRegExp(r, a, l, o) : i.testString(r, a, l, o);
				}
				return i;
			}
			testGlobstar(t, e, s, i) {
				if ((this.dot || !t.name.startsWith(".")) && (e.hasMore() || this.matches.add(t, i, !1), t.canReaddir() && (this.follow || !t.isSymbolicLink() ? this.subwalks.add(t, e) : t.isSymbolicLink() && (s && e.checkFollowGlobstar() ? this.subwalks.add(t, s) : e.markFollowGlobstar() && this.subwalks.add(t, e)))), s) {
					let r = s.pattern();
					if (typeof r == "string" && r !== ".." && r !== "" && r !== ".") this.testString(t, r, s.rest(), i);
					else if (r === "..") {
						let h = t.parent || t;
						this.subwalks.add(h, s);
					} else r instanceof RegExp && this.testRegExp(t, r, s.rest(), i);
				}
			}
			testRegExp(t, e, s, i) {
				e.test(t.name) && (s ? this.subwalks.add(t, s) : this.matches.add(t, i, !1));
			}
			testString(t, e, s, i) {
				t.isNamed(e) && (s ? this.subwalks.add(t, s) : this.matches.add(t, i, !1));
			}
		};
	});
	var Ls = R((X) => {
		"use strict";
		Object.defineProperty(X, "__esModule", { value: !0 });
		X.GlobStream = X.GlobWalker = X.GlobUtil = void 0;
		var Mr = Oe(), js = ke(), Ns = Fs(), Pr = (n, t) => typeof n == "string" ? new js.Ignore([n], t) : Array.isArray(n) ? new js.Ignore(n, t) : n, Ot = class {
			path;
			patterns;
			opts;
			seen = /* @__PURE__ */ new Set();
			paused = !1;
			aborted = !1;
			#t = [];
			#s;
			#n;
			signal;
			maxDepth;
			includeChildMatches;
			constructor(t, e, s) {
				if (this.patterns = t, this.path = e, this.opts = s, this.#n = !s.posix && s.platform === "win32" ? "\\" : "/", this.includeChildMatches = s.includeChildMatches !== !1, (s.ignore || !this.includeChildMatches) && (this.#s = Pr(s.ignore ?? [], s), !this.includeChildMatches && typeof this.#s.add != "function")) throw new Error("cannot ignore child matches, ignore lacks add() method.");
				this.maxDepth = s.maxDepth || 1 / 0, s.signal && (this.signal = s.signal, this.signal.addEventListener("abort", () => {
					this.#t.length = 0;
				}));
			}
			#r(t) {
				return this.seen.has(t) || !!this.#s?.ignored?.(t);
			}
			#h(t) {
				return !!this.#s?.childrenIgnored?.(t);
			}
			pause() {
				this.paused = !0;
			}
			resume() {
				if (this.signal?.aborted) return;
				this.paused = !1;
				let t;
				for (; !this.paused && (t = this.#t.shift());) t();
			}
			onResume(t) {
				this.signal?.aborted || (this.paused ? this.#t.push(t) : t());
			}
			async matchCheck(t, e) {
				if (e && this.opts.nodir) return;
				let s;
				if (this.opts.realpath) {
					if (s = t.realpathCached() || await t.realpath(), !s) return;
					t = s;
				}
				let r = t.isUnknown() || this.opts.stat ? await t.lstat() : t;
				if (this.opts.follow && this.opts.nodir && r?.isSymbolicLink()) {
					let h = await r.realpath();
					h && (h.isUnknown() || this.opts.stat) && await h.lstat();
				}
				return this.matchCheckTest(r, e);
			}
			matchCheckTest(t, e) {
				return t && (this.maxDepth === 1 / 0 || t.depth() <= this.maxDepth) && (!e || t.canReaddir()) && (!this.opts.nodir || !t.isDirectory()) && (!this.opts.nodir || !this.opts.follow || !t.isSymbolicLink() || !t.realpathCached()?.isDirectory()) && !this.#r(t) ? t : void 0;
			}
			matchCheckSync(t, e) {
				if (e && this.opts.nodir) return;
				let s;
				if (this.opts.realpath) {
					if (s = t.realpathCached() || t.realpathSync(), !s) return;
					t = s;
				}
				let r = t.isUnknown() || this.opts.stat ? t.lstatSync() : t;
				if (this.opts.follow && this.opts.nodir && r?.isSymbolicLink()) {
					let h = r.realpathSync();
					h && (h?.isUnknown() || this.opts.stat) && h.lstatSync();
				}
				return this.matchCheckTest(r, e);
			}
			matchFinish(t, e) {
				if (this.#r(t)) return;
				if (!this.includeChildMatches && this.#s?.add) {
					let r = `${t.relativePosix()}/**`;
					this.#s.add(r);
				}
				let s = this.opts.absolute === void 0 ? e : this.opts.absolute;
				this.seen.add(t);
				let i = this.opts.mark && t.isDirectory() ? this.#n : "";
				if (this.opts.withFileTypes) this.matchEmit(t);
				else if (s) {
					let r = this.opts.posix ? t.fullpathPosix() : t.fullpath();
					this.matchEmit(r + i);
				} else {
					let r = this.opts.posix ? t.relativePosix() : t.relative(), h = this.opts.dotRelative && !r.startsWith(".." + this.#n) ? "." + this.#n : "";
					this.matchEmit(r ? h + r + i : "." + i);
				}
			}
			async match(t, e, s) {
				let i = await this.matchCheck(t, s);
				i && this.matchFinish(i, e);
			}
			matchSync(t, e, s) {
				let i = this.matchCheckSync(t, s);
				i && this.matchFinish(i, e);
			}
			walkCB(t, e, s) {
				this.signal?.aborted && s(), this.walkCB2(t, e, new Ns.Processor(this.opts), s);
			}
			walkCB2(t, e, s, i) {
				if (this.#h(t)) return i();
				if (this.signal?.aborted && i(), this.paused) {
					this.onResume(() => this.walkCB2(t, e, s, i));
					return;
				}
				s.processPatterns(t, e);
				let r = 1, h = () => {
					--r === 0 && i();
				};
				for (let [o, a, l] of s.matches.entries()) this.#r(o) || (r++, this.match(o, a, l).then(() => h()));
				for (let o of s.subwalkTargets()) {
					if (this.maxDepth !== 1 / 0 && o.depth() >= this.maxDepth) continue;
					r++;
					let a = o.readdirCached();
					o.calledReaddir() ? this.walkCB3(o, a, s, h) : o.readdirCB((l, f) => this.walkCB3(o, f, s, h), !0);
				}
				h();
			}
			walkCB3(t, e, s, i) {
				s = s.filterEntries(t, e);
				let r = 1, h = () => {
					--r === 0 && i();
				};
				for (let [o, a, l] of s.matches.entries()) this.#r(o) || (r++, this.match(o, a, l).then(() => h()));
				for (let [o, a] of s.subwalks.entries()) r++, this.walkCB2(o, a, s.child(), h);
				h();
			}
			walkCBSync(t, e, s) {
				this.signal?.aborted && s(), this.walkCB2Sync(t, e, new Ns.Processor(this.opts), s);
			}
			walkCB2Sync(t, e, s, i) {
				if (this.#h(t)) return i();
				if (this.signal?.aborted && i(), this.paused) {
					this.onResume(() => this.walkCB2Sync(t, e, s, i));
					return;
				}
				s.processPatterns(t, e);
				let r = 1, h = () => {
					--r === 0 && i();
				};
				for (let [o, a, l] of s.matches.entries()) this.#r(o) || this.matchSync(o, a, l);
				for (let o of s.subwalkTargets()) {
					if (this.maxDepth !== 1 / 0 && o.depth() >= this.maxDepth) continue;
					r++;
					let a = o.readdirSync();
					this.walkCB3Sync(o, a, s, h);
				}
				h();
			}
			walkCB3Sync(t, e, s, i) {
				s = s.filterEntries(t, e);
				let r = 1, h = () => {
					--r === 0 && i();
				};
				for (let [o, a, l] of s.matches.entries()) this.#r(o) || this.matchSync(o, a, l);
				for (let [o, a] of s.subwalks.entries()) r++, this.walkCB2Sync(o, a, s.child(), h);
				h();
			}
		};
		X.GlobUtil = Ot;
		var Pe = class extends Ot {
			matches = /* @__PURE__ */ new Set();
			constructor(t, e, s) {
				super(t, e, s);
			}
			matchEmit(t) {
				this.matches.add(t);
			}
			async walk() {
				if (this.signal?.aborted) throw this.signal.reason;
				return this.path.isUnknown() && await this.path.lstat(), await new Promise((t, e) => {
					this.walkCB(this.path, this.patterns, () => {
						this.signal?.aborted ? e(this.signal.reason) : t(this.matches);
					});
				}), this.matches;
			}
			walkSync() {
				if (this.signal?.aborted) throw this.signal.reason;
				return this.path.isUnknown() && this.path.lstatSync(), this.walkCBSync(this.path, this.patterns, () => {
					if (this.signal?.aborted) throw this.signal.reason;
				}), this.matches;
			}
		};
		X.GlobWalker = Pe;
		var De = class extends Ot {
			results;
			constructor(t, e, s) {
				super(t, e, s), this.results = new Mr.Minipass({
					signal: this.signal,
					objectMode: !0
				}), this.results.on("drain", () => this.resume()), this.results.on("resume", () => this.resume());
			}
			matchEmit(t) {
				this.results.write(t), this.results.flowing || this.pause();
			}
			stream() {
				let t = this.path;
				return t.isUnknown() ? t.lstat().then(() => {
					this.walkCB(t, this.patterns, () => this.results.end());
				}) : this.walkCB(t, this.patterns, () => this.results.end()), this.results;
			}
			streamSync() {
				return this.path.isUnknown() && this.path.lstatSync(), this.walkCBSync(this.path, this.patterns, () => this.results.end()), this.results;
			}
		};
		X.GlobStream = De;
	});
	var je = R((oe) => {
		"use strict";
		Object.defineProperty(oe, "__esModule", { value: !0 });
		oe.Glob = void 0;
		var Dr = H(), Fr = require("node:url"), ne = Ms(), jr = Re(), he = Ls(), Nr = typeof process == "object" && process && typeof process.platform == "string" ? process.platform : "linux", Fe = class {
			absolute;
			cwd;
			root;
			dot;
			dotRelative;
			follow;
			ignore;
			magicalBraces;
			mark;
			matchBase;
			maxDepth;
			nobrace;
			nocase;
			nodir;
			noext;
			noglobstar;
			pattern;
			platform;
			realpath;
			scurry;
			stat;
			signal;
			windowsPathsNoEscape;
			withFileTypes;
			includeChildMatches;
			opts;
			patterns;
			constructor(t, e) {
				if (!e) throw new TypeError("glob options required");
				if (this.withFileTypes = !!e.withFileTypes, this.signal = e.signal, this.follow = !!e.follow, this.dot = !!e.dot, this.dotRelative = !!e.dotRelative, this.nodir = !!e.nodir, this.mark = !!e.mark, e.cwd ? (e.cwd instanceof URL || e.cwd.startsWith("file://")) && (e.cwd = (0, Fr.fileURLToPath)(e.cwd)) : this.cwd = "", this.cwd = e.cwd || "", this.root = e.root, this.magicalBraces = !!e.magicalBraces, this.nobrace = !!e.nobrace, this.noext = !!e.noext, this.realpath = !!e.realpath, this.absolute = e.absolute, this.includeChildMatches = e.includeChildMatches !== !1, this.noglobstar = !!e.noglobstar, this.matchBase = !!e.matchBase, this.maxDepth = typeof e.maxDepth == "number" ? e.maxDepth : 1 / 0, this.stat = !!e.stat, this.ignore = e.ignore, this.withFileTypes && this.absolute !== void 0) throw new Error("cannot set absolute and withFileTypes:true");
				if (typeof t == "string" && (t = [t]), this.windowsPathsNoEscape = !!e.windowsPathsNoEscape || e.allowWindowsEscape === !1, this.windowsPathsNoEscape && (t = t.map((a) => a.replace(/\\/g, "/"))), this.matchBase) {
					if (e.noglobstar) throw new TypeError("base matching requires globstar");
					t = t.map((a) => a.includes("/") ? a : `./**/${a}`);
				}
				if (this.pattern = t, this.platform = e.platform || Nr, this.opts = {
					...e,
					platform: this.platform
				}, e.scurry) {
					if (this.scurry = e.scurry, e.nocase !== void 0 && e.nocase !== e.scurry.nocase) throw new Error("nocase option contradicts provided scurry option");
				} else {
					let a = e.platform === "win32" ? ne.PathScurryWin32 : e.platform === "darwin" ? ne.PathScurryDarwin : e.platform ? ne.PathScurryPosix : ne.PathScurry;
					this.scurry = new a(this.cwd, {
						nocase: e.nocase,
						fs: e.fs
					});
				}
				this.nocase = this.scurry.nocase;
				let s = this.platform === "darwin" || this.platform === "win32", i = {
					braceExpandMax: 1e4,
					...e,
					dot: this.dot,
					matchBase: this.matchBase,
					nobrace: this.nobrace,
					nocase: this.nocase,
					nocaseMagicOnly: s,
					nocomment: !0,
					noext: this.noext,
					nonegate: !0,
					optimizationLevel: 2,
					platform: this.platform,
					windowsPathsNoEscape: this.windowsPathsNoEscape,
					debug: !!this.opts.debug
				}, [h, o] = this.pattern.map((a) => new Dr.Minimatch(a, i)).reduce((a, l) => (a[0].push(...l.set), a[1].push(...l.globParts), a), [[], []]);
				this.patterns = h.map((a, l) => {
					let f = o[l];
					if (!f) throw new Error("invalid pattern object");
					return new jr.Pattern(a, f, 0, this.platform);
				});
			}
			async walk() {
				return [...await new he.GlobWalker(this.patterns, this.scurry.cwd, {
					...this.opts,
					maxDepth: this.maxDepth !== 1 / 0 ? this.maxDepth + this.scurry.cwd.depth() : 1 / 0,
					platform: this.platform,
					nocase: this.nocase,
					includeChildMatches: this.includeChildMatches
				}).walk()];
			}
			walkSync() {
				return [...new he.GlobWalker(this.patterns, this.scurry.cwd, {
					...this.opts,
					maxDepth: this.maxDepth !== 1 / 0 ? this.maxDepth + this.scurry.cwd.depth() : 1 / 0,
					platform: this.platform,
					nocase: this.nocase,
					includeChildMatches: this.includeChildMatches
				}).walkSync()];
			}
			stream() {
				return new he.GlobStream(this.patterns, this.scurry.cwd, {
					...this.opts,
					maxDepth: this.maxDepth !== 1 / 0 ? this.maxDepth + this.scurry.cwd.depth() : 1 / 0,
					platform: this.platform,
					nocase: this.nocase,
					includeChildMatches: this.includeChildMatches
				}).stream();
			}
			streamSync() {
				return new he.GlobStream(this.patterns, this.scurry.cwd, {
					...this.opts,
					maxDepth: this.maxDepth !== 1 / 0 ? this.maxDepth + this.scurry.cwd.depth() : 1 / 0,
					platform: this.platform,
					nocase: this.nocase,
					includeChildMatches: this.includeChildMatches
				}).streamSync();
			}
			iterateSync() {
				return this.streamSync()[Symbol.iterator]();
			}
			[Symbol.iterator]() {
				return this.iterateSync();
			}
			iterate() {
				return this.stream()[Symbol.asyncIterator]();
			}
			[Symbol.asyncIterator]() {
				return this.iterate();
			}
		};
		oe.Glob = Fe;
	});
	var Ne = R((ae) => {
		"use strict";
		Object.defineProperty(ae, "__esModule", { value: !0 });
		ae.hasMagic = void 0;
		var Lr = H(), Wr = (n, t = {}) => {
			Array.isArray(n) || (n = [n]);
			for (let e of n) if (new Lr.Minimatch(e, t).hasMagic()) return !0;
			return !1;
		};
		ae.hasMagic = Wr;
	});
	Object.defineProperty(exports, "__esModule", { value: !0 });
	exports.glob = exports.sync = exports.iterate = exports.iterateSync = exports.stream = exports.streamSync = exports.Ignore = exports.hasMagic = exports.Glob = exports.unescape = exports.escape = void 0;
	exports.globStreamSync = xt;
	exports.globStream = Le;
	exports.globSync = We;
	exports.globIterateSync = Tt;
	exports.globIterate = Be;
	var Ws = H();
	var tt = je();
	var Br = Ne();
	var Is = H();
	Object.defineProperty(exports, "escape", {
		enumerable: !0,
		get: function() {
			return Is.escape;
		}
	});
	Object.defineProperty(exports, "unescape", {
		enumerable: !0,
		get: function() {
			return Is.unescape;
		}
	});
	var Ir = je();
	Object.defineProperty(exports, "Glob", {
		enumerable: !0,
		get: function() {
			return Ir.Glob;
		}
	});
	var Gr = Ne();
	Object.defineProperty(exports, "hasMagic", {
		enumerable: !0,
		get: function() {
			return Gr.hasMagic;
		}
	});
	var zr = ke();
	Object.defineProperty(exports, "Ignore", {
		enumerable: !0,
		get: function() {
			return zr.Ignore;
		}
	});
	function xt(n, t = {}) {
		return new tt.Glob(n, t).streamSync();
	}
	function Le(n, t = {}) {
		return new tt.Glob(n, t).stream();
	}
	function We(n, t = {}) {
		return new tt.Glob(n, t).walkSync();
	}
	async function Bs(n, t = {}) {
		return new tt.Glob(n, t).walk();
	}
	function Tt(n, t = {}) {
		return new tt.Glob(n, t).iterateSync();
	}
	function Be(n, t = {}) {
		return new tt.Glob(n, t).iterate();
	}
	exports.streamSync = xt;
	exports.stream = Object.assign(Le, { sync: xt });
	exports.iterateSync = Tt;
	exports.iterate = Object.assign(Be, { sync: Tt });
	exports.sync = Object.assign(We, {
		stream: xt,
		iterate: Tt
	});
	exports.glob = Object.assign(Bs, {
		glob: Bs,
		globSync: We,
		sync: exports.sync,
		globStream: Le,
		stream: exports.stream,
		globStreamSync: xt,
		streamSync: exports.streamSync,
		globIterate: Be,
		iterate: exports.iterate,
		globIterateSync: Tt,
		iterateSync: exports.iterateSync,
		Glob: tt.Glob,
		hasMagic: Br.hasMagic,
		escape: Ws.escape,
		unescape: Ws.unescape
	});
	exports.glob.glob = exports.glob;
}));
//#endregion
//#region ../../node_modules/.pnpm/@gar+promise-retry@1.0.3/node_modules/@gar/promise-retry/lib/retry.js
var require_retry = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	var RetryOperation = class {
		#attempts = 1;
		#cachedTimeouts = null;
		#errors = [];
		#fn = null;
		#maxRetryTime;
		#operationStart = null;
		#originalTimeouts;
		#timeouts;
		#timer = null;
		#unref;
		constructor(timeouts, options = {}) {
			this.#originalTimeouts = [...timeouts];
			this.#timeouts = [...timeouts];
			this.#unref = options.unref;
			this.#maxRetryTime = options.maxRetryTime || Infinity;
			if (options.forever) this.#cachedTimeouts = [...this.#timeouts];
		}
		get timeouts() {
			return [...this.#timeouts];
		}
		get errors() {
			return [...this.#errors];
		}
		get attempts() {
			return this.#attempts;
		}
		get mainError() {
			let mainError = null;
			if (this.#errors.length) {
				let mainErrorCount = 0;
				const counts = {};
				for (let i = 0; i < this.#errors.length; i++) {
					const error = this.#errors[i];
					const { message } = error;
					if (!counts[message]) counts[message] = 0;
					counts[message]++;
					if (counts[message] >= mainErrorCount) {
						mainError = error;
						mainErrorCount = counts[message];
					}
				}
			}
			return mainError;
		}
		reset() {
			this.#attempts = 1;
			this.#timeouts = [...this.#originalTimeouts];
		}
		stop() {
			if (this.#timer) clearTimeout(this.#timer);
			this.#timeouts = [];
			this.#cachedTimeouts = null;
		}
		retry(err) {
			this.#errors.push(err);
			if ((/* @__PURE__ */ new Date()).getTime() - this.#operationStart >= this.#maxRetryTime) {
				this.#errors.unshift(/* @__PURE__ */ new Error("RetryOperation timeout occurred"));
				return false;
			}
			let timeout = this.#timeouts.shift();
			if (timeout === void 0) {
				if (this.#cachedTimeouts) {
					this.#errors.pop();
					timeout = this.#cachedTimeouts.at(-1);
				} else return false;
			}
			this.#timer = setTimeout(() => {
				this.#attempts++;
				this.#fn(this.#attempts);
			}, timeout);
			if (this.#unref) this.#timer.unref();
			return true;
		}
		attempt(fn) {
			this.#fn = fn;
			this.#operationStart = (/* @__PURE__ */ new Date()).getTime();
			this.#fn(this.#attempts);
		}
	};
	module.exports = { RetryOperation };
}));
//#endregion
//#region ../../node_modules/.pnpm/@gar+promise-retry@1.0.3/node_modules/@gar/promise-retry/lib/index.js
var require_lib = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const { RetryOperation } = require_retry();
	const createTimeout = (attempt, opts) => Math.min(Math.round((1 + (opts.randomize ? Math.random() : 0)) * Math.max(opts.minTimeout, 1) * Math.pow(opts.factor, attempt)), opts.maxTimeout);
	const isRetryError = (err) => err?.code === "EPROMISERETRY" && Object.hasOwn(err, "retried");
	const promiseRetry = async (fn, options = {}) => {
		let timeouts = [];
		if (options instanceof Array) timeouts = [...options];
		else {
			if (options.retries === Infinity) {
				options.forever = true;
				delete options.retries;
			}
			const opts = {
				retries: 10,
				factor: 2,
				minTimeout: 1e3,
				maxTimeout: Infinity,
				randomize: false,
				...options
			};
			if (opts.minTimeout > opts.maxTimeout) throw new Error("minTimeout is greater than maxTimeout");
			if (opts.retries) {
				for (let i = 0; i < opts.retries; i++) timeouts.push(createTimeout(i, opts));
				timeouts.sort((a, b) => a - b);
			} else if (options.forever) timeouts.push(createTimeout(0, opts));
		}
		const operation = new RetryOperation(timeouts, {
			forever: options.forever,
			unref: options.unref,
			maxRetryTime: options.maxRetryTime
		});
		return new Promise(function(resolve, reject) {
			operation.attempt(async (number) => {
				try {
					return resolve(await fn((err) => {
						throw Object.assign(/* @__PURE__ */ new Error("Retrying"), {
							code: "EPROMISERETRY",
							retried: err
						});
					}, number, operation));
				} catch (err) {
					if (!isRetryError(err)) return reject(err);
					if (!operation.retry(err.retried || /* @__PURE__ */ new Error())) return reject(err.retried);
				}
			});
		});
	};
	module.exports = { promiseRetry };
}));
//#endregion
//#region ../../node_modules/.pnpm/balanced-match@4.0.4/node_modules/balanced-match/dist/commonjs/index.js
var require_commonjs$2 = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.range = exports.balanced = void 0;
	const balanced = (a, b, str) => {
		const ma = a instanceof RegExp ? maybeMatch(a, str) : a;
		const mb = b instanceof RegExp ? maybeMatch(b, str) : b;
		const r = ma !== null && mb != null && (0, exports.range)(ma, mb, str);
		return r && {
			start: r[0],
			end: r[1],
			pre: str.slice(0, r[0]),
			body: str.slice(r[0] + ma.length, r[1]),
			post: str.slice(r[1] + mb.length)
		};
	};
	exports.balanced = balanced;
	const maybeMatch = (reg, str) => {
		const m = str.match(reg);
		return m ? m[0] : null;
	};
	const range = (a, b, str) => {
		let begs, beg, left, right = void 0, result;
		let ai = str.indexOf(a);
		let bi = str.indexOf(b, ai + 1);
		let i = ai;
		if (ai >= 0 && bi > 0) {
			if (a === b) return [ai, bi];
			begs = [];
			left = str.length;
			while (i >= 0 && !result) {
				if (i === ai) {
					begs.push(i);
					ai = str.indexOf(a, i + 1);
				} else if (begs.length === 1) {
					const r = begs.pop();
					if (r !== void 0) result = [r, bi];
				} else {
					beg = begs.pop();
					if (beg !== void 0 && beg < left) {
						left = beg;
						right = bi;
					}
					bi = str.indexOf(b, i + 1);
				}
				i = ai < bi && ai >= 0 ? ai : bi;
			}
			if (begs.length && right !== void 0) result = [left, right];
		}
		return result;
	};
	exports.range = range;
}));
//#endregion
//#region ../../node_modules/.pnpm/brace-expansion@5.0.9/node_modules/brace-expansion/dist/commonjs/index.js
var require_commonjs$1 = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.EXPANSION_MAX_LENGTH = exports.EXPANSION_MAX = void 0;
	exports.expand = expand;
	const balanced_match_1 = require_commonjs$2();
	const escSlash = "\0SLASH" + Math.random() + "\0";
	const escOpen = "\0OPEN" + Math.random() + "\0";
	const escClose = "\0CLOSE" + Math.random() + "\0";
	const escComma = "\0COMMA" + Math.random() + "\0";
	const escPeriod = "\0PERIOD" + Math.random() + "\0";
	const escSlashPattern = new RegExp(escSlash, "g");
	const escOpenPattern = new RegExp(escOpen, "g");
	const escClosePattern = new RegExp(escClose, "g");
	const escCommaPattern = new RegExp(escComma, "g");
	const escPeriodPattern = new RegExp(escPeriod, "g");
	const slashPattern = /\\\\/g;
	const openPattern = /\\{/g;
	const closePattern = /\\}/g;
	const commaPattern = /\\,/g;
	const periodPattern = /\\\./g;
	exports.EXPANSION_MAX = 1e5;
	exports.EXPANSION_MAX_LENGTH = 4e6;
	function numeric(str) {
		return !isNaN(str) ? parseInt(str, 10) : str.charCodeAt(0);
	}
	function escapeBraces(str) {
		return str.replace(slashPattern, escSlash).replace(openPattern, escOpen).replace(closePattern, escClose).replace(commaPattern, escComma).replace(periodPattern, escPeriod);
	}
	function unescapeBraces(str) {
		return str.replace(escSlashPattern, "\\").replace(escOpenPattern, "{").replace(escClosePattern, "}").replace(escCommaPattern, ",").replace(escPeriodPattern, ".");
	}
	/**
	* Basically just str.split(","), but handling cases
	* where we have nested braced sections, which should be
	* treated as individual members, like {a,{b,c},d}
	*/
	function parseCommaParts(str) {
		if (!str) return [""];
		const parts = [];
		const m = (0, balanced_match_1.balanced)("{", "}", str);
		if (!m) return str.split(",");
		const { pre, body, post } = m;
		const p = pre.split(",");
		p[p.length - 1] += "{" + body + "}";
		const postParts = parseCommaParts(post);
		if (post.length) {
			p[p.length - 1] += postParts.shift();
			p.push.apply(p, postParts);
		}
		parts.push.apply(parts, p);
		return parts;
	}
	function expand(str, options = {}) {
		if (!str) return [];
		const { max = exports.EXPANSION_MAX, maxLength = exports.EXPANSION_MAX_LENGTH } = options;
		if (str.slice(0, 2) === "{}") str = "\\{\\}" + str.slice(2);
		return expand_(escapeBraces(str), max, maxLength, true).map(unescapeBraces);
	}
	function embrace(str) {
		return "{" + str + "}";
	}
	function isPadded(el) {
		return /^-?0\d/.test(el);
	}
	function lte(i, y) {
		return i <= y;
	}
	function gte(i, y) {
		return i >= y;
	}
	function combine(acc, pre, values, max, maxLength, dropEmpties) {
		const out = [];
		let length = 0;
		for (let a = 0; a < acc.length; a++) for (let v = 0; v < values.length; v++) {
			if (out.length >= max) return out;
			const expansion = acc[a] + pre + values[v];
			if (dropEmpties && !expansion) continue;
			if (length + expansion.length > maxLength) return out;
			out.push(expansion);
			length += expansion.length;
		}
		return out;
	}
	function expandSequence(body, isAlphaSequence, max, maxLength) {
		const n = body.split(/\.\./);
		const N = [];
		/* c8 ignore start */
		if (n[0] === void 0 || n[1] === void 0) return N;
		/* c8 ignore stop */
		const x = numeric(n[0]);
		const y = numeric(n[1]);
		const width = Math.max(n[0].length, n[1].length);
		let incr = n.length === 3 && n[2] !== void 0 ? Math.max(Math.abs(numeric(n[2])), 1) : 1;
		let test = lte;
		if (y < x) {
			incr *= -1;
			test = gte;
		}
		const pad = n.some(isPadded);
		let length = 0;
		for (let i = x; test(i, y) && N.length < max; i += incr) {
			let c;
			if (isAlphaSequence) {
				c = String.fromCharCode(i);
				if (c === "\\") c = "";
			} else {
				c = String(i);
				if (pad) {
					const need = width - c.length;
					if (need > 0) {
						const z = new Array(need + 1).join("0");
						if (i < 0) c = "-" + z + c.slice(1);
						else c = z + c;
					}
				}
			}
			if (length + c.length > maxLength) break;
			N.push(c);
			length += c.length;
		}
		return N;
	}
	function expand_(str, max, maxLength, isTop) {
		let acc = [""];
		let dropEmpties = false;
		let firstGroup = true;
		for (;;) {
			const m = (0, balanced_match_1.balanced)("{", "}", str);
			if (!m) return combine(acc, str, [""], max, maxLength, dropEmpties);
			const pre = m.pre;
			if (/\$$/.test(pre)) {
				acc = combine(acc, pre + "{" + m.body + "}", [""], max, maxLength, dropEmpties && !m.post.length);
				firstGroup = false;
				if (!m.post.length) break;
				str = m.post;
				continue;
			}
			const isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
			const isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
			const isSequence = isNumericSequence || isAlphaSequence;
			const isOptions = m.body.indexOf(",") >= 0;
			if (!isSequence && !isOptions) {
				if (m.post.match(/,(?!,).*\}/)) {
					str = m.pre + "{" + m.body + escClose + m.post;
					isTop = true;
					continue;
				}
				return combine(acc, pre + "{" + m.body + "}" + m.post, [""], max, maxLength, dropEmpties);
			}
			if (firstGroup) {
				dropEmpties = isTop && !isSequence;
				firstGroup = false;
			}
			let values;
			if (isSequence) values = expandSequence(m.body, isAlphaSequence, max, maxLength);
			else {
				let n = parseCommaParts(m.body);
				if (n.length === 1 && n[0] !== void 0) {
					n = expand_(n[0], max, maxLength, false).map(embrace);
					/* c8 ignore start */
					if (n.length === 1) {
						acc = combine(acc, pre + n[0], [""], max, maxLength, dropEmpties && !m.post.length);
						if (!m.post.length) break;
						str = m.post;
						continue;
					}
				}
				let dropsEmpties = dropEmpties && !m.post.length && !pre;
				for (let d = 0; dropsEmpties && d < acc.length; d++) if (acc[d]) dropsEmpties = false;
				values = [];
				let valuesLength = 0;
				outer: for (let j = 0; j < n.length; j++) {
					const expanded = expand_(n[j], max, maxLength, false);
					for (let k = 0; k < expanded.length; k++) {
						const v = expanded[k];
						if (dropsEmpties && !v) continue;
						if (values.length >= max || valuesLength + v.length > maxLength) break outer;
						values.push(v);
						valuesLength += v.length;
					}
				}
			}
			acc = combine(acc, pre, values, max, maxLength, dropEmpties && !m.post.length);
			if (!m.post.length) break;
			str = m.post;
		}
		return acc;
	}
}));
//#endregion
//#region ../../node_modules/.pnpm/minimatch@10.2.5/node_modules/minimatch/dist/commonjs/assert-valid-pattern.js
var require_assert_valid_pattern = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.assertValidPattern = void 0;
	const MAX_PATTERN_LENGTH = 65536;
	const assertValidPattern = (pattern) => {
		if (typeof pattern !== "string") throw new TypeError("invalid pattern");
		if (pattern.length > MAX_PATTERN_LENGTH) throw new TypeError("pattern is too long");
	};
	exports.assertValidPattern = assertValidPattern;
}));
//#endregion
//#region ../../node_modules/.pnpm/minimatch@10.2.5/node_modules/minimatch/dist/commonjs/brace-expressions.js
var require_brace_expressions = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.parseClass = void 0;
	const posixClasses = {
		"[:alnum:]": ["\\p{L}\\p{Nl}\\p{Nd}", true],
		"[:alpha:]": ["\\p{L}\\p{Nl}", true],
		"[:ascii:]": ["\\x00-\\x7f", false],
		"[:blank:]": ["\\p{Zs}\\t", true],
		"[:cntrl:]": ["\\p{Cc}", true],
		"[:digit:]": ["\\p{Nd}", true],
		"[:graph:]": [
			"\\p{Z}\\p{C}",
			true,
			true
		],
		"[:lower:]": ["\\p{Ll}", true],
		"[:print:]": ["\\p{C}", true],
		"[:punct:]": ["\\p{P}", true],
		"[:space:]": ["\\p{Z}\\t\\r\\n\\v\\f", true],
		"[:upper:]": ["\\p{Lu}", true],
		"[:word:]": ["\\p{L}\\p{Nl}\\p{Nd}\\p{Pc}", true],
		"[:xdigit:]": ["A-Fa-f0-9", false]
	};
	const braceEscape = (s) => s.replace(/[[\]\\-]/g, "\\$&");
	const regexpEscape = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	const rangesToString = (ranges) => ranges.join("");
	const parseClass = (glob, position) => {
		const pos = position;
		/* c8 ignore start */
		if (glob.charAt(pos) !== "[") throw new Error("not in a brace expression");
		/* c8 ignore stop */
		const ranges = [];
		const negs = [];
		let i = pos + 1;
		let sawStart = false;
		let uflag = false;
		let escaping = false;
		let negate = false;
		let endPos = pos;
		let rangeStart = "";
		WHILE: while (i < glob.length) {
			const c = glob.charAt(i);
			if ((c === "!" || c === "^") && i === pos + 1) {
				negate = true;
				i++;
				continue;
			}
			if (c === "]" && sawStart && !escaping) {
				endPos = i + 1;
				break;
			}
			sawStart = true;
			if (c === "\\") {
				if (!escaping) {
					escaping = true;
					i++;
					continue;
				}
			}
			if (c === "[" && !escaping) {
				for (const [cls, [unip, u, neg]] of Object.entries(posixClasses)) if (glob.startsWith(cls, i)) {
					if (rangeStart) return [
						"$.",
						false,
						glob.length - pos,
						true
					];
					i += cls.length;
					if (neg) negs.push(unip);
					else ranges.push(unip);
					uflag = uflag || u;
					continue WHILE;
				}
			}
			escaping = false;
			if (rangeStart) {
				if (c > rangeStart) ranges.push(braceEscape(rangeStart) + "-" + braceEscape(c));
				else if (c === rangeStart) ranges.push(braceEscape(c));
				rangeStart = "";
				i++;
				continue;
			}
			if (glob.startsWith("-]", i + 1)) {
				ranges.push(braceEscape(c + "-"));
				i += 2;
				continue;
			}
			if (glob.startsWith("-", i + 1)) {
				rangeStart = c;
				i += 2;
				continue;
			}
			ranges.push(braceEscape(c));
			i++;
		}
		if (endPos < i) return [
			"",
			false,
			0,
			false
		];
		if (!ranges.length && !negs.length) return [
			"$.",
			false,
			glob.length - pos,
			true
		];
		if (negs.length === 0 && ranges.length === 1 && /^\\?.$/.test(ranges[0]) && !negate) {
			const r = ranges[0].length === 2 ? ranges[0].slice(-1) : ranges[0];
			return [
				regexpEscape(r),
				false,
				endPos - pos,
				false
			];
		}
		const sranges = "[" + (negate ? "^" : "") + rangesToString(ranges) + "]";
		const snegs = "[" + (negate ? "" : "^") + rangesToString(negs) + "]";
		return [
			ranges.length && negs.length ? "(" + sranges + "|" + snegs + ")" : ranges.length ? sranges : snegs,
			uflag,
			endPos - pos,
			true
		];
	};
	exports.parseClass = parseClass;
}));
//#endregion
//#region ../../node_modules/.pnpm/minimatch@10.2.5/node_modules/minimatch/dist/commonjs/unescape.js
var require_unescape = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.unescape = void 0;
	/**
	* Un-escape a string that has been escaped with {@link escape}.
	*
	* If the {@link MinimatchOptions.windowsPathsNoEscape} option is used, then
	* square-bracket escapes are removed, but not backslash escapes.
	*
	* For example, it will turn the string `'[*]'` into `*`, but it will not
	* turn `'\\*'` into `'*'`, because `\` is a path separator in
	* `windowsPathsNoEscape` mode.
	*
	* When `windowsPathsNoEscape` is not set, then both square-bracket escapes and
	* backslash escapes are removed.
	*
	* Slashes (and backslashes in `windowsPathsNoEscape` mode) cannot be escaped
	* or unescaped.
	*
	* When `magicalBraces` is not set, escapes of braces (`{` and `}`) will not be
	* unescaped.
	*/
	const unescape = (s, { windowsPathsNoEscape = false, magicalBraces = true } = {}) => {
		if (magicalBraces) return windowsPathsNoEscape ? s.replace(/\[([^/\\])\]/g, "$1") : s.replace(/((?!\\).|^)\[([^/\\])\]/g, "$1$2").replace(/\\([^/])/g, "$1");
		return windowsPathsNoEscape ? s.replace(/\[([^/\\{}])\]/g, "$1") : s.replace(/((?!\\).|^)\[([^/\\{}])\]/g, "$1$2").replace(/\\([^/{}])/g, "$1");
	};
	exports.unescape = unescape;
}));
//#endregion
//#region ../../node_modules/.pnpm/minimatch@10.2.5/node_modules/minimatch/dist/commonjs/ast.js
var require_ast = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports) => {
	var _a;
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.AST = void 0;
	const brace_expressions_js_1 = require_brace_expressions();
	const unescape_js_1 = require_unescape();
	const types = /* @__PURE__ */ new Set([
		"!",
		"?",
		"+",
		"*",
		"@"
	]);
	const isExtglobType = (c) => types.has(c);
	const isExtglobAST = (c) => isExtglobType(c.type);
	const adoptionMap = /* @__PURE__ */ new Map([
		["!", ["@"]],
		["?", ["?", "@"]],
		["@", ["@"]],
		["*", [
			"*",
			"+",
			"?",
			"@"
		]],
		["+", ["+", "@"]]
	]);
	const adoptionWithSpaceMap = /* @__PURE__ */ new Map([
		["!", ["?"]],
		["@", ["?"]],
		["+", ["?", "*"]]
	]);
	const adoptionAnyMap = /* @__PURE__ */ new Map([
		["!", ["?", "@"]],
		["?", ["?", "@"]],
		["@", ["?", "@"]],
		["*", [
			"*",
			"+",
			"?",
			"@"
		]],
		["+", [
			"+",
			"@",
			"?",
			"*"
		]]
	]);
	const usurpMap = /* @__PURE__ */ new Map([
		["!", /* @__PURE__ */ new Map([["!", "@"]])],
		["?", /* @__PURE__ */ new Map([["*", "*"], ["+", "*"]])],
		["@", /* @__PURE__ */ new Map([
			["!", "!"],
			["?", "?"],
			["@", "@"],
			["*", "*"],
			["+", "+"]
		])],
		["+", /* @__PURE__ */ new Map([["?", "*"], ["*", "*"]])]
	]);
	const startNoTraversal = "(?!(?:^|/)\\.\\.?(?:$|/))";
	const startNoDot = "(?!\\.)";
	const addPatternStart = /* @__PURE__ */ new Set(["[", "."]);
	const justDots = /* @__PURE__ */ new Set(["..", "."]);
	const reSpecials = /* @__PURE__ */ new Set("().*{}+?[]^$\\!");
	const regExpEscape = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	const qmark = "[^/]";
	const star = "[^/]*?";
	const starNoEmpty = "[^/]+?";
	let ID = 0;
	var AST = class {
		type;
		#root;
		#hasMagic;
		#uflag = false;
		#parts = [];
		#parent;
		#parentIndex;
		#negs;
		#filledNegs = false;
		#options;
		#toString;
		#emptyExt = false;
		id = ++ID;
		get depth() {
			return (this.#parent?.depth ?? -1) + 1;
		}
		[Symbol.for("nodejs.util.inspect.custom")]() {
			return {
				"@@type": "AST",
				id: this.id,
				type: this.type,
				root: this.#root.id,
				parent: this.#parent?.id,
				depth: this.depth,
				partsLength: this.#parts.length,
				parts: this.#parts
			};
		}
		constructor(type, parent, options = {}) {
			this.type = type;
			if (type) this.#hasMagic = true;
			this.#parent = parent;
			this.#root = this.#parent ? this.#parent.#root : this;
			this.#options = this.#root === this ? options : this.#root.#options;
			this.#negs = this.#root === this ? [] : this.#root.#negs;
			if (type === "!" && !this.#root.#filledNegs) this.#negs.push(this);
			this.#parentIndex = this.#parent ? this.#parent.#parts.length : 0;
		}
		get hasMagic() {
			/* c8 ignore start */
			if (this.#hasMagic !== void 0) return this.#hasMagic;
			/* c8 ignore stop */
			for (const p of this.#parts) {
				if (typeof p === "string") continue;
				if (p.type || p.hasMagic) return this.#hasMagic = true;
			}
			return this.#hasMagic;
		}
		toString() {
			return this.#toString !== void 0 ? this.#toString : !this.type ? this.#toString = this.#parts.map((p) => String(p)).join("") : this.#toString = this.type + "(" + this.#parts.map((p) => String(p)).join("|") + ")";
		}
		#fillNegs() {
			/* c8 ignore start */
			if (this !== this.#root) throw new Error("should only call on root");
			if (this.#filledNegs) return this;
			/* c8 ignore stop */
			this.toString();
			this.#filledNegs = true;
			let n;
			while (n = this.#negs.pop()) {
				if (n.type !== "!") continue;
				let p = n;
				let pp = p.#parent;
				while (pp) {
					for (let i = p.#parentIndex + 1; !pp.type && i < pp.#parts.length; i++) for (const part of n.#parts) {
						/* c8 ignore start */
						if (typeof part === "string") throw new Error("string part in extglob AST??");
						/* c8 ignore stop */
						part.copyIn(pp.#parts[i]);
					}
					p = pp;
					pp = p.#parent;
				}
			}
			return this;
		}
		push(...parts) {
			for (const p of parts) {
				if (p === "") continue;
				/* c8 ignore start */
				if (typeof p !== "string" && !(p instanceof _a && p.#parent === this)) throw new Error("invalid part: " + p);
				/* c8 ignore stop */
				this.#parts.push(p);
			}
		}
		toJSON() {
			const ret = this.type === null ? this.#parts.slice().map((p) => typeof p === "string" ? p : p.toJSON()) : [this.type, ...this.#parts.map((p) => p.toJSON())];
			if (this.isStart() && !this.type) ret.unshift([]);
			if (this.isEnd() && (this === this.#root || this.#root.#filledNegs && this.#parent?.type === "!")) ret.push({});
			return ret;
		}
		isStart() {
			if (this.#root === this) return true;
			if (!this.#parent?.isStart()) return false;
			if (this.#parentIndex === 0) return true;
			const p = this.#parent;
			for (let i = 0; i < this.#parentIndex; i++) {
				const pp = p.#parts[i];
				if (!(pp instanceof _a && pp.type === "!")) return false;
			}
			return true;
		}
		isEnd() {
			if (this.#root === this) return true;
			if (this.#parent?.type === "!") return true;
			if (!this.#parent?.isEnd()) return false;
			if (!this.type) return this.#parent?.isEnd();
			/* c8 ignore start */
			const pl = this.#parent ? this.#parent.#parts.length : 0;
			/* c8 ignore stop */
			return this.#parentIndex === pl - 1;
		}
		copyIn(part) {
			if (typeof part === "string") this.push(part);
			else this.push(part.clone(this));
		}
		clone(parent) {
			const c = new _a(this.type, parent);
			for (const p of this.#parts) c.copyIn(p);
			return c;
		}
		static #parseAST(str, ast, pos, opt, extDepth) {
			const maxDepth = opt.maxExtglobRecursion ?? 2;
			let escaping = false;
			let inBrace = false;
			let braceStart = -1;
			let braceNeg = false;
			if (ast.type === null) {
				let i = pos;
				let acc = "";
				while (i < str.length) {
					const c = str.charAt(i++);
					if (escaping || c === "\\") {
						escaping = !escaping;
						acc += c;
						continue;
					}
					if (inBrace) {
						if (i === braceStart + 1) {
							if (c === "^" || c === "!") braceNeg = true;
						} else if (c === "]" && !(i === braceStart + 2 && braceNeg)) inBrace = false;
						acc += c;
						continue;
					} else if (c === "[") {
						inBrace = true;
						braceStart = i;
						braceNeg = false;
						acc += c;
						continue;
					}
					if (!opt.noext && isExtglobType(c) && str.charAt(i) === "(" && extDepth <= maxDepth) {
						ast.push(acc);
						acc = "";
						const ext = new _a(c, ast);
						i = _a.#parseAST(str, ext, i, opt, extDepth + 1);
						ast.push(ext);
						continue;
					}
					acc += c;
				}
				ast.push(acc);
				return i;
			}
			let i = pos + 1;
			let part = new _a(null, ast);
			const parts = [];
			let acc = "";
			while (i < str.length) {
				const c = str.charAt(i++);
				if (escaping || c === "\\") {
					escaping = !escaping;
					acc += c;
					continue;
				}
				if (inBrace) {
					if (i === braceStart + 1) {
						if (c === "^" || c === "!") braceNeg = true;
					} else if (c === "]" && !(i === braceStart + 2 && braceNeg)) inBrace = false;
					acc += c;
					continue;
				} else if (c === "[") {
					inBrace = true;
					braceStart = i;
					braceNeg = false;
					acc += c;
					continue;
				}
				/* c8 ignore stop */
				if (!opt.noext && isExtglobType(c) && str.charAt(i) === "(" && (extDepth <= maxDepth || ast && ast.#canAdoptType(c))) {
					const depthAdd = ast && ast.#canAdoptType(c) ? 0 : 1;
					part.push(acc);
					acc = "";
					const ext = new _a(c, part);
					part.push(ext);
					i = _a.#parseAST(str, ext, i, opt, extDepth + depthAdd);
					continue;
				}
				if (c === "|") {
					part.push(acc);
					acc = "";
					parts.push(part);
					part = new _a(null, ast);
					continue;
				}
				if (c === ")") {
					if (acc === "" && ast.#parts.length === 0) ast.#emptyExt = true;
					part.push(acc);
					acc = "";
					ast.push(...parts, part);
					return i;
				}
				acc += c;
			}
			ast.type = null;
			ast.#hasMagic = void 0;
			ast.#parts = [str.substring(pos - 1)];
			return i;
		}
		#canAdoptWithSpace(child) {
			return this.#canAdopt(child, adoptionWithSpaceMap);
		}
		#canAdopt(child, map = adoptionMap) {
			if (!child || typeof child !== "object" || child.type !== null || child.#parts.length !== 1 || this.type === null) return false;
			const gc = child.#parts[0];
			if (!gc || typeof gc !== "object" || gc.type === null) return false;
			return this.#canAdoptType(gc.type, map);
		}
		#canAdoptType(c, map = adoptionAnyMap) {
			return !!map.get(this.type)?.includes(c);
		}
		#adoptWithSpace(child, index) {
			const gc = child.#parts[0];
			const blank = new _a(null, gc, this.options);
			blank.#parts.push("");
			gc.push(blank);
			this.#adopt(child, index);
		}
		#adopt(child, index) {
			const gc = child.#parts[0];
			this.#parts.splice(index, 1, ...gc.#parts);
			for (const p of gc.#parts) if (typeof p === "object") p.#parent = this;
			this.#toString = void 0;
		}
		#canUsurpType(c) {
			return !!usurpMap.get(this.type)?.has(c);
		}
		#canUsurp(child) {
			if (!child || typeof child !== "object" || child.type !== null || child.#parts.length !== 1 || this.type === null || this.#parts.length !== 1) return false;
			const gc = child.#parts[0];
			if (!gc || typeof gc !== "object" || gc.type === null) return false;
			return this.#canUsurpType(gc.type);
		}
		#usurp(child) {
			const m = usurpMap.get(this.type);
			const gc = child.#parts[0];
			const nt = m?.get(gc.type);
			/* c8 ignore start - impossible */
			if (!nt) return false;
			/* c8 ignore stop */
			this.#parts = gc.#parts;
			for (const p of this.#parts) if (typeof p === "object") p.#parent = this;
			this.type = nt;
			this.#toString = void 0;
			this.#emptyExt = false;
		}
		static fromGlob(pattern, options = {}) {
			const ast = new _a(null, void 0, options);
			_a.#parseAST(pattern, ast, 0, options, 0);
			return ast;
		}
		toMMPattern() {
			/* c8 ignore start */
			if (this !== this.#root) return this.#root.toMMPattern();
			/* c8 ignore stop */
			const glob = this.toString();
			const [re, body, hasMagic, uflag] = this.toRegExpSource();
			if (!(hasMagic || this.#hasMagic || this.#options.nocase && !this.#options.nocaseMagicOnly && glob.toUpperCase() !== glob.toLowerCase())) return body;
			const flags = (this.#options.nocase ? "i" : "") + (uflag ? "u" : "");
			return Object.assign(new RegExp(`^${re}$`, flags), {
				_src: re,
				_glob: glob
			});
		}
		get options() {
			return this.#options;
		}
		toRegExpSource(allowDot) {
			const dot = allowDot ?? !!this.#options.dot;
			if (this.#root === this) {
				this.#flatten();
				this.#fillNegs();
			}
			if (!isExtglobAST(this)) {
				const noEmpty = this.isStart() && this.isEnd() && !this.#parts.some((s) => typeof s !== "string");
				const src = this.#parts.map((p) => {
					const [re, _, hasMagic, uflag] = typeof p === "string" ? _a.#parseGlob(p, this.#hasMagic, noEmpty) : p.toRegExpSource(allowDot);
					this.#hasMagic = this.#hasMagic || hasMagic;
					this.#uflag = this.#uflag || uflag;
					return re;
				}).join("");
				let start = "";
				if (this.isStart()) {
					if (typeof this.#parts[0] === "string") {
						if (!(this.#parts.length === 1 && justDots.has(this.#parts[0]))) {
							const aps = addPatternStart;
							const needNoTrav = dot && aps.has(src.charAt(0)) || src.startsWith("\\.") && aps.has(src.charAt(2)) || src.startsWith("\\.\\.") && aps.has(src.charAt(4));
							const needNoDot = !dot && !allowDot && aps.has(src.charAt(0));
							start = needNoTrav ? startNoTraversal : needNoDot ? startNoDot : "";
						}
					}
				}
				let end = "";
				if (this.isEnd() && this.#root.#filledNegs && this.#parent?.type === "!") end = "(?:$|\\/)";
				return [
					start + src + end,
					(0, unescape_js_1.unescape)(src),
					this.#hasMagic = !!this.#hasMagic,
					this.#uflag
				];
			}
			const repeated = this.type === "*" || this.type === "+";
			const start = this.type === "!" ? "(?:(?!(?:" : "(?:";
			let body = this.#partsToRegExp(dot);
			if (this.isStart() && this.isEnd() && !body && this.type !== "!") {
				const s = this.toString();
				const me = this;
				me.#parts = [s];
				me.type = null;
				me.#hasMagic = void 0;
				return [
					s,
					(0, unescape_js_1.unescape)(this.toString()),
					false,
					false
				];
			}
			let bodyDotAllowed = !repeated || allowDot || dot || false ? "" : this.#partsToRegExp(true);
			if (bodyDotAllowed === body) bodyDotAllowed = "";
			if (bodyDotAllowed) body = `(?:${body})(?:${bodyDotAllowed})*?`;
			let final = "";
			if (this.type === "!" && this.#emptyExt) final = (this.isStart() && !dot ? startNoDot : "") + starNoEmpty;
			else {
				const close = this.type === "!" ? "))" + (this.isStart() && !dot && !allowDot ? startNoDot : "") + "[^/]*?)" : this.type === "@" ? ")" : this.type === "?" ? ")?" : this.type === "+" && bodyDotAllowed ? ")" : this.type === "*" && bodyDotAllowed ? `)?` : `)${this.type}`;
				final = start + body + close;
			}
			return [
				final,
				(0, unescape_js_1.unescape)(body),
				this.#hasMagic = !!this.#hasMagic,
				this.#uflag
			];
		}
		#flatten() {
			if (!isExtglobAST(this)) {
				for (const p of this.#parts) if (typeof p === "object") p.#flatten();
			} else {
				let iterations = 0;
				let done = false;
				do {
					done = true;
					for (let i = 0; i < this.#parts.length; i++) {
						const c = this.#parts[i];
						if (typeof c === "object") {
							c.#flatten();
							if (this.#canAdopt(c)) {
								done = false;
								this.#adopt(c, i);
							} else if (this.#canAdoptWithSpace(c)) {
								done = false;
								this.#adoptWithSpace(c, i);
							} else if (this.#canUsurp(c)) {
								done = false;
								this.#usurp(c);
							}
						}
					}
				} while (!done && ++iterations < 10);
			}
			this.#toString = void 0;
		}
		#partsToRegExp(dot) {
			return this.#parts.map((p) => {
				/* c8 ignore start */
				if (typeof p === "string") throw new Error("string type in extglob ast??");
				/* c8 ignore stop */
				const [re, _, _hasMagic, uflag] = p.toRegExpSource(dot);
				this.#uflag = this.#uflag || uflag;
				return re;
			}).filter((p) => !(this.isStart() && this.isEnd()) || !!p).join("|");
		}
		static #parseGlob(glob, hasMagic, noEmpty = false) {
			let escaping = false;
			let re = "";
			let uflag = false;
			let inStar = false;
			for (let i = 0; i < glob.length; i++) {
				const c = glob.charAt(i);
				if (escaping) {
					escaping = false;
					re += (reSpecials.has(c) ? "\\" : "") + c;
					continue;
				}
				if (c === "*") {
					if (inStar) continue;
					inStar = true;
					re += noEmpty && /^[*]+$/.test(glob) ? starNoEmpty : star;
					hasMagic = true;
					continue;
				} else inStar = false;
				if (c === "\\") {
					if (i === glob.length - 1) re += "\\\\";
					else escaping = true;
					continue;
				}
				if (c === "[") {
					const [src, needUflag, consumed, magic] = (0, brace_expressions_js_1.parseClass)(glob, i);
					if (consumed) {
						re += src;
						uflag = uflag || needUflag;
						i += consumed - 1;
						hasMagic = hasMagic || magic;
						continue;
					}
				}
				if (c === "?") {
					re += qmark;
					hasMagic = true;
					continue;
				}
				re += regExpEscape(c);
			}
			return [
				re,
				(0, unescape_js_1.unescape)(glob),
				!!hasMagic,
				uflag
			];
		}
	};
	exports.AST = AST;
	_a = AST;
}));
//#endregion
//#region ../../node_modules/.pnpm/minimatch@10.2.5/node_modules/minimatch/dist/commonjs/escape.js
var require_escape = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.escape = void 0;
	/**
	* Escape all magic characters in a glob pattern.
	*
	* If the {@link MinimatchOptions.windowsPathsNoEscape}
	* option is used, then characters are escaped by wrapping in `[]`, because
	* a magic character wrapped in a character class can only be satisfied by
	* that exact character.  In this mode, `\` is _not_ escaped, because it is
	* not interpreted as a magic character, but instead as a path separator.
	*
	* If the {@link MinimatchOptions.magicalBraces} option is used,
	* then braces (`{` and `}`) will be escaped.
	*/
	const escape = (s, { windowsPathsNoEscape = false, magicalBraces = false } = {}) => {
		if (magicalBraces) return windowsPathsNoEscape ? s.replace(/[?*()[\]{}]/g, "[$&]") : s.replace(/[?*()[\]\\{}]/g, "\\$&");
		return windowsPathsNoEscape ? s.replace(/[?*()[\]]/g, "[$&]") : s.replace(/[?*()[\]\\]/g, "\\$&");
	};
	exports.escape = escape;
}));
//#endregion
//#region ../../node_modules/.pnpm/minimatch@10.2.5/node_modules/minimatch/dist/commonjs/index.js
var require_commonjs = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.unescape = exports.escape = exports.AST = exports.Minimatch = exports.match = exports.makeRe = exports.braceExpand = exports.defaults = exports.filter = exports.GLOBSTAR = exports.sep = exports.minimatch = void 0;
	const brace_expansion_1 = require_commonjs$1();
	const assert_valid_pattern_js_1 = require_assert_valid_pattern();
	const ast_js_1 = require_ast();
	const escape_js_1 = require_escape();
	const unescape_js_1 = require_unescape();
	const minimatch = (p, pattern, options = {}) => {
		(0, assert_valid_pattern_js_1.assertValidPattern)(pattern);
		if (!options.nocomment && pattern.charAt(0) === "#") return false;
		return new Minimatch(pattern, options).match(p);
	};
	exports.minimatch = minimatch;
	const starDotExtRE = /^\*+([^+@!?*[(]*)$/;
	const starDotExtTest = (ext) => (f) => !f.startsWith(".") && f.endsWith(ext);
	const starDotExtTestDot = (ext) => (f) => f.endsWith(ext);
	const starDotExtTestNocase = (ext) => {
		ext = ext.toLowerCase();
		return (f) => !f.startsWith(".") && f.toLowerCase().endsWith(ext);
	};
	const starDotExtTestNocaseDot = (ext) => {
		ext = ext.toLowerCase();
		return (f) => f.toLowerCase().endsWith(ext);
	};
	const starDotStarRE = /^\*+\.\*+$/;
	const starDotStarTest = (f) => !f.startsWith(".") && f.includes(".");
	const starDotStarTestDot = (f) => f !== "." && f !== ".." && f.includes(".");
	const dotStarRE = /^\.\*+$/;
	const dotStarTest = (f) => f !== "." && f !== ".." && f.startsWith(".");
	const starRE = /^\*+$/;
	const starTest = (f) => f.length !== 0 && !f.startsWith(".");
	const starTestDot = (f) => f.length !== 0 && f !== "." && f !== "..";
	const qmarksRE = /^\?+([^+@!?*[(]*)?$/;
	const qmarksTestNocase = ([$0, ext = ""]) => {
		const noext = qmarksTestNoExt([$0]);
		if (!ext) return noext;
		ext = ext.toLowerCase();
		return (f) => noext(f) && f.toLowerCase().endsWith(ext);
	};
	const qmarksTestNocaseDot = ([$0, ext = ""]) => {
		const noext = qmarksTestNoExtDot([$0]);
		if (!ext) return noext;
		ext = ext.toLowerCase();
		return (f) => noext(f) && f.toLowerCase().endsWith(ext);
	};
	const qmarksTestDot = ([$0, ext = ""]) => {
		const noext = qmarksTestNoExtDot([$0]);
		return !ext ? noext : (f) => noext(f) && f.endsWith(ext);
	};
	const qmarksTest = ([$0, ext = ""]) => {
		const noext = qmarksTestNoExt([$0]);
		return !ext ? noext : (f) => noext(f) && f.endsWith(ext);
	};
	const qmarksTestNoExt = ([$0]) => {
		const len = $0.length;
		return (f) => f.length === len && !f.startsWith(".");
	};
	const qmarksTestNoExtDot = ([$0]) => {
		const len = $0.length;
		return (f) => f.length === len && f !== "." && f !== "..";
	};
	/* c8 ignore start */
	const defaultPlatform = typeof process === "object" && process ? typeof process.env === "object" && process.env && process.env.__MINIMATCH_TESTING_PLATFORM__ || process.platform : "posix";
	const path = {
		win32: { sep: "\\" },
		posix: { sep: "/" }
	};
	/* c8 ignore stop */
	exports.sep = defaultPlatform === "win32" ? path.win32.sep : path.posix.sep;
	exports.minimatch.sep = exports.sep;
	exports.GLOBSTAR = Symbol("globstar **");
	exports.minimatch.GLOBSTAR = exports.GLOBSTAR;
	const star = "[^/]*?";
	const twoStarDot = "(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?";
	const twoStarNoDot = "(?:(?!(?:\\/|^)\\.).)*?";
	const filter = (pattern, options = {}) => (p) => (0, exports.minimatch)(p, pattern, options);
	exports.filter = filter;
	exports.minimatch.filter = exports.filter;
	const ext = (a, b = {}) => Object.assign({}, a, b);
	const defaults = (def) => {
		if (!def || typeof def !== "object" || !Object.keys(def).length) return exports.minimatch;
		const orig = exports.minimatch;
		const m = (p, pattern, options = {}) => orig(p, pattern, ext(def, options));
		return Object.assign(m, {
			Minimatch: class Minimatch extends orig.Minimatch {
				constructor(pattern, options = {}) {
					super(pattern, ext(def, options));
				}
				static defaults(options) {
					return orig.defaults(ext(def, options)).Minimatch;
				}
			},
			AST: class AST extends orig.AST {
				/* c8 ignore start */
				constructor(type, parent, options = {}) {
					super(type, parent, ext(def, options));
				}
				/* c8 ignore stop */
				static fromGlob(pattern, options = {}) {
					return orig.AST.fromGlob(pattern, ext(def, options));
				}
			},
			unescape: (s, options = {}) => orig.unescape(s, ext(def, options)),
			escape: (s, options = {}) => orig.escape(s, ext(def, options)),
			filter: (pattern, options = {}) => orig.filter(pattern, ext(def, options)),
			defaults: (options) => orig.defaults(ext(def, options)),
			makeRe: (pattern, options = {}) => orig.makeRe(pattern, ext(def, options)),
			braceExpand: (pattern, options = {}) => orig.braceExpand(pattern, ext(def, options)),
			match: (list, pattern, options = {}) => orig.match(list, pattern, ext(def, options)),
			sep: orig.sep,
			GLOBSTAR: exports.GLOBSTAR
		});
	};
	exports.defaults = defaults;
	exports.minimatch.defaults = exports.defaults;
	const braceExpand = (pattern, options = {}) => {
		(0, assert_valid_pattern_js_1.assertValidPattern)(pattern);
		if (options.nobrace || !/\{(?:(?!\{).)*\}/.test(pattern)) return [pattern];
		return (0, brace_expansion_1.expand)(pattern, { max: options.braceExpandMax });
	};
	exports.braceExpand = braceExpand;
	exports.minimatch.braceExpand = exports.braceExpand;
	const makeRe = (pattern, options = {}) => new Minimatch(pattern, options).makeRe();
	exports.makeRe = makeRe;
	exports.minimatch.makeRe = exports.makeRe;
	const match = (list, pattern, options = {}) => {
		const mm = new Minimatch(pattern, options);
		list = list.filter((f) => mm.match(f));
		if (mm.options.nonull && !list.length) list.push(pattern);
		return list;
	};
	exports.match = match;
	exports.minimatch.match = exports.match;
	const globMagic = /[?*]|[+@!]\(.*?\)|\[|\]/;
	const regExpEscape = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	var Minimatch = class {
		options;
		set;
		pattern;
		windowsPathsNoEscape;
		nonegate;
		negate;
		comment;
		empty;
		preserveMultipleSlashes;
		partial;
		globSet;
		globParts;
		nocase;
		isWindows;
		platform;
		windowsNoMagicRoot;
		maxGlobstarRecursion;
		regexp;
		constructor(pattern, options = {}) {
			(0, assert_valid_pattern_js_1.assertValidPattern)(pattern);
			options = options || {};
			this.options = options;
			this.maxGlobstarRecursion = options.maxGlobstarRecursion ?? 200;
			this.pattern = pattern;
			this.platform = options.platform || defaultPlatform;
			this.isWindows = this.platform === "win32";
			const awe = "allowWindowsEscape";
			this.windowsPathsNoEscape = !!options.windowsPathsNoEscape || options[awe] === false;
			if (this.windowsPathsNoEscape) this.pattern = this.pattern.replace(/\\/g, "/");
			this.preserveMultipleSlashes = !!options.preserveMultipleSlashes;
			this.regexp = null;
			this.negate = false;
			this.nonegate = !!options.nonegate;
			this.comment = false;
			this.empty = false;
			this.partial = !!options.partial;
			this.nocase = !!this.options.nocase;
			this.windowsNoMagicRoot = options.windowsNoMagicRoot !== void 0 ? options.windowsNoMagicRoot : !!(this.isWindows && this.nocase);
			this.globSet = [];
			this.globParts = [];
			this.set = [];
			this.make();
		}
		hasMagic() {
			if (this.options.magicalBraces && this.set.length > 1) return true;
			for (const pattern of this.set) for (const part of pattern) if (typeof part !== "string") return true;
			return false;
		}
		debug(..._) {}
		make() {
			const pattern = this.pattern;
			const options = this.options;
			if (!options.nocomment && pattern.charAt(0) === "#") {
				this.comment = true;
				return;
			}
			if (!pattern) {
				this.empty = true;
				return;
			}
			this.parseNegate();
			this.globSet = [...new Set(this.braceExpand())];
			if (options.debug) this.debug = (...args) => console.error(...args);
			this.debug(this.pattern, this.globSet);
			const rawGlobParts = this.globSet.map((s) => this.slashSplit(s));
			this.globParts = this.preprocess(rawGlobParts);
			this.debug(this.pattern, this.globParts);
			let set = this.globParts.map((s, _, __) => {
				if (this.isWindows && this.windowsNoMagicRoot) {
					const isUNC = s[0] === "" && s[1] === "" && (s[2] === "?" || !globMagic.test(s[2])) && !globMagic.test(s[3]);
					const isDrive = /^[a-z]:/i.test(s[0]);
					if (isUNC) return [...s.slice(0, 4), ...s.slice(4).map((ss) => this.parse(ss))];
					else if (isDrive) return [s[0], ...s.slice(1).map((ss) => this.parse(ss))];
				}
				return s.map((ss) => this.parse(ss));
			});
			this.debug(this.pattern, set);
			this.set = set.filter((s) => s.indexOf(false) === -1);
			if (this.isWindows) for (let i = 0; i < this.set.length; i++) {
				const p = this.set[i];
				if (p[0] === "" && p[1] === "" && this.globParts[i][2] === "?" && typeof p[3] === "string" && /^[a-z]:$/i.test(p[3])) p[2] = "?";
			}
			this.debug(this.pattern, this.set);
		}
		preprocess(globParts) {
			if (this.options.noglobstar) {
				for (const partset of globParts) for (let j = 0; j < partset.length; j++) if (partset[j] === "**") partset[j] = "*";
			}
			const { optimizationLevel = 1 } = this.options;
			if (optimizationLevel >= 2) {
				globParts = this.firstPhasePreProcess(globParts);
				globParts = this.secondPhasePreProcess(globParts);
			} else if (optimizationLevel >= 1) globParts = this.levelOneOptimize(globParts);
			else globParts = this.adjascentGlobstarOptimize(globParts);
			return globParts;
		}
		adjascentGlobstarOptimize(globParts) {
			return globParts.map((parts) => {
				let gs = -1;
				while (-1 !== (gs = parts.indexOf("**", gs + 1))) {
					let i = gs;
					while (parts[i + 1] === "**") i++;
					if (i !== gs) parts.splice(gs, i - gs);
				}
				return parts;
			});
		}
		levelOneOptimize(globParts) {
			return globParts.map((parts) => {
				parts = parts.reduce((set, part) => {
					const prev = set[set.length - 1];
					if (part === "**" && prev === "**") return set;
					if (part === "..") {
						if (prev && prev !== ".." && prev !== "." && prev !== "**") {
							set.pop();
							return set;
						}
					}
					set.push(part);
					return set;
				}, []);
				return parts.length === 0 ? [""] : parts;
			});
		}
		levelTwoFileOptimize(parts) {
			if (!Array.isArray(parts)) parts = this.slashSplit(parts);
			let didSomething = false;
			do {
				didSomething = false;
				if (!this.preserveMultipleSlashes) {
					for (let i = 1; i < parts.length - 1; i++) {
						const p = parts[i];
						if (i === 1 && p === "" && parts[0] === "") continue;
						if (p === "." || p === "") {
							didSomething = true;
							parts.splice(i, 1);
							i--;
						}
					}
					if (parts[0] === "." && parts.length === 2 && (parts[1] === "." || parts[1] === "")) {
						didSomething = true;
						parts.pop();
					}
				}
				let dd = 0;
				while (-1 !== (dd = parts.indexOf("..", dd + 1))) {
					const p = parts[dd - 1];
					if (p && p !== "." && p !== ".." && p !== "**" && !(this.isWindows && /^[a-z]:$/i.test(p))) {
						didSomething = true;
						parts.splice(dd - 1, 2);
						dd -= 2;
					}
				}
			} while (didSomething);
			return parts.length === 0 ? [""] : parts;
		}
		firstPhasePreProcess(globParts) {
			let didSomething = false;
			do {
				didSomething = false;
				for (let parts of globParts) {
					let gs = -1;
					while (-1 !== (gs = parts.indexOf("**", gs + 1))) {
						let gss = gs;
						while (parts[gss + 1] === "**") gss++;
						if (gss > gs) parts.splice(gs + 1, gss - gs);
						let next = parts[gs + 1];
						const p = parts[gs + 2];
						const p2 = parts[gs + 3];
						if (next !== "..") continue;
						if (!p || p === "." || p === ".." || !p2 || p2 === "." || p2 === "..") continue;
						didSomething = true;
						parts.splice(gs, 1);
						const other = parts.slice(0);
						other[gs] = "**";
						globParts.push(other);
						gs--;
					}
					if (!this.preserveMultipleSlashes) {
						for (let i = 1; i < parts.length - 1; i++) {
							const p = parts[i];
							if (i === 1 && p === "" && parts[0] === "") continue;
							if (p === "." || p === "") {
								didSomething = true;
								parts.splice(i, 1);
								i--;
							}
						}
						if (parts[0] === "." && parts.length === 2 && (parts[1] === "." || parts[1] === "")) {
							didSomething = true;
							parts.pop();
						}
					}
					let dd = 0;
					while (-1 !== (dd = parts.indexOf("..", dd + 1))) {
						const p = parts[dd - 1];
						if (p && p !== "." && p !== ".." && p !== "**") {
							didSomething = true;
							const splin = dd === 1 && parts[dd + 1] === "**" ? ["."] : [];
							parts.splice(dd - 1, 2, ...splin);
							if (parts.length === 0) parts.push("");
							dd -= 2;
						}
					}
				}
			} while (didSomething);
			return globParts;
		}
		secondPhasePreProcess(globParts) {
			for (let i = 0; i < globParts.length - 1; i++) for (let j = i + 1; j < globParts.length; j++) {
				const matched = this.partsMatch(globParts[i], globParts[j], !this.preserveMultipleSlashes);
				if (matched) {
					globParts[i] = [];
					globParts[j] = matched;
					break;
				}
			}
			return globParts.filter((gs) => gs.length);
		}
		partsMatch(a, b, emptyGSMatch = false) {
			let ai = 0;
			let bi = 0;
			let result = [];
			let which = "";
			while (ai < a.length && bi < b.length) if (a[ai] === b[bi]) {
				result.push(which === "b" ? b[bi] : a[ai]);
				ai++;
				bi++;
			} else if (emptyGSMatch && a[ai] === "**" && b[bi] === a[ai + 1]) {
				result.push(a[ai]);
				ai++;
			} else if (emptyGSMatch && b[bi] === "**" && a[ai] === b[bi + 1]) {
				result.push(b[bi]);
				bi++;
			} else if (a[ai] === "*" && b[bi] && (this.options.dot || !b[bi].startsWith(".")) && b[bi] !== "**") {
				if (which === "b") return false;
				which = "a";
				result.push(a[ai]);
				ai++;
				bi++;
			} else if (b[bi] === "*" && a[ai] && (this.options.dot || !a[ai].startsWith(".")) && a[ai] !== "**") {
				if (which === "a") return false;
				which = "b";
				result.push(b[bi]);
				ai++;
				bi++;
			} else return false;
			return a.length === b.length && result;
		}
		parseNegate() {
			if (this.nonegate) return;
			const pattern = this.pattern;
			let negate = false;
			let negateOffset = 0;
			for (let i = 0; i < pattern.length && pattern.charAt(i) === "!"; i++) {
				negate = !negate;
				negateOffset++;
			}
			if (negateOffset) this.pattern = pattern.slice(negateOffset);
			this.negate = negate;
		}
		matchOne(file, pattern, partial = false) {
			let fileStartIndex = 0;
			let patternStartIndex = 0;
			if (this.isWindows) {
				const fileDrive = typeof file[0] === "string" && /^[a-z]:$/i.test(file[0]);
				const fileUNC = !fileDrive && file[0] === "" && file[1] === "" && file[2] === "?" && /^[a-z]:$/i.test(file[3]);
				const patternDrive = typeof pattern[0] === "string" && /^[a-z]:$/i.test(pattern[0]);
				const patternUNC = !patternDrive && pattern[0] === "" && pattern[1] === "" && pattern[2] === "?" && typeof pattern[3] === "string" && /^[a-z]:$/i.test(pattern[3]);
				const fdi = fileUNC ? 3 : fileDrive ? 0 : void 0;
				const pdi = patternUNC ? 3 : patternDrive ? 0 : void 0;
				if (typeof fdi === "number" && typeof pdi === "number") {
					const [fd, pd] = [file[fdi], pattern[pdi]];
					if (fd.toLowerCase() === pd.toLowerCase()) {
						pattern[pdi] = fd;
						patternStartIndex = pdi;
						fileStartIndex = fdi;
					}
				}
			}
			const { optimizationLevel = 1 } = this.options;
			if (optimizationLevel >= 2) file = this.levelTwoFileOptimize(file);
			if (pattern.includes(exports.GLOBSTAR)) return this.#matchGlobstar(file, pattern, partial, fileStartIndex, patternStartIndex);
			return this.#matchOne(file, pattern, partial, fileStartIndex, patternStartIndex);
		}
		#matchGlobstar(file, pattern, partial, fileIndex, patternIndex) {
			const firstgs = pattern.indexOf(exports.GLOBSTAR, patternIndex);
			const lastgs = pattern.lastIndexOf(exports.GLOBSTAR);
			const [head, body, tail] = partial ? [
				pattern.slice(patternIndex, firstgs),
				pattern.slice(firstgs + 1),
				[]
			] : [
				pattern.slice(patternIndex, firstgs),
				pattern.slice(firstgs + 1, lastgs),
				pattern.slice(lastgs + 1)
			];
			if (head.length) {
				const fileHead = file.slice(fileIndex, fileIndex + head.length);
				if (!this.#matchOne(fileHead, head, partial, 0, 0)) return false;
				fileIndex += head.length;
				patternIndex += head.length;
			}
			let fileTailMatch = 0;
			if (tail.length) {
				if (tail.length + fileIndex > file.length) return false;
				let tailStart = file.length - tail.length;
				if (this.#matchOne(file, tail, partial, tailStart, 0)) fileTailMatch = tail.length;
				else {
					if (file[file.length - 1] !== "" || fileIndex + tail.length === file.length) return false;
					tailStart--;
					if (!this.#matchOne(file, tail, partial, tailStart, 0)) return false;
					fileTailMatch = tail.length + 1;
				}
			}
			if (!body.length) {
				let sawSome = !!fileTailMatch;
				for (let i = fileIndex; i < file.length - fileTailMatch; i++) {
					const f = String(file[i]);
					sawSome = true;
					if (f === "." || f === ".." || !this.options.dot && f.startsWith(".")) return false;
				}
				return partial || sawSome;
			}
			const bodySegments = [[[], 0]];
			let currentBody = bodySegments[0];
			let nonGsParts = 0;
			const nonGsPartsSums = [0];
			for (const b of body) if (b === exports.GLOBSTAR) {
				nonGsPartsSums.push(nonGsParts);
				currentBody = [[], 0];
				bodySegments.push(currentBody);
			} else {
				currentBody[0].push(b);
				nonGsParts++;
			}
			let i = bodySegments.length - 1;
			const fileLength = file.length - fileTailMatch;
			for (const b of bodySegments) b[1] = fileLength - (nonGsPartsSums[i--] + b[0].length);
			return !!this.#matchGlobStarBodySections(file, bodySegments, fileIndex, 0, partial, 0, !!fileTailMatch);
		}
		#matchGlobStarBodySections(file, bodySegments, fileIndex, bodyIndex, partial, globStarDepth, sawTail) {
			const bs = bodySegments[bodyIndex];
			if (!bs) {
				for (let i = fileIndex; i < file.length; i++) {
					sawTail = true;
					const f = file[i];
					if (f === "." || f === ".." || !this.options.dot && f.startsWith(".")) return false;
				}
				return sawTail;
			}
			const [body, after] = bs;
			while (fileIndex <= after) {
				if (this.#matchOne(file.slice(0, fileIndex + body.length), body, partial, fileIndex, 0) && globStarDepth < this.maxGlobstarRecursion) {
					const sub = this.#matchGlobStarBodySections(file, bodySegments, fileIndex + body.length, bodyIndex + 1, partial, globStarDepth + 1, sawTail);
					if (sub !== false) return sub;
				}
				const f = file[fileIndex];
				if (f === "." || f === ".." || !this.options.dot && f.startsWith(".")) return false;
				fileIndex++;
			}
			return partial || null;
		}
		#matchOne(file, pattern, partial, fileIndex, patternIndex) {
			let fi;
			let pi;
			let pl;
			let fl;
			for (fi = fileIndex, pi = patternIndex, fl = file.length, pl = pattern.length; fi < fl && pi < pl; fi++, pi++) {
				this.debug("matchOne loop");
				let p = pattern[pi];
				let f = file[fi];
				this.debug(pattern, p, f);
				/* c8 ignore start */
				if (p === false || p === exports.GLOBSTAR) return false;
				/* c8 ignore stop */
				let hit;
				if (typeof p === "string") {
					hit = f === p;
					this.debug("string match", p, f, hit);
				} else {
					hit = p.test(f);
					this.debug("pattern match", p, f, hit);
				}
				if (!hit) return false;
			}
			if (fi === fl && pi === pl) return true;
			else if (fi === fl) return partial;
			else if (pi === pl) return fi === fl - 1 && file[fi] === "";
			else throw new Error("wtf?");
			/* c8 ignore stop */
		}
		braceExpand() {
			return (0, exports.braceExpand)(this.pattern, this.options);
		}
		parse(pattern) {
			(0, assert_valid_pattern_js_1.assertValidPattern)(pattern);
			const options = this.options;
			if (pattern === "**") return exports.GLOBSTAR;
			if (pattern === "") return "";
			let m;
			let fastTest = null;
			if (m = pattern.match(starRE)) fastTest = options.dot ? starTestDot : starTest;
			else if (m = pattern.match(starDotExtRE)) fastTest = (options.nocase ? options.dot ? starDotExtTestNocaseDot : starDotExtTestNocase : options.dot ? starDotExtTestDot : starDotExtTest)(m[1]);
			else if (m = pattern.match(qmarksRE)) fastTest = (options.nocase ? options.dot ? qmarksTestNocaseDot : qmarksTestNocase : options.dot ? qmarksTestDot : qmarksTest)(m);
			else if (m = pattern.match(starDotStarRE)) fastTest = options.dot ? starDotStarTestDot : starDotStarTest;
			else if (m = pattern.match(dotStarRE)) fastTest = dotStarTest;
			const re = ast_js_1.AST.fromGlob(pattern, this.options).toMMPattern();
			if (fastTest && typeof re === "object") Reflect.defineProperty(re, "test", { value: fastTest });
			return re;
		}
		makeRe() {
			if (this.regexp || this.regexp === false) return this.regexp;
			const set = this.set;
			if (!set.length) {
				this.regexp = false;
				return this.regexp;
			}
			const options = this.options;
			const twoStar = options.noglobstar ? star : options.dot ? twoStarDot : twoStarNoDot;
			const flags = new Set(options.nocase ? ["i"] : []);
			let re = set.map((pattern) => {
				const pp = pattern.map((p) => {
					if (p instanceof RegExp) for (const f of p.flags.split("")) flags.add(f);
					return typeof p === "string" ? regExpEscape(p) : p === exports.GLOBSTAR ? exports.GLOBSTAR : p._src;
				});
				pp.forEach((p, i) => {
					const next = pp[i + 1];
					const prev = pp[i - 1];
					if (p !== exports.GLOBSTAR || prev === exports.GLOBSTAR) return;
					if (prev === void 0) {
						if (next !== void 0 && next !== exports.GLOBSTAR) pp[i + 1] = "(?:\\/|" + twoStar + "\\/)?" + next;
						else pp[i] = twoStar;
					} else if (next === void 0) pp[i - 1] = prev + "(?:\\/|\\/" + twoStar + ")?";
					else if (next !== exports.GLOBSTAR) {
						pp[i - 1] = prev + "(?:\\/|\\/" + twoStar + "\\/)" + next;
						pp[i + 1] = exports.GLOBSTAR;
					}
				});
				const filtered = pp.filter((p) => p !== exports.GLOBSTAR);
				if (this.partial && filtered.length >= 1) {
					const prefixes = [];
					for (let i = 1; i <= filtered.length; i++) prefixes.push(filtered.slice(0, i).join("/"));
					return "(?:" + prefixes.join("|") + ")";
				}
				return filtered.join("/");
			}).join("|");
			const [open, close] = set.length > 1 ? ["(?:", ")"] : ["", ""];
			re = "^" + open + re + close + "$";
			if (this.partial) re = "^(?:\\/|" + open + re.slice(1, -1) + close + ")$";
			if (this.negate) re = "^(?!" + re + ").+$";
			try {
				this.regexp = new RegExp(re, [...flags].join(""));
			} catch {
				this.regexp = false;
			}
			/* c8 ignore stop */
			return this.regexp;
		}
		slashSplit(p) {
			if (this.preserveMultipleSlashes) return p.split("/");
			else if (this.isWindows && /^\/\/[^/]+/.test(p)) return ["", ...p.split(/\/+/)];
			else return p.split(/\/+/);
		}
		match(f, partial = this.partial) {
			this.debug("match", f, this.pattern);
			if (this.comment) return false;
			if (this.empty) return f === "";
			if (f === "/" && partial) return true;
			const options = this.options;
			if (this.isWindows) f = f.split("\\").join("/");
			const ff = this.slashSplit(f);
			this.debug(this.pattern, "split", ff);
			const set = this.set;
			this.debug(this.pattern, "set", set);
			let filename = ff[ff.length - 1];
			if (!filename) for (let i = ff.length - 2; !filename && i >= 0; i--) filename = ff[i];
			for (const pattern of set) {
				let file = ff;
				if (options.matchBase && pattern.length === 1) file = [filename];
				if (this.matchOne(file, pattern, partial)) {
					if (options.flipNegate) return true;
					return !this.negate;
				}
			}
			if (options.flipNegate) return false;
			return this.negate;
		}
		static defaults(def) {
			return exports.minimatch.defaults(def).Minimatch;
		}
	};
	exports.Minimatch = Minimatch;
	/* c8 ignore start */
	var ast_js_2 = require_ast();
	Object.defineProperty(exports, "AST", {
		enumerable: true,
		get: function() {
			return ast_js_2.AST;
		}
	});
	var escape_js_2 = require_escape();
	Object.defineProperty(exports, "escape", {
		enumerable: true,
		get: function() {
			return escape_js_2.escape;
		}
	});
	var unescape_js_2 = require_unescape();
	Object.defineProperty(exports, "unescape", {
		enumerable: true,
		get: function() {
			return unescape_js_2.unescape;
		}
	});
	/* c8 ignore stop */
	exports.minimatch.AST = ast_js_1.AST;
	exports.minimatch.Minimatch = Minimatch;
	exports.minimatch.escape = escape_js_1.escape;
	exports.minimatch.unescape = unescape_js_1.unescape;
}));
//#endregion
Object.defineProperty(exports, "require_clean", {
	enumerable: true,
	get: function() {
		return require_clean;
	}
});
Object.defineProperty(exports, "require_commonjs", {
	enumerable: true,
	get: function() {
		return require_commonjs;
	}
});
Object.defineProperty(exports, "require_index_min", {
	enumerable: true,
	get: function() {
		return require_index_min;
	}
});
Object.defineProperty(exports, "require_index_min$1", {
	enumerable: true,
	get: function() {
		return require_index_min$1;
	}
});
Object.defineProperty(exports, "require_lib", {
	enumerable: true,
	get: function() {
		return require_lib;
	}
});
Object.defineProperty(exports, "require_lib$1", {
	enumerable: true,
	get: function() {
		return require_lib$1;
	}
});
Object.defineProperty(exports, "require_satisfies", {
	enumerable: true,
	get: function() {
		return require_satisfies;
	}
});
Object.defineProperty(exports, "require_semver", {
	enumerable: true,
	get: function() {
		return require_semver;
	}
});
Object.defineProperty(exports, "require_valid", {
	enumerable: true,
	get: function() {
		return require_valid;
	}
});
Object.defineProperty(exports, "require_valid$1", {
	enumerable: true,
	get: function() {
		return require_valid$1;
	}
});
