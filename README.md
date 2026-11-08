# EventSphere - Symposium Management & Workshop Registration (Prototype v3)

Static prototype. No install, no build. Data lives in the browser (localStorage).

## Run in VS Code
1. File > Open Folder > select this folder.
2. Right-click `index.html` > Open with Live Server (or open the file directly in Chrome).

## Run from CMD
    git clone https://github.com/srikarviswanath06-oss/EventSphere---Symposium-Management-Workshop-Registration eventsphere
    cd eventsphere
    npm start
Then open http://localhost:5500

## Login
Fields start empty. Type your own details, or use "New here? Create account"
(student: roll number needed; organizer: invite code ORG2026).
Demo accounts are behind "Show demo accounts for the review" on the sign-in card:
student@eec.edu / stud@123, organizer@eec.edu / org@123, admin@eec.edu / admin@123.
Forgot password: sign-in card > "Forgot password?". The 6-digit code appears in a demo inbox box (no mail server).

## Features
Student: search, category chips, filters, sort, pagination; save events; one-click register; clash warning;
waitlist with auto-promotion; ticket with code; add to calendar (.ics); month calendar view; rate events after they end;
certificate (after check-in) with print / save as PDF; profile.
Organizer: create/edit/duplicate/delete; poster image upload; attendees with check-in; check-in desk by ticket ID;
CSV/JSON download; announcements; request more seats (admin approves); see feedback and ratings.
Admin: approve/reject events (with reason); approve/reject seat requests; all events + CSV; user management;
reports with line chart (registrations per day), donut (category share), fill rates, top rated; print report as PDF; activity log.
Everyone: per-user notifications, dark mode, text size (Normal / Large / Extra large), change password, reset demo data.
Sidebar "API console" shows the REST calls, DB schema and JWT a real backend would use. It is simulated: nothing leaves the browser.

## Prototype limits
There is no server. Accounts, passwords and roles live in localStorage, so anyone with dev tools can change them.
Treat it as a clickable demo, not a secure system. A real build needs the Express + MongoDB backend shown in the API console.

## Files
- index.html  page shell (sign-in hero, sidebar, top bar)
- css/style.css  design system (tokens at the top, role accent colours)
- js/app.js  sections: helpers + icons, data + storage, auth, shell, student, organizer, admin, dialogs
