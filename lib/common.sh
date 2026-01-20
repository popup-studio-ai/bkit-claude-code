#!/bin/bash
# lib/common.sh
# Purpose: Shared utility functions for bkit hooks
# Usage: source "${CLAUDE_PLUGIN_ROOT}/lib/common.sh"

# ============================================================
# Configuration Loading
# ============================================================

# Find and load bkit config
BKIT_CONFIG=""
if [ -f "${CLAUDE_PROJECT_DIR:-}/bkit.config.json" ]; then
    BKIT_CONFIG="${CLAUDE_PROJECT_DIR}/bkit.config.json"
elif [ -f "bkit.config.json" ]; then
    BKIT_CONFIG="bkit.config.json"
fi

# Get config value using jq
# Usage: get_config ".pdca.thresholds.quickFix" "50"
get_config() {
    local path="$1"
    local default="$2"

    if [ -n "$BKIT_CONFIG" ] && command -v jq >/dev/null 2>&1; then
        local value=$(jq -r "$path // empty" "$BKIT_CONFIG" 2>/dev/null)
        [ -n "$value" ] && echo "$value" || echo "$default"
    else
        echo "$default"
    fi
}

# Get config array as space-separated string
# Usage: get_config_array ".sourceDirectories" "src lib app"
get_config_array() {
    local path="$1"
    local default="$2"

    if [ -n "$BKIT_CONFIG" ] && command -v jq >/dev/null 2>&1; then
        local value=$(jq -r "$path | if type == \"array\" then .[] else empty end" "$BKIT_CONFIG" 2>/dev/null | tr '\n' ' ')
        [ -n "$value" ] && echo "$value" || echo "$default"
    else
        echo "$default"
    fi
}

# ============================================================
# Source File Detection
# ============================================================

# Configurable exclude patterns (can be overridden via environment)
BKIT_EXCLUDE_PATTERNS="${BKIT_EXCLUDE_PATTERNS:-node_modules .git dist build .next __pycache__ .venv venv coverage .pytest_cache target .cargo vendor}"

# ============================================================
# Language Tier System (v1.2.1)
# ============================================================
# Tier classification based on:
# - AI tool ecosystem compatibility (Copilot, Claude, Cursor)
# - Vibe Coding optimization
# - Market share (IEEE Spectrum 2025, Stack Overflow 2025)
# - Training data availability
# - Growth potential

# Tier 1: AI-Native Essential
# - AI tool ecosystem complete (Copilot, Claude, Cursor)
# - Optimized for Vibe Coding
# - Top market share + abundant training data
TIER_1_EXTENSIONS="py pyx pyi ts tsx js jsx mjs cjs"

# Tier 2: Mainstream Recommended
# - Strong in specific domains (mobile, system, cloud)
# - Good AI tool support
# - Growing or stable market share
TIER_2_EXTENSIONS="go rs dart astro vue svelte mdx"

# Tier 3: Domain Specific
# - Platform essential (iOS, Android, Enterprise)
# - Moderate AI tool support
TIER_3_EXTENSIONS="java kt kts swift c cpp cc h hpp sh bash"

# Tier 4: Legacy/Niche
# - Maintenance purpose
# - Limited AI tool support
# - Not recommended for new projects
TIER_4_EXTENSIONS="php rb erb cs scala ex exs"

# Experimental: Future Consideration
TIER_EXPERIMENTAL_EXTENSIONS="mojo zig v"

# All supported extensions (union of all tiers)
ALL_CODE_EXTENSIONS="$TIER_1_EXTENSIONS $TIER_2_EXTENSIONS $TIER_3_EXTENSIONS $TIER_4_EXTENSIONS $TIER_EXPERIMENTAL_EXTENSIONS"

# Check if path is a source code file
# Strategy: Negative pattern (exclusion) + Extension-based detection
# Supports: JavaScript, TypeScript, Python, Go, Rust, Ruby, Java, PHP, Swift, etc.
# Usage: is_source_file "/path/to/file"
# Returns: 0 (true) or 1 (false)
is_source_file() {
    local file_path="$1"

    # 1. Check against exclude patterns (known non-source directories)
    for pattern in $BKIT_EXCLUDE_PATTERNS; do
        [[ "$file_path" == *"$pattern"* ]] && return 1
    done

    # 2. Exclude documentation and configuration files
    [[ "$file_path" == docs/* ]] && return 1
    [[ "$file_path" == *.md ]] && return 1
    [[ "$file_path" == *.json ]] && return 1
    [[ "$file_path" == *.yaml ]] && return 1
    [[ "$file_path" == *.yml ]] && return 1
    [[ "$file_path" == *.toml ]] && return 1
    [[ "$file_path" == *.lock ]] && return 1
    [[ "$file_path" == *.txt ]] && return 1

    # 3. Exclude hidden files and directories (except specific ones)
    [[ "$file_path" == .* ]] && return 1
    [[ "$file_path" == */.* ]] && return 1

    # 4. Check if it's a recognized code file extension
    is_code_file "$file_path"
}

# Check if path is a code file by extension
# Enhanced with Tier-based multi-language support (v1.2.1)
# Usage: is_code_file "/path/to/file.ts"
# Returns: 0 (true) or 1 (false)
is_code_file() {
    local file_path="$1"
    local ext="${file_path##*.}"

    # Check against all supported extensions from Tier system
    for e in $ALL_CODE_EXTENSIONS; do
        [[ "$ext" == "$e" ]] && return 0
    done

    return 1
}

# Check if path is a UI component file
# Supports: React, Vue, Svelte, Astro (v1.2.1)
# Usage: is_ui_file "/path/to/Component.tsx"
# Returns: 0 (true) or 1 (false)
is_ui_file() {
    local file_path="$1"

    # UI component extensions (framework-agnostic)
    [[ "$file_path" == *.tsx ]] || \
    [[ "$file_path" == *.jsx ]] || \
    [[ "$file_path" == *.vue ]] || \
    [[ "$file_path" == *.svelte ]] || \
    [[ "$file_path" == *.astro ]]
}

# Check if path is an environment file
# Usage: is_env_file "/path/to/.env.local"
# Returns: 0 (true) or 1 (false)
is_env_file() {
    local file_path="$1"
    [[ "$file_path" == *.env* ]] || [[ "$file_path" == .env* ]]
}

# ============================================================
# Tier Detection Functions (v1.2.1)
# ============================================================

# Get language tier for a file
# Usage: get_language_tier "/path/to/file.ts"
# Output: "1" | "2" | "3" | "4" | "experimental" | "unknown"
get_language_tier() {
    local file_path="$1"
    local ext="${file_path##*.}"

    # Check each tier
    for e in $TIER_1_EXTENSIONS; do
        [[ "$ext" == "$e" ]] && echo "1" && return 0
    done

    for e in $TIER_2_EXTENSIONS; do
        [[ "$ext" == "$e" ]] && echo "2" && return 0
    done

    for e in $TIER_3_EXTENSIONS; do
        [[ "$ext" == "$e" ]] && echo "3" && return 0
    done

    for e in $TIER_4_EXTENSIONS; do
        [[ "$ext" == "$e" ]] && echo "4" && return 0
    done

    for e in $TIER_EXPERIMENTAL_EXTENSIONS; do
        [[ "$ext" == "$e" ]] && echo "experimental" && return 0
    done

    echo "unknown"
}

# Get tier description
# Usage: get_tier_description "1"
# Output: "AI-Native Essential"
get_tier_description() {
    local tier="$1"

    case "$tier" in
        1) echo "AI-Native Essential" ;;
        2) echo "Mainstream Recommended" ;;
        3) echo "Domain Specific" ;;
        4) echo "Legacy/Niche" ;;
        experimental) echo "Experimental" ;;
        *) echo "Unknown" ;;
    esac
}

# Get PDCA recommendation based on tier
# Usage: get_tier_pdca_guidance "1"
get_tier_pdca_guidance() {
    local tier="$1"

    case "$tier" in
        1)
            echo "Tier 1 (AI-Native): Full PDCA support. Vibe coding optimized."
            ;;
        2)
            echo "Tier 2 (Mainstream): PDCA recommended. Good AI tool compatibility."
            ;;
        3)
            echo "Tier 3 (Domain): PDCA supported. Platform-specific considerations apply."
            ;;
        4)
            echo "Tier 4 (Legacy): Basic PDCA. Consider migration to Tier 1-2."
            ;;
        experimental)
            echo "Experimental: Limited PDCA support. Use with caution."
            ;;
        *)
            echo ""
            ;;
    esac
}

# Check if file is in a specific tier
# Usage: is_tier_1 "/path/to/file.ts"
is_tier_1() {
    [[ "$(get_language_tier "$1")" == "1" ]]
}

is_tier_2() {
    [[ "$(get_language_tier "$1")" == "2" ]]
}

is_tier_3() {
    [[ "$(get_language_tier "$1")" == "3" ]]
}

is_tier_4() {
    [[ "$(get_language_tier "$1")" == "4" ]]
}

is_experimental_tier() {
    [[ "$(get_language_tier "$1")" == "experimental" ]]
}

# ============================================================
# Feature Detection
# ============================================================

# Configurable feature directory patterns (can be overridden via environment)
BKIT_FEATURE_PATTERNS="${BKIT_FEATURE_PATTERNS:-features modules packages apps services domains}"

# Extract feature name from file path
# Supports: Next.js, Python (Django/FastAPI), Go, Ruby, Monorepo structures
# Usage: extract_feature "/src/features/auth/login.ts"
# Output: "auth"
extract_feature() {
    local file_path="$1"
    local feature=""

    # 1. Try configured feature patterns first
    for pattern in $BKIT_FEATURE_PATTERNS; do
        if [[ "$file_path" == *"$pattern"/* ]]; then
            feature=$(echo "$file_path" | sed -n "s/.*$pattern\/\([^\/]*\).*/\1/p")
            [ -n "$feature" ] && break
        fi
    done

    # 2. Try common directory structures for various languages
    if [ -z "$feature" ]; then
        # Python: app/routers/auth.py → auth (or filename)
        if [[ "$file_path" == */routers/* ]] || [[ "$file_path" == */views/* ]] || [[ "$file_path" == */controllers/* ]]; then
            feature=$(basename "$file_path" | sed 's/\.[^.]*$//')
        # Go: internal/auth/handler.go → auth
        elif [[ "$file_path" == */internal/* ]]; then
            feature=$(echo "$file_path" | sed -n 's/.*internal\/\([^\/]*\).*/\1/p')
        # Go: cmd/server/main.go → server
        elif [[ "$file_path" == */cmd/* ]]; then
            feature=$(echo "$file_path" | sed -n 's/.*cmd\/\([^\/]*\).*/\1/p')
        # Ruby: app/models/user.rb → user
        elif [[ "$file_path" == */models/* ]]; then
            feature=$(basename "$file_path" | sed 's/\.[^.]*$//')
        fi
    fi

    # 3. Fallback: use parent directory name
    if [ -z "$feature" ]; then
        feature=$(echo "$file_path" | sed -n 's/.*\/\([^\/]*\)\/[^\/]*$/\1/p')
        [ -z "$feature" ] && feature=$(basename "$(dirname "$file_path")")
    fi

    # 4. Filter out generic directory names
    case "$feature" in
        src|lib|app|components|pages|utils|hooks|types|".")
            echo ""
            ;;
        internal|cmd|pkg|models|views|routers|controllers|services)
            echo ""
            ;;
        *)
            echo "$feature"
            ;;
    esac
}

# ============================================================
# PDCA Document Detection
# ============================================================

# Find design document for a feature
# Usage: find_design_doc "auth"
# Output: path to design doc or empty string
find_design_doc() {
    local feature="$1"

    # Check various locations
    local paths=(
        "docs/02-design/features/${feature}.design.md"
        "docs/02-design/${feature}.design.md"
        "docs/design/${feature}.md"
    )

    for path in "${paths[@]}"; do
        if [ -f "$path" ]; then
            echo "$path"
            return 0
        fi
    done

    echo ""
}

# Find plan document for a feature
# Usage: find_plan_doc "auth"
# Output: path to plan doc or empty string
find_plan_doc() {
    local feature="$1"

    local paths=(
        "docs/01-plan/features/${feature}.plan.md"
        "docs/01-plan/${feature}.plan.md"
        "docs/plan/${feature}.md"
    )

    for path in "${paths[@]}"; do
        if [ -f "$path" ]; then
            echo "$path"
            return 0
        fi
    done

    echo ""
}

# ============================================================
# Task Classification
# ============================================================

# Classify task by content size
# Usage: classify_task "content string"
# Output: "quick_fix" | "minor_change" | "feature" | "major_feature"
classify_task() {
    local content="$1"
    local length=${#content}

    # Get thresholds from config or use defaults
    local quick_fix_threshold=$(get_config ".taskClassification.thresholds.quickFix" "50")
    local minor_change_threshold=$(get_config ".taskClassification.thresholds.minorChange" "200")
    local feature_threshold=$(get_config ".taskClassification.thresholds.feature" "1000")

    if [ "$length" -lt "$quick_fix_threshold" ]; then
        echo "quick_fix"
    elif [ "$length" -lt "$minor_change_threshold" ]; then
        echo "minor_change"
    elif [ "$length" -lt "$feature_threshold" ]; then
        echo "feature"
    else
        echo "major_feature"
    fi
}

# Get PDCA guidance for task classification
# Usage: get_pdca_guidance "feature"
# Output: guidance text
get_pdca_guidance() {
    local classification="$1"

    case "$classification" in
        quick_fix)
            echo "Task: Quick Fix. No PDCA documentation required."
            ;;
        minor_change)
            echo "Task: Minor Change. Check /pdca-status if needed."
            ;;
        feature)
            echo "Task: Feature. Design documentation recommended. Run /pdca-plan or /pdca-design."
            ;;
        major_feature)
            echo "Task: Major Feature. PDCA documentation essential. Start with /pdca-plan."
            ;;
    esac
}

# ============================================================
# JSON Output Helpers
# ============================================================

# Output allow decision with context
# Usage: output_allow "Additional context message"
output_allow() {
    local context="$1"

    if [ -n "$context" ]; then
        # Escape special characters for JSON
        local escaped_context
        escaped_context=$(printf '%s' "$context" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr '\n' ' ' | sed 's/  */ /g')

        cat << EOF
{"decision": "allow", "hookSpecificOutput": {"additionalContext": "$escaped_context"}}
EOF
    else
        echo '{}'
    fi
}

# Output block decision with reason
# Usage: output_block "Block reason"
# Note: Exits with code 2 to signal block to Claude Code
# For PreToolUse hooks only - PostToolUse hooks should use output_allow()
output_block() {
    local reason="$1"
    # Escape special characters for JSON
    local escaped_reason
    escaped_reason=$(printf '%s' "$reason" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr '\n' ' ' | sed 's/  */ /g')

    cat << EOF
{"decision": "block", "reason": "$escaped_reason"}
EOF
    exit 2
}

# Output empty response (allow without context)
output_empty() {
    echo '{}'
}

# ============================================================
# Level Detection
# ============================================================

# Detect project level from CLAUDE.md or structure
# Usage: detect_level
# Output: "Starter" | "Dynamic" | "Enterprise"
detect_level() {
    # 1. Check CLAUDE.md for explicit level
    if [ -f "CLAUDE.md" ]; then
        local level=$(grep -i "^level:" CLAUDE.md | head -1 | awk '{print $2}')
        [ -n "$level" ] && echo "$level" && return
    fi

    # 2. Check for Enterprise indicators
    if [ -d "kubernetes" ] || [ -d "terraform" ] || [ -d "k8s" ] || [ -d "infra" ]; then
        echo "Enterprise"
        return
    fi

    # 3. Check for Dynamic indicators
    if [ -f ".mcp.json" ] || [ -d "lib/bkend" ] || [ -d "supabase" ]; then
        if grep -q "bkend" .mcp.json 2>/dev/null; then
            echo "Dynamic"
            return
        fi
    fi

    if [ -f "docker-compose.yml" ] || [ -d "api" ] || [ -d "backend" ]; then
        echo "Dynamic"
        return
    fi

    # 4. Default to Starter
    echo "Starter"
}
