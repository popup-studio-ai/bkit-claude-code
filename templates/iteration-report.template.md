# PDCA Iteration Report: {feature}

## Overview

| Item | Value |
|------|-------|
| Feature | {feature} |
| Date | {date} |
| Total Iterations | {total_iterations} |
| Final Status | {status} |
| Duration | {duration} |

## Iteration Configuration

```yaml
evaluators:
  - gap-detector
  - code-analyzer
  - qa-monitor

thresholds:
  gap_analysis: {gap_threshold}%
  code_quality: {quality_threshold}%
  functional: {functional_threshold}%

limits:
  max_iterations: {max_iterations}
  fixes_per_iteration: {fix_limit}
```

## Score Progression

### Summary Chart

```
Score (%)
100 ┤
 90 ┼──────────────────────────── Target ──────
 80 ┤      ╭────────╮
 70 ┤   ╭──╯        ╰──────────────────────────
 60 ┤───╯
 50 ┤
    └───┬────┬────┬────┬────┬────┬────┬────┬───
       Init  1    2    3    4    5    6    7
                     Iteration
```

### Detailed Scores

| Iteration | Gap Analysis | Code Quality | Functional | Overall |
|-----------|--------------|--------------|------------|---------|
| Initial | {init_gap}% | {init_quality}% | {init_func}% | {init_overall}% |
{{#ITERATIONS}}
| {iter_num} | {gap}% | {quality}% | {func}% | {overall}% |
{{/ITERATIONS}}
| **Final** | **{final_gap}%** | **{final_quality}%** | **{final_func}%** | **{final_overall}%** |

## Issues Fixed

### By Severity

| Severity | Initial | Fixed | Remaining |
|----------|---------|-------|-----------|
| 🔴 Critical | {critical_init} | {critical_fixed} | {critical_remain} |
| 🟡 Warning | {warning_init} | {warning_fixed} | {warning_remain} |
| 🟢 Info | {info_init} | {info_fixed} | {info_remain} |

### By Category

| Category | Initial | Fixed | Remaining |
|----------|---------|-------|-----------|
| Design-Impl Gap | {gap_init} | {gap_fixed} | {gap_remain} |
| Security | {sec_init} | {sec_fixed} | {sec_remain} |
| Code Quality | {qual_init} | {qual_fixed} | {qual_remain} |
| Functional | {func_init} | {func_fixed} | {func_remain} |

## Iteration Details

{{#ITERATIONS}}
### Iteration {iter_num}

**Scores:** Gap {gap}% | Quality {quality}% | Functional {func}%

**Issues Addressed:**
{{#ISSUES}}
- [{severity}] {description}
  - Location: `{location}`
  - Fix: {fix_description}
{{/ISSUES}}

**Files Modified:**
{{#FILES}}
- {action}: `{path}`
{{/FILES}}

---
{{/ITERATIONS}}

## Changes Summary

### Created Files

{{#CREATED_FILES}}
- `{path}`
  - Purpose: {purpose}
{{/CREATED_FILES}}

### Modified Files

{{#MODIFIED_FILES}}
- `{path}`
  - Changes: {changes}
{{/MODIFIED_FILES}}

### Deleted Files

{{#DELETED_FILES}}
- `{path}`
  - Reason: {reason}
{{/DELETED_FILES}}

## Remaining Issues

{{#HAS_REMAINING_ISSUES}}
The following issues could not be auto-fixed and require manual attention:

{{#REMAINING_ISSUES}}
### {issue_num}. {title}

- **Severity:** {severity}
- **Category:** {category}
- **Location:** `{location}`
- **Description:** {description}
- **Reason Not Fixed:** {reason}
- **Suggested Action:** {suggestion}

{{/REMAINING_ISSUES}}
{{/HAS_REMAINING_ISSUES}}

{{^HAS_REMAINING_ISSUES}}
✅ All identified issues have been addressed.
{{/HAS_REMAINING_ISSUES}}

## Recommendations

### Immediate Actions

{{#IMMEDIATE_ACTIONS}}
1. {action}
{{/IMMEDIATE_ACTIONS}}

### Follow-up Tasks

{{#FOLLOWUP_TASKS}}
- [ ] {task}
{{/FOLLOWUP_TASKS}}

## Quality Metrics

### Before/After Comparison

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Design-Impl Match | {before_gap}% | {after_gap}% | {change_gap} |
| Security Score | {before_sec} | {after_sec} | {change_sec} |
| Complexity Avg | {before_complex} | {after_complex} | {change_complex} |
| Code Duplication | {before_dup} | {after_dup} | {change_dup} |

## Next Steps

```
{{#SUCCESS}}
✅ Iteration successful. Proceed with:
   1. Review changes: /pdca-analyze {feature}
   2. Manual testing of critical paths
   3. Create completion report: /pdca-report {feature}
{{/SUCCESS}}

{{#PARTIAL}}
⚠️ Partial success. Manual intervention needed:
   1. Review remaining issues above
   2. Make manual fixes or design decisions
   3. Re-run iteration: /pdca-iterate {feature}
{{/PARTIAL}}

{{#FAILURE}}
❌ Iteration failed. Required actions:
   1. Review failure reasons in report
   2. Update design document if needed
   3. Address blocking issues manually
   4. Re-attempt: /pdca-iterate {feature}
{{/FAILURE}}
```

---

## Appendix

### A. Evaluator Criteria Used

#### Gap Analysis

```yaml
api_endpoints:
  match_rate: {gap_threshold}%
  weight: 30%
data_models:
  match_rate: {model_threshold}%
  weight: 30%
components:
  match_rate: {comp_threshold}%
  weight: 20%
error_handling:
  coverage: {error_threshold}%
  weight: 20%
```

#### Code Quality

```yaml
security:
  critical_issues: 0
  weight: 40%
complexity:
  max_per_function: 15
  weight: 20%
duplication:
  max_lines: 10
  weight: 20%
maintainability:
  min_score: 70
  weight: 20%
```

### B. Tool Usage Statistics

| Tool | Invocations | Success Rate |
|------|-------------|--------------|
| Read | {read_count} | {read_success}% |
| Write | {write_count} | {write_success}% |
| Edit | {edit_count} | {edit_success}% |
| Grep | {grep_count} | {grep_success}% |
| Bash | {bash_count} | {bash_success}% |

### C. Performance Metrics

| Metric | Value |
|--------|-------|
| Total Duration | {total_duration} |
| Avg Iteration Time | {avg_iter_time} |
| Evaluation Time | {eval_time} |
| Fix Application Time | {fix_time} |

---

*Generated by bkit Evaluator-Optimizer Pattern*
*POPUP STUDIO PTE. LTD. - https://popupstudio.ai*
