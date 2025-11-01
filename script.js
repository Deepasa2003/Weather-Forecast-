const apiKey = "b12f74d5246d9369be88e194b3a3595e"; // Replace with your OpenWeather API key
let isCelsius = true;
let isDarkMode = true;
let recentCities = JSON.parse(localStorage.getItem("recentCities")) || [];

// DOM Elements
const alertBox = document.getElementById("alertBox");
const body = document.getElementById("appBody");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const currentWeather = document.getElementById("currentWeather");
const forecast = document.getElementById("forecast");
const unitToggle = document.getElementById("unitToggle");
const themeToggle = document.getElementById("themeToggle");
const recentSelect = document.getElementById("recentSelect");

// ========== ALERT MESSAGE ==========
function showAlert(msg, color = "red") {
  alertBox.textContent = msg;
  alertBox.className = `mt-4 px-6 py-3 rounded-xl bg-${color}-500/80 text-white shadow-lg animate-fadeIn`;
  alertBox.classList.remove("hidden");
  setTimeout(() => alertBox.classList.add("hidden"), 4000);
}

// ========== DYNAMIC BACKGROUND ==========
function setBackground(condition) {
  let gradient = "from-blue-900 via-indigo-900 to-purple-900";
  if (condition.includes("rain")) gradient = "from-blue-800 via-gray-800 to-gray-900";
  else if (condition.includes("cloud")) gradient = "from-gray-700 via-gray-800 to-gray-900";
  else if (condition.includes("snow")) gradient = "from-blue-200 via-blue-400 to-blue-600";
  else if (condition.includes("clear")) gradient = "from-blue-600 via-indigo-700 to-purple-800";
  body.className = `min-h-screen bg-gradient-to-br ${gradient} text-white flex flex-col items-center transition-all duration-700`;
}

// ========== FETCH WEATHER ==========
async function fetchWeather(city) {
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
    if (!res.ok) throw new Error("City not found!");
    const data = await res.json();
    displayCurrent(data);
    fetchForecast(city);
    updateRecent(city);
  } catch (err) {
    showAlert("❌ " + err.message);
  }
}

// ========== FETCH FORECAST ==========
async function fetchForecast(city) {
  forecast.innerHTML = "";
  const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`);
  const data = await res.json();
  const daily = data.list.filter(i => i.dt_txt.includes("12:00:00"));

  daily.slice(0, 5).forEach(item => {
    const temp = isCelsius ? item.main.temp : (item.main.temp * 9/5) + 32;
    const unit = isCelsius ? "°C" : "°F";
    const card = document.createElement("div");
    card.className = "flex-shrink-0 w-48 bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center shadow-lg hover:scale-105 transition-transform duration-300";
    card.innerHTML = `
      <h3 class="font-semibold">${new Date(item.dt_txt).toDateString()}</h3>
      <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png" class="mx-auto w-16 h-16">
      <p class="capitalize">${item.weather[0].description}</p>
      <h2 class="text-2xl font-bold">${temp.toFixed(1)}${unit}</h2>
      <div class="grid grid-cols-2 gap-1 text-sm mt-2">
        <div>💧 ${item.main.humidity}%</div>
        <div>🌬 ${item.wind.speed} m/s</div>
      </div>
    `;
    forecast.appendChild(card);
  });
  forecast.classList.add("animate-fadeIn");
}

// ========== DISPLAY CURRENT WEATHER ==========
function displayCurrent(data) {
  const temp = isCelsius ? data.main.temp : (data.main.temp * 9/5) + 32;
  const unit = isCelsius ? "°C" : "°F";
  const condition = data.weather[0].description.toLowerCase();
  setBackground(condition);

  if (data.main.temp > 40) showAlert("🔥 High Temperature Alert!", "yellow");
  if (condition.includes("rain")) showAlert("☔ Take an umbrella!", "blue");

  currentWeather.classList.remove("opacity-0");
  currentWeather.innerHTML = `
    <h2 class="text-2xl font-bold">${data.name}, ${data.sys.country}</h2>
    <img src="https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" class="mx-auto w-20 h-20">
    <p class="capitalize text-gray-200">${data.weather[0].description}</p>
    <h1 class="text-6xl font-extrabold my-2">${temp.toFixed(1)}${unit}</h1>
    <div class="grid grid-cols-2 gap-2 text-sm">
      <div class="bg-white/20 p-2 rounded-xl">💧 ${data.main.humidity}%</div>
      <div class="bg-white/20 p-2 rounded-xl">🌬 ${data.wind.speed} m/s</div>
      <div class="bg-white/20 p-2 rounded-xl">🌡 ${data.main.pressure} hPa</div>
      <div class="bg-white/20 p-2 rounded-xl">👁 ${(data.visibility / 1000).toFixed(1)} km</div>
    </div>
  `;
}

// ========== RECENT CITY STORAGE ==========
function updateRecent(city) {
  city = city.charAt(0).toUpperCase() + city.slice(1);
  if (!recentCities.includes(city)) {
    recentCities.unshift(city);
    if (recentCities.length > 5) recentCities.pop();
    localStorage.setItem("recentCities", JSON.stringify(recentCities));
  }
  showRecent();
}

function showRecent() {
  recentSelect.innerHTML = "";
  if (recentCities.length === 0) {
    recentSelect.classList.add("hidden");
    return;
  }
  recentSelect.classList.remove("hidden");
  recentCities.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    recentSelect.appendChild(opt);
  });
}
showRecent();

// ========== BUTTON EVENTS ==========
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city === "") return showAlert("⚠️ Please enter a city name!");
  fetchWeather(city);
});

locationBtn.addEventListener("click", () => {
  showAlert("📡 Fetching current location...", "blue");

  if (!navigator.geolocation) {
    showAlert("❌ Geolocation is not supported by your browser!");
    return;
  }

  // Force a fresh GPS fix
  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      console.log("📍 Live Coordinates:", lat, lon);

      // Fetch current weather using latest coordinates
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
        .then(res => res.json())
        .then(data => {
          if (data.cod !== 200) {
            showAlert("⚠️ Could not fetch live weather data!");
            return;
          }
          displayCurrent(data);
          fetchForecast(data.name);
          showAlert("✅ Live location updated successfully!", "green");
        })
        .catch(() => showAlert("⚠️ Network error while fetching weather!"));
    },
    err => {
      let msg = "❌ Unable to get your location.";
      if (err.code === err.PERMISSION_DENIED) msg = "⚠️ Please allow location access.";
      else if (err.code === err.POSITION_UNAVAILABLE) msg = "📶 Location signal unavailable.";
      else if (err.code === err.TIMEOUT) msg = "⏳ Location request timed out.";
      showAlert(msg);
    },
    {
      enableHighAccuracy: true,  // use GPS if available
      timeout: 15000,            // wait up to 15s
      maximumAge: 0              // do not use cached coordinates


    }
  );
});



unitToggle.addEventListener("click", () => {
  isCelsius = !isCelsius;
  if (currentWeather.innerHTML) fetchWeather(currentWeather.querySelector("h2").textContent.split(",")[0]);
});

themeToggle.addEventListener("click", () => {
  isDarkMode = !isDarkMode;
  body.classList.toggle("text-white");
  body.classList.toggle("text-gray-900");
});
