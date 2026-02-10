-- Server-side time-bucketing function for analytics trends
-- Uses DATE_TRUNC + generate_series for efficient aggregation

CREATE OR REPLACE FUNCTION analytics_time_buckets(
  p_interval text,       -- '1 day', '1 week', '1 month'
  p_start    timestamptz,
  p_end      timestamptz
)
RETURNS TABLE(bucket_start timestamptz, bucket_end timestamptz, bucket_label text) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gs AS bucket_start,
    CASE
      WHEN p_interval = '1 day'   THEN gs + INTERVAL '1 day'   - INTERVAL '1 second'
      WHEN p_interval = '1 week'  THEN gs + INTERVAL '1 week'  - INTERVAL '1 second'
      WHEN p_interval = '1 month' THEN gs + INTERVAL '1 month' - INTERVAL '1 second'
      ELSE gs + INTERVAL '1 day' - INTERVAL '1 second'
    END AS bucket_end,
    CASE
      WHEN p_interval = '1 day'   THEN TO_CHAR(gs, 'Dy, Mon DD')
      WHEN p_interval = '1 week'  THEN TO_CHAR(gs, 'Mon DD')
      WHEN p_interval = '1 month' THEN TO_CHAR(gs, 'Mon YY')
      ELSE TO_CHAR(gs, 'Mon DD')
    END AS bucket_label
  FROM generate_series(p_start, p_end, p_interval::interval) AS gs
  ORDER BY gs;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
