# Beaver-notes-pocket

Hey there! 👋 

Welcome to the Beaver Notes Pocket repository. This app is your note-taking companion, much like Beaver Notes on your PC but for your phone. It should support exporting and importing data between the desktop and mobile client so that you can access your notes wherever you want.

> 🔩 Please be aware that this application is still under heavy development. Therefore, you might want to backup the notes you take with it and check this repository weekly for updates and new features. Not everything works, so just scroll below to see if the state of the app fits your needs or not.


![Slice](https://github.com/Daniele-rolli/Beaver-notes-pocket/assets/67503004/05e6a41c-3113-46b6-8574-7cf97d6e2722)

## What Works 

- [x] Exporting data to Beavernotes
- [x] Headings
- [x] CodeBlock
- [x] Paragraphs
- [x] Highlight
- [x] Bold
- [x] Underline
- [x] Strikethorugh
- [x] Inline Block
- [x] Dark Mode
- [x] Search and Buttons below
- [x] Quote Block
- [x] ToolBar 
- [x] Lists
- [x] Images
- [x] Bookmarks

## Kinda Works

- [ ] Importing data from Beavernotes (Works only if the note is plain text withouth tags, linked notes, images).
- [ ] Links (They Work, but the way they are added will be modified)
- [ ] Katex (not implemented yet)
- [ ] Check Lists
      
## Doesn't work / not implemented 

- [ ] Note Linking
- [ ] Tags
- [ ] Archive
  

## To set up your machine for running Beaver Notes Pocket, follow these steps:

### Prerequisites:

- Node.js 16 or higher
- Yarn
- Visual Studio Code (VSCode) with the Ionic plugin
- Xcode (for iOS development) and/or Android Studio (for Android development)

### Installation Steps:

##### Clone the Repository: 
Start by cloning the Beaver Notes Pocket repository to your local machine. You can do this using Git by running the following command in your terminal:
```
git clone https://github.com/your-repo-url.git
```
##### Install Dependencies: 
Navigate to the cloned repository directory using your terminal and install the project's dependencies using Yarn. Run the following command:
```
cd beaver-notes-pocket
```
```
yarn install
```
##### Open in VSCode: 
Open the project folder in Visual Studio Code (VSCode) if it's not already open. Ensure you have the Ionic plugin installed in VSCode to work with Ionic projects effectively.

##### iOS and Android Setup (Optional): 
If you intend to develop for both iOS and Android, make sure you have Xcode (for iOS) and/or Android Studio (for Android) installed. Set up the necessary emulators or connect physical devices for testing.
##### Run the App: 
To run Beaver Notes Pocket on your local development server, use the following command:
```
ionic serve
```
This will launch the app in your default web browser for development.
##### Platform-Specific Builds (Optional): 
If you want to build the app for iOS or Android specifically, you can use Ionic's commands for that purpose. For example, to build an iOS app, you can use:
```
ionic build ios
```
And for Android:
```
ionic build android
```
These commands will generate platform-specific build files in the respective platform directories.

