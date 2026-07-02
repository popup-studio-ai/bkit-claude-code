---
title: Eval Re-baseline 가이드 (SOP)
audience: bkit 메인테이너, 컨트리뷰터
status: Active
since: v2.1.26 (provisional)
last-updated: 2026-07-02
---

# Eval Re-baseline 가이드 (SOP)

> `evals/*/eval.yaml` 의 `model_baseline` 필드가 **무엇을** 기록하는지, **언제** re-baseline 해야 하는지, **어떻게** 하는지를 정의하는 표준 운영 절차. `contract-baseline-rollforward.guide.md` 와 같은 governance 계열의 자매 문서 (대상 표면만 다름).

---

## 1. `model_baseline` 이 무엇인가 — 그리고 무엇이 아닌가

32개 `evals/<class>/<skill>/eval.yaml` 파일에는 각각 `benchmark:` 블록이 있다:

```yaml
benchmark:
  model_baseline: "claude-sonnet-4-6"
  metrics:
    - output_quality
    - model_parity
```

`model_baseline` 은 **캡처 시점 메타데이터** — 해당 eval의 품질 기준선이 수립된 시점에 어떤 모델 세대가 최신이었는지를 기록한 값이다. 런타임에는 완전히 비활성(inert)이다:

- **`evals/runner.js` 는 LLM 호출을 전혀 수행하지 않는다.** 채점은 완전 결정론적 키워드 매칭이다 (`evaluateAgainstCriteria`, runner.js:175-256). 이 필드는 YAML 파서(runner.js:154-161)가 읽기만 할 뿐 `runEval`, `runAllEvals`, `runBenchmark` 어디에서도 사용되지 않는다.
- **`evals/config.json` 의 `benchmarkModel` 은 표시용 레이블**이다 — runner가 report 출력의 `model` 필드로 복사할 뿐(runner.js:390), 어떤 모델도 선택하거나 호출하지 않는다.

결론: `model_baseline` 을 바꿔도 점수는 절대 변하지 않는다. 이 필드는 기록 문서이며, 기록 문서로서 governance 된다.

## 2. 언제(WHEN) re-baseline 하는가

품질 기준선 자체의 의미가 바뀔 때 **만** re-baseline 한다:

| 트리거 | Re-baseline? |
|---|---|
| eval.yaml 의 채점 rubric / criteria 키워드 변경 | **Yes** |
| Pass threshold 변경 (의도적 품질 기준선 재설정) | **Yes** |
| 새 Claude 모델 릴리스 | **No** — runner는 LLM 호출이 없으므로 모델 릴리스는 eval 의미론에 아무 영향이 없음 |
| config.json 의 `benchmarkModel` 표시 레이블 갱신 | **No** — 레이블 전용 |

모델 릴리스 단독으로는 32개 필드를 건드릴 이유가 절대 되지 않는다.

## 3. 어떻게(HOW) re-baseline 하는가

1. 대상 환경에서 전체 결정론적 벤치마크 실행: `node evals/runner.js --benchmark` — rubric/threshold 변경 전후 모두 전체 green 확인.
2. **모든** `model_baseline` 값 갱신 + eval.yaml별 `baseline_date` note 추가를 **하나의 커밋**으로 수행 (부분 re-baseline 금지 — 캡처 세대가 섞이면 감사 불가능).
3. Re-baseline 과 그 트리거를 기록하는 CHANGELOG 항목 추가.
4. Diff를 리뷰 가능하게 유지: 커밋에는 eval.yaml 메타데이터 변경 + CHANGELOG 항목만 포함.

## 4. 현재 상태 — v2.1.25 freeze

**현재의 32개 `claude-sonnet-4-6` 값은 v2.1.25 결정에 따라 FROZEN 상태로 유지된다.** v2.1.25 CHANGELOG 는 이를 "historical capture records — intentionally unchanged" 로 기록했다 (config.json 의 `benchmarkModel` 만 표시 레이블로서 `claude-sonnet-5` 로 이동). §3 절차 밖에서 32개 필드를 수정하지 말 것.
