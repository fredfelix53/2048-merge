/* ===== 2048 Merge — Progression System ===== */
(function() {
  'use strict';

  const SAVE_KEY = 'm2048_progress';

  const UPGRADE_TIERS = {
    weapon: {
      name: 'Tile (Weapon)',
      icon: '🔢',
      maxLevel: 5,
      baseCost: 1000,
      costMultiplier: 2,
      gemCost: 50,
      levels: [
        { level: 0, name: 'Wooden Tiles',     bonus: { mergeBonus: 0, startNumber: 2 },     gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Stone Tiles',      bonus: { mergeBonus: 2, startNumber: 2 },     gemReq: 50,  coinsReq: 1000 },
        { level: 2, name: 'Iron Tiles',       bonus: { mergeBonus: 5, startNumber: 2 },     gemReq: 80,  coinsReq: 2000 },
        { level: 3, name: 'Steel Tiles',      bonus: { mergeBonus: 10, startNumber: 2 },    gemReq: 120, coinsReq: 4000 },
        { level: 4, name: 'Neon Tiles',       bonus: { mergeBonus: 20, startNumber: 4 },    gemReq: 200, coinsReq: 8000 },
        { level: 5, name: '⚡ Void Tiles',    bonus: { mergeBonus: 50, startNumber: 4 },    gemReq: 500, coinsReq: 20000 },
      ]
    },
    case: {
      name: 'Board (Case)',
      icon: '📦',
      maxLevel: 5,
      baseCost: 800,
      costMultiplier: 2,
      gemCost: 50,
      levels: [
        { level: 0, name: '4x4 Grid',         bonus: { extraSpace: 0, undoCount: 0 },       gemReq: 0,   coinsReq: 0 },
        { level: 1, name: '5x5 Grid',         bonus: { extraSpace: 1, undoCount: 1 },       gemReq: 40,  coinsReq: 800 },
        { level: 2, name: '6x6 Grid',         bonus: { extraSpace: 2, undoCount: 2 },       gemReq: 70,  coinsReq: 1600 },
        { level: 3, name: '7x7 Grid',         bonus: { extraSpace: 3, undoCount: 3 },       gemReq: 100, coinsReq: 3200 },
        { level: 4, name: '8x8 Grid',         bonus: { extraSpace: 4, undoCount: 4 },       gemReq: 180, coinsReq: 6400 },
        { level: 5, name: '💎 Infinity Grid', bonus: { extraSpace: 5, undoCount: 5 },       gemReq: 400, coinsReq: 16000 },
      ]
    },
    outfit: {
      name: 'Style (Outfit)',
      icon: '🎨',
      maxLevel: 5,
      baseCost: 600,
      costMultiplier: 2,
      gemCost: 40,
      levels: [
        { level: 0, name: 'Plain Style',      bonus: { pointsMult: 1.0, comboBonus: 0 },    gemReq: 0,   coinsReq: 0 },
        { level: 1, name: 'Neon Style',       bonus: { pointsMult: 1.1, comboBonus: 5 },    gemReq: 30,  coinsReq: 600 },
        { level: 2, name: 'Retro Style',      bonus: { pointsMult: 1.2, comboBonus: 10 },   gemReq: 60,  coinsReq: 1200 },
        { level: 3, name: 'Glass Style',      bonus: { pointsMult: 1.35, comboBonus: 15 },  gemReq: 90,  coinsReq: 2400 },
        { level: 4, name: 'Gold Style',       bonus: { pointsMult: 1.5, comboBonus: 25 },   gemReq: 150, coinsReq: 4800 },
        { level: 5, name: '🔥 Phoenix Style', bonus: { pointsMult: 2.0, comboBonus: 40 },   gemReq: 350, coinsReq: 12000 },
      ]
    }
  };

  const PREMIUM_ITEMS = {
    legendarySkins: [
      { id: 'lg_void',       name: 'Void Tiles',     desc: 'Dark matter tile skin',         price: 4.99,  gemPrice: 0, type: 'legendary', tier: 'legendary' },
      { id: 'lg_cosmic',     name: 'Cosmic Tiles',   desc: 'Galaxy-themed tiles',            price: 6.99,  gemPrice: 0, type: 'legendary', tier: 'legendary' },
      { id: 'lg_flame',      name: 'Inferno Tiles',  desc: 'Living flame tiles',             price: 8.99,  gemPrice: 0, type: 'legendary', tier: 'legendary' },
    ],
    premiumCases: [
      { id: 'pc_royal',      name: 'Royal Pass',     desc: '7 days: 2x points + 50 gems/day', price: 4.99,  gemPrice: 0, type: 'subscription', duration: '7d' },
      { id: 'pc_vip',        name: 'VIP Status',     desc: '30 days: 3x points + 100 gems/day', price: 12.99, gemPrice: 0, type: 'subscription', duration: '30d' },
    ],
    bundles: [
      { id: 'bundle_starter',  name: 'Starter Bundle',   desc: '200 gems + 5000 score boost',               price: 2.99,  gemPrice: 0, type: 'one_time' },
      { id: 'bundle_mega',     name: 'Mega Power Pack',  desc: '500 gems + 20000 score + neon theme',       price: 7.99,  gemPrice: 0, type: 'one_time' },
      { id: 'bundle_ultimate', name: 'Ultimate Bundle',  desc: '2000 gems + all themes + legendary skin',  price: 19.99, gemPrice: 0, type: 'one_time' },
    ],
    removeAds: { id: 'remove_ads', name: 'Remove Ads', desc: 'Permanently remove all ads', price: 2.99, gemPrice: 0, type: 'one_time' },
  };

  const GEM_PACKS = [
    { id: 'gems_small',  name: 'Small Gem Pack',    gems: 100,  price: 0.99,  bonus: 0,    popular: false },
    { id: 'gems_medium', name: 'Standard Gem Pack', gems: 500,  price: 3.99,  bonus: 50,   popular: true  },
    { id: 'gems_large',  name: 'Large Gem Pack',    gems: 1200, price: 7.99,  bonus: 200,  popular: false },
    { id: 'gems_mega',   name: 'Mega Gem Pack',     gems: 4000, price: 19.99, bonus: 1000, popular: false },
    { id: 'gems_ultra',  name: '🐳 Whale Pack',     gems: 10000,price: 39.99, bonus: 5000, popular: false },
  ];

  const CATALOG = {
    themes: [
      { id: 'default',   name: 'Classic Dark', price: 0,    desc: 'Original dark theme',          colors: { bg: '#0f1020', accent: '#1a1a2e' } },
      { id: 'ocean',     name: 'Ocean Blue',   price: 500,  desc: 'Calming ocean blues',          colors: { bg: '#023047', accent: '#0a4a6e' } },
      { id: 'sunset',    name: 'Sunset Glow',  price: 800,  desc: 'Warm sunset orange & pink',    colors: { bg: '#2d1b3d', accent: '#4a1a3a' } },
      { id: 'neon',      name: 'Neon Nights',  price: 1500, desc: 'Bright neon on dark purple',   colors: { bg: '#1a0030', accent: '#2a0050' } },
    ],
    tileStyles: [
      { id: 'classic',    name: 'Classic Tiles', price: 0,    desc: 'Original tile style',      rounded: 4, glow: false },
      { id: 'rounded',    name: 'Rounded Gems',  price: 600,  desc: 'Smooth rounded tiles',     rounded: 8, glow: false },
      { id: 'glow',       name: 'Glow Effect',   price: 1200, desc: 'Tiles with subtle glow',  rounded: 4, glow: true },
      { id: 'glass',      name: 'Glass Panels',  price: 2000, desc: 'Semi-transparent glass',   rounded: 6, glow: true },
    ],
    boosters: [
      { id: 'score_x2',   name: 'Score Booster',   price: 500,  desc: '2x score for next game',   effect: 'scoreMultiplier:2' },
      { id: 'extra_undo', name: 'Extra Undo',      price: 400,  desc: 'Start with +3 undos',      effect: 'bonusUndo:3' },
    ],
  };

  const ACHIEVEMENTS = [
    { id: 'first_merge',  name: 'First Merge',      desc: 'Make your first merge',             reward: { coins: 50,  gems: 0 },  icon: '🎮', check: p => p.totalMerges >= 1 },
    { id: 'score_100',    name: 'Century',           desc: 'Score 100 in one game',            reward: { coins: 100, gems: 0 },  icon: '💯', check: p => p.bestScore >= 100 },
    { id: 'score_500',    name: 'High Roller',       desc: 'Score 500 in one game',            reward: { coins: 250, gems: 0 },  icon: '🎯', check: p => p.bestScore >= 500 },
    { id: 'score_2048',   name: '2048 Master',       desc: 'Reach 2048 tile',                  reward: { coins: 1000, gems: 20 },icon: '🏆', check: p => p.bestTile >= 2048 },
    { id: 'score_4096',   name: '4096 Legend',       desc: 'Reach 4096 tile',                  reward: { coins: 3000, gems: 50 },icon: '👑', check: p => p.bestTile >= 4096 },
    { id: 'score_8192',   name: 'God-like',          desc: 'Reach 8192 tile',                  reward: { coins: 10000, gems: 200 },icon: '🌟', check: p => p.bestTile >= 8192 },
    { id: 'merge_50',     name: 'Merge Master',      desc: 'Make 50 total merges',             reward: { coins: 200, gems: 0 },  icon: '🔄', check: p => p.totalMerges >= 50 },
    { id: 'merge_200',    name: 'Merge Machine',     desc: 'Make 200 total merges',            reward: { coins: 500, gems: 10 }, icon: '⚡', check: p => p.totalMerges >= 200 },
    { id: 'merge_1000',   name: 'Merge Legend',      desc: 'Make 1000 total merges',           reward: { coins: 2000, gems: 30 },icon: '🔥', check: p => p.totalMerges >= 1000 },
    { id: 'weapon_1',     name: 'Tile Up',           desc: 'Upgrade Tile to level 1',          reward: { coins: 200, gems: 0 },  icon: '🔢', check: p => (p.upgrades?.weapon || 0) >= 1 },
    { id: 'weapon_5',     name: 'Tile Master',       desc: 'Reach max Tile level',             reward: { coins: 2000, gems: 50 },icon: '🗡️', check: p => (p.upgrades?.weapon || 0) >= 5 },
    { id: 'case_1',       name: 'Board Up',          desc: 'Upgrade Board to level 1',         reward: { coins: 200, gems: 0 },  icon: '📦', check: p => (p.upgrades?.case || 0) >= 1 },
    { id: 'case_5',       name: 'Board Master',      desc: 'Reach max Board level',            reward: { coins: 2000, gems: 50 },icon: '💎', check: p => (p.upgrades?.case || 0) >= 5 },
    { id: 'outfit_1',     name: 'Stylish',           desc: 'Upgrade Style to level 1',         reward: { coins: 200, gems: 0 },  icon: '🎨', check: p => (p.upgrades?.outfit || 0) >= 1 },
    { id: 'outfit_5',     name: 'Style Icon',        desc: 'Reach max Style level',            reward: { coins: 2000, gems: 50 },icon: '👘', check: p => (p.upgrades?.outfit || 0) >= 5 },
    { id: 'gems_100',     name: 'Gem Collector',     desc: 'Earn 100 total gems',              reward: { coins: 500, gems: 20 }, icon: '💎', check: p => p.totalGems >= 100 },
  ];

  function defaultState() {
    return {
      coins: 100, gems: 0, totalGems: 0, xp: 0, level: 1,
      bestScore: 0, bestTile: 0, totalMerges: 0, totalPlays: 0,
      upgrades: { weapon: 0, case: 0, outfit: 0 },
      ownedThemes: ['default'], ownedTileStyles: ['classic'],
      activeTheme: 'default', activeTileStyle: 'classic',
      activeBoosters: {}, inventory: {}, achievements: {},
      lastSaveDate: null, adFree: false, subscriptions: {},
    };
  }

  let state = null;

  function save() { state.lastSaveDate = new Date().toISOString(); try {localStorage.setItem(SAVE_KEY, JSON.stringify(state));}catch(e){} }
  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) { state = {...defaultState(), ...JSON.parse(raw)}; if(!state.upgrades) state.upgrades={weapon:0,case:0,outfit:0}; if(!state.gems&&state.gems!==0)state.gems=0; if(!state.totalGems)state.totalGems=0; save();return true;}
    }catch(e){}
    reset(); return false;
  }
  function reset() { state = defaultState(); save(); }
  function xpForLevel(lvl) { return Math.floor(100 * Math.pow(1.2, lvl-1)); }
  function addXp(amount) { if(!state)return false; state.xp+=amount; let lvl=false; while(state.xp>=xpForLevel(state.level)){state.xp-=xpForLevel(state.level);state.level++;lvl=true;} save(); return lvl; }
  function addCoins(a) { if(!state)return 0; state.coins+=a; save(); return state.coins; }
  function spendCoins(a) { if(!state||state.coins<a)return false; state.coins-=a; save(); return true; }
  function addGems(a) { if(!state)return 0; state.gems+=a; state.totalGems+=a; save(); return state.gems; }
  function spendGems(a) { if(!state||state.gems<a)return false; state.gems-=a; save(); return true; }
  function getUpgradeCost(cat, cur) { const t=UPGRADE_TIERS[cat]; if(!t)return null; const n=t.levels.find(l=>l.level===cur+1); return n?{coins:n.coinsReq,gems:n.gemReq}:null; }
  function upgradeItem(cat,useGems) {
    if(!state)return{success:false,reason:'no_state'}; const t=UPGRADE_TIERS[cat]; if(!t)return{success:false,reason:'invalid'};
    const cur=state.upgrades[cat]||0; if(cur>=t.maxLevel)return{success:false,reason:'max'};
    const c=getUpgradeCost(cat,cur); if(!c)return{success:false,reason:'no_data'};
    if(useGems){if(state.gems<c.gems)return{success:false,reason:'not_enough_gems'};spendGems(c.gems);}else{if(state.coins<c.coins)return{success:false,reason:'not_enough_coins'};spendCoins(c.coins);}
    state.upgrades[cat]++; save(); return{success:true,newLevel:state.upgrades[cat]};
  }
  function getActiveBonuses() {
    if(!state)return{mergeBonus:0,startNumber:2,extraSpace:0,undoCount:0,pointsMult:1,comboBonus:0};
    const b={mergeBonus:0,startNumber:2,extraSpace:0,undoCount:0,pointsMult:1,comboBonus:0};
    const w=state.upgrades.weapon||0; const wd=UPGRADE_TIERS.weapon.levels[w]; if(wd){b.mergeBonus=wd.bonus.mergeBonus;b.startNumber=wd.bonus.startNumber;}
    const c=state.upgrades.case||0; const cd=UPGRADE_TIERS.case.levels[c]; if(cd){b.extraSpace=cd.bonus.extraSpace;b.undoCount=cd.bonus.undoCount;}
    const o=state.upgrades.outfit||0; const od=UPGRADE_TIERS.outfit.levels[o]; if(od){b.pointsMult=od.bonus.pointsMult;b.comboBonus=od.bonus.comboBonus;}
    return b;
  }
  function ownsPremiumItem(id) { return state&&state.inventory&&state.inventory[id]===true; }
  function purchasePremiumItem(id) { if(!state)return false; state.inventory[id]=true; if(id==='remove_ads'){state.adFree=true;if(typeof AdsManager!=='undefined'&&AdsManager.onAdsRemoved)AdsManager.onAdsRemoved();} const bg={bundle_starter:200,bundle_mega:500,bundle_ultimate:2000}; if(bg[id])addGems(bg[id]); save(); return true; }
  function checkAchievements() {
    if(!state)return[]; const u=[];
    for(const a of ACHIEVEMENTS){if(state.achievements[a.id])continue;if(a.check(state)){state.achievements[a.id]=true;addCoins(a.reward.coins);if(a.reward.gems)addGems(a.reward.gems);u.push(a);}}
    if(u.length>0)save(); return u;
  }
  function endOfGame(result) {
    if(!state)return; state.totalPlays++;
    if(result.score>state.bestScore)state.bestScore=result.score;
    if(result.bestTile>state.bestTile)state.bestTile=result.bestTile;
    state.totalMerges+=result.merges||0;
    const xp=Math.floor(result.score/10)+(result.merges||0)*3+20; addXp(xp);
    const coins=Math.floor(result.score/20)+(result.merges||0)*1+5; addCoins(coins);
    save();
  }
  function getState(){return state;}
  function getUpgradeTiers(){return UPGRADE_TIERS;}
  function getPremiumItems(){return PREMIUM_ITEMS;}
  function getGemPacks(){return GEM_PACKS;}
  function getCatalog(){return CATALOG;}
  function getAchievements(){return ACHIEVEMENTS;}
  function getCoinBalance(){return state?state.coins:0;}
  function getGemBalance(){return state?state.gems:0;}

  window.ProgressionSystem = {
    load,save,reset,addCoins,spendCoins,getCoinBalance,addGems,spendGems,getGemBalance,
    addXp,xpForLevel,upgradeItem,getUpgradeCost,getActiveBonuses,getUpgradeTiers,UPGRADE_TIERS,
    getPremiumItems,PREMIUM_ITEMS,getGemPacks,GEM_PACKS,ownsPremiumItem,purchasePremiumItem,
    getCatalog,CATALOG,getAchievements,ACHIEVEMENTS,checkAchievements,endOfGame,getState,defaultState,
  };
})();
