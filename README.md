# Mafia Game Master Assistant

Веб-приложение для ведущего игры в Мафию:
- `backend` — Java Spring Boot + PostgreSQL
- `frontend` — React + Vite + Tailwind

## 1) Локальный запуск на ПК

### Требования
- Java 21+
- Maven 3.9+
- Node.js 20+ и npm
- PostgreSQL 14+

### Шаг 1. Поднять PostgreSQL и создать БД

Создайте базу:

```sql
CREATE DATABASE mafia_assistant;
```

По умолчанию backend ожидает:
- `DB_URL=jdbc:postgresql://localhost:5432/mafia_assistant`
- `DB_USERNAME=postgres`
- `DB_PASSWORD=postgres`

Если у вас другие логин/пароль, передайте переменные окружения при запуске backend.

### Шаг 2. Запуск backend

Из папки `backend`:

```bash
mvn spring-boot:run
```

Backend запустится на `http://localhost:8080`.
При старте автоматически применятся Flyway-миграции.

### Шаг 3. Запуск frontend

В новом терминале, из папки `frontend`:

```bash
npm install
npm run dev
```

Frontend запустится на `http://localhost:5173`.
В `vite.config.js` уже настроен proxy `/api` -> `http://localhost:8080`.

### Шаг 4. Проверка

- Откройте `http://localhost:5173`
- Создайте новую игру
- Пройдите шаги настройки
- Перейдите в дашборд и выполните несколько действий
- Доведите игру до финала и проверьте экран результатов

---

## 2) Развёртывание на сервере (как настоящий сайт)

Ниже пример для Ubuntu 22.04+ на VPS.

### Архитектура прод-окружения

- Nginx (reverse proxy + статика frontend)
- Spring Boot как `systemd` сервис
- PostgreSQL (локально на сервере или managed)
- Домен + HTTPS (Let's Encrypt)

### Шаг 1. Подготовить сервер

Установите пакеты:

```bash
sudo apt update
sudo apt install -y nginx postgresql postgresql-contrib openjdk-21-jre maven nodejs npm certbot python3-certbot-nginx
```

### Шаг 2. Развернуть код проекта

Клонируйте проект в, например, `/opt/mafia`:

```bash
sudo mkdir -p /opt/mafia
sudo chown -R $USER:$USER /opt/mafia
cd /opt/mafia
# git clone <your-repo-url> .
```

### Шаг 3. Настроить PostgreSQL на сервере

```bash
sudo -u postgres psql
```

В `psql`:

```sql
CREATE DATABASE mafia_assistant;
CREATE USER mafia_user WITH ENCRYPTED PASSWORD 'strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE mafia_assistant TO mafia_user;
\q
```

### Шаг 4. Собрать backend

```bash
cd /opt/mafia/backend
mvn clean package -DskipTests
```

После сборки появится jar в `target/`.

### Шаг 5. Создать `systemd` сервис для backend

Создайте файл `/etc/systemd/system/mafia-backend.service`:

```ini
[Unit]
Description=Mafia Assistant Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/opt/mafia/backend
Environment=DB_URL=jdbc:postgresql://localhost:5432/mafia_assistant
Environment=DB_USERNAME=mafia_user
Environment=DB_PASSWORD=strong_password_here
Environment=SERVER_PORT=8080
ExecStart=/usr/bin/java -jar /opt/mafia/backend/target/assistant-0.0.1-SNAPSHOT.jar
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Запуск:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mafia-backend
sudo systemctl start mafia-backend
sudo systemctl status mafia-backend
```

### Шаг 6. Собрать frontend

```bash
cd /opt/mafia/frontend
npm install
npm run build
```

Статика будет в `frontend/dist`.

### Шаг 7. Настроить Nginx

Создайте `/etc/nginx/sites-available/mafia`:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    root /opt/mafia/frontend/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Активируйте сайт:

```bash
sudo ln -s /etc/nginx/sites-available/mafia /etc/nginx/sites-enabled/mafia
sudo nginx -t
sudo systemctl reload nginx
```

### Шаг 8. Включить HTTPS

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Проверьте автообновление сертификатов:

```bash
sudo systemctl status certbot.timer
```

---

## 3) Обновление продакшена

После изменений в коде:

```bash
cd /opt/mafia
# git pull

cd backend
mvn clean package -DskipTests
sudo systemctl restart mafia-backend

cd ../frontend
npm install
npm run build
sudo systemctl reload nginx
```

---

## 4) Полезная диагностика

- Логи backend:
```bash
sudo journalctl -u mafia-backend -f
```
- Статус Nginx:
```bash
sudo systemctl status nginx
```
- Проверка backend напрямую:
```bash
curl http://127.0.0.1:8080/api/games/history
```

---

## 5) Важно для продакшена

- Не храните реальные пароли БД в git.
- Лучше вынести секреты в `.env`/Vault/панель хостинга.
- Ограничьте доступ к PostgreSQL (`localhost`/firewall).
- Регулярно делайте бэкапы базы.
