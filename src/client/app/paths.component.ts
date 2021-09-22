import { Component, OnInit } from '@angular/core';
import { Step } from './step';
import { Path } from './path';
import { StepService } from './step.service';
import * as $ from "jquery";
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import {CdkDragDrop, CdkDragEnd, CdkDragStart,  moveItemInArray, copyArrayItem, transferArrayItem} from '@angular/cdk/drag-drop';
import { NgxFileDropEntry, FileSystemFileEntry, FileSystemDirectoryEntry } from 'ngx-file-drop';
import {CookieService} from 'ngx-cookie-service'

import {parse, stringify} from 'flatted';
import { InvokeMethodExpr } from '@angular/compiler';

@Component({
  selector: 'app-paths',
  templateUrl: './paths.component.html'
})

export class PathsComponent implements OnInit {
  showBranches=true;
  showTypes=true;
  showTags=true;
  showRecommenders=true;
  ipAddress = '';
  listlayout=false;
  editting=false;
  edittingPaths=false;

  showjson=false;
  addingStep = false;
  deepUrl=window.location.origin;
  steps: any = [];
  stepsMap :any = new Map<String, Step>();
  paths: any = [];
  typesArray: any[];
  tagsArray: any[];
  treesArray: any[];
  recommendersArray: any[];
  selectedTagsSet: any = new Set();
  selectedTypesSet: any = new Set();
  selectedRecommendersSet: any = new Set();
  recommendersSet: any = [];
  numChosenButtons=0;
  idBeingDragged: number;
  isDragging: boolean;
  searchTerm: string
  urlparams : any;
  selectedPathIndex: number;
  selectedStep: Step;
  selectedStepId: string;
  newMaterialUrl: string;
  aboutThis=false;
  browsingThumb=false;
  files: NgxFileDropEntry[] = [];
  dateOfSelectedStep:string;
  testing=window.location.href.includes("?testing")
  feedback: any = [];
  feedbackPaths: any = [];
  items: any[]
  stepBeingEditted=false;

  constructor( private cookieService: CookieService, private stepService: StepService, private http: HttpClient, private activatedRoute: ActivatedRoute) {
    this.activatedRoute.queryParams.subscribe(params => {
      this.urlparams = params;
    }
  )}

  async ngOnInit() {
   this.getSteps( false );
   let sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
   await sleep(2000);
   this.toggleUrlParams(this.urlparams);
   console.log("COOOKIES " +  this.cookieService.get("upskilling-likes"));
   this.cookieService.set("cookie-name", "myCookieValue");
   console.log("COOOKIES " +  this.cookieService.get("upskilling-likes"));
  }

  like(){
    console.log("In like1 " + v)
    var v = this.cookieService.get("upskilling-likes")
    if ( v.includes(this.selectedStep.uid ) ){
        v = v.replace( " "+this.selectedStep.uid, "");
        this.selectedStep.NumLikes -=1;
    }
    else{
      v = v+ " "+this.selectedStep.uid;
      this.selectedStep.NumLikes +=1;
    }
    this.stepService.addStep(this.selectedStep).subscribe()
    this.cookieService.set("upskilling-likes", v);
    console.log("In like2 " + this.cookieService.get("upskilling-likes"))
  }

  newMaterialKeyDown(event){
    if (event.key === "Enter")
      this.prepareNewStep();
  }

  getSteps( selectStepOnCompletion ) {
     this.stepService.getSteps().subscribe(stepsPaths => {
      var typeSet:any = new Set();
      var tagsSet:any = new Set();
      var treesSet:any = new Set();
      var recommendersSet:any = new Set();
      var pathsMap = new Map<String, Path>();
      var stepsMap = new Map<String, Step>();
      var steps = stepsPaths["steps"]
      var paths = stepsPaths["paths"]
      this.selectedPathIndex=-1;

      for (let p in paths){
        pathsMap.set (paths[p].uid, paths[p]);
      }

      for (let s in steps) {
        if(!steps[s]["NumLikes"])
          steps[s]["NumLikes"]=0;
        if(steps[s].Tags)
          steps[s].Tags = steps[s].Tags.toLowerCase();
        if(steps[s].Type)
          steps[s].Type = steps[s].Type.toLowerCase();

        stepsMap.set(""+[steps[s].uid],  steps[s]);
        for (let field in steps[s]){
          if (field=="Tags"){
            var splitted = steps[s][field].split(" ")
            for (let w in splitted){
              if (splitted[w].trim().length>0)
                tagsSet.add(splitted[w] );
            }
          }
          if (field=="Type"){
            var splitted = steps[s][field].split(" ");
            for (let w in splitted){
              if (splitted[w].trim().length>0)
                typeSet.add(splitted[w] );
            }
          }
          if (field=="Tree"){
            var splitted = steps[s][field].split(" ");
            for (let w in splitted){
              let tree=splitted[w]
              if (tree.trim().length>0)
                treesSet.add(tree );
              while (tree.includes("/")){
                tree=tree.substring(0, tree.lastIndexOf('/'))
                treesSet.add(tree );
              }
            }
          }
          if (field=="Recommender"){
            var splitted = steps[s][field].split(" ");
            for (let w in splitted){
              if (splitted[w].trim().length>0)
                recommendersSet.add(splitted[w] );
            }
          }
        }
      }
      steps = []
      const mapSortedByTitle = new Map([...stepsMap.entries()].sort((a, b) => a[1].Title.localeCompare( b[1].Title)));
      mapSortedByTitle.forEach( function f(value, key, map) {
        steps.push( value);
      })
      this.steps = steps;

      paths = []
      const mapSortedByName = new Map([...pathsMap.entries()].sort((a, b) => a[1].Title.localeCompare( b[1].Title)));
      mapSortedByName.forEach( function f(value, key, map) {
        paths.push( value);
      })
      this.paths = paths;
      this.selectedPathIndex=-1;
      this.typesArray = Array.from( typeSet );
      this.typesArray.sort()
      this.tagsArray  = Array.from( tagsSet );
      this.tagsArray.sort();
      this.treesArray  = Array.from( treesSet );
      this.treesArray.sort();
      this.recommendersArray  = Array.from( recommendersSet );
      this.recommendersArray.sort();
      this.stepsMap = stepsMap;
      this.items=this.steps;

      if (selectStepOnCompletion)
        this.selectedStep = steps[0];
      if (this.selectedStep)
        this.onSelect(this.selectedStep.uid, -1, this.selectedStep.Tags+" "+this.selectedStep.Type+" " +this.selectedStep.Tree+" " +this.selectedStep.Recommender, "false")
    
    console.log("HERE1")
    
      });
  }

  toggleUrlParams(url){
    // http://localhost:3000/?tags=a&tags=b&id=123123
    var args = url["f"];
    if (args){
      if (!Array.isArray(args))
        args = new Array(args);
      args.forEach(function( a, b ) {       
       document.getElementById(a).click();
      })
    }
    else {
      this.showBranches=false;
      this.showTypes=false;
      this.showTags=false;
      this.showRecommenders=false;
    }

    var ids = url["id"];
    if (!ids || Array.isArray(ids))
      return;
    console.log("IN toggleUrlParams "+ids)
    this.onSelect(ids, -1,'', "false");
    $( "img[id='"+ids+"']").addClass("highlight");

    if (url["search"]){
      this.searchTerm = url["search"];
    }
//    this.toggleMe(null);
  }

  gatherUrlParams(){
    var urlParams=""
    var sep = "?";
    if (this.selectedStepId){
      urlParams += sep+"id="+this.selectedStepId;
      sep="&"
    }

    $( ".chosen").each(function( v1, v2 ) {
          urlParams+=sep+"f="+v2.name;
          sep="&"
    });

    if (this.searchTerm){
      urlParams += sep+"search="+this.searchTerm;
      sep="&"
    }
    this.deepUrl = window.location.origin +urlParams
  }

  browseThumb(){
    this.stepBeingEditted=true;
    this.browsingThumb=true;
    console.log("In BrowseThumb")
  }

  toggleAboutThis(){
    this.aboutThis=!this.aboutThis
  }

  toggleMe(e){
    this.editting=false;
    this.selectedStep=null;
    this.stepBeingEditted=false;
    if (e!=null){
      var target = e.target || e.srcElement || e.currentTarget;
      target.classList = target.classList.contains("chosen") ? "": "chosen";
    }
    if ( $( ".chosen").length==0 && (!this.searchTerm ||  this.searchTerm.length==0)){
      $("img[alt='refreshPage']").removeClass("img-opaque");
      $( "code[name='path']").removeClass("testing");
      return;
    }

    $("img[alt='refreshPage']").addClass("img-opaque");
    $( ".chosen").each(function( v1,v2,s ) {
      $( "img[alt='refreshPage']").each(function( index ) {
        if ($( this).attr("name").includes( v2.name ))
          $( this).removeClass("img-opaque");
      });
    })

    $( "code[name='path']").each(function( index ) {
      $( this).removeClass("testing");
    }
  )

    if (this.searchTerm && this.searchTerm.length>0){
      let w = ""+this.searchTerm.toUpperCase()
      $( "img[alt='refreshPage']").each(function( index ) {
        if( $(this).attr("name").toUpperCase().includes( w )){
          $( this).removeClass("img-opaque");
        }
        }
      )

      $( "code[name='path']").each(function( index ) {
          if( $(this).attr("id").toUpperCase().includes( w ))
            $( this).addClass("testing");
        }
      )

      var stepWithUrl = this.steps.filter(h => h.Url == this.searchTerm);
      if (stepWithUrl!=null && stepWithUrl.length>0){
        this.selectedStep = stepWithUrl[0];
        console.log( "img[id='img"+this.selectedStep.uid+"']" )
        $("img[id='img"+this.selectedStep.uid+"']").removeClass("img-opaque");
      }
    }

    this.gatherUrlParams()
    this.numChosenButtons = $( ".chosen").length;
  }

  extractYouTubeDetails(youTubeURL, youTubeEndpoint) {
    let o = this.stepService.scrapeContent(youTubeEndpoint).subscribe(o => {
      console.log("HERE in extractYouTubeDetails " +o)
      const obj = decodeURIComponent( JSON.parse(o+"").Content )
      const obj2 = JSON.parse(obj)
      this.selectedStep.Title = obj2.items[0].snippet.title;
      this.selectedStep.Description = obj2.items[0].snippet.description;
      this.selectedStep.Thumb = obj2.items[0].snippet.thumbnails.default.url;
      this.selectedStep.Url = youTubeURL;
      });
  }

  prepareNewStep() {
    this.feedback = []
    if (!this.isValidHttpUrl(this.newMaterialUrl) ){
      this.feedback.push("Url is not valid and must be https")
      return;
    }

    var duplicates = this.steps.filter(h => h.Url == this.newMaterialUrl );
    if (duplicates!=null && duplicates.length>0){
      this.feedback.push("We already have this URL")
      return;
    }

    this.editting=true;
    this.addingStep = true;
    this.selectedStep = new Step();
    if (!this.newMaterialUrl.startsWith("http://") && !this.newMaterialUrl.startsWith("https://"))
      this.newMaterialUrl="https://"+this.newMaterialUrl;

    var newUrl = this.newMaterialUrl
    this.selectedStep.Url = newUrl;
    this.selectedStep.ip=this.ipAddress
    this.selectedStep.Title = "";
    this.selectedStep.Description = "";
    this.selectedStep.Thumb = "";

    this.selectedStep.Recommender = this.cookieService.get("upskillingrecommender");

    this.stepService.scrapeContent(newUrl).subscribe(o => {
      let s = o.toString();
      if (s.includes("<title>") ){
        this.selectedStep.Title = s.substring(  s.indexOf("<title>")+7, s.indexOf("</title>")).trim();
      }
      if (!newUrl.startsWith("https://www.youtube.com/"  ))
        return;
      var youTubeEndpoint = null;
      if (newUrl.includes("v=")) { // E.g. https://www.youtube.com/watch?v=1xo-0gCVhTU&t=1191s
        var id = newUrl.substring( newUrl.indexOf("v=")+2);
        if (id.includes("&"))
          id=id.substring(0, id.indexOf("&"));
        youTubeEndpoint = new URL("https://www.googleapis.com/youtube/v3/videos?part=snippet&id="+id);
        this.selectedStep.Type = "Video";
      }
      if (newUrl.includes("channel/")) { // Eg https://www.youtube.com/channel/UCwqC1-y3uk5Zfg6F5S_PcVw
        var id=newUrl.substring(newUrl.indexOf("channel/")+8);
        if (id.includes("/"))
          id=id.substring(0, id.indexOf("/"));
        youTubeEndpoint = new URL("https://www.googleapis.com/youtube/v3/channels?part=snippet&id="+id );
        this.selectedStep.Type = "YouTubeChannel";
      }
      if (newUrl.includes("user/")) { // Eg https://www.youtube.com/user/derekbanas/playlists
        var id=newUrl.substring(newUrl.indexOf("user/")+5);
        if (id.includes("/"))
          id=id.substring(0, id.indexOf("/"));
        youTubeEndpoint = new URL("https://www.googleapis.com/youtube/v3/channels?part=snippet&forUsername="+id );
        this.selectedStep.Type = "YouTubeChannel";
      }
      if (youTubeEndpoint)
        this.extractYouTubeDetails(newUrl, youTubeEndpoint);
    } );
  }

  clearButtons(){
    $("button").removeClass("testing")
    $("img").removeClass("highlight");
    if (!this.stepBeingEditted)
      this.selectedStep=null;
  }

  onSelect(id: any, index: number, name:String, browsing: any) {
    var classOfImg =  ""+$("img[id='img"+id+"']" ).attr("class")

    console.log("On Select "+ classOfImg + $("span[id='clearAll']"))

    if( this.stepBeingEditted  || this.editting ||  classOfImg.includes("img-opaque") || this.isDragging || this.browsingThumb ){
      if ( browsing && classOfImg.includes("img-opaque")){
        $("span[id='clearAll']").css('background-color', 'red');
        setTimeout(function(){
          $("span[id='clearAll']").css('background-color', '');
        }, 100)
        return;
      }
      if( browsing &&  (this.addingStep /*|| this.stepBeingEditted  */|| this.editting )){
        this.flashReturnField()
        return;
      }
      if( !browsing &&  (this.addingStep || this.stepBeingEditted  || this.editting )){  
        return;
      }
    }

    this.stepBeingEditted = browsing;
    this.feedback = []
    $("input[name='search']").blur()
    $("button").removeClass("testing")
    $("img").removeClass("highlight");

    (name+" ").trim().split(" ").forEach(
      w=> {
        $("button[name='"+w+"']").addClass("testing");
        while (w.includes("/")){
          w = w.substr(0, w.lastIndexOf('/'))
          $("button[name='"+w+"']").addClass("testing")
        }
      }
    );
    var candidate = this.stepsMap.get( id );
    console.log("Candidate "+candidate)
    if (!candidate )
      return;
    this.addingStep = false;
    this.selectedStep = candidate;
    this.selectedStepId=id
    this.newMaterialUrl=""
    this.dateOfSelectedStep=new Date(candidate.DateMS).toLocaleDateString("en-US")
  }

  isValidHttpUrl(string) {
    let url;
    try {
      url = new URL(string);
    } catch (_) {
      return false;
    }
    return url.protocol === "https:";
  }

  validateForm(){
    this.feedback = []
    var s=this.selectedStep;
    if (s.Title)
      s.Title=s.Title.trim().replace("  ", " ").replace(/["']/g, "`")

    var letters = /[a-zA-Z]/;

    if ( !s.Title || !letters.test(s.Title) )
      this.feedback.push("A Title is required")

    if (s.Description)
      s.Description=s.Description.trim().replace(/\s\s+/g, " ").replace(/["']/g, "`")

    if (s.Tree){
      s.Tree = s.Tree.trim().replace(/\\/g,"/").replace(/\/\//g, "/").replace(/\s/g, '').replace(/["']/g, "`")

      if (s.Tree.startsWith("/"))
        s.Tree = s.Tree.substring(1)
      if (s.Tree.endsWith("/"))
        s.Tree = s.Tree.substring(0, s.Tree.length-1 )
      var camelized= "";
      var prevChar = '';
      for (var c = 0; c < s.Tree.length; c++){
        var char = s.Tree[c];
        if (char=="/")
          camelized += char;
        else {
          if (prevChar=="/" || prevChar=='')
            camelized += char.toUpperCase();
          else
            camelized += char.toLowerCase(  );
        }
        prevChar = char;
      }
      s.Tree = camelized;
    }
    if ( s.Tree && s.Tree.length>0 && !s.Tree.match( /[/](\w+)/ig) &&  !s.Tree.match( /(\w+)/ig)  )
      this.feedback.push("Branch field should be like Aaa/Bbb/Ccc")
    if (s.Tree &&  s.Tree.match(/\/[0-9a-z ]/))
      this.feedback.push("Branch field should be like Aaa/Bbb/Ccc")

   if (s.Tags)
     s.Tags = s.Tags.trim().replace(/\s\s+/g, " ").replace(/["']/g, "`").toLowerCase()
    if ( s.Tags && s.Tags.length>0 && !s.Tags.match(/^[0-9a-z ]+$/))
      this.feedback.push("Tag field should contain only spaces and 0-9a-z")

    if (s.Type)
      s.Type = s.Type.trim().replace(/\s\s+/g, " ").replace(/["']/g, "`").toLowerCase()
    if ( s.Type && s.Type.length >0 && !s.Type.match(/^[0-9a-z ]+$/))
      this.feedback.push("Type field should contain only spaces and 0-9a-z")

    if (s.Url)
     s.Url = s.Url.trim().replace(/\s\s+/g, " ")
    if ( !this.isValidHttpUrl(s.Url))
      this.feedback.push("The URL is not valid, and must be https")

    if ( s.Recommender )
      s.Recommender = s.Recommender.trim().replace(/\s\s+/g, " ").replace(/["']/g, "`")

    this.cookieService.set("upskillingrecommender", s.Recommender);
  }

  reload(){
    this.clearAll();
    this.getSteps(true)
    this.browsingThumb = false;
  }

  save() {
    this.validateForm();

    if (this.feedback.length>0)
      return;
    this.stepService.addStep(this.selectedStep).subscribe(
      o => {
        console.log("AddStep output" + JSON.stringify(o))
        this.selectedStepId = o.uid;
        this.selectedStep.uid = o.uid;

      /*  if (this.addingStep){

          var url =  window.location.href;
          if (url.endsWith("/"))
            url=url.substr(0, url.length-1);
          window.location.href = window.location.href+"?id="+o.uid;
          return;
          // ===============
        }*/
        this.getSteps(false)
        //this.clearAll();
        //this.cancel();
        this.addingStep=false;
        $("button").removeClass("chosen")
        this.searchTerm=""
      }
    );
  }

  deleteStep() {
    if(confirm("Please confirm/cancel deletion..")) {
      this.stepService.deleteStep(this.selectedStep ).subscribe(res => {
        this.stepsMap.delete(this.selectedStep.uid);
        var id = this.selectedStep.uid+"";
        this.steps = this.steps.filter(h => h !== this.selectedStep );
        if (this.selectedStep === this.selectedStep ) {
          this.selectedStep = null;
        }

        this.paths.forEach(p => {
            var index = p.StepIds.indexOf(id);
            if(index!=-1){
                p.StepIds.splice(index,1)
                this.stepService.savePath(p).subscribe( o => {
                });
            }
          });
          this.clearAll();
          this.getSteps(false)
          this.cancel();
        }
        );
      }
  }

  cancel() {
    this.feedback = []
    this.addingStep = false;
    this.selectedStep = null;
    this.stepBeingEditted=false;
    this.editting=false;
    this.browsingThumb=false;
    this.addingStep = false;
  }

  addStepClicked(){
//    this.flashNewMaterialField()
    this.editting=true;
    this.addingStep = true;
    this.selectedStep = null;
    this.stepBeingEditted=true;
  }

  onKeydown( event) {
    console.log("onKeydown event.key "+event.key)


  }

  onKeyup( event) {
    if (event.key=="Escape"){
      console.log("Escap pressed")
      this.cancel()
    }
    console.log("onKeyup event.key "+event.key)

  }

  copyToClipboard() {
    this.gatherUrlParams();
    const body = document.querySelector('body');
    const paragraph = document.querySelector('p');
    const area = document.createElement('textarea');
    body.appendChild(area);
    area.value = this.deepUrl;
    area.select();
    document.execCommand('copy');
    body.removeChild(area);
  }

  clearAll(){
    this.showBranches = true;
    this.showTags = false;
    this.showTypes = false;
    this.showRecommenders = false;
    
    this.cancel();
    this.selectedStep=null;
    this.numChosenButtons=0;
    this.searchTerm=""
    $("button").removeClass("chosen");
    $("button").removeClass("testing");
    $("img[alt='refreshPage']").removeClass("img-opaque");
    $( "code[name='path']").removeClass("testing");
    this.gatherUrlParams();
  }

  started(event: CdkDragStart<string[]>) {
    console.log("Started " +event.source)
    this.idBeingDragged= event.source.data["uid"];
    this.isDragging=true;
  }

  stopped(event: CdkDragEnd<string[]>) {
    console.log("stopped " +event.source)
    this.isDragging=false;
  }

  started2(event: CdkDragStart<string[]>) {
    console.log("started2 ")
    console.log(event.source)
    this.idBeingDragged= event.source.data["uid"];
    this.isDragging=true;
  }

  stopped2(event: CdkDragEnd<string[]>) {
    console.log("stopped2 ")

    this.isDragging=false;
  }


  dropStep(event: CdkDragDrop<string[]>) {
    console.log("Drop Step idBeingDragged:" +this.idBeingDragged + " event.container.data "+event.container.data+" event.currentIndex "+event.currentIndex)
    if ( event.previousContainer.id.startsWith("stepPool") && event.container.id.startsWith("path") ){
        copyArrayItem([""+this.idBeingDragged],
                          event.container.data,
                          0,
                          event.currentIndex);
    }
   else if (event.previousContainer.id.startsWith("path") && event.container.id.startsWith("path") && event.previousContainer != event.container ){
      console.log("COPYING " +this.idBeingDragged )
      copyArrayItem([""+this.idBeingDragged],
      event.container.data,
      0,
      event.currentIndex);
    }
    else if (event.container.id.startsWith("path") &&  (event.previousContainer === event.container)){
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }
    else if ( (event.previousContainer.id.startsWith("path"))  &&  (event.container.id=="binPool") ){
      transferArrayItem(event.previousContainer.data,
        [],
        event.previousIndex,
        0);
    }
    this.savePaths();

  }

  newPath(){
    var newPath: Path  = new Path;
    newPath.StepIds = []
    newPath.Title="Unnamed"
    newPath.uid=this.uuidv4();
    this.paths.push(newPath);
    this.savePaths();
  }

  savePaths(){
    this.feedbackPaths = []
    this.paths.forEach(p => {
      p.Title = p.Title.trim();
      if ( !p.Title || p.Title.length==0)
        this.feedbackPaths.push("A Path Title cannot be empty")
        return;
    })

    this.paths.forEach(p => {
      if ( p.Title && p.Title.length>0 )
        this.stepService.savePath(p).subscribe( o => {
      });
    });
  }

  deletePath(uid){
    if(confirm("Please confirm/cancel deletion..")) {
      this.stepService.deletePath(uid).subscribe( o => {
        this.clearAll();
        this.getSteps(false)
        this.browsingThumb = false;
        this.stepBeingEditted=false;
      });
    }
  }

  uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  openUrl( url){
      window.open(url);
  }

  dropped(files: NgxFileDropEntry[]) {
    this.files = files;
    for (const droppedFile of files) {
      // Is it a file?
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          this.stepService.uploadThumb( this.selectedStep.uid, file).subscribe( o => {
            this.selectedStep.Thumb=o["imageUrl"];
          });
        });
      }
    }
    this.browsingThumb = false;
  }

  fileOver(event){
  }

  fileLeave(event){
  }

  editted(){
    this.stepBeingEditted=true;
  }

  flashNewMaterialField(){
    $("input[id='newMaterial']").css("background-color", "yellow");
    setTimeout(function(){
      $("input[id='newMaterial']").css("background-color", "white");
    }, 100)
  }

  flashReturnField(){
    $("img[id='undo']").css('border-color', 'red');
    setTimeout(function(){
      $("img[id='undo']").css('border-color', '');
    }, 100)
  }

  casify(tree){
    return tree.replaceAll("Sapcx", "SAPCX").replaceAll("Sap", "SAP").replaceAll("Cicd", "CICD").replaceAll("Tdd", "TDD")

   // return tree;
  }

  status(){
    console.log("addingStep "+this.addingStep)
  }
}
