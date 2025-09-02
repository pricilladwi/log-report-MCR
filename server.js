const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'log_report',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4_general_ci'
});

app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 AS ok');
    return res.json({ success: true, db: rows[0]?.ok === 1 });
  } catch (err) {
    console.error('Health check failed:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    const { nama, tanggal, kategori, deskripsi, is_safe } = req.body || {};
    if (!nama || !tanggal || !kategori) {
      return res.status(422).json({ success: false, message: 'Nama, tanggal, dan kategori wajib diisi' });
    }
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
      return res.status(422).json({ success: false, message: 'Format tanggal tidak valid' });
    }
    console.log('Date from form (will be saved directly):', tanggal);
      const normalizedDescription = typeof deskripsi === 'string' ? deskripsi.trim() : '';
      const [result] = await pool.execute(
        'INSERT INTO reports (nama, tanggal, kategori, deskripsi, is_safe) VALUES (?, ?, ?, ?, ?)',
        [nama.trim(), tanggal, kategori.trim(), normalizedDescription, is_safe ? 1 : 0]
      );
    return res.json({ success: true, message: 'Laporan berhasil disimpan', data: { id: result.insertId } });
  } catch (err) {
    console.error('Insert failed:', err.message);
    return res.status(500).json({ success: false, message: 'Gagal menyimpan data', error: err.message });
  }
});

app.get('/api/reports', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const offset = (page - 1) * limit;

    const [rows] = await pool.execute(
      'SELECT id, nama, tanggal, kategori, deskripsi, is_safe, created_at FROM reports ORDER BY created_at DESC LIMIT ? OFFSET ?;',
      [limit, offset]
    );

    const [countRows] = await pool.execute('SELECT COUNT(*) AS total FROM reports;');
    const total = countRows[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, totalPages }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Gagal mengambil data' });
  }
});

app.put('/api/reports/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }

    const { nama, tanggal, kategori, deskripsi, is_safe } = req.body || {};
    if (!nama || !tanggal || !kategori) {
      return res.status(422).json({ success: false, message: 'Nama, tanggal, dan kategori wajib diisi' });
    }
    
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(tanggal)) {
      return res.status(422).json({ success: false, message: 'Format tanggal tidak valid' });
    }
    
    console.log('Update - Date from form (will be saved directly):', tanggal);

    const normalizedDescription = typeof deskripsi === 'string' ? deskripsi.trim() : '';
    const [result] = await pool.execute(
      'UPDATE reports SET nama = ?, tanggal = ?, kategori = ?, deskripsi = ?, is_safe = ? WHERE id = ? LIMIT 1',
      [nama.trim(), tanggal, kategori.trim(), normalizedDescription, is_safe ? 1 : 0, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }

    return res.json({ success: true, message: 'Laporan berhasil diperbarui' });
  } catch (err) {
    console.error('Update failed:', err.message);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui data', error: err.message });
  }
});

app.delete('/api/reports/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ success: false, message: 'ID tidak valid' });
    }
    const [result] = await pool.execute('DELETE FROM reports WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    }
    return res.json({ success: true, message: 'Laporan berhasil dihapus' });
  } catch (err) {
    console.error('Delete failed:', err.message);
    return res.status(500).json({ success: false, message: 'Gagal menghapus data', error: err.message });
  }
});

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

app.use(express.static(path.join(__dirname)));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});