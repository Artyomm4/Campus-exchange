# Campus Exchange Hub

A front-end classified marketplace prototype for the Web Application and Software Architecture final project.

## Quick start

1. Extract the project folder.
2. Open `index.html` in a modern browser.
3. For the JSON/AJAX demonstration, serve the folder from a small local web server. For example:
   - VS Code Live Server
   - `python -m http.server` from the project folder
4. Use the role selector in the header to demonstrate the three scenario roles.

### Demo roles

- **Visitor** — browse, search, save listings, send inquiries and report a listing.
- **Member** — all visitor actions plus create/edit/delete their own listings and manage incoming inquiries.
- **Moderator** — review reports and remove reported listings.

The role selector is intentionally a front-end simulation. It is not authentication and is documented as such in the technical report.

## Project structure

```text
campus_exchange_hub/
├── index.html
├── browse.html
├── detail.html
├── create.html
├── dashboard.html
├── favorites.html
├── moderator.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── data/
│   └── seed.json
└── docs/
    ├── README.txt
    └── Technical_Report_Campus_Exchange_Hub.pdf
```

## Technical notes

The application uses HTML5, external CSS, JavaScript, jQuery, JSON and browser `localStorage`. The seed file is loaded with jQuery `$.getJSON()` when the project is served over HTTP. A small fallback dataset keeps the application usable when opened directly as a local file.

User-created listings, inquiries, reports and favorites are persisted in `localStorage`, so the demonstration survives a page reload. In a production system, trusted data, authentication and authorization would be handled server-side.

## Reset the demo

To return the browser to a clean state, open developer tools and run:

```js
localStorage.clear();
location.reload();
```

## Suggested demonstration order

1. Browse as Visitor and use keyword/category/price filters.
2. Open a listing and send an inquiry.
3. Use **Report this listing** and submit a reason.
4. Switch to Member and create a new listing.
5. Reload the page and show that the new listing remains.
6. Edit the listing, save it, then delete it with the confirmation step.
7. Save a listing to Favorites and remove it again.
8. Switch to Moderator and resolve the report by removing the flagged listing.
9. In `js/app.js`, show the validation, role checks, localStorage persistence and text-node rendering.
