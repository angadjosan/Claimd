# AI App Processing Service

This service is a Python-based worker that processes tasks from a PostgreSQL queue. It is designed to be reliable and scalable, mimicking the behavior of AWS SQS but using your existing Supabase/PostgreSQL infrastructure.

## Architecture

1.  **Queue Table**: A `processing_queue` table in PostgreSQL holds tasks.
2.  **Worker**: A Python script (`worker.py`) polls this table for `pending` tasks.
3.  **Concurrency**: Uses `FOR UPDATE SKIP LOCKED` to ensure that multiple workers can run simultaneously without processing the same task twice.

## Setup

### 1. Database Setup

Run the SQL in `queue_schema.sql` in your Supabase SQL Editor to create the queue table.

### 2. Environment Setup

Create a virtual environment and install dependencies:

```bash
cd ai-app-processing-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Configuration

Create a `.env` file in this directory with your database connection string:

```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

You can find this in Supabase Dashboard -> Project Settings -> Database -> Connection string -> URI.

## Running the Worker

```bash
python worker.py
```

The worker will start polling for tasks. You can run multiple instances of this script to scale up processing.

## Adding Tasks

To add a task to the queue, simply insert a row into the `processing_queue` table:

```sql
INSERT INTO processing_queue (task_type, payload, application_id)
VALUES ('extract_info', '{"document_url": "..."}', 'uuid-of-application');
```

The worker will automatically pick it up.
