# PhoneGap HotShot 3.x Mobile Application Development Code Bundle

This repository stores the code for the book entitled PhoneGap HotShot 3.x Mobile Application Development published by Packt Publishing. You can purchase the book at [Packt's Site](http://www.packtpub.com/phonegap-3-x-mobile-application-development-hotshot/book). If you obtained the code package from Packt, you may wish to download the package from GitHub in order to receive the most recent changes. The package is available at [https://github.com/kerrishotts/PhoneGap-HotShot-3-x-Code-Bundle](https://github.com/kerrishotts/PhoneGap-HotShot-3-x-Code-Bundle).

The code herein is not listed in chapter order but by project name. A lookup from chapter number to project name is provided below.

Furthermore, the code herein is not a complete Cordova project. The build artifacts (namely the `platforms`, `plugins`, etc., directories) are ignored. Only the `www` directory and `config.xml` file for each project is provided. In order to execute any of these projects, you'll need to create a new Cordova project and copy the relevant files from this repository into your project.

# Table of Contents

* [Chapter/Project Lookup](#chapterproject-lookup)
* [Application Demos](#application-demos)
* [Useful Directories](#useful-directories)
* [Useful Scripts](#useful-scripts)
* [Using PhoneGap Build](#using-phonegap-build)
* [Additional Project Information](#additional-project-information)
* [License](#license)

## [Chapter/Project Lookup](id:chapterproject-lookup)

|    Chapter | Title                              | Project           | App.io Demo
|-----------:|:---------------------------------- |:------------------|:------------
|          1 | Your First Project                 | Not applicable    | N/A
|          2 | Localization and Globalization     | [LocalizationDemo](#localizationdemo)  | N/A
|          3 | App Design                         | [FilerV1](#filerv1)           | See v7
|          4 | The File API                       | [FilerV2](#filerv2)           | See v7
|          5 | Working with Audio                 | [FilerV3](#filerv3)           | See v7
|          6 | Working with Still images          | [FilerV4](#filerv4)           | See v7
|          7 | Working with Video                 | [FilerV5](#filerv5)           | See v7
|          8 | Sharing Content                    | [FilerV6](#filerv6)           | See v7
|          9 | Devices of Different Sizes         | [FilerV7](#filerv7)           | [Demo](https://app.io/v6Fbyf) (offsite)
|         10 | Maps and GPS                       | [PathRec](#pathrec)           | [Demo](https://app.io/v6Fbyf) (offsite)
|         11 | Canvas Games and the Accelerometer | [CaveRunner](#caverunner)        | See v2
|         12 | Adding a Back-end (Parse)          | [CaveRunner2](#caverunner2)       | [Demo](https://app.io/kAxEF4) (offsite)
|         13 | Native Controls (online)           | [PathRecNative](#pathrecNative)           | N/A
| Appendix A | User Interface Resources           | Not Applicable    | N/A
| Appendix B | Tips, Tricks, and Quirks           | Not Applicable    | N/A

## [Application Demos](id:application-demos)

I've taken the time to upload the final versions of Filer, PathRec, and CaveRunner to [App.io](http://www.app.io) at the following links. **Note:** It is not possible to simulate all aspects of each app; pay attention to what features are not available.

* [CaveRunner v2](https://app.io/kAxEF4) (offsite)
  * Using the accelerometer will not work, but you can simulate a swipe by clicking and dragging with your mouse.
* [Filer v7](https://app.io/v6Fbyf) (offsite)
  * You can not record audio, video, or capture an image from the camera. App.io does not pass your device's microphone or webcam to the app. You can create the note types, but you won't be able to supply any content. 
* [PathRec](https://app.io/kAxEF4) (offsite)
  * App.io does not pass your device location to the app. As such, you will be unable to center on a location or record a path. Consider this a user-interface demo, since there's little else you can do.


## [Useful Directories](id:useful-directories)

Other than the actual code for each project, the following directories may be of interest to you:

* `/design`
  * Contains icons and splash screen for each project, except the localization demo. Also contains design documents for each project in PDF and OmniGraffle format.
* `/template`
  * Contains the template we used to create each project (`cordova create ... --copy-from ./template`). This is built in Chapter 2, but you are free to use this copy instead of working through those steps.
* `/framework`
  * Contains the version of the YASMF-Next framework that was used to build the projects. You are welcome to update the framework version at any time, but it is always possible that new framework versions might break the apps.

## [Useful Scripts](id:useful-scripts)

Contained within the top level of this project are several useful scripts. **NOTE:** Your use of these scripts is at your own risk. Neither the author of the book and code nor Packt Publishing can be held liable for the use, abuse, or misuse of these scripts.

* `copyIcons.shl`
  * Copies the icons from the design folders into a specific project. Take a peek inside to see how we overwrite Cordova's stock icons.
  * Useful when you first create a new project, after you add the platforms to the project. Also useful if you need to remove the platform for any reason and then add it back.
  * Example: `sh copyIcons.shl design/filer-icon-v7 filerv7 FilerV7` (the third parameter is the Xcode project name, located in `/platforms/ios`)
* `copySplash.shl`
  * Copies the splash screens from the design folders into a specific project. Take a peek inside to see how we overwrite Cordova's stock splash screens for iOS.
  * Useful when you first create a new project, after you add the platforms to the project. Also useful if you need to remove the platform for any reason and then add it back.
  * Example: `sh copySplash.shl design/filer-splash filerv7 FilerV7`
* `copyIconsAndSplashes.shl` 
  * This script automates the process of copying all the icons and splash screens for each project into their corresponding platform directories.
  * Example: `sh copyIconsAndSplashes.shl`
* `updateProjectPlugins.shl`
  * Updates the Cordova platform on each project to the most recent version. ***Careful!** Things may break!*      
  * Updates all the plugins for each project to the most recent version by removing them and adding them back. ***Careful!** Things will probably break!*
* `createProject.shl`
  * Creates a project based on one of our projects.
  * Example: `sh ./createProject.shl filerv1 FilerV1`
* `createProjects.shl`
  * Run this command to create all the Cordova projects automatically. Once created, each project will be automatically updated, and all plugins will be added. Icons and splash screens will also be created. 
  * Example: `sh ./createProjects.shl`
  
Note that these scripts are shell scripts that should work on Mac OS X or Linux. If you want to use them on Windows, you'll need to adapt them to the correct syntax.

## [Using PhoneGap Build](id:using-phonegap-build)

The projects as delivered are *Cordova* projects. In order to utilize them with PhoneGap build, you will need to follow these steps:

* Copy `config.xml` from the application root to the `www` directory.
* Add the required plugins to `config.xml`, using the form:

```
<gap:plugin name="reverse.domain.id"/>
```
* If you want to add the icon and splash screen assets to the project, you'll need to copy the appropriate icons from the `design` directory into the project's `www` directory, and then update `config.xml` using [these directions](http://docs.build.phonegap.com/en_US/configuring_icons_and_splash.md.html#Icons%20and%20Splash%20Screens).
* Upload the project to PhoneGap Build by using `phonegap remote build android` (or `ios`). 


## [Additional Project Information](id:additional-project-information)

### [LocalizationDemo](id:localizationdemo)

Introduces you to the various localization functions provided by jQuery/Globalize and YASMF. Nothing fancy: just a list of translated strings, but important to get right from the start.

#### Plugins Required
```
cordova plugin add org.apache.cordova.globalization
```

### [FilerV1](id:filerv1)

The very first version of our note taking app, Filer. Sets up the typical project structure, data models, and also gets into `localStorage`.

#### Plugins Required 
```
cordova plugin add org.apache.cordova.globalization
cordova plugin add org.apache.cordova.keyboard
```

### [FilerV2](id:filerv2)

The second version of Filer. The key point is using the File API to write to persistent storage. 

#### Plugins Required
```
cordova plugin add org.apache.cordova.globalization
cordova plugin add org.apache.cordova.keyboard
cordova plugin add org.apache.cordova.file
```

### [FilerV3](id:filerv3)

In the third version of Filer, we extend the app to permit audio memos. 

#### Plugins Required
```
cordova plugin add org.apache.cordova.globalization
cordova plugin add org.apache.cordova.keyboard
cordova plugin add org.apache.cordova.file
cordova plugin add org.apache.cordova.media
```

### [FilerV4](id:filerv4)

In the fourth version of Filer, we extend the app to permit image notes obtained from the camera. 

#### Plugins Required
```
cordova plugin add org.apache.cordova.globalization
cordova plugin add org.apache.cordova.keyboard
cordova plugin add org.apache.cordova.file
cordova plugin add org.apache.cordova.media
cordova plugin add org.apache.cordova.camera
```

### [FilerV5](id:filerv5)

In the fifth version of Filer, we extend the app to permit video notes obtained from the camera. 

#### Plugins Required
```
cordova plugin add org.apache.cordova.globalization
cordova plugin add org.apache.cordova.keyboard
cordova plugin add org.apache.cordova.file
cordova plugin add org.apache.cordova.media
cordova plugin add org.apache.cordova.camera
cordova plugin add org.apache.cordova.media-capture
```

### [FilerV6](id:filerv6)

In the sixth version of Filer, we extend the app to share notes to various social networks. 

#### Plugins Required
```
cordova plugin add org.apache.cordova.globalization
cordova plugin add org.apache.cordova.keyboard
cordova plugin add org.apache.cordova.file
cordova plugin add org.apache.cordova.media
cordova plugin add org.apache.cordova.camera
cordova plugin add org.apache.cordova.media-capture
cordova plugin add https://github.com/leecrossley/cordova-plugin-social-message.git
cordova plugin add org.apache.cordova.battery-status
cordova plugin add org.apache.cordova.network-information
```

### [FilerV7](id:filerv7)

In the seventh version of Filer, we learn to deal with tablet form factors. 

#### Plugins Required
```
cordova plugin add org.apache.cordova.globalization
cordova plugin add org.apache.cordova.keyboard
cordova plugin add org.apache.cordova.file
cordova plugin add org.apache.cordova.media
cordova plugin add org.apache.cordova.camera
cordova plugin add org.apache.cordova.media-capture
cordova plugin add https://github.com/leecrossley/cordova-plugin-social-message.git
cordova plugin add org.apache.cordova.battery-status
cordova plugin add org.apache.cordova.network-information
cordova plugin add com.photokandy.localstorage
```

### [PathRec](id:pathrec)

PathRec is a simple app that uses the geolocation API to record paths and show them to the user. Uses localStorage for simplicity.

#### Plugins Required
```
cordova plugin add org.apache.cordova.globalization
cordova plugin add org.apache.cordova.geolocation
cordova plugin add org.apache.cordova.keyboard
cordova plugin add org.apache.cordova.statusbar
cordova plugin add com.photokandy.localstorage
```

### [PathRecNative](id:pathrecnative)

PathRecNative is an extension of the PathRec app using some native controls. Works only on iOS 7.

#### Plugins Required
```
cordova plugin add org.apache.cordova.globalization
cordova plugin add org.apache.cordova.geolocation
cordova plugin add org.apache.cordova.keyboard
cordova plugin add org.apache.cordova.statusbar
cordova plugin add com.photokandy.nativecontrols
cordova plugin add com.photokandy.localstorage
```


### [CaveRunner](id:caverunner)

Cave Runner is a simple HTML5 Canvas game that uses the accelerometer as one of its input methods.

#### Plugins Required
```
cordova plugin add org.apache.cordova.globalization
cordova plugin add org.apache.cordova.device-motion
cordova plugin add org.apache.cordova.keyboard
cordova plugin add org.apache.cordova.statusbar
```

### [CaveRunner2](id:caverunner2)

Cave Runner 2 extends Cave Runner with a Parse back end that provides high score functionality. 

**NOTE**: The `www/js/app.js` file is *NOT* provided, as you need to provide your own API keys. You can copy the version from caverunner and add the following code to initialize Parse prior to `APP.start()`:

```
  Parse.initialize("YOUR_APP_ID_HERE", "YOUR_JAVASCRIPT_KEY_HERE");
```

#### Plugins Required
```
cordova plugin add org.apache.cordova.globalization
cordova plugin add org.apache.cordova.device-motion
cordova plugin add org.apache.cordova.keyboard
cordova plugin add org.apache.cordova.statusbar
```


## [License](id:license)

The code herein is licensed under the MIT license. You are free to with it as you will, provided the requirements of said license are met.

```
Copyright (c) 2013, 2014 Packt Publishing
Permission is hereby granted, free of charge, to any person obtaining a copy of this
software and associated documentation files (the "Software"), to deal in the Software
without restriction, including without limitation the rights to use, copy, modify,
merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to the following
conditions:
The above copyright notice and this permission notice shall be included in all copies
or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT
OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
```
