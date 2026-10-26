-- LLL Print - module 1, second showing: the order form and its running total.
-- The customer, the order being typed, and its three levels.
-- SDD section 4, "Customers" and "The order and its quotation". FR-1, FR-2, FR-9.

-- FR-9. A customer. There is no kind, type or category on a contact: these are
-- customers, and suppliers belong to the stock world, which is out of scope.
CREATE TABLE contact (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  shop_id       BIGINT       NOT NULL,
  name          VARCHAR(200) NOT NULL,
  phone         VARCHAR(40)      NULL,
  email         VARCHAR(254)     NULL,
  address       VARCHAR(500)     NULL,
  -- For the shop only. FR-9.5 says it never appears on anything a customer
  -- sees, and the address behind the customer's link does not select it.
  internal_note VARCHAR(2000)    NULL,
  created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  version       BIGINT       NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_contact_shop FOREIGN KEY (shop_id) REFERENCES shop (id),
  -- FR-9.2. At least one way of reaching them.
  CONSTRAINT ck_contact_reachable CHECK (phone IS NOT NULL OR email IS NOT NULL)
) ENGINE=InnoDB;

CREATE INDEX ix_contact_name ON contact (shop_id, name);

-- One row per shop and kind, holding the last number given out. Read, raised
-- and used inside one transaction, so two orders made at the same moment cannot
-- both take Q-0001 (D-X). Nothing reads this to show anything.
CREATE TABLE document_number (
  id          BIGINT      NOT NULL AUTO_INCREMENT,
  shop_id     BIGINT      NOT NULL,
  kind        VARCHAR(20) NOT NULL,
  last_number BIGINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_document_number_shop FOREIGN KEY (shop_id) REFERENCES shop (id),
  CONSTRAINT uq_document_number UNIQUE (shop_id, kind),
  CONSTRAINT ck_document_number_kind CHECK (kind IN ('quotation', 'job', 'invoice'))
) ENGINE=InnoDB;

-- There is no separate order record. A draft quotation IS the order being
-- typed, so the form's save and the quotation's save are the same write
-- (FR-1.10, FR-2.1).
CREATE TABLE quotation (
  id                  BIGINT       NOT NULL AUTO_INCREMENT,
  shop_id             BIGINT       NOT NULL,
  number              VARCHAR(20)  NOT NULL,            -- Q-0001
  state               VARCHAR(20)  NOT NULL DEFAULT 'draft',
  job_title           VARCHAR(200) NOT NULL,            -- the first thing typed (FR-1.2)
  contact_id          BIGINT           NULL,

  -- The customer as they were when this was made. Correcting the customer later
  -- must never rewrite what this quotation says (FR-2.2, FR-9.4).
  customer_name       VARCHAR(200)     NULL,
  customer_phone      VARCHAR(40)      NULL,
  customer_email      VARCHAR(254)     NULL,
  customer_address    VARCHAR(500)     NULL,

  date_wanted         DATE             NULL,            -- 5 October on the real order
  valid_until         DATE             NULL,            -- FR-2.3

  -- The base price per piece: the plainest garment, roundneck and short sleeve,
  -- costs what the cloth costs. Copied from the cloth option as it was shown,
  -- or a one-off price Admin typed over it (FR-1.4a, FR-1.5).
  price_per_piece_sen BIGINT       NOT NULL DEFAULT 0,
  source_note         VARCHAR(500)     NULL,            -- optional, never refused for being empty (FR-4)

  -- Worked out from the lines and stored so a document can be reproduced
  -- exactly. The server works them out again on every read and every write and
  -- refuses a total that does not match (SEC-7).
  item_subtotal_sen   BIGINT       NOT NULL DEFAULT 0,
  shipping_charge_sen BIGINT       NOT NULL DEFAULT 0,
  grand_total_sen     BIGINT       NOT NULL DEFAULT 0,

  created_at          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  version             BIGINT       NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_quotation_shop    FOREIGN KEY (shop_id)    REFERENCES shop (id),
  CONSTRAINT fk_quotation_contact FOREIGN KEY (contact_id) REFERENCES contact (id),
  CONSTRAINT uq_quotation_number UNIQUE (shop_id, number),
  CONSTRAINT ck_quotation_state CHECK (state IN ('draft', 'sent', 'agreed', 'converted', 'cancelled')),
  -- FR-1.4a. The garment's own price is zero or above. A thing worth less is an
  -- option priced below zero, which is a different table.
  CONSTRAINT ck_quotation_price_per_piece CHECK (price_per_piece_sen >= 0),
  CONSTRAINT ck_quotation_shipping CHECK (shipping_charge_sen >= 0)
) ENGINE=InnoDB;

CREATE INDEX ix_quotation_state ON quotation (shop_id, state, date_wanted);
CREATE INDEX ix_quotation_job_title ON quotation (shop_id, job_title);

-- Level one: typed once for the whole order (FR-1.3). A table rather than three
-- fixed columns, so a shop needing a fourth kind is new rows, not a new table.
CREATE TABLE quotation_specification (
  id                  BIGINT       NOT NULL AUTO_INCREMENT,
  shop_id             BIGINT       NOT NULL,
  quotation_id        BIGINT       NOT NULL,
  kind                VARCHAR(30)  NOT NULL,
  catalogue_option_id BIGINT           NULL,
  -- The name and the price AS THEY WERE SHOWN. Changing the catalogue tomorrow
  -- cannot alter what this customer was quoted today (FR-2.2, FR-12.7).
  name                VARCHAR(200) NOT NULL,
  price_sen           BIGINT       NOT NULL DEFAULT 0,
  charged_per         VARCHAR(10)  NOT NULL,
  sort_order          INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_quotation_specification_shop      FOREIGN KEY (shop_id)             REFERENCES shop (id),
  CONSTRAINT fk_quotation_specification_quotation FOREIGN KEY (quotation_id)        REFERENCES quotation (id),
  CONSTRAINT fk_quotation_specification_option    FOREIGN KEY (catalogue_option_id) REFERENCES catalogue_option (id),
  CONSTRAINT ck_quotation_specification_kind CHECK (kind IN ('material', 'printing_method', 'print_location')),
  CONSTRAINT ck_quotation_specification_charged_per CHECK (charged_per IN ('piece', 'order'))
) ENGINE=InnoDB;

CREATE INDEX ix_quotation_specification ON quotation_specification (quotation_id, sort_order);

-- Level two: one row per garment group. Five on the real order.
CREATE TABLE quotation_garment_group (
  id                  BIGINT       NOT NULL AUTO_INCREMENT,
  shop_id             BIGINT       NOT NULL,
  quotation_id        BIGINT       NOT NULL,

  neck_option_id      BIGINT           NULL,
  neck_name           VARCHAR(200)     NULL,
  neck_price_sen      BIGINT           NULL,
  neck_charged_per    VARCHAR(10)      NULL,

  sleeve_option_id    BIGINT           NULL,
  sleeve_name         VARCHAR(200)     NULL,
  sleeve_price_sen    BIGINT           NULL,
  sleeve_charged_per  VARCHAR(10)      NULL,

  -- Free text with no price effect, such as readymade (D-E, FR-1.4).
  note                VARCHAR(500)     NULL,
  sort_order          INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_quotation_group_shop      FOREIGN KEY (shop_id)          REFERENCES shop (id),
  CONSTRAINT fk_quotation_group_quotation FOREIGN KEY (quotation_id)     REFERENCES quotation (id),
  CONSTRAINT fk_quotation_group_neck      FOREIGN KEY (neck_option_id)   REFERENCES catalogue_option (id),
  CONSTRAINT fk_quotation_group_sleeve    FOREIGN KEY (sleeve_option_id) REFERENCES catalogue_option (id),
  CONSTRAINT ck_quotation_group_neck_charged_per CHECK (neck_charged_per IS NULL OR neck_charged_per IN ('piece', 'order')),
  CONSTRAINT ck_quotation_group_sleeve_charged_per CHECK (sleeve_charged_per IS NULL OR sleeve_charged_per IN ('piece', 'order'))
) ENGINE=InnoDB;

CREATE INDEX ix_quotation_group ON quotation_garment_group (quotation_id, sort_order);

-- Level three: one row per size entry. Twenty on the real order.
-- It hangs off the garment group, so MySQL will not let a size exist without
-- its group, and the grouping the reader must keep is held up by the database
-- rather than by care (FR-1.14).
CREATE TABLE quotation_size (
  id                         BIGINT       NOT NULL AUTO_INCREMENT,
  shop_id                    BIGINT       NOT NULL,
  quotation_garment_group_id BIGINT       NOT NULL,
  catalogue_option_id        BIGINT           NULL,
  name                       VARCHAR(200) NOT NULL,
  price_sen                  BIGINT       NOT NULL DEFAULT 0,
  charged_per                VARCHAR(10)  NOT NULL,
  quantity                   INT          NOT NULL,
  -- Free text for one piece, such as a person's name or number (FR-1.4).
  note                       VARCHAR(200)     NULL,
  sort_order                 INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_quotation_size_shop   FOREIGN KEY (shop_id)                    REFERENCES shop (id),
  CONSTRAINT fk_quotation_size_group  FOREIGN KEY (quotation_garment_group_id) REFERENCES quotation_garment_group (id),
  CONSTRAINT fk_quotation_size_option FOREIGN KEY (catalogue_option_id)        REFERENCES catalogue_option (id),
  CONSTRAINT ck_quotation_size_quantity CHECK (quantity > 0),
  CONSTRAINT ck_quotation_size_charged_per CHECK (charged_per IN ('piece', 'order'))
) ENGINE=InnoDB;

CREATE INDEX ix_quotation_size ON quotation_size (quotation_garment_group_id, sort_order);

-- A charge Admin typed on the whole order, such as artwork setup at RM 50.00.
-- There is no catalogue key, because a typed charge does not come from the
-- catalogue (FR-1.6a, D-Y).
CREATE TABLE quotation_charge (
  id           BIGINT       NOT NULL AUTO_INCREMENT,
  shop_id      BIGINT       NOT NULL,
  quotation_id BIGINT       NOT NULL,
  name         VARCHAR(200) NOT NULL,
  amount_sen   BIGINT       NOT NULL,
  charged_per  VARCHAR(10)  NOT NULL,
  sort_order   INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_quotation_charge_shop      FOREIGN KEY (shop_id)      REFERENCES shop (id),
  CONSTRAINT fk_quotation_charge_quotation FOREIGN KEY (quotation_id) REFERENCES quotation (id),
  -- Never negative, and MySQL itself refuses one. A negative typed line is the
  -- discount FR-1.9 forbids (FR-1.6a, D-Y).
  CONSTRAINT ck_quotation_charge_amount CHECK (amount_sen >= 0),
  CONSTRAINT ck_quotation_charge_charged_per CHECK (charged_per IN ('piece', 'order'))
) ENGINE=InnoDB;

CREATE INDEX ix_quotation_charge ON quotation_charge (quotation_id, sort_order);

-- A price for one customer against one option (FR-12.6). The pair is unique, so
-- the database itself makes two prices for the same customer and option
-- impossible. Used instead of the standard price by FR-1.5, and that now
-- includes the cloth that carries the base price per piece (FR-1.4a).
CREATE TABLE customer_price (
  id                  BIGINT      NOT NULL AUTO_INCREMENT,
  shop_id             BIGINT      NOT NULL,
  contact_id          BIGINT      NOT NULL,
  catalogue_option_id BIGINT      NOT NULL,
  price_sen           BIGINT      NOT NULL,
  created_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at          DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  version             BIGINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_customer_price_shop    FOREIGN KEY (shop_id)             REFERENCES shop (id),
  CONSTRAINT fk_customer_price_contact FOREIGN KEY (contact_id)          REFERENCES contact (id),
  CONSTRAINT fk_customer_price_option  FOREIGN KEY (catalogue_option_id) REFERENCES catalogue_option (id),
  CONSTRAINT uq_customer_price UNIQUE (contact_id, catalogue_option_id)
) ENGINE=InnoDB;
