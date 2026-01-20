#!/bin/bash
# scripts/pre-write.sh
# Purpose: Unified PreToolUse hook for Write|Edit operations
# Combines: PDCA check, task classification, convention hints
# Hook: PreToolUse (Write|Edit) for bkit-rules skill

set -e

# Load common library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LIB_DIR="${SCRIPT_DIR}/../lib"

if [ -f "${LIB_DIR}/common.sh" ]; then
    source "${LIB_DIR}/common.sh"
else
    # Fallback functions if common.sh not found
    output_empty() { echo '{}'; }
    is_source_file() { return 1; }
fi

# Read input from stdin
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // ""')
CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // .tool_input.new_string // ""')
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')

# Skip if no file path
if [ -z "$FILE_PATH" ]; then
    output_empty
    exit 0
fi

# ============================================================
# Collect context messages
# ============================================================
CONTEXT_PARTS=()
SHOULD_BLOCK=false
BLOCK_REASON=""

# ------------------------------------------------------------
# 1. Task Classification (based on content size)
# ------------------------------------------------------------
CLASSIFICATION="quick_fix"
CONTENT_LENGTH=0

if [ -n "$CONTENT" ]; then
    CLASSIFICATION=$(classify_task "$CONTENT")
    CONTENT_LENGTH=${#CONTENT}

    # Only add context for significant changes
    if [ "$CLASSIFICATION" != "quick_fix" ]; then
        GUIDANCE=$(get_pdca_guidance "$CLASSIFICATION")
        CONTEXT_PARTS+=("$GUIDANCE (${CONTENT_LENGTH} chars)")
    fi
fi

# ------------------------------------------------------------
# 2. PDCA Document Check (for source files)
# ------------------------------------------------------------
FEATURE=""
DESIGN_DOC=""
PLAN_DOC=""

if is_source_file "$FILE_PATH"; then
    FEATURE=$(extract_feature "$FILE_PATH")

    if [ -n "$FEATURE" ]; then
        DESIGN_DOC=$(find_design_doc "$FEATURE")
        PLAN_DOC=$(find_plan_doc "$FEATURE")

        if [ -n "$DESIGN_DOC" ]; then
            CONTEXT_PARTS+=("PDCA: Design doc exists at ${DESIGN_DOC}. Refer during implementation.")
        elif [ -n "$PLAN_DOC" ]; then
            CONTEXT_PARTS+=("PDCA: Plan exists but no design doc. Consider /pdca-design ${FEATURE}.")
        else
            # Major feature without design doc → Block and guide
            if [ "$CLASSIFICATION" = "major_feature" ]; then
                SHOULD_BLOCK=true
                BLOCK_REASON="Major feature detected (${CONTENT_LENGTH} chars) but no design document found for '${FEATURE}'.\n\n"
                BLOCK_REASON+="Next steps:\n"
                BLOCK_REASON+="1. Run: /pdca-design ${FEATURE}\n"
                BLOCK_REASON+="2. Review the generated design document\n"
                BLOCK_REASON+="3. Then proceed with implementation\n\n"
                BLOCK_REASON+="Or if you want to proceed without design doc, reduce the change scope to under 1000 chars."
            fi
        fi
    fi
fi

# ------------------------------------------------------------
# 2.5. Block if needed (with helpful guidance)
# ------------------------------------------------------------
if [ "$SHOULD_BLOCK" = true ]; then
    output_block "$BLOCK_REASON"
    # Note: output_block() calls exit 2, so code below won't execute
fi

# ------------------------------------------------------------
# 3. Convention Hints (for code files)
# ------------------------------------------------------------
if is_code_file "$FILE_PATH"; then
    CONTEXT_PARTS+=("Convention: Components=PascalCase, Functions=camelCase, Constants=UPPER_SNAKE_CASE")
elif is_env_file "$FILE_PATH"; then
    CONTEXT_PARTS+=("Env Convention: NEXT_PUBLIC_* (client), DB_* (database), API_* (external), AUTH_* (auth)")
fi

# ============================================================
# Output combined context
# ============================================================
if [ ${#CONTEXT_PARTS[@]} -gt 0 ]; then
    # Join context parts with newlines
    COMBINED_CONTEXT=$(IFS=$'\n'; echo "${CONTEXT_PARTS[*]}")

    # Escape for JSON
    COMBINED_CONTEXT=$(echo "$COMBINED_CONTEXT" | sed 's/"/\\"/g' | tr '\n' ' ' | sed 's/ $//')

    cat << EOF
{"decision": "allow", "hookSpecificOutput": {"additionalContext": "$COMBINED_CONTEXT"}}
EOF
else
    output_empty
fi
