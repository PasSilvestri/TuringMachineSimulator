# TuringMachineSimulator

This is a simple Turing Machine simulator made in javascript.<br/>
I've started this project to learn javascript (and also a little of html/css.<br/>
All suggestions about writing better code or any javascript conventions that i didn't follow are welcome.<br/>

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
Movement is the where the tape has to move, ">" will move the tape to the right by one cell, 
"<" will move it to the left, "-" means no movement.<br/>

You can input a starting value to the tape with the input bar underneath the tape, otherwise it's considered empty.<br/>
The machine will stop executing when there isn't a rule that applies to the current state and current char on the tape.<br/>

## Syntax and conventions

- Use "_" to read and write empty cells
- Use "//" for writing comments
- Each rule has to be on its line
- The machine is case sensitive

## Todo

- Add possibilty to save and load programs
- Add compact notation to write multiple rules in one

## Known bugs

- javascript function startsWith doesen't work on IE11 and below


