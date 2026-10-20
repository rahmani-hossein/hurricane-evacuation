-- scripts/create_views.sql
-- Creates the analytical views for Lee County (12071) as defined in plan.md (D3-D12)

-- 1. v_lee_tract_scores: Tracts ranked by Stranded Score
CREATE OR REPLACE VIEW `evacuation_readiness.v_lee_tract_scores` AS
WITH ranked AS (
  SELECT
    geo_id,
    total_pop,
    households,
    households_no_vehicle,
    pct_no_vehicle,
    pct_age_65_plus,
    pct_disability,
    pct_mobile_homes,
    lat,
    lon,
    county_fips,
    PERCENT_RANK() OVER (ORDER BY COALESCE(pct_no_vehicle, 0) ASC) AS rk_no_veh,
    PERCENT_RANK() OVER (ORDER BY COALESCE(pct_age_65_plus, 0) ASC) AS rk_age_65,
    PERCENT_RANK() OVER (ORDER BY COALESCE(pct_disability, 0) ASC) AS rk_disab,
    PERCENT_RANK() OVER (ORDER BY COALESCE(pct_mobile_homes, 0) ASC) AS rk_mob_homes
  FROM `evacuation_readiness.vulnerability_tracts`
  WHERE county_fips = '12071'
)
SELECT
  geo_id,
  county_fips,
  total_pop,
  households,
  households_no_vehicle,
  pct_no_vehicle,
  pct_age_65_plus,
  pct_disability,
  pct_mobile_homes,
  lat,
  lon,
  rk_no_veh,
  -- Equal weighted stranded score
  ROUND((rk_no_veh + rk_age_65 + rk_disab + rk_mob_homes) / 4.0, 4) AS stranded_score,
  -- Reachable threshold: 2 km for top-quartile no-vehicle tracts, 25 km otherwise
  CASE WHEN rk_no_veh >= 0.75 THEN 2000.0 ELSE 25000.0 END AS reachable_dist_m
FROM ranked;

-- 2. v_lee_shelters: Eligible shelters with surge labels and nearest tract centroid
CREATE OR REPLACE VIEW `evacuation_readiness.v_lee_shelters` AS
WITH tract_pts AS (
  SELECT geo_id, ST_GEOGPOINT(lon, lat) AS tract_geom
  FROM `evacuation_readiness.vulnerability_tracts`
  WHERE county_fips = '12071'
),
eligible_shelters AS (
  SELECT 
    s.shelter_id,
    s.shelter_name,
    s.address_1,
    s.city,
    s.zip,
    s.latitude,
    s.longitude,
    s.evacuation_capacity,
    s.post_impact_capacity,
    s.usage,
    s.wheelchair_accessible,
    s.generator_onsite,
    s.in_surge_slosh_area,
    s.is_medical,
    CASE 
      WHEN s.wheelchair_accessible IS TRUE THEN 'YES'
      WHEN s.wheelchair_accessible IS FALSE THEN 'NO'
      ELSE 'UNRECORDED'
    END AS wheelchair_record,
    CASE
      WHEN s.in_surge_slosh_area IS TRUE THEN 'IN_SURGE'
      WHEN s.in_surge_slosh_area IS FALSE THEN 'OUTSIDE_SURGE'
      ELSE 'UNRECORDED'
    END AS surge_record,
    ST_GEOGPOINT(s.longitude, s.latitude) AS shelter_geom
  FROM `evacuation_readiness.shelters` s
  WHERE s.county_fips = '12071'
    AND s.usage IN ('EVAC', 'BOTH')
    AND (s.in_surge_slosh_area IS NOT TRUE)
),
ranked_pairs AS (
  SELECT 
    s.*,
    t.geo_id AS nearest_tract_geo_id,
    ST_DISTANCE(s.shelter_geom, t.tract_geom) AS dist_to_nearest_tract_m,
    ROW_NUMBER() OVER (PARTITION BY s.shelter_id ORDER BY ST_DISTANCE(s.shelter_geom, t.tract_geom) ASC) AS rn
  FROM eligible_shelters s
  CROSS JOIN tract_pts t
)
SELECT 
  shelter_id,
  shelter_name,
  address_1,
  city,
  zip,
  latitude,
  longitude,
  evacuation_capacity,
  post_impact_capacity,
  usage,
  wheelchair_accessible,
  generator_onsite,
  in_surge_slosh_area,
  is_medical,
  wheelchair_record,
  surge_record,
  nearest_tract_geo_id,
  ROUND(dist_to_nearest_tract_m / 1000.0, 2) AS dist_to_nearest_tract_km
FROM ranked_pairs
WHERE rn = 1;

-- 3. v_lee_tract_shelter_pairs: Pairs of tracts and reachable eligible shelters
CREATE OR REPLACE VIEW `evacuation_readiness.v_lee_tract_shelter_pairs` AS
SELECT 
  t.geo_id AS tract_geo_id,
  t.stranded_score,
  t.reachable_dist_m,
  s.shelter_id,
  s.shelter_name,
  s.address_1,
  s.city,
  s.latitude AS shelter_lat,
  s.longitude AS shelter_lon,
  s.wheelchair_record,
  s.surge_record,
  s.evacuation_capacity,
  ROUND(ST_DISTANCE(ST_GEOGPOINT(t.lon, t.lat), ST_GEOGPOINT(s.longitude, s.latitude)) / 1000.0, 2) AS km_straight_line
FROM `evacuation_readiness.v_lee_tract_scores` t
JOIN `evacuation_readiness.v_lee_shelters` s
  ON ST_DWITHIN(ST_GEOGPOINT(t.lon, t.lat), ST_GEOGPOINT(s.longitude, s.latitude), t.reachable_dist_m);

-- 4. v_lee_tract_access_state: State A/B/C/D access classification
CREATE OR REPLACE VIEW `evacuation_readiness.v_lee_tract_access_state` AS
WITH shelter_counts AS (
  SELECT 
    t.geo_id,
    t.stranded_score,
    t.total_pop,
    t.households_no_vehicle,
    t.pct_no_vehicle,
    t.pct_age_65_plus,
    t.pct_disability,
    t.reachable_dist_m,
    COUNT(p.shelter_id) AS total_reachable_shelters,
    COUNTIF(p.wheelchair_record = 'YES') AS count_yes,
    COUNTIF(p.wheelchair_record = 'NO') AS count_no,
    COUNTIF(p.wheelchair_record = 'UNRECORDED') AS count_unrecorded
  FROM `evacuation_readiness.v_lee_tract_scores` t
  LEFT JOIN `evacuation_readiness.v_lee_tract_shelter_pairs` p
    ON t.geo_id = p.tract_geo_id
  GROUP BY 
    t.geo_id, t.stranded_score, t.total_pop, t.households_no_vehicle,
    t.pct_no_vehicle, t.pct_age_65_plus, t.pct_disability, t.reachable_dist_m
)
SELECT 
  geo_id,
  stranded_score,
  total_pop,
  households_no_vehicle,
  pct_no_vehicle,
  pct_age_65_plus,
  pct_disability,
  reachable_dist_m,
  total_reachable_shelters,
  count_yes,
  count_no,
  count_unrecorded,
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
  END AS action_recommendation
FROM shelter_counts;

-- 5. v_lee_equity_audit: Compares top stranded tracts against broader baseline
CREATE OR REPLACE VIEW `evacuation_readiness.v_lee_equity_audit` AS
SELECT 
  a.geo_id,
  a.stranded_score,
  a.access_state,
  a.households_no_vehicle,
  v.median_income,
  v.poverty_rate,
  v.pct_limited_english,
  v.pct_no_internet,
  v.svi_socioeconomic
FROM `evacuation_readiness.v_lee_tract_access_state` a
JOIN `evacuation_readiness.vulnerability_tracts` v
  ON a.geo_id = v.geo_id;
