# Student Management System

A simple, browser-based student management system built with plain HTML, CSS, and JavaScript. No frameworks, no backend — all data is saved locally in the browser using `localStorage`.

## Features

- **Dashboard** — quick overview: total students, today's attendance, average grade, and number of classes
- **Students** — add, edit, delete, search, and filter student records
- **Attendance** — mark students present or absent for any date
- **Grades** — record subject-wise scores and view auto-calculated letter grades
- **Sort** — click column headers on the Students table to sort by roll number, name, or class
- **Export** — download all student records as a CSV file

## Tech Stack

- HTML5
- CSS3 (custom properties, no framework)
- Vanilla JavaScript (ES6+)
- Browser `localStorage` for data persistence

## How to Run

1. Download or clone this repository
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge)
3. That's it — no build step, no server, no dependencies required

## Project Structure

├── index.html # Page structure and layout
├── styles.css # All styling (dark theme)
└── app.js # Application logic (CRUD, storage, rendering)

## Notes 

This project is being built as a learning exercise in full-stack fundamentals, focused on core JavaScript concepts like DOM manipulation, event handling, and browser storage before moving on to frameworks and backend integration.
