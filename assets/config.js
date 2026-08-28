window.APP_CONFIG = {
  ctaUrl: 'https://chicken-road-mlb-promo.com',

  passthroughParams: [
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
    'subid', 'clickid', 'click_id', 'gclid', 'fbclid', 'ttclid'
  ],

  analytics: {
    ga4Id: '',
    debugOverlay: 'auto',
    storageKey: 'cr_mlb_events'
  },

  game: {
    bases: [
      { mult: '1.28', risk: 0.07 },
      { mult: '1.65', risk: 0.09 },
      { mult: '2.20', risk: 0.12 },
      { mult: '3.10', risk: 0.15 },
      { mult: '4.40', risk: 0.19 },
      { mult: '6.80', risk: 0.24 },
      { mult: '12.00', risk: 0.30 }
    ]
  },

  assets: { runner: '#spr-chicken', ball: '#spr-ball', bat: '#spr-bat' },

  defaultLocale: 'ar',
  locales: {
    ar: {
      dir: 'rtl', lang: 'ar', label: 'العربية', switchTo: 'FR',
      'brand.logo': 'MELBET',
      'brand.game': 'CHICKEN ROAD',
      'kicker': 'عرض حصري',
      'headline': 'اعبر الملعب واظفر بالهوم ران',
      'offer': 'باقة ترحيب 200% حتى 20.000 دج',
      'cta': 'احصل على الباقة',
      'hint.idle': 'تقدّم شوطًا بعد شوط، أو اسحب مبكرًا',
      'hint.run': 'اضرب الكرة وتقدّم — أو اسحب الآن',
      'hint.win': 'هوم ران! الباقة الترحيبية في انتظارك',
      'hint.cash': 'خرجت في الوقت المناسب. الباقة في انتظارك',
      'hint.out': 'الكرة أصابتك. أعد المحاولة، الأمر مجاني',
      'btn.start': 'ابدأ اللعب',
      'btn.run': 'اضرب وتقدّم',
      'btn.cash': 'اسحب الآن',
      'btn.retry': 'إعادة المحاولة',
      'status.idle': 'وضع تجريبي',
      'status.win': 'هوم ران',
      'status.cash': 'تم السحب',
      'status.out': 'خارج اللعب',
      'base.1': 'الشوط 1', 'base.2': 'الشوط 2', 'base.3': 'الشوط 3', 'base.4': 'الشوط 4',
      'base.5': 'الشوط 5', 'base.6': 'الشوط 6', 'base.7': 'هوم ران',
      'steps.title': 'ثلاث خطوات',
      'steps.1': 'العب 20 ثانية',
      'steps.2': 'اسحب مبكرًا أو اذهب للهوم ران',
      'steps.3': 'استلم باقتك',
      'legal': 'عرض تجريبي: بدون رهان أو دفع أو أرباح حقيقية. 18+، العب بمسؤولية.'
    },
    fr: {
      dir: 'ltr', lang: 'fr', label: 'Français', switchTo: 'ع',
      'brand.logo': 'MELBET',
      'brand.game': 'CHICKEN ROAD',
      'kicker': 'Offre exclusive',
      'headline': 'Traverse le terrain, décroche le home run',
      'offer': 'Pack de bienvenue 200% jusqu’à 20 000 DZD',
      'cta': 'Récupérer le pack',
      'hint.idle': 'Avance manche par manche, ou encaisse plus tôt',
      'hint.run': 'Frappe et avance, ou encaisse maintenant',
      'hint.win': 'Home run ! Ton pack de bienvenue t’attend',
      'hint.cash': 'Sorti au bon moment. Ton pack t’attend',
      'hint.out': 'La balle t’a touché. Rejoue, c’est gratuit',
      'btn.start': 'Commencer',
      'btn.run': 'Frapper',
      'btn.cash': 'Encaisser',
      'btn.retry': 'Rejouer',
      'status.idle': 'Mode démo',
      'status.win': 'Home run',
      'status.cash': 'Encaissé',
      'status.out': 'Éliminé',
      'base.1': 'Manche 1', 'base.2': 'Manche 2', 'base.3': 'Manche 3', 'base.4': 'Manche 4',
      'base.5': 'Manche 5', 'base.6': 'Manche 6', 'base.7': 'Home run',
      'steps.title': 'Trois étapes',
      'steps.1': 'Joue 20 secondes',
      'steps.2': 'Encaisse tôt ou vise le home run',
      'steps.3': 'Récupère ton pack',
      'legal': 'Démo : ni mise, ni paiement, ni gain réel. 18+, jouez de manière responsable.'
    }
  }
};
