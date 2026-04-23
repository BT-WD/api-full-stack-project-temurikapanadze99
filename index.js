let allCountries=[],currentQuiz=null,currentQuizAnswers=[],selectedCountryForQuiz=null,generalQuizData=null,generalQuizAnswers=[],challengeTimer=null,challengeNamedCountries=new Set(),challengeCountriesList=[],currentTab='home',sessionData={countryQuizzes:[],generalQuizzes:[],challenges:[]};const saved=localStorage.getItem('geoquizSessionData');if(saved)sessionData=JSON.parse(saved);function saveData(){localStorage.setItem('geoquizSessionData',JSON.stringify(sessionData));}const API_BASE='https://restcountries.com/v3.1';
async function initializeApp(){try{const response=await fetch(`${API_BASE}/all?fields=name,capital,population,region,subregion,flags`);allCountries=await response.json();allCountries.sort((a,b)=>a.name.common.localeCompare(b.name.common));setupEventListeners();}catch(error){console.error('Error loading countries:',error);}}
function setupEventListeners(){const handleSearch=(event)=>{if(event.key!=='Enter')return;const searchTerm=event.target.value.toLowerCase().trim();if(!searchTerm)return;switchTab('quiz');const results=allCountries.filter(country=>country.name.common.toLowerCase().includes(searchTerm)||country.name.official.toLowerCase().includes(searchTerm));displaySearchResults(results,searchTerm);};document.getElementById('country-search-input').addEventListener('keypress',handleSearch);document.getElementById('country-search-input-quiz').addEventListener('keypress',handleSearch);document.getElementById('start-general-quiz-btn').addEventListener('click',startGeneralQuiz);document.getElementById('start-general-quiz-btn-quiz').addEventListener('click',startGeneralQuizFromQuizTab);document.getElementById('start-challenge-btn').addEventListener('click',()=>{switchTab('quiz');startChallenge();});document.getElementById('start-challenge-btn-quiz').addEventListener('click',startChallenge);document.getElementById('next-question-btn').addEventListener('click',nextCountryQuestion);document.getElementById('next-general-question-btn').addEventListener('click',nextGeneralQuestion);document.getElementById('finish-challenge-btn').addEventListener('click',finishChallenge);document.getElementById('challenge-input').addEventListener('keypress',handleChallengeInput);document.getElementById('back-to-quiz-options-btn').addEventListener('click',showQuizOptions);document.getElementById('back-home-from-results-btn').addEventListener('click',goToHome);document.getElementById('back-home-from-general-results-btn').addEventListener('click',goToHome);document.getElementById('back-home-from-challenge-btn').addEventListener('click',goToHome);document.getElementById('retake-quiz-btn').addEventListener('click',retakeCountryQuiz);document.getElementById('retake-general-quiz-btn').addEventListener('click',retakeGeneralQuiz);document.getElementById('start-another-challenge-btn').addEventListener('click',showQuizOptions);document.querySelectorAll('.nav-btn').forEach(btn=>{btn.addEventListener('click',()=>{const tab=btn.getAttribute('data-tab');switchTab(tab);});});}
function switchTab(tab){if(tab==='home'){currentTab='home';document.querySelectorAll('.tab-view').forEach(view=>view.classList.add('hidden'));document.getElementById('home-page').classList.remove('hidden');}else if(tab==='quiz'){currentTab='quiz';document.querySelectorAll('.tab-view').forEach(view=>view.classList.add('hidden'));document.getElementById('quiz-page').classList.remove('hidden');showQuizOptions();}else if(tab==='data'){currentTab='data';document.querySelectorAll('.tab-view').forEach(view=>view.classList.add('hidden'));document.getElementById('data-page').classList.remove('hidden');displaySessionData();}}
function displaySearchResults(results, searchTerm) {
if (results.length === 0) {
alert(`No countries found matching "${searchTerm}".`);
return;
}
const container = document.getElementById('search-results-container');
container.innerHTML = '';
results.forEach(country => {
const card = document.createElement('div');
card.className = 'country-card';
card.innerHTML = `<img src="${country.flags.png}" alt="Flag of ${country.name.common}" class="country-flag" /><h3>${country.name.common}</h3><p><strong>Capital:</strong> ${country.capital ? country.capital[0] : 'N/A'}</p><p><strong>Population:</strong> ${country.population.toLocaleString()}</p><p><strong>Region:</strong> ${country.region}</p><button class="btn btn-secondary take-quiz-btn" data-country="${country.name.common}">Take Quiz</button>`;
container.appendChild(card);
});
document.querySelectorAll('.take-quiz-btn').forEach(btn => {
btn.addEventListener('click', (e) => {
const countryName = e.target.getAttribute('data-country');
startCountryQuiz(countryName);
});
});
showQuizInnerPage('search-results-page-inner');
}
function startCountryQuiz(countryName) {
selectedCountryForQuiz = allCountries.find(c => c.name.common === countryName);
if (!selectedCountryForQuiz) return;
currentQuiz = generateCountryQuiz(selectedCountryForQuiz);
currentQuizAnswers = [];
document.getElementById('quiz-title').textContent = `Quiz: ${countryName}`;
document.getElementById('question-counter').textContent = 'Question 1 of 5';
document.getElementById('progress-fill').style.width = '20%';
showQuizInnerPage('country-quiz-page-inner');
displayCountryQuestion(0);
}
function generateCountryQuiz(country){const questions=[];questions.push({type:'capital',text:`What is the capital of ${country.name.common}?`,correct:country.capital?country.capital[0]:'N/A',options:generateCapitalOptions(country)});questions.push({type:'population',text:`Approximately how many people live in ${country.name.common}?`,correct:getPopulationRange(country.population),options:generatePopulationOptions(country.population)});questions.push({type:'region',text:`Which region is ${country.name.common} located in?`,correct:country.region,options:['Africa','Americas','Asia','Europe','Oceania']});questions.push({type:'subregion',text:`Which subregion is ${country.name.common} part of?`,correct:country.subregion||'N/A',options:generateSubregionOptions(country.region)});questions.push({type:'flag',text:`Which country's flag is this?`,correct:country.name.common,flagUrl:country.flags.png,options:generateFlagOptions(country)});return questions;}
function generateCapitalOptions(correctCountry){const options=[correctCountry.capital?correctCountry.capital[0]:'N/A'];while(options.length<4){const randomCountry=allCountries[Math.floor(Math.random()*allCountries.length)];const capital=randomCountry.capital?randomCountry.capital[0]:'N/A';if(!options.includes(capital))options.push(capital);}return shuffleArray(options);}
function generatePopulationOptions(correctPopulation){return['Less than 1 million','1-10 million','10-50 million','50-100 million','100-500 million','More than 500 million'];}
function getPopulationRange(population){if(population<1000000)return'Less than 1 million';if(population<10000000)return'1-10 million';if(population<50000000)return'10-50 million';if(population<100000000)return'50-100 million';if(population<500000000)return'100-500 million';return'More than 500 million';}
function generateSubregionOptions(region){const subregions={Africa:['Northern Africa','Eastern Africa','Western Africa','Southern Africa','Middle Africa'],Americas:['North America','South America','Central America','Caribbean'],Asia:['Western Asia','Central Asia','Southern Asia','Eastern Asia','Southeast Asia'],Europe:['Northern Europe','Western Europe','Eastern Europe','Southern Europe'],Oceania:['Australia and New Zealand','Melanesia','Micronesia','Polynesia']};return subregions[region]||[];}
function generateFlagOptions(correctCountry){const options=[correctCountry.name.common];while(options.length<4){const randomCountry=allCountries[Math.floor(Math.random()*allCountries.length)];if(!options.includes(randomCountry.name.common))options.push(randomCountry.name.common);}return shuffleArray(options);}
function shuffleArray(array){for(let i=array.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[array[i],array[j]]=[array[j],array[i]];}return array;}
function displayCountryQuestion(index) {
const question = currentQuiz[index];
const container = document.getElementById('question-container');
if (question.type === 'flag') {
container.innerHTML = `<div class="question"><p>${question.text}</p><img src="${question.flagUrl}" alt="Country flag" class="question-flag" /><div class="options">${question.options.map(option => `<button class="option-btn" data-answer="${option}">${option}</button>`).join('')}</div></div>`;
} else {
container.innerHTML = `<div class="question"><p>${question.text}</p><div class="options">${question.options.map(option => `<button class="option-btn" data-answer="${option}">${option}</button>`).join('')}</div></div>`;
}
document.querySelectorAll('.option-btn').forEach(btn => {
btn.addEventListener('click', (e) => {
const answer = e.target.getAttribute('data-answer');
currentQuizAnswers[index] = answer;
nextCountryQuestion();
});
});
}
function nextCountryQuestion() {
const currentIndex = currentQuizAnswers.length;
if (currentIndex < currentQuiz.length) {
document.getElementById('question-counter').textContent = `Question ${currentIndex + 1} of 5`;
document.getElementById('progress-fill').style.width = `${((currentIndex + 1) / 5) * 100}%`;
displayCountryQuestion(currentIndex);
} else {
finishCountryQuiz();
}
}
function finishCountryQuiz() {
let score = 0;
const quizResults = {
country: selectedCountryForQuiz.name.common,
timestamp: new Date().toLocaleString(),
questions: []
};
currentQuiz.forEach((question, index) => {
const userAnswer = currentQuizAnswers[index];
let correct = false;
if (question.type === 'capital' || question.type === 'region' || question.type === 'subregion' || question.type === 'flag') {
correct = userAnswer === question.correct;
} else if (question.type === 'population') {
correct = userAnswer === question.correct;
}
if (correct) score++;
quizResults.questions.push({
question: question.text,
userAnswer: userAnswer,
correctAnswer: question.correct,
isCorrect: correct
});
});
quizResults.score = score;
quizResults.totalQuestions = 5;
sessionData.countryQuizzes.push(quizResults);
saveData();
document.getElementById('final-score').textContent = `Your Score: ${score}/5`;
const finishBtn = document.getElementById('finish-quiz-btn');
if (finishBtn) finishBtn.remove();
showQuizInnerPage('country-quiz-results-page-inner');
}
function startGeneralQuiz() {
switchTab('quiz');
startGeneralQuizFromQuizTab();
}
function startGeneralQuizFromQuizTab() {
generalQuizData = generateGeneralQuiz();
generalQuizAnswers = [];
document.getElementById('general-question-counter').textContent = 'Question 1 of 20';
document.getElementById('general-progress-fill').style.width = '5%';
showQuizInnerPage('general-quiz-page-inner');
displayGeneralQuestion(0);
}
function generateGeneralQuiz(){const questions=[];for(let i=0;i<20;i++){const randomCountry=allCountries[Math.floor(Math.random()*allCountries.length)];const questionType=Math.floor(Math.random()*4);if(questionType===0)questions.push({type:'capital',text:`What is the capital of ${randomCountry.name.common}?`,correct:randomCountry.capital?randomCountry.capital[0]:'N/A',options:generateCapitalOptions(randomCountry)});else if(questionType===1)questions.push({type:'population',text:`Approximately how many people live in ${randomCountry.name.common}?`,correct:getPopulationRange(randomCountry.population),options:generatePopulationOptions(randomCountry.population)});else if(questionType===2)questions.push({type:'region',text:`Which region is ${randomCountry.name.common} located in?`,correct:randomCountry.region,options:['Africa','Americas','Asia','Europe','Oceania']});else questions.push({type:'flag',text:`Which country's flag is this?`,correct:randomCountry.name.common,flagUrl:randomCountry.flags.png,options:generateFlagOptions(randomCountry)}); }return{questions};}
function displayGeneralQuestion(index) {
const question = generalQuizData.questions[index];
const container = document.getElementById('general-question-container');
if (question.type === 'flag') {
container.innerHTML = `<div class="question"><p>${question.text}</p><img src="${question.flagUrl}" alt="Country flag" class="question-flag" /><div class="options">${question.options.map(option => `<button class="option-btn" data-answer="${option}">${option}</button>`).join('')}</div></div>`;
} else {
container.innerHTML = `<div class="question"><p>${question.text}</p><div class="options">${question.options.map(option => `<button class="option-btn" data-answer="${option}">${option}</button>`).join('')}</div></div>`;
}
document.querySelectorAll('#general-question-container .option-btn').forEach(btn => {
btn.addEventListener('click', (e) => {
const answer = e.target.getAttribute('data-answer');
generalQuizAnswers[index] = answer;
nextGeneralQuestion();
});
});
}
function nextGeneralQuestion() {
const currentIndex = generalQuizAnswers.length;
if (currentIndex < generalQuizData.questions.length) {
document.getElementById('general-question-counter').textContent = `Question ${currentIndex + 1} of 20`;
document.getElementById('general-progress-fill').style.width = `${((currentIndex + 1) / 20) * 100}%`;
displayGeneralQuestion(currentIndex);
} else {
finishGeneralQuiz();
}
}
function finishGeneralQuiz() {
let score = 0;
const quizResults = {
timestamp: new Date().toLocaleString(),
questions: []
};
generalQuizData.questions.forEach((question, index) => {
const isCorrect = generalQuizAnswers[index] === question.correct;
if (isCorrect) score++;
quizResults.questions.push({
question: question.text,
userAnswer: generalQuizAnswers[index],
correctAnswer: question.correct,
isCorrect: isCorrect
});
});
quizResults.score = score;
quizResults.totalQuestions = 20;
sessionData.generalQuizzes.push(quizResults);
saveData();
document.getElementById('general-final-score').textContent = `Your Score: ${score}/20`;
const finishBtn = document.getElementById('finish-general-quiz-btn');
if (finishBtn) finishBtn.remove();
showQuizInnerPage('general-quiz-results-page-inner');
}
function startChallenge() {
challengeNamedCountries.clear();
challengeCountriesList = [...allCountries];
challengeTimer = setInterval(updateChallengeTimer, 1000);
document.getElementById('timer').textContent = '30:00';
document.getElementById('country-count').textContent = 'Countries: 0';
document.getElementById('challenge-input').value = '';
document.getElementById('challenge-countries').innerHTML = '';
showQuizInnerPage('challenge-page-inner');
}
function updateChallengeTimer() {
const timerElement = document.getElementById('timer');
const timeParts = timerElement.textContent.split(':');
let minutes = parseInt(timeParts[0]);
let seconds = parseInt(timeParts[1]);
seconds--;
if (seconds < 0) {
seconds = 59;
minutes--;
}
if (minutes < 0) {
finishChallenge();
return;
}
timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
function handleChallengeInput(event) {
if (event.key !== 'Enter') return;
const input = event.target.value.toLowerCase().trim();
if (!input) return;
const country = challengeCountriesList.find(c =>
c.name.common.toLowerCase() === input ||
c.name.official.toLowerCase() === input
);
if (country && !challengeNamedCountries.has(country.name.common)) {
challengeNamedCountries.add(country.name.common);
const list = document.getElementById('challenge-countries');
const item = document.createElement('div');
item.className = 'challenge-country-item';
item.textContent = country.name.common;
list.appendChild(item);
document.getElementById('country-count').textContent = `Countries: ${challengeNamedCountries.size}`;
}
event.target.value = '';
}
function finishChallenge() {
if (challengeTimer) clearInterval(challengeTimer);
const challengeResults = {
timestamp: new Date().toLocaleString(),
countriesGuessed: challengeNamedCountries.size,
countriesMissed: challengeCountriesList.length - challengeNamedCountries.size,
missedCountries: challengeCountriesList.filter(country => !challengeNamedCountries.has(country.name.common))
};
sessionData.challenges.push(challengeResults);
saveData();
document.getElementById('challenge-final-score').textContent = `Countries Named: ${challengeNamedCountries.size}`;
showQuizInnerPage('challenge-results-page-inner');
}
function showQuizInnerPage(pageId) {
document.querySelectorAll('.quiz-inner-page').forEach(page => page.classList.add('hidden'));
document.getElementById(pageId).classList.remove('hidden');
}
function showQuizOptions() {
showQuizInnerPage('quiz-options-page-inner');
}
function goToHome() {
switchTab('home');
}
function retakeCountryQuiz() {
if (selectedCountryForQuiz) {
startCountryQuiz(selectedCountryForQuiz.name.common);
}
}
function retakeGeneralQuiz() {
startGeneralQuizFromQuizTab();
}
function displaySessionData() {
displayCountryQuizStats();
displayGeneralQuizStats();
displayChallengeStats();
}
function displayCountryQuizStats() {
const statsDiv = document.getElementById('country-quiz-stats');
if (!statsDiv) return;
if (sessionData.countryQuizzes.length === 0) {
statsDiv.innerHTML = '<p>No country quizzes completed yet.</p>';
return;
}
let html = '<h3>Country Quiz Results</h3>';
sessionData.countryQuizzes.forEach((quiz, index) => {
html += `<div class="quiz-result"><h4>Quiz ${index + 1} - ${quiz.country} (${quiz.timestamp})</h4><p>Score: ${quiz.score}/5</p><details><summary>View Details</summary><ul>`;
quiz.questions.forEach(q => {
html += `<li class="${q.isCorrect ? 'correct' : 'incorrect'}">${q.question}<br>Your answer: ${q.userAnswer}<br>Correct answer: ${q.correctAnswer}</li>`;
});
html += '</ul></details></div>';
});
statsDiv.innerHTML = html;
}
function displayGeneralQuizStats() {
const statsDiv = document.getElementById('general-quiz-stats');
if (!statsDiv) return;
if (sessionData.generalQuizzes.length === 0) {
statsDiv.innerHTML = '<p>No general quizzes completed yet.</p>';
return;
}
let html = '<h3>General Quiz Results</h3>';
sessionData.generalQuizzes.forEach((quiz, index) => {
html += `<div class="quiz-result"><h4>Quiz ${index + 1} (${quiz.timestamp})</h4><p>Score: ${quiz.score}/20</p><details><summary>View Details</summary><ul>`;
quiz.questions.forEach(q => {
html += `<li class="${q.isCorrect ? 'correct' : 'incorrect'}">${q.question}<br>Your answer: ${q.userAnswer}<br>Correct answer: ${q.correctAnswer}</li>`;
});
html += '</ul></details></div>';
});
statsDiv.innerHTML = html;
}
function displayChallengeStats() {
const statsDiv = document.getElementById('challenge-stats');
if (!statsDiv) return;
if (sessionData.challenges.length === 0) {
statsDiv.innerHTML = '<p>No challenges completed yet.</p>';
return;
}
let html = '<h3>Challenge Results</h3>';
sessionData.challenges.forEach((challenge, index) => {
html += `<div class="quiz-result"><h4>Challenge ${index + 1} (${challenge.timestamp})</h4><p>Countries Named: ${challenge.countriesGuessed}</p><details><summary>View Details</summary><p><strong>Missed Countries:</strong></p><ul>`;
challenge.missedCountries.forEach(country => {
html += `<li>${country.name.common}</li>`;
});
html += '</ul></details></div>';
});
statsDiv.innerHTML = html;
} 
document.addEventListener('DOMContentLoaded', initializeApp);