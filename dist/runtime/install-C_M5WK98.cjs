const require_rolldown_runtime = require("./rolldown-runtime-BGT596CS.cjs");
const require_messages = require("./messages-vUDkl1-0.cjs");
const require_commonjs$2 = require("./commonjs-AANzyd21.cjs");
const require_lease = require("./lease-HBD4CmBx.cjs");
const require_atomic = require("./atomic-C3shKdH9.cjs");
const require_home = require("./home-BaoZZSBy.cjs");
let node_child_process = require("node:child_process");
let node_path = require("node:path");
node_path = require_rolldown_runtime.__toESM(node_path, 1);
let node_fs = require("node:fs");
node_fs = require_rolldown_runtime.__toESM(node_fs, 1);
let node_crypto = require("node:crypto");
let node_stream = require("node:stream");
node_stream = require_rolldown_runtime.__toESM(node_stream, 1);
let node_stream_promises = require("node:stream/promises");
let node_zlib = require("node:zlib");
let events = require("events");
events = require_rolldown_runtime.__toESM(events, 1);
let fs = require("fs");
fs = require_rolldown_runtime.__toESM(fs, 1);
let node_events = require("node:events");
let node_string_decoder = require("node:string_decoder");
let path = require("path");
path = require_rolldown_runtime.__toESM(path, 1);
let assert = require("assert");
assert = require_rolldown_runtime.__toESM(assert, 1);
let buffer = require("buffer");
let zlib = require("zlib");
zlib = require_rolldown_runtime.__toESM(zlib, 1);
let node_assert = require("node:assert");
node_assert = require_rolldown_runtime.__toESM(node_assert, 1);
let node_fs_promises = require("node:fs/promises");
node_fs_promises = require_rolldown_runtime.__toESM(node_fs_promises, 1);
//#region src/own-npm.ts
var import_semver = /* @__PURE__ */ require_rolldown_runtime.__toESM(require_commonjs$2.require_semver(), 1);
/**
* Locates Node's own npm from the running binary (spec section 1).
* The lib dir, not the `bin/npm` link: under `--link` that link is the shim.
*/
function ownNpmRoot(execPath, platform = process.platform) {
	if (platform === "win32") return node_path.win32.join(node_path.win32.dirname(execPath), "node_modules", "npm");
	let real = execPath;
	try {
		real = (0, node_fs.realpathSync)(execPath);
	} catch {}
	return node_path.posix.join(node_path.posix.dirname(real), "..", "lib", "node_modules", "npm");
}
function findOwnNpm(execPath = process.execPath, platform = process.platform) {
	const root = ownNpmRoot(execPath, platform);
	const { join } = platform === "win32" ? node_path.win32 : node_path.posix;
	const manifest = join(root, "package.json");
	if (!(0, node_fs.existsSync)(manifest)) return null;
	let version;
	try {
		version = JSON.parse((0, node_fs.readFileSync)(manifest, "utf8")).version;
	} catch {
		return null;
	}
	if (typeof version !== "string") return null;
	return {
		root,
		version,
		cliPath: join(root, "bin", "npm-cli.js"),
		npxCliPath: join(root, "bin", "npx-cli.js")
	};
}
//#endregion
//#region src/spec.ts
var SpecError = class extends Error {
	name = "SpecError";
	field;
	/** The project's policy for this failure, when the entry declaring it could still be read. */
	onFail = "error";
	constructor(field, message) {
		super(message);
		this.field = field;
	}
};
const MAX_RANGE_LENGTH = 256;
const HASH_HEX_LENGTH = {
	sha512: 128,
	sha256: 64,
	sha224: 56
};
const ON_FAIL = /* @__PURE__ */ new Set([
	"ignore",
	"warn",
	"error",
	"download"
]);
/**
* Validates one version string before it reaches a transport argv or a message (spec RES-4).
* Build metadata other than a well-formed hash suffix is rejected: semver would silently drop it.
*/
function parseVersionSpec(raw, field) {
	if (raw.length > MAX_RANGE_LENGTH) throw new SpecError(field, `${field}: version is longer than ${MAX_RANGE_LENGTH} characters`);
	const plus = raw.indexOf("+");
	const range = (plus === -1 ? raw : raw.slice(0, plus)).trim();
	let hash = null;
	if (plus !== -1) hash = parseHash(raw.slice(plus + 1), field);
	if (import_semver.default.validRange(range) === null) throw new SpecError(field, `${field}: ${JSON.stringify(raw)} is not a semver range`);
	const exact = import_semver.default.valid(range);
	if (hash !== null && exact === null) throw new SpecError(field, `${field}: a hash needs an exact version, got ${JSON.stringify(raw)}`);
	return {
		range,
		exact,
		hash
	};
}
function parseHash(suffix, field) {
	const match = /^(sha512|sha256|sha224)\.([0-9a-fA-F]+)$/.exec(suffix);
	if (match === null) throw new SpecError(field, `${field}: unsupported hash suffix ${JSON.stringify(`+${suffix}`)}`);
	const algorithm = match[1];
	const hex = match[2].toLowerCase();
	if (hex.length !== HASH_HEX_LENGTH[algorithm]) throw new SpecError(field, `${field}: ${algorithm} hash must be ${HASH_HEX_LENGTH[algorithm]} hex characters`);
	return {
		algorithm,
		hex
	};
}
function isObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
/**
* Reads the npm requirements of a parsed `package.json` (spec RES-4).
* Returns null when the project declares nothing for npm, including when it declares only pnpm or yarn.
*/
function parseSpecs(pkg) {
	if (!isObject(pkg)) return null;
	const devEngines = pkg["devEngines"];
	if (isObject(devEngines) && devEngines["packageManager"] !== void 0) {
		const fromDevEngines = parseDevEngines(devEngines["packageManager"]);
		if (fromDevEngines !== null) return fromDevEngines;
	}
	const packageManager = pkg["packageManager"];
	if (typeof packageManager === "string" && packageManager.startsWith("npm@")) {
		const field = "packageManager";
		return {
			specs: [parseVersionSpec(packageManager.slice(4), field)],
			onFail: "error",
			field
		};
	}
	return null;
}
function parseDevEngines(value) {
	const field = "devEngines.packageManager";
	const entries = Array.isArray(value) ? value : [value];
	if (entries.length === 0) return null;
	const specs = [];
	const last = entries[entries.length - 1];
	const onFail = isObject(last) ? parseOnFail(last, field) : "error";
	try {
		for (const entry of entries) {
			if (!isObject(entry)) throw new SpecError(field, `${field}: every entry must be an object`);
			if (entry["name"] !== "npm") continue;
			const version = entry["version"];
			if (version === void 0) specs.push({
				range: "*",
				exact: null,
				hash: null
			});
			else if (typeof version === "string") specs.push(parseVersionSpec(version, field));
			else throw new SpecError(field, `${field}: version must be a string`);
		}
	} catch (error) {
		if (error instanceof SpecError) error.onFail = onFail;
		throw error;
	}
	if (specs.length === 0) return null;
	return {
		specs,
		onFail,
		field: "devEngines"
	};
}
function parseOnFail(entry, field) {
	const onFail = entry.onFail;
	if (onFail === void 0) return "error";
	if (typeof onFail !== "string" || !ON_FAIL.has(onFail)) throw new SpecError(field, `${field}: onFail must be ignore, warn, error or download`);
	return onFail;
}
/** Whether a concrete version satisfies the spec's range, hash aside (spec RES-5 and RES-6). */
function matchesRange(version, spec) {
	return import_semver.default.satisfies(version, spec.range);
}
//#endregion
//#region src/select.ts
function engineAccepts(candidate, nodeVersion) {
	return candidate.enginesNode === null || import_semver.default.satisfies(nodeVersion, candidate.enginesNode, { includePrerelease: true });
}
function hashAccepts(candidate, spec) {
	if (spec.hash === null) return candidate.keyid !== null;
	if (spec.hash.algorithm === "sha512") return sriHex(candidate.integrity) === spec.hash.hex;
	if (candidate.digests === void 0 || candidate.digests === null) return true;
	return candidate.digests[spec.hash.algorithm] === spec.hash.hex;
}
/** The hex digest of a `sha512-<base64>` SRI string, or null for any other form. */
function sriHex(integrity) {
	const match = /^sha512-([A-Za-z0-9+/=]+)$/.exec(integrity.trim());
	return match === null ? null : Buffer.from(match[1], "base64").toString("hex");
}
/** Whether Node's own npm satisfies a spec without a hash (spec RES-5). */
function ownNpmSatisfies(ownVersion, specs) {
	return specs.some((spec) => spec.hash === null && matchesRange(ownVersion, spec));
}
/**
* Picks the highest candidate matching any spec and the active Node (spec RES-6), cached first.
* Returns the reason when nothing fits, distinguishing an `engines.node` exclusion from no match at all.
*/
function selectCandidate(specs, candidates, nodeVersion) {
	let best = null;
	let excluded = null;
	for (const candidate of candidates) {
		const matching = specs.filter((entry) => matchesRange(candidate.version, entry) && hashAccepts(candidate, entry));
		if (matching.length === 0) continue;
		if (!engineAccepts(candidate, nodeVersion)) {
			if (excluded === null || import_semver.default.gt(candidate.version, excluded.version)) excluded = candidate;
			continue;
		}
		if (best === null || import_semver.default.gt(candidate.version, best.candidate.version)) best = {
			candidate,
			hashes: matching.some((entry) => entry.hash === null) ? [] : matching.flatMap((entry) => entry.hash === null ? [] : [entry.hash])
		};
	}
	if (best !== null) return {
		kind: "selected",
		selection: best
	};
	if (excluded !== null) return {
		kind: "failed",
		failure: {
			kind: "engine",
			version: excluded.version,
			enginesNode: excluded.enginesNode ?? "*"
		}
	};
	return {
		kind: "failed",
		failure: {
			kind: "nomatch",
			reason: "no published version matches"
		}
	};
}
//#endregion
//#region ../../node_modules/.pnpm/tar@7.5.22/node_modules/tar/dist/esm/index.min.js
var zr = Object.defineProperty;
var Ur = (s, t) => {
	for (var e in t) zr(s, e, {
		get: t[e],
		enumerable: !0
	});
};
var Ds = typeof process == "object" && process ? process : {
	stdout: null,
	stderr: null
};
var Wr = (s) => !!s && typeof s == "object" && (s instanceof A || s instanceof node_stream.default || Gr(s) || Zr(s));
var Gr = (s) => !!s && typeof s == "object" && s instanceof node_events.EventEmitter && typeof s.pipe == "function" && s.pipe !== node_stream.default.Writable.prototype.pipe;
var Zr = (s) => !!s && typeof s == "object" && s instanceof node_events.EventEmitter && typeof s.write == "function" && typeof s.end == "function";
var Q = Symbol("EOF");
var J = Symbol("maybeEmitEnd");
var nt = Symbol("emittedEnd");
var De = Symbol("emittingEnd");
var qt = Symbol("emittedError");
var Ne = Symbol("closed");
var Ns = Symbol("read");
var Ae = Symbol("flush");
var As = Symbol("flushChunk");
var z = Symbol("encoding");
var Mt = Symbol("decoder");
var g$1 = Symbol("flowing");
var Qt = Symbol("paused");
var Bt = Symbol("resume");
var b = Symbol("buffer");
var N = Symbol("pipes");
var _$1 = Symbol("bufferLength");
var bi = Symbol("bufferPush");
var Ie = Symbol("bufferShift");
var L = Symbol("objectMode");
var S = Symbol("destroyed");
var _i = Symbol("error");
var Oi = Symbol("emitData");
var Is = Symbol("emitEnd");
var Ti = Symbol("emitEnd2");
var Z = Symbol("async");
var xi = Symbol("abort");
var Ce = Symbol("aborted");
var Jt = Symbol("signal");
var Rt = Symbol("dataListeners");
var C = Symbol("discarded");
var jt = (s) => Promise.resolve().then(s);
var Yr = (s) => s();
var Kr = (s) => s === "end" || s === "finish" || s === "prefinish";
var Vr = (s) => s instanceof ArrayBuffer || !!s && typeof s == "object" && s.constructor && s.constructor.name === "ArrayBuffer" && s.byteLength >= 0;
var $r = (s) => !Buffer.isBuffer(s) && ArrayBuffer.isView(s);
var Fe = class {
	src;
	dest;
	opts;
	ondrain;
	constructor(t, e, i) {
		this.src = t, this.dest = e, this.opts = i, this.ondrain = () => t[Bt](), this.dest.on("drain", this.ondrain);
	}
	unpipe() {
		this.dest.removeListener("drain", this.ondrain);
	}
	proxyErrors(t) {}
	end() {
		this.unpipe(), this.opts.end && this.dest.end();
	}
};
var Li = class extends Fe {
	unpipe() {
		this.src.removeListener("error", this.proxyErrors), super.unpipe();
	}
	constructor(t, e, i) {
		super(t, e, i), this.proxyErrors = (r) => this.dest.emit("error", r), t.on("error", this.proxyErrors);
	}
};
var Xr = (s) => !!s.objectMode;
var qr = (s) => !s.objectMode && !!s.encoding && s.encoding !== "buffer";
var A = class extends node_events.EventEmitter {
	[g$1] = !1;
	[Qt] = !1;
	[N] = [];
	[b] = [];
	[L];
	[z];
	[Z];
	[Mt];
	[Q] = !1;
	[nt] = !1;
	[De] = !1;
	[Ne] = !1;
	[qt] = null;
	[_$1] = 0;
	[S] = !1;
	[Jt];
	[Ce] = !1;
	[Rt] = 0;
	[C] = !1;
	writable = !0;
	readable = !0;
	constructor(...t) {
		let e = t[0] || {};
		if (super(), e.objectMode && typeof e.encoding == "string") throw new TypeError("Encoding and objectMode may not be used together");
		Xr(e) ? (this[L] = !0, this[z] = null) : qr(e) ? (this[z] = e.encoding, this[L] = !1) : (this[L] = !1, this[z] = null), this[Z] = !!e.async, this[Mt] = this[z] ? new node_string_decoder.StringDecoder(this[z]) : null, e && e.debugExposeBuffer === !0 && Object.defineProperty(this, "buffer", { get: () => this[b] }), e && e.debugExposePipes === !0 && Object.defineProperty(this, "pipes", { get: () => this[N] });
		let { signal: i } = e;
		i && (this[Jt] = i, i.aborted ? this[xi]() : i.addEventListener("abort", () => this[xi]()));
	}
	get bufferLength() {
		return this[_$1];
	}
	get encoding() {
		return this[z];
	}
	set encoding(t) {
		throw new Error("Encoding must be set at instantiation time");
	}
	setEncoding(t) {
		throw new Error("Encoding must be set at instantiation time");
	}
	get objectMode() {
		return this[L];
	}
	set objectMode(t) {
		throw new Error("objectMode must be set at instantiation time");
	}
	get async() {
		return this[Z];
	}
	set async(t) {
		this[Z] = this[Z] || !!t;
	}
	[xi]() {
		this[Ce] = !0, this.emit("abort", this[Jt]?.reason), this.destroy(this[Jt]?.reason);
	}
	get aborted() {
		return this[Ce];
	}
	set aborted(t) {}
	write(t, e, i) {
		if (this[Ce]) return !1;
		if (this[Q]) throw new Error("write after end");
		if (this[S]) return this.emit("error", Object.assign(/* @__PURE__ */ new Error("Cannot call write after a stream was destroyed"), { code: "ERR_STREAM_DESTROYED" })), !0;
		typeof e == "function" && (i = e, e = "utf8"), e || (e = "utf8");
		let r = this[Z] ? jt : Yr;
		if (!this[L] && !Buffer.isBuffer(t)) {
			if ($r(t)) t = Buffer.from(t.buffer, t.byteOffset, t.byteLength);
			else if (Vr(t)) t = Buffer.from(t);
			else if (typeof t != "string") throw new Error("Non-contiguous data written to non-objectMode stream");
		}
		return this[L] ? (this[g$1] && this[_$1] !== 0 && this[Ae](!0), this[g$1] ? this.emit("data", t) : this[bi](t), this[_$1] !== 0 && this.emit("readable"), i && r(i), this[g$1]) : t.length ? (typeof t == "string" && (e !== this[z] || this[Mt]?.lastNeed) && (t = Buffer.from(t, e)), Buffer.isBuffer(t) && this[z] && (t = this[Mt].write(t)), this[g$1] && this[_$1] !== 0 && this[Ae](!0), this[g$1] ? this.emit("data", t) : this[bi](t), this[_$1] !== 0 && this.emit("readable"), i && r(i), this[g$1]) : (this[_$1] !== 0 && this.emit("readable"), i && r(i), this[g$1]);
	}
	read(t) {
		if (this[S]) return null;
		if (this[C] = !1, this[_$1] === 0 || t === 0 || t && t > this[_$1]) return this[J](), null;
		this[L] && (t = null), this[b].length > 1 && !this[L] && (this[b] = [this[z] ? this[b].join("") : Buffer.concat(this[b], this[_$1])]);
		let e = this[Ns](t || null, this[b][0]);
		return this[J](), e;
	}
	[Ns](t, e) {
		if (this[L]) this[Ie]();
		else {
			let i = e;
			t === i.length || t === null ? this[Ie]() : typeof i == "string" ? (this[b][0] = i.slice(t), e = i.slice(0, t), this[_$1] -= t) : (this[b][0] = i.subarray(t), e = i.subarray(0, t), this[_$1] -= t);
		}
		return this.emit("data", e), !this[b].length && !this[Q] && this.emit("drain"), e;
	}
	end(t, e, i) {
		return typeof t == "function" && (i = t, t = void 0), typeof e == "function" && (i = e, e = "utf8"), t !== void 0 && this.write(t, e), i && this.once("end", i), this[Q] = !0, this.writable = !1, (this[g$1] || !this[Qt]) && this[J](), this;
	}
	[Bt]() {
		this[S] || (!this[Rt] && !this[N].length && (this[C] = !0), this[Qt] = !1, this[g$1] = !0, this.emit("resume"), this[b].length ? this[Ae]() : this[Q] ? this[J]() : this.emit("drain"));
	}
	resume() {
		return this[Bt]();
	}
	pause() {
		this[g$1] = !1, this[Qt] = !0, this[C] = !1;
	}
	get destroyed() {
		return this[S];
	}
	get flowing() {
		return this[g$1];
	}
	get paused() {
		return this[Qt];
	}
	[bi](t) {
		this[L] ? this[_$1] += 1 : this[_$1] += t.length, this[b].push(t);
	}
	[Ie]() {
		return this[L] ? this[_$1] -= 1 : this[_$1] -= this[b][0].length, this[b].shift();
	}
	[Ae](t = !1) {
		do		;
while (this[As](this[Ie]()) && this[b].length);
		!t && !this[b].length && !this[Q] && this.emit("drain");
	}
	[As](t) {
		return this.emit("data", t), this[g$1];
	}
	pipe(t, e) {
		if (this[S]) return t;
		this[C] = !1;
		let i = this[nt];
		return e = e || {}, t === Ds.stdout || t === Ds.stderr ? e.end = !1 : e.end = e.end !== !1, e.proxyErrors = !!e.proxyErrors, i ? e.end && t.end() : (this[N].push(e.proxyErrors ? new Li(this, t, e) : new Fe(this, t, e)), this[Z] ? jt(() => this[Bt]()) : this[Bt]()), t;
	}
	unpipe(t) {
		let e = this[N].find((i) => i.dest === t);
		e && (this[N].length === 1 ? (this[g$1] && this[Rt] === 0 && (this[g$1] = !1), this[N] = []) : this[N].splice(this[N].indexOf(e), 1), e.unpipe());
	}
	addListener(t, e) {
		return this.on(t, e);
	}
	on(t, e) {
		let i = super.on(t, e);
		if (t === "data") this[C] = !1, this[Rt]++, !this[N].length && !this[g$1] && this[Bt]();
		else if (t === "readable" && this[_$1] !== 0) super.emit("readable");
		else if (Kr(t) && this[nt]) super.emit(t), this.removeAllListeners(t);
		else if (t === "error" && this[qt]) {
			let r = e;
			this[Z] ? jt(() => r.call(this, this[qt])) : r.call(this, this[qt]);
		}
		return i;
	}
	removeListener(t, e) {
		return this.off(t, e);
	}
	off(t, e) {
		let i = super.off(t, e);
		return t === "data" && (this[Rt] = this.listeners("data").length, this[Rt] === 0 && !this[C] && !this[N].length && (this[g$1] = !1)), i;
	}
	removeAllListeners(t) {
		let e = super.removeAllListeners(t);
		return (t === "data" || t === void 0) && (this[Rt] = 0, !this[C] && !this[N].length && (this[g$1] = !1)), e;
	}
	get emittedEnd() {
		return this[nt];
	}
	[J]() {
		!this[De] && !this[nt] && !this[S] && this[b].length === 0 && this[Q] && (this[De] = !0, this.emit("end"), this.emit("prefinish"), this.emit("finish"), this[Ne] && this.emit("close"), this[De] = !1);
	}
	emit(t, ...e) {
		let i = e[0];
		if (t !== "error" && t !== "close" && t !== S && this[S]) return !1;
		if (t === "data") return !this[L] && !i ? !1 : this[Z] ? (jt(() => this[Oi](i)), !0) : this[Oi](i);
		if (t === "end") return this[Is]();
		if (t === "close") {
			if (this[Ne] = !0, !this[nt] && !this[S]) return !1;
			let n = super.emit("close");
			return this.removeAllListeners("close"), n;
		} else if (t === "error") {
			this[qt] = i, super.emit(_i, i);
			let n = !this[Jt] || this.listeners("error").length ? super.emit("error", i) : !1;
			return this[J](), n;
		} else if (t === "resume") {
			let n = super.emit("resume");
			return this[J](), n;
		} else if (t === "finish" || t === "prefinish") {
			let n = super.emit(t);
			return this.removeAllListeners(t), n;
		}
		let r = super.emit(t, ...e);
		return this[J](), r;
	}
	[Oi](t) {
		for (let i of this[N]) i.dest.write(t) === !1 && this.pause();
		let e = this[C] ? !1 : super.emit("data", t);
		return this[J](), e;
	}
	[Is]() {
		return this[nt] ? !1 : (this[nt] = !0, this.readable = !1, this[Z] ? (jt(() => this[Ti]()), !0) : this[Ti]());
	}
	[Ti]() {
		if (this[Mt]) {
			let e = this[Mt].end();
			if (e) {
				for (let i of this[N]) i.dest.write(e);
				this[C] || super.emit("data", e);
			}
		}
		for (let e of this[N]) e.end();
		let t = super.emit("end");
		return this.removeAllListeners("end"), t;
	}
	async collect() {
		let t = Object.assign([], { dataLength: 0 });
		this[L] || (t.dataLength = 0);
		let e = this.promise();
		return this.on("data", (i) => {
			t.push(i), this[L] || (t.dataLength += i.length);
		}), await e, t;
	}
	async concat() {
		if (this[L]) throw new Error("cannot concat in objectMode");
		let t = await this.collect();
		return this[z] ? t.join("") : Buffer.concat(t, t.dataLength);
	}
	async promise() {
		return new Promise((t, e) => {
			this.on(S, () => e(/* @__PURE__ */ new Error("stream destroyed"))), this.on("error", (i) => e(i)), this.on("end", () => t());
		});
	}
	[Symbol.asyncIterator]() {
		this[C] = !1;
		let t = !1, e = async () => (this.pause(), t = !0, {
			value: void 0,
			done: !0
		});
		return {
			next: () => {
				if (t) return e();
				let r = this.read();
				if (r !== null) return Promise.resolve({
					done: !1,
					value: r
				});
				if (this[Q]) return e();
				let n, o, h = (d) => {
					this.off("data", a), this.off("end", l), this.off(S, c), e(), o(d);
				}, a = (d) => {
					this.off("error", h), this.off("end", l), this.off(S, c), this.pause(), n({
						value: d,
						done: !!this[Q]
					});
				}, l = () => {
					this.off("error", h), this.off("data", a), this.off(S, c), e(), n({
						done: !0,
						value: void 0
					});
				}, c = () => h(/* @__PURE__ */ new Error("stream destroyed"));
				return new Promise((d, y) => {
					o = y, n = d, this.once(S, c), this.once("error", h), this.once("end", l), this.once("data", a);
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
		this[C] = !1;
		let t = !1, e = () => (this.pause(), this.off(_i, e), this.off(S, e), this.off("end", e), t = !0, {
			done: !0,
			value: void 0
		}), i = () => {
			if (t) return e();
			let r = this.read();
			return r === null ? e() : {
				done: !1,
				value: r
			};
		};
		return this.once("end", e), this.once(_i, e), this.once(S, e), {
			next: i,
			throw: e,
			return: e,
			[Symbol.iterator]() {
				return this;
			},
			[Symbol.dispose]: () => {}
		};
	}
	destroy(t) {
		if (this[S]) return t ? this.emit("error", t) : this.emit(S), this;
		this[S] = !0, this[C] = !0, this[b].length = 0, this[_$1] = 0;
		let e = this;
		return typeof e.close == "function" && !this[Ne] && e.close(), t ? this.emit("error", t) : this.emit(S), this;
	}
	static get isStream() {
		return Wr;
	}
};
var Jr = fs.default.writev;
var ht = Symbol("_autoClose");
var H = Symbol("_close");
var te = Symbol("_ended");
var m = Symbol("_fd");
var Ni = Symbol("_finished");
var tt = Symbol("_flags");
var Ai = Symbol("_flush");
var ki = Symbol("_handleChunk");
var vi = Symbol("_makeBuf");
var ie = Symbol("_mode");
var ke = Symbol("_needDrain");
var Ut = Symbol("_onerror");
var Ht = Symbol("_onopen");
var Ii = Symbol("_onread");
var Pt = Symbol("_onwrite");
var at = Symbol("_open");
var U = Symbol("_path");
var ot = Symbol("_pos");
var Y = Symbol("_queue");
var zt = Symbol("_read");
var Ci = Symbol("_readSize");
var j = Symbol("_reading");
var ee = Symbol("_remain");
var Fi = Symbol("_size");
var ve = Symbol("_write");
var gt = Symbol("_writing");
var Me = Symbol("_defaultFlag");
var bt = Symbol("_errored");
var _t = class extends A {
	[bt] = !1;
	[m];
	[U];
	[Ci];
	[j] = !1;
	[Fi];
	[ee];
	[ht];
	constructor(t, e) {
		if (e = e || {}, super(e), this.readable = !0, this.writable = !1, typeof t != "string") throw new TypeError("path must be a string");
		this[bt] = !1, this[m] = typeof e.fd == "number" ? e.fd : void 0, this[U] = t, this[Ci] = e.readSize || 16777216, this[j] = !1, this[Fi] = typeof e.size == "number" ? e.size : 1 / 0, this[ee] = this[Fi], this[ht] = typeof e.autoClose == "boolean" ? e.autoClose : !0, typeof this[m] == "number" ? this[zt]() : this[at]();
	}
	get fd() {
		return this[m];
	}
	get path() {
		return this[U];
	}
	write() {
		throw new TypeError("this is a readable stream");
	}
	end() {
		throw new TypeError("this is a readable stream");
	}
	[at]() {
		fs.default.open(this[U], "r", (t, e) => this[Ht](t, e));
	}
	[Ht](t, e) {
		t ? this[Ut](t) : (this[m] = e, this.emit("open", e), this[zt]());
	}
	[vi]() {
		return Buffer.allocUnsafe(Math.min(this[Ci], this[ee]));
	}
	[zt]() {
		if (!this[j]) {
			this[j] = !0;
			let t = this[vi]();
			if (t.length === 0) return process.nextTick(() => this[Ii](null, 0, t));
			fs.default.read(this[m], t, 0, t.length, null, (e, i, r) => this[Ii](e, i, r));
		}
	}
	[Ii](t, e, i) {
		this[j] = !1, t ? this[Ut](t) : this[ki](e, i) && this[zt]();
	}
	[H]() {
		if (this[ht] && typeof this[m] == "number") {
			let t = this[m];
			this[m] = void 0, fs.default.close(t, (e) => e ? this.emit("error", e) : this.emit("close"));
		}
	}
	[Ut](t) {
		this[j] = !0, this[H](), this.emit("error", t);
	}
	[ki](t, e) {
		let i = !1;
		return this[ee] -= t, t > 0 && (i = super.write(t < e.length ? e.subarray(0, t) : e)), (t === 0 || this[ee] <= 0) && (i = !1, this[H](), super.end()), i;
	}
	emit(t, ...e) {
		switch (t) {
			case "prefinish":
			case "finish": return !1;
			case "drain": return typeof this[m] == "number" && this[zt](), !1;
			case "error": return this[bt] ? !1 : (this[bt] = !0, super.emit(t, ...e));
			default: return super.emit(t, ...e);
		}
	}
};
var Be = class extends _t {
	[at]() {
		let t = !0;
		try {
			this[Ht](null, fs.default.openSync(this[U], "r")), t = !1;
		} finally {
			t && this[H]();
		}
	}
	[zt]() {
		let t = !0;
		try {
			if (!this[j]) {
				this[j] = !0;
				do {
					let e = this[vi](), i = e.length === 0 ? 0 : fs.default.readSync(this[m], e, 0, e.length, null);
					if (!this[ki](i, e)) break;
				} while (!0);
				this[j] = !1;
			}
			t = !1;
		} finally {
			t && this[H]();
		}
	}
	[H]() {
		if (this[ht] && typeof this[m] == "number") {
			let t = this[m];
			this[m] = void 0, fs.default.closeSync(t), this.emit("close");
		}
	}
};
var et = class extends events.default {
	readable = !1;
	writable = !0;
	[bt] = !1;
	[gt] = !1;
	[te] = !1;
	[Y] = [];
	[ke] = !1;
	[U];
	[ie];
	[ht];
	[m];
	[Me];
	[tt];
	[Ni] = !1;
	[ot];
	constructor(t, e) {
		e = e || {}, super(e), this[U] = t, this[m] = typeof e.fd == "number" ? e.fd : void 0, this[ie] = e.mode === void 0 ? 438 : e.mode, this[ot] = typeof e.start == "number" ? e.start : void 0, this[ht] = typeof e.autoClose == "boolean" ? e.autoClose : !0;
		let i = this[ot] !== void 0 ? "r+" : "w";
		this[Me] = e.flags === void 0, this[tt] = e.flags === void 0 ? i : e.flags, this[m] === void 0 && this[at]();
	}
	emit(t, ...e) {
		if (t === "error") {
			if (this[bt]) return !1;
			this[bt] = !0;
		}
		return super.emit(t, ...e);
	}
	get fd() {
		return this[m];
	}
	get path() {
		return this[U];
	}
	[Ut](t) {
		this[H](), this[gt] = !0, this.emit("error", t);
	}
	[at]() {
		fs.default.open(this[U], this[tt], this[ie], (t, e) => this[Ht](t, e));
	}
	[Ht](t, e) {
		this[Me] && this[tt] === "r+" && t && t.code === "ENOENT" ? (this[tt] = "w", this[at]()) : t ? this[Ut](t) : (this[m] = e, this.emit("open", e), this[gt] || this[Ai]());
	}
	end(t, e) {
		return t && this.write(t, e), this[te] = !0, !this[gt] && !this[Y].length && typeof this[m] == "number" && this[Pt](null, 0), this;
	}
	write(t, e) {
		return typeof t == "string" && (t = Buffer.from(t, e)), this[te] ? (this.emit("error", /* @__PURE__ */ new Error("write() after end()")), !1) : this[m] === void 0 || this[gt] || this[Y].length ? (this[Y].push(t), this[ke] = !0, !1) : (this[gt] = !0, this[ve](t), !0);
	}
	[ve](t) {
		fs.default.write(this[m], t, 0, t.length, this[ot], (e, i) => this[Pt](e, i));
	}
	[Pt](t, e) {
		t ? this[Ut](t) : (this[ot] !== void 0 && typeof e == "number" && (this[ot] += e), this[Y].length ? this[Ai]() : (this[gt] = !1, this[te] && !this[Ni] ? (this[Ni] = !0, this[H](), this.emit("finish")) : this[ke] && (this[ke] = !1, this.emit("drain"))));
	}
	[Ai]() {
		if (this[Y].length === 0) this[te] && this[Pt](null, 0);
		else if (this[Y].length === 1) this[ve](this[Y].pop());
		else {
			let t = this[Y];
			this[Y] = [], Jr(this[m], t, this[ot], (e, i) => this[Pt](e, i));
		}
	}
	[H]() {
		if (this[ht] && typeof this[m] == "number") {
			let t = this[m];
			this[m] = void 0, fs.default.close(t, (e) => e ? this.emit("error", e) : this.emit("close"));
		}
	}
};
var Wt = class extends et {
	[at]() {
		let t;
		if (this[Me] && this[tt] === "r+") try {
			t = fs.default.openSync(this[U], this[tt], this[ie]);
		} catch (e) {
			if (e?.code === "ENOENT") return this[tt] = "w", this[at]();
			throw e;
		}
		else t = fs.default.openSync(this[U], this[tt], this[ie]);
		this[Ht](null, t);
	}
	[H]() {
		if (this[ht] && typeof this[m] == "number") {
			let t = this[m];
			this[m] = void 0, fs.default.closeSync(t), this.emit("close");
		}
	}
	[ve](t) {
		let e = !0;
		try {
			this[Pt](null, fs.default.writeSync(this[m], t, 0, t.length, this[ot])), e = !1;
		} finally {
			if (e) try {
				this[H]();
			} catch {}
		}
	}
};
var jr = /* @__PURE__ */ new Map([
	["C", "cwd"],
	["f", "file"],
	["z", "gzip"],
	["P", "preservePaths"],
	["U", "unlink"],
	["strip-components", "strip"],
	["stripComponents", "strip"],
	["keep-newer", "newer"],
	["keepNewer", "newer"],
	["keep-newer-files", "newer"],
	["keepNewerFiles", "newer"],
	["k", "keep"],
	["keep-existing", "keep"],
	["keepExisting", "keep"],
	["m", "noMtime"],
	["no-mtime", "noMtime"],
	["p", "preserveOwner"],
	["L", "follow"],
	["h", "follow"],
	["onentry", "onReadEntry"]
]);
var Fs = (s) => !!s.sync && !!s.file;
var ks = (s) => !s.sync && !!s.file;
var vs = (s) => !!s.sync && !s.file;
var Ms = (s) => !s.sync && !s.file;
var Bs = (s) => !!s.file;
var tn = (s) => {
	return jr.get(s) || s;
};
var se = (s = {}) => {
	if (!s) return {};
	let t = {};
	for (let [e, i] of Object.entries(s)) {
		let r = tn(e);
		t[r] = i;
	}
	return t.chmod === void 0 && t.noChmod === !1 && (t.chmod = !0), delete t.noChmod, t;
};
var K = (s, t, e, i, r) => Object.assign((n = [], o, h) => {
	Array.isArray(n) && (o = n, n = {}), typeof o == "function" && (h = o, o = void 0), o = o ? Array.from(o) : [];
	let a = se(n);
	if (r?.(a, o), Fs(a)) {
		if (typeof h == "function") throw new TypeError("callback not supported for sync tar functions");
		return s(a, o);
	} else if (ks(a)) {
		let l = t(a, o);
		return h ? l.then(() => h(), h) : l;
	} else if (vs(a)) {
		if (typeof h == "function") throw new TypeError("callback not supported for sync tar functions");
		return e(a, o);
	} else if (Ms(a)) {
		if (typeof h == "function") throw new TypeError("callback only supported with file option");
		return i(a, o);
	}
	throw new Error("impossible options??");
}, {
	syncFile: s,
	asyncFile: t,
	syncNoFile: e,
	asyncNoFile: i,
	validate: r
});
var sn = zlib.default.constants || { ZLIB_VERNUM: 4736 };
var M = Object.freeze(Object.assign(Object.create(null), {
	Z_NO_FLUSH: 0,
	Z_PARTIAL_FLUSH: 1,
	Z_SYNC_FLUSH: 2,
	Z_FULL_FLUSH: 3,
	Z_FINISH: 4,
	Z_BLOCK: 5,
	Z_OK: 0,
	Z_STREAM_END: 1,
	Z_NEED_DICT: 2,
	Z_ERRNO: -1,
	Z_STREAM_ERROR: -2,
	Z_DATA_ERROR: -3,
	Z_MEM_ERROR: -4,
	Z_BUF_ERROR: -5,
	Z_VERSION_ERROR: -6,
	Z_NO_COMPRESSION: 0,
	Z_BEST_SPEED: 1,
	Z_BEST_COMPRESSION: 9,
	Z_DEFAULT_COMPRESSION: -1,
	Z_FILTERED: 1,
	Z_HUFFMAN_ONLY: 2,
	Z_RLE: 3,
	Z_FIXED: 4,
	Z_DEFAULT_STRATEGY: 0,
	DEFLATE: 1,
	INFLATE: 2,
	GZIP: 3,
	GUNZIP: 4,
	DEFLATERAW: 5,
	INFLATERAW: 6,
	UNZIP: 7,
	BROTLI_DECODE: 8,
	BROTLI_ENCODE: 9,
	Z_MIN_WINDOWBITS: 8,
	Z_MAX_WINDOWBITS: 15,
	Z_DEFAULT_WINDOWBITS: 15,
	Z_MIN_CHUNK: 64,
	Z_MAX_CHUNK: 1 / 0,
	Z_DEFAULT_CHUNK: 16384,
	Z_MIN_MEMLEVEL: 1,
	Z_MAX_MEMLEVEL: 9,
	Z_DEFAULT_MEMLEVEL: 8,
	Z_MIN_LEVEL: -1,
	Z_MAX_LEVEL: 9,
	Z_DEFAULT_LEVEL: -1,
	BROTLI_OPERATION_PROCESS: 0,
	BROTLI_OPERATION_FLUSH: 1,
	BROTLI_OPERATION_FINISH: 2,
	BROTLI_OPERATION_EMIT_METADATA: 3,
	BROTLI_MODE_GENERIC: 0,
	BROTLI_MODE_TEXT: 1,
	BROTLI_MODE_FONT: 2,
	BROTLI_DEFAULT_MODE: 0,
	BROTLI_MIN_QUALITY: 0,
	BROTLI_MAX_QUALITY: 11,
	BROTLI_DEFAULT_QUALITY: 11,
	BROTLI_MIN_WINDOW_BITS: 10,
	BROTLI_MAX_WINDOW_BITS: 24,
	BROTLI_LARGE_MAX_WINDOW_BITS: 30,
	BROTLI_DEFAULT_WINDOW: 22,
	BROTLI_MIN_INPUT_BLOCK_BITS: 16,
	BROTLI_MAX_INPUT_BLOCK_BITS: 24,
	BROTLI_PARAM_MODE: 0,
	BROTLI_PARAM_QUALITY: 1,
	BROTLI_PARAM_LGWIN: 2,
	BROTLI_PARAM_LGBLOCK: 3,
	BROTLI_PARAM_DISABLE_LITERAL_CONTEXT_MODELING: 4,
	BROTLI_PARAM_SIZE_HINT: 5,
	BROTLI_PARAM_LARGE_WINDOW: 6,
	BROTLI_PARAM_NPOSTFIX: 7,
	BROTLI_PARAM_NDIRECT: 8,
	BROTLI_DECODER_RESULT_ERROR: 0,
	BROTLI_DECODER_RESULT_SUCCESS: 1,
	BROTLI_DECODER_RESULT_NEEDS_MORE_INPUT: 2,
	BROTLI_DECODER_RESULT_NEEDS_MORE_OUTPUT: 3,
	BROTLI_DECODER_PARAM_DISABLE_RING_BUFFER_REALLOCATION: 0,
	BROTLI_DECODER_PARAM_LARGE_WINDOW: 1,
	BROTLI_DECODER_NO_ERROR: 0,
	BROTLI_DECODER_SUCCESS: 1,
	BROTLI_DECODER_NEEDS_MORE_INPUT: 2,
	BROTLI_DECODER_NEEDS_MORE_OUTPUT: 3,
	BROTLI_DECODER_ERROR_FORMAT_EXUBERANT_NIBBLE: -1,
	BROTLI_DECODER_ERROR_FORMAT_RESERVED: -2,
	BROTLI_DECODER_ERROR_FORMAT_EXUBERANT_META_NIBBLE: -3,
	BROTLI_DECODER_ERROR_FORMAT_SIMPLE_HUFFMAN_ALPHABET: -4,
	BROTLI_DECODER_ERROR_FORMAT_SIMPLE_HUFFMAN_SAME: -5,
	BROTLI_DECODER_ERROR_FORMAT_CL_SPACE: -6,
	BROTLI_DECODER_ERROR_FORMAT_HUFFMAN_SPACE: -7,
	BROTLI_DECODER_ERROR_FORMAT_CONTEXT_MAP_REPEAT: -8,
	BROTLI_DECODER_ERROR_FORMAT_BLOCK_LENGTH_1: -9,
	BROTLI_DECODER_ERROR_FORMAT_BLOCK_LENGTH_2: -10,
	BROTLI_DECODER_ERROR_FORMAT_TRANSFORM: -11,
	BROTLI_DECODER_ERROR_FORMAT_DICTIONARY: -12,
	BROTLI_DECODER_ERROR_FORMAT_WINDOW_BITS: -13,
	BROTLI_DECODER_ERROR_FORMAT_PADDING_1: -14,
	BROTLI_DECODER_ERROR_FORMAT_PADDING_2: -15,
	BROTLI_DECODER_ERROR_FORMAT_DISTANCE: -16,
	BROTLI_DECODER_ERROR_DICTIONARY_NOT_SET: -19,
	BROTLI_DECODER_ERROR_INVALID_ARGUMENTS: -20,
	BROTLI_DECODER_ERROR_ALLOC_CONTEXT_MODES: -21,
	BROTLI_DECODER_ERROR_ALLOC_TREE_GROUPS: -22,
	BROTLI_DECODER_ERROR_ALLOC_CONTEXT_MAP: -25,
	BROTLI_DECODER_ERROR_ALLOC_RING_BUFFER_1: -26,
	BROTLI_DECODER_ERROR_ALLOC_RING_BUFFER_2: -27,
	BROTLI_DECODER_ERROR_ALLOC_BLOCK_TYPE_TREES: -30,
	BROTLI_DECODER_ERROR_UNREACHABLE: -31
}, sn));
var rn = buffer.Buffer.concat;
var zs = Object.getOwnPropertyDescriptor(buffer.Buffer, "concat");
var nn = (s) => s;
var Bi = zs?.writable === !0 || zs?.set !== void 0 ? (s) => {
	buffer.Buffer.concat = s ? nn : rn;
} : (s) => {};
var Tt = Symbol("_superWrite");
var Gt = class extends Error {
	code;
	errno;
	constructor(t, e) {
		super("zlib: " + t.message, { cause: t }), this.code = t.code, this.errno = t.errno, this.code || (this.code = "ZLIB_ERROR"), this.message = "zlib: " + t.message, Error.captureStackTrace(this, e ?? this.constructor);
	}
	get name() {
		return "ZlibError";
	}
};
var Pi = Symbol("flushFlag");
var re = class extends A {
	#t = !1;
	#i = !1;
	#s;
	#n;
	#r;
	#e;
	#o;
	get sawError() {
		return this.#t;
	}
	get handle() {
		return this.#e;
	}
	get flushFlag() {
		return this.#s;
	}
	constructor(t, e) {
		if (!t || typeof t != "object") throw new TypeError("invalid options for ZlibBase constructor");
		if (super(t), this.#s = t.flush ?? 0, this.#n = t.finishFlush ?? 0, this.#r = t.fullFlushFlag ?? 0, typeof zlib[e] != "function") throw new TypeError("Compression method not supported: " + e);
		try {
			this.#e = new zlib[e](t);
		} catch (i) {
			throw new Gt(i, this.constructor);
		}
		this.#o = (i) => {
			this.#t || (this.#t = !0, this.close(), this.emit("error", i));
		}, this.#e?.on("error", (i) => this.#o(new Gt(i))), this.once("end", () => this.close);
	}
	close() {
		this.#e && (this.#e.close(), this.#e = void 0, this.emit("close"));
	}
	reset() {
		if (!this.#t) return (0, assert.default)(this.#e, "zlib binding closed"), this.#e.reset?.();
	}
	flush(t) {
		this.ended || (typeof t != "number" && (t = this.#r), this.write(Object.assign(buffer.Buffer.alloc(0), { [Pi]: t })));
	}
	end(t, e, i) {
		return typeof t == "function" && (i = t, e = void 0, t = void 0), typeof e == "function" && (i = e, e = void 0), t && (e ? this.write(t, e) : this.write(t)), this.flush(this.#n), this.#i = !0, super.end(i);
	}
	get ended() {
		return this.#i;
	}
	[Tt](t) {
		return super.write(t);
	}
	write(t, e, i) {
		if (typeof e == "function" && (i = e, e = "utf8"), typeof t == "string" && (t = buffer.Buffer.from(t, e)), this.#t) return;
		(0, assert.default)(this.#e, "zlib binding closed");
		let r = this.#e._handle, n = r.close;
		r.close = () => {};
		let o = this.#e.close;
		this.#e.close = () => {}, Bi(!0);
		let h;
		try {
			let l = typeof t[Pi] == "number" ? t[Pi] : this.#s;
			h = this.#e._processChunk(t, l), Bi(!1);
		} catch (l) {
			Bi(!1), this.#o(new Gt(l, this.write));
		} finally {
			this.#e && (this.#e._handle = r, r.close = n, this.#e.close = o, this.#e.removeAllListeners("error"));
		}
		this.#e && this.#e.on("error", (l) => this.#o(new Gt(l, this.write)));
		let a;
		if (h) if (Array.isArray(h) && h.length > 0) {
			let l = h[0];
			a = this[Tt](buffer.Buffer.from(l));
			for (let c = 1; c < h.length; c++) a = this[Tt](h[c]);
		} else a = this[Tt](buffer.Buffer.from(h));
		return i && i(), a;
	}
};
var Pe = class extends re {
	#t;
	#i;
	constructor(t, e) {
		t = t || {}, t.flush = t.flush || M.Z_NO_FLUSH, t.finishFlush = t.finishFlush || M.Z_FINISH, t.fullFlushFlag = M.Z_FULL_FLUSH, super(t, e), this.#t = t.level, this.#i = t.strategy;
	}
	params(t, e) {
		if (!this.sawError) {
			if (!this.handle) throw new Error("cannot switch params when binding is closed");
			if (!this.handle.params) throw new Error("not supported in this implementation");
			if (this.#t !== t || this.#i !== e) {
				this.flush(M.Z_SYNC_FLUSH), (0, assert.default)(this.handle, "zlib binding closed");
				let i = this.handle.flush;
				this.handle.flush = (r, n) => {
					typeof r == "function" && (n = r, r = this.flushFlag), this.flush(r), n?.();
				};
				try {
					this.handle.params(t, e);
				} finally {
					this.handle.flush = i;
				}
				this.handle && (this.#t = t, this.#i = e);
			}
		}
	}
};
var ze = class extends Pe {
	#t;
	constructor(t) {
		super(t, "Gzip"), this.#t = t && !!t.portable;
	}
	[Tt](t) {
		return this.#t ? (this.#t = !1, t[9] = 255, super[Tt](t)) : super[Tt](t);
	}
};
var Ue = class extends Pe {
	constructor(t) {
		super(t, "Unzip");
	}
};
var He = class extends re {
	constructor(t, e) {
		t = t || {}, t.flush = t.flush || M.BROTLI_OPERATION_PROCESS, t.finishFlush = t.finishFlush || M.BROTLI_OPERATION_FINISH, t.fullFlushFlag = M.BROTLI_OPERATION_FLUSH, super(t, e);
	}
};
var We = class extends He {
	constructor(t) {
		super(t, "BrotliCompress");
	}
};
var Ge = class extends He {
	constructor(t) {
		super(t, "BrotliDecompress");
	}
};
var Ze = class extends re {
	constructor(t, e) {
		t = t || {}, t.flush = t.flush || M.ZSTD_e_continue, t.finishFlush = t.finishFlush || M.ZSTD_e_end, t.fullFlushFlag = M.ZSTD_e_flush, super(t, e);
	}
};
var Ye = class extends Ze {
	constructor(t) {
		super(t, "ZstdCompress");
	}
};
var Ke = class extends Ze {
	constructor(t) {
		super(t, "ZstdDecompress");
	}
};
var Us = (s, t) => {
	if (Number.isSafeInteger(s)) s < 0 ? an(s, t) : hn(s, t);
	else throw Error("cannot encode number outside of javascript safe integer range");
	return t;
};
var hn = (s, t) => {
	t[0] = 128;
	for (var e = t.length; e > 1; e--) t[e - 1] = s & 255, s = Math.floor(s / 256);
};
var an = (s, t) => {
	t[0] = 255;
	var e = !1;
	s = s * -1;
	for (var i = t.length; i > 1; i--) {
		var r = s & 255;
		s = Math.floor(s / 256), e ? t[i - 1] = Ws(r) : r === 0 ? t[i - 1] = 0 : (e = !0, t[i - 1] = Gs(r));
	}
};
var Hs = (s) => {
	let t = s[0], e = t === 128 ? cn(s.subarray(1, s.length)) : t === 255 ? ln(s) : null;
	if (e === null) throw Error("invalid base256 encoding");
	if (!Number.isSafeInteger(e)) throw Error("parsed number outside of javascript safe integer range");
	return e;
};
var ln = (s) => {
	for (var t = s.length, e = 0, i = !1, r = t - 1; r > -1; r--) {
		var n = Number(s[r]), o;
		i ? o = Ws(n) : n === 0 ? o = n : (i = !0, o = Gs(n)), o !== 0 && (e -= o * Math.pow(256, t - r - 1));
	}
	return e;
};
var cn = (s) => {
	for (var t = s.length, e = 0, i = t - 1; i > -1; i--) {
		var r = Number(s[i]);
		r !== 0 && (e += r * Math.pow(256, t - i - 1));
	}
	return e;
};
var Ws = (s) => (255 ^ s) & 255;
var Gs = (s) => (255 ^ s) + 1 & 255;
Ur({}, {
	code: () => Ve,
	isCode: () => ne,
	isName: () => dn,
	name: () => oe,
	normalFsTypes: () => Ui
});
var ne = (s) => oe.has(s);
var dn = (s) => Ve.has(s);
var Ui = /* @__PURE__ */ new Set([
	"0",
	"",
	"1",
	"2",
	"3",
	"4",
	"5",
	"6",
	"7",
	"D"
]);
var oe = /* @__PURE__ */ new Map([
	["0", "File"],
	["", "OldFile"],
	["1", "Link"],
	["2", "SymbolicLink"],
	["3", "CharacterDevice"],
	["4", "BlockDevice"],
	["5", "Directory"],
	["6", "FIFO"],
	["7", "ContiguousFile"],
	["g", "GlobalExtendedHeader"],
	["x", "ExtendedHeader"],
	["A", "SolarisACL"],
	["D", "GNUDumpDir"],
	["I", "Inode"],
	["K", "NextFileHasLongLinkpath"],
	["L", "NextFileHasLongPath"],
	["M", "ContinuationFile"],
	["N", "OldGnuLongPath"],
	["S", "SparseFile"],
	["V", "TapeVolumeHeader"],
	["X", "OldExtendedHeader"]
]);
var Ve = new Map(Array.from(oe).map((s) => [s[1], s[0]]));
var un = (s) => s === void 0 || s < 0 ? void 0 : s;
var F = class {
	cksumValid = !1;
	needPax = !1;
	nullBlock = !1;
	block;
	path;
	mode;
	uid;
	gid;
	size;
	cksum;
	#t = "Unsupported";
	linkpath;
	uname;
	gname;
	devmaj = 0;
	devmin = 0;
	atime;
	ctime;
	mtime;
	charset;
	comment;
	constructor(t, e = 0, i, r) {
		Buffer.isBuffer(t) ? this.decode(t, e || 0, i, r) : t && this.#i(t);
	}
	decode(t, e, i, r) {
		if (e || (e = 0), !t || !(t.length >= e + 512)) throw new Error("need 512 bytes for header");
		let n = xt(t, e + 156, 1), o = Ui.has(n), h = o ? i : void 0, a = o ? r : void 0;
		if (this.path = h?.path ?? xt(t, e, 100), this.mode = h?.mode ?? a?.mode ?? lt(t, e + 100, 8), this.uid = h?.uid ?? a?.uid ?? lt(t, e + 108, 8), this.gid = h?.gid ?? a?.gid ?? lt(t, e + 116, 8), this.size = un(h?.size ?? a?.size ?? lt(t, e + 124, 12)), this.mtime = h?.mtime ?? a?.mtime ?? Wi(t, e + 136, 12), this.cksum = lt(t, e + 148, 12), a && this.#i(a, !0), h && this.#i(h), ne(n) && (this.#t = n || "0"), this.#t === "0" && this.path.slice(-1) === "/" && (this.#t = "5"), this.#t === "5" && (this.size = 0), this.linkpath = xt(t, e + 157, 100), t.subarray(e + 257, e + 265).toString() === "ustar\x0000") if (this.uname = h?.uname ?? a?.uname ?? xt(t, e + 265, 32), this.gname = h?.gname ?? a?.gname ?? xt(t, e + 297, 32), this.devmaj = h?.devmaj ?? a?.devmaj ?? lt(t, e + 329, 8) ?? 0, this.devmin = h?.devmin ?? a?.devmin ?? lt(t, e + 337, 8) ?? 0, t[e + 475] !== 0) {
			let c = xt(t, e + 345, 155);
			this.path = c + "/" + this.path;
		} else {
			let c = xt(t, e + 345, 130);
			c && (this.path = c + "/" + this.path), this.atime = i?.atime ?? r?.atime ?? Wi(t, e + 476, 12), this.ctime = i?.ctime ?? r?.ctime ?? Wi(t, e + 488, 12);
		}
		let l = 256;
		for (let c = e; c < e + 148; c++) l += t[c];
		for (let c = e + 156; c < e + 512; c++) l += t[c];
		this.cksumValid = l === this.cksum, this.cksum === void 0 && l === 256 && (this.nullBlock = !0);
	}
	#i(t, e = !1) {
		Object.assign(this, Object.fromEntries(Object.entries(t).filter(([i, r]) => !(r == null || i === "size" && Number(r) < 0 || i === "path" && e || i === "linkpath" && e || i === "global"))));
	}
	encode(t, e = 0) {
		if (t || (t = this.block = Buffer.alloc(512)), this.#t === "Unsupported" && (this.#t = "0"), !(t.length >= e + 512)) throw new Error("need 512 bytes for header");
		let i = this.ctime || this.atime ? 130 : 155, r = mn(this.path || "", i), n = r[0], o = r[1];
		this.needPax = !!r[2], this.needPax = Lt(t, e, 100, n) || this.needPax, this.needPax = ct(t, e + 100, 8, this.mode) || this.needPax, this.needPax = ct(t, e + 108, 8, this.uid) || this.needPax, this.needPax = ct(t, e + 116, 8, this.gid) || this.needPax, this.needPax = ct(t, e + 124, 12, this.size) || this.needPax, this.needPax = Gi(t, e + 136, 12, this.mtime) || this.needPax, t[e + 156] = Number(this.#t.codePointAt(0)), this.needPax = Lt(t, e + 157, 100, this.linkpath) || this.needPax, t.write("ustar\x0000", e + 257, 8), this.needPax = Lt(t, e + 265, 32, this.uname) || this.needPax, this.needPax = Lt(t, e + 297, 32, this.gname) || this.needPax, this.needPax = ct(t, e + 329, 8, this.devmaj) || this.needPax, this.needPax = ct(t, e + 337, 8, this.devmin) || this.needPax, this.needPax = Lt(t, e + 345, i, o) || this.needPax, t[e + 475] !== 0 ? this.needPax = Lt(t, e + 345, 155, o) || this.needPax : (this.needPax = Lt(t, e + 345, 130, o) || this.needPax, this.needPax = Gi(t, e + 476, 12, this.atime) || this.needPax, this.needPax = Gi(t, e + 488, 12, this.ctime) || this.needPax);
		let h = 256;
		for (let a = e; a < e + 148; a++) h += t[a];
		for (let a = e + 156; a < e + 512; a++) h += t[a];
		return this.cksum = h, ct(t, e + 148, 8, this.cksum), this.cksumValid = !0, this.needPax;
	}
	get type() {
		return this.#t === "Unsupported" ? this.#t : oe.get(this.#t);
	}
	get typeKey() {
		return this.#t;
	}
	set type(t) {
		let e = String(Ve.get(t));
		if (ne(e) || e === "Unsupported") this.#t = e;
		else if (ne(t)) this.#t = t;
		else throw new TypeError("invalid entry type: " + t);
	}
};
var mn = (s, t) => {
	let i = s, r = "", n, o = node_path.posix.parse(s).root || ".";
	if (Buffer.byteLength(i) < 100) n = [
		i,
		r,
		!1
	];
	else {
		r = node_path.posix.dirname(i), i = node_path.posix.basename(i);
		do
			Buffer.byteLength(i) <= 100 && Buffer.byteLength(r) <= t ? n = [
				i,
				r,
				!1
			] : Buffer.byteLength(i) > 100 && Buffer.byteLength(r) <= t ? n = [
				i.slice(0, 99),
				r,
				!0
			] : (i = node_path.posix.join(node_path.posix.basename(r), i), r = node_path.posix.dirname(r));
		while (r !== o && n === void 0);
		n || (n = [
			s.slice(0, 99),
			"",
			!0
		]);
	}
	return n;
};
var xt = (s, t, e) => s.subarray(t, t + e).toString("utf8").replace(/\0.*/, "");
var Wi = (s, t, e) => pn(lt(s, t, e));
var pn = (s) => s === void 0 ? void 0 : /* @__PURE__ */ new Date(s * 1e3);
var lt = (s, t, e) => Number(s[t]) & 128 ? Hs(s.subarray(t, t + e)) : wn(s, t, e);
var En = (s) => isNaN(s) ? void 0 : s;
var wn = (s, t, e) => En(parseInt(s.subarray(t, t + e).toString("utf8").replace(/\0.*$/, "").trim(), 8));
var Sn = {
	12: 8589934591,
	8: 2097151
};
var ct = (s, t, e, i) => i === void 0 ? !1 : i > Sn[e] || i < 0 ? (Us(i, s.subarray(t, t + e)), !0) : (yn(s, t, e, i), !1);
var yn = (s, t, e, i) => s.write(Rn(i, e), t, e, "ascii");
var Rn = (s, t) => gn(Math.floor(s).toString(8), t);
var gn = (s, t) => (s.length === t - 1 ? s : new Array(t - s.length - 1).join("0") + s + " ") + "\0";
var Gi = (s, t, e, i) => i === void 0 ? !1 : ct(s, t, e, i.getTime() / 1e3);
var bn = new Array(156).join("\0");
var Lt = (s, t, e, i) => i === void 0 ? !1 : (s.write(i + bn, t, e, "utf8"), i.length !== Buffer.byteLength(i) || i.length > e);
var ft = class s {
	atime;
	mtime;
	ctime;
	charset;
	comment;
	gid;
	uid;
	gname;
	uname;
	linkpath;
	dev;
	ino;
	nlink;
	path;
	size;
	mode;
	global;
	constructor(t, e = !1) {
		this.atime = t.atime, this.charset = t.charset, this.comment = t.comment, this.ctime = t.ctime, this.dev = t.dev, this.gid = t.gid, this.global = e, this.gname = t.gname, this.ino = t.ino, this.linkpath = t.linkpath, this.mtime = t.mtime, this.nlink = t.nlink, this.path = t.path, this.size = t.size, this.uid = t.uid, this.uname = t.uname;
	}
	encode() {
		let t = this.encodeBody();
		if (t === "") return Buffer.allocUnsafe(0);
		let e = Buffer.byteLength(t), i = 512 * Math.ceil(1 + e / 512), r = Buffer.allocUnsafe(i);
		for (let n = 0; n < 512; n++) r[n] = 0;
		new F({
			path: ("PaxHeader/" + (0, node_path.basename)(this.path ?? "")).slice(0, 99),
			mode: this.mode || 420,
			uid: this.uid,
			gid: this.gid,
			size: e,
			mtime: this.mtime,
			type: this.global ? "GlobalExtendedHeader" : "ExtendedHeader",
			linkpath: "",
			uname: this.uname || "",
			gname: this.gname || "",
			devmaj: 0,
			devmin: 0,
			atime: this.atime,
			ctime: this.ctime
		}).encode(r), r.write(t, 512, e, "utf8");
		for (let n = e + 512; n < r.length; n++) r[n] = 0;
		return r;
	}
	encodeBody() {
		return this.encodeField("path") + this.encodeField("ctime") + this.encodeField("atime") + this.encodeField("dev") + this.encodeField("ino") + this.encodeField("nlink") + this.encodeField("charset") + this.encodeField("comment") + this.encodeField("gid") + this.encodeField("gname") + this.encodeField("linkpath") + this.encodeField("mtime") + this.encodeField("size") + this.encodeField("uid") + this.encodeField("uname");
	}
	encodeField(t) {
		if (this[t] === void 0) return "";
		let e = this[t], i = e instanceof Date ? e.getTime() / 1e3 : e, r = " " + (t === "dev" || t === "ino" || t === "nlink" ? "SCHILY." : "") + t + "=" + i + `
`, n = Buffer.byteLength(r), o = Math.floor(Math.log(n) / Math.log(10)) + 1;
		return n + o >= Math.pow(10, o) && (o += 1), o + n + r;
	}
	static parse(t, e, i = !1) {
		return new s(On(Tn(t), e), i);
	}
};
var On = (s, t) => t ? Object.assign({}, t, s) : s;
var Tn = (s) => s.replace(/\n$/, "").split(`
`).reduce(xn, Object.create(null));
var xn = (s, t) => {
	let e = parseInt(t, 10);
	if (e !== Buffer.byteLength(t) + 1) return s;
	t = t.slice((e + " ").length);
	let i = t.split("="), r = i.shift();
	if (!r) return s;
	let n = r.replace(/^SCHILY\.(dev|ino|nlink)/, "$1"), o = i.join("=").replace(/\0.*/, "");
	switch (n) {
		case "path":
		case "linkpath":
		case "type":
		case "charset":
		case "comment":
		case "gname":
		case "uname":
			s[n] = o;
			break;
		case "ctime":
		case "atime":
		case "mtime":
			s[n] = /* @__PURE__ */ new Date(Number(o) * 1e3);
			break;
		case "size":
			let h = +o;
			h >= 0 && (s[n] = h);
			break;
		case "gid":
		case "uid":
		case "dev":
		case "ino":
		case "nlink":
		case "mode": s[n] = +o;
	}
	return s;
};
var f = (process.env.TESTING_TAR_FAKE_PLATFORM || process.platform) !== "win32" ? (s) => String(s) : (s) => String(s).replaceAll(/\\/g, "/");
var $e = class extends A {
	extended;
	globalExtended;
	header;
	startBlockSize;
	blockRemain;
	remain;
	type;
	meta = !1;
	ignore = !1;
	path;
	mode;
	uid;
	gid;
	uname;
	gname;
	size = 0;
	mtime;
	atime;
	ctime;
	linkpath;
	dev;
	ino;
	nlink;
	invalid = !1;
	absolute;
	unsupported = !1;
	constructor(t, e, i) {
		switch (super({}), this.pause(), this.extended = e, this.globalExtended = i, this.header = t, this.remain = t.size ?? 0, this.startBlockSize = 512 * Math.ceil(this.remain / 512), this.blockRemain = this.startBlockSize, this.type = t.type, this.type) {
			case "File":
			case "OldFile":
			case "Link":
			case "SymbolicLink":
			case "CharacterDevice":
			case "BlockDevice":
			case "Directory":
			case "FIFO":
			case "ContiguousFile":
			case "GNUDumpDir": break;
			case "NextFileHasLongLinkpath":
			case "NextFileHasLongPath":
			case "OldGnuLongPath":
			case "GlobalExtendedHeader":
			case "ExtendedHeader":
			case "OldExtendedHeader":
				this.meta = !0;
				break;
			default: this.ignore = !0;
		}
		if (!t.path) throw new Error("no path provided for tar.ReadEntry");
		this.path = f(t.path), this.mode = t.mode, this.mode && (this.mode = this.mode & 4095), this.uid = t.uid, this.gid = t.gid, this.uname = t.uname, this.gname = t.gname, this.size = this.remain, this.mtime = t.mtime, this.atime = t.atime, this.ctime = t.ctime, this.linkpath = t.linkpath ? f(t.linkpath) : void 0, this.uname = t.uname, this.gname = t.gname, e && this.#t(e), i && this.#t(i, !0);
	}
	write(t) {
		let e = t.length;
		if (e > this.blockRemain) throw new Error("writing more to entry than is appropriate");
		let i = this.remain, r = this.blockRemain;
		return this.remain = Math.max(0, i - e), this.blockRemain = Math.max(0, r - e), this.ignore ? !0 : i >= e ? super.write(t) : super.write(t.subarray(0, i));
	}
	#t(t, e = !1) {
		t.path && (t.path = f(t.path)), t.linkpath && (t.linkpath = f(t.linkpath)), Object.assign(this, Object.fromEntries(Object.entries(t).filter(([i, r]) => !(r == null || i === "path" && e))));
	}
};
var Dt = (s, t, e, i = {}) => {
	s.file && (i.file = s.file), s.cwd && (i.cwd = s.cwd), i.code = e instanceof Error && e.code || t, i.tarCode = t, !s.strict && i.recoverable !== !1 ? (e instanceof Error && (i = Object.assign(e, i), e = e.message), s.emit("warn", t, e, i)) : e instanceof Error ? s.emit("error", Object.assign(e, i)) : s.emit("error", Object.assign(/* @__PURE__ */ new Error(`${t}: ${e}`), i));
};
var Nn = 1048576;
var Xi = Buffer.from([31, 139]);
var qi = Buffer.from([
	40,
	181,
	47,
	253
]);
var An = Math.max(Xi.length, qi.length);
var B = Symbol("state");
var Nt = Symbol("writeEntry");
var it = Symbol("readEntry");
var Zi = Symbol("nextEntry");
var Zs = Symbol("processEntry");
var V = Symbol("extendedHeader");
var he = Symbol("globalExtendedHeader");
var dt = Symbol("meta");
var Ys = Symbol("emitMeta");
var p = Symbol("buffer");
var st = Symbol("queue");
var ut = Symbol("ended");
var Yi = Symbol("emittedEnd");
var At = Symbol("emit");
var w = Symbol("unzip");
var Xe = Symbol("consumeChunk");
var qe = Symbol("consumeChunkSub");
var Ki = Symbol("consumeBody");
var Ks = Symbol("consumeMeta");
var Vs = Symbol("consumeHeader");
var ae = Symbol("consuming");
var Vi = Symbol("bufferConcat");
var Qe = Symbol("maybeEnd");
var Yt = Symbol("writing");
var $ = Symbol("aborted");
var Je = Symbol("onDone");
var It = Symbol("sawValidEntry");
var je = Symbol("sawNullBlock");
var ti = Symbol("sawEOF");
var $s = Symbol("closeStream");
var In = 1e3;
var le = Symbol("compressedBytesRead");
var $i = Symbol("decompressedBytesRead");
var Xs = Symbol("checkDecompressionRatio");
var Cn = () => !0;
var rt = class extends events.EventEmitter {
	file;
	strict;
	maxMetaEntrySize;
	filter;
	brotli;
	zstd;
	maxDecompressionRatio;
	writable = !0;
	readable = !1;
	[st] = [];
	[p];
	[it];
	[Nt];
	[B] = "begin";
	[dt] = "";
	[V];
	[he];
	[ut] = !1;
	[w];
	[$] = !1;
	[It];
	[je] = !1;
	[ti] = !1;
	[Yt] = !1;
	[ae] = !1;
	[Yi] = !1;
	[le] = 0;
	[$i] = 0;
	constructor(t = {}) {
		super(), this.file = t.file || "", this.on(Je, () => {
			(this[B] === "begin" || this[It] === !1) && this.warn("TAR_BAD_ARCHIVE", "Unrecognized archive format");
		}), t.ondone ? this.on(Je, t.ondone) : this.on(Je, () => {
			this.emit("prefinish"), this.emit("finish"), this.emit("end");
		}), this.strict = !!t.strict, this.maxDecompressionRatio = typeof t.maxDecompressionRatio == "number" ? t.maxDecompressionRatio : In, this.maxMetaEntrySize = t.maxMetaEntrySize || Nn, this.filter = typeof t.filter == "function" ? t.filter : Cn;
		let e = t.file && (t.file.endsWith(".tar.br") || t.file.endsWith(".tbr"));
		this.brotli = !(t.gzip || t.zstd) && t.brotli !== void 0 ? t.brotli : e ? void 0 : !1;
		let i = t.file && (t.file.endsWith(".tar.zst") || t.file.endsWith(".tzst"));
		this.zstd = !(t.gzip || t.brotli) && t.zstd !== void 0 ? t.zstd : i ? !0 : void 0, this.on("end", () => this[$s]()), typeof t.onwarn == "function" && this.on("warn", t.onwarn), typeof t.onReadEntry == "function" && this.on("entry", t.onReadEntry);
	}
	warn(t, e, i = {}) {
		Dt(this, t, e, i);
	}
	[Vs](t, e) {
		this[It] === void 0 && (this[It] = !1);
		let i;
		try {
			i = new F(t, e, this[V], this[he]);
		} catch (r) {
			return this.warn("TAR_ENTRY_INVALID", r);
		}
		if (i.nullBlock) this[je] ? (this[ti] = !0, this[B] === "begin" && (this[B] = "header"), this[At]("eof")) : (this[je] = !0, this[At]("nullBlock"));
		else if (this[je] = !1, !i.cksumValid) this.warn("TAR_ENTRY_INVALID", "checksum failure", { header: i });
		else if (!i.path) this.warn("TAR_ENTRY_INVALID", "path is required", { header: i });
		else {
			let r = i.type;
			if (/^(Symbolic)?Link$/.test(r) && !i.linkpath) this.warn("TAR_ENTRY_INVALID", "linkpath required", { header: i });
			else if (!/^(Symbolic)?Link$/.test(r) && !/^(Global)?ExtendedHeader$/.test(r) && i.linkpath) this.warn("TAR_ENTRY_INVALID", "linkpath forbidden", { header: i });
			else {
				let n = this[Nt] = new $e(i, this[V], this[he]);
				if (!this[It]) if (n.remain) {
					let o = () => {
						n.invalid || (this[It] = !0);
					};
					n.on("end", o);
				} else this[It] = !0;
				n.meta ? n.size > this.maxMetaEntrySize ? (n.ignore = !0, this[At]("ignoredEntry", n), this[B] = "ignore", n.resume()) : n.size > 0 && (this[dt] = "", n.on("data", (o) => this[dt] += o), this[B] = "meta") : (this[V] = void 0, n.ignore = n.ignore || !this.filter(n.path, n), n.ignore ? (this[At]("ignoredEntry", n), this[B] = n.remain ? "ignore" : "header", n.resume()) : (n.remain ? this[B] = "body" : (this[B] = "header", n.end()), this[it] ? this[st].push(n) : (this[st].push(n), this[Zi]())));
			}
		}
	}
	[$s]() {
		queueMicrotask(() => this.emit("close"));
	}
	[Zs](t) {
		let e = !0;
		if (!t) this[it] = void 0, e = !1;
		else if (Array.isArray(t)) {
			let [i, ...r] = t;
			this.emit(i, ...r);
		} else this[it] = t, this.emit("entry", t), t.emittedEnd || (t.on("end", () => this[Zi]()), e = !1);
		return e;
	}
	[Zi]() {
		do		;
while (this[Zs](this[st].shift()));
		if (this[st].length === 0) {
			let t = this[it];
			!t || t.flowing || t.size === t.remain ? this[Yt] || this.emit("drain") : t.once("drain", () => this.emit("drain"));
		}
	}
	[Ki](t, e) {
		let i = this[Nt];
		if (!i) throw new Error("attempt to consume body without entry??");
		let r = i.blockRemain ?? 0, n = r >= t.length && e === 0 ? t : t.subarray(e, e + r);
		return i.write(n), i.blockRemain || (this[B] = "header", this[Nt] = void 0, i.end()), n.length;
	}
	[Ks](t, e) {
		let i = this[Nt], r = this[Ki](t, e);
		return !this[Nt] && i && this[Ys](i), r;
	}
	[At](t, e, i) {
		this[st].length === 0 && !this[it] ? this.emit(t, e, i) : this[st].push([
			t,
			e,
			i
		]);
	}
	[Ys](t) {
		switch (this[At]("meta", this[dt]), t.type) {
			case "ExtendedHeader":
			case "OldExtendedHeader":
				this[V] = ft.parse(this[dt], this[V], !1);
				break;
			case "GlobalExtendedHeader":
				this[he] = ft.parse(this[dt], this[he], !0);
				break;
			case "NextFileHasLongPath":
			case "OldGnuLongPath": {
				let e = this[V] ?? Object.create(null);
				this[V] = e, e.path = this[dt].replace(/\0.*/, "");
				break;
			}
			case "NextFileHasLongLinkpath": {
				let e = this[V] || Object.create(null);
				this[V] = e, e.linkpath = this[dt].replace(/\0.*/, "");
				break;
			}
			default: throw new Error("unknown meta: " + t.type);
		}
	}
	abort(t) {
		if (!this[$]) {
			if (this[w]) {
				let e = this[w];
				e.write = () => !0, e.end = () => e, e.emit = () => !1, e.destroy?.();
			}
			this[$] = !0, this.emit("abort", t), this.warn("TAR_ABORT", t, { recoverable: !1 });
		}
	}
	[Xs](t) {
		this[$i] += t.length;
		let e = this[$i] / this[le];
		return e > this.maxDecompressionRatio ? (this.abort(/* @__PURE__ */ new Error(`max decompression ratio exceeded: ${e.toFixed(2)} > ${this.maxDecompressionRatio}`)), !1) : !0;
	}
	write(t, e, i) {
		if (typeof e == "function" && (i = e, e = void 0), typeof t == "string" && (t = Buffer.from(t, typeof e == "string" ? e : "utf8")), this[$]) return i?.(), !1;
		if ((this[w] === void 0 || this.brotli === void 0 && this[w] === !1) && t) {
			if (this[p] && (t = Buffer.concat([this[p], t]), this[p] = void 0), t.length < An) return this[p] = t, i?.(), !0;
			for (let a = 0; this[w] === void 0 && a < Xi.length; a++) t[a] !== Xi[a] && (this[w] = !1);
			let o = !1;
			if (this[w] === !1 && this.zstd !== !1) {
				o = !0;
				for (let a = 0; a < qi.length; a++) if (t[a] !== qi[a]) {
					o = !1;
					break;
				}
			}
			let h = this.brotli === void 0 && !o;
			if (this[w] === !1 && h) if (t.length < 512) if (this[ut]) this.brotli = !0;
			else return this[p] = t, i?.(), !0;
			else try {
				new F(t.subarray(0, 512)), this.brotli = !1;
			} catch {
				this.brotli = !0;
			}
			if (this[w] === void 0 || this[w] === !1 && (this.brotli || o)) {
				let a = this[ut];
				this[ut] = !1, this[w] = this[w] === void 0 ? new Ue({}) : o ? new Ke({}) : new Ge({}), this[w].on("data", (c) => {
					this[Xs](c) && this[Xe](c);
				}), this[w].on("error", (c) => {
					this[$] || this.abort(c);
				}), this[w].on("end", () => {
					this[ut] = !0, this[Xe]();
				}), this[Yt] = !0, this[le] += t.length;
				let l = !!this[w][a ? "end" : "write"](t);
				return this[Yt] = !1, i?.(), l;
			}
		}
		this[Yt] = !0, this[w] ? (this[le] += t.length, this[w].write(t)) : this[Xe](t), this[Yt] = !1;
		let n = this[st].length > 0 ? !1 : this[it] ? this[it].flowing : !0;
		return !n && this[st].length === 0 && this[it]?.once("drain", () => this.emit("drain")), i?.(), n;
	}
	[Vi](t) {
		t && !this[$] && (this[p] = this[p] ? Buffer.concat([this[p], t]) : t);
	}
	[Qe]() {
		if (this[ut] && !this[Yi] && !this[$] && !this[ae]) {
			this[Yi] = !0;
			let t = this[Nt];
			if (t?.blockRemain) {
				let e = this[p] ? this[p].length : 0;
				this.warn("TAR_BAD_ARCHIVE", `Truncated input (needed ${t.blockRemain} more bytes, only ${e} available)`, { entry: t }), this[p] && t.write(this[p]), t.end();
			}
			this[At](Je);
		}
	}
	[Xe](t) {
		if (this[ae] && t) this[Vi](t);
		else if (!t && !this[p]) this[Qe]();
		else if (t) {
			if (this[ae] = !0, this[p]) {
				this[Vi](t);
				let e = this[p];
				this[p] = void 0, this[qe](e);
			} else this[qe](t);
			for (; this[p] && this[p]?.length >= 512 && !this[$] && !this[ti];) {
				let e = this[p];
				this[p] = void 0, this[qe](e);
			}
			this[ae] = !1;
		}
		(!this[p] || this[ut]) && this[Qe]();
	}
	[qe](t) {
		let e = 0, i = t.length;
		for (; e + 512 <= i && !this[$] && !this[ti];) switch (this[B]) {
			case "begin":
			case "header":
				this[Vs](t, e), e += 512;
				break;
			case "ignore":
			case "body":
				e += this[Ki](t, e);
				break;
			case "meta":
				e += this[Ks](t, e);
				break;
			default: throw new Error("invalid state: " + this[B]);
		}
		e < i && (this[p] = this[p] ? Buffer.concat([t.subarray(e), this[p]]) : t.subarray(e));
	}
	end(t, e, i) {
		return typeof t == "function" && (i = t, e = void 0, t = void 0), typeof e == "function" && (i = e, e = void 0), typeof t == "string" && (t = Buffer.from(t, e)), i && this.once("finish", i), this[$] || (this[w] ? (t && (this[le] += t.length, this[w].write(t)), this[w].end()) : (this[ut] = !0, (this.brotli === void 0 || this.zstd === void 0) && (t = t || Buffer.alloc(0)), t && this.write(t), this[Qe]())), this;
	}
};
var mt = (s) => {
	let t = s.length - 1, e = -1;
	for (; t > -1 && s.charAt(t) === "/";) e = t, t--;
	return e === -1 ? s : s.slice(0, e);
};
var vn = (s) => {
	let t = s.onReadEntry;
	s.onReadEntry = t ? (e) => {
		t(e), e.resume();
	} : (e) => e.resume();
};
var Qi = (s, t) => {
	let e = new Map(t.map((o) => [mt(o), !0])), i = s.filter, r = 100, n = (o, h = "", a = 0) => {
		if (a >= r) return e.set(o, !1), !1;
		let l = h || (0, path.parse)(o).root || ".", c;
		if (o === l) c = !1;
		else {
			let d = e.get(o);
			c = d !== void 0 ? d : n((0, path.dirname)(o), l, a + 1);
		}
		return e.set(o, c), c;
	};
	s.filter = i ? (o, h) => i(o, h) && n(mt(o)) : (o) => n(mt(o));
};
var Mn = (s) => {
	let t = new rt(s), e = s.file, i;
	try {
		i = node_fs.default.openSync(e, "r");
		let r = node_fs.default.fstatSync(i), n = s.maxReadSize || 16777216;
		if (r.size < n) {
			let o = Buffer.allocUnsafe(r.size), h = node_fs.default.readSync(i, o, 0, r.size, 0);
			t.end(h === o.byteLength ? o : o.subarray(0, h));
		} else {
			let o = 0, h = Buffer.allocUnsafe(n);
			for (; o < r.size;) {
				let a = node_fs.default.readSync(i, h, 0, n, o);
				if (a === 0) break;
				o += a, t.write(h.subarray(0, a));
			}
			t.end();
		}
	} finally {
		if (typeof i == "number") try {
			node_fs.default.closeSync(i);
		} catch {}
	}
};
var Bn = (s, t) => {
	let e = new rt(s), i = s.maxReadSize || 16777216, r = s.file;
	return new Promise((o, h) => {
		e.on("error", h), e.on("end", o), node_fs.default.stat(r, (a, l) => {
			if (a) h(a);
			else {
				let c = new _t(r, {
					readSize: i,
					size: l.size
				});
				c.on("error", h), c.pipe(e);
			}
		});
	});
};
var Ct = K(Mn, Bn, (s) => new rt(s), (s) => new rt(s), (s, t) => {
	t?.length && Qi(s, t), s.noResume || vn(s);
});
var Ji = (s, t, e) => (s &= 4095, e && (s = (s | 384) & -19), t && (s & 256 && (s |= 64), s & 32 && (s |= 8), s & 4 && (s |= 1)), s);
var { isAbsolute: zn, parse: qs } = node_path.win32, ce = (s) => {
	let t = "", e = qs(s);
	for (; zn(s) || e.root;) {
		let i = s.charAt(0) === "/" && s.slice(0, 4) !== "//?/" ? "/" : e.root;
		s = s.slice(i.length), t += i, e = qs(s);
	}
	return [t, s];
};
var ei = [
	"|",
	"<",
	">",
	"?",
	":"
];
var ji = ei.map((s) => String.fromCodePoint(61440 + Number(s.codePointAt(0))));
var Un = new Map(ei.map((s, t) => [s, ji[t]]));
var Hn = new Map(ji.map((s, t) => [s, ei[t]]));
var ts = (s) => ei.reduce((t, e) => t.split(e).join(Un.get(e)), s);
var Qs = (s) => ji.reduce((t, e) => t.split(e).join(Hn.get(e)), s);
var rr = (s, t) => t ? (s = f(s).replace(/^\.(\/|$)/, ""), mt(t) + "/" + s) : f(s);
var Wn = 16777216;
var tr = Symbol("process");
var er = Symbol("file");
var ir = Symbol("directory");
var is = Symbol("symlink");
var sr = Symbol("hardlink");
var fe = Symbol("header");
var ii = Symbol("read");
var ss = Symbol("lstat");
var si = Symbol("onlstat");
var rs = Symbol("onread");
var ns = Symbol("onreadlink");
var os$3 = Symbol("openfile");
var hs = Symbol("onopenfile");
var pt = Symbol("close");
var ri = Symbol("mode");
var as = Symbol("awaitDrain");
var es = Symbol("ondrain");
var q = Symbol("prefix");
var de = class extends A {
	path;
	portable;
	myuid = process.getuid && process.getuid() || 0;
	myuser = process.env.USER || "";
	maxReadSize;
	linkCache;
	statCache;
	preservePaths;
	cwd;
	strict;
	mtime;
	noPax;
	noMtime;
	prefix;
	fd;
	blockLen = 0;
	blockRemain = 0;
	buf;
	pos = 0;
	remain = 0;
	length = 0;
	offset = 0;
	win32;
	absolute;
	header;
	type;
	linkpath;
	stat;
	onWriteEntry;
	#t = !1;
	constructor(t, e = {}) {
		let i = se(e);
		super(), this.path = f(t), this.portable = !!i.portable, this.maxReadSize = i.maxReadSize || Wn, this.linkCache = i.linkCache || /* @__PURE__ */ new Map(), this.statCache = i.statCache || /* @__PURE__ */ new Map(), this.preservePaths = !!i.preservePaths, this.cwd = f(i.cwd || process.cwd()), this.strict = !!i.strict, this.noPax = !!i.noPax, this.noMtime = !!i.noMtime, this.mtime = i.mtime, this.prefix = i.prefix ? f(i.prefix) : void 0, this.onWriteEntry = i.onWriteEntry, typeof i.onwarn == "function" && this.on("warn", i.onwarn);
		let r = !1;
		if (!this.preservePaths) {
			let [o, h] = ce(this.path);
			o && typeof h == "string" && (this.path = h, r = o);
		}
		this.win32 = !!i.win32 || process.platform === "win32", this.win32 && (this.path = Qs(this.path.replaceAll(/\\/g, "/")), t = t.replaceAll(/\\/g, "/")), this.absolute = f(i.absolute || path.default.resolve(this.cwd, t)), this.path === "" && (this.path = "./"), r && this.warn("TAR_ENTRY_INFO", `stripping ${r} from absolute path`, {
			entry: this,
			path: r + this.path
		});
		let n = this.statCache.get(this.absolute);
		n ? this[si](n) : this[ss]();
	}
	warn(t, e, i = {}) {
		return Dt(this, t, e, i);
	}
	emit(t, ...e) {
		return t === "error" && (this.#t = !0), super.emit(t, ...e);
	}
	[ss]() {
		fs.default.lstat(this.absolute, (t, e) => {
			if (t) return this.emit("error", t);
			this[si](e);
		});
	}
	[si](t) {
		this.statCache.set(this.absolute, t), this.stat = t, t.isFile() || (t.size = 0), this.type = Gn(t), this.emit("stat", t), this[tr]();
	}
	[tr]() {
		switch (this.type) {
			case "File": return this[er]();
			case "Directory": return this[ir]();
			case "SymbolicLink": return this[is]();
			default: return this.end();
		}
	}
	[ri](t) {
		return Ji(t, this.type === "Directory", this.portable);
	}
	[q](t) {
		return rr(t, this.prefix);
	}
	[fe]() {
		if (!this.stat) throw new Error("cannot write header before stat");
		this.type === "Directory" && this.portable && (this.noMtime = !0), this.onWriteEntry?.(this), this.header = new F({
			path: this[q](this.path),
			linkpath: this.type === "Link" && this.linkpath !== void 0 ? this[q](this.linkpath) : this.linkpath,
			mode: this[ri](this.stat.mode),
			uid: this.portable ? void 0 : this.stat.uid,
			gid: this.portable ? void 0 : this.stat.gid,
			size: this.stat.size,
			mtime: this.noMtime ? void 0 : this.mtime || this.stat.mtime,
			type: this.type === "Unsupported" ? void 0 : this.type,
			uname: this.portable ? void 0 : this.stat.uid === this.myuid ? this.myuser : "",
			atime: this.portable ? void 0 : this.stat.atime,
			ctime: this.portable ? void 0 : this.stat.ctime
		}), this.header.encode() && !this.noPax && super.write(new ft({
			atime: this.portable ? void 0 : this.header.atime,
			ctime: this.portable ? void 0 : this.header.ctime,
			gid: this.portable ? void 0 : this.header.gid,
			mtime: this.noMtime ? void 0 : this.mtime || this.header.mtime,
			path: this[q](this.path),
			linkpath: this.type === "Link" && this.linkpath !== void 0 ? this[q](this.linkpath) : this.linkpath,
			size: this.header.size,
			uid: this.portable ? void 0 : this.header.uid,
			uname: this.portable ? void 0 : this.header.uname,
			dev: this.portable ? void 0 : this.stat.dev,
			ino: this.portable ? void 0 : this.stat.ino,
			nlink: this.portable ? void 0 : this.stat.nlink
		}).encode());
		let t = this.header?.block;
		if (!t) throw new Error("failed to encode header");
		super.write(t);
	}
	[ir]() {
		if (!this.stat) throw new Error("cannot create directory entry without stat");
		this.path.slice(-1) !== "/" && (this.path += "/"), this.stat.size = 0, this[fe](), this.end();
	}
	[is]() {
		fs.default.readlink(this.absolute, (t, e) => {
			if (t) return this.emit("error", t);
			this[ns](e);
		});
	}
	[ns](t) {
		this.linkpath = f(t), this[fe](), this.end();
	}
	[sr](t) {
		if (!this.stat) throw new Error("cannot create link entry without stat");
		this.type = "Link", this.linkpath = f(path.default.relative(this.cwd, t)), this.stat.size = 0, this[fe](), this.end();
	}
	[er]() {
		if (!this.stat) throw new Error("cannot create file entry without stat");
		if (this.stat.nlink > 1) {
			let t = `${this.stat.dev}:${this.stat.ino}`, e = this.linkCache.get(t);
			if (e?.indexOf(this.cwd) === 0) return this[sr](e);
			this.linkCache.set(t, this.absolute);
		}
		if (this[fe](), this.stat.size === 0) return this.end();
		this[os$3]();
	}
	[os$3]() {
		fs.default.open(this.absolute, "r", (t, e) => {
			if (t) return this.emit("error", t);
			this[hs](e);
		});
	}
	[hs](t) {
		if (this.fd = t, this.#t) return this[pt]();
		if (!this.stat) throw new Error("should stat before calling onopenfile");
		this.blockLen = 512 * Math.ceil(this.stat.size / 512), this.blockRemain = this.blockLen;
		let e = Math.min(this.blockLen, this.maxReadSize);
		this.buf = Buffer.allocUnsafe(e), this.offset = 0, this.pos = 0, this.remain = this.stat.size, this.length = this.buf.length, this[ii]();
	}
	[ii]() {
		let { fd: t, buf: e, offset: i, length: r, pos: n } = this;
		if (t === void 0 || e === void 0) throw new Error("cannot read file without first opening");
		fs.default.read(t, e, i, r, n, (o, h) => {
			if (o) return this[pt](() => this.emit("error", o));
			this[rs](h);
		});
	}
	[pt](t = () => {}) {
		this.fd !== void 0 && fs.default.close(this.fd, t);
	}
	[rs](t) {
		if (t <= 0 && this.remain > 0) {
			let r = Object.assign(/* @__PURE__ */ new Error("encountered unexpected EOF"), {
				path: this.absolute,
				syscall: "read",
				code: "EOF"
			});
			return this[pt](() => this.emit("error", r));
		}
		if (t > this.remain) {
			let r = Object.assign(/* @__PURE__ */ new Error("did not encounter expected EOF"), {
				path: this.absolute,
				syscall: "read",
				code: "EOF"
			});
			return this[pt](() => this.emit("error", r));
		}
		if (!this.buf) throw new Error("should have created buffer prior to reading");
		if (t === this.remain) for (let r = t; r < this.length && t < this.blockRemain; r++) this.buf[r + this.offset] = 0, t++, this.remain++;
		let e = this.offset === 0 && t === this.buf.length ? this.buf : this.buf.subarray(this.offset, this.offset + t);
		this.write(e) ? this[es]() : this[as](() => this[es]());
	}
	[as](t) {
		this.once("drain", t);
	}
	write(t, e, i) {
		if (typeof e == "function" && (i = e, e = void 0), typeof t == "string" && (t = Buffer.from(t, typeof e == "string" ? e : "utf8")), this.blockRemain < t.length) {
			let r = Object.assign(/* @__PURE__ */ new Error("writing more data than expected"), { path: this.absolute });
			return this.emit("error", r);
		}
		return this.remain -= t.length, this.blockRemain -= t.length, this.pos += t.length, this.offset += t.length, super.write(t, null, i);
	}
	[es]() {
		if (!this.remain) return this.blockRemain && super.write(Buffer.alloc(this.blockRemain)), this[pt]((t) => t ? this.emit("error", t) : this.end());
		if (!this.buf) throw new Error("buffer lost somehow in ONDRAIN");
		this.offset >= this.length && (this.buf = Buffer.allocUnsafe(Math.min(this.blockRemain, this.buf.length)), this.offset = 0), this.length = this.buf.length - this.offset, this[ii]();
	}
};
var ni = class extends de {
	sync = !0;
	[ss]() {
		this[si](fs.default.lstatSync(this.absolute));
	}
	[is]() {
		this[ns](fs.default.readlinkSync(this.absolute));
	}
	[os$3]() {
		this[hs](fs.default.openSync(this.absolute, "r"));
	}
	[ii]() {
		let t = !0;
		try {
			let { fd: e, buf: i, offset: r, length: n, pos: o } = this;
			if (e === void 0 || i === void 0) throw new Error("fd and buf must be set in READ method");
			let h = fs.default.readSync(e, i, r, n, o);
			this[rs](h), t = !1;
		} finally {
			if (t) try {
				this[pt](() => {});
			} catch {}
		}
	}
	[as](t) {
		t();
	}
	[pt](t = () => {}) {
		this.fd !== void 0 && fs.default.closeSync(this.fd), t();
	}
};
var oi = class extends A {
	blockLen = 0;
	blockRemain = 0;
	buf = 0;
	pos = 0;
	remain = 0;
	length = 0;
	preservePaths;
	portable;
	strict;
	noPax;
	noMtime;
	readEntry;
	type;
	prefix;
	path;
	mode;
	uid;
	gid;
	uname;
	gname;
	header;
	mtime;
	atime;
	ctime;
	linkpath;
	size;
	onWriteEntry;
	warn(t, e, i = {}) {
		return Dt(this, t, e, i);
	}
	constructor(t, e = {}) {
		let i = se(e);
		super(), this.preservePaths = !!i.preservePaths, this.portable = !!i.portable, this.strict = !!i.strict, this.noPax = !!i.noPax, this.noMtime = !!i.noMtime, this.onWriteEntry = i.onWriteEntry, this.readEntry = t;
		let { type: r } = t;
		if (r === "Unsupported") throw new Error("writing entry that should be ignored");
		this.type = r, this.type === "Directory" && this.portable && (this.noMtime = !0), this.prefix = i.prefix, this.path = f(t.path), this.mode = t.mode !== void 0 ? this[ri](t.mode) : void 0, this.uid = this.portable ? void 0 : t.uid, this.gid = this.portable ? void 0 : t.gid, this.uname = this.portable ? void 0 : t.uname, this.gname = this.portable ? void 0 : t.gname, this.size = t.size, this.mtime = this.noMtime ? void 0 : i.mtime || t.mtime, this.atime = this.portable ? void 0 : t.atime, this.ctime = this.portable ? void 0 : t.ctime, this.linkpath = t.linkpath !== void 0 ? f(t.linkpath) : void 0, typeof i.onwarn == "function" && this.on("warn", i.onwarn);
		let n = !1;
		if (!this.preservePaths) {
			let [h, a] = ce(this.path);
			h && typeof a == "string" && (this.path = a, n = h);
		}
		this.remain = t.size, this.blockRemain = t.startBlockSize, this.onWriteEntry?.(this), this.header = new F({
			path: this[q](this.path),
			linkpath: this.type === "Link" && this.linkpath !== void 0 ? this[q](this.linkpath) : this.linkpath,
			mode: this.mode,
			uid: this.portable ? void 0 : this.uid,
			gid: this.portable ? void 0 : this.gid,
			size: this.size,
			mtime: this.noMtime ? void 0 : this.mtime,
			type: this.type,
			uname: this.portable ? void 0 : this.uname,
			atime: this.portable ? void 0 : this.atime,
			ctime: this.portable ? void 0 : this.ctime
		}), n && this.warn("TAR_ENTRY_INFO", `stripping ${n} from absolute path`, {
			entry: this,
			path: n + this.path
		}), this.header.encode() && !this.noPax && super.write(new ft({
			atime: this.portable ? void 0 : this.atime,
			ctime: this.portable ? void 0 : this.ctime,
			gid: this.portable ? void 0 : this.gid,
			mtime: this.noMtime ? void 0 : this.mtime,
			path: this[q](this.path),
			linkpath: this.type === "Link" && this.linkpath !== void 0 ? this[q](this.linkpath) : this.linkpath,
			size: this.size,
			uid: this.portable ? void 0 : this.uid,
			uname: this.portable ? void 0 : this.uname,
			dev: this.portable ? void 0 : this.readEntry.dev,
			ino: this.portable ? void 0 : this.readEntry.ino,
			nlink: this.portable ? void 0 : this.readEntry.nlink
		}).encode());
		let o = this.header?.block;
		if (!o) throw new Error("failed to encode header");
		super.write(o), t.pipe(this);
	}
	[q](t) {
		return rr(t, this.prefix);
	}
	[ri](t) {
		return Ji(t, this.type === "Directory", this.portable);
	}
	write(t, e, i) {
		typeof e == "function" && (i = e, e = void 0), typeof t == "string" && (t = Buffer.from(t, typeof e == "string" ? e : "utf8"));
		let r = t.length;
		if (r > this.blockRemain) throw new Error("writing more to entry than is appropriate");
		return this.blockRemain -= r, super.write(t, i);
	}
	end(t, e, i) {
		return this.blockRemain && super.write(Buffer.alloc(this.blockRemain)), typeof t == "function" && (i = t, e = void 0, t = void 0), typeof e == "function" && (i = e, e = void 0), typeof t == "string" && (t = Buffer.from(t, e ?? "utf8")), i && this.once("finish", i), t ? super.end(t, i) : super.end(i), this;
	}
};
var Gn = (s) => s.isFile() ? "File" : s.isDirectory() ? "Directory" : s.isSymbolicLink() ? "SymbolicLink" : "Unsupported";
var hi = class s {
	tail;
	head;
	length = 0;
	static create(t = []) {
		return new s(t);
	}
	constructor(t = []) {
		for (let e of t) this.push(e);
	}
	*[Symbol.iterator]() {
		for (let t = this.head; t; t = t.next) yield t.value;
	}
	removeNode(t) {
		if (t.list !== this) throw new Error("removing node which does not belong to this list");
		let e = t.next, i = t.prev;
		return e && (e.prev = i), i && (i.next = e), t === this.head && (this.head = e), t === this.tail && (this.tail = i), this.length--, t.next = void 0, t.prev = void 0, t.list = void 0, e;
	}
	unshiftNode(t) {
		if (t === this.head) return;
		t.list && t.list.removeNode(t);
		let e = this.head;
		t.list = this, t.next = e, e && (e.prev = t), this.head = t, this.tail || (this.tail = t), this.length++;
	}
	pushNode(t) {
		if (t === this.tail) return;
		t.list && t.list.removeNode(t);
		let e = this.tail;
		t.list = this, t.prev = e, e && (e.next = t), this.tail = t, this.head || (this.head = t), this.length++;
	}
	push(...t) {
		for (let e = 0, i = t.length; e < i; e++) Yn(this, t[e]);
		return this.length;
	}
	unshift(...t) {
		for (var e = 0, i = t.length; e < i; e++) Kn(this, t[e]);
		return this.length;
	}
	pop() {
		if (!this.tail) return;
		let t = this.tail.value, e = this.tail;
		return this.tail = this.tail.prev, this.tail ? this.tail.next = void 0 : this.head = void 0, e.list = void 0, this.length--, t;
	}
	shift() {
		if (!this.head) return;
		let t = this.head.value, e = this.head;
		return this.head = this.head.next, this.head ? this.head.prev = void 0 : this.tail = void 0, e.list = void 0, this.length--, t;
	}
	forEach(t, e) {
		e = e || this;
		for (let i = this.head, r = 0; i; r++) t.call(e, i.value, r, this), i = i.next;
	}
	forEachReverse(t, e) {
		e = e || this;
		for (let i = this.tail, r = this.length - 1; i; r--) t.call(e, i.value, r, this), i = i.prev;
	}
	get(t) {
		let e = 0, i = this.head;
		for (; i && e < t; e++) i = i.next;
		if (e === t && i) return i.value;
	}
	getReverse(t) {
		let e = 0, i = this.tail;
		for (; i && e < t; e++) i = i.prev;
		if (e === t && i) return i.value;
	}
	map(t, e) {
		e = e || this;
		let i = new s();
		for (let r = this.head; r;) i.push(t.call(e, r.value, this)), r = r.next;
		return i;
	}
	mapReverse(t, e) {
		e = e || this;
		var i = new s();
		for (let r = this.tail; r;) i.push(t.call(e, r.value, this)), r = r.prev;
		return i;
	}
	reduce(t, e) {
		let i, r = this.head;
		if (arguments.length > 1) i = e;
		else if (this.head) r = this.head.next, i = this.head.value;
		else throw new TypeError("Reduce of empty list with no initial value");
		for (var n = 0; r; n++) i = t(i, r.value, n), r = r.next;
		return i;
	}
	reduceReverse(t, e) {
		let i, r = this.tail;
		if (arguments.length > 1) i = e;
		else if (this.tail) r = this.tail.prev, i = this.tail.value;
		else throw new TypeError("Reduce of empty list with no initial value");
		for (let n = this.length - 1; r; n--) i = t(i, r.value, n), r = r.prev;
		return i;
	}
	toArray() {
		let t = new Array(this.length);
		for (let e = 0, i = this.head; i; e++) t[e] = i.value, i = i.next;
		return t;
	}
	toArrayReverse() {
		let t = new Array(this.length);
		for (let e = 0, i = this.tail; i; e++) t[e] = i.value, i = i.prev;
		return t;
	}
	slice(t = 0, e = this.length) {
		e < 0 && (e += this.length), t < 0 && (t += this.length);
		let i = new s();
		if (e < t || e < 0) return i;
		t < 0 && (t = 0), e > this.length && (e = this.length);
		let r = this.head, n = 0;
		for (n = 0; r && n < t; n++) r = r.next;
		for (; r && n < e; n++, r = r.next) i.push(r.value);
		return i;
	}
	sliceReverse(t = 0, e = this.length) {
		e < 0 && (e += this.length), t < 0 && (t += this.length);
		let i = new s();
		if (e < t || e < 0) return i;
		t < 0 && (t = 0), e > this.length && (e = this.length);
		let r = this.length, n = this.tail;
		for (; n && r > e; r--) n = n.prev;
		for (; n && r > t; r--, n = n.prev) i.push(n.value);
		return i;
	}
	splice(t, e = 0, ...i) {
		t > this.length && (t = this.length - 1), t < 0 && (t = this.length + t);
		let r = this.head;
		for (let o = 0; r && o < t; o++) r = r.next;
		let n = [];
		for (let o = 0; r && o < e; o++) n.push(r.value), r = this.removeNode(r);
		r ? r !== this.tail && (r = r.prev) : r = this.tail;
		for (let o of i) r = Zn(this, r, o);
		return n;
	}
	reverse() {
		let t = this.head, e = this.tail;
		for (let i = t; i; i = i.prev) {
			let r = i.prev;
			i.prev = i.next, i.next = r;
		}
		return this.head = e, this.tail = t, this;
	}
};
function Zn(s, t, e) {
	let n = new ue(e, t, t ? t.next : s.head, s);
	return n.next === void 0 && (s.tail = n), n.prev === void 0 && (s.head = n), s.length++, n;
}
function Yn(s, t) {
	s.tail = new ue(t, s.tail, void 0, s), s.head || (s.head = s.tail), s.length++;
}
function Kn(s, t) {
	s.head = new ue(t, void 0, s.head, s), s.tail || (s.tail = s.head), s.length++;
}
var ue = class {
	list;
	next;
	prev;
	value;
	constructor(t, e, i, r) {
		this.list = r, this.value = t, e ? (e.next = this, this.prev = e) : this.prev = void 0, i ? (i.prev = this, this.next = i) : this.next = void 0;
	}
};
var pi = class {
	path;
	absolute;
	entry;
	stat;
	readdir;
	pending = !1;
	pendingLink = !1;
	ignore = !1;
	piped = !1;
	constructor(t, e) {
		this.path = t || "./", this.absolute = e;
	}
};
var nr = Buffer.alloc(1024);
var li = Symbol("onStat");
var me = Symbol("ended");
var W = Symbol("queue");
var pe = Symbol("pendingLinks");
var Et = Symbol("current");
var Ft = Symbol("process");
var Ee = Symbol("processing");
var ai = Symbol("processJob");
var G = Symbol("jobs");
var ls = Symbol("jobDone");
var ci = Symbol("addFSEntry");
var or = Symbol("addTarEntry");
var ds = Symbol("stat");
var us = Symbol("readdir");
var fi = Symbol("onreaddir");
var di = Symbol("pipe");
var hr = Symbol("entry");
var cs = Symbol("entryOpt");
var ui = Symbol("writeEntryClass");
var lr = Symbol("write");
var fs$5 = Symbol("ondrain");
var wt = class extends A {
	sync = !1;
	opt;
	cwd;
	maxReadSize;
	preservePaths;
	strict;
	noPax;
	prefix;
	linkCache;
	statCache;
	file;
	portable;
	zip;
	readdirCache;
	noDirRecurse;
	follow;
	noMtime;
	mtime;
	filter;
	jobs;
	[ui];
	onWriteEntry;
	[W];
	[pe] = /* @__PURE__ */ new Map();
	[G] = 0;
	[Ee] = !1;
	[me] = !1;
	constructor(t = {}) {
		if (super(), this.opt = t, this.file = t.file || "", this.cwd = t.cwd || process.cwd(), this.maxReadSize = t.maxReadSize, this.preservePaths = !!t.preservePaths, this.strict = !!t.strict, this.noPax = !!t.noPax, this.prefix = f(t.prefix || ""), this.linkCache = t.linkCache || /* @__PURE__ */ new Map(), this.statCache = t.statCache || /* @__PURE__ */ new Map(), this.readdirCache = t.readdirCache || /* @__PURE__ */ new Map(), this.onWriteEntry = t.onWriteEntry, this[ui] = de, typeof t.onwarn == "function" && this.on("warn", t.onwarn), this.portable = !!t.portable, t.gzip || t.brotli || t.zstd) {
			if ((t.gzip ? 1 : 0) + (t.brotli ? 1 : 0) + (t.zstd ? 1 : 0) > 1) throw new TypeError("gzip, brotli, zstd are mutually exclusive");
			if (t.gzip && (typeof t.gzip != "object" && (t.gzip = {}), this.portable && (t.gzip.portable = !0), this.zip = new ze(t.gzip)), t.brotli && (typeof t.brotli != "object" && (t.brotli = {}), this.zip = new We(t.brotli)), t.zstd && (typeof t.zstd != "object" && (t.zstd = {}), this.zip = new Ye(t.zstd)), !this.zip) throw new Error("impossible");
			let e = this.zip;
			e.on("data", (i) => super.write(i)), e.on("end", () => super.end()), e.on("drain", () => this[fs$5]()), this.on("resume", () => e.resume());
		} else this.on("drain", this[fs$5]);
		this.noDirRecurse = !!t.noDirRecurse, this.follow = !!t.follow, this.noMtime = !!t.noMtime, t.mtime && (this.mtime = t.mtime), this.filter = typeof t.filter == "function" ? t.filter : () => !0, this[W] = new hi(), this[G] = 0, this.jobs = Number(t.jobs) || 4, this[Ee] = !1, this[me] = !1;
	}
	[lr](t) {
		return super.write(t);
	}
	add(t) {
		return this.write(t), this;
	}
	end(t, e, i) {
		return typeof t == "function" && (i = t, t = void 0), typeof e == "function" && (i = e, e = void 0), t && this.add(t), this[me] = !0, this[Ft](), i && i(), this;
	}
	write(t) {
		if (this[me]) throw new Error("write after end");
		return typeof t == "string" ? this[ci](t) : this[or](t), this.flowing;
	}
	[or](t) {
		let e = f(path.default.resolve(this.cwd, t.path));
		if (!this.filter(t.path, t)) t.resume();
		else {
			let i = new pi(t.path, e);
			i.entry = new oi(t, this[cs](i)), i.entry.on("end", () => this[ls](i)), this[G] += 1, this[W].push(i);
		}
		this[Ft]();
	}
	[ci](t) {
		let e = f(path.default.resolve(this.cwd, t));
		this[W].push(new pi(t, e)), this[Ft]();
	}
	[ds](t) {
		t.pending = !0, this[G] += 1;
		let e = this.follow ? "stat" : "lstat";
		fs.default[e](t.absolute, (i, r) => {
			t.pending = !1, this[G] -= 1, i ? this.emit("error", i) : this[li](t, r);
		});
	}
	[li](t, e) {
		if (this.statCache.set(t.absolute, e), t.stat = e, !this.filter(t.path, e)) t.ignore = !0;
		else if (e.isFile() && e.nlink > 1 && !this.linkCache.get(`${e.dev}:${e.ino}`) && !this.sync) if (t === this[Et]) this[ai](t);
		else {
			let i = `${e.dev}:${e.ino}`, r = this[pe].get(i);
			r ? r.push(t) : this[pe].set(i, [t]), t.pendingLink = !0, t.pending = !0;
		}
		this[Ft]();
	}
	[us](t) {
		t.pending = !0, this[G] += 1, fs.default.readdir(t.absolute, (e, i) => {
			if (t.pending = !1, this[G] -= 1, e) return this.emit("error", e);
			this[fi](t, i);
		});
	}
	[fi](t, e) {
		this.readdirCache.set(t.absolute, e), t.readdir = e, this[Ft]();
	}
	[Ft]() {
		if (!this[Ee]) {
			this[Ee] = !0;
			for (let t = this[W].head; t && this[G] < this.jobs; t = t.next) if (this[ai](t.value), t.value.ignore) {
				let e = t.next;
				this[W].removeNode(t), t.next = e;
			}
			this[Ee] = !1, this[me] && this[W].length === 0 && this[G] === 0 && (this.zip ? this.zip.end(nr) : (super.write(nr), super.end()));
		}
	}
	get [Et]() {
		return this[W] && this[W].head && this[W].head.value;
	}
	[ls](t) {
		this[W].shift(), this[G] -= 1;
		let { stat: e } = t;
		if (e && e.isFile() && e.nlink > 1) {
			let i = `${e.dev}:${e.ino}`, r = this[pe].get(i);
			if (r) {
				this[pe].delete(i);
				for (let n of r) n.pending = !1, this[ai](n);
			}
		}
		this[Ft]();
	}
	[ai](t) {
		if (t.pending && t.pendingLink && t === this[Et] && (t.pending = !1, t.pendingLink = !1), !t.pending) {
			if (t.entry) {
				t === this[Et] && !t.piped && this[di](t);
				return;
			}
			if (!t.stat) {
				let e = this.statCache.get(t.absolute);
				e ? this[li](t, e) : this[ds](t);
			}
			if (t.stat && !t.ignore) {
				if (!this.noDirRecurse && t.stat.isDirectory() && !t.readdir) {
					let e = this.readdirCache.get(t.absolute);
					if (e ? this[fi](t, e) : this[us](t), !t.readdir) return;
				}
				if (t.entry = this[hr](t), !t.entry) {
					t.ignore = !0;
					return;
				}
				t === this[Et] && !t.piped && this[di](t);
			}
		}
	}
	[cs](t) {
		return {
			onwarn: (e, i, r) => this.warn(e, i, r),
			noPax: this.noPax,
			cwd: this.cwd,
			absolute: t.absolute,
			preservePaths: this.preservePaths,
			maxReadSize: this.maxReadSize,
			strict: this.strict,
			portable: this.portable,
			linkCache: this.linkCache,
			statCache: this.statCache,
			noMtime: this.noMtime,
			mtime: this.mtime,
			prefix: this.prefix,
			onWriteEntry: this.onWriteEntry
		};
	}
	[hr](t) {
		this[G] += 1;
		try {
			return new this[ui](t.path, this[cs](t)).on("end", () => this[ls](t)).on("error", (i) => this.emit("error", i));
		} catch (e) {
			this.emit("error", e);
		}
	}
	[fs$5]() {
		this[Et] && this[Et].entry && this[Et].entry.resume();
	}
	[di](t) {
		t.piped = !0, t.readdir && t.readdir.forEach((r) => {
			let n = t.path, o = n === "./" ? "" : n.replace(/\/*$/, "/");
			this[ci](o + r);
		});
		let e = t.entry, i = this.zip;
		if (!e) throw new Error("cannot pipe without source");
		i ? e.on("data", (r) => {
			i.write(r) || e.pause();
		}) : e.on("data", (r) => {
			super.write(r) || e.pause();
		});
	}
	pause() {
		return this.zip && this.zip.pause(), super.pause();
	}
	warn(t, e, i = {}) {
		Dt(this, t, e, i);
	}
};
var kt = class extends wt {
	sync = !0;
	constructor(t) {
		super(t), this[ui] = ni;
	}
	pause() {}
	resume() {}
	[ds](t) {
		let e = this.follow ? "statSync" : "lstatSync";
		this[li](t, fs.default[e](t.absolute));
	}
	[us](t) {
		this[fi](t, fs.default.readdirSync(t.absolute));
	}
	[di](t) {
		let e = t.entry, i = this.zip;
		if (t.readdir && t.readdir.forEach((r) => {
			let n = t.path, o = n === "./" ? "" : n.replace(/\/*$/, "/");
			this[ci](o + r);
		}), !e) throw new Error("Cannot pipe without source");
		i ? e.on("data", (r) => {
			i.write(r);
		}) : e.on("data", (r) => {
			super[lr](r);
		});
	}
};
var Vn = (s, t) => {
	let e = new kt(s), i = new Wt(s.file, { mode: s.mode || 438 });
	e.pipe(i), fr(e, t);
};
var $n = (s, t) => {
	let e = new wt(s), i = new et(s.file, { mode: s.mode || 438 });
	e.pipe(i);
	let r = new Promise((n, o) => {
		i.on("error", o), i.on("close", n), e.on("error", o);
	});
	return dr(e, t).catch((n) => e.emit("error", n)), r;
};
var fr = (s, t) => {
	t.forEach((e) => {
		e.charAt(0) === "@" ? Ct({
			file: node_path.default.resolve(s.cwd, e.slice(1)),
			sync: !0,
			noResume: !0,
			onReadEntry: (i) => s.add(i)
		}) : s.add(e);
	}), s.end();
};
var dr = async (s, t) => {
	for (let e of t) e.charAt(0) === "@" ? await Ct({
		file: node_path.default.resolve(String(s.cwd), e.slice(1)),
		noResume: !0,
		onReadEntry: (i) => {
			s.add(i);
		}
	}) : s.add(e);
	s.end();
};
var Xn = (s, t) => {
	let e = new kt(s);
	return fr(e, t), e;
};
var qn = (s, t) => {
	let e = new wt(s);
	return dr(e, t).catch((i) => e.emit("error", i)), e;
};
K(Vn, $n, Xn, qn, (s, t) => {
	if (!t?.length) throw new TypeError("no paths specified to add to archive");
});
var Er = (process.env.__FAKE_PLATFORM__ || process.platform) === "win32", { O_CREAT: wr, O_NOFOLLOW: ur, O_TRUNC: Sr, O_WRONLY: yr } = fs.default.constants, Rr = Number(process.env.__FAKE_FS_O_FILENAME__) || fs.default.constants.UV_FS_O_FILEMAP || 0, jn = Er && !!Rr, to = 524288, eo = Rr | Sr | wr | yr, mr = !Er && typeof ur == "number" ? ur | Sr | wr | yr : null, ms = mr !== null ? () => mr : jn ? (s) => s < to ? eo : "w" : () => "w";
var ps = (s, t, e) => {
	try {
		return node_fs.default.lchownSync(s, t, e);
	} catch (i) {
		if (i?.code !== "ENOENT") throw i;
	}
};
var Ei = (s, t, e, i) => {
	node_fs.default.lchown(s, t, e, (r) => {
		i(r && r?.code !== "ENOENT" ? r : null);
	});
};
var io = (s, t, e, i, r) => {
	if (t.isDirectory()) Es(node_path.default.resolve(s, t.name), e, i, (n) => {
		if (n) return r(n);
		Ei(node_path.default.resolve(s, t.name), e, i, r);
	});
	else Ei(node_path.default.resolve(s, t.name), e, i, r);
};
var Es = (s, t, e, i) => {
	node_fs.default.readdir(s, { withFileTypes: !0 }, (r, n) => {
		if (r) {
			if (r.code === "ENOENT") return i();
			if (r.code !== "ENOTDIR" && r.code !== "ENOTSUP") return i(r);
		}
		if (r || !n.length) return Ei(s, t, e, i);
		let o = n.length, h = null, a = (l) => {
			if (!h) {
				if (l) return i(h = l);
				if (--o === 0) return Ei(s, t, e, i);
			}
		};
		for (let l of n) io(s, l, t, e, a);
	});
};
var so = (s, t, e, i) => {
	t.isDirectory() && ws(node_path.default.resolve(s, t.name), e, i), ps(node_path.default.resolve(s, t.name), e, i);
};
var ws = (s, t, e) => {
	let i;
	try {
		i = node_fs.default.readdirSync(s, { withFileTypes: !0 });
	} catch (r) {
		let n = r;
		if (n?.code === "ENOENT") return;
		if (n?.code === "ENOTDIR" || n?.code === "ENOTSUP") return ps(s, t, e);
		throw n;
	}
	for (let r of i) so(s, r, t, e);
	return ps(s, t, e);
};
var Se = class extends Error {
	path;
	code;
	syscall = "chdir";
	constructor(t, e) {
		super(`${e}: Cannot cd into '${t}'`), this.path = t, this.code = e;
	}
	get name() {
		return "CwdError";
	}
};
var St = class extends Error {
	path;
	symlink;
	syscall = "symlink";
	code = "TAR_SYMLINK_ERROR";
	constructor(t, e) {
		super("TAR_SYMLINK_ERROR: Cannot extract through symbolic link"), this.symlink = t, this.path = e;
	}
	get name() {
		return "SymlinkError";
	}
};
var no = (s, t) => {
	node_fs.default.stat(s, (e, i) => {
		(e || !i.isDirectory()) && (e = new Se(s, e?.code || "ENOTDIR")), t(e);
	});
};
var gr = (s, t, e) => {
	s = f(s);
	let i = t.umask ?? 18, r = t.mode | 448, n = (r & i) !== 0, o = t.uid, h = t.gid, a = typeof o == "number" && typeof h == "number" && (o !== t.processUid || h !== t.processGid), l = t.preserve, c = t.unlink, d = f(t.cwd), y = (E, x) => {
		E ? e(E) : x && a ? Es(x, o, h, (Le) => y(Le)) : n ? node_fs.default.chmod(s, r, e) : e();
	};
	if (s === d) return no(s, y);
	if (l) return node_fs_promises.default.mkdir(s, {
		mode: r,
		recursive: !0
	}).then((E) => y(null, E ?? void 0), y);
	Ss(d, f(node_path.default.relative(d, s)).split("/"), r, c, d, void 0, y);
};
var Ss = (s, t, e, i, r, n, o) => {
	if (t.length === 0) return o(null, n);
	let h = t.shift(), a = f(node_path.default.resolve(s + "/" + h));
	node_fs.default.mkdir(a, e, br(a, t, e, i, r, n, o));
};
var br = (s, t, e, i, r, n, o) => (h) => {
	h ? node_fs.default.lstat(s, (a, l) => {
		if (a) a.path = a.path && f(a.path), o(a);
		else if (l.isDirectory()) Ss(s, t, e, i, r, n, o);
		else if (i) node_fs.default.unlink(s, (c) => {
			if (c) return o(c);
			node_fs.default.mkdir(s, e, br(s, t, e, i, r, n, o));
		});
		else {
			if (l.isSymbolicLink()) return o(new St(s, s + "/" + t.join("/")));
			o(h);
		}
	}) : (n = n || s, Ss(s, t, e, i, r, n, o));
};
var oo = (s) => {
	let t = !1, e;
	try {
		t = node_fs.default.statSync(s).isDirectory();
	} catch (i) {
		e = i?.code;
	} finally {
		if (!t) throw new Se(s, e ?? "ENOTDIR");
	}
};
var _r = (s, t) => {
	s = f(s);
	let e = t.umask ?? 18, i = t.mode | 448, r = (i & e) !== 0, n = t.uid, o = t.gid, h = typeof n == "number" && typeof o == "number" && (n !== t.processUid || o !== t.processGid), a = t.preserve, l = t.unlink, c = f(t.cwd), d = (E) => {
		E && h && ws(E, n, o), r && node_fs.default.chmodSync(s, i);
	};
	if (s === c) return oo(c), d();
	if (a) return d(node_fs.default.mkdirSync(s, {
		mode: i,
		recursive: !0
	}) ?? void 0);
	let T = f(node_path.default.relative(c, s)).split("/"), D;
	for (let E = T.shift(), x = c; E && (x += "/" + E); E = T.shift()) {
		x = f(node_path.default.resolve(x));
		try {
			node_fs.default.mkdirSync(x, i), D = D || x;
		} catch {
			let Le = node_fs.default.lstatSync(x);
			if (Le.isDirectory()) continue;
			if (l) {
				node_fs.default.unlinkSync(x), node_fs.default.mkdirSync(x, i), D = D || x;
				continue;
			} else if (Le.isSymbolicLink()) return new St(x, x + "/" + T.join("/"));
		}
	}
	return d(D);
};
var ys = Object.create(null);
var Or = 1e4;
var Vt = /* @__PURE__ */ new Set();
var Tr = (s) => {
	Vt.has(s) ? Vt.delete(s) : ys[s] = s.normalize("NFD").toLocaleLowerCase("en").toLocaleUpperCase("en"), Vt.add(s);
	let t = ys[s], e = Vt.size - Or;
	if (e > Or / 10) {
		for (let i of Vt) if (Vt.delete(i), delete ys[i], --e <= 0) break;
	}
	return t;
};
var ao = (process.env.TESTING_TAR_FAKE_PLATFORM || process.platform) === "win32";
var lo = (s) => s.split("/").slice(0, -1).reduce((e, i) => {
	let r = e.at(-1);
	return r !== void 0 && (i = (0, node_path.join)(r, i)), e.push(i || "/"), e;
}, []);
var yi = class {
	#t = /* @__PURE__ */ new Map();
	#i = /* @__PURE__ */ new Map();
	#s = /* @__PURE__ */ new Set();
	reserve(t, e) {
		t = ao ? ["win32 parallelization disabled"] : t.map((r) => mt((0, node_path.join)(Tr(r))));
		let i = new Set(t.map((r) => lo(r)).reduce((r, n) => r.concat(n)));
		this.#i.set(e, {
			dirs: i,
			paths: t
		});
		for (let r of t) {
			let n = this.#t.get(r);
			n ? n.push(e) : this.#t.set(r, [e]);
		}
		for (let r of i) {
			let n = this.#t.get(r);
			if (!n) this.#t.set(r, [/* @__PURE__ */ new Set([e])]);
			else {
				let o = n.at(-1);
				o instanceof Set ? o.add(e) : n.push(/* @__PURE__ */ new Set([e]));
			}
		}
		return this.#r(e);
	}
	#n(t) {
		let e = this.#i.get(t);
		if (!e) throw new Error("function does not have any path reservations");
		return {
			paths: e.paths.map((i) => this.#t.get(i)),
			dirs: [...e.dirs].map((i) => this.#t.get(i))
		};
	}
	check(t) {
		let { paths: e, dirs: i } = this.#n(t);
		return e.every((r) => r && r[0] === t) && i.every((r) => r && r[0] instanceof Set && r[0].has(t));
	}
	#r(t) {
		return this.#s.has(t) || !this.check(t) ? !1 : (this.#s.add(t), t(() => this.#e(t)), !0);
	}
	#e(t) {
		if (!this.#s.has(t)) return !1;
		let e = this.#i.get(t);
		if (!e) throw new Error("invalid reservation");
		let { paths: i, dirs: r } = e, n = /* @__PURE__ */ new Set();
		for (let o of i) {
			let h = this.#t.get(o);
			if (!h || h?.[0] !== t) continue;
			let a = h[1];
			if (!a) {
				this.#t.delete(o);
				continue;
			}
			if (h.shift(), typeof a == "function") n.add(a);
			else for (let l of a) n.add(l);
		}
		for (let o of r) {
			let h = this.#t.get(o), a = h?.[0];
			if (!(!h || !(a instanceof Set))) if (a.size === 1 && h.length === 1) {
				this.#t.delete(o);
				continue;
			} else if (a.size === 1) {
				h.shift();
				let l = h[0];
				typeof l == "function" && n.add(l);
			} else a.delete(t);
		}
		return this.#s.delete(t), n.forEach((o) => this.#r(o)), !0;
	}
};
var Lr = () => process.umask();
var Dr = Symbol("onEntry");
var _s = Symbol("checkFs");
var Nr = Symbol("checkFs2");
var Os = Symbol("isReusable");
var P = Symbol("makeFs");
var Ts = Symbol("file");
var xs = Symbol("directory");
var gi = Symbol("link");
var Ar = Symbol("symlink");
var Ir = Symbol("hardlink");
var Re = Symbol("ensureNoSymlink");
var Cr = Symbol("unsupported");
var Fr = Symbol("checkPath");
var Rs = Symbol("stripAbsolutePath");
var yt = Symbol("mkdir");
var O = Symbol("onError");
var Ri = Symbol("pending");
var kr = Symbol("pend");
var $t = Symbol("unpend");
var gs = Symbol("ended");
var bs = Symbol("maybeClose");
var Ls = Symbol("skip");
var ge = Symbol("doChown");
var be = Symbol("uid");
var _e = Symbol("gid");
var Oe = Symbol("checkedCwd");
var Te = (process.env.TESTING_TAR_FAKE_PLATFORM || process.platform) === "win32";
var uo = 1024;
var mo = (s, t) => {
	if (!Te) return node_fs.default.unlink(s, t);
	let e = s + ".DELETE." + (0, node_crypto.randomBytes)(16).toString("hex");
	node_fs.default.rename(s, e, (i) => {
		if (i) return t(i);
		node_fs.default.unlink(e, t);
	});
};
var po = (s) => {
	if (!Te) return node_fs.default.unlinkSync(s);
	let t = s + ".DELETE." + (0, node_crypto.randomBytes)(16).toString("hex");
	node_fs.default.renameSync(s, t), node_fs.default.unlinkSync(t);
};
var vr = (s, t, e) => s !== void 0 && s === s >>> 0 ? s : t !== void 0 && t === t >>> 0 ? t : e;
var Xt = class extends rt {
	[gs] = !1;
	[Oe] = !1;
	[Ri] = 0;
	reservations = new yi();
	transform;
	writable = !0;
	readable = !1;
	uid;
	gid;
	setOwner;
	preserveOwner;
	processGid;
	processUid;
	maxDepth;
	forceChown;
	win32;
	newer;
	keep;
	noMtime;
	preservePaths;
	unlink;
	cwd;
	strip;
	processUmask;
	umask;
	dmode;
	fmode;
	chmod;
	constructor(t = {}) {
		if (t.ondone = () => {
			this[gs] = !0, this[bs]();
		}, super(t), this.transform = t.transform, this.chmod = !!t.chmod, typeof t.uid == "number" || typeof t.gid == "number") {
			if (typeof t.uid != "number" || typeof t.gid != "number") throw new TypeError("cannot set owner without number uid and gid");
			if (t.preserveOwner) throw new TypeError("cannot preserve owner in archive and also set owner explicitly");
			this.uid = t.uid, this.gid = t.gid, this.setOwner = !0;
		} else this.uid = void 0, this.gid = void 0, this.setOwner = !1;
		this.preserveOwner = t.preserveOwner === void 0 && typeof t.uid != "number" ? process.getuid?.() === 0 : !!t.preserveOwner, this.processUid = (this.preserveOwner || this.setOwner) && process.getuid ? process.getuid() : void 0, this.processGid = (this.preserveOwner || this.setOwner) && process.getgid ? process.getgid() : void 0, this.maxDepth = typeof t.maxDepth == "number" ? t.maxDepth : uo, this.forceChown = t.forceChown === !0, this.win32 = !!t.win32 || Te, this.newer = !!t.newer, this.keep = !!t.keep, this.noMtime = !!t.noMtime, this.preservePaths = !!t.preservePaths, this.unlink = !!t.unlink, this.cwd = f(node_path.default.resolve(t.cwd || process.cwd())), this.strip = Number(t.strip) || 0, this.processUmask = this.chmod ? typeof t.processUmask == "number" ? t.processUmask : Lr() : 0, this.umask = typeof t.umask == "number" ? t.umask : this.processUmask, this.dmode = t.dmode || 511 & ~this.umask, this.fmode = t.fmode || 438 & ~this.umask, this.on("entry", (e) => this[Dr](e));
	}
	warn(t, e, i = {}) {
		return (t === "TAR_BAD_ARCHIVE" || t === "TAR_ABORT") && (i.recoverable = !1), super.warn(t, e, i);
	}
	[bs]() {
		this[gs] && this[Ri] === 0 && (this.emit("prefinish"), this.emit("finish"), this.emit("end"));
	}
	[Rs](t, e) {
		let i = t[e], { type: r } = t;
		if (!i || this.preservePaths) return !0;
		let [n, o] = ce(i), h = o.replaceAll(/\\/g, "/").split("/");
		if (h.includes("..") || Te && /^[a-z]:\.\.$/i.test(h[0] ?? "")) {
			if (e === "path" || r === "Link") return this.warn("TAR_ENTRY_ERROR", `${e} contains '..'`, {
				entry: t,
				[e]: i
			}), !1;
			let a = node_path.default.posix.dirname(t.path), l = node_path.default.posix.normalize(node_path.default.posix.join(a, h.join("/")));
			if (l.startsWith("../") || l === "..") return this.warn("TAR_ENTRY_ERROR", `${e} escapes extraction directory`, {
				entry: t,
				[e]: i
			}), !1;
		}
		return n && (t[e] = String(o), this.warn("TAR_ENTRY_INFO", `stripping ${n} from absolute ${e}`, {
			entry: t,
			[e]: i
		})), !0;
	}
	[Fr](t) {
		let e = f(t.path), i = e.split("/");
		if (this.strip) {
			if (i.length < this.strip) return !1;
			if (t.type === "Link") {
				let r = f(String(t.linkpath)).split("/");
				if (r.length >= this.strip) t.linkpath = r.slice(this.strip).join("/");
				else return !1;
			}
			i.splice(0, this.strip), t.path = i.join("/");
		}
		if (isFinite(this.maxDepth) && i.length > this.maxDepth) return this.warn("TAR_ENTRY_ERROR", "path excessively deep", {
			entry: t,
			path: e,
			depth: i.length,
			maxDepth: this.maxDepth
		}), !1;
		if (!this[Rs](t, "path") || !this[Rs](t, "linkpath")) return !1;
		if (t.absolute = node_path.default.isAbsolute(t.path) ? f(node_path.default.resolve(t.path)) : f(node_path.default.resolve(this.cwd, t.path)), !this.preservePaths && typeof t.absolute == "string" && t.absolute.indexOf(this.cwd + "/") !== 0 && t.absolute !== this.cwd) return this.warn("TAR_ENTRY_ERROR", "path escaped extraction target", {
			entry: t,
			path: f(t.path),
			resolvedPath: t.absolute,
			cwd: this.cwd
		}), !1;
		if (t.absolute === this.cwd && t.type !== "Directory" && t.type !== "GNUDumpDir") return !1;
		if (this.win32) {
			let { root: r } = node_path.default.win32.parse(String(t.absolute));
			t.absolute = r + ts(String(t.absolute).slice(r.length));
			let { root: n } = node_path.default.win32.parse(t.path);
			t.path = n + ts(t.path.slice(n.length));
		}
		return !0;
	}
	[Dr](t) {
		if (!this[Fr](t)) return t.resume();
		switch (node_assert.default.equal(typeof t.absolute, "string"), t.type) {
			case "Directory":
			case "GNUDumpDir": t.mode && (t.mode = t.mode | 448);
			case "File":
			case "OldFile":
			case "ContiguousFile":
			case "Link":
			case "SymbolicLink": return this[_s](t);
			default: return this[Cr](t);
		}
	}
	[O](t, e) {
		t.name === "CwdError" ? this.emit("error", t) : (this.warn("TAR_ENTRY_ERROR", t, { entry: e }), this[$t](), e.resume());
	}
	[yt](t, e, i) {
		gr(f(t), {
			uid: this.uid,
			gid: this.gid,
			processUid: this.processUid,
			processGid: this.processGid,
			umask: this.processUmask,
			preserve: this.preservePaths,
			unlink: this.unlink,
			cwd: this.cwd,
			mode: e
		}, i);
	}
	[ge](t) {
		return this.forceChown || this.preserveOwner && (typeof t.uid == "number" && t.uid !== this.processUid || typeof t.gid == "number" && t.gid !== this.processGid) || typeof this.uid == "number" && this.uid !== this.processUid || typeof this.gid == "number" && this.gid !== this.processGid;
	}
	[be](t) {
		return vr(this.uid, t.uid, this.processUid);
	}
	[_e](t) {
		return vr(this.gid, t.gid, this.processGid);
	}
	[Ts](t, e) {
		let i = typeof t.mode == "number" ? t.mode & 4095 : this.fmode, r = new et(String(t.absolute), {
			flags: ms(t.size),
			mode: i,
			autoClose: !1
		});
		r.on("error", (a) => {
			r.fd && node_fs.default.close(r.fd, () => {}), r.write = () => !0, this[O](a, t), e();
		});
		let n = 1, o = (a) => {
			if (a) {
				r.fd && node_fs.default.close(r.fd, () => {}), this[O](a, t), e();
				return;
			}
			--n === 0 && r.fd !== void 0 && node_fs.default.close(r.fd, (l) => {
				l ? this[O](l, t) : this[$t](), e();
			});
		};
		r.on("finish", () => {
			let a = String(t.absolute), l = r.fd;
			if (typeof l == "number" && t.mtime && !this.noMtime) {
				n++;
				let c = t.atime || /* @__PURE__ */ new Date(), d = t.mtime;
				node_fs.default.futimes(l, c, d, (y) => y ? node_fs.default.utimes(a, c, d, (T) => o(T && y)) : o());
			}
			if (typeof l == "number" && this[ge](t)) {
				n++;
				let c = this[be](t), d = this[_e](t);
				typeof c == "number" && typeof d == "number" && node_fs.default.fchown(l, c, d, (y) => y ? node_fs.default.chown(a, c, d, (T) => o(T && y)) : o());
			}
			o();
		});
		let h = this.transform && this.transform(t) || t;
		h !== t && (h.on("error", (a) => {
			this[O](a, t), e();
		}), t.pipe(h)), h.pipe(r);
	}
	[xs](t, e) {
		let i = typeof t.mode == "number" ? t.mode & 4095 : this.dmode;
		this[yt](String(t.absolute), i, (r) => {
			if (r) {
				this[O](r, t), e();
				return;
			}
			let n = 1, o = () => {
				--n === 0 && (e(), this[$t](), t.resume());
			};
			t.mtime && !this.noMtime && (n++, node_fs.default.utimes(String(t.absolute), t.atime || /* @__PURE__ */ new Date(), t.mtime, o)), this[ge](t) && (n++, node_fs.default.chown(String(t.absolute), Number(this[be](t)), Number(this[_e](t)), o)), o();
		});
	}
	[Cr](t) {
		t.unsupported = !0, this.warn("TAR_ENTRY_UNSUPPORTED", `unsupported entry type: ${t.type}`, { entry: t }), t.resume();
	}
	[Ar](t, e) {
		let i = f(node_path.default.relative(this.cwd, node_path.default.resolve(node_path.default.dirname(String(t.absolute)), String(t.linkpath)))).split("/");
		this[Re](t, this.cwd, i, () => this[gi](t, String(t.linkpath), "symlink", e), (r) => {
			this[O](r, t), e();
		});
	}
	[Ir](t, e) {
		let i = f(node_path.default.resolve(this.cwd, String(t.linkpath))), r = f(String(t.linkpath)).split("/");
		this[Re](t, this.cwd, r, () => this[gi](t, i, "link", e), (n) => {
			this[O](n, t), e();
		});
	}
	[Re](t, e, i, r, n) {
		let o = i.shift();
		if (this.preservePaths || o === void 0) return r();
		let h = node_path.default.resolve(e, o);
		node_fs.default.lstat(h, (a, l) => {
			if (a) return r();
			if (l?.isSymbolicLink()) return n(new St(h, node_path.default.resolve(h, i.join("/"))));
			this[Re](t, h, i, r, n);
		});
	}
	[kr]() {
		this[Ri]++;
	}
	[$t]() {
		this[Ri]--, this[bs]();
	}
	[Ls](t) {
		this[$t](), t.resume();
	}
	[Os](t, e) {
		return t.type === "File" && !this.unlink && e.isFile() && e.nlink <= 1 && !Te;
	}
	[_s](t) {
		this[kr]();
		let e = [t.path];
		t.linkpath && e.push(t.linkpath), this.reservations.reserve(e, (i) => this[Nr](t, i));
	}
	[Nr](t, e) {
		let i = (h) => {
			e(h);
		}, r = () => {
			this[yt](this.cwd, this.dmode, (h) => {
				if (h) {
					this[O](h, t), i();
					return;
				}
				this[Oe] = !0, n();
			});
		}, n = () => {
			if (t.absolute !== this.cwd) {
				let h = f(node_path.default.dirname(String(t.absolute)));
				if (h !== this.cwd) return this[yt](h, this.dmode, (a) => {
					if (a) {
						this[O](a, t), i();
						return;
					}
					o();
				});
			}
			o();
		}, o = () => {
			node_fs.default.lstat(String(t.absolute), (h, a) => {
				if (a && (this.keep || this.newer && a.mtime > (t.mtime ?? a.mtime))) {
					this[Ls](t), i();
					return;
				}
				if (h || this[Os](t, a)) return this[P](null, t, i);
				if (a.isDirectory()) {
					if (t.type === "Directory") {
						let l = this.chmod && t.mode && (a.mode & 4095) !== t.mode, c = (d) => this[P](d ?? null, t, i);
						return l ? node_fs.default.chmod(String(t.absolute), Number(t.mode), c) : c();
					}
					if (t.absolute !== this.cwd) return node_fs.default.rmdir(String(t.absolute), (l) => this[P](l ?? null, t, i));
				}
				if (t.absolute === this.cwd) return this[P](null, t, i);
				mo(String(t.absolute), (l) => this[P](l ?? null, t, i));
			});
		};
		this[Oe] ? n() : r();
	}
	[P](t, e, i) {
		if (t) {
			this[O](t, e), i();
			return;
		}
		switch (e.type) {
			case "File":
			case "OldFile":
			case "ContiguousFile": return this[Ts](e, i);
			case "Link": return this[Ir](e, i);
			case "SymbolicLink": return this[Ar](e, i);
			case "Directory":
			case "GNUDumpDir": return this[xs](e, i);
		}
	}
	[gi](t, e, i, r) {
		node_fs.default[i](e, String(t.absolute), (n) => {
			n ? this[O](n, t) : (this[$t](), t.resume()), r();
		});
	}
};
var ye = (s) => {
	try {
		return [null, s()];
	} catch (t) {
		return [t, null];
	}
};
var xe = class extends Xt {
	sync = !0;
	[P](t, e) {
		return super[P](t, e, () => {});
	}
	[_s](t) {
		if (!this[Oe]) {
			let n = this[yt](this.cwd, this.dmode);
			if (n) return this[O](n, t);
			this[Oe] = !0;
		}
		if (t.absolute !== this.cwd) {
			let n = f(node_path.default.dirname(String(t.absolute)));
			if (n !== this.cwd) {
				let o = this[yt](n, this.dmode);
				if (o) return this[O](o, t);
			}
		}
		let [e, i] = ye(() => node_fs.default.lstatSync(String(t.absolute)));
		if (i && (this.keep || this.newer && i.mtime > (t.mtime ?? i.mtime))) return this[Ls](t);
		if (e || this[Os](t, i)) return this[P](null, t);
		if (i.isDirectory()) {
			if (t.type === "Directory") {
				let [h] = this.chmod && t.mode && (i.mode & 4095) !== t.mode ? ye(() => {
					node_fs.default.chmodSync(String(t.absolute), Number(t.mode));
				}) : [];
				return this[P](h, t);
			}
			let [n] = ye(() => node_fs.default.rmdirSync(String(t.absolute)));
			this[P](n, t);
		}
		let [r] = t.absolute === this.cwd ? [] : ye(() => po(String(t.absolute)));
		this[P](r, t);
	}
	[Ts](t, e) {
		let i = typeof t.mode == "number" ? t.mode & 4095 : this.fmode, r = (h) => {
			let a;
			try {
				node_fs.default.closeSync(n);
			} catch (l) {
				a = l;
			}
			(h || a) && this[O](h || a, t), e();
		}, n;
		try {
			n = node_fs.default.openSync(String(t.absolute), ms(t.size), i);
		} catch (h) {
			return r(h);
		}
		let o = this.transform && this.transform(t) || t;
		o !== t && (o.on("error", (h) => this[O](h, t)), t.pipe(o)), o.on("data", (h) => {
			try {
				node_fs.default.writeSync(n, h, 0, h.length);
			} catch (a) {
				r(a);
			}
		}), o.on("end", () => {
			let h = null;
			if (t.mtime && !this.noMtime) {
				let a = t.atime || /* @__PURE__ */ new Date(), l = t.mtime;
				try {
					node_fs.default.futimesSync(n, a, l);
				} catch (c) {
					try {
						node_fs.default.utimesSync(String(t.absolute), a, l);
					} catch {
						h = c;
					}
				}
			}
			if (this[ge](t)) {
				let a = this[be](t), l = this[_e](t);
				try {
					node_fs.default.fchownSync(n, Number(a), Number(l));
				} catch (c) {
					try {
						node_fs.default.chownSync(String(t.absolute), Number(a), Number(l));
					} catch {
						h = h || c;
					}
				}
			}
			r(h);
		});
	}
	[xs](t, e) {
		let i = typeof t.mode == "number" ? t.mode & 4095 : this.dmode, r = this[yt](String(t.absolute), i);
		if (r) {
			this[O](r, t), e();
			return;
		}
		if (t.mtime && !this.noMtime) try {
			node_fs.default.utimesSync(String(t.absolute), t.atime || /* @__PURE__ */ new Date(), t.mtime);
		} catch {}
		if (this[ge](t)) try {
			node_fs.default.chownSync(String(t.absolute), Number(this[be](t)), Number(this[_e](t)));
		} catch {}
		e(), t.resume();
	}
	[yt](t, e) {
		try {
			return _r(f(t), {
				uid: this.uid,
				gid: this.gid,
				processUid: this.processUid,
				processGid: this.processGid,
				umask: this.processUmask,
				preserve: this.preservePaths,
				unlink: this.unlink,
				cwd: this.cwd,
				mode: e
			});
		} catch (i) {
			return i;
		}
	}
	[Re](t, e, i, r, n) {
		if (this.preservePaths || i.length === 0) return r();
		let o = e;
		for (let h of i) {
			o = node_path.default.resolve(o, h);
			let [a, l] = ye(() => node_fs.default.lstatSync(o));
			if (a) return r();
			if (l.isSymbolicLink()) return n(new St(o, node_path.default.resolve(e, i.join("/"))));
		}
		r();
	}
	[gi](t, e, i, r) {
		let n = `${i}Sync`;
		try {
			node_fs.default[n](e, String(t.absolute)), r(), t.resume();
		} catch (o) {
			return this[O](o, t);
		}
	}
};
var Eo = (s) => {
	let t = new xe(s), e = s.file, i = node_fs.default.statSync(e);
	new Be(e, {
		readSize: s.maxReadSize || 16777216,
		size: i.size
	}).pipe(t);
};
var wo = (s, t) => {
	let e = new Xt(s), i = s.maxReadSize || 16777216, r = s.file;
	return new Promise((o, h) => {
		e.on("error", h), e.on("close", o), node_fs.default.stat(r, (a, l) => {
			if (a) h(a);
			else {
				let c = new _t(r, {
					readSize: i,
					size: l.size
				});
				c.on("error", h), c.pipe(e);
			}
		});
	});
};
K(Eo, wo, (s) => new xe(s), (s) => new Xt(s), (s, t) => {
	t?.length && Qi(s, t);
});
var yo = (s, t) => {
	let e = new kt(s), i = !0, r, n;
	try {
		try {
			r = node_fs.default.openSync(s.file, "r+");
		} catch (a) {
			if (a?.code === "ENOENT") r = node_fs.default.openSync(s.file, "w+");
			else throw a;
		}
		let o = node_fs.default.fstatSync(r), h = Buffer.alloc(512);
		t: for (n = 0; n < o.size; n += 512) {
			for (let c = 0, d = 0; c < 512; c += d) {
				if (d = node_fs.default.readSync(r, h, c, h.length - c, n + c), n === 0 && h[0] === 31 && h[1] === 139) throw new Error("cannot append to compressed archives");
				if (!d) break t;
			}
			let a = new F(h);
			if (!a.cksumValid) break;
			let l = 512 * Math.ceil((a.size || 0) / 512);
			if (n + l + 512 > o.size) break;
			n += l, s.mtimeCache && a.mtime && s.mtimeCache.set(String(a.path), a.mtime);
		}
		i = !1, Ro(s, e, n, r, t);
	} finally {
		if (i) try {
			node_fs.default.closeSync(r);
		} catch {}
	}
};
var Ro = (s, t, e, i, r) => {
	let n = new Wt(s.file, {
		fd: i,
		start: e
	});
	t.pipe(n), bo(t, r);
};
var go = (s, t) => {
	t = Array.from(t);
	let e = new wt(s), i = (n, o, h) => {
		let a = (T, D) => {
			T ? node_fs.default.close(n, (E) => h(T)) : h(null, D);
		}, l = 0;
		if (o === 0) return a(null, 0);
		let c = 0, d = Buffer.alloc(512), y = (T, D) => {
			if (T || D === void 0) return a(T);
			if (c += D, c < 512 && D) return node_fs.default.read(n, d, c, d.length - c, l + c, y);
			if (l === 0 && d[0] === 31 && d[1] === 139) return a(/* @__PURE__ */ new Error("cannot append to compressed archives"));
			if (c < 512) return a(null, l);
			let E = new F(d);
			if (!E.cksumValid) return a(null, l);
			let x = 512 * Math.ceil((E.size ?? 0) / 512);
			if (l + x + 512 > o || (l += x + 512, l >= o)) return a(null, l);
			s.mtimeCache && E.mtime && s.mtimeCache.set(String(E.path), E.mtime), c = 0, node_fs.default.read(n, d, 0, 512, l, y);
		};
		node_fs.default.read(n, d, 0, 512, l, y);
	};
	return new Promise((n, o) => {
		e.on("error", o);
		let h = "r+", a = (l, c) => {
			if (l && l.code === "ENOENT" && h === "r+") return h = "w+", node_fs.default.open(s.file, h, a);
			if (l || !c) return o(l);
			node_fs.default.fstat(c, (d, y) => {
				if (d) return node_fs.default.close(c, () => o(d));
				i(c, y.size, (T, D) => {
					if (T) return o(T);
					let E = new et(s.file, {
						fd: c,
						start: D
					});
					e.pipe(E), E.on("error", o), E.on("close", n), _o(e, t);
				});
			});
		};
		node_fs.default.open(s.file, h, a);
	});
};
var bo = (s, t) => {
	t.forEach((e) => {
		e.charAt(0) === "@" ? Ct({
			file: node_path.default.resolve(s.cwd, e.slice(1)),
			sync: !0,
			noResume: !0,
			onReadEntry: (i) => s.add(i)
		}) : s.add(e);
	}), s.end();
};
var _o = async (s, t) => {
	for (let e of t) e.charAt(0) === "@" ? await Ct({
		file: node_path.default.resolve(String(s.cwd), e.slice(1)),
		noResume: !0,
		onReadEntry: (i) => s.add(i)
	}) : s.add(e);
	s.end();
};
var vt = K(yo, go, () => {
	throw new TypeError("file is required");
}, () => {
	throw new TypeError("file is required");
}, (s, t) => {
	if (!Bs(s)) throw new TypeError("file is required");
	if (s.gzip || s.brotli || s.zstd || s.file.endsWith(".br") || s.file.endsWith(".tbr")) throw new TypeError("cannot append to compressed archives");
	if (!t?.length) throw new TypeError("no paths specified to add/replace");
});
K(vt.syncFile, vt.asyncFile, vt.syncNoFile, vt.asyncNoFile, (s, t = []) => {
	vt.validate?.(s, t), To(s);
});
var To = (s) => {
	let t = s.filter;
	s.mtimeCache || (s.mtimeCache = /* @__PURE__ */ new Map()), s.filter = t ? (e, i) => t(e, i) && !((s.mtimeCache?.get(e) ?? i.mtime ?? 0) > (i.mtime ?? 0)) : (e, i) => !((s.mtimeCache?.get(e) ?? i.mtime ?? 0) > (i.mtime ?? 0));
};
//#endregion
//#region src/install/verify.ts
/** Every digest a spec or the registry may ask for, in one pass over the file. */
async function fileDigests(file) {
	const sha512 = (0, node_crypto.createHash)("sha512");
	const sha256 = (0, node_crypto.createHash)("sha256");
	const sha224 = (0, node_crypto.createHash)("sha224");
	await (0, node_stream_promises.pipeline)((0, node_fs.createReadStream)(file), new node_stream.Transform({ transform(chunk, _encoding, callback) {
		sha512.update(chunk);
		sha256.update(chunk);
		sha224.update(chunk);
		callback();
	} }));
	const sha512Digest = sha512.digest();
	return {
		sha512: `sha512-${sha512Digest.toString("base64")}`,
		sha512hex: sha512Digest.toString("hex"),
		sha256hex: sha256.digest("hex"),
		sha224hex: sha224.digest("hex")
	};
}
function integrityFailure(expected, actual, detail) {
	return new require_messages.NpmVmError("M-INTEGRITY", require_messages.EXIT.verification, require_messages.integrityMessage(expected, actual, detail));
}
/** The tarball must match the registry's integrity and, when the project pins hashes, one of them (spec SEC-2). */
function checkIntegrity(digests, integrity, hashes) {
	if (digests.sha512 !== integrity.trim()) throw integrityFailure(integrity, digests.sha512, "the tarball does not match the registry integrity");
	if (hashes.length === 0) return;
	const actual = {
		sha512: digests.sha512hex,
		sha256: digests.sha256hex,
		sha224: digests.sha224hex
	};
	if (!hashes.some((hash) => actual[hash.algorithm] === hash.hex)) {
		const [first] = hashes;
		throw integrityFailure(`${first.algorithm}.${first.hex}`, `${first.algorithm}.${actual[first.algorithm]}`, "the tarball does not match the pinned hash");
	}
}
/**
* Checks the registry signatures over `name@version:integrity` against the pinned keyring (spec SEC-1).
* Returns the key id that verified; throws M-KEY for an unknown key and M-UNSIGNED when no signature is usable.
*/
async function verifySignatures(input) {
	if (input.signatures.length === 0) {
		if (input.pinned) return null;
		throw new require_messages.NpmVmError("M-UNSIGNED", require_messages.EXIT.verification, require_messages.unsignedMessage(input.registry, input.version));
	}
	const payload = Buffer.from(`${input.name}@${input.version}:${input.integrity}`, "utf8");
	let unknown = null;
	for (const signature of input.signatures) {
		const key = input.keys.find((entry) => entry.keyid === signature.keyid);
		if (key === void 0) {
			unknown ??= signature.keyid;
			continue;
		}
		if (key.revoked === true || !await keyCurrent(key, input.publishedAt)) continue;
		const publicKey = (0, node_crypto.createPublicKey)({
			key: Buffer.from(key.key, "base64"),
			format: "der",
			type: "spki"
		});
		if ((0, node_crypto.verify)("sha256", payload, publicKey, Buffer.from(signature.sig, "base64"))) return key.keyid;
	}
	if (unknown !== null) throw new require_messages.NpmVmError("M-KEY", require_messages.EXIT.verification, require_messages.keyMessage(unknown));
	throw new require_messages.NpmVmError("M-UNSIGNED", require_messages.EXIT.verification, require_messages.unsignedMessage(input.registry, input.version));
}
/** An expired key still vouches for versions published before it expired; an unknown time fails closed. */
async function keyCurrent(key, publishedAt) {
	if (key.expires === null) return true;
	const published = await publishedAt();
	return published !== null && Date.parse(published) < Date.parse(key.expires);
}
const DEFAULT_LIMITS = {
	maxEntries: 1e4,
	maxBytes: 268435456
};
function unsafe(detail) {
	return integrityFailure("a safe npm tarball", "an unsafe entry", detail);
}
/** The destination-relative path of a tarball entry, or a thrown M-INTEGRITY for anything outside `package/` (spec SEC-3). */
function entryRelativePath(path) {
	if (path.includes("\\") || [...path].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) throw unsafe(`entry name contains a control character or backslash: ${JSON.stringify(path)}`);
	if (path.startsWith("/") || /^[A-Za-z]:/.test(path)) throw unsafe(`absolute entry name: ${path}`);
	const segments = path.split("/").filter((segment) => segment !== "" && segment !== ".");
	if (segments.includes("..")) throw unsafe(`entry name climbs out of the archive: ${path}`);
	if (segments[0] !== "package") throw unsafe(`entry outside package/: ${path}`);
	return segments.length === 1 ? "" : node_path.posix.join(...segments.slice(1));
}
/**
* Extracts regular files and directories under `package/` into `dest`, rejecting everything else (spec SEC-3).
* Modes are `0644` or `0755` by the owner exec bit; ownership and extended attributes are ignored.
*/
async function safeExtract(tarball, dest, limits = DEFAULT_LIMITS) {
	let entries = 0;
	let bytes = 0;
	let decompressed = 0;
	const writes = [];
	const parser = new rt({ strict: true });
	let aborted = null;
	const abort = (error) => {
		aborted ??= error;
		parser.abort(error);
	};
	parser.on("entry", (entry) => {
		try {
			entries += 1;
			bytes += entry.size;
			if (entries > limits.maxEntries) throw unsafe(`more than ${limits.maxEntries} entries`);
			if (bytes > limits.maxBytes) throw unsafe(`more than ${limits.maxBytes} bytes`);
			const relative = entryRelativePath(entry.path);
			const target = relative === "" ? dest : (0, node_path.join)(dest, relative);
			if (entry.type === "Directory") {
				(0, node_fs.mkdirSync)(target, {
					recursive: true,
					mode: 493
				});
				entry.resume();
				return;
			}
			if (entry.type !== "File" || relative === "") throw unsafe(`${entry.type} entry: ${entry.path}`);
			(0, node_fs.mkdirSync)((0, node_path.dirname)(target), {
				recursive: true,
				mode: 493
			});
			const mode = ((entry.mode ?? 420) & 64) === 0 ? 420 : 493;
			writes.push((0, node_stream_promises.pipeline)(entry, (0, node_fs.createWriteStream)(target, { mode })));
		} catch (error) {
			abort(error);
		}
	});
	const counter = new node_stream.Transform({ transform(chunk, _encoding, callback) {
		decompressed += chunk.length;
		if (decompressed > limits.maxBytes) {
			callback(unsafe(`more than ${limits.maxBytes} bytes after decompression`));
			return;
		}
		callback(null, chunk);
	} });
	const done = new Promise((resolve, reject) => {
		parser.on("end", () => resolve());
		parser.on("error", (error) => reject(error));
	});
	done.catch(() => void 0);
	try {
		await (0, node_stream_promises.pipeline)((0, node_fs.createReadStream)(tarball), (0, node_zlib.createGunzip)(), counter, parser);
		await done;
		await Promise.all(writes);
	} catch (error) {
		await Promise.allSettled(writes);
		throw aborted ?? (error instanceof require_messages.NpmVmError ? error : unsafe(`cannot read the tarball: ${error.message}`));
	}
	if (aborted !== null) throw aborted;
}
const VERIFIED_FILE = ".verified";
function writeVerified(dir, verified) {
	(0, node_fs.writeFileSync)((0, node_path.join)(dir, VERIFIED_FILE), JSON.stringify(verified), { mode: 384 });
}
function readVerified(dir) {
	try {
		const parsed = JSON.parse((0, node_fs.readFileSync)((0, node_path.join)(dir, VERIFIED_FILE), "utf8"));
		if (typeof parsed.version !== "string" || typeof parsed.integrity !== "string") return null;
		if (typeof parsed.sha256 !== "string" || typeof parsed.sha224 !== "string") return null;
		return {
			version: parsed.version,
			integrity: parsed.integrity,
			keyid: typeof parsed.keyid === "string" ? parsed.keyid : null,
			sha256: parsed.sha256,
			sha224: parsed.sha224,
			verifiedAt: typeof parsed.verifiedAt === "string" ? parsed.verifiedAt : ""
		};
	} catch {
		return null;
	}
}
/** `<version>-<16 hex of the integrity>`: two registries serving different bytes get two entries (spec SEC-4). */
function entryName(version, integrity) {
	const hex = sriHex(integrity);
	if (hex === null) throw new Error(`not a sha512 integrity: ${integrity}`);
	return `${version}-${hex.slice(0, 16)}`;
}
/** Where verified entries are staged before the rename into `npm/`: same filesystem, so the rename stays atomic. */
function stagingDir(cacheRoot) {
	return (0, node_path.join)(cacheRoot, "staging");
}
function canonicalEntry(cacheRoot, version, integrity) {
	return (0, node_path.join)(cacheRoot, "npm", entryName(version, integrity));
}
function privateEntry(canonical, token) {
	return `${canonical}.${token}`;
}
/** Whether a directory name under `npm/` is an entry rather than a lease dir, a gate or a deletion in progress. */
function isEntryName(name) {
	return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?-[0-9a-f]{16}(?:\.[0-9a-f]{16})?$/.test(name);
}
function readManifest(dir) {
	try {
		const pkg = JSON.parse((0, node_fs.readFileSync)((0, node_path.join)(dir, "package.json"), "utf8"));
		const engines = pkg["engines"];
		const node = typeof engines === "object" && engines !== null ? engines["node"] : void 0;
		return {
			name: pkg["name"],
			version: pkg["version"],
			enginesNode: typeof node === "string" ? node : null
		};
	} catch {
		return null;
	}
}
/**
* Whether an entry may run (spec SEC-5): verified for this integrity, owned by the current user,
* and holding the npm it claims. Never deletes anything.
*/
function validateEntry(entryPath, integrity) {
	try {
		const stat = (0, node_fs.statSync)(entryPath);
		if (!stat.isDirectory() || process.getuid !== void 0 && stat.uid !== process.getuid()) return false;
	} catch {
		return false;
	}
	const verified = readVerified(entryPath);
	if (verified === null || verified.integrity !== integrity) return false;
	const manifest = readManifest(entryPath);
	return manifest !== null && manifest.name === "npm" && manifest.version === verified.version;
}
/** Every verified entry in the cache as a candidate, whatever its validity; use-time validation decides. */
function listEntries(cacheRoot, keys = []) {
	let names;
	try {
		names = (0, node_fs.readdirSync)((0, node_path.join)(cacheRoot, "npm"));
	} catch {
		return [];
	}
	const candidates = [];
	for (const name of names) {
		if (!isEntryName(name)) continue;
		const entryPath = (0, node_path.join)(cacheRoot, "npm", name);
		const verified = readVerified(entryPath);
		const manifest = readManifest(entryPath);
		if (verified === null || manifest === null || manifest.version !== verified.version) continue;
		if (verified.keyid !== null && keys.some((key) => key.keyid === verified.keyid && key.revoked === true)) continue;
		candidates.push({
			version: verified.version,
			enginesNode: manifest.enginesNode,
			integrity: verified.integrity,
			entryPath,
			signatures: null,
			keyid: verified.keyid,
			digests: {
				sha256: verified.sha256,
				sha224: verified.sha224
			}
		});
	}
	return candidates;
}
function isCollision(error) {
	const code = error.code;
	return code === "EEXIST" || code === "ENOTEMPTY" || code === "EPERM" || code === "EISDIR";
}
/**
* Moves a verified temp dir into the cache under a lease (spec SEC-4). The lease exists before the
* rename, so a prune never sees the entry without it; a lost race reuses or sidesteps the winner's entry.
*/
function publishEntry(tempDir, canonical, integrity, owner) {
	const lease = require_lease.createLease(canonical, owner);
	if ((0, node_fs.existsSync)(require_lease.gatePath(canonical)) && require_lease.ownerLive(require_lease.gatePath(canonical))) {
		lease.release();
		return publishPrivately(tempDir, canonical, owner);
	}
	if (!require_lease.leaseSurvived(lease)) return publishEntry(tempDir, canonical, integrity, owner);
	try {
		(0, node_fs.renameSync)(tempDir, canonical);
		return {
			entryPath: canonical,
			lease
		};
	} catch (error) {
		if (!isCollision(error)) {
			lease.release();
			throw error;
		}
	}
	if (validateEntry(canonical, integrity)) {
		(0, node_fs.rmSync)(tempDir, {
			recursive: true,
			force: true
		});
		return {
			entryPath: canonical,
			lease
		};
	}
	lease.release();
	return publishPrivately(tempDir, canonical, owner);
}
function publishPrivately(tempDir, canonical, owner) {
	for (;;) {
		const entryPath = privateEntry(canonical, require_lease.newToken());
		const privateLease = require_lease.createLease(entryPath, owner);
		if ((0, node_fs.existsSync)(require_lease.gatePath(entryPath)) && require_lease.ownerLive(require_lease.gatePath(entryPath))) {
			privateLease.release();
			continue;
		}
		if (!require_lease.leaseSurvived(privateLease)) continue;
		try {
			(0, node_fs.renameSync)(tempDir, entryPath);
		} catch (error) {
			privateLease.release();
			throw error;
		}
		return {
			entryPath,
			lease: privateLease
		};
	}
}
//#endregion
//#region src/state/prune.ts
const USED_SUFFIX = ".used";
/** Records a resolution of `entry` for the prune age, in a sidecar so the entry itself stays untouched. */
function touchUsed(entry) {
	const marker = `${entry}${USED_SUFFIX}`;
	try {
		const now = /* @__PURE__ */ new Date();
		(0, node_fs.utimesSync)(marker, now, now);
	} catch {
		(0, node_fs.writeFileSync)(marker, "", { flag: "a" });
	}
}
function lastUsed(entry) {
	try {
		return (0, node_fs.statSync)(`${entry}${USED_SUFFIX}`).mtimeMs;
	} catch {
		return null;
	}
}
/** Why one entry would go, or null to keep it. */
function pruneReason(cacheRoot, name, options) {
	const entry = (0, node_path.join)(cacheRoot, "npm", name);
	if (name.includes(".deleting.")) return "leftover";
	if (!isEntryName(name)) return null;
	const verified = readVerified(entry);
	if (verified === null || !validateEntry(entry, verified.integrity)) return "invalid";
	if (/\.[0-9a-f]{16}$/.test(name) && !require_lease.listLeases(entry).some((lease) => require_lease.ownerLive(lease))) return "orphan-private";
	const used = lastUsed(entry);
	return (options.now ?? Date.now()) - (used ?? (0, node_fs.statSync)(entry).mtimeMs) > options.maxAgeMs ? "stale" : null;
}
/**
* Removes one entry the exclusive way (spec LEASE-1): gate, drop dead leases, bail on a live one, rename aside, drop the gate, delete.
* After the gate is gone nothing here touches the entry's paths again.
*/
function pruneEntry(entry, owner) {
	if ((0, node_fs.existsSync)(require_lease.gatePath(entry)) && !require_lease.ownerLive(require_lease.gatePath(entry))) require_lease.removeGate(entry);
	if (!require_lease.createGate(entry, owner)) return false;
	for (const lease of require_lease.listLeases(entry)) if (!require_lease.ownerLive(lease)) (0, node_fs.rmSync)(lease, { force: true });
	if (require_lease.listLeases(entry).length > 0) {
		require_lease.removeGate(entry);
		return false;
	}
	const token = require_lease.newToken();
	const deletingEntry = `${entry}.deleting.${token}`;
	const deletingLeases = `${entry}.leases.deleting.${token}`;
	if ((0, node_fs.existsSync)(entry)) require_atomic.atomicRename(entry, deletingEntry);
	if ((0, node_fs.existsSync)(require_lease.leasesDir(entry))) require_atomic.atomicRename(require_lease.leasesDir(entry), deletingLeases);
	require_lease.removeGate(entry);
	require_atomic.removeWithRetry(deletingEntry);
	require_atomic.removeWithRetry(deletingLeases);
	(0, node_fs.rmSync)(`${entry}${USED_SUFFIX}`, { force: true });
	return true;
}
const STAGING_MAX_AGE_MS = 864e5;
/** Work dirs a crashed extraction left under `staging/`; a live one is never a day old. */
function pruneStaging(cacheRoot, now) {
	let names;
	try {
		names = (0, node_fs.readdirSync)(stagingDir(cacheRoot));
	} catch {
		return;
	}
	for (const name of names) {
		const dir = (0, node_path.join)(stagingDir(cacheRoot), name);
		try {
			if (now - (0, node_fs.statSync)(dir).mtimeMs > STAGING_MAX_AGE_MS) require_atomic.removeWithRetry(dir);
		} catch {}
	}
}
/** Prunes the whole cache; the caller holds the exclusive lock (MUT-1) so only one prune ever runs. */
function pruneCache(cacheRoot, owner, options) {
	const report = {
		removed: [],
		kept: [],
		skipped: []
	};
	pruneStaging(cacheRoot, options.now ?? Date.now());
	let names;
	try {
		names = (0, node_fs.readdirSync)((0, node_path.join)(cacheRoot, "npm"));
	} catch {
		return report;
	}
	for (const name of names) {
		const entry = (0, node_path.join)(cacheRoot, "npm", name);
		if (name.endsWith(".leases") && (0, node_fs.existsSync)(entry) && !(0, node_fs.existsSync)(entry.slice(0, -7))) {
			(pruneEntry(entry.slice(0, -7), owner) ? report.removed : report.skipped).push(name);
			continue;
		}
		if (name.endsWith(".prune") && !(0, node_fs.existsSync)(entry.slice(0, -6)) && !require_lease.ownerLive(entry)) {
			(0, node_fs.rmSync)(entry, { force: true });
			report.removed.push(name);
			continue;
		}
		const reason = pruneReason(cacheRoot, name, options);
		if (reason === null) {
			if (isEntryName(name)) report.kept.push(name);
			continue;
		}
		if (reason === "leftover") {
			require_atomic.removeWithRetry(entry);
			report.removed.push(name);
			continue;
		}
		if (pruneEntry(entry, owner)) report.removed.push(name);
		else report.skipped.push(name);
	}
	return report;
}
//#endregion
//#region ../../node_modules/.pnpm/walk-up-path@4.0.0/node_modules/walk-up-path/dist/commonjs/index.js
var require_commonjs = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.walkUp = void 0;
	const path_1 = require("path");
	const walkUp = function* (path$7) {
		for (path$7 = (0, path_1.resolve)(path$7); path$7;) {
			yield path$7;
			const pp = (0, path_1.dirname)(path$7);
			if (pp === path$7) break;
			else path$7 = pp;
		}
	};
	exports.walkUp = walkUp;
}));
//#endregion
//#region ../../node_modules/.pnpm/ini@6.0.0/node_modules/ini/lib/ini.js
var require_ini = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const { hasOwnProperty } = Object.prototype;
	const encode = (obj, opt = {}) => {
		if (typeof opt === "string") opt = { section: opt };
		opt.align = opt.align === true;
		opt.newline = opt.newline === true;
		opt.sort = opt.sort === true;
		opt.whitespace = opt.whitespace === true || opt.align === true;
		/* istanbul ignore next */
		opt.platform = opt.platform || typeof process !== "undefined" && process.platform;
		opt.bracketedArray = opt.bracketedArray !== false;
		/* istanbul ignore next */
		const eol = opt.platform === "win32" ? "\r\n" : "\n";
		const separator = opt.whitespace ? " = " : "=";
		const children = [];
		const keys = opt.sort ? Object.keys(obj).sort() : Object.keys(obj);
		let padToChars = 0;
		if (opt.align) padToChars = safe(keys.filter((k) => obj[k] === null || Array.isArray(obj[k]) || typeof obj[k] !== "object").map((k) => Array.isArray(obj[k]) ? `${k}[]` : k).concat([""]).reduce((a, b) => safe(a).length >= safe(b).length ? a : b)).length;
		let out = "";
		const arraySuffix = opt.bracketedArray ? "[]" : "";
		for (const k of keys) {
			const val = obj[k];
			if (val && Array.isArray(val)) for (const item of val) out += safe(`${k}${arraySuffix}`).padEnd(padToChars, " ") + separator + safe(item) + eol;
			else if (val && typeof val === "object") children.push(k);
			else out += safe(k).padEnd(padToChars, " ") + separator + safe(val) + eol;
		}
		if (opt.section && out.length) out = "[" + safe(opt.section) + "]" + (opt.newline ? eol + eol : eol) + out;
		for (const k of children) {
			const nk = splitSections(k, ".").join("\\.");
			const section = (opt.section ? opt.section + "." : "") + nk;
			const child = encode(obj[k], {
				...opt,
				section
			});
			if (out.length && child.length) out += eol;
			out += child;
		}
		return out;
	};
	function splitSections(str, separator) {
		var lastMatchIndex = 0;
		var lastSeparatorIndex = 0;
		var nextIndex = 0;
		var sections = [];
		do {
			nextIndex = str.indexOf(separator, lastMatchIndex);
			if (nextIndex !== -1) {
				lastMatchIndex = nextIndex + separator.length;
				if (nextIndex > 0 && str[nextIndex - 1] === "\\") continue;
				sections.push(str.slice(lastSeparatorIndex, nextIndex));
				lastSeparatorIndex = nextIndex + separator.length;
			}
		} while (nextIndex !== -1);
		sections.push(str.slice(lastSeparatorIndex));
		return sections;
	}
	const decode = (str, opt = {}) => {
		opt.bracketedArray = opt.bracketedArray !== false;
		const out = Object.create(null);
		let p = out;
		let section = null;
		const re = /^\[([^\]]*)\]\s*$|^([^=]+)(=(.*))?$/i;
		const lines = str.split(/[\r\n]+/g);
		const duplicates = {};
		for (const line of lines) {
			if (!line || line.match(/^\s*[;#]/) || line.match(/^\s*$/)) continue;
			const match = line.match(re);
			if (!match) continue;
			if (match[1] !== void 0) {
				section = unsafe(match[1]);
				if (section === "__proto__") {
					p = Object.create(null);
					continue;
				}
				p = out[section] = out[section] || Object.create(null);
				continue;
			}
			const keyRaw = unsafe(match[2]);
			let isArray;
			if (opt.bracketedArray) isArray = keyRaw.length > 2 && keyRaw.slice(-2) === "[]";
			else {
				duplicates[keyRaw] = (duplicates?.[keyRaw] || 0) + 1;
				isArray = duplicates[keyRaw] > 1;
			}
			const key = isArray && keyRaw.endsWith("[]") ? keyRaw.slice(0, -2) : keyRaw;
			if (key === "__proto__") continue;
			const valueRaw = match[3] ? unsafe(match[4]) : true;
			const value = valueRaw === "true" || valueRaw === "false" || valueRaw === "null" ? JSON.parse(valueRaw) : valueRaw;
			if (isArray) {
				if (!hasOwnProperty.call(p, key)) p[key] = [];
				else if (!Array.isArray(p[key])) p[key] = [p[key]];
			}
			if (Array.isArray(p[key])) p[key].push(value);
			else p[key] = value;
		}
		const remove = [];
		for (const k of Object.keys(out)) {
			if (!hasOwnProperty.call(out, k) || typeof out[k] !== "object" || Array.isArray(out[k])) continue;
			const parts = splitSections(k, ".");
			p = out;
			const l = parts.pop();
			const nl = l.replace(/\\\./g, ".");
			for (const part of parts) {
				if (part === "__proto__") continue;
				if (!hasOwnProperty.call(p, part) || typeof p[part] !== "object") p[part] = Object.create(null);
				p = p[part];
			}
			if (p === out && nl === l) continue;
			p[nl] = out[k];
			remove.push(k);
		}
		for (const del of remove) delete out[del];
		return out;
	};
	const isQuoted = (val) => {
		return val.startsWith("\"") && val.endsWith("\"") || val.startsWith("'") && val.endsWith("'");
	};
	const safe = (val) => {
		if (typeof val !== "string" || val.match(/[=\r\n]/) || val.match(/^\[/) || val.length > 1 && isQuoted(val) || val !== val.trim()) return JSON.stringify(val);
		return val.split(";").join("\\;").split("#").join("\\#");
	};
	const unsafe = (val) => {
		val = (val || "").trim();
		if (isQuoted(val)) {
			if (val.charAt(0) === "'") val = val.slice(1, -1);
			try {
				val = JSON.parse(val);
			} catch {}
		} else {
			let esc = false;
			let unesc = "";
			for (let i = 0, l = val.length; i < l; i++) {
				const c = val.charAt(i);
				if (esc) {
					if ("\\;#".indexOf(c) !== -1) unesc += c;
					else unesc += "\\" + c;
					esc = false;
				} else if (";#".indexOf(c) !== -1) break;
				else if (c === "\\") esc = true;
				else unesc += c;
			}
			if (esc) unesc += "\\";
			return unesc.trim();
		}
		return val;
	};
	module.exports = {
		parse: decode,
		decode,
		stringify: encode,
		encode,
		safe,
		unsafe
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/abbrev@4.0.0/node_modules/abbrev/lib/index.js
var require_lib$13 = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	module.exports = abbrev;
	function abbrev(...args) {
		let list = args;
		if (args.length === 1 && (Array.isArray(args[0]) || typeof args[0] === "string")) list = [].concat(args[0]);
		for (let i = 0, l = list.length; i < l; i++) list[i] = typeof list[i] === "string" ? list[i] : String(list[i]);
		list = list.sort(lexSort);
		const abbrevs = {};
		let prev = "";
		for (let ii = 0, ll = list.length; ii < ll; ii++) {
			const current = list[ii];
			const next = list[ii + 1] || "";
			let nextMatches = true;
			let prevMatches = true;
			if (current === next) continue;
			let j = 0;
			const cl = current.length;
			for (; j < cl; j++) {
				const curChar = current.charAt(j);
				nextMatches = nextMatches && curChar === next.charAt(j);
				prevMatches = prevMatches && curChar === prev.charAt(j);
				if (!nextMatches && !prevMatches) {
					j++;
					break;
				}
			}
			prev = current;
			if (j === cl) {
				abbrevs[current] = current;
				continue;
			}
			for (let a = current.slice(0, j); j <= cl; j++) {
				abbrevs[a] = current;
				a += current.charAt(j);
			}
		}
		return abbrevs;
	}
	function lexSort(a, b) {
		return a === b ? 0 : a > b ? 1 : -1;
	}
}));
//#endregion
//#region ../../node_modules/.pnpm/nopt@9.0.0/node_modules/nopt/lib/debug.js
var require_debug = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	/* istanbul ignore next */
	module.exports = process.env.DEBUG_NOPT || process.env.NOPT_DEBUG ? (...a) => console.error(...a) : () => {};
}));
//#endregion
//#region ../../node_modules/.pnpm/nopt@9.0.0/node_modules/nopt/lib/type-defs.js
var require_type_defs$1 = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const url$1 = require("url");
	const path$6 = require("path");
	const Stream = require("stream").Stream;
	const os$2 = require("os");
	const debug = require_debug();
	function validateString(data, k, val) {
		data[k] = String(val);
	}
	function validatePath(data, k, val) {
		if (val === true) return false;
		if (val === null) return true;
		val = String(val);
		const homePattern = process.platform === "win32" ? /^~(\/|\\)/ : /^~\//;
		const home = os$2.homedir();
		if (home && val.match(homePattern)) data[k] = path$6.resolve(home, val.slice(2));
		else data[k] = path$6.resolve(val);
		return true;
	}
	function validateNumber(data, k, val) {
		debug("validate Number %j %j %j", k, val, isNaN(val));
		if (isNaN(val)) return false;
		data[k] = +val;
	}
	function validateDate(data, k, val) {
		const s = Date.parse(val);
		debug("validate Date %j %j %j", k, val, s);
		if (isNaN(s)) return false;
		data[k] = new Date(val);
	}
	function validateBoolean(data, k, val) {
		if (typeof val === "string") {
			if (!isNaN(val)) val = !!+val;
			else if (val === "null" || val === "false") val = false;
			else val = true;
		} else val = !!val;
		data[k] = val;
	}
	function validateUrl(data, k, val) {
		val = url$1.parse(String(val));
		if (!val.host) return false;
		data[k] = val.href;
	}
	function validateStream(data, k, val) {
		if (!(val instanceof Stream)) return false;
		data[k] = val;
	}
	module.exports = {
		String: {
			type: String,
			validate: validateString
		},
		Boolean: {
			type: Boolean,
			validate: validateBoolean
		},
		url: {
			type: url$1,
			validate: validateUrl
		},
		Number: {
			type: Number,
			validate: validateNumber
		},
		path: {
			type: path$6,
			validate: validatePath
		},
		Stream: {
			type: Stream,
			validate: validateStream
		},
		Date: {
			type: Date,
			validate: validateDate
		},
		Array: { type: Array }
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/nopt@9.0.0/node_modules/nopt/lib/nopt-lib.js
var require_nopt_lib = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const abbrev = require_lib$13();
	const debug = require_debug();
	const defaultTypeDefs = require_type_defs$1();
	const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
	const getType = (k, { types, dynamicTypes }) => {
		let hasType = hasOwn(types, k);
		let type = types[k];
		if (!hasType && typeof dynamicTypes === "function") {
			const matchedType = dynamicTypes(k);
			if (matchedType !== void 0) {
				type = matchedType;
				hasType = true;
			}
		}
		return [hasType, type];
	};
	const isTypeDef = (type, def) => def && type === def;
	const hasTypeDef = (type, def) => def && type.indexOf(def) !== -1;
	const doesNotHaveTypeDef = (type, def) => def && !hasTypeDef(type, def);
	function nopt(args, { types, shorthands, typeDefs, invalidHandler, unknownHandler, abbrevHandler, typeDefault, dynamicTypes } = {}) {
		debug(types, shorthands, args, typeDefs);
		const data = {};
		const argv = {
			remain: [],
			cooked: args,
			original: args.slice(0)
		};
		parse(args, data, argv.remain, {
			typeDefs,
			types,
			dynamicTypes,
			shorthands,
			unknownHandler,
			abbrevHandler
		});
		clean(data, {
			types,
			dynamicTypes,
			typeDefs,
			invalidHandler,
			typeDefault
		});
		data.argv = argv;
		Object.defineProperty(data.argv, "toString", {
			value: function() {
				return this.original.map(JSON.stringify).join(" ");
			},
			enumerable: false
		});
		return data;
	}
	function clean(data, { types = {}, typeDefs = {}, dynamicTypes, invalidHandler, typeDefault } = {}) {
		const StringType = typeDefs.String?.type;
		const NumberType = typeDefs.Number?.type;
		const ArrayType = typeDefs.Array?.type;
		const BooleanType = typeDefs.Boolean?.type;
		const DateType = typeDefs.Date?.type;
		const hasTypeDefault = typeof typeDefault !== "undefined";
		if (!hasTypeDefault) {
			typeDefault = [
				false,
				true,
				null
			];
			if (StringType) typeDefault.push(StringType);
			if (ArrayType) typeDefault.push(ArrayType);
		}
		const remove = {};
		Object.keys(data).forEach((k) => {
			if (k === "argv") return;
			let val = data[k];
			debug("val=%j", val);
			const isArray = Array.isArray(val);
			let [hasType, rawType] = getType(k, {
				types,
				dynamicTypes
			});
			let type = rawType;
			if (!isArray) val = [val];
			if (!type) type = typeDefault;
			if (isTypeDef(type, ArrayType)) type = typeDefault.concat(ArrayType);
			if (!Array.isArray(type)) type = [type];
			debug("val=%j", val);
			debug("types=", type);
			val = val.map((v) => {
				if (typeof v === "string") {
					debug("string %j", v);
					v = v.trim();
					if (v === "null" && ~type.indexOf(null) || v === "true" && (~type.indexOf(true) || hasTypeDef(type, BooleanType)) || v === "false" && (~type.indexOf(false) || hasTypeDef(type, BooleanType))) {
						v = JSON.parse(v);
						debug("jsonable %j", v);
					} else if (hasTypeDef(type, NumberType) && !isNaN(v)) {
						debug("convert to number", v);
						v = +v;
					} else if (hasTypeDef(type, DateType) && !isNaN(Date.parse(v))) {
						debug("convert to date", v);
						v = new Date(v);
					}
				}
				if (!hasType) {
					if (!hasTypeDefault) return v;
					rawType = typeDefault;
				}
				if (v === false && ~type.indexOf(null) && !(~type.indexOf(false) || hasTypeDef(type, BooleanType))) v = null;
				const d = {};
				d[k] = v;
				debug("prevalidated val", d, v, rawType);
				if (!validate(d, k, v, rawType, { typeDefs })) {
					if (invalidHandler) invalidHandler(k, v, rawType, data);
					else if (invalidHandler !== false) debug("invalid: " + k + "=" + v, rawType);
					return remove;
				}
				debug("validated v", d, v, rawType);
				return d[k];
			}).filter((v) => v !== remove);
			if (!val.length && doesNotHaveTypeDef(type, ArrayType)) {
				debug("VAL HAS NO LENGTH, DELETE IT", val, k, type.indexOf(ArrayType));
				delete data[k];
			} else if (isArray) {
				debug(isArray, data[k], val);
				data[k] = val;
			} else data[k] = val[0];
			debug("k=%s val=%j", k, val, data[k]);
		});
	}
	function validate(data, k, val, type, { typeDefs } = {}) {
		const ArrayType = typeDefs?.Array?.type;
		if (Array.isArray(type)) {
			for (let i = 0, l = type.length; i < l; i++) {
				if (isTypeDef(type[i], ArrayType)) continue;
				if (validate(data, k, val, type[i], { typeDefs })) return true;
			}
			delete data[k];
			return false;
		}
		if (isTypeDef(type, ArrayType)) return true;
		if (type !== type) {
			debug("Poison NaN", k, val, type);
			delete data[k];
			return false;
		}
		if (val === type) {
			debug("Explicitly allowed %j", val);
			data[k] = val;
			return true;
		}
		let ok = false;
		const types = Object.keys(typeDefs);
		for (let i = 0, l = types.length; i < l; i++) {
			debug("test type %j %j %j", k, val, types[i]);
			const t = typeDefs[types[i]];
			if (t && (type && type.name && t.type && t.type.name ? type.name === t.type.name : type === t.type)) {
				const d = {};
				ok = t.validate(d, k, val) !== false;
				val = d[k];
				if (ok) {
					data[k] = val;
					break;
				}
			}
		}
		debug("OK? %j (%j %j %j)", ok, k, val, types[types.length - 1]);
		if (!ok) delete data[k];
		return ok;
	}
	function parse(args, data, remain, { types = {}, typeDefs = {}, shorthands = {}, dynamicTypes, unknownHandler, abbrevHandler } = {}) {
		const StringType = typeDefs.String?.type;
		const NumberType = typeDefs.Number?.type;
		const ArrayType = typeDefs.Array?.type;
		const BooleanType = typeDefs.Boolean?.type;
		debug("parse", args, data, remain);
		const abbrevs = abbrev(Object.keys(types));
		debug("abbrevs=%j", abbrevs);
		const shortAbbr = abbrev(Object.keys(shorthands));
		for (let i = 0; i < args.length; i++) {
			let arg = args[i];
			debug("arg", arg);
			if (arg.match(/^-{2,}$/)) {
				remain.push.apply(remain, args.slice(i + 1));
				args[i] = "--";
				break;
			}
			let hadEq = false;
			if (arg.charAt(0) === "-" && arg.length > 1) {
				const at = arg.indexOf("=");
				if (at > -1) {
					hadEq = true;
					const v = arg.slice(at + 1);
					arg = arg.slice(0, at);
					args.splice(i, 1, arg, v);
				}
				const shRes = resolveShort(arg, shortAbbr, abbrevs, {
					shorthands,
					abbrevHandler
				});
				debug("arg=%j shRes=%j", arg, shRes);
				if (shRes) {
					args.splice.apply(args, [i, 1].concat(shRes));
					if (arg !== shRes[0]) {
						i--;
						continue;
					}
				}
				arg = arg.replace(/^-+/, "");
				let no = null;
				while (arg.toLowerCase().indexOf("no-") === 0) {
					no = !no;
					arg = arg.slice(3);
				}
				if (abbrevs[arg] && abbrevs[arg] !== arg) {
					if (abbrevHandler) abbrevHandler(arg, abbrevs[arg]);
					else if (abbrevHandler !== false) debug(`abbrev: ${arg} -> ${abbrevs[arg]}`);
					arg = abbrevs[arg];
				}
				let [hasType, argType] = getType(arg, {
					types,
					dynamicTypes
				});
				let isTypeArray = Array.isArray(argType);
				if (isTypeArray && argType.length === 1) {
					isTypeArray = false;
					argType = argType[0];
				}
				let isArray = isTypeDef(argType, ArrayType) || isTypeArray && hasTypeDef(argType, ArrayType);
				if (!hasType && hasOwn(data, arg)) {
					if (!Array.isArray(data[arg])) data[arg] = [data[arg]];
					isArray = true;
				}
				let val;
				let la = args[i + 1];
				const isBool = typeof no === "boolean" || isTypeDef(argType, BooleanType) || isTypeArray && hasTypeDef(argType, BooleanType) || typeof argType === "undefined" && !hadEq || la === "false" && (argType === null || isTypeArray && ~argType.indexOf(null));
				if (typeof argType === "undefined") {
					const hangingLa = !hadEq && la && !la?.startsWith("-") && !["true", "false"].includes(la);
					if (unknownHandler) {
						if (hangingLa) unknownHandler(arg, la);
						else unknownHandler(arg);
					} else if (unknownHandler !== false) {
						debug(`unknown: ${arg}`);
						if (hangingLa) debug(`unknown: ${la} parsed as normal opt`);
					}
				}
				if (isBool) {
					val = !no;
					if (la === "true" || la === "false") {
						val = JSON.parse(la);
						la = null;
						if (no) val = !val;
						i++;
					}
					if (isTypeArray && la) {
						if (~argType.indexOf(la)) {
							val = la;
							i++;
						} else if (la === "null" && ~argType.indexOf(null)) {
							val = null;
							i++;
						} else if (!la.match(/^-{2,}[^-]/) && !isNaN(la) && hasTypeDef(argType, NumberType)) {
							val = +la;
							i++;
						} else if (!la.match(/^-[^-]/) && hasTypeDef(argType, StringType)) {
							val = la;
							i++;
						}
					}
					if (isArray) (data[arg] = data[arg] || []).push(val);
					else data[arg] = val;
					continue;
				}
				if (isTypeDef(argType, StringType)) {
					if (la === void 0) la = "";
					else if (la.match(/^-{1,2}[^-]+/)) {
						la = "";
						i--;
					}
				}
				if (la && la.match(/^-{2,}$/)) {
					la = void 0;
					i--;
				}
				val = la === void 0 ? true : la;
				if (isArray) (data[arg] = data[arg] || []).push(val);
				else data[arg] = val;
				i++;
				continue;
			}
			remain.push(arg);
		}
	}
	const SINGLES = Symbol("singles");
	const singleCharacters = (arg, shorthands) => {
		let singles = shorthands[SINGLES];
		if (!singles) {
			singles = Object.keys(shorthands).filter((s) => s.length === 1).reduce((l, r) => {
				l[r] = true;
				return l;
			}, {});
			shorthands[SINGLES] = singles;
			debug("shorthand singles", singles);
		}
		const chrs = arg.split("").filter((c) => singles[c]);
		return chrs.join("") === arg ? chrs : null;
	};
	function resolveShort(arg, ...rest) {
		const { abbrevHandler, types = {}, shorthands = {} } = rest.length ? rest.pop() : {};
		const shortAbbr = rest[0] ?? abbrev(Object.keys(shorthands));
		const abbrevs = rest[1] ?? abbrev(Object.keys(types));
		arg = arg.replace(/^-+/, "");
		if (abbrevs[arg] === arg) return null;
		if (shorthands[arg]) {
			if (shorthands[arg] && !Array.isArray(shorthands[arg])) shorthands[arg] = shorthands[arg].split(/\s+/);
			return shorthands[arg];
		}
		const chrs = singleCharacters(arg, shorthands);
		if (chrs) return chrs.map((c) => shorthands[c]).reduce((l, r) => l.concat(r), []);
		if (abbrevs[arg] && !shorthands[arg]) return null;
		if (shortAbbr[arg]) {
			if (abbrevHandler) abbrevHandler(arg, shortAbbr[arg]);
			else if (abbrevHandler !== false) debug(`abbrev: ${arg} -> ${shortAbbr[arg]}`);
			arg = shortAbbr[arg];
		}
		if (shorthands[arg] && !Array.isArray(shorthands[arg])) shorthands[arg] = shorthands[arg].split(/\s+/);
		return shorthands[arg];
	}
	module.exports = {
		nopt,
		clean,
		parse,
		validate,
		resolveShort,
		typeDefs: defaultTypeDefs
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/nopt@9.0.0/node_modules/nopt/lib/nopt.js
var require_nopt = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const lib = require_nopt_lib();
	const defaultTypeDefs = require_type_defs$1();
	module.exports = exports = nopt;
	exports.clean = clean;
	exports.typeDefs = defaultTypeDefs;
	exports.lib = lib;
	function nopt(types, shorthands, args = process.argv, slice = 2) {
		return lib.nopt(args.slice(slice), {
			types: types || {},
			shorthands: shorthands || {},
			typeDefs: exports.typeDefs,
			invalidHandler: exports.invalidHandler,
			unknownHandler: exports.unknownHandler,
			abbrevHandler: exports.abbrevHandler
		});
	}
	function clean(data, types, typeDefs = exports.typeDefs) {
		return lib.clean(data, {
			types: types || {},
			typeDefs,
			invalidHandler: exports.invalidHandler,
			unknownHandler: exports.unknownHandler,
			abbrevHandler: exports.abbrevHandler
		});
	}
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+config@10.14.0/node_modules/@npmcli/config/lib/umask.js
var require_umask = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const parse = (val) => {
		// istanbul ignore else
		if (typeof val === "string") {
			if (/^0o?[0-7]+$/.test(val)) return parseInt(val.replace(/^0o?/, ""), 8);
			else if (/^[1-9][0-9]*$/.test(val)) return parseInt(val, 10);
			else throw new Error(`invalid umask value: ${val}`);
		} else {
			if (typeof val !== "number") throw new Error(`invalid umask value: ${val}`);
			val = Math.floor(val);
			if (val < 0 || val > 511) throw new Error(`invalid umask value: ${val}`);
			return val;
		}
	};
	const validate = (data, k, val) => {
		try {
			data[k] = parse(val);
			return true;
		} catch (er) {
			return false;
		}
	};
	module.exports = {
		parse,
		validate
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+config@10.14.0/node_modules/@npmcli/config/lib/type-defs.js
var require_type_defs = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const nopt = require_nopt();
	const { validate: validateUmask } = require_umask();
	var Umask = class {};
	var Semver = class {};
	const semverValid = require_commonjs$2.require_valid$1();
	const validateSemver = (data, k, val) => {
		const valid = semverValid(val);
		if (!valid) return false;
		data[k] = valid;
	};
	const noptValidatePath = nopt.typeDefs.path.validate;
	const validatePath = (data, k, val) => {
		if (typeof val !== "string") return false;
		return noptValidatePath(data, k, val);
	};
	module.exports = {
		...nopt.typeDefs,
		semver: {
			type: Semver,
			validate: validateSemver,
			description: "full valid SemVer string"
		},
		Umask: {
			type: Umask,
			validate: validateUmask,
			description: "octal number in range 0o000..0o777 (0..511)"
		},
		url: {
			...nopt.typeDefs.url,
			description: "full url with \"http://\""
		},
		path: {
			...nopt.typeDefs.path,
			validate: validatePath,
			description: "valid filesystem path"
		},
		Number: {
			...nopt.typeDefs.Number,
			description: "numeric value"
		},
		Boolean: {
			...nopt.typeDefs.Boolean,
			description: "boolean value (true or false)"
		},
		Date: {
			...nopt.typeDefs.Date,
			description: "valid Date string"
		}
	};
	nopt.typeDefs = module.exports;
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+config@10.14.0/node_modules/@npmcli/config/lib/nerf-dart.js
var require_nerf_dart = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const { URL: URL$3 } = require("node:url");
	/**
	* Maps a URL to an identifier.
	*
	* Name courtesy schiffertronix media LLC, a New Jersey corporation
	*
	* @param {String} uri The URL to be nerfed.
	*
	* @returns {String} A nerfed URL.
	*/
	module.exports = (url) => {
		const parsed = new URL$3(url);
		const from = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
		const rel = new URL$3(".", from);
		return `//${rel.host}${rel.pathname}`;
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+config@10.14.0/node_modules/@npmcli/config/lib/env-replace.js
var require_env_replace = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const envExpr = /(?<!\\)(\\*)\$\{([^${}?]+)(\?)?\}/g;
	module.exports = (f, env) => f.replace(envExpr, (orig, esc, name, modifier) => {
		const fallback = modifier === "?" ? "" : `$\{${name}}`;
		const val = env[name] !== void 0 ? env[name] : fallback;
		if (esc.length % 2) return orig.slice((esc.length + 1) / 2);
		return esc.slice(esc.length / 2) + val;
	});
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+config@10.14.0/node_modules/@npmcli/config/lib/parse-field.js
var require_parse_field = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const typeDefs = require_type_defs();
	const envReplace = require_env_replace();
	const { resolve: resolve$2 } = require("node:path");
	const { parse: umaskParse } = require_umask();
	const parseField = (f, key, opts, listElement = false) => {
		if (typeof f !== "string" && !Array.isArray(f)) return f;
		const { platform, types, home, env } = opts;
		const typeList = new Set([].concat(types[key]));
		const isPath = typeList.has(typeDefs.path.type);
		const isBool = typeList.has(typeDefs.Boolean.type);
		const isString = isPath || typeList.has(typeDefs.String.type);
		const isUmask = typeList.has(typeDefs.Umask.type);
		const isNumber = typeList.has(typeDefs.Number.type);
		const isList = !listElement && typeList.has(Array);
		const isDate = typeList.has(typeDefs.Date.type);
		if (Array.isArray(f)) return !isList ? f : f.map((field) => parseField(field, key, opts, true));
		f = f.trim();
		if (isList) return parseField(f.split("\n\n"), key, opts);
		if (isBool && !isString && f === "") return true;
		if (!isString && !isPath && !isNumber) switch (f) {
			case "true": return true;
			case "false": return false;
			case "null": return null;
			case "undefined": return;
		}
		f = envReplace(f, env);
		if (isDate) return new Date(f);
		if (isPath) {
			if ((platform === "win32" ? /^~(\/|\\)/ : /^~\//).test(f) && home) f = resolve$2(home, f.slice(2));
			else f = resolve$2(f);
		}
		if (isUmask) try {
			return umaskParse(f);
		} catch (er) {
			return f;
		}
		if (isNumber && !isNaN(f)) f = +f;
		return f;
	};
	module.exports = parseField;
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+config@10.14.0/node_modules/@npmcli/config/lib/set-envs.js
var require_set_envs = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const envKey = (key, val) => {
		return !/^[/@_]/.test(key) && typeof envVal(val) === "string" && `npm_config_${key.replace(/-/g, "_").toLowerCase()}`;
	};
	const envVal = (val) => Array.isArray(val) ? val.map((v) => envVal(v)).join("\n\n") : val === null || val === void 0 || val === false ? "" : typeof val === "object" ? null : String(val);
	const sameConfigValue = (def, val) => !Array.isArray(val) || !Array.isArray(def) ? def === val : sameArrayValue(def, val);
	const sameArrayValue = (def, val) => {
		if (def.length !== val.length) return false;
		for (let i = 0; i < def.length; i++)
 /* istanbul ignore next - there are no array configs where the default
		* is not an empty array, so this loop is a no-op, but it's the correct
		* thing to do if we ever DO add a config like that. */
		if (def[i] !== val[i]) return false;
		return true;
	};
	const setEnv = (env, rawKey, rawVal) => {
		const val = envVal(rawVal);
		const key = envKey(rawKey, val);
		if (key && val !== null) env[key] = val;
	};
	const setEnvs = (config) => {
		const { env, defaults, definitions, list: [cliConf, envConf] } = config;
		env.INIT_CWD = process.cwd();
		const cliSet = new Set(Object.keys(cliConf));
		const envSet = new Set(Object.keys(envConf));
		for (const key in cliConf) {
			const { deprecated, envExport = true } = definitions[key] || {};
			if (deprecated || envExport === false) continue;
			if (sameConfigValue(defaults[key], cliConf[key])) {
				if (!sameConfigValue(envConf[key], cliConf[key])) setEnv(env, key, cliConf[key]);
			} else if (!(envSet.has(key) && !cliSet.has(key))) setEnv(env, key, cliConf[key]);
		}
		env.HOME = config.home;
		env.npm_config_global_prefix = config.globalPrefix;
		env.npm_config_local_prefix = config.localPrefix;
		if (cliConf.editor) env.EDITOR = cliConf.editor;
		if (cliConf["node-options"]) env.NODE_OPTIONS = cliConf["node-options"];
		env.npm_config_node_gyp = cliConf["node-gyp"];
		env.npm_config_npm_version = cliConf["npm-version"] || "unknown";
		env.npm_execpath = config.npmBin;
		env.NODE = env.npm_node_execpath = config.execPath;
	};
	module.exports = setEnvs;
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+config@10.14.0/node_modules/@npmcli/config/lib/errors.js
var require_errors$1 = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	var ErrInvalidAuth = class extends Error {
		constructor(problems) {
			let message = "Invalid auth configuration found: ";
			message += problems.map((problem) => {
				// istanbul ignore else
				if (problem.action === "delete") return `\`${problem.key}\` is not allowed in ${problem.where} config`;
				else if (problem.action === "rename") return `\`${problem.from}\` must be renamed to \`${problem.to}\` in ${problem.where} config`;
			}).join(", ");
			message += "\nPlease run `npm config fix` to repair your configuration.`";
			super(message);
			this.code = "ERR_INVALID_AUTH";
			this.problems = problems;
		}
	};
	module.exports = { ErrInvalidAuth };
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+config@10.14.0/node_modules/@npmcli/config/lib/type-description.js
var require_type_description = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const typeDefs = require_type_defs();
	const typeDescription = (t) => {
		if (!t || typeof t !== "function" && typeof t !== "object") return t;
		if (Array.isArray(t)) return t.map((t) => typeDescription(t));
		for (const { type, description } of Object.values(typeDefs)) if (type === t) return description || type;
		return t;
	};
	module.exports = (t) => [].concat(typeDescription(t)).filter((t) => t !== void 0);
}));
//#endregion
//#region ../../node_modules/.pnpm/json-parse-even-better-errors@5.0.0/node_modules/json-parse-even-better-errors/lib/index.js
var require_lib$12 = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const INDENT = Symbol.for("indent");
	const NEWLINE = Symbol.for("newline");
	const DEFAULT_NEWLINE = "\n";
	const DEFAULT_INDENT = "  ";
	const BOM = /^\uFEFF/;
	const FORMAT = /^\s*[{[]((?:\r?\n)+)([\s\t]*)/;
	const EMPTY = /^(?:\{\}|\[\])((?:\r?\n)+)?$/;
	const UNEXPECTED_TOKEN = /^Unexpected token '?(.)'?(,)? /i;
	const hexify = (char) => {
		const h = char.charCodeAt(0).toString(16).toUpperCase();
		return `0x${h.length % 2 ? "0" : ""}${h}`;
	};
	const stripBOM = (txt) => String(txt).replace(BOM, "");
	const makeParsedError = (msg, parsing, position = 0) => ({
		message: `${msg} while parsing ${parsing}`,
		position
	});
	const parseError = (e, txt, context = 20) => {
		let msg = e.message;
		if (!txt) return makeParsedError(msg, "empty string");
		const badTokenMatch = msg.match(UNEXPECTED_TOKEN);
		const badIndexMatch = msg.match(/ position\s+(\d+)/i);
		if (badTokenMatch) msg = msg.replace(UNEXPECTED_TOKEN, `Unexpected token ${JSON.stringify(badTokenMatch[1])} (${hexify(badTokenMatch[1])})$2 `);
		let errIdx;
		if (badIndexMatch) errIdx = +badIndexMatch[1];
		else if (msg.match(/^Unexpected end of JSON.*/i)) errIdx = txt.length - 1;
		if (errIdx == null) return makeParsedError(msg, `'${txt.slice(0, context * 2)}'`);
		const start = errIdx <= context ? 0 : errIdx - context;
		const end = errIdx + context >= txt.length ? txt.length : errIdx + context;
		const slice = `${start ? "..." : ""}${txt.slice(start, end)}${end === txt.length ? "" : "..."}`;
		return makeParsedError(msg, `${txt === slice ? "" : "near "}${JSON.stringify(slice)}`, errIdx);
	};
	var JSONParseError = class extends SyntaxError {
		constructor(er, txt, context, caller) {
			const metadata = parseError(er, txt, context);
			super(metadata.message);
			Object.assign(this, metadata);
			this.code = "EJSONPARSE";
			this.systemError = er;
			Error.captureStackTrace(this, caller || this.constructor);
		}
		get name() {
			return this.constructor.name;
		}
		set name(n) {}
		get [Symbol.toStringTag]() {
			return this.constructor.name;
		}
	};
	const parseJson = (txt, reviver) => {
		const result = JSON.parse(txt, reviver);
		if (result && typeof result === "object") {
			const match = txt.match(EMPTY) || txt.match(FORMAT) || [
				null,
				"",
				""
			];
			result[NEWLINE] = match[1] ?? DEFAULT_NEWLINE;
			result[INDENT] = match[2] ?? DEFAULT_INDENT;
		}
		return result;
	};
	const parseJsonError = (raw, reviver, context) => {
		const txt = stripBOM(raw);
		try {
			return parseJson(txt, reviver);
		} catch (e) {
			if (typeof raw !== "string" && !Buffer.isBuffer(raw)) {
				const msg = Array.isArray(raw) && raw.length === 0 ? "an empty array" : String(raw);
				throw Object.assign(/* @__PURE__ */ new TypeError(`Cannot parse ${msg}`), {
					code: "EJSONPARSE",
					systemError: e
				});
			}
			throw new JSONParseError(e, txt, context, parseJsonError);
		}
	};
	module.exports = parseJsonError;
	parseJsonError.JSONParseError = JSONParseError;
	parseJsonError.noExceptions = (raw, reviver) => {
		try {
			return parseJson(stripBOM(raw), reviver);
		} catch {}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+package-json@7.0.5/node_modules/@npmcli/package-json/lib/update-dependencies.js
var require_update_dependencies = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const depTypes = /* @__PURE__ */ new Set([
		"dependencies",
		"optionalDependencies",
		"devDependencies",
		"peerDependencies"
	]);
	const orderDeps = (content) => {
		for (const type of depTypes) if (content && content[type]) content[type] = Object.keys(content[type]).sort((a, b) => a.localeCompare(b, "en")).reduce((res, key) => {
			res[key] = content[type][key];
			return res;
		}, {});
		return content;
	};
	const updateDependencies = ({ content, originalContent }) => {
		const pkg = orderDeps({ ...content });
		if (pkg.dependencies) {
			if (pkg.optionalDependencies) for (const name of Object.keys(pkg.optionalDependencies)) delete pkg.dependencies[name];
		}
		const result = { ...originalContent };
		for (const type of depTypes) {
			if (pkg[type]) result[type] = pkg[type];
			if (pkg[type] && typeof pkg === "object" && Object.keys(pkg[type]).length === 0) delete result[type];
		}
		const { dependencies: origProd, peerDependencies: origPeer } = originalContent || {};
		const { peerDependencies: newPeer } = result;
		if (origProd && origPeer && newPeer) {
			for (const name of Object.keys(origPeer)) if (origProd[name] !== void 0 && newPeer[name] !== void 0) {
				result.dependencies = result.dependencies || {};
				result.dependencies[name] = newPeer[name];
			}
		}
		return result;
	};
	updateDependencies.knownKeys = depTypes;
	module.exports = updateDependencies;
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+package-json@7.0.5/node_modules/@npmcli/package-json/lib/update-scripts.js
var require_update_scripts = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const updateScripts = ({ content, originalContent = {} }) => {
		const newScripts = content.scripts;
		if (!newScripts) return originalContent;
		const hasInvalidScripts = () => Object.entries(newScripts).some(([key, value]) => typeof key !== "string" || typeof value !== "string");
		if (hasInvalidScripts()) throw Object.assign(/* @__PURE__ */ new TypeError("package.json scripts should be a key-value pair of strings."), { code: "ESCRIPTSINVALID" });
		return {
			...originalContent,
			scripts: { ...newScripts }
		};
	};
	module.exports = updateScripts;
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+package-json@7.0.5/node_modules/@npmcli/package-json/lib/update-workspaces.js
var require_update_workspaces = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const updateWorkspaces = ({ content, originalContent = {} }) => {
		const newWorkspaces = content.workspaces;
		if (!newWorkspaces) return originalContent;
		const hasInvalidWorkspaces = () => newWorkspaces.some((w) => !(typeof w === "string"));
		if (!newWorkspaces.length || hasInvalidWorkspaces()) throw Object.assign(/* @__PURE__ */ new TypeError("workspaces should be an array of strings."), { code: "EWORKSPACESINVALID" });
		return {
			...originalContent,
			workspaces: [...newWorkspaces]
		};
	};
	module.exports = updateWorkspaces;
}));
//#endregion
//#region ../../node_modules/.pnpm/hosted-git-info@9.0.3/node_modules/hosted-git-info/lib/hosts.js
var require_hosts = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const maybeJoin = (...args) => args.every((arg) => arg) ? args.join("") : "";
	const maybeEncode = (arg) => arg ? encodeURIComponent(arg) : "";
	const formatHashFragment = (f) => f.toLowerCase().replace(/^\W+/g, "").replace(/(?<!\W)\W+$/, "").replace(/\//g, "").replace(/\W+/g, "-");
	const defaults = {
		sshtemplate: ({ domain, user, project, committish }) => `git@${domain}:${user}/${project}.git${maybeJoin("#", committish)}`,
		sshurltemplate: ({ domain, user, project, committish }) => `git+ssh://git@${domain}/${user}/${project}.git${maybeJoin("#", committish)}`,
		edittemplate: ({ domain, user, project, committish, editpath, path }) => `https://${domain}/${user}/${project}${maybeJoin("/", editpath, "/", maybeEncode(committish || "HEAD"), "/", path)}`,
		browsetemplate: ({ domain, user, project, committish, treepath }) => `https://${domain}/${user}/${project}${maybeJoin("/", treepath, "/", maybeEncode(committish))}`,
		browsetreetemplate: ({ domain, user, project, committish, treepath, path, fragment, hashformat }) => `https://${domain}/${user}/${project}/${treepath}/${maybeEncode(committish || "HEAD")}/${path}${maybeJoin("#", hashformat(fragment || ""))}`,
		browseblobtemplate: ({ domain, user, project, committish, blobpath, path, fragment, hashformat }) => `https://${domain}/${user}/${project}/${blobpath}/${maybeEncode(committish || "HEAD")}/${path}${maybeJoin("#", hashformat(fragment || ""))}`,
		docstemplate: ({ domain, user, project, treepath, committish }) => `https://${domain}/${user}/${project}${maybeJoin("/", treepath, "/", maybeEncode(committish))}#readme`,
		httpstemplate: ({ auth, domain, user, project, committish }) => `git+https://${maybeJoin(auth, "@")}${domain}/${user}/${project}.git${maybeJoin("#", committish)}`,
		filetemplate: ({ domain, user, project, committish, path }) => `https://${domain}/${user}/${project}/raw/${maybeEncode(committish || "HEAD")}/${path}`,
		shortcuttemplate: ({ type, user, project, committish }) => `${type}:${user}/${project}${maybeJoin("#", committish)}`,
		pathtemplate: ({ user, project, committish }) => `${user}/${project}${maybeJoin("#", committish)}`,
		bugstemplate: ({ domain, user, project }) => `https://${domain}/${user}/${project}/issues`,
		hashformat: formatHashFragment
	};
	const hosts = {};
	hosts.github = {
		protocols: [
			"git:",
			"http:",
			"git+ssh:",
			"git+https:",
			"ssh:",
			"https:"
		],
		domain: "github.com",
		treepath: "tree",
		blobpath: "blob",
		editpath: "edit",
		filetemplate: ({ auth, user, project, committish, path }) => `https://${maybeJoin(auth, "@")}raw.githubusercontent.com/${user}/${project}/${maybeEncode(committish || "HEAD")}/${path}`,
		gittemplate: ({ auth, domain, user, project, committish }) => `git://${maybeJoin(auth, "@")}${domain}/${user}/${project}.git${maybeJoin("#", committish)}`,
		tarballtemplate: ({ domain, user, project, committish }) => `https://codeload.${domain}/${user}/${project}/tar.gz/${maybeEncode(committish || "HEAD")}`,
		extract: (url) => {
			let [, user, project, type, committish] = url.pathname.split("/", 5);
			if (type && type !== "tree") return;
			if (!type) committish = url.hash.slice(1);
			if (project && project.endsWith(".git")) project = project.slice(0, -4);
			if (!user || !project) return;
			return {
				user,
				project,
				committish
			};
		}
	};
	hosts.bitbucket = {
		protocols: [
			"git+ssh:",
			"git+https:",
			"ssh:",
			"https:"
		],
		domain: "bitbucket.org",
		treepath: "src",
		blobpath: "src",
		editpath: "?mode=edit",
		edittemplate: ({ domain, user, project, committish, treepath, path, editpath }) => `https://${domain}/${user}/${project}${maybeJoin("/", treepath, "/", maybeEncode(committish || "HEAD"), "/", path, editpath)}`,
		tarballtemplate: ({ domain, user, project, committish }) => `https://${domain}/${user}/${project}/get/${maybeEncode(committish || "HEAD")}.tar.gz`,
		extract: (url) => {
			let [, user, project, aux] = url.pathname.split("/", 4);
			if (["get"].includes(aux)) return;
			if (project && project.endsWith(".git")) project = project.slice(0, -4);
			if (!user || !project) return;
			return {
				user,
				project,
				committish: url.hash.slice(1)
			};
		}
	};
	hosts.gitlab = {
		protocols: [
			"git+ssh:",
			"git+https:",
			"ssh:",
			"https:"
		],
		domain: "gitlab.com",
		treepath: "tree",
		blobpath: "tree",
		editpath: "-/edit",
		tarballtemplate: ({ domain, user, project, committish }) => `https://${domain}/api/v4/projects/${maybeEncode(user + "/" + project)}/repository/archive.tar.gz?sha=${maybeEncode(committish || "HEAD")}`,
		extract: (url) => {
			const path = url.pathname.slice(1);
			if (path.includes("/-/") || path.includes("/archive.tar.gz")) return;
			const segments = path.split("/");
			let project = segments.pop();
			if (project.endsWith(".git")) project = project.slice(0, -4);
			const user = segments.join("/");
			if (!user || !project) return;
			return {
				user,
				project,
				committish: url.hash.slice(1)
			};
		}
	};
	hosts.gist = {
		protocols: [
			"git:",
			"git+ssh:",
			"git+https:",
			"ssh:",
			"https:"
		],
		domain: "gist.github.com",
		editpath: "edit",
		sshtemplate: ({ domain, project, committish }) => `git@${domain}:${project}.git${maybeJoin("#", committish)}`,
		sshurltemplate: ({ domain, project, committish }) => `git+ssh://git@${domain}/${project}.git${maybeJoin("#", committish)}`,
		edittemplate: ({ domain, user, project, committish, editpath }) => `https://${domain}/${user}/${project}${maybeJoin("/", maybeEncode(committish))}/${editpath}`,
		browsetemplate: ({ domain, project, committish }) => `https://${domain}/${project}${maybeJoin("/", maybeEncode(committish))}`,
		browsetreetemplate: ({ domain, project, committish, path, hashformat }) => `https://${domain}/${project}${maybeJoin("/", maybeEncode(committish))}${maybeJoin("#", hashformat(path))}`,
		browseblobtemplate: ({ domain, project, committish, path, hashformat }) => `https://${domain}/${project}${maybeJoin("/", maybeEncode(committish))}${maybeJoin("#", hashformat(path))}`,
		docstemplate: ({ domain, project, committish }) => `https://${domain}/${project}${maybeJoin("/", maybeEncode(committish))}`,
		httpstemplate: ({ domain, project, committish }) => `git+https://${domain}/${project}.git${maybeJoin("#", committish)}`,
		filetemplate: ({ user, project, committish, path }) => `https://gist.githubusercontent.com/${user}/${project}/raw${maybeJoin("/", maybeEncode(committish))}/${path}`,
		shortcuttemplate: ({ type, project, committish }) => `${type}:${project}${maybeJoin("#", committish)}`,
		pathtemplate: ({ project, committish }) => `${project}${maybeJoin("#", committish)}`,
		bugstemplate: ({ domain, project }) => `https://${domain}/${project}`,
		gittemplate: ({ domain, project, committish }) => `git://${domain}/${project}.git${maybeJoin("#", committish)}`,
		tarballtemplate: ({ project, committish }) => `https://codeload.github.com/gist/${project}/tar.gz/${maybeEncode(committish || "HEAD")}`,
		extract: (url) => {
			let [, user, project, aux] = url.pathname.split("/", 4);
			if (aux === "raw") return;
			if (!project) {
				if (!user) return;
				project = user;
				user = null;
			}
			if (project.endsWith(".git")) project = project.slice(0, -4);
			return {
				user,
				project,
				committish: url.hash.slice(1)
			};
		},
		hashformat: function(fragment) {
			return fragment && "file-" + formatHashFragment(fragment);
		}
	};
	hosts.sourcehut = {
		protocols: ["git+ssh:", "https:"],
		domain: "git.sr.ht",
		treepath: "tree",
		blobpath: "tree",
		filetemplate: ({ domain, user, project, committish, path }) => `https://${domain}/${user}/${project}/blob/${maybeEncode(committish) || "HEAD"}/${path}`,
		httpstemplate: ({ domain, user, project, committish }) => `https://${domain}/${user}/${project}${maybeJoin("#", committish)}`,
		tarballtemplate: ({ domain, user, project, committish }) => `https://${domain}/${user}/${project}/archive/${maybeEncode(committish) || "HEAD"}.tar.gz`,
		bugstemplate: () => null,
		extract: (url) => {
			let [, user, project, aux] = url.pathname.split("/", 4);
			if (["archive"].includes(aux)) return;
			if (project && project.endsWith(".git")) project = project.slice(0, -4);
			if (!user || !project) return;
			return {
				user,
				project,
				committish: url.hash.slice(1)
			};
		}
	};
	for (const [name, host] of Object.entries(hosts)) hosts[name] = Object.assign({}, defaults, host);
	module.exports = hosts;
}));
//#endregion
//#region ../../node_modules/.pnpm/hosted-git-info@9.0.3/node_modules/hosted-git-info/lib/parse-url.js
var require_parse_url = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const url = require("url");
	const lastIndexOfBefore = (str, char, beforeChar) => {
		const startPosition = str.indexOf(beforeChar);
		return str.lastIndexOf(char, startPosition > -1 ? startPosition : Infinity);
	};
	const safeUrl = (u) => {
		try {
			return new url.URL(u);
		} catch {}
	};
	const correctProtocol = (arg, protocols) => {
		const firstColon = arg.indexOf(":");
		const proto = arg.slice(0, firstColon + 1);
		if (Object.prototype.hasOwnProperty.call(protocols, proto)) return arg;
		if (arg.substr(firstColon, 3) === "://") return arg;
		const firstAt = arg.indexOf("@");
		if (firstAt > -1) {
			if (firstAt > firstColon) return `git+ssh://${arg}`;
			else return arg;
		}
		return `${arg.slice(0, firstColon + 1)}//${arg.slice(firstColon + 1)}`;
	};
	const correctUrl = (giturl) => {
		const firstAt = lastIndexOfBefore(giturl, "@", "#");
		const lastColonBeforeHash = lastIndexOfBefore(giturl, ":", "#");
		if (lastColonBeforeHash > firstAt) giturl = giturl.slice(0, lastColonBeforeHash) + "/" + giturl.slice(lastColonBeforeHash + 1);
		if (lastIndexOfBefore(giturl, ":", "#") === -1 && giturl.indexOf("//") === -1) giturl = `git+ssh://${giturl}`;
		return giturl;
	};
	module.exports = (giturl, protocols) => {
		const withProtocol = protocols ? correctProtocol(giturl, protocols) : giturl;
		return safeUrl(withProtocol) || safeUrl(correctUrl(withProtocol));
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/hosted-git-info@9.0.3/node_modules/hosted-git-info/lib/from-url.js
var require_from_url = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const parseUrl = require_parse_url();
	const isGitHubShorthand = (arg) => {
		const firstHash = arg.indexOf("#");
		const firstSlash = arg.indexOf("/");
		const secondSlash = arg.indexOf("/", firstSlash + 1);
		const firstColon = arg.indexOf(":");
		const firstSpace = /\s/.exec(arg);
		const firstAt = arg.indexOf("@");
		const spaceOnlyAfterHash = !firstSpace || firstHash > -1 && firstSpace.index > firstHash;
		const atOnlyAfterHash = firstAt === -1 || firstHash > -1 && firstAt > firstHash;
		const colonOnlyAfterHash = firstColon === -1 || firstHash > -1 && firstColon > firstHash;
		const secondSlashOnlyAfterHash = secondSlash === -1 || firstHash > -1 && secondSlash > firstHash;
		const hasSlash = firstSlash > 0;
		const doesNotEndWithSlash = firstHash > -1 ? arg[firstHash - 1] !== "/" : !arg.endsWith("/");
		const doesNotStartWithDot = !arg.startsWith(".");
		return spaceOnlyAfterHash && hasSlash && doesNotEndWithSlash && doesNotStartWithDot && atOnlyAfterHash && colonOnlyAfterHash && secondSlashOnlyAfterHash;
	};
	module.exports = (giturl, opts, { gitHosts, protocols }) => {
		if (!giturl) return;
		const correctedUrl = isGitHubShorthand(giturl) ? `github:${giturl}` : giturl;
		const parsed = parseUrl(correctedUrl, protocols);
		if (!parsed) return;
		const gitHostShortcut = gitHosts.byShortcut[parsed.protocol];
		const gitHostDomain = gitHosts.byDomain[parsed.hostname.startsWith("www.") ? parsed.hostname.slice(4) : parsed.hostname];
		const gitHostName = gitHostShortcut || gitHostDomain;
		if (!gitHostName) return;
		const gitHostInfo = gitHosts[gitHostShortcut || gitHostDomain];
		let auth = null;
		if (protocols[parsed.protocol]?.auth && (parsed.username || parsed.password)) auth = `${parsed.username}${parsed.password ? ":" + parsed.password : ""}`;
		let committish = null;
		let user = null;
		let project = null;
		let defaultRepresentation = null;
		try {
			if (gitHostShortcut) {
				let pathname = parsed.pathname.startsWith("/") ? parsed.pathname.slice(1) : parsed.pathname;
				const firstAt = pathname.indexOf("@");
				if (firstAt > -1) pathname = pathname.slice(firstAt + 1);
				const lastSlash = pathname.lastIndexOf("/");
				if (lastSlash > -1) {
					user = decodeURIComponent(pathname.slice(0, lastSlash));
					if (!user) user = null;
					project = decodeURIComponent(pathname.slice(lastSlash + 1));
				} else project = decodeURIComponent(pathname);
				if (project.endsWith(".git")) project = project.slice(0, -4);
				if (parsed.hash) committish = decodeURIComponent(parsed.hash.slice(1));
				defaultRepresentation = "shortcut";
			} else {
				if (!gitHostInfo.protocols.includes(parsed.protocol)) return;
				const segments = gitHostInfo.extract(parsed);
				if (!segments) return;
				user = segments.user && decodeURIComponent(segments.user);
				project = decodeURIComponent(segments.project);
				committish = decodeURIComponent(segments.committish);
				defaultRepresentation = protocols[parsed.protocol]?.name || parsed.protocol.slice(0, -1);
			}
		} catch (err) {
			/* istanbul ignore else */
			if (err instanceof URIError) return;
			else throw err;
		}
		return [
			gitHostName,
			user,
			auth,
			project,
			committish,
			defaultRepresentation,
			opts
		];
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/hosted-git-info@9.0.3/node_modules/hosted-git-info/lib/index.js
var require_lib$11 = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const { LRUCache } = require_commonjs$2.require_index_min$1();
	const hosts = require_hosts();
	const fromUrl = require_from_url();
	const parseUrl = require_parse_url();
	const cache = new LRUCache({ max: 1e3 });
	function unknownHostedUrl(url) {
		try {
			const { protocol, hostname, pathname } = new URL(url);
			if (!hostname) return null;
			return `${/(?:git\+)http:$/.test(protocol) ? "http:" : "https:"}//${hostname}${pathname.replace(/\.git$/, "")}`;
		} catch {
			return null;
		}
	}
	var GitHost = class GitHost {
		constructor(type, user, auth, project, committish, defaultRepresentation, opts = {}) {
			Object.assign(this, GitHost.#gitHosts[type], {
				type,
				user,
				auth,
				project,
				committish,
				default: defaultRepresentation,
				opts
			});
		}
		static #gitHosts = {
			byShortcut: {},
			byDomain: {}
		};
		static #protocols = {
			"git+ssh:": { name: "sshurl" },
			"ssh:": { name: "sshurl" },
			"git+https:": {
				name: "https",
				auth: true
			},
			"git:": { auth: true },
			"http:": { auth: true },
			"https:": { auth: true },
			"git+http:": { auth: true }
		};
		static addHost(name, host) {
			GitHost.#gitHosts[name] = host;
			GitHost.#gitHosts.byDomain[host.domain] = name;
			GitHost.#gitHosts.byShortcut[`${name}:`] = name;
			GitHost.#protocols[`${name}:`] = { name };
		}
		static fromUrl(giturl, opts) {
			if (typeof giturl !== "string") return;
			const key = giturl + JSON.stringify(opts || {});
			if (!cache.has(key)) {
				const hostArgs = fromUrl(giturl, opts, {
					gitHosts: GitHost.#gitHosts,
					protocols: GitHost.#protocols
				});
				cache.set(key, hostArgs ? new GitHost(...hostArgs) : void 0);
			}
			return cache.get(key);
		}
		static fromManifest(manifest, opts = {}) {
			if (!manifest || typeof manifest !== "object") return;
			const r = manifest.repository;
			const rurl = r && (typeof r === "string" ? r : typeof r === "object" && typeof r.url === "string" ? r.url : null);
			if (!rurl) throw new Error("no repository");
			const info = rurl && GitHost.fromUrl(rurl.replace(/^git\+/, ""), opts) || null;
			if (info) return info;
			const unk = unknownHostedUrl(rurl);
			return GitHost.fromUrl(unk, opts) || unk;
		}
		static parseUrl(url) {
			return parseUrl(url);
		}
		#fill(template, opts) {
			if (typeof template !== "function") return null;
			const options = {
				...this,
				...this.opts,
				...opts
			};
			if (!options.path) options.path = "";
			if (options.path.startsWith("/")) options.path = options.path.slice(1);
			if (options.noCommittish) options.committish = null;
			const result = template(options);
			return options.noGitPlus && result.startsWith("git+") ? result.slice(4) : result;
		}
		hash() {
			return this.committish ? `#${this.committish}` : "";
		}
		ssh(opts) {
			return this.#fill(this.sshtemplate, opts);
		}
		sshurl(opts) {
			return this.#fill(this.sshurltemplate, opts);
		}
		browse(path, ...args) {
			if (typeof path !== "string") return this.#fill(this.browsetemplate, path);
			if (typeof args[0] !== "string") return this.#fill(this.browsetreetemplate, {
				...args[0],
				path
			});
			return this.#fill(this.browsetreetemplate, {
				...args[1],
				fragment: args[0],
				path
			});
		}
		browseFile(path, ...args) {
			if (typeof args[0] !== "string") return this.#fill(this.browseblobtemplate, {
				...args[0],
				path
			});
			return this.#fill(this.browseblobtemplate, {
				...args[1],
				fragment: args[0],
				path
			});
		}
		docs(opts) {
			return this.#fill(this.docstemplate, opts);
		}
		bugs(opts) {
			return this.#fill(this.bugstemplate, opts);
		}
		https(opts) {
			return this.#fill(this.httpstemplate, opts);
		}
		git(opts) {
			return this.#fill(this.gittemplate, opts);
		}
		shortcut(opts) {
			return this.#fill(this.shortcuttemplate, opts);
		}
		path(opts) {
			return this.#fill(this.pathtemplate, opts);
		}
		tarball(opts) {
			return this.#fill(this.tarballtemplate, {
				...opts,
				noCommittish: false
			});
		}
		file(path, opts) {
			return this.#fill(this.filetemplate, {
				...opts,
				path
			});
		}
		edit(path, opts) {
			return this.#fill(this.edittemplate, {
				...opts,
				path
			});
		}
		getDefaultRepresentation() {
			return this.default;
		}
		toString(opts) {
			if (this.default && typeof this[this.default] === "function") return this[this.default](opts);
			return this.sshurl(opts);
		}
	};
	for (const [name, host] of Object.entries(hosts)) GitHost.addHost(name, host);
	module.exports = GitHost;
}));
//#endregion
//#region ../../node_modules/.pnpm/spdx-license-ids@3.0.23/node_modules/spdx-license-ids/index.json
var require_spdx_license_ids = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	module.exports = [
		"0BSD",
		"3D-Slicer-1.0",
		"AAL",
		"ADSL",
		"AFL-1.1",
		"AFL-1.2",
		"AFL-2.0",
		"AFL-2.1",
		"AFL-3.0",
		"AGPL-1.0-only",
		"AGPL-1.0-or-later",
		"AGPL-3.0-only",
		"AGPL-3.0-or-later",
		"ALGLIB-Documentation",
		"AMD-newlib",
		"AMDPLPA",
		"AML",
		"AML-glslang",
		"AMPAS",
		"ANTLR-PD",
		"ANTLR-PD-fallback",
		"APAFML",
		"APL-1.0",
		"APSL-1.0",
		"APSL-1.1",
		"APSL-1.2",
		"APSL-2.0",
		"ASWF-Digital-Assets-1.0",
		"ASWF-Digital-Assets-1.1",
		"Abstyles",
		"AdaCore-doc",
		"Adobe-2006",
		"Adobe-Display-PostScript",
		"Adobe-Glyph",
		"Adobe-Utopia",
		"Advanced-Cryptics-Dictionary",
		"Afmparse",
		"Aladdin",
		"Apache-1.0",
		"Apache-1.1",
		"Apache-2.0",
		"App-s2p",
		"Arphic-1999",
		"Artistic-1.0",
		"Artistic-1.0-Perl",
		"Artistic-1.0-cl8",
		"Artistic-2.0",
		"Artistic-dist",
		"Aspell-RU",
		"BOLA-1.1",
		"BSD-1-Clause",
		"BSD-2-Clause",
		"BSD-2-Clause-Darwin",
		"BSD-2-Clause-Patent",
		"BSD-2-Clause-Views",
		"BSD-2-Clause-first-lines",
		"BSD-2-Clause-pkgconf-disclaimer",
		"BSD-3-Clause",
		"BSD-3-Clause-Attribution",
		"BSD-3-Clause-Clear",
		"BSD-3-Clause-HP",
		"BSD-3-Clause-LBNL",
		"BSD-3-Clause-Modification",
		"BSD-3-Clause-No-Military-License",
		"BSD-3-Clause-No-Nuclear-License",
		"BSD-3-Clause-No-Nuclear-License-2014",
		"BSD-3-Clause-No-Nuclear-Warranty",
		"BSD-3-Clause-Open-MPI",
		"BSD-3-Clause-Sun",
		"BSD-3-Clause-Tso",
		"BSD-3-Clause-acpica",
		"BSD-3-Clause-flex",
		"BSD-4-Clause",
		"BSD-4-Clause-Shortened",
		"BSD-4-Clause-UC",
		"BSD-4.3RENO",
		"BSD-4.3TAHOE",
		"BSD-Advertising-Acknowledgement",
		"BSD-Attribution-HPND-disclaimer",
		"BSD-Inferno-Nettverk",
		"BSD-Mark-Modifications",
		"BSD-Protection",
		"BSD-Source-Code",
		"BSD-Source-beginning-file",
		"BSD-Systemics",
		"BSD-Systemics-W3Works",
		"BSL-1.0",
		"BUSL-1.1",
		"Baekmuk",
		"Bahyph",
		"Barr",
		"Beerware",
		"BitTorrent-1.0",
		"BitTorrent-1.1",
		"Bitstream-Charter",
		"Bitstream-Vera",
		"BlueOak-1.0.0",
		"Boehm-GC",
		"Boehm-GC-without-fee",
		"Borceux",
		"Brian-Gladman-2-Clause",
		"Brian-Gladman-3-Clause",
		"Buddy",
		"C-UDA-1.0",
		"CAL-1.0",
		"CAL-1.0-Combined-Work-Exception",
		"CAPEC-tou",
		"CATOSL-1.1",
		"CC-BY-1.0",
		"CC-BY-2.0",
		"CC-BY-2.5",
		"CC-BY-2.5-AU",
		"CC-BY-3.0",
		"CC-BY-3.0-AT",
		"CC-BY-3.0-AU",
		"CC-BY-3.0-DE",
		"CC-BY-3.0-IGO",
		"CC-BY-3.0-NL",
		"CC-BY-3.0-US",
		"CC-BY-4.0",
		"CC-BY-NC-1.0",
		"CC-BY-NC-2.0",
		"CC-BY-NC-2.5",
		"CC-BY-NC-3.0",
		"CC-BY-NC-3.0-DE",
		"CC-BY-NC-4.0",
		"CC-BY-NC-ND-1.0",
		"CC-BY-NC-ND-2.0",
		"CC-BY-NC-ND-2.5",
		"CC-BY-NC-ND-3.0",
		"CC-BY-NC-ND-3.0-DE",
		"CC-BY-NC-ND-3.0-IGO",
		"CC-BY-NC-ND-4.0",
		"CC-BY-NC-SA-1.0",
		"CC-BY-NC-SA-2.0",
		"CC-BY-NC-SA-2.0-DE",
		"CC-BY-NC-SA-2.0-FR",
		"CC-BY-NC-SA-2.0-UK",
		"CC-BY-NC-SA-2.5",
		"CC-BY-NC-SA-3.0",
		"CC-BY-NC-SA-3.0-DE",
		"CC-BY-NC-SA-3.0-IGO",
		"CC-BY-NC-SA-4.0",
		"CC-BY-ND-1.0",
		"CC-BY-ND-2.0",
		"CC-BY-ND-2.5",
		"CC-BY-ND-3.0",
		"CC-BY-ND-3.0-DE",
		"CC-BY-ND-4.0",
		"CC-BY-SA-1.0",
		"CC-BY-SA-2.0",
		"CC-BY-SA-2.0-UK",
		"CC-BY-SA-2.1-JP",
		"CC-BY-SA-2.5",
		"CC-BY-SA-3.0",
		"CC-BY-SA-3.0-AT",
		"CC-BY-SA-3.0-DE",
		"CC-BY-SA-3.0-IGO",
		"CC-BY-SA-4.0",
		"CC-PDDC",
		"CC-PDM-1.0",
		"CC-SA-1.0",
		"CC0-1.0",
		"CDDL-1.0",
		"CDDL-1.1",
		"CDL-1.0",
		"CDLA-Permissive-1.0",
		"CDLA-Permissive-2.0",
		"CDLA-Sharing-1.0",
		"CECILL-1.0",
		"CECILL-1.1",
		"CECILL-2.0",
		"CECILL-2.1",
		"CECILL-B",
		"CECILL-C",
		"CERN-OHL-1.1",
		"CERN-OHL-1.2",
		"CERN-OHL-P-2.0",
		"CERN-OHL-S-2.0",
		"CERN-OHL-W-2.0",
		"CFITSIO",
		"CMU-Mach",
		"CMU-Mach-nodoc",
		"CNRI-Jython",
		"CNRI-Python",
		"CNRI-Python-GPL-Compatible",
		"COIL-1.0",
		"CPAL-1.0",
		"CPL-1.0",
		"CPOL-1.02",
		"CUA-OPL-1.0",
		"Caldera",
		"Caldera-no-preamble",
		"Catharon",
		"ClArtistic",
		"Clips",
		"Community-Spec-1.0",
		"Condor-1.1",
		"Cornell-Lossless-JPEG",
		"Cronyx",
		"Crossword",
		"CryptoSwift",
		"CrystalStacker",
		"Cube",
		"D-FSL-1.0",
		"DEC-3-Clause",
		"DL-DE-BY-2.0",
		"DL-DE-ZERO-2.0",
		"DOC",
		"DRL-1.0",
		"DRL-1.1",
		"DSDP",
		"DocBook-DTD",
		"DocBook-Schema",
		"DocBook-Stylesheet",
		"DocBook-XML",
		"Dotseqn",
		"ECL-1.0",
		"ECL-2.0",
		"EFL-1.0",
		"EFL-2.0",
		"EPICS",
		"EPL-1.0",
		"EPL-2.0",
		"ESA-PL-permissive-2.4",
		"ESA-PL-strong-copyleft-2.4",
		"ESA-PL-weak-copyleft-2.4",
		"EUDatagrid",
		"EUPL-1.0",
		"EUPL-1.1",
		"EUPL-1.2",
		"Elastic-2.0",
		"Entessa",
		"ErlPL-1.1",
		"Eurosym",
		"FBM",
		"FDK-AAC",
		"FSFAP",
		"FSFAP-no-warranty-disclaimer",
		"FSFUL",
		"FSFULLR",
		"FSFULLRSD",
		"FSFULLRWD",
		"FSL-1.1-ALv2",
		"FSL-1.1-MIT",
		"FTL",
		"Fair",
		"Ferguson-Twofish",
		"Frameworx-1.0",
		"FreeBSD-DOC",
		"FreeImage",
		"Furuseth",
		"GCR-docs",
		"GD",
		"GFDL-1.1-invariants-only",
		"GFDL-1.1-invariants-or-later",
		"GFDL-1.1-no-invariants-only",
		"GFDL-1.1-no-invariants-or-later",
		"GFDL-1.1-only",
		"GFDL-1.1-or-later",
		"GFDL-1.2-invariants-only",
		"GFDL-1.2-invariants-or-later",
		"GFDL-1.2-no-invariants-only",
		"GFDL-1.2-no-invariants-or-later",
		"GFDL-1.2-only",
		"GFDL-1.2-or-later",
		"GFDL-1.3-invariants-only",
		"GFDL-1.3-invariants-or-later",
		"GFDL-1.3-no-invariants-only",
		"GFDL-1.3-no-invariants-or-later",
		"GFDL-1.3-only",
		"GFDL-1.3-or-later",
		"GL2PS",
		"GLWTPL",
		"GPL-1.0-only",
		"GPL-1.0-or-later",
		"GPL-2.0-only",
		"GPL-2.0-or-later",
		"GPL-3.0-only",
		"GPL-3.0-or-later",
		"Game-Programming-Gems",
		"Giftware",
		"Glide",
		"Glulxe",
		"Graphics-Gems",
		"Gutmann",
		"HDF5",
		"HIDAPI",
		"HP-1986",
		"HP-1989",
		"HPND",
		"HPND-DEC",
		"HPND-Fenneberg-Livingston",
		"HPND-INRIA-IMAG",
		"HPND-Intel",
		"HPND-Kevlin-Henney",
		"HPND-MIT-disclaimer",
		"HPND-Markus-Kuhn",
		"HPND-Netrek",
		"HPND-Pbmplus",
		"HPND-SMC",
		"HPND-UC",
		"HPND-UC-export-US",
		"HPND-doc",
		"HPND-doc-sell",
		"HPND-export-US",
		"HPND-export-US-acknowledgement",
		"HPND-export-US-modify",
		"HPND-export2-US",
		"HPND-merchantability-variant",
		"HPND-sell-MIT-disclaimer-xserver",
		"HPND-sell-regexpr",
		"HPND-sell-variant",
		"HPND-sell-variant-MIT-disclaimer",
		"HPND-sell-variant-MIT-disclaimer-rev",
		"HPND-sell-variant-critical-systems",
		"HTMLTIDY",
		"HaskellReport",
		"Hippocratic-2.1",
		"IBM-pibs",
		"ICU",
		"IEC-Code-Components-EULA",
		"IJG",
		"IJG-short",
		"IPA",
		"IPL-1.0",
		"ISC",
		"ISC-Veillard",
		"ISO-permission",
		"ImageMagick",
		"Imlib2",
		"Info-ZIP",
		"Inner-Net-2.0",
		"InnoSetup",
		"Intel",
		"Intel-ACPI",
		"Interbase-1.0",
		"JPL-image",
		"JPNIC",
		"JSON",
		"Jam",
		"JasPer-2.0",
		"Kastrup",
		"Kazlib",
		"Knuth-CTAN",
		"LAL-1.2",
		"LAL-1.3",
		"LGPL-2.0-only",
		"LGPL-2.0-or-later",
		"LGPL-2.1-only",
		"LGPL-2.1-or-later",
		"LGPL-3.0-only",
		"LGPL-3.0-or-later",
		"LGPLLR",
		"LOOP",
		"LPD-document",
		"LPL-1.0",
		"LPL-1.02",
		"LPPL-1.0",
		"LPPL-1.1",
		"LPPL-1.2",
		"LPPL-1.3a",
		"LPPL-1.3c",
		"LZMA-SDK-9.11-to-9.20",
		"LZMA-SDK-9.22",
		"Latex2e",
		"Latex2e-translated-notice",
		"Leptonica",
		"LiLiQ-P-1.1",
		"LiLiQ-R-1.1",
		"LiLiQ-Rplus-1.1",
		"Libpng",
		"Linux-OpenIB",
		"Linux-man-pages-1-para",
		"Linux-man-pages-copyleft",
		"Linux-man-pages-copyleft-2-para",
		"Linux-man-pages-copyleft-var",
		"Lucida-Bitmap-Fonts",
		"MIPS",
		"MIT",
		"MIT-0",
		"MIT-CMU",
		"MIT-Click",
		"MIT-Festival",
		"MIT-Khronos-old",
		"MIT-Modern-Variant",
		"MIT-STK",
		"MIT-Wu",
		"MIT-advertising",
		"MIT-enna",
		"MIT-feh",
		"MIT-open-group",
		"MIT-testregex",
		"MITNFA",
		"MMIXware",
		"MMPL-1.0.1",
		"MPEG-SSG",
		"MPL-1.0",
		"MPL-1.1",
		"MPL-2.0",
		"MPL-2.0-no-copyleft-exception",
		"MS-LPL",
		"MS-PL",
		"MS-RL",
		"MTLL",
		"Mackerras-3-Clause",
		"Mackerras-3-Clause-acknowledgment",
		"MakeIndex",
		"Martin-Birgmeier",
		"McPhee-slideshow",
		"Minpack",
		"MirOS",
		"Motosoto",
		"MulanPSL-1.0",
		"MulanPSL-2.0",
		"Multics",
		"Mup",
		"NAIST-2003",
		"NASA-1.3",
		"NBPL-1.0",
		"NCBI-PD",
		"NCGL-UK-2.0",
		"NCL",
		"NCSA",
		"NGPL",
		"NICTA-1.0",
		"NIST-PD",
		"NIST-PD-TNT",
		"NIST-PD-fallback",
		"NIST-Software",
		"NLOD-1.0",
		"NLOD-2.0",
		"NLPL",
		"NOSL",
		"NPL-1.0",
		"NPL-1.1",
		"NPOSL-3.0",
		"NRL",
		"NTIA-PD",
		"NTP",
		"NTP-0",
		"Naumen",
		"NetCDF",
		"Newsletr",
		"Nokia",
		"Noweb",
		"O-UDA-1.0",
		"OAR",
		"OCCT-PL",
		"OCLC-2.0",
		"ODC-By-1.0",
		"ODbL-1.0",
		"OFFIS",
		"OFL-1.0",
		"OFL-1.0-RFN",
		"OFL-1.0-no-RFN",
		"OFL-1.1",
		"OFL-1.1-RFN",
		"OFL-1.1-no-RFN",
		"OGC-1.0",
		"OGDL-Taiwan-1.0",
		"OGL-Canada-2.0",
		"OGL-UK-1.0",
		"OGL-UK-2.0",
		"OGL-UK-3.0",
		"OGTSL",
		"OLDAP-1.1",
		"OLDAP-1.2",
		"OLDAP-1.3",
		"OLDAP-1.4",
		"OLDAP-2.0",
		"OLDAP-2.0.1",
		"OLDAP-2.1",
		"OLDAP-2.2",
		"OLDAP-2.2.1",
		"OLDAP-2.2.2",
		"OLDAP-2.3",
		"OLDAP-2.4",
		"OLDAP-2.5",
		"OLDAP-2.6",
		"OLDAP-2.7",
		"OLDAP-2.8",
		"OLFL-1.3",
		"OML",
		"OPL-1.0",
		"OPL-UK-3.0",
		"OPUBL-1.0",
		"OSC-1.0",
		"OSET-PL-2.1",
		"OSL-1.0",
		"OSL-1.1",
		"OSL-2.0",
		"OSL-2.1",
		"OSL-3.0",
		"OSSP",
		"OpenMDW-1.0",
		"OpenPBS-2.3",
		"OpenSSL",
		"OpenSSL-standalone",
		"OpenVision",
		"PADL",
		"PDDL-1.0",
		"PHP-3.0",
		"PHP-3.01",
		"PPL",
		"PSF-2.0",
		"ParaType-Free-Font-1.3",
		"Parity-6.0.0",
		"Parity-7.0.0",
		"Pixar",
		"Plexus",
		"PolyForm-Noncommercial-1.0.0",
		"PolyForm-Small-Business-1.0.0",
		"PostgreSQL",
		"Python-2.0",
		"Python-2.0.1",
		"QPL-1.0",
		"QPL-1.0-INRIA-2004",
		"Qhull",
		"RHeCos-1.1",
		"RPL-1.1",
		"RPL-1.5",
		"RPSL-1.0",
		"RSA-MD",
		"RSCPL",
		"Rdisc",
		"Ruby",
		"Ruby-pty",
		"SAX-PD",
		"SAX-PD-2.0",
		"SCEA",
		"SGI-B-1.0",
		"SGI-B-1.1",
		"SGI-B-2.0",
		"SGI-OpenGL",
		"SGMLUG-PM",
		"SGP4",
		"SHL-0.5",
		"SHL-0.51",
		"SISSL",
		"SISSL-1.2",
		"SL",
		"SMAIL-GPL",
		"SMLNJ",
		"SMPPL",
		"SNIA",
		"SOFA",
		"SPL-1.0",
		"SSH-OpenSSH",
		"SSH-short",
		"SSLeay-standalone",
		"SSPL-1.0",
		"SUL-1.0",
		"SWL",
		"Saxpath",
		"SchemeReport",
		"Sendmail",
		"Sendmail-8.23",
		"Sendmail-Open-Source-1.1",
		"SimPL-2.0",
		"Sleepycat",
		"Soundex",
		"Spencer-86",
		"Spencer-94",
		"Spencer-99",
		"SugarCRM-1.1.3",
		"Sun-PPP",
		"Sun-PPP-2000",
		"SunPro",
		"Symlinks",
		"TAPR-OHL-1.0",
		"TCL",
		"TCP-wrappers",
		"TGPPL-1.0",
		"TMate",
		"TORQUE-1.1",
		"TOSL",
		"TPDL",
		"TPL-1.0",
		"TTWL",
		"TTYP0",
		"TU-Berlin-1.0",
		"TU-Berlin-2.0",
		"TekHVC",
		"TermReadKey",
		"ThirdEye",
		"TrustedQSL",
		"UCAR",
		"UCL-1.0",
		"UMich-Merit",
		"UPL-1.0",
		"URT-RLE",
		"Ubuntu-font-1.0",
		"UnRAR",
		"Unicode-3.0",
		"Unicode-DFS-2015",
		"Unicode-DFS-2016",
		"Unicode-TOU",
		"UnixCrypt",
		"Unlicense",
		"Unlicense-libtelnet",
		"Unlicense-libwhirlpool",
		"VOSTROM",
		"VSL-1.0",
		"Vim",
		"Vixie-Cron",
		"W3C",
		"W3C-19980720",
		"W3C-20150513",
		"WTFNMFPL",
		"WTFPL",
		"Watcom-1.0",
		"Widget-Workshop",
		"WordNet",
		"Wsuipa",
		"X11",
		"X11-distribute-modifications-variant",
		"X11-no-permit-persons",
		"X11-swapped",
		"XFree86-1.1",
		"XSkat",
		"Xdebug-1.03",
		"Xerox",
		"Xfig",
		"Xnet",
		"YPL-1.0",
		"YPL-1.1",
		"ZPL-1.1",
		"ZPL-2.0",
		"ZPL-2.1",
		"Zed",
		"Zeeff",
		"Zend-2.0",
		"Zimbra-1.3",
		"Zimbra-1.4",
		"Zlib",
		"any-OSI",
		"any-OSI-perl-modules",
		"bcrypt-Solar-Designer",
		"blessing",
		"bzip2-1.0.6",
		"check-cvs",
		"checkmk",
		"copyleft-next-0.3.0",
		"copyleft-next-0.3.1",
		"curl",
		"cve-tou",
		"diffmark",
		"dtoa",
		"dvipdfm",
		"eGenix",
		"etalab-2.0",
		"fwlw",
		"gSOAP-1.3b",
		"generic-xts",
		"gnuplot",
		"gtkbook",
		"hdparm",
		"hyphen-bulgarian",
		"iMatix",
		"jove",
		"libpng-1.6.35",
		"libpng-2.0",
		"libselinux-1.0",
		"libtiff",
		"libutil-David-Nugent",
		"lsof",
		"magaz",
		"mailprio",
		"man2html",
		"metamail",
		"mpi-permissive",
		"mpich2",
		"mplus",
		"ngrep",
		"pkgconf",
		"pnmstitch",
		"psfrag",
		"psutils",
		"python-ldap",
		"radvd",
		"snprintf",
		"softSurfer",
		"ssh-keyscan",
		"swrule",
		"threeparttable",
		"ulem",
		"w3m",
		"wwl",
		"xinetd",
		"xkeyboard-config-Zinoviev",
		"xlock",
		"xpp",
		"xzoom",
		"zlib-acknowledgement"
	];
}));
//#endregion
//#region ../../node_modules/.pnpm/spdx-license-ids@3.0.23/node_modules/spdx-license-ids/deprecated.json
var require_deprecated = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	module.exports = [
		"AGPL-1.0",
		"AGPL-3.0",
		"BSD-2-Clause-FreeBSD",
		"BSD-2-Clause-NetBSD",
		"GFDL-1.1",
		"GFDL-1.2",
		"GFDL-1.3",
		"GPL-1.0",
		"GPL-2.0",
		"GPL-2.0-with-GCC-exception",
		"GPL-2.0-with-autoconf-exception",
		"GPL-2.0-with-bison-exception",
		"GPL-2.0-with-classpath-exception",
		"GPL-2.0-with-font-exception",
		"GPL-3.0",
		"GPL-3.0-with-GCC-exception",
		"GPL-3.0-with-autoconf-exception",
		"LGPL-2.0",
		"LGPL-2.1",
		"LGPL-3.0",
		"Net-SNMP",
		"Nunit",
		"StandardML-NJ",
		"bzip2-1.0.5",
		"eCos-2.0",
		"wxWindows"
	];
}));
//#endregion
//#region ../../node_modules/.pnpm/spdx-exceptions@2.5.0/node_modules/spdx-exceptions/index.json
var require_spdx_exceptions = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	module.exports = [
		"389-exception",
		"Asterisk-exception",
		"Autoconf-exception-2.0",
		"Autoconf-exception-3.0",
		"Autoconf-exception-generic",
		"Autoconf-exception-generic-3.0",
		"Autoconf-exception-macro",
		"Bison-exception-1.24",
		"Bison-exception-2.2",
		"Bootloader-exception",
		"Classpath-exception-2.0",
		"CLISP-exception-2.0",
		"cryptsetup-OpenSSL-exception",
		"DigiRule-FOSS-exception",
		"eCos-exception-2.0",
		"Fawkes-Runtime-exception",
		"FLTK-exception",
		"fmt-exception",
		"Font-exception-2.0",
		"freertos-exception-2.0",
		"GCC-exception-2.0",
		"GCC-exception-2.0-note",
		"GCC-exception-3.1",
		"Gmsh-exception",
		"GNAT-exception",
		"GNOME-examples-exception",
		"GNU-compiler-exception",
		"gnu-javamail-exception",
		"GPL-3.0-interface-exception",
		"GPL-3.0-linking-exception",
		"GPL-3.0-linking-source-exception",
		"GPL-CC-1.0",
		"GStreamer-exception-2005",
		"GStreamer-exception-2008",
		"i2p-gpl-java-exception",
		"KiCad-libraries-exception",
		"LGPL-3.0-linking-exception",
		"libpri-OpenH323-exception",
		"Libtool-exception",
		"Linux-syscall-note",
		"LLGPL",
		"LLVM-exception",
		"LZMA-exception",
		"mif-exception",
		"OCaml-LGPL-linking-exception",
		"OCCT-exception-1.0",
		"OpenJDK-assembly-exception-1.0",
		"openvpn-openssl-exception",
		"PS-or-PDF-font-exception-20170817",
		"QPL-1.0-INRIA-2004-exception",
		"Qt-GPL-exception-1.0",
		"Qt-LGPL-exception-1.1",
		"Qwt-exception-1.0",
		"SANE-exception",
		"SHL-2.0",
		"SHL-2.1",
		"stunnel-exception",
		"SWI-exception",
		"Swift-exception",
		"Texinfo-exception",
		"u-boot-exception-2.0",
		"UBDL-exception",
		"Universal-FOSS-exception-1.0",
		"vsftpd-openssl-exception",
		"WxWindows-exception-3.1",
		"x11vnc-openssl-exception"
	];
}));
//#endregion
//#region ../../node_modules/.pnpm/spdx-expression-parse@4.0.0/node_modules/spdx-expression-parse/scan.js
var require_scan = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	var licenses = [].concat(require_spdx_license_ids()).concat(require_deprecated());
	var exceptions = require_spdx_exceptions();
	module.exports = function(source) {
		var index = 0;
		function hasMore() {
			return index < source.length;
		}
		function read(value) {
			if (value instanceof RegExp) {
				var match = source.slice(index).match(value);
				if (match) {
					index += match[0].length;
					return match[0];
				}
			} else if (source.indexOf(value, index) === index) {
				index += value.length;
				return value;
			}
		}
		function skipWhitespace() {
			read(/[ ]*/);
		}
		function operator() {
			var string;
			var possibilities = [
				/^WITH/i,
				/^AND/i,
				/^OR/i,
				"(",
				")",
				":",
				"+"
			];
			for (var i = 0; i < possibilities.length; i++) {
				string = read(possibilities[i]);
				if (string) break;
			}
			if (string === "+" && index > 1 && source[index - 2] === " ") throw new Error("Space before `+`");
			return string && {
				type: "OPERATOR",
				string: string.toUpperCase()
			};
		}
		function idstring() {
			return read(/[A-Za-z0-9-.]+/);
		}
		function expectIdstring() {
			var string = idstring();
			if (!string) throw new Error("Expected idstring at offset " + index);
			return string;
		}
		function documentRef() {
			if (read("DocumentRef-")) return {
				type: "DOCUMENTREF",
				string: expectIdstring()
			};
		}
		function licenseRef() {
			if (read("LicenseRef-")) return {
				type: "LICENSEREF",
				string: expectIdstring()
			};
		}
		function identifier() {
			var begin = index;
			var string = idstring();
			if (licenses.indexOf(string) !== -1) return {
				type: "LICENSE",
				string
			};
			else if (exceptions.indexOf(string) !== -1) return {
				type: "EXCEPTION",
				string
			};
			index = begin;
		}
		function parseToken() {
			return operator() || documentRef() || licenseRef() || identifier();
		}
		var tokens = [];
		while (hasMore()) {
			skipWhitespace();
			if (!hasMore()) break;
			var token = parseToken();
			if (!token) throw new Error("Unexpected `" + source[index] + "` at offset " + index);
			tokens.push(token);
		}
		return tokens;
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/spdx-expression-parse@4.0.0/node_modules/spdx-expression-parse/parse.js
var require_parse = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	module.exports = function(tokens) {
		var index = 0;
		function hasMore() {
			return index < tokens.length;
		}
		function token() {
			return hasMore() ? tokens[index] : null;
		}
		function next() {
			if (!hasMore()) throw new Error();
			index++;
		}
		function parseOperator(operator) {
			var t = token();
			if (t && t.type === "OPERATOR" && operator === t.string) {
				next();
				return t.string;
			}
		}
		function parseWith() {
			if (parseOperator("WITH")) {
				var t = token();
				if (t && t.type === "EXCEPTION") {
					next();
					return t.string;
				}
				throw new Error("Expected exception after `WITH`");
			}
		}
		function parseLicenseRef() {
			var begin = index;
			var string = "";
			var t = token();
			if (t.type === "DOCUMENTREF") {
				next();
				string += "DocumentRef-" + t.string + ":";
				if (!parseOperator(":")) throw new Error("Expected `:` after `DocumentRef-...`");
			}
			t = token();
			if (t.type === "LICENSEREF") {
				next();
				string += "LicenseRef-" + t.string;
				return { license: string };
			}
			index = begin;
		}
		function parseLicense() {
			var t = token();
			if (t && t.type === "LICENSE") {
				next();
				var node = { license: t.string };
				if (parseOperator("+")) node.plus = true;
				var exception = parseWith();
				if (exception) node.exception = exception;
				return node;
			}
		}
		function parseParenthesizedExpression() {
			if (!parseOperator("(")) return;
			var expr = parseExpression();
			if (!parseOperator(")")) throw new Error("Expected `)`");
			return expr;
		}
		function parseAtom() {
			return parseParenthesizedExpression() || parseLicenseRef() || parseLicense();
		}
		function makeBinaryOpParser(operator, nextParser) {
			return function parseBinaryOp() {
				var left = nextParser();
				if (!left) return;
				if (!parseOperator(operator)) return left;
				var right = parseBinaryOp();
				if (!right) throw new Error("Expected expression");
				return {
					left,
					conjunction: operator.toLowerCase(),
					right
				};
			};
		}
		var parseExpression = makeBinaryOpParser("OR", makeBinaryOpParser("AND", parseAtom));
		var node = parseExpression();
		if (!node || hasMore()) throw new Error("Syntax error");
		return node;
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/spdx-expression-parse@4.0.0/node_modules/spdx-expression-parse/index.js
var require_spdx_expression_parse = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	var scan = require_scan();
	var parse = require_parse();
	module.exports = function(source) {
		return parse(scan(source));
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+package-json@7.0.5/node_modules/@npmcli/package-json/lib/license.js
var require_license = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const parse = require_spdx_expression_parse();
	function usesLicenseRef(ast) {
		if (Object.hasOwn(ast, "license")) return ast.license.startsWith("LicenseRef") || ast.license.startsWith("DocumentRef");
		else return usesLicenseRef(ast.left) || usesLicenseRef(ast.right);
	}
	module.exports = function licenseValidForNewPackage(argument) {
		if (argument === "UNLICENSED" || argument === "UNLICENCED") return true;
		if (/^SEE LICEN[CS]E IN ./.test(argument)) return true;
		try {
			return !usesLicenseRef(parse(argument));
		} catch {
			return false;
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+package-json@7.0.5/node_modules/@npmcli/package-json/lib/normalize-data.js
var require_normalize_data = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const { URL: URL$2 } = require("node:url");
	const hostedGitInfo = require_lib$11();
	const validateLicense = require_license();
	const typos = {
		dependancies: "dependencies",
		dependecies: "dependencies",
		depdenencies: "dependencies",
		devEependencies: "devDependencies",
		depends: "dependencies",
		"dev-dependencies": "devDependencies",
		devDependences: "devDependencies",
		devDepenencies: "devDependencies",
		devdependencies: "devDependencies",
		repostitory: "repository",
		repo: "repository",
		prefereGlobal: "preferGlobal",
		hompage: "homepage",
		hampage: "homepage",
		autohr: "author",
		autor: "author",
		contributers: "contributors",
		publicationConfig: "publishConfig",
		script: "scripts"
	};
	const isEmail = (str) => str.includes("@") && str.indexOf("@") < str.lastIndexOf(".");
	function extractDescription(description) {
		const lines = description.trim().split("\n");
		let start = 0;
		while (lines[start]?.trim().match(/^(#|$)/)) start++;
		let end = start + 1;
		while (end < lines.length && lines[end].trim()) end++;
		return lines.slice(start, end).join(" ").trim();
	}
	function stringifyPerson(person) {
		if (typeof person !== "string") {
			const name = person.name || "";
			const u = person.url || person.web;
			const wrappedUrl = u ? " (" + u + ")" : "";
			const e = person.email || person.mail;
			person = name + (e ? " <" + e + ">" : "") + wrappedUrl;
		}
		const matchedName = person.match(/^([^(<]+)/);
		const matchedUrl = person.match(/\(([^()]+)\)/);
		const matchedEmail = person.match(/<([^<>]+)>/);
		const parsed = {};
		if (matchedName?.[0].trim()) parsed.name = matchedName[0].trim();
		if (matchedEmail) parsed.email = matchedEmail[1];
		if (matchedUrl) parsed.url = matchedUrl[1];
		return parsed;
	}
	function normalizeData(data, changes) {
		if (data.description && typeof data.description !== "string") {
			changes?.push(`'description' field should be a string`);
			delete data.description;
		}
		if (data.readme && !data.description && data.readme !== "ERROR: No README data found!") data.description = extractDescription(data.readme);
		if (data.description === void 0) delete data.description;
		if (!data.description) changes?.push("No description");
		if (data.modules) {
			changes?.push(`modules field is deprecated`);
			delete data.modules;
		}
		const files = data.files;
		if (files && !Array.isArray(files)) {
			changes?.push(`Invalid 'files' member`);
			delete data.files;
		} else if (data.files) data.files = data.files.filter(function(file) {
			if (!file || typeof file !== "string") {
				changes?.push(`Invalid filename in 'files' list: ${file}`);
				return false;
			} else return true;
		});
		if (data.man && typeof data.man === "string") data.man = [data.man];
		if (!data.bugs && data.repository?.url) {
			const hosted = hostedGitInfo.fromUrl(data.repository.url);
			if (hosted && hosted.bugs()) data.bugs = { url: hosted.bugs() };
		} else if (data.bugs) {
			if (typeof data.bugs === "string") {
				if (isEmail(data.bugs)) data.bugs = { email: data.bugs };
				else if (URL$2.canParse(data.bugs)) data.bugs = { url: data.bugs };
				else changes?.push(`Bug string field must be url, email, or {email,url}`);
			} else {
				for (const k in data.bugs) if (["web", "name"].includes(k)) {
					changes?.push(`bugs['${k}'] should probably be bugs['url'].`);
					data.bugs.url = data.bugs[k];
					delete data.bugs[k];
				}
				const oldBugs = data.bugs;
				data.bugs = {};
				if (oldBugs.url) {
					if (URL$2.canParse(oldBugs.url)) data.bugs.url = oldBugs.url;
					else changes?.push("bugs.url field must be a string url. Deleted.");
				}
				if (oldBugs.email) {
					if (typeof oldBugs.email === "string" && isEmail(oldBugs.email)) data.bugs.email = oldBugs.email;
					else changes?.push("bugs.email field must be a string email. Deleted.");
				}
			}
			if (!data.bugs.email && !data.bugs.url) {
				delete data.bugs;
				changes?.push("Normalized value of bugs field is an empty object. Deleted.");
			}
		}
		if (typeof data.keywords === "string") data.keywords = data.keywords.split(/,\s+/);
		if (data.keywords && !Array.isArray(data.keywords)) {
			delete data.keywords;
			changes?.push(`keywords should be an array of strings`);
		} else if (data.keywords) data.keywords = data.keywords.filter(function(kw) {
			if (typeof kw !== "string" || !kw) {
				changes?.push(`keywords should be an array of strings`);
				return false;
			} else return true;
		});
		const bdd = "bundledDependencies";
		const bd = "bundleDependencies";
		if (data[bdd] && !data[bd]) {
			data[bd] = data[bdd];
			delete data[bdd];
		}
		if (data[bd] && !Array.isArray(data[bd])) {
			changes?.push(`Invalid 'bundleDependencies' list. Must be array of package names`);
			delete data[bd];
		} else if (data[bd]) data[bd] = data[bd].filter(function(filtered) {
			if (!filtered || typeof filtered !== "string") {
				changes?.push(`Invalid bundleDependencies member: ${filtered}`);
				return false;
			} else {
				if (!data.dependencies) data.dependencies = {};
				if (!Object.prototype.hasOwnProperty.call(data.dependencies, filtered)) {
					changes?.push(`Non-dependency in bundleDependencies: ${filtered}`);
					data.dependencies[filtered] = "*";
				}
				return true;
			}
		});
		if (!data.homepage && data.repository && data.repository.url) {
			const hosted = hostedGitInfo.fromUrl(data.repository.url);
			if (hosted) data.homepage = hosted.docs();
		}
		if (data.homepage) {
			if (typeof data.homepage !== "string") {
				changes?.push("homepage field must be a string url. Deleted.");
				delete data.homepage;
			} else if (!URL$2.canParse(data.homepage)) data.homepage = "http://" + data.homepage;
		}
		if (!data.readme) {
			changes?.push("No README data");
			data.readme = "ERROR: No README data found!";
		}
		const license = data.license || data.licence;
		if (!license) changes?.push("No license field.");
		else if (typeof license !== "string" || license.length < 1 || license.trim() === "") changes?.push("license should be a valid SPDX license expression");
		else if (!validateLicense(license)) changes?.push("license should be a valid SPDX license expression");
		if (data.author) data.author = stringifyPerson(data.author);
		["maintainers", "contributors"].forEach(function(set) {
			if (!Array.isArray(data[set])) return;
			data[set] = data[set].map(stringifyPerson);
		});
		for (const d in typos) if (Object.prototype.hasOwnProperty.call(data, d)) changes?.push(`${d} should probably be ${typos[d]}.`);
	}
	module.exports = { normalizeData };
}));
//#endregion
//#region ../../node_modules/.pnpm/isexe@4.0.0/node_modules/isexe/dist/commonjs/index.min.js
var require_index_min = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports) => {
	var a = (t, e) => () => (e || t((e = { exports: {} }).exports, e), e.exports);
	var _ = a((i) => {
		"use strict";
		Object.defineProperty(i, "__esModule", { value: !0 });
		i.sync = i.isexe = void 0;
		var M = require("node:fs"), x = require("node:fs/promises"), q = async (t, e = {}) => {
			let { ignoreErrors: r = !1 } = e;
			try {
				return d(await (0, x.stat)(t), e);
			} catch (s) {
				let n = s;
				if (r || n.code === "EACCES") return !1;
				throw n;
			}
		};
		i.isexe = q;
		var m = (t, e = {}) => {
			let { ignoreErrors: r = !1 } = e;
			try {
				return d((0, M.statSync)(t), e);
			} catch (s) {
				let n = s;
				if (r || n.code === "EACCES") return !1;
				throw n;
			}
		};
		i.sync = m;
		var d = (t, e) => t.isFile() && A(t, e), A = (t, e) => {
			let r = e.uid ?? process.getuid?.(), s = e.groups ?? process.getgroups?.() ?? [], n = e.gid ?? process.getgid?.() ?? s[0];
			if (r === void 0 || n === void 0) throw new Error("cannot get uid or gid");
			let u = /* @__PURE__ */ new Set([n, ...s]), c = t.mode, S = t.uid, P = t.gid, f = parseInt("100", 8), l = parseInt("010", 8);
			return !!(c & parseInt("001", 8) || c & l && u.has(P) || c & f && S === r || c & 72 && r === 0);
		};
	});
	var g = a((o) => {
		"use strict";
		Object.defineProperty(o, "__esModule", { value: !0 });
		o.sync = o.isexe = void 0;
		var T = require("node:fs"), I = require("node:fs/promises"), D = require("node:path"), F = async (t, e = {}) => {
			let { ignoreErrors: r = !1 } = e;
			try {
				return y(await (0, I.stat)(t), t, e);
			} catch (s) {
				let n = s;
				if (r || n.code === "EACCES") return !1;
				throw n;
			}
		};
		o.isexe = F;
		var L = (t, e = {}) => {
			let { ignoreErrors: r = !1 } = e;
			try {
				return y((0, T.statSync)(t), t, e);
			} catch (s) {
				let n = s;
				if (r || n.code === "EACCES") return !1;
				throw n;
			}
		};
		o.sync = L;
		var B = (t, e) => {
			let { pathExt: r = process.env.PATHEXT || "" } = e, s = r.split(D.delimiter);
			if (s.indexOf("") !== -1) return !0;
			for (let n of s) {
				let u = n.toLowerCase(), c = t.substring(t.length - u.length).toLowerCase();
				if (u && c === u) return !0;
			}
			return !1;
		}, y = (t, e, r) => t.isFile() && B(e, r);
	});
	var p = a((h) => {
		"use strict";
		Object.defineProperty(h, "__esModule", { value: !0 });
	});
	var v = exports && exports.__createBinding || (Object.create ? (function(t, e, r, s) {
		s === void 0 && (s = r);
		var n = Object.getOwnPropertyDescriptor(e, r);
		(!n || ("get" in n ? !e.__esModule : n.writable || n.configurable)) && (n = {
			enumerable: !0,
			get: function() {
				return e[r];
			}
		}), Object.defineProperty(t, s, n);
	}) : (function(t, e, r, s) {
		s === void 0 && (s = r), t[s] = e[r];
	}));
	var G = exports && exports.__setModuleDefault || (Object.create ? (function(t, e) {
		Object.defineProperty(t, "default", {
			enumerable: !0,
			value: e
		});
	}) : function(t, e) {
		t.default = e;
	});
	var w = exports && exports.__importStar || (function() {
		var t = function(e) {
			return t = Object.getOwnPropertyNames || function(r) {
				var s = [];
				for (var n in r) Object.prototype.hasOwnProperty.call(r, n) && (s[s.length] = n);
				return s;
			}, t(e);
		};
		return function(e) {
			if (e && e.__esModule) return e;
			var r = {};
			if (e != null) for (var s = t(e), n = 0; n < s.length; n++) s[n] !== "default" && v(r, e, s[n]);
			return G(r, e), r;
		};
	})();
	var X = exports && exports.__exportStar || function(t, e) {
		for (var r in t) r !== "default" && !Object.prototype.hasOwnProperty.call(e, r) && v(e, t, r);
	};
	Object.defineProperty(exports, "__esModule", { value: !0 });
	exports.sync = exports.isexe = exports.posix = exports.win32 = void 0;
	var E = w(_());
	exports.posix = E;
	var O = w(g());
	exports.win32 = O;
	X(p(), exports);
	var b = (process.env._ISEXE_TEST_PLATFORM_ || process.platform) === "win32" ? O : E;
	exports.isexe = b.isexe;
	exports.sync = b.sync;
}));
//#endregion
//#region ../../node_modules/.pnpm/which@6.0.1/node_modules/which/lib/index.js
var require_lib$10 = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const { isexe, sync: isexeSync } = require_index_min();
	const { join: join$6, delimiter, sep, posix } = require("path");
	const isWindows = process.platform === "win32";
	/* istanbul ignore next */
	const rSlash = new RegExp(`[${posix.sep}${sep === posix.sep ? "" : sep}]`.replace(/(\\)/g, "\\$1"));
	const rRel = new RegExp(`^\\.${rSlash.source}`);
	const getNotFoundError = (cmd) => Object.assign(/* @__PURE__ */ new Error(`not found: ${cmd}`), { code: "ENOENT" });
	const getPathInfo = (cmd, { path: optPath = process.env.PATH, pathExt: optPathExt = process.env.PATHEXT, delimiter: optDelimiter = delimiter }) => {
		const pathEnv = cmd.match(rSlash) ? [""] : [...isWindows ? [process.cwd()] : [], ...(optPath || /* istanbul ignore next: very unusual */ "").split(optDelimiter)];
		if (isWindows) {
			const pathExtExe = optPathExt || [
				".EXE",
				".CMD",
				".BAT",
				".COM"
			].join(optDelimiter);
			const pathExt = pathExtExe.split(optDelimiter).flatMap((item) => [item, item.toLowerCase()]);
			if (cmd.includes(".") && pathExt[0] !== "") pathExt.unshift("");
			return {
				pathEnv,
				pathExt,
				pathExtExe
			};
		}
		return {
			pathEnv,
			pathExt: [""]
		};
	};
	const getPathPart = (raw, cmd) => {
		const pathPart = /^".*"$/.test(raw) ? raw.slice(1, -1) : raw;
		return (!pathPart && rRel.test(cmd) ? cmd.slice(0, 2) : "") + join$6(pathPart, cmd);
	};
	const which = async (cmd, opt = {}) => {
		const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
		const found = [];
		for (const envPart of pathEnv) {
			const p = getPathPart(envPart, cmd);
			for (const ext of pathExt) {
				const withExt = p + ext;
				if (await isexe(withExt, {
					pathExt: pathExtExe,
					ignoreErrors: true
				})) {
					if (!opt.all) return withExt;
					found.push(withExt);
				}
			}
		}
		if (opt.all && found.length) return found;
		if (opt.nothrow) return null;
		throw getNotFoundError(cmd);
	};
	const whichSync = (cmd, opt = {}) => {
		const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
		const found = [];
		for (const pathEnvPart of pathEnv) {
			const p = getPathPart(pathEnvPart, cmd);
			for (const ext of pathExt) {
				const withExt = p + ext;
				if (isexeSync(withExt, {
					pathExt: pathExtExe,
					ignoreErrors: true
				})) {
					if (!opt.all) return withExt;
					found.push(withExt);
				}
			}
		}
		if (opt.all && found.length) return found;
		if (opt.nothrow) return null;
		throw getNotFoundError(cmd);
	};
	module.exports = which;
	which.sync = whichSync;
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+promise-spawn@9.0.1/node_modules/@npmcli/promise-spawn/lib/escape.js
var require_escape = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const cmd = (input, doubleEscape) => {
		if (!input.length) return "\"\"";
		let result;
		if (!/[ \t\n\v"]/.test(input)) result = input;
		else {
			result = "\"";
			for (let i = 0; i <= input.length; ++i) {
				let slashCount = 0;
				while (input[i] === "\\") {
					++i;
					++slashCount;
				}
				if (i === input.length) {
					result += "\\".repeat(slashCount * 2);
					break;
				}
				if (input[i] === "\"") {
					result += "\\".repeat(slashCount * 2 + 1);
					result += input[i];
				} else {
					result += "\\".repeat(slashCount);
					result += input[i];
				}
			}
			result += "\"";
		}
		result = result.replace(/[ !%^&()<>|"]/g, "^$&");
		if (doubleEscape) result = result.replace(/[ !%^&()<>|"]/g, "^$&");
		return result;
	};
	const sh = (input) => {
		if (!input.length) return `''`;
		if (!/[\t\n\r "#$&'()*;<>?\\`|~]/.test(input)) return input;
		return `'${input.replace(/'/g, `'\\''`)}'`.replace(/^(?:'')+(?!$)/, "").replace(/\\'''/g, `\\'`);
	};
	module.exports = {
		cmd,
		sh
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+promise-spawn@9.0.1/node_modules/@npmcli/promise-spawn/lib/index.js
var require_lib$9 = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const { spawn } = require("child_process");
	const os$1 = require("os");
	const which = require_lib$10();
	const escape = require_escape();
	const promiseSpawn = (cmd, args, opts = {}, extra = {}) => {
		if (opts.shell) return spawnWithShell(cmd, args, opts, extra);
		let resolve, reject;
		const promise = new Promise((_resolve, _reject) => {
			resolve = _resolve;
			reject = _reject;
		});
		const closeError = /* @__PURE__ */ new Error("command failed");
		const stdout = [];
		const stderr = [];
		const getResult = (result) => ({
			cmd,
			args,
			...result,
			...stdioResult(stdout, stderr, opts),
			...extra
		});
		const rejectWithOpts = (er, erOpts) => {
			const resultError = getResult(erOpts);
			reject(Object.assign(er, resultError));
		};
		const proc = spawn(cmd, args, opts);
		promise.stdin = proc.stdin;
		promise.process = proc;
		proc.on("error", rejectWithOpts);
		if (proc.stdout) {
			proc.stdout.on("data", (c) => stdout.push(c));
			proc.stdout.on("error", rejectWithOpts);
		}
		if (proc.stderr) {
			proc.stderr.on("data", (c) => stderr.push(c));
			proc.stderr.on("error", rejectWithOpts);
		}
		proc.on("close", (code, signal) => {
			if (code || signal) rejectWithOpts(closeError, {
				code,
				signal
			});
			else resolve(getResult({
				code,
				signal
			}));
		});
		return promise;
	};
	const spawnWithShell = (cmd, args, opts, extra) => {
		let command = opts.shell;
		if (command === true)
 // istanbul ignore next
		command = process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "sh";
		const options = {
			...opts,
			shell: false
		};
		const realArgs = [];
		let script = cmd;
		if (/(?:^|\\)cmd(?:\.exe)?$/i.test(command)) {
			let doubleEscape = false;
			let initialCmd = "";
			let insideQuotes = false;
			for (let i = 0; i < cmd.length; ++i) {
				const char = cmd.charAt(i);
				if (char === " " && !insideQuotes) break;
				initialCmd += char;
				if (char === "\"" || char === "'") insideQuotes = !insideQuotes;
			}
			let pathToInitial;
			try {
				pathToInitial = which.sync(initialCmd, {
					path: options.env && findInObject(options.env, "PATH") || process.env.PATH,
					pathext: options.env && findInObject(options.env, "PATHEXT") || process.env.PATHEXT
				}).toLowerCase();
			} catch (err) {
				pathToInitial = initialCmd.toLowerCase();
			}
			doubleEscape = pathToInitial.endsWith(".cmd") || pathToInitial.endsWith(".bat");
			for (const arg of args) script += ` ${escape.cmd(arg, doubleEscape)}`;
			realArgs.push("/d", "/s", "/c", script);
			options.windowsVerbatimArguments = true;
		} else {
			for (const arg of args) script += ` ${escape.sh(arg)}`;
			realArgs.push("-c", script);
		}
		return promiseSpawn(command, realArgs, options, extra);
	};
	const open = (_args, opts = {}, extra = {}) => {
		const options = {
			...opts,
			shell: true
		};
		const args = [].concat(_args);
		let platform = process.platform;
		if (platform === "linux" && os$1.release().toLowerCase().includes("microsoft")) {
			platform = "wsl";
			if (!process.env.BROWSER) return Promise.reject(/* @__PURE__ */ new Error("Set the BROWSER environment variable to your desired browser."));
		}
		let command = options.command;
		if (!command) {
			if (platform === "win32") {
				options.shell = process.env.ComSpec;
				command = "start \"\"";
			} else if (platform === "wsl") command = "sensible-browser";
			else if (platform === "darwin") command = "open";
			else command = "xdg-open";
		}
		return spawnWithShell(command, args, options, extra);
	};
	promiseSpawn.open = open;
	const isPipe = (stdio = "pipe", fd) => {
		if (stdio === "pipe" || stdio === null) return true;
		if (Array.isArray(stdio)) return isPipe(stdio[fd], fd);
		return false;
	};
	const stdioResult = (stdout, stderr, { stdioString = true, stdio }) => {
		const result = {
			stdout: null,
			stderr: null
		};
		if (isPipe(stdio, 1)) {
			result.stdout = Buffer.concat(stdout);
			if (stdioString) result.stdout = result.stdout.toString().trim();
		}
		if (isPipe(stdio, 2)) {
			result.stderr = Buffer.concat(stderr);
			if (stdioString) result.stderr = result.stderr.toString().trim();
		}
		return result;
	};
	const findInObject = (obj, key) => {
		key = key.toLowerCase();
		for (const objKey of Object.keys(obj).sort()) if (objKey.toLowerCase() === key) return obj[objKey];
	};
	module.exports = promiseSpawn;
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+git@7.0.2/node_modules/@npmcli/git/lib/errors.js
var require_errors = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const maxRetry = 3;
	var GitError = class extends Error {
		shouldRetry() {
			return false;
		}
	};
	var GitConnectionError = class extends GitError {
		constructor() {
			super("A git connection error occurred");
		}
		shouldRetry(number) {
			return number < maxRetry;
		}
	};
	var GitPathspecError = class extends GitError {
		constructor() {
			super("The git reference could not be found");
		}
	};
	var GitUnknownError = class extends GitError {
		constructor() {
			super("An unknown git error occurred");
		}
	};
	module.exports = {
		GitConnectionError,
		GitPathspecError,
		GitUnknownError
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+git@7.0.2/node_modules/@npmcli/git/lib/make-error.js
var require_make_error = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const { GitConnectionError, GitPathspecError, GitUnknownError } = require_errors();
	const connectionErrorRe = new RegExp([
		"remote error: Internal Server Error",
		"The remote end hung up unexpectedly",
		"Connection timed out",
		"Operation timed out",
		"Failed to connect to .* Timed out",
		"Connection reset by peer",
		"SSL_ERROR_SYSCALL",
		"The requested URL returned error: 503"
	].join("|"));
	const missingPathspecRe = /pathspec .* did not match any file\(s\) known to git/;
	function makeError(er) {
		const message = er.stderr;
		let gitEr;
		if (connectionErrorRe.test(message)) gitEr = new GitConnectionError(message);
		else if (missingPathspecRe.test(message)) gitEr = new GitPathspecError(message);
		else gitEr = new GitUnknownError(message);
		return Object.assign(gitEr, er);
	}
	module.exports = makeError;
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+git@7.0.2/node_modules/@npmcli/git/lib/opts.js
var require_opts = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const fs$4 = require("node:fs");
	const os = require("node:os");
	const path$5 = require("node:path");
	const ini = require_ini();
	const gitConfigPath = path$5.join(os.homedir(), ".gitconfig");
	let cachedConfig = null;
	const loadGitConfig = () => {
		if (cachedConfig === null) try {
			cachedConfig = {};
			if (fs$4.existsSync(gitConfigPath)) {
				const configContent = fs$4.readFileSync(gitConfigPath, "utf-8");
				cachedConfig = ini.parse(configContent);
			}
		} catch (error) {
			cachedConfig = {};
		}
		return cachedConfig;
	};
	const checkGitConfigs = () => {
		const config = loadGitConfig();
		return {
			sshCommandSetInConfig: config?.core?.sshCommand !== void 0,
			askPassSetInConfig: config?.core?.askpass !== void 0
		};
	};
	const sshCommandSetInEnv = process.env.GIT_SSH_COMMAND !== void 0;
	const askPassSetInEnv = process.env.GIT_ASKPASS !== void 0;
	const { sshCommandSetInConfig, askPassSetInConfig } = checkGitConfigs();
	const finalGitEnv = {
		...askPassSetInEnv || askPassSetInConfig ? {} : { GIT_ASKPASS: "echo" },
		...sshCommandSetInEnv || sshCommandSetInConfig ? {} : { GIT_SSH_COMMAND: "ssh -oStrictHostKeyChecking=accept-new" }
	};
	module.exports = (opts = {}) => ({
		stdioString: true,
		...opts,
		shell: false,
		env: opts.env || {
			...finalGitEnv,
			...process.env
		}
	});
	module.exports.loadGitConfig = loadGitConfig;
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+git@7.0.2/node_modules/@npmcli/git/lib/which.js
var require_which = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const which = require_lib$10();
	let gitPath;
	try {
		gitPath = which.sync("git");
	} catch {}
	module.exports = (opts = {}) => {
		if (opts.git) return opts.git;
		if (!gitPath || opts.git === false) return Object.assign(/* @__PURE__ */ new Error("No git binary found in $PATH"), { code: "ENOGIT" });
		return gitPath;
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+git@7.0.2/node_modules/@npmcli/git/lib/spawn.js
var require_spawn = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const spawn = require_lib$9();
	const { promiseRetry } = require_commonjs$2.require_lib();
	const { log } = require_commonjs$2.require_lib$1();
	const makeError = require_make_error();
	const makeOpts = require_opts();
	module.exports = (gitArgs, opts = {}) => {
		const gitPath = require_which()(opts);
		if (gitPath instanceof Error) return Promise.reject(gitPath);
		const args = opts.allowReplace || gitArgs[0] === "--no-replace-objects" ? gitArgs : ["--no-replace-objects", ...gitArgs];
		let retryOpts = opts.retry;
		if (retryOpts === null || retryOpts === void 0) retryOpts = {
			retries: opts.fetchRetries || 2,
			factor: opts.fetchRetryFactor || 10,
			maxTimeout: opts.fetchRetryMaxtimeout || 6e4,
			minTimeout: opts.fetchRetryMintimeout || 1e3
		};
		return promiseRetry((retryFn, number) => {
			if (number !== 1) log.silly("git", `Retrying git command: ${args.join(" ")} attempt # ${number}`);
			return spawn(gitPath, args, makeOpts(opts)).catch((er) => {
				const gitError = makeError(er);
				if (!gitError.shouldRetry(number)) throw gitError;
				retryFn(gitError);
			});
		}, retryOpts);
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+git@7.0.2/node_modules/@npmcli/git/lib/lines-to-revs.js
var require_lines_to_revs = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const semver = require_commonjs$2.require_semver();
	module.exports = (lines) => finish(lines.reduce(linesToRevsReducer, {
		versions: {},
		"dist-tags": {},
		refs: {},
		shas: {}
	}));
	const finish = (revs) => distTags(shaList(peelTags(revs)));
	const shaList = (revs) => {
		Object.keys(revs.refs).forEach((ref) => {
			const doc = revs.refs[ref];
			if (!revs.shas[doc.sha]) revs.shas[doc.sha] = [ref];
			else revs.shas[doc.sha].push(ref);
		});
		return revs;
	};
	const peelTags = (revs) => {
		Object.keys(revs.refs).filter((ref) => ref.endsWith("^{}")).forEach((ref) => {
			const peeled = revs.refs[ref];
			const unpeeled = revs.refs[ref.replace(/\^\{\}$/, "")];
			if (unpeeled) {
				unpeeled.sha = peeled.sha;
				delete revs.refs[ref];
			}
		});
		return revs;
	};
	const distTags = (revs) => {
		const HEAD = revs.refs.HEAD || /* istanbul ignore next */ {};
		Object.keys(revs.versions).forEach((v) => {
			const ver = revs.versions[v];
			if (revs.refs.latest && ver.sha === revs.refs.latest.sha) revs["dist-tags"].latest = v;
			else if (ver.sha === HEAD.sha) {
				revs["dist-tags"].HEAD = v;
				if (!revs.refs.latest) revs["dist-tags"].latest = v;
			}
		});
		return revs;
	};
	const refType = (ref) => {
		if (ref.startsWith("refs/tags/")) return "tag";
		if (ref.startsWith("refs/heads/")) return "branch";
		if (ref.startsWith("refs/pull/")) return "pull";
		if (ref === "HEAD") return "head";
		/* istanbul ignore next */
		return "other";
	};
	const lineToRevDoc = (line) => {
		const split = line.trim().split(/\s+/, 2);
		if (split.length < 2) return null;
		const sha = split[0].trim();
		const rawRef = split[1].trim();
		const type = refType(rawRef);
		if (type === "tag") return {
			sha,
			ref: rawRef.slice(10),
			rawRef,
			type
		};
		if (type === "branch") return {
			sha,
			ref: rawRef.slice(11),
			rawRef,
			type
		};
		if (type === "pull") return {
			sha,
			ref: rawRef.slice(5).replace(/\/head$/, ""),
			rawRef,
			type
		};
		if (type === "head") return {
			sha,
			ref: "HEAD",
			rawRef,
			type
		};
		return {
			sha,
			ref: rawRef,
			rawRef,
			type
		};
	};
	const linesToRevsReducer = (revs, line) => {
		const doc = lineToRevDoc(line);
		if (!doc) return revs;
		revs.refs[doc.ref] = doc;
		revs.refs[doc.rawRef] = doc;
		if (doc.type === "tag") {
			const match = !doc.ref.endsWith("^{}") && doc.ref.match(/v?(\d+\.\d+\.\d+(?:[-+].+)?)$/);
			if (match && semver.valid(match[1], true)) revs.versions[semver.clean(match[1], true)] = doc;
		}
		return revs;
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+git@7.0.2/node_modules/@npmcli/git/lib/revs.js
var require_revs = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const spawn = require_spawn();
	const { LRUCache } = require_commonjs$2.require_index_min$1();
	const linesToRevs = require_lines_to_revs();
	const revsCache = new LRUCache({
		max: 100,
		ttl: 3e5
	});
	module.exports = async (repo, opts = {}) => {
		if (!opts.noGitRevCache) {
			const cached = revsCache.get(repo);
			if (cached) return cached;
		}
		const { stdout } = await spawn(["ls-remote", repo], opts);
		const revs = linesToRevs(stdout.trim().split("\n"));
		revsCache.set(repo, revs);
		return revs;
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+git@7.0.2/node_modules/@npmcli/git/lib/utils.js
var require_utils = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports) => {
	const isWindows = (opts) => (opts.fakePlatform || process.platform) === "win32";
	exports.isWindows = isWindows;
}));
//#endregion
//#region ../../node_modules/.pnpm/validate-npm-package-name@7.0.2/node_modules/validate-npm-package-name/lib/builtin-modules.json
var require_builtin_modules = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	module.exports = [
		"_http_agent",
		"_http_client",
		"_http_common",
		"_http_incoming",
		"_http_outgoing",
		"_http_server",
		"_stream_duplex",
		"_stream_passthrough",
		"_stream_readable",
		"_stream_transform",
		"_stream_wrap",
		"_stream_writable",
		"_tls_common",
		"_tls_wrap",
		"assert",
		"assert/strict",
		"async_hooks",
		"buffer",
		"child_process",
		"cluster",
		"console",
		"constants",
		"crypto",
		"dgram",
		"diagnostics_channel",
		"dns",
		"dns/promises",
		"domain",
		"events",
		"fs",
		"fs/promises",
		"http",
		"http2",
		"https",
		"inspector",
		"inspector/promises",
		"module",
		"net",
		"os",
		"path",
		"path/posix",
		"path/win32",
		"perf_hooks",
		"process",
		"punycode",
		"querystring",
		"readline",
		"readline/promises",
		"repl",
		"stream",
		"stream/consumers",
		"stream/promises",
		"stream/web",
		"string_decoder",
		"sys",
		"timers",
		"timers/promises",
		"tls",
		"trace_events",
		"tty",
		"url",
		"util",
		"util/types",
		"v8",
		"vm",
		"wasi",
		"worker_threads",
		"zlib",
		"node:sea",
		"node:sqlite",
		"node:test",
		"node:test/reporters"
	];
}));
//#endregion
//#region ../../node_modules/.pnpm/validate-npm-package-name@7.0.2/node_modules/validate-npm-package-name/lib/index.js
var require_lib$8 = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const builtins = require_builtin_modules();
	var scopedPackagePattern = /* @__PURE__ */ new RegExp("^(?:@([^/]+?)[/])?([^/]+?)$");
	var exclusionList = ["node_modules", "favicon.ico"];
	function validate(name) {
		var warnings = [];
		var errors = [];
		if (name === null) {
			errors.push("name cannot be null");
			return done(warnings, errors);
		}
		if (name === void 0) {
			errors.push("name cannot be undefined");
			return done(warnings, errors);
		}
		if (typeof name !== "string") {
			errors.push("name must be a string");
			return done(warnings, errors);
		}
		if (!name.length) errors.push("name length must be greater than zero");
		if (name.startsWith(".")) errors.push("name cannot start with a period");
		if (name.startsWith("-")) errors.push("name cannot start with a hyphen");
		if (name.match(/^_/)) errors.push("name cannot start with an underscore");
		if (name.trim() !== name) errors.push("name cannot contain leading or trailing spaces");
		exclusionList.forEach(function(excludedName) {
			if (name.toLowerCase() === excludedName) errors.push(excludedName + " is not a valid package name");
		});
		if (builtins.includes(name.toLowerCase())) warnings.push(name + " is a core module name");
		if (name.length > 214) warnings.push("name can no longer contain more than 214 characters");
		if (name.toLowerCase() !== name) warnings.push("name can no longer contain capital letters");
		if (/[~'!()*]/.test(name.split("/").slice(-1)[0])) warnings.push("name can no longer contain special characters (\"~'!()*\")");
		if (encodeURIComponent(name) !== name) {
			var nameMatch = name.match(scopedPackagePattern);
			if (nameMatch) {
				var user = nameMatch[1];
				var pkg = nameMatch[2];
				if (pkg.startsWith(".")) errors.push("name cannot start with a period");
				if (encodeURIComponent(user) === user && encodeURIComponent(pkg) === pkg) return done(warnings, errors);
			}
			errors.push("name can only contain URL-friendly characters");
		}
		return done(warnings, errors);
	}
	var done = function(warnings, errors) {
		var result = {
			validForNewPackages: errors.length === 0 && warnings.length === 0,
			validForOldPackages: errors.length === 0,
			warnings,
			errors
		};
		if (!result.warnings.length) delete result.warnings;
		if (!result.errors.length) delete result.errors;
		return result;
	};
	module.exports = validate;
}));
//#endregion
//#region ../../node_modules/.pnpm/npm-package-arg@13.0.2/node_modules/npm-package-arg/lib/npa.js
var require_npa = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const isWindows = process.platform === "win32";
	const { URL: URL$1 } = require("node:url");
	const path$4 = isWindows ? require("node:path/win32") : require("node:path");
	const { homedir: homedir$1 } = require("node:os");
	const HostedGit = require_lib$11();
	const semver = require_commonjs$2.require_semver();
	const validatePackageName = require_lib$8();
	const { log } = require_commonjs$2.require_lib$1();
	const hasSlashes = isWindows ? /\\|[/]/ : /[/]/;
	const isURL = /^(?:git[+])?[a-z]+:/i;
	const isGit = /^[^@]+@[^:.]+\.[^:]+:.+$/i;
	const isFileType = /[.](?:tgz|tar\.gz|tar)$/i;
	const isPortNumber = /:[0-9]+(\/|$)/i;
	const isWindowsFile = /^(?:[.]|~[/]|[/\\]|[a-zA-Z]:)/;
	const isPosixFile = /^(?:[.]|~[/]|[/]|[a-zA-Z]:)/;
	const defaultRegistry = "https://registry.npmjs.org";
	function npa(arg, where) {
		let name;
		let spec;
		if (typeof arg === "object") {
			if (arg instanceof Result && (!where || where === arg.where)) return arg;
			else if (arg.name && arg.rawSpec) return npa.resolve(arg.name, arg.rawSpec, where || arg.where);
			else return npa(arg.raw, where || arg.where);
		}
		const nameEndsAt = arg.indexOf("@", 1);
		const namePart = nameEndsAt > 0 ? arg.slice(0, nameEndsAt) : arg;
		if (isURL.test(arg)) spec = arg;
		else if (isGit.test(arg)) spec = `git+ssh://${arg}`;
		else if (!namePart.startsWith("@") && (hasSlashes.test(namePart) || isFileType.test(namePart))) spec = arg;
		else if (nameEndsAt > 0) {
			name = namePart;
			spec = arg.slice(nameEndsAt + 1) || "*";
		} else if (validatePackageName(arg).validForOldPackages) {
			name = arg;
			spec = "*";
		} else spec = arg;
		return resolve(name, spec, where, arg);
	}
	function isFileSpec(spec) {
		if (!spec) return false;
		if (spec.toLowerCase().startsWith("file:")) return true;
		if (isWindows) return isWindowsFile.test(spec);
		return isPosixFile.test(spec);
	}
	function isAliasSpec(spec) {
		if (!spec) return false;
		return spec.toLowerCase().startsWith("npm:");
	}
	function resolve(name, spec, where, arg) {
		const res = new Result({
			raw: arg,
			name,
			rawSpec: spec,
			fromArgument: arg != null
		});
		if (name) res.name = name;
		if (!where) where = process.cwd();
		if (isFileSpec(spec)) return fromFile(res, where);
		else if (isAliasSpec(spec)) return fromAlias(res, where);
		const hosted = HostedGit.fromUrl(spec, {
			noGitPlus: true,
			noCommittish: true
		});
		if (hosted) return fromHostedGit(res, hosted);
		else if (spec && isURL.test(spec)) return fromURL(res);
		else if (spec && (hasSlashes.test(spec) || isFileType.test(spec))) return fromFile(res, where);
		else return fromRegistry(res);
	}
	function toPurl(arg, reg = defaultRegistry) {
		const res = npa(arg);
		if (res.type !== "version") throw invalidPurlType(res.type, res.raw);
		let purl = "pkg:npm/" + res.name.replace(/^@/, "%40") + "@" + res.rawSpec;
		if (reg !== defaultRegistry) purl += "?repository_url=" + reg;
		return purl;
	}
	function invalidPackageName(name, valid, raw) {
		const err = /* @__PURE__ */ new Error(`Invalid package name "${name}" of package "${raw}": ${valid.errors.join("; ")}.`);
		err.code = "EINVALIDPACKAGENAME";
		return err;
	}
	function invalidTagName(name, raw) {
		const err = /* @__PURE__ */ new Error(`Invalid tag name "${name}" of package "${raw}": Tags may not have any characters that encodeURIComponent encodes.`);
		err.code = "EINVALIDTAGNAME";
		return err;
	}
	function invalidPurlType(type, raw) {
		const err = /* @__PURE__ */ new Error(`Invalid type "${type}" of package "${raw}": Purl can only be generated for "version" types.`);
		err.code = "EINVALIDPURLTYPE";
		return err;
	}
	var Result = class {
		constructor(opts) {
			this.type = opts.type;
			this.registry = opts.registry;
			this.where = opts.where;
			if (opts.raw == null) this.raw = opts.name ? `${opts.name}@${opts.rawSpec}` : opts.rawSpec;
			else this.raw = opts.raw;
			this.name = void 0;
			this.escapedName = void 0;
			this.scope = void 0;
			this.rawSpec = opts.rawSpec || "";
			this.saveSpec = opts.saveSpec;
			this.fetchSpec = opts.fetchSpec;
			if (opts.name) this.setName(opts.name);
			this.gitRange = opts.gitRange;
			this.gitCommittish = opts.gitCommittish;
			this.gitSubdir = opts.gitSubdir;
			this.hosted = opts.hosted;
		}
		setName(name) {
			const valid = validatePackageName(name);
			if (!valid.validForOldPackages) throw invalidPackageName(name, valid, this.raw);
			this.name = name;
			this.scope = name[0] === "@" ? name.slice(0, name.indexOf("/")) : void 0;
			this.escapedName = name.replace("/", "%2f");
			return this;
		}
		toString() {
			const full = [];
			if (this.name != null && this.name !== "") full.push(this.name);
			const spec = this.saveSpec || this.fetchSpec || this.rawSpec;
			if (spec != null && spec !== "") full.push(spec);
			return full.length ? full.join("@") : this.raw;
		}
		toJSON() {
			const result = Object.assign({}, this);
			delete result.hosted;
			return result;
		}
	};
	function setGitAttrs(res, committish) {
		if (!committish) {
			res.gitCommittish = null;
			return;
		}
		for (const part of committish.split("::")) {
			if (!part.includes(":")) {
				if (res.gitRange) throw new Error("cannot override existing semver range with a committish");
				if (res.gitCommittish) throw new Error("cannot override existing committish with a second committish");
				res.gitCommittish = part;
				continue;
			}
			const [name, value] = part.split(":");
			if (name === "semver") {
				if (res.gitCommittish) throw new Error("cannot override existing committish with a semver range");
				if (res.gitRange) throw new Error("cannot override existing semver range with a second semver range");
				res.gitRange = decodeURIComponent(value);
				continue;
			}
			if (name === "path") {
				if (res.gitSubdir) throw new Error("cannot override existing path with a second path");
				res.gitSubdir = `/${value}`;
				continue;
			}
			log.warn("npm-package-arg", `ignoring unknown key "${name}"`);
		}
	}
	const encodedPathChars = /* @__PURE__ */ new Map([
		["\0", "%00"],
		["	", "%09"],
		["\n", "%0A"],
		["\r", "%0D"],
		[" ", "%20"],
		["\"", "%22"],
		["#", "%23"],
		["%", "%25"],
		["?", "%3F"],
		["[", "%5B"],
		["\\", isWindows ? "/" : "%5C"],
		["]", "%5D"],
		["^", "%5E"],
		["|", "%7C"],
		["~", "%7E"]
	]);
	function pathToFileURL(str) {
		let result = "";
		for (let i = 0; i < str.length; i++) result = `${result}${encodedPathChars.get(str[i]) ?? str[i]}`;
		if (result.startsWith("file:")) return result;
		return `file:${result}`;
	}
	function fromFile(res, where) {
		res.type = isFileType.test(res.rawSpec) ? "file" : "directory";
		res.where = where;
		let rawSpec = pathToFileURL(res.rawSpec);
		if (rawSpec.startsWith("file:/")) {
			if (/^file:\/\/[^/]/.test(rawSpec)) rawSpec = `file:/${rawSpec.slice(5)}`;
			if (/^\/{1,3}\.\.?(\/|$)/.test(rawSpec.slice(5))) rawSpec = rawSpec.replace(/^file:\/{1,3}/, "file:");
		}
		let resolvedUrl;
		let specUrl;
		try {
			resolvedUrl = new URL$1(rawSpec, `${pathToFileURL(path$4.resolve(where))}/`);
			specUrl = new URL$1(rawSpec);
		} catch (originalError) {
			throw Object.assign(/* @__PURE__ */ new Error("Invalid file: URL, must comply with RFC 8089"), {
				raw: res.rawSpec,
				spec: res,
				where,
				originalError
			});
		}
		let specPath = decodeURIComponent(specUrl.pathname);
		let resolvedPath = decodeURIComponent(resolvedUrl.pathname);
		if (isWindows) {
			specPath = specPath.replace(/^\/+([a-z]:\/)/i, "$1");
			resolvedPath = resolvedPath.replace(/^\/+([a-z]:\/)/i, "$1");
		}
		if (/^\/~(\/|$)/.test(specPath)) {
			res.saveSpec = `file:${specPath.substr(1)}`;
			resolvedPath = path$4.resolve(homedir$1(), specPath.substr(3));
		} else if (!path$4.isAbsolute(rawSpec.slice(5))) res.saveSpec = `file:${path$4.relative(where, resolvedPath)}`;
		else res.saveSpec = `file:${path$4.resolve(resolvedPath)}`;
		res.fetchSpec = path$4.resolve(where, resolvedPath);
		res.saveSpec = res.saveSpec.split("\\").join("/");
		/* istanbul ignore next */
		if (res.saveSpec.startsWith("file://")) res.saveSpec = `file:/${res.saveSpec.slice(7)}`;
		return res;
	}
	function fromHostedGit(res, hosted) {
		res.type = "git";
		res.hosted = hosted;
		res.saveSpec = hosted.toString({
			noGitPlus: false,
			noCommittish: false
		});
		res.fetchSpec = hosted.getDefaultRepresentation() === "shortcut" ? null : hosted.toString();
		setGitAttrs(res, hosted.committish);
		return res;
	}
	function unsupportedURLType(protocol, spec) {
		const err = /* @__PURE__ */ new Error(`Unsupported URL Type "${protocol}": ${spec}`);
		err.code = "EUNSUPPORTEDPROTOCOL";
		return err;
	}
	function fromURL(res) {
		let rawSpec = res.rawSpec;
		res.saveSpec = rawSpec;
		if (rawSpec.startsWith("git+ssh:")) {
			const matched = rawSpec.match(/^git\+ssh:\/\/([^:#]+:[^#]+(?:\.git)?)(?:#(.*))?$/i);
			if (matched && !matched[1].match(isPortNumber)) {
				res.type = "git";
				setGitAttrs(res, matched[2]);
				res.fetchSpec = matched[1];
				return res;
			}
		} else if (rawSpec.startsWith("git+file://")) rawSpec = rawSpec.replace(/\\/g, "/");
		const parsedUrl = new URL$1(rawSpec);
		switch (parsedUrl.protocol) {
			case "git:":
			case "git+http:":
			case "git+https:":
			case "git+rsync:":
			case "git+ftp:":
			case "git+file:":
			case "git+ssh:":
				res.type = "git";
				setGitAttrs(res, parsedUrl.hash.slice(1));
				if (parsedUrl.protocol === "git+file:" && /^git\+file:\/\/[a-z]:/i.test(rawSpec)) res.fetchSpec = `git+file://${parsedUrl.host.toLowerCase()}:${parsedUrl.pathname}`;
				else {
					parsedUrl.hash = "";
					res.fetchSpec = parsedUrl.toString();
				}
				if (res.fetchSpec.startsWith("git+")) res.fetchSpec = res.fetchSpec.slice(4);
				break;
			case "http:":
			case "https:":
				res.type = "remote";
				res.fetchSpec = res.saveSpec;
				break;
			default: throw unsupportedURLType(parsedUrl.protocol, rawSpec);
		}
		return res;
	}
	function fromAlias(res, where) {
		const subSpec = npa(res.rawSpec.substr(4), where);
		if (subSpec.type === "alias") throw new Error("nested aliases not supported");
		if (!subSpec.registry) throw new Error("aliases only work for registry deps");
		if (!subSpec.name) throw new Error("aliases must have a name");
		res.subSpec = subSpec;
		res.registry = true;
		res.type = "alias";
		res.saveSpec = null;
		res.fetchSpec = null;
		return res;
	}
	function fromRegistry(res) {
		res.registry = true;
		const spec = res.rawSpec.trim();
		res.saveSpec = null;
		res.fetchSpec = spec;
		const version = semver.valid(spec, true);
		const range = semver.validRange(spec, true);
		if (version) res.type = "version";
		else if (range) res.type = "range";
		else {
			if (encodeURIComponent(spec) !== spec) throw invalidTagName(spec, res.raw);
			res.type = "tag";
		}
		return res;
	}
	module.exports = npa;
	module.exports.resolve = resolve;
	module.exports.toPurl = toPurl;
	module.exports.Result = Result;
}));
//#endregion
//#region ../../node_modules/.pnpm/npm-install-checks@8.0.0/node_modules/npm-install-checks/lib/current-env.js
var require_current_env = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const process$1 = require("node:process");
	const nodeOs = require("node:os");
	const fs$3 = require("node:fs");
	function isMusl(file) {
		return file.includes("libc.musl-") || file.includes("ld-musl-");
	}
	function os() {
		return process$1.platform;
	}
	function cpu() {
		return process$1.arch;
	}
	const LDD_PATH = "/usr/bin/ldd";
	function getFamilyFromFilesystem() {
		try {
			const content = fs$3.readFileSync(LDD_PATH, "utf-8");
			if (content.includes("musl")) return "musl";
			if (content.includes("GNU C Library")) return "glibc";
			return null;
		} catch {
			return;
		}
	}
	function getFamilyFromReport() {
		const originalExclude = process$1.report.excludeNetwork;
		process$1.report.excludeNetwork = true;
		const report = process$1.report.getReport();
		process$1.report.excludeNetwork = originalExclude;
		if (report.header?.glibcVersionRuntime) family = "glibc";
		else if (Array.isArray(report.sharedObjects) && report.sharedObjects.some(isMusl)) family = "musl";
		else family = null;
		return family;
	}
	let family;
	function libc(osName) {
		if (osName !== "linux") return;
		if (family === void 0) {
			family = getFamilyFromFilesystem();
			if (family === void 0) family = getFamilyFromReport();
		}
		return family;
	}
	function devEngines(env = {}) {
		const osName = env.os || os();
		return {
			cpu: { name: env.cpu || cpu() },
			libc: { name: env.libc || libc(osName) },
			os: {
				name: osName,
				version: env.osVersion || nodeOs.release()
			},
			packageManager: {
				name: "npm",
				version: env.npmVersion
			},
			runtime: {
				name: "node",
				version: env.nodeVersion || process$1.version
			}
		};
	}
	module.exports = {
		cpu,
		libc,
		os,
		devEngines
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/npm-install-checks@8.0.0/node_modules/npm-install-checks/lib/dev-engines.js
var require_dev_engines = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const satisfies = require_commonjs$2.require_satisfies();
	const validRange = require_commonjs$2.require_valid();
	const recognizedOnFail = [
		"ignore",
		"warn",
		"error",
		"download"
	];
	const recognizedProperties = [
		"name",
		"version",
		"onFail"
	];
	const recognizedEngines = [
		"packageManager",
		"runtime",
		"cpu",
		"libc",
		"os"
	];
	/** checks a devEngine dependency */
	function checkDependency(wanted, current, opts) {
		const { engine } = opts;
		if (typeof wanted !== "object" || wanted === null || Array.isArray(wanted)) throw new Error(`Invalid non-object value for "${engine}"`);
		const properties = Object.keys(wanted);
		for (const prop of properties) if (!recognizedProperties.includes(prop)) throw new Error(`Invalid property "${prop}" for "${engine}"`);
		if (!properties.includes("name")) throw new Error(`Missing "name" property for "${engine}"`);
		if (typeof wanted.name !== "string") throw new Error(`Invalid non-string value for "name" within "${engine}"`);
		if (typeof current.name !== "string" || current.name === "") throw new Error(`Unable to determine "name" for "${engine}"`);
		if (properties.includes("onFail")) {
			if (typeof wanted.onFail !== "string") throw new Error(`Invalid non-string value for "onFail" within "${engine}"`);
			if (!recognizedOnFail.includes(wanted.onFail)) throw new Error(`Invalid onFail value "${wanted.onFail}" for "${engine}"`);
		}
		if (wanted.name !== current.name) return /* @__PURE__ */ new Error(`Invalid name "${wanted.name}" does not match "${current.name}" for "${engine}"`);
		if (properties.includes("version")) {
			if (typeof wanted.version !== "string") throw new Error(`Invalid non-string value for "version" within "${engine}"`);
			if (typeof current.version !== "string" || current.version === "") throw new Error(`Unable to determine "version" for "${engine}" "${wanted.name}"`);
			if (validRange(wanted.version)) {
				if (!satisfies(current.version, wanted.version, opts.semver)) return /* @__PURE__ */ new Error(`Invalid semver version "${wanted.version}" does not match "${current.version}" for "${engine}"`);
			} else if (wanted.version !== current.version) return /* @__PURE__ */ new Error(`Invalid version "${wanted.version}" does not match "${current.version}" for "${engine}"`);
		}
	}
	/** checks devEngines package property and returns array of warnings / errors */
	function checkDevEngines(wanted, current = {}, opts = {}) {
		if (typeof wanted !== "object" || wanted === null || Array.isArray(wanted)) throw new Error(`Invalid non-object value for "devEngines"`);
		const errors = [];
		for (const engine of Object.keys(wanted)) {
			if (!recognizedEngines.includes(engine)) throw new Error(`Invalid property "devEngines.${engine}"`);
			const dependencyAsAuthored = wanted[engine];
			const dependencies = [dependencyAsAuthored].flat();
			const currentEngine = current[engine] || {};
			if (dependencies.length === 0) continue;
			const depErrors = [];
			for (const dep of dependencies) {
				const result = checkDependency(dep, currentEngine, {
					...opts,
					engine
				});
				if (result) depErrors.push(result);
			}
			if (depErrors.length === dependencies.length) {
				let onFail = dependencies[dependencies.length - 1].onFail || "error";
				if (onFail === "download") onFail = "error";
				const err = Object.assign(/* @__PURE__ */ new Error(`Invalid devEngines.${engine}`), {
					errors: depErrors,
					engine,
					isWarn: onFail === "warn",
					isError: onFail === "error",
					current: currentEngine,
					required: dependencyAsAuthored
				});
				errors.push(err);
			}
		}
		return errors;
	}
	module.exports = { checkDevEngines };
}));
//#endregion
//#region ../../node_modules/.pnpm/npm-install-checks@8.0.0/node_modules/npm-install-checks/lib/index.js
var require_lib$7 = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const semver = require_commonjs$2.require_semver();
	const currentEnv = require_current_env();
	const { checkDevEngines } = require_dev_engines();
	const checkEngine = (target, npmVer, nodeVer, force = false) => {
		const nodev = force ? null : nodeVer;
		const eng = target.engines;
		const opt = { includePrerelease: true };
		if (!eng) return;
		const nodeFail = nodev && eng.node && !semver.satisfies(nodev, eng.node, opt);
		const npmFail = npmVer && eng.npm && !semver.satisfies(npmVer, eng.npm, opt);
		if (nodeFail || npmFail) throw Object.assign(/* @__PURE__ */ new Error("Unsupported engine"), {
			pkgid: target._id,
			current: {
				node: nodeVer,
				npm: npmVer
			},
			required: eng,
			code: "EBADENGINE"
		});
	};
	const checkPlatform = (target, force = false, environment = {}) => {
		if (force) return;
		const os = environment.os || currentEnv.os();
		const cpu = environment.cpu || currentEnv.cpu();
		const libc = environment.libc || currentEnv.libc(os);
		const osOk = target.os ? checkList(os, target.os) : true;
		const cpuOk = target.cpu ? checkList(cpu, target.cpu) : true;
		let libcOk = target.libc ? checkList(libc, target.libc) : true;
		if (target.libc && !libc) libcOk = false;
		if (!osOk || !cpuOk || !libcOk) throw Object.assign(/* @__PURE__ */ new Error("Unsupported platform"), {
			pkgid: target._id,
			current: {
				os,
				cpu,
				libc
			},
			required: {
				os: target.os,
				cpu: target.cpu,
				libc: target.libc
			},
			code: "EBADPLATFORM"
		});
	};
	const checkList = (value, list) => {
		if (typeof list === "string") list = [list];
		if (list.length === 1 && list[0] === "any") return true;
		let negated = 0;
		let match = false;
		for (const entry of list) {
			const negate = entry.charAt(0) === "!";
			const test = negate ? entry.slice(1) : entry;
			if (negate) {
				negated++;
				if (value === test) return false;
			} else match = match || value === test;
		}
		return match || negated === list.length;
	};
	module.exports = {
		checkEngine,
		checkPlatform,
		checkDevEngines,
		currentEnv
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/npm-normalize-package-bin@5.0.0/node_modules/npm-normalize-package-bin/lib/index.js
var require_lib$6 = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const { join: join$5, basename: basename$1 } = require("path");
	const normalize = (pkg) => !pkg.bin ? removeBin(pkg) : typeof pkg.bin === "string" ? normalizeString(pkg) : Array.isArray(pkg.bin) ? normalizeArray(pkg) : typeof pkg.bin === "object" ? normalizeObject(pkg) : removeBin(pkg);
	const normalizeString = (pkg) => {
		if (!pkg.name) return removeBin(pkg);
		pkg.bin = { [pkg.name]: pkg.bin };
		return normalizeObject(pkg);
	};
	const normalizeArray = (pkg) => {
		pkg.bin = pkg.bin.reduce((acc, k) => {
			acc[basename$1(k)] = k;
			return acc;
		}, {});
		return normalizeObject(pkg);
	};
	const removeBin = (pkg) => {
		delete pkg.bin;
		return pkg;
	};
	const normalizeObject = (pkg) => {
		const orig = pkg.bin;
		const clean = {};
		let hasBins = false;
		Object.keys(orig).forEach((binKey) => {
			const base = join$5("/", basename$1(binKey.replace(/\\|:/g, "/"))).slice(1);
			if (typeof orig[binKey] !== "string" || !base) return;
			const binTarget = join$5("/", orig[binKey].replace(/\\/g, "/")).replace(/\\/g, "/").slice(1);
			if (!binTarget) return;
			clean[base] = binTarget;
			hasBins = true;
		});
		if (hasBins) pkg.bin = clean;
		else delete pkg.bin;
		return pkg;
	};
	module.exports = normalize;
}));
//#endregion
//#region ../../node_modules/.pnpm/npm-pick-manifest@11.0.3/node_modules/npm-pick-manifest/lib/index.js
var require_lib$5 = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const npa = require_npa();
	const semver = require_commonjs$2.require_semver();
	const { checkEngine } = require_lib$7();
	const normalizeBin = require_lib$6();
	const engineOk = (manifest, npmVersion, nodeVersion) => {
		try {
			checkEngine(manifest, npmVersion, nodeVersion);
			return true;
		} catch (_) {
			return false;
		}
	};
	const isBefore = (verTimes, ver, time) => !verTimes || !verTimes[ver] || Date.parse(verTimes[ver]) <= time;
	const avoidSemverOpt = {
		includePrerelease: true,
		loose: true
	};
	const shouldAvoid = (ver, avoid) => avoid && semver.satisfies(ver, avoid, avoidSemverOpt);
	const decorateAvoid = (result, avoid) => result && shouldAvoid(result.version, avoid) ? {
		...result,
		_shouldAvoid: true
	} : result;
	const pickManifest = (packument, wanted, opts) => {
		const { defaultTag = "latest", before = null, nodeVersion = process.version, npmVersion = null, includeStaged = false, avoid = null, avoidStrict = false } = opts;
		const { name, time: verTimes } = packument;
		const versions = packument.versions || {};
		if (avoidStrict) {
			const looseOpts = {
				...opts,
				avoidStrict: false
			};
			const result = pickManifest(packument, wanted, looseOpts);
			if (!result || !result._shouldAvoid) return result;
			const caret = pickManifest(packument, `^${result.version}`, looseOpts);
			if (!caret || !caret._shouldAvoid) return {
				...caret,
				_outsideDependencyRange: true,
				_isSemVerMajor: false
			};
			const star = pickManifest(packument, "*", looseOpts);
			if (!star || !star._shouldAvoid) return {
				...star,
				_outsideDependencyRange: true,
				_isSemVerMajor: true
			};
			throw Object.assign(/* @__PURE__ */ new Error(`No avoidable versions for ${name}`), {
				code: "ETARGET",
				name,
				wanted,
				avoid,
				before,
				versions: Object.keys(versions)
			});
		}
		const staged = includeStaged && packument.stagedVersions && packument.stagedVersions.versions || {};
		const restricted = packument.policyRestrictions && packument.policyRestrictions.versions || {};
		const time = before && verTimes ? +new Date(before) : Infinity;
		const type = npa.resolve(name, wanted || defaultTag).type;
		const distTags = packument["dist-tags"] || {};
		if (type !== "tag" && type !== "version" && type !== "range") throw new Error("Only tag, version, and range are supported");
		if (wanted && type === "tag") {
			const ver = distTags[wanted];
			if (isBefore(verTimes, ver, time)) return decorateAvoid(versions[ver] || staged[ver] || restricted[ver], avoid);
			else return pickManifest(packument, `<=${ver}`, opts);
		}
		if (wanted && type === "version") {
			const ver = semver.clean(wanted, { loose: true });
			const mani = versions[ver] || staged[ver] || restricted[ver];
			return isBefore(verTimes, ver, time) ? decorateAvoid(mani, avoid) : null;
		}
		const range = type === "range" ? wanted : "*";
		const defaultVer = distTags[defaultTag];
		if (defaultVer && (range === "*" || semver.satisfies(defaultVer, range, { loose: true })) && !restricted[defaultVer] && !shouldAvoid(defaultVer, avoid)) {
			const mani = versions[defaultVer];
			if (mani && isBefore(verTimes, defaultVer, time) && engineOk(mani, npmVersion, nodeVersion) && !mani.deprecated && !staged[defaultVer]) return mani;
		}
		const allEntries = Object.entries(versions).concat(Object.entries(staged)).concat(Object.entries(restricted)).filter(([ver]) => isBefore(verTimes, ver, time));
		if (!allEntries.length) throw Object.assign(/* @__PURE__ */ new Error(`No versions available for ${name}`), {
			code: "ENOVERSIONS",
			name,
			type,
			wanted,
			before,
			versions: Object.keys(versions)
		});
		const sortSemverOpt = { loose: true };
		const entries = allEntries.filter(([ver]) => semver.satisfies(ver, range, { loose: true })).sort((a, b) => {
			const [vera, mania] = a;
			const [verb, manib] = b;
			const notavoida = !shouldAvoid(vera, avoid);
			const notavoidb = !shouldAvoid(verb, avoid);
			const notrestra = !restricted[vera];
			const notrestrb = !restricted[verb];
			const notstagea = !staged[vera];
			const notstageb = !staged[verb];
			const notdepra = !mania.deprecated;
			const notdeprb = !manib.deprecated;
			const enginea = engineOk(mania, npmVersion, nodeVersion);
			const engineb = engineOk(manib, npmVersion, nodeVersion);
			return notavoidb - notavoida || notrestrb - notrestra || notstageb - notstagea || (notdeprb && engineb) - (notdepra && enginea) || engineb - enginea || notdeprb - notdepra || semver.rcompare(vera, verb, sortSemverOpt);
		});
		return decorateAvoid(entries[0] && entries[0][1], avoid);
	};
	module.exports = (packument, wanted, opts = {}) => {
		const mani = pickManifest(packument, wanted, opts);
		const picked = mani && normalizeBin(mani);
		const policyRestrictions = packument.policyRestrictions;
		const restricted = policyRestrictions && policyRestrictions.versions || {};
		if (picked && !restricted[picked.version]) return picked;
		const { before = null, defaultTag = "latest" } = opts;
		const bstr = before ? new Date(before).toLocaleString() : "";
		const { name } = packument;
		const pckg = `${name}@${wanted}` + (before ? ` with a date before ${bstr}` : "");
		const isForbidden = picked && !!restricted[picked.version];
		const polMsg = isForbidden ? policyRestrictions.message : "";
		const msg = !isForbidden ? `No matching version found for ${pckg}.` : `Could not download ${pckg} due to policy violations:\n${polMsg}`;
		const code = isForbidden ? "E403" : "ETARGET";
		throw Object.assign(new Error(msg), {
			code,
			type: npa.resolve(packument.name, wanted).type,
			wanted,
			versions: Object.keys(packument.versions ?? {}),
			name,
			distTags: packument["dist-tags"],
			defaultTag
		});
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+git@7.0.2/node_modules/@npmcli/git/lib/clone.js
var require_clone = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const shallowHosts = /* @__PURE__ */ new Set([
		"github.com",
		"gist.github.com",
		"gitlab.com",
		"bitbucket.com",
		"bitbucket.org"
	]);
	const { parse } = require("url");
	const path$3 = require("path");
	const getRevs = require_revs();
	const spawn = require_spawn();
	const { isWindows } = require_utils();
	const pickManifest = require_lib$5();
	const fs$2 = require("fs/promises");
	module.exports = (repo, ref = "HEAD", target = null, opts = {}) => getRevs(repo, opts).then((revs) => clone(repo, revs, ref, resolveRef(revs, ref, opts), target || defaultTarget(repo, opts.cwd), opts));
	const maybeShallow = (repo, opts) => {
		if (opts.gitShallow === false || opts.gitShallow) return opts.gitShallow;
		return shallowHosts.has(parse(repo).host);
	};
	const defaultTarget = (repo, cwd = process.cwd()) => path$3.resolve(cwd, path$3.basename(repo.replace(/[/\\]?\.git$/, "")));
	const clone = (repo, revs, ref, revDoc, target, opts) => {
		if (!revDoc) return unresolved(repo, ref, target, opts);
		if (revDoc.sha === revs.refs.HEAD.sha) return plain(repo, revDoc, target, opts);
		if (revDoc.type === "tag" || revDoc.type === "branch") return branch(repo, revDoc, target, opts);
		return other(repo, revDoc, target, opts);
	};
	const resolveRef = (revs, ref, opts) => {
		const { spec = {} } = opts;
		ref = spec.gitCommittish || ref;
		/* istanbul ignore next - will fail anyway, can't pull */
		if (!revs) return null;
		if (spec.gitRange) return pickManifest(revs, spec.gitRange, opts);
		if (!ref) return revs.refs.HEAD;
		if (revs.refs[ref]) return revs.refs[ref];
		if (revs.shas[ref]) return revs.refs[revs.shas[ref][0]];
		return null;
	};
	const other = (repo, revDoc, target, opts) => {
		const shallow = maybeShallow(repo, opts);
		const fetchOrigin = [
			"fetch",
			"origin",
			revDoc.rawRef
		].concat(shallow ? ["--depth=1"] : []);
		const git = (args) => spawn(args, {
			...opts,
			cwd: target
		});
		return fs$2.mkdir(target, { recursive: true }).then(() => git(["init"])).then(() => isWindows(opts) ? git([
			"config",
			"--local",
			"--add",
			"core.longpaths",
			"true"
		]) : null).then(() => git([
			"remote",
			"add",
			"origin",
			repo
		])).then(() => git(fetchOrigin)).then(() => git(["checkout", revDoc.sha])).then(() => updateSubmodules(target, opts)).then(() => revDoc.sha);
	};
	const branch = (repo, revDoc, target, opts) => {
		const args = [
			"clone",
			"-b",
			revDoc.ref,
			repo,
			target,
			"--recurse-submodules"
		];
		if (maybeShallow(repo, opts)) args.push("--depth=1");
		if (isWindows(opts)) args.push("--config", "core.longpaths=true");
		return spawn(args, opts).then(() => revDoc.sha);
	};
	const plain = (repo, revDoc, target, opts) => {
		const args = [
			"clone",
			repo,
			target,
			"--recurse-submodules"
		];
		if (maybeShallow(repo, opts)) args.push("--depth=1");
		if (isWindows(opts)) args.push("--config", "core.longpaths=true");
		return spawn(args, opts).then(() => revDoc.sha);
	};
	const updateSubmodules = async (target, opts) => {
		if (!await fs$2.stat(`${target}/.gitmodules`).then(() => true).catch(() => false)) return null;
		return spawn([
			"submodule",
			"update",
			"-q",
			"--init",
			"--recursive"
		], {
			...opts,
			cwd: target
		});
	};
	const unresolved = (repo, ref, target, opts) => {
		const lp = isWindows(opts) ? ["--config", "core.longpaths=true"] : [];
		const cloneArgs = [
			"clone",
			"--mirror",
			"-q",
			repo,
			target + "/.git"
		];
		const git = (args) => spawn(args, {
			...opts,
			cwd: target
		});
		return fs$2.mkdir(target, { recursive: true }).then(() => git(cloneArgs.concat(lp))).then(() => git(["init"])).then(() => git(["checkout", ref])).then(() => updateSubmodules(target, opts)).then(() => git([
			"rev-parse",
			"--revs-only",
			"HEAD"
		])).then(({ stdout }) => stdout.trim());
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+git@7.0.2/node_modules/@npmcli/git/lib/is.js
var require_is = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const { stat: stat$1 } = require("fs/promises");
	module.exports = ({ cwd = process.cwd() } = {}) => stat$1(cwd + "/.git").then(() => true, () => false);
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+git@7.0.2/node_modules/@npmcli/git/lib/find.js
var require_find = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const is = require_is();
	const { dirname: dirname$2 } = require("path");
	module.exports = async ({ cwd = process.cwd(), root } = {}) => {
		while (true) {
			if (await is({ cwd })) return cwd;
			const next = dirname$2(cwd);
			if (cwd === root || cwd === next) return null;
			cwd = next;
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+git@7.0.2/node_modules/@npmcli/git/lib/is-clean.js
var require_is_clean = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const spawn = require_spawn();
	module.exports = (opts = {}) => spawn([
		"status",
		"--porcelain=v1",
		"-uno"
	], opts).then((res) => !res.stdout.trim().split(/\r?\n+/).map((l) => l.trim()).filter((l) => l).length);
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+git@7.0.2/node_modules/@npmcli/git/lib/index.js
var require_lib$4 = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	module.exports = {
		clone: require_clone(),
		revs: require_revs(),
		spawn: require_spawn(),
		is: require_is(),
		find: require_find(),
		isClean: require_is_clean(),
		errors: require_errors()
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+package-json@7.0.5/node_modules/@npmcli/package-json/lib/normalize.js
var require_normalize = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const valid = require_commonjs$2.require_valid$1();
	const clean = require_commonjs$2.require_clean();
	const fs$1 = require("node:fs/promises");
	const path$2 = require("node:path");
	const { log } = require_commonjs$2.require_lib$1();
	const moduleBuiltin = require("node:module");
	/**
	* @type {import('hosted-git-info')}
	*/
	let _hostedGitInfo;
	function lazyHostedGitInfo() {
		if (!_hostedGitInfo) _hostedGitInfo = require_lib$11();
		return _hostedGitInfo;
	}
	/**
	* @type {import('glob').glob}
	*/
	let _glob;
	function lazyLoadGlob() {
		if (!_glob) _glob = require_commonjs$2.require_index_min().glob;
		return _glob;
	}
	function normalizePackageBin(pkg, changes) {
		if (pkg.bin) {
			if (typeof pkg.bin === "string" && pkg.name) {
				changes?.push("\"bin\" was converted to an object");
				pkg.bin = { [pkg.name]: pkg.bin };
			} else if (Array.isArray(pkg.bin)) {
				changes?.push("\"bin\" was converted to an object");
				pkg.bin = pkg.bin.reduce((acc, k) => {
					acc[path$2.basename(k)] = k;
					return acc;
				}, {});
			}
			if (typeof pkg.bin === "object") {
				for (const binKey in pkg.bin) {
					if (typeof pkg.bin[binKey] !== "string") {
						delete pkg.bin[binKey];
						changes?.push(`removed invalid "bin[${binKey}]"`);
						continue;
					}
					const base = path$2.basename(secureAndUnixifyPath(binKey));
					if (!base) {
						delete pkg.bin[binKey];
						changes?.push(`removed invalid "bin[${binKey}]"`);
						continue;
					}
					const binTarget = secureAndUnixifyPath(pkg.bin[binKey]);
					if (!binTarget) {
						delete pkg.bin[binKey];
						changes?.push(`removed invalid "bin[${binKey}]"`);
						continue;
					}
					if (base !== binKey) {
						delete pkg.bin[binKey];
						changes?.push(`"bin[${binKey}]" was renamed to "bin[${base}]"`);
					}
					if (binTarget !== pkg.bin[binKey]) changes?.push(`"bin[${base}]" script name ${binTarget} was invalid and removed`);
					pkg.bin[base] = binTarget;
				}
				if (Object.keys(pkg.bin).length === 0) {
					changes?.push("empty \"bin\" was removed");
					delete pkg.bin;
				}
				return pkg;
			}
		}
		delete pkg.bin;
	}
	function normalizePackageMan(pkg, changes) {
		if (pkg.man) {
			const mans = [];
			for (const man of Array.isArray(pkg.man) ? pkg.man : [pkg.man]) if (typeof man !== "string") changes?.push(`removed invalid "man [${man}]"`);
			else mans.push(secureAndUnixifyPath(man));
			if (!mans.length) changes?.push("empty \"man\" was removed");
			else {
				pkg.man = mans;
				return pkg;
			}
		}
		delete pkg.man;
	}
	function isCorrectlyEncodedName(spec) {
		return !spec.match(/[/@\s+%:]/) && spec === encodeURIComponent(spec);
	}
	function isValidScopedPackageName(spec) {
		if (spec.charAt(0) !== "@") return false;
		const rest = spec.slice(1).split("/");
		if (rest.length !== 2) return false;
		return rest[0] && rest[1] && rest[0] === encodeURIComponent(rest[0]) && rest[1] === encodeURIComponent(rest[1]);
	}
	function unixifyPath(ref) {
		return ref.replace(/\\|:/g, "/");
	}
	function secureAndUnixifyPath(ref) {
		const secured = unixifyPath(path$2.join(".", path$2.join("/", unixifyPath(ref))));
		return secured.startsWith("./") ? "" : secured;
	}
	function syncSteps(pkg, { strict, steps, changes, allowLegacyCase }) {
		const data = pkg.content;
		const pkgId = `${data.name ?? ""}@${data.version ?? ""}`;
		if (steps.includes("fixName") || steps.includes("fixNameField") || steps.includes("normalizeData")) {
			if (!data.name && !strict) {
				changes?.push("Missing \"name\" field was set to an empty string");
				data.name = "";
			} else {
				if (typeof data.name !== "string") throw new Error("name field must be a string.");
				if (!strict) {
					const name = data.name.trim();
					if (data.name !== name) {
						changes?.push(`Whitespace was trimmed from "name"`);
						data.name = name;
					}
				}
				if (data.name.startsWith(".") || !(isValidScopedPackageName(data.name) || isCorrectlyEncodedName(data.name)) || strict && !allowLegacyCase && data.name !== data.name.toLowerCase() || data.name.toLowerCase() === "node_modules" || data.name.toLowerCase() === "favicon.ico") throw new Error("Invalid name: " + JSON.stringify(data.name));
			}
		}
		if (steps.includes("fixName")) {
			if (moduleBuiltin.builtinModules.includes(data.name)) log.warn("package-json", pkgId, `Package name "${data.name}" conflicts with a Node.js built-in module name`);
		}
		if (steps.includes("fixVersionField") || steps.includes("normalizeData")) {
			const loose = !strict;
			if (!data.version) data.version = "";
			else {
				if (!valid(data.version, loose)) throw new Error(`Invalid version: "${data.version}"`);
				const version = clean(data.version, loose);
				if (version !== data.version) {
					changes?.push(`"version" was cleaned and set to "${version}"`);
					data.version = version;
				}
			}
		}
		if (steps.includes("_attributes")) {
			for (const key in data) if (key.startsWith("_")) {
				changes?.push(`"${key}" was removed`);
				delete pkg.content[key];
			}
		}
		if (steps.includes("_id")) {
			if (data.name && data.version) {
				changes?.push(`"_id" was set to ${pkgId}`);
				data._id = pkgId;
			}
		}
		if (steps.includes("bundledDependencies")) {
			if (data.bundleDependencies === void 0 && data.bundledDependencies !== void 0) {
				data.bundleDependencies = data.bundledDependencies;
				changes?.push(`Deleted incorrect "bundledDependencies"`);
			}
			delete data.bundledDependencies;
		}
		if (steps.includes("bundleDependencies")) {
			const bd = data.bundleDependencies;
			if (bd === false && !steps.includes("bundleDependenciesDeleteFalse")) {
				changes?.push(`"bundleDependencies" was changed from "false" to "[]"`);
				data.bundleDependencies = [];
			} else if (bd === true) {
				changes?.push(`"bundleDependencies" was auto-populated from "dependencies"`);
				data.bundleDependencies = Object.keys(data.dependencies || {});
			} else if (bd && typeof bd === "object") {
				if (!Array.isArray(bd)) {
					changes?.push(`"bundleDependencies" was changed from an object to an array`);
					data.bundleDependencies = Object.keys(bd);
				}
			} else if ("bundleDependencies" in data) {
				changes?.push(`"bundleDependencies" was removed`);
				delete data.bundleDependencies;
			}
		}
		if (steps.includes("optionalDedupe")) {
			if (data.dependencies && data.optionalDependencies && typeof data.optionalDependencies === "object") {
				for (const name in data.optionalDependencies) {
					changes?.push(`optionalDependencies."${name}" was removed`);
					delete data.dependencies[name];
				}
				if (!Object.keys(data.dependencies).length) {
					changes?.push(`Empty "optionalDependencies" was removed`);
					delete data.dependencies;
				}
			}
		}
		if ((steps.includes("scripts") || steps.includes("scriptpath")) && data.scripts !== void 0) {
			const spre = /^(\.[/\\])?node_modules[/\\].bin[\\/]/;
			if (typeof data.scripts === "object") {
				for (const name in data.scripts) if (typeof data.scripts[name] !== "string") {
					delete data.scripts[name];
					changes?.push(`Invalid scripts."${name}" was removed`);
				} else if (steps.includes("scriptpath") && spre.test(data.scripts[name])) {
					data.scripts[name] = data.scripts[name].replace(spre, "");
					changes?.push(`scripts entry "${name}" was fixed to remove node_modules/.bin reference`);
				}
			} else {
				changes?.push(`Removed invalid "scripts"`);
				delete data.scripts;
			}
		}
		if (steps.includes("funding")) {
			if (data.funding && typeof data.funding === "string") {
				data.funding = { url: data.funding };
				changes?.push(`"funding" was changed to an object with a url attribute`);
			}
		}
		if (steps.includes("fixRepositoryField") || steps.includes("normalizeData")) {
			if (data.repositories) {
				changes?.push(`"repository" was set to the first entry in "repositories" (${data.repository})`);
				data.repository = data.repositories[0];
			}
			if (data.repository) {
				if (typeof data.repository === "string") {
					changes?.push("\"repository\" was changed from a string to an object");
					data.repository = {
						type: "git",
						url: data.repository
					};
				}
				if (data.repository.url) {
					const hosted = lazyHostedGitInfo().fromUrl(data.repository.url);
					let r;
					if (hosted) {
						if (hosted.getDefaultRepresentation() === "shortcut") r = hosted.https();
						else r = hosted.toString();
						if (r !== data.repository.url) {
							changes?.push(`"repository.url" was normalized to "${r}"`);
							data.repository.url = r;
						}
					}
				}
			}
		}
		if (steps.includes("fixDependencies") || steps.includes("normalizeData")) {
			for (const type of [
				"dependencies",
				"devDependencies",
				"optionalDependencies"
			]) if (data[type]) {
				let secondWarning = true;
				if (typeof data[type] === "string") {
					changes?.push(`"${type}" was converted from a string into an object`);
					data[type] = data[type].trim().split(/[\n\r\s\t ,]+/);
					secondWarning = false;
				}
				if (Array.isArray(data[type])) {
					if (secondWarning) changes?.push(`"${type}" was converted from an array into an object`);
					const o = {};
					for (const d of data[type]) if (typeof d === "string") {
						const dep = d.trim().split(/(:?[@\s><=])/);
						const dn = dep.shift();
						o[dn] = dep.join("").replace(/^@/, "").trim();
					}
					data[type] = o;
				}
			}
			for (const deps of ["dependencies", "devDependencies"]) if (deps in data) {
				if (!data[deps] || typeof data[deps] !== "object") {
					changes?.push(`Removed invalid "${deps}"`);
					delete data[deps];
				} else for (const d in data[deps]) {
					if (typeof data[deps][d] !== "string") {
						changes?.push(`Removed invalid "${deps}.${d}"`);
						delete data[deps][d];
					}
					const hosted = lazyHostedGitInfo().fromUrl(data[deps][d])?.toString();
					if (hosted && hosted !== data[deps][d]) {
						changes?.push(`Normalized git reference to "${deps}.${d}"`);
						data[deps][d] = hosted.toString();
					}
				}
			}
		}
		if (steps.includes("normalizeData")) {
			const { normalizeData } = require_normalize_data();
			normalizeData(data, changes);
		}
	}
	async function asyncSteps(pkg, { steps, root, changes }) {
		const data = pkg.content;
		const scripts = data.scripts || {};
		const pkgId = `${data.name ?? ""}@${data.version ?? ""}`;
		if (steps.includes("gypfile")) {
			if (!scripts.install && !scripts.preinstall && data.gypfile !== false) {
				if ((await lazyLoadGlob()("*.gyp", { cwd: pkg.path })).length) {
					scripts.install = "node-gyp rebuild";
					data.scripts = scripts;
					data.gypfile = true;
					changes?.push(`"scripts.install" was set to "node-gyp rebuild"`);
					changes?.push(`"gypfile" was set to "true"`);
				}
			}
		}
		if (steps.includes("serverjs") && !scripts.start) try {
			await fs$1.access(path$2.join(pkg.path, "server.js"));
			scripts.start = "node server.js";
			data.scripts = scripts;
			changes?.push("\"scripts.start\" was set to \"node server.js\"");
		} catch {}
		if (steps.includes("authors") && !data.contributors) try {
			data.contributors = (await fs$1.readFile(path$2.join(pkg.path, "AUTHORS"), "utf8")).split(/\r?\n/g).map((line) => line.replace(/^\s*#.*$/, "").trim()).filter((line) => line);
			changes?.push("\"contributors\" was auto-populated with the contents of the \"AUTHORS\" file");
		} catch {}
		if (steps.includes("readme") && !data.readme) {
			const mdre = /\.m?a?r?k?d?o?w?n?$/i;
			const files = await lazyLoadGlob()("{README,README.*}", {
				cwd: pkg.path,
				nocase: true,
				mark: true
			});
			let readmeFile;
			for (const file of files) if (!file.endsWith(path$2.sep)) {
				if (file.match(mdre)) {
					readmeFile = file;
					break;
				}
				if (file.endsWith("README")) readmeFile = file;
			}
			if (readmeFile) {
				data.readme = await fs$1.readFile(path$2.join(pkg.path, readmeFile), "utf8");
				data.readmeFilename = readmeFile;
				changes?.push(`"readme" was set to the contents of ${readmeFile}`);
				changes?.push(`"readmeFilename" was set to ${readmeFile}`);
			}
			if (!data.readme) data.readme = "ERROR: No README data found!";
		}
		if (steps.includes("mans")) {
			if (data.directories?.man && !data.man) {
				const manDir = secureAndUnixifyPath(data.directories.man);
				const cwd = path$2.resolve(pkg.path, manDir);
				data.man = (await lazyLoadGlob()("**/*.[0-9]", { cwd })).map((man) => path$2.relative(pkg.path, path$2.join(cwd, man)).split(path$2.sep).join("/"));
			}
			normalizePackageMan(data, changes);
		}
		if (steps.includes("binDir") && data.directories?.bin && !data.bin && pkg.path) {
			const binPath = secureAndUnixifyPath(data.directories.bin);
			data.bin = (await lazyLoadGlob()("**", { cwd: path$2.resolve(pkg.path, binPath) })).reduce((acc, binFile) => {
				if (binFile && !binFile.startsWith(".")) {
					const binName = path$2.basename(binFile);
					acc[binName] = `${binPath}/${secureAndUnixifyPath(binFile)}`;
				}
				return acc;
			}, {});
		} else if (steps.includes("bin") || steps.includes("binDir") || steps.includes("binRefs")) normalizePackageBin(data, changes);
		if (steps.includes("gitHead") && !data.gitHead) {
			const gitRoot = await require_lib$4().find({
				cwd: pkg.path,
				root
			});
			let head;
			if (gitRoot) try {
				head = await fs$1.readFile(path$2.resolve(gitRoot, ".git/HEAD"), "utf8");
			} catch (err) {}
			let headData;
			if (head) {
				if (head.startsWith("ref: ")) {
					const headRef = head.replace(/^ref: /, "").trim();
					const headFile = path$2.resolve(gitRoot, ".git", headRef);
					try {
						headData = await fs$1.readFile(headFile, "utf8");
						headData = headData.replace(/^ref: /, "").trim();
					} catch (err) {}
					if (!headData) {
						const packFile = path$2.resolve(gitRoot, ".git/packed-refs");
						try {
							let refs = await fs$1.readFile(packFile, "utf8");
							if (refs) {
								refs = refs.split("\n");
								for (let i = 0; i < refs.length; i++) {
									const match = refs[i].match(/^([0-9a-f]{40}) (.+)$/);
									if (match && match[2].trim() === headRef) {
										headData = match[1];
										break;
									}
								}
							}
						} catch {}
					}
				} else headData = head.trim();
			}
			if (headData) data.gitHead = headData;
		}
		if (steps.includes("fillTypes")) {
			const index = data.main || "index.js";
			if (typeof index !== "string") throw new TypeError("The \"main\" attribute must be of type string.");
			const dts = `./${path$2.join(path$2.dirname(index), path$2.basename(index, path$2.extname(index)))}.d.ts`;
			if (!("types" in data || "typings" in data)) try {
				await fs$1.access(path$2.join(pkg.path, dts));
				data.types = dts.split(path$2.sep).join("/");
			} catch {}
		}
		if (steps.includes("binRefs") && data.bin instanceof Object) for (const key in data.bin) try {
			await fs$1.access(path$2.resolve(pkg.path, data.bin[key]));
		} catch {
			log.warn("package-json", pkgId, `No bin file found at ${data.bin[key]}`);
		}
	}
	async function normalize(pkg, opts) {
		if (!pkg.content) throw new Error("Can not normalize without content");
		await asyncSteps(pkg, opts);
		syncSteps(pkg, opts);
	}
	function syncNormalize(pkg, opts) {
		syncSteps(pkg, opts);
	}
	module.exports = {
		normalize,
		syncNormalize
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+package-json@7.0.5/node_modules/@npmcli/package-json/lib/read-package.js
var require_read_package = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const { readFile: readFile$2 } = require("fs/promises");
	const parseJSON = require_lib$12();
	async function read(filename) {
		try {
			return await readFile$2(filename, "utf8");
		} catch (err) {
			err.message = `Could not read package.json: ${err}`;
			throw err;
		}
	}
	function parse(data) {
		try {
			return parseJSON(data);
		} catch (err) {
			err.message = `Invalid package.json: ${err}`;
			throw err;
		}
	}
	async function readPackage(filename) {
		return parse(await read(filename));
	}
	module.exports = {
		read,
		parse,
		readPackage
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+package-json@7.0.5/node_modules/@npmcli/package-json/lib/sort.js
var require_sort = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	/**
	* arbitrary sort order for package.json largely pulled from:
	* https://github.com/keithamus/sort-package-json/blob/main/defaultRules.md
	*
	* cross checked with:
	* https://github.com/npm/types/blob/main/types/index.d.ts#L104
	* https://docs.npmjs.com/cli/configuring-npm/package-json
	*/
	function packageSort(json) {
		const { name, version, private: isPrivate, description, keywords, homepage, bugs, repository, funding, license, author, maintainers, contributors, type, imports, exports: exports$1, main, browser, types, bin, man, directories, files, workspaces, scripts, config, dependencies, devDependencies, peerDependencies, peerDependenciesMeta, optionalDependencies, bundledDependencies, bundleDependencies, engines, os, cpu, publishConfig, devEngines, licenses, overrides, ...rest } = json;
		return {
			...typeof name !== "undefined" ? { name } : {},
			...typeof version !== "undefined" ? { version } : {},
			...typeof isPrivate !== "undefined" ? { private: isPrivate } : {},
			...typeof description !== "undefined" ? { description } : {},
			...typeof keywords !== "undefined" ? { keywords } : {},
			...typeof homepage !== "undefined" ? { homepage } : {},
			...typeof bugs !== "undefined" ? { bugs } : {},
			...typeof repository !== "undefined" ? { repository } : {},
			...typeof funding !== "undefined" ? { funding } : {},
			...typeof license !== "undefined" ? { license } : {},
			...typeof author !== "undefined" ? { author } : {},
			...typeof maintainers !== "undefined" ? { maintainers } : {},
			...typeof contributors !== "undefined" ? { contributors } : {},
			...typeof type !== "undefined" ? { type } : {},
			...typeof imports !== "undefined" ? { imports } : {},
			...typeof exports$1 !== "undefined" ? { exports: exports$1 } : {},
			...typeof main !== "undefined" ? { main } : {},
			...typeof browser !== "undefined" ? { browser } : {},
			...typeof types !== "undefined" ? { types } : {},
			...typeof bin !== "undefined" ? { bin } : {},
			...typeof man !== "undefined" ? { man } : {},
			...typeof directories !== "undefined" ? { directories } : {},
			...typeof files !== "undefined" ? { files } : {},
			...typeof workspaces !== "undefined" ? { workspaces } : {},
			...typeof scripts !== "undefined" ? { scripts } : {},
			...typeof config !== "undefined" ? { config } : {},
			...typeof dependencies !== "undefined" ? { dependencies } : {},
			...typeof devDependencies !== "undefined" ? { devDependencies } : {},
			...typeof peerDependencies !== "undefined" ? { peerDependencies } : {},
			...typeof peerDependenciesMeta !== "undefined" ? { peerDependenciesMeta } : {},
			...typeof optionalDependencies !== "undefined" ? { optionalDependencies } : {},
			...typeof bundledDependencies !== "undefined" ? { bundledDependencies } : {},
			...typeof bundleDependencies !== "undefined" ? { bundleDependencies } : {},
			...typeof engines !== "undefined" ? { engines } : {},
			...typeof os !== "undefined" ? { os } : {},
			...typeof cpu !== "undefined" ? { cpu } : {},
			...typeof publishConfig !== "undefined" ? { publishConfig } : {},
			...typeof devEngines !== "undefined" ? { devEngines } : {},
			...typeof licenses !== "undefined" ? { licenses } : {},
			...typeof overrides !== "undefined" ? { overrides } : {},
			...rest
		};
	}
	module.exports = { packageSort };
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+package-json@7.0.5/node_modules/@npmcli/package-json/lib/index.js
var require_lib$3 = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const { readFile: readFile$1, writeFile: writeFile$1 } = require("node:fs/promises");
	const { resolve: resolve$1 } = require("node:path");
	const parseJSON = require_lib$12();
	const updateDeps = require_update_dependencies();
	const updateScripts = require_update_scripts();
	const updateWorkspaces = require_update_workspaces();
	const { normalize, syncNormalize } = require_normalize();
	const { read, parse } = require_read_package();
	const { packageSort } = require_sort();
	const knownSteps = /* @__PURE__ */ new Set([
		updateDeps,
		updateScripts,
		updateWorkspaces
	]);
	const knownKeys = /* @__PURE__ */ new Set([
		...updateDeps.knownKeys,
		"scripts",
		"workspaces"
	]);
	module.exports = class PackageJson {
		static fixSteps = Object.freeze([
			"binRefs",
			"bundleDependencies",
			"fixName",
			"fixVersionField",
			"fixRepositoryField",
			"fixDependencies",
			"devDependencies",
			"scriptpath"
		]);
		static normalizeSteps = Object.freeze([
			"_id",
			"_attributes",
			"bundledDependencies",
			"bundleDependencies",
			"optionalDedupe",
			"scripts",
			"funding",
			"bin",
			"binDir"
		]);
		static prepareSteps = Object.freeze([
			"_id",
			"_attributes",
			"bundledDependencies",
			"bundleDependencies",
			"bundleDependenciesDeleteFalse",
			"gypfile",
			"serverjs",
			"scriptpath",
			"authors",
			"readme",
			"mans",
			"binDir",
			"gitHead",
			"fillTypes",
			"normalizeData",
			"binRefs"
		]);
		static async create(path, opts = {}) {
			const p = new PackageJson();
			await p.create(path);
			if (opts.data) return p.update(opts.data);
			return p;
		}
		static async load(path, opts = {}) {
			const p = new PackageJson();
			if (!opts.create) return p.load(path);
			try {
				return await p.load(path);
			} catch (err) {
				if (!err.message.startsWith("Could not read package.json")) throw err;
				return await p.create(path);
			}
		}
		static async fix(path, opts) {
			const p = new PackageJson();
			await p.load(path, true);
			return p.fix(opts);
		}
		static async prepare(path, opts) {
			const p = new PackageJson();
			await p.load(path, true);
			return p.prepare(opts);
		}
		static async normalize(path, opts) {
			const p = new PackageJson();
			await p.load(path);
			return p.normalize(opts);
		}
		#path;
		#manifest;
		#readFileContent = "";
		#canSave = true;
		async load(path, parseIndex) {
			this.#path = path;
			let parseErr;
			try {
				this.#readFileContent = await read(this.filename);
			} catch (err) {
				if (!parseIndex) throw err;
				parseErr = err;
			}
			if (parseErr) {
				const indexFile = resolve$1(this.path, "index.js");
				let indexFileContent;
				try {
					indexFileContent = await readFile$1(indexFile, "utf8");
				} catch (err) {
					throw parseErr;
				}
				try {
					this.fromComment(indexFileContent);
				} catch (err) {
					throw parseErr;
				}
				this.#canSave = false;
				return this;
			}
			return this.fromJSON(this.#readFileContent);
		}
		fromJSON(data) {
			this.#manifest = parse(data);
			return this;
		}
		fromContent(data) {
			if (!data || typeof data !== "object") throw new Error("Content data must be an object");
			this.#manifest = data;
			this.#canSave = false;
			return this;
		}
		fromComment(data) {
			data = data.split(/^\/\*\*package(?:\s|$)/m);
			if (data.length < 2) throw new Error("File has no package in comments");
			data = data[1];
			data = data.split(/\*\*\/$/m);
			if (data.length < 2) throw new Error("File has no package in comments");
			data = data[0];
			data = data.replace(/^\s*\*/gm, "");
			this.#manifest = parseJSON(data);
			return this;
		}
		get content() {
			return this.#manifest;
		}
		get path() {
			return this.#path;
		}
		get filename() {
			if (this.path) return resolve$1(this.path, "package.json");
		}
		create(path) {
			this.#path = path;
			this.#manifest = {};
			return this;
		}
		update(content) {
			if (!this.content) throw new Error("Can not update without content.  Please `load` or `create`");
			for (const step of knownSteps) this.#manifest = step({
				content,
				originalContent: this.content
			});
			for (const [key, value] of Object.entries(content)) if (!knownKeys.has(key)) this.content[key] = value;
			return this;
		}
		async save({ sort } = {}) {
			if (!this.#canSave) throw new Error("No package.json to save to");
			const { [Symbol.for("indent")]: indent, [Symbol.for("newline")]: newline, ...rest } = this.content;
			const format = indent === void 0 ? "  " : indent;
			const eol = newline === void 0 ? "\n" : newline;
			const content = sort ? packageSort(rest) : rest;
			const fileContent = `${JSON.stringify(content, null, format)}\n`.replace(/\n/g, eol);
			if (fileContent.trim() !== this.#readFileContent.trim()) {
				const written = await writeFile$1(this.filename, fileContent);
				this.#readFileContent = fileContent;
				return written;
			}
		}
		syncNormalize(opts = {}) {
			opts.steps = this.constructor.normalizeSteps.filter((s) => s !== "_attributes");
			syncNormalize(this, opts);
			return this;
		}
		async normalize(opts = {}) {
			if (!opts.steps) opts.steps = this.constructor.normalizeSteps;
			await normalize(this, opts);
			return this;
		}
		async prepare(opts = {}) {
			if (!opts.steps) opts.steps = this.constructor.prepareSteps;
			await normalize(this, opts);
			return this;
		}
		async fix(opts = {}) {
			opts.steps = this.constructor.fixSteps;
			await normalize(this, opts);
			return this;
		}
	};
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+name-from-folder@4.0.0/node_modules/@npmcli/name-from-folder/lib/index.js
var require_lib$2 = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const { basename, dirname: dirname$1 } = require("path");
	const getName = (parent, base) => parent.charAt(0) === "@" ? `${parent}/${base}` : base;
	module.exports = (dir) => dir ? getName(basename(dirname$1(dir)), basename(dir)) : false;
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+map-workspaces@5.0.3/node_modules/@npmcli/map-workspaces/lib/index.js
var require_lib$1 = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const path$1 = require("path");
	const getName = require_lib$2();
	const { minimatch } = require_commonjs$2.require_commonjs();
	const pkgJson = require_lib$3();
	const { glob } = require_commonjs$2.require_index_min();
	function appendNegatedPatterns(allPatterns) {
		const patterns = [];
		const negatedPatterns = [];
		for (let pattern of allPatterns) {
			const excl = pattern.match(/^!+/);
			if (excl) pattern = pattern.slice(excl[0].length);
			pattern = pattern.replace(/^\.?\/+/, "");
			if (excl && excl[0].length % 2 === 1) negatedPatterns.push(pattern);
			else {
				for (let i = 0; i < negatedPatterns.length; ++i) {
					const negatedPattern = negatedPatterns[i];
					if (minimatch(pattern, negatedPattern)) negatedPatterns.splice(i, 1);
				}
				patterns.push(pattern);
			}
		}
		for (const negated of negatedPatterns) for (const pattern of minimatch.match(patterns, negated)) patterns.splice(patterns.indexOf(pattern), 1);
		return {
			patterns,
			negatedPatterns
		};
	}
	function getPatterns(workspaces) {
		const workspacesDeclaration = Array.isArray(workspaces.packages) ? workspaces.packages : workspaces;
		if (!Array.isArray(workspacesDeclaration)) throw getError({
			message: "workspaces config expects an Array",
			code: "EWORKSPACESCONFIG"
		});
		return appendNegatedPatterns(workspacesDeclaration);
	}
	function getPackageName(pkg, pathname) {
		return pkg.name || getName(pathname);
	}
	function getGlobPattern(pattern) {
		pattern = pattern.replace(/\\/g, "/");
		return pattern.endsWith("/") ? pattern : `${pattern}/`;
	}
	function getError({ Type = TypeError, message, code }) {
		return Object.assign(new Type(message), { code });
	}
	function reverseResultMap(map) {
		return new Map(Array.from(map, (item) => item.reverse()));
	}
	async function mapWorkspaces(opts = {}) {
		if (!opts || !opts.pkg) throw getError({
			message: "mapWorkspaces missing pkg info",
			code: "EMAPWORKSPACESPKG"
		});
		if (!opts.cwd) opts.cwd = process.cwd();
		const { workspaces = [] } = opts.pkg;
		const { patterns, negatedPatterns } = getPatterns(workspaces);
		const results = /* @__PURE__ */ new Map();
		if (!patterns.length && !negatedPatterns.length) return results;
		const seen = /* @__PURE__ */ new Map();
		const getGlobOpts = () => ({
			...opts,
			ignore: [
				...opts.ignore || [],
				"**/node_modules/**",
				...negatedPatterns
			]
		});
		let matches = await glob(patterns.map((p) => getGlobPattern(p)), getGlobOpts());
		matches = matches.sort((a, b) => a.localeCompare(b, "en"));
		const orderedMatches = [];
		for (const pattern of patterns) orderedMatches.push(...matches.filter((m) => {
			return minimatch(m, pattern, {
				partial: true,
				windowsPathsNoEscape: true
			});
		}));
		for (const match of orderedMatches) {
			let pkg;
			try {
				pkg = await pkgJson.normalize(path$1.join(opts.cwd, match));
			} catch (err) {
				if (err.code === "ENOENT" || err.code === "ENOTDIR") continue;
				else throw err;
			}
			const name = getPackageName(pkg.content, pkg.path);
			let seenPackagePathnames = seen.get(name);
			if (!seenPackagePathnames) {
				seenPackagePathnames = /* @__PURE__ */ new Set();
				seen.set(name, seenPackagePathnames);
			}
			seenPackagePathnames.add(pkg.path);
		}
		const errorMessageArray = ["must not have multiple workspaces with the same name"];
		for (const [packageName, seenPackagePathnames] of seen) if (seenPackagePathnames.size > 1) addDuplicateErrorMessages(errorMessageArray, packageName, seenPackagePathnames);
		else results.set(packageName, seenPackagePathnames.values().next().value);
		if (errorMessageArray.length > 1) throw getError({
			Type: Error,
			message: errorMessageArray.join("\n"),
			code: "EDUPLICATEWORKSPACE"
		});
		return results;
	}
	function addDuplicateErrorMessages(messageArray, packageName, packagePathnames) {
		messageArray.push(`package '${packageName}' has conflicts in the following paths:`);
		for (const packagePathname of packagePathnames) messageArray.push("    " + packagePathname);
	}
	mapWorkspaces.virtual = function(opts = {}) {
		if (!opts || !opts.lockfile) throw getError({
			message: "mapWorkspaces.virtual missing lockfile info",
			code: "EMAPWORKSPACESLOCKFILE"
		});
		if (!opts.cwd) opts.cwd = process.cwd();
		const { packages = {} } = opts.lockfile;
		const { workspaces = [] } = packages[""] || {};
		const results = /* @__PURE__ */ new Map();
		const { patterns, negatedPatterns } = getPatterns(workspaces);
		if (!patterns.length && !negatedPatterns.length) return results;
		negatedPatterns.push("**/node_modules/**");
		const packageKeys = Object.keys(packages);
		for (const pattern of negatedPatterns) for (const packageKey of minimatch.match(packageKeys, pattern)) packageKeys.splice(packageKeys.indexOf(packageKey), 1);
		for (const pattern of patterns) for (const packageKey of minimatch.match(packageKeys, pattern)) {
			const packagePathname = path$1.join(opts.cwd, packageKey);
			const name = getPackageName(packages[packageKey], packagePathname);
			results.set(packagePathname, name);
		}
		return reverseResultMap(results);
	};
	module.exports = mapWorkspaces;
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+config@10.14.0/node_modules/@npmcli/config/lib/index.js
var require_lib = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const { walkUp } = require_commonjs();
	const ini = require_ini();
	const nopt = require_nopt();
	const { log, time } = require_commonjs$2.require_lib$1();
	const { resolve, dirname, join: join$4 } = require("node:path");
	const { homedir } = require("node:os");
	const { readFile, writeFile, chmod, unlink, stat, mkdir } = require("node:fs/promises");
	const internalEnv = [
		"npm-version",
		"global-prefix",
		"local-prefix"
	];
	const fileExists = (...p) => stat(resolve(...p)).then((st) => st.isFile()).catch(() => false);
	const dirExists = (...p) => stat(resolve(...p)).then((st) => st.isDirectory()).catch(() => false);
	const hasOwnProperty = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
	const typeDefs = require_type_defs();
	const nerfDart = require_nerf_dart();
	const envReplace = require_env_replace();
	const parseField = require_parse_field();
	const setEnvs = require_set_envs();
	const confFileTypes = /* @__PURE__ */ new Set([
		"global",
		"user",
		"project"
	]);
	const confTypes = /* @__PURE__ */ new Set([
		"default",
		"builtin",
		...confFileTypes,
		"env",
		"cli"
	]);
	var Config = class {
		#loaded = false;
		#flatten;
		#flatOptions = null;
		#warnings = [];
		static get typeDefs() {
			return typeDefs;
		}
		constructor({ definitions, shorthands, flatten, nerfDarts = [], npmPath, env = process.env, argv = process.argv, platform = process.platform, execPath = process.execPath, cwd = process.cwd(), excludeNpmCwd = false, warn = true }) {
			this.nerfDarts = nerfDarts;
			this.definitions = definitions;
			const { types, defaults, deprecated } = getTypesFromDefinitions(definitions);
			this.deprecated = deprecated;
			this.#flatten = flatten;
			this.types = types;
			this.shorthands = shorthands;
			this.defaults = defaults;
			this.npmPath = npmPath;
			this.npmBin = join$4(this.npmPath, "bin/npm-cli.js");
			this.argv = argv;
			this.env = env;
			this.execPath = execPath;
			this.platform = platform;
			this.cwd = cwd;
			this.excludeNpmCwd = excludeNpmCwd;
			this.globalPrefix = null;
			this.localPrefix = null;
			this.localPackage = null;
			this.home = null;
			const wheres = [...confTypes];
			this.data = /* @__PURE__ */ new Map();
			let parent = null;
			for (const where of wheres) this.data.set(where, parent = new ConfigData(parent));
			this.data.set = () => {
				throw new Error("cannot change internal config data structure");
			};
			this.data.delete = () => {
				throw new Error("cannot change internal config data structure");
			};
			this.sources = /* @__PURE__ */ new Map([]);
			for (const { data } of this.data.values()) this.list.unshift(data);
			this.#loaded = false;
			this.warn = warn;
		}
		get list() {
			const list = [];
			for (const { data } of this.data.values()) list.unshift(data);
			return list;
		}
		get loaded() {
			return this.#loaded;
		}
		get prefix() {
			return this.#get("global") ? this.globalPrefix : this.localPrefix;
		}
		find(key) {
			if (!this.loaded) throw new Error("call config.load() before reading values");
			const entries = [...this.data.entries()];
			for (let i = entries.length - 1; i > -1; i--) {
				const [where, { data }] = entries[i];
				if (hasOwnProperty(data, key)) return where;
			}
			return null;
		}
		get(key, where) {
			if (!this.loaded) throw new Error("call config.load() before reading values");
			return this.#get(key, where);
		}
		#get(key, where = null) {
			if (where !== null && !confTypes.has(where)) throw new Error("invalid config location param: " + where);
			const { data } = this.data.get(where || "cli");
			return where === null || hasOwnProperty(data, key) ? data[key] : void 0;
		}
		set(key, val, where = "cli") {
			if (!this.loaded) throw new Error("call config.load() before setting values");
			if (!confTypes.has(where)) throw new Error("invalid config location param: " + where);
			this.#checkDeprecated(key);
			const { data, raw } = this.data.get(where);
			data[key] = val;
			if ([
				"global",
				"user",
				"project"
			].includes(where)) raw[key] = val;
			this.data.get(where)[_valid] = null;
			this.#flatOptions = null;
		}
		get flat() {
			if (this.#flatOptions) return this.#flatOptions;
			const timeEnd = time.start("config:load:flatten");
			this.#flatOptions = {};
			for (const { data } of this.data.values()) this.#flatten(data, this.#flatOptions);
			this.#flatOptions.nodeBin = this.execPath;
			this.#flatOptions.npmBin = this.npmBin;
			timeEnd();
			return this.#flatOptions;
		}
		delete(key, where = "cli") {
			if (!this.loaded) throw new Error("call config.load() before deleting values");
			if (!confTypes.has(where)) throw new Error("invalid config location param: " + where);
			const { data, raw } = this.data.get(where);
			delete data[key];
			if ([
				"global",
				"user",
				"project"
			].includes(where)) delete raw[key];
			this.data.get(where)[_valid] = null;
			this.#flatOptions = null;
		}
		async load() {
			if (this.loaded) throw new Error("attempting to load npm config multiple times");
			this.loadDefaults();
			await this.loadBuiltinConfig();
			this.loadCLI();
			this.loadEnv();
			await this.loadProjectConfig();
			await this.loadUserConfig();
			await this.loadGlobalConfig();
			this.#loaded = true;
			this.globalPrefix = this.get("prefix");
			this.setEnvs();
		}
		loadDefaults() {
			this.loadGlobalPrefix();
			this.loadHome();
			const defaultsObject = {
				...this.defaults,
				prefix: this.globalPrefix
			};
			try {
				defaultsObject["npm-version"] = require(join$4(this.npmPath, "package.json")).version;
			} catch {}
			this.#loadObject(defaultsObject, "default", "default values");
			const { data } = this.data.get("default");
			Object.defineProperty(data, "globalconfig", {
				get: () => resolve(this.#get("prefix"), "etc/npmrc"),
				set(value) {
					Object.defineProperty(data, "globalconfig", {
						value,
						configurable: true,
						writable: true,
						enumerable: true
					});
				},
				configurable: true,
				enumerable: true
			});
		}
		loadHome() {
			this.home = this.env.HOME || homedir();
		}
		loadGlobalPrefix() {
			if (this.globalPrefix) throw new Error("cannot load default global prefix more than once");
			if (this.env.PREFIX) this.globalPrefix = this.env.PREFIX;
			else if (this.platform === "win32") this.globalPrefix = dirname(this.execPath);
			else {
				this.globalPrefix = dirname(dirname(this.execPath));
				if (this.env.DESTDIR) this.globalPrefix = join$4(this.env.DESTDIR, this.globalPrefix);
			}
		}
		loadEnv() {
			const conf = Object.create(null);
			for (const [envKey, envVal] of Object.entries(this.env)) {
				if (!/^npm_config_/i.test(envKey) || envVal === "") continue;
				let key = envKey.slice(11);
				if (!key.startsWith("//")) key = key.replace(/(?!^)_/g, "-").toLowerCase();
				conf[key] = envVal;
			}
			this.#loadObject(conf, "env", "environment");
		}
		loadCLI() {
			for (const s of Object.keys(this.shorthands)) if (s.length > 1 && this.argv.includes(`-${s}`)) log.warn(`-${s} is not a valid single-hyphen cli flag and will be removed in the future`);
			nopt.invalidHandler = (k, val, type) => this.invalidHandler(k, val, type, "command line options", "cli");
			nopt.unknownHandler = (k, next) => this.unknownHandler(k, next);
			nopt.abbrevHandler = this.abbrevHandler;
			const conf = nopt(this.types, this.shorthands, this.argv);
			nopt.invalidHandler = null;
			nopt.unknownHandler = null;
			this.parsedArgv = conf.argv;
			delete conf.argv;
			this.#loadObject(conf, "cli", "command line options");
		}
		get valid() {
			for (const [where, { valid }] of this.data.entries()) if (valid === false || valid === null && !this.validate(where)) return false;
			return true;
		}
		validate(where) {
			if (!where) {
				let valid = true;
				const authProblems = [];
				for (const entryWhere of this.data.keys()) {
					if (entryWhere === "default" || entryWhere === "builtin" || entryWhere === "cli") continue;
					const ret = this.validate(entryWhere);
					valid = valid && ret;
					if ([
						"global",
						"user",
						"project"
					].includes(entryWhere)) {
						for (const key of ["_authtoken", "-authtoken"]) if (this.get(key, entryWhere)) authProblems.push({
							action: "delete",
							key,
							where: entryWhere
						});
						const nerfedReg = nerfDart(this.get("registry"));
						for (const key of [
							"_auth",
							"_authToken",
							"username",
							"_password"
						]) if (this.get(key, entryWhere)) {
							if (key === "username" && !this.get("_password", entryWhere)) authProblems.push({
								action: "delete",
								key,
								where: entryWhere
							});
							else if (key === "_password" && !this.get("username", entryWhere)) authProblems.push({
								action: "delete",
								key,
								where: entryWhere
							});
							else authProblems.push({
								action: "rename",
								from: key,
								to: `${nerfedReg}:${key}`,
								where: entryWhere
							});
						}
					}
				}
				if (authProblems.length) {
					const { ErrInvalidAuth } = require_errors$1();
					throw new ErrInvalidAuth(authProblems);
				}
				return valid;
			} else {
				const obj = this.data.get(where);
				obj[_valid] = true;
				nopt.invalidHandler = (k, val, type) => this.invalidHandler(k, val, type, obj.source, where);
				nopt.clean(obj.data, this.types, typeDefs);
				nopt.invalidHandler = null;
				return obj[_valid];
			}
		}
		repair(problems) {
			if (!problems) try {
				this.validate();
			} catch (err) {
				// istanbul ignore next
				if (err.code !== "ERR_INVALID_AUTH") throw err;
				problems = err.problems;
			} finally {
				if (!problems) problems = [];
			}
			for (const problem of problems)
 // istanbul ignore else
			if (problem.action === "delete") this.delete(problem.key, problem.where);
			else if (problem.action === "rename") {
				const raw = this.data.get(problem.where).raw?.[problem.from];
				const calculated = this.get(problem.from, problem.where);
				this.set(problem.to, raw || calculated, problem.where);
				this.delete(problem.from, problem.where);
			}
		}
		isDefault(key) {
			const [defaultType, ...types] = [...confTypes];
			const defaultData = this.data.get(defaultType).data;
			return hasOwnProperty(defaultData, key) && types.every((type) => {
				const typeData = this.data.get(type).data;
				return !hasOwnProperty(typeData, key);
			});
		}
		invalidHandler(k, val, type, source, where) {
			const typeDescription = require_type_description();
			log.warn("invalid config", k + "=" + JSON.stringify(val), `set in ${source}`);
			this.data.get(where)[_valid] = false;
			if (Array.isArray(type)) {
				if (type.includes(typeDefs.url.type)) type = typeDefs.url.type;
				else if (type.includes(typeDefs.path.type)) type = typeDefs.path.type;
			}
			const typeDesc = typeDescription(type);
			const mustBe = typeDesc.filter((m) => m !== void 0 && m !== Array);
			const msg = "Must be" + this.#getOneOfKeywords(mustBe, typeDesc);
			const desc = mustBe.length === 1 ? mustBe[0] : [...new Set(mustBe.map((n) => typeof n === "string" ? n : JSON.stringify(n)))].join(", ");
			log.warn("invalid config", msg, desc);
		}
		abbrevHandler(short, long) {
			log.warn(`Expanding --${short} to --${long}. This will stop working in the next major version of npm.`);
		}
		unknownHandler(key, next) {
			if (next) this.queueWarning(`unknown:${next}`, `"${next}" is being parsed as a normal command line argument.`);
		}
		#getOneOfKeywords(mustBe, typeDesc) {
			let keyword;
			if (mustBe.length === 1 && typeDesc.includes(Array)) keyword = " one or more";
			else if (mustBe.length > 1 && typeDesc.includes(Array)) keyword = " one or more of:";
			else if (mustBe.length > 1) keyword = " one of:";
			else keyword = "";
			return keyword;
		}
		#loadObject(obj, where, source, er = null) {
			const conf = this.data.get(where);
			if (conf.source) {
				const m = `double-loading "${where}" configs from ${source}, previously loaded from ${conf.source}`;
				throw new Error(m);
			}
			if (this.sources.has(source)) {
				const m = `double-loading config "${source}" as "${where}", previously loaded as "${this.sources.get(source)}"`;
				throw new Error(m);
			}
			conf.source = source;
			this.sources.set(source, where);
			if (er) {
				conf.loadError = er;
				if (er.code !== "ENOENT") log.verbose("config", `error loading ${where} config`, er);
			} else {
				conf.raw = obj;
				outer: for (const [key, value] of Object.entries(obj)) {
					const k = envReplace(key, this.env);
					const v = this.parseField(value, k);
					if (where !== "default") {
						this.#checkDeprecated(k);
						if (this.definitions[key]?.exclusive) {
							for (const exclusive of this.definitions[key].exclusive) if (!this.isDefault(exclusive)) {
								if (where === "env") {
									const cliData = this.data.get("cli").data;
									if (Object.hasOwn(cliData, exclusive)) continue outer;
								}
								throw new TypeError(`--${key} cannot be provided when using --${exclusive}`);
							}
						}
					}
					if (where !== "default" || key === "npm-version") this.checkUnknown(where, key);
					conf.data[k] = v;
				}
			}
		}
		checkUnknown(where, key) {
			if (!this.definitions[key]) {
				if (internalEnv.includes(key)) return;
				const hint = where !== "cli" ? " See `npm help npmrc` for supported config options." : "";
				if (!key.includes(":")) {
					this.queueWarning(key, `Unknown ${where} config "${where === "cli" ? "--" : ""}${key}". This will stop working in the next major version of npm.${hint}`);
					return;
				}
				const baseKey = key.split(":").pop();
				if (!this.definitions[baseKey] && !this.nerfDarts.includes(baseKey)) this.queueWarning(baseKey, `Unknown ${where} config "${baseKey}" (${key}). This will stop working in the next major version of npm.${hint}`);
			}
		}
		#checkDeprecated(key) {
			if (this.deprecated[key]) log.warn("config", key, this.deprecated[key]);
		}
		parseField(f, key, listElement = false) {
			return parseField(f, key, this, listElement);
		}
		async #loadFile(file, type) {
			log.silly("config", `load:file:${file}`);
			await readFile(file, "utf8").then((data) => {
				const parsedConfig = ini.parse(data);
				if (type === "project" && parsedConfig.prefix) log.error("config", `prefix cannot be changed from project config: ${file}.`);
				return this.#loadObject(parsedConfig, type, file);
			}, (er) => this.#loadObject(null, type, file, er));
		}
		loadBuiltinConfig() {
			return this.#loadFile(resolve(this.npmPath, "npmrc"), "builtin");
		}
		async loadProjectConfig() {
			await this.loadLocalPrefix();
			if (this.localPackage == null) this.localPackage = await fileExists(this.localPrefix, "package.json");
			if (this.#get("global") === true || this.#get("location") === "global") {
				this.data.get("project").source = "(global mode enabled, ignored)";
				this.sources.set(this.data.get("project").source, "project");
				return;
			}
			const projectFile = resolve(this.localPrefix, ".npmrc");
			if (projectFile !== this.#get("userconfig")) return this.#loadFile(projectFile, "project");
			else {
				this.data.get("project").source = "(same as \"user\" config, ignored)";
				this.sources.set(this.data.get("project").source, "project");
			}
		}
		async loadLocalPrefix() {
			const cliPrefix = this.#get("prefix", "cli");
			if (cliPrefix) {
				this.localPrefix = cliPrefix;
				return;
			}
			const cliWorkspaces = this.#get("workspaces", "cli");
			const isGlobal = this.#get("global") || this.#get("location") === "global";
			for (const p of walkUp(this.cwd)) {
				if (this.excludeNpmCwd && p === this.npmPath) break;
				const hasPackageJson = await fileExists(p, "package.json");
				if (!this.localPrefix && (hasPackageJson || await dirExists(p, "node_modules"))) {
					this.localPrefix = p;
					this.localPackage = hasPackageJson;
					if (cliWorkspaces === false || isGlobal) return;
					continue;
				}
				if (this.localPrefix && hasPackageJson) {
					const { content: pkg } = await require_lib$3().normalize(p).catch(() => ({ content: {} }));
					if (!pkg?.workspaces) continue;
					const workspaces = await require_lib$1()({
						cwd: p,
						pkg
					});
					for (const w of workspaces.values()) if (w === this.localPrefix) {
						if (await fileExists(this.localPrefix, ".npmrc")) log.warn("config", `ignoring workspace config at ${this.localPrefix}/.npmrc`);
						const { data } = this.data.get("default");
						data.workspace = [this.localPrefix];
						this.localPrefix = p;
						this.localPackage = hasPackageJson;
						log.info("config", `found workspace root at ${this.localPrefix}`);
						return;
					}
				}
			}
			if (!this.localPrefix) this.localPrefix = this.cwd;
		}
		loadUserConfig() {
			return this.#loadFile(this.#get("userconfig"), "user");
		}
		loadGlobalConfig() {
			return this.#loadFile(this.#get("globalconfig"), "global");
		}
		async save(where) {
			if (!this.loaded) throw new Error("call config.load() before saving");
			if (!confFileTypes.has(where)) throw new Error("invalid config location param: " + where);
			const conf = this.data.get(where);
			conf[_loadError] = null;
			if (where === "user") {
				const nerfed = nerfDart(this.get("registry"));
				const email = this.get(`${nerfed}:email`, "user");
				if (email) {
					this.delete(`${nerfed}:email`, "user");
					this.set("email", email, "user");
				}
			}
			const iniData = ini.stringify(conf.raw).trim() + "\n";
			if (!iniData.trim()) {
				await unlink(conf.source).catch(() => {});
				return;
			}
			const dir = dirname(conf.source);
			await mkdir(dir, { recursive: true });
			await writeFile(conf.source, iniData, "utf8");
			const mode = where === "user" ? 384 : 438;
			await chmod(conf.source, mode);
		}
		clearCredentialsByURI(uri, level = "user") {
			const nerfed = nerfDart(uri);
			if (nerfDart(this.get("registry")) === nerfed) {
				this.delete(`-authtoken`, level);
				this.delete(`_authToken`, level);
				this.delete(`_authtoken`, level);
				this.delete(`_auth`, level);
				this.delete(`_password`, level);
				this.delete(`username`, level);
				const email = this.get(`${nerfed}:email`, level);
				if (email) this.set("email", email, level);
			}
			this.delete(`${nerfed}:_authToken`, level);
			this.delete(`${nerfed}:_auth`, level);
			this.delete(`${nerfed}:_password`, level);
			this.delete(`${nerfed}:username`, level);
			this.delete(`${nerfed}:email`, level);
			this.delete(`${nerfed}:certfile`, level);
			this.delete(`${nerfed}:keyfile`, level);
		}
		setCredentialsByURI(uri, { token, username, password, certfile, keyfile }) {
			const nerfed = nerfDart(uri);
			this.delete(`${nerfed}:always-auth`, "user");
			this.delete(`${nerfed}:email`, "user");
			if (certfile && keyfile) {
				this.set(`${nerfed}:certfile`, certfile, "user");
				this.set(`${nerfed}:keyfile`, keyfile, "user");
			}
			if (token) {
				this.set(`${nerfed}:_authToken`, token, "user");
				this.delete(`${nerfed}:_password`, "user");
				this.delete(`${nerfed}:username`, "user");
			} else if (username || password) {
				if (!username) throw new Error("must include username");
				if (!password) throw new Error("must include password");
				this.delete(`${nerfed}:_authToken`, "user");
				this.set(`${nerfed}:username`, username, "user");
				const encoded = Buffer.from(password, "utf8").toString("base64");
				this.set(`${nerfed}:_password`, encoded, "user");
			} else if (!certfile || !keyfile) throw new Error("No credentials to set.");
		}
		getCredentialsByURI(uri) {
			const nerfed = nerfDart(uri);
			const def = nerfDart(this.get("registry"));
			const creds = {};
			const email = this.get(`${nerfed}:email`) || this.get("email");
			if (email) {
				if (nerfed === def) this.set("email", email, "user");
				creds.email = email;
			}
			const certfileReg = this.get(`${nerfed}:certfile`);
			const keyfileReg = this.get(`${nerfed}:keyfile`);
			if (certfileReg && keyfileReg) {
				creds.certfile = certfileReg;
				creds.keyfile = keyfileReg;
			}
			const tokenReg = this.get(`${nerfed}:_authToken`);
			if (tokenReg) {
				creds.token = tokenReg;
				return creds;
			}
			const userReg = this.get(`${nerfed}:username`);
			const passReg = this.get(`${nerfed}:_password`);
			if (userReg && passReg) {
				creds.username = userReg;
				creds.password = Buffer.from(passReg, "base64").toString("utf8");
				const auth = `${creds.username}:${creds.password}`;
				creds.auth = Buffer.from(auth, "utf8").toString("base64");
				return creds;
			}
			const authReg = this.get(`${nerfed}:_auth`);
			if (authReg) {
				const authSplit = Buffer.from(authReg, "base64").toString("utf8").split(":");
				creds.username = authSplit.shift();
				creds.password = authSplit.join(":");
				creds.auth = authReg;
				return creds;
			}
			return creds;
		}
		setEnvs() {
			setEnvs(this);
		}
		removeWarning(key) {
			this.#warnings = this.#warnings.filter((w) => w.type !== key);
		}
		getUnknownPositionals() {
			return this.#warnings.filter((w) => w.type.startsWith("unknown:")).map((w) => w.type.slice(8));
		}
		removeUnknownPositional(value) {
			this.removeWarning(`unknown:${value}`);
		}
		queueWarning(type, ...args) {
			if (!this.warn) this.#warnings.push({
				type,
				args
			});
			else log.warn(...args);
		}
		logWarnings() {
			for (const warning of this.#warnings) log.warn(...warning.args);
			this.#warnings = [];
		}
	};
	const _loadError = Symbol("loadError");
	const _valid = Symbol("valid");
	var ConfigData = class {
		#data;
		#source = null;
		#raw = null;
		constructor(parent) {
			this.#data = Object.create(parent && parent.data);
			this.#raw = {};
			this[_valid] = true;
		}
		get data() {
			return this.#data;
		}
		get valid() {
			return this[_valid];
		}
		set source(s) {
			if (this.#source) throw new Error("cannot set ConfigData source more than once");
			this.#source = s;
		}
		get source() {
			return this.#source;
		}
		set loadError(e) {
			if (this[_loadError] || Object.keys(this.#raw).length) throw new Error("cannot set ConfigData loadError after load");
			this[_loadError] = e;
		}
		get loadError() {
			return this[_loadError];
		}
		set raw(r) {
			if (Object.keys(this.#raw).length || this[_loadError]) throw new Error("cannot set ConfigData raw after load");
			this.#raw = r;
		}
		get raw() {
			return this.#raw;
		}
	};
	const getTypesFromDefinitions = (definitions) => {
		const types = {};
		const defaults = {};
		const deprecated = {};
		for (const [key, def] of Object.entries(definitions)) {
			defaults[key] = def.default;
			types[key] = def.type;
			if (def.deprecated) deprecated[key] = def.deprecated.trim().replace(/\n +/, "\n");
		}
		return {
			types,
			defaults,
			deprecated
		};
	};
	module.exports = Config;
	module.exports.getTypesFromDefinitions = getTypesFromDefinitions;
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+config@10.14.0/node_modules/@npmcli/config/lib/definitions/definition.js
var require_definition = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const required = [
		"type",
		"description",
		"default",
		"key"
	];
	const allowed = [
		"default",
		"defaultDescription",
		"deprecated",
		"description",
		"exclusive",
		"flatten",
		"hint",
		"key",
		"short",
		"type",
		"typeDescription",
		"usage",
		"envExport",
		"alias",
		"required"
	];
	const { semver: { type: semver }, Umask: { type: Umask }, url: { type: url }, path: { type: path } } = require_type_defs();
	var Definition = class {
		constructor(key, def) {
			this.key = key;
			this.envExport = true;
			Object.assign(this, def);
			this.validate();
			if (!this.defaultDescription) this.defaultDescription = describeValue(this.default);
			if (!this.typeDescription) this.typeDescription = describeType(this.type);
			if (!this.hint) {
				if (this.type === Number) this.hint = "<number>";
				else this.hint = `<${this.key}>`;
			}
			if (!this.usage) this.usage = describeUsage(this);
		}
		validate() {
			for (const req of required) if (!Object.prototype.hasOwnProperty.call(this, req)) throw new Error(`config lacks ${req}: ${this.key}`);
			if (!this.key) throw new Error(`config lacks key: ${this.key}`);
			for (const field of Object.keys(this)) if (!allowed.includes(field)) throw new Error(`config defines unknown field ${field}: ${this.key}`);
		}
		describe() {
			const description = unindent(this.description);
			const noEnvExport = this.envExport ? "" : `
This value is not exported to the environment for child processes.
`;
			const deprecated = !this.deprecated ? "" : `* DEPRECATED: ${unindent(this.deprecated)}\n`;
			const exclusive = !this.exclusive ? "" : `\nThis config cannot be used with: \`${this.exclusive.join("`, `")}\``;
			return wrapAll(`#### \`${this.key}\`

* Default: ${unindent(this.defaultDescription)}
* Type: ${unindent(this.typeDescription)}
${deprecated}
${description}
${exclusive}
${noEnvExport}`);
		}
	};
	const describeUsage = (def) => {
		let key = "";
		if (!Array.isArray(def.type)) {
			if (def.short) key = `-${def.short}|`;
			if (def.type === Boolean && def.default !== false) key = `${key}--no-${def.key}`;
			else key = `${key}--${def.key}`;
			if (def.type !== Boolean) key = `${key} ${def.hint}`;
			return key;
		}
		key = `--${def.key}`;
		if (def.short) key = `-${def.short}|--${def.key}`;
		let types = def.type;
		const multiple = types.includes(Array);
		const bool = types.includes(Boolean);
		types = types.filter((t) => t !== null && t !== Array && t !== Boolean);
		if (!types.length) return key;
		let description;
		if (!types.some((t) => typeof t !== "string")) description = `<${types.filter((d) => d).join("|")}>`;
		else description = def.hint;
		if (bool) key = `--no-${def.key}|${key}`;
		const usage = `${key} ${description}`;
		if (multiple) return `${usage} [${usage} ...]`;
		else return usage;
	};
	const describeType = (type) => {
		if (Array.isArray(type)) {
			const descriptions = type.filter((t) => t !== Array).map((t) => describeType(t));
			const last = descriptions.length > 1 ? [descriptions.pop()] : [];
			const oxford = descriptions.length > 1 ? ", or " : " or ";
			return `${[descriptions.join(", ")].concat(last).join(oxford)}${type.includes(Array) ? " (can be set multiple times)" : ""}`;
		}
		switch (type) {
			case String: return "String";
			case Number: return "Number";
			case Umask: return "Octal numeric string in range 0000..0777 (0..511)";
			case Boolean: return "Boolean";
			case Date: return "Date";
			case path: return "Path";
			case semver: return "SemVer string";
			case url: return "URL";
			default: return describeValue(type);
		}
	};
	const describeValue = (val) => typeof val === "string" ? JSON.stringify(val) : String(val);
	const unindent = (s) => {
		const match = s.match(/\n +/);
		return !match ? s.trim() : s.split(match[0]).join("\n").trim();
	};
	const wrap = (s) => {
		const cols = Math.min(Math.max(20, process.stdout.columns) || 80, 80) - 5;
		return unindent(s).split(/[ \n]+/).reduce((left, right) => {
			const last = left.split("\n").pop();
			return left + (last.length && last.length + right.length > cols ? "\n" : " ") + right;
		});
	};
	const wrapAll = (s) => {
		let inCodeBlock = false;
		return s.split("\n\n").map((block) => {
			if (inCodeBlock || block.startsWith("```")) {
				inCodeBlock = !block.endsWith("```");
				return block;
			}
			if (block.charAt(0) === "*") return "* " + block.slice(1).trim().split("\n* ").map((li) => {
				return wrap(li).replace(/\n/g, "\n  ");
			}).join("\n* ");
			else return wrap(block);
		}).join("\n\n");
	};
	module.exports = Definition;
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+config@10.14.0/node_modules/@npmcli/config/lib/parse-allow-scripts-list.js
var require_parse_allow_scripts_list = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const parseAllowScriptsList = (raw) => {
		const parts = [];
		const entries = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
		for (const entry of entries) {
			if (typeof entry !== "string") continue;
			for (const part of entry.split(",")) {
				const trimmed = part.trim();
				if (trimmed) parts.push(trimmed);
			}
		}
		return parts;
	};
	module.exports = parseAllowScriptsList;
}));
//#endregion
//#region ../../node_modules/.pnpm/ci-info@4.4.0/node_modules/ci-info/vendors.json
var require_vendors = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	module.exports = [
		{
			"name": "Agola CI",
			"constant": "AGOLA",
			"env": "AGOLA_GIT_REF",
			"pr": "AGOLA_PULL_REQUEST_ID"
		},
		{
			"name": "Alpic",
			"constant": "ALPIC",
			"env": "ALPIC_HOST"
		},
		{
			"name": "Appcircle",
			"constant": "APPCIRCLE",
			"env": "AC_APPCIRCLE",
			"pr": {
				"env": "AC_GIT_PR",
				"ne": "false"
			}
		},
		{
			"name": "AppVeyor",
			"constant": "APPVEYOR",
			"env": "APPVEYOR",
			"pr": "APPVEYOR_PULL_REQUEST_NUMBER"
		},
		{
			"name": "AWS CodeBuild",
			"constant": "CODEBUILD",
			"env": "CODEBUILD_BUILD_ARN",
			"pr": {
				"env": "CODEBUILD_WEBHOOK_EVENT",
				"any": [
					"PULL_REQUEST_CREATED",
					"PULL_REQUEST_UPDATED",
					"PULL_REQUEST_REOPENED"
				]
			}
		},
		{
			"name": "Azure Pipelines",
			"constant": "AZURE_PIPELINES",
			"env": "TF_BUILD",
			"pr": { "BUILD_REASON": "PullRequest" }
		},
		{
			"name": "Bamboo",
			"constant": "BAMBOO",
			"env": "bamboo_planKey"
		},
		{
			"name": "Bitbucket Pipelines",
			"constant": "BITBUCKET",
			"env": "BITBUCKET_COMMIT",
			"pr": "BITBUCKET_PR_ID"
		},
		{
			"name": "Bitrise",
			"constant": "BITRISE",
			"env": "BITRISE_IO",
			"pr": "BITRISE_PULL_REQUEST"
		},
		{
			"name": "Buddy",
			"constant": "BUDDY",
			"env": "BUDDY_WORKSPACE_ID",
			"pr": "BUDDY_EXECUTION_PULL_REQUEST_ID"
		},
		{
			"name": "Buildkite",
			"constant": "BUILDKITE",
			"env": "BUILDKITE",
			"pr": {
				"env": "BUILDKITE_PULL_REQUEST",
				"ne": "false"
			}
		},
		{
			"name": "CircleCI",
			"constant": "CIRCLE",
			"env": "CIRCLECI",
			"pr": "CIRCLE_PULL_REQUEST"
		},
		{
			"name": "Cirrus CI",
			"constant": "CIRRUS",
			"env": "CIRRUS_CI",
			"pr": "CIRRUS_PR"
		},
		{
			"name": "Cloudflare Pages",
			"constant": "CLOUDFLARE_PAGES",
			"env": "CF_PAGES"
		},
		{
			"name": "Cloudflare Workers",
			"constant": "CLOUDFLARE_WORKERS",
			"env": "WORKERS_CI"
		},
		{
			"name": "Codefresh",
			"constant": "CODEFRESH",
			"env": "CF_BUILD_ID",
			"pr": { "any": ["CF_PULL_REQUEST_NUMBER", "CF_PULL_REQUEST_ID"] }
		},
		{
			"name": "Codemagic",
			"constant": "CODEMAGIC",
			"env": "CM_BUILD_ID",
			"pr": "CM_PULL_REQUEST"
		},
		{
			"name": "Codeship",
			"constant": "CODESHIP",
			"env": { "CI_NAME": "codeship" }
		},
		{
			"name": "Drone",
			"constant": "DRONE",
			"env": "DRONE",
			"pr": { "DRONE_BUILD_EVENT": "pull_request" }
		},
		{
			"name": "dsari",
			"constant": "DSARI",
			"env": "DSARI"
		},
		{
			"name": "Earthly",
			"constant": "EARTHLY",
			"env": "EARTHLY_CI"
		},
		{
			"name": "Expo Application Services",
			"constant": "EAS",
			"env": "EAS_BUILD"
		},
		{
			"name": "Gerrit",
			"constant": "GERRIT",
			"env": "GERRIT_PROJECT"
		},
		{
			"name": "Gitea Actions",
			"constant": "GITEA_ACTIONS",
			"env": "GITEA_ACTIONS"
		},
		{
			"name": "GitHub Actions",
			"constant": "GITHUB_ACTIONS",
			"env": "GITHUB_ACTIONS",
			"pr": { "GITHUB_EVENT_NAME": "pull_request" }
		},
		{
			"name": "GitLab CI",
			"constant": "GITLAB",
			"env": "GITLAB_CI",
			"pr": "CI_MERGE_REQUEST_ID"
		},
		{
			"name": "GoCD",
			"constant": "GOCD",
			"env": "GO_PIPELINE_LABEL"
		},
		{
			"name": "Google Cloud Build",
			"constant": "GOOGLE_CLOUD_BUILD",
			"env": "BUILDER_OUTPUT"
		},
		{
			"name": "Harness CI",
			"constant": "HARNESS",
			"env": "HARNESS_BUILD_ID"
		},
		{
			"name": "Heroku",
			"constant": "HEROKU",
			"env": {
				"env": "NODE",
				"includes": "/app/.heroku/node/bin/node"
			}
		},
		{
			"name": "Hudson",
			"constant": "HUDSON",
			"env": "HUDSON_URL"
		},
		{
			"name": "Jenkins",
			"constant": "JENKINS",
			"env": ["JENKINS_URL", "BUILD_ID"],
			"pr": { "any": ["ghprbPullId", "CHANGE_ID"] }
		},
		{
			"name": "LayerCI",
			"constant": "LAYERCI",
			"env": "LAYERCI",
			"pr": "LAYERCI_PULL_REQUEST"
		},
		{
			"name": "Magnum CI",
			"constant": "MAGNUM",
			"env": "MAGNUM"
		},
		{
			"name": "Netlify CI",
			"constant": "NETLIFY",
			"env": "NETLIFY",
			"pr": {
				"env": "PULL_REQUEST",
				"ne": "false"
			}
		},
		{
			"name": "Nevercode",
			"constant": "NEVERCODE",
			"env": "NEVERCODE",
			"pr": {
				"env": "NEVERCODE_PULL_REQUEST",
				"ne": "false"
			}
		},
		{
			"name": "Prow",
			"constant": "PROW",
			"env": "PROW_JOB_ID"
		},
		{
			"name": "ReleaseHub",
			"constant": "RELEASEHUB",
			"env": "RELEASE_BUILD_ID"
		},
		{
			"name": "Render",
			"constant": "RENDER",
			"env": "RENDER",
			"pr": { "IS_PULL_REQUEST": "true" }
		},
		{
			"name": "Sail CI",
			"constant": "SAIL",
			"env": "SAILCI",
			"pr": "SAIL_PULL_REQUEST_NUMBER"
		},
		{
			"name": "Screwdriver",
			"constant": "SCREWDRIVER",
			"env": "SCREWDRIVER",
			"pr": {
				"env": "SD_PULL_REQUEST",
				"ne": "false"
			}
		},
		{
			"name": "Semaphore",
			"constant": "SEMAPHORE",
			"env": "SEMAPHORE",
			"pr": "PULL_REQUEST_NUMBER"
		},
		{
			"name": "Sourcehut",
			"constant": "SOURCEHUT",
			"env": { "CI_NAME": "sourcehut" }
		},
		{
			"name": "Strider CD",
			"constant": "STRIDER",
			"env": "STRIDER"
		},
		{
			"name": "TaskCluster",
			"constant": "TASKCLUSTER",
			"env": ["TASK_ID", "RUN_ID"]
		},
		{
			"name": "TeamCity",
			"constant": "TEAMCITY",
			"env": "TEAMCITY_VERSION"
		},
		{
			"name": "Travis CI",
			"constant": "TRAVIS",
			"env": "TRAVIS",
			"pr": {
				"env": "TRAVIS_PULL_REQUEST",
				"ne": "false"
			}
		},
		{
			"name": "Vela",
			"constant": "VELA",
			"env": "VELA",
			"pr": { "VELA_PULL_REQUEST": "1" }
		},
		{
			"name": "Vercel",
			"constant": "VERCEL",
			"env": { "any": ["NOW_BUILDER", "VERCEL"] },
			"pr": "VERCEL_GIT_PULL_REQUEST_ID"
		},
		{
			"name": "Visual Studio App Center",
			"constant": "APPCENTER",
			"env": "APPCENTER_BUILD_ID"
		},
		{
			"name": "Woodpecker",
			"constant": "WOODPECKER",
			"env": { "CI": "woodpecker" },
			"pr": { "CI_BUILD_EVENT": "pull_request" }
		},
		{
			"name": "Xcode Cloud",
			"constant": "XCODE_CLOUD",
			"env": "CI_XCODE_PROJECT",
			"pr": "CI_PULL_REQUEST_NUMBER"
		},
		{
			"name": "Xcode Server",
			"constant": "XCODE_SERVER",
			"env": "XCS"
		}
	];
}));
//#endregion
//#region ../../node_modules/.pnpm/ci-info@4.4.0/node_modules/ci-info/index.js
var require_ci_info = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports) => {
	const vendors = require_vendors();
	const env = process.env;
	Object.defineProperty(exports, "_vendors", { value: vendors.map(function(v) {
		return v.constant;
	}) });
	exports.name = null;
	exports.isPR = null;
	exports.id = null;
	if (env.CI !== "false") vendors.forEach(function(vendor) {
		const isCI = (Array.isArray(vendor.env) ? vendor.env : [vendor.env]).every(function(obj) {
			return checkEnv(obj);
		});
		exports[vendor.constant] = isCI;
		if (!isCI) return;
		exports.name = vendor.name;
		exports.isPR = checkPR(vendor);
		exports.id = vendor.constant;
	});
	exports.isCI = !!(env.CI !== "false" && (env.BUILD_ID || env.BUILD_NUMBER || env.CI || env.CI_APP_ID || env.CI_BUILD_ID || env.CI_BUILD_NUMBER || env.CI_NAME || env.CONTINUOUS_INTEGRATION || env.RUN_ID || exports.name || false));
	function checkEnv(obj) {
		if (typeof obj === "string") return !!env[obj];
		if ("env" in obj) return env[obj.env] && env[obj.env].includes(obj.includes);
		if ("any" in obj) return obj.any.some(function(k) {
			return !!env[k];
		});
		return Object.keys(obj).every(function(k) {
			return env[k] === obj[k];
		});
	}
	function checkPR(vendor) {
		switch (typeof vendor.pr) {
			case "string": return !!env[vendor.pr];
			case "object": if ("env" in vendor.pr) {
				if ("any" in vendor.pr) return vendor.pr.any.some(function(key) {
					return env[vendor.pr.env] === key;
				});
				else return vendor.pr.env in env && env[vendor.pr.env] !== vendor.pr.ne;
			} else if ("any" in vendor.pr) return vendor.pr.any.some(function(key) {
				return !!env[key];
			});
			else return checkEnv(vendor.pr);
			default: return null;
		}
	}
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+config@10.14.0/node_modules/@npmcli/config/lib/definitions/definitions.js
var require_definitions$1 = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const Definition = require_definition();
	const parseAllowScriptsList = require_parse_allow_scripts_list();
	const ciInfo = require_ci_info();
	const querystring = require("node:querystring");
	const { join: join$3 } = require("node:path");
	const isWindows = process.platform === "win32";
	const { readFileSync: readFileSync$2 } = require("node:fs");
	const maybeReadFile = (file) => {
		try {
			return readFileSync$2(file, "utf8");
		} catch (er) {
			if (er.code !== "ENOENT") throw er;
			return null;
		}
	};
	const buildOmitList = (obj) => {
		const include = obj.include || [];
		const omit = obj.omit || [];
		const only = obj.only;
		if (/^prod(uction)?$/.test(only) || obj.production) omit.push("dev");
		else if (obj.production === false) include.push("dev");
		if (/^dev/.test(obj.also)) include.push("dev");
		if (obj.dev) include.push("dev");
		if (obj.optional === false) omit.push("optional");
		else if (obj.optional === true) include.push("optional");
		obj.omit = [...new Set(omit)].filter((type) => !include.includes(type));
		obj.include = [...new Set(include)];
		if (obj.omit.includes("dev")) process.env.NODE_ENV = "production";
		return obj.omit;
	};
	const editor = process.env.EDITOR || process.env.VISUAL || (isWindows ? `${process.env.SYSTEMROOT}\\notepad.exe` : "vi");
	const shell = isWindows ? process.env.ComSpec || "cmd" : process.env.SHELL || "sh";
	const { networkInterfaces } = require("node:os");
	const getLocalAddresses = () => {
		try {
			return Object.values(networkInterfaces()).map((int) => int.map(({ address }) => address)).reduce((set, addrs) => set.concat(addrs), [null]);
		} catch (e) {
			return [null];
		}
	};
	const unicode = /UTF-?8$/i.test(process.env.LC_ALL || process.env.LC_CTYPE || process.env.LANG);
	const cache = `${isWindows && process.env.LOCALAPPDATA || "~"}/${isWindows ? "npm-cache" : ".npm"}`;
	const { semver: { type: Semver }, Umask: { type: Umask }, url: { type: url }, path: { type: path } } = require_type_defs();
	const flatten = (key, obj, flatOptions) => {
		const camel = key.replace(/-([a-z])/g, (_0, _1) => _1.toUpperCase());
		flatOptions[camel] = obj[key];
	};
	const definitions = {
		_auth: new Definition("_auth", {
			default: null,
			type: [null, String],
			description: `
    A basic-auth string to use when authenticating against the npm registry.
    This will ONLY be used to authenticate against the npm registry.  For other
    registries you will need to scope it like "//other-registry.tld/:_auth"

    Warning: This should generally not be set via a command-line option.  It
    is safer to use a registry-provided authentication bearer token stored in
    the ~/.npmrc file by running \`npm login\`.
  `,
			flatten
		}),
		access: new Definition("access", {
			default: null,
			defaultDescription: `
    'public' for new packages, existing packages it will not change the current level
  `,
			type: [
				null,
				"restricted",
				"public",
				"private"
			],
			description: `
    If you do not want your scoped package to be publicly viewable (and
    installable) set \`--access=restricted\`.

    Unscoped packages cannot be set to \`restricted\`.

    Note: This defaults to not changing the current access level for existing
    packages.  Specifying a value of \`restricted\` or \`public\` during
    publish will change the access for an existing package the same way that
    \`npm access set status\` would.

    The value \`private\` is an alias for \`restricted\`.
  `,
			flatten(key, obj, flatOptions) {
				const value = obj[key];
				flatOptions.access = value === "private" ? "restricted" : value;
			}
		}),
		all: new Definition("all", {
			default: false,
			type: Boolean,
			short: "a",
			description: `
    Show or act on all packages, not just the ones your project directly
    depends on. For \`npm outdated\` and \`npm ls\` this lists every outdated
    or installed package. For \`npm approve-scripts\` and \`npm deny-scripts\`
    it selects every package with pending install scripts.
  `,
			flatten
		}),
		"allow-same-version": new Definition("allow-same-version", {
			default: false,
			type: Boolean,
			description: `
    Prevents throwing an error when \`npm version\` is used to set the new
    version to the same value as the current version.
  `,
			flatten
		}),
		"allow-directory": new Definition("allow-directory", {
			default: "all",
			type: [
				"all",
				"none",
				"root"
			],
			description: `
      Limits the ability for npm to install dependencies from directories.
      That is, dependencies that point to a directory instead of a version or semver range.
      Please note that this could leave your tree incomplete and some packages may not function as intended or designed.
      Changing this setting will not remove dependencies that are already installed.

      \`all\` allows any directories to be installed.
      \`none\` prevents any directories from being installed.
      \`root\` only allows directories defined in your project's package.json to be installed.  Also allows directory dependencies to be used for other commands like \`npm view\`
  `,
			flatten
		}),
		"allow-file": new Definition("allow-file", {
			default: "all",
			type: [
				"all",
				"none",
				"root"
			],
			description: `
      Limits the ability for npm to install dependencies from tarball files.
      That is, dependencies that point to a local tarball file instead of a version or semver range.
      Please note that this could leave your tree incomplete and some packages may not function as intended or designed.
      Changing this setting will not remove dependencies that are already installed.

      \`all\` allows any tarball file to be installed.
      \`none\` prevents any tarball file from being installed.
      \`root\` only allows tarball files defined in your project's package.json to be installed.  Also allows tarball file dependencies to be used for other commands like \`npm view\`
  `,
			flatten
		}),
		"allow-git": new Definition("allow-git", {
			default: "all",
			type: [
				"all",
				"none",
				"root"
			],
			description: `
      Limits the ability for npm to fetch dependencies from git references.
      That is, dependencies that point to a git repo instead of a version or semver range.
      Please note that this could leave your tree incomplete and some packages may not function as intended or designed.
      Changing this setting will not remove dependencies that are already installed.

      \`all\` allows any git dependencies to be fetched and installed.
      \`none\` prevents any git dependencies from being fetched and installed.
      \`root\` only allows git dependencies defined in your project's package.json to be fetched and installed.  Also allows git dependencies to be fetched for other commands like \`npm view\`
  `,
			flatten
		}),
		"allow-remote": new Definition("allow-remote", {
			default: "all",
			type: [
				"all",
				"none",
				"root"
			],
			description: `
      Limits the ability for npm to fetch dependencies from urls.
      That is, dependencies that point to a tarball url instead of a version or semver range.
      Please note that this could leave your tree incomplete and some packages may not function as intended or designed.
      Changing this setting will not remove dependencies that are already installed.

      \`all\` allows any url to be installed.
      \`none\` prevents any url from being installed.
      \`root\` only allows urls defined in your project's package.json to be installed.  Also allows url dependencies to be used for other commands like \`npm view\`
  `,
			flatten
		}),
		"allow-scripts": new Definition("allow-scripts", {
			default: "",
			type: [String, Array],
			hint: "<package-list>",
			envExport: false,
			description: `
      Comma-separated list of packages whose install-time lifecycle scripts
      (\`preinstall\`, \`install\`, \`postinstall\`, and \`prepare\` for
      non-registry dependencies) are allowed to run.

      This setting is intended for one-off and global contexts: \`npm exec\`,
      \`npx\`, and \`npm install -g\`, where no project \`package.json\` is
      involved. For team-wide policy in a project, use the \`allowScripts\`
      field in \`package.json\` (which also supports explicit denials), or
      configure it in \`.npmrc\`. Passing \`--allow-scripts\` on the command
      line during a project-scoped \`npm install\`, \`ci\`, \`update\`, or
      \`rebuild\` is an error.

      Each name is matched against a dependency's resolved identity, not
      against the package's self-reported name. \`--ignore-scripts\` and
      \`--dangerously-allow-all-scripts\` both override this setting.
  `,
			flatten(key, obj, flatOptions) {
				flatOptions.allowScripts = parseAllowScriptsList(obj[key]);
			}
		}),
		also: new Definition("also", {
			default: null,
			type: [
				null,
				"dev",
				"development"
			],
			description: `
      When set to \`dev\` or \`development\`, this is an alias for
      \`--include=dev\`.
    `,
			deprecated: "Please use --include=dev instead.",
			flatten(key, obj, flatOptions) {
				definitions.omit.flatten("omit", obj, flatOptions);
			}
		}),
		audit: new Definition("audit", {
			default: true,
			type: Boolean,
			description: `
      When "true" submit audit reports alongside the current npm command to the
      default registry and all registries configured for scopes.  See the
      documentation for [\`npm audit\`](/commands/npm-audit) for details on what
      is submitted.
    `,
			flatten
		}),
		"audit-level": new Definition("audit-level", {
			default: null,
			type: [
				null,
				"info",
				"low",
				"moderate",
				"high",
				"critical",
				"none"
			],
			description: `
    The minimum level of vulnerability for \`npm audit\` to exit with
    a non-zero exit code.
    `,
			flatten
		}),
		"auth-type": new Definition("auth-type", {
			default: "web",
			type: ["legacy", "web"],
			description: `
      What authentication strategy to use with \`login\`.
      Note that if an \`otp\` config is given, this value will always be set to \`legacy\`.
    `,
			flatten
		}),
		before: new Definition("before", {
			default: null,
			hint: "<date>",
			type: [null, Date],
			description: `
      If passed to \`npm install\`, will rebuild the npm tree such that only
      versions that were available **on or before** the given date are
      installed.  If there are no versions available for the current set of
      dependencies, the command will error.

      If the requested version is a \`dist-tag\` and the given tag does not
      pass the \`--before\` filter, the most recent version less than or equal
      to that tag will be used. For example, \`foo@latest\` might install
      \`foo@1.2\` even though \`latest\` is \`2.0\`.

      If \`before\` and \`min-release-age\` are both set in the same source,
      \`before\` wins (an explicit absolute date overrides a relative window).
      Across sources, the standard precedence applies (cli > env > project >
      user > global), so a higher-priority source can always relax or
      override a lower-priority one.

      As with \`min-release-age\`, when this cutoff blocks a fix that
      \`npm audit fix\` would install, npm keeps the vulnerable version, warns,
      and exits with a non-zero code.

      Packages whose names match \`min-release-age-exclude\` are exempt from
      this filter.
    `,
			flatten
		}),
		"bin-links": new Definition("bin-links", {
			default: true,
			type: Boolean,
			description: `
      Tells npm to create symlinks (or \`.cmd\` shims on Windows) for package
      executables.

      Set to false to have it not do this.  This can be used to work around the
      fact that some file systems don't support symlinks, even on ostensibly
      Unix systems.
    `,
			flatten
		}),
		browser: new Definition("browser", {
			default: null,
			defaultDescription: `
    macOS: \`"open"\`, Windows: \`"start"\`, Others: \`"xdg-open"\`
    `,
			type: [
				null,
				Boolean,
				String
			],
			description: `
    The browser that is called by npm commands to open websites.

    Set to \`false\` to suppress browser behavior and instead print urls to
    terminal.

    Set to \`true\` to use default system URL opener.
    `,
			flatten
		}),
		"bypass-2fa": new Definition("bypass-2fa", {
			default: false,
			type: Boolean,
			description: `
      When creating a Granular Access Token with \`npm token create\`,
      setting this to true will allow the token to bypass two-factor
      authentication. This is useful for automation and CI/CD workflows.
    `,
			flatten
		}),
		ca: new Definition("ca", {
			default: null,
			type: [
				null,
				String,
				Array
			],
			description: `
    The Certificate Authority signing certificate that is trusted for SSL
    connections to the registry. Values should be in PEM format (Windows
      calls it "Base-64 encoded X.509 (.CER)") with newlines replaced by the
    string "\\n". For example:

    \`\`\`ini
    ca="-----BEGIN CERTIFICATE-----\\nXXXX\\nXXXX\\n-----END CERTIFICATE-----"
    \`\`\`

    Set to \`null\` to only allow "known" registrars, or to a specific CA
    cert to trust only that specific signing authority.

    Multiple CAs can be trusted by specifying an array of certificates:

    \`\`\`ini
    ca[]="..."
    ca[]="..."
    \`\`\`

    See also the \`strict-ssl\` config.
  `,
			flatten
		}),
		cache: new Definition("cache", {
			default: cache,
			defaultDescription: `
      Windows: \`%LocalAppData%\\npm-cache\`, Posix: \`~/.npm\`
    `,
			type: path,
			description: `
      The location of npm's cache directory.
    `,
			flatten(key, obj, flatOptions) {
				flatOptions.cache = join$3(obj.cache, "_cacache");
				flatOptions.npxCache = join$3(obj.cache, "_npx");
				flatOptions.tufCache = join$3(obj.cache, "_tuf");
			}
		}),
		"cache-max": new Definition("cache-max", {
			default: Infinity,
			type: Number,
			description: `
      \`--cache-max=0\` is an alias for \`--prefer-online\`
    `,
			deprecated: `
      This option has been deprecated in favor of \`--prefer-online\`
    `,
			flatten(key, obj, flatOptions) {
				if (obj[key] <= 0) flatOptions.preferOnline = true;
			}
		}),
		"cache-min": new Definition("cache-min", {
			default: 0,
			type: Number,
			description: `
      \`--cache-min=9999 (or bigger)\` is an alias for \`--prefer-offline\`.
    `,
			deprecated: `
      This option has been deprecated in favor of \`--prefer-offline\`.
    `,
			flatten(key, obj, flatOptions) {
				if (obj[key] >= 9999) flatOptions.preferOffline = true;
			}
		}),
		cafile: new Definition("cafile", {
			default: null,
			type: path,
			description: `
      A path to a file containing one or multiple Certificate Authority signing
      certificates. Similar to the \`ca\` setting, but allows for multiple
      CA's, as well as for the CA information to be stored in a file on disk.
    `,
			flatten(key, obj, flatOptions) {
				if (!obj.cafile) return;
				const raw = maybeReadFile(obj.cafile);
				if (!raw) return;
				const delim = "-----END CERTIFICATE-----";
				flatOptions.ca = raw.replace(/\r\n/g, "\n").split(delim).filter((section) => section.trim()).map((section) => section.trimLeft() + delim);
			}
		}),
		call: new Definition("call", {
			default: "",
			type: String,
			short: "c",
			description: `
      Optional companion option for \`npm exec\`, \`npx\` that allows for
      specifying a custom command to be run along with the installed packages.

      \`\`\`bash
      npm exec --package yo --package generator-node --call "yo node"
      \`\`\`
    `,
			flatten
		}),
		cert: new Definition("cert", {
			default: null,
			type: [null, String],
			description: `
      A client certificate to pass when accessing the registry.  Values should
      be in PEM format (Windows calls it "Base-64 encoded X.509 (.CER)") with
      newlines replaced by the string "\\n". For example:

      \`\`\`ini
      cert="-----BEGIN CERTIFICATE-----\\nXXXX\\nXXXX\\n-----END CERTIFICATE-----"
      \`\`\`

      It is _not_ the path to a certificate file, though you can set a registry-scoped
      "certfile" path like "//other-registry.tld/:certfile=/path/to/cert.pem".
    `,
			deprecated: `
      \`key\` and \`cert\` are no longer used for most registry operations.
      Use registry scoped \`keyfile\` and \`certfile\` instead.
      Example:
      //other-registry.tld/:keyfile=/path/to/key.pem
      //other-registry.tld/:certfile=/path/to/cert.crt
    `,
			flatten
		}),
		cidr: new Definition("cidr", {
			default: null,
			type: [
				null,
				String,
				Array
			],
			description: `
      This is a list of CIDR address to be used when configuring limited access
      tokens with the \`npm token create\` command.
    `,
			flatten
		}),
		color: new Definition("color", {
			default: !process.env.NO_COLOR || process.env.NO_COLOR === "0",
			usage: "--color|--no-color|--color always",
			defaultDescription: `
      true unless the NO_COLOR environ is set to something other than '0'
    `,
			type: ["always", Boolean],
			description: `
      If false, never shows colors.  If \`"always"\` then always shows colors.
      If true, then only prints color codes for tty file descriptors.
    `,
			flatten(key, obj, flatOptions) {
				flatOptions.color = !obj.color ? false : obj.color === "always" ? true : !!process.stdout.isTTY;
				flatOptions.logColor = !obj.color ? false : obj.color === "always" ? true : !!process.stderr.isTTY;
			}
		}),
		"commit-hooks": new Definition("commit-hooks", {
			default: true,
			type: Boolean,
			description: `
      Run git commit hooks when using the \`npm version\` command.
    `,
			flatten
		}),
		cpu: new Definition("cpu", {
			default: null,
			type: [null, String],
			description: `
      Override CPU architecture of native modules to install.
      Acceptable values are same as \`cpu\` field of package.json,
      which comes from \`process.arch\`.
    `,
			flatten
		}),
		"dangerously-allow-all-scripts": new Definition("dangerously-allow-all-scripts", {
			default: false,
			type: Boolean,
			description: `
      If \`true\`, bypass the \`allowScripts\` policy entirely and run every
      dependency install script regardless of whether it was approved or
      denied. Intended as a migration escape hatch only; its use is strongly
      discouraged. \`--ignore-scripts\` still takes precedence over this
      setting.
    `,
			flatten
		}),
		depth: new Definition("depth", {
			default: null,
			defaultDescription: `
      \`Infinity\` if \`--all\` is set; otherwise, \`0\`
    `,
			type: [null, Number],
			description: `
      The depth to go when recursing packages for \`npm ls\`.

      If not set, \`npm ls\` will show only the immediate dependencies of the
      root project.  If \`--all\` is set, then npm will show all dependencies
      by default.
    `,
			flatten
		}),
		description: new Definition("description", {
			default: true,
			type: Boolean,
			usage: "--no-description",
			description: `
      Show the description in \`npm search\`
    `,
			flatten(key, obj, flatOptions) {
				flatOptions.search = flatOptions.search || { limit: 20 };
				flatOptions.search[key] = obj[key];
			}
		}),
		dev: new Definition("dev", {
			default: false,
			type: Boolean,
			description: `
      Alias for \`--include=dev\`.
    `,
			deprecated: "Please use --include=dev instead.",
			flatten(key, obj, flatOptions) {
				definitions.omit.flatten("omit", obj, flatOptions);
			}
		}),
		diff: new Definition("diff", {
			default: [],
			hint: "<package-spec>",
			type: [String, Array],
			description: `
      Define arguments to compare in \`npm diff\`.
    `,
			flatten
		}),
		"diff-ignore-all-space": new Definition("diff-ignore-all-space", {
			default: false,
			type: Boolean,
			description: `
      Ignore whitespace when comparing lines in \`npm diff\`.
    `,
			flatten
		}),
		"diff-name-only": new Definition("diff-name-only", {
			default: false,
			type: Boolean,
			description: `
      Prints only filenames when using \`npm diff\`.
    `,
			flatten
		}),
		"diff-no-prefix": new Definition("diff-no-prefix", {
			default: false,
			type: Boolean,
			description: `
      Do not show any source or destination prefix in \`npm diff\` output.

      Note: this causes \`npm diff\` to ignore the \`--diff-src-prefix\` and
      \`--diff-dst-prefix\` configs.
    `,
			flatten
		}),
		"diff-dst-prefix": new Definition("diff-dst-prefix", {
			default: "b/",
			hint: "<path>",
			type: String,
			description: `
      Destination prefix to be used in \`npm diff\` output.
    `,
			flatten
		}),
		"diff-src-prefix": new Definition("diff-src-prefix", {
			default: "a/",
			hint: "<path>",
			type: String,
			description: `
      Source prefix to be used in \`npm diff\` output.
    `,
			flatten
		}),
		"diff-text": new Definition("diff-text", {
			default: false,
			type: Boolean,
			description: `
      Treat all files as text in \`npm diff\`.
    `,
			flatten
		}),
		"diff-unified": new Definition("diff-unified", {
			default: 3,
			type: Number,
			description: `
      The number of lines of context to print in \`npm diff\`.
    `,
			flatten
		}),
		"dry-run": new Definition("dry-run", {
			default: false,
			type: Boolean,
			description: `
      Indicates that you don't want npm to make any changes and that it should
      only report what it would have done.  This can be passed into any of the
      commands that modify your local installation, eg, \`install\`,
      \`update\`, \`dedupe\`, \`uninstall\`, as well as \`pack\` and
      \`publish\`.

      Note: This is NOT honored by other network related commands, eg
      \`dist-tags\`, \`owner\`, etc.
    `,
			flatten
		}),
		editor: new Definition("editor", {
			default: editor,
			defaultDescription: `
      The EDITOR or VISUAL environment variables, or '%SYSTEMROOT%\\notepad.exe' on Windows,
      or 'vi' on Unix systems
    `,
			type: String,
			description: `
      The command to run for \`npm edit\` and \`npm config edit\`.
    `,
			flatten
		}),
		"engine-strict": new Definition("engine-strict", {
			default: false,
			type: Boolean,
			description: `
      If set to true, then npm will stubbornly refuse to install (or even
      consider installing) any package that claims to not be compatible with
      the current Node.js version.

      This can be overridden by setting the \`--force\` flag.
    `,
			flatten
		}),
		"expect-result-count": new Definition("expect-result-count", {
			default: null,
			type: [null, Number],
			hint: "<count>",
			exclusive: ["expect-results"],
			description: `
      Tells to expect a specific number of results from the command.
    `
		}),
		"expect-results": new Definition("expect-results", {
			default: null,
			type: [null, Boolean],
			exclusive: ["expect-result-count"],
			description: `
      Tells npm whether or not to expect results from the command.
      Can be either true (expect some results) or false (expect no results).
    `
		}),
		expires: new Definition("expires", {
			default: null,
			type: [null, Number],
			description: `
      When creating a Granular Access Token with \`npm token create\`,
      this sets the expiration in days. If not specified, the server
      will determine the default expiration.
    `,
			flatten
		}),
		"fetch-retries": new Definition("fetch-retries", {
			default: 2,
			type: Number,
			description: `
      The "retries" config for the \`retry\` module to use when fetching
      packages from the registry.

      npm will retry idempotent read requests to the registry in the case
      of network failures or 5xx HTTP errors.
    `,
			flatten(key, obj, flatOptions) {
				flatOptions.retry = flatOptions.retry || {};
				flatOptions.retry.retries = obj[key];
			}
		}),
		"fetch-retry-factor": new Definition("fetch-retry-factor", {
			default: 10,
			type: Number,
			description: `
      The "factor" config for the \`retry\` module to use when fetching
      packages.
    `,
			flatten(key, obj, flatOptions) {
				flatOptions.retry = flatOptions.retry || {};
				flatOptions.retry.factor = obj[key];
			}
		}),
		"fetch-retry-maxtimeout": new Definition("fetch-retry-maxtimeout", {
			default: 6e4,
			defaultDescription: "60000 (1 minute)",
			type: Number,
			description: `
      The "maxTimeout" config for the \`retry\` module to use when fetching
      packages.
    `,
			flatten(key, obj, flatOptions) {
				flatOptions.retry = flatOptions.retry || {};
				flatOptions.retry.maxTimeout = obj[key];
			}
		}),
		"fetch-retry-mintimeout": new Definition("fetch-retry-mintimeout", {
			default: 1e4,
			defaultDescription: "10000 (10 seconds)",
			type: Number,
			description: `
      The "minTimeout" config for the \`retry\` module to use when fetching
      packages.
    `,
			flatten(key, obj, flatOptions) {
				flatOptions.retry = flatOptions.retry || {};
				flatOptions.retry.minTimeout = obj[key];
			}
		}),
		"fetch-timeout": new Definition("fetch-timeout", {
			default: 3e5,
			defaultDescription: `300000 (5 minutes)`,
			type: Number,
			description: `
      The maximum amount of time to wait for HTTP requests to complete.
    `,
			flatten(key, obj, flatOptions) {
				flatOptions.timeout = obj[key];
			}
		}),
		force: new Definition("force", {
			default: false,
			type: Boolean,
			short: "f",
			description: `
      Removes various protections against unfortunate side effects, common
      mistakes, unnecessary performance degradation, and malicious input.

      * Allow clobbering non-npm files in global installs.
      * Allow the \`npm version\` command to work on an unclean git repository.
      * Allow deleting the cache folder with \`npm cache clean\`.
      * Allow installing packages that have an \`engines\` declaration
        requiring a different version of npm.
      * Allow installing packages that have an \`engines\` declaration
        requiring a different version of \`node\`, even if \`--engine-strict\`
        is enabled.
      * Allow \`npm audit fix\` to install modules outside your stated
        dependency range (including SemVer-major changes).
      * Allow unpublishing all versions of a published package.
      * Allow conflicting peerDependencies to be installed in the root project.
      * Implicitly set \`--yes\` during \`npm init\`.
      * Allow clobbering existing values in \`npm pkg\`
      * Allow unpublishing of entire packages (not just a single version).

      If you don't have a clear idea of what you want to do, it is strongly
      recommended that you do not use this option!
    `,
			flatten
		}),
		"foreground-scripts": new Definition("foreground-scripts", {
			default: false,
			defaultDescription: `\`false\` unless when using \`npm pack\` or \`npm publish\` where it
    defaults to \`true\``,
			type: Boolean,
			description: `
      Run all build scripts (ie, \`preinstall\`, \`install\`, and
      \`postinstall\`) scripts for installed packages in the foreground
      process, sharing standard input, output, and error with the main npm
      process.

      Note that this will generally make installs run slower, and be much
      noisier, but can be useful for debugging.
    `,
			flatten
		}),
		"format-package-lock": new Definition("format-package-lock", {
			default: true,
			type: Boolean,
			description: `
      Format \`package-lock.json\` or \`npm-shrinkwrap.json\` as a human
      readable file.
    `,
			flatten
		}),
		fund: new Definition("fund", {
			default: true,
			type: Boolean,
			description: `
      When "true" displays the message at the end of each \`npm install\`
      acknowledging the number of dependencies looking for funding.
      See [\`npm fund\`](/commands/npm-fund) for details.
    `,
			flatten
		}),
		git: new Definition("git", {
			default: "git",
			type: String,
			description: `
      The command to use for git commands.  If git is installed on the
      computer, but is not in the \`PATH\`, then set this to the full path to
      the git binary.
    `,
			flatten
		}),
		"git-tag-version": new Definition("git-tag-version", {
			default: true,
			type: Boolean,
			description: `
      Tag the commit when using the \`npm version\` command.  Setting this to
      false results in no commit being made at all.
    `,
			flatten
		}),
		global: new Definition("global", {
			default: false,
			type: Boolean,
			short: "g",
			description: `
      Operates in "global" mode, so that packages are installed into the
      \`prefix\` folder instead of the current working directory.  See
      [folders](/configuring-npm/folders) for more on the differences in
      behavior.

      * packages are installed into the \`{prefix}/lib/node_modules\` folder,
        instead of the current working directory.
      * bin files are linked to \`{prefix}/bin\`
      * man pages are linked to \`{prefix}/share/man\`
    `,
			flatten: (key, obj, flatOptions) => {
				flatten(key, obj, flatOptions);
				if (flatOptions.global) flatOptions.location = "global";
			}
		}),
		globalconfig: new Definition("globalconfig", {
			type: path,
			default: "",
			defaultDescription: `
      The global --prefix setting plus 'etc/npmrc'. For example,
      '/usr/local/etc/npmrc'
    `,
			description: `
      The config file to read for global config options.
    `,
			flatten
		}),
		"global-style": new Definition("global-style", {
			default: false,
			type: Boolean,
			description: `
      Only install direct dependencies in the top level \`node_modules\`,
      but hoist on deeper dependencies.
      Sets \`--install-strategy=shallow\`.
    `,
			deprecated: `
      This option has been deprecated in favor of \`--install-strategy=shallow\`
    `,
			flatten(key, obj, flatOptions) {
				if (obj[key]) {
					obj["install-strategy"] = "shallow";
					flatOptions.installStrategy = "shallow";
				}
			}
		}),
		heading: new Definition("heading", {
			default: "npm",
			type: String,
			description: `
      The string that starts all the debugging log output.
    `,
			flatten
		}),
		"https-proxy": new Definition("https-proxy", {
			default: null,
			type: [null, url],
			description: `
      A proxy to use for outgoing https requests. If the \`HTTPS_PROXY\` or
      \`https_proxy\` or \`HTTP_PROXY\` or \`http_proxy\` environment variables
      are set, proxy settings will be honored by the underlying
      \`make-fetch-happen\` library.
    `,
			flatten
		}),
		"if-present": new Definition("if-present", {
			default: false,
			type: Boolean,
			envExport: false,
			description: `
      If true, npm will not exit with an error code when \`run\` is
      invoked for a script that isn't defined in the \`scripts\` section of
      \`package.json\`. This option can be used when it's desirable to
      optionally run a script when it's present and fail if the script fails.
      This is useful, for example, when running scripts that may only apply for
      some builds in an otherwise generic CI setup.
    `,
			flatten
		}),
		"ignore-scripts": new Definition("ignore-scripts", {
			default: false,
			type: Boolean,
			description: `
      If true, npm does not run scripts specified in package.json files.

      Note that commands explicitly intended to run a particular script, such
      as \`npm start\`, \`npm stop\`, \`npm restart\`, \`npm test\`, and \`npm
      run\` will still run their intended script if \`ignore-scripts\` is
      set, but they will *not* run any pre- or post-scripts.
    `,
			flatten
		}),
		include: new Definition("include", {
			default: [],
			type: [
				Array,
				"prod",
				"dev",
				"optional",
				"peer"
			],
			description: `
      Option that allows for defining which types of dependencies to install.

      This is the inverse of \`--omit=<type>\`.

      Dependency types specified in \`--include\` will not be omitted,
      regardless of the order in which omit/include are specified on the
      command-line.
    `,
			flatten(key, obj, flatOptions) {
				definitions.omit.flatten("omit", obj, flatOptions);
			}
		}),
		"include-staged": new Definition("include-staged", {
			default: false,
			type: Boolean,
			description: `
      Allow installing "staged" published packages, as defined by [npm RFC PR
      #92](https://github.com/npm/rfcs/pull/92).

      This is experimental, and not implemented by the npm public registry.
    `,
			flatten
		}),
		"include-workspace-root": new Definition("include-workspace-root", {
			default: false,
			type: Boolean,
			envExport: false,
			description: `
      Include the workspace root when workspaces are enabled for a command.

      When false, specifying individual workspaces via the \`workspace\` config,
      or all workspaces via the \`workspaces\` flag, will cause npm to operate only
      on the specified workspaces, and not on the root project.
    `,
			flatten
		}),
		"include-attestations": new Definition("include-attestations", {
			default: false,
			type: Boolean,
			description: `
      When used with \`npm audit signatures --json\`, includes the full
      sigstore attestation bundles in the JSON output for each verified
      package. The bundles contain DSSE envelopes, verification material,
      and transparency log entries.
    `,
			flatten
		}),
		"init-author-email": new Definition("init-author-email", {
			default: "",
			hint: "<email>",
			type: String,
			description: `
      The value \`npm init\` should use by default for the package author's
      email.
    `
		}),
		"init-author-name": new Definition("init-author-name", {
			default: "",
			hint: "<name>",
			type: String,
			description: `
      The value \`npm init\` should use by default for the package author's name.
    `
		}),
		"init-author-url": new Definition("init-author-url", {
			default: "",
			type: ["", url],
			hint: "<url>",
			description: `
      The value \`npm init\` should use by default for the package author's homepage.
    `
		}),
		"init-license": new Definition("init-license", {
			default: "ISC",
			hint: "<license>",
			type: String,
			description: `
      The value \`npm init\` should use by default for the package license.
    `
		}),
		"init-module": new Definition("init-module", {
			default: "~/.npm-init.js",
			type: path,
			hint: "<module>",
			description: `
      A module that will be loaded by the \`npm init\` command.  See the
      documentation for the
      [init-package-json](https://github.com/npm/init-package-json) module for
      more information, or [npm init](/commands/npm-init).
    `
		}),
		"init-type": new Definition("init-type", {
			default: "commonjs",
			type: String,
			hint: "<type>",
			description: `
      The value that \`npm init\` should use by default for the package.json type field.
    `
		}),
		"init-version": new Definition("init-version", {
			default: "1.0.0",
			type: Semver,
			hint: "<version>",
			description: `
      The value that \`npm init\` should use by default for the package
      version number, if not already set in package.json.
    `
		}),
		"init-private": new Definition("init-private", {
			default: false,
			type: Boolean,
			description: `
      The value \`npm init\` should use by default for the package's private flag.
    `,
			flatten
		}),
		"init.author.email": new Definition("init.author.email", {
			default: "",
			type: String,
			deprecated: `
      Use \`--init-author-email\` instead.`,
			description: `
      Alias for \`--init-author-email\`
    `
		}),
		"init.author.name": new Definition("init.author.name", {
			default: "",
			type: String,
			deprecated: `
      Use \`--init-author-name\` instead.
    `,
			description: `
      Alias for \`--init-author-name\`
    `
		}),
		"init.author.url": new Definition("init.author.url", {
			default: "",
			type: ["", url],
			deprecated: `
      Use \`--init-author-url\` instead.
    `,
			description: `
      Alias for \`--init-author-url\`
    `
		}),
		"init.license": new Definition("init.license", {
			default: "ISC",
			type: String,
			deprecated: `
      Use \`--init-license\` instead.
    `,
			description: `
      Alias for \`--init-license\`
    `
		}),
		"init.module": new Definition("init.module", {
			default: "~/.npm-init.js",
			type: path,
			deprecated: `
      Use \`--init-module\` instead.
    `,
			description: `
      Alias for \`--init-module\`
    `
		}),
		"init.version": new Definition("init.version", {
			default: "1.0.0",
			type: Semver,
			deprecated: `
      Use \`--init-version\` instead.
    `,
			description: `
      Alias for \`--init-version\`
    `
		}),
		"install-links": new Definition("install-links", {
			default: false,
			type: Boolean,
			description: `
      When set file: protocol dependencies will be packed and installed as
      regular dependencies instead of creating a symlink. This option has
      no effect on workspaces.
    `,
			flatten
		}),
		"install-strategy": new Definition("install-strategy", {
			default: "hoisted",
			type: [
				"hoisted",
				"nested",
				"shallow",
				"linked"
			],
			description: `
      Sets the strategy for installing packages in node_modules.
      hoisted (default): Install non-duplicated in top-level, and duplicated as
        necessary within directory structure.
      nested: (formerly --legacy-bundling) install in place, no hoisting.
      shallow (formerly --global-style) only install direct deps at top-level.
      linked: install in node_modules/.store, link in place, unhoisted.

      We recommend that package authors use \`--install-strategy=linked\`
      during development to catch undeclared ("phantom") dependencies before
      publishing: the isolated layout only exposes a package's declared
      dependencies, so an \`import\` of a package that was never added to
      \`package.json\` can fail instead of resolving by accident and shipping
      broken. See [Catching undeclared ("phantom")
      dependencies](/using-npm/developers#catching-undeclared-phantom-dependencies).
    `,
			flatten
		}),
		json: new Definition("json", {
			default: false,
			type: Boolean,
			description: `
      Whether or not to output JSON data, rather than the normal output.

      * In \`npm pkg set\` it enables parsing set values with JSON.parse()
      before saving them to your \`package.json\`.

      Not supported by all npm commands.
    `,
			flatten
		}),
		key: new Definition("key", {
			default: null,
			type: [null, String],
			description: `
      A client key to pass when accessing the registry.  Values should be in
      PEM format with newlines replaced by the string "\\n". For example:

      \`\`\`ini
      key="-----BEGIN PRIVATE KEY-----\\nXXXX\\nXXXX\\n-----END PRIVATE KEY-----"
      \`\`\`

      It is _not_ the path to a key file, though you can set a registry-scoped
      "keyfile" path like "//other-registry.tld/:keyfile=/path/to/key.pem".
    `,
			deprecated: `
      \`key\` and \`cert\` are no longer used for most registry operations.
      Use registry scoped \`keyfile\` and \`certfile\` instead.
      Example:
      //other-registry.tld/:keyfile=/path/to/key.pem
      //other-registry.tld/:certfile=/path/to/cert.crt
    `,
			flatten
		}),
		"legacy-bundling": new Definition("legacy-bundling", {
			default: false,
			type: Boolean,
			description: `
      Instead of hoisting package installs in \`node_modules\`, install packages
      in the same manner that they are depended on. This may cause very deep
      directory structures and duplicate package installs as there is no
      de-duplicating.
      Sets \`--install-strategy=nested\`.
    `,
			deprecated: `
      This option has been deprecated in favor of \`--install-strategy=nested\`
    `,
			flatten(key, obj, flatOptions) {
				if (obj[key]) {
					obj["install-strategy"] = "nested";
					flatOptions.installStrategy = "nested";
				}
			}
		}),
		"legacy-peer-deps": new Definition("legacy-peer-deps", {
			default: false,
			type: Boolean,
			description: `
      Causes npm to completely ignore \`peerDependencies\` when building a
      package tree, as in npm versions 3 through 6.

      If a package cannot be installed because of overly strict
      \`peerDependencies\` that collide, it provides a way to move forward
      resolving the situation.

      This differs from \`--omit=peer\`, in that \`--omit=peer\` will avoid
      unpacking \`peerDependencies\` on disk, but will still design a tree such
      that \`peerDependencies\` _could_ be unpacked in a correct place.

      Use of \`legacy-peer-deps\` is not recommended, as it will not enforce
      the \`peerDependencies\` contract that meta-dependencies may rely on.
    `,
			flatten
		}),
		libc: new Definition("libc", {
			default: null,
			type: [null, String],
			description: `
      Override libc of native modules to install.
      Acceptable values are same as \`libc\` field of package.json
    `,
			flatten
		}),
		link: new Definition("link", {
			default: false,
			type: Boolean,
			description: `
      Used with \`npm ls\`, limiting output to only those packages that are
      linked.
    `
		}),
		"local-address": new Definition("local-address", {
			default: null,
			type: getLocalAddresses(),
			typeDescription: "IP Address",
			description: `
      The IP address of the local interface to use when making connections to
      the npm registry.  Must be IPv4 in versions of Node prior to 0.12.
    `,
			flatten
		}),
		location: new Definition("location", {
			default: "user",
			short: "L",
			type: [
				"global",
				"user",
				"project"
			],
			defaultDescription: `
      "user" unless \`--global\` is passed, which will also set this value to "global"
    `,
			description: `
      When passed to \`npm config\` this refers to which config file to use.

      When set to "global" mode, packages are installed into the \`prefix\` folder
      instead of the current working directory. See
      [folders](/configuring-npm/folders) for more on the differences in behavior.

      * packages are installed into the \`{prefix}/lib/node_modules\` folder,
        instead of the current working directory.
      * bin files are linked to \`{prefix}/bin\`
      * man pages are linked to \`{prefix}/share/man\`
    `,
			flatten: (key, obj, flatOptions) => {
				flatten(key, obj, flatOptions);
				if (flatOptions.global) flatOptions.location = "global";
				if (obj.location === "global") flatOptions.global = true;
			}
		}),
		"lockfile-version": new Definition("lockfile-version", {
			default: null,
			type: [
				null,
				1,
				2,
				3,
				"1",
				"2",
				"3"
			],
			defaultDescription: `
      Version 3 if no lockfile, auto-converting v1 lockfiles to v3; otherwise,
      maintain current lockfile version.`,
			description: `
      Set the lockfile format version to be used in package-lock.json and
      npm-shrinkwrap-json files.  Possible options are:

      1: The lockfile version used by npm versions 5 and 6.  Lacks some data that
      is used during the install, resulting in slower and possibly less
      deterministic installs.  Prevents lockfile churn when interoperating with
      older npm versions.

      2: The default lockfile version used by npm version 7 and 8.  Includes both
      the version 1 lockfile data and version 3 lockfile data, for maximum
      determinism and interoperability, at the expense of more bytes on disk.

      3: Only the new lockfile information introduced in npm version 7.  Smaller
      on disk than lockfile version 2, but not interoperable with older npm
      versions.  Ideal if all users are on npm version 7 and higher.
    `,
			flatten: (key, obj, flatOptions) => {
				flatOptions.lockfileVersion = obj[key] && parseInt(obj[key], 10);
			}
		}),
		loglevel: new Definition("loglevel", {
			default: "notice",
			type: [
				"silent",
				"error",
				"warn",
				"notice",
				"http",
				"info",
				"verbose",
				"silly"
			],
			description: `
      What level of logs to report.  All logs are written to a debug log,
      with the path to that file printed if the execution of a command fails.

      Any logs of a higher level than the setting are shown. The default is
      "notice".

      See also the \`foreground-scripts\` config.
    `,
			flatten(key, obj, flatOptions) {
				flatOptions.silent = obj[key] === "silent";
			}
		}),
		"logs-dir": new Definition("logs-dir", {
			default: null,
			type: [null, path],
			defaultDescription: `
      A directory named \`_logs\` inside the cache
  `,
			description: `
      The location of npm's log directory.  See [\`npm
      logging\`](/using-npm/logging) for more information.
    `
		}),
		"logs-max": new Definition("logs-max", {
			default: 10,
			type: Number,
			description: `
      The maximum number of log files to store.

      If set to 0, no log files will be written for the current run.
    `
		}),
		long: new Definition("long", {
			default: false,
			type: Boolean,
			short: "l",
			description: `
      Show extended information in \`ls\`, \`search\`, and \`help-search\`.
    `
		}),
		name: new Definition("name", {
			default: null,
			type: [null, String],
			hint: "<name>",
			description: `
      When creating a Granular Access Token with \`npm token create\`,
      this sets the name/description for the token.
    `,
			flatten
		}),
		maxsockets: new Definition("maxsockets", {
			default: 15,
			type: Number,
			description: `
      The maximum number of connections to use per origin (protocol/host/port
      combination).
    `,
			flatten(key, obj, flatOptions) {
				flatOptions.maxSockets = obj[key];
			}
		}),
		message: new Definition("message", {
			default: "%s",
			type: String,
			short: "m",
			description: `
      Commit message which is used by \`npm version\` when creating version commit.

      Any "%s" in the message will be replaced with the version number.
    `,
			flatten
		}),
		"min-release-age": new Definition("min-release-age", {
			default: null,
			hint: "<days>",
			type: [null, Number],
			envExport: false,
			description: `
       If set, npm will build the npm tree such that only versions that were
       available more than the given number of days ago will be installed.  If
       there are no versions available for the current set of dependencies, the
       command will error.

       This flag is a complement to \`before\`, which accepts an exact date
       instead of a relative number of days. The two may coexist (e.g.
       \`min-release-age\` in your \`.npmrc\` is preserved when npm internally
       spawns a sub-process with \`--before\` while preparing a \`git:\` or
       \`github:\` dependency); when both apply, \`before\` wins within a
       single source and across sources the standard precedence rules apply.

       When this window stops \`npm audit fix\` from installing a patched
       version (because the fix was published too recently), npm keeps the
       package at its vulnerable version, warns that the fix was blocked, and
       exits with a non-zero code. To install the fix, add the package to
       \`min-release-age-exclude\`, or relax \`min-release-age\` or \`before\`.

       Packages whose names match \`min-release-age-exclude\` are exempt from
       this filter.
    `,
			flatten: (key, obj, flatOptions) => {
				const age = obj["min-release-age"];
				if (age != null && !Object.hasOwn(obj, "before")) flatOptions.before = age ? /* @__PURE__ */ new Date(Date.now() - 864e5 * age) : null;
			}
		}),
		"min-release-age-exclude": new Definition("min-release-age-exclude", {
			default: [],
			hint: "<pkg|glob>",
			type: [Array, String],
			envExport: false,
			description: `
       A list of package names or \`minimatch\` glob patterns that are exempt
       from the \`min-release-age\` (and \`before\`) filter. A matching package
       can always resolve to its newest version, even when a release-age window
       is set.

       For example, to apply a release-age window to third-party dependencies
       while letting internally maintained packages update immediately:

       \`\`\`
       min-release-age=7
       min-release-age-exclude[]=@myorg/*
       min-release-age-exclude[]=my-internal-pkg
       \`\`\`

       Only the named package is exempt; its own dependencies still follow the
       release-age policy unless they also match a pattern. Patterns match
       against the package name, so \`@myorg/*\` matches \`@myorg/shared-utils\`.

       Excluding a package does not change which registry it is fetched from. You
       should own your private scope on the public registry so that nobody else
       can publish a package with the same name.
    `,
			flatten: (key, obj, flatOptions) => {
				const list = obj[key].flatMap((v) => String(v).split(",")).map((v) => v.trim()).filter(Boolean);
				flatOptions.minReleaseAgeExclude = [...new Set(list)];
			}
		}),
		"node-gyp": new Definition("node-gyp", {
			default: (() => {
				try {
					return require.resolve("node-gyp/bin/node-gyp.js");
				} catch {
					return "";
				}
			})(),
			defaultDescription: `
      The path to the node-gyp bin that ships with npm
    `,
			type: path,
			description: `
      This is the location of the "node-gyp" bin.  By default it uses one that ships with npm itself.

      You can use this config to specify your own "node-gyp" to run when it is required to build a package.
    `,
			flatten
		}),
		"node-options": new Definition("node-options", {
			default: null,
			type: [null, String],
			description: `
      Options to pass through to Node.js via the \`NODE_OPTIONS\` environment
      variable.  This does not impact how npm itself is executed but it does
      impact how lifecycle scripts are called.
    `
		}),
		noproxy: new Definition("noproxy", {
			default: "",
			defaultDescription: `
      The value of the NO_PROXY environment variable
    `,
			type: [String, Array],
			description: `
      Domain extensions that should bypass any proxies.

      Also accepts a comma-delimited string.
    `,
			flatten(key, obj, flatOptions) {
				if (Array.isArray(obj[key])) flatOptions.noProxy = obj[key].join(",");
				else flatOptions.noProxy = obj[key];
			}
		}),
		offline: new Definition("offline", {
			default: false,
			type: Boolean,
			description: `
      Force offline mode: no network requests will be done during install. To allow
      the CLI to fill in missing cache data, see \`--prefer-offline\`.
    `,
			flatten
		}),
		omit: new Definition("omit", {
			default: process.env.NODE_ENV === "production" ? ["dev"] : [],
			defaultDescription: `
      'dev' if the \`NODE_ENV\` environment variable is set to 'production';
      otherwise, empty.
    `,
			type: [
				Array,
				"dev",
				"optional",
				"peer"
			],
			description: `
      Dependency types to omit from the installation tree on disk.

      Note that these dependencies _are_ still resolved and added to the
      \`package-lock.json\` or \`npm-shrinkwrap.json\` file.  They are just
      not physically installed on disk.

      If a package type appears in both the \`--include\` and \`--omit\`
      lists, then it will be included.

      If the resulting omit list includes \`'dev'\`, then the \`NODE_ENV\`
      environment variable will be set to \`'production'\` for all lifecycle
      scripts.
    `,
			flatten(key, obj, flatOptions) {
				flatOptions.omit = buildOmitList(obj);
			}
		}),
		"omit-lockfile-registry-resolved": new Definition("omit-lockfile-registry-resolved", {
			default: false,
			type: Boolean,
			description: `
      This option causes npm to create lock files without a \`resolved\` key for
      registry dependencies. Subsequent installs will need to resolve tarball
      endpoints with the configured registry, likely resulting in a longer install
      time.
    `,
			flatten
		}),
		only: new Definition("only", {
			default: null,
			type: [
				null,
				"prod",
				"production"
			],
			deprecated: `
      Use \`--omit=dev\` to omit dev dependencies from the install.
    `,
			description: `
      When set to \`prod\` or \`production\`, this is an alias for
      \`--omit=dev\`.
    `,
			flatten(key, obj, flatOptions) {
				definitions.omit.flatten("omit", obj, flatOptions);
			}
		}),
		orgs: new Definition("orgs", {
			default: null,
			type: [
				null,
				String,
				Array
			],
			description: `
      When creating a Granular Access Token with \`npm token create\`,
      this limits the token access to specific organizations.
    `,
			flatten
		}),
		optional: new Definition("optional", {
			default: null,
			type: [null, Boolean],
			deprecated: `
      Use \`--omit=optional\` to exclude optional dependencies, or
      \`--include=optional\` to include them.

      Default value does install optional deps unless otherwise omitted.
    `,
			description: `
      Alias for --include=optional or --omit=optional
    `,
			flatten(key, obj, flatOptions) {
				definitions.omit.flatten("omit", obj, flatOptions);
			}
		}),
		os: new Definition("os", {
			default: null,
			type: [null, String],
			description: `
      Override OS of native modules to install.
      Acceptable values are same as \`os\` field of package.json,
      which comes from \`process.platform\`.
    `,
			flatten
		}),
		otp: new Definition("otp", {
			default: null,
			type: [null, String],
			description: `
      This is a one-time password from a two-factor authenticator.  It's needed
      when publishing or changing package permissions with \`npm access\`.

      If not set, and a registry response fails with a challenge for a one-time
      password, npm will prompt on the command line for one.
    `,
			flatten(key, obj, flatOptions) {
				flatten(key, obj, flatOptions);
				if (obj.otp) {
					obj["auth-type"] = "legacy";
					flatten("auth-type", obj, flatOptions);
				}
			}
		}),
		package: new Definition("package", {
			default: [],
			hint: "<package-spec>",
			type: [String, Array],
			description: `
      The package or packages to install for [\`npm exec\`](/commands/npm-exec)
    `,
			flatten
		}),
		"package-lock": new Definition("package-lock", {
			default: true,
			type: Boolean,
			description: `
      If set to false, then ignore \`package-lock.json\` files when installing.
      This will also prevent _writing_ \`package-lock.json\` if \`save\` is
      true.
    `,
			flatten: (key, obj, flatOptions) => {
				flatten(key, obj, flatOptions);
				if (flatOptions.packageLockOnly) flatOptions.packageLock = true;
			}
		}),
		"package-lock-only": new Definition("package-lock-only", {
			default: false,
			type: Boolean,
			description: `
      If set to true, the current operation will only use the \`package-lock.json\`,
      ignoring \`node_modules\`.

      For \`update\` this means only the \`package-lock.json\` will be updated,
      instead of checking \`node_modules\` and downloading dependencies.

      For \`list\` this means the output will be based on the tree described by the
      \`package-lock.json\`, rather than the contents of \`node_modules\`.
    `,
			flatten: (key, obj, flatOptions) => {
				flatten(key, obj, flatOptions);
				if (flatOptions.packageLockOnly) flatOptions.packageLock = true;
			}
		}),
		"pack-destination": new Definition("pack-destination", {
			default: ".",
			type: String,
			description: `
      Directory in which \`npm pack\` will save tarballs.
    `,
			flatten
		}),
		packages: new Definition("packages", {
			default: [],
			type: [
				null,
				String,
				Array
			],
			description: `
      When creating a Granular Access Token with \`npm token create\`,
      this limits the token access to specific packages.
    `,
			flatten
		}),
		parseable: new Definition("parseable", {
			default: false,
			type: Boolean,
			short: "p",
			description: `
      Output parseable results from commands that write to standard output. For
      \`npm search\`, this will be tab-separated table format.
    `,
			flatten
		}),
		"allow-scripts-pending": new Definition("allow-scripts-pending", {
			default: false,
			type: Boolean,
			description: `
      List packages with install scripts that are not yet covered by the
      \`allowScripts\` policy, without modifying \`package.json\`. Only
      meaningful for \`npm approve-scripts\`.
    `,
			flatten
		}),
		"allow-scripts-pin": new Definition("allow-scripts-pin", {
			default: true,
			type: Boolean,
			description: `
      Write pinned (\`pkg@version\`) entries when approving install scripts.
      Set to \`false\` to write name-only entries that allow any version.
      Has no effect on \`npm deny-scripts\`, which always writes name-only
      entries regardless of this setting.
    `,
			flatten
		}),
		"prefer-dedupe": new Definition("prefer-dedupe", {
			default: false,
			type: Boolean,
			description: `
      Prefer to deduplicate packages if possible, rather than
      choosing a newer version of a dependency.
    `,
			flatten
		}),
		"prefer-offline": new Definition("prefer-offline", {
			default: false,
			type: Boolean,
			description: `
      If true, staleness checks for cached data will be bypassed, but missing
      data will be requested from the server. To force full offline mode, use
      \`--offline\`.
    `,
			flatten
		}),
		"prefer-online": new Definition("prefer-online", {
			default: false,
			type: Boolean,
			description: `
      If true, staleness checks for cached data will be forced, making the CLI
      look for updates immediately even for fresh package data.
    `,
			flatten
		}),
		prefix: new Definition("prefix", {
			type: path,
			short: "C",
			default: "",
			defaultDescription: `
      In global mode, the folder where the node executable is installed.
      Otherwise, the nearest parent folder containing either a package.json
      file or a node_modules folder.
    `,
			description: `
      The location to install global items.  If set on the command line, then
      it forces non-global commands to run in the specified folder.
    `
		}),
		preid: new Definition("preid", {
			default: "",
			hint: "prerelease-id",
			type: String,
			description: `
      The "prerelease identifier" to use as a prefix for the "prerelease" part
      of a semver. Like the \`rc\` in \`1.2.0-rc.8\`.
    `,
			flatten
		}),
		production: new Definition("production", {
			default: null,
			type: [null, Boolean],
			deprecated: "Use `--omit=dev` instead.",
			description: "Alias for `--omit=dev`",
			flatten(key, obj, flatOptions) {
				definitions.omit.flatten("omit", obj, flatOptions);
			}
		}),
		progress: new Definition("progress", {
			default: !(ciInfo.isCI || !process.stderr.isTTY || !process.stdout.isTTY || process.env.TERM === "dumb"),
			defaultDescription: `
      \`true\` when not in CI and both stderr and stdout are TTYs and not in a dumb terminal
    `,
			type: Boolean,
			description: `
      When set to \`true\`, npm will display a progress bar during time
      intensive operations, if \`process.stderr\` and \`process.stdout\` are a TTY.

      Set to \`false\` to suppress the progress bar.
    `,
			flatten(key, obj, flatOptions) {
				flatOptions.progress = !!obj.progress && !!process.stderr.isTTY && !!process.stdout.isTTY && process.env.TERM !== "dumb";
			}
		}),
		provenance: new Definition("provenance", {
			default: false,
			type: Boolean,
			exclusive: ["provenance-file"],
			description: `
      When publishing from a supported cloud CI/CD system, the package will be
      publicly linked to where it was built and published from.

      When the \`provenance-file\` config is set, it takes precedence and
      automatic provenance generation (including via trusted publishing/OIDC)
      is skipped.
    `,
			flatten
		}),
		"provenance-file": new Definition("provenance-file", {
			default: null,
			type: path,
			hint: "<file>",
			exclusive: ["provenance"],
			description: `
      When publishing, the provenance bundle at the given path will be used.

      This takes precedence over automatic provenance generation in trusted
      publishing flows.
    `,
			flatten
		}),
		proxy: new Definition("proxy", {
			default: null,
			type: [
				null,
				false,
				url
			],
			description: `
      A proxy to use for outgoing http requests. If the \`HTTP_PROXY\` or
      \`http_proxy\` environment variables are set, proxy settings will be
      honored by the underlying \`request\` library.
    `,
			flatten
		}),
		"read-only": new Definition("read-only", {
			default: false,
			type: Boolean,
			description: `
      This is used to mark a token as unable to publish when configuring
      limited access tokens with the \`npm token create\` command.
    `,
			flatten
		}),
		"rebuild-bundle": new Definition("rebuild-bundle", {
			default: true,
			type: Boolean,
			description: `
      Rebuild bundled dependencies after installation.
    `,
			flatten
		}),
		registry: new Definition("registry", {
			default: "https://registry.npmjs.org/",
			type: url,
			description: `
      The base URL of the npm registry.
    `,
			flatten
		}),
		"replace-registry-host": new Definition("replace-registry-host", {
			default: "npmjs",
			hint: "<npmjs|never|always> | hostname | url",
			type: [
				"npmjs",
				"never",
				"always",
				String
			],
			description: `
      Defines behavior for replacing the registry host in a lockfile with the
      configured registry.

      The default behavior is to replace package dist URLs from the default
      registry (https://registry.npmjs.org) to the configured registry. If set to
      "never", then use the registry value. If set to "always", then replace the
      registry host with the configured host every time.

      You may also specify a bare hostname (e.g., "registry.npmjs.org") to only
      replace URLs coming from that host.

      You may also specify a full URL including a path (e.g.,
      "https://old-registry.example.com/npm/path"). In that case, resolved URLs
      whose host and path begin with that prefix will have the entire prefix
      replaced with the configured registry URL (host and path), without
      duplicating path segments.
    `,
			flatten
		}),
		save: new Definition("save", {
			default: true,
			defaultDescription: `\`true\` unless when using \`npm update\` where it
    defaults to \`false\``,
			usage: "-S|--save|--no-save|--save-prod|--save-dev|--save-optional|--save-peer|--save-bundle",
			type: Boolean,
			short: "S",
			description: `
      Save installed packages to a \`package.json\` file as dependencies.

      When used with the \`npm rm\` command, removes the dependency from
      \`package.json\`.

      Will also prevent writing to \`package-lock.json\` if set to \`false\`.
    `,
			flatten
		}),
		"save-bundle": new Definition("save-bundle", {
			default: false,
			type: Boolean,
			short: "B",
			description: `
      If a package would be saved at install time by the use of \`--save\`,
      \`--save-dev\`, or \`--save-optional\`, then also put it in the
      \`bundleDependencies\` list.

      Ignored if \`--save-peer\` is set, since peerDependencies cannot be bundled.
    `,
			flatten(key, obj, flatOptions) {
				flatOptions.saveBundle = obj["save-bundle"] && !obj["save-peer"];
			}
		}),
		"save-dev": new Definition("save-dev", {
			default: false,
			type: Boolean,
			short: "D",
			exclusive: [
				"save-optional",
				"save-peer",
				"save-prod"
			],
			description: `
      Save installed packages to a package.json file as \`devDependencies\`.
    `,
			flatten(key, obj, flatOptions) {
				if (!obj[key]) {
					if (flatOptions.saveType === "dev") delete flatOptions.saveType;
					return;
				}
				flatOptions.saveType = "dev";
			}
		}),
		"save-exact": new Definition("save-exact", {
			default: false,
			type: Boolean,
			short: "E",
			description: `
      Dependencies saved to package.json will be configured with an exact
      version rather than using npm's default semver range operator.
    `,
			flatten(key, obj, flatOptions) {
				definitions["save-prefix"].flatten("save-prefix", obj, flatOptions);
			}
		}),
		"save-optional": new Definition("save-optional", {
			default: false,
			type: Boolean,
			short: "O",
			exclusive: [
				"save-dev",
				"save-peer",
				"save-prod"
			],
			description: `
      Save installed packages to a package.json file as
      \`optionalDependencies\`.
    `,
			flatten(key, obj, flatOptions) {
				if (!obj[key]) {
					if (flatOptions.saveType === "optional") delete flatOptions.saveType;
					else if (flatOptions.saveType === "peerOptional") flatOptions.saveType = "peer";
					return;
				}
				if (flatOptions.saveType === "peerOptional") return;
				if (flatOptions.saveType === "peer") flatOptions.saveType = "peerOptional";
				else flatOptions.saveType = "optional";
			}
		}),
		"save-peer": new Definition("save-peer", {
			default: false,
			type: Boolean,
			exclusive: [
				"save-dev",
				"save-optional",
				"save-prod"
			],
			description: `
      Save installed packages to a package.json file as \`peerDependencies\`
    `,
			flatten(key, obj, flatOptions) {
				if (!obj[key]) {
					if (flatOptions.saveType === "peer") delete flatOptions.saveType;
					else if (flatOptions.saveType === "peerOptional") flatOptions.saveType = "optional";
					return;
				}
				if (flatOptions.saveType === "peerOptional") return;
				if (flatOptions.saveType === "optional") flatOptions.saveType = "peerOptional";
				else flatOptions.saveType = "peer";
			}
		}),
		"save-prefix": new Definition("save-prefix", {
			default: "^",
			type: String,
			description: `
      Configure how versions of packages installed to a package.json file via
      \`--save\` or \`--save-dev\` get prefixed.

      For example if a package has version \`1.2.3\`, by default its version is
      set to \`^1.2.3\` which allows minor upgrades for that package, but after
      \`npm config set save-prefix='~'\` it would be set to \`~1.2.3\` which
      only allows patch upgrades.
    `,
			flatten(key, obj, flatOptions) {
				flatOptions.savePrefix = obj["save-exact"] ? "" : obj["save-prefix"];
				obj["save-prefix"] = flatOptions.savePrefix;
			}
		}),
		"save-prod": new Definition("save-prod", {
			default: false,
			type: Boolean,
			short: "P",
			exclusive: [
				"save-dev",
				"save-optional",
				"save-peer"
			],
			description: `
      Save installed packages into \`dependencies\` specifically. This is
      useful if a package already exists in \`devDependencies\` or
      \`optionalDependencies\`, but you want to move it to be a non-optional
      production dependency.

      This is the default behavior if \`--save\` is true, and neither
      \`--save-dev\` or \`--save-optional\` are true.
    `,
			flatten(key, obj, flatOptions) {
				if (!obj[key]) {
					if (flatOptions.saveType === "prod") delete flatOptions.saveType;
					return;
				}
				flatOptions.saveType = "prod";
			}
		}),
		"sbom-format": new Definition("sbom-format", {
			default: null,
			type: ["cyclonedx", "spdx"],
			description: `
      SBOM format to use when generating SBOMs.
    `,
			flatten
		}),
		"sbom-type": new Definition("sbom-type", {
			default: "library",
			type: [
				"library",
				"application",
				"framework"
			],
			description: `
      The type of package described by the generated SBOM. For SPDX, this is the
      value for the \`primaryPackagePurpose\` field. For CycloneDX, this is the
      value for the \`type\` field.
    `,
			flatten
		}),
		scope: new Definition("scope", {
			default: "",
			defaultDescription: `
      the scope of the current project, if any, or ""
    `,
			type: String,
			hint: "<@scope>",
			description: `
      Associate an operation with a scope for a scoped registry.

      Useful when logging in to or out of a private registry:

      \`\`\`
      # log in, linking the scope to the custom registry
      npm login --scope=@mycorp --registry=https://registry.mycorp.com

      # log out, removing the link and the auth token
      npm logout --scope=@mycorp
      \`\`\`

      This will cause \`@mycorp\` to be mapped to the registry for future
      installation of packages specified according to the pattern
      \`@mycorp/package\`.

      This will also cause \`npm init\` to create a scoped package.

      \`\`\`
      # accept all defaults, and create a package named "@foo/whatever",
      # instead of just named "whatever"
      npm init --scope=@foo --yes
      \`\`\`
    `,
			flatten(key, obj, flatOptions) {
				const value = obj[key];
				const scope = value && !/^@/.test(value) ? `@${value}` : value;
				flatOptions.scope = scope;
				flatOptions.projectScope = scope;
			}
		}),
		scopes: new Definition("scopes", {
			default: null,
			type: [
				null,
				String,
				Array
			],
			description: `
      When creating a Granular Access Token with \`npm token create\`,
      this limits the token access to specific scopes. Provide
      a scope name (with or without @ prefix).
    `,
			flatten
		}),
		"packages-all": new Definition("packages-all", {
			default: false,
			type: Boolean,
			description: `
      When creating a Granular Access Token with \`npm token create\`,
      grants the token access to all packages instead of limiting to
      specific packages.
    `,
			flatten
		}),
		"packages-and-scopes-permission": new Definition("packages-and-scopes-permission", {
			default: null,
			type: [
				null,
				"read-only",
				"read-write",
				"read-write-stage-only",
				"no-access"
			],
			description: `
      When creating a Granular Access Token with \`npm token create\`,
      sets the permission level for packages and scopes. Options are
      "read-only", "read-write", "read-write-stage-only", or "no-access".
      "read-write-stage-only" grants publish access that stages releases
      instead of publishing them directly.
    `,
			flatten
		}),
		"orgs-permission": new Definition("orgs-permission", {
			default: null,
			type: [
				null,
				"read-only",
				"read-write",
				"no-access"
			],
			description: `
      When creating a Granular Access Token with \`npm token create\`,
      sets the permission level for organizations. Options are
      "read-only", "read-write", or "no-access".
    `,
			flatten
		}),
		password: new Definition("password", {
			default: null,
			type: [null, String],
			description: `
      Password for authentication. Can be provided via command line when
      creating tokens, though it's generally safer to be prompted for it.
    `,
			flatten
		}),
		"token-description": new Definition("token-description", {
			default: null,
			type: [null, String],
			description: `
      Description text for the token when using \`npm token create\`.
    `,
			flatten
		}),
		"script-shell": new Definition("script-shell", {
			default: null,
			defaultDescription: `
      '/bin/sh' on POSIX systems, 'cmd.exe' on Windows
    `,
			type: [null, String],
			description: `
      The shell to use for scripts run with the \`npm exec\`,
      \`npm run\` and \`npm init <package-spec>\` commands.
    `,
			flatten(key, obj, flatOptions) {
				flatOptions.scriptShell = obj[key] || void 0;
			}
		}),
		searchexclude: new Definition("searchexclude", {
			default: "",
			type: String,
			description: `
      Space-separated options that limit the results from search.
    `,
			flatten(key, obj, flatOptions) {
				flatOptions.search = flatOptions.search || { limit: 20 };
				flatOptions.search.exclude = obj[key].toLowerCase();
			}
		}),
		searchlimit: new Definition("searchlimit", {
			default: 20,
			type: Number,
			description: `
      Number of items to limit search results to. Will not apply at all to
      legacy searches.
    `,
			flatten(key, obj, flatOptions) {
				flatOptions.search = flatOptions.search || {};
				flatOptions.search.limit = obj[key];
			}
		}),
		searchopts: new Definition("searchopts", {
			default: "",
			type: String,
			description: `
      Space-separated options that are always passed to search.
    `,
			flatten(key, obj, flatOptions) {
				flatOptions.search = flatOptions.search || { limit: 20 };
				flatOptions.search.opts = querystring.parse(obj[key]);
			}
		}),
		searchstaleness: new Definition("searchstaleness", {
			default: 900,
			type: Number,
			description: `
      The age of the cache, in seconds, before another registry request is made
      if using legacy search endpoint.
    `,
			flatten(key, obj, flatOptions) {
				flatOptions.search = flatOptions.search || { limit: 20 };
				flatOptions.search.staleness = obj[key];
			}
		}),
		shell: new Definition("shell", {
			default: shell,
			defaultDescription: `
      SHELL environment variable, or "bash" on Posix, or "cmd.exe" on Windows
    `,
			type: String,
			description: `
      The shell to run for the \`npm explore\` command.
    `,
			flatten
		}),
		shrinkwrap: new Definition("shrinkwrap", {
			default: true,
			type: Boolean,
			deprecated: `
      Use the --package-lock setting instead.
    `,
			description: `
      Alias for --package-lock
    `,
			flatten(key, obj, flatOptions) {
				obj["package-lock"] = obj.shrinkwrap;
				definitions["package-lock"].flatten("package-lock", obj, flatOptions);
			}
		}),
		"sign-git-commit": new Definition("sign-git-commit", {
			default: false,
			type: Boolean,
			description: `
      If set to true, then the \`npm version\` command will commit the new
      package version using \`-S\` to add a signature.

      Note that git requires you to have set up GPG keys in your git configs
      for this to work properly.
    `,
			flatten
		}),
		"sign-git-tag": new Definition("sign-git-tag", {
			default: false,
			type: Boolean,
			description: `
      If set to true, then the \`npm version\` command will tag the version
      using \`-s\` to add a signature.

      Note that git requires you to have set up GPG keys in your git configs
      for this to work properly.
    `,
			flatten
		}),
		"strict-peer-deps": new Definition("strict-peer-deps", {
			default: false,
			type: Boolean,
			description: `
      If set to \`true\`, and \`--legacy-peer-deps\` is not set, then _any_
      conflicting \`peerDependencies\` will be treated as an install failure,
      even if npm could reasonably guess the appropriate resolution based on
      non-peer dependency relationships.

      By default, conflicting \`peerDependencies\` deep in the dependency graph
      will be resolved using the nearest non-peer dependency specification,
      even if doing so will result in some packages receiving a peer dependency
      outside the range set in their package's \`peerDependencies\` object.

      When such an override is performed, a warning is printed, explaining the
      conflict and the packages involved.  If \`--strict-peer-deps\` is set,
      then this warning is treated as a failure.
    `,
			flatten
		}),
		"strict-allow-scripts": new Definition("strict-allow-scripts", {
			default: false,
			type: Boolean,
			description: `
      If \`true\`, turn the install-script policy from a warning into a hard
      error: any dependency with install scripts not covered by
      \`allowScripts\` will fail the install instead of running with a
      notice.

      Dependencies explicitly denied with \`false\` in \`allowScripts\` are
      always silently skipped; this setting only affects unreviewed entries.
      \`--ignore-scripts\` and \`--dangerously-allow-all-scripts\` both
      override this setting.

      Optional dependencies that cannot be installed on the current platform
      or engine (a non-matching \`os\`, \`cpu\`, or \`libc\`) are not flagged,
      because their install scripts never run.
    `,
			flatten
		}),
		"strict-ssl": new Definition("strict-ssl", {
			default: true,
			type: Boolean,
			description: `
      Whether or not to do SSL key validation when making requests to the
      registry via https.

      See also the \`ca\` config.
    `,
			flatten(key, obj, flatOptions) {
				flatOptions.strictSSL = obj[key];
			}
		}),
		tag: new Definition("tag", {
			default: "latest",
			type: String,
			description: `
      If you ask npm to install a package and don't tell it a specific version,
      then it will install the specified tag.

      It is the tag added to the package@version specified in the
      \`npm dist-tag add\` command, if no explicit tag is given.

      When used by the \`npm diff\` command, this is the tag used to fetch the
      tarball that will be compared with the local files by default.

      If used in the \`npm publish\` command, this is the tag that will be
      added to the package submitted to the registry.
    `,
			flatten(key, obj, flatOptions) {
				flatOptions.defaultTag = obj[key];
			}
		}),
		"tag-version-prefix": new Definition("tag-version-prefix", {
			default: "v",
			type: String,
			description: `
      If set, alters the prefix used when tagging a new version when performing
      a version increment using  \`npm version\`. To remove the prefix
      altogether, set it to the empty string: \`""\`.

      Because other tools may rely on the convention that npm version tags look
      like \`v1.0.0\`, _only use this property if it is absolutely necessary_.
      In particular, use care when overriding this setting for public packages.
    `,
			flatten
		}),
		timing: new Definition("timing", {
			default: false,
			type: Boolean,
			description: `
      If true, writes timing information to a process specific json file in
      the cache or \`logs-dir\`. The file name ends with \`-timing.json\`.

      You can quickly view it with this [json](https://npm.im/json) command
      line: \`cat ~/.npm/_logs/*-timing.json | npm exec -- json -g\`.

      Timing information will also be reported in the terminal. To suppress this
      while still writing the timing file, use \`--silent\`.
    `
		}),
		umask: new Definition("umask", {
			default: 0,
			type: Umask,
			description: `
      The "umask" value to use when setting the file creation mode on files and
      folders.

      Folders and executables are given a mode which is \`0o777\` masked
      against this value.  Other files are given a mode which is \`0o666\`
      masked against this value.

      Note that the underlying system will _also_ apply its own umask value to
      files and folders that are created, and npm does not circumvent this, but
      rather adds the \`--umask\` config to it.

      Thus, the effective default umask value on most POSIX systems is 0o22,
      meaning that folders and executables are created with a mode of 0o755 and
      other files are created with a mode of 0o644.
    `,
			flatten
		}),
		unicode: new Definition("unicode", {
			default: unicode,
			defaultDescription: `
      false on windows, true on mac/unix systems with a unicode locale, as
      defined by the \`LC_ALL\`, \`LC_CTYPE\`, or \`LANG\` environment variables.
    `,
			type: Boolean,
			description: `
      When set to true, npm uses unicode characters in the tree output.  When
      false, it uses ascii characters instead of unicode glyphs.
    `,
			flatten
		}),
		"update-notifier": new Definition("update-notifier", {
			default: true,
			type: Boolean,
			description: `
      Set to false to suppress the update notification when using an older
      version of npm than the latest.
    `
		}),
		usage: new Definition("usage", {
			default: false,
			type: Boolean,
			short: [
				"?",
				"H",
				"h"
			],
			description: `
      Show short usage output about the command specified.
    `
		}),
		"user-agent": new Definition("user-agent", {
			default: "npm/{npm-version} node/{node-version} {platform} {arch} workspaces/{workspaces} {ci}",
			type: String,
			description: `
      Sets the User-Agent request header.  The following fields are replaced
      with their actual counterparts:

      * \`{npm-version}\` - The npm version in use
      * \`{node-version}\` - The Node.js version in use
      * \`{platform}\` - The value of \`process.platform\`
      * \`{arch}\` - The value of \`process.arch\`
      * \`{workspaces}\` - Set to \`true\` if the \`workspaces\` or \`workspace\`
        options are set.
      * \`{ci}\` - The value of the \`ci-name\` config, if set, prefixed with
        \`ci/\`, or an empty string if \`ci-name\` is empty.
    `,
			flatten(key, obj, flatOptions) {
				const value = obj[key];
				const ciName = ciInfo.name?.toLowerCase().split(" ").join("-") || null;
				let subCiName = null;
				if (ciInfo.GITHUB_ACTIONS) {
					const serverUrl = (process.env.GITHUB_SERVER_URL || "").trim();
					const runnerEnv = (process.env.RUNNER_ENVIRONMENT || "").trim();
					let serverHost = "";
					try {
						serverHost = new URL(serverUrl).hostname.toLowerCase();
					} catch {
						serverHost = "";
					}
					if (serverHost === "github.com") {
						if (runnerEnv === "github-hosted") subCiName = "dotcom-hosted";
						else if (runnerEnv === "self-hosted") subCiName = "dotcom-selfhosted";
						else subCiName = "dotcom";
					} else if (serverHost === "ghe.com" || serverHost.endsWith(".ghe.com")) subCiName = "ghecom";
					else if (serverHost) subCiName = "ghes";
				}
				const ci = ciName ? `ci/${ciName}${subCiName ? `/${subCiName}` : ""}` : "";
				let inWorkspaces = false;
				if (obj.workspaces || obj.workspace && obj.workspace.length) inWorkspaces = true;
				flatOptions.userAgent = value.replace(/\{node-version\}/gi, process.version).replace(/\{npm-version\}/gi, obj["npm-version"]).replace(/\{platform\}/gi, process.platform).replace(/\{arch\}/gi, process.arch).replace(/\{workspaces\}/gi, inWorkspaces).replace(/\{ci\}/gi, ci).trim();
				process.env.npm_config_user_agent = flatOptions.userAgent;
			}
		}),
		userconfig: new Definition("userconfig", {
			default: "~/.npmrc",
			type: path,
			description: `
      The location of user-level configuration settings.

      This may be overridden by the \`npm_config_userconfig\` environment
      variable or the \`--userconfig\` command line option, but may _not_
      be overridden by settings in the \`globalconfig\` file.
    `
		}),
		version: new Definition("version", {
			default: false,
			type: Boolean,
			short: "v",
			description: `
      If true, output the npm version and exit successfully.

      Only relevant when specified explicitly on the command line.
    `
		}),
		versions: new Definition("versions", {
			default: false,
			type: Boolean,
			description: `
      If true, output the npm version as well as node's \`process.versions\`
      map and the version in the current working directory's \`package.json\`
      file if one exists, and exit successfully.

      Only relevant when specified explicitly on the command line.
    `
		}),
		viewer: new Definition("viewer", {
			default: isWindows ? "browser" : "man",
			defaultDescription: `
      "man" on Posix, "browser" on Windows
    `,
			type: String,
			description: `
      The program to use to view help content.

      Set to \`"browser"\` to view html help content in the default web browser.
    `
		}),
		which: new Definition("which", {
			default: null,
			hint: "<fundingSourceNumber>",
			type: [null, Number],
			description: `
      If there are multiple funding sources, which 1-indexed source URL to open.
    `
		}),
		workspace: new Definition("workspace", {
			default: [],
			type: [String, Array],
			hint: "<workspace-name>",
			short: "w",
			envExport: false,
			description: `
      Enable running a command in the context of the configured workspaces of the
      current project while filtering by running only the workspaces defined by
      this configuration option.

      Valid values for the \`workspace\` config are either:

      * Workspace names
      * Path to a workspace directory
      * Path to a parent workspace directory (will result in selecting all
        workspaces within that folder)

      When set for the \`npm init\` command, this may be set to the folder of
      a workspace which does not yet exist, to create the folder and set it
      up as a brand new workspace within the project.
    `,
			flatten: (key, obj, flatOptions) => {
				definitions["user-agent"].flatten("user-agent", obj, flatOptions);
			}
		}),
		workspaces: new Definition("workspaces", {
			default: null,
			type: [null, Boolean],
			envExport: false,
			description: `
      Set to true to run the command in the context of **all** configured
      workspaces.

      Explicitly setting this to false will cause commands like \`install\` to
      ignore workspaces altogether.
      When not set explicitly:

      - Commands that operate on the \`node_modules\` tree (install, update,
        etc.) will link workspaces into the \`node_modules\` folder.
      - Commands that do other things (test, exec, publish, etc.) will operate
        on the root project, _unless_ one or more workspaces are specified in
        the \`workspace\` config.
    `,
			flatten: (key, obj, flatOptions) => {
				definitions["user-agent"].flatten("user-agent", obj, flatOptions);
				flatOptions.workspacesEnabled = obj[key] !== false;
			}
		}),
		"workspaces-update": new Definition("workspaces-update", {
			default: true,
			type: Boolean,
			description: `
      If set to true, the npm cli will run an update after operations that may
      possibly change the workspaces installed to the \`node_modules\` folder.
    `,
			flatten
		}),
		yes: new Definition("yes", {
			default: null,
			type: [null, Boolean],
			short: "y",
			description: `
      Automatically answer "yes" to any prompts that npm might print on
      the command line.
    `
		})
	};
	module.exports = definitions;
}));
//#endregion
//#region ../../node_modules/.pnpm/@npmcli+config@10.14.0/node_modules/@npmcli/config/lib/definitions/index.js
var require_definitions = /* @__PURE__ */ require_rolldown_runtime.__commonJSMin(((exports, module) => {
	const definitions = require_definitions$1();
	const flatten = (obj, flat = {}) => {
		for (const [key, val] of Object.entries(obj)) {
			const def = definitions[key];
			if (def && def.flatten) def.flatten(key, obj, flat);
			else if (/@.*:registry$/i.test(key) || /^\/\//.test(key)) flat[key] = val;
		}
		return flat;
	};
	const definitionProps = Object.entries(definitions).reduce((acc, [key, { short = [], default: d }]) => {
		for (const s of [].concat(short)) acc.shorthands[s] = [`--${key}`];
		acc.defaults[key] = d;
		return acc;
	}, {
		shorthands: {},
		defaults: {}
	});
	const shorthands = {
		"enjoy-by": ["--before"],
		d: ["--loglevel", "info"],
		dd: ["--loglevel", "verbose"],
		ddd: ["--loglevel", "silly"],
		quiet: ["--loglevel", "warn"],
		q: ["--loglevel", "warn"],
		s: ["--loglevel", "silent"],
		silent: ["--loglevel", "silent"],
		verbose: ["--loglevel", "verbose"],
		desc: ["--description"],
		help: ["--usage"],
		local: ["--no-global"],
		n: ["--no-yes"],
		no: ["--no-yes"],
		porcelain: ["--parseable"],
		readonly: ["--read-only"],
		reg: ["--registry"],
		iwr: ["--include-workspace-root"],
		ws: ["--workspaces"],
		...definitionProps.shorthands
	};
	module.exports = {
		defaults: definitionProps.defaults,
		definitions,
		flatten,
		nerfDarts: [
			"_auth",
			"_authToken",
			"_password",
			"certfile",
			"email",
			"keyfile",
			"username"
		],
		proxyEnv: [
			"http_proxy",
			"https_proxy",
			"proxy",
			"no_proxy"
		],
		shorthands
	};
}));
//#endregion
//#region src/install/config.ts
var import_lib = /* @__PURE__ */ require_rolldown_runtime.__toESM(require_lib(), 1);
var import_definitions = /* @__PURE__ */ require_rolldown_runtime.__toESM(require_definitions(), 1);
const DROPPED = /* @__PURE__ */ new Set(["NODE_OPTIONS", "NODE_EXTRA_CA_CERTS"]);
/** Proxy settings reach the transport only from the user and global npm config (spec DL-2), never the env. */
const PROXY_VARS = /^(https?_proxy|all_proxy|no_proxy|proxy)$/i;
/** The env without anything that would steer npm or Node: `npm_config_*`, proxies, `NODE_OPTIONS`, `NODE_EXTRA_CA_CERTS`. */
function sanitizeEnv(env) {
	const clean = {};
	for (const [key, value] of Object.entries(env)) {
		if (/^npm_config_/i.test(key) || DROPPED.has(key.toUpperCase()) || PROXY_VARS.test(key)) continue;
		clean[key] = value;
	}
	return clean;
}
function optionalString(value) {
	const text = Array.isArray(value) ? value.map(String).filter((item) => item !== "").join(",") : value;
	return typeof text === "string" && text !== "" ? text : null;
}
/**
* Loads npm's config the way npm does, minus the project: `cwd` is an empty dir under the home,
* the env is sanitized and nothing is printed. Credentials come only from `getCredentialsByURI`.
*/
async function loadNpmConfig(own, env, cwd, nodePath = process.execPath) {
	const { definitions, shorthands, flatten, nerfDarts } = import_definitions.default;
	const config = new import_lib.default({
		definitions,
		shorthands,
		flatten,
		nerfDarts,
		npmPath: own.root,
		argv: [
			nodePath,
			own.cliPath,
			"--location=global"
		],
		execPath: nodePath,
		env: { ...sanitizeEnv(env) },
		cwd,
		excludeNpmCwd: true
	});
	await config.load();
	const registry = String(config.get("registry"));
	const ca = config.get("ca");
	return {
		registry,
		userconfig: String(config.get("userconfig")),
		globalconfig: String(config.get("globalconfig")),
		cache: String(config.get("cache")),
		credentials: config.getCredentialsByURI(registry),
		httpsProxy: optionalString(config.get("https-proxy")),
		proxy: optionalString(config.get("proxy")),
		noproxy: optionalString(config.get("noproxy")),
		ca: Array.isArray(ca) ? ca.map(String) : typeof ca === "string" ? [ca] : null,
		cafile: optionalString(config.get("cafile")),
		strictSsl: config.get("strict-ssl") !== false
	};
}
//#endregion
//#region src/install/fetch.ts
const MIN_TRANSPORT = "8.0.0";
const MAX_OUTPUT = 268435456;
/** Whether Node's own npm can serve as the transport (spec DL-1). */
function transportUsable(own) {
	return own !== null && import_semver.default.gte(own.version, MIN_TRANSPORT);
}
/** A fresh private working dir under `state/tmp/`, never the shared system temp dir (spec DL-2). */
function newWorkDir(tmpRoot) {
	(0, node_fs.mkdirSync)(tmpRoot, {
		recursive: true,
		mode: 448
	});
	return (0, node_fs.mkdtempSync)((0, node_path.join)(tmpRoot, "work-"));
}
/**
* Runs Node's own npm as the download transport, isolated from the project (spec DL-1, DL-2).
* Every call runs in its own empty working dir, with that dir as the prefix and the user and global config named explicitly.
*/
var Transport = class {
	#own;
	#config;
	#env;
	#tmpRoot;
	#nodePath;
	constructor(own, config, env, tmpRoot, nodePath = process.execPath) {
		this.#own = own;
		this.#config = config;
		this.#env = sanitizeEnv(env);
		this.#tmpRoot = tmpRoot;
		this.#nodePath = nodePath;
	}
	/** Versions of npm matching `range`, newest last as npm lists them; an unmatched range is an empty list. */
	view(range) {
		return this.viewPackage("npm", range);
	}
	/** The same for any package, used by self-update for its own package. */
	async viewPackage(name, range) {
		const output = await this.#run([
			"view",
			`${name}@${range}`,
			"version",
			"engines",
			"dist"
		], true);
		if (output === null) return [];
		return asList(output).flatMap((item) => {
			const version = readString(item, "version");
			const dist = readObject(item, "dist");
			const integrity = dist === null ? null : readString(dist, "integrity");
			const tarball = dist === null ? null : readString(dist, "tarball");
			if (version === null || integrity === null || tarball === null) return [];
			const engines = readObject(item, "engines");
			const signatures = (dist === null ? null : dist["signatures"]) ?? [];
			const attestations = dist === null ? null : readObject(dist, "attestations");
			return [{
				version,
				enginesNode: engines === null ? null : readString(engines, "node"),
				integrity,
				tarball,
				signatures: Array.isArray(signatures) ? signatures.filter(isSignature) : [],
				attestationsUrl: attestations === null ? null : readString(attestations, "url")
			}];
		});
	}
	/** Publication time per version, used only to judge signatures by expired keys. */
	async times() {
		const output = await this.#run([
			"view",
			"npm",
			"time"
		], true);
		const map = output === null ? null : asList(output)[0] ?? null;
		const times = {};
		if (map !== null && typeof map === "object") {
			for (const [version, time] of Object.entries(map)) if (typeof time === "string") times[version] = time;
		}
		return times;
	}
	/** Downloads one npm version's tarball into `dest` through `npm pack`. */
	pack(version, dest) {
		return this.packPackage("npm", version, dest);
	}
	async packPackage(name, version, dest) {
		const item = asList(await this.#run([
			"pack",
			`${name}@${version}`,
			`--pack-destination=${dest}`
		], false)).flatMap((item) => readString(item, "filename") === null ? asList(Object.values(item)) : [item]).find((candidate) => readString(candidate, "filename") !== null) ?? null;
		const filename = item === null ? null : readString(item, "filename");
		const integrity = item === null ? null : readString(item, "integrity");
		if (filename === null || integrity === null) throw this.#failure(`npm pack returned no tarball for ${name}@${version}`);
		return {
			file: (0, node_path.join)(dest, filename),
			integrity
		};
	}
	#failure(detail) {
		return new require_messages.NpmVmError("M-TRANSPORT", require_messages.EXIT.transport, require_messages.transportMessage(this.#own.version, detail));
	}
	/** Runs npm with the isolation flags; returns parsed JSON, or null for a 404 when `missingIsEmpty`. */
	async #run(args, missingIsEmpty) {
		const cwd = newWorkDir(this.#tmpRoot);
		const argv = [
			this.#own.cliPath,
			...args,
			"--json",
			"--ignore-scripts",
			"--loglevel=error",
			"--replace-registry-host=always",
			...proxyFlags(this.#config),
			"--fetch-retry-mintimeout=1000",
			"--fetch-retry-maxtimeout=10000",
			`--prefix=${cwd}`,
			`--cache=${this.#config.cache}`,
			`--userconfig=${this.#config.userconfig}`,
			`--globalconfig=${this.#config.globalconfig}`
		];
		try {
			const { stdout: output } = await new Promise((resolve, reject) => {
				(0, node_child_process.execFile)(this.#nodePath, argv, {
					cwd,
					env: this.#env,
					maxBuffer: MAX_OUTPUT,
					timeout: 3e5,
					windowsHide: true
				}, (error, stdout, stderr) => {
					if (error === null) {
						resolve({ stdout });
						return;
					}
					reject(Object.assign(error, {
						stdout,
						stderr
					}));
				});
			});
			return parseJson(output);
		} catch (error) {
			const stderr = String(error.stderr ?? "");
			if (missingIsEmpty && /\bE404\b/.test(stderr)) return null;
			const line = (stderr.split("\n").find((text) => /^npm (ERR!|error)/.test(text)) ?? error.message).replace(/^npm (ERR!|error) /, "").trim();
			const redacted = require_messages.redactUrls(line);
			if (/\bEINTEGRITY\b/.test(stderr)) throw new require_messages.NpmVmError("M-INTEGRITY", require_messages.EXIT.verification, require_messages.integrityMessage("the registry integrity", "other bytes", redacted));
			throw this.#failure(redacted);
		} finally {
			(0, node_fs.rmSync)(cwd, {
				recursive: true,
				force: true
			});
		}
	}
};
/** Proxy settings as flags, since the env the transport sees carries none (spec DL-2). */
function proxyFlags(config) {
	const flags = [];
	if (config.httpsProxy !== null) flags.push(`--https-proxy=${config.httpsProxy}`);
	if (config.proxy !== null) flags.push(`--proxy=${config.proxy}`);
	if (config.noproxy !== null) flags.push(`--noproxy=${config.noproxy}`);
	return flags;
}
function parseJson(text) {
	const trimmed = text.trim();
	if (trimmed === "") return null;
	return JSON.parse(trimmed);
}
function asList(value) {
	return (Array.isArray(value) ? value : [value]).filter((item) => typeof item === "object" && item !== null);
}
function readString(record, key) {
	const value = record[key];
	return typeof value === "string" ? value : null;
}
function readObject(record, key) {
	const value = record[key];
	return typeof value === "object" && value !== null && !Array.isArray(value) ? value : null;
}
function isSignature(value) {
	return typeof value === "object" && value !== null && typeof value.keyid === "string" && typeof value.sig === "string";
}
//#endregion
//#region src/install/keys.ts
const REGISTRY_KEYS = [{
	keyid: "SHA256:jl3bwswu80PjjokCgh0o2w5c2U4LhQAE57gj9cz1kzA",
	key: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE1Olb3zMAFFxXKHiIkQO5cJ3Yhl5i6UPp+IhuteBJbuHcA5UogKo0EWtlWwW6KSaKoTNEYL7JlCQiVnkhBktUgg==",
	expires: "2025-01-29T00:00:00.000Z"
}, {
	keyid: "SHA256:DhQ8wR5APBvFHLF/+Tc+AYvPOdTpcIDqOhxsBHRwC7U",
	key: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEY6Ya7W++7aUPzvMTrezH6Ycx3c+HOKYCcNGybJZSCJq/fd7Qa8uuAKtdIkUQtQiEKERhAmE5lMMJhP8OkDOa2g==",
	expires: null
}];
const EXTRA_KEYS_FILE = "keys.json";
/**
* Keys added beside the built-in ones from `<home>/state/keys.json`, for registries that sign with their own keys.
* Anything able to write there could replace the runtime itself, so this adds no trust the home does not already hold.
*/
function loadKeyring(stateDir) {
	let extra;
	try {
		extra = JSON.parse((0, node_fs.readFileSync)((0, node_path.join)(stateDir, EXTRA_KEYS_FILE), "utf8"));
	} catch {
		return [...REGISTRY_KEYS];
	}
	const keys = Array.isArray(extra) ? extra : [];
	return [...REGISTRY_KEYS, ...keys.filter((key) => typeof key === "object" && key !== null && typeof key.keyid === "string" && typeof key.key === "string" && (key.expires === null || typeof key.expires === "string"))];
}
//#endregion
//#region src/install/index.ts
var install_exports = /* @__PURE__ */ require_rolldown_runtime.__exportAll({
	createContext: () => createContext,
	createInstaller: () => createInstaller
});
function createContext(env = process.env, home, node = {
	execPath: process.execPath,
	version: process.version
}) {
	const dirs = require_home.resolveDirs(env, home);
	return {
		dirs,
		own: findOwnNpm(node.execPath),
		env,
		nodeVersion: node.version,
		nodePath: node.execPath,
		keys: loadKeyring(dirs.state)
	};
}
function toCandidate(version) {
	return {
		version: version.version,
		enginesNode: version.enginesNode,
		integrity: version.integrity,
		entryPath: null,
		signatures: version.signatures
	};
}
/** Lazily loads the npm config and builds the transport once per process. */
var TransportFactory = class {
	#context;
	#ready = null;
	constructor(context) {
		this.#context = context;
	}
	get() {
		this.#ready ??= this.#create();
		return this.#ready;
	}
	async #create() {
		const { own, env, dirs } = this.#context;
		const found = own?.version ?? null;
		if (!transportUsable(own)) throw new require_messages.NpmVmError("M-TRANSPORT", require_messages.EXIT.transport, require_messages.transportMessage(found, "too old or missing"));
		const cwd = newWorkDir(dirs.tmp);
		try {
			const config = await loadNpmConfig(own, env, cwd, this.#context.nodePath);
			return {
				transport: new Transport(own, config, env, dirs.tmp, this.#context.nodePath),
				config
			};
		} finally {
			(0, node_fs.rmSync)(cwd, {
				recursive: true,
				force: true
			});
		}
	}
};
function createInstaller(context) {
	const factory = new TransportFactory(context);
	async function registryVersions(specs) {
		const { transport } = await factory.get();
		const byVersion = /* @__PURE__ */ new Map();
		for (const spec of specs) for (const version of await transport.view(spec.exact ?? spec.range)) byVersion.set(version.version, version);
		return [...byVersion.values()];
	}
	async function installTarball(selection, source, onPacked) {
		const { candidate } = selection;
		const owner = require_lease.ownerRecord(context.dirs.machine.id);
		if (source.published.version !== candidate.version || source.published.integrity !== candidate.integrity) throw new require_messages.NpmVmError("M-INTEGRITY", require_messages.EXIT.verification, require_messages.integrityMessage(candidate.integrity, source.published.integrity, `the registry no longer serves npm ${candidate.version} with this integrity`));
		const digests = await fileDigests(source.file);
		checkIntegrity(digests, candidate.integrity, selection.hashes);
		const keyid = await verifySignatures({
			name: "npm",
			version: candidate.version,
			integrity: candidate.integrity,
			signatures: source.published.signatures,
			publishedAt: source.publishedAt,
			keys: context.keys,
			registry: source.registry,
			pinned: selection.hashes.length > 0
		});
		if (onPacked !== void 0) await onPacked(source, digests);
		const work = newWorkDir(stagingDir(context.dirs.cache));
		try {
			const extracted = (0, node_path.join)(work, "package");
			(0, node_fs.mkdirSync)(extracted, { mode: 448 });
			await safeExtract(source.file, extracted);
			checkExtracted(extracted, candidate, context.nodeVersion);
			writeVerified(extracted, {
				version: candidate.version,
				integrity: candidate.integrity,
				keyid,
				sha256: digests.sha256hex,
				sha224: digests.sha224hex,
				verifiedAt: (/* @__PURE__ */ new Date()).toISOString()
			});
			const canonical = canonicalEntry(context.dirs.cache, candidate.version, candidate.integrity);
			(0, node_fs.mkdirSync)((0, node_path.join)(canonical, ".."), {
				recursive: true,
				mode: 448
			});
			const published = publishEntry(extracted, canonical, candidate.integrity, owner);
			touchUsed(published.entryPath);
			return published;
		} finally {
			(0, node_fs.rmSync)(work, {
				recursive: true,
				force: true
			});
		}
	}
	return {
		nodeVersion: context.nodeVersion,
		ownNpm: () => context.own,
		cached: async () => listEntries(context.dirs.cache, context.keys),
		registry: async (specs) => (await registryVersions(specs)).map(toCandidate),
		entryPathFor: (candidate) => canonicalEntry(context.dirs.cache, candidate.version, candidate.integrity),
		async registryIdentity() {
			const { config } = await factory.get();
			return (0, node_crypto.createHash)("sha256").update(config.registry).digest("hex").slice(0, 12);
		},
		installTarball: (selection, source) => installTarball(selection, source),
		async ensure(selection, options = {}) {
			const { candidate } = selection;
			const owner = require_lease.ownerRecord(context.dirs.machine.id);
			if (candidate.entryPath !== null && validateEntry(candidate.entryPath, candidate.integrity)) {
				const lease = await require_lease.acquireShared(candidate.entryPath, owner);
				if (lease !== null && validateEntry(candidate.entryPath, candidate.integrity)) {
					touchUsed(candidate.entryPath);
					return {
						entryPath: candidate.entryPath,
						lease
					};
				}
				lease?.release();
			}
			if (options.offline ?? (context.env["NPM_VM_OFFLINE"] ?? "") !== "") throw new require_messages.NpmVmError("M-NOMATCH", require_messages.EXIT.resolution, `npm ${candidate.version} is not usable from the cache and NPM_VM_OFFLINE forbids the registry.`);
			const { transport, config } = await factory.get();
			const published = (await transport.view(candidate.version)).find((item) => item.version === candidate.version);
			if (published === void 0) throw new require_messages.NpmVmError("M-INTEGRITY", require_messages.EXIT.verification, require_messages.integrityMessage(candidate.integrity, "nothing", `the registry no longer serves npm ${candidate.version}`));
			const work = newWorkDir(context.dirs.tmp);
			try {
				return await installTarball(selection, {
					file: (await transport.pack(candidate.version, work)).file,
					published,
					publishedAt: async () => (await transport.times())[candidate.version] ?? null,
					registry: config.registry
				}, options.onPacked);
			} finally {
				(0, node_fs.rmSync)(work, {
					recursive: true,
					force: true
				});
			}
		}
	};
}
/** The extracted manifest is authoritative for name, version and engines (spec SEC-5). */
function checkExtracted(dir, candidate, nodeVersion) {
	let pkg;
	try {
		pkg = JSON.parse((0, node_fs.readFileSync)((0, node_path.join)(dir, "package.json"), "utf8"));
	} catch (error) {
		throw new require_messages.NpmVmError("M-INTEGRITY", require_messages.EXIT.verification, require_messages.integrityMessage("npm package.json", "unreadable", error.message));
	}
	if (pkg["name"] !== "npm" || pkg["version"] !== candidate.version) throw new require_messages.NpmVmError("M-INTEGRITY", require_messages.EXIT.verification, require_messages.integrityMessage(`npm@${candidate.version}`, `${String(pkg["name"])}@${String(pkg["version"])}`, "the tarball holds a different package"));
	const engines = pkg["engines"];
	const node = typeof engines === "object" && engines !== null ? engines["node"] : void 0;
	if (typeof node === "string" && !import_semver.default.satisfies(nodeVersion, node, { includePrerelease: true })) throw new require_messages.NpmVmError("M-ENGINE", require_messages.EXIT.resolution, require_messages.engineMessage(candidate.version, node, nodeVersion));
}
//#endregion
Object.defineProperty(exports, "SpecError", {
	enumerable: true,
	get: function() {
		return SpecError;
	}
});
Object.defineProperty(exports, "Transport", {
	enumerable: true,
	get: function() {
		return Transport;
	}
});
Object.defineProperty(exports, "createContext", {
	enumerable: true,
	get: function() {
		return createContext;
	}
});
Object.defineProperty(exports, "createInstaller", {
	enumerable: true,
	get: function() {
		return createInstaller;
	}
});
Object.defineProperty(exports, "fileDigests", {
	enumerable: true,
	get: function() {
		return fileDigests;
	}
});
Object.defineProperty(exports, "findOwnNpm", {
	enumerable: true,
	get: function() {
		return findOwnNpm;
	}
});
Object.defineProperty(exports, "install_exports", {
	enumerable: true,
	get: function() {
		return install_exports;
	}
});
Object.defineProperty(exports, "lastUsed", {
	enumerable: true,
	get: function() {
		return lastUsed;
	}
});
Object.defineProperty(exports, "listEntries", {
	enumerable: true,
	get: function() {
		return listEntries;
	}
});
Object.defineProperty(exports, "loadKeyring", {
	enumerable: true,
	get: function() {
		return loadKeyring;
	}
});
Object.defineProperty(exports, "loadNpmConfig", {
	enumerable: true,
	get: function() {
		return loadNpmConfig;
	}
});
Object.defineProperty(exports, "newWorkDir", {
	enumerable: true,
	get: function() {
		return newWorkDir;
	}
});
Object.defineProperty(exports, "ownNpmSatisfies", {
	enumerable: true,
	get: function() {
		return ownNpmSatisfies;
	}
});
Object.defineProperty(exports, "parseSpecs", {
	enumerable: true,
	get: function() {
		return parseSpecs;
	}
});
Object.defineProperty(exports, "parseVersionSpec", {
	enumerable: true,
	get: function() {
		return parseVersionSpec;
	}
});
Object.defineProperty(exports, "pruneCache", {
	enumerable: true,
	get: function() {
		return pruneCache;
	}
});
Object.defineProperty(exports, "readVerified", {
	enumerable: true,
	get: function() {
		return readVerified;
	}
});
Object.defineProperty(exports, "safeExtract", {
	enumerable: true,
	get: function() {
		return safeExtract;
	}
});
Object.defineProperty(exports, "selectCandidate", {
	enumerable: true,
	get: function() {
		return selectCandidate;
	}
});
Object.defineProperty(exports, "stagingDir", {
	enumerable: true,
	get: function() {
		return stagingDir;
	}
});
Object.defineProperty(exports, "transportUsable", {
	enumerable: true,
	get: function() {
		return transportUsable;
	}
});
Object.defineProperty(exports, "verifySignatures", {
	enumerable: true,
	get: function() {
		return verifySignatures;
	}
});
