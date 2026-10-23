USE raices_del_fogon;

ALTER TABLE platos
  ADD COLUMN archivo_id INT UNSIGNED NULL AFTER imagen_url,
  ADD CONSTRAINT uq_platos_archivo UNIQUE (archivo_id),
  ADD CONSTRAINT fk_platos_archivo FOREIGN KEY (archivo_id)
    REFERENCES archivos (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;
