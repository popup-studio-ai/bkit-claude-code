/**
 * Fixture MCP server for testing CO-2.1 MCP deprecation schema parsing.
 *
 * This is NOT a real server — it only declares 4 tool definitions in
 * the format that parseMCPToolBlocks() recognizes:
 *
 *   - bkit_active_tool        (active, no deprecation)
 *   - bkit_deprecated_simple  (// @deprecated since v1.0.0)
 *   - bkit_deprecated_full    (// @deprecated since v1.5.0 replacedBy=bkit_active_tool ...)
 *   - bkit_deprecated_jsdoc   (block-comment style: * @deprecated since v2.0.0 replacedBy=bkit_active_tool)
 */

const tools = [
  {
    name: 'bkit_active_tool',
    description: 'An active tool — no deprecation annotation.',
    inputSchema: { type: 'object' },
  },

  // @deprecated since v1.0.0
  {
    name: 'bkit_deprecated_simple',
    description: 'Simple deprecation — only since version.',
    inputSchema: { type: 'object' },
  },

  // @deprecated since v1.5.0 replacedBy=bkit_active_tool reason="superseded"
  {
    name: 'bkit_deprecated_full',
    description: 'Full deprecation — since + replacedBy + reason.',
    inputSchema: { type: 'object' },
  },

  /**
   * @deprecated since v2.0.0 replacedBy=bkit_active_tool
   * Block-comment style annotation.
   */
  {
    name: 'bkit_deprecated_jsdoc',
    description: 'Block-comment deprecation annotation.',
    inputSchema: { type: 'object' },
  },
];

module.exports = { tools };
