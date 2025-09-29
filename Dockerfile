# 1. ベースイメージの選択
FROM node:20-slim

# 2. 作業ディレクトリの設定
WORKDIR /app

# 3. package.json と package-lock.json のコピー
COPY package*.json ./

# 4. 依存関係のインストール
# 本番環境用の依存関係のみをインストール
RUN npm ci --omit=dev

# 5. ソースコードのコピー
COPY . .

# 6. TypeScriptのビルド
RUN npm run build

# 7. ポートの開放
EXPOSE 3000

# 8. 起動コマンド
CMD ["node", "dist/app.js"]
