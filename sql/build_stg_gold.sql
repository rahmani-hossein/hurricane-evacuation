-- Reproducible staging and gold layer for Florida hurricane readiness.
-- Raw source tables are never modified.

CREATE SCHEMA IF NOT EXISTS `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_stg`;
CREATE SCHEMA IF NOT EXISTS `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold`;

CREATE OR REPLACE TABLE `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_stg.shelters` AS
SELECT
  shelter_id,
  shelter_name,
  address_1,
  city,
  county_parish,
  county_name,
  state,
  LPAD(REGEXP_REPLACE(TRIM(zip), r'[^0-9]', ''), 5, '0') AS zip5,
  latitude,
  longitude,
  ST_GEOGPOINT(longitude, latitude) AS point,
  evacuation_capacity,
  post_impact_capacity,
  CASE WHEN wheelchair_accessible IS TRUE THEN 'yes'
       WHEN wheelchair_accessible IS FALSE THEN 'no'
       ELSE 'unrecorded' END AS wheelchair_accessible_status,
  CASE WHEN generator_onsite IS TRUE THEN 'yes'
       WHEN generator_onsite IS FALSE THEN 'no'
       ELSE 'unrecorded' END AS generator_status,
  CASE WHEN self_sufficient_electricity IS TRUE THEN 'yes'
       WHEN self_sufficient_electricity IS FALSE THEN 'no'
       ELSE 'unrecorded' END AS self_sufficient_electricity_status,
  CASE WHEN in_surge_slosh_area IS TRUE THEN 'yes'
       WHEN in_surge_slosh_area IS FALSE THEN 'no'
       ELSE 'unrecorded' END AS surge_status,
  CASE WHEN in_100_yr_floodplain IS TRUE THEN 'yes'
       WHEN in_100_yr_floodplain IS FALSE THEN 'no'
       ELSE 'unrecorded' END AS floodplain_status,
  usage,
  CASE WHEN usage IS NULL OR TRIM(usage) = '' THEN 'unrecorded' ELSE UPPER(TRIM(usage)) END AS usage_status,
  is_medical,
  is_functional,
  shelter_status_code,
  county_fips,
  UPPER(REGEXP_REPLACE(TRIM(shelter_name), r'[^A-Za-z0-9]', '')) AS normalized_name,
  UPPER(REGEXP_REPLACE(TRIM(address_1), r'[^A-Za-z0-9]', '')) AS normalized_address,
  CONCAT(
    UPPER(REGEXP_REPLACE(TRIM(shelter_name), r'[^A-Za-z0-9]', '')), '|',
    UPPER(TRIM(city)), '|',
    LPAD(REGEXP_REPLACE(TRIM(zip), r'[^0-9]', ''), 5, '0')
  ) AS duplicate_group_key,
  CASE
    WHEN usage IS NULL THEN 'exclude_from_operational_candidate_set'
    WHEN evacuation_capacity IS NULL OR evacuation_capacity <= 0 THEN 'capacity_unverified'
    WHEN is_functional IS FALSE THEN 'candidate_needs_current_verification'
    ELSE 'candidate'
  END AS data_quality_status
FROM `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness.shelters`;

CREATE OR REPLACE TABLE `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_stg.vulnerability_tracts` AS
SELECT
  CAST(geo_id AS STRING) AS geo_id,
  total_pop, households, households_no_vehicle, group_quarters_pop, mobile_homes,
  limited_english_spanish, median_income, poverty_rate, pop_65_plus,
  county_fips, LPAD(REGEXP_REPLACE(CAST(county_fips AS STRING), r'[^0-9]', ''), 5, '0') AS county_fips5,
  lat, lon, ST_GEOGPOINT(lon, lat) AS point,
  svi_total_pop, pct_disability, pct_age_65_plus, pct_no_vehicle,
  pct_limited_english, pct_mobile_homes, pct_group_quarters, pct_no_internet,
  svi_socioeconomic, svi_household, svi_housing_transport,
  pct_indeplive, pct_mobility, pct_selfcare,
  CAST(NULL AS FLOAT64) AS pct_lacktrpt,
  CASE WHEN CAST(geo_id AS STRING) LIKE r'^[0-9]{11}$' THEN 'valid' ELSE 'invalid' END AS geoid_status,
  'percent_0_100' AS percentage_unit,
  CASE WHEN total_pop = 0 THEN 'zero_population_special_tract' ELSE 'population_tract' END AS tract_type
FROM `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness.vulnerability_tracts`;

CREATE OR REPLACE TABLE `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_stg.hazard_tracts` AS
SELECT
  CAST(geo_id AS STRING) AS geo_id,
  POPULATION AS hazard_population,
  BUILDVALUE, HRCN_AFREQ, HRCN_EXPP, HRCN_EALT, HRCN_EALP,
  CFLD_AFREQ, CFLD_EXPP, CFLD_EALT, CFLD_EALP
FROM `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness.hazard_tracts`;

CREATE OR REPLACE TABLE `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_stg.care_facilities` AS
SELECT
  cms_certification_number_ccn AS ccn,
  provider_name,
  provider_address,
  citytown AS city,
  state,
  LPAD(REGEXP_REPLACE(TRIM(zip_code), r'[^0-9]', ''), 5, '0') AS zip5,
  number_of_certified_beds AS certified_beds,
  latitude, longitude, ST_GEOGPOINT(longitude, latitude) AS point,
  'nursing_facility' AS facility_type
FROM `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness.care_facilities`;

CREATE OR REPLACE TABLE `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_stg.power_dependent_counties` AS
SELECT
  LPAD(REGEXP_REPLACE(CAST(COALESCE(fips_code_recode, fips_code, CONCAT(state_fips_code, county_fips_code)) AS STRING), r'[^0-9]', ''), 5, '0') AS county_fips,
  ANY_VALUE(COALESCE(county, name, namelsad)) AS county_name,
  ANY_VALUE(state) AS state,
  MAX(COALESCE(power_dependent_devices_dme, power_dependent_dme)) AS power_dependent_dme,
  MAX(facility_esrd_dialysis_any_dme) AS dialysis_dependent,
  MAX(o2_services_any_dme) AS oxygen_dependent,
  MAX(any_healthcare_srvc_any_dme) AS healthcare_services_power_dependent,
  LOGICAL_OR(power_dependent_is_censored) AS is_censored
FROM `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness.power_dependent_counties`
GROUP BY 1;

CREATE OR REPLACE TABLE `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold.shelter_readiness_snapshot` AS
WITH dup AS (
  SELECT duplicate_group_key, COUNT(*) AS duplicate_group_size
  FROM `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_stg.shelters`
  GROUP BY 1
),
base AS (
  SELECT s.*, d.duplicate_group_size,
    COALESCE(s.evacuation_capacity, 0) AS usable_capacity_candidate,
    CASE WHEN s.wheelchair_accessible_status = 'yes' THEN 1.0
         WHEN s.wheelchair_accessible_status = 'no' THEN 0.0 ELSE NULL END AS accessibility_signal,
    CASE WHEN s.generator_status = 'yes' OR s.self_sufficient_electricity_status = 'yes' THEN 1.0
         WHEN s.generator_status = 'no' AND s.self_sufficient_electricity_status = 'no' THEN 0.0 ELSE NULL END AS power_signal
  FROM `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_stg.shelters` s
  JOIN dup d USING (duplicate_group_key)
),
scored AS (
  SELECT *,
    (0.25 * IF(usage_status IN ('EVAC', 'BOTH'), 1.0, 0.0)
     + 0.20 * IF(is_functional IS TRUE, 1.0, 0.0)
     + 0.20 * COALESCE(accessibility_signal, 0.5)
     + 0.15 * COALESCE(power_signal, 0.5)
     + 0.10 * IF(surge_status = 'no', 1.0, IF(surge_status = 'yes', 0.0, 0.5))
     + 0.10 * IF(duplicate_group_size = 1, 1.0, 0.5)) AS readiness_score,
    (0.35 * IF(accessibility_signal IS NULL, 0.0, 1.0)
     + 0.25 * IF(power_signal IS NULL, 0.0, 1.0)
     + 0.20 * IF(surge_status = 'unrecorded', 0.0, 1.0)
     + 0.20 * IF(usage_status = 'unrecorded', 0.0, 1.0)) AS readiness_confidence
  FROM base
)
SELECT *, CURRENT_TIMESTAMP() AS snapshot_at
FROM scored;

CREATE OR REPLACE TABLE `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold.tract_shelter_options` AS
SELECT
  t.geo_id, t.county_fips5 AS county_fips, s.shelter_id, s.shelter_name,
  ST_DISTANCE(t.point, s.point) / 1609.344 AS straight_line_miles,
  s.usage_status, s.usable_capacity_candidate, s.wheelchair_accessible_status,
  s.generator_status, s.surge_status, s.readiness_score, s.readiness_confidence
FROM `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_stg.vulnerability_tracts` t
JOIN `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold.shelter_readiness_snapshot` s
ON ST_DWITHIN(t.point, s.point, 80467.2)
  WHERE t.total_pop > 0 AND s.usage_status IN ('EVAC', 'BOTH') AND s.data_quality_status IN ('candidate', 'candidate_needs_current_verification');

CREATE OR REPLACE TABLE `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold.county_risk_snapshot` AS
WITH tract AS (
  SELECT
    t.county_fips5 AS county_fips,
    SUM(t.total_pop) AS population,
    SUM(t.households_no_vehicle) AS no_vehicle_households,
    SAFE_DIVIDE(SUM(t.households_no_vehicle), SUM(t.households)) * 100 AS pct_households_no_vehicle,
    SAFE_DIVIDE(SUM(t.pop_65_plus), SUM(t.total_pop)) * 100 AS pct_age_65_plus,
    SAFE_DIVIDE(SUM(t.mobile_homes), SUM(t.total_pop)) * 100 AS pct_mobile_homes,
    AVG(t.pct_disability) AS avg_pct_disability,
    AVG(t.pct_no_internet) AS avg_pct_no_internet,
    SUM(COALESCE(h.HRCN_EALP, 0) + COALESCE(h.CFLD_EALP, 0)) AS hazard_loss_pressure
  FROM `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_stg.vulnerability_tracts` t
  LEFT JOIN `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_stg.hazard_tracts` h USING (geo_id)
  WHERE t.total_pop > 0
  GROUP BY 1
),
shelter AS (
  SELECT county_fips,
    COUNTIF(usage_status IN ('EVAC','BOTH') AND data_quality_status IN ('candidate','candidate_needs_current_verification')) AS evac_shelters,
    SUM(IF(usage_status IN ('EVAC','BOTH') AND data_quality_status IN ('candidate','candidate_needs_current_verification'), usable_capacity_candidate, 0)) AS evac_capacity,
    COUNTIF(usage_status IN ('EVAC','BOTH') AND data_quality_status IN ('candidate','candidate_needs_current_verification') AND wheelchair_accessible_status = 'yes') AS wheelchair_confirmed,
    COUNTIF(usage_status IN ('EVAC','BOTH') AND data_quality_status IN ('candidate','candidate_needs_current_verification') AND wheelchair_accessible_status = 'unrecorded') AS wheelchair_unrecorded,
    COUNTIF(usage_status IN ('EVAC','BOTH') AND surge_status = 'yes') AS surge_shelters
  FROM `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold.shelter_readiness_snapshot`
  GROUP BY 1
),
joined AS (
  SELECT t.*, s.* EXCEPT(county_fips),
    COALESCE(p.power_dependent_dme, 0) AS power_dependent_dme,
    COALESCE(p.healthcare_services_power_dependent, 0) AS healthcare_services_power_dependent
  FROM tract t LEFT JOIN shelter s USING (county_fips)
  LEFT JOIN `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_stg.power_dependent_counties` p USING (county_fips)
),
scaled AS (
  SELECT *,
    SAFE_DIVIDE(pct_households_no_vehicle - MIN(pct_households_no_vehicle) OVER (), MAX(pct_households_no_vehicle) OVER () - MIN(pct_households_no_vehicle) OVER ()) AS no_vehicle_score,
    SAFE_DIVIDE(pct_age_65_plus - MIN(pct_age_65_plus) OVER (), MAX(pct_age_65_plus) OVER () - MIN(pct_age_65_plus) OVER ()) AS age_score,
    SAFE_DIVIDE(avg_pct_disability - MIN(avg_pct_disability) OVER (), MAX(avg_pct_disability) OVER () - MIN(avg_pct_disability) OVER ()) AS disability_score,
    SAFE_DIVIDE(hazard_loss_pressure - MIN(hazard_loss_pressure) OVER (), MAX(hazard_loss_pressure) OVER () - MIN(hazard_loss_pressure) OVER ()) AS hazard_score,
    1 - SAFE_DIVIDE(evac_capacity, NULLIF(population, 0)) AS shelter_gap_raw
  FROM joined
),
final AS (
  SELECT *,
    GREATEST(0.0, LEAST(1.0, shelter_gap_raw)) AS shelter_gap_score,
    SAFE_DIVIDE(wheelchair_unrecorded, NULLIF(evac_shelters, 0)) AS accessibility_unknown_rate
  FROM scaled
)
SELECT *,
  100 * (0.25 * COALESCE(no_vehicle_score, 0)
       + 0.15 * COALESCE(age_score, 0)
       + 0.10 * COALESCE(disability_score, 0)
       + 0.25 * COALESCE(shelter_gap_score, 0)
       + 0.15 * COALESCE(hazard_score, 0)
       + 0.10 * SAFE_DIVIDE(COALESCE(power_dependent_dme, 0), MAX(power_dependent_dme) OVER ())) AS county_priority_score,
  CURRENT_TIMESTAMP() AS snapshot_at
FROM final;

-- Miami-Dade operating scope: mobility proxy enrichment.
-- This is deliberately not named pct_lacktrpt. It is a composite planning proxy,
-- not the CDC PLACES self-reported reliable-transportation measure.
CREATE OR REPLACE TABLE `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold.miami_dade_tract_mobility_proxy` AS
SELECT
  t.geo_id,
  t.county_fips5 AS county_fips,
  t.total_pop,
  t.households,
  t.households_no_vehicle,
  SAFE_DIVIDE(t.households_no_vehicle, NULLIF(t.households, 0)) * 100 AS pct_households_no_vehicle,
  t.pct_mobility AS pct_mobility_limitation,
  t.pct_disability,
  t.pct_no_internet,
  (
    0.50 * COALESCE(SAFE_DIVIDE(t.households_no_vehicle, NULLIF(t.households, 0)), 0)
    + 0.30 * COALESCE(t.pct_mobility / 100, 0)
    + 0.20 * COALESCE(t.pct_no_internet / 100, 0)
  ) * 100 AS mobility_proxy_score,
  '50% no-vehicle household rate + 30% mobility limitation + 20% no-internet rate' AS proxy_definition,
  'ACS/SVI-derived proxy; not CDC PLACES LACKTRPT; not an individual-level estimate' AS interpretation_note,
  CURRENT_TIMESTAMP() AS snapshot_at
FROM `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_stg.vulnerability_tracts` t
WHERE t.county_fips5 = '12086' AND t.total_pop > 0;

CREATE OR REPLACE TABLE `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold.miami_dade_tract_shelter_options` AS
SELECT
  o.*,
  m.pct_households_no_vehicle,
  m.pct_mobility_limitation,
  m.mobility_proxy_score,
  m.proxy_definition,
  m.interpretation_note
FROM `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold.tract_shelter_options` o
JOIN `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold.miami_dade_tract_mobility_proxy` m USING (geo_id)
WHERE o.county_fips = '12086';

CREATE OR REPLACE TABLE `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold.miami_dade_county_risk_snapshot` AS
SELECT
  r.*,
  AVG(m.mobility_proxy_score) AS avg_mobility_proxy_score,
  MAX(m.mobility_proxy_score) AS max_mobility_proxy_score,
  SUM(m.households_no_vehicle) AS mobility_proxy_no_vehicle_households,
  'County scope: Miami-Dade (FIPS 12086)' AS operating_scope,
  'Mobility is a proxy from vehicle access, mobility limitation, and internet access; reliable transportation is not directly observed.' AS mobility_caveat
FROM `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold.county_risk_snapshot` r
JOIN `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold.miami_dade_tract_mobility_proxy` m USING (county_fips)
WHERE r.county_fips = '12086'
GROUP BY ALL;

-- Lee County operational agent products.
-- These gold views preserve the feature/agent-and-views logic while keeping raw
-- source tables behind the staging and gold boundary. Percent fields use the
-- canonical 0-100 convention established in stg.vulnerability_tracts.
CREATE OR REPLACE VIEW `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold.lee_tract_risk` AS
WITH ranked AS (
  SELECT
    t.geo_id,
    t.county_fips5 AS county_fips,
    t.total_pop,
    t.households,
    t.households_no_vehicle,
    t.pct_no_vehicle,
    t.pct_age_65_plus,
    t.pct_disability,
    t.pct_mobile_homes,
    t.lat,
    t.lon,
    t.point,
    PERCENT_RANK() OVER (ORDER BY COALESCE(t.pct_no_vehicle, 0)) AS rk_no_vehicle,
    PERCENT_RANK() OVER (ORDER BY COALESCE(t.pct_age_65_plus, 0)) AS rk_age_65,
    PERCENT_RANK() OVER (ORDER BY COALESCE(t.pct_disability, 0)) AS rk_disability,
    PERCENT_RANK() OVER (ORDER BY COALESCE(t.pct_mobile_homes, 0)) AS rk_mobile_homes
  FROM `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_stg.vulnerability_tracts` t
  WHERE t.county_fips5 = '12071' AND t.total_pop > 0
)
SELECT
  *,
  ROUND((rk_no_vehicle + rk_age_65 + rk_disability + rk_mobile_homes) / 4.0, 4) AS stranded_score,
  CASE WHEN rk_no_vehicle >= 0.75 THEN 2000.0 ELSE 25000.0 END AS reachable_dist_m,
  CURRENT_TIMESTAMP() AS snapshot_at,
  'Lee County (FIPS 12071); percentile composite of no-vehicle, age 65+, disability, and mobile-home rates' AS methodology_note
FROM ranked;

CREATE OR REPLACE VIEW `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold.lee_shelter_readiness` AS
SELECT
  s.shelter_id,
  s.shelter_name,
  s.address_1,
  s.city,
  s.zip5 AS zip,
  s.latitude,
  s.longitude,
  s.point AS shelter_point,
  s.county_fips,
  s.evacuation_capacity,
  s.post_impact_capacity,
  s.usage_status AS usage,
  UPPER(s.wheelchair_accessible_status) AS wheelchair_record,
  s.generator_status,
  UPPER(s.surge_status) AS surge_record,
  s.is_medical,
  s.readiness_score,
  s.readiness_confidence,
  s.data_quality_status
FROM `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold.shelter_readiness_snapshot` s
WHERE s.county_fips = '12071'
  AND s.usage_status IN ('EVAC', 'BOTH')
  AND s.surge_status != 'yes';

CREATE OR REPLACE VIEW `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold.lee_tract_shelter_options` AS
SELECT
  t.geo_id AS tract_geo_id,
  t.county_fips,
  t.stranded_score,
  t.reachable_dist_m,
  s.shelter_id,
  s.shelter_name,
  s.address_1,
  s.city,
  s.evacuation_capacity,
  s.wheelchair_record,
  s.surge_record,
  s.latitude AS shelter_lat,
  s.longitude AS shelter_lon,
  ROUND(ST_DISTANCE(t.point, s.shelter_point) / 1000.0, 2) AS km_straight_line,
  s.readiness_score,
  s.readiness_confidence,
  s.data_quality_status
FROM `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold.lee_tract_risk` t
JOIN `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold.lee_shelter_readiness` s
  ON ST_DWITHIN(t.point, s.shelter_point, t.reachable_dist_m);

CREATE OR REPLACE VIEW `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold.lee_tract_access_state` AS
WITH counts AS (
  SELECT
    t.geo_id,
    t.stranded_score,
    t.total_pop,
    t.households_no_vehicle,
    t.reachable_dist_m,
    COUNT(o.shelter_id) AS total_reachable_shelters,
    COUNTIF(o.wheelchair_record = 'YES') AS count_yes,
    COUNTIF(o.wheelchair_record = 'NO') AS count_no,
    COUNTIF(o.wheelchair_record = 'UNRECORDED') AS count_unrecorded
  FROM `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold.lee_tract_risk` t
  LEFT JOIN `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold.lee_tract_shelter_options` o
    ON t.geo_id = o.tract_geo_id
  GROUP BY 1, 2, 3, 4, 5
)
SELECT
  *,
  CASE
    WHEN count_yes > 0 THEN 'A'
    WHEN count_unrecorded > 0 THEN 'B'
    WHEN count_no > 0 THEN 'C'
    ELSE 'D'
  END AS access_state,
  CASE
    WHEN count_yes > 0 THEN 'Recorded wheelchair destination within reach'
    WHEN count_unrecorded > 0 THEN 'Shelters within reach, but wheelchair status unrecorded (VERIFY FIRST)'
    WHEN count_no > 0 THEN 'Shelters within reach, but all recorded not accessible'
    ELSE 'No eligible evacuation shelter within reach (TRANSIT PICKUP NEEDED)'
  END AS action_recommendation,
  CURRENT_TIMESTAMP() AS snapshot_at
FROM counts;

CREATE OR REPLACE VIEW `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold.lee_equity_audit` AS
SELECT
  a.geo_id,
  a.stranded_score,
  a.access_state,
  a.households_no_vehicle,
  v.median_income,
  v.poverty_rate,
  v.pct_limited_english,
  v.pct_no_internet,
  v.svi_socioeconomic,
  CURRENT_TIMESTAMP() AS snapshot_at
FROM `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold.lee_tract_access_state` a
JOIN `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_stg.vulnerability_tracts` v USING (geo_id);

CREATE OR REPLACE VIEW `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_gold.lee_county_power_dependence` AS
SELECT
  county_name,
  county_fips AS fips_code,
  power_dependent_dme AS power_dependent_residents,
  dialysis_dependent,
  oxygen_dependent,
  state,
  is_censored,
  CURRENT_TIMESTAMP() AS snapshot_at
FROM `qwiklabs-gcp-04-9fa9c7b57012.evacuation_readiness_stg.power_dependent_counties`
WHERE county_fips = '12071';
