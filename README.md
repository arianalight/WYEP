
### Ionic 2 & Exoplayer for Android ###

This is an Android app made with Ionic v2 / cordova using Google's ExoPlayer to stream the WYEP FM live stream.

There is a Cordova plugin for Google’s ExoPlayer media framework:
https://github.com/frontyard/cordova-plugin-exoplayer

Generally, you can follow the instructions in the readme file for the plugin.  But you will need to do a couple of additional things in Ionic 2 and up (because, TypeScript 2):

I started with the blank template, following these instructions: https://ionicframework.com/docs/intro/tutorial/

From your app directory on the command line:
```shell
ionic start MyIonicProject blank
```
From your app directory (command line), add cordova-plugin-exoplayer :
```shell
cordova plugin add cordova-plugin-exoplayer
```
Add the Android platform:
```shell
ionic cordova platform add android
```

For testing purposes, I added a button on the first tutorial page: (src/pages/tutorial/tutorial.html)

```html 
<button (click)="openLiveRadio()">Play</button>
```

Then in tutorial.ts (same dir) I import Platform and add this declaration near the imports at the top of the code:
```javascript
import { Platform } from 'ionic-angular';
declare var ExoPlayer;
```

Also be sure to add Platform to the constructor:
```javascript
constructor(public navCtrl: NavController, public plt: Platform) {
  }
```


And here is the function in the HomePage class:
```javascript
	openLiveRadio() {
	  var params = { 
			url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/WYEPFMAAC.aac',
			userAgent: 'MyAwesomePlayer', // default is 'ExoPlayerPlugin'
			aspectRatio: 'FILL_SCREEN', // default is FIT_SCREEN
			hideTimeout: 5000, // Hide controls after this many milliseconds, default is 5 sec
			seekTo: 0, // Start playback 10 minutes into video specified in milliseconds, default is 0
			skipTime: 0, // Amount of time to use when going forward/backward, default is 1 min
			controller: { // If this object is not present controller will not be visible
					hideProgress: false,
					controlIcons: {
							'exo_rew': 'http://url.to/rew.png',
							'exo_play': 'http://url.to/play.png',
							'exo_pause': 'http://url.to/pause.png',
							'exo_ffwd': 'http://url.to/ffwd.png'
					}
			}
		}
		this.plt.ready().then(() => {
			  ExoPlayer.show(params);
    });
  }
```


