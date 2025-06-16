# استخدم صورة Node.js خفيفة وحديثة
FROM node:18-alpine

# حدد مجلد العمل داخل الحاوية
WORKDIR /app

# انسخ ملفات package.json و package-lock.json لتثبيت الباكجات فقط
COPY package*.json ./

# ثبت الباكجات مع تخطي مشاكل peer dependencies
RUN npm install --legacy-peer-deps

# انسخ باقي ملفات المشروع
COPY . .

# ابني مشروع NestJS
RUN npm run build

# عرّف البورت اللي التطبيق راح يستمع عليه (مثلاً 3000)
EXPOSE 3000

# أمر تشغيل التطبيق بعد البناء
CMD ["node", "dist/main.js"]