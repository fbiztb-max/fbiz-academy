-- Add questions array to stages and remove old single-question fields gradually
ALTER TABLE public.stages ADD COLUMN IF NOT EXISTS questions jsonb DEFAULT '[]'::jsonb;

-- Migrate existing single-question stages into the new questions array (1 question, 1 point for mcq/tf)
UPDATE public.stages
SET questions = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'type', question_type::text,
    'text', question_text,
    'options', COALESCE(options, 'null'::jsonb),
    'correct_answer', correct_answer,
    'points', CASE WHEN question_type::text IN ('mcq','truefalse') THEN 1 ELSE 10 END
  )
)
WHERE (questions IS NULL OR questions = '[]'::jsonb) AND question_text IS NOT NULL;

-- Add answers jsonb to submissions to store per-question responses
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS answers jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS max_score integer;