# Eval Prompt — github-stats trigger & accumulation

## Scenario

The user wants to refresh the cumulative GitHub usage statistics for the
`popup-studio-ai/bkit-claude-code` repository and update the report.

Representative user utterances (trigger keywords the skill must intercept):

- "깃허브 통계 갱신해줘" (update GitHub stats)
- "누적 clones, views 기록해줘" (record cumulative clones/views)
- "stars / forks / traffic 가져와서 리포트 만들어줘"
- "/github-stats report"

## Intent

Invoke the `github-stats` skill. The trigger keywords are: github stats,
traffic, clones, views, stars, forks, cumulative stats, 깃허브 통계, 누적 통계.

## Expected behavior

The skill should run `collect.sh`, merge the fetched 14-day traffic window into
the persistent ledger (deduplicated by date), recompute the gap-aware cumulative
totals, and regenerate the fixed-format report from the template. See
`expected-1.md` for the required process steps and output structure.
