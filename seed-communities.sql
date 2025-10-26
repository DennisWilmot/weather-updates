-- Seed major communities for each parish
-- Run this AFTER running schema.sql

-- Get parish IDs for reference
DO $$
DECLARE
  p_kgn UUID; p_and UUID; p_tho UUID; p_por UUID; p_mar UUID; p_ann UUID; p_trl UUID;
  p_jam UUID; p_han UUID; p_wml UUID; p_eli UUID; p_man UUID; p_cla UUID; p_cat UUID;
BEGIN
  -- Fetch parish IDs
  SELECT id INTO p_kgn FROM parishes WHERE code = 'KGN';
  SELECT id INTO p_and FROM parishes WHERE code = 'AND';
  SELECT id INTO p_tho FROM parishes WHERE code = 'THO';
  SELECT id INTO p_por FROM parishes WHERE code = 'POR';
  SELECT id INTO p_mar FROM parishes WHERE code = 'MAR';
  SELECT id INTO p_ann FROM parishes WHERE code = 'ANN';
  SELECT id INTO p_trl FROM parishes WHERE code = 'TRL';
  SELECT id INTO p_jam FROM parishes WHERE code = 'JAM';
  SELECT id INTO p_han FROM parishes WHERE code = 'HAN';
  SELECT id INTO p_wml FROM parishes WHERE code = 'WML';
  SELECT id INTO p_eli FROM parishes WHERE code = 'ELI';
  SELECT id INTO p_man FROM parishes WHERE code = 'MAN';
  SELECT id INTO p_cla FROM parishes WHERE code = 'CLA';
  SELECT id INTO p_cat FROM parishes WHERE code = 'CAT';

  -- Kingston communities
  INSERT INTO communities (name, parish_id, coordinates) VALUES
    ('Downtown Kingston', p_kgn, '{"lat": 17.9681, "lng": -76.7836}'),
    ('Tivoli Gardens', p_kgn, '{"lat": 17.9712, "lng": -76.7925}'),
    ('Rae Town', p_kgn, '{"lat": 17.9750, "lng": -76.7800}'),
    ('Denham Town', p_kgn, '{"lat": 17.9680, "lng": -76.7920}')
  ON CONFLICT (name, parish_id) DO NOTHING;

  -- St. Andrew communities
  INSERT INTO communities (name, parish_id, coordinates) VALUES
    ('Half Way Tree', p_and, '{"lat": 18.0129, "lng": -76.7972}'),
    ('Liguanea', p_and, '{"lat": 18.0070, "lng": -76.7750}'),
    ('Mona', p_and, '{"lat": 18.0070, "lng": -76.7467}'),
    ('Papine', p_and, '{"lat": 18.0233, "lng": -76.7417}'),
    ('Constant Spring', p_and, '{"lat": 18.0242, "lng": -76.7992}'),
    ('Manor Park', p_and, '{"lat": 18.0250, "lng": -76.8050}'),
    ('Crossroads', p_and, '{"lat": 18.0050, "lng": -76.7900}'),
    ('New Kingston', p_and, '{"lat": 18.0075, "lng": -76.7844}'),
    ('Barbican', p_and, '{"lat": 18.0200, "lng": -76.7800}'),
    ('Red Hills', p_and, '{"lat": 18.0400, "lng": -76.8200}'),
    ('Stony Hill', p_and, '{"lat": 18.0700, "lng": -76.7900}')
  ON CONFLICT (name, parish_id) DO NOTHING;

  -- St. Thomas communities
  INSERT INTO communities (name, parish_id, coordinates) VALUES
    ('Morant Bay', p_tho, '{"lat": 17.8814, "lng": -76.4092}'),
    ('Yallahs', p_tho, '{"lat": 17.9167, "lng": -76.5667}'),
    ('Port Morant', p_tho, '{"lat": 17.8936, "lng": -76.3333}'),
    ('Bath', p_tho, '{"lat": 17.9500, "lng": -76.3667}')
  ON CONFLICT (name, parish_id) DO NOTHING;

  -- Portland communities
  INSERT INTO communities (name, parish_id, coordinates) VALUES
    ('Port Antonio', p_por, '{"lat": 18.1765, "lng": -76.4511}'),
    ('Boston Bay', p_por, '{"lat": 18.1833, "lng": -76.3833}'),
    ('Buff Bay', p_por, '{"lat": 18.2167, "lng": -76.5833}'),
    ('Long Bay', p_por, '{"lat": 18.1667, "lng": -76.4167}')
  ON CONFLICT (name, parish_id) DO NOTHING;

  -- St. Mary communities
  INSERT INTO communities (name, parish_id, coordinates) VALUES
    ('Port Maria', p_mar, '{"lat": 18.3697, "lng": -76.8906}'),
    ('Ocho Rios', p_mar, '{"lat": 18.4079, "lng": -77.1025}'),
    ('Annotto Bay', p_mar, '{"lat": 18.2733, "lng": -76.7772}'),
    ('Highgate', p_mar, '{"lat": 18.1833, "lng": -76.8167}')
  ON CONFLICT (name, parish_id) DO NOTHING;

  -- St. Ann communities
  INSERT INTO communities (name, parish_id, coordinates) VALUES
    ('St. Ann''s Bay', p_ann, '{"lat": 18.4358, "lng": -77.2008}'),
    ('Runaway Bay', p_ann, '{"lat": 18.4667, "lng": -77.3333}'),
    ('Browns Town', p_ann, '{"lat": 18.4000, "lng": -77.3500}'),
    ('Discovery Bay', p_ann, '{"lat": 18.4667, "lng": -77.4167}')
  ON CONFLICT (name, parish_id) DO NOTHING;

  -- Trelawny communities
  INSERT INTO communities (name, parish_id, coordinates) VALUES
    ('Falmouth', p_trl, '{"lat": 18.4919, "lng": -77.6561}'),
    ('Duncans', p_trl, '{"lat": 18.4833, "lng": -77.7333}'),
    ('Clark''s Town', p_trl, '{"lat": 18.4167, "lng": -77.6000}')
  ON CONFLICT (name, parish_id) DO NOTHING;

  -- St. James communities
  INSERT INTO communities (name, parish_id, coordinates) VALUES
    ('Montego Bay', p_jam, '{"lat": 18.4762, "lng": -77.8937}'),
    ('Ironshore', p_jam, '{"lat": 18.4667, "lng": -77.8333}'),
    ('Rose Hall', p_jam, '{"lat": 18.4833, "lng": -77.8167}'),
    ('Cambridge', p_jam, '{"lat": 18.4500, "lng": -77.9000}')
  ON CONFLICT (name, parish_id) DO NOTHING;

  -- Hanover communities
  INSERT INTO communities (name, parish_id, coordinates) VALUES
    ('Lucea', p_han, '{"lat": 18.4508, "lng": -78.1731}'),
    ('Green Island', p_han, '{"lat": 18.3667, "lng": -78.2000}'),
    ('Sandy Bay', p_han, '{"lat": 18.4167, "lng": -78.2167}')
  ON CONFLICT (name, parish_id) DO NOTHING;

  -- Westmoreland communities
  INSERT INTO communities (name, parish_id, coordinates) VALUES
    ('Savanna-la-Mar', p_wml, '{"lat": 18.2189, "lng": -78.1328}'),
    ('Negril', p_wml, '{"lat": 18.2692, "lng": -78.3425}'),
    ('Little London', p_wml, '{"lat": 18.3000, "lng": -78.1500}'),
    ('Bluefields', p_wml, '{"lat": 18.1667, "lng": -78.0333}')
  ON CONFLICT (name, parish_id) DO NOTHING;

  -- St. Elizabeth communities
  INSERT INTO communities (name, parish_id, coordinates) VALUES
    ('Black River', p_eli, '{"lat": 18.0253, "lng": -77.8464}'),
    ('Santa Cruz', p_eli, '{"lat": 18.0833, "lng": -77.7667}'),
    ('Treasure Beach', p_eli, '{"lat": 17.9000, "lng": -77.7500}'),
    ('Junction', p_eli, '{"lat": 18.1667, "lng": -77.6667}')
  ON CONFLICT (name, parish_id) DO NOTHING;

  -- Manchester communities
  INSERT INTO communities (name, parish_id, coordinates) VALUES
    ('Mandeville', p_man, '{"lat": 18.0333, "lng": -77.5000}'),
    ('Christiana', p_man, '{"lat": 18.1667, "lng": -77.5167}'),
    ('Porus', p_man, '{"lat": 18.0000, "lng": -77.3833}'),
    ('Williamsfield', p_man, '{"lat": 18.0167, "lng": -77.6167}')
  ON CONFLICT (name, parish_id) DO NOTHING;

  -- Clarendon communities
  INSERT INTO communities (name, parish_id, coordinates) VALUES
    ('May Pen', p_cla, '{"lat": 17.9650, "lng": -77.2433}'),
    ('Chapelton', p_cla, '{"lat": 18.1167, "lng": -77.2167}'),
    ('Old Harbour', p_cla, '{"lat": 17.9500, "lng": -77.1167}'),
    ('Lionel Town', p_cla, '{"lat": 17.8167, "lng": -77.2000}')
  ON CONFLICT (name, parish_id) DO NOTHING;

  -- St. Catherine communities
  INSERT INTO communities (name, parish_id, coordinates) VALUES
    ('Spanish Town', p_cat, '{"lat": 17.9914, "lng": -76.9572}'),
    ('Portmore', p_cat, '{"lat": 17.9500, "lng": -76.8833}'),
    ('Old Harbour Bay', p_cat, '{"lat": 17.9167, "lng": -77.1000}'),
    ('Linstead', p_cat, '{"lat": 18.1333, "lng": -77.0333}'),
    ('Bog Walk', p_cat, '{"lat": 18.1167, "lng": -76.9833}')
  ON CONFLICT (name, parish_id) DO NOTHING;

  RAISE NOTICE 'Successfully seeded communities for all parishes!';
END $$;
