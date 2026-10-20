# Miami-Dade shelter validation

## Result

Miami-Dade is the highest-priority county in the current Florida gold snapshot with a score of **75.4/100**. The operational candidate set contains 109 EVAC/BOTH shelters with 105,407 listed evacuation spaces. 104 of the 109 candidate shelters have wheelchair accessibility unrecorded, so the readiness result is primarily a verification queue—not a claim that those shelters are inaccessible.

## Maps / place validation sample

| Source record | Address from BigQuery | Validation result | Action |
|---|---|---|---|
| Robert C. Morgan Hign School | 18180 SW 122ND AVE, Miami, FL 33177 | Address matches current Florida school listings. The source name contains a typo: `Hign` rather than `High`. | Normalize display name; retain source value; verify shelter role and capacity. |
| Florida International University Monroe Host | 11200 SW 8TH ST, Miami, FL 33199 | FIU’s current campus/contact pages confirm the address; Google Maps search resolves the campus/athletic facilities at that address. | Treat as a campus destination, not a single building, until the exact receiving venue is confirmed. |
| Dr. Michael M. Krop HS | 1410 NE 215TH ST, Miami, FL 33179 | Current Miami-Dade school information and Maps-linked place results confirm the school and address. | Good candidate for a live verification demo; current shelter operation still needs county confirmation. |
| Georgia Jones-Ayers Middle School | 1331 NW 46TH ST, Miami, FL | Current school page confirms the school and address, but sources disagree on ZIP (`33124` versus `33142`). | Create an address-normalization review task; do not silently choose a ZIP. |

## Interpretation

Maps validated place identity/address evidence for the sample. It did **not** prove that a building is open as an evacuation shelter, has current capacity, or can accommodate every mobility need. Those remain county/operator verification fields. This is the behavior the agent should demonstrate: use Maps for current place identity and routing, use the curated BigQuery tables for shelter attributes, and surface unrecorded fields as actions.

## Sources

- [Dr. Michael M. Krop official school information](https://www.dadeschools.net/SchoolInformation/school/7141/details)
- [Georgia Jones-Ayers official school contact](https://www.gjams.net/contact-us)
- [Florida International University campus/contact address](https://www.fiu.edu/locations/mmc/)
- [Florida Department of Education school listing](https://web03.fldoe.org/schools/schoolreport.asp?id=13)
- [Google Maps search for FIU / 11200 SW 8th Street](https://www.google.com/maps/search/Florida+International+University+11200+SW+8th+Street+Miami+FL)
