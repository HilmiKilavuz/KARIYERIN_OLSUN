# 1. Python 3.10'un hafif ve güvenli sürümünü kullan (Macera arama!)
FROM python:3.10-slim

# 2. Gerekli sistem araçlarını yükle (C++ derleyicileri vb.)
RUN apt-get update && apt-get install -y \
    build-essential \
    libffi-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# 3. Çalışma klasörünü ayarla
WORKDIR /app

# 4. Önce sadece gereksinimleri kopyala ve yükle
# (Bu sayede kodunda küçük bir değişiklik yaparsan her şeyi baştan yüklemez, hızlı olur)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# 5. Şimdi geri kalan tüm kodlarını içeri al
COPY . .

# 6. Uygulamayı başlat (Google'ın istediği porttan)
CMD exec functions-framework --target=run_cv_analysis --port=8080