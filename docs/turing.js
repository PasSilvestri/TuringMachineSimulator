var taCode;
var stateLabel;
var nastro;
var taInput;
var runBtn;
var speedSelect;
var stepLabel;

var expControl;
var timer;

var comands;
var loopFlag = 0;
var stopPressed = 0;
//Hold the id of the looping interval
var interval;
var speed = 800;



var general = {
	//General flags
	nastroSideLength: 22,
	stepCount: 0,
	stepThreshold: 10000,
	
	//Execution var
	nastroValue: [],
	nastroNegValue: [],
	nastroIndex: 0,
	currentState: "0"
};

function ComandLine(comand,line,original){
	this.comand = comand || "";
	this.line = line || 0;
	this.original = original || "";
}

//Control all of the exceptions
function ExceptionControl(textObj){
	
	this.error = 0;
	
	this.syntaxNotValid = function (line,str){
		textObj.innerHTML = "[ERROR] Syntax not valid of comand at line " + line + " : " + str;
		stop();
		this.error = 1;
	}
	
	this.internalError = function (line){
		textObj.innerHTML = "[ERROR] Internal error occured while " + line;
		stop();
		this.error = 2;
	}
	
	this.stepThresholdReached = function(line){
		textObj.innerHTML += " || [ERROR] Step count threshold reached, steps: " + line;
		stop();
		this.error = 3;
	}
}

//Control time since loading
function Timer(){
	this.time = 0;
	
	this.increment = function(timer, granularity){
		timer.time += granularity/1000;
		console.log(timer.time);
	}
	
	this.increment.bind(this);
	
	this.start = function(granularity){
		granularity = granularity === undefined ? 1000 : granularity;
		this.intCon = setInterval(this.increment,granularity ,this, granularity);
	}
	
	this.stop = function(){
		clearInterval(this.intCon);
	}
	
}

//Initialize all variables and graphic objects
function init(){
	//Init variables
	taCode = document.getElementById("codetext");
	stateLabel = document.getElementById("statelabel");
	nastro = document.getElementById("outtext");
	taInput = document.getElementById("intext");
	runBtn = document.getElementById("runbtn");
	stopBtn = document.getElementById("stopbtn");
	speedSelect = document.getElementById("speed");
	stepLabel = document.getElementById("steplabel");
	
	expControl = new ExceptionControl(stateLabel);
	//timer = new Timer();
	//timer.start(1000);

	//Init nastro
	printNastro(nastro, general.nastroValue, general.nastroNegValue, general.nastroIndex, general.nastroSideLength);
	
	//Init onClick listner
	runBtn.addEventListener("click",run);
	stopBtn.addEventListener("click",stop);
	enableRunBtn(true);
	stepLabel.innerHTML = "Stopped";
}

//The main function, runs the interpreter
function run(){
	//Cleaning all flags and fields
	//Error
	expControl.error = 0;
	//Flow control float
	general.stepCount = 0;
	loopFlag = 1;
	stopPressed = 0;
	//Execution flags and infos
	general.currentState = 0;
	general.nastroValue = fromStringToArray(taInput.value.replace(/\n/g,' '));
	general.nastroNegValue = [];
	general.nastroIndex = 0;
	
	//Setting graphic objects
	printNastro(nastro, general.nastroValue, general.nastroNegValue, general.nastroIndex, general.nastroSideLength);
	stateLabel.innerHTML = general.currentState;
	enableRunBtn(false);
	stepLabel.innerHTML = "Steps: 0";
	
	
	
	//retrieve comand list
	comands = retrieve(taCode,expControl);
	if(comands == null) return;
	
	//Starts actual execution
	if(speedSelect.value == "Max" || speedSelect.value == "Result only"){
		do{
			loop();
		}while(loopFlag == 1 && stopPressed == 0 && expControl.error == 0);
		console.log("Nastro " + fromArrayToString(general.nastroValue,general.nastroNegValue));
		printNastro(nastro, general.nastroValue, general.nastroNegValue, general.nastroIndex, general.nastroSideLength);
		if(expControl.error == 0){
			stateLabel.innerHTML = general.currentState;
		}
		stop();
	}
	else{
		//Set the speed
		speed = 800;
		if(speedSelect.value == 1) speed = 1800;
		if(speedSelect.value == 2) speed = 1500;
		if(speedSelect.value == 3) speed = 1300;
		if(speedSelect.value == 4) speed = 1000;
		if(speedSelect.value == 5) speed = 800;
		if(speedSelect.value == 6) speed = 500;
		if(speedSelect.value == 7) speed = 300;
		if(speedSelect.value == 8) speed = 200;
		if(speedSelect.value == 9) speed = 100;
		if(speedSelect.value == 10) speed = 50;
		
		//interval = setInterval(intervalFunction,speed);
		intervalFunction();
	}
}

//Stops the execution and set everything accordingly
function stop(){
	stopPressed = 1;
	enableRunBtn(true);
	stepLabel.innerHTML = "Stopped. Steps: " + general.stepCount;
}

//Wrapper for loop() while speed not max
function intervalFunction(){
	if(loopFlag == 1 && stopPressed == 0 && expControl.error == 0){
		loop();
		if(stillExecutableComands(comands) && expControl.error == 0){
			setTimeout(intervalFunction,speed);
			return;
		}
	}
	stop();
}

//Looping function that executes all comands
function loop(){
	loopFlag = 0;
	for(var i=0; i<comands.length; i++){
		//Ignore comments
		if(comands[i].comand.startsWith("//")){
			continue;
		}
		//Ignore empty lines
		if(isTrimmedEmpty(comands[i].comand) == 1){
			continue;
		}
		//Execute and register result
		loopFlag = executeComand(comands[i].comand.split(','));
		//If loopFlag == 1 break and restart for loop
		//If loopFlag == -1 error occured
		if(loopFlag != 0){
			var l = taCode.value.indexOf(comands[i].original);
			taCode.selectionStart = l;
			taCode.selectionEnd = l + comands[i].original.length;
			taCode.focus();
			general.stepCount++;
			stepLabel.innerHTML = "Steps: " + general.stepCount;
			if(general.stepCount >= general.stepThreshold){
				expControl.stepThresholdReached(general.stepCount);
			}
			break;
		}
	}
}




function enableRunBtn(flag){
	if(flag){
		runBtn.disabled = false;
		stopBtn.disabled = true;
	}
	else{
		runBtn.disabled = true;
		stopBtn.disabled = false;
	}
}

//Check if there are still comands to be executed (comandList instanceof Array of ComandLine)
function stillExecutableComands(comandList){
	for(var i=0; i<comandList.length; i++){

        //Ignore comments
        if(comandList[i].comand.startsWith("//")){
            continue;
        }
        //Ignore empty lines
        if(isTrimmedEmpty(comandList[i].comand) == 1){
            continue;
        }

		var parameters = comandList[i].comand.split(",");
		
		//Check state we are in
		if(general.currentState == parameters[0].trim()){
			//Check char on nastro
			if(general.nastroIndex >=0){
				if(general.nastroValue[general.nastroIndex] == parameters[1].charAt(0) || ( general.nastroValue[general.nastroIndex] == undefined && parameters[1].charAt(0) == '_' ) || (parameters[1].charAt(0) == '\\' && general.nastroValue[general.nastroIndex] == parameters[1].charAt(1)) ){
					return 1;
				}
			}
			else{
				if(general.nastroNegValue[(general.nastroIndex*-1)-1] == parameters[1].charAt(0) || ( general.nastroNegValue[(general.nastroIndex*-1)-1] == undefined && parameters[1].charAt(0) == '_' )  || (parameters[1].charAt(0) == '\\' && general.nastroValue[(general.nastroIndex*-1)-1] == parameters[1].charAt(1)) ){
					return 1;
				}
			}
		}
	}
	return 0;
}

//Retrieve the comand list and does a check on the validity of the comands
function retrieve(taCode, expControl) {
	var comandList = taCode.value.split("\n");
	var finalComandList = new Array();
	
	for(var i=0; i<comandList.length; i++){
		
		//Check if comment
		if(comandList[i].startsWith("//")){
			continue;
		}
		
		//Check for empty lines
		if(isTrimmedEmpty(comandList[i]) == 1){
			continue;
		}
		
		var parameters = comandList[i].split(",");
		
		//Check for the amount of parameters
		if(parameters.length < 5){
			expControl.syntaxNotValid(i+1,"Too few parameters");
			return null;
		}
		else if(parameters.length > 5){
			expControl.syntaxNotValid(i+1,"Too many parameters");
			return null;
		}
		
		//check for validity of parameters
		if(parameters[0].length == 0 || parameters[1].length == 0 || parameters[2].length == 0 || parameters[3].length == 0 || parameters[4].length == 0){
			expControl.syntaxNotValid(i+1,"Non valid parameters, params cannot be empty");
			return null;
		}
		
		//Check if last parameter is a valid move
		if(parameters[4].charAt(0) != '<' && parameters[4].charAt(0) != '>' && parameters[4].charAt(0) != '-'){
			expControl.syntaxNotValid(i+1,"Non valid parameters, param #5 needs to be \"<,>,-\"");
			return null;
		}

		//Expand comand if is a compacted rule
		var tempExpanded = expand(comandList[i],i);
		for(var c=0; c<tempExpanded.length; c++){
			finalComandList.push(tempExpanded[c]);
		}

	}
	
	return finalComandList;
}

function expand(original,line){
	var array = new Array();
	var comand = new ComandLine();
	comand.line = line;
	comand.original = original;
	//Dummy code --- to be changed with expansion rules
	comand.comand = original;
	array.push(comand);

	return array
}

//Prints str to nastro with all the cells
function printNastro(nastro,array,negArray,indexCentralChar,sideLength){
	var str = fromArrayToString(array,negArray);
	if(negArray !== undefined){
		indexCentralChar = indexCentralChar+negArray.length;
	}
	var p1 = "";
	var c = "_";
	var p2 = "";
	if(indexCentralChar >-1 && indexCentralChar < str.length){
		
		//Divide the string into the 3 pieces
		p1 = str.substring(0,indexCentralChar);
		c = str.charAt(indexCentralChar);
		p2 = str.substring(indexCentralChar+1);
		
	}
	else if(indexCentralChar >= str.length){
		p1 = str;
		var tot = indexCentralChar - str.length;
		for(var i=0; i< tot; i++){
			p1 += "_";
		}
		c = '_';
	}
	else if(indexCentralChar < 0){
		p2 = str;
		var tot = (indexCentralChar*-1)-1;
		for(var i=0; i< tot; i++){
			p2 = "_" + p2;
		}
		c = '_';
	}
	
	//Set "_" remaning on each side
	var tot = sideLength - p1.length;
	if(tot < 0){
		p1 = p1.substring(tot*-1);
	}
	for(var i=0; i< tot; i++){
		p1 = "_" + p1;
	}
	
	tot = sideLength - p2.length;
	if(tot < 0){
		p2 = p2.substring(0,20);
	}
	for(var i=0; i< tot; i++){
		p2 += "_";
	}
	
	//Set the HTML
	var finalStr = "";
	for(var i=0; i<p1.length; i++){
		finalStr += "<span class=\"outtextchar\">"+p1.charAt(i)+"</span>";
	}
	finalStr += "<span style=\"color: white; padding-left: 0.3vw; padding-right: 0.3vw; width: 1.3vw; height: 2vw; font-size: 2vw; background-color: green;\">" + c + "</span>"
	for(var i=0; i<p2.length; i++){
		finalStr += "<span class=\"outtextchar\">"+p2.charAt(i)+"</span>";
	}
	nastro.innerHTML = finalStr;
	return p1+" "+c+" "+p2;
}

//Function to change char at the specified index
function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substr(0,index) + chr + str.substr(index+1);
}

//Check if string without spaces is empty
function isTrimmedEmpty(str){
	str = str.replace(/\s/g,'');
	if(str.length == 0){
		return 1;
	}
	return 0;
}

//From string to array
function fromStringToArray(str){
	var array = [];
	for(var i=0,a=0; i<str.length; i++,a++){
		if(str.charAt(i) == '_'){
			continue;
		}
		//Escaped chars are valid chars
		if(str.charAt(i) == '\\'){
			i++;
		}
		array[a] = str.charAt(i);
	}
	return array;
}

//From array to string
function fromArrayToString(array, negArray){
	var str = "";
	var str2 = "";
	for(var i=0; i<array.length; i++){
		if(array[i] == undefined){
			str += '_';
			continue;
		}
		str += array[i];
	}
	if(negArray !== undefined){
		for(var i=negArray.length-1; i > -1; i--){
			if(negArray[i] == undefined){
			str2 += '_';
			continue;
		}
		str2 += negArray[i];
		}
	}
	return (str2+str);
}

//Try to execute the comand. Needs array of 5 parameters
//Return 1 if executed, 0 if not executed, -1 if error occured
function executeComand(parameters){
	var res = 0;
	if(parameters.length != 5){
		expControl.internalError("executing comand");
		return -1;
	}
	
	//Check state we are in
	if(general.currentState == parameters[0].trim()){
		//Check char on nastro
		if(general.nastroIndex >=0){
			if(general.nastroValue[general.nastroIndex] == parameters[1].charAt(0) || ( general.nastroValue[general.nastroIndex] == undefined && parameters[1].charAt(0) == '_' ) || (parameters[1].charAt(0) == '\\' && general.nastroValue[general.nastroIndex] == parameters[1].charAt(1)) ){
				//Change state and nastro value
				general.currentState = parameters[2].trim();
				if(parameters[3].charAt(0) == '_'){
					delete general.nastroValue[general.nastroIndex];
				}
				else if(parameters[3].charAt(0) == '\\'){
					general.nastroValue[general.nastroIndex] = parameters[3].charAt(1);
				}
				else{
					general.nastroValue[general.nastroIndex] = parameters[3].charAt(0);
				}
				
				//Move index according to param n.5
				if(parameters[4].charAt(0) == '>'){
					general.nastroIndex++;
				}
				else if(parameters[4].charAt(0) == '<'){
					general.nastroIndex--;
				}
				else if(parameters[4].charAt(0) == '-'){
				}
				else{
					expControl.internalError("executing comand");
					return -1;
				}
				
				//Set the result to 1
				res = 1;
			}
		}
		else{
			if(general.nastroNegValue[(general.nastroIndex*-1)-1] == parameters[1].charAt(0) || ( general.nastroNegValue[(general.nastroIndex*-1)-1] == undefined && parameters[1].charAt(0) == '_' )  || (parameters[1].charAt(0) == '\\' && general.nastroValue[(general.nastroIndex*-1)-1] == parameters[1].charAt(1)) ){
				//Change state and nastro value
				general.currentState = parameters[2].trim();
				if(parameters[3].charAt(0) == '_'){
					delete general.nastroNegValue[(general.nastroIndex*-1)-1];
				}
				else if(parameters[3].charAt(0) == '\\'){
					general.nastroNegValue[(general.nastroIndex*-1)-1] = parameters[3].charAt(1);
				}
				else{
					general.nastroNegValue[(general.nastroIndex*-1)-1] = parameters[3].charAt(0);
				}
				
				//Move index according to param n.5
				if(parameters[4].charAt(0) == '>'){
					general.nastroIndex++;
				}
				else if(parameters[4].charAt(0) == '<'){
					general.nastroIndex--;
				}
				else if(parameters[4].charAt(0) == '-'){
				}
				else{
					expControl.internalError("executing comand");
					return -1;
				}
				
				//Set the result to 1
				res = 1;
			}
		}
		
		//Print new state to screen with delay
		if(speedSelect.value != "Result only"){
			console.log("Nastro " + fromArrayToString(general.nastroValue,general.nastroNegValue));
			printNastro(nastro, general.nastroValue, general.nastroNegValue, general.nastroIndex, general.nastroSideLength)
			stateLabel.innerHTML = general.currentState;
		}
	}
	return res;
}








































