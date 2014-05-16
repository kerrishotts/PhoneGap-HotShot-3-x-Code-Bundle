#PhoneGap HotShot Mobile Application Development 3.x
## Notes

> **NOTE**: If you utilize the code package available on GitHub at [https://github.com/kerrishotts/PhoneGap-HotShot-3-x-Code-Bundle](https://github.com/kerrishotts/PhoneGap-HotShot-3-x-Code-Bundle), the fixes below are already incorporated into the code.

### Data is not persisted should the app be terminated after a `pause` event

This is because there is no auto-save mechanism in place. One could add such a mechanism by listening to `blur` events and calling `saveNote` and `savePath` as appropriate. But this doesn't handle the case should the user put the app in the background without `blur`ing off a field.

In this case, FilerV7 has been modified to show an example of proper persistence of data. The note that is currently being edited is saved to `localStorage` (since we can't use native plugins). If the app is paused and then terminated, on the next startup, the data will still be in `localStorage`, and the app will create the note from `localStorage`. This makes it appear to the user as if no data was lost.

Of course, it's still possible to lose data -- if the app is terminated out-right without an intervening `pause`, there's no chance. In this case, one could use a combination of the two plus a save every few seconds in order to reduce the chance of data loss.

PathRec and PathRecNative has also been modified, though this modification is not as complex, since both apps use `localStorage` for their storage.

For more information about how FilerV7, PathRec, PathRecNative was modified, see the `pause-resume-handling.md` document in this code package.

### Recording video notes doesn't change the unit on the note

Version 0.3.0 of the `media-capture` plugin isn't returning the length of the video; no known fix at this time.

**Affects**: FilerV5 (Chapter 7),
             FilerV6 (Chapter 8),
             FilerV7 (Chapter 9)


### Calc not supported on Android < 4.4

We were naughty; to simplify layout we utilized `calc ()`. This causes problems on any Android device less than 4.4. You can get around this behavior by utilizing percentages instead. Where applicable, we've added appropriate defaults in the CSS (they are marked with comments indicating that Android < 4.4 doesn't support calc).

**Affects**: FilerV4 (Chapter 6),
             FilerV5 (Chapter 7),
             FilerV6 (Chapter 8),
             FilerV7 (Chapter 9)

### Calc requires `-webkit-` on iOS 6

In portions of our CSS, we used `calc ()`. This doesn't work on iOS 6 because it doesn't have the `-webkit-` prefix.

**Affects**: FilerV3 (Chapter 5),
             FilerV4 (Chapter 6),
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
             
### Off-canvas View is not available in Android < 4.4

Although not mentioned in the text, due to the way the off-canvas view is implemented using Calc, it is unavailable for use in Android < 4.4. Use a regular `split` view or a `split-overlay`. It's not impossible to make your own, however, YASMF doesn't support it.

**Affects**: PathRec (Chapter 10)
             
## Quirks

### Virtual device's screen is garbled

This occurs only for Android testing, and is a result of the emulator using the host's GPU. If you have the option, *uncheck* this value, and the display will return to normal.

### Borders around icons

This occurs, as far as I can tell, only on Android < 4.4, and seems to be a result of using GPU. It should only occur on a virtual device, but if it does occur on real devices, the best option is to disable GPU acceleration for the app.

### iOS 6 returns `localhost` from the `Media` API

YASMF's `FileManager` has a `_resolveLocalFileSystemURL` method which calls the File API's `resolveLocalFileSystemURL` method. In YASMF, it strips out certain initial strings from the path, since they are problematic on iOS. Appendix B mentions `private` as being problematic, but on iOS 6, `localhost` is also problematic. The framework in this code package has been updated with the fix, but in case you weren't using the framework, I wanted you to recognize the problem.

Essentially, the `Media` API may return a path like this:

```
file:///localhost/var/.../tmp/someImage.jpg  
file:///private/var/.../tmp/someImage.jpg    
```

Both `private` and `localhost` need to be stripped before `resolveLocalFileSystemURL` works correctly.

**Affects**: FilerV4 (Chapter 6),
             FilerV5 (Chapter 7),
             FilerV6 (Chapter 8),
             FilerV7 (Chapter 9),
             Appendix B