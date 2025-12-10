document.addEventListener('DOMContentLoaded', () => {
    // Находим все блоки с рекомендациями
    const similarItemsDivs = document.querySelectorAll('.similar-items');

    similarItemsDivs.forEach(div => {
        const itemId = div.dataset.itemId; // получаем id из data-item-id
        if (!itemId) {
            console.warn('Item ID не найден для блока', div);
            div.innerHTML = '<p>Невозможно загрузить рекомендации</p>';
            return;
        }

        // AJAX-запрос к Django view, возвращающему рекомендации
        fetch(`/wishlists/item/${itemId}/recommendations/`)
            .then(response => {
                if (!response.ok) throw new Error(`Ошибка сети: ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (!data.length) {
                    div.innerHTML = '<p>Нет похожих предметов</p>';
                    return;
                }

                // Формируем HTML для рекомендаций
                div.innerHTML = data.map(rec => `
                    <div class="recommended-item card">
                        <h5>${rec.name}</h5>
                        <p>${rec.description || ''}</p>
                    </div>
                `).join('');
            })
            .catch(err => {
                div.innerHTML = '<p>Ошибка загрузки рекомендаций</p>';
                console.error('Ошибка при загрузке рекомендаций:', err);
            });
    });
});
