CREATE TABLE travelist_votes (
  vote_id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  user_id INTEGER REFERENCES travelist_users(id),
  article_id INTEGER REFERENCES travelist_articles(id),
  voted BOOLEAN NOT NULL 
);

ALTER TABLE travelist_votes ALTER COLUMN voted SET DEFAULT FALSE;