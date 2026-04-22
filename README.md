# NW更改 展開計画自動生成アプリ

## 目的

全国1000拠点規模のNW更改案件において、拠点情報・施工キャパ・季節制約・期間条件を入力すると、負荷分散された展開計画案を自動生成し、日本地図および月次表で可視化するWebアプリ。

## v0.1で固定する設計範囲

この段階では実装よりも、Codexに渡せるアーキテクチャ仕様の土台を固定する。

## 入力データ

### Site

- id
- name
- prefecture
- region
- latitude
- longitude
- difficulty
- priority
- blackoutMonths

### VendorCapacity

- region
- yearMonth
- maxCapacity

### ProjectSetting

- startMonth
- endMonth
- monthlyMinimum
- monthlyMaximum
- snowSeasonMonths
- busySeasonMonths

## 出力モデル

### Plan

- id
- version
- score
- createdAt

### PlanAssignment

- siteId
- yearMonth
- region
- warnings
- reason

`reason` は計画結果の説明可能性を担保するための項目として扱う。

## 画面構成

### 1. マスタ入力画面

- 拠点情報の入力
- 施工キャパの入力
- 地域・都道府県の選択
- 難易度・優先度・作業不可月の選択

### 2. 条件設定画面

- 期間
- 月次件数
- 繁忙期
- 降雪期

### 3. 計画結果画面

- 地図ヒートマップ
- 月次件数表
- エリア別進捗率

## 技術構成

### Frontend

- Next.js
- TypeScript
- Tailwind CSS

### Backend

- Next.js Route Handlers

### Database

- PostgreSQL
- Prisma

### Map

- GeoJSON
- Japan prefecture level

### Chart

- Recharts

### Scheduler Engine

- TypeScript domain service
