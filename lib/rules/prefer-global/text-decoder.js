/**
 * @author Toru Nagashima
 * See LICENSE file in root directory for full license.
 */
"use strict"

const { READ } = require("@eslint-community/eslint-utils")
const checkForPreferGlobal = require("../../util/check-prefer-global")

const traceMap = {
    globals: {
        TextDecoder: { [READ]: true },
    },
    modules: {
        util: { TextDecoder: { [READ]: true } },
        "node:util": { TextDecoder: { [READ]: true } },
    },
}

/** @type {import('../rule-module').RuleModule} */
module.exports = {
    meta: {
        docs: {
            description:
                'enforce either `TextDecoder` or `require("util").TextDecoder`',
            recommended: false,
            url: "https://github.com/eslint-community/eslint-plugin-n/blob/HEAD/docs/rules/prefer-global/text-decoder.md",
        },
        type: "suggestion",
        fixable: null,
        schema: [{ enum: ["always", "never"] }],
        messages: {
            preferGlobal:
                "Unexpected use of 'require(\"util\").TextDecoder'. Use the global variable 'TextDecoder' instead.",
            preferModule:
                "Unexpected use of the global variable 'TextDecoder'. Use 'require(\"util\").TextDecoder' instead.",
        },
    },

    create(context) {
        return {
            "Program:exit"() {
                checkForPreferGlobal(context, traceMap)
            },
        }
    },
}
