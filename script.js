document.addEventListener('DOMContentLoaded', function() {
  const datepicker = flatpickr('#tanggal', {
    dateFormat: 'Y-m-d',
    altInput: true,
    altFormat: 'd F Y',
    defaultDate: new Date(),
    locale: 'id',
    allowInput: true
  });
    
  const form = document.getElementById('reportForm');
  const modal = document.getElementById('successModal');
  const closeModal = document.getElementById('closeModal');
    
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
        
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    data.is_safe = parseInt(data.is_safe || '1', 10);
        
    if (validateForm(data)) {
      try {
        const response = await fetch('/api/reports', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        });
        const result = await response.json();
        if (response.ok && result.success) {
          modal.classList.remove('hidden');
          modal.classList.add('flex');
          form.reset();
          if (datepicker) {
            datepicker.setDate(new Date(), true);
          }
        } else {
          alert(result.message || 'Terjadi kesalahan saat mengirim data');
        }
      } catch (err) {
        alert('Gagal terhubung ke server. Pastikan backend berjalan.');
        console.error(err);
      }
    }
  });
    
  closeModal.addEventListener('click', function() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  });
    
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  });
    
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  });
    
  const inputs = form.querySelectorAll('input, textarea, select');
  inputs.forEach(input => {
    input.addEventListener('blur', function() {
      validateField(this);
    });
        
    input.addEventListener('input', function() {
      if (this.classList.contains('border-red-500')) {
        this.classList.remove('border-red-500');
        this.classList.add('border-gray-300');
      }
    });
  });
});

function validateForm(data) {
  let isValid = true;
    
  if (!data.nama.trim()) {
    showError('nama', 'Nama harus diisi');
    isValid = false;
  }
  if (!data.tanggal) {
    showError('tanggal', 'Tanggal harus dipilih');
    isValid = false;
  }
  if (!data.kategori) {
    showError('kategori', 'Kategori harus dipilih');
    isValid = false;
  }
  return isValid;
}

function validateField(field) {
  const value = field.value.trim();
  const fieldName = field.name;
    
  field.classList.remove('border-red-500');
  field.classList.add('border-gray-300');
    
  const existingError = field.parentNode.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }
    
  switch (fieldName) {
    case 'nama':
      if (value.length < 2) {
        showError(fieldName, 'Nama minimal 2 karakter');
      }
    break;
    case 'kategori':
      if (!value) {
        showError(fieldName, 'Kategori harus dipilih');
      }
    break;
  }
}

function showError(fieldName, message) {
  const field = document.getElementById(fieldName);
  const parent = field.parentNode;
    
  field.classList.remove('border-gray-300');
  field.classList.add('border-red-500');
    
  const existingError = parent.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }
    
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message text-red-500 text-sm mt-1';
  errorDiv.textContent = message;
  parent.appendChild(errorDiv);
}

function addAnimations() {
  const formFields = document.querySelectorAll('.space-y-6 > div');
  formFields.forEach((field, index) => {
    field.style.opacity = '0';
    field.style.transform = 'translateY(20px)';
    field.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        
    setTimeout(() => {
      field.style.opacity = '1';
      field.style.transform = 'translateY(0)';
    }, index * 100);
  });
}

window.addEventListener('load', addAnimations);