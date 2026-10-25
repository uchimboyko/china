'use strict';
// Set these URLs after uploading the two video files. Leave empty to show honest placeholders.
const MEDIA = { greeting: 'assets/visitka.mp4', lesson: '' };
// Set an HTTPS endpoint accepting JSON to enable real submission. Never put bot tokens here.
const FORM_ENDPOINT = 'https://formspree.io/f/xbdvwyza';
const questions = [
  { title: 'Для кого и зачем изучаем язык?', options: ['Для ребёнка', 'Для себя с нуля', 'Для путешествий'] },
  { title: 'Уже знакомы с китайским?', options: ['Начинаю с нуля', 'Знаю немного слов и фраз', 'Уже учусь — хочу продолжить'] },
  { title: 'Как часто вам удобно заниматься?', options: ['Один раз в неделю', 'Два раза в неделю', 'Хочу обсудить расписание'] },
  { title: 'В какое время удобнее заниматься?', options: ['Утром', 'Днём', 'Вечером', 'Гибкое расписание'] },
  { title: 'Когда хочется начать?', options: ['В ближайшее время', 'В течение месяца', 'Пока присматриваюсь'] }
];
let step = 0;
const answers = Array(questions.length).fill('');
const fields = document.querySelector('#quiz-fields');
const quizForm = document.querySelector('#quiz-form');
const result = document.querySelector('#quiz-result');
function renderQuestion() {
  fields.replaceChildren();
  const legend = document.createElement('legend');
  legend.textContent = questions[step].title;
  fields.append(legend);
  questions[step].options.forEach((option, index) => {
    const label = document.createElement('label');
    label.className = 'quiz-option';
    const input = document.createElement('input');
    input.type = 'radio'; input.name = 'answer'; input.value = option;
    input.checked = answers[step] === option;
    input.id = `answer-${step}-${index}`;
    input.addEventListener('change', () => { answers[step] = option; advanceQuiz(); });
    label.append(input, document.createTextNode(option)); fields.append(label);
  });
  document.querySelector('#quiz-step').textContent = `ВОПРОС 0${step + 1} / 0${questions.length}`;
  document.querySelector('#quiz-progress').value = step + 1;
  document.querySelector('#quiz-back').hidden = step === 0;
  document.querySelector('#quiz-next').textContent = answers[step] ? 'Дальше →' : 'Пропустить →';
}
quizForm.addEventListener('submit', event => {
  event.preventDefault();
  advanceQuiz();
});
function advanceQuiz() {
  if (step < questions.length - 1) { step++; renderQuestion(); const legend = fields.querySelector('legend'); legend.tabIndex = -1; legend.focus(); return; }
  quizForm.hidden = true; result.hidden = false;
  document.querySelector('#quiz-step').textContent = 'БЕСПЛАТНЫЙ ПРОБНЫЙ УРОК';
  document.querySelector('#result-title').tabIndex = -1;
  document.querySelector('#result-title').focus();
}
document.querySelector('#quiz-back').addEventListener('click', () => { if (step > 0) { step--; renderQuestion(); fields.querySelector('input').focus(); } });
document.querySelector('#quiz-reset').addEventListener('click', () => { step = 0; answers.fill(''); result.hidden = true; quizForm.hidden = false; renderQuestion(); fields.querySelector('input').focus(); });
document.querySelectorAll('[data-goal]').forEach(link => link.addEventListener('click', () => { step = 0; answers[0] = link.dataset.goal; result.hidden = true; quizForm.hidden = false; renderQuestion(); }));
document.querySelectorAll('[data-plan]').forEach(link => link.addEventListener('click', () => { document.querySelector('#interest').value = link.dataset.plan; }));
renderQuestion();
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() { menuButton.setAttribute('aria-expanded', 'false'); navigation.classList.remove('is-open'); }
menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; menuButton.setAttribute('aria-expanded', String(open)); navigation.classList.toggle('is-open', open); });
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.querySelectorAll('[data-dialog]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.dialog).showModal()));
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const box = dialog.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close(); } });
});
async function submitLead(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (form.dataset.submitting === 'true') return;
  const name = form.elements.name;
  const contact = form.elements.contact;
  const phone = contact.value.trim();
  const digits = phone.replace(/\D/g, '');
  contact.setCustomValidity(/^\+?[\d\s()\-]+$/.test(phone) && digits.length >= 10 && digits.length <= 15 ? '' : 'Введите номер телефона: от 10 до 15 цифр, можно с кодом страны.');
  if (!form.reportValidity()) return;
  const status = document.querySelector(form.id === 'quiz-lead-form' ? '#quiz-form-status' : '#form-status');
  status.hidden = false;
  const submit = form.querySelector('[type="submit"]'); submit.disabled = true;
  form.dataset.submitting = 'true';
  form.setAttribute('aria-busy', 'true');
  status.textContent = 'Отправляем…';
  try {
    const payload = {
      name: name.value.trim(), phone,
      interest: form.elements.interest?.value || 'Бесплатный пробный урок',
      source: form.id === 'quiz-lead-form' ? 'Квиз' : 'Форма записи',
      _subject: 'Новая заявка — Китайский с Кристиной',
      quiz: questions.map((question, index) => `${question.title}: ${answers[index] || 'Пропущено'}`).join('\n')
    };
    if (form.elements.consent) payload.consent = form.elements.consent.checked ? 'Да' : 'Нет';
    const response = await fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(20000) });
    const data = await response.json().catch(() => null);
    if (!response.ok || data?.errors?.length || data?.ok === false) {
      status.textContent = response.status === 429 ? 'Слишком много попыток. Подождите немного и повторите отправку.' : 'Не удалось отправить заявку. Повторите попытку или свяжитесь с нами по телефону +7 931 334-20-80.';
      return;
    }
    status.textContent = 'Заявка отправлена. Ожидайте, с вами свяжется менеджер.';
    form.reset();
    const dialog = document.querySelector('#success-dialog');
    if (!dialog.open) dialog.showModal();
  } catch {
    status.textContent = 'Не удалось подтвердить отправку. Проверьте соединение или свяжитесь с нами по телефону +7 931 334-20-80.';
  }
  finally { submit.disabled = false; form.dataset.submitting = 'false'; form.setAttribute('aria-busy', 'false'); }
}
document.querySelector('#lead-form').addEventListener('submit', submitLead);
document.querySelector('#quiz-lead-form').addEventListener('submit', submitLead);
document.querySelectorAll('#name, #contact, #quiz-name, #quiz-contact').forEach(input => input.addEventListener('input', () => input.setCustomValidity('')));
function mountVideo(selector, src, portrait) {
  if (!src) return;
  const container = document.querySelector(selector);
  const video = document.createElement('video'); video.controls = true; video.playsInline = true; video.preload = 'metadata'; video.src = src;
  if (portrait) video.poster = 'assets/kristina-beijing.jpg';
  video.className = portrait ? 'loaded-video portrait' : 'loaded-video';
  container.replaceChildren(video); container.classList.add('has-video');
}
mountVideo('.intro-video', MEDIA.greeting, true); mountVideo('.lesson-video', MEDIA.lesson, false);
document.querySelector('#year').textContent = new Date().getFullYear();
