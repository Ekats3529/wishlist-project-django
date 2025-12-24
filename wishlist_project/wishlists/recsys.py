import random
import re
from collections import Counter
from django.db.models import Count
from .models import Item, Wishlist

class RecommendationSystem:
    def __init__(self):
        # База знаний для рекомендаций
        self.category_keywords = {
            'tech': [
                'телефон', 'смартфон', 'зарядк', 'наушник', 'ноутбук', 'компьютер', 
                'гаджет', 'планшет', 'камер', 'телевизор', 'монитор', 'клавиатур',
                'мыш', 'колонк', 'динамик', 'роутер', 'принтер', 'сканер'
            ],
            'books': [
                'книг', 'читать', 'литератур', 'учебник', 'роман', 'детектив',
                'фантастик', 'поэзи', 'проз', 'биографи', 'энциклопед', 'журнал'
            ],
            'home': [
                'органайзер', 'канцеляр', 'ручк', 'блокнот', 'дневник', 'лампа',
                'светильник', 'ковер', 'подушк', 'одеяло', 'посуда', 'чашк',
                'тарелк', 'кастрюл', 'сковород', 'холодильник', 'микроволнов'
            ],
            'sport': [
                'кроссовк', 'спортивн', 'футбол', 'мяч', 'ракетк', 'теннис',
                'велосипед', 'ролик', 'коньк', 'лыж', 'сноуборд', 'гир',
                'гантел', 'тренажер', 'йог', 'фитнес', 'плавани'
            ],
            'fashion': [
                'одежд', 'футболк', 'джинс', 'брюк', 'рубашк', 'плать',
                'юбк', 'костюм', 'пиджак', 'пальто', 'куртк', 'обув',
                'туфл', 'ботинк', 'сумк', 'рюкзак', 'кошелек', 'ремен'
            ],
            'beauty': [
                'косметик', 'крем', 'шампун', 'мыл', 'гель', 'дух',
                'парфюм', 'дезодорант', 'бритв', 'маникюр', 'педикюр'
            ],
            'hobby': [
                'рисовани', 'краск', 'кист', 'холст', 'музык', 'гитар',
                'пианино', 'скрипк', 'фотоаппарат', 'видеокамер', 'игр',
                'конструктор', 'пазл', 'модел', 'коллекцион'
            ],
            'travel': [
                'чемодан', 'сумк', 'рюкзак', 'палатк', 'спальник', 'термос',
                'бинокль', 'карт', 'компас', 'фонар', 'зажигалк'
            ],
            'gifts': [
                'подар', 'сувенир', 'открытк', 'букет', 'конфет', 'шоколад',
                'алкогол', 'вин', 'шампанск', 'сертификат', 'поздравлен'
            ],
            'health': [
                'аптечк', 'лекарств', 'витамин', 'тонометр', 'глюкометр',
                'ингалятор', 'массажер', 'ортез', 'корсет', 'ортопед'
            ]
        }
        
        # Рекомендации для каждой категории
        self.category_recommendations = {
            'tech': [
                {'id': 101, 'name': 'Беспроводная зарядка', 'description': 'Быстрая зарядка 15W для всех смартфонов'},
                {'id': 102, 'name': 'Портативный аккумулятор', 'description': 'Power bank 20000 mAh с быстрой зарядкой'},
                {'id': 103, 'name': 'Умные часы', 'description': 'Фитнес-трекер с мониторингом сна и пульса'},
                {'id': 104, 'name': 'Bluetooth-наушники', 'description': 'Шумоподавление, 30 часов работы'},
                {'id': 105, 'name': 'Внешний SSD-диск', 'description': '1TB, скорость до 1050 MB/s'},
                {'id': 106, 'name': 'Умная лампа', 'description': 'Управление через приложение, изменение цвета'},
                {'id': 107, 'name': 'Электронная книга', 'description': 'Экран E-Ink, подсветка, 8GB памяти'},
                {'id': 108, 'name': 'Игровая мышь', 'description': 'Оптический сенсор 16000 DPI, программируемые кнопки'},
            ],
            'books': [
                {'id': 201, 'name': 'Книга по саморазвитию', 'description': 'Атомные привычки: как изменить свою жизнь'},
                {'id': 202, 'name': 'Художественный бестселлер', 'description': 'Новый роман популярного автора'},
                {'id': 203, 'name': 'Кулинарная книга', 'description': 'Рецепты здорового питания на каждый день'},
                {'id': 204, 'name': 'Детектив с интригой', 'description': 'Захватывающий триллер с неожиданной развязкой'},
                {'id': 205, 'name': 'Научная фантастика', 'description': 'Футуристический роман о будущем человечества'},
                {'id': 206, 'name': 'Биография успешного человека', 'description': 'История, которая может вдохновить'},
                {'id': 207, 'name': 'Книга по инвестициям', 'description': 'Основы финансовой грамотности'},
                {'id': 208, 'name': 'Путеводитель по странам', 'description': 'Советы для путешественников'},
            ],
            'home': [
                {'id': 301, 'name': 'Настольный органайзер', 'description': 'Деревянный органайзер для канцелярии'},
                {'id': 302, 'name': 'Умный термос', 'description': 'Сохраняет температуру до 24 часов'},
                {'id': 303, 'name': 'Электрический чайник', 'description': 'Быстрый нагрев, отключение при кипении'},
                {'id': 304, 'name': 'Набор кухонных ножей', 'description': 'Профессиональные ножи из нержавеющей стали'},
                {'id': 305, 'name': 'Аромадиффузор', 'description': 'Ультразвуковой, с подсветкой, таймером'},
                {'id': 306, 'name': 'Эргономичное кресло', 'description': 'Ортопедическое, регулируемая спинка'},
                {'id': 307, 'name': 'Увлажнитель воздуха', 'description': 'Для поддержания оптимального климата'},
                {'id': 308, 'name': 'Робот-пылесос', 'description': 'Автоматическая уборка, навигация по карте'},
            ],
            'sport': [
                {'id': 401, 'name': 'Фитнес-браслет', 'description': 'Отслеживание активности, сна, пульса'},
                {'id': 402, 'name': 'Йога-коврик', 'description': 'Нескользящий, экологичный материал'},
                {'id': 403, 'name': 'Беговая дорожка', 'description': 'Складная, с LCD дисплеем'},
                {'id': 404, 'name': 'Набор гантелей', 'description': 'Регулируемый вес от 2 до 20 кг'},
                {'id': 405, 'name': 'Спортивная бутылка', 'description': 'Широкое горло, мерная шкала'},
                {'id': 406, 'name': 'Велосипедный шлем', 'description': 'Вентиляция, регулировка, защита'},
                {'id': 407, 'name': 'Тренировочные перчатки', 'description': 'Защита ладоней, вентиляция'},
                {'id': 408, 'name': 'Спортивный рюкзак', 'description': 'Водонепроницаемый, отделение для обуви'},
            ],
            'fashion': [
                {'id': 501, 'name': 'Кожаный ремень', 'description': 'Натуральная кожа, регулируемая длина'},
                {'id': 502, 'name': 'Дизайнерские часы', 'description': 'Кварцевый механизм, кожаный ремешок'},
                {'id': 503, 'name': 'Шерстяной шарф', 'description': 'Теплый, стильный аксессуар'},
                {'id': 504, 'name': 'Кожаный портмоне', 'description': 'Несколько отделений, RFID защита'},
                {'id': 505, 'name': 'Солнечные очки', 'description': 'Защита от UV, поляризованные линзы'},
                {'id': 506, 'name': 'Классические туфли', 'description': 'Натуральная кожа, удобная колодка'},
                {'id': 507, 'name': 'Стильная куртка', 'description': 'Водоотталкивающая, с капюшоном'},
                {'id': 508, 'name': 'Кожаная сумка', 'description': 'Для ноутбука, несколько карманов'},
            ],
            'beauty': [
                {'id': 601, 'name': 'Набор для ухода за кожей', 'description': 'Очищение, тонизирование, увлажнение'},
                {'id': 602, 'name': 'Электрическая зубная щетка', 'description': 'Таймер, несколько насадок'},
                {'id': 603, 'name': 'Фен с ионизацией', 'description': 'Мощный, защита от перегрева'},
                {'id': 604, 'name': 'Массажер для лица', 'description': 'Глубокое очищение, микротоки'},
                {'id': 605, 'name': 'Набор для маникюра', 'description': 'Профессиональные инструменты'},
                {'id': 606, 'name': 'Эпилятор', 'description': 'Быстрое и безболезненное удаление волос'},
                {'id': 607, 'name': 'Щетка для волос', 'description': 'Антистатик, массажный эффект'},
                {'id': 608, 'name': 'Зеркало с подсветкой', 'description': 'LED освещение, увеличение'},
            ],
            'hobby': [
                {'id': 701, 'name': 'Набор для рисования', 'description': 'Акварель, акрил, кисти, бумага'},
                {'id': 702, 'name': '3D-ручка', 'description': 'Создание объемных фигур, безопасная'},
                {'id': 703, 'name': 'Настольная игра', 'description': 'Стратегическая игра для компании'},
                {'id': 704, 'name': 'Конструктор для взрослых', 'description': 'Сложный, детализированный набор'},
                {'id': 705, 'name': 'Музыкальный инструмент', 'description': 'Укулеле, губная гармошка, калимба'},
                {'id': 706, 'name': 'Набор для вышивания', 'description': 'Готовая схема, нитки, иглы, канва'},
                {'id': 707, 'name': 'Мини-гольф набор', 'description': 'Для игры дома или в офисе'},
                {'id': 708, 'name': 'Фотоальбом', 'description': 'Стильный, с возможностью добавления фото'},
            ],
            'travel': [
                {'id': 801, 'name': 'Дорожная подушка', 'description': 'Надувная, поддержка шеи'},
                {'id': 802, 'name': 'Внешний аккумулятор', 'description': 'Высокая емкость, быстрая зарядка'},
                {'id': 803, 'name': 'Складная бутылка', 'description': 'Не занимает места когда пустая'},
                {'id': 804, 'name': 'Дорожный утюг', 'description': 'Компактный, с отпаривателем'},
                {'id': 805, 'name': 'Универсальный адаптер', 'description': 'Для разных стран, защита'},
                {'id': 806, 'name': 'Водонепроницаемый чехол', 'description': 'Для телефона, документов'},
                {'id': 807, 'name': 'Походный фонарь', 'description': 'Яркий, перезаряжаемый, несколько режимов'},
                {'id': 808, 'name': 'Термосумка', 'description': 'Сохраняет температуру продуктов'},
            ],
            'gifts': [
                {'id': 901, 'name': 'Подарочный сертификат', 'description': 'Возможность выбрать подарок самостоятельно'},
                {'id': 902, 'name': 'Шоколад ручной работы', 'description': 'Премиум качество, красивая упаковка'},
                {'id': 903, 'name': 'Букет цветов', 'description': 'Свежие цветы, профессиональная упаковка'},
                {'id': 904, 'name': 'Подарочная корзина', 'description': 'Набор деликатесов, напитков'},
                {'id': 905, 'name': 'Именная кружка', 'description': 'С фотографией или надписью'},
                {'id': 906, 'name': 'Подарочное издание книги', 'description': 'В кожаном переплете, с иллюстрациями'},
                {'id': 907, 'name': 'Набор косметики', 'description': 'Люксовая косметика в красивой упаковке'},
                {'id': 908, 'name': 'Билеты на мероприятие', 'description': 'Концерт, театр, выставка'},
            ],
            'health': [
                {'id': 1001, 'name': 'Тонометр автоматический', 'description': 'Точное измерение давления'},
                {'id': 1002, 'name': 'Глюкометр', 'description': 'Быстрое измерение уровня глюкозы'},
                {'id': 1003, 'name': 'Массажная подушка', 'description': 'Для шеи и спины, несколько режимов'},
                {'id': 1004, 'name': 'Ингалятор', 'description': 'Компактный, эффективный'},
                {'id': 1005, 'name': 'Термометр электронный', 'description': 'Быстрое измерение температуры'},
                {'id': 1006, 'name': 'Весы умные', 'description': 'Анализ состава тела'},
                {'id': 1007, 'name': 'Ортопедическая подушка', 'description': 'Для здорового сна'},
                {'id': 1008, 'name': 'Набор витаминов', 'description': 'Комплекс для иммунитета'},
            ]
        }
        
        # Популярные товары (могут быть из базы данных)
        self.popular_items = [
            {'id': 1101, 'name': 'Беспроводные наушники AirPods Pro', 'description': 'Шумоподавление, до 24 часов работы'},
            {'id': 1102, 'name': 'Электросамокат', 'description': 'Скорость до 25 км/ч, запас хода 30 км'},
            {'id': 1103, 'name': 'Умная колонка с голосовым помощником', 'description': 'Управление умным домом, музыка'},
            {'id': 1104, 'name': 'Электронная книга Amazon Kindle', 'description': 'Экран без бликов, подсветка'},
            {'id': 1105, 'name': 'Фитнес-браслет с ЭКГ', 'description': 'Мониторинг здоровья, уведомления'},
            {'id': 1106, 'name': 'Набор посуды с антипригарным покрытием', 'description': '10 предметов, прочное покрытие'},
            {'id': 1107, 'name': 'Беспроводной пылесос', 'description': 'Мощный, легкий, длительное время работы'},
            {'id': 1108, 'name': 'Электрический гриль', 'description': 'Быстрое приготовление, регулировка температуры'},
        ]
    
    def analyze_wishlist(self, wishlist):
        """Анализирует вишлист и определяет интересы пользователя"""
        
        items = wishlist.items.all()
        if not items:
            return {'categories': [], 'popularity': 0, 'price_range': None}
        
        all_text = ' '.join([
            item.title.lower() + ' ' + (item.description.lower() if item.description else '')
            for item in items
        ])
        
        detected_categories = []
        for category, keywords in self.category_keywords.items():
            for keyword in keywords:
                if keyword in all_text:
                    detected_categories.append(category)
                    break
        
        prices = [item.price for item in items if item.price]
        price_range = None
        if prices:
            avg_price = sum(prices) / len(prices)
            if avg_price < 50:
                price_range = 'budget'
            elif avg_price < 200:
                price_range = 'medium'
            else:
                price_range = 'premium'
        
        return {
            'categories': list(set(detected_categories)),  # Убираем дубликаты
            'popularity': len(items),
            'price_range': price_range
        }
    
    def get_recommendations_for_categories(self, categories, price_range=None, count=5):
        """Получает рекомендации для определенных категорий"""
        
        recommendations = []
        
        for category in categories:
            if category in self.category_recommendations:
                category_recs = self.category_recommendations[category]
                
                selected = random.sample(category_recs, min(3, len(category_recs)))
                recommendations.extend(selected)
        
        if len(recommendations) < count:
            additional_needed = count - len(recommendations)
            popular = random.sample(self.popular_items, min(additional_needed, len(self.popular_items)))
            recommendations.extend(popular)
        
        random.shuffle(recommendations)
        return recommendations[:count]
    
    def get_complementary_recommendations(self, wishlist, count=5):
        """Получает дополняющие рекомендации на основе существующих товаров"""
        
        items = wishlist.items.all()
        if not items:
            return self.get_popular_recommendations(count)
        
        analysis = self.analyze_wishlist(wishlist)
        categories = analysis['categories']
        
        if not categories:
            return self.get_popular_recommendations(count)
        
        return self.get_recommendations_for_categories(categories, analysis['price_range'], count)
    
    def get_popular_recommendations(self, count=5):
        """Получает популярные рекомендации"""
        return random.sample(self.popular_items, min(count, len(self.popular_items)))
    
    def get_random_ideas(self, count=5):
        """Получает случайные идеи из всех категорий"""
        all_recs = []
        for category_recs in self.category_recommendations.values():
            all_recs.extend(category_recs)
        
        all_recs.extend(self.popular_items)
        
        unique_recs = {}
        for rec in all_recs:
            unique_recs[rec['id']] = rec
        
        selected_ids = random.sample(list(unique_recs.keys()), min(count, len(unique_recs)))
        return [unique_recs[id] for id in selected_ids]
    
    def get_diverse_recommendations(self, wishlist, count=5):
        """Получает разнообразные рекомендации (разные категории)"""
        
        analysis = self.analyze_wishlist(wishlist)
        existing_categories = set(analysis['categories'])
        
        available_categories = [cat for cat in self.category_recommendations.keys() 
                              if cat not in existing_categories]
        
        if not available_categories:
            available_categories = list(self.category_recommendations.keys())
        
        recommendations = []
        categories_to_use = random.sample(available_categories, min(3, len(available_categories)))
        
        for category in categories_to_use:
            if category in self.category_recommendations:
                category_recs = self.category_recommendations[category]
                if category_recs:
                    rec = random.choice(category_recs)
                    recommendations.append(rec)
        
        if len(recommendations) < count:
            additional = count - len(recommendations)
            popular = random.sample(self.popular_items, min(additional, len(self.popular_items)))
            recommendations.extend(popular)
        
        return recommendations[:count]


rec_system = RecommendationSystem()

def get_wishlist_recommendations(wishlist):
    """Основная функция для получения рекомендаций"""
    
    items = wishlist.items.all()
    
    if not items:
        return rec_system.get_random_ideas(5)
    
    analysis = rec_system.analyze_wishlist(wishlist)
    
    if analysis['popularity'] < 3:
        return rec_system.get_diverse_recommendations(wishlist, 5)
    elif analysis['popularity'] < 10:
        return rec_system.get_complementary_recommendations(wishlist, 5)
    else:
        categories = analysis['categories']
        if categories:
            return rec_system.get_recommendations_for_categories(categories, analysis['price_range'], 5)
        else:
            return rec_system.get_popular_recommendations(5)