/**
  by Marcin Borkowski <marborkowski@gmail.com>
**/  
#include <Servo.h>

// Create servo object to control a servo mechanism
Servo palm;

const int pin = 9;
const int baudrate = 115200;

String receivedData;

void setup() {
  Serial.begin(baudrate); 
  palm.attach(pin);
}

void loop() {
  while(Serial.available()) {
    receivedData = Serial.readString();  
    
    // if palm is open, set the servo angle to 0
    // otherwise, set it to 180 (maximum value)
    if(receivedData == "true") {
      palm.write(0);
    } else {
      palm.write(180);
    }
    
    receivedData = "";
  }
}
