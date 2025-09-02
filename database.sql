CREATE DATABASE IF NOT EXISTS log_report
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE log_report;

CREATE TABLE IF NOT EXISTS reports (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nama VARCHAR(150) NOT NULL,
  tanggal DATE NOT NULL,
  kategori VARCHAR(200) NOT NULL,
  deskripsi TEXT NULL,
  is_safe TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tanggal (tanggal),
  KEY idx_kategori (kategori)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;