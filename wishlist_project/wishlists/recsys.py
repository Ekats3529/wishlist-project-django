import random


def get_wishlist_recommendations(wishlist):

    items = wishlist.items.all()
    
    if not items:
        return get_random_ideas()
    
    # Можно анализировать существующие товары для более точных рекомендаций
    item_titles = [item.title.lower() for item in items]
    item_descriptions = [item.description.lower() for item in items if item.description]
    
    # Простая логика: определяем категории по ключевым словам
    categories = []
    
    tech_keywords = ['телефон', 'смартфон', 'зарядк', 'наушник', 'ноутбук', 'компьютер', 'гаджет']
    book_keywords = ['книг', 'читать', 'литератур', 'учебник']
    office_keywords = ['органайзер', 'канцеляр', 'ручк', 'блокнот', 'дневник']
    home_keywords = ['бутылк', 'чашк', 'посуда', 'кухн', 'дом']
    
    all_text = ' '.join(item_titles + item_descriptions)
    
    recommendations = []
    
    # Добавляем рекомендации в зависимости от найденных категорий
    if any(keyword in all_text for keyword in tech_keywords):
        recommendations.extend([
            {
                'id': 101,
                'name': 'Беспроводная зарядка',
                'title': 'Беспроводная зарядка',
                'description': 'Подходит для всех современных смартфонов. Быстрая зарядка до 15W.'
            },
            {
                'id': 106,
                'name': 'Чехол для телефона',
                'title': 'Чехол для телефона',
                'description': 'Защитный чехол с повышенной ударопрочностью.'
            }
        ])
    
    if any(keyword in all_text for keyword in book_keywords):
        recommendations.append({
            'id': 104,
            'name': 'Книга по программированию',
            'title': 'Книга по программированию',
            'description': 'Современные подходы к разработке программного обеспечения.'
        })
    
    if any(keyword in all_text for keyword in office_keywords):
        recommendations.append({
            'id': 102,
            'name': 'Настольный органайзер',
            'title': 'Настольный органайзер',
            'description': 'Минимализм и порядок на рабочем месте.'
        })
    
    if any(keyword in all_text for keyword in home_keywords):
        recommendations.append({
            'id': 103,
            'name': 'Экологичная бутылка для воды',
            'title': 'Экологичная бутылка для воды',
            'description': 'Стеклянная бутылка с силиконовым чехлом.'
        })
    
    # Если не определили категории, возвращаем общие рекомендации
    if not recommendations:
        recommendations = [
            {
                'id': 101,
                'name': 'Беспроводная зарядка',
                'title': 'Беспроводная зарядка',
                'description': 'Подходит для всех современных смартфонов. Быстрая зарядка до 15W. Совместима с iPhone и Android устройствами.'
            },
            {
                'id': 102,
                'name': 'Настольный органайзер',
                'title': 'Настольный органайзер',
                'description': 'Минимализм и порядок на рабочем месте. Изготовлен из экологичных материалов.'
            },
            {
                'id': 105,
                'name': 'Умный дневник',
                'title': 'Умный дневник',
                'description': 'Бумажный дневник с функцией оцифровки записей. Помогает планировать задачи.'
            }
        ]
    
    return recommendations[:5]  # Ограничиваем 5 рекомендациями


def get_random_ideas():
    """Возвращает случайные идеи, сгруппированные по темам"""
    
    categories = {
        'tech': [
            {'id': 301, 'name': 'Умные часы', 'title': 'Умные часы', 'description': 'Смарт-часы с фитнес-трекингом и уведомлениями.'},
            {'id': 302, 'name': 'Портативная колонка', 'title': 'Портативная колонка', 'description': 'Компактная колонка с хорошим звуком для улицы.'},
            {'id': 303, 'name': 'Электронная книга', 'title': 'Электронная книга', 'description': 'Читалка с экраном E-Ink для комфортного чтения.'},
        ],
        'books': [
            {'id': 304, 'name': 'Детектив', 'title': 'Детектив', 'description': 'Захватывающий детективный роман с неожиданной развязкой.'},
            {'id': 305, 'name': 'Фантастика', 'title': 'Фантастика', 'description': 'Книга в жанре научной фантастики о будущем человечества.'},
            {'id': 306, 'name': 'Биография', 'title': 'Биография', 'description': 'История жизни известного человека, которая может вдохновить.'},
        ],
        'home': [
            {'id': 307, 'name': 'Умная лампа', 'title': 'Умная лампа', 'description': 'Лампа с регулировкой цвета и яркости через приложение.'},
            {'id': 308, 'name': 'Подставка для ноутбука', 'title': 'Подставка для ноутбука', 'description': 'Эргономичная подставка для комфортной работы.'},
            {'id': 309, 'name': 'Увлажнитель воздуха', 'title': 'Увлажнитель воздуха', 'description': 'Полезное устройство для поддержания оптимального климата.'},
        ],
        'hobby': [
            {'id': 310, 'name': 'Набор для вышивания', 'title': 'Набор для вышивания', 'description': 'Готовый набор для создания красивой вышивки.'},
            {'id': 311, 'name': 'Конструктор', 'title': 'Конструктор', 'description': 'Сложный конструктор для взрослых с множеством деталей.'},
            {'id': 312, 'name': 'Набор для приготовления сыра', 'title': 'Набор для приготовления сыра', 'description': 'Все необходимое для создания домашнего сыра.'},
        ]
    }
    
    # Выбираем случайные идеи из каждой категории
    result = []
    for category_ideas in categories.values():
        if category_ideas:
            result.append(random.choice(category_ideas))
    
    # Добавляем еще случайных идей, если нужно
    all_ideas = [idea for ideas in categories.values() for idea in ideas]
    while len(result) < 5 and all_ideas:
        new_idea = random.choice(all_ideas)
        if new_idea not in result:
            result.append(new_idea)
    
    return result[:5]