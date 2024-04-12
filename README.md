# Project Title

## 1. Project Description

State your app in a nutshell, or one-sentence pitch. Give some elaboration on what the core features are.  
This browser based web application to ...

## 2. Names of Contributors

List team members and/or short bio's here...

-   Shawn Rim - I am excited to work on a project with my team members.
-   Jordan Nykoluk - I don't know much about coding
-   Alex Krantz - I am looking forward to working on this project

## 3. Technologies and Resources Used

List technologies (with version numbers), API's, icons, fonts, images, media or data sources, and other resources that were used.

-   HTML, CSS, JavaScript
-   Bootstrap 5.0 (Frontend library)
-   Firebase 8.0 (BAAS - Backend as a Service)
-   Google Fonts
-   Google Material Icons
-   Luxon v3.4.4
-   NoUISlider v15.7.1
-   Fuse.js v7.0.0
-   wNumb v1.2.0

## 4. Complete setup/installion/usage

State what a user needs to do when they come to your project. How do others start using your code or application?
Here are the steps ...

-   Install development packages with `npm install`
-   Copy the Firebase configuration object from your Firebase project settings into `scripts/FirebaseAPI_DTC15.js`
-   Run the development server with `npm start`

## 5. Known Bugs and Limitations

None that we know of. If you find any, please let us know.

## 6. Features for Future

What we'd like to build in the future:

-   Source ingredients from an API instead of hardcoding them in the database
-   Use AI to suggest recipes based on user groceries
-   Implement automatic tracking of grocery statistics
    -   Just needs to enable Firebase functions which requires a credit card
-   Allow users to create a list of groceries they need to buy

## 7. Contents of Folder

Content of the project folder:

```
1800_202410_DTC15
├── .git
├── .gitignore
├── .prettierignore              # Code formatting configuration
├── .prettierrc.json             # (same as above)
├── README.md                    # Project documentation
│
│   # Shared resources
├── components                   # Page fragments
│   ├── footer.html
│   ├── hero.html
│   ├── navbar
│   │   ├── authenticated.html
│   │   └── unauthenticated.html
│   └── stickyFooter.html
├── images                       # Images used by the application
│   └── logo.png
├── scripts                      # Shared scripts used by multiple pages
│   ├── authentication.js
│   ├── components.js
│   ├── dropdownFilter.js
│   ├── FirebaseAPI_DTC15.js     # Firebase configuration object (ignored by git)
│   ├── login.js
│   └── utils.js
├── styles
│   └── style.css
│
│   # Pages
├── 404.html
├── about.html
├── dashboard.html               # Landing page (authenticated)
├── index.html                   # Landing page (unauthenticated)
├── login.html
├── template.html
├── account                      # Account management pages
│   ├── index.html
│   ├── scripts
│   │   ├── index.js
│   │   └── statistics.js
│   └── statistics.html
├── groceries                    # Grocery management pages
│   ├── detail.html
│   ├── index.html
│   ├── new.html
│   └── scripts
│       ├── detail.js
│       ├── index.js
│       └── new.js
├── recipes                      # Recipe management pages
│   ├── detail.html
│   ├── edit.html
│   ├── index.html
│   ├── new.html
│   ├── review.html
│   ├── scripts
│   │   ├── detail.js
│   │   ├── edit.js
│   │   ├── index.js
│   │   ├── new.js
│   │   ├── review.js
│   │   └── share.js
│   └── share.html
│
│   # Firebase
├── .firebaserc
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── package.json
├── package-lock.json
├── schema.jsonc                # Firestore schema
└── storage.rules
```
