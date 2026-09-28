#include <Adafruit_LiquidCrystal.h>

// Initialize the screen matching your exact PCF8574 address parameter (32 / 0x20)
Adafruit_LiquidCrystal lcd(0);

// Hardware Pin Configuration
const int PIN_PIR       = 2;   // Green Wire -> PIR Signal
const int PIN_VIBRATION = 3;   // Purple Wire -> SW-200D Tilt Sensor Signal
const int PIN_DOOR      = 4;   // Blue Wire -> Slide Switch Signal
const int PIN_BUZZER    = 7;   // Red Wire -> Piezo Positive Terminal
const int PIN_RELAY     = 8;   // Green Wire -> Driver Relay Input
const int PIN_LED_GREEN = 11;  // Dark Green Wire -> Safe Status LED
const int PIN_LED_RED   = 12;  // Light Green Wire -> Alarm Alert LED

// Precise Timing Registers for Smooth Non-Blocking Interactivity
unsigned long currentMillis  = 0;
unsigned long previousBlink  = 0;
unsigned long previousUpdate = 0;

int statusState = LOW; // Tracks flashing status parameters

void setup() {
  pinMode(PIN_PIR, INPUT);
  pinMode(PIN_VIBRATION, INPUT);
  pinMode(PIN_DOOR, INPUT);
  
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_RELAY, OUTPUT);
  pinMode(PIN_LED_GREEN, OUTPUT);
  pinMode(PIN_LED_RED, OUTPUT);
  
  Serial.begin(9600); // Launches the background stream tracking log
  
  // Clear layout buffer registers and start display backlight matrix
  lcd.begin(16, 2);
  lcd.setBacklight(1);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("GUARD-BOX INITIAL");
  lcd.setCursor(0, 1);
  lcd.print("SYSTEM: READY...");
  delay(1000); 
  lcd.clear();
}

void loop() {
  currentMillis = millis(); // Track runtime clock ticks
  
  // Read active logic outputs from our input sensor grid
  int motionEvent    = digitalRead(PIN_PIR);
  int vibrationEvent = digitalRead(PIN_VIBRATION);
  int doorOpenEvent  = digitalRead(PIN_DOOR);

  // --- STATE 1: CRITICAL SECURITY BREACH (Motion or Door Slide Active) ---
  if (motionEvent == HIGH || doorOpenEvent == HIGH) {
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_RED, HIGH);
    digitalWrite(PIN_RELAY, LOW); // Cut drive voltage supply to isolated load motor
    
    // Pulse the alarm at a sharp 2000Hz alert wave frequency
    tone(PIN_BUZZER, 2000); 
    
    if (currentMillis - previousUpdate >= 300) {
      previousUpdate = currentMillis;
      lcd.setCursor(0, 0);
      lcd.print("!! INTRUSION !! ");
      lcd.setCursor(0, 1);
      lcd.print("LOAD DISCONNECTED");
    }
  } 
  // --- STATE 2: SUSPICIOUS ACTIVITY TRACKED (Tilt Sensor Activated) ---
  else if (vibrationEvent == HIGH) {
    digitalWrite(PIN_LED_GREEN, LOW);
    digitalWrite(PIN_LED_RED, HIGH);
    digitalWrite(PIN_RELAY, HIGH); 
    
    // Drive lower structural alert pitch frequency pulse pattern
    tone(PIN_BUZZER, 850); 
    
    if (currentMillis - previousUpdate >= 300) {
      previousUpdate = currentMillis;
      lcd.setCursor(0, 0);
      lcd.print("SUSPICIOUS DETCT");
      lcd.setCursor(0, 1);
      lcd.print("CHASSIS TAMPER  ");
    }
  } 
  // --- STATE 3: ALL SECURE NORMAL BASELINE STATE ---
  else {
    digitalWrite(PIN_LED_RED, LOW);
    digitalWrite(PIN_RELAY, HIGH); // Re-engage continuity paths so motor spins normal
    noTone(PIN_BUZZER);            // Force silence alert frequency sound wave loops
    
    // Run the non-blocking pulsing timer routine for the Green LED
    if (currentMillis - previousBlink >= 400) {
      previousBlink = currentMillis;
      statusState = !statusState; // Invert status flag variable
      digitalWrite(PIN_LED_GREEN, statusState);
    }
    
    if (currentMillis - previousUpdate >= 500) {
      previousUpdate = currentMillis;
      lcd.setCursor(0, 0);
      lcd.print("SECURITY SYSTEM ");
      lcd.setCursor(0, 1);
      lcd.print("STATUS: ACTIVE  ");
    }
  }
}
