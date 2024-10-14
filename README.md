# Размещение коллекции на сервер
## Шаг 1: Забилдить фронтэнд
Перед размещением коллекции на сервере необходимо забилдить фронтэнд. Это можно сделать с помощью команды `npm run build`. Эта команда создаст папку `build` в корне проекта, содержащую собранный фронтэнд.

## Шаг 2: Продублировать папку build
После того, как фронтэнд забилдился, необходимо продублировать папку `build` в корень проекта, на уровень с файлом `app.js`. Это необходимо для того, чтобы сервер мог найти собранный фронтэнд.

## Шаг 3: Размещение проекта на сервере
Если проект не создан:
1. Перейдите в корень сервера: `cd /`
2. Создайте папку для проекта: `sudo mkdir -p /var/serviceCollection`
3. Перейдите в папку проекта: `cd var/serviceCollection`
4. Клонируйте репозиторий проекта: `sudo git clone https://github.com/Vadim-le/serviceCollection.git`
5. Измените права доступа к папке проекта: `sudo chown -R vadev:vadev serviceCollection`

Если проект уже создан и необходимо обновить:
- Загрузите все файлы проекта, кроме папки `frontend`, на сервер по пути: `/var/`

## Шаг 4: Создание демона
Создайте файл демона: `sudo nano /etc/systemd/system/CollectionStart.service`

Вставьте следующий код в файл:
[Unit]<br>
Description=NPM Start Daemon<br>
<br>
[Service]<br>
Type=simple<br>
ExecStart=/usr/bin/npm start<br>
WorkingDirectory=/var/service_collection/serviceCollection<br>
User=vadev<br>
Group=trusted<br>
Restart=always<br>
RestartSec=3<br>
<br>
[Install]<br>
WantedBy=multi-user.target<br>

Этот демон будет запускать сервер с помощью команды `npm start` и перезапускать его в случае ошибки.

## Шаг 5: Открыть порт в firewall
Откройте порт, указанный в конфиге, в firewall: `sudo ufw allow 5111`

## Шаг 6: Перезагрузить демон
1. Перезагрузите демон: `sudo systemctl daemon-reload`
2. Перезапустите демон: `sudo systemctl restart CollectionStart`
3. Проверьте статус демона: `sudo systemctl status CollectionStart`

Теперь коллекция должна быть доступна по адресу `http://51.250.4.123::5111`.
