# Fitness Activity Tracker

A beginner-friendly full-stack project made with HTML, CSS, JavaScript and Node.js.
It uses Node.js built-in modules only, so you do not need to install Express or a database.

## Requirements
- Node.js (LTS version recommended)
- VS Code (recommended)
- A modern browser

## Run on Windows
1. Extract the ZIP file.
2. Open VS Code.
3. Select **File > Open Folder** and choose `Fitness_Activity_Tracker`.
4. In VS Code, choose **Terminal > New Terminal**.
5. Check Node.js is installed:
   `node -v`
6. Start the app:
   `npm start`
   (You can also run `node server.js`.)
7. Keep the terminal open and visit `http://localhost:3000` in Chrome or Edge.
8. Add an activity using the form. It should appear in Recent Activities and the summary cards should update.
9. To stop the server, click the terminal and press `Ctrl + C`.

## How it works
- `public/index.html`: page structure and form.
- `public/style.css`: colors, layout, and responsive design.
- `public/app.js`: browser-side JavaScript; sends requests to the server and updates the dashboard.
- `server.js`: Node.js server; serves the site and implements the activity API.
- `data/activities.json`: local file where activity records are stored.

## Features
- Add walking, running, cycling, swimming, gym, yoga, and other activities.
- Record duration, calories, distance, date, and notes.
- Dashboard totals update automatically.
- Recent activity list and delete action.
- Activities remain saved after restarting the server because they are stored in `data/activities.json`.

## Important
This is an educational demo. It does not automatically read steps from a phone or smartwatch, and calories are values entered by the user. Do not enter private medical information.
