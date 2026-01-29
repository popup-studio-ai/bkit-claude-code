/**
 * Multi-language Support Module
 * @module lib/intent/language
 * @version 1.4.7
 */

/**
 * Supported languages
 */
const SUPPORTED_LANGUAGES = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'it'];

/**
 * Agent trigger patterns for 8 languages
 */
const AGENT_TRIGGER_PATTERNS = {
  'gap-detector': {
    en: ['verify', 'check', 'gap', 'compare', 'validate'],
    ko: ['검증', '확인', '갭', '비교', '검사', '맞아?', '이거 괜찮아?'],
    ja: ['検証', '確認', 'ギャップ', '比較', '正しい?', '合ってる?'],
    zh: ['验证', '确认', '差距', '比较', '对吗?', '对不对?'],
    es: ['verificar', 'comprobar', 'brecha', 'comparar', 'está bien?'],
    fr: ['vérifier', 'contrôler', 'écart', 'comparer', "c'est correct?"],
    de: ['prüfen', 'überprüfen', 'Lücke', 'vergleichen', 'ist das richtig?'],
    it: ['verificare', 'controllare', 'divario', 'confrontare', 'è giusto?']
  },
  'pdca-iterator': {
    en: ['improve', 'iterate', 'fix', 'auto-fix', 'optimize'],
    ko: ['개선', '반복', '수정', '자동 수정', '고쳐줘', '개선해줘'],
    ja: ['改善', '反復', '修正', '自動修正', '直して', 'もっと良く'],
    zh: ['改进', '迭代', '修复', '自动修复', '优化'],
    es: ['mejorar', 'iterar', 'arreglar', 'auto-arreglar', 'optimizar'],
    fr: ['améliorer', 'itérer', 'corriger', 'auto-corriger', 'optimiser'],
    de: ['verbessern', 'iterieren', 'reparieren', 'auto-reparieren', 'optimieren'],
    it: ['migliorare', 'iterare', 'correggere', 'auto-correggere', 'ottimizzare']
  },
  'code-analyzer': {
    en: ['analyze', 'quality', 'security', 'code review', 'any issues?'],
    ko: ['분석', '품질', '보안', '코드 리뷰', '이상해', '뭔가 이상해'],
    ja: ['分析', '品質', 'セキュリティ', 'コードレビュー', 'おかしい'],
    zh: ['分析', '质量', '安全', '代码审查', '有问题?'],
    es: ['analizar', 'calidad', 'seguridad', 'revisión de código', 'hay problemas?'],
    fr: ['analyser', 'qualité', 'sécurité', 'revue de code', 'il y a des problèmes?'],
    de: ['analysieren', 'Qualität', 'Sicherheit', 'Code-Review', 'gibt es Probleme?'],
    it: ['analizzare', 'qualità', 'sicurezza', 'revisione codice', 'ci sono problemi?']
  },
  'report-generator': {
    en: ['report', 'summary', 'status', 'what did we do?', 'progress'],
    ko: ['보고서', '요약', '상태', '뭐 했어?', '진행 상황'],
    ja: ['報告書', '要約', '状態', '何をした?', '進捗'],
    zh: ['报告', '摘要', '状态', '做了什么?', '进度'],
    es: ['informe', 'resumen', 'estado', 'qué hicimos?', 'progreso'],
    fr: ['rapport', 'résumé', 'statut', "qu'avons-nous fait?", 'progrès'],
    de: ['Bericht', 'Zusammenfassung', 'Status', 'was haben wir?', 'Fortschritt'],
    it: ['rapporto', 'riepilogo', 'stato', 'cosa abbiamo fatto?', 'progresso']
  },
  'starter-guide': {
    en: ['help', 'beginner', 'first time', 'how to', 'explain'],
    ko: ['도움', '초보자', '처음', '어떻게', '설명해', '모르겠'],
    ja: ['助けて', '初心者', '初めて', 'どうやって', '説明して', 'わからない'],
    zh: ['帮助', '初学者', '第一次', '怎么', '解释', '不懂'],
    es: ['ayuda', 'principiante', 'primera vez', 'cómo', 'explicar', 'no entiendo'],
    fr: ['aide', 'débutant', 'première fois', 'comment', 'expliquer', 'je ne comprends pas'],
    de: ['Hilfe', 'Anfänger', 'erste Mal', 'wie', 'erklären', 'verstehe nicht'],
    it: ['aiuto', 'principiante', 'prima volta', 'come', 'spiegare', 'non capisco']
  }
};

/**
 * Skill trigger patterns for 8 languages
 */
const SKILL_TRIGGER_PATTERNS = {
  starter: {
    en: ['static site', 'simple website', 'landing page', 'portfolio'],
    ko: ['정적 사이트', '간단한 웹사이트', '랜딩 페이지', '포트폴리오'],
    ja: ['静的サイト', 'シンプルなウェブサイト', 'ランディングページ'],
    zh: ['静态网站', '简单网站', '着陆页', '作品集'],
    es: ['sitio estático', 'sitio web simple', 'página de destino'],
    fr: ['site statique', 'site web simple', 'page de destination'],
    de: ['statische Seite', 'einfache Website', 'Landingpage'],
    it: ['sito statico', 'sito web semplice', 'landing page']
  },
  dynamic: {
    en: ['login', 'fullstack', 'database', 'authentication', 'backend'],
    ko: ['로그인', '풀스택', '데이터베이스', '인증', '백엔드'],
    ja: ['ログイン', 'フルスタック', 'データベース', '認証', 'バックエンド'],
    zh: ['登录', '全栈', '数据库', '认证', '后端'],
    es: ['iniciar sesión', 'fullstack', 'base de datos', 'autenticación'],
    fr: ['connexion', 'fullstack', 'base de données', 'authentification'],
    de: ['Anmeldung', 'Fullstack', 'Datenbank', 'Authentifizierung'],
    it: ['accesso', 'fullstack', 'database', 'autenticazione']
  },
  enterprise: {
    en: ['microservices', 'kubernetes', 'k8s', 'terraform', 'architecture'],
    ko: ['마이크로서비스', '쿠버네티스', '테라폼', '아키텍처'],
    ja: ['マイクロサービス', 'クバネティス', 'テラフォーム', 'アーキテクチャ'],
    zh: ['微服务', 'kubernetes', 'terraform', '架构'],
    es: ['microservicios', 'kubernetes', 'terraform', 'arquitectura'],
    fr: ['microservices', 'kubernetes', 'terraform', 'architecture'],
    de: ['Microservices', 'Kubernetes', 'Terraform', 'Architektur'],
    it: ['microservizi', 'kubernetes', 'terraform', 'architettura']
  },
  'mobile-app': {
    en: ['mobile app', 'react native', 'flutter', 'ios', 'android'],
    ko: ['모바일 앱', '리액트 네이티브', '플러터', 'iOS', '안드로이드'],
    ja: ['モバイルアプリ', 'React Native', 'Flutter', 'iOS', 'Android'],
    zh: ['移动应用', 'React Native', 'Flutter', 'iOS', 'Android'],
    es: ['aplicación móvil', 'react native', 'flutter', 'ios', 'android'],
    fr: ['application mobile', 'react native', 'flutter', 'ios', 'android'],
    de: ['mobile App', 'React Native', 'Flutter', 'iOS', 'Android'],
    it: ['app mobile', 'react native', 'flutter', 'ios', 'android']
  }
};

/**
 * Detect language from text
 * @param {string} text
 * @returns {string}
 */
function detectLanguage(text) {
  if (!text) return 'en';

  // Korean detection
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';

  // Japanese detection (Hiragana, Katakana)
  if (/[\u3040-\u30FF]/.test(text)) return 'ja';

  // Chinese detection (CJK Unified Ideographs, not Korean/Japanese)
  if (/[\u4E00-\u9FFF]/.test(text) && !/[\uAC00-\uD7AF\u3040-\u30FF]/.test(text)) return 'zh';

  // Default to English
  return 'en';
}

/**
 * Get patterns for all languages combined
 * @param {Object} patternMap - Language pattern map
 * @returns {string[]}
 */
function getAllPatterns(patternMap) {
  const allPatterns = [];
  for (const lang of SUPPORTED_LANGUAGES) {
    if (patternMap[lang]) {
      allPatterns.push(...patternMap[lang]);
    }
  }
  return [...new Set(allPatterns)]; // Remove duplicates
}

/**
 * Match text against multi-language patterns
 * @param {string} text
 * @param {Object} patternMap
 * @returns {boolean}
 */
function matchMultiLangPattern(text, patternMap) {
  const lowerText = text.toLowerCase();

  for (const lang of SUPPORTED_LANGUAGES) {
    const patterns = patternMap[lang];
    if (!patterns) continue;

    for (const pattern of patterns) {
      if (lowerText.includes(pattern.toLowerCase())) {
        return true;
      }
    }
  }

  return false;
}

module.exports = {
  SUPPORTED_LANGUAGES,
  AGENT_TRIGGER_PATTERNS,
  SKILL_TRIGGER_PATTERNS,
  detectLanguage,
  getAllPatterns,
  matchMultiLangPattern,
};
