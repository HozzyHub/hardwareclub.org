CREATE TABLE submissions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT NOT NULL,
  categories TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity TEXT NOT NULL,
  powers_on TEXT NOT NULL,
  handoff TEXT NOT NULL,
  drive_back INTEGER NOT NULL DEFAULT 0,
  consent INTEGER NOT NULL DEFAULT 0,
  country TEXT,
  user_agent TEXT,
  status TEXT NOT NULL DEFAULT 'new'
);
CREATE INDEX submissions_created_at ON submissions(created_at);
