// === Recommendations.js ===
console.log('=== Recommendations.js loaded ===');

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('wishlist-recommendations');
    if (!container) return;

    const url = container.dataset.url;
    if (!url) {
        container.innerHTML = '<p class="text-danger">Ошибка: URL не найден</p>';
        return;
    }

    // Получаем ID вишлиста из URL рекомендаций
    const urlParts = url.split('/').filter(segment => segment);
    const wishlistId = urlParts.find(segment => !isNaN(segment));
    
    if (!wishlistId) {
        console.error('Could not extract wishlist ID from URL:', url);
        container.innerHTML = '<p class="text-danger">Ошибка: не удалось определить вишлист</p>';
        return;
    }

    // Получаем CSRF токен для AJAX запросов
    const csrftoken = getCookie('csrftoken');

    // Сохраняем wishlistId в глобальную область видимости
    window.currentWishlistId = wishlistId;

    // Функция для загрузки и отображения рекомендаций
    function loadRecommendations() {
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then(data => {
                // Получаем массив рекомендаций
                const recs = Array.isArray(data) ? data : data.recommendations || [];

                if (recs.length === 0) {
                    container.innerHTML = `
                        <div class="col-12">
                            <div class="alert alert-info">
                                <i class="bi bi-info-circle"></i>
                                <strong>Идеи для вашего вишлиста</strong>
                                <p class="mb-2 mt-1">Добавьте первый предмет, чтобы получить персонализированные рекомендации.</p>
                                <button class="btn btn-sm btn-outline-info" onclick="loadRandomIdeas(${wishlistId})">
                                    Показать случайные идеи
                                </button>
                            </div>
                        </div>`;
                    return;
                }

                // Показываем рекомендации
                showRecommendations(recs, container, wishlistId, csrftoken);
            })
            .catch(err => {
                console.error('Error loading recommendations:', err);
                container.innerHTML = `
                    <div class="col-12">
                        <div class="alert alert-danger">
                            <i class="bi bi-exclamation-triangle"></i>
                            <strong>Не удалось загрузить рекомендации</strong>
                            <p class="mb-0 mt-1">Попробуйте обновить страницу.</p>
                        </div>
                    </div>`;
            });
    }

    // Загружаем рекомендации при старте
    loadRecommendations();

    // Сохраняем функции в глобальную область видимости
    window.addItemToWishlistGrid = addItemToWishlistGrid;
    window.showNotification = showNotification;
    window.showNotificationWithLogin = showNotificationWithLogin;
    window.updateItemsList = updateItemsList; // Добавляем новую функцию
});

// ============ ГЛОБАЛЬНЫЕ ФУНКЦИИ ============

// Делаем функцию loadRecommendations доступной глобально
window.loadRecommendations = function() {
    const container = document.getElementById('wishlist-recommendations');
    if (!container) return;
    
    const url = container.dataset.url;
    if (!url) return;
    
    // Показываем индикатор загрузки
    container.innerHTML = `
        <div class="col-12">
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Загрузка...</span>
                </div>
                <p class="mt-2 text-muted">Загрузка новых рекомендаций...</p>
            </div>
        </div>`;
    
    // Перезагружаем рекомендации
    setTimeout(() => {
        window.location.reload();
    }, 500);
};

// Функция для загрузки случайных идей
window.loadRandomIdeas = function(wishlistId) {
    const container = document.getElementById('wishlist-recommendations');
    if (!container) return;
    
    // Показываем индикатор загрузки
    container.innerHTML = `
        <div class="col-12">
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Загрузка...</span>
                </div>
                <p class="mt-2 text-muted">Ищем интересные идеи...</p>
            </div>
        </div>`;
    
    // Загружаем случайные идеи с сервера
    const url = container.dataset.url || `/wishlists/${wishlistId}/recommendations/`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const recs = Array.isArray(data) ? data : data.recommendations || [];
            
            if (recs.length === 0) {
                // Если сервер не вернул идеи, показываем локальные
                showLocalIdeas(container, wishlistId);
            } else {
                // Показываем идеи с сервера
                showRecommendations(recs, container, wishlistId, getCookie('csrftoken'));
            }
        })
        .catch(() => {
            // В случае ошибки показываем локальные идеи
            showLocalIdeas(container, wishlistId);
        });
};

// Функция для показа локальных идей (если сервер не отвечает)
function showLocalIdeas(container, wishlistId) {
    const localIdeas = [
        {id: 1, title: 'Книга по саморазвитию', description: 'Популярная литература о продуктивности и личностном росте.'},
        {id: 2, title: 'Беспроводные наушники', description: 'Качественный звук без проводов для спорта и путешествий.'},
        {id: 3, title: 'Набор для рисования', description: 'Акварельные краски и кисти для творческого отдыха.'},
        {id: 4, title: 'Умная колонка', description: 'Голосовой помощник для умного дома и воспроизведения музыки.'},
        {id: 5, title: 'Настольная игра', description: 'Интеллектуальная игра для компании друзей.'},
        {id: 6, title: 'Фитнес-браслет', description: 'Отслеживание активности, сна и пульса в течение дня.'},
        {id: 7, title: 'Стильный рюкзак', description: 'Удобный и модный рюкзак для повседневного использования.'},
        {id: 8, title: 'Аромадиффузор', description: 'Создает приятную атмосферу в комнате с эфирными маслами.'},
        {id: 9, title: 'Подарочный сертификат', description: 'Возможность выбрать подарок в любимом магазине.'},
        {id: 10, title: 'Йога-коврик', description: 'Профессиональный коврик для занятий йогой и фитнесом.'}
    ];
    
    // Выбираем случайные 5 идей
    const randomIdeas = localIdeas.sort(() => 0.5 - Math.random()).slice(0, 5);
    showRecommendations(randomIdeas, container, wishlistId, getCookie('csrftoken'));
}

// Функция для отображения рекомендаций/идей
function showRecommendations(recs, container, wishlistId, csrftoken) {
    const recommendationsHTML = recs.map(rec => `
        <div class="col">
            <div class="card h-100 shadow-sm">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${escapeHtml(rec.name || rec.title || 'Идея')}</h5>
                    
                    ${rec.description ? `
                        <div class="card-text flex-grow-1">
                            <p class="text-muted">
                                ${escapeHtml(rec.description.length > 150 ? 
                                    rec.description.substring(0, 150) + '...' : 
                                    rec.description)}
                            </p>
                        </div>
                    ` : ''}
                    
                    <div class="mt-3">
                        <button class="btn btn-primary btn-sm w-100 add-recommendation-btn"
                                data-title="${escapeHtml(rec.name || rec.title)}"
                                data-description="${escapeHtml(rec.description || '')}"
                                data-wishlist-id="${wishlistId}">
                            Добавить в вишлист
                        </button>
                    </div>
                </div>
                <div class="card-footer text-muted text-center py-2">
                    <small><i class="bi bi-lightbulb"></i> Идея для вишлиста</small>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = recommendationsHTML;
    
    // Добавляем обработчики для кнопок
    container.querySelectorAll('.add-recommendation-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemData = {
                title: this.dataset.title,
                description: this.dataset.description,
                wishlist_id: this.dataset.wishlistId
            };
            
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Добавляется...';
            this.disabled = true;
            
            addRecommendationToWishlist(itemData, this, csrftoken);
        });
    });
}

// Функция для добавления рекомендации в вишлист (глобальная)
window.addRecommendationToWishlist = function(itemData, buttonElement, csrfToken) {
    if (!csrfToken) {
        csrfToken = getCookie('csrftoken');
    }
    
    console.log('addRecommendationToWishlist called with:', itemData);
    
    // Формируем правильный URL для добавления рекомендации
    const addUrl = `/wishlists/${itemData.wishlist_id}/add_recommendation/`;
    console.log('Sending request to:', addUrl);
    
    // Создаем FormData для отправки
    const formData = new FormData();
    formData.append('title', itemData.title);
    formData.append('description', itemData.description);
    
    // Сохраняем оригинальный текст кнопки
    const originalText = buttonElement.innerHTML;
    
    // Отправляем AJAX запрос
    fetch(addUrl, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData
    })
    .then(response => {
        console.log('Response status:', response.status);
        // Проверяем статус ответа
        if (response.status === 401) {
            return response.json().then(data => {
                throw new Error('Требуется авторизация. Пожалуйста, войдите в систему.');
            });
        }
        if (response.status === 403) {
            return response.json().then(data => {
                throw new Error('Недостаточно прав для добавления в этот вишлист.');
            });
        }
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Response data:', data);
        if (data.success) {
            console.log('Success:', data);
            
            // 1. Сначала обновляем кнопку
            buttonElement.innerHTML = '<i class="bi bi-check-circle"></i> Добавлено';
            buttonElement.classList.remove('btn-primary');
            buttonElement.classList.add('btn-success');
            
            // 2. Проверяем, пустой ли вишлист
            const isWishlistEmpty = checkIfWishlistEmpty();
            
            if (isWishlistEmpty) {
                console.log('Wishlist is empty, updating items list dynamically');
                
                // Обновляем список предметов без перезагрузки страницы
                updateItemsList(itemData.wishlist_id, csrfToken).then(() => {
                    // После обновления списка предметов, убираем рекомендацию
                    removeRecommendationCard(buttonElement, itemData.wishlist_id);
                });
                
                return;
            }
            
            // 3. Для непустых вишлистов добавляем товар динамически
            if (window.addItemToWishlistGrid) {
                console.log('Calling addItemToWishlistGrid...');
                try {
                    window.addItemToWishlistGrid(data.item || {
                        id: data.item_id,
                        title: itemData.title,
                        description: itemData.description
                    }, csrfToken);
                    
                    // Убираем рекомендацию после успешного добавления
                    removeRecommendationCard(buttonElement, itemData.wishlist_id);
                } catch (error) {
                    console.error('Error in addItemToWishlistGrid:', error);
                    // Если ошибка, перезагружаем страницу
                    setTimeout(() => {
                        location.reload();
                    }, 1000);
                    return;
                }
            } else {
                console.warn('addItemToWishlistGrid function not found, reloading page');
                setTimeout(() => {
                    location.reload();
                }, 1000);
                return;
            }
            
            // 5. Показываем уведомление об успехе
            if (window.showNotification) {
                window.showNotification('success', `"${itemData.title}" успешно добавлен в вишлист!`);
            }
            
        } else {
            throw new Error(data.error || 'Неизвестная ошибка');
        }
    })
    .catch(error => {
        console.error('Error adding recommendation:', error);
        
        // Восстанавливаем кнопку
        buttonElement.innerHTML = originalText;
        buttonElement.disabled = false;
        buttonElement.classList.remove('btn-success');
        if (!buttonElement.classList.contains('btn-primary')) {
            buttonElement.classList.add('btn-primary');
        }
        
        // Проверяем, если ошибка авторизации
        if (window.showNotificationWithLogin) {
            if (error.message.includes('авторизация') || error.message.includes('войдите')) {
                window.showNotificationWithLogin('warning', error.message);
            } else {
                window.showNotification('danger', `Ошибка: ${error.message}`);
            }
        } else {
            alert(`Ошибка: ${error.message}`);
        }
    });
};

// НОВАЯ ФУНКЦИЯ: Проверка, пустой ли вишлист
function checkIfWishlistEmpty() {
    // Ищем основной контейнер с предметами
    const mainGrid = document.querySelector('.row.row-cols-1.row-cols-md-2.row-cols-lg-3.g-4');
    
    // Если сетка не найдена, вишлист пустой
    if (!mainGrid) {
        return true;
    }
    
    // Если сетка есть, проверяем есть ли в ней элементы
    const items = mainGrid.querySelectorAll('.col');
    
    // Также проверяем сообщение о пустом вишлисте
    const emptyMessage = document.querySelector('p.text-center');
    const hasEmptyMessage = emptyMessage && 
                           (emptyMessage.textContent.includes('нет предметов') || 
                            emptyMessage.textContent.includes('пока нет предметов'));
    
    return items.length === 0 || hasEmptyMessage;
}

// НОВАЯ ФУНКЦИЯ: Обновление списка предметов
async function updateItemsList(wishlistId, csrfToken) {
    console.log('Updating items list for wishlist:', wishlistId);
    
    try {
        // Отправляем запрос на получение HTML списка предметов
        const response = await fetch(`/wishlists/${wishlistId}/get_items_html/`, {
            method: 'GET',
            headers: {
                'X-CSRFToken': csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const html = await response.text();
        
        // Находим контейнер для предметов
        const itemsContainer = document.querySelector('#items-container') || 
                              document.querySelector('.items-container') ||
                              document.querySelector('.row.row-cols-1.row-cols-md-2.row-cols-lg-3.g-4') ||
                              document.querySelector('p.text-center');
        
        if (itemsContainer) {
            // Если нашли сообщение о пустом вишлисте, заменяем его на сетку
            if (itemsContainer.tagName === 'P' && itemsContainer.className.includes('text-center')) {
                const newContainer = document.createElement('div');
                newContainer.className = 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4';
                newContainer.id = 'items-grid';
                newContainer.innerHTML = html;
                itemsContainer.replaceWith(newContainer);
            } else {
                // Иначе просто обновляем содержимое
                itemsContainer.innerHTML = html;
            }
            
            console.log('Items list updated successfully');
        } else {
            console.warn('Could not find items container, reloading page');
            location.reload();
        }
    } catch (error) {
        console.error('Error updating items list:', error);
        // При ошибке перезагружаем страницу
        location.reload();
    }
}

// НОВАЯ ФУНКЦИЯ: Удаление карточки рекомендации
function removeRecommendationCard(buttonElement, wishlistId) {
    setTimeout(() => {
        const card = buttonElement.closest('.col');
        if (card) {
            card.style.opacity = '0';
            card.style.transform = 'translateX(-20px)';
            card.style.transition = 'all 0.5s';
            setTimeout(() => {
                card.remove();
                
                // Если рекомендации закончились, показываем сообщение
                const container = document.getElementById('wishlist-recommendations');
                if (container) {
                    const remainingCards = container.querySelectorAll('.col');
                    if (remainingCards.length === 0) {
                        container.innerHTML = `
                            <div class="col-12">
                                <div class="alert alert-success">
                                    <i class="bi bi-check-circle"></i>
                                    <strong>Все рекомендации добавлены!</strong>
                                    <p class="mb-2 mt-1">Добавьте больше предметов в вишлист для получения новых рекомендаций.</p>
                                    <button class="btn btn-sm btn-outline-success" onclick="loadRandomIdeas(${wishlistId})">
                                        Показать еще идеи
                                    </button>
                                </div>
                            </div>`;
                    }
                }
            }, 500);
        }
    }, 1000);
}

// Функция для добавления товара в основную сетку вишлиста
function addItemToWishlistGrid(itemData, csrfToken) {
    if (!csrfToken) {
        csrfToken = getCookie('csrftoken');
    }
    
    console.log('addItemToWishlistGrid called with:', itemData);
    
    // Находим контейнер с основными предметами
    let mainGrid = document.querySelector('.row.row-cols-1.row-cols-md-2.row-cols-lg-3.g-4');
    
    // Если контейнер не найден, значит вишлист пустой
    if (!mainGrid) {
        console.log('Grid not found, trying to create one...');
        
        // Находим сообщение о пустом вишлисте
        const emptyMessage = document.querySelector('p.text-center');
        if (emptyMessage && (emptyMessage.textContent.includes('нет предметов') || 
                            emptyMessage.textContent.includes('пока нет предметов'))) {
            console.log('Found empty message, replacing it with grid');
            
            // Создаем новую сетку
            mainGrid = document.createElement('div');
            mainGrid.className = 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4';
            mainGrid.id = 'items-grid';
            
            // Заменяем сообщение на сетку
            emptyMessage.replaceWith(mainGrid);
        } else {
            console.error('Could not find empty message or grid');
            throw new Error('Could not create grid');
        }
    }
    
    // Форматируем дату
    const now = new Date();
    const formattedDate = now.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const formattedTime = now.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Создаем URL для редактирования и удаления
    const editUrl = itemData.edit_url || `/wishlists/item/${itemData.id}/edit/`;
    const deleteUrl = itemData.delete_url || `/wishlists/item/${itemData.id}/delete/`;
    
    // Создаем HTML для нового товара
    const newItemHTML = `
        <div class="col">
            <div class="card h-100 shadow-sm" id="item-${itemData.id}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${escapeHtml(itemData.title)}</h5>
                    ${itemData.description ? `<p class="card-text">${escapeHtml(itemData.description)}</p>` : ''}
                    <p class="mt-auto">
                        <span class="badge bg-success">Доступен</span>
                    </p>
                    <div class="d-flex gap-2 mt-2">
                        <a href="${editUrl}" 
                           class="btn btn-outline-primary btn-sm flex-fill">
                            Редактировать
                        </a>
                        <form action="${deleteUrl}" 
                              method="post" 
                              class="flex-fill delete-item-form">
                            <input type="hidden" name="csrfmiddlewaretoken" value="${csrfToken}">
                            <button type="button" class="btn btn-outline-danger btn-sm w-100 delete-item-btn">
                                Удалить
                            </button>
                        </form>
                    </div>
                </div>
                <div class="card-footer text-muted">
                    Создан: ${formattedDate} ${formattedTime}
                </div>
            </div>
        </div>
    `;
    
    // Добавляем новый товар с анимацией
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newItemHTML;
    const newCard = tempDiv.firstElementChild;
    const newCardInner = newCard.querySelector('.card');
    
    // Начальные стили для анимации
    newCardInner.style.opacity = '0';
    newCardInner.style.transform = 'scale(0.9)';
    newCardInner.style.transition = 'all 0.3s ease';
    
    // Добавляем в начало сетки
    mainGrid.insertBefore(newCard, mainGrid.firstChild);
    
    // Запускаем анимацию
    setTimeout(() => {
        newCardInner.style.opacity = '1';
        newCardInner.style.transform = 'scale(1)';
        
        // Добавляем обработчик для кнопки удаления
        const deleteBtn = newCard.querySelector('.delete-item-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                const form = this.closest('form');
                if (form && confirm('Вы уверены, что хотите удалить этот предмет?')) {
                    // Анимация удаления
                    newCardInner.style.opacity = '0';
                    newCardInner.style.transform = 'scale(0.9)';
                    
                    setTimeout(() => {
                        // Отправляем форму
                        form.submit();
                    }, 300);
                }
            });
        }
    }, 10);
    
    console.log('Item added to grid successfully');
}

// Функция для показа уведомлений
function showNotification(type, message) {
    // Убираем предыдущие уведомления
    const existingNotifications = document.querySelectorAll('.notification-alert');
    existingNotifications.forEach(el => el.remove());
    
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification-alert alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    notification.style.zIndex = '1050';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // Добавляем на страницу
    document.body.appendChild(notification);
    
    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Функция для показа уведомления с кнопкой входа
function showNotificationWithLogin(type, message) {
    const existingNotifications = document.querySelectorAll('.notification-alert');
    existingNotifications.forEach(el => el.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification-alert alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    notification.style.zIndex = '1050';
    notification.innerHTML = `
        ${message}
        <div class="mt-2">
            <a href="/users/login/?next=${window.location.pathname}" 
               class="btn btn-sm btn-outline-light">
                Войти в систему
            </a>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 8000);
}

// Функция для получения CSRF токена
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Функция для экранирования HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Проверка "застрявших" кнопок (если что-то пошло не так)
setTimeout(() => {
    const stuckButtons = document.querySelectorAll('.add-recommendation-btn[disabled]');
    stuckButtons.forEach(btn => {
        if (btn.innerHTML.includes('Добавлено') || btn.innerHTML.includes('spinner')) {
            console.log('Found stuck button, reloading page');
            location.reload();
        }
    });
}, 3000);