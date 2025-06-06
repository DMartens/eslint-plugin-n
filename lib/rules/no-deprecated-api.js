/**
 * @author Toru Nagashima
 * See LICENSE file in root directory for full license.
 */
"use strict"

const {
    CALL,
    CONSTRUCT,
    READ,
    ReferenceTracker,
} = require("@eslint-community/eslint-utils")
const enumeratePropertyNames = require("../util/enumerate-property-names")
const getConfiguredNodeVersion = require("../util/get-configured-node-version")
const getSemverRange = require("../util/get-semver-range")
const extendTrackmapWithNodePrefix = require("../util/extend-trackmap-with-node-prefix")
const unprefixNodeColon = require("../util/unprefix-node-colon")
const { getScope } = require("../util/eslint-compat")

/** @typedef {import('../unsupported-features/types.js').DeprecatedInfo} DeprecatedInfo */
/**
 * @typedef ParsedOptions
 * @property {import('semver').Range} version
 * @property {Set<string>} ignoredGlobalItems
 * @property {Set<string>} ignoredModuleItems
 */
/** @type {import('../unsupported-features/types.js').DeprecatedInfoTraceMap} */
const rawModules = {
    _linklist: {
        [READ]: { since: "5.0.0", replacedBy: null },
    },

    _stream_wrap: {
        [READ]: { since: "12.0.0", replacedBy: null },
    },

    async_hooks: {
        currentId: {
            [READ]: {
                since: "8.2.0",
                replacedBy: [
                    {
                        name: "'async_hooks.executionAsyncId()'",
                        supported: "8.1.0",
                    },
                ],
            },
        },
        triggerId: {
            [READ]: {
                since: "8.2.0",
                replacedBy: "'async_hooks.triggerAsyncId()'",
            },
        },
    },
    buffer: {
        Buffer: {
            [CONSTRUCT]: {
                since: "6.0.0",
                replacedBy: [
                    { name: "'buffer.Buffer.alloc()'", supported: "5.10.0" },
                    { name: "'buffer.Buffer.from()'", supported: "5.10.0" },
                ],
            },
            [CALL]: {
                since: "6.0.0",
                replacedBy: [
                    { name: "'buffer.Buffer.alloc()'", supported: "5.10.0" },
                    { name: "'buffer.Buffer.from()'", supported: "5.10.0" },
                ],
            },
        },
        SlowBuffer: {
            [READ]: {
                since: "6.0.0",
                replacedBy: [
                    {
                        name: "'buffer.Buffer.allocUnsafeSlow()'",
                        supported: "5.12.0",
                    },
                ],
            },
        },
    },
    constants: {
        [READ]: {
            since: "6.3.0",
            replacedBy: "'constants' property of each module",
        },
    },
    crypto: {
        _toBuf: {
            [READ]: { since: "11.0.0", replacedBy: null },
        },
        Credentials: {
            [READ]: { since: "0.12.0", replacedBy: "'tls.SecureContext'" },
        },
        DEFAULT_ENCODING: {
            [READ]: { since: "10.0.0", replacedBy: null },
        },
        createCipher: {
            [READ]: {
                since: "10.0.0",
                replacedBy: [
                    { name: "'crypto.createCipheriv()'", supported: "0.1.94" },
                ],
            },
        },
        createCredentials: {
            [READ]: {
                since: "0.12.0",
                replacedBy: [
                    {
                        name: "'tls.createSecureContext()'",
                        supported: "0.11.13",
                    },
                ],
            },
        },
        createDecipher: {
            [READ]: {
                since: "10.0.0",
                replacedBy: [
                    {
                        name: "'crypto.createDecipheriv()'",
                        supported: "0.1.94",
                    },
                ],
            },
        },
        fips: {
            [READ]: {
                since: "10.0.0",
                replacedBy: [
                    {
                        name: "'crypto.getFips()' and 'crypto.setFips()'",
                        supported: "10.0.0",
                    },
                ],
            },
        },
        prng: {
            [READ]: {
                since: "11.0.0",
                replacedBy: [
                    { name: "'crypto.randomBytes()'", supported: "0.5.8" },
                ],
            },
        },
        pseudoRandomBytes: {
            [READ]: {
                since: "11.0.0",
                replacedBy: [
                    { name: "'crypto.randomBytes()'", supported: "0.5.8" },
                ],
            },
        },
        rng: {
            [READ]: {
                since: "11.0.0",
                replacedBy: [
                    { name: "'crypto.randomBytes()'", supported: "0.5.8" },
                ],
            },
        },
    },
    domain: {
        [READ]: { since: "4.0.0", replacedBy: null },
    },
    events: {
        EventEmitter: {
            listenerCount: {
                [READ]: {
                    since: "4.0.0",
                    replacedBy: [
                        {
                            name: "'events.EventEmitter#listenerCount()'",
                            supported: "3.2.0",
                        },
                    ],
                },
            },
        },
        listenerCount: {
            [READ]: {
                since: "4.0.0",
                replacedBy: [
                    {
                        name: "'events.EventEmitter#listenerCount()'",
                        supported: "3.2.0",
                    },
                ],
            },
        },
    },
    freelist: {
        [READ]: { since: "4.0.0", replacedBy: null },
    },
    fs: {
        SyncWriteStream: {
            [READ]: { since: "4.0.0", replacedBy: null },
        },
        exists: {
            [READ]: {
                since: "4.0.0",
                replacedBy: [
                    { name: "'fs.stat()'", supported: "0.0.2" },
                    { name: "'fs.access()'", supported: "0.11.15" },
                ],
            },
        },
        lchmod: {
            [READ]: { since: "0.4.0", replacedBy: null },
        },
        lchmodSync: {
            [READ]: { since: "0.4.0", replacedBy: null },
        },
    },
    http: {
        createClient: {
            [READ]: {
                since: "0.10.0",
                replacedBy: [{ name: "'http.request()'", supported: "0.3.6" }],
            },
        },
    },
    module: {
        Module: {
            createRequireFromPath: {
                [READ]: {
                    since: "12.2.0",
                    replacedBy: [
                        {
                            name: "'module.createRequire()'",
                            supported: "12.2.0",
                        },
                    ],
                },
            },
            requireRepl: {
                [READ]: {
                    since: "6.0.0",
                    replacedBy: "'require(\"repl\")'",
                },
            },
            _debug: {
                [READ]: { since: "9.0.0", replacedBy: null },
            },
        },
        createRequireFromPath: {
            [READ]: {
                since: "12.2.0",
                replacedBy: [
                    {
                        name: "'module.createRequire()'",
                        supported: "12.2.0",
                    },
                ],
            },
        },
        requireRepl: {
            [READ]: {
                since: "6.0.0",
                replacedBy: "'require(\"repl\")'",
            },
        },
        _debug: {
            [READ]: { since: "9.0.0", replacedBy: null },
        },
    },
    net: {
        _setSimultaneousAccepts: {
            [READ]: { since: "12.0.0", replacedBy: null },
        },
    },
    os: {
        getNetworkInterfaces: {
            [READ]: {
                since: "0.6.0",
                replacedBy: [
                    { name: "'os.networkInterfaces()'", supported: "0.6.0" },
                ],
            },
        },
        tmpDir: {
            [READ]: {
                since: "7.0.0",
                replacedBy: [{ name: "'os.tmpdir()'", supported: "0.9.9" }],
            },
        },
    },
    path: {
        _makeLong: {
            [READ]: {
                since: "9.0.0",
                replacedBy: [
                    { name: "'path.toNamespacedPath()'", supported: "9.0.0" },
                ],
            },
        },
    },
    process: {
        EventEmitter: {
            [READ]: {
                since: "0.6.0",
                replacedBy: "'require(\"events\")'",
            },
        },
        assert: {
            [READ]: {
                since: "10.0.0",
                replacedBy: "'require(\"assert\")'",
            },
        },
        binding: {
            [READ]: { since: "10.9.0", replacedBy: null },
        },
        env: {
            NODE_REPL_HISTORY_FILE: {
                [READ]: {
                    since: "4.0.0",
                    replacedBy: "'NODE_REPL_HISTORY'",
                },
            },
        },
        report: {
            triggerReport: {
                [READ]: {
                    since: "11.12.0",
                    replacedBy: "'process.report.writeReport()'",
                },
            },
        },
    },
    punycode: {
        [READ]: {
            since: "7.0.0",
            replacedBy: "'https://www.npmjs.com/package/punycode'",
        },
    },
    readline: {
        codePointAt: {
            [READ]: { since: "4.0.0", replacedBy: null },
        },
        getStringWidth: {
            [READ]: { since: "6.0.0", replacedBy: null },
        },
        isFullWidthCodePoint: {
            [READ]: { since: "6.0.0", replacedBy: null },
        },
        stripVTControlCharacters: {
            [READ]: { since: "6.0.0", replacedBy: null },
        },
    },
    repl: {
        REPLServer: {
            [READ]: { since: "22.9.0", replacedBy: "new repl.REPLServer()" },
        },
        Recoverable: {
            [READ]: { since: "22.9.0", replacedBy: "new repl.Recoverable()" },
        },
        REPL_MODE_MAGIC: {
            [READ]: { since: "8.0.0", replacedBy: null },
        },
    },
    // safe-buffer.Buffer function/constructror is just a re-export of buffer.Buffer
    // and should be deprecated likewise.
    "safe-buffer": {
        Buffer: {
            [CONSTRUCT]: {
                since: "6.0.0",
                replacedBy: [
                    { name: "'buffer.Buffer.alloc()'", supported: "5.10.0" },
                    { name: "'buffer.Buffer.from()'", supported: "5.10.0" },
                ],
            },
            [CALL]: {
                since: "6.0.0",
                replacedBy: [
                    { name: "'buffer.Buffer.alloc()'", supported: "5.10.0" },
                    { name: "'buffer.Buffer.from()'", supported: "5.10.0" },
                ],
            },
        },
        SlowBuffer: {
            [READ]: {
                since: "6.0.0",
                replacedBy: [
                    {
                        name: "'buffer.Buffer.allocUnsafeSlow()'",
                        supported: "5.12.0",
                    },
                ],
            },
        },
    },
    sys: {
        [READ]: {
            since: "0.3.0",
            replacedBy: "'util' module",
        },
    },
    timers: {
        enroll: {
            [READ]: {
                since: "10.0.0",
                replacedBy: [
                    { name: "'setTimeout()'", supported: "0.0.1" },
                    { name: "'setInterval()'", supported: "0.0.1" },
                ],
            },
        },
        unenroll: {
            [READ]: {
                since: "10.0.0",
                replacedBy: [
                    { name: "'clearTimeout()'", supported: "0.0.1" },
                    { name: "'clearInterval()'", supported: "0.0.1" },
                ],
            },
        },
    },
    tls: {
        CleartextStream: {
            [READ]: { since: "0.10.0", replacedBy: null },
        },
        CryptoStream: {
            [READ]: {
                since: "0.12.0",
                replacedBy: [{ name: "'tls.TLSSocket'", supported: "0.11.4" }],
            },
        },
        SecurePair: {
            [READ]: {
                since: "6.0.0",
                replacedBy: [{ name: "'tls.TLSSocket'", supported: "0.11.4" }],
            },
        },
        convertNPNProtocols: {
            [READ]: { since: "10.0.0", replacedBy: null },
        },
        createSecurePair: {
            [READ]: {
                since: "6.0.0",
                replacedBy: [{ name: "'tls.TLSSocket'", supported: "0.11.4" }],
            },
        },
        parseCertString: {
            [READ]: {
                since: "8.6.0",
                replacedBy: [
                    { name: "'querystring.parse()'", supported: "0.1.25" },
                ],
            },
        },
    },
    tty: {
        setRawMode: {
            [READ]: {
                since: "0.10.0",
                replacedBy:
                    "'tty.ReadStream#setRawMode()' (e.g. 'process.stdin.setRawMode()')",
            },
        },
    },
    url: {
        parse: {
            [READ]: {
                since: "11.0.0",
                replacedBy: [
                    { name: "'url.URL' constructor", supported: "6.13.0" },
                ],
            },
        },
        resolve: {
            [READ]: {
                since: "11.0.0",
                replacedBy: [
                    { name: "'url.URL' constructor", supported: "6.13.0" },
                ],
            },
        },
    },
    util: {
        debug: {
            [READ]: {
                since: "0.12.0",
                replacedBy: [
                    { name: "'console.error()'", supported: "0.1.100" },
                ],
            },
        },
        error: {
            [READ]: {
                since: "0.12.0",
                replacedBy: [
                    { name: "'console.error()'", supported: "0.1.100" },
                ],
            },
        },
        isArray: {
            [READ]: {
                since: "4.0.0",
                replacedBy: [
                    { name: "'Array.isArray()'", supported: "0.1.100" },
                ],
            },
        },
        isBoolean: {
            [READ]: { since: "4.0.0", replacedBy: null },
        },
        isBuffer: {
            [READ]: {
                since: "4.0.0",
                replacedBy: [
                    { name: "'Buffer.isBuffer()'", supported: "0.1.101" },
                ],
            },
        },
        isDate: {
            [READ]: { since: "4.0.0", replacedBy: null },
        },
        isError: {
            [READ]: { since: "4.0.0", replacedBy: null },
        },
        isFunction: {
            [READ]: { since: "4.0.0", replacedBy: null },
        },
        isNull: {
            [READ]: { since: "4.0.0", replacedBy: null },
        },
        isNullOrUndefined: {
            [READ]: { since: "4.0.0", replacedBy: null },
        },
        isNumber: {
            [READ]: { since: "4.0.0", replacedBy: null },
        },
        isObject: {
            [READ]: { since: "4.0.0", replacedBy: null },
        },
        isPrimitive: {
            [READ]: { since: "4.0.0", replacedBy: null },
        },
        isRegExp: {
            [READ]: { since: "4.0.0", replacedBy: null },
        },
        isString: {
            [READ]: { since: "4.0.0", replacedBy: null },
        },
        isSymbol: {
            [READ]: { since: "4.0.0", replacedBy: null },
        },
        isUndefined: {
            [READ]: { since: "4.0.0", replacedBy: null },
        },
        log: {
            [READ]: { since: "6.0.0", replacedBy: "a third party module" },
        },
        print: {
            [READ]: {
                since: "0.12.0",
                replacedBy: [{ name: "'console.log()'", supported: "0.1.100" }],
            },
        },
        pump: {
            [READ]: {
                since: "0.10.0",
                replacedBy: [
                    { name: "'stream.Readable#pipe()'", supported: "0.9.4" },
                ],
            },
        },
        puts: {
            [READ]: {
                since: "0.12.0",
                replacedBy: [{ name: "'console.log()'", supported: "0.1.100" }],
            },
        },
        _extend: {
            [READ]: {
                since: "6.0.0",
                replacedBy: [{ name: "'Object.assign()'", supported: "4.0.0" }],
            },
        },
    },
    vm: {
        runInDebugContext: {
            [READ]: { since: "8.0.0", replacedBy: null },
        },
    },
    zlib: {
        BrotliCompress: {
            [CALL]: {
                since: "22.9.0",
                replacedBy: "new zlib.BrotliCompress()",
            },
        },
        BrotliDecompress: {
            [CALL]: {
                since: "22.9.0",
                replacedBy: "new zlib.BrotliDecompress()",
            },
        },
        Deflate: {
            [CALL]: { since: "22.9.0", replacedBy: "new zlib.Deflate()" },
        },
        DeflateRaw: {
            [CALL]: { since: "22.9.0", replacedBy: "new zlib.DeflateRaw()" },
        },
        Gunzip: {
            [CALL]: { since: "22.9.0", replacedBy: "new zlib.Gunzip()" },
        },
        Gzip: {
            [CALL]: { since: "22.9.0", replacedBy: "new zlib.Gzip()" },
        },
        Inflate: {
            [CALL]: { since: "22.9.0", replacedBy: "new zlib.Inflate()" },
        },
        InflateRaw: {
            [CALL]: { since: "22.9.0", replacedBy: "new zlib.InflateRaw()" },
        },
        Unzip: {
            [CALL]: { since: "22.9.0", replacedBy: "new zlib.Unzip()" },
        },
    },
}
const modules = extendTrackmapWithNodePrefix(rawModules)

/** @type {import('../unsupported-features/types.js').DeprecatedInfoTraceMap} */
const globals = {
    Buffer: {
        [CONSTRUCT]: {
            since: "6.0.0",
            replacedBy: [
                { name: "'Buffer.alloc()'", supported: "5.10.0" },
                { name: "'Buffer.from()'", supported: "5.10.0" },
            ],
        },
        [CALL]: {
            since: "6.0.0",
            replacedBy: [
                { name: "'Buffer.alloc()'", supported: "5.10.0" },
                { name: "'Buffer.from()'", supported: "5.10.0" },
            ],
        },
    },
    COUNTER_NET_SERVER_CONNECTION: {
        [READ]: { since: "11.0.0", replacedBy: null },
    },
    COUNTER_NET_SERVER_CONNECTION_CLOSE: {
        [READ]: { since: "11.0.0", replacedBy: null },
    },
    COUNTER_HTTP_SERVER_REQUEST: {
        [READ]: { since: "11.0.0", replacedBy: null },
    },
    COUNTER_HTTP_SERVER_RESPONSE: {
        [READ]: { since: "11.0.0", replacedBy: null },
    },
    COUNTER_HTTP_CLIENT_REQUEST: {
        [READ]: { since: "11.0.0", replacedBy: null },
    },
    COUNTER_HTTP_CLIENT_RESPONSE: {
        [READ]: { since: "11.0.0", replacedBy: null },
    },
    GLOBAL: {
        [READ]: {
            since: "6.0.0",
            replacedBy: [{ name: "'global'", supported: "0.1.27" }],
        },
    },
    Intl: {
        v8BreakIterator: {
            [READ]: { since: "7.0.0", replacedBy: null, removed: "9.0.0" },
        },
    },
    require: {
        extensions: {
            [READ]: {
                since: "0.12.0",
                replacedBy: "compiling them ahead of time",
            },
        },
    },
    root: {
        [READ]: {
            since: "6.0.0",
            replacedBy: [{ name: "'global'", supported: "0.1.27" }],
        },
    },
    process: modules.process,
}

/**
 * Makes a replacement message.
 *
 * @param {DeprecatedInfo["replacedBy"]} replacedBy - The text of substitute way.
 * @param {import('semver').Range} version - The configured version range
 * @returns {string} Replacement message.
 */
function toReplaceMessage(replacedBy, version) {
    let message = replacedBy

    if (Array.isArray(replacedBy)) {
        message = replacedBy
            .filter(({ supported }) => {
                const range = getSemverRange(`<${supported}`)
                if (range == null) {
                    return false
                }

                return !version.intersects(range)
            })
            .map(({ name }) => name)
            .join(" or ")
    }

    return message ? `. Use ${message} instead` : ""
}

/**
 * Convert a given path to name.
 * @param {symbol} type The report type.
 * @param {string[]} path The property access path.
 * @returns {string} The name.
 */
function toName(type, path) {
    const baseName = unprefixNodeColon(path.join("."))
    return type === ReferenceTracker.CALL
        ? `${baseName}()`
        : type === ReferenceTracker.CONSTRUCT
          ? `new ${baseName}()`
          : baseName
}

/**
 * Parses the options.
 * @param {import('eslint').Rule.RuleContext} context The rule context.
 * @returns {ParsedOptions} Parsed options
 */
function parseOptions(context) {
    const raw = /** @type {{
        ignoreModuleItems?: string[];
        ignoreGlobalItems?: string[];
    }} */ (context.options[0] || {})
    const version = getConfiguredNodeVersion(context)
    const ignoredModuleItems = new Set(raw.ignoreModuleItems || [])
    const ignoredGlobalItems = new Set(raw.ignoreGlobalItems || [])

    return Object.freeze({ version, ignoredGlobalItems, ignoredModuleItems })
}

/** @type {import('./rule-module').RuleModule} */
module.exports = {
    meta: {
        docs: {
            description: "disallow deprecated APIs",
            recommended: true,
            url: "https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/no-deprecated-api.md",
        },
        type: "problem",
        fixable: null,
        schema: [
            {
                type: "object",
                properties: {
                    version: getConfiguredNodeVersion.schema,
                    ignoreModuleItems: {
                        type: "array",
                        items: {
                            enum: Array.from(
                                enumeratePropertyNames(rawModules)
                            ),
                        },
                        additionalItems: false,
                        uniqueItems: true,
                    },
                    ignoreGlobalItems: {
                        type: "array",
                        items: {
                            enum: Array.from(enumeratePropertyNames(globals)),
                        },
                        additionalItems: false,
                        uniqueItems: true,
                    },

                    // Deprecated since v4.2.0
                    ignoreIndirectDependencies: { type: "boolean" },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            deprecated:
                "{{name}} was deprecated since v{{version}}{{replace}}.",
            removed:
                "{{name}} was deprecated since v{{version}}, and removed in v{{removed}}.",
        },
    },
    create(context) {
        const { ignoredModuleItems, ignoredGlobalItems, version } =
            parseOptions(context)

        /**
         * Reports a use of a deprecated API.
         *
         * @param {import('estree').Node} node - A node to report.
         * @param {string} name - The name of a deprecated API.
         * @param {DeprecatedInfo} info - Information of the API.
         * @returns {void}
         */
        function reportItem(node, name, info) {
            const messageId = info.removed ? "removed" : "deprecated"
            const data = {
                name,
                version: info.since,
                removed: info.removed || "",
                replace: toReplaceMessage(info.replacedBy, version),
            }

            context.report({
                node,
                messageId,
                data,
            })
        }

        return {
            "Program:exit"() {
                const scope = getScope(context)

                const tracker = new ReferenceTracker(scope, {
                    mode: "legacy",
                })

                for (const report of tracker.iterateGlobalReferences(globals)) {
                    const { node, path, type, info } = report
                    const name = toName(type, path)

                    if (!ignoredGlobalItems.has(name)) {
                        reportItem(node, `'${name}'`, info)
                    }
                }
                for (const report of [
                    ...tracker.iterateCjsReferences(modules),
                    ...tracker.iterateEsmReferences(modules),
                ]) {
                    const { node, path, type, info } = report
                    const name = toName(type, path)
                    const suffix = path.length === 1 ? " module" : ""

                    if (!ignoredModuleItems.has(name)) {
                        reportItem(node, `'${name}'${suffix}`, info)
                    }
                }
            },
        }
    },
}
