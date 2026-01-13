console.log('=== Recommendations.js loaded ===');

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('wishlist-recommendations');
    if (!container) return;

    const url = container.dataset.url;
    if (!url) {
        container.innerHTML = '<p class="text-danger">Ошибка: URL не найден</p>';
        return;
    }

    // Получаем ID вишлиста
    let wishlistId = container.dataset.wishlistId;
    if (!wishlistId) {
        const urlParts = url.split('/').filter(segment => segment);
        wishlistId = urlParts.find(segment => !isNaN(segment));
    }
    
    if (!wishlistId) {
        container.innerHTML = '<p class="text-danger">Ошибка: не удалось определить вишлист</p>';
        return;
    }

    const csrftoken = getCookie('csrftoken');

    // Сохраняем глобальные переменные
    window.currentWishlistId = wishlistId;
    window.currentRecommendationsUrl = url;
    window.currentCsrfToken = csrftoken;
    window.addedItemsCount = 0;

    // Загружаем рекомендации
    loadRecommendations(url, container, wishlistId, csrftoken);

    // Добавляем обработчик для кнопки обновления
    const refreshBtn = document.getElementById('refresh-recommendations-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.refreshRecommendations();
        });
    }

    // Регистрируем глобальные функции
    registerGlobalFunctions();
});

// ============ ОСНОВНЫЕ ФУНКЦИИ ============

function loadRecommendations(url, container, wishlistId, csrftoken) {
    container.innerHTML = getLoadingIndicator();
    
    fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            const recs = Array.isArray(data) ? data : data.recommendations || [];
            if (recs.length === 0) {
                showEmptyState(container, wishlistId);
                return;
            }
            renderRecommendations(recs, container, wishlistId, csrftoken);
        })
        .catch(err => {
            console.error('Error loading recommendations:', err);
            showErrorState(container);
        });
}

function renderRecommendations(recs, container, wishlistId, csrftoken) {
    const recommendationsHTML = recs.map((rec, index) => `
        <div class="col" data-recommendation-id="${rec.id || index}">
            <div class="card h-100 shadow-sm recommendation-card">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${escapeHtml(rec.name || rec.title || 'Идея')}</h5>
                    
                    ${rec.description ? `
                        <div class="card-text flex-grow-1">
                            <p class="text-muted">
                                ${escapeHtml(truncateText(rec.description, 150))}
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
            addRecommendation(itemData, this, csrftoken);
        });
    });
}

function addRecommendation(itemData, buttonElement, csrfToken) {
    const originalText = buttonElement.innerHTML;
    const wishlistId = itemData.wishlist_id;
    const card = buttonElement.closest('.col');
    
    // Показываем загрузку на кнопке
    buttonElement.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Добавляется...';
    buttonElement.disabled = true;
    
    // Увеличиваем счетчик добавленных товаров
    window.addedItemsCount = (window.addedItemsCount || 0) + 1;
    
    // Отправляем запрос
    fetch(`/wishlists/${wishlistId}/add_recommendation/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: new URLSearchParams({
            'title': itemData.title,
            'description': itemData.description
        })
    })
    .then(response => {
        if (response.status === 401) throw new Error('Требуется авторизация');
        if (response.status === 403) throw new Error('Недостаточно прав');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Создаем эффект успешного добавления
            showSuccessAnimation(card, buttonElement, itemData.title);
            
            // Показываем уведомление об успехе
            showNotification('success', `"${itemData.title}" успешно добавлен в вишлист!`);
            
            // Ждем завершения анимации и плавно обновляем страницу
            setTimeout(() => {
                preparePageForRefresh(() => {
                    location.reload();
                });
            }, 2000);
            
        } else {
            throw new Error(data.error || 'Неизвестная ошибка');
        }
    })
    .catch(error => {
        // Уменьшаем счетчик при ошибке
        window.addedItemsCount = Math.max(0, (window.addedItemsCount || 0) - 1);
        
        // Восстанавливаем кнопку
        buttonElement.innerHTML = originalText;
        buttonElement.disabled = false;
        buttonElement.classList.replace('btn-success', 'btn-primary');
        
        // Показываем ошибку
        if (error.message.includes('авторизация')) {
            showNotificationWithLogin('warning', error.message);
        } else {
            showNotification('danger', `Ошибка: ${error.message}`);
        }
    });
}

function showSuccessAnimation(card, buttonElement, itemTitle) {
    // Обновляем кнопку
    buttonElement.innerHTML = '<i class="bi bi-check-circle"></i> Добавлено';
    buttonElement.classList.replace('btn-primary', 'btn-success');
    buttonElement.disabled = true;
    
    // Добавляем анимацию к карточке
    if (card) {
        // Добавляем класс для анимации
        card.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        card.style.transform = 'scale(0.95)';
        card.style.opacity = '0.9';
        
        // Создаем эффект "всплывающего" элемента
        const successBadge = document.createElement('div');
        successBadge.className = 'success-badge';
        successBadge.innerHTML = `
            <div class="d-flex align-items-center justify-content-center">
                <i class="bi bi-check-circle-fill text-success fs-4 me-2"></i>
                <span>Добавлено в вишлист!</span>
            </div>
        `;
        successBadge.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(40, 167, 69, 0.9);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 0.375rem;
            z-index: 10;
            opacity: 0;
            transform: scale(0.8);
            transition: all 0.6s ease;
        `;
        
        card.style.position = 'relative';
        card.appendChild(successBadge);
        
        // Запускаем анимацию
        setTimeout(() => {
            successBadge.style.opacity = '1';
            successBadge.style.transform = 'scale(1)';
        }, 300);
        
        // Вторая фаза анимации - карточка "улетает"
        setTimeout(() => {
            card.style.transform = 'translateY(-100px) scale(0.9)';
            card.style.opacity = '0';
            successBadge.style.opacity = '0';
            successBadge.style.transform = 'scale(1.2)';
        }, 1300);
    }
    
    // Анимация для остальных карточек (немного смещаются вверх)
    const allCards = document.querySelectorAll('.recommendation-card');
    allCards.forEach((otherCard, index) => {
        if (otherCard.closest('.col') !== card) {
            setTimeout(() => {
                otherCard.style.transition = 'transform 0.5s ease';
                otherCard.style.transform = 'translateY(-5px)';
                
                // Возвращаем обратно
                setTimeout(() => {
                    otherCard.style.transform = 'translateY(0)';
                }, 500);
            }, index * 100);
        }
    });
}

function preparePageForRefresh(callback) {
    // Создаем маску для плавного перехода
    const overlay = document.createElement('div');
    overlay.id = 'refresh-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(51, 85, 236, 0.7) 0%, rgba(71, 63, 187, 0.7) 100%);
        /* rgba: последнее значение (0.5) - прозрачность (0-1) */
        z-index: 9999;
        opacity: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        transition: opacity 0.8s ease;
`;
    
    overlay.innerHTML = `
        <div class="text-center text-white">
            <div class="spinner-border text-light mb-3" style="width: 3rem; height: 3rem;" role="status">
                <span class="visually-hidden">Обновление...</span>
            </div>
            <h4 class="mb-2">Обновление вишлиста</h4>
            <p>Добавляем новый предмет...</p>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';
    
    // Плавное появление оверлея
    setTimeout(() => {
        overlay.style.opacity = '1';
        
        // Ждем и запускаем callback
        setTimeout(() => {
            if (callback) callback();
        }, 1200);
    }, 50);
}

// ============ ГЛОБАЛЬНЫЕ ФУНКЦИИ ============

function registerGlobalFunctions() {
    window.refreshRecommendations = function() {
        const container = document.getElementById('wishlist-recommendations');
        const url = container?.dataset.url || window.currentRecommendationsUrl;
        const wishlistId = window.currentWishlistId || container?.dataset.wishlistId;
        const csrfToken = window.currentCsrfToken || getCookie('csrftoken');
        
        if (!container || !url || !wishlistId) {
            console.error('Cannot refresh: missing parameters');
            return;
        }
        
        // Обновляем UI кнопки
        const refreshBtn = document.getElementById('refresh-recommendations-btn');
        if (refreshBtn) {
            const originalHtml = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Обновление...';
            refreshBtn.disabled = true;
            
            // Восстанавливаем через 1.5 сек (даже при ошибке)
            setTimeout(() => {
                refreshBtn.innerHTML = originalHtml;
                refreshBtn.disabled = false;
            }, 1500);
        }
        
        // Загружаем новые рекомендации
        loadRecommendations(`${url}?refresh=true&t=${Date.now()}`, container, wishlistId, csrfToken);
    };
    
    window.loadRandomIdeas = function(wishlistId) {
        const container = document.getElementById('wishlist-recommendations');
        if (!container) return;
        
        container.innerHTML = getLoadingIndicator('Ищем интересные идеи...');
        
        const url = container.dataset.url || `/wishlists/${wishlistId}/recommendations/`;
        const csrfToken = window.currentCsrfToken || getCookie('csrftoken');
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                const recs = Array.isArray(data) ? data : data.recommendations || [];
                if (recs.length > 0) {
                    renderRecommendations(recs, container, wishlistId, csrfToken);
                } else {
                    showLocalIdeas(container, wishlistId);
                }
            })
            .catch(() => showLocalIdeas(container, wishlistId));
    };
    
    window.addRecommendationToWishlist = function(itemData, buttonElement, csrfToken) {
        addRecommendation(itemData, buttonElement, csrfToken);
    };
}

function showLocalIdeas(container, wishlistId) {
    const localIdeas = [
        {id: 1, title: 'Книга по саморазвитию', description: 'Популярная литература о продуктивности и личностном росте.'},
        {id: 2, title: 'Беспроводные наушники', description: 'Качественный звук без проводов для спорта и путешествий.'},
        {id: 3, title: 'Набор для рисования', description: 'Акварельные краски и кисти для творческого отдыха.'},
        {id: 4, title: 'Умная колонка', description: 'Голосовой помощник для умного дома и воспроизведения музыки.'},
        {id: 5, title: 'Настольная игра', description: 'Интеллектуальная игра для компании друзей.'}
    ];
    
    renderRecommendations(localIdeas, container, wishlistId, getCookie('csrftoken'));
}

// ============ ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ============

function getLoadingIndicator(text = 'Загрузка...') {
    return `
        <div class="col-12">
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Загрузка</span>
                </div>
                <p class="mt-2 text-muted">${text}</p>
            </div>
        </div>`;
}

function showEmptyState(container, wishlistId) {
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
}

function showErrorState(container) {
    container.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                <strong>Не удалось загрузить рекомендации</strong>
                <p class="mb-0 mt-1">Попробуйте обновить страницу.</p>
            </div>
        </div>`;
}

function showNotification(type, message) {
    // Удаляем старые уведомления
    document.querySelectorAll('.notification-alert').forEach(el => el.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification-alert alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    notification.style.zIndex = '9998';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Автоматическое скрытие
    setTimeout(() => notification.remove(), 3000);
}

function showNotificationWithLogin(type, message) {
    document.querySelectorAll('.notification-alert').forEach(el => el.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification-alert alert alert-${type} alert-dismissible fade show position-fixed top-0 end-0 m-3`;
    notification.style.zIndex = '9998';
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
    setTimeout(() => notification.remove(), 5000);
}

function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [key, value] = cookie.trim().split('=');
        if (key === name) return decodeURIComponent(value);
    }
    return null;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Проверка "застрявших" кнопок
setTimeout(() => {
    document.querySelectorAll('.add-recommendation-btn[disabled]').forEach(btn => {
        if (btn.innerHTML.includes('spinner')) {
            btn.innerHTML = 'Добавить в вишлист';
            btn.disabled = false;
        }
    });
}, 3000);

// Добавляем CSS стили для анимаций
const style = document.createElement('style');
style.textContent = `
    @keyframes pulseSuccess {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    @keyframes floatUp {
        0% { transform: translateY(0) scale(1); opacity: 1; }
        100% { transform: translateY(-100px) scale(0.9); opacity: 0; }
    }
    
    .recommendation-card {
        transition: all 0.3s ease;
    }
    
    .recommendation-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
    }
    
    .success-badge {
        font-weight: 500;
        font-size: 1.1rem;
    }
    
    /* Плавный переход для перезагрузки */
    body.page-refreshing {
        animation: fadeOut 0.8s ease forwards;
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);