-- Insert deployed version
INSERT INTO ai_model_versions (
  version,
  status,
  training_data,
  metrics,
  deployed_at,
  deployed_by
) VALUES (
  '1.0.0',
  'deployed',
  '{"samples": 1000, "accuracy": 0.85, "precision": 0.82, "recall": 0.88}'::jsonb,
  '{"accuracy": 0.85, "precision": 0.82, "recall": 0.88}'::jsonb,
  NOW(),
  1
);

-- Insert ready version
INSERT INTO ai_model_versions (
  version,
  status,
  training_data,
  metrics
) VALUES (
  '1.1.0',
  'ready',
  '{"samples": 1200, "accuracy": 0.88, "precision": 0.85, "recall": 0.91}'::jsonb,
  '{"accuracy": 0.88, "precision": 0.85, "recall": 0.91}'::jsonb
); 