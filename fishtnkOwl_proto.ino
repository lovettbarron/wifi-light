const int input1 = 8; // GPIO 3
const int input2 = 9; // GPIO 5
const int led = 2; // LED out
const int test = 13; // Testing "alive" light

const long intervals = 1000; // one second
int timer = 0;

String inputString = "";    
bool stringComplete = false;

bool lightState = false;
long counter = millis();

void setup() {
  pinMode(led, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  serialDone();
  lightLoop();
}

void light(bool state,long _timer) {
  counter = millis();
  timer = _timer;
  lightState = state;
}

void lightLoop() {
 int time = millis() - counter;
   if(millis() - counter > timer ) {

     int val;
     if(lightState) val = map(time, 1000, 0, 0, 255);
     else val = map(time, 1000, 0, 255, 0);
     analogWrite(led, val);

   }  else {

     if(lightState) analogWrite(led, 255);
     else analogWrite(led, 0); 

   }
}



void serialDone() {
  if (stringComplete) {
    Serial.println(inputString);
    
    switch(inputString[0]) {
     case 't': 
       if(lightState)
         light(true, 1000); break;
     case 'l':
       if(!lightState)

     default:
        break;
    }
    inputString = "";
    stringComplete = false;
  }
}

void serialEvent() {
  while (Serial.available()) {
    char inChar = (char)Serial.read(); 
    inputString += inChar;
    
    switch(inChar) {
     case 't': 
       light(true, 1000); break;
     case 'l':
       light(false, 1000); break;
     default:
        break;
    }
    if (inChar == 'n') {
      stringComplete = true;
    } 
  }
}
