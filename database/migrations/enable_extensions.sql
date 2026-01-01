-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for hashing SSNs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable moddatetime for automatic updated_at timestamps
CREATE EXTENSION IF NOT EXISTS "moddatetime";
