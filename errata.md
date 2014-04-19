#PhoneGap HotShot Mobile Application Development 3.x
## Known Errata

> **NOTE**: If you utilize the code package available on GitHub at [https://github.com/kerrishotts/PhoneGap-HotShot-3-x-Code-Bundle](https://github.com/kerrishotts/PhoneGap-HotShot-3-x-Code-Bundle), the fixes below are already incorporated into the code.

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

### Off-canvas View is not available in Android < 4.4

Although not mentioned in the text, due to the way the off-canvas view is implemented using Calc, it is unavailable for use in Android < 4.4. Use a regular `split` view or a `split-overlay`. It's not impossible to make your own, however, YASMF doesn't support it.

**Affects**: PathRec (Chapter 10)
             
## Quirks

### Virtual device's screen is garbled

This occurs only for Android testing, and is a result of the emulator using the host's GPU. If you have the option, *uncheck* this value, and the display will return to normal.

### Borders around icons

This occurs, as far as I can tell, only on Android < 4.4, and seems to be a result of using GPU. It should only occur on a virtual device, but if it does occur on real devices, the best option is to disable GPU acceleration for the app.