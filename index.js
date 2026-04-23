let allCountries = [], currentQuiz = [], currentQuizAnswers = [], selectedCountry = null;
let generalQuizData = null, generalQuizAnswers = [], challengeTimer = null;
let challengeNamedCountries = new Set(), challengeCountriesList = [];

const sessionData = JSON.parse(localStorage.getItem('geoquizSessionData')) || {
  countryQuizzes: [], generalQuizzes: [], challenges: []
};

function saveData() {
  localStorage.setItem('geoquizSessionData', JSON.stringify(sessionData));
}

async function initializeApp() {
  try {
    const res = await fetch('https://restcountries.com/v3.1/all?fields=name,capital,population,region,subregion,flags');
    allCountries = await res.json();
    allCountries.sort((a, b) => a.name.common.localeCompare(b.name.common));
    setupEventListeners();
  } catch (err) {
    console.error('Error loading countries:', err);
  }
}

function setupEventListeners() {
  const searchHandler = e => {
    if (e.key !== 'Enter') return;
    const term = e.target.value.toLowerCase().trim();
    if (!term) return;
    switchTab('quiz');
    const results = allCountries.filter(c =>
      c.name.common.toLowerCase().includes(term) || c.name.official.toLowerCase().includes(term)
    );
    displaySearchResults(results, term);
  };

  document.getElementById('country-search-input').addEventListener('keypress', searchHandler);
  document.getElementById('country-search-input-quiz').addEventListener('keypress', searchHandler);
  document.getElementById('start-general-quiz-btn').addEventListener('click', startGeneralQuiz);
  document.getElementById('start-general-quiz-btn-quiz').addEventListener('click', startGeneralQuizFromQuizTab);
  document.getElementById('start-challenge-btn').addEventListener('click', () => { switchTab('quiz'); startChallenge(); });
  document.getElementById('start-challenge-btn-quiz').addEventListener('click', startChallenge);
  document.getElementById('next-question-btn').addEventListener('click', nextCountryQuestion);
  document.getElementById('next-general-question-btn').addEventListener('click', nextGeneralQuestion);
  document.getElementById('finish-challenge-btn').addEventListener('click', finishChallenge);
  document.getElementById('challenge-input').addEventListener('keypress', handleChallengeInput);
  document.getElementById('back-to-quiz-options-btn').addEventListener('click', showQuizOptions);
  document.getElementById('back-home-from-results-btn').addEventListener('click', () => switchTab('home'));
  document.getElementById('back-home-from-general-results-btn').addEventListener('click', () => switchTab('home'));
  document.getElementById('back-home-from-challenge-btn').addEventListener('click', () => switchTab('home'));
  document.getElementById('retake-quiz-btn').addEventListener('click', () => startCountryQuiz(selectedCountry.name.common));
  document.getElementById('retake-general-quiz-btn').addEventListener('click', startGeneralQuizFromQuizTab);
  document.getElementById('start-another-challenge-btn').addEventListener('click', showQuizOptions);

  document.querySelectorAll('.nav-btn').forEach(btn =>
    btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')))
  );
}


function switchTab(tab) {
  document.querySelectorAll('.tab-view').forEach(v => v.classList.add('hidden'));
  if (tab === 'home') {
    document.getElementById('home-page').classList.remove('hidden');
  } else if (tab === 'quiz') {
    document.getElementById('quiz-page').classList.remove('hidden');
    showQuizOptions();
  } else if (tab === 'data') {
    document.getElementById('data-page').classList.remove('hidden');
    displaySessionData();
  }
}

function showQuizInnerPage(pageId) {
  document.querySelectorAll('.quiz-inner-page').forEach(p => p.classList.add('hidden'));
  document.getElementById(pageId).classList.remove('hidden');
}
const showQuizOptions = () => showQuizInnerPage('quiz-options-page-inner');


function displaySearchResults(results, term) {
  if (!results.length) { alert(`No countries found matching "${term}".`); return; }
  const container = document.getElementById('search-results-container');
  container.innerHTML = results.map(c => `
    <div class="country-card">
      <img src="${c.flags.png}" alt="Flag of ${c.name.common}" class="country-flag" />
      <h3>${c.name.common}</h3>
      <p><strong>Capital:</strong> ${c.capital?.[0] ?? 'N/A'}</p>
      <p><strong>Population:</strong> ${c.population.toLocaleString()}</p>
      <p><strong>Region:</strong> ${c.region}</p>
      <button class="btn btn-secondary take-quiz-btn" data-country="${c.name.common}">Take Quiz</button>
    </div>`).join('');
  container.querySelectorAll('.take-quiz-btn').forEach(btn =>
    btn.addEventListener('click', e => startCountryQuiz(e.target.getAttribute('data-country')))
  );
  showQuizInnerPage('search-results-page-inner');
}


function startCountryQuiz(countryName) {
  selectedCountry = allCountries.find(c => c.name.common === countryName);
  if (!selectedCountry) return;
  currentQuiz = generateCountryQuiz(selectedCountry);
  currentQuizAnswers = [];
  document.getElementById('quiz-title').textContent = `Quiz: ${countryName}`;
  showQuizInnerPage('country-quiz-page-inner');
  displayCountryQuestion(0);
}

function generateCountryQuiz(c) {
  return [
    { type: 'capital',    text: `What is the capital of ${c.name.common}?`,       correct: c.capital?.[0] ?? 'N/A', options: pickOptions(c.capital?.[0] ?? 'N/A', allCountries.map(x => x.capital?.[0] ?? 'N/A')) },
    { type: 'population', text: `Approximately how many people live in ${c.name.common}?`, correct: popRange(c.population), options: ['Less than 1 million','1-10 million','10-50 million','50-100 million','100-500 million','More than 500 million'] },
    { type: 'region',     text: `Which region is ${c.name.common} located in?`,   correct: c.region, options: ['Africa','Americas','Asia','Europe','Oceania'] },
    { type: 'subregion',  text: `Which subregion is ${c.name.common} part of?`,   correct: c.subregion ?? 'N/A', options: subregionsFor(c.region) },
    { type: 'flag',       text: `Which country's flag is this?`,                   correct: c.name.common, flagUrl: c.flags.png, options: pickOptions(c.name.common, allCountries.map(x => x.name.common)) }
  ];
}

function displayCountryQuestion(index) {
  const q = currentQuiz[index];
  document.getElementById('question-counter').textContent = `Question ${index + 1} of 5`;
  document.getElementById('progress-fill').style.width = `${((index + 1) / 5) * 100}%`;
  const flagHtml = q.flagUrl ? `<img src="${q.flagUrl}" alt="Country flag" class="question-flag" />` : '';
  document.getElementById('question-container').innerHTML = `
    <div class="question">
      <p>${q.text}</p>${flagHtml}
      <div class="options">${q.options.map(o => `<button class="option-btn" data-answer="${o}">${o}</button>`).join('')}</div>
    </div>`;
  document.querySelectorAll('.option-btn').forEach(btn =>
    btn.addEventListener('click', e => { currentQuizAnswers[index] = e.target.getAttribute('data-answer'); nextCountryQuestion(); })
  );
}

function nextCountryQuestion() {
  const i = currentQuizAnswers.length;
  if (i < currentQuiz.length) displayCountryQuestion(i);
  else {
    const score = currentQuiz.reduce((s, q, i) => s + (currentQuizAnswers[i] === q.correct ? 1 : 0), 0);
    sessionData.countryQuizzes.push({
      country: selectedCountry.name.common, timestamp: new Date().toLocaleString(), score, totalQuestions: 5,
      questions: currentQuiz.map((q, i) => ({ question: q.text, userAnswer: currentQuizAnswers[i], correctAnswer: q.correct, isCorrect: currentQuizAnswers[i] === q.correct }))
    });
    saveData();
    document.getElementById('final-score').textContent = `Your Score: ${score}/5`;
    showQuizInnerPage('country-quiz-results-page-inner');
  }
}


function startGeneralQuiz() { switchTab('quiz'); startGeneralQuizFromQuizTab(); }
function startGeneralQuizFromQuizTab() {
  generalQuizAnswers = [];
  generalQuizData = { questions: Array.from({ length: 20 }, () => {
    const c = allCountries[Math.floor(Math.random() * allCountries.length)];
    const t = Math.floor(Math.random() * 4);
    if (t === 0) return { type: 'capital',    text: `What is the capital of ${c.name.common}?`,       correct: c.capital?.[0] ?? 'N/A', options: pickOptions(c.capital?.[0] ?? 'N/A', allCountries.map(x => x.capital?.[0] ?? 'N/A')) };
    if (t === 1) return { type: 'population', text: `Approximately how many people live in ${c.name.common}?`, correct: popRange(c.population), options: ['Less than 1 million','1-10 million','10-50 million','50-100 million','100-500 million','More than 500 million'] };
    if (t === 2) return { type: 'region',     text: `Which region is ${c.name.common} located in?`,   correct: c.region, options: ['Africa','Americas','Asia','Europe','Oceania'] };
    return         { type: 'flag',       text: `Which country's flag is this?`,                   correct: c.name.common, flagUrl: c.flags.png, options: pickOptions(c.name.common, allCountries.map(x => x.name.common)) };
  })};
  showQuizInnerPage('general-quiz-page-inner');
  displayGeneralQuestion(0);
}

function displayGeneralQuestion(index) {
  const q = generalQuizData.questions[index];
  document.getElementById('general-question-counter').textContent = `Question ${index + 1} of 20`;
  document.getElementById('general-progress-fill').style.width = `${((index + 1) / 20) * 100}%`;
  const flagHtml = q.flagUrl ? `<img src="${q.flagUrl}" alt="Country flag" class="question-flag" />` : '';
  document.getElementById('general-question-container').innerHTML = `
    <div class="question">
      <p>${q.text}</p>${flagHtml}
      <div class="options">${q.options.map(o => `<button class="option-btn" data-answer="${o}">${o}</button>`).join('')}</div>
    </div>`;
  document.querySelectorAll('#general-question-container .option-btn').forEach(btn =>
    btn.addEventListener('click', e => { generalQuizAnswers[index] = e.target.getAttribute('data-answer'); nextGeneralQuestion(); })
  );
}

function nextGeneralQuestion() {
  const i = generalQuizAnswers.length;
  if (i < generalQuizData.questions.length) displayGeneralQuestion(i);
  else {
    const score = generalQuizData.questions.reduce((s, q, i) => s + (generalQuizAnswers[i] === q.correct ? 1 : 0), 0);
    sessionData.generalQuizzes.push({
      timestamp: new Date().toLocaleString(), score, totalQuestions: 20,
      questions: generalQuizData.questions.map((q, i) => ({ question: q.text, userAnswer: generalQuizAnswers[i], correctAnswer: q.correct, isCorrect: generalQuizAnswers[i] === q.correct }))
    });
    saveData();
    document.getElementById('general-final-score').textContent = `Your Score: ${score}/20`;
    showQuizInnerPage('general-quiz-results-page-inner');
  }
}


function startChallenge() {
  challengeNamedCountries.clear();
  challengeCountriesList = [...allCountries];
  document.getElementById('timer').textContent = '30:00';
  document.getElementById('country-count').textContent = 'Countries: 0';
  document.getElementById('challenge-input').value = '';
  document.getElementById('challenge-countries').innerHTML = '';
  showQuizInnerPage('challenge-page-inner');
  challengeTimer = setInterval(() => {
    const [m, s] = document.getElementById('timer').textContent.split(':').map(Number);
    const total = m * 60 + s - 1;
    if (total < 0) { finishChallenge(); return; }
    document.getElementById('timer').textContent = `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }, 1000);
}

function handleChallengeInput(e) {
  if (e.key !== 'Enter') return;
  const input = e.target.value.toLowerCase().trim();
  const country = challengeCountriesList.find(c => c.name.common.toLowerCase() === input || c.name.official.toLowerCase() === input);
  if (country && !challengeNamedCountries.has(country.name.common)) {
    challengeNamedCountries.add(country.name.common);
    const item = document.createElement('div');
    item.className = 'challenge-country-item';
    item.textContent = country.name.common;
    document.getElementById('challenge-countries').appendChild(item);
    document.getElementById('country-count').textContent = `Countries: ${challengeNamedCountries.size}`;
  }
  e.target.value = '';
}

function finishChallenge() {
  if (challengeTimer) clearInterval(challengeTimer);
  const missed = challengeCountriesList.filter(c => !challengeNamedCountries.has(c.name.common));
  sessionData.challenges.push({ timestamp: new Date().toLocaleString(), countriesGuessed: challengeNamedCountries.size, countriesMissed: missed.length, missedCountries: missed });
  saveData();
  document.getElementById('challenge-final-score').textContent = `Countries Named: ${challengeNamedCountries.size}`;
  showQuizInnerPage('challenge-results-page-inner');
}


function renderQuizBlock(q, i, label, score) {
  return `<div class="quiz-result"><h4>${label} (${q.timestamp})</h4><p>Score: ${q.score}/${score}</p>
  <details><summary>View Details</summary><ul>${q.questions.map(x =>
    `<li class="${x.isCorrect ? 'correct' : 'incorrect'}">${x.question}<br>Your answer: ${x.userAnswer}<br>Correct: ${x.correctAnswer}</li>`
  ).join('')}</ul></details></div>`;
}

function displaySessionData() {
  const cq = document.getElementById('country-quiz-stats');
  cq.innerHTML = sessionData.countryQuizzes.length
    ? '<h3>Country Quiz Results</h3>' + sessionData.countryQuizzes.map((q, i) => renderQuizBlock(q, i, `Quiz ${i+1} – ${q.country}`, 5)).join('')
    : '<p>No country quizzes completed yet.</p>';

  const gq = document.getElementById('general-quiz-stats');
  gq.innerHTML = sessionData.generalQuizzes.length
    ? '<h3>General Quiz Results</h3>' + sessionData.generalQuizzes.map((q, i) => renderQuizBlock(q, i, `Quiz ${i+1}`, 20)).join('')
    : '<p>No general quizzes completed yet.</p>';

  const ch = document.getElementById('challenge-stats');
  ch.innerHTML = sessionData.challenges.length
    ? '<h3>Challenge Results</h3>' + sessionData.challenges.map((c, i) =>
        `<div class="quiz-result"><h4>Challenge ${i+1} (${c.timestamp})</h4><p>Countries Named: ${c.countriesGuessed}</p>
        <details><summary>View Details</summary><ul>${c.missedCountries.map(x => `<li>${x.name.common}</li>`).join('')}</ul></details></div>`
      ).join('')
    : '<p>No challenges completed yet.</p>';
}


function pickOptions(correct, pool) {
  const opts = new Set([correct]);
  while (opts.size < 4) opts.add(pool[Math.floor(Math.random() * pool.length)]);
  return shuffle([...opts]);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function popRange(p) {
  if (p < 1e6)  return 'Less than 1 million';
  if (p < 1e7)  return '1-10 million';
  if (p < 5e7)  return '10-50 million';
  if (p < 1e8)  return '50-100 million';
  if (p < 5e8)  return '100-500 million';
  return 'More than 500 million';
}

function subregionsFor(region) {
  const map = {
    Africa:   ['Northern Africa','Eastern Africa','Western Africa','Southern Africa','Middle Africa'],
    Americas: ['North America','South America','Central America','Caribbean'],
    Asia:     ['Western Asia','Central Asia','Southern Asia','Eastern Asia','Southeast Asia'],
    Europe:   ['Northern Europe','Western Europe','Eastern Europe','Southern Europe'],
    Oceania:  ['Australia and New Zealand','Melanesia','Micronesia','Polynesia']
  };
  return map[region] || [];
}

document.addEventListener('DOMContentLoaded', initializeApp);