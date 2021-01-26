const { calculate_battery_life_time } = require('./abeeway_battery.js');

let input = {

    product: 'micro',                       // industrial|compact|micro|smart_badge
    tx_power: '_14dBm_',                    // _14dBm_|_17dBm_|_19dBm
    sf: 10,                                 // 7|8|9|10|11|12
    nof_msg_repetition: 2,
    accelerometer_on: true,

    custom_msg: {
        nof_msg_per_day: 0,
        payl_len: 17,                       // [bytes]
    },
    heartbeat: {
        nof_msg_per_day: 24,
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
    },
    wifi: {
        nof_msg_per_day: 24,
        nof_bssid: 4, 
    },
    ble: {
        nof_msg_per_day: 24,
        nof_beaconid: 4, 
    },
    custom_ble: {
        usage_time_per_day: 0,
        operation: 'fast_adv',              // fast_adv|slow_adv|connected|fast_scan|slow_scan
    },

    // The following parameters will be implemented soon!!!
    proximity: {
        usage_time_per_day: 0,
        alarms_per_day:     10,
        warnings_per_day:   20,
    }

};

let result = calculate_battery_life_time(input);
// console.log( JSON.stringify(result, null, 2));

let result_text = "Battery life time: " + result.battery_life_time + " days\n";
result_text += "Energy distribution:\n";
if (result.current_distribution.custom_msg > 0) { 
    result_text += "  Custom msg: " + result.current_distribution.custom_msg + " %\n"; 
}
if (result.current_distribution.heartbeat > 0) { 
    result_text += "  Heartbeat: " + result.current_distribution.heartbeat + " %\n"; 
}
if (result.current_distribution.gps > 0) { 
    result_text += "  GPS: " + result.current_distribution.gps + " %\n"; 
}
if (result.current_distribution.agps > 0) { 
    result_text += "  AGPS: " + result.current_distribution.agps + " %\n"; 
}
if (result.current_distribution.wifi > 0) { 
    result_text += "  WiFi: " + result.current_distribution.wifi + " %\n"; 
}
if (result.current_distribution.ble > 0) { 
    result_text += "  BLE: " + result.current_distribution.ble + " %\n"; 
}
if (result.current_distribution.custom_ble > 0) { 
    result_text += "  Custom BLE: " + result.current_distribution.custom_ble + " %\n"; 
}
if (result.current_distribution.accelerometer > 0) { 
    result_text += "  Accelerometer: " + result.current_distribution.accelerometer + " %\n"; 
}
if (result.current_distribution.quiesent_and_battery_leakage > 0) { 
    result_text += "  Quiesent and Battery leakage: " + result.current_distribution.quiesent_and_battery_leakage + " %\n"; 
}

console.log(result_text);
