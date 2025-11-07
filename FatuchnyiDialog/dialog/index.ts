import { PhaticEngine } from "./phatic-engine";

export function defaultEngine(): PhaticEngine {
  return new PhaticEngine([
    {
      pattern: "Квадрат гіпотенузи дорівнює сумі квадратів катетів.",
      response:
        "Так, але є подібний результат і для непрямокутних трикутників; це теорема косинусів.",
      priority: 100,
    },
    {
      pattern: "Ви не відверті зі мною",
      response: "Чому Ви думаєте, що я не відверта з Вами?",
      priority: 100,
    },
    {
      pattern: "Це має для вас велике значення?",
      response: "Звичайно, це має для мене велике значення.",
      priority: 100,
    },
    {
      pattern: "будьмо",
      response: "гей",
      priority: 100,
    },
    {
      pattern: "будьмо будьмо будьмо",
      response: "гей гей гей",
      priority: 100,
    },
    {
      pattern: "like sugar on my tongue",
      response: "Your body is so sweet, sweet, sweet",
      priority: 100,
    },
    {
      pattern: "Invite me if you come",
      response: "It's all I want to eat, eat, eat",
      priority: 100,
    },
    {
      pattern: "Invite me if you come, come, come",
      response: "It's all I want to eat, eat, eat",
      priority: 100,
    },

    {
      pattern: "(Я ?->a *)",
      response: ({ a }) => {
        if (!a) return "Що Ви ще маєте на увазі?";
        const word = String(a).toLowerCase();
        const responses: Record<string, string> = {
          любл: "Що Ви ще любите?",
          люблю: "Що Ви ще любите?",
          ненавиджу: "Що Ви ще ненавидите?",
          хочу: "Деталізуйте, що саме Ви хочете?",
          боюся: "Деталізуйте, що саме Ви боїтеся?",
          боюсь: "Деталізуйте, що саме Ви боїтеся?",
          думаю: "Про що саме Ви, дійсно, думаєте?",
          вважаю: "Деталізуйте, що саме Ви вважаєте?",
          сумую: "Деталізуйте, чому саме Ви сумуєте?",
          радію: "Що приносить Вам радість?",
          злюсь: "Деталізуйте, що Вас злить?",
          злюся: "Деталізуйте, що Вас злить?",
          хвилююсь: "Про що Ви, дійсно, хвилюєтеся?",
          хвилююся: "Про що Ви, дійсно, хвилюєтеся?",
          переживаю: "Про що Ви, дійсно, переживаєте?",
          турбуюсь: "Деталізуйте, що Вас турбує?",
          турбуюся: "Деталізуйте, що Вас турбує?",
          втомився: "Деталізуйте, чому саме Ви втомилися?",
          втомилась: "Деталізуйте, чому саме Ви втомилися?",
          прагну: "До чого Ви ще прагнете?",
          цікавлюсь: "Деталізуйте, чим саме Ви цікавитеся?",
        };
        if (responses[word]) return responses[word];
        return "Що Ви ще маєте на увазі?";
      },
      priority: 60,
    },

    {
      pattern: "(* ?->a бентежить ?->b *)",
      response: ({ b }) => {
        if (b) return `Як давно Вас бентежить ${b}?`;
        return "Як давно Ви так почуваєтеся?";
      },
      priority: 90,
    },
    {
      pattern: "(* померла * мати *)",
      response: "Розкажіть про Вашу мат'ю.",
      priority: 95,
    },
    {
      pattern: "(* померла * мама *)",
      response: "Розкажіть про Вашу маму.",
      priority: 95,
    },
    {
      pattern: "(* помер * тато *)",
      response: "Розкажіть про Вашого тата.",
      priority: 95,
    },
    {
      pattern: "(* помер * батько *)",
      response: "Розкажіть про Вашого батька.",
      priority: 95,
    },
    {
      pattern: "(* померли * батьки *)",
      response: "Розкажіть про Ваших батьків.",
      priority: 95,
    },
    {
      pattern: "(* комп'ютер *)",
      response: "Машини Вас лякають.",
      priority: 80,
    },
    {
      pattern: "Ні",
      response: "Будь ласка, не будьте так небагатослівні...",
      priority: 100,
    },
    {
      pattern: "Так",
      response: "Будь ласка, не будьте так небагатослівні...",
      priority: 100,
    },
    {
      pattern: "Гаразд",
      response: "Будь ласка, не будьте так небагатослівні...",
      priority: 100,
    },
    {
      pattern: "Добре",
      response: "Будь ласка, не будьте так небагатослівні...",
      priority: 100,
    },

    {
      pattern: "(* люблю *)",
      response: "Та ви що? Мені дуже цікаво, що ще Ви любите?",
      priority: 85,
    },
    {
      pattern: "(* образився *)",
      response: "Що Вас образило?",
      priority: 85,
    },
    {
      pattern: "(* образив *)",
      response: "Що Вас образило?",
      priority: 85,
    },
    {
      pattern: "(* образилась *)",
      response: "Що Вас образило?",
      priority: 85,
    },
    {
      pattern: "(* вибач *)",
      response: "За що Ви хочете вибачитися?",
      priority: 75,
    },
    {
      pattern: "(* пробач *)",
      response: "За що Ви хочете вибачитися?",
      priority: 75,
    },
    {
      pattern: "(* дякую *)",
      response: "Будь ласка. Про що б Ви ще хотіли поговорити?",
      priority: 60,
    },
    {
      pattern: "(* спасибі *)",
      response: "Будь ласка. Про що б Ви ще хотіли поговорити?",
      priority: 60,
    },
    {
      pattern: "(* депресія *)",
      response: "Як давно Ви так почуваєтеся?",
      priority: 75,
    },
    {
      pattern: "(* стосунки *)",
      response: "Що саме у стосунках Вас турбує?",
      priority: 75,
    },
    {
      pattern: "(* кохання *)",
      response: "Що для Вас означає кохання?",
      priority: 70,
    },
    {
      pattern: "(* сім'я *)",
      response: "Розкажіть більше про Вашу сім'ю.",
      priority: 70,
    },
    {
      pattern: "(* мама *)",
      response: "Які у Вас стосунки з мамою?",
      priority: 70,
    },
    {
      pattern: "(* тато *)",
      response: "Які у Вас стосунки з татом?",
      priority: 70,
    },
    {
      pattern: "(* батьки *)",
      response: "Розкажіть більше про Ваших батьків.",
      priority: 70,
    },
    {
      pattern: "(* друзі *)",
      response: "Що для Вас означають дружні стосунки?",
      priority: 70,
    },
    {
      pattern: "(* друг *)",
      response: "Що для Вас означають дружні стосунки?",
      priority: 70,
    },
    {
      pattern: "(* робота *)",
      response: "Що саме Вас хвилює на роботі?",
      priority: 75,
    },

    {
      pattern: "*",
      response: () => {
        const responses = [
          "Чому це має для Вас значення?",
          "Скажіть більше, що Ви думаєте про це?",
          "Я Вас не дуже розумію.",
          "Я Вас не розумію.",
          "Продовжуйте, я слухаю.",
          "Можете навести приклад?",
          "Як давно Ви про це думаєте?",
          "Що Ви хотіли б змінити в цій ситуації?",
        ];
        const randIndex = Math.floor(Math.random() * responses.length);
        return responses[randIndex];
      },
      priority: -1000,
    },
  ]);
}
