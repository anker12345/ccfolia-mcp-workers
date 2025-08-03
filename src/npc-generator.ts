/**
 * NPC生成専用モジュール
 */

export interface NPC {
  name: string;
  role: string;
  appearance: string;
  personality: string;
  motivation: string;
  secretOrHook: string;
  stats: NPCStats;
  relationships: string[];
  location: string;
  schedule: string;
}

export interface NPCStats {
  level: number;
  hp: number;
  threat: 'harmless' | 'low' | 'medium' | 'high' | 'boss';
  skills: string[];
}

// シナリオ別NPCテンプレート
const SCENARIO_TEMPLATES = {
  '学校の怪奇現象': {
    roles: ['教師', '生徒', '用務員', '校長', '保健室の先生', '図書館司書'],
    locations: ['教室', '図書館', '保健室', '校長室', '体育館', '理科室'],
    hooks: [
      '昔の生徒の霊を見たことがある',
      '学校の建設前の土地の歴史を知っている',
      '夜中に学校に残っていて奇妙なものを目撃した',
      '古い資料や新聞記事を持っている',
      '怪奇現象の目撃者である'
    ]
  },
  '村の失踪事件': {
    roles: ['村長', '農民', '商人', '猟師', '神主', '医者', '旅人'],
    locations: ['村役場', '農場', '商店', '神社', '診療所', '森の入口'],
    hooks: [
      '失踪者と最後に話した人物',
      '村の古い伝説や呪いについて知っている',
      '怪しい人物を目撃している',
      '失踪現場で不審なものを発見した',
      '村の秘密を隠している'
    ]
  },
  '古い屋敷の謎': {
    roles: ['管理人', '近隣住民', '不動産業者', '歴史研究家', '元使用人', '親族'],
    locations: ['屋敷の門前', '近隣の家', '不動産事務所', '図書館', '喫茶店'],
    hooks: [
      '屋敷の元住人について詳しい',
      '屋敷で起きた過去の事件を知っている',
      '屋敷に隠された財宝の噂を聞いている',
      '屋敷の建築的な秘密を知っている',
      '屋敷の鍵や古い文書を持っている'
    ]
  },
  '都市の地下組織': {
    roles: ['情報屋', '用心棒', '闇商人', '警察官', '記者', '一般市民', '組織の構成員'],
    locations: ['裏通り', '警察署', '新聞社', 'バー', '倉庫', '事務所'],
    hooks: [
      '組織の内部情報を持っている',
      '組織に追われている',
      '組織の弱点を知っている',
      '組織の取引を目撃した',
      '組織に恨みを持っている'
    ]
  },
  '遺跡探索': {
    roles: ['考古学者', '現地ガイド', '盗掘者', '研究助手', '地元の長老', '商人'],
    locations: ['遺跡入口', '調査キャンプ', '村', '博物館', '大学', '市場'],
    hooks: [
      '遺跡の古い地図を持っている',
      '遺跡の危険な仕掛けについて知っている',
      '遺跡の歴史的価値を理解している',
      '遺跡で発見された artifact を持っている',
      '遺跡の守り神の伝説を知っている'
    ]
  }
};

// 汎用的な役職
const GENERIC_ROLES = [
  '商人', '農民', '職人', '学者', '兵士', '聖職者', '芸術家', '医師',
  '教師', '料理人', '建築家', '船員', '鍛冶屋', '仕立屋', '薬師', '音楽家'
];

// 名前候補
const NPC_NAMES = {
  male: [
    '太郎', '次郎', '三郎', '健太', '達也', '雅人', '孝志', '慎一', '浩二',
    '正男', '和夫', '茂', '実', '豊', '勇', '清', '誠', '弘', '昭', '隆'
  ],
  female: [
    '花子', '美咲', '由美', '恵子', '明美', '里美', '真理', '麻衣', '裕子',
    '幸子', '直子', '和子', '洋子', '典子', '久美子', '紀子', '雅子', '千代子'
  ],
  neutral: [
    '田中', '佐藤', '山田', '木村', '伊藤', '渡辺', '高橋', '松本', '中村',
    '小林', '加藤', '吉田', '山本', '佐々木', '石川', '斎藤', '前田'
  ]
};

// 外見特徴
const APPEARANCE_TRAITS = [
  '眼鏡をかけた知的な印象',
  'がっしりとした体格',
  '小柄で機敏そう',
  '優雅で上品な佇まい',
  '日焼けした健康的な肌',
  '白髪混じりの落ち着いた様子',
  '若々しく活発な印象',
  '神経質そうな細い体型',
  '人懐っこい笑顔',
  '無表情で近寄りがたい雰囲気',
  '華やかで目立つ服装',
  '質素で実用的な身なり'
];

// 性格特性
const PERSONALITY_TRAITS = [
  '親切で話しやすい',
  '警戒心が強く慎重',
  '好奇心旺盛で質問が多い',
  '頑固で自分の意見を曲げない',
  '神経質で細かいことを気にする',
  '大らかで細かいことは気にしない',
  '秘密主義で多くを語らない',
  '陽気でよく笑う',
  '真面目で責任感が強い',
  'いい加減で適当な性格',
  '知識欲が強く学者肌',
  '商売上手で抜け目がない'
];

// スケジュール/行動パターン
const DAILY_SCHEDULES = [
  '朝早くから夕方まで働いている',
  '昼間は外出していることが多い',
  '夜遅くまで作業をしている',
  '決まった時間に決まった場所にいる',
  '不規則な生活をしている',
  '朝の散歩が日課になっている',
  '夕方になると酒場にいる',
  '人通りの多い時間帯を避ける'
];

// 関係性テンプレート
const RELATIONSHIP_TEMPLATES = [
  '主要人物の親族',
  '主要人物の友人',
  '主要人物の同僚',
  '主要人物のライバル',
  '主要人物の元恋人',
  '主要人物の師匠',
  '主要人物の弟子',
  '主要人物の恩人',
  '主要人物の債権者',
  'その他のNPCの家族'
];

// ランダム選択ヘルパー
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// 複数からランダム選択
function randomChoices<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

// 名前生成
function generateNPCName(): string {
  const useFullName = Math.random() > 0.3;
  
  if (useFullName) {
    const lastName = randomChoice(NPC_NAMES.neutral);
    const firstName = Math.random() > 0.5 
      ? randomChoice(NPC_NAMES.male)
      : randomChoice(NPC_NAMES.female);
    return `${lastName} ${firstName}`;
  } else {
    return Math.random() > 0.5
      ? randomChoice(NPC_NAMES.male)
      : randomChoice(NPC_NAMES.female);
  }
}

// 脅威レベル決定
function determineThreatLevel(role: string, scenario: string): NPCStats['threat'] {
  // 特定の役職は脅威度が高い
  const highThreatRoles = ['用心棒', '組織の構成員', '盗掘者', '兵士'];
  const mediumThreatRoles = ['猟師', '警察官', '管理人'];
  const lowThreatRoles = ['情報屋', '商人', '記者'];
  
  if (highThreatRoles.includes(role)) {
    return Math.random() > 0.7 ? 'high' : 'medium';
  } else if (mediumThreatRoles.includes(role)) {
    return Math.random() > 0.5 ? 'medium' : 'low';
  } else if (lowThreatRoles.includes(role)) {
    return 'low';
  }
  
  // デフォルトは harmless
  return 'harmless';
}

// 役職に基づくスキル生成
function generateSkillsForRole(role: string): string[] {
  const roleSkills: { [key: string]: string[] } = {
    '教師': ['教育', '学問', '説得'],
    '医師': ['医学', '治療', '分析'],
    '商人': ['商業', '説得', '計算'],
    '警察官': ['格闘', '観察', '法律'],
    '情報屋': ['聞き込み', '隠密', '街の知識'],
    '学者': ['学問', '研究', '古代語'],
    '猟師': ['射撃', '追跡', '自然知識'],
    '農民': ['農業', '天候予測', '動物の世話'],
    '用心棒': ['格闘', '威圧', '警備'],
    '神主': ['宗教', '儀式', '霊的知識']
  };
  
  const baseSkills = roleSkills[role] || ['一般知識'];
  const additionalSkills = ['運動', '芸術', '料理', '手先の器用さ', '社交'];
  
  return [
    ...baseSkills,
    ...randomChoices(additionalSkills, 1 + Math.floor(Math.random() * 2))
  ];
}

// 単一NPC生成
export function generateSingleNPC(
  scenario?: string, 
  role?: string, 
  threatLevel?: NPCStats['threat']
): NPC {
  // シナリオ特定の設定取得
  const scenarioData = scenario ? SCENARIO_TEMPLATES[scenario as keyof typeof SCENARIO_TEMPLATES] : null;
  
  // 役職決定
  const finalRole = role || (scenarioData 
    ? randomChoice(scenarioData.roles)
    : randomChoice(GENERIC_ROLES));
  
  // 基本情報生成
  const name = generateNPCName();
  const appearance = randomChoice(APPEARANCE_TRAITS);
  const personality = randomChoice(PERSONALITY_TRAITS);
  const schedule = randomChoice(DAILY_SCHEDULES);
  
  // 場所決定
  const location = scenarioData 
    ? randomChoice(scenarioData.locations)
    : '街の中心部';
  
  // フック/秘密決定
  const secretOrHook = scenarioData
    ? randomChoice(scenarioData.hooks)
    : '何かしらの秘密や情報を持っている';
  
  // 動機生成
  const motivations = [
    '家族を養うため',
    '過去の過ちを償うため',
    '真実を明らかにしたい',
    '平穏な生活を望んでいる',
    '権力や地位を得たい',
    '復讐を果たしたい',
    '知識や情報を求めている',
    '大切な人を守りたい',
    '生き残るため',
    '正義を実現したい'
  ];
  const motivation = randomChoice(motivations);
  
  // 関係性生成
  const relationships = randomChoices(RELATIONSHIP_TEMPLATES, 1 + Math.floor(Math.random() * 2));
  
  // ステータス生成
  const finalThreatLevel = threatLevel || determineThreatLevel(finalRole, scenario || '');
  const level = {
    'harmless': 1,
    'low': 1 + Math.floor(Math.random() * 2),
    'medium': 2 + Math.floor(Math.random() * 3),
    'high': 4 + Math.floor(Math.random() * 3),
    'boss': 7 + Math.floor(Math.random() * 4)
  }[finalThreatLevel];
  
  const hp = {
    'harmless': 10 + Math.floor(Math.random() * 10),
    'low': 20 + Math.floor(Math.random() * 20),
    'medium': 40 + Math.floor(Math.random() * 30),
    'high': 70 + Math.floor(Math.random() * 40),
    'boss': 100 + Math.floor(Math.random() * 50)
  }[finalThreatLevel];
  
  const skills = generateSkillsForRole(finalRole);
  
  const stats: NPCStats = {
    level,
    hp,
    threat: finalThreatLevel,
    skills
  };
  
  return {
    name,
    role: finalRole,
    appearance,
    personality,
    motivation,
    secretOrHook,
    stats,
    relationships,
    location,
    schedule
  };
}

// NPC一括生成
export function generateNPCBatch(
  scenario: string, 
  count: number = 3, 
  difficulty: string = 'normal'
): NPC[] {
  const npcs: NPC[] = [];
  const scenarioData = SCENARIO_TEMPLATES[scenario as keyof typeof SCENARIO_TEMPLATES];
  
  if (!scenarioData) {
    // 汎用シナリオ用のNPC生成
    for (let i = 0; i < count; i++) {
      npcs.push(generateSingleNPC());
    }
    return npcs;
  }
  
  // 脅威レベルの分布を決定
  const threatDistribution = {
    'easy': { harmless: 0.7, low: 0.3, medium: 0, high: 0, boss: 0 },
    'normal': { harmless: 0.4, low: 0.4, medium: 0.2, high: 0, boss: 0 },
    'hard': { harmless: 0.2, low: 0.3, medium: 0.3, high: 0.2, boss: 0 },
    'extreme': { harmless: 0.1, low: 0.2, medium: 0.3, high: 0.3, boss: 0.1 }
  };
  
  const distribution = threatDistribution[difficulty as keyof typeof threatDistribution] || threatDistribution.normal;
  
  // 役職の重複を避ける
  const usedRoles = new Set<string>();
  const availableRoles = [...scenarioData.roles];
  
  for (let i = 0; i < count; i++) {
    // 脅威レベル決定
    const rand = Math.random();
    let cumulativeProb = 0;
    let selectedThreat: NPCStats['threat'] = 'harmless';
    
    for (const [threat, prob] of Object.entries(distribution)) {
      cumulativeProb += prob;
      if (rand <= cumulativeProb) {
        selectedThreat = threat as NPCStats['threat'];
        break;
      }
    }
    
    // 役職選択（重複避ける）
    let selectedRole: string;
    if (usedRoles.size < availableRoles.length) {
      do {
        selectedRole = randomChoice(availableRoles);
      } while (usedRoles.has(selectedRole));
      usedRoles.add(selectedRole);
    } else {
      selectedRole = randomChoice(availableRoles);
    }
    
    npcs.push(generateSingleNPC(scenario, selectedRole, selectedThreat));
  }
  
  return npcs;
}

// NPC関係性ネットワーク生成
export function generateNPCNetwork(npcs: NPC[]): { [key: string]: string[] } {
  const network: { [key: string]: string[] } = {};
  
  npcs.forEach(npc => {
    network[npc.name] = [];
  });
  
  // ランダムに関係性を生成
  for (let i = 0; i < npcs.length; i++) {
    for (let j = i + 1; j < npcs.length; j++) {
      if (Math.random() > 0.7) { // 30%の確率で関係性あり
        const relationshipTypes = [
          '友人関係', '商売相手', '情報源', 'ライバル関係', 
          '家族関係', '師弟関係', '協力者', '敵対関係'
        ];
        const relationship = randomChoice(relationshipTypes);
        
        network[npcs[i].name].push(`${npcs[j].name}とは${relationship}`);
        network[npcs[j].name].push(`${npcs[i].name}とは${relationship}`);
      }
    }
  }
  
  return network;
}

// NPCシート形式で出力
export function formatNPCSheet(npc: NPC): string {
  return `
【NPCシート】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
名前: ${npc.name}
役職: ${npc.role}
居場所: ${npc.location}

【外見・人物像】
外見: ${npc.appearance}
性格: ${npc.personality}
行動パターン: ${npc.schedule}

【背景・動機】
動機: ${npc.motivation}
秘密/フック: ${npc.secretOrHook}

【ゲーム情報】
レベル: ${npc.stats.level}
HP: ${npc.stats.hp}
脅威度: ${npc.stats.threat}
技能: ${npc.stats.skills.join(', ')}

【関係性】
${npc.relationships.join(', ')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();
}

// シナリオ用NPC一覧形式で出力
export function formatNPCBatchSheet(npcs: NPC[], scenario: string): string {
  const sheets = npcs.map(npc => formatNPCSheet(npc)).join('\n\n');
  const network = generateNPCNetwork(npcs);
  
  let networkInfo = '\n【NPC関係図】\n';
  Object.entries(network).forEach(([name, relationships]) => {
    if (relationships.length > 0) {
      networkInfo += `${name}: ${relationships.join(', ')}\n`;
    }
  });
  
  return `
【${scenario} - NPCバッチ】
═══════════════════════════════════════════════════════════════════════

${sheets}

${networkInfo}
═══════════════════════════════════════════════════════════════════════
  `.trim();
}

// シナリオ対応チェック
export function isScenarioSupported(scenario: string): boolean {
  return scenario in SCENARIO_TEMPLATES;
}

// サポートされているシナリオ一覧
export function getSupportedScenarios(): string[] {
  return Object.keys(SCENARIO_TEMPLATES);
}
