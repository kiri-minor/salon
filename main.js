
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        header.classList.add('header--scrolled');
      } else {
        header.classList.remove('header--scrolled');
      }
    });

    // Бургер-меню
    const burger = document.getElementById('burger');
    const nav = document.getElementById('nav');
    const navLinks = document.querySelectorAll('.nav__link');

    burger.addEventListener('click', () => {
      const activeState = nav.classList.toggle('nav--active');
      burger.classList.toggle('active');
      burger.setAttribute('aria-expanded', activeState);
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('nav--active');
        burger.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
      });
    });

    // Автоподстановка выбранной услуги из секции «Услуги» в форму
    const selectServiceBtns = document.querySelectorAll('.btn-select-service');
    const serviceSelectElement = document.getElementById('bookingService');

    selectServiceBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const selectedService = btn.getAttribute('data-service');
        if (selectedService && serviceSelectElement) {
          serviceSelectElement.value = selectedService;
        }
      });
    });


    /* ==========================================================================
       3. КАСТОМНАЯ СИСТЕМА УВЕДОМЛЕНИЙ (TOAST)
       ========================================================================== */
    const toastContainer = document.getElementById('toastContainer');

    function showToast(title, bodyText, detailText = '') {
      const toast = document.createElement('div');
      toast.className = 'toast toast--success';
      
      toast.innerHTML = `
        <div class="toast__header">
          <strong class="toast__title">${title}</strong>
          <button class="toast__close" aria-label="Закрыть уведомление">&times;</button>
        </div>
        <div class="toast__body">
          <p>${bodyText}</p>
          ${detailText ? `<div class="toast__detail">${detailText}</div>` : ''}
        </div>
      `;

      toastContainer.appendChild(toast);

      // Плавное появление
      setTimeout(() => {
        toast.classList.add('toast--active');
      }, 50);

      // Обработчик закрытия
      const closeBtn = toast.querySelector('.toast__close');
      closeBtn.addEventListener('click', () => {
        toast.classList.remove('toast--active');
        setTimeout(() => toast.remove(), 500);
      });

      // Авто-удаление через 5 секунд
      setTimeout(() => {
        if (toast.parentNode) {
          toast.classList.remove('toast--active');
          setTimeout(() => toast.remove(), 500);
        }
      }, 6000);
    }

    /* ==========================================================================
       4. УПРАВЛЕНИЕ ИНТЕРФЕЙСОМ И ОТПРАВКОЙ ДАННЫХ В БД
       ========================================================================== */
    const bookingForm = document.getElementById('bookingForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnSpinner = document.getElementById('btnSpinner');
    const btnText = document.getElementById('btnText');




    // Хелпер для форматирования дат в привычный русский вид
    function formatDate(dateStr) {
      if (!dateStr) return '';
      const parts = dateStr.split('-');
      return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }

    // Хелпер защиты от XSS атак при вводе
    function escapeHTML(str) {
      return str.replace(/[&<>'"]/g, 
        tag => ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          "'": '&#39;',
          '"': '&quot;'
        }[tag] || tag)
      );
    }

    // Обработка отправки формы
    bookingForm.addEventListener('submit', (e) => {
      e.preventDefault();

      // Сбор и валидация полей
      const name = document.getElementById('clientName').value.trim();
      const email = document.getElementById('clientEmail').value.trim();
      const date = document.getElementById('bookingDate').value;
      const service = document.getElementById('bookingService').value;

      // Базовая валидация
      if (!name || !email || !date || !service) {
        showToast('Ошибка валидации', 'Пожалуйста, заполните все необходимые поля формы.', '');
        return;
      }

      // Эффект отправки (имитация задержки сетевого запроса к бэкенду)
      setSubmitButtonState('loading');

      setTimeout(() => {
        // Успешная запись в псевдо-БД
        const newRecord = db.insert(name, email, date, service);
        
        // Обновляем Live-таблицу
        updateLiveTable();

        // Показываем кастомную карточку-уведомление
        showToast(
          'Запись оформлена!', 
          `Уважаемый(ая) <strong>${escapeHTML(name)}</strong>, вы успешно записались на процедуру в салон l'orage.`,
          `<strong>Услуга:</strong> ${newRecord.service}<br><strong>Дата:</strong> ${formatDate(newRecord.date)}<br><strong>Уникальный код брони:</strong> ${newRecord.id}`
        );

        // Переключение кнопки в состояние успеха
        setSubmitButtonState('success');

        // Сброс полей формы через некоторое время
        setTimeout(() => {
          bookingForm.reset();
          setSubmitButtonState('default');
          
          // Делаем мягкий фокус на развернутую таблицу с базой данных
          if (!dbContent.classList.contains('db-previewer__content--expanded')) {
            dbToggle.click();
          }
        }, 1500);

      }, 1500); // 1.5 секунды задержки для реалистичного спиннера
    });

    // Управление состояниями кнопки отправки
    function setSubmitButtonState(state) {
      if (state === 'loading') {
        submitBtn.className = 'btn btn--primary booking-form__btn booking-form__btn--loading';
        btnSpinner.style.display = 'inline-block';
        btnText.textContent = 'Обработка запроса...';
      } else if (state === 'success') {
        submitBtn.className = 'btn btn--primary booking-form__btn booking-form__btn--success';
        btnSpinner.style.display = 'none';
        btnText.textContent = '✓ Забронировано!';
      } else {
        submitBtn.className = 'btn btn--primary booking-form__btn';
        btnSpinner.style.display = 'none';
        btnText.textContent = 'Забронировать время';
      }
    }
