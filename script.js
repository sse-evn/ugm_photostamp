// Получаем доступ к элементам на странице
const video = document.getElementById('camera-feed');
const canvas = document.getElementById('photo-canvas');
const captureBtn = document.getElementById('capture-btn');
const resultContainer = document.getElementById('result-container');
const resultImg = document.getElementById('result-img');
const downloadLink = document.getElementById('download-link');

// ВАЖНО: Вам нужно получить свой собственный ключ API от Google Cloud Platform
// и включить "Maps Static API".
const Maps_API_KEY = 'ВАШ_КЛЮЧ_API_ОТ_Maps';

// 1. Запускаем камеру
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' }, // 'user' - фронтальная, 'environment' - задняя
            audio: false 
        });
        video.srcObject = stream;
    } catch (err) {
        console.error("Ошибка доступа к камере: ", err);
        alert("Не удалось получить доступ к камере. Убедитесь, что вы дали разрешение.");
    }
}

// 2. Обработчик нажатия на кнопку
captureBtn.addEventListener('click', () => {
    captureBtn.disabled = true;
    captureBtn.textContent = 'Обработка...';

    // 3. Получаем геолокацию
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            createPhotoStamp(latitude, longitude);
        },
        (err) => {
            console.error("Ошибка геолокации:", err);
            alert("Не удалось определить ваше местоположение. Включите GPS и дайте разрешение.");
            resetButton();
        }
    );
});

// 4. Основная функция создания фотоштампа
function createPhotoStamp(lat, lon) {
    const context = canvas.getContext('2d');
    
    // Устанавливаем размер canvas равным размеру видео
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Рисуем текущий кадр с видео на canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Подготавливаем данные для штампов
    const now = new Date();
    const dateTimeString = now.toLocaleString('ru-RU');
    
    // Формируем URL для Google Maps Static API
    const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=15&size=200x200&maptype=roadmap&markers=color:red%7C${lat},${lon}&key=${Maps_API_KEY}`;

    const mapImage = new Image();
    mapImage.crossOrigin = "Anonymous"; // Важно для загрузки изображений с другого домена
    mapImage.onload = () => {
        // Рисуем карту в левом нижнем углу
        const mapWidth = canvas.width * 0.25; // Карта займет 25% ширины
        const mapHeight = (mapWidth / mapImage.width) * mapImage.height;
        const margin = canvas.width * 0.02;
        context.drawImage(mapImage, margin, canvas.height - mapHeight - margin, mapWidth, mapHeight);

        // Добавляем текст в правом нижнем углу
        context.font = `${canvas.width * 0.03}px Arial`;
        context.fillStyle = 'white';
        context.textAlign = 'right';
        // Добавим тень для читаемости
        context.shadowColor = 'black';
        context.shadowBlur = 5;
        context.fillText(dateTimeString, canvas.width - margin, canvas.height - margin);
        
        // Показываем результат
        const finalImageDataUrl = canvas.toDataURL('image/jpeg');
        resultImg.src = finalImageDataUrl;
        downloadLink.href = finalImageDataUrl;
        resultContainer.style.display = 'block';
        
        resetButton();
    };
    
    mapImage.onerror = () => {
        alert("Не удалось загрузить карту. Проверьте ваш API ключ и подключение к интернету.");
        resetButton();
    }

    mapImage.src = mapUrl;
}

function resetButton() {
    captureBtn.disabled = false;
    captureBtn.textContent = 'Сделать фото';
}

// Запускаем все при загрузке страницы
startCamera()
