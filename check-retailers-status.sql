-- Check current retailer statuses
-- Run this in Supabase SQL Editor to see all retailers and their verification status

SELECT 
  id,
  name,
  website_url,
  verified,
  status,
  logo_url,
  created_at
FROM online_retailers
ORDER BY created_at DESC;

-- To verify a retailer and make it visible:
-- UPDATE online_retailers
-- SET verified = TRUE, status = 'active'
-- WHERE id = 'YOUR_RETAILER_ID_HERE';

