import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { HttpModule  } from '@angular/http';
import { BackgroundMode } from '@ionic-native/background-mode';
import { Media, MediaObject } from '@ionic-native/media';
import { AngularFireModule } from 'angularfire2';
import { HeaderColor } from '@ionic-native/header-color';
import { AppAvailability } from '@ionic-native/app-availability';

// AF2 Settings
export const firebaseConfig = {
		apiKey: "AIzaSyCG5l5f70JnKEBC_GsXiJex0q_Wm5XjWd4",
    authDomain: "wyep-for-ios.firebaseapp.com",
    databaseURL: "https://wyep-for-ios.firebaseio.com",
    projectId: "wyep-for-ios",
    storageBucket: "wyep-for-ios.appspot.com",
    messagingSenderId: "208572729259"
};
import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';

import { IonicStorageModule } from '@ionic/storage';


@NgModule({
  declarations: [
    MyApp,
    HomePage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
		HttpModule,
		IonicStorageModule.forRoot({
      name: '__mydb',
         driverOrder: ['indexeddb', 'sqlite', 'websql']
    }),
    AngularFireModule.initializeApp(firebaseConfig)		
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    {provide: ErrorHandler, useClass: IonicErrorHandler},
		InAppBrowser,
		HttpModule,
		BackgroundMode,
		Media,
		HeaderColor,
		AppAvailability
  ]
})
 
export class AppModule {}
