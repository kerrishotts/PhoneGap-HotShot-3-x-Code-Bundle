# Persisting Data Through Pause/Resume

I thought it would be nice to show examples of how to implement this feature, since we don't cover it in the book.

On iOS, it requires an additional plugin:

```
cordova plugin add com.photokandy.localstorage
```

You can look at FilerV7 for an example, these files have the necessary changes:

* `www/app/main.js`: Registers new notification listeners
* `www/app/models/noteStorage.js`: Adds an optional parameter to `createNote` so that we can create a new note with a specific UID (important when loading the note from `localStorage`)
* `www/app/views/textNoteEditView.js`: Adds a listener for the global `applicationPausing` notification (created in `main.js`), and when it occurs, the note is persisted to `localStorage` in `persistNote`. When the application resumes, the data in `localStorage` is wipe, and the note is saved normally. However should the application be *terminated* before resumption, `localStorage` will contain the note in progress.
* `www/app/views/noteListView.js`: When the collection is loaded, it checks to see if there is a note in progress in `localStorage` in `checkForPersistedNotes`. If there is one, it is created with the specific UID, added to the collection and saved.

In PathRec/PathRecNative, the changes necessary are simpler, because `localStorage` is the backing store:

* `www/app/main.js`: Registers new notification listeners
* `www/app/views/pathEditView.js`: Adds listeners for the global `applicationPausing` notification, and saves the path when it occurs.

## Global

`main.js` is changed in exactly the same way in FilerV7 or PathRec[Native].

### main.js

In `main.js`, the `APP.onPause` and `APP.onResume` handlers are modified to send a global notification:

```
APP.onPause = function ()
{
  _y.UI.globalNotifications.notify("applicationPausing");
  console.log ( "Application paused" );
};
APP.onResume = function ()
{
  _y.UI.globalNotifications.notify("applicationResuming");
  console.log ( "Application resumed" );
};
```

Later, in `APP.start`, we determine whether or not we need to use the events that the PKLocalStorage plugin sends (if on iOS) or if we can stick with Android's events:

```
var notifications = {
       "online":          { notification: "applicationOnline",  handler: APP.onConnectionStatusChanged },
       "offline":         { notification: "applicationOffline", handler: APP.onConnectionStatusChanged },
       "batterycritical": { notification: "batteryCritical",    handler: APP.onBatteryStatusChanged },
       "batterylow":      { notification: "batteryLow",         handler: APP.onBatteryStatusChanged },
       "batterystatus":   { notification: "batteryStatus",      handler: APP.onBatteryStatusChanged },
       "menubutton":      { notification: "menuButtonPressed",  handler: APP.onMenuButtonPressed },
       "searchbutton":    { notification: "searchButtonPressed",handler: APP.onSearchButtonPressed }
};
if (_y.device.platform() === "ios")
{
  // if we want to persist localStorage, we need to use PKLocalStorage plugin
  window.PKLocalStorage.addPauseHandler ( APP.onPause );
  window.PKLocalStorage.addResumeHandler ( APP.onResume );
}
else
{
  // add the proper pause/resume handlers
  notifications.pause = {notification:"pause", handler: APP.onPause};
  notifications.resume = {notification:"resume", handler: APP.onResume};
}
```

Then, we create two new global events:

```
gN.registerNotification ( "applicationPausing", false ); // synchronous notifications
gN.registerNotification ( "applicationResuming", false ); // synchronous
```
It's important to note that these events use YASMF's feature for sending notifications. YASMF sends most notifications wrapped in a `setTimeout`, but `setTimeout` (or native actions) can't be used during a backgrounding operation. Above, the `false` forces YASMF to call each handler directly, which will work as desired.

## PathRec[Native]

The following changes are specific to PathRec[Native].

## pathEditView.js

We add two new methods:

```
    self.registerGlobalNotifications = function registerGlobalNotifications() {
      _y.UI.globalNotifications.addListenerForNotification( "applicationPausing",
        self.savePath );
    };
    self.deRegisterGlobalNotifications = function deRegisterGlobalNotifications() {
      _y.UI.globalNotifications.removeListenerForNotification( "applicationPausing",
        self.savePath );
    }
```

These attach/detach a listener for the `applicationPausing` event created in `main.js`. When it occurs, `savePath` is called, which saves the path into `localStorage`.

To call these two methods, we add listeners in `init`:

```
      self.addListenerForNotification( "viewWasPopped", self.deRegisterGlobalNotifications );
      self.addListenerForNotification( "viewWasPopped", self.releaseBackButton );
      self.addListenerForNotification( "viewWasPopped", self.destroy );
      self.addListenerForNotification( "viewWasPushed", self.registerGlobalNotifications );
```

And we remove these listeners in `destroy`:

```
      self.removeListenerForNotification( "viewWasPopped", self.deregisterGlobalNotifications );
      self.removeListenerForNotification( "viewWasPushed", self.registerGlobalNotifications );
```

## FilerV7

The following changes are specific to Filer V7.

### noteStorage.js

In `noteStorage`, we alter `createNote` to take an additional (optional) parameter like so:

```
self.createNote = function ( noteType, theNoteUID )
{
  // Create a note from the Note object
  var aNote = noteFactory.createNote ( noteType || noteFactory.TEXTNOTE );
  var noteUID = _generateUID();
  if (typeof theNoteUID !== "undefined")
  {
    noteUID = theNoteUID;
  }
  ...
}
```
This lets us pass a specific UID during the creation process, which we'll use when we handle restoring notes from `localStorage`.

### textNoteEditView.js

This is the only edit view in which we need to make changes since all other edit views will inherit the functionality by default. 

First we define a method to persist a note to `localStorage` when the app is going to the background:

```
self.persistNote = function ()
{
  self._note.name = self._nameEditor.innerText;
  self._note.textContents = self._contentsEditor.value;
  localStorage["noteInProgress"] = self._note.JSON;
  localStorage["noteInProgressUID"] = self._note.UID;
  localStorage["noteInProgressType"] = self._note.class;
}
```

Then we alter `saveNote` a little to remove these `localStorage` entries, should a note be able to be saved in the normal fashion. This just ensures we won't ever accidentally create spurious notes later on.

```
self.saveNote = function ()
{
  localStorage.removeItem("noteInProgress"); // clean up any persisted notes during a pause
  localStorage.removeItem("noteInProgressUID");
  localStorage.removeItem("noteInProgressType");
  ...
```

Then we define two methods that register the above methods for the `applicationPausing` and `applicationResuming` notifications:

```
self.registerGlobalNotifications = function registerGlobalNotifications()
{
  _y.UI.globalNotifications.addListenerForNotification ( "applicationPausing", self.persistNote );
  _y.UI.globalNotifications.addListenerForNotification ( "applicationResuming", self.saveNote );
};
self.deRegisterGlobalNotifications = function deRegisterGlobalNotifications()
{
  _y.UI.globalNotifications.removeListenerForNotification ("applicationPausing", self.persistNote );
  _y.UI.globalNotifications.removeListenerForNotification ("applicationResuming", self.saveNote );
}
```

Then we add listeners for `viewWasPushed` and `viewWasPopped` to handle these settings in `init`. We also add appropriate cleanup to `destroy`. 

### noteListView.js

The list view is the first view that comes on-screen, so we handle loading a persisted note here. We create a new method, `checkForPersistedNotes` that looks like this:

```
self.checkForPersistedNotes = function ()
{
  if (typeof localStorage["noteInProgressType"] !== "undefined")
  {
    // check if there's a note with our UID already -- if so, we need to overwrite it instead of
    // creating a new one.
    var anExistingNote = noteStorageSingleton.getNote(localStorage["noteInProgressUID"]);
    if (anExistingNote !== undefined)
    {
      anExistingNote.initWithJSON(localStorage["noteInProgress"]);
      noteStorageSingleton.saveNote(anExistingNote);
      noteStorageSingleton.saveCollection();
      localStorage.removeItem("noteInProgress");
      localStorage.removeItem("noteInProgressUID");
      localStorage.removeItem("noteInProgressType");
    }
    else
    {
      noteStorageSingleton.createNote(localStorage["noteInProgressType"], localStorage["noteInProgressUID"])
        .then(function (aNewNote)
              {
                aNewNote.initWithJSON(localStorage["noteInProgress"]);
                localStorage.removeItem("noteInProgress");
                localStorage.removeItem("noteInProgressUID");
                localStorage.removeItem("noteInProgressType");
                noteStorageSingleton.saveNote(aNewNote);
                noteStorageSingleton.saveCollection();
              })
        .catch(function (anError) { console.log(anError) })
        .done();
    }
  }
};
```

Later, down in `init`, we add the above handler as a listener to the `collectionLoaded` event.

## Challenge

Of course, we could have gone a step further and actually displayed an edit view for the persisted note, which would have given the user a sense of continuity -- that is, the app would have appeared similar to how it looked when they left. We'll leave this as an exercise to the reader.
