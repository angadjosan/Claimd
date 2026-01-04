
-- RPC function to fetch the next pending task atomically
CREATE OR REPLACE FUNCTION fetch_next_task()
RETURNS TABLE (
    id UUID,
    task_type TEXT,
    payload JSONB
) AS $$
DECLARE
    selected_task_id UUID;
BEGIN
    -- Find and lock the next pending task
    SELECT pq.id INTO selected_task_id
    FROM processing_queue pq
    WHERE pq.status = 'pending'
    ORDER BY pq.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    -- If a task was found, update it to 'processing' and return it
    IF selected_task_id IS NOT NULL THEN
        UPDATE processing_queue
        SET status = 'processing',
            locked_at = NOW(),
            updated_at = NOW(),
            attempts = attempts + 1
        WHERE processing_queue.id = selected_task_id;

        RETURN QUERY
        SELECT pq.id, pq.task_type, pq.payload
        FROM processing_queue pq
        WHERE pq.id = selected_task_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
