-- =====================================================================
-- Migración 001 — Fotos de platos subidas al servidor
-- Solo para bases de datos creadas ANTES de esta versión. No borra datos:
-- agrega la columna platos.archivo_id y su llave foránea hacia archivos.
-- `npm run db:setup` la ejecuta sola cuando hace falta. Si usa phpMyAdmin,
-- ejecútela una sola vez después de importar schema.sql.
-- =====================================================================

USE raices_del_fogon;

ALTER TABLE platos
  ADD COLUMN archivo_id INT UNSIGNED NULL AFTER imagen_url,
  ADD CONSTRAINT uq_platos_archivo UNIQUE (archivo_id),
  ADD CONSTRAINT fk_platos_archivo FOREIGN KEY (archivo_id)
    REFERENCES archivos (id)
    ON UPDATE CASCADE
    ON DELETE SET NULL;
