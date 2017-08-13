# TuringMachineSimulator

This is a simple Turing Machine simulator made in javascript.<br/>
I've started this project to learn javascript (and also a little of html/css.<br/>
All suggestions about writing better code or any javascript conventions that i didn't follow are welcome.<br/>
I've got inspired by Professor Antonio Cisternino's simulator (http://mdt.di.unipi.it/TMSimulatore/TMSimulator-1.2.zip).<br/>

## Programming the machine

The machine is programed with a set of rules.
Each rule is composed of five parts
```
Current state, char read, next state, char to write, movement(<,>,-)
```
Current state is the state the machine is in, shown by the text right above the tape. It starts at 0. <br/>
Char read is the character read in the current cell on the tape. The current cell is the one in green.<br/> 
Next state is the state the machine have to transition to after executing this rule.<br/>
Char to write is the character that will replace the one currently present on the tape.<br/>
Movement is where the tape has to move, ">" will move the tape to the right by one cell, 
"<" will move it to the left, "-" means no movement.<br/>

You can input a starting value to the tape with the input bar underneath the tape, otherwise it's considered empty.<br/>
The machine will stop executing when there isn't a rule that applies to the current state and current char on the tape.<br/>

## Syntax and conventions

- Use "_" to read and write empty cells
- Use "//" for writing comments
- Use "\\" to escape characters
- Each rule has to be on its line
- The machine is case sensitive

## Compact rules

Is possible to write multiple rules in one with the compact rule notation.<br/>
It consist in specifying a sequence of characters inside parenthesis in the 5 parameters instead of one.<br/>
There are 3 types of usable brakets, "(, [, {". Each one of them makes up a class of expansion.<br/>
Each class of expansion has to have the same length for the entier rule, in whichever parameter of the rule is used, because the same class of expansion is expanded synchronously.<br/>
Insted different classes of expansion will be expanded asynchronously.<br/>
<br/>
For Example<br/>
```
state,(abc),state(ABC),[01],>
```
Will be expanded in<br/>
```
state,a,stateA,0,>
state,a,stateA,1,>
state,b,stateB,0,>
state,b,stateB,1,>
state,c,stateC,0,>
state,c,stateC,1,>
```
There are three ways of writing an expansion class<br/>
- By specifying each character you need (As in the previous example)
- By using 2 dots ".." in between to character (Not available for param #5)
- By using the negation character "^" (Not available for param #5)

The first way is explained in the previous example.<br/>
The second and the third way use the alphabet used by the machine.<br/>
Alphabet: !\"#$%&\'()*+,-./:;<=>?@0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz[]^-{|} (Space included, is a usable character).<br/>
So, if the class is defined this way: "a..f", will be considered as: "abcdef", and expanded consequently.<br/>
And if is defined this way: "^abc", will be considered as the entier alphabet but "a,b,c".<br/>
<br/>
For Example<br/>

```
state,(a..c),state(ABC),[01],>
```

Will be expanded in<br/>

```
state,a,stateA,0,>
state,a,stateA,1,>
state,b,stateB,0,>
state,b,stateB,1,>
state,c,stateC,0,>
state,c,stateC,1,>
```
And<br/>
```
state,(^a),state,[01],>
```
Will be expanded in<br/>
```
state,!,state,0,>
state,!,state,1,>
state,",state,0,>
state,",state,1,>
state,#,state,0,>
state,#,state,1,>
...following the alphabet
```
Excluding

```
state,a,state,0,>
state,a,state,1,>
```

<br/>
Another very useful feature is the possibility tu use multiple classes in the same parameter

```
state(ABC)[01],a,state,0,>
```

Will be expanded in

```
stateA0,a,state,0,>
stateA1,a,state,0,>
stateB0,a,state,0,>
stateB1,a,state,0,>
stateC0,a,state,0,>
stateC1,a,state,0,>
```

<br/>
Other kinds of combinations are:

```
state(^A..d)[01],a,state,0,>
```

That will use all the alphabet but the characters from capitol A, to d
<br/>
Have fun experimenting with the power of compact notation. Some examples will be provided in the Preset programs folder.<br/>


## Options and extra features

- Expand/Recompact compacted rules
- Load programs from the preset folder
- Load programs from external file
- Save current program to file

## Known bugs & issues

- IE doesn't support starsWith, nor css variables

## Infos

I've developed this simulator on chrome, tested on chrome, firefox, opera(neon) and edge on windows, safari on macOS. Chrome shows the best performance.<br/>
I've also tested it on Internet Explorer 11, but i haven't put a lot of effort into making it compatible and retrocompatible with IE.


