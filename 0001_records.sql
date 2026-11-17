CREATE TABLE records (id TEXT PRIMARY KEY, kind TEXT NOT NULL, data TEXT NOT NULL);
CREATE INDEX records_kind ON records(kind);
