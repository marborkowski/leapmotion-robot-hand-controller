/*global require, console, process */
(function () {

    'use strict';

    /**
     * Define empty 'lm' object.
     */
    var lm = {};

    /**
     * Load necessary npm modules.
     * @type {{cylon: Object, fs: Object, util: Object, serialport: Object}}
     */
    lm.modules = {
        cylon: require('cylon'),
        fs: require('fs'),
        util: require('util'),
        serialport: require('serialport')
    };

    lm.app = {

        /**
         * Various app states.
         */
        states: {
            isPalmOpen: true
        },

        /**
         * Init Cylon.js module
         * and define the all needed
         * devices and connections.
         */
        cylon: lm.modules.cylon.robot({
            connections: {
                leapmotion: {
                    adaptor: 'leapmotion'
                }
            },
            devices: {
                leapmotion: {
                    driver: 'leapmotion'
                }
            },
            work: function (my) {
                /**
                 * Handling 'hand' event
                 * from Leap Motion controller.
                 */
                my.leapmotion.on('hand', function (payload) {

                    var straightFingers = 0,
                        isPalmOpen;

                    /**
                     * Iterate the all fingers.
                     */
                    payload.fingers.forEach(function (finger) {
                        /**
                         * If finger is straight,
                         * we should increase the value
                         * of 'straightFinters' with 1.
                         */
                        if (finger.extended) {
                            /**
                             * Calculate straight fingers.
                             * @type {number}
                             */
                            straightFingers = straightFingers + 1;
                        }
                    });

                    /**
                     * Where the 'straightFingers' number
                     * is equal to or greater than 4,
                     * we should presume that the palm is open.
                     * @type {boolean}
                     */
                    isPalmOpen = straightFingers >= 4;

                    /**
                     * If the current state is different
                     * than previous one, update it
                     * and send the necessary data using serial port.
                     */
                    if (lm.app.states.isPalmOpen !== isPalmOpen) {
                        lm.app.states.isPalmOpen = isPalmOpen;
                        lm.app.serial.router.write(isPalmOpen.toString());
                        console.log('Palm is %s', isPalmOpen ? 'open' : 'closed');
                    }
                });
            }
        }),
        serial: {
            router: null,
            start: function (port) {
                /**
                 * Init the serial communication
                 * on port described with 'port' attribute.
                 * @type {*|SerialPort}
                 */
                lm.app.serial.router = new lm.modules.serialport.SerialPort(port, {
                    baudrate: 115200
                }, true);

                /**
                 * Monitor serial port states.
                 */
                lm.app.serial.router.on('open', function () {
                    console.log('SerialPort opened on %s', port);

                    /**
                     * Start Cylon library
                     * if the serial communication is established.
                     */
                    lm.app.cylon.start();
                });

                lm.app.serial.router.on('close', function () {
                    console.log('SerialPort closed.');
                });
            }
        },
        start: function () {

            /**
             * List the all available USB devices
             * and find the Arduino compatible board.
             */
            lm.modules.serialport.list(function (err, ports) {

                if (err) {
                    throw new Error(err.message);
                }

                /**
                 * Filter Arduino compatible devices.
                 */
                var arduino = ports.filter(function (port) {
                    return [/^arduino/i].test(port.manufacturer);
                });

                /**
                 * Behavior depends on the number of compatible devices.
                 */
                switch (arduino.length) {

                    // No Arduino compatible device...
                    case 0:
                        console.error('Plug in your Arduino board first!');
                        process.exit();
                        break;

                    // We found the one and only Arduino device...
                    case 1:
                        var board = arduino.pop();
                        console.log('Connecting to Arduino board %s on port %s', board.manufacturer, board.comName);
                        lm.app.serial.start(board.comName);
                        break;

                    // Otherwise...
                    default:
                        console.error('There is more than one Arduino board plugged into your computer. Please reduce it to ONE!');
                        process.exit();
                }

            });


        }
    };

    lm.app.start();

    /**
     * Kill app on CTRL+C
     */
    process.on('SIGINT', function () {
        console.log('Bye!');
        lm.app.serial.router.close();
        process.exit();
    });
}());