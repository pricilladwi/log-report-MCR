document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('table-body');
  const pageInfo = document.getElementById('page-info');
  const summary = document.getElementById('summary');
  const btnPrev = document.getElementById('prev');
  const btnNext = document.getElementById('next');
  const limitSelect = document.getElementById('limit');
  let state = { page: 1, limit: parseInt(limitSelect.value, 10), totalPages: 1, total: 0 };

  const editDatepicker = flatpickr('#edit-tanggal', {
    dateFormat: 'Y-m-d',
    altInput: true,
    altFormat: 'd F Y',
    defaultDate: new Date(),
    locale: 'id',
    allowInput: true
  });

  async function load() {
    try {
      tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-4 text-center text-gray-500">Memuat...</td></tr>';
      const res = await fetch(`/api/reports?page=${state.page}&limit=${state.limit}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Gagal memuat data');

      const rows = json.data || [];
      state.totalPages = json.pagination.totalPages;
      state.total = json.pagination.total;

      summary.textContent = `Total laporan: ${state.total}`;
      pageInfo.textContent = `Halaman ${state.page} dari ${state.totalPages}`;

      if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-4 text-center text-gray-500">Belum ada data</td></tr>';
        return;
      }

      console.log('Raw data from server:', rows);
      
      tbody.innerHTML = rows.map(r => {
        console.log(`Row ${r.id} - tanggal:`, r.tanggal, 'type:', typeof r.tanggal);
        
        return `
        <tr>
          <td class="px-4 py-3 text-sm text-gray-700">${r.id}</td>
          <td class="px-4 py-3 text-sm text-gray-700">${formatDateForDisplay(r.tanggal)}</td>
          <td class="px-4 py-3 text-sm text-gray-700">${escapeHtml(r.nama)}</td>
          <td class="px-4 py-3 text-sm text-gray-700">${escapeHtml(r.kategori)}</td>
          <td class="px-4 py-3 text-sm text-gray-700">${r.is_safe ? 'Aman' : 'Tidak Aman'}</td>
          <td class="px-4 py-3 text-sm text-gray-700 max-w-[400px] truncate" title="${escapeHtml(r.deskripsi)}">${escapeHtml(r.deskripsi)}</td>
          <td class="px-4 py-3 text-sm text-gray-700">${new Date(r.created_at).toLocaleString()}</td>
          <td class="px-4 py-3 text-sm">
            <div class="flex gap-2">
              <button data-id="${r.id}" data-row='${JSON.stringify({
                id: r.id,
                nama: r.nama,
                tanggal: r.tanggal,
                kategori: r.kategori,
                deskripsi: r.deskripsi,
                is_safe: r.is_safe
              }).replace(/"/g, '&quot;')}' class="btn-edit px-3 py-1 text-white bg-green-500 rounded hover:bg-green-600 text-xs">Edit</button>
              <button data-id="${r.id}" class="btn-delete px-3 py-1 text-white bg-red-600 rounded hover:bg-red-700 text-xs">Hapus</button>
            </div>
          </td>
        </tr>
      `;
      }).join('');

      btnPrev.disabled = state.page <= 1;
      btnNext.disabled = state.page >= state.totalPages;

      tbody.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          if (!confirm('Yakin ingin menghapus data ini?')) return;
          try {
            const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || 'Gagal menghapus');
            if (tbody.children.length === 1 && state.page > 1) {
              state.page--;
            }
            await load();
          } catch (err) {
            alert(err.message);
          }
        });
      });

      const modal = document.getElementById('edit-modal');
      const form = document.getElementById('edit-form');
      const cancelBtn = document.getElementById('edit-cancel');
      const inputId = document.getElementById('edit-id');
      const inputNama = document.getElementById('edit-nama');
      const inputTanggal = document.getElementById('edit-tanggal');
      const inputKategori = document.getElementById('edit-kategori');
      const inputDeskripsi = document.getElementById('edit-deskripsi');
      const inputIsSafeYes = document.getElementById('edit-is-safe-yes');
      const inputIsSafeNo = document.getElementById('edit-is-safe-no');

      function openModal() { 
        modal.classList.remove('hidden'); 
        modal.classList.add('flex'); 
      }
      function closeModal() { 
        modal.classList.add('hidden'); 
        modal.classList.remove('flex'); 

        form.reset();
        editDatepicker.setDate(new Date(), true);
      }

      tbody.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          const data = JSON.parse(btn.getAttribute('data-row').replace(/&quot;/g, '"'));
          inputId.value = data.id;
          inputNama.value = data.nama || '';
          
          if (data.tanggal) {
            editDatepicker.setDate(data.tanggal, true);
          } else {
            editDatepicker.setDate(new Date(), true);
          }
          inputKategori.value = data.kategori || '';
          inputDeskripsi.value = data.deskripsi || '';
          if (Boolean(data.is_safe)) {
            inputIsSafeYes.checked = true;
          } else {
            inputIsSafeNo.checked = true;
          }
          openModal();
        });
      });

      cancelBtn.onclick = closeModal;
      modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
      form.onsubmit = async (e) => {
        e.preventDefault();
        const id = inputId.value;
        const payload = {
          nama: inputNama.value.trim(),
          tanggal: editDatepicker.selectedDates[0] ? editDatepicker.formatDate(editDatepicker.selectedDates[0], 'Y-m-d') : '',
          kategori: inputKategori.value.trim(),
          deskripsi: inputDeskripsi.value.trim(),
          is_safe: inputIsSafeYes.checked ? 1 : 0
        };
        try {
          const res = await fetch(`/api/reports/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const json = await res.json();
          if (!res.ok || !json.success) throw new Error(json.message || 'Gagal menyimpan perubahan');
          closeModal();
          await load();
        } catch (err) {
          alert(err.message);
        }
      };
    } catch (e) {
      console.error(e);
      tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-4 text-center text-red-600">${e.message}</td></tr>`;
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"]+/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
  }

  function formatDateForDisplay(dateString) {
    try {
      if (!dateString || typeof dateString !== 'string') {
        return 'Tanggal tidak valid';
      }
      
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      }
      
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Tanggal tidak valid';
      }
      
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (e) {
      console.error('Error formatting date:', e, 'dateString:', dateString);
      return 'Tanggal tidak valid';
    }
  }

  btnPrev.addEventListener('click', () => { if (state.page > 1) { state.page--; load(); } });
  btnNext.addEventListener('click', () => { if (state.page < state.totalPages) { state.page++; load(); } });
  limitSelect.addEventListener('change', () => { state.limit = parseInt(limitSelect.value, 10); state.page = 1; load(); });

  load();
});