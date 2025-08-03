/**
 * キャラクター生成専用モジュール
 */

export interface Character {
  name: string;
  age: number;
  profession: string;
  background: string;
  stats: CharacterStats;
  skills: string[];
  items: string[];
  personality: string;
  appearance: string;
  motivation: string;
}

export interface CharacterStats {
  HP: number;
  MP: number;
  STR: number;
  DEX: number;
  INT: number;
  WIS: number;
  CHA: number;
  CON: number;
}

// 職業テンプレート
const PROFESSION_TEMPLATES = {
  '戦士': {
    statModifiers: { STR: +3, CON: +2, DEX: +1 },
    commonSkills: ['剣術', '盾術', '戦術'],
    commonItems: ['鉄の剣', '鋼の鎧', '盾']
  },
  '魔法使い': {
    statModifiers: { INT: +3, WIS: +2, MP: +10 },
    commonSkills: ['魔法学', '古代語', '錬金術'],
    commonItems: ['魔法の杖', 'ローブ', '魔法書']
  },
  '盗賊': {
    statModifiers: { DEX: +3, CHA: +1, INT: +1 },
    commonSkills: ['隠密', '鍵開け', '手先の器用さ'],
    commonItems: ['短剣', '革の鎧', '盗賊道具']
  },
  '僧侶': {
    statModifiers: { WIS: +3, CHA: +2, MP: +5 },
    commonSkills: ['治療', '宗教学', '説得'],
    commonItems: ['聖印', '白いローブ', '治療薬']
  },
  '探偵': {
    statModifiers: { INT: +2, WIS: +2, CHA: +1 },
    commonSkills: ['観察', '推理', '聞き込み'],
    commonItems: ['虫眼鏡', 'メモ帳', 'ペン']
  },
  '商人': {
    statModifiers: { CHA: +3, INT: +1, WIS: +1 },
    commonSkills: ['商業', '説得', '算術'],
    commonItems: ['帳簿', '天秤', '硬貨袋']
  },
  '学者': {
    statModifiers: { INT: +3, WIS: +2 },
    commonSkills: ['学問', '古代語', '図書館学'],
    commonItems: ['書物', 'インク', '羊皮紙']
  },
  '芸術家': {
    statModifiers: { CHA: +2, DEX: +2, INT: +1 },
    commonSkills: ['芸術', '音楽', '創作'],
    commonItems: ['楽器', '絵筆', 'キャンバス']
  }
};

// 背景テンプレート
const BACKGROUND_TEMPLATES = [
  '貴族の出身だが家を離れて冒険に出た',
  '農村で育ち、素朴で純真な心を持つ',
  '都市のスラムで生まれ、たくましく育った',
  '商人の家系で、交渉術に長けている',
  '学者の家庭で知識を重視して育てられた',
  '軍人の子として規律正しく育った',
  '芸術家の家系で創造性豊かに育った',
  '孤児として苦労しながらも強く生きてきた',
  '宗教的な家庭で道徳的な価値観を身につけた',
  '旅人の家族と共に各地を転々として育った'
];

// 性格特性
const PERSONALITY_TRAITS = [
  '勇敢で正義感が強い',
  '慎重で思慮深い',
  '好奇心旺盛で冒険好き',
  '優しく思いやりがある',
  '頭脳明晰で理論的',
  '陽気で社交的',
  '謎めいていて神秘的',
  '実用的で現実主義',
  '情熱的で行動力がある',
  '冷静沈着で判断力がある',
  '創造的で独創性がある',
  '献身的で忠実である'
];

// 外見特徴
const APPEARANCE_FEATURES = [
  '平均的な身長で均整の取れた体格',
  '背が高くスラリとした体型',
  '小柄だが筋肉質でがっしりした体格',
  '優雅で上品な佇まい',
  '野性的で力強い印象',
  '知的で落ち着いた雰囲気',
  '明るく親しみやすい表情',
  '神秘的で近寄りがたいオーラ',
  '質素だが清潔感のある外見',
  '華やかで目を引く容姿'
];

// 動機テンプレート
const MOTIVATION_TEMPLATES = [
  '失踪した家族を探している',
  '古い呪いを解くための手がかりを求めている',
  '師の仇を討つため修行を続けている',
  '世界を救う伝説の artifact を探している',
  '自分の過去の記憶を取り戻そうとしている',
  '故郷を脅かす災いを止めようとしている',
  '禁断の知識を求めて研究を続けている',
  '愛する人を救うため力を求めている',
  '正義を実現するため悪と戦っている',
  '新しい土地での生活を夢見ている'
];

// 基本ステータス生成（3d6方式）
function rollStats(): CharacterStats {
  const roll3d6 = () => {
    let total = 0;
    for (let i = 0; i < 3; i++) {
      total += Math.floor(Math.random() * 6) + 1;
    }
    return total;
  };

  const stats = {
    STR: roll3d6(),
    DEX: roll3d6(),
    INT: roll3d6(),
    WIS: roll3d6(),
    CHA: roll3d6(),
    CON: roll3d6(),
    HP: 0,
    MP: 0
  };

  // HP = CON * 3 + レベル修正
  stats.HP = stats.CON * 3 + 20;
  // MP = INT + WIS
  stats.MP = Math.floor((stats.INT + stats.WIS) / 2) + 10;

  return stats;
}

// 職業修正適用
function applyProfessionModifiers(stats: CharacterStats, profession: string): CharacterStats {
  const template = PROFESSION_TEMPLATES[profession as keyof typeof PROFESSION_TEMPLATES];
  if (!template) return stats;

  const modifiedStats = { ...stats };
  
  Object.entries(template.statModifiers).forEach(([stat, modifier]) => {
    if (stat === 'MP') {
      modifiedStats.MP += modifier;
    } else if (stat in modifiedStats) {
      (modifiedStats as any)[stat] += modifier;
    }
  });

  // HP/MP再計算
  modifiedStats.HP = modifiedStats.CON * 3 + 20;
  modifiedStats.MP = Math.floor((modifiedStats.INT + modifiedStats.WIS) / 2) + 10;
  
  // 職業ボーナス適用
  if (template.statModifiers.MP) {
    modifiedStats.MP += template.statModifiers.MP;
  }

  return modifiedStats;
}

// スキル生成
function generateSkills(profession: string, background: string): string[] {
  const template = PROFESSION_TEMPLATES[profession as keyof typeof PROFESSION_TEMPLATES];
  const skills = new Set<string>();

  // 職業スキル
  if (template) {
    template.commonSkills.forEach(skill => skills.add(skill));
  }

  // 追加スキル（背景や個性に基づく）
  const additionalSkills = [
    '運動', '芸術', '動物使い', '工芸', '学問', '医学', '自然知識',
    '街の知識', '地下社会', '貴族社会', '軍事知識', '歴史'
  ];

  // ランダムで2-3個追加
  const shuffled = additionalSkills.sort(() => 0.5 - Math.random());
  for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
    if (shuffled[i]) {
      skills.add(shuffled[i]);
    }
  }

  return Array.from(skills);
}

// アイテム生成
function generateItems(profession: string, background: string): string[] {
  const template = PROFESSION_TEMPLATES[profession as keyof typeof PROFESSION_TEMPLATES];
  const items = new Set<string>();

  // 職業アイテム
  if (template) {
    template.commonItems.forEach(item => items.add(item));
  }

  // 基本アイテム
  const basicItems = ['食料', '水袋', 'ロープ', '松明', '寝袋'];
  basicItems.forEach(item => {
    if (Math.random() > 0.5) {
      items.add(item);
    }
  });

  // 特殊アイテム（低確率）
  const specialItems = [
    '謎の鍵', '古い地図', '家族の写真', '手紙', '宝石',
    '古い硬貨', '魔法のアミュレット', '祖父の形見'
  ];
  
  if (Math.random() > 0.7) {
    const special = specialItems[Math.floor(Math.random() * specialItems.length)];
    items.add(special);
  }

  return Array.from(items);
}

// ランダム選択ヘルパー
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// メインキャラクター生成関数
export function generateDetailedCharacter(
  name: string, 
  age?: number, 
  profession?: string, 
  background?: string
): Character {
  // デフォルト値設定
  const finalAge = age || (18 + Math.floor(Math.random() * 32)); // 18-50歳
  const finalProfession = profession || randomChoice(Object.keys(PROFESSION_TEMPLATES));
  const finalBackground = background || randomChoice(BACKGROUND_TEMPLATES);

  // ステータス生成
  const baseStats = rollStats();
  const finalStats = applyProfessionModifiers(baseStats, finalProfession);

  // その他要素生成
  const skills = generateSkills(finalProfession, finalBackground);
  const items = generateItems(finalProfession, finalBackground);
  const personality = randomChoice(PERSONALITY_TRAITS);
  const appearance = randomChoice(APPEARANCE_FEATURES);
  const motivation = randomChoice(MOTIVATION_TEMPLATES);

  return {
    name,
    age: finalAge,
    profession: finalProfession,
    background: finalBackground,
    stats: finalStats,
    skills,
    items,
    personality,
    appearance,
    motivation
  };
}

// 複数キャラクター生成
export function generateCharacterParty(size: number = 4): Character[] {
  const names = [
    '太郎', '花子', '次郎', '美咲', '健太', '由美', '達也', '麻衣',
    '雅人', '恵子', '孝志', '明美', '慎一', '里美', '浩二', '真理'
  ];
  
  const party: Character[] = [];
  const usedNames = new Set<string>();
  const usedProfessions = new Set<string>();
  
  for (let i = 0; i < size; i++) {
    // 名前の重複を避ける
    let name: string;
    do {
      name = randomChoice(names);
    } while (usedNames.has(name) && usedNames.size < names.length);
    usedNames.add(name);
    
    // 職業の重複をなるべく避ける
    let profession: string | undefined;
    const availableProfessions = Object.keys(PROFESSION_TEMPLATES)
      .filter(p => !usedProfessions.has(p));
    
    if (availableProfessions.length > 0) {
      profession = randomChoice(availableProfessions);
      usedProfessions.add(profession);
    }
    
    party.push(generateDetailedCharacter(name, undefined, profession));
  }
  
  return party;
}

// キャラクターシート形式で出力
export function formatCharacterSheet(character: Character): string {
  return `
【キャラクターシート】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
名前: ${character.name}
年齢: ${character.age}歳
職業: ${character.profession}
背景: ${character.background}

【能力値】
STR: ${character.stats.STR}  DEX: ${character.stats.DEX}  CON: ${character.stats.CON}
INT: ${character.stats.INT}  WIS: ${character.stats.WIS}  CHA: ${character.stats.CHA}
HP: ${character.stats.HP}   MP: ${character.stats.MP}

【技能】
${character.skills.join(', ')}

【所持品】
${character.items.join(', ')}

【人物像】
外見: ${character.appearance}
性格: ${character.personality}
動機: ${character.motivation}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();
}
