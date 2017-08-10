import { Component } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import {Http, Headers, RequestOptions} from '@angular/http';
import 'rxjs/add/operator/map';
import { Storage } from '@ionic/storage';
import { BackgroundMode } from '@ionic-native/background-mode';
declare var ExoPlayer;
declare var headerColor;
  
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
	autoPlay: any;
	results: any;
  constructor(public navCtrl: NavController, private iab: InAppBrowser, public plt: Platform, public http: Http, private storage: Storage, private backgroundMode: BackgroundMode) {

  storage.get('autoPlay').then((val) => {
		this.autoPlay = val;
		if (this.autoPlay == true){
			this.openLiveRadio();
		}
  });
	var temp = this;	
	setInterval(function(){ temp.whatSong();} , 60000);
		if(this.plt.is('android')){
			this.plt.ready().then(() => {
				temp.openLiveRadio();		
				//window.plugins.headerColor.tint("#ffffff");				
			});
		}
		
  }
	change_autoPlay(){
	  this.storage.set('autoPlay', this.autoPlay);
	}
	convert12hr(isoDateStr) {
		if(isoDateStr){
		var sp =  isoDateStr.split(":");
		var h = sp[0];
		var ampm = h > 11 ? 'PM' : 'AM';
		var m = sp[1];
		h = parseInt(h, 10);
		if (h > 12) h = h - 12;
		return h + ":"+ m + ' ' + ampm;
		}
	}  
	openLiveRadio() {
		this.whatSong();
		var playPause: HTMLElement = document.getElementById('playPause');
		if (playPause.textContent === "Play"){ 
			this.backgroundMode.enable();
			playPause.textContent = "Stop";	
			var params = { 
				url: 'https://playerservices.streamtheworld.com/api/livestream-redirect/WYEPFMAAC.aac',
				userAgent: 'WYEPPlayer', // default is 'ExoPlayerPlugin'
				audioOnly: true,
			}
		} else {
			this.backgroundMode.disable();
			playPause.textContent = "Play";
			var params = { 
				url: '',
				userAgent: 'WYEPPlayer', // default is 'ExoPlayerPlugin'
				audioOnly: true,
			}
			var nowplaying: HTMLElement = document.getElementById('nowplaying');
			nowplaying.style.display = 'none';
		}	
		if(this.plt.is('android')){
			this.plt.ready().then(() => {
					ExoPlayer.show(params);
					ExoPlayer.showController();
			});
		}
  }
	public lastFiveSongs(){
	// 
	this.http.get("https://api.composer.nprstations.org/v1/widget/50e451b6a93e91ee0a00028e/tracks?format=json&limit=5&hide_amazon=false&hide_itunes=false&hide_arkiv=false&share_format=false")
      .subscribe(data => {
			  var myJSON = data.json();
				this.results = myJSON['tracklist']['results'];
				console.log("results is: " + this.results[0].song.trackName);
       }, error => {
        console.log(error);// Error getting the data
    });	
	
	
	}
	public whatSong() {
		this.lastFiveSongs();
		var song: HTMLElement = document.getElementById('song');
		var by: HTMLElement = document.getElementById('by');
		var artist: HTMLElement = document.getElementById('artist');
		
    this.http.get("https://api.composer.nprstations.org/v1/widget/50e451b6a93e91ee0a00028e/now?format=json")
      .subscribe(data => {
			  var myJSON = data.json();
				var trackname = myJSON['onNow']['song'];
				var nowplaying: HTMLElement = document.getElementById('nowplaying');
				if(trackname != null &&  trackname != undefined ){
					song.textContent = myJSON['onNow']['song']['trackName'];
					by.textContent = "by";
					artist.textContent = myJSON['onNow']['song']['artistName'];
					nowplaying.style.display = 'inherit';
				} else {
					if(myJSON['onNow']['program']['name']){
						console.log(myJSON['onNow']['program']['name']);
						song.textContent = myJSON['onNow']['program']['name'];
					}
					if(myJSON['onNow']['program']['hosts']['name']){
						by.textContent = "with";
						artist.textContent = myJSON['onNow']['program']['hosts']['name'];
					} else {
						by.textContent = "";
						artist.textContent = "";
					}
					nowplaying.style.display = 'inherit';
				}
				this.backgroundMode.setDefaults({ color: 'fc0a07', icon: 'resources/android/icon/drawable-xxxhdpi-icon.png',title:'Now Playing: ' + song.textContent, text: by.textContent + " " + artist.textContent});
       }, error => {
        console.log(error);// Error getting the data
    });	
	}  
	donate() { 
			const browser = this.iab.create('https://wyep.secureallegiance.com/wyep/WebModule/Donate.aspx?P=WYEP&PAGETYPE=PLG&CHECK=Kg6UODfewF6qK20krF35cqUOstgWaB20');
  }


}
