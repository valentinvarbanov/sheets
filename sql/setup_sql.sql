DROP DATABASE IF EXISTS sheets;

CREATE DATABASE sheets;

USE sheets;

CREATE TABLE tables (
    id INT NOT NULL AUTO_INCREMENT KEY,
    table_id CHAR(5) NOT NULL
);

CREATE TABLE data (
    table_id INT NOT NULL,
    row INT NOT NULL,
    col INT NOT NULL,
    value VARCHAR(255) NOT NULL,
    PRIMARY KEY (table_id, row, col)
);


-- test data
insert into data values
('1-1-1', 1, 1, 1, 'hello');
insert into data values
('1-2-2', 1, 2, 2, 'there');

insert into tables (table_id) VALUES
('hello');
