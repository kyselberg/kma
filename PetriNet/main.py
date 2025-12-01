from snakes.nets import PetriNet, Place, Transition, Variable, MultiArc, Substitution, Value

# ================================================
# Мережа Петрі: Автоматизована система бронювання готельних номерів
# ================================================

def create_net():
    net = PetriNet('HotelBookingSystem')
    
    # ================================================
    # ВІЗУАЛЬНЕ КОДУВАННЯ:
    # 🔴 Червоний - Клієнт
    # 🟢 Зелений - Система готелю
    # 🔵 Синій - Банк/Оплата
    # 🟡 Жовтий - Лічильник спроб
    # ================================================

    # --- Початкові позиції ---
    net.add_place(Place('P_client', ['client']))         # 🔴 Клієнт хоче бронювати
    net.add_place(Place('P_rooms', ['room'] * 50))       # 🟢 Пул: 50 вільних номерів
    
    # --- Процес бронювання ---
    net.add_place(Place('P_found', []))                  # 🔴 Знайдено номери
    net.add_place(Place('P_no_rooms', []))               # 🔴 Немає вільних
    net.add_place(Place('P_hold', []))                   # 🔴🟢 Hold (клієнт + номер)
    net.add_place(Place('P_payment', []))                # 🔵 До оплати
    
    # --- Лічильник спроб оплати [🟡 Жовтий] ---
    net.add_place(Place('P_attempts', ['attempt'] * 3))  # 3 спроби оплати
    
    # --- Результати оплати ---
    net.add_place(Place('P_paid', []))                   # 🔵 Оплата успішна
    net.add_place(Place('P_failed', []))                 # 🔵 Оплата невдала (тимчасово)
    net.add_place(Place('P_rejected', []))               # 🔴 Відмова (спроби вичерпано)
    
    # --- Підтвердження ---
    net.add_place(Place('P_confirmed', []))              # 🔴 Бронь підтверджена
    net.add_place(Place('P_occupied', []))               # 🟢 Номер зайнятий
    net.add_place(Place('P_email_sent', []))             # 🟢 Email надіслано
    
    # --- Завершення ---
    net.add_place(Place('P_end', []))                    # Завершено
    net.add_place(Place('P_timeout', []))                # Таймаут

    # ================================================
    # ПЕРЕХОДИ
    # ================================================
    
    # T_search: Пошук номерів (є вільні)
    net.add_transition(Transition('T_search'))
    net.add_input('P_client', 'T_search', Variable('c'))
    net.add_input('P_rooms', 'T_search', Variable('r'))
    net.add_output('P_found', 'T_search', Variable('c'))
    net.add_output('P_rooms', 'T_search', Variable('r'))  # Номер залишається в пулі

    # T_no_rooms: Немає номерів
    net.add_transition(Transition('T_no_rooms'))
    net.add_input('P_client', 'T_no_rooms', Variable('c'))
    net.add_output('P_no_rooms', 'T_no_rooms', Variable('c'))

    # T_select: Клієнт обрав номер → Hold
    net.add_transition(Transition('T_select'))
    net.add_input('P_found', 'T_select', Variable('c'))
    net.add_input('P_rooms', 'T_select', Variable('r'))
    net.add_output('P_hold', 'T_select', MultiArc([Variable('c'), Variable('r')]))

    # T_to_payment: Перехід до оплати
    net.add_transition(Transition('T_to_payment'))
    net.add_input('P_hold', 'T_to_payment', MultiArc([Variable('c'), Variable('r')]))
    net.add_output('P_payment', 'T_to_payment', MultiArc([Variable('c'), Variable('r')]))

    # T_timeout: Таймаут hold
    net.add_transition(Transition('T_timeout'))
    net.add_input('P_hold', 'T_timeout', MultiArc([Variable('c'), Variable('r')]))
    net.add_output('P_timeout', 'T_timeout', Variable('c'))
    net.add_output('P_rooms', 'T_timeout', Variable('r'))  # Повертає номер

    # ================================================
    # ОПЛАТА З ЛІЧИЛЬНИКОМ ТА ЦИКЛОМ ПОВЕРНЕННЯ
    # ================================================
    
    # T_pay_success: Оплата успішна
    net.add_transition(Transition('T_pay_success'))
    net.add_input('P_payment', 'T_pay_success', MultiArc([Variable('c'), Variable('r')]))
    net.add_output('P_paid', 'T_pay_success', MultiArc([Variable('c'), Variable('r')]))

    # T_pay_fail: Оплата невдала (віднімає 1 спробу)
    net.add_transition(Transition('T_pay_fail'))
    net.add_input('P_payment', 'T_pay_fail', MultiArc([Variable('c'), Variable('r')]))
    net.add_input('P_attempts', 'T_pay_fail', Value('attempt'))  # -1 спроба
    net.add_output('P_failed', 'T_pay_fail', MultiArc([Variable('c'), Variable('r')]))

    # T_retry: Повторна спроба (ЦИКЛ ПОВЕРНЕННЯ / Backtracking)
    net.add_transition(Transition('T_retry'))
    net.add_input('P_failed', 'T_retry', MultiArc([Variable('c'), Variable('r')]))
    net.add_output('P_payment', 'T_retry', MultiArc([Variable('c'), Variable('r')]))

    # T_reject: Відмова (спроби вичерпано)
    net.add_transition(Transition('T_reject'))
    net.add_input('P_failed', 'T_reject', MultiArc([Variable('c'), Variable('r')]))
    net.add_output('P_rejected', 'T_reject', Variable('c'))
    net.add_output('P_rooms', 'T_reject', Variable('r'))  # Повертає номер

    # ================================================
    # ПІДТВЕРДЖЕННЯ ТА ЗАВЕРШЕННЯ
    # ================================================
    
    # T_confirm: Підтвердити бронювання
    net.add_transition(Transition('T_confirm'))
    net.add_input('P_paid', 'T_confirm', MultiArc([Variable('c'), Variable('r')]))
    net.add_output('P_confirmed', 'T_confirm', Variable('c'))
    net.add_output('P_occupied', 'T_confirm', Variable('r'))
    net.add_output('P_email_sent', 'T_confirm', Value('email'))

    # T_cancel: Скасувати бронь
    net.add_transition(Transition('T_cancel'))
    net.add_input('P_confirmed', 'T_cancel', Variable('c'))
    net.add_input('P_occupied', 'T_cancel', Variable('r'))
    net.add_input('P_email_sent', 'T_cancel', Value('email'))
    net.add_output('P_rooms', 'T_cancel', Variable('r'))
    net.add_output('P_end', 'T_cancel', MultiArc([Variable('c'), Value('email')]))

    # T_checkout: Check-out
    net.add_transition(Transition('T_checkout'))
    net.add_input('P_confirmed', 'T_checkout', Variable('c'))
    net.add_input('P_occupied', 'T_checkout', Variable('r'))
    net.add_input('P_email_sent', 'T_checkout', Value('email'))
    net.add_output('P_rooms', 'T_checkout', Variable('r'))
    net.add_output('P_end', 'T_checkout', MultiArc([Variable('c'), Value('email')]))

    return net

# ================================================
# Функція виведення стану
# ================================================
def show_state(net, step=0, title=""):
    if title:
        print(f"\n{title}")
    print(f"Крок {step}:")
    print("-" * 40)
    
    for p in sorted(net.place(), key=lambda x: x.name):
        tokens = list(p)
        if p.name == 'P_rooms':
            print(f"  {p.name:15}: {len(tokens)} номерів")
        elif p.name == 'P_attempts':
            print(f"  {p.name:15}: {len(tokens)} спроб(и)")
        elif tokens:
            print(f"  {p.name:15}: {tokens}")
    
    enabled = [t.name for t in net.transition() if t.modes()]
    print(f"  Активні переходи: {enabled or 'немає'}")

# ================================================
# Симуляція 1: Успішне бронювання
# ================================================
def simulation_1_successful_booking():
    print("\n" + "="*50)
    print("СИМУЛЯЦІЯ 1: УСПІШНЕ БРОНЮВАННЯ")
    print("="*50)
    net = create_net()
    show_state(net, 0, "Початок")

    net.transition('T_search').fire(Substitution(c='client', r='room'))
    show_state(net, 1, "Пошук номерів")

    net.transition('T_select').fire(Substitution(c='client', r='room'))
    show_state(net, 2, "Обрано номер → Hold")

    net.transition('T_to_payment').fire(Substitution(c='client', r='room'))
    show_state(net, 3, "До оплати")

    net.transition('T_pay_success').fire(Substitution(c='client', r='room'))
    show_state(net, 4, "Оплата успішна")

    net.transition('T_confirm').fire(Substitution(c='client', r='room'))
    show_state(net, 5, "Бронювання підтверджено")

    print("\n✓ Результат: Номер заброньовано!")

# ================================================
# Симуляція 2: Невдала оплата з повторними спробами
# ================================================
def simulation_2_failed_payment():
    print("\n" + "="*50)
    print("СИМУЛЯЦІЯ 2: НЕВДАЛА ОПЛАТА (3 спроби)")
    print("="*50)
    net = create_net()
    
    net.transition('T_search').fire(Substitution(c='client', r='room'))
    net.transition('T_select').fire(Substitution(c='client', r='room'))
    net.transition('T_to_payment').fire(Substitution(c='client', r='room'))
    show_state(net, 0, "До оплати (3 спроби)")

    # Спроба 1
    net.transition('T_pay_fail').fire(Substitution(c='client', r='room'))
    show_state(net, 1, "❌ Спроба 1 невдала")
    
    net.transition('T_retry').fire(Substitution(c='client', r='room'))
    show_state(net, 2, "🔄 Повернення (Backtracking)")

    # Спроба 2
    net.transition('T_pay_fail').fire(Substitution(c='client', r='room'))
    show_state(net, 3, "❌ Спроба 2 невдала")
    
    net.transition('T_retry').fire(Substitution(c='client', r='room'))
    show_state(net, 4, "🔄 Повернення")

    # Спроба 3
    net.transition('T_pay_fail').fire(Substitution(c='client', r='room'))
    show_state(net, 5, "❌ Спроба 3 невдала - ВИЧЕРПАНО!")

    # Відмова
    net.transition('T_reject').fire(Substitution(c='client', r='room'))
    show_state(net, 6, "Відмова")

    print("\n✓ Результат: Спроби вичерпано, номер повернуто.")

# ================================================
# Симуляція 3: Успіх після невдалої спроби
# ================================================
def simulation_3_success_after_fail():
    print("\n" + "="*50)
    print("СИМУЛЯЦІЯ 3: УСПІХ ПІСЛЯ НЕВДАЛОЇ СПРОБИ")
    print("="*50)
    net = create_net()
    
    net.transition('T_search').fire(Substitution(c='client', r='room'))
    net.transition('T_select').fire(Substitution(c='client', r='room'))
    net.transition('T_to_payment').fire(Substitution(c='client', r='room'))
    show_state(net, 0, "До оплати")

    net.transition('T_pay_fail').fire(Substitution(c='client', r='room'))
    show_state(net, 1, "❌ Спроба 1 невдала")
    
    net.transition('T_retry').fire(Substitution(c='client', r='room'))
    show_state(net, 2, "🔄 Повернення")

    net.transition('T_pay_success').fire(Substitution(c='client', r='room'))
    show_state(net, 3, "✅ Спроба 2 успішна!")

    net.transition('T_confirm').fire(Substitution(c='client', r='room'))
    show_state(net, 4, "Підтверджено")

    print("\n✓ Результат: Оплата пройшла з другої спроби!")

# ================================================
# Симуляція 4: Таймаут
# ================================================
def simulation_4_timeout():
    print("\n" + "="*50)
    print("СИМУЛЯЦІЯ 4: ТАЙМАУТ HOLD")
    print("="*50)
    net = create_net()
    
    net.transition('T_search').fire(Substitution(c='client', r='room'))
    net.transition('T_select').fire(Substitution(c='client', r='room'))
    show_state(net, 0, "Hold")

    net.transition('T_timeout').fire(Substitution(c='client', r='room'))
    show_state(net, 1, "Таймаут")

    print("\n✓ Результат: Номер звільнено.")

# ================================================
# Симуляція 5: Немає номерів
# ================================================
def simulation_5_no_rooms():
    print("\n" + "="*50)
    print("СИМУЛЯЦІЯ 5: НЕМАЄ ВІЛЬНИХ НОМЕРІВ")
    print("="*50)
    net = create_net()
    net.place('P_rooms').tokens = []  # Очищаємо пул
    show_state(net, 0, "Немає номерів")

    net.transition('T_no_rooms').fire(Substitution(c='client'))
    show_state(net, 1, "Повідомлено клієнта")

    print("\n✓ Результат: Номерів немає.")

# ================================================
# Запуск
# ================================================
if __name__ == "__main__":
    simulation_1_successful_booking()
    simulation_2_failed_payment()
    simulation_3_success_after_fail()
    simulation_4_timeout()
    simulation_5_no_rooms()

    print("\n" + "="*50)
    print("ГОТОВО!")
    print("="*50)
    print("\n📋 Що реалізовано:")
    print("  ✓ Пул номерів (50 кімнат)")
    print("  ✓ Лічильник спроб оплати (3 спроби)")
    print("  ✓ Цикл повернення при невдалій оплаті")
    print("  ✓ Таймаут hold")
    print("  ✓ Скасування та check-out")
