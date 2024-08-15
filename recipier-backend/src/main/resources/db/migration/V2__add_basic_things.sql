-- Database: PostgreSQL
-- Adding basic units to the database

INSERT INTO mealtime
VALUES (DEFAULT, 1, 'Breakfast', 'The first meal of the day');
INSERT INTO mealtime
VALUES (DEFAULT, 2, 'Lunch', 'The second meal of the day');
INSERT INTO mealtime
VALUES (DEFAULT, 3, 'Dinner', 'The third meal of the day');

INSERT INTO ingredient
VALUES (DEFAULT, 'cabbage', 'Nice and green');
INSERT INTO ingredient
VALUES (DEFAULT, 'carrot', 'Orange and crunchy');
INSERT INTO ingredient
VALUES (DEFAULT, 'potato', 'Yellow and soft');
INSERT INTO ingredient
VALUES (DEFAULT, 'onion', 'White and spicy');

INSERT INTO unit
VALUES (DEFAULT, 'WEIGHT', 'g', 'gram');
INSERT INTO unit
VALUES (DEFAULT, 'WEIGHT', 'kg', 'kilogram');
INSERT INTO unit
VALUES (DEFAULT, 'VOLUME', 'ml', 'milliliter');
INSERT INTO unit
VALUES (DEFAULT, 'VOLUME', 'l', 'liter');
INSERT INTO unit
VALUES (DEFAULT, 'QUANTITY', 'pcs', 'pieces');