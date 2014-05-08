#PhoneGap HotShot Mobile Application Development 3.x
## Known Errata

> **NOTE**: If you utilize the code package available on GitHub at [https://github.com/kerrishotts/PhoneGap-HotShot-3-x-Code-Bundle](https://github.com/kerrishotts/PhoneGap-HotShot-3-x-Code-Bundle), the fixes below are already incorporated into the code.

### Data is not persisted should the app be terminated after a `pause` event

This is because there is no auto-save mechanism in place. One could add such a mechanism by listening to `blur` events and calling `saveNote` and `savePath` as appropriate. But this doesn't handle the case should the user put the app in the background without `blur`ing off a field.

In this case, FilerV7 has been modified to show an example of proper persistence of data. The note that is currently being edited is saved to `localStorage` (since we can't use native plugins). If the app is paused and then terminated, on the next startup, the data will still be in `localStorage`, and the app will create the note from `localStorage`. This makes it appear to the user as if no data was lost.

Of course, it's still possible to lose data -- if the app is terminated out-right without an intervening `pause`, there's no chance. In this case, one could use a combination of the two plus a save every few seconds in order to reduce the chance of data loss.

For more information about how FilerV7 was modified, see the `pause-resume-handling.md` document in this code package.

### Recording video notes doesn't change the unit on the note

Version 0.3.0 of the `media-capture` plugin isn't returning the length of the video; no known fix at this time.

**Affects**: FilerV5 (Chapter 7),
             FilerV6 (Chapter 8),
             FilerV7 (Chapter 9)


### After audio playback completes, the play button doesn't appear

This occurs because the `_mediaSuccess` method resets the player state too early. In `www/js/app/models/mediaManager.js`, ensure `_mediaSuccess` appears as follows:

```
self._position = 0;
self.notify ( "positionUpdated" );
if (self.isPlaying) { self.notify ( "playingStopped" ); }
if (self.isRecording) { self.notify ( "recordingStopped" ); }
self._state = MediaManager.STATE_STOPPED;
self._media.release();
```

**Affects**: FilerV3 (Chapter 5),
             FilerV4 (Chapter 6),
             FilerV5 (Chapter 7),
             FilerV6 (Chapter 8),
             FilerV7 (Chapter 9)


### Audio Playback doesn't remove `positionUpdated` listener

This occurs because the `onAudioStopped` handler doesn't remove the listener for the `positionUpdated` notification. 

Add the following to the `self.onAudioStopped` handler in `www/js/app/views/audioNoteEditView.js`:

```
self._note.media.removeListenerForNotification("positionUpdated", self.updateAudioInformation);
```

**Affects**: FilerV3 (Chapter 5),
             FilerV4 (Chapter 6),
             FilerV5 (Chapter 7),
             FilerV6 (Chapter 8),
             FilerV7 (Chapter 9)


### Camera listeners aren't removed if an error occurs

This occurs because the error routine doesn't properly remove the listener.

In `www/js/app/views/videoNoteEditView.js` in `self.captureVideo`, the error handler should look like this:

```
self._note.video.removeListenerForNotification ( "videoCaptured", self.onVideoCaptured);
console.log (anError);
```

The same issue occurs in `www/js/app/views/imageNoteEditView.js` in `self.capturePhoto`, the error handler should look like this:

```
self._note.camera.removeListenerForNotification ( "photoCaptured", self.onPhotoCaptured);
console.log (anError);
```

**Affects**: FilerV4 (Chapter 6),
             FilerV5 (Chapter 7),
             FilerV6 (Chapter 8),
             FilerV7 (Chapter 9)

### Text boxes appear underneath video/image elements

This occurs on Android devices and is due to the fact that the video or image element (for whatever reason) is taking visual precedence over the text area. The fix is to force the text area to use the GPU.

In `www/css/style.css`:

```
.ImageNoteEditView .ui-text-box.editing, .VideoNoteEditView .ui-text-box.editing
{
  height: 100%;
  margin-top: -200px;
  /* without these, android puts the text bux underneath the image/video */
  -webkit-transform: translateZ(1px);
  -moz-transform: translateZ(1px);
  -ms-transform: translateZ(1px);
  -o-transform: translateZ(1px);
  transform: translateZ(1px);
  position: absolute;
}
```

**Affects**: FilerV4 (Chapter 6),
             FilerV5 (Chapter 7),
             FilerV6 (Chapter 8),
             FilerV7 (Chapter 9)

### Video Element is too large

This occurs because the height style is missing from the text. In `www/css/style.css`:

```
/* without these, the height of the video container is incorrect. */
.VideoNoteEditView .video-container .video-element
{
  height: 156px; /* Android < 4.4 doesn't understand calc */
  height: calc(100% - 44px);
}
.android .VideoNoteEditView .video-container .video-element
{
  height: 152px; /* Android < 4.4 doesn't understand calc */
  height: calc(100% - 48px);
}
```

**Affects**: FilerV5 (Chapter 7),
             FilerV6 (Chapter 8),
             FilerV7 (Chapter 9)

### Share icon is incorrectly aligned

The fix is to add the following to the `DIV` classed `ui-tool-bar` in the `www/html/textNoteEditView.html` template:

```
        <div class="ui-bar-button-group ui-align-left">
        </div>
        <div class="ui-bar-button-group ui-align-center">
        </div>
```

**Affects**: FilerV6 (Chapter 8),
             FilerV7 (Chapter 9)


### Calc not supported on Android < 4.4

We were naughty; to simplify layout we utilized `calc ()`. This causes problems on any Android device less than 4.4. You can get around this behavior by utilizing percentages instead. Where applicable, we've added appropriate defaults in the CSS (they are marked with comments indicating that Android < 4.4 doesn't support calc).

**Affects**: FilerV4 (Chapter 6),
             FilerV5 (Chapter 7),
             FilerV6 (Chapter 8),
             FilerV7 (Chapter 9)


### Text editors for image and video notes are not correctly aligned

On Android < 4.4, these may appear below the video and images. This isn't horrible, since the area can scroll, but it's not great, either. This is due to use of `calc`; the fix is to add `width:49%` to the following rules:

```
.tablet.landscape .ImageNoteEditView .ui-text-box,
.tablet.landscape .VideoNoteEditView .ui-text-box
```
**Affects**: FilerV5 (Chapter 7),
             FilerV6 (Chapter 8),
             FilerV7 (Chapter 9)
             
### Image size is not returned on Android

If, when you take a picture with Filer, you can't share the image, it is possible that the File API isn't locating the file. Typically, an image note's `mediaContents` looks like this:

```
/com.phonegaphotshot.packtpub.filer/image123456....jpg
```

However, for some reason, The File API may balk at the initial `/`. If this is the case, replace `doesPhotoExist` in `js/app/models/cameraManager.js` with the following:

```
      self.doesPhotoExist = function ()
      {
         var fm = new _y.FileManager();
         var deferred = Q.defer();
         var img = self.src;
         if (_y.device.platform() === "android") { img = img.substr(1,img.length); }
         fm.init ( fm.PERSISTENT, 0 )
           .then ( function () { return fm.getFile (img, {} ); })
           .then ( function ( theFile ) { deferred.resolve ( theFile ); })
           .catch ( function ( anError ) { deferred.resolve ( null ); })
           .done();
         return deferred.promise;
      };
```     

Alternatively, if the above fails, replace it with the original content:

```
      self.doesPhotoExist = function ()
      {
         var fm = new _y.FileManager();
         var deferred = Q.defer();
         fm.init ( fm.PERSISTENT, 0 )
           .then ( function () { return fm.getFile (self.src, {} ); })
           .then ( function ( theFile ) { deferred.resolve ( theFile ); })
           .catch ( function ( anError ) { deferred.resolve ( null ); })
           .done();
         return deferred.promise;
      };
```        

**Affects**: FilerV4 (Chapter 6),
             FilerV5 (Chapter 7),
             FilerV6 (Chapter 8),
             FilerV7 (Chapter 9)


### Off-canvas View is not available in Android < 4.4

Although not mentioned in the text, due to the way the off-canvas view is implemented using Calc, it is unavailable for use in Android < 4.4. Use a regular `split` view or a `split-overlay`. It's not impossible to make your own, however, YASMF doesn't support it.

**Affects**: PathRec (Chapter 10)
             
## Quirks

### Virtual device's screen is garbled

This occurs only for Android testing, and is a result of the emulator using the host's GPU. If you have the option, *uncheck* this value, and the display will return to normal.

### Borders around icons

This occurs, as far as I can tell, only on Android < 4.4, and seems to be a result of using GPU. It should only occur on a virtual device, but if it does occur on real devices, the best option is to disable GPU acceleration for the app.