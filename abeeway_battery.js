/*********************************************************************/
/***** BATTERY LIFE CALCULATION SCRIPTS                          *****/
/*********************************************************************/


/* GLOBAL CONSTANTS */

const SPREADING_FACTORS = [7, 8, 9, 10, 11, 12]

const BATTERY_TYPES = {
    primary:      { 
        descr: 'Primary (LTC)',        
        leakage_per_month: 0.003,            // =0.3%
        practical_capacity_multiplier: 0.80  // =80%
    },                
    rechargeable: { 
        descr: 'Rechargeable (Li-Po)',
        leakage_per_month: 0.05,             // =5%
        practical_capacity_multiplier: 0.90  // =90%
    },
};

const PRODUCTS = {
    industrial: {
        descr: 'Industrial Tracker',
        battery: {
            nominal_capacity: 19000,                                                         // [mAh]
            practical_capacity: 19000 * BATTERY_TYPES.primary.practical_capacity_multiplier, // [mAh]
            leakage_per_month: BATTERY_TYPES.primary.leakage_per_month,                      // ratio
        }
    }, 
    compact: {
        descr: 'Compact Tracker',
        battery: {
            nominal_capacity: 8000,                                                          // [mAh]
            practical_capacity: 8000 * BATTERY_TYPES.primary.practical_capacity_multiplier,  // [mAh]
            leakage_per_month: BATTERY_TYPES.primary.leakage_per_month,                      // ratio
        }
    },
    micro: {
        descr: 'Microtracker',
        battery: {
            nominal_capacity: 450,                                                              // [mAh]
            practical_capacity: 450 * BATTERY_TYPES.rechargeable.practical_capacity_multiplier, // [mAh]
            leakage_per_month: BATTERY_TYPES.rechargeable.leakage_per_month,                    // ratio
        }
    },
    smart_badge: {
        descr: 'Smart Badge',
        battery: {
            nominal_capacity: 1300,                                                              // [mAh]
            practical_capacity: 1300 * BATTERY_TYPES.rechargeable.practical_capacity_multiplier, // [mAh]
            leakage_per_month: BATTERY_TYPES.rechargeable.leakage_per_month,                     // ratio
        }
    },
}

const BLE_OPERATIONS = {
    fast_adv:  { descr: 'Fast advertisement (2s)',  time: 2,  current: 10  },   // [s], [mA]
    slow_adv:  { descr: 'Slow advertisement (10s)', time: 10, current: 3.5 },   // [s], [mA]
    connected: { descr: 'Connected (2s)',           time: 2,  current: 3.6 },   // [s], [mA]
    fast_scan: { descr: 'Fast BLE scan (8sec)',     time: 8,  current: 2   },   // [s], [mA]
    slow_scan: { descr: 'Slow BLE scan (30sec)',    time: 30, current: 0.5 },   // [s], [mA]
};

const TX_POWERS = { 
    _14dBm_: { descr: '14 dBm', current: 45 },      // SX1262 TX [mA] 
    _17dBm_: { descr: '17 dBm', current: 75 },      // SX1262 TX [mA]
    _19dBm_: { descr: '19 dBm', current: 85 },      // SX1262 TX [mA]
}

const SUPPLY_VOLTAGE        = 3.6;     // Supply voltage [V]
const MCU_CURRENT           = 0.3;     // Current MCU in active mode [mA]
const RX_CURRENT            = 10;      // Current SX1262 RX [mA]
const GPS_CURRENT           = 22;      // Current GPS [mA]
const GPS_STANDBY_CURRENT   = 0.05;    // Current GPS Stand-by [mA]
const WIFI_CURRENT          = 60;      // Current WiFi [mA]
const WIFI_ON_TIME          = 3;       // WIFI ON time [s]
const BLE_CURRENT           = 10;      // Current BLT [mA]
const BLE_ON_TIME           = 3;       // WIFI ON time [s]

// The following parameters will be implemented soon !!!
const PROXIMITY_DET_CURRENT = 10;      // [mA]   // TODO: TO BE DEFINED BY STEPHANE!!!
const BUZZER_CURRENT        = 100;     // [mA]   // TODO: TO BE DEFINED BY STEPHANE!!!
const BUZZER_TIME           = 0.5;     // [s]    // TODO: TO BE DEFINED BY STEPHANE!!!

const ACCELEROMETER_CURRENT = 0.0065;  // Accelerometer [mA] (=6.5 uA)
const QUIESENT_CURRENT      = 0.0010;  // [mA] (=10 uA)

const HEARTBEAT_PAYL_LEN             = 6;      // [bytes]
const GPS_PAYL_LEN                   = 16;     // [bytes]
const AGPS_MIN_PAYL_LEN              = 6;      // [bytes]
const AGPS_ADDITIONAL_SAT_PAYL_LEN   = 5;      // [bytes]
const WIFI_MIN_PAYL_LEN              = 6;      // [bytes]
const WIFI_ADDITIONAL_BSSID_PAYL_LEN = 7;      // [bytes]
const BLE_MIN_PAYL_LEN               = 6;      // [bytes]
const BLE_ADDITIONAL_BSSID_PAYL_LEN  = 7;      // [bytes]


/* CALCULATION FUNCTIONS */

function calculate_lora_current(sf, tx_power, payl_len, nof_msg_per_day) {

    const SYMBOL_TIME = (2**sf)/125;            // [ms]
    const PREAMBLE_TIME = 12.25 * SYMBOL_TIME;  // [ms]

    let time_on_air;                            // [ms]
    if (sf >= 11) {
        time_on_air = SYMBOL_TIME*(8+Math.ceil(((payl_len+12)*8-4*(sf-7)+16)/(4*sf-8))*5);
    } else {
        time_on_air = SYMBOL_TIME*(8+Math.ceil(((payl_len+12)*8-4*(sf-7)+16)/(4*sf-0))*5);
    }
    const total_time_on_air = time_on_air + PREAMBLE_TIME;

    // all following energy values are in [mJ]
    const tx_energy = total_time_on_air * SUPPLY_VOLTAGE * TX_POWERS[tx_power].current / 1000;
    const rx_energy = 2 * 8*SYMBOL_TIME * SUPPLY_VOLTAGE * RX_CURRENT / 1000;             // 2 RX windows are open after every tx
    const mcu_energy = (total_time_on_air + 2000) * SUPPLY_VOLTAGE * MCU_CURRENT / 1000;  // The MCU cannot sleep until the 2 RX windows are opened
    const total_energy_per_transmission = tx_energy + rx_energy + mcu_energy;

    const average_current = (total_energy_per_transmission / SUPPLY_VOLTAGE) * ( nof_msg_per_day / (24*3600))    // [mA]

    return average_current  // in [mA]

}

function calculate_gps_current(gps_ttff, gps_conv_time, nof_msg_per_day) {

    const gps_usage_time_of_cold_start = Math.min(gps_ttff + gps_conv_time, 300);

    const average_current_with_cold_starts_only = gps_usage_time_of_cold_start * GPS_CURRENT * nof_msg_per_day / (24 *3600);

    const average_current_with_hot_starts = (                                  // we assume that there is only one cold start per day 
        gps_usage_time_of_cold_start * GPS_CURRENT +                         // 1st time there is a cold start
        (nof_msg_per_day - 1) * gps_conv_time * GPS_CURRENT +                // all the rest of the gps updates are with hot start
        (24 * 3600 - gps_conv_time * nof_msg_per_day) * GPS_STANDBY_CURRENT  // the gps board is in standby status in between
    ) / (24 * 3600)

    const  average_current = Math.min(average_current_with_cold_starts_only, average_current_with_hot_starts);    // [mA]

    return average_current;    // in [mA]

}

function calculate_agps_current(agps_on_time, nof_msg_per_day) {
    const average_current = agps_on_time * GPS_CURRENT * nof_msg_per_day / (24*3600);    // [mA]
    return average_current;    // in [mA]
}

function calculate_wifi_current(nof_msg_per_day) {
    const average_current = WIFI_ON_TIME * WIFI_CURRENT * nof_msg_per_day / (24*3600);    // [mA]
    return average_current;    // in [mA]
}

function calculate_ble_current(nof_msg_per_day) {
    const average_current = BLE_ON_TIME * BLE_CURRENT * nof_msg_per_day / (24*3600);    // [mA]
    return average_current;    // in [mA]
}

function calculate_custom_ble_usage_current(operation, usage_time_per_day) {
    const average_current = BLE_OPERATIONS[operation].current * usage_time_per_day / ( 24 );    // [mA]
    return average_current;    // [mA]
}
function calculate_accelerometer_current(accelerometer_on) {
    if (accelerometer_on) { 
        return ACCELEROMETER_CURRENT; 
    } else { 
        return 0; 
    }
}
function calculate_battery_leakage_current(product) {
    const battery_capacity = PRODUCTS[product].battery.nominal_capacity;                     // [mAh]
    const battery_leakage_per_month = PRODUCTS[product].battery.leakage_per_month;           // ratio
    const average_current = (battery_capacity / 2) * ( battery_leakage_per_month /(30*24) )  // [mA]
    return average_current    // [mA]
}

function calculate_battery_life_time(input) {

    const custom_msg_lora_current  = input.nof_msg_repetition * calculate_lora_current(input.sf, input.tx_power, input.custom_msg.payl_len, input.custom_msg.nof_msg_per_day);
    const heartbeat_lora_current   = input.nof_msg_repetition * calculate_lora_current(input.sf, input.tx_power, HEARTBEAT_PAYL_LEN, input.heartbeat.nof_msg_per_day);
    const gps_lora_current         = input.nof_msg_repetition * calculate_lora_current(input.sf, input.tx_power, GPS_PAYL_LEN, input.gps.nof_msg_per_day);
    const agps_lora_current        = input.nof_msg_repetition * calculate_lora_current(
        input.sf, input.tx_power, 
        AGPS_MIN_PAYL_LEN + (input.agps.nof_satellites * AGPS_ADDITIONAL_SAT_PAYL_LEN),
        input.agps.nof_msg_per_day
    );
    const wifi_lora_current        = input.nof_msg_repetition * calculate_lora_current(
        input.sf, input.tx_power, 
        WIFI_MIN_PAYL_LEN + (input.wifi.nof_bssid * WIFI_ADDITIONAL_BSSID_PAYL_LEN), 
        input.wifi.nof_msg_per_day
    );
    const ble_lora_current         = input.nof_msg_repetition * calculate_lora_current(
        input.sf, input.tx_power, 
        BLE_MIN_PAYL_LEN + (input.ble.nof_beaconid * BLE_ADDITIONAL_BSSID_PAYL_LEN), 
        input.ble.nof_msg_per_day
    );

    const gps_geoloc_current       = calculate_gps_current(input.gps.ttff, input.gps.conv_time, input.gps.nof_msg_per_day);
    const agps_geoloc_current      = calculate_agps_current(input.agps.on_time, input.agps.nof_msg_per_day);
    const wifi_geoloc_current      = calculate_wifi_current(input.wifi.nof_msg_per_day);
    const ble_geoloc_current       = calculate_ble_current(input.ble.nof_msg_per_day);

    const custom_ble_usage_current = calculate_custom_ble_usage_current(input.custom_ble.operation, input.custom_ble.usage_time_per_day);

    const accelerometer_current    = calculate_accelerometer_current(input.accelerometer_on); 
 
    const average_battery_leakage  = calculate_battery_leakage_current(input.product);

 
    const total_lora_current = custom_msg_lora_current + heartbeat_lora_current + gps_lora_current + agps_lora_current + wifi_lora_current + ble_lora_current;
    const total_fix_current = QUIESENT_CURRENT + average_battery_leakage;

    const total_current = ( 
        total_lora_current +
        ble_geoloc_current + gps_geoloc_current + agps_geoloc_current + wifi_geoloc_current + 
        custom_ble_usage_current + 
        accelerometer_current +
        total_fix_current
    );    // [mA]

    const battery_life_time = Math.round( 
        10 * (PRODUCTS[input.product].battery.practical_capacity / total_current ) / 24
    ) / 10  // [day]

    const current_distribution = {
        custom_msg: Math.round( 1000 * custom_msg_lora_current / total_current ) / 10,
        heartbeat: Math.round( 1000 * heartbeat_lora_current / total_current ) / 10,
        gps: Math.round( 1000 * (gps_lora_current + gps_geoloc_current) / total_current ) / 10,
        agps: Math.round( 1000 * (agps_lora_current + agps_geoloc_current) / total_current ) / 10,
        wifi: Math.round( 1000 * (wifi_lora_current + wifi_geoloc_current) / total_current ) / 10,
        ble: Math.round( 1000 * (ble_lora_current + ble_geoloc_current) / total_current ) / 10,
        custom_ble: Math.round( 1000 * custom_ble_usage_current / total_current ) / 10,
        accelerometer: Math.round( 1000 * accelerometer_current / total_current ) / 10,
        quiesent_and_battery_leakage: Math.round( 1000 * total_fix_current / total_current ) / 10,
    }

    let result = {
        battery_life_time: battery_life_time,
        current_distribution: current_distribution,
    }

    return result;
    // return JSON.stringify(result, null, 2);
};

module.exports = {
    calculate_battery_life_time: calculate_battery_life_time
};
