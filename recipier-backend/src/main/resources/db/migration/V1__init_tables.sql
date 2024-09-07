-- DIALECT: POSTGRES

CREATE TYPE unit_type AS ENUM ('volume', 'weight', 'quantity');

CREATE TABLE unit
(
    id           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    type         unit_type    NOT NULL,
    name         VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(255),
    description  TEXT,

    CONSTRAINT unique_unit_name UNIQUE (name),
    CONSTRAINT unique_unit_abbreviation UNIQUE (abbreviation)
);

CREATE TABLE ingredient
(
    id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,

    CONSTRAINT unique_ingredient_name UNIQUE (name)
);

CREATE TABLE ingredient_conversion
(
    id           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    from_unit_id INT NOT NULL,
    to_unit_id   INT NOT NULL,
    factor       DECIMAL NOT NULL,
    description  TEXT,

    FOREIGN KEY (from_unit_id) REFERENCES unit (id),
    FOREIGN KEY (to_unit_id) REFERENCES unit (id)
);

CREATE TABLE recipe
(
    id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    name        VARCHAR(255) NOT NULL,
    description TEXT,

    CONSTRAINT unique_recipe_name UNIQUE (name)
);

CREATE TABLE recipe_ingredient
(
    id            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recipe_id     INT NOT NULL,
    ingredient_id INT NOT NULL,
    quantity      FLOAT   NOT NULL,
    unit_id       INT NOT NULL,
    description   TEXT,

    FOREIGN KEY (recipe_id) REFERENCES recipe (id),
    FOREIGN KEY (ingredient_id) REFERENCES ingredient (id),
    FOREIGN KEY (unit_id) REFERENCES unit (id)
);

CREATE TABLE recipe_step
(
    id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recipe_id   INT NOT NULL,
    step_number INT NOT NULL,
    description TEXT    NOT NULL,

    FOREIGN KEY (recipe_id) REFERENCES recipe (id)
);

CREATE TABLE mealtime
(
    id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sequence    INT      NOT NULL,
    name        VARCHAR(255) NOT NULL,
    description TEXT,

    CONSTRAINT unique_meal_name UNIQUE (name),
    CONSTRAINT unique_meal_sequence UNIQUE (sequence)
);

CREATE TABLE meal
(
    id          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recipe_id   INT NOT NULL,
    mealtime_id INT NOT NULL,
    date        DATE    NOT NULL,

    FOREIGN KEY (recipe_id) REFERENCES recipe (id),
    FOREIGN KEY (mealtime_id) REFERENCES mealtime (id)
);