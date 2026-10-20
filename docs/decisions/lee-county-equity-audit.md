# Lee County Equity Audit

**Date:** 2026-10-20  
**Scope:** Lee County, Florida (FIPS 12071)  
**Decision status:** Recommendation only; no production scoring changes made

## Context

The README says to audit the agent's output rather than remove demographic columns from the model. Race and ethnicity are therefore used here as post-hoc audit variables, not model inputs. The audit also keeps `UNRECORDED` shelter accessibility distinct from `NO`.

The current Lee County priority score ranks 221 populated tracts using an equal-weighted percentile composite of:

1. households without a vehicle;
2. residents age 65+;
3. disability prevalence; and
4. mobile-home prevalence.

The operational segment adds shelter access state:

- **A:** at least one recorded wheelchair-accessible shelter within reach;
- **B:** shelter(s) within reach, but no recorded `YES` and at least one `UNRECORDED`;
- **C:** shelter(s) within reach, all recorded `NO`;
- **D:** no eligible pre-landfall shelter within reach.

In the current Lee County view there are 145 A tracts, 61 B tracts, and 15 D tracts; no C tracts were returned.

## Ranked tracks / segments to prioritize

The agent’s readiness brief is organized into three tracks: **who cannot leave** (ranked tracts and facilities), **where they would go** (reachable shelter candidates and live verification), and **what to fix before the season** (transport gaps, accessibility verification, and hazard/capacity gaps). A fourth honesty track, **what we could not tell you**, should remain visible because missing shelter records are part of the finding.

The highest operational priority is not simply “the highest score.” It is the intersection of high stranded score and an access gap:

| Priority segment | Count in top decile | What the agent says | Recommended interpretation |
|---|---:|---|---|
| Top-score + State B | 7 | Nearby shelters exist, but accessibility is unrecorded | Verify accessibility first; do not treat blank as inaccessible |
| Top-score + State D | 4 | No eligible shelter within reach | Stage transportation, pickup points, and route validation |
| Top-score + State A | 12 | A recorded accessible destination exists | Verify live status and capacity; retain as a lower-gap monitoring segment |

The top-scoring tract is **12071020801 / Tract 208.01, North Fort Myers**. It has a score of 0.9545, 401 households without a vehicle, 98.5% mobile homes in the project data, 2 shelters within reach, and State B status: both shelter accessibility records are unrecorded. External neighborhood data places the tract mostly in North Fort Myers and reports a 2020–2024 ACS median household income of $36,031 and poverty rate of 23.1%.

Other notable top-decile gap tracts include:

- **12071050104 / Tract 501.04:** State D, 77 no-vehicle households, score 0.8932.
- **12071001916 / Tract 19.16, Iona:** State D, 120 no-vehicle households, score 0.8216.
- **12071001923 / Tract 19.23, Iona:** State D, 89 no-vehicle households, score 0.7602.
- **12071001915 / Tract 19.15, Punta Rassa:** State D, 456 no-vehicle households, score 0.7432.
- **12071020301 / Tract 203.01, Suncoast Estates:** State B, 66 no-vehicle households, score 0.7682, 38.7% no internet in the project data.

## Equity results

The top decile contains 23 tracts and approximately 56,339 residents. The comparison group contains 198 tracts and approximately 761,327 residents. Race/ethnicity values were joined after ranking from the latest available ACS 5-year tract profile through Census Reporter’s API; the model did not use them.

| Audit measure | Top decile | Other tracts | Difference |
|---|---:|---:|---:|
| Non-Hispanic White share, population-weighted | 82.4% | 60.5% | +21.9 pp |
| Non-Hispanic Black share, population-weighted | 3.1% | 8.0% | -4.9 pp |
| Hispanic share, population-weighted | 10.4% | 25.8% | -15.4 pp |
| Non-Hispanic Asian share, population-weighted | 0.8% | 1.7% | -0.9 pp |

Across all 221 tracts, the Pearson correlation between stranded score and tract share was approximately **+0.44 for non-Hispanic White share**, **-0.28 for non-Hispanic Black share**, and **-0.39 for Hispanic share**. These are ecological associations, not individual-level effects or proof that race caused a score.

The project’s own socioeconomic audit points in the opposite direction for some need indicators: top-decile tracts average lower recorded median income ($47,602 among valid values) than the rest, and the highest-scoring tract has 26.9% poverty and a $26,568 project income value. This means the ranking is not simply selecting affluent neighborhoods; rather, it appears to be selecting a particular vulnerability profile—older, disabled, mobile-home-heavy communities—that is less racially representative of Lee County than the countywide population.

## Interpretation and risks

1. **Potential under-prioritization:** Black and Hispanic communities may be less likely to enter the top score tier even when they face evacuation barriers not represented by the four inputs. The negative race-share correlations are a flag for audit and coverage, not a conclusion of discriminatory intent.
2. **Age/mobile-home dominance:** The equal-weight score can elevate older, predominantly White communities with high mobile-home prevalence, while a tract with high language isolation, poverty, no internet, or no vehicle access may rank lower if its age/mobile-home profile is weaker.
3. **Access-state measurement risk:** State A depends on recorded accessibility and State B explicitly represents missing assessment. A ranking that uses shelter records without preserving the tri-state semantics could favor places with better paperwork.
4. **Neighborhood ≠ individual:** Tract-level demographics cannot establish who needs help inside a tract. ACS estimates have margins of error, and external neighborhood labels are approximate place shares, not official neighborhood boundaries.
5. **Coverage mismatch:** The project view returns 221 populated tracts while the documentation describes 223 total tracts; two are unpopulated. Counts and denominators should be stated whenever this audit is presented.

## Recommendation

Do not change the production model based on this audit alone. Before using the ranking for resource allocation, run a controlled sensitivity review with emergency-management stakeholders:

1. Keep the current physical-need score as the primary ranking.
2. Add a parallel **coverage / access-gap queue** that explicitly flags high poverty, high language isolation, high no-internet, and high no-vehicle tracts, regardless of race.
3. Require a “protected coverage check” before publishing a top-N list: compare the selected population and gap segments with Lee County baselines, and investigate large disparities in race/ethnicity, language access, or income.
4. Test alternative weights and rank stability. If Black/Hispanic or language-isolated tracts remain systematically absent, treat that as a model-coverage problem and consider adding direct structural variables such as language access, transit reachability, and poverty—not race as a proxy.
5. Keep State B visible and operationally actionable: verify the named shelter one building at a time, with live Maps evidence, before downgrading or closing the gap.
6. For State D and high no-vehicle tracts, prioritize transportation capacity and pickup-point design; do not assume a shelter map alone solves the problem.
7. Re-run the audit after each refresh and record the data vintage, population denominator, missingness, score weights, and the number of tracts selected.

These are recommendations for review and testing. No remediation was applied to the agent or BigQuery views in this work.

## Validation notes

- Read the equity guidance in `hurricane-evacuation/README.md` before analysis.
- Queried the live BigQuery views `lee_tract_risk`, `lee_tract_access_state`, and `lee_equity_audit` in project `qwiklabs-gcp-04-9fa9c7b57012`.
- Joined post-hoc tract race/ethnicity profiles from ACS 5-year data using Census Reporter’s API.
- Cross-checked tract-to-place labels and current ACS income/poverty context against the Lee County tract directory, which identifies Tract 208.01 as mostly North Fort Myers and Tract 203.01 as Suncoast Estates.
- This is an analytical memo, not a causal fairness determination. It does not recommend changing the model without stakeholder review and sensitivity testing.

## Sources

- Project README equity guidance: `hurricane-evacuation/README.md`, “What auditing the outcome actually means” and “Race is not a model input here.”
- U.S. Census Bureau, [ACS Data Profiles](https://www.census.gov/acs/www/data/data-tables-and-tools/data-profiles/2024/).
- Lee County tract directory, [ACS 2020–2024 tract context and place labels](https://plaincities.com/county/fl/lee-county/tracts).
- Example neighborhood context, [Tract 5.02 demographic comparison](https://plaincities.com/neighborhood/tract-000502-lee-fl).
