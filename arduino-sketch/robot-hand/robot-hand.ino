/**
  by Marcin Borkowski <marborkowski@gmail.com>
**/  
#include <Servo.h>

// Create servo object to control a servo mechanism
Servo palm;

const int pin = 9;
const long baudrate = 115200;

String receivedData;

void setup() {
  Serial.begin(baudrate); 
  palm.attach(pin);
  palm.write(180);
}

void loop() {
  while(Serial.available()) {
    receivedData = Serial.readStringUntil(',');  
    // if palm is open, set the servo angle to 0
    // otherwise, set it to 180 (maximum value)
    if(receivedData == "true") {
      palm.write(180);
    } else {
      palm.write(50);
    }
    
    receivedData = "";
  }
}
