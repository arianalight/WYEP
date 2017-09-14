import { Component } from '@angular/core';
import { NavController, Platform } from 'ionic-angular';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import {Http, Headers, RequestOptions} from '@angular/http';
import 'rxjs/add/operator/map';
import { Storage } from '@ionic/storage';
import { BackgroundMode } from '@ionic-native/background-mode';
import { Media, MediaObject } from '@ionic-native/media';
import { HeaderColor } from '@ionic-native/header-color';
import { AlertController } from 'ionic-angular';
import { AppAvailability } from '@ionic-native/app-availability';

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
	spotifyToken: any;
	spotifyButton: any;
	itunesButton: any;
	fbScheme: string;
	twitterScheme: string;
	instagramScheme: string;
	youtubeScheme: string;
	fbLink: string;
	twitterLink: string;
	instagramLink: string;
	youtubeLink: string;
  constructor(public navCtrl: NavController, private iab: InAppBrowser, public plt: Platform, public http: Http, private storage: Storage, public backgroundMode: BackgroundMode, private headerColor:HeaderColor, private media: Media, public alertCtrl: AlertController, public appAvailability: AppAvailability) {

		storage.get('autoPlay').then((val) => {
			this.autoPlay = val;
			if (this.autoPlay == true){
				this.openLiveRadio();
			}
		});
		this.priorEndtime = 3;
		
		if(this.plt.is('android')){
			this.plt.ready().then(() => {
			this.timeout = setTimeout(() => { // <=== 
							this.initAndroid();
						}, 300);						
			});
		}
		if(this.plt.is('ios')){
            this.plt.ready().then(() => {	
                this.timeout = setTimeout(() => {  	
                            this.initiOS();	
						}, 800);  // necessary wait on iOS						
            });
    }
		this.plt.resume.subscribe(() => {
			this.resetDisplay();
			this.authSpotify();
		});
		
  }
	initAndroid(){
					
		this.headerColor.tint("#ffffff");
		this.setSocialSchemes("android");
		this.initShared();
	}
	initiOS(){
		this.setSocialSchemes("ios");
		this.initShared();
	}
	initShared(){
		this.authSpotify();
		setInterval(() => { // check every 50min, just to keep things fresh
			this.authSpotify();
		}, 3e+6);
		this.openLiveRadio();
		var nowplaying: HTMLElement = document.getElementById('nowplaying');
		nowplaying.style.display = 'inherit';
		this.checkLater(500, "init");
		this.lastFiveSongs();		
	}
		setSocialSchemes(platform){
		if(platform == "android"){
			//set android socialSchema
			this.fbScheme = "com.facebook.katana";
			this.twitterScheme = "com.twitter.android";
			this.instagramScheme = "com.instagram.android";
		}
		if(platform == "ios"){
			//set ios socialSchema
			this.fbScheme = "fb://";
			this.twitterScheme = "twitter://";
			this.instagramScheme = "instagram://";
		}		
		this.appAvailability.check(this.fbScheme).then((res) => {
					 this.fbLink = 'fb://page/55254374259';	
		}, (err) => {
			this.fbLink = 'https://facebook.com/WYEP91.3fm';
		});
		this.appAvailability.check(this.twitterScheme).then((res) => {
			this.twitterLink = 'twitter://user?screen_name=WYEP';	
		}, (err) => {
			this.twitterLink = 'https://twitter.com/WYEP';
		});
		this.appAvailability.check(this.instagramScheme).then((res) => {
			this.instagramLink = 'instagram://user?username=wyeppgh';	
		}, (err) => {
			this.instagramLink = 'https://www.instagram.com/wyeppgh/';
		});

		//youTube opens automatically based on user settings	
		this.youtubeLink = 'vnd.youtube://user/WyepOrg';		
	}
	change_autoPlay(){
	  this.storage.set('autoPlay', this.autoPlay);
	}
	convert12hr(isoDateStr) {
		if(isoDateStr){
		var hrminsec =  isoDateStr.split(" ")[1];
		var sp =  hrminsec.split(":");
		var h = sp[0];
		var ampm = h > 11 ? 'PM' : 'AM';
		var m = sp[1];
		h = parseInt(h, 10);
		if (h > 12) h = h - 12;
		return h + ":"+ m + ' ' + ampm;
		}
	}
	resetDisplay() {
		this.priorEndtime = 4;
		this.results = new Array();
		this.printSong("...loading"," ", " ");
		this.lastFiveSongs();
		//this.checkLater(200, "reset");
		this.fetchSongData();
	}
	openLiveRadio() {
		var playPause: HTMLElement = document.getElementById('playPause');
		if (playPause.textContent === "Play"){
			//this.resetDisplay();
			this.backgroundMode.enable();
			this.backgroundMode.overrideBackButton();
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
				ExoPlayer.show(params);
				ExoPlayer.showController();
			});
		}
		if(this.plt.is('ios')){
			this.plt.ready().then(() => {
				const file: MediaObject = this.media.create(params.url);
				file.play();
			});
		}
  }
	public lastFiveSongs(){
	// 
	this.http.get("https://api.composer.nprstations.org/v1/widget/50e451b6a93e91ee0a00028e/tracks?format=json&limit=50&hide_amazon=false&hide_itunes=false&hide_arkiv=false&share_format=false")
      .subscribe(data => {
			  var myJSON = data.json();
				var one = myJSON['tracklist']['results'][0].song.trackName;
				var two = myJSON['tracklist']['results'][1].song.trackName;
				var three = myJSON['tracklist']['results'][2].song.trackName;
				// is item one the currently playing song?
				var song: HTMLElement = document.getElementById('song');
				if(one === song.textContent){
					myJSON['tracklist']['results'].shift();
				}
				if(this.results && this.results.length > 1){
					var one = this.results[0].song.trackName;
					if(one == two || one == three){
						this.results = myJSON['tracklist']['results'];
					} 														 
				} else {
					this.results = myJSON['tracklist']['results'];
				}
				this.getThumbs();
       }, error => {
    });	
	}
	public getThumbs(){
		for(var x=0; x < this.results.length; x++){
			if(!this.results[x].song.thumb){
				if(this.results[x].song.catalogNumber){
					//go get spotify thumb
					var id = this.results[x].song.catalogNumber.split(":")[2];
					//this.getSpotify(id);
					this.getSpotify(id, x);
				}	else if(this.results[x].song.artworkUrl100){
					//use iTunes art
					this.results[x].song.thumb = this.results[x].song.artworkUrl100;
					this.results[x].song.bigthumb = "http://wyep.org/files/disc-32390_960_720.png";
				} else {
					//use placeholder graphic
					this.results[x].song.thumb = "http://wyep.org/files/disc-32390_960_720.png";
					this.results[x].song.bigthumb = "http://wyep.org/files/disc-32390_960_720.png";
				}
			}
		}
	}
	public authSpotify(){
		let url = 'https://accounts.spotify.com/api/token';

    let body = this.jsonToURLEncoded({ grant_type: 'client_credentials' });
		let headers = new Headers();
		headers.append('Content-Type', 'application/x-www-form-urlencoded');
		headers.append('Authorization', 'Basic ZjUwNGFlY2M5MWM4NDBkNjg0ZmQzNTUxNWFkMTYyZDk6MTlmZDlmMjU5NmQzNDU4MGJjOTU2ZmRlOGNlYTQ2MjY=');


		this.http
    .post(url, body, { headers: headers })
    .map(response => response.json())
    .subscribe(data => {
        this.spotifyToken = data;
    }, e => {
         this.spotifyToken = e;
    });
	}
	private jsonToURLEncoded(jsonString){
    return Object.keys(jsonString).map(function(key){
      return encodeURIComponent(key) + '=' + encodeURIComponent(jsonString[key]);
    }).join('&');
  }
	public objToString (obj) {
			var str = '';
			for (var p in obj) {
					if (obj.hasOwnProperty(p)) {
							str += p + '::' + obj[p] + '\n';
					}
			}
			return str; 
	}
	public getSpotify(id, x){
		let headers = new Headers();
    headers.append('Accept', 'application/json');
    headers.append('Authorization', 'Bearer ' + this.spotifyToken.access_token);
    let options = new RequestOptions({ headers: headers });
		this.http.get("https://api.spotify.com/v1/tracks/" + id, options)
      .subscribe(data => {
			  var myJSON = data.json();
				this.results[x].song.thumb = myJSON.album.images[2].url;
				this.results[x].song.bigthumb = myJSON.album.images[1].url;
       }, error => {
			 this.results[x].song.thumb = "http://wyep.org/files/disc-32390_960_720.png";
    });	
	
	}
  public stopSong(){
		var playPause: HTMLElement = document.getElementById('playPause');
		playPause.textContent = "Stop";
		this.openLiveRadio();
  }
	public songDetailOverlay(result) {
		if( result.song.buy.itunes || result.song.catalogNumber ){
		if(result.song.catalogNumber){
			//set spotify button
			this.spotifyButton = {
					text: 'Spotify',
          handler: () => {
						this.stopSong();
						this.iab.create(result.song.catalogNumber, '_system');
					},
					cssClass: 'alertSpotify'
        }
		} else {
			this.spotifyButton = { text: '' };
		}
		if(result.song.buy.itunes){
			//set itunes button
			this.itunesButton = {
					text: 'iTunes',
          handler: () => {
						this.iab.create(result.song.buy.itunes, '_system');
					},
					cssClass: 'alertiTunes'
        }
		} else {
			this.itunesButton = { text: '' };
		}
    let prompt = this.alertCtrl.create({
      title: result.song.trackName,
      message: "<img src='" + result.song.bigthumb +"'>",
      buttons: [
				this.spotifyButton,
				this.itunesButton
      ]
    });
    prompt.present();
		}
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
			this.interval = setInterval(() => { 
			this.fetchSongData();
		}, later);
		} else {
			this.timeout = setTimeout(() => { 
				this.fetchSongData();
			}, later);
		}	
	}
	public transTime(time){
		//clean up endtime for comparison
		var fp = time.split(" ")[0];
		var lp = time.split(" ")[1];
		
		var month = fp.split("-")[0];
		if(month.length > 2){
			month = fp.split("/")[0];
		}
		var day = fp.split("-")[1];	
		
		if(!day){
			day = fp.split("/")[1];
		}
		var year = fp.split("-")[2];
		if(!year){
			year = fp.split("/")[2];
		}
		var hour = lp.split(":")[0];
		var minute = lp.split(":")[1];
		var second = lp.split(":")[2];
		let mill = this.timeToMill(minute + ":" + second);
		return year + month + day + hour + mill;
	}
	public timeToMill(time){
		// e.g. time = "34:26"
		var timeParts = time.split(":");
		let mill = ((+timeParts[0] * (60000 * 60)) + (+timeParts[1] * 60000));
		return mill / 10;
	}
	public nowToNumber(){
		var today = new Date();
		var dd = today.getDate();
		var mm = today.getMonth()+1; // January is 0!
		var yyyy = today.getFullYear();
		var h = today.getHours();
		var m = today.getMinutes()-1;  // remove a bit to compensate for 
		var s = today.getSeconds();  // network delay, buffer etc
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
		if(dd<10) {
			var sdd=""+'0'+''+dd;
		} else {
			var sdd=""+dd;
		}
		let mill = this.timeToMill(m+":"+s);
		var now = ""+yyyy+""+smm+""+sdd+""+sh+""+mill;
		return now;
	}
	public validateSong(json){
		if(json['onNow']['song'] != undefined){		
			var trackname = json['onNow']['song'].trackName;
			var artistname = json['onNow']['song'].artistName;
			var starttime = this.transTime(json['onNow']['song']._start_time);
			var duration = json['onNow']['song']._duration + 100000;
			if(json['onNow']['song']._end_time){
				var endtime = parseInt(this.transTime(json['onNow']['song']._end_time));
			} 

			// is it really there?
			if(trackname != null && trackname != undefined  && trackname != "." && artistname != null && artistname != undefined   && artistname != "." && starttime != null && starttime != undefined){

				// is it new but not in the future?

				let now: number = parseInt(this.nowToNumber());
				if(!endtime || endtime === undefined || endtime === null){
					let endtime = (starttime) + (duration);
				}
				if(this.results[0]){
	
					var res_end = this.transTime(this.results[0].song._end_time);
					var res_start = this.transTime(this.results[0].song._start_time);
					// is it already in the Previously Played?
					if (res_start < now && res_end > now && res_end > this.priorEndtime || this.results[0].song.trackName == trackname){
						this.printSong(this.results[0].song.trackName,"by", this.results[0].song.artistName);
						this.results.shift();
					}
				}
				if(!res_end) {
				  res_end = 2; // if undefined, set to arbitrary small number for comparison with priorEndtime
				}

				if(this.priorEndtime < endtime && res_end < endtime && now > starttime){
					if(this.priorEndtime == 3){
						this.checkLater(5000, "first");
						this.firstruntime = endtime;
					}
					this.priorEndtime = endtime;					 
					
					// print it 
					this.printSong(trackname,"by", artistname);
					this.lastFiveSongs();
										
					// try again after the song duration
					let newCheck = endtime - now;
						this.checkLater(5000, "new song!");
				} else {
					let newCheck = endtime - now;
					this.checkLater(5000, "not new");
				} 				
			} else {			
				if(json['onNow']['program']['name']){
					var programName = json['onNow']['program']['name'];
					var hostName = json['onNow']['program']['hosts'][0].name;
					this.printSong(programName,"with", hostName);
				}
				this.checkLater(1000, "incomplete data");
			}
		} else {	
			// populate with host and show info asap
					if(json['onNow']['program']['hosts']){
					this.printSong(json['onNow']['program']['name'],"with", json['onNow']['program']['hosts'][0].name);
				}
			this.checkLater(1000, "no json song"); 
		}
	}
	public printSong(trackname, byWith, artistname){
		// set vars
		var song: HTMLElement = document.getElementById('song');
		var by: HTMLElement = document.getElementById('by');
		var artist: HTMLElement = document.getElementById('artist');
		
		// print it
		song.textContent = trackname;
		by.textContent = byWith;
		artist.textContent = artistname;
		
		// add to notifications
		this.backgroundMode.setDefaults({ color: 'fc0a07', icon: 'resources/android/icon/drawable-xxxhdpi-icon.png',title:'Now Playing: ' + trackname, text: byWith + " " + artistname});
	}
	
	donate() { 
			this.iab.create('https://wyep.secureallegiance.com/wyep/WebModule/Donate.aspx?P=WYEP&PAGETYPE=PLG&CHECK=Kg6UODfewF6qK20krF35cqUOstgWaB20');
  }
	showPrompt() {
		
    let prompt = this.alertCtrl.create({
      title: 'Support',
      message: "Have a question, comment, or suggestion?  We would love to hear from you!  " + this.spotifyToken.access_token,
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
          }
        },
        {
          text: 'Send',
          handler: data => {
          }
        }
      ]
    });
    prompt.present();
  }
	openTwitter() {
		window.open(this.twitterLink, '_system', 'location=no');
	}
	openFacebook() {
		window.open(this.fbLink, '_system', 'location=no');
	}
	openInstagram() {
		window.open(this.instagramLink, '_system', 'location=no');
	}
	openYoutube() {
		window.open(this.youtubeLink, '_system', 'location=no');
	}

}
