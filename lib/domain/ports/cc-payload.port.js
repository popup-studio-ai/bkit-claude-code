/**
 * CCPayloadPort — Type-only Port (DIP) for CC hook payload IO.
 *
 * Design Ref: bkit-v2110-integrated-enhancement.design.md §2.3
 * Plan SC: Clean Architecture Layer - Domain depends on this Port, Infrastructure implements it.
 *
 * This file is a Type-only module. Runtime export is empty ({}).
 * JSDoc typedefs below are consumed by `tsc --checkJs --noEmit` in CI.
 *
 * @module lib/domain/ports/cc-payload.port
 *
 * @version 2.1.12
 */

/**
 * @typedef {Object} HookInput
 * @property {string} [tool_name] - Name of the CC tool invoked (Write/Edit/Bash/etc.)
 * @property {Object} [tool_input] - Tool-specific arguments
 * @property {string} [session_id] - CC session identifier
 * @property {Object} [cwd] - Current working directory context
 * @property {Object} [permissions] - Permission flags (bypassPermissions, dangerouslyDisableSandbox)
 */

/**
 * @typedef {Object} HookOutput
 * CC hook output contract (S6 ENH-361 correction). `decision` and
 * `permissionDecision` are DISTINCT enums and must not be conflated:
 *   - PreToolUse  → `permissionDecision: 'allow'|'deny'|'ask'` (+ 'defer' legacy)
 *   - Stop / SubagentStop → `decision: 'approve'|'block'` (block = keep going,
 *     feeding `reason` to the model; omit/`{}` = allow clean stop). `'allow'`
 *     is NOT a valid Stop `decision` value — emitting it fails CC's strict
 *     Stop validator with `(root): Invalid input`.
 * Stop output also rejects `hookSpecificOutput` (no Stop variant) and any
 * non-schema root field. Use lib/core/io.js outputStopSurface/outputStopAllow.
 * @property {'approve'|'block'} [decision] - Stop/SubagentStop decision
 * @property {'allow'|'deny'|'ask'|'defer'} [permissionDecision] - PreToolUse decision
 * @property {string} [reason]
 * @property {string} [additionalContext] - PreToolUse/UserPromptSubmit/PostToolUse only
 * @property {Object} [updatedInput]
 * @property {string} [stopReason]
 * @property {boolean} [continue]
 * @property {string} [systemMessage]
 */

/**
 * @typedef {Object} CCPayloadPort
 * @property {() => Promise<HookInput>} read - Parse stdin JSON into HookInput
 * @property {(out: HookOutput) => void} write - Serialize HookOutput to stdout JSON
 * @property {(msg: string) => void} warn - Write warning to stderr
 */

module.exports = {};
