-- LLL Print - module 1, the foundation.
-- The shop, its staff accounts, and what each account is allowed to do.
-- SDD section 4, "The shop and its people". FR-10, FR-13.

CREATE TABLE shop (
  id                  BIGINT       NOT NULL AUTO_INCREMENT,
  name                VARCHAR(200) NOT NULL,
  registration_number VARCHAR(50)      NULL,   -- the SSM number (FR-13.1)
  address             VARCHAR(500)     NULL,
  phone               VARCHAR(40)      NULL,
  email               VARCHAR(254)     NULL,
  logo_path           VARCHAR(500)     NULL,
  pickup_location     VARCHAR(500)     NULL,   -- self-collection (FR-6.7)
  colour_disclaimer   VARCHAR(1000)    NULL,   -- a standing line, not a field on an order
  created_at          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  version             BIGINT       NOT NULL DEFAULT 0,  -- SEC-8
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- FR-10. An account is switched off, never deleted, so history keeps pointing
-- at a real account.
CREATE TABLE staff_account (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  shop_id       BIGINT       NOT NULL,
  name          VARCHAR(200) NOT NULL,
  username      VARCHAR(100) NOT NULL,
  email         VARCHAR(254)     NULL,
  password_hash VARCHAR(255) NOT NULL,          -- hashed, never readable (SEC-6)
  role          VARCHAR(10)  NOT NULL,
  active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  version       BIGINT       NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_staff_account_shop FOREIGN KEY (shop_id) REFERENCES shop (id),
  CONSTRAINT uq_staff_account_username UNIQUE (shop_id, username),
  CONSTRAINT ck_staff_account_role CHECK (role IN ('admin', 'staff'))
) ENGINE=InnoDB;

-- One row per granted action, not one column per action, so a new grant is a
-- new row rather than a change to the table's shape (SPMP section 2.2).
-- A new account has no rows here at all, so it can do nothing (FR-10.1).
CREATE TABLE staff_grant (
  id               BIGINT      NOT NULL AUTO_INCREMENT,
  shop_id          BIGINT      NOT NULL,
  staff_account_id BIGINT      NOT NULL,
  action           VARCHAR(40) NOT NULL,
  granted_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  CONSTRAINT fk_staff_grant_shop    FOREIGN KEY (shop_id)          REFERENCES shop (id),
  CONSTRAINT fk_staff_grant_account FOREIGN KEY (staff_account_id) REFERENCES staff_account (id),
  CONSTRAINT uq_staff_grant UNIQUE (staff_account_id, action),
  -- The eleven named business actions of FR-10.2, and no others.
  CONSTRAINT ck_staff_grant_action CHECK (action IN (
    'see_released_job',
    'attach_mockup',
    'complete_step',
    'skip_step',
    'return_to_step',
    'record_posted',
    'record_collected',
    'record_payment',
    'void_payment',
    'record_refund',
    'maintain_catalogue'
  ))
) ENGINE=InnoDB;

-- The grants are read from these rows on every request, so this index is on the
-- path of every single call (D-AF).
CREATE INDEX ix_staff_grant_account ON staff_grant (staff_account_id);
