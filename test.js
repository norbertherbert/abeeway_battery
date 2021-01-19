const { calculate_battery_life_time } = require('./abeeway_battery.js');

let input = {

    product: 'micro',                       // industrial|compact|micro|smart_badge
    tx_power: '_14dBm_',                    // _14dBm_|_17dBm_|_19dBm
    sf: 10,                                 // 7|8|9|10|11|12
    accelerometer_on: true,
    // TODO: transmission strategy and packet repetition NOT IMPLEMENTED!!!

    custom: {
        nof_msg_per_day: 0,
        payl_len: 17,                       // [bytes]
    },
    heartbeat: {
        nof_msg_per_day: 24,
    },
    tdoa: {
        nof_msg_per_day: 24,
        nof_msg_repetition: 4,
    },
    gps: {
        nof_msg_per_day: 24,
        ttff: 49,                           // [s]
        conv_time: 90,                      // [s]
    },
    agps: {
        nof_msg_per_day: 24,
        on_time: 8,                         // [s]
        nof_satellites: 5, 
        // TODO: nof_satellites NOT IMPLEMENTED!!!
    },
    wifi: {
        nof_msg_per_day: 24,
        nof_bssid: 4, 
        // TODO: nof_bssid NOT IMPLEMENTED!!!
    },
    ble: {
        nof_msg_per_day: 24,
        nof_bssid: 4, 
        // TODO: nof_bssid NOT IMPLEMENTED!!!
        operation: 'fast_scan',             // fast_scan|slow_scan 
    },
    advanced_ble: {
        usage_time_per_day: 0,
        operation: 'fast_adv',              // fast_adv|slow_adv|connected|fast_scan|slow_scan

        // fast_scan_usage_time_per_day: 0,
        // slow_scan_usage_time_per_day: 0,     
        // fast_adv_usage_time_per_day:  0,
        // slow_adv_usage_time_per_day:  0,
        // connected_usage_time_per_day: 0,

    }
};

console.log(
    'Estimated Battery Life Time:',
    calculate_battery_life_time(input).toFixed(2),
    'days'
);
