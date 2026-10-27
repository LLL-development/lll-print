-- LLL Print - module 1, logging in.
-- One row per live session, so that signing out really ends access and is not
-- merely a token left to expire on its own (SEC-6).
--
-- SDD section 4 lists no table for this, because section 6 describes signing in
-- rather than storing it. The row is what makes the two things SEC-6 is checked
-- on possible: an ended session is refused, and an expired one is refused.

CREATE TABLE staff_session (
  id               BIGINT      NOT NULL AUTO_INCREMENT,
  shop_id          BIGINT      NOT NULL,
  staff_account_id BIGINT      NOT NULL,
  -- The token itself is never stored. This is a SHA-256 of it, so a copy of the
  -- database does not hand over a working session (SEC-4, SEC-6).
  token_hash       CHAR(64)    NOT NULL,
  issued_at        DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  expires_at       DATETIME(6) NOT NULL,
  -- Set when the account signs out. A session with this set is refused from
  -- that moment, on every device at once.
  ended_at         DATETIME(6)     NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_staff_session_shop    FOREIGN KEY (shop_id)          REFERENCES shop (id),
  CONSTRAINT fk_staff_session_account FOREIGN KEY (staff_account_id) REFERENCES staff_account (id),
  CONSTRAINT uq_staff_session_token UNIQUE (token_hash)
) ENGINE=InnoDB;

-- Looked up by its token on every single request, so this index is on the path
-- of every call, exactly like the grant index in V1 (D-AF).
CREATE INDEX ix_staff_session_account ON staff_session (staff_account_id);
