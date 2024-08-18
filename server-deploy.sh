#!/bin/bash

# Путь к директории
DIRECTORY="/var/www/free-drive"

# Переход в указанную директорию
cd "$DIRECTORY" || { echo "Директория не найдена: $DIRECTORY"; exit 1; }

# Выполнение команды yarn install
yarn install

# Вывод сообщения об успешном завершении
echo "Установка зависимостей завершена."