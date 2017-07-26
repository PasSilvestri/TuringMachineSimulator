function Benchmark(){

    this.startTime = 0;
    this.stopTime = 0;
    this.totalTime = 0;
    this.loopObj;
    this.targetObj;

    this.getTime = function(){
        return window.performance.now();
    }

    this.start = function(){
        this.loopObj = new Array();
        this.targetObj = new Array();
        this.startTime = this.getTime();
        console.log("Benchmark started");
    };

    this.lap = function(name){
        if(this.loopObj[name] == undefined){
            this.loopObj[name] = new BenchmarkLoop();
            this.loopObj[name].add(this.getTime());
            return;
        }
        this.loopObj[name].add(this.getTime());
    };

    this.functionBegin = function(name){
        if(this.targetObj[name] == undefined){
            this.targetObj[name] = new BenchmarkTarget();
            this.targetObj[name].begin(this.getTime());
            return;
        }
        this.targetObj[name].begin(this.getTime());
    };

    this.functionEnd = function(name){
        this.targetObj[name].end(this.getTime());
    };

    this.stop = function(){
        this.stopTime = this.getTime();
        this.totalTime = this.stopTime - this.startTime;
        console.log("Benchmark finished");
    };

}

function BenchmarkLoop(){

    this.laps = new Array();

    this.average = function() {
        var res = 0;
        var i;
        for(i=0; i<this.laps.length; i++){
            res += this.laps[i];
        }
        res = res/i;
        return res;
    };

    this.add = function (time) {
        if(this.lastTime == undefined){
            this.lastTime = time;
            return;
        }
        this.laps.push(time-this.lastTime);
        this.lastTime = time;
    };
}

function BenchmarkTarget(){

    this.laps = new Array();

    this.average = function() {
        var res = 0;
        var i;
        for(i=0; i<this.laps.length; i++){
            res += this.laps[i];
        }
        res = res/i;
        return res;
    };

    this.begin = function (time) {
        this.startTime = time;
    };

    this.end = function(time){
        this.laps.push(time-this.startTime);
    }
}


/*
clear();
var nastroIndex = -45;
var index = 0;
benchmark.start();
for(var i=0; i<5000; i++){
    benchmark.functionBegin("test1");

    console.log("loop");
    console.log((nastroIndex*-1)-1);
    console.log((nastroIndex*-1)-1);
    console.log((nastroIndex*-1)-1);
    console.log((nastroIndex*-1)-1);

    benchmark.functionEnd("test1");

    benchmark.functionBegin("test2");

    index = (nastroIndex*-1)-1;
    console.log("loop");
    console.log(index);
    console.log(index);
    console.log(index);
    console.log(index);

    benchmark.functionEnd("test2");
}
benchmark.stop();

console.log("Test 1: " + benchmark.targetObj["test1"].average() + "ms");
console.log("Test 2: " + benchmark.targetObj["test2"].average() + "ms");
console.log("Differenza (test1 - test2): " + (benchmark.targetObj["test1"].average() - benchmark.targetObj["test2"].average()));
*/