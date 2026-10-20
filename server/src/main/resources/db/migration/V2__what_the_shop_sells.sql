-- LLL Print - module 1, first showing: the option catalogue and its prices.
-- SDD section 4, "What the shop sells". FR-12, FR-3.7.

-- One row per option. The lists are kept apart and never merged into a list of
-- combinations (FR-12.1). A material is one option with its weight in its name,
-- so EYELAT 170gsm is one button (D-W).
CREATE TABLE catalogue_option (
  id                 BIGINT       NOT NULL AUTO_INCREMENT,
  shop_id            BIGINT       NOT NULL,
  kind               VARCHAR(30)  NOT NULL,
  name               VARCHAR(200) NOT NULL,
  standard_price_sen BIGINT       NOT NULL DEFAULT 0,
  charged_per        VARCHAR(10)  NOT NULL,
  offered            BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order         INT          NOT NULL DEFAULT 0,
  created_at         DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at         DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  version            BIGINT       NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_catalogue_option_shop FOREIGN KEY (shop_id) REFERENCES shop (id),
  CONSTRAINT uq_catalogue_option_name UNIQUE (shop_id, kind, name),
  CONSTRAINT ck_catalogue_option_kind CHECK (kind IN (
    'neck',
    'sleeve',
    'size',
    'material',
    'printing_method',
    'print_location',
    'names_and_numbers'
  )),
  -- For every piece, or once for the whole order. Nothing else (FR-1.6).
  CONSTRAINT ck_catalogue_option_charged_per CHECK (charged_per IN ('piece', 'order'))
) ENGINE=InnoDB;

-- There is deliberately NO check that standard_price_sen is zero or above.
-- An option may be worth less than nothing - Kids at minus RM 2.00 is -200 -
-- because that is how a price that comes down is expressed (FR-1.9, FR-12.2).
-- The rule that an amount is never negative belongs to the typed order charge,
-- which is a different table and arrives with the order form.

CREATE INDEX ix_catalogue_option_offered ON catalogue_option (shop_id, kind, offered, sort_order);

-- The shop's own production steps. Sublimation and embroidery do not share a
-- step list, and the shop sets them itself (FR-3.7).
CREATE TABLE production_step (
  id              BIGINT       NOT NULL AUTO_INCREMENT,
  shop_id         BIGINT       NOT NULL,
  printing_method VARCHAR(200) NOT NULL,
  position        INT          NOT NULL,
  label           VARCHAR(200) NOT NULL,
  created_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at      DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  version         BIGINT       NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_production_step_shop FOREIGN KEY (shop_id) REFERENCES shop (id),
  CONSTRAINT uq_production_step_position UNIQUE (shop_id, printing_method, position),
  CONSTRAINT ck_production_step_position CHECK (position > 0)
) ENGINE=InnoDB;
