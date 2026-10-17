//#region src/errors.ts
/** Exit codes of `npm-vm` itself and of the shim before npm starts (spec section 10). */
const EXIT = {
	ok: 0,
	problems: 1,
	partial: 2,
	resolution: 3,
	transport: 4,
	verification: 5,
	abi: 6,
	usage: 64
};
/** A failure with a message id from spec section 12 and the exit code it maps to. */
var NpmVmError = class extends Error {
	name = "NpmVmError";
	id;
	exitCode;
	constructor(id, exitCode, message) {
		super(message);
		this.id = id;
		this.exitCode = exitCode;
	}
};
function isNpmVmError(error) {
	return error instanceof NpmVmError;
}
//#endregion
//#region src/messages.ts
/** Message builders for spec section 12; every message names the cause and one fix. */
/** Every URL in `text` with its user info replaced, so a registry token never reaches a terminal (spec SEC-10). */
function redactUrls(text) {
	return text.replace(/\b([a-z][a-z0-9+.-]*:\/\/)([^\s/]*)@/gi, "$1***@");
}
function describeSpecs(specs) {
	return specs.map((spec) => spec.hash ? `${spec.exact}+${spec.hash.algorithm}.${spec.hash.hex.slice(0, 8)}…` : spec.range).join(" or ");
}
function engineMessage(version, enginesNode, nodeVersion) {
	return [`npm ${version} needs Node ${enginesNode}, but the active Node is ${nodeVersion}.`, `Switch Node with \`nvm install <version>\` or \`fnm use <version>\`, or relax the npm range in package.json.`].join("\n");
}
function noMatchMessage(specs, file, reason) {
	return [`No npm version satisfies ${describeSpecs(specs)} (${file}): ${reason}.`, `Run \`npm-vm which\` to see the resolution.`].join("\n");
}
function transportMessage(ownVersion, detail) {
	return [`Cannot download npm: ${ownVersion === null ? "no npm beside the active Node" : `Node's own npm ${ownVersion}`} (${detail}); npm 8 or newer is needed as the transport.`, `Reinstall Node or run \`npm-vm install <version>\` from a Node whose npm works.`].join("\n");
}
function keyMessage(keyid) {
	return [`The registry signed npm with key ${keyid}, which npm-vm does not know.`, `Run \`npm-vm self-update\` to pick up new registry keys.`].join("\n");
}
function unsignedMessage(registry, version) {
	return [`${redactUrls(registry)} serves npm ${version} without a registry signature.`, `Pin a tarball hash in devEngines.packageManager (\`${version}+sha512.<hex>\`) to allow unsigned registries.`].join("\n");
}
function integrityMessage(expected, actual, detail) {
	return [`npm tarball verification failed: ${detail}.`, `Expected ${expected}, got ${actual}. Clear the entry with \`npm-vm cache prune\` and retry.`].join("\n");
}
function abiMessage(detail) {
	return [`npm-vm launcher mismatch: ${detail}.`, `Run \`npx --prefix ~ -y @mawesome/npm-vm setup\` to reinstall the launchers.`].join("\n");
}
/** M-LOCKED: names the file, the holder, and the one recovery that is safe for where the holder runs. */
function lockedMessage(path, holder, live, foreign) {
	if (holder === null) return `${path} is locked by an unreadable owner. If no npm-vm command is running, delete that file and retry.`;
	const who = `PID ${holder.pid} on ${holder.host} since ${holder.createdAt || "an unknown time"}`;
	if (foreign) return [`${path} is locked by ${who}, which cannot be verified from this machine.`, `Confirm on ${holder.host} that no npm-vm command runs, then delete ${path} and retry.`].join("\n");
	if (live) return `${path} is locked by ${who}, which is still running. Wait for it to finish and retry.`;
	return `${path} is locked by ${who}, which is no longer running. Delete ${path} and retry.`;
}
function provenanceMessage(name, version, detail) {
	return [`${name}@${version} failed provenance verification: ${detail}.`, "The installed version is unchanged. Retry later, or install the release by hand after checking it at https://www.npmjs.com/package/@mawesome/npm-vm."].join("\n");
}
function dirPermsMessage(dir, problem, fix) {
	return [`${dir} ${problem}.`, `Run \`${fix}\` and retry, or point NPM_VM_HOME at a private directory.`].join("\n");
}
function changedMessage(file, what) {
	return `${file} changed since npm-vm wrote it; left untouched. Remove the ${what} by hand if you still want it gone.`;
}
function restartMessage() {
	return "Restart open terminals and IDEs so they pick up the new PATH.";
}
//#endregion
Object.defineProperty(exports, "EXIT", {
	enumerable: true,
	get: function() {
		return EXIT;
	}
});
Object.defineProperty(exports, "NpmVmError", {
	enumerable: true,
	get: function() {
		return NpmVmError;
	}
});
Object.defineProperty(exports, "abiMessage", {
	enumerable: true,
	get: function() {
		return abiMessage;
	}
});
Object.defineProperty(exports, "changedMessage", {
	enumerable: true,
	get: function() {
		return changedMessage;
	}
});
Object.defineProperty(exports, "dirPermsMessage", {
	enumerable: true,
	get: function() {
		return dirPermsMessage;
	}
});
Object.defineProperty(exports, "engineMessage", {
	enumerable: true,
	get: function() {
		return engineMessage;
	}
});
Object.defineProperty(exports, "integrityMessage", {
	enumerable: true,
	get: function() {
		return integrityMessage;
	}
});
Object.defineProperty(exports, "isNpmVmError", {
	enumerable: true,
	get: function() {
		return isNpmVmError;
	}
});
Object.defineProperty(exports, "keyMessage", {
	enumerable: true,
	get: function() {
		return keyMessage;
	}
});
Object.defineProperty(exports, "lockedMessage", {
	enumerable: true,
	get: function() {
		return lockedMessage;
	}
});
Object.defineProperty(exports, "noMatchMessage", {
	enumerable: true,
	get: function() {
		return noMatchMessage;
	}
});
Object.defineProperty(exports, "provenanceMessage", {
	enumerable: true,
	get: function() {
		return provenanceMessage;
	}
});
Object.defineProperty(exports, "redactUrls", {
	enumerable: true,
	get: function() {
		return redactUrls;
	}
});
Object.defineProperty(exports, "restartMessage", {
	enumerable: true,
	get: function() {
		return restartMessage;
	}
});
Object.defineProperty(exports, "transportMessage", {
	enumerable: true,
	get: function() {
		return transportMessage;
	}
});
Object.defineProperty(exports, "unsignedMessage", {
	enumerable: true,
	get: function() {
		return unsignedMessage;
	}
});
