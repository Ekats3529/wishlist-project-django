console.log('=== Recommendations.js loaded ===');

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('wishlist-recommendations');
    if (!container) return;

    const url = container.dataset.url;
    if (!url) {
        container.innerHTML = '<p class="text-danger">Ошибка: URL не найден</p>';
        return;
    }

    // Получаем ID вишлиста из data-атрибута или URL
    let wishlistId = container.dataset.wishlistId;
    
    if (!wishlistId) {
        // Пробуем извлечь из URL
        const urlParts = url.split('/').filter(segment => segment);
        wishlistId = urlParts.find(segment => !isNaN(segment));
    }
    
    if (!wishlistId) {
        console.error('Could not extract wishlist ID from URL:', url);
        container.innerHTML = '<p class="text-danger">Ошибка: не удалось определить вишлист</p>';
        return;
    }

    // Получаем CSRF токен для AJAX запросов
    const csrftoken = getCookie('csrftoken');

    // Сохраняем в глобальную область видимости
    window.currentWishlistId = wishlistId;
    window.currentRecommendationsUrl = url;
    window.currentCsrfToken = csrftoken;

    // Инициализируем счетчик добавленных товаров
    window.addedItemsCount = 0;

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

    // Добавляем обработчик для кнопки обновления
    const refreshBtn = document.getElementById('refresh-recommendations-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.refreshRecommendations();
        });
    }

    // Сохраняем функции в глобальную область видимости
    window.addItemToWishlistGrid = addItemToWishlistGrid;
    window.showNotification = showNotification;
    window.showNotificationWithLogin = showNotificationWithLogin;
    window.updateItemsList = updateItemsList;
    window.slideAwayRecommendation = slideAwayRecommendation;
    window.loadRandomIdeas = loadRandomIdeas;
    window.addRecommendationToWishlist = addRecommendationToWishlist;
});

// ============ ГЛОБАЛЬНЫЕ ФУНКЦИИ ============

// Функция для обновления рекомендаций
function refreshRecommendations(wishlistId, container, url, csrfToken) {
    console.log('Refreshing recommendations...');
    
    const refreshBtn = document.getElementById('refresh-recommendations-btn');
    if (refreshBtn) {
        const originalHtml = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Обновление...';
        refreshBtn.disabled = true;
        refreshBtn.classList.add('disabled');
    }
    
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
    
    // Добавляем параметр для принудительного обновления
    const refreshUrl = url + '?refresh=true&t=' + Date.now();
    
    // Добавляем небольшую задержку для лучшего UX
    setTimeout(() => {
        fetch(refreshUrl)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then(data => {
                const recs = Array.isArray(data) ? data : data.recommendations || [];
                
                if (recs.length === 0) {
                    container.innerHTML = `
                        <div class="col-12">
                            <div class="alert alert-info">
                                <i class="bi bi-info-circle"></i>
                                <strong>Нет новых рекомендаций</strong>
                                <p class="mb-2 mt-1">Добавьте больше предметов, чтобы получить новые рекомендации.</p>
                                <button class="btn btn-sm btn-outline-info" onclick="loadRandomIdeas(${wishlistId})">
                                    Показать случайные идеи
                                </button>
                            </div>
                        </div>`;
                } else {
                    // Показываем новые рекомендации
                    showRecommendations(recs, container, wishlistId, csrfToken);
                    
                    // Показываем уведомление
                    if (window.showNotification) {
                        window.showNotification('success', 'Рекомендации обновлены!');
                    }
                }
                
                // Восстанавливаем кнопку
                if (refreshBtn) {
                    setTimeout(() => {
                        refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Обновить рекомендации';
                        refreshBtn.disabled = false;
                        refreshBtn.classList.remove('disabled');
                    }, 500);
                }
            })
            .catch(err => {
                console.error('Error refreshing recommendations:', err);
                container.innerHTML = `
                    <div class="col-12">
                        <div class="alert alert-danger">
                            <i class="bi bi-exclamation-triangle"></i>
                            <strong>Не удалось обновить рекомендации</strong>
                            <p class="mb-0 mt-1">Попробуйте еще раз.</p>
                        </div>
                    </div>`;
                
                // Восстанавливаем кнопку
                if (refreshBtn) {
                    setTimeout(() => {
                        refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Обновить рекомендации';
                        refreshBtn.disabled = false;
                        refreshBtn.classList.remove('disabled');
                    }, 500);
                }
            });
    }, 500);
}

// Глобальная функция для обновления рекомендаций (вызывается из HTML)
window.refreshRecommendations = function() {
    const container = document.getElementById('wishlist-recommendations');
    if (!container) {
        console.error('Container not found');
        return;
    }
    
    const url = container.dataset.url || window.currentRecommendationsUrl;
    if (!url) {
        console.error('URL not found');
        return;
    }
    
    const wishlistId = window.currentWishlistId || container.dataset.wishlistId;
    const csrfToken = window.currentCsrfToken || getCookie('csrftoken');
    
    if (!wishlistId) {
        console.error('Wishlist ID not found');
        return;
    }
    
    // Вызываем основную функцию с параметрами
    refreshRecommendations(wishlistId, container, url, csrfToken);
};

// Альтернативная глобальная функция
window.refreshRecommendationsGlobal = function() {
    window.refreshRecommendations();
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
            <div class="card h-100 shadow-sm recommendation-card">
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
            
            window.addRecommendationToWishlist(itemData, this, csrftoken);
        });
    });
}

// Функция для добавления рекомендации в вишлист (глобальная)
window.addRecommendationToWishlist = function(itemData, buttonElement, csrfToken) {
    if (!csrfToken) {
        csrfToken = getCookie('csrftoken');
    }
    
    console.log('addRecommendationToWishlist called with:', itemData);
    
    // Увеличиваем счетчик добавленных товаров
    window.addedItemsCount = (window.addedItemsCount || 0) + 1;
    
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
            
            // 2. Показываем уведомление об успехе
            if (window.showNotification) {
                window.showNotification('success', `"${itemData.title}" успешно добавлен в вишлист!`);
            }
            
            // 3. Обновляем список предметов (если он есть на странице)
            if (window.updateItemsList) {
                console.log('Updating items list...');
                window.updateItemsList(itemData.wishlist_id, csrfToken).catch(() => {
                    console.log('Failed to update items list, will reload page instead');
                });
            }
            
            // 4. Убираем рекомендацию с анимацией через 1 секунду
            setTimeout(() => {
                slideAwayRecommendation(buttonElement);
            }, 1000);
            
        } else {
            throw new Error(data.error || 'Неизвестная ошибка');
        }
    })
    .catch(error => {
        console.error('Error adding recommendation:', error);
        
        // Уменьшаем счетчик при ошибке
        window.addedItemsCount = Math.max(0, (window.addedItemsCount || 0) - 1);
        
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

// Функция для плавного удаления рекомендации
function slideAwayRecommendation(buttonElement) {
    const card = buttonElement.closest('.col');
    if (card) {
        // Получаем позицию и размеры карточки
        const rect = card.getBoundingClientRect();
        const cardHeight = rect.height;
        
        // Анимация уезжания вверх и исчезновения
        card.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        card.style.transform = 'translateY(-' + (cardHeight + 20) + 'px)';
        card.style.opacity = '0';
        card.style.maxHeight = '0';
        card.style.marginTop = '0';
        card.style.marginBottom = '0';
        card.style.paddingTop = '0';
        card.style.paddingBottom = '0';
        card.style.border = 'none';
        
        // После завершения анимации удаляем элемент
        setTimeout(() => {
            card.style.display = 'none';
            
            // Проверяем, остались ли еще рекомендации
            checkIfRemainingRecommendations();
        }, 600);
    }
}

// Функция для проверки оставшихся рекомендаций
function checkIfRemainingRecommendations() {
    const container = document.getElementById('wishlist-recommendations');
    if (!container) return;
    
    // Считаем видимые карточки
    const allCards = container.querySelectorAll('.col');
    const hiddenCards = container.querySelectorAll('.col[style*="display: none"]');
    
    // Если все карточки скрыты или их не осталось
    if (hiddenCards.length === allCards.length || allCards.length === 0) {
        setTimeout(() => {
            const wishlistId = window.currentWishlistId;
            
            // Создаем плавное появление нового сообщения
            const messageDiv = document.createElement('div');
            messageDiv.className = 'col-12';
            messageDiv.innerHTML = `
                <div class="alert alert-success" style="opacity: 0; transform: translateY(20px); transition: all 0.5s ease;">
                    <i class="bi bi-check-circle"></i>
                    <strong>Рекомендации добавлены!</strong>
                    <p class="mb-2 mt-1">Все рекомендации были добавлены в ваш вишлист.</p>
                    <div class="d-flex gap-2">
                        <button onclick="refreshRecommendationsGlobal()" class="btn btn-sm btn-outline-success">
                            <i class="bi bi-arrow-clockwise"></i> Загрузить новые
                        </button>
                        <button onclick="loadRandomIdeas(${wishlistId})" class="btn btn-sm btn-outline-info">
                            <i class="bi bi-lightbulb"></i> Случайные идеи
                        </button>
                    </div>
                </div>
            `;
            
            // Очищаем контейнер и добавляем новое сообщение
            container.innerHTML = '';
            container.appendChild(messageDiv);
            
            // Анимация появления
            setTimeout(() => {
                const alertDiv = messageDiv.querySelector('.alert');
                alertDiv.style.opacity = '1';
                alertDiv.style.transform = 'translateY(0)';
            }, 10);
        }, 300);
    }
}

// Функция для проверки, пустой ли вишлист
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

// Функция для обновления списка предметов
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
        const itemsContainer = document.querySelector('#items-grid') || 
                              document.querySelector('.row.row-cols-1.row-cols-md-2.row-cols-lg-3.g-4') ||
                              document.querySelector('#empty-wishlist-message');
        
        if (itemsContainer) {
            // Если нашли сообщение о пустом вишлисте, заменяем его на сетку
            if (itemsContainer.id === 'empty-wishlist-message') {
                const newContainer = document.createElement('div');
                newContainer.className = 'row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4';
                newContainer.id = 'items-grid';
                newContainer.innerHTML = html;
                
                // Анимация появления
                newContainer.style.opacity = '0';
                newContainer.style.transform = 'translateY(20px)';
                itemsContainer.replaceWith(newContainer);
                
                setTimeout(() => {
                    newContainer.style.transition = 'all 0.5s ease';
                    newContainer.style.opacity = '1';
                    newContainer.style.transform = 'translateY(0)';
                }, 10);
            } else {
                // Иначе просто обновляем содержимое с анимацией
                itemsContainer.style.opacity = '0.7';
                itemsContainer.style.transition = 'opacity 0.3s ease';
                
                setTimeout(() => {
                    itemsContainer.innerHTML = html;
                    itemsContainer.style.opacity = '1';
                }, 300);
            }
            
            console.log('Items list updated successfully');
        } else {
            console.warn('Could not find items container, reloading page');
            return Promise.reject('Container not found');
        }
    } catch (error) {
        console.error('Error updating items list:', error);
        return Promise.reject(error);
    }
}

// Функция для добавления товара в основную сетку вишлиста
function addItemToWishlistGrid(itemData, csrfToken) {
    if (!csrfToken) {
        csrfToken = getCookie('csrftoken');
    }
    
    console.log('addItemToWishlistGrid called with:', itemData);
    
    // Находим контейнер с основными предметами
    let mainGrid = document.querySelector('#items-grid') || 
                  document.querySelector('.row.row-cols-1.row-cols-md-2.row-cols-lg-3.g-4');
    
    // Если контейнер не найден, значит вишлист пустой
    if (!mainGrid) {
        console.log('Grid not found, trying to create one...');
        
        // Находим сообщение о пустом вишлисте
        const emptyMessage = document.querySelector('#empty-wishlist-message');
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