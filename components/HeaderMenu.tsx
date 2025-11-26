'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './HeaderMenu.module.css';
import { getCoursesByRacecourse, getCourseUrl, getCourseDisplayName } from '@/lib/courses';

const racecoursesData = getCoursesByRacecourse().map(group => ({
  name: group.racecourse_ja,
  nameEn: group.racecourse,
  courses: group.courses
}));

// 種牡馬データ（五十音順）
const siresData = [
  {
    kana: 'あ行',
    sires: [
      { name: 'アイルハヴアナザー', nameEn: 'ill-have-another' },
      { name: 'アドマイヤムーン', nameEn: 'admire-moon' },
      { name: 'アメリカンペイトリオット', nameEn: 'american-patriot' },
      { name: 'エイシンフラッシュ', nameEn: 'a-shin-flash' },
      { name: 'エスポワールシチー', nameEn: 'espoir-city' },
      { name: 'エピファネイア', nameEn: 'epiphaneia' },
      { name: 'オルフェーヴル', nameEn: 'orfevre' },
    ],
  },
  {
    kana: 'か行',
    sires: [
      { name: 'カレンブラックヒル', nameEn: 'curren-black-hill' },
      { name: 'キタサンブラック', nameEn: 'kitasan-black' },
      { name: 'キズナ', nameEn: 'kizuna' },
      { name: 'キングカメハメハ', nameEn: 'king-kamehameha' },
      { name: 'ゴールドシップ', nameEn: 'gold-ship' },
    ],
  },
  {
    kana: 'さ行',
    sires: [
      { name: 'サトノアラジン', nameEn: 'satono-aladdin' },
      { name: 'サトノクラウン', nameEn: 'satono-crown' },
      { name: 'サトノダイヤモンド', nameEn: 'satono-diamond' },
      { name: 'シルバーステート', nameEn: 'silver-state' },
      { name: 'ジャスタウェイ', nameEn: 'just-a-way' },
    ],
  },
  {
    kana: 'た行',
    sires: [
      { name: 'ダイワメジャー', nameEn: 'daiwa-major' },
      { name: 'タートルボウル', nameEn: 'turtle-bowl' },
      { name: 'ディープインパクト', nameEn: 'deep-impact' },
      { name: 'ドゥラメンテ', nameEn: 'duramente' },
    ],
  },
  {
    kana: 'な行',
    sires: [
      { name: 'ナカヤマフェスタ', nameEn: 'nakayama-festa' },
      { name: 'ノヴェリスト', nameEn: 'novellist' },
    ],
  },
  {
    kana: 'は行',
    sires: [
      { name: 'ハーツクライ', nameEn: 'hearts-cry' },
      { name: 'ハービンジャー', nameEn: 'harbinger' },
      { name: 'ビッグアーサー', nameEn: 'big-arthur' },
      { name: 'フェノーメノ', nameEn: 'fenomeno' },
    ],
  },
  {
    kana: 'ま行',
    sires: [
      { name: 'マインドユアビスケッツ', nameEn: 'mind-your-biscuits' },
      { name: 'マクフィ', nameEn: 'makfi' },
      { name: 'ミッキーアイル', nameEn: 'mickey-isle' },
      { name: 'モーリス', nameEn: 'maurice' },
    ],
  },
  {
    kana: 'や行',
    sires: [
      { name: 'ヨハネスブルグ', nameEn: 'johannesburg' },
    ],
  },
  {
    kana: 'ら行',
    sires: [
      { name: 'リアルインパクト', nameEn: 'real-impact' },
      { name: 'リオンディーズ', nameEn: 'rio-de-la-plata' },
      { name: 'ルーラーシップ', nameEn: 'rulership' },
      { name: 'ロードカナロア', nameEn: 'lord-kanaloa' },
    ],
  },
  {
    kana: 'わ行',
    sires: [
      { name: 'ワールドエース', nameEn: 'world-ace' },
    ],
  },
];

// 騎手データ（五十音順）
const jockeysData = [
  {
    kana: 'あ行',
    jockeys: [
      { name: '秋山真一郎', nameEn: 'akiyama-shinichiro' },
      { name: '池添謙一', nameEn: 'ikezoe-kenichi' },
      { name: '石橋脩', nameEn: 'ishibashi-osamu' },
      { name: '石川裕紀人', nameEn: 'ishikawa-yukito' },
      { name: '泉谷楓真', nameEn: 'izumiya-fuuma' },
      { name: '岩田康誠', nameEn: 'iwata-yasunari' },
      { name: '岩田望来', nameEn: 'iwata-mitsuki' },
      { name: '内田博幸', nameEn: 'uchida-hiroyuki' },
      { name: '大野拓弥', nameEn: 'oono-takuya' },
      { name: '荻野極', nameEn: 'ogino-kiwamu' },
    ],
  },
  {
    kana: 'か行',
    jockeys: [
      { name: '角田大河', nameEn: 'kakuda-taiga' },
      { name: '勝浦正樹', nameEn: 'katsuura-masaki' },
      { name: '川田将雅', nameEn: 'kawata-masayoshi' },
      { name: '菊沢一樹', nameEn: 'kikuzawa-kazuki' },
      { name: '北村友一', nameEn: 'kitamura-yuichi' },
      { name: '国分恭介', nameEn: 'kokubun-kyosuke' },
      { name: '国分優作', nameEn: 'kokubun-yusaku' },
      { name: '小林勝太', nameEn: 'kobayashi-shouta' },
      { name: '小林脩斗', nameEn: 'kobayashi-shuuto' },
    ],
  },
  {
    kana: 'さ行',
    jockeys: [
      { name: '坂井瑠星', nameEn: 'sakai-ryusei' },
      { name: '酒井学', nameEn: 'sakai-manabu' },
      { name: '柴田大知', nameEn: 'shibata-daichi' },
      { name: '島川綾', nameEn: 'shimakawa-ryo' },
      { name: '杉原誠人', nameEn: 'sugihara-makoto' },
      { name: '菅原明良', nameEn: 'sugawara-akira' },
      { name: '鮫島克駿', nameEn: 'sameshima-katsutoshi' },
    ],
  },
  {
    kana: 'た行',
    jockeys: [
      { name: '武豊', nameEn: 'take-yutaka' },
      { name: '田口貫太', nameEn: 'taguchi-kanta' },
      { name: '田辺裕信', nameEn: 'tanabe-hironobu' },
      { name: '津村明秀', nameEn: 'tsumura-akihide' },
      { name: '戸崎圭太', nameEn: 'tosaki-keita' },
      { name: '富田暁', nameEn: 'tomita-satoru' },
      { name: '藤田菜七子', nameEn: 'fujita-nanako' },
    ],
  },
  {
    kana: 'な行',
    jockeys: [
      { name: '永野猛蔵', nameEn: 'nagano-takezou' },
      { name: '中井裕二', nameEn: 'nakai-yuji' },
      { name: '西村淳也', nameEn: 'nishimura-junya' },
    ],
  },
  {
    kana: 'は行',
    jockeys: [
      { name: '浜中俊', nameEn: 'hamanaka-shun' },
      { name: '原優介', nameEn: 'hara-yusuke' },
      { name: '藤岡佑介', nameEn: 'fujioka-yusuke' },
      { name: '藤岡康太', nameEn: 'fujioka-kouta' },
      { name: '古川奈穂', nameEn: 'furukawa-naho' },
      { name: '福永祐一', nameEn: 'fukunaga-yuichi' },
    ],
  },
  {
    kana: 'ま行',
    jockeys: [
      { name: '松岡正海', nameEn: 'matsuoka-masaumi' },
      { name: '松山弘平', nameEn: 'matsuyama-kouhei' },
      { name: '丸田恭介', nameEn: 'maruta-kyosuke' },
      { name: '三浦皇成', nameEn: 'miura-kousei' },
      { name: '宮崎北斗', nameEn: 'miyazaki-hokuto' },
      { name: '武藤雅', nameEn: 'mutou-miyabi' },
    ],
  },
  {
    kana: 'や行',
    jockeys: [
      { name: '横山武史', nameEn: 'yokoyama-takeshi' },
      { name: '横山和生', nameEn: 'yokoyama-kazuki' },
      { name: '横山典弘', nameEn: 'yokoyama-norihiro' },
      { name: '吉田隼人', nameEn: 'yoshida-hayato' },
    ],
  },
  {
    kana: 'ら行',
    jockeys: [
      { name: 'C.ルメール', nameEn: 'lemaire' },
      { name: 'M.デムーロ', nameEn: 'demuro' },
      { name: 'R.ムーア', nameEn: 'moore' },
      { name: '鲁西迪', nameEn: 'russell' },
    ],
  },
  {
    kana: 'わ行',
    jockeys: [
      { name: '和田竜二', nameEn: 'wada-ryuji' },
    ],
  },
];

// 調教師データ（五十音順）
const trainersData = [
  {
    kana: 'あ行',
    trainers: [
      { name: '青木孝文', nameEn: 'aoki-takafumi' },
      { name: '安田隆行', nameEn: 'yasuda-takayuki' },
      { name: '安田翔伍', nameEn: 'yasuda-shogo' },
      { name: '池江泰寿', nameEn: 'ikee-taiju' },
      { name: '石坂公一', nameEn: 'ishizaka-koichi' },
      { name: '石坂正', nameEn: 'ishizaka-tadashi' },
      { name: '伊藤圭三', nameEn: 'ito-keizo' },
      { name: '伊藤大士', nameEn: 'ito-hiroshi' },
      { name: '岩戸孝樹', nameEn: 'iwato-takaki' },
      { name: '上村洋行', nameEn: 'uemura-hiroyuki' },
      { name: '音無秀孝', nameEn: 'otonashi-hidetaka' },
    ],
  },
  {
    kana: 'か行',
    trainers: [
      { name: '角居勝彦', nameEn: 'kakoi-katsuhiko' },
      { name: '加藤征弘', nameEn: 'kato-yukihiro' },
      { name: '金成貴史', nameEn: 'kanenari-takashi' },
      { name: '木村哲也', nameEn: 'kimura-tetsuya' },
      { name: '久保田貴士', nameEn: 'kubota-takashi' },
      { name: '国枝栄', nameEn: 'kunieda-sakae' },
    ],
  },
  {
    kana: 'さ行',
    trainers: [
      { name: '斉藤崇史', nameEn: 'saito-takashi' },
      { name: '笹田和秀', nameEn: 'sasada-kazuhide' },
      { name: '佐々木晶三', nameEn: 'sasaki-shozo' },
      { name: '清水久詞', nameEn: 'shimizu-hisashi' },
      { name: '須貝尚介', nameEn: 'sugai-shosuke' },
      { name: '杉山晴紀', nameEn: 'sugiyama-haruki' },
      { name: '鈴木孝志', nameEn: 'suzuki-takashi' },
    ],
  },
  {
    kana: 'た行',
    trainers: [
      { name: '高木登', nameEn: 'takagi-noboru' },
      { name: '高野友和', nameEn: 'takano-tomokazu' },
      { name: '高橋亮', nameEn: 'takahashi-ryo' },
      { name: '武井亮', nameEn: 'takei-ryo' },
      { name: '田中博康', nameEn: 'tanaka-hiroyasu' },
      { name: '田中剛', nameEn: 'tanaka-takeshi' },
      { name: '田村康仁', nameEn: 'tamura-yasuhito' },
      { name: '友道康夫', nameEn: 'tomodo-yasuo' },
    ],
  },
  {
    kana: 'な行',
    trainers: [
      { name: '中内田充正', nameEn: 'nakauchida-mitsumasa' },
      { name: '中竹和也', nameEn: 'nakatake-kazuya' },
      { name: '中舘英二', nameEn: 'nakadate-eiji' },
      { name: '西園正都', nameEn: 'nishizono-masato' },
      { name: '西村真幸', nameEn: 'nishimura-masaki' },
    ],
  },
  {
    kana: 'は行',
    trainers: [
      { name: '橋口慎介', nameEn: 'hashiguchi-shinsuke' },
      { name: '橋田満', nameEn: 'hashida-mitsuru' },
      { name: '浜田多実雄', nameEn: 'hamada-tamio' },
      { name: '藤岡健一', nameEn: 'fujioka-kenichi' },
      { name: '藤沢和雄', nameEn: 'fujisawa-kazuo' },
      { name: '藤原英昭', nameEn: 'fujiwara-hideaki' },
      { name: '堀宣行', nameEn: 'hori-nobuyuki' },
    ],
  },
  {
    kana: 'ま行',
    trainers: [
      { name: '松下武士', nameEn: 'matsushita-takeshi' },
      { name: '松田国英', nameEn: 'matsuda-kunihide' },
      { name: '松永幹夫', nameEn: 'matsunaga-mikio' },
      { name: '松永昌博', nameEn: 'matsunaga-masahiro' },
      { name: '宮田敬介', nameEn: 'miyata-keisuke' },
      { name: '宮本博', nameEn: 'miyamoto-hiroshi' },
      { name: '武幸四郎', nameEn: 'take-koshiro' },
    ],
  },
  {
    kana: 'や行',
    trainers: [
      { name: '矢作芳人', nameEn: 'yahagi-yoshito' },
      { name: '矢野英一', nameEn: 'yano-eiichi' },
      { name: '吉田直弘', nameEn: 'yoshida-naohiro' },
      { name: '吉村圭司', nameEn: 'yoshimura-keiji' },
    ],
  },
  {
    kana: 'ら行',
    trainers: [
      { name: '陸奥克也', nameEn: 'mutsu-katsuya' },
    ],
  },
  {
    kana: 'わ行',
    trainers: [
      { name: '渡辺薫彦', nameEn: 'watanabe-kunihiko' },
    ],
  },
];

// 既存の型定義（後方互換性のため残す）
const _oldRacecoursesData_UNUSED = [
  {
    name: '札幌競馬場',
    nameEn: 'sapporo',
    courses: [
      { name: '芝 1000m', distance: 1000, surface: 'turf' },
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1500m', distance: 1500, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2600m', distance: 2600, surface: 'turf' },
      { name: 'ダート 1000m', distance: 1000, surface: 'dirt' },
      { name: 'ダート 1700m', distance: 1700, surface: 'dirt' },
      { name: 'ダート 2400m', distance: 2400, surface: 'dirt' },
    ],
  },
  {
    name: '函館競馬場',
    nameEn: 'hakodate',
    courses: [
      { name: '芝 1000m', distance: 1000, surface: 'turf' },
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2600m', distance: 2600, surface: 'turf' },
      { name: 'ダート 1000m', distance: 1000, surface: 'dirt' },
      { name: 'ダート 1700m', distance: 1700, surface: 'dirt' },
      { name: 'ダート 2400m', distance: 2400, surface: 'dirt' },
    ],
  },
  {
    name: '福島競馬場',
    nameEn: 'fukushima',
    courses: [
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2600m', distance: 2600, surface: 'turf' },
      { name: 'ダート 1150m', distance: 1150, surface: 'dirt' },
      { name: 'ダート 1700m', distance: 1700, surface: 'dirt' },
      { name: 'ダート 2400m', distance: 2400, surface: 'dirt' },
    ],
  },
  {
    name: '中山競馬場',
    nameEn: 'nakayama',
    courses: [
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1600m', distance: 1600, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2200m', distance: 2200, surface: 'turf' },
      { name: '芝 2500m', distance: 2500, surface: 'turf' },
      { name: '芝 3600m', distance: 3600, surface: 'turf' },
      { name: 'ダート 1200m', distance: 1200, surface: 'dirt' },
      { name: 'ダート 1800m', distance: 1800, surface: 'dirt' },
      { name: 'ダート 2400m', distance: 2400, surface: 'dirt' },
      { name: 'ダート 2500m', distance: 2500, surface: 'dirt' },
    ],
  },
  {
    name: '東京競馬場',
    nameEn: 'tokyo',
    courses: [
      { name: '芝 1400m', distance: 1400, surface: 'turf' },
      { name: '芝 1600m', distance: 1600, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2300m', distance: 2300, surface: 'turf' },
      { name: '芝 2400m', distance: 2400, surface: 'turf' },
      { name: '芝 2500m', distance: 2500, surface: 'turf' },
      { name: '芝 3400m', distance: 3400, surface: 'turf' },
      { name: 'ダート 1300m', distance: 1300, surface: 'dirt' },
      { name: 'ダート 1400m', distance: 1400, surface: 'dirt' },
      { name: 'ダート 1600m', distance: 1600, surface: 'dirt' },
      { name: 'ダート 2100m', distance: 2100, surface: 'dirt' },
      { name: 'ダート 2400m', distance: 2400, surface: 'dirt' },
    ],
  },
  {
    name: '新潟競馬場',
    nameEn: 'niigata',
    courses: [
      { name: '芝 1000m', distance: 1000, surface: 'turf' },
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1400m', distance: 1400, surface: 'turf' },
      { name: '芝 1600m', distance: 1600, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m（内）', distance: 2000, surface: 'turf', variant: 'inner' },
      { name: '芝 2000m（外）', distance: 2000, surface: 'turf', variant: 'outer' },
      { name: '芝 2200m', distance: 2200, surface: 'turf' },
      { name: '芝 2400m', distance: 2400, surface: 'turf' },
      { name: 'ダート 1200m', distance: 1200, surface: 'dirt' },
      { name: 'ダート 1800m', distance: 1800, surface: 'dirt' },
    ],
  },
  {
    name: '中京競馬場',
    nameEn: 'chukyo',
    courses: [
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1400m', distance: 1400, surface: 'turf' },
      { name: '芝 1600m', distance: 1600, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2200m', distance: 2200, surface: 'turf' },
      { name: 'ダート 1200m', distance: 1200, surface: 'dirt' },
      { name: 'ダート 1400m', distance: 1400, surface: 'dirt' },
      { name: 'ダート 1800m', distance: 1800, surface: 'dirt' },
      { name: 'ダート 1900m', distance: 1900, surface: 'dirt' },
    ],
  },
  {
    name: '京都競馬場',
    nameEn: 'kyoto',
    courses: [
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1400m（内）', distance: 1400, surface: 'turf', variant: 'inner' },
      { name: '芝 1400m（外）', distance: 1400, surface: 'turf', variant: 'outer' },
      { name: '芝 1600m（内）', distance: 1600, surface: 'turf', variant: 'inner' },
      { name: '芝 1600m（外）', distance: 1600, surface: 'turf', variant: 'outer' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2200m', distance: 2200, surface: 'turf' },
      { name: '芝 2400m', distance: 2400, surface: 'turf' },
      { name: '芝 3000m', distance: 3000, surface: 'turf' },
      { name: '芝 3200m', distance: 3200, surface: 'turf' },
      { name: 'ダート 1200m', distance: 1200, surface: 'dirt' },
      { name: 'ダート 1400m', distance: 1400, surface: 'dirt' },
      { name: 'ダート 1800m', distance: 1800, surface: 'dirt' },
      { name: 'ダート 1900m', distance: 1900, surface: 'dirt' },
    ],
  },
  {
    name: '阪神競馬場',
    nameEn: 'hanshin',
    courses: [
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1400m', distance: 1400, surface: 'turf' },
      { name: '芝 1600m', distance: 1600, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2200m', distance: 2200, surface: 'turf' },
      { name: '芝 2400m', distance: 2400, surface: 'turf' },
      { name: '芝 2600m', distance: 2600, surface: 'turf' },
      { name: '芝 3000m', distance: 3000, surface: 'turf' },
      { name: 'ダート 1200m', distance: 1200, surface: 'dirt' },
      { name: 'ダート 1400m', distance: 1400, surface: 'dirt' },
      { name: 'ダート 1800m', distance: 1800, surface: 'dirt' },
      { name: 'ダート 2000m', distance: 2000, surface: 'dirt' },
    ],
  },
  {
    name: '小倉競馬場',
    nameEn: 'kokura',
    courses: [
      { name: '芝 1200m', distance: 1200, surface: 'turf' },
      { name: '芝 1700m', distance: 1700, surface: 'turf' },
      { name: '芝 1800m', distance: 1800, surface: 'turf' },
      { name: '芝 2000m', distance: 2000, surface: 'turf' },
      { name: '芝 2600m', distance: 2600, surface: 'turf' },
      { name: 'ダート 1000m', distance: 1000, surface: 'dirt' },
      { name: 'ダート 1700m', distance: 1700, surface: 'dirt' },
      { name: 'ダート 2400m', distance: 2400, surface: 'dirt' },
    ],
  },
];

type MenuType = 'course' | 'jockey' | 'sire' | 'trainer' | null;

export default function HeaderMenu() {
  const [openMenu, setOpenMenu] = useState<MenuType>(null);
  const [expandedRacecourse, setExpandedRacecourse] = useState<Record<string, boolean>>({});

  const toggleRacecourse = (racecourseNameEn: string) => {
    setExpandedRacecourse((prev) => ({
      ...prev,
      [racecourseNameEn]: !prev[racecourseNameEn],
    }));
  };

  const closeMenu = () => setOpenMenu(null);

  // getCourseUrl はlib/courses.tsからインポートしたものを使用

  return (
    <>
      {/* ===== モバイル：下部固定メニューボタン（4つ） ===== */}
      <div className={styles.fixedMenuBar}>
        <button
          className={styles.menuButton}
          onClick={() => setOpenMenu('course')}
          type="button"
          aria-label="コース別データを開く"
        >
          <span className={styles.menuIcon}><i className="fa-solid fa-flag"></i></span>
          <span className={styles.menuText}>コースデータ</span>
        </button>
        <button
          className={styles.menuButton}
          onClick={() => setOpenMenu('jockey')}
          type="button"
          aria-label="騎手別データを開く"
        >
          <span className={styles.menuIcon}><i className="fa-solid fa-helmet-safety"></i></span>
          <span className={styles.menuText}>騎手データ</span>
        </button>
        <button
          className={styles.menuButton}
          onClick={() => setOpenMenu('sire')}
          type="button"
          aria-label="血統別データを開く"
        >
          <span className={styles.menuIcon}><i className="fa-solid fa-horse"></i></span>
          <span className={styles.menuText}>血統データ</span>
        </button>
        <button
          className={styles.menuButton}
          onClick={() => setOpenMenu('trainer')}
          type="button"
          aria-label="調教師別データを開く"
        >
          <span className={styles.menuIcon}><i className="fa-solid fa-user"></i></span>
          <span className={styles.menuText}>調教師データ</span>
        </button>
      </div>

      {openMenu && (
        <>
          <div
            className={styles.menuOverlay}
            onClick={closeMenu}
          />
          <div className={styles.fullscreenModal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {openMenu === 'course' && 'コース別データ'}
                {openMenu === 'jockey' && '騎手別データ'}
                {openMenu === 'sire' && '血統（種牡馬）別データ'}
                {openMenu === 'trainer' && '調教師別データ'}
              </h2>
              <button
                className={styles.closeButton}
                onClick={closeMenu}
                type="button"
                aria-label="メニューを閉じる"
              >
                ✕
              </button>
            </div>
            <div className={styles.mobileMenuContent}>
              {openMenu === 'course' && (
                <>
              {racecoursesData.map((racecourse) => (
                <div key={racecourse.nameEn} className={styles.accordionItem}>
                  <button
                    className={styles.accordionTrigger}
                    onClick={() => toggleRacecourse(racecourse.nameEn)}
                  >
                    <span className={`${styles.accordionIcon} ${expandedRacecourse[racecourse.nameEn] ? styles.expanded : ''}`}>
                      {expandedRacecourse[racecourse.nameEn] ? '▼' : '▶'}
                    </span>
                    {racecourse.name}
                  </button>

                  {expandedRacecourse[racecourse.nameEn] && (
                    <div className={styles.accordionContent}>
                      <div className={styles.surfaceGroup}>
                        {racecourse.courses
                          .filter((course) => course.surface === 'turf')
                          .map((course) => (
                            <Link
                              key={`${racecourse.nameEn}-${course.racecourse}-${course.surface}-${course.distance}${course.variant || ''}`}
                              href={getCourseUrl(course)}
                              className={`${styles.courseLink} ${styles.turf}`}
                              onClick={closeMenu}
                            >
                              {getCourseDisplayName(course)}
                            </Link>
                          ))}
                      </div>
                      <div className={styles.surfaceGroup}>
                        {racecourse.courses
                          .filter((course) => course.surface === 'dirt')
                          .map((course) => (
                            <Link
                              key={`${racecourse.nameEn}-${course.racecourse}-${course.surface}-${course.distance}${course.variant || ''}`}
                              href={getCourseUrl(course)}
                              className={`${styles.courseLink} ${styles.dirt}`}
                              onClick={closeMenu}
                            >
                              {getCourseDisplayName(course)}
                            </Link>
                          ))}
                      </div>
                      {racecourse.courses.some((course) => course.surface === 'steeplechase') && (
                        <div className={styles.surfaceGroup}>
                          {racecourse.courses
                            .filter((course) => course.surface === 'steeplechase')
                            .map((course) => (
                              <Link
                                key={`${racecourse.nameEn}-${course.racecourse}-${course.surface}-${course.distance}${course.variant || ''}`}
                                href={getCourseUrl(course)}
                                className={`${styles.courseLink} ${styles.steeplechase}`}
                                onClick={closeMenu}
                              >
                                {getCourseDisplayName(course)}
                              </Link>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              </>
              )}

              {openMenu === 'jockey' && (
                <>
              {jockeysData.map((group) => (
                <div key={group.kana} className={styles.accordionItem}>
                  <button
                    className={styles.accordionTrigger}
                    onClick={() => toggleRacecourse(`jockey-${group.kana}`)}
                  >
                    <span className={`${styles.accordionIcon} ${expandedRacecourse[`jockey-${group.kana}`] ? styles.expanded : ''}`}>
                      {expandedRacecourse[`jockey-${group.kana}`] ? '▼' : '▶'}
                    </span>
                    {group.kana}
                  </button>

                  {expandedRacecourse[`jockey-${group.kana}`] && (
                    <div className={styles.accordionContent}>
                      <div className={styles.dataCardGrid}>
                        {group.jockeys.map((jockey) => (
                          <Link
                            key={jockey.nameEn}
                            href={`/jockeys/${jockey.nameEn}`}
                            className={styles.dataCard}
                            onClick={closeMenu}
                          >
                            {jockey.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              </>
              )}

              {openMenu === 'sire' && (
                <>
              {siresData.map((group) => (
                <div key={group.kana} className={styles.accordionItem}>
                  <button
                    className={styles.accordionTrigger}
                    onClick={() => toggleRacecourse(`sire-${group.kana}`)}
                  >
                    <span className={`${styles.accordionIcon} ${expandedRacecourse[`sire-${group.kana}`] ? styles.expanded : ''}`}>
                      {expandedRacecourse[`sire-${group.kana}`] ? '▼' : '▶'}
                    </span>
                    {group.kana}
                  </button>

                  {expandedRacecourse[`sire-${group.kana}`] && (
                    <div className={styles.accordionContent}>
                      <div className={styles.dataCardGrid}>
                        {group.sires.map((sire) => (
                          <Link
                            key={sire.nameEn}
                            href={`/sires/${sire.nameEn}`}
                            className={styles.dataCard}
                            onClick={closeMenu}
                          >
                            {sire.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              </>
              )}

              {openMenu === 'trainer' && (
                <>
              {trainersData.map((group) => (
                <div key={group.kana} className={styles.accordionItem}>
                  <button
                    className={styles.accordionTrigger}
                    onClick={() => toggleRacecourse(`trainer-${group.kana}`)}
                  >
                    <span className={`${styles.accordionIcon} ${expandedRacecourse[`trainer-${group.kana}`] ? styles.expanded : ''}`}>
                      {expandedRacecourse[`trainer-${group.kana}`] ? '▼' : '▶'}
                    </span>
                    {group.kana}
                  </button>

                  {expandedRacecourse[`trainer-${group.kana}`] && (
                    <div className={styles.accordionContent}>
                      <div className={styles.dataCardGrid}>
                        {group.trainers.map((trainer) => (
                          <Link
                            key={trainer.nameEn}
                            href={`/trainers/${trainer.nameEn}`}
                            className={styles.dataCard}
                            onClick={closeMenu}
                          >
                            {trainer.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
