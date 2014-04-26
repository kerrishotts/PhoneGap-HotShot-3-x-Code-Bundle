# PhoneGap HotShot 3.x Mobile Application Development Code Bundle

This repository stores the code for the book entitled PhoneGap HotShot 3.x Mobile Application Development published by Packt Publishing. You can purchase the book at [Packt's Site](http://www.packtpub.com/phonegap-3-x-mobile-application-development-hotshot/book).

The code herein is not listed in chapter order but by project name. A lookup from chapter number to project name is provided below.

Furthermore, the code herein is not a complete Cordova project. The build artifacts (namely the `platforms`, `plugins`, etc., directories) are ignored. Only the `www` directory is provided. In order to execute any of these projects, you'll need to create a new Cordova project and copy the relevant files from this repository into your project.

## Chapter/Project Lookup

|    Chapter | Title                              | Project           |
|-----------:|:---------------------------------- |:------------------|
|          1 | Your First Project                 | Not applicable    |
|          2 | Localization and Globalization     | LocalizationDemo  |
|          3 | App Design                         | FilerV1           |
|          4 | The File API                       | FilerV2           |
|          5 | Working with Audio                 | FilerV3           |
|          6 | Working with Still images          | FilerV4           |
|          7 | Working with Video                 | FilerV5           |
|          8 | Sharing Content                    | FilerV6           |
|          9 | Dealing With Tablets               | FilerV7           |
|         10 | Maps and GPS                       | PathRec           |
|         11 | Canvas Games and the Accelerometer | CaveRunner        |
|         12 | Adding a Back-end (Parse)          | CaveRunner2       |
| Appendix A | Quick Design Pattern Reference     | Not Applicable    |
| Appendix B | Quirks and Gotchas                 | Not Applicable    |

## Additional Project Information

### LocalizationDemo

Introduces you to the various localization functions provided by jQuery/Globalize and YASMF. Nothing fancy: just a list of translated strings, but important to get right from the start.

#### Plugins Required
```
cordova plugin add org.apache.cordova.globalization
```

### FilerV1

The very first version of our note taking app, Filer. Sets up the typical project structure, data models, and also gets into `localStorage`.

#### Plugins Required 
```
cordova plugin add org.apache.cordova.globalization
cordova plugin add org.apache.cordova.keyboard
```

### FilerV2

The second version of Filer. The key point is using the File API to write to persistent storage. 

#### Plugins Required
```
cordova plugin add org.apache.cordova.globalization
cordova plugin add org.apache.cordova.keyboard
cordova plugin add org.apache.cordova.file
```

### FilerV3

In the third version of Filer, we extend the app to permit audio memos. 

#### Plugins Required
```
cordova plugin add org.apache.cordova.globalization
cordova plugin add org.apache.cordova.keyboard
cordova plugin add org.apache.cordova.file
cordova plugin add org.apache.cordova.media
```

### FilerV4

In the fourth version of Filer, we extend the app to permit image notes obtained from the camera. 

#### Plugins Required
```
cordova plugin add org.apache.cordova.globalization
cordova plugin add org.apache.cordova.keyboard
cordova plugin add org.apache.cordova.file
cordova plugin add org.apache.cordova.media
cordova plugin add org.apache.cordova.camera
```

### FilerV5

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

### FilerV6

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

### FilerV7

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
```

### PathRec

PathRec is a simple app that uses the geolocation API to record paths and show them to the user. Uses localStorage for simplicity.

#### Plugins Required
```
cordova plugin add org.apache.cordova.globalization
cordova plugin add org.apache.cordova.geolocation
cordova plugin add org.apache.cordova.keyboard
cordova plugin add org.apache.cordova.statusbar
```

### Cave Runner

Cave Runner is a simple HTML5 Canvas game that uses the accelerometer as one of its input methods.

#### Plugins Required
```
cordova plugin add org.apache.cordova.globalization
cordova plugin add org.apache.cordova.device-motion
cordova plugin add org.apache.cordova.keyboard
cordova plugin add org.apache.cordova.statusbar
```

### Cave Runner 2

Cave Runner 2 extends Cave Runner with a Parse back end that provides high score functionality. 

**NOTE**: The www/js/app.js file is *NOT* provided, as you need to provide your own API keys. You can copy the version from caverunner and add the following code to initialize Parse prior to `APP.start()`:

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


## License

The code herein is licensed under the MIT license. You are free to with it as you will, provided the requirements of said license are met.

```
Copyright (c) 2013, 2014 PacktPub Publishing
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
