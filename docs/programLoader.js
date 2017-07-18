var ta;
var saveBtn;
var loadBtn;
var programSelect;
var filePicker;

var programPath = "./preset%20programs/";
var programListFile = "proglist";
var programs;
var customProg = new Array();
customProg["Custom"] = "";
var lastFile;
var lastFileName = "";


function programLoaderInit(){
	ta = document.getElementById("codetext");
	saveBtn = document.getElementById("savebtn");
	loadBtn = document.getElementById("loadbtn");
	programSelect = document.getElementById("programselect");
	filePicker = document.getElementById("filepicker");
	
	loadProgramList();
	loadProgramFromPreset("Default.txt");
	
	saveBtn.addEventListener("click", save);
	loadBtn.addEventListener("click", load);
	ta.addEventListener("keyup",handleCustomProgram);
	programSelect.addEventListener("change", loadLocal);
	
}

//When editing the program shown, save it
function handleCustomProgram(){
	customProg[programSelect.value] = ta.value;
	console.log("Autosaving "+programSelect.value);
}

function loadLocal(){
	var prog = programSelect.value;
	if(prog == "Load from file"){
		console.log("Loading from scratch");
		filePicker.click(); //The filePicker has registered on change to call loadProgramFromDisk with the selected files
	}
	else if(customProg[prog] != undefined){
		ta.value = customProg[prog];
		console.log("Loading locally");
	}
	else{
		console.log("Loading from scratch");
		load();
	}
}

//Loads the selected program from the right source
function load(){
	var prog = programSelect.value;
	if(prog == "Load from file"){
		filePicker.click(); //The filePicker has registered on change to call loadProgramFromDisk with the selected files
	}
	else if(prog == "Custom"){
		ta.value = customProg["Custom"];
	}
	else if(prog.startsWith("LOCAL:")){
		loadProgramFromDisk(lastFile);
	}
	else{
		loadProgramFromPreset(prog+".txt");
	}
}

//load the specified program from the preset folder
function loadProgramFromPreset(program){
	ta.value = "Loading...";
	var xhttp = new XMLHttpRequest();
	
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			ta.value = this.responseText;
			handleCustomProgram(); //Saves locally the newly loaded data
		}
		else if(this.readyState == 4 && this.status == 404){
			ta.value = "Error loading from the preset folder!";
			console.log("Error loading from the preset folder!");
		}
	};
	
	xhttp.onerror = function() {
		ta.value = "Error loading from the preset folder, no internet connection!";
		console.log("Error loading from the preset folder, no internet connection!");
	};
	
	xhttp.open("GET", programPath+program, true);
	xhttp.send();
}

//load the specified program from the user's computer
function loadProgramFromDisk(files){
	ta.value = "Loading...";
	lastFile = files;
	var file = files.item(0);
	lastFileName = file.name;
	var fileReader = new FileReader();
	
	fileReader.onload = function(event) {
		ta.value = event.target.result;
		if(programSelect.options[programSelect.options.length-1].innerHTML.startsWith("LOCAL:")){
			programSelect.options[programSelect.options.length-1].innerHTML = "LOCAL: "+file.name;
		}
		else{
			programSelect.innerHTML += "<option>LOCAL: "+file.name+"</option>";
		}
		programSelect.selectedIndex = programSelect.options.length-1;
		handleCustomProgram(); //Saves locally the newly loaded data
	};
	
	fileReader.onerror = function(){
		ta.value = "Error loading from the disk!";
	};
	
	fileReader.readAsText(file);
}


//Load the program list and adds it to the program select
function loadProgramList(){
	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			programs = this.responseText.split("\n");
			
			for(var i=0; i<programs.length; i++){
				
				var p = programs[i].replace(".txt","");
				if(p.charCodeAt(p.length-1) == 13){ //Eliminating the enter char at the end
					p = p.substring(0,p.length-1); 
				}
				
				if(p == "Default"){
					programSelect.innerHTML += "<option selected>"+p+"</option>";
				}
				else{
					programSelect.innerHTML += "<option>"+p+"</option>";
				}
			}
		}
	};
	xhttp.open("GET", programPath+programListFile, true);
	xhttp.send();
}

//STUB function
function save(){
	console.log("Save file to disk!");
	alert("Function still not available");
}






