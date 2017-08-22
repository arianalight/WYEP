import { Component } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import {Http, Headers, RequestOptions} from '@angular/http';
import 'rxjs/add/operator/map';
import { Storage } from '@ionic/storage';
import { BackgroundMode } from '@ionic-native/background-mode';
import { HeaderColor } from '@ionic-native/header-color';
import { AlertController } from 'ionic-angular';
declare var ExoPlayer;
  
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
	autoPlay: any;
	results: any;
	firstruntime: any;
	priorEndtime: any;
	timeout: any;
	interval: any;
  constructor(public navCtrl: NavController, private iab: InAppBrowser, public plt: Platform, public http: Http, private storage: Storage, private backgroundMode: BackgroundMode, private headerColor:HeaderColor, public alertCtrl: AlertController) {

		storage.get('autoPlay').then((val) => {
			this.autoPlay = val;
			if (this.autoPlay == true){
				this.openLiveRadio();
			}
		});
		this.priorEndtime = 3;
		
		if(this.plt.is('android')){
			this.plt.ready().then(() => {
				this.initAndroid();						
			});
		}
		
  }
	initAndroid(){
		this.printSong("...loading data","", "");
		this.backgroundMode.disable();
		//close 
		ExoPlayer.close();
		this.openLiveRadio();					
		this.headerColor.tint("#ffffff");
		var nowplaying: HTMLElement = document.getElementById('nowplaying');
		nowplaying.style.display = 'inherit';
		this.checkLater(100, "init");	
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
			
		}	
		if(this.plt.is('android')){
			this.plt.ready().then(() => {
					ExoPlayer.close();
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
				////console.log("results is: " + this.results[0].song.trackName);
       }, error => {
        ////console.log(error);// Error getting the data
    });	
	}
	public fetchSongData(){
		this.http.get("https://api.composer.nprstations.org/v1/widget/50e451b6a93e91ee0a00028e/now?format=json")
				.subscribe(data => {
					this.validateSong(data.json());
					}, error => {
					this.checkLater(2000, "fetch");
    });	
		
	}
	public checkLater(later, source) {
	clearInterval(this.interval);
	clearTimeout(this.timeout);
		if(source == "first"){
			this.interval = setInterval(() => { // <=== 
			this.whatSong();
			//console.log("checkLater interval");
			//console.log(later);
			//console.log(source); 
		}, later);
		} else {
			this.timeout = setTimeout(() => { // <=== 
				this.whatSong();
				//console.log("checkLater timeout");
			}, later);
			//console.log(later);
			//console.log(source);
		}	
	}
	public transTime(time){
		//clean up endtime for comparison
		var fp = time.split(" ")[0];
		var lp = time.split(" ")[1];
		
		var month = fp.split("-")[0];
		var day = fp.split("-")[1];
		var year = fp.split("-")[2];
		var hour = lp.split(":")[0];
		var minute = lp.split(":")[1];
		var second = lp.split(":")[2];
		return year + month + day + hour + minute + second;
	}
	public nowToNumber(){
		var today = new Date();
		var dd = today.getDate();
		var mm = today.getMonth()+1; //January is 0!
		var yyyy = today.getFullYear();
		var h = today.getHours();
		var m = today.getMinutes();  // remove a bit to compensate for 
		var s = today.getSeconds()- 50;  // network delay, buffer etc
		var ms = today.getMilliseconds();
		
		if(mm<10) {
			var smm ='0'+''+mm;
		} else {
			var smm =''+mm;
		} 
		if(h<10) {
			var sh='0'+''+h;
		} else {
			var sh=''+h;
		}
		var now = yyyy+""+smm+""+dd+""+sh+""+m+""+s;
		
		return now;
	}
	public validateSong(json){
	//console.log("validate");
		if(json['onNow']['song'] != undefined){		
			var trackname = json['onNow']['song'].trackName;
			var artistname = json['onNow']['song'].artistName;
			var starttime = this.transTime(json['onNow']['song']._start_time);
			var endtime = this.transTime(json['onNow']['song']._end_time);		
			var duration = json['onNow']['song']._duration;
			var now = this.nowToNumber();

			//is it really there?
			if(trackname != null && trackname != undefined && artistname != null && artistname != undefined ){
			//console.log("trackname: " + trackname);
			//console.log("priorEndtime: " + this.priorEndtime);
			//console.log("now: " + now);
			//console.log("starttime: " + starttime);
			//console.log("endtime: " + endtime);
			//console.log("duration: " + duration);
			//console.log("timeout: " + this.timeout);
				//is it new but not in the future?
				if(this.priorEndtime < endtime && now > starttime){
					if(this.priorEndtime == 3){
					  //console.log("first!");
						this.checkLater(5000, "first");
						this.firstruntime = endtime;
					}
					this.priorEndtime = endtime;					 
					
					//print it
					this.printSong(trackname,"by", artistname);
										
					//try again after the song duration
					//console.log("duration: " + duration);
					if(this.firstruntime != endtime){
						this.checkLater(duration, "new song!");
					}
				} else {
					this.checkLater(2000, "not new");
				} 				
			} else {
			
				if(json['onNow']['program']['name']){
					var programName = json['onNow']['program']['name'];
					var hostName = json['onNow']['program']['hosts'][0].name;
					this.printSong(programName,"with", hostName);
				}
				this.checkLater(2000, "no trackName");
			}
		} else {
				this.checkLater(2000, "no json song");
		}
	}
	public printSong(trackname,byWith, artistname){
		//set vars
		var song: HTMLElement = document.getElementById('song');
		var by: HTMLElement = document.getElementById('by');
		var artist: HTMLElement = document.getElementById('artist');
		
		//print it
		song.textContent = trackname;
		by.textContent = byWith;
		artist.textContent = artistname;
		
		//add to notifications
		this.backgroundMode.setDefaults({ color: 'fc0a07', icon: 'resources/android/icon/drawable-xxxhdpi-icon.png',title:'Now Playing: ' + trackname, text: byWith + " " + artistname});
	}
	
	public whatSong() {
		this.fetchSongData();
		this.lastFiveSongs();     
	}  
	donate() { 
			const browser = this.iab.create('https://wyep.secureallegiance.com/wyep/WebModule/Donate.aspx?P=WYEP&PAGETYPE=PLG&CHECK=Kg6UODfewF6qK20krF35cqUOstgWaB20');
  }
	showPrompt() {
    let prompt = this.alertCtrl.create({
      title: 'Support',
      message: "Have a question, comment, or suggestion?  We would love to hear from you!",
      inputs: [
        {
          name: 'email',
          placeholder: 'email'
        },
      ],
      buttons: [
        {
          text: 'Cancel',
          handler: data => {
            //console.log('Cancel clicked');
          }
        },
        {
          text: 'Send',
          handler: data => {
            //console.log('Sent!');
          }
        }
      ]
    });
    prompt.present();
  }

}
