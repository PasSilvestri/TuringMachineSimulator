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

//Expansion logic flags and vars
var alphabet = "!\"#$%&\'()*+,-./:;<=>?@0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz[]^-{|}";


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

	this.clone = function(){
		return new ComandLine(this.comand,this.line,this.original);
	}
}

//Contains the string to expand for each class of expansion, and the original value
function ExpansioClassContainer(){
	this.toChange = "";
	this.cs = -1;
	this.ce = -1;
	this.expContent = "";
	this.flag = 0;
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

	this.expansionError = function (line) {
        textObj.innerHTML = "[ERROR] Expansion error: " + line;
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
		else if(speedSelect.value == 2) speed = 1500;
		else if(speedSelect.value == 3) speed = 1300;
		else if(speedSelect.value == 4) speed = 1000;
		else if(speedSelect.value == 5) speed = 800;
		else if(speedSelect.value == 6) speed = 500;
		else if(speedSelect.value == 7) speed = 300;
		else if(speedSelect.value == 8) speed = 200;
		else if(speedSelect.value == 9) speed = 100;
		else if(speedSelect.value == 10) speed = 50;
		
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
		var temp = replaceIfNotEscaped(comands[i].comand,",","§");
		temp = temp.replace(/\\/g,"");
        var parameters = temp.split("§");

		loopFlag = executeComand(parameters);
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

//Switch state of run and stop buttons
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


        var temp = replaceIfNotEscaped(comandList[i].comand,",","§");
        temp = temp.replace(/\\/g,"");
        var parameters = temp.split("§");
		
		//Check state we are in
		if(general.currentState == parameters[0].trim()){
			//Check char on nastro
			if(general.nastroIndex >=0){
				if(general.nastroValue[general.nastroIndex] == parameters[1].charAt(0) || ( general.nastroValue[general.nastroIndex] == undefined && parameters[1].charAt(0) == '_' ) ){
					return 1;
				}
			}
			else{
				if(general.nastroNegValue[(general.nastroIndex*-1)-1] == parameters[1].charAt(0) || ( general.nastroNegValue[(general.nastroIndex*-1)-1] == undefined && parameters[1].charAt(0) == '_' ) ){
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
		var ch = true;
		if((ch = areValidChars(comandList[i])) != true){
            expControl.syntaxNotValid(i+1,ch + " not valid char");
		}

		var tempComand = replaceIfNotEscaped(comandList[i],",","§");
		var parameters = tempComand.split("§");


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
			//Check if is a compac parameter
			if(parameters[4].charAt(0) == '(' || parameters[4].charAt(0) == '[' || parameters[4].charAt(0) == '{'){

				for(var c=1; c<parameters[4].length-1; c++){
                    if(parameters[4].charAt(c) != '<' && parameters[4].charAt(c) != '>' && parameters[4].charAt(c) != '-'){
                        expControl.syntaxNotValid(i+1,"Non valid parameters, invalid param #5 expansion");
                        return null;
                    }
				}

                if(parameters[4].charAt(parameters[4].length-1) != ')' || parameters[4].charAt(parameters[4].length-1) != ']' || parameters[4].charAt(parameters[4].length-1) != ']'){
                    expControl.syntaxNotValid(i+1,"Non valid parameters, invalid param #5 expansion");
                    return null;
				}
			}
			else {
                expControl.syntaxNotValid(i + 1, "Non valid parameters, param #5 needs to be \"<,>,-\"");
                return null;
            }
		}

		//Expand comand if is a compacted rule
		var tempExpanded = expand(comandList[i],i);
		if(tempExpanded == null) return null;
		//finalComandList.concat(tempExpanded);

		for(var c=0; c<tempExpanded.length; c++){
			finalComandList.push(tempExpanded[c]);
		}


	}
	
	return finalComandList;
}

//Expand the compacted comands and return an array of comandLines with the same original comand
function expand(original,line){
	var array = new Array();
	var comand = new ComandLine();
	comand.line = line;
	comand.original = original;

	//Dummy code --- to be changed with expansion rules
    /*comand.comand = original;
	array.push(comand);*/

	//Expansion
	//1) check for expansion errors and expansion classes lengths in the parameters
	original = replaceIfNotEscaped(original,",","§");
	var param = original.split("§");
	var class1Length = -1, class2Length = -1, class3Length = -1;
    var cs = -1; //Index of the first opening parenthesis - c1s = class start
    var ce = -1; //Index of the first closing parenthesis - c1s = class end
    var expContent = ""; //Content of the parenthesis
    var subAlphabet = ""; //List of char in expansion
	var flag = 0;
    for(var i=0; i<param.length; i++){

		//First expansion class
		flag = 0;
		//Checking for syntax errors, multiple parenthesis
		for(var c = 0; c < param[i].length; c++){
			if(param[i][c] == '(' && param[i][c-1] != '\\'){ //If there is a "(" not escaped...
				if(flag != 0){ //...and is not the first one
					expControl.expansionError("To many expansion parenthesis in comand at line " + (line+1) );
					return null;
				}
				flag++;
				cs = c;
			}
			else if(param[i][c] == ')' && param[i][c-1] != '\\'){ //If the is a ")" not escaped...
				if(flag != 1){ //...and is not the firs one
                    expControl.expansionError("To many expansion parenthesis in comand at line " + (line+1) );
                    return null;
				}
				flag++;
				ce = c;
			}

			if(flag > 2){
                expControl.expansionError("To many expansion parenthesis in comand at line " + (line+1) );
                return null;
			}
		}
		//Check length of class
		if(flag == 2){
            expContent = param[i].substring(cs+1,ce);
            subAlphabet = "";
            //Check for ".." expansion
			var ddi = -1; //double dot index
			var ddl = "°°".length; //Chrome add chars to this string, so length changes at runtime
			expContent = replaceIfNotEscaped(expContent,".","°");
			while(expContent.indexOf("°°") != -1) {
                if ((ddi = expContent.indexOf("°°")) != -1) {
                    //All those ifs are here to check for escaped chars and to take the actual char befor the ".."
                    if (!isEscapeable(expContent[ddi - 1]) || (isEscapeable(expContent[ddi - 1]) && expContent[ddi - 2] == '\\')) {
                        if (!isEscapeable(expContent[ddi + ddl])) {
                            subAlphabet = alphabet.substring(alphabet.indexOf(expContent[ddi - 1])+1, alphabet.indexOf(expContent[ddi + ddl]));
                        }
                        else if (isEscapeable(expContent[ddi + ddl+1]) && expContent[ddi + ddl] == '\\') {
                            subAlphabet = alphabet.substring(alphabet.indexOf(expContent[ddi - 1])+1, alphabet.indexOf(expContent[ddi + ddl + 1]));
                        }
                    }
                    else { //This else is execute if the char befor ".." should be escaped but wasn't
                        expControl.syntaxNotValid(line + 1, "Unescaped character");
                        return null;
                    }
                    //Rebuilding the expContent
                    expContent = expContent.replace("°°", subAlphabet);
                    subAlphabet = "";
                }
            }
			//Check for "^" expansion
            expContent = replaceIfNotEscaped(expContent,"^","°");
            if(expContent.indexOf("°") != -1){
            	var tempNot = expContent.substring(expContent.indexOf("°")+1);
            	tempNot = tempNot.replace(/\\/g,"");
				subAlphabet = getNotAlphabet(tempNot); //Returns all the chars in the alphabet excuded the one passed as parameters
				subAlphabet = reescape(subAlphabet);

                //Rebuilding the expContent
                expContent = expContent.substring(0,expContent.indexOf("°"))+subAlphabet;
            }



            //Getting the length of the expansion
			if(class1Length == -1){
            	class1Length = expContent.replace(/\\/g,"").length;
			}
			else{
				var counterLength = -1;
                counterLength = expContent.replace(/\\/g,"").length;
                if(counterLength != class1Length){
                	expControl.expansionError("Different expansion class lengths at comand in line " + (line+1) );
                	return null;
				}
			}

            //Rebuild the parameter
			param[i] = param[i].substring(0, cs+1) + expContent + param[i].substring(ce);
		}



        //Second expansion class
        flag = 0;
        //Checking for syntax errors, multiple parenthesis
        for(var c = 0; c < param[i].length; c++){
            if(param[i][c] == '[' && param[i][c-1] != '\\'){ //If there is a "[" not escaped...
                if(flag != 0){ //...and is not the first one
                    expControl.expansionError("To many expansion parenthesis in comand at line " + (line+1) );
                    return null;
                }
                flag++;
                cs = c;
            }
            else if(param[i][c] == ']' && param[i][c-1] != '\\'){ //If the is a "]" not escaped...
                if(flag != 1){ //...and is not the firs one
                    expControl.expansionError("To many expansion parenthesis in comand at line " + (line+1) );
                    return null;
                }
                flag++;
                ce = c;
            }

            if(flag > 2){
                expControl.expansionError("To many expansion parenthesis in comand at line " + (line+1) );
                return null;
            }
        }
        //Check length of class
        if(flag == 2){
            expContent = param[i].substring(cs+1,ce);
            subAlphabet = "";
            //Check for ".." expansion
            var ddi = -1; //double dot index
            var ddl = "°°".length; //Chrome add chars to this string, so length changes at runtime
            expContent = replaceIfNotEscaped(expContent,".","°");
            while(expContent.indexOf("°°") != -1) {
                if ((ddi = expContent.indexOf("°°")) != -1) {
                    //All those ifs are here to check for escaped chars and to take the actual char befor the ".."
                    if (!isEscapeable(expContent[ddi - 1]) || (isEscapeable(expContent[ddi - 1]) && expContent[ddi - 2] == '\\')) {
                        if (!isEscapeable(expContent[ddi + ddl])) {
                            subAlphabet = alphabet.substring(alphabet.indexOf(expContent[ddi - 1])+1, alphabet.indexOf(expContent[ddi + ddl]));
                        }
                        else if (isEscapeable(expContent[ddi + ddl+1]) && expContent[ddi + ddl] == '\\') {
                            subAlphabet = alphabet.substring(alphabet.indexOf(expContent[ddi - 1])+1, alphabet.indexOf(expContent[ddi + ddl + 1]));
                        }
                    }
                    else { //This else is execute if the char befor ".." should be escaped but wasn't
                        expControl.syntaxNotValid(line + 1, "Unescaped character");
                        return null;
                    }
                    //Rebuilding the expContent
                    expContent = expContent.replace("°°", subAlphabet);
                    subAlphabet = "";
                }
            }
            //Check for "^" expansion
            expContent = replaceIfNotEscaped(expContent,"^","°");
            if(expContent.indexOf("°") != -1){
                var tempNot = expContent.substring(expContent.indexOf("°")+1);
                tempNot = tempNot.replace(/\\/g,"");
                subAlphabet = getNotAlphabet(tempNot); //Returns all the chars in the alphabet excuded the one passed as parameters
                subAlphabet = reescape(subAlphabet);

                //Rebuilding the expContent
                expContent = expContent.substring(0,expContent.indexOf("°"))+subAlphabet;
            }


            //Getting the length of the expansion
            if(class2Length == -1){
                class2Length = expContent.replace(/\\/g,"").length;
            }
            else{
                var counterLength = -1;
                counterLength = expContent.replace(/\\/g,"").length;
                if(counterLength != class2Length){
                    expControl.expansionError("Different expansion class lengths at comand in line " + (line+1) );
                    return null;
                }
            }

            //Rebuild the parameter
            param[i] = param[i].substring(0, cs+1) + expContent + param[i].substring(ce);
        }


        //Third expansion class
        flag = 0;
        //Checking for syntax errors, multiple parenthesis
        for(var c = 0; c < param[i].length; c++){
            if(param[i][c] == '{' && param[i][c-1] != '\\'){ //If there is a "{" not escaped...
                if(flag != 0){ //...and is not the first one
                    expControl.expansionError("To many expansion parenthesis in comand at line " + (line+1) );
                    return null;
                }
                flag++;
                cs = c;
            }
            else if(param[i][c] == '}' && param[i][c-1] != '\\'){ //If the is a "}" not escaped...
                if(flag != 1){ //...and is not the firs one
                    expControl.expansionError("To many expansion parenthesis in comand at line " + (line+1) );
                    return null;
                }
                flag++;
                ce = c;
            }

            if(flag > 2){
                expControl.expansionError("To many expansion parenthesis in comand at line " + (line+1) );
                return null;
            }
        }
        //Check length of class
        if(flag == 2){
            expContent = param[i].substring(cs+1,ce);
            subAlphabet = "";
            //Check for ".." expansion
            var ddi = -1; //double dot index
            var ddl = "°°".length; //Chrome add chars to this string, so length changes at runtime
            expContent = replaceIfNotEscaped(expContent,".","°");
            while(expContent.indexOf("°°") != -1) {
                if ((ddi = expContent.indexOf("°°")) != -1) {
                    //All those ifs are here to check for escaped chars and to take the actual char befor the ".."
                    if (!isEscapeable(expContent[ddi - 1]) || (isEscapeable(expContent[ddi - 1]) && expContent[ddi - 2] == '\\')) {
                        if (!isEscapeable(expContent[ddi + ddl])) {
                            subAlphabet = alphabet.substring(alphabet.indexOf(expContent[ddi - 1])+1, alphabet.indexOf(expContent[ddi + ddl]));
                        }
                        else if (isEscapeable(expContent[ddi + ddl+1]) && expContent[ddi + ddl] == '\\') {
                            subAlphabet = alphabet.substring(alphabet.indexOf(expContent[ddi - 1])+1, alphabet.indexOf(expContent[ddi + ddl + 1]));
                        }
                    }
                    else { //This else is execute if the char befor ".." should be escaped but wasn't
                        expControl.syntaxNotValid(line + 1, "Unescaped character");
                        return null;
                    }
                    //Rebuilding the expContent
                    expContent = expContent.replace("°°", subAlphabet);
                    subAlphabet = "";
                }
            }
            //Check for "^" expansion
            expContent = replaceIfNotEscaped(expContent,"^","°");
            if(expContent.indexOf("°") != -1){
                var tempNot = expContent.substring(expContent.indexOf("°")+1);
                tempNot = tempNot.replace(/\\/g,"");
                subAlphabet = getNotAlphabet(tempNot); //Returns all the chars in the alphabet excuded the one passed as parameters
                subAlphabet = reescape(subAlphabet);

                //Rebuilding the expContent
                expContent = expContent.substring(0,expContent.indexOf("°"))+subAlphabet;
            }


            //Getting the length of the expansion
            if(class3Length == -1){
                class3Length = expContent.replace(/\\/g,"").length;
            }
            else{
                var counterLength = -1;
                counterLength = expContent.replace(/\\/g,"").length;
                if(counterLength != class3Length){
                    expControl.expansionError("Different expansion class lengths at comand in line " + (line+1) );
                    return null;
                }
            }

            //Rebuild the parameter
            param[i] = param[i].substring(0, cs+1) + expContent + param[i].substring(ce);
        }

	}

	var refactoredComand = param[0] + "," + param[1] + "," + param[2] + "," + param[3] + "," + param[4];

	//Cascade expansion

	//First class expansion
	var containerArray = new Array();
	//Filling the containers with the class expansion infos
	for(var i=0; i<param.length; i++) {
		var container = new ExpansioClassContainer();

        for (var c = 0; c < param[i].length; c++) {

            if (param[i][c] == '(' && param[i][c - 1] != '\\') { //If there is a "(" not escaped...
                if (container.flag != 0) { //...and is not the first one
                    expControl.internalError("Expanding comand at line " + (line+1));
                    return null;
                }
                container.flag++;
                container.cs = c;
            }
            else if (param[i][c] == ')' && param[i][c - 1] != '\\') { //If the is a ")" not escaped...
                if (container.flag != 1) { //...and is not the firs one
                    expControl.internalError("Expanding comand at line " + (line+1));
                    return null;
                }
                container.flag++;
                container.ce = c;
            }

            if (container.flag > 2) {
                expControl.internalError("Expanding comand at line " + (line+1));
                return null;
            }
        }

        if(container.flag == 2) {
            container.expContent = param[i].substring(container.cs + 1, container.ce);
            container.toChange = param[i].substring(container.cs, container.ce + 1);
        }

        //Cleaning the expContent of all the "\" so that aren't used as values
		container.expContent = unescape(container.expContent);

        containerArray.push(container);
    }

	//Actual expansion, all the ni vars will make up the final comand
    for(var i=0; i<class1Length; i++){
		var n0,n1,n2,n3,n4;
		//Param 1
		if(containerArray[0].flag == 2){
			n0 = param[0].replace(containerArray[0].toChange, containerArray[0].expContent[i]);
		}
		else{
			n0 = param[0];
		}

        //Param 2
        if(containerArray[1].flag == 2){
            n1 = param[1].replace(containerArray[1].toChange, containerArray[1].expContent[i]);
        }
        else{
            n1 = param[1];
        }

        //Param 3
        if(containerArray[2].flag == 2){
            n2 = param[2].replace(containerArray[2].toChange, containerArray[2].expContent[i]);
        }
        else{
            n2 = param[2];
        }

        //Param 4
        if(containerArray[3].flag == 2){
            n3 = param[3].replace(containerArray[3].toChange, containerArray[3].expContent[i]);
        }
        else{
            n3 = param[3];
        }

        //Param 5
        if(containerArray[4].flag == 2){
            n4 = param[4].replace(containerArray[4].toChange, containerArray[4].expContent[i]);
        }
        else{
            n4 = param[4];
        }

        var nComand = comand.clone();
        n0 = reescape(n0);
        n1 = reescape(n1);
        n2 = reescape(n2);
        n3 = reescape(n3);
        n4 = reescape(n4);
        nComand.comand = n0+","+n1+","+n2+","+n3+","+n4;
        array.push(nComand);
	}


	//If there wasn't any expansion at all, add the comand as it is to the list
	if(class1Length == -1 && class2Length == -1 && class3Length == -1){
    	comand.comand = comand.original
		array.push(comand);
	}

	return array
}

//Function that return if char is a character that needs to be escaped
function isEscapeable(char){
	if(char == ','
	|| char == '(' || char == ')'
	|| char == '[' || char == ']'
	|| char == '{' || char == '}'){
		return true;
	}
	return false;
}

//Function that removes all "\" form str
function unescape(str){
	while(str.indexOf('\\') != -1){
		str = setCharAt(str,str.indexOf('\\'),"");
	}
	return str;
}

//Function that escapes all escapeable chars
function reescape(str){
	for(var i=0; i<str.length; i++){
		if(isEscapeable(str[i]) && str[i-1] != '\\'){
			str = str.substring(0,i) + "\\" + str.substring(i);
			i++;
		}
	}
	return str;
}

//Function that replace toRep in str with warRep, only if toRep isen't escaped in str
function replaceIfNotEscaped(str,toRep,watRep){
	for(var i=0; i<str.length; i++){
		if(str[i] == toRep && str[i-1] != '\\'){
            str = setCharAt(str,i,watRep);
            i = i +(watRep.length-1);
		}
	}
	return str;
}

//Returns all the chars in the alphabet excuded the one passed as parameters
function getNotAlphabet(chars){
	var newAlpha = "";
	for(var i=0; i<alphabet.length; i++){
		if(chars.indexOf(alphabet[i]) == -1){
			newAlpha += alphabet[i];
		}
	}
    if(chars.indexOf('_') == -1){
		newAlpha += "_";
    }
	return newAlpha;
}

//Function that return if char entierly is in the valid alphabet
function areValidChars(char){
    for(var i=0; i<char.length; i++){
        if(alphabet.indexOf(char[i]) == -1 && char[i] != '_' && char[i] != '\\'){
            return char[i];
        }
    }
    return true;
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
//Parameters will be clean, no chars to be escaped
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
			if(general.nastroValue[general.nastroIndex] == parameters[1].charAt(0) || ( general.nastroValue[general.nastroIndex] == undefined && parameters[1].charAt(0) == '_' )){
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
			if(general.nastroNegValue[(general.nastroIndex*-1)-1] == parameters[1].charAt(0) || ( general.nastroNegValue[(general.nastroIndex*-1)-1] == undefined && parameters[1].charAt(0) == '_' )){
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








































